# Aurea 27

Stack de escritorio para Fedora GNOME: tema completo, barra superior, dock,
islas, widgets, iconos del escritorio y fondo animado dentro y fuera del centro
de aplicaciones. Es una personalización independiente, no un producto de Apple.

## Estructura

```text
aurea-27/
├── theme/
│   ├── gtk/                 GTK 2/3/4, Shell y decoraciones
│   ├── gtk-overrides/       Personalización GTK4 activa
│   ├── icons/               Tema de iconos completo, incluidas carpetas cyan
│   ├── cursors/             Cursores
│   └── tools/              Verificación de recursos
├── extensions/
│   ├── topbar/
│   ├── dock/
│   ├── dynamic-island/
│   ├── app-island/
│   ├── widgets/
│   ├── live-wallpaper/
│   ├── desktop-icons/
│   └── app-center/
├── integrations/            Pruebas del escritorio y ajustes auxiliares
├── presets/                 Preferencias visuales sin datos personales
├── tools/                   Versión, construcción, instalación y validación
├── tests/                   Pruebas del repositorio
├── docs/                    Arquitectura, procedencia y notas técnicas
└── tasks/                   Plan y seguimiento de la consolidación
```

## Antes de empezar

Ejecutar los comandos desde esta carpeta, en una terminal de tu sesión GNOME,
como tu usuario habitual. **No ejecutar el instalador con `sudo`.**

```bash
cd ~/Escritorio/aurea-27
./aurea.sh help
gnome-shell --version
gnome-extensions list --enabled
gsettings get org.gnome.shell disable-user-extensions
```

La integración completa se probó en Fedora 44, GNOME 50 y Wayland. Las versiones
que declara cada extensión por separado no garantizan compatibilidad de todo el
stack con otra versión de GNOME. No desactivar la validación de compatibilidad.

Herramientas necesarias: Node.js, Git, GJS, GLib (`gsettings`, `gio`,
`glib-compile-schemas`), `gtk-update-icon-cache` y `gnome-extensions`.
El vídeo necesita `mpv`, `ffmpeg` y sus codecs. Las pruebas usan también Python 3,
`rg` y `dbus-run-session`. Comprobar disponibilidad sin instalar ni cambiar nada:

```bash
for cmd in node git gjs gsettings gio glib-compile-schemas gtk-update-icon-cache gnome-extensions mpv ffmpeg python3 rg dbus-run-session; do
    command -v "$cmd" || printf 'Falta: %s\n' "$cmd"
done
```

KDE Connect es opcional para dispositivos y Buscar; MPRIS requiere un reproductor
compatible abierto. Batería/carga depende de UPower y del hardware. El control de
cuidado de batería, Cafeína y privacidad aprovecha sus extensiones externas si
están instaladas. No desinstalarlas para activar Aurea. La conexión de red es
necesaria para clima, noticias y podcasts. Los controles ausentes no se resuelven
activando servicios al azar: revisar primero su dependencia concreta.

## Instalar un paquete existente

`v0.0.1` es la base inicial y ya está etiquetada. **No volver a crear esa etiqueta.**
El paquete existente se puede instalar con las herramientas actuales aunque el
repositorio tenga commits posteriores. Un paquete no incluye cambios hechos
posteriormente en los fuentes de las extensiones.

```bash
./aurea.sh install dist/aurea-27-0.0.1
./aurea.sh install dist/aurea-27-0.0.1 --apply
./aurea.sh install dist/aurea-27-0.0.1 --check
```

El primer comando solo muestra destinos. `--apply` reemplaza archivos y migra los
tres UUID antiguos de tienda, conservando su estado activado/desactivado y sus
preferencias. `--check` compara archivos instalados; no prueba su comportamiento
ni que GNOME ya haya cargado la versión nueva. No combinar las dos opciones.

La instalación conserva `settings.ini` de GTK4 y los datos personales. Sustituye
los estilos GTK4 y envía las copias anteriores a la papelera. Cambia la selección
de tema solo cuando todavía apunta a WhiteSur. No aplica los presets por defecto.
La sustitución tiene recuperación por componente; **no es una transacción global**:
si falla a mitad, leer el error, corregir la causa y repetir antes de activar.

Guardar el trabajo y **cerrar sesión desde el menú del sistema, luego entrar**.
No usar `Alt+F2 → r`, `gnome-shell --replace` ni matar el compositor en Wayland.
GNOME puede no descubrir UUID nuevos hasta ese inicio de sesión.

## Activar, desactivar y configurar

Estos son los identificadores que se usan con `gnome-extensions`:

| Componente | UUID |
|---|---|
| Barra superior | `lintel-v2@local` |
| Dock | `macos27-dock@local` |
| Isla dinámica | `dynamic-island-gnome50@local` |
| Isla lateral | `side-dock-gnome50@local` |
| Widgets | `lintel-widgets@local` |
| Fondo animado | `aurea-wallpaper@local` |
| Iconos de escritorio | `aurea-desktop-icons@local` |
| Centro de aplicaciones | `aurea-app-center@local` |

Para un componente concreto, por ejemplo los widgets:

```bash
gnome-extensions info lintel-widgets@local
gnome-extensions enable lintel-widgets@local
gnome-extensions disable lintel-widgets@local
```

Ejecutar **solo la acción deseada**: el último comando desactiva lo que activó el
anterior. Desactivar no borra notas, preferencias ni datos. Para las extensiones
con ventana de preferencias, por ejemplo el dock o el fondo:

```bash
gnome-extensions prefs macos27-dock@local
gnome-extensions prefs aurea-wallpaper@local
```

Widgets también tiene Ajustes desde su menú y edición con `Super+Alt+E`.
En el fondo animado, seleccionar un vídeo existente y activar su inicio automático.
El paquete no lleva tus vídeos. El estilo del tema no inicia el reproductor.

### Evitar componentes duplicados

Antes de activar todo, revisar `gnome-extensions list --enabled`. No ejecutar a
la vez otro dock, otro gestor de iconos de escritorio o los forks antiguos con
sus equivalentes Aurea. Este bloque desactiva únicamente alternativas conocidas
**si están instaladas**; usarlo cuando se elige Aurea como reemplazo:

```bash
installed=$(gnome-extensions list) || exit 1
for uuid in dash-to-dock@micxgx.gmail.com dash-to-panel@jderose9.github.com ding@rastersoft.com gtk4-ding@smedius.gitlab.com gnome-wallpaper-engine@gjs.com vertical-app-grid@lublst.github.io; do
    if printf '%s\n' "$installed" | rg -Fxq "$uuid"; then
        gnome-extensions disable "$uuid" || break
    fi
done
```

La migración del instalador ya retira los tres forks antiguos. El bloque sirve
para instalaciones previas o alternativas adicionales; no borra sus archivos.
No desactivar indiscriminadamente todas las extensiones del sistema.

Después de instalar, volver a entrar y revisar duplicados, activar el stack:

```bash
gsettings set org.gnome.shell disable-user-extensions false
for uuid in aurea-wallpaper@local aurea-desktop-icons@local aurea-app-center@local macos27-dock@local side-dock-gnome50@local dynamic-island-gnome50@local lintel-v2@local lintel-widgets@local; do
    gnome-extensions enable "$uuid" || break
done
gnome-extensions list --enabled
```

El ajuste global permite también otras extensiones previamente habilitadas;
no cambia cuáles estaban seleccionadas. Si aparece «no existe», no repetir
reinstalaciones a ciegas: comprobar el UUID y cerrar/abrir sesión tras instalar.

## Seleccionar tema e iconos

Solo después de instalar Aurea. GTK4 recibe los estilos mediante la instalación;
`gtk-theme` por sí solo no cambia todas las aplicaciones GTK4/libadwaita.
Las aplicaciones con decoraciones propias pueden mantener su aspecto.

```bash
gsettings set org.gnome.desktop.interface gtk-theme 'Aurea27-Light'
gsettings set org.gnome.desktop.interface icon-theme 'Aurea27'
gsettings set org.gnome.desktop.interface cursor-theme 'Aurea27-cursors'
gsettings set org.gnome.desktop.wm.preferences button-layout 'close,minimize,maximize:'
```

Para oscuro, usar `Aurea27-Dark` como `gtk-theme` y seleccionar el esquema oscuro
si se desea: `gsettings set org.gnome.desktop.interface color-scheme 'prefer-dark'`.
Para volver al esquema predeterminado: `gsettings set org.gnome.desktop.interface
color-scheme 'default'`. Esto no restaura automáticamente un estilo GTK4 anterior.

El tema de Shell requiere la extensión externa User Themes. Si ya está instalada:

```bash
gnome-extensions enable user-theme@gnome-shell-extensions.gcampax.github.com
```

Elegir Aurea27-Light o Aurea27-Dark en sus preferencias. No forzar una ruta de
esquema: cambia entre instalaciones del usuario y del sistema.

El preset del dock es opcional y sobrescribe sus preferencias actuales:

```bash
dconf dump /org/gnome/shell/extensions/dash-to-dock/ > "$HOME/aurea-dock-antes.dconf"
dconf load /org/gnome/shell/extensions/dash-to-dock/ < presets/dock.dconf
```

Para deshacer ese preset: `dconf load /org/gnome/shell/extensions/dash-to-dock/
< "$HOME/aurea-dock-antes.dconf"`. Los presets JSON no se aplican automáticamente;
ver [preferencias](presets/README.md). Nunca ejecutar un reset general de dconf.

## Diagnóstico y recuperación

```bash
gnome-extensions info macos27-dock@local
gnome-extensions info aurea-wallpaper@local
journalctl --user -b --since '10 minutes ago' --no-pager | rg -i 'aurea|lintel|dynamic-island|gnome-shell|JS ERROR'
./aurea.sh install dist/aurea-27-0.0.1 --check
```

Los registros pueden contener datos personales; revisarlos antes de compartirlos.
Si una extensión falla, desactivar **su UUID** y comprobar el escritorio. Si no
se puede usar la sesión, desde una TTY del mismo usuario, como medida temporal:

```bash
gsettings set org.gnome.shell disable-user-extensions true
```

Esto suspende todas las extensiones de usuario; no las desinstala ni limpia datos.
Restaurar `false` desde una sesión utilizable después de desactivar la causante.
Para volver a una instalación anterior, recuperar la copia correspondiente de la
papelera y su selección de tema. Las copias reemplazadas pueden llamarse
`previous`; revisar su ubicación original antes de restaurar. No vaciar la
papelera hasta validar la sesión nueva. Git conserva fuentes, no tus preferencias.

## Desarrollo y nuevas versiones

```bash
./aurea.sh check
git status
git diff --check
git add RUTAS_MODIFICADAS
git commit -m "fix: describir el cambio"
```

Editar aquí, no en las copias instaladas. Separar cambios de comportamiento,
refactorizaciones y formato. Probar el componente afectado y documentar decisiones
en Markdown. Conservar licencias, directivas interpretadas por herramientas y
cadenas funcionales. No reiniciar versiones de formatos, protocolos o dependencias.

Para una entrega posterior, elegir una etiqueta semántica **nueva** en un commit
probado. Ejemplo de siguiente corrección; no ejecutar si esa etiqueta ya existe:

```bash
git tag -a v0.0.2 -m 'Aurea 27: correcciones verificadas'
./aurea.sh version
./aurea.sh build
./aurea.sh install dist/aurea-27-0.0.2
```

`version` y `build` requieren HEAD etiquetado y árbol limpio. Es normal que fallen
en un commit de desarrollo sin etiqueta. No mover `v0.0.1` ni sobrescribir paquetes
existentes. `dist/` es generado, no entra en Git. GNOME recibe un entero calculado
y `version-name` desde la etiqueta; todos los componentes comparten esa entrega.

## Pruebas visuales aisladas

```bash
bash extensions/dynamic-island/tests/smoke-shell.sh
bash extensions/dock/tests/smoke-magnification.sh
SIDE_TEST_MONITORS=2 bash extensions/app-island/test-shell.sh
bash extensions/topbar/tests/check-hover.sh
bash extensions/widgets/tools/test-shell.sh
bash integrations/desktop/test-overview.sh
```

Estos comandos usan su propio bus, configuración y compositor. Nunca habilitar el
control inseguro de Shell en la sesión habitual. Las pruebas de vídeo generan un
patrón sintético en un directorio temporal; no necesitan tus vídeos personales.

## Documentación

- [Arquitectura e identificadores](docs/arquitectura.md)
- [Procedencia y licencias](docs/procedencia.md)
- [Migración y recuperación](docs/migracion.md)
- [Verificación y límites](docs/verificacion.md)
- [Cambios](docs/CHANGELOG.md)

No hay remoto configurado ni se ha publicado el contenido. Antes de distribuir
a terceros, resolver los límites de licencia señalados en procedencia.
