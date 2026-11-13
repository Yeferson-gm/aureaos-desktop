#!/usr/bin/env bash
set -euo pipefail
project=$(cd -- "$(dirname -- "$0")" && pwd)
if [[ ${1:-} != --session ]]; then
    export DI_TEST_DIR=$(mktemp -d /tmp/aurea-gdm-XXXXXXXX)
    export XDG_DATA_HOME="$DI_TEST_DIR/data" XDG_CONFIG_HOME="$DI_TEST_DIR/config" XDG_CACHE_HOME="$DI_TEST_DIR/cache" XDG_RUNTIME_DIR="$DI_TEST_DIR/runtime"
    export GSETTINGS_BACKEND=keyfile WAYLAND_DISPLAY=gdm-test GTK_A11Y=none
    unset DISPLAY
    mkdir -m 0700 "$XDG_RUNTIME_DIR"
    mkdir -p "$XDG_DATA_HOME/gnome-shell/extensions"
    python3 "$project/manage.py" build --output "$DI_TEST_DIR/theme.gresource"
    cp -a "$project/../../extensions/dynamic-island/tests/driver" "$XDG_DATA_HOME/gnome-shell/extensions/island-test-driver@local"
    gsettings set org.freedesktop.Tracker3.Miner.Files index-recursive-directories '[]'
    gsettings set org.freedesktop.Tracker3.Miner.Files index-single-directories '[]'
    printf 'Prueba aislada: %s\n' "$DI_TEST_DIR"
    exec dbus-run-session -- bash "$0" --session
fi
gsettings set org.gnome.desktop.interface enable-hot-corners false
gsettings set org.gnome.shell enabled-extensions "['island-test-driver@local']"
gnome-shell --headless --wayland --wayland-display gdm-test --no-x11 --virtual-monitor "${AUREA_GDM_RESOLUTION:-1280x800}" --debug-control > "$DI_TEST_DIR/shell.log" 2>&1 &
shell_pid=$!
trap 'kill "$shell_pid" 2>/dev/null || true' EXIT
for attempt in {1..25}; do
    if gdbus call --session --dest org.gnome.Shell --object-path /org/gnome/Shell --method org.gnome.Shell.Eval '1+1' 2>/dev/null | rg -q '^\(true'; then break; fi
    sleep 1
done
sleep 3
gdbus call --timeout 120 --session --dest org.gnome.Shell --object-path /org/gnome/Shell --method org.gnome.Shell.Eval "$(< "$project/test-eval.js")"
for attempt in {1..60}; do
    [[ -s "$DI_TEST_DIR/result.txt" ]] && break
    sleep 1
done
cat "$DI_TEST_DIR/result.txt"
rg -q '^PASS:' "$DI_TEST_DIR/result.txt"
if rg 'JS ERROR|CRITICAL' "$DI_TEST_DIR/shell.log"; then exit 1; fi
