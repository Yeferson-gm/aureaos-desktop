# Notas de extensions/desktop-icons/app/desktopGrid.js

Comentarios trasladados durante la consolidación. Los números corresponden al archivo antes del traslado.

## Línea 75

````text
// Transparent Background only if this is working as a desktop
````

## Línea 87

````text
// Wayland compositor may hang on some high-resolution displays
````

## Línea 88

````text
// unless windows are maximized before first map.
````

## Línea 96

````text
// Maximize however creates an error where the window can
````

## Línea 97

````text
// be moved by the user by dragging down on top panel.
````

## Línea 98

````text
// So we unmaximize all windows after they are mapped
````

## Línea 99

````text
// as maximization is not needed anymore.
````

## Línea 103

````text
// Opaque black test window
````

## Línea 107

````text
// Remove any other css classes, even if applied by other apps later
````

## Línea 120

````text
// Do not destroy window when closing if the instance
````

## Línea 121

````text
// is working as desktop
````

## Línea 124

````text
// Exit if this instance is working as an
````

## Línea 125

````text
// stand-alone window
````

## Línea 132

````text
// New: one fixed root that contains both layers
````

## Línea 141

````text
// icon grid goes in rootFixed
````

## Línea 160

````text
// show/present only here after the window is fully set up to
````

## Línea 161

````text
// and to avoit commiting content too early so that the shell
````

## Línea 162

````text
// errors on commiting first frame before acknowleding ack from wayland
````

## Línea 163

````text
// compositor.
````

## Línea 254

````text
// Establish and update window geometry, establish and update
````

## Línea 255

````text
// grid for the desktop icons
````

## Línea 267

````text
// GNOME Shell reports logical coordinates when the scale factor is 1.
````

## Línea 268

````text
// In that case, DING should not divide the geometry by zoom again.
````

## Línea 397

````text
// Ensure event targets cover the full window even when no icons/widgets
````

## Línea 427

````text
// Compute correct position for pop up menus relative to
````

## Línea 428

````text
// margins to prevent going under/over margins
````

## Línea 604

````text
// Functions for computing postion/Geometry
````

## Línea 607

````text
// Returns the column, row of the grid that holds the local x, y
````

## Línea 617

````text
// Returns the local grid coordinates of top left rectangle
````

## Línea 618

````text
// vertex of the grid that has local x,y
````

## Línea 632

````text
// Returns the distance to the middle point of this grid from X //
````

## Línea 733

````text
// returns the local or global coordinates if requested,
````

## Línea 734

````text
// of the local grid rectangle top left vertex that contains x, y
````

## Línea 748

````text
// Functions to query and set grid use by Icons and files
````

## Línea 751

````text
// only works for grid placement of icons,
````

## Línea 752

````text
// with free placements there maybe multiple fileItems per grid
````

## Línea 808

````text
// Returns true if there is an available slot in the grid
````

## Línea 850

````text
// returns if grid at column row has a file or not
````

## Línea 858

````text
// returns if the local grid containing local coordinates
````

## Línea 859

````text
// x, y has a file assigned.
````

## Línea 872

````text
// returns the column row of empty grid available at global X, Y
````

## Línea 932

````text
// Finally the actual code that places and removes icons on the desktop
````

## Línea 962

````text
/* If this file is new in the Desktop and hasn't yet
         * fixed coordinates, store the new position to ensure
         * that the next time it will be shown in the same position.
         * Also store the new position if it has been moved by the user,
         * and not triggered by a screen change.
         */
````

## Línea 999

````text
// For sanpping to grid
````

## Línea 1020

````text
// For free placement
````

## Línea 1022

````text
// Make sure the icon lands inside the grid and does not protrude out
````

## Línea 1050

````text
// recompute global coordinates from the translocatedd local coordinates
````

## Línea 1064

````text
// set column row being used for all four vertices
````

## Línea 1072

````text
/* If this file is new in the Desktop and hasn't yet
         * fixed coordinates, store the new position to ensure
         * that the next time it will be shown in the same position.
         * Also store the new position if it has been moved by the user,
         * and not triggered by a screen change.
         */
````

## Línea 1169

````text
// Ensure this widget contributes a node so the frame overwrites stale content.
````

## Línea 1202

````text
// Functions for drawing on the grid
````

## Línea 1482

````text
// Private methods
````

## Línea 1485

````text
// Bubble-phase controller: delivers key events to DesktopManager for actions
````

## Línea 1490

````text
// Capture-phase controller: only caches modifier state, does not invoke actions
````

## Línea 1674

````text
// Parameterized MIME names cannot be enumerated ahead of time.
````

## Línea 1675

````text
// The accept handler filters all offers, including exact
````

## Línea 1676

````text
// source-supplied filename tokens.
````

## Línea 1787

````text
// Start the asynchronous read → selected action → native finish chain.
````

## Línea 1788

````text
// `void` explicitly discards the returned Promise; the GTK handler
````

## Línea 1789

````text
// returns without awaiting its completion.
````

## Línea 1792

````text
// True means that we accepted responsibility for finishing the drop;
````

## Línea 1793

````text
// it does not mean that the asynchronous operation has finished yet.
````

## Línea 2019

````text
/* A Picture that can translate itself at paint time (render-only) */
````

## Línea 2149

````text
// Adds an auxiliary fixed layer that can sit above/below the icon grid.
````

## Línea 2153

````text
// instanceId
````

## Línea 2154

````text
// instanceId
````

## Línea 2155

````text
// Pending only until the pointer moves far enough to count as a drag.
````

## Línea 2157

````text
// Small pointer jitter should not steal clicks from draggable chrome.
````

## Línea 2174

````text
// Click gesture: used only to track selection + click radius
````

## Línea 2256

````text
// Widgets above icons (edit mode)
````

## Línea 2257

````text
// Draw order: icons (bottom), widgets (top)
````

## Línea 2259

````text
// Reorder without unparenting:
````

## Línea 2260

````text
// place widgetContainer after container in _rootFixed
````

## Línea 2266

````text
// Input: widget layer active, icons inert
````

## Línea 2279

````text
// Icons above widgets (normal mode)
````

## Línea 2280

````text
// Draw order: widgets (bottom), icons (top)
````

## Línea 2282

````text
// Reorder the other way: container after widgetContainer
````

## Línea 2288

````text
// Input: icons active, widget layer background only
````

## Línea 2377

````text
// Record the chrome press; actual drag start waits for movement.
````

## Línea 2387

````text
// Ignore small jitter until the pointer has moved far enough
````

## Línea 2388

````text
// to count as a real drag. This will reliably deliver clicks
````

## Línea 2389

````text
// to the underlying chrome as we are using a grouped controllers
````

## Línea 2437

````text
// We only want to return a direct child in widgetContainer,
````

## Línea 2618

````text
// Reliable for the normal widget-content path: if the press stayed
````

## Línea 2619

````text
// within click radius and did not become a drag, we hand the click
````

## Línea 2620

````text
// back to the child actor here. Chrome drag handles use their own
````

## Línea 2621

````text
// thresholded path and do not depend on this fallback.
````

## Línea 2626

````text
// Keep a small click radius so tiny pointer jitter does not turn a
````

## Línea 2627

````text
// normal widget click into a drag-like sequence.
````

## Línea 2635

````text
// At this point we’ve done all our selection work in _onClick.
````

## Línea 2636

````text
// For a real click, we now DENY the sequence
````

## Línea 2637

````text
// so that the underlying actor (HTML WebView or Gtk.Button add
````

## Línea 2638

````text
// widget) sees a normal click.
````

## Línea 2722

````text
// single tuning knob for spring snappiness
````

## Línea 2723

````text
// in ms
````

## Línea 2867

````text
// If the content rectangles are the same shape, we can just tween
````

## Línea 2868

````text
// the top left corner of the content rectangle as the anchor
````

## Línea 2869

````text
// for pixel perfect alignment of the content rectangle.
````

## Línea 2879

````text
// If the content rectangles are not the same shape, or if the
````

## Línea 2880

````text
// or both axis changed size, then we cannot just tween the
````

## Línea 2881

````text
// top left corner of the content rectangle as the anchor.
````

## Línea 2882

````text
// Instead, we need to tween the center, to account for the
````

## Línea 2883

````text
// difference in aspect ratio.
````

## Línea 2903

````text
// coalesce multiple relayouts within this time
````

## Línea 2919

````text
// < 1 => underdamped (dip then settle)
````

## Línea 2927

````text
// animates around 1.0 due to initial_velocity
````

## Línea 2938

````text
// negative => dip “away”, then return
````

## Línea 2947

````text
// 0.0 to 1.0
````

## Línea 2953

````text
// Fade in the NEW live layers only near the end
````

## Línea 2969

````text
// Ensure we end exactly at identity scale
````

## Línea 2999

````text
// No visible change, so just end the animation
````

## Línea 3003

````text
// Initialize transform for the OLD snapshot we are animating
````

## Línea 3004

````text
// - translation starts at the old position
````

## Línea 3005

````text
// - scale is 1.0 (no depth change yet)
````

## Línea 3006

````text
// - pivot is from tweenDelta (center for shape change, topleft otherwise)
````
