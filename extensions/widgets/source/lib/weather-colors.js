const PALETTES = {
    sol: {day: ['#0969c8', '#1879ac'], night: ['#173d89', '#24619d']},
    parcial: {day: ['#0969c8', '#1879ac'], night: ['#173d89', '#24619d']},
    nublado: {day: ['#3769aa', '#327a9f'], night: ['#253e7b', '#32638f']},
    lluvia: {day: ['#1b589d', '#08779b'], night: ['#163c87', '#09628b']},
    tormenta: {day: ['#454096', '#4264a7'], night: ['#35256f', '#415394']},
    nieve: {day: ['#346cab', '#23799e'], night: ['#254b89', '#286b97']},
    niebla: {day: ['#456a94', '#3b7797'], night: ['#314779', '#3b638b']},
};

export function weatherColors(kind, night = false) {
    const palette = PALETTES[kind] ?? PALETTES.nublado;
    return [...palette[night ? 'night' : 'day']];
}

export const WEATHER_SECONDARY_ALPHA = 0.96;
