import Clutter from 'gi://Clutter';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import St from 'gi://St';
import {trackInfo} from './music-model.js';

const TRACKS = 'org.mpris.MediaPlayer2.TrackList';
const PROPS = 'org.freedesktop.DBus.Properties';
const PATH = '/org/mpris/MediaPlayer2';

export class MusicQueue {
    constructor(tools, page, navigation) {
        this.tools = tools;
        this.island = tools.island;
        this.generation = 0;
        this.actor = new St.BoxLayout({orientation: Clutter.Orientation.VERTICAL, style_class: 'di-music-tools', visible: false});
        this.button = this.island._chip('A continuación', () => tools.togglePanel('queue'), 'view-list-symbolic');
        this.button.add_style_class_name('di-music-nav-button'); this.button.x_expand = true;
        navigation.insert_child_at_index(this.button, 0);
        this.heading = this.island._label('Cola del reproductor', 'di-queue-heading');
        this.actor.add_child(this.heading);
        const scroll = this.island._scroll(180);
        this.scroll = scroll;
        this.rows = new St.BoxLayout({orientation: Clutter.Orientation.VERTICAL, style_class: 'di-list', width: 350});
        scroll.add_child(this.rows); this.actor.add_child(scroll); page.add_child(this.actor);
    }

    sync() {
        const player = this.island._name;
        if (player !== this.player) {
            this.disconnect(); this.player = player; this.generation++;
            this.current = null;
            if (player) this.subscription = this.island._bus.signal_subscribe(player, TRACKS, null, PATH, null,
                Gio.DBusSignalFlags.NONE, () => this.schedule());
        }
        const current = this.tools.props.Metadata?.['mpris:trackid'];
        if (current !== this.current) { this.current = current; this.schedule(); }
    }

    schedule() {
        if (!this.actor.visible || this.timer) return;
        this.timer = this.island._timeout(100, () => { this.timer = 0; this.refresh(); });
    }

    query(iface, method, params) {
        const player = this.player, generation = this.generation;
        return new Promise((resolve, reject) => this.island._bus.call(player, PATH, iface, method, params,
            null, Gio.DBusCallFlags.NONE, 2500, this.island._cancel, (bus, result) => {
                try {
                    const reply = bus.call_finish(result).recursiveUnpack();
                    if (!this.island._alive || generation !== this.generation || player !== this.island._name)
                        reject(new Error('stale'));
                    else resolve(reply);
                } catch (error) { reject(error); }
            }));
    }

    empty(message) {
        this.rows.destroy_all_children();
        const text = this.island._label(message, 'di-queue-empty', {width: 340});
        text.clutter_text.set_line_wrap(true); this.rows.add_child(text);
        this.fit();
        this.island._resizeIsland();
    }

    fit() {
        this.scroll.set_height(Math.min(180, Math.max(44, this.rows.get_preferred_height(350)[1])));
    }

    async refresh() {
        this.sync();
        this.island._clear(this.timer); this.timer = 0;
        const generation = ++this.generation;
        if (!this.player) { this.empty('Abre un reproductor para consultar su cola.'); return; }
        this.empty('Consultando la cola…');
        try {
            const [props] = await this.query(PROPS, 'GetAll', new GLib.Variant('(s)', [TRACKS]));
            const ids = (Array.isArray(props.Tracks) ? props.Tracks : []).filter(id => typeof id === 'string' &&
                GLib.Variant.is_object_path(id) && !id.endsWith('/NoTrack'));
            const currentIndex = ids.indexOf(this.current);
            const shown = ids.slice(Math.max(0, currentIndex), Math.max(0, currentIndex) + 40);
            if (!shown.length) { this.empty('La cola está vacía.'); return; }
            const [metadata] = await this.query(TRACKS, 'GetTracksMetadata', new GLib.Variant('(ao)', [shown]));
            if (generation !== this.generation) return;
            this.heading.text = `A continuación · ${shown.length}${ids.length > shown.length ? ' de ' + ids.length : ''}`;
            this.rows.destroy_all_children();
            for (const [index, data] of metadata.entries()) {
                const id = shown[index];
                if (!id) break;
                const track = trackInfo(data), playing = id === this.current;
                const row = new St.BoxLayout({style_class: `di-queue-row${playing ? ' di-queue-current' : ''}`});
                const select = new St.Button({style_class: 'di-queue-track', x_expand: true, reactive: true, can_focus: true,
                    accessible_name: `Reproducir ${track.title || 'Pista ' + (index + 1)}`});
                const content = new St.BoxLayout({style_class: 'di-queue-content'});
                content.add_child(new St.Icon({icon_name: playing ? 'media-playback-start-symbolic' : 'audio-x-generic-symbolic', icon_size: 18}));
                const labels = new St.BoxLayout({orientation: Clutter.Orientation.VERTICAL, x_expand: true});
                for (const [text, style] of [[track.title || `Pista ${index + 1}`, 'di-queue-title'],
                    [playing ? `Ahora · ${track.artist}` : track.artist || track.album, 'di-queue-artist']]) {
                    const label = this.island._label(text, style, {width: 260});
                    label.clutter_text.set_ellipsize(3); labels.add_child(label);
                }
                content.add_child(labels); select.set_child(content);
                select.connect('clicked', () => this.act('GoTo', id)); row.add_child(select);
                if (props.CanEditTracks === true) {
                    const remove = this.island._iconBtn('list-remove-symbolic', () => this.act('RemoveTrack', id));
                    remove.accessible_name = `Quitar ${track.title} de la cola`; row.add_child(remove);
                }
                this.rows.add_child(row);
            }
            this.fit();
            this.island._resizeIsland();
        } catch {
            if (generation === this.generation && this.island._alive)
                this.empty('Este reproductor no comparte su cola. Puedes abrirla desde su aplicación.');
        }
    }

    act(method, id) {
        this.tools.request(TRACKS, method, new GLib.Variant('(o)', [id]), () => {
            this.island._refresh(); this.schedule();
        }, {trackBound: false});
    }

    disconnect() {
        if (this.subscription) this.island._bus.signal_unsubscribe(this.subscription);
        this.subscription = 0;
        this.island._clear(this.timer); this.timer = 0;
    }

    destroy() { this.generation++; this.disconnect(); }
}
