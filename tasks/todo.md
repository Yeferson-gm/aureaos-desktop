# Barra superior Aurea

- [x] Configuración y preferencias (1, 5, 7, 9, 12, 16, 28, 45).
- [x] Materiales y movimiento (10–27, 47).
- [x] Controles y detalles (29–38, 46, 48, 50).
- [x] Barra, menús y rendimiento (2–8, 39–44, 49, 51, 56).
- [x] Matriz de pruebas y revisión (52–54).
- [x] Documentación, revisión de Git y procedimiento de entrega verificable (55).

Validación: GNOME 50 aislado, temas claro/oscuro, escalas 100/125/150/200 %, dos
monitores con escalas mixtas, texto 150/200 %, 720p, isla real, entrada virtual,
acciones D-Bus y 100 interrupciones. Límites físicos documentados en
`docs/topbar-experiencia.md`. La entrega se construye desde etiqueta y se instala con `--component=topbar`;
`--check` compara el destino con el paquete, sin modificar otros componentes.

## Corrección del orden y Cafeína

- [x] Integrar los indicadores externos antes de la fecha y reservar el último puesto al reloj.
- [x] Añadir Cafeína a los controles predeterminados sin sobrescribir listas personalizadas.
- [x] Regresión validada en GNOME aislado y comprobación general superada; entrega por etiqueta e instalación exclusiva de topbar.
