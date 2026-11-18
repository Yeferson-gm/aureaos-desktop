(async () => {
    if (!GLib.getenv('DI_TEST_DIR')) throw new Error('Solo en la sesión aislada');
    const wait = ms => new Promise(resolve => GLib.timeout_add(GLib.PRIORITY_DEFAULT, ms, () => { resolve(); return GLib.SOURCE_REMOVE; }));
    const island = Main.extensionManager.lookup('dynamic-island-gnome50@local')?.stateObj;
    if (!island?._musicTools) throw new Error('No se cargaron los controles de música');
    Main.overview.hide();
    await wait(700);
    const {testMusic} = await import(`file://${GLib.getenv('DI_PROJECT_DIR')}/tests/music-runtime.js`);
    await testMusic(island, wait);
    island.disable();
    if (island._sources.size || island._grab) throw new Error('La música deja recursos activos al deshabilitar');
    return 'PASS: favoritos persistentes, aleatorio, repetición, velocidad, búsqueda, capacidades, errores y layout';
})().then(result => GLib.file_set_contents(`${GLib.getenv('DI_TEST_DIR')}/result.txt`, result))
    .catch(error => GLib.file_set_contents(`${GLib.getenv('DI_TEST_DIR')}/result.txt`, `FAIL: ${error.message}\n${error.stack}`));
