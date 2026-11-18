# Dock Aurea: ajustes y verificación

## Uso

Abrir las preferencias con:

```bash
gnome-extensions prefs macos27-dock@local
```

La página **Aurea** agrupa vidrio, desenfoque, aspecto Sistema/Claro/Oscuro,
punto único, ampliación, respuesta y rebote breve. Los cambios se aplican en vivo
una vez cargada esta entrega. Restaurar afecta solamente al grupo correspondiente;
no borra favoritos, posición, monitor ni acciones del ratón.

Se conservan los ajustes personales de ampliación y tamaño. Para comparar un
movimiento más contenido se puede elegir 1,60× en Ampliación máxima. El valor
Respuesta es una constante de suavizado exponencial, no la duración total.

El movimiento reducido de GNOME detiene la ampliación y el rebote, restaura los
iconos y no deja un bucle activo. El lanzamiento da como máximo un salto, que se
cancela cuando aparece la ventana; la señal de atención usa como máximo dos.
Los contadores y puntos permanecen disponibles sin depender del rebote.

La lente se suspende durante arrastre o menú abierto. Los indicadores mantienen
su tamaño y acompañan al icono. La capa de vidrio se estira con transformaciones,
sin recalcular sus restricciones en cada cuadro. El recorte del contenedor queda
limitado a su monitor y se aplica también durante el ocultamiento.

El material claro/oscuro usa los mismos colores base que las tarjetas de Aurea.
Alto contraste elimina el desenfoque y usa superficies opacas con borde visible.
El menú contextual y las vistas de ventanas tienen texto según su propia tarjeta.
El desenfoque cubre la superficie completa y una región de recorte del framebuffer
limita sus esquinas al radio del contenedor. No hay un rectángulo interior oscurecido.
La región se calcula en píxeles de destino con las matrices del compositor y se
reutiliza mientras no cambie la geometría. El medio píxel interior evita que el
desenfoque sobresalga del borde suavizado del tema. El recorte se aplica antes del
desenfoque y se retira siempre al terminar de pintar. Una máscara en un framebuffer
intermedio no servía: o no recortaba el fondo o impedía muestrearlo.
Los iconos St.Icon se cargan a la resolución de ampliación máxima; se mantiene
su asignación de tamaño normal y el compositor considera la escala de pantalla.
No se recargan las imágenes en cada cuadro. Un recurso original de baja resolución
puede seguir limitado: el aumento de resolución solicitada no inventa detalle.
El material no reproduce el shader Liquid Glass de Apple.

La vista desplazable usa el volumen de dibujo de sus hijos para la detección del
puntero. En GNOME 50, StScrollView lo limita a su asignación y StViewport recorta
los clics aunque `clip-to-view` esté desactivado. Los adaptadores del Dock corrigen
esas dos limitaciones sin cambiar asignaciones ni desplazamientos. El actor visual
recibe eventos que se propagan al botón de la aplicación; al desmontar se restaura
su estado. El recorte del monitor continúa en el contenedor exterior.

## Pruebas

```bash
./aurea.sh check
bash extensions/dock/tests/smoke-magnification.sh
AUREA_DOCK_WINDOWS=1 bash extensions/dock/tests/smoke-magnification.sh
AUREA_DOCK_DUAL=1 AUREA_TEST_SCALE=1.25 AUREA_DOCK_RESOLUTION=1920x1080 bash extensions/dock/tests/smoke-magnification.sh
AUREA_DOCK_VIDEO=1 bash extensions/dock/tests/smoke-magnification.sh
```

Son sesiones privadas, con configuración y ventanas sintéticas. Las pruebas de
puntero sustituyen la acción de lanzar por un registro de activaciones; ejercitan
la entrada real del compositor sin abrir aplicaciones ajenas. La prueba de
ventanas usa dos ventanas GTK propias para minimizar, restaurar, maximizar y
revelar el Dock desde el borde. Las preferencias se construyen y se comprueba que
sus controles escriben los ajustes. No se activa Eval en la sesión habitual.
La sesión privada desactiva la indexación de carpetas de Tracker para evitar
recorrer archivos del usuario. Su ventana sintética usa un SVG propio. Antes de
probar ocultamiento se espera a que desaparezca la reserva de espacio del Dock
fijo y se sale de la vista de aplicaciones, donde el Dock permanece visible.
La esquina activa queda deshabilitada solo en esta sesión privada para que la
inicialización del puntero virtual no vuelva a abrir esa vista.

El banco con vídeo sintético registró, en un barrido de 120 cuadros, 85 cambios de
asignación de la capa de desenfoque antes de optimizar y 0 después. El controlador
registró 0 cuadros en reposo. El consumo de Shell en esas dos ejecuciones fue
19,13 % y 16,62 % de un núcleo, respectivamente. Son muestras cortas de un
compositor aislado, no una garantía de ahorro ni una medida de FPS físicos.
No se dispone de una medición fiable de GPU ni de latencia de la pantalla real.

La entrega pasó la matriz de ventanas, preferencias y dos monitores virtuales
con escala 125 % en el primero y 100 % en el segundo. Se comprobó crear un Dock
por monitor, sus límites y volver a uno. Las capturas conjuntas incluyen el área
sin monitor bajo la pantalla más baja; esa zona no representa píxeles de una
pantalla física.

La regresión de nitidez usa ampliación 1,75×: con iconos de 48 px se comprobaron
texturas reales de 84 px al 100 % y de 168 px en la sesión de escalas mixtas.
La asignación visual base siguió en 48 px. Se validan también los centros de los
iconos desplazados, clics con puntero virtual y arrastre. La prueba con vídeo
conservó 0 reasignaciones del vidrio durante el barrido y 0 cuadros de lente en
reposo. Estas comprobaciones no reconstruyen detalle ausente en iconos originales.

La prueba de esquinas necesita Pillow en `/usr/bin/python3`. Compara capturas
con y sin vidrio sobre un patrón sintético, en reposo y ampliación. Exige que no
cambien los píxeles exteriores y que sí se desenfoque el interior; desactiva el
recorte en una captura de control para comprobar que detecta la regresión.
También se ejecuta con monitores al 125/100 %.

## Límites y alcance

No se añade el acceso opcional a Descargas de la evaluación: es una función nueva
separada de esta corrección. No se sustituyen iconos de terceros ni se obliga a
todas las apps a compartir fondo. La coherencia óptica de esos recursos requiere
una revisión propia del tema. Las pruebas virtuales no equivalen a verificar
conexiones y desconexiones físicas de todos los monitores.

## Instalación

Construir desde una etiqueta limpia y aplicar exclusivamente `--component=dock`:

```bash
./aurea.sh build
./aurea.sh install dist/aurea-27-VERSION --component=dock --apply
./aurea.sh install dist/aurea-27-VERSION --component=dock --check
```

Sustituir VERSION por la etiqueta construida sin la v inicial. Tras instalar código
nuevo en Wayland, cerrar y volver a iniciar sesión. Los ajustes de las preferencias
no necesitan volver a cerrar sesión. Las copias sustituidas quedan en la papelera.


## Ancho y separadores

La superficie vuelve a calcular su escala cuando cambia su asignación, aunque la
lente ya esté en reposo. Así una actualización tardía de la lista de aplicaciones
no multiplica el margen de ampliación por el ancho anterior. Se omiten las medidas transitorias no válidas o nulas de
actores aún sin asignación para evitar propagar valores inválidos a la lente.

El separador de ubicaciones se retira antes de calcular su nueva posición y omite
los actores que están animándose al desaparecer. Si el separador de favoritos ya
ocupa ese límite, se reutiliza ese límite sin añadir otra línea. Se conserva la
separación entre grupos distintos cuando hay aplicaciones abiertas no favoritas.

La prueba `tests/layout-regression.js` cambia favoritos, reduce y recupera el
ancho, simula una asignación tardía con la lente estable y comprueba que el fondo
solo añade el margen de ampliación solicitado. También reproduce el cierre de
una aplicación junto a la papelera y actualiza repetidamente los separadores.
Forma parte de la prueba aislada de ampliación, incluidas ventanas y escalas mixtas.
La comprobación con vídeo mantiene cero cuadros de lente en reposo y cero
reasignaciones de la capa de vidrio durante el barrido de 120 cuadros.

## Recorte tras mover o mostrar el dock

El límite de pantalla se calcula antes del dibujo, una vez terminada la asignación
de tamaños y posiciones. Calcularlo dentro de `vfunc_allocate` podía usar la
traslación anterior del contenedor inferior: al volver a su posición, el límite
quedaba por encima del borde y cortaba los iconos. La prueba de regresión reproduce
el desfase con un desplazamiento de 24 píxeles y falla con el código anterior.

Los cambios de asignación, traslación y escala solicitan una actualización agrupada
para el próximo dibujo. No se añade un temporizador ni un bucle permanente. El
ocultamiento conserva su recorte local durante la animación y el dock abierto
conserva el límite de su monitor, incluyendo configuraciones de varias pantallas.
Al destruir el contenedor se cancela cualquier actualización pendiente.

Verificación: la suite aislada completa pasó en GNOME 51.1 con ventanas y dos
monitores, y también con escala del 125 %. En GNOME 50.6 pasaron la regresión de
posición, tamaños y separadores, y las preferencias GTK4. La suite completa de
ampliación no se certificó en ese contenedor: `St.Settings` desactiva las animaciones
aunque la preferencia de GSettings esté activada. No se modifica la política de
movimiento reducido del escritorio para eludir esa limitación de las pruebas.
