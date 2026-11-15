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

## Pack completo de extensiones

- Importar diez módulos de sus repositorios, fijando revisiones compatibles con
  GNOME 50: batería, cafeína, lámpara, ventanas, selector, cubo, privacidad,
  indicadores, tema Shell y desinstalación desde la cuadrícula.
- Marca Aurea y UUID propios; conservar esquemas, gettext, protocolos y licencias.
  Emoji Copy permanece independiente; Aurea Login permanece exclusivo de GDM.
- Migración de estados/preferencias y referencias del Centro de Control;
  corregir hojas CSS temporales que rompen User Themes al recargar el tema.
- Probar carga, descarga, recursos, preferencias y migraciones en GNOME aislado.
- Instalar pack completo; retirar los RPM redundantes solo tras comprobar sus
  sustitutos; documentar activación, recuperación y procedencia.

### Resultado de integración

Fuentes y licencias incorporados; UUID y esquemas comprobados. Pruebas generales,
preferencias, migración viva y carga/descarga del pack superadas en GNOME 50
privado. Batería simulada en pruebas para no escribir hardware. La entrega se
construye como versión Git y requiere un nuevo inicio de sesión para descubrir
los nuevos UUID. Emoji Copy y acceso GDM se conservan.

## Unificar acceso y bloqueo

Una sola identidad `aurea-lock-screen@local`, instalada globalmente cuando GDM
está personalizado. La entrada elige la presentación según el modo de sesión.
Migrar el perfil y manifiesto antiguos de GDM, retirar su UUID y la copia de
usuario una vez comprobada la instalación global. El instalador de usuario
verifica la copia global y no crea otra. Dash to Dock ya no está en disco;
GNOME conserva su entrada en memoria hasta un nuevo inicio de sesión.
