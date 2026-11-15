# Notas de extensions/battery-care/extension.js

Comentarios trasladados durante la consolidación. Los números corresponden al archivo antes del traslado.

## Línea 9

````text
// 1.  _initializeDriver which start thresholdpanel runs only in [user] session-mode. _initializeDriver is destroyed in [unlock-dialog] session-mode
````

## Línea 10

````text
// _initializeDriver initializes and checks hardware compatibility and displays an indicator of current charging mode in system-tray and also provides a
````

## Línea 11

````text
// quicksettings menu in the quicksettings panel.
````

## Línea 12

````text
// all this are required in [user] sessionmode, but not required in [unlock-dialog] mode _initializeDriver hence needs to be destroyed.
````

## Línea 14

````text
// 2. powerIcon runs in [user] and [unlock-dialog] session mode
````

## Línea 15

````text
// When charging-threshold applied, the Gnome's System Battery indicator icon sometimes displays unplugged, even though charger is plugged.
````

## Línea 16

````text
// powerIcon introduces a feature to changes this icon from unplugged to plugged when charger is plugged.
````

## Línea 17

````text
// Since this icon is a Gnome's System Battery indicator which is displayed in lockscreen, powerIcon need to be enabled in [unlock-dialog] session mode.
````

## Línea 18

````text
// powerIcon runs in [user] and [unlock-dialog] session mode to apply correct icon to Gnome System Battery indicator icon in System-tray.
````

## Línea 52

````text
// create when enabled() is called in [user] and [unlock-dialog] session mode
````

## Línea 55

````text
// Do not create threshold panel if enable is triggered in lockscreen state (due rebased while disabling other extensions)
````

## Línea 59

````text
// Destroy _initializeDriver on [unlock-dialog] / create _initializeDriver in [user]
````

## Línea 61

````text
// enable _initializeDriver when entering from [unlock-dialog] to [user] session-mode.
````

## Línea 66

````text
// destroy _initializeDriver when entering [unlock-dialog] session mode.
````

## Línea 75

````text
// Destroy everything if disable() is called regardless of session-mode
````
