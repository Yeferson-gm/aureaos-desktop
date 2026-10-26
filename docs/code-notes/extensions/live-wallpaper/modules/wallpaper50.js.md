# Notas de extensions/live-wallpaper/modules/wallpaper50.js

Comentarios trasladados durante la consolidación. Los números corresponden al archivo antes del traslado.

## Línea 15

````text
// Mutter skips CPU culling for actors with an active effect. Without this,
````

## Línea 16

````text
// the off-screen source is culled as fully obscured on fractionally scaled
````

## Línea 17

````text
// monitors, so mpv stops receiving frames and the clones freeze.
````

## Línea 69

````text
// Tahoe Widgets comparte la capa de fondo con el video. Cuando el
````

## Línea 70

````text
// reproductor se inicia después, add_child() lo colocaba encima del
````

## Línea 71

````text
// lienzo y ocultaba todos los widgets. Mantener el video justo debajo
````

## Línea 72

````text
// del lienzo conserva el fondo animado sin tapar contenido de escritorio.
````

## Línea 233

````text
// Some windowing backends don't support assigning an empty input region.
````

## Línea 288

````text
// Un renderer anterior puede destruirse después de adjuntar
````

## Línea 289

````text
// el siguiente. Nunca eliminar los clones de otra sesión.
````

## Línea 302

````text
// The overview has its own opaque theme background, above the desktop.
````

## Línea 303

````text
// Share the same video surface: no extra decoder or playback process.
````

## Línea 324

````text
// A light scrim keeps application labels readable without hiding video.
````
