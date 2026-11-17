const clamp = value => Math.min(100, Math.max(0, value));
export function cpuSnapshot(text) {
    const values = text.split('\n')[0].trim().split(/\s+/).slice(1, 9).map(Number);
    if (values.length < 8 || values.some(v => !Number.isFinite(v))) return null;
    return {total: values.reduce((sum, v) => sum + v, 0), idle: values[3] + values[4]};
}
export function cpuUsage(previous, current) {
    if (!previous || !current || current.total <= previous.total) return null;
    return clamp(100 * (1 - (current.idle - previous.idle) / (current.total - previous.total)));
}
export function memorySnapshot(text) {
    const fields = Object.fromEntries([...text.matchAll(/^(\w+):\s+(\d+)/gm)].map(([, name, value]) => [name, Number(value) * 1024]));
    if (!(fields.MemTotal > 0) || !Number.isFinite(fields.MemAvailable)) return null;
    return {total: fields.MemTotal, used: Math.max(0, fields.MemTotal - fields.MemAvailable), available: fields.MemAvailable,
        cached: (fields.Cached ?? 0) + (fields.SReclaimable ?? 0), swap: Math.max(0, (fields.SwapTotal ?? 0) - (fields.SwapFree ?? 0))};
}
export function networkSnapshot(text) {
    return Object.fromEntries(text.split('\n').filter(line => line.includes(':')).map(line => {
        const [name, raw] = line.split(':'); const values = raw.trim().split(/\s+/).map(Number);
        return [name.trim(), {rx: values[0], tx: values[8]}];
    }).filter(([name, value]) => name !== 'lo' && Number.isFinite(value.rx) && Number.isFinite(value.tx)));
}
export function networkRate(previous, current, seconds) {
    if (!previous || !(seconds > 0)) return null;
    return Object.entries(current).reduce((rate, [name, value]) => {
        const old = previous[name];
        if (old) { rate.rx += Math.max(0, value.rx - old.rx) / seconds; rate.tx += Math.max(0, value.tx - old.tx) / seconds; }
        return rate;
    }, {rx: 0, tx: 0});
}
export function appendSample(history, value, limit = 60) {
    return Number.isFinite(value) ? [...history, value].slice(-limit) : history;
}
export function calendarDays(date) {
    const first = new Date(date.getFullYear(), date.getMonth(), 1);
    const count = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    return [...Array((first.getDay() + 6) % 7).fill(null), ...Array.from({length: count}, (_, i) => i + 1)];
}
