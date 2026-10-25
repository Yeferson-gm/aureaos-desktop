(async () => {
    const wait = ms => new Promise(resolve => GLib.timeout_add(GLib.PRIORITY_DEFAULT, ms, () => {resolve(); return GLib.SOURCE_REMOVE;}));
    const ext = Main.extensionManager.lookup('macos27-dock@local');
    if (!ext?.stateObj) throw new Error('Dock no cargado: ' + ext?.error);
    const {dockManager} = await import(`file://${ext.path}/extension.js`);
    dockManager.settings.set_boolean('dock-fixed', true);
    dockManager.settings.set_boolean('magnify-icons', true);
    Main.overview.hide();
    await wait(800);
    const controller = dockManager.mainDock.dash._magnification;
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
    return {icons: items.length, bounds: 'ok', reset: 'ok'};
})()
