# Notas de extensions/app-indicators/dbusMenu.js

Comentarios trasladados durante la consolidación. Los números corresponden al archivo antes del traslado.

## Línea 34

````text
// ////////////////////////////////////////////////////////////////////////
````

## Línea 35

````text
// PART ONE: "ViewModel" backend implementation.
````

## Línea 36

````text
// Both code and design are inspired by libdbusmenu
````

## Línea 37

````text
// ////////////////////////////////////////////////////////////////////////
````

## Línea 39

````text
/**
 * Saves menu property values and handles type checking and defaults
 */
````

## Línea 73

````text
// we list all the properties we know and use here, so we won' have to deal with unexpected type mismatches
````

## Línea 91

````text
// elements not in here must return null
````

## Línea 94

````text
/**
 * Represents a single menu item
 */
````

## Línea 98

````text
// will steal the properties object
````

## Línea 139

````text
// clone it!
````

## Línea 148

````text
// find it
````

## Línea 166

````text
// find the old position
````

## Línea 212

````text
/**
 * The client does the heavy lifting of actually reading layouts and distributing events
 */
````

## Línea 250

````text
// will be set to true if a layout update is needed once active
````

## Línea 253

````text
// property requests are queued
````

## Línea 254

````text
/* ids */
````

## Línea 294

````text
// if we don't have any requests queued, we'll need to add one
````

## Línea 316

````text
// Traverses the list of cached menu items and removes everyone that is not in the list
````

## Línea 317

````text
// so we don't keep alive unused items
````

## Línea 334

````text
// the original implementation will only request partial layouts if somehow possible
````

## Línea 335

````text
// we try to save us from multiple kinds of race conditions by always requesting a full layout
````

## Línea 343

````text
// the original implementation will only request partial layouts if somehow possible
````

## Línea 344

````text
// we try to save us from multiple kinds of race conditions by always requesting a full layout
````

## Línea 346

````text
// we only read the type property, because if the type changes after reading all properties,
````

## Línea 347

````text
// the view would have to replace the item completely which we try to avoid
````

## Línea 385

````text
// make sure all our children exist
````

## Línea 388

````text
// make sure we exist
````

## Línea 392

````text
// we do, update our properties if necessary
````

## Línea 396

````text
// make sure our children are all at the right place, and exist
````

## Línea 399

````text
// try to recycle an old child
````

## Línea 409

````text
// no old child found, so create a new one!
````

## Línea 412

````text
// old child found, reuse it!
````

## Línea 417

````text
// remove any old children that weren't reused
````

## Línea 424

````text
// we don't, so let's create us
````

## Línea 507

````text
// we don't need to cache and burst-send that since it will not happen that frequently
````

## Línea 512

````text
/* Some indicators (you, dropbox!) don't use the right signature
         * and don't return a boolean, so we need to support both cases */
````

## Línea 569

````text
// ////////////////////////////////////////////////////////////////////////
````

## Línea 570

````text
// PART TWO: "View" frontend implementation.
````

## Línea 571

````text
// ////////////////////////////////////////////////////////////////////////
````

## Línea 573

````text
// https://bugzilla.gnome.org/show_bug.cgi?id=731514
````

## Línea 574

````text
// GNOME 3.10 and 3.12 can't open a nested submenu.
````

## Línea 575

````text
// Patches have been written, but it's not clear when (if?) they will be applied.
````

## Línea 576

````text
// We also don't know whether they will be backported to 3.10, so we will work around
````

## Línea 577

````text
// it in the meantime. Offending versions can be clearly identified:
````

## Línea 580

````text
/**
 * Creates new wrapper menu items and injects methods for managing them at runtime.
 *
 * Many functions in this object will be bound to the created item and executed as event
 * handlers, so any `this` will refer to a menu item create in createItem
 */
````

## Línea 588

````text
// first, decide whether it's a submenu or not
````

## Línea 609

````text
// initialize our state
````

## Línea 616

````text
// initially create children
````

## Línea 622

````text
// now, connect various events
````

## Línea 653

````text
// close our own submenus
````

## Línea 657

````text
// register ourselves and close sibling submenus
````

## Línea 668

````text
// close our own submenus
````

## Línea 717

````text
// find it!
````

## Línea 737

````text
// especially on GS3.8, the separator item might not even have a hidden label
````

## Línea 743

````text
// separators and alike might not have gotten the polyfill
````

## Línea 757

````text
// might be missing on submenus / separators
````

## Línea 790

````text
// create our new self if needed
````

## Línea 794

````text
// first, we need to find our old position
````

## Línea 806

````text
// add our new self while we're still alive
````

## Línea 809

````text
// now destroy our old self
````

## Línea 814

````text
/**
 * Utility functions not necessarily belonging into the item factory
 */
````

## Línea 819

````text
// HACK: we're really getting into the internals of the PopupMenu implementation
````

## Línea 821

````text
// First, find our wrapper. Children tend to lie. We do not trust the old positioning.
````

## Línea 825

````text
// now, remove it
````

## Línea 828

````text
// and add it again somewhere else
````

## Línea 834

````text
// skip the rest
````

## Línea 842

````text
/**
 * Processes DBus events, creates the menu items and handles the actions
 *
 * Something like a mini-god-object
 */
````

## Línea 854

````text
// the shell menu
````

## Línea 855

````text
// the DbusMenuItem for the root
````

## Línea 872

````text
// this will attach the client to an already existing menu that will be used as the root menu.
````

## Línea 873

````text
// it will also connect the client to be automatically destroyed when the menu dies.
````

## Línea 879

````text
// cleanup: remove existing children (just in case)
````

## Línea 885

````text
// connect handlers
````

## Línea 893

````text
// Dropbox requires us to call AboutToShow(0) first
````

## Línea 896

````text
// fill the menu for the first time
````

## Línea 919

````text
// Menu additions can be expensive, so let's do it in different chunks
````

## Línea 938

````text
// children like to play hide and seek
````

## Línea 939

````text
// but we know how to find it for sure!
````

## Línea 968

````text
// The menu hay have been removed at this point, thus do not
````

## Línea 969

````text
// spam the users about this if it happens.
````
