# GNOME 51

Aurea conserva los UUID, esquemas y datos de usuario. Los 19 módulos declaran
GNOME 51. Las adaptaciones sustituyen `St.BoxLayout.vertical` por `orientation`,
normalizan las opciones de animación de los menús y usan `Clutter.ShaderEffect`
cuando `Shell.GLSLEffect` no está disponible. El bloqueo utiliza un fondo estático
St y el formulario de GDM conserva el verificador nativo.

Referencias: [migración oficial de extensiones](https://gjs.guide/extensions/upgrading/gnome-shell-51.html)
y [Fedora Workstation 45](https://fedoramagazine.org/whats-new-fedora-workstation-45/).

## Instalar después de actualizar el sistema

Desde la raíz del repositorio, con HEAD etiquetada y limpia:

```bash
./aurea.sh check
./aurea.sh build
aurea_tag=$(git describe --tags --exact-match)
aurea_paquete="$PWD/dist/aurea-27-${aurea_tag#v}"
sudo python3 "$aurea_paquete/integrations/login-screen/manage.py" apply
sudo python3 "$aurea_paquete/integrations/login-screen/maintenance.py" install
./aurea.sh install "$aurea_paquete" --apply
./aurea.sh install "$aurea_paquete" --check
python3 "$aurea_paquete/integrations/login-screen/manage.py" status
```

Omitir `build` si ese paquete ya existe: los paquetes publicados no se sobrescriben.
Cerrar sesión y volver a entrar cuando se haya guardado el trabajo. Copiar archivos
no sustituye los módulos JavaScript ya cargados por GNOME.

El mantenimiento guarda una copia administrativa en
`/usr/local/lib/aurea-27/login-refresh`, propiedad de root. Al arrancar, antes de
GDM, comprueba el recurso de tema y vuelve a aplicarlo solo si una actualización
lo sustituyó. No ejecuta código desde el Escritorio, no reinicia GDM y no modifica
PAM. Si falla, el inicio de sesión no depende de que el servicio termine bien.
Actualizar esta copia al instalar una entrega nueva. Para consultar o retirar:

```bash
systemctl status aurea-login-refresh.service
journalctl -b -u aurea-login-refresh.service --no-pager
sudo python3 "$aurea_paquete/integrations/login-screen/maintenance.py" remove
```

## Verificación

`./aurea.sh check` comprueba sintaxis, esquemas, recursos y pruebas de lógica.
`bash tests/stack-shell.sh` comprueba carga y desactivación de los 19 módulos
con un compositor y bus privados. Las pruebas específicas están en:

```bash
SIDE_TEST_MONITORS=2 bash extensions/app-island/test-shell.sh
bash extensions/topbar/tests/check-hover.sh
bash extensions/dock/tests/smoke-magnification.sh
bash extensions/lock-screen/tests/smoke.sh
bash integrations/login-screen/test-shell.sh
```

Comprobado con GNOME 50.6 durante la preparación y GNOME 51.1 instalado en Fedora45.
Las pruebas virtuales no certifican todas las combinaciones de GPU, escalas
fraccionarias, monitores físicos, periféricos o servicios de terceros. Se conserva
la validación de versiones de GNOME; no es necesario desactivarla.
