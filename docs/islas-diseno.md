# Espacios laterales e isla superior

Referencias consultadas el 17 de noviembre de 2026:
[SideDock](https://getsidedock.com/) para apertura desde bordes y combinación de
apps, grupos y carpetas; [Sidebar](https://sidebarapp.net/) para agrupación,
vistas de ventanas y organización compacta. La adaptación utiliza recursos
Aurea y controles GNOME; no distribuye código ni imágenes de esas aplicaciones.

## Distribución

- Borde de favoritas: cápsula negra de 64 px pegada al borde cuando se revela,
  iconos de 36 px y botón de cuadrícula para entrar a «Tu espacio».
  En reposo queda totalmente oculta; la zona de activación es transparente.
- Panel: 360 px, superficie clara u oscura, radio de 22 px, buscador, perfil y
  filtro; categorías plegables, cuadrícula o lista. Sin repetir todas las apps
  fijadas en otra sección del mismo panel. Indicadores de actividad pequeños.
- Borde opuesto: baterías de dispositivos, apertura tras 180 ms y cierre al salir.
  Nombres, iconos y porcentajes reales de UPower/BlueZ; no consume consultas en reposo.
- Estadísticas: zona invisible cerca de la esquina inferior izquierda; CPU, RAM,
  disco y red actualizados cada dos segundos mientras el panel está abierto.
- Isla superior: accesos directos en Inicio a Estante, Equipo y Enfoque. Mantiene
  reproducción MPRIS, archivos, notas, calendario y demás módulos existentes.

Los bordes compartidos no activan estadísticas; favoritas busca el borde exterior
cuando es posible. Los paneles respetan el monitor y se ocultan en la vista general.
Estadísticas puede desactivarse en los ajustes de Tu espacio.

## Archivos y grupos

Añadir admite rutas de archivos/carpetas y enlaces. «Añadir archivos copiados»
lee la selección copiada desde el gestor de archivos, sin mover ni duplicar su
contenido. En las acciones de una carpeta, «Ver contenido» muestra hasta 40 entradas
con apertura directa. Para carpetas mayores hay un botón de apertura en Archivos.
Los accesos utilizan el icono real del archivo o carpeta.

«Crear grupo y mover aquí» permite crear una categoría desde cualquier acceso;
arrastre y «Mover a» reorganizan apps y archivos. «Abrir grupo» conserva la selección
explícita de recursos y muestra fallos. Perfiles, exportación y Deshacer permanecen.

## Activar apertura de la isla superior por hover

```bash
aurea_schema="$HOME/.local/share/gnome-shell/extensions/dynamic-island-gnome50@local/schemas"
gsettings --schemadir "$aurea_schema" set org.gnome.shell.extensions.dynamic-island hover-open true
gsettings --schemadir "$aurea_schema" set org.gnome.shell.extensions.dynamic-island initial-page home
gsettings --schemadir "$aurea_schema" set org.gnome.shell.extensions.dynamic-island home-modules "['music', 'files', 'system']"
```

Para volver a apertura solo con clic, cambiar `hover-open` a `false`.
La integración local de asistentes se documenta en la guía de la isla dinámica.
No se implementa AirDrop ni se anuncian las tarjetas exclusivas de SideDock como
funciones de Aurea. La adaptación de los videos más recientes y sus límites están
en [referencias de música e islas](referencias-islas-musica.md).

## Verificación

Pruebas de Shell aislado en GNOME 50.6 y 51.1: temas, menús, clics reales,
reapertura interrumpida, recursos y estadísticas. El sondeo de estadísticas se
comprueba detenido al cerrar. La prueba del paquete comprueba carga de los
19 módulos; el equipo habitual sigue en GNOME 51.1.

La barra deja de consultar la cápsula cuando la isla está desactivada y la isla
libera esa referencia al cerrar. La lectura asíncrona de carpetas solo actualiza
el menú que inició la consulta, evitando accesos a controles ya destruidos.
