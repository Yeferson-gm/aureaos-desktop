# Notas de extensions/desktop-icons/utils/fileUtils.js

Comentarios trasladados durante la consolidación. Los números corresponden al archivo antes del traslado.

## Línea 29

````text
/**
 *
 * @param dir
 * @param cancellable
 * @param priority
 * @param queryAttributes
 */
````

## Línea 45

````text
// The enumerator doesn't support multiple async calls, nor
````

## Línea 46

````text
// we can predict how many they will be, so using Promise.all
````

## Línea 47

````text
// isn't an option here, thus we just need to await each batch
````

## Línea 63

````text
/**
 * Enumerate a directory, treating a missing directory as empty.
 *
 * @param dir
 * @param cancellable
 * @param priority
 * @param queryAttributes
 */
````

## Línea 89

````text
/**
 *
 * @param dir
 * @param deleteParent
 * @param cancellable
 * @param priority
 */
````

## Línea 108

````text
/**
 *
 * @param file
 * @param info
 * @param cancellable
 * @param priority
 */
````

## Línea 135

````text
/**
 *
 * @param file
 * @param cancellable
 * @param priority
 */
````

## Línea 156

````text
/**
 * Create missing parents before the requested directory. An already-existing
 * target still raises EXISTS, preserving the contract used by existing callers.
 *
 * @param dir
 * @param cancellable
 * @param priority
 */
````

## Línea 186

````text
// Another creator may have completed this directory while we awaited its parent.
````

## Línea 192

````text
/**
 * Split a filename, preserving the project's compound archive extensions.
 *
 * @param filename
 * @param opts
 */
````

## Línea 220

````text
/**
 * Generate a collision candidate using the desktop's existing numbered suffix.
 *
 * @param filename
 * @param index
 */
````

## Línea 233

````text
/**
 * Create without overwriting; keep owned GBytes alive through partial writes.
 *
 * @param file
 * @param bytes
 * @param cancellable
 */
````

## Línea 255

````text
// Cleanup must still run if the operation was cancelled.
````

## Línea 259

````text
// Preserve the original write/close error.
````

## Línea 266

````text
/**
 * Create a file with a safe single-component name, retrying atomic collisions.
 * The caller remains responsible for sanitizing untrusted display names.
 *
 * @param directory
 * @param filename
 * @param bytes
 * @param cancellable
 * @param creationObserver optional callbacks for collision candidates.
 * `beforeCreate(file)` runs before exclusive creation and returns an ownership
 * marker. If that candidate fails, `creationFailed(file, marker)` receives the
 * same marker so the caller can undo only that attempt's registration.
 * @returns {Promise<Gio.File>} created file
 */
````

## Línea 303

````text
// A collision may be a basename already registered by an earlier
````

## Línea 304

````text
// file in this batch. Only undo what this attempt registered.
````

## Línea 312

````text
/**
 * Create a symbolic link without overwriting, retrying atomic collisions.
 *
 * @param directory destination directory
 * @param source source Gio.File
 * @param cancellable
 * @param creationObserver optional callbacks matching createUniqueFile()
 * @returns {Gio.File} created symbolic link
 */
````

## Línea 346

````text
/**
 * Write a string attribute and verify its per-attribute result.
 *
 * @param file
 * @param attribute
 * @param value
 * @param cancellable
 * @param priority
 * @param queryFlags
 */
````

## Línea 366

````text
/**
 * Store the initial drop position for a newly created file; null leaves it unset.
 *
 * @param file
 * @param coordinates
 * @param cancellable
 * @param priority
 */
````

## Línea 381

````text
/**
 *
 * @param source
 * @param destination
 * @param cancellable
 */
````

## Línea 411

````text
/**
 *
 * @param source
 * @param destination
 * @param cancellable
 */
````

## Línea 440

````text
/**
 *
 * @param sourceDir
 * @param destinationDir
 * @param cancellable
 */
````

## Línea 465

````text
/**
 *
 * @param rootDir
 * @param targetName
 * @param cancellable
 * @returns {Promise<Gio.File|null>}
 */
````

## Línea 499

````text
/**
 * Sanitize an untrusted filename with space for collision suffixes.
 *
 * @param value
 * @param fallback
 */
````

## Línea 514

````text
// Leave room below NAME_MAX for the extension and collision suffix in UTF-8.
````
