#!/usr/bin/env bash
set -euo pipefail
project_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
export DI_PROJECT_DIR="$project_dir"
export DI_TEST_DIR=$(mktemp -d /tmp/dock-magnification-XXXXXXXX)
export XDG_DATA_HOME="$DI_TEST_DIR/data" XDG_CONFIG_HOME="$DI_TEST_DIR/config" XDG_CACHE_HOME="$DI_TEST_DIR/cache" XDG_RUNTIME_DIR="$DI_TEST_DIR/runtime"
export GSETTINGS_BACKEND=keyfile WAYLAND_DISPLAY=dock-test GDK_BACKEND=wayland GTK_A11Y=none
unset DISPLAY
mkdir -m 0700 "$XDG_RUNTIME_DIR"
mkdir -p "$XDG_DATA_HOME/gnome-shell/extensions"
if gsettings list-schemas | rg -q '^org.freedesktop.Tracker3.Miner.Files$'; then
    gsettings set org.freedesktop.Tracker3.Miner.Files index-recursive-directories '[]'
    gsettings set org.freedesktop.Tracker3.Miner.Files index-single-directories '[]'
fi
cp -a "$project_dir" "$XDG_DATA_HOME/gnome-shell/extensions/macos27-dock@local"
cp -a "$project_dir/../dynamic-island/tests/driver" "$XDG_DATA_HOME/gnome-shell/extensions/island-test-driver@local"
export GSETTINGS_SCHEMA_DIR="$XDG_DATA_HOME/gnome-shell/extensions/macos27-dock@local/schemas"
glib-compile-schemas "$XDG_DATA_HOME/gnome-shell/extensions/macos27-dock@local/schemas"
export AUREA_DOCK_CLK_TCK=$(getconf CLK_TCK)
if [[ "${AUREA_DOCK_VIDEO:-0}" == 1 ]]; then
    video_extension="$XDG_DATA_HOME/gnome-shell/extensions/aurea-wallpaper@local"
    cp -a "$project_dir/../live-wallpaper" "$video_extension"
    glib-compile-schemas "$video_extension/schemas"
    mkdir -p "$XDG_DATA_HOME/gnome-wallpaper-engine/backgrounds"
    ffmpeg -v error -f lavfi -i testsrc2=size=640x360:rate=24 -t 3 -c:v libvpx-vp9 "$XDG_DATA_HOME/gnome-wallpaper-engine/backgrounds/aurea-test.webm"
    gsettings --schemadir "$video_extension/schemas" set org.gnome.shell.extensions.gnome-wallpaper-engine autostart true
    gsettings --schemadir "$video_extension/schemas" set org.gnome.shell.extensions.gnome-wallpaper-engine current-wallpaper 'aurea-test.webm'
fi
if [[ "${AUREA_DOCK_WINDOWS:-0}" == 1 ]]; then
    mkdir -p "$XDG_DATA_HOME/applications"
    cat > "$DI_TEST_DIR/fixture.svg" <<'SVG'
<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
<rect x="4" y="4" width="120" height="120" rx="24" fill="#3478f6"/>
<path d="M32 40h64v48H32z" fill="none" stroke="white" stroke-width="8"/>
</svg>
SVG
    cat > "$XDG_DATA_HOME/applications/org.aurea.DockFixture.desktop" <<DESKTOP
[Desktop Entry]
Type=Application
Name=Aurea Dock fixture
Exec=true
Icon=$DI_TEST_DIR/fixture.svg
DESKTOP
fi
printf 'Prueba aislada: %s\n' "$DI_TEST_DIR"
exec dbus-run-session -- bash "$project_dir/tests/smoke-session.sh"
