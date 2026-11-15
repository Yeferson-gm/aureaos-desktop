#!/usr/bin/env bash
set -euo pipefail
project=$(cd -- "$(dirname -- "$0")/.." && pwd)
if [[ ${1:-} != --session ]]; then
    export DI_TEST_DIR=$(mktemp -d /tmp/aurea-pack-XXXXXXXX)
    export XDG_DATA_HOME="$DI_TEST_DIR/data" XDG_CONFIG_HOME="$DI_TEST_DIR/config" XDG_CACHE_HOME="$DI_TEST_DIR/cache" XDG_RUNTIME_DIR="$DI_TEST_DIR/runtime"
    export GSETTINGS_BACKEND=keyfile WAYLAND_DISPLAY=aurea-pack-test GTK_A11Y=none
    unset DISPLAY
    mkdir -m 0700 "$XDG_RUNTIME_DIR"
    node "$project/tests/prepare-extension-pack.mjs"
    echo "Sesión aislada: $DI_TEST_DIR"
    exec dbus-run-session -- bash "$0" --session
fi
gsettings set org.gnome.shell enabled-extensions "['island-test-driver@local']"
gsettings set org.gnome.desktop.interface enable-hot-corners false
gnome-shell --headless --wayland --wayland-display aurea-pack-test --no-x11 --virtual-monitor 1920x1080 --debug-control > "$DI_TEST_DIR/shell.log" 2>&1 &
shell_pid=$!
trap 'kill "$shell_pid" 2>/dev/null || true' EXIT
for attempt in {1..30}; do
    if gdbus call --session --dest org.gnome.Shell --object-path /org/gnome/Shell --method org.gnome.Shell.Eval '1+1' 2>/dev/null | rg -q '^\(true'; then break; fi
    sleep 1
done
sleep 3
gdbus call --session --timeout 90 --dest org.gnome.Shell --object-path /org/gnome/Shell --method org.gnome.Shell.Eval "$(python3 -c 'import json,sys; print(json.dumps(open(sys.argv[1]).read()))' "$project/tests/extension-pack-eval.js")"
for attempt in {1..60}; do
    [[ -f "$DI_TEST_DIR/result.txt" ]] && break
    sleep 1
done
cat "$DI_TEST_DIR/result.txt"
rg -q '^PASS:' "$DI_TEST_DIR/result.txt"
for metadata in "$XDG_DATA_HOME"/gnome-shell/extensions/aurea-*/metadata.json; do
    module_dir=$(dirname -- "$metadata")
    [[ -f "$module_dir/prefs.js" ]] || continue
    GI_TYPELIB_PATH=/usr/lib64/gnome-shell/girepository-1.0 LD_LIBRARY_PATH=/usr/lib64/gnome-shell timeout 20 gjs -m "$project/tests/extension-pack-prefs.js" "$(basename -- "$module_dir")" > "$DI_TEST_DIR/prefs-$(basename -- "$module_dir").log" 2>&1
    cat "$DI_TEST_DIR/prefs-$(basename -- "$module_dir").log"
done
gnome-extensions enable migration-before@local
sleep 1
for attempt in 1 2; do
    gjs "$project/tools/migrate-identities.js" '{"migration-before@local":"migration-after@local"}' --live
done
sleep 1
gjs -c "const s = new imports.gi.Gio.Settings({schema_id: 'org.gnome.shell'}); const ids = s.get_strv('enabled-extensions'); if (ids.includes('migration-before@local') || !ids.includes('migration-after@local') || !ids.includes('aurea-caffeine@local')) throw new Error('Migración incorrecta'); print('PASS: migración viva idempotente conserva otros módulos');"
if rg 'JS ERROR|CRITICAL'  "$DI_TEST_DIR/shell.log" "$DI_TEST_DIR"/prefs-*.log; then exit 1; fi
