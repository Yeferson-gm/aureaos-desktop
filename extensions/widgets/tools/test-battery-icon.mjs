import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source = fs.readFileSync(new URL('../source/widgets/baterias.js', import.meta.url), 'utf8')
    .replace(/^import .*;\n/gm, '').replace(/^export /gm, '');
let calls;
class DrawingArea {
    constructor(props) { Object.assign(this, props); }
    connect(_, fn) { this.paint = fn; }
    get_surface_size() { return [this.width, this.height]; }
    get_context() { return new Proxy({}, {get: (_, key) => (...args) => calls.push([key, ...args])}); }
}
const context = vm.createContext({St: {DrawingArea}, WidgetBase: class {}, Clutter: {ActorAlign: {}}});
vm.runInContext(`${source}\nglobalThis.Widget = Widget;`, context);
const widget = new context.Widget();
widget.pal = {rgb: {texto: [1, 1, 1]}};
for (const state of [1, 2, 4, 5, 6]) {
    calls = [];
    widget._anillo({estado: state, pct: 80}, 96).paint();
    assert.ok(calls.some(c => c[0] === 'fill'), `State ${state}: missing central glyph`);
    if (state !== 1) assert.ok(calls.some(c => c[0] === 'rectangle'), 'Non-charging state must show battery');
}
console.log('PASS: charging bolt and battery for discharging/full/pending states');
