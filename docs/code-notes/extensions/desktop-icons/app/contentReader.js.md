# Notas de extensions/desktop-icons/app/contentReader.js

Comentarios trasladados durante la consolidación. Los números corresponden al archivo antes del traslado.

## Línea 9

````text
/**
 * Clipboard reads always add isCut: true for Cut, false for Copy.
 * Drop reads omit it and use the negotiated Gdk.DragAction instead.
 *
 * references and format describe the same representation:
 * - text/uri-list: a string of newline-separated file URIs.
 * - x-special/gnome-icon-list: a string of URIs with icon coordinates.
 * - x-special/ding-icon-list: URIs on the wire, normalized to Gdk.FileList.
 * format uses the corresponding Enums.DndTargetInfo value.
 *
 * @typedef {{
 *   type: 'file-references',
 *   references: string | Gdk.FileList,
 *   format: 'text/uri-list' | 'x-special/gnome-icon-list' |
 *     'x-special/ding-icon-list',
 *   isCut?: boolean
 * }} FileReferenceContents
 *
 * @typedef {{
 *   type: 'web-links',
 *   links: Array<{url: string, title: string}>,
 *   customIcon: ?GdkPixbuf.Pixbuf
 * }} WebLinkContents
 *
 * @typedef {{type: 'text', text: string}} TextContents
 *
 * @typedef {{
 *   type: 'file-content',
 *   name: string,
 *   bytes: GLib.Bytes
 * }} NewFileContents
 *
 * @typedef {{type: 'unsupported', reason: string}} UnsupportedDropContents
 *
 * @typedef {FileReferenceContents|WebLinkContents|TextContents|
 *   NewFileContents|UnsupportedDropContents} DropContents
 */
````

## Línea 47

````text
/**
 * Read the minimum representations needed for one content transfer.
 *
 * File routes read typed or textual file references. Browser text routes
 * prefer explicit URL metadata, then matching descriptions and HTML, then
 * URI-list and plain-text fallbacks. Standalone image or named binary
 * representations become file contents.
 *
 * After web links are identified, an offered image may separately provide
 * their optional custom icon.
 */
````

## Línea 66

````text
// Public methods
````

## Línea 68

````text
// Clipboard file references extend the shared shape with an isCut boolean.
````

## Línea 69

````text
// Copy/cut metadata supplies its value; references without it use false.
````

## Línea 70

````text
// Drops use readContents() and obtain their action from Gdk.DragAction.
````

## Línea 105

````text
// dragManager offers this MIME as bytes (including special icons),
````

## Línea 106

````text
// not necessarily as a typed Gdk.FileList.
````

## Línea 159

````text
// A missing optional icon must not prevent link creation.
````

## Línea 198

````text
// Private methods
````

## Línea 204

````text
// Transfer each textual representation at most once for this operation.
````

## Línea 306

````text
// Choose the most specific usable contents from the offered formats.
````

## Línea 435

````text
// Preserve the source encoding and animation.
````

## Línea 496

````text
// Classify the decoded representation for routing. Whether a filesystem
````

## Línea 497

````text
// action can actually be performed is decided by its downstream handler.
````
