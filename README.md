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
│   ├── lock-screen/
│   ├── live-wallpaper/
│   ├── desktop-icons/
│   ├── app-center/
│   ├── battery-care/
│   ├── caffeine/
│   ├── magic-lamp/
│   ├── window-motion/
│   ├── window-switcher/
│   ├── desktop-cube/
│   ├── privacy/
│   ├── app-indicators/
│   ├── app-uninstall/
│   └── shell-theme/
├── shared/                  Utilidades gráficas empaquetadas por componente
├── integrations/
│   ├── login-screen/        Acceso GDM, instalador administrativo y pruebas
│   ├── boot-menu/           Aurea 27 · Arranque (GRUB), tema completo y recuperación
│   └── desktop/             Integración y pruebas del escritorio
├── presets/                 Preferencias visuales sin datos personales
├── tools/                   Versión, construcción, instalación y validación
├── tests/                   Pruebas del repositorio
├── docs/                    Arquitectura, procedencia y notas técnicas
└── tasks/                   Plan y seguimiento de la consolidación
```

## Antes de empezar

Ejecutar los comandos desde esta carpeta, en una terminal de tu sesión GNOME,
como tu usuario habitual. **No ejecutar `aurea.sh install` con `sudo`.**
Los instaladores independientes de GDM y del menú de arranque requieren autorización administrativa,
mediante los comandos indicados en su sección.

```bash
cd ~/Escritorio/aurea-27
./aurea.sh help
gnome-shell --version
gnome-extensions list --enabled
gsettings get org.gnome.shell disable-user-extensions
```

La integración completa dispone de adaptaciones para GNOME 50 y 51. Se verificó
la carga y desactivación de los 19 módulos en ambos, con pruebas específicas de
interacción. No desactivar la validación de compatibilidad. Consultar
[instalación y mantenimiento en GNOME 51](docs/gnome51.md) y la
[guía de la isla de favoritas](docs/isla-aplicaciones-uso.md).
Las nuevas vistas de carpetas, grupos, estadísticas, clima y asistentes se explican
en [Espacios contextuales](docs/experiencia-contextual.md), con comandos y límites.
Estadísticas: cursor en el borde inferior izquierdo (24–80 px desde la esquina)
o **Organizar → Ver estadísticas** en el panel lateral.
La isla superior es negra y opaca. **Más → Herramientas** agrupa los accesos por
función; el scroll permanece disponible sin barras visibles en las superficies
de Aurea. La guía enlazada incluye cómo corregir una preferencia de vidrio anterior.
En Herramientas también están Descargas recientes, Relojes del mundo, Pantallas
y discos y Controles rápidos. La comparación completa con el video y las
integraciones todavía pendientes están en [la revisión de SideDock](tasks/video-2057.md).

**Editar la isla:** isla superior → Inicio → Editar. Arrastra tarjetas desde la
galería a Inicio para añadirlas, entre tarjetas para ordenarlas y de vuelta a la
galería para quitarlas. Admite seis tarjetas sin duplicados; Listo guarda, Cancelar
descarta y Deshacer revierte el último cambio. También se puede usar el teclado.
[Uso y alcance del editor](tasks/video-0921.md).

Bun se utiliza automáticamente si está instalado; Node queda como alternativa
y validador sintáctico. Para elegir: `AUREA_RUNTIME=bun ./aurea.sh check` o
`AUREA_RUNTIME=node ./aurea.sh check`. Las extensiones siguen ejecutándose en GJS.

Herramientas necesarias: Node.js, Git, GJS, GLib (`gsettings`, `gio`,
`glib-compile-schemas`, `glib-compile-resources`), gettext (`msgfmt`), `gtk-update-icon-cache` y `gnome-extensions`.
GDM requiere además Python 3, `gresource`, `glib-compile-resources`, `dconf`,
`restorecon`, `runuser` y `pkexec` (o `sudo`).
El vídeo necesita `mpv`, `ffmpeg` y sus codecs. Las pruebas usan también Python 3,
`rg` y `dbus-run-session`. Comprobar disponibilidad sin instalar ni cambiar nada:

```bash
for cmd in node git gjs gsettings gio glib-compile-schemas msgfmt gtk-update-icon-cache gnome-extensions mpv ffmpeg python3 rg dbus-run-session gresource glib-compile-resources dconf restorecon runuser pkexec; do
    command -v "$cmd" || printf 'Falta: %s\n' "$cmd"
done
```

KDE Connect es opcional para dispositivos y Buscar; MPRIS requiere un reproductor
compatible abierto. Batería/carga depende de UPower y del hardware. El control de
cuidado de batería, Cafeína y privacidad usa los módulos incluidos en Aurea.
El auxiliar privilegiado de batería conserva su contrato y permisos originales;
la migración no cambia los límites de carga. Emoji Copy permanece independiente. La conexión de red es
necesaria para clima, noticias y podcasts. Los controles ausentes no se resuelven
activando servicios al azar: revisar primero su dependencia concreta.

## Instalar un paquete existente

La versión del paquete se obtiene de la última etiqueta Git alcanzable desde
esta rama. Así no se reinstala por accidente la entrega inicial. Seleccionar el
paquete en la terminal que se usará para los siguientes comandos:

```bash
aurea_tag=$(git describe --tags --abbrev=0 --match 'v[0-9]*')
aurea_paquete="$PWD/dist/aurea-27-${aurea_tag#v}"
printf 'Paquete seleccionado: %s\n' "$aurea_paquete"
test -f "$aurea_paquete/release.json"
```

Repetir este bloque al abrir otra terminal o después de cerrar sesión: las
variables de la terminal anterior no se conservan.

Si `test` falla, el paquete no existe: `dist/` no se descarga con Git. Para generar
el paquete de un checkout limpio cuya **HEAD ya está etiquetada**, ejecutar:

```bash
./aurea.sh version && ./aurea.sh check && ./aurea.sh build
```

Si `version` informa que HEAD no tiene etiqueta o hay cambios sin guardar,
seguir [Desarrollo y nuevas versiones](#desarrollo-y-nuevas-versiones) antes de
continuar. No crear otra etiqueta para reconstruir una entrega ya etiquetada. Las etiquetas anteriores siguen disponibles, pero
sus paquetes no incluyen correcciones posteriores. No sobrescribirlos.

**Acceso y bloqueo global se actualiza primero con el instalador de GDM**,
si ya está instalado globalmente. Seguir la receta de abajo antes de aplicar
el resto del paquete. Así no se crea una copia de usuario ni se requiere ejecutar
el instalador completo como root.

Para instalar todo el escritorio:

```bash
./aurea.sh install "$aurea_paquete"
./aurea.sh install "$aurea_paquete" --apply
./aurea.sh install "$aurea_paquete" --check
```

El primer comando solo muestra destinos. `--apply` reemplaza archivos y migra los
UUID antiguos declarados en `stack.json`, conservando su estado activado/desactivado y sus
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
| Acceso y bloqueo | `aurea-lock-screen@local` |
| Fondo animado | `aurea-wallpaper@local` |
| Iconos de escritorio | `aurea-desktop-icons@local` |
| Centro de aplicaciones | `aurea-app-center@local` |
| Cuidado de batería | `aurea-battery-care@local` |
| Cafeína | `aurea-caffeine@local` |
| Efecto lámpara | `aurea-magic-lamp@local` |
| Movimiento de ventanas | `aurea-window-motion@local` |
| Selector de ventanas | `aurea-window-switcher@local` |
| Cubo de escritorios | `aurea-desktop-cube@local` |
| Privacidad | `aurea-privacy@local` |
| Indicadores de aplicaciones | `aurea-app-indicators@local` |
| Desinstalar aplicaciones | `aurea-app-uninstall@local` |
| Tema del sistema | `aurea-shell-theme@local` |

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

Para actualizar solo los widgets con el paquete seleccionado anteriormente:

```bash
./aurea.sh install "$aurea_paquete" --apply --component=widgets
./aurea.sh install "$aurea_paquete" --check --component=widgets
```

Conserva datos, posiciones y colores personalizados. El código nuevo se carga
al volver a iniciar sesión; `--check` verifica los archivos, no recarga GNOME.

Una vez cargada la extensión, añadir un widget lo muestra inmediatamente en modo
de edición; no requiere cerrar sesión por cada alta. Solo se admite uno de cada
tipo. La galería muestra «Mostrar» y «Ajustes» para los ya presentes; para cambiar
su tamaño usa Ajustes o las esquinas de edición. Ya no hay acción «Duplicar».
Las copias antiguas dejan de mostrarse: se conserva la primera de cada tipo del
orden guardado y se archivan las configuraciones restantes en `widgetsArchivados`
dentro de `~/.config/lintel-widgets/config.json`. Notas, eventos y demás datos
personales permanecen intactos.
En el fondo animado, seleccionar un vídeo existente y activar su inicio automático.
El paquete no lleva tus vídeos. El estilo del tema no inicia el reproductor.

### Bloqueo y apariencia de widgets

Acceso y bloqueo comparten `aurea-lock-screen@local` en GNOME 50. Incluye un fondo
estático 4K de WhiteSur con su licencia; no reproduce vídeo ni cambia el fondo del
escritorio. Conserva la autenticación, políticas de bloqueo y notificaciones
nativas. Impide el teclado virtual durante el bloqueo, también por entrada táctil
o gestos; el teclado físico sigue disponible. La pantalla de encendido/cierre de
sesión GDM se instala por separado, como se indica abajo.

```bash
gnome-extensions enable aurea-lock-screen@local
```

Para volver a la presentación nativa, ejecutar únicamente:

```bash
gnome-extensions disable aurea-lock-screen@local
```

No activar simultáneamente otra extensión que sustituya `UnlockDialog`.
Si el UUID no aparece tras instalarlo, cerrar y abrir sesión antes de activarlo.
No reiniciar el compositor ni usar evaluación insegura en la sesión habitual.

Los widgets conservan posiciones y datos. En sus Ajustes puedes elegir material,
color y tamaño de texto. Clima incorpora «Fondo atmosférico» (desactivable para
usar tu material); Calendario pequeño permite «Mes completo» o «Fecha grande»;
Reloj → «Mundial» muestra esferas por ciudad. Las animaciones respetan tanto la
preferencia global de widgets como el movimiento reducido de GNOME.

La tipografía utilizada es Adwaita Sans. La referencia visual y las diferencias
con las plataformas de Apple están en [la investigación](docs/bloqueo-widgets-investigacion.md).

### Actualizar bloqueo y acceso GDM juntos

Un único módulo adapta su presentación a dos modos. Al aplicar GDM queda una
sola instalación global; el instalador de usuario la verifica sin duplicarla:

| Pantalla | Componente | Instalación y activación |
|---|---|---|
| Bloqueo de una sesión abierta, `Super+L` | `aurea-lock-screen@local` | Módulo global y activación del usuario |
| Encendido/cierre de sesión, usuario y contraseña | `aurea-lock-screen@local` | Mismo módulo global; activación en el perfil de GDM |

Con `aurea_paquete` seleccionado en **Instalar un paquete existente**, ejecutar
estos comandos en orden. Actualizan solo bloqueo y GDM:

```bash
pkexec /usr/bin/python3 "$aurea_paquete/integrations/login-screen/manage.py" apply
node tools/unify-session-screens.mjs "$aurea_paquete" --apply
python3 "$aurea_paquete/integrations/login-screen/manage.py" status
./aurea.sh install "$aurea_paquete" --check --component=lock-screen
```

`pkexec` muestra el diálogo administrativo de Fedora. Si se prefiere la terminal,
reemplazar **solo esa línea** por:

```bash
sudo python3 "$aurea_paquete/integrations/login-screen/manage.py" apply
```

Guardar el trabajo, cerrar sesión desde el menú del sistema y volver a entrar.
GDM mostrará el acceso actualizado; la sesión nueva cargará el código del bloqueo.
Después, activar o comprobar el componente de usuario:

```bash
gsettings set org.gnome.shell disable-user-extensions false
gnome-extensions enable aurea-lock-screen@local
gnome-extensions info aurea-lock-screen@local
```

El ajuste global permite las extensiones previamente habilitadas. Si ya está en
`false`, no cambia nada. El mismo UUID tiene activación independiente en cada
sesión: el instalador configura GDM y el comando anterior configura tu escritorio.
La migración retira `aurea-login-layout@local` del sistema y del perfil de GDM.
La retirada de la copia de usuario conserva tu selección de activación; hasta
volver a entrar, GNOME puede mostrar el bloqueo nativo. No reinstalar otra copia.

GDM incluye fondo estático a color, perfil superior, contraseña compacta y
Apagar equipo/Reiniciar/Reposo inferiores. Elimina el logo y texto de Fedora.
Desactiva el teclado virtual de accesibilidad y bloquea además su apertura
automática, por foco o gesto. La misma política se aplica a `Super+L`; fuera del
acceso y bloqueo se conserva la preferencia personal del teclado virtual.
No sustituye la autenticación ni requiere vídeo.

El instalador configura y compila dconf, comprueba los valores del perfil GDM y
registra archivos y checksums para poder retirarlos. No hace falta ejecutar
`dconf update` manualmente ni borrar la imagen de Fedora del sistema.
`status` verifica los archivos instalados; **no confirma que un proceso GDM ya
abierto haya recargado los cambios**, ni sustituye la revisión visual del acceso.
No reiniciar `gdm.service`, matar GNOME ni usar evaluación insegura para recargar.

#### Restaurar o desactivar

Para retirar el tema de GDM y el módulo global de acceso/bloqueo, usando el mismo paquete seleccionado:

```bash
pkexec /usr/bin/python3 "$aurea_paquete/integrations/login-screen/manage.py" remove
python3 "$aurea_paquete/integrations/login-screen/manage.py" status
```

Para desactivar la presentación del bloqueo de usuario, por separado:

```bash
gnome-extensions disable aurea-lock-screen@local
```

La retirada administrativa elimina el módulo global y los ajustes de GDM;
vuelven las pantallas nativas, incluidos logo y teclado de accesibilidad. Desactivar la extensión del bloqueo
restaura su comportamiento nativo. Los cambios de GDM se ven en el siguiente acceso.

Si una actualización de GNOME restaura el tema de Fedora, repetir `apply` con el
paquete elegido: construye sobre los recursos nuevos del sistema. No bloquear las
actualizaciones de GNOME. Para trabajar directamente con los fuentes, los comandos
equivalentes están en [la guía de GDM](integrations/login-screen/README.md).

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

La migración del instalador desactiva los UUID originales y retira sus copias
de usuario; los paquetes RPM del sistema se retiran por separado. El bloque sirve
para instalaciones previas o alternativas adicionales; no borra sus archivos.
No desactivar indiscriminadamente todas las extensiones del sistema.

Después de instalar, volver a entrar y revisar duplicados, activar el stack:

```bash
gsettings set org.gnome.shell disable-user-extensions false
for uuid in aurea-wallpaper@local aurea-desktop-icons@local aurea-app-center@local macos27-dock@local side-dock-gnome50@local dynamic-island-gnome50@local lintel-v2@local lintel-widgets@local aurea-lock-screen@local; do
    gnome-extensions enable "$uuid" || break
done
gnome-extensions list --enabled
```

El ajuste global permite también otras extensiones previamente habilitadas;
no cambia cuáles estaban seleccionadas. Si aparece «no existe», no repetir
reinstalaciones a ciegas: comprobar el UUID y cerrar/abrir sesión tras instalar.

### Módulos integrados y extensiones del sistema

El pack incluye 19 componentes; Acceso y bloqueo usa una única instalación
global cuando se personaliza GDM. La migración conserva qué módulos
estaban habilitados; en una instalación nueva puedes activar los adicionales
individualmente con los UUID de la tabla. Los efectos son opcionales, no requisitos
del tema. Emoji Copy no se importa, desinstala ni configura.

Los fuentes originales, revisiones y licencias están registrados en
[procedencia del pack](docs/extension-pack.md) y `docs/upstream-extensions.json`.
La antigua entrada Aurea Login se sustituye por **Aurea 27 · Acceso y bloqueo**.
Si aparece una extensión ya retirada, GNOME conserva su ficha en memoria: cerrar
y abrir sesión actualiza la lista. Reabrir el gestor de extensiones no la recarga.

Después de instalar y verificar los sustitutos Aurea, los tres RPM redundantes
pueden retirarse sin eliminación automática de dependencias. Primero previsualizar:

```bash
dnf remove --assumeno --no-autoremove gnome-shell-extension-dash-to-dock gnome-shell-extension-appindicator gnome-shell-extension-user-theme
```

La transacción debe retirar únicamente esos tres paquetes. Si muestra otros,
detenerse y revisar. Para aplicar esa misma retirada:

```bash
sudo dnf remove --no-autoremove gnome-shell-extension-dash-to-dock gnome-shell-extension-appindicator gnome-shell-extension-user-theme
```

Conservar `gnome-shell-extension-common`, GNOME Shell, GDM y Acceso y bloqueo.
No borrar carpetas de `/usr/share/gnome-shell/extensions` manualmente. Para volver
a las extensiones de Fedora, desactivar primero sus equivalentes Aurea y usar
`sudo dnf install` con los tres nombres anteriores. No se restauran los UUID
originales automáticamente: la guía de migración explica cómo elegirlos.

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

El tema Shell lo gestiona **Aurea 27 · Tema del sistema**, incluido en el pack:

```bash
gnome-extensions enable aurea-shell-theme@local
gnome-extensions prefs aurea-shell-theme@local
```

Elegir Aurea27-Light o Aurea27-Dark en sus preferencias. Conserva la selección
y el esquema de User Themes. No activar ambos gestores a la vez.

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
./aurea.sh install "$aurea_paquete" --check
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
probado y con árbol limpio. Este bloque solicita la etiqueta; no fija una versión
antigua en los comandos:

```bash
read -r -p 'Nueva etiqueta (formato vX.Y.Z): ' aurea_etiqueta
git tag -a "$aurea_etiqueta" -m 'Aurea 27: entrega verificada'
```

Si Git rechaza la etiqueta porque ya existe, detenerse y elegir otra; no usar `-f`.
Con la etiqueta creada:

```bash
./aurea.sh version
./aurea.sh build
aurea_tag=$(git describe --tags --exact-match --match 'v[0-9]*' HEAD)
aurea_paquete="$PWD/dist/aurea-27-${aurea_tag#v}"
./aurea.sh install "$aurea_paquete"
```

`version` y `build` requieren HEAD etiquetado y árbol limpio. En una copia de una
entrega ya etiquetada basta con esos comandos, sin crear otra etiqueta. Si HEAD
contiene trabajo posterior sin etiqueta, terminar y verificar esa entrega primero;
no presentarlo como si fuera la anterior. No mover etiquetas ni sobrescribir paquetes
existentes. `dist/` es generado y no entra en Git. GNOME recibe un entero calculado
y `version-name` desde la etiqueta; todos los componentes comparten esa entrega.

## Personalizar la barra superior

```bash
gnome-extensions prefs lintel-v2@local
```

También: menú de la manzana → **Personalizar Aurea…** o lápiz del Centro de
Control. Permite editar módulos, orden, colores, vidrio/sólido, contraste,
animación, reloj y ocultamiento. La barra puede conservar texto blanco con
paneles claros; tu configuración existente se mantiene. «Ver» muestra los cambios
sobre el escritorio. Las preferencias se actualizan en vivo una vez cargada la
nueva extensión. Después de instalar código nuevo en Wayland, cerrar y volver a
iniciar sesión carga esos módulos; no reiniciar GNOME con comandos forzados.

[Controles, arquitectura, pruebas y límites de la barra](docs/topbar-experiencia.md).

**Iconos de menús:** Personalizar Aurea → Barra → Iconos de menús → Todas las
acciones. Es el valor predeterminado y sustituye el antiguo modo selectivo.
Incluye acciones del escritorio, submenús y opciones del Centro de Control;
la selección se indica aparte del icono. Se conservan los iconos publicados por
las aplicaciones y se completa cualquier acción que no proporcione uno.

**Luz del teclado:** activa el módulo en Personalizar Aurea → Centro de Control.
El icono enciende/apaga y recuerda la última intensidad durante la sesión; el
deslizador ajusta los niveles reales admitidos por el teclado. Se sincroniza con
las teclas físicas y solo aparece si GNOME detecta retroiluminación. No requiere
`sudo`, servicios adicionales ni permisos de escritura sobre `/sys`.
En instalaciones nuevas está incluido de forma predeterminada; las listas de
controles personalizadas se conservan y permiten añadirlo desde las preferencias.
[Implementación y pruebas](docs/luz-teclado.md).

## Pruebas visuales aisladas

```bash
bash extensions/dynamic-island/tests/smoke-shell.sh
bash extensions/dock/tests/smoke-magnification.sh
SIDE_TEST_MONITORS=2 bash extensions/app-island/test-shell.sh
bash extensions/topbar/tests/check-hover.sh
bash extensions/widgets/tools/test-shell.sh
bash extensions/lock-screen/tests/smoke.sh
python3 integrations/login-screen/test_manage.py
bash integrations/login-screen/test-shell.sh
bash integrations/desktop/test-overview.sh
```

Estos comandos usan su propio bus, configuración y compositor. Nunca habilitar el
control inseguro de Shell en la sesión habitual. Las pruebas de vídeo generan un
patrón sintético en un directorio temporal; no necesitan tus vídeos personales.

## Menú de arranque Aurea 27 (GRUB)

Tema completo integrado en `integrations/boot-menu`, con nombre activo `Aurea27`.
Retira la entrada manual de Arch externo y conserva Fedora y Windows. Las opciones
alternativa y de rescate siguen perteneciendo a Fedora; no se borran kernels para
ocultarlas. Mantiene el motor GRUB y sus identificadores técnicos originales.

Desde el repositorio:

```bash
sudo python3 integrations/boot-menu/manage.py apply
sudo python3 integrations/boot-menu/manage.py check
```

Desde el paquete construido y seleccionado con `aurea_paquete`:

```bash
sudo python3 "$aurea_paquete/integrations/boot-menu/manage.py" apply
sudo python3 "$aurea_paquete/integrations/boot-menu/manage.py" check
```

La instalación general de extensiones no modifica el arranque. Para revertir:

```bash
sudo python3 integrations/boot-menu/manage.py restore
```

Necesita Fedora UEFI, BLS, `grub2-mkconfig`, `grub2-script-check`, `restorecon` y
Windows ya configurado en `40_custom`, con su cargador en la partición EFI montada.
Se respaldan los archivos antes de editar y se valida la configuración generada.
No se reinicia automáticamente. Los detalles, límites tras actualizar GRUB y
recuperación están en [la guía de arranque](integrations/boot-menu/README.md).

## Documentación

- [Arquitectura e identificadores](docs/arquitectura.md)
- [Evaluación y propuesta de la isla de favoritas](docs/isla-aplicaciones-evaluacion.md)
- [Procedencia y licencias](docs/procedencia.md)
- [Migración y recuperación](docs/migracion.md)
- [Verificación y límites](docs/verificacion.md)
- [Cambios](docs/CHANGELOG.md)

El remoto `origin` está configurado para `Yeferson-gm/aureaos-desktop`. Los commits
locales no se publican automáticamente: revisar `git status -sb` y `git remote -v`.
Antes de distribuir a terceros, resolver los límites de licencia señalados en
[procedencia](docs/procedencia.md).

## Nueva experiencia de la isla dinámica

La [guía de la isla](docs/isla-dinamica-uso.md) describe tarjetas configurables,
actividades persistentes, gestos, estante GTK, notificaciones por aplicación y
módulos opcionales. Incluye dependencias, privacidad, tareas locales y límites
verificados. La [validación](docs/isla-dinamica-validacion.md) registra pruebas y
mediciones.

Para actualizar únicamente una extensión, el instalador acepta
`--component=dynamic-island` junto con `--apply` o `--check`. Sin `--apply` solo
muestra los destinos. Esa selección conserva los demás componentes y no modifica
las preferencias del tema. Usa paquetes construidos desde una etiqueta Git limpia.

## Personalizar el Dock

[Controles, pruebas y límites del Dock](docs/dock-uso.md). La nueva página Aurea
se abre con `gnome-extensions prefs macos27-dock@local`. Incluye material,
desenfoque, aspecto, indicadores y movimiento con restauración por grupo.


Para actualizar únicamente el Dock, seleccionar `aurea_paquete` como se indica en
**Instalar un paquete existente** y ejecutar:

```bash
./aurea.sh install "$aurea_paquete" --apply --component=dock
./aurea.sh install "$aurea_paquete" --check --component=dock
```

Conserva las preferencias del Dock. Cerrar sesión y volver a entrar carga el código
actualizado; `--check` verifica archivos, no la versión ya cargada en memoria.

## Espacios laterales y acceso rápido

Consultar [diseño y uso de las islas](docs/islas-diseno.md): favoritas, grupos,
archivos copiados, contenido de carpetas, estadísticas en el borde opuesto y
apertura por hover de la isla superior. Los atajos y preferencias se conservan.
