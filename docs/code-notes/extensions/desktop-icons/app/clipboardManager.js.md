# Notas de extensions/desktop-icons/app/clipboardManager.js

Comentarios trasladados durante la consolidación. Los números corresponden al archivo antes del traslado.

## Línea 24

````text
// Public methods
````

## Línea 73

````text
// Clipboard management
````

## Línea 74

````text
// ******************************************************************** */
````

## Línea 75

````text
/*
     * Before Gnome Shell 40, St API couldn't access binary data in the
     * clipboard, only text data. Also, the original Desktop Icons was a pure
     * extension, so it was limited to what Clutter and St offered. That was
     * the reason why Nautilus accepted a text format for CUT and COPY
     * operations in the form:
     *
     *     x-special/nautilus-clipboard
     *     OPERATION
     *     FILE_URI
     *     [FILE_URI]
     *     [...]
     *
     * In Gnome Shell 40, St was enhanced and now it supports binary data;
     * that's why Nautilus migrated to a binary format identified by the atom
     * 'x-special/gnome-copied-files', where the CUT or COPY operation is
     * shared.
     *
     * To maintain compatibility, in the past, we checked the current Gnome
     * Shell version and, based on that, set the binary or the text clipboards.
     *
     * With the newer versions of gtk4-ding, we only set the binary version
     * and add other composite providers for the plain text versions like
     * the newer Nautilus/Files.
     */
````

## Línea 101

````text
/*
     * Publish one Gdk.ContentProvider union with these representations:
     *
     * x-special/gnome-copied-files: 'copy\nURI\n...' or 'cut\nURI\n...'
     * Gdk.FileList:                selected Gio.File objects
     * text/uri-list:               'URI\r\n...'
     * text/plain:                  '/path\n...'
     * text/plain;charset=utf-8:    '/path\n...'
     *
     * Text representations contain UTF-8 bytes for the same selection.
     */
````

## Línea 180

````text
// Capture the desktop anchor [globalX, globalY] before reading.
````

## Línea 258

````text
// Private methods
````

## Línea 295

````text
/*
     * Returns the content reader's promise; callers must await it.
     *
     * context = {
     *     formats: Gdk.ContentFormats,
     *     mimeTypes: string[],
     *     route: Enums.DndOfferRoute value,
     *     cancellable: Gio.Cancellable,
     * }
     *
     * Resolved contents use one of the shared ContentReader shapes:
     *
     * {type: 'file-references', references: URI-list string, format: MIME}
     * readClipboardContents() adds an isCut boolean to this shared shape:
     * true for explicit Cut, false for Copy or absent operation metadata.
     * Drop reads leave the shared shape unchanged.
     *
     * {type: 'web-links', links: [{url: string, title: string}],
     *  customIcon: GdkPixbuf.Pixbuf | null}
     *
     * {type: 'text', text: string}
     *
     * {type: 'file-content', name: string, bytes: GLib.Bytes}
     *
     * {type: 'unsupported', reason: string}
     */
````

## Línea 338

````text
// Returns ['file:///path', ...] for copied local files, otherwise null.
````

## Línea 381

````text
// Getters
````
