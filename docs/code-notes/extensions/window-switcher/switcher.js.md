# Notas de extensions/window-switcher/switcher.js

Comentarios trasladados durante la consolidación. Los números corresponden al archivo antes del traslado.

## Línea 106

````text
// create a container for all our widgets
````

## Línea 115

````text
// Keep app sub-switchers above the parent application switcher.
````

## Línea 155

````text
// Find all the apps and associated windows
````

## Línea 164

````text
/* If only one app, then just switch between the windows of
               that app. */
````

## Línea 171

````text
// For each app, display the first window only
````

## Línea 193

````text
// create previews
````

## Línea 196

````text
/*Need to have this.actor shown to get the correct centering of the icon labels. Cannot
        tell you exactly way, because things are close but off if you don't do this.*/
````

## Línea 216

````text
// hide windows and showcd  Coverflow actors
````

## Línea 217

````text
// Only hide windows on the current workspace. Hiding (and later
````

## Línea 218

````text
// re-showing) windows from other workspaces makes them briefly render
````

## Línea 219

````text
// on the current workspace as non-interactive ghosts on GNOME 48+.
````

## Línea 607

````text
// Always return the original monitor, otherwise, previews ease to the
````

## Línea 608

````text
// wrong monitor on destroy if you move the mouse to a different monitor.
````

## Línea 657

````text
// ellipsize if title is too long
````

## Línea 706

````text
//this.previewActor.add_child(icon);
````

## Línea 718

````text
/*Window titles:*/
````

## Línea 744

````text
/*Icons*/
````

## Línea 870

````text
// Esc -> close CoverFlow
````

## Línea 876

````text
// Right/Down -> navigate to next preview
````

## Línea 882

````text
// Left/Up -> navigate to previous preview
````

## Línea 890

````text
// D -> Show desktop
````

## Línea 894

````text
// default alt-tab
````

## Línea 906

````text
// shift -> backwards
````

## Línea 1039

````text
//icon.destroy();
````

## Línea 1040

````text
//window = null;
````

## Línea 1180

````text
// Only re-show windows that belong to the current workspace.
````

## Línea 1181

````text
// Re-showing windows from other workspaces is what left them
````

## Línea 1182

````text
// ghosting on the current workspace after a switch.
````

## Línea 1244

````text
// window title and icon
````

## Línea 1255

````text
// preview windows
````

## Línea 1381

````text
/* Code that ensures redrawing even if the compositor thinks there
    should be clipping. Necessary because nmoving the camera does
    not move the clipping pov so the compositor thinks some things don't need
    redrawing because they are blocked by other things, but that's only
    true from the perspective of the centered camera. For some reason this
    works better than the inhibitCulling method which doesn't seem to work.

    Code stolen from the blur my shell extension, blur-my-shell@aunetx.*/
````

## Línea 1389

````text
/// Add the Clutter debug flag.
````

## Línea 1396

````text
/// Remove the Clutter debug flag.
````

## Línea 1403

````text
/*
     *
     * The following code that centers the camera on an off-center monitor
     * is taken from the Desktop Cube extension.
     * https://github.com/Schneegans/Desktop-Cube/blob/fa07fba3016ede5049eace2c028a7ba34dae12ef/extension.js#L1032-L1174
     *
     */
````

## Línea 1411

````text
// Calls inhibit_culling on the given actor and recursively on all mapped children.
````

## Línea 1420

````text
// Calls uninhibit_culling on the given actor and recursively on all children. It will
````

## Línea 1421

````text
// only call uninhibit_culling() on those actors which were inhibited before.
````

## Línea 1429

````text
// Usually, GNOME Shell uses one central perspective for all monitors combined. This
````

## Línea 1430

````text
// results in a somewhat sheared appearance of the cube on multi-monitor setups where
````

## Línea 1431

````text
// the primary monitor is not in the middle (or cubes are shown on multiple monitors).
````

## Línea 1432

````text
// With the code below, we modify the projection and view matrices for each monitor so
````

## Línea 1433

````text
// that each monitor uses its own central perspective. This seems to be possible on
````

## Línea 1434

````text
// Wayland only. On X11, there's only one set of projection and view matrices for all
````

## Línea 1435

````text
// monitors combined, so we tweak them so that the projection center is in the middle of
````

## Línea 1436

````text
// the primary monitor. So it will at least only look bad on X11 if the cube is shown on
````

## Línea 1437

````text
// all monitors...
````

## Línea 1443

````text
// Do nothing if neither overview or desktop switcher are shown.
````

## Línea 1448

````text
// Usually, the virtual camera is positioned centered in front of the stage. We will
````

## Línea 1449

````text
// move the virtual camera around. These variables will be the new stage-relative
````

## Línea 1450

````text
// coordinates of the virtual camera.
````

## Línea 1456

````text
// This is the offset to the original, centered camera position. Y is flipped due to
````

## Línea 1457

````text
// some negative scaling at some point in Mutter.
````

## Línea 1464

````text
// The code below is copied from Mutter's Clutter.
````

## Línea 1465

````text
// https://gitlab.gnome.org/GNOME/mutter/-/blob/main/clutter/clutter/clutter-stage.c#L2255
````

## Línea 1473

````text
// The code below is copied from Mutter's Clutter as well.
````

## Línea 1474

````text
// https://gitlab.gnome.org/GNOME/mutter/-/blob/main/clutter/clutter/clutter-stage.c#L2270
````

## Línea 1490

````text
// End of the copy-paste code.
````

## Línea 1492

````text
// Compute the required offset of the frustum planes at the near plane. This
````

## Línea 1493

````text
// basically updates the projection matrix according to our new camera position.
````

## Línea 1497

````text
// Set the new frustum.
````

## Línea 1501

````text
// Translate the virtual camera. This basically updates the view matrix according to
````

## Línea 1502

````text
// our new camera position.
````

## Línea 1510

````text
// Revert the matrix changes before the update,
````

## Línea 1512

````text
// Nothing to do if neither overview or desktop switcher are shown.
````

## Línea 1525

````text
// Reverts the changes done with the method above.
````
