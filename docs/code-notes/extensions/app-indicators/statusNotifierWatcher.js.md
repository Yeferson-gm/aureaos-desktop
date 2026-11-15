# Notas de extensions/app-indicators/statusNotifierWatcher.js

Comentarios trasladados durante la consolidación. Los números corresponden al archivo antes del traslado.

## Línea 35

````text
// TODO: replace with org.freedesktop and /org/freedesktop when approved
````

## Línea 43

````text
/*
 * The StatusNotifierWatcher class implements the StatusNotifierWatcher dbus object
 */
````

## Línea 118

````text
// if the desktop is not ready delay the icon creation and signal emissions
````

## Línea 139

````text
// delete the old one and add the new indicator
````

## Línea 149

````text
// Some indicators (*coff*, dropbox, *coff*) do not re-register again
````

## Línea 150

````text
// when the plugin is enabled/disabled, thus we need to manually look
````

## Línea 151

````text
// for the objects in the session bus that implements the
````

## Línea 152

````text
// StatusNotifierItem interface... However let's do it after a low
````

## Línea 153

````text
// priority timeout, and using an external process so that it won't
````

## Línea 154

````text
// affect startup or memory (as it seems that gjs is not great at
````

## Línea 155

````text
// handling the memory of the bus analyzer async code).
````

## Línea 208

````text
// it would be too easy if all application behaved the same
````

## Línea 209

````text
// instead, ayatana patched gnome apps to send a path
````

## Línea 210

````text
// while kde apps send a bus name
````

## Línea 214

````text
// looks like a path
````

## Línea 289

````text
// this doesn't do any sync operation and doesn't allow us to hook up
````

## Línea 290

````text
// the event of being finished which results in our unholy debounce hack
````

## Línea 291

````text
// (see extension.js)
````
