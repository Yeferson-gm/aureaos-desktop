import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
if (!GLib.getenv('DI_TEST_DIR')) throw new Error('Solo se ejecuta en la sesión aislada');
Gio.Resource.load('/usr/share/gnome-shell/org.gnome.Shell.Extensions.src.gresource')._register();
const {default: Preferences} = await import('../prefs.js');
const app = new Adw.Application({application_id: 'org.aurea.TopbarPreferencesTest'});
let failure = null;
app.connect('activate', () => {
    try {
        const prefs = new Preferences({uuid: 'lintel-v2@local', name: 'Aurea', dir: Gio.File.new_for_path(GLib.getenv('DI_PROJECT_DIR')), path: GLib.getenv('DI_PROJECT_DIR')});
        const window = new Adw.PreferencesWindow({application: app, title: 'Aurea · Prueba de preferencias'});
        prefs.fillPreferencesWindow(window); window.present();
        GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 3, () => { window.close(); app.quit(); return GLib.SOURCE_REMOVE; });
    } catch (error) { failure = error; app.quit(); }
});
app.run([]);
if (failure) throw failure;
print('PASS: preferencias GTK4 construidas, mostradas y cerradas');
