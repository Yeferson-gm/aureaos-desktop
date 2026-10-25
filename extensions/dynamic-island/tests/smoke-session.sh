#!/usr/bin/env bash
set -euo pipefail
gsettings set org.gnome.shell enabled-extensions "['dynamic-island-gnome50@local', 'island-test-driver@local']"
if [[ -n "${DI_SIDE_DOCK_DIR:-}" ]]; then
    gsettings set org.gnome.shell enabled-extensions "['dynamic-island-gnome50@local', 'side-dock-gnome50@local', 'island-test-driver@local']"
fi
gsettings set org.gnome.shell disable-user-extensions false
gnome-shell --headless --wayland --wayland-display island-smoke --no-x11 --virtual-monitor 1280x800 --debug-control >"$DI_TEST_DIR/shell.log" 2>&1 &
test_shell_pid=$!
trap 'kill "$test_shell_pid" 2>/dev/null || true' EXIT
for attempt in {1..20}; do
    if gdbus call --session --dest org.gnome.Shell --object-path /org/gnome/Shell \
        --method org.gnome.Shell.Eval '1 + 1' 2>/dev/null | rg -q '^\(true'; then
        break
    fi
    sleep 1
done
sleep 3
result=$(gdbus call --session --dest org.gnome.Shell --object-path /org/gnome/Shell \
    --method org.gnome.Shell.Eval "$(< "$DI_PROJECT_DIR/tests/smoke-eval.js")")
printf '%s\n' "$result"
for attempt in {1..45}; do
    [[ -f "$DI_TEST_DIR/result.txt" ]] && break
    sleep 1
done
[[ -f "$DI_TEST_DIR/result.txt" ]] || { printf 'La prueba no terminó.\n'; exit 1; }
cat "$DI_TEST_DIR/result.txt"
if rg -q '^FAIL:' "$DI_TEST_DIR/result.txt"; then exit 1; fi
export WAYLAND_DISPLAY=island-smoke
unset DISPLAY
gnome-extensions prefs dynamic-island-gnome50@local >"$DI_TEST_DIR/preferences.log" 2>&1
sleep 2
gdbus call --session --dest org.gnome.Shell --object-path /org/gnome/Shell \
    --method org.gnome.Shell.Eval "(async () => { const {default: Shell} = await import('gi://Shell'); const f = Gio.File.new_for_path(GLib.getenv('DI_TEST_DIR') + '/preferences.png'); const s = f.replace(null, false, Gio.FileCreateFlags.REPLACE_DESTINATION, null); await new Shell.Screenshot().screenshot(false, s); s.close(null); return global.get_window_actors().map(a => a.meta_window.title); })()"
sleep 2
cat "$DI_TEST_DIR/shell.log"
[[ "$result" == '(true,'* ]]
