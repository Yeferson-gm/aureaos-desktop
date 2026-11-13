# Inicio de sesión de Aurea

GDM muestra el selector de usuario y la contraseña al encender el equipo o cerrar
sesión. Es un proceso independiente, anterior a las extensiones del usuario.
La extensión `aurea-lock-screen@local` personaliza únicamente Super+L.

Esta integración prepara el recurso de tema de GNOME Shell 50 conservando todos
sus recursos originales. Añade el fondo WhiteSur estático y estilos limitados a
GDM: avatar, nombre, entrada protegida, mensajes, lista y barra superior. El
formulario, su colocación nativa, el teclado y la autenticación siguen siendo de
GNOME. No inyecta JavaScript, modifica PAM ni instala otra pantalla de acceso.
El modo de alto contraste conserva exactamente su CSS original.

## Preparar y probar sin privilegios

Desde el repositorio:

```bash
python3 integrations/login-screen/manage.py build --output /tmp/aurea-gdm.gresource
python3 integrations/login-screen/test_manage.py
bash integrations/login-screen/test-shell.sh
```

La prueba de Shell usa el AuthPrompt y St.PasswordEntry nativos con un verificador
sintético en una sesión privada. No envía contraseñas ni inicia conversaciones PAM.
El selector de usuarios de la prueba usa nombres ficticios. No sustituye la
verificación visual final del GDM real después de cerrar sesión.

## Instalar y restaurar

Primero guardar el trabajo. La instalación no cierra sesión ni reinicia GDM.

```bash
sudo python3 integrations/login-screen/manage.py apply
python3 integrations/login-screen/manage.py status
```

Para retirar únicamente esta personalización:

```bash
sudo python3 integrations/login-screen/manage.py remove
```

Fedora requiere autorización de administrador para cambiar
`/usr/share/gnome-shell/gnome-shell-theme.gresource`. El original y los checksums
se guardan en `/var/lib/aurea-27/gdm`. La instalación compila y valida primero,
sustituye atómicamente el recurso y conserva/restaura los contextos SELinux. Si
falla, recupera el recurso y manifiesto anteriores. Es idempotente.

Una actualización del paquete GNOME Shell puede restaurar el tema de Fedora.
En ese caso, repetir `apply`: toma como base el recurso actualizado. `remove`
no instala un respaldo antiguo encima de una actualización del sistema. No se
recomienda bloquear actualizaciones del paquete ni desactivar SELinux.

El paquete generado en `dist` contiene este instalador, CSS, fondo y licencia
como archivos independientes. Compila contra el GNOME instalado al ejecutarse,
sin distribuir una copia obsoleta de los recursos nativos.

## Procedencia

Fondo compartido con `extensions/lock-screen/assets`, WhiteSur-wallpapers, MIT;
se conserva `LICENSE.WhiteSur`. Selectores y contratos contrastados con
`gdm/loginDialog.js`, `gdm/authPrompt.js` y `ui/sessionMode.js` de GNOME Shell 50.6
instalado, extraídos de `libshell-18.so`. La carga de estilos usa
[St.Theme](https://gnome.pages.gitlab.gnome.org/gnome-shell/st/ctor.Theme.new.html).
