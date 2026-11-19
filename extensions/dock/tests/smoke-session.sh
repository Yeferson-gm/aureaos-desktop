#!/usr/bin/env bash
set -euo pipefail
gsettings set org.gnome.desktop.interface enable-hot-corners false
gsettings set org.gnome.shell enabled-extensions "['macos27-dock@local', 'island-test-driver@local']"
if [[ "${AUREA_DOCK_VIDEO:-0}" == 1 ]]; then
    gsettings set org.gnome.shell enabled-extensions "['macos27-dock@local', 'island-test-driver@local', 'aurea-wallpaper@local']"
fi
gsettings set org.gnome.shell favorite-apps "['org.gnome.Nautilus.desktop', 'firefox.desktop', 'org.gnome.TextEditor.desktop']"
monitors=(--virtual-monitor "${AUREA_DOCK_RESOLUTION:-1280x800}")
if [[ "${AUREA_DOCK_DUAL:-0}" == 1 ]]; then monitors+=(--virtual-monitor 1920x1080); fi
if [[ -n "${AUREA_TEST_SCALE:-}" ]] && gsettings list-keys org.gnome.mutter | rg -q '^experimental-features$'; then
    gsettings set org.gnome.mutter experimental-features "['scale-monitor-framebuffer']"
fi
gnome-shell --headless --wayland --wayland-display dock-test --no-x11 "${monitors[@]}" --debug-control >"$DI_TEST_DIR/shell.log" 2>&1 &
test_pid=$!
trap 'kill "$test_pid" 2>/dev/null || true' EXIT
for attempt in {1..20}; do
    if gdbus call --session --dest org.gnome.Shell --object-path /org/gnome/Shell --method org.gnome.Shell.Eval '1+1' 2>/dev/null | rg -q '^\(true'; then break; fi
    sleep 1
done
sleep 3
if [[ "${AUREA_DOCK_WINDOWS:-0}" == 1 ]]; then
    gjs -m "$DI_PROJECT_DIR/tests/windows-fixture.js" >"$DI_TEST_DIR/windows.log" 2>&1 &
    fixture_pid=$!
    trap 'kill "$fixture_pid" "$test_pid" 2>/dev/null || true' EXIT
    sleep 2
fi
result=$(gdbus call --timeout 120 --session --dest org.gnome.Shell --object-path /org/gnome/Shell --method org.gnome.Shell.Eval "$(< "$DI_PROJECT_DIR/tests/smoke-eval.js")")
printf '%s\n' "$result"
[[ "$result" == '(true,'* ]]

for attempt in {1..90}; do
  [[ -f "$DI_TEST_DIR/result.txt" ]] && break
  sleep 1
done
cat "$DI_TEST_DIR/result.txt"
rg -q '^PASS:' "$DI_TEST_DIR/result.txt"
/usr/bin/python3 "$DI_PROJECT_DIR/tests/check-icon-sharpness.py" "$DI_TEST_DIR"
/usr/bin/python3 "$DI_PROJECT_DIR/tests/check-glass-corners.py" "$DI_TEST_DIR"
GI_TYPELIB_PATH=/usr/lib64/gnome-shell/girepository-1.0 gjs -m "$DI_PROJECT_DIR/tests/prefs-runtime.js" >"$DI_TEST_DIR/prefs.log" 2>&1
cat "$DI_TEST_DIR/prefs.log"
if rg 'JS ERROR|CRITICAL'  "$DI_TEST_DIR/shell.log" "$DI_TEST_DIR/prefs.log"; then exit 1; fi
