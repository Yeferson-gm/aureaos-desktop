import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source = fs.readFileSync(new URL('../source/widgets/fotos.js', import.meta.url), 'utf8')
    .replace(/^import .*;\n/gm, '').replace(/^export /gm, '');
let files = [{path: '/Pictures/a.jpg', album: ''}];
const scans = [];
const context = vm.createContext({WidgetBase: class {},
    dirImagenes: () => '/Pictures',
    listarImagenes: (...args) => { scans.push(args); return [...files]; },
    uriDe: p => p,
});
vm.runInContext(`${source}\nglobalThis.api = {fotosDe, Widget, META};`, context);
const {fotosDe, Widget, META} = context.api;
assert.equal(fotosDe('/Other')[0].path, '/Pictures/a.jpg');
assert.equal(scans[0][0], '/Pictures', 'Ignore external folder overrides');
assert.equal(scans[0][1], 0, 'Never recurse into screenshots or albums');
files = [];
assert.equal(fotosDe().length, 0, 'Deleted images must not remain in the list');
assert.ok(!META.opciones.some(o => ['album','carpeta'].includes(o.k)));
const widget = new Widget();
Object.assign(widget, {_lista: [], _i: 0, o: {}, pal: {texto: '#fff'},
    _a: {style: 'deleted.jpg', opacity: 255, remove_all_transitions() {}},
    _b: {style: 'deleted.jpg', opacity: 255, remove_all_transitions() {}},
    _txt: {style: ''}, _etq: {}, _cor: {},
});
widget._mostrar(false);
assert.equal(widget._a.style, '');
assert.equal(widget._b.style, '', 'Clear both cross-fade layers');
let closed = false;
widget._lista = [{path: '/Pictures/a.jpg'}];
widget._visorPath = '/Pictures/a.jpg';
widget._hoja = {cerrar() { closed = true; }};
widget._a.style = widget._b.style = 'deleted.jpg';
widget._armar = () => [];
widget._actualizarLista();
assert.equal(widget._lista.length, 0);
assert.equal(widget._a.style, '');
assert.equal(widget._b.style, '');
assert.ok(closed, 'Close a viewer whose file was deleted');
widget._armar = () => [{path: '/Pictures/new.jpg'}];
widget._actualizarLista();
assert.equal(widget._lista[0].path, '/Pictures/new.jpg', 'Recover from an empty folder');
console.log('PASS: Pictures only, no recursion/cache, both image layers cleared');

widget._vivo = true;
widget.movimiento = true;
widget.o = {modo: 'aleatoria', ajuste: 'cover', etiqueta: true};
widget.ctx = {radio: 12};
widget.datos = {fotosFav: []};
widget._frente = widget._a;
const callbacks = [];
for (const actor of [widget._a, widget._b]) actor.ease = options => { if (options.onComplete) callbacks.push(options.onComplete); };
widget._mostrar(true);
assert.equal(callbacks.length, 1);
callbacks.shift()();
assert.equal(widget._a.style, '', 'Release the outgoing texture after fading');
widget._mostrar(true);
const interrupted = callbacks.shift();
widget._mostrar(true);
const currentStyle = widget._b.style;
interrupted();
assert.equal(widget._b.style, currentStyle, 'Late fade callback must preserve the current photo');
console.log('PASS: crossfade releases old photo without clearing the current layer');
