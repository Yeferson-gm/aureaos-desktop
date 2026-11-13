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

## Micrófono y altura del notch

- [x] Incluir micrófono en los módulos predeterminados conservando configuraciones personalizadas.
- [x] Ajustar el notch unido al borde a la altura de la barra, conservando ancho y panel expandido.
- [x] Comprobación general: 25 pruebas, esquemas y CSS; integración GNOME aislada con tres deslizadores y cambios de altura.
- [x] Clic, segundo clic, clic derecho, Enter, Espacio y Escape validados en sesión aislada. El primer intento no entregó eventos del puntero virtual; la repetición independiente recibió el clic y pasó.

## Dock: movimiento, material e interacción

- [x] Movimiento reducido y rebote acotado, con limpieza de actores destruidos.
- [x] Material claro/oscuro, alto contraste y preferencias en vivo por grupo.
- [x] Arrastre y menús suspenden la lente; corrección de opacidad y límites del monitor.
- [x] Vidrio por transformaciones: 0 cambios de asignación en el barrido frente a 85 antes; 0 cuadros de lente en reposo.
- [x] Clics, arrastre, ventanas, minimizar/restaurar, ocultamiento/revelado, preferencias y dos monitores 125/100 % verificados.
- [x] Comprobación general y revisión de límites en docs/dock-uso.md.
