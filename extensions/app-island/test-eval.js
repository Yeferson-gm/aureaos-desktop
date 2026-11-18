import Clutter from 'gi://Clutter';
import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import Shell from 'gi://Shell';
import St from 'gi://St';
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
        check(!d._statistics.open && !d._statistics.actor.visible, 'Statistics remain hidden without hover');
        const apps = d._appSystem.get_installed().filter(i => i.should_show()).map(i => d._appSystem.lookup_app(i.get_id())).filter(Boolean);
        check(apps.length >= 2, 'Test needs two applications');
        d._setOpen(true); await wait(400);
        check(d._open && d._grab, 'Panel modal');
        const assertPanelGeometry = () => {
            const scale = St.ThemeContext.get_for_stage(global.stage).scale_factor;
            const [rx,ry] = d._root.get_transformed_position();
            for (const child of d._panel.get_children().filter(actor => actor.visible)) {
                const [x,y] = child.get_transformed_position();
                const [w,h] = child.get_transformed_size();
                check(x >= rx + 20*scale && x+w <= rx+d._root.width-20*scale+1, 'Panel horizontal padding');
                check(y >= ry+20*scale && y+h <= ry+d._root.height-20*scale+1, 'Panel vertical padding');
            }
            const [,hy] = d._heading.get_transformed_position(), [,sy] = d._search.get_transformed_position();
            check(sy >= hy+d._heading.height+8*scale, 'Search separated from heading');
            check(d._search.get_primary_icon(), 'Native search icon');
        };
        assertPanelGeometry();
        d._interface.set_double('text-scaling-factor', 1.25); await wait(350); assertPanelGeometry();
        d._interface.set_double('text-scaling-factor', 1); await wait(350);

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
        check(!d._statistics.open && !d._statistics.actor.visible, 'Appearance changes do not open statistics');
        const lightThemeFile = Gio.File.new_for_path(`${dir}/light-foreground.css`);
        GLib.file_set_contents(lightThemeFile.get_path(), 'stage { color: #242832; }');
        const shellTheme = St.ThemeContext.get_for_stage(global.stage).get_theme();
        shellTheme.load_stylesheet(lightThemeFile);
        const probe = new St.Label({text: 'Theme probe'}); Main.uiGroup.add_child(probe);
        check(probe.get_theme_node().get_foreground_color().red < 100, 'Light theme regression fixture'); probe.destroy();
        const assertWhite = actor => {
            const color = actor.get_theme_node().get_foreground_color();
            check(color.red >= 230 && color.green >= 230 && color.blue >= 230, `Readable foreground: ${actor.style_class}`);
        };
        d._statistics.show(true); await wait(3300);
        Object.values(d._statistics.stripValues).forEach(assertWhite);
        check(!d._statistics.scroll.vscrollbar_visible, 'Statistics scrollbar hidden');
        check(d._statistics.data.memory?.total > 0 && d._statistics.data.disk?.total > 0, 'Real memory and filesystem readings');
        check(/\d+%/.test(d._statistics.values.cpu.text), 'Live CPU statistics');
        check(d._statistics.timer, 'Visible statistics refresh');
        check(d._statistics.history.upload?.length > 0 && d._statistics.history.network?.length > 0, 'Separate upload and download histories');
        check(d._statistics.data.cores > 0, 'Detected processor threads');
        d._statistics.pin.emit('clicked', 1);
        check(d._statistics.pinned && d._statistics.pin.has_style_class_name('ai-selected'), 'Pin has visible and accessible state');
        d._statistics.pin.emit('clicked', 1);
        const statsStream = Gio.File.new_for_path(`${dir}/statistics.png`).replace(null, false, Gio.FileCreateFlags.NONE, null);
        await new Shell.Screenshot().screenshot(false, statsStream); statsStream.close(null);
        for (const page of ['cpu', 'memory', 'disk', 'network', 'battery', 'uptime']) {
            d._statistics.select(page); await wait(180);
            assertWhite(d._statistics.title); assertWhite(d._statistics.hero);
            d._statistics.details.get_children().filter(row => row.has_style_class_name('ai-stat-detail')).forEach(row => assertWhite(row.get_last_child()));
            check(d._statistics.hero.text.length > 0, 'Statistics detail ' + page);
        }
        d._statistics.select('cpu'); await wait(180);
        const detailStream = Gio.File.new_for_path(`${dir}/statistics-detail.png`).replace(null, false, Gio.FileCreateFlags.NONE, null);
        await new Shell.Screenshot().screenshot(false, detailStream); detailStream.close(null);
        d._statistics.show(false); check(!d._statistics.timer && !d._statistics.capture, 'Hidden statistics stop polling and event capture');
        shellTheme.unload_stylesheet(lightThemeFile);
        const resourceDir = `${dir}/resources`; GLib.mkdir_with_parents(resourceDir, 448);
        GLib.file_set_contents(`${resourceDir}/example.txt`, 'Aurea fixture');
        d._addResource(resourceDir);
        const folder = d._model.profile.items.find(i => i.target === Gio.File.new_for_path(resourceDir).get_uri());
        check(folder, 'Folder favorite'); d._folder(folder); await wait(300);
        check(d._popup, 'Folder contents panel'); d._clearPopup();
        St.Clipboard.get_default().set_content(St.ClipboardType.CLIPBOARD, 'x-special/gnome-copied-files', new GLib.Bytes(new TextEncoder().encode(`copy\n${Gio.File.new_for_path(resourceDir + '/example.txt').get_uri()}`)));
        d._pasteFiles(); await wait(300);
        check(d._model.profile.items.some(i => i.target.endsWith('/example.txt')), 'Copied file favorite');
        d._setOpen(false); await wait(300); d._reveal(true, false); await wait(100);
        const anchor = d._bar.get_last_child();
        d._quickPreview.folder(folder, anchor); await wait(500);
        check(d._quickPreview.entries?.length === 1, 'Hover folder grid');
        GLib.file_set_contents(`${resourceDir}/second.txt`, 'Updated fixture'); await wait(650);
        check(d._quickPreview.entries?.length === 2, 'Folder monitor refresh');
        d._quickPreview.search.set_text('second'); await wait(80);
        check(d._quickPreview.body.get_first_child().get_children().filter(actor => actor instanceof St.Button).length === 1, 'Folder search');
        const previewStream = Gio.File.new_for_path(`${dir}/folder-preview.png`).replace(null, false, Gio.FileCreateFlags.NONE, null);
        await new Shell.Screenshot().screenshot(false, previewStream); previewStream.close(null);
        const group = d._model.profile.categories.find(c => c.id === folder.category);
        d._quickPreview.group(group, anchor); check(d._quickPreview.actor && d._quickPreview.groupId === group.id, 'Group preview');
        d._quickPreview.close(); check(!d._quickPreview.capture && !d._quickPreview.monitor, 'Preview cleanup');
        d._quickPreview.folder(folder, anchor); d._quickPreview.close(); await wait(150);
        d._reveal(true, false);
        const railStream = Gio.File.new_for_path(`${dir}/rail.png`).replace(null, false, Gio.FileCreateFlags.NONE, null);
        await new Shell.Screenshot().screenshot(false, railStream); railStream.close(null);
        d._setOpen(true);
        d._switch('settings'); await wait(200); check(d._list.get_n_children() > 10, 'Live settings');
        const showStats = d._list.get_children().find(actor => actor.accessible_name === 'Ver estadísticas');
        showStats.emit('clicked', 1); await wait(250);
        check(d._statistics.open && !d._grab, 'Settings opens statistics without a modal grab');
        d._statistics.show(false); d._setOpen(true);
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
