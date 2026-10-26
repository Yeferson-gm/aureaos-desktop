# Migración y recuperación

El primer commit contiene una importación completa verificada antes de renombrar
o limpiar comentarios. Los objetos de la antigua isla dinámica se preservan en
`refs/archive/dynamic-island/main`; no hay repositorios Git anidados.

```bash
git log --oneline --all
git show-ref
git ls-tree -r $(git rev-list --max-parents=0 main | head -1)
```

Los archivos antiguos se pueden recuperar con `git show COMMIT:RUTA` o exportando
un commit con `git archive`, sin sobrescribir la rama de trabajo. Nunca usar un
reset destructivo para recuperar un solo archivo.

Los directorios de desarrollo antiguos del Escritorio solo se retiran después
de comparar nuevamente sus hashes con la importación. Se envían a la papelera,
de modo que pueden restaurarse; también queda su contenido en Git. Los proyectos
ajenos al stack no se tocan.

Las instalaciones permanecen en los directorios que GNOME exige. No son una
segunda fuente de desarrollo. El instalador genera las versiones desde Git y
verifica el contenido antes y después de reemplazar cada componente. Los datos
en `~/.config` y `~/.local/share` —notas, fotos, música, portapapeles, favoritos y
vídeos— no entran en Git ni se reinician.

Se conserva la configuración GTK4 existente y se cambia solamente la familia
de tema seleccionada de WhiteSur a Aurea27. No se cambian fondos personales,
la elección de extensiones habilitadas ni preferencias de aplicaciones ajenas.
Los UUID de fondo animado, iconos de escritorio y centro de aplicaciones pasan
a identificadores Aurea propios, manteniendo su estado habilitado/deshabilitado.
Las instalaciones sustituidas y las actualizaciones pendientes de esos UUID
antiguos se envían a la papelera. Aplica el paquete antes de cerrar sesión: GNOME
puede necesitar entrar de nuevo para descubrir los identificadores nuevos.

Las copias antiguas del tema instalado pueden conservarse durante la transición
de sesión: aplicaciones ya abiertas podrían usar sus rutas. La fuente oficial
de desarrollo está únicamente en `theme/`; cualquier retirada de rutas instaladas
debe comprobar primero consumidores, enlaces y configuración.
