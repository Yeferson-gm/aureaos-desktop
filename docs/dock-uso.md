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
El vidrio conserva un margen interior seguro: no es una reproducción del shader
Liquid Glass de Apple ni una máscara de desenfoque de esquinas exactas.

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
