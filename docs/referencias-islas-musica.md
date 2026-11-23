# Islas y música: referencias del 18 de noviembre

Se revisaron las dos grabaciones aportadas: la primera muestra Droppy durante
34 segundos; la segunda muestra ExtraDock durante 41 segundos. Las imágenes y
recursos de esos productos no se incorporan al paquete.

| Referencia observada | Adaptación Aurea |
| --- | --- |
| Droppy: portada, título, progreso y transporte, 9–27 s | Portada compacta, título blanco, artista secundario, progreso de ancho completo, controles principales separados de las opciones y transición de portada de 180 ms. |
| Droppy: «Playing Next», 12–21 s | «A continuación» consulta TrackList de MPRIS, permite seleccionar pista y retirar entradas si el reproductor permite editar. Máximo 40 pistas desde la actual. |
| Droppy: agenda, portapapeles, archivos y actividades | Se conservan los módulos existentes, accesibles desde Inicio y Más, sin duplicar sus datos ni agregar otra ventana permanente. |
| Droppy: aviso de auriculares con batería, 12 s | El aviso de conexión incluye el porcentaje de BlueZ si está disponible. Sin inventar un valor cuando el dispositivo no lo publica. |
| ExtraDock: ampliación al pasar el cursor, 0–5 y 33–36 s | Respuesta de resorte críticamente amortiguado con velocidad persistente al cambiar de objetivo. Se mantiene la resolución nativa en reposo, el recorte por monitor y los indicadores unidos al icono. |
| ExtraDock: panel lateral negro oculto, 20–30 s | Favoritas completamente ocultas en reposo; zona de activación transparente en el borde. Baterías de dispositivos en el borde opuesto, sin clic ni captura modal. |
| ExtraDock: porcentajes y anillos, 28–32 s | Iconos de equipo, mouse, teclado y auriculares, nombre legible, anillo y porcentaje. Verde normal, amarillo hasta 30 %, rojo hasta 15 %. |
| ExtraDock: estadísticas | Se conserva el panel de estadísticas existente sobre el dock, con entrada y salida suaves; su zona de activación tampoco deja una marca visible. |

Las funciones de carpetas y los efectos de nieve de la referencia no se añaden.
Los favoritos y recursos que ya existían se conservan.

## Cómo probarlo

- Favoritas: acercar el cursor al centro del borde configurado, derecho por defecto.
- Dispositivos: centro del borde opuesto. Si ese borde conecta con otra pantalla,
  se usa la parte inferior del mismo borde exterior de favoritas, alrededor del
  84 % de su altura. No se activa en la unión entre pantallas ni en pantalla completa.
- Estadísticas: borde inferior, cerca de la esquina izquierda, entre 24 y 80 px.
- Música: acercarse a la isla superior, abrir Música y elegir «A continuación».
- Salir de un panel lateral cierra la consulta y libera sus suscripciones.

## Servicios y límites

Las baterías combinan UPower y BlueZ y se deduplican por dirección, ruta nativa o
nombre. Un valor real de cero sigue siendo 0 %; un porcentaje ausente o un nivel
aproximado se muestra como «Batería no reportada». No se inicia un sondeo permanente:
se consulta al abrir y se agrupan señales de cambios mientras el panel está visible.

MPRIS TrackList es opcional. Si falta, se explica en la interfaz; no se construye una
cola falsa con el historial. Su API no tiene una operación de reordenación: Aurea
no retira y reinserta canciones para simular «mover al principio». Las funciones de
aleatorio y repetición conservan la verificación de respuesta del reproductor.

No se implementan controles Apple TV/AirPlay ni portadas de video exclusivas de
Apple Music. Tampoco se muestra música privada en la pantalla de bloqueo.

Contratos consultados:
[MPRIS TrackList](https://specifications.freedesktop.org/mpris/latest/Track_List_Interface.html)
y [BlueZ Battery](https://bluez.readthedocs.io/en/latest/battery-api/).

## Pruebas

```bash
./aurea.sh check
DI_TEST_MUSIC=1 bash extensions/dynamic-island/tests/smoke-shell.sh
DI_TEST_MONITORS=2 DI_SIDE_DOCK_DIR="$PWD/extensions/app-island" bash extensions/dynamic-island/tests/smoke-shell.sh
SIDE_TEST_MONITORS=2 bash extensions/app-island/test-shell.sh
AUREA_DOCK_WINDOWS=1 AUREA_DOCK_DUAL=1 AUREA_DOCK_VIDEO=1 bash extensions/dock/tests/smoke-magnification.sh
```

Las pruebas de baterías usan datos sintéticos para verificar porcentajes, ausencia
de datos, duplicados, apertura con puntero, cierre y respuestas tardías. No se
presentan como una comprobación física de todos los dispositivos Bluetooth.

### Verificación de esta entrega

El 18 de noviembre de 2026 se comprobaron música y paneles laterales en sesiones
aisladas de GNOME 50.6 y 51.1, incluidos TrackList opcional, apertura por puntero,
dos monitores y limpieza al cerrar. En GNOME 51.1 también pasaron la integración
de las islas y las pruebas del dock con ventanas, vídeo y escalas 100 % y 125 %:
sin fotogramas de animación en reposo ni pérdida de resolución nativa del icono.
La animación completa del dock no se certificó en GNOME 50: el contenedor tenía
las animaciones deshabilitadas. La batería física depende del hardware disponible.

El 22 de noviembre se repitió la comprobación general: 426 archivos de código,
25 288 enlaces y 34 grupos de pruebas, además de los esquemas y estilos.
