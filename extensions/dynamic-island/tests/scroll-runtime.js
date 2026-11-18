import Clutter from 'gi://Clutter';
import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import St from 'gi://St';

export async function testScroll(scroll, wait) {
    if (!GLib.getenv('DI_TEST_DIR')) throw Error('Isolated session only');
    console.log('Scroll: iniciar prueba con puntero virtual');
    const pointer = global.stage.context.get_backend().get_default_seat().create_virtual_device(Clutter.InputDeviceType.POINTER_DEVICE);
    const adjustment = scroll.vadjustment;
    const settings = new Gio.Settings({schema_id: 'org.gnome.desktop.interface'});
    const animations = settings.get_boolean('enable-animations');
    const effectiveAnimations = St.Settings.get().enable_animations;
    console.log(`Scroll: animaciones efectivas=${effectiveAnimations}`);
    try {
        const [x,y] = scroll.get_transformed_position();
        for (let attempt = 0; attempt < 10; attempt++) {
            pointer.notify_absolute_motion(GLib.get_monotonic_time(), x + 30, y + 30); await wait(40);
            const [px, py] = global.get_pointer();
            if (Math.abs(px - x - 30) < 2 && Math.abs(py - y - 30) < 2) break;
            if (attempt === 9) throw Error('El puntero no llegó al área de scroll');
        }
        console.log('Scroll: rueda hacia abajo');
        adjustment.value = 0;
        pointer.notify_discrete_scroll(GLib.get_monotonic_time(), Clutter.ScrollDirection.DOWN, Clutter.ScrollSource.WHEEL);
        for (let attempt = 0; adjustment.value === 0 && attempt < 20; attempt++) await wait(15);
        if (!(adjustment.value > 0)) throw Error('La rueda no desplaza la biblioteca');
        if (effectiveAnimations && !adjustment.get_transition('value')) throw Error('Rueda sin transición suave');
        console.log('Scroll: invertir dirección');
        const previous = adjustment.value;
        pointer.notify_discrete_scroll(GLib.get_monotonic_time(), Clutter.ScrollDirection.UP, Clutter.ScrollSource.WHEEL);
        await wait(220);
        if (adjustment.value >= previous) throw Error('La rueda no permite invertir dirección');
        console.log('Scroll: movimiento reducido');
        settings.set_boolean('enable-animations', false); await wait(40);
        pointer.notify_discrete_scroll(GLib.get_monotonic_time(), Clutter.ScrollDirection.DOWN, Clutter.ScrollSource.WHEEL);
        await wait(50);
        if (adjustment.get_transition('value')) throw Error('Movimiento reducido ignorado');
        if (scroll.vscrollbar_visible || scroll.hscrollbar_visible) throw Error('Barras de scroll visibles');
    } finally {
        console.log('Scroll: limpiar prueba');
        settings.set_boolean('enable-animations', animations);
        adjustment.remove_transition('value'); adjustment.value = 0;
        pointer.notify_absolute_motion(GLib.get_monotonic_time(), 20, 400);
        await wait(80); pointer.run_dispose();
    }
}
