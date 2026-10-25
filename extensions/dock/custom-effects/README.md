# Efectos propios de macOS 27

Este directorio contiene únicamente código nuevo de la personalización.
No se modifican archivos de Dash to Dock hasta que cada efecto tenga una prueba
aislada y una ruta de desactivación.

Componentes:

1. `magnification-math.js`: curva de proximidad pura y testeable.
2. `actor-selection.js`: selecciona únicamente `_iconBin`. Las insignias,
   números, indicadores y resaltados mantienen su tamaño nativo.
3. `magnification.js`: seguimiento global del cursor y ampliación sincronizada
   con el compositor sin modificar el layout ni las zonas de clic del dock.

Dash to Dock conserva su estructura raíz porque sus módulos se importan entre
sí con rutas relativas. Sus funciones nativas de ventanas, favoritos,
accesibilidad y monitores no se reemplazan.

Corrección 24/10/2026: posiciones fijas, sin redistribución de vecinos al
cambiar de icono. La ampliación se limita al ancho disponible de cada celda
y se ancla abajo en el dock inferior. Se corrigen las coordenadas locales de
activación y el primer paso de animación para evitar un salto inicial.

Pruebas: `gjs -m tests/magnification-test.js`,
`node tests/glass-style-test.mjs` y `bash tests/smoke-magnification.sh`.
La última crea un GNOME aislado, comprueba límites, pivote y retorno al tamaño
original, y guarda una captura; no activa modo inseguro en la sesión habitual.
