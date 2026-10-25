import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source = readFileSync(new URL('../extension.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../stylesheet.css', import.meta.url), 'utf8');

assert.match(source, /\['notifications',\s*'preferences-system-notifications-symbolic'\]/,
    'La isla debe exponer una pestaña nativa de notificaciones');
assert.match(source, /Main\.messageTray\.getSources\(\)/,
    'La sección debe leer las fuentes nativas de GNOME Shell');
assert.match(source, /'notification-added'/,
    'La sección debe actualizarse cuando llega una notificación');
assert.match(source, /_buildNotificationsPage\(\)/,
    'La pestaña debe construir su página de contenido');
assert.match(source, /_renderNotifications\(\)/,
    'La lista debe poder volver a renderizarse al cambiar');
assert.match(source, /_clearNotifications\(\)/,
    'La sección debe permitir limpiar las notificaciones');
assert.match(css, /\.di-notification-row\s*\{/,
    'Las notificaciones deben reutilizar el lenguaje visual de la isla');

console.log('Isla dinámica: sección de notificaciones verificada.');
