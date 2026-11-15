import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
export function run(cmd) {
    try {
        GLib.spawn_command_line_async(cmd);
    } catch (e) {
        console.error(`[Lintel] ${cmd}: ${e}`);
    }
}

export function busCall(conn, dest, path, iface, method, params = null) {
    conn.call(dest, path, iface, method, params, null, Gio.DBusCallFlags.NONE, -1, null,
        (c, r) => {
            try {
                c.call_finish(r);
            } catch (e) {
                console.error(`[Lintel] ${method}: ${e.message}`);
            }
        });
}

export function settingsFor(id) {
    const src = Gio.SettingsSchemaSource.get_default();
    return src?.lookup(id, true) ? new Gio.Settings({schema_id: id}) : null;
}

export function settingsForExtension(id, uuid) {
    for (const candidate of (Array.isArray(uuid) ? uuid : [uuid])) {
        for (const root of [GLib.get_user_data_dir(), ...GLib.get_system_data_dirs()]) {
          const schemaDir = GLib.build_filenamev([root, 'gnome-shell', 'extensions', candidate, 'schemas']);
          if (!GLib.file_test(schemaDir, GLib.FileTest.IS_DIR)) continue;
          const source = Gio.SettingsSchemaSource.new_from_directory(schemaDir, Gio.SettingsSchemaSource.get_default(), false);
          const schema = source.lookup(id, false);
          if (schema) return new Gio.Settings({settings_schema: schema});
        }
    }
    return null;
}
