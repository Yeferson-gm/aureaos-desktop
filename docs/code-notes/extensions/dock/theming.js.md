# Notas de extensions/dock/theming.js

Comentarios trasladados durante la consolidación. Los números corresponden al archivo antes del traslado.

## Línea 1

````text
// -*- mode: js; js-indent-level: 4; indent-tabs-mode: nil -*-
````

## Línea 20

````text
/*
 * DEFAULT:  transparency given by theme
 * FIXED:    constant transparency chosen by user
 * DYNAMIC:  apply 'transparent' style when no windows are close to the dock
 * */
````

## Línea 43

````text
/**
 * Manage theme customization and custom theme support
 */
````

## Línea 53

````text
// initialize colors with generic values
````

## Línea 59

````text
// update :overview pseudoclass
````

## Línea 90

````text
// Set the initial overview pseudo-class state.
````

## Línea 96

````text
// destroy themeManager when the managed actor is destroyed (e.g. extension unload)
````

## Línea 97

````text
// in order to disconnect signals
````

## Línea 141

````text
// Get the background and border alphas. We check the background alpha
````

## Línea 142

````text
// for a minimum of .001 to prevent division by 0 errors
````

## Línea 146

````text
// The border and background alphas should remain in sync
````

## Línea 147

````text
// We also limit the borderAlpha to a maximum of 1 (full opacity)
````

## Línea 164

````text
// Remove custom style
````

## Línea 173

````text
// Just in case the theme has different border colors ..
````

## Línea 174

````text
// We want to find the inside border-color of the dock because it is
````

## Línea 175

````text
// the side most visible to the user. We do this by finding the side
````

## Línea 176

````text
// opposite the position
````

## Línea 188

````text
// Retrieve the color. If needed we will adjust it before passing it to
````

## Línea 189

````text
// this._transparency.
````

## Línea 198

````text
// When applying a custom color, we need to check the alpha value,
````

## Línea 199

````text
// if not the opacity will always be overridden by the color below.
````

## Línea 200

````text
// Note that if using 'dynamic' transparency modes,
````

## Línea 201

````text
// the opacity will be set by the opaque/transparent styles anyway.
````

## Línea 205

````text
// backgroundColor is a string like rgb(0,0,0)
````

## Línea 226

````text
// backgroundColor is a {Clutter,Cogl}.Color object
````

## Línea 249

````text
// If not the built-in theme option is not selected
````

## Línea 271

````text
/**
     * Reimported back and adapted from atomdock
     */
````

## Línea 277

````text
// Remove prior style edits
````

## Línea 281

````text
// If built-in theme is enabled do nothing else
````

## Línea 288

````text
// obtain theme border settings
````

## Línea 293

````text
// We're copying border and corner styles to left border and top-left
````

## Línea 294

````text
// corner, also removing bottom border and bottom-right corner styles
````

## Línea 308

````text
// I do call set_style possibly twice so that only the background gets the transition.
````

## Línea 309

````text
// The transition-property css rules seems to be unsupported
````

## Línea 313

````text
// Customize background
````

## Línea 349

````text
/**
 * The following class is based on the following upstream commit:
 * https://git.gnome.org/browse/gnome-shell/commit/?id=447bf55e45b00426ed908b1b1035f472c2466956
 * Transparency when free-floating
 */
````

## Línea 364

````text
// All these properties are replaced with the ones in the .dummy-opaque
````

## Línea 365

````text
// and .dummy-transparent css classes
````

## Línea 380

````text
// ensure I never double-register/inject
````

## Línea 381

````text
// although it should never happen
````

## Línea 392

````text
// for compatibility with Gnome Shell 45
````

## Línea 420

````text
// Window signals
````

## Línea 422

````text
// An irrelevant window actor ('Gnome-shell') produces an error when the signals are
````

## Línea 423

````text
// disconnected, therefore do not add signals to it.
````

## Línea 440

````text
// ensure I never double-register/inject
````

## Línea 441

````text
// although it should never happen
````

## Línea 496

````text
/* Get all the windows in the active workspace that are in the primary monitor and visible */
````

## Línea 506

````text
/* Check if at least one window is near enough to the panel.
         * If the dock is hidden, we need to account for the space it would take
         * up when it slides out. This is avoid an ugly transition.
         * */
````

## Línea 572

````text
// Create dummy object and add to the uiGroup to get it to the stage
````
