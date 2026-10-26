# Isla lateral v10

Accesos personales, no otro centro de aplicaciones. Conserva la forma pegada al borde, el vidrio ahumado y la ocultación automática. No modifica el dock inferior, la isla superior ni los widgets.

## Uso

- Acerca el puntero al borde para revelar los cinco accesos compactos.
- Pulsa el tirador vertical del margen interior o haz clic derecho en un icono para abrir el panel. No hay flecha ni fila inferior adicional.
- **Favoritas** muestra únicamente las apps guardadas, agrupadas por las categorías de sus archivos `.desktop`. Pulsa el encabezado para plegar una categoría.
- **En uso** muestra solo las apps abiertas; permite activarlas y añadirlas a favoritas.
- **+** abre la búsqueda para añadir una favorita: exige dos letras, ignora acentos y muestra hasta ocho coincidencias. No despliega el catálogo completo.
- La estrella quita una favorita. El panel admite hasta 24; los primeros cinco accesos guardados aparecen en la barra.
- Clic abre o activa una app. Botón central abre una ventana nueva si la aplicación lo admite.
- Cierra con **×**, **Esc** o un clic fuera. El clic de cierre no activa por accidente la ventana de debajo.

Las favoritas se conservan en `~/.local/share/side-dock/favoritos.json`, con el mismo formato anterior. Las categorías plegadas se recuerdan durante la sesión de la extensión. No se mueve, desinstala ni cierra ninguna app al quitar una favorita.

## Archivos e instalación

La implementación es `extension.js`, `stylesheet.css` y `metadata.json`. UUID: `side-dock-gnome50@local`. GNOME Shell mantiene módulos JavaScript en memoria: después de reemplazar una versión ya cargada, cierra e inicia sesión para usar el código nuevo. No basta con reemplazar el CSS ni se debe habilitar el modo inseguro en la sesión de trabajo.

## Verificación

Desde esta carpeta:

```sh
node --check extension.js
node test-panel.mjs
node test-autohide.mjs
node test-monitor-clip.mjs
bash test-shell.sh
SIDE_TEST_MONITORS=2 bash test-shell.sh
```

`test-shell.sh` crea su propio bus D-Bus, compositor headless y directorios XDG temporales. El driver de evaluación solo habilita el modo inseguro **en esa sesión aislada**, nunca en la sesión de escritorio del usuario. Requiere GNOME Shell con soporte headless y el driver existente en `../macos27-dynamic-island/tests/driver`.

Las pruebas cubren filtrado sin catálogo, categorías, favoritas extra, búsqueda, guardado, tirador sin solapar iconos, pestañas, plegado, cierre, reapertura rápida, cambio de geometría y desactivación/reactivación. Producen capturas en el directorio temporal indicado. Los controles se activan mediante sus señales y manejadores reales; esto no sustituye una prueba manual del ratón en la sesión del usuario.

## Cambios y límites

v10 limita el dibujo y la entrada al monitor principal durante todo el deslizamiento. Sin ese recorte, la parte escondida aparecía en la segunda pantalla. Hay pruebas de límites izquierdos/derechos, orígenes negativos, posición vertical y fotogramas intermedios, además de una sesión headless con dos monitores reales para el compositor. El arreglo no añade sondeos ni modifica las animaciones.

La estructura por tarjetas, el foco visible y la separación de gestos siguen las guías de diseño utilizadas en la revisión. Se eligió una apertura explícita en vez de expandir automáticamente al pasar sobre un icono, para no interferir con el lanzamiento rápido.

Verificado en GNOME Shell 50.6. Las versiones 48/49 anunciadas por la extensión anterior no se han probado aquí. La búsqueda usa únicamente metadatos locales, sin servicios de red ni nuevos procesos periódicos. El código no es un gestor de archivos ni un sustituto del centro de aplicaciones.
