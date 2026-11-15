# Notas de extensions/caffeine/preferences/timerPage.js

Comentarios trasladados durante la consolidación. Los números corresponden al archivo antes del traslado.

## Línea 48

````text
// Timer group
````

## Línea 49

````text
// --------------
````

## Línea 54

````text
// Slider
````

## Línea 84

````text
// Add elements
````

## Línea 88

````text
// Custom value group
````

## Línea 89

````text
// --------------
````

## Línea 102

````text
// Custom value Adw.spinRow
````

## Línea 103

````text
// = 99 Hours, 99 minutes
````

## Línea 108

````text
// Short duration
````

## Línea 113

````text
// Medium duration
````

## Línea 118

````text
// Long duration
````

## Línea 122

````text
// Enable / Disable Custom value
````

## Línea 129

````text
// Add elements
````

## Línea 136

````text
// Init
````

## Línea 141

````text
// Bind signals
````

## Línea 142

````text
// --------------
````

## Línea 155

````text
// Control hierarchy of custom duration
````

## Línea 165

````text
// Control hierarchy of custom duration
````

## Línea 179

````text
// Control hierarchy of custom duration
````

## Línea 253

````text
/*
        * Tweak Adw.SpinRow
        *
        *     For some reasons, the output of the Gtk.Text from SpinRow can't be
        * modified using 'set_text()' without a bug with single increment.
        * Similar problem to this one:
        * https://stackoverflow.com/questions/61753800/formatting-gtk-spinbuttons-output-does-not-work-for-single-mouse-clicks
        *
        *     The workaround is to create a new separate Gtk.Entry to display HH:MM:SS
        * and hide the original Gtk.Text.
        */
````

## Línea 265

````text
// Create the SpinRow
````

## Línea 281

````text
// Create new Entry
````

## Línea 293

````text
// Get the Gtk.SpinButton and Gtk.Text
````

## Línea 299

````text
// Hide the current text input
````

## Línea 302

````text
// Add the new text input an re-order properly the widget component
````

## Línea 309

````text
// Display duration value as HH:MM:SS
````

## Línea 321

````text
// Update value from the new text entry
````
