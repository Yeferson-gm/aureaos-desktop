import Clutter from 'gi://Clutter';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import St from 'gi://St';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import {column, label, button} from './ui.js';
const read = path => { const [ok, bytes] = GLib.file_get_contents(path); return ok ? new TextDecoder().decode(bytes) : ''; };
export class Statistics {
    constructor(owner) {
        this.owner = owner;
        this.actor = column({style_class: 'ai-statistics', reactive: true, track_hover: true});
        const head = new St.BoxLayout({style_class: 'ai-head'});
        const title = label('Tu equipo', 'ai-title'); title.x_expand = true; head.add_child(title);
        head.add_child(button('Cerrar estadísticas', () => this.show(false), 'window-close-symbolic'));
        this.actor.add_child(head); this.values = {};
        for (const [id, name, icon] of [['cpu', 'Procesador', 'processor-symbolic'], ['memory', 'Memoria', 'media-flash-symbolic'], ['disk', 'Almacenamiento', 'drive-harddisk-symbolic'], ['uptime', 'Encendido', 'preferences-system-time-symbolic']]) {
            const row = new St.BoxLayout({style_class: 'ai-stat-row'});
            row.add_child(new St.Icon({icon_name: icon, icon_size: 20, y_align: Clutter.ActorAlign.CENTER}));
            const text = column({x_expand: true}); text.add_child(label(name, 'ai-muted'));
            const value = label('—', 'ai-stat-value'); text.add_child(value); row.add_child(text);
            this.values[id] = value; this.actor.add_child(row);
        }
        this.actor.add_child(label('Se actualiza solo mientras está visible', 'ai-muted'));
        this.trigger = new St.Button({reactive: true, track_hover: true, accessible_name: 'Estadísticas del equipo', style_class: 'ai-stat-trigger'});
        this.trigger.connect('clicked', () => this.show(!this.open));
        this.trigger.connect('notify::hover', () => this.schedule(this.trigger.hover));
        this.actor.connect('notify::hover', () => this.schedule(this.actor.hover || this.trigger.hover));
        Main.layoutManager.addChrome(this.trigger, {trackFullscreen: true});
        Main.layoutManager.addChrome(this.actor, {trackFullscreen: true});
        this.actor.hide(); this.layout();
    }
    schedule(show) {
        if (this.hoverTimer) GLib.Source.remove(this.hoverTimer);
        this.hoverTimer = GLib.timeout_add(GLib.PRIORITY_DEFAULT, show ? 300 : 450, () => {
            this.hoverTimer = 0; this.show(show); return GLib.SOURCE_REMOVE;
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
        this.actor.set_width(Math.min(300 * scale, m.width - 16 * scale));
        this.actor.set_position(this.left ? m.x + 8 * scale : m.x + m.width - this.actor.width - 8 * scale, m.y + Math.max(40 * scale, (m.height - 400 * scale) / 2));
    }
    show(open) {
        this.open = open;
        if (this.timer) { GLib.Source.remove(this.timer); this.timer = 0; }
        if (!open) { this.actor.hide(); this.previous = null; return; }
        this.actor.show(); this.refresh();
        this.timer = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 2, () => { this.refresh(); return GLib.SOURCE_CONTINUE; });
    }
    refresh() {
        try {
            const nums = read('/proc/stat').split('\n')[0].trim().split(/\s+/).slice(1, 9).map(Number);
            const total = nums.reduce((a, b) => a + b, 0), idle = nums[3] + nums[4];
            const delta = this.previous ? total - this.previous.total : 0;
            this.values.cpu.text = delta > 0 ? `${Math.round(Math.max(0, Math.min(100, 100 * (1 - (idle - this.previous.idle) / delta))))}% en uso` : 'Midiendo…';
            this.previous = {total, idle};
            const mem = read('/proc/meminfo'), amount = key => Number(mem.match(new RegExp(`^${key}:\\s+(\\d+)`, 'm'))?.[1]) / 1048576;
            this.values.memory.text = `${(amount('MemTotal') - amount('MemAvailable')).toFixed(1)} / ${amount('MemTotal').toFixed(1)} GB`;
            const fs = Gio.File.new_for_path(GLib.get_home_dir()).query_filesystem_info('filesystem::size,filesystem::free', null);
            this.values.disk.text = `${Math.round(fs.get_attribute_uint64('filesystem::free') / 1073741824)} GB libres`;
            const minutes = Math.floor(Number(read('/proc/uptime').split(' ')[0]) / 60);
            this.values.uptime.text = `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
        } catch { for (const value of Object.values(this.values)) if (value.text === '—') value.text = 'No disponible'; }
    }
    destroy() {
        this.show(false); if (this.hoverTimer) GLib.Source.remove(this.hoverTimer);
        Main.layoutManager.removeChrome(this.actor); Main.layoutManager.removeChrome(this.trigger);
        this.actor.destroy(); this.trigger.destroy();
    }
}
