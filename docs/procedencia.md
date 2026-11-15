# Procedencia y licencias

Aurea 27 es el nombre de esta integración y sus modificaciones. No reemplaza la
autoría de sus bases ni altera sus licencias. El propietario solicita sincronizar el repositorio con GitHub. Esa publicación no
resuelve por sí misma los permisos de las bases sin licencia declarada.

| Base | Contenido importado | Licencia/evidencia |
|---|---|---|
| WhiteSur GTK, vinceliuice | Tema instalado completo y personalización GTK4 | `theme/gtk/COPYING`, obtenido del repositorio original |
| WhiteSur icons, vinceliuice | Familia completa de iconos y carpetas personalizadas | `theme/icons/COPYING`, obtenido del repositorio original |
| WhiteSur GRUB, vinceliuice | Tema completo del arranque bajo el nombre Aurea27 | `integrations/boot-menu/theme/LICENSE` y procedencia en su README |
| WhiteSur cursors, vinceliuice | Cursores instalados | `theme/cursors/LICENSE`, obtenido del repositorio original |
| Dash to Dock | Dock completo con efectos y correcciones locales | `extensions/dock/COPYING` y avisos originales |
| GTK4 Desktop Icons NG, smedius y colaboradores | Extensión completa instalada y corrección de arrastre | Cabeceras GPL3 y `extensions/desktop-icons/COPYING` |
| Vertical App Grid, lublst | Centro de aplicaciones completo | `extensions/app-center/LICENSE`, del repositorio original |
| Gnome Live Wallpaper, achu94 | Extensión instalada con renderer GNOME50 y correcciones de vídeo | La instalación y la raíz consultada del repositorio no incluyen un texto LICENSE/COPYING; confirmar permiso antes de redistribuir |
| Barra, islas y widgets personalizados | Fuentes actuales, herramientas y pruebas | Conservar procedencia de los scripts aportados por el usuario; no se declara una licencia nueva sin decisión del propietario |

Fuentes de consulta:

- https://github.com/vinceliuice/WhiteSur-gtk-theme
- https://github.com/vinceliuice/WhiteSur-icon-theme
- https://github.com/vinceliuice/WhiteSur-cursors
- https://github.com/micheleg/dash-to-dock
- https://gitlab.com/smedius/desktop-icons-ng
- https://github.com/lublst/gnome-vertical-app-grid
- https://github.com/achu94/gnome-wallpaper-engine

La importación parte de las copias instaladas y los proyectos existentes, no
afirma contener el historial remoto ni los archivos de construcción originales
que no estaban presentes localmente. Los iconos y marcas de aplicaciones siguen
perteneciendo a sus respectivos titulares. Los nombres de licencias y avisos
legales no se sustituyen por la marca Aurea.

## Fondo estático del bloqueo

`extensions/lock-screen/assets/WhiteSur-dark.jpg`: WhiteSur-wallpapers de Vince,
MIT (2022), revisión `5c1d7ca20b8de0a7efe443792c19e49277262e02`.
`integrations/login-screen/WhiteSur-light.jpg` procede de `4k/WhiteSur-light.jpg`
en la misma revisión de [WhiteSur-wallpapers](https://github.com/vinceliuice/WhiteSur-wallpapers/tree/5c1d7ca20b8de0a7efe443792c19e49277262e02).
La licencia original acompaña a ambos recursos. Fuente y decisiones de tipografía:
[bloqueo y widgets](bloqueo-widgets-investigacion.md). No se distribuyen fuentes,
SF Symbols, capturas de Apple ni fotografías personales como recursos nuevos.

## Ampliación del pack

Diez módulos adicionales se importan desde repositorios upstream, con revisión
exacta en [el manifiesto](upstream-extensions.json) y `UPSTREAM.md` por módulo.
Las licencias originales acompañan a los fuentes; no se sustituyen por una licencia
global de Aurea. Las traducciones y recursos se compilan al construir.

- [Cuidado de batería](https://github.com/maniacx/Battery-Health-Charging): `extensions/battery-care/`.
- [Cafeína](https://github.com/eonpatapon/gnome-shell-extension-caffeine): `extensions/caffeine/`.
- [Efecto lámpara](https://github.com/hermes83/compiz-alike-magic-lamp-effect): `extensions/magic-lamp/`.
- [Movimiento de ventanas](https://github.com/hermes83/compiz-windows-effect): `extensions/window-motion/`.
- [Selector de ventanas](https://github.com/dsheeler/CoverflowAltTab): `extensions/window-switcher/`.
- [Cubo de escritorios](https://github.com/Schneegans/Desktop-Cube): `extensions/desktop-cube/`.
- [Privacidad](https://github.com/stuarthayhurst/privacy-menu-extension): `extensions/privacy/`.
- [Indicadores de aplicaciones](https://github.com/ubuntu/gnome-shell-extension-appindicator): `extensions/app-indicators/`.
- [Desinstalar aplicaciones](https://github.com/i-soumya18/gnome-shell-appgrid-uninstall): `extensions/app-uninstall/`.
- [Tema del sistema](https://gitlab.gnome.org/GNOME/gnome-shell-extensions): `extensions/shell-theme/`.
