import Clutter from 'gi://Clutter';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import St from 'gi://St';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import {column, label, button} from './ui.js';
import {cpuSnapshot, cpuUsage, memorySnapshot, networkSnapshot, networkRate, appendSample, calendarDays} from './metrics-model.js';
const read = path => { const [ok, bytes] = GLib.file_get_contents(path); return ok ? new TextDecoder().decode(bytes) : ''; };
const size = value => Number.isFinite(value) ? GLib.format_size(Math.max(0, value)) : '—';
const ITEMS = [['cpu', 'Procesador', 'computer-symbolic'], ['memory', 'Memoria', 'media-flash-symbolic'], ['disk', 'Almacenamiento', 'drive-harddisk-symbolic'], ['network', 'Red', 'network-wired-symbolic'], ['battery', 'Dispositivos', 'battery-level-80-symbolic'], ['uptime', 'Fecha y hora', 'preferences-system-time-symbolic']];
export class Statistics {
    constructor(owner) {
        this.owner = owner; this.history = {}; this.data = {}; this.values = {};
        this.actor = column({style_class: 'ai-statistics', reactive: true, track_hover: true});
        const head = new St.BoxLayout({style_class: 'ai-head'});
        this.back = button('Volver al resumen', () => this.select(null), 'go-previous-symbolic'); head.add_child(this.back);
        this.title = label('Tu equipo', 'ai-title'); this.title.x_expand = true; head.add_child(this.title);
        this.pin = button('Mantener abierto', () => { this.pinned = !this.pinned; this.pin.label = this.pinned ? '●' : '○'; }); head.add_child(this.pin);
        head.add_child(button('Cerrar estadísticas', () => this.show(false), 'window-close-symbolic'));
        this.actor.add_child(head);
        this.scroll = new St.ScrollView({x_expand: true, hscrollbar_policy: St.PolicyType.NEVER});
        this.body = column({style_class: 'ai-list'}); this.scroll.set_child(this.body); this.actor.add_child(this.scroll);
        this.footer = label('Datos de este equipo · últimos 2 minutos', 'ai-muted'); this.actor.add_child(this.footer);
        this.trigger = new St.Button({reactive: true, track_hover: true, accessible_name: 'Estadísticas del equipo', style_class: 'ai-stat-trigger'});
        this.trigger.connect('clicked', () => this.show(!this.open));
        this.trigger.connect('notify::hover', () => this.schedule(this.trigger.hover));
        this.actor.connect('notify::hover', () => this.schedule(this.actor.hover || this.trigger.hover));
        this.actor.connect('key-press-event', (_actor, event) => { if (event.get_key_symbol() !== Clutter.KEY_Escape) return Clutter.EVENT_PROPAGATE; this.show(false); return Clutter.EVENT_STOP; });
        Main.layoutManager.addChrome(this.trigger, {trackFullscreen: true});
        Main.layoutManager.addChrome(this.actor, {trackFullscreen: true});
        this.actor.hide(); this.select(null); this.layout();
    }
    schedule(show) {
        if (this.hoverTimer) GLib.Source.remove(this.hoverTimer);
        this.hoverTimer = GLib.timeout_add(GLib.PRIORITY_DEFAULT, show ? 250 : 450, () => {
            this.hoverTimer = 0;
            if (show || (!this.pinned && !this.actor.hover && !this.trigger.hover)) this.show(show);
            return GLib.SOURCE_REMOVE;
        });
    }
    layout() {
        this.show(false);
        const m = this.owner._monitor(); if (!m) return;
        const scale = St.ThemeContext.get_for_stage(global.stage).scale_factor;
        this.left = this.owner._side() === 'right';
        const x = this.left ? m.x : m.x + m.width;
        const shared = Main.layoutManager.monitors.some(n => n !== m && n.y < m.y + m.height && n.y + n.height > m.y && (this.left ? n.x + n.width === x : n.x === x));
        this.trigger.visible = this.owner.settings.statistics && !shared && !Main.overview.visible;
        this.trigger.set_position(this.left ? x : x - 3 * scale, m.y + m.height / 2 - 28 * scale);
        this.trigger.set_size(3 * scale, 56 * scale);
        this.actor.set_width(Math.min(344 * scale, m.width - 24 * scale));
        this.scroll.set_style(`max-height: ${Math.max(160, Math.min(510, m.height / scale - 180))}px;`);
        this.position();
    }
    position() {
        const m = this.owner._monitor(); if (!m) return;
        const scale = St.ThemeContext.get_for_stage(global.stage).scale_factor;
        const h = this.actor.get_preferred_height(this.actor.width)[1];
        this.actor.set_position(this.left ? m.x + 8 * scale : m.x + m.width - this.actor.width - 8 * scale,
            m.y + Math.max(36 * scale, (m.height - h) / 2));
    }
    show(open) {
        if (this.hoverTimer) { GLib.Source.remove(this.hoverTimer); this.hoverTimer = 0; }
        if (open === this.open) return;
        this.open = open;
        if (this.timer) { GLib.Source.remove(this.timer); this.timer = 0; }
        if (!open) {
            this.cancel?.cancel(); this.cancel = null;
            this.actor.remove_all_transitions(); this.actor.hide(); this.previous = null; this.netPrevious = null;
            this.pinned = false; this.pin.label = '○';
            if (this.capture) global.stage.disconnect(this.capture); this.capture = 0;
            return;
        }
        this.history = {}; this.select(null); this.cancel = new Gio.Cancellable();
        this.actor.show(); this.position(); this.actor.opacity = 0;
        this.actor.ease({opacity: 255, duration: this.owner._duration(160), mode: Clutter.AnimationMode.EASE_OUT_CUBIC});
        this.capture = global.stage.connect('captured-event', (_stage, event) => {
            if (event.type() === Clutter.EventType.KEY_PRESS && event.get_key_symbol() === Clutter.KEY_Escape) { this.show(false); return Clutter.EVENT_PROPAGATE; }
            if (event.type() === Clutter.EventType.BUTTON_PRESS) {
                const [x, y] = event.get_coords();
                const [ax, ay] = this.actor.get_transformed_position();
                if (x < ax || y < ay || x > ax + this.actor.width || y > ay + this.actor.height) this.show(false);
            }
            return Clutter.EVENT_PROPAGATE;
        });
        this.lastSlow = 0; this.refresh();
        this.timer = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 2, () => { this.refresh(); return GLib.SOURCE_CONTINUE; });
    }
    graph(id, height = 38) {
        const area = new St.DrawingArea({height, x_expand: true, style_class: 'ai-chart'});
        area.connect('repaint', actor => {
            const cr = actor.get_context(), [width, h] = actor.get_surface_size();
            const values = this.history[id] ?? [];
            cr.setSourceRGBA(.6, .7, .8, .12); cr.setLineWidth(1);
            for (let i = 1; i <= 3; i++) { cr.moveTo(0, h * i / 4); cr.lineTo(width, h * i / 4); } cr.stroke();
            if (values.length > 1) {
                const max = id === 'network' ? Math.max(1024, ...values) : 100;
                cr.setSourceRGBA(.24, .72, 1, .95); cr.setLineWidth(2);
                values.forEach((v, i) => { const x = i * width / Math.max(1, values.length - 1), y = h - 3 - Math.min(1, v / max) * (h - 6); if (i) cr.lineTo(x, y); else cr.moveTo(x, y); }); cr.stroke();
            }
            cr.$dispose();
        });
        this.charts.push(area); return area;
    }
    select(id) {
        this.page = id; this.back.visible = !!id; this.body.destroy_all_children(); this.values = {}; this.charts = [];
        this.title.text = ITEMS.find(item => item[0] === id)?.[1] ?? 'Tu equipo';
        if (!id) for (const [key, name, icon] of ITEMS) {
            const row = button(name, () => this.select(key)); row.add_style_class_name('ai-stat-row');
            const content = new St.BoxLayout({style_class: 'ai-line', x_expand: true});
            content.add_child(new St.Icon({icon_name: icon, icon_size: 22, y_align: Clutter.ActorAlign.CENTER}));
            const text = column({x_expand: true}); text.add_child(label(name, 'ai-muted'));
            const value = label('—', 'ai-stat-value'); text.add_child(value); this.values[key] = value; content.add_child(text);
            content.add_child(new St.Icon({icon_name: 'go-next-symbolic', icon_size: 12, y_align: Clutter.ActorAlign.CENTER}));
            row.set_child(content); content.x_align = Clutter.ActorAlign.FILL; this.body.add_child(row);
            if (['cpu', 'memory', 'network'].includes(key)) this.body.add_child(this.graph(key, 24));
        } else {
            this.hero = label('—', 'ai-stat-hero'); this.body.add_child(this.hero);
            if (['cpu', 'memory', 'network'].includes(id)) this.body.add_child(this.graph(id, 110));
            this.details = column({style_class: 'ai-list'}); this.body.add_child(this.details);
            if (id === 'uptime') this.body.add_child(button('Copiar fecha y hora', () => { St.Clipboard.get_default().set_text(St.ClipboardType.CLIPBOARD, new Date().toLocaleString('es')); this.footer.text = 'Fecha y hora copiadas'; }));
            const app = id === 'disk' ? 'org.gnome.Nautilus.desktop' : id === 'uptime' ? 'org.gnome.Calendar.desktop' : id === 'battery' ? 'gnome-power-panel.desktop' : 'org.gnome.SystemMonitor.desktop';
            this.body.add_child(button(id === 'disk' ? 'Abrir Archivos' : id === 'uptime' ? 'Abrir Calendario' : id === 'battery' ? 'Ajustes de energía' : 'Abrir Monitor del sistema', () => {
                const info = Gio.DesktopAppInfo.new(app);
                if (info) info.launch([], global.create_app_launch_context(0, -1));
                else this.footer.text = 'Esta aplicación no está instalada';
            }));
        }
        this.render(); this.position();
    }
    detail(title, value) {
        const row = new St.BoxLayout({style_class: 'ai-stat-detail'});
        const name = label(title, 'ai-muted'); name.x_expand = true; row.add_child(name); row.add_child(label(value)); this.details.add_child(row);
    }
    render() {
        const d = this.data, mem = d.memory, disk = d.disk, net = d.network;
        const text = {
            cpu: Number.isFinite(d.cpu) ? `${Math.round(d.cpu)}% en uso` : 'Midiendo…',
            memory: mem ? `${size(mem.used)} / ${size(mem.total)}` : 'No disponible',
            disk: disk ? `${size(disk.free)} libres` : 'Consultando…',
            network: net ? `↓ ${size(net.rx)}/s  ↑ ${size(net.tx)}/s` : 'Midiendo…',
            battery: d.devices?.length ? d.devices.map(device => `${Math.round(device.Percentage)}%`).join(' · ') : 'Sin batería detectable',
            uptime: new Date().toLocaleTimeString('es', {hour: '2-digit', minute: '2-digit'}),
        };
        for (const [id, value] of Object.entries(this.values)) value.text = text[id];
        this.charts.forEach(chart => chart.queue_repaint());
        if (!this.page) return;
        this.hero.text = text[this.page]; this.details.destroy_all_children();
        if (this.page === 'cpu') { this.detail('Muestra', 'Cada 2 segundos'); this.detail('Carga media · 1 / 5 / 15 min', d.load ?? '—'); this.detail('Tiempo encendido', d.uptime ?? '—'); }
        if (this.page === 'memory' && mem) { this.detail('Disponible', size(mem.available)); this.detail('Caché recuperable', size(mem.cached)); this.detail('Intercambio en uso', size(mem.swap)); }
        if (this.page === 'disk' && disk) { this.detail('Directorio personal', GLib.get_home_dir()); this.detail('Usado', size(disk.total - disk.free)); this.detail('Capacidad', size(disk.total)); }
        if (this.page === 'network') { this.detail('Interfaces', Object.keys(d.interfaces ?? {}).join(', ') || 'Ninguna'); this.detail('Descarga', `${size(net?.rx)}/s`); this.detail('Subida', `${size(net?.tx)}/s`); this.detail('Alcance', 'Tráfico agregado, excepto loopback'); }
        if (this.page === 'battery') for (const device of d.devices ?? []) {
            this.detail(device.Model || (device.Type === 2 ? 'Equipo' : 'Dispositivo'), `${Math.round(device.Percentage)}% · ${[1, 5].includes(device.State) ? 'Cargando' : 'Batería'}`);
            if (device.Capacity > 0) this.detail('Salud', `${Math.round(device.Capacity)}%`);
            const seconds = device.TimeToEmpty || device.TimeToFull;
            if (seconds > 0) this.detail('Tiempo estimado', `${Math.floor(seconds / 3600)} h ${Math.floor(seconds % 3600 / 60)} min`);
        }
        if (this.page === 'uptime') {
            const today = new Date(); this.detail(today.toLocaleDateString('es', {weekday: 'long'}), today.toLocaleDateString('es', {month: 'long', year: 'numeric'}));
            let row;
            ['L', 'M', 'X', 'J', 'V', 'S', 'D', ...calendarDays(today)].forEach((day, index) => {
                if (index % 7 === 0) { row = new St.BoxLayout({style_class: 'ai-calendar-row'}); this.details.add_child(row); }
                const cell = label(day === null ? '' : String(day), index > 6 && day === today.getDate() ? 'ai-calendar-today' : 'ai-calendar-day'); cell.set_width(38); cell.x_expand = true; row.add_child(cell);
            });
            this.detail('Encendido', d.uptime ?? '—');
        }
    }
    refresh() {
        if (!this.open) return;
        try {
            const cpu = cpuSnapshot(read('/proc/stat')); this.data.cpu = cpuUsage(this.previous, cpu); this.previous = cpu;
            this.data.memory = memorySnapshot(read('/proc/meminfo'));
            const interfaces = networkSnapshot(read('/proc/net/dev')), time = GLib.get_monotonic_time() / 1000000;
            this.data.network = networkRate(this.netPrevious?.interfaces, interfaces, time - (this.netPrevious?.time ?? time));
            this.data.interfaces = interfaces; this.netPrevious = {interfaces, time};
            this.data.load = read('/proc/loadavg').trim().split(' ').slice(0, 3).join(' / ');
            const minutes = Math.floor(Number(read('/proc/uptime').split(' ')[0]) / 60); this.data.uptime = `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
            const m = this.data.memory;
            for (const [key, value] of [['cpu', this.data.cpu], ['memory', m ? m.used / m.total * 100 : null], ['network', this.data.network ? this.data.network.rx + this.data.network.tx : null]])
                this.history[key] = appendSample(this.history[key] ?? [], value);
            this.render();
            if (time - this.lastSlow > 10) { this.lastSlow = time; this.slowSample(); }
        } catch { this.footer.text = 'Algunas métricas no están disponibles'; }
    }
    slowSample() {
        const cancel = this.cancel;
        Gio.File.new_for_path(GLib.get_home_dir()).query_filesystem_info_async('filesystem::size,filesystem::free', GLib.PRIORITY_DEFAULT, cancel, (file, result) => {
            try {
                const info = file.query_filesystem_info_finish(result);
                if (!this.open || cancel !== this.cancel) return;
                this.data.disk = {total: info.get_attribute_uint64('filesystem::size'), free: info.get_attribute_uint64('filesystem::free')}; this.render();
            } catch {}
        });
        const call = (path, iface, method, params) => new Promise((resolve, reject) => Gio.DBus.system.call('org.freedesktop.UPower', path, iface, method, params, null, Gio.DBusCallFlags.NONE, 1500, cancel, (bus, result) => { try { resolve(bus.call_finish(result).recursiveUnpack()); } catch (error) { reject(error); } }));
        (async () => {
            try {
                const [paths] = await call('/org/freedesktop/UPower', 'org.freedesktop.UPower', 'EnumerateDevices', null);
                const readings = await Promise.allSettled(paths.slice(0, 12).map(path => call(path, 'org.freedesktop.DBus.Properties', 'GetAll', new GLib.Variant('(s)', ['org.freedesktop.UPower.Device']))));
                if (!this.open || cancel !== this.cancel) return;
                this.data.devices = readings.filter(r => r.status === 'fulfilled').map(r => r.value[0]).filter(d => d.IsPresent && d.Type !== 1 && Number.isFinite(d.Percentage)); this.render();
            } catch {}
        })();
    }
    destroy() {
        this.show(false); if (this.hoverTimer) GLib.Source.remove(this.hoverTimer);
        Main.layoutManager.removeChrome(this.actor); Main.layoutManager.removeChrome(this.trigger);
        this.actor.destroy(); this.trigger.destroy();
    }
}
