const {Gio, GLib} = imports.gi;
const uuid = 'aurea-lock-screen@local';
const directory = Gio.File.new_for_path(GLib.build_filenamev([GLib.get_user_data_dir(), 'gnome-shell/extensions', uuid]));
if (directory.query_file_type(Gio.FileQueryInfoFlags.NOFOLLOW_SYMLINKS, null) !== Gio.FileType.DIRECTORY)
    throw new Error('La copia de usuario no es un directorio normal.');
const settings = new Gio.Settings({schema_id: 'org.gnome.shell'});
const keys = ['enabled-extensions', 'disabled-extensions'];
const previous = Object.fromEntries(keys.map(key => [key, settings.get_strv(key)]));
function call(method) {
    return Gio.DBus.session.call_sync('org.gnome.Shell', '/org/gnome/Shell',
        'org.gnome.Shell.Extensions', method, new GLib.Variant('(s)', [uuid]),
        null, Gio.DBusCallFlags.NONE, 10000, null).deep_unpack()[0];
}
function waitFor(predicate, message) {
    for (let attempt = 0; attempt < 100; attempt++) {
        if (predicate()) return;
        GLib.usleep(100000);
    }
    throw new Error(message);
}
const info = call('GetExtensionInfo');
try {
    if (info.path?.deep_unpack() === directory.get_path()) {
        if (!call('DisableExtension')) throw new Error('GNOME no pudo desactivar la copia de usuario.');
        waitFor(() => ![1, 7, 8].includes(call('GetExtensionInfo').state?.deep_unpack()), 'La desactivación no terminó.');
        if (!call('UninstallExtension')) throw new Error('GNOME no pudo retirar la copia de usuario.');
        waitFor(() => !Object.keys(call('GetExtensionInfo')).length, 'GNOME no terminó de descargar la copia anterior.');
    } else {
        directory.trash(null);
    }
} finally {
    for (const key of keys) settings.set_strv(key, previous[key]);
    Gio.Settings.sync();
}
print('Copia de usuario retirada; activación conservada para el próximo inicio de sesión.');
