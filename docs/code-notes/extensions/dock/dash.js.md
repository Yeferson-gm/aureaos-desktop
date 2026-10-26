# Notas de extensions/dock/dash.js

Comentarios trasladados durante la consolidación. Los números corresponden al archivo antes del traslado.

## Línea 1

````text
// -*- mode: js; js-indent-level: 4; indent-tabs-mode: nil -*-
````

## Línea 32

````text
// macos27-v7:import
````

## Línea 34

````text
// module "Dash" did not export DASH_ANIMATION_TIME in old versions
````

## Línea 35

````text
// so we just define it like it is defined in Dash;
````

## Línea 36

````text
// taken from https://gitlab.gnome.org/GNOME/gnome-shell/-/blob/main/js/ui/dash.js
````

## Línea 45

````text
/**
 * Extend DashItemContainer
 *
 * - set label position based on dash orientation
 *
 */
````

## Línea 70

````text
// we override the method show taken from:
````

## Línea 71

````text
// https://gitlab.gnome.org/GNOME/gnome-shell/-/blob/main/js/ui/dash.js
````

## Línea 72

````text
// in order to apply a little modification at the end of the animation
````

## Línea 73

````text
// which makes sure that the icon background is not blurry
````

## Línea 85

````text
// when the animation is ended, we simulate
````

## Línea 86

````text
// a hover to gain back focus and unblur the
````

## Línea 87

````text
// background
````

## Línea 111

````text
/**
 * This class is a fork of the upstream dash class (ui.dash.js)
 *
 * Summary of changes:
 * - disconnect global signals adding a destroy method;
 * - play animations even when not in overview mode
 * - set a maximum icon size
 * - show running and/or favorite applications
 * - hide showApps label when the custom menu is shown.
 * - add scrollview
 *   ensure actor is visible on keyfocus inseid the scrollview
 * - add 128px icon size, might be useful for hidpi display
 * - sync minimization application target position.
 * - keep running apps ordered.
 */
````

## Línea 148

````text
// Initialize icon variables and size
````

## Línea 194

````text
// macos27-v7:clip - los iconos ampliados no se recortan en el visor.
````

## Línea 199

````text
// St.BoxLayout derives from St.Viewport. Its default clip-to-view
````

## Línea 200

````text
// framebuffer clip would cut magnified icons at the dock edge.
````

## Línea 273

````text
// macos27-v7:shelf - estante de vidrio con desenfoque real.
````

## Línea 353

````text
// macos27-v7:shelf-destroy
````

## Línea 411

````text
// macos27-v7:label - etiqueta casi inmediata, como en macOS.
````

## Línea 447

````text
// macos27-v7:locsep - separador entre las apps y la papelera/volúmenes.
````

## Línea 531

````text
// Ensure the next and previous icon are visible when moving the
````

## Línea 532

````text
// placeholder (we're assuming there's room for both of them)
````

## Línea 562

````text
// If scroll is not used because the icon is resized, let the scroll event propagate.
````

## Línea 566

````text
// reset timeout to avid conflicts with the mousehover event
````

## Línea 569

````text
// Skip to avoid double events mouse
````

## Línea 596

````text
// TODO: Remove this if possible.
````

## Línea 649

````text
// This signal is triggered also by mouse click. The popup menu is opened at the original
````

## Línea 650

````text
// coordinates. Thus correct for the shift which is going to be applied to the scrollview.
````

## Línea 671

````text
// Override default AppIcon labelActor, now the
````

## Línea 672

````text
// accessibleName is set at DashItemContainer.setLabelText
````

## Línea 698

````text
/**
     * Return an array with the "proper" appIcons currently in the dash
     */
````

## Línea 702

````text
// Only consider children which are "proper"
````

## Línea 703

````text
// icons (i.e. ignoring drag placeholders) and which are not
````

## Línea 704

````text
// animating out (which means they will be destroyed at the end of
````

## Línea 705

````text
// the animation)
````

## Línea 725

````text
// I want to listen from outside when a menu is closed. I used to
````

## Línea 726

````text
// add a custom signal to the appIcon, since gnome 3.8 the signal
````

## Línea 727

````text
// calling this callback was added upstream.
````

## Línea 733

````text
// For the icon size, we only consider children which are "proper"
````

## Línea 734

````text
// icons (i.e. ignoring drag placeholders) and which are not
````

## Línea 735

````text
// animating out (which means they will be destroyed at the end of
````

## Línea 736

````text
// the animation)
````

## Línea 749

````text
// Check if the container is present in the stage. This avoids critical
````

## Línea 750

````text
// errors when unlocking the screen
````

## Línea 758

````text
/* whatever */
````

## Línea 773

````text
// if no icons there's nothing to adjust
````

## Línea 777

````text
// Enforce valid spacings during the size request
````

## Línea 783

````text
// Subtract icon padding and box spacing from the available width
````

## Línea 792

````text
// Subtract icon padding and box spacing from the available height
````

## Línea 823

````text
// Set the new size immediately, to keep the icons' sizes
````

## Línea 824

````text
// in sync with this.iconSize
````

## Línea 827

````text
// Don't animate the icon size change when the overview
````

## Línea 828

````text
// is transitioning, not visible or when initially filling
````

## Línea 829

````text
// the dash
````

## Línea 836

````text
// Scale the icon's texture to the previous size and
````

## Línea 837

````text
// tween to the new size
````

## Línea 892

````text
// When using isolation, we filter out apps that have no windows in
````

## Línea 893

````text
// the current workspace
````

## Línea 904

````text
// Apps currently in the dash
````

## Línea 906

````text
// Apps supposed to be in the dash
````

## Línea 914

````text
// We reorder the running apps so that they don't change position on the
````

## Línea 915

````text
// dash with every redisplay() call
````

## Línea 917

````text
// First: add the apps from the oldApps list that are still running
````

## Línea 927

````text
// Second: add the new apps
````

## Línea 954

````text
// macos27-v7:locsep-remove
````

## Línea 957

````text
// Temporary remove the separator so that we don't compute to position icons
````

## Línea 962

````text
// Figure out the actual changes to the list of items; we iterate
````

## Línea 963

````text
// over both the list of items currently in the dash and the list
````

## Línea 964

````text
// of items expected there, and collect additions and removals.
````

## Línea 965

````text
// Moves are both an addition and a removal, where the order of
````

## Línea 966

````text
// the operations depends on whether we encounter the position
````

## Línea 967

````text
// where the item has been added first or the one from where it
````

## Línea 968

````text
// was removed.
````

## Línea 969

````text
// There is an assumption that only one item is moved at a given
````

## Línea 970

````text
// time; when moving several items at once, everything will still
````

## Línea 971

````text
// end up at the right position, but there might be additional
````

## Línea 972

````text
// additions/removals (e.g. it might remove all the launchers
````

## Línea 973

````text
// and add them back in the new order even if a smaller set of
````

## Línea 974

````text
// additions and removals is possible).
````

## Línea 975

````text
// If above assumptions turns out to be a problem, we might need
````

## Línea 976

````text
// to use a more sophisticated algorithm, e.g. Longest Common
````

## Línea 977

````text
// Subsequence as used by diff.
````

## Línea 988

````text
// No change at oldIndex/newIndex
````

## Línea 995

````text
// App removed at oldIndex
````

## Línea 1002

````text
// App added at newIndex
````

## Línea 1013

````text
// App moved
````

## Línea 1044

````text
// Don't animate item removal when the overview is transitioning
````

## Línea 1045

````text
// or hidden
````

## Línea 1052

````text
// Update separator
````

## Línea 1083

````text
// macos27-v7:locsep-update
````

## Línea 1085

````text
// Skip animations on first run when adding the initial set
````

## Línea 1086

````text
// of items, to avoid all items zooming in at once
````

## Línea 1095

````text
// This will update the size, and the corresponding number for each icon
````

## Línea 1112

````text
// No overlay after 10
````

## Línea 1149

````text
/**
     * Reset the displayed apps icon to maintain the correct order when changing
     * show favorites/show running settings
     */
````

## Línea 1163

````text
// to avoid ugly animations, just suppress them like when dash is first loaded.
````

## Línea 1240

````text
// This is indeed ugly, but we need to ensure that the last and first
````

## Línea 1241

````text
// visible widgets are re-computed by St, that is buggy because of a
````

## Línea 1242

````text
// mutter issue that is being fixed:
````

## Línea 1243

````text
// https://gitlab.gnome.org/GNOME/mutter/-/merge_requests/2047
````

## Línea 1253

````text
/**
 * This is a copy of the same function in utils.js, but also adjust horizontal scrolling
 * and perform few further checks on the current value to avoid changing the values when
 * it would be clamp to the current one in any case.
 * Return the amount of shift applied
 *
 * @param scrollView
 * @param actor
 */
````

## Línea 1263

````text
// access to scrollView.[hv]scroll was deprecated in gnome 46
````

## Línea 1264

````text
// instead, adjustment can be accessed directly
````

## Línea 1265

````text
// keep old way for backwards compatibility (gnome <= 45)
````
