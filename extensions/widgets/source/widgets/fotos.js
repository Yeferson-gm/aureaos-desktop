import Clutter from 'gi://Clutter';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import St from 'gi://St';

import {WidgetBase} from '../lib/base.js';
import {Hoja, boton} from '../lib/hoja.js';
import {dirImagenes, listarImagenes, uriDe} from '../lib/util.js';

export const META = {
    id: 'fotos', nombre: 'Fotos', icono: 'image-x-generic-symbolic', padding: 0,
    desc: 'Fotos de la carpeta Imágenes, sin subcarpetas: presentación, favoritas y recuerdos.',
    tam: {S: [170, 170], M: [380, 170], L: [380, 380]}, min: [120, 110],
    opciones: [
        {k: 'modo', t: 'sel', etq: 'Qué mostrar', ops: [['aleatoria', 'Aleatorias'], ['recuerdos', 'Recuerdos'], ['favoritas', 'Favoritas']], def: 'aleatoria'},
        {k: 'intervalo', t: 'num', etq: 'Cambiar cada', min: 3, max: 120, paso: 1, sufijo: ' s', def: 10},
        {k: 'ajuste', t: 'sel', etq: 'Ajuste', ops: [['cover', 'Rellenar'], ['contain', 'Completa']], def: 'cover'},
        {k: 'etiqueta', t: 'bool', etq: 'Mostrar etiqueta y corazón', def: true},
    ],
};

export function fotosDe() {
    return listarImagenes(dirImagenes(), 0, 3000, true);
}

// Usar el archivo original; no crear copias ni miniaturas persistentes.
function urlFoto(f) {
    return uriDe(f.path);
}

export class Widget extends WidgetBase {
    construir(box) {
        this.box = box;
        // Las opciones antiguas no deben permitir acceder a otras carpetas.
        if (this.o.modo === 'album') this.o.modo = 'aleatoria';
        delete this.o.album;
        delete this.o.carpeta;
        const raiz = new St.Widget({layout_manager: new Clutter.BinLayout(), x_expand: true, y_expand: true});
        this._a = new St.Widget({x_expand: true, y_expand: true});
        this._b = new St.Widget({x_expand: true, y_expand: true, opacity: 0});
        raiz.add_child(this._a);
        raiz.add_child(this._b);
        this._etq = new St.BoxLayout({style_class: 'lw-foto-pie', x_expand: true, y_expand: true, y_align: Clutter.ActorAlign.END, visible: !!this.o.etiqueta});
        this._txt = this.t('', 12, {c: '#ffffff', peso: 'bold', expand: true});
        this._txt.style += ' text-shadow: 0 1px 3px rgba(0,0,0,0.7);';
        this._textoStyle = this._txt.style;
        this._cor = new St.Button({style_class: 'lw-foto-cor', child: this.icono('emblem-favorite-symbolic', 16, '#ffffff'), can_focus: true});
        this._cor.connect('clicked', () => this._fav());
        this._etq.add_child(this._txt);
        this._etq.add_child(this._cor);
        raiz.add_child(this._etq);
        const clic = new St.Widget({reactive: true, x_expand: true, y_expand: true});
        clic.connect('button-press-event', (_a, ev) => {
            if (ev.get_button() === Clutter.BUTTON_PRIMARY) {
                this._visor();
                return Clutter.EVENT_STOP;
            }
            return Clutter.EVENT_PROPAGATE;
        });
        raiz.insert_child_below(clic, this._etq);
        box.add_child(raiz);

        this._frente = this._a;
        this._lista = this._armar();
        this._i = Math.floor(Math.random() * Math.max(1, this._lista.length));
        this._mostrar(false);
        this.cada(Math.max(3, this.o.intervalo) * 1000, () => this._siguiente(1));
        try {
            this._monitor = Gio.File.new_for_path(dirImagenes()).monitor_directory(Gio.FileMonitorFlags.NONE, null);
            this._monitor.connect('changed', () => {
                if (!this._vivo || this._refreshId) return;
                this._refreshId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 100, () => {
                    this._refreshId = 0;
                    if (this._vivo) {
                        this._actualizarLista();
                        this._mostrar(false);
                    }
                    return GLib.SOURCE_REMOVE;
                });
            });
        } catch (_e) {
            // La presentación vuelve a consultar la carpeta, incluso vacía.
        }
    }

    _armar() {
        let l = fotosDe();
        const modo = this.o.modo;
        if (modo === 'favoritas') {
            l = l.filter(f => this.datos.fotosFav.includes(f.path));
        } else if (modo === 'recuerdos') {
            const hoy = new Date();
            l = l.filter(f => {
                const d = new Date(f.mtime * 1000);
                const dif = Math.abs((new Date(hoy.getFullYear(), d.getMonth(), d.getDate()) - hoy) / 864e5);
                return d.getFullYear() < hoy.getFullYear() && dif <= 4;
            });
            l.sort((a, b) => a.mtime - b.mtime);
            return l;
        }
        for (let i = l.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [l[i], l[j]] = [l[j], l[i]];
        }
        return l;
    }

    _estilo(f) {
        return `background-image: url("${urlFoto(f)}"); background-size: ${this.o.ajuste}; border-radius: ${this.ctx.radio}px;`;
    }

    _mostrar(anim = true) {
        this._a.remove_all_transitions();
        this._b.remove_all_transitions();
        const f = this._lista[this._i];
        if (!f) {
            this._a.style = '';
            this._b.style = '';
            this._txt.text = this.o.modo === 'recuerdos' ? 'Aún no hay recuerdos de hoy' : 'Sin fotos en esta carpeta';
            this._txt.style = `${this._textoStyle} color: ${this.pal.texto};`;
            this._etq.visible = true;
            this._cor.visible = false;
            return;
        }
        this._etq.visible = !!this.o.etiqueta;
        this._cor.visible = true;
        this._txt.style = this._textoStyle;
        const nuevo = this._frente === this._a ? this._b : this._a;
        const viejo = this._frente;
        nuevo.style = this._estilo(f);
        this._frente = nuevo;
        if (anim) {
            nuevo.opacity = 0;
            nuevo.ease({opacity: 255, duration: 700});
            viejo.ease({opacity: 0, duration: 700, delay: 200});
        } else {
            nuevo.opacity = 255;
            viejo.opacity = 0;
            viejo.style = '';
        }
        const esFav = this.datos.fotosFav.includes(f.path);
        this._cor.style = esFav ? 'background-color: rgba(255,69,58,0.9);' : '';
        if (this.o.modo === 'recuerdos') {
            const a = new Date().getFullYear() - new Date(f.mtime * 1000).getFullYear();
            this._txt.text = `Hace ${a} ${a === 1 ? 'año' : 'años'}`;
        } else {
            this._txt.text = f.album || 'Fotos';
        }
    }

    _siguiente(d) {
        const anterior = this._lista[this._i]?.path;
        this._actualizarLista();
        if (!this._lista.length) {
            this._mostrar(false);
            return;
        }
        this._i = (this._i + d + this._lista.length) % this._lista.length;
        this._mostrar(this._lista[this._i]?.path !== anterior);
    }

    _actualizarLista() {
        const actual = this._lista[this._i]?.path;
        const nuevas = this._armar();
        const paths = new Set(nuevas.map(f => f.path));
        const porRuta = new Map(nuevas.map(f => [f.path, f]));
        // Conservar el orden de la presentación para no repetir fotos en cada consulta.
        const previas = new Set(this._lista.map(f => f.path));
        this._lista = this._lista.filter(f => paths.has(f.path)).map(f => porRuta.get(f.path))
            .concat(nuevas.filter(f => !previas.has(f.path)));
        this._i = Math.max(0, this._lista.findIndex(f => f.path === actual));
        if (!paths.has(actual)) {
            for (const actor of [this._a, this._b]) {
                actor.remove_all_transitions();
                actor.style = '';
            }
        }
        if (!paths.has(this._visorPath)) this._hoja?.cerrar();
    }

    alDestruir() {
        this._monitor?.cancel();
        this._monitor = null;
        if (this._refreshId) GLib.source_remove(this._refreshId);
        this._refreshId = 0;
        this._hoja?.cerrar();
    }

    _fav(f = this._lista[this._i]) {
        if (!f)
            return;
        const fav = this.datos.fotosFav;
        const k = fav.indexOf(f.path);
        if (k >= 0)
            fav.splice(k, 1);
        else
            fav.push(f.path);
        this.guardarDatos();
        this._mostrar(false);
    }

    _visor() {
        this._actualizarLista();
        if (!this._lista.length)
            return;
        this._hoja?.cerrar();
        const h = new Hoja(this.core, {titulo: 'Fotos', ancho: 900, alto: 640, sinScroll: true,
            alCerrar: () => { this._hoja = null; }});
        this._hoja = h;
        const img = new St.Widget({x_expand: true, y_expand: true});
        const pie = new St.BoxLayout({style: 'spacing: 8px;', x_expand: true});
        const info = new St.Label({text: '', style_class: 'lintel-ayuda', x_expand: true, y_align: Clutter.ActorAlign.CENTER});
        const mostrar = () => {
            const f = this._lista[this._i];
            if (!f || h.cerrada) return;
            this._visorPath = f.path;
            img.style = `background-image: url("${urlFoto(f)}"); background-size: contain; border-radius: 12px;`;
            info.text = `${this._i + 1} de ${this._lista.length} · ${f.path.split('/').pop()}`;
        };
        pie.add_child(boton('‹ Anterior', () => {
            this._siguiente(-1);
            mostrar();
        }));
        pie.add_child(info);
        pie.add_child(boton('♥ Favorita', () => {
            this._fav();
        }));
        pie.add_child(boton('Siguiente ›', () => {
            this._siguiente(1);
            mostrar();
        }));
        h.cuerpo.vertical = true;
        h.cuerpo.add_child(img);
        h.cuerpo.add_child(pie);
        h.abrir();
        mostrar();
    }
}
