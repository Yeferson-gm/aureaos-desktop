# Escritorio, isla y Bluetooth — 25/10/2026

## Cambios aplicados

- GTK4 DING: `keep-arranged=false` permite colocación manual conservando la
  cuadrícula. El lector de arrastre lee el MIME que realmente ofrece DragManager
  y lo convierte a Gdk.FileList para conservar el contrato de los destinos.
- Isla superior: libera la captura modal antes de limpiar servicios; el cierre
  tolera errores de limpieza y recupera capturas residuales. Escape se procesa
  también en la captura. Si falla la apertura, intenta cerrar sin bloquear entrada.
- Topbar: el interruptor transmite `notify::state`, sin reenviar las actualizaciones
  del sistema. La alimentación se confirma consultando BlueZ; los errores se
  notifican. Respuestas antiguas no reemplazan estados nuevos. Mientras el menú
  está abierto se consulta además cada dos segundos; el centro de control muestra
  nombres de dispositivos emparejados conectados.

No se cambiaron diseños. No se desconectaron dispositivos reales como prueba.
Se reprodujeron fallos con pruebas de regresión del interruptor, cierre con excepción,
respuestas fuera de orden y formatos de arrastre. La reproducción exacta del bloqueo
intermitente original no está confirmada; sí se corrigió una ruta capaz de retener
la captura de entrada y se verificó en GNOME aislado.

Reiniciar sesión carga los módulos nuevos de Shell y DING. El instalador del topbar
contiene el cambio; el instalador de la isla usa el archivo extension.js del proyecto.
Una actualización externa de GTK4 DING podría sobrescribir su corrección local.

Respaldo: `/home/yefersongm/Respaldos-GNOME/entrada-bluetooth-oCxtm27u/`.
Incluye topbar.js, island.js y contentReader.js anteriores. La ordenación automática
anterior era `keep-arranged=true`.
