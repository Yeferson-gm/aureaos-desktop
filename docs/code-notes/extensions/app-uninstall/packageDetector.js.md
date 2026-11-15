# Notas de extensions/app-uninstall/packageDetector.js

Comentarios trasladados durante la consolidación. Los números corresponden al archivo antes del traslado.

## Línea 40

````text
// 1. Check Snap
````

## Línea 45

````text
// 2. Check Flatpak
````

## Línea 50

````text
// 3. Check AppImage
````

## Línea 55

````text
// 4. Check Web App / PWA (Chrome, Brave, Edge, Chromium, Firefox PWA)
````

## Línea 60

````text
// 5. Check Steam Games
````

## Línea 65

````text
// 6. Check Pipx Python packages
````

## Línea 70

````text
// 7. Check Homebrew / Linuxbrew
````

## Línea 75

````text
// 8. Check Nix / GNU Guix
````

## Línea 80

````text
// 9. Check Native Linux Distribution Package Managers (dpkg, rpm, pacman, apk, xbps, eopkg)
````

## Línea 117

````text
// 10. Check Custom / Standalone desktop entries (e.g. /opt/..., ~/Applications/..., ~/.local/share/applications/...)
````

## Línea 164

````text
// Fallback on appInfo if keyfile parsing fails
````

## Línea 208

````text
// 1. Check path like /var/lib/snapd/desktop/applications/<snapName>_<appName>.desktop or <snapName>.desktop
````

## Línea 218

````text
// 2. Check path like /snap/<snapName>/...
````

## Línea 223

````text
// 3. Check Exec line
````

## Línea 231

````text
// 4. Check Icon path
````

## Línea 494

````text
// 1. /opt/<app-dir>
````

## Línea 501

````text
// 2. ~/Applications/<app-dir>
````

## Línea 513

````text
// 3. ~/.local/opt/<app-dir>
````

## Línea 524

````text
// 4. ~/.local/share/<app-dir>
````

## Línea 535

````text
// 5. /usr/local/share/<app-dir>
````

## Línea 639

````text
// Output: "/usr/share/applications/foo.desktop is owned by foo-pkg 1.2.3-1"
````

## Línea 652

````text
// Output: "/usr/share/applications/foo.desktop is owned by foo-pkg-1.2.3"
````

## Línea 665

````text
// Output: "pkgname-version: /path/to/file"
````
