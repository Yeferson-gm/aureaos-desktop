# Notas de extensions/desktop-icons/app/symLinkIcon.js

Comentarios trasladados durante la consolidación. Los números corresponden al archivo antes del traslado.

## Línea 47

````text
/*
                * This is a glib trick to detect broken symlinks. If a file is a
                * symlink, the filetype points to the final file, unless it is broken;
                * thus if the file type is SYMBOLIC_LINK, it must be a broken link.
                * https://developer.gnome.org/gio/stable/GFile.html#g-file-query-info
                */
````

## Línea 68

````text
/*
                * This is a glib trick to detect broken symlinks. If a file is a
                * symlink, the filetype points to the final file, unless it is broken;
                * thus if the file type is SYMBOLIC_LINK, it must be a broken link.
                * https://developer.gnome.org/gio/stable/GFile.html#g-file-query-info
                */
````

## Línea 148

````text
// A followed query fails when the target disappears. Read
````

## Línea 149

````text
// the link itself so its icon becomes a broken-link icon.
````
