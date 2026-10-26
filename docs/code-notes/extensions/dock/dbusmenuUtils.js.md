# Notas de extensions/dock/dbusmenuUtils.js

Comentarios trasladados durante la consolidación. Los números corresponden al archivo antes del traslado.

## Línea 1

````text
// -*- mode: js; js-indent-level: 4; indent-tabs-mode: nil -*-
````

## Línea 15

````text
// Dbusmenu features not (yet) supported:
````

## Línea 16

````text
//
````

## Línea 17

````text
//   * The CHILD_DISPLAY property
````

## Línea 18

````text
//
````

## Línea 19

````text
//     This seems to have only one possible value in the Dbusmenu API, so
````

## Línea 20

````text
//     there's little point in depending on it--the code in libdbusmenu sets it
````

## Línea 21

````text
//     if and only if an item has children, so for our purposes it's simpler
````

## Línea 22

````text
//     and more intuitive to just check children.length. (This does ignore the
````

## Línea 23

````text
//     possibility of a program not using libdbusmenu and setting CHILD_DISPLAY
````

## Línea 24

````text
//     independently, perhaps to indicate that an childless menu item should
````

## Línea 25

````text
//     nevertheless be displayed like a submenu.)
````

## Línea 26

````text
//
````

## Línea 27

````text
//   * Children more than two levels deep
````

## Línea 28

````text
//
````

## Línea 29

````text
//     PopupMenu doesn't seem to support submenus in submenus.
````

## Línea 30

````text
//
````

## Línea 31

````text
//   * Shortcut keys
````

## Línea 32

````text
//
````

## Línea 33

````text
//     If these keys are supposed to be installed as global shortcuts, we'd
````

## Línea 34

````text
//     have to query these aggressively and not wait for the DBus menu to be
````

## Línea 35

````text
//     mapped to a popup menu. A shortcut key that only works once the popup
````

## Línea 36

````text
//     menu is open and has key focus is possibly of marginal value.
````

## Línea 38

````text
/**
 *
 */
````

## Línea 53

````text
/**
 * @param dbusmenuItem
 * @param deep
 */
````

## Línea 58

````text
// These are the only properties guaranteed to be available when the root
````

## Línea 59

````text
// item is first announced. Other properties might be loaded already, but
````

## Línea 60

````text
// be sure to connect to Dbusmenu.MENUITEM_SIGNAL_PROPERTY_CHANGED to get
````

## Línea 61

````text
// the most up-to-date values in case they aren't.
````

## Línea 67

````text
// const childDisplay = dbusmenuItem.property_get(Dbusmenu.MENUITEM_PROP_CHILD_DISPLAY);
````

## Línea 73

````text
// If the basic type of the menu item needs to change, call this.
````

## Línea 78

````text
// Reminder: Clutter thinks of later entries in the child list as
````

## Línea 79

````text
// "above" earlier ones, so "above" here means "below" in terms of the
````

## Línea 80

````text
// menu's vertical order.
````

## Línea 158

````text
// PopupMenu doesn't natively support an "unknown" ornament, but we
````

## Línea 159

````text
// can hack one in:
````

## Línea 181

````text
// `value` is null when a property is cleared, so handle those cases
````

## Línea 182

````text
// with sensible defaults.
````

## Línea 214

````text
// Start actually building the menu item.
````

## Línea 217

````text
// Make a submenu.
````

## Línea 236

````text
// Don't make a submenu.
````

## Línea 238

````text
// We only have the potential to get a submenu if we aren't deep.
````

## Línea 255

````text
// Set common initial properties.
````

## Línea 265

````text
// Prevent an initial resize flicker.
````

## Línea 272

````text
// Connections on item will be lost when item is disposed; there's no need
````

## Línea 273

````text
// to add them to signalsHandler.
````
