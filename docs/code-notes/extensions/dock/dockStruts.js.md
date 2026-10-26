# Notas de extensions/dock/dockStruts.js

Comentarios trasladados durante la consolidación. Los números corresponden al archivo antes del traslado.

## Línea 1

````text
// Reserved-extent export for dash-to-dock.
````

## Línea 2

````text
//
````

## Línea 3

````text
// dash-to-dock publishes the space its dock occupies on each monitor so other
````

## Línea 4

````text
// extensions can avoid placing their own UI underneath it. The case that
````

## Línea 5

````text
// motivates this is a BOTTOM dock in auto-hide/overlay mode: it claims no
````

## Línea 6

````text
// mutter strut (so the work area does not shrink for it), yet it slides out
````

## Línea 7

````text
// over the bottom of the work area, so a pill or OSD placed at the work
````

## Línea 8

````text
// area's bottom edge ends up hidden behind the dock.
````

## Línea 9

````text
//
````

## Línea 10

````text
// While dash-to-dock is enabled, the read-only `DashToDockStruts` view is
````

## Línea 11

````text
// published as `Main.layoutManager.dashToDockStruts` (a property of the
````

## Línea 12

````text
// mutable LayoutManager singleton, not of the frozen `Main` module namespace)
````

## Línea 13

````text
// and nulled again on disable. Consumers:
````

## Línea 14

````text
//
````

## Línea 15

````text
//   - check for its presence;
````

## Línea 16

````text
//   - read `monitors`, keyed by monitor index, where each entry is
````

## Línea 17

````text
//     `{side, x, y, width, height, affectsStruts}`;
````

## Línea 18

````text
//   - connect to `updated`, which carries the changed monitor index (or -1
````

## Línea 19

````text
//     for all monitors), and rely on `connectObject()` to auto-disconnect
````

## Línea 20

````text
//     their handlers on `destroy`, since the type is registered with the
````

## Línea 21

````text
//     shell's SignalTracker as destroyable.
````

## Línea 22

````text
//
````

## Línea 23

````text
// `side` is the raw `St.Side` enum, never a string, and `affectsStruts` says
````

## Línea 24

````text
// whether the dock claims a real mutter strut (dock-fixed mode). A consumer
````

## Línea 25

````text
// should reserve the extent only when `affectsStruts` is false; otherwise the
````

## Línea 26

````text
// work area already excludes it.
````

## Línea 27

````text
//
````

## Línea 28

````text
// The published extent is the dock's full-size rectangle - where it would be
````

## Línea 29

````text
// when fully shown - regardless of whether it is currently auto-hidden, so
````

## Línea 30

````text
// consumers reserve the space even while the dock is hidden and are never
````

## Línea 31

````text
// covered when it slides out. A dock-fixed dock already claims a mutter
````

## Línea 32

````text
// strut, so its extent coincides with (or sits inside) the work-area edge;
````

## Línea 33

````text
// reserving it is harmless either way.
````

## Línea 41

````text
/**
 * Read-only view of the space dash-to-dock reserves on each monitor.
 *
 * Published as `Main.layoutManager.dashToDockStruts` while the extension is
 * enabled. It is backed by a private {@link StrutsManager} owned by the
 * DockManager; consumers only read `monitors` and connect to `updated` and
 * `destroy`.
 */
````

## Línea 62

````text
/**
     * The per-monitor reserved extents, keyed by monitor index.
     *
     * Each entry is `{side, x, y, width, height, affectsStruts}` in global
     * coordinates. The object is frozen and replaced whenever it changes.
     *
     * @type {Readonly<Record<number, object>>}
     */
````

## Línea 85

````text
/** The snapshot exposed through `this.struts.monitors`. */
````

## Línea 90

````text
/**
     * Set or clear the reserved extent for the dock on a monitor.
     *
     * The extent is the dock's full-size rectangle, independent of its
     * current slide offset, so callers may push it on every geometry update:
     * only genuine changes are published.
     *
     * @param {number} monitorIndex - the monitor the dock is on.
     * @param {object|null} extent - `{side, x, y, width, height,
     *     affectsStruts}` in global coordinates, or `null` to drop the entry.
     */
````

## Línea 136

````text
/**
     * Rebuild the frozen snapshot and notify.
     *
     * @param {number} monitorIndex - the changed monitor, or -1 for all.
     */
````
