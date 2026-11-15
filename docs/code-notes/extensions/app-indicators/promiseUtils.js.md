# Notas de extensions/app-indicators/promiseUtils.js

Comentarios trasladados durante la consolidación. Los números corresponden al archivo antes del traslado.

## Línea 78

````text
/* Every time we call then() on this promise we'd get a new
         * CancellablePromise however that won't have the properties that the
         * root one has set, and then it won't be possible to cancel a promise
         * chain from the last one.
         * To allow this we keep track of the root promise, make sure that
         * the same method on the root object is called during cancellation
         * or any destruction method if you want this to work. */
````
