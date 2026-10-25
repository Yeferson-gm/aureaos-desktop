import assert from 'node:assert/strict';
import {ActivityQueue, springProgress} from '../activities.js';
let time = 0;
const queue = new ActivityQueue(() => time);
queue.push({key: 'volume', text: '10%', ms: 2000});
queue.push({key: 'timer', warn: true, ms: 1000});
queue.push({key: 'volume', text: '80%', ms: 3000});
assert.equal(queue.current.key, 'timer');
assert.equal(queue.entries.length, 2);
time = 1001;
assert.equal(queue.current.text, '80%');
time = 3001;
assert.equal(queue.current, null);
for (let i = 0; i < 20; i++) queue.push({key: String(i)});
assert.equal(queue.entries.length, 8);
queue.clear();
assert.equal(queue.current, null);
assert.equal(springProgress(0), 0);
assert.equal(springProgress(1), 1);
let previous = 0;
for (let i = 0; i <= 100; i++) {
    const value = springProgress(i / 100);
    assert.ok(value >= previous && value <= 1);
    previous = value;
}
console.log('Actividades: prioridad, agrupación, caducidad, límite y resorte verificados.');
