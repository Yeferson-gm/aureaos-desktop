import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

const BUS = 'org.gnome.SettingsDaemon.Power';
const PATH = '/org/gnome/SettingsDaemon/Power';
const INTERFACE = `${BUS}.Keyboard`;
const Proxy = Gio.DBusProxy.makeProxyWrapper(`<node><interface name="${INTERFACE}">
    <property name="Brightness" type="i" access="readwrite"/>
    <property name="Steps" type="i" access="read"/>
</interface></node>`);

export class KeyboardLight {
    constructor() {
        this.listeners = new Set();
        this.signals = [];
        this.cancel = new Gio.Cancellable();
        this.lastLevel = 1;
        this.error = null;
        this.proxy = new Proxy(Gio.DBus.session, BUS, PATH, (proxy, error) => {
            if (this.dead) return;
            if (error) this.error = error.message;
            for (const signal of ['g-properties-changed', 'notify::g-name-owner'])
                this.signals.push(proxy.connect(signal, () => this.refresh()));
            this.refresh();
        }, this.cancel);
    }
    onChange(callback) { this.listeners.add(callback); return () => this.listeners.delete(callback); }
    emit() { if (!this.dead) this.listeners.forEach(callback => callback()); }
    get available() { return !!this.proxy?.g_name_owner && Number.isInteger(this.proxy.Brightness) && this.proxy.Brightness >= 0; }
    get level() { return this.available ? Math.max(0, Math.min(1, this.proxy.Brightness / 100)) : 0; }
    refresh() {
        if (this.available) this.error = null;
        if (this.level > 0) this.lastLevel = this.level;
        this.emit();
    }
    toggle() { this.setLevel((this.queued ?? (this.pending ? this.requested : this.level * 100)) > 0 ? 0 : this.lastLevel); }
    setLevel(level) {
        if (this.dead || !this.available || !Number.isFinite(level)) return;
        this.queued = Math.round(Math.max(0, Math.min(1, level)) * 100);
        this.flush();
    }
    flush() {
        if (this.dead || this.pending || this.queued === undefined) return;
        if (!this.available) { this.queued = undefined; return; }
        const target = this.queued;
        this.queued = undefined;
        this.requested = target;
        this.pending = true;
        this.error = null;
        Gio.DBus.session.call(BUS, PATH, 'org.freedesktop.DBus.Properties', 'Set',
            new GLib.Variant('(ssv)', [INTERFACE, 'Brightness', new GLib.Variant('i', target)]),
            null, Gio.DBusCallFlags.NONE, 3000, this.cancel, (connection, result) => {
                try { connection.call_finish(result); }
                catch (error) { if (!this.dead) { this.error = error.message; this.queued = undefined; } }
                if (this.dead) return;
                this.pending = false;
                this.emit();
                this.flush();
            });
    }
    destroy() {
        this.dead = true;
        this.cancel.cancel();
        this.signals.forEach(id => this.proxy.disconnect(id));
        this.signals = [];
        this.proxy = null;
        this.listeners.clear();
    }
}
