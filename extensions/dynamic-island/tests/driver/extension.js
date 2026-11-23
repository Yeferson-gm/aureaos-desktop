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
                'mpris:trackid': new GLib.Variant('o', '/org/mpris/MediaPlayer2/track/test'),
                'xesam:album': new GLib.Variant('s', 'Álbum de prueba'),
                'xesam:url': new GLib.Variant('s', 'https://example.org/test-track'),
                'mpris:artUrl': new GLib.Variant('s', GLib.filename_to_uri(`${this.path}/cover.svg`, null)),
                'xesam:artist': new GLib.Variant('as', ['Reproductor de prueba']),
                'mpris:length': new GLib.Variant('x', 180000000)},
            Position: 30000000,
            CanControl: true, CanPlay: true, CanPause: true,
            CanGoPrevious: true, CanGoNext: true, CanSeek: true,
            Shuffle: false, _loopStatus: 'None', ignoreLoop: false,
            get LoopStatus() { return this._loopStatus; },
            set LoopStatus(value) {
                if (!this.ignoreLoop) this._loopStatus = value;
            }, Rate: 1, MinimumRate: 0.5, MaximumRate: 2, Volume: 0.6,
            Identity: 'Aurea fixture', CanRaise: true, Raise() { this.raised = true; },
            Stop() { this.PlaybackStatus = 'Stopped'; },
            SetPosition(track, position) { if (track === '/org/mpris/MediaPlayer2/track/test') this.Position = position; },
            PlayPause() { this.PlaybackStatus = this.PlaybackStatus === 'Playing' ? 'Paused' : 'Playing'; },
            Previous() {}, Next() {}, Seek(offset) { this.Position += offset; },
        };
        const properties = Object.entries({PlaybackStatus: 's', Metadata: 'a{sv}', Position: 'x',
            CanControl: 'b', CanPlay: 'b', CanPause: 'b', CanGoPrevious: 'b', CanGoNext: 'b', CanSeek: 'b',
            Shuffle: 'b', LoopStatus: 's', Rate: 'd', MinimumRate: 'd', MaximumRate: 'd', Volume: 'd'}).map(([name, type]) =>
            `<property name="${name}" type="${type}" access="${['Shuffle', 'LoopStatus', 'Rate', 'Volume'].includes(name) ? 'readwrite' : 'read'}"/>`).join('');
        const xml = `<node><interface name="org.mpris.MediaPlayer2.Player">${properties}
            <method name="Stop"/><method name="SetPosition"><arg type="o" direction="in" name="track"/><arg type="x" direction="in" name="position"/></method>
            <method name="PlayPause"/><method name="Previous"/><method name="Next"/>
            <method name="Seek"><arg type="x" direction="in" name="offset"/></method>
            </interface></node>`;
        this.fixture = fixture;
        this._root = Gio.DBusExportedObject.wrapJSObject(`<node><interface name="org.mpris.MediaPlayer2"><property name="Identity" type="s" access="read"/><property name="CanRaise" type="b" access="read"/><method name="Raise"/></interface></node>`, fixture);
        this._root.export(Gio.DBus.session, '/org/mpris/MediaPlayer2');
        this._object = Gio.DBusExportedObject.wrapJSObject(xml, fixture);
        this._object.export(Gio.DBus.session, '/org/mpris/MediaPlayer2');
        const ids = ['/org/mpris/MediaPlayer2/track/test', '/org/mpris/MediaPlayer2/track/next'];
        const queue = {
            Tracks: [...ids], CanEditTracks: true,
            GetTracksMetadata(tracks) { return tracks.map(id => ({'mpris:trackid': new GLib.Variant('o', id),
                'xesam:title': new GLib.Variant('s', id === ids[0] ? 'Pista de prueba MPRIS' : 'Siguiente canción'),
                'xesam:artist': new GLib.Variant('as', ['Artista de prueba'])})); },
            GoTo(id) { this.selected = id; },
            RemoveTrack(id) { this.Tracks = this.Tracks.filter(track => track !== id); },
        };
        this.queue = queue;
        this._queue = Gio.DBusExportedObject.wrapJSObject(`<node><interface name="org.mpris.MediaPlayer2.TrackList">
            <property name="Tracks" type="ao" access="read"/><property name="CanEditTracks" type="b" access="read"/>
            <method name="GetTracksMetadata"><arg name="ids" type="ao" direction="in"/><arg name="metadata" type="aa{sv}" direction="out"/></method>
            <method name="GoTo"><arg name="id" type="o" direction="in"/></method>
            <method name="RemoveTrack"><arg name="id" type="o" direction="in"/></method>
            <signal name="TrackListReplaced"><arg name="tracks" type="ao"/><arg name="current" type="o"/></signal>
            </interface></node>`, queue);
        this._queue.export(Gio.DBus.session, '/org/mpris/MediaPlayer2');
        this._owner = Gio.bus_own_name_on_connection(Gio.DBus.session, 'org.mpris.MediaPlayer2.islandfixture',
            Gio.BusNameOwnerFlags.NONE, null, null);
    }
    disable() {
        if (this._owner) Gio.bus_unown_name(this._owner);
        this._object?.unexport();
        this._root?.unexport();
        this._queue?.unexport();
        global.context.unsafe_mode = this._previous;
    }
}
