import Clutter from 'gi://Clutter';
import GLib from 'gi://GLib';
import Pango from 'gi://Pango';
import St from 'gi://St';

export class WidgetBase {
    constructor(ctx) {
        this.ctx = ctx;
        this._ids = [];
        this._vivo = true;
    }

    get pal() { return this.ctx.pal; }
    get o() { return this.ctx.opts; }
    get w() { return this.ctx.w; }
    get h() { return this.ctx.h; }
    get core() { return this.ctx.core; }
    get datos() { return this.ctx.core.datos.datos; }

    px(n) { return Math.round(n * this.ctx.escala); }
    guardarDatos() { this.ctx.core.datos.guardar(); }
    guardarCfg() { this.ctx.core.guardarCfg(); }

    // Etiqueta con la paleta del widget.
    t(texto, px = 13, {peso = 'normal', c = 'texto', align = null, ellipsis = true, expand = false, extra = ''} = {}) {
        const col = this.pal[c] ?? c;
        const l = new St.Label({
            text: String(texto),
            style: `font-size: ${this.px(px)}px; font-weight: ${peso}; color: ${col}; ${extra}`,
            y_align: Clutter.ActorAlign.CENTER, x_expand: expand,
        });
        if (align)
            l.x_align = align;
        l.clutter_text.ellipsize = ellipsis ? Pango.EllipsizeMode.END : Pango.EllipsizeMode.NONE;
        return l;
    }

    // Botón plano con realce al pasar el cursor.
    boton(hijo, cb, {extra = '', expand = false} = {}) {
        const b = new St.Button({
            style_class: 'lw-btn lw-hover', child: hijo, reactive: true, can_focus: true,
            x_expand: expand, style: extra,
        });
        b.connect('clicked', cb);
        return b;
    }

    icono(nombre, px = 16, c = 'texto') {
        return new St.Icon({
            icon_name: nombre, icon_size: this.px(px), y_align: Clutter.ActorAlign.CENTER,
            style: `color: ${this.pal[c] ?? c};`,
        });
    }

    fila(estilo = '') {
        return new St.BoxLayout({x_expand: true, style: `spacing: ${this.px(8)}px; ${estilo}`});
    }

    columna(estilo = '') {
        return new St.BoxLayout({vertical: true, x_expand: true, style: `spacing: ${this.px(4)}px; ${estilo}`});
    }

    cada(ms, fn, ahora = false) {
        const id = GLib.timeout_add(GLib.PRIORITY_DEFAULT, ms, () => {
            if (!this._vivo)
                return GLib.SOURCE_REMOVE;
            fn();
            return GLib.SOURCE_CONTINUE;
        });
        this._ids.push(id);
        if (ahora)
            fn();
    }

    destruir() {
        this._vivo = false;
        for (const id of this._ids)
            GLib.source_remove(id);
        this._ids = [];
        this.alDestruir?.();
    }
}
