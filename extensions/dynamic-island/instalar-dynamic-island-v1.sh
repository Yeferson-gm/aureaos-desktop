#!/usr/bin/env bash
set -euo pipefail

readonly UUID='dynamic-island-gnome50@local'
readonly SOURCE_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
readonly EXTENSION_DIR="${HOME}/.local/share/gnome-shell/extensions/${UUID}"
readonly BACKUP_ROOT="${HOME}/Respaldos-GNOME"

for file in extension.js activities.js prefs.js file-tools.py hardware-metrics.py stylesheet.css metadata.json schemas/org.gnome.shell.extensions.dynamic-island.gschema.xml; do
    if [[ ! -f "${SOURCE_DIR}/${file}" ]]; then
        printf 'Falta el archivo requerido: %s\n' "${SOURCE_DIR}/${file}" >&2
        exit 1
    fi
done

node --check "${SOURCE_DIR}/extension.js"
node --check "${SOURCE_DIR}/activities.js"
node --check "${SOURCE_DIR}/prefs.js"
glib-compile-schemas --strict "${SOURCE_DIR}/schemas"
GI_TYPELIB_PATH=/usr/lib64/gnome-shell:/usr/lib64/mutter-18 LD_LIBRARY_PATH=/usr/lib64/gnome-shell \
    gjs -c 'const {St,Gio}=imports.gi; new St.Theme().load_stylesheet(Gio.File.new_for_path(ARGV[0]));' "${SOURCE_DIR}/stylesheet.css"
node "${SOURCE_DIR}/tests/activities.mjs"
node "${SOURCE_DIR}/tests/native-banners.mjs"
python3 -B "${SOURCE_DIR}/tests/file-tools.py"
if [[ "${1:-}" == '--verificar' ]]; then
    printf 'JavaScript, esquema y CSS nativo verificados.\n'
    exit 0
fi
if command -v jq >/dev/null 2>&1; then
    jq empty "${SOURCE_DIR}/metadata.json"
fi

if [[ -d "${EXTENSION_DIR}" ]]; then
    readonly BACKUP_DIR="${BACKUP_ROOT}/dynamic-island-antes-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "${BACKUP_DIR}"
    cp -a "${EXTENSION_DIR}/." "${BACKUP_DIR}/"
    printf 'Respaldo creado: %s\n' "${BACKUP_DIR}"
fi

mkdir -p "${EXTENSION_DIR}"
install -m 0644 "${SOURCE_DIR}/extension.js" "${EXTENSION_DIR}/extension.js"
install -m 0644 "${SOURCE_DIR}/stylesheet.css" "${EXTENSION_DIR}/stylesheet.css"
install -m 0644 "${SOURCE_DIR}/metadata.json" "${EXTENSION_DIR}/metadata.json"
install -m 0644 "${SOURCE_DIR}/activities.js" "${EXTENSION_DIR}/activities.js"
install -m 0644 "${SOURCE_DIR}/prefs.js" "${EXTENSION_DIR}/prefs.js"
install -m 0644 "${SOURCE_DIR}/file-tools.py" "${EXTENSION_DIR}/file-tools.py"
install -m 0644 "${SOURCE_DIR}/hardware-metrics.py" "${EXTENSION_DIR}/hardware-metrics.py"
mkdir -p "${EXTENSION_DIR}/schemas"
install -m 0644 "${SOURCE_DIR}/schemas/org.gnome.shell.extensions.dynamic-island.gschema.xml" "${EXTENSION_DIR}/schemas/"
glib-compile-schemas --strict "${EXTENSION_DIR}/schemas"

if gnome-extensions enable "${UUID}" 2>/dev/null; then
    printf 'Isla dinámica habilitada.\n'
fi

printf 'Instalación terminada. Cierra sesión y vuelve a entrar para recargar GNOME Wayland.\n'

