#!/usr/bin/env bash
set -euo pipefail
project=$(cd -- "$(dirname -- "$0")/.." && pwd)
if [[ ${1:-} != --session ]]; then
    export AUREA_PROJECT="$project"
    export DI_TEST_DIR=$(mktemp -d /tmp/aurea-stack-XXXXXXXX)
    export XDG_DATA_HOME="$DI_TEST_DIR/data" XDG_CONFIG_HOME="$DI_TEST_DIR/config" XDG_CACHE_HOME="$DI_TEST_DIR/cache" XDG_RUNTIME_DIR="$DI_TEST_DIR/runtime"
    export GSETTINGS_BACKEND=keyfile WAYLAND_DISPLAY=aurea-test GTK_A11Y=none
    unset DISPLAY
    mkdir -m 0700 "$XDG_RUNTIME_DIR"
    node "$project/tests/prepare-stack.mjs"
    echo "$DI_TEST_DIR"
    exec dbus-run-session -- bash "$0" --session
fi
enabled=$(node -e 'const r=require(process.env.AUREA_PROJECT+"/stack.json"); const fs=require("fs"); const a=Object.keys(r.extensions).map(n=>JSON.parse(fs.readFileSync(process.env.AUREA_PROJECT+"/extensions/"+n+(n==="widgets"?"/source":"")+"/metadata.json")).uuid); a.push("island-test-driver@local"); console.log(JSON.stringify(a));')
gsettings set org.gnome.shell enabled-extensions "$enabled"
gsettings set org.gnome.shell disable-user-extensions false
gnome-shell --headless --wayland --wayland-display aurea-test --no-x11 --virtual-monitor 1920x1080 --debug-control > "$DI_TEST_DIR/shell.log" 2>&1 &
shell_pid=$!
trap 'kill "$shell_pid" 2>/dev/null || true' EXIT
for attempt in {1..30}; do
    if gdbus call --session --dest org.gnome.Shell --object-path /org/gnome/Shell --method org.gnome.Shell.Eval '1+1' 2>/dev/null | rg -q '^\(true'; then break; fi
    sleep 1
done
sleep 5
gdbus call --session --dest org.gnome.Shell --object-path /org/gnome/Shell --method org.gnome.Shell.Eval "import('file://$project/tests/stack-eval.js').then(m=>m.run())"
for attempt in {1..25}; do
    [[ -f "$DI_TEST_DIR/result.txt" ]] && break
    sleep 1
done
cat "$DI_TEST_DIR/result.txt"
rg -q '^PASS:' "$DI_TEST_DIR/result.txt"
if rg 'JS ERROR|Extension.*Error' "$DI_TEST_DIR/shell.log"; then exit 1; fi
