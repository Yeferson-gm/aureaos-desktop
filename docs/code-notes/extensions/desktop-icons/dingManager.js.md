# Notas de extensions/desktop-icons/dingManager.js

Comentarios trasladados durante la consolidación. Los números corresponden al archivo antes del traslado.

## Línea 90

````text
/**
     * Inits the Class
     */
````

## Línea 105

````text
/* The constructor of the window manager class only initializes some
         * internal properties, but nothing else. In fact, it has its own
         * enable() and disable() methods. That's why it could have been
         * created here, in init(). But since the rule seems to be NO CLASS
         * CREATION IN INIT UNDER NO CIRCUMSTANCES...
         */
````

## Línea 114

````text
/* Ensures that there aren't "rogue" processes.
         * This is a safeguard measure for the case of Gnome Shell being
         * relaunched (for example with Alt+F2 and R), to kill
         * any old DING instance before launching a new one.
         */
````

## Línea 123

````text
/**
     * Enables the extension
     */
````

## Línea 159

````text
// If the desktop is still starting up, we wait until it is ready
````

## Línea 172

````text
/**
     * The true code that configures everything and launches the desktop program
     */
````

## Línea 200

````text
/*
         * If the desktop geometry changes (because a new monitor has
            been added, for example),
         */
````

## Línea 210

````text
/*
         * Any change in the workareas must be detected too,
            for example if the used size changes.
         */
````

## Línea 220

````text
/*
         * This callback allows to detect a change in the
            working area (like when changing the Scale value)
         */
````

## Línea 230

````text
/*
         * Detect changes in the shell scale factor so desktop geometry is
         * refreshed whenever GNOME Shell changes scaling.
         */
````

## Línea 283

````text
/**
     * Disables the extension.
     *
     * For Gnome > 42 the extension runs with the
     * session mode 'unlock-dialog'. This allows the extension to keep running
     * when the lock screen comes on. This way, the programs spawned by
     * this extension keep running, rendering all the file icons on the desktop.
     * When the user logs back in the desktop is already rendered and running,
     * the desktop program is not killed on the lock-screen and then launced
     * again on unlock.
     *
     * If disable is called, it explictly kills the desktop program.
     * This will hapen on log out.
     */
````

## Línea 353

````text
/**
     * Acquire the DBus Name on the Session Bus
     *
     */
````

## Línea 376

````text
/**
     * Start the Dbus Service
     *
     * @param {GObject} connection the Dbus Connection
     */
````

## Línea 424

````text
/**
     * Start stop needed functions with screen locks and unlocks
     *
     * @param {GObject} connection the Dbus Connection
     * @param {string} sender the numeric Dbus Sender address
     * @param {string} path the Dbus Sender path
     * @param {string} iface the Sender Dbus interface
     * @param {string} signal the signal name
     * @param {GLib.variant} params the GLib.variant with parameters
     */
````

## Línea 446

````text
/**
     * Sends updated geometry data to the DING desktop program over DBus
     */
````

## Línea 460

````text
/**
     * Gets current desktop Geometry from visibleArea.js
     */
````

## Línea 494

````text
/**
     * Kills the current desktop program
     */
````

## Línea 503

````text
// kill the desktop program. It will be reloaded automatically.
````

## Línea 513

````text
/**
     * This function checks all the processes in the system and kills those
     * that are a desktop manager from the current user (but not others).
     * This allows to avoid having several ones in case gnome shell resets,
     * or other odd cases. It requires the /proc virtual filesystem, but
     * doesn't fail if it doesn't exist.
     */
````

## Línea 564

````text
/**
     *
     * @param {integer} reloadTime Relaunch time after crash in ms
     * @param {LaunchSubprocess} client Process owner requesting the relaunch
     */
````

## Línea 590

````text
/**
     * Launches the desktop program, passing to it the current desktop geometry
     * for each monitor and the path where it is stored. It also monitors it,
     * to relaunch it in case it dies or is killed. Finally, it reads STDOUT
     * and STDERR and redirects them to the journal, to help debug it.
     */
````

## Línea 600

````text
// Specify that it must work as true desktop
````

## Línea 602

````text
// The current Gnome Shell Version for correct operation of clipboard
````

## Línea 603

````text
// with Gtk4.
````

## Línea 606

````text
// The current version of the Extension to show in preferences
````

## Línea 609

````text
// Give the uuid of the extension starting the app
````

## Línea 638

````text
/*
        If the desktop process dies, wait 100ms and relaunch it, unless the
        exit status is different than zero, in which case it will wait one
        second. This is done this way to avoid relaunching the desktop
        too fast if it has a bug that makes it fail continuously,
        avoiding filling the journal too fast.
        */
````

## Línea 649

````text
// If the process is dying over and over again, ensure that it isn't
````

## Línea 650

````text
// respawn faster than once per second
````

## Línea 653

````text
// but if the process just died after having run for at least
````

## Línea 654

````text
// one second, reload it ASAP
````

## Línea 671

````text
/**
 * This class encapsulates the code to launch a subprocess and detect whether
 * a window belongs to it.
 *
 * It is compatible with-
 * https://gitlab.gnome.org/GNOME/mutter/merge_requests/754 to simplify the code
 *
 * @param {int} flags Flags for the SubprocessLauncher class
 * @param {string} process_id An string id for the debug output
 */
````

## Línea 707

````text
// New API introduced in
````

## Línea 708

````text
// https://gitlab.gnome.org/GNOME/mutter/-/merge_requests/4491
````

## Línea 716

````text
// Old APIs
````

## Línea 718

````text
// Previous API
````

## Línea 722

````text
// Oldest API
````

## Línea 727

````text
// workaround for bug in 3.38.0
````

## Línea 759

````text
// This is for GLib 2.68 or greater
````

## Línea 765

````text
/*
        This reads STDOUT and STDERR and sends it to the journal using
        global.log(). This allows to have any error from the desktop app in the
        same journal like other extensions. Every line from the desktop program
        is prepended with the "process_id" parameter sent in the constructor.
         */
````

## Línea 868

````text
/**
     * Queries whether the passed window belongs to the launched subprocess.
     *
     * @param {MetaWindow} window The window to check.
     */
````

## Línea 899

````text
// New Gnome 49 API
````

## Línea 910

````text
// New Gnome 49 API
````

## Línea 917

````text
/**
 * This class implements the Dbus Services Provided for the extension
 */
````

## Línea 1023

````text
// Mutter resets and destroys its drag actor when the grab ends.
````

## Línea 1024

````text
// Only reset our override while that same grab is still current;
````

## Línea 1025

````text
// never call methods on an actor retained from an earlier grab.
````

## Línea 1031

````text
// Workspace animations grab the persistent Shell stage. Never put a
````

## Línea 1032

````text
// drag cursor on that actor, or on another Shell modal grab: it can
````

## Línea 1033

````text
// outlive the drag and leave the cursor stuck across the desktop.
````

## Línea 1049

````text
/** This class simulates a hover on the Dock so that the dock app items
 * can be visible and scroll automatically on drops.
 */
````

## Línea 1114

````text
/** This class sets global keyboard acclelerators for our application
 */
````

## Línea 1118

````text
// Define default keybindings with their corresponding action
````
