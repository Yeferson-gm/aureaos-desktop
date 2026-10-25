import Gtk from 'gi://Gtk?version=4.0';
import GLib from 'gi://GLib';
const app = new Gtk.Application({application_id: 'local.wallpaper.ContinuityTest'});
app.connect('activate', () => {
    const win = new Gtk.ApplicationWindow({application: app, title: 'Prueba temporal del fondo — se cierra sola', default_width: 480, default_height: 180});
    win.set_child(new Gtk.Label({label: 'Comprobando continuidad al maximizar y minimizar…'}));
    win.present();
    const actions = [() => win.maximize(), () => win.unmaximize(), () => win.minimize(), () => win.present(), () => win.close()];
    GLib.timeout_add(GLib.PRIORITY_DEFAULT, 2000, () => {
        actions.shift()();
        return actions.length ? GLib.SOURCE_CONTINUE : GLib.SOURCE_REMOVE;
    });
});
app.run([]);
