# Notas de extensions/desktop-icons/app/fileItemIcon.js

Comentarios trasladados durante la consolidación. Los números corresponden al archivo antes del traslado.

## Línea 36

````text
// _reloadIconCancellable owns the full metadata refresh pipeline;
````

## Línea 37

````text
// _updateIconCancellable owns the low-level icon rendering pass.
````

## Línea 49

````text
/* Set the metadata */
````

## Línea 66

````text
/** *********************
     * Destroyers *
     ***********************/
````

## Línea 93

````text
/* Metadata */
````

## Línea 105

````text
/** *********************
     * Creators *
     ***********************/
````

## Línea 130

````text
/** TRANSLATORS: when using a screen reader, this is the text
             *  read when a folder is selected. Example: if a folder named
             * "things" is selected, it will say "things Folder" */
````

## Línea 138

````text
/** TRANSLATORS: when using a screen reader, this is the text
             * read when a normal file is selected. Example: if a file
             * named "my_picture.jpg" is selected, it will say
             * "my_picture.jpg File" */
````

## Línea 203

````text
// The outer reload path owns the final redraw, so keep the
````

## Línea 204

````text
// encryption helper from triggering a nested icon update here.
````

## Línea 291

````text
// File may have no password or null password, so we may still be
````

## Línea 292

````text
// able to read/display it. It will therefore have a generated
````

## Línea 293

````text
// thumbnail. Check by generating the thumbnail if needed.
````

## Línea 294

````text
// Don't show the locked item in this case, it is encrypted in pdf
````

## Línea 295

````text
// per pdf specification but a user can still read it.
````

## Línea 410

````text
/** *********************
     * Button Clicks *
     ***********************/
````

## Línea 435

````text
/** *********************
     * Drag and Drop *
     ***********************/
````

## Línea 468

````text
// Dragging a file/folder over itself or over another file will
````

## Línea 469

````text
// do nothing, allow drag to directory or valid desktop file
````

## Línea 544

````text
/** *********************
     * Icon Rendering *
     ***********************/
````

## Línea 598

````text
/** *********************
     * Class Methods *
     ***********************/
````

## Línea 653

````text
/*
         * we're marking as trusted, make the file executable too. Note that we
         * do not ever remove the executable bit, since we don't know who set
         * it.
         */
````

## Línea 869

````text
/** *********************
     * Getters and setters *
     ***********************/
````
