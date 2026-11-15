# Notas de extensions/caffeine/extension.js

Comentarios trasladados durante la consolidación. Los números corresponden al archivo antes del traslado.

## Línea 131

````text
// App trigger signal IDs
````

## Línea 137

````text
// DBus proxies
````

## Línea 155

````text
// Update state when extension settings changed
````

## Línea 174

````text
// Update state when fullscreened
````

## Línea 177

````text
// Init mpris
````

## Línea 180

````text
// Update when possible app triggers change
````

## Línea 197

````text
// Only connect to relevant signals for the selected trigger
````

## Línea 294

````text
// Find any selected apps that meet the trigger
````

## Línea 310

````text
// Save any responsible app and update reasons
````

## Línea 320

````text
// Remove any inhibitor, as settings / inhibit flags may have changed
````

## Línea 325

````text
// Update state, as normal
````

## Línea 330

````text
// Get the reasons for inhibiting
````

## Línea 333

````text
// If any ignored reasons are no longer active, stop ignoring them
````

## Línea 336

````text
// Ignore any reasons in the ignore list, then save them
````

## Línea 341

````text
/* If no trigger app is running, and the light is in app-only mode,
           and we left it blocked, unblock it
        */
````

## Línea 352

````text
// Update inhibitor if required
````

## Línea 361

````text
// Update night light if required
````

## Línea 363

````text
// If this._tempManageLight is true we're actually disabling
````

## Línea 365

````text
// Block night light
````

## Línea 368

````text
// Allow night light
````

## Línea 373

````text
// Let indicator know that either the state or reasons may have changed
````

## Línea 376

````text
// Remove any night light management override now the signal is done
````

## Línea 381

````text
// Decide whether to allow screen blanking
````

## Línea 389

````text
// Inhibit suspending the session or computer
````

## Línea 392

````text
// Inhibit the session being marked as idle
````

## Línea 396

````text
// Pack the parameters for DBus
````

## Línea 405

````text
// Synchronously add the inhibitor
````

## Línea 417

````text
// Remove the inhibitor if it's active
````

## Línea 419

````text
// Use the cookie to remove the inhibitor
````

## Línea 438

````text
// Don't bother checking settings if it's overridden
````

## Línea 443

````text
// Decide if we should control the night light from user preference
````

## Línea 494

````text
// Icons
````

## Línea 511

````text
// Set up entry
````

## Línea 514

````text
// Add elements
````

## Línea 518

````text
// Add an entry-point for more settings
````

## Línea 522

````text
// Ensure the settings are unavailable when the screen is locked
````

## Línea 526

````text
// Init Timers
````

## Línea 530

````text
// Bind signals
````

## Línea 547

````text
// Set menu visibility
````

## Línea 554

````text
// Get duration list and add '0' for the 'infinite' entry (no timer)
````

## Línea 558

````text
// Create menu timer
````

## Línea 600

````text
// Select active duration
````

## Línea 602

````text
// Set default duration to 0
````

## Línea 642

````text
// Add indicator label for the timer
````

## Línea 650

````text
// Icons
````

## Línea 662

````text
// Init Timers
````

## Línea 667

````text
// Show icon
````

## Línea 670

````text
// Quick Settings
````

## Línea 679

````text
// Bind settings signals
````

## Línea 706

````text
// Change user state on icon scroll event
````

## Línea 722

````text
// Init position and index of indicator icon
````

## Línea 727

````text
// Add indicator and toggle
````

## Línea 736

````text
// Setup inhibitor manager
````

## Línea 740

````text
// Set manager user state and restore user state, if required
````

## Línea 743

````text
// Restore Caffeine as enabled (fake a user click)
````

## Línea 747

````text
// Connect command line toggle
````

## Línea 770

````text
// Pass the new user state to the inhibitor manager, causes state to invert
````

## Línea 775

````text
// Enable timer when toggled on and duration is set
````

## Línea 780

````text
// Enable timer when toggled off
````

## Línea 800

````text
// Count visible items in the status area
````

## Línea 817

````text
// Skip invisible indicator
````

## Línea 828

````text
// Always reset index to 0 on position 0
````

## Línea 833

````text
// Update last position
````

## Línea 836

````text
// Update indicator index
````

## Línea 859

````text
// Reset timer
````

## Línea 863

````text
// Get duration
````

## Línea 866

````text
// Execute Timer only if duration isn't set on infinite time
````

## Línea 878

````text
// Disable Caffeine when timer ended
````

## Línea 892

````text
// Print Timer in system Indicator and Toggle menu subLabel
````

## Línea 901

````text
// End timer
````

## Línea 904

````text
// Flush and hide timer label
````

## Línea 908

````text
// Remove timer
````

## Línea 933

````text
// Undo natural scrolling inversions (available on GNOME 49+)
````

## Línea 955

````text
// User state on - UP
````

## Línea 961

````text
// Stop timer
````

## Línea 963

````text
// User state off - DOWN
````

## Línea 971

````text
// Update the tracked state
````

## Línea 975

````text
// Sync command state
````

## Línea 978

````text
// Update the visual state and subtitle
````

## Línea 983

````text
// Send an OSD notification, if enabled and state changed
````

## Línea 991

````text
// Update indicator, icon and subtitle
````

## Línea 1029

````text
// Add the name of the app as subtitle
````

## Línea 1045

````text
// Add the timer duration selected as subtitle
````

## Línea 1079

````text
// Remove ToggleMenu
````

## Línea 1082

````text
// Disconnect from signals
````

## Línea 1106

````text
// Register shortcut
````

## Línea 1119

````text
// Unregister shortcut
````
