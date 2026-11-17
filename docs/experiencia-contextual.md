# Espacios contextuales de Aurea

Adaptación de los recorridos de SideDock observados en la grabación del usuario.
El [registro de análisis](../tasks/video-squaredock.md) identifica los intervalos
revisados. Se conserva la identidad de Aurea, sin incorporar capturas, código ni
recursos de esa aplicación.

## Isla lateral: carpetas y grupos

Añadir una carpeta desde Favoritas → Añadir y fijarla como acceso rápido.
Al pasar el cursor sobre ella durante 300 ms se abre una cuadrícula de archivos.
También se abre con clic; el botón central abre directamente Archivos.

La vista permite buscar, ordenar por nombre o modificación, entrar en subcarpetas,
volver hasta la carpeta inicial y fijar la carpeta actual. Los cambios del directorio
se reflejan mientras está abierta. La lectura es asíncrona y muestra hasta 120
entradas; los archivos ocultos se omiten. «Abrir en Archivos» permite ver el contenido
completo. La búsqueda filtra esa muestra, no recorre subcarpetas.

Desde las acciones de una categoría, «Fijar grupo en el lateral» añade un mosaico
con sus accesos. El panel contextual permite abrir un elemento, abrir el grupo u
organizarlo. Se muestran como máximo cuatro grupos fijados junto a los accesos
rápidos. La apertura de grupos respeta los elementos excluidos de «Abrir grupo».

Escape, clic exterior o salida del cursor cierran las vistas. Se mantienen dentro
del monitor elegido. Abrir o cerrar cancela lecturas anteriores; una superficie
persistente evita asignaciones gráficas pendientes sobre actores retirados.

## Estadísticas en el borde opuesto

Acercar el cursor al indicador del borde opuesto al lateral. «Mantener abierto»
fija temporalmente el panel; Cerrar o Escape lo libera. Ajustes → Estadísticas
permite desactivar el indicador. No se sitúa en un borde compartido entre monitores.

Cada fila abre detalles: CPU, RAM, almacenamiento del directorio personal, red,
baterías detectadas por UPower y calendario. CPU/RAM/red tienen gráficos de hasta
60 muestras, con actualización cada dos segundos. Disco y dispositivos se consultan
como máximo cada diez segundos. Al cerrar se detienen el muestreo y las consultas.
La red muestra tráfico agregado de interfaces salvo loopback, no velocidad contratada.
No se muestran temperaturas, procesos ni batería de periféricos que el sistema no
exponga. Los enlaces a herramientas externas informan si estas no están instaladas.

## Isla superior y widgets

Inicio presenta tres tarjetas configurables. Pasar el cursor o darles foco cambia
el detalle contextual; clic abre el módulo completo. Música ofrece controles MPRIS,
Agenda el próximo evento disponible y Clima temperatura, sensación y humedad.
Clima incluye seis horas de pronóstico y cinco días con máximas y mínimas.

El proveedor es Open-Meteo. Se conserva la localización aproximada por IP y Lima
como respaldo. Requiere red; una petición en curso se reutiliza y el clima almacenado
se conserva si falla la actualización. No se prometen datos meteorológicos en vivo
sin conexión.

Clic derecho en reloj, calendario, clima, batería, música, notas o recordatorios
ofrece «Ver detalles en la isla» cuando la isla superior está activa. Esta acción
conecta las superficies sin modificar el diseño del widget.

## Codex, Claude y OpenCode

Inicio → Asistentes detecta instalaciones válidas, vuelve a detectarlas a petición
y permite escribir una consulta y elegir una carpeta de trabajo existente.

- **Iniciar sesión:** usa Ptyxis o GNOME Terminal y la herramienta de terminal
  instalada. Codex y Claude reciben la consulta como argumento literal. OpenCode
  abre su interfaz interactiva y deja la consulta copiada para pegarla.
- **Copiar y abrir app:** abre la aplicación registrada y copia la consulta. El usuario
  debe pegarla; no se inyecta texto mediante accesibilidad ni se envía automáticamente.
- Las sesiones lanzadas por Aurea publican inicio, ejecución y finalización mediante
  el puente local existente. Su salida y aprobaciones permanecen en la herramienta.

No se leen credenciales, conversaciones ni cuotas de las cuentas. No se activan
banderas de aprobación automática. No hay un chat de IA incrustado, sincronización
completa de sesiones externas ni cuotas inventadas. Un ejecutable enlazado a un
archivo ausente se considera no disponible. No se reinstalan herramientas al pulsar
«Volver a detectar».

## Activación y mantenimiento

Instalar desde un paquete construido y etiquetado siguiendo el README. Para estos
cambios bastan los componentes `app-island`, `dynamic-island` y `widgets`:

```bash
aurea_tag=$(git describe --tags --abbrev=0 --match 'v[0-9]*')
aurea_paquete="$PWD/dist/aurea-27-${aurea_tag#v}"
for componente in app-island dynamic-island widgets; do
    ./aurea.sh install "$aurea_paquete" --component="$componente" --apply || break
    ./aurea.sh install "$aurea_paquete" --component="$componente" --check || break
done
```

Tras cargar el código nuevo en una sesión habitual, configuración opcional:

```bash
export GSETTINGS_SCHEMA_DIR="$HOME/.local/share/gnome-shell/extensions/dynamic-island-gnome50@local/schemas"
gsettings set org.gnome.shell.extensions.dynamic-island home-modules "['music', 'today', 'weather']"
gsettings set org.gnome.shell.extensions.dynamic-island hover-open true
gsettings set org.gnome.shell.extensions.dynamic-island agent-events true
```

Se pueden desactivar las dos últimas funciones con `false`. Ajustes de la isla
permite cambiar las tarjetas. Las preferencias personales y carpetas fijadas
permanecen fuera de Git. La instalación no obliga a cerrar la sesión; guardar el
trabajo y volver a entrar carga los módulos que GNOME mantiene en memoria.

## Validación y alcance

Las pruebas aisladas cubren aperturas rápidas, entrada/salida real del cursor,
foco, búsqueda, cambios de archivos, cancelación, gráficos, pronóstico de prueba,
argumentos de asistentes y carga/descarga en GNOME 50 y 51. La prueba conjunta
comprueba además que el menú del widget abre el módulo correcto. No envían consultas
reales a los asistentes ni sustituyen la comprobación con los dispositivos del usuario.

Esta entrega no incluye todos los módulos de SideDock: mascota, chat Pip, cuotas
de proveedores, AirDrop y restauración de proyectos externos no se implementan.
Las funciones ya existentes de archivos, grupos, notas, agenda, reproducción y
puente de tareas se amplían, no se duplican en un nuevo lanzador general.

Referencias: [SideDock](https://getsidedock.com/),
[Open-Meteo](https://open-meteo.com/en/docs),
[CLI de OpenCode](https://opencode.ai/docs/cli/).
