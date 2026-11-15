# Notas de extensions/app-indicators/extension.js

Comentarios trasladados durante la consolidación. Los números corresponden al archivo antes del traslado.

## Línea 38

````text
// HACK: we want to leave the watchdog alive when disabling the extension,
````

## Línea 39

````text
// but if we are being reloaded, we destroy it since it could be considered
````

## Línea 40

````text
// a leak and spams our log, too.
````

## Línea 73

````text
// FIXME: when entering/leaving the lock screen, the extension might be
````

## Línea 74

````text
// enabled/disabled rapidly.
````

## Línea 75

````text
// This will create very bad side effects in case we were not done unowning
````

## Línea 76

````text
// the name while trying to own it again. Since g_bus_unown_name doesn't
````

## Línea 77

````text
// fire any callback when it's done, we need to monitor the bus manually
````

## Línea 78

````text
// to find out when the name vanished so we can reclaim it again.
````

## Línea 80

````text
// by the time we get called whe might not be enabled
````
