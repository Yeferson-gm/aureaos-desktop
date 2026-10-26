# Notas de extensions/desktop-icons/app/gnomeShellDragDrop.js

Comentarios trasladados durante la consolidación. Los números corresponden al archivo antes del traslado.

## Línea 56

````text
// Careful, we have to and are calling an async function
````

## Línea 57

````text
// in the timer, which will always return true,
````

## Línea 58

````text
// therefore the function has to kill itself if
````

## Línea 59

````text
// not killed by drag end...
````

## Línea 78

````text
// look upto 50 pixels away for a drop target,
````

## Línea 79

````text
// off the drag cursor to the left, increment 10
````

## Línea 80

````text
// 5 iterations
````

## Línea 111

````text
// Failsafe kill the function - remove the timer if going on for
````

## Línea 112

````text
// too long, default 30 seconds
````

## Línea 147

````text
// On a URI, start hover timing and reset timer
````

## Línea 154

````text
// Open the URI, got here after hover timing started
````

## Línea 182

````text
// URI is the same, window is opened, do nothing
````

## Línea 188

````text
// If still alive, window is opened and uri is changed, reset
````

## Línea 407

````text
// In ms
````
