# Notas de extensions/desktop-icons/app/widgetWebContext.js

Comentarios trasladados durante la consolidación. Los números corresponden al archivo antes del traslado.

## Línea 54

````text
/**
 * WebWidgetContext
 *
 * Single runtime for all HTML widgets:
 *  - Owns shared WebKit.WebContext and WebKit.UserContentManager.
 *  - Injects WIDGET_API (window.ding) into all frames.
 *  - Receives script messages ("dingWidget") and parses JSON payloads.
 *  - Delegates semantics to WidgetManager (config, host state, prefs).
 *
 * Lifetime:
 *  - Created lazily by WidgetManager when the first HTML widget is created.
 *  - Destroyed explicitly by WidgetManager when the last HTML widget is removed.
 */
````

## Línea 95

````text
// ---------------------------------------------------------------------
````

## Línea 96

````text
// Public WebKit runtime access
````

## Línea 97

````text
// ---------------------------------------------------------------------
````

## Línea 144

````text
/*
     * Create a WebView for a widget instance and bind its FS root.
     *
     * @param {string} widgetId   - logical widget ID (e.g. 'weather')
     * @param {string} instanceId - UUID-like instance ID
     * @param {Gio.File} rootDir  - widget bundle root directory
     */
````

## Línea 152

````text
// Ensure runtime is set up before constructing a view.
````

## Línea 165

````text
// Per-view FS jail root (we ignore URL host in scheme handler)
````

## Línea 246

````text
// ---------------------------------------------------------------------
````

## Línea 247

````text
// Preferences window helpers (called from WidgetManager)
````

## Línea 248

````text
// ---------------------------------------------------------------------
````

## Línea 250

````text
/**
     * Open or focus the preferences window for a given instance.
     *
     *  - Only one prefs window at a time (shared runtime).
     *  - Only opens if that instance is currently selected.
     *  - If already open for another instance, closes and reopens for this one.
     *
     * WidgetManager should:
     *  - Calls this in response to gear-icon click for the selected widget.
     *  - Calls closePreferencesForInstance() or closePreferencesIfForInstance()
     *    when unselecting/destroying the widget.
     *
     * @param {string} instanceId
     * @param {string} prefsUri
     */
````

## Línea 269

````text
// Only for currently selected instance
````

## Línea 367

````text
// ---------------------------------------------------------------------
````

## Línea 368

````text
// Internal: WebKit runtime setup
````

## Línea 369

````text
// ---------------------------------------------------------------------
````

## Línea 396

````text
// Shared WebKit plumbing: one WebContext, one UserContentManager
````

## Línea 416

````text
// default JS world
````

## Línea 418

````text
// Register script message handler for window.ding → "dingWidget"
````

## Línea 498

````text
// ---------------------------------------------------------------------
````

## Línea 499

````text
// Internal: JS API bridge (window.ding)
````

## Línea 500

````text
// ---------------------------------------------------------------------
````

## Línea 502

````text
// Debug Helpers
````

## Línea 535

````text
// Script Handler
````

## Línea 561

````text
// stringify objects
````

## Línea 604

````text
// Log messages are always allowed through
````

## Línea 663

````text
// Delegate semantics to WidgetManager, reusing its existing helpers.
````

## Línea 677

````text
// Broadcast so widget + prefs can update live
````

## Línea 767

````text
// Widgets may remove only themselves.
````

## Línea 814

````text
// Unknown message type; ignore for now
````

## Línea 819

````text
// Script Helpers
````

## Línea 821

````text
// Ensure the JSAPI Promise resolves/rejects; otherwise it hangs.
````

## Línea 897

````text
// Iterate through the items
````

## Línea 912

````text
// Match by either the ID (StockAction) or by text keywords
````

## Línea 1093

````text
// WebKit may serialize custom local-scheme fetches with an
````

## Línea 1094

````text
// opaque/null origin. For our jailed widget bundle scheme, the
````

## Línea 1095

````text
// bound WebView+instance root checks are the actual security
````

## Línea 1096

````text
// boundary, so allow the local response through here.
````

## Línea 1143

````text
// For rate-limited widget resource requests, return a tiny successful
````

## Línea 1144

````text
// response instead of an explicit error so a bad widget is less likely to
````

## Línea 1145

````text
// escalate into a retry/error storm that overwhelms the host.
````

## Línea 1173

````text
// For missing bundled widget assets, return an HTTP-style 404 response
````

## Línea 1174

````text
// instead of a scheme error so WebKit can treat the failure like a normal
````

## Línea 1175

````text
// missing resource rather than surfacing it as a generic access-control
````

## Línea 1176

````text
// problem for custom-scheme fetches.
````

## Línea 1269

````text
/* -----------------------------------------------------------------
    * Instance roots and FS isolation
    * -----------------------------------------------------------------*/
````

## Línea 1296

````text
/*
     * URI scheme handler for ding-widget://instanceId/path
    */
````

## Línea 1343

````text
// Basic parse: ding-widget://<instanceId>/<relPath>
````

## Línea 1404

````text
// Extra guard: ensure the bound root on the WebView matches registry
````

## Línea 1425

````text
// Normalize relPath:
````

## Línea 1426

````text
//  - treat URI path as widget-root-relative (strip leading "/")
````

## Línea 1427

````text
//  - strip leading "./" segments (so "./clock.css" works)
````

## Línea 1439

````text
// Lexical confinement: canonicalize +
````

## Línea 1440

````text
// prefix check to block "../" traversal.
````

## Línea 1482

````text
// Symlink confinement: reject symlinks anywhere
````

## Línea 1483

````text
// in the path (NOFOLLOW_SYMLINKS).
````

## Línea 1523

````text
// Guess MIME type using filename + data,
````

## Línea 1524

````text
// but then *force* sane types for HTML/CSS/JS.
````

## Línea 1540

````text
// Force explicit types by extension – important for the main HTML.
````
