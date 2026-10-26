# Notas de extensions/dock/fileManager1API.js

Comentarios trasladados durante la consolidación. Los números corresponden al archivo antes del traslado.

## Línea 1

````text
// -*- mode: js; js-indent-level: 4; indent-tabs-mode: nil -*-
````

## Línea 18

````text
/**
 * This class implements a client for the org.freedesktop.FileManager1 dbus
 * interface, and specifically for the OpenWindowsWithLocations property
 * which is published by Nautilus, but is not an official part of the interface.
 *
 * The property is a map from window identifiers to a list of locations open in
 * the window.
 */
````

## Línea 37

````text
// Use async construction to avoid blocking on errors.
````

## Línea 52

````text
// We must additionally listen for Screen events to know when to
````

## Línea 53

````text
// rebuild our location map when the set of available windows changes.
````

## Línea 84

````text
/**
     * Return an array of windows that are showing a location or
     * sub-directories of that location.
     *
     * @param location
     */
````

## Línea 137

````text
// Nothing to check yet.
````

## Línea 175

````text
// Use a set to deduplicate when a window has a
````

## Línea 176

````text
// location open in multiple tabs.
````
