export const MODULES = [
    ['home', 'Inicio', 'go-home-symbolic'],
    ['music', 'Música', 'audio-x-generic-symbolic'],
    ['files', 'Archivos', 'folder-symbolic'],
    ['clip', 'Portapapeles', 'edit-paste-symbolic'],
    ['notes', 'Notas y tareas', 'document-edit-symbolic'],
    ['system', 'Sistema', 'computer-symbolic'],
    ['clock', 'Temporizador', 'alarm-symbolic'],
    ['today', 'Calendario', 'x-office-calendar-symbolic'],
    ['weather', 'Clima', 'weather-clear-symbolic'],
    ['notifications', 'Notificaciones', 'preferences-system-notifications-symbolic'],
    ['mirror', 'Cámara', 'camera-web-symbolic'],
    ['tools', 'Controles rápidos', 'applications-utilities-symbolic'],
    ['downloads', 'Descargas', 'folder-download-symbolic'],
    ['world', 'Relojes del mundo', 'preferences-system-time-symbolic'],
    ['devices', 'Pantallas y discos', 'video-display-symbolic'],
    ['studio', 'Estudio', 'audio-input-microphone-symbolic'],
    ['agents', 'Asistentes', 'utilities-terminal-symbolic'],
    ['applications', 'Aplicaciones', 'view-app-grid-symbolic'],
];

export const HOME_LIMIT = 6;
export function homeModules(ids) {
    return [...new Set(ids)].filter(id => MODULES.some(module => module[0] === id && id !== 'home')).slice(0, HOME_LIMIT);
}
export function placeModule(ids, id, before = null) {
    const current = homeModules(ids);
    if (!homeModules([id]).length || id === before || (!current.includes(id) && current.length >= HOME_LIMIT)) return current;
    const next = current.filter(value => value !== id);
    const index = next.indexOf(before);
    next.splice(index < 0 ? next.length : index, 0, id);
    return next;
}
