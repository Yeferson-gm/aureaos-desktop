# Notas de extensions/dock/custom-effects/magnification-math.js

Comentarios trasladados durante la consolidación. Los números corresponden al archivo antes del traslado.

## Línea 1

````text
// Pure math kept separate so it can be tested without a running GNOME Shell.
````

## Línea 11

````text
// Raised cosine: no visual corner at either the peak or its fall-off edge.
````

## Línea 19

````text
// Each image stays inside its fixed slot horizontally. No neighbour offsets
````

## Línea 20

````text
// or changing anchor: only upward growth for a bottom dock.
````

## Línea 26

````text
// The transformed visual grows equally from both sides of its allocation.
````

## Línea 27

````text
// Keeping this calculation separate makes the hit area match the actual
````

## Línea 28

````text
// painted extent instead of an arbitrary oversized box.
````

## Línea 43

````text
// Exponential smoothing is independent of frame rate: a 60 Hz and a 144 Hz
````

## Línea 44

````text
// display converge with the same visual response time.
````

## Línea 53

````text
// extraExtents contain the visual width/height added by magnification. The
````

## Línea 54

````text
// selected icon remains anchored; every neighbour moves just enough to retain
````

## Línea 55

````text
// its gap with the next enlarged icon.
````
