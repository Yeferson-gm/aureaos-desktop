import importlib.util
from pathlib import Path
import tempfile
import zipfile
import shutil

spec = importlib.util.spec_from_file_location('file_tools', Path(__file__).parents[1] / 'file-tools.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
with tempfile.TemporaryDirectory() as directory:
    root = Path(directory)
    source = root / 'archivo con espacios.txt'
    source.write_text('contenido de prueba', encoding='utf-8')
    output = root / 'output'
    output.mkdir()
    result = module.operate('zip', [source], output)
    target = root / 'extracted'
    target.mkdir()
    module.extract_zip(result['path'], target)
    assert (target / '1' / source.name).read_text() == source.read_text()
    bad = root / 'bad.zip'
    with zipfile.ZipFile(bad, 'w') as archive:
        archive.writestr('../escape.txt', 'no permitido')
    try:
        module.extract_zip(bad, target)
    except ValueError:
        pass
    else:
        raise AssertionError('La extracción aceptó una ruta externa')
    assert not (root / 'escape.txt').exists()
    if shutil.which('magick'):
        image = root / 'entrada.jpg'
        module.run(['magick', '-size', '240x80', 'xc:white', '-fill', 'black', '-pointsize', '28',
                    '-gravity', 'center', '-annotate', '0', 'PRUEBA 123', str(image)])
        converted = module.operate('png', [image], output)
        assert Path(converted['path']).read_bytes().startswith(b'\x89PNG')
        if shutil.which('tesseract'):
            ocr = module.operate('ocr', [image], output)
            assert 'PRUEBA' in Path(ocr['path']).read_text().upper()
    if shutil.which('ffmpeg'):
        audio = root / 'entrada.wav'
        module.run(['ffmpeg', '-v', 'error', '-f', 'lavfi', '-i', 'sine=frequency=440:duration=0.2', str(audio)])
        converted = module.operate('mp3', [audio], output)
        assert Path(converted['path']).stat().st_size > 0
        video = root / 'entrada.mkv'
        module.run(['ffmpeg', '-v', 'error', '-f', 'lavfi', '-i', 'color=c=blue:s=64x64:d=0.2', str(video)])
        converted = module.operate('mp4', [video], output)
        assert Path(converted['path']).stat().st_size > 0
print('Archivos: ZIP, extracción y bloqueo de rutas externas verificados.')
print('Conversiones PNG/MP3/MP4 y OCR comprobados cuando sus dependencias están instaladas.')
