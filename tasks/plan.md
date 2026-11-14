# Barra superior: implementación aprobada

Especificación: los 56 puntos de `docs/investigacion-topbar.md`.
Conservar UUID, JSON y colores elegidos; no alterar la isla ni otros diseños.

## Orden y aceptación

1. Configuración validada y preferencias: migración aditiva, vista previa, guardar/restaurar, pruebas de datos inválidos.
2. Materiales y movimiento: blur recortado y pausado, sombra, paleta semántica, cierre seguro, interrupciones y movimiento reducido.
3. Centro de Control: módulos configurables, toggle separado, subvistas, energía/carga/audio y estado real de operaciones.
4. Barra y comandos: orden/visibilidad, overflow/notch, autohide, reloj, acciones publicadas y atajos fiables.
5. Pruebas: puntero/teclado, matrices visuales, monitores/escalas, 100 interrupciones, ciclo de vida y mediciones.
6. Entrega: documentación de cobertura, comprobación general, etiqueta Git nueva, paquete e instalación solo topbar.

Cada bloque se prueba y se guarda en un commit. Dependencias: configuración → UI → integración → validación → instalación.
No exigir hardware inexistente ni presentar un servicio simulado como real. Las pruebas usan su propio bus y Shell.

## Riesgos

St/Clutter no implementa APIs de AppKit ni CSS de navegador. Verificar GNOME 50 local.
El blur de vídeo necesita presupuesto medido. Los menús globales dependen de acciones que la aplicación publique.
Se conserva el control manual de color y la geometría del notch. No cerrar sesión del usuario.


## Acceso GDM según referencia del usuario

- Fondo WhiteSur claro a color, perfil superior y contraseña nativa compacta.
- Tres acciones inferiores de GNOME, conservando selector, teclado y accesibilidad.
- Integración root exclusiva de GDM, activación y retirada reversibles mediante dconf.
- Pruebas en Shell privado a 1280×800 y 1024×600, acciones simuladas sin PAM.
- Instalar sin cerrar sesión ni reiniciar GDM; validación visual real pendiente del
  siguiente acceso voluntario del usuario.
