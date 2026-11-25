import St from 'gi://St';
import Clutter from 'gi://Clutter';
import Pango from 'gi://Pango';

import {MODULES, homeModules} from './workspace-model.js';
import {WorkspaceEditor} from './workspace-editor.js';
export {MODULES} from './workspace-model.js';

export class IslandWorkspace {
    constructor(island) {
        this.island = island;
        this.cards = [];
        this.editor = new WorkspaceEditor(this);
        this.peekSignature = null;
    }

    buildHome() {
        const e = this.island;
        const page = e._newPage('home');
        page.add_style_class_name('di-dashboard');
        this.date = e._label('', 'di-dashboard-date');
        const header = new St.BoxLayout({style_class: 'di-workspace-heading'});
        this.date.x_expand = true;
        header.add_child(this.date);
        header.add_child(e._chip('Editar', () => this.editor.open(), 'document-edit-symbolic'));
        page.add_child(header);
        this.cardsBox = new St.BoxLayout({orientation: Clutter.Orientation.VERTICAL, style_class: 'di-glance-grid', x_expand: true});
        page.add_child(this.cardsBox);
        this.preview = new St.BoxLayout({orientation: Clutter.Orientation.VERTICAL, style_class: 'di-glance-preview'});
        page.add_child(this.preview);
        const shortcuts = new St.BoxLayout({style_class: 'di-home-shortcuts', x_expand: true});
        for (const [id, title, icon] of [['downloads', 'Descargas', 'folder-download-symbolic'], ['tools', 'Controles', 'preferences-system-symbolic'], ['agents', 'Asistentes', 'utilities-terminal-symbolic']]) {
            const action = new St.Button({style_class: 'di-home-shortcut', reactive: true, can_focus: true, x_expand: true, accessible_name: title});
            const content = new St.BoxLayout({orientation: Clutter.Orientation.VERTICAL, style_class: 'di-home-shortcut-content'});
            content.add_child(new St.Icon({icon_name: icon, icon_size: 22, x_align: Clutter.ActorAlign.CENTER}));
            content.add_child(e._label(title, 'di-dashboard-caption'));
            action.set_child(content); action.connect('clicked', () => e._selectTab(id));
            shortcuts.add_child(action);
        }
        page.add_child(shortcuts);
        this.liveBox = new St.BoxLayout({orientation: Clutter.Orientation.VERTICAL, style_class: 'di-live-list'});
        this.liveSignature = null;
        page.add_child(this.liveBox);
        this.rebuild();
    }

    rebuild() {
        if (!this.cardsBox) return;
        const e = this.island;
        if (this.hoverTimer) e._clear(this.hoverTimer);
        this.hoverTimer = 0;
        this.cardsBox.destroy_all_children();
        this.cards = [];
        this.peekSignature = null;
        const selected = homeModules(e._settings.get_strv('home-modules'));
        let row;
        for (const [index, id] of selected.entries()) {
            if (index % 3 === 0) { row = new St.BoxLayout({style_class: 'di-glance-row', x_expand: true}); this.cardsBox.add_child(row); }
            const [, name, icon] = MODULES.find(m => m[0] === id);
            const card = new St.Button({style_class: `di-glance-card di-module-${id}`, reactive: true, can_focus: true, track_hover: true, x_expand: true, accessible_name: name});
            const content = new St.BoxLayout({orientation: Clutter.Orientation.VERTICAL, style_class: 'di-glance-content'});
            const visual = new St.BoxLayout({style_class: 'di-glance-visual', x_align: Clutter.ActorAlign.CENTER});
            visual.add_child(new St.Icon({icon_name: icon, icon_size: 22, y_align: Clutter.ActorAlign.CENTER}));
            const value = e._label(this.value(id), 'di-glance-value');
            value.visible = !!value.text; visual.add_child(value); content.add_child(visual);
            content.add_child(e._label(name, 'di-dashboard-caption'));
            const title = e._label('', 'di-glance-summary', {width: 100}); title.clutter_text.set_ellipsize(Pango.EllipsizeMode.END); content.add_child(title);
            card.set_child(content); card.connect('clicked', () => e._selectTab(id));
            card.connect('notify::hover', () => {
                if (this.hoverTimer) e._clear(this.hoverTimer);
                this.hoverTimer = 0;
                if (card.hover) this.hoverTimer = e._timeout(220, () => { this.hoverTimer = 0; if (card.hover && e._tab === 'home') { this.peekId = id; this.renderPeek(); e._resizeIsland(); } return false; });
            });
            card.connect('key-focus-in', () => { this.peekId = id; this.renderPeek(); });
            row.add_child(card); this.cards.push({id, title, card, value});
        }
        this.peekId = selected.includes(this.peekId) ? this.peekId : selected[0];
        if (!selected.length) this.cardsBox.add_child(e._label('Pulsa Editar para añadir tus primeras tarjetas.', 'di-hint'));
        this.refresh();
        e._resizeIsland();
    }

    summaries() {
        const e = this.island;
        return {
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
            tools: 'Concentración, tema y micrófono',
            downloads: 'Archivos recientes', world: 'Hora en tus ciudades', devices: 'Monitores y unidades conectadas',
        };
    }

    value(id) {
        const e = this.island;
        if (id === 'today') return String(new Date().getDate());
        if (id === 'weather' && e._weather) return `${Math.round(e._weather.w.temperature_2m)}°`;
        if (id === 'system' && e._bat) return `${e._bat.pct}%`;
        if (id === 'notes') return String((e._tasks ?? []).filter(task => !task.done).length);
        if (id === 'files') return String(e._shelf.length);
        if (id === 'clock' && e._tm.running) return `${Math.ceil(e._timerLeft() / 60000)}′`;
        return '';
    }

    refresh() {
        if (!this.date) return;
        const e = this.island;
        this.date.text = new Date().toLocaleDateString('es', {weekday: 'long', day: 'numeric', month: 'long'});
        const details = this.summaries();
        for (const {id, title, value} of this.cards) {
            title.text = details[id] ?? 'Abrir';
            value.text = this.value(id); value.visible = !!value.text;
        }
        this.renderPeek();
        const activities = e._live.entries.filter(item => !this.cards.some(card => card.id === item.page)).slice(0, 3);
        const signature = JSON.stringify(activities.map(({text, page, icon}) => [text, page, icon]));
        if (signature === this.liveSignature) return;
        this.liveSignature = signature;
        this.liveBox.destroy_all_children();
        for (const {text, page, icon} of activities) {
            const button = e._chip(text, () => e._selectTab(page), icon);
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
        const text = value => { const actor = e._label(value, 'di-dashboard-detail', {width: 344}); actor.clutter_text.set_line_wrap(true); this.preview.add_child(actor); };
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
        const search = new St.Entry({style_class: 'di-search', hint_text: 'Buscar herramientas…', accessible_name: 'Buscar herramientas', can_focus: true});
        search.set_primary_icon(new St.Icon({icon_name: 'edit-find-symbolic', icon_size: 16}));
        search.clutter_text.editable = false;
        search.clutter_text.connect('key-focus-in', text => { text.editable = true; });
        search.clutter_text.connect('key-focus-out', text => { text.editable = false; });
        page.add_child(search);
        const scroll = e._scroll(340);
        const list = new St.BoxLayout({orientation: Clutter.Orientation.VERTICAL, style_class: 'di-library-list'});
        scroll.set_child(list); page.add_child(scroll);
        const groups = [
            ['Organizar', [['files', 'Archivos a mano'], ['clip', 'Copiar y recuperar'], ['notes', 'Ideas y pendientes'], ['downloads', 'Tus últimos archivos']]],
            ['Tu día', [['today', 'Agenda y eventos'], ['weather', 'Tiempo y pronóstico'], ['clock', 'Cuenta regresiva'], ['world', 'Hora en tus ciudades'], ['notifications', 'Avisos recientes']]],
            ['Multimedia', [['music', 'Reproducir y controlar'], ['mirror', 'Vista de tu cámara'], ['studio', 'Dictado y teleprompter']]],
            ['Sistema', [['system', 'Estado del equipo'], ['tools', 'Tema, foco y micrófono'], ['devices', 'Pantallas y discos'], ['agents', 'Codex, Claude y OpenCode'], ['applications', 'Abrir aplicaciones']]],
        ];
        const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es').trim();
        const render = () => {
            list.destroy_all_children();
            const query = normalize(search.text);
            let count = 0;
            for (const [title, items] of groups) {
                const matches = items.filter(([id, description]) => {
                    const module = MODULES.find(item => item[0] === id);
                    return (id !== 'applications' || e._settings.get_boolean('app-launcher')) && normalize(`${title} ${module[1]} ${description}`).includes(query);
                });
                if (!matches.length) continue;
                const group = new St.BoxLayout({orientation: Clutter.Orientation.VERTICAL, style_class: 'di-library-group'});
                group.add_child(e._label(title, 'di-library-heading'));
                let row;
                matches.forEach(([id, description], index) => {
                    if (index % 2 === 0) { row = new St.BoxLayout({style_class: 'di-library-row'}); group.add_child(row); }
                    const [, name, icon] = MODULES.find(item => item[0] === id);
                    const button = new St.Button({style_class: `di-library-tile di-module-${id}`, width: 186, reactive: true, can_focus: true, accessible_name: `${name}: ${description}`});
                    const content = new St.BoxLayout({orientation: Clutter.Orientation.VERTICAL, style_class: 'di-library-content'});
                    content.add_child(new St.Icon({icon_name: icon, icon_size: 22, style_class: 'di-library-icon', x_align: Clutter.ActorAlign.START}));
                    for (const [text, style] of [[name, 'di-library-title'], [description, 'di-library-description']]) {
                        const label = e._label(text, style, {width: 160});
                        label.clutter_text.set_ellipsize(Pango.EllipsizeMode.END);
                        content.add_child(label);
                    }
                    button.set_child(content); button.connect('clicked', () => e._selectTab(id));
                    button.connect('key-focus-in', () => {
                        const [, y] = button.get_transformed_position(), [, top] = scroll.get_transformed_position();
                        const adjustment = scroll.vadjustment;
                        if (y < top) adjustment.ease(adjustment.value + y - top, {duration: e._duration(140), mode: Clutter.AnimationMode.EASE_OUT_CUBIC});
                        else if (y + button.height > top + scroll.height) adjustment.ease(adjustment.value + y + button.height - top - scroll.height, {duration: e._duration(140), mode: Clutter.AnimationMode.EASE_OUT_CUBIC});
                    });
                    row.add_child(button); count++;
                });
                list.add_child(group);
            }
            if (!count) list.add_child(e._label('No hay resultados. Prueba con otro nombre.', 'di-hint'));
            scroll.vadjustment.remove_transition('value'); scroll.vadjustment.value = 0;
        };
        search.clutter_text.connect('text-changed', render);
        e._connect(e._settings, 'changed::app-launcher', render);
        page.add_child(e._chip('Personalizar este espacio', () => this.editor.open(), 'document-edit-symbolic'));
        render();
    }
}
