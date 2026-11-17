import argparse
import os
from pathlib import Path
import shutil
import subprocess
import tempfile

SOURCE = Path(__file__).resolve().parent
DESTINATION = Path('usr/local/lib/aurea-27/login-refresh')
UNIT = Path('etc/systemd/system/aurea-login-refresh.service')
SERVICE = '''[Unit]
Description=Restore Aurea login presentation after GNOME updates
After=local-fs.target
Before=display-manager.service
ConditionPathExists=/var/lib/aurea-27/gdm/state.json

[Service]
Type=oneshot
ExecStart=/usr/bin/python3 /usr/local/lib/aurea-27/login-refresh/manage.py refresh
TimeoutStartSec=45
UMask=0022

[Install]
WantedBy=graphical.target
'''


def install(root=Path('/'), source=SOURCE):
    destination = root / DESTINATION
    destination.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='.aurea-refresh-', dir=destination.parent) as temporary:
        stage = Path(temporary) / 'payload'
        shutil.copytree(source, stage, ignore=shutil.ignore_patterns('test*', '__pycache__'))
        for path in [stage, *stage.rglob('*')]:
            path.chmod(0o755 if path.is_dir() else 0o644)
        previous = Path(temporary) / 'previous'
        if destination.exists():
            destination.rename(previous)
        try:
            stage.rename(destination)
        except Exception:
            if previous.exists():
                previous.rename(destination)
            raise
    unit = root / UNIT
    unit.parent.mkdir(parents=True, exist_ok=True)
    unit.write_text(SERVICE)
    unit.chmod(0o644)


def main():
    parser = argparse.ArgumentParser(description='Mantenimiento del acceso Aurea tras actualizar GNOME')
    parser.add_argument('action', choices=['install', 'remove'])
    args = parser.parse_args()
    if os.geteuid() != 0:
        raise SystemExit('Requiere sudo o pkexec.')
    if args.action == 'install':
        install()
        subprocess.run(['restorecon', '-RF', str(Path('/') / DESTINATION), str(Path('/') / UNIT)], check=True)
        subprocess.run(['systemctl', 'daemon-reload'], check=True)
        subprocess.run(['systemctl', 'enable', UNIT.name], check=True)
        print('Mantenimiento preparado; no se reinició GDM ni la sesión.')
    else:
        subprocess.run(['systemctl', 'disable', UNIT.name], check=True)
        (Path('/') / UNIT).unlink(missing_ok=True)
        shutil.rmtree(Path('/') / DESTINATION, ignore_errors=True)
        subprocess.run(['systemctl', 'daemon-reload'], check=True)
        print('Mantenimiento retirado; el tema actual se conserva.')


if __name__ == '__main__':
    main()
