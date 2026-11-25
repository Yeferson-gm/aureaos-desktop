import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const sources = new Map();
let sourceId = 0, signalId = 0, frames = 0;
const context = vm.createContext({GLib: {
    PRIORITY_DEFAULT: 0, SOURCE_CONTINUE: true, SOURCE_REMOVE: false,
    timeout_add: (_priority, _interval, fn) => { sources.set(++sourceId, fn); return sourceId; },
    source_remove: id => { assert.ok(sources.delete(id), 'Source removed once'); },
}});
const source = fs.readFileSync(new URL('../source/lib/base.js', import.meta.url), 'utf8')
    .replace(/^import .*;\n/gm, '').replace(/^export /gm, '');
vm.runInContext(source + '\nglobalThis.WidgetBase = WidgetBase;', context);
const actor = {mapped: false, signals: new Map(),
    connect(signal, fn) { this.signals.set(++signalId, {signal, fn}); return signalId; },
    disconnect(id) { assert.ok(this.signals.delete(id), 'Signal removed once'); },
    emit(signal) { for (const entry of [...this.signals.values()]) if (entry.signal === signal) entry.fn(); },
};
const widget = new context.WidgetBase({});
widget.cadaVisible(actor, 50, () => frames++);
assert.equal(sources.size, 0, 'No wakeups while hidden');
for (let i = 0; i < 100; i++) {
    actor.mapped = true; actor.emit('notify::mapped'); actor.emit('notify::mapped');
    assert.equal(sources.size, 1, 'Repeated notify must not duplicate timer');
    const previous = frames;
    [...sources.values()][0]();
    assert.equal(frames, previous + 1);
    actor.mapped = false; actor.emit('notify::mapped');
    assert.equal(sources.size, 0);
}
actor.mapped = true; actor.emit('notify::mapped');
actor.emit('destroy');
assert.equal(widget._visualTimers.size, 0);
assert.equal(sources.size, 0);
assert.equal(actor.signals.size, 0);
widget.cadaVisible(actor, 50, () => frames++);
widget.destruir(); widget.destruir();
assert.equal(sources.size, 0);
assert.equal(actor.signals.size, 0);
console.log('PASS: visual timers pause/resume, 100 cycles, actor destruction and idempotent cleanup');
