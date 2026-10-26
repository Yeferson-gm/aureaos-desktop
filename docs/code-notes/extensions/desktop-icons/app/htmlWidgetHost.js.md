# Notas de extensions/desktop-icons/app/htmlWidgetHost.js

Comentarios trasladados durante la consolidación. Los números corresponden al archivo antes del traslado.

## Línea 24

````text
/**
     * @param {object} params
     *   {
     *     instanceId: string,
     *     widgetId: string,
     *     frameRect: {x, y, width, height},
     *     mainApp: Adw.Application | null,
     *     widgetRegistry: WidgetRegistry | null,
     *     webContext: WebKit.WebContext,
     *     mode: 'prefs' or 'widget'
     *     prefsUri: string relative uri
     *   }
     */
````

## Línea 208

````text
// Reparenting an HTML widget between the desktop container and a floating
````

## Línea 209

````text
// widget window can leave WebKit visually blank even though the WebView is
````

## Línea 210

````text
// still mapped, sized, and otherwise healthy. A full reload reliably
````

## Línea 211

````text
// rebuilds WebKit's render/compositing state for the new parent chain.
````

## Línea 280

````text
// ─────────────────────────
````

## Línea 281

````text
// start orchestration
````

## Línea 282

````text
// ─────────────────────────
````

## Línea 411

````text
// Host-side “poke”: invalidate + optional JS nudge
````

## Línea 522

````text
/**
 * DingRoundedClip
 *
 * A tiny single-child container that clips its child to a rounded rect
 * using GTK4 snapshot APIs (push_rounded_clip).
 *
 * Intended to be used as the "frame" root for WebKitWebView so that GTK CSS
 * border-radius matches the child's visible corners without visual
 * artifacts as CSS is not clipping the webview's contents with a box or frame.
 */
````

## Línea 553

````text
// ─────────────────────────
````

## Línea 554

````text
// properties
````

## Línea 555

````text
// ─────────────────────────
````

## Línea 570

````text
// ─────────────────────────
````

## Línea 571

````text
// child management
````

## Línea 572

````text
// ─────────────────────────
````

## Línea 594

````text
// ─────────────────────────
````

## Línea 595

````text
// layout
````

## Línea 596

````text
// ─────────────────────────
````

## Línea 611

````text
// ─────────────────────────
````

## Línea 612

````text
// rendering
````

## Línea 613

````text
//
````

## Línea 614

````text
// Snapshot is called by GTK4 to render the widget inside the clipped area.
````

## Línea 615

````text
// ─────────────────────────
````
