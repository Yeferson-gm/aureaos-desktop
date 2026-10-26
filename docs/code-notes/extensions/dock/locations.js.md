# Notas de extensions/dock/locations.js

Comentarios trasladados durante la consolidación. Los números corresponden al archivo antes del traslado.

## Línea 1

````text
// -*- mode: js; js-indent-level: 4; indent-tabs-mode: nil -*-
````

## Línea 21

````text
// Use __ () and N__() for the extension gettext domain, and reuse
````

## Línea 22

````text
// the shell domain with the default _() and N_()
````

## Línea 60

````text
/**
 *
 */
````

## Línea 467

````text
// For some devices the mount point isn't advertised promptly
````

## Línea 468

````text
// even if it's already existing, and there's no signaling about
````

## Línea 705

````text
// FIXME: we will always get G_IO_ERROR_FAILED from the gvfs udisks
````

## Línea 706

````text
// backend, see https://bugs.freedesktop.org/show_bug.cgi?id=51271
````

## Línea 711

````text
// cryptsetup
````

## Línea 715

````text
// udisks (no password)
````

## Línea 719

````text
// libblockdev wrong password opening LUKS device
````

## Línea 723

````text
// cryptsetup returns EINVAL in many cases, including wrong TCRYPT password/parameters
````

## Línea 725

````text
/* EINVAL */
````

## Línea 728

````text
// cryptsetup returns EPERM when the TCRYPT header can't be decrypted
````

## Línea 729

````text
// with the provided password/parameters.
````

## Línea 731

````text
/* EPERM */
````

## Línea 883

````text
/**
 * @param shellApp
 */
````

## Línea 952

````text
// mi is Method injector, pi is Property injector
````

## Línea 1038

````text
// Re-implements shell_app_activate_window for generic activation and alt-tab support
````

## Línea 1059

````text
// Re-implements shell_app_activate_full for generic activation and dash support
````

## Línea 1104

````text
/**
 * We can't inherit from Shell.App as it's a final type, so let's patch it
 *
 * @param params
 */
````

## Línea 1141

````text
// FIXME: We need to add a new API to Nautilus to open new windows
````

## Línea 1247

````text
/**
 *
 */
````

## Línea 1254

````text
/**
 *
 */
````

## Línea 1272

````text
// Let's wait for the location app to take control before of us
````

## Línea 1317

````text
/**
 *
 */
````

## Línea 1328

````text
/**
 * This class maintains a Shell.App representing the Trash and keeps it
 * up-to-date as the trash fills and is emptied over time.
 */
````

## Línea 1353

````text
/**
 * This class maintains Shell.App representations for removable devices
 * plugged into the system, and keeps the list of Apps up-to-date as
 * devices come and go and are mounted and unmounted.
 */
````

## Línea 1360

````text
// TODO: This can be simplified using actual interface type when we
````

## Línea 1361

````text
// can depend on gjs 1.72
````

## Línea 1372

````text
// TODO: This can be simplified using actual interface type when we
````

## Línea 1373

````text
// can depend on gjs 1.72
````

## Línea 1478

````text
// We don't care about cancelling the ongoing operations from now on.
````

## Línea 1492

````text
// In some Gio.Mount implementations the volume may be set after
````

## Línea 1493

````text
// mount is emitted, so we could just ignore it as we'll get it
````

## Línea 1494

````text
// later via volume-added
````

## Línea 1507

````text
/**
 *
 */
````

## Línea 1523

````text
/**
 *
 */
````

## Línea 1530

````text
/**
 *
 */
````
