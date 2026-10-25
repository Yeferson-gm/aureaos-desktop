import Clutter from 'gi://Clutter';
import GLib from 'gi://GLib';
import St from 'gi://St';

import {WidgetBase} from '../lib/base.js';
import {pedir} from '../lib/hoja.js';
import {MESES, nuevoId} from '../lib/util.js';

export const META = {
    id: 'recordatorios', nombre: 'Recordatorios', icono: 'checkbox-checked-symbolic',
    desc: 'Listas de tareas con casillas, prioridades y avisos con notificación a la hora indicada.',
    tam: {S: [170, 170], M: [380, 170], L: [380, 380]}, min: [150, 140],
    opciones: [
        {k: 'lista', t: 'listas', etq: 'Lista a mostrar', def: 'todas'},
        {k: 'completadas', t: 'bool', etq: 'Mostrar tareas completadas', def: false},
    ],
};

const PRIO = ['', '!', '!!', '!!!'];

function fechaTarea(s) {
    const m = (s ?? '').match(/^(\d{4})-(\d{2})-(\d{2})(?: (\d{1,2}):(\d{2}))?$/);
    return m ? new Date(+m[1], +m[2] - 1, +m[3], m[4] ? +m[4] : 9, m[5] ? +m[5] : 0) : null;
}

export function servicio(core) {
    const id = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 30, () => {
        const ahora = new Date();
        let cambio = false;
        for (const t of core.datos.datos.tareas) {
            const f = fechaTarea(t.fecha);
            if (!t.ok && !t.notificado && f && f <= ahora) {
                t.notificado = true;
                cambio = true;
                core.notificar('Recordatorio', t.t);
            }
        }
        if (cambio) {
            core.datos.guardar();
            core.refrescarTipo('recordatorios');
        }
        return GLib.SOURCE_CONTINUE;
    });
    return {detener: () => GLib.source_remove(id)};
}

export class Widget extends WidgetBase {
    construir(box) {
        this.box = box;
        this._pintar();
    }

    _lista() {
        const l = this.datos.listas.find(x => x.id === this.o.lista);
        return l ?? {id: 'todas', nombre: 'Todas', color: this.pal.acento};
    }

    _tareas() {
        const l = this._lista();
        return this.datos.tareas
            .filter(t => (l.id === 'todas' || t.lista === l.id) && (this.o.completadas || !t.ok))
            .sort((a, b) => Number(a.ok) - Number(b.ok) || b.prio - a.prio ||
                (fechaTarea(a.fecha)?.getTime() ?? 9e15) - (fechaTarea(b.fecha)?.getTime() ?? 9e15));
    }

    _colorLista(t) {
        return this.datos.listas.find(l => l.id === t.lista)?.color ?? this.pal.acento;
    }

    _editar(t) {
        const opsLista = this.datos.listas.map(l => [l.id, l.nombre]);
        const l0 = this._lista();
        pedir(this.core, {
            titulo: t ? 'Editar recordatorio' : 'Nuevo recordatorio', ok: t ? 'Guardar' : 'Añadir',
            campos: [
                {k: 't', etq: 'Tarea', valor: t?.t ?? '', ph: 'Comprar pan…'},
                {k: 'prio', etq: 'Prioridad', tipo: 'sel', ops: [['0', 'Ninguna'], ['1', 'Baja'], ['2', 'Media'], ['3', 'Alta']], valor: String(t?.prio ?? 0)},
                {k: 'fecha', etq: 'Fecha y hora', valor: t?.fecha ?? '', ph: 'AAAA-MM-DD HH:MM (opcional)'},
                {k: 'lista', etq: 'Lista', tipo: 'sel', ops: opsLista, valor: t?.lista ?? (l0.id === 'todas' ? opsLista[0][0] : l0.id)},
            ],
            acciones: t ? [{t: 'Eliminar', peligro: true, cb: () => {
                this.datos.tareas = this.datos.tareas.filter(x => x.id !== t.id);
                this._guardar();
            }}] : [],
            cb: v => {
                if (!v.t.trim())
                    return;
                const fecha = fechaTarea(v.fecha.trim()) ? v.fecha.trim() : '';
                if (t) {
                    Object.assign(t, {t: v.t.trim(), prio: +v.prio, fecha, lista: v.lista, notificado: false});
                } else {
                    this.datos.tareas.push({id: nuevoId(), t: v.t.trim(), ok: false, prio: +v.prio, fecha, lista: v.lista, notificado: false});
                }
                this._guardar();
            },
        });
    }

    _guardar() {
        this.guardarDatos();
        this.core.refrescarTipo('recordatorios');
    }

    _pintar() {
        this.box.destroy_all_children();
        const l = this._lista();
        const tareas = this._tareas();
        const pend = this.datos.tareas.filter(t => !t.ok && (l.id === 'todas' || t.lista === l.id)).length;
        const cab = this.fila();
        const izq = this.columna();
        izq.add_child(this.t(l.nombre, 15, {peso: 'bold', c: l.color}));
        cab.add_child(izq);
        cab.add_child(this.t(String(pend), 30, {peso: '300', extra: 'letter-spacing: -1px;'}));
        this.box.add_child(cab);

        const maxFilas = Math.max(1, Math.floor((this.h - this.px(80)) / this.px(32)));
        if (!tareas.length)
            this.box.add_child(this.t('Todo al día ✓', 12, {c: 'texto2', extra: `padding-top: ${this.px(8)}px;`}));
        for (const t of tareas.slice(0, maxFilas)) {
            const f = this.fila(`padding: ${this.px(3)}px 0;`);
            const col = this._colorLista(t);
            const casilla = new St.Button({
                style_class: 'lw-check', can_focus: true, y_align: Clutter.ActorAlign.CENTER,
                style: `border: 2px solid ${col}; ${t.ok ? `background-color: ${col};` : ''} width: ${this.px(16)}px; height: ${this.px(16)}px; border-radius: 99px;`,
            });
            casilla.connect('clicked', () => {
                t.ok = !t.ok;
                this._guardar();
            });
            f.add_child(casilla);
            const c = this.columna();
            const nombre = this.t(`${PRIO[t.prio] ? `${PRIO[t.prio]} ` : ''}${t.t}`, 13, {c: t.ok ? 'texto2' : 'texto', extra: t.ok ? 'text-decoration: line-through;' : ''});
            c.add_child(nombre);
            const fe = fechaTarea(t.fecha);
            if (fe && !t.ok) {
                const vencida = fe < new Date();
                c.add_child(this.t(`${fe.getDate()} ${MESES[fe.getMonth()].slice(0, 3)}${t.fecha.length > 10 ? `, ${t.fecha.slice(11)}` : ''}`, 10, {c: vencida ? 'rojo' : 'texto2'}));
            }
            f.add_child(c);
            const b = this.boton(f, () => this._editar(t), {expand: true});
            this.box.add_child(b);
        }
        this.box.add_child(new St.Widget({y_expand: true}));
        this.box.add_child(this.boton(this.t('＋ Nuevo recordatorio', 12, {c: 'acento', peso: 'bold'}), () => this._editar(null)));
    }
}
