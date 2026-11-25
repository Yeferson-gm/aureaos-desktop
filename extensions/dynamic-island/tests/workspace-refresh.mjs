import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const context = vm.createContext({WorkspaceEditor: class {}});
const code = fs.readFileSync(new URL('../workspace.js', import.meta.url), 'utf8')
    .replace(/^import .*;\n/gm, '').replace(/^export \{.*;\n/gm, '').replace(/^export /gm, '');
vm.runInContext(code + '\nglobalThis.Workspace = IslandWorkspace;', context);
let created = 0, cleared = 0, selected;
const island = {_live: {entries: [{text: 'Timer', page: 'clock', icon: 'clock-symbolic'}]},
    _chip: (text, action, icon) => { created++; return {text, action, icon, add_style_class_name() {}}; },
    _selectTab: page => { selected = page; },
};
const workspace = new context.Workspace(island);
workspace.date = {};
workspace.cards = [];
workspace.summaries = () => ({});
workspace.renderPeek = () => {};
workspace.liveBox = {children: [], destroy_all_children() { cleared++; this.children = []; }, add_child(actor) { this.children.push(actor); }};
workspace.refresh();
const first = workspace.liveBox.children[0];
for (let i = 0; i < 100; i++) workspace.refresh();
assert.equal(created, 1);
assert.equal(cleared, 1);
assert.equal(workspace.liveBox.children[0], first);
first.action(); assert.equal(selected, 'clock');
island._live.entries[0].text = 'Timer updated';
workspace.refresh();
assert.equal(created, 2);
assert.equal(workspace.liveBox.children[0].text, 'Timer updated');
island._live.entries[0].page = 'music';
workspace.refresh(); workspace.liveBox.children[0].action();
assert.equal(selected, 'music');
workspace.cards = [{id:'music', title:{}, value:{}}];
workspace.refresh(); assert.equal(workspace.liveBox.children.length, 0);
island._live.entries = [];
workspace.refresh(); assert.equal(workspace.liveBox.children.length, 0);
console.log('PASS: 100 unchanged refreshes reuse actors; content, actions and filters update');
