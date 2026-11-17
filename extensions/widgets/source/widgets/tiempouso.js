import Clutter from 'gi://Clutter';
import GLib from 'gi://GLib';
import Shell from 'gi://Shell';
import St from 'gi://St';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';

import {WidgetBase} from '../lib/base.js';
import {fmtDur, iso} from '../lib/util.js';

export const META = {
    id: 'tiempouso', nombre: 'Tiempo de uso', icono: 'preferences-system-time-symbolic',
    desc: 'Horas frente a la pantalla, aplicaciones más usadas y estadísticas de la semana. Todo queda en tu equipo.',
    tam: {S: [170, 170], M: [380, 170], L: [380, 380]}, min: [150, 130],
    opciones: [
        {k: 'periodo', t: 'sel', etq: 'Periodo de las apps', ops: [['hoy', 'Hoy'], ['semana', '7 días']], def: 'hoy'},
    ],
};


export function servicio(core) {
    const PASO = 5;
    const tracker = Shell.WindowTracker.get_default();
    let sucio = 0;
    const id = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, PASO, () => {
        if (!core.cfg.global.rastrear)
            return GLib.SOURCE_CONTINUE;
        let inactivo = 0;
        try {
            inactivo = global.backend.get_core_idle_monitor().get_idletime();
        } catch (_e) {
            inactivo = 0;
        }
        const app = tracker.focus_app;
        if (!app || inactivo > 120000 || Main.screenShield?.locked)
            return GLib.SOURCE_CONTINUE;
        const dias = core.uso.datos.dias;
        const dia = (dias[iso(new Date())] ??= {});
        const k = app.get_id() ?? app.get_name();
        const e = (dia[k] ??= {n: app.get_name(), s: 0});
        e.s += PASO;
        if (++sucio >= 12) {
            sucio = 0;
            for (const f of Object.keys(dias)) {
                if (Date.now() - new Date(f).getTime() > 60 * 864e5)
                    delete dias[f];
            }
            core.uso.guardar();
        }
        return GLib.SOURCE_CONTINUE;
    });
    return {detener: () => GLib.source_remove(id)};
}

const INI = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

export class Widget extends WidgetBase {
    construir(box) {
        this.box = box;
        this._pintar();
        this.cada(30 * 1000, () => this._pintar());
    }

    _total(d) {
        return Object.values(d ?? {}).reduce((s, x) => s + x.s, 0);
    }

    _pintar() {
        this.box.destroy_all_children();
        const dias = this.core.uso.datos.dias;
        const hoy = new Date();
        const claves = [];
        for (let i = 6; i >= 0; i--)
            claves.push(new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - i));
        const tot = claves.map(d => this._total(dias[iso(d)]));
        const totHoy = tot[6];

        const cab = this.columna();
        cab.add_child(this.t('Tiempo de uso', 12, {c: 'texto2'}));
        cab.add_child(this.t(totHoy ? fmtDur(totHoy) : '0 min', this.h < 200 ? 24 : 30, {peso: '300', extra: 'letter-spacing: -1px;'}));
        const prom = tot.reduce((a, b) => a + b, 0) / 7;
        if (this.h >= 150)
            cab.add_child(this.t(`Promedio diario: ${fmtDur(prom)}`, 11, {c: 'texto2'}));
        this.box.add_child(cab);

        const cuerpo = this.fila();
        cuerpo.y_expand = true;
        const maxT = Math.max(1, ...tot);
        const altoMax = this.px(this.h >= 250 ? 80 : 54);
        const graf = new St.BoxLayout({style: 'spacing: 5px;', y_align: Clutter.ActorAlign.END, x_expand: this.w < 330});
        tot.forEach((s, i) => {
            const col = new St.BoxLayout({orientation: Clutter.Orientation.VERTICAL, style: 'spacing: 3px;', y_align: Clutter.ActorAlign.END});
            col.add_child(new St.Widget({
                style: `width: ${this.px(this.w < 330 ? 16 : 20)}px; height: ${Math.max(3, Math.round(s / maxT * altoMax))}px; border-radius: 4px; background-color: ${i === 6 ? this.pal.acento : this.pal.superficie};`,
                x_align: Clutter.ActorAlign.CENTER,
            }));
            col.add_child(this.t(INI[claves[i].getDay()], 10, {c: i === 6 ? 'acento' : 'texto2', align: Clutter.ActorAlign.CENTER}));
            graf.add_child(col);
        });
        cuerpo.add_child(graf);

        if (this.w >= 330 || this.h >= 250) {
            const acum = {};
            const rango = this.o.periodo === 'hoy' ? [claves[6]] : claves;
            for (const d of rango) {
                for (const [k, v] of Object.entries(dias[iso(d)] ?? {})) {
                    const a = (acum[k] ??= {n: v.n, s: 0});
                    a.s += v.s;
                }
            }
            const top = Object.entries(acum).sort((a, b) => b[1].s - a[1].s);
            const col = this.columna();
            col.x_expand = true;
            const n = Math.max(2, Math.floor((this.h - this.px(this.h >= 250 ? 190 : 80)) / this.px(30)) + (this.h >= 250 ? 0 : 1));
            const tmax = top[0]?.[1].s ?? 1;
            for (const [k, v] of top.slice(0, this.h >= 250 ? Math.max(n, 4) : 3)) {
                const f = this.fila();
                const app = Shell.AppSystem.get_default().lookup_app(k);
                const ic = app ? new St.Icon({gicon: app.get_icon(), icon_size: this.px(20), y_align: Clutter.ActorAlign.CENTER})
                    : this.icono('application-x-executable-symbolic', 20, 'texto2');
                f.add_child(ic);
                const c = this.columna();
                const l = new St.BoxLayout({x_expand: true});
                l.add_child(this.t(v.n, 11, {peso: 'bold', expand: true}));
                l.add_child(this.t(fmtDur(v.s), 10, {c: 'texto2'}));
                c.add_child(l);
                c.add_child(new St.Widget({style: `height: 3px; border-radius: 2px; width: ${Math.max(4, Math.round(v.s / tmax * this.px(this.w >= 330 ? 150 : 200)))}px; background-color: ${this.pal.acento};`, x_align: Clutter.ActorAlign.START}));
                f.add_child(c);
                col.add_child(f);
            }
            if (!top.length)
                col.add_child(this.t('Aún sin datos: empieza a usar tus apps.', 11, {c: 'texto2'}));
            if (this.h >= 250)
                this.box.add_child(this.t(this.o.periodo === 'hoy' ? 'Apps más usadas hoy' : 'Apps más usadas (7 días)', 11, {c: 'texto2', extra: 'padding-top: 6px;'}));
            if (this.h >= 250)
                this.box.add_child(col);
            else
                cuerpo.add_child(col);
        }
        this.box.add_child(cuerpo);
    }
}
