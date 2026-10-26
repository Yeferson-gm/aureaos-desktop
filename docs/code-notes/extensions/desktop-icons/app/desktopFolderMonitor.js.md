# Notas de extensions/desktop-icons/app/desktopFolderMonitor.js

Comentarios trasladados durante la consolidación. Los números corresponden al archivo antes del traslado.

## Línea 239

````text
// Finish before enumeration so a late clear cannot erase coordinates
````

## Línea 240

````text
// saved during placement. Never follow a link to its target.
````

## Línea 252

````text
// The file may have been removed before its metadata was cleared.
````

## Línea 258

````text
// use only CHANGES_DONE_HINT
````

## Línea 263

````text
// If the file is not visible, we don't need to refresh the desktop
````

## Línea 264

````text
// Unless it is a hidden file being renamed to visible
````

## Línea 272

````text
// Pending placement already discards inherited coordinates for
````

## Línea 273

````text
// DING-managed copies, moves, and links. Only files arriving from
````

## Línea 274

````text
// an out-of-band filesystem operation need generic cleanup.
````

## Línea 280

````text
/* The desktop is what changed, and not a file inside it */
````

## Línea 311

````text
// just notify that the files changed while being read from disk.
````

## Línea 455

````text
/* if there are hidden files in the desktop and the
                            user doesn't want to show them, remove the
                            coordinates. This ensures that if the user enables
                            showing them, they won't fight with other icons
                            for the same place
                            */
````

## Línea 462

````text
// only overwrite them if needed
````

## Línea 571

````text
// This file was created by the current drop. Copies and symbolic
````

## Línea 572

````text
// links can expose desktop-position metadata from their source;
````

## Línea 573

````text
// discard it so the current drop position takes precedence.
````
