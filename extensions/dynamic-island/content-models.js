export function parseLyrics(text) {
    const result = [];
    for (const line of String(text ?? '').slice(0, 100000).split('\n')) {
        const stamps = [...line.matchAll(/\[(\d{1,3}):(\d{2})(?:\.(\d{1,3}))?\]/g)];
        const words = line.replace(/\[[^\]]*\]/g, '').trim();
        for (const match of stamps) {
            const time = Number(match[1]) * 60 + Number(match[2]) + Number(`0.${match[3] ?? 0}`);
            result.push({time, text: words});
        }
    }
    return result.sort((a, b) => a.time - b.time);
}

export function currentLyric(lines, seconds) {
    let index = -1;
    for (let i = 0; i < lines.length && lines[i].time <= seconds; i++) index = i;
    return {index, previous: lines[index - 1]?.text ?? '', current: lines[index]?.text ?? '', next: lines[index + 1]?.text ?? ''};
}

export function meetingLink(event) {
    const text = [event.url, event.location, event.description, event.summary].filter(value => typeof value === 'string').join(' ');
    return text.match(/https:\/\/(?:[a-z0-9-]+\.)?(?:zoom\.us|meet\.google\.com|teams\.microsoft\.com|teams\.live\.com|webex\.com)\/[^\s<>"']+/i)?.[0] ?? null;
}

export function validateActivity(value) {
    if (!value || typeof value !== 'object' || !/^[\w.-]{1,64}$/.test(value.id ?? '')) return null;
    if (!['running', 'waiting', 'done', 'error'].includes(value.state)) return null;
    return {id: value.id, state: value.state, title: String(value.title ?? 'Actividad').slice(0, 120),
        detail: String(value.detail ?? '').slice(0, 300),
        progress: Number.isFinite(value.progress) ? Math.max(0, Math.min(1, value.progress)) : null};
}
