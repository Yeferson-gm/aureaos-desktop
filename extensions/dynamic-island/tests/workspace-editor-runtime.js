import Clutter from 'gi://Clutter';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import Shell from 'gi://Shell';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

export async function testWorkspaceEditor(island, wait) {
    if (!GLib.getenv('DI_TEST_DIR')) throw Error('Solo en sesión aislada');
    const editor = island._workspace.editor;
    const initial = island._settings.get_strv('home-modules');
    const baseline = Main.modalCount;
    const seat = global.stage.context.get_backend().get_default_seat();
    const pointer = seat.create_virtual_device(Clutter.InputDeviceType.POINTER_DEVICE);
    const keyboard = seat.create_virtual_device(Clutter.InputDeviceType.KEYBOARD_DEVICE);
    const center = actor => {
        const [x,y] = actor.get_transformed_position(), [w,h] = actor.get_transformed_size();
        return [x + w / 2, y + h / 2];
    };
    const move = async (x,y) => {
        for (let attempt=0; attempt<12; attempt++) {
            pointer.notify_absolute_motion(GLib.get_monotonic_time(), x,y); await wait(35);
            const [px,py] = global.get_pointer();
            if (Math.abs(px-x)<2 && Math.abs(py-y)<2) return;
        }
        throw Error('Puntero virtual no llega al destino');
    };
    const drag = async (from, to) => {
        const [x,y] = center(from), [tx,ty] = center(to);
        await move(x,y); await wait(100);
        pointer.notify_button(GLib.get_monotonic_time(), Clutter.BUTTON_PRIMARY, Clutter.ButtonState.PRESSED); await wait(80);
        for (let step=1; step<=18; step++) await move(x+(tx-x)*step/18, y+(ty-y)*step/18);
        pointer.notify_button(GLib.get_monotonic_time(), Clutter.BUTTON_PRIMARY, Clutter.ButtonState.RELEASED); await wait(400);
    };
    try {
        editor.open(); await wait(500);
        if (!editor.actor || Main.modalCount !== baseline+1) throw Error('Editor no abre con una sola captura');
        const [px,py] = editor.panel.get_transformed_position();
        const [pw,ph] = editor.panel.get_transformed_size();
        const monitor = island._monitor();
        if (px < monitor.x || py < monitor.y || px+pw > monitor.x+monitor.width || py+ph > monitor.y+monitor.height) throw Error('Editor fuera del monitor: '+JSON.stringify([px,py,pw,ph]));
        const image = Gio.File.new_for_path(GLib.getenv('DI_TEST_DIR')+'/workspace-editor.png').replace(null,false,Gio.FileCreateFlags.REPLACE_DESTINATION,null);
        await new Shell.Screenshot().screenshot(false,image); image.close(null);
        await drag(editor.galleryTiles.get('notes'), editor.previewTiles.get('music'));
        if (editor.draft.join(',') !== 'notes,music,today,weather') throw Error('Arrastre no añade antes del destino: '+editor.draft);
        await drag(editor.previewTiles.get('music'), editor.previewTiles.get('weather'));
        if (editor.draft.join(',') !== 'notes,today,music,weather') throw Error('Arrastre no reordena: '+editor.draft);
        await drag(editor.previewTiles.get('notes'), editor.removeZone);
        if (editor.draft.join(',') !== 'today,music,weather') throw Error('Arrastre no quita: '+editor.draft);
        if (island._settings.get_strv('home-modules').join(',') !== initial.join(',')) throw Error('Se guarda antes de Listo');
        editor.undoButton.emit('clicked',1); await wait(80);
        if (!editor.draft.includes('notes')) throw Error('Deshacer no restaura');
        editor.close(false,false); await wait(100);
        if (Main.modalCount !== baseline || island._settings.get_strv('home-modules').join(',') !== initial.join(',')) throw Error('Cancelar modifica datos o retiene captura');
        editor.open(); await wait(150);
        editor.place('notes'); await wait(80);
        editor.close(true,false); await wait(100);
        if (!island._settings.get_strv('home-modules').includes('notes') || island._workspace.cards.length !== 4) throw Error('Listo no refleja cambios en Inicio');
        editor.open(); await wait(150);
        keyboard.notify_keyval(GLib.get_monotonic_time(),Clutter.KEY_Escape,Clutter.KeyState.PRESSED);
        keyboard.notify_keyval(GLib.get_monotonic_time(),Clutter.KEY_Escape,Clutter.KeyState.RELEASED); await wait(300);
        if (editor.actor) throw Error('Escape no cierra el editor');
        island._closeIsland();
        if (Main.modalCount !== baseline) throw Error('Captura residual después de Escape');
        editor.open(); await wait(180);
        const music = editor.previewTiles.get('music'); music.grab_key_focus();
        for (const [key,state] of [[Clutter.KEY_Alt_L,Clutter.KeyState.PRESSED],[Clutter.KEY_Right,Clutter.KeyState.PRESSED],[Clutter.KEY_Right,Clutter.KeyState.RELEASED],[Clutter.KEY_Alt_L,Clutter.KeyState.RELEASED]])
            keyboard.notify_keyval(GLib.get_monotonic_time(),key,state);
        await wait(150);
        if (editor.draft[1] !== 'music') throw Error('Alt y flecha no reordenan');
        keyboard.notify_keyval(GLib.get_monotonic_time(),Clutter.KEY_Delete,Clutter.KeyState.PRESSED);
        keyboard.notify_keyval(GLib.get_monotonic_time(),Clutter.KEY_Delete,Clutter.KeyState.RELEASED); await wait(150);
        if (editor.draft.includes('music')) throw Error('Suprimir no retira la tarjeta enfocada');
        editor.close(false,false);
        editor.open(); await wait(200);
        const [sx,sy] = center(editor.previewTiles.get('music'));
        await move(sx,sy);
        pointer.notify_button(GLib.get_monotonic_time(),Clutter.BUTTON_PRIMARY,Clutter.ButtonState.PRESSED); await wait(230);
        await move(sx+65,sy+45); await wait(120);
        if (!editor.dragging) throw Error('No empieza arrastre para comprobar interrupción');
        editor.close(false,false);
        pointer.notify_button(GLib.get_monotonic_time(),Clutter.BUTTON_PRIMARY,Clutter.ButtonState.RELEASED); await wait(500);
        if (editor.actor || editor.autoScroll || editor.redraw || Main.modalCount !== baseline) throw Error('Interrumpir arrastre deja recursos o captura');
        editor.open(); await wait(120);
        Main.layoutManager.emit('monitors-changed'); await wait(150);
        if (editor.actor || Main.modalCount !== baseline) throw Error('Cambiar monitores no cierra editor');
    } finally {
        editor.close(false,false); island._closeIsland();
        island._settings.set_strv('home-modules',initial);
        pointer.run_dispose(); keyboard.run_dispose();
    }
    console.log('PASS: editor, arrastre real para añadir/reordenar/quitar, deshacer, cancelación, persistencia y captura modal');
}
