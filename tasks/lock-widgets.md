# Bloqueo y widgets: diseño Aurea

1. Investigar referencias oficiales de macOS 27, registrar procedencia y elegir fondo estático WhiteSur.
2. Añadir componente lock-screen: reloj superior, usuario inferior, material y transición; conservar diálogo, verificador y políticas nativas. Probar en Shell aislado; no bloquear la sesión habitual.
3. Unificar widgets: tipografía, jerarquía, bordes, materiales, tamaños y movimiento reducido; conservar datos, posiciones y funciones.
4. Probar todos los widgets con datos sintéticos, tamaños y temas, controles de edición, fotos y batería. Comprobar recorte de vidrio y ausencia de bucles de animación innecesarios.
5. Documentar controles, instalación, reversión y diferencias de plataforma. Etiquetar y aplicar solo los componentes afectados.

La fidelidad se contrasta con referencias; no se promete identidad del motor gráfico, San Francisco ni servicios exclusivos de Apple. El bloqueo no modifica GDM, PAM, contraseña ni políticas de seguridad.

## Resultado

Pasos 1–4 completados. Referencias documentadas; bloqueo probado a 1280×800 y
1280×720, con teclado y restauración. Matriz de 78 widgets, galería, edición y
foco correctos en compositor aislado. Recorte por píxeles: cero cambios exteriores
en widgets normales, redimensionados y girados; dock en reposo y ampliado también
sin píxeles exteriores. `aurea.sh check`: 25 pruebas más sintaxis, esquemas, CSS y
25276 enlaces. Se mantiene sin probar el acceso PAM con una contraseña real.

Entrega: paquete 0.4.0 para lock-screen, widgets y dock (módulo de recorte común).
No se cambian los ajustes ni los archivos personales. El compositor habitual
cargará el código nuevo al volver a iniciar sesión. No se publica en remoto.
