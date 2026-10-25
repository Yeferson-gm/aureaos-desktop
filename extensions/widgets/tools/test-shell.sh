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
  cp -a "$project/source" "$XDG_DATA_HOME/gnome-shell/extensions/lintel-widgets@local"
  cp -a "$project/../macos27-dynamic-island/tests/driver" "$XDG_DATA_HOME/gnome-shell/extensions/island-test-driver@local"
  cp -a /home/yefersongm/.local/share/gnome-shell/extensions/gnome-wallpaper-engine@gjs.com "$XDG_DATA_HOME/gnome-shell/extensions/"
  mkdir -p "$XDG_DATA_HOME/gnome-wallpaper-engine"
  ln -s /home/yefersongm/.local/share/gnome-wallpaper-engine/backgrounds "$XDG_DATA_HOME/gnome-wallpaper-engine/backgrounds"
  glib-compile-schemas --strict "$XDG_DATA_HOME/gnome-shell/extensions/lintel-widgets@local/schemas"
  echo "Prueba aislada: $DI_TEST_DIR"
  exec dbus-run-session -- bash "$0" --session
fi
schema="$XDG_DATA_HOME/gnome-shell/extensions/gnome-wallpaper-engine@gjs.com/schemas"
gsettings --schemadir "$schema" set org.gnome.shell.extensions.gnome-wallpaper-engine autostart true
gsettings --schemadir "$schema" set org.gnome.shell.extensions.gnome-wallpaper-engine pause-on-fullscreen false
gsettings --schemadir "$schema" set org.gnome.shell.extensions.gnome-wallpaper-engine current-wallpaper '6BAED373-2BDD-4C4B-BF07-BA5BE719E1EF-1080p-gpu.webm'
gsettings set org.gnome.shell enabled-extensions "['island-test-driver@local', 'gnome-wallpaper-engine@gjs.com', 'lintel-widgets@local']"
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
if rg '\[Widgets\]|JS ERROR|CRITICAL' "$DI_TEST_DIR/shell.log"; then exit 1; fi
