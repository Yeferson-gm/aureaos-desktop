# Notas de extensions/desktop-icons/app/utils/desktopIconsUtil.js

Comentarios trasladados durante la consolidación. Los números corresponden al archivo antes del traslado.

## Línea 35

````text
/**
     * Returs the Gtk Application ID
     */
````

## Línea 54

````text
/**
     *
     * Returns the Nautilus scripts directory as a Gio.File
     */
````

## Línea 117

````text
/**
     *
     * Returns the users Templates directory as a Gio.File
     */
````

## Línea 132

````text
/**
     * XDG user data dir for this app:
     *   $XDG_DATA_HOME/<app-id>  (usually ~/.local/share/<app-id>)
     *
     * @returns {Gio.File}
     */
````

## Línea 150

````text
/**
     * Widgets state file under the app data dir:
     *   $XDG_DATA_HOME/<app-id>/widgets.json
     *
     * @returns {Gio.File}
     */
````

## Línea 161

````text
/**
     *
     * @param {float} value number
     * @param {integer}  min number
     * @param {integer} max number
     */
````

## Línea 172

````text
/**
     *
     */
````

## Línea 178

````text
/* It's a must to remove the WAYLAND_SOCKET environment variable
            because, under Wayland, DING uses an specific socket to allow the
            extension to detect its windows. But the scripts must run under
            the normal socket */
````

## Línea 191

````text
/**
     *
     * @param {string} commandLine command to execute
     * @param {Array} environ child's environment, or <code>null</code>
     * to inherit parent's
     * @param {Function?} onChildExit callback for child exit
     */
````

## Línea 208

````text
/**
     *
     * @param {string} workdir working directory path
     * @param  {Array(String)} argv child's argument vector
     * @param {Array} environ child's environment, or <code>null</code> to
     * inherit parent's
     * @param {bool}  async or async execution
     * @param {Function?} onChildExit callback for child exit
     */
````

## Línea 218

````text
/* The following code has been extracted from GNOME Shell's
        * source code in Misc.Util.trySpawn function and modified to
        * set the working directory.
        *
        * https://gitlab.gnome.org/GNOME/gnome-shell/blob/gnome-3-30/js/misc/util.js
        */
````

## Línea 236

````text
/* Rewrite the error in case of ENOENT */
````

## Línea 243

````text
// The exception from gjs contains an error string like:
````

## Línea 244

````text
// Error invoking GLib.spawn_command_line_async: Failed to
````

## Línea 245

````text
// execute child process "foo" (No such file or directory)
````

## Línea 246

````text
// We are only interested in the part in the parentheses. (And
````

## Línea 247

````text
// we can't pattern match the text, since it gets localized.)
````

## Línea 261

````text
// Dummy child watch; we don't want to double-fork internally
````

## Línea 262

````text
// because then we lose the parent-child relationship, which
````

## Línea 263

````text
// can break polkit.
````

## Línea 264

````text
// See https://bugzilla.redhat.com//show_bug.cgi?id=819275
````

## Línea 274

````text
/**
     *
     * @param {float} x first x coordinate
     * @param {float} y first y coordinate
     * @param {float} x2 second x coordinate
     * @param {float} y2 second y coordinate
     * @returns {float} Distance between points
     */
````

## Línea 287

````text
/**
     *
     */
````

## Línea 315

````text
/**
     *
     * @param {Gio.VolumeMonitor} volumeMonitor A Gio.VolumeMonitor
     */
````

## Línea 366

````text
/**
     *
     * @param {string} filename Name of file
     * @param {object} opts Oject with boolean option keys
     */
````

## Línea 375

````text
/**
     * Extracts the original basename prefix from a Nautilus collision name.
     * Nautilus builds duplicate names from the unchanged basename, a
     * localized parenthesized copy tag, and the original file extension:
     * "Example" + " (copy)" + ".txt". The words and ordinal forms inside
     * the parentheses vary by locale, so this deliberately recognizes the
     * parenthesized structure instead of matching translated text.
     * For example, "Example (copy).txt" returns "Example".
     * An ordinary filename can have the same structure, so this is only a
     * placement heuristic. A false match cannot affect file names or data;
     * at worst, the pending drop position is lost and normal icon placement
     * is used, as it would be when no collision name can be recognized.
     *
     * @param {string} basename name chosen by Nautilus for the copied file
     * @returns {?string} basename before the copy suffix, or null when absent
     */
````

## Línea 401

````text
/**
     *
     * @param {Gio.File} file a file Gio
     * @param {stirng} contents file contents
     * @param {Gio.Cancellable} cancellable gio cancellable
     */
````

## Línea 408

````text
/* Promisify doesn't work with this */
````

## Línea 430

````text
/**
     *
     * @param {Gio.File} file a file Gio
     * @param {Gio.Cancellable} cancellable gio cancellable
     */
````

## Línea 465

````text
/**
     * Read up to `bytes` bytes from a Gio.File.
     * If fromTail == false: read from start of file.
     * If fromTail == true:  read the last `bytes` bytes of the file.
     *
     * @param {Gio.File} file a file Gio
     * @param {number} bytes number of bytes to read
     * @param {Gio.Cancellable?} cancellable gio cancellable
     * @param {boolean} fromTail read from tail if true else from start
     * @returns {Promise<Gio.Bytes>}
     */
````

## Línea 517

````text
// ignore close error
````

## Línea 544

````text
/* ignore */
````

## Línea 592

````text
/**
     * Check if a pdf file is encrypted
     *
     * @param {Gio.File} file a file Gio of pdf file
     * @param {Gio.Cancellable} cancellable gio cancellable
     * @returns boolean
     */
````

## Línea 628

````text
/**
     * Check if a zip file is encrypted
     *
     * @param {Gio.File} file a file Gio of zip file
     * @param {Gio.Cancellable} cancellable gio cancellable
     * @returns boolean
     */
````

## Línea 645

````text
// Zip Encryption single file archive
````

## Línea 646

````text
// Check if the 6th bit in the 7th byte (flag field) is set
````

## Línea 653

````text
// Multiple zip file archive- needs external checking
````

## Línea 676

````text
/**
     * Check if a 7z file is encrypted
     *
     * @param {Gio.File} file a file Gio of 7z file
     * @returns boolean
     */
````

## Línea 701

````text
/**
     *
     * @param {string} fileList text with list of Terminals, new line terminated
     * @returns {Array} an array of Gio.DesktopAppInfo for each desktop
     * entry in file
     */
````

## Línea 729

````text
/**
     *
     * @param {string} content text of the user-dirs.dirs file
     * @returns {string} path of Desktop Directory
     */
````

## Línea 750

````text
/**
     *
     * @param {string} text text to write in the file
     * @param {string} destinationDir path
     * @param {string} filename name of file
     * @param {Array(integer)} dropCoordinates coordiantes for the dropped file
     * @param {Gio.Cancellable} cancellable a Gio.Cancellable
     */
````

## Línea 785

````text
/**
     *
     * @param {string} fileUri The system file URI of the .desktop
     * file of the installed application
     *
     * @param {Array} dropCoordinates the drop cooordinates of the .desktop file
     *
     * Makes an executable .desktop file on the desktop with metadata set trusted.
     */
````

## Línea 876

````text
/**
     *
     * @param {Gtk.Window} window The window
     * @param {boolean} modal If the window should be modal
     */
````

## Línea 900

````text
/**
     *
     * @param {integer} ms milliseconds
     */
````

## Línea 914

````text
/**
     * Coordiantes are the same
     *
     * @param {Array(integer)} coordA coordinates
     * @param {Array(integer)} coordB coordinates
     * @returns {boolean} true or false
     */
````

## Línea 970

````text
/**
     * Read JSON from a file. Returns parsed object or null on error.
     *
     * @param {Gio.File} file File to read JSON from.
     * @param {Gio.Cancellable?} cancellable Optional cancellable for the read.
     * @returns {Promise<object|null>}
     */
````

## Línea 992

````text
/**
     * Write JSON to a file (pretty-printed).
     *
     * Mirrors writeTextFileToPath() by ensuring the parent dir via FileUtils.
     *
     * @param {Gio.File} file File to write JSON into.
     * @param {object} data Plain object to serialize as JSON.
     * @param {Gio.Cancellable?} cancellable Optional cancellable for the write.
     */
````

## Línea 1024

````text
/**
     * Keep a descriptive title, otherwise name the link from its URL.
     *
     * @param {string} title page title
     * @param {?string} url fallback URL
     * @returns {string} safe basename
     */
````

## Línea 1039

````text
/**
     * Save supplied file contents without overwriting or trusting executable data.
     *
     * @param {Gio.File} directory desktop directory
     * @param {object} data suggested name and owned bytes
     * @param {?object} pendingPlacement callbacks that register the candidate
     * basename with its pending desktop position
     * @returns {Promise<Gio.File>} created file
     */
````

## Línea 1079

````text
/**
     * Persist normalized contents produced by ContentReader.
     *
     * @param {Gio.File} directory target desktop directory
     * @param {DropContents} contents decoded transfer contents
     * @param {object} pendingPlacement callbacks that register each candidate
     * basename with its pending desktop position before the folder monitor can
     * observe the created file
     * @returns {Promise<boolean>} whether supported contents were written
     */
````

## Línea 1117

````text
// Serialize writes so duplicate titles get predictable suffixes.
````

## Línea 1141

````text
/**
     * Create collision-free symbolic links for a file-reference operation.
     *
     * @param {Gio.File} directory destination directory
     * @param {string[]} fileReferences source URIs
     * @param {?object} pendingPlacement optional desktop placement callbacks
     * @returns {Promise<Gio.File[]>} created symbolic links
     */
````

## Línea 1165

````text
/**
     * Create a uniquely named HTML link; optional metadata failures are nonfatal.
     *
     * @param {Gio.File} directory target desktop directory
     * @param {object} link validated URL and title
     * @param {?object} pendingPlacement callbacks that register the candidate
     * basename with its pending desktop position
     * @param {?string} customIconURI persistent custom-icon URI
     * @returns {Promise<Gio.File>} created file
     */
````
