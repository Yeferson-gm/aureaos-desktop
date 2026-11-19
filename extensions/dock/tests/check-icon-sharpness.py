import json
import sys
from pathlib import Path

from PIL import Image, ImageChops, ImageStat

directory = Path(sys.argv[1])
image = Image.open(directory / "sharpness.png").convert("RGB")
geometry = json.loads((directory / "sharpness.json").read_text())
samples = {}
scale = image.width / geometry["width"]
for item in geometry["probes"]:
    x, y, width, height = (round(item[key] * scale) for key in ("x", "y", "width", "height"))
    samples[item["name"]] = image.crop((x, y, x + width, y + height))

reference = samples["native"]
if ImageStat.Stat(reference).stddev[0] < 30:
    raise SystemExit("FAIL: la referencia no contiene el patrón de detalle")
errors = {
    name: sum(ImageStat.Stat(ImageChops.difference(reference, sample)).mean) / 3
    for name, sample in samples.items() if name != "native"
}
if errors["legacy"] < 10 or errors["corrected"] > 2:
    raise SystemExit(f"FAIL: detalle en reposo frente a referencia nativa: {errors}")
print(f"PASS: detalle en reposo frente a referencia nativa: {errors}")
