import Clutter from 'gi://Clutter';
import Gio from 'gi://Gio';
import St from 'gi://St';

import {WidgetBase} from '../lib/base.js';
import {Hoja, boton, etiqueta, pedir} from '../lib/hoja.js';
import {abrirUri, haceTiempo, http, imagenLocal, parsearFeed, uriDe} from '../lib/util.js';

export const META = {
    id: 'podcasts', nombre: 'Podcasts', icono: 'audio-input-microphone-symbolic',
    desc: 'Episodios de tus feeds RSS, marca de novedades y reproducción con mpv (o tu reproductor).',
    tam: {S: [170, 170], M: [380, 170], L: [380, 380]}, min: [150, 130],
    opciones: [
        {k: 'reproductor', t: 'texto', etq: 'Reproductor', ph: 'mpv', def: 'mpv', ayuda: 'Se ejecuta como: reproductor --no-video URL. Si falla, se abre con el navegador.'},
        {k: 'max', t: 'num', etq: 'Episodios por podcast', min: 1, max: 10, paso: 1, def: 3},
    ],
};

const SUGERIDOS = [
    {nombre: 'The Daily', url: 'https://feeds.simplecast.com/54nAGcIl'},
    {nombre: 'Radio Ambulante', url: 'https://feeds.npr.org/510315/podcast.xml'},
];

let proceso = null;

export class Widget extends WidgetBase {
    construir(box) {
        this.box = box;
        this._eps = null;
        this._pintar();
        this.cada(20 * 60 * 1000, () => this._cargar(), true);
    }

    async _cargar() {
        const feeds = this.datos.feedsPodcast;
        const res = await Promise.allSettled(feeds.map(f => http(f.url, {ttl: 15 * 60 * 1000})));
        const eps = [];
        res.forEach((r, i) => {
            if (r.status !== 'fulfilled')
                return;
            try {
                const feed = parsearFeed(r.value);
                for (const e of feed.items.slice(0, this.o.max)) {
                    if (e.audio)
                        eps.push({...e, show: feeds[i].nombre, feed: feeds[i].url, img: feed.imagen});
                }
            } catch (_e) {

            }
        });
        eps.sort((a, b) => (b.fecha?.getTime() ?? 0) - (a.fecha?.getTime() ?? 0));
        if (!this._vivo)
            return;
        this._eps = eps;
        this._pintar();
    }

    _nuevo(e) {
        const visto = this.datos.podVistos[e.feed];
        return e.fecha && (!visto || e.fecha.getTime() > visto);
    }

    _reproducir(e) {
        this.datos.podVistos[e.feed] = Math.max(this.datos.podVistos[e.feed] ?? 0, ...this._eps.filter(x => x.feed === e.feed).map(x => x.fecha?.getTime() ?? 0));
        this.guardarDatos();
        this._parar();
        try {
            const cmd = (this.o.reproductor || 'mpv').trim().split(/\s+/);
            proceso = Gio.Subprocess.new([...cmd, '--no-video', e.audio], Gio.SubprocessFlags.NONE);
            this._sonando = e.audio;
        } catch (_e) {
            abrirUri(e.audio);
        }
        this._pintar();
    }

    _parar() {
        try {
            proceso?.force_exit();
        } catch (_e) {

        }
        proceso = null;
        this._sonando = null;
    }

    _gestionar() {
        const h = new Hoja(this.core, {titulo: 'Podcasts', ancho: 520});
        const pintar = () => {
            h.cuerpo.destroy_all_children();
            if (!this.datos.feedsPodcast.length)
                h.cuerpo.add_child(etiqueta('Aún no tienes podcasts. Añade un feed RSS o usa los sugeridos.', 'lintel-ayuda'));
            for (const f of this.datos.feedsPodcast) {
                const fila = new St.BoxLayout({style: 'spacing: 8px;', x_expand: true});
                const c = new St.BoxLayout({orientation: Clutter.Orientation.VERTICAL, x_expand: true});
                c.add_child(etiqueta(f.nombre, 'lintel-card-t'));
                c.add_child(etiqueta(f.url, 'lintel-ayuda'));
                fila.add_child(c);
                fila.add_child(boton('Quitar', () => {
                    this.datos.feedsPodcast = this.datos.feedsPodcast.filter(x => x !== f);
                    this.guardarDatos();
                    pintar();
                    this.core.refrescarTipo('podcasts');
                }, 'lintel-btn lintel-btn-danger'));
                h.cuerpo.add_child(fila);
            }
            const pie = new St.BoxLayout({style: 'spacing: 8px;'});
            pie.add_child(boton('＋ Añadir feed', () => pedir(this.core, {
                titulo: 'Nuevo podcast', ok: 'Añadir',
                campos: [{k: 'nombre', etq: 'Nombre', ph: 'Mi podcast'}, {k: 'url', etq: 'URL del feed RSS', ph: 'https://…'}],
                cb: v => {
                    if (!v.url.trim().startsWith('http'))
                        return;
                    this.datos.feedsPodcast.push({nombre: v.nombre.trim() || 'Podcast', url: v.url.trim()});
                    this.guardarDatos();
                    this.core.refrescarTipo('podcasts');
                },
            }), 'lintel-btn lintel-btn-primary'));
            pie.add_child(boton('Añadir sugeridos', () => {
                for (const s of SUGERIDOS) {
                    if (!this.datos.feedsPodcast.some(f => f.url === s.url))
                        this.datos.feedsPodcast.push({...s});
                }
                this.guardarDatos();
                pintar();
                this.core.refrescarTipo('podcasts');
            }));
            h.cuerpo.add_child(pie);
        };
        h.abrir();
        pintar();
    }

    _pintar() {
        this.box.destroy_all_children();
        const cab = this.fila();
        cab.add_child(this.t('Podcasts', 15, {peso: 'bold', expand: true}));
        if (this._sonando)
            cab.add_child(this.boton(this.icono('media-playback-stop-symbolic', 16, 'rojo'), () => {
                this._parar();
                this._pintar();
            }));
        cab.add_child(this.boton(this.icono('emblem-system-symbolic', 15, 'texto2'), () => this._gestionar()));
        this.box.add_child(cab);

        if (!this.datos.feedsPodcast.length) {
            this.box.add_child(this.t('Añade tu primer podcast', 12, {c: 'texto2', extra: 'padding-top: 8px;'}));
            this.box.add_child(this.boton(this.t('Gestionar podcasts', 12, {c: 'acento', peso: 'bold'}), () => this._gestionar()));
            return;
        }
        if (!this._eps) {
            this.box.add_child(this.t('Cargando episodios…', 12, {c: 'texto2'}));
            return;
        }
        const n = Math.max(1, Math.floor((this.h - this.px(40)) / this.px(44)));
        for (const e of this._eps.slice(0, n)) {
            const f = this.fila(`padding: ${this.px(4)}px 0;`);
            const sonando = this._sonando === e.audio;
            const play = new St.Widget({style: `width: ${this.px(34)}px; height: ${this.px(34)}px; border-radius: ${this.px(8)}px; background-color: ${this.pal.superficie};`, layout_manager: new Clutter.BinLayout()});
            if (e.img) {
                imagenLocal(e.img).then(r => {
                    if (this._vivo)
                        play.style = `width: ${this.px(34)}px; height: ${this.px(34)}px; border-radius: ${this.px(8)}px; background-image: url("${uriDe(r)}"); background-size: cover;`;
                }).catch(() => {});
            }
            f.add_child(play);
            const c = this.columna();
            c.y_align = Clutter.ActorAlign.CENTER;
            c.add_child(this.t(e.titulo, 12, {peso: this._nuevo(e) ? 'bold' : 'normal'}));
            c.add_child(this.t(`${e.show} · ${haceTiempo(e.fecha)}${this._nuevo(e) ? ' · Nuevo' : ''}`, 10, {c: this._nuevo(e) ? 'acento' : 'texto2'}));
            f.add_child(c);
            f.add_child(this.icono(sonando ? 'media-playback-stop-symbolic' : 'media-playback-start-symbolic', 16, 'acento'));
            this.box.add_child(this.boton(f, () => sonando ? (this._parar(), this._pintar()) : this._reproducir(e), {expand: true}));
        }
    }
}
