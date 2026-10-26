# Notas de extensions/dock/custom-effects/lens-math.js

Comentarios trasladados durante la consolidación. Los números corresponden al archivo antes del traslado.

## Línea 1

````text
// Lente de ampliación estilo macOS (puro, sin dependencias de GNOME Shell).
````

## Línea 2

````text
//
````

## Línea 3

````text
// Cada icono a distancia d del cursor se amplía con s(d) = 1 + (M - 1) * nivel(d)
````

## Línea 4

````text
// (coseno elevado). El desplazamiento de su centro es la integral de (s - 1):
````

## Línea 5

````text
// así el icono bajo el cursor no se mueve, los vecinos se separan de forma
````

## Línea 6

````text
// continua y el dock «se ensancha» como en macOS, sin saltos entre iconos.
````

## Línea 8

````text
// Desplazamiento extra acumulado a distancia `distance` del cursor.
````

## Línea 17

````text
// Desplazamiento firmado (hacia fuera del cursor) para un centro `center`.
````
