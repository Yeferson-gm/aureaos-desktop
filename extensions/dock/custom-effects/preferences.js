import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';

export function buildAppearancePage(settings, window) {
    const page = new Adw.PreferencesPage({title: 'Aurea', icon_name: 'preferences-desktop-appearance-symbolic'});
    const appearance = new Adw.PreferencesGroup({title: 'Material', description: 'Los cambios se muestran en el Dock. El alto contraste del sistema tiene prioridad.'});
    const motion = new Adw.PreferencesGroup({title: 'Movimiento', description: 'Se respeta el ajuste de animaciones del sistema. La respuesta indica suavizado, no duración total.'});
    page.add(appearance);
    page.add(motion);
    const switches = (group, rows) => {
        for (const [key, title] of rows) {
            const row = new Adw.SwitchRow({title});
            settings.bind(key, row, 'active', Gio.SettingsBindFlags.DEFAULT);
            group.add(row);
        }
    };
    switches(appearance, [['glass-shelf', 'Vidrio'], ['single-running-dot', 'Un punto por aplicación abierta']]);
    switches(motion, [['magnify-icons', 'Ampliar al pasar el cursor'], ['launch-bounce', 'Rebote breve al abrir']]);
    const theme = new Adw.ComboRow({title: 'Aspecto', model: Gtk.StringList.new(['Sistema', 'Claro', 'Oscuro'])});
    const themes = ['auto', 'light', 'dark'];
    theme.selected = themes.indexOf(settings.get_string('material-theme'));
    theme.connect('notify::selected', () => settings.set_string('material-theme', themes[theme.selected]));
    const id = settings.connect('changed::material-theme', () => { theme.selected = themes.indexOf(settings.get_string('material-theme')); });
    window.connect('close-request', () => { settings.disconnect(id); return false; });
    appearance.add(theme);
    const slider = (group, key, title, lower, upper, step, digits) => {
        const row = new Adw.ActionRow({title});
        const adjustment = new Gtk.Adjustment({lower, upper, step_increment: step, page_increment: step * 5});
        const scale = new Gtk.Scale({orientation: Gtk.Orientation.HORIZONTAL, adjustment, digits, draw_value: true, width_request: 200, valign: Gtk.Align.CENTER});
        settings.bind(key, adjustment, 'value', Gio.SettingsBindFlags.DEFAULT);
        row.add_suffix(scale);
        row.activatable_widget = scale;
        group.add(row);
    };
    slider(appearance, 'glass-blur', 'Desenfoque', 0, 80, 1, 0);
    slider(motion, 'magnification-max-scale', 'Ampliación máxima', 1, 2, 0.05, 2);
    slider(motion, 'magnification-response-ms', 'Respuesta del suavizado (ms)', 40, 220, 5, 0);
    const reset = (group, keys) => {
        const row = new Adw.ActionRow({title: 'Restaurar este grupo'});
        const button = new Gtk.Button({label: 'Restaurar', valign: Gtk.Align.CENTER});
        button.connect('clicked', () => { for (const key of keys) settings.reset(key); });
        row.add_suffix(button);
        group.add(row);
    };
    reset(appearance, ['glass-shelf', 'glass-blur', 'single-running-dot', 'material-theme']);
    reset(motion, ['magnify-icons', 'magnification-max-scale', 'magnification-response-ms', 'launch-bounce']);
    return page;
}

