import Clutter from 'gi://Clutter';
import GLib from 'gi://GLib';
export async function testPointer(d, wait) {
    if (!GLib.getenv('DI_TEST_DIR')) throw Error('Isolated session only');
    const pointer = global.stage.context.get_backend().get_default_seat().create_virtual_device(Clutter.InputDeviceType.POINTER_DEVICE);
    const move = async (x, y) => {
        for (let i = 0; i < 10; i++) {
            pointer.notify_absolute_motion(GLib.get_monotonic_time(), x, y); await wait(50);
            const [px, py] = global.get_pointer(); if (Math.abs(px - x) < 2 && Math.abs(py - y) < 2) return;
        }
        throw Error('Pointer did not reach island');
    };
    const click = async (actor, mouse = Clutter.BUTTON_PRIMARY) => {
        const [x, y] = actor.get_transformed_position(), [w, h] = actor.get_transformed_size();
        await move(x + w / 2, y + h / 2);
        pointer.notify_button(GLib.get_monotonic_time(), mouse, Clutter.ButtonState.PRESSED); await wait(60);
        pointer.notify_button(GLib.get_monotonic_time(), mouse, Clutter.ButtonState.RELEASED); await wait(300);
    };
    try {
        d._setOpen(true); d._switch('favorites'); await wait(400);
        const [, top] = d._scroll.get_transformed_position();
        const [, height] = d._scroll.get_transformed_size();
        const first = [...d._rows.values()].find(r => {
            if (!r.actor.get_parent()) return false;
            const [, y] = r.launch.get_transformed_position();
            return y >= top && y + r.launch.height <= top + height;
        });
        if (!first) throw Error('No visible favorite for pointer test');
        await click(first.launch, Clutter.BUTTON_SECONDARY);
        if (!d._popup) throw Error('Right click did not open actions');
        const close = d._popup.get_first_child().get_last_child(); await click(close);
        if (d._popup) throw Error('Actions close did not respond');
        d._setOpen(false); await wait(450); d._reveal(true, false); await wait(50);
        const folder = d._model.profile.items.find(item => item.target.endsWith('/resources'));
        folder.quick = true; folder.quickOrder = -1; d._renderBar(); d._layout(); d._reveal(true, false);
        await wait(150);
        const anchor = d._bar.get_first_child();
        const [ax, ay] = anchor.get_transformed_position();
        await move(ax + anchor.width / 2, ay + anchor.height / 2); await wait(500);
        if (!d._quickPreview.actor) throw Error('Folder hover did not open preview');
        const panel = d._quickPreview.actor, [px, py] = panel.get_transformed_position();
        await move(px + panel.width / 2, py + 35); await wait(600);
        if (!d._quickPreview.actor) throw Error('Preview closed while entering it');
        await move(640, 40); await wait(650);
        if (d._quickPreview.actor || d._quickPreview.capture) throw Error('Preview did not close on pointer exit');
        d._reveal(true, false); await wait(100);
        await click(d._handle);
        if (!d._open || !d._grab) throw Error('Handle click did not open island');
        await click(d._panel.get_first_child().get_last_child());
        if (d._open || d._grab) throw Error('Panel close did not release input');
    } finally { pointer.run_dispose(); }
}
