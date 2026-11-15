(async () => {
    const {default: GLib} = await import('gi://GLib');
    const {default: Gio} = await import('gi://Gio');
    const {default: St} = await import('gi://St');
    const Main = await import('resource:///org/gnome/shell/ui/main.js');
    const directory = GLib.getenv('DI_TEST_DIR');
    const pause = ms => new Promise(resolve => GLib.timeout_add(GLib.PRIORITY_DEFAULT, ms, () => { resolve(); return GLib.SOURCE_REMOVE; }));
    try {
        const [, bytes] = GLib.file_get_contents(`${directory}/manifest.json`);
        const manifest = JSON.parse(new TextDecoder().decode(bytes));
        const manager = Main.extensionManager;
        const driver = await import(`file://${directory}/data/gnome-shell/extensions/aurea-battery-care@local/lib/driver.js`);
        driver.IntializeDriver.prototype._checkCompatibility = function () {};
        const ids = [...Object.values(manifest).map(item => item.uuid), 'lintel-v2@local'];
        for (const id of ids) {
            await manager.enableExtension(id);
            await pause(250);
            const extension = manager.lookup(id);
            if (extension?.state !== 1) throw new Error(`${id}: ${JSON.stringify(extension?.errors)} state=${extension?.state}`);
        }
        const schema = manager.lookup('aurea-shell-theme@local').stateObj.getSettings();
        for (let cycle = 0; cycle < 2; cycle++) {
            schema.set_string('name', '');
            Main.loadTheme();
            await pause(100);
            await manager.disableExtension('lintel-v2@local');
            Main.loadTheme();
            if (St.ThemeContext.get_for_stage(global.stage).get_theme().get_custom_stylesheets().some(file => file.get_basename().startsWith('aurea-topbar-')))
                throw new Error('Hoja CSS temporal permanece tras desactivar la barra');
            for (const id of ids.filter(id => id !== 'lintel-v2@local').reverse()) await manager.disableExtension(id);
            await pause(400);
            for (const id of ids) {
                const extension = manager.lookup(id);
                if (extension.state !== 2) throw new Error(`Disable ${id}: state=${extension.state} ${JSON.stringify(extension.errors)}`);
                await manager.enableExtension(id);
            }
            await pause(400);
            for (const id of ids) {
                const extension = manager.lookup(id);
                if (extension.state !== 1) throw new Error(`Reenable ${id}: state=${extension.state} ${JSON.stringify(extension.errors)}`);
            }
        }
        GLib.file_set_contents(`${directory}/result.txt`, 'PASS: 10 módulos y topbar; dos ciclos; recarga de tema sin CSS temporal huérfano. Controlador de carga simulado.\n');
    } catch (error) {
        GLib.file_set_contents(`${directory}/result.txt`, `FAIL: ${error.message}\n${error.stack}\n`);
    }
})();
