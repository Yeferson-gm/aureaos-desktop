# Aurea 27 · Arranque

Tema completo de GRUB integrado desde la instalación WhiteSur existente:
fondo, selección, iconos y fuentes PF2. El nombre activo es `Aurea27` y su ruta
es `/boot/grub2/themes/Aurea27`. La autoría original no cambia.

## Aplicar en Fedora UEFI

Desde la raíz de Aurea, con Fedora y Windows ya configurados y la partición EFI
montada en `/boot/efi`:

```bash
sudo python3 integrations/boot-menu/manage.py apply
sudo python3 integrations/boot-menu/manage.py check
```

El instalador retira únicamente la entrada manual `Arch Linux (disco externo)`
de `/etc/grub.d/40_custom` y muestra `Windows` en lugar de `Windows Boot Manager`.
No elimina sistemas, particiones ni archivos EFI. En otro equipo se puede indicar
el nombre exacto de la entrada obsoleta con `--remove-entry 'Nombre exacto'`.
Rechaza retirar Fedora o Windows. No inventa UUID: conserva la entrada Windows
existente y exige su cargador en la partición EFI montada.

Fedora mantiene BLS, kernel actual, alternativo y rescate. Por tanto, puede haber
varias opciones **de Fedora**, sin ofrecer un tercer sistema operativo. El acceso
manual a firmware UEFI se oculta quitando el permiso de ejecución de su generador;
no se bloquean las actualizaciones de firmware de `fwupd`. Estas pueden añadir
una entrada temporal necesaria para completar una actualización.

Se genera `/boot/grub2/grub.cfg` en un temporal y se verifica con
`grub2-script-check` antes de reemplazarlo. Nunca se escribe el stub
`/boot/efi/EFI/fedora/grub.cfg`, ni se ejecuta `grub2-install`, ni se cambia PAM,
Secure Boot, NVRAM o el kernel predeterminado. Un fallo revierte los archivos
modificados. La ruta activa anterior `whitesur` se migra al respaldo administrativo.

## Comprobar y restaurar

Los originales quedan en `/var/lib/aurea-27/boot-menu`, solo accesibles por root.
El respaldo incluye configuración, permisos y tema anterior. No debe subirse a Git,
pues contiene identificadores de las particiones de cada equipo.

```bash
sudo python3 integrations/boot-menu/manage.py check
sudo python3 integrations/boot-menu/manage.py restore
```

Restaurar regenera el menú con los kernels actualmente instalados, en lugar de
recuperar una lista de kernels antigua. Si alguien ha modificado los archivos
administrados, la comprobación detiene la restauración para revisarlos primero.
Una actualización del paquete GRUB puede reactivar su generador UEFI; `check`
lo detecta y se puede volver a ejecutar `apply`. No se modifican scripts de
actualización del kernel ni se fijan sus números de versión.

No se reinicia automáticamente. Verificar visualmente el menú y el inicio de ambos
sistemas en el siguiente reinicio voluntario. La prueba automatizada valida
transformaciones, sintaxis y reversión ante fallos; no simula una autenticación ni
certifica el arranque real de Windows.

## Procedencia

Base: [vinceliuice/grub2-themes](https://github.com/vinceliuice/grub2-themes), variante
WhiteSur instalada. `theme/LICENSE` reproduce GPL-3.0 del repositorio, revisión
`4c5a77125b93f833edc9bf7b14a899faa8ac79c6`. Los recursos se importaron de la copia
instalada, sin afirmar que todos coincidan con esa revisión. Se conservan los
iconos de otras distribuciones como parte del tema completo; no crean entradas.
Las fuentes PF2 proceden de esa copia (Unifont y Terminus). No se les atribuye una
licencia propia de Aurea. El pie gráfico de ayuda original se conserva.

Referencia técnica: [GRUB 2 en Fedora](https://fedoraproject.org/wiki/GRUB_2).
