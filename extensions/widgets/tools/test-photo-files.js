import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import {listarImagenes} from '../source/lib/util.js';

const root = Gio.File.new_for_path(GLib.dir_make_tmp('widget-photo-files-XXXXXX'));
const sub = root.get_child('Capturas');
sub.make_directory(null);
const photo = root.get_child('directa.png');
const nested = sub.get_child('captura.png');
const link = root.get_child('enlace.png');
const png = GLib.base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a1V8AAAAASUVORK5CYII=');
try {
    for (const f of [photo, nested]) f.replace_contents(png, null, false, Gio.FileCreateFlags.NONE, null);
    link.make_symbolic_link(nested.get_path(), null);
    const scan = () => listarImagenes(root.get_path(), 0, 3000, true);
    const files = scan();
    if (files.length !== 1 || files[0].path !== photo.get_path())
        throw new Error('Incluye subcarpetas o enlaces');
    photo.delete(null);
    if (scan().length) throw new Error('Conserva una foto eliminada');
    print('PASS: archivos reales, sin subcarpetas/enlaces, eliminación detectada');
} finally {
    for (const f of [link, photo, nested, sub, root]) {
        if (f.query_exists(null)) f.delete(null);
    }
}
