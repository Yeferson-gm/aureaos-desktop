#!/usr/bin/env python3
"""Operaciones locales de la bandeja. Nunca ejecuta instrucciones del archivo."""
import json
import os
from pathlib import Path
import shutil
import signal
import stat
import subprocess
import sys
import tempfile
import zipfile

child = None


def stop(_signal, _frame):
    if child is not None and child.poll() is None:
        child.terminate()
    raise SystemExit(130)


signal.signal(signal.SIGTERM, stop)


def run(args):
    global child
    if not shutil.which(args[0]):
        raise ValueError(f'Falta instalar {args[0]}')
    child = subprocess.Popen(args, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    stdout, stderr = child.communicate()
    if child.returncode:
        raise ValueError(stderr.strip()[-500:] or f'{args[0]} no pudo completar la operación')
    return stdout


def video_options():
    encoders = run(['ffmpeg', '-hide_banner', '-encoders'])
    available = {line.split()[1] for line in encoders.splitlines() if len(line.split()) >= 2}
    if 'libx264' in available:
        return ['-c:v', 'libx264', '-preset', 'veryfast', '-c:a', 'aac']
    if 'libopenh264' in available:
        return ['-c:v', 'libopenh264', '-pix_fmt', 'yuv420p', '-c:a', 'aac']
    return ['-c:v', 'mpeg4', '-q:v', '4', '-c:a', 'aac']


def extract_zip(source, destination):
    with zipfile.ZipFile(source) as archive:
        entries = archive.infolist()
        if len(entries) > 10000 or sum(item.file_size for item in entries) > 2 * 1024**3:
            raise ValueError('ZIP demasiado grande: máximo 10 000 entradas y 2 GB descomprimidos')
        for entry in entries:
            target = (destination / entry.filename).resolve()
            if not target.is_relative_to(destination.resolve()) or stat.S_ISLNK(entry.external_attr >> 16):
                raise ValueError('El ZIP contiene una ruta o enlace no permitido')
        archive.extractall(destination)


def operate(operation, paths, directory):
    if operation == 'zip':
        output = directory / 'Archivos.zip'
        with zipfile.ZipFile(output, 'w', zipfile.ZIP_DEFLATED) as archive:
            for index, path in enumerate(paths, 1):
                candidates = path.rglob('*') if path.is_dir() else [path]
                for file in candidates:
                    if not file.is_file() or file.is_symlink():
                        continue
                    relative = file.relative_to(path.parent)
                    archive.write(file, f'{index}/{relative}')
        return {'path': str(output)}
    if operation == 'extract':
        for index, path in enumerate(paths):
            target = directory / str(index + 1)
            target.mkdir()
            extract_zip(path, target)
        return {'path': str(directory)}
    results = []
    for index, path in enumerate(paths, 1):
        if not path.is_file():
            raise ValueError('Esta operación necesita archivos, no carpetas')
        base = directory / f'{index}-{path.stem}'
        if operation == 'png':
            output = str(base) + '.png'
            run(['magick', str(path), output])
        elif operation in ('mp3', 'mp4'):
            output = str(base) + '.' + operation
            options = ['-vn', '-codec:a', 'libmp3lame'] if operation == 'mp3' else video_options()
            run(['ffmpeg', '-nostdin', '-v', 'error', '-n', '-i', str(path), *options, output])
        elif operation == 'ocr':
            output = str(base) + '.txt'
            text = run(['tesseract', str(path), 'stdout'])
            Path(output).write_text(text, encoding='utf-8')
        else:
            raise ValueError('Operación desconocida')
        results.append(output)
    return {'path': results[0] if len(results) == 1 else str(directory)}


def main():
    operation, encoded, root = sys.argv[1:]
    paths = [Path(path).resolve(strict=True) for path in json.loads(encoded)]
    if not 1 <= len(paths) <= 50:
        raise ValueError('Selecciona entre 1 y 50 elementos')
    os.umask(0o077)
    Path(root).mkdir(parents=True, exist_ok=True)
    directory = Path(tempfile.mkdtemp(prefix='operacion-', dir=root))
    try:
        result = operate(operation, paths, directory)
    except BaseException:
        shutil.rmtree(directory)
        raise
    print(json.dumps(result))


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        print(json.dumps({'error': str(error)}))
        sys.exit(1)
