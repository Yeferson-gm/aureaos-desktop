# Notas de extensions/dock/utils.js

Comentarios trasladados durante la consolidación. Los números corresponden al archivo antes del traslado.

## Línea 15

````text
// Dash to dock supports replacing vfuncs in GObject classes and we need
````

## Línea 16

````text
// this to monkey them.
````

## Línea 26

````text
/**
 * Simplify global signals and function injections handling
 * abstract class
 */
````

## Línea 61

````text
// Convert arguments object to array, concatenate with generic
````

## Línea 62

````text
// Call addWithLabel with ags as if they were passed arguments
````

## Línea 107

````text
// Skip first element of the arguments
````

## Línea 143

````text
// Virtual methods to be implemented by subclass
````

## Línea 145

````text
/**
     * Create single element to be stored in the storage structure
     *
     * @param _object
     * @param _element
     * @param _callback
     */
````

## Línea 156

````text
/**
     * Correctly delete single element
     *
     * @param _item
     */
````

## Línea 165

````text
/**
     * Block single element
     *
     * @param _item
     */
````

## Línea 174

````text
/**
     * Unblock single element
     *
     * @param _item
     */
````

## Línea 194

````text
/**
 * Manage global signals
 */
````

## Línea 296

````text
/**
 * Color manipulation utilities
 */
````

## Línea 300

````text
// Darken or brigthen color by a fraction dlum
````

## Línea 301

````text
// Each rgb value is modified by the same fraction.
````

## Línea 302

````text
// Return "#rrggbb" string
````

## Línea 313

````text
// Convert decimal to an hexadecimal string adding the desired padding
````

## Línea 321

````text
// Convert hsv ([0-1, 0-1, 0-1]) to rgb ([0-255, 0-255, 0-255]).
````

## Línea 322

````text
// Following algorithm in https://en.wikipedia.org/wiki/HSL_and_HSV
````

## Línea 323

````text
// here with h = [0,1] instead of [0, 360]
````

## Línea 324

````text
// Accept either (h,s,v) independently or  {h:h, s:s, v:v} object.
````

## Línea 325

````text
// Return {r:r, g:g, b:b} object.
````

## Línea 369

````text
// Convert rgb ([0-255, 0-255, 0-255]) to hsv ([0-1, 0-1, 0-1]).
````

## Línea 370

````text
// Following algorithm in https://en.wikipedia.org/wiki/HSL_and_HSV
````

## Línea 371

````text
// here with h = [0,1] instead of [0, 360]
````

## Línea 372

````text
// Accept either (r,g,b) independently or {r:r, g:g, b:b} object.
````

## Línea 373

````text
// Return {h:h, s:s, v:v} object.
````

## Línea 408

````text
/**
 * Manage function injection: both instances and prototype can be overridden
 * and restored
 */
````

## Línea 431

````text
/**
 * Manage vfunction injection: both instances and prototype can be overridden
 * and restored
 */
````

## Línea 448

````text
// This may fail if trying to reset to a never-overridden vfunc
````

## Línea 449

````text
// as gjs doesn't consider it a function, even if it's true that
````

## Línea 450

````text
// originalVFunc instanceof Function.
````

## Línea 465

````text
// shexli-ci: EGO-I-004 - required to override vfuncs
````

## Línea 467

````text
// shexli-ci: EGO-I-004 - override vfuncs
````

## Línea 471

````text
// shexli-ci: EGO-I-004 - override vfuncs
````

## Línea 476

````text
/**
 * Manage properties injection: both instances and prototype can be overridden
 * and restored
 */
````

## Línea 524

````text
/**
 * Return the actual position reverseing left and right in rtl
 */
````

## Línea 538

````text
/**
 * @param cr
 * @param x
 * @param y
 * @param width
 * @param height
 * @param isRoundLeft
 * @param isRoundRight
 * @param stroke
 * @param fill
 */
````

## Línea 582

````text
/**
 * Convert a signal handler with n value parameters (that is, excluding the
 * signal source parameter) to an array of n handlers that are each responsible
 * for receiving one of the n values and calling the original handler with the
 * most up-to-date arguments.
 *
 * @param handler
 */
````

## Línea 608

````text
/**
 * Construct a map of gtk application window object paths to MetaWindows.
 */
````

## Línea 623

````text
/**
 * Re-implements shell_app_compare so that can be used to resort running apps
 *
 * @param appA
 * @param appB
 */
````

## Línea 661

````text
/**
 * Re-implements shell_app_compare_windows
 *
 * @param winA
 * @param winB
 */
````

## Línea 743

````text
/**
 *
 */
````

## Línea 750

````text
/**
 * Gets the cursor tracker, using the API available in the current
 * GNOME Shell version: `global.backend.get_cursor_tracker()` is only
 * available since GNOME Shell 48, while older versions require using
 * `Meta.CursorTracker.get_for_display()`.
 *
 * @returns {Meta.CursorTracker} The cursor tracker.
 */
````

## Línea 763

````text
/**
 * @param laterType
 * @param callback
 */
````

## Línea 772

````text
/**
 * @param id
 */
````

## Línea 782

````text
/**
 * Up to Gnome Shell 45, the Cairo Context object didn't export the
 * `setSourceColor()` method, so Clutter included a function call for
 * that, written in C. In Gnome Shell 46, the method was finally exported,
 * so that function was removed.
 *
 * This function is, thus, required for Gnome Shell 45 compatibility.
 *
 * @param {*} cr A cairo context
 * @param {*} sourceColor The new color for source
 */
````

## Línea 800

````text
/**
 * Specifies if the system supports extended barriers. This function
 * is required for Gnome Shell 45 compatibility, which used
 * `global.display.supports_extended_barriers`. Gnome Shell 46 moved
 * that into global.backend.capabilities.
 *
 * @returns True if the system supports extended barriers.
 */
````
