import assert from 'node:assert/strict';
import {weatherColors, WEATHER_SECONDARY_ALPHA} from '../source/lib/weather-colors.js';

const rgb = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255);
const luminance = channels => channels.map(c => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
    .reduce((sum, c, i) => sum + c * [0.2126, 0.7152, 0.0722][i], 0);

for (const kind of ['sol', 'parcial', 'nublado', 'lluvia', 'tormenta', 'nieve', 'niebla', 'unknown']) {
    for (const night of [false, true]) {
        const [start, end] = weatherColors(kind, night).map(rgb);
        for (let step = 0; step <= 100; step++) {
            const background = start.map((c, i) => c + (end[i] - c) * step / 100);
            const text = background.map(c => WEATHER_SECONDARY_ALPHA + c * (1 - WEATHER_SECONDARY_ALPHA));
            const contrast = (luminance(text) + 0.05) / (luminance(background) + 0.05);
            assert.ok(contrast >= 4.5, `${kind} / night=${night} / step=${step}: ${contrast}`);
        }
    }
    assert.notDeepEqual(weatherColors(kind), weatherColors(kind, true));
}
const borrowed = weatherColors('lluvia');
borrowed[0] = '#000000';
assert.notDeepEqual(weatherColors('lluvia'), borrowed);
assert.notDeepEqual(weatherColors('lluvia'), weatherColors('nublado'));
assert.notDeepEqual(weatherColors('tormenta'), weatherColors('lluvia'));
console.log('PASS: weather gradients retain readable secondary text and independent day/night conditions');
