# Isla dinámica: espacio personal y actividades

La implementación amplía la investigación de `investigacion-isla-dinamica.md`.
Mantiene el UUID `dynamic-island-gnome50@local`, el esquema y los datos existentes.
Las referencias de macOS se adaptan a GNOME; no se incluyen recursos ni código
propietario de Alcove o NotchNook.

## Uso

- Clic en el notch o Super + Mayús + Espacio: abrir/cerrar. Escape o clic exterior:
  cerrar liberando inmediatamente la entrada.
- Inicio: una tarjeta principal y hasta dos secundarias. Ajustes → Espacio personal
  permite elegirlas, moverlas al principio, ocultarlas y restaurar la distribución.
  Los cambios se reflejan en la isla. Más conserva el catálogo de herramientas.
- Notch compacto: rueda vertical para alternar actividades; rueda horizontal para
  pistas; Mayús + rueda para volumen; clic derecho para retirar un aviso temporal.
  Los gestos se pueden desactivar. Los controles de Música y Reloj admiten teclado.
- Música, temporizador, cronómetro, grabación y operaciones permanecen activos hasta
  terminar. Los avisos temporales no los borran. El contador indica otras actividades.
- Notificaciones: historial agrupado por aplicación, acciones publicadas por la app,
  descarte, silencio, privacidad del título y duración del aviso. No molestar se
  respeta. Al desactivar la extensión vuelve el proveedor nativo de banners.
- Estante: añade archivos copiados o abre «Arrastrar y previsualizar archivos».
  Una ventana GTK auxiliar recibe archivos nativos de Wayland y permite seleccionar
  varios y arrastrarlos fuera. Doble clic abre la vista previa/aplicación del sistema.
  Añadir conserva el original. La estrella fija una referencia; limpiar conserva
  fijados. Borrar un original retira su referencia. Máximo 50 archivos.
- Compartir abre la herramienta elegida, donde se selecciona el dispositivo y se
  confirma el envío. Abrir LocalSend/KDE Connect/Bluetooth no significa envío
  completado. Las herramientas no instaladas no se ofrecen.
- ZIP, extracción, PNG, OCR, MP3 y MP4 mantienen sus procesos auxiliares, muestran
  estado indeterminado y permiten cancelar. No se inventa un porcentaje.
- Temporizador: arrastrar duración, escribir minutos, hasta cuatro presets editables en Ajustes, concentración y
  descanso configurables. La actividad compacta sigue accesible al cerrar.
- Calendario: intervalo de catorce días, próximo evento y cuenta atrás. Unirse solo
  aparece si el evento proporciona un enlace compatible. La fuente de GNOME puede
  entregar únicamente el resumen; no siempre publica enlaces o descripciones.

## Reproductor de música

Música conserva portada, título/artista y progreso, con controles principales en
una fila: aleatorio, anterior, reproducir/pausar, siguiente, repetición y estrella.
Repetición alterna apagado → lista → canción → apagado. Los estados activos se
resaltan; los controles no admitidos quedan deshabilitados.

La estrella añade o quita una **favorita de Aurea**, guardada en este equipo. No
modifica la biblioteca de Spotify ni de otra app. Favoritas permite abrir el enlace
compartido por el reproductor o copiar el nombre cuando no proporciona enlace.
Puedes quitar entradas individualmente; máximo 200, sin duplicados. El archivo
`$XDG_DATA_HOME/dynamic-island/music-favorites.json` (normalmente bajo
`~/.local/share`) contiene solo título, artista, álbum y enlace; no audio ni portadas.

**Opciones → Reproducción** agrupa aleatorio, repetición, −15/+15 segundos y velocidad (0,5–2× dentro del rango que anuncie la
app) y detener. La fila Repetir abre No repetir, Lista y Canción.
**Sonido** muestra la salida actual, permite elegir un dispositivo por nombre y
abrir el mezclador por aplicación. **Canción** reúne abrir reproductor, copiar
enlace/nombre y Letras. El altavoz junto al deslizador silencia
la salida del sistema; si no hay salida Gvc, se usa el volumen MPRIS disponible.
Los modos y la velocidad se leen del reproductor y muestran errores si la app
rechaza una orden. Algunas aplicaciones del navegador solo ofrecen reproducción
y pausa: no se inventan las funciones ausentes.

Los cambios de aleatorio/repetición se leen de nuevo después de escribirlos. Si
la aplicación responde éxito sin modificar el valor, se indica «En la app» y se
explica el límite al pulsar. BStream Music 1.2.9 no publica Shuffle e ignora
LoopStatus en la instalación examinada; ambas funciones deben cambiarse en BStream.
Abrir reproductor utiliza Raise cuando existe y, para BStream, su lanzador de
escritorio oficial. No se reemplaza ni recompila BStream.

[Implementación y pruebas del reproductor](../tasks/music-player.md).

## Opciones y dependencias

El diseño predeterminado conserva el notch unido al borde, esquinas pequeñas y
portada solo en el reproductor expandido. El notch cerrado sigue la altura real
de la barra para no cubrir las ventanas; la cápsula flotante conserva su altura
independiente. Ajustes permite cápsula flotante, portada
compacta, ancho, radio, monitor y velocidad. El vidrio utiliza un desenfoque interior
que no alcanza las esquinas. Pantalla completa, overview y bloqueo ocultan la isla.

| Función | Activación y requisito |
|---|---|
| Letras | Activar Letras y abrir el panel musical. Consulta LRCLIB enviando título y artista; caché de 20 resultados en memoria, sin archivo persistente. Puede no haber resultado. |
| Audio real | Activar en Ajustes. `parec` y `pactl` con PulseAudio/PipeWire. Mide amplitud de salida; no es un FFT. Solo mientras el indicador compacto está visible y reproduciendo. |
| Descargas | Activar «Vigilar Descargas». Observa cambios en esa carpeta, sin recorrer subcarpetas; excluye extensiones temporales comunes. No demuestra finalización ni porcentaje de una descarga. |
| Cámara | GStreamer y dispositivo `/dev/videoN` seleccionado en Ajustes. Ventana auxiliar; activación manual, parada al cerrar, bloquear o desactivar. |
| Micrófono | Actividad cuando Gvc informa aplicaciones capturando audio. No identifica una llamada, interlocutor ni permite colgar. |
| Dictado | `whisper-cli`, modelo local compatible y `parec`. El audio temporal se elimina al terminar/cancelar; no se envía a un servidor. Se revisa y copia el texto; no se escribe automáticamente en otra app. |
| Teleprompter | Texto local, velocidad configurable; parada al cambiar de módulo o cerrar. El desplazamiento solicitado es la función del módulo. |
| Tareas locales | Opt-in «Actividades de tareas locales» y `aurea-task.py`. Sin acceso a conversaciones ni aprobación automática. |

La implementación del dictado sigue la interfaz de
[whisper.cpp](https://github.com/ggml-org/whisper.cpp). Los programas opcionales y los
modelos no se incluyen dentro del paquete de la extensión. En este equipo se
preparó whisper.cpp y el modelo multilingüe base; consulta la validación para su
procedencia. Solo se ejecuta al solicitar dictado.

## Publicar tareas de desarrollo

Desde el repositorio:

```bash
python3 extensions/dynamic-island/aurea-task.py --title 'Pruebas del proyecto' -- npm test
python3 extensions/dynamic-island/aurea-task.py --id build --title 'Compilación' --state running --progress 0.4
python3 extensions/dynamic-island/aurea-task.py --id build --title 'Revisión requerida' --state waiting
python3 extensions/dynamic-island/aurea-task.py --id build --title 'Compilación' --state done
```

El puente D-Bus de sesión `org.aurea.Island`, ruta `/org/aurea/Island`, acepta
`Publish(s JSON) → b`. Estados: `running`, `waiting`, `done`, `error`. Máximo 20 tareas;
se retira la más antigua terminada cuando hace falta espacio. Títulos de 120
caracteres, detalles de 300, mensajes de 4096. Cualquier proceso de la misma sesión
que el usuario habilite puede publicar: este canal **no autentica decisiones de
agentes** ni ejecuta órdenes recibidas. Para saltar a una conversación se necesita
una integración específica; no se fabrican enlaces a sesiones.

## Estado de los 48 puntos

| Puntos de investigación | Entrega |
|---|---|
| 1–6 | Identidad conservada, cuatro estados, tarjetas configurables, navegación corta, biblioteca y estilos comunes. |
| 7–8 | Material oscuro/vidrio y selección de pantalla; tamaño lógico y altura limitada con scroll. Escalas 125/150/200 % probadas en monitores virtuales; falta validación física. |
| 9–16 | Timeline de Clutter, interrupciones desde el estado actual, contorno compartido, revelado, hover cancelable, gestos locales y movimiento reducido. |
| 17–19 | Registro persistente separado de avisos, contador y alternancia, prioridades/caducidad y recuperación. |
| 20–21 | Acciones nativas, agrupación, silencio y política por app. Respuesta directa solo si la aplicación publica una acción compatible. |
| 22–25 | Se conservan integraciones reales de Bluetooth, HUD, sesión y MPRIS; no se simula brillo externo ni capacidades ausentes. |
| 26–27 | Letras opcionales y medidor real de amplitud; alternativa decorativa identificada como tal. |
| 28–32 | Puente GTK de archivos, miniaturas, selección múltiple, fijados, monitor de borrados, cancelación, capturas, vigilancia opcional de Descargas y elección de herramienta para compartir. |
| 33–36 | Filtros de portapapeles, captura pausada/retención existente, ajuste directo de tiempo, calendario ampliado, notas y tareas conservadas. |
| 37–40 | Cámara auxiliar seleccionable, indicador de micrófono, puente de tareas local, dictado local y teleprompter. No hay integración universal de llamadas o sesiones de agentes. |
| 41–45 | Liberación de entrada, límites por monitor, páginas secundarias bajo demanda, procesos cancelables y módulos separados. Se conserva E/S local pequeña existente; no se reescribe toda la persistencia. |
| 46–48 | Pruebas automatizadas y GNOME aislado, cien interrupciones, dos monitores, controles por teclado, comprobación de registros y medición de CPU/RSS. No equivale a certificar FPS/GPU o todas las apps de arrastre. |

Alternativas aprobadas disponibles: portada compacta, cápsula flotante, radio
configurable, mascota compacta propia, celebraciones breves y lanzador opcional de
aplicaciones con búsqueda. Los tres últimos están desactivados inicialmente. Las
celebraciones duran 600 ms, usan ocho partículas dentro del panel y se retiran al
cerrar; no hay partículas ni animaciones de mascota permanentes. El lanzador se
puede dejar oculto si se prefiere utilizar exclusivamente el centro de aplicaciones.
Contenido privado sobre bloqueo,
exclusión universal de capturas y hápticos de trackpad siguen sin un backend
comprobado en este equipo. No se presentan como funciones disponibles.

## Instalación y pruebas

La entrega se construye desde una etiqueta Git y se instala por componente:

```bash
./aurea.sh check
./aurea.sh build
./aurea.sh install dist/aurea-27-ETIQUETA --component=dynamic-island
./aurea.sh install dist/aurea-27-ETIQUETA --component=dynamic-island --apply
./aurea.sh install dist/aurea-27-ETIQUETA --component=dynamic-island --check
```

Sustituir `ETIQUETA` por el nombre semántico sin `v` mostrado por `./aurea.sh version`.
La copia instalada queda lista para la próxima sesión. GNOME puede conservar módulos
JavaScript ya importados: desactivar y activar no garantiza recargar código modificado.
No usar `unsafe_mode` en la sesión habitual.

```bash
bash extensions/dynamic-island/tests/smoke-shell.sh
DI_TEST_MONITORS=2 DI_TEST_SCALES=1 DI_TEST_RESOLUTION=1920x1080 bash extensions/dynamic-island/tests/smoke-shell.sh
DI_BENCHMARK=1 bash extensions/dynamic-island/tests/smoke-shell.sh
```

Cada ejecución usa datos y bus de sesión aislados en `/tmp`. El test GTK comprueba
contratos FileList, selección múltiple, duplicados, proveedor de arrastre y borrado;
la interoperabilidad completa con arrastres manuales de Qt/Electron queda pendiente
de una sesión interactiva. Los tests rechazan errores JS, objetos destruidos y
referencias inválidas en los registros.
