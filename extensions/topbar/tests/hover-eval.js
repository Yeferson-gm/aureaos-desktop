(async () => {
    const wait = ms => new Promise(resolve => GLib.timeout_add(GLib.PRIORITY_DEFAULT, ms, () => {resolve(); return GLib.SOURCE_REMOVE;}));
    const ext = Main.extensionManager.lookup('lintel-v2@local');
    if (!ext?.stateObj) throw new Error('Topbar no cargado');
    const bar = ext.stateObj;
    const bt = Main.panel.statusArea['lintel-bluetooth'];
    const model = bar._ctx.bluetooth;
    const originalPower = model.setPowered;
    let requests = 0;
    model.setPowered = () => requests++;
    bt._build();
    bt._header._switch.toggle();
    if (requests !== 1) throw new Error('El interruptor no transmite el cambio');
    bt._header.setState(!bt._header.state);
    if (requests !== 1) throw new Error('Un cambio del sistema produjo una petición');
    bt._header.activate();
    if (requests !== 2) throw new Error('Clic de fila duplicado o ignorado');
    model.setPowered = originalPower;
    Main.overview.hide();
    const native = Main.panel.statusArea.keyboard?.container;
    if (native) { native.show(); if (native.visible) throw new Error('Teclado nativo duplicado'); }
    const cc = Main.panel.statusArea['lintel-cc'];
    const holder = cc.menu._getMenuItems()[0];
    const find = a => a.has_style_class_name?.('lintel-cc-tile') ? a : a.get_children().map(find).find(Boolean);
    const tile = find(holder);
    if (!tile) throw new Error('No hay controles');
    const {default: Shell} = await import('gi://Shell');
    for (const mode of ['claro', 'oscuro']) {
        bar._cfg.values.temaMenus = mode;
        bar._applyTheme();
        cc.menu.open();
        holder.add_style_pseudo_class('hover');
        tile.add_style_pseudo_class('hover');
        await wait(300);
        if (holder.get_theme_node().get_background_color().alpha !== 0) throw new Error('Contenedor azul: '+mode);
        const color = tile.get_theme_node().get_background_color();
        if (color.blue !== 228 || color.red !== 53) throw new Error('Control sin selección azul: '+mode);
        const stream = Gio.File.new_for_path(GLib.getenv('DI_TEST_DIR')+'/'+mode+'.png').replace(null,false,Gio.FileCreateFlags.REPLACE_DESTINATION,null);
        await new Shell.Screenshot().screenshot(false,stream); stream.close(null);
        cc.menu.close();
    }
    bar.disable(); bar.enable();
    return 'Selección por control en ambos temas; teclado nativo oculto; recarga correcta';
})().then(async result => {
    const {default: Gio} = await import('gi://Gio');
    const {default: GLib} = await import('gi://GLib');
    Gio.File.new_for_path(GLib.getenv('DI_TEST_DIR') + '/result.txt')
        .replace_contents(new TextEncoder().encode('PASS: ' + JSON.stringify(result)), null, false, Gio.FileCreateFlags.NONE, null);
}).catch(async error => {
    const {default: Gio} = await import('gi://Gio');
    const {default: GLib} = await import('gi://GLib');
    Gio.File.new_for_path(GLib.getenv('DI_TEST_DIR') + '/result.txt')
        .replace_contents(new TextEncoder().encode('FAIL: ' + error.message + String.fromCharCode(10) + error.stack), null, false, Gio.FileCreateFlags.NONE, null);
})
