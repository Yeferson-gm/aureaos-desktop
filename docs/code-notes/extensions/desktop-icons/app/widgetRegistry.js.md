# Notas de extensions/desktop-icons/app/widgetRegistry.js

Comentarios trasladados durante la consolidación. Los números corresponden al archivo antes del traslado.

## Línea 18

````text
/*
 * Layout:
 *   $XDG_DATA_HOME/<app-id>/widgets/<widgetId>/widget.json
 *   $XDG_DATA_DIRS/.../<app-id>/widgets/<widgetId>/widget.json
 */
````

## Línea 48

````text
// id -> descriptor
````

## Línea 58

````text
// ---------------------------------------------------------------------
````

## Línea 59

````text
// Public API
````

## Línea 60

````text
// ---------------------------------------------------------------------
````

## Línea 68

````text
/**
     * Get a snapshot of all known widgets.
     *
     * @returns {Promise<Array<object>>}
     */
````

## Línea 80

````text
/**
     * Look up a widget descriptor by ID.
     *
     * Descriptor shape:
     * {
     *   id: string,
     *   name: string,
     *   kind: 'html' | 'gtk',
     *   dir: Gio.File,
     *   manifestFile: Gio.File,
     *   isUser: boolean,
     *   defaultWidth: number | null,
     *   defaultHeight: number | null,
     *   defaultConfig: object | null,
     *   "name_localized": {
     *     "fr": "Horloge analogique"
     *   },
     *   description: "A simple analog clock widget.",
     *   "description_localized": {
     *     "fr": "Un widget d'horloge analogique simple."
     *   },
     *   category: "time",
     *   author: "Sundeep Mediratta",
     *   version: "1.0",
     *   homepage: "https://…",
     *   license: "GPL-3.0-or-later",
     *   pinnable: boolean,
     *   chrome: {
     *     showCloseButton: boolean,
     *     showPrefsButton: boolean,
     *     showMoveButton: boolean,
     *     showPinButton: boolean
     *   }
     * }
     *
     * @param {string} id Widget identifier
     * @returns {Promise<object|null>}
     */
````

## Línea 127

````text
/*
     * Get widget kind ('html' | 'gtk')
     *
     * @param {string} id Widget identifier
     * @returns {Promise<'html'|'gtk'>}
     */
````

## Línea 138

````text
/**
     * For HTML widgets, return the entry file (always index.html).
     *
     * @param {string} id Widget identifier
     * @returns {Promise<Gio.File|null>}
     */
````

## Línea 177

````text
// ---------------------------------------------------------------------
````

## Línea 178

````text
// Internal
````

## Línea 179

````text
// ---------------------------------------------------------------------
````

## Línea 197

````text
// User root: $XDG_DATA_HOME/<app-id>/widgets
````

## Línea 205

````text
// System roots: for each XDG data dir, <dir>/<app-id>/widgets
````

## Línea 226

````text
// Idempotent
````

## Línea 258

````text
/**
     * Async scan of a single root dir:
     *   <root>/<widgetId>/widget.json
     *
     * @param {Gio.File} root
     * @param {boolean} isUser
     * @param {Map<string,object>} outMap
     */
````

## Línea 333

````text
// ID must come from widget.json and must be valid.
````

## Línea 421

````text
// Resolve duplicates deterministically;
````

## Línea 422

````text
// log each duplicated id only once.
````

## Línea 618

````text
// Resolve argv[0] to an absolute path if it isn't already.
````
