# Fluidez de ventanas

El efecto que devuelve una ventana minimizada desde el Dock pertenece a
`magic-lamp`. El arrastre elástico pertenece a `window-motion`. Abrir un proceso
nuevo sigue dependiendo del programa y de la animación nativa de GNOME; no se
retrasa su lanzamiento para sincronizarlo con un efecto.

## Correcciones

La física anterior ejecutaba un número de pasos redondeado hacia arriba en cada
fotograma, incluso con tiempo cero. Ahora acumula el tiempo fraccionario y avanza
con pasos de 0,5 unidades: la respuesta no cambia con la frecuencia de pantalla.
La velocidad nominal conserva las 120 unidades por segundo del perfil anterior a
60 Hz, ajustadas por la preferencia existente. Los fotogramas demorados recuperan
como máximo 64 ms y el modelo limita su trabajo a 16 pasos por llamada. Se vacían
las fuerzas de todos los nodos, incluidos los fijados por el puntero.

El reloj del efecto se detiene cuando una ventana queda quieta, aunque se siga
sujetando con el ratón. El siguiente desplazamiento lo reactiva sin acumular el
tiempo de espera. Soltar, destruir la ventana o desactivar la extensión elimina
las señales y el reloj una sola vez. Minimizar retira la deformación de arrastre
para no superponer ambas mallas.

La lámpara invalida exclusivamente su efecto. Ya no solicita repintar el padre de
todas las ventanas ni reconstruye el Dash al buscar el destino del icono.
Se detiene explícitamente el reloj cuando una animación se interrumpe. La duración
respeta el valor elegido y no añade un cociente de áreas que alargaba el recorrido
de ventanas pequeñas. El valor predeterminado pasa de 400 a 300 ms; se conserva
cualquier duración personalizada. Las dos fases usan interpolación cúbica con
velocidad continua en sus límites. Las preferencias de animaciones desactivadas y
movimiento reducido se respetan al iniciar los efectos.

## Medición reproducible

En una sesión GNOME 51.1 aislada, con ventanas sintéticas y monitor 1920×1080:

| Comprobación | Antes | Después |
| --- | ---: | ---: |
| Actualizaciones en 600 ms sujetando una ventana inmóvil | 37 | 0 |
| Solicitudes explícitas de repintado del padre durante dos ciclos minimizar/restaurar | 107 | 0 |
| Diferencia de la simulación a 60 y 144 Hz tras 250 ms, mismo impulso | 16,146 px | < 0,01 px |
| Tiempo observado hasta retirar la deformación al soltar | 503 ms | 453 ms |

Estos números describen trabajo eliminado y la prueba sintética; no son una
promesa de FPS ni una medición de todas las aplicaciones del escritorio. El primer
intento con pasos fraccionarios prolongó el asentamiento a 1207 ms: se corrigieron
la calibración temporal y el umbral de reposo antes de entregar.

También se comprueban reanudar un arrastre pausado, cuatro interrupciones rápidas,
desactivación durante la lámpara, restauración de los métodos nativos, ausencia de
animación cuando está deshabilitada y límites de tiempo de la simulación. Los
contratos siguen siendo compatibles con GNOME 50; esta corrección se verificó en
Shell 51.1, no se repitió su ejecución en 50.

```bash
node tests/window-effects/model.test.mjs
AUREA_EFFECTS_BASELINE=1 AUREA_EFFECTS_BASELINE_REF=v0.17.0 bash tests/window-effects/shell.sh
bash tests/window-effects/shell.sh
./aurea.sh check
```

Cada prueba usa su propio bus, directorios temporales, ventanas y Shell. El modo
baseline conserva la medición antigua y omite únicamente las expectativas de
rendimiento nuevas. Los resultados y el registro quedan en la ruta temporal que
muestra el comando. No utiliza Eval ni reinicia GNOME en la sesión del usuario.

Referencias oficiales: [DeformEffect.invalidate](https://gnome.pages.gitlab.gnome.org/mutter/clutter/method.DeformEffect.invalidate.html)
ya solicita el repintado del actor; [Timeline](https://gnome.pages.gitlab.gnome.org/mutter/clutter/class.Timeline.html)
se sincroniza con el reloj de fotogramas del compositor.
