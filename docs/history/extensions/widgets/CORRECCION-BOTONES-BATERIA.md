# Botones de edición y batería — 2026-10-25

- Botones explícitamente reactivos; la barra queda excluida del inicio de
  arrastre mediante el actor bajo las coordenadas del clic. No se depende de
  `event.get_source()`, que resultó no disponible en la prueba de eventos.
- Rayo central en estado UPower 1 (cargando); pila con nivel en los demás
  estados, incluida carga pendiente. No se cambia el diseño del anillo.
- Fuentes instaladas e instalador autocontenido sincronizados.

## Verificación y límites

`test-edit-buttons.mjs` y `test-battery-icon.mjs` fallaron antes y pasan después.
La sesión aislada ejecutó las cuatro acciones y los 13 widgets correctamente.
El comando completo de prueba no quedó verde porque detectó avisos críticos
de foco de Clutter al probar hojas de ajustes. No se ocultan esos avisos.
La inyección de puntero virtual no pudo verificarse: el compositor colocó la
coordenada vertical en cero. Los callbacks se probaron emitiendo `clicked`;
el clic físico debe confirmarse tras volver a iniciar sesión.

Respaldo: `/home/yefersongm/Respaldos-GNOME/widgets-botones-c2Gqj6ym/`.
