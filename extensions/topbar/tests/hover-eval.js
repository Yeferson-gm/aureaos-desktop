(async () => {
    if (!GLib.getenv('DI_TEST_DIR')) throw new Error('Solo se ejecuta en GNOME aislado');
    const wait = ms => new Promise(resolve => GLib.timeout_add(GLib.PRIORITY_DEFAULT, ms, () => {resolve(); return GLib.SOURCE_REMOVE;}));
    if (GLib.getenv('AUREA_TEST_SCALE')) {
        const call = (method, params) => new Promise((resolve, reject) => Gio.DBus.session.call('org.gnome.Mutter.DisplayConfig', '/org/gnome/Mutter/DisplayConfig', 'org.gnome.Mutter.DisplayConfig', method, params, null, Gio.DBusCallFlags.NONE, 10000, null, (connection, result) => {
            try { resolve(connection.call_finish(result).recursiveUnpack()); } catch (error) { reject(error); }
        }));
        const [serial, monitors] = await call('GetCurrentState', null);
        let x = 0;
        const configs = monitors.map(([spec, modes], index) => {
            const mode = modes.find(item => item[6]['is-current']) ?? modes[0];
            const scale = index === 0 ? Number(GLib.getenv('AUREA_TEST_SCALE')) : 1;
            if (!mode[5].includes(scale)) throw new Error('Escala no admitida en el compositor aislado: ' + scale + ' disponibles:' + mode[5]);
            const config = [x, 0, scale, 0, index === 0, [[spec[0], mode[0], {}]]];
            x += Math.round(mode[1] / scale); return config;
        });
        await call('ApplyMonitorsConfig', new GLib.Variant('(uua(iiduba(ssa{sv}))a{sv})', [serial, 1, configs, {}]));
        await wait(800);
    }
    const ext = Main.extensionManager.lookup('lintel-v2@local');
    if (!ext?.stateObj) throw new Error('Topbar no cargado');
    const bar = ext.stateObj;
    if (GLib.getenv('AUREA_TEST_BENCHMARK') === '1') {
        const read = path => new TextDecoder().decode(GLib.file_get_contents(path)[1]);
        const measure = async () => {
            const sample = () => {
                const stat = read('/proc/self/stat').split(') ').at(-1).split(' ');
                return {ticks: Number(stat[11]) + Number(stat[12]), rssKB: parseInt(read('/proc/self/status').split(String.fromCharCode(10)).find(line => line.startsWith('VmRSS:')).split(':')[1].trim(), 10), time: GLib.get_monotonic_time()};
            };
            const before = sample(); await wait(3000); const after = sample();
            return {cpuPercent: (after.ticks - before.ticks) / Number(GLib.getenv('AUREA_TEST_CLK_TCK')) / ((after.time - before.time) / 1e6) * 100, rssKB: after.rssKB};
        };
        Main.overview.hide(); await wait(500); bar.disable(); await wait(300);
        const baseline = await measure();
        bar.enable(); await wait(800); const topbar = await measure();
        Gio.File.new_for_path(GLib.getenv('DI_TEST_DIR') + '/idle-resources.json').replace_contents(new TextEncoder().encode(JSON.stringify({baseline, topbar, secondsPerSample:3, scope:'Compositor headless, fondo estático, sin medir GPU física'})), null, false, Gio.FileCreateFlags.NONE, null);
    }
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
    const powered = model._powered, devices = model._devices;
    model._powered = true;
    model._devices = [{path:'/fixture/headset', name:'Auriculares de prueba', icon:'audio-headset', paired:true, connected:true}];
    bt._build();
    const rowText = bt._list._getMenuItems().flatMap(item => item.get_children?.() ?? []).filter(actor => actor instanceof (imports.gi.St.Label)).map(actor => actor.text).join('|');
    if (!rowText.includes('Auriculares de prueba') || !rowText.includes('Conectado')) throw new Error('Bluetooth no muestra un dispositivo ya conectado');
    model._powered = powered; model._devices = devices; bt._build();
    Main.overview.hide();
    const native = Main.panel.statusArea.keyboard?.container;
    if (native) { native.show(); if (native.visible) throw new Error('Teclado nativo duplicado'); }
    const cc = Main.panel.statusArea['lintel-cc'];
    const keyboardLight = bar._ctx.keyboardLight;
    for (let i = 0; i < 30 && !keyboardLight.available; i++) await wait(100);
    const keyboardCard = cc.controls.cards.get('keyboardLight');
    if (!keyboardCard) throw new Error('No aparece la luz del teclado');
    keyboardCard.toggle.emit('clicked', 1); await wait(200);
    if (keyboardLight.level !== 1 || keyboardCard.value.text !== '100 %') throw new Error('No enciende la luz del teclado');
    keyboardCard.slider.value = .5; await wait(200);
    if (keyboardLight.level !== .5) throw new Error('El deslizador no ajusta el teclado');
    keyboardCard.toggle.emit('clicked', 1); await wait(200);
    if (keyboardLight.level !== 0 || keyboardCard.value.text !== 'Apagada') throw new Error('No apaga la luz del teclado');
    keyboardCard.toggle.emit('clicked', 1); await wait(200);
    if (keyboardLight.level !== .5) throw new Error('No restaura la intensidad del teclado');
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
    Gio.File.new_for_path(GLib.getenv('DI_TEST_DIR') + '/surface.json').replace_contents(new TextEncoder().encode(JSON.stringify({glassVisible: cc._surface.glass.visible, glassSize: cc._surface.glass.get_size(), blur: cc._surface.blur.radius, stackSize: cc._surface.stack.get_size(), glassPosition: cc._surface.glass.get_position()})), null, false, Gio.FileCreateFlags.NONE, null);
    cc.menu.open(); await wait(300);
    for (const enabled of [false, true]) {
        cc._surface.blur.set_enabled(enabled); cc._surface.glass.queue_redraw(); await wait(300);
        const stream = Gio.File.new_for_path(GLib.getenv('DI_TEST_DIR') + '/blur-' + enabled + '.png').replace(null, false, Gio.FileCreateFlags.REPLACE_DESTINATION, null);
        await new Shell.Screenshot().screenshot(false, stream); stream.close(null);
    }
    cc.menu.close();
    const ctx = bar._ctx;
    const controls = cc.controls;
    const caffeineCard = controls.cards.get('caffeine');
    if (!caffeineCard) throw new Error('Cafeína no aparece en la configuración inicial');
    const caffeine = controls.settings.caffeine;
    caffeineCard.toggle.emit('clicked', 1);
    if (!caffeine.get_boolean('cli-toggle')) throw new Error('Cafeína no activa el proveedor');
    caffeine.set_boolean('cli-toggle', false);
    if (controls.state('caffeine')[0]) throw new Error('Cafeína no refleja un cambio externo');
    const {default: St} = await import('gi://St');
    const foreignA = new St.Button({label: 'A'}), foreignB = new St.Button({label: 'B'});
    const right = Main.panel._rightBox, clock = Main.panel.statusArea['lintel-clock'].container;
    right.add_child(foreignA); right.add_child(foreignB); await wait(300);
    if (right.get_children().at(-1) !== clock) throw new Error('Un indicador externo queda después de la fecha');
    if (right.get_children().indexOf(foreignA) > right.get_children().indexOf(foreignB)) throw new Error('Se alteró el orden relativo de terceros');
    right.set_child_at_index(foreignA, right.get_n_children() - 1); bar._layout.queue(); await wait(300);
    if (right.get_children().at(-1) !== clock) throw new Error('Una recolocación deja iconos después de la fecha');
    foreignA.destroy(); foreignB.destroy(); await wait(200);
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
    controls.showPage(null);
    if (!controls.cards.has('microphone')) throw new Error('El micrófono disponible no aparece por defecto');
    const oldConfig = {...bar._cfg.values};
    const island = Main.extensionManager.lookup('dynamic-island-gnome50@local')?.stateObj;
    if (island) {
        bar._layout.layout(); await wait(200);
        const [islandX, islandY] = island._pill.get_transformed_position();
        const [, compactHeight] = island._pill.get_transformed_size();
        const [, panelY] = Main.panel.get_transformed_position();
        const [, panelHeight] = Main.panel.get_transformed_size();
        if (islandY + compactHeight > panelY + panelHeight + 1) throw new Error('El notch invade el área de las ventanas');
        const originalHeight = Main.panel.height;
        Main.panel.set_height(originalHeight + 6); await wait(200);
        if (Math.abs(island._pill.height - Main.panel.height) > 1) throw new Error('El notch no sigue los cambios de altura de la barra');
        Main.panel.set_height(originalHeight); await wait(200);
        island._openIsland(); await wait(400); island._closeIsland(); await wait(400);
        if (island._grab || island._menu.isOpen) throw new Error('El notch compacto retiene el panel');
        const [islandWidth] = island._pill.get_transformed_size();
        for (const actor of Main.panel._leftBox.get_children().filter(child => child.visible)) {
            const [x] = actor.get_transformed_position(); const [width] = actor.get_transformed_size();
            if (x + width > islandX) throw new Error('Un menú invade la isla');
        }
        for (const actor of Main.panel._rightBox.get_children().filter(child => child.visible)) {
            const [x] = actor.get_transformed_position();
            if (x < islandX + islandWidth) throw new Error('Un indicador invade la isla');
        }
    }
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
    const {checkMenuIcons} = await import('file://' + ext.path + '/tests/menu-icons-runtime.js');
    await checkMenuIcons(bar, wait);
    const published = ctx.published;
    const actions = new Gio.SimpleActionGroup();
    const action = new Gio.SimpleAction({name: 'test'});
    let activations = 0; action.connect('activate', () => activations++); actions.add_action(action);
    const modelMenu = new Gio.Menu(); modelMenu.append('Acción exportada', 'app.test');
    const rootMenu = new Gio.Menu(); rootMenu.append_submenu('Aplicación', modelMenu);
    const menuId = Gio.DBus.session.export_menu_model('/org/aurea/TestMenu', rootMenu);
    const actionId = Gio.DBus.session.export_action_group('/org/aurea/TestActions', actions);
    published.setWindow({get_gtk_unique_bus_name: () => Gio.DBus.session.get_unique_name(), get_gtk_menubar_object_path: () => '/org/aurea/TestMenu', get_gtk_application_object_path: () => '/org/aurea/TestActions'});
    await wait(300);
    if (!published.specs.length) throw new Error('No se descubrió el menú exportado');
    let entries = [];
    published.fill({}, published.specs[0].model, (_, options, activate) => entries.push({options, activate}));
    await wait(150); entries = [];
    published.fill({}, published.specs[0].model, (_, options, activate) => entries.push({options, activate}));
    if (entries[0]?.options.disabled) throw new Error('Acción exportada habilitada aparece desactivada');
    entries[0].activate(); await wait(100);
    if (activations !== 1) throw new Error('La acción exportada no se ejecutó exactamente una vez');
    action.set_enabled(false); await wait(100); entries = [];
    published.fill({}, published.specs[0].model, (_, options, activate) => entries.push({options, activate}));
    if (!entries[0]?.options.disabled) throw new Error('No se respeta acción exportada desactivada');
    published.setWindow(null); Gio.DBus.session.unexport_menu_model(menuId); Gio.DBus.session.unexport_action_group(actionId);
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
    if (!cc.menu.isOpen) throw new Error(`Clic real no abre el Centro de Control: ${cx},${cy} ${cc.width}x${cc.height}; actual=${cc.get_transformed_position()}; actor=${global.stage.get_actor_at_pos(Clutter.PickMode.REACTIVE, cx + cc.width / 2, cy + cc.height / 2)}`);
    keyboard.notify_keyval(GLib.get_monotonic_time(), Clutter.KEY_Escape, Clutter.KeyState.PRESSED);
    keyboard.notify_keyval(GLib.get_monotonic_time(), Clutter.KEY_Escape, Clutter.KeyState.RELEASED);
    await wait(220);
    if (cc.menu.isOpen) throw new Error('Escape no libera el panel');
    await click(cx + cc.width / 2, cy + cc.height / 2);
    await click(80, Math.min(700, Main.layoutManager.primaryMonitor.height - 40));
    if (cc.menu.isOpen) throw new Error('Clic exterior no cierra el panel');
    bar._cfg.values.reducedMotion = true; bar._applyTheme();
    cc.menu.open();
    if (cc.menu.actor.opacity !== 255 || cc.menu.actor.translation_y !== 0) throw new Error('Reducir movimiento no se respeta');
    cc.menu.close();
    await wait(50);
    if (Main.modalCount !== baseline) throw new Error('Grab residual con movimiento reducido: ' + Main.modalCount + ' ' + Main.panel.menuManager.activeMenu?.sourceActor?.accessible_name + ' stack:' + Main.modalActorFocusStack.map(record => record.actor?.toString() ?? record.grab?.get_seat_state?.()).join(','));
    await move(100, Main.layoutManager.primaryMonitor.height - 100);
    bar._cfg.values.autohide = 'always'; bar._layout.layout();
    await wait(850);
    if (Main.layoutManager.panelBox.translation_y >= 0) throw new Error('Autohide no oculta la barra');
    await move(Main.layoutManager.primaryMonitor.width / 2, 1); await wait(250);
    if (Main.layoutManager.panelBox.translation_y !== 0) throw new Error('El borde no revela la barra');
    bar._cfg.values.autohide = 'never'; bar._layout.layout();
    bar._cfg.values.material = 'solid'; bar._applyTheme(); cc.menu.open();
    if (cc._surface.glass.visible || cc._surface.blur.get_enabled()) throw new Error('El material sólido mantiene blur');
    cc.menu.close();
    bar._cfg.values.material = 'glass'; bar._cfg.values.contrast = true; bar._applyTheme(); cc.menu.open();
    if (cc._surface.glass.visible) throw new Error('Contraste alto conserva transparencia');
    cc.menu.close();
    bar._cfg.values.contrast = false; bar._applyTheme();
    const orderedTimes = [...times].sort((a,b) => a-b);
    Gio.File.new_for_path(GLib.getenv('DI_TEST_DIR') + '/metrics.json').replace_contents(new TextEncoder().encode(JSON.stringify({cycles: 100, synchronousCycleMsMedian: orderedTimes[50], synchronousCycleMsP95: orderedTimes[95], modalCountBefore: baseline, modalCountAfter: Main.modalCount})), null, false, Gio.FileCreateFlags.NONE, null);
    bar.disable();
    pointer.run_dispose(); keyboard.run_dispose();
    await wait(80); bar.enable();
    return 'Temas, reflujo, perfil explícito, deslizadores y luz del teclado, 100 interrupciones, clic real, Escape, clic exterior, movimiento reducido y recarga';
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
