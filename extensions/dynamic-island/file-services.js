import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

export class IslandFiles {
    constructor(island) {
        this.island = island;
        this.watches = new Map();
        this.pending = new Map();
        this.downloads = null;
        this.syncDownloads();
    }

    syncShelf() {
        const e = this.island;
        for (const [path, watch] of this.watches) {
            if (!e._shelf.includes(path)) { watch.cancel(); this.watches.delete(path); }
        }
        for (const path of e._shelf) {
            if (this.watches.has(path)) continue;
            try {
                const watch = Gio.File.new_for_path(path).monitor_file(Gio.FileMonitorFlags.NONE, e._cancel);
                watch.connect('changed', (_watch, _file, _other, event) => {
                    if (event !== Gio.FileMonitorEvent.DELETED && event !== Gio.FileMonitorEvent.MOVED_OUT) return;
                    e._shelf = e._shelf.filter(value => value !== path);
                    e._shelfPins.delete(path);
                    e._shelfSelection.delete(path);
                    e._saveShelf();
                    e._renderShelf();
                });
                this.watches.set(path, watch);
            } catch (error) { console.debug(`Estante: ${error.message}`); }
        }
    }

    syncDownloads() {
        this.downloads?.cancel();
        this.downloads = null;
        for (const timer of this.pending.values()) this.island._clear(timer);
        this.pending.clear();
        const e = this.island;
        if (!e._settings.get_boolean('watch-downloads')) return;
        const path = GLib.get_user_special_dir(GLib.UserDirectory.DIRECTORY_DOWNLOAD);
        if (!path) return;
        try {
            this.downloads = Gio.File.new_for_path(path).monitor_directory(Gio.FileMonitorFlags.NONE, e._cancel);
            this.downloads.connect('changed', (_monitor, file, _other, event) => {
                const name = file.get_basename();
                if (!name || name.startsWith('.') || /\.(part|partial|crdownload|tmp|download)$/i.test(name)) return;
                if (![Gio.FileMonitorEvent.CHANGES_DONE_HINT, Gio.FileMonitorEvent.CREATED, Gio.FileMonitorEvent.MOVED_IN].includes(event)) return;
                const uri = file.get_uri();
                e._clear(this.pending.get(uri));
                this.pending.set(uri, e._timeout(2000, () => {
                    this.pending.delete(uri);
                    file.query_info_async('standard::type', Gio.FileQueryInfoFlags.NONE, GLib.PRIORITY_DEFAULT, e._cancel, (source, result) => {
                        try {
                            const info = source.query_info_finish(result);
                            if (e._alive && info.get_file_type() === Gio.FileType.REGULAR && !e._shelf.includes(source.get_path())) e._shelfAdd([uri]);
                        } catch {}
                    });
                    return GLib.SOURCE_REMOVE;
                }));
            });
        } catch (error) { console.debug(`Descargas: ${error.message}`); }
    }

    destroy() {
        this.downloads?.cancel();
        for (const watch of this.watches.values()) watch.cancel();
        for (const timer of this.pending.values()) this.island._clear(timer);
        this.watches.clear();
        this.pending.clear();
    }
}
