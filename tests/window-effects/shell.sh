#!/usr/bin/env bash
set -euo pipefail
project=$(cd -- "$(dirname -- "$0")/../.." && pwd)
if [[ ${1:-} != --session ]]; then
    export DI_TEST_DIR=$(mktemp -d /tmp/aurea-window-effects-XXXXXXXX)
    export XDG_DATA_HOME="$DI_TEST_DIR/data" XDG_CONFIG_HOME="$DI_TEST_DIR/config" XDG_CACHE_HOME="$DI_TEST_DIR/cache" XDG_RUNTIME_DIR="$DI_TEST_DIR/runtime"
    export GSETTINGS_BACKEND=keyfile WAYLAND_DISPLAY=aurea-effects-test GTK_A11Y=none
    unset DISPLAY
    mkdir -m 0700 "$XDG_RUNTIME_DIR"
    mkdir -p "$XDG_DATA_HOME/gnome-shell/extensions"
    for pair in 'magic-lamp:aurea-magic-lamp@local' 'window-motion:aurea-window-motion@local' 'dynamic-island/tests/driver:island-test-driver@local'; do
        source=${pair%:*}; uuid=${pair##*:}
        cp -a "$project/extensions/$source" "$XDG_DATA_HOME/gnome-shell/extensions/$uuid"
        python3 - "$XDG_DATA_HOME/gnome-shell/extensions/$uuid/metadata.json" <<'PYMETA'
import json,sys
p=sys.argv[1]
m=json.load(open(p));m['version']=1
open(p,'w').write(json.dumps(m))
PYMETA
        if [[ "${AUREA_EFFECTS_BASELINE:-0}" == 1 && "$source" != */driver ]]; then
            while IFS= read -r file; do
                git -C "$project" show "${AUREA_EFFECTS_BASELINE_REF:-v0.17.0}:$file" > "$XDG_DATA_HOME/gnome-shell/extensions/$uuid/${file#extensions/$source/}"
            done < <(git -C "$project" ls-tree -r --name-only "${AUREA_EFFECTS_BASELINE_REF:-v0.17.0}" "extensions/$source" | rg '\.(js|xml)$')
        fi
        if [[ -d "$XDG_DATA_HOME/gnome-shell/extensions/$uuid/schemas" ]]; then
            glib-compile-schemas "$XDG_DATA_HOME/gnome-shell/extensions/$uuid/schemas"
        fi
    done
    echo "Sesión aislada: $DI_TEST_DIR"
    exec dbus-run-session -- bash "$0" --session
fi
gsettings set org.gnome.shell enabled-extensions "['island-test-driver@local']"
gsettings set org.gnome.desktop.interface enable-hot-corners false
gsettings set org.gnome.desktop.interface enable-animations true
gnome-shell --headless --wayland --wayland-display "$WAYLAND_DISPLAY" --no-x11 --virtual-monitor 1920x1080 --debug-control > "$DI_TEST_DIR/shell.log" 2>&1 &
shell_pid=$!
fixture_pid=''
trap 'kill "$shell_pid" ${fixture_pid:-} 2>/dev/null || true' EXIT
for attempt in {1..30}; do
    if gdbus call --session --dest org.gnome.Shell --object-path /org/gnome/Shell --method org.gnome.Shell.Eval '1+1' 2>/dev/null | rg -q '^\(true'; then break; fi
    sleep 1
done
sleep 2
gjs -m "$project/extensions/dock/tests/windows-fixture.js" > "$DI_TEST_DIR/windows.log" 2>&1 &
fixture_pid=$!
sleep 2
gdbus call --session --timeout 90 --dest org.gnome.Shell --object-path /org/gnome/Shell --method org.gnome.Shell.Eval "$(< "$project/tests/window-effects/runtime.js")"
for attempt in {1..65}; do
    [[ -f "$DI_TEST_DIR/result.txt" ]] && break
    sleep 1
done
cat "$DI_TEST_DIR/result.txt"
rg -q '^PASS:' "$DI_TEST_DIR/result.txt"
if rg 'JS ERROR|CRITICAL' "$DI_TEST_DIR/shell.log"; then exit 1; fi
