import Clutter from 'gi://Clutter';
import GLib from 'gi://GLib';
import St from 'gi://St';

import {WidgetBase} from '../lib/base.js';
import {Hoja, boton, campo, elegirImagen, etiqueta, muestras} from '../lib/hoja.js';
import {dirImagenes, listarImagenes, nuevoId, uriDe} from '../lib/util.js';

export const META = {
    id: 'notas', nombre: 'Notas', icono: 'document-edit-symbolic',
    desc: 'Notas rápidas con colores, imágenes y guardado automático mientras escribes.',
    tam: {S: [170, 170], M: [380, 170], L: [380, 380]}, min: [140, 120],
    opciones: [
        {k: 'nota', t: 'texto', etq: 'ID de nota fija (vacío = la más reciente)', ph: '', def: ''},
    ],
};

const COLORES = ['#ffd60a', '#ff9f0a', '#ff6b6b', '#30d158', '#0a84ff', '#bf5af2', '#98989d'];

export class Widget extends WidgetBase {
    construir(box) {
        this.box = box;
        this._pintar();
    }

    _nota() {
        const n = this.datos.notas;
        return n.find(x => x.id === this.o.nota) ?? [...n].sort((a, b) => b.mod - a.mod)[0] ?? null;
    }

    _pintar() {
        this.box.destroy_all_children();
        const n = this._nota();
        const tarjeta = new St.BoxLayout({orientation: Clutter.Orientation.VERTICAL, x_expand: true, y_expand: true, style: `spacing: ${this.px(4)}px;`});
        let cuerpo;
        if (!n) {
            cuerpo = this.columna();
            cuerpo.add_child(this.t('Sin notas', 15, {peso: 'bold'}));
            cuerpo.add_child(this.t('Toca para crear una nota', 12, {c: 'texto2'}));
            tarjeta.style = `padding: ${this.px(4)}px 0; border-top: 5px solid ${this.pal.amarillo};`;
        } else {
            tarjeta.style = `padding: ${this.px(4)}px 0; border-top: 5px solid ${n.color};`;
            const lineas = n.texto.split('\n');
            cuerpo = this.columna();
            cuerpo.add_child(this.t(lineas[0] || 'Nota sin título', 15, {peso: 'bold'}));
            const resto = lineas.slice(1).join('\n').trim();
            if (resto) {
                const l = this.t(resto, 12, {c: 'texto2', ellipsis: true});
                l.clutter_text.line_wrap = true;
                l.clutter_text.line_wrap_mode = 2;
                l.clutter_text.ellipsize = 3;
                cuerpo.add_child(l);
            }
            if (n.imgs?.length && this.h > 170) {
                const fila = this.fila(`padding-top: ${this.px(6)}px;`);
                for (const p of n.imgs.slice(0, 4)) {
                    fila.add_child(new St.Widget({style: `width: ${this.px(54)}px; height: ${this.px(54)}px; border-radius: 8px; background-image: url("${uriDe(p)}"); background-size: cover;`}));
                }
                cuerpo.add_child(fila);
            }
        }
        tarjeta.add_child(cuerpo);
        tarjeta.add_child(new St.Widget({y_expand: true}));
        const b = this.boton(tarjeta, () => this._editor(n?.id ?? null), {expand: true});
        b.y_expand = true;
        this.box.add_child(b);
    }

    _editor(idInicial) {
        const notas = this.datos.notas;
        let actual = notas.find(x => x.id === idInicial);
        if (!actual) {
            actual = {id: nuevoId(), texto: '', color: COLORES[0], imgs: [], mod: Date.now()};
            notas.push(actual);
        }
        let timer = 0;
        const guardar = () => {
            if (timer) {
                GLib.source_remove(timer);
                timer = 0;
            }
            actual.mod = Date.now();
            this.guardarDatos();
            this.core.refrescarTipo('notas');
        };
        const h = new Hoja(this.core, {
            titulo: 'Notas', ancho: 680, alto: 600, sinScroll: true,
            alCerrar: () => {
                if (timer)
                    guardar();
                const i = notas.indexOf(actual);
                if (!actual.texto.trim() && !actual.imgs.length && i >= 0) {
                    notas.splice(i, 1);
                    this.guardarDatos();
                    this.core.refrescarTipo('notas');
                }
            },
        });
        const cont = h.cuerpo;
        const dibujar = () => {
            cont.destroy_all_children();
            const barra = new St.BoxLayout({style: 'spacing: 8px;', x_expand: true});
            const orden = [...notas].sort((a, b) => b.mod - a.mod);
            const i = orden.indexOf(actual);
            barra.add_child(boton('‹', () => {
                if (i < orden.length - 1) {
                    actual = orden[i + 1];
                    dibujar();
                }
            }));
            barra.add_child(etiqueta(`${i + 1} de ${orden.length}`, 'lintel-ayuda'));
            barra.add_child(boton('›', () => {
                if (i > 0) {
                    actual = orden[i - 1];
                    dibujar();
                }
            }));
            barra.add_child(new St.Widget({x_expand: true}));
            barra.add_child(muestras(actual.color, c => {
                actual.color = c;
                guardar();
            }, COLORES, false));
            cont.add_child(barra);
            const e = campo(actual.texto, 'Escribe tu nota…', v => {
                actual.texto = v;
                if (timer)
                    GLib.source_remove(timer);
                timer = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 450, () => {
                    timer = 0;
                    guardar();
                    return GLib.SOURCE_REMOVE;
                });
            }, {multi: true, ancho: 640, alto: 270});
            e.x_expand = true;
            cont.add_child(e);
            const imgs = new St.BoxLayout({style: 'spacing: 8px;', x_expand: true});
            for (const p of actual.imgs) {
                const b = new St.Button({style_class: 'lintel-thumb', style: `background-image: url("${uriDe(p)}"); background-size: cover; width: 70px; height: 70px;`});
                b.connect('clicked', () => {
                    actual.imgs = actual.imgs.filter(x => x !== p);
                    guardar();
                    dibujar();
                });
                imgs.add_child(b);
            }
            cont.add_child(imgs);
            if (actual.imgs.length)
                cont.add_child(etiqueta('Toca una imagen para quitarla.', 'lintel-ayuda'));
            const pie = new St.BoxLayout({style: 'spacing: 8px;', x_expand: true});
            pie.add_child(boton('＋ Imagen', () => {
                elegirImagen(this.core, listarImagenes(dirImagenes(), 1, 150).map(x => x.path), p => {
                    actual.imgs.push(p);
                    guardar();
                    dibujar();
                });
            }));
            pie.add_child(boton('Nueva nota', () => {
                guardar();
                actual = {id: nuevoId(), texto: '', color: COLORES[0], imgs: [], mod: Date.now()};
                notas.push(actual);
                dibujar();
            }));
            pie.add_child(new St.Widget({x_expand: true}));
            pie.add_child(boton('Eliminar nota', () => {
                const k = notas.indexOf(actual);
                if (k >= 0)
                    notas.splice(k, 1);
                this.guardarDatos();
                this.core.refrescarTipo('notas');
                h.cerrar();
            }, 'lintel-btn lintel-btn-danger'));
            cont.add_child(pie);
        };
        h.abrir();
        dibujar();
    }
}
void Clutter;
