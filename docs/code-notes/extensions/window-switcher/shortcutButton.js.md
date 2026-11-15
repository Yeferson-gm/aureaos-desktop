# Notas de extensions/window-switcher/shortcutButton.js

Comentarios trasladados durante la consolidación. Los números corresponden al archivo antes del traslado.

## Línea 61

````text
//this.settings.connect("changed::gravatar-ondemand-keybinding", this.shortcutLabel, "accelerator", Gio.SettingsBindFlags.DEFAULT);
````

## Línea 171

````text
/**
 * Check if the given keyval is forbidden.
 *
 * @param {number} keyval The keyval number.
 * @returns {boolean} `true` if the keyval is forbidden.
 */
````

## Línea 195

````text
/**
 * Check if the given key combo is a valid binding
 *
 * @param {{mask: number, keycode: number, keyval:number}} combo An object
 * representing the key combo.
 * @returns {boolean} `true` if the key combo is a valid binding.
 */
````

## Línea 224

````text
/**
 * Check if the given key combo is a valid accelerator.
 *
 * @param {{mask: number, keyval:number}} combo An object representing the key
 * combo.
 * @returns {boolean} `true` if the key combo is a valid accelerator.
 */
````
