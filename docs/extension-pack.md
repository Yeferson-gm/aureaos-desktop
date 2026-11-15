# Pack de extensiones Aurea 27

Los diez módulos añadidos se encuentran en `extensions/`: battery-care, caffeine,
magic-lamp, window-motion, window-switcher, desktop-cube, privacy, app-indicators,
app-uninstall y shell-theme. Cada módulo conserva un `UPSTREAM.md`, licencia,
esquemas y traducciones originales. El manifiesto `upstream-extensions.json`
fija repositorio y revisión; los nuevos UUID están en `stack.json`.

Se seleccionaron revisiones para GNOME 50: Coverflow v88, AppIndicator v64,
GNOME Shell Extensions 50.4 y AppGrid Uninstall v1.2.0. No se copia ciegamente
una rama que requiere GNOME 51. Los otros componentes conservan sus contratos.
Los recursos GResource de Cubo y las traducciones MO se generan en el paquete,
no se mantienen artefactos compilados como segunda fuente.

## Migración

El instalador completo verifica primero los nuevos archivos. Guarda en memoria
los estados de las listas de extensiones, desactiva sin reiniciar GNOME los UUID
originales conocidos y después los sustituye por los nuevos, sin duplicados.
Si falla la desactivación, restaura ambas listas y no retira las copias originales.
Las preferencias permanecen en sus esquemas originales. Las instalaciones de
usuario reemplazadas van a la papelera; los RPM se retiran con DNF según README.
Los UUID nuevos pueden necesitar un nuevo inicio de sesión para ser descubiertos.
La instalación por componente no realiza esta migración global.

Para deshacer un módulo: desactivar su UUID Aurea, restaurar la copia original de
la papelera (o reinstalar el RPM original), cerrar/abrir sesión y habilitar el UUID
original del manifiesto. No activar ambas implementaciones simultáneamente.
No se reinicia dconf: los mismos esquemas conservan los ajustes en ambos sentidos.

## Correcciones de integración

- La barra superior busca primero los esquemas de batería y cafeína en Aurea,
  con compatibilidad con sus UUID anteriores durante la transición.
- La hoja CSS temporal de la barra se descarga tanto del tema que la creó como
  del tema activo antes de borrarla. Evita rutas inexistentes al recargar el tema.
- Batería permite desactivación cuando no hay batería o no se inicializó el
  indicador. El auxiliar privilegiado y sus políticas originales no se renombran.
- El analizador de bus de AppIndicator se empaqueta en `helpers/`; `tools/` se
  reserva para herramientas de desarrollo excluidas del paquete.

- Indicadores: controles decimales leídos como `double`, sin reescribir ajustes
  durante el renderizado del formulario.
- Selector: se evita añadir el mismo grupo de preferencias a dos páginas y se
  reconoce el UUID del Dock Aurea para la integración de visibilidad.

## Verificación

```bash
./aurea.sh check
bash tests/extension-pack-shell.sh
bash tests/stack-shell.sh
```

Las pruebas usan bus, configuración y GNOME headless propios. Nunca activan
control inseguro en la sesión habitual. El controlador de carga se sustituye
solo en la prueba para no ejecutar pkexec ni escribir límites reales de batería.
Se comprueban carga, dos ciclos de activación/desactivación, recarga del tema,
ventanas de preferencias y carga conjunta del stack. Esto no certifica cada
combinación de hardware, periféricos o todas las animaciones de los efectos.

Acceso y bloqueo se unifican posteriormente bajo `aurea-lock-screen@local`;
la receta del README migra la antigua Aurea Login a una instalación global única.
