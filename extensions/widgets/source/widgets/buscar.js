import Clutter from 'gi://Clutter';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import St from 'gi://St';

import {WidgetBase} from '../lib/base.js';
import {abrirUri, dispositivosKde, fijarProp, llamar, props} from '../lib/util.js';

export const META = {
    id: 'buscar', nombre: 'Buscar', icono: 'find-location-symbolic',
    desc: 'Encuentra tus dispositivos vinculados con KDE Connect (hacerlos sonar) y comparte tu ubicación solo cuando tú lo autorices.',
    tam: {S: [170, 170], M: [380, 170], L: [380, 380]}, min: [170, 150],
    opciones: [
        {k: 'compartir', t: 'bool', etq: 'Permitir obtener mi ubicación', def: false, ayuda: 'Usa GeoClue. Nada se envía a ningún servidor.'},
    ],
};

async function ubicar() {
    const bus = Gio.DBus.system;
    const D = 'org.freedesktop.GeoClue2';
    const r = await llamar(bus, D, '/org/freedesktop/GeoClue2/Manager', `${D}.Manager`, 'GetClient', null, '(o)');
    const cli = r.recursiveUnpack()[0];
    await fijarProp(bus, D, cli, `${D}.Client`, 'DesktopId', 's', 'org.gnome.Shell');
    await fijarProp(bus, D, cli, `${D}.Client`, 'RequestedAccuracyLevel', 'u', 6);
    return new Promise((res, rej) => {
        let sub = 0;
        let to = 0;
        const fin = (f, v) => {
            if (sub)
                bus.signal_unsubscribe(sub);
            llamar(bus, D, cli, `${D}.Client`, 'Stop').catch(() => {});
            f(v);
        };
        to = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 20, () => {
            to = 0;
            fin(rej, new Error('Tiempo agotado. ¿Servicios de ubicación activados?'));
            return GLib.SOURCE_REMOVE;
        });
        sub = bus.signal_subscribe(D, `${D}.Client`, 'LocationUpdated', cli, null, Gio.DBusSignalFlags.NONE, async (_c, _s, _p, _i, _n, params) => {
            if (to)
                GLib.source_remove(to);
            to = 0;
            try {
                const nuevo = params.recursiveUnpack()[1];
                const l = await props(bus, D, nuevo, `${D}.Location`);
                fin(res, {lat: l.Latitude, lon: l.Longitude, prec: l.Accuracy});
            } catch (e) {
                fin(rej, e);
            }
        });
        llamar(bus, D, cli, `${D}.Client`, 'Start').catch(e => {
            if (to)
                GLib.source_remove(to);
            to = 0;
            fin(rej, e);
        });
    });
}

export class Widget extends WidgetBase {
    construir(box) {
        this.box = box;
        this._disp = null;
        this._loc = null;
        this._msg = '';
        this._pintar();
        this.cada(60 * 1000, () => this._cargar(), true);
    }

    async _cargar() {
        const d = await dispositivosKde();
        if (!this._vivo)
            return;
        this._disp = d;
        this._pintar();
    }

    async _ubicar() {
        this._msg = 'Obteniendo ubicación…';
        this._pintar();
        try {
            this._loc = await ubicar();
            this._msg = '';
        } catch (e) {
            this._msg = `No se pudo ubicar: ${e.message}`;
        }
        if (this._vivo)
            this._pintar();
    }

    _enlace() {
        const {lat, lon} = this._loc;
        return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=16/${lat}/${lon}`;
    }

    _pintar() {
        this.box.destroy_all_children();
        this.box.add_child(this.t('Buscar', 15, {peso: 'bold', extra: `padding-bottom: ${this.px(4)}px;`}));

        const local = this.fila(`padding: ${this.px(3)}px 0;`);
        local.add_child(this.icono('computer-symbolic', 20));
        const c = this.columna();
        c.add_child(this.t(GLib.get_host_name(), 13, {peso: 'bold'}));
        c.add_child(this.t('Este equipo', 11, {c: 'texto2'}));
        local.add_child(c);
        this.box.add_child(local);

        if (this._disp === null) {
            this.box.add_child(this.t('Instala KDE Connect y vincula tu teléfono para verlo aquí.', 11, {c: 'texto2', extra: 'padding-top: 6px;'}));
        } else {
            const n = Math.max(1, Math.floor((this.h - this.px(110)) / this.px(46)));
            for (const d of this._disp.slice(0, n)) {
                const f = this.fila(`padding: ${this.px(3)}px 0;`);
                f.add_child(new St.Widget({style: `width: 8px; height: 8px; border-radius: 4px; background-color: ${d.alcanzable ? this.pal.verde : this.pal.texto2};`, y_align: Clutter.ActorAlign.CENTER}));
                const col = this.columna();
                col.add_child(this.t(d.nombre, 13, {peso: 'bold'}));
                col.add_child(this.t(`${d.alcanzable ? 'Conectado' : 'Sin conexión'}${d.bateria !== null ? ` · ${d.bateria}%` : ''}`, 11, {c: 'texto2'}));
                f.add_child(col);
                if (d.alcanzable) {
                    f.add_child(this.boton(this.t('Sonar', 11, {c: 'acento', peso: 'bold'}), () => {
                        llamar(Gio.DBus.session, 'org.kde.kdeconnect', `${d.ruta}/findmyphone`, 'org.kde.kdeconnect.device.findmyphone', 'ring').catch(() => {
                            this.core.notificar('Buscar', 'El dispositivo no admite «Encontrar mi teléfono».');
                        });
                    }));
                }
                this.box.add_child(f);
            }
            if (!this._disp.length)
                this.box.add_child(this.t('No hay dispositivos vinculados.', 11, {c: 'texto2'}));
        }

        this.box.add_child(new St.Widget({y_expand: true}));
        if (this.h >= 190) {
            if (!this.o.compartir) {
                this.box.add_child(this.t('La ubicación está desactivada. Actívala en Ajustes del widget.', 10, {c: 'texto2'}));
            } else if (this._loc) {
                this.box.add_child(this.t(`📍 ${this._loc.lat.toFixed(4)}, ${this._loc.lon.toFixed(4)} (±${Math.round(this._loc.prec)} m)`, 11, {c: 'texto'}));
                const f = this.fila();
                f.add_child(this.boton(this.t('Copiar enlace', 11, {c: 'acento', peso: 'bold'}), () => St.Clipboard.get_default().set_text(St.ClipboardType.CLIPBOARD, this._enlace())));
                f.add_child(this.boton(this.t('Abrir mapa', 11, {c: 'acento', peso: 'bold'}), () => abrirUri(this._enlace())));
                f.add_child(this.boton(this.t('Actualizar', 11, {c: 'acento'}), () => this._ubicar()));
                this.box.add_child(f);
            } else {
                this.box.add_child(this.boton(this.t(this._msg || 'Obtener mi ubicación', 12, {c: 'acento', peso: 'bold'}), () => this._ubicar()));
            }
        }
    }
}
