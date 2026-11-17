# Isla de favoritas y GNOME 51

Solicitud aprobada: implementar los 34 puntos de docs/isla-aplicaciones-evaluacion.md y compatibilidad del stack con GNOME 51.

- [x] Datos migrables, categorías, perfiles y preferencias.
- [x] Panel, organización, búsqueda, acciones y recursos.
- [x] Apertura, animaciones, materiales, accesibilidad y monitores.
- [x] Pruebas de modelo y Shell aislado, capturas de diseño.
- [x] Auditoría y adaptación de las API retiradas en GNOME 51 en todo el stack.
- [x] Prueba del stack en Fedora 45/GNOME 51 aislado, GDM incluido.
- [x] Documentación, entrega Git e instalación compatible con 50 y 51.
- [x] El usuario actualizó Fedora/GNOME; verificado GNOME 51.1 local.

## Incidencia posterior al reinicio

La comprobación inicial de archivos comparaba enlaces sin validar su resolución.
Se confirmó un fallo de empaquetado, no de preferencias: siete extensiones no
podían importar módulos compartidos. Construcción e instalación pasan a exigir
archivos autocontenidos; se añade regresión y prueba del paquete en Shell privado.
