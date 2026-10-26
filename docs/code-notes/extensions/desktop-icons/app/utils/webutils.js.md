# Notas de extensions/desktop-icons/app/utils/webutils.js

Comentarios trasladados durante la consolidación. Los números corresponden al archivo antes del traslado.

## Línea 22

````text
/**
 *
 * @param message
 * @param bytes
 * @returns {{ok: boolean, error?: string}}
 */
````

## Línea 54

````text
/**
 *
 * @param url
 * @param timeoutMs
 * @param cancellable
 * @returns {Promise<{message: object, bytes: GLib.Bytes}>}
 */
````

## Línea 111

````text
/**
 *
 * @param file
 * @param bytes
 * @param cancellable
 */
````

## Línea 140

````text
/**
 *
 * @param archiveFile
 * @param extractDir
 * @param cancellable
 */
````

## Línea 151

````text
// Keep the tar fallback async in the app process so extraction does not
````

## Línea 152

````text
// block GNOME Shell when AutoAr is unavailable.
````

## Línea 186

````text
/**
 * Parse MIME parameters, including quoted filenames with escaped characters.
 *
 * @param {string} value advertised format
 * @returns {?object} media type and parameters, or null for malformed input
 */
````

## Línea 212

````text
/**
 * Identify HTML representations our decoder supports, retaining the offer token.
 *
 * @param {string[]} mimes advertised formats
 * @returns {string[]} supported HTML representations
 */
````

## Línea 226

````text
/**
 * Return every offered representation advertised as image content.
 *
 * @param {string[]} mimes advertised formats
 * @returns {string[]} image representation tokens
 */
````

## Línea 236

````text
/**
 * Return an explicitly supplied file-content name, never a download URL.
 *
 * @param {string} mime advertised format
 * @returns {?string} suggested name
 */
````

## Línea 248

````text
/**
 * Validate one complete HTTP(S) URL without interpreting arbitrary prose.
 *
 * @param {string} value candidate text
 * @returns {?string} trimmed URL
 */
````

## Línea 263

````text
// Invalid URI representations may still have a usable text fallback.
````

## Línea 268

````text
/**
 * Derive a readable name from a URL without fetching remote metadata.
 * Prefer the final path component and use the host for page-like URLs.
 *
 * @param {string} value web URL
 * @returns {?string} decoded path filename or host
 */
````

## Línea 288

````text
/**
 * Handle both browsers' UTF-8 and UTF-16 representations, with or without BOM.
 *
 * @param {Uint8Array} bytes representation data
 * @returns {object} encoding and decoded text
 */
````

## Línea 310

````text
/**
 * Extract the URL/title pair used by Mozilla and Netscape formats.
 *
 * @param {string} text decoded representation
 * @returns {?object} URL and title
 */
````

## Línea 319

````text
// More than one URL/title pair is ambiguous; never silently discard a URL.
````

## Línea 337

````text
/**
 * Conservatively extract a single explicit anchor without rendering HTML.
 * No scripts, resource fetching, or relative URL resolution are performed.
 *
 * @param {string} html bounded HTML fragment
 * @returns {?object} unambiguous web link and visible text/title
 */
````

## Línea 390

````text
/**
 * Retain DING's HTML redirect format, escaping all source-provided values.
 *
 * @param {string} url validated URL
 * @param {string} title optional title
 * @returns {string} HTML file contents
 */
````
