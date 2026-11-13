import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
if (!GLib.getenv('DI_TEST_DIR')) throw new Error('Solo se ejecuta en la sesión aislada');
Gio.Resource.load('/usr/share/gnome-shell/org.gnome.Shell.Extensions.src.gresource')._register();
const path = `${GLib.getenv('XDG_DATA_HOME')}/gnome-shell/extensions/macos27-dock@local`;
const {default: Preferences} = await import(`file://${path}/prefs.js`);
const {extensionManager} = await import('resource:///org/gnome/Shell/Extensions/js/extensionsService.js');
const [serialized] = Gio.DBus.session.call_sync('org.gnome.Shell', '/org/gnome/Shell', 'org.gnome.Shell.Extensions', 'GetExtensionInfo', new GLib.Variant('(s)', ['macos27-dock@local']), null, Gio.DBusCallFlags.NONE, 5000, null).deepUnpack();
const extension = extensionManager.createExtensionObject(serialized);
const app = new Adw.Application({application_id: 'org.aurea.DockPreferencesTest'});
let failure = null;
app.connect('activate', () => {
    try {
        const metadata = JSON.parse(new TextDecoder().decode(GLib.file_get_contents(`${path}/metadata.json`)[1]));
        const prefs = new Preferences({...metadata, dir: Gio.File.new_for_path(path), path});
        extension.stateObj = prefs;
        const window = new Adw.PreferencesWindow({application: app, title: 'Aurea · Prueba de preferencias'});
        prefs.fillPreferencesWindow(window); window.present();
        const all = [];
        const walk = widget => { all.push(widget); for (let child = widget.get_first_child(); child; child = child.get_next_sibling()) walk(child); };
        walk(window);
        const settings = prefs.getSettings('org.gnome.shell.extensions.dash-to-dock');
        const glass = all.find(widget => widget instanceof Adw.SwitchRow && widget.title === 'Vidrio');
        if (!glass) throw new Error('Falta control de vidrio');
        glass.active = false;
        if (settings.get_boolean('glass-shelf')) throw new Error('Vidrio no guarda el cambio');
        glass.active = true;
        const theme = all.find(widget => widget instanceof Adw.ComboRow && widget.title === 'Aspecto');
        theme.selected = 2;
        if (settings.get_string('material-theme') !== 'dark') throw new Error('Aspecto no guarda el cambio');
        theme.selected = 0;
        GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 3, () => { window.close(); app.quit(); return GLib.SOURCE_REMOVE; });
    } catch (error) { failure = error; app.quit(); }
});
app.run([]);
if (failure) throw failure;
print('PASS: preferencias GTK4 construidas, mostradas y cerradas');
