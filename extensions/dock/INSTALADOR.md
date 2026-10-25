# Instalador compartible del dock

`instalar-macos27-dock.sh` contiene la versión actual completa del dock (v6),
incluidos efectos, icono Launchpad, estilos glass, esquemas y traducciones.
No necesita descargar archivos. Conserva los ajustes existentes por defecto.

Para entregarlo a otra persona basta compartir ese archivo. El código está
en bloques `ARCHIVO: ...` legibles y editables; las traducciones `.mo` son base64.

```bash
bash instalar-macos27-dock.sh
bash instalar-macos27-dock.sh --extraer /ruta/nueva/dock
bash instalar-macos27-dock.sh --restaurar-ajustes
```

La última opción aplica los ajustes incluidos en la exportación. Una instalación
nueva también los aplica. No ejecutar con sudo. Las copias anteriores quedan en
`~/.local/state/macos27-dock/backups/` (o XDG_STATE_HOME).

Para regenerar desde estos archivos: `node build-installer.mjs`. El generador
lee las preferencias actuales del dock. Reiniciar sesión carga el código nuevo.

El fondo de vídeo pertenece a **Gnome Live Wallpaper**, no al dock. Su corrección
para la cuadrícula de aplicaciones está instalada por separado en `wallpaper50.js`.
Este instalador no incluye el vídeo ni modifica esa extensión, el topbar o las islas.
