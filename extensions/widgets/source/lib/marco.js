import Clutter from 'gi://Clutter';
import Shell from 'gi://Shell';
import St from 'gi://St';

import {paleta, cssMarco} from './estilo.js';
import {clamp} from './util.js';

const STOP = Clutter.EVENT_STOP;
const PASS = Clutter.EVENT_PROPAGATE;
const START = Clutter.ActorAlign.START;
const END = Clutter.ActorAlign.END;
const CENTER = Clutter.ActorAlign.CENTER;


export class Marco {
    constructor(core, cfg, modulo) {
        this.core = core;
        this.cfg = cfg;
        this.mod = modulo;
        this.META = modulo.META;
        this._inst = null;
        this._editando = false;
        this._drag = null;
        for (const op of this.META.opciones ?? []) {
            if (!(op.k in cfg.opts))
                cfg.opts[op.k] = op.def;
        }
        this._crear();
    }

    _crear() {
        const {cfg} = this;
        const a = this.actor = new St.Widget({
            layout_manager: new Clutter.BinLayout(), reactive: true, style_class: 'lw-marco',
            x: cfg.x, y: cfg.y, width: cfg.w, height: cfg.h,
        });


        a.connect('destroy', () => this._liberar());
        this._blur = new St.Widget({x_expand: true, y_expand: true, style: 'background-color: rgba(0,0,0,0.004);'});
        this._cont = new St.BoxLayout({vertical: true, x_expand: true, y_expand: true, clip_to_allocation: true});
        this._capa = this._crearCapa();
        a.add_child(this._blur);
        a.add_child(this._cont);
        a.add_child(this._capa);
        a.connect('button-press-event', (_a, ev) => {
            if (ev.get_button() === Clutter.BUTTON_SECONDARY && !this.core.editando) {
                const [x, y] = ev.get_coords();
                this.core.menuWidget(this, x, y);
                return STOP;
            }
            return PASS;
        });
        a.set_pivot_point(0.5, 0.5);
        this.refrescarEstilo();
    }


    refrescarEstilo() {
        const est = this.cfg.estilo;
        this.pal = paleta(est, this.core.cfg.global);
        this.actor.style = cssMarco(est, this.pal);
        this.actor.remove_style_class_name(this.pal.oscuro ? 'lw-light' : 'lw-dark');
        this.actor.add_style_class_name(this.pal.oscuro ? 'lw-dark' : 'lw-light');
        const inset = Math.round(est.radio * 0.3);
        this._blur.style = `margin: ${inset}px; background-color: rgba(0,0,0,0.004);`;
        this._aplicarBlur();
        this._actualizarBotonEstilo();
        this.reconstruir();
    }

    _aplicarBlur() {
        this._blur.clear_effects();
        const est = this.cfg.estilo;
        if (est.estilo !== 'glass' || est.desenfoque <= 0)
            return;
        try {
            const fx = new Shell.BlurEffect({mode: Shell.BlurMode.BACKGROUND});
            const sigma = 4 + est.desenfoque * 0.44;
            if ('sigma' in fx)
                fx.sigma = sigma;
            else if ('radius' in fx)
                fx.radius = sigma * 2;
            fx.brightness = this.pal.oscuro ? 0.8 : 1.0;
            this._blur.add_effect(fx);
        } catch (e) {
            console.error(`[Widgets] blur: ${e.message}`);
        }
    }


    reconstruir() {
        this._inst?.destruir();
        this._inst = null;
        this._cont.destroy_all_children();
        const pad = this.META.padding ?? 14;
        this._cont.style = `padding: ${pad}px;`;
        const {cfg} = this;
        this.ctx = {
            core: this.core, id: cfg.id, cfg, opts: cfg.opts, pal: this.pal, meta: this.META,
            escala: cfg.estilo.escala / 100, w: cfg.w - 2 * pad, h: cfg.h - 2 * pad, radio: cfg.estilo.radio,
        };
        try {
            this._inst = new this.mod.Widget(this.ctx);
            this._inst.construir(this._cont);
        } catch (e) {
            console.error(`[Widgets] ${this.META.id}: ${e.stack ?? e.message}`);
            this._cont.add_child(new St.Label({
                text: `Error en «${this.META.nombre}»: ${e.message}`,
                style: `color: ${this.pal.rojo}; font-size: 12px;`,
            }));
        }
    }

    fijarRect(x, y, w, h, reconstruir = true) {
        Object.assign(this.cfg, {x, y, w, h});
        this.actor.set_position(x, y);
        this.actor.set_size(w, h);
        if (reconstruir)
            this.reconstruir();
        this._ubicarBarra();
    }

    aparecer() {
        this.actor.set({opacity: 0, scale_x: 0.9, scale_y: 0.9});
        this.actor.ease({
            opacity: 255, scale_x: 1, scale_y: 1, duration: 260,
            mode: Clutter.AnimationMode.EASE_OUT_BACK,
        });
    }

    _liberar() {
        this._editando = false;
        this._pararDrag();
        this._inst?.destruir();
        this._inst = null;
    }

    destruir() {
        this._liberar();
        this.actor.remove_all_transitions();
        this.actor.destroy();
    }


    _crearCapa() {
        const capa = new St.Widget({
            layout_manager: new Clutter.BinLayout(), reactive: true, visible: false,
            style_class: 'lw-edit', x_expand: true, y_expand: true,
        });
        capa.connect('button-press-event', (_a, ev) => {
            if (ev.get_button() !== Clutter.BUTTON_PRIMARY)
                return PASS;


            const [px, py] = ev.get_coords();
            const source = global.stage.get_actor_at_pos(Clutter.PickMode.REACTIVE, px, py);
            if (source && this._barra?.contains(source))
                return PASS;
            this._iniciarDrag('mover', ev);
            return STOP;
        });
        for (const [modo, xa, ya] of [['tl', START, START], ['tr', END, START], ['bl', START, END], ['br', END, END]]) {
            const hd = new St.Widget({
                style_class: 'lw-handle', reactive: true, x_expand: true, y_expand: true, x_align: xa, y_align: ya,
            });
            hd.translation_x = xa === START ? -8 : 8;
            hd.translation_y = ya === START ? -8 : 8;
            hd.connect('button-press-event', (_a, ev) => {
                this._iniciarDrag(modo, ev);
                return STOP;
            });
            capa.add_child(hd);
        }
        const barra = this._barra = new St.BoxLayout({
            style_class: 'lw-tools', x_expand: true, y_expand: true, x_align: CENTER, y_align: START,
        });
        const mk = (txt, cb, clase = '') => {
            const b = new St.Button({label: txt, style_class: `lw-tool ${clase}`, reactive: true, can_focus: true});
            b.connect('clicked', cb);
            barra.add_child(b);
            return b;
        };
        mk('Quitar', () => this.core.quitar(this), 'lw-tool-rojo');
        mk('Ajustes', () => this.core.abrirAjustes(this.cfg.id));
        this._bEstilo = mk('', () => this.core.alternarEstilo(this));
        mk('Duplicar', () => this.core.duplicar(this));
        capa.add_child(barra);
        return capa;
    }

    _actualizarBotonEstilo() {
        if (this._bEstilo)
            this._bEstilo.label = this.cfg.estilo.estilo === 'glass' ? 'Pasar a sólido' : 'Pasar a vidrio';
    }

    _ubicarBarra() {
        if (this._barra)
            this._barra.translation_y = this.cfg.y < 52 ? 10 : -44;
    }

    editar(on) {
        this._editando = on;
        this._capa.visible = on;
        this._ubicarBarra();
        this.actor.remove_all_transitions();
        this.actor.rotation_angle_z = 0;
        if (on)
            this._jiggle(Math.random() < 0.5 ? 1 : -1);
    }

    _jiggle(dir) {
        if (!this._editando || !this.core.cfg.global.animaciones)
            return;
        this.actor.ease({
            rotation_angle_z: this._drag ? 0 : dir * 0.55, duration: 105 + Math.random() * 45,
            mode: Clutter.AnimationMode.EASE_IN_OUT_SINE,
            onComplete: () => this._jiggle(-dir),
        });
    }


    _iniciarDrag(modo, ev) {
        const [px, py] = ev.get_coords();
        const {x, y, w, h} = this.cfg;
        this._drag = {modo, px, py, o: {x, y, w, h}, cambioTam: false};
        this.core.alFrente(this);
        this._capId = global.stage.connect('captured-event', (_s, e) => {
            const t = e.type();
            if (t === Clutter.EventType.MOTION) {
                const [mx, my] = e.get_coords();
                this._arrastrar(mx - this._drag.px, my - this._drag.py, e.get_state());
                return STOP;
            }
            if (t === Clutter.EventType.BUTTON_RELEASE) {
                this._terminarDrag();
                return STOP;
            }
            return PASS;
        });
    }

    _arrastrar(dx, dy, estado) {
        const d = this._drag;
        const [minW, minH] = this.META.min ?? [120, 100];
        let {x, y, w, h} = d.o;
        const m = d.modo;
        if (m === 'mover') {
            x += dx;
            y += dy;
        } else {
            d.cambioTam = true;
            if (m.includes('r'))
                w += dx;
            if (m.includes('l')) {
                x += dx;
                w -= dx;
            }
            if (m.includes('b'))
                h += dy;
            if (m.includes('t')) {
                y += dy;
                h -= dy;
            }
            if (w < minW) {
                if (m.includes('l'))
                    x -= minW - w;
                w = minW;
            }
            if (h < minH) {
                if (m.includes('t'))
                    y -= minH - h;
                h = minH;
            }
        }
        const libre = (estado & Clutter.ModifierType.MOD1_MASK) !== 0;
        let r = {x, y, w, h};
        if (!libre)
            r = this.core.imantar(this, m, r);
        const A = this.core.area;
        r.w = Math.min(r.w, A.w);
        r.h = Math.min(r.h, A.h);
        r.x = clamp(r.x, 0, A.w - r.w);
        r.y = clamp(r.y, 0, A.h - r.h);
        this.fijarRect(Math.round(r.x), Math.round(r.y), Math.round(r.w), Math.round(r.h), false);
    }

    _terminarDrag() {
        const cambio = this._drag?.cambioTam;
        this._pararDrag();
        if (cambio)
            this.reconstruir();
        this.core.guardarCfg();
    }

    _pararDrag() {
        if (this._capId) {
            global.stage.disconnect(this._capId);
            this._capId = 0;
        }
        this._drag = null;
    }
}
