import Clutter from 'gi://Clutter';
import Pango from 'gi://Pango';
import Shell from 'gi://Shell';
import St from 'gi://St';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import {Slider} from 'resource:///org/gnome/shell/ui/slider.js';

import {clamp, uriDe} from './util.js';

const STOP = Clutter.EVENT_STOP;
const PASS = Clutter.EVENT_PROPAGATE;
const CENTER = Clutter.ActorAlign.CENTER;


export class Hoja {
    constructor(core, o = {}) {
        this.core = core;
        this.o = {titulo: '', ancho: 560, alto: 0, cerrarFuera: true, sinScroll: false, ...o};
        this.cuerpo = new St.BoxLayout({vertical: true, x_expand: true, y_expand: true, style: 'spacing: 10px;'});
        this.cerrada = false;
    }

    abrir() {
        const m = Main.layoutManager.primaryMonitor;
        const ov = this.ov = new St.Widget({
            layout_manager: new Clutter.BinLayout(), reactive: true, opacity: 0,
            x: m.x, y: m.y, width: m.width, height: m.height,
        });
        const dim = new St.Widget({style_class: 'lintel-hoja-dim', reactive: true, x_expand: true, y_expand: true});
        dim.connect('button-press-event', () => {
            if (this.o.cerrarFuera)
                this.cerrar();
            return STOP;
        });
        ov.add_child(dim);

        const caja = this.caja = new St.BoxLayout({
            style_class: 'lintel-hoja', vertical: true, reactive: true,
            width: Math.min(this.o.ancho, m.width - 60), x_expand: true, y_expand: true,
            x_align: CENTER, y_align: CENTER,
        });
        if (this.o.alto)
            caja.height = Math.min(this.o.alto, m.height - 90);

        const cab = new St.BoxLayout({style_class: 'lintel-hoja-cab'});
        this.titulo = new St.Label({
            text: this.o.titulo, x_expand: true, y_align: CENTER, style_class: 'lintel-hoja-titulo',
        });
        const x = new St.Button({
            style_class: 'lintel-hoja-x', can_focus: true,
            child: new St.Icon({icon_name: 'window-close-symbolic', icon_size: 14}),
        });
        x.connect('clicked', () => this.cerrar());
        cab.add_child(this.titulo);
        cab.add_child(x);
        caja.add_child(cab);

        if (this.o.sinScroll) {
            caja.add_child(this.cuerpo);
        } else {
            const sc = new St.ScrollView({
                x_expand: true, y_expand: true, hscrollbar_policy: St.PolicyType.NEVER,
                vscrollbar_policy: St.PolicyType.AUTOMATIC, overlay_scrollbars: true,
                style: this.o.alto ? '' : `max-height: ${Math.max(200, m.height - 220)}px;`,
            });
            sc.add_child(this.cuerpo);
            caja.add_child(sc);
        }
        ov.add_child(caja);

        ov.connect('key-press-event', (_a, ev) => {
            if (ev.get_key_symbol() === Clutter.KEY_Escape) {
                this.cerrar();
                return STOP;
            }
            return PASS;
        });
        Main.uiGroup.add_child(ov);
        this.grab = Main.pushModal(ov, {actionMode: Shell.ActionMode.POPUP});
        ov.grab_key_focus();
        const animate = this.core.cfg.global.animaciones && St.Settings.get().enable_animations;
        ov.ease({opacity: 255, duration: animate ? 150 : 0, mode: Clutter.AnimationMode.EASE_OUT_QUAD});
        caja.set_pivot_point(0.5, 0.5);
        caja.set({scale_x: 0.96, scale_y: 0.96});
        caja.ease({scale_x: 1, scale_y: 1, duration: animate ? 200 : 0, mode: Clutter.AnimationMode.EASE_OUT_CUBIC});
        this.core.hojas.push(this);
        return this;
    }

    cerrar() {
        if (this.cerrada)
            return;
        this.cerrada = true;
        const i = this.core.hojas.indexOf(this);
        if (i >= 0)
            this.core.hojas.splice(i, 1);
        const focus = global.stage.get_key_focus();
        if (focus && this.ov.contains(focus)) global.stage.set_key_focus(null);
        if (this.grab) {
            Main.popModal(this.grab);
            this.grab = null;
        }
        this.o.alCerrar?.();
        const ov = this.ov;
        ov.ease({opacity: 0, duration: this.core.cfg.global.animaciones && St.Settings.get().enable_animations ? 110 : 0, mode: Clutter.AnimationMode.EASE_OUT_QUAD, onComplete: () => ov.destroy()});
    }
}


export function boton(texto, cb, clase = 'lintel-btn') {
    const b = new St.Button({label: texto, style_class: clase, can_focus: true, reactive: true});
    b.connect('clicked', cb);
    return b;
}

export function etiqueta(texto, clase = 'lintel-lbl', extra = {}) {
    const l = new St.Label({text: texto, style_class: clase, y_align: CENTER, ...extra});
    l.clutter_text.ellipsize = Pango.EllipsizeMode.END;
    return l;
}

export function seccion(texto) {
    return new St.Label({text: texto, style_class: 'lintel-sec2'});
}

export function fila(etq, control, ayuda = '') {
    const f = new St.BoxLayout({style_class: 'lintel-fila', x_expand: true});
    const izq = new St.BoxLayout({vertical: true, x_expand: true, y_align: CENTER});
    izq.add_child(etiqueta(etq));
    if (ayuda)
        izq.add_child(etiqueta(ayuda, 'lintel-ayuda'));
    f.add_child(izq);
    control.y_align = CENTER;
    f.add_child(control);
    return f;
}

export function segmentado(ops, valor, cb) {
    const ancho = ops.length > 4;
    const caja = ancho
        ? new St.Widget({layout_manager: new Clutter.FlowLayout({column_spacing: 4, row_spacing: 4}), style: 'max-width: 330px;'})
        : new St.BoxLayout({style_class: 'lintel-seg2'});
    const bs = [];
    for (const [v, t] of ops) {
        const b = new St.Button({
            label: t, style_class: ancho ? 'lintel-chip' : 'lintel-seg2-b', can_focus: true, checked: v === valor,
        });
        b.connect('clicked', () => {
            bs.forEach(x => (x.checked = false));
            b.checked = true;
            cb(v);
        });
        bs.push(b);
        caja.add_child(b);
    }
    return caja;
}

export function interruptor(valor, cb) {
    const knob = new St.Widget({style_class: 'lintel-knob', x_expand: true, y_align: CENTER,
        x_align: valor ? Clutter.ActorAlign.END : Clutter.ActorAlign.START});
    const b = new St.Button({style_class: 'lintel-sw', child: knob, checked: !!valor, can_focus: true});
    b.connect('clicked', () => {
        const v = !b.checked;
        b.checked = v;
        knob.x_align = v ? Clutter.ActorAlign.END : Clutter.ActorAlign.START;
        cb(v);
    });
    return b;
}

export function deslizador(min, max, valor, cb, {paso = 1, sufijo = '', ancho = 190} = {}) {
    const caja = new St.BoxLayout({style: 'spacing: 10px;'});
    const lb = etiqueta(`${Math.round(valor)}${sufijo}`, 'lintel-valor');
    const s = new Slider(clamp((valor - min) / (max - min), 0, 1));
    s.width = ancho;
    s.y_align = CENTER;
    s.connect('notify::value', () => {
        const v = Math.round((min + s.value * (max - min)) / paso) * paso;
        lb.text = `${v}${sufijo}`;
        cb(v);
    });
    caja.add_child(s);
    caja.add_child(lb);
    return caja;
}

export const PALETA = ['#0a84ff', '#30d158', '#ff9f0a', '#ff453a', '#bf5af2', '#ff375f', '#64d2ff', '#ffd60a', '#8e8e93', '#1c1c1e', '#ffffff'];

export function muestras(valor, cb, colores = PALETA, conAuto = true) {
    const caja = new St.Widget({layout_manager: new Clutter.FlowLayout({column_spacing: 6, row_spacing: 6}), style: 'max-width: 250px;'});
    const bs = [];
    const lista = conAuto ? ['', ...colores] : colores;
    for (const c of lista) {
        const b = new St.Button({
            style_class: 'lintel-muestra', can_focus: true, checked: c === (valor || ''),
            style: c ? `background-color: ${c};` : 'background-color: transparent;',
            child: c ? null : new St.Label({text: 'A', style: 'font-size: 10px; color: #fff;', x_align: CENTER, y_align: CENTER}),
        });
        b.connect('clicked', () => {
            bs.forEach(x => (x.checked = false));
            b.checked = true;
            cb(c);
        });
        bs.push(b);
        caja.add_child(b);
    }
    return caja;
}

export function campo(valor, hint, cb, {multi = false, ancho = 230, alto = 0, num = false} = {}) {
    const e = new St.Entry({
        text: String(valor ?? ''), hint_text: hint, style_class: 'lintel-input', can_focus: true,
        width: ancho, x_expand: false,
    });
    e.clutter_text.editable = false;
    e.clutter_text.connect('key-focus-in', text => { text.editable = true; });
    e.clutter_text.connect('key-focus-out', text => { text.editable = false; });
    if (multi) {
        e.clutter_text.single_line_mode = false;
        e.clutter_text.line_wrap = true;
        e.clutter_text.activatable = false;
        if (alto)
            e.style = `height: ${alto}px;`;
    }
    e.clutter_text.connect('text-changed', () => cb(num ? Number(e.get_text()) : e.get_text()));
    return e;
}


export function pedir(core, {titulo, texto = '', campos = [], ok = 'Guardar', cb, acciones = [], ancho = 440}) {
    const h = new Hoja(core, {titulo, ancho});
    const vals = {};
    if (texto)
        h.cuerpo.add_child(etiqueta(texto, 'lintel-ayuda', {x_expand: true}));
    for (const c of campos) {
        vals[c.k] = c.valor ?? (c.tipo === 'sel' ? c.ops[0][0] : '');
        let ctl;
        if (c.tipo === 'sel') {
            ctl = segmentado(c.ops, vals[c.k], v => (vals[c.k] = v));
        } else if (c.tipo === 'colores') {
            ctl = muestras(vals[c.k], v => (vals[c.k] = v), c.colores, false);
        } else {
            ctl = campo(vals[c.k], c.ph ?? '', v => (vals[c.k] = v),
                {multi: c.tipo === 'multi', ancho: 270, alto: c.tipo === 'multi' ? 110 : 0});
        }
        h.cuerpo.add_child(fila(c.etq, ctl));
    }
    const pie = new St.BoxLayout({style: 'spacing: 8px; padding-top: 8px;', x_expand: true});
    for (const a of acciones) {
        pie.add_child(boton(a.t, () => {
            h.cerrar();
            a.cb(vals);
        }, `lintel-btn${a.peligro ? ' lintel-btn-danger' : ''}`));
    }
    pie.add_child(new St.Widget({x_expand: true}));
    pie.add_child(boton('Cancelar', () => h.cerrar()));
    pie.add_child(boton(ok, () => {
        h.cerrar();
        cb?.(vals);
    }, 'lintel-btn lintel-btn-primary'));
    h.cuerpo.add_child(pie);
    return h.abrir();
}


export function elegirImagen(core, rutas, alElegir, titulo = 'Elegir imagen') {
    const h = new Hoja(core, {titulo, ancho: 640, alto: 460});
    const cuad = new St.Widget({
        layout_manager: new Clutter.FlowLayout({column_spacing: 8, row_spacing: 8}), x_expand: true,
    });
    if (!rutas.length)
        h.cuerpo.add_child(etiqueta('No se encontraron imágenes en la carpeta de Imágenes.', 'lintel-ayuda'));
    for (const p of rutas.slice(0, 120)) {
        const b = new St.Button({
            style_class: 'lintel-thumb', can_focus: true,
            style: `background-image: url("${uriDe(p)}"); background-size: cover;`,
        });
        b.connect('clicked', () => {
            h.cerrar();
            alElegir(p);
        });
        cuad.add_child(b);
    }
    h.cuerpo.add_child(cuad);
    return h.abrir();
}

