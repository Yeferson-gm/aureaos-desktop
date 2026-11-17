#!/usr/bin/env bash
set -euo pipefail
project_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
test_dir=$(mktemp -d /tmp/dynamic-island-smoke-XXXXXX)
export XDG_DATA_HOME="$test_dir/data"
export XDG_CONFIG_HOME="$test_dir/config"
export XDG_CACHE_HOME="$test_dir/cache"
export XDG_RUNTIME_DIR="$test_dir/runtime"
mkdir -m 0700 "$XDG_RUNTIME_DIR"
export GSETTINGS_BACKEND=keyfile
export WAYLAND_DISPLAY=island-smoke
export GDK_BACKEND=wayland
export GTK_A11Y=none
unset DISPLAY
test_extension="$XDG_DATA_HOME/gnome-shell/extensions/dynamic-island-gnome50@local"
mkdir -p "$test_extension"
cp "$project_dir/"{extension.js,activities.js,motion.js,workspace.js,assistants.js,content-models.js,media-extras.js,studio.js,agent-bridge.js,aurea-task.py,audio-meter.js,audio-tools.py,shelf-bridge.js,shelf-window.py,file-services.js,ornaments.js,app-launcher.js,prefs.js,file-tools.py,hardware-metrics.py,metadata.json,stylesheet.css} "$test_extension/"
cp -a "$project_dir/schemas" "$test_extension/"
cp -a "$project_dir/tests/driver" "$XDG_DATA_HOME/gnome-shell/extensions/island-test-driver@local"
if [[ -n "${DI_SIDE_DOCK_DIR:-}" ]]; then
    cp -a "$DI_SIDE_DOCK_DIR" "$XDG_DATA_HOME/gnome-shell/extensions/side-dock-gnome50@local"
fi
glib-compile-schemas --strict "$test_extension/schemas"
export DI_TEST_DIR="$test_dir"
export DI_PROJECT_DIR="$project_dir"
printf 'Sesión de prueba: %s\n' "$test_dir"
dbus-run-session -- bash "$project_dir/tests/smoke-session.sh"
