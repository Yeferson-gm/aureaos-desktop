import Clutter from 'gi://Clutter';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import St from 'gi://St';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import {column, label, button} from './ui.js';
import {cpuSnapshot, cpuUsage, memorySnapshot, networkSnapshot, networkRate, appendSample, calendarDays} from './metrics-model.js';
const read = path => { const [ok, bytes] = GLib.file_get_contents(path); return ok ? new TextDecoder().decode(bytes) : ''; };
const size = value => Number.isFinite(value) ? GLib.format_size(Math.max(0, value)) : '—';
const ITEMS = [['cpu', 'Procesador', 'computer-symbolic'], ['memory', 'Memoria', 'media-flash-symbolic'], ['disk', 'Disco', 'drive-harddisk-symbolic'], ['network', 'Red', 'network-wired-symbolic'], ['battery', 'Batería', 'battery-level-80-symbolic'], ['uptime', 'Fecha y hora', 'preferences-system-time-symbolic']];
export class Statistics {
    constructor(owner) {
        this.owner = owner; this.history = {}; this.data = {}; this.values = {};
        this.actor = column({visible: false, style_class: 'ai-statistics', reactive: true, track_hover: true});
        const head = new St.BoxLayout({style_class: 'ai-head'});
        this.back = button('Volver al resumen', () => this.select(null), 'go-previous-symbolic'); head.add_child(this.back);
        this.title = label('Tu equipo', 'ai-title'); this.title.x_expand = true; head.add_child(this.title);
        this.pin = button('Mantener abierto', () => { this.pinned = !this.pinned; this.pin.label = this.pinned ? '●' : '○'; }); head.add_child(this.pin);
        head.add_child(button('Cerrar estadísticas', () => this.show(false), 'window-close-symbolic'));
        this.detailPanel = column({style_class: 'ai-stat-detail-panel', x_align: Clutter.ActorAlign.CENTER, width: 460});
        this.detailPanel.add_child(head); this.actor.add_child(this.detailPanel);
        this.scroll = new St.ScrollView({x_expand: true, hscrollbar_policy: St.PolicyType.NEVER});
        this.body = column({style_class: 'ai-list'}); this.scroll.set_child(this.body); this.detailPanel.add_child(this.scroll);
        this.footer = label('Datos de este equipo · últimos 2 minutos', 'ai-muted'); this.detailPanel.add_child(this.footer);
        this.strip = new St.BoxLayout({style_class: 'ai-stat-strip', x_expand: true}); this.actor.add_child(this.strip);
        this.charts = []; this.buildStrip();
        this.trigger = new St.Button({reactive: true, track_hover: true, accessible_name: 'Estadísticas del equipo', style_class: 'ai-stat-trigger'});
        this.trigger.connect('clicked', () => this.show(!this.open));
        this.trigger.connect('notify::hover', () => this.schedule(this.trigger.hover));
        this.actor.connect('notify::hover', () => this.schedule(this.actor.hover || this.trigger.hover));
        this.actor.connect('key-press-event', (_actor, event) => { if (event.get_key_symbol() !== Clutter.KEY_Escape) return Clutter.EVENT_PROPAGATE; this.show(false); return Clutter.EVENT_STOP; });
        Main.layoutManager.addChrome(this.trigger, {trackFullscreen: true});
        Main.layoutManager.addChrome(this.actor, {trackFullscreen: false});
        this.actor.hide(); this.select(null); this.layout();
    }
    schedule(show) {
        if (this.hoverTimer) GLib.Source.remove(this.hoverTimer);
        this.hoverTimer = GLib.timeout_add(GLib.PRIORITY_DEFAULT, show ? 250 : 450, () => {
            this.hoverTimer = 0;
            if (show && !this.trigger.hover && !this.actor.hover) return GLib.SOURCE_REMOVE;
            if (show || (!this.pinned && !this.actor.hover && !this.trigger.hover)) this.show(show);
            return GLib.SOURCE_REMOVE;
        });
    }
    layout() {
        this.show(false);
        const m = this.owner._monitor(); if (!m) return;
        const contrast = this.owner._a11y.get_boolean('high-contrast');
        this.actor.style_class = `ai-statistics${contrast ? ' ai-contrast' : ''}${this.owner.settings.material === 'solid' ? ' ai-solid' : ''}`;
        const scale = St.ThemeContext.get_for_stage(global.stage).scale_factor;
        const shared = Main.layoutManager.monitors.some(n => n !== m && n.y === m.y + m.height && n.x < m.x + 80 * scale && n.x + n.width > m.x);
        this.trigger.visible = this.owner.settings.statistics && !shared && !Main.overview.visible;
        this.trigger.set_position(m.x + 24 * scale, m.y + m.height - 6 * scale);
        this.trigger.set_size(56 * scale, 6 * scale);
        this.actor.set_width(Math.min(760 * scale, m.width - 32 * scale));
        this.detailPanel.set_width(Math.min(460 * scale, this.actor.width));
        this.scroll.set_style(`max-height: ${Math.max(160, Math.min(360, m.height / scale - 300))}px;`);
        this.position();
    }
    position() {
        const m = this.owner._monitor(); if (!m) return;
        const scale = St.ThemeContext.get_for_stage(global.stage).scale_factor;
        const h = this.actor.get_preferred_height(this.actor.width)[1];
        const work = Main.layoutManager.getWorkAreaForMonitor(m.index);
        this.actor.set_position(m.x + (m.width - this.actor.width) / 2,
            Math.max(work.y + 12 * scale, m.y + m.height - 104 * scale - h));
    }
    show(open) {
        if (this.hoverTimer) { GLib.Source.remove(this.hoverTimer); this.hoverTimer = 0; }
        if (open === this.open) return;
        this.open = open;
        if (this.timer) { GLib.Source.remove(this.timer); this.timer = 0; }
        if (!open) {
            this.owner._clear(this.detailTimer); this.detailTimer = 0;
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
    buildStrip() {
        this.stripValues = {}; this.stripCaptions = {};
        for (const [id, title, icon] of ITEMS) {
            const cell = button(title, () => this.select(this.page === id ? null : id));
            cell.add_style_class_name('ai-metric-cell'); cell.x_expand = true; cell.track_hover = true;
            const content = column({style_class: 'ai-metric-content', x_expand: true});
            const heading = new St.BoxLayout({style_class: 'ai-line'});
            heading.add_child(new St.Icon({icon_name: icon, icon_size: 14})); heading.add_child(label(title, 'ai-muted'));
            content.add_child(heading);
            const value = label('—', 'ai-metric-value'); content.add_child(value); this.stripValues[id] = value;
            const caption = label('—', 'ai-metric-caption'); content.add_child(caption); this.stripCaptions[id] = caption;
            content.add_child(this.graph(id, 28)); cell.set_child(content); this.strip.add_child(cell);
            cell.connect('notify::hover', () => {
                this.owner._clear(this.detailTimer);
                this.detailTimer = cell.hover ? this.owner._timeout(180, () => { this.detailTimer = 0; if (this.open && cell.hover) this.select(id); }) : 0;
            });
        }
    }
    graph(id, height = 38) {
        const area = new St.DrawingArea({height, x_expand: true, style_class: 'ai-chart'});
        area.connect('repaint', actor => {
            const cr = actor.get_context(), [width, h] = actor.get_surface_size();
            const colors = {cpu: [.37,.69,1], memory: [.72,.55,1], disk: [1,.7,.35], network: [.25,.86,.72], battery: [.42,.86,.55], uptime: [.6,.68,.8]};
            const [r,g,b] = colors[id];
            let values = this.history[id] ?? [];
            if (!values.length && id === 'disk' && this.data.disk) values = [100 * (1 - this.data.disk.free / this.data.disk.total)];
            if (!values.length && id === 'battery' && this.data.devices?.length) values = [this.data.devices[0].Percentage];
            cr.setLineWidth(1);
            if (height > 40) {
                cr.setSourceRGBA(.7,.75,.85,.10);
                for (let i = 1; i < 4; i++) { cr.moveTo(0, h * i / 4); cr.lineTo(width,h * i / 4); } cr.stroke();
            }
            if (['disk', 'battery'].includes(id) && values.length) {
                cr.setLineCap(1); cr.setLineWidth(5); cr.setSourceRGBA(r,g,b,.15); cr.moveTo(4,h/2); cr.lineTo(width-4,h/2); cr.stroke();
                cr.setSourceRGBA(r,g,b,1); cr.moveTo(4,h/2); cr.lineTo(4+(width-8)*Math.min(100,Math.max(0,values.at(-1)))/100,h/2); cr.stroke();
                cr.$dispose(); return;
            }
            if (values.length) {
                const ceiling = id === 'network' ? Math.max(1024, ...values) : 100;
                const points = values.map((v,i) => [values.length === 1 ? width - 4 : 4 + i * (width - 8) / (values.length - 1), h - 4 - Math.min(1,v / ceiling) * (h - 8)]);
                const trace = () => { cr.moveTo(...points[0]); for (let i = 1; i < points.length; i++) {
                    const [x,y] = points[i], [px,py] = points[i-1]; cr.curveTo((px+x)/2,py,(px+x)/2,y,x,y);
                }};
                trace(); cr.lineTo(width-4,h); cr.lineTo(points[0][0],h); cr.closePath(); cr.setSourceRGBA(r,g,b,.14); cr.fill();
                trace(); cr.setSourceRGBA(r,g,b,1); cr.setLineWidth(2); cr.stroke();
                const last = points.at(-1); cr.arc(last[0],last[1],2.5,0,Math.PI*2); cr.fill();
            }
            cr.$dispose();
        });
        this.charts.push(area); area.connect('destroy', () => { this.charts = this.charts.filter(chart => chart !== area); }); return area;
    }
    select(id) {
        this.page = id; this.axisStart = null; this.body.destroy_all_children(); this.values = this.stripValues;
        this.detailPanel.visible = !!id;
        this.title.text = ITEMS.find(item => item[0] === id)?.[1] ?? 'Tu equipo';
        this.strip.get_children().forEach((cell, index) => ITEMS[index][0] === id ? cell.add_style_class_name('ai-metric-selected') : cell.remove_style_class_name('ai-metric-selected'));
        if (id) {
            this.hero = label('—', 'ai-stat-hero'); this.body.add_child(this.hero);
            if (['cpu', 'memory', 'network'].includes(id)) {
                this.body.add_child(this.graph(id, 120));
                const axis = new St.BoxLayout({x_expand: true}); const start = label('Midiendo…', 'ai-muted'); this.axisStart = start; start.x_expand = true; axis.add_child(start); axis.add_child(label('Ahora', 'ai-muted')); this.body.add_child(axis);
            }
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
        const compact = {...text, cpu: Number.isFinite(d.cpu) ? `${Math.round(d.cpu)}%` : 'Midiendo…', memory: mem ? size(mem.used) : '—', disk: disk ? size(disk.free) : '—', network: net ? `${net.rx < 1024 ? Math.round(net.rx) + ' B' : net.rx < 1048576 ? (net.rx / 1024).toFixed(1) + ' KB' : (net.rx / 1048576).toFixed(1) + ' MB'}/s` : '—', battery: d.devices?.length ? `${Math.round(d.devices[0].Percentage)}%` : '—'};
        for (const [id, value] of Object.entries(this.values)) value.text = compact[id];
        const captions = {cpu: 'Uso del procesador', memory: mem ? `de ${size(mem.total)}` : 'Consultando…', disk: 'Espacio libre', network: 'Descarga actual', battery: d.devices?.length ? ([1,5].includes(d.devices[0].State) ? 'Cargando' : 'En uso') : 'Sin batería', uptime: new Date().toLocaleDateString('es', {day:'numeric', month:'short'})};
        for (const [id, caption] of Object.entries(this.stripCaptions)) caption.text = captions[id];
        this.charts.forEach(chart => chart.queue_repaint());
        if (!this.page) return;
        if (this.axisStart) { const seconds = Math.max(0, (this.history[this.page]?.length ?? 1) - 1) * 2; this.axisStart.text = seconds ? `−${seconds} s` : 'Primera muestra'; }
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
