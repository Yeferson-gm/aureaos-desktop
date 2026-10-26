# Notas de extensions/dock/appIcons.js

Comentarios trasladados durante la consolidación. Los números corresponden al archivo antes del traslado.

## Línea 1

````text
// -*- mode: js; js-indent-level: 4; indent-tabs-mode: nil -*-
````

## Línea 40

````text
// Use __ () and N__() for the extension gettext domain, and reuse
````

## Línea 41

````text
// the shell domain with the default _() and N_()
````

## Línea 73

````text
// module "Dash" did not export DASH_ITEM_LABEL_SHOW_TIME, so let's define it.
````

## Línea 82

````text
/**
 * Extend AppIcon
 *
 * - Apply a css class based on the number of windows of each application (#N);
 * - Customized indicators for running applications in place of the default "dot" style which is hidden (#N);
 *   a class of the form "running#N" is applied to the AppWellIcon actor.
 *   like the original .running one.
 * - Add a .focused style to the focused app
 * - Customize click actions.
 * - Update minimization animation target
 * - Update menu if open on windows change
 */
````

## Línea 119

````text
// settings are required inside.
````

## Línea 123

````text
// a prefix is required to avoid conflicting with the parent class variable
````

## Línea 130

````text
// Monitor windows-changes instead of app state.
````

## Línea 131

````text
// Keep using the same Id and function callback (that is extended)
````

## Línea 144

````text
// In Wayland sessions, this signal is needed to track the state of windows dragged
````

## Línea 145

````text
// from one monitor to another. As this is triggered quite often (whenever a new
````

## Línea 146

````text
// window of any application opened or moved to a different desktop),
````

## Línea 147

````text
// we restrict this signal to  the case when Labels.ISOLATE_MONITORS is true,
````

## Línea 148

````text
// and if there are at least 2 monitors.
````

## Línea 189

````text
// macos27-v7:urgent
````

## Línea 204

````text
// macos27-v7:urgent-stop
````

## Línea 241

````text
// This requires GNOME 49
````

## Línea 257

````text
// macos27-v7:bounce-destroy
````

## Línea 266

````text
// macos27-v7:bounce - rebote de lanzamiento y de aviso, como en macOS.
````

## Línea 354

````text
// We only activate windows of running applications, i.e. we never open new windows
````

## Línea 355

````text
// We check if the app is running, and that the # of windows is > 0 in
````

## Línea 356

````text
// case we use workspace isolation,
````

## Línea 393

````text
// Activate the first window
````

## Línea 494

````text
/**
     * Update target for minimization animation
     */
````

## Línea 498

````text
// If (for unknown reason) the actor is not on the stage the reported size
````

## Línea 499

````text
// and position are random values, which might exceeds the integer range
````

## Línea 500

````text
// resulting in an error when assigned to the a rect. This is a more like
````

## Línea 501

````text
// a workaround to prevent flooding the system with errors.
````

## Línea 519

````text
// The logic originally in this function has been moved to
````

## Línea 520

````text
// AppIconIndicatorBase._updateDefaultDot(). However it cannot be removed as
````

## Línea 521

````text
// it called by the parent constructor.
````

## Línea 551

````text
// Setting the max-height is s useful if part of the menu is
````

## Línea 552

````text
// scrollable so the minimum height is smaller than the natural height.
````

## Línea 558

````text
// If horizontal also remove the height of the dash
````

## Línea 563

````text
// Also set a max width to the menu, so long labels (long windows title) get truncated
````

## Línea 582

````text
// Removed in GNOME 50.
````

## Línea 599

````text
// Only consider SHIFT and CONTROL as modifiers (exclude SUPER, CAPS-LOCK, etc.)
````

## Línea 602

````text
// We don't change the CTRL-click behavior: in such case we just chain
````

## Línea 603

````text
// up the parent method and return.
````

## Línea 605

````text
// Keep default behavior: launch new window
````

## Línea 606

````text
// By calling the parent method I make it compatible
````

## Línea 607

````text
// with other extensions tweaking ctrl + click
````

## Línea 612

````text
// We check what type of click we have and if the modifier SHIFT is
````

## Línea 613

````text
// being used. We then define what buttonAction should be for this
````

## Línea 614

````text
// event.
````

## Línea 641

````text
// We check if the app is running, and that the # of windows is > 0 in
````

## Línea 642

````text
// case we use workspace isolation.
````

## Línea 645

````text
// Some action modes (e.g. MINIMIZE_OR_OVERVIEW) require overview to remain open
````

## Línea 646

````text
// This variable keeps track of this
````

## Línea 649

````text
// We customize the action only when the application is already running
````

## Línea 655

````text
// In overview just activate the app, unless the action is explicitly
````

## Línea 656

````text
// requested with a keyboard modifier
````

## Línea 658

````text
// If we have button=2 or a modifier, allow minimization even if
````

## Línea 659

````text
// the app is not focused
````

## Línea 662

````text
// minimize all windows on double click and always in
````

## Línea 663

````text
// the case of primary click without additional modifiers
````

## Línea 676

````text
// When a single window is present, toggle minimization
````

## Línea 677

````text
// If only one windows is present toggle minimization, but
````

## Línea 678

````text
// only when triggered with the simple click action
````

## Línea 679

````text
// (no modifiers, no middle click).
````

## Línea 684

````text
// Window is raised, minimize it
````

## Línea 688

````text
// Window is minimized, raise it
````

## Línea 691

````text
// Launch overview when multiple windows are present
````

## Línea 692

````text
// TODO: only show current app windows when gnome shell API will allow it
````

## Línea 704

````text
// Activate the first window
````

## Línea 718

````text
// Activate the first window
````

## Línea 731

````text
// Activate the first window
````

## Línea 743

````text
// If only one windows is present just switch to it,
````

## Línea 744

````text
// but only when triggered with the simple click action
````

## Línea 745

````text
// (no modifiers, no middle click).
````

## Línea 758

````text
// When a single window is present, toggle minimization
````

## Línea 759

````text
// If only one windows is present toggle minimization, but only
````

## Línea 760

````text
// when triggered with the standard click action (no modifiers,
````

## Línea 761

````text
// no middle click).
````

## Línea 766

````text
// Window is raised, minimize it
````

## Línea 769

````text
// Window is minimized, raise it
````

## Línea 773

````text
// Launch previews when multiple windows are present
````

## Línea 787

````text
// Activate the first window
````

## Línea 798

````text
// Activate the first window
````

## Línea 817

````text
// Hide overview except when action mode requires it
````

## Línea 857

````text
// Try to do the right thing when attempting to launch a new window of an app. In
````

## Línea 858

````text
// particular, if the application doesn't allow to launch a new window, activate
````

## Línea 859

````text
// the existing window instead.
````

## Línea 871

````text
// Try to manually activate the first window. Otherwise, when the
````

## Línea 872

````text
// app is activated by switching to a different workspace, a launch
````

## Línea 873

````text
// spinning icon is shown and disappears only after a timeout.
````

## Línea 885

````text
// Add label for a Hot-Key visual aid
````

## Línea 901

````text
// We apply an overall scale factor that might come from a HiDPI monitor.
````

## Línea 902

````text
// Clutter dimensions are in physical pixels, but CSS measures are in logical
````

## Línea 903

````text
// pixels, so make sure to consider the scale.
````

## Línea 905

````text
// Set the font size to something smaller than the whole icon so it is
````

## Línea 906

````text
// still visible. The border radius is large to make the shape circular
````

## Línea 932

````text
// Param true make all app windows minimize
````

## Línea 939

````text
// Just minimize one window. By specification it should be the
````

## Línea 940

````text
// focused window on the current workspace.
````

## Línea 947

````text
// By default only non minimized windows are activated.
````

## Línea 948

````text
// This activates all windows in the current workspace.
````

## Línea 950

````text
// First activate first window so workspace is switched if needed.
````

## Línea 951

````text
// We don't do this if isolation is on!
````

## Línea 959

````text
// then activate all other app windows in the current workspace
````

## Línea 972

````text
// This closes all windows of the app.
````

## Línea 980

````text
// Store for a little amount of time last clicked app and its windows
````

## Línea 981

````text
// since the order changes upon window interaction
````

## Línea 994

````text
// If there isn't already a list of windows for the current app,
````

## Línea 995

````text
// or the stored list is outdated, use the current windows list.
````

## Línea 1036

````text
// Filter out unnecessary windows, for instance
````

## Línea 1037

````text
// nautilus desktop window.
````

## Línea 1098

````text
/**
 * @param app
 * @param monitorIndex
 * @param iconAnimator
 */
````

## Línea 1110

````text
/**
 * DockAppIconMenu
 *
 * - set popup arrow side based on dash orientation
 * - Add close windows option based on quitfromdash extension
 *   (https://github.com/deuill/shell-extension-quitfromdash)
 * - Add open windows thumbnails instead of list
 * - update menu when application windows change
 */
````

## Línea 1125

````text
// We want to keep the item hovered while the menu is up
````

## Línea 1131

````text
// Chain our visibility and lifecycle to that of the source
````

## Línea 1204

````text
// Display the app windows menu items and the separator between windows
````

## Línea 1205

````text
// of the current desktop and other windows.
````

## Línea 1219

````text
/* TRANSLATORS: This is the heading of a list of open windows */
````

## Línea 1342

````text
// dynamic menu
````

## Línea 1358

````text
// quit menu
````

## Línea 1366

````text
// update menu content when application windows change. This is desirable as actions
````

## Línea 1367

````text
// acting on windows (closing) are performed while the menu is shown.
````

## Línea 1371

````text
// update, show or hide the quit menu
````

## Línea 1389

````text
// update, show, or hide the allWindows menu
````

## Línea 1390

````text
// Check if there are new windows not already displayed. In such case,
````

## Línea 1391

````text
// repopulate the allWindows menu. Windows removal is already handled
````

## Línea 1392

````text
// by each preview being connected to the destroy signal
````

## Línea 1402

````text
// Try to set the width to that of the submenu.
````

## Línea 1403

````text
// TODO: can't get the actual size, getting a bit less.
````

## Línea 1404

````text
// Temporary workaround: add 15px to compensate
````

## Línea 1408

````text
// The menu is created hidden and never hidden after being shown.
````

## Línea 1409

````text
// Instead, a signal connected to its items destroy will set is
````

## Línea 1410

````text
// insensitive if no more windows preview are shown.
````

## Línea 1420

````text
// Update separators
````

## Línea 1448

````text
// This is to achieve a more graceful transition when the last
````

## Línea 1449

````text
// window is closed.
````

## Línea 1451

````text
// It's still counting the item just going to be destroyed
````

## Línea 1460

````text
/**
 * @param w
 */
````

## Línea 1467

````text
/**
 * Filter out unnecessary windows, for instance
 * nautilus desktop window.
 *
 * @param windows
 * @param monitorIndex
 */
````

## Línea 1477

````text
// When using workspace isolation, we filter out windows
````

## Línea 1478

````text
// that are neither in the current workspace nor marked urgent
````

## Línea 1497

````text
/**
 * A ShowAppsIcon improved class.
 *
 * - set label position based on dash orientation
 *   Note: we are am reusing most machinery of the appIcon class.
 * - implement a popupMenu based on the AppIcon code
 *   Note: we are reusing most machinery of the appIcon class)
 *
 */
````

## Línea 1517

````text
// Re-use appIcon methods
````

## Línea 1560

````text
// TODO: Drop this when not supporting GNOME 48 (and older) anymore.
````

## Línea 1570

````text
// TODO: Drop this when not supporting GNOME 48 (and older) anymore.
````

## Línea 1647

````text
// Removed in GNOME 50.
````

## Línea 1656

````text
/**
 * A menu for the showAppsIcon
 */
````

## Línea 1671

````text
/**
 * This function is used for both DockShowAppsIcon and DockDashItemContainer
 */
````

## Línea 1676

````text
// Check if the label is still present at all. When switching workspace, the
````

## Línea 1677

````text
// item might have been destroyed in between.
````

## Línea 1725

````text
// macos27-v7:labelpos - la etiqueta flota sobre el icono ya ampliado.
````

## Línea 1753

````text
// keep the label inside the screen border
````

## Línea 1754

````text
// Only needed fot the x coordinate.
````

## Línea 1756

````text
// Leave a few pixel gap
````
