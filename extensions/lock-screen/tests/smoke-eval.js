(async () => {
    const {default: GLib} = await import('gi://GLib');
    const {default: Gio} = await import('gi://Gio');
    const {default: St} = await import('gi://St');
    const {default: Clutter} = await import('gi://Clutter');
    const {default: Shell} = await import('gi://Shell');
    const Main = await import('resource:///org/gnome/shell/ui/main.js');
    const {UnlockDialog} = await import('resource:///org/gnome/shell/ui/unlockDialog.js');
    if (!GLib.getenv('DI_TEST_DIR')) throw new Error('Solo en sesión aislada');
    const wait = ms => new Promise(resolve => GLib.timeout_add(GLib.PRIORITY_DEFAULT, ms, () => {resolve(); return GLib.SOURCE_REMOVE;}));
    const ext = Main.extensionManager.lookup('aurea-lock-screen@local');
    if (ext.state !== 1) throw new Error(`No carga el bloqueo: ${ext.error}`);
    Main.overview.hide();
    const parent = new St.Widget({width: global.stage.width, height: global.stage.height});
    Main.layoutManager.uiGroup.add_child(parent);
    const auth = UnlockDialog.prototype._ensureAuthPrompt;
    const dialog = new UnlockDialog(parent);
    dialog.set_size(global.stage.width, global.stage.height);
    dialog.show();
    const state = ext.stateObj._dialogs.get(dialog);
    if (!state) throw new Error('No se decoró el diálogo nativo');
    const profile = state.profile.get_first_child();
    profile.destroy();
    state.profile.insert_child_at_index(new St.Icon({icon_name: 'avatar-default-symbolic', icon_size: 64}), 0);
    state.profile.insert_child_at_index(new St.Label({text: 'Aurea', x_align: Clutter.ActorAlign.CENTER}), 1);
    const capture = async name => {
        await wait(300);
        const stream = Gio.File.new_for_path(`${GLib.getenv('DI_TEST_DIR')}/${name}.png`).replace(null, false, Gio.FileCreateFlags.REPLACE_DESTINATION, null);
        await new Shell.Screenshot().screenshot(false, stream); stream.close(null);
    };
    await capture('clock');
    if (dialog._bgManagers.length || dialog._backgroundGroup.get_n_children() !== Main.layoutManager.monitors.length)
        throw new Error('El fondo no es estático o falta un monitor');
    for (const layer of dialog._backgroundGroup.get_children()) {
        if (layer.get_effect('blur')) throw new Error('El fondo estático se está difuminando');
    }
    const entry = new St.Entry({hint_text: 'Contraseña', can_focus: true});
    dialog._promptBox.add_child(entry);
    for (let i = 0; i <= 20; i++) {
        dialog._setTransitionProgress(i / 20); await wait(16);
        if (!dialog._clock.visible || dialog._clock.opacity !== 255) throw new Error('El reloj desaparece durante la transición');
    }
    await capture('prompt');
    const [, clockY] = dialog._clock.get_transformed_position();
    const [, promptY] = dialog._promptBox.get_transformed_position();
    if (clockY >= global.stage.height / 3 || promptY <= clockY + dialog._clock.height)
        throw new Error('Reloj y formulario se solapan');
    const keyboard = Main.layoutManager.keyboardBox;
    const oldKeyboard = {height: keyboard.height, visible: keyboard.visible};
    keyboard.height = 300; keyboard.show();
    await wait(250);
    if (global.stage.height <= 800 && dialog._clock.opacity !== 0)
        throw new Error('El reloj ocupa el espacio del teclado');
    const [, inputY] = dialog._promptBox.get_transformed_position();
    if (inputY + dialog._promptBox.height > global.stage.height - 300)
        throw new Error('Formulario detrás del teclado');
    keyboard.height = oldKeyboard.height; keyboard.visible = oldKeyboard.visible;
    await wait(250);
    if (UnlockDialog.prototype._ensureAuthPrompt !== auth) throw new Error('Se modificó la autenticación');
    dialog._setTransitionProgress(0);
    entry.destroy();
    ext.stateObj.disable();
    if (dialog.has_style_class_name('aurea-lock') || dialog._clock.get_parent() !== dialog._stack)
        throw new Error('Desactivar no restaura el diálogo nativo');
    dialog.destroy(); parent.destroy();
    ext.stateObj.enable();
    return 'PASS: fondo estático, reloj, formulario, transición y restauración';
})().then(result => {
    Gio.File.new_for_path(`${GLib.getenv('DI_TEST_DIR')}/result.txt`).replace_contents(new TextEncoder().encode(result), null, false, Gio.FileCreateFlags.NONE, null);
}).catch(error => {
    Gio.File.new_for_path(`${GLib.getenv('DI_TEST_DIR')}/result.txt`).replace_contents(new TextEncoder().encode(`FAIL: ${error.message}\n${error.stack}`), null, false, Gio.FileCreateFlags.NONE, null);
});
