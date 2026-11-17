# Luz del teclado en el Centro de Control

El módulo `keyboardLight` usa la propiedad `Brightness` de
`org.gnome.SettingsDaemon.Power.Keyboard` en el bus de sesión. La API está
definida en [GNOME Settings Daemon](https://github.com/GNOME/gnome-settings-daemon/blob/master/plugins/power/gsd-power-manager.c).
Se muestra solo cuando el servicio publica un brillo válido. Las señales del
servicio actualizan el nivel cuando se utilizan las teclas físicas; no hay sondeo.

El icono alterna apagado/última intensidad no nula; si aún no hubo una, enciende
al máximo. El deslizador envía porcentajes y muestra el nivel confirmado por el
hardware, que puede ser discreto. En el portátil de verificación los niveles
son 0, 50 y 100 %, comprobados también leyendo el LED del kernel. Se restauró
su estado inicial después de la prueba.

Las peticiones se serializan conservando el último movimiento del deslizador.
Los errores se muestran en la tarjeta sin inventar un valor aplicado. Al descargar
la barra se cancelan operaciones y señales. La configuración existente conserva
su lista de controles; el usuario puede añadir o retirar Luz del teclado desde
las preferencias. Los valores por defecto sí incluyen el nuevo módulo.

## Verificación

```bash
dbus-run-session -- env AUREA_KEYBOARD_TEST=1 gjs -m extensions/topbar/tests/keyboard-light-runtime.js
bash extensions/topbar/tests/check-hover.sh
./aurea.sh check
```

El doble D-Bus solo se ejecuta en un bus privado: verifica encendido, apagado,
restauración, niveles discretos, cambios externos, ausencia de hardware,
fallos y cancelación. La prueba visual comprueba botón y deslizador en Shell
aislado junto con los controles existentes, en temas claro y oscuro.
Verificado en GNOME 50.6 y 51.1, incluida la apertura con puntero y el cierre
del panel. El hardware se comprobó en la sesión habitual sin reiniciar Shell.
