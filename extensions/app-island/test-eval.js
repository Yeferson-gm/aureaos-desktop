import Clutter from 'gi://Clutter';
import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import Shell from 'gi://Shell';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
const wait = ms => new Promise(resolve => GLib.timeout_add(GLib.PRIORITY_DEFAULT, ms, () => { resolve(); return GLib.SOURCE_REMOVE; }));
const check = (value, text) => { if (!value) throw Error(text); };
export async function run() {
    const dir = GLib.getenv('DI_TEST_DIR'); if (!dir) throw Error('Isolated session only');
    let result;
    try {
        const ext = Main.extensionManager.lookup('side-dock-gnome50@local');
        check(ext?.state === 1, `Active extension: ${ext?.error}`);
        const d = ext.stateObj;
        Main.overview.hide(); await wait(400);
        const apps = d._appSystem.get_installed().filter(i => i.should_show()).map(i => d._appSystem.lookup_app(i.get_id())).filter(Boolean);
        check(apps.length >= 2, 'Test needs two applications');
        d._setOpen(true); await wait(400);
        check(d._open && d._grab, 'Panel modal');
        d._addApp(apps[0]); d._addApp(apps[1]); d._addApp(apps[0]);
        check(d._model.profile.items.filter(i => i.target === apps[0].get_id()).length === 1, 'No duplicate favorite');
        d._switch('favorites'); await wait(250);
        const item = d._model.profile.items[0];
        const row = d._rows.get(item.id); row.launch.grab_key_focus();
        d._updateStates(); check(d._rows.get(item.id) === row && row.launch.has_key_focus(), 'Stable row and focus on app state');
        const category = d._model.category('Prueba'); d._model.move(item.id, category); d._save(); d._render();
        check(d._model.profile.items.find(i => i.id === item.id).category === category, 'Category move');
        d._actions(item); check(d._popup, 'Context actions'); d._clearPopup();
        d._change(() => d._model.remove(item.id)); d._change(() => d._model.restore());
        check(d._model.profile.items.some(i => i.id === item.id), 'Undo');
        for (const theme of ['light', 'dark']) {
            d._change(() => { d.settings.theme = theme; }); await wait(350);
            const stream = Gio.File.new_for_path(`${dir}/${theme}.png`).replace(null, false, Gio.FileCreateFlags.NONE, null);
            await new Shell.Screenshot().screenshot(false, stream); stream.close(null);
        }
        d._switch('settings'); await wait(200); check(d._list.get_n_children() > 10, 'Live settings');
        d._switch('add'); d._search.set_text('zzzz-not-an-app'); await wait(150); check(d._candidates().length === 0, 'Bounded search');
        d._switch('favorites');
        for (let i = 0; i < 15; i++) { d._setOpen(false); d._setOpen(true); }
        await wait(400); check(d._open && d._panel.visible && d._grab, 'Interruptible reopen');
        d._event({type: () => Clutter.EventType.KEY_PRESS, get_key_symbol: () => Clutter.KEY_Escape});
        check(!d._open && !d._grab, 'Escape releases input');
        d._setOpen(true); d._event({type: () => Clutter.EventType.BUTTON_PRESS, get_coords: () => [-100, -100]});
        check(!d._open && !d._grab, 'Outside closes');
        const {testPointer} = await import(`file://${d.path}/test-pointer.js`);
        await testPointer(d, wait);
        d.disable(); check(!d._root && d._sources.size === 0, 'Complete cleanup'); d.enable();
        result = 'PASS: migration, favorites, categories, undo, stable focus, themes, settings, search, interruption, real pointer, close and lifecycle';
    } catch (e) { result = `FAIL: ${e.message}\n${e.stack}`; }
    GLib.file_set_contents(`${dir}/result.txt`, result);
}
