# Verificación de la consolidación

## Evidencia

- Importación inicial: 49.162 archivos/enlaces comparados con sus originales.
- Validación final: 189 archivos de código, 25.274 enlaces, 22 pruebas,
  esquemas GSettings y estilos St analizados sin errores.
- Carpetas: 1.107 alias de iconos consistentes; resolución GTK3 y GTK4 comprobada.
- GNOME aislado: las ocho extensiones Aurea cargan juntas y permanecen activas.
- Vídeo aislado: capa del overview, orden, entrada, ocultación y ciclo de vida pasan.
- Dock: ampliación, límites y restauración pasan; puntos y badges tienen regresiones.
- Barra: selección del Centro de Control, temas y ocultación del teclado nativo pasan.
- Isla dinámica: páginas, MPRIS, cierre, notificaciones y ciclo de vida pasan.
- Isla lateral: categorías, favoritos, cierre y recorte con dos monitores pasan.
- Instalador: destino temporal, conservación de preferencias, sustitución de enlaces,
  reinstalación y detección de contenido alterado comprobados.

## Límites conocidos

La prueba estricta de widgets completa sus 13 comprobaciones funcionales, pero
señala advertencias de Clutter sobre el foco del método de entrada. Se reprodujeron
con los fuentes anteriores a la migración; no se consideran corregidas ni se
excluyen del criterio estricto de esa prueba.

El compositor sin sesión de systemd también emite avisos de servicios del escritorio
y de renderizado. La carga conjunta confirma estado activo de las extensiones y
ausencia de errores JavaScript; no demuestra ausencia de todo aviso del compositor.
Las pruebas aisladas no sustituyen una revisión visual en la sesión habitual.

La primera prueba conjunta detectó que GNOME descargaba actualizaciones de la
tienda durante la inicialización, reemplazando los forks. El arnés marca la
comprobación inicial del compositor como realizada y los tres forks reciben UUID
propios con migración explícita. La prueba conjunta y la de vídeo pasan con estas
identidades. No se modificó el diseño para resolverlo.

La entrega se prepara para instalación explícita con `aurea.sh install`.
El repositorio no guarda datos personales, recursos sintéticos temporales ni
registros de la sesión del usuario. El paquete generado y sus hashes están en
`dist/`, fuera del historial. La sesión gráfica requiere salir y entrar después
de instalar para cargar todos los módulos e identificadores nuevos.

## Pack integrado de 19 componentes

- Comprobación general: 384 archivos de código, 25 278 enlaces y 28 archivos de
  pruebas, además de esquemas, CSS y pruebas de GDM/GRUB.
- GNOME 50 aislado: diez módulos importados junto a la barra, dos ciclos completos
  de activación/desactivación y recarga del tema sin hojas temporales huérfanas.
- Diez ventanas de preferencias construidas y mostradas sin avisos críticos.
  Se verificó que abrir Indicadores no cambia su valor decimal de brillo.
- Migración con D-Bus privado repetida dos veces: cambia un UUID de prueba,
  conserva los demás módulos y termina la desactivación antes de retirar archivos.
- Carga y descarga conjunta de los 19 componentes. El controlador de límites de
  batería está simulado exclusivamente en estas pruebas; no se escribe hardware.
- La nueva sesión real debe confirmar periféricos, límites de carga, vídeo y
  animaciones con las aplicaciones del usuario. No se fuerza cierre de sesión.
