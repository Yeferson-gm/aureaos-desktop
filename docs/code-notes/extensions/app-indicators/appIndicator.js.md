# Notas de extensions/app-indicators/appIndicator.js

Comentarios trasladados durante la consolidación. Los números corresponden al archivo antes del traslado.

## Línea 43

````text
// In ms
````

## Línea 187

````text
// The Author of the spec didn't like the PropertiesChanged signal, so he invented his own
````

## Línea 225

````text
// If the property includes arguments, we can just queue the signal emission
````

## Línea 286

````text
// the property may not even exist, silently ignore it
````

## Línea 317

````text
// the property may not even exist, silently ignore it
````

## Línea 347

````text
// synthesize a batched property changed event
````

## Línea 402

````text
/**
 * the AppIndicator class serves as a generic container for indicator information and functions common
 * for every displaying implementation (IndicatorMessageSource and IndicatorStatusIcon)
 */
````

## Línea 446

````text
// We try to lookup the activate method to see if the app supports it
````

## Línea 548

````text
// public property getters
````

## Línea 624

````text
// Some applications (hey electron!) just remove the indicator object
````

## Línea 625

````text
// from bus after hiding it, without closing its bus name, so we are
````

## Línea 626

````text
// not able to understand whe they're gone.
````

## Línea 627

````text
// Thus we just kill it when an expected well-known method is failing.
````

## Línea 646

````text
// We should call the Ping method instead but in some containers
````

## Línea 647

````text
// such as snaps that's not accessible, so let's just use our own
````

## Línea 678

````text
// some property changes require updates on our part,
````

## Línea 679

````text
// a few need to be passed down to the displaying code
````

## Línea 683

````text
// all these can mean that the icon has to be changed
````

## Línea 688

````text
// same for overlays
````

## Línea 692

````text
// this may make all of our icons invalid
````

## Línea 698

````text
// the label will be handled elsewhere
````

## Línea 712

````text
// status updates may cause the indicator to be hidden
````

## Línea 796

````text
// we can't use WindowID because we're not able to get the x11 window id from a MetaWindow
````

## Línea 797

````text
// nor can we call any X11 functions. Luckily, the Activate method usually works fine.
````

## Línea 798

````text
// parameters are "an hint to the item where to show eventual windows" [sic]
````

## Línea 799

````text
// ... and don't seem to have any effect.
````

## Línea 870

````text
// FIXME: We can't just inherit from Gio.FileIcon for some reason
````

## Línea 875

````text
// Disables the to_tokens() vfunc so that the icon to_string()
````

## Línea 876

````text
// method won't work and thus can't be kept forever around by
````

## Línea 877

````text
// StTextureCache, see the awesome debugging session in this thread:
````

## Línea 878

````text
//   https://twitter.com/mild_sunrise/status/1458739604098621443
````

## Línea 879

````text
// upstream bug is at:
````

## Línea 880

````text
//   https://gitlab.gnome.org/GNOME/gnome-shell/-/issues/4944
````

## Línea 1077

````text
// Remove this when we remove support for versions earlier than 3.38
````

## Línea 1085

````text
// Will look the icon up in the cache, if it's found
````

## Línea 1086

````text
// it will return it. Otherwise, it will create it and cache it.
````

## Línea 1175

````text
/* Hello indicator-multiload! */
````

## Línea 1180

````text
/* We'll wrap the icon so that it won't be cached forever by the shell */
````

## Línea 1233

````text
// No need to use IO here, we can just do some assumptions
````

## Línea 1234

````text
// print('Writable paths', IconActor.USER_WRITABLE_PATHS)
````

## Línea 1255

````text
// HACK: icon is a path name. This is not specified by the API,
````

## Línea 1256

````text
// but at least indicator-sensors uses it.
````

## Línea 1275

````text
// If a theme path is provided, we need to lookup the icon ourself
````

## Línea 1276

````text
// as St won't be able to do it unless we mess with default theme
````

## Línea 1277

````text
// that is something we prefer not to do, as it would imply lots of
````

## Línea 1278

````text
// St.TextureCache cleanups.
````

## Línea 1290

````text
// try to look up the icon in the icon theme
````

## Línea 1335

````text
// Remove this dynamic check when we depend on GNOME 48.
````

## Línea 1351

````text
// FIXME: async API results in a gray icon for some reason
````

## Línea 1356

````text
// the image data was probably bogus. We don't really know why, but it _does_ happen.
````

## Línea 1365

````text
// The icon cache Active flag will be set to true if the used gicon matches
````

## Línea 1366

````text
// the cached one (as in some cases it may be equal, but not the same object).
````

## Línea 1367

````text
// So when it's not need anymore we make sure to check the active state
````

## Línea 1368

````text
// and set it to false so that it can be picked up by the garbage collector.
````

## Línea 1454

````text
// The pixmap has been saved, we can free the variants memory
````

## Línea 1465

````text
// updates the base icon
````

## Línea 1471

````text
// From now on we consider them the same thing, as one replaces the other
````

## Línea 1490

````text
// updates the base icon
````

## Línea 1500

````text
// we might need to use the AttentionIcon*, which have precedence over the normal icons
````

## Línea 1522

````text
// KDE hardcodes the overlay icon size to 10px (normal icon size 16px)
````

## Línea 1523

````text
// we approximate that ratio for other sizes, too.
````

## Línea 1524

````text
// our algorithms will always pick a smaller one instead of stretching it.
````

## Línea 1552

````text
// called when the icon theme changes
````
