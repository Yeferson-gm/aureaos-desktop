(async () => {
    const Main = await import('resource:///org/gnome/shell/ui/main.js');
    const {default: GLib} = await import('gi://GLib');
    const {default: Shell} = await import('gi://Shell');
    const {default: Gio} = await import('gi://Gio');
    const wait = ms => new Promise(resolve => GLib.timeout_add(GLib.PRIORITY_DEFAULT, ms, () => {resolve(); return GLib.SOURCE_REMOVE;}));
    const renderer = Main.extensionManager.lookup('gnome-wallpaper-engine@gjs.com').stateObj._wallpaper;
    if (!renderer._sourceActor) throw new Error('El vídeo no inició');
    Main.overview.hide();
    await wait(500);
    Main.overview.showApps();
    Main.overview.dash.showAppsButton.checked = true;
    await wait(1500);
    const layer = renderer._overviewLayer;
    if (!layer || layer.get_parent() !== Main.layoutManager.overviewGroup || !layer.is_mapped())
        throw new Error('Falta el vídeo en la vista de aplicaciones');
    if (layer.reactive || layer.get_children().some(actor => actor.reactive)) throw new Error('El fondo captura clics');
    if (Main.layoutManager.overviewGroup.get_children()[0] !== layer) throw new Error('Fondo por encima de los controles');
    if (!Main.overview.dash.showAppsButton.checked) throw new Error('No se abrió la cuadrícula');
    const pid = renderer._process.get_identifier();
    for (let i = 0; i < 2; i++) {
        const output = Gio.File.new_for_path(`${GLib.getenv('DI_TEST_DIR')}/overview-${i}.png`).replace(null, false, Gio.FileCreateFlags.NONE, null);
        await new Shell.Screenshot().screenshot(false, output);
        output.close(null);
        await wait(1200);
    }
    Main.overview.hide();
    await wait(500);
    if (layer.is_mapped()) throw new Error('El fondo de aplicaciones sigue visible fuera de overview');
    if (renderer._process.get_identifier() !== pid) throw new Error('Se reinició el reproductor');
    renderer.stop();
    if (renderer._overviewLayer) throw new Error('No se eliminó la capa al detener vídeo');
    renderer.start();
    await wait(3000);
    if (!renderer._overviewLayer) throw new Error('No se restauró la capa al reiniciar vídeo');
    return 'PASS: capa de vídeo, orden, entrada, ocultación y ciclo de vida';
})()
