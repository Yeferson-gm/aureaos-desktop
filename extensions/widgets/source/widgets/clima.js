import Cairo from 'gi://cairo';
import Clutter from 'gi://Clutter';
import St from 'gi://St';

import {WidgetBase} from '../lib/base.js';
import {http} from '../lib/util.js';

export const META = {
    id: 'clima', nombre: 'Clima', icono: 'weather-few-clouds-symbolic',
    desc: 'Temperatura real, pronóstico por horas y días, humedad, lluvia y viento con sol y nubes animados.',
    tam: {S: [170, 170], M: [380, 170], L: [380, 380]}, min: [150, 140],
    opciones: [
        {k: 'ciudad', t: 'ciudad', etq: 'Ciudad', def: {nombre: 'Lima', lat: -12.0464, lon: -77.0428}},
        {k: 'animacion', t: 'bool', etq: 'Animar sol y nubes', def: true},
        {k: 'horas', t: 'bool', etq: 'Mostrar pronóstico por horas', def: true},
        {k: 'dias', t: 'bool', etq: 'Mostrar pronóstico de varios días', def: true},
    ],
};

function wmo(c) {
    if (c === 0) return ['Despejado', 'sol'];
    if (c === 1) return ['Mayormente despejado', 'sol'];
    if (c === 2) return ['Parcialmente nublado', 'parcial'];
    if (c === 3) return ['Nublado', 'nublado'];
    if (c === 45 || c === 48) return ['Niebla', 'niebla'];
    if (c >= 51 && c <= 57) return ['Llovizna', 'lluvia'];
    if (c >= 61 && c <= 67) return ['Lluvia', 'lluvia'];
    if (c >= 71 && c <= 77) return ['Nieve', 'nieve'];
    if (c >= 80 && c <= 82) return ['Chubascos', 'lluvia'];
    if (c === 85 || c === 86) return ['Nevadas', 'nieve'];
    if (c >= 95) return ['Tormenta', 'tormenta'];
    return ['—', 'nublado'];
}

const TAU = Math.PI * 2;
const DIA3 = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

function sol(cr, cx, cy, r, t) {
    const g = new Cairo.RadialGradient(cx, cy, r * 0.4, cx, cy, r * 2.1);
    g.addColorStopRGBA(0, 1, 0.85, 0.3, 0.6);
    g.addColorStopRGBA(1, 1, 0.85, 0.3, 0);
    cr.setSource(g);
    cr.arc(cx, cy, r * 2.1, 0, TAU);
    cr.fill();
    cr.setLineCap(1);
    cr.setLineWidth(r * 0.15);
    cr.setSourceRGBA(1, 0.82, 0.25, 0.95);
    for (let i = 0; i < 12; i++) {
        const a = i * TAU / 12 + t * 0.35;
        const pulso = 1 + 0.07 * Math.sin(t * 2 + i);
        cr.moveTo(cx + Math.cos(a) * r * 1.38, cy + Math.sin(a) * r * 1.38);
        cr.lineTo(cx + Math.cos(a) * r * 1.78 * pulso, cy + Math.sin(a) * r * 1.78 * pulso);
        cr.stroke();
    }
    const d = new Cairo.LinearGradient(cx, cy - r, cx, cy + r);
    d.addColorStopRGBA(0, 1, 0.9, 0.4, 1);
    d.addColorStopRGBA(1, 1, 0.62, 0.1, 1);
    cr.setSource(d);
    cr.arc(cx, cy, r, 0, TAU);
    cr.fill();
}

function luna(cr, cx, cy, r) {
    cr.setSourceRGBA(0.93, 0.93, 0.97, 1);
    cr.arc(cx, cy, r, 0, TAU);
    cr.fill();
    cr.setSourceRGBA(0.75, 0.76, 0.84, 0.8);
    for (const [dx, dy, rr] of [[-0.3, -0.2, 0.18], [0.25, 0.1, 0.25], [-0.1, 0.4, 0.12]]) {
        cr.arc(cx + dx * r, cy + dy * r, rr * r, 0, TAU);
        cr.fill();
    }
}

function nube(cr, cx, cy, s, tono = 1, alfa = 1) {
    const g = new Cairo.LinearGradient(cx, cy - s * 0.45, cx, cy + s * 0.3);
    g.addColorStopRGBA(0, tono, tono, Math.min(1, tono + 0.02), alfa);
    g.addColorStopRGBA(1, tono * 0.82, tono * 0.84, tono * 0.9, alfa);
    cr.setSource(g);
    cr.arc(cx - s * 0.34, cy, s * 0.24, 0, TAU);
    cr.arc(cx, cy - s * 0.14, s * 0.32, 0, TAU);
    cr.arc(cx + s * 0.34, cy, s * 0.23, 0, TAU);
    cr.fill();
    cr.rectangle(cx - s * 0.34, cy - s * 0.02, s * 0.68, s * 0.24);
    cr.fill();
}

export function dibujarClima(cr, w, h, tipo, t, dia) {
    const s = Math.min(w, h);
    const cx = w / 2;
    const cy = h / 2;
    const drift = Math.sin(t * 0.6) * s * 0.04;
    if (tipo === 'sol') {
        if (dia) sol(cr, cx, cy, s * 0.22, t);
        else luna(cr, cx, cy, s * 0.26);
    } else if (tipo === 'parcial') {
        if (dia) sol(cr, cx - s * 0.12, cy - s * 0.12, s * 0.16, t);
        else luna(cr, cx - s * 0.12, cy - s * 0.12, s * 0.2);
        nube(cr, cx + s * 0.08 + drift, cy + s * 0.1, s * 0.78);
    } else if (tipo === 'nublado') {
        nube(cr, cx - s * 0.12 - drift, cy - s * 0.1, s * 0.62, 0.72);
        nube(cr, cx + s * 0.06 + drift, cy + s * 0.1, s * 0.8, 0.96);
    } else if (tipo === 'niebla') {
        nube(cr, cx, cy - s * 0.12, s * 0.7, 0.88);
        cr.setLineCap(1);
        cr.setLineWidth(s * 0.05);
        cr.setSourceRGBA(1, 1, 1, 0.75);
        for (let i = 0; i < 3; i++) {
            const o = Math.sin(t * 0.8 + i) * s * 0.04;
            cr.moveTo(cx - s * 0.3 + o, cy + s * 0.2 + i * s * 0.1);
            cr.lineTo(cx + s * 0.3 + o, cy + s * 0.2 + i * s * 0.1);
            cr.stroke();
        }
    } else {
        nube(cr, cx, cy - s * 0.14, s * 0.78, tipo === 'tormenta' ? 0.55 : 0.78);
        if (tipo === 'lluvia' || tipo === 'tormenta') {
            cr.setLineCap(1);
            cr.setLineWidth(Math.max(1.2, s * 0.03));
            for (let i = 0; i < 6; i++) {
                const f = (t * 0.9 + i / 6) % 1;
                const x = cx - s * 0.3 + i * s * 0.12 + f * s * 0.04;
                const y = cy + s * 0.08 + f * s * 0.36;
                cr.setSourceRGBA(0.55, 0.78, 1, 1 - f);
                cr.moveTo(x, y);
                cr.lineTo(x - s * 0.03, y + s * 0.09);
                cr.stroke();
            }
        }
        if (tipo === 'nieve') {
            for (let i = 0; i < 7; i++) {
                const f = (t * 0.35 + i / 7) % 1;
                cr.setSourceRGBA(1, 1, 1, 1 - f * 0.8);
                cr.arc(cx - s * 0.32 + i * s * 0.105 + Math.sin(t + i) * s * 0.03, cy + s * 0.1 + f * s * 0.36, s * 0.03, 0, TAU);
                cr.fill();
            }
        }
        if (tipo === 'tormenta' && Math.sin(t * 3.1) > 0.35) {
            cr.setSourceRGBA(1, 0.88, 0.2, 1);
            cr.moveTo(cx + s * 0.04, cy + s * 0.02);
            cr.lineTo(cx - s * 0.1, cy + s * 0.22);
            cr.lineTo(cx - s * 0.01, cy + s * 0.22);
            cr.lineTo(cx - s * 0.07, cy + s * 0.42);
            cr.lineTo(cx + s * 0.12, cy + s * 0.15);
            cr.lineTo(cx + s * 0.02, cy + s * 0.15);
            cr.closePath();
            cr.fill();
        }
    }
}

export class Widget extends WidgetBase {
    construir(box) {
        this.box = box;
        this._t = 0;
        this._areas = [];
        this._pintar();
        this.cada(15 * 60 * 1000, () => this._cargar(), true);
        if (this.o.animacion && this.core.cfg.global.animaciones) {
            this.cada(66, () => {
                this._t += 0.066;
                this._areas.forEach(a => a.queue_repaint());
            });
        }
    }

    async _cargar() {
        const {lat, lon} = this.o.ciudad;
        const f = this.core.cfg.global.unidad === 'F';
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
            '&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,is_day' +
            '&hourly=temperature_2m,weather_code,precipitation_probability' +
            '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max' +
            `&timezone=auto&forecast_days=7${f ? '&temperature_unit=fahrenheit&wind_speed_unit=mph' : ''}`;
        try {
            this._d = JSON.parse(await http(url, {ttl: 10 * 60 * 1000}));
            this._err = null;
        } catch (e) {
            this._err = e.message;
        }
        if (this._vivo)
            this._pintar();
    }

    _icono(tipo, tam, dia, animado = true) {
        const area = new St.DrawingArea({width: tam, height: tam, y_align: Clutter.ActorAlign.CENTER});
        const t0 = animado ? 0 : 0.7;
        area.connect('repaint', () => {
            const cr = area.get_context();
            const [w, h] = area.get_surface_size();
            dibujarClima(cr, w, h, tipo, animado ? this._t : t0, dia);
            cr.$dispose();
        });
        if (animado)
            this._areas.push(area);
        return area;
    }

    _pintar() {
        this.box.destroy_all_children();
        this._areas = [];
        const d = this._d;
        if (!d) {
            this.box.add_child(this.t(this._err ? 'Sin conexión. Reintentando…' : 'Cargando clima…', 13, {c: 'texto2'}));
            return;
        }
        const c = d.current;
        const u = this.core.cfg.global.unidad === 'F' ? '°F' : '°C';
        const vu = this.core.cfg.global.unidad === 'F' ? 'mph' : 'km/h';
        const [desc, tipo] = wmo(c.weather_code);
        const dia = c.is_day === 1;
        const w = this.w;
        const h = this.h;
        const pequeno = w < 250;
        const lluvia = d.daily.precipitation_probability_max?.[0] ?? 0;

        const top = this.fila();
        top.y_expand = false;
        const izq = this.columna();
        izq.add_child(this.t(this.o.ciudad.nombre, 14, {peso: 'bold'}));
        izq.add_child(this.t(`${Math.round(c.temperature_2m)}°`, pequeno ? 44 : 52, {peso: '200', extra: 'letter-spacing: -1px;'}));
        izq.add_child(this.t(desc, 12, {c: 'texto2'}));
        if (!pequeno || h > 150) {
            izq.add_child(this.t(`Máx ${Math.round(d.daily.temperature_2m_max[0])}°  Mín ${Math.round(d.daily.temperature_2m_min[0])}°`, 12, {c: 'texto2'}));
        }
        top.add_child(izq);
        top.add_child(this._icono(tipo, this.px(pequeno ? 64 : 92), dia));
        this.box.add_child(top);

        if (h >= 250 || (w >= 330 && h >= 190)) {
            const det = this.fila(`padding-top: ${this.px(2)}px;`);
            for (const [k, v] of [['Humedad', `${c.relative_humidity_2m}%`], ['Lluvia', `${lluvia}%`],
                ['Viento', `${Math.round(c.wind_speed_10m)} ${vu}`], ['Sensación', `${Math.round(c.apparent_temperature)}°`]]) {
                const col = this.columna();
                col.add_child(this.t(k, 10, {c: 'texto2'}));
                col.add_child(this.t(v, 13, {peso: 'bold'}));
                det.add_child(col);
            }
            this.box.add_child(det);
        }
        if (this.o.horas && h >= 235) {
            this.box.add_child(new St.Widget({style: `height: 1px; background-color: ${this.pal.sep}; margin: ${this.px(6)}px 0;`, x_expand: true}));
            const hs = this.fila();
            const ini = Math.max(0, d.hourly.time.findIndex(x => x >= `${c.time.slice(0, 13)}:00`));
            const n = Math.max(3, Math.min(8, Math.floor(w / this.px(52))));
            for (let i = 0; i < n; i++) {
                const k = ini + i;
                if (k >= d.hourly.time.length)
                    break;
                const hora = parseInt(d.hourly.time[k].slice(11, 13), 10);
                const col = new St.BoxLayout({vertical: true, x_expand: true, style: 'spacing: 3px;'});
                col.add_child(this.t(i === 0 ? 'Ahora' : `${hora}h`, 10, {c: 'texto2', align: Clutter.ActorAlign.CENTER}));
                col.add_child(this._icono(wmo(d.hourly.weather_code[k])[1], this.px(26), hora >= 6 && hora < 18, false));
                col.add_child(this.t(`${Math.round(d.hourly.temperature_2m[k])}°`, 12, {peso: 'bold', align: Clutter.ActorAlign.CENTER}));
                hs.add_child(col);
            }
            this.box.add_child(hs);
        }
        if (this.o.dias && h >= 330) {
            this.box.add_child(new St.Widget({style: `height: 1px; background-color: ${this.pal.sep}; margin: ${this.px(6)}px 0;`, x_expand: true}));
            const gmin = Math.min(...d.daily.temperature_2m_min);
            const gmax = Math.max(...d.daily.temperature_2m_max);
            const filas = Math.min(7, Math.floor((h - this.px(250)) / this.px(24)) + 1);
            for (let i = 0; i < Math.max(3, filas); i++) {
                if (!d.daily.time[i])
                    break;
                const f = this.fila();
                const nombre = i === 0 ? 'Hoy' : DIA3[new Date(`${d.daily.time[i]}T12:00:00`).getDay()];
                const l = this.t(nombre, 12, {c: 'texto'});
                l.width = this.px(38);
                f.add_child(l);
                f.add_child(this._icono(wmo(d.daily.weather_code[i])[1], this.px(22), true, false));
                const mn = Math.round(d.daily.temperature_2m_min[i]);
                const mx = Math.round(d.daily.temperature_2m_max[i]);
                f.add_child(this.t(`${mn}°`, 12, {c: 'texto2'}));
                const rango = new St.Widget({x_expand: true, y_align: Clutter.ActorAlign.CENTER, style: `height: 4px; border-radius: 2px; background-color: ${this.pal.superficie};`, layout_manager: new Clutter.BinLayout()});
                const pIni = (d.daily.temperature_2m_min[i] - gmin) / Math.max(1, gmax - gmin);
                const pFin = (d.daily.temperature_2m_max[i] - gmin) / Math.max(1, gmax - gmin);
                const barra = new St.Widget({style: `height: 4px; border-radius: 2px; background-color: ${this.pal.naranja}; margin-left: ${Math.round(pIni * 60)}px; width: ${Math.max(8, Math.round((pFin - pIni) * 60))}px;`, x_align: Clutter.ActorAlign.START, y_align: Clutter.ActorAlign.CENTER});
                rango.add_child(barra);
                f.add_child(rango);
                f.add_child(this.t(`${mx}°`, 12, {peso: 'bold'}));
                this.box.add_child(f);
            }
        }
        this.box.add_child(new St.Widget({y_expand: true}));
        if (h >= 300 || (w >= 330 && h >= 190)) {
            // sin pie
        }
        void u;
    }
}
