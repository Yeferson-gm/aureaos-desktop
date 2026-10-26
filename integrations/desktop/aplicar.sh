#!/usr/bin/env bash
set -euo pipefail
wallpaper_schema="${XDG_DATA_HOME:-$HOME/.local/share}/gnome-shell/extensions/aurea-wallpaper@local/schemas"
dock_schema="${XDG_DATA_HOME:-$HOME/.local/share}/gnome-shell/extensions/macos27-dock@local/schemas"
gsettings --schemadir "$wallpaper_schema" set org.gnome.shell.extensions.gnome-wallpaper-engine pause-on-fullscreen false
gsettings --schemadir "$dock_schema" set org.gnome.shell.extensions.dash-to-dock click-action 'minimize'
gsettings --schemadir "$dock_schema" set org.gnome.shell.extensions.dash-to-dock dock-fixed false
gsettings --schemadir "$dock_schema" set org.gnome.shell.extensions.dash-to-dock intellihide true
gsettings --schemadir "$dock_schema" set org.gnome.shell.extensions.dash-to-dock intellihide-mode 'MAXIMIZED_WINDOWS'
gsettings --schemadir "$dock_schema" set org.gnome.shell.extensions.dash-to-dock autohide true
gsettings --schemadir "$dock_schema" set org.gnome.shell.extensions.dash-to-dock require-pressure-to-show false
printf 'Vídeo continuo y dock con minimizar/ocultamiento configurados.\n'
