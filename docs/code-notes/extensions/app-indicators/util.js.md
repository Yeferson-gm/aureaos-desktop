# Notas de extensions/app-indicators/util.js

Comentarios trasladados durante la consolidación. Los números corresponden al archivo antes del traslado.

## Línea 99

````text
// GObject classes might or might not have a destroy signal
````

## Línea 100

````text
// JS Classes will not complain when connecting to non-existent signals
````

## Línea 110

````text
/**
 * Connect signals to slots, and remove the connection when either source or
 * target are destroyed
 *
 * Usage:
 *      Util.connectSmart(srcOb, 'signal', tgtObj, 'handler')
 * or
 *      Util.connectSmart(srcOb, 'signal', () => { ... })
 */
````

## Línea 166

````text
/**
 * Helper function to wait for the system startup to be completed.
 * Adding widgets before the desktop is ready to accept them can result in errors.
 */
````
