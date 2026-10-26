# Notas de extensions/desktop-icons/app/windowManager.js

Comentarios trasladados durante la consolidación. Los números corresponden al archivo antes del traslado.

## Línea 112

````text
// Keep only the latest pending request while a grid update is already
````

## Línea 113

````text
// running. That lets us serialize the actual work and skip bursty
````

## Línea 114

````text
// intermediate geometry changes that would be replaced anyway.
````

## Línea 125

````text
// Drain the newest pending request one at a time so bursty
````

## Línea 126

````text
// geometry changes collapse down to the latest state.
````

## Línea 176

````text
// A failed apply may have changed both bookkeeping and live windows.
````

## Línea 177

````text
// Rebuild instead of diffing against that partially applied state.
````

## Línea 193

````text
// Allow initial startup if no desktops defined on initiation
````

## Línea 199

````text
// If any new monitors plugged in or removed
````

## Línea 200

````text
// by creating new desktops
````

## Línea 219

````text
// monitor has been plugged in or removed.
````

## Línea 223

````text
// WindowManager owns the serialized geometry update flow; desktopManager
````

## Línea 224

````text
// only applies the resulting desktop mutations.
````

## Línea 238

````text
// sanity checks and icons placement on grid will be done by
````

## Línea 239

````text
// desktopManager in sync startup
````

## Línea 270

````text
// There is a subtle difference here, all information is needed
````

## Línea 271

````text
//
````

## Línea 272

````text
// gridschanged implies prior grid information is available.
````

## Línea 273

````text
// Therefore write mode is 'PRESERVE' initially
````

## Línea 274

````text
//
````

## Línea 275

````text
// monitors changed implies that all coordintes are rewritten to the
````

## Línea 276

````text
// new monitor relative coordinates with a write mode of 'OVERWRITE'
````

## Línea 277

````text
//
````

## Línea 278

````text
// redisplay re-arranges all the icons on the new desktop monitor,
````

## Línea 279

````text
// essential for proper sorting/stacking of icons and arranging of
````

## Línea 280

````text
// icons
````

## Línea 281

````text
//
````

## Línea 282

````text
// For keep arranged new coordinates are automatically written to
````

## Línea 283

````text
// grid. However for stacked co-ordinates- we will neeed to redo the
````

## Línea 284

````text
// old coordinates seperately in do stacks with nonitorschanged info
````

## Línea 285

````text
//
````

## Línea 286

````text
// WindowManager owns the serialized geometry update flow; desktopManager
````

## Línea 287

````text
// only applies the resulting desktop mutations
````

## Línea 294

````text
// animate to the new margins and positions
````

## Línea 295

````text
// force a queue draw of all windows now that we have drawn the desktop,
````

## Línea 296

````text
// and poke mutter to map the meta window.
````

## Línea 302

````text
// Save prior primary state
````

## Línea 306

````text
// Compute new primary index
````

## Línea 313

````text
// Update primary index if changed
````

## Línea 317

````text
// Find the new primary monitor
````

## Línea 326

````text
// See if there are different zooms in the desktops when logical scaling
````

## Línea 327

````text
// is not active. If scaleFactor is 1, zoom differences do not matter.
````

## Línea 345

````text
// Allow initial startup if no desktops defined on initiation
````

## Línea 356

````text
// If this is the first desktop, we don't need finer diffing;
````

## Línea 386

````text
// if no change in monitors, check if any change in monitor geometry
````

## Línea 387

````text
// or if any change in grid geometry
````

## Línea 392

````text
// Monitor count changed; mark this index as changed and skip diff
````

## Línea 423

````text
// indexChanged implies monitors have changed
````

## Línea 424

````text
// monitors changed or index changed implies grids have changed
````

## Línea 425

````text
// as there may be other actors on the new monitor edge
````

## Línea 428

````text
// only the grids have changed, no monitor changes
````

## Línea 433

````text
// redisplay is needed for sorting and stacking. Icons
````

## Línea 434

````text
// need to be redisplayed if anything changes - the actual fileList
````

## Línea 435

````text
// has not changed
````

## Línea 461

````text
// Allow startup with no desktops from constructor
````

## Línea 462

````text
// even if no desktops are defined when started by the extension
````

## Línea 463

````text
// desktops can be defined later from updateGridWindows(), dbus
````

## Línea 464

````text
// activation
````

## Línea 504

````text
// No useless log noise if windows fail to map
````

## Línea 519

````text
// logError(e);
````

## Línea 520

````text
// if the windows fail to map, we should still proceed
````

## Línea 521

````text
// and poke the desktop windows later.
````

## Línea 664

````text
// Positional algorithms here depending on new geomertry
````

## Línea 665

````text
// of the placed monitors, -FIX ME- currently rudimentary
````

## Línea 666

````text
// only going by position in the index, not by placement geometry.
````

## Línea 674

````text
// Catch All if everything fails
````
