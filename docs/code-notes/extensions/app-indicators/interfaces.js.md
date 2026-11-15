# Notas de extensions/app-indicators/interfaces.js

Comentarios trasladados durante la consolidación. Los números corresponden al archivo antes del traslado.

## Línea 21

````text
// loads a xml file into an in-memory string
````

## Línea 28

````text
// HACK: The "" + trick is important as hell because file_get_contents returns
````

## Línea 29

````text
// an object (WTF?) but Gio.makeProxyWrapper requires `typeof() === "string"`
````

## Línea 30

````text
// Otherwise, it will try to check `instanceof XML` and fail miserably because there
````

## Línea 31

````text
// is no `XML` on very recent SpiderMonkey releases (or, if SpiderMonkey is old enough,
````

## Línea 32

````text
// will spit out a TypeError soon).
````
