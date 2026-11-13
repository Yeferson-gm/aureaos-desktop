import Clutter from 'gi://Clutter';
import GLib from 'gi://GLib';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

export async function testWindows(manager) {
    if (!GLib.getenv('DI_TEST_DIR')) throw new Error('Solo en sesión aislada');
    const wait = ms => new Promise(resolve => GLib.timeout_add(GLib.PRIORITY_DEFAULT, ms, () => {resolve(); return GLib.SOURCE_REMOVE;}));
    const windows = global.get_window_actors().map(actor => actor.meta_window).filter(window => window.title.startsWith('Aurea Dock fixture'));
    if (windows.length !== 2) throw new Error('Faltan ventanas sintéticas');
    const app = manager.mainDock.dash._box.get_children().map(item => item.child?._delegate).find(item => item?.app?.get_id() === 'org.aurea.DockFixture.desktop');
    if (!app) throw new Error('Falta icono de las ventanas sintéticas');
    manager.settings.set_string('click-action', 'minimize');
    Main.activateWindow(windows[0]); await wait(300);
    app._activate({button: Clutter.BUTTON_PRIMARY, modifiers: 0}); await wait(300);
    if (!windows.every(window => window.minimized)) throw new Error('El clic no minimiza las ventanas');
    app._activate({button: Clutter.BUTTON_PRIMARY, modifiers: 0}); await wait(300);
    if (windows.some(window => window.minimized)) throw new Error('El clic no restaura las ventanas');
    manager.settings.set_boolean('dock-fixed', false);
    manager.settings.set_boolean('autohide', true);
    manager.settings.set_boolean('require-pressure-to-show', false);
    manager.settings.set_boolean('intellihide', true);
    manager.settings.set_string('intellihide-mode', 'MAXIMIZED_WINDOWS');
    const pointer = global.stage.context.get_backend().get_default_seat().create_virtual_device(Clutter.InputDeviceType.POINTER_DEVICE);
    try {
        pointer.notify_absolute_motion(GLib.get_monotonic_time(), 10, 100);
        Main.activateWindow(windows[0]);
        windows[0].maximize();
        for (let attempt = 0; attempt < 60 && manager.mainDock._slider.slide_x > 0.01; attempt++) await wait(100);
        if (manager.mainDock._slider.slide_x > 0.01) throw new Error(`Dock visible sobre ventana maximizada: ${JSON.stringify({max: windows[0].is_maximized(), hover: manager.mainDock._box.hover, menu: manager.mainDock._menuOpened, required: manager.mainDock.dash.requiresVisibility, overlap: manager.mainDock._intellihide.getOverlapStatus()})}`);
        const monitor = Main.layoutManager.monitors[manager.mainDock.monitorIndex];
        pointer.notify_absolute_motion(GLib.get_monotonic_time(), monitor.x + monitor.width / 2, monitor.y + monitor.height - 1);
        await wait(1000);
        if (manager.mainDock._slider.slide_x < 0.99) throw new Error('El borde no revela el Dock');
        pointer.notify_absolute_motion(GLib.get_monotonic_time(), 10, 100);
        windows[0].unmaximize();
        await wait(600);
    } finally { pointer.run_dispose(); }
}
