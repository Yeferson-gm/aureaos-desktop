#!/usr/bin/env bash
# macOS 27 Top Bar v11 — instalador autocontenido para GNOME Shell 50/51.
#
# Este es el único archivo necesario. Contiene extension.js, stylesheet.css,
# metadata.json y los iconos. Para rediseñarlo, modifica los bloques ARCHIVO
# y ejecuta: bash instalar-macos27-top-bar.sh
#
# v11 (Fase 1):
#   · Set propio de iconos SVG simbólicos estilo SF (Wi-Fi, batería con relleno y
#     rayo, Bluetooth, sonido, búsqueda, privacidad, micrófono, cámara, grabación),
#     generados por este script (bloque ICONGEN).
#   · Menús en modo oscuro según color-scheme (o forzado desde la configuración).
#   · Animación de menú casi instantánea (fundido corto, configurable).
#   · Indicadores de micrófono, cámara y grabación de pantalla.
#   · Indicador de distribución de teclado con menú para cambiarla.
#   · Colores de texto e iconos de la barra configurables (sin reiniciar sesión).
#
# Configuración de colores (se aplica en vivo, sobrevive a reinstalar):
#   bash instalar-macos27-top-bar.sh --config texto claro|oscuro|auto
#   bash instalar-macos27-top-bar.sh --config color-texto '#ffffff'
#   bash instalar-macos27-top-bar.sh --config color-iconos '#ffd60a'
#   bash instalar-macos27-top-bar.sh --config color-iconos ninguno
#   bash instalar-macos27-top-bar.sh --config menus claro|oscuro|auto
#   bash instalar-macos27-top-bar.sh --config animacion-ms 70     (0 = sin animación)
#   bash instalar-macos27-top-bar.sh --config mostrar | reiniciar
# También puedes editar ~/.config/lintel-v2/config.json a mano.
set -euo pipefail

readonly UUID='lintel-v2@local'
readonly OLD_UUID='lintel@topbar'
readonly VERSION='11'
readonly MODE="${1:---instalar}"
readonly DESTINATION="${HOME}/.local/share/gnome-shell/extensions/${UUID}"
readonly BACKUP_ROOT="${HOME}/Respaldos-GNOME"
readonly CONFIG_FILE="${XDG_CONFIG_HOME:-${HOME}/.config}/lintel-v2/config.json"
readonly WORKDIR="$(mktemp -d)"
readonly SOURCE_DIR="${WORKDIR}/source"
readonly PACKAGE_DIR="${WORKDIR}/package"

cleanup() {
    rm -rf -- "${WORKDIR}"
}
trap cleanup EXIT

case "${MODE}" in
    --instalar|--verificar|--config) ;;
    *)
        printf 'Uso: %s [--instalar|--verificar|--config CLAVE [VALOR]]\n' "$0" >&2
        exit 2
        ;;
esac

# ── Modo --config: escribe ~/.config/lintel-v2/config.json (la extensión lo recarga sola) ──
if [[ "${MODE}" == '--config' ]]; then
    if ! command -v python3 >/dev/null 2>&1; then
        printf 'Falta el comando requerido: python3\n' >&2
        exit 1
    fi
    python3 - "${CONFIG_FILE}" "${@:2}" <<'__LINTEL_CONFIG_PY__'
import json
import os
import re
import sys

path, args = sys.argv[1], sys.argv[2:]
MODOS = ('auto', 'claro', 'oscuro')
COLOR = re.compile(r'^(#[0-9a-fA-F]{3,8}|rgba?\([0-9., %]+\))$')
KEYS = {
    'texto': ('texto', MODOS),
    'color-texto': ('colorTexto', 'color'),
    'color-iconos': ('colorIconos', 'color'),
    'menus': ('temaMenus', MODOS),
    'animacion-ms': ('animacionMs', 'int'),
}


def load():
    try:
        with open(path, encoding='utf-8') as source:
            data = json.load(source)
            return data if isinstance(data, dict) else {}
    except (OSError, ValueError):
        return {}


def fail(message):
    print(message, file=sys.stderr)
    sys.exit(2)


if not args or args[0] == 'mostrar':
    print(json.dumps(load(), indent=2, ensure_ascii=False))
    sys.exit(0)

if args[0] == 'reiniciar':
    if os.path.exists(path):
        os.remove(path)
    print('Configuración restablecida a los valores por defecto.')
    sys.exit(0)

if args[0] not in KEYS or len(args) != 2:
    fail('Uso: --config texto|menus auto|claro|oscuro\n'
         '       --config color-texto|color-iconos "#rrggbb" | ninguno\n'
         '       --config animacion-ms N\n'
         '       --config mostrar | reiniciar')

key, kind = KEYS[args[0]]
value = args[1].strip()
if kind == 'color':
    if value.lower() in ('ninguno', 'none', 'null', ''):
        value = None
    elif not COLOR.match(value):
        fail('Color no válido. Usa #rgb, #rrggbb, #rrggbbaa, rgb(...) o rgba(...).')
elif kind == 'int':
    try:
        value = max(0, min(500, int(value)))
    except ValueError:
        fail('animacion-ms necesita un número entero (0 a 500).')
else:
    if value not in kind:
        fail('Valores permitidos: ' + ', '.join(kind))

data = load()
data[key] = value
os.makedirs(os.path.dirname(path), exist_ok=True)
with open(path, 'w', encoding='utf-8') as target:
    json.dump(data, target, indent=2, ensure_ascii=False)
    target.write('\n')
print(f'{args[0]} = {value!r}  ({path})')
__LINTEL_CONFIG_PY__
    exit 0
fi

for command in gnome-extensions node python3; do
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

# ── ARCHIVO: metadata.json ────────────────────────────────────────────────
write_file metadata.json <<'__LINTEL_METADATA__'
{
  "uuid": "lintel-v2@local",
  "name": "macOS 27 Top Bar",
  "description": "Barra superior estilo macOS Tahoe: manzana, app activa, menús dinámicos, estado y Centro de control.",
  "shell-version": ["50", "51"],
  "session-modes": ["user"],
  "version": 11
}

__LINTEL_METADATA__

# ── ARCHIVO: icons/lintel-apple-symbolic.svg ─────────────────────────────
# El viewBox está recortado al logo para que ocupe todo el icono (se ve más grande).
write_file icons/lintel-apple-symbolic.svg <<'__LINTEL_APPLE_ICON__'
<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="2.8 1.2 10.4 12.8">
  <path fill="#bebebe" d="M8 4.7C7 4 5.7 4 4.7 4.8 3.4 5.8 3 7.6 3.5 9.4c.5 1.9 1.8 4.3 3.2 4.3.6 0 .9-.4 1.3-.4s.7.4 1.3.4c1.4 0 2.6-2.2 3.2-3.7-1.3-.6-1.9-1.8-1.7-3 .1-.8.6-1.5 1.2-1.9C11.2 4.2 9.3 3.9 8 4.7z"/>
  <path fill="#bebebe" d="M8.4 3.9c0-1.2.8-2.2 1.9-2.4.1 1.1-.6 2.2-1.9 2.4z"/>
</svg>
__LINTEL_APPLE_ICON__

# ── ARCHIVO: icons/lintel-controls-symbolic.svg ──────────────────────────
write_file icons/lintel-controls-symbolic.svg <<'__LINTEL_CONTROLS_ICON__'
<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
  <path fill="#bebebe" fill-rule="evenodd" d="M5 2.500h6a2.500 2.500 0 0 1 0 5H5a2.500 2.500 0 0 1 0-5zm6 1.300a1.200 1.200 0 1 0 0 2.400 1.200 1.200 0 0 0 0-2.400z"/>
  <path fill="#bebebe" fill-rule="evenodd" d="M5 8.500h6a2.500 2.500 0 0 1 0 5H5a2.500 2.500 0 0 1 0-5zm0 1.300a1.200 1.200 0 1 0 0 2.400 1.200 1.200 0 0 0 0-2.400z"/>
</svg>
__LINTEL_CONTROLS_ICON__

# ── ARCHIVO: icons/* (set estilo SF generado) ─────────────────────────────
# GNOME recolorea los iconos simbólicos solo a partir de "fill"; por eso todo son
# rellenos (los trazos se convierten en polígonos). Los tramos apagados usan opacity.
python3 - "${SOURCE_DIR}/icons" <<'__LINTEL_ICONGEN__'
import math
import os
import sys
import xml.etree.ElementTree as ET

out = sys.argv[1]
os.makedirs(out, exist_ok=True)
written = []


def f(n):
    text = ('%.2f' % n).rstrip('0').rstrip('.')
    return text if text not in ('', '-0') else '0'


def xy(p):
    return f'{f(p[0])} {f(p[1])}'


def save(name, paths, w=16, h=16):
    rows = []
    for d, extra in paths:
        if d:
            rows.append(f'  <path fill="#bebebe"{extra} d="{d}"/>')
    body = '\n'.join(rows)
    with open(os.path.join(out, name + '.svg'), 'w', encoding='utf-8') as target:
        target.write(f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" '
                     f'viewBox="0 0 {w} {h}">\n{body}\n</svg>\n')
    written.append(name)


def area(points):
    total = 0.0
    for i, (x1, y1) in enumerate(points):
        x2, y2 = points[(i + 1) % len(points)]
        total += x1 * y2 - x2 * y1
    return total / 2


def poly(points):
    if area(points) < 0:
        points = points[::-1]
    return 'M' + ' L'.join(xy(p) for p in points) + ' Z'


def circ(x, y, r):
    return (f'M{f(x - r)} {f(y)} A{f(r)} {f(r)} 0 1 1 {f(x + r)} {f(y)} '
            f'A{f(r)} {f(r)} 0 1 1 {f(x - r)} {f(y)} Z')


def rr(x, y, w, h, r):
    return (f'M{f(x + r)} {f(y)} H{f(x + w - r)} A{f(r)} {f(r)} 0 0 1 {f(x + w)} {f(y + r)} '
            f'V{f(y + h - r)} A{f(r)} {f(r)} 0 0 1 {f(x + w - r)} {f(y + h)} '
            f'H{f(x + r)} A{f(r)} {f(r)} 0 0 1 {f(x)} {f(y + h - r)} '
            f'V{f(y + r)} A{f(r)} {f(r)} 0 0 1 {f(x + r)} {f(y)} Z')


def stroke(points, width):
    half = width / 2
    parts = []
    for (x1, y1), (x2, y2) in zip(points, points[1:]):
        dx, dy = x2 - x1, y2 - y1
        length = math.hypot(dx, dy)
        nx, ny = -dy / length * half, dx / length * half
        parts.append(poly([(x1 + nx, y1 + ny), (x2 + nx, y2 + ny),
                           (x2 - nx, y2 - ny), (x1 - nx, y1 - ny)]))
    for x, y in points:
        parts.append(circ(x, y, half))
    return ' '.join(parts)


def sector(cx, cy, r0, r1, a0, a1):
    def p(r, a):
        return (cx + r * math.cos(math.radians(a)), cy + r * math.sin(math.radians(a)))
    o0, o1 = p(r1, a0), p(r1, a1)
    if r0 <= 0:
        return f'M{f(cx)} {f(cy)} L{xy(o0)} A{f(r1)} {f(r1)} 0 0 1 {xy(o1)} Z'
    i0, i1 = p(r0, a0), p(r0, a1)
    return (f'M{xy(o0)} A{f(r1)} {f(r1)} 0 0 1 {xy(o1)} L{xy(i1)} '
            f'A{f(r0)} {f(r0)} 0 0 0 {xy(i0)} Z')


DIM = ' opacity=".35"'
EVEN = ' fill-rule="evenodd"'

# ── Wi-Fi: cuña + 2 arcos (0 a 3 tramos encendidos) y apagado con barra ──
segments = [(0, 3.4), (4.9, 6.7), (8.2, 10.0)]
wifi = [sector(8, 13.3, a, b, -135, -45) for a, b in segments]
for bars in range(4):
    save(f'lintel-wifi-{bars}-symbolic',
         [(wifi[i], '' if i < bars else DIM) for i in range(3)])
save('lintel-wifi-off-symbolic',
     [(d, DIM) for d in wifi] + [(stroke([(2.2, 2.4), (13.8, 14.2)], 1.5), '')])

# ── Batería: contorno, punta, relleno proporcional y rayo recortado ──
bolt = [(14.3, 4.3), (9.9, 8.7), (12.2, 8.7), (11.2, 11.8), (15.6, 7.3), (13.3, 7.3)]
ring = rr(1, 2.5, 23, 11, 3.2) + ' ' + rr(2.4, 3.9, 20.2, 8.2, 1.9)
nub = 'M25.4 5.8 H26.2 A.8 .8 0 0 1 27 6.6 V9.4 A.8 .8 0 0 1 26.2 10.2 H25.4 Z'
for pct in range(0, 101, 5):
    width = 0.0 if pct == 0 else max(1.4, 17.8 * pct / 100)
    fill = rr(3.6, 5.1, width, 5.8, min(1.1, width / 2)) if width else ''
    save(f'lintel-battery-{pct}-symbolic',
         [(ring + ' ' + nub, EVEN), (fill, '')], 28, 16)
    # Cargando: el rayo es un hueco en el relleno y sólido fuera de él (evenodd).
    save(f'lintel-battery-{pct}-charging-symbolic',
         [(ring + ' ' + nub, EVEN), (fill + ' ' + poly(bolt), EVEN)], 28, 16)

# ── Bluetooth ──
rune = [(4.6, 5.1), (11.2, 10.6), (8, 13.7), (8, 2.3), (11.2, 5.4), (4.6, 10.9)]
save('lintel-bluetooth-on-symbolic', [(stroke(rune, 1.3), '')])
save('lintel-bluetooth-off-symbolic',
     [(stroke(rune, 1.3), DIM), (stroke([(2.5, 2.5), (13.5, 13.5)], 1.4), '')])

# ── Sonido ──
speaker = poly([(1.2, 6.2), (3.8, 6.2), (7.6, 3.0), (7.6, 13.0), (3.8, 9.8), (1.2, 9.8)])
waves = [sector(8.2, 8, a, b, -42, 42) for a, b in [(2.4, 3.4), (4.2, 5.2), (6.0, 7.0)]]
save('lintel-sound-muted-symbolic',
     [(speaker, ''), (stroke([(10.6, 5.8), (14.6, 10.2)], 1.3), ''),
      (stroke([(14.6, 5.8), (10.6, 10.2)], 1.3), '')])
for name, count in (('low', 1), ('medium', 2), ('high', 3)):
    save(f'lintel-sound-{name}-symbolic',
         [(speaker, '')] + [(waves[i], '') for i in range(count)])

# ── Buscar ──
save('lintel-search-symbolic',
     [(circ(6.6, 6.6, 5.1) + ' ' + circ(6.6, 6.6, 3.7), EVEN),
      (stroke([(10.6, 10.6), (14.2, 14.2)], 1.8), '')])

# ── Privacidad (escudo), micrófono, cámara y grabación ──
shield_out = ('M8 1.4 L13.6 3.5 V8 C13.6 11.3 11.1 13.6 8 14.7 '
              'C4.9 13.6 2.4 11.3 2.4 8 V3.5 Z')
shield_in = ('M8 3 L12.1 4.5 V8 C12.1 10.5 10.3 12.2 8 13.1 '
             'C5.7 12.2 3.9 10.5 3.9 8 V4.5 Z')
save('lintel-privacy-symbolic', [(shield_out + ' ' + shield_in, EVEN)])

arc = [(8 + 4.4 * math.cos(math.radians(a)), 7.2 + 4.4 * math.sin(math.radians(a)))
       for a in range(0, 181, 15)]
save('lintel-mic-symbolic',
     [(rr(6, 1.4, 4, 7.6, 2) + ' ' + stroke(arc, 1.2) + ' ' + stroke([(8, 11.6), (8, 14.2)], 1.2)
       + ' ' + stroke([(5.6, 14.4), (10.4, 14.4)], 1.2), '')])
save('lintel-camera-symbolic',
     [(rr(1, 4, 10, 8, 1.8) + ' ' + poly([(11.8, 7.1), (15, 5.1), (15, 10.9), (11.8, 8.9)]), '')])
save('lintel-record-symbolic', [(circ(8, 8, 4.8), '')])

expected = 5 + 42 + 2 + 4 + 5
if len(written) != expected:
    raise SystemExit(f'Se esperaban {expected} iconos y se generaron {len(written)}')
for name in written:
    ET.parse(os.path.join(out, name + '.svg'))
__LINTEL_ICONGEN__

# ── ARCHIVO: extension.js ─────────────────────────────────────────────────
write_file extension.js <<'__LINTEL_EXTENSION_JS__'
import Clutter from 'gi://Clutter';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import Meta from 'gi://Meta';
import NM from 'gi://NM';
import Shell from 'gi://Shell';
import St from 'gi://St';

import * as AppFavorites from 'resource:///org/gnome/shell/ui/appFavorites.js';
import * as BoxPointer from 'resource:///org/gnome/shell/ui/boxpointer.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import {getRfkillManager} from 'resource:///org/gnome/shell/ui/status/rfkill.js';
import {Slider} from 'resource:///org/gnome/shell/ui/slider.js';
import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';

// ═══════════════════════ AJUSTES ═══════════════════════
// Valores por defecto. Los colores y el tema también se pueden cambiar sin tocar
// este archivo: ~/.config/lintel-v2/config.json o `bash instalar… --config …`.
const AJUSTES = {
    // Muestra los atajos con símbolos de Mac (⌘ ⇧ ⌥). En GNOME se envía Ctrl/Shift/Alt.
    ATAJOS_ESTILO_MAC: true,
    // Color del texto de la barra: 'auto' (sigue el modo claro/oscuro), 'claro' o 'oscuro'.
    TEXTO: 'auto',
    // Colores personalizados (CSS: '#ffffff', 'rgb(255 255 255)'…). null = usar TEXTO.
    COLOR_TEXTO: null,
    COLOR_ICONOS: null,
    // Tema de los menús desplegables: 'auto' (sigue color-scheme), 'claro' u 'oscuro'.
    TEMA_MENUS: 'auto',
    // Duración del fundido al abrir un menú, en ms. 0 = aparece al instante.
    ANIMACION_MENU_MS: 70,
    // Puntos de micrófono / cámara / grabación de pantalla en la barra.
    INDICADORES_PRIVACIDAD: true,
    // Indicador de distribución de teclado (solo aparece con 2 o más).
    INDICADOR_TECLADO: true,
    SEMANA_INICIA_LUNES: true,
};
// ═══════════════════════════════════════════════════════

const CENTER = Clutter.ActorAlign.CENTER;
const START = Clutter.ActorAlign.START;
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));

// Estado visual compartido (lo rellena Extension._applyTheme).
const theme = {textColor: null, iconColor: null, menuDark: false, animMs: 70};

let ICON_DIR = '';
const fileIcon = name => Gio.icon_new_for_string(`${ICON_DIR}/${name}.svg`);
// Los iconos propios empiezan por "lintel-"; el resto son iconos del tema.
const iconProps = name => name.startsWith('lintel-')
    ? {gicon: fileIcon(name)}
    : {icon_name: name};

function run(cmd) {
    try {
        GLib.spawn_command_line_async(cmd);
    } catch (e) {
        console.error(`[Lintel] ${cmd}: ${e}`);
    }
}

function busCall(conn, dest, path, iface, method, params = null) {
    conn.call(dest, path, iface, method, params, null, Gio.DBusCallFlags.NONE, -1, null,
        (c, r) => {
            try {
                c.call_finish(r);
            } catch (e) {
                console.error(`[Lintel] ${method}: ${e.message}`);
            }
        });
}

function settingsFor(id) {
    const src = Gio.SettingsSchemaSource.get_default();
    return src?.lookup(id, true) ? new Gio.Settings({schema_id: id}) : null;
}

function settingsForExtension(id, uuid) {
    const schemaDir = GLib.build_filenamev([
        GLib.get_user_data_dir(), 'gnome-shell', 'extensions', uuid, 'schemas',
    ]);
    if (!GLib.file_test(schemaDir, GLib.FileTest.IS_DIR))
        return null;

    const src = Gio.SettingsSchemaSource.new_from_directory(
        schemaDir, Gio.SettingsSchemaSource.get_default(), false);
    const schema = src.lookup(id, false);
    return schema ? new Gio.Settings({settings_schema: schema}) : null;
}

// ── Iconos de los menús: se eligen según el texto, como en macOS ─────────
const ICON_RULES = [
    [/^Acerca de/, 'help-about-symbolic'],
    [/Tienda de aplicaciones/, 'system-software-install-symbolic'],
    [/^(Ajustes|Configuración)/, 'emblem-system-symbolic'],
    [/Forzar salida/, 'process-stop-symbolic'],
    [/^Suspender/, 'media-playback-pause-symbolic'],
    [/^Reiniciar/, 'system-reboot-symbolic'],
    [/^Apagar/, 'system-shutdown-symbolic'],
    [/^Bloquear/, 'system-lock-screen-symbolic'],
    [/^Cerrar sesión/, 'system-log-out-symbolic'],
    [/Captura/, 'camera-photo-symbolic'],
    [/Vista general/, 'focus-windows-symbolic'],
    [/^Aplicaciones$/, 'view-app-grid-symbolic'],
    [/fondo de pantalla|^Aspecto/, 'preferences-desktop-wallpaper-symbolic'],
    [/Abrir Calendario/, 'x-office-calendar-symbolic'],
    [/Abrir Archivos/, 'folder-symbolic'],
    [/Nueva ventana privada/, 'security-high-symbolic'],
    [/Nueva ventana/, 'window-new-symbolic'],
    [/Nueva carpeta/, 'folder-new-symbolic'],
    [/siguiente/i, 'go-next-symbolic'],
    [/anterior/i, 'go-previous-symbolic'],
    [/Nueva pestaña/, 'tab-new-symbolic'],
    [/Guardar/, 'document-save-symbolic'],
    [/Imprimir/, 'document-print-symbolic'],
    [/Ir a ubicación|Abrir ubicación/, 'folder-open-symbolic'],
    [/^Abrir/, 'document-open-symbolic'],
    [/Salir de/, 'application-exit-symbolic'],
    [/^Cerrar/, 'window-close-symbolic'],
    [/^Deshacer/, 'edit-undo-symbolic'],
    [/^Rehacer/, 'edit-redo-symbolic'],
    [/^Cortar/, 'edit-cut-symbolic'],
    [/^Copiar/, 'edit-copy-symbolic'],
    [/^Pegar/, 'edit-paste-symbolic'],
    [/Seleccionar todo/, 'edit-select-all-symbolic'],
    [/^Buscar/, 'edit-find-symbolic'],
    [/Acercar/, 'zoom-in-symbolic'],
    [/Alejar/, 'zoom-out-symbolic'],
    [/Tamaño real/, 'zoom-original-symbolic'],
    [/Pantalla completa/, 'view-fullscreen-symbolic'],
    [/Recargar|Actualizar/, 'view-refresh-symbolic'],
    [/^Minimizar|^Ocultar/, 'window-minimize-symbolic'],
    [/^Zoom$/, 'window-maximize-symbolic'],
    [/izquierda/, 'go-previous-symbolic'],
    [/derecha/, 'go-next-symbolic'],
    [/historial/i, 'document-open-recent-symbolic'],
    [/Añadir marcador/, 'bookmark-new-symbolic'],
    [/marcador/i, 'user-bookmarks-symbolic'],
    [/^Mostrar todo$/, 'view-restore-symbolic'],
    [/archivos ocultos/, 'view-reveal-symbolic'],
    [/^Atrás/, 'go-previous-symbolic'],
    [/^Adelante/, 'go-next-symbolic'],
    [/^Inicio|Carpeta personal/, 'go-home-symbolic'],
    [/Carpeta superior/, 'go-up-symbolic'],
    [/Propiedades/, 'document-properties-symbolic'],
    [/Como iconos/, 'view-grid-symbolic'],
    [/Como lista/, 'view-list-symbolic'],
    [/Código fuente/, 'text-x-generic-symbolic'],
    [/^Ayuda/, 'help-browser-symbolic'],
];

function iconFor(label) {
    if (!label)
        return null;
    for (const [re, icon] of ICON_RULES) {
        if (re.test(label))
            return icon;
    }
    return null;
}

// ── Atajos: se muestran estilo Mac y se envían como teclas reales ─────────
const MODS = {
    ctrl: ['⌘', Clutter.KEY_Control_L],
    shift: ['⇧', Clutter.KEY_Shift_L],
    alt: ['⌥', Clutter.KEY_Alt_L],
    super: ['❖', Clutter.KEY_Super_L],
};
const KEY_GLYPH = {
    Left: '←', Right: '→', Up: '↑', Down: '↓', Return: '↩', Escape: '⎋',
    Tab: '⇥', Delete: '⌦', BackSpace: '⌫', plus: '+', minus: '−',
    comma: ',', Home: '↖', space: '␣',
};

function parseCombo(c) {
    const parts = c.split('+');
    return {key: parts.pop(), mods: parts};
}

function keyval(name) {
    return name.length === 1 ? name.toLowerCase().charCodeAt(0) : Clutter[`KEY_${name}`];
}

function hintOf(combo) {
    const {key, mods} = parseCombo(combo);
    const k = KEY_GLYPH[key] ?? (key.length === 1 ? key.toUpperCase() : key);
    if (AJUSTES.ATAJOS_ESTILO_MAC)
        return mods.map(m => MODS[m][0]).join('') + k;
    return [...mods.map(cap), k].join('+');
}

// ── Contexto compartido ───────────────────────────────────────────────────
class Context {
    constructor(ext) {
        this.path = ext.path;
        ICON_DIR = `${ext.path}/icons`;
        this.win = null;
        this.app = null;
        this._sources = new Set();
        this._dev = null;
    }

    icon(name) {
        return fileIcon(name);
    }

    later(ms, fn) {
        const id = GLib.timeout_add(GLib.PRIORITY_DEFAULT, ms, () => {
            this._sources.delete(id);
            fn();
            return GLib.SOURCE_REMOVE;
        });
        this._sources.add(id);
        return id;
    }

    cancel(id) {
        if (id && this._sources.has(id)) {
            GLib.source_remove(id);
            this._sources.delete(id);
        }
    }

    sendKeys(combo) {
        const w = this.win;
        this.later(150, () => {
            try {
                if (w && global.display.focus_window !== w)
                    Main.activateWindow(w);
                this._press(combo);
            } catch (e) {
                console.error(`[Lintel] atajo ${combo}: ${e}`);
            }
        });
    }

    _press(combo) {
        if (!this._dev) {
            const backend = global.stage.context?.get_backend?.() ?? Clutter.get_default_backend();
            this._dev = backend.get_default_seat()
                .create_virtual_device(Clutter.InputDeviceType.KEYBOARD_DEVICE);
        }
        const {key, mods} = parseCombo(combo);
        const kv = keyval(key);
        const P = Clutter.KeyState.PRESSED, R = Clutter.KeyState.RELEASED;
        const t = () => GLib.get_monotonic_time();
        mods.forEach(m => this._dev.notify_keyval(t(), MODS[m][1], P));
        this._dev.notify_keyval(t(), kv, P);
        this._dev.notify_keyval(t(), kv, R);
        [...mods].reverse().forEach(m => this._dev.notify_keyval(t(), MODS[m][1], R));
    }

    destroy() {
        this._sources.forEach(id => GLib.source_remove(id));
        this._sources.clear();
        this._dev = null;
    }
}

// ── Modelos pequeños con notificación de cambios ──────────────────────────
class Model {
    onChange(fn) {
        this._cb ??= new Set();
        this._cb.add(fn);
        return () => this._cb.delete(fn);
    }

    _emit() {
        this._cb?.forEach(f => f());
    }
}

// ── Configuración del usuario (colores, tema, animación) ──────────────────
// Archivo: ~/.config/lintel-v2/config.json. Se recarga en vivo al guardarlo.
const CONFIG_DIR = GLib.build_filenamev([GLib.get_user_config_dir(), 'lintel-v2']);
const CONFIG_FILE = GLib.build_filenamev([CONFIG_DIR, 'config.json']);
// Solo se aceptan colores CSS simples: el valor acaba en un atributo de estilo.
const COLOR_RE = /^(#[0-9a-fA-F]{3,8}|rgba?\([0-9., %]+\))$/;
const oneOf = (v, list, fallback) => list.includes(v) ? v : fallback;
const asColor = v => typeof v === 'string' && COLOR_RE.test(v.trim()) ? v.trim() : null;

class Config extends Model {
    constructor() {
        super();
        this.values = {};
        this._monitor = null;
        this._monitorId = 0;
        this._timer = 0;
        this.load();
        try {
            GLib.mkdir_with_parents(CONFIG_DIR, 0o755);
            this._monitor = Gio.File.new_for_path(CONFIG_FILE)
                .monitor_file(Gio.FileMonitorFlags.NONE, null);
            this._monitorId = this._monitor.connect('changed', () => this._soon());
        } catch (e) {
            console.error(`[Lintel] no se puede vigilar la configuración: ${e}`);
        }
    }

    load() {
        let raw = {};
        try {
            const [ok, bytes] = GLib.file_get_contents(CONFIG_FILE);
            if (ok)
                raw = JSON.parse(new TextDecoder().decode(bytes)) ?? {};
        } catch (e) {
            raw = {};
        }
        const modes = ['auto', 'claro', 'oscuro'];
        this.values = {
            texto: oneOf(raw.texto, modes, AJUSTES.TEXTO),
            colorTexto: 'colorTexto' in raw ? asColor(raw.colorTexto) : asColor(AJUSTES.COLOR_TEXTO),
            colorIconos: 'colorIconos' in raw ? asColor(raw.colorIconos) : asColor(AJUSTES.COLOR_ICONOS),
            temaMenus: oneOf(raw.temaMenus, modes, AJUSTES.TEMA_MENUS),
            animacionMs: Number.isFinite(raw.animacionMs)
                ? clamp(raw.animacionMs, 0, 500)
                : AJUSTES.ANIMACION_MENU_MS,
        };
    }

    _soon() {
        if (this._timer)
            GLib.source_remove(this._timer);
        this._timer = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 150, () => {
            this._timer = 0;
            this.load();
            this._emit();
            return GLib.SOURCE_REMOVE;
        });
    }

    destroy() {
        if (this._timer)
            GLib.source_remove(this._timer);
        this._timer = 0;
        if (this._monitorId)
            this._monitor?.disconnect(this._monitorId);
        this._monitor?.cancel();
        this._monitor = null;
        this._cb?.clear();
    }
}

class Sound extends Model {
    constructor() {
        super();
        this.mixer = null;
        this.sink = null;
        this.source = null;
        this._ids = [];
        this._sinkIds = [];
        this._sourceIds = [];
        this._dead = false;
    }

    async load() {
        try {
            const mod = await import('resource:///org/gnome/shell/ui/status/volume.js');
            if (this._dead)
                return;
            this.mixer = mod.getMixerControl();
            this._ids = [
                'default-sink-changed', 'default-source-changed', 'state-changed',
                'stream-added', 'stream-removed',
            ].map(s => this.mixer.connect(s, () => this._bind()));
            this._bind();
        } catch (e) {
            console.error(`[Lintel] sonido no disponible: ${e}`);
        }
    }

    _bind() {
        const sink = this.mixer?.get_default_sink() ?? null;
        const source = this.mixer?.get_default_source() ?? null;
        if (sink !== this.sink) {
            this._sinkIds.forEach(id => this.sink?.disconnect(id));
            this.sink = sink;
            this._sinkIds = sink
                ? ['notify::volume', 'notify::is-muted'].map(s => sink.connect(s, () => this._emit()))
                : [];
        }
        if (source !== this.source) {
            this._sourceIds.forEach(id => this.source?.disconnect(id));
            this.source = source;
            this._sourceIds = source
                ? ['notify::volume', 'notify::is-muted'].map(s => source.connect(s, () => this._emit()))
                : [];
        }
        this._emit();
    }

    get ready() {
        return !!this.sink;
    }

    get level() {
        return this.sink ? clamp(this.sink.volume / this.mixer.get_vol_max_norm()) : 0;
    }

    get muted() {
        return !this.sink || this.sink.is_muted || this.sink.volume === 0;
    }

    setLevel(v) {
        if (!this.sink)
            return;
        this.sink.volume = Math.round(clamp(v) * this.mixer.get_vol_max_norm());
        this.sink.push_volume();
        if (this.sink.is_muted && v > 0)
            this.sink.change_is_muted(false);
    }

    toggleMute() {
        this.sink?.change_is_muted(!this.sink.is_muted);
    }

    get iconName() {
        const l = this.level;
        if (this.muted)
            return 'audio-volume-muted-symbolic';
        if (l < 0.34)
            return 'audio-volume-low-symbolic';
        if (l < 0.67)
            return 'audio-volume-medium-symbolic';
        return 'audio-volume-high-symbolic';
    }

    // Mismo criterio que iconName, pero con el set propio.
    get iconFile() {
        const l = this.level;
        if (this.muted)
            return 'lintel-sound-muted-symbolic';
        if (l < 0.34)
            return 'lintel-sound-low-symbolic';
        if (l < 0.67)
            return 'lintel-sound-medium-symbolic';
        return 'lintel-sound-high-symbolic';
    }

    get sinks() {
        return this.mixer?.get_sinks() ?? [];
    }

    get micReady() {
        return !!this.source;
    }

    get micLevel() {
        return this.source ? clamp(this.source.volume / this.mixer.get_vol_max_norm()) : 0;
    }

    get micMuted() {
        return !this.source || this.source.is_muted || this.source.volume === 0;
    }

    // ¿Alguna aplicación está grabando audio ahora mismo?
    get micInUse() {
        try {
            return (this.mixer?.get_source_outputs?.() ?? []).some(stream => {
                const id = `${stream.application_id ?? ''} ${stream.name ?? ''}`;
                return !/VolumeControl|peak|pavucontrol|gnome-shell/i.test(id);
            });
        } catch (e) {
            return false;
        }
    }

    setMicLevel(v) {
        if (!this.source)
            return;
        this.source.volume = Math.round(clamp(v) * this.mixer.get_vol_max_norm());
        this.source.push_volume();
        if (this.source.is_muted && v > 0)
            this.source.change_is_muted(false);
    }

    get micIconName() {
        return this.micMuted
            ? 'microphone-sensitivity-muted-symbolic'
            : 'audio-input-microphone-symbolic';
    }

    setDefault(stream) {
        this.mixer?.set_default_sink(stream);
    }

    destroy() {
        this._dead = true;
        this._sinkIds.forEach(id => this.sink?.disconnect(id));
        this._sourceIds.forEach(id => this.source?.disconnect(id));
        this._ids.forEach(id => this.mixer?.disconnect(id));
        this._cb?.clear();
    }
}

class Brightness extends Model {
    constructor() {
        super();
        this._manager = Main.brightnessManager;
        this._scale = null;
        this._scaleId = 0;
        this._managerId = this._manager?.connect('changed', () => this._bindScale()) ?? 0;
        this._bindScale();
    }

    _bindScale() {
        if (this._scaleId)
            this._scale?.disconnect(this._scaleId);
        this._scale = this._manager?.globalScale ?? null;
        this._scaleId = this._scale?.connect('notify::value', () => this._emit()) ?? 0;
        this._emit();
    }

    get available() {
        return this._scale !== null;
    }

    get level() {
        return clamp(this._scale?.value ?? 0);
    }

    setLevel(v) {
        if (this._scale)
            this._scale.value = clamp(v);
    }

    destroy() {
        if (this._scaleId)
            this._scale?.disconnect(this._scaleId);
        if (this._managerId)
            this._manager?.disconnect(this._managerId);
        this._scaleId = 0;
        this._managerId = 0;
        this._scale = null;
        this._manager = null;
        this._cb?.clear();
    }
}

const PowerProfilesProxy = Gio.DBusProxy.makeProxyWrapper(`
<node><interface name="net.hadess.PowerProfiles">
  <property name="ActiveProfile" type="s" access="readwrite"/>
  <property name="Profiles" type="aa{sv}" access="read"/>
</interface></node>`);

const POWER_PROFILE_NAMES = {
    'power-saver': 'Ahorro de energía',
    balanced: 'Balanceado',
    performance: 'Rendimiento',
};

const POWER_PROFILE_ICONS = {
    'power-saver': 'power-profile-power-saver-symbolic',
    balanced: 'power-profile-balanced-symbolic',
    performance: 'power-profile-performance-symbolic',
};

class PowerProfiles extends Model {
    constructor() {
        super();
        this._dead = false;
        this._proxy = new PowerProfilesProxy(Gio.DBus.system,
            'net.hadess.PowerProfiles', '/net/hadess/PowerProfiles',
            (proxy, error) => {
                if (error || this._dead)
                    return;
                this._id = proxy.connect('g-properties-changed', () => this._emit());
                this._emit();
            });
    }

    get profiles() {
        return (this._proxy?.Profiles ?? [])
            .map(properties => properties.Profile?.unpack?.() ?? properties.Profile)
            .filter(Boolean);
    }

    get available() {
        return this._proxy?.g_name_owner !== null && this.profiles.length > 0;
    }

    get active() {
        return this._proxy?.ActiveProfile ?? 'balanced';
    }

    get label() {
        return POWER_PROFILE_NAMES[this.active] ?? 'Personalizado';
    }

    get iconName() {
        return POWER_PROFILE_ICONS[this.active] ?? 'gnome-power-manager-symbolic';
    }

    setProfile(profile) {
        if (this._proxy && this.profiles.includes(profile))
            this._proxy.ActiveProfile = profile;
    }

    cycle() {
        const order = ['power-saver', 'balanced', 'performance']
            .filter(profile => this.profiles.includes(profile));
        if (!order.length)
            return;
        const index = order.indexOf(this.active);
        this.setProfile(order[(index + 1 + order.length) % order.length]);
    }

    destroy() {
        this._dead = true;
        if (this._id)
            this._proxy?.disconnect(this._id);
        this._proxy = null;
        this._cb?.clear();
    }
}

const BATTERY_HEALTH_SCHEMA = 'org.gnome.shell.extensions.Battery-Health-Charging';
const BATTERY_HEALTH_UUID = 'Battery-Health-Charging@maniacx.github.com';

class BatteryCare extends Model {
    constructor() {
        super();
        this._settings = settingsForExtension(BATTERY_HEALTH_SCHEMA, BATTERY_HEALTH_UUID);
        this._ids = [];
        if (this._settings) {
            for (const key of ['charging-mode', 'device-type', 'polkit-status'])
                this._ids.push(this._settings.connect(`changed::${key}`, () => this._emit()));
        }
    }

    get available() {
        return !!this._settings && this._settings.get_int('device-type') > 0 &&
            this._settings.get_string('polkit-status') === 'installed';
    }

    get mode() {
        return this._settings?.get_string('charging-mode') ?? 'ful';
    }

    get enabled() {
        return this.mode !== 'ful';
    }

    get label() {
        const mode = this.mode;
        if (mode === 'max')
            return `Máxima vida · ${this._settings.get_int('current-max-end-threshold')} %`;
        if (mode === 'bal')
            return `Equilibrado · ${this._settings.get_int('current-bal-end-threshold')} %`;
        if (mode === 'adv')
            return 'Adaptativo';
        if (mode === 'exp')
            return 'Carga rápida';
        return 'Carga completa';
    }

    _findChargeLimitToggle() {
        const root = Main.panel.statusArea.quickSettings?.menu?.box;
        const pending = root ? [root] : [];
        while (pending.length) {
            const actor = pending.pop();
            const schemaId = actor?._settings?.settings_schema?.get_id?.();
            if (actor?.constructor?.name?.includes('ChargeLimitToggle') ||
                schemaId === BATTERY_HEALTH_SCHEMA)
                return actor;
            pending.push(...(actor?.get_children?.() ?? []));
        }
        return null;
    }

    toggle() {
        const toggle = this._findChargeLimitToggle();
        if (toggle) {
            toggle.emit('clicked');
        } else {
            Main.notifyError('Cuidado de batería',
                'No se encontró el control activo de Battery Health Charging.');
        }
    }

    destroy() {
        this._ids.forEach(id => this._settings?.disconnect(id));
        this._ids = [];
        this._settings?.run_dispose?.();
        this._settings = null;
        this._cb?.clear();
    }
}

class AirplaneMode extends Model {
    constructor() {
        super();
        this._manager = getRfkillManager();
        this._ids = [
            this._manager.connect('notify::airplane-mode', () => this._emit()),
            this._manager.connect('notify::show-airplane-mode', () => this._emit()),
        ];
    }

    get available() {
        return this._manager.show_airplane_mode;
    }

    get enabled() {
        return this._manager.airplane_mode;
    }

    toggle() {
        this._manager.airplane_mode = !this._manager.airplane_mode;
    }

    destroy() {
        this._ids.forEach(id => this._manager?.disconnect(id));
        this._ids = [];
        this._manager = null;
        this._cb?.clear();
    }
}

// ── Bluetooth: adaptador y dispositivos vía BlueZ (D-Bus del sistema) ─────
const BLUEZ = 'org.bluez';

const BT_ICONS = {
    'audio-headset': 'audio-headset-symbolic',
    'audio-headphones': 'audio-headphones-symbolic',
    'audio-card': 'audio-speakers-symbolic',
    'input-keyboard': 'input-keyboard-symbolic',
    'input-mouse': 'input-mouse-symbolic',
    'input-gaming': 'input-gaming-symbolic',
    'input-tablet': 'input-tablet-symbolic',
    phone: 'phone-symbolic',
    computer: 'computer-symbolic',
    'camera-photo': 'camera-photo-symbolic',
    printer: 'printer-symbolic',
};
const btIcon = name => BT_ICONS[name] ?? 'bluetooth-active-symbolic';

class Bluetooth extends Model {
    constructor() {
        super();
        this._dead = false;
        this._adapterPath = null;
        this._powered = false;
        this._discovering = false;
        this._devices = [];
        this._busy = new Set();
        this._refreshId = 0;
        this._lastDiscovery = 0;
        this._weStarted = false;

        const queue = () => this._queueRefresh();
        const sub = (iface, member) => Gio.DBus.system.signal_subscribe(
            BLUEZ, iface, member, null, null, Gio.DBusSignalFlags.NONE, queue);
        this._subs = [
            sub('org.freedesktop.DBus.Properties', 'PropertiesChanged'),
            sub('org.freedesktop.DBus.ObjectManager', 'InterfacesAdded'),
            sub('org.freedesktop.DBus.ObjectManager', 'InterfacesRemoved'),
        ];
        this._watchId = Gio.bus_watch_name(Gio.BusType.SYSTEM, BLUEZ, Gio.BusNameWatcherFlags.NONE,
            () => this._queueRefresh(),
            () => {
                this._adapterPath = null;
                this._devices = [];
                this._emit();
            });
        this.refresh();
    }

    _queueRefresh() {
        if (this._dead || this._refreshId)
            return;
        this._refreshId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 400, () => {
            this._refreshId = 0;
            this.refresh();
            return GLib.SOURCE_REMOVE;
        });
    }

    refresh() {
        const serial = this._refreshSerial = (this._refreshSerial ?? 0) + 1;
        Gio.DBus.system.call(BLUEZ, '/', 'org.freedesktop.DBus.ObjectManager', 'GetManagedObjects',
            null, null, Gio.DBusCallFlags.NO_AUTO_START, -1, null, (c, r) => {
                if (this._dead || serial !== this._refreshSerial)
                    return;
                try {
                    const [objects] = c.call_finish(r).recursiveUnpack();
                    this._parse(objects);
                } catch (e) {
                    this._adapterPath = null;
                    this._devices = [];
                }
                this._emit();
            });
    }

    _parse(objects) {
        let adapterPath = null;
        let adapter = null;
        for (const [path, ifaces] of Object.entries(objects)) {
            if (ifaces['org.bluez.Adapter1'] && !adapterPath) {
                adapterPath = path;
                adapter = ifaces['org.bluez.Adapter1'];
            }
        }
        const devices = [];
        for (const [path, ifaces] of Object.entries(objects)) {
            const d = ifaces['org.bluez.Device1'];
            if (!d || d.Adapter !== adapterPath)
                continue;
            // Los dispositivos sin nombre (solo dirección) no aportan nada en la lista.
            if (!d.Paired && !d.Name)
                continue;
            devices.push({
                path,
                name: d.Alias || d.Name || d.Address,
                icon: d.Icon ?? '',
                paired: !!d.Paired,
                connected: !!d.Connected,
                rssi: d.RSSI ?? -127,
            });
        }
        this._adapterPath = adapterPath;
        this._powered = !!adapter?.Powered;
        this._discovering = !!adapter?.Discovering;
        this._devices = devices;
    }

    get available() {
        return !!this._adapterPath;
    }

    get powered() {
        return this._powered;
    }

    get discovering() {
        return this._discovering;
    }

    get paired() {
        return this._devices.filter(d => d.paired)
            .sort((a, b) => (b.connected - a.connected) || a.name.localeCompare(b.name));
    }

    get nearby() {
        return this._devices.filter(d => !d.paired).sort((a, b) => b.rssi - a.rssi);
    }

    isBusy(device) {
        return this._busy.has(device.path);
    }

    setPowered(v) {
        if (!this._adapterPath || this._powerPending)
            return;
        this._powerPending = true;
        Gio.DBus.system.call(BLUEZ, this._adapterPath,
            'org.freedesktop.DBus.Properties', 'Set',
            new GLib.Variant('(ssv)', ['org.bluez.Adapter1', 'Powered', GLib.Variant.new_boolean(v)]),
            null, Gio.DBusCallFlags.NONE, 10000, null, (connection, result) => {
                this._powerPending = false;
                try { connection.call_finish(result); }
                catch (error) {
                    if (!this._dead) Main.notify('Bluetooth', `No se pudo cambiar el estado: ${error.message}`);
                }
                if (!this._dead) this.refresh();
            });
    }

    startDiscovery() {
        if (!this._adapterPath || !this._powered || this._discovering)
            return;
        const now = GLib.get_monotonic_time() / 1e6;
        if (now - this._lastDiscovery < 3)
            return;
        this._lastDiscovery = now;
        this._weStarted = true;
        busCall(Gio.DBus.system, BLUEZ, this._adapterPath, 'org.bluez.Adapter1', 'StartDiscovery');
    }

    stopDiscovery() {
        if (!this._weStarted || !this._adapterPath)
            return;
        this._weStarted = false;
        busCall(Gio.DBus.system, BLUEZ, this._adapterPath, 'org.bluez.Adapter1', 'StopDiscovery');
    }

    _deviceCall(path, method, done) {
        Gio.DBus.system.call(BLUEZ, path, 'org.bluez.Device1', method, null, null,
            Gio.DBusCallFlags.NONE, 30000, null, (c, r) => {
                let error = null;
                try {
                    c.call_finish(r);
                } catch (e) {
                    error = e;
                }
                done?.(error);
            });
    }

    // Conecta, desconecta o empareja según el estado del dispositivo.
    toggleDevice(device) {
        if (this._busy.has(device.path))
            return;
        this._busy.add(device.path);
        this._emit();
        const finish = error => {
            this._busy.delete(device.path);
            if (error)
                console.error(`[Lintel] Bluetooth ${device.name}: ${error.message}`);
            if (!this._dead) {
                this.refresh();
                this._emit();
            }
            // Si el emparejamiento directo falla, GNOME Ajustes sabe pedir PIN/confirmación.
            if (error && !device.paired)
                run('gnome-control-center bluetooth');
        };
        if (device.connected) {
            this._deviceCall(device.path, 'Disconnect', finish);
        } else if (device.paired) {
            this._deviceCall(device.path, 'Connect', finish);
        } else {
            this._deviceCall(device.path, 'Pair', error => {
                if (error)
                    return finish(error);
                busCall(Gio.DBus.system, BLUEZ, device.path, 'org.freedesktop.DBus.Properties', 'Set',
                    new GLib.Variant('(ssv)', ['org.bluez.Device1', 'Trusted', GLib.Variant.new_boolean(true)]));
                return this._deviceCall(device.path, 'Connect', finish);
            });
        }
    }

    destroy() {
        this._dead = true;
        this.stopDiscovery();
        this._subs.forEach(id => Gio.DBus.system.signal_unsubscribe(id));
        this._subs = [];
        if (this._watchId)
            Gio.bus_unwatch_name(this._watchId);
        this._watchId = 0;
        if (this._refreshId)
            GLib.source_remove(this._refreshId);
        this._refreshId = 0;
        this._cb?.clear();
    }
}

// ── Privacidad: micrófono, cámara y grabación de pantalla ─────────────────
//   · micrófono: flujos de captura de PulseAudio/PipeWire (Gvc).
//   · cámara: algún proceso tiene abierto /dev/video* (sondeo cada 4 s).
//   · pantalla: handles de RemoteAccess (portal de screencast) y grabador de GNOME.
class Privacy extends Model {
    constructor(ctx) {
        super();
        this._ctx = ctx;
        this._dead = false;
        this._timer = 0;
        this._handles = new Set();
        this._ctl = null;
        this._ctlId = 0;
        this._shot = null;
        this._shotId = 0;
        this.camera = false;

        this._offSound = ctx.sound.onChange(() => this._emit());
        try {
            this._ctl = global.backend.get_remote_access_controller?.() ?? null;
            this._ctlId = this._ctl?.connect('new-handle', (c, handle) => this._track(handle)) ?? 0;
        } catch (e) {
            console.error(`[Lintel] RemoteAccess no disponible: ${e}`);
        }
        try {
            this._shot = Main.screenshotUI ?? null;
            this._shotId = this._shot?.connect('notify::screencast-in-progress', () => this._emit()) ?? 0;
        } catch (e) {
            this._shot = null;
        }
        this._pollCamera();
    }

    get mic() {
        return this._ctx.sound.micInUse;
    }

    get screen() {
        return this._handles.size > 0 || !!this._shot?.screencast_in_progress;
    }

    get any() {
        return this.mic || this.camera || this.screen;
    }

    _track(handle) {
        if (!(handle.is_recording ?? handle.isRecording ?? false))
            return;
        this._handles.add(handle);
        const id = handle.connect('stopped', () => {
            handle.disconnect(id);
            this._handles.delete(handle);
            if (!this._dead)
                this._emit();
        });
        this._emit();
    }

    _setCamera(value) {
        if (value === this.camera || this._dead)
            return;
        this.camera = value;
        this._emit();
    }

    _pollCamera() {
        if (this._dead)
            return;
        const next = () => {
            if (!this._dead)
                this._timer = this._ctx.later(4000, () => this._pollCamera());
        };
        if (!GLib.file_test('/dev/video0', GLib.FileTest.EXISTS)) {
            this._setCamera(false);
            next();
            return;
        }
        try {
            const proc = Gio.Subprocess.new(
                ['sh', '-c', 'find /proc/[0-9]*/fd -lname "/dev/video*" -print -quit 2>/dev/null'],
                Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_SILENCE);
            proc.communicate_utf8_async(null, null, (p, res) => {
                try {
                    const [, out] = p.communicate_utf8_finish(res);
                    this._setCamera(!!out?.trim());
                } catch (e) {
                    this._setCamera(false);
                }
                next();
            });
        } catch (e) {
            next();
        }
    }

    destroy() {
        this._dead = true;
        this._ctx.cancel(this._timer);
        this._offSound?.();
        if (this._ctlId)
            this._ctl?.disconnect(this._ctlId);
        if (this._shotId)
            this._shot?.disconnect(this._shotId);
        this._handles.clear();
        this._cb?.clear();
    }
}

// ── Elementos de menú con aspecto macOS: icono · texto · atajo ────────────
// keepOpen: el clic ejecuta la acción pero NO cierra el menú (Wi-Fi, Bluetooth…).
const LintelItem = GObject.registerClass(
class LintelItem extends PopupMenu.PopupBaseMenuItem {
    _init({
        label, icon, gicon, hint, checked = false, disabled = false, bold = false,
        info = false, heading = false, keepOpen = false, trailing = [],
    }) {
        super._init(info ? {activate: false, hover: false, can_focus: false} : {});
        this.add_style_class_name('lintel-item');
        this._keepOpen = keepOpen;
        this._keepOpenCb = null;
        if (info)
            this.add_style_class_name('lintel-item-info');
        if (heading)
            this.add_style_class_name('lintel-item-heading');
        if (!info) {
            // Siempre se reserva la columna del icono para que todo quede alineado.
            if (gicon || checked || icon) {
                this._icon = new St.Icon({
                    style_class: 'popup-menu-icon lintel-item-icon',
                    y_align: CENTER,
                    ...(gicon ? {gicon} : {icon_name: checked ? 'object-select-symbolic' : icon}),
                });
                this.add_child(this._icon);
            } else {
                this.add_child(new St.Widget({style_class: 'lintel-item-icon-slot'}));
            }
        }
        this.label = new St.Label({
            text: label,
            x_expand: true,
            y_align: CENTER,
            style_class: bold ? 'lintel-item-label lintel-item-bold' : 'lintel-item-label',
        });
        this.add_child(this.label);
        this.label_actor = this.label;
        if (hint) {
            this.add_child(new St.Label({
                text: hint, y_align: CENTER, style_class: 'lintel-item-hint',
            }));
        }
        for (const name of trailing) {
            this.add_child(new St.Icon({
                ...iconProps(name), y_align: CENTER, style_class: 'lintel-item-trailing',
            }));
        }
        if (disabled)
            this.setSensitive(false);
    }

    activate(event) {
        if (this._keepOpen) {
            this._keepOpenCb?.(event);
            return;
        }
        super.activate(event);
    }
});

// Fila con interruptor que NO cierra el menú al pulsarla (el de GNOME sí lo hace).
const LintelToggleItem = GObject.registerClass({
    Signals: {'toggled': {param_types: [GObject.TYPE_BOOLEAN]}},
}, class LintelToggleItem extends PopupMenu.PopupBaseMenuItem {
    _init(label, active) {
        super._init();
        this.add_style_class_name('lintel-item');
        this.add_style_class_name('lintel-toggle-item');
        this.label = new St.Label({
            text: label,
            x_expand: true,
            y_align: CENTER,
            style_class: 'lintel-item-label lintel-item-bold',
        });
        this.add_child(this.label);
        this.label_actor = this.label;
        this._switch = new PopupMenu.Switch(active);
        this._syncingState = false;
        this._switch.connect('notify::state', () => {
            if (!this._syncingState) this.emit('toggled', this._switch.state);
        });
        this._switch.y_align = CENTER;
        this.add_child(this._switch);
    }

    get state() {
        return this._switch.state;
    }

    // Actualiza el interruptor sin emitir 'toggled' (cambios que vienen del sistema).
    setState(value) {
        this._syncingState = true;
        try { this._switch.state = value; }
        finally { this._syncingState = false; }
    }

    activate() {
        this._switch.toggle();
    }
});

function addItem(menu, opts, cb) {
    if (opts.icon === undefined && !opts.gicon && !opts.checked && !opts.info)
        opts = {...opts, icon: iconFor(opts.label)};
    const item = new LintelItem(opts);
    if (cb) {
        if (opts.keepOpen)
            item._keepOpenCb = cb;
        else
            item.connect('activate', cb);
    }
    menu.addMenuItem(item);
    return item;
}

const addSep = menu => menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
const addHeading = (menu, label) => addItem(menu, {label, info: true, heading: true});

// ── Botones base ──────────────────────────────────────────────────────────
// Registro de botones vivos: permite repintar colores y tema sin reiniciar la sesión.
const buttons = new Set();

function refreshTheme() {
    buttons.forEach(b => b.applyTheme());
}

const LintelButton = GObject.registerClass(
class LintelButton extends PanelMenu.Button {
    _init(name, align = 0.0, noMenu = false) {
        super._init(align, name, noMenu);
        this.add_style_class_name('lintel-button');
        this._before = null;
        this._hasMenu = !noMenu;
        // Los indicadores con color propio (privacidad) no se tiñen con COLOR_ICONOS.
        this._noTint = false;
        buttons.add(this);
        this.connect('destroy', () => buttons.delete(this));
        if (!noMenu) {
            this.menu.actor.add_style_class_name('lintel-menu');
            this.menu.box.add_style_class_name('lintel-menu-content');
            this._wrapMenu();
        }
        this.applyTheme();
    }

    // Apertura/cierre casi instantáneos: sin deslizamiento de GNOME y con un fundido corto.
    _wrapMenu() {
        const menu = this.menu;
        const open = menu.open.bind(menu);
        const close = menu.close.bind(menu);
        menu.open = () => {
            try {
                this._before?.();
            } catch (e) {
                console.error(`[Lintel] menú: ${e}`);
            }
            open(BoxPointer.PopupAnimation.NONE);
            if (theme.animMs > 0) {
                const actor = menu.actor;
                actor.remove_all_transitions();
                actor.opacity = 0;
                actor.ease({
                    opacity: 255,
                    duration: theme.animMs,
                    mode: Clutter.AnimationMode.EASE_OUT_QUAD,
                });
            }
        };
        menu.close = () => close(BoxPointer.PopupAnimation.NONE);
        menu.connect('open-state-changed', (m, isOpen) => this.retint(isOpen));
    }

    // Reconstruye el contenido justo antes de abrir, para que el tamaño sea correcto.
    beforeOpen(fn) {
        this._before = fn;
    }

    applyTheme() {
        if (this._hasMenu) {
            if (theme.menuDark)
                this.menu.actor.add_style_class_name('lintel-dark');
            else
                this.menu.actor.remove_style_class_name('lintel-dark');
        }
        this.retint(this._hasMenu && this.menu.isOpen);
    }

    // Colores personalizados de texto e iconos. Con el menú abierto el botón es una
    // píldora azul, así que se quita el color propio para que el texto siga legible.
    retint(open = false) {
        if (this._noTint)
            return;
        const paint = actor => {
            if (actor instanceof St.Label)
                actor.set_style(!open && theme.textColor ? `color: ${theme.textColor};` : null);
            else if (actor instanceof St.Icon)
                actor.set_style(!open && theme.iconColor ? `color: ${theme.iconColor};` : null);
            actor.get_children?.().forEach(paint);
        };
        this.get_children().forEach(paint);
    }
});

const TextButton = GObject.registerClass(
class TextButton extends LintelButton {
    _init(title, bold = false) {
        super._init(title, 0.0);
        this._text = new St.Label({
            text: title,
            y_align: CENTER,
            style_class: bold ? 'lintel-bar-label lintel-bar-bold' : 'lintel-bar-label',
        });
        this.add_child(this._text);
    }
});

// ── Acciones de ventana ───────────────────────────────────────────────────
const winOps = {
    close: ctx => ctx.win?.delete(global.get_current_time()),
    minimize: ctx => ctx.win?.minimize(),
    zoom: ctx => {
        const w = ctx.win;
        if (!w)
            return;
        try {
            const max = typeof w.is_maximized === 'function'
                ? w.is_maximized()
                : w.get_maximized() === Meta.MaximizeFlags.BOTH;
            if (max) {
                w.unmaximize();
            } else {
                try {
                    w.maximize();
                } catch (e) {
                    w.maximize(Meta.MaximizeFlags.BOTH);
                }
            }
        } catch (e) {
            console.error(`[Lintel] zoom: ${e}`);
        }
    },
    fullscreen: ctx => {
        const w = ctx.win;
        if (w)
            w.is_fullscreen() ? w.unmake_fullscreen() : w.make_fullscreen();
    },
};

// ── Menús dinámicos según el tipo de aplicación ───────────────────────────
const E = {
    undo: {label: 'Deshacer', keys: 'ctrl+z'},
    redo: {label: 'Rehacer', keys: 'ctrl+shift+z'},
    cut: {label: 'Cortar', keys: 'ctrl+x'},
    copy: {label: 'Copiar', keys: 'ctrl+c'},
    paste: {label: 'Pegar', keys: 'ctrl+v'},
    all: {label: 'Seleccionar todo', keys: 'ctrl+a'},
    find: {label: 'Buscar…', keys: 'ctrl+f'},
    zoomIn: {label: 'Acercar', keys: 'ctrl+plus'},
    zoomOut: {label: 'Alejar', keys: 'ctrl+minus'},
    zoom0: {label: 'Tamaño real', keys: 'ctrl+0'},
    full: {label: 'Pantalla completa', hint: 'F11', run: winOps.fullscreen},
    print: {label: 'Imprimir…', keys: 'ctrl+p'},
    closeWin: {label: 'Cerrar ventana', keys: 'ctrl+w', run: winOps.close},
};

const WINDOW_MENU = {
    title: 'Ventana',
    items: [
        {label: 'Minimizar', keys: 'ctrl+m', run: winOps.minimize},
        {label: 'Zoom', hint: '', run: winOps.zoom},
        {label: 'Mosaico a la izquierda', keys: 'super+Left'},
        {label: 'Mosaico a la derecha', keys: 'super+Right'},
        'sep',
        {label: 'Vista general', hint: 'Super', run: () => Main.overview.toggle()},
        'sep',
        'windows',
    ],
};

const HELP_MENU = {
    title: 'Ayuda',
    items: [
        {label: 'Buscar', hint: 'Super', run: () => Main.overview.show()},
        {label: (ctx, app) => `Ayuda de ${app?.get_name() ?? 'GNOME'}`, keys: 'F1'},
    ],
};

const MENUS = {
    desktop: [
        {title: 'Archivo', items: [
            {label: 'Abrir Archivos', run: () => run('nautilus')},
            {label: 'Captura de pantalla…', run: () => Main.screenshotUI.open()},
        ]},
        {title: 'Edición', items: [
            {label: 'Cambiar fondo de pantalla…', run: () => run('gnome-control-center background')},
            {label: 'Aspecto…', run: () => run('gnome-control-center appearance')},
        ]},
        {title: 'Visualización', items: [
            {label: 'Vista general de actividades', hint: 'Super', run: () => Main.overview.toggle()},
            {label: 'Aplicaciones', run: () => Main.overview.showApps()},
        ]},
        WINDOW_MENU,
        HELP_MENU,
    ],
    generic: [
        {title: 'Archivo', items: [
            {label: 'Nueva ventana', keys: 'ctrl+n'},
            {label: 'Abrir…', keys: 'ctrl+o'},
            {label: 'Guardar', keys: 'ctrl+s'},
            {label: 'Guardar como…', keys: 'ctrl+shift+s'},
            'sep', E.print, 'sep', E.closeWin,
        ]},
        {title: 'Edición', items: [
            E.undo, E.redo, 'sep', E.cut, E.copy, E.paste, E.all, 'sep', E.find,
        ]},
        {title: 'Visualización', items: [E.zoomIn, E.zoomOut, E.zoom0, 'sep', E.full]},
        WINDOW_MENU,
        HELP_MENU,
    ],
    files: [
        {title: 'Archivo', items: [
            {label: 'Nueva ventana', keys: 'ctrl+n'},
            {label: 'Nueva pestaña', keys: 'ctrl+t'},
            {label: 'Nueva carpeta', keys: 'ctrl+shift+n'},
            'sep',
            {label: 'Abrir', keys: 'Return'},
            {label: 'Propiedades', keys: 'alt+Return'},
            'sep', E.closeWin,
        ]},
        {title: 'Edición', items: [
            E.undo, 'sep', E.cut, E.copy, E.paste, E.all,
            {label: 'Invertir selección', keys: 'ctrl+shift+i'},
            'sep', E.find,
        ]},
        {title: 'Visualización', items: [
            {label: 'Como iconos', keys: 'ctrl+1'},
            {label: 'Como lista', keys: 'ctrl+2'},
            'sep',
            {label: 'Mostrar archivos ocultos', keys: 'ctrl+h'},
            'sep', E.zoomIn, E.zoomOut,
            {label: 'Actualizar', keys: 'F5'},
        ]},
        {title: 'Ir', items: [
            {label: 'Atrás', keys: 'alt+Left'},
            {label: 'Adelante', keys: 'alt+Right'},
            {label: 'Carpeta superior', keys: 'alt+Up'},
            'sep',
            {label: 'Carpeta personal', keys: 'alt+Home'},
            {label: 'Ir a ubicación…', keys: 'ctrl+l'},
        ]},
        WINDOW_MENU,
        HELP_MENU,
    ],
    browser: [
        {title: 'Archivo', items: [
            {label: 'Nueva pestaña', keys: 'ctrl+t'},
            {label: 'Nueva ventana', keys: 'ctrl+n'},
            {label: 'Nueva ventana privada',
                keys: (ctx, app) => /firefox/i.test(app?.get_id() ?? '') ? 'ctrl+shift+p' : 'ctrl+shift+n'},
            {label: 'Abrir ubicación…', keys: 'ctrl+l'},
            'sep',
            {label: 'Cerrar pestaña', keys: 'ctrl+w'},
            {label: 'Cerrar ventana', keys: 'ctrl+shift+w', run: winOps.close},
            'sep', E.print,
        ]},
        {title: 'Edición', items: [E.undo, E.redo, 'sep', E.cut, E.copy, E.paste, E.all, 'sep', E.find]},
        {title: 'Visualización', items: [
            {label: 'Recargar esta página', keys: 'ctrl+r'},
            'sep', E.zoomIn, E.zoomOut, E.zoom0, 'sep', E.full,
            'sep',
            {label: 'Código fuente de la página', keys: 'ctrl+u'},
        ]},
        {title: 'Historial', items: [
            {label: 'Atrás', keys: 'alt+Left'},
            {label: 'Adelante', keys: 'alt+Right'},
            {label: 'Inicio', keys: 'alt+Home'},
            'sep',
            {label: 'Mostrar todo el historial', keys: 'ctrl+h'},
        ]},
        {title: 'Marcadores', items: [
            {label: 'Añadir marcador…', keys: 'ctrl+d'},
            {label: 'Mostrar marcadores', keys: 'ctrl+b'},
        ]},
        {title: 'Ventana', items: [
            {label: 'Pestaña siguiente', keys: 'ctrl+Tab'},
            {label: 'Pestaña anterior', keys: 'ctrl+shift+Tab'},
            'sep',
            ...WINDOW_MENU.items,
        ]},
        HELP_MENU,
    ],
    terminal: [
        {title: 'Shell', items: [
            {label: 'Nueva pestaña', keys: 'ctrl+shift+t'},
            {label: 'Nueva ventana', keys: 'ctrl+shift+n'},
            'sep',
            {label: 'Cerrar pestaña', keys: 'ctrl+shift+w'},
            {label: 'Cerrar ventana', keys: 'ctrl+w', run: winOps.close},
        ]},
        {title: 'Edición', items: [
            {label: 'Copiar', keys: 'ctrl+shift+c'},
            {label: 'Pegar', keys: 'ctrl+shift+v'},
            {label: 'Seleccionar todo', keys: 'ctrl+shift+a'},
            'sep',
            {label: 'Buscar…', keys: 'ctrl+shift+f'},
        ]},
        {title: 'Visualización', items: [E.zoomIn, E.zoomOut, E.zoom0, 'sep', E.full]},
        WINDOW_MENU,
        HELP_MENU,
    ],
};

function profileFor(app) {
    if (!app)
        return 'desktop';
    const id = (app.get_id() ?? '').toLowerCase();
    const cats = (app.get_app_info?.()?.get_categories?.() ?? '').toLowerCase();
    if (/nautilus|org\.gnome\.files|nemo|dolphin|thunar|caja/.test(id))
        return 'files';
    if (cats.includes('webbrowser') || /firefox|chrome|chromium|epiphany|brave|vivaldi|opera|msedge/.test(id))
        return 'browser';
    if (cats.includes('terminalemulator') || /terminal|console|kitty|alacritty|ptyxis|wezterm|foot/.test(id))
        return 'terminal';
    return 'generic';
}

function fillMenu(menu, specs, ctx, app) {
    for (const spec of specs) {
        if (spec === 'sep') {
            addSep(menu);
            continue;
        }
        if (spec === 'windows') {
            const wins = app?.get_windows() ?? [];
            if (!wins.length)
                addItem(menu, {label: 'Sin ventanas', disabled: true});
            for (const w of wins) {
                addItem(menu, {label: w.get_title() || app.get_name(), checked: w === ctx.win},
                    () => Main.activateWindow(w));
            }
            continue;
        }
        const label = typeof spec.label === 'function' ? spec.label(ctx, app) : spec.label;
        const keys = typeof spec.keys === 'function' ? spec.keys(ctx, app) : spec.keys;
        addItem(menu, {label, hint: keys ? hintOf(keys) : spec.hint},
            () => spec.run ? spec.run(ctx, app) : ctx.sendKeys(keys));
    }
}

const MenuBarButton = GObject.registerClass(
class MenuBarButton extends TextButton {
    _init(ctx, spec, app) {
        super._init(spec.title);
        this._ctx = ctx;
        this._spec = spec;
        this._app = app;
        this.beforeOpen(() => this._build());
        this._build();
    }

    _build() {
        this.menu.removeAll();
        fillMenu(this.menu, this._spec.items, this._ctx, this._app);
    }
});

// ── Menú de la manzana ────────────────────────────────────────────────────
function sessionCall(method, params = null) {
    busCall(Gio.DBus.session, 'org.gnome.SessionManager', '/org/gnome/SessionManager',
        'org.gnome.SessionManager', method, params);
}

const AppleButton = GObject.registerClass(
class AppleButton extends LintelButton {
    _init(ctx) {
        super._init('Menú de la manzana', 0.0);
        this._ctx = ctx;
        this.add_child(new St.Icon({
            gicon: ctx.icon('lintel-apple-symbolic'),
            style_class: 'system-status-icon lintel-apple-icon',
            y_align: CENTER,
        }));
        this.beforeOpen(() => this._build());
        this._build();
    }

    _build() {
        const menu = this.menu, ctx = this._ctx, app = ctx.app;
        menu.removeAll();
        addItem(menu, {label: 'Acerca de este equipo'}, () => run('gnome-control-center system'));
        addSep(menu);
        addItem(menu, {label: 'Configuración del Sistema…'}, () => run('gnome-control-center'));
        addItem(menu, {label: 'Tienda de aplicaciones…'}, () => run('gnome-software'));
        addSep(menu);

        const favs = new PopupMenu.PopupSubMenuMenuItem('Aplicaciones favoritas', true);
        favs.icon.icon_name = 'starred-symbolic';
        favs.icon.add_style_class_name('lintel-item-icon');
        for (const fav of AppFavorites.getAppFavorites().getFavorites()) {
            addItem(favs.menu, {label: fav.get_name(), gicon: fav.get_icon()}, () => fav.activate());
        }
        menu.addMenuItem(favs);
        addItem(menu, {label: 'Vista general de actividades', hint: 'Super'}, () => Main.overview.toggle());
        addItem(menu, {label: 'Captura de pantalla…', hint: 'Impr Pant'}, () => Main.screenshotUI.open());
        addSep(menu);
        addItem(menu, {
            label: app ? `Forzar salida de ${app.get_name()}` : 'Forzar salida…',
            disabled: !app,
        }, () => app?.get_windows().forEach(w => w.kill()));
        addSep(menu);
        addItem(menu, {label: 'Suspender'}, () => busCall(Gio.DBus.system, 'org.freedesktop.login1',
            '/org/freedesktop/login1', 'org.freedesktop.login1.Manager', 'Suspend',
            new GLib.Variant('(b)', [true])));
        addItem(menu, {label: 'Reiniciar…'}, () => sessionCall('Reboot'));
        addItem(menu, {label: 'Apagar…'}, () => sessionCall('Shutdown'));
        addSep(menu);
        addItem(menu, {label: 'Bloquear pantalla', hint: AJUSTES.ATAJOS_ESTILO_MAC ? '⌃⌘Q' : 'Super+L'},
            () => Main.screenShield.lock(true));
        addItem(menu, {label: `Cerrar sesión de ${GLib.get_real_name()}…`},
            () => sessionCall('Logout', new GLib.Variant('(u)', [0])));
    }
});

// ── Nombre de la app activa ───────────────────────────────────────────────
const AppNameButton = GObject.registerClass(
class AppNameButton extends TextButton {
    _init(ctx) {
        super._init('Escritorio', true);
        this._ctx = ctx;
        this._app = null;
        this.beforeOpen(() => this._build());
        this._build();
    }

    setApp(app) {
        this._app = app;
        this._text.text = app ? app.get_name() : 'Escritorio';
    }

    _workspaceWindows() {
        return global.workspace_manager.get_active_workspace().list_windows()
            .filter(w => w.get_window_type() === Meta.WindowType.NORMAL);
    }

    _build() {
        const menu = this.menu, ctx = this._ctx, app = this._app;
        menu.removeAll();
        if (!app) {
            addItem(menu, {label: 'Acerca de GNOME Shell'}, () => run('gnome-control-center system'));
            addSep(menu);
            addItem(menu, {label: 'Ajustes…'}, () => run('gnome-control-center'));
            return;
        }
        const name = app.get_name();
        addItem(menu, {label: `Acerca de ${name}`},
            () => run(`gnome-software --details=${GLib.shell_quote(app.get_id())}`));
        addSep(menu);
        addItem(menu, {label: 'Ajustes…', hint: hintOf('ctrl+comma')}, () => ctx.sendKeys('ctrl+comma'));

        const info = app.get_app_info?.();
        const actions = info?.list_actions?.() ?? [];
        if (actions.length) {
            addSep(menu);
            for (const a of actions) {
                addItem(menu, {label: info.get_action_name(a)},
                    () => info.launch_action(a, global.create_app_launch_context(0, -1)));
            }
        }
        addSep(menu);
        addItem(menu, {label: `Ocultar ${name}`, hint: hintOf('ctrl+h')},
            () => app.get_windows().forEach(w => w.minimize()));
        addItem(menu, {label: 'Ocultar otros', hint: AJUSTES.ATAJOS_ESTILO_MAC ? '⌥⌘H' : 'Alt+Ctrl+H'}, () => {
            const tracker = Shell.WindowTracker.get_default();
            this._workspaceWindows()
                .filter(w => !w.minimized && tracker.get_window_app(w) !== app)
                .forEach(w => w.minimize());
        });
        addItem(menu, {label: 'Mostrar todo'},
            () => this._workspaceWindows().forEach(w => w.minimized && w.unminimize()));
        addSep(menu);
        addItem(menu, {label: `Salir de ${name}`, hint: hintOf('ctrl+q')}, () => app.request_quit());
    }
});

// ── Estado: batería ───────────────────────────────────────────────────────
const UPowerProxy = Gio.DBusProxy.makeProxyWrapper(`
<node><interface name="org.freedesktop.UPower.Device">
  <property name="State" type="u" access="read"/>
  <property name="Percentage" type="d" access="read"/>
  <property name="TimeToEmpty" type="x" access="read"/>
  <property name="TimeToFull" type="x" access="read"/>
  <property name="IsPresent" type="b" access="read"/>
  <property name="IconName" type="s" access="read"/>
</interface></node>`);

const fmtHM = s => `${Math.floor(s / 3600)}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}`;

// Icono propio de batería: relleno en pasos del 5 % y rayo si está conectada a la corriente.
const batteryIcon = p => {
    const pct = Math.round(clamp(p.Percentage / 100) * 20) * 5;
    const plugged = [1, 4, 5].includes(p.State);
    return `lintel-battery-${pct}${plugged ? '-charging' : ''}-symbolic`;
};

const BatteryButton = GObject.registerClass(
class BatteryButton extends LintelButton {
    _init() {
        super._init('Batería', 1.0);
        this._dead = false;
        const box = new St.BoxLayout({style_class: 'lintel-battery-indicator'});
        this._pct = new St.Label({y_align: CENTER, style_class: 'lintel-bar-label lintel-tnum'});
        this._icon = new St.Icon({
            style_class: 'system-status-icon lintel-battery-icon',
            gicon: fileIcon('lintel-battery-100-symbolic'),
        });
        box.add_child(this._pct);
        box.add_child(this._icon);
        this.add_child(box);
        this.container.visible = false;
        this._proxy = new UPowerProxy(Gio.DBus.system, 'org.freedesktop.UPower',
            '/org/freedesktop/UPower/devices/DisplayDevice', (p, err) => {
                if (err || this._dead)
                    return;
                this._id = p.connect('g-properties-changed', () => this._sync());
                this._sync();
            });
        this.connect('destroy', () => {
            this._dead = true;
            if (this._id)
                this._proxy?.disconnect(this._id);
            this._proxy = null;
        });
        this.beforeOpen(() => this._build());
    }

    _sync() {
        const p = this._proxy;
        if (!p)
            return;
        this.container.visible = !!p.IsPresent;
        this._pct.text = `${Math.round(p.Percentage)}%`;
        this._icon.gicon = fileIcon(batteryIcon(p));
    }

    _build() {
        const menu = this.menu, p = this._proxy;
        menu.removeAll();
        if (!p)
            return;
        const charging = p.State === 1, full = p.State === 4;
        addItem(menu, {label: 'Batería', bold: true, info: true});
        addItem(menu, {
            label: `${Math.round(p.Percentage)} %  ·  ${full ? 'Completa' : charging ? 'Cargando' : 'Usando batería'}`,
            info: true,
        });
        const secs = charging ? Number(p.TimeToFull) : Number(p.TimeToEmpty);
        if (!full && secs > 0) {
            addItem(menu, {
                label: charging ? `${fmtHM(secs)} para completar la carga` : `${fmtHM(secs)} restantes`,
                info: true,
            });
        }
        addSep(menu);
        addItem(menu, {label: 'Ajustes de Batería…'}, () => run('gnome-control-center power'));
    }
});

// ── Estado: Bluetooth ─────────────────────────────────────────────────────
const BluetoothButton = GObject.registerClass(
class BluetoothButton extends LintelButton {
    _init(ctx) {
        super._init('Bluetooth', 1.0);
        this._ctx = ctx;
        this._header = null;
        this._list = null;
        this._listSig = '';
        this._rebuildId = 0;
        this._icon = new St.Icon({
            style_class: 'system-status-icon',
            gicon: fileIcon('lintel-bluetooth-off-symbolic'),
        });
        this.add_child(this._icon);
        this.menu.box.add_style_class_name('lintel-menu-wide');
        this._off = ctx.bluetooth.onChange(() => this._onModel());
        this.beforeOpen(() => this._build());
        this.menu.connect('open-state-changed', (m, open) => this._onOpenChanged(open));
        this.connect('destroy', () => {
            if (this._pollId) GLib.source_remove(this._pollId);
            this._pollId = 0;
        });
        this.connect('destroy', () => this._off());
        this._sync();
    }

    _sync() {
        const bluetooth = this._ctx.bluetooth;
        this.container.visible = bluetooth.available;
        this._icon.gicon = fileIcon(bluetooth.powered
            ? 'lintel-bluetooth-on-symbolic'
            : 'lintel-bluetooth-off-symbolic');
    }

    _onModel() {
        this._sync();
        if (!this.menu.isOpen)
            return;
        if (this._ctx.bluetooth.powered)
            this._ctx.bluetooth.startDiscovery();
        this._soon();
    }

    _onOpenChanged(open) {
        const bluetooth = this._ctx.bluetooth;
        if (this._pollId) GLib.source_remove(this._pollId);
        this._pollId = 0;
        if (open) {
            bluetooth.refresh();
            bluetooth.startDiscovery();
            this._pollId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 2, () => {
                bluetooth.refresh();
                return GLib.SOURCE_CONTINUE;
            });
        } else {
            bluetooth.stopDiscovery();
        }
    }

    // Reagrupa varios cambios seguidos en una sola actualización de la lista.
    _soon() {
        if (this._rebuildId)
            return;
        this._rebuildId = this._ctx.later(200, () => {
            this._rebuildId = 0;
            if (!this.menu.isOpen)
                return;
            this._header?.setState(this._ctx.bluetooth.powered);
            this._fillList(false);
        });
    }

    _build() {
        const menu = this.menu, bluetooth = this._ctx.bluetooth;
        menu.removeAll();
        this._header = new LintelToggleItem('Bluetooth', bluetooth.powered);
        this._header.connect('toggled', (item, state) => bluetooth.setPowered(state));
        menu.addMenuItem(this._header);
        this._list = new PopupMenu.PopupMenuSection();
        menu.addMenuItem(this._list);
        this._listSig = '';
        this._fillList(true);
        addSep(menu);
        addItem(menu, {label: 'Ajustes de Bluetooth…'}, () => run('gnome-control-center bluetooth'));
    }

    _fillList(force) {
        const list = this._list, bluetooth = this._ctx.bluetooth;
        if (!list)
            return;
        const paired = bluetooth.paired;
        const nearby = bluetooth.nearby.slice(0, 8);
        const sig = JSON.stringify([
            bluetooth.powered, bluetooth.discovering,
            paired.map(d => [d.path, d.name, d.icon, d.connected, bluetooth.isBusy(d)]),
            nearby.map(d => [d.path, d.name, d.icon, bluetooth.isBusy(d)]),
        ]);
        if (!force && sig === this._listSig)
            return;
        this._listSig = sig;
        list.removeAll();
        if (!bluetooth.powered)
            return;

        const row = device => addItem(list, {
            label: device.name,
            icon: btIcon(device.icon),
            hint: bluetooth.isBusy(device) ? 'Conectando…' : device.connected ? 'Conectado' : undefined,
            keepOpen: true,
        }, () => bluetooth.toggleDevice(device));

        addSep(list);
        if (paired.length) {
            addHeading(list, 'Mis dispositivos');
            paired.forEach(row);
        }
        addHeading(list, 'Dispositivos cercanos');
        nearby.forEach(row);
        if (!nearby.length) {
            addItem(list, {
                label: bluetooth.discovering ? 'Buscando dispositivos…' : 'Sin dispositivos cercanos',
                info: true,
            });
        }
    }
});

// ── Estado: Wi-Fi ─────────────────────────────────────────────────────────
const wifiLevel = s => s > 80 ? 'excellent' : s > 55 ? 'good' : s > 30 ? 'ok' : s > 5 ? 'weak' : 'none';
// Tramos encendidos (0 a 3) del icono propio de Wi-Fi.
const wifiBars = s => s > 55 ? 3 : s > 30 ? 2 : s > 5 ? 1 : 0;
const ssidOf = ap => {
    const raw = ap.get_ssid();
    return raw ? NM.utils_ssid_to_utf8(raw.get_data()) : null;
};

const WifiButton = GObject.registerClass(
class WifiButton extends LintelButton {
    _init(ctx) {
        super._init('Wi-Fi', 1.0);
        this._ctx = ctx;
        this._dead = false;
        this._client = null;
        this._ids = [];
        this._devIds = [];
        this._apId = 0;
        this._ap = null;
        this._rebuildId = 0;
        this._scanId = 0;
        this._header = null;
        this._list = null;
        this._listSig = '';
        this._connecting = null;
        this._listeners = new Set();
        this._icon = new St.Icon({
            style_class: 'system-status-icon',
            gicon: fileIcon('lintel-wifi-off-symbolic'),
        });
        this.add_child(this._icon);
        this.container.visible = false;
        this.menu.box.add_style_class_name('lintel-menu-wide');
        this.beforeOpen(() => this._build());
        this.menu.connect('open-state-changed', (m, open) => this._onOpenChanged(open));
        this.connect('destroy', () => this._teardown());
        NM.Client.new_async(null, (o, res) => {
            try {
                const c = NM.Client.new_finish(res);
                if (this._dead)
                    return;
                this._client = c;
                this._ids = [
                    'notify::wireless-enabled', 'notify::active-connections',
                    'notify::connectivity', 'device-added', 'device-removed',
                ]
                    .map(s => c.connect(s, () => this._sync()));
                this._sync();
            } catch (e) {
                console.error(`[Lintel] NetworkManager: ${e}`);
            }
        });
    }

    onChange(fn) {
        this._listeners.add(fn);
        return () => this._listeners.delete(fn);
    }

    get enabled() {
        return this._client?.wireless_enabled ?? false;
    }

    get device() {
        return this._client?.get_devices().find(d => d.get_device_type() === NM.DeviceType.WIFI) ?? null;
    }

    get activeSsid() {
        const ap = this.device?.get_active_access_point?.();
        return ap ? ssidOf(ap) : null;
    }

    get ethernetDevices() {
        return this._client?.get_devices()
            .filter(d => d.get_device_type() === NM.DeviceType.ETHERNET) ?? [];
    }

    get ethernetAvailable() {
        return this.ethernetDevices.length > 0;
    }

    get ethernetConnected() {
        return this.ethernetDevices.some(d => d.get_state() === NM.DeviceState.ACTIVATED);
    }

    get ethernetName() {
        const device = this.ethernetDevices
            .find(d => d.get_state() === NM.DeviceState.ACTIVATED);
        return device?.get_active_connection?.()?.get_id?.() ?? null;
    }

    get vpnAvailable() {
        return this._client?.get_connections()
            .some(c => c.get_connection_type?.() === 'vpn') ?? false;
    }

    get vpnActive() {
        return this._client?.get_active_connections()
            .some(c => c.get_vpn?.()) ?? false;
    }

    setEnabled(v) {
        this._client?.dbus_set_property(NM.DBUS_PATH, NM.DBUS_INTERFACE, 'WirelessEnabled',
            GLib.Variant.new_boolean(v), -1, null, () => {});
    }

    _watch() {
        const dev = this.device;
        this._devIds.forEach(([o, id]) => GObject.signal_handler_disconnect(o, id));
        this._devIds = [];
        if (dev) {
            this._devIds.push([dev, dev.connect('notify::active-access-point', () => this._sync())]);
            this._devIds.push([dev, dev.connect('notify::last-scan', () => this._soon())]);
            this._devIds.push([dev, dev.connect('notify::state', () => this._soon())]);
            this._devIds.push([dev, dev.connect('access-point-added', () => this._soon())]);
            this._devIds.push([dev, dev.connect('access-point-removed', () => this._soon())]);
        }
        for (const device of this.ethernetDevices)
            this._devIds.push([device, device.connect('notify::state', () => this._sync())]);
        this._watchedDev = dev;
        this._watchedDevices = this._deviceSignature();
    }

    _deviceSignature() {
        return this._client?.get_devices().map(d => d.get_path()).sort().join('|') ?? '';
    }

    _sync() {
        if (this._dead)
            return;
        const dev = this.device;
        if (dev !== this._watchedDev || this._deviceSignature() !== this._watchedDevices)
            this._watch();
        this.container.visible = !!dev;
        const ap = dev?.get_active_access_point?.() ?? null;
        if (this._apId && this._ap)
            this._ap.disconnect(this._apId);
        this._apId = 0;
        this._ap = ap;
        if (ap)
            this._apId = ap.connect('notify::strength', () => this._sync());
        this._icon.gicon = fileIcon(!this.enabled
            ? 'lintel-wifi-off-symbolic'
            : `lintel-wifi-${ap ? wifiBars(ap.get_strength()) : 0}-symbolic`);
        this._listeners.forEach(f => f());
        this._soon();
    }

    _scan() {
        if (!this.enabled)
            return;
        try {
            this.device?.request_scan_async(null, () => {});
        } catch (e) {
            // Escaneo reciente: se ignora.
        }
    }

    _onOpenChanged(open) {
        this._ctx.cancel(this._scanId);
        this._scanId = 0;
        if (!open)
            return;
        this._scan();
        // Mientras el menú está abierto se reescanea cada 8 s para que las redes no se queden viejas.
        const tick = () => {
            if (!this.menu.isOpen)
                return;
            this._scan();
            this._scanId = this._ctx.later(8000, tick);
        };
        this._scanId = this._ctx.later(8000, tick);
    }

    // Reagrupa varios eventos de NetworkManager en una sola actualización de la lista.
    _soon() {
        if (!this.menu.isOpen || this._rebuildId)
            return;
        this._rebuildId = this._ctx.later(250, () => {
            this._rebuildId = 0;
            if (!this.menu.isOpen)
                return;
            this._header?.setState(this.enabled);
            this._fillList(false);
        });
    }

    _build() {
        const menu = this.menu;
        menu.removeAll();
        this._header = new LintelToggleItem('Wi-Fi', this.enabled);
        this._header.connect('toggled', (item, state) => {
            this.setEnabled(state);
            if (state)
                this._ctx.later(1500, () => this._scan());
        });
        menu.addMenuItem(this._header);
        this._list = new PopupMenu.PopupMenuSection();
        menu.addMenuItem(this._list);
        this._listSig = '';
        this._fillList(true);
        addSep(menu);
        addItem(menu, {label: 'Ajustes de Wi-Fi…'}, () => run('gnome-control-center wifi'));
    }

    _knownSsids() {
        const known = new Set();
        for (const conn of this._client?.get_connections() ?? []) {
            const raw = conn.get_setting_wireless?.()?.get_ssid();
            if (raw)
                known.add(NM.utils_ssid_to_utf8(raw.get_data()));
        }
        return known;
    }

    _networkRows() {
        const dev = this.device;
        if (!dev)
            return [];
        const active = this.activeSsid;
        const known = this._knownSsids();
        const best = new Map();
        for (const ap of dev.get_access_points()) {
            const ssid = ssidOf(ap);
            if (!ssid)
                continue;
            const current = best.get(ssid);
            if (!current || current.get_strength() < ap.get_strength())
                best.set(ssid, ap);
        }
        return [...best.entries()].map(([ssid, ap]) => ({
            ssid,
            ap,
            active: ssid === active,
            secure: ap.get_rsn_flags() !== 0 || ap.get_wpa_flags() !== 0,
            strength: ap.get_strength(),
            known: known.has(ssid),
        })).sort((a, b) => (b.active - a.active) || (b.known - a.known) || (b.strength - a.strength));
    }

    _fillList(force) {
        const list = this._list;
        if (!list)
            return;
        const rows = this.enabled ? this._networkRows() : [];
        const sig = JSON.stringify([
            this.enabled, !!this.device, this._connecting,
            rows.map(r => [r.ssid, r.active, r.secure, wifiLevel(r.strength), r.known]),
        ]);
        if (!force && sig === this._listSig)
            return;
        this._listSig = sig;
        list.removeAll();
        if (!this.enabled || !this.device)
            return;

        addSep(list);
        if (!rows.length) {
            addItem(list, {label: 'Buscando redes…', info: true});
            return;
        }
        const row = r => addItem(list, {
            label: r.ssid,
            icon: null,
            checked: r.active,
            hint: this._connecting === r.ssid ? 'Conectando…' : undefined,
            trailing: [
                ...(r.secure ? ['channel-secure-symbolic'] : []),
                `lintel-wifi-${wifiBars(r.strength)}-symbolic`,
            ],
            keepOpen: true,
        }, () => {
            if (!r.active)
                this._connect(r);
        });

        const active = rows.filter(r => r.active);
        const others = rows.filter(r => !r.active).slice(0, 12);
        active.forEach(row);
        if (others.length) {
            addHeading(list, active.length ? 'Otras redes' : 'Redes cercanas');
            others.forEach(row);
        }
    }

    _connect(row) {
        const dev = this.device;
        if (!this._client || !dev || this._connecting)
            return;
        this._connecting = row.ssid;
        this._fillList(true);

        const finish = (client, res, added) => {
            if (this._dead)
                return;
            try {
                if (added)
                    client.add_and_activate_connection_finish(res);
                else
                    client.activate_connection_finish(res);
            } catch (e) {
                console.error(`[Lintel] Wi-Fi ${row.ssid}: ${e.message}`);
            }
            this._connecting = null;
            if (this.menu.isOpen)
                this._fillList(true);
        };

        const known = this._client.get_connections().find(conn => {
            const raw = conn.get_setting_wireless?.()?.get_ssid();
            return raw && NM.utils_ssid_to_utf8(raw.get_data()) === row.ssid;
        });
        if (known) {
            this._client.activate_connection_async(known, dev, row.ap.get_path(), null,
                (c, r) => finish(c, r, false));
        } else {
            // Sin perfil guardado: NetworkManager crea uno y GNOME Shell pide la contraseña.
            this._client.add_and_activate_connection_async(null, dev, row.ap.get_path(), null,
                (c, r) => finish(c, r, true));
        }
    }

    _teardown() {
        this._dead = true;
        this._ctx.cancel(this._scanId);
        this._ctx.cancel(this._rebuildId);
        this._ids.forEach(id => this._client?.disconnect(id));
        this._devIds.forEach(([o, id]) => GObject.signal_handler_disconnect(o, id));
        if (this._apId && this._ap)
            this._ap.disconnect(this._apId);
        this._listeners.clear();
        this._client = null;
    }
});

// ── Controles deslizantes ─────────────────────────────────────────────────
function makeSlider(value, onChange, styleClass = 'lintel-slider') {
    const slider = new Slider(value);
    slider.add_style_class_name(styleClass);
    slider.x_expand = true;
    slider.y_align = CENTER;
    let busy = false;
    slider.connect('notify::value', () => {
        if (!busy)
            onChange(slider.value);
    });
    slider.setSilently = v => {
        busy = true;
        slider.value = v;
        busy = false;
    };
    return slider;
}

// ── Estado: sonido ────────────────────────────────────────────────────────
const SoundButton = GObject.registerClass(
class SoundButton extends LintelButton {
    _init(ctx) {
        super._init('Sonido', 1.0);
        this._ctx = ctx;
        this._icon = new St.Icon({
            style_class: 'system-status-icon',
            gicon: fileIcon('lintel-sound-medium-symbolic'),
        });
        this.add_child(this._icon);
        this._off = ctx.sound.onChange(() => this._sync());
        this.connect('destroy', () => this._off());
        this.beforeOpen(() => this._build());
        this._sync();
    }

    _sync() {
        this._icon.gicon = fileIcon(this._ctx.sound.iconFile);
        this.container.visible = this._ctx.sound.ready;
        if (this._slider)
            this._slider.setSilently(this._ctx.sound.level);
    }

    _build() {
        const menu = this.menu, sound = this._ctx.sound;
        menu.removeAll();
        addItem(menu, {label: 'Sonido', bold: true, info: true});
        const row = new PopupMenu.PopupBaseMenuItem({activate: false});
        row.add_style_class_name('lintel-slider-row');
        const mute = new St.Button({child: new St.Icon({icon_name: sound.iconName, style_class: 'lintel-slider-icon'}),
            style_class: 'lintel-slider-button', can_focus: true});
        mute.connect('clicked', () => sound.toggleMute());
        this._slider = makeSlider(sound.level, v => sound.setLevel(v));
        row.add_child(mute);
        row.add_child(this._slider);
        row.connect('key-press-event', (a, ev) => this._slider.emit('key-press-event', ev));
        menu.addMenuItem(row);

        const sinks = sound.sinks;
        if (sinks.length > 1) {
            addSep(menu);
            addItem(menu, {label: 'Salida', bold: true, info: true});
            for (const s of sinks) {
                addItem(menu, {label: s.description ?? s.name, checked: s === sound.sink},
                    () => sound.setDefault(s));
            }
        }
        addSep(menu);
        addItem(menu, {label: 'Ajustes de Sonido…'}, () => run('gnome-control-center sound'));
    }
});

// ── Buscar ────────────────────────────────────────────────────────────────
const SearchButton = GObject.registerClass(
class SearchButton extends LintelButton {
    _init() {
        super._init('Buscar', 1.0, true);
        this.add_child(new St.Icon({
            style_class: 'system-status-icon',
            gicon: fileIcon('lintel-search-symbolic'),
        }));
        this.connect('button-press-event', () => {
            Main.overview.toggle();
            return Clutter.EVENT_STOP;
        });
    }
});

// ── Privacidad: puntos de micrófono / cámara / grabación ──────────────────
const PrivacyButton = GObject.registerClass(
class PrivacyButton extends LintelButton {
    _init(ctx) {
        super._init('Privacidad', 1.0, true);
        this._ctx = ctx;
        this._noTint = true;
        this.reactive = false;
        this.can_focus = false;
        const box = new St.BoxLayout({style_class: 'lintel-privacy-box'});
        const make = (icon, cls) => new St.Icon({
            gicon: fileIcon(icon),
            style_class: `system-status-icon lintel-priv-icon ${cls}`,
        });
        this._mic = make('lintel-mic-symbolic', 'lintel-priv-mic');
        this._camera = make('lintel-camera-symbolic', 'lintel-priv-camera');
        this._screen = make('lintel-record-symbolic', 'lintel-priv-screen');
        [this._mic, this._camera, this._screen].forEach(i => box.add_child(i));
        this.add_child(box);
        this._off = ctx.privacy.onChange(() => this._sync());
        this.connect('destroy', () => this._off());
        this._sync();
    }

    _sync() {
        const p = this._ctx.privacy;
        this._mic.visible = p.mic;
        this._camera.visible = p.camera;
        this._screen.visible = p.screen;
        this.container.visible = p.any;
    }
});

// ── Teclado: distribución activa y selector ───────────────────────────────
const KeyboardButton = GObject.registerClass(
class KeyboardButton extends LintelButton {
    _init(ctx) {
        super._init('Teclado', 1.0);
        this._ctx = ctx;
        this._dead = false;
        this._mgr = null;
        this._ids = [];
        this._label = new St.Label({y_align: CENTER, style_class: 'lintel-bar-label lintel-kbd-label'});
        this.add_child(this._label);
        this.container.visible = false;
        this.beforeOpen(() => this._build());
        this.connect('destroy', () => {
            this._dead = true;
            this._ids.forEach(id => this._mgr?.disconnect(id));
            this._ids = [];
            this._mgr = null;
        });
        import('resource:///org/gnome/shell/ui/status/keyboard.js').then(mod => {
            if (this._dead)
                return;
            this._mgr = mod.getInputSourceManager();
            this._ids = ['sources-changed', 'current-source-changed']
                .map(s => this._mgr.connect(s, () => this._sync()));
            this._sync();
        }).catch(e => console.error(`[Lintel] teclado no disponible: ${e}`));
    }

    _sources() {
        return Object.values(this._mgr?.inputSources ?? {}).sort((a, b) => a.index - b.index);
    }

    _sync() {
        if (this._dead)
            return;
        const current = this._mgr?.currentSource;
        this._label.text = (current?.shortName ?? current?.displayName ?? '').toUpperCase();
        this.container.visible = this._sources().length > 1;
    }

    _build() {
        const menu = this.menu, current = this._mgr?.currentSource;
        menu.removeAll();
        for (const source of this._sources()) {
            addItem(menu, {label: source.displayName ?? source.shortName, checked: source === current},
                () => source.activate(true));
        }
        addSep(menu);
        addItem(menu, {label: 'Ajustes de Teclado…'}, () => run('gnome-control-center keyboard'));
    }
});

// ── Centro de control ─────────────────────────────────────────────────────
// Rejilla fija de 280 px de contenido:
//   [ tarjeta de conexiones 170 ] [ 2 mosaicos verticales 102 ]   (hueco 8)
//   [ mosaico ancho 136 ] [ mosaico ancho 136 ]                    (hueco 8)
//   [ tarjeta de brillo 280 ]
//   [ tarjeta de sonido 280 ]
const TILE_BOX = {row: 142, vertical: 84, wide: 118};

const ControlCenterButton = GObject.registerClass(
class ControlCenterButton extends LintelButton {
    _init(ctx) {
        super._init('Centro de control', 1.0);
        this._ctx = ctx;
        this._offs = [];
        this._settings = [];
        this.menu.actor.add_style_class_name('lintel-cc-menu');
        this.menu.box.add_style_class_name('lintel-cc-menu-content');
        this.add_child(new St.Icon({
            gicon: ctx.icon('lintel-controls-symbolic'),
            style_class: 'system-status-icon',
        }));

        const holder = new PopupMenu.PopupBaseMenuItem({activate: false, hover: false, can_focus: false});
        holder.add_style_class_name('lintel-cc-holder');
        const col = new St.BoxLayout({vertical: true, x_expand: true, style_class: 'lintel-cc-content'});
        holder.add_child(col);
        this.menu.addMenuItem(holder);

        const interfaceS = settingsFor('org.gnome.desktop.interface');
        const colorS = settingsFor('org.gnome.settings-daemon.plugins.color');
        const notifS = settingsFor('org.gnome.desktop.notifications');
        const privacyS = settingsFor('org.gnome.desktop.privacy');
        const locationS = settingsFor('org.gnome.system.location');
        const caffeineS = settingsForExtension(
            'org.gnome.shell.extensions.caffeine', 'caffeine@patapon.info');
        this._settings = [interfaceS, colorS, notifS, privacyS, locationS, caffeineS].filter(Boolean);

        const connectivityTiles = [];
        const featureTiles = [];
        const utilityTiles = [];

        // ── Conexiones ──
        const wifiTile = this._tile('lintel-wifi-3-symbolic', 'Wi-Fi',
            () => ctx.wifi.setEnabled(!ctx.wifi.enabled), {variant: 'row'});
        wifiTile.update = () => wifiTile.set(ctx.wifi.enabled,
            ctx.wifi.enabled ? (ctx.wifi.activeSsid ?? 'Sin conexión') : 'Desactivado');
        this._offs.push(ctx.wifi.onChange(wifiTile.update));
        connectivityTiles.push(wifiTile);

        const btTile = this._tile('lintel-bluetooth-on-symbolic', 'Bluetooth',
            () => ctx.bluetooth.setPowered(!ctx.bluetooth.powered), {variant: 'row'});
        btTile.update = () => {
            btTile.btn.visible = ctx.bluetooth.available;
            const connected = ctx.bluetooth.paired.filter(device => device.connected);
            btTile.set(ctx.bluetooth.powered, !ctx.bluetooth.powered ? 'Desactivado'
                : connected.length ? connected.map(device => device.name).join(', ') : 'Activado');
        };
        this._offs.push(ctx.bluetooth.onChange(btTile.update));
        connectivityTiles.push(btTile);

        const ethernetTile = this._tile('network-wired-symbolic', 'Ethernet', () => {
            this.menu.close();
            run('gnome-control-center network');
        }, {variant: 'row'});
        ethernetTile.update = () => {
            ethernetTile.btn.visible = ctx.wifi.ethernetAvailable;
            ethernetTile.set(ctx.wifi.ethernetConnected,
                ctx.wifi.ethernetConnected ? (ctx.wifi.ethernetName ?? 'Conectado') : 'Desconectado');
        };
        this._offs.push(ctx.wifi.onChange(ethernetTile.update));
        connectivityTiles.push(ethernetTile);

        const vpnTile = this._tile('network-vpn-symbolic', 'VPN', () => {
            this.menu.close();
            run('gnome-control-center network');
        }, {variant: 'row'});
        vpnTile.update = () => vpnTile.set(ctx.wifi.vpnActive,
            ctx.wifi.vpnActive ? 'Conectada' : ctx.wifi.vpnAvailable ? 'Disponible' : 'Sin configurar');
        this._offs.push(ctx.wifi.onChange(vpnTile.update));
        connectivityTiles.push(vpnTile);

        // ── Mosaicos verticales (columna derecha) ──
        if (interfaceS) {
            const dark = this._tile('weather-clear-night-symbolic', 'Aspecto', () => {
                const isDark = interfaceS.get_string('color-scheme') === 'prefer-dark';
                interfaceS.set_string('color-scheme', isDark ? 'default' : 'prefer-dark');
            }, {variant: 'vertical', accent: 'blue'});
            dark.update = () => {
                const isDark = interfaceS.get_string('color-scheme') === 'prefer-dark';
                dark.set(isDark, isDark ? 'Oscuro' : 'Claro');
            };
            interfaceS.connect('changed::color-scheme', dark.update);
            featureTiles.push(dark);
        }
        if (notifS) {
            const dnd = this._tile('notifications-disabled-symbolic', 'No molestar',
                () => notifS.set_boolean('show-banners', !notifS.get_boolean('show-banners')),
                {variant: 'vertical', accent: 'purple'});
            dnd.update = () => {
                const on = !notifS.get_boolean('show-banners');
                dnd.set(on, on ? 'Activado' : 'Desactivado');
            };
            notifS.connect('changed::show-banners', dnd.update);
            featureTiles.push(dnd);
        }

        // ── Mosaicos anchos (2 × 2) ──
        if (colorS) {
            const night = this._tile('night-light-symbolic', 'Luz nocturna',
                () => colorS.set_boolean('night-light-enabled', !colorS.get_boolean('night-light-enabled')),
                {variant: 'wide', accent: 'orange'});
            night.update = () => {
                const on = colorS.get_boolean('night-light-enabled');
                night.set(on, on ? 'Activada' : 'Desactivada');
            };
            colorS.connect('changed::night-light-enabled', night.update);
            utilityTiles.push(night);
        }

        const displays = this._tile('video-display-symbolic', 'Pantallas', () => {
            this.menu.close();
            run('gnome-control-center display');
        });
        displays.update = () => displays.set(false, 'Configurar');
        utilityTiles.push(displays);

        const power = this._tile('power-profile-balanced-symbolic', 'Energía', () =>
            ctx.powerProfiles.cycle(), {accent: 'orange'});
        power.update = () => {
            power.btn.visible = ctx.powerProfiles.available;
            power.icon.icon_name = ctx.powerProfiles.iconName;
            power.set(ctx.powerProfiles.active !== 'balanced', ctx.powerProfiles.label);
        };
        this._offs.push(ctx.powerProfiles.onChange(power.update));
        utilityTiles.push(power);

        const screenshot = this._tile('camera-photo-symbolic', 'Captura', () => {
            this.menu.close();
            Main.screenshotUI.open();
        });
        screenshot.update = () => screenshot.set(false, 'Pantalla o área');
        utilityTiles.push(screenshot);

        // Reutiliza el estado real de la extensión Caffeine instalada.
        if (caffeineS) {
            const caffeine = this._tile('alarm-symbolic', 'Caffeine', () => {
                caffeineS.set_boolean('cli-toggle', !caffeineS.get_boolean('cli-toggle'));
            }, {variant: 'wide', accent: 'orange'});
            caffeine.update = () => {
                const on = caffeineS.get_boolean('cli-toggle');
                caffeine.set(on, on ? 'Pantalla activa' : 'Desactivado');
            };
            caffeineS.connect('changed::cli-toggle', caffeine.update);
            utilityTiles.push(caffeine);
        }

        // Resume y controla los tres permisos ofrecidos por Privacy Menu.
        if (privacyS && locationS) {
            const privacy = this._tile('lintel-privacy-symbolic', 'Privacidad', () => {
                const anyAllowed = locationS.get_boolean('enabled') ||
                    !privacyS.get_boolean('disable-camera') ||
                    !privacyS.get_boolean('disable-microphone');
                locationS.set_boolean('enabled', !anyAllowed);
                privacyS.set_boolean('disable-camera', anyAllowed);
                privacyS.set_boolean('disable-microphone', anyAllowed);
            }, {variant: 'wide', accent: 'purple'});
            privacy.update = () => {
                const allowed = Number(locationS.get_boolean('enabled')) +
                    Number(!privacyS.get_boolean('disable-camera')) +
                    Number(!privacyS.get_boolean('disable-microphone'));
                privacy.set(allowed === 0, allowed === 0 ? 'Protegida' : `${allowed} permitidos`);
            };
            locationS.connect('changed::enabled', privacy.update);
            privacyS.connect('changed::disable-camera', privacy.update);
            privacyS.connect('changed::disable-microphone', privacy.update);
            utilityTiles.push(privacy);
        }

        const batteryCare = this._tile('battery-level-80-symbolic', 'Cuidado batería', () =>
            ctx.batteryCare.toggle(), {variant: 'wide', accent: 'green'});
        batteryCare.update = () => {
            batteryCare.btn.visible = ctx.batteryCare.available;
            batteryCare.set(ctx.batteryCare.enabled, ctx.batteryCare.label);
        };
        this._offs.push(ctx.batteryCare.onChange(batteryCare.update));
        utilityTiles.push(batteryCare);

        const airplane = this._tile('airplane-mode-symbolic', 'Modo avión', () =>
            ctx.airplaneMode.toggle(), {variant: 'wide', accent: 'blue'});
        airplane.update = () => {
            airplane.btn.visible = ctx.airplaneMode.available;
            airplane.set(ctx.airplaneMode.enabled,
                ctx.airplaneMode.enabled ? 'Activado' : 'Desactivado');
        };
        this._offs.push(ctx.airplaneMode.onChange(airplane.update));
        utilityTiles.push(airplane);

        // ── Montaje ──
        const primary = new St.BoxLayout({style_class: 'lintel-cc-primary'});
        const connectivity = new St.BoxLayout({vertical: true, style_class: 'lintel-cc-group'});
        for (const tile of connectivityTiles)
            connectivity.add_child(tile.btn);
        primary.add_child(connectivity);

        const features = new St.BoxLayout({vertical: true, style_class: 'lintel-cc-features'});
        for (const tile of featureTiles) {
            tile.btn.y_expand = true;
            features.add_child(tile.btn);
        }
        primary.add_child(features);
        col.add_child(primary);

        for (let i = 0; i < utilityTiles.length; i += 2) {
            const row = new St.BoxLayout({style_class: 'lintel-cc-utility-row'});
            for (const tile of utilityTiles.slice(i, i + 2))
                row.add_child(tile.btn);
            col.add_child(row);
        }

        [...connectivityTiles, ...featureTiles, ...utilityTiles].forEach(tile => tile.update());

        // ── Pantalla ──
        this._brightRow = this._sliderCard('Brillo', 'display-brightness-symbolic',
            v => ctx.brightness.setLevel(v));
        col.add_child(this._brightRow.box);
        const syncBright = () => {
            this._brightRow.box.visible = ctx.brightness.available;
            this._brightRow.slider.setSilently(ctx.brightness.level);
        };
        this._offs.push(ctx.brightness.onChange(syncBright));
        syncBright();

        // ── Sonido ──
        this._soundRow = this._sliderCard('Sonido', 'lintel-sound-medium-symbolic',
            v => ctx.sound.setLevel(v));
        col.add_child(this._soundRow.box);
        const syncSound = () => {
            this._soundRow.box.visible = ctx.sound.ready;
            this._soundRow.icon.gicon = fileIcon(ctx.sound.iconFile);
            this._soundRow.slider.setSilently(ctx.sound.level);
        };
        this._offs.push(ctx.sound.onChange(syncSound));
        syncSound();

        // ── Micrófono ──
        this._micRow = this._sliderCard('Micrófono', 'audio-input-microphone-symbolic',
            v => ctx.sound.setMicLevel(v));
        col.add_child(this._micRow.box);
        const syncMic = () => {
            this._micRow.box.visible = ctx.sound.micReady;
            this._micRow.icon.icon_name = ctx.sound.micIconName;
            this._micRow.slider.setSilently(ctx.sound.micLevel);
        };
        this._offs.push(ctx.sound.onChange(syncMic));
        syncMic();

        const settings = new St.Button({label: 'Ajustes del Sistema…', style_class: 'lintel-cc-pill', can_focus: true,
            x_align: CENTER});
        settings.connect('clicked', () => {
            this.menu.close();
            run('gnome-control-center');
        });
        col.add_child(settings);

        this.connect('destroy', () => {
            this._offs.forEach(f => f());
            this._settings.forEach(s => s.run_dispose?.());
        });
    }

    // variant: 'row' (dentro de la tarjeta), 'vertical' (icono arriba) o 'wide' (icono a la izquierda).
    // accent: color del círculo cuando la función está activa.
    _tile(iconName, title, onClick, {variant = 'wide', accent = 'blue'} = {}) {
        const vertical = variant === 'vertical';
        const styleVariant = variant === 'row' ? 'lintel-cc-row' : vertical ? 'lintel-cc-vtile' : 'lintel-cc-wtile';
        const btn = new St.Button({style_class: `lintel-cc-tile ${styleVariant}`, can_focus: true});
        const boxWidth = TILE_BOX[variant];
        const shellSize = variant === 'row' ? 26 : 28;

        const box = new St.BoxLayout({
            vertical,
            style_class: vertical ? 'lintel-cc-tile-box lintel-cc-tile-vbox' : 'lintel-cc-tile-box',
            width: boxWidth,
            x_align: START,
            y_align: CENTER,
        });
        const shell = new St.Widget({
            style_class: `lintel-cc-tile-icon-shell lintel-accent-${accent}`,
            layout_manager: new Clutter.BinLayout(),
            x_align: vertical ? START : CENTER,
            y_align: vertical ? START : CENTER,
        });
        const tileIcon = new St.Icon({
            ...iconProps(iconName),
            style_class: 'lintel-cc-tile-icon',
            icon_size: 15,
            x_align: CENTER,
            y_align: CENTER,
        });
        shell.add_child(tileIcon);

        const labels = new St.BoxLayout({vertical: true, y_align: CENTER, x_align: START});
        labels.set_width(vertical ? boxWidth : boxWidth - shellSize - 8);
        const titleLabel = new St.Label({text: title, style_class: 'lintel-cc-tile-title'});
        const status = new St.Label({style_class: 'lintel-cc-tile-status'});
        labels.add_child(titleLabel);
        labels.add_child(status);

        box.add_child(shell);
        box.add_child(labels);
        btn.set_child(box);
        btn.connect('clicked', onClick);
        return {
            btn,
            icon: tileIcon,
            set(on, text) {
                if (on)
                    shell.add_style_pseudo_class('checked');
                else
                    shell.remove_style_pseudo_class('checked');
                status.text = text;
            },
        };
    }

    // Tarjeta con título y un deslizador grueso con el icono dentro, como macOS.
    _sliderCard(title, iconName, onChange) {
        const box = new St.BoxLayout({vertical: true, style_class: 'lintel-cc-slider'});
        box.add_child(new St.Label({text: title, style_class: 'lintel-cc-slider-title'}));
        const stack = new St.Widget({
            style_class: 'lintel-cc-slider-stack',
            layout_manager: new Clutter.BinLayout(),
            x_expand: true,
        });
        const slider = makeSlider(0, onChange, 'lintel-cc-track');
        const icon = new St.Icon({
            ...iconProps(iconName),
            style_class: 'lintel-cc-slider-icon',
            icon_size: 14,
            x_align: START,
            y_align: CENTER,
            reactive: false,
        });
        stack.add_child(slider);
        stack.add_child(icon);
        box.add_child(stack);
        return {box, icon, slider};
    }
});

// ── Fecha, hora y calendario ──────────────────────────────────────────────
const ClockButton = GObject.registerClass(
class ClockButton extends LintelButton {
    _init(ctx) {
        super._init('Fecha y hora', 1.0);
        this._ctx = ctx;
        this._text = new St.Label({y_align: CENTER, style_class: 'lintel-bar-label lintel-tnum'});
        this.add_child(this._text);
        this._tick();
        this._timer = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 1, () => {
            this._tick();
            return GLib.SOURCE_CONTINUE;
        });
        this.connect('destroy', () => GLib.source_remove(this._timer));

        const holder = new PopupMenu.PopupBaseMenuItem({activate: false, hover: false, can_focus: false});
        holder.add_style_class_name('lintel-cal-holder');
        this._cal = new St.BoxLayout({vertical: true, style_class: 'lintel-cal'});
        holder.add_child(this._cal);
        this.menu.addMenuItem(holder);
        addSep(this.menu);
        addItem(this.menu, {label: 'Abrir Calendario…'}, () => run('gnome-calendar'));
        addItem(this.menu, {label: 'Ajustes de Fecha y Hora…'}, () => run('gnome-control-center datetime'));
        this.beforeOpen(() => {
            const now = GLib.DateTime.new_now_local();
            this._y = now.get_year();
            this._m = now.get_month();
            this._draw();
        });
    }

    _tick() {
        const t = GLib.DateTime.new_now_local().format('%a %-d %b  %-I:%M %p');
        if (t !== this._text.text)
            this._text.text = t;
    }

    _shift(delta) {
        this._m += delta;
        if (this._m < 1) {
            this._m = 12;
            this._y--;
        } else if (this._m > 12) {
            this._m = 1;
            this._y++;
        }
        this._draw();
    }

    _calendarCell(text, styleClass) {
        const cell = new St.Widget({
            style_class: styleClass,
            layout_manager: new Clutter.BinLayout(),
        });
        if (text) {
            cell.add_child(new St.Label({
                text,
                x_align: CENTER,
                y_align: CENTER,
                style_class: 'lintel-cal-cell-label',
            }));
        }
        return cell;
    }

    _draw() {
        this._cal.destroy_all_children();
        const first = GLib.DateTime.new_local(this._y, this._m, 1, 0, 0, 0);
        const days = first.add_months(1).add_days(-1).get_day_of_month();
        const dow = first.get_day_of_week();           // lunes = 1 … domingo = 7
        const offset = AJUSTES.SEMANA_INICIA_LUNES ? dow - 1 : dow % 7;
        const now = GLib.DateTime.new_now_local();

        const head = new St.BoxLayout({style_class: 'lintel-cal-head'});
        head.add_child(new St.Label({text: cap(first.format('%B %Y')), x_expand: true, y_align: CENTER,
            style_class: 'lintel-cal-title'}));
        for (const [icon, d] of [['go-previous-symbolic', -1], ['go-next-symbolic', 1]]) {
            const b = new St.Button({child: new St.Icon({icon_name: icon, style_class: 'lintel-cal-nav-icon'}),
                style_class: 'lintel-cal-nav', can_focus: true});
            b.connect('clicked', () => this._shift(d));
            head.add_child(b);
        }
        this._cal.add_child(head);

        const weekdays = new St.BoxLayout();
        const base = AJUSTES.SEMANA_INICIA_LUNES ? 1 : 7;   // 1 ene 2024 fue lunes
        for (let i = 0; i < 7; i++) {
            const d = GLib.DateTime.new_local(2024, 1, base + i, 0, 0, 0);
            const weekend = d.get_day_of_week() >= 6;
            weekdays.add_child(this._calendarCell(d.format('%a').charAt(0).toUpperCase(),
                weekend ? 'lintel-cal-cell lintel-cal-weekday lintel-cal-weekend'
                    : 'lintel-cal-cell lintel-cal-weekday'));
        }
        this._cal.add_child(weekdays);

        let row = null;
        for (let i = 0; i < Math.ceil((offset + days) / 7) * 7; i++) {
            if (i % 7 === 0) {
                row = new St.BoxLayout();
                this._cal.add_child(row);
            }
            const n = i - offset + 1;
            if (n < 1 || n > days) {
                row.add_child(this._calendarCell('', 'lintel-cal-cell'));
                continue;
            }
            const isToday = n === now.get_day_of_month() && this._m === now.get_month() && this._y === now.get_year();
            const weekend = i % 7 >= (AJUSTES.SEMANA_INICIA_LUNES ? 5 : 6) || (!AJUSTES.SEMANA_INICIA_LUNES && i % 7 === 0);
            let cls = 'lintel-cal-cell lintel-cal-day';
            if (weekend)
                cls += ' lintel-cal-weekend';
            if (isToday)
                cls += ' lintel-cal-today';
            row.add_child(this._calendarCell(String(n), cls));
        }
    }
});

// ═════════════════════════════ Extensión ═════════════════════════════════
export default class LintelV2 extends Extension {
    enable() {
        this._ctx = new Context(this);
        const ctx = this._ctx;
        this._signals = [];
        this._native = [];
        this._dyn = [];
        this._appId = undefined;
        this._appTimer = 0;

        this._cfg = new Config();
        ctx.sound = new Sound();
        ctx.brightness = new Brightness();
        ctx.powerProfiles = new PowerProfiles();
        ctx.batteryCare = new BatteryCare();
        ctx.airplaneMode = new AirplaneMode();
        ctx.bluetooth = new Bluetooth();
        ctx.privacy = new Privacy(ctx);
        ctx.sound.load();

        this._hideNative();
        this._applyPanelStyle();

        const panel = Main.panel;
        this._apple = new AppleButton(ctx);
        this._name = new AppNameButton(ctx);
        panel.addToStatusArea('lintel-apple', this._apple, 0, 'left');
        panel.addToStatusArea('lintel-app', this._name, 1, 'left');

        // Derecha, de izquierda a derecha: privacidad, teclado, batería, Wi-Fi, Bluetooth,
        // sonido, buscar, controles y hora.
        ctx.wifi = new WifiButton(ctx);
        this._right = [];
        if (AJUSTES.INDICADORES_PRIVACIDAD)
            this._right.push(['lintel-privacy', new PrivacyButton(ctx)]);
        if (AJUSTES.INDICADOR_TECLADO)
            this._right.push(['lintel-keyboard', new KeyboardButton(ctx)]);
        this._right.push(
            ['lintel-battery', new BatteryButton()],
            ['lintel-wifi', ctx.wifi],
            ['lintel-bluetooth', new BluetoothButton(ctx)],
            ['lintel-sound', new SoundButton(ctx)],
            ['lintel-search', new SearchButton()],
            ['lintel-cc', new ControlCenterButton(ctx)],
            ['lintel-clock', new ClockButton(ctx)],
        );
        for (const [role, button] of this._right) {
            // Los iconos de estado van pegados, como en macOS; la hora lleva un poco más de aire.
            button.add_style_class_name(role === 'lintel-clock' ? 'lintel-right-text' : 'lintel-right');
            panel.addToStatusArea(role, button, panel._rightBox.get_n_children(), 'right');
        }

        const tracker = Shell.WindowTracker.get_default();
        this._tracker = tracker;
        this._signals.push([tracker, tracker.connect('notify::focus-app', () => this._queueApp())]);
        this._signals.push([global.display, global.display.connect('notify::focus-window', () => {
            const w = global.display.focus_window;
            if (w && [Meta.WindowType.NORMAL, Meta.WindowType.DIALOG].includes(w.get_window_type()))
                ctx.win = w;
        })]);
        this._queueApp(true);
        refreshTheme();
    }

    disable() {
        this._signals?.forEach(([o, id]) => o.disconnect(id));
        this._signals = null;
        this._ctx?.cancel(this._appTimer);
        this._dyn.forEach(b => b.destroy());
        this._dyn = [];
        this._right?.forEach(([, b]) => b.destroy());
        this._right = null;
        this._name?.destroy();
        this._apple?.destroy();
        this._name = this._apple = null;
        this._restorePanelStyle();
        this._native.forEach(([c, v]) => v ? c.show() : c.hide());
        this._native = [];
        this._ctx?.privacy?.destroy();
        this._ctx?.sound?.destroy();
        this._ctx?.brightness?.destroy();
        this._ctx?.powerProfiles?.destroy();
        this._ctx?.batteryCare?.destroy();
        this._ctx?.airplaneMode?.destroy();
        this._ctx?.bluetooth?.destroy();
        this._ctx?.destroy();
        this._ctx = null;
        this._cfg?.destroy();
        this._cfg = null;
        buttons.clear();
    }

    _hideNative() {
        const area = Main.panel.statusArea;
        for (const key of ['activities', 'quickSettings', 'dateMenu', 'keyboard']) {
            const c = area[key]?.container;
            if (!c)
                continue;
            this._native.push([c, c.visible]);
            c.hide();
            if (key === 'keyboard') {
                // El indicador nativo vuelve a mostrarse al cambiar la distribución.
                this._signals.push([c, c.connect('notify::visible', () => {
                    if (c.visible) c.hide();
                })]);
            }
        }
    }

    _applyPanelStyle() {
        this._ifaceSettings = settingsFor('org.gnome.desktop.interface');
        Main.panel.add_style_class_name('lintel-panel');
        if (this._ifaceSettings)
            this._styleId = this._ifaceSettings.connect('changed::color-scheme', () => this._applyTheme());
        this._cfgOff = this._cfg.onChange(() => this._applyTheme());
        this._applyTheme();
    }

    // Une color-scheme de GNOME con la configuración del usuario y repinta todo.
    _applyTheme() {
        const c = this._cfg.values;
        const dark = this._ifaceSettings?.get_string('color-scheme') === 'prefer-dark';
        let light = c.texto === 'claro';
        if (c.texto === 'auto')
            light = dark;
        Main.panel.remove_style_class_name(light ? 'lintel-text-dark' : 'lintel-text-light');
        Main.panel.add_style_class_name(light ? 'lintel-text-light' : 'lintel-text-dark');
        theme.textColor = c.colorTexto;
        theme.iconColor = c.colorIconos;
        theme.menuDark = c.temaMenus === 'oscuro' || (c.temaMenus === 'auto' && dark);
        theme.animMs = c.animacionMs;
        refreshTheme();
    }

    _restorePanelStyle() {
        if (this._styleId)
            this._ifaceSettings?.disconnect(this._styleId);
        this._styleId = 0;
        this._cfgOff?.();
        this._cfgOff = null;
        this._ifaceSettings = null;
        ['lintel-panel', 'lintel-text-light', 'lintel-text-dark']
            .forEach(c => Main.panel.remove_style_class_name(c));
    }

    // Evita parpadeos: GNOME deja focus-app en null un instante al hacer clic en el panel.
    _queueApp(now = false) {
        this._ctx.cancel(this._appTimer);
        this._appTimer = this._ctx.later(now ? 0 : 60, () => {
            this._appTimer = 0;
            this._applyApp();
        });
    }

    _applyApp() {
        const app = this._tracker.focus_app;
        if (!app && Main.panel.menuManager?.activeMenu && this._appId)
            return;
        const id = app?.get_id() ?? null;
        if (id === this._appId)
            return;
        this._appId = id;
        this._ctx.app = app;
        this._name.setApp(app);
        this._rebuildMenus(app);
    }

    _rebuildMenus(app) {
        this._dyn.forEach(b => b.destroy());
        this._dyn = [];
        const specs = MENUS[profileFor(app)];
        specs.forEach((spec, i) => {
            const button = new MenuBarButton(this._ctx, spec, app);
            Main.panel.addToStatusArea(`lintel-menu-${i}`, button, 2 + i, 'left');
            this._dyn.push(button);
        });
        refreshTheme();
    }
}
__LINTEL_EXTENSION_JS__

# ── ARCHIVO: stylesheet.css ───────────────────────────────────────────────
# Importante: GNOME Shell NO entiende @define-color ni variables. Todos los
# colores van escritos como valores directos para que ninguna regla se pierda.
write_file stylesheet.css <<'__LINTEL_STYLESHEET__'
/* ═══ Barra superior transparente, estilo macOS Tahoe ═══════════════════ */

#panel.lintel-panel,
#panel.lintel-panel.lock-screen,
#panel.lintel-panel.unlock-screen {
    background-color: transparent;
    background-gradient-direction: none;
    box-shadow: none;
    border: none;
    border-image: none;
    border-radius: 0;
    height: 26px;
    font-family: 'Adwaita Sans', Cantarell, sans-serif;
    font-size: 9.75pt;
    font-weight: 500;
}

#panel.lintel-panel .panel-corner {
    -panel-corner-radius: 0;
    -panel-corner-background-color: transparent;
    -panel-corner-border-color: transparent;
}

#panel .lintel-button {
    -natural-hpadding: 8px;
    -minimum-hpadding: 4px;
    margin: 2px 1px;
    padding: 0;
    border: 0 solid transparent;
    border-radius: 7px;
    background-color: transparent;
    box-shadow: none;
    font-weight: 500;
    transition-duration: 80ms;
}

/* Indicadores derechos: separación uniforme sin modificar los menús. */
#panel .lintel-button.lintel-right {
    -natural-hpadding: 6px;
    -minimum-hpadding: 4px;
    margin: 2px 1px;
}

#panel .lintel-button.lintel-right-text {
    -natural-hpadding: 6px;
    -minimum-hpadding: 4px;
    margin: 2px 0 2px 2px;
}

#panel .lintel-button.lintel-right .system-status-icon {
    margin: 0;
}

#panel .lintel-bar-bold {
    font-weight: 700;
}

.lintel-tnum {
    font-feature-settings: "tnum";
}

#panel .lintel-button .system-status-icon {
    icon-size: 15px;
    margin: 0 1px;
}

/* Logo de Apple: más grande que el resto de iconos */
#panel .lintel-button .lintel-apple-icon {
    icon-size: 19px;
    margin: 0 1px;
}

/* Batería: el SVG es apaisado (28 × 16), así que necesita más ancho. */
#panel .lintel-button .lintel-battery-icon {
    icon-size: 24px;
    margin: 0 1px;
}

.lintel-battery-indicator {
    spacing: 3px;
}

.lintel-kbd-label {
    font-size: 9pt;
    font-weight: 600;
}

/* Indicadores de privacidad: llevan su propio color, como los puntos de macOS. */
.lintel-privacy-box {
    spacing: 2px;
}

#panel .lintel-button .lintel-priv-icon {
    icon-size: 13px;
    margin: 0 1px;
}

#panel .lintel-button .lintel-priv-mic {
    color: #ff9f0a;
}

#panel .lintel-button .lintel-priv-camera {
    color: #30d158;
}

#panel .lintel-button .lintel-priv-screen {
    color: #bf5af2;
}

/* Texto claro (sobre fondos oscuros) */
#panel.lintel-text-light .lintel-button {
    color: #ffffff;
    text-shadow: none;
    icon-shadow: none;
}

#panel.lintel-text-light .lintel-button:hover,
#panel.lintel-text-light .lintel-button:focus {
    color: #ffffff;
    background-color: rgba(255, 255, 255, 0.22);
}

/* Texto oscuro (sobre fondos claros) */
#panel.lintel-text-dark .lintel-button {
    color: #111216;
    text-shadow: none;
    icon-shadow: none;
}

#panel.lintel-text-dark .lintel-button:hover,
#panel.lintel-text-dark .lintel-button:focus {
    color: #111216;
    background-color: rgba(0, 0, 0, 0.13);
}

/* Botón con su menú abierto: píldora azul, como macOS */
#panel.lintel-text-light .lintel-button:active,
#panel.lintel-text-light .lintel-button:checked,
#panel.lintel-text-dark .lintel-button:active,
#panel.lintel-text-dark .lintel-button:checked {
    color: #ffffff;
    text-shadow: none;
    icon-shadow: none;
    background-color: rgba(79, 135, 245, 0.92);
}

/* ═══ Menús desplegables de vidrio claro ═════════════════════════════════ */

.popup-menu-boxpointer.lintel-menu {
    -arrow-rise: 0px;
    -arrow-base: 0px;
    -arrow-border-width: 0;
    -arrow-border-radius: 0;
    -arrow-background-color: transparent;
    -arrow-border-color: transparent;
    box-shadow: none;
}

.lintel-menu-content.popup-menu-content {
    min-width: 236px;
    margin: 0;
    padding: 6px;
    color: #1b1d21;
    background-color: rgba(238, 243, 250, 0.90);
    background-gradient-direction: vertical;
    background-gradient-start: rgba(248, 250, 254, 0.92);
    background-gradient-end: rgba(226, 234, 246, 0.90);
    border: 1px solid rgba(255, 255, 255, 0.75);
    border-radius: 14px;
    box-shadow: none;
    font-family: 'Adwaita Sans', Cantarell, sans-serif;
    font-size: 9.75pt;
    font-weight: 400;
}

/* Wi-Fi y Bluetooth: más anchos para nombres de redes y dispositivos. */
.lintel-menu-content.lintel-menu-wide.popup-menu-content {
    min-width: 290px;
}

.lintel-menu-content .popup-menu-ornament {
    width: 0;
    min-width: 0;
    padding: 0;
    margin: 0;
}

/* Cada fila: [icono 16px] [texto] .......... [atajo] */
.lintel-menu-content .popup-menu-item {
    min-height: 24px;
    padding: 3px 10px;
    margin: 0;
    spacing: 8px;
    color: #1b1d21;
    background-color: transparent;
    border-radius: 8px;
    box-shadow: none;
    font-weight: 400;
    transition-duration: 60ms;
}

.lintel-menu-content .popup-menu-item:hover,
.lintel-menu-content .popup-menu-item:focus,
.lintel-menu-content .popup-menu-item:selected,
.lintel-menu-content .popup-menu-item:active {
    color: #ffffff;
    background-color: #4f87f5;
}

.lintel-menu-content .lintel-item-info,
.lintel-menu-content .lintel-item-info:hover,
.lintel-menu-content .lintel-item-info:focus {
    color: #1b1d21;
    background-color: transparent;
}

/* Cabecera con interruptor (Wi-Fi, Bluetooth): no se resalta en azul. */
.lintel-menu-content .lintel-toggle-item,
.lintel-menu-content .lintel-toggle-item:hover,
.lintel-menu-content .lintel-toggle-item:focus,
.lintel-menu-content .lintel-toggle-item:active {
    min-height: 28px;
    color: #1b1d21;
    background-color: transparent;
}

.lintel-menu-content .lintel-toggle-item:focus {
    background-color: rgba(27, 29, 33, 0.06);
}

/* Títulos de sección ("Mis dispositivos", "Otras redes"…) */
.lintel-menu-content .lintel-item-heading {
    min-height: 20px;
    padding-top: 6px;
    padding-bottom: 0;
}

.lintel-menu-content .lintel-item-heading .lintel-item-label {
    color: rgba(27, 29, 33, 0.50);
    font-size: 8.75pt;
    font-weight: 600;
}

.lintel-menu-content .popup-menu-item:insensitive {
    color: rgba(27, 29, 33, 0.38);
    background-color: transparent;
}

.lintel-item-label {
    color: inherit;
}

.lintel-item-bold {
    font-weight: 700;
}

.lintel-item-hint {
    padding-left: 24px;
    color: rgba(27, 29, 33, 0.45);
    font-size: 9.25pt;
}

.lintel-menu-content .popup-menu-item:hover .lintel-item-hint,
.lintel-menu-content .popup-menu-item:focus .lintel-item-hint {
    color: rgba(255, 255, 255, 0.82);
}

.lintel-menu-content .popup-menu-item:insensitive .lintel-item-hint {
    color: rgba(27, 29, 33, 0.26);
}

.lintel-item-icon-slot {
    width: 16px;
    height: 16px;
}

.lintel-menu-content .lintel-item-icon {
    icon-size: 15px;
    min-width: 16px;
    color: rgba(27, 29, 33, 0.78);
}

.lintel-menu-content .popup-menu-item:hover .lintel-item-icon,
.lintel-menu-content .popup-menu-item:focus .lintel-item-icon {
    color: #ffffff;
}

.lintel-menu-content .popup-menu-item:insensitive .lintel-item-icon {
    color: rgba(27, 29, 33, 0.30);
}

/* Iconos a la derecha de la fila (candado y señal Wi-Fi) */
.lintel-menu-content .lintel-item-trailing {
    icon-size: 14px;
    color: rgba(27, 29, 33, 0.70);
}

.lintel-menu-content .popup-menu-item:hover .lintel-item-trailing,
.lintel-menu-content .popup-menu-item:focus .lintel-item-trailing {
    color: #ffffff;
}

.lintel-menu-content .popup-menu-arrow {
    icon-size: 10px;
    color: rgba(27, 29, 33, 0.75);
}

.lintel-menu-content .popup-menu-item:hover .popup-menu-arrow,
.lintel-menu-content .popup-menu-item:focus .popup-menu-arrow {
    color: #ffffff;
}

.lintel-menu-content .popup-separator-menu-item {
    min-height: 0;
    height: 11px;
    padding: 0 10px;
    background-color: transparent;
}

.lintel-menu-content .popup-separator-menu-item .popup-separator-menu-item-separator {
    height: 1px;
    background-color: rgba(27, 29, 33, 0.12);
}

.lintel-menu-content .popup-sub-menu {
    margin: 0 0 3px 0;
    padding: 2px;
    background-color: rgba(27, 29, 33, 0.05);
    border: 0 solid transparent;
    border-radius: 8px;
    box-shadow: none;
}

.lintel-menu-content .toggle-switch {
    margin-left: 6px;
}

.lintel-menu-content .toggle-switch:checked {
    background-color: #34c759;
}

/* Deslizadores de los menús (Sonido) */
.lintel-slider-row {
    spacing: 8px;
}

.lintel-slider-button {
    padding: 3px;
    border-radius: 999px;
}

.lintel-slider-button:hover {
    background-color: rgba(0, 0, 0, 0.08);
}

.lintel-slider-icon {
    icon-size: 14px;
    color: rgba(27, 29, 33, 0.80);
}

.lintel-slider {
    height: 14px;
    min-width: 150px;
    color: #4f87f5;
    -barlevel-height: 5px;
    -barlevel-background-color: rgba(0, 0, 0, 0.14);
    -barlevel-active-background-color: #4f87f5;
    -barlevel-overdrive-color: #ff9f0a;
    -barlevel-overdrive-separator-width: 0;
    -slider-handle-radius: 7px;
}

/* ═══ Calendario ═════════════════════════════════════════════════════════ */

.lintel-menu-content .lintel-cal-holder,
.lintel-menu-content .lintel-cal-holder:hover,
.lintel-menu-content .lintel-cal-holder:focus,
.lintel-menu-content .lintel-cal-holder:active,
.lintel-menu-content .lintel-cal-holder:selected {
    color: #1b1d21;
    background-color: transparent;
}

.lintel-cal {
    spacing: 2px;
    padding: 4px 6px 2px 6px;
}

.lintel-cal-head {
    spacing: 2px;
    padding-bottom: 6px;
}

.lintel-cal-title {
    font-weight: 700;
}

.lintel-cal-nav {
    padding: 3px;
    border-radius: 999px;
}

.lintel-cal-nav:hover {
    background-color: rgba(0, 0, 0, 0.08);
}

.lintel-cal-nav-icon {
    icon-size: 12px;
    color: rgba(27, 29, 33, 0.80);
}

.lintel-cal-cell {
    width: 24px;
    height: 24px;
    margin: 0 2px;
    padding: 0;
    text-align: center;
    font-size: 9pt;
}

.lintel-cal-cell-label {
    padding: 0;
    margin: 0;
    text-align: center;
}

.lintel-cal-weekday {
    font-size: 8pt;
    font-weight: 700;
    color: rgba(27, 29, 33, 0.50);
}

.lintel-cal-day {
    font-weight: 500;
    border-radius: 999px;
}

.lintel-cal-weekend {
    color: rgba(27, 29, 33, 0.42);
}

.lintel-cal-today {
    color: #ffffff;
    font-weight: 700;
    background-color: #ff3b30;
}

/* ═══ Centro de control: rejilla fija de 280 px ══════════════════════════ */

.popup-menu-boxpointer.lintel-cc-menu {
    -arrow-rise: 0px;
    -arrow-base: 0px;
    -arrow-border-width: 0;
    -arrow-background-color: transparent;
    -arrow-border-color: transparent;
    box-shadow: none;
}

.lintel-cc-menu-content.popup-menu-content {
    min-width: 0;
    padding: 0;
    background-color: rgba(214, 226, 242, 0.88);
    background-gradient-direction: vertical;
    background-gradient-start: rgba(224, 234, 247, 0.90);
    background-gradient-end: rgba(192, 208, 230, 0.88);
    border: 1px solid rgba(255, 255, 255, 0.70);
    border-radius: 24px;
    box-shadow: none;
}

.lintel-cc-menu-content .lintel-cc-holder,
.lintel-cc-menu-content .lintel-cc-holder:hover,
.lintel-cc-menu-content .lintel-cc-holder:focus {
    padding: 0;
    background-color: transparent;
}

/* St suma padding y borde al width: 280 + 2×10 = 300 px exteriores. */
.lintel-cc-content {
    spacing: 8px;
    padding: 10px;
    width: 280px;
    color: #17212d;
    font-family: 'Adwaita Sans', Cantarell, sans-serif;
}

.lintel-cc-primary,
.lintel-cc-utility-row {
    spacing: 8px;
}

/* Tarjeta de conexiones (izquierda) */
.lintel-cc-group {
    width: 156px;
    min-height: 152px;
    padding: 6px;
    spacing: 2px;
    background-color: rgba(255, 255, 255, 0.52);
    border: 1px solid rgba(255, 255, 255, 0.78);
    border-radius: 20px;
    box-shadow: none;
}

/* Columna de mosaicos verticales (derecha) */
.lintel-cc-features {
    width: 102px;
    spacing: 8px;
}

/* Base de todos los mosaicos: tarjeta de cristal */
.lintel-cc-tile {
    color: #17212d;
    background-color: rgba(255, 255, 255, 0.52);
    border: 1px solid rgba(255, 255, 255, 0.78);
    border-radius: 20px;
    box-shadow: none;
    transition-duration: 120ms;
}

.lintel-cc-tile:hover {
    background-color: rgba(255, 255, 255, 0.72);
}

.lintel-cc-tile:focus {
    border-color: rgba(79, 135, 245, 0.85);
}

/* Filas dentro de la tarjeta de conexiones: sin fondo propio */
.lintel-cc-tile.lintel-cc-row {
    width: 142px;
    min-height: 32px;
    padding: 3px 6px;
    background-color: transparent;
    border: 1px solid transparent;
    border-radius: 14px;
    box-shadow: none;
}

.lintel-cc-tile.lintel-cc-row:hover {
    background-color: rgba(255, 255, 255, 0.50);
}

.lintel-cc-tile.lintel-cc-vtile {
    width: 84px;
    min-height: 72px;
    padding: 8px;
}

.lintel-cc-tile.lintel-cc-wtile {
    width: 118px;
    min-height: 50px;
    padding: 6px 8px;
}

.lintel-cc-tile-box {
    spacing: 8px;
}

.lintel-cc-tile-vbox {
    spacing: 5px;
}

/* Círculo del icono */
.lintel-cc-tile-icon-shell {
    width: 28px;
    height: 28px;
    color: #243040;
    background-color: rgba(70, 85, 110, 0.16);
    border-radius: 999px;
}

.lintel-cc-row .lintel-cc-tile-icon-shell {
    width: 26px;
    height: 26px;
}

.lintel-cc-tile-icon {
    icon-size: 15px;
    color: #243040;
}

/* Activo: el círculo se llena de color y el icono pasa a blanco */
.lintel-cc-tile-icon-shell:checked {
    background-color: #0a84ff;
}

.lintel-cc-tile-icon-shell:checked .lintel-cc-tile-icon {
    color: #ffffff;
}

.lintel-cc-tile-icon-shell.lintel-accent-orange:checked {
    background-color: #ff9f0a;
}

.lintel-cc-tile-icon-shell.lintel-accent-purple:checked {
    background-color: #5e5ce6;
}

.lintel-cc-tile-icon-shell.lintel-accent-green:checked {
    background-color: #30a46c;
}

.lintel-cc-tile-title {
    color: #17212d;
    font-size: 9pt;
    font-weight: 600;
    text-shadow: none;
}

.lintel-cc-tile-status {
    color: rgba(23, 33, 45, 0.62);
    font-size: 7.75pt;
    text-shadow: none;
}

/* Tarjetas con deslizador (Brillo, Sonido y Micrófono) */
.lintel-cc-slider {
    width: 254px;
    padding: 9px 12px 10px 12px;
    spacing: 6px;
    background-color: rgba(255, 255, 255, 0.52);
    border: 1px solid rgba(255, 255, 255, 0.78);
    border-radius: 20px;
    box-shadow: none;
}

.lintel-cc-slider-title {
    color: #17212d;
    font-size: 9pt;
    font-weight: 600;
    text-shadow: none;
}

.lintel-cc-slider-stack {
    height: 24px;
}

/* El icono va dentro de la barra, a la izquierda */
.lintel-cc-slider-icon {
    padding-left: 9px;
    icon-size: 14px;
    color: #2a3340;
}

.lintel-cc-track {
    height: 24px;
    color: #ffffff;
    -barlevel-height: 24px;
    -barlevel-background-color: rgba(60, 75, 100, 0.22);
    -barlevel-active-background-color: #ffffff;
    -barlevel-overdrive-color: #ffffff;
    -barlevel-border-width: 0;
    -barlevel-active-border-width: 0;
    -barlevel-overdrive-separator-width: 0;
    -slider-handle-radius: 0;
}

.lintel-cc-pill {
    padding: 5px 14px;
    color: rgba(23, 33, 45, 0.70);
    background-color: transparent;
    border: 1px solid transparent;
    border-radius: 999px;
    font-size: 8.75pt;
    text-shadow: none;
}

.lintel-cc-pill:hover,
.lintel-cc-pill:focus {
    color: #17212d;
    background-color: rgba(255, 255, 255, 0.50);
}

/* ═══ MODO OSCURO de los menús ═══════════════════════════════════════════
   La extensión añade la clase lintel-dark al menú (según color-scheme o la
   configuración). Cada regla lleva un prefijo extra para ganar a la versión clara. */

.lintel-dark .lintel-menu-content.popup-menu-content {
    color: #f2f4f7;
    background-color: rgba(38, 40, 46, 0.92);
    background-gradient-direction: vertical;
    background-gradient-start: rgba(50, 52, 59, 0.94);
    background-gradient-end: rgba(30, 32, 38, 0.92);
    border: 1px solid rgba(255, 255, 255, 0.14);
}

.lintel-dark .lintel-menu-content .popup-menu-item {
    color: #f2f4f7;
}

.lintel-dark .lintel-menu-content .popup-menu-item:hover,
.lintel-dark .lintel-menu-content .popup-menu-item:focus,
.lintel-dark .lintel-menu-content .popup-menu-item:selected,
.lintel-dark .lintel-menu-content .popup-menu-item:active {
    color: #ffffff;
    background-color: #3b82f6;
}

.lintel-dark .lintel-menu-content .lintel-item-info,
.lintel-dark .lintel-menu-content .lintel-item-info:hover,
.lintel-dark .lintel-menu-content .lintel-item-info:focus {
    color: #f2f4f7;
    background-color: transparent;
}

.lintel-dark .lintel-menu-content .lintel-toggle-item,
.lintel-dark .lintel-menu-content .lintel-toggle-item:hover,
.lintel-dark .lintel-menu-content .lintel-toggle-item:focus,
.lintel-dark .lintel-menu-content .lintel-toggle-item:active {
    color: #f2f4f7;
    background-color: transparent;
}

.lintel-dark .lintel-menu-content .lintel-toggle-item:focus {
    background-color: rgba(255, 255, 255, 0.08);
}

.lintel-dark .lintel-menu-content .lintel-item-heading .lintel-item-label {
    color: rgba(242, 244, 247, 0.52);
}

.lintel-dark .lintel-menu-content .popup-menu-item:insensitive {
    color: rgba(242, 244, 247, 0.36);
    background-color: transparent;
}

.lintel-dark .lintel-item-hint {
    color: rgba(242, 244, 247, 0.50);
}

.lintel-dark .lintel-menu-content .popup-menu-item:hover .lintel-item-hint,
.lintel-dark .lintel-menu-content .popup-menu-item:focus .lintel-item-hint {
    color: rgba(255, 255, 255, 0.82);
}

.lintel-dark .lintel-menu-content .popup-menu-item:insensitive .lintel-item-hint {
    color: rgba(242, 244, 247, 0.26);
}

.lintel-dark .lintel-menu-content .lintel-item-icon {
    color: rgba(242, 244, 247, 0.82);
}

.lintel-dark .lintel-menu-content .popup-menu-item:hover .lintel-item-icon,
.lintel-dark .lintel-menu-content .popup-menu-item:focus .lintel-item-icon {
    color: #ffffff;
}

.lintel-dark .lintel-menu-content .popup-menu-item:insensitive .lintel-item-icon {
    color: rgba(242, 244, 247, 0.30);
}

.lintel-dark .lintel-menu-content .lintel-item-trailing {
    color: rgba(242, 244, 247, 0.72);
}

.lintel-dark .lintel-menu-content .popup-menu-item:hover .lintel-item-trailing,
.lintel-dark .lintel-menu-content .popup-menu-item:focus .lintel-item-trailing {
    color: #ffffff;
}

.lintel-dark .lintel-menu-content .popup-menu-arrow {
    color: rgba(242, 244, 247, 0.78);
}

.lintel-dark .lintel-menu-content .popup-menu-item:hover .popup-menu-arrow,
.lintel-dark .lintel-menu-content .popup-menu-item:focus .popup-menu-arrow {
    color: #ffffff;
}

.lintel-dark .lintel-menu-content .popup-separator-menu-item .popup-separator-menu-item-separator {
    background-color: rgba(255, 255, 255, 0.14);
}

.lintel-dark .lintel-menu-content .popup-sub-menu {
    background-color: rgba(255, 255, 255, 0.06);
}

.lintel-dark .lintel-slider-button:hover {
    background-color: rgba(255, 255, 255, 0.12);
}

.lintel-dark .lintel-slider-icon {
    color: rgba(242, 244, 247, 0.85);
}

.lintel-dark .lintel-slider {
    color: #3b82f6;
    -barlevel-background-color: rgba(255, 255, 255, 0.20);
    -barlevel-active-background-color: #3b82f6;
}

/* Calendario */
.lintel-dark .lintel-menu-content .lintel-cal-holder,
.lintel-dark .lintel-menu-content .lintel-cal-holder:hover,
.lintel-dark .lintel-menu-content .lintel-cal-holder:focus,
.lintel-dark .lintel-menu-content .lintel-cal-holder:active,
.lintel-dark .lintel-menu-content .lintel-cal-holder:selected {
    color: #f2f4f7;
    background-color: transparent;
}

.lintel-dark .lintel-cal-nav:hover {
    background-color: rgba(255, 255, 255, 0.12);
}

.lintel-dark .lintel-cal-nav-icon {
    color: rgba(242, 244, 247, 0.85);
}

.lintel-dark .lintel-cal-weekday {
    color: rgba(242, 244, 247, 0.52);
}

.lintel-dark .lintel-cal-weekend {
    color: rgba(242, 244, 247, 0.44);
}

.lintel-dark .lintel-cal-today {
    color: #ffffff;
}

/* Centro de control */
.lintel-dark .lintel-cc-menu-content.popup-menu-content {
    background-color: rgba(30, 33, 40, 0.92);
    background-gradient-direction: vertical;
    background-gradient-start: rgba(40, 44, 52, 0.94);
    background-gradient-end: rgba(24, 27, 33, 0.92);
    border: 1px solid rgba(255, 255, 255, 0.12);
}

.lintel-dark .lintel-cc-content {
    color: #f2f4f7;
}

.lintel-dark .lintel-cc-group,
.lintel-dark .lintel-cc-slider {
    background-color: rgba(255, 255, 255, 0.09);
    border: 1px solid rgba(255, 255, 255, 0.10);
}

.lintel-dark .lintel-cc-tile {
    color: #f2f4f7;
    background-color: rgba(255, 255, 255, 0.09);
    border: 1px solid rgba(255, 255, 255, 0.10);
}

.lintel-dark .lintel-cc-tile:hover {
    background-color: rgba(255, 255, 255, 0.16);
}

.lintel-dark .lintel-cc-tile:focus {
    border-color: rgba(59, 130, 246, 0.90);
}

.lintel-dark .lintel-cc-tile.lintel-cc-row {
    background-color: transparent;
    border: 1px solid transparent;
}

.lintel-dark .lintel-cc-tile.lintel-cc-row:hover {
    background-color: rgba(255, 255, 255, 0.12);
}

.lintel-dark .lintel-cc-tile-icon-shell {
    color: #f2f4f7;
    background-color: rgba(255, 255, 255, 0.16);
}

.lintel-dark .lintel-cc-tile-icon {
    color: #f2f4f7;
}

.lintel-dark .lintel-cc-tile-icon-shell:checked {
    background-color: #0a84ff;
}

.lintel-dark .lintel-cc-tile-icon-shell:checked .lintel-cc-tile-icon {
    color: #ffffff;
}

.lintel-dark .lintel-cc-tile-icon-shell.lintel-accent-orange:checked {
    background-color: #ff9f0a;
}

.lintel-dark .lintel-cc-tile-icon-shell.lintel-accent-purple:checked {
    background-color: #5e5ce6;
}

.lintel-dark .lintel-cc-tile-icon-shell.lintel-accent-green:checked {
    background-color: #30a46c;
}

.lintel-dark .lintel-cc-tile-title,
.lintel-dark .lintel-cc-slider-title {
    color: #f2f4f7;
}

.lintel-dark .lintel-cc-tile-status {
    color: rgba(242, 244, 247, 0.62);
}

.lintel-dark .lintel-cc-slider-icon {
    color: #4b5563;
}

.lintel-dark .lintel-cc-track {
    color: #e5e7eb;
    -barlevel-background-color: rgba(255, 255, 255, 0.18);
    -barlevel-active-background-color: #e5e7eb;
    -barlevel-overdrive-color: #e5e7eb;
}

.lintel-dark .lintel-cc-pill {
    color: rgba(242, 244, 247, 0.72);
}

.lintel-dark .lintel-cc-pill:hover,
.lintel-dark .lintel-cc-pill:focus {
    color: #ffffff;
    background-color: rgba(255, 255, 255, 0.12);
}

/* El contenedor no es una opción seleccionable: solo sus controles. */
.lintel-menu .lintel-cc-menu-content .popup-menu-item.lintel-cc-holder,
.lintel-menu .lintel-cc-menu-content .popup-menu-item.lintel-cc-holder:hover,
.lintel-menu .lintel-cc-menu-content .popup-menu-item.lintel-cc-holder:focus,
.lintel-menu .lintel-cc-menu-content .popup-menu-item.lintel-cc-holder:selected,
.lintel-menu .lintel-cc-menu-content .popup-menu-item.lintel-cc-holder:active {
    background-color: transparent;
    box-shadow: none;
}

.lintel-menu .lintel-cc-menu-content .lintel-cc-tile:hover,
.lintel-menu .lintel-cc-menu-content .lintel-cc-tile:focus,
.lintel-menu .lintel-cc-menu-content .lintel-cc-tile:active {
    background-color: #3584e4;
    border-color: #3584e4;
    color: #ffffff;
}
.lintel-menu .lintel-cc-menu-content .lintel-cc-tile:hover StLabel,
.lintel-menu .lintel-cc-menu-content .lintel-cc-tile:focus StLabel,
.lintel-menu .lintel-cc-menu-content .lintel-cc-tile:active StLabel {
    color: #ffffff;
}
__LINTEL_STYLESHEET__

# ── Validación antes de tocar la instalación activa ──────────────────────
node --check "${SOURCE_DIR}/extension.js"
python3 - "${SOURCE_DIR}/metadata.json" "${SOURCE_DIR}/stylesheet.css" \
    "${SOURCE_DIR}/extension.js" "${SOURCE_DIR}/icons" <<'__LINTEL_VALIDATE_JSON__'
import json
import os
import re
import sys
import xml.etree.ElementTree as ET

path, css_path, js_path, icons_dir = sys.argv[1:5]
with open(path, encoding='utf-8') as source:
    metadata = json.load(source)

expected = 'lintel-v2@local'
if metadata.get('uuid') != expected:
    raise SystemExit(f'UUID incorrecto: {metadata.get("uuid")!r}; se esperaba {expected!r}')

# GNOME Shell no soporta @define-color ni !important de forma fiable.
with open(css_path, encoding='utf-8') as source:
    css = source.read()
if '@define-color' in css or re.search(r'@lintel_', css) or '!important' in css:
    raise SystemExit('La hoja de estilos usa @define-color o !important: GNOME Shell los ignora.')

depth = 0
for character in css:
    if character == '{':
        depth += 1
    elif character == '}':
        depth -= 1
        if depth < 0:
            raise SystemExit('La hoja de estilos contiene un cierre de bloque sin apertura.')
if depth != 0:
    raise SystemExit(f'La hoja de estilos contiene {depth} bloque(s) sin cerrar.')

# Todo icono propio citado literalmente en extension.js debe existir y ser un SVG válido.
with open(js_path, encoding='utf-8') as source:
    js = source.read()
names = set(re.findall(r"'(lintel-[a-z0-9-]+-symbolic)'", js))
for name in sorted(names):
    file = os.path.join(icons_dir, name + '.svg')
    if not os.path.isfile(file):
        raise SystemExit(f'Falta el icono referenciado en extension.js: {name}.svg')
for name in os.listdir(icons_dir):
    ET.parse(os.path.join(icons_dir, name))

# Los nombres dinámicos (batería, Wi-Fi) se comprueban con sus rangos reales.
dynamic = [f'lintel-wifi-{n}-symbolic' for n in range(4)]
for pct in range(0, 101, 5):
    dynamic += [f'lintel-battery-{pct}-symbolic', f'lintel-battery-{pct}-charging-symbolic']
for name in dynamic:
    if not os.path.isfile(os.path.join(icons_dir, name + '.svg')):
        raise SystemExit(f'Falta el icono dinámico: {name}.svg')
__LINTEL_VALIDATE_JSON__

if [[ "${MODE}" == '--verificar' ]]; then
    printf 'macOS 27 Top Bar versión %s: contenido y sintaxis correctos.\n' "${VERSION}"
    exit 0
fi

mkdir -p -- "${PACKAGE_DIR}" "${BACKUP_ROOT}"
gnome-extensions pack --force --out-dir "${PACKAGE_DIR}" \
    --extra-source=icons "${SOURCE_DIR}"

if gnome-extensions list | grep -Fxq -- "${UUID}"; then
    gnome-extensions disable "${UUID}" || true
fi

if [[ -d "${DESTINATION}" ]]; then
    readonly BACKUP_DIR="${BACKUP_ROOT}/macos27-top-bar-v${VERSION}-antes-$(date +%Y%m%d-%H%M%S)"
    mkdir -p -- "${BACKUP_DIR}"
    cp -a -- "${DESTINATION}/." "${BACKUP_DIR}/"
    printf 'Respaldo creado: %s\n' "${BACKUP_DIR}"
fi

gnome-extensions install --force "${PACKAGE_DIR}/${UUID}.shell-extension.zip"

if gnome-extensions list | grep -Fxq -- "${OLD_UUID}"; then
    gnome-extensions disable "${OLD_UUID}" || true
fi

if gnome-extensions list | grep -Fxq -- "${UUID}"; then
    gnome-extensions enable "${UUID}"
else
    enabled="$(gsettings get org.gnome.shell enabled-extensions | python3 -c '
import ast
import sys

uuid = "lintel-v2@local"
items = ast.literal_eval(sys.stdin.read())
print(repr([item for item in items if item != uuid] + [uuid]))
')"
    disabled="$(gsettings get org.gnome.shell disabled-extensions | python3 -c '
import ast
import sys

uuid = "lintel-v2@local"
items = ast.literal_eval(sys.stdin.read())
print(repr([item for item in items if item != uuid]))
')"
    gsettings set org.gnome.shell enabled-extensions "${enabled}"
    gsettings set org.gnome.shell disabled-extensions "${disabled}"
fi

printf 'macOS 27 Top Bar versión %s instalada y habilitada.\n' "${VERSION}"
printf 'Cierra sesión y vuelve a entrar para recargar GNOME Wayland.\n'
printf 'Colores y tema: bash %s --config mostrar   (se aplican en vivo)\n' "$0"
