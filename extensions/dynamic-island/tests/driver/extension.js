import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
export default class Driver extends Extension {
    enable() {
        if (!GLib.getenv('DI_TEST_DIR')) throw new Error('Solo se permite en la sesión aislada de pruebas');
        this._previous = global.context.unsafe_mode;
        global.context.unsafe_mode = true;
        const fixture = {
            PlaybackStatus: 'Playing',
            Metadata: {'xesam:title': new GLib.Variant('s', 'Pista de prueba MPRIS'),
                'mpris:artUrl': new GLib.Variant('s', GLib.filename_to_uri(`${this.path}/cover.svg`, null)),
                'xesam:artist': new GLib.Variant('as', ['Reproductor de prueba']),
                'mpris:length': new GLib.Variant('x', 180000000)},
            Position: 30000000,
            CanControl: true, CanPlay: true, CanPause: true,
            CanGoPrevious: true, CanGoNext: true, CanSeek: true,
            Shuffle: false, LoopStatus: 'None',
            PlayPause() { this.PlaybackStatus = this.PlaybackStatus === 'Playing' ? 'Paused' : 'Playing'; },
            Previous() {}, Next() {}, Seek(offset) { this.Position += offset; },
        };
        const properties = Object.entries({PlaybackStatus: 's', Metadata: 'a{sv}', Position: 'x',
            CanControl: 'b', CanPlay: 'b', CanPause: 'b', CanGoPrevious: 'b', CanGoNext: 'b', CanSeek: 'b',
            Shuffle: 'b', LoopStatus: 's'}).map(([name, type]) =>
            `<property name="${name}" type="${type}" access="${['Shuffle', 'LoopStatus'].includes(name) ? 'readwrite' : 'read'}"/>`).join('');
        const xml = `<node><interface name="org.mpris.MediaPlayer2.Player">${properties}
            <method name="PlayPause"/><method name="Previous"/><method name="Next"/>
            <method name="Seek"><arg type="x" direction="in" name="offset"/></method>
            </interface></node>`;
        this._object = Gio.DBusExportedObject.wrapJSObject(xml, fixture);
        this._object.export(Gio.DBus.session, '/org/mpris/MediaPlayer2');
        this._owner = Gio.bus_own_name_on_connection(Gio.DBus.session, 'org.mpris.MediaPlayer2.islandfixture',
            Gio.BusNameOwnerFlags.NONE, null, null);
    }
    disable() {
        if (this._owner) Gio.bus_unown_name(this._owner);
        this._object?.unexport();
        global.context.unsafe_mode = this._previous;
    }
}
