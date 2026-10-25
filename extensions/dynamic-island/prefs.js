import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import {ExtensionPreferences} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class IslandPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();
        window.set_default_size(660, 680);
        const page = new Adw.PreferencesPage({title: 'Isla dinámica', icon_name: 'preferences-system-symbolic'});
        window.add(page);
        const group = (title, description) => {
            const g = new Adw.PreferencesGroup({title, description});
            page.add(g);
            return g;
        };
        const toggle = (g, key, title, subtitle = '') => {
            const row = new Adw.SwitchRow({title, subtitle});
            settings.bind(key, row, 'active', 0);
            g.add(row);
        };
        const number = (g, key, title, lower, upper, step) => {
            const row = new Adw.SpinRow({title, adjustment: new Gtk.Adjustment({lower, upper,
                step_increment: step, page_increment: step * 2}), digits: step < 1 ? 2 : 0});
            settings.bind(key, row, 'value', 0);
            g.add(row);
        };
        const choices = (g, key, title, values, labels) => {
            const row = new Adw.ComboRow({title, model: Gtk.StringList.new(labels)});
            row.selected = Math.max(0, values.indexOf(settings.get_string(key)));
            row.connect('notify::selected', () => settings.set_string(key, values[row.selected]));
            g.add(row);
        };
        const appearance = group('Apariencia', 'Superficie nativa, tipografía del sistema y escalado de GNOME.');
        choices(appearance, 'theme', 'Tema', ['dark', 'glass'], ['Apple Dark', 'Apple Glass']);
        number(appearance, 'opacity', 'Opacidad', 0.65, 1, 0.05);
        const behavior = group('Animaciones y comportamiento', 'Las animaciones respetan también la preferencia de movimiento reducido del sistema.');
        toggle(behavior, 'animations', 'Animaciones suaves');
        toggle(behavior, 'hover-open', 'Abrir al pasar el cursor');
        number(behavior, 'hover-delay', 'Espera del cursor (ms)', 200, 1500, 50);
        toggle(behavior, 'auto-close', 'Cerrar al salir de la isla', 'Solo cuando se abrió al pasar el cursor.');
        toggle(behavior, 'hide-fullscreen', 'Ocultar en pantalla completa');
        const navigation = group('Navegación', 'Super + Mayús + Espacio abre o cierra la isla. Alt + flechas cambia de pestaña.');
        choices(navigation, 'initial-page', 'Página inicial',
            ['home', 'music', 'files', 'notes', 'system', 'clock', 'today', 'notifications'],
            ['Inicio', 'Música', 'Archivos', 'Notas', 'Sistema', 'Temporizador', 'Calendario', 'Notificaciones']);
        toggle(navigation, 'show-home-music', 'Música en Inicio');
        toggle(navigation, 'show-home-system', 'Batería en Inicio');
        toggle(navigation, 'show-home-activities', 'Actividades en Inicio');
        const media = group('Multimedia', 'El selector de Música permite elegir entre los reproductores MPRIS disponibles.');
        const player = new Adw.EntryRow({title: 'Reproductor preferido (nombre MPRIS; vacío = automático)'});
        settings.bind('preferred-player', player, 'text', 0);
        media.add(player);
        toggle(media, 'cover-accent', 'Color ambiental de la portada');
        toggle(media, 'timer-sound', 'Sonido al terminar el temporizador');
        const privacy = group('Privacidad y avisos', 'Los avisos respetan No molestar. El historial del portapapeles se controla desde su pestaña.');
        toggle(privacy, 'notification-events', 'Avisos breves en la cápsula');
        toggle(privacy, 'private-previews', 'Ocultar títulos de notificaciones en la cápsula');
        number(privacy, 'event-duration', 'Duración de los avisos (ms)', 1000, 8000, 500);
    }
}
