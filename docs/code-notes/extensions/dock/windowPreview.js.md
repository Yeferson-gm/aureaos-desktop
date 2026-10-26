# Notas de extensions/dock/windowPreview.js

Comentarios trasladados durante la consolidación. Los números corresponden al archivo antes del traslado.

## Línea 1

````text
/*
 * Credits:
 * This file is based on code from the Dash to Panel extension by Jason DeRose
 * and code from the Taskbar extension by Zorin OS
 * Some code was also adapted from the upstream Gnome Shell source code.
 */
````

## Línea 41

````text
// We want to keep the item hovered while the menu is up
````

## Línea 51

````text
// macos27-v7:preview-class
````

## Línea 58

````text
// Chain our visibility and lifecycle to that of the source
````

## Línea 112

````text
// Remove this when can use GNOME 48
````

## Línea 137

````text
// Event coordinates are relative to the stage but can be transformed
````

## Línea 138

````text
// as the actor will only receive events within his bounds.
````

## Línea 143

````text
// If the scroll event is within a 1px margin from
````

## Línea 144

````text
// the relevant edge of the actor, let the event propagate.
````

## Línea 148

````text
// Skip to avoid double events mouse
````

## Línea 196

````text
// Windows currently on the menu
````

## Línea 201

````text
// All app windows with a static order
````

## Línea 215

````text
// No change at oldIndex/newIndex
````

## Línea 222

````text
// Window removed at oldIndex
````

## Línea 229

````text
// Window added at newIndex
````

## Línea 239

````text
// Window moved
````

## Línea 270

````text
// Skip animations on first run when adding the initial set
````

## Línea 271

````text
// of items, to avoid all items zooming in at once
````

## Línea 283

````text
// As for upstream:
````

## Línea 284

````text
// St.ScrollView always requests space horizontally for a possible vertical
````

## Línea 285

````text
// scrollbar if in AUTOMATIC mode. Doing better would require implementation
````

## Línea 286

````text
// of width-for-height in St.BoxLayout and St.ScrollView. This looks bad
````

## Línea 287

````text
// when we *don't* need it, so turn off the scrollbar when that's true.
````

## Línea 288

````text
// Dynamic changes in whether we need it aren't handled properly.
````

## Línea 335

````text
// We don't want this: it adds spacing on the left of the item.
````

## Línea 342

````text
// Now we don't have to set PREVIEW_MAX_WIDTH and PREVIEW_MAX_HEIGHT as
````

## Línea 343

````text
// preview size - that made all kinds of windows either stretched or
````

## Línea 344

````text
// squished (aspect ratio problem)
````

## Línea 349

````text
// TODO: improve the way the closebutton is layout. Just use some padding
````

## Línea 350

````text
// for the moment.
````

## Línea 413

````text
// For some crazy clutter / St reason we can't just have this handled
````

## Línea 414

````text
// automatically or here via vfunc_allocate + vfunc_get_preferred_*
````

## Línea 415

````text
// because if we do so, the St paddings on first / last child are lost
````

## Línea 437

````text
// a simple example with 1680x1050:
````

## Línea 438

````text
// * 250/1680 = 0,1488
````

## Línea 439

````text
// * 150/1050 = 0,1429
````

## Línea 440

````text
// => scale is 0,1429
````

## Línea 446

````text
// width and height that we wanna multiply by scale
````

## Línea 451

````text
// This gets the actual windows size for the preview
````

## Línea 457

````text
// Newly-created windows are added to a workspace before
````

## Línea 458

````text
// the compositor finds out about them...
````

## Línea 461

````text
// Check if there's still a point in getting the texture,
````

## Línea 462

````text
// otherwise this could go on indefinitely
````

## Línea 486

````text
// when the source actor is destroyed, i.e. the window closed, first destroy the clone
````

## Línea 487

````text
// and then destroy the menu item (do this animating out)
````

## Línea 490

````text
// avoid to try to disconnect this signal from mutterWindow in _onDestroy(),
````

## Línea 491

````text
// as the object was just destroyed
````

## Línea 516

````text
// This mechanism is copied from the workspace.js upstream code
````

## Línea 517

````text
// It forces window activation if the windows don't get closed,
````

## Línea 518

````text
// for instance because asking user confirmation, by monitoring the opening of
````

## Línea 519

````text
// such additional confirmation window
````

## Línea 527

````text
// Delete all windows, starting from the bottom-most (most-modal) one
````

## Línea 528

````text
// let windows = this._window.get_compositor_private().get_children();
````

## Línea 547

````text
// use an idle handler to avoid mapping problems -
````

## Línea 548

````text
// see comment in Workspace._windowAdded
````

## Línea 559

````text
// count transient windows
````
