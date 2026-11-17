import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

export async function keyboardFixture() {
    if (!GLib.getenv('DI_TEST_DIR') && !GLib.getenv('AUREA_KEYBOARD_TEST')) throw new Error('Solo bus de pruebas');
    const iface = 'org.gnome.SettingsDaemon.Power.Keyboard';
    const fixture = {
        value: 0, writes: [],
        get Brightness() { return this.value; },
        set Brightness(value) {
            this.writes.push(value);
            this.change(Math.round(value / 50) * 50);
        },
        get Steps() { return 3; },
        change(value) { this.value = value; this.exported.emit_property_changed('Brightness', new GLib.Variant('i', value)); },
        destroy() { this.exported.unexport(); Gio.bus_unown_name(this.owner); },
    };
    fixture.exported = Gio.DBusExportedObject.wrapJSObject(`<node><interface name="${iface}"><property name="Brightness" type="i" access="readwrite"/><property name="Steps" type="i" access="read"/></interface></node>`, fixture);
    fixture.exported.export(Gio.DBus.session, '/org/gnome/SettingsDaemon/Power');
    await new Promise((resolve, reject) => {
        fixture.owner = Gio.bus_own_name_on_connection(Gio.DBus.session, 'org.gnome.SettingsDaemon.Power', Gio.BusNameOwnerFlags.NONE, resolve, () => reject(new Error('Bus Power ocupado')));
    });
    return fixture;
}

if (GLib.getenv('AUREA_KEYBOARD_FIXTURE_DAEMON')) {
    await keyboardFixture();
    await new Promise(() => {});
}
