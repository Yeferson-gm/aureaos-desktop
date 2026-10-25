// Lente de ampliación estilo macOS (puro, sin dependencias de GNOME Shell).
//
// Cada icono a distancia d del cursor se amplía con s(d) = 1 + (M - 1) * nivel(d)
// (coseno elevado). El desplazamiento de su centro es la integral de (s - 1):
// así el icono bajo el cursor no se mueve, los vecinos se separan de forma
// continua y el dock «se ensancha» como en macOS, sin saltos entre iconos.

// Desplazamiento extra acumulado a distancia `distance` del cursor.
export function lensExtra(distance, radius, maxScale) {
    const k = Math.max(1, maxScale) - 1;
    if (k === 0 || radius <= 0 || distance <= 0)
        return 0;
    const m = Math.min(distance, radius);
    return k * (m / 2 + radius * Math.sin(Math.PI * m / radius) / (2 * Math.PI));
}

// Desplazamiento firmado (hacia fuera del cursor) para un centro `center`.
export function lensOffset(center, pointer, radius, maxScale) {
    const delta = center - pointer;
    return Math.sign(delta) * lensExtra(Math.abs(delta), radius, maxScale);
}
