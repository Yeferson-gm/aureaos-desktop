# Editor visual de la isla

Referencia: grabación aportada el 18 de noviembre de 2026, de 13,746 segundos,
1256 × 884, sin audio. Revisada a cuatro fotogramas por segundo, con ampliaciones
de la galería, el destino del arrastre y la reordenación. El video no se incorpora
al repositorio.

## Evidencia y adaptación

| Intervalo | Referencia | Implementación Aurea |
|---|---|---|
| 0–3 s | Isla negra cerrada y entrada a editar | Inicio → Editar; también Más → Personalizar este espacio. |
| 3–5 s | Galería debajo de la isla y distintivo En uso | Editor con vista previa negra, galería de módulos y estado de uso. |
| 5–7 s | Añadir tareas mediante arrastre | Soltar sobre una tarjeta la coloca antes; en el fondo de Inicio, al final. |
| 8–10 s | Mover música entre las tarjetas | Arrastre con copia visual y destino resaltado; no destruye el origen durante el gesto. |
| 11–13 s | Salir de edición | Listo guarda; Cancelar y Escape descartan el borrador. |

Los colores se aplican con una jerarquía común: texto principal blanco, secundario
gris claro, música violeta/rosa, clima azul, calendario rojizo, tareas/temporizador
ámbar y sistema verde. Los valores existentes de fecha, clima y batería se muestran
con mayor tamaño. El fondo superior sigue negro. La galería usa una superficie
oscura translúcida, contornos finos y selección azul. No se copian recursos del video.

## Interacción y límites

- Hasta seis tarjetas únicas, organizadas en dos filas en Inicio. Las configuraciones
  anteriores se conservan; no se altera el UUID ni el formato `home-modules`.
- Arrastrar a la galería o a Quitar retira el acceso, nunca sus datos.
- Deshacer conserva hasta veinte operaciones durante la edición; Restaurar también
  se puede deshacer. Cancelar no escribe preferencias.
- Clic en una tarjeta disponible la añade. Alt+Izquierda/Derecha mueve una tarjeta
  enfocada; Suprimir la retira. La galería se desplaza sin barras visibles.
- DND nativo de GNOME, desplazamiento al aproximar el arrastre al borde y transición
  de apertura que respeta movimiento reducido. El temporizador de desplazamiento
  solo existe durante el arrastre y se retira al finalizar/cancelar.
- Cambiar monitores, entrar al bloqueo, abrir Actividades o desactivar la extensión
  cancela la edición. La captura del puntero y teclado se libera al terminar.

Las miniaturas representan módulos reales de Aurea; clic en Inicio abre su vista
completa. El editor no ejecuta cámaras, micrófonos ni asistentes. No se muestran
porcentajes de cuotas de IA sin proveedor, ni se añade un servicio nuevo por aparecer
en una miniatura. Notas y tareas continúan agrupadas en su módulo existente.

## Comprobación

`workspace-model.mjs` valida deduplicación, límite y orden. El smoke test de Shell
incluye `workspace-editor-runtime.js`: puntero virtual para añadir, reordenar y
quitar; deshacer; borrador sin escritura prematura; persistencia; teclado; cierre
durante arrastre; cambio de monitores y ausencia de captura residual. Genera la
captura `workspace-editor.png` fuera del repositorio.
