# Notas de extensions/dock/docking.js

Comentarios trasladados durante la consolidación. Los números corresponden al archivo antes del traslado.

## Línea 1

````text
// -*- mode: js; js-indent-level: 4; indent-tabs-mode: nil -*-
````

## Línea 48

````text
// Use __ () and N__() for the extension gettext domain, and reuse
````

## Línea 49

````text
// the shell domain with the default _() and N_()
````

## Línea 84

````text
// Keep in sync with gnome-shell's WorkspacesView spacing constant.
````

## Línea 87

````text
// Maximum share of the available width the current workspace may take in
````

## Línea 88

````text
// the window picker. Stock GNOME ends up around this ratio by reserving the
````

## Línea 89

````text
// bottom dash space, which dash-to-dock removes.
````

## Línea 92

````text
// Minimum width share the current workspace keeps on narrow work areas.
````

## Línea 95

````text
// Work area aspect ratio below which the max width ratio starts shrinking.
````

## Línea 99

````text
/**
 * A simple St.Widget with one child whose allocation takes into account the
 * slide out of its child via the slide-x property ([0:1]).
 *
 * Required since I want to track the input region of this container which is
 * based on its allocation even if the child overflows the parent actor. By doing
 * this the region of the dash that is slide-out is not stealing anymore the input
 * regions making the extension usable when the primary monitor is the right one.
 *
 * The slide-x parameter can be used to directly animate the sliding. The parent
 * must have a WEST (SOUTH) anchor_point to achieve the sliding to the RIGHT (BOTTOM)
 * side.
 */
````

## Línea 131

````text
// minimum size when slided out
````

## Línea 190

````text
// A fully visible dock must allow transformed icons, badges and
````

## Línea 191

````text
// indicators to paint beyond the slide container allocation.
````

## Línea 196

````text
/**
     * Just the child width but taking into account the slided out part
     *
     * @param forHeight
     */
````

## Línea 210

````text
/**
     * Just the child height but taking into account the slided out part
     *
     * @param forWidth
     */
````

## Línea 264

````text
// This is the centering actor
````

## Línea 274

````text
// Load settings
````

## Línea 278

````text
// Temporary ignore hover events linked to autohide for whatever reason
````

## Línea 281

````text
// Create intellihide object to monitor windows overlapping
````

## Línea 284

````text
// Put dock on the required monitor
````

## Línea 287

````text
// this store size and the position where the dash is shown;
````

## Línea 288

````text
// used by intellihide module to check window overlap.
````

## Línea 292

````text
// Initialize pressure barrier variables
````

## Línea 298

````text
// Initialize dwelling system variables
````

## Línea 304

````text
// Create a new dash object
````

## Línea 310

````text
// Create the containers for sliding in and out and
````

## Línea 311

````text
// centering, turn on track hover
````

## Línea 312

````text
// This is the sliding actor whose allocation is to be tracked for input regions
````

## Línea 324

````text
// This is the actor whose hover status us tracked for autohide
````

## Línea 332

````text
// Connect global signals
````

## Línea 335

````text
// Monitor windows overlapping
````

## Línea 346

````text
// sync hover after a popupmenu is closed
````

## Línea 408

````text
// Since the actor is not a topLevel child and its parent is now not added to the Chrome,
````

## Línea 409

````text
// the allocation change of the parent container (slide in and slideout) doesn't trigger
````

## Línea 410

````text
// anymore an update of the input regions. Force the update manually.
````

## Línea 414

````text
// Since Clutter has no longer ClutterAllocationFlags,
````

## Línea 415

````text
// "allocation-changed" signal has been removed. MR !1245
````

## Línea 419

````text
// Load optional features that need to be activated for one dock only
````

## Línea 422

````text
// Load optional features that need to be activated once per dock
````

## Línea 425

````text
// Add dash container actor and the container to the Chrome.
````

## Línea 430

````text
// Delay operations that require the shell to be fully loaded and with
````

## Línea 431

````text
// user theme applied.
````

## Línea 444

````text
// Show the dock only once fully initialized. This workarounds a
````

## Línea 445

````text
// resize glitch we are seeing if the dock is initialized without
````

## Línea 446

````text
// an animation.
````

## Línea 447

````text
// $SOMETHING seems to resize it, but it's yet unclear what it is.
````

## Línea 486

````text
// Set the initial position.
````

## Línea 491

````text
// Create and apply height/width constraint to the dash.
````

## Línea 512

````text
// In case we are already inside the overview when the extension is loaded,
````

## Línea 513

````text
// for instance on unlocking the screen if it was locked with the overview open.
````

## Línea 521

````text
// The dash, intellihide and themeManager have global signals as well internally
````

## Línea 536

````text
// Remove barrier timeout
````

## Línea 542

````text
// Remove existing barrier
````

## Línea 593

````text
// Setup pressure barrier (GS38+ only)
````

## Línea 597

````text
// setup dwelling system if pressure barriers are not available
````

## Línea 753

````text
// Composition is needed while the dock is animating or is shown on top
````

## Línea 754

````text
// of a fullscreen window of its monitor.
````

## Línea 755

````text
// Otherwise the compositor-wide inhibition would prevent fullscreen
````

## Línea 756

````text
// windows in other monitors to run in direct rendering mode.
````

## Línea 770

````text
/**
     * This is call when visibility settings change
     */
````

## Línea 786

````text
/**
     * Show/hide dash based on, in order of priority:
     * overview visibility
     * fixed mode
     * intellihide
     * autohide
     * overview visibility
     */
````

## Línea 816

````text
// Do not hide if autohide is enabled and mouse is hover
````

## Línea 869

````text
// Skip if dock is not in autohide mode for instance because it is shown
````

## Línea 870

````text
// by intellihide.
````

## Línea 887

````text
// suppress all potential queued transitions - i.e. added but not started,
````

## Línea 888

````text
// always give priority to show
````

## Línea 897

````text
// If no hiding animation is running or queued
````

## Línea 903

````text
// if a show already started, let it finish; queue hide without removing the show.
````

## Línea 904

````text
// to obtain this, we wait for the animateIn animation to be completed
````

## Línea 928

````text
// Remove barrier so that mouse pointer is released and can
````

## Línea 929

````text
// monitors on other side of dock.
````

## Línea 930

````text
// NOTE: Delay needed to keep mouse from moving past dock and
````

## Línea 931

````text
// re-hiding dock immediately. This gives users an opportunity
````

## Línea 932

````text
// to hover over the dock
````

## Línea 961

````text
// Remove queued barrier removal timeout if any
````

## Línea 973

````text
/**
     * Dwelling system based on the GNOME Shell 3.14 messageTray code.
     */
````

## Línea 977

````text
// If we don't have extended barrier features, then we need
````

## Línea 978

````text
// to support the old tray dwelling mechanism.
````

## Línea 1005

````text
// Check for the correct screen edge, extending the sensitive area to the whole workarea,
````

## Línea 1006

````text
// minus 1 px to avoid conflicting with other active corners.
````

## Línea 1022

````text
// We only set up dwell timeout when the user is not hovering over the dock
````

## Línea 1023

````text
// already (!this._box.hover).
````

## Línea 1024

````text
// The _dockDwelling variable is used so that we only try to
````

## Línea 1025

````text
// fire off one dock dwell - if it fails (because, say, the user has the mouse down),
````

## Línea 1026

````text
// we don't try again until the user moves the mouse up and down again.
````

## Línea 1028

````text
// Save the interaction timestamp so we can detect user input
````

## Línea 1060

````text
// We don't want to open the tray when a modal dialog
````

## Línea 1061

````text
// is up, so we check the modal count for that. When we are in the
````

## Línea 1062

````text
// overview we have to take the overview's modal push into account
````

## Línea 1066

````text
// If the user interacted with the focus window since we started the tray
````

## Línea 1067

````text
// dwell (by clicking or typing), don't activate the message tray
````

## Línea 1073

````text
// Reuse the pressure version function, the logic is the same
````

## Línea 1095

````text
// Remove existing pressure barrier
````

## Línea 1107

````text
// Create new pressure barrier based on pressure threshold setting
````

## Línea 1121

````text
/**
     * handler for mouse pressure sensed
     */
````

## Línea 1131

````text
// In case the mouse move away from the dock area before hovering it,
````

## Línea 1132

````text
// in such case the leave event would never be triggered and the dock
````

## Línea 1133

````text
// would stay visible forever.
````

## Línea 1181

````text
/**
     * Remove pressure barrier
     */
````

## Línea 1195

````text
/**
     * Update pressure barrier size
     */
````

## Línea 1199

````text
// Remove existing barrier
````

## Línea 1202

````text
// The barrier needs to be removed in fullscreen with autohide disabled
````

## Línea 1203

````text
// otherwise the mouse can get trapped on monitor.
````

## Línea 1208

````text
// Manually reset pressure barrier
````

## Línea 1209

````text
// This is necessary because we remove the pressure barrier when it is
````

## Línea 1210

````text
// triggered to show the dock
````

## Línea 1216

````text
// Create new barrier
````

## Línea 1217

````text
// The barrier extends to the whole workarea, minus 1 px to avoid
````

## Línea 1218

````text
// conflicting with other active corners
````

## Línea 1219

````text
// Note: dash in fixed position doesn't use pressure barrier.
````

## Línea 1277

````text
// update when workarea changes, for instance if  other extensions modify the struts
````

## Línea 1278

````text
// (like moving th panel at the bottom)
````

## Línea 1305

````text
// Note: do not use the workarea coordinates in the direction on which the dock is placed,
````

## Línea 1306

````text
// to avoid a loop [position change -> workArea change -> position change] with
````

## Línea 1307

````text
// fixed dock.
````

## Línea 1426

````text
/**
     * Show dock and give key focus to it
     */
````

## Línea 1436

````text
// Optional features to be enabled only for the main Dock
````

## Línea 1438

````text
// Restore dash accessibility
````

## Línea 1444

````text
/**
     * Switch workspace by scrolling over the dock
     */
````

## Línea 1472

````text
// This was inspired to desktop-scroller@obsidien.github.com
````

## Línea 1474

````text
// When in overview change workspace only in windows view
````

## Línea 1508

````text
// Prevent scroll events from triggering too many workspace switches
````

## Línea 1509

````text
// by adding a 250ms dead time between each scroll event.
````

## Línea 1510

````text
// Useful on laptops when using a touch pad.
````

## Línea 1512

````text
// During the deadtime do nothing
````

## Línea 1527

````text
// Support Workspace Grid extension showing their custom
````

## Línea 1528

````text
// Grid Workspace Switcher
````

## Línea 1543

````text
// Set the actor non reactive, so that it doesn't prevent the
````

## Línea 1544

````text
// clicks events from reaching the dash actor. I can't see a reason
````

## Línea 1545

````text
// why it should be reactive.
````

## Línea 1548

````text
// If Workspace Grid is installed, let them handle the scroll behavior.
````

## Línea 1554

````text
// Do not show workspaceSwitcher in overview
````

## Línea 1569

````text
// Apps currently in the dash
````

## Línea 1572

````text
// Activate with button = 1, i.e. same as left click
````

## Línea 1579

````text
/*
 * Handle keyboard shortcuts
 */
````

## Línea 1610

````text
// Remove keybindings
````

## Línea 1620

````text
// Setup keyboard bindings for dash elements
````

## Línea 1662

````text
// Enable extra shortcut if either 'overlay' or 'show-dock' are true
````

## Línea 1710

````text
// Restart the counting if the shortcut is pressed again
````

## Línea 1720

````text
// Show the dock if it is hidden
````

## Línea 1743

````text
// Hide the dock again if necessary
````

## Línea 1749

````text
/**
 * Isolate overview to open new windows for inactive apps
 * Note: the future implementation is not fully contained here.
 * Some bits are around in other methods of other classes.
 * This class just take care of enabling/disabling the option.
 */
````

## Línea 1783

````text
// ensure I never double-register/inject
````

## Línea 1784

````text
// although it should never happen
````

## Línea 1797

````text
// This last signal is only needed for monitor isolation, as windows
````

## Línea 1798

````text
// might migrate from one monitor to another without triggering 'restacked'
````

## Línea 1805

````text
/**
         * here this is the Shell.App
         */
````

## Línea 1809

````text
// These lines take care of Nautilus for icons on Desktop
````

## Línea 1905

````text
// Connect relevant signals to the toggling function
````

## Línea 1910

````text
/* Array of all the docks created */
````

## Línea 1919

````text
// status variable: true when the overview is shown through the dash
````

## Línea 1920

````text
// applications button.
````

## Línea 2157

````text
// Connect relevant signals to the toggling function
````

## Línea 2216

````text
// If there are no monitors (headless configurations, but it can also
````

## Línea 2217

````text
// happen temporary while disconnecting and reconnecting monitors), just
````

## Línea 2218

````text
// do nothing. When a monitor will be connected we we'll be notified and
````

## Línea 2219

````text
// and thus create the docks. This prevents pointing trying to access
````

## Línea 2220

````text
// monitors throughout the code, were we are assuming that at least the
````

## Línea 2221

````text
// primary monitor is present.
````

## Línea 2232

````text
// Primary monitor used to be always 0 in Gdk, but the shell has a different
````

## Línea 2233

````text
// concept (where the order depends on mutter order).
````

## Línea 2234

````text
// So even if now the extension settings may use the same logic of the shell
````

## Línea 2235

````text
// we prefer not to break the previously configured systems, and so we still
````

## Línea 2236

````text
// assume that the gsettings monitor numbering follows the old strategy.
````

## Línea 2237

````text
// This ensure the indexing in the settings and in the shell are matched,
````

## Línea 2238

````text
// i.e. that we start counting from the primaryMonitorIndex
````

## Línea 2244

````text
// In case of multi-monitor, we consider the dock on the primary monitor
````

## Línea 2245

````text
// to be the preferred (main) one regardless of the settings the dock
````

## Línea 2246

````text
// goes on the primary monitor also if the settings are inconsistent
````

## Línea 2247

````text
// (e.g. desired monitor not connected).
````

## Línea 2254

````text
// First we create the main Dock, to get the extra features to bind to this one
````

## Línea 2260

````text
// Make the necessary changes to Main.overview.dash
````

## Línea 2263

````text
// Adjust corners if necessary
````

## Línea 2276

````text
// Load optional features. We load *after* the docks are created, since
````

## Línea 2277

````text
// we need to connect the signals to all dock instances.
````

## Línea 2288

````text
// connect app icon into the view selector
````

## Línea 2317

````text
// Unredirection is refcounted by the compositor, so hold a single
````

## Línea 2318

````text
// reference for all the docks: this way it can't be left unbalanced
````

## Línea 2319

````text
// when docks are destroyed and re-created.
````

## Línea 2363

````text
// Ensure Main.overview.dash is set to our dash in dummy mode
````

## Línea 2364

````text
// while just use the default getter otherwise.
````

## Línea 2373

````text
// Hide usual Dash
````

## Línea 2376

````text
// Also set dash width to 1, so it's almost not taken into account by code
````

## Línea 2377

````text
// calculating the reserved space in the overview. The reason to keep it at 1 is
````

## Línea 2378

````text
// to allow its visibility change to trigger an allocation of the appGrid which
````

## Línea 2379

````text
// in turn is triggering the appsIcon spring animation, required when no other
````

## Línea 2380

````text
// actors has this effect, i.e in horizontal mode and without the workspaceThumbnails
````

## Línea 2381

````text
// 1 static workspace only)
````

## Línea 2394

````text
// Pretend I'm the dash: meant to make app grid swarm animation come from
````

## Línea 2395

````text
// the right position of the appShowButton.
````

## Línea 2400

````text
// And to return the preferred height depending on the state
````

## Línea 2409

````text
// We also need to ignore max-size changes
````

## Línea 2414

````text
// And to return the preferred height depending on the state
````

## Línea 2421

````text
// ensure that an undefined value will be converted into a valid one
````

## Línea 2447

````text
// Workspaces preserve the monitor work area aspect ratio, so when
````

## Línea 2448

````text
// the dock reduces the available width we must reduce the height
````

## Línea 2449

````text
// too, otherwise the current workspace fills the whole box and
````

## Línea 2450

````text
// pushes the adjacent ones outside of the visible area.
````

## Línea 2511

````text
// GNOME 46 changes "spacing" to "_spacing".
````

## Línea 2546

````text
/**
         * This can be removed or bypassed when GNOME/gnome-shell!1892 will be merged
         *
         * @param originalFunction
         * @param state
         * @param workAreaBox
         * @param {...any} args
         */
````

## Línea 2575

````text
// GNOME 46 changes "spacing" to "_spacing".
````

## Línea 2623

````text
// Sadly CtrlAltTabPopup is not exported, so we cannot just patch it.
````

## Línea 2647

````text
// This code has been submitted upstream via GNOME/gnome-shell!1892
````

## Línea 2648

````text
// so can be removed when that gets merged (or bypassed on newer shell
````

## Línea 2649

````text
// versions).
````

## Línea 2673

````text
// Reduce the space that the workspaces can use in secondary monitors
````

## Línea 2702

````text
// Convince LayoutManager to use the legacy startup animation:
````

## Línea 2703

````text
// Reset overview controls state to HIDDEN, as skipping the startup
````

## Línea 2704

````text
// overview leaves it stuck at WINDOW_PICKER
````

## Línea 2720

````text
// Use a dummy actor as dash during the startup animation, until
````

## Línea 2721

````text
// we're done with it, so that nothing is really shown or modified
````

## Línea 2722

````text
// during the upstream startup animation, that still requires to
````

## Línea 2723

````text
// have a valid actor.
````

## Línea 2752

````text
// Remove extra features
````

## Línea 2758

````text
// Delete all docks
````

## Línea 2776

````text
// reset default dash size
````

## Línea 2777

````text
// This force the recalculation of the icon size
````

## Línea 2801

````text
// TODO: I'm not sure how reliable this is, we might need to move the
````

## Línea 2802

````text
// _onShowAppsButtonToggled logic into the extension.
````

## Línea 2807

````text
// Instead of "syncing" the stock button, let's call its callback directly.
````

## Línea 2811

````text
// Because we "disconnected" from the search controller, we have to manage its state.
````

## Línea 2870

````text
/**
     * Adjust Panel corners, remove this when 41 won't be supported anymore
     */
````

## Línea 2904

````text
// This class drives long-running icon animations, to keep them running in sync
````

## Línea 2905

````text
// with each other, and to save CPU by pausing them when the dock is hidden.
````
