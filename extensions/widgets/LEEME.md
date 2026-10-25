# Widgets del escritorio

Instalador autocontenido: `instalar-macos27-widgets.sh`.
UUID: `lintel-widgets@local`. GNOME Shell 50/51.

Instalado y preparado para activarse al volver a iniciar sesión. Abre el icono
de cuadrícula de la barra superior o usa Super+Alt+E. Al inicio aparecen reloj,
clima (Lima), calendario y baterías; los otros se añaden desde el menú.
Los estilos vidrio/sólido se conservan independientes por widget.

Correcciones realizadas antes de instalar:
- Liberar temporizadores y callbacks también cuando el padre destruye un widget
  durante su animación de salida. Evita accesos a actores eliminados.
- Margen CSS efectivo en la capa de desenfoque para respetar las esquinas.
- Limpiar el identificador idle al desactivar.
- Validación estricta del esquema y activación persistente para el siguiente login.

Pruebas aisladas en GNOME 50.6: construcción de los 13 tipos, ajustes, galería,
edición, cálculo de arrastre/redimensionado y desactivar/activar. Prueba adicional
con el vídeo real y un actor de escritorio simulado para verificar el orden.
No se modificaron GTK4 DING, topbar, dock ni la extensión del vídeo.
La interacción real con DING debe comprobarse después de iniciar sesión.

No se ha comprobado cada feed RSS, importación personal o dispositivo externo.
KDE Connect no está instalado; Buscar necesita esa dependencia para dispositivos.
La ubicación está desactivada por defecto. El tiempo de uso se registra localmente
por defecto y puede desactivarse en ajustes. No se importaron contactos ni archivos.

Fuentes editables: `source/`. Tras modificarlas:
`node tools/package.mjs pack`, después `bash instalar-macos27-widgets.sh --verificar`.
Prueba de runtime: `bash tools/test-shell.sh` (sesión aislada, no la sesión real).
El adjunto original no se modificó.

Para desactivar: `gnome-extensions disable lintel-widgets@local`.
Los datos de usuario se conservan en `~/.config/lintel-widgets/`.
