import assert from 'node:assert/strict';
import {smoothPhase} from '../../extensions/magic-lamp/motion.js';
import {WobblyModel} from '../../extensions/window-motion/src/effects/wobbly_model.js';

const create = () => new WobblyModel({friction: 3.5, springK: 3.8, mass: 70, sizeX: 900, sizeY: 600});
const simulate = (rate, duration = 250) => {
    const model = create();
    model.grab(400, 0);
    model.move(120, 30);
    for (let frame = 0; frame < rate * duration / 1000; frame++) model.step(1000 / rate / 12);
    return model;
};
const at60 = simulate(60), at144 = simulate(144);
const error = Math.max(...at60.objects.map((p, i) => Math.hypot(p.x - at144.objects[i].x, p.y - at144.objects[i].y)));
console.log(`Physics 60/144 Hz deviation: ${error.toFixed(6)} px`);
assert.ok(error < 0.01, 'Physics must depend on elapsed time, not number of frames');
const zero = create();
zero.grab(400, 0); zero.move(120, 30);
const before = JSON.stringify(zero.objects);
zero.step(0);
assert.equal(JSON.stringify(zero.objects), before, 'A zero duration frame must not advance physics');
const delayed = create();
delayed.grab(400, 0); delayed.move(120, 30);
delayed.step(100000);
assert.ok(delayed.objects.every(p => Number.isFinite(p.x) && Number.isFinite(p.y)));
for (let i = 0; i < 2000 && delayed.movement; i++) delayed.step(1);
assert.equal(delayed.movement, false, 'Physics must settle');
assert.ok(delayed.objects.every(p => Math.abs(p.forceX) < 1 && Math.abs(p.forceY) < 1), 'Pinned nodes must not accumulate forces');
console.log('PASS: refresh-independent physics, zero delta, bounded backlog and settling');

assert.equal(smoothPhase(-1), 0);
assert.equal(smoothPhase(2), 1);
for (let t = 0; t < 1; t += 0.01) assert.ok(smoothPhase(t + 0.01) >= smoothPhase(t));
assert.ok((smoothPhase(0.0001) - smoothPhase(0)) / 0.0001 < 0.001);
assert.ok((smoothPhase(1) - smoothPhase(0.9999)) / 0.0001 < 0.001);
console.log('PASS: continuous velocity at lamp phase boundaries');
