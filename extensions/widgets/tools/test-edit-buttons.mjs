import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
class Actor {
    constructor(props = {}) { Object.assign(this, props); this.children = []; this.handlers = {}; }
    add_child(a) { this.children.push(a); }
    connect(signal, fn) { this.handlers[signal] = fn; }
    contains(a) { return a === this || this.children.some(c => c.contains(a)); }
}
const source = fs.readFileSync(new URL('../source/lib/marco.js', import.meta.url), 'utf8')
    .replace(/^import .*;\n/gm, '').replace('export class Marco', 'class Marco');
let picked;
const context = vm.createContext({global: {stage: {get_actor_at_pos: () => picked}}, St: {Widget: Actor, BoxLayout: Actor, Button: Actor},
    Clutter: {BinLayout: class {}, EVENT_STOP: true, EVENT_PROPAGATE: false,
        BUTTON_PRIMARY: 1, ActorAlign: {}, PickMode: {REACTIVE: 1}},
});
vm.runInContext(`${source}\nglobalThis.Marco = Marco;`, context);
const frame = Object.create(context.Marco.prototype);
let drags = 0;
const actions = [];
frame.core = Object.fromEntries(['quitar','abrirAjustes','alternarEstilo','duplicar'].map(k => [k, () => actions.push(k)]));
frame.cfg = {id: 'test'};
frame._iniciarDrag = () => drags++;
const layer = frame._crearCapa();
for (const button of frame._barra.children) {
    picked = button;
    const result = layer.handlers['button-press-event'](layer, {get_button: () => 1, get_coords: () => [0, 0]});
    assert.equal(result, false, 'Toolbar clicks must not start dragging');
    assert.equal(button.reactive, true, 'Toolbar buttons must accept pointer input');
    button.handlers.clicked();
}
assert.equal(drags, 0);
assert.equal(actions.join(','), 'quitar,abrirAjustes,alternarEstilo,duplicar');
picked = layer;
layer.handlers['button-press-event'](layer, {get_button: () => 1, get_coords: () => [0, 0]});
assert.equal(drags, 1, 'Widget body must remain draggable');
console.log('PASS: four edit buttons and independent drag region');
