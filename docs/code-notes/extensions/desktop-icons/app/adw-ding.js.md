# Notas de extensions/desktop-icons/app/adw-ding.js

Comentarios trasladados durante la consolidación. Los números corresponden al archivo antes del traslado.

## Línea 81

````text
// Connect application signals
````

## Línea 137

````text
// Parse options from the main arguments
````

## Línea 152

````text
// If testing Dbus activations, comment the above
````

## Línea 153

````text
// and uncomment the following -
````

## Línea 154

````text
// or get remote actions from the app and activate
````

## Línea 155

````text
// this.desktopVariants = this.newDesktopsVariants;
````

## Línea 156

````text
// this.remoteDingActions.activate_action('updateGridWindows',
````

## Línea 157

````text
//    new GLib.Variant('av', this.desktopVariants));
````

## Línea 158

````text
// OR smiply activate the app action directly
````

## Línea 159

````text
// app.activate_action(
````

## Línea 160

````text
//     'updateGridWindows',
````

## Línea 161

````text
//     new GLib.Variant('av', this.desktopVariants)
````

## Línea 162

````text
// );
````

## Línea 246

````text
// modified for GJS to work like passing optioncontext
````

## Línea 277

````text
// OptionContext does not work in GJS, modifed version
````

## Línea 278

````text
// const helptext = this.optionsContext.get_help(false, null);
````

## Línea 309

````text
// Code for checking Dbus actions and remote controlling the app
````

## Línea 310

````text
// via DBus - see commented code in commanline invocation.
````

## Línea 311

````text
//
````

## Línea 312

````text
// const dbusID = this.asDesktop ? appID : testAppID;
````

## Línea 313

````text
// const dbusPath = `${dbusID}.actions`.split('.').join('/');
````

## Línea 314

````text
// this.remoteDingActions = Gio.DBusActionGroup.get(
````

## Línea 315

````text
//     Gio.DBus.session,
````

## Línea 316

````text
//     dbusID,
````

## Línea 317

````text
//     dbusPath
````

## Línea 318

````text
// );
````

## Línea 323

````text
// Define options, similar to GLib.optionEntry for GJS
````

## Línea 409

````text
// This does not work in GJS - constructor cannot be called -
````

## Línea 410

````text
// therefore alternative implementation for the following
````

## Línea 411

````text
//
````

## Línea 412

````text
// this.optionsContext =
````

## Línea 413

````text
//      new GLib.OptionContext('Adw Desktop Icons Application');
````

## Línea 414

````text
//
````

## Línea 415

````text
// this.optionsContext.add_main_entries(options, getTextDomain);
````

## Línea 448

````text
/* if no desktop list is provided,
                 * like when launching the program in stand-alone mode,
                 * configure a 1280x720 desktop
                */
````

## Línea 610

````text
// Gnome will update the app info cache automatically
````

## Línea 611

````text
// However it takes a long time to update the cache
````

## Línea 612

````text
// and we need to do it manually for the app to be
````

## Línea 613

````text
// available sooner
````
