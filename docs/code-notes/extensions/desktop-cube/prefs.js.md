# Notas de extensions/desktop-cube/prefs.js

Comentarios trasladados durante la consolidación. Los números corresponden al archivo antes del traslado.

## Línea 22

````text
//////////////////////////////////////////////////////////////////////////////////////////
````

## Línea 23

````text
// For now, the preferences dialog of this extension is very simple. In the future, if  //
````

## Línea 24

````text
// we might consider to improve its layout...                                           //
````

## Línea 25

````text
//////////////////////////////////////////////////////////////////////////////////////////
````

## Línea 29

````text
// -------------------------------------------------------------------- public interface
````

## Línea 31

````text
// This function is called when the preferences window is created. We create a new
````

## Línea 32

````text
// instance of the PreferencesDialog class each time this method is called. This way we
````

## Línea 33

````text
// can actually open multiple settings windows and interact with all of them properly.
````

## Línea 35

````text
// Load all of our resources.
````

## Línea 39

````text
// Register our custom widgets.
````

## Línea 42

````text
// Load the user interface file.
````

## Línea 46

````text
// Make sure custom icons are found.
````

## Línea 49

````text
// These are our top-level preferences pages which we will return later.
````

## Línea 55

````text
// Store a reference to the settings object.
````

## Línea 58

````text
// Bind all properties.
````

## Línea 76

````text
// Inject the video link.
````

## Línea 81

````text
// Add a menu to the title bar of the preferences dialog.
````

## Línea 85

````text
// Add the menu to the header bar.
````

## Línea 90

````text
// Populate the actions.
````

## Línea 99

````text
// clang-format off
````

## Línea 108

````text
// clang-format on
````

## Línea 110

````text
// Add the about dialog.
````

## Línea 113

````text
// The JSON report format from weblate is a bit weird. Here we extract all
````

## Línea 114

````text
// unique names from the translation report.
````

## Línea 146

````text
// As we do not have something like a destructor, we just listen for the destroy
````

## Línea 147

````text
// signal of our general page.
````

## Línea 149

````text
// Unregister our resources.
````

## Línea 156

````text
// ----------------------------------------------------------------------- private stuff
````

## Línea 158

````text
// Connects a DesktopCubeImageChooserButton (or anything else which has a 'file'
````

## Línea 159

````text
// property) to a settings key. It also binds the corresponding reset button.
````

## Línea 164

````text
// Connects a Gtk.Adjustment (or anything else which has a 'value' property) to a
````

## Línea 165

````text
// settings key. It also binds the corresponding reset button.
````

## Línea 170

````text
// Connects a Gtk.Switch (or anything else which has an 'active' property) to a settings
````

## Línea 171

````text
// key. It also binds the corresponding reset button.
````

## Línea 176

````text
// Connects any widget's property to a settings key. The widget must have the same ID as
````

## Línea 177

````text
// the settings key. It also binds the corresponding reset button.
````

## Línea 188

````text
// Reads the contents of a JSON file contained in the global resources archive. The data
````

## Línea 189

````text
// is parsed and returned as a JavaScript object / array.
````

## Línea 196

````text
// This traverses the widget tree below the given parent recursively and returns the
````

## Línea 197

````text
// first widget of the given type.
````
