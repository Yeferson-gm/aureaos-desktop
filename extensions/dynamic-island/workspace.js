import St from 'gi://St';
import Clutter from 'gi://Clutter';
import Pango from 'gi://Pango';

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
    ['tools', 'Herramientas', 'applications-utilities-symbolic'],
    ['studio', 'Estudio', 'audio-input-microphone-symbolic'],
    ['agents', 'Asistentes', 'utilities-terminal-symbolic'],
    ['applications', 'Aplicaciones', 'view-app-grid-symbolic'],
];

export class IslandWorkspace {
    constructor(island) {
        this.island = island;
        this.cards = [];
        this.peekSignature = null;
    }

    buildHome() {
        const e = this.island;
        const page = e._newPage('home');
        page.add_style_class_name('di-dashboard');
        this.date = e._label('', 'di-dashboard-date');
        page.add_child(this.date);
        this.cardsBox = new St.BoxLayout({style_class: 'di-glance-row', x_expand: true});
        page.add_child(this.cardsBox);
        this.preview = new St.BoxLayout({orientation: Clutter.Orientation.VERTICAL, style_class: 'di-glance-preview'});
        page.add_child(this.preview);
        const shortcuts = new St.BoxLayout({style_class: 'di-home-shortcuts', x_expand: true});
        for (const [id, title, icon] of [['files', 'Estante', 'folder-symbolic'], ['system', 'Equipo', 'computer-symbolic'], ['agents', 'Asistentes', 'utilities-terminal-symbolic']]) {
            const action = new St.Button({style_class: 'di-home-shortcut', reactive: true, can_focus: true, x_expand: true, accessible_name: title});
            const content = new St.BoxLayout({orientation: Clutter.Orientation.VERTICAL, style_class: 'di-home-shortcut-content'});
            content.add_child(new St.Icon({icon_name: icon, icon_size: 22, x_align: Clutter.ActorAlign.CENTER}));
            content.add_child(e._label(title, 'di-dashboard-caption'));
            action.set_child(content); action.connect('clicked', () => e._selectTab(id));
            shortcuts.add_child(action);
        }
        page.add_child(shortcuts);
        this.liveBox = new St.BoxLayout({orientation: Clutter.Orientation.VERTICAL, style_class: 'di-live-list'});
        page.add_child(this.liveBox);
        this.rebuild();
    }

    rebuild() {
        if (!this.cardsBox) return;
        const e = this.island;
        this.cardsBox.destroy_all_children();
        this.cards = [];
        this.peekSignature = null;
        const selected = [...new Set(e._settings.get_strv('home-modules'))]
            .filter(id => MODULES.some(m => m[0] === id && id !== 'home')).slice(0, 3);
        for (const id of selected) {
            const [, name, icon] = MODULES.find(m => m[0] === id);
            const card = new St.Button({style_class: 'di-glance-card', reactive: true, can_focus: true, track_hover: true, x_expand: true, accessible_name: name});
            const content = new St.BoxLayout({orientation: Clutter.Orientation.VERTICAL, style_class: 'di-glance-content'});
            content.add_child(new St.Icon({icon_name: icon, icon_size: 24, x_align: Clutter.ActorAlign.CENTER}));
            content.add_child(e._label(name, 'di-dashboard-caption'));
            const title = e._label('', 'di-glance-summary', {width: 100}); title.clutter_text.set_ellipsize(Pango.EllipsizeMode.END); content.add_child(title);
            card.set_child(content); card.connect('clicked', () => e._selectTab(id));
            card.connect('notify::hover', () => {
                if (this.hoverTimer) e._clear(this.hoverTimer);
                this.hoverTimer = 0;
                if (card.hover) this.hoverTimer = e._timeout(220, () => { this.hoverTimer = 0; if (card.hover && e._tab === 'home') { this.peekId = id; this.renderPeek(); e._resizeIsland(); } return false; });
            });
            card.connect('key-focus-in', () => { this.peekId = id; this.renderPeek(); });
            this.cardsBox.add_child(card); this.cards.push({id, title, card});
        }
        this.peekId = selected.includes(this.peekId) ? this.peekId : selected[0];
        if (!selected.length) this.cardsBox.add_child(e._label('Elige tus tarjetas en Ajustes → Espacio personal.', 'di-hint'));
        this.refresh();
    }

    refresh() {
        if (!this.date) return;
        const e = this.island;
        this.date.text = new Date().toLocaleDateString('es', {weekday: 'long', day: 'numeric', month: 'long'});
        const details = {
            music: e._name ? `${e._status === 'Playing' ? '▶' : 'Ⅱ'}  ${e._title?.text ?? 'Música'}` : 'Sin reproducción',
            clock: e._tm.running ? `${Math.ceil(e._timerLeft() / 60000)} min restantes` : 'Un momento para concentrarte',
            system: e._bat ? `${e._bat.pct}% · ${[1, 5].includes(e._bat.state) ? 'Cargando' : 'Batería'}` : 'Estado de tu equipo',
            files: `${e._shelf.length} elementos en tu estante`,
            clip: `${e._clips.length} elementos · ${e._cfg.private ? 'Captura pausada' : 'Historial local'}`,
            notes: `${(e._tasks ?? []).filter(t => !t.done).length} tareas pendientes`,
            notifications: `${e._notificationEntries().length} notificaciones`,
            weather: e._weather ? `${Math.round(e._weather.w.temperature_2m)}° · ${e._weather.city}` : 'Consultar el tiempo',
            today: e._nextMeeting ? `${e._nextMeeting.summary} · ${e._nextMeeting.allDay ? 'Todo el día' : `en ${Math.max(0, Math.ceil((e._nextMeeting.date - Date.now()) / 60000))} min`}` : 'Sin próximos eventos',
            studio: 'Dictado local y teleprompter',
            agents: `${e._agents?.items.size ?? 0} tareas locales`,
            mirror: 'Comprueba tu cámara cuando lo necesites',
            tools: 'Acciones rápidas y utilidades',
        };
        for (const {id, title} of this.cards) title.text = details[id] ?? 'Abrir';
        this.renderPeek();
        this.liveBox.destroy_all_children();
        for (const activity of e._live.entries.filter(item => !this.cards.some(card => card.id === item.page)).slice(0, 3)) {
            const button = e._chip(activity.text, () => e._selectTab(activity.page), activity.icon);
            button.add_style_class_name('di-live-item');
            this.liveBox.add_child(button);
        }
    }

    renderPeek() {
        if (!this.preview) return;
        const e = this.island, id = this.peekId;
        const signature = JSON.stringify([id, e._title?.text, e._artist?.text, e._status, e._weatherAt, e._nextMeeting?.summary, e._bat?.pct, e._shelf?.length]);
        if (signature === this.peekSignature) return;
        this.peekSignature = signature;
        this.preview.destroy_all_children();
        for (const card of this.cards) card.id === id ? card.card.add_style_class_name('di-glance-selected') : card.card.remove_style_class_name('di-glance-selected');
        if (!id) return;
        const text = value => { const actor = e._label(value, 'di-dashboard-detail', {width: 370}); actor.clutter_text.set_line_wrap(true); this.preview.add_child(actor); };
        if (id === 'music') {
            text(e._name ? e._title?.text ?? 'Reproduciendo' : 'Tu música aparecerá aquí');
            this.preview.add_child(e._label(e._artist?.text ?? 'Abre un reproductor compatible', 'di-hint'));
            const controls = new St.BoxLayout({style_class: 'di-glance-actions'});
            for (const [method, icon, name] of [['Previous', 'media-skip-backward-symbolic', 'Anterior'], ['PlayPause', e._status === 'Playing' ? 'media-playback-pause-symbolic' : 'media-playback-start-symbolic', 'Reproducir o pausar'], ['Next', 'media-skip-forward-symbolic', 'Siguiente']]) {
                const control = e._chip(name, () => e._command(method), icon); control.reactive = !!e._name; control.opacity = e._name ? 255 : 90; controls.add_child(control);
            }
            this.preview.add_child(controls);
        } else if (id === 'today') {
            text(e._nextMeeting?.summary ?? 'Sin próximos eventos');
            if (e._nextMeeting) this.preview.add_child(e._label(e._nextMeeting.allDay ? 'Todo el día' : new Date(e._nextMeeting.date).toLocaleTimeString('es', {hour: '2-digit', minute: '2-digit'}), 'di-hint'));
        } else if (id === 'weather') {
            const weather = e._weather;
            text(weather ? `${weather.city} · ${Math.round(weather.w.temperature_2m)}°` : 'El tiempo se actualizará al abrir Clima');
            if (weather) this.preview.add_child(e._label(`Sensación ${Math.round(weather.w.apparent_temperature)}° · Humedad ${weather.w.relative_humidity_2m}%`, 'di-hint'));
        } else if (id === 'files') text(`${e._shelf.length} archivos en tu estante. Abre, copia o comparte desde Archivos.`);
        else if (id === 'system') text(e._bat ? `Batería ${e._bat.pct}% · ${[1, 5].includes(e._bat.state) ? 'Cargando' : 'En uso'}` : 'Consulta el estado y rendimiento del equipo');
        else text(MODULES.find(m => m[0] === id)?.[1] ?? 'Abrir herramienta');
        this.preview.add_child(e._chip('Ver detalles', () => e._selectTab(id), 'go-next-symbolic'));
    }

    buildWeather() {
        const e = this.island, page = e._newPage('weather');
        this.weatherBody = new St.BoxLayout({orientation: Clutter.Orientation.VERTICAL, style_class: 'di-weather-detail'}); page.add_child(this.weatherBody);
        page.add_child(e._chip('Actualizar tiempo', () => e._loadWeather(true), 'view-refresh-symbolic'));
        page.add_child(e._label('Open-Meteo · ubicación aproximada por IP; Lima como respaldo', 'di-hint'));
        this.renderWeather();
    }

    renderWeather() {
        if (!this.weatherBody) return;
        const e = this.island, data = e._weather;
        this.weatherBody.destroy_all_children();
        if (!data) { this.weatherBody.add_child(e._label('Sin datos de clima. Comprueba la conexión y pulsa Actualizar.', 'di-hint', {width: 370})); return; }
        const current = data.w;
        this.weatherBody.add_child(e._label(data.city || 'Tu ubicación', 'di-dashboard-title'));
        this.weatherBody.add_child(e._label(`${Math.round(current.temperature_2m)}°`, 'di-weather-large'));
        this.weatherBody.add_child(e._label(`Sensación ${Math.round(current.apparent_temperature)}° · Viento ${Math.round(current.wind_speed_10m)} km/h`, 'di-hint'));
        const hours = data.hourly?.time ?? [];
        const first = Math.max(0, hours.findIndex(time => time >= String(current.time).slice(0, 13) + ':00'));
        if (hours.length) {
            this.weatherBody.add_child(e._label('Próximas horas', 'di-dashboard-caption'));
            const row = new St.BoxLayout({style_class: 'di-weather-hours'});
            for (let i = first; i < Math.min(first + 6, hours.length); i++) {
                const cell = new St.BoxLayout({orientation: Clutter.Orientation.VERTICAL, x_expand: true, style_class: 'di-weather-hour'});
                cell.add_child(e._label(hours[i].slice(11, 16), 'di-hint'));
                cell.add_child(e._label(`${Math.round(data.hourly.temperature_2m[i])}°`, 'di-dashboard-detail'));
                cell.add_child(e._label(`${data.hourly.precipitation_probability[i] ?? 0}%`, 'di-hint')); row.add_child(cell);
            }
            this.weatherBody.add_child(row);
        }
        const days = data.daily?.time ?? [];
        for (let i = 0; i < Math.min(5, days.length); i++) {
            const row = new St.BoxLayout({style_class: 'di-weather-day'});
            const day = e._label(new Date(days[i] + 'T12:00:00').toLocaleDateString('es', {weekday: 'long'}), 'di-hint', {x_expand: true}); row.add_child(day);
            row.add_child(e._label(`${Math.round(data.daily.temperature_2m_min[i])}° — ${Math.round(data.daily.temperature_2m_max[i])}°`, 'di-dashboard-detail')); this.weatherBody.add_child(row);
        }
        if (e._tab === 'weather') e._resizeIsland();
    }

    buildLibrary() {
        const e = this.island;
        const page = e._newPage('library');
        page.add_style_class_name('di-library');
        const search = new St.Entry({style_class: 'di-search', hint_text: 'Buscar una herramienta…', can_focus: true});
        page.add_child(search);
        const list = new St.BoxLayout({orientation: Clutter.Orientation.VERTICAL, style_class: 'di-library-list'});
        page.add_child(list);
        const render = () => {
            list.destroy_all_children();
            const query = search.text.toLocaleLowerCase('es');
            let row;
            let index = 0;
            for (const [id, name, icon] of MODULES.filter(m => m[0] !== 'home' && (m[0] !== 'applications' || e._settings.get_boolean('app-launcher')) && m[1].toLocaleLowerCase('es').includes(query))) {
                if (index++ % 2 === 0) { row = new St.BoxLayout({style_class: 'di-library-row'}); list.add_child(row); }
                const button = e._chip(name, () => e._selectTab(id), icon);
                button.width = 182;
                button._label.width = 134;
                button._label.clutter_text.set_ellipsize(Pango.EllipsizeMode.END);
                button.add_style_class_name('di-library-tile');
                row.add_child(button);
            }
            if (!index) list.add_child(e._label('No se encontraron herramientas.', 'di-hint'));
            e._resizeIsland();
        };
        search.clutter_text.connect('text-changed', render);
        e._connect(e._settings, 'changed::app-launcher', render);
        page.add_child(e._chip('Personalizar este espacio', () => { e._closeIsland(); e.openPreferences(); }, 'preferences-system-symbolic'));
        render();
    }
}
