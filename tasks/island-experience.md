# Isla dinámica: implementación aprobada

Alcance: los 48 puntos de `docs/investigacion-isla-dinamica.md`, incluidas las
alternativas visuales antes excluidas. Los recursos serán propios. Las opciones
dependientes de hardware o APIs deben declarar disponibilidad y no simular éxito.
No se habilitarán exposición de datos en bloqueo ni captura de cámara/micrófono
automática. La aprobación del diseño no sustituye disponibilidad técnica.

## Entregas

- [x] Base: animación por frame clock, estados y actividades persistentes, cierre y monitores.
- [x] Diseño: navegación reducida, inicio contextual, módulos configurables, materiales y variantes.
- [x] Interacción: gestos locales, teclado, arrastre de archivos y estante visual.
- [x] Productividad: avisos, filtros, música, reuniones, temporizador y portapapeles.
- [x] Opcionales: letras, cámara, dictado, teleprompter, agentes y audio real con detección de capacidades.
- [x] Validación: pruebas unitarias, sesión GNOME aislada, capturas, interrupciones y recursos.
- [x] Entrega: documentación de funciones y límites, empaquetado y flujo de instalación por componente probado en destino aislado.

Se mantienen UUID, rutas y datos existentes. No se cierra la sesión principal.
Cada entrega probada se guarda en un commit local; no publicar cambios incompletos.

Cobertura y límites detallados en `docs/isla-dinamica-uso.md` y
`docs/isla-dinamica-validacion.md`. Se probaron escalas virtuales 125/150/200 %. Las comprobaciones físicas, FPS/GPU y
arrastres entre todas las aplicaciones no se consideran completadas por el smoke test.
