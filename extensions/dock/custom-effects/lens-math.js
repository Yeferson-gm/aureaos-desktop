







export function lensExtra(distance, radius, maxScale) {
    const k = Math.max(1, maxScale) - 1;
    if (k === 0 || radius <= 0 || distance <= 0)
        return 0;
    const m = Math.min(distance, radius);
    return k * (m / 2 + radius * Math.sin(Math.PI * m / radius) / (2 * Math.PI));
}


export function lensOffset(center, pointer, radius, maxScale) {
    const delta = center - pointer;
    return Math.sign(delta) * lensExtra(Math.abs(delta), radius, maxScale);
}
