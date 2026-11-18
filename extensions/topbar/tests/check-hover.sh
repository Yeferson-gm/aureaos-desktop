#!/usr/bin/env bash
set -euo pipefail
export DI_TEST_DIR=$(mktemp -d /tmp/topbar-hover-XXXXXXXX)
export DI_PROJECT_DIR=$(cd -- "$(dirname -- "$0")/.." && pwd)
export XDG_DATA_HOME="$DI_TEST_DIR/data" XDG_CONFIG_HOME="$DI_TEST_DIR/config" XDG_CACHE_HOME="$DI_TEST_DIR/cache" XDG_RUNTIME_DIR="$DI_TEST_DIR/runtime"
export GSETTINGS_BACKEND=keyfile WAYLAND_DISPLAY=dock-test GDK_BACKEND=wayland GTK_A11Y=none
export AUREA_TEST_CLK_TCK=$(getconf CLK_TCK)
unset DISPLAY
mkdir -m 0700 "$XDG_RUNTIME_DIR"
mkdir -p "$XDG_DATA_HOME/gnome-shell/extensions"
cp -aL "$DI_PROJECT_DIR" "$XDG_DATA_HOME/gnome-shell/extensions/lintel-v2@local"
cp -a "$DI_PROJECT_DIR/../dynamic-island/tests/driver" "$XDG_DATA_HOME/gnome-shell/extensions/island-test-driver@local"
if [[ "${AUREA_TEST_ISLAND:-0}" == 1 ]]; then
    cp -aL "$DI_PROJECT_DIR/../dynamic-island" "$XDG_DATA_HOME/gnome-shell/extensions/dynamic-island-gnome50@local"
    glib-compile-schemas "$XDG_DATA_HOME/gnome-shell/extensions/dynamic-island-gnome50@local/schemas"
fi
mkdir -p "$XDG_DATA_HOME/gnome-shell/extensions/caffeine@patapon.info/schemas"
cp "$DI_PROJECT_DIR/tests/fixtures/caffeine/"*.xml "$XDG_DATA_HOME/gnome-shell/extensions/caffeine@patapon.info/schemas/"
glib-compile-schemas "$XDG_DATA_HOME/gnome-shell/extensions/caffeine@patapon.info/schemas"
cat > "$XDG_DATA_HOME/gnome-shell/extensions/caffeine@patapon.info/metadata.json" <<'JSON'
{"uuid":"caffeine@patapon.info","name":"Aurea test: caffeine schema","description":"Isolated test fixture, never installed","shell-version":["50","51"]}
JSON
echo "$DI_TEST_DIR"
dbus-run-session -- bash "$DI_PROJECT_DIR/tests/hover-session.sh"
