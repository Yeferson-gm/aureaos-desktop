import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import {ExtensionPreferences} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';
import {Config} from './configuration.js';
import {DEFAULTS, MODULES, INDICATORS, color, moveItem} from './settings-model.js';

export default class TopbarPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const config = new Config();
        window.set_default_size(720, 760);
        window.connect('close-request', () => { config.destroy(); return false; });
        const page = (title, icon) => { const p = new Adw.PreferencesPage({title, icon_name: icon}); window.add(p); return p; };
        const group = (p, title, description = '') => { const g = new Adw.PreferencesGroup({title, description}); p.add(g); return g; };
        const save = patch => {
            try { config.save(patch); }
            catch (error) { window.add_toast(new Adw.Toast({title: `No se pudo guardar: ${error.message}`})); }
        };
        const toggle = (g, key, title, subtitle = '') => {
            const row = new Adw.SwitchRow({title, subtitle, active: config.values[key]});
            row.connect('notify::active', () => save({[key]: row.active})); g.add(row);
        };
        const combo = (g, key, title, values, labels) => {
            const row = new Adw.ComboRow({title, model: Gtk.StringList.new(labels), selected: Math.max(0, values.indexOf(config.values[key]))});
            row.connect('notify::selected', () => save({[key]: values[row.selected]})); g.add(row);
        };
        const spin = (g, key, title, lower, upper, step) => {
            const row = new Adw.SpinRow({title, digits: step < 1 ? 2 : 0,
                adjustment: new Gtk.Adjustment({lower, upper, step_increment: step, page_increment: step * 2}), value: config.values[key]});
            row.connect('notify::value', () => save({[key]: row.value})); g.add(row);
        };
        const appearance = page('Apariencia', 'applications-graphics-symbolic');
        const visual = group(appearance, 'Tu barra, tu fondo', 'Los cambios se aplican al guardar. El color de la barra es independiente del de los paneles.');
        combo(visual, 'texto', 'Texto de la barra', ['auto', 'claro', 'oscuro'], ['Según el sistema', 'Blanco', 'Negro']);
        for (const [key, title] of [['colorTexto', 'Color de texto'], ['colorIconos', 'Color de iconos'], ['accent', 'Color de selección']]) {
            const row = new Adw.EntryRow({title, text: config.values[key] ?? '', show_apply_button: true});
            row.connect('apply', () => {
                const value = row.text.trim();
                if (value && !color(value)) { window.add_toast(new Adw.Toast({title: 'Usa un color hexadecimal o rgb/rgba válido'})); return; }
                save({[key]: value || null});
            }); visual.add(row);
        }
        combo(visual, 'temaMenus', 'Tema de los paneles', ['auto', 'claro', 'oscuro'], ['Según el sistema', 'Claro', 'Oscuro']);
        combo(visual, 'material', 'Material', ['glass', 'solid'], ['Vidrio', 'Sólido']);
        spin(visual, 'blur', 'Desenfoque', 0, 30, 1);
        spin(visual, 'opacity', 'Opacidad de la superficie', 0.55, 1, 0.05);
        spin(visual, 'spacing', 'Separación de indicadores', 3, 12, 1);
        toggle(visual, 'contrast', 'Contraste aumentado');
        toggle(visual, 'adaptiveContrast', 'Adaptar al fondo', 'Se aplica solo con texto automático y sin colores personalizados.');
        const motion = group(appearance, 'Movimiento', 'El teclado y la preferencia de animaciones de GNOME tienen prioridad.');
        spin(motion, 'animacionMs', 'Entrada de paneles (ms)', 0, 250, 10);
        toggle(motion, 'reducedMotion', 'Reducir movimiento');
        const preview = group(appearance, 'Vista previa en el escritorio', 'Abre el Centro de Control para comparar tus cambios sobre tu fondo real.');
        const reset = new Adw.ActionRow({title: 'Restaurar apariencia', subtitle: 'Conserva módulos, orden y datos'});
        const resetButton = new Gtk.Button({label: 'Restaurar', valign: Gtk.Align.CENTER});
        resetButton.connect('clicked', () => {
            const keys = ['texto', 'colorTexto', 'colorIconos', 'temaMenus', 'material', 'blur', 'opacity', 'accent', 'spacing', 'contrast', 'adaptiveContrast', 'animacionMs', 'reducedMotion'];
            save(Object.fromEntries(keys.map(k => [k, DEFAULTS[k]])));
            window.add_toast(new Adw.Toast({title: 'Apariencia restaurada. Reabre Ajustes para actualizar los campos.'}));
        }); reset.add_suffix(resetButton); preview.add(reset);
        const behavior = page('Barra', 'view-more-symbolic');
        const clock = group(behavior, 'Comportamiento');
        combo(clock, 'autohide', 'Ocultar automáticamente', ['never', 'fullscreen', 'always'], ['Nunca', 'En pantalla completa', 'Siempre']);
        combo(clock, 'clockFormat', 'Hora', ['system', '12h', '24h'], ['Según GNOME', '12 horas', '24 horas']);
        toggle(clock, 'clockDate', 'Mostrar fecha'); toggle(clock, 'clockSeconds', 'Mostrar segundos');
        combo(clock, 'shortcuts', 'Símbolos de atajos', ['linux', 'mac'], ['Teclas reales de Linux', 'Símbolos Mac (⌘ representa Ctrl)']);
        combo(clock, 'menuIcons', 'Iconos de menús', ['selective', 'none'], ['Solo acciones destacadas', 'Sin iconos decorativos']);
        const arrange = (p, collection, names, title) => {
            const g = group(p, title, 'Usa las flechas para ordenar. Los controles no disponibles indican su dependencia.');
            let rows = [];
            const build = () => {
                rows.forEach(r => g.remove(r)); rows = [];
                const order = [...config.values[collection], ...Object.keys(names).filter(id => !config.values[collection].includes(id))];
                for (const id of order) {
                    const row = new Adw.ActionRow({title: names[id]}); rows.push(row); g.add(row);
                    const controls = new Gtk.Box({spacing: 4, valign: Gtk.Align.CENTER});
                    for (const [icon, delta, tip] of [['go-up-symbolic', -1, 'Mover arriba'], ['go-down-symbolic', 1, 'Mover abajo']]) {
                        const button = new Gtk.Button({icon_name: icon, tooltip_text: tip});
                        button.connect('clicked', () => { save({[collection]: moveItem(config.values[collection], id, delta)}); build(); }); controls.append(button);
                    }
                    if (collection === 'modules') {
                        const size = new Gtk.DropDown({model: Gtk.StringList.new(['Compacto', 'Ancho']), selected: config.values.sizes[id] === 'wide' ? 1 : 0});
                        size.connect('notify::selected', () => save({sizes: {...config.values.sizes, [id]: size.selected ? 'wide' : 'small'}})); controls.append(size);
                        const on = new Gtk.Switch({active: config.values.modules.includes(id), valign: Gtk.Align.CENTER});
                        on.connect('notify::active', () => save({modules: on.active ? [...config.values.modules, id] : config.values.modules.filter(x => x !== id)})); controls.append(on);
                    } else {
                        const values = ['always', 'active', 'never'];
                        const select = new Gtk.DropDown({model: Gtk.StringList.new(['Siempre', 'Cuando está activo', 'Oculto']), selected: values.indexOf(config.values.visibility[id]), sensitive: id !== 'cc'});
                        select.connect('notify::selected', () => save({visibility: {...config.values.visibility, [id]: values[select.selected]}})); controls.append(select);
                    }
                    row.add_suffix(controls);
                }
            }; build();
        };
        arrange(behavior, 'indicators', INDICATORS, 'Indicadores y orden');
        arrange(page('Controles', 'preferences-system-symbolic'), 'modules', MODULES, 'Tu Centro de Control');
    }
}
