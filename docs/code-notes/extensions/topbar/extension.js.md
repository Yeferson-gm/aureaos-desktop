# Notas de extensions/topbar/extension.js

Comentarios trasladados durante la consolidación. Los números corresponden al archivo antes del traslado.

## Línea 19

````text
// ═══════════════════════ AJUSTES ═══════════════════════
````

## Línea 20

````text
// Valores por defecto. Los colores y el tema también se pueden cambiar sin tocar
````

## Línea 21

````text
// este archivo: ~/.config/lintel-v2/config.json o `bash instalar… --config …`.
````

## Línea 23

````text
// Muestra los atajos con símbolos de Mac (⌘ ⇧ ⌥). En GNOME se envía Ctrl/Shift/Alt.
````

## Línea 25

````text
// Color del texto de la barra: 'auto' (sigue el modo claro/oscuro), 'claro' o 'oscuro'.
````

## Línea 27

````text
// Colores personalizados (CSS: '#ffffff', 'rgb(255 255 255)'…). null = usar TEXTO.
````

## Línea 30

````text
// Tema de los menús desplegables: 'auto' (sigue color-scheme), 'claro' u 'oscuro'.
````

## Línea 32

````text
// Duración del fundido al abrir un menú, en ms. 0 = aparece al instante.
````

## Línea 34

````text
// Puntos de micrófono / cámara / grabación de pantalla en la barra.
````

## Línea 36

````text
// Indicador de distribución de teclado (solo aparece con 2 o más).
````

## Línea 40

````text
// ═══════════════════════════════════════════════════════
````

## Línea 47

````text
// Estado visual compartido (lo rellena Extension._applyTheme).
````

## Línea 52

````text
// Los iconos propios empiezan por "lintel-"; el resto son iconos del tema.
````

## Línea 94

````text
// ── Iconos de los menús: se eligen según el texto, como en macOS ─────────
````

## Línea 165

````text
// ── Atajos: se muestran estilo Mac y se envían como teclas reales ─────────
````

## Línea 195

````text
// ── Contexto compartido ───────────────────────────────────────────────────
````

## Línea 263

````text
// ── Modelos pequeños con notificación de cambios ──────────────────────────
````

## Línea 276

````text
// ── Configuración del usuario (colores, tema, animación) ──────────────────
````

## Línea 277

````text
// Archivo: ~/.config/lintel-v2/config.json. Se recarga en vivo al guardarlo.
````

## Línea 280

````text
// Solo se aceptan colores CSS simples: el valor acaba en un atributo de estilo.
````

## Línea 431

````text
// Mismo criterio que iconName, pero con el set propio.
````

## Línea 459

````text
// ¿Alguna aplicación está grabando audio ahora mismo?
````

## Línea 723

````text
// ── Bluetooth: adaptador y dispositivos vía BlueZ (D-Bus del sistema) ─────
````

## Línea 813

````text
// Los dispositivos sin nombre (solo dirección) no aportan nada en la lista.
````

## Línea 904

````text
// Conecta, desconecta o empareja según el estado del dispositivo.
````

## Línea 918

````text
// Si el emparejamiento directo falla, GNOME Ajustes sabe pedir PIN/confirmación.
````

## Línea 952

````text
// ── Privacidad: micrófono, cámara y grabación de pantalla ─────────────────
````

## Línea 953

````text
//   · micrófono: flujos de captura de PulseAudio/PipeWire (Gvc).
````

## Línea 954

````text
//   · cámara: algún proceso tiene abierto /dev/video* (sondeo cada 4 s).
````

## Línea 955

````text
//   · pantalla: handles de RemoteAccess (portal de screencast) y grabador de GNOME.
````

## Línea 1060

````text
// ── Elementos de menú con aspecto macOS: icono · texto · atajo ────────────
````

## Línea 1061

````text
// keepOpen: el clic ejecuta la acción pero NO cierra el menú (Wi-Fi, Bluetooth…).
````

## Línea 1077

````text
// Siempre se reserva la columna del icono para que todo quede alineado.
````

## Línea 1120

````text
// Fila con interruptor que NO cierra el menú al pulsarla (el de GNOME sí lo hace).
````

## Línea 1149

````text
// Actualiza el interruptor sin emitir 'toggled' (cambios que vienen del sistema).
````

## Línea 1178

````text
// ── Botones base ──────────────────────────────────────────────────────────
````

## Línea 1179

````text
// Registro de botones vivos: permite repintar colores y tema sin reiniciar la sesión.
````

## Línea 1193

````text
// Los indicadores con color propio (privacidad) no se tiñen con COLOR_ICONOS.
````

## Línea 1205

````text
// Apertura/cierre casi instantáneos: sin deslizamiento de GNOME y con un fundido corto.
````

## Línea 1232

````text
// Reconstruye el contenido justo antes de abrir, para que el tamaño sea correcto.
````

## Línea 1247

````text
// Colores personalizados de texto e iconos. Con el menú abierto el botón es una
````

## Línea 1248

````text
// píldora azul, así que se quita el color propio para que el texto siga legible.
````

## Línea 1276

````text
// ── Acciones de ventana ───────────────────────────────────────────────────
````

## Línea 1308

````text
// ── Menús dinámicos según el tipo de aplicación ───────────────────────────
````

## Línea 1526

````text
// ── Menú de la manzana ────────────────────────────────────────────────────
````

## Línea 1583

````text
// ── Nombre de la app activa ───────────────────────────────────────────────
````

## Línea 1644

````text
// ── Estado: batería ───────────────────────────────────────────────────────
````

## Línea 1657

````text
// Icono propio de batería: relleno en pasos del 5 % y rayo si está conectada a la corriente.
````

## Línea 1727

````text
// ── Estado: Bluetooth ─────────────────────────────────────────────────────
````

## Línea 1787

````text
// Reagrupa varios cambios seguidos en una sola actualización de la lista.
````

## Línea 1855

````text
// ── Estado: Wi-Fi ─────────────────────────────────────────────────────────
````

## Línea 1857

````text
// Tramos encendidos (0 a 3) del icono propio de Wi-Fi.
````

## Línea 2010

````text
// Escaneo reciente: se ignora.
````

## Línea 2020

````text
// Mientras el menú está abierto se reescanea cada 8 s para que las redes no se queden viejas.
````

## Línea 2030

````text
// Reagrupa varios eventos de NetworkManager en una sola actualización de la lista.
````

## Línea 2172

````text
// Sin perfil guardado: NetworkManager crea uno y GNOME Shell pide la contraseña.
````

## Línea 2191

````text
// ── Controles deslizantes ─────────────────────────────────────────────────
````

## Línea 2210

````text
// ── Estado: sonido ────────────────────────────────────────────────────────
````

## Línea 2263

````text
// ── Buscar ────────────────────────────────────────────────────────────────
````

## Línea 2279

````text
// ── Privacidad: puntos de micrófono / cámara / grabación ──────────────────
````

## Línea 2312

````text
// ── Teclado: distribución activa y selector ───────────────────────────────
````

## Línea 2365

````text
// ── Centro de control ─────────────────────────────────────────────────────
````

## Línea 2366

````text
// Rejilla fija de 280 px de contenido:
````

## Línea 2367

````text
//   [ tarjeta de conexiones 170 ] [ 2 mosaicos verticales 102 ]   (hueco 8)
````

## Línea 2368

````text
//   [ mosaico ancho 136 ] [ mosaico ancho 136 ]                    (hueco 8)
````

## Línea 2369

````text
//   [ tarjeta de brillo 280 ]
````

## Línea 2370

````text
//   [ tarjeta de sonido 280 ]
````

## Línea 2406

````text
// ── Conexiones ──
````

## Línea 2446

````text
// ── Mosaicos verticales (columna derecha) ──
````

## Línea 2471

````text
// ── Mosaicos anchos (2 × 2) ──
````

## Línea 2508

````text
// Reutiliza el estado real de la extensión Caffeine instalada.
````

## Línea 2521

````text
// Resume y controla los tres permisos ofrecidos por Privacy Menu.
````

## Línea 2562

````text
// ── Montaje ──
````

## Línea 2586

````text
// ── Pantalla ──
````

## Línea 2597

````text
// ── Sonido ──
````

## Línea 2609

````text
// ── Micrófono ──
````

## Línea 2635

````text
// variant: 'row' (dentro de la tarjeta), 'vertical' (icono arriba) o 'wide' (icono a la izquierda).
````

## Línea 2636

````text
// accent: color del círculo cuando la función está activa.
````

## Línea 2690

````text
// Tarjeta con título y un deslizador grueso con el icono dentro, como macOS.
````

## Línea 2715

````text
// ── Fecha, hora y calendario ──────────────────────────────────────────────
````

## Línea 2784

````text
// lunes = 1 … domingo = 7
````

## Línea 2800

````text
// 1 ene 2024 fue lunes
````

## Línea 2833

````text
// ═════════════════════════════ Extensión ═════════════════════════════════
````

## Línea 2863

````text
// Derecha, de izquierda a derecha: privacidad, teclado, batería, Wi-Fi, Bluetooth,
````

## Línea 2864

````text
// sonido, buscar, controles y hora.
````

## Línea 2881

````text
// Los iconos de estado van pegados, como en macOS; la hora lleva un poco más de aire.
````

## Línea 2935

````text
// El indicador nativo vuelve a mostrarse al cambiar la distribución.
````

## Línea 2952

````text
// Une color-scheme de GNOME con la configuración del usuario y repinta todo.
````

## Línea 2979

````text
// Evita parpadeos: GNOME deja focus-app en null un instante al hacer clic en el panel.
````
