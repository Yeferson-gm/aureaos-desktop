# Inicio de sesión de Aurea

GDM muestra el selector de usuario y la contraseña al encender el equipo o cerrar
sesión. Es un proceso independiente, anterior a las extensiones del usuario.
La extensión `aurea-lock-screen@local` personaliza únicamente Super+L.

Esta integración prepara el recurso de tema de GNOME Shell 50 conservando todos
sus recursos originales. Añade el fondo WhiteSur estático y estilos limitados a
GDM: fondo WhiteSur claro a color, avatar circular, nombre y entrada compacta.
La extensión de sistema `aurea-login-layout@local`, exclusiva del modo `gdm`,
coloca el formulario nativo en el 14 % superior del área disponible y añade
Apagar equipo, Reiniciar y Reposo al pie. Usa `SystemActions` de GNOME y respeta
sus capacidades y políticas; los controles no disponibles aparecen desactivados.
Si no caben junto a los controles nativos, se conserva el menú de energía de GNOME.

Solo modifica la presentación. No reemplaza el verificador, lee contraseñas,
modifica PAM ni instala otra pantalla de acceso. El selector de otras cuentas,
volver, mostrar contraseña, mensajes, teclado y accesibilidad siguen siendo
nativos. El avatar es el de la cuenta real; no se copia la persona de la referencia
ni se muestra un mensaje ficticio de Touch ID. El modo de alto contraste conserva
su CSS original, aunque participa en la colocación de controles.

## Preparar y probar sin privilegios

Desde el repositorio:

```bash
python3 integrations/login-screen/manage.py build --output /tmp/aurea-gdm.gresource
python3 integrations/login-screen/test_manage.py
bash integrations/login-screen/test-shell.sh
```

La prueba de Shell usa el AuthPrompt y St.PasswordEntry nativos con un verificador
sintético en una sesión privada. No envía contraseñas ni inicia conversaciones PAM.
La prueba reutiliza el algoritmo de asignación del LoginDialog nativo con un
contenedor de prueba, sin construir su cliente GDM. Comprueba posición, recepción
del puntero, las tres acciones mediante dobles de prueba, cambios de capacidad y
restauración de métodos/señales. Nunca llama al apagado o suspensión reales.
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

La presentación se instala como archivos propiedad de root en
`/usr/share/gnome-shell/extensions/aurea-login-layout@local`. El instalador añade
su UUID a las extensiones ya configuradas de GDM y retira únicamente ese UUID de
su lista de desactivadas. Las claves de activación quedan en
`/etc/dconf/db/gdm.d/90-aurea-login`, con bloqueos en `locks/90-aurea-login`:
solo afectan al perfil de GDM. `allow-extension-installation=false` impide cargar
extensiones desde el directorio personal de GDM. No se cambia la lista del usuario.
`dconf update` compila estos ajustes; no reinicia ningún servicio.

`layout.json` registra los checksums y permite desinstalar sin dejar esta
activación. Los cambios externos en archivos administrados se detectan antes de
sobrescribirlos. La retirada elimina exclusivamente los archivos propios y vuelve
a compilar dconf; conserva configuraciones ajenas. Requiere el perfil de Fedora
`/usr/share/dconf/profile/gdm` con `system-db:gdm`.

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
