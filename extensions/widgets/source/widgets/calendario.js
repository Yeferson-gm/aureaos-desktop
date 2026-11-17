import Clutter from 'gi://Clutter';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import St from 'gi://St';

import {WidgetBase} from '../lib/base.js';
import {Hoja, boton, etiqueta, pedir} from '../lib/hoja.js';
import {DIAS, MESES, cap, feriadosPeru, iso, nuevoId, pad} from '../lib/util.js';

export const META = {
    id: 'calendario', nombre: 'Calendario', padding: 0, icono: 'x-office-calendar-symbolic',
    desc: 'Mes completo, feriados de Perú, eventos, cumpleaños de tus contactos y citas.',
    tam: {S: [170, 170], M: [380, 170], L: [380, 380]}, min: [150, 140],
    opciones: [
        {k: 'compacto', t: 'sel', etq: 'Calendario pequeño', ops: [['mes', 'Mes completo'], ['dia', 'Fecha grande']], def: 'mes'},
        {k: 'feriados', t: 'bool', etq: 'Marcar feriados de Perú', def: true},
        {k: 'cumples', t: 'bool', etq: 'Mostrar cumpleaños de contactos', def: true},
        {k: 'lunes', t: 'bool', etq: 'La semana empieza en lunes', def: true},
        {k: 'ics', t: 'texto', etq: 'Carpeta con archivos .ics (opcional)', ph: '/home/usuario/Calendarios', def: '', ayuda: 'Se leen los eventos sin repetición de cada .ics.'},
    ],
};

const COLORES = ['#0a84ff', '#30d158', '#ff9f0a', '#ff453a', '#bf5af2'];

function leerIcs(dir) {
    const out = [];
    if (!dir)
        return out;
    try {
        const en = Gio.File.new_for_path(dir).enumerate_children('standard::name', 0, null);
        let i;
        while ((i = en.next_file(null)) !== null) {
            if (!i.get_name().toLowerCase().endsWith('.ics'))
                continue;
            const [ok, b] = GLib.file_get_contents(GLib.build_filenamev([dir, i.get_name()]));
            if (!ok)
                continue;
            const txt = new TextDecoder().decode(b).replace(/\r?\n[ \t]/g, '');
            for (const blk of txt.split('BEGIN:VEVENT').slice(1)) {
                const s = blk.match(/DTSTART[^:\n]*:(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2}))?/);
                const t = blk.match(/SUMMARY[^:\n]*:(.*)/);
                if (s && t)
                    out.push({id: `ics-${out.length}`, fecha: `${s[1]}-${s[2]}-${s[3]}`, hora: s[4] ? `${s[4]}:${s[5]}` : '', titulo: t[1].trim(), color: '#64d2ff', ro: true});
            }
        }
        en.close(null);
    } catch (_e) {

    }
    return out;
}

export class Widget extends WidgetBase {
    get w() { return super.w - 28; }
    get h() { return super.h - 28; }

    construir(box) {
        this.box = box;
        const hoy = new Date();
        this.mes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        this._pintar();
        this.cada(60 * 1000, () => {
            if (new Date().getDate() !== this._dia)
                this._pintar();
        });
    }


    _eventos(f) {
        const o = this.o;
        const out = [];
        const y = parseInt(f.slice(0, 4), 10);
        if (o.feriados) {
            const n = feriadosPeru(y).get(f);
            if (n)
                out.push({tipo: 'feriado', titulo: n, color: '#ff453a'});
        }
        for (const e of [...this.datos.eventos, ...(this._ics ??= leerIcs(o.ics))]) {
            if (e.fecha === f)
                out.push({tipo: 'evento', ...e});
        }
        if (o.cumples) {
            for (const c of this.datos.contactos) {
                if (c.cumple && c.cumple.slice(-5) === f.slice(5))
                    out.push({tipo: 'cumple', titulo: `Cumpleaños de ${c.nombre}`, color: '#ff375f'});
            }
        }
        return out.sort((a, b) => (a.hora ?? '').localeCompare(b.hora ?? ''));
    }

    _proximos(n) {
        const out = [];
        const d = new Date();
        for (let i = 0; i < 60 && out.length < n; i++) {
            const f = iso(new Date(d.getFullYear(), d.getMonth(), d.getDate() + i));
            for (const e of this._eventos(f)) {
                out.push({...e, f, i});
                if (out.length >= n)
                    break;
            }
        }
        return out;
    }

    _pintar() {
        this.box.destroy_all_children();
        this.box.style = 'padding: 14px;';
        const hoy = new Date();
        this._dia = hoy.getDate();
        const w = this.w;
        const h = this.h;
        const modo = h < 200 ? (w < 250 ? 'S' : 'M') : (w >= 520 ? 'XL' : 'L');
        const fila = this.fila();
        fila.y_expand = true;
        if (modo === 'S' && this.o.compacto !== 'dia') {
            this.box.style = 'padding: 0;';
            this.box.add_child(this._mes(hoy, false, true));
            return;
        }
        if (modo !== 'L')
            fila.add_child(this._lateral(hoy, modo));
        if (modo === 'L' || modo === 'XL')
            fila.add_child(this._mes(hoy, modo === 'L'));
        else if (modo === 'M')
            fila.add_child(this._lista(hoy, 4));
        this.box.add_child(fila);
    }

    _lateral(hoy, modo) {
        const col = this.columna();
        col.width = modo === 'XL' ? this.px(150) : (modo === 'S' ? this.w : this.px(120));
        col.y_expand = true;
        col.add_child(this.t(cap(DIAS[hoy.getDay()]), 14, {c: 'rojo', peso: 'bold'}));
        col.add_child(this.t(String(hoy.getDate()), modo === 'S' ? 64 : 72, {peso: '200', extra: 'letter-spacing: -2px;'}));
        col.add_child(this.t(`${cap(MESES[hoy.getMonth()])} ${hoy.getFullYear()}`, 12, {c: 'texto2'}));
        if (modo === 'S') {
            const p = this._proximos(1)[0];
            if (p)
                col.add_child(this.t(p.titulo, 11, {c: p.color}));
        }
        return col;
    }

    _lista(hoy, n) {
        const col = this.columna();
        col.x_expand = true;
        const prox = this._proximos(n);
        if (!prox.length)
            col.add_child(this.t('Sin eventos próximos', 12, {c: 'texto2'}));
        for (const e of prox) {
            const f = this.fila();
            f.add_child(new St.Widget({style: `width: 3px; border-radius: 2px; background-color: ${e.color};`, y_expand: true}));
            const c = this.columna();
            c.add_child(this.t(e.titulo, 12, {peso: 'bold'}));
            c.add_child(this.t(e.i === 0 ? `Hoy${e.hora ? `, ${e.hora}` : ''}` : (e.i === 1 ? 'Mañana' : `${parseInt(e.f.slice(8), 10)} ${MESES[parseInt(e.f.slice(5, 7), 10) - 1].slice(0, 3)}`), 11, {c: 'texto2'}));
            f.add_child(c);
            col.add_child(f);
        }
        return col;
    }

    _mes(hoy, conLista, compacto = false) {
        const col = this.columna();
        col.x_expand = true;
        col.y_expand = true;
        if (compacto) col.style = 'spacing: 0;';
        const cab = this.fila(`background-color: ${this.pal.rojo}; border-radius: ${compacto ? `${this.ctx.radio}px ${this.ctx.radio}px 0 0` : '9px'}; padding: ${compacto ? 7 : 6}px 6px;`);
        cab.add_child(this.t(compacto ? MESES[this.mes.getMonth()].toUpperCase() : `${cap(MESES[this.mes.getMonth()])} ${this.mes.getFullYear()}`, compacto ? 10 : 14, {peso: 'bold', c: '#ffffff', expand: true, align: compacto ? Clutter.ActorAlign.CENTER : null}));
        const nav = (d, ic) => this.boton(this.icono(ic, 14, '#ffffff'), () => {
            this.mes = new Date(this.mes.getFullYear(), this.mes.getMonth() + d, 1);
            this._pintar();
        });
        if (!compacto) {
        cab.add_child(nav(-1, 'go-previous-symbolic'));
        cab.add_child(this.boton(this.t('Hoy', 11, {c: '#ffffff'}), () => {
            this.mes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
            this._pintar();
        }));
        cab.add_child(nav(1, 'go-next-symbolic'));
        }
        col.add_child(cab);

        const grid = new St.Widget({layout_manager: new Clutter.GridLayout({column_homogeneous: true, row_homogeneous: true}), x_expand: true, y_expand: true});
        if (compacto) grid.style = 'margin: 3px 12px 10px;';
        const lay = grid.layout_manager;
        const ini = this.o.lunes ? 1 : 0;
        const nombres = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
        for (let i = 0; i < 7; i++)
            lay.attach(this.t(nombres[(i + ini) % 7], 10, {c: 'texto2', align: Clutter.ActorAlign.CENTER}), i, 0, 1, 1);
        const primero = (this.mes.getDay() - ini + 7) % 7;
        const total = new Date(this.mes.getFullYear(), this.mes.getMonth() + 1, 0).getDate();
        for (let d = 1; d <= total; d++) {
            const pos = primero + d - 1;
            const f = `${this.mes.getFullYear()}-${pad(this.mes.getMonth() + 1)}-${pad(d)}`;
            const ev = this._eventos(f);
            const esHoy = f === iso(hoy);
            const feriado = ev.find(e => e.tipo === 'feriado');
            const celda = new St.BoxLayout({orientation: Clutter.Orientation.VERTICAL, x_align: Clutter.ActorAlign.CENTER, y_align: Clutter.ActorAlign.CENTER, style: 'spacing: 1px;'});
            const num = this.t(String(d), compacto ? 10 : 12, {
                peso: esHoy ? 'bold' : 'normal', c: esHoy ? '#ffffff' : (feriado ? 'rojo' : 'texto'),
                align: Clutter.ActorAlign.CENTER,
                extra: esHoy ? `background-color: ${this.pal.rojo}; border-radius: 99px; min-width: ${this.px(compacto ? 15 : 22)}px; text-align: center; padding: 1px 0;` : '',
            });
            celda.add_child(num);
            const pts = new St.BoxLayout({x_align: Clutter.ActorAlign.CENTER, style: 'spacing: 2px;'});
            for (const e of ev.slice(0, 3))
                pts.add_child(new St.Widget({style: `width: 4px; height: 4px; border-radius: 2px; background-color: ${e.color};`}));
            if (!compacto) celda.add_child(pts);
            const b = this.boton(celda, () => this._dia_(f), {expand: true, extra: compacto ? 'padding: 0;' : ''});
            lay.attach(b, pos % 7, 1 + Math.floor(pos / 7), 1, 1);
        }
        col.add_child(grid);
        if (conLista && this.h > 330) {
            const prox = this._proximos(2);
            for (const e of prox) {
                col.add_child(this.t(`${e.titulo}`, 11, {c: e.color}));
            }
        }
        return col;
    }

    _dia_(f) {
        const [y, m, d] = f.split('-').map(Number);
        const h = new Hoja(this.core, {titulo: `${d} de ${MESES[m - 1]} de ${y}`, ancho: 460});
        const pintar = () => {
            h.cuerpo.destroy_all_children();
            const ev = this._eventos(f);
            if (!ev.length)
                h.cuerpo.add_child(etiqueta('No hay eventos este día.', 'lintel-ayuda'));
            for (const e of ev) {
                const fila = new St.BoxLayout({style: 'spacing: 10px;', x_expand: true});
                fila.add_child(new St.Widget({style: `width: 4px; border-radius: 2px; background-color: ${e.color};`}));
                const c = new St.BoxLayout({orientation: Clutter.Orientation.VERTICAL, x_expand: true});
                c.add_child(etiqueta(e.titulo, 'lintel-card-t'));
                c.add_child(etiqueta({feriado: 'Feriado nacional', cumple: 'Cumpleaños', evento: e.hora || 'Todo el día'}[e.tipo], 'lintel-ayuda'));
                fila.add_child(c);
                if (e.tipo === 'evento' && !e.ro) {
                    fila.add_child(boton('Eliminar', () => {
                        this.datos.eventos = this.datos.eventos.filter(x => x.id !== e.id);
                        this.guardarDatos();
                        this._pintar();
                        pintar();
                    }, 'lintel-btn lintel-btn-danger'));
                }
                h.cuerpo.add_child(fila);
            }
            h.cuerpo.add_child(boton('＋ Nuevo evento', () => {
                pedir(this.core, {
                    titulo: 'Nuevo evento', ok: 'Añadir',
                    campos: [
                        {k: 'titulo', etq: 'Título', ph: 'Reunión, cita…'},
                        {k: 'hora', etq: 'Hora', ph: '14:30 (opcional)'},
                        {k: 'color', etq: 'Color', tipo: 'colores', colores: COLORES, valor: COLORES[0]},
                    ],
                    cb: v => {
                        if (!v.titulo.trim())
                            return;
                        this.datos.eventos.push({id: nuevoId(), fecha: f, hora: v.hora.trim(), titulo: v.titulo.trim(), color: v.color});
                        this.guardarDatos();
                        this._pintar();
                    },
                });
            }, 'lintel-btn lintel-btn-primary'));
        };
        h.abrir();
        pintar();
    }
}
