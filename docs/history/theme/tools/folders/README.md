# Carpetas cian para WhiteSur

Una sola base vectorial de carpeta inspirada en la referencia proporcionada: cian brillante, silueta redondeada, abertura clara y sin sombra. El original editable está en `folder.svg`. `folder-symbolic.svg` conserva la misma silueta, sin color fijo: GTK recolorea estos símbolos en botones y barras para mantener contraste.

## Aplicar y comprobar

```sh
node install.mjs --apply
node install.mjs --check
gjs test-icons.js 4.0 /home/yefersongm/.local/share/icons
gjs test-icons.js 3.0 /home/yefersongm/.local/share/icons
```

El instalador modifica los temas WhiteSur existentes; no crea otro tema ni cambia el diseño de ventanas. Sustituye las variantes de carpetas de Places por enlaces relativos a un recurso común. Conserva sus nombres (incluidos los colores antiguos) para no romper aplicaciones que los solicitan, pero todos resuelven al mismo dibujo cian. También unifica los símbolos de directorios. Las variantes clara/oscura y el resto de iconos de aplicaciones siguen disponibles porque no son copias desechables.

Las pruebas comprueban la resolución GTK 3/4 de carpetas genéricas, especiales y variantes de color, en tres temas, cinco tamaños y escalas 1x/2x. `ICON_TEST_ROOT` permite aplicar primero en una copia temporal. `render.js` permite previsualizar el SVG con librsvg.

## Alcance

Se aplica a escritorio GTK4 DING, Archivos y aplicaciones que consultan el tema de iconos. Flatpak ya tiene acceso a estos temas mediante `/run/host/user-share/icons`; no requiere permisos adicionales. Una aplicación que incluye sus propios gráficos, un icono personalizado asignado a un archivo o un botón funcional (crear, sincronizar, cifrar…) puede usar otro recurso. No se reemplazan iconos de acciones de seguridad ni gráficos internos de aplicaciones.

Si una ventana ya abierta conserva un icono antiguo, ciérrala y vuelve a abrirla; cerrar/iniciar sesión vacía también las cachés en memoria. Reinstalar WhiteSur desde su instalador original sobrescribe esta personalización; en ese caso vuelve a ejecutar `install.mjs --apply`.

Los dos SVG son fuentes de desarrollo, no variantes seleccionables de color. Las copias de seguridad antiguas de las extensiones fueron retiradas por petición expresa del usuario; este proyecto no genera copias permanentes adicionales.
