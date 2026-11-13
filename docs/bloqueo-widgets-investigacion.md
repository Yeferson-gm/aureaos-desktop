# Referencias de bloqueo y widgets

Investigación realizada el 12 de noviembre de 2026.

## Referencias contrastadas

- [macOS 27 Golden Gate, Apple](https://www.apple.com/os/macos/): refinamiento de Liquid Glass y legibilidad. No se usa un concepto de vídeo como especificación oficial.
- [Widgets, Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/widgets): información breve, márgenes coordinados con las esquinas, jerarquía tipográfica, colores semánticos y transiciones de actualización. La guía recomienda evitar texto demasiado pequeño; sus medidas son puntos de Apple, no una equivalencia automática con píxeles GNOME.
- [WidgetKit: apariencia acentuada y Liquid Glass](https://developer.apple.com/documentation/widgetkit/optimizing-your-widget-for-accented-rendering-mode-and-liquid-glass): fondos claros/tintados y agrupación del contenido; conservar color donde identifica contenido multimedia.
- [Widgets en macOS 27, soporte Apple](https://support.apple.com/en-ie/guide/mac-help/mchl52be5da5/27/mac/27): tamaños y edición por widget.
- [Guía visual de bloqueo en macOS 27 y Tahoe](https://macwall.app/blog/how-to-change-lock-screen-on-mac): reloj grande configurable y perfil de usuario. Es una referencia secundaria, no una especificación técnica de Apple.
- [GNOME Shell 50.6: UnlockDialog](https://github.com/GNOME/gnome-shell/blob/50.6/js/ui/unlockDialog.js): contratos locales para presentación, fondos y transición. Se conserva su verificador de usuario.

## Decisiones de Aurea

Bloqueo: fecha sobre un reloj grande, centrados arriba; usuario y campo inferior;
fondo estático con ajuste de recorte por monitor. El reloj permanece durante la
transición nativa. Las notificaciones conservan las políticas y controles de GNOME.
No se implementa una pantalla falsa que capture contraseñas ni se cambia GDM/PAM.

Widgets: misma familia tipográfica disponible en Fedora, jerarquía de títulos,
valores y pies; bordes y sombras contenidos; material claro/oscuro legible;
contenido ajustado al tamaño y animaciones breves que respeten accesibilidad.
Fotos conserva el llenado con recorte, no bandas. Se mantienen funciones y datos.

La equivalencia exacta con AppKit, SF Symbols, San Francisco y los shaders privados
de Apple no se afirma. Se usa Adwaita Sans disponible en Fedora, sin descargar ni
redistribuir fuentes propietarias. La aplicación de escritorio y los servicios
siguen siendo los de GNOME; los tamaños personalizados del usuario se conservan.

## Procedencia del fondo

`extensions/lock-screen/assets/WhiteSur-dark.jpg`, 3840×2160, procede de
[WhiteSur-wallpapers](https://github.com/vinceliuice/WhiteSur-wallpapers), revisión
`5c1d7ca20b8de0a7efe443792c19e49277262e02`, ruta `4k/WhiteSur-dark.jpg`.
Se incluye `LICENSE.WhiteSur` (MIT, Copyright 2022 Vince). El fichero local anterior
llamado background.png era un recurso transparente de 1×1, no este fondo.
La imagen se utiliza únicamente en el bloqueo de la sesión, sin cambiar el vídeo
ni las preferencias del escritorio. No hay descargas al bloquear.

## Capturas elegidas por el usuario

Las tres referencias aportadas durante el desarrollo combinan un bloqueo móvil
con reloj fino, una composición editorial de fecha/clima y widgets compactos
con cabecera roja y cuatro relojes. Se toman como dirección visual elegida, sin
atribuirlas a una captura oficial de macOS 27. Aurea adapta esa jerarquía al
escritorio: no añade accesos móviles sin función ni duplica apps como widgets.
El reloj fino se renderiza como texto legible, sin simular un shader de contorno
transparente. El calendario conserva eventos, feriados y navegación.

## Verificación

`extensions/lock-screen/tests/smoke.sh` crea un UnlockDialog en un compositor
privado: comprueba fondo por monitor, transición, teclado y restauración. El
campo de prueba es sintético; no introduce contraseñas ni prueba PAM contra una
cuenta real. La sesión habitual no se bloquea ni reinicia.

`extensions/widgets/tools/test-shell.sh` comprueba los 13 widgets en S/M/L y
claro/oscuro (78 combinaciones), controles de edición, galería, foco de medidas,
movimiento reducido y ciclo de vida. Los datos y fotos de prueba están aislados.
La comparación por píxeles verifica vidrio dentro del contorno antes/después de
redimensionar y durante rotación. El dock conserva su prueba independiente de
ampliación, resolución, indicadores, preferencias y esquinas.
