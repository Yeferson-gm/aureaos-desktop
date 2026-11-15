(async () => {
    const {default: GLib} = await import('gi://GLib');
    const {default: Gio} = await import('gi://Gio');
    const {default: St} = await import('gi://St');
    const {default: Clutter} = await import('gi://Clutter');
    const {default: GObject} = await import('gi://GObject');
    const {Keyboard} = await import('resource:///org/gnome/shell/ui/keyboard.js');
    const originalKeyboardOpen = Keyboard.prototype.open;
    const {LoginDialog} = await import('resource:///org/gnome/shell/gdm/loginDialog.js');
    const {default: LoginPresentation} = await import(`file://${GLib.getenv('AUREA_LOGIN_SOURCE')}/login.js`);
    const {default: Shell} = await import('gi://Shell');
    const Main = await import('resource:///org/gnome/shell/ui/main.js');
    const {AuthPrompt, AuthPromptMode} = await import('resource:///org/gnome/shell/gdm/authPrompt.js');
    const {MessageType} = await import('resource:///org/gnome/shell/gdm/util.js');
    const dir = GLib.getenv('DI_TEST_DIR');
    if (!dir) throw new Error('Solo sesión aislada');
    const wait = ms => new Promise(resolve => GLib.timeout_add(GLib.PRIORITY_DEFAULT, ms, () => {resolve(); return GLib.SOURCE_REMOVE;}));
    const resource = Gio.Resource.load(`${dir}/theme.gresource`);
    resource._register();
    const context = St.ThemeContext.get_for_stage(global.stage);
    const oldTheme = context.get_theme();
    context.set_theme(new St.Theme({application_stylesheet: Gio.File.new_for_uri('resource:///org/gnome/shell/theme/gnome-shell-dark.css')}));
    Main.overview.hide();
    const screen = new St.Widget({name: 'lockDialogGroup', width: global.stage.width, height: global.stage.height, layout_manager: new Clutter.BinLayout()});
    const Fixture = GObject.registerClass(class AureaLoginFixture extends St.Widget {
        vfunc_allocate(box) { LoginDialog.prototype.vfunc_allocate.call(this, box); }
        _getCenterActorAllocation(...args) { return LoginDialog.prototype._getCenterActorAllocation.call(this, ...args); }
        _getBottomButtonGroupAllocation(...args) { return LoginDialog.prototype._getBottomButtonGroupAllocation.call(this, ...args); }
    });
    const login = new Fixture({style_class: 'login-dialog', x_expand: true, y_expand: true});
    for (const field of ['_bannerView', '_logoBin', '_userSelectionBox']) {
        login[field] = new St.Widget({visible: false}); login.add_child(login[field]);
    }
    login._bottomButtonGroup = new St.BoxLayout(); login.add_child(login._bottomButtonGroup);
    const signals = new Map();
    let signalId = 0, activations = 0;
    const actions = {canPowerOff: true, canRestart: true, canSuspend: true,
        connect(name, callback) {signals.set(++signalId, {name, callback}); return signalId;},
        disconnect(id) {signals.delete(id);}, forceUpdate() {},
        activatePowerOff() {activations++;}, activateRestart() {activations++;}, activateSuspend() {activations++;}};
    const extension = new LoginPresentation({uuid: 'aurea-lock-screen@local', path: GLib.getenv('AUREA_LOGIN_SOURCE'), dir: Gio.File.new_for_path(GLib.getenv('AUREA_LOGIN_SOURCE'))});
    const originalCenter = LoginDialog.prototype._getCenterActorAllocation;
    extension.enable();
    extension._decorate(login, actions);
    screen.add_child(login);
    Main.uiGroup.add_child(screen);
    const createVerifier = AuthPrompt.prototype._createUserVerifier;
    const verifier = {connectObject() {}, disconnectObject() {}, destroy() {}, cancel() {}, hasPendingMessages: false, smartcardDetected: false};
    AuthPrompt.prototype._createUserVerifier = () => verifier;
    let prompt;
    try { prompt = new AuthPrompt(null, AuthPromptMode.UNLOCK_OR_LOG_IN); }
    finally { AuthPrompt.prototype._createUserVerifier = createVerifier; }
    prompt.x_align = Clutter.ActorAlign.CENTER;
    prompt.y_align = Clutter.ActorAlign.CENTER;
    login._authPrompt = prompt;
    login.add_child(prompt);
    const profile = new St.BoxLayout({orientation: Clutter.Orientation.VERTICAL, style_class: 'user-widget vertical', x_align: Clutter.ActorAlign.CENTER});
    const {Avatar} = await import('resource:///org/gnome/shell/ui/userWidget.js');
    profile.add_child(new Avatar(null, {styleClass: 'user-icon'}));
    profile.add_child(new St.Label({text: 'Aurea', style_class: 'user-widget-label', x_align: Clutter.ActorAlign.CENTER}));
    prompt._userWell.set_child(profile);
    prompt._onAskQuestion('gdm-password', 'Contraseña', true);
    const capture = async name => {
        await wait(300);
        const stream = Gio.File.new_for_path(`${dir}/${name}.png`).replace(null, false, Gio.FileCreateFlags.NONE, null);
        await new Shell.Screenshot().screenshot(false, stream); stream.close(null);
    };
    await capture('login-password');
    const controls = extension._dialogs.get(login).controls;
    const area = login.get_theme_node().get_content_box(login.get_allocation_box());
    const expectedY = Math.round(area.y1 + (area.y2 - area.y1) * 0.14);
    if (Math.abs(prompt.y - expectedY) > 2) throw new Error(`Perfil fuera de posición: ${prompt.y}, esperado ${expectedY}`);
    const [entryX] = prompt._entry.get_transformed_position();
    if (Math.abs(entryX + prompt._entry.width / 2 - global.stage.width / 2) > 2) throw new Error('Contraseña no centrada con el perfil');
    if (controls.actor.y < global.stage.height * 0.75) throw new Error('Energía fuera de la zona inferior');
    for (const button of controls.buttons) {
        const [x, y] = button.get_transformed_position();
        const [width, height] = button.get_transformed_size();
        let picked = global.stage.get_actor_at_pos(Clutter.PickMode.REACTIVE, x + width / 2, y + height / 2);
        while (picked && picked !== button) picked = picked.get_parent();
        if (!picked) throw new Error('Control de energía no recibe el puntero');
        button.emit('clicked', 1);
    }
    if (activations !== 3) throw new Error('Acciones sin conectar');
    actions.canSuspend = false;
    for (const {name, callback} of signals.values()) if (name === 'notify::can-suspend') callback();
    controls.buttons[2].emit('clicked', 1);
    if (activations !== 3 || controls.buttons[2].reactive) throw new Error('No respeta la política de suspensión');
    if (!(prompt._entry instanceof St.PasswordEntry)) throw new Error('No se utiliza el campo nativo protegido');
    if (screen.get_theme_node().get_background_image()?.get_uri() !== 'resource:///org/gnome/shell/theme/aurea-login.jpg')
        throw new Error('No se aplicó el fondo de GDM');
    if (prompt._entry.get_theme_node().get_border_radius(St.Corner.TOPLEFT) < 19)
        throw new Error('El campo de contraseña conserva el tema anterior');
    if (!prompt._entry.reactive || !prompt.cancelButton.can_focus) throw new Error('Se desactivaron controles de acceso');
    prompt.setMessage('Mensaje de prueba: revisa la contraseña', MessageType.ERROR);
    await capture('login-error');
    if (!prompt._message.visible || prompt._message.opacity !== 255) throw new Error('Mensaje de acceso invisible');
    prompt.hide();
    const list = new St.BoxLayout({orientation: Clutter.Orientation.VERTICAL, style_class: 'login-dialog-user-list-view', x_align: Clutter.ActorAlign.CENTER, y_align: Clutter.ActorAlign.CENTER});
    const items = new St.BoxLayout({orientation: Clutter.Orientation.VERTICAL, style_class: 'login-dialog-user-list'});
    list.add_child(items); login._userSelectionBox.destroy(); login._userSelectionBox = list; login.add_child(list);
    for (const name of ['Aurea', 'Usuario de prueba']) {
        items.add_child(new St.Button({label: name, style_class: 'login-dialog-user-list-item', can_focus: true, reactive: true}));
    }
    await capture('login-users');
    const {verifyKeyboardPolicy} = await import(`file://${GLib.getenv('AUREA_LOGIN_SOURCE')}/../../../extensions/lock-screen/tests/keyboard-policy.js`);
    await verifyKeyboardPolicy(wait);
    extension.disable();
    if (Keyboard.prototype.open !== originalKeyboardOpen) throw new Error('No se restauró la política del teclado');
    if (signals.size || LoginDialog.prototype._getCenterActorAllocation !== originalCenter) throw new Error('Restauración incompleta');
    screen.destroy();
    context.set_theme(oldTheme); resource._unregister();
    return 'PASS: GDM, posición nativa, fondo a color, contraseña, mensajes, usuarios, energía y limpieza';
})().then(result => {
    Gio.File.new_for_path(`${GLib.getenv('DI_TEST_DIR')}/result.txt`).replace_contents(new TextEncoder().encode(result), null, false, Gio.FileCreateFlags.NONE, null);
}).catch(error => {
    Gio.File.new_for_path(`${GLib.getenv('DI_TEST_DIR')}/result.txt`).replace_contents(new TextEncoder().encode(`FAIL: ${error.message}\n${error.stack}`), null, false, Gio.FileCreateFlags.NONE, null);
});
