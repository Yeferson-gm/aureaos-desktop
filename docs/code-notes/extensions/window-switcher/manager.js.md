# Notas de extensions/window-switcher/manager.js

Comentarios trasladados durante la consolidación. Los números corresponden al archivo antes del traslado.

## Línea 78

````text
// Just like a signal handler ID, the `Gio.bus_own_name()` function returns a
````

## Línea 79

````text
// unique ID we can use to unown the name when we're done with it.
````

## Línea 90

````text
// Note that `onNameLost()` is NOT invoked when manually unowning a name.
````

## Línea 116

````text
/**
     * Invoked when the name is acquired.
     *
     * On the other hand, if you were using something like GDBusObjectManager to
     * watch for interfaces, you could export your interfaces here.
     *
     * @param {Gio.DBusConnection} connection - the connection that acquired the name
     * @param {string} name - the name being owned
     */
````

## Línea 129

````text
/**
     * Invoked when the name is lost or @connection has been closed.
     *
     * Typically you won't see this callback invoked, but it might happen if you
     * try to own a name that was already owned by someone else.
     *
     * @param {Gio.DBusConnection|null} connection - the connection on which to
     *     acquire the name, or %null if the connection was disconnected
     * @param {string} name - the name being owned
     */
````

## Línea 165

````text
// Construct a list with all windows
````

## Línea 178

````text
// Switch between windows of same application from all workspaces
````

## Línea 201

````text
// Switch between windows of all workspaces, prefer
````

## Línea 202

````text
// those from current workspace
````

## Línea 205

````text
// Sort by user time
````

## Línea 212

````text
// Switch between windows of current workspace
````

## Línea 219

````text
// filter by windows existing on the active monitor
````

## Línea 237

````text
// DBus interface impl
````
