# Reproductor de la isla

Referencias: grabaciones del 18 de noviembre de 2026, 14:48:52 (29,435 s) y
14:49:32 (8,869 s). Revisadas mediante fotogramas a intervalos de tres y un
segundo, respectivamente. Muestran portada, progreso, anterior/pausa/siguiente,
aleatorio, estrella y volumen; el estado activo cambia de color. Los vídeos y
sus fotogramas permanecen fuera del repositorio.

## Adaptación

La isla conserva su superficie negra, controles principales blancos, modos
activos rosa y estrella dorada. Portada y metadatos preceden al progreso; el
transporte ocupa una fila completa. Favoritas y Más separan la biblioteca local
de las acciones secundarias sin llenar la vista inicial de botones.

- Estrella: favoritos propios de Aurea, deduplicados y persistentes, máximo 200.
- Aleatorio y repetición desactivada/lista/canción: propiedades MPRIS reales.
- Anterior, pausa/reanudación, siguiente, detener y abrir el reproductor.
- Saltos de 15 segundos, posición con ratón/teclado y velocidad admitida por la app.
- Silencio de salida, volumen, selección de salida y mezclador por aplicaciones.
- Copiar enlace o título/artista, abrir favorita y quitarla desde la lista.
- Letras opt-in y portada ampliada conservadas.

No se añaden servicios de terceros, dependencias de navegador ni nuevos procesos.
St, Clutter, Gvc y los iconos simbólicos del sistema proporcionan los controles
nativos; Bun ejecuta la comprobación del modelo. Las acciones D-Bus tienen timeout,
cancelación al desactivar, guardas por reproductor y pista, y errores visibles.
No hay sondeo nuevo para favoritos, modos o velocidad. Se conserva la lectura de
posición mientras la vista musical está abierta y la pista se reproduce.

## Contratos y límites

[MPRIS Player](https://specifications.freedesktop.org/mpris/latest/Player_Interface.html)
expone reproducción, capacidades, Shuffle, LoopStatus y Rate. No define una acción
universal para añadir a la biblioteca de Spotify, Apple Music u otras apps.
La estrella se presenta como «Favoritas de Aurea», sin aparentar sincronización.
Las apps pueden rechazar modos aun exponiendo propiedades; se muestra el fallo.
No se simulan cola, ecualizador o capacidades que el reproductor no publica.

Los favoritos se escriben de forma atómica y privada en el directorio de datos
del usuario, nunca dentro del repo. No se guardan portadas ni audio. Si no hay URL,
abrir una favorita copia su nombre e informa del límite. Los enlaces admitidos
son HTTP(S), file y Spotify; se abren solo por una acción del usuario.

La búsqueda usa SetPosition con identificador de pista cuando existe; se limita
al intervalo válido y descarta un arrastre iniciado en otra canción. Seek es la
alternativa para reproductores que omiten el identificador. Los controles de
capacidad ausente se desactivan y las respuestas antiguas no actualizan otra pista.

## Verificación

`music-model.mjs` comprueba identidad estable, duplicados, límite, datos dañados,
esquemas de enlace y velocidades. `music-runtime.js` usa el servicio MPRIS aislado
para verificar estrella/persistencia, tres modos de repetición, aleatorio,
velocidad, SetPosition, errores, capacidades, acceso al reproductor y geometría.
Se ejecuta desde la suite completa y también de forma focalizada:

```bash
bun extensions/dynamic-island/tests/music-model.mjs
DI_TEST_MUSIC=1 bash extensions/dynamic-island/tests/smoke-shell.sh
./aurea.sh check
```

El driver solo permite control de Shell dentro de la sesión aislada. Nunca se
activa Eval inseguro en el escritorio habitual.

### Resultado de la entrega

- GNOME 51.1: suite completa con dos monitores; prueba musical focalizada después
  de los últimos ajustes de volumen y capacidades. Capturas revisadas: vista
  compacta y Más, sin desborde ni espacio vacío residual.
- GNOME 50.6: suite completa con el mismo reproductor D-Bus de prueba, incluidas
  preferencias, cien interrupciones, persistencia y desactivación sin captura modal.
- Comprobación general: 419 archivos de código, 25 288 enlaces, 33 grupos de
  pruebas y esquemas/CSS. No equivale a certificar cada reproductor externo.

Al cerrar Más se invalida la medida anterior del contenido antes de calcular la
altura. La regresión verifica el espacio inferior, además del ancho de los botones.

## Corrección de opciones y modos de reproducción

La captura posterior a la entrega mostró botones pequeños, sin agrupación clara,
y una ambigüedad real entre controles no admitidos y controles defectuosos. El
panel ahora tiene tres pestañas: Reproducción, Sonido y Canción. Las filas muestran
icono y nombre a la izquierda, valor a la derecha. Repetir abre una selección
explícita; los saltos usan nombres completos. El selector de salida enumera los
dispositivos por nombre. Los controles deshabilitados conservan texto legible.

### Causa comprobada en BStream Music

Se consultó el servicio real de BStream Music 1.2.9: GetAll e Introspect no
publican Shuffle, CanRaise es false y MinimumRate/MaximumRate valen 1. La llamada
Set LoopStatus=Track devuelve éxito, pero Get LoopStatus devuelve None. No era
un fallo de animación: el reproductor omite o ignora esas órdenes. Su última
[entrega estable publicada](https://github.com/BryamContreras/BStream-Music/releases/tag/v1.2.9)
coincide con la instalada. No se sustituyó por una compilación de desarrollo.

Se conserva el valor confirmado por la aplicación. Cada escritura de modo impide
órdenes concurrentes para esa propiedad, muestra Aplicando y vuelve a leer el valor.
Si aún difiere, hace una única comprobación adicional a los 450 ms. No añade sondeo
permanente. Error, desconexión y respuesta ignorada liberan el estado pendiente;
las respuestas de un reproductor anterior se descartan mediante una generación.

Los modos no admitidos se muestran como «En la app», explican el motivo al pulsar
y permiten abrir el reproductor desde Canción. El lanzador oficial de BStream
sirve de alternativa a Raise; no se usa inyección de teclado ni ejecución en una
shell. Esto no habilita una función que BStream no expone y no se anuncia como tal.

### Regresión

El reproductor de prueba también simula una escritura aceptada pero ignorada.
Se comprueba que no cambien los indicadores a un estado falso, que aparezca una
explicación y que no quede una operación pendiente. Se prueban rechazo D-Bus,
Shuffle ausente, estados de las tres pestañas, límites geométricos y selección de
Canción mediante un puntero virtual, además de los controles ya existentes.

Validación de esta corrección: GNOME 50.6 pasó la prueba musical focalizada con
selección mediante puntero y preferencias GTK4. GNOME 51.1 pasó la suite completa
con dos monitores, cien interrupciones y liberación de recursos al desactivar.
La comprobación general validó 420 archivos de código, 25 288 enlaces y 33 grupos
de pruebas. Se revisaron capturas de cada pestaña y del estado compacto.
