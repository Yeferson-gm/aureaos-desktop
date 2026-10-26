#!/usr/bin/env bash
set -euo pipefail
project=$(cd -- "$(dirname -- "$0")/.." && pwd)
if [[ ${1:-} != --session ]]; then
  export DI_TEST_DIR=$(mktemp -d /tmp/widgets-shell-XXXXXXXX)
  export XDG_DATA_HOME="$DI_TEST_DIR/data" XDG_CONFIG_HOME="$DI_TEST_DIR/config" XDG_CACHE_HOME="$DI_TEST_DIR/cache" XDG_RUNTIME_DIR="$DI_TEST_DIR/runtime"
  export GSETTINGS_BACKEND=keyfile WAYLAND_DISPLAY=widgets-test GTK_A11Y=none
  unset DISPLAY
  mkdir -m 0700 "$XDG_RUNTIME_DIR"
  mkdir -p "$XDG_DATA_HOME/gnome-shell/extensions"
  cp -a "${WIDGET_TEST_SOURCE_DIR:-$project/source}" "$XDG_DATA_HOME/gnome-shell/extensions/lintel-widgets@local"
  cp -a "$project/../dynamic-island/tests/driver" "$XDG_DATA_HOME/gnome-shell/extensions/island-test-driver@local"
  cp -a "$project/../live-wallpaper" "$XDG_DATA_HOME/gnome-shell/extensions/aurea-wallpaper@local"
  glib-compile-schemas --strict "$XDG_DATA_HOME/gnome-shell/extensions/aurea-wallpaper@local/schemas"
  mkdir -p "$XDG_DATA_HOME/gnome-wallpaper-engine"
  mkdir -p "$XDG_DATA_HOME/gnome-wallpaper-engine/backgrounds"
  ffmpeg -v error -f lavfi -i testsrc2=size=640x360:rate=24 -t 3 -c:v libvpx-vp9 "$XDG_DATA_HOME/gnome-wallpaper-engine/backgrounds/aurea-test.webm"
  glib-compile-schemas --strict "$XDG_DATA_HOME/gnome-shell/extensions/lintel-widgets@local/schemas"
  echo "Prueba aislada: $DI_TEST_DIR"
  exec dbus-run-session -- bash "$0" --session
fi
schema="$XDG_DATA_HOME/gnome-shell/extensions/aurea-wallpaper@local/schemas"
gsettings --schemadir "$schema" set org.gnome.shell.extensions.gnome-wallpaper-engine autostart true
gsettings --schemadir "$schema" set org.gnome.shell.extensions.gnome-wallpaper-engine pause-on-fullscreen false
gsettings --schemadir "$schema" set org.gnome.shell.extensions.gnome-wallpaper-engine current-wallpaper 'aurea-test.webm'
gsettings set org.gnome.shell enabled-extensions "['island-test-driver@local', 'aurea-wallpaper@local', 'lintel-widgets@local']"
gnome-shell --headless --wayland --wayland-display widgets-test --no-x11 --virtual-monitor 1920x1080 --debug-control > "$DI_TEST_DIR/shell.log" 2>&1 &
shell_pid=$!
trap 'kill "$shell_pid" 2>/dev/null || true' EXIT
for attempt in {1..30}; do
  if gdbus call --session --dest org.gnome.Shell --object-path /org/gnome/Shell --method org.gnome.Shell.Eval '1+1' 2>/dev/null | rg -q '^\(true'; then break; fi
  sleep 1
done
sleep 4
result=$(gdbus call --session --dest org.gnome.Shell --object-path /org/gnome/Shell --method org.gnome.Shell.Eval "$(< "$project/tools/test-eval.js")")
echo "$result"
[[ "$result" == '(true,'* ]]

for attempt in {1..50}; do
  [[ -f "$DI_TEST_DIR/result.txt" ]] && break
  sleep 1
done
cat "$DI_TEST_DIR/result.txt"
rg -q '^PASS:' "$DI_TEST_DIR/result.txt"
if rg 'JS ERROR|CRITICAL' "$DI_TEST_DIR/shell.log"; then exit 1; fi
