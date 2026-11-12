export const MODULES = {
    wifi: 'Wi-Fi', bluetooth: 'Bluetooth', brightness: 'Brillo', sound: 'Sonido',
    microphone: 'Micrófono', power: 'Energía', battery: 'Cuidado de batería',
    focus: 'No molestar', night: 'Luz nocturna', appearance: 'Aspecto',
    airplane: 'Modo avión', caffeine: 'Mantener despierto', privacy: 'Privacidad',
    displays: 'Pantallas', vpn: 'VPN', ethernet: 'Ethernet', screenshot: 'Captura',
};
export const INDICATORS = {
    privacy: 'Privacidad', keyboard: 'Teclado', battery: 'Batería', wifi: 'Wi-Fi',
    bluetooth: 'Bluetooth', sound: 'Sonido', search: 'Buscar', cc: 'Centro de control', clock: 'Fecha y hora',
};
export const DEFAULTS = {
    texto: 'auto', colorTexto: null, colorIconos: null, temaMenus: 'auto', animacionMs: 180,
    material: 'glass', blur: 18, opacity: 0.72, accent: '#3584e4', spacing: 6,
    reducedMotion: false, contrast: false, adaptiveContrast: false,
    clockFormat: 'system', clockDate: true, clockSeconds: false, shortcuts: 'linux',
    autohide: 'never', menuIcons: 'selective',
    modules: ['wifi', 'bluetooth', 'brightness', 'sound', 'power', 'battery', 'focus', 'night', 'appearance', 'privacy', 'screenshot'],
    sizes: {}, indicators: Object.keys(INDICATORS), visibility: {},
};
const choices = (value, options, fallback) => options.includes(value) ? value : fallback;
const number = (v, low, high, fallback) => Number.isFinite(v) ? Math.min(high, Math.max(low, v)) : fallback;
export function color(value) {
    if (typeof value !== 'string') return null;
    const v = value.trim();
    if (/^#(?:[\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/i.test(v)) return v;
    const match = v.match(/^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*(0(?:\.\d+)?|1(?:\.0+)?))?\s*\)$/);
    return match && match.slice(1, 4).every(x => Number(x) <= 255) ? v : null;
}
const ordered = (value, allowed, fallback) => Array.isArray(value)
    ? [...new Set(value.filter(x => typeof x === 'string' && x in allowed))] : [...fallback];
export function normalizeConfig(input = {}) {
    const raw = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
    const out = {...DEFAULTS};
    for (const key of ['texto', 'temaMenus']) out[key] = choices(raw[key], ['auto', 'claro', 'oscuro'], DEFAULTS[key]);
    for (const key of ['colorTexto', 'colorIconos']) out[key] = color(raw[key]);
    for (const key of ['reducedMotion', 'contrast', 'adaptiveContrast', 'clockDate', 'clockSeconds'])
        out[key] = typeof raw[key] === 'boolean' ? raw[key] : DEFAULTS[key];
    out.animacionMs = number(raw.animacionMs, 0, 250, DEFAULTS.animacionMs);
    out.blur = number(raw.blur, 0, 30, DEFAULTS.blur);
    out.opacity = number(raw.opacity, 0.55, 1, DEFAULTS.opacity);
    out.spacing = number(raw.spacing, 3, 12, DEFAULTS.spacing);
    out.accent = color(raw.accent) ?? DEFAULTS.accent;
    out.material = choices(raw.material, ['glass', 'solid'], DEFAULTS.material);
    out.clockFormat = choices(raw.clockFormat, ['system', '12h', '24h'], DEFAULTS.clockFormat);
    out.shortcuts = choices(raw.shortcuts, ['linux', 'mac'], DEFAULTS.shortcuts);
    out.autohide = choices(raw.autohide, ['never', 'fullscreen', 'always'], DEFAULTS.autohide);
    out.menuIcons = choices(raw.menuIcons, ['selective', 'none'], DEFAULTS.menuIcons);
    out.modules = ordered(raw.modules, MODULES, DEFAULTS.modules);
    out.indicators = ordered(raw.indicators, INDICATORS, DEFAULTS.indicators);
    for (const id of Object.keys(INDICATORS)) if (!out.indicators.includes(id)) out.indicators.push(id);
    out.visibility = {};
    for (const id of Object.keys(INDICATORS)) out.visibility[id] = choices(raw.visibility?.[id], ['always', 'active', 'never'], 'always');
    out.visibility.cc = 'always';
    out.sizes = {};
    for (const id of Object.keys(MODULES)) out.sizes[id] = choices(raw.sizes?.[id], ['small', 'wide'], ['sound', 'brightness', 'microphone'].includes(id) ? 'wide' : 'small');
    return out;
}
export function moveItem(items, id, delta) {
    const result = [...items], index = result.indexOf(id), to = index + delta;
    if (index >= 0 && to >= 0 && to < result.length) [result[index], result[to]] = [result[to], result[index]];
    return result;
}
export function availableWidth(monitorWidth, notchWidth = 0, rightWidth = 0) {
    return Math.max(100, Math.floor((monitorWidth - notchWidth) / 2) - 20 - Math.max(0, rightWidth - monitorWidth / 2));
}
