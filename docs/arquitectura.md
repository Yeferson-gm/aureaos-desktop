# Arquitectura

Una única fuente por componente. Los antiguos instaladores autocontenidos
duplicaban miles de líneas; están preservados únicamente en el commit de
importación, no forman parte de la construcción actual.

Los fuentes de widgets permanecen en `extensions/widgets/source` y sus pruebas
en `tools`; los demás componentes tienen sus fuentes en la raíz del componente.
El tema incluye todas las variantes y recursos instalados; no es un pequeño
overlay de carpetas. Los SVG de carpetas usados por las herramientas son enlaces
a los recursos canónicos dentro de `theme/icons/Aurea27`.

## Identidad compatible

| Componente | Nombre visible | UUID técnico |
|---|---|---|
| topbar | Aurea 27 · Barra superior | lintel-v2@local |
| dock | Aurea 27 · Dock | macos27-dock@local |
| dynamic-island | Aurea 27 · Isla dinámica | dynamic-island-gnome50@local |
| app-island | Aurea 27 · Isla de aplicaciones | side-dock-gnome50@local |
| widgets | Aurea 27 · Widgets | lintel-widgets@local |
| lock-screen | Aurea 27 · Pantalla de bloqueo | aurea-lock-screen@local |
| live-wallpaper | Aurea 27 · Fondo animado | aurea-wallpaper@local |
| desktop-icons | Aurea 27 · Iconos del escritorio | aurea-desktop-icons@local |
| app-center | Aurea 27 · Centro de aplicaciones | aurea-app-center@local |

UUID, nombres D-Bus, gettext, esquemas GSettings, selectores CSS y rutas de datos
son contratos internos. Renombrarlos indiscriminadamente rompería integración,
traducciones, preferencias y detección de ventanas. No se confunden con la marca
visible ni con el número de versión. Las versiones de formato de datos tampoco
se reinician: eso alteraría la lectura de datos existentes.

Las extensiones de batería, cafeína, privacidad y efectos de terceros no
modificadas son dependencias externas, no se presentan como código propio.
Los tres forks que tenían UUID de la tienda reciben identificadores propios.
`stack.json` declara la migración de la lista de extensiones habilitadas y
deshabilitadas. Se mantienen esquemas y rutas de datos, conservando preferencias.
Así la tienda no sustituye Aurea por versiones del proveedor.

## Versión

`tools/version.mjs` exige una etiqueta `vMAJOR.MINOR.PATCH` en HEAD. El número de
GNOME se deriva como `MAJOR × 1000000 + MINOR × 1000 + PATCH`. Se validan los
límites y se rechaza un árbol sucio. Los metadatos de fuente no contienen una
versión; los de distribución se generan al construir.

## Comentarios

Los comentarios explicativos se trasladaron a `docs/code-notes` conservando
archivo y línea originales. Un parser comprobó igualdad de tokens ejecutables
antes y después. Se conservaron comentarios legales y directivas funcionales.
Docstrings y texto embebido no se eliminan ciegamente: pueden ser parte de la API
o del programa generado. Los documentos en `docs/history` describen el estado
anterior; sus referencias históricas no son instrucciones actuales de instalación.

## Presentación del bloqueo y materiales compartidos

`lock-screen` se ejecuta en los modos `user` y `unlock-dialog` de GNOME 50.
Decora el `UnlockDialog` nativo mediante `InjectionManager`: fondo estático,
layout, reloj y estilo. No sustituye el verificador ni el formulario nativo.
Al desactivarse restaura métodos, padre del reloj, layout y fondos. Las señales
del teclado se desconectan al destruir el diálogo o desactivar la extensión.
Si el teclado deja poco espacio, se ocultan reloj y notificaciones para dar
prioridad al formulario. No carga los widgets del escritorio durante el bloqueo.

`shared/rounded-clip.js` es la única fuente del recorte de framebuffer para dock
y widgets. Los enlaces de desarrollo apuntan dentro del repositorio; build copia
el módulo en cada paquete, sin dependencias entre extensiones instaladas. Cada
consumidor registra un GType distinto. La región se calcula solo al cambiar la
geometría: rectángulos redondeados alineados o contorno proyectado para rotación.
En widgets, el material se pinta después del desenfoque; editar y arrastrar usa
una capa aparte y no se recorta la barra de herramientas.

Los campos St.Entry de ajustes habilitan edición al recibir foco y la suspenden
al perderlo. Evita que Clutter publique la posición del cursor de campos sin
foco al pintarlos; el acceso por teclado y el foco real se verifican aislados.

## GDM: acceso antes de iniciar sesión

`integrations/login-screen` personaliza el recurso de tema del GDM del sistema;
no depende de las extensiones del usuario. El código de construcción conserva todos los
recursos y solo añade CSS de GDM a las variantes clara/oscura y un fondo estático.
Alto contraste queda intacto. El paquete incluye fuentes y recursos propios,
compilados contra el GNOME instalado cuando el administrador ejecuta `apply`.
La extensión de sistema `aurea-login-layout@local` se carga exclusivamente en GDM.
Ajusta las asignaciones del formulario nativo y presenta acciones `SystemActions`;
restaura métodos y señales al desactivar. No consulta ni sustituye el verificador
ni modifica PAM, servicios o políticas de autenticación. La activación se administra
con archivos propios de dconf en el perfil de GDM y un manifiesto reversible.


La política de teclado del acceso se comparte con `lock-screen`: intercepta la
apertura del teclado virtual solo en los modos GDM/bloqueado y restaura sus
métodos al desactivar. La configuración administrativa elimina el logo nativo y
la activación manual del teclado en el perfil GDM, sin cambiar PAM.

## Arranque Aurea 27

`integrations/boot-menu` incorpora el tema completo y su instalación administrativa
independiente. La copia activa se llama `Aurea27`; GRUB sigue siendo el motor de
arranque de Fedora. Se conservan BLS, UUID de discos y parámetros del kernel.
La entrada manual obsoleta se retira por título exacto; no se escanean ni modifican
particiones. Los respaldos por equipo quedan fuera del repositorio.
