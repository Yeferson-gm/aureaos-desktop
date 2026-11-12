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
        choices(appearance, 'shape', 'Contorno', ['attached', 'floating'], ['Unido al borde', 'Cápsula flotante']);
        number(appearance, 'corner-radius', 'Radio de las esquinas', 4, 32, 1);
        number(appearance, 'notch-width', 'Ancho compacto', 240, 420, 10);
        number(appearance, 'monitor', 'Pantalla: −1 principal; 0 primera; 1 segunda', -1, 15, 1);
        const behavior = group('Animaciones y comportamiento', 'Las animaciones respetan también la preferencia de movimiento reducido del sistema.');
        toggle(behavior, 'animations', 'Animaciones suaves');
        toggle(behavior, 'gestures', 'Gestos locales', 'Rueda vertical: actividades; horizontal: pistas; Mayús + rueda: volumen; clic derecho: descartar aviso.');
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
        const space = group('Espacio personal', 'Hasta tres tarjetas en Inicio y dos accesos principales. Los demás módulos siguen disponibles en Más.');
        for (const [key, title, limit] of [['home-modules', 'Tarjetas de Inicio', 3], ['pinned-modules', 'Accesos principales', 2]]) {
            const row = new Adw.ExpanderRow({title});
            space.add(row);
            const modules = [['music', 'Música'], ['files', 'Archivos'], ['clip', 'Portapapeles'], ['notes', 'Notas y tareas'],
                ['system', 'Sistema'], ['clock', 'Temporizador'], ['today', 'Calendario'], ['notifications', 'Notificaciones'],
                ['mirror', 'Cámara'], ['tools', 'Herramientas']];
            for (const [id, name] of modules) {
                const item = new Adw.ActionRow({title: name});
                const enabled = new Gtk.Switch({valign: Gtk.Align.CENTER, active: settings.get_strv(key).includes(id)});
                const move = new Gtk.Button({icon_name: 'go-up-symbolic', valign: Gtk.Align.CENTER, tooltip_text: 'Mover al principio'});
                const sync = () => {
                    const list = settings.get_strv(key);
                    enabled.active = list.includes(id);
                    enabled.sensitive = enabled.active || list.length < limit;
                    move.sensitive = enabled.active && list[0] !== id;
                    item.subtitle = enabled.active ? `Posición ${list.indexOf(id) + 1}` : 'Disponible en Más';
                };
                enabled.connect('notify::active', () => {
                    const list = settings.get_strv(key);
                    if (enabled.active === list.includes(id)) return;
                    settings.set_strv(key, enabled.active ? [...list, id].slice(0, limit) : list.filter(value => value !== id));
                });
                move.connect('clicked', () => settings.set_strv(key, [id, ...settings.get_strv(key).filter(value => value !== id)]));
                const signal = settings.connect(`changed::${key}`, sync);
                window.connect('close-request', () => { settings.disconnect(signal); return false; });
                item.add_suffix(move);
                item.add_suffix(enabled);
                row.add_row(item);
                sync();
            }
        }
        const resetSpace = new Adw.ActionRow({title: 'Restaurar organización inicial'});
        const resetButton = new Gtk.Button({label: 'Restaurar', valign: Gtk.Align.CENTER});
        resetButton.connect('clicked', () => { settings.reset('home-modules'); settings.reset('pinned-modules'); });
        resetSpace.add_suffix(resetButton);
        space.add(resetSpace);
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
