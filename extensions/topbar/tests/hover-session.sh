#!/usr/bin/env bash
set -euo pipefail
gsettings set org.gnome.shell enabled-extensions "['lintel-v2@local', 'island-test-driver@local']"
gnome-shell --headless --wayland --wayland-display dock-test --no-x11 --virtual-monitor 1280x800 --debug-control >"$DI_TEST_DIR/shell.log" 2>&1 &
test_pid=$!
trap 'kill "$test_pid" 2>/dev/null || true' EXIT
for attempt in {1..20}; do
    if gdbus call --session --dest org.gnome.Shell --object-path /org/gnome/Shell --method org.gnome.Shell.Eval '1+1' 2>/dev/null | rg -q '^\(true'; then break; fi
    sleep 1
done
sleep 3
result=$(gdbus call --session --dest org.gnome.Shell --object-path /org/gnome/Shell --method org.gnome.Shell.Eval "$(< "$DI_PROJECT_DIR/tests/hover-eval.js")")
printf '%s\n' "$result"
[[ "$result" == '(true,'* ]]
