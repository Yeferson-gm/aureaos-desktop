import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const file = process.argv[2] ?? '/home/yefersongm/.local/share/gnome-shell/extensions/gtk4-ding@smedius.gitlab.com/app/contentReader.js';
const code = fs.readFileSync(file,'utf8').replace(/^import .*;$/gm,'').replace(/^export .*;$/gm,'');
const context = vm.createContext({
    Gdk:{FileList:{$gtype:'FileList',new_from_array:files => ({get_files:()=>files})}},
    Gio:{File:{new_for_uri:uri=>({get_uri:()=>uri})}},
    GLib:{Uri:{list_extract_uris:text=>text.trim().split(/\r?\n/)}},
    Enums:{DndOfferRoute:{INTERNAL_DESKTOP_ITEMS:'internal'},DndTargetInfo:{DING_ICON_LIST:'x-special/ding-icon-list'},DropContentsType:{FILE_REFERENCES:'files'}},
});
const Reader = vm.runInContext(code+'\nContentReader',context);
for(const uri of ['file:///tmp/Carpeta%20prueba','trash:///']) {
    const reader = new Reader({read_value_async(){throw new Error('No hay formatos compatibles');}},{route:'internal'},null);
    reader._readText = async mime => {assert.equal(mime,'x-special/ding-icon-list');return uri+'\r\n';};
    const result=await reader.readContents();
    assert.equal(result.format,'x-special/ding-icon-list');
    assert.equal(result.references.get_files()[0].get_uri(),uri);
}
console.log('PASS: arrastre interno normal y especial; conserva contrato Gdk.FileList');
