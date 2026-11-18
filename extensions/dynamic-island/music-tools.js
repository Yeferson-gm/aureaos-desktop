import Clutter from 'gi://Clutter';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import St from 'gi://St';
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
        this.moreButton = e._chip('Más', () => this.togglePanel('more'), 'view-more-symbolic');
        navigation.add_child(this.libraryButton);
        navigation.add_child(new St.Widget({x_expand: true}));
        navigation.add_child(this.moreButton);
        page.add_child(navigation);
        this.more = new St.BoxLayout({orientation: Clutter.Orientation.VERTICAL, style_class: 'di-music-tools', visible: false});
        const jumps = new St.BoxLayout({style_class: 'di-head'});
        this.back = e._chip('−15 s', () => e._seekTo(e._position - 15), 'media-seek-backward-symbolic');
        this.forward = e._chip('+15 s', () => e._seekTo(e._position + 15), 'media-seek-forward-symbolic');
        this.rate = e._chip('1×', () => this.cycleRate(), 'preferences-system-time-symbolic');
        for (const button of [this.back, this.forward, this.rate]) jumps.add_child(button);
        this.more.add_child(jumps);
        const actions = new St.BoxLayout({style_class: 'di-head'});
        this.stop = e._chip('Detener', () => this.command('Stop'), 'media-playback-stop-symbolic');
        this.raise = e._chip('Abrir app', () => this.request(ROOT, 'Raise'), 'application-x-executable-symbolic');
        this.copy = e._chip('Copiar', () => {
            St.Clipboard.get_default().set_text(St.ClipboardType.CLIPBOARD,
                this.track.url || [this.track.title, this.track.artist].filter(Boolean).join(' — '));
            this.message('Canción copiada.');
        }, 'edit-copy-symbolic');
        for (const button of [this.stop, this.raise, this.copy]) actions.add_child(button);
        this.more.add_child(actions);
        page.add_child(this.more);
        this.library = new St.BoxLayout({orientation: Clutter.Orientation.VERTICAL, style_class: 'di-music-tools', visible: false});
        this.library.add_child(e._label('Favoritas de Aurea · guardadas en este equipo', 'di-hint', {width: 350}));
        this.favoriteRows = new St.BoxLayout({orientation: Clutter.Orientation.VERTICAL, style_class: 'di-list'});
        const scroll = e._scroll(146);
        scroll.width = 350;
        scroll.add_child(this.favoriteRows);
        this.library.add_child(scroll);
        page.add_child(this.library);
        this.status = e._label('', 'di-music-feedback', {width: 380, visible: false});
        this.status.clutter_text.set_line_wrap(true);
        page.add_child(this.status);
        this.update({});
    }

    setEnabled(actor, enabled, label) {
        actor.reactive = actor.can_focus = !!enabled;
        actor.opacity = enabled ? 255 : 85;
        if (label) actor.accessible_name = label;
    }

    message(text) {
        this.status.text = text;
        this.status.visible = !!text;
        this.island._resizeIsland();
    }

    togglePanel(panel) {
        const target = panel === 'favorites' ? this.library : this.more;
        const show = !target.visible;
        this.library.visible = this.more.visible = false;
        target.visible = show;
        if (panel === 'favorites' && show) this.renderFavorites();
        for (const [button, box] of [[this.libraryButton, this.library], [this.moreButton, this.more]])
            button[box.visible ? 'add_style_pseudo_class' : 'remove_style_pseudo_class']('checked');
        this.island._resizeIsland();
    }

    update(props) {
        const e = this.island;
        const next = trackInfo(props.Metadata);
        const playerChanged = this.player !== e._name;
        const changed = next.key !== this.track.key || playerChanged;
        if (playerChanged) this.epoch++;
        this.player = e._name;
        this.props = props;
        this.track = next;
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
        this.rate._label.text = `${Number.isFinite(props.Rate) ? props.Rate : 1}×`;
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
        this.setEnabled(this.raise, !!e._name && this.canRaise, 'Abrir el reproductor');
        if (playerChanged) {
            this.canRaise = false;
            this.setEnabled(this.raise, false);
            if (e._name) this.request(PROPS, 'GetAll', new GLib.Variant('(s)', [ROOT]), reply => {
                this.canRaise = reply.recursiveUnpack()[0].CanRaise === true;
                this.setEnabled(this.raise, this.canRaise);
            }, {quiet: true, trackBound: false});
        }
        e._shuffleBtn.button.accessible_name = `Aleatorio: ${e._shuffle ? 'activado' : 'desactivado'}`;
        e._loopBtn.button.accessible_name = repeatLabel(e._loop);
        this.libraryButton._label.text = `Favoritas · ${this.favorites.length}`;
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

    request(iface, method, params = null, callback = null, {quiet = false, trackBound = true} = {}) {
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
                if (!quiet && !error.matches?.(Gio.IOErrorEnum, Gio.IOErrorEnum.CANCELLED))
                    this.message('El reproductor no permite esta acción en este momento.');
                return;
            }
            if (!quiet) this.message('');
            callback?.(reply);
        });
    }

    setProperty(property, variant) {
        if (this.props.CanControl !== true || !(property in this.props)) return;
        this.request(PROPS, 'Set', new GLib.Variant('(ssv)', [PLAYER, property, variant]), () => this.island._refresh());
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
