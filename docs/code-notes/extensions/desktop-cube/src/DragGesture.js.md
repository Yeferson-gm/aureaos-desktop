# Notas de extensions/desktop-cube/src/DragGesture.js

Comentarios trasladados durante la consolidación. Los números corresponden al archivo antes del traslado.

## Línea 25

````text
//////////////////////////////////////////////////////////////////////////////////////////
````

## Línea 26

````text
// In GNOME Shell, SwipeTrackers are used all over the place to capture swipe gestures. //
````

## Línea 27

````text
// There's one for entering the overview, one for switching workspaces in desktop mode, //
````

## Línea 28

````text
// one for switching workspaces in overview mode, one for horizontal scrolling in the   //
````

## Línea 29

````text
// app drawer, and many more. The ones used for workspace-switching usually do not      //
````

## Línea 30

````text
// respond to single-click dragging but only to multi-touch gestures. We want to be     //
````

## Línea 31

````text
// able to rotate the cube with the left mouse button, so we add the gesture defined    //
````

## Línea 32

````text
// below to these two SwipeTracker instances (this is done by the _addDragGesture() of  //
````

## Línea 33

````text
// the extension class). The gesture is loosely based on the gesture defined here:      //
````

## Línea 34

````text
// https://gitlab.gnome.org/GNOME/gnome-shell/-/blob/main/js/ui/swipeTracker.js#L89    //
````

## Línea 35

````text
// It behaves the same in the regard that it reports update events for horizontal       //
````

## Línea 36

````text
// movements. However, it stores vertical movements as well and makes this accessible   //
````

## Línea 37

````text
// via the "pitch" property. This is then used for vertical rotations of the cube.      //
````

## Línea 38

````text
//////////////////////////////////////////////////////////////////////////////////////////
````

## Línea 41

````text
// The state will change to PENDING as soon as there is a mouse click.
````

## Línea 42

````text
// There was a click, but not enough movement to trigger the gesture.
````

## Línea 43

````text
// The gesture has been triggered and is in progress.
````

## Línea 46

````text
// clang-format off
````

## Línea 64

````text
// clang-format on
````

## Línea 72

````text
// We listen to the 'captured-event' to be able to intercept some other actions. The
````

## Línea 73

````text
// main problem is the long-press action of the desktop background actor. This
````

## Línea 74

````text
// swallows any click events preventing us from dragging the desktop background.
````

## Línea 75

````text
// By connecting to 'captured-event', we have to extra-careful to propagate any
````

## Línea 76

````text
// event we are not interested in.
````

## Línea 81

````text
// Once the input is grabbed, events are delivered directly to the actor, so we have
````

## Línea 82

````text
// also to connect to the normal "event" signal.
````

## Línea 91

````text
// Disconnects from the actor.
````

## Línea 97

````text
// This is called on every captured event.
````

## Línea 100

````text
// Abort if the gesture is not meant for the current action mode (e.g. either
````

## Línea 101

````text
// Shell.ActionMode.OVERVIEW or Shell.ActionMode.NORMAL).
````

## Línea 106

````text
// In the overview, we only want to switch workspaces by dragging when in
````

## Línea 107

````text
// window-picker state.
````

## Línea 115

````text
// Ignore touch events on X11. On X11, we get emulated pointer events.
````

## Línea 123

````text
// When a mouse button is pressed or a touch event starts, we store the
````

## Línea 124

````text
// corresponding position. The gesture is maybe triggered later, if the pointer was
````

## Línea 125

````text
// moved a little.
````

## Línea 133

````text
// Here's a minor hack: In the overview, there are some draggable things like
````

## Línea 134

````text
// window previews which "compete" with this gesture. Sometimes, the cube is
````

## Línea 135

````text
// dragged, sometimes the window previews. So we make sure that we do only start
````

## Línea 136

````text
// the gesture for events which originate from the given actor or from a
````

## Línea 137

````text
// workspace's background.
````

## Línea 148

````text
// Abort the pending state if the pointer leaves the actor.
````

## Línea 154

````text
// As soon as the pointer is moved a bit, the drag action becomes active.
````

## Línea 157

````text
// If the mouse button is not pressed, we are not interested in the event.
````

## Línea 167

````text
// If we are in the pending state, the gesture may be triggered as soon as the
````

## Línea 168

````text
// pointer is moved enough.
````

## Línea 171

````text
// Clutter.Settings.get_default() was removed in GNOME 51; St.Settings
````

## Línea 172

````text
// reads the same GSettings key (mouse drag-threshold).
````

## Línea 179

````text
// When starting a drag in desktop mode, we grab the input so that we can move
````

## Línea 180

````text
// the pointer across windows without loosing the input events.
````

## Línea 193

````text
// Even if the gesture started, we propagate the event so that any other
````

## Línea 194

````text
// gestures may wait for long-presses are canceled properly.
````

## Línea 198

````text
// In the active state, we report updates on each movement.
````

## Línea 201

````text
// Compute the horizontal movement relative to the last call.
````

## Línea 205

````text
// Compute the accumulated pitch relative to the screen height.
````

## Línea 208

````text
// Increase sensitivity.
````

## Línea 211

````text
// Increase horizontal movement if the cube is rotated vertically.
````

## Línea 223

````text
// As soon as the mouse button is released or the touch event ends, we quit the
````

## Línea 224

````text
// gesture.
````

## Línea 227

````text
// If the gesture was active, report an end event.
````

## Línea 237

````text
// If the gesture was in pending state, set it to inactive again.
````

## Línea 246

````text
// This aborts any ongoing grab and resets the current state to inactive.
````

## Línea 255

````text
// Makes sure that all events from the pointing device we received last input from is
````

## Línea 256

````text
// passed to the given actor. This is used to ensure that we do not "loose" the touch
````

## Línea 257

````text
// buttons will dragging them around.
````

## Línea 263

````text
// Releases a grab created with the method above.
````

## Línea 269

````text
// This is borrowed from here:
````

## Línea 270

````text
// https://gitlab.gnome.org/GNOME/gnome-shell/-/blob/main/js/ui/dnd.js#L214
````

## Línea 275

````text
// We only obey the last button release from the device, other buttons may get
````

## Línea 276

````text
// pressed / released during the drag.
````

## Línea 279

````text
// For touch, we only obey the pointer emulating sequence.
````

## Línea 280

````text
// In GNOME 50 this method got removed.
````

## Línea 291

````text
// This is borrowed from here:
````

## Línea 292

````text
// https://gitlab.gnome.org/GNOME/gnome-shell/-/blob/main/js/ui/dnd.js#L259
````

## Línea 299

````text
// In GNOME 50 this method got removed.
````
