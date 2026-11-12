(async () => {
    if (!GLib.getenv('DI_TEST_DIR')) throw new Error('Solo se ejecuta en GNOME aislado');
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
    const {default: Shell} = await import('gi://Shell');
    const {default: Clutter} = await import('gi://Clutter');
    for (const mode of ['claro', 'oscuro']) {
        bar._cfg.values.temaMenus = mode;
        bar._applyTheme();
        cc.menu.open();
        const tile = find(holder);
        if (!tile) throw new Error('No hay controles');
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
    const ctx = bar._ctx;
    const controls = cc.controls;
    const originalPowerModel = ctx.powerProfiles;
    const requestsToPower = [];
    ctx.powerProfiles = {available: true, profiles: ['power-saver', 'balanced', 'performance'], active: 'balanced', label: 'Balanceado', setProfile: profile => requestsToPower.push(profile)};
    cc.menu.open(); controls.showPage('power');
    controls.body.get_children()[2].emit('clicked', 1);
    if (requestsToPower.join() !== 'performance') throw new Error('Energía no selecciona el perfil solicitado');
    ctx.powerProfiles = originalPowerModel;
    const originalSound = ctx.sound, originalBrightness = ctx.brightness, originalCare = ctx.batteryCare;
    const values = {volume: .55, mic: .3, brightness: .75};
    ctx.sound = {ready: true, micReady: true, level: .55, micLevel: .3, iconName: 'audio-volume-medium-symbolic', micIconName: 'audio-input-microphone-symbolic', setLevel: v => { values.volume = v; }, setMicLevel: v => { values.mic = v; }};
    ctx.brightness = {available: true, level: .75, setLevel: v => { values.brightness = v; }};
    ctx.batteryCare = {available: true, enabled: true, label: 'Máxima vida · 80 %', modes: [], mode: 'max'};
    const oldConfig = {...bar._cfg.values};
    bar._cfg.values.modules = ['wifi', 'bluetooth', 'brightness', 'sound', 'microphone', 'power', 'battery', 'focus', 'night', 'appearance', 'privacy', 'screenshot'];
    controls.showPage(null); await wait(200);
    controls.cards.get('sound').slider.value = .35;
    controls.cards.get('microphone').slider.value = .6;
    controls.cards.get('brightness').slider.value = .4;
    if (Math.abs(values.volume - .35) > .01 || Math.abs(values.mic - .6) > .01 || Math.abs(values.brightness - .4) > .01) throw new Error('Un deslizador modifica el destino equivocado');
    for (const mode of ['claro', 'oscuro']) {
        bar._cfg.values.temaMenus = mode; bar._applyTheme(); await wait(250);
        const stream = Gio.File.new_for_path(GLib.getenv('DI_TEST_DIR') + '/controles-' + mode + '.png').replace(null, false, Gio.FileCreateFlags.REPLACE_DESTINATION, null);
        await new Shell.Screenshot().screenshot(false, stream); stream.close(null);
    }
    ctx.sound = originalSound; ctx.brightness = originalBrightness; ctx.batteryCare = originalCare;
    bar._cfg.values = oldConfig; cc.menu.close(); await wait(250);
    const baseline = Main.modalCount;
    const times = [];
    for (let i = 0; i < 100; i++) {
        const start = GLib.get_monotonic_time();
        cc.menu.open(); cc.menu.close(); cc.menu.open(); cc.menu.close();
        times.push((GLib.get_monotonic_time() - start) / 1000);
    }
    await wait(250);
    if (cc.menu.isOpen || Main.modalCount !== baseline) throw new Error('Se retuvo un grab después de interrumpir el menú');
    const seat = global.stage.context.get_backend().get_default_seat();
    const pointer = seat.create_virtual_device(Clutter.InputDeviceType.POINTER_DEVICE);
    const keyboard = seat.create_virtual_device(Clutter.InputDeviceType.KEYBOARD_DEVICE);
    await wait(500);
    const move = async (x, y) => {
        for (let i = 0; i < 5; i++) {
            pointer.notify_absolute_motion(GLib.get_monotonic_time(), x, y); await wait(60);
            const [px, py] = global.get_pointer(); if (Math.abs(px - x) < 2 && Math.abs(py - y) < 2) return;
        }
        throw new Error('El puntero virtual no llegó al destino');
    };
    const click = async (x, y) => {
        await move(x, y);
        pointer.notify_button(GLib.get_monotonic_time(), Clutter.BUTTON_PRIMARY, Clutter.ButtonState.PRESSED);
        pointer.notify_button(GLib.get_monotonic_time(), Clutter.BUTTON_PRIMARY, Clutter.ButtonState.RELEASED);
        await wait(220);
    };
    let [cx, cy] = cc.get_transformed_position();
    await click(cx + cc.width / 2, cy + cc.height / 2);
    if (!cc.menu.isOpen) throw new Error('Clic real no abre el Centro de Control');
    keyboard.notify_keyval(GLib.get_monotonic_time(), Clutter.KEY_Escape, Clutter.KeyState.PRESSED);
    keyboard.notify_keyval(GLib.get_monotonic_time(), Clutter.KEY_Escape, Clutter.KeyState.RELEASED);
    await wait(220);
    if (cc.menu.isOpen) throw new Error('Escape no libera el panel');
    await click(cx + cc.width / 2, cy + cc.height / 2);
    await click(80, 700);
    if (cc.menu.isOpen) throw new Error('Clic exterior no cierra el panel');
    pointer.run_dispose(); keyboard.run_dispose();
    bar._cfg.values.reducedMotion = true; bar._applyTheme();
    cc.menu.open();
    if (cc.menu.actor.opacity !== 255 || cc.menu.actor.translation_y !== 0) throw new Error('Reducir movimiento no se respeta');
    cc.menu.close();
    const orderedTimes = [...times].sort((a,b) => a-b);
    Gio.File.new_for_path(GLib.getenv('DI_TEST_DIR') + '/metrics.json').replace_contents(new TextEncoder().encode(JSON.stringify({cycles: 100, synchronousCycleMsMedian: orderedTimes[50], synchronousCycleMsP95: orderedTimes[95], modalCountBefore: baseline, modalCountAfter: Main.modalCount})), null, false, Gio.FileCreateFlags.NONE, null);
    bar.disable(); bar.enable();
    return 'Temas, reflujo, perfil explícito, tres deslizadores, 100 interrupciones, clic real, Escape, clic exterior, movimiento reducido y recarga';
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
