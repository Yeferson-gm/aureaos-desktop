# Notas de extensions/dock/stylesheet.css

Comentarios trasladados durante la consolidación. Los números corresponden al archivo antes del traslado.

## Línea 40

````text
/* Disable all margins defined upstream, we handle them here */
````

## Línea 123

````text
/* Disable all margins defined upstream, we handle them here */
````

## Línea 214

````text
/* Disable all margins defined upstream, we handle them here */
````

## Línea 305

````text
/* Disable all margins defined upstream, we handle them here */
````

## Línea 395

````text
/* Disable all margins defined upstream, we handle them here */
````

## Línea 478

````text
/* Disable all margins defined upstream, we handle them here */
````

## Línea 569

````text
/* Disable all margins defined upstream, we handle them here */
````

## Línea 660

````text
/* Disable all margins defined upstream, we handle them here */
````

## Línea 750

````text
/* Disable all margins defined upstream, we handle them here */
````

## Línea 829

````text
/* Disable all margins defined upstream, we handle them here */
````

## Línea 916

````text
/* Disable all margins defined upstream, we handle them here */
````

## Línea 1003

````text
/* Disable all margins defined upstream, we handle them here */
````

## Línea 1089

````text
/* Disable all margins defined upstream, we handle them here */
````

## Línea 1168

````text
/* Disable all margins defined upstream, we handle them here */
````

## Línea 1255

````text
/* Disable all margins defined upstream, we handle them here */
````

## Línea 1342

````text
/* Disable all margins defined upstream, we handle them here */
````

## Línea 1410

````text
/* Scrollview style */
````

## Línea 1425

````text
/* macOS 27 profile: icons float directly on the desktop.  These rules live
 * after the upstream theme so no Dash-to-Dock variant can restore its shelf. */
````

## Línea 1441

````text
/* Customization of the progress bar style. The possible elements
     * are:
     *
     * -XXXXXX-YYYYYY: plain color
     * -XXXXXX-YYYYYY-color-start: start color for gradient
     * -XXXXXX-YYYYYY-color-end: end color for gradient
     * -XXXXXX-YYYYYY-offset-start: offset for start color in gradient (0-1)
     * -XXXXXX-YYYYYY-offset-end: offset for end color in gradient (0-1)
     * -XXXXXX-line-width: width value for the line used for the border
     *
     * XXXXXX can be either
     *
     *    progress-bar-track: the "track" over which the progress bar is shown
     *    progress-bar: the progress bar itself
     *
     * YYYYYY can be either
     *
     *    background: for the background color
     *    border: for the border color
     *
     * plain color entries have priority over gradients, so if both are set for
     * an element, the plain color will be used.
     *
     * Examples:
     *
     *  -progress-bar-track-background: rgba(128, 128, 0, 0.75);
     *  -progress-bar-track-border: rgba(0, 0, 255, 0.25);
     *
     *  -progress-bar-background: rgba(0, 204, 204, 1);
     *  -progress-bar-border: rgba(230, 230, 230, 1);
     *
     * Default values when these entries aren't set are equivalent to:
     *   -progress-bar-track-background-color-start: 64, 64, 64, 1.0
     *   -progress-bar-track-background-color-end: 89, 89, 89, 1.0
     *   -progress-bar-track-background-start-offset: 0.4
     *   -progress-bar-track-background-end-offset: 0.9
     *   -progress-bar-track-border-color-start: 128, 128, 128, 0.1
     *   -progress-bar-track-border-color-end: 89, 89, 89, 0.4
     *   -progress-bar-track-border-start-offset: 0.5
     *   -progress-bar-track-border-end-offset: 0.9
     *   -progress-bar-track-line-width: 1
     *   -progress-bar-background: 204, 204, 204, 1.0
     *   -progress-bar-border: 230, 230, 230, 1.0
     *   -progress-bar-height-factor: (0.20) 20% of the icon size
     *   -progress-bar-line-width: 1
     *   -progress-bar-top-offset: undefined
     *   -progress-bar-valign: 1.0
     *   -progress-bar-horizontal-padding: 0.05 (5% of icon size)
     *   -progress-bar-vertical-padding: 0.05 (5% of icon size)
     */
````

## Línea 1511

````text
/*
 * This is applied to a dummy actor. Only the alpha value for the background and border color
 * and the transition-duration are used
 */
````

## Línea 1520

````text
/*
 * This is applied to a dummy actor. Only the alpha value for the background and border color
 * and the transition-duration are used
 */
````

## Línea 1592

````text
/* ═══ macos27-v7:css ═══ estante de vidrio, etiquetas y menús estilo macOS ═══ */
````

## Línea 1594

````text
/* Estante de vidrio. La clase se repite para ganar a cualquier variante
   del tema (bottom/extended/shrink) sin tocarlas. */
````

## Línea 1611

````text
/* Sin degradado de desplazamiento: recortaría los iconos ampliados. */
````

## Línea 1617

````text
/* macOS no resalta el icono al pasar el cursor ni al estar enfocado. */
````

## Línea 1626

````text
/* El icono se atenúa mientras se pulsa. */
````

## Línea 1633

````text
/* Separadores finos de vidrio. */
````

## Línea 1643

````text
/* Etiqueta de nombre: burbuja oscura de vidrio sin flecha. */
````

## Línea 1659

````text
/* Menú contextual de la app y miniaturas de ventanas. */
````
