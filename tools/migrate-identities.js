const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const settings = new Gio.Settings({schema_id: 'org.gnome.shell'});
const map = JSON.parse(ARGV[0]);
const keys = ['enabled-extensions', 'disabled-extensions'];
const snapshot = Object.fromEntries(keys.map(key => [key, settings.get_strv(key)]));
if (ARGV[1] === '--live') {
    try {
        for (const id of Object.keys(map).filter(id => snapshot['enabled-extensions'].includes(id))) {
            const info = Gio.DBus.session.call_sync('org.gnome.Shell', '/org/gnome/Shell',
                'org.gnome.Shell.Extensions', 'GetExtensionInfo', new GLib.Variant('(s)', [id]),
                null, Gio.DBusCallFlags.NONE, 10000, null).deep_unpack()[0];
            if (!Object.keys(info).length) continue;
            const result = Gio.DBus.session.call_sync('org.gnome.Shell', '/org/gnome/Shell',
                'org.gnome.Shell.Extensions', 'DisableExtension', new GLib.Variant('(s)', [id]),
                null, Gio.DBusCallFlags.NONE, 10000, null).deep_unpack()[0];
            if (!result) throw new Error(`No se pudo desactivar ${id}; no se retirarán sus archivos.`);
            let inactive = false;
            for (let attempt = 0; attempt < 100; attempt++) {
                const status = Gio.DBus.session.call_sync('org.gnome.Shell', '/org/gnome/Shell',
                    'org.gnome.Shell.Extensions', 'GetExtensionInfo', new GLib.Variant('(s)', [id]),
                    null, Gio.DBusCallFlags.NONE, 10000, null).deep_unpack()[0];
                const state = status.state?.deep_unpack();
                if (state === undefined || [2, 3, 4, 6, 99].includes(state)) {
                    inactive = true;
                    break;
                }
                GLib.usleep(100000);
            }
            if (!inactive) throw new Error(`La desactivación de ${id} no terminó; se conservan sus archivos.`);
        }
    } catch (error) {
        for (const key of keys) settings.set_strv(key, snapshot[key]);
        Gio.Settings.sync();
        throw error;
    }
}
for (const key of keys) {
    const next = [...new Set(snapshot[key].map(id => map[id] ?? id))];
    settings.set_strv(key, next);
}
Gio.Settings.sync();
