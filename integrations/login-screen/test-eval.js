(async () => {
    const {default: GLib} = await import('gi://GLib');
    const {default: Gio} = await import('gi://Gio');
    const {default: St} = await import('gi://St');
    const {default: Clutter} = await import('gi://Clutter');
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
    const login = new St.Widget({style_class: 'login-dialog', x_expand: true, y_expand: true, layout_manager: new Clutter.BinLayout()});
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
    login.add_child(prompt);
    const profile = new St.BoxLayout({orientation: Clutter.Orientation.VERTICAL, style_class: 'user-widget vertical', x_align: Clutter.ActorAlign.CENTER});
    profile.add_child(new St.Icon({icon_name: 'avatar-default-symbolic', style_class: 'user-icon', x_align: Clutter.ActorAlign.CENTER}));
    profile.add_child(new St.Label({text: 'Aurea', style_class: 'user-widget-label', x_align: Clutter.ActorAlign.CENTER}));
    prompt._userWell.set_child(profile);
    prompt._onAskQuestion('gdm-password', 'Contraseña', true);
    const capture = async name => {
        await wait(300);
        const stream = Gio.File.new_for_path(`${dir}/${name}.png`).replace(null, false, Gio.FileCreateFlags.NONE, null);
        await new Shell.Screenshot().screenshot(false, stream); stream.close(null);
    };
    await capture('login-password');
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
    list.add_child(items); login.add_child(list);
    for (const name of ['Aurea', 'Usuario de prueba']) {
        items.add_child(new St.Button({label: name, style_class: 'login-dialog-user-list-item', can_focus: true, reactive: true}));
    }
    await capture('login-users');
    screen.destroy();
    context.set_theme(oldTheme); resource._unregister();
    return 'PASS: tema GDM, fondo estático, PasswordEntry nativo, mensajes y selector de usuario';
})().then(result => {
    Gio.File.new_for_path(`${GLib.getenv('DI_TEST_DIR')}/result.txt`).replace_contents(new TextEncoder().encode(result), null, false, Gio.FileCreateFlags.NONE, null);
}).catch(error => {
    Gio.File.new_for_path(`${GLib.getenv('DI_TEST_DIR')}/result.txt`).replace_contents(new TextEncoder().encode(`FAIL: ${error.message}\n${error.stack}`), null, false, Gio.FileCreateFlags.NONE, null);
});
