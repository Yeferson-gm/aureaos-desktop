import Gio from 'gi://Gio';
import St from 'gi://St';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

export async function verifyKeyboardPolicy(wait) {
    const settings = new Gio.Settings({schema_id: 'org.gnome.desktop.a11y.applications'});
    const enabled = settings.get_boolean('screen-keyboard-enabled');
    const mode = {isLocked: Main.sessionMode.isLocked, isGreeter: Main.sessionMode.isGreeter};
    const focus = global.stage.key_focus;
    const input = new St.Entry({can_focus: true});
    Main.uiGroup.add_child(input);
    input.grab_key_focus();
    let controller, completion;
    try {
        settings.set_boolean('screen-keyboard-enabled', true);
        await wait(250);
        const keyboard = Main.keyboard.keyboardActor;
        if (!keyboard) throw new Error('La prueba no creó el teclado nativo');
        controller = keyboard._keyboardController;
        completion = controller.setOskCompletion;
        controller.setOskCompletion = async () => {};
        keyboard.close(true);
        await wait(250);
        for (const state of [{isLocked: true, isGreeter: false}, {isLocked: false, isGreeter: true}]) {
            Object.assign(Main.sessionMode, state);
            keyboard.open(true);
            keyboard._keyboardRequested = true;
            keyboard._open();
            keyboard.gestureProgress(0.5);
            await wait(250);
            if (keyboard.visible || keyboard._keyboardVisible || keyboard._keyboardRequested)
                throw new Error('El teclado virtual se abrió en el acceso o bloqueo');
        }
        Object.assign(Main.sessionMode, {isLocked: false, isGreeter: false});
        keyboard.open(true);
        await wait(300);
        if (!keyboard.visible) throw new Error('Se desactivó el teclado fuera del bloqueo');
        keyboard.close(true);
        await wait(250);
    } finally {
        if (controller) controller.setOskCompletion = completion;
        Object.assign(Main.sessionMode, mode);
        settings.set_boolean('screen-keyboard-enabled', enabled);
        global.stage.set_key_focus(focus);
        input.destroy();
        await wait(350);
    }
}
