import Clutter from 'gi://Clutter';
import GLib from 'gi://GLib';

export async function testPointer(dash) {
    if (!GLib.getenv('DI_TEST_DIR')) throw new Error('Solo en sesión aislada');
    const wait = ms => new Promise(resolve => GLib.timeout_add(GLib.PRIORITY_DEFAULT, ms, () => {resolve(); return GLib.SOURCE_REMOVE;}));
    const input = global.stage.context.get_backend().get_default_seat().create_virtual_device(Clutter.InputDeviceType.POINTER_DEVICE);
    const apps = dash._box.get_children().map(item => item.child?._delegate).filter(app => app?._activate);
    const originals = apps.map(app => app._activate);
    const activated = [];
    for (const app of apps) app._activate = () => activated.push(app);
    const move = async (x, y) => {
        for (let attempt = 0; attempt < 10; attempt++) {
            input.notify_absolute_motion(GLib.get_monotonic_time(), x, y);
            await wait(50);
            const [px, py] = global.get_pointer();
            if (Math.abs(px - x) < 1 && Math.abs(py - y) < 1) return;
        }
        throw new Error(`El puntero virtual no alcanzó el Dock: destino ${x},${y}; actual ${global.get_pointer()}`);
    };
    try {
        for (const app of [apps[0], apps.at(-1)]) {
            const [x, y] = app.get_transformed_position();
            const [w, h] = app.get_transformed_size();
            await move(x + w / 2, y + h / 2);
            await wait(400);
            const [vx, vy] = app.icon._iconBin.get_transformed_position();
            const [vw, vh] = app.icon._iconBin.get_transformed_size();
            await move(vx + vw / 2, vy + vh * 0.2);
            await wait(80);
            input.notify_button(GLib.get_monotonic_time(), Clutter.BUTTON_PRIMARY, Clutter.ButtonState.PRESSED);
            await wait(60);
            input.notify_button(GLib.get_monotonic_time(), Clutter.BUTTON_PRIMARY, Clutter.ButtonState.RELEASED);
            await wait(150);
            if (activated.at(-1) !== app) throw new Error(`Clic ampliado no activa ${app.name}`);
            await move(10, 100); await wait(500);
        }
        const before = activated.length;
        const app = apps[0];
        const [x, y] = app.get_transformed_position();
        const [w, h] = app.get_transformed_size();
        await move(x + w / 2, y + h / 2);
        input.notify_button(GLib.get_monotonic_time(), Clutter.BUTTON_PRIMARY, Clutter.ButtonState.PRESSED);
        await wait(100);
        for (let step = 1; step <= 8; step++) await move(x + w / 2 + step * 8, y + h / 2 - step * 8);
        if (!dash._magnification._suspended.has('drag')) throw new Error('Arrastre no suspende la lente');
        input.notify_button(GLib.get_monotonic_time(), Clutter.BUTTON_PRIMARY, Clutter.ButtonState.RELEASED);
        await wait(500);
        if (dash._magnification._suspended.has('drag') || activated.length !== before)
            throw new Error('Arrastre deja suspensión o activa la app');
        await move(10, 100); await wait(700);
    } finally {
        apps.forEach((app, index) => { app._activate = originals[index]; });
        input.run_dispose();
    }
}
