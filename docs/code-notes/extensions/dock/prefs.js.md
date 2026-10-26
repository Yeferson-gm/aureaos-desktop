# Notas de extensions/dock/prefs.js

Comentarios trasladados durante la consolidación. Los números corresponden al archivo antes del traslado.

## Línea 1

````text
// -*- mode: js; js-indent-level: 4; indent-tabs-mode: nil -*-
````

## Línea 13

````text
// Use __ () and N__() for the extension gettext domain, and reuse
````

## Línea 14

````text
// the shell domain with the default _() and N_()
````

## Línea 70

````text
// Connecting to a D-Bus signal
````

## Línea 105

````text
// We only care about the first one really
````

## Línea 124

````text
// We're in cloning mode, so let's just activate the primary monitor
````

## Línea 135

````text
// This function ensures that we follow the old Gdk indexing strategy
````

## Línea 136

````text
// for monitors, it can be removed when we don't care about breaking
````

## Línea 137

````text
// old user configurations or external apps configuring this extension
````

## Línea 138

````text
// such as ubuntu's gnome-control-center.
````

## Línea 142

````text
// The The dock uses the Gdk index for monitors, where the primary monitor
````

## Línea 143

````text
// always has index 0, so let's follow what dash-to-dock does in docking.js
````

## Línea 144

````text
// (as part of _createDocks), but using inverted math
````

## Línea 163

````text
/**
 * @param settings
 */
````

## Línea 202

````text
// Set a reasonable initial window height
````

## Línea 209

````text
// Timeout to delay the update of the settings
````

## Línea 282

````text
// Avoid settings the size continuously
````

## Línea 294

````text
// Avoid settings the size consinuosly
````

## Línea 314

````text
// Avoid settings the opacity consinuosly as it's change is animated
````

## Línea 326

````text
// Avoid settings the opacity consinuosly as it's change is animated
````

## Línea 338

````text
// Avoid settings the opacity consinuosly as it's change is animated
````

## Línea 370

````text
// Monitor options
````

## Línea 379

````text
// Add connected monitors
````

## Línea 386

````text
/* TRANSLATORS: This will be followed by Display Name - Connector. */
````

## Línea 392

````text
/* TRANSLATORS: Followed by monitor index, Display Name - Connector. */
````

## Línea 414

````text
// Position and size panel
````

## Línea 424

````text
// Position option
````

## Línea 443

````text
/* Left is Right in rtl as a setting */
````

## Línea 448

````text
// Intelligent autohide options
````

## Línea 494

````text
// this._builder.get_object('animation_duration_spinbutton').set_value(
````

## Línea 495

````text
//   this._settings.get_double('animation-time'));
````

## Línea 497

````text
// Create dialog for intelligent autohide advanced settings
````

## Línea 506

````text
// GTK+ leaves positive values for application-defined response ids.
````

## Línea 507

````text
// Use +1 for the reset action
````

## Línea 518

````text
// intellihide mode
````

## Línea 563

````text
// restore default settings for the relevant keys
````

## Línea 573

````text
// remove the settings box so it doesn't get destroyed;
````

## Línea 582

````text
// size options
````

## Línea 601

````text
// Corrent for rtl languages
````

## Línea 603

````text
// Flip value position: this is not done automatically
````

## Línea 606

````text
// I suppose due to a bug, having a more than one mark and one above
````

## Línea 607

````text
// a value of 100 makes the rendering of the marks wrong in rtl.
````

## Línea 608

````text
// This doesn't happen setting the scale as not flippable
````

## Línea 609

````text
// and then manually inverting it
````

## Línea 665

````text
// Apps panel
````

## Línea 822

````text
// Behavior panel
````

## Línea 859

````text
// Create dialog for number overlay options
````

## Línea 868

````text
// GTK+ leaves positive values for application-defined response ids.
````

## Línea 869

````text
// Use +1 for the reset action
````

## Línea 880

````text
// We need to update the shortcut 'strv' when the text is modified
````

## Línea 902

````text
// restore default settings for the relevant keys
````

## Línea 909

````text
// remove the settings box so it doesn't get destroyed;
````

## Línea 918

````text
// Create dialog for middle-click options
````

## Línea 927

````text
// GTK+ leaves positive values for application-defined response ids.
````

## Línea 928

````text
// Use +1 for the reset action
````

## Línea 958

````text
// restore default settings for the relevant keys
````

## Línea 970

````text
// remove the settings box so it doesn't get destroyed;
````

## Línea 979

````text
// Appearance Panel
````

## Línea 994

````text
// Running indicators
````

## Línea 1015

````text
// Create dialog for running indicators advanced settings
````

## Línea 1066

````text
// remove the settings box so it doesn't get destroyed;
````

## Línea 1091

````text
// Opacity
````

## Línea 1130

````text
// Create dialog for transparency advanced settings
````

## Línea 1178

````text
// remove the settings box so it doesn't get destroyed;
````

## Línea 1209

````text
// About Panel
````
