import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import Shell from 'gi://Shell';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

export async function run() {
    const directory = GLib.getenv('DI_TEST_DIR');
    if (!directory) throw new Error('Solo sesión aislada');
    const wait = ms => new Promise(resolve => GLib.timeout_add(GLib.PRIORITY_DEFAULT, ms, () => { resolve(); return GLib.SOURCE_REMOVE; }));
    let result;
    try {
        const [, bytes] = Gio.File.new_for_path(GLib.getenv('AUREA_PROJECT') + '/stack.json').load_contents(null);
        const manifest = JSON.parse(new TextDecoder().decode(bytes));
        const loaded = [];
        for (const name of Object.keys(manifest.extensions)) {
            const source = GLib.getenv('AUREA_PROJECT') + '/extensions/' + name + (name === 'widgets' ? '/source' : '');
            const [, metadataBytes] = Gio.File.new_for_path(source + '/metadata.json').load_contents(null);
            const metadata = JSON.parse(new TextDecoder().decode(metadataBytes));
            const extension = Main.extensionManager.lookup(metadata.uuid);
            if (extension?.state !== 1 || !extension.stateObj) throw new Error(`${name}: ${extension?.state} ${extension?.error}`);
            loaded.push(name);
        }
        Main.overview.hide();
        await wait(1500);
        const output = Gio.File.new_for_path(directory + '/stack.png').replace(null, false, Gio.FileCreateFlags.NONE, null);
        await new Shell.Screenshot().screenshot(false, output);
        output.close(null);
        for (const name of loaded.slice().reverse()) {
            const source = GLib.getenv('AUREA_PROJECT') + '/extensions/' + name + (name === 'widgets' ? '/source' : '');
            const [, data] = GLib.file_get_contents(source + '/metadata.json');
            const {uuid} = JSON.parse(new TextDecoder().decode(data));
            await Main.extensionManager.disableExtension(uuid);
            for (let attempt = 0; attempt < 50 && Main.extensionManager.lookup(uuid).state !== 2; attempt++) await wait(100);
            if (Main.extensionManager.lookup(uuid).state !== 2) throw new Error('No se desactivó ' + uuid);
        }
        await wait(500);
        result = 'PASS: carga y descarga: ' + loaded.join(', ');
    } catch (error) {
        result = 'FAIL: ' + error.message + String.fromCharCode(10) + error.stack + String.fromCharCode(10) + Object.entries(Main.panel.statusArea).map(([key, value]) => `${key}: ${value.constructor.name}`).join('; ');
    }
    Gio.File.new_for_path(directory + '/result.txt').replace_contents(new TextEncoder().encode(result), null, false, Gio.FileCreateFlags.NONE, null);
}
