import json
import math
import statistics
import sys
from pathlib import Path
from PIL import Image

folder = Path(sys.argv[1])
for mode, geometry in json.loads((folder / 'glass.json').read_text()).items():
    baseline = Image.open(folder / f'glass-{mode}-off.png').convert('RGB')
    masked = Image.open(folder / f'glass-{mode}-on.png').convert('RGB')
    unclipped = Image.open(folder / f'glass-{mode}-unclipped.png').convert('RGB')
    scale_x = baseline.width / geometry['stage'][0]
    scale_y = baseline.height / geometry['stage'][1]
    x, y = [value * scale for value, scale in zip(geometry['position'], [scale_x, scale_y])]
    width, height = [value * scale for value, scale in zip(geometry['size'], [scale_x, scale_y])]
    rx, ry = [value * scale for value, scale in zip(geometry['radius'], [scale_x, scale_y])]
    outside, regression, inside = [], [], []
    for row in range(max(0, math.ceil(y)), min(baseline.height, math.floor(y + height))):
        for column in range(max(0, math.ceil(x)), min(baseline.width, math.floor(x + width))):
            point = column, row
            difference = max(abs(a - b) for a, b in zip(baseline.getpixel(point), masked.getpixel(point)))
            angle = math.radians(geometry.get('rotation', 0))
            local_x = column + 0.5 - x - width / 2
            local_y = row + 0.5 - y - height / 2
            unrotated_x = local_x * math.cos(angle) + local_y * math.sin(angle)
            unrotated_y = -local_x * math.sin(angle) + local_y * math.cos(angle)
            dx = max(abs(unrotated_x) - width / 2 + rx, 0)
            dy = max(abs(unrotated_y) - height / 2 + ry, 0)
            if math.hypot(dx / rx, dy / ry) > 1.12:
                outside.append(difference)
                regression.append(max(abs(a - b) for a, b in zip(baseline.getpixel(point), unclipped.getpixel(point))))
            if -height / 2 + 4 * scale_y < unrotated_y < -height / 2 + 10 * scale_y and abs(unrotated_x) < width * 0.2:
                inside.append(difference)
    assert outside and max(outside) <= 2, f'{mode}: vidrio fuera del contorno ({max(outside, default=-1)})'
    assert max(regression) > 20, f'{mode}: la prueba no detecta el desenfoque sin recorte'
    assert inside and statistics.mean(inside) > 10, f'{mode}: se perdió el desenfoque interior'
    print(f'PASS: vidrio {mode}, exterior {max(outside)}, cambio interior {statistics.mean(inside):.1f}')
