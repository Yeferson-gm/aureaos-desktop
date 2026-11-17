import Clutter from 'gi://Clutter';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import St from 'gi://St';

import {Slider} from 'resource:///org/gnome/shell/ui/slider.js';

import {WidgetBase} from '../lib/base.js';
import {fijarProp, imagenLocal, llamar, props, uriDe} from '../lib/util.js';

export const META = {
    id: 'musica', nombre: 'Música', icono: 'audio-x-generic-symbolic',
    desc: 'Controla cualquier reproductor compatible con MPRIS: portada, canción, artista, pausa y volumen.',
    tam: {S: [170, 170], M: [380, 170], L: [380, 380]}, min: [150, 130],
    opciones: [
        {k: 'volumen', t: 'bool', etq: 'Mostrar control de volumen', def: true},
        {k: 'progreso', t: 'bool', etq: 'Mostrar barra de progreso', def: true},
    ],
};

const IFACE = 'org.mpris.MediaPlayer2.Player';
const RUTA = '/org/mpris/MediaPlayer2';
const fmt = us => {
    const s = Math.max(0, Math.floor(us / 1e6));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

export class Widget extends WidgetBase {
    construir(box) {
        this.box = box;
        this._bus = Gio.DBus.session;
        this._subs = [];
        this._p = null;
        this._pintar();
        const refrescar = () => {
            if (this._deb)
                return;
            this._deb = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 150, () => {
                this._deb = 0;
                if (this._vivo)
                    this._buscar();
                return GLib.SOURCE_REMOVE;
            });
        };
        this._subs.push(this._bus.signal_subscribe(null, 'org.freedesktop.DBus.Properties', 'PropertiesChanged', RUTA, null, Gio.DBusSignalFlags.NONE, refrescar));
        this._subs.push(this._bus.signal_subscribe('org.freedesktop.DBus', 'org.freedesktop.DBus', 'NameOwnerChanged', '/org/freedesktop/DBus', null, Gio.DBusSignalFlags.NONE, refrescar));
        this._buscar();
        this.cada(1000, () => this._pos());
    }

    alDestruir() {
        for (const s of this._subs)
            this._bus.signal_unsubscribe(s);
        if (this._deb)
            GLib.source_remove(this._deb);
    }

    async _buscar() {
        try {
            const r = await llamar(this._bus, 'org.freedesktop.DBus', '/org/freedesktop/DBus', 'org.freedesktop.DBus', 'ListNames', null, '(as)');
            const nombres = r.recursiveUnpack()[0].filter(n => n.startsWith('org.mpris.MediaPlayer2.'));
            let mejor = null;
            for (const n of nombres) {
                try {
                    const p = await props(this._bus, n, RUTA, IFACE);
                    const c = {n, estado: p.PlaybackStatus, meta: p.Metadata ?? {}, vol: p.Volume ?? 1};
                    if (!mejor || (c.estado === 'Playing' && mejor.estado !== 'Playing'))
                        mejor = c;
                } catch (_e) {

                }
            }
            if (!this._vivo)
                return;
            const igual = JSON.stringify([mejor?.n, mejor?.estado, mejor?.meta?.['xesam:title']]) ===
                JSON.stringify([this._p?.n, this._p?.estado, this._p?.meta?.['xesam:title']]);
            this._p = mejor;
            if (mejor)
                this._pos();
            if (!igual)
                this._pintar();
        } catch (_e) {
            this._p = null;
        }
    }

    async _pos() {
        if (!this._p || !this._barra)
            return;
        try {
            const v = await llamar(this._bus, this._p.n, RUTA, 'org.freedesktop.DBus.Properties', 'Get', new GLib.Variant('(ss)', [IFACE, 'Position']), '(v)');
            const pos = Number(v.recursiveUnpack()[0]);
            const len = Number(this._p.meta['mpris:length'] ?? 0);
            if (!this._vivo || !this._barra)
                return;
            this._barra.style = `height: 4px; border-radius: 2px; background-color: ${this.pal.acento}; width: ${len ? Math.round(Math.min(1, pos / len) * this._anchoBarra) : 0}px;`;
            this._tiempo?.set_text(`${fmt(pos)} / ${len ? fmt(len) : '--:--'}`);
        } catch (_e) {

        }
    }

    _ctl(m) {
        if (this._p)
            llamar(this._bus, this._p.n, RUTA, IFACE, m).then(() => this._buscar()).catch(() => {});
    }

    _pintar() {
        this.box.destroy_all_children();
        this._barra = null;
        const p = this._p;
        if (!p) {
            const c = new St.BoxLayout({orientation: Clutter.Orientation.VERTICAL, x_expand: true, y_expand: true, y_align: Clutter.ActorAlign.CENTER, style: 'spacing: 6px;'});
            c.add_child(this.icono('audio-x-generic-symbolic', 34, 'texto2'));
            c.add_child(this.t('Nada en reproducción', 14, {peso: 'bold', align: Clutter.ActorAlign.CENTER}));
            c.add_child(this.t('Abre un reproductor compatible', 11, {c: 'texto2', align: Clutter.ActorAlign.CENTER}));
            this.box.add_child(c);
            return;
        }
        const m = p.meta;
        const titulo = m['xesam:title'] ?? 'Sin título';
        const artista = [].concat(m['xesam:artist'] ?? []).join(', ') || p.n.replace('org.mpris.MediaPlayer2.', '');
        const compacto = this.h < 200 && this.w < 250;
        const grande = this.h >= 280;
        const lado = Math.min(this.px(grande ? 220 : 96), this.w - 8);

        const portada = new St.Widget({
            width: lado, height: lado, style: `border-radius: ${Math.max(8, this.ctx.radio - 10)}px; background-color: ${this.pal.superficie};`,
            layout_manager: new Clutter.BinLayout(),
        });
        portada.add_child(new St.Icon({icon_name: 'audio-x-generic-symbolic', icon_size: Math.round(lado / 3), x_align: Clutter.ActorAlign.CENTER, y_align: Clutter.ActorAlign.CENTER, style: `color: ${this.pal.texto2};`}));
        const art = m['mpris:artUrl'];
        if (art) {
            imagenLocal(art).then(r => {
                if (this._vivo && r)
                    portada.style = `border-radius: ${Math.max(8, this.ctx.radio - 10)}px; background-image: url("${uriDe(r)}"); background-size: cover;`;
            }).catch(() => {});
        }

        const info = this.columna();
        info.y_align = Clutter.ActorAlign.CENTER;
        info.add_child(this.t(titulo, compacto ? 13 : 15, {peso: 'bold'}));
        info.add_child(this.t(artista, 12, {c: 'texto2'}));
        if (m['xesam:album'] && !compacto)
            info.add_child(this.t(m['xesam:album'], 11, {c: 'texto2'}));

        const ctl = this.fila(`padding-top: ${this.px(4)}px;`);
        ctl.x_align = grande ? Clutter.ActorAlign.CENTER : Clutter.ActorAlign.START;
        ctl.x_expand = true;
        const b = (ic, m_, tam) => this.boton(this.icono(ic, tam), () => this._ctl(m_));
        ctl.add_child(b('media-skip-backward-symbolic', 'Previous', 18));
        ctl.add_child(b(p.estado === 'Playing' ? 'media-playback-pause-symbolic' : 'media-playback-start-symbolic', 'PlayPause', 26));
        ctl.add_child(b('media-skip-forward-symbolic', 'Next', 18));

        if (grande) {
            this.box.add_child(portada);
            portada.x_align = Clutter.ActorAlign.CENTER;
            this.box.add_child(info);
            info.add_child(new St.Widget({height: 2}));
            this._progreso(this.box);
            this.box.add_child(ctl);
            this._volumen(this.box);
        } else {
            const fila = this.fila();
            fila.y_expand = true;
            fila.add_child(portada);
            info.x_expand = true;
            info.add_child(ctl);
            fila.add_child(info);
            this.box.add_child(fila);
            if (this.h >= 150 && !compacto)
                this._progreso(this.box);
        }
    }

    _progreso(box) {
        if (!this.o.progreso)
            return;
        const ancho = Math.max(80, this.w - 4);
        this._anchoBarra = ancho;
        const pista = new St.Widget({style: `height: 4px; border-radius: 2px; background-color: ${this.pal.superficie};`, x_expand: true, layout_manager: new Clutter.BinLayout()});
        this._barra = new St.Widget({x_align: Clutter.ActorAlign.START, style: 'height: 4px; width: 0px;'});
        pista.add_child(this._barra);
        box.add_child(pista);
        this._tiempo = this.t('', 10, {c: 'texto2', align: Clutter.ActorAlign.END});
        box.add_child(this._tiempo);
    }

    _volumen(box) {
        if (!this.o.volumen)
            return;
        const f = this.fila();
        f.add_child(this.icono('audio-volume-low-symbolic', 14, 'texto2'));
        const s = new Slider(Math.min(1, this._p.vol));
        s.x_expand = true;
        s.connect('notify::value', () => fijarProp(this._bus, this._p.n, RUTA, IFACE, 'Volume', 'd', s.value).catch(() => {}));
        f.add_child(s);
        f.add_child(this.icono('audio-volume-high-symbolic', 14, 'texto2'));
        box.add_child(f);
    }
}
