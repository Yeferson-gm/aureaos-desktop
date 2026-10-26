# Notas originales del proveedor

<p>* Adw version 100.30 for Gnome 50, 51</p>
<ul><li>Drop or paste links, text, and images; Paste as Link; drag count badges; Open in New Window for Nautilus. Calendar, desktop stability, and translation updates.</li></ul>
            <p>* Adw version 100.29 for Gnome 50</p>
<ul><li>Add support and switching shortcut for pinned widgets below all applications vs above them. Gnome Sushi navigation with arrow keys. Update support for Gtk >= 4.12</li></ul>
            <p>* Adw version 100.28 for Gnome 50</p>
<ul><li>Serialize desktop-state mutations through a FIFO async queue with independent file and geometry coalescing, preventing race conditions and stale object retention, and stabilize GTK startup layout and snapshot handling.</li></ul>
            <p>* Adw version 100.27 for Gnome 50</p>
<ul><li>Refine AppImage launch fallback and final AppImage launch failure handling, tighten URL validation with GLib.Uri, clean up desktopIconItem removing invalidate-size signals and dragIcon and lazy Gtk widget tree creation to conserve memory</li></ul>
            <p>* Adw version 100.26 for Gnome 50</p>
<ul><li>Fix memory leak with heavy disc activity and long Adw.Ding uptimes by serializing desktop refreshes so directory enumeration and the matching draw finish before the next refresh is queued.</li></ul>
            <p>* Adw version 100.25 for Gnome 50</p>
<ul><li>Refactor the metrics widgets to use libgtop for CPU, memory, and network sampling, and reuse shared decoders and samplers to reduce overhead.</li>
<li>Tighten widget backend lifecycle handling by improving systemd scope error reporting and explicitly tearing down the shared WebKit network session when widgets are turned off.</li>
<li>Weblate translation update for Thai, Chinese (Simplified Han script), Polish, German, Russian, Slovak, and Kyrgyz.</li></ul>
            <p>* Adw version 100.24 for Gnome 50</p>
<ul><li>Add support for downloading and installing the latest widgets from the Add Widget dialog, with a refreshed chooser and widget registry parsing.</li>
<li>Run the main app and HTML widget backend processes in dedicated systemd cgroup scopes under user.app, with app-prefixed subprocess names, independent of GNOME Shell.</li>
<li>Improve media player widgets by keeping the last active player selected when multiple players are playing.</li>
<li>Persist pinned widget global coordinates so pinned widgets keep their positions across grid and margin changes.</li>
<li>Add retry handling for temporary Open-Meteo 502/504 failures in weather widgets.</li>
<li>Weblate translation update.</li></ul>
            <p>* Adw version 100.23 for Gnome 50</p>
<ul><li>Refreshes GNOME 50 support with a Mutter cursor fix, Nautilus Previewer 2 / Sushi D-Bus support, improved Today widget dragging and timezone handling, plus packaging and translation updates.</li></ul>
            <p>* Adw version 100.22 for Gnome 49, 50</p>
<ul><li>Merge the latest window-tracking and draggable-widget fixes: clock, metrics, weather, media, and pinned windows now drag and track positions more reliably, while weather animations stay off by default and media widgets use a lighter DOM to reduce CPU use.</li></ul>
            <p>* Adw version 100.21 for Gnome 49, 50</p>
<ul><li>Short stability release: hardens the extension lifecycle, fixes window-type manager cleanup and stacking behavior, and adds GLibUnix signal compatibility for older systems.</li></ul>
            <p>* Adw version 100.20 for Gnome 49, 50</p>
<ul><li>Hardened widget host and WebKit integration, improved floating and pinned widget behavior, added media widget persistence and controls, refined geometry handling, and refreshed compatibility fixes.</li></ul>
            <p>* Adw version 100.19 for Gnome 49, 50</p>
<ul><li>Extends and hardens the widget API, adds floating and pinned HTML widgets, introduces Sticky Notes, makes Today and media widgets pinnable, updates world clocks, and polishes pinned widget interaction and UI behavior.</li></ul>
            <p>* Adw version 100.18 for Gnome 49, 50</p>
<ul><li>Wayland-only release: removes X11 support, improves dock/widget-layer focus and display behavior, and updates shell compatibility.</li></ul>
            <p>* Adw version 100.17 for Gnome 45, 46, 47, 48, 49</p>
<ul><li>Widget polish: grid controls, media widgets, webview reattach, redisplay, and animation.</li></ul>
            <p>* Adw version 100.16 for Gnome 45, 46, 47, 48, 49</p>
<ul><li>Fixes -Empty window not mapping, icon placement with monitor hotplug</li></ul>
            <p>* Adw version 100.15 for Gnome 45, 46, 47, 48, 49</p>
<ul><li>Uses GSK instead of Cairo to draw, optimizing GPU, minimizing CPU</li></ul>
<ul><li>Fixes widget positioning and loadstate race</li></ul>
<ul><li>Fixes widget visibility on mapping visibility changes</li></ul>
<ul><li>Fixes icon selection with shift/ctrl and keyboard arrow navigation</li></ul>
<ul><li>Fixes overrview animation</li></ul>
            <p>* Adw version 100.14 for Gnome 45, 46, 47, 48, 49</p>
<ul><li>Adds html widgets that can launch and communicate with a local backend</li></ul>
<ul><li>Reverts multiple selection with arrows as it breaks mouse drag and drop</li></ul>
<ul><li>Added a Today(Calendar) widget and system Metrics widget for desktop</li></ul>
<ul><li>Improves preferences for widgets</li></ul>
            <p>* Adw version 100.13 for Gnome 45, 46, 47, 48, 49</p>
<ul><li>Adds widgets that can be displayed on the desktop under the icon layer</li></ul>
<ul><li>Users can apply their own CSS</li></ul>
            <p>* Adw version 100.11 for Gnome 45, 46, 47, 48, 49</p>
<ul><li>Fix margins in RTL layout under dock</li></ul>
<ul><li>Adapt to X11 removal in mutter</li></ul>
            <p>* Adw version 100.9 for Gnome 45, 46, 47, 48, 49</p>
<ul><li>Machine Translation with LibreTranslate to all supported languages</li></ul>
            <p>* Adw version 100.8-2 for Gnome 45, 46, 47, 48 49</p>
<ul><li>Bug fix for older gnome versions with no GioUnix namespace</li></ul>
            <p>* Adw version 100.8 for Gnome 45, 46, 47, 48, 49</p>
<ul><li>Animate margin changes. Respects global Gtk4/Gnome animation settings</li></ul>
<ul><li>Right long-click brings up gnome shell background menu directly</li></ul>
<ul><li>Improve search UI, unselected items are now properly dimmed to highlight the selected</li></ul>
            <p>* Adw version 100.7 for Gnome 45, 46, 47, 48, 49</p>
<ul><li>Fix Gnome 49 compatibility issues</li></ul>
<ul><li>Fix xdg-terminal-exec directory detection in system data dirs</li></ul>
            <p>* Adw version 100.6 for Gnome 45, 46, 47, 48, 49</p>
<ul><li>Adapt to new Gnome 49 Meta.Window and Meta.WaylandClient API</li></ul>
<ul><li>Fix missing app icon if no parent icon folder</li></ul>
            <p>* Adw version 100.5 for Gnome 45, 46, 47, 48</p>
<ul><li>Set localized default desktop name</li></ul>
<ul><li>Resizable open with dialog</li></ul>
<ul><li>Fix custom icons size</li></ul>
<ul><li>Update to more direct error message</li></ul>
            <p>* Adw version 100.3 for Gnome 45, 46, 47, 48</p>
<ul><li>Draw proper selection rectangle at small sizes</li></ul>
            <p>* Adw version 100.2 for Gnome 45, 46, 47, 48</p>
<ul><li>Remove dependency on xdg-user-dirs</li></ul>
            <p>* Adw version 100.1 for Gnome 45, 46, 47, 48</p>
<p>Minor bug fixes to run on older Adw 1.5, errors on connecting second monitor, fix open terminal shortcut</p>
<p>Yay! Version 100!
Actually version 1.0, started with 0.01, but got tired of writing a 0 before every version.
I believe mostly feature complete, except DBus Activation and packaging as a GJS app.
Change Name to Adw. Desktop Icons :)
</p>
<ul><li> Add a complete shortcut manager with editable local and global shortcuts.</li>
<li> Add Adw.AboutDialog for the application with proper credits and acknowledgements.</li>
<li> Add more actions, to arrange icons directly, that can then have proper keybindings in the shortcut manager.</li>
<li> Redesign the preferences to open the shortcut manger. When opened through gnome extensions settings, shortcut manager is activated over DBus, and only works if the extension/app is enabled. </li>
<li> Add an easily editable boolean constant to gnome shell override so Users wanting to show icons on window picker overview or on thumbnails can choose to do so.</li>
<li> .desktop files on the desktop now show their actions in the right click context menus. All these actions are shown and can be activated if the file is trusted.</li></ul>
