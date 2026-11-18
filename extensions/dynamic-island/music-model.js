const text = value => typeof value === 'string' ? value.trim().slice(0, 1000) : '';

export function trackInfo(metadata = {}) {
    if (!metadata || typeof metadata !== 'object') metadata = {};
    const title = text(metadata['xesam:title']);
    const artist = Array.isArray(metadata['xesam:artist'])
        ? metadata['xesam:artist'].map(text).filter(Boolean).join(', ') : text(metadata['xesam:artist']);
    const album = text(metadata['xesam:album']);
    const rawUrl = text(metadata['xesam:url']);
    const url = /^(https?:\/\/|file:\/\/|spotify:)/i.test(rawUrl) ? rawUrl : '';
    const key = title ? JSON.stringify(url ? ['url', url] : ['track', title, artist, album]) : '';
    return {key, title, artist, album, url};
}

export function cleanFavorites(value) {
    if (!Array.isArray(value)) return [];
    const entries = new Map();
    for (const item of value) {
        if (!item || typeof item !== 'object') continue;
        const track = trackInfo({'xesam:title': item.title, 'xesam:artist': item.artist,
            'xesam:album': item.album, 'xesam:url': item.url});
        if (track.key && !entries.has(track.key)) entries.set(track.key, track);
        if (entries.size >= 200) break;
    }
    return [...entries.values()];
}

export function playbackRates(props) {
    if (props.CanControl === false || !Number.isFinite(props.Rate)) return [];
    return [0.5, 0.75, 1, 1.25, 1.5, 2].filter(rate => rate >= props.MinimumRate && rate <= props.MaximumRate);
}

export function repeatLabel(loop) {
    return {None: 'Repetir: desactivado', Playlist: 'Repetir: lista', Track: 'Repetir: esta canción'}[loop] ?? 'Repetir: desactivado';
}
