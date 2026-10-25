import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source = fs.readFileSync(new URL('./extension.js', import.meta.url), 'utf8')
    .replace(/^import .*;\n/gm, '').replace('export default class', 'class');
const context = vm.createContext({Extension: class {}});
vm.runInContext(`${source}\nglobalThis.Dock = SideDock;`, context);
const dock = Object.create(context.Dock.prototype);
const app = (id, name, categories) => ({get_id: () => id, get_name: () => name,
    get_app_info: () => ({get_categories: () => categories})});
const music = app('music', 'Música', 'AudioVideo;');
const editor = app('editor', 'Editor', 'Development;');
const hidden = app('hidden', 'No favorita', 'Utility;');
const apps = [music, editor, hidden];
dock._favIds = ['music', 'editor', 'missing'];
dock._appSystem = {lookup_app: id => apps.find(a => a.get_id() === id),
    get_installed: () => {throw Error('No catalog enumeration in normal panel');}};
const groups = dock._groups(dock._favApps());
assert.deepEqual(Array.from(groups, ([name, list]) => [name, Array.from(list, a => a.get_id())]),
    [['Multimedia', ['music']], ['Desarrollo', ['editor']]]);
assert.equal(dock._findCandidates('').length, 0, 'Empty query never loads catalog');
assert.equal(dock._findCandidates('m').length, 0, 'Require two characters');
dock._appSystem.get_installed = () => apps.map(a => ({get_id: a.get_id,
    should_show: () => true}));
assert.deepEqual(Array.from(dock._findCandidates('no'), a => a.get_id()), ['hidden']);
assert.equal(dock._findCandidates('MUSICA').length, 0, 'Already pinned apps excluded');
dock._favIds = [];
assert.deepEqual(Array.from(dock._findCandidates('musica'), a => a.get_id()), ['music'], 'Accent-insensitive search');
dock._favIds = Array.from({length: 8}, (_, i) => `app${i}`);
dock._appSystem.lookup_app = id => app(id, id, 'Utility;');
assert.equal(dock._favApps().length, 8, 'Expanded panel retains favorites beyond five');
console.log('PASS: categories contain only selected apps; bounded opt-in search; >5 favorites');
