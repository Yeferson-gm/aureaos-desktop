# Notas de extensions/dock/appIconIndicators.js

Comentarios trasladados durante la consolidación. Los números corresponden al archivo antes del traslado.

## Línea 39

````text
/*
 * This is the main indicator class to be used. The desired behavior is
 * obtained by composing the desired classes below based on the settings.
 *
 */
````

## Línea 48

````text
// Choose the style for the running indicators
````

## Línea 53

````text
// macos27-v7:dot
````

## Línea 128

````text
/*
 * Base class to be inherited by all indicators of any kind
*/
````

## Línea 147

````text
/*
 * A base indicator class for running style, from which all other RunningIndicators should derive,
 * providing some basic methods, variables definitions and their update,  css style classes handling.
 *
 */
````

## Línea 207

````text
// I use opacity to hide the default dot because the show/hide function
````

## Línea 208

````text
// are used by the parent class.
````

## Línea 219

````text
// Fallback
````

## Línea 245

````text
// Remove glossy background if the children still exists
````

## Línea 254

````text
// We add a css class so third parties themes can limit their indicator customization
````

## Línea 255

````text
// to the case we do nothing
````

## Línea 274

````text
// We assume that the are is a rectangle in the operations below:
````

## Línea 295

````text
// We draw for the bottom case and rotate the canvas for other placements
````

## Línea 296

````text
// set center of rotations to the center
````

## Línea 305

````text
// nothing
````

## Línea 337

````text
// Apply glossy background
````

## Línea 338

````text
// TODO: move to enable/disableBacklit to apply it only to the running apps?
````

## Línea 339

````text
// TODO: move to css class for theming support
````

## Línea 348

````text
// Enable / Disable the backlight of running apps
````

## Línea 373

````text
// By default re-use the style - background color, and border width and color -
````

## Línea 374

````text
// of the default dot
````

## Línea 382

````text
// Adjust for the backlit case
````

## Línea 386

````text
// Use dominant color for dots too if the backlit is enables
````

## Línea 389

````text
// Slightly adjust the styling
````

## Línea 396

````text
// Fallback
````

## Línea 402

````text
// Apply dominant color if requested
````

## Línea 408

````text
// Fallback
````

## Línea 412

````text
// Finally, use customize style if requested
````

## Línea 420

````text
// Define the radius as an arbitrary size, but keep large enough to account
````

## Línea 421

````text
// for the drawing of the border.
````

## Línea 423

````text
// distance from the margin
````

## Línea 424

````text
// separation between the dots
````

## Línea 436

````text
// Draw the required numbers of dots
````

## Línea 442

````text
// draw for the bottom case:
````

## Línea 466

````text
// Adapted from dash-to-panel by Jason DeRose
````

## Línea 467

````text
// https://github.com/jderose9/dash-to-panel
````

## Línea 472

````text
// separation between the dots
````

## Línea 475

````text
// For the backlit case here we don't want the outer border visible
````

## Línea 499

````text
// Adapted from dash-to-panel by Jason DeRose
````

## Línea 500

````text
// https://github.com/jderose9/dash-to-panel
````

## Línea 505

````text
// separation between the dots
````

## Línea 508

````text
// For the backlit case here we don't want the outer border visible
````

## Línea 530

````text
// Adapted from dash-to-panel by Jason DeRose
````

## Línea 531

````text
// https://github.com/jderose9/dash-to-panel
````

## Línea 537

````text
// For the backlit case here we don't want the outer border visible
````

## Línea 557

````text
// Adapted from dash-to-panel by Jason DeRose
````

## Línea 558

````text
// https://github.com/jderose9/dash-to-panel
````

## Línea 564

````text
// separation between the dots
````

## Línea 585

````text
// Adapted from dash-to-panel by Jason DeRose
````

## Línea 586

````text
// https://github.com/jderose9/dash-to-panel
````

## Línea 592

````text
// separation between the dots
````

## Línea 615

````text
// Adapted from dash-to-panel by Jason DeRose
````

## Línea 616

````text
// https://github.com/jderose9/dash-to-panel
````

## Línea 632

````text
// For the backlit case here we don't want the outer border visible
````

## Línea 646

````text
// need to scale with the SVG for the stacked highlight
````

## Línea 674

````text
// Draw the required numbers of dots
````

## Línea 711

````text
// macos27-v7:dot-size
````

## Línea 721

````text
// draw from the bottom case:
````

## Línea 736

````text
/*
 * Unity like notification and progress indicators
 */
````

## Línea 741

````text
// default values for the progress bar itself
````

## Línea 753

````text
// default values for the progress bar track
````

## Línea 828

````text
// Follow the transformed top-right corner, not the icon's scale.
````

## Línea 829

````text
// The number remains crisp and the launch bounce follows naturally.
````

## Línea 847

````text
// fontSize was expressed in points, so convert to pixel
````

## Línea 959

````text
// TRANSLATORS: This is the accessible name for an app icon with unread
````

## Línea 960

````text
// notifications.
````

## Línea 961

````text
// %s is the name of the app and %d the number of unread notifications.
````

## Línea 967

````text
// Dock: name owned by parent DashItemContainer, see dash.js
````

## Línea 972

````text
// Overview: no per-icon parent, update icon and label directly
````

## Línea 1123

````text
// Draw the track
````

## Línea 1137

````text
// Draw the finished bar
````

## Línea 1193

````text
// Global icon cache. Used for Unity7 styling.
````

## Línea 1195

````text
// Max number of items to store
````

## Línea 1196

````text
// We don't expect to ever reach this number, but let's put an hard limit to avoid
````

## Línea 1197

````text
// even the remote possibility of the cached items to grow indefinitely.
````

## Línea 1199

````text
// When the size exceed it, the oldest 'n' ones are deleted
````

## Línea 1201

````text
// The icon size used to extract the dominant color
````

## Línea 1204

````text
// Compute dominant color from the app icon.
````

## Línea 1205

````text
// The color is cached for efficiency.
````

## Línea 1211

````text
/**
     * Try to get the pixel buffer for the current icon, if not fail gracefully
     */
````

## Línea 1218

````text
// Unable to load the icon texture, use fallback
````

## Línea 1225

````text
// Unable to load the icon texture, use fallback
````

## Línea 1230

````text
// Use GdkPixBuf to load the pixel buffer from the provided file path
````

## Línea 1233

````text
// Get the first pixel buffer available in the icon theme
````

## Línea 1243

````text
// Use GdkPixBuf to load the pixel buffer from memory
````

## Línea 1244

````text
// iconTexture.load is available unless iconTexture is not an instance of Gio.LoadableIcon
````

## Línea 1245

````text
// this means that iconTexture is an instance of Gio.EmblemedIcon,
````

## Línea 1246

````text
// which may be converted to a normal icon via iconTexture.get_icon?
````

## Línea 1251

````text
/**
     * The backlight color choosing algorithm was mostly ported to javascript from the
     * Unity7 C++ source of Canonicals:
     * https://bazaar.launchpad.net/~unity-team/unity/trunk/view/head:/launcher/LauncherIcon.cpp
     * so it more or less works the same way.
     */
````

## Línea 1259

````text
// We already know the answer
````

## Línea 1277

````text
// Resampling of large icons
````

## Línea 1278

````text
// We resample icons larger than twice the desired size, as the resampling
````

## Línea 1279

````text
// to a size s
````

## Línea 1280

````text
// DOMINANT_COLOR_ICON_SIZE < s < 2*DOMINANT_COLOR_ICON_SIZE,
````

## Línea 1281

````text
// most of the case exactly DOMINANT_COLOR_ICON_SIZE as the icon size is
````

## Línea 1282

````text
// typically a multiple of it.
````

## Línea 1286

````text
// Resample
````

## Línea 1296

````text
// computing the limit outside the for (where it would be repeated at each iteration)
````

## Línea 1297

````text
// for performance reasons
````

## Línea 1329

````text
// Cache the result.
````

## Línea 1337

````text
// delete oldest cached values (which are in order of insertions)
````

## Línea 1351

````text
/**
     * Downscale large icons before scanning for the backlight color to
     * improve performance.
     *
     * @param pixBuf
     * @param pixels
     * @param resampleX
     * @param resampleY
     *
     * @returns [];
     */
````

## Línea 1364

````text
// computing the limit outside the for (where it would be repeated at each iteration)
````

## Línea 1365

````text
// for performance reasons
````
