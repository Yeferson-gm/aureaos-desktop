(async () => {
    if (!GLib.getenv('DI_TEST_DIR')) throw new Error('Solo en sesión aislada');
    const {default: Clutter} = await import('gi://Clutter');
    const {default: St} = await import('gi://St');
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
    const ext = Main.extensionManager.lookup('macos27-dock@local');
    if (!ext?.stateObj) throw new Error('Dock no cargado: ' + ext?.error);
    const {dockManager} = await import(`file://${ext.path}/extension.js`);
    dockManager.settings.set_boolean('dock-fixed', true);
    dockManager.settings.set_boolean('magnify-icons', true);
    Main.overview.hide();
    await wait(800);
    const controller = dockManager.mainDock.dash._magnification;
    const clip = dockManager.mainDock._box.get_clip();
    if (clip[2] <= 0 || clip[3] <= 0) throw new Error('Falta límite de pantalla');
    const items = controller._items();
    if (!items.length) throw new Error('No hay iconos de prueba');
    const middle = Math.floor(items.length / 2);
    controller._pointer = items[middle].center;
    controller._startFrames();
    await wait(800);
    const enlarged = controller._items();
    for (const {actor, scalable} of enlarged) {
        if (!scalable) continue;
        if (actor.translation_y !== 0) throw new Error('Desplazamiento vertical inesperado');
        if (!Number.isFinite(actor.translation_x)) throw new Error('Posición no válida');
        if (actor.get_pivot_point()[1] !== 1) throw new Error('El crecimiento no está anclado abajo');
    }
    if (!enlarged.some(({actor, scalable}) => scalable && actor.scale_x > 1)) throw new Error('La ampliación no funciona');
    if (!dockManager.mainDock.dash._glassShelf?.blur) throw new Error('Falta el vidrio');
    for (const item of dockManager.mainDock.dash._box.get_children()) {
        const app = item.child?._delegate;
        if (!app?.icon?._iconBin) continue;
        const visual = app.icon._iconBin;
        const [x, y] = visual.get_transformed_position();
        const [w, h] = visual.get_transformed_size();
        let picked = global.stage.get_actor_at_pos(Clutter.PickMode.REACTIVE, x + w / 2, y + h / 2);
        while (picked && picked !== app) picked = picked.get_parent();
        if (picked !== app) throw new Error(`Zona de clic separada de ${app.name}`);
    }
    const motion = new Gio.Settings({schema_id: 'org.gnome.desktop.interface'});
    motion.set_boolean('enable-animations', false);
    await wait(150);
    if (controller._laterId || controller._items().some(({actor}) => actor.scale_x !== 1 || actor.translation_x !== 0))
        throw new Error('Movimiento reducido deja ampliación o cuadros pendientes');
    motion.set_boolean('enable-animations', true);
    await wait(150);
    controller._pointer = controller._items()[middle].center;
    controller._startFrames();
    await wait(700);

    const {default: Shell} = await import('gi://Shell');
    const stream = Gio.File.new_for_path(`${GLib.getenv('DI_TEST_DIR')}/dock.png`).replace(null, false, Gio.FileCreateFlags.REPLACE_DESTINATION, null);
    await new Shell.Screenshot().screenshot(false, stream);
    stream.close(null);
    controller._pointer = null;
    controller._startFrames();
    await wait(1000);
    if (controller._items().some(({actor}) => actor.scale_x !== 1 || actor.translation_x !== 0)) throw new Error('No vuelve al tamaño y posición originales');
    const app = dockManager.mainDock.dash._box.get_children().map(a => a.child?._delegate)
        .find(a => a?.popupMenu);
    if (!app) throw new Error('Falta app para probar menú');
    const originalWindows = app.getWindows;
    app.getWindows = () => [];
    try {
        app._startBounce(false);
        await wait(600);
        if (app._bouncing || app.icon._iconBin.translation_y !== 0)
            throw new Error('Rebote de apertura no termina');
        app._startBounce(true);
        await wait(80);
        motion.set_boolean('enable-animations', false);
        await wait(100);
        if (app._bouncing || app.icon._iconBin.translation_y !== 0)
            throw new Error('Rebote ignora movimiento reducido');
    } finally {
        app.getWindows = originalWindows;
        motion.set_boolean('enable-animations', true);
    }

    const {UnityIndicator} = await import(`file://${ext.path}/appIconIndicators.js`);
    const badgeIndicator = new UnityIndicator(app);
    badgeIndicator.setNotificationCount(2);
    const visual = app.icon._iconBin;
    visual.set_pivot_point(0.5, 1);
    visual.scale_x = visual.scale_y = 1.5;
    visual.translation_x = 20;
    visual.translation_y = -8;
    const badge = badgeIndicator._notificationBadgeBin;
    if (Math.abs(badge.translation_x - (20 + visual.width * 0.25)) > 0.01 ||
        Math.abs(badge.translation_y - (-8 - visual.height * 0.5)) > 0.01 || badge.scale_x !== 1)
        throw new Error('Insignia no sigue al icono');
    visual.scale_x = visual.scale_y = 1;
    visual.translation_x = visual.translation_y = 0;
    if (badge.translation_x !== 0 || badge.translation_y !== 0) throw new Error('Insignia no vuelve a origen');
    badgeIndicator.destroy();
    app.popupMenu();
    await wait(350);
    const menuStream = Gio.File.new_for_path(`${GLib.getenv('DI_TEST_DIR')}/menu.png`).replace(null, false, Gio.FileCreateFlags.REPLACE_DESTINATION, null);
    await new Shell.Screenshot().screenshot(false, menuStream);
    menuStream.close(null);
    app._menu.close();
    for (const mode of ['light', 'dark']) {
        dockManager.settings.set_string('material-theme', mode);
        app.popupMenu();
        await wait(200);
        if (app._menu.actor.has_style_class_name('aurea-dark') !== (mode === 'dark'))
            throw new Error('El menú no sigue el material');
        const capture = Gio.File.new_for_path(`${GLib.getenv('DI_TEST_DIR')}/menu-${mode}.png`).replace(null, false, Gio.FileCreateFlags.REPLACE_DESTINATION, null);
        await new Shell.Screenshot().screenshot(false, capture); capture.close(null);
        app._menu.close();
    }
    const accessibility = new Gio.Settings({schema_id: 'org.gnome.desktop.a11y.interface'});
    accessibility.set_boolean('high-contrast', true);
    await wait(200);
    if (dockManager.mainDock.dash._glassShelf.blur.visible)
        throw new Error('Alto contraste conserva desenfoque');
    accessibility.set_boolean('high-contrast', false);
    dockManager.settings.set_string('material-theme', 'auto');
    const {testPointer} = await import(`file://${GLib.getenv('DI_PROJECT_DIR')}/tests/pointer.js`);
    await wait(800);
    if (GLib.getenv('AUREA_DOCK_WINDOWS') !== '1') await testPointer(dockManager.mainDock.dash);
    if (GLib.getenv('AUREA_DOCK_VIDEO') === '1') {
        await wait(1500);
        const source = `${GLib.getenv('DI_PROJECT_DIR')}/tests/benchmark.js`;
        const {benchmark} = await import(`file://${source}`);
        await benchmark(controller, dockManager.mainDock.dash._glassShelf.blur);
    }
    if (GLib.getenv('AUREA_DOCK_WINDOWS') === '1') {
        const {testWindows} = await import(`file://${GLib.getenv('DI_PROJECT_DIR')}/tests/windows.js`);
        await testWindows(dockManager);
    }
    if (GLib.getenv('AUREA_DOCK_DUAL') === '1') {
        dockManager.settings.set_boolean('multi-monitor', true);
        dockManager.settings.set_boolean('dock-fixed', true);
        await wait(1000);
        if (dockManager._allDocks.length !== Main.layoutManager.monitors.length)
            throw new Error('Falta Dock en una pantalla');
        for (const dock of dockManager._allDocks) {
            const monitor = Main.layoutManager.monitors[dock.monitorIndex];
            const [cx, cy, cw, ch] = dock._box.get_clip();
            const [ok, mx, my] = dock._box.transform_stage_point(monitor.x, monitor.y);
            if (!ok || Math.abs(cx - mx) > 1 || Math.abs(cy - my) > 1 || cw <= 0 || ch <= 0)
                throw new Error('Recorte fuera del monitor del Dock');
        }
        dockManager.settings.set_boolean('multi-monitor', false);
        await wait(500);
    }
    return {icons: items.length, bounds: 'ok', reset: 'ok'};
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
