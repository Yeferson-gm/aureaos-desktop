# Evaluación del Dock Aurea 27

Fecha: 2026-11-12. Evaluación de fuentes, configuración real y compositor aislado.
No se modificó código, preferencias ni instalación del escritorio.

## Conclusión

Conservar el Dock actual y mejorar su accesibilidad, interacción, material y
verificación. No se justifica reemplazar la ampliación: ya usa una lente continua,
transformaciones de actores y un bucle que se detiene al asentarse.

No se asigna una puntuación de fluidez: no se midieron tiempos de fotograma en la
pantalla física. Las capturas de la prueba usan GNOME y sus iconos predeterminados;
no representan exactamente el tema ni el vídeo del escritorio habitual.

## Configuración comprobada

Iconos de 48 px, ampliación máxima 1,75, respuesta exponencial de 70 ms,
vidrio activo con desenfoque 34, animación de ocultamiento de 200 ms,
espera al mostrar de 100 ms y al ocultar de 200 ms.
Clic para minimizar, ocultamiento inteligente ante ventanas maximizadas,
un punto por aplicación, insignias, papelera y lanzador ya habilitados.
Un monitor seleccionado, eDP-1; múltiples monitores deshabilitados.
Estos valores describen la configuración, no errores por sí mismos.

## Hallazgos y propuestas

| Prioridad | Estado comprobado o riesgo | Mejora | Tipo y evidencia |
|---|---|---|---|
| Alta | La ampliación manual solo consulta `magnify-icons`, no el movimiento reducido del sistema. | Respetar la preferencia global, detener el bucle y restaurar transformaciones al cambiarla. | Código: `extensions/dock/custom-effects/magnification.js:65`. |
| Alta | El rebote encadena saltos de 240 ms de subida y 240 ms de bajada; puede continuar hasta 12 segundos. | Limitar el lanzamiento a una señal breve que termine al aparecer la ventana. Separar urgencia persistente de apertura. No depender únicamente del rebote para comunicar estado. | Código: `extensions/dock/appIcons.js:284`. |
| Alta | Solo se transforma el actor visual; la prueba aislada mueve el puntero interno del controlador, sin hacer clic sobre los iconos desplazados. | Probar selección real en centro, extremos y bordes ampliados; corregir la zona de interacción solo si se reproduce desajuste. | Riesgo pendiente, no fallo demostrado: `custom-effects/actor-selection.js`, `tests/smoke-eval.js`. |
| Alta | No hay matriz de pruebas del Dock para escalas mixtas y dos monitores. El recorte se libera cuando termina de mostrarse. | Verificar límites de pantalla, cambio de monitor, desconexión, bordes compartidos y ocultamiento sin fugas. | Validación: `custom-effects/overflow-policy.js`; la prueba actual crea un monitor 1280×800. |
| Media | El vidrio cambia restricciones de posición y tamaño durante cada cuadro de ampliación. | Medir coste con vídeo activo y muchos iconos. Si produce trabajo excesivo de distribución, sustituirlo por transformación/recorte conservando las esquinas. | Riesgo de rendimiento, sin medición de pérdida de cuadros: `custom-effects/shelf.js:60`. |
| Media | La capa de vidrio es rectangular e inset; no tiene una máscara con las esquinas del estante. | Comparar sobre fondos de alto contraste y unificar el recorte con la silueta del contenedor. Mantener alternativa sin desenfoque. | Código/diseño: `custom-effects/shelf.js:70`. |
| Media | El material fija radio 22 px, borde blanco 0,36 y sombra negra 0,32; las etiquetas tienen otro estilo fijo. | Unificar material, borde, sombra y etiquetas con tokens de Aurea; variantes clara, oscura y alto contraste. | Código: `extensions/dock/stylesheet.css:1596`. |
| Media | El menú se ve legible en la prueba, pero depende del tema de Shell para material y color heredado; no usa el sistema de superficies del topbar. | Integrar la apariencia de los menús con Aurea, manteniendo contraste por tarjeta, foco y selección por fila. | Diseño/código: `stylesheet.css:1658` en adelante. No se reprodujo el antiguo borde negro. |
| Media | `glass-shelf`, `glass-blur`, `launch-bounce` y `single-running-dot` existen en esquema, sin controles correspondientes en prefs/Settings.ui. | Exponer estas opciones en preferencias, con vista previa y restauración solo del grupo modificado. | UI de configuración: `schemas/org.gnome.shell.extensions.dash-to-dock.gschema.xml:658`. |
| Media | La ampliación actual convierte 48 px en hasta 84 px. La respuesta de 70 ms es una constante exponencial, no la duración completa. | Comparar el valor actual con 1,55–1,65 de ampliación; seleccionar por prueba visual sin imponer un cambio. Renombrar la respuesta para evitar confusión. | Configuración y etiqueta; propuesta estética, no especificación de Apple. |
| Media | El desenfoque y el fondo animado pueden sumar coste gráfico. | Medir reposo, barrido continuo, lanzamiento y ocultamiento con vídeo; registrar CPU/GPU y tiempos de fotograma antes de optimizar. | Instrumentación, sin atribuir consumo no medido al Dock. |
| Baja | Iconos de terceros pueden tener rellenos y márgenes internos diferentes. | Auditar recursos del tema, usar SVG o tamaños suficientes y normalizar espacio óptico sin añadir un fondo a todos. | Recursos del tema; requiere capturas reales, no demostrado por la sesión con iconos predeterminados. |
| Baja | Puntos e insignias ya siguen los iconos y tienen pruebas. | Conservar esa solución; ampliar casos de contraste, contadores largos, progreso y lanzamiento simultáneo. | Validación: `appIconIndicators.js`, `tests/indicator-follow-test.mjs`, `tests/badge-follow-test.mjs`. |
| Baja | Ocultamiento y minimizar por clic ya están configurados. | Conservarlos y probar ventanas múltiples, menús abiertos, arrastre, maximizado y pantalla completa antes de retocar tiempos. | Validación/configuración: `docking.js:914`. |
| Opcional | Papelera, favoritos y aplicaciones abiertas ya existen. | Considerar acceso a Descargas con lista compacta y acciones de archivo, sin duplicar el centro de aplicaciones ni la isla lateral. | Función nueva, separada de la corrección del movimiento. |

## Orden de trabajo propuesto

1. Probar clics y arrastre reales; movimiento reducido y rebote acotado.
2. Límites por monitor, escalas y aparición/ocultamiento con ventanas reales.
3. Material unificado y preferencias completas, conservando valores personales.
4. Perfil de rendimiento con fondo animado; optimizar donde haya medición.
5. Funciones opcionales, después de estabilizar la interacción.

## Pruebas ejecutadas

- `node extensions/dock/tests/magnification-test.js`: correcto.
- `node extensions/dock/tests/indicator-follow-test.mjs`: correcto.
- `node extensions/dock/tests/badge-follow-test.mjs`: correcto.
- `node --test extensions/dock/tests/glass-style-test.mjs`: correcto.
- `bash extensions/dock/tests/smoke-magnification.sh`: correcto; seis elementos,
  crecimiento anclado abajo, vuelta a origen, seguimiento de insignia y menú.
- Capturas revisadas en `/tmp/dock-magnification-6QO8hLXN/`: `dock.png`, `menu.png`.

La prueba aislada no valida FPS físicos, todos los temas, escalas mixtas,
arrastre ni la precisión del clic durante la ampliación. El aviso de modo de
pruebas pertenece únicamente al compositor privado del driver.

## Referencias oficiales y límites

- [Apple: ajustes de Escritorio y Dock](https://support.apple.com/guide/mac-help/change-desktop-dock-settings-mchlp1119/mac): tamaño, ampliación, posición, ocultamiento, indicadores y animación de apertura.
- [Apple: movimiento](https://developer.apple.com/design/human-interface-guidelines/motion): movimiento con propósito, breve, opcional y cancelable.
- [Apple: accesibilidad](https://developer.apple.com/design/human-interface-guidelines/accessibility): adaptación a preferencias y reducción de movimiento.

Apple no publica en estas páginas los parámetros exactos de su lente, curvas,
sombras o desenfoque. Los valores propuestos son decisiones para Aurea, no una
réplica certificada. Se conserva la preferencia del usuario de minimizar por clic,
sin presentarla como una equivalencia exacta con el comportamiento de macOS.

Dictamen de movimiento: pendiente de aprobación para una nueva entrega pulida.
La base puede conservarse; antes de ampliar efectos hay que resolver movimiento
reducido, duración del rebote y validación de interacción. No es motivo para
retirar la instalación actual ni reiniciar la sesión durante esta evaluación.
