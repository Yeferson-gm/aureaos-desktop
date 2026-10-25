// Pure math kept separate so it can be tested without a running GNOME Shell.

export function clamp(value, lower, upper) {
    return Math.min(Math.max(value, lower), upper);
}

export function magnificationLevel(distance, radius) {
    if (radius <= 0 || distance >= radius)
        return 0;

    // Raised cosine: no visual corner at either the peak or its fall-off edge.
    return (Math.cos(distance * Math.PI / radius) + 1) / 2;
}

export function magnifiedScale(maximum, level) {
    return 1 + (Math.max(1, maximum) - 1) * clamp(level, 0, 1);
}

// Each image stays inside its fixed slot horizontally. No neighbour offsets
// or changing anchor: only upward growth for a bottom dock.
export function boundedScale(scale, imageExtent, slotExtent) {
    if (imageExtent <= 0 || slotExtent <= 0) return 1;
    return clamp(scale, 1, Math.max(1, (slotExtent - 2) / imageExtent));
}

// The transformed visual grows equally from both sides of its allocation.
// Keeping this calculation separate makes the hit area match the actual
// painted extent instead of an arbitrary oversized box.
export function iconOverflow(iconSize, scale) {
    return Math.max(0, iconSize * (Math.max(1, scale) - 1) / 2);
}

export function pointInExpandedBox(box, x, y, isHorizontal, padding) {
    if (isHorizontal) {
        return x >= box.x1 && x <= box.x2 &&
            y >= box.y1 - padding && y <= box.y2 + padding;
    }

    return y >= box.y1 && y <= box.y2 &&
        x >= box.x1 - padding && x <= box.x2 + padding;
}

// Exponential smoothing is independent of frame rate: a 60 Hz and a 144 Hz
// display converge with the same visual response time.
export function settleToward(current, target, elapsedMs, responseMs) {
    if (responseMs <= 0 || elapsedMs <= 0)
        return elapsedMs <= 0 ? current : target;

    const progress = 1 - Math.exp(-elapsedMs / responseMs);
    return current + (target - current) * progress;
}

// extraExtents contain the visual width/height added by magnification. The
// selected icon remains anchored; every neighbour moves just enough to retain
// its gap with the next enlarged icon.
export function distributeOffsets(extraExtents, anchorIndex) {
    const offsets = new Array(extraExtents.length).fill(0);
    if (anchorIndex < 0 || anchorIndex >= extraExtents.length)
        return offsets;

    for (let index = anchorIndex - 1; index >= 0; index--) {
        offsets[index] = offsets[index + 1] -
            (extraExtents[index] + extraExtents[index + 1]) / 2;
    }
    for (let index = anchorIndex + 1; index < extraExtents.length; index++) {
        offsets[index] = offsets[index - 1] +
            (extraExtents[index] + extraExtents[index - 1]) / 2;
    }
    return offsets;
}
