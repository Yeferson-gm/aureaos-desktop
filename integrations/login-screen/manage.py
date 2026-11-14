#!/usr/bin/env python3
import argparse
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import xml.etree.ElementTree as ET

from layout_install import LayoutInstall

HERE = Path(__file__).resolve().parent
SYSTEM = Path('/usr/share/gnome-shell/gnome-shell-theme.gresource')
STATE = Path('/var/lib/aurea-27/gdm')
PREFIX = '/org/gnome/shell/theme/'
IMAGE = PREFIX + 'aurea-login.jpg'
CSS_FILES = {'gnome-shell-dark.css', 'gnome-shell-light.css'}


def digest(data):
    return hashlib.sha256(data).hexdigest()


def entries(bundle):
    return subprocess.check_output(['gresource', 'list', str(bundle)], text=True).splitlines()


def extract(bundle, entry):
    return subprocess.check_output(['gresource', 'extract', str(bundle), entry])


def build(base, output):
    paths = entries(base)
    if IMAGE in paths:
        raise RuntimeError('El recurso base ya contiene Aurea; se necesita el original guardado.')
    if not {PREFIX + name for name in CSS_FILES}.issubset(paths):
        raise RuntimeError('No se encontraron los estilos nativos esperados de GNOME.')
    overlay = (HERE / 'stylesheet.css').read_bytes()
    with tempfile.TemporaryDirectory(prefix='aurea-gdm-build-') as folder:
        directory = Path(folder)
        resource = ET.Element('gresources')
        group = ET.SubElement(resource, 'gresource', prefix=PREFIX.rstrip('/'))
        for entry in paths:
            if not entry.startswith(PREFIX) or '/' in entry[len(PREFIX):] or '..' in entry:
                raise RuntimeError('Recurso base con una ruta inesperada.')
            name = entry[len(PREFIX):]
            data = extract(base, entry)
            if name in CSS_FILES:
                data += b'\n' + overlay
            (directory / name).write_bytes(data)
            ET.SubElement(group, 'file').text = name
        (directory / 'aurea-login.jpg').write_bytes((HERE / 'WhiteSur-light.jpg').read_bytes())
        ET.SubElement(group, 'file').text = 'aurea-login.jpg'
        manifest = directory / 'theme.xml'
        ET.ElementTree(resource).write(manifest, encoding='utf-8', xml_declaration=True)
        subprocess.run(['glib-compile-resources', str(manifest), '--sourcedir', folder, '--target', str(output)], check=True)
    if set(entries(output)) != set(paths) | {IMAGE}:
        raise RuntimeError('El paquete no conserva los recursos nativos.')
    for entry in paths:
        expected = extract(base, entry)
        if entry[len(PREFIX):] in CSS_FILES:
            expected += b'\n' + overlay
        if extract(output, entry) != expected:
            raise RuntimeError('El contenido generado no coincide con el original y el estilo Aurea.')


def validate(bundle):
    script = '''const {Gio,St} = imports.gi;
const resource = Gio.Resource.load(ARGV[0]); resource._register();
for (const name of ['dark','light','high-contrast']) {
    const theme = new St.Theme();
    theme.load_stylesheet(Gio.File.new_for_uri(`resource:///org/gnome/shell/theme/gnome-shell-${name}.css`));
}
resource._unregister();'''
    env = {**os.environ, 'GI_TYPELIB_PATH': '/usr/lib64/gnome-shell:/usr/lib64/mutter-18', 'LD_LIBRARY_PATH': '/usr/lib64/gnome-shell'}
    subprocess.run(['gjs', '-c', script, str(bundle)], env=env, check=True)


def atomic_write(path, data):
    descriptor, name = tempfile.mkstemp(prefix='.aurea-', dir=path.parent)
    try:
        with os.fdopen(descriptor, 'wb') as stream:
            stream.write(data)
            stream.flush()
            os.fsync(stream.fileno())
        os.chmod(name, 0o644)
        if path.exists():
            shutil.copystat(path, name)
        os.replace(name, path)
    finally:
        if os.path.exists(name):
            os.unlink(name)


def read_state(folder):
    path = folder / 'state.json'
    return json.loads(path.read_text()) if path.exists() else None


def base_resource(target, folder):
    state = read_state(folder)
    current = digest(target.read_bytes())
    if state and current == state['installed']:
        backup = folder / 'original.gresource'
        if digest(backup.read_bytes()) != state['original']:
            raise RuntimeError('El original guardado no coincide con su checksum.')
        return backup
    if IMAGE in entries(target):
        raise RuntimeError('Recurso Aurea sin un original verificable. No se sustituirá.')
    return target


def apply(target=SYSTEM, folder=STATE, restore_context=True):
    if target.is_symlink() or not target.is_file() or folder.is_symlink():
        raise RuntimeError('El destino debe ser un archivo normal y el respaldo un directorio propio.')
    base = base_resource(target, folder)
    original = base.read_bytes()
    previous = target.read_bytes()
    with tempfile.TemporaryDirectory(prefix='aurea-gdm-') as directory:
        candidate = Path(directory) / 'theme.gresource'
        build(base, candidate)
        validate(candidate)
        replacement = candidate.read_bytes()
    if replacement == previous:
        return 'El tema de GDM ya está actualizado.'
    if target.read_bytes() != previous:
        raise RuntimeError('El tema del sistema cambió durante la preparación. Repite la operación.')
    existed = folder.exists()
    saved = {name: (folder / name).read_bytes() if (folder / name).exists() else None
             for name in ['original.gresource', 'state.json']}
    folder.mkdir(parents=True, exist_ok=True, mode=0o755)
    state = {'original': digest(original), 'installed': digest(replacement)}
    try:
        atomic_write(folder / 'original.gresource', original)
        atomic_write(folder / 'state.json', json.dumps(state, indent=2).encode() + b'\n')
        atomic_write(target, replacement)
        if restore_context:
            subprocess.run(['restorecon', str(target), str(folder / 'original.gresource'), str(folder / 'state.json')], check=True)
        if digest(target.read_bytes()) != state['installed']:
            raise RuntimeError('No coincide el archivo instalado.')
    except Exception:
        atomic_write(target, previous)
        for name, data in saved.items():
            if data is None:
                (folder / name).unlink(missing_ok=True)
            else:
                atomic_write(folder / name, data)
        if not existed:
            folder.rmdir()
        raise
    return 'Tema Aurea instalado en GDM. Se verá al cerrar sesión o reiniciar; no se reinició ningún servicio.'


def remove(target=SYSTEM, folder=STATE, restore_context=True):
    if target.is_symlink() or folder.is_symlink():
        raise RuntimeError('No se modifican destinos enlazados.')
    state = read_state(folder)
    if not state:
        return 'No hay una instalación de Aurea GDM registrada.'
    backup = folder / 'original.gresource'
    original = backup.read_bytes()
    if digest(original) != state['original']:
        raise RuntimeError('El respaldo original no coincide con su checksum.')
    current = digest(target.read_bytes())
    if current == state['installed']:
        atomic_write(target, original)
        if restore_context:
            subprocess.run(['restorecon', str(target)], check=True)
    elif current != state['original'] and IMAGE in entries(target):
        raise RuntimeError('El tema instalado cambió; no se sobrescribirá con un respaldo antiguo.')
    backup.unlink()
    (folder / 'state.json').unlink()
    folder.rmdir()
    return 'Personalización GDM retirada; se conserva el tema del sistema.'


def apply_system():
    profile = Path('/etc/dconf/profile/gdm')
    if not profile.exists():
        profile = Path('/usr/share/dconf/profile/gdm')
    if not profile.is_file() or 'system-db:gdm' not in profile.read_text().splitlines():
        raise RuntimeError('El perfil GDM no contiene la base system-db:gdm requerida.')
    paths = [SYSTEM, STATE / 'original.gresource', STATE / 'state.json']
    previous = {path: path.read_bytes() if path.exists() else None for path in paths}
    result = apply()
    try:
        LayoutInstall(HERE / 'extension', atomic_write).apply()
    except Exception:
        for path, data in previous.items():
            if data is None:
                path.unlink(missing_ok=True)
            else:
                atomic_write(path, data)
        subprocess.run(['restorecon', str(SYSTEM)], check=True)
        raise
    return result + ' Presentación y controles de energía habilitados solo en GDM.'


def remove_system():
    LayoutInstall(HERE / 'extension', atomic_write).remove()
    return remove()


def main():
    parser = argparse.ArgumentParser(description='Tema Aurea para la pantalla de inicio de sesión GDM')
    parser.add_argument('action', choices=['build', 'apply', 'remove', 'status'])
    parser.add_argument('--output', type=Path)
    args = parser.parse_args()
    if args.action == 'build':
        if not args.output:
            parser.error('build requiere --output')
        build(base_resource(SYSTEM, STATE), args.output.resolve())
        validate(args.output.resolve())
        print(args.output.resolve())
    elif args.action == 'status':
        state = read_state(STATE)
        layout = LayoutInstall(HERE / 'extension', atomic_write)
        layout_state = layout._state()
        try:
            layout._validate(layout_state)
            valid_layout = bool(layout_state)
        except RuntimeError:
            valid_layout = False
        print('Aurea GDM instalado: tema y presentación' if valid_layout and state and digest(SYSTEM.read_bytes()) == state['installed'] else 'Tema del sistema o actualización pendiente')
    else:
        if os.geteuid() != 0:
            raise SystemExit('Esta acción requiere autorización de administrador mediante sudo o pkexec.')
        major = subprocess.check_output(['gnome-shell', '--version'], text=True).split()[-1].split('.')[0]
        if args.action == 'apply' and major != '50':
            raise SystemExit('Esta integración se ha probado con GNOME 50; no se aplicará en otra versión.')
        print(apply_system() if args.action == 'apply' else remove_system())


if __name__ == '__main__':
    main()
