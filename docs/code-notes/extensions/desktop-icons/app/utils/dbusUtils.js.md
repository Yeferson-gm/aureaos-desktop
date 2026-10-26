# Notas de extensions/desktop-icons/app/utils/dbusUtils.js

Comentarios trasladados durante la consolidación. Los números corresponden al archivo antes del traslado.

## Línea 28

````text
/*
    This class manages a DBus object through a DBusProxy. Any access to the
    proxy when the object isn't available results in a notification specifying
    that an specific program is needed to run that option.

    The proxy itself is accessed through the 'proxy' property (read-only).
    Any access to it will check the availability and show the notification if
    it isn't available. To get access to it without triggering this, it is
    possible to use the 'proxyNoCheck' property.

    Whether the object is or not available can be checked with the
    'isAvailable' property. Also, every time the availability changes,
    the signal 'changed-status' is emitted.
    */
````

## Línea 64

````text
// if 'programNeeded' is a string, create a generic message
````

## Línea 65

````text
// for the notification.
````

## Línea 76

````text
// instead, if it's not, it is presumed to be an array with two
````

## Línea 77

````text
// sentences, one for the notification title and another for
````

## Línea 78

````text
// the main text.
````

## Línea 335

````text
/*
    This class manages all the DBus operations. A ProxyManager() class can
    subscribe to this to be notified whenever a change in the bus has occurred
    (like a server has been added or removed). It also can ask
    for a DBus interface, either getting it from the dbusInterfaces.js file
    or using DBus Introspection (which allows to get the currently available
    interface and, that way, know if an object implements an specific
    method, property or signal).

    ProxyManager() classes subscribe to the 'changed-availability-system'
    or 'changed-availability-local' signals, which are emitted every time a
    change in the bus or in the configuration files happen. Then, it can use
    checkIsAvailable() to determine if the desired service is available
    in the system or not.
    */
````

## Línea 363

````text
// system bus
````

## Línea 365

````text
// use DBus Introspection
````

## Línea 380

````text
// Don't presume that both system and local have the same
````

## Línea 381

````text
// interface (just in case)
````

## Línea 386

````text
// local bus
````

## Línea 387

````text
// use DBus Introspection
````

## Línea 431

````text
// local bus
````

## Línea 432

````text
// get interface from local code
````

## Línea 491

````text
// We read both the well-known names actually running and those
````

## Línea 492

````text
// available as activatables, and generate a single list with both.
````

## Línea 493

````text
// Thus a service will be "enabled" if it is running
````

## Línea 494

````text
// or if it is activatable.
````

## Línea 536

````text
/*
    Extracts the XML definition for an interface from the raw data
    returned by DBus Introspection. This is needed because DBus Introspection
    returns a single XML file with all the interfaces supported by an object,
    while DBusProxyWrapper requires an XML with only the desired interface.
     */
````

## Línea 640

````text
// if it doesn't exist, return null
````

## Línea 646

````text
/*
            The freedesktop specificaton specifies these common icons by name
            be available in compatible themes, including displayImange and
            appIcon
        */
````

## Línea 663

````text
// from freeDesktop icon theme specification which should be available
````

## Línea 664

````text
// for this interface
````

## Línea 667

````text
// 1 second
````

## Línea 704

````text
// wait a second to ensure that everything has settled
````

## Línea 778

````text
// Currently unused; retained for FileManager1 interface completeness.
````

## Línea 889

````text
// All users of a surface share one export, including while export is pending.
````

## Línea 890

````text
// This also supports GTK before 4.12, which can only track one export per surface.
````

## Línea 1051

````text
// Sushi queues PropertiesChanged; it can arrive after the method reply.
````

## Línea 1052

````text
// Until it arrives, the cached properties describe the previous preview.
````
