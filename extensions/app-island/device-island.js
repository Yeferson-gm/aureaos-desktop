import Clutter from 'gi://Clutter';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import St from 'gi://St';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import {column, label} from './ui.js';
import {scrollView} from './shared/scroll-view.js';
import {mergeDevices} from './device-model.js';

const PROPS = 'org.freedesktop.DBus.Properties';
const UPOWER = 'org.freedesktop.UPower';

function call(name, path, iface, method, params, cancel) {
    return new Promise((resolve, reject) => Gio.DBus.system.call(name, path, iface, method,
        params, null, Gio.DBusCallFlags.NONE, 2500, cancel, (bus, result) => {
            try { resolve(bus.call_finish(result).recursiveUnpack()); } catch (error) { reject(error); }
        }));
}

export async function readDevices(cancel) {
    const power = async () => {
        const [paths] = await call(UPOWER, '/org/freedesktop/UPower', UPOWER, 'EnumerateDevices', null, cancel);
        const results = await Promise.allSettled(paths.slice(0, 32).map(async path => {
            const [props] = await call(UPOWER, path, PROPS, 'GetAll', new GLib.Variant('(s)', [`${UPOWER}.Device`]), cancel);
            return {...props, path};
        }));
        return results.filter(result => result.status === 'fulfilled').map(result => result.value);
    };
    const [batteries, bluetooth] = await Promise.allSettled([power(),
        call('org.bluez', '/', 'org.freedesktop.DBus.ObjectManager', 'GetManagedObjects', null, cancel)]);
    if (cancel.is_cancelled()) return [];
    return mergeDevices(batteries.status === 'fulfilled' ? batteries.value : [],
        bluetooth.status === 'fulfilled' ? bluetooth.value[0] : {});
}

export class DeviceIsland {
    constructor(owner, loader = readDevices) {
        this.owner = owner;
        this.loader = loader;
        this.open = false;
        this.subscriptions = [];
        this.trigger = new St.Widget({reactive: true, track_hover: true, accessible_name: 'Baterías de dispositivos'});
        this.actor = column({style_class: 'ai-device-island', reactive: true, track_hover: true, visible: false});
        this.actor.add_child(label('DISPOSITIVOS', 'ai-device-heading'));
        this.scroll = scrollView({hscrollbar_policy: St.PolicyType.NEVER, vscrollbar_policy: St.PolicyType.EXTERNAL});
        this.rows = column({style_class: 'ai-device-list'});
        this.scroll.set_child(this.rows);
        this.actor.add_child(this.scroll);
        this.trigger.connect('notify::hover', () => this.schedule());
        this.actor.connect('notify::hover', () => this.schedule());
        Main.layoutManager.addChrome(this.trigger, {trackFullscreen: true});
        Main.layoutManager.addChrome(this.actor, {trackFullscreen: true});
        this.layout();
    }

    schedule() {
        this.owner._clear(this.hoverTimer);
        const show = this.actor.hover || this.trigger.hover;
        this.hoverTimer = this.owner._timeout(show ? 180 : 430, () => {
            this.hoverTimer = 0;
            this.show(this.actor.hover || this.trigger.hover);
        });
    }

    layout() {
        this.show(false, false);
        const monitor = this.owner._monitor();
        if (!monitor) return;
        const scale = St.ThemeContext.get_for_stage(global.stage).scale_factor;
        this.side = this.owner._side() === 'right' ? 'left' : 'right';
        let border = this.side === 'left' ? monitor.x : monitor.x + monitor.width;
        const shared = Main.layoutManager.monitors.some(other => other !== monitor &&
            other.y < monitor.y + monitor.height && other.y + other.height > monitor.y &&
            (this.side === 'left' ? other.x + other.width === border : other.x === border));
        this.center = shared ? 0.84 : 0.5;
        if (shared) { this.side = this.owner._side(); border = this.side === 'left' ? monitor.x : monitor.x + monitor.width; }
        this.trigger.visible = !this.owner._sharedEdge && !(Main.overview.visibleTarget ?? Main.overview.visible) && !global.display.get_monitor_in_fullscreen(monitor.index);
        this.trigger.set_position(this.side === 'left' ? border : border - 3 * scale, monitor.y + monitor.height * this.center - 48 * scale);
        this.trigger.set_size(3 * scale, 96 * scale);
        this.actor.set_width(224 * scale);
        this.actor.set_style_class_name(`ai-device-island ai-device-${this.side}${this.owner._a11y.get_boolean('high-contrast') ? ' ai-contrast' : ''}`);
        this.scroll.set_style(`max-height: ${Math.max(100, Math.min(430, monitor.height / scale - 140))}px;`);
        this.position();
    }

    position() {
        const m = this.owner._monitor();
        if (!m) return;
        const h = this.actor.get_preferred_height(this.actor.width)[1];
        this.actor.set_position(this.side === 'left' ? m.x : m.x + m.width - this.actor.width,
            m.y + Math.max(40, Math.min(m.height - h - 16, m.height * this.center - h / 2)));
    }

    show(open, animate = true) {
        this.owner._clear(this.hoverTimer); this.hoverTimer = 0;
        if (open === this.open) {
            if (!open && !animate) { this.actor.remove_all_transitions(); this.actor.hide(); }
            return;
        }
        this.open = open;
        const visible = this.actor.visible;
        this.actor.remove_all_transitions();
        if (!open) {
            this.cancel?.cancel(); this.cancel = null;
            this.owner._clear(this.refreshTimer); this.refreshTimer = 0;
            for (const id of this.subscriptions) Gio.DBus.system.signal_unsubscribe(id);
            this.subscriptions = [];
            this.actor.ease({opacity: 0, translation_x: this.side === 'left' ? -24 : 24,
                duration: animate ? this.owner._duration(180) : 0, mode: Clutter.AnimationMode.EASE_OUT_CUBIC,
                onComplete: () => { if (!this.open) this.actor.hide(); }});
            return;
        }
        this.cancel = new Gio.Cancellable();
        this.actor.show();
        if (!visible) { this.actor.opacity = 0; this.actor.translation_x = this.side === 'left' ? -24 : 24; }
        this.render([], 'Consultando baterías…');
        this.actor.ease({opacity: 255, translation_x: 0, duration: this.owner._duration(220), mode: Clutter.AnimationMode.EASE_OUT_CUBIC});
        for (const [name, iface] of [['org.bluez', PROPS], ['org.bluez', 'org.freedesktop.DBus.ObjectManager'],
            [UPOWER, PROPS], [UPOWER, UPOWER]]) {
            this.subscriptions.push(Gio.DBus.system.signal_subscribe(name, iface, null, null, null, Gio.DBusSignalFlags.NONE, () => this.scheduleRefresh()));
        }
        this.refresh();
    }

    scheduleRefresh() {
        if (!this.open || this.refreshTimer) return;
        this.refreshTimer = this.owner._timeout(120, () => { this.refreshTimer = 0; this.refresh(); });
    }

    async refresh() {
        const cancel = this.cancel;
        if (!cancel || this.reading === cancel) { this.dirty = true; return; }
        this.reading = cancel; this.dirty = false;
        try {
            const devices = await this.loader(cancel);
            if (this.cancel === cancel && !cancel.is_cancelled()) this.render(devices);
        } catch {
            if (this.cancel === cancel && !cancel.is_cancelled()) this.render([], 'No se pudieron consultar las baterías.');
        } finally {
            if (this.reading === cancel) this.reading = null;
            if (this.open && this.dirty) this.scheduleRefresh();
        }
    }

    render(devices, empty = 'Conecta un mouse, teclado o audífonos para ver su batería.') {
        this.rows.destroy_all_children();
        if (!devices.length) {
            const hint = label(empty, 'ai-device-status');
            hint.clutter_text.set_line_wrap(true); this.rows.add_child(hint);
        }
        for (const device of devices) {
            const row = new St.BoxLayout({style_class: 'ai-device-row', accessible_name: `${device.name}: ${device.percentage ?? 'sin dato'}%`});
            const meter = new St.Widget({width: 44, height: 44, layout_manager: new Clutter.BinLayout()});
            const ring = new St.DrawingArea({x_expand: true, y_expand: true});
            ring.connect('repaint', actor => {
                const cr = actor.get_context(), [w, h] = actor.get_surface_size();
                cr.setLineWidth(3); cr.setLineCap(1); cr.setSourceRGBA(1, 1, 1, 0.14);
                cr.arc(w / 2, h / 2, Math.min(w, h) / 2 - 3, 0, Math.PI * 2); cr.stroke();
                if (device.percentage !== null && device.percentage > 0) {
                    const color = device.percentage <= 15 ? [1, .36, .36] : device.percentage <= 30 ? [1, .76, .3] : [.32, .87, .55];
                    cr.setSourceRGB(...color); cr.arc(w / 2, h / 2, Math.min(w, h) / 2 - 3, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * device.percentage / 100); cr.stroke();
                }
                cr.$dispose();
            });
            meter.add_child(ring);
            meter.add_child(new St.Icon({icon_name: device.charging ? 'battery-level-100-charging-symbolic' : device.icon,
                icon_size: 20, x_align: Clutter.ActorAlign.CENTER, y_align: Clutter.ActorAlign.CENTER}));
            row.add_child(meter);
            const text = column({x_expand: true, y_align: Clutter.ActorAlign.CENTER});
            text.add_child(label(device.name, 'ai-device-name'));
            text.add_child(label(device.percentage === null ? 'Batería no reportada' : `${device.percentage}%${device.charging ? ' · Cargando' : ''}`, 'ai-device-status'));
            row.add_child(text); this.rows.add_child(row);
        }
        this.position();
    }

    destroy() {
        this.show(false, false);
        this.owner._clear(this.hoverTimer);
        this.actor.remove_all_transitions();
        for (const actor of [this.actor, this.trigger]) { Main.layoutManager.removeChrome(actor); actor.destroy(); }
    }
}
