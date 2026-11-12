import St from 'gi://St';
import Clutter from 'gi://Clutter';
import Pango from 'gi://Pango';

export const MODULES = [
    ['home', 'Inicio', 'go-home-symbolic'],
    ['music', 'Música', 'audio-x-generic-symbolic'],
    ['files', 'Archivos', 'folder-symbolic'],
    ['clip', 'Portapapeles', 'edit-paste-symbolic'],
    ['notes', 'Notas y tareas', 'document-edit-symbolic'],
    ['system', 'Sistema', 'utilities-system-monitor-symbolic'],
    ['clock', 'Temporizador', 'alarm-symbolic'],
    ['today', 'Calendario', 'x-office-calendar-symbolic'],
    ['notifications', 'Notificaciones', 'preferences-system-notifications-symbolic'],
    ['mirror', 'Cámara', 'camera-web-symbolic'],
    ['tools', 'Herramientas', 'applications-utilities-symbolic'],
];

export class IslandWorkspace {
    constructor(island) {
        this.island = island;
        this.cards = [];
    }

    buildHome() {
        const e = this.island;
        const page = e._newPage('home');
        page.add_style_class_name('di-dashboard');
        this.date = e._label('', 'di-dashboard-date');
        page.add_child(this.date);
        this.cardsBox = new St.BoxLayout({vertical: true, style_class: 'di-dashboard-cards'});
        page.add_child(this.cardsBox);
        this.liveBox = new St.BoxLayout({vertical: true, style_class: 'di-live-list'});
        page.add_child(this.liveBox);
        this.rebuild();
    }

    rebuild() {
        if (!this.cardsBox) return;
        const e = this.island;
        this.cardsBox.destroy_all_children();
        this.cards = [];
        const selected = [...new Set(e._settings.get_strv('home-modules'))]
            .filter(id => MODULES.some(m => m[0] === id && id !== 'home')).slice(0, 3);
        for (const [index, id] of selected.entries()) {
            const [, name, icon] = MODULES.find(m => m[0] === id);
            const card = new St.Button({style_class: `di-dashboard-card ${index === 0 ? 'di-dashboard-featured' : ''}`,
                reactive: true, can_focus: true, x_expand: true, accessible_name: name});
            const row = new St.BoxLayout({style_class: 'di-dashboard-row'});
            row.add_child(new St.Icon({icon_name: icon, icon_size: index === 0 ? 30 : 20, y_align: Clutter.ActorAlign.CENTER}));
            const column = new St.BoxLayout({vertical: true, x_expand: true, style_class: 'di-dashboard-column'});
            column.add_child(e._label(name, 'di-dashboard-caption'));
            const title = e._label('', index === 0 ? 'di-dashboard-title' : 'di-dashboard-detail', {width: 270});
            title.clutter_text.set_ellipsize(Pango.EllipsizeMode.END);
            column.add_child(title);
            row.add_child(column);
            row.add_child(new St.Icon({icon_name: 'go-next-symbolic', icon_size: 12, y_align: Clutter.ActorAlign.CENTER}));
            card.set_child(row);
            card.connect('clicked', () => e._selectTab(id));
            this.cardsBox.add_child(card);
            this.cards.push({id, title});
        }
        if (!selected.length) this.cardsBox.add_child(e._label('Elige tus tarjetas en Ajustes → Espacio personal.', 'di-hint'));
        this.refresh();
    }

    refresh() {
        if (!this.date) return;
        const e = this.island;
        this.date.text = new Date().toLocaleDateString('es', {weekday: 'long', day: 'numeric', month: 'long'});
        const details = {
            music: e._name ? `${e._status === 'Playing' ? '▶' : 'Ⅱ'}  ${e._title?.text ?? 'Música'}` : 'Tu música, a un toque',
            clock: e._tm.running ? `${Math.ceil(e._timerLeft() / 60000)} min restantes` : 'Un momento para concentrarte',
            system: e._bat ? `${e._bat.pct}% · ${[1, 5].includes(e._bat.state) ? 'Cargando' : 'Batería'}` : 'Estado de tu equipo',
            files: `${e._shelf.length} elementos en tu estante`,
            clip: `${e._clips.length} elementos · ${e._cfg.private ? 'Captura pausada' : 'Historial local'}`,
            notes: `${(e._tasks ?? []).filter(t => !t.done).length} tareas pendientes`,
            notifications: `${e._notificationEntries().length} notificaciones`,
            today: e._nextMeeting?.summary ?? 'Tu agenda y el tiempo',
            mirror: 'Comprueba tu cámara cuando lo necesites',
            tools: 'Acciones rápidas y utilidades',
        };
        for (const {id, title} of this.cards) title.text = details[id] ?? 'Abrir';
        this.liveBox.destroy_all_children();
        for (const activity of e._live.entries.slice(0, 3)) {
            const button = e._chip(activity.text, () => e._selectTab(activity.page), activity.icon);
            button.add_style_class_name('di-live-item');
            this.liveBox.add_child(button);
        }
    }

    buildLibrary() {
        const e = this.island;
        const page = e._newPage('library');
        page.add_style_class_name('di-library');
        const search = new St.Entry({style_class: 'di-search', hint_text: 'Buscar una herramienta…', can_focus: true});
        page.add_child(search);
        const list = new St.BoxLayout({vertical: true, style_class: 'di-library-list'});
        page.add_child(list);
        const render = () => {
            list.destroy_all_children();
            const query = search.text.toLocaleLowerCase('es');
            let row;
            let index = 0;
            for (const [id, name, icon] of MODULES.filter(m => m[0] !== 'home' && m[1].toLocaleLowerCase('es').includes(query))) {
                if (index++ % 2 === 0) { row = new St.BoxLayout({style_class: 'di-library-row'}); list.add_child(row); }
                const button = e._chip(name, () => e._selectTab(id), icon);
                button.width = 182;
                button.add_style_class_name('di-library-tile');
                row.add_child(button);
            }
            if (!index) list.add_child(e._label('No se encontraron herramientas.', 'di-hint'));
            e._resizeIsland();
        };
        search.clutter_text.connect('text-changed', render);
        page.add_child(e._chip('Personalizar este espacio', () => { e._closeIsland(); e.openPreferences(); }, 'preferences-system-symbolic'));
        render();
    }
}
