

export function clamp(value, lower, upper) {
    return Math.min(Math.max(value, lower), upper);
}

export function magnificationLevel(distance, radius) {
    if (radius <= 0 || distance >= radius)
        return 0;


    return (Math.cos(distance * Math.PI / radius) + 1) / 2;
}

export function magnifiedScale(maximum, level) {
    return 1 + (Math.max(1, maximum) - 1) * clamp(level, 0, 1);
}



export function boundedScale(scale, imageExtent, slotExtent) {
    if (imageExtent <= 0 || slotExtent <= 0) return 1;
    return clamp(scale, 1, Math.max(1, (slotExtent - 2) / imageExtent));
}




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



export function settleToward(current, target, elapsedMs, responseMs) {
    if (responseMs <= 0 || elapsedMs <= 0)
        return elapsedMs <= 0 ? current : target;

    const progress = 1 - Math.exp(-elapsedMs / responseMs);
    return current + (target - current) * progress;
}

export function springToward(current, velocity, target, elapsedMs, responseMs) {
    if (elapsedMs <= 0) return {value: current, velocity};
    if (responseMs <= 0) return {value: target, velocity: 0};
    const elapsed = Math.min(elapsedMs, 64) / 1000;
    const frequency = 2000 / responseMs;
    const offset = current - target;
    const impulse = velocity + frequency * offset;
    const decay = Math.exp(-frequency * elapsed);
    return {value: target + (offset + impulse * elapsed) * decay,
        velocity: (velocity - frequency * impulse * elapsed) * decay};
}




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
