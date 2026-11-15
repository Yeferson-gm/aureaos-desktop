# Notas de extensions/window-switcher/swipeTracker.js

Comentarios trasladados durante la consolidación. Los números corresponden al archivo antes del traslado.

## Línea 9

````text
// FIXME: ideally these values matches physical touchpad size. We can get the
````

## Línea 10

````text
// correct values for gnome-shell specifically, since mutter uses libinput
````

## Línea 11

````text
// directly, but GTK apps cannot get it, so use an arbitrary value so that
````

## Línea 12

````text
// it's consistent with apps.
````

## Línea 30

````text
// Derivative of easeOutCubic at t=0
````

## Línea 37

````text
/** @enum {number} */
````

## Línea 106

````text
/* allowedModes */
````

## Línea 108

````text
/* this._allowedModes = allowedModes; */
````

## Línea 131

````text
/* if ((this._allowedModes & Main.actionMode) === 0)
            return Clutter.EVENT_PROPAGATE; */
````

## Línea 233

````text
/* allowedModes */
````

## Línea 235

````text
/* this._allowedModes = allowedModes; */
````

## Línea 267

````text
/* if ((this._allowedModes & Main.actionMode) === 0)
            return false; */
````

## Línea 413

````text
// USAGE:
````

## Línea 414

````text
//
````

## Línea 415

````text
// To correctly implement the gesture, there must be handlers for the following
````

## Línea 416

````text
// signals:
````

## Línea 417

````text
//
````

## Línea 418

````text
// begin(tracker, monitor)
````

## Línea 419

````text
//   The handler should check whether a deceleration animation is currently
````

## Línea 420

````text
//   running. If it is, it should stop the animation (without resetting
````

## Línea 421

````text
//   progress). Then it should call:
````

## Línea 422

````text
//   tracker.confirmSwipe(distance, snapPoints, currentProgress, cancelProgress)
````

## Línea 423

````text
//   If it's not called, the swipe would be ignored.
````

## Línea 424

````text
//   The parameters are:
````

## Línea 425

````text
//    * distance: the page size;
````

## Línea 426

````text
//    * snapPoints: an (sorted with ascending order) array of snap points;
````

## Línea 427

````text
//    * currentProgress: the current progress;
````

## Línea 428

````text
//    * cancelprogress: a non-transient value that would be used if the gesture
````

## Línea 429

````text
//      is cancelled.
````

## Línea 430

````text
//   If no animation was running, currentProgress and cancelProgress should be
````

## Línea 431

````text
//   same. The handler may set 'orientation' property here.
````

## Línea 432

````text
//
````

## Línea 433

````text
// update(tracker, progress)
````

## Línea 434

````text
//   The handler should set the progress to the given value.
````

## Línea 435

````text
//
````

## Línea 436

````text
// end(tracker, duration, endProgress)
````

## Línea 437

````text
//   The handler should animate the progress to endProgress. If endProgress is
````

## Línea 438

````text
//   0, it should do nothing after the animation, otherwise it should change the
````

## Línea 439

````text
//   state, e.g. change the current page or switch workspace.
````

## Línea 440

````text
//   NOTE: duration can be 0 in some cases, in this case it should finish
````

## Línea 441

````text
//   instantly.
````

## Línea 443

````text
/** A class for handling swipe gestures */
````

## Línea 473

````text
/* allowedModes, */
````

## Línea 486

````text
/* this._allowedModes = allowedModes; */
````

## Línea 499

````text
/* (this._allowedModes & Main.actionMode) !== 0 */
````

## Línea 517

````text
/* allowedModes */
````

## Línea 526

````text
/* allowedModes */
````

## Línea 547

````text
/**
     * canHandleScrollEvent:
     * This function can be used to combine swipe gesture and mouse
     * scrolling.
     *
     * @param {Clutter.Event} scrollEvent an event to check
     * @returns {boolean} whether the event can be handled by the tracker
     */
````

## Línea 571

````text
/* if (!enabled && this._state === State.SCROLLING)
            this._interrupt(); */
````

## Línea 648

````text
// also out-of-bounds, but somehow callers fail less hard than with -1
````

## Línea 718

````text
/* (this._allowedModes & Main.actionMode) === 0 || */
````

## Línea 772

````text
/* if ((this._allowedModes & Main.actionMode) === 0 || !this.enabled) {
            this._interrupt();
            return;
        } */
````

## Línea 813

````text
/* if ((this._allowedModes & Main.actionMode) === 0 || !this.enabled) {
            this._interrupt();
            return;
        } */
````

## Línea 842

````text
/**
     * Confirms a swipe. User has to call this in 'begin' signal handler,
     * otherwise the swipe wouldn't start. If there's an animation running,
     * it should be stopped first.
     *
     * `cancelProgress` must always be a snap point, or a value matching
     * some other non-transient state.
     *
     * @param {number} distance - swipe distance in pixels
     * @param {number[]} snapPoints - An array of snap points, sorted in ascending order
     * @param {number} currentProgress - initial progress value
     * @param {number} cancelProgress - the value to be used on cancelling
     */
````
