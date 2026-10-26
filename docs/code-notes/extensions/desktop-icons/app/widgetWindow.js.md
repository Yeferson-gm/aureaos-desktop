# Notas de extensions/desktop-icons/app/widgetWindow.js

Comentarios trasladados durante la consolidación. Los números corresponden al archivo antes del traslado.

## Línea 24

````text
/**
     * Runtime adapter for one pinned widget window.
     *
     * The WidgetManager remains the canonical owner of widget geometry/state.
     * WidgetWindow only owns the Gtk.Window runtime host and reports runtime
     * events back to WidgetManager through explicit callbacks.
     *
     * Contract:
     * - This class is runtime-only. It does not own persistent widget state.
     * - It should be created only after WidgetManager has created inst.actor.
     * - The authoritative position/size remain in WidgetManager.
     * - The shell-side window type/stacking behavior is derived from the title
     *   string emitted here and enforced by windowTypeManager.
     *
     * @param {object} params
     * @param {object} params.widgetManager
     *   Canonical owner of the widget instance. Must provide:
     *   - getInstance(instanceId)
     *   - getInstanceFrame(instanceId)
     *   - beginPinnedEdit(instanceId)
     *   - beginPinnedWindowMove(instanceId, params)
     *   - setInstancePinned(instanceId, pinned)
     *   - optional pinned-window lifecycle callbacks
     * @param {object} params.mainApp
     *   Gtk.Application used to create a DING-owned Gtk.ApplicationWindow.
     * @param {string} params.instanceId
     *   The instance being hosted. Its actor must already exist before this
     *   runtime host is constructed and used.
     */
````

## Línea 76

````text
// -----------------------------------------------------------------
````

## Línea 77

````text
// Public API
````

## Línea 78

````text
// -----------------------------------------------------------------
````

## Línea 206

````text
// -----------------------------------------------------------------
````

## Línea 207

````text
// Private API
````

## Línea 208

````text
// -----------------------------------------------------------------
````

## Línea 306

````text
// The controls strip can be rebuilt while a press sequence is in flight.
````

## Línea 307

````text
// Only act on the current live move button that belongs to this overlay.
````

## Línea 503

````text
// Pinned widgets do not destroy themselves via the window close path.
````

## Línea 504

````text
// WidgetManager decides whether close means "unpin" or "remove".
````

## Línea 534

````text
// The strip itself is the drag handle for pinned windows.
````

## Línea 535

````text
// The move button only changes the visible affordance; it does not
````

## Línea 536

````text
// control whether the strip can start a window move.
````
