import Clutter from 'gi://Clutter';
import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import Shell from 'gi://Shell';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

const wait = ms => new Promise(resolve => GLib.timeout_add(GLib.PRIORITY_DEFAULT, ms, () => {
    resolve(); return GLib.SOURCE_REMOVE;
}));
const check = (value, message) => { if (!value) throw Error(message); };
const shot = async name => {
    const stream = Gio.File.new_for_path(`${GLib.getenv('DI_TEST_DIR')}/${name}.png`)
        .replace(null, false, Gio.FileCreateFlags.REPLACE_DESTINATION, null);
    await new Shell.Screenshot().screenshot(false, stream);
    stream.close(null);
};

async function exercise() {
    const e = Main.extensionManager.lookup('side-dock-gnome50@local');
    check(e.state === 1, 'Extension active');
    const d = e.stateObj;
    Main.overview.hide();
    await wait(600);
    const installed = d._appSystem.get_installed().filter(i => i.should_show())
        .map(i => d._appSystem.lookup_app(i.get_id())).filter(Boolean);
    check(installed.length > 6, 'Need test applications');
    // Only this isolated XDG profile is modified.
    d._favIds = installed.slice(0, 5).map(a => a.get_id());
    d._saveFavs();
    d._rebuildBar();
    d._syncAutoHide(false);
    check(d._root.translation_x === 48, 'Hidden edge');
    check(d._bar.get_n_children() === 5, 'No extra arrow/footer row');
    if (GLib.getenv('SIDE_TEST_MONITORS') === '2') {
        check(Main.layoutManager.monitors.length === 2, 'Two actual virtual monitors');
        await wait(400);
        // _rebuildBar may be finishing its normal geometry transition.
        d._syncAutoHide(false);
        const m = Main.layoutManager.primaryMonitor;
        const clip = d._root.get_clip();
        check(Math.abs(clip[2] - 6) < 0.1, 'Hidden content must be clipped to primary monitor');
        const picked = global.stage.get_actor_at_pos(Clutter.PickMode.REACTIVE,
            m.x + m.width + 15, d._root.y + d._root.height / 2);
        check(!picked || !d._root.contains(picked), 'Hidden apps must not capture clicks on second monitor');
        await shot('hidden-two-monitors');
        d._root.ease({translation_x: 0, duration: 220, mode: Clutter.AnimationMode.EASE_OUT_CUBIC});
        for (let i = 0; i < 10; i++) {
            await wait(25);
            const [cx, , cw] = d._root.get_clip();
            check(d._root.x + d._root.translation_x + cx + cw <= m.x + m.width + 0.1,
                'No leak during slide animation');
        }
    }
    d._root.translation_x = 0;
    await wait(400);
    check(d._handle.width <= 7 && d._handle.x === 0, 'Handle remains in inner margin, not over icons');
    await shot('compact');
    d._handle.emit('clicked', 1);
    await wait(450);
    check(d._open && d._grab && !d._handle.visible, 'Handle opens modal');
    check(d._root.translation_x === 0, 'Open panel stays visible');
    check(d._list.get_n_children() === d._groups(d._favApps()).length, 'Only favorite categories');
    check(d._list.width <= d._panel.width, 'No horizontal overflow');
    await shot('favorites');
    const card = d._list.get_first_child();
    const toggle = card.get_first_child();
    toggle.checked = false;
    toggle.emit('clicked', 1);
    check(!card.get_last_child().visible, 'Category can collapse');
    toggle.checked = true;
    toggle.emit('clicked', 1);
    check(card.get_last_child().visible, 'Category can expand');
    d._tabs.get('running').emit('clicked', 1);
    check(d._view === 'running', 'Running tab');
    d._switchView('add');
    d._relayout();
    check(d._view === 'add', 'Monitor relayout must not reset active view');
    const entry = d._entry;
    check(entry.visible, 'Search only on add view');
    check(d._list.get_n_children() === 1, 'Empty query has explanatory message, no catalog');
    const candidate = installed.find(a => !d._favIds.includes(a.get_id()));
    entry.set_text(candidate.get_name());
    await wait(200);
    check(d._findCandidates(entry.get_text()).some(a => a.get_id() === candidate.get_id()), 'Search candidate');
    await shot('add');
    d._toggleFav(candidate);
    check(d._favApps().length === 6 && d._bar.get_n_children() === 5, 'Pin six, compact still five');
    check(entry === d._entry, 'Pin/state refresh must not replace search field');
    d._switchView('favorites');
    const saved = d._favIds.slice();
    d._loadFavs();
    check(JSON.stringify(saved) === JSON.stringify(d._favIds), 'Favorites persisted');
    d._toggleFav(candidate);
    check(d._favApps().length === 5, 'Remove favorite');
    d._onEvent({type: () => Clutter.EventType.KEY_PRESS, get_key_symbol: () => Clutter.KEY_Escape});
    check(!d._open && !d._grab && !d._captureSignal, 'Escape releases modal');
    d._setOpen(true); d._setOpen(false); d._setOpen(true);
    await wait(500);
    check(d._panel.visible && !d._bar.visible, 'Rapid reopen leaves correct actors');
    d._onEvent({type: () => Clutter.EventType.BUTTON_PRESS, get_coords: () => [10, 700]});
    check(!d._open && !d._grab, 'Outside click dismisses');
    await wait(450);
    d._bar.get_first_child().emit('clicked', 3);
    check(d._open, 'Right-click app opens without launch');
    d._closeButton.emit('clicked', 1);
    check(!d._open && !d._grab, 'Close button');
    d._favIds = []; d._rebuildBar();
    check(d._geometry(false).h > 26, 'Empty bar remains reachable');
    d._setOpen(true);
    check(d._list.get_n_children() === 1, 'Empty favorites explanation');
    d.disable();
    check(d._sources.size === 0 && !d._grab && !d._root, 'Clean lifecycle');
    d.enable();
    d._setOpen(true);
    d._setOpen(false);
    await wait(400);
    return 'PASS: compact handle, categories, tabs, search, pin/remove/persistence, escape/outside/close, rapid reopen, lifecycle';
}

export async function run() {
    if (!GLib.getenv('DI_TEST_DIR')) throw Error('Isolated session only');
    let result;
    try { result = await exercise(); }
    catch (e) { result = `FAIL: ${e.message}\n${e.stack}`; }
    GLib.file_set_contents(`${GLib.getenv('DI_TEST_DIR')}/result.txt`, result);
}
