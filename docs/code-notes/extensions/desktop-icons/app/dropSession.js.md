# Notas de extensions/desktop-icons/app/dropSession.js

Comentarios trasladados durante la consolidación. Los números corresponden al archivo antes del traslado.

## Línea 6

````text
// DropSession sync session state and managment
````

## Línea 7

````text
//   inspect formats
````

## Línea 8

````text
//   → choose route
````

## Línea 9

````text
//   → classify ambiguous URI list
````

## Línea 10

````text
//   → apply destination policy
````

## Línea 11

````text
//   → advertise action
````

## Línea 12

````text
//   → capture stable context on drop for reading contents
````

## Línea 14

````text
// ContentReader reads only one stable transfer context
````

## Línea 15

````text
//   read only required representations
````

## Línea 16

````text
//   → combine matching browser metadata
````

## Línea 17

````text
//   → decode into one small DropContents shape
````

## Línea 18

````text
//   → optionally create a custom link icon
````

## Línea 20

````text
// DesktopGrid
````

## Línea 21

````text
//   receive DropContents
````

## Línea 22

````text
//   → perform the selected action
````

## Línea 23

````text
//   → finish the original Gdk.Drop
````

## Línea 25

````text
// DragManager / utilities
````

## Línea 26

````text
//   perform filesystem operations and write accepted content
````

## Línea 30

````text
/**
 * Negotiate one drop without reading unnecessary representations.
 *
 * 1. Choose an initial route from the advertised formats.
 * 2. If text/uri-list is the only decisive format, read and classify it
 *    during hover as web links, file references, or unsupported.
 * 3. Apply destination policy and advertise the selected action.
 * 4. Capture stable drop state when the drop is accepted.
 *
 * The hover-time URI-list result is retained so accepted-drop processing
 * does not transfer the same representation again.
 */
````

## Línea 61

````text
// Public drop-target API. The grid forwards GTK events here while the
````

## Línea 62

````text
// session owns the current drop, its destination, and its advertised action.
````

## Línea 93

````text
/**
     * Read all contents offered by one accepted drop.
     *
     * @param {object} context immutable state captured for the accepted drop
     * @returns {Promise<DropContents>} fully decoded contents
     */
````

## Línea 148

````text
// Private methods
````

## Línea 150

````text
// Current-drop ownership is established once, including the offered
````

## Línea 151

````text
// formats, cancellation scope, initial route, and grid movement policy.
````

## Línea 229

````text
// Negotiation classifies the cached formats, applies destination policy,
````

## Línea 230

````text
// chooses an action, and advertises that action on the current Gdk.Drop.
````

## Línea 248

````text
// Cleanup disconnects cancellation before cancelling I/O, then clears every
````

## Línea 249

````text
// reference owned by the current drop in one place.
````

## Línea 286

````text
// Context capture freezes the decisions and values used after GTK's drop
````

## Línea 287

````text
// callback returns. GDK, Gio, and file-item objects retain their identity.
````

## Línea 411

````text
// Reader delegation is the only place where the session knows how drop
````

## Línea 412

````text
// representations are transferred and decoded. The reader receives one
````

## Línea 413

````text
// captured context and never reads mutable session state.
````

## Línea 418

````text
// Getters
````

## Línea 420

````text
// Getters expose the current synchronous state. `dropContext` is the one
````

## Línea 421

````text
// exception: it returns a frozen snapshot for the asynchronous drop chain.
````
