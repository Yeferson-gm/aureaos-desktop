# Vídeo detrás del centro de aplicaciones — 24/10/2026

Causa: WhiteSur dibuja un fondo opaco en `overviewGroup`. El reproductor solo
creaba clones en la capa del escritorio, debajo de esa vista.

Corrección en la extensión instalada `gnome-wallpaper-engine@gjs.com`, módulo
`modules/wallpaper50.js`: capa no interactiva al comienzo de overviewGroup, clones
del mismo vídeo por monitor, velo oscuro ligero y destrucción junto al renderer.
No hay otro proceso mpv. No se modifica el tema ni la cuadrícula.

Prueba: `bash test-overview.sh`. Usa bus, configuración y Shell aislados; comprueba
orden, entrada, visibilidad y parada/reinicio. Se confirmó el fallo antes del cambio
y el éxito después. Las capturas de la cuadrícula mostraron fotogramas distintos.
No equivale a una medición de FPS de la sesión real ni prueba de múltiples monitores.

Respaldo anterior:
`/home/yefersongm/Respaldos-GNOME/video-aplicaciones-vuw5Ofcq/wallpaper50.js`.
Para revertir, copiar ese archivo al módulo instalado y volver a iniciar sesión.
Una actualización externa de Gnome Live Wallpaper podría reemplazar el cambio.

El código nuevo se cargará al cerrar sesión y volver a entrar; no se fuerza el cierre.
