import ast
import base64
import hashlib
import json
import os
import pwd
from pathlib import Path
import subprocess
import tempfile

UUID = 'aurea-login-layout@local'
EXTENSION = Path('usr/share/gnome-shell/extensions') / UUID
CONFIG = Path('etc/dconf/db/gdm.d/90-aurea-login')
LOCKS = Path('etc/dconf/db/gdm.d/locks/90-aurea-login')
MANIFEST = Path('var/lib/aurea-27/gdm/layout.json')


def checksum(data):
    return hashlib.sha256(data).hexdigest()


def greeter_setting(key):
    account = pwd.getpwnam('gdm')
    with tempfile.TemporaryDirectory(prefix='aurea-gdm-read-') as runtime:
        os.chown(runtime, account.pw_uid, account.pw_gid)
        output = subprocess.check_output(['runuser', '-u', 'gdm', '--', 'env',
            '-u', 'DBUS_SESSION_BUS_ADDRESS', '-u', 'GSETTINGS_BACKEND', '-u', 'XDG_CONFIG_HOME',
            '-u', 'XDG_DATA_HOME', f'HOME={account.pw_dir}', f'XDG_RUNTIME_DIR={runtime}',
            'DCONF_PROFILE=gdm', 'gsettings', 'get', 'org.gnome.shell', key], text=True).strip()
    if output.startswith('@as '):
        output = output[4:]
    values = ast.literal_eval(output)
    if not isinstance(values, list) or not all(isinstance(item, str) for item in values):
        raise RuntimeError('Lista de extensiones GDM no válida.')
    return values


class LayoutInstall:
    def __init__(self, source, atomic_write, root=Path('/'), update=None, read_setting=greeter_setting):
        self.source = source
        self.root = root
        self.write = atomic_write
        self.update = update or self._update
        self.read_setting = read_setting

    def path(self, relative):
        path = self.root / relative
        if path.is_symlink() or any(parent.is_symlink() for parent in path.parents):
            raise RuntimeError(f'No se modifican rutas enlazadas: {relative}')
        return path

    def _update(self):
        subprocess.run(['restorecon', '-R', str(self.path(EXTENSION)), str(self.path(CONFIG.parent)), str(self.path(MANIFEST.parent))], check=True)
        subprocess.run(['dconf', 'update'], check=True)
        if self.path(CONFIG).exists():
            if UUID not in self.read_setting('enabled-extensions') or UUID in self.read_setting('disabled-extensions'):
                raise RuntimeError('GDM no reconoce la activación; se restaurará la configuración anterior.')

    def _read(self, relative):
        path = self.path(relative)
        return path.read_bytes() if path.exists() else None

    def _set(self, relative, data):
        path = self.path(relative)
        if data is None:
            path.unlink(missing_ok=True)
        else:
            path.parent.mkdir(parents=True, exist_ok=True, mode=0o755)
            self.write(path, data)

    def _state(self):
        data = self._read(MANIFEST)
        return json.loads(data) if data else {}

    def _validate(self, state):
        allowed = {str(EXTENSION / name) for name in ['metadata.json', 'extension.js', 'presentation.js']} | {str(CONFIG), str(LOCKS)}
        if set(state) - allowed:
            raise RuntimeError('Manifiesto de presentación GDM no válido.')
        for name, entry in state.items():
            data = self._read(name)
            if data is None or checksum(data) != entry['installed']:
                raise RuntimeError(f'El archivo instalado cambió fuera de Aurea: {name}')

    def apply(self):
        state = self._state()
        self._validate(state)
        replacements = {str(EXTENSION / name): (self.source / name).read_bytes()
                        for name in ['metadata.json', 'extension.js', 'presentation.js']}
        if state:
            replacements[str(CONFIG)] = self._read(CONFIG)
        else:
            enabled = list(dict.fromkeys([*self.read_setting('enabled-extensions'), UUID]))
            disabled = [value for value in self.read_setting('disabled-extensions') if value != UUID]
            replacements[str(CONFIG)] = ('[org/gnome/shell]\n'
                f'enabled-extensions=@as {enabled!r}\ndisabled-extensions=@as {disabled!r}\n'
                'disable-user-extensions=false\nallow-extension-installation=false\n').encode()
        replacements[str(LOCKS)] = ''.join(f'/org/gnome/shell/{key}\n' for key in
            ['enabled-extensions', 'disabled-extensions', 'disable-user-extensions', 'allow-extension-installation']).encode()
        previous = {name: self._read(name) for name in replacements}
        manifest = self._read(MANIFEST)
        if not state and any(data is not None for data in previous.values()):
            raise RuntimeError('Ya existen archivos con el nombre de Aurea sin un manifiesto verificable.')
        for name, data in replacements.items():
            if name not in state:
                state[name] = {'original': base64.b64encode(previous[name]).decode() if previous[name] is not None else None}
            state[name]['installed'] = checksum(data)
        try:
            for name, data in replacements.items():
                self._set(name, data)
            self._set(MANIFEST, json.dumps(state, indent=2).encode() + b'\n')
            self.update()
        except Exception:
            for name, data in previous.items():
                self._set(name, data)
            self._set(MANIFEST, manifest)
            try:
                self.update()
            finally:
                self._prune_extension_directory()
            raise

    def _prune_extension_directory(self):
        directory = self.path(EXTENSION)
        if directory.exists() and not any(directory.iterdir()):
            directory.rmdir()

    def remove(self):
        state = self._state()
        if not state:
            self._prune_extension_directory()
            return
        self._validate(state)
        previous = {name: self._read(name) for name in state}
        try:
            for name, entry in state.items():
                self._set(name, base64.b64decode(entry['original']) if entry['original'] is not None else None)
            self.update()
        except Exception:
            for name, data in previous.items():
                self._set(name, data)
            self.update()
            raise
        self._set(MANIFEST, None)
        self._prune_extension_directory()
