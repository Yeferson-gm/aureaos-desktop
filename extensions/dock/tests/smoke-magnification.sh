#!/usr/bin/env bash
set -euo pipefail
project_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
export DI_PROJECT_DIR="$project_dir"
export DI_TEST_DIR=$(mktemp -d /tmp/dock-magnification-XXXXXXXX)
export XDG_DATA_HOME="$DI_TEST_DIR/data" XDG_CONFIG_HOME="$DI_TEST_DIR/config" XDG_CACHE_HOME="$DI_TEST_DIR/cache" XDG_RUNTIME_DIR="$DI_TEST_DIR/runtime"
export GSETTINGS_BACKEND=keyfile WAYLAND_DISPLAY=dock-test GDK_BACKEND=wayland GTK_A11Y=none
unset DISPLAY
mkdir -m 0700 "$XDG_RUNTIME_DIR"
mkdir -p "$XDG_DATA_HOME/gnome-shell/extensions"
cp -a "$project_dir" "$XDG_DATA_HOME/gnome-shell/extensions/macos27-dock@local"
cp -a "$project_dir/../macos27-dynamic-island/tests/driver" "$XDG_DATA_HOME/gnome-shell/extensions/island-test-driver@local"
glib-compile-schemas "$XDG_DATA_HOME/gnome-shell/extensions/macos27-dock@local/schemas"
printf 'Prueba aislada: %s\n' "$DI_TEST_DIR"
dbus-run-session -- bash "$project_dir/tests/smoke-session.sh"
