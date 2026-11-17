import Clutter from 'gi://Clutter';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import St from 'gi://St';

import {WidgetBase} from '../lib/base.js';
import {Hoja, boton, campo, etiqueta, pedir} from '../lib/hoja.js';
import {abrirUri, nuevoId, uriDe} from '../lib/util.js';

export const META = {
    id: 'contactos', nombre: 'Contactos', icono: 'avatar-default-symbolic',
    desc: 'Lista de contactos con fotos, teléfonos, cumpleaños y búsqueda rápida. Importa archivos .vcf.',
    tam: {S: [170, 170], M: [380, 170], L: [380, 380]}, min: [150, 130],
    opciones: [
        {k: 'vcf', t: 'texto', etq: 'Importar vCard (.vcf o carpeta)', ph: '/home/usuario/contactos.vcf', def: '', ayuda: 'Se importa al abrir el widget; los repetidos se omiten.'},
    ],
};

const TONOS = ['#ff453a', '#ff9f0a', '#30d158', '#0a84ff', '#bf5af2', '#ff375f', '#64d2ff'];
const tono = n => TONOS[[...n].reduce((a, c) => a + c.charCodeAt(0), 0) % TONOS.length];
const iniciales = n => n.split(/\s+/).filter(Boolean).slice(0, 2).map(x => x[0].toUpperCase()).join('');

function parsearVcf(txt) {
    const out = [];
    const t = txt.replace(/\r?\n[ \t]/g, '');
    for (const blk of t.split(/BEGIN:VCARD/i).slice(1)) {
        const g = r => blk.match(r)?.[1]?.trim() ?? '';
        const nombre = g(/^FN[^:\n]*:(.*)$/im);
        if (!nombre)
            continue;
        const bd = g(/^BDAY[^:\n]*:(.*)$/im).replace(/-/g, '');
        out.push({
            id: nuevoId(), nombre, tel: g(/^TEL[^:\n]*:(.*)$/im), email: g(/^EMAIL[^:\n]*:(.*)$/im),
            cumple: bd.length >= 8 ? `${bd.slice(0, 4)}-${bd.slice(4, 6)}-${bd.slice(6, 8)}` : '', foto: '', nota: '',
        });
    }
    return out;
}

function importar(ruta, existentes) {
    const nuevos = [];
    const leer = p => {
        try {
            const [ok, b] = GLib.file_get_contents(p);
            if (ok)
                nuevos.push(...parsearVcf(new TextDecoder().decode(b)));
        } catch (_e) {

        }
    };
    try {
        const f = Gio.File.new_for_path(ruta);
        if (f.query_file_type(0, null) === Gio.FileType.DIRECTORY) {
            const en = f.enumerate_children('standard::name', 0, null);
            let i;
            while ((i = en.next_file(null)) !== null) {
                if (i.get_name().toLowerCase().endsWith('.vcf'))
                    leer(GLib.build_filenamev([ruta, i.get_name()]));
            }
        } else {
            leer(ruta);
        }
    } catch (_e) {

    }
    const tiene = new Set(existentes.map(c => c.nombre.toLowerCase()));
    return nuevos.filter(c => !tiene.has(c.nombre.toLowerCase()));
}

export class Widget extends WidgetBase {
    construir(box) {
        this.box = box;
        if (this.o.vcf?.trim()) {
            const n = importar(this.o.vcf.trim(), this.datos.contactos);
            if (n.length) {
                this.datos.contactos.push(...n);
                this.guardarDatos();
            }
        }
        this._pintar();
    }

    _avatar(c, tam) {
        const a = new St.Widget({
            layout_manager: new Clutter.BinLayout(), width: tam, height: tam,
            style: `border-radius: 99px; background-color: ${tono(c.nombre)};` +
                (c.foto ? ` background-image: url("${uriDe(c.foto)}"); background-size: cover;` : ''),
        });
        if (!c.foto) {
            a.add_child(new St.Label({text: iniciales(c.nombre), x_align: Clutter.ActorAlign.CENTER, y_align: Clutter.ActorAlign.CENTER, x_expand: true, y_expand: true, style: `color: #fff; font-weight: bold; font-size: ${Math.round(tam * 0.38)}px;`}));
        }
        return a;
    }

    _ordenados() {
        return [...this.datos.contactos].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', {sensitivity: 'base'}));
    }

    _pintar() {
        this.box.destroy_all_children();
        const cab = this.fila();
        cab.add_child(this.t('Contactos', 15, {peso: 'bold', expand: true}));
        cab.add_child(this.boton(this.icono('edit-find-symbolic', 15, 'texto2'), () => this._gestor()));
        cab.add_child(this.boton(this.icono('list-add-symbolic', 15, 'texto2'), () => this._editar(null, () => {})));
        this.box.add_child(cab);
        const lista = this._ordenados();
        if (!lista.length) {
            this.box.add_child(this.t('Sin contactos. Toca + o importa un .vcf desde Ajustes.', 11, {c: 'texto2', extra: 'padding-top: 6px;'}));
            return;
        }
        const tam = this.px(48);
        const cols = Math.max(1, Math.floor(this.w / (tam + this.px(14))));
        const filas = Math.max(1, Math.floor((this.h - this.px(34)) / (tam + this.px(30))));
        const cuad = new St.Widget({layout_manager: new Clutter.GridLayout({column_homogeneous: true}), x_expand: true, y_expand: true});
        lista.slice(0, cols * filas).forEach((c, i) => {
            const col = new St.BoxLayout({orientation: Clutter.Orientation.VERTICAL, x_align: Clutter.ActorAlign.CENTER, style: 'spacing: 3px;'});
            const av = this._avatar(c, tam);
            av.x_align = Clutter.ActorAlign.CENTER;
            col.add_child(av);
            col.add_child(this.t(c.nombre.split(' ')[0], 11, {align: Clutter.ActorAlign.CENTER}));
            cuad.layout_manager.attach(this.boton(col, () => this._detalle(c), {expand: true}), i % cols, Math.floor(i / cols), 1, 1);
        });
        this.box.add_child(cuad);
    }

    _detalle(c) {
        const h = new Hoja(this.core, {titulo: c.nombre, ancho: 420});
        const av = this._avatar(c, 84);
        av.x_align = Clutter.ActorAlign.CENTER;
        h.cuerpo.add_child(av);
        for (const [k, v] of [['Teléfono', c.tel], ['Correo', c.email], ['Cumpleaños', c.cumple], ['Nota', c.nota]]) {
            if (v) {
                const f = new St.BoxLayout({style: 'spacing: 10px;'});
                f.add_child(etiqueta(k, 'lintel-ayuda', {width: 90}));
                f.add_child(etiqueta(v, 'lintel-lbl', {x_expand: true}));
                h.cuerpo.add_child(f);
            }
        }
        const pie = new St.BoxLayout({style: 'spacing: 8px; padding-top: 8px;'});
        if (c.tel)
            pie.add_child(boton('Llamar', () => abrirUri(`tel:${c.tel.replace(/\s/g, '')}`), 'lintel-btn lintel-btn-primary'));
        if (c.email)
            pie.add_child(boton('Escribir', () => abrirUri(`mailto:${c.email}`)));
        if (c.tel) {
            pie.add_child(boton('Copiar número', () => St.Clipboard.get_default().set_text(St.ClipboardType.CLIPBOARD, c.tel)));
        }
        pie.add_child(boton('Editar', () => {
            h.cerrar();
            this._editar(c, () => {});
        }));
        h.cuerpo.add_child(pie);
        h.abrir();
    }

    _editar(c, fin) {
        pedir(this.core, {
            titulo: c ? 'Editar contacto' : 'Nuevo contacto', ok: 'Guardar',
            campos: [
                {k: 'nombre', etq: 'Nombre', valor: c?.nombre ?? ''},
                {k: 'tel', etq: 'Teléfono', valor: c?.tel ?? '', ph: '+51 999 999 999'},
                {k: 'email', etq: 'Correo', valor: c?.email ?? ''},
                {k: 'cumple', etq: 'Cumpleaños', valor: c?.cumple ?? '', ph: 'AAAA-MM-DD'},
                {k: 'foto', etq: 'Foto (ruta)', valor: c?.foto ?? '', ph: '/home/usuario/foto.jpg'},
                {k: 'nota', etq: 'Nota', valor: c?.nota ?? ''},
            ],
            acciones: c ? [{t: 'Eliminar', peligro: true, cb: () => {
                this.datos.contactos = this.datos.contactos.filter(x => x.id !== c.id);
                this._guardar(fin);
            }}] : [],
            cb: v => {
                if (!v.nombre.trim())
                    return;
                const d = {nombre: v.nombre.trim(), tel: v.tel.trim(), email: v.email.trim(), cumple: v.cumple.trim(), foto: v.foto.trim(), nota: v.nota.trim()};
                if (c)
                    Object.assign(c, d);
                else
                    this.datos.contactos.push({id: nuevoId(), ...d});
                this._guardar(fin);
            },
        });
    }

    _guardar(fin) {
        this.guardarDatos();
        this.core.refrescarTipo('contactos');
        this.core.refrescarTipo('calendario');
        fin();
    }

    _gestor() {
        const h = new Hoja(this.core, {titulo: 'Contactos', ancho: 480, alto: 540, sinScroll: true});
        let q = '';
        const lista = new St.BoxLayout({orientation: Clutter.Orientation.VERTICAL, x_expand: true, style: 'spacing: 2px;'});
        const sc = new St.ScrollView({x_expand: true, y_expand: true, hscrollbar_policy: St.PolicyType.NEVER, overlay_scrollbars: true});
        sc.add_child(lista);
        const pintar = () => {
            lista.destroy_all_children();
            const f = this._ordenados().filter(c => `${c.nombre} ${c.tel} ${c.email}`.toLowerCase().includes(q.toLowerCase()));
            if (!f.length)
                lista.add_child(etiqueta('Sin resultados.', 'lintel-ayuda'));
            for (const c of f) {
                const fila = new St.BoxLayout({style: 'spacing: 10px; padding: 6px;'});
                fila.add_child(this._avatar(c, 34));
                const col = new St.BoxLayout({orientation: Clutter.Orientation.VERTICAL, x_expand: true, y_align: Clutter.ActorAlign.CENTER});
                col.add_child(etiqueta(c.nombre, 'lintel-card-t'));
                col.add_child(etiqueta(c.tel || c.email || '', 'lintel-ayuda'));
                fila.add_child(col);
                const b = new St.Button({style_class: 'lintel-nav', child: fila, x_expand: true});
                b.connect('clicked', () => {
                    h.cerrar();
                    this._detalle(c);
                });
                lista.add_child(b);
            }
        };
        const e = campo('', 'Buscar contacto…', v => {
            q = v;
            pintar();
        }, {ancho: 440});
        h.cuerpo.orientation = Clutter.Orientation.VERTICAL;
        h.cuerpo.add_child(e);
        h.cuerpo.add_child(sc);
        h.abrir();
        e.clutter_text.grab_key_focus();
        pintar();
    }
}
