(async () => {
    const wait = ms => new Promise(resolve => GLib.timeout_add(GLib.PRIORITY_DEFAULT, ms, () => {
        resolve(); return GLib.SOURCE_REMOVE;
    }));
    const ext = Main.extensionManager.lookup('dynamic-island-gnome50@local');
    if (!ext?.stateObj) throw new Error('No se cargó la extensión: ' + ext?.error);
    const island = ext.stateObj;
    Main.overview.hide();
    await wait(500);
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
    let delayedHover = false;
    island._hoverTimer = island._timeout(30, () => { delayedHover = true; return GLib.SOURCE_REMOVE; });
    island._activatePill();
    await wait(60);
    if (delayedHover || island._openedByHover) throw new Error('Abrir manualmente conserva un hover pendiente');
    island._closeIsland();
    const syncSampler = island._syncSampler;
    island._openIsland();
    island._syncSampler = () => {throw new Error('fallo simulado al limpiar');};
    try { island._closeIsland(); } catch (_) {}
    island._syncSampler = syncSampler;
    if (island._grab) throw new Error('Cierre con error deja retenida la entrada');
    island._ensurePage('agents');
    if (!island._agents.assistants?.providers.get_n_children()) throw new Error('No hay asistentes detectables');
    const {assistantCommand} = await import(`file://${island.path}/assistants.js`);
    const malicious = 'Consulta $(touch /tmp/should-not-exist); `echo test`';
    const argv = assistantCommand({id: 'codex', name: 'Codex', binary: '/fixture/codex'}, malicious, island.path);
    if (argv.at(-1) !== malicious || argv.includes('sh')) throw new Error('Consulta no preservada como argumento');
    island._settings.set_strv('home-modules', ['music', 'today', 'weather']);
    island._weather = {city: 'Ciudad de prueba', w: {temperature_2m: 23, apparent_temperature: 22, relative_humidity_2m: 65, wind_speed_10m: 9, time: '2026-11-17T13:00'}, hourly: {time: ['2026-11-17T13:00', '2026-11-17T14:00'], temperature_2m: [23, 24], precipitation_probability: [10, 15]}, daily: {time: ['2026-11-17'], temperature_2m_min: [18], temperature_2m_max: [25]}};
    island._weatherAt = Date.now();
    island._selectTab('home'); island._openIsland();
    island._workspace.peekId = 'weather'; island._workspace.renderPeek();
    if (island._workspace.cards.length !== 3 || island._workspace.preview.get_n_children() < 2) throw new Error('Resumen contextual incompleto');
    island._selectTab('weather');
    if (island._workspace.weatherBody.get_n_children() < 5) throw new Error('Pronóstico incompleto');
    island._closeIsland();
    const result = {state: ext.state, pages: Object.keys(island._builders)};
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
    for (const id of ['home', 'music', 'today', 'weather', 'notes', 'system', 'files', 'tools', 'clock', 'library', 'studio', 'agents']) {
        island._selectTab(id);
        await wait(id === 'system' ? 2000 : 400);
        const [x, y] = island._island.get_transformed_position();
        const [w, h] = island._island.get_transformed_size();
        if (x < island._monitor().x || y < island._monitor().y || x + w > island._monitor().x + island._monitor().width || y + h > island._monitor().y + island._monitor().height) throw new Error('Vista fuera de pantalla: ' + id);
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
    island._settings.set_boolean('agent-events', true);
    if (!island._agents.publish(JSON.stringify({id: 'fixture', title: 'Tarea aislada', state: 'running', progress: 0.4})))
        throw new Error('No se recibió la actividad local');
    if (!island._live.entries.some(item => item.key === 'agent-fixture')) throw new Error('Actividad local ausente');
    island._agents.publish(JSON.stringify({id: 'fixture', title: 'Tarea aislada', state: 'done'}));
    if (island._live.entries.some(item => item.key === 'agent-fixture')) throw new Error('Actividad terminada todavía activa');
    const task = Gio.Subprocess.new(['python3', `${island.path}/aurea-task.py`, '--id', 'cli-fixture', '--title', 'Prueba "local"', '--state', 'waiting'], Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE);
    await new Promise((resolve, reject) => task.wait_async(null, (process, response) => {
        process.wait_finish(response);
        if (process.get_successful()) resolve(); else reject(new Error('CLI de tareas no publica por D-Bus'));
    }));
    if (island._agents.items.get('cli-fixture')?.title !== 'Prueba "local"') throw new Error('Texto de tarea alterado');
    if (island._agents.publish('{invalid')) throw new Error('Se aceptó JSON inválido');
    island._shelfBridge.open();
    for (let i = 0; i < 100 && !island._shelfBridge.window; i++) await wait(100);
    if (!island._shelfBridge.window) throw new Error('El estante GTK no abrió');
    await wait(3500);
    if (island._barsTimer || island._marqueeOn) throw new Error('Animaciones compactas siguen activas detrás del estante');
    console.log('Estante ventana: ' + JSON.stringify({rect: island._shelfBridge.window.get_frame_rect(), hidden: island._shelfBridge.window.is_hidden(), workspace: island._shelfBridge.window.get_workspace()?.index()}));
    const shelfStream = Gio.File.new_for_path(`${directory}/shelf-gtk.png`)
        .replace(null, false, Gio.FileCreateFlags.REPLACE_DESTINATION, null);
    await new Shell.Screenshot().screenshot(false, shelfStream);
    shelfStream.close(null);
    island._shelfBridge.close();
    island._syncFullscreen();
    for (let i = 0; i < 100; i++) {
        island._openIsland(); await wait(4);
        island._closeIsland(); await wait(4);
    }
    await wait(400);
    if (island._grab || island._motion?.timeline || island._island.visible)
        throw new Error('Las interrupciones dejaron recursos de interacción activos');
    result.interruptions = '100 aperturas/cierres interrumpidos sin grab ni timeline pendientes';
    island._shelf = [file.get_path()];
    island._shelfPins.add(file.get_path());
    island._saveShelf();
    island._shelfClear();
    if (!island._shelf.includes(file.get_path())) throw new Error('Limpiar retiró un archivo fijado');
    file.delete(null);
    await wait(200);
    if (island._shelf.includes(file.get_path()) || island._shelfPins.has(file.get_path())) throw new Error('Referencia eliminada permanece en el estante');
    island._agents.publish(JSON.stringify({id: 'disable-fixture', title: 'Trabajo', state: 'running'}));
    island._settings.set_boolean('agent-events', false);
    if (island._live.entries.some(item => item.key.startsWith('agent-'))) throw new Error('Integración desactivada conserva actividades');
    for (const monitor of Main.layoutManager.monitors) {
        island._settings.set_int('monitor', monitor.index);
        island._openIsland(); await wait(500);
        const [x, y] = island._island.get_transformed_position();
        const [w, h] = island._island.get_transformed_size();
        if (x < monitor.x || y < monitor.y || x + w > monitor.x + monitor.width || y + h > monitor.y + monitor.height)
            throw new Error('La isla desborda el monitor ' + monitor.index);
        island._closeIsland(); await wait(400);
    }
    result.monitors = Main.layoutManager.monitors.length;
    island._settings.set_int('monitor', 15);
    if (island._monitor() !== Main.layoutManager.primaryMonitor) throw new Error('No recupera pantalla principal al faltar monitor');
    island._settings.reset('monitor');
    if (GLib.getenv('DI_TEST_SCALES') === '1') {
        const displayCall = (method, args = null) => new Promise((resolve, reject) => Gio.DBus.session.call(
            'org.gnome.Mutter.DisplayConfig', '/org/gnome/Mutter/DisplayConfig', 'org.gnome.Mutter.DisplayConfig',
            method, args, null, Gio.DBusCallFlags.NONE, 5000, null, (bus, response) => {
                try { resolve(bus.call_finish(response).recursiveUnpack()); } catch (error) { reject(error); }
            }));
        result.scales = [];
        for (const scale of [1.25, 1.5, 2]) {
            const [serial, physical] = await displayCall('GetCurrentState');
            const mode = physical[0][1].find(entry => entry[6]['is-current']);
            if (!mode[5].includes(scale)) continue;
            let x = 0;
            const layout = physical.map(([spec, modes], index) => {
                const active = modes.find(entry => entry[6]['is-current']);
                const factor = index === 0 ? scale : 1;
                const entry = [x, 0, factor, 0, index === 0, [[spec[0], active[0], {}]]];
                x += Math.round(active[1] / factor);
                return entry;
            });
            await displayCall('ApplyMonitorsConfig', new GLib.Variant('(uua(iiduba(ssa{sv}))a{sv})', [serial, 1, layout, {'layout-mode': new GLib.Variant('u', 1)}]));
            await wait(600);
            island._settings.set_int('monitor', 0);
            island._openIsland(); await wait(500);
            const mon = island._monitor();
            const [x0, y0] = island._island.get_transformed_position();
            const [width, height] = island._island.get_transformed_size();
            if (x0 < mon.x || x0 + width > mon.x + mon.width || y0 + height > mon.y + mon.height)
                throw new Error('Desborde con escala ' + scale);
            const stream = Gio.File.new_for_path(`${directory}/scale-${scale}.png`).replace(null, false, Gio.FileCreateFlags.REPLACE_DESTINATION, null);
            await new Shell.Screenshot().screenshot(false, stream); stream.close(null);
            island._closeIsland(); await wait(400);
            result.scales.push(scale);
        }
        island._settings.reset('monitor');
    }
    island._settings.set_value('timer-presets', new GLib.Variant('ai', [3, 7, 12]));
    if (island._presets.get_n_children() !== 3) throw new Error('Duraciones rápidas no actualizadas');
    island._settings.reset('timer-presets');
    island._settings.set_strv('home-modules', ['files', 'notes']);
    if (island._workspace.cards.map(card => card.id).join(',') !== 'files,notes') throw new Error('La organización no se aplica');
    island._settings.reset('home-modules');
    island._settings.set_boolean('app-launcher', true);
    island._settings.set_boolean('show-mascot', true);
    island._settings.set_boolean('celebration-effects', true);
    island._selectTab('applications'); island._openIsland(); await wait(500);
    island._ornaments.celebrate(); await wait(150);
    const appsStream = Gio.File.new_for_path(`${directory}/applications.png`).replace(null, false, Gio.FileCreateFlags.REPLACE_DESTINATION, null);
    await new Shell.Screenshot().screenshot(false, appsStream); appsStream.close(null);
    await wait(650);
    if (island._ornaments.particles.size) throw new Error('Partículas no retiradas');
    island._ornaments.celebrate(); island._closeIsland(); await wait(400);
    if (island._ornaments.particles.size) throw new Error('Cerrar conserva partículas');
    island._settings.set_boolean('app-launcher', false);
    island._settings.set_boolean('show-mascot', false);
    island._settings.set_boolean('celebration-effects', false);
    island._settings.set_string('theme', 'glass');
    island._applyIsland(0);
    if (island._glassEffect.get_enabled()) throw new Error('Blur activo sin superficie abierta');
    island._applyIsland(1);
    if (!island._glassEffect.get_enabled()) throw new Error('Blur ausente con superficie abierta');
    island._settings.set_boolean('animations', false);
    island._openIsland();
    if (island._motion?.timeline) throw new Error('Animaciones desactivadas aún crean temporizador');
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
