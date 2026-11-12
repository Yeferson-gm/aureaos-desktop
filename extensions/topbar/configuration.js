import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import {normalizeConfig} from './settings-model.js';
export class Config {
    constructor() {
        this.path = GLib.build_filenamev([GLib.get_user_config_dir(), 'lintel-v2', 'config.json']);
        this._listeners = new Set();
        this._timer = 0;
        this.load();
        const dir = Gio.File.new_for_path(GLib.path_get_dirname(this.path));
        GLib.mkdir_with_parents(dir.get_path(), 0o700);
        this._monitor = dir.monitor_directory(Gio.FileMonitorFlags.NONE, null);
        this._monitor.connect('changed', (_monitor, file, other) => {
            if (![file?.get_path(), other?.get_path()].includes(this.path)) return;
            if (this._timer) GLib.source_remove(this._timer);
            this._timer = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 120, () => {
                this._timer = 0;
                if (this.load()) this._listeners.forEach(fn => fn());
                return GLib.SOURCE_REMOVE;
            });
        });
    }
    load() {
        try {
            const [ok, bytes] = GLib.file_get_contents(this.path);
            const parsed = ok ? JSON.parse(new TextDecoder().decode(bytes)) : {};
            if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Configuración inválida');
            if (this.values && JSON.stringify(parsed) === JSON.stringify(this.raw)) return false;
            this.raw = parsed;
        } catch (error) {
            if (this.values) return false;
            this.raw = {};
        }
        this.values = normalizeConfig(this.raw);
        return true;
    }
    save(patch) {
        const next = {...this.raw, ...patch};
        const values = normalizeConfig(next);
        const data = new TextEncoder().encode(JSON.stringify({...next, ...values}, null, 2) + '\n');
        Gio.File.new_for_path(this.path).replace_contents(data, null, false, Gio.FileCreateFlags.PRIVATE, null);
        this.raw = {...next, ...values};
        this.values = values;
        this._listeners.forEach(fn => fn());
    }
    onChange(fn) { this._listeners.add(fn); return () => this._listeners.delete(fn); }
    destroy() {
        if (this._timer) GLib.source_remove(this._timer);
        this._timer = 0;
        this._monitor?.cancel();
        this._listeners.clear();
    }
}
