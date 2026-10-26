const Gio = imports.gi.Gio;
const settings = new Gio.Settings({schema_id: 'org.gnome.shell'});
const map = JSON.parse(ARGV[0]);
for (const key of ['enabled-extensions', 'disabled-extensions']) {
    const old = settings.get_strv(key);
    const next = [...new Set(old.map(id => map[id] ?? id))];
    if (JSON.stringify(old) !== JSON.stringify(next)) settings.set_strv(key, next);
}
Gio.Settings.sync();
