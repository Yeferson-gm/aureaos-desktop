# Isla dinámica · v24

v24: reducción total de 20 px respecto a v22: 280 px en reposo y 300 px con música (5 px menos que v23). Se reducen también los márgenes del aviso. Altura, curvas, área de texto musical y tarjeta expandida conservadas. Comprobación mediante ancho real de los actores en la sesión de prueba.

v23: notch 15 px más estrecho (285 px en reposo, 305 px con música), sin cambiar altura, curvas ni panel expandido. Los avisos se animan exclusivamente en la isla mientras está habilitada: se intercepta la presentación de banners de GNOME, incluidos los críticos, no la entrega ni el historial. No se modifican las preferencias globales y se respeta «No molestar». Al desactivar la extensión se restaura la presentación nativa. Las notificaciones de la pantalla de bloqueo conservan su política del sistema.

Validación: `node tests/native-banners.mjs` y `bash tests/smoke-shell.sh`. La sesión aislada prueba avisos normales/críticos, conservación sin marcar como leídos, No molestar, restauración al desactivar, eliminación de un banner anterior al reactivar y los dos anchos reales. El runner espera el resultado asíncrono y devuelve error si falla una comprobación.

Corrección visual v22: notch de 300 px en reposo y 320 px con música, altura conservada. Curvas de unión y esquinas de 8 px en la isla superior; la isla lateral v8 usa los mismos radios. Se mantienen la unión al borde y la ausencia de portada en la vista cerrada.

Corrección visual v21: restaurada la unión al borde superior con hombros cóncavos (gota), tanto cerrada como expandida. Se elimina la portada de la vista cerrada, conservando su ancho musical de 258 px; la portada sigue disponible dentro del reproductor abierto. Sin cambios en las demás funciones.

Ampliación incremental de la extensión existente `dynamic-island-gnome50@local`, para Fedora 44 / GNOME Shell 50.6. No sustituye ni modifica la barra superior, el dock o las pilas del escritorio.

## Alcance de esta entrega

Se conservan música, archivos, portapapeles, notas, sistema, reloj, agenda, cámara y notificaciones. Se incorporan Inicio, Herramientas y preferencias nativas. La cola de actividades prioriza eventos, agrupa duplicados y caduca avisos; la navegación admite teclado y movimiento reducido. Incluye tareas, temporizadores persistentes, Pomodoro, calendario mensual/semanal, selección MPRIS, colores de portada, controles de audio y conectividad disponibles, métricas y operaciones de archivos aisladas.

El catálogo solicitado NO está terminado: consultar [PROGRESO.md](PROGRESO.md), con las 110 funciones y sus límites. Entre los pendientes están letras sincronizadas, espectro de audio real, arrastre entre aplicaciones Wayland, respuestas a notificaciones y proveedores externos. Los controles dependientes del hardware necesitan comprobación física; la prueba aislada no cambia el brillo ni la salida de audio de la sesión principal.

## Instalar y verificar

Desde esta carpeta:

```bash
bash instalar-dynamic-island-v1.sh --verificar
bash tests/smoke-shell.sh
bash instalar-dynamic-island-v1.sh
```

El instalador valida primero y respalda la versión instalada en `~/Respaldos-GNOME/dynamic-island-antes-FECHA-HORA`. Después de instalar, guardar el trabajo, cerrar sesión y volver a entrar en Wayland. No se fuerza el cierre de sesión ni se activa el modo inseguro de la sesión principal. Los archivos de pruebas y su reproductor ficticio NO se instalan.

Preferencias: `gnome-extensions prefs dynamic-island-gnome50@local`. Atajo predeterminado: Super+Mayús+Espacio. Los controles que no ofrece el equipo pueden ocultarse o aparecer no disponibles.

## Evidencia de pruebas

- Sintaxis JavaScript, esquema GSettings y CSS mediante el parser nativo St.
- Cola: prioridades, agrupación, caducidad, límite y resorte.
- ZIP/extracción con rechazo de rutas externas; PNG, OCR, MP3 y MP4 con archivos temporales.
- GNOME Shell Wayland separado, con directorios y bus de sesión propios: once vistas, preferencias, apertura/cierre, límites del monitor, notificaciones, MPRIS de prueba, conversión ZIP, persistencia y desactivación sin temporizadores ni captura modal pendientes.
- Capturas de las vistas en el directorio temporal que imprime la prueba. Esto no reemplaza confirmar la apariencia junto a las demás extensiones en la sesión habitual.

Dependencias auxiliares: Python 3; ImageMagick para PNG, Tesseract para OCR y FFmpeg para audio/vídeo. No se sobrescriben originales: las conversiones producen archivos nuevos. FFmpeg en Fedora puede no incluir libx264; se selecciona un codificador instalado alternativo. No se instalan códecs ni servicios externos automáticamente.

## Diagnóstico y restauración

Se corrigieron accesos a UPower/BlueZ que utilizaban el bus de sesión en lugar del de sistema, el control de brillo incompatible con GNOME 50 y desconexiones de señales sobre notificaciones ya destruidas. Las integraciones OSD solo se interceptan cuando existe el control correspondiente.

Respaldo inicial completo de esta intervención:
`/home/yefersongm/Respaldos-GNOME/isla-premium-20261024-e5b5Zo/`.

Para desactivar temporalmente sin borrar datos:

```bash
gnome-extensions disable dynamic-island-gnome50@local
```

Para volver a la versión inicial, conservar primero la carpeta instalada actual y restaurar el contenido de `instalada/` del respaldo anterior en `~/.local/share/gnome-shell/extensions/dynamic-island-gnome50@local/`; cerrar sesión y volver a entrar. No borrar los datos personales ni el respaldo. El repositorio local también conserva el código original y cada incremento verificado.

## Privacidad

No hay proveedores remotos añadidos. Las vistas previas privadas se ocultan por defecto. El portapapeles respeta la configuración previa; una instalación sin historial comienza privada y sin persistir todo. La cámara y las capturas se activan por acción explícita. No se muestran datos ficticios como si fueran lecturas reales.
