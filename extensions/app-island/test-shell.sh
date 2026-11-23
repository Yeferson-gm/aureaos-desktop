#!/usr/bin/env bash
set -euo pipefail
project=$(cd -- "$(dirname -- "$0")" && pwd)
if [[ ${1:-} != --session ]]; then
  export SIDE_PROJECT="$project"
  export DI_TEST_DIR=$(mktemp -d /tmp/side-dock-test-XXXXXXXX)
  export XDG_DATA_HOME="$DI_TEST_DIR/data" XDG_CONFIG_HOME="$DI_TEST_DIR/config" XDG_CACHE_HOME="$DI_TEST_DIR/cache" XDG_RUNTIME_DIR="$DI_TEST_DIR/runtime"
  export GSETTINGS_BACKEND=keyfile WAYLAND_DISPLAY=side-test
  unset DISPLAY
  mkdir -m 0700 "$XDG_RUNTIME_DIR"
  mkdir -p "$XDG_DATA_HOME/gnome-shell/extensions"
  cp -aL "$project" "$XDG_DATA_HOME/gnome-shell/extensions/side-dock-gnome50@local"
  cp -a "$project/../dynamic-island/tests/driver" "$XDG_DATA_HOME/gnome-shell/extensions/island-test-driver@local"
  echo "$DI_TEST_DIR"
  exec dbus-run-session -- bash "$0" --session
fi
gsettings set org.gnome.shell welcome-dialog-last-shown-version '99'
gsettings set org.gnome.desktop.interface enable-hot-corners false
gsettings set org.gnome.shell enabled-extensions "['island-test-driver@local', 'side-dock-gnome50@local']"
monitors=(--virtual-monitor 1280x800)
if [[ ${SIDE_TEST_MONITORS:-1} == 2 ]]; then monitors+=(--virtual-monitor 1280x800); fi
gnome-shell --headless --wayland --wayland-display side-test --no-x11 "${monitors[@]}" --debug-control > "$DI_TEST_DIR/shell.log" 2>&1 &
pid=$!
trap 'kill "$pid" 2>/dev/null || true' EXIT
for attempt in {1..25}; do
  if gdbus call --session --dest org.gnome.Shell --object-path /org/gnome/Shell --method org.gnome.Shell.Eval '1+1' 2>/dev/null | rg -q '^\(true'; then break; fi
  sleep 1
done
sleep 3
gdbus call --session --dest org.gnome.Shell --object-path /org/gnome/Shell --method org.gnome.Shell.Eval "import('file://$SIDE_PROJECT/test-eval.js').then(m => m.run())"
for attempt in {1..45}; do
  [[ -f "$DI_TEST_DIR/result.txt" ]] && break
  sleep 1
done
cat "$DI_TEST_DIR/result.txt"
rg -q '^PASS:' "$DI_TEST_DIR/result.txt"
sleep 1
if rg 'JS ERROR|CRITICAL' "$DI_TEST_DIR/shell.log"; then exit 1; fi
