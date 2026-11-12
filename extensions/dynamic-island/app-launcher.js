import Shell from 'gi://Shell';
import St from 'gi://St';
import Clutter from 'gi://Clutter';
import Pango from 'gi://Pango';

export function buildAppLauncher(island) {
    const page = island._newPage('applications');
    const hint = island._label('Lanzador opcional. Puedes ocultarlo en Ajustes para usar solo el centro de aplicaciones.', 'di-hint', {width: 370});
    hint.clutter_text.set_line_wrap(true);
    page.add_child(hint);
    const search = new St.Entry({style_class: 'di-search', hint_text: 'Buscar aplicación…', can_focus: true});
    page.add_child(search);
    const list = new St.BoxLayout({vertical: true, style_class: 'di-library-list'});
    page.add_child(list);
    const system = Shell.AppSystem.get_default();
    const render = () => {
        list.destroy_all_children();
        if (!island._settings.get_boolean('app-launcher')) {
            list.add_child(island._label('Activa el lanzador opcional en Ajustes.', 'di-hint')); return;
        }
        const query = search.text.toLocaleLowerCase();
        const apps = system.get_installed().filter(info => info.should_show() &&
            info.get_display_name().toLocaleLowerCase().includes(query)).sort((a, b) => a.get_display_name().localeCompare(b.get_display_name()));
        let row;
        for (const [index, info] of apps.slice(0, 60).entries()) {
            if (index % 2 === 0) { row = new St.BoxLayout({style_class: 'di-library-row'}); list.add_child(row); }
            const button = new St.Button({style_class: 'di-library-tile', width: 182, can_focus: true, reactive: true,
                accessible_name: info.get_display_name()});
            const content = new St.BoxLayout({style_class: 'di-chip-row'});
            content.add_child(new St.Icon({gicon: info.get_icon(), icon_size: 24, y_align: Clutter.ActorAlign.CENTER}));
            const label = island._label(info.get_display_name(), '', {width: 128});
            label.clutter_text.set_ellipsize(Pango.EllipsizeMode.END);
            content.add_child(label); button.set_child(content);
            button.connect('clicked', () => {
                const app = system.lookup_app(info.get_id());
                if (app) { island._closeIsland(); app.activate(); }
            });
            row.add_child(button);
        }
        if (!apps.length) list.add_child(island._label('No se encontraron aplicaciones.', 'di-hint'));
        if (apps.length > 60) list.add_child(island._label('Mostrando 60 resultados. Escribe para filtrar.', 'di-hint'));
        island._resizeIsland();
    };
    search.clutter_text.connect('text-changed', render);
    island._connect(island._settings, 'changed::app-launcher', render);
    render();
}
