import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

// Run the actual desktop controller with a deterministic compositor frame queue.
const beforePaint = [];
const idle = [];
const source = fs.readFileSync(new URL('../source/lib/escritorio.js', import.meta.url), 'utf8')
    .replace(/^import .*;\n/gm, '').replace('export class Escritorio', 'class Escritorio');
const context = vm.createContext({
    Clutter: {}, GObject: {registerClass: c => c}, PanelMenu: {Button: class {}},
    GLib: {PRIORITY_LOW: 300, SOURCE_REMOVE: false, idle_add: (_, cb) => idle.push(cb)},
    Meta: {LaterType: {BEFORE_REDRAW: 1}},
    global: {compositor: {get_laters: () => ({add: (_, cb) => beforePaint.push(cb)})}},
});
vm.runInContext(`${source}\nglobalThis.Controller = Escritorio;`, context);
const core = new context.Controller({});
let corrected = 0;
core.colocar = () => corrected++;
for (let i = 0; i < 100; i++) core._pedirColocar();
for (const callback of beforePaint) callback();
assert.equal(corrected, 1, 'Stacking must be corrected once BEFORE the next paint, not at idle');
assert.equal(idle.length, 0, 'No low-priority correction may be starved by animations');
console.log('PASS: 100 restacks coalesced before paint');
