#!/usr/bin/env bash
set -euo pipefail
export DI_TEST_DIR=$(mktemp -d /tmp/topbar-hover-XXXXXXXX)
export DI_PROJECT_DIR=/home/yefersongm/Escritorio/macos27-top-bar
export XDG_DATA_HOME="$DI_TEST_DIR/data" XDG_CONFIG_HOME="$DI_TEST_DIR/config" XDG_CACHE_HOME="$DI_TEST_DIR/cache" XDG_RUNTIME_DIR="$DI_TEST_DIR/runtime"
export GSETTINGS_BACKEND=keyfile WAYLAND_DISPLAY=dock-test GDK_BACKEND=wayland GTK_A11Y=none
unset DISPLAY
mkdir -m 0700 "$XDG_RUNTIME_DIR"
mkdir -p "$XDG_DATA_HOME/gnome-shell/extensions"
cp -a "$DI_PROJECT_DIR" "$XDG_DATA_HOME/gnome-shell/extensions/lintel-v2@local"
cp -a /home/yefersongm/Escritorio/macos27-dynamic-island/tests/driver "$XDG_DATA_HOME/gnome-shell/extensions/island-test-driver@local"
echo "$DI_TEST_DIR"
dbus-run-session -- bash "$DI_PROJECT_DIR/tests/hover-session.sh"
