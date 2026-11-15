# Notas de extensions/app-indicators/iconCache.js

Comentarios trasladados durante la consolidación. Los números corresponden al archivo antes del traslado.

## Línea 23

````text
// The icon cache caches icon objects in case they're reused shortly aftwerwards.
````

## Línea 24

````text
// This is necessary for some indicators like skype which rapidly switch between serveral icons.
````

## Línea 25

````text
// Without caching, the garbage collection would never be able to handle the amount of new icon data.
````

## Línea 26

````text
// If the lifetime of an icon is over, the cache will destroy the icon. (!)
````

## Línea 27

````text
// The presence of active icons will extend the lifetime.
````

## Línea 29

````text
// seconds
````

## Línea 30

````text
// seconds
````

## Línea 32

````text
// how to use: see IconCache.add, IconCache.get
````

## Línea 37

````text
// we don't want to attach lifetime to the object
````

## Línea 107

````text
// marks all the icons as removable, if something doesn't claim them before
````

## Línea 113

````text
// removes everything from the cache
````

## Línea 120

````text
// returns an object from the cache, or null if it can't be found.
````
