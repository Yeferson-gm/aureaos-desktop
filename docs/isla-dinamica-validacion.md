# Validación de la nueva isla

Entorno: Fedora 44, GNOME Shell/Mutter 50.6, Wayland. Fecha: 12 de noviembre de 2026.
Las pruebas se ejecutan en un Shell aislado con datos, bus y preferencias propios.
No se reinició ni se habilitó evaluación insegura en la sesión habitual.

## Pruebas funcionales

- Construcción de quince vistas, navegación y apertura de preferencias.
- MPRIS simulado: metadatos, reproducción/pausa, búsqueda de posición y portada.
- Ancho compacto conservado, portada compacta desactivada por defecto.
- Banners nativos suprimidos, historial conservado, No molestar y restauración del
  proveedor original al desactivar.
- Cierre con excepción simulada libera el grab. Activación manual cancela el hover
  pendiente; el panel no abre en overview ni con coordenadas todavía sin asignar.
- Cien aperturas/cierres interrumpidos: sin grab, timeline ni superficie pendiente.
- Selección de dos monitores virtuales (1280×800 o 1920×1080 y 1024×768), límites de la isla y
  recuperación del principal si la pantalla seleccionada no existe. También se
  comprobaron escalas mixtas de 125 %, 150 % y 200 % frente a 100 %.
- Desactivación/reactivación: cero fuentes GLib pendientes, tema y temporizador
  restaurados, sin referencias a actores destruidos.
- Estante GTK abierto en Wayland con OpenGL; contrato FileList múltiple, duplicados,
  proveedor de salida y eliminación del original. Archivo fijado resiste limpiar.
- ZIP mediante proceso auxiliar, entradas inválidas del puente de actividades y
  actualización/fin de tareas persistentes.
- Mascota, lanzador opcional y partículas con retirada al completar/cerrar.
- Letras LRC, índices temporales, enlaces de reuniones y validación de actividades
  cubiertos por pruebas de lógica.
- Instalador por componente: argumentos inválidos, destino aislado, comprobación
  de integridad y conservación del tema y configuración ajenos.

El test comprueba registros, además de su resultado: falla ante `Gjs-CRITICAL`,
`CRITICAL`, `JS ERROR`, `TypeError` o `ReferenceError`. Los avisos de servicios de escritorio
no disponibles en la sesión aislada se distinguen de errores de la extensión.

## CPU y memoria

Procedimiento reproducible: `DI_BENCHMARK=1 bash
extensions/dynamic-island/tests/smoke-shell.sh`. Reproductor MPRIS de prueba activo,
fondo estático, primero cinco segundos con la isla cerrada y después veinte ciclos
completos de apertura/cierre. CPU a partir de `/proc/self/stat`; RSS de
`/proc/self/status`. Se mide el proceso GNOME Shell completo.

| Muestra | Base `92d49f16` | Nueva implementación |
|---|---:|---:|
| Cerrada: CPU de un núcleo | 9,8 % | 5,8 % |
| Veinte ciclos: CPU de un núcleo | 30,7 % | 26,1 % |
| RSS tras periodo cerrado | 311,3 MiB | 305,8 MiB |
| RSS tras veinte ciclos | 308,6 MiB | 294,9 MiB |

Son muestras breves independientes; no constituyen una estimación estadística ni
atribuyen todo el consumo a la extensión. La variación de RSS incluye recolección
de memoria. No se midieron GPU, percentiles de frame time, 120 Hz ni el stack con
vídeo de fondo. No se afirma fluidez perfecta o ausencia universal de errores.

Resultados temporales de referencia: `/tmp/dynamic-island-smoke-2NwtJo` (base),
`/tmp/dynamic-island-smoke-DsWX5l` (nueva), `/tmp/dynamic-island-smoke-zEA7r0`
(prueba funcional de dos pantallas), `/tmp/dynamic-island-smoke-wNrcFU`
(escalas 125/150/200 % y animaciones detenidas bajo el estante). Esas carpetas no forman parte de la entrega.

## Validación adicional necesaria en hardware/interacción real

- Arrastre completo de ida y vuelta desde distintas apps GTK, Qt y Electron; el
  contrato nativo y la ventana están probados, no todas las aplicaciones.
- Reconexión física, monitores con DPI distintos y lectura visual en hardware real;
  las escalas 125/150/200 % se verificaron en pantallas virtuales.
- Precisión del dictado con cada micrófono; proveedor de letras y
  dispositivos reales de compartir/cámara/Bluetooth cuando estén disponibles.
- Percentiles de fotogramas y GPU con el vídeo y las demás extensiones habituales.

Validación final del código: `./aurea.sh check` aprobó 209 archivos de código,
25274 enlaces, 24 entradas de pruebas y los esquemas/CSS. La sesión
`/tmp/dynamic-island-smoke-3s9s3R` aprobó quince vistas, cien interrupciones,
dos pantallas y escalas 125/150/200 %, sin errores críticos en registros.

Estas limitaciones son de cobertura de pruebas o backend, no funciones simuladas.

## Dictado local instalado

Se compiló whisper.cpp desde el commit `d2c6f05a46dacf663e357bcf0ed40f542a72825d`,
CPU con dos hilos al transcribir. Binario de usuario en `~/.local/bin/whisper-cli`,
licencia y procedencia en `~/.local/libexec/aurea-whisper/BUILD.md`. Modelo `base`
multilingüe en `~/.local/share/aurea/models/ggml-base.bin`, SHA-1 coincidente con
el catálogo oficial: `465707469ff3a37a2b9b8d8f89f2f99de7299dac`.
SHA-256 calculado: `60ed5bc3dd14eea856493d334349b405782ddcaf0028d4b5df4088345fba2efe`.

Se transcribieron el audio de ejemplo y una voz sintética española, también con
idioma automático. No se grabó el micrófono personal. La prueba española tuvo una
palabra mal reconocida; el dictado requiere revisar el texto y no promete exactitud
perfecta. No se copian binario ni pesos al repositorio o paquete de la extensión.

## Regresión de activación del botón compacto

El botón compacto es un `St.Button`: su activación nativa emite `clicked`.
Escuchar `button-release-event` dejaba el panel cerrado porque el propio botón
consumía ese evento. Ahora se usa una sola señal de activación para ratón y
teclado, evitando duplicar el manejo nativo de toque/teclas. El botón secundario
conserva la acción de descartar el aviso.

Las pruebas anteriores llamaban directamente a los métodos de apertura; no
verificaban la entrega de entrada del compositor. La regresión se reproduce y
comprueba con dispositivos virtuales de Clutter en el Shell aislado:

```bash
DI_TEST_CLICK=1 bash extensions/dynamic-island/tests/smoke-shell.sh
```

Comprueba un clic para abrir, segundo clic para cerrar, clic derecho para
descartar, Enter/Espacio para abrir y Escape para cerrar sin retener el grab.
Espera a que el puntero virtual alcance el botón antes de emitir el clic; nunca
reintenta un clic fallido. No sustituye la prueba de una pantalla táctil física.
