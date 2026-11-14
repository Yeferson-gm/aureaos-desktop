#!/usr/bin/env python3
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import stat
import subprocess
import tempfile

SOURCE = Path(__file__).resolve().parent / 'theme'
THEME = Path('/boot/grub2/themes/Aurea27')
LEGACY = Path('/boot/grub2/themes/whitesur')
STATE = Path('/var/lib/aurea-27/boot-menu')
DEFAULTS = Path('/etc/default/grub')
CUSTOM = Path('/etc/grub.d/40_custom')
FIRMWARE = Path('/etc/grub.d/30_uefi-firmware')
CONFIG = Path('/boot/grub2/grub.cfg')
FILES = (DEFAULTS, CUSTOM, FIRMWARE, CONFIG)


def run(*args):
    return subprocess.check_output(args, text=True)


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def configure_defaults(text):
    settings = {'GRUB_THEME': '"/boot/grub2/themes/Aurea27/theme.txt"',
                'GRUB_TIMEOUT_STYLE': 'menu', 'GRUB_TIMEOUT': '5',
                'GRUB_DISABLE_OS_PROBER': 'true'}
    lines = text.splitlines()
    for key, value in settings.items():
        lines = [line for line in lines if not re.match(rf'^\s*{key}\s*=', line)]
        lines.append(f'{key}={value}')
    if not re.search(r'^GRUB_ENABLE_BLSCFG\s*=\s*["\']?true', text, re.M):
        raise ValueError('Esta integración requiere Fedora con BLS habilitado.')
    return '\n'.join(lines) + '\n'


def configure_custom(text, title):
    lines = text.splitlines(keepends=True)
    output = []
    removed = 0
    i = 0
    while i < len(lines):
        line = lines[i]
        match = re.match(r"^menuentry\s+(['\"])(.*?)\1.*\{\s*$", line.rstrip())
        if match and match[2] == title:
            end = i + 1
            while end < len(lines) and lines[end].strip() != '}':
                if '{' in lines[end] or '}' in lines[end]:
                    raise ValueError('Entrada compleja: revisar manualmente antes de quitarla.')
                end += 1
            if end == len(lines):
                raise ValueError('Entrada de arranque sin cierre.')
            removed += 1
            i = end + 1
            continue
        if i > 1 and line.lstrip().startswith('#'):
            i += 1
            continue
        output.append(line.replace("menuentry 'Windows Boot Manager'", "menuentry 'Windows'"))
        i += 1
    result = ''.join(output)
    if not re.search(r"^menuentry ['\"]Windows(?: Boot Manager)?['\"]", result, re.M):
        raise ValueError('Debe existir una entrada Windows funcional en 40_custom; no se inventa su partición.')
    if not result.startswith('#!') or 'exec tail -n +3' not in result.splitlines()[1]:
        raise ValueError('Formato de 40_custom no reconocido.')
    return result, removed


def atomic_write(path, data, mode):
    fd, temporary = tempfile.mkstemp(prefix='.aurea-', dir=path.parent)
    try:
        with os.fdopen(fd, 'wb') as file:
            file.write(data)
            file.flush()
            os.fsync(file.fileno())
        os.chmod(temporary, mode)
        os.replace(temporary, path)
    finally:
        Path(temporary).unlink(missing_ok=True)


def snapshot():
    if THEME.exists():
        raise ValueError('El destino Aurea27 ya existe sin manifiesto; no se sobrescribe.')
    if any(path.is_symlink() for path in FILES) or LEGACY.is_symlink():
        raise ValueError('Una ruta administrada es un enlace; revisar antes de instalar.')
    STATE.mkdir(parents=True, mode=0o700)
    manifest = {'files': {}, 'legacy_theme': LEGACY.is_dir()}
    for i, path in enumerate(FILES):
        if path.is_symlink():
            raise ValueError(f'Ruta administrada es un enlace: {path}')
        target = STATE / str(i)
        shutil.copy2(path, target)
        manifest['files'][str(path)] = {'backup': str(i), 'mode': stat.S_IMODE(path.stat().st_mode)}
    if LEGACY.is_dir():
        shutil.copytree(LEGACY, STATE / 'legacy-theme')
    (STATE / 'original.json').write_text(json.dumps(manifest, indent=2))
    return manifest


def restore_files(manifest, include_config=True):
    for filename, entry in manifest['files'].items():
        if not include_config and filename == str(CONFIG):
            continue
        atomic_write(Path(filename), (STATE / entry['backup']).read_bytes(), entry['mode'])
    if manifest['legacy_theme'] and not LEGACY.exists():
        shutil.copytree(STATE / 'legacy-theme', LEGACY)


def generate(expected_theme, removed_title=None):
    fd, name = tempfile.mkstemp(prefix='aurea-check-', suffix='.cfg', dir=CONFIG.parent)
    os.close(fd)
    temporary = Path(name)
    try:
        run('grub2-mkconfig', '-o', name)
        run('grub2-script-check', name)
        text = temporary.read_text()
        if not re.search(r'^blscfg\s*$', text, re.M):
            raise ValueError('Faltan las entradas nativas BLS de Fedora.')
        if not re.search(r"^menuentry ['\"]Windows(?: Boot Manager)?['\"]", text, re.M):
            raise ValueError('No se generó Windows.')
        if expected_theme and expected_theme not in text:
            raise ValueError('No se generó el tema Aurea.')
        if removed_title and removed_title in text:
            raise ValueError('La entrada retirada sigue apareciendo en otro generador.')
        atomic_write(CONFIG, temporary.read_bytes(), 0o600)
    finally:
        temporary.unlink(missing_ok=True)
        Path(name + '.new').unlink(missing_ok=True)


def preflight():
    if os.geteuid() != 0:
        raise PermissionError('Ejecutar con sudo o pkexec.')
    if not re.search(r'^ID=fedora$', Path('/etc/os-release').read_text(), re.M):
        raise ValueError('Solo Fedora está validado.')
    for command in ['grub2-mkconfig', 'grub2-script-check', 'restorecon']:
        if not shutil.which(command):
            raise ValueError(f'Falta {command}')
    if not Path('/boot/efi/EFI/Microsoft/Boot/bootmgfw.efi').is_file():
        raise ValueError('No se encontró Windows en la partición EFI montada.')
    entries = list(Path('/boot/loader/entries').glob('*.conf'))
    if not entries or not any('/vmlinuz-' + os.uname().release in p.read_text() for p in entries):
        raise ValueError('Falta la entrada BLS del kernel en uso.')


def check():
    manifest = json.loads((STATE / 'installed.json').read_text())
    for filename, expected in manifest['files'].items():
        if digest(Path(filename)) != expected:
            raise ValueError(f'Archivo cambiado: {filename}')
    if FIRMWARE.stat().st_mode & 0o111:
        raise ValueError('El generador UEFI volvió a activarse; aplicar de nuevo.')
    for relative, expected in manifest['theme'].items():
        if digest(THEME / relative) != expected:
            raise ValueError(f'Recurso cambiado: {relative}')
    text = CONFIG.read_text()
    if '/grub2/themes/Aurea27/theme.txt' not in text or manifest['removed_title'] in text:
        raise ValueError('Menú activo desactualizado.')
    if not re.search(r'^blscfg\s*$', text, re.M) or not re.search(r"^menuentry ['\"]Windows['\"]", text, re.M):
        raise ValueError('Faltan Fedora BLS o Windows en el menú activo.')
    run('grub2-script-check', str(CONFIG))
    print('Aurea 27 · Arranque: tema y configuración verificados; Fedora BLS conserva sus kernels.')


def apply(title):
    defaults = configure_defaults(DEFAULTS.read_text())
    custom, removed = configure_custom(CUSTOM.read_text(), title)
    if not (SOURCE / 'theme.txt').is_file() or not (SOURCE / 'LICENSE').is_file():
        raise ValueError('Paquete de tema incompleto.')
    if STATE.exists() and not (STATE / 'original.json').exists():
        raise ValueError('Respaldo incompleto: revisar antes de instalar.')
    original = json.loads((STATE / 'original.json').read_text()) if STATE.exists() else snapshot()
    previous = {path: (path.read_bytes(), stat.S_IMODE(path.stat().st_mode)) for path in FILES}
    with tempfile.TemporaryDirectory(prefix='aurea-boot-') as folder:
        old_theme = Path(folder) / 'previous-theme'
        if THEME.exists():
            shutil.copytree(THEME, old_theme)
        try:
            if THEME.exists():
                shutil.rmtree(THEME)
            shutil.copytree(SOURCE, THEME)
            atomic_write(DEFAULTS, defaults.encode(), previous[DEFAULTS][1])
            atomic_write(CUSTOM, custom.encode(), previous[CUSTOM][1])
            FIRMWARE.chmod(previous[FIRMWARE][1] & ~0o111)
            generate('/grub2/themes/Aurea27/theme.txt', title)
            run('restorecon', '-RF', str(THEME), *(str(p) for p in FILES))
            installed = {'removed_title': title,
                         'files': {str(p): digest(p) for p in FILES if p != CONFIG},
                         'theme': {str(p.relative_to(THEME)): digest(p) for p in THEME.rglob('*') if p.is_file()}}
            if LEGACY.exists():
                shutil.rmtree(LEGACY)
            (STATE / 'installed.json').write_text(json.dumps(installed, indent=2))
        except Exception:
            for path, (data, mode) in previous.items():
                atomic_write(path, data, mode)
            if THEME.exists():
                shutil.rmtree(THEME)
            if old_theme.exists():
                shutil.copytree(old_theme, THEME)
            if original['legacy_theme'] and not LEGACY.exists():
                shutil.copytree(STATE / 'legacy-theme', LEGACY)
            raise
    print(f'Entradas retiradas: {removed}. Respaldo: {STATE}. No se reinicia el equipo.')
    check()


def restore():
    check()
    original = json.loads((STATE / 'original.json').read_text())
    previous = {path: (path.read_bytes(), stat.S_IMODE(path.stat().st_mode)) for path in FILES}
    try:
        restore_files(original, include_config=False)
        generate(None)
        run('restorecon', '-RF', *(str(p) for p in FILES))
    except Exception:
        for path, (data, mode) in previous.items():
            atomic_write(path, data, mode)
        raise
    shutil.rmtree(THEME)
    shutil.rmtree(STATE)
    print('Configuración anterior restaurada y regenerada con los kernels actuales.')


def main():
    parser = argparse.ArgumentParser(description='Aurea 27 · Arranque Fedora/Windows')
    parser.add_argument('action', choices=['apply', 'check', 'restore'])
    parser.add_argument('--remove-entry', default='Arch Linux (disco externo)')
    args = parser.parse_args()
    preflight()
    if args.action == 'apply':
        if not args.remove_entry or args.remove_entry.lower().startswith(('fedora', 'windows')):
            parser.error('Solo se permite retirar una entrada ajena a Fedora/Windows.')
        apply(args.remove_entry)
    elif args.action == 'check':
        check()
    else:
        restore()


if __name__ == '__main__':
    main()
