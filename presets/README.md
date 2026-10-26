# Preferencias visuales

Instantánea de los ajustes visuales usados durante la consolidación. No contiene
fotos, vídeos, ciudades personales, rutas de calendarios, contactos, notas ni
historiales. Los identificadores de pantalla se excluyeron del dock.

- `dock.dconf`: aspecto, ampliación, insignias, minimizar y autoocultamiento.
- `topbar.json`: colores de indicadores y política de tema de desplegables.
- `widgets-layout.json`: distribución, materiales y opciones visuales. `v` es la
  versión del formato de persistencia, no la versión de Aurea 27.

El instalador preserva los ajustes existentes y no aplica estos archivos por
defecto. Para restaurar únicamente el dock, con la extensión instalada:

```bash
dconf load /org/gnome/shell/extensions/dash-to-dock/ < presets/dock.dconf
```

Los archivos JSON solo deben copiarse con su extensión deshabilitada; de lo
contrario, una escritura pendiente podría reemplazarlos. Respaldar primero los
ajustes actuales. Los diseños no contienen el contenido personal de los widgets.
