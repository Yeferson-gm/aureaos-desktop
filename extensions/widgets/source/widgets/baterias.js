import Clutter from 'gi://Clutter';
import Gio from 'gi://Gio';
import St from 'gi://St';

import {WidgetBase} from '../lib/base.js';
import {dispositivosKde, fmtDur, llamar, props} from '../lib/util.js';

export const META = {
    id: 'baterias', nombre: 'Baterías', icono: 'battery-good-symbolic',
    desc: 'Porcentaje, tiempo estimado y carga de tu equipo y de los dispositivos compatibles (UPower y KDE Connect).',
    tam: {S: [170, 170], M: [380, 170], L: [380, 380]}, min: [130, 130],
    opciones: [
        {k: 'kde', t: 'bool', etq: 'Incluir teléfonos de KDE Connect', def: true},
        {k: 'tiempo', t: 'bool', etq: 'Mostrar tiempo estimado', def: true},
    ],
};

const TIPOS = {2: 'Batería del equipo', 3: 'SAI (UPS)', 5: 'Ratón', 6: 'Teclado', 7: 'PDA', 8: 'Teléfono', 9: 'Reproductor',
    10: 'Tableta', 12: 'Mando', 13: 'Lápiz', 14: 'Panel táctil', 17: 'Auriculares', 18: 'Altavoces', 19: 'Auriculares',
    22: 'Control remoto', 26: 'Reloj', 28: 'Dispositivo Bluetooth'};

async function leerUPower() {
    const bus = Gio.DBus.system;
    const r = await llamar(bus, 'org.freedesktop.UPower', '/org/freedesktop/UPower', 'org.freedesktop.UPower', 'EnumerateDevices', null, '(ao)');
    const out = [];
    for (const p of r.recursiveUnpack()[0]) {
        try {
            const d = await props(bus, 'org.freedesktop.UPower', p, 'org.freedesktop.UPower.Device');
            if (d.Type === 1 || d.Type === 4 || !d.IsPresent)
                continue;
            if (d.Type !== 2 && !(d.Percentage > 0))
                continue;
            out.push({
                nombre: d.Model || TIPOS[d.Type] || 'Dispositivo', tipo: TIPOS[d.Type] ?? 'Dispositivo',
                pct: Math.round(d.Percentage), estado: d.State, vaciar: Number(d.TimeToEmpty), llenar: Number(d.TimeToFull),
                principal: d.Type === 2,
            });
        } catch (_e) {

        }
    }
    return out.sort((a, b) => Number(b.principal) - Number(a.principal));
}

export class Widget extends WidgetBase {
    construir(box) {
        this.box = box;
        this._lista = null;
        this._pintar();
        this.cada(30 * 1000, () => this._cargar(), true);
    }

    async _cargar() {
        let lista = [];
        try {
            lista = await leerUPower();
        } catch (_e) {

        }
        if (this.o.kde) {
            const k = await dispositivosKde();
            for (const d of k ?? []) {
                if (d.bateria !== null && d.alcanzable)
                    lista.push({nombre: d.nombre, tipo: 'KDE Connect', pct: d.bateria, estado: d.cargando ? 1 : 2, vaciar: 0, llenar: 0, principal: false});
            }
        }
        if (!this._vivo)
            return;
        this._lista = lista;
        this._pintar();
    }

    _color(d) {
        if (d.estado === 1 || d.estado === 4)
            return [0.19, 0.82, 0.35];
        return d.pct <= 10 ? [1, 0.27, 0.23] : (d.pct <= 20 ? [1, 0.62, 0.04] : [0.19, 0.82, 0.35]);
    }

    _anillo(d, tam) {
        const area = new St.DrawingArea({width: tam, height: tam, y_align: Clutter.ActorAlign.CENTER, x_align: Clutter.ActorAlign.CENTER});
        const [tr, tg, tb] = this.pal.rgb.texto;
        area.connect('repaint', () => {
            const cr = area.get_context();
            const [w, h] = area.get_surface_size();
            const R = Math.min(w, h) / 2 - 4;
            cr.translate(w / 2, h / 2);
            cr.setLineWidth(Math.max(4, R * 0.18));
            cr.setLineCap(1);
            cr.setSourceRGBA(tr, tg, tb, 0.16);
            cr.arc(0, 0, R, 0, Math.PI * 2);
            cr.stroke();
            cr.setSourceRGBA(...this._color(d), 1);
            cr.arc(0, 0, R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * d.pct / 100);
            cr.stroke();
            if (d.estado === 1) {
                cr.setSourceRGBA(tr, tg, tb, 0.95);
                cr.moveTo(R * 0.1, -R * 0.62);
                cr.lineTo(-R * 0.22, R * 0.04);
                cr.lineTo(R * 0.0, R * 0.04);
                cr.lineTo(-R * 0.1, R * 0.62);
                cr.lineTo(R * 0.22, -R * 0.06);
                cr.lineTo(R * 0.0, -R * 0.06);
                cr.closePath();
                cr.fill();
            } else {

                cr.setSourceRGBA(tr, tg, tb, 0.95);
                cr.setLineWidth(Math.max(1.5, R * 0.07));
                cr.setLineJoin(1);
                cr.rectangle(-R * 0.48, -R * 0.24, R * 0.88, R * 0.48);
                cr.stroke();
                cr.rectangle(R * 0.43, -R * 0.10, R * 0.10, R * 0.20);
                cr.fill();
                const carga = Math.max(0, Math.min(1, d.pct / 100));
                cr.rectangle(-R * 0.38, -R * 0.14, R * 0.68 * carga, R * 0.28);
                cr.fill();
            }
            cr.$dispose();
        });
        return area;
    }

    _estado(d) {
        if (d.estado === 4) return 'Cargada';
        if (d.estado === 1) return this.o.tiempo && d.llenar > 0 ? `Cargando · ${fmtDur(d.llenar)}` : 'Cargando';
        return this.o.tiempo && d.vaciar > 0 ? `${fmtDur(d.vaciar)} restantes` : 'En uso';
    }

    _pintar() {
        this.box.destroy_all_children();
        if (!this._lista) {
            this.box.add_child(this.t('Leyendo baterías…', 13, {c: 'texto2'}));
            return;
        }
        if (!this._lista.length) {
            const c = new St.BoxLayout({vertical: true, x_expand: true, y_expand: true, y_align: Clutter.ActorAlign.CENTER, style: 'spacing: 6px;'});
            c.add_child(this.icono('battery-full-charged-symbolic', 34, 'texto2'));
            c.add_child(this.t('Conectado a la corriente', 14, {peso: 'bold', align: Clutter.ActorAlign.CENTER}));
            c.add_child(this.t('Este equipo no tiene batería', 11, {c: 'texto2', align: Clutter.ActorAlign.CENTER}));
            this.box.add_child(c);
            return;
        }
        const lista = this._lista;
        if (this.h < 220 && this.w < 250) {
            const d = lista[0];
            const c = new St.BoxLayout({vertical: true, x_expand: true, y_expand: true, y_align: Clutter.ActorAlign.CENTER, style: 'spacing: 4px;'});
            const a = this._anillo(d, Math.min(this.w, this.h) - this.px(46));
            a.x_expand = true;
            c.add_child(a);
            c.add_child(this.t(`${d.pct}%`, 22, {peso: '300', align: Clutter.ActorAlign.CENTER}));
            c.add_child(this.t(d.nombre, 11, {c: 'texto2', align: Clutter.ActorAlign.CENTER}));
            this.box.add_child(c);
            return;
        }
        if (this.h < 250) {
            const fila = this.fila();
            fila.y_expand = true;
            const n = Math.max(1, Math.floor(this.w / this.px(88)));
            for (const d of lista.slice(0, n)) {
                const c = new St.BoxLayout({vertical: true, x_expand: true, y_align: Clutter.ActorAlign.CENTER, style: 'spacing: 4px;'});
                c.add_child(this._anillo(d, this.px(64)));
                c.add_child(this.t(`${d.pct}%`, 16, {peso: 'bold', align: Clutter.ActorAlign.CENTER}));
                c.add_child(this.t(d.nombre, 10, {c: 'texto2', align: Clutter.ActorAlign.CENTER}));
                fila.add_child(c);
            }
            this.box.add_child(fila);
            return;
        }
        this.box.add_child(this.t('Baterías', 14, {peso: 'bold', extra: 'padding-bottom: 6px;'}));
        for (const d of lista.slice(0, Math.floor((this.h - 30) / this.px(58)))) {
            const f = this.fila(`padding: ${this.px(5)}px 0;`);
            f.add_child(this._anillo(d, this.px(44)));
            const c = this.columna();
            c.y_align = Clutter.ActorAlign.CENTER;
            c.add_child(this.t(d.nombre, 13, {peso: 'bold'}));
            c.add_child(this.t(`${d.tipo} · ${this._estado(d)}`, 11, {c: 'texto2'}));
            f.add_child(c);
            f.add_child(this.t(`${d.pct}%`, 18, {peso: '300'}));
            this.box.add_child(f);
        }
    }
}
