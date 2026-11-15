# Notas de extensions/desktop-cube/src/utils.js

Comentarios trasladados durante la consolidación. Los números corresponden al archivo antes del traslado.

## Línea 14

````text
// This method can be used to import the Config module.
````

## Línea 22

````text
// We import the Config module. This is done differently in the GNOME Shell process and in
````

## Línea 23

````text
// the preferences process.
````

## Línea 26

````text
// Returns the given argument, except for "alpha", "beta", and "rc". In these cases -3,
````

## Línea 27

````text
// -2, and -1 are returned respectively.
````

## Línea 42

````text
// This method returns true if the current GNOME Shell version matches the given
````

## Línea 43

````text
// arguments.
````

## Línea 48

````text
// This method returns true if the current GNOME Shell version is at least as high as the
````

## Línea 49

````text
// given arguments. Supports "alpha" and "beta" for the minor version number.
````

## Línea 62

````text
// This method can be used to write a message to GNOME Shell's log. This is enhances
````

## Línea 63

````text
// the standard log() functionality by prepending the extension's name and the location
````

## Línea 64

````text
// where the message was logged. As the extensions name is part of the location, you
````

## Línea 65

````text
// can more effectively watch the log output of GNOME Shell:
````

## Línea 66

````text
// journalctl -f -o cat | grep -E 'desktop-cube|'
````

## Línea 67

````text
// This method is based on a similar script from the Fly-Pie GNOME Shell extension which
````

## Línea 68

````text
// os published under the MIT License (https://github.com/Schneegans/Fly-Pie).
````

## Línea 72

````text
// Remove debug() function call from stack.
````

## Línea 75

````text
// Find the index of the extension directory (e.g. aurea-desktop-cube@local)
````

## Línea 76

````text
// in the stack entry. We do not want to print the entire absolute file path.
````

## Línea 82

````text
// This method can be used to import gettext. This is done differently in the
````

## Línea 83

````text
// GNOME Shell process and in the preferences process.
````
