// Empaqueta el código legible; solo las traducciones binarias usan base64.
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
const root = path.dirname(new URL(import.meta.url).pathname);
const quote = s => "'" + s.replaceAll("'", "'\\''") + "'";
let script = `#!/usr/bin/env bash
# Dock macOS 27 v7 — instalador autocontenido, sin descargas ni sudo.
# Código completo editable en los bloques ARCHIVO de abajo.
# Uso: bash instalar-macos27-dock.sh
# Extraer sin instalar: bash instalar-macos27-dock.sh --extraer /ruta/nueva
# Instalar y aplicar preferencias incluidas: --restaurar-ajustes
set -euo pipefail
mode=install
case "\${1:-}" in
  --extraer) [[ $# == 2 ]] || exit 2; mode=extract; output=$2 ;;
  --restaurar-ajustes) mode=settings ;;
  '') ;;
  *) echo 'Opciones: --extraer RUTA_NUEVA | --restaurar-ajustes' >&2; exit 2 ;;
esac
if [[ $mode == extract ]]; then
  [[ ! -e "$output" ]] || { echo 'La ruta ya existe; no se sobrescribe.' >&2; exit 1; }
  mkdir -p -- "$output"
  stage=$(cd -- "$output" && pwd)
else
  [[ $EUID != 0 ]] || { echo 'Ejecuta como tu usuario, sin sudo.' >&2; exit 1; }
  command -v glib-compile-schemas >/dev/null
  command -v gnome-extensions >/dev/null
  stage=$(mktemp -d)
fi
`;
function pack(relative = '') {
    for (const entry of fs.readdirSync(path.join(root, relative), {withFileTypes: true}).sort((a,b) => a.name.localeCompare(b.name))) {
        if (['tests', '.git', 'build-installer.mjs', 'instalar-macos27-dock.sh', 'gschemas.compiled'].includes(entry.name)) continue;
        const rel = path.join(relative, entry.name);
        if (entry.isDirectory()) { pack(rel); continue; }
        if (!entry.isFile()) throw new Error(`No se empaquetan enlaces: ${rel}`);
        const data = fs.readFileSync(path.join(root, rel));
        const binary = data.includes(0);
        const text = binary ? data.toString('base64').match(/.{1,76}/g).join('\n') : data.toString('utf8');
        const delimiter = `DOCK_FILE_${rel.replace(/[^a-z0-9]/gi, '_')}_END`;
        if (text.includes(delimiter)) throw new Error('Colisión de delimitador');
        script += `\n# ARCHIVO: ${rel}\nmkdir -p -- "$stage/"${quote(path.dirname(rel))}\n${binary ? 'base64 -d' : 'cat'} > "$stage/"${quote(rel)} <<'${delimiter}'\n${text}${text.endsWith('\n') ? '' : '\n'}${delimiter}\n`;
    }
}
pack();
const settings = execFileSync('dconf', ['dump', '/org/gnome/shell/extensions/dash-to-dock/'], {encoding:'utf8'});
script += `
cat > "$stage/ajustes-incluidos.dconf" <<'DOCK_SETTINGS_END'
${settings}DOCK_SETTINGS_END
if [[ $mode == extract ]]; then
  echo "Código extraído en: $stage"
  exit 0
fi
glib-compile-schemas --strict "$stage/schemas"
target="\${XDG_DATA_HOME:-$HOME/.local/share}/gnome-shell/extensions/macos27-dock@local"
mkdir -p -- "$(dirname -- "$target")"
backup_root="\${XDG_STATE_HOME:-$HOME/.local/state}/macos27-dock/backups"
mkdir -p -- "$backup_root"
backup=$(mktemp -d "$backup_root/instalacion-XXXXXXXX")
dconf dump /org/gnome/shell/extensions/dash-to-dock/ > "$backup/ajustes.dconf"
if [[ -e "$target" ]]; then
  cp -a -- "$target" "$backup/extension"
else
  mode=settings
fi
cp -a -- "$stage/." "$target/"
if [[ $mode == settings ]]; then
  dconf load /org/gnome/shell/extensions/dash-to-dock/ < "$stage/ajustes-incluidos.dconf"
fi
gnome-extensions enable macos27-dock@local || echo 'GNOME reconocerá la extensión después de iniciar sesión de nuevo.'
echo "Dock instalado. Respaldo: $backup"
echo 'Cierra sesión y vuelve a entrar para cargar el código actualizado.'
`;
fs.writeFileSync(path.join(root, 'instalar-macos27-dock.sh'), script, {mode:0o755});
console.log('Instalador generado con fuentes completas y preferencias del dock.');
