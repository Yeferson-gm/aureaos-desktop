(async () => {
    const wait = ms => new Promise(resolve => GLib.timeout_add(GLib.PRIORITY_DEFAULT, ms, () => {
        resolve(); return GLib.SOURCE_REMOVE;
    }));
    const ext = Main.extensionManager.lookup('dynamic-island-gnome50@local');
    if (!ext?.stateObj) throw new Error('No se cargó la extensión: ' + ext?.error);
    const island = ext.stateObj;
    const {Notification, Source, Urgency} = await import('resource:///org/gnome/shell/ui/messageTray.js');
    const nativeShow = Main.messageTray._showNotification;
    island._activities.clear();
    island._notificationSettings.set_boolean('show-banners', true);
    const source = new Source({title: 'Avisos aislados'});
    Main.messageTray.add(source);
    for (const urgency of [Urgency.NORMAL, Urgency.CRITICAL]) {
        const notification = new Notification({source, title: 'Aviso de prueba', urgency});
        source.addNotification(notification);
        await wait(200);
        if (Main.messageTray._banner || Main.messageTray._notification || Main.messageTray.queueCount)
            throw new Error('Aparece un banner nativo o queda en cola');
        if (!source.notifications.includes(notification) || notification.acknowledged)
            throw new Error('Se perdió el aviso del historial o se marcó leído sin abrirlo');
        if (island._activities.current?.key !== 'notification')
            throw new Error('La notificación no aparece en la isla');
    }
    island._activities.clear();
    island._notificationSettings.set_boolean('show-banners', false);
    source.addNotification(new Notification({source, title: 'Silencioso'}));
    await wait(200);
    if (island._activities.current) throw new Error('No se respeta No molestar');
    island._notificationSettings.set_boolean('show-banners', true);
    source.destroy();
    island._presentActivity();
    const syncSampler = island._syncSampler;
    island._openIsland();
    island._syncSampler = () => {throw new Error('fallo simulado al limpiar');};
    try { island._closeIsland(); } catch (_) {}
    island._syncSampler = syncSampler;
    if (island._grab) throw new Error('Cierre con error deja retenida la entrada');
    const result = {state: ext.state, pages: Object.keys(island._pages)};
    const inspect = actor => {
        if (actor.get_text?.().startsWith('Esta sección falló')) throw new Error(actor.get_text());
        for (const child of actor.get_children()) inspect(child);
    };
    inspect(island._island);
    Main.overview.hide();
    await wait(500);
    if (island._title.get_text() !== 'Pista de prueba MPRIS') throw new Error('No se recibió la metadata MPRIS de prueba');
    if (!island._musicSurface.get_style()?.includes('background-gradient-start')) throw new Error('No se generó el acento de portada');
    console.log('Notch musical: ancho=' + island._pill.width);
    if (island._pill.width !== 300) throw new Error('El notch musical debe medir 300 px');
    if (island._pillContent.get_children().some(actor => actor.has_style_class_name('di-mini-cover')))
        throw new Error('La vista cerrada no debe contener una portada');
    const {default: ScreenshotShell} = await import('gi://Shell');
    const notchStream = Gio.File.new_for_path(`${GLib.getenv('DI_TEST_DIR')}/notch.png`)
        .replace(null, false, Gio.FileCreateFlags.REPLACE_DESTINATION, null);
    await new ScreenshotShell.Screenshot().screenshot(false, notchStream);
    notchStream.close(null);
    const playingStatus = island._status;
    island._status = 'Stopped';
    island._updatePill();
    await wait(100);
    if (island._pill.width !== 280) throw new Error('El notch en reposo debe medir 280 px');
    island._status = playingStatus;
    island._updatePill();
    if (GLib.getenv('DI_SIDE_DOCK_DIR')) {
        const side = Main.extensionManager.lookup('side-dock-gnome50@local')?.stateObj;
        if (!side?._root) throw new Error('La isla lateral no cargó');
        side._setOpen(true);
        await wait(500);
        const stream = Gio.File.new_for_path(`${GLib.getenv('DI_TEST_DIR')}/side-open.png`)
            .replace(null, false, Gio.FileCreateFlags.REPLACE_DESTINATION, null);
        await new ScreenshotShell.Screenshot().screenshot(false, stream);
        stream.close(null);
        side._setOpen(false);
        await wait(500);
        if (side._open || side._grab) throw new Error('La isla lateral no liberó la entrada');
    }
    island._command('PlayPause');
    await wait(150);
    if (island._status !== 'Paused') throw new Error('No funciona PlayPause por D-Bus');
    island._seekTo(60);
    await wait(150);
    if (island._position !== 60) throw new Error('No funciona Seek por D-Bus');
    result.mpris = 'metadata, PlayPause y Seek verificados con servicio de prueba';
    island._command('PlayPause');
    for (const id of result.pages) {
        island._selectTab(id);
        if (!island._pages[id]) throw new Error('Página ausente: ' + id);
    }
    island._selectTab('home');
    island._openIsland();
    await wait(500);
    result.open = island._menu.isOpen;
    island._toast({key: 'test-volume', icon: 'audio-volume-high-symbolic', text: 'Prueba de aviso', fraction: 0.5});
    result.activity = island._activities.current?.key;
    island._closeIsland();
    await wait(400);
    result.closed = !island._menu.isOpen;
    if (!result.open || !result.closed) throw new Error('Falló apertura o cierre');
    Main.notify('Prueba aislada', 'Notificación de prueba');
    await wait(200);
    island._clearNotifications();
    await wait(200);
    island._openIsland();
    await wait(400);
    const {default: Shell} = await import('gi://Shell');
    const directory = GLib.getenv('DI_TEST_DIR');
    for (const id of ['home', 'music', 'today', 'notes', 'system', 'files', 'tools', 'clock']) {
        island._selectTab(id);
        await wait(id === 'system' ? 2000 : 400);
        const [x, y] = island._island.get_transformed_position();
        const [w, h] = island._island.get_transformed_size();
        if (x < 0 || y < 0 || x + w > 1280 || y + h > 800) throw new Error('Vista fuera de pantalla: ' + id);
        const file = Gio.File.new_for_path(`${directory}/${id}.png`);
        const stream = file.replace(null, false, Gio.FileCreateFlags.REPLACE_DESTINATION, null);
        await new Shell.Screenshot().screenshot(false, stream);
        stream.close(null);
    }
    island._closeIsland();
    await wait(400);
    const file = Gio.File.new_for_path(`${directory}/entrada.txt`);
    file.replace_contents(new TextEncoder().encode('Archivo de prueba'), null, false, Gio.FileCreateFlags.PRIVATE, null);
    island._shelf = [file.get_path()];
    island._shelfSelection.add(file.get_path());
    island._runFileTool('zip');
    for (let i = 0; i < 30 && island._fileJob; i++) await wait(100);
    if (!island._fileResultPath || !Gio.File.new_for_path(island._fileResultPath).query_exists(null)) throw new Error('No se generó ZIP desde la isla');
    result.fileTool = 'ZIP generado mediante proceso auxiliar';
    island._settings.set_string('theme', 'glass');
    island._settings.set_boolean('animations', false);
    island._openIsland();
    if (island._tweenSource) throw new Error('Animaciones desactivadas aún crean temporizador');
    island._closeIsland();
    island._settings.set_boolean('animations', true);
    island._timerAdd(1);
    island._clockToggle();
    const before = island._timerLeft();
    island.disable();
    if (Main.messageTray._showNotification === nativeShow)
        throw new Error('No se restauró la presentación nativa al desactivar');
    const restoredSource = new Source({title: 'Restauración'});
    Main.messageTray.add(restoredSource);
    restoredSource.addNotification(new Notification({source: restoredSource, title: 'Banner restaurado'}));
    await wait(200);
    if (!Main.messageTray._banner) throw new Error('Los banners no vuelven al desactivar la isla');
    result.sourcesAfterDisable = island._sources.size;
    result.modalAfterDisable = island._grab;
    if (result.sourcesAfterDisable || result.modalAfterDisable) throw new Error('Recursos pendientes');
    island.enable();
    await wait(200);
    if (Main.messageTray._banner) throw new Error('Un banner anterior sobrevivió al activar la isla');
    restoredSource.destroy();
    if (!island._tm.running || island._timerLeft() > before || island._timerLeft() < before - 5000)
        throw new Error('No se restauró el temporizador');
    if (island._settings.get_string('theme') !== 'glass') throw new Error('Se perdió el tema');
    result.persistence = 'tema y temporizador restaurados';
    island._clockReset();
    result.reenabled = !!island._button;
    return JSON.stringify(result);
})().then(result => {
    Gio.File.new_for_path(`${GLib.getenv('DI_TEST_DIR')}/result.txt`)
        .replace_contents(new TextEncoder().encode(result), null, false, Gio.FileCreateFlags.NONE, null);
}).catch(error => {
    Gio.File.new_for_path(`${GLib.getenv('DI_TEST_DIR')}/result.txt`)
        .replace_contents(new TextEncoder().encode(`FAIL: ${error.message}\n${error.stack}`), null, false, Gio.FileCreateFlags.NONE, null);
})
