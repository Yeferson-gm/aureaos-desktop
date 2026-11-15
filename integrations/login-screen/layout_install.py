import ast
import base64
import configparser
import io
import hashlib
import json
import os
import pwd
from pathlib import Path
import subprocess
import tempfile

UUID = 'aurea-lock-screen@local'
LEGACY_UUID = 'aurea-login-layout@local'
LEGACY_EXTENSION = Path('usr/share/gnome-shell/extensions') / LEGACY_UUID
FILES = ('metadata.json', 'extension.js', 'lock.js', 'login.js', 'presentation.js',
         'layout.js', 'keyboardPolicy.js', 'stylesheet.css',
         'assets/WhiteSur-dark.jpg', 'assets/LICENSE.WhiteSur')
LEGACY_FILES = ('metadata.json', 'extension.js', 'presentation.js', 'keyboardPolicy.js')
EXTENSION = Path('usr/share/gnome-shell/extensions') / UUID
CONFIG = Path('etc/dconf/db/gdm.d/90-aurea-login')
LOCKS = Path('etc/dconf/db/gdm.d/locks/90-aurea-login')
MANIFEST = Path('var/lib/aurea-27/gdm/layout.json')


def checksum(data):
    return hashlib.sha256(data).hexdigest()


def greeter_value(schema, key):
    account = pwd.getpwnam('gdm')
    with tempfile.TemporaryDirectory(prefix='aurea-gdm-read-') as runtime:
        os.chown(runtime, account.pw_uid, account.pw_gid)
        output = subprocess.check_output(['runuser', '-u', 'gdm', '--', 'env',
            '-u', 'DBUS_SESSION_BUS_ADDRESS', '-u', 'GSETTINGS_BACKEND', '-u', 'XDG_CONFIG_HOME',
            '-u', 'XDG_DATA_HOME', f'HOME={account.pw_dir}', f'XDG_RUNTIME_DIR={runtime}',
            'DCONF_PROFILE=gdm', 'gsettings', 'get', schema, key], text=True).strip()
    return output


def greeter_setting(key):
    output = greeter_value('org.gnome.shell', key)
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
        paths = [self.path(relative) for relative in [EXTENSION, LEGACY_EXTENSION, CONFIG.parent, MANIFEST.parent]]
        subprocess.run(['restorecon', '-R', *(str(path) for path in paths if path.exists())], check=True)
        subprocess.run(['dconf', 'update'], check=True)
        if self.path(CONFIG).exists():
            applied = configparser.ConfigParser(interpolation=None)
            applied.read_string(self.path(CONFIG).read_text())
            expected = UUID if UUID in applied['org/gnome/shell']['enabled-extensions'] else LEGACY_UUID
            if expected not in self.read_setting('enabled-extensions') or expected in self.read_setting('disabled-extensions'):
                raise RuntimeError('GDM no reconoce la activación; se restaurará la configuración anterior.')
            for schema, key, expected in [('org.gnome.login-screen', 'logo', "''"),
                                         ('org.gnome.desktop.a11y.applications', 'screen-keyboard-enabled', 'false')]:
                if applied.has_option(schema.replace('.', '/'), key) and greeter_value(schema, key) != expected:
                    raise RuntimeError(f'GDM no reconoce el ajuste {schema} {key}.')

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
        allowed = {str(EXTENSION / name) for name in FILES} | {str(CONFIG), str(LOCKS)}
        allowed |= {str(LEGACY_EXTENSION / name) for name in LEGACY_FILES}
        if set(state) - allowed:
            raise RuntimeError('Manifiesto de presentación GDM no válido.')
        for name, entry in state.items():
            data = self._read(name)
            if data is None or checksum(data) != entry['installed']:
                raise RuntimeError(f'El archivo instalado cambió fuera de Aurea: {name}')

    def apply(self):
        state = self._state()
        self._validate(state)
        replacements = {str(EXTENSION / name): (self.source / name).read_bytes() for name in FILES}
        config = configparser.ConfigParser(interpolation=None)
        if state:
            config.read_string(self._read(CONFIG).decode())
        else:
            config['org/gnome/shell'] = {}
        shell = config['org/gnome/shell']
        def values(key):
            raw = shell.get(key)
            if raw is None:
                return self.read_setting(key)
            result = ast.literal_eval(raw.removeprefix('@as '))
            if not isinstance(result, list) or not all(isinstance(item, str) for item in result):
                raise RuntimeError('Lista de extensiones GDM no válida.')
            return result
        enabled = list(dict.fromkeys([*(UUID if item == LEGACY_UUID else item
                                       for item in values('enabled-extensions')), UUID]))
        disabled = [item for item in values('disabled-extensions') if item not in (UUID, LEGACY_UUID)]
        shell.update({'enabled-extensions': f'@as {enabled!r}', 'disabled-extensions': f'@as {disabled!r}',
                      'disable-user-extensions': 'false', 'allow-extension-installation': 'false'})
        config['org/gnome/login-screen'] = {'logo': "''"}
        config['org/gnome/desktop/a11y/applications'] = {'screen-keyboard-enabled': 'false'}
        stream = io.StringIO()
        config.write(stream, space_around_delimiters=False)
        replacements[str(CONFIG)] = stream.getvalue().encode()
        replacements[str(LOCKS)] = ''.join(f'/org/gnome/shell/{key}\n' for key in
            ['enabled-extensions', 'disabled-extensions', 'disable-user-extensions', 'allow-extension-installation']).encode() + (
                b'/org/gnome/login-screen/logo\n'
                b'/org/gnome/desktop/a11y/applications/screen-keyboard-enabled\n')
        obsolete = set(state) - set(replacements)
        previous = {name: self._read(name) for name in set(replacements) | obsolete}
        manifest = self._read(MANIFEST)
        for name, data in previous.items():
            if name not in state and data is not None:
                raise RuntimeError('Ya existen archivos con el nombre de Aurea sin un manifiesto verificable.')
        next_state = {}
        for name, data in replacements.items():
            original = state.get(name, {}).get('original')
            next_state[name] = {'original': original, 'installed': checksum(data)}
        try:
            for name, data in replacements.items():
                self._set(name, data)
            for name in obsolete:
                entry = state[name]
                self._set(name, base64.b64decode(entry['original']) if entry['original'] is not None else None)
            self._set(MANIFEST, json.dumps(next_state, indent=2).encode() + b'\n')
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

        self._prune_extension_directory()

    def _prune_extension_directory(self):
        for relative in [EXTENSION, LEGACY_EXTENSION]:
            directory = self.path(relative)
            if not directory.exists():
                continue
            for child in sorted(directory.rglob('*'), reverse=True):
                if child.is_dir() and not child.is_symlink() and not any(child.iterdir()):
                    child.rmdir()
            if not any(directory.iterdir()):
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
