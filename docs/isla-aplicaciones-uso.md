# Isla de favoritas

Abrir desde el indicador del borde o con **Super+Alt+F**. Escape, el botón Cerrar
y un clic fuera cierran el panel. El borde compartido con otra pantalla se evita
cuando existe un borde exterior disponible; el recorte impide dibujar en el monitor
contiguo. Si ambos bordes están compartidos, utilizar el atajo.

## Organización

El panel muestra únicamente accesos elegidos. Añadir busca aplicaciones a partir
de dos letras, con ocho resultados como máximo. El buscador principal filtra por
nombre, alias y categoría. «Solo abiertas» filtra las favoritas.

Las categorías se proponen al añadir una aplicación. Se pueden crear, renombrar,
plegar, ordenar y eliminar conservando los accesos. Arrastrar entre categorías o
utilizar «Mover a», «Subir» y «Bajar» en el menú contextual. «Quitar» dispone de
Deshacer. Clic derecho o la tecla Menú abre las acciones; Tab y flechas permiten
navegar y Enter activa el control enfocado.

Fijar accesos rápidos es independiente de añadir favoritas. «Subir/Bajar en acceso
rápido» cambia su orden sin reorganizar las categorías. El botón del perfil permite
crear, seleccionar, renombrar y eliminar perfiles. «Abrir grupo» abre únicamente
los recursos marcados y muestra progreso y fallos.

Se admiten aplicaciones, rutas absolutas, `~/carpeta`, archivos y enlaces HTTP/HTTPS.
No se ejecutan comandos de shell introducidos como acceso. Las rutas ausentes se
notifican al abrir. Una aplicación no instalada se conserva identificada para que
el usuario pueda quitarla o reinstalarla. Las ventanas existentes se pueden elegir
desde las acciones; las vistas previas al hover son opcionales.

## Apariencia y datos

Ajustes aplica inmediatamente tema claro/oscuro/sistema, vidrio/sólido, lista o
cuadrícula, densidad, lado, monitor, espera, indicador y atajo. Alto contraste fuerza
material sólido. Las animaciones respetan la preferencia del sistema; el blur está
inactivo cuando el panel está cerrado. Restaurar apariencia y apertura son acciones
separadas y conservan la organización.

Los favoritos existentes se migran en `~/.local/share/side-dock/favoritos.json`.
El guardado es atómico y conserva la copia anterior. Un archivo inválido bloquea el
guardado para no destruirlo; importar una copia válida permite recuperarse. Importar
y exportar son acciones explícitas en Ajustes, con rutas absolutas y un límite de
2 MB. Se admiten hasta 20 perfiles, 60 categorías y 240 accesos por perfil.
Estos datos personales no se incluyen en Git.

La implementación cubre las funciones de la [evaluación](isla-aplicaciones-evaluacion.md).
El arrastre utiliza el mecanismo nativo de GNOME, sin ampliar los vecinos. No se
inventan insignias de notificaciones ni se garantiza restauración de pestañas o
proyectos de aplicaciones externas. Las pruebas de interacción y el alcance de
compatibilidad están en [GNOME 51](gnome51.md).
