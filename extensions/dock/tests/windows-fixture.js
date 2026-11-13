import Gtk from 'gi://Gtk?version=4.0';
import GLib from 'gi://GLib';
if (!GLib.getenv('DI_TEST_DIR')) throw new Error('Solo en sesión aislada');
const app = new Gtk.Application({application_id: 'org.aurea.DockFixture'});
app.connect('activate', () => {
    for (let index = 0; index < 2; index++) {
        const window = new Gtk.ApplicationWindow({application: app, title: `Aurea Dock fixture ${index}`, default_width: 320, default_height: 240});
        window.set_child(new Gtk.Label({label: 'Ventana sintética para probar el Dock'}));
        window.present();
    }
});
app.run([]);
