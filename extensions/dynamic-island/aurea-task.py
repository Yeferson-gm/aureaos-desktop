#!/usr/bin/env python3
import argparse
import json
import subprocess
import time
import uuid


def publish(payload):
    try:
        argument = "'" + json.dumps(payload).replace('\\', '\\\\').replace("'", "\\'") + "'"
        result = subprocess.run(['gdbus', 'call', '--session', '--dest', 'org.aurea.Island',
                                 '--object-path', '/org/aurea/Island', '--method', 'org.aurea.Island.Publish',
                                 argument], capture_output=True, text=True, timeout=2)
        return result.returncode == 0 and result.stdout.strip() == '(true,)'
    except (OSError, subprocess.TimeoutExpired):
        return False


def main():
    parser = argparse.ArgumentParser(description='Muestra tareas locales en la isla Aurea. No transmite salida ni conversaciones.')
    parser.add_argument('--title', default='Tarea local')
    parser.add_argument('--id', default=None)
    parser.add_argument('--state', choices=['running', 'waiting', 'done', 'error'])
    parser.add_argument('--detail', default='')
    parser.add_argument('--progress', type=float)
    parser.add_argument('command', nargs=argparse.REMAINDER)
    args = parser.parse_args()
    payload = {'id': args.id or uuid.uuid4().hex, 'title': args.title, 'detail': args.detail, 'progress': args.progress}
    if args.state:
        return 0 if publish(dict(payload, state=args.state)) else 2
    command = args.command[1:] if args.command[:1] == ['--'] else args.command
    if not command:
        parser.error('Indica --state o un comando después de --')
    publish(dict(payload, state='running'))
    started = time.monotonic()
    try:
        result = subprocess.run(command, check=False).returncode
    except KeyboardInterrupt:
        result = 130
    except OSError as error:
        publish(dict(payload, state='error', detail=str(error)[:300]))
        return 127
    publish(dict(payload, state='done' if result == 0 else 'error', detail=f'{time.monotonic() - started:.1f} s · código {result}'))
    return result


if __name__ == '__main__':
    raise SystemExit(main())
