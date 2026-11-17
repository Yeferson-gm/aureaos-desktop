import Clutter from 'gi://Clutter';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import Gio from 'gi://Gio';
import Meta from 'gi://Meta';
import St from 'gi://St';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

import {Almacen, cerrarHttp, nuevoId} from './util.js';
import {normalizeWidgetList} from './widget-list.js';
import {estiloNuevo, ESTILO_DEF} from './estilo.js';
import {Marco} from './marco.js';
import {boton} from './hoja.js';
import {abrirAjustes, abrirGaleria} from './ajustes.js';
import {MODULOS} from '../widgets/index.js';

const PASS = Clutter.EVENT_PROPAGATE;

const CFG_DEF = {
    v: 1,
    global: {
        estilo: 'glass', tema: 'auto', cuadricula: true, tam: 20, imantar: true, animaciones: true,
        capa: 'auto', unidad: 'C', rastrear: true,
    },
    widgets: null,
};

const DATOS_DEF = {
    notas: [], tareas: [], eventos: [], contactos: [], fotosFav: [], feedsPodcast: [], podVistos: {},
    listas: [
        {id: 'l1', nombre: 'Recordatorios', color: '#ff9f0a'},
        {id: 'l2', nombre: 'Trabajo', color: '#0a84ff'},
        {id: 'l3', nombre: 'Compras', color: '#30d158'},
    ],
};

const Indicador = GObject.registerClass(class Indicador extends PanelMenu.Button {
    _init(core, rutaIcono) {
        super._init(0.5, 'Widgets del escritorio', false);
        this.add_child(new St.Icon({
            gicon: Gio.icon_new_for_string(rutaIcono), style_class: 'system-status-icon',
        }));
        this._sw = new PopupMenu.PopupSwitchMenuItem('Modo de edición', false);
        this._sw.connect('toggled', (_i, on) => core.modoEdicion(on));
        this.menu.addMenuItem(this._sw);
        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        const a = new PopupMenu.PopupMenuItem('Añadir widget…');
        a.connect('activate', () => core.abrirGaleria());
        this.menu.addMenuItem(a);
        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        const s = new PopupMenu.PopupMenuItem('Ajustes…');
        s.connect('activate', () => core.abrirAjustes());
        this.menu.addMenuItem(s);
    }

    fijarEdicion(on) {
        this._sw.setToggleState(on);
    }
});

export class Escritorio {
    constructor(ext) {
        this.ext = ext;
        this.hojas = [];
        this.marcos = [];
        this.editando = false;
        this._conex = [];
        this._serv = [];
    }


    iniciar() {
        this._cfgAlm = new Almacen('config', CFG_DEF);
        this.cfg = this._cfgAlm.datos;
        this.cfg.global = {...CFG_DEF.global, ...this.cfg.global};
        this.datos = new Almacen('datos', DATOS_DEF);
        this.uso = new Almacen('uso', {dias: {}});

        this._medir();
        this.capa = new St.Widget({reactive: false, x: this.mon.x, y: this.mon.y + this.top, width: this.area.w, height: this.area.h});
        this.fondoEd = new St.Widget({
            style_class: 'lw-fondo-edicion', reactive: true, visible: false, x: 0, y: 0,
            width: this.area.w, height: this.area.h,
        });
        this.capa.add_child(this.fondoEd);
        this.barra = this._crearBarra();
        this.capa.add_child(this.barra);

        if (!this.cfg.widgets)
            this.cfg.widgets = this._inicial();
        if (normalizeWidgetList(this.cfg))
            this.guardarCfg();
        for (const c of [...this.cfg.widgets])
            this._montar(c);
        this.colocar();

        for (const mod of Object.values(MODULOS)) {
            if (mod.servicio) {
                try {
                    this._serv.push(mod.servicio(this));
                } catch (e) {
                    console.error(`[Widgets] servicio: ${e.message}`);
                }
            }
        }

        const pedir = () => this._pedirColocar();
        this._conex.push([global.display, global.display.connect('restacked', pedir)]);
        this._conex.push([global.display, global.display.connect('window-created', pedir)]);
        this._conex.push([Main.layoutManager, Main.layoutManager.connect('monitors-changed', () => this._alCambiarMonitor())]);

        this.indicador = new Indicador(this, `${this.ext.path}/icons/lintel-widgets-symbolic.svg`);
        Main.panel.addToStatusArea(this.ext.uuid, this.indicador, 0, 'right');
    }

    detener() {
        if (this._colocarLater)
            global.compositor.get_laters().remove(this._colocarLater);
        this._colocarLater = 0;
        for (const [o, id] of this._conex)
            o.disconnect(id);
        this._conex = [];
        for (const h of [...this.hojas])
            h.cerrar();
        this._cerrarMenu();
        this.modoEdicion(false);
        for (const s of this._serv)
            s?.detener?.();
        this._serv = [];
        for (const m of this.marcos)
            m.destruir();
        this.marcos = [];
        this.indicador?.destroy();
        this.indicador = null;
        this.capa.get_parent()?.remove_child(this.capa);
        this.capa.destroy();
        this._cfgAlm.destruir();
        this.datos.destruir();
        this.uso.destruir();
        cerrarHttp();
    }

    guardarCfg() {
        this._cfgAlm.guardar();
    }

    notificar(titulo, msg) {
        Main.notify(titulo, msg);
    }


    _medir() {
        this.mon = Main.layoutManager.primaryMonitor;
        this.top = Main.panel.get_height();
        this.area = {w: this.mon.width, h: this.mon.height - this.top};
    }

    _alCambiarMonitor() {
        this._medir();
        this.capa.set_position(this.mon.x, this.mon.y + this.top);
        this.capa.set_size(this.area.w, this.area.h);
        this.fondoEd.set_size(this.area.w, this.area.h);
        this._ubicarBarra();
        for (const m of this.marcos) {
            const c = m.cfg;
            m.fijarRect(Math.min(c.x, Math.max(0, this.area.w - c.w)), Math.min(c.y, Math.max(0, this.area.h - c.h)), c.w, c.h, false);
        }
    }

    _pedirColocar() {
        if (this._colocarLater)
            return;


        this._colocarLater = global.compositor.get_laters().add(Meta.LaterType.BEFORE_REDRAW, () => {
            this._colocarLater = 0;
            this.colocar();
            return GLib.SOURCE_REMOVE;
        });
    }

    _ventanasEscritorio() {
        return global.get_window_actors().filter(a => {
            const w = a.meta_window;
            if (!w)
                return false;
            const t = w.get_title() ?? '';
            const c = (w.get_wm_class() ?? '').toLowerCase();
            return w.get_window_type() === Meta.WindowType.DESKTOP || t.startsWith('@!') || c.includes('ding');
        });
    }

    colocar() {
        const wg = global.window_group;
        const p = this.capa.get_parent();
        if (this.editando) {
            if (p !== Main.uiGroup) {
                p?.remove_child(this.capa);
                Main.uiGroup.add_child(this.capa);
            }
            Main.uiGroup.set_child_above_sibling(this.capa, wg);
            return;
        }
        if (p !== wg) {
            p?.remove_child(this.capa);
            wg.add_child(this.capa);
        }
        let destino = Main.layoutManager._backgroundGroup;
        if (this.cfg.global.capa === 'auto') {
            const set = new Set(this._ventanasEscritorio());
            for (const hijo of wg.get_children()) {


                if (hijo.meta_window && !set.has(hijo))
                    break;
                if (set.has(hijo))
                    destino = hijo;
            }
        }
        if (this.capa.get_previous_sibling() !== destino)
            wg.set_child_above_sibling(this.capa, destino);
    }


    _montar(cfg) {
        const mod = MODULOS[cfg.tipo];
        if (!mod)
            return null;
        const m = new Marco(this, cfg, mod);
        this.capa.insert_child_below(m.actor, this.barra);
        this.marcos.push(m);
        if (this.editando)
            m.editar(true);
        return m;
    }

    _inicial() {
        const mk = (tipo, x, y, w, h, estilo) => ({id: nuevoId(), tipo, x, y, w, h, estilo: estiloNuevo(estilo), opts: {}});
        return [
            mk('reloj', 24, 14, 170, 170, 'glass'),
            mk('clima', 208, 14, 380, 170, 'glass'),
            mk('calendario', 24, 198, 564, 300, 'solido'),
            mk('baterias', 602, 14, 170, 170, 'glass'),
        ];
    }

    huecoLibre(w, h) {
        const choca = (x, y) => this.marcos.some(m => {
            const c = m.cfg;
            return x < c.x + c.w + 12 && x + w + 12 > c.x && y < c.y + c.h + 12 && y + h + 12 > c.y;
        });
        for (let y = 14; y + h <= this.area.h; y += 20) {
            for (let x = 24; x + w <= this.area.w; x += 20) {
                if (!choca(x, y))
                    return [x, y];
            }
        }
        const n = this.marcos.length * 24;
        return [24 + n % 200, 24 + n % 200];
    }

    agregar(tipo, tam = 'M') {
        const existente = this.marcos.find(m => m.cfg.tipo === tipo);
        if (existente) {
            this.mostrar(existente);
            return existente;
        }
        const mod = MODULOS[tipo];
        if (!mod?.META.tam[tam])
            return null;
        const [w, h] = mod.META.tam[tam];
        const [x, y] = this.huecoLibre(w, h);
        const cfg = {id: nuevoId(), tipo, x, y, w, h, estilo: estiloNuevo(this.cfg.global.estilo), opts: {}};
        this.modoEdicion(true);
        const m = this._montar(cfg);
        this.cfg.widgets.push(cfg);
        m.aparecer();
        this.guardarCfg();
        return m;
    }

    mostrar(m) {
        this.modoEdicion(true);
        this.alFrente(m);
        m.aparecer();
    }

    quitar(m) {
        this.cfg.widgets = this.cfg.widgets.filter(c => c !== m.cfg);
        this.marcos = this.marcos.filter(x => x !== m);
        this.guardarCfg();
        m.actor.ease({
            opacity: 0, scale_x: 0.85, scale_y: 0.85, duration: 180, mode: Clutter.AnimationMode.EASE_IN_QUAD,
            onComplete: () => m.destruir(),
        });
    }

    alternarEstilo(m) {
        const est = m.cfg.estilo;
        est.estilo = est.estilo === 'glass' ? 'solido' : 'glass';
        Object.assign(est, ESTILO_DEF[est.estilo]);
        m.refrescarEstilo();
        this.guardarCfg();
    }

    estiloATodos(tipo) {
        for (const m of this.marcos) {
            m.cfg.estilo.estilo = tipo;
            Object.assign(m.cfg.estilo, ESTILO_DEF[tipo]);
            m.refrescarEstilo();
        }
        this.guardarCfg();
    }

    reordenar() {
        let x = 24;
        let y = 14;
        let fila = 0;
        for (const m of [...this.marcos].sort((a, b) => a.cfg.y - b.cfg.y || a.cfg.x - b.cfg.x)) {
            const {w, h} = m.cfg;
            if (x + w > this.area.w && x > 24) {
                x = 24;
                y += fila + 14;
                fila = 0;
            }
            m.fijarRect(x, y, w, h, false);
            x += w + 14;
            fila = Math.max(fila, h);
        }
        this.guardarCfg();
    }

    restablecer() {
        for (const m of this.marcos)
            m.destruir();
        this.marcos = [];
        this.cfg.widgets = this._inicial();
        for (const c of [...this.cfg.widgets])
            this._montar(c);
        this.guardarCfg();
    }

    refrescarTipo(tipo) {
        for (const m of this.marcos) {
            if (m.cfg.tipo === tipo)
                m.reconstruir();
        }
    }

    alFrente(m) {
        this.capa.set_child_below_sibling(m.actor, this.barra);
        this.cfg.widgets = this.cfg.widgets.filter(c => c !== m.cfg).concat(m.cfg);
    }


    imantar(marco, modo, r) {
        const g = this.cfg.global;
        const T = 9;
        const xs = [0, this.area.w];
        const ys = [0, this.area.h];
        if (g.imantar) {
            for (const m of this.marcos) {
                if (m === marco)
                    continue;
                const c = m.cfg;
                xs.push(c.x, c.x + c.w, c.x + c.w / 2);
                ys.push(c.y, c.y + c.h, c.y + c.h / 2);
            }
        }
        const aj = (v, t) => {
            let mejor = v;
            let bd = T + 1;
            if (g.imantar) {
                for (const q of t) {
                    const d = Math.abs(v - q);
                    if (d < bd) {
                        bd = d;
                        mejor = q;
                    }
                }
            }
            if (bd <= T)
                return mejor;
            return g.cuadricula ? Math.round(v / g.tam) * g.tam : v;
        };
        let {x, y, w, h} = r;
        if (modo === 'mover') {
            const nx = aj(x, xs);
            const nr = aj(x + w, xs) - w;
            x = Math.abs(nx - x) <= Math.abs(nr - x) ? nx : nr;
            const ny = aj(y, ys);
            const nb = aj(y + h, ys) - h;
            y = Math.abs(ny - y) <= Math.abs(nb - y) ? ny : nb;
        } else {
            if (modo.includes('l')) {
                const nx = aj(x, xs);
                w += x - nx;
                x = nx;
            }
            if (modo.includes('r'))
                w = aj(x + w, xs) - x;
            if (modo.includes('t')) {
                const ny = aj(y, ys);
                h += y - ny;
                y = ny;
            }
            if (modo.includes('b'))
                h = aj(y + h, ys) - y;
        }
        return {x, y, w, h};
    }


    _crearBarra() {
        const b = new St.BoxLayout({style_class: 'lw-barra', visible: false, width: 470, height: 54});
        b.add_child(boton('＋  Añadir widget', () => this.abrirGaleria(), 'lintel-btn lintel-btn-primary'));
        b.add_child(boton('Ajustes', () => this.abrirAjustes()));
        b.add_child(new St.Widget({x_expand: true}));
        b.add_child(boton('Listo', () => this.modoEdicion(false), 'lintel-btn lintel-btn-primary'));
        b.set_position(Math.round((this.area.w - 470) / 2), this.area.h - 90);
        return b;
    }

    _ubicarBarra() {
        this.barra.set_position(Math.round((this.area.w - 470) / 2), this.area.h - 90);
    }

    modoEdicion(on) {
        if (on === this.editando)
            return;
        this.editando = on;
        this._cerrarMenu();
        this.fondoEd.visible = on;
        this.barra.visible = on;
        if (on) {
            this.fondoEd.opacity = 0;
            this.fondoEd.ease({opacity: 255, duration: 200, mode: Clutter.AnimationMode.EASE_OUT_QUAD});
            this.barra.opacity = 0;
            this.barra.translation_y = 20;
            this.barra.ease({opacity: 255, translation_y: 0, duration: 260, mode: Clutter.AnimationMode.EASE_OUT_CUBIC});
        }
        this.colocar();
        for (const m of this.marcos)
            m.editar(on);
        this.indicador?.fijarEdicion(on);
        if (!on)
            this.guardarCfg();
    }

    abrirAjustes(id = 'general') {
        return abrirAjustes(this, id);
    }

    abrirGaleria() {
        return abrirGaleria(this);
    }


    _cerrarMenu() {
        if (this._menu) {
            this._menu.destroy();
            this._menu = null;
        }
        if (this._menuConex) {
            global.stage.disconnect(this._menuConex);
            this._menuConex = 0;
        }
    }

    menuWidget(m, x, y) {
        const est = m.cfg.estilo;
        this._menuDe([
            {t: `Editar «${m.META.nombre}»…`, cb: () => this.abrirAjustes(m.cfg.id)},
            {t: est.estilo === 'glass' ? 'Cambiar a sólido' : 'Cambiar a vidrio', cb: () => this.alternarEstilo(m)},
            'sep',
            ...['S', 'M', 'L'].map(k => ({
                t: `Tamaño ${{S: 'pequeño', M: 'mediano', L: 'grande'}[k]}`,
                cb: () => {
                    const [w, h] = m.META.tam[k];
                    m.fijarRect(m.cfg.x, m.cfg.y, w, h);
                    this.guardarCfg();
                },
            })),
            'sep',
            {t: 'Editar widgets', cb: () => this.modoEdicion(true)},
            {t: 'Quitar widget', cb: () => this.quitar(m), peligro: true},
        ], x, y);
    }

    _menuDe(items, x, y) {
        this._cerrarMenu();
        const menu = new St.BoxLayout({style_class: 'lintel-ctx', orientation: Clutter.Orientation.VERTICAL});
        for (const it of items) {
            if (it === 'sep') {
                menu.add_child(new St.Widget({style_class: 'lintel-ctx-sep', x_expand: true}));
                continue;
            }
            const b = new St.Button({
                label: it.t, style_class: `lintel-ctx-item${it.peligro ? ' danger' : ''}`,
                x_expand: true, x_align: Clutter.ActorAlign.FILL, can_focus: true,
            });
            b.connect('clicked', () => {
                this._cerrarMenu();
                it.cb();
            });
            menu.add_child(b);
        }
        Main.uiGroup.add_child(menu);
        this._menu = menu;
        const [, nw] = menu.get_preferred_width(-1);
        const [, nh] = menu.get_preferred_height(nw);
        menu.set_position(Math.min(x, global.stage.width - nw - 8), Math.min(y, global.stage.height - nh - 8));
        menu.opacity = 0;
        menu.ease({opacity: 255, duration: 110, mode: Clutter.AnimationMode.EASE_OUT_QUAD});
        this._menuConex = global.stage.connect('captured-event', (_s, e) => {
            if (e.type() === Clutter.EventType.BUTTON_PRESS) {
                const src = e.get_source();
                if (!src || !menu.contains(src))
                    this._cerrarMenu();
            }
            return PASS;
        });
    }
}
