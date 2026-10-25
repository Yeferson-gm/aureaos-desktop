// Prueba la resolución real de iconos GTK 3/4, sin cambiar preferencias.
imports.gi.versions.Gtk = ARGV[0];
const Gtk = imports.gi.Gtk;
const Gio = imports.gi.Gio;
if (ARGV[0] === '4.0') Gtk.init();
else Gtk.init(null);
const themes = ['WhiteSur', 'WhiteSur-light', 'WhiteSur-dark'];
const root = ARGV[1];
const names = ['folder', 'folder-blue', 'folder-red', 'folder-green', 'folder-cyan',
    'folder-documents', 'folder-download', 'folder-pictures', 'folder-music', 'folder-videos',
    'user-home', 'user-desktop', 'inode-directory'];
let count = 0;
for (const themeName of themes) {
    const theme = new Gtk.IconTheme();
    if (ARGV[0] === '4.0') theme.set_theme_name(themeName);
    else theme.set_custom_theme(themeName);
    theme.set_search_path([root, '/usr/share/icons']);
    for (const name of names) {
        for (const size of [16, 22, 32, 64, 128]) {
            for (const scale of [1, 2]) {
                const icon = ARGV[0] === '4.0'
                    ? theme.lookup_icon(name, null, size, scale, Gtk.TextDirection.NONE, Gtk.IconLookupFlags.FORCE_REGULAR)
                    : theme.lookup_icon_for_scale(name, size, scale, Gtk.IconLookupFlags.FORCE_REGULAR);
                const filename = ARGV[0] === '4.0' ? icon?.get_file()?.get_path() : icon?.get_filename();
                if (!filename) throw Error(`No se resuelve ${themeName}/${name}/${size}@${scale}`);
                const [, bytes] = Gio.File.new_for_path(filename).load_contents(null);
                if (!new TextDecoder().decode(bytes).includes('id="cyan"'))
                    throw Error(`Carpeta anterior: ${themeName}/${name}/${size}@${scale}: ${filename}`);
                count++;
            }
        }
    }
}
print(`PASS: GTK ${ARGV[0]}, ${count} resoluciones cian (claro/oscuro, 1x/2x)`);
