import Clutter from 'gi://Clutter';
import St from 'gi://St';

import {WidgetBase} from '../lib/base.js';
import {Hoja, boton, etiqueta} from '../lib/hoja.js';
import {abrirUri, haceTiempo, http, imagenLocal, parsearFeed, uriDe} from '../lib/util.js';

export const META = {
    id: 'noticias', nombre: 'Noticias', icono: 'news-subscribe-symbolic',
    desc: 'Titulares de Perú y el mundo, tecnología, deportes y tus propios canales RSS.',
    tam: {S: [170, 170], M: [380, 170], L: [380, 380]}, min: [160, 130],
    opciones: [
        {k: 'categoria', t: 'sel', etq: 'Categoría', ops: [['peru', 'Perú'], ['mundo', 'Mundo'], ['tecnologia', 'Tecnología'], ['deportes', 'Deportes'], ['personal', 'Mis canales']], def: 'peru'},
        {k: 'personal', t: 'area', etq: 'Mis canales (Nombre|URL por línea)', ph: 'Mi blog|https://sitio.com/feed', def: ''},
        {k: 'imagenes', t: 'bool', etq: 'Mostrar imágenes', def: true},
    ],
};

const FEEDS = {
    peru: [['RPP', 'https://rpp.pe/feed'], ['Infobae Perú', 'https://www.infobae.com/arc/outboundfeeds/rss/category/peru/'], ['La República', 'https://larepublica.pe/rss/']],
    mundo: [['BBC Mundo', 'https://feeds.bbci.co.uk/mundo/rss.xml'], ['El País', 'https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/portada']],
    tecnologia: [['Xataka', 'https://feeds.weblogssl.com/xataka2'], ['Genbeta', 'https://feeds.weblogssl.com/genbeta']],
    deportes: [['ESPN Deportes', 'https://espndeportes.espn.com/espn/rss/news'], ['Marca', 'https://e00-marca.uecdn.es/rss/portada.xml']],
};

const NOMBRES = {peru: 'Perú', mundo: 'Mundo', tecnologia: 'Tecnología', deportes: 'Deportes', personal: 'Mis canales'};

export class Widget extends WidgetBase {
    construir(box) {
        this.box = box;
        this._items = null;
        this._pintar();
        this.cada(20 * 60 * 1000, () => this._cargar(), true);
    }

    _feeds() {
        if (this.o.categoria === 'personal') {
            return this.o.personal.split('\n').map(l => l.split('|').map(s => s.trim())).filter(p => p[1]?.startsWith('http'));
        }
        return FEEDS[this.o.categoria] ?? [];
    }

    async _cargar() {
        const feeds = this._feeds();
        const res = await Promise.allSettled(feeds.map(f => http(f[1], {ttl: 10 * 60 * 1000})));
        const items = [];
        res.forEach((r, i) => {
            if (r.status !== 'fulfilled')
                return;
            try {
                for (const e of parsearFeed(r.value).items.slice(0, 8))
                    items.push({...e, fuente: feeds[i][0]});
            } catch (_e) {
                // feed ilegible
            }
        });
        items.sort((a, b) => (b.fecha?.getTime() ?? 0) - (a.fecha?.getTime() ?? 0));
        if (!this._vivo)
            return;
        this._items = items;
        this._pintar();
    }

    _leer(e) {
        const h = new Hoja(this.core, {titulo: e.fuente, ancho: 560});
        const t = etiqueta(e.titulo, 'lintel-h1', {x_expand: true});
        t.clutter_text.line_wrap = true;
        t.clutter_text.ellipsize = 0;
        h.cuerpo.add_child(t);
        h.cuerpo.add_child(etiqueta(haceTiempo(e.fecha), 'lintel-ayuda'));
        const r = etiqueta(e.resumen || 'Sin resumen disponible.', 'lintel-lbl', {x_expand: true});
        r.clutter_text.line_wrap = true;
        r.clutter_text.ellipsize = 0;
        h.cuerpo.add_child(r);
        h.cuerpo.add_child(boton('Leer en el navegador', () => {
            h.cerrar();
            abrirUri(e.enlace);
        }, 'lintel-btn lintel-btn-primary'));
        h.abrir();
    }

    _pintar() {
        this.box.destroy_all_children();
        const cab = this.fila();
        cab.add_child(this.t(`Noticias · ${NOMBRES[this.o.categoria]}`, 13, {peso: 'bold', expand: true}));
        cab.add_child(this.boton(this.icono('view-refresh-symbolic', 14, 'texto2'), () => {
            this._items = null;
            this._pintar();
            this._cargar();
        }));
        this.box.add_child(cab);
        if (!this._items) {
            this.box.add_child(this.t('Cargando titulares…', 12, {c: 'texto2'}));
            return;
        }
        if (!this._items.length) {
            this.box.add_child(this.t(this._feeds().length ? 'Sin conexión o canales no disponibles.' : 'Añade canales en los ajustes del widget.', 11, {c: 'texto2'}));
            return;
        }
        const conImg = this.o.imagenes && this.w >= 320;
        const alto = this.px(conImg ? 58 : 44);
        const n = Math.max(1, Math.floor((this.h - this.px(34)) / alto));
        for (const e of this._items.slice(0, n)) {
            const f = this.fila(`padding: ${this.px(4)}px 0;`);
            const c = this.columna();
            c.y_align = Clutter.ActorAlign.CENTER;
            const tt = this.t(e.titulo.length > 95 ? `${e.titulo.slice(0, 92)}…` : e.titulo, 12, {peso: 'bold'});
            tt.clutter_text.line_wrap = true;
            tt.clutter_text.line_wrap_mode = 2;
            tt.clutter_text.ellipsize = 3;
            c.add_child(tt);
            c.add_child(this.t(`${e.fuente} · ${haceTiempo(e.fecha)}`, 10, {c: 'texto2'}));
            f.add_child(c);
            if (conImg && e.imagen) {
                const th = new St.Widget({style: `width: ${this.px(64)}px; height: ${this.px(46)}px; border-radius: 8px; background-color: ${this.pal.superficie};`});
                imagenLocal(e.imagen).then(r => {
                    if (this._vivo)
                        th.style = `width: ${this.px(64)}px; height: ${this.px(46)}px; border-radius: 8px; background-image: url("${uriDe(r)}"); background-size: cover;`;
                }).catch(() => {});
                f.add_child(th);
            }
            this.box.add_child(this.boton(f, () => this._leer(e), {expand: true}));
        }
    }
}
