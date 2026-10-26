# Notas de extensions/dock/desktopIconsIntegration.js

Comentarios trasladados durante la consolidación. Los números corresponden al archivo antes del traslado.

## Línea 28

````text
/**
 * Integration class
 *
 * This class must be added to other extensions in order to integrate
 * them with Desktop Icons NG. It allows an extension to notify how much margin
 * it uses in each side of each monitor.
 *
 * DON'T SEND PATCHES TO THIS FILE TO THE EXTENSION MAINTAINER. SEND THEM TO
 * DESKTOP ICONS NG MAINTAINER: https://gitlab.com/rastersoft/desktop-icons-ng
 *
 * In the *enable()* function, create a *DesktopIconsUsableAreaClass()*
 * object with
 *
 *     new DesktopIconsIntegration.DesktopIconsUsableAreaClass(object);
 *
 * Now, in the *disable()* function just call to the *destroy()* method before
 * nullifying the pointer. You must create a new object in enable() the next
 * time the extension is enabled.
 *
 * In your code, every time you change the margins, you should call first to
 * *resetMargins()* method to clear the current margins, and then call to
 * *setMargins(...)* method as many times as you need to set the margins in each
 * monitor. You don't need to call it for all the monitors, only for those where
 * you are painting something. If you don't set values for a monitor, they will
 * be considered zero.
 *
 * The margins values are relative to the monitor border.
 *
 *******************************************************************************/
````

## Línea 79

````text
// If an extension is being enabled and lacks the
````

## Línea 80

````text
// DesktopIconsUsableArea object, we can avoid launching a refresh
````

## Línea 85

````text
// if the extension is being disabled, we must do a full refresh,
````

## Línea 86

````text
// because if there were other extensions originally
````

## Línea 87

````text
// loaded after that extension, those extensions will be disabled
````

## Línea 88

````text
// and enabled again without notification
````

## Línea 93

````text
/**
     * Sets or updates the top, bottom, left and right margins for a
     * monitor. Values are measured from the monitor border (and NOT from
     * the workspace border).
     *
     * @param {int} monitor Monitor number to which set the margins.
     *                      A negative value means "the primary monitor".
     * @param {int} top Top margin in pixels
     * @param {int} bottom Bottom margin in pixels
     * @param {int} left Left margin in pixels
     * @param {int} right Right margin in pixels
     */
````

## Línea 115

````text
/**
     * Clears the current margins. Must be called before configuring the monitors
     * margins with setMargins().
     */
````

## Línea 124

````text
/**
     * Disconnects all the signals and removes the margins.
     */
````

## Línea 157

````text
// check that the extension is an extension that has the logic to accept
````

## Línea 158

````text
// working margins
````
