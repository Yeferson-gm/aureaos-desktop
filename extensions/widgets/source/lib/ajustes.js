import Clutter from 'gi://Clutter';
import St from 'gi://St';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

import {Hoja, boton, etiqueta, seccion, fila, segmentado, interruptor, deslizador, muestras, campo, pedir} from './hoja.js';
import {ESTILO_DEF} from './estilo.js';
import {http} from './util.js';
import {LISTA} from '../widgets/index.js';

const CENTER = Clutter.ActorAlign.CENTER;

function controlCiudad(core, marco, op) {
    const o = marco.cfg.opts;
    const caja = new St.BoxLayout({vertical: true, style: 'spacing: 6px;'});
    const etiq = () => `${o[op.k].nombre} (${o[op.k].lat.toFixed(2)}, ${o[op.k].lon.toFixed(2)})`;
    const actual = etiqueta(etiq(), 'lintel-ayuda');
    const res = new St.BoxLayout({vertical: true, style: 'spacing: 4px;'});
    let q = '';
    const buscar = async () => {
        if (!q.trim())
            return;
        try {
            const txt = await http(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q.trim())}&count=5&language=es`);
            const js = JSON.parse(txt);
            res.destroy_all_children();
            if (!js.results?.length)
                res.add_child(etiqueta('No se encontró esa ciudad.', 'lintel-ayuda'));
            for (const r of js.results ?? []) {
                res.add_child(boton(`${r.name}${r.admin1 ? `, ${r.admin1}` : ''}, ${r.country ?? ''}`, () => {
                    o[op.k] = {nombre: r.name, lat: r.latitude, lon: r.longitude};
                    core.guardarCfg();
                    marco.reconstruir();
                    actual.text = etiq();
                    res.destroy_all_children();
                }, 'lintel-chip'));
            }
        } catch (_e) {
            res.destroy_all_children();
            res.add_child(etiqueta('Sin conexión.', 'lintel-ayuda'));
        }
    };
    const f = new St.BoxLayout({style: 'spacing: 6px;'});
    const e = campo('', 'Buscar ciudad…', v => (q = v), {ancho: 170});
    e.clutter_text.connect('activate', buscar);
    f.add_child(e);
    f.add_child(boton('Buscar', buscar));
    caja.add_child(actual);
    caja.add_child(f);
    caja.add_child(res);
    return caja;
}

function controlOpcion(core, marco, op) {
    const o = marco.cfg.opts;
    const cambiar = v => {
        o[op.k] = v;
        core.guardarCfg();
        marco.reconstruir();
    };
    switch (op.t) {
    case 'sel': return segmentado(op.ops, o[op.k], cambiar);
    case 'bool': return interruptor(o[op.k], cambiar);
    case 'texto': return campo(o[op.k], op.ph ?? '', cambiar, {ancho: 260});
    case 'area': return campo(o[op.k], op.ph ?? '', cambiar, {ancho: 260, multi: true, alto: 90});
    case 'num': return deslizador(op.min, op.max, o[op.k], cambiar, {paso: op.paso ?? 1, sufijo: op.sufijo ?? ''});
    case 'listas': {
        const ops = [['todas', 'Todas'], ...core.datos.datos.listas.map(l => [l.id, l.nombre])];
        return segmentado(ops, o[op.k], cambiar);
    }
    case 'ciudad': return controlCiudad(core, marco, op);
    default: return etiqueta('?');
    }
}

function panelWidget(core, marco, redibujar) {
    const out = [];
    const est = marco.cfg.estilo;
    const nuevo = () => {
        core.guardarCfg();
        marco.refrescarEstilo();
    };
    out.push(seccion('Estilo'));
    out.push(fila('Material', segmentado([['glass', 'Vidrio'], ['solido', 'Sólido']], est.estilo, v => {
        est.estilo = v;
        Object.assign(est, ESTILO_DEF[v]);
        nuevo();
        redibujar();
    }), 'Vidrio: translúcido con desenfoque. Sólido: opaco.'));
    out.push(fila('Tema', segmentado([['global', 'Global'], ['auto', 'Auto'], ['claro', 'Claro'], ['oscuro', 'Oscuro']],
        est.tema, v => {
            est.tema = v;
            nuevo();
        })));
    out.push(fila('Opacidad', deslizador(0, 100, est.opacidad, v => {
        est.opacidad = v;
        nuevo();
    }, {sufijo: '%'})));
    if (est.estilo === 'glass') {
        out.push(fila('Desenfoque', deslizador(0, 100, est.desenfoque, v => {
            est.desenfoque = v;
            nuevo();
        }, {sufijo: '%'})));
    }
    out.push(fila('Radio de esquinas', deslizador(0, 48, est.radio, v => {
        est.radio = v;
        nuevo();
    }, {sufijo: ' px'})));
    out.push(fila('Tamaño del texto', deslizador(70, 150, est.escala, v => {
        est.escala = v;
        nuevo();
    }, {paso: 5, sufijo: '%'})));
    out.push(fila('Color de fondo', muestras(est.tinte, v => {
        est.tinte = v;
        nuevo();
    }), 'A = automático según el tema'));
    out.push(fila('Color de acento', muestras(est.acento, v => {
        est.acento = v;
        nuevo();
    })));
    out.push(fila('Borde', interruptor(est.borde, v => {
        est.borde = v;
        nuevo();
    })));
    out.push(fila('Sombra', interruptor(est.sombra, v => {
        est.sombra = v;
        nuevo();
    })));

    out.push(seccion('Tamaño y posición'));
    const tams = marco.META.tam;
    out.push(fila('Tamaños predefinidos', segmentado(
        [['S', 'Pequeño'], ['M', 'Mediano'], ['L', 'Grande']], '', v => {
            const [w, h] = tams[v];
            marco.fijarRect(marco.cfg.x, marco.cfg.y, w, h);
            core.guardarCfg();
            redibujar();
        })));
    const cWH = new St.BoxLayout({style: 'spacing: 6px;'});
    const aplicar = () => {
        const [mw, mh] = marco.META.min ?? [120, 100];
        marco.fijarRect(marco.cfg.x, marco.cfg.y, Math.max(mw, marco.cfg.w), Math.max(mh, marco.cfg.h));
        core.guardarCfg();
    };
    const eW = campo(marco.cfg.w, 'Ancho', v => (marco.cfg.w = Math.round(v) || marco.cfg.w), {ancho: 70, num: true});
    const eH = campo(marco.cfg.h, 'Alto', v => (marco.cfg.h = Math.round(v) || marco.cfg.h), {ancho: 70, num: true});
    for (const e of [eW, eH])
        e.clutter_text.connect('activate', aplicar);
    cWH.add_child(eW);
    cWH.add_child(etiqueta('×'));
    cWH.add_child(eH);
    cWH.add_child(boton('Aplicar', aplicar));
    out.push(fila('Dimensiones (px)', cWH, 'También puedes arrastrar las esquinas en el modo de edición.'));

    if (marco.META.opciones?.length) {
        out.push(seccion(`Opciones de ${marco.META.nombre}`));
        for (const op of marco.META.opciones)
            out.push(fila(op.etq, controlOpcion(core, marco, op), op.ayuda ?? ''));
    }
    out.push(seccion('Acciones'));
    const acc = new St.BoxLayout({style: 'spacing: 8px;'});
    acc.add_child(boton('Quitar widget', () => {
        core.quitar(marco);
        redibujar('general');
    }, 'lintel-btn lintel-btn-danger'));
    out.push(acc);
    return out;
}

function panelGeneral(core, redibujar) {
    const g = core.cfg.global;
    const todos = () => core.marcos.forEach(m => m.refrescarEstilo());
    const out = [];
    out.push(seccion('Aspecto'));
    out.push(fila('Material de los widgets nuevos', segmentado([['glass', 'Vidrio'], ['solido', 'Sólido']], g.estilo, v => {
        g.estilo = v;
        core.guardarCfg();
    }), 'Cada widget puede tener su propio material (mezcla vidrio y sólido).'));
    out.push(fila('Tema', segmentado([['auto', 'Auto'], ['claro', 'Claro'], ['oscuro', 'Oscuro']], g.tema, v => {
        g.tema = v;
        core.guardarCfg();
        todos();
    }), 'Los widgets con tema «Global» siguen esta opción.'));
    out.push(fila('Animaciones', interruptor(g.animaciones, v => {
        g.animaciones = v;
        core.guardarCfg();
        todos();
    }), 'Sacudida del modo de edición y animaciones del clima.'));
    out.push(seccion('Disposición'));
    out.push(fila('Ajustar a cuadrícula', interruptor(g.cuadricula, v => {
        g.cuadricula = v;
        core.guardarCfg();
    })));
    out.push(fila('Tamaño de cuadrícula', deslizador(10, 60, g.tam, v => {
        g.tam = v;
        core.guardarCfg();
    }, {paso: 5, sufijo: ' px'})));
    out.push(fila('Imantar a bordes y otros widgets', interruptor(g.imantar, v => {
        g.imantar = v;
        core.guardarCfg();
    }), 'Mantén Alt mientras arrastras para mover sin imanes.'));
    out.push(fila('Capa del escritorio', segmentado([['auto', 'Sobre iconos'], ['fondo', 'Bajo todo']], g.capa, v => {
        g.capa = v;
        core.guardarCfg();
        core.colocar();
    }), '«Sobre iconos» permite hacer clic aunque uses Desktop Icons NG.'));
    out.push(seccion('Datos'));
    out.push(fila('Unidad de temperatura', segmentado([['C', '°C'], ['F', '°F']], g.unidad, v => {
        g.unidad = v;
        core.guardarCfg();
        core.refrescarTipo('clima');
    })));
    out.push(fila('Registrar tiempo de uso', interruptor(g.rastrear, v => {
        g.rastrear = v;
        core.guardarCfg();
    }), 'Se guarda solo en tu equipo (~/.config/lintel-widgets).'));
    out.push(seccion('Acciones'));
    const a1 = new St.BoxLayout({style: 'spacing: 8px;'});
    a1.add_child(boton('Todos en vidrio', () => core.estiloATodos('glass')));
    a1.add_child(boton('Todos en sólido', () => core.estiloATodos('solido')));
    a1.add_child(boton('Reordenar', () => core.reordenar()));
    out.push(a1);
    out.push(boton('Restablecer widgets de inicio', () => {
        core.restablecer();
        redibujar('general');
    }, 'lintel-btn lintel-btn-danger'));
    return out;
}

export function abrirAjustes(core, sel = 'general') {
    const h = new Hoja(core, {titulo: 'Ajustes de widgets', ancho: 920, alto: 660, sinScroll: true});
    h.cuerpo.vertical = false;
    h.cuerpo.style = 'spacing: 14px;';
    const lado = new St.BoxLayout({vertical: true, width: 190, style: 'spacing: 2px;'});
    const der = new St.ScrollView({
        x_expand: true, y_expand: true, hscrollbar_policy: St.PolicyType.NEVER,
        vscrollbar_policy: St.PolicyType.AUTOMATIC, overlay_scrollbars: true,
    });
    const cont = new St.BoxLayout({vertical: true, x_expand: true, style: 'spacing: 10px; padding-right: 12px;'});
    der.add_child(cont);
    const sc = new St.ScrollView({
        hscrollbar_policy: St.PolicyType.NEVER, vscrollbar_policy: St.PolicyType.AUTOMATIC,
        overlay_scrollbars: true, y_expand: true,
    });
    sc.add_child(lado);
    h.cuerpo.add_child(sc);
    h.cuerpo.add_child(der);

    let actual = sel;
    const dibujar = (nueva = null) => {
        if (typeof nueva === 'string')
            actual = nueva;
        if (actual !== 'general' && !core.marcos.some(m => m.cfg.id === actual))
            actual = 'general';
        lado.destroy_all_children();
        cont.destroy_all_children();
        const item = (id, texto) => {
            const b = new St.Button({style_class: 'lintel-nav', label: texto, can_focus: true, checked: id === actual, x_align: Clutter.ActorAlign.FILL});
            b.connect('clicked', () => dibujar(id));
            lado.add_child(b);
        };
        item('general', 'General');
        lado.add_child(etiqueta('Widgets en el escritorio', 'lintel-sec2'));
        const cuenta = {};
        for (const m of core.marcos) {
            cuenta[m.cfg.tipo] = (cuenta[m.cfg.tipo] ?? 0) + 1;
            item(m.cfg.id, cuenta[m.cfg.tipo] > 1 ? `${m.META.nombre} ${cuenta[m.cfg.tipo]}` : m.META.nombre);
        }
        const marco = core.marcos.find(m => m.cfg.id === actual);
        const nodos = marco ? panelWidget(core, marco, dibujar) : panelGeneral(core, dibujar);
        if (marco)
            cont.add_child(etiqueta(marco.META.nombre, 'lintel-h1'));
        for (const n of nodos)
            cont.add_child(n);
    };
    dibujar();
    h.abrir();
    return h;
}

export function abrirGaleria(core) {
    const h = new Hoja(core, {titulo: 'Añadir widget', ancho: 880, alto: 620});
    h.cuerpo.add_child(fila('Material para los nuevos widgets', segmentado(
        [['glass', 'Vidrio'], ['solido', 'Sólido']], core.cfg.global.estilo, v => {
            core.cfg.global.estilo = v;
            core.guardarCfg();
        }), 'Después puedes cambiarlo en cada widget.'));


    const disponible = Math.min(880, Main.layoutManager.primaryMonitor.width - 60) - 60;
    const columnas = Math.max(1, Math.min(3, Math.floor((disponible + 12) / 268)));
    const anchoTarjeta = Math.floor((disponible - (columnas - 1) * 12) / columnas);
    const cuad = new St.BoxLayout({vertical: true, x_expand: true, style: 'spacing: 12px;'});
    let filaTarjetas;
    let indice = 0;
    for (const mod of LISTA) {
        if (indice++ % columnas === 0) {
            filaTarjetas = new St.BoxLayout({style: 'spacing: 12px;', x_expand: true});
            cuad.add_child(filaTarjetas);
        }
        const M = mod.META;
        const card = new St.BoxLayout({style_class: 'lintel-card', vertical: true, width: anchoTarjeta});
        const cab = new St.BoxLayout({style: 'spacing: 10px;'});
        cab.add_child(new St.Icon({icon_name: M.icono, icon_size: 30, style_class: 'lintel-card-icono'}));
        cab.add_child(etiqueta(M.nombre, 'lintel-card-t'));
        card.add_child(cab);
        const d = etiqueta(M.desc, 'lintel-ayuda', {
            x_expand: true, y_expand: true, y_align: Clutter.ActorAlign.START,
        });
        d.clutter_text.line_wrap = true;
        d.clutter_text.ellipsize = 0;
        card.add_child(d);
        const tams = new St.BoxLayout({style: 'spacing: 6px; padding-top: 6px;'});
        const existente = core.marcos.find(m => m.cfg.tipo === M.id);
        if (existente) {
            card.add_child(etiqueta('Ya está en el escritorio', 'lintel-ayuda'));
            tams.add_child(boton('Mostrar', () => {
                h.cerrar();
                core.mostrar(existente);
            }, 'lintel-chip'));
            tams.add_child(boton('Ajustes', () => {
                h.cerrar();
                core.abrirAjustes(existente.cfg.id);
            }, 'lintel-chip'));
        } else {
            for (const [k, t] of [['S', 'Pequeño'], ['M', 'Mediano'], ['L', 'Grande']]) {
                tams.add_child(boton(t, () => {
                    h.cerrar();
                    core.agregar(M.id, k);
                }, 'lintel-chip'));
            }
        }
        card.add_child(tams);
        filaTarjetas.add_child(card);
    }
    h.cuerpo.add_child(cuad);
    return h.abrir();
}

export {pedir, CENTER};
