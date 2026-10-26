# Notas de extensions/dock/intellihide.js

Comentarios trasladados durante la consolidación. Los números corresponden al archivo antes del traslado.

## Línea 1

````text
// -*- mode: js; js-indent-level: 4; indent-tabs-mode: nil -*-
````

## Línea 15

````text
// A good compromise between reactivity and efficiency; to be tuned.
````

## Línea 31

````text
// List of windows type taken into account. Order is important (keep the original
````

## Línea 32

````text
// enum order).
````

## Línea 45

````text
// List of applications, ignore windows of these applications in considering intellihide
````

## Línea 48

````text
/**
 * A rough and ugly implementation of the intellihide behaviour.
 * Intallihide object: emit 'status-changed' signal when the overlap of windows
 * with the provided targetBoxClutter.ActorBox changes;
 */
````

## Línea 55

````text
// Load settings
````

## Línea 59

````text
// The application whose window is focused.
````

## Línea 60

````text
// The application whose window is on top on the monitor with the dock.
````

## Línea 71

````text
// Connect global signals
````

## Línea 73

````text
// Add signals on windows created from now on
````

## Línea 78

````text
// triggered for instance when the window list order changes,
````

## Línea 79

````text
// included when the workspace is switched
````

## Línea 84

````text
// when windows are alwasy on top, the focus window can change
````

## Línea 85

````text
// without the windows being restacked. Thus monitor window focus change.
````

## Línea 90

````text
// update wne monitor changes, for instance in multimonitor when monitor are attached
````

## Línea 98

````text
// Disconnect global signals
````

## Línea 101

````text
// Remove  residual windows signals
````

## Línea 169

````text
/* Limit the number of calls to the doCheckOverlap function */
````

## Línea 198

````text
/*
             * Get the top window on the monitor where the dock is placed.
             * The idea is that we dont want to overlap with the windows of the topmost application,
             * event is it's not the focused app -- for instance because in multimonitor the user
             * select a window in the secondary monitor.
             */
````

## Línea 217

````text
// If there isn't a focused app, use that of the window on top
````

## Línea 248

````text
// Filter interesting windows to be considered for intellihide.
````

## Línea 249

````text
// Consider all windows visible on the current workspace.
````

## Línea 250

````text
// Optionally skip windows of other applications
````

## Línea 257

````text
// Depending on the intellihide mode, exclude non-relevent windows
````

## Línea 260

````text
// Do nothing
````

## Línea 264

````text
// Skip windows of other apps
````

## Línea 266

````text
// The DropDownTerminal extension is not an application per se
````

## Línea 267

````text
// so we match its window by wm class instead
````

## Línea 275

````text
// Consider half maximized windows side by side
````

## Línea 276

````text
// and windows which are alwayson top
````

## Línea 288

````text
// Skip unmaximized windows
````

## Línea 294

````text
// Always on top, except for fullscreen windows
````

## Línea 309

````text
// Filter windows by type
````

## Línea 310

````text
// inspired by Opacify@gnome-shell.localdomain.pl
````

## Línea 317

````text
// The DING extension desktop window needs to be excluded
````

## Línea 318

````text
// so we match its window by application id and window property.
````

## Línea 323

````text
// The DropDownTerminal extension uses the POPUP_MENU window type hint
````

## Línea 324

````text
// so we match its window by wm class instead
````
