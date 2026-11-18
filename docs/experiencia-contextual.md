# Espacios contextuales de Aurea

Adaptación de los recorridos de SideDock observados en la grabación del usuario.
El [registro de análisis](../tasks/video-squaredock.md) identifica los intervalos
revisados. Se conserva la identidad de Aurea, sin incorporar capturas, código ni
recursos de esa aplicación.

## Isla lateral: carpetas y grupos

El panel «Archivos y favoritos» usa negro con texto claro por defecto, también
cuando GNOME está en modo claro. Solo seleccionar explícitamente «Claro» en sus
ajustes cambia esa elección. «Todo / Archivos / Apps» separa los accesos elegidos;
la pantalla Añadir prioriza rutas y archivos copiados. Si todos los grupos con
contenido estaban plegados al cargar, se despliega el primero para mostrarlo.

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

## Estadísticas al pasar el cursor

Acercar el cursor al borde inferior, entre 24 y 80 píxeles lógicos desde la esquina
izquierda del monitor elegido, y esperar un cuarto de segundo. También se puede
abrir desde **Organizar → Ver estadísticas**, sin buscar el punto con el cursor. Aparece una franja horizontal encima del dock. Pasar el cursor
sobre CPU, memoria, disco, red, batería o fecha abre su detalle encima de la franja.
«Mantener abierto» fija temporalmente el panel; Cerrar, Escape o salir con el cursor
lo libera. Ajustes → Estadísticas desactiva el indicador. La zona no se activa en
un borde inferior compartido con otro monitor.

Cada indicador abre detalles: CPU, RAM, almacenamiento del directorio personal, red,
baterías detectadas por UPower y calendario. CPU/RAM/red tienen gráficos de hasta
60 muestras, con actualización cada dos segundos. El eje muestra el intervalo
real de las muestras disponibles; al abrir empieza sin historial inventado. Los
gráficos se dibujan con Cairo, el motor vectorial del escritorio, con áreas y curvas
y un color por métrica. Disco y batería usan barras de proporción. Disco y dispositivos se consultan
como máximo cada diez segundos. Al cerrar se detienen el muestreo y las consultas.
La red muestra tráfico agregado de interfaces salvo loopback, no velocidad contratada.
No se muestran temperaturas, procesos ni batería de periféricos que el sistema no
exponga. Los enlaces a herramientas externas informan si estas no están instaladas.

## Isla superior y widgets

Inicio presenta hasta seis tarjetas configurables. Pasar el cursor o darles foco cambia
el detalle contextual; clic abre el módulo completo. Música ofrece controles MPRIS,
Agenda el próximo evento disponible y Clima temperatura, sensación y humedad.
Clima incluye seis horas de pronóstico y cinco días con máximas y mínimas.

**Editar como en la referencia:** abre la isla superior → Inicio → Editar.
La galería permite arrastrar módulos a Inicio, soltar antes de otra tarjeta para
ordenarlos o devolverlos a la galería para quitarlos. La franja inferior también
acepta tarjetas para retirarlas. Quitar un acceso no borra notas, archivos ni tareas.
«En uso» identifica los módulos presentes y evita duplicados. Listo aplica el orden
al instante; Cancelar y Escape descartan los cambios. Deshacer y Restaurar permiten
recuperar la organización dentro de la edición. Con teclado: Tab para recorrer,
Enter para añadir, Alt+flechas para ordenar y Suprimir para quitar una tarjeta.
El [análisis de la referencia](../tasks/video-0921.md) detalla alcance y pruebas.

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

## Herramientas de desarrollo

`aurea.sh` elige Bun cuando está instalado, con Node como alternativa. Se puede
seleccionar explícitamente con `AUREA_RUNTIME=bun ./aurea.sh check` o
`AUREA_RUNTIME=node ./aurea.sh check`. Bun ejecuta construcción, instalación y
pruebas compatibles, incluyendo las pruebas `node:test` mediante `bun test`. Los
imports `node:fs` y similares son APIs compatibles, no procesos Node en ejecución.
La validación sintáctica sigue usando `node --check`, que admite los módulos GJS
sin resolver sus imports `gi://`. Las extensiones se ejecutan en GJS, no en Bun.

Chart.js requiere un contexto Canvas; no se introduce un navegador ni un servidor
web dentro del compositor para dibujar estas métricas. Referencias:
[Chart.js](https://www.chartjs.org/docs/latest/getting-started/integration.html),
[compatibilidad de Bun](https://bun.sh/docs/runtime/nodejs-compat).

Las superficies transitorias controlan su propia visibilidad. La administración
automática `trackFullscreen` de Chrome podía volver a mostrar una superficie
cerrada sin reactivar su muestreo. Se excluyen de ese control y se cierran
explícitamente al cambiar pantalla completa; las pruebas verifican estado,
visibilidad, entrada real del cursor, salida y ausencia de muestreo oculto.

## Jerarquía visual de las islas

El espacio lateral mantiene 22 px de margen interior, encabezado compacto con
icono, búsqueda nativa `St.Entry`, segmentos con icono y nombre, selector de espacio,
contenido desplazable y acciones al pie. «En uso» solo filtra aplicaciones y aparece
en Apps; no se muestra el ambiguo «Todas». El azul identifica selección, foco y
acción principal; el blanco identifica títulos y el gris legible el texto secundario.
Las acciones secundarias conservan sus etiquetas. Los mensajes del pie tienen
ancho limitado y admiten dos líneas.

La isla superior comparte selección azul, niveles de texto e iconos simbólicos
en su navegación. Los controles reutilizan St/Clutter, Pango e iconos del sistema,
con accesibilidad y teclado nativos. Una librería de componentes HTML no se puede
insertar directamente en GNOME Shell. Referencia: [St.Entry](https://gnome.pages.gitlab.gnome.org/gnome-shell/st/class.Entry.html).

La prueba de geometría comprueba que los controles quedan dentro del panel con
texto al 100 % y al 125 %, y que título y buscador no se pisan. La regresión que
eliminó `padding` al limpiar CSS queda cubierta por esas medidas reales.

## Material y rendimiento

La isla superior usa negro puro y opaco por defecto, tanto cerrada como abierta.
El espacio lateral conserva negro con vidrio discreto al 90 % de opacidad.
Se reutiliza el desenfoque nativo ya existente en el material de vidrio;
los gráficos usan Cairo y las imágenes, los iconos de GNOME y el tema instalado.
Las estadísticas usan tarjetas translúcidas con cifra principal, unidad o contexto
secundario y color por métrica. No se añaden procesos web ni dependencias de red.
El material sólido y alto contraste mantienen fondos opacos.

Bun administra comprobaciones, construcción e instalación. Cambiar los imports
`node:` no reduce el coste del compositor: las extensiones usan GJS. El muestreo
sigue detenido al cerrar las estadísticas; el desenfoque del lateral se desactiva
cuando está cerrado. Los datos y preferencias personales permanecen fuera del repo.

El desenfoque superior se activa únicamente al terminar la apertura, con ancho
y alto válidos. Se desactiva durante transiciones y al cerrar para evitar texturas
de tamaño cero y reducir el coste de las animaciones.


## Contraste, herramientas y desplazamiento

Las estadísticas definen su propio color de texto claro, incluidos botones, títulos,
cifras y valores. No heredan el texto oscuro del tema claro de Shell. Los títulos
usan 18 px, la cifra de detalle 32 px y la información secundaria 11–12 px; los
colores de los gráficos identifican la métrica, no sustituyen las etiquetas.
La prueba aislada carga un tema con texto oscuro y verifica los colores calculados.

En la isla superior, **Más → Herramientas** organiza los accesos en Organizar,
Tu día, Multimedia y Sistema. Cada herramienta tiene icono, nombre y propósito.
La búsqueda admite palabras sin acentos y coincide también con las descripciones.
Las tarjetas enfocadas mediante teclado se desplazan hasta quedar visibles.

Las islas, las vistas de estadísticas y carpetas, el Centro de Control y los
paneles de widgets usan `St.PolicyType.EXTERNAL`: oculta las barras sin quitar
el desplazamiento. `shared/scroll-view.js` utiliza las transiciones nativas de
`St.Adjustment` para la rueda, permite invertir la dirección durante el movimiento
y conserva la respuesta nativa del panel táctil. No instala un motor web ni un
bucle permanente. Respeta «Reducir animaciones» de GNOME y detiene las transiciones
al ocultar la vista. Los cambios entre detalles de estadísticas usan un fundido
corto; las cifras que se actualizan no saltan ni se animan continuamente.

Referencias de la implementación nativa:
[St.ScrollView](https://gnome.pages.gitlab.gnome.org/gnome-shell/st/class.ScrollView.html)
y [código de desplazamiento de GNOME 50](https://github.com/GNOME/gnome-shell/blob/50.0/src/st/st-scroll-view.c).

Para una instalación que conserva la preferencia de vidrio anterior, aplicar:

```bash
schema="$HOME/.local/share/gnome-shell/extensions/dynamic-island-gnome50@local/schemas"
gsettings --schemadir "$schema" set org.gnome.shell.extensions.dynamic-island theme dark
gsettings --schemadir "$schema" set org.gnome.shell.extensions.dynamic-island opacity 1.0
```

La preferencia cambia en la sesión actual; el código nuevo instalado se carga en
el próximo inicio de sesión. El tema de vidrio sigue siendo una elección explícita
en Ajustes, nunca el valor predeterminado. En modo oscuro la opacidad siempre es
completa, aunque una instalación conserve una opacidad antigua.

## Tarjetas de la referencia de SideDock

La revisión detallada del segundo video, incluidas las funciones pendientes, está
en [el análisis por intervalos](../tasks/video-2057.md).

En **Más → Herramientas** se añaden:

- **Organizar → Descargas**: hasta doce archivos, ordenados por modificación.
  Abre el original o usa `+` para añadir su ruta al estante; nunca copia el archivo.
  No incluye subcarpetas, archivos ocultos, enlaces simbólicos ni temporales de
  descarga. Examina como máximo 1000 entradas y lo indica si alcanza ese límite.
  Solo observa la carpeta mientras la vista está abierta; no determina que una
  descarga haya terminado por el mero hecho de ver un archivo.
- **Tu día → Relojes del mundo**: hasta cuatro zonas IANA. Se editan en las
  preferencias de la extensión; cada tarjeta muestra ciudad, hora y fecha local,
  incluidas diferencias de día y horario de verano. Actualización cada 30 s solo
  con la vista abierta. Valores predeterminados: Lima, Londres y Tokio.
- **Sistema → Pantallas y discos**: muestra los monitores de GNOME, tamaño lógico
  y escala, acceso a configuración, unidades montadas y espacio disponible de las
  unidades locales. Las ubicaciones de red se pueden abrir sin sondear su capacidad.
- **Sistema → Controles rápidos**: concentración, preferencia clara/oscura,
  mantener despierto durante 30 minutos y silenciar/reactivar el micrófono por
  defecto. Cambiar de micrófono actualiza el control. Sin hardware disponible se
  muestra ese estado y se desactiva el botón. El cambio de tema usa la preferencia
  de GNOME; una aplicación con tema propio puede no seguirla. La isla sigue negra.

Los accesos de Inicio llevan a Descargas, Controles y Asistentes; las tarjetas y
los dos accesos de navegación siguen siendo configurables. Capturas y grabación
usan las herramientas nativas y conservan el historial de capturas de la sesión.

Las estadísticas separan descarga (verde) y subida (azul) en la misma escala.
La cifra grande corresponde a descarga y el texto inferior a subida. CPU muestra
hilos lógicos y máximo observado en los últimos dos minutos; no implica un máximo
histórico permanente. La temperatura de batería solo aparece si UPower entrega
un valor válido. El botón de fijar usa un icono de chincheta con estado seleccionado.

No se añaden procesos web ni nuevos servicios en segundo plano. Las lecturas de
Descargas y discos son asíncronas y cancelables. Al cerrar o cambiar de sección se
retiran monitores, señales y temporizadores del contexto anterior.
