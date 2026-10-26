# Notas de extensions/desktop-icons/visibleArea.js

Comentarios trasladados durante la consolidación. Los números corresponden al archivo antes del traslado.

## Línea 31

````text
// This UUID allows to ensure that the object is really a DesktopIconsIntegration object
````

## Línea 85

````text
/**
     * Returns the margin values for an specific monitor
     *
     * @param {} ws A workspace (obtained with global.workspace_manager.get_workspace_by_index(0);)
     * @param {*} monitorIndex The monitor number
     * @returns A dictionary with the following elements:
     *     x: the X coordinate of the monitor area
     *     y: the Y coordinate of the monitor area
     *     width: the width of the monitor area
     *     height: the height of the monitor area
     *     scale: the scale factor for this monitor
     *     marginTop: the number of pixels, counting from the top of the monitor, to leave free because are used by a dynamic element
     *     marginBottom: the number of pixels, counting from the bottom of the monitor, to leave free because are used by a dynamic element
     *     marginLeft: the number of pixels, counting from the left of the monitor area, to leave free because are used by a dynamic element
     *     marginRight: the number of pixels, counting from the right of the monitor area, to leave free because are used by a dynamic element
     *
     * The inner margins so returned automatically describe the working area of the monitor (in Gnome terms) that for example the top margin will
     * automatically include the height of the top panel.
     *
     * In addition any extra margins above that set by gnome by othe extensions in usable areas will be returned if they are bigger than the margins
     * described by gnome shell for the work area
     *
     * Thus, a window that covers the whole monitor area should be placed at X,Y and with a size of (width, height), and
     * it must have inner margins of marginTop, marginRight, marginBottom and marginLeft.
     */
````

## Línea 116

````text
// calculate the margins due to the difference between the monitor geometry and the work area, ie. the work area margins
````

## Línea 123

````text
// If the margins for this monitor are bigger than the margins calculated previously,
````

## Línea 124

````text
// use the higher number. This is because the margin set from the extensions are be from the monitor border,
````

## Línea 125

````text
// an can supersede the ones that actually form the work area border.
````

## Línea 127

````text
// Indirectly flag hidden margins if usableAreas margin is set //
````
