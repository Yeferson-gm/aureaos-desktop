# Notas de extensions/desktop-cube/extension.js

Comentarios trasladados durante la consolidación. Los números corresponden al archivo antes del traslado.

## Línea 35

````text
//////////////////////////////////////////////////////////////////////////////////////////
````

## Línea 36

````text
// This extensions tweaks the positioning of workspaces in overview mode and while      //
````

## Línea 37

````text
// switching workspaces in desktop mode to make them look like cube faces.              //
````

## Línea 38

````text
//////////////////////////////////////////////////////////////////////////////////////////
````

## Línea 42

````text
// Maximum degrees the cube can be rotated up and down.
````

## Línea 45

````text
// Spacing to the screen sides of the vertically rotated cube.
````

## Línea 51

````text
// ------------------------------------------------------------------------ public stuff
````

## Línea 53

````text
// This function could be called after the extension is enabled, which could be done
````

## Línea 54

````text
// from GNOME Tweaks, when you log in or when the screen is unlocked.
````

## Línea 57

````text
// Store a reference to the settings object.
````

## Línea 60

````text
// We will monkey-patch these methods. Let's store the original ones.
````

## Línea 68

````text
// We will use extensionThis to refer to the extension inside the patched methods.
````

## Línea 71

````text
// -----------------------------------------------------------------------------------
````

## Línea 72

````text
// ------------------------------- cubify the overview -------------------------------
````

## Línea 73

````text
// -----------------------------------------------------------------------------------
````

## Línea 75

````text
// Normally, all workspaces outside the current field-of-view are hidden. We want to
````

## Línea 76

````text
// show all workspaces, so we patch this method. The original code is about here:
````

## Línea 77

````text
// https://gitlab.gnome.org/GNOME/gnome-shell/-/blob/main/js/ui/workspacesView.js#L420
````

## Línea 84

````text
// Usually, workspaces are placed next to each other separated by a few pixels (this
````

## Línea 85

````text
// separation is usually computed by the method below). To create the desktop cube, we
````

## Línea 86

````text
// have to position all workspaces on top of each other and rotate the around a pivot
````

## Línea 87

````text
// point in the center of the cube.
````

## Línea 88

````text
// The original arrangement of the workspaces is implemented in WorkspacesView's
````

## Línea 89

````text
// vfunc_allocate() which cannot be monkey-patched. As a workaround, we return a
````

## Línea 90

````text
// negative spacing in the method below...
````

## Línea 91

````text
// The original code is about here:
````

## Línea 92

````text
// https://gitlab.gnome.org/GNOME/gnome-shell/-/blob/main/js/ui/workspacesView.js#L219
````

## Línea 94

````text
// We use the "normal" workspace spacing in desktop and app-grid mode.
````

## Línea 102

````text
// Compute the negative spacing required to arrange workspaces on top of each other.
````

## Línea 105

````text
// Blend between the negative overlap-spacing and the "normal" spacing value.
````

## Línea 110

````text
// This is the main method which is called whenever the workspaces need to be
````

## Línea 111

````text
// repositioned.
````

## Línea 112

````text
// https://gitlab.gnome.org/GNOME/gnome-shell/-/blob/main/js/ui/workspacesView.js#L255
````

## Línea 114

````text
// Use the original method if we have just one workspace.
````

## Línea 121

````text
// Here's a minor hack to improve the performance: During the transitions to / from
````

## Línea 122

````text
// the app drawer, this._updateWorkspacesState is called twice a frame. Once from
````

## Línea 123

````text
// the notify handler of this._fitModeAdjustment and thereafter once from the notify
````

## Línea 124

````text
// handler of this._overviewAdjustment. As this seems not so useful (and degrades
````

## Línea 125

````text
// performance a lot), we skip the first call. I am not aware of any cases where
````

## Línea 126

````text
// this._fitModeAdjustment is changed without any of the over adjustments to change
````

## Línea 127

````text
// as well...
````

## Línea 128

````text
// https://gitlab.gnome.org/GNOME/gnome-shell/-/blob/main/js/ui/workspacesView.js#L109
````

## Línea 129

````text
// https://gitlab.gnome.org/GNOME/gnome-shell/-/blob/main/js/ui/workspacesView.js#L45
````

## Línea 134

````text
// Compute blending state from and to the overview, from and to the app grid, and
````

## Línea 135

````text
// from and to the desktop mode. We will use cubeMode to fold and unfold the
````

## Línea 136

````text
// cube, overviewMode to add some depth between windows and backgrounds, and
````

## Línea 137

````text
// appDrawerMode to attenuate the scaling effect of the active workspace.
````

## Línea 142

````text
// First we need the width of a single workspace. Simply calling
````

## Línea 143

````text
// this._workspaces[0]._background.width does not work in all cases, as this method
````

## Línea 144

````text
// seems to be called also when the background actor is not on the stage. As a hacky
````

## Línea 145

````text
// workaround, we store the last valid workspace width we got and use that value if
````

## Línea 146

````text
// we cannot get a new one...
````

## Línea 152

````text
// Add gaps between workspaces in overview mode.
````

## Línea 159

````text
// That's the angle between consecutive workspaces.
````

## Línea 162

````text
// That's the z-distance from the cube faces to the rotation pivot.
````

## Línea 165

````text
// Apply vertical rotation if required. This comes from the pitch value of the
````

## Línea 166

````text
// modified SwipeTracker created by _addOverviewDragGesture() further below.
````

## Línea 171

````text
// During rotations, the cube is scaled down and the windows are "exploded". If we
````

## Línea 172

````text
// are directly facing a cube side, the strengths of both effects are approaching
````

## Línea 173

````text
// zero. The strengths of both effects are small during horizontal rotations to make
````

## Línea 174

````text
// workspace-switching not so obtrusive. However, during vertical rotations, the
````

## Línea 175

````text
// effects are stronger.
````

## Línea 180

````text
// Now loop through all workspace and compute the individual rotations.
````

## Línea 182

````text
// First update the corner radii. Corners are only rounded in overview.
````

## Línea 185

````text
// Now update the rotation of the cube face. The rotation center is -centerDepth
````

## Línea 186

````text
// units behind the front face.
````

## Línea 189

````text
// Make cube smaller during rotations.
````

## Línea 192

````text
// The rotation angle is transitioned proportional to cubeMode^1.5. This slows
````

## Línea 193

````text
// down the rotation a bit closer to the desktop and to the app drawer.
````

## Línea 197

````text
// Distance to being the active workspace in [-1...0...1].
````

## Línea 200

````text
// This moves next and previous workspaces a bit to the left and right. This
````

## Línea 201

````text
// ensures that we can actually see them if we look at the cube from the front.
````

## Línea 202

````text
// The value is set to zero if we have five or more workspaces.
````

## Línea 210

````text
// Update opacity only in overview mode.
````

## Línea 216

````text
// Update workspace scale only in app grid mode. The 0.94 is supposed to be the
````

## Línea 217

````text
// same value as the WORKSPACE_INACTIVE_SCALE defined here:
````

## Línea 218

````text
// https://gitlab.gnome.org/GNOME/gnome-shell/-/blob/main/js/ui/workspacesView.js#L21
````

## Línea 219

````text
// As this is defined as 'const', we cannot access it here. But the exact value
````

## Línea 220

````text
// also not really matters...
````

## Línea 224

````text
// Now we add some depth separation between the window clones. If the explode
````

## Línea 225

````text
// factor becomes too small, the depth sorting becomes non-deterministic.
````

## Línea 230

````text
// Distribute the window clones translation_z values between zero and
````

## Línea 231

````text
// explode.
````

## Línea 236

````text
// Now sort the window clones according to the orthogonal distance of the actor
````

## Línea 237

````text
// planes to the camera. This ensures proper depth sorting among the window
````

## Línea 238

````text
// clones.
````

## Línea 245

````text
// Now we sort the children of the workspace (e.g. the background actor
````

## Línea 246

````text
// and the container for the window clones) by their orthogonal distance to the
````

## Línea 247

````text
// virtual camera. We add a tiny translation to the window-clone container to
````

## Línea 248

````text
// allow for proper sorting.
````

## Línea 253

````text
// The depth-sorting of cube faces is quite simple, we sort them by increasing
````

## Línea 254

````text
// rotation angle so that they are drawn back-to-front.
````

## Línea 259

````text
// -----------------------------------------------------------------------------------
````

## Línea 260

````text
// --------------------- cubify workspace-switch in desktop mode ---------------------
````

## Línea 261

````text
// -----------------------------------------------------------------------------------
````

## Línea 263

````text
// This override rotates the workspaces during the transition to look like cube
````

## Línea 264

````text
// faces. The original movement of the workspaces is implemented in the setter of
````

## Línea 265

````text
// the progress property. We do not touch this, as keeping track of this progress
````

## Línea 266

````text
// is rather important. Instead, we listen to progress changes and tweak the
````

## Línea 267

````text
// transformation accordingly.
````

## Línea 268

````text
// This lambda is called in two places (further down), once for updates of the
````

## Línea 269

````text
// progress property, once for updates during gesture swipes. The latter does not
````

## Línea 270

````text
// trigger notify signals of the former for some reason...
````

## Línea 272

````text
// First, we prevent any horizontal movement by countering the translation. We
````

## Línea 273

````text
// cannot simply set the x property to zero as this is used to track the
````

## Línea 274

````text
// progress.
````

## Línea 277

````text
// That's the desired angle between consecutive workspaces.
````

## Línea 280

````text
// That's the z-distance from the cube faces to the rotation pivot.
````

## Línea 284

````text
// Apply vertical rotation if required. This comes from the pitch value of the
````

## Línea 285

````text
// modified SwipeTracker created by _addDesktopDragGesture() further below.
````

## Línea 291

````text
// During rotations, the cube is scaled down and the windows are "exploded". If we
````

## Línea 292

````text
// are directly facing a cube side, the strengths of both effects are approaching
````

## Línea 293

````text
// zero. The strengths of both effects are small during horizontal rotations to make
````

## Línea 294

````text
// workspace-switching not so obtrusive. However, during vertical rotations, the
````

## Línea 295

````text
// effects are stronger.
````

## Línea 299

````text
// Rotate the individual faces.
````

## Línea 307

````text
// Counter the horizontal movement.
````

## Línea 310

````text
// Make cube transparent during vertical rotations.
````

## Línea 313

````text
// Now we add some depth separation between the window clones. We get the stacking
````

## Línea 314

````text
// order from the global window list. If the explode factor becomes too small, the
````

## Línea 315

````text
// depth sorting becomes non-deterministic.
````

## Línea 321

````text
// Distribute the window clones translation_z values between zero and
````

## Línea 322

````text
// explode.
````

## Línea 330

````text
// Now sort the window clones and the background actor according to the
````

## Línea 331

````text
// orthogonal distance of the actor planes to the camera. This ensures proper
````

## Línea 332

````text
// depth sorting.
````

## Línea 338

````text
// The depth-sorting of cube faces is quite simple, we sort them by increasing
````

## Línea 339

````text
// rotation angle.
````

## Línea 342

````text
// Update horizontal rotation of the background panorama during workspace switches.
````

## Línea 349

````text
// Whenever a workspace-switch is about to happen, we tweak the MonitorGroup class a
````

## Línea 350

````text
// bit to arrange the workspaces in a cube-like fashion. We have to adjust to parts of
````

## Línea 351

````text
// the code as the automatic transitions (e.g. when switching with key combinations)
````

## Línea 352

````text
// are handled differently than the gesture based switches.
````

## Línea 353

````text
// https://gitlab.gnome.org/GNOME/gnome-shell/-/blob/main/js/ui/workspaceAnimation.js#L377
````

## Línea 355

````text
// Here, we call the original method without any arguments. Usually, GNOME Shell
````

## Línea 356

````text
// "skips" workspaces when switching to a workspace which is more than one workspace
````

## Línea 357

````text
// to the left or the right. This behavior is not desirable for the cube, as it
````

## Línea 358

````text
// messes with your spatial memory. If no workspaceIndices are given to this method,
````

## Línea 359

````text
// all workspaces will be shown during the workspace switch.
````

## Línea 362

````text
// Now tweak the monitor groups.
````

## Línea 364

````text
// Call the method above whenever the transition progress changes.
````

## Línea 368

````text
// Call the method above whenever a gesture is active.
````

## Línea 376

````text
// Make sure that the background panorama is drawn above the window group during a
````

## Línea 377

````text
// workspace switch.
````

## Línea 382

````text
// If the workspaces are only on the primary monitor, the skybox would cover all
````

## Línea 383

````text
// other non-rotating screens. Therefore, we temporarily limit its size to the
````

## Línea 384

````text
// primary monitor's size.
````

## Línea 396

````text
// Re-attach the background panorama to the stage once the workspace switch is done.
````

## Línea 407

````text
// Make sure that the skybox covers the entire stage again.
````

## Línea 422

````text
// -----------------------------------------------------------------------------------
````

## Línea 423

````text
// ------------------------- enable cube rotation by dragging ------------------------
````

## Línea 424

````text
// -----------------------------------------------------------------------------------
````

## Línea 426

````text
// Usually, in GNOME Shell 40+, workspaces are move horizontally. We tweaked this to
````

## Línea 427

````text
// look like a horizontal rotation above. To store the current vertical rotation, we
````

## Línea 428

````text
// use the adjustment below.
````

## Línea 431

````text
// The overview's SwipeTracker will control the _overviewAdjustment of the
````

## Línea 432

````text
// WorkspacesDisplay. However, only horizontal swipes will update this adjustment. If
````

## Línea 433

````text
// only our pitch adjustment is changed (e.g. the user moved the mouse only
````

## Línea 434

````text
// vertically), the _overviewAdjustment will not change and therefore the workspaces
````

## Línea 435

````text
// will not been redrawn. Here we force redrawing by notifying changes if the pitch
````

## Línea 436

````text
// value changes.
````

## Línea 444

````text
// In GNOME Shell, SwipeTrackers are used all over the place to capture swipe
````

## Línea 445

````text
// gestures. There's one for entering the overview, one for switching workspaces in
````

## Línea 446

````text
// desktop mode, one for switching workspaces in overview mode, one for horizontal
````

## Línea 447

````text
// scrolling in the app drawer, and many more. The ones used for workspace-switching
````

## Línea 448

````text
// usually do not respond to single-click dragging but only to multi-touch gestures.
````

## Línea 449

````text
// We want to be able to rotate the cube with the left mouse button, so we add an
````

## Línea 450

````text
// additional gesture to these two SwipeTracker instances tracking single-click drags.
````

## Línea 452

````text
// First, we fix an issue which leads to very quick workspace switches when the
````

## Línea 453

````text
// SwipeTracker are used with mouse clicks. When the mouse button is released, no
````

## Línea 454

````text
// event is added to the history. This means that the velocity is always calculated
````

## Línea 455

````text
// relative to the last received mouse movement. Even if he mouse pointer was
````

## Línea 456

````text
// stationary for some time, high velocities will be computed.
````

## Línea 458

````text
// Add a final time step to the history.
````

## Línea 461

````text
// Then call the original method.
````

## Línea 465

````text
// Add single-click drag gesture to the desktop.
````

## Línea 478

````text
// Add single-click drag gesture to the panel.
````

## Línea 491

````text
// Add single-click drag gesture to the overview.
````

## Línea 505

````text
// -----------------------------------------------------------------------------------
````

## Línea 506

````text
// ---------------------------------- add the skybox ---------------------------------
````

## Línea 507

````text
// -----------------------------------------------------------------------------------
````

## Línea 509

````text
// This is called whenever the skybox texture setting is changed.
````

## Línea 511

````text
// First, delete the existing skybox.
````

## Línea 519

````text
// Then, load a new one (if any).
````

## Línea 524

````text
// We add the skybox below everything.
````

## Línea 527

````text
// Make sure that the skybox covers the entire stage.
````

## Línea 539

````text
// Update the skybox whenever the corresponding setting is changed.
````

## Línea 543

````text
// Update vertical rotation of the background panorama.
````

## Línea 550

````text
// Update horizontal rotation of the background panorama during workspace switches in
````

## Línea 551

````text
// the overview.
````

## Línea 563

````text
// -----------------------------------------------------------------------------------
````

## Línea 564

````text
// ----------------------- enable edge-drag workspace-switches -----------------------
````

## Línea 565

````text
// -----------------------------------------------------------------------------------
````

## Línea 567

````text
// We add two Meta.Barriers, one at each side of the stage. If the pointer hits one of
````

## Línea 568

````text
// these with enough pressure while dragging a window, we initiate a workspace-switch.
````

## Línea 569

````text
// The last parameter (0) is actually supposed to be a bitwise combination of
````

## Línea 570

````text
// Shell.ActionModes. The pressure barrier will only trigger, if Main.actionMode
````

## Línea 571

````text
// equals one of the given action modes. This works well for Shell.ActionMode.NORMAL
````

## Línea 572

````text
// and Shell.ActionMode.OVERVIEW, however it does not work for Shell.ActionMode.NONE
````

## Línea 573

````text
// (which actually equals zero). However, when we want the barriers to also trigger in
````

## Línea 574

````text
// Shell.ActionMode.NONE, as this is the mode during a drag-operation in the overview.
````

## Línea 575

````text
// Therefore, we modify the _onBarrierHit method of the pressure barrier to completely
````

## Línea 576

````text
// ignore this parameter. Instead, we check for the correct action mode in the trigger
````

## Línea 577

````text
// handler.
````

## Línea 581

````text
// Update pressure threshold when the corresponding settings key changes.
````

## Línea 586

````text
// This is an exact copy of the original _onBarrierHit, with only one line disabled to
````

## Línea 587

````text
// ignore the given ActionMode.
````

## Línea 588

````text
// https://gitlab.gnome.org/GNOME/gnome-shell/-/blob/main/js/ui/layout.js#L1411
````

## Línea 592

````text
// If we've triggered the barrier, wait until the pointer has the
````

## Línea 593

````text
// left the barrier hitbox until we trigger it again.
````

## Línea 598

````text
// Throw out all events not in the proper keybinding mode
````

## Línea 599

````text
// if (!(this._actionMode & Main.actionMode)) return;
````

## Línea 609

````text
// Throw out events where the cursor is move more
````

## Línea 610

````text
// along the axis of the barrier than moving with
````

## Línea 611

````text
// the barrier.
````

## Línea 625

````text
// Now we add the left and right barrier to the pressure barrier.
````

## Línea 637

````text
// Since GNOME 46, the display property is not required anymore.
````

## Línea 680

````text
// Re-create the barriers whenever the stage's allocation is changed.
````

## Línea 684

````text
// When the pressure barrier is triggered, the corresponding setting is enabled, and a
````

## Línea 685

````text
// window is currently dragged, we move the dragged window to the adjacent workspace
````

## Línea 686

````text
// and activate it as well.
````

## Línea 703

````text
// Keep a reference to the currently dragged window.
````

## Línea 710

````text
// Release the reference to the currently dragged window.
````

## Línea 718

````text
// -----------------------------------------------------------------------------------
````

## Línea 719

````text
// ------------------- fix perspective of multi-monitor setups -----------------------
````

## Línea 720

````text
// -----------------------------------------------------------------------------------
````

## Línea 722

````text
// Usually, GNOME Shell uses one central perspective for all monitors combined. This
````

## Línea 723

````text
// results in a somewhat sheared appearance of the cube on multi-monitor setups where
````

## Línea 724

````text
// the primary monitor is not in the middle (or cubes are shown on multiple monitors).
````

## Línea 725

````text
// With the code below, we modify the projection and view matrices for each monitor so
````

## Línea 726

````text
// that each monitor uses its own central perspective. This seems to be possible on
````

## Línea 727

````text
// Wayland only. On X11, there's only one set of projection and view matrices for all
````

## Línea 728

````text
// monitors combined, so we tweak them so that the projection center is in the middle
````

## Línea 729

````text
// of the primary monitor. So it will at least only look bad on X11 if the cube is
````

## Línea 730

````text
// shown on all monitors...
````

## Línea 732

````text
// Disable the perspective fixes first...
````

## Línea 735

````text
// Store this so we do not have to get it too often.
````

## Línea 740

````text
// ... and then enable them if required.
````

## Línea 753

````text
// This function could be called after the extension is uninstalled, disabled in GNOME
````

## Línea 754

````text
// Tweaks, when you log out or when the screen locks.
````

## Línea 757

````text
// Restore the original behavior.
````

## Línea 765

````text
// Remove all drag-to-rotate gestures.
````

## Línea 770

````text
// Clean up skybox.
````

## Línea 779

````text
// Clean up the edge-workspace-switching.
````

## Línea 793

````text
// Clean up perspective correction.
````

## Línea 797

````text
// Make sure that the settings object is freed.
````

## Línea 801

````text
// ----------------------------------------------------------------------- private stuff
````

## Línea 803

````text
// Calls inhibit_culling on the given actor and recursively on all mapped children.
````

## Línea 812

````text
// Calls uninhibit_culling on the given actor and recursively on all children. It will
````

## Línea 813

````text
// only call uninhibit_culling() on those actors which were inhibited before.
````

## Línea 822

````text
// Returns a value between [0...1] blending between overview (0) and app grid mode (1).
````

## Línea 827

````text
// Returns a value between [0...1] blending between desktop / app drawer mode (0) and
````

## Línea 828

````text
// overview mode (1).
````

## Línea 834

````text
// Returns a value between [0...1]. If it's 0, the cube should be unfolded, if it's 1,
````

## Línea 835

````text
// the cube should be drawn like, well, a cube :).
````

## Línea 840

````text
// Returns the angle between consecutive workspaces.
````

## Línea 843

````text
// With this setting, our "cube" only covers 180°, if there are only two workspaces,
````

## Línea 844

````text
// it covers 90°. This prevents the affordance that it could be possible to switch
````

## Línea 845

````text
// from the last ot the first workspace.
````

## Línea 850

````text
// Else the "cube" covers 360°.
````

## Línea 854

````text
// Returns the z-distance from the cube faces to the rotation pivot.
````

## Línea 863

````text
// This sorts the given list of children actors (which are supposed to be attached to
````

## Línea 864

````text
// the same parent) by increasing absolute rotation-y angle. This is used for
````

## Línea 865

````text
// depth-sorting, as cube faces which are less rotated, are in front of others.
````

## Línea 867

````text
// First create a copy of the actors list and sort it by decreasing rotation angle.
````

## Línea 873

````text
// Then sort the children actors accordingly.
````

## Línea 880

````text
// This sorts the given list of children actors (which are supposed to be attached to
````

## Línea 881

````text
// the same parent) by increasing orthogonal distance to the camera. To do this, the
````

## Línea 882

````text
// camera position is projected onto the plane defined by the actor and the absolute
````

## Línea 883

````text
// distance from the camera to its projected position is computed. This is used for
````

## Línea 884

````text
// depth-sorting a list of parallel actors.
````

## Línea 887

````text
// Sanity check.
````

## Línea 892

````text
// First, compute distance of virtual camera to the front workspace plane.
````

## Línea 900

````text
// All actors are expected to share the same parent.
````

## Línea 903

````text
// If the perspective is corrected for multi-monitor setups, the virtual camera is not
````

## Línea 904

````text
// in the middle of the stage but rather in front of each monitor.
````

## Línea 911

````text
// On Wayland, each monitor should have its own StageView. Therefore, the virtual
````

## Línea 912

````text
// camera has been positioned in front of each monitor separately.
````

## Línea 917

````text
// On X11, there's only one StageView. We move the virtual camera so that it is in
````

## Línea 918

````text
// front of the primary monitor.
````

## Línea 927

````text
// Create a list of the orthogonal distances to the camera for each actor.
````

## Línea 929

````text
// A point on the actor plane.
````

## Línea 933

````text
// A point one unit above the actor plane.
````

## Línea 937

````text
// The normal vector on the actor plane.
````

## Línea 954

````text
// Return the length of the projected vector.
````

## Línea 961

````text
// Sort by decreasing distance.
````

## Línea 966

````text
// Then use this to create a sorted list of actors.
````

## Línea 971

````text
// Finally, sort the children actors accordingly.
````

## Línea 977

````text
// During rotations, the cube is scaled down and the windows are "exploded". If we
````

## Línea 978

````text
// are directly facing a cube side, the strengths of both effects are approaching
````

## Línea 979

````text
// zero. The strengths of both effects are small during horizontal rotations to make
````

## Línea 980

````text
// workspace-switching not so obtrusive. However, during vertical rotations, the
````

## Línea 981

````text
// effects are stronger.
````

## Línea 982

````text
// This method returns two values:
````

## Línea 983

````text
// result[0]: A translation value by which the cube should be moved backwards.
````

## Línea 984

````text
// result[1]: A translation value by which windows may be moved away from the cube.
````

## Línea 987

````text
// These are zero if we are facing a workspace and one if we look directly at an
````

## Línea 988

````text
// edge between adjacent workspaces or if the cube is rotated vertically
````

## Línea 989

````text
// respectively.
````

## Línea 993

````text
// For horizontal rotations, we want to scale the cube (or rather move it backwards)
````

## Línea 994

````text
// a tiny bit to reveal a bit of parallax. However, if we have many cube sides, this
````

## Línea 995

````text
// looks weird, so we reduce the effect there. We use the offset which would make
````

## Línea 996

````text
// the cube's corners stay behind the original workspace faces during he rotation.
````

## Línea 1003

````text
// The explode factor is set to the hDepthOffset value to make the front-most
````

## Línea 1004

````text
// window stay at a constant depth.
````

## Línea 1007

````text
// For vertical rotations, we move the cube backwards to reveal everything. The
````

## Línea 1008

````text
// maximum explode width is set to half of the workspace size.
````

## Línea 1018

````text
// Use current maximum of both values.
````

## Línea 1022

````text
// Do not explode the cube in app drawer state. The stateAdjustment is...
````

## Línea 1023

````text
// ... 0 on the desktop
````

## Línea 1024

````text
// ... 1 in the window picker
````

## Línea 1025

````text
// ... 2 in the app drawer
````

## Línea 1032

````text
// Usually, GNOME Shell uses one central perspective for all monitors combined. This
````

## Línea 1033

````text
// results in a somewhat sheared appearance of the cube on multi-monitor setups where
````

## Línea 1034

````text
// the primary monitor is not in the middle (or cubes are shown on multiple monitors).
````

## Línea 1035

````text
// With the code below, we modify the projection and view matrices for each monitor so
````

## Línea 1036

````text
// that each monitor uses its own central perspective. This seems to be possible on
````

## Línea 1037

````text
// Wayland only. On X11, there's only one set of projection and view matrices for all
````

## Línea 1038

````text
// monitors combined, so we tweak them so that the projection center is in the middle of
````

## Línea 1039

````text
// the primary monitor. So it will at least only look bad on X11 if the cube is shown on
````

## Línea 1040

````text
// all monitors...
````

## Línea 1044

````text
// Do nothing if neither overview or desktop switcher are shown.
````

## Línea 1049

````text
// Usually, the virtual camera is positioned centered in front of the stage. We will
````

## Línea 1050

````text
// move the virtual camera around. These variables will be the new stage-relative
````

## Línea 1051

````text
// coordinates of the virtual camera.
````

## Línea 1056

````text
// On Wayland, each monitor has its own StageView. Therefore we can move the
````

## Línea 1057

````text
// virtual camera for each monitor separately.
````

## Línea 1063

````text
// On X11, there's only one StageView. We move the virtual camera so that it is in
````

## Línea 1064

````text
// front of the current monitor.
````

## Línea 1072

````text
// This is the offset to the original, centered camera position. Y is flipped due to
````

## Línea 1073

````text
// some negative scaling at some point in Mutter.
````

## Línea 1080

````text
// The code below is copied from Mutter's Clutter.
````

## Línea 1081

````text
// https://gitlab.gnome.org/GNOME/mutter/-/blob/main/clutter/clutter/clutter-stage.c#L2255
````

## Línea 1089

````text
// The code below is copied from Mutter's Clutter as well.
````

## Línea 1090

````text
// https://gitlab.gnome.org/GNOME/mutter/-/blob/main/clutter/clutter/clutter-stage.c#L2270
````

## Línea 1106

````text
// End of the copy-paste code.
````

## Línea 1108

````text
// Compute the required offset of the frustum planes at the near plane. This
````

## Línea 1109

````text
// basically updates the projection matrix according to our new camera position.
````

## Línea 1113

````text
// Set the new frustum.
````

## Línea 1117

````text
// Translate the virtual camera. This basically updates the view matrix according to
````

## Línea 1118

````text
// our new camera position.
````

## Línea 1123

````text
// If the perspective of each monitor is computed separately, the culling of GNOME
````

## Línea 1124

````text
// Shell does not work anymore as it still uses the original frustum. The only
````

## Línea 1125

````text
// workaround is to disable culling altogether. This will be bad performance-wise,
````

## Línea 1126

````text
// but I do not see an alternative.
````

## Línea 1127

````text
// If the overview is shown, we inhibit culling for the WorkspacesDisplay. If the
````

## Línea 1128

````text
// desktop-workspace-switcher is shown, we inhibit culling for all shown monitor
````

## Línea 1129

````text
// groups.
````

## Línea 1139

````text
// Revert the matrix changes before the update,
````

## Línea 1141

````text
// Nothing to do if neither overview or desktop switcher are shown.
````

## Línea 1151

````text
// Re-enable culling for all relevant actors.
````

## Línea 1162

````text
// Reverts the changes done with the method above.
````

## Línea 1176

````text
// This creates a custom drag gesture and adds it to the given SwipeTracker. The swipe
````

## Línea 1177

````text
// tracker will now also respond to horizontal drags. The additional gesture also
````

## Línea 1178

````text
// reports vertical drag movements via the "pitch" property. This method returns an
````

## Línea 1179

````text
// object containing the gesture, an St.Adjustment which will contain this pitch value,
````

## Línea 1180

````text
// and a connection ID which is used by _removeDragGesture() to clean up. When the
````

## Línea 1181

````text
// SwipeTracker's gesture ends, the St.Adjustment's value will be eased to zero.
````

## Línea 1198

````text
// Update the gesture's sensitivity when the corresponding settings value changes.
````

## Línea 1202

````text
// Connect the gesture's pitch property to the pitch adjustment.
````

## Línea 1205

````text
// Ease the pitch adjustment to zero if the SwipeTracker reports an ended gesture.
````

## Línea 1206

````text
// This ensures that the cube smoothly rotates back when released. The end-signal
````

## Línea 1207

````text
// returns a suitable duration for this, however this depends on the horizontal
````

## Línea 1208

````text
// rotation required to move the cube back. Here, we compute a duration required for
````

## Línea 1209

````text
// the vertical rotation and use the maximum of both values for the final easing.
````

## Línea 1218

````text
// We return all things which are required to remove the gesture again. This can be
````

## Línea 1219

````text
// done with the _removeDragGesture() method below.
````

## Línea 1228

````text
// Removes a single-click drag gesture created earlier via _addDragGesture(). The info
````

## Línea 1229

````text
// parameter should be the object returned by _addDragGesture().
````

## Línea 1235

````text
// Calls _addDragGesture() for the SwipeTracker and actor responsible for
````

## Línea 1236

````text
// workspace-switching in desktop mode when dragging on the background.
````

## Línea 1238

````text
// The SwipeTracker for switching workspaces in desktop mode is created here:
````

## Línea 1239

````text
// https://gitlab.gnome.org/GNOME/gnome-shell/-/blob/main/js/ui/workspaceAnimation.js#L285
````

## Línea 1244

````text
// If not in the overview, you can usually only swipe to adjacent workspaces. This
````

## Línea 1245

````text
// https://gitlab.gnome.org/GNOME/gnome-shell/-/blob/main/js/ui/swipeTracker.js#L633
````

## Línea 1246

````text
// allows us to override this behavior.
````

## Línea 1249

````text
// We have to make the background reactive. Make sure to store the current state so
````

## Línea 1250

````text
// that we can reset it later.
````

## Línea 1257

````text
// Calls _addDragGesture() for the SwipeTracker and actor responsible for
````

## Línea 1258

````text
// workspace-switching in desktop mode when dragging on the panel.
````

## Línea 1260

````text
// The SwipeTracker for switching workspaces in desktop mode is created here:
````

## Línea 1261

````text
// https://gitlab.gnome.org/GNOME/gnome-shell/-/blob/main/js/ui/workspaceAnimation.js#L285
````

## Línea 1266

````text
// If not in the overview, you can usually only swipe to adjacent workspaces. This
````

## Línea 1267

````text
// https://gitlab.gnome.org/GNOME/gnome-shell/-/blob/main/js/ui/swipeTracker.js#L633
````

## Línea 1268

````text
// allows us to override this behavior.
````

## Línea 1272

````text
// The panel actor itself must be reactive so it receives pointer events that land
````

## Línea 1273

````text
// on empty areas between panel children (clock, status icons, etc.). Without this,
````

## Línea 1274

````text
// those events are swallowed by the stage and never reach the DragGesture. Save the
````

## Línea 1275

````text
// current state so we can restore it on removal.
````

## Línea 1279

````text
// On GNOME 50+, the panel has a built-in Clutter.ClickGesture (the 'window-drag'
````

## Línea 1280

````text
// action) with recognize_on_press:true. This gesture fires immediately on
````

## Línea 1281

````text
// mouse-down and starts a window grab operation (begin_grab_op), which steals all
````

## Línea 1282

````text
// subsequent pointer events and prevents our DragGesture from ever seeing motion
````

## Línea 1283

````text
// events. We disable it while panel dragging is active and restore it on removal.
````

## Línea 1289

````text
// On older GNOME versions, we have to prevent moving fullscreen windows when
````

## Línea 1290

````text
// dragging. The _tryDragWindow method does not exist on GNOME 50+.
````

## Línea 1298

````text
// Calls _addDragGesture() for the SwipeTracker and actor responsible for
````

## Línea 1299

````text
// workspace-switching in overview mode.
````

## Línea 1301

````text
// The SwipeTracker for switching workspaces in overview mode is created here:
````

## Línea 1302

````text
// https://gitlab.gnome.org/GNOME/gnome-shell/-/blob/main/js/ui/workspacesView.js#L827
````

## Línea 1310

````text
// Calls _removeDragGesture() for the SwipeTracker and actor responsible for
````

## Línea 1311

````text
// workspace-switching in desktop mode when dragging on the background.
````

## Línea 1315

````text
// Restore original behavior.
````

## Línea 1318

````text
// Make sure to restore the original state.
````

## Línea 1327

````text
// Calls _removeDragGesture() for the SwipeTracker and actor responsible for
````

## Línea 1328

````text
// workspace-switching in desktop mode when dragging on the panel.
````

## Línea 1332

````text
// Restore original behavior.
````

## Línea 1336

````text
// Make sure to restore the original state.
````

## Línea 1339

````text
// Restore the panel's built-in window-drag click gesture if we disabled it.
````

## Línea 1347

````text
// On older GNOME versions, restore the original _tryDragWindow method.
````

## Línea 1357

````text
// Calls _removeDragGesture() for the SwipeTracker and actor responsible for
````

## Línea 1358

````text
// workspace-switching in overview mode.
````

## Línea 1368

````text
// This function is called once when the extension is loaded, not enabled.
````
