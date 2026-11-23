import Clutter from 'gi://Clutter';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import St from 'gi://St';
import {MusicQueue} from './music-queue.js';
import {MusicPanel} from './music-panel.js';
import {cleanFavorites, playbackRates, trackInfo, repeatLabel} from './music-model.js';

const PLAYER = 'org.mpris.MediaPlayer2.Player';
const ROOT = 'org.mpris.MediaPlayer2';
const PATH = '/org/mpris/MediaPlayer2';
const PROPS = 'org.freedesktop.DBus.Properties';

export class MusicTools {
    constructor(island) {
        this.island = island;
        this.props = {};
        this.track = trackInfo();
        this.pending = new Set();
        this.epoch = 0;
        this.propertyWrites = new Map();
        this.unsupported = new Set();
        this.favorites = [];
        this.file = Gio.File.new_for_path(`${island._dataDir}/music-favorites.json`);
        try {
            const [ok, data] = this.file.load_contents(null);
            if (ok) this.favorites = cleanFavorites(JSON.parse(new TextDecoder().decode(data)));
        } catch (error) {
            if (!error.matches?.(Gio.IOErrorEnum, Gio.IOErrorEnum.NOT_FOUND))
                console.warn(`Aurea music favorites: ${error.message}`);
        }
    }

    build(page, controls, metadataBox) {
        const e = this.island;
        this.star = e._iconBtn('non-starred-symbolic', () => this.toggleFavorite(), 'di-control', 19);
        controls.insert_child_below(this.star, controls.get_last_child());
        this.album = e._label('', 'di-music-album', {width: 268, visible: false});
        metadataBox.insert_child_at_index(this.album, 2);
        const navigation = new St.BoxLayout({style_class: 'di-music-navigation'});
        this.libraryButton = e._chip('Favoritas', () => this.togglePanel('favorites'), 'starred-symbolic');
        this.moreButton = e._chip('Opciones', () => this.togglePanel('more'), 'preferences-system-symbolic');
        this.libraryButton.add_style_class_name('di-music-nav-button');
        this.moreButton.add_style_class_name('di-music-nav-button');
        this.libraryButton.x_expand = this.moreButton.x_expand = true;
        navigation.add_child(this.libraryButton);
        navigation.add_child(this.moreButton);
        page.add_child(navigation);
        this.panel = new MusicPanel(this);
        this.more = this.panel.actor;
        const {playback, audio, track} = this.panel.sections;
        this.shuffleRow = this.panel.row(playback, 'Aleatorio', 'media-playlist-shuffle-symbolic', () => e._toggleShuffle());
        this.repeatRow = this.panel.row(playback, 'Repetir', 'media-playlist-repeat-symbolic', () => {
            if (!('LoopStatus' in this.props) || this.unsupported.has('LoopStatus')) { this.unavailable('LoopStatus'); return; }
            this.repeatChoices.visible = !this.repeatChoices.visible;
            e._resizeIsland();
        });
        this.repeatChoices = new St.BoxLayout({style_class: 'di-music-jump-row', visible: false});
        this.repeatButtons = new Map();
        for (const [value, label] of [['None', 'No repetir'], ['Playlist', 'Lista'], ['Track', 'Canción']]) {
            const button = e._chip(label, () => {
                this.repeatChoices.visible = false;
                this.setProperty('LoopStatus', new GLib.Variant('s', value));
                e._resizeIsland();
            });
            button.add_style_class_name('di-music-jump'); button.x_expand = true;
            this.repeatButtons.set(value, button); this.repeatChoices.add_child(button);
        }
        playback.add_child(this.repeatChoices);
        const jumps = new St.BoxLayout({style_class: 'di-music-jump-row'});
        this.back = e._chip('Retroceder 15 s', () => e._seekTo(e._position - 15), 'media-seek-backward-symbolic');
        this.forward = e._chip('Avanzar 15 s', () => e._seekTo(e._position + 15), 'media-seek-forward-symbolic');
        for (const button of [this.back, this.forward]) { button.x_expand = true; button.add_style_class_name('di-music-jump'); jumps.add_child(button); }
        playback.add_child(jumps);
        this.rate = this.panel.row(playback, 'Velocidad', 'preferences-system-time-symbolic', () => this.cycleRate(), '1×');
        this.stop = this.panel.row(playback, 'Detener reproducción', 'media-playback-stop-symbolic', () => this.command('Stop'));
        this.output = this.panel.row(audio, 'Salida de audio', 'audio-headphones-symbolic', () => {
            this.outputs.visible = !this.outputs.visible;
            this.refreshOutputs();
            e._resizeIsland();
        });
        this.outputs = new St.BoxLayout({orientation: Clutter.Orientation.VERTICAL, style_class: 'di-music-outputs', visible: false});
        audio.add_child(this.outputs);
        this.appAudio = this.panel.row(audio, 'Volumen por aplicación', 'applications-multimedia-symbolic', () => {
            e._appAudio.visible = !e._appAudio.visible;
            if (e._appAudio.visible) e._renderAppAudio();
            this.panel.state(this.appAudio, e._appAudio.visible ? 'Ocultar' : 'Ver');
            e._resizeIsland();
        }, 'Ver');
        this.raise = this.panel.row(track, 'Abrir reproductor', 'application-x-executable-symbolic', () => this.openPlayer());
        this.copy = this.panel.row(track, 'Copiar canción', 'edit-copy-symbolic', () => {
            St.Clipboard.get_default().set_text(St.ClipboardType.CLIPBOARD,
                this.track.url || [this.track.title, this.track.artist].filter(Boolean).join(' — '));
            this.message(this.track.url ? 'Enlace copiado.' : 'Título y artista copiados.');
        });
        page.add_child(this.more);
        this.library = new St.BoxLayout({orientation: Clutter.Orientation.VERTICAL, style_class: 'di-music-tools', visible: false});
        this.library.add_child(e._label('Favoritas de Aurea · guardadas en este equipo', 'di-hint', {width: 350}));
        this.favoriteRows = new St.BoxLayout({orientation: Clutter.Orientation.VERTICAL, style_class: 'di-list'});
        const scroll = e._scroll(146);
        scroll.width = 350;
        scroll.add_child(this.favoriteRows);
        this.library.add_child(scroll);
        page.add_child(this.library);
        this.queue = new MusicQueue(this, page, navigation);
        this.status = e._label('', 'di-music-feedback', {width: 380, visible: false});
        this.status.clutter_text.set_line_wrap(true);
        page.add_child(this.status);
        this.update({});
    }

    setEnabled(actor, enabled, label) {
        actor.reactive = actor.can_focus = !!enabled;
        actor.opacity = enabled ? 255 : 170;
        actor[enabled ? 'remove_style_pseudo_class' : 'add_style_pseudo_class']('disabled');
        if (label) actor.accessible_name = label;
    }

    message(text) {
        this.status.text = text;
        this.status.visible = !!text;
        this.island._resizeIsland();
    }

    togglePanel(panel) {
        const target = panel === 'favorites' ? this.library : panel === 'queue' ? this.queue.actor : this.more;
        const show = !target.visible;
        this.library.visible = this.more.visible = this.queue.actor.visible = false;
        target.visible = show;
        if (panel === 'queue' && show) this.queue.refresh();
        if (panel === 'favorites' && show) this.renderFavorites();
        for (const [button, box] of [[this.libraryButton, this.library], [this.moreButton, this.more], [this.queue.button, this.queue.actor]])
            button[box.visible ? 'add_style_pseudo_class' : 'remove_style_pseudo_class']('checked');
        this.island._resizeIsland();
    }

    update(props) {
        const e = this.island;
        const next = trackInfo(props.Metadata);
        const playerChanged = this.player !== e._name;
        const changed = next.key !== this.track.key || playerChanged;
        if (playerChanged) { this.epoch++; this.unsupported.clear(); this.propertyWrites.clear(); this.lastVolume = null; this.playerApp = null; this.identity = ''; }
        this.player = e._name;
        this.props = props;
        this.track = next;
        this.queue?.sync();
        if (changed) this.message('');
        const control = !!e._name && props.CanControl === true;
        this.album.text = next.album;
        this.album.visible = !!next.album;
        this.setEnabled(this.star, !!next.key, this.isFavorite() ? 'Quitar de favoritas de Aurea' : 'Añadir a favoritas de Aurea');
        this.star.child.icon_name = this.isFavorite() ? 'starred-symbolic' : 'non-starred-symbolic';
        this.star[this.isFavorite() ? 'add_style_class_name' : 'remove_style_class_name']('di-favorite-active');
        this.setEnabled(this.back, control && props.CanSeek === true && e._length > 0, 'Retroceder 15 segundos');
        this.setEnabled(this.forward, control && props.CanSeek === true && e._length > 0, 'Avanzar 15 segundos');
        this.rates = playbackRates(props);
        this.panel.state(this.rate, `${Number.isFinite(props.Rate) ? props.Rate : 1}×${this.rates.length < 2 ? ' · fija' : ''}`);
        this.setEnabled(this.rate, control && this.rates.length > 1, 'Cambiar velocidad de reproducción');
        this.setEnabled(this.stop, control, 'Detener reproducción');
        this.setEnabled(this.copy, !!next.key, 'Copiar enlace o nombre de la canción');
        const hasVolume = Number.isFinite(props.Volume) && props.Volume >= 0;
        const volumeEnabled = !!e._sink || (control && hasVolume);
        this.setEnabled(e._muteButton, volumeEnabled);
        this.setEnabled(e._volume, volumeEnabled, e._sink ? 'Volumen de salida del sistema' : 'Volumen del reproductor');
        if (!e._sink && hasVolume) {
            if (props.Volume > 0) this.lastVolume = Math.min(1, props.Volume);
            if (!e._volDrag) {
                e._syncing = true;
                e._volume.value = Math.min(1, props.Volume);
                e._syncing = false;
            }
            e._updateVolIcon(props.Volume);
            e._muteButton.accessible_name = props.Volume > 0 ? 'Silenciar reproductor' : 'Activar sonido del reproductor';
        }
        this.setEnabled(this.raise, !!e._name && (this.canRaise || this.playerApp), 'Abrir el reproductor');
        if (playerChanged) {
            this.canRaise = false;
            this.setEnabled(this.raise, false);
            if (e._name) this.request(PROPS, 'GetAll', new GLib.Variant('(s)', [ROOT]), reply => {
                const root = reply.recursiveUnpack()[0];
                this.identity = typeof root.Identity === 'string' ? root.Identity.slice(0, 120) : '';
                if (this.identity) e._playerLabel.text = this.identity;
                this.canRaise = root.CanRaise === true;
                const desktopId = root.DesktopEntry || (e._name.startsWith('org.mpris.MediaPlayer2.com.bstream.bstream_music.') ? 'com.bstream.bstream_music' : '');
                this.playerApp = desktopId ? Gio.DesktopAppInfo.new(`${desktopId.replace(/\.desktop$/, '')}.desktop`) : null;
                this.setEnabled(this.raise, this.canRaise || this.playerApp);
                this.panel.state(this.raise, root.Identity || '');
            }, {quiet: true, trackBound: false});
        }
        this.syncModes();
        this.libraryButton._label.text = `Favoritas · ${this.favorites.length}`;
        this.panel.state(this.copy, next.url ? 'Enlace' : 'Título y artista');
        if (this.panel.selected === 'audio') this.refreshOutputs();
    }

    openPlayer() {
        if (this.canRaise) this.request(ROOT, 'Raise', null, null, {trackBound: false});
        else if (this.playerApp) {
            try { this.playerApp.launch([], global.create_app_launch_context(0, -1)); }
            catch { this.message('No se pudo abrir el reproductor.'); }
        }
    }

    refreshOutputs() {
        if (!this.output) return;
        const e = this.island;
        const sinks = e._mixer?.get_sinks?.() ?? [];
        const current = e._mixer?.get_default_sink?.();
        const name = current?.get_description?.() || current?.get_name?.() || 'Sin dispositivo';
        this.output._label.text = name;
        this.panel.state(this.output, 'Cambiar');
        this.setEnabled(this.output, sinks.length > 0, `Salida de audio: ${name}`);
        if (!this.outputs.visible) return;
        this.outputs.destroy_all_children();
        for (const sink of sinks) {
            const button = this.panel.row(this.outputs, sink.get_description?.() || sink.get_name?.() || 'Salida',
                'audio-speakers-symbolic', () => {
                    e._mixer.set_default_sink(sink);
                    this.outputs.visible = false;
                    this.refreshOutputs(); e._resizeIsland();
                }, sink === current ? 'Actual' : '');
            if (sink === current) button.add_style_class_name('di-music-option-active');
        }
    }

    syncModes() {
        const e = this.island;
        const control = !!e._name && this.props.CanControl === true;
        for (const [property, row, primary] of [['Shuffle', this.shuffleRow, e._shuffleBtn.button], ['LoopStatus', this.repeatRow, e._loopBtn.button]]) {
            const supported = property in this.props && !this.unsupported.has(property);
            const pending = this.propertyWrites.has(property);
            const active = supported && (property === 'Shuffle' ? e._shuffle : e._loop !== 'None');
            const state = !supported ? 'En la app' : property === 'Shuffle' ? (e._shuffle ? 'Activado' : 'Desactivado')
                : {None: 'Desactivado', Track: 'Esta canción', Playlist: 'Toda la lista'}[e._loop] || 'Desactivado';
            if (property === 'LoopStatus') {
                for (const [value, button] of this.repeatButtons) {
                    this.setEnabled(button, control && !pending);
                    button[value === e._loop ? 'add_style_pseudo_class' : 'remove_style_pseudo_class']('checked');
                }
            }
            this.panel.state(row, pending ? 'Aplicando…' : state, active);
            this.setEnabled(row, control && !pending);
            this.setEnabled(primary, control && !pending, `${property === 'Shuffle' ? 'Aleatorio' : 'Repetir'}: ${state}`);
            primary.opacity = supported ? 255 : 170;
            primary[active ? 'add_style_class_name' : 'remove_style_class_name']('di-active');
        }
    }

    unavailable(property) {
        const label = property === 'Shuffle' ? 'el modo aleatorio' : 'la repetición';
        this.message(`Este reproductor no permite controlar ${label} desde la isla. Cámbialo en su aplicación.`);
        this.syncModes();
    }

    isFavorite() { return this.favorites.some(item => item.key === this.track.key); }

    saveFavorites(next) {
        try {
            this.file.replace_contents(new TextEncoder().encode(JSON.stringify(next)), null, false,
                Gio.FileCreateFlags.PRIVATE | Gio.FileCreateFlags.REPLACE_DESTINATION, null);
            this.favorites = next;
            this.update(this.props);
            if (this.library.visible) this.renderFavorites();
            return true;
        } catch {
            this.message('No se pudo guardar. Comprueba el espacio y los permisos del equipo.');
            return false;
        }
    }

    toggleFavorite() {
        if (!this.track.key) return;
        const exists = this.isFavorite();
        if (!exists && this.favorites.length >= 200) { this.message('Tienes 200 favoritas. Retira una antes de añadir otra.'); return; }
        const next = exists ? this.favorites.filter(item => item.key !== this.track.key) : [this.track, ...this.favorites];
        if (this.saveFavorites(next)) this.message(exists ? 'Retirada de favoritas de Aurea.' : 'Guardada en favoritas de Aurea.');
    }

    renderFavorites() {
        const e = this.island;
        this.favoriteRows.destroy_all_children();
        if (!this.favorites.length) this.favoriteRows.add_child(e._label('Marca la estrella de una canción para guardarla.', 'di-hint', {width: 330}));
        for (const track of this.favorites) {
            const row = new St.BoxLayout({style_class: 'di-music-favorite-row'});
            const label = [track.title, track.artist].filter(Boolean).join(' · ');
            const open = e._chip(label, () => {
                if (track.url) e._openUri(track.url);
                else {
                    St.Clipboard.get_default().set_text(St.ClipboardType.CLIPBOARD, label);
                    this.message('Nombre copiado. Esta aplicación no comparte el enlace de la canción.');
                }
            }, track.url ? 'media-playback-start-symbolic' : 'edit-copy-symbolic');
            open.width = 294;
            open._label.clutter_text.set_ellipsize(3);
            open.accessible_name = track.url ? `Abrir ${label}` : `Copiar ${label}`;
            row.add_child(open);
            const remove = e._iconBtn('list-remove-symbolic', () => this.saveFavorites(this.favorites.filter(item => item.key !== track.key)));
            remove.accessible_name = `Quitar ${track.title} de favoritas`;
            row.add_child(remove);
            this.favoriteRows.add_child(row);
        }
    }

    request(iface, method, params = null, callback = null, {quiet = false, trackBound = true, onError = null} = {}) {
        const e = this.island;
        const name = e._name;
        const track = this.track.key;
        const epoch = this.epoch;
        const token = `${epoch}:${name}:${iface}:${method}:${params?.print(true) ?? ''}`;
        if (!name || !e._alive || this.pending.has(token)) return;
        this.pending.add(token);
        e._bus.call(name, PATH, iface, method, params, null, Gio.DBusCallFlags.NONE, 2500, e._cancel, (bus, result) => {
            this.pending.delete(token);
            let reply;
            let error;
            try { reply = bus.call_finish(result); } catch (failure) { error = failure; }
            if (!e._alive || epoch !== this.epoch || name !== e._name || (trackBound && track !== this.track.key)) return;
            if (error) {
                onError?.(error);
                if (!quiet && !error.matches?.(Gio.IOErrorEnum, Gio.IOErrorEnum.CANCELLED))
                    this.message('El reproductor no permite esta acción en este momento.');
                return;
            }
            if (!quiet) this.message('');
            callback?.(reply);
        });
    }

    setProperty(property, variant) {
        if (this.props.CanControl !== true || this.propertyWrites.has(property)) return;
        const mode = ['Shuffle', 'LoopStatus'].includes(property);
        if (!(property in this.props) || this.unsupported.has(property)) {
            if (mode) this.unavailable(property);
            return;
        }
        if (!mode) {
            this.request(PROPS, 'Set', new GLib.Variant('(ssv)', [PLAYER, property, variant]), () => this.island._refresh());
            return;
        }
        const epoch = this.epoch;
        const expected = variant.deep_unpack();
        this.propertyWrites.set(property, expected);
        this.syncModes();
        const fail = () => {
            this.propertyWrites.delete(property);
            this.unsupported.add(property);
            this.unavailable(property);
        };
        const verify = attempt => {
            if (!this.island._alive || epoch !== this.epoch) return;
            this.request(PROPS, 'Get', new GLib.Variant('(ss)', [PLAYER, property]), reply => {
                const value = reply.recursiveUnpack()[0];
                if (value === expected) {
                    this.propertyWrites.delete(property);
                    this.props[property] = value;
                    if (property === 'Shuffle') this.island._shuffle = value;
                    else this.island._loop = value;
                    this.island._updateToggles();
                    this.syncModes();
                    this.message(property === 'Shuffle' ? `Aleatorio ${value ? 'activado' : 'desactivado'}.` : repeatLabel(value));
                    this.island._refresh();
                } else if (attempt === 0) this.island._timeout(450, () => { verify(1); return GLib.SOURCE_REMOVE; });
                else fail();
            }, {quiet: true, trackBound: false, onError: fail});
        };
        this.request(PROPS, 'Set', new GLib.Variant('(ssv)', [PLAYER, property, variant]), () => verify(0),
            {quiet: true, trackBound: false, onError: fail});
    }

    command(method) {
        if (this.props.CanControl !== true) return;
        const capability = {Previous: 'CanGoPrevious', Next: 'CanGoNext',
            PlayPause: this.island._status === 'Playing' ? 'CanPause' : 'CanPlay'}[method];
        if (capability && this.props[capability] !== true) return;
        this.request(PLAYER, method, null, () => this.island._refresh());
    }

    cycleRate() {
        if (this.rates.length < 2) return;
        const index = this.rates.indexOf(this.props.Rate);
        this.setProperty('Rate', new GLib.Variant('d', this.rates[(index + 1) % this.rates.length]));
    }
}
