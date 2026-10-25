# Fondo de vídeo y dock — 24 de octubre de 2026

## Causas comprobadas y cambios

- `pause-on-fullscreen=true` también incluye ventanas maximizadas. La implementación cierra mpv y destruye las superficies, y lo inicia de nuevo al restaurar. Se configura `false`; no cambia el vídeo elegido ni la pausa por batería (ya desactivada).
- El dock estaba fijo, sin autoocultamiento y con clic para enfocar/previsualizar. `aplicar.sh` activa minimizar (no cerrar), ocultamiento ante ventanas maximizadas y aparición por puntero sin presión adicional. Se conserva la duración de animación existente.
- En `wallpaper50.js`, un callback de destrucción antiguo eliminaba todos los clones antes de comprobar si pertenecían al reproductor actual. Se mueve la comprobación antes de esa limpieza. `test-renderer.mjs` reprodujo el fallo antes y pasó después.

## Validación y límites

Se verifican los valores persistentes y la sintaxis del módulo. `prueba-ventana.js` crea una ventana temporal que maximiza, restaura y minimiza, y se cierra sola; el proceso mpv se observa durante la secuencia. Esto comprueba continuidad del proceso, NO ausencia de cada fotograma perdido o de cada pantallazo del compositor.

mpv utiliza `--vo=gpu --gpu-context=wayland --hwdec=auto`. La opción automática solicita decodificación por hardware, pero por sí sola no demuestra qué decodificador está usando. No se fuerzan controladores ni se alteran las extensiones de efectos de ventanas sin aislar primero el problema.

Los ajustes actúan en la sesión actual. La corrección JavaScript del renderer requiere cerrar sesión y entrar de nuevo para cargar el módulo actualizado. Falta confirmar visualmente si persisten los pantallazos al arrastrar ventanas después de esta recarga; no se consideran todos los fallos gráficos resueltos.

No se modifica el Top Bar.

## Restauración

`bash restaurar-ajustes.sh` recupera los siete valores originales de configuración.

Módulos anteriores respaldados en `/home/yefersongm/Respaldos-GNOME/fondo-dock-tnyItahg/modules/`. Para deshacer exclusivamente la corrección de código, restaurar `wallpaper50.js` de ese respaldo en `/home/yefersongm/.local/share/gnome-shell/extensions/gnome-wallpaper-engine@gjs.com/modules/wallpaper50.js` y volver a iniciar sesión. No hace falta borrar ningún vídeo ni configuración personal.

Una actualización de la extensión del fondo podría sobrescribir la corrección local; conservar la prueba para detectar si el fallo vuelve.
