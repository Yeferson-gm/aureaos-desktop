import Cairo from 'gi://cairo';
import Clutter from 'gi://Clutter';
import GLib from 'gi://GLib';
import St from 'gi://St';

import {WidgetBase} from '../lib/base.js';
import {DIAS, MESES, rgb01} from '../lib/util.js';

export const META = {
    id: 'reloj', nombre: 'Reloj', icono: 'preferences-system-time-symbolic',
    desc: 'Analógico, digital o mundial, con segundos, segundero suave y varias esferas.',
    tam: {S: [170, 170], M: [380, 170], L: [380, 380]}, min: [110, 110],
    opciones: [
        {k: 'estilo', t: 'sel', etq: 'Tipo de reloj', ops: [['analogico', 'Analógico'], ['digital', 'Digital'], ['mundial', 'Mundial']], def: 'analogico'},
        {k: 'esfera', t: 'sel', etq: 'Esfera analógica', ops: [['clasica', 'Clásica'], ['minimal', 'Minimal'], ['oscura', 'Oscura'], ['acento', 'Color']], def: 'clasica'},
        {k: 'segundos', t: 'bool', etq: 'Mostrar segundos', def: true},
        {k: 'barrido', t: 'bool', etq: 'Segundero con barrido suave', def: false},
        {k: 'h24', t: 'bool', etq: 'Formato de 24 horas', def: true},
        {k: 'zona', t: 'texto', etq: 'Zona horaria', ph: 'America/Lima (vacío = local)', def: ''},
        {k: 'zonas', t: 'texto', etq: 'Zonas del reloj mundial', ph: 'America/Lima,Europe/Madrid,Asia/Tokyo', def: 'America/Lima,Europe/Madrid,Asia/Tokyo,America/New_York', ayuda: 'Nombres IANA separados por coma.'},
    ],
};

function zona(id) {
    if (!id || !id.trim())
        return GLib.TimeZone.new_local();
    try {
        return GLib.TimeZone.new_identifier(id.trim()) ?? GLib.TimeZone.new_local();
    } catch (_e) {
        return GLib.TimeZone.new_local();
    }
}

const ahora = tz => GLib.DateTime.new_now(tz);

export class Widget extends WidgetBase {
    construir(box) {
        const tipo = this.o.estilo;
        if (tipo === 'digital')
            this._digital(box);
        else if (tipo === 'mundial')
            this._mundial(box);
        else
            this._analogico(box);
    }

    _analogico(box) {
        const tz = zona(this.o.zona);
        const lado = Math.max(60, Math.min(this.w, this.h));
        const area = new St.DrawingArea({width: lado, height: lado, x_expand: true, y_expand: true, x_align: Clutter.ActorAlign.CENTER, y_align: Clutter.ActorAlign.CENTER});
        const e = this.o.esfera;
        const acento = this.pal.rgb.acento;
        const cfg = {
            clasica: {fondo: [0.95, 0.95, 0.96], tinta: [0.1, 0.1, 0.11], num: true},
            oscura: {fondo: [0.11, 0.11, 0.12], tinta: [0.96, 0.96, 0.97], num: true},
            acento: {fondo: acento, tinta: [1, 1, 1], num: true},
            minimal: {fondo: null, tinta: this.pal.rgb.texto, num: false},
        }[e] ?? {fondo: [0.95, 0.95, 0.96], tinta: [0.1, 0.1, 0.11], num: true};
        area.connect('repaint', () => {
            const cr = area.get_context();
            const [w, h] = area.get_surface_size();
            const R = Math.min(w, h) / 2 - 2;
            const d = ahora(tz);
            cr.translate(w / 2, h / 2);
            if (cfg.fondo) {
                cr.setSourceRGBA(...cfg.fondo, 1);
                cr.arc(0, 0, R, 0, Math.PI * 2);
                cr.fill();
            }
            cr.setLineCap(1);
            const [tr, tg, tb] = cfg.tinta;
            for (let i = 0; i < 60; i++) {
                const grande = i % 5 === 0;
                const a = i * Math.PI / 30;
                cr.setSourceRGBA(tr, tg, tb, grande ? 0.95 : 0.4);
                cr.setLineWidth(grande ? R * 0.035 : R * 0.015);
                const r1 = R * (grande ? 0.82 : 0.88);
                cr.moveTo(Math.sin(a) * r1, -Math.cos(a) * r1);
                cr.lineTo(Math.sin(a) * R * 0.94, -Math.cos(a) * R * 0.94);
                cr.stroke();
            }
            if (cfg.num && R > 55) {
                cr.selectFontFace('Sans', 0, 0);
                cr.setFontSize(R * 0.16);
                cr.setSourceRGBA(tr, tg, tb, 1);
                for (let n = 1; n <= 12; n++) {
                    const a = n * Math.PI / 6;
                    const x = Math.sin(a) * R * 0.66;
                    const y = -Math.cos(a) * R * 0.66;
                    const ext = cr.textExtents(String(n));
                    cr.moveTo(x - ext.width / 2 - ext.xBearing, y - ext.height / 2 - ext.yBearing);
                    cr.showText(String(n));
                }
            }
            const seg = d.get_second() + (this.o.barrido ? d.get_microsecond() / 1e6 : 0);
            const min = d.get_minute() + seg / 60;
            const hor = (d.get_hour() % 12) + min / 60;
            const mano = (ang, largo, grosor, cola = 0) => {
                cr.save();
                cr.rotate(ang);
                cr.setLineWidth(grosor);
                cr.moveTo(0, cola);
                cr.lineTo(0, -largo);
                cr.stroke();
                cr.restore();
            };
            cr.setSourceRGBA(tr, tg, tb, 1);
            mano(hor * Math.PI / 6, R * 0.48, R * 0.07, R * 0.08);
            mano(min * Math.PI / 30, R * 0.72, R * 0.045, R * 0.08);
            if (this.o.segundos) {
                cr.setSourceRGBA(1, 0.62, 0.04, 1);
                mano(seg * Math.PI / 30, R * 0.8, R * 0.018, R * 0.18);
                cr.arc(0, 0, R * 0.045, 0, Math.PI * 2);
                cr.fill();
            }
            cr.setSourceRGBA(tr, tg, tb, 1);
            cr.arc(0, 0, R * 0.025, 0, Math.PI * 2);
            cr.fill();
            cr.$dispose();
        });
        box.add_child(area);
        this.cada(this.o.segundos && this.o.barrido ? 50 : 1000, () => area.queue_repaint());
    }

    _digital(box) {
        const tz = zona(this.o.zona);
        const tam = Math.min(this.w / 3.6, this.h * 0.5);
        const centro = {align: Clutter.ActorAlign.CENTER};
        const col = new St.BoxLayout({vertical: true, x_expand: true, y_expand: true, y_align: Clutter.ActorAlign.CENTER, style: 'spacing: 2px;'});
        const hora = this.t('', 10, {peso: '200', align: centro.align, extra: `font-size: ${Math.round(tam)}px; letter-spacing: -2px;`});
        const fecha = this.t('', 13, {c: 'texto2', align: centro.align});
        col.add_child(hora);
        col.add_child(fecha);
        box.add_child(col);
        const act = () => {
            const d = ahora(tz);
            const f = this.o.h24 ? '%H:%M' : '%I:%M';
            let s = d.format(f);
            if (!this.o.h24 && s.startsWith('0'))
                s = s.slice(1);
            if (this.o.segundos)
                s += d.format(':%S');
            hora.text = s;
            fecha.text = `${DIAS[d.get_day_of_week() % 7]}, ${d.get_day_of_month()} de ${MESES[d.get_month() - 1]}${this.o.h24 ? '' : `  ${d.format('%p')}`}`;
        };
        this.cada(1000, act, true);
    }

    _mundial(box) {
        const ids = this.o.zonas.split(',').map(s => s.trim()).filter(Boolean);
        const max = Math.max(2, Math.floor(this.h / this.px(44)));
        const filas = [];
        for (const id of ids.slice(0, max)) {
            const f = this.fila(`padding: ${this.px(5)}px 0; border-bottom: 1px solid ${this.pal.sep};`);
            const izq = this.columna();
            const nombre = id.split('/').pop().replace(/_/g, ' ');
            izq.add_child(this.t(nombre, 14, {peso: 'bold'}));
            const sub = this.t('', 11, {c: 'texto2'});
            izq.add_child(sub);
            const t = this.t('', 24, {peso: '300'});
            f.add_child(izq);
            f.add_child(t);
            box.add_child(f);
            filas.push({tz: zona(id), sub, t});
        }
        const act = () => {
            const loc = GLib.DateTime.new_now_local();
            for (const f of filas) {
                const d = ahora(f.tz);
                let s = d.format(this.o.h24 ? '%H:%M' : '%I:%M %p');
                if (!this.o.h24 && s.startsWith('0'))
                    s = s.slice(1);
                f.t.text = s;
                const dif = Math.round((d.get_utc_offset() - loc.get_utc_offset()) / 3.6e9 * 2) / 2;
                const dd = d.get_day_of_month() - loc.get_day_of_month();
                const dia = dd === 0 ? 'Hoy' : (dd > 0 || dd < -20 ? 'Mañana' : 'Ayer');
                f.sub.text = `${dia}, ${dif >= 0 ? '+' : ''}${dif} h`;
            }
        };
        this.cada(1000, act, true);
    }
}
void rgb01;
void Cairo;
