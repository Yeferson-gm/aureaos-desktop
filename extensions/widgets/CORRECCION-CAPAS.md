# Corrección de capas — 2026-10-25

El controlador esperaba un idle de prioridad baja tras `restacked` y
`window-created`. Ese callback no garantiza que la capa se corrija antes de
dibujar las animaciones de ventanas. Se reemplaza por un único callback del
compositor `BEFORE_REDRAW`, cancelado al desactivar la extensión. Además, la
búsqueda del escritorio se detiene ante la primera ventana normal para no
seguir un escritorio elevado temporalmente por encima de aplicaciones.

No cambian estilos, posiciones guardadas, vídeo, desenfoque ni animaciones.
El modo de edición conserva su capa interactiva explícita.

## Verificación

- `node tools/test-stacking.mjs`: reproduce el fallo con el código previo;
  después verifica 100 peticiones agrupadas antes de pintar.
- `bash tools/test-shell.sh`: GNOME Shell 50 aislado con vídeo, actores de
  escritorio/aplicación simulados, reordenamiento antes de pintar, galería,
  movimiento y tamaño, construcción de 13 widgets y disable/enable: PASS.
- Sintaxis JavaScript y bash del instalador: PASS.

La prueba usa actores simulados para la transición: queda por confirmar el
gesto exacto con aplicaciones reales en la sesión del usuario tras volver a
iniciar sesión. No se fuerza el reinicio ni se pierde trabajo abierto.

## Rendimiento

Se revisaron temporizadores de widgets, muestreo de la isla y reproducción
del vídeo. No se aplica una reducción de calidad ni se afirma una bajada de
CPU: no se demostró una optimización adicional que preserve el resultado
visual. Brave y su configuración no se modifican.

Respaldo previo: `/home/yefersongm/Respaldos-GNOME/widgets-capas-tdJOi9mQ/`.
El instalador autocontenido también incorpora la corrección.
