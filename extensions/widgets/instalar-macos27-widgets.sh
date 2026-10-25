#!/usr/bin/env bash
# macOS 27 Widgets del Escritorio v1 — instalador autocontenido para GNOME Shell 50/51.
#
# Es el único archivo necesario: contiene el núcleo, el marco de widgets, el panel de
# ajustes y los 13 widgets. Para modificar algo, edita el bloque ARCHIVO y vuelve a ejecutar.
#   bash instalar-macos27-widgets.sh              → instala
#   bash instalar-macos27-widgets.sh --verificar  → solo revisa la sintaxis
set -euo pipefail

readonly UUID='lintel-widgets@local'
readonly MODE="${1:---instalar}"
readonly DESTINATION="${HOME}/.local/share/gnome-shell/extensions/${UUID}"
readonly BACKUP_ROOT="${HOME}/Respaldos-GNOME"
readonly WORKDIR="$(mktemp -d)"
readonly SOURCE_DIR="${WORKDIR}/source"

cleanup() {
    rm -rf -- "${WORKDIR}"
}
trap cleanup EXIT

case "${MODE}" in
    --instalar|--verificar) ;;
    *)
        printf 'Uso: %s [--instalar|--verificar]\n' "$0" >&2
        exit 2
        ;;
esac

for command in gnome-extensions node python3 gjs glib-compile-schemas; do
    if ! command -v "${command}" >/dev/null 2>&1; then
        printf 'Falta el comando requerido: %s\n' "${command}" >&2
        exit 1
    fi
done

write_file() {
    local relative_path="$1"
    mkdir -p -- "${SOURCE_DIR}/$(dirname -- "${relative_path}")"
    cat > "${SOURCE_DIR}/${relative_path}"
}

# ── ARCHIVO: metadata.json ───────────────────────────────────────────────
write_file metadata.json <<'__LW_FILE_0__'
{
  "uuid": "lintel-widgets@local",
  "name": "macOS 27 Widgets del Escritorio",
  "description": "Widgets de escritorio estilo macOS (vidrio o sólido, mezclables), con modo de edición, arrastre y redimensionado: Clima, Calendario, Reloj, Baterías, Recordatorios, Notas, Fotos, Música, Podcasts, Contactos, Buscar, Noticias y Tiempo de uso.",
  "shell-version": ["50", "51"],
  "settings-schema": "org.gnome.shell.extensions.lintel-widgets",
  "session-modes": ["user"],
  "version": 1
}
__LW_FILE_0__

# ── ARCHIVO: extension.js ────────────────────────────────────────────────
write_file extension.js <<'__LW_FILE_1__'
import Meta from 'gi://Meta';
import Shell from 'gi://Shell';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';

import {Escritorio} from './lib/escritorio.js';

export default class WidgetsDelEscritorio extends Extension {
    enable() {
        this._esc = new Escritorio(this);
        this._esc.iniciar();
        try {
            Main.wm.addKeybinding('alternar-edicion', this.getSettings(),
                Meta.KeyBindingFlags.IGNORE_AUTOREPEAT, Shell.ActionMode.NORMAL | Shell.ActionMode.OVERVIEW,
                () => this._esc.modoEdicion(!this._esc.editando));
            this._atajo = true;
        } catch (e) {
            console.error(`[Widgets] atajo no disponible: ${e.message}`);
            this._atajo = false;
        }
    }

    disable() {
        if (this._atajo)
            Main.wm.removeKeybinding('alternar-edicion');
        this._atajo = false;
        this._esc?.detener();
        this._esc = null;
    }
}
__LW_FILE_1__

# ── ARCHIVO: stylesheet.css ──────────────────────────────────────────────
write_file stylesheet.css <<'__LW_FILE_2__'
/* ── Marcos de widget ─────────────────────────────────────────────────── */
.lw-btn { border-radius: 8px; padding: 2px 4px; }
.lw-dark .lw-hover:hover { background-color: rgba(255, 255, 255, 0.12); }
.lw-light .lw-hover:hover { background-color: rgba(0, 0, 0, 0.07); }
.lw-dark .lw-hover:focus { background-color: rgba(255, 255, 255, 0.10); }
.lw-light .lw-hover:focus { background-color: rgba(0, 0, 0, 0.06); }

.lw-edit { border: 2px dashed rgba(255, 255, 255, 0.75); border-radius: 24px; background-color: rgba(255, 255, 255, 0.04); }
.lw-handle {
    width: 16px; height: 16px; border-radius: 8px; background-color: #ffffff;
    border: 2px solid #0a84ff; box-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
}
.lw-handle:hover { background-color: #0a84ff; }
.lw-tools {
    spacing: 6px; padding: 4px; border-radius: 14px;
    background-color: rgba(40, 42, 52, 0.92); border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.45);
}
.lw-tool { padding: 4px 10px; border-radius: 10px; font-size: 12px; color: #f5f5f7; background-color: rgba(255, 255, 255, 0.10); }
.lw-tool:hover { background-color: rgba(255, 255, 255, 0.22); }
.lw-tool-rojo { color: #ff6b63; }
.lw-tool-rojo:hover { background-color: #ff453a; color: #ffffff; }
.lw-fondo-edicion { background-color: rgba(8, 10, 18, 0.46); }
.lw-barra {
    spacing: 8px; padding: 8px 10px; border-radius: 18px;
    background-color: rgba(44, 46, 58, 0.88); border: 1px solid rgba(255, 255, 255, 0.22);
    box-shadow: 0 14px 44px rgba(0, 0, 0, 0.5);
}
.lw-foto-pie { padding: 10px 12px; border-radius: 0 0 24px 24px; background-color: rgba(0, 0, 0, 0.28); }
.lw-foto-cor { padding: 4px 8px; border-radius: 99px; background-color: rgba(0, 0, 0, 0.35); }
.lw-check { border-radius: 99px; }

/* ── Hojas modales ────────────────────────────────────────────────────── */
.lintel-hoja-dim { background-color: rgba(6, 8, 14, 0.5); }
.lintel-hoja {
    padding: 18px 20px 20px 20px; border-radius: 22px; color: #f5f5f7;
    background-color: rgba(40, 42, 54, 0.94); border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 30px 90px rgba(0, 0, 0, 0.6);
}
.lintel-hoja-cab { padding-bottom: 12px; }
.lintel-hoja-titulo { font-size: 17px; font-weight: bold; }
.lintel-hoja-x { padding: 5px; border-radius: 99px; color: rgba(255, 255, 255, 0.7); }
.lintel-hoja-x:hover { background-color: rgba(255, 255, 255, 0.16); }

.lintel-btn { padding: 6px 14px; border-radius: 10px; font-size: 13px; color: #f5f5f7; background-color: rgba(255, 255, 255, 0.13); }
.lintel-btn:hover { background-color: rgba(255, 255, 255, 0.22); }
.lintel-btn-primary { background-color: #0a84ff; color: #ffffff; }
.lintel-btn-primary:hover { background-color: #3b9bff; }
.lintel-btn-danger { color: #ff6b63; }
.lintel-btn-danger:hover { background-color: #ff453a; color: #ffffff; }
.lintel-chip { padding: 4px 11px; border-radius: 99px; font-size: 12px; color: #f5f5f7; background-color: rgba(255, 255, 255, 0.12); }
.lintel-chip:hover { background-color: rgba(255, 255, 255, 0.22); }
.lintel-chip:checked { background-color: #0a84ff; color: #ffffff; }

.lintel-lbl { font-size: 13px; color: #f5f5f7; }
.lintel-ayuda { font-size: 11px; color: rgba(255, 255, 255, 0.55); }
.lintel-valor { font-size: 12px; color: rgba(255, 255, 255, 0.7); min-width: 52px; }
.lintel-sec2 { font-size: 11px; font-weight: bold; color: rgba(255, 255, 255, 0.45); padding: 14px 4px 2px 4px; }
.lintel-h1 { font-size: 20px; font-weight: bold; color: #ffffff; padding-bottom: 4px; }
.lintel-fila { spacing: 14px; padding: 5px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.07); }

.lintel-seg2 { background-color: rgba(255, 255, 255, 0.10); border-radius: 9px; padding: 2px; }
.lintel-seg2-b { padding: 4px 11px; border-radius: 7px; font-size: 12px; color: rgba(255, 255, 255, 0.8); }
.lintel-seg2-b:hover { background-color: rgba(255, 255, 255, 0.10); }
.lintel-seg2-b:checked { background-color: rgba(255, 255, 255, 0.26); color: #ffffff; }

.lintel-sw { width: 42px; height: 24px; border-radius: 12px; padding: 2px; background-color: rgba(255, 255, 255, 0.22); }
.lintel-sw:checked { background-color: #30d158; }
.lintel-knob { width: 20px; height: 20px; border-radius: 10px; background-color: #ffffff; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4); }

.lintel-muestra { width: 20px; height: 20px; border-radius: 10px; border: 2px solid rgba(255, 255, 255, 0.25); }
.lintel-muestra:hover { border-color: rgba(255, 255, 255, 0.7); }
.lintel-muestra:checked { border-color: #ffffff; box-shadow: 0 0 0 2px rgba(10, 132, 255, 0.9); }

.lintel-input {
    padding: 5px 10px; border-radius: 9px; font-size: 13px; color: #ffffff; caret-color: #ffffff;
    background-color: rgba(255, 255, 255, 0.11); border: 1px solid rgba(255, 255, 255, 0);
    selection-background-color: rgba(10, 132, 255, 0.7);
}
.lintel-input:focus { border-color: rgba(10, 132, 255, 0.95); box-shadow: 0 0 0 3px rgba(10, 132, 255, 0.3); }
.lintel-input StLabel.hint-text { color: rgba(255, 255, 255, 0.45); }

.lintel-nav { padding: 7px 12px; border-radius: 9px; font-size: 13px; color: #f5f5f7; text-align: left; }
.lintel-nav:hover { background-color: rgba(255, 255, 255, 0.09); }
.lintel-nav:checked { background-color: rgba(10, 132, 255, 0.45); }

.lintel-card { padding: 14px; spacing: 6px; border-radius: 16px; background-color: rgba(255, 255, 255, 0.07); border: 1px solid rgba(255, 255, 255, 0.1); }
.lintel-card-t { font-size: 14px; font-weight: bold; color: #ffffff; }
.lintel-card-icono { color: #64d2ff; }
.lintel-thumb { width: 96px; height: 96px; border-radius: 10px; border: 2px solid rgba(255, 255, 255, 0); }
.lintel-thumb:hover { border-color: #0a84ff; }

/* ── Menú contextual ──────────────────────────────────────────────────── */
.lintel-ctx {
    min-width: 210px; padding: 6px; border-radius: 12px; color: #f5f5f7;
    background-color: rgba(44, 46, 56, 0.92); border: 1px solid rgba(255, 255, 255, 0.16);
    box-shadow: 0 14px 44px rgba(0, 0, 0, 0.55);
}
.lintel-ctx-item { padding: 6px 10px; border-radius: 7px; font-size: 13px; color: #f5f5f7; text-align: left; }
.lintel-ctx-item:hover, .lintel-ctx-item:focus { background-color: rgba(10, 132, 255, 0.92); }
.lintel-ctx-item.danger { color: #ff6b63; }
.lintel-ctx-item.danger:hover { background-color: rgba(255, 69, 58, 0.92); color: #ffffff; }
.lintel-ctx-sep { height: 1px; margin: 5px 6px; background-color: rgba(255, 255, 255, 0.12); }
__LW_FILE_2__

# ── ARCHIVO: icons/lintel-widgets-symbolic.svg ───────────────────────────
write_file icons/lintel-widgets-symbolic.svg <<'__LW_FILE_3__'
<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
  <rect fill="#bebebe" x="1.500" y="1.500" width="6" height="6" rx="1.800"/>
  <rect fill="#bebebe" x="8.500" y="1.500" width="6" height="3" rx="1.200"/>
  <rect fill="#bebebe" x="8.500" y="5.500" width="6" height="9" rx="1.800"/>
  <rect fill="#bebebe" x="1.500" y="8.500" width="6" height="6" rx="3"/>
</svg>
__LW_FILE_3__

# ── ARCHIVO: schemas/org.gnome.shell.extensions.lintel-widgets.gschema.xml ──
write_file schemas/org.gnome.shell.extensions.lintel-widgets.gschema.xml <<'__LW_FILE_4__'
<?xml version="1.0" encoding="UTF-8"?>
<schemalist>
  <schema id="org.gnome.shell.extensions.lintel-widgets" path="/org/gnome/shell/extensions/lintel-widgets/">
    <key name="alternar-edicion" type="as">
      <default><![CDATA[['<Super><Alt>e']]]></default>
      <summary>Activar o desactivar el modo de edición de widgets</summary>
    </key>
  </schema>
</schemalist>
__LW_FILE_4__

# ── ARCHIVO: lib/ajustes.js ──────────────────────────────────────────────
write_file lib/ajustes.js <<'__LW_FILE_5__'
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
    acc.add_child(boton('Duplicar', () => core.duplicar(marco)));
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
    h.abrir();
    dibujar();
    return h;
}

export function abrirGaleria(core) {
    const h = new Hoja(core, {titulo: 'Añadir widget', ancho: 880, alto: 620});
    h.cuerpo.add_child(fila('Material para los nuevos widgets', segmentado(
        [['glass', 'Vidrio'], ['solido', 'Sólido']], core.cfg.global.estilo, v => {
            core.cfg.global.estilo = v;
            core.guardarCfg();
        }), 'Después puedes cambiarlo en cada widget.'));
    // Filas explícitas: FlowLayout no resuelve bien la altura natural de estas
    // tarjetas con etiquetas multilínea dentro del ScrollView.
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
        for (const [k, t] of [['S', 'Pequeño'], ['M', 'Mediano'], ['L', 'Grande']]) {
            tams.add_child(boton(t, () => {
                h.cerrar();
                core.agregar(M.id, k);
            }, 'lintel-chip'));
        }
        card.add_child(tams);
        filaTarjetas.add_child(card);
    }
    h.cuerpo.add_child(cuad);
    return h.abrir();
}

export {pedir, CENTER};
__LW_FILE_5__

# ── ARCHIVO: lib/base.js ─────────────────────────────────────────────────
write_file lib/base.js <<'__LW_FILE_6__'
import Clutter from 'gi://Clutter';
import GLib from 'gi://GLib';
import Pango from 'gi://Pango';
import St from 'gi://St';

export class WidgetBase {
    constructor(ctx) {
        this.ctx = ctx;
        this._ids = [];
        this._vivo = true;
    }

    get pal() { return this.ctx.pal; }
    get o() { return this.ctx.opts; }
    get w() { return this.ctx.w; }
    get h() { return this.ctx.h; }
    get core() { return this.ctx.core; }
    get datos() { return this.ctx.core.datos.datos; }

    px(n) { return Math.round(n * this.ctx.escala); }
    guardarDatos() { this.ctx.core.datos.guardar(); }
    guardarCfg() { this.ctx.core.guardarCfg(); }

    // Etiqueta con la paleta del widget.
    t(texto, px = 13, {peso = 'normal', c = 'texto', align = null, ellipsis = true, expand = false, extra = ''} = {}) {
        const col = this.pal[c] ?? c;
        const l = new St.Label({
            text: String(texto),
            style: `font-size: ${this.px(px)}px; font-weight: ${peso}; color: ${col}; ${extra}`,
            y_align: Clutter.ActorAlign.CENTER, x_expand: expand,
        });
        if (align)
            l.x_align = align;
        l.clutter_text.ellipsize = ellipsis ? Pango.EllipsizeMode.END : Pango.EllipsizeMode.NONE;
        return l;
    }

    // Botón plano con realce al pasar el cursor.
    boton(hijo, cb, {extra = '', expand = false} = {}) {
        const b = new St.Button({
            style_class: 'lw-btn lw-hover', child: hijo, reactive: true, can_focus: true,
            x_expand: expand, style: extra,
        });
        b.connect('clicked', cb);
        return b;
    }

    icono(nombre, px = 16, c = 'texto') {
        return new St.Icon({
            icon_name: nombre, icon_size: this.px(px), y_align: Clutter.ActorAlign.CENTER,
            style: `color: ${this.pal[c] ?? c};`,
        });
    }

    fila(estilo = '') {
        return new St.BoxLayout({x_expand: true, style: `spacing: ${this.px(8)}px; ${estilo}`});
    }

    columna(estilo = '') {
        return new St.BoxLayout({vertical: true, x_expand: true, style: `spacing: ${this.px(4)}px; ${estilo}`});
    }

    cada(ms, fn, ahora = false) {
        const id = GLib.timeout_add(GLib.PRIORITY_DEFAULT, ms, () => {
            if (!this._vivo)
                return GLib.SOURCE_REMOVE;
            fn();
            return GLib.SOURCE_CONTINUE;
        });
        this._ids.push(id);
        if (ahora)
            fn();
    }

    destruir() {
        this._vivo = false;
        for (const id of this._ids)
            GLib.source_remove(id);
        this._ids = [];
        this.alDestruir?.();
    }
}
__LW_FILE_6__

# ── ARCHIVO: lib/escritorio.js ───────────────────────────────────────────
write_file lib/escritorio.js <<'__LW_FILE_7__'
import Clutter from 'gi://Clutter';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import Gio from 'gi://Gio';
import Meta from 'gi://Meta';
import St from 'gi://St';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

import {Almacen, cerrarHttp, clonar, nuevoId} from './util.js';
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

    // ── Ciclo de vida ─────────────────────────────────────────────────
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

    // ── Geometría y capas ─────────────────────────────────────────────
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
        // Mutter puede elevar actores ajenos a las ventanas al reordenarlas.
        // Corregir antes de pintar: un idle puede esperar toda la animación.
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
                // Nunca seguir un escritorio que esté temporalmente por encima
                // de una app durante map/minimize/maximize.
                if (hijo.meta_window && !set.has(hijo))
                    break;
                if (set.has(hijo))
                    destino = hijo;
            }
        }
        if (this.capa.get_previous_sibling() !== destino)
            wg.set_child_above_sibling(this.capa, destino);
    }

    // ── Gestión de widgets ────────────────────────────────────────────
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
        const mod = MODULOS[tipo];
        const [w, h] = mod.META.tam[tam];
        const [x, y] = this.huecoLibre(w, h);
        const cfg = {id: nuevoId(), tipo, x, y, w, h, estilo: estiloNuevo(this.cfg.global.estilo), opts: {}};
        this.cfg.widgets.push(cfg);
        const m = this._montar(cfg);
        m.aparecer();
        this.guardarCfg();
        if (!this.editando)
            this.modoEdicion(true);
        return m;
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

    duplicar(m) {
        const c = clonar(m.cfg);
        c.id = nuevoId();
        c.x = Math.min(c.x + 28, Math.max(0, this.area.w - c.w));
        c.y = Math.min(c.y + 28, Math.max(0, this.area.h - c.h));
        this.cfg.widgets.push(c);
        this._montar(c).aparecer();
        this.guardarCfg();
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

    // Imanes: bordes de pantalla, otros widgets y cuadrícula.
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

    // ── Modo de edición ───────────────────────────────────────────────
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

    // ── Menú contextual de widget ─────────────────────────────────────
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
        const menu = new St.BoxLayout({style_class: 'lintel-ctx', vertical: true});
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
__LW_FILE_7__

# ── ARCHIVO: lib/estilo.js ───────────────────────────────────────────────
write_file lib/estilo.js <<'__LW_FILE_8__'
import Gio from 'gi://Gio';
import {clamp, hex255, rgb01} from './util.js';

let _ajustes = null;
export function oscuroSistema() {
    try {
        _ajustes ??= new Gio.Settings({schema_id: 'org.gnome.desktop.interface'});
        return _ajustes.get_string('color-scheme') === 'prefer-dark';
    } catch (_e) {
        return true;
    }
}

export const ESTILO_DEF = {
    glass: {opacidad: 42, desenfoque: 45},
    solido: {opacidad: 100, desenfoque: 0},
};

export function estiloNuevo(tipo = 'glass') {
    return {
        estilo: tipo, tema: 'global', radio: 24, tinte: '', acento: '', borde: true, sombra: true,
        escala: 100, ...ESTILO_DEF[tipo],
    };
}

export function paleta(est, glob) {
    const modo = !est.tema || est.tema === 'global' ? glob.tema : est.tema;
    const oscuro = modo === 'oscuro' || (modo === 'auto' && oscuroSistema());
    const acento = est.acento || '#0a84ff';
    const texto = oscuro ? '#f5f5f7' : '#1c1c1e';
    return {
        oscuro, acento, texto,
        texto2: oscuro ? 'rgba(235,235,245,0.62)' : 'rgba(60,60,67,0.62)',
        sep: oscuro ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.12)',
        superficie: oscuro ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.06)',
        rojo: '#ff453a', verde: '#30d158', naranja: '#ff9f0a', amarillo: '#ffd60a',
        rgb: {texto: rgb01(texto), acento: rgb01(acento), rojo: rgb01('#ff453a'), verde: rgb01('#30d158'),
            naranja: rgb01('#ff9f0a')},
    };
}

export function cssMarco(est, pal) {
    const glass = est.estilo === 'glass';
    const base = est.tinte || (pal.oscuro ? '#1e1e24' : '#ffffff');
    const [r, g, b] = hex255(base);
    const a = clamp(est.opacidad, 0, 100) / 100;
    let s = `background-color: rgba(${r},${g},${b},${a}); border-radius: ${est.radio}px; color: ${pal.texto};`;
    if (est.borde) {
        s += glass
            ? `border: 1px solid rgba(255,255,255,${pal.oscuro ? 0.22 : 0.62});`
            : `border: 1px solid ${pal.oscuro ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.09)'};`;
    }
    if (est.sombra)
        s += `box-shadow: 0 10px 30px rgba(0,0,0,${glass ? 0.26 : 0.34});`;
    return s;
}
__LW_FILE_8__

# ── ARCHIVO: lib/hoja.js ─────────────────────────────────────────────────
write_file lib/hoja.js <<'__LW_FILE_9__'
import Clutter from 'gi://Clutter';
import Pango from 'gi://Pango';
import Shell from 'gi://Shell';
import St from 'gi://St';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import {Slider} from 'resource:///org/gnome/shell/ui/slider.js';

import {clamp, uriDe} from './util.js';

const STOP = Clutter.EVENT_STOP;
const PASS = Clutter.EVENT_PROPAGATE;
const CENTER = Clutter.ActorAlign.CENTER;

// Hoja modal de vidrio: base de ajustes, galería, editores y avisos.
export class Hoja {
    constructor(core, o = {}) {
        this.core = core;
        this.o = {titulo: '', ancho: 560, alto: 0, cerrarFuera: true, sinScroll: false, ...o};
        this.cuerpo = new St.BoxLayout({vertical: true, x_expand: true, y_expand: true, style: 'spacing: 10px;'});
        this.cerrada = false;
    }

    abrir() {
        const m = Main.layoutManager.primaryMonitor;
        const ov = this.ov = new St.Widget({
            layout_manager: new Clutter.BinLayout(), reactive: true, opacity: 0,
            x: m.x, y: m.y, width: m.width, height: m.height,
        });
        const dim = new St.Widget({style_class: 'lintel-hoja-dim', reactive: true, x_expand: true, y_expand: true});
        dim.connect('button-press-event', () => {
            if (this.o.cerrarFuera)
                this.cerrar();
            return STOP;
        });
        ov.add_child(dim);

        const caja = this.caja = new St.BoxLayout({
            style_class: 'lintel-hoja', vertical: true, reactive: true,
            width: Math.min(this.o.ancho, m.width - 60), x_expand: true, y_expand: true,
            x_align: CENTER, y_align: CENTER,
        });
        if (this.o.alto)
            caja.height = Math.min(this.o.alto, m.height - 90);

        const cab = new St.BoxLayout({style_class: 'lintel-hoja-cab'});
        this.titulo = new St.Label({
            text: this.o.titulo, x_expand: true, y_align: CENTER, style_class: 'lintel-hoja-titulo',
        });
        const x = new St.Button({
            style_class: 'lintel-hoja-x', can_focus: true,
            child: new St.Icon({icon_name: 'window-close-symbolic', icon_size: 14}),
        });
        x.connect('clicked', () => this.cerrar());
        cab.add_child(this.titulo);
        cab.add_child(x);
        caja.add_child(cab);

        if (this.o.sinScroll) {
            caja.add_child(this.cuerpo);
        } else {
            const sc = new St.ScrollView({
                x_expand: true, y_expand: true, hscrollbar_policy: St.PolicyType.NEVER,
                vscrollbar_policy: St.PolicyType.AUTOMATIC, overlay_scrollbars: true,
                style: this.o.alto ? '' : `max-height: ${Math.max(200, m.height - 220)}px;`,
            });
            sc.add_child(this.cuerpo);
            caja.add_child(sc);
        }
        ov.add_child(caja);

        ov.connect('key-press-event', (_a, ev) => {
            if (ev.get_key_symbol() === Clutter.KEY_Escape) {
                this.cerrar();
                return STOP;
            }
            return PASS;
        });
        Main.uiGroup.add_child(ov);
        this.grab = Main.pushModal(ov, {actionMode: Shell.ActionMode.POPUP});
        ov.grab_key_focus();
        ov.ease({opacity: 255, duration: 150, mode: Clutter.AnimationMode.EASE_OUT_QUAD});
        caja.set_pivot_point(0.5, 0.5);
        caja.set({scale_x: 0.96, scale_y: 0.96});
        caja.ease({scale_x: 1, scale_y: 1, duration: 200, mode: Clutter.AnimationMode.EASE_OUT_CUBIC});
        this.core.hojas.push(this);
        return this;
    }

    cerrar() {
        if (this.cerrada)
            return;
        this.cerrada = true;
        const i = this.core.hojas.indexOf(this);
        if (i >= 0)
            this.core.hojas.splice(i, 1);
        if (this.grab)
            Main.popModal(this.grab);
        this.o.alCerrar?.();
        const ov = this.ov;
        ov.ease({opacity: 0, duration: 110, mode: Clutter.AnimationMode.EASE_OUT_QUAD, onComplete: () => ov.destroy()});
    }
}

// ── Controles reutilizables ─────────────────────────────────────────────
export function boton(texto, cb, clase = 'lintel-btn') {
    const b = new St.Button({label: texto, style_class: clase, can_focus: true, reactive: true});
    b.connect('clicked', cb);
    return b;
}

export function etiqueta(texto, clase = 'lintel-lbl', extra = {}) {
    const l = new St.Label({text: texto, style_class: clase, y_align: CENTER, ...extra});
    l.clutter_text.ellipsize = Pango.EllipsizeMode.END;
    return l;
}

export function seccion(texto) {
    return new St.Label({text: texto, style_class: 'lintel-sec2'});
}

export function fila(etq, control, ayuda = '') {
    const f = new St.BoxLayout({style_class: 'lintel-fila', x_expand: true});
    const izq = new St.BoxLayout({vertical: true, x_expand: true, y_align: CENTER});
    izq.add_child(etiqueta(etq));
    if (ayuda)
        izq.add_child(etiqueta(ayuda, 'lintel-ayuda'));
    f.add_child(izq);
    control.y_align = CENTER;
    f.add_child(control);
    return f;
}

export function segmentado(ops, valor, cb) {
    const ancho = ops.length > 4;
    const caja = ancho
        ? new St.Widget({layout_manager: new Clutter.FlowLayout({column_spacing: 4, row_spacing: 4}), style: 'max-width: 330px;'})
        : new St.BoxLayout({style_class: 'lintel-seg2'});
    const bs = [];
    for (const [v, t] of ops) {
        const b = new St.Button({
            label: t, style_class: ancho ? 'lintel-chip' : 'lintel-seg2-b', can_focus: true, checked: v === valor,
        });
        b.connect('clicked', () => {
            bs.forEach(x => (x.checked = false));
            b.checked = true;
            cb(v);
        });
        bs.push(b);
        caja.add_child(b);
    }
    return caja;
}

export function interruptor(valor, cb) {
    const knob = new St.Widget({style_class: 'lintel-knob', x_expand: true, y_align: CENTER,
        x_align: valor ? Clutter.ActorAlign.END : Clutter.ActorAlign.START});
    const b = new St.Button({style_class: 'lintel-sw', child: knob, checked: !!valor, can_focus: true});
    b.connect('clicked', () => {
        const v = !b.checked;
        b.checked = v;
        knob.x_align = v ? Clutter.ActorAlign.END : Clutter.ActorAlign.START;
        cb(v);
    });
    return b;
}

export function deslizador(min, max, valor, cb, {paso = 1, sufijo = '', ancho = 190} = {}) {
    const caja = new St.BoxLayout({style: 'spacing: 10px;'});
    const lb = etiqueta(`${Math.round(valor)}${sufijo}`, 'lintel-valor');
    const s = new Slider(clamp((valor - min) / (max - min), 0, 1));
    s.width = ancho;
    s.y_align = CENTER;
    s.connect('notify::value', () => {
        const v = Math.round((min + s.value * (max - min)) / paso) * paso;
        lb.text = `${v}${sufijo}`;
        cb(v);
    });
    caja.add_child(s);
    caja.add_child(lb);
    return caja;
}

export const PALETA = ['#0a84ff', '#30d158', '#ff9f0a', '#ff453a', '#bf5af2', '#ff375f', '#64d2ff', '#ffd60a', '#8e8e93', '#1c1c1e', '#ffffff'];

export function muestras(valor, cb, colores = PALETA, conAuto = true) {
    const caja = new St.Widget({layout_manager: new Clutter.FlowLayout({column_spacing: 6, row_spacing: 6}), style: 'max-width: 250px;'});
    const bs = [];
    const lista = conAuto ? ['', ...colores] : colores;
    for (const c of lista) {
        const b = new St.Button({
            style_class: 'lintel-muestra', can_focus: true, checked: c === (valor || ''),
            style: c ? `background-color: ${c};` : 'background-color: transparent;',
            child: c ? null : new St.Label({text: 'A', style: 'font-size: 10px; color: #fff;', x_align: CENTER, y_align: CENTER}),
        });
        b.connect('clicked', () => {
            bs.forEach(x => (x.checked = false));
            b.checked = true;
            cb(c);
        });
        bs.push(b);
        caja.add_child(b);
    }
    return caja;
}

export function campo(valor, hint, cb, {multi = false, ancho = 230, alto = 0, num = false} = {}) {
    const e = new St.Entry({
        text: String(valor ?? ''), hint_text: hint, style_class: 'lintel-input', can_focus: true,
        width: ancho, x_expand: false,
    });
    if (multi) {
        e.clutter_text.single_line_mode = false;
        e.clutter_text.line_wrap = true;
        e.clutter_text.activatable = false;
        if (alto)
            e.style = `height: ${alto}px;`;
    }
    e.clutter_text.connect('text-changed', () => cb(num ? Number(e.get_text()) : e.get_text()));
    return e;
}

// Cuadro para pedir datos: campos [{k, etq, valor, ph, tipo:'texto'|'sel'|'multi', ops}]
export function pedir(core, {titulo, texto = '', campos = [], ok = 'Guardar', cb, acciones = [], ancho = 440}) {
    const h = new Hoja(core, {titulo, ancho});
    const vals = {};
    if (texto)
        h.cuerpo.add_child(etiqueta(texto, 'lintel-ayuda', {x_expand: true}));
    for (const c of campos) {
        vals[c.k] = c.valor ?? (c.tipo === 'sel' ? c.ops[0][0] : '');
        let ctl;
        if (c.tipo === 'sel') {
            ctl = segmentado(c.ops, vals[c.k], v => (vals[c.k] = v));
        } else if (c.tipo === 'colores') {
            ctl = muestras(vals[c.k], v => (vals[c.k] = v), c.colores, false);
        } else {
            ctl = campo(vals[c.k], c.ph ?? '', v => (vals[c.k] = v),
                {multi: c.tipo === 'multi', ancho: 270, alto: c.tipo === 'multi' ? 110 : 0});
        }
        h.cuerpo.add_child(fila(c.etq, ctl));
    }
    const pie = new St.BoxLayout({style: 'spacing: 8px; padding-top: 8px;', x_expand: true});
    for (const a of acciones) {
        pie.add_child(boton(a.t, () => {
            h.cerrar();
            a.cb(vals);
        }, `lintel-btn${a.peligro ? ' lintel-btn-danger' : ''}`));
    }
    pie.add_child(new St.Widget({x_expand: true}));
    pie.add_child(boton('Cancelar', () => h.cerrar()));
    pie.add_child(boton(ok, () => {
        h.cerrar();
        cb?.(vals);
    }, 'lintel-btn lintel-btn-primary'));
    h.cuerpo.add_child(pie);
    return h.abrir();
}

// Selector visual de imágenes (miniaturas) a partir de una lista de rutas.
export function elegirImagen(core, rutas, alElegir, titulo = 'Elegir imagen') {
    const h = new Hoja(core, {titulo, ancho: 640, alto: 460});
    const cuad = new St.Widget({
        layout_manager: new Clutter.FlowLayout({column_spacing: 8, row_spacing: 8}), x_expand: true,
    });
    if (!rutas.length)
        h.cuerpo.add_child(etiqueta('No se encontraron imágenes en la carpeta de Imágenes.', 'lintel-ayuda'));
    for (const p of rutas.slice(0, 120)) {
        const b = new St.Button({
            style_class: 'lintel-thumb', can_focus: true,
            style: `background-image: url("${uriDe(p)}"); background-size: cover;`,
        });
        b.connect('clicked', () => {
            h.cerrar();
            alElegir(p);
        });
        cuad.add_child(b);
    }
    h.cuerpo.add_child(cuad);
    return h.abrir();
}
__LW_FILE_9__

# ── ARCHIVO: lib/marco.js ────────────────────────────────────────────────
write_file lib/marco.js <<'__LW_FILE_10__'
import Clutter from 'gi://Clutter';
import Shell from 'gi://Shell';
import St from 'gi://St';

import {paleta, cssMarco} from './estilo.js';
import {clamp} from './util.js';

const STOP = Clutter.EVENT_STOP;
const PASS = Clutter.EVENT_PROPAGATE;
const START = Clutter.ActorAlign.START;
const END = Clutter.ActorAlign.END;
const CENTER = Clutter.ActorAlign.CENTER;

// Contenedor de un widget: estilo (vidrio/sólido), edición, mover y redimensionar.
export class Marco {
    constructor(core, cfg, modulo) {
        this.core = core;
        this.cfg = cfg;
        this.mod = modulo;
        this.META = modulo.META;
        this._inst = null;
        this._editando = false;
        this._drag = null;
        for (const op of this.META.opciones ?? []) {
            if (!(op.k in cfg.opts))
                cfg.opts[op.k] = op.def;
        }
        this._crear();
    }

    _crear() {
        const {cfg} = this;
        const a = this.actor = new St.Widget({
            layout_manager: new Clutter.BinLayout(), reactive: true, style_class: 'lw-marco',
            x: cfg.x, y: cfg.y, width: cfg.w, height: cfg.h,
        });
        // El padre puede destruir el actor mientras termina la animación de salida.
        // Invalidar callbacks y temporizadores incluso si onComplete no se ejecuta.
        a.connect('destroy', () => this._liberar());
        this._blur = new St.Widget({x_expand: true, y_expand: true, style: 'background-color: rgba(0,0,0,0.004);'});
        this._cont = new St.BoxLayout({vertical: true, x_expand: true, y_expand: true, clip_to_allocation: true});
        this._capa = this._crearCapa();
        a.add_child(this._blur);
        a.add_child(this._cont);
        a.add_child(this._capa);
        a.connect('button-press-event', (_a, ev) => {
            if (ev.get_button() === Clutter.BUTTON_SECONDARY && !this.core.editando) {
                const [x, y] = ev.get_coords();
                this.core.menuWidget(this, x, y);
                return STOP;
            }
            return PASS;
        });
        a.set_pivot_point(0.5, 0.5);
        this.refrescarEstilo();
    }

    // ── Estilo ────────────────────────────────────────────────────────
    refrescarEstilo() {
        const est = this.cfg.estilo;
        this.pal = paleta(est, this.core.cfg.global);
        this.actor.style = cssMarco(est, this.pal);
        this.actor.remove_style_class_name(this.pal.oscuro ? 'lw-light' : 'lw-dark');
        this.actor.add_style_class_name(this.pal.oscuro ? 'lw-dark' : 'lw-light');
        const inset = Math.round(est.radio * 0.3);
        this._blur.style = `margin: ${inset}px; background-color: rgba(0,0,0,0.004);`;
        this._aplicarBlur();
        this._actualizarBotonEstilo();
        this.reconstruir();
    }

    _aplicarBlur() {
        this._blur.clear_effects();
        const est = this.cfg.estilo;
        if (est.estilo !== 'glass' || est.desenfoque <= 0)
            return;
        try {
            const fx = new Shell.BlurEffect({mode: Shell.BlurMode.BACKGROUND});
            const sigma = 4 + est.desenfoque * 0.44;
            if ('sigma' in fx)
                fx.sigma = sigma;
            else if ('radius' in fx)
                fx.radius = sigma * 2;
            fx.brightness = this.pal.oscuro ? 0.8 : 1.0;
            this._blur.add_effect(fx);
        } catch (e) {
            console.error(`[Widgets] blur: ${e.message}`);
        }
    }

    // ── Contenido ─────────────────────────────────────────────────────
    reconstruir() {
        this._inst?.destruir();
        this._inst = null;
        this._cont.destroy_all_children();
        const pad = this.META.padding ?? 14;
        this._cont.style = `padding: ${pad}px;`;
        const {cfg} = this;
        this.ctx = {
            core: this.core, id: cfg.id, cfg, opts: cfg.opts, pal: this.pal, meta: this.META,
            escala: cfg.estilo.escala / 100, w: cfg.w - 2 * pad, h: cfg.h - 2 * pad, radio: cfg.estilo.radio,
        };
        try {
            this._inst = new this.mod.Widget(this.ctx);
            this._inst.construir(this._cont);
        } catch (e) {
            console.error(`[Widgets] ${this.META.id}: ${e.stack ?? e.message}`);
            this._cont.add_child(new St.Label({
                text: `Error en «${this.META.nombre}»: ${e.message}`,
                style: `color: ${this.pal.rojo}; font-size: 12px;`,
            }));
        }
    }

    fijarRect(x, y, w, h, reconstruir = true) {
        Object.assign(this.cfg, {x, y, w, h});
        this.actor.set_position(x, y);
        this.actor.set_size(w, h);
        if (reconstruir)
            this.reconstruir();
        this._ubicarBarra();
    }

    aparecer() {
        this.actor.set({opacity: 0, scale_x: 0.9, scale_y: 0.9});
        this.actor.ease({
            opacity: 255, scale_x: 1, scale_y: 1, duration: 260,
            mode: Clutter.AnimationMode.EASE_OUT_BACK,
        });
    }

    _liberar() {
        this._editando = false;
        this._pararDrag();
        this._inst?.destruir();
        this._inst = null;
    }

    destruir() {
        this._liberar();
        this.actor.remove_all_transitions();
        this.actor.destroy();
    }

    // ── Modo edición ──────────────────────────────────────────────────
    _crearCapa() {
        const capa = new St.Widget({
            layout_manager: new Clutter.BinLayout(), reactive: true, visible: false,
            style_class: 'lw-edit', x_expand: true, y_expand: true,
        });
        capa.connect('button-press-event', (_a, ev) => {
            if (ev.get_button() !== Clutter.BUTTON_PRIMARY)
                return PASS;
            // Los eventos de los botones también llegan al contenedor. No
            // capturar su liberación como si fueran un arrastre del widget.
            const [px, py] = ev.get_coords();
            const source = global.stage.get_actor_at_pos(Clutter.PickMode.REACTIVE, px, py);
            if (source && this._barra?.contains(source))
                return PASS;
            this._iniciarDrag('mover', ev);
            return STOP;
        });
        for (const [modo, xa, ya] of [['tl', START, START], ['tr', END, START], ['bl', START, END], ['br', END, END]]) {
            const hd = new St.Widget({
                style_class: 'lw-handle', reactive: true, x_expand: true, y_expand: true, x_align: xa, y_align: ya,
            });
            hd.translation_x = xa === START ? -8 : 8;
            hd.translation_y = ya === START ? -8 : 8;
            hd.connect('button-press-event', (_a, ev) => {
                this._iniciarDrag(modo, ev);
                return STOP;
            });
            capa.add_child(hd);
        }
        const barra = this._barra = new St.BoxLayout({
            style_class: 'lw-tools', x_expand: true, y_expand: true, x_align: CENTER, y_align: START,
        });
        const mk = (txt, cb, clase = '') => {
            const b = new St.Button({label: txt, style_class: `lw-tool ${clase}`, reactive: true, can_focus: true});
            b.connect('clicked', cb);
            barra.add_child(b);
            return b;
        };
        mk('Quitar', () => this.core.quitar(this), 'lw-tool-rojo');
        mk('Ajustes', () => this.core.abrirAjustes(this.cfg.id));
        this._bEstilo = mk('', () => this.core.alternarEstilo(this));
        mk('Duplicar', () => this.core.duplicar(this));
        capa.add_child(barra);
        return capa;
    }

    _actualizarBotonEstilo() {
        if (this._bEstilo)
            this._bEstilo.label = this.cfg.estilo.estilo === 'glass' ? 'Pasar a sólido' : 'Pasar a vidrio';
    }

    _ubicarBarra() {
        if (this._barra)
            this._barra.translation_y = this.cfg.y < 52 ? 10 : -44;
    }

    editar(on) {
        this._editando = on;
        this._capa.visible = on;
        this._ubicarBarra();
        this.actor.remove_all_transitions();
        this.actor.rotation_angle_z = 0;
        if (on)
            this._jiggle(Math.random() < 0.5 ? 1 : -1);
    }

    _jiggle(dir) {
        if (!this._editando || !this.core.cfg.global.animaciones)
            return;
        this.actor.ease({
            rotation_angle_z: this._drag ? 0 : dir * 0.55, duration: 105 + Math.random() * 45,
            mode: Clutter.AnimationMode.EASE_IN_OUT_SINE,
            onComplete: () => this._jiggle(-dir),
        });
    }

    // ── Arrastrar y redimensionar ─────────────────────────────────────
    _iniciarDrag(modo, ev) {
        const [px, py] = ev.get_coords();
        const {x, y, w, h} = this.cfg;
        this._drag = {modo, px, py, o: {x, y, w, h}, cambioTam: false};
        this.core.alFrente(this);
        this._capId = global.stage.connect('captured-event', (_s, e) => {
            const t = e.type();
            if (t === Clutter.EventType.MOTION) {
                const [mx, my] = e.get_coords();
                this._arrastrar(mx - this._drag.px, my - this._drag.py, e.get_state());
                return STOP;
            }
            if (t === Clutter.EventType.BUTTON_RELEASE) {
                this._terminarDrag();
                return STOP;
            }
            return PASS;
        });
    }

    _arrastrar(dx, dy, estado) {
        const d = this._drag;
        const [minW, minH] = this.META.min ?? [120, 100];
        let {x, y, w, h} = d.o;
        const m = d.modo;
        if (m === 'mover') {
            x += dx;
            y += dy;
        } else {
            d.cambioTam = true;
            if (m.includes('r'))
                w += dx;
            if (m.includes('l')) {
                x += dx;
                w -= dx;
            }
            if (m.includes('b'))
                h += dy;
            if (m.includes('t')) {
                y += dy;
                h -= dy;
            }
            if (w < minW) {
                if (m.includes('l'))
                    x -= minW - w;
                w = minW;
            }
            if (h < minH) {
                if (m.includes('t'))
                    y -= minH - h;
                h = minH;
            }
        }
        const libre = (estado & Clutter.ModifierType.MOD1_MASK) !== 0;
        let r = {x, y, w, h};
        if (!libre)
            r = this.core.imantar(this, m, r);
        const A = this.core.area;
        r.w = Math.min(r.w, A.w);
        r.h = Math.min(r.h, A.h);
        r.x = clamp(r.x, 0, A.w - r.w);
        r.y = clamp(r.y, 0, A.h - r.h);
        this.fijarRect(Math.round(r.x), Math.round(r.y), Math.round(r.w), Math.round(r.h), false);
    }

    _terminarDrag() {
        const cambio = this._drag?.cambioTam;
        this._pararDrag();
        if (cambio)
            this.reconstruir();
        this.core.guardarCfg();
    }

    _pararDrag() {
        if (this._capId) {
            global.stage.disconnect(this._capId);
            this._capId = 0;
        }
        this._drag = null;
    }
}
__LW_FILE_10__

# ── ARCHIVO: lib/util.js ─────────────────────────────────────────────────
write_file lib/util.js <<'__LW_FILE_11__'
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import Soup from 'gi://Soup?version=3.0';

export const CFG_DIR = GLib.build_filenamev([GLib.get_user_config_dir(), 'lintel-widgets']);
export const CACHE_DIR = GLib.build_filenamev([GLib.get_user_cache_dir(), 'lintel-widgets']);

export const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
export const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto',
    'septiembre', 'octubre', 'noviembre', 'diciembre'];

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
export const pad = n => String(n).padStart(2, '0');
export const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const nuevoId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
export const fechaLarga = d => `${DIAS[d.getDay()]}, ${d.getDate()} de ${MESES[d.getMonth()]}`;
export const clonar = o => JSON.parse(JSON.stringify(o));

export function hex255(hex) {
    const h = (hex || '#000000').replace('#', '');
    const f = h.length === 3 ? h.split('').map(c => c + c).join('') : h.padEnd(6, '0');
    return [parseInt(f.slice(0, 2), 16), parseInt(f.slice(2, 4), 16), parseInt(f.slice(4, 6), 16)];
}
export const rgb01 = hex => hex255(hex).map(v => v / 255);
export const rgbaCss = (hex, a) => `rgba(${hex255(hex).join(',')},${a})`;

export function fmtDur(seg) {
    const h = Math.floor(seg / 3600);
    const m = Math.floor(seg % 3600 / 60);
    return h ? `${h} h ${m} min` : `${m} min`;
}

export function haceTiempo(fecha) {
    if (!fecha)
        return '';
    const s = Math.max(0, (Date.now() - fecha.getTime()) / 1000);
    if (s < 3600) return `hace ${Math.max(1, Math.floor(s / 60))} min`;
    if (s < 86400) return `hace ${Math.floor(s / 3600)} h`;
    if (s < 86400 * 30) return `hace ${Math.floor(s / 86400)} d`;
    return `${fecha.getDate()} ${MESES[fecha.getMonth()].slice(0, 3)}`;
}

// ── Archivos y almacén JSON con guardado diferido ───────────────────────
export function leerJSON(file, def) {
    try {
        const [ok, bytes] = GLib.file_get_contents(file);
        if (ok)
            return JSON.parse(new TextDecoder().decode(bytes));
    } catch (_e) {
        // primer arranque
    }
    return def;
}

export function escribirJSON(file, obj) {
    try {
        GLib.mkdir_with_parents(GLib.path_get_dirname(file), 0o755);
        GLib.file_set_contents(file, JSON.stringify(obj));
    } catch (e) {
        console.error(`[Widgets] escribir ${file}: ${e.message}`);
    }
}

export class Almacen {
    constructor(nombre, defecto) {
        this.file = GLib.build_filenamev([CFG_DIR, `${nombre}.json`]);
        this.datos = Object.assign(clonar(defecto), leerJSON(this.file, {}));
        this._t = 0;
    }

    guardar() {
        if (this._t)
            GLib.source_remove(this._t);
        this._t = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 700, () => {
            this._t = 0;
            escribirJSON(this.file, this.datos);
            return GLib.SOURCE_REMOVE;
        });
    }

    destruir() {
        if (this._t) {
            GLib.source_remove(this._t);
            this._t = 0;
            escribirJSON(this.file, this.datos);
        }
    }
}

export function uriDe(path) {
    return Gio.File.new_for_path(path).get_uri();
}

export function abrirUri(uri) {
    try {
        Gio.AppInfo.launch_default_for_uri(uri, global.create_app_launch_context(0, -1));
    } catch (e) {
        console.error(`[Widgets] abrir ${uri}: ${e.message}`);
    }
}

export function dirImagenes() {
    return GLib.get_user_special_dir(GLib.UserDirectory.DIRECTORY_PICTURES) ??
        GLib.build_filenamev([GLib.get_home_dir(), 'Pictures']);
}

export function listarImagenes(dir, prof = 1, limite = 2500, sinEnlaces = false) {
    const out = [];
    const attrs = 'standard::name,standard::type,standard::content-type,standard::size,time::modified,standard::is-hidden';
    const rec = (d, nivel, album) => {
        let en;
        try {
            en = Gio.File.new_for_path(d).enumerate_children(attrs,
                sinEnlaces ? Gio.FileQueryInfoFlags.NOFOLLOW_SYMLINKS : Gio.FileQueryInfoFlags.NONE, null);
        } catch (_e) {
            return;
        }
        let i;
        while ((i = en.next_file(null)) !== null && out.length < limite) {
            if (i.get_is_hidden())
                continue;
            if (sinEnlaces && i.get_file_type() !== Gio.FileType.REGULAR)
                continue;
            const p = GLib.build_filenamev([d, i.get_name()]);
            if (i.get_file_type() === Gio.FileType.DIRECTORY) {
                if (nivel < prof)
                    rec(p, nivel + 1, i.get_name());
            } else if ((i.get_content_type() ?? '').startsWith('image/')) {
                out.push({
                    path: p, album, size: Number(i.get_size()),
                    mtime: Number(i.get_attribute_uint64('time::modified')),
                });
            }
        }
        en.close(null);
    };
    rec(dir, 0, '');
    return out;
}

// ── HTTP (Soup 3) con caché en memoria ──────────────────────────────────
let _sesion = null;
const _cache = new Map();

export function http(url, {ttl = 0, binario = false} = {}) {
    const hit = _cache.get(url);
    if (ttl && hit && Date.now() - hit.t < ttl)
        return Promise.resolve(hit.v);
    _sesion ??= new Soup.Session({timeout: 15, user_agent: 'Mozilla/5.0 (X11; Linux x86_64) LintelWidgets/1.0'});
    return new Promise((resolve, reject) => {
        let msg = null;
        try {
            msg = Soup.Message.new('GET', url);
        } catch (e) {
            reject(e);
            return;
        }
        if (!msg) {
            reject(new Error('URL no válida'));
            return;
        }
        _sesion.send_and_read_async(msg, GLib.PRIORITY_DEFAULT, null, (s, r) => {
            try {
                const bytes = s.send_and_read_finish(r);
                const st = msg.get_status();
                if (st >= 400)
                    throw new Error(`HTTP ${st}`);
                const v = binario ? bytes.get_data() : new TextDecoder().decode(bytes.get_data());
                if (ttl)
                    _cache.set(url, {t: Date.now(), v});
                resolve(v);
            } catch (e) {
                reject(e);
            }
        });
    });
}

export function cerrarHttp() {
    _sesion?.abort();
    _sesion = null;
    _cache.clear();
}

// Descarga una imagen a la caché y devuelve su ruta local.
export async function imagenLocal(url) {
    if (url.startsWith('file://'))
        return Gio.File.new_for_uri(url).get_path();
    const ruta = GLib.build_filenamev([CACHE_DIR, `img-${GLib.compute_checksum_for_string(GLib.ChecksumType.MD5, url, -1)}`]);
    if (GLib.file_test(ruta, GLib.FileTest.EXISTS))
        return ruta;
    const bytes = await http(url, {binario: true});
    GLib.mkdir_with_parents(CACHE_DIR, 0o755);
    GLib.file_set_contents(ruta, bytes);
    return ruta;
}

// ── D-Bus ───────────────────────────────────────────────────────────────
export function llamar(bus, dest, ruta, iface, metodo, params = null, tipo = null, timeout = 4000) {
    return new Promise((res, rej) => {
        bus.call(dest, ruta, iface, metodo, params, tipo ? new GLib.VariantType(tipo) : null,
            Gio.DBusCallFlags.NONE, timeout, null, (c, r) => {
                try {
                    res(c.call_finish(r));
                } catch (e) {
                    rej(e);
                }
            });
    });
}

export async function props(bus, dest, ruta, iface) {
    const v = await llamar(bus, dest, ruta, 'org.freedesktop.DBus.Properties', 'GetAll',
        new GLib.Variant('(s)', [iface]), '(a{sv})');
    return v.recursiveUnpack()[0];
}

export function fijarProp(bus, dest, ruta, iface, nombre, tipo, valor) {
    return llamar(bus, dest, ruta, 'org.freedesktop.DBus.Properties', 'Set',
        new GLib.Variant('(ssv)', [iface, nombre, new GLib.Variant(tipo, valor)]));
}

// KDE Connect: dispositivos vinculados (null si no está instalado).
export async function dispositivosKde() {
    const bus = Gio.DBus.session;
    let ids;
    try {
        const r = await llamar(bus, 'org.kde.kdeconnect', '/modules/kdeconnect',
            'org.kde.kdeconnect.daemon', 'devices', new GLib.Variant('(bb)', [false, true]), '(as)');
        ids = r.recursiveUnpack()[0];
    } catch (_e) {
        return null;
    }
    const out = [];
    for (const id of ids) {
        const ruta = `/modules/kdeconnect/devices/${id}`;
        try {
            const p = await props(bus, 'org.kde.kdeconnect', ruta, 'org.kde.kdeconnect.device');
            const d = {id, ruta, nombre: p.name, tipo: p.type, alcanzable: !!p.isReachable, bateria: null, cargando: false};
            if (d.alcanzable) {
                try {
                    const b = await props(bus, 'org.kde.kdeconnect', `${ruta}/battery`, 'org.kde.kdeconnect.device.battery');
                    d.bateria = b.charge ?? null;
                    d.cargando = !!b.isCharging;
                } catch (_e) {
                    // sin plugin de batería
                }
            }
            out.push(d);
        } catch (_e) {
            // dispositivo no disponible
        }
    }
    return out;
}

// ── RSS / Atom ──────────────────────────────────────────────────────────
const ENT = {amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' '};
function decod(s) {
    return s.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (m, e) => {
        if (e[0] === '#') {
            const n = e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
            try {
                return String.fromCodePoint(n);
            } catch (_e) {
                return m;
            }
        }
        return ENT[e.toLowerCase()] ?? m;
    });
}
const sinCdata = s => s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
const texto = s => decod(sinCdata(s)).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

export function parsearFeed(xml) {
    const bloques = xml.match(/<(item|entry)[\s>][\s\S]*?<\/\1>/gi) ?? [];
    const tag = (b, n) => {
        const m = b.match(new RegExp(`<${n}(?:\\s[^>]*)?>([\\s\\S]*?)</${n}>`, 'i'));
        return m ? m[1] : '';
    };
    const attr = (b, n, a) => {
        const m = b.match(new RegExp(`<${n}\\s[^>]*?${a}=["']([^"']+)["']`, 'i'));
        return m ? decod(m[1]) : '';
    };
    const items = bloques.slice(0, 40).map(b => {
        const enlace = texto(tag(b, 'link')) || attr(b, 'link', 'href');
        const f = texto(tag(b, 'pubDate') || tag(b, 'published') || tag(b, 'updated') || tag(b, 'dc:date'));
        const fecha = f ? new Date(f) : null;
        const desc = tag(b, 'description') || tag(b, 'summary') || tag(b, 'content:encoded') || tag(b, 'content');
        let imagen = attr(b, 'media:thumbnail', 'url') || attr(b, 'media:content', 'url') ||
            (/type=["']image/i.test(b) ? attr(b, 'enclosure', 'url') : '') || attr(b, 'itunes:image', 'href');
        if (!imagen) {
            const m = decod(sinCdata(desc)).match(/<img[^>]+src=["']([^"']+)["']/i);
            imagen = m ? m[1] : '';
        }
        const enc = b.match(/<enclosure[^>]+>/i)?.[0] ?? '';
        const audio = /audio|\.mp3|\.m4a|\.ogg/i.test(enc) ? (enc.match(/url=["']([^"']+)["']/i)?.[1] ?? '') : '';
        return {
            titulo: texto(tag(b, 'title')), enlace, imagen, audio: decod(audio),
            fecha: fecha && !isNaN(fecha) ? fecha : null,
            resumen: texto(desc).slice(0, 420), duracion: texto(tag(b, 'itunes:duration')),
        };
    }).filter(i => i.titulo);
    const antes = xml.split(/<(?:item|entry)[\s>]/i)[0];
    return {
        titulo: texto(tag(antes, 'title')),
        imagen: attr(antes, 'itunes:image', 'href') || texto(tag(tag(antes, 'image'), 'url')),
        items,
    };
}

// ── Feriados de Perú ────────────────────────────────────────────────────
function pascua(y) {
    const a = y % 19, b = Math.floor(y / 100), c = y % 100;
    const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const mes = Math.floor((h + l - 7 * m + 114) / 31);
    const dia = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(y, mes - 1, dia);
}

const _feriados = new Map();
export function feriadosPeru(y) {
    if (_feriados.has(y))
        return _feriados.get(y);
    const m = new Map();
    const fijo = {
        '01-01': 'Año Nuevo', '05-01': 'Día del Trabajo', '06-07': 'Batalla de Arica y Día de la Bandera',
        '06-29': 'San Pedro y San Pablo', '07-23': 'Día de la Fuerza Aérea del Perú', '07-28': 'Fiestas Patrias',
        '07-29': 'Fiestas Patrias', '08-06': 'Batalla de Junín', '08-30': 'Santa Rosa de Lima',
        '10-08': 'Combate de Angamos', '11-01': 'Todos los Santos', '12-08': 'Inmaculada Concepción',
        '12-09': 'Batalla de Ayacucho', '12-25': 'Navidad',
    };
    for (const [k, v] of Object.entries(fijo))
        m.set(`${y}-${k}`, v);
    const p = pascua(y);
    for (const [off, n] of [[-3, 'Jueves Santo'], [-2, 'Viernes Santo']])
        m.set(iso(new Date(p.getFullYear(), p.getMonth(), p.getDate() + off)), n);
    _feriados.set(y, m);
    return m;
}
__LW_FILE_11__

# ── ARCHIVO: widgets/baterias.js ─────────────────────────────────────────
write_file widgets/baterias.js <<'__LW_FILE_12__'
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
            // dispositivo ilegible
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
            // sin UPower
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
                // Pila centrada; conectada pero en pausa no equivale a cargar.
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
__LW_FILE_12__

# ── ARCHIVO: widgets/buscar.js ───────────────────────────────────────────
write_file widgets/buscar.js <<'__LW_FILE_13__'
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
__LW_FILE_13__

# ── ARCHIVO: widgets/calendario.js ───────────────────────────────────────
write_file widgets/calendario.js <<'__LW_FILE_14__'
import Clutter from 'gi://Clutter';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import St from 'gi://St';

import {WidgetBase} from '../lib/base.js';
import {Hoja, boton, etiqueta, pedir} from '../lib/hoja.js';
import {DIAS, MESES, cap, feriadosPeru, iso, nuevoId, pad} from '../lib/util.js';

export const META = {
    id: 'calendario', nombre: 'Calendario', icono: 'x-office-calendar-symbolic',
    desc: 'Mes completo, feriados de Perú, eventos, cumpleaños de tus contactos y citas.',
    tam: {S: [170, 170], M: [380, 170], L: [380, 380]}, min: [150, 140],
    opciones: [
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
        // carpeta inexistente
    }
    return out;
}

export class Widget extends WidgetBase {
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

    // Todo lo que ocurre en una fecha ISO.
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
        const hoy = new Date();
        this._dia = hoy.getDate();
        const w = this.w;
        const h = this.h;
        const modo = h < 200 ? (w < 250 ? 'S' : 'M') : (w >= 520 ? 'XL' : 'L');
        const fila = this.fila();
        fila.y_expand = true;
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

    _mes(hoy, conLista) {
        const col = this.columna();
        col.x_expand = true;
        const cab = this.fila();
        cab.add_child(this.t(`${cap(MESES[this.mes.getMonth()])} ${this.mes.getFullYear()}`, 14, {peso: 'bold', expand: true}));
        const nav = (d, ic) => this.boton(this.icono(ic, 14), () => {
            this.mes = new Date(this.mes.getFullYear(), this.mes.getMonth() + d, 1);
            this._pintar();
        });
        cab.add_child(nav(-1, 'go-previous-symbolic'));
        cab.add_child(this.boton(this.t('Hoy', 11, {c: 'acento'}), () => {
            this.mes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
            this._pintar();
        }));
        cab.add_child(nav(1, 'go-next-symbolic'));
        col.add_child(cab);

        const grid = new St.Widget({layout_manager: new Clutter.GridLayout({column_homogeneous: true, row_homogeneous: true}), x_expand: true, y_expand: true});
        const lay = grid.layout_manager;
        const ini = this.o.lunes ? 1 : 0;
        const nombres = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
        for (let i = 0; i < 7; i++)
            lay.attach(this.t(nombres[(i + ini) % 7], 10, {c: 'texto2', align: Clutter.ActorAlign.CENTER}), i, 0, 1, 1);
        const primero = (this.mes.getDay() - ini + 7) % 7;
        const total = new Date(this.mes.getFullYear(), this.mes.getMonth() + 1, 0).getDate();
        const filas = Math.ceil((primero + total) / 7);
        for (let d = 1; d <= total; d++) {
            const pos = primero + d - 1;
            const f = `${this.mes.getFullYear()}-${pad(this.mes.getMonth() + 1)}-${pad(d)}`;
            const ev = this._eventos(f);
            const esHoy = f === iso(hoy);
            const feriado = ev.find(e => e.tipo === 'feriado');
            const celda = new St.BoxLayout({vertical: true, x_align: Clutter.ActorAlign.CENTER, y_align: Clutter.ActorAlign.CENTER, style: 'spacing: 1px;'});
            const num = this.t(String(d), 12, {
                peso: esHoy ? 'bold' : 'normal', c: esHoy ? '#ffffff' : (feriado ? 'rojo' : 'texto'),
                align: Clutter.ActorAlign.CENTER,
                extra: esHoy ? `background-color: ${this.pal.acento}; border-radius: 99px; min-width: ${this.px(22)}px; text-align: center; padding: 1px 0;` : '',
            });
            celda.add_child(num);
            const pts = new St.BoxLayout({x_align: Clutter.ActorAlign.CENTER, style: 'spacing: 2px;'});
            for (const e of ev.slice(0, 3))
                pts.add_child(new St.Widget({style: `width: 4px; height: 4px; border-radius: 2px; background-color: ${e.color};`}));
            celda.add_child(pts);
            const b = this.boton(celda, () => this._dia_(f), {expand: true});
            lay.attach(b, pos % 7, 1 + Math.floor(pos / 7), 1, 1);
        }
        void filas;
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
                const c = new St.BoxLayout({vertical: true, x_expand: true});
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
__LW_FILE_14__

# ── ARCHIVO: widgets/clima.js ────────────────────────────────────────────
write_file widgets/clima.js <<'__LW_FILE_15__'
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
__LW_FILE_15__

# ── ARCHIVO: widgets/contactos.js ────────────────────────────────────────
write_file widgets/contactos.js <<'__LW_FILE_16__'
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
            // ilegible
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
        // ruta inválida
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
            const col = new St.BoxLayout({vertical: true, x_align: Clutter.ActorAlign.CENTER, style: 'spacing: 3px;'});
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
        const lista = new St.BoxLayout({vertical: true, x_expand: true, style: 'spacing: 2px;'});
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
                const col = new St.BoxLayout({vertical: true, x_expand: true, y_align: Clutter.ActorAlign.CENTER});
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
        h.cuerpo.vertical = true;
        h.cuerpo.add_child(e);
        h.cuerpo.add_child(sc);
        h.abrir();
        e.clutter_text.grab_key_focus();
        pintar();
    }
}
__LW_FILE_16__

# ── ARCHIVO: widgets/fotos.js ────────────────────────────────────────────
write_file widgets/fotos.js <<'__LW_FILE_17__'
import Clutter from 'gi://Clutter';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import St from 'gi://St';

import {WidgetBase} from '../lib/base.js';
import {Hoja, boton} from '../lib/hoja.js';
import {dirImagenes, listarImagenes, uriDe} from '../lib/util.js';

export const META = {
    id: 'fotos', nombre: 'Fotos', icono: 'image-x-generic-symbolic', padding: 0,
    desc: 'Fotos de la carpeta Imágenes, sin subcarpetas: presentación, favoritas y recuerdos.',
    tam: {S: [170, 170], M: [380, 170], L: [380, 380]}, min: [120, 110],
    opciones: [
        {k: 'modo', t: 'sel', etq: 'Qué mostrar', ops: [['aleatoria', 'Aleatorias'], ['recuerdos', 'Recuerdos'], ['favoritas', 'Favoritas']], def: 'aleatoria'},
        {k: 'intervalo', t: 'num', etq: 'Cambiar cada', min: 3, max: 120, paso: 1, sufijo: ' s', def: 10},
        {k: 'ajuste', t: 'sel', etq: 'Ajuste', ops: [['cover', 'Rellenar'], ['contain', 'Completa']], def: 'cover'},
        {k: 'etiqueta', t: 'bool', etq: 'Mostrar etiqueta y corazón', def: true},
    ],
};

export function fotosDe() {
    return listarImagenes(dirImagenes(), 0, 3000, true);
}

// Usar el archivo original; no crear copias ni miniaturas persistentes.
function urlFoto(f) {
    return uriDe(f.path);
}

export class Widget extends WidgetBase {
    construir(box) {
        this.box = box;
        // Las opciones antiguas no deben permitir acceder a otras carpetas.
        if (this.o.modo === 'album') this.o.modo = 'aleatoria';
        delete this.o.album;
        delete this.o.carpeta;
        const raiz = new St.Widget({layout_manager: new Clutter.BinLayout(), x_expand: true, y_expand: true});
        this._a = new St.Widget({x_expand: true, y_expand: true});
        this._b = new St.Widget({x_expand: true, y_expand: true, opacity: 0});
        raiz.add_child(this._a);
        raiz.add_child(this._b);
        this._etq = new St.BoxLayout({style_class: 'lw-foto-pie', x_expand: true, y_expand: true, y_align: Clutter.ActorAlign.END, visible: !!this.o.etiqueta});
        this._txt = this.t('', 12, {c: '#ffffff', peso: 'bold', expand: true});
        this._txt.style += ' text-shadow: 0 1px 3px rgba(0,0,0,0.7);';
        this._textoStyle = this._txt.style;
        this._cor = new St.Button({style_class: 'lw-foto-cor', child: this.icono('emblem-favorite-symbolic', 16, '#ffffff'), can_focus: true});
        this._cor.connect('clicked', () => this._fav());
        this._etq.add_child(this._txt);
        this._etq.add_child(this._cor);
        raiz.add_child(this._etq);
        const clic = new St.Widget({reactive: true, x_expand: true, y_expand: true});
        clic.connect('button-press-event', (_a, ev) => {
            if (ev.get_button() === Clutter.BUTTON_PRIMARY) {
                this._visor();
                return Clutter.EVENT_STOP;
            }
            return Clutter.EVENT_PROPAGATE;
        });
        raiz.insert_child_below(clic, this._etq);
        box.add_child(raiz);

        this._frente = this._a;
        this._lista = this._armar();
        this._i = Math.floor(Math.random() * Math.max(1, this._lista.length));
        this._mostrar(false);
        this.cada(Math.max(3, this.o.intervalo) * 1000, () => this._siguiente(1));
        try {
            this._monitor = Gio.File.new_for_path(dirImagenes()).monitor_directory(Gio.FileMonitorFlags.NONE, null);
            this._monitor.connect('changed', () => {
                if (!this._vivo || this._refreshId) return;
                this._refreshId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 100, () => {
                    this._refreshId = 0;
                    if (this._vivo) {
                        this._actualizarLista();
                        this._mostrar(false);
                    }
                    return GLib.SOURCE_REMOVE;
                });
            });
        } catch (_e) {
            // La presentación vuelve a consultar la carpeta, incluso vacía.
        }
    }

    _armar() {
        let l = fotosDe();
        const modo = this.o.modo;
        if (modo === 'favoritas') {
            l = l.filter(f => this.datos.fotosFav.includes(f.path));
        } else if (modo === 'recuerdos') {
            const hoy = new Date();
            l = l.filter(f => {
                const d = new Date(f.mtime * 1000);
                const dif = Math.abs((new Date(hoy.getFullYear(), d.getMonth(), d.getDate()) - hoy) / 864e5);
                return d.getFullYear() < hoy.getFullYear() && dif <= 4;
            });
            l.sort((a, b) => a.mtime - b.mtime);
            return l;
        }
        for (let i = l.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [l[i], l[j]] = [l[j], l[i]];
        }
        return l;
    }

    _estilo(f) {
        return `background-image: url("${urlFoto(f)}"); background-size: ${this.o.ajuste}; border-radius: ${this.ctx.radio}px;`;
    }

    _mostrar(anim = true) {
        this._a.remove_all_transitions();
        this._b.remove_all_transitions();
        const f = this._lista[this._i];
        if (!f) {
            this._a.style = '';
            this._b.style = '';
            this._txt.text = this.o.modo === 'recuerdos' ? 'Aún no hay recuerdos de hoy' : 'Sin fotos en esta carpeta';
            this._txt.style = `${this._textoStyle} color: ${this.pal.texto};`;
            this._etq.visible = true;
            this._cor.visible = false;
            return;
        }
        this._etq.visible = !!this.o.etiqueta;
        this._cor.visible = true;
        this._txt.style = this._textoStyle;
        const nuevo = this._frente === this._a ? this._b : this._a;
        const viejo = this._frente;
        nuevo.style = this._estilo(f);
        this._frente = nuevo;
        if (anim) {
            nuevo.opacity = 0;
            nuevo.ease({opacity: 255, duration: 700});
            viejo.ease({opacity: 0, duration: 700, delay: 200});
        } else {
            nuevo.opacity = 255;
            viejo.opacity = 0;
            viejo.style = '';
        }
        const esFav = this.datos.fotosFav.includes(f.path);
        this._cor.style = esFav ? 'background-color: rgba(255,69,58,0.9);' : '';
        if (this.o.modo === 'recuerdos') {
            const a = new Date().getFullYear() - new Date(f.mtime * 1000).getFullYear();
            this._txt.text = `Hace ${a} ${a === 1 ? 'año' : 'años'}`;
        } else {
            this._txt.text = f.album || 'Fotos';
        }
    }

    _siguiente(d) {
        const anterior = this._lista[this._i]?.path;
        this._actualizarLista();
        if (!this._lista.length) {
            this._mostrar(false);
            return;
        }
        this._i = (this._i + d + this._lista.length) % this._lista.length;
        this._mostrar(this._lista[this._i]?.path !== anterior);
    }

    _actualizarLista() {
        const actual = this._lista[this._i]?.path;
        const nuevas = this._armar();
        const paths = new Set(nuevas.map(f => f.path));
        const porRuta = new Map(nuevas.map(f => [f.path, f]));
        // Conservar el orden de la presentación para no repetir fotos en cada consulta.
        const previas = new Set(this._lista.map(f => f.path));
        this._lista = this._lista.filter(f => paths.has(f.path)).map(f => porRuta.get(f.path))
            .concat(nuevas.filter(f => !previas.has(f.path)));
        this._i = Math.max(0, this._lista.findIndex(f => f.path === actual));
        if (!paths.has(actual)) {
            for (const actor of [this._a, this._b]) {
                actor.remove_all_transitions();
                actor.style = '';
            }
        }
        if (!paths.has(this._visorPath)) this._hoja?.cerrar();
    }

    alDestruir() {
        this._monitor?.cancel();
        this._monitor = null;
        if (this._refreshId) GLib.source_remove(this._refreshId);
        this._refreshId = 0;
        this._hoja?.cerrar();
    }

    _fav(f = this._lista[this._i]) {
        if (!f)
            return;
        const fav = this.datos.fotosFav;
        const k = fav.indexOf(f.path);
        if (k >= 0)
            fav.splice(k, 1);
        else
            fav.push(f.path);
        this.guardarDatos();
        this._mostrar(false);
    }

    _visor() {
        this._actualizarLista();
        if (!this._lista.length)
            return;
        this._hoja?.cerrar();
        const h = new Hoja(this.core, {titulo: 'Fotos', ancho: 900, alto: 640, sinScroll: true,
            alCerrar: () => { this._hoja = null; }});
        this._hoja = h;
        const img = new St.Widget({x_expand: true, y_expand: true});
        const pie = new St.BoxLayout({style: 'spacing: 8px;', x_expand: true});
        const info = new St.Label({text: '', style_class: 'lintel-ayuda', x_expand: true, y_align: Clutter.ActorAlign.CENTER});
        const mostrar = () => {
            const f = this._lista[this._i];
            if (!f || h.cerrada) return;
            this._visorPath = f.path;
            img.style = `background-image: url("${urlFoto(f)}"); background-size: contain; border-radius: 12px;`;
            info.text = `${this._i + 1} de ${this._lista.length} · ${f.path.split('/').pop()}`;
        };
        pie.add_child(boton('‹ Anterior', () => {
            this._siguiente(-1);
            mostrar();
        }));
        pie.add_child(info);
        pie.add_child(boton('♥ Favorita', () => {
            this._fav();
        }));
        pie.add_child(boton('Siguiente ›', () => {
            this._siguiente(1);
            mostrar();
        }));
        h.cuerpo.vertical = true;
        h.cuerpo.add_child(img);
        h.cuerpo.add_child(pie);
        h.abrir();
        mostrar();
    }
}
__LW_FILE_17__

# ── ARCHIVO: widgets/index.js ────────────────────────────────────────────
write_file widgets/index.js <<'__LW_FILE_18__'
import * as clima from './clima.js';
import * as calendario from './calendario.js';
import * as reloj from './reloj.js';
import * as baterias from './baterias.js';
import * as recordatorios from './recordatorios.js';
import * as notas from './notas.js';
import * as fotos from './fotos.js';
import * as musica from './musica.js';
import * as podcasts from './podcasts.js';
import * as contactos from './contactos.js';
import * as buscar from './buscar.js';
import * as noticias from './noticias.js';
import * as tiempouso from './tiempouso.js';

// Orden de la galería «Añadir widget».
export const LISTA = [clima, calendario, reloj, baterias, recordatorios, notas, fotos, musica,
    podcasts, contactos, buscar, noticias, tiempouso];
export const MODULOS = Object.fromEntries(LISTA.map(m => [m.META.id, m]));
__LW_FILE_18__

# ── ARCHIVO: widgets/musica.js ───────────────────────────────────────────
write_file widgets/musica.js <<'__LW_FILE_19__'
import Clutter from 'gi://Clutter';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import St from 'gi://St';

import {Slider} from 'resource:///org/gnome/shell/ui/slider.js';

import {WidgetBase} from '../lib/base.js';
import {fijarProp, imagenLocal, llamar, props, uriDe} from '../lib/util.js';

export const META = {
    id: 'musica', nombre: 'Música', icono: 'audio-x-generic-symbolic',
    desc: 'Controla cualquier reproductor compatible con MPRIS: portada, canción, artista, pausa y volumen.',
    tam: {S: [170, 170], M: [380, 170], L: [380, 380]}, min: [150, 130],
    opciones: [
        {k: 'volumen', t: 'bool', etq: 'Mostrar control de volumen', def: true},
        {k: 'progreso', t: 'bool', etq: 'Mostrar barra de progreso', def: true},
    ],
};

const IFACE = 'org.mpris.MediaPlayer2.Player';
const RUTA = '/org/mpris/MediaPlayer2';
const fmt = us => {
    const s = Math.max(0, Math.floor(us / 1e6));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

export class Widget extends WidgetBase {
    construir(box) {
        this.box = box;
        this._bus = Gio.DBus.session;
        this._subs = [];
        this._p = null;
        this._pintar();
        const refrescar = () => {
            if (this._deb)
                return;
            this._deb = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 150, () => {
                this._deb = 0;
                if (this._vivo)
                    this._buscar();
                return GLib.SOURCE_REMOVE;
            });
        };
        this._subs.push(this._bus.signal_subscribe(null, 'org.freedesktop.DBus.Properties', 'PropertiesChanged', RUTA, null, Gio.DBusSignalFlags.NONE, refrescar));
        this._subs.push(this._bus.signal_subscribe('org.freedesktop.DBus', 'org.freedesktop.DBus', 'NameOwnerChanged', '/org/freedesktop/DBus', null, Gio.DBusSignalFlags.NONE, refrescar));
        this._buscar();
        this.cada(1000, () => this._pos());
    }

    alDestruir() {
        for (const s of this._subs)
            this._bus.signal_unsubscribe(s);
        if (this._deb)
            GLib.source_remove(this._deb);
    }

    async _buscar() {
        try {
            const r = await llamar(this._bus, 'org.freedesktop.DBus', '/org/freedesktop/DBus', 'org.freedesktop.DBus', 'ListNames', null, '(as)');
            const nombres = r.recursiveUnpack()[0].filter(n => n.startsWith('org.mpris.MediaPlayer2.'));
            let mejor = null;
            for (const n of nombres) {
                try {
                    const p = await props(this._bus, n, RUTA, IFACE);
                    const c = {n, estado: p.PlaybackStatus, meta: p.Metadata ?? {}, vol: p.Volume ?? 1};
                    if (!mejor || (c.estado === 'Playing' && mejor.estado !== 'Playing'))
                        mejor = c;
                } catch (_e) {
                    // reproductor no responde
                }
            }
            if (!this._vivo)
                return;
            const igual = JSON.stringify([mejor?.n, mejor?.estado, mejor?.meta?.['xesam:title']]) ===
                JSON.stringify([this._p?.n, this._p?.estado, this._p?.meta?.['xesam:title']]);
            this._p = mejor;
            if (mejor)
                this._pos();
            if (!igual)
                this._pintar();
        } catch (_e) {
            this._p = null;
        }
    }

    async _pos() {
        if (!this._p || !this._barra)
            return;
        try {
            const v = await llamar(this._bus, this._p.n, RUTA, 'org.freedesktop.DBus.Properties', 'Get', new GLib.Variant('(ss)', [IFACE, 'Position']), '(v)');
            const pos = Number(v.recursiveUnpack()[0]);
            const len = Number(this._p.meta['mpris:length'] ?? 0);
            if (!this._vivo || !this._barra)
                return;
            this._barra.style = `height: 4px; border-radius: 2px; background-color: ${this.pal.acento}; width: ${len ? Math.round(Math.min(1, pos / len) * this._anchoBarra) : 0}px;`;
            this._tiempo?.set_text(`${fmt(pos)} / ${len ? fmt(len) : '--:--'}`);
        } catch (_e) {
            // sin posición
        }
    }

    _ctl(m) {
        if (this._p)
            llamar(this._bus, this._p.n, RUTA, IFACE, m).then(() => this._buscar()).catch(() => {});
    }

    _pintar() {
        this.box.destroy_all_children();
        this._barra = null;
        const p = this._p;
        if (!p) {
            const c = new St.BoxLayout({vertical: true, x_expand: true, y_expand: true, y_align: Clutter.ActorAlign.CENTER, style: 'spacing: 6px;'});
            c.add_child(this.icono('audio-x-generic-symbolic', 34, 'texto2'));
            c.add_child(this.t('Nada en reproducción', 14, {peso: 'bold', align: Clutter.ActorAlign.CENTER}));
            c.add_child(this.t('Abre un reproductor compatible', 11, {c: 'texto2', align: Clutter.ActorAlign.CENTER}));
            this.box.add_child(c);
            return;
        }
        const m = p.meta;
        const titulo = m['xesam:title'] ?? 'Sin título';
        const artista = [].concat(m['xesam:artist'] ?? []).join(', ') || p.n.replace('org.mpris.MediaPlayer2.', '');
        const compacto = this.h < 200 && this.w < 250;
        const grande = this.h >= 280;
        const lado = Math.min(this.px(grande ? 220 : 96), this.w - 8);

        const portada = new St.Widget({
            width: lado, height: lado, style: `border-radius: ${Math.max(8, this.ctx.radio - 10)}px; background-color: ${this.pal.superficie};`,
            layout_manager: new Clutter.BinLayout(),
        });
        portada.add_child(new St.Icon({icon_name: 'audio-x-generic-symbolic', icon_size: Math.round(lado / 3), x_align: Clutter.ActorAlign.CENTER, y_align: Clutter.ActorAlign.CENTER, style: `color: ${this.pal.texto2};`}));
        const art = m['mpris:artUrl'];
        if (art) {
            imagenLocal(art).then(r => {
                if (this._vivo && r)
                    portada.style = `border-radius: ${Math.max(8, this.ctx.radio - 10)}px; background-image: url("${uriDe(r)}"); background-size: cover;`;
            }).catch(() => {});
        }

        const info = this.columna();
        info.y_align = Clutter.ActorAlign.CENTER;
        info.add_child(this.t(titulo, compacto ? 13 : 15, {peso: 'bold'}));
        info.add_child(this.t(artista, 12, {c: 'texto2'}));
        if (m['xesam:album'] && !compacto)
            info.add_child(this.t(m['xesam:album'], 11, {c: 'texto2'}));

        const ctl = this.fila(`padding-top: ${this.px(4)}px;`);
        ctl.x_align = grande ? Clutter.ActorAlign.CENTER : Clutter.ActorAlign.START;
        ctl.x_expand = true;
        const b = (ic, m_, tam) => this.boton(this.icono(ic, tam), () => this._ctl(m_));
        ctl.add_child(b('media-skip-backward-symbolic', 'Previous', 18));
        ctl.add_child(b(p.estado === 'Playing' ? 'media-playback-pause-symbolic' : 'media-playback-start-symbolic', 'PlayPause', 26));
        ctl.add_child(b('media-skip-forward-symbolic', 'Next', 18));

        if (grande) {
            this.box.add_child(portada);
            portada.x_align = Clutter.ActorAlign.CENTER;
            this.box.add_child(info);
            info.add_child(new St.Widget({height: 2}));
            this._progreso(this.box);
            this.box.add_child(ctl);
            this._volumen(this.box);
        } else {
            const fila = this.fila();
            fila.y_expand = true;
            fila.add_child(portada);
            info.x_expand = true;
            info.add_child(ctl);
            fila.add_child(info);
            this.box.add_child(fila);
            if (this.h >= 150 && !compacto)
                this._progreso(this.box);
        }
    }

    _progreso(box) {
        if (!this.o.progreso)
            return;
        const ancho = Math.max(80, this.w - 4);
        this._anchoBarra = ancho;
        const pista = new St.Widget({style: `height: 4px; border-radius: 2px; background-color: ${this.pal.superficie};`, x_expand: true, layout_manager: new Clutter.BinLayout()});
        this._barra = new St.Widget({x_align: Clutter.ActorAlign.START, style: 'height: 4px; width: 0px;'});
        pista.add_child(this._barra);
        box.add_child(pista);
        this._tiempo = this.t('', 10, {c: 'texto2', align: Clutter.ActorAlign.END});
        box.add_child(this._tiempo);
    }

    _volumen(box) {
        if (!this.o.volumen)
            return;
        const f = this.fila();
        f.add_child(this.icono('audio-volume-low-symbolic', 14, 'texto2'));
        const s = new Slider(Math.min(1, this._p.vol));
        s.x_expand = true;
        s.connect('notify::value', () => fijarProp(this._bus, this._p.n, RUTA, IFACE, 'Volume', 'd', s.value).catch(() => {}));
        f.add_child(s);
        f.add_child(this.icono('audio-volume-high-symbolic', 14, 'texto2'));
        box.add_child(f);
    }
}
__LW_FILE_19__

# ── ARCHIVO: widgets/notas.js ────────────────────────────────────────────
write_file widgets/notas.js <<'__LW_FILE_20__'
import Clutter from 'gi://Clutter';
import GLib from 'gi://GLib';
import St from 'gi://St';

import {WidgetBase} from '../lib/base.js';
import {Hoja, boton, campo, elegirImagen, etiqueta, muestras} from '../lib/hoja.js';
import {dirImagenes, hex255, listarImagenes, nuevoId, uriDe} from '../lib/util.js';

export const META = {
    id: 'notas', nombre: 'Notas', icono: 'document-edit-symbolic',
    desc: 'Notas rápidas con colores, imágenes y guardado automático mientras escribes.',
    tam: {S: [170, 170], M: [380, 170], L: [380, 380]}, min: [140, 120],
    opciones: [
        {k: 'nota', t: 'texto', etq: 'ID de nota fija (vacío = la más reciente)', ph: '', def: ''},
    ],
};

const COLORES = ['#ffd60a', '#ff9f0a', '#ff6b6b', '#30d158', '#0a84ff', '#bf5af2', '#98989d'];

export class Widget extends WidgetBase {
    construir(box) {
        this.box = box;
        this._pintar();
    }

    _nota() {
        const n = this.datos.notas;
        return n.find(x => x.id === this.o.nota) ?? [...n].sort((a, b) => b.mod - a.mod)[0] ?? null;
    }

    _pintar() {
        this.box.destroy_all_children();
        const n = this._nota();
        const tarjeta = new St.BoxLayout({vertical: true, x_expand: true, y_expand: true, style: `spacing: ${this.px(4)}px;`});
        let cuerpo;
        if (!n) {
            cuerpo = this.columna();
            cuerpo.add_child(this.t('Sin notas', 15, {peso: 'bold'}));
            cuerpo.add_child(this.t('Toca para crear una nota', 12, {c: 'texto2'}));
            tarjeta.style = `padding: ${this.px(10)}px; border-radius: ${Math.max(8, this.ctx.radio - 8)}px; background-color: ${this.pal.superficie};`;
        } else {
            const [r, g, b] = hex255(n.color);
            tarjeta.style = `padding: ${this.px(10)}px; border-radius: ${Math.max(8, this.ctx.radio - 8)}px; background-color: rgba(${r},${g},${b},${this.pal.oscuro ? 0.26 : 0.36}); border-left: 4px solid ${n.color};`;
            const lineas = n.texto.split('\n');
            cuerpo = this.columna();
            cuerpo.add_child(this.t(lineas[0] || 'Nota sin título', 15, {peso: 'bold'}));
            const resto = lineas.slice(1).join('\n').trim();
            if (resto) {
                const l = this.t(resto, 12, {c: 'texto2', ellipsis: true});
                l.clutter_text.line_wrap = true;
                l.clutter_text.line_wrap_mode = 2;
                l.clutter_text.ellipsize = 3;
                cuerpo.add_child(l);
            }
            if (n.imgs?.length && this.h > 170) {
                const fila = this.fila(`padding-top: ${this.px(6)}px;`);
                for (const p of n.imgs.slice(0, 4)) {
                    fila.add_child(new St.Widget({style: `width: ${this.px(54)}px; height: ${this.px(54)}px; border-radius: 8px; background-image: url("${uriDe(p)}"); background-size: cover;`}));
                }
                cuerpo.add_child(fila);
            }
        }
        tarjeta.add_child(cuerpo);
        tarjeta.add_child(new St.Widget({y_expand: true}));
        const b = this.boton(tarjeta, () => this._editor(n?.id ?? null), {expand: true});
        b.y_expand = true;
        this.box.add_child(b);
    }

    _editor(idInicial) {
        const notas = this.datos.notas;
        let actual = notas.find(x => x.id === idInicial);
        if (!actual) {
            actual = {id: nuevoId(), texto: '', color: COLORES[0], imgs: [], mod: Date.now()};
            notas.push(actual);
        }
        let timer = 0;
        const guardar = () => {
            if (timer) {
                GLib.source_remove(timer);
                timer = 0;
            }
            actual.mod = Date.now();
            this.guardarDatos();
            this.core.refrescarTipo('notas');
        };
        const h = new Hoja(this.core, {
            titulo: 'Notas', ancho: 680, alto: 600, sinScroll: true,
            alCerrar: () => {
                if (timer)
                    guardar();
                const i = notas.indexOf(actual);
                if (!actual.texto.trim() && !actual.imgs.length && i >= 0) {
                    notas.splice(i, 1);
                    this.guardarDatos();
                    this.core.refrescarTipo('notas');
                }
            },
        });
        const cont = h.cuerpo;
        const dibujar = () => {
            cont.destroy_all_children();
            const barra = new St.BoxLayout({style: 'spacing: 8px;', x_expand: true});
            const orden = [...notas].sort((a, b) => b.mod - a.mod);
            const i = orden.indexOf(actual);
            barra.add_child(boton('‹', () => {
                if (i < orden.length - 1) {
                    actual = orden[i + 1];
                    dibujar();
                }
            }));
            barra.add_child(etiqueta(`${i + 1} de ${orden.length}`, 'lintel-ayuda'));
            barra.add_child(boton('›', () => {
                if (i > 0) {
                    actual = orden[i - 1];
                    dibujar();
                }
            }));
            barra.add_child(new St.Widget({x_expand: true}));
            barra.add_child(muestras(actual.color, c => {
                actual.color = c;
                guardar();
            }, COLORES, false));
            cont.add_child(barra);
            const e = campo(actual.texto, 'Escribe tu nota…', v => {
                actual.texto = v;
                if (timer)
                    GLib.source_remove(timer);
                timer = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 450, () => {
                    timer = 0;
                    guardar();
                    return GLib.SOURCE_REMOVE;
                });
            }, {multi: true, ancho: 640, alto: 270});
            e.x_expand = true;
            cont.add_child(e);
            const imgs = new St.BoxLayout({style: 'spacing: 8px;', x_expand: true});
            for (const p of actual.imgs) {
                const b = new St.Button({style_class: 'lintel-thumb', style: `background-image: url("${uriDe(p)}"); background-size: cover; width: 70px; height: 70px;`});
                b.connect('clicked', () => {
                    actual.imgs = actual.imgs.filter(x => x !== p);
                    guardar();
                    dibujar();
                });
                imgs.add_child(b);
            }
            cont.add_child(imgs);
            if (actual.imgs.length)
                cont.add_child(etiqueta('Toca una imagen para quitarla.', 'lintel-ayuda'));
            const pie = new St.BoxLayout({style: 'spacing: 8px;', x_expand: true});
            pie.add_child(boton('＋ Imagen', () => {
                elegirImagen(this.core, listarImagenes(dirImagenes(), 1, 150).map(x => x.path), p => {
                    actual.imgs.push(p);
                    guardar();
                    dibujar();
                });
            }));
            pie.add_child(boton('Nueva nota', () => {
                guardar();
                actual = {id: nuevoId(), texto: '', color: COLORES[0], imgs: [], mod: Date.now()};
                notas.push(actual);
                dibujar();
            }));
            pie.add_child(new St.Widget({x_expand: true}));
            pie.add_child(boton('Eliminar nota', () => {
                const k = notas.indexOf(actual);
                if (k >= 0)
                    notas.splice(k, 1);
                this.guardarDatos();
                this.core.refrescarTipo('notas');
                h.cerrar();
            }, 'lintel-btn lintel-btn-danger'));
            cont.add_child(pie);
        };
        h.abrir();
        dibujar();
    }
}
void Clutter;
__LW_FILE_20__

# ── ARCHIVO: widgets/noticias.js ─────────────────────────────────────────
write_file widgets/noticias.js <<'__LW_FILE_21__'
import Clutter from 'gi://Clutter';
import St from 'gi://St';

import {WidgetBase} from '../lib/base.js';
import {Hoja, boton, etiqueta} from '../lib/hoja.js';
import {abrirUri, haceTiempo, http, imagenLocal, parsearFeed, uriDe} from '../lib/util.js';

export const META = {
    id: 'noticias', nombre: 'Noticias', icono: 'news-subscribe-symbolic',
    desc: 'Titulares de Perú y el mundo, tecnología, deportes y tus propios canales RSS.',
    tam: {S: [170, 170], M: [380, 170], L: [380, 380]}, min: [160, 130],
    opciones: [
        {k: 'categoria', t: 'sel', etq: 'Categoría', ops: [['peru', 'Perú'], ['mundo', 'Mundo'], ['tecnologia', 'Tecnología'], ['deportes', 'Deportes'], ['personal', 'Mis canales']], def: 'peru'},
        {k: 'personal', t: 'area', etq: 'Mis canales (Nombre|URL por línea)', ph: 'Mi blog|https://sitio.com/feed', def: ''},
        {k: 'imagenes', t: 'bool', etq: 'Mostrar imágenes', def: true},
    ],
};

const FEEDS = {
    peru: [['RPP', 'https://rpp.pe/feed'], ['Infobae Perú', 'https://www.infobae.com/arc/outboundfeeds/rss/category/peru/'], ['La República', 'https://larepublica.pe/rss/']],
    mundo: [['BBC Mundo', 'https://feeds.bbci.co.uk/mundo/rss.xml'], ['El País', 'https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/portada']],
    tecnologia: [['Xataka', 'https://feeds.weblogssl.com/xataka2'], ['Genbeta', 'https://feeds.weblogssl.com/genbeta']],
    deportes: [['ESPN Deportes', 'https://espndeportes.espn.com/espn/rss/news'], ['Marca', 'https://e00-marca.uecdn.es/rss/portada.xml']],
};

const NOMBRES = {peru: 'Perú', mundo: 'Mundo', tecnologia: 'Tecnología', deportes: 'Deportes', personal: 'Mis canales'};

export class Widget extends WidgetBase {
    construir(box) {
        this.box = box;
        this._items = null;
        this._pintar();
        this.cada(20 * 60 * 1000, () => this._cargar(), true);
    }

    _feeds() {
        if (this.o.categoria === 'personal') {
            return this.o.personal.split('\n').map(l => l.split('|').map(s => s.trim())).filter(p => p[1]?.startsWith('http'));
        }
        return FEEDS[this.o.categoria] ?? [];
    }

    async _cargar() {
        const feeds = this._feeds();
        const res = await Promise.allSettled(feeds.map(f => http(f[1], {ttl: 10 * 60 * 1000})));
        const items = [];
        res.forEach((r, i) => {
            if (r.status !== 'fulfilled')
                return;
            try {
                for (const e of parsearFeed(r.value).items.slice(0, 8))
                    items.push({...e, fuente: feeds[i][0]});
            } catch (_e) {
                // feed ilegible
            }
        });
        items.sort((a, b) => (b.fecha?.getTime() ?? 0) - (a.fecha?.getTime() ?? 0));
        if (!this._vivo)
            return;
        this._items = items;
        this._pintar();
    }

    _leer(e) {
        const h = new Hoja(this.core, {titulo: e.fuente, ancho: 560});
        const t = etiqueta(e.titulo, 'lintel-h1', {x_expand: true});
        t.clutter_text.line_wrap = true;
        t.clutter_text.ellipsize = 0;
        h.cuerpo.add_child(t);
        h.cuerpo.add_child(etiqueta(haceTiempo(e.fecha), 'lintel-ayuda'));
        const r = etiqueta(e.resumen || 'Sin resumen disponible.', 'lintel-lbl', {x_expand: true});
        r.clutter_text.line_wrap = true;
        r.clutter_text.ellipsize = 0;
        h.cuerpo.add_child(r);
        h.cuerpo.add_child(boton('Leer en el navegador', () => {
            h.cerrar();
            abrirUri(e.enlace);
        }, 'lintel-btn lintel-btn-primary'));
        h.abrir();
    }

    _pintar() {
        this.box.destroy_all_children();
        const cab = this.fila();
        cab.add_child(this.t(`Noticias · ${NOMBRES[this.o.categoria]}`, 13, {peso: 'bold', expand: true}));
        cab.add_child(this.boton(this.icono('view-refresh-symbolic', 14, 'texto2'), () => {
            this._items = null;
            this._pintar();
            this._cargar();
        }));
        this.box.add_child(cab);
        if (!this._items) {
            this.box.add_child(this.t('Cargando titulares…', 12, {c: 'texto2'}));
            return;
        }
        if (!this._items.length) {
            this.box.add_child(this.t(this._feeds().length ? 'Sin conexión o canales no disponibles.' : 'Añade canales en los ajustes del widget.', 11, {c: 'texto2'}));
            return;
        }
        const conImg = this.o.imagenes && this.w >= 320;
        const alto = this.px(conImg ? 58 : 44);
        const n = Math.max(1, Math.floor((this.h - this.px(34)) / alto));
        for (const e of this._items.slice(0, n)) {
            const f = this.fila(`padding: ${this.px(4)}px 0;`);
            const c = this.columna();
            c.y_align = Clutter.ActorAlign.CENTER;
            const tt = this.t(e.titulo.length > 95 ? `${e.titulo.slice(0, 92)}…` : e.titulo, 12, {peso: 'bold'});
            tt.clutter_text.line_wrap = true;
            tt.clutter_text.line_wrap_mode = 2;
            tt.clutter_text.ellipsize = 3;
            c.add_child(tt);
            c.add_child(this.t(`${e.fuente} · ${haceTiempo(e.fecha)}`, 10, {c: 'texto2'}));
            f.add_child(c);
            if (conImg && e.imagen) {
                const th = new St.Widget({style: `width: ${this.px(64)}px; height: ${this.px(46)}px; border-radius: 8px; background-color: ${this.pal.superficie};`});
                imagenLocal(e.imagen).then(r => {
                    if (this._vivo)
                        th.style = `width: ${this.px(64)}px; height: ${this.px(46)}px; border-radius: 8px; background-image: url("${uriDe(r)}"); background-size: cover;`;
                }).catch(() => {});
                f.add_child(th);
            }
            this.box.add_child(this.boton(f, () => this._leer(e), {expand: true}));
        }
    }
}
__LW_FILE_21__

# ── ARCHIVO: widgets/podcasts.js ─────────────────────────────────────────
write_file widgets/podcasts.js <<'__LW_FILE_22__'
import Clutter from 'gi://Clutter';
import Gio from 'gi://Gio';
import St from 'gi://St';

import {WidgetBase} from '../lib/base.js';
import {Hoja, boton, etiqueta, pedir} from '../lib/hoja.js';
import {abrirUri, haceTiempo, http, imagenLocal, parsearFeed, uriDe} from '../lib/util.js';

export const META = {
    id: 'podcasts', nombre: 'Podcasts', icono: 'audio-input-microphone-symbolic',
    desc: 'Episodios de tus feeds RSS, marca de novedades y reproducción con mpv (o tu reproductor).',
    tam: {S: [170, 170], M: [380, 170], L: [380, 380]}, min: [150, 130],
    opciones: [
        {k: 'reproductor', t: 'texto', etq: 'Reproductor', ph: 'mpv', def: 'mpv', ayuda: 'Se ejecuta como: reproductor --no-video URL. Si falla, se abre con el navegador.'},
        {k: 'max', t: 'num', etq: 'Episodios por podcast', min: 1, max: 10, paso: 1, def: 3},
    ],
};

const SUGERIDOS = [
    {nombre: 'The Daily', url: 'https://feeds.simplecast.com/54nAGcIl'},
    {nombre: 'Radio Ambulante', url: 'https://feeds.npr.org/510315/podcast.xml'},
];

let proceso = null;

export class Widget extends WidgetBase {
    construir(box) {
        this.box = box;
        this._eps = null;
        this._pintar();
        this.cada(20 * 60 * 1000, () => this._cargar(), true);
    }

    async _cargar() {
        const feeds = this.datos.feedsPodcast;
        const res = await Promise.allSettled(feeds.map(f => http(f.url, {ttl: 15 * 60 * 1000})));
        const eps = [];
        res.forEach((r, i) => {
            if (r.status !== 'fulfilled')
                return;
            try {
                const feed = parsearFeed(r.value);
                for (const e of feed.items.slice(0, this.o.max)) {
                    if (e.audio)
                        eps.push({...e, show: feeds[i].nombre, feed: feeds[i].url, img: feed.imagen});
                }
            } catch (_e) {
                // feed ilegible
            }
        });
        eps.sort((a, b) => (b.fecha?.getTime() ?? 0) - (a.fecha?.getTime() ?? 0));
        if (!this._vivo)
            return;
        this._eps = eps;
        this._pintar();
    }

    _nuevo(e) {
        const visto = this.datos.podVistos[e.feed];
        return e.fecha && (!visto || e.fecha.getTime() > visto);
    }

    _reproducir(e) {
        this.datos.podVistos[e.feed] = Math.max(this.datos.podVistos[e.feed] ?? 0, ...this._eps.filter(x => x.feed === e.feed).map(x => x.fecha?.getTime() ?? 0));
        this.guardarDatos();
        this._parar();
        try {
            const cmd = (this.o.reproductor || 'mpv').trim().split(/\s+/);
            proceso = Gio.Subprocess.new([...cmd, '--no-video', e.audio], Gio.SubprocessFlags.NONE);
            this._sonando = e.audio;
        } catch (_e) {
            abrirUri(e.audio);
        }
        this._pintar();
    }

    _parar() {
        try {
            proceso?.force_exit();
        } catch (_e) {
            // ya terminó
        }
        proceso = null;
        this._sonando = null;
    }

    _gestionar() {
        const h = new Hoja(this.core, {titulo: 'Podcasts', ancho: 520});
        const pintar = () => {
            h.cuerpo.destroy_all_children();
            if (!this.datos.feedsPodcast.length)
                h.cuerpo.add_child(etiqueta('Aún no tienes podcasts. Añade un feed RSS o usa los sugeridos.', 'lintel-ayuda'));
            for (const f of this.datos.feedsPodcast) {
                const fila = new St.BoxLayout({style: 'spacing: 8px;', x_expand: true});
                const c = new St.BoxLayout({vertical: true, x_expand: true});
                c.add_child(etiqueta(f.nombre, 'lintel-card-t'));
                c.add_child(etiqueta(f.url, 'lintel-ayuda'));
                fila.add_child(c);
                fila.add_child(boton('Quitar', () => {
                    this.datos.feedsPodcast = this.datos.feedsPodcast.filter(x => x !== f);
                    this.guardarDatos();
                    pintar();
                    this.core.refrescarTipo('podcasts');
                }, 'lintel-btn lintel-btn-danger'));
                h.cuerpo.add_child(fila);
            }
            const pie = new St.BoxLayout({style: 'spacing: 8px;'});
            pie.add_child(boton('＋ Añadir feed', () => pedir(this.core, {
                titulo: 'Nuevo podcast', ok: 'Añadir',
                campos: [{k: 'nombre', etq: 'Nombre', ph: 'Mi podcast'}, {k: 'url', etq: 'URL del feed RSS', ph: 'https://…'}],
                cb: v => {
                    if (!v.url.trim().startsWith('http'))
                        return;
                    this.datos.feedsPodcast.push({nombre: v.nombre.trim() || 'Podcast', url: v.url.trim()});
                    this.guardarDatos();
                    this.core.refrescarTipo('podcasts');
                },
            }), 'lintel-btn lintel-btn-primary'));
            pie.add_child(boton('Añadir sugeridos', () => {
                for (const s of SUGERIDOS) {
                    if (!this.datos.feedsPodcast.some(f => f.url === s.url))
                        this.datos.feedsPodcast.push({...s});
                }
                this.guardarDatos();
                pintar();
                this.core.refrescarTipo('podcasts');
            }));
            h.cuerpo.add_child(pie);
        };
        h.abrir();
        pintar();
    }

    _pintar() {
        this.box.destroy_all_children();
        const cab = this.fila();
        cab.add_child(this.t('Podcasts', 15, {peso: 'bold', expand: true}));
        if (this._sonando)
            cab.add_child(this.boton(this.icono('media-playback-stop-symbolic', 16, 'rojo'), () => {
                this._parar();
                this._pintar();
            }));
        cab.add_child(this.boton(this.icono('emblem-system-symbolic', 15, 'texto2'), () => this._gestionar()));
        this.box.add_child(cab);

        if (!this.datos.feedsPodcast.length) {
            this.box.add_child(this.t('Añade tu primer podcast', 12, {c: 'texto2', extra: 'padding-top: 8px;'}));
            this.box.add_child(this.boton(this.t('Gestionar podcasts', 12, {c: 'acento', peso: 'bold'}), () => this._gestionar()));
            return;
        }
        if (!this._eps) {
            this.box.add_child(this.t('Cargando episodios…', 12, {c: 'texto2'}));
            return;
        }
        const n = Math.max(1, Math.floor((this.h - this.px(40)) / this.px(44)));
        for (const e of this._eps.slice(0, n)) {
            const f = this.fila(`padding: ${this.px(4)}px 0;`);
            const sonando = this._sonando === e.audio;
            const play = new St.Widget({style: `width: ${this.px(34)}px; height: ${this.px(34)}px; border-radius: ${this.px(8)}px; background-color: ${this.pal.superficie};`, layout_manager: new Clutter.BinLayout()});
            if (e.img) {
                imagenLocal(e.img).then(r => {
                    if (this._vivo)
                        play.style = `width: ${this.px(34)}px; height: ${this.px(34)}px; border-radius: ${this.px(8)}px; background-image: url("${uriDe(r)}"); background-size: cover;`;
                }).catch(() => {});
            }
            f.add_child(play);
            const c = this.columna();
            c.y_align = Clutter.ActorAlign.CENTER;
            c.add_child(this.t(e.titulo, 12, {peso: this._nuevo(e) ? 'bold' : 'normal'}));
            c.add_child(this.t(`${e.show} · ${haceTiempo(e.fecha)}${this._nuevo(e) ? ' · Nuevo' : ''}`, 10, {c: this._nuevo(e) ? 'acento' : 'texto2'}));
            f.add_child(c);
            f.add_child(this.icono(sonando ? 'media-playback-stop-symbolic' : 'media-playback-start-symbolic', 16, 'acento'));
            this.box.add_child(this.boton(f, () => sonando ? (this._parar(), this._pintar()) : this._reproducir(e), {expand: true}));
        }
    }
}
__LW_FILE_22__

# ── ARCHIVO: widgets/recordatorios.js ────────────────────────────────────
write_file widgets/recordatorios.js <<'__LW_FILE_23__'
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
__LW_FILE_23__

# ── ARCHIVO: widgets/reloj.js ────────────────────────────────────────────
write_file widgets/reloj.js <<'__LW_FILE_24__'
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
__LW_FILE_24__

# ── ARCHIVO: widgets/tiempouso.js ────────────────────────────────────────
write_file widgets/tiempouso.js <<'__LW_FILE_25__'
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

// Servicio: cuenta segundos de la app enfocada mientras haya actividad.
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
            const col = new St.BoxLayout({vertical: true, style: 'spacing: 3px;', y_align: Clutter.ActorAlign.END});
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
__LW_FILE_25__

# ── Verificación ──────────────────────────────────────────────────────────
verificar() {
    local f
    while IFS= read -r -d '' f; do
        cp -- "${f}" "${WORKDIR}/comprobar.mjs"
        node --check "${WORKDIR}/comprobar.mjs" || { printf 'Error de sintaxis en %s\n' "${f}" >&2; exit 1; }
    done < <(find "${SOURCE_DIR}" -name '*.js' -print0)
    python3 - "${SOURCE_DIR}" <<'__PY__'
import json, pathlib, sys
import xml.dom.minidom as md

raiz = pathlib.Path(sys.argv[1])
json.loads((raiz / 'metadata.json').read_text())
for p in list(raiz.rglob('*.svg')) + list(raiz.rglob('*.gschema.xml')):
    md.parse(str(p))
print('Sintaxis correcta: 21 archivos JS, metadata, esquema e iconos.')
__PY__
}

verificar
glib-compile-schemas --strict "${SOURCE_DIR}/schemas"

if [[ "${MODE}" == '--verificar' ]]; then
    exit 0
fi

# ── Instalación ───────────────────────────────────────────────────────────
if [[ -d "${DESTINATION}" ]]; then
    mkdir -p -- "${BACKUP_ROOT}"
    backup="${BACKUP_ROOT}/${UUID}-$(date +%Y%m%d-%H%M%S)"
    cp -a -- "${DESTINATION}" "${backup}"
    printf 'Respaldo de la versión anterior: %s\n' "${backup}"
    rm -rf -- "${DESTINATION}"
fi

mkdir -p -- "${DESTINATION}"
cp -a -- "${SOURCE_DIR}/." "${DESTINATION}/"

if command -v glib-compile-schemas >/dev/null 2>&1; then
    glib-compile-schemas "${DESTINATION}/schemas"
else
    printf 'Aviso: falta glib-compile-schemas; el atajo de teclado no funcionará.\n' >&2
    printf '       En Fedora: sudo dnf install glib2-devel   (el menú de la barra sí funciona)\n' >&2
fi

gnome-extensions enable "${UUID}" 2>/dev/null || true
# Las extensiones nuevas pueden no estar registradas en esta sesión Wayland.
# Dejar activación persistente sin sobrescribir las otras extensiones del usuario.
gjs -c '
const Gio = imports.gi.Gio;
const settings = new Gio.Settings({schema_id: "org.gnome.shell"});
const uuid = "lintel-widgets@local";
const enabled = settings.get_strv("enabled-extensions");
if (!enabled.includes(uuid)) settings.set_strv("enabled-extensions", [...enabled, uuid]);
settings.set_strv("disabled-extensions", settings.get_strv("disabled-extensions").filter(id => id !== uuid));
Gio.Settings.sync();
'

cat <<'__FIN__'

Listo. Widgets del Escritorio quedó instalada.

En Wayland, GNOME solo detecta extensiones nuevas o modificadas al iniciar sesión:
cierra sesión y vuelve a entrar. Después:

  • Icono de cuadrícula en la barra superior → Modo de edición / Añadir widget… / Ajustes…
  • Atajo del modo de edición: Super + Alt + E
  • En edición: arrastra para mover, tira de cualquier esquina para cambiar el tamaño
    (Alt = sin imanes) y usa la barra sobre cada widget: Quitar, Ajustes, Vidrio/Sólido, Duplicar.
  • Clic derecho sobre un widget (fuera de edición) para cambiar estilo y tamaño rápido.

Datos y ajustes: ~/.config/lintel-widgets/   (config.json, datos.json, uso.json)
__FIN__
