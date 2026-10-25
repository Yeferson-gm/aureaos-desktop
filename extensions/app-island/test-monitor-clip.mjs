import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source = fs.readFileSync(new URL('./extension.js', import.meta.url), 'utf8')
    .replace(/^import .*;\n/gm, '').replace('export default class', 'class');
const monitor = {x: 0, y: 0, width: 1280, height: 800};
const context = vm.createContext({Extension: class {}, Main: {layoutManager: {primaryMonitor: monitor}}});
vm.runInContext(`${source}\nglobalThis.Dock = SideDock;`, context);
const dock = Object.create(context.Dock.prototype);
const actor = dock._root = {x: 1226, y: 280, width: 54, height: 240,
    translation_x: 48, translation_y: 0, set_clip(...clip) {this.clip = clip;}};
dock._syncMonitorClip();
assert.deepEqual(actor.clip, [0, 0, 6, 240], 'Hidden right edge paints only six pixels on its monitor');
for (const translation of [0, 0.5, 12, 24.75, 47.9, 48]) {
    actor.translation_x = translation;
    dock._syncMonitorClip();
    assert.ok(actor.x + translation + actor.clip[0] + actor.clip[2] <= 1280,
        'Every animation frame remains inside the monitor');
}
Object.assign(monitor, {x: -1920, y: 150, width: 1920, height: 1080});
Object.assign(actor, {x: -54, y: 300, translation_x: 48});
dock._syncMonitorClip();
assert.deepEqual(actor.clip, [0, 0, 6, 240], 'Nonzero/negative monitor origins');
Object.assign(actor, {x: -1920, translation_x: -48});
dock._syncMonitorClip();
assert.deepEqual(actor.clip, [48, 0, 6, 240], 'Left edge is clipped symmetrically');
Object.assign(actor, {x: -360, width: 360, translation_x: 0});
dock._syncMonitorClip();
assert.deepEqual(actor.clip, [0, 0, 360, 240], 'Expanded panel is not cut off');
Object.assign(actor, {y: 100});
dock._syncMonitorClip();
assert.deepEqual(actor.clip, [0, 50, 360, 190], 'Vertical monitor boundaries');
console.log('PASS: monitor clipping on both edges, fractional animation, expanded panel and offset displays');
