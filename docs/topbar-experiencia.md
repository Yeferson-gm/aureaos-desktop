# Barra superior y Centro de Control

Implementación de la investigación aprobada en `investigacion-topbar.md`.
El aspecto es propio de Aurea, inspirado en macOS; utiliza St/Clutter y los
servicios de GNOME. No requiere fuentes ni recursos propietarios de Apple.

## Uso

Abrir el menú de la manzana → **Personalizar Aurea…**, el lápiz del Centro de
Control o ejecutar:

```bash
gnome-extensions prefs lintel-v2@local
```

Las preferencias se guardan atómicamente en
`~/.config/lintel-v2/config.json`. Se conservan las claves anteriores y los
colores personalizados. Los cambios se aplican en vivo; no requieren reiniciar
la sesión después de cargar esta versión de la extensión. «Ver» abre una vista
previa real del Centro de Control. Cada sección permite restaurar su apariencia
o distribución.

La barra y los paneles tienen colores independientes. Por ejemplo, texto e
iconos blancos en la barra pueden coexistir con paneles claros de texto oscuro.
El color del acento selecciona automáticamente un primer plano legible. La
adaptación al fondo es opcional y solo funciona con color automático, sin
colores personalizados; toma una muestra local cada tres segundos con histéresis.
No guarda capturas ni transmite datos.

El material vidrio usa desenfoque de fondo dentro del panel abierto, sin
extenderlo fuera de las esquinas. Sólido y contraste aumentado lo desactivan.
El ajuste de reducir movimiento y la preferencia de animaciones de GNOME tienen
prioridad sobre la duración elegida.

## Controles

- Elegir módulos, orden y tamaño compacto/ancho en **Controles**. Los módulos
  que dependen de hardware ausente se omiten y los siguientes ocupan el espacio.
- Wi-Fi y Bluetooth: pulsar el control para activar/desactivar; la flecha abre
  redes o dispositivos dentro del mismo panel. «Volver» regresa a los controles.
- Brillo, salida y entrada de audio: valor porcentual, rueda y teclado. Los
  controles de audio incluyen silencio y selección de dispositivo. Micrófono está
  incluido por defecto cuando hay una entrada disponible; las listas de módulos
  personalizadas se conservan.
- Energía: elegir el perfil exacto publicado por el servicio; se muestra el
  perfil actual, operación pendiente y limitaciones de rendimiento disponibles.
- Cuidado de batería: muestra los modos y umbrales de Battery Health Charging;
  activa las acciones del proveedor, sin escribir directamente al hardware ni
  simular una carga confirmada. Requiere esa extensión activa y su integración
  de permisos instalada.
- No molestar: activación indefinida o 30/60/120 minutos. Al terminar un período
  se restaura el estado anterior. Si se desactiva Aurea durante un período
  temporal, también se restaura; el temporizador no persiste entre sesiones.
- Luz nocturna distingue «Activa ahora» de «Programada».
- Privacidad distingue actividad detectada y permisos de cámara, micrófono y
  ubicación. Las preferencias de GNOME no garantizan el bloqueo de aplicaciones
  que no las respeten. La cámara usa `Shell.CameraMonitor`, sin recorrer `/proc`.
- Cafeína se incluye por defecto cuando está instalado su proveedor; su
  interruptor refleja también los cambios externos. Modo avión utiliza el
  proveedor de GNOME. Pantallas, VPN y Ethernet
  identifican explícitamente su acceso a Ajustes con ↗.
- Captura abre el selector nativo. No añade reproductores ni avisos paralelos
  a los que ya gestiona la isla dinámica.

## Barra y menús

La fecha permanece al extremo derecho, después de los indicadores de Aurea y
de otras extensiones. Los indicadores externos conservan su orden relativo.
Indicadores reordenables, visibilidad permanente/activa/oculta y excedentes en
«•••». El Centro de Control permanece accesible. Se reserva el espacio real
ocupado por el notch sin modificar sus dimensiones. Se limita el nombre de la
aplicación y se usan cifras tabulares para el reloj. Formatos 12/24 horas,
fecha y segundos son configurables; sin segundos el reloj espera al siguiente
minuto.

El ocultamiento puede ser nunca, en pantalla completa o siempre. El borde
superior revela la barra; no se oculta mientras se usa un menú. Al desactivar
Aurea se restauran la posición y la política de pantalla completa de GNOME.

Cuando una aplicación publica un menú GTK mediante D-Bus, Aurea lee sus
acciones, submenús, estado y disponibilidad. Los perfiles conocidos de navegador,
archivos y terminal mantienen sus atajos de compatibilidad; las aplicaciones
genéricas solo reciben operaciones de ventana y acciones de su archivo desktop.
No se ofrecen Guardar o Deshacer universales. Los símbolos Mac son una opción de
presentación: ⌘ representa Ctrl; no cambian la distribución física del teclado.
Las acciones conservan la ventana original y cancelan las teclas si ya no existe
o no obtiene el foco.

## Correspondencia con los 56 puntos

| Investigación | Implementación |
|---|---|
| 1–8 | Geometría común en CSS/`control-layout.js`, espaciado y overflow en `panel-layout.js`, reloj configurable y pruebas de monitores/escalas |
| 9–18 | Configuración independiente de colores, contraste adaptativo, `menu-surface.js`, `theme-tokens.js`, superficies sólidas, radios, bordes y tipografía |
| 19–26 | Apertura breve desde el botón, cierre nativo sin retener el grab, interrupciones, teclado inmediato, movimiento reducido, selección local y prueba de puntero real |
| 27–38 | `control-center.js`: módulos editables, desplazamiento, reflujo, detalles y operaciones de los proveedores |
| 39–44 | Iconografía selectiva, columnas, `published-menus.js`, atajos reales y destino de ventana estable |
| 45–48 | Preferencias GTK4, vista previa, restauración, proveedores de estado, nombres y estado accesibles, privacidad precisa |
| 49–52 | Cámara por señales, reloj por minuto, cancelación de operaciones, módulos separados y restauración al desactivar |
| 53–54 | Matriz aislada, 100 interrupciones y mediciones reproducibles; límites de rendimiento físico abajo |
| 55–56 | Fuente única, entrega desde etiqueta Git, instalación verificable por componente, ocultamiento y controles opcionales |

## Instalación por componente

La entrega se genera desde una etiqueta Git y conserva el UUID `lintel-v2@local`.
Usar el paquete correspondiente a la etiqueta elegida:

```bash
./aurea.sh build
./aurea.sh install dist/aurea-27-0.2.0 --component=topbar
./aurea.sh install dist/aurea-27-0.2.0 --component=topbar --apply
./aurea.sh install dist/aurea-27-0.2.0 --component=topbar --check
gnome-extensions enable lintel-v2@local
```

La primera instalación de código nuevo requiere volver a iniciar sesión en
Wayland. La personalización posterior se aplica en vivo desde preferencias.
No ejecutar estos comandos con `sudo` ni reemplazar manualmente archivos en la
copia instalada de GNOME.

## Arquitectura

- `settings-model.js`: contrato y validación sin dependencias del escritorio.
- `configuration.js`: persistencia y recarga atómica.
- `prefs.js`: edición y vista previa GTK4/libadwaita.
- `services.js`, `platform.js`: audio, energía, batería, Bluetooth, privacidad y
  acceso a configuración/servicios. Wi-Fi conserva su proveedor NetworkManager
  compartido entre el indicador y el panel.
- `control-center.js`, `control-layout.js`: tarjetas, subvistas y reflujo.
- `menu-surface.js`, `theme-tokens.js`: material, animación y paleta.
- `panel-layout.js`: distribución, notch, excedentes, ocultamiento y contraste.
- `published-menus.js`: acciones exportadas por aplicaciones.
- `extension.js`: composición, indicadores y menús de compatibilidad.

La destrucción de las superficies se difiere hasta la fase inactiva de baja
prioridad de GLib después de cerrar y soltar el grab. Esto evita destruir un
BoxPointer que Clutter todavía está calculando en el fotograma actual. No se
mantiene una capa de entrada invisible para completar una animación.

## Verificación y límites

Las pruebas usan un bus, compositor, configuración y dispositivos virtuales
propios. No reinician ni controlan de forma insegura la sesión de trabajo.
La conexión real a servicios se complementa con modelos sintéticos para no
cambiar volumen, brillo, perfil energético o conexiones del equipo durante las
pruebas. La selección de modos de batería depende del hardware y proveedor real.

```bash
./aurea.sh check
bash extensions/topbar/tests/check-hover.sh
AUREA_TEST_DUAL=1 AUREA_TEST_SCALE=1.25 AUREA_TEST_MONITOR=1920x1080 bash extensions/topbar/tests/check-hover.sh
AUREA_TEST_SCALE=1.5 AUREA_TEST_ISLAND=1 AUREA_TEST_MONITOR=1920x1080 bash extensions/topbar/tests/check-hover.sh
AUREA_TEST_SCALE=2 AUREA_TEST_MONITOR=2560x1440 AUREA_TEST_BENCHMARK=1 bash extensions/topbar/tests/check-hover.sh
AUREA_TEST_MONITOR=1280x720 AUREA_TEST_TEXT_SCALE=1.5 bash extensions/topbar/tests/check-hover.sh
```

Cada ejecución deja en `/tmp/topbar-hover-*` capturas claro/oscuro, logs,
`metrics.json` y, si se solicita, `idle-resources.json`. El campo de ciclo mide
trabajo síncrono de **dos aperturas y dos cierres**, no la duración del fotograma.
Los cien ciclos deben acabar con el mismo número de grabs que al comenzar.
Se comprueban clic, Escape, clic exterior, Bluetooth conectado, perfil exacto,
deslizadores independientes, acciones exportadas, preferencias, ocultamiento,
material sólido, contraste y recarga/desactivación sin errores críticos.

En una ejecución a escala 200 % se midió una mediana de 10,04 ms y percentil 95
de 12,83 ms por ciclo síncrono de cuatro operaciones. Los grabs fueron 0 antes
y 0 después. Una muestra de reposo de tres segundos registró 0,67 % CPU sin
Aurea y 0,33 % con Aurea en ese compositor privado; es demasiado corta para
atribuir una mejora, pero no mostró un incremento sostenido en esa muestra.
El RSS fue aproximadamente 314/313 MiB del proceso completo, no de la extensión.

El blur se verificó comparando capturas con el mismo panel y efecto activado o
desactivado: la diferencia queda limitada al rectángulo interior de la superficie.
Los avisos de «unsafe mode» que pueden aparecer en las capturas pertenecen solo
al compositor privado de pruebas.

Las mediciones headless no certifican GPU física, vídeo de alta resolución,
120 Hz, hotplug físico ni recuperación de suspensión de todos los controladores.
Tampoco convierten aplicaciones Qt/Electron sin menú exportado en aplicaciones
con integración nativa de macOS. Esos límites no se ocultan con controles ficticios.
