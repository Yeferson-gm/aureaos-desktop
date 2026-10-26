# Notas de extensions/dock/custom-effects/overflow-policy.js

Comentarios trasladados durante la consolidación. Los números corresponden al archivo antes del traslado.

## Línea 3

````text
/**
 * The slide container only needs a clip while the dock is moving through the
 * screen edge. Once fully shown, clipping would cut transformed icon content.
 *
 * @param {number} slideProgress value from 0 (hidden) to 1 (shown)
 * @returns {boolean} whether the slide viewport must clip its child
 */
````
