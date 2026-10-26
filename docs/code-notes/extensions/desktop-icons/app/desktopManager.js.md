# Notas de extensions/desktop-icons/app/desktopManager.js

Comentarios trasladados durante la consolidación. Los números corresponden al archivo antes del traslado.

## Línea 46

````text
// Inherit
````

## Línea 51

````text
// Don't close the application if there are no desktops
````

## Línea 60

````text
// Init and import Scripts and classes
````

## Línea 74

````text
// init methods
````

## Línea 96

````text
// Init Variables
````

## Línea 102

````text
// Track last seen keyboard modifier state so accelerators can query it
````

## Línea 106

````text
// setup gracefull termination
````

## Línea 140

````text
// Run desktop updates one at a time. Each call keeps its own turn, so
````

## Línea 141

````text
// this serializes updates but does not merge them into a single call.
````

## Línea 142

````text
//
````

## Línea 143

````text
// Callers must pass a function with the correct `this` binding already
````

## Línea 144

````text
// applied; `then()` invokes it directly.
````

## Línea 147

````text
// Keep the queue chain alive even if one update fails; callers still
````

## Línea 148

````text
// get the rejection from `nextUpdate`.
````

## Línea 161

````text
// startup in a particular order
````

## Línea 162

````text
// First create and make sure windows are created
````

## Línea 166

````text
// If this desktop List is null, ask for a new one
````

## Línea 170

````text
// Monitor is attached, windows are created with proper geometry
````

## Línea 173

````text
// Now we can actually display errors, so check for them
````

## Línea 174

````text
// Ensure that there is a 'Desktop' folder set and it exists
````

## Línea 175

````text
// Verify if Gnome Files is available and executable, otherwise warn
````

## Línea 176

````text
// Confirm Gnome Files is registered with xdg-utils
````

## Línea 177

````text
// to handle inode/directory
````

## Línea 180

````text
// The initialRead parameter insures tha grid positions are recalculated
````

## Línea 181

````text
// and recaculated postions of all fileItems will be re-written to
````

## Línea 182

````text
// disk with write mode 'OVERWRITE'
````

## Línea 185

````text
// prior fileList, even if triggered through desktopdir changes
````

## Línea 186

````text
// will not be displayed as windows were not there.
````

## Línea 189

````text
// This is no longer needed, if true it blocks and all updates.
````

## Línea 198

````text
// First intitiation complete, valid file read from
````

## Línea 199

````text
// desktopdir, even if a prior fileList was read, the
````

## Línea 200

````text
// forced new read will recalculate and resave new
````

## Línea 201

````text
// normalized coordinates and monitor information.
````

## Línea 205

````text
// force a queue draw of all windows now that we have drawn the desktop,
````

## Línea 206

````text
// and poke mutter to map the meta window.
````

## Línea 211

````text
// show error if monitor frame buffer scaling is not enabled first,
````

## Línea 212

````text
//  as windows may be awry
````

## Línea 218

````text
// show notification as well as error dialog as windows may
````

## Línea 219

````text
//  not be postioned correctly
````

## Línea 256

````text
// TRANSLATORS: {desktop} folder path automatically inserted
````

## Línea 266

````text
// TRANSLATORS: {desktop} folder path automatically inserted
````

## Línea 347

````text
// Keyboard and Mouse Events
````

## Línea 353

````text
// Left Click
````

## Línea 356

````text
// clear selection
````

## Línea 364

````text
// Right Click
````

## Línea 415

````text
// In ms
````

## Línea 455

````text
// cache modifier state for use by accelerator-driven handlers
````

## Línea 460

````text
// reset cached modifier state
````

## Línea 478

````text
// Icons: clear from all grids
````

## Línea 481

````text
// Widgets: clear from all grids
````

## Línea 492

````text
// Icons first
````

## Línea 507

````text
// Destktop Icon Placement and Display
````

## Línea 508

````text
// ********************************************************************** */
````

## Línea 530

````text
//* Remove all files from the grids just before placing new files to
````

## Línea 531

````text
// prevent flickering icons *//
````

## Línea 541

````text
// Start icon loading early so late loads settle before first paint.
````

## Línea 547

````text
// Wait for either snapshot placement or the not-shown fallback.
````

## Línea 553

````text
//* Desktop draw/paint is now complete *//
````

## Línea 554

````text
//* Reposition open Menus, renameFileItem pop up's **//
````

## Línea 555

````text
//* Any task after complete desktop draw can now be done *//
````

## Línea 608

````text
// write the new recomputed positions to metadata when assigned
````

## Línea 614

````text
// if snap to grid, recompute column, row for fileItems
````

## Línea 615

````text
// so they end up in the same relative grid, otherwise they keep
````

## Línea 616

````text
// shifting postions. This keeps them in the same relative grid
````

## Línea 617

````text
// position. For snap to grid this will apply the new  global x,y of
````

## Línea 618

````text
// the grid assigned
````

## Línea 676

````text
// reassign to monitors
````

## Línea 677

````text
// if on primary monitor, reassign to new primary
````

## Línea 689

````text
// reassign not on primary monitor to prior monitor if
````

## Línea 690

````text
// if the prior monitor is still in index
````

## Línea 697

````text
// reassingn to new monitor, prior monitor not available
````

## Línea 701

````text
// if any error, leave unmapped to new monitor, placement algorithm
````

## Línea 702

````text
//  will find placement from the old global position
````

## Línea 708

````text
// recompute coordinates for the new monitor
````

## Línea 727

````text
// First, add those icons that have saved coordinates
````

## Línea 728

````text
// and fit in the current desktops
````

## Línea 759

````text
// Now, assign icons that have landed in changed margins, belong to
````

## Línea 760

````text
// monitor and the window, however no longer fit on the grid as
````

## Línea 761

````text
// they overlap margins.
````

## Línea 773

````text
// Now assign those icons that have dropped coordinates
````

## Línea 793

````text
// Now, try again assign those icons that had dropped coordinates and
````

## Línea 794

````text
// did not fit on dropped desktop, to the preferred or closest desktop
````

## Línea 804

````text
// Finally, assign coordinates of preferred desktop to those new icons
````

## Línea 805

````text
// that still don't have coordinates and place on preferred desktop or
````

## Línea 806

````text
// the next closest one
````

## Línea 812

````text
// try first in the designated desktop
````

## Línea 824

````text
// if there was no space in the preferred desktop, place on the
````

## Línea 825

````text
// desktop closest to preferred
````

## Línea 849

````text
// Find the closest desktop to given position, is null
````

## Línea 850

````text
// if not available
````

## Línea 952

````text
/**
         * Looks through the generated fileItems
         */
````

## Línea 970

````text
/**
         * Sorts fileItems by file size
         *
         * @param {integer} a the first file size
         * @param {integer} b the secondfile size
         */
````

## Línea 980

````text
/**
         * Sorts fileItems by time
         *
         * @param {integer} a the first file timestamp
         * @param {integer} b the second file timestamp
         */
````

## Línea 1130

````text
/**
         * @param {string} a fileItem filename for A
         * @param {string} b fileItem filename for B
         */
````

## Línea 1135

````text
// sort by label name instead of the the fileName or displayName so
````

## Línea 1136

````text
// that the "Home" folder is sorted in the correct order
````

## Línea 1137

````text
// alphabetical sort taking into account accent characters &
````

## Línea 1138

````text
// locale, natural language sort for numbers, ie 10.etc before 2.etc
````

## Línea 1139

````text
// other options for locale are best fit, or by specifying directly
````

## Línea 1140

````text
// in function below for translators
````

## Línea 1155

````text
/**
         * Sort by Kind, then by name
         *
         * @param {string} a fileItem
         * @param {string} b fileItem
         */
````

## Línea 1347

````text
// Desktop Manager Main methods
````

## Línea 1348

````text
// ********************************************************************** */
````

## Línea 1489

````text
/**
         * @param {integer} a fileItem file modified time
         * @param {integer} b fileItem file modified time
         */
````

## Línea 1501

````text
/**
         * @param {integer} a fileItem fileSize
         * @param {integer} b fileItem fileSize
         */
````

## Línea 1788

````text
// fileList is not changed, we just need to render the desktop again
````

## Línea 1789

````text
// with changes in icon color, emblem, appearance, theme change etc.
````

## Línea 1805

````text
// fileList is changed, we need to render the desktop again
````

## Línea 1806

````text
// with latest fileList from the desktopMonitor. The position of the
````

## Línea 1807

````text
// icons is also recomputed from the normalized coordinates.
````

## Línea 1817

````text
// fileList is not changed, grids changed, monitor added, removed,
````

## Línea 1818

````text
// monitor geometry, zoom, or index changed.
````

## Línea 1819

````text
// We need to recompute the position of the icons
````

## Línea 1820

````text
// from the normalized coordinates and redraw the desktop and reassign
````

## Línea 1821

````text
// the icons to the correct grid and monitors
````

## Línea 1834

````text
// No serializer here. The actual desktop mutation is serialized later
````

## Línea 1835

````text
// when the reload reaches refreshDesktop().
````

## Línea 1907

````text
// Getters and Setters
````
