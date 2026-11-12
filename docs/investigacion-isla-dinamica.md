# Investigación de la isla dinámica de Aurea

Fecha: 12 de noviembre de 2026. Investigación y propuesta; no implementación.
Base local examinada: `92d49f16079842e07d0b410137869283e868a05f`.

## Recomendación

Elegiría **Alcove como referencia principal de interacción**, complementada por
NotchNook para organización de herramientas y Boring Notch para estudiar código
de movimiento. Es una elección para los objetivos de Aurea, no un ranking de
rendimiento medido. No ejecuté estas aplicaciones en un Mac.

La página oficial de [Alcove](https://tryalcove.com/) presenta transiciones,
notificaciones, actividades, gestos, HUD y widgets de bloqueo. Su paquete oficial
descargado identifica Alcove 1.7.7, compilación 199. Sus recursos incluyen ajustes
de gestos, selección de pantalla, hover, desenfoque progresivo y actividades.
La existencia de recursos no demuestra que todas esas rutas estén activas.

[NotchNook](https://getnotchnook.com/) documenta música, calendario, bandeja de
archivos y herramientas adicionales. Su [guía oficial](https://getnotchnook.com/download?start=pro)
describe un espacio personalizable arrastrando widgets. Esa organización resulta
más útil como referencia que añadir más pestañas fijas a Aurea.

[Boring Notch](https://github.com/TheBoredTeam/boring.notch) permite contrastar
decisiones con código público. En el
[ContentView examinado](https://github.com/TheBoredTeam/boring.notch/blob/b7611bbf32c627a3427408fc142486900d71a23f/boringNotch/ContentView.swift),
hay un resorte interactivo compartido, gestos verticales, tareas de hover
cancelables y transiciones distintas de apertura y cierre. Esto demuestra la
implementación en ese commit, no los FPS de la aplicación distribuida.

[Halo](https://halo-mac.com/) aporta referencias secundarias: actividades
simultáneas, reuniones, avisos por aplicación y estados de agentes de programación.
Sus afirmaciones de rendimiento no se trataron como mediciones independientes.

## Qué se hizo con REA y qué no pudo comprobarse

Se leyó la skill `reverse-engineer-anything` y se ejecutó REA 6.8.0 por CLI.
El diagnóstico encontró la skill alineada, registro MCP ausente en Codex y
motores nativos no configurados. No se modificó la configuración de Codex.

REA inspeccionó los DMG oficiales de Alcove y Boring Notch. En Linux, esta ruta
retuvo formato, hash y limitaciones: no inventarió el interior del DMG porque
su adaptador requiere macOS. Se continuó con 7-Zip ya instalado, extrayendo
solamente `Info.plist` y `Localizable.strings` de Alcove; se leyeron con Python.
`inspect-plist` de REA se intentó y devolvió `capability_unavailable`: requiere
macOS. No hubo decompilación de Alcove ni prueba de sus animaciones en ejecución.

| Evidencia | Resultado y alcance |
|---|---|
| REA Alcove | `ev_de80176cca7fd3f4cfa22237c65025c03d27eedee9a670533585922884195430`; contenedor, cobertura parcial |
| REA Boring Notch | `ev_ea17be4bb90b00406d988c98da14a23918ba1948c3710e8ae0148f59fa6f7388`; contenedor, cobertura parcial |
| Alcove Info.plist | Identidad `com.henrikruscon.Alcove`, versión 1.7.7, compilación 199, mínimo macOS 15.0 |
| Alcove localización | 264 entradas; evidencia estática de opciones, no de comportamiento |
| Boring Notch fuente | Commit `b7611bbf32c627a3427408fc142486900d71a23f`; no se ha demostrado que sea idéntico al DMG 2.7.3 |
| Aurea fuente | Código local; no se ejecutaron pruebas visuales ni de rendimiento en esta investigación |

Paquete Alcove: [descarga oficial](https://download.tryalcove.com/Alcove.dmg).
SHA-256: `17c481ffa9af91fc76e2ba9995f96750538bf171e5eb2be602c07255f4d944e5`.
El enlace es mutable: otra descarga puede contener otra compilación.

Paquete Boring Notch: [release 2.7.3](https://github.com/TheBoredTeam/boring.notch/releases/tag/v2.7.3).
SHA-256: `23786382548d33c59b309db558e513a92e3f95b63d611544dcddf5d196e46698`.

Los JSON originales de REA están en `investigacion-isla-evidencias/` junto a este
documento. Los paquetes y recursos propietarios permanecen en
`/tmp/aurea-island-research`, no se incorporaron al producto ni al repositorio.

## Lo que Aurea ya tiene

No conviene reconstruir estas funciones como si faltaran. Se identificaron en
`extensions/dynamic-island/extension.js`, `activities.js`, `prefs.js` y el esquema.

| Área | Implementación observada | Mejora necesaria |
|---|---|---|
| Navegación | 11 páginas fijas: inicio, música, archivos, portapapeles, notas, sistema, reloj, calendario, notificaciones, cámara y herramientas | Jerarquía y selección de módulos |
| Música | MPRIS, selector/preferencia de reproductor, progreso, volumen, shuffle y repeat según capacidades | Interacciones y presentación; no añadir controles duplicados |
| Actividades | Cola por prioridad, caducidad y clave; máximo 8 entradas | Distinguir avisos temporales de actividades persistentes |
| Notificaciones | Historial, activación, limpieza, privacidad y sustitución de banners | Acciones, agrupación y filtros por aplicación |
| Archivos | Añadir desde copiados, abrir, copiar, enviar, ZIP, extraer, PNG, OCR, MP3/MP4 | Arrastrar directamente, miniaturas y progreso; depende de herramientas instaladas |
| Portapapeles | Texto/imágenes, búsqueda, favoritos, modo privado y persistencia | Mejor navegación, tipos y retención |
| Tiempo | Temporizador, cronómetro, alarma y Pomodoro | Ajuste directo y mejor actividad compacta |
| Calendario | Fuente de eventos GNOME, mes, rango de dos días y hasta tres eventos visibles | Próximo evento y acciones de reunión |
| Sistema | Métricas, batería, volumen, brillo, Bluetooth/red y mantener despierto | Presentación contextual y dependencias claras |
| Cámara | Proceso GStreamer en ventana auxiliar | No es una cámara incrustada dentro de la isla |
| Accesibilidad básica | Teclado, Escape, nombres accesibles y preferencia de animaciones | Auditoría completa de foco, contraste y movimiento |

Hallazgos concretos del código:

- `_buildCard` construye las once páginas al abrir la extensión y muestra una
  fila fija de iconos de navegación. Propuesta: construir vistas secundarias bajo
  demanda y reducir navegación inicial.
- `_runTween` actualiza tamaño y posición mediante un timeout de 16 ms.
  `_applyIsland` solicita además repintado. Es un candidato a medir y reemplazar,
  no prueba suficiente para atribuirle todos los tirones.
- `_startBars` usa una función sinusoidal: el visualizador es decorativo.
- `ActivityQueue` caduca entradas desde su llegada. Una actividad de menor
  prioridad puede vencer mientras otra ocupa la isla. No sirve por sí sola como
  registro persistente de descargas o temporizadores.
- `_presentActivity` muestra un único evento; varios comparten la clave
  `notification`. Agrupar historial y arbitrar avisos son problemas distintos.
- `_renderShelf` ofrece copiar/pegar; no se encontró un receptor de drag-and-drop
  en los fuentes inspeccionados de esta extensión.
- `_updateFinal` y otras rutas se apoyan en el monitor principal; no hay selector
  de monitor en el esquema inspeccionado.
- El cierre ya libera el grab antes de animar. Debe conservarse esa protección;
  no se afirma que la pantalla esté bloqueándose actualmente.
- `extension.js` tiene 3.632 líneas y concentra UI, integración y persistencia.
  Conviene separar responsabilidades al introducir los cambios, sin reescribir
  de golpe todo lo que funciona.

## Lista completa propuesta

P0: base y fiabilidad. P1: mejora principal de experiencia. P2: ampliaciones
opcionales. Las propuestas son decisiones para Aurea; no se atribuye esta lista
entera a ninguna aplicación comercial.

### Diseño y organización

1. **P0 · Preservar identidad.** Notch unido al borde superior, radios pequeños,
   anchura compacta aprobada y sin portada cuando está cerrado. Portada solo en
   la vista musical expandida.
2. **P1 · Cuatro presentaciones claras.** Reposo, actividad compacta, aviso breve
   y panel expandido; cada una con un propósito y contenido limitado.
3. **P1 · Inicio contextual.** Una tarjeta principal y hasta dos secundarias;
   elegir según actividad y preferencias, sin cambiar de vista mientras se edita.
4. **P1 · Reducir las once pestañas visibles.** Accesos principales con etiquetas
   claras y un botón para herramientas adicionales; no eliminar funciones.
5. **P1 · Panel configurable.** Elegir, ordenar y ocultar módulos; preferencias
   persistentes, vista previa y restauración del diseño predeterminado.
6. **P1 · Sistema visual único.** Espaciado, tipografía, iconografía, controles,
   separadores y estados de selección consistentes.
7. **P1 · Materiales legibles.** Negro integrado por defecto; vidrio opcional en
   el panel, con texto contrastado, blur contenido y sin halos fuera del borde.
8. **P1 · Tamaño adaptable.** Medidas por pantalla y escala; textos largos,
   idiomas y porcentajes no deben ensanchar el notch de forma inesperada.

### Movimiento e interacción

9. **P0 · Animación sincronizada con fotogramas.** Sustituir el timeout fijo tras
   perfilar; usar mecanismos de Clutter y evitar repintados duplicados.
10. **P0 · Transiciones interrumpibles.** Abrir, cerrar o recibir un evento durante
    otra animación debe continuar desde la posición actual, sin saltar al inicio.
11. **P1 · Forma continua.** Transformar contorno, tamaño y contenido como una
    misma superficie; evitar el efecto de ventana que aparece separada.
12. **P1 · Entrada coordinada de contenido.** Revelar controles cuando haya
    espacio; al cerrar, retirarlos antes de comprimir texto e iconos.
13. **P1 · Hover estable.** Retardo configurable, cancelación al abandonar y margen
    de tolerancia para pasar a controles; nunca abrir por rozar accidentalmente.
14. **P1 · Gestos de actividad.** Cambiar actividad o descartar aviso con gestos
    locales; no capturar los gestos globales de escritorios de GNOME.
15. **P1 · Gestos multimedia.** Deslizamiento para cambiar pista y rueda para
    volumen solo en zonas identificables; teclado equivalente.
16. **P0 · Movimiento reducido completo.** Respetar la preferencia ya existente
    en todas las nuevas transiciones, marquee, indicadores y efectos.

### Actividades, notificaciones y contexto

17. **P0 · Actividades persistentes separadas de avisos.** Música, temporizador y
    grabación existen hasta finalizar; un aviso temporal no debe borrarlas.
18. **P1 · Convivencia de actividades.** Una principal más un indicador discreto
    de otras; acceso para alternar sin aumentar indefinidamente el ancho.
19. **P0 · Prioridad y recuperación.** Agrupar ráfagas, actualizar progresos y
    regresar a la actividad anterior; no reproducir después avisos ya irrelevantes.
20. **P1 · Notificaciones accionables.** Abrir, descartar y ejecutar las acciones
    que realmente publique la aplicación; respuesta directa solo si la API lo permite.
21. **P1 · Preferencias por aplicación.** Mostrar/silenciar, privacidad y duración;
    mantener No molestar y un solo proveedor de banners visible.
22. **P1 · Bluetooth más informativo.** Tipo de dispositivo, conexión y batería
    cuando existan datos; manejar reconexión y valores desconocidos.
23. **P1 · HUD completos.** Pulir volumen, silencio, brillo y energía ya existentes;
    brillo externo únicamente si hardware y backend lo permiten.
24. **P1 · Estados de sesión.** Política coherente en overview, pantalla completa,
    bloqueo, suspensión y retorno. Al bloquear, ocultar contenido sensible.

### Música, archivos y productividad

25. **P1 · Reproductor más pulido.** Progreso fácil de arrastrar, tiempos legibles,
    elección estable de reproductor y controles habilitados por sus capacidades.
26. **P2 · Letras sincronizadas.** Vista opcional; proveedor y caché explícitos,
    estado sin resultados y sin consultas continuas innecesarias.
27. **P2 · Visualizador real opcional.** Solo con fuente de audio y presupuesto
    medido; alternativa decorativa discreta, sin presentarla como espectro real.
28. **P1 · Arrastrar archivos a la isla.** Apertura durante arrastre, zona de caída
    visible, selección múltiple y arrastre de salida. Validar Wayland y aplicaciones
    GTK, Qt y Electron antes de prometer compatibilidad universal.
29. **P1 · Estante visual.** Miniaturas, vista previa, archivos fijados y limpieza
    de referencias desaparecidas; no mover originales al añadirlos.
30. **P1 · Operaciones con progreso.** Completar conversiones existentes con
    progreso real o estado indeterminado, cancelación segura y resultado accesible.
31. **P2 · Capturas y descargas.** Capturas propias al estante; descargas externas
    mediante integración explícita. Vigilar una carpeta no permite conocer un
    porcentaje de descarga real.
32. **P1 · Compartir mejor.** Elegir destino disponible en LocalSend/KDE Connect;
    distinguir lanzamiento de la herramienta de transferencia terminada. No
    prometer AirDrop nativo en Fedora.
33. **P1 · Portapapeles organizado.** Mantener búsqueda/favoritos existentes;
    filtros por tipo, vista previa, retención y pausa de captura claras.
34. **P1 · Temporizador táctil.** Ajustar duración directamente, presets editables,
    ciclos de concentración/descanso y controles compactos persistentes.
35. **P1 · Próxima reunión.** Cuenta atrás, detalle y botón de unirse cuando el
    evento contenga enlace; respetar calendario, zona horaria y todo el día.
36. **P1 · Notas y tareas rápidas.** Crear/completar sin salir del contexto,
    conservar escritura al cambiar de actividad y guardar sin bloquear la UI.
37. **P2 · Cámara integrada o auxiliar cuidada.** Selector de cámara y parada
    garantizada; evaluar proceso auxiliar para no cargar captura de vídeo dentro
    de GNOME Shell. Nunca activarla automáticamente por una reunión.
38. **P2 · Micrófono y llamadas.** Indicar uso del micrófono si el backend lo
    informa. Llamada, interlocutor y colgar requieren integración específica;
    micrófono abierto no equivale a llamada.
39. **P2 · Agentes de desarrollo.** Avisos de tarea terminada/error/entrada necesaria
    y salto a la sesión, mediante integraciones soportadas y opcionales. Aprobaciones
    solo con canal autenticado; nunca aceptar automáticamente.
40. **P2 · Dictado o teleprompter.** Módulos opcionales, desactivados por defecto,
    con alcance y consumo definidos. No son requisito del primer rediseño.

### Fiabilidad, consumo y mantenimiento

41. **P0 · Cierre seguro.** Escape, clic exterior y segundo clic coherentes;
    liberar foco/grab ante excepción, desactivación, bloqueo y cambio de monitor.
42. **P0 · Multimonitor correcto.** Selector de pantalla, recorte por monitor,
    escalas distintas y reconexión; nada oculto debe asomar en la pantalla vecina.
43. **P0 · Trabajo solo cuando corresponda.** Crear páginas bajo demanda, detener
    animaciones invisibles y conservar los muestreos que ya se pausan al cerrar.
44. **P0 · Servicios fuera del camino de dibujo.** E/S asíncrona, cachés limitadas,
    procesos auxiliares para OCR/conversión/cámara y manejo de cancelaciones.
45. **P0 · Responsabilidades separadas.** Controlador de estado, animaciones,
    presentaciones, adaptadores de servicios y persistencia; contratos existentes
    conservados y migraciones probadas si se amplían.
46. **P0 · Pruebas de interrupciones y carga.** Notificación durante arrastre,
    música más temporizador, apertura/cierre repetido, servicio que desaparece y
    monitor desconectado. El fallo de un módulo no debe inutilizar la isla.
47. **P1 · Accesibilidad y estados honestos.** Teclado, lector de pantalla, foco
    visible y contraste; distinguir cargando, sin datos, dependencia ausente y error.
48. **P0 · Validación en GNOME aislado.** Medir memoria, CPU, GPU y fotogramas antes
    y después; instalar en la sesión principal solo una entrega verificada.

## Orden recomendado y criterios de aceptación

1. **Base estable:** puntos P0 de estado, interacción, animación y monitor.
2. **Rediseño visible:** inicio contextual, módulos elegidos y lenguaje visual.
3. **Uso diario:** archivos por arrastre, avisos, música, reuniones y temporizador.
4. **Opcionales:** letras, audio real, agentes, cámara integrada y dictado.

No empezaría por más funciones: la isla ya dispone de una base extensa. El primer
salto perceptible vendrá de navegación, prioridades y continuidad del movimiento.

Objetivos de prueba, no resultados obtenidos:

- Apertura inicial orientativa 280–360 ms; cierre 180–260 ms; feedback 100–160 ms.
  Afinar con pruebas, sin tratar estos números como valores internos de Alcove.
- Medir fotogramas frente al presupuesto de la pantalla: 16,67 ms a 60 Hz y
  8,33 ms a 120 Hz; registrar percentiles y cuadros perdidos, no solo FPS promedio.
- Cien ciclos interrumpidos de apertura/cierre sin dejar grabs, actores ni timers
  acumulados. Retorno a uso basal tras cerrar y tras desactivar.
- Sin actualización periódica de decoraciones invisibles; separar el coste del
  fondo animado del coste incremental de la isla.
- Probar 100 %, 125 %, 150 % y 200 %, un monitor y dos de escalas diferentes;
  sin desbordes, texto borroso por escalado de todo el panel ni saltos de posición.
- Comprobar una sola notificación visual, historial conservado y No molestar.
- Simular ausencia de reproductor, red, batería, cámara y utilidades externas.

GNOME 50 incorpora `easeAsync()` y cancelación de transiciones documentada;
es una opción a evaluar al implementar, no una garantía automática de fluidez.
[Documentación de GNOME 50](https://gjs.guide/extensions/upgrading/gnome-shell-50.html).

Las extensiones se ejecutan dentro de GNOME Shell, por lo que separar operaciones
pesadas tiene consecuencias de estabilidad además de rendimiento.
[Arquitectura de extensiones](https://gjs.guide/extensions/overview/architecture.html).

## Qué no trasladaría automáticamente

- Portadas en el notch cerrado, cápsula flotante o radios grandes: contradicen
  las decisiones visuales ya aceptadas para Aurea.
- Otra cuadrícula de todas las aplicaciones: duplicaría el centro de aplicaciones.
- Mascotas, partículas permanentes o visualizadores costosos por defecto.
- Widgets privados sobre el bloqueo o exclusión de capturas sin verificar las
  capacidades reales de GNOME/Wayland.
- Haptics de trackpad como promesa general: dependen del hardware y sus APIs.
- Código o recursos propietarios de Alcove/NotchNook. La referencia es funcional;
  los recursos de Aurea deben ser propios. Boring Notch requiere respetar su licencia
  si se decide reutilizar código, y aquí no se ha incorporado ninguno.

Esta investigación solo añade documentación y evidencia. No cambia extensiones,
preferencias, servicios, tema ni la sesión activa.
