#!/usr/bin/env python3
"""Lectura acotada de sensores disponibles; no estima datos que el equipo no expone."""
import glob
import json
from pathlib import Path
import shutil
import subprocess

temperatures = []
gpu = []
for sensor in glob.glob('/sys/class/hwmon/hwmon*/temp*_input'):
    try:
        value = int(Path(sensor).read_text()) / 1000
        if -10 < value < 150:
            label_file = Path(sensor.replace('_input', '_label'))
            label = label_file.read_text().strip() if label_file.exists() else Path(sensor).parent.joinpath('name').read_text().strip()
            temperatures.append({'name': label, 'celsius': round(value)})
    except (OSError, ValueError):
        pass
for sensor in glob.glob('/sys/class/drm/card*/device/gpu_busy_percent'):
    try:
        gpu.append({'name': Path(sensor).parents[1].name, 'usage': int(Path(sensor).read_text())})
    except (OSError, ValueError):
        pass
if shutil.which('nvidia-smi'):
    try:
        result = subprocess.run(['nvidia-smi', '--query-gpu=utilization.gpu,temperature.gpu',
                                 '--format=csv,noheader,nounits'], capture_output=True, text=True, timeout=2, check=True)
        for index, line in enumerate(result.stdout.splitlines()):
            usage, temperature = [int(value.strip()) for value in line.split(',')]
            gpu.append({'name': f'NVIDIA {index + 1}', 'usage': usage})
            temperatures.append({'name': f'GPU {index + 1}', 'celsius': temperature})
    except (subprocess.SubprocessError, ValueError):
        pass
print(json.dumps({'gpu': gpu, 'temperatures': temperatures[:4]}))
