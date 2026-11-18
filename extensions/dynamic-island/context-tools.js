import Clutter from 'gi://Clutter';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import St from 'gi://St';
import Pango from 'gi://Pango';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

const column = style => new St.BoxLayout({orientation: Clutter.Orientation.VERTICAL, style_class: style, x_expand: true});
const bytes = value => GLib.format_size(Math.max(0, value));

export class ContextTools {
    constructor(island) {
        this.island = island;
        this.pages = new Map();
        this.deviceRevision = 0;
        this.signals = [];
        this.interface = new Gio.Settings({schema_id: 'org.gnome.desktop.interface'});
    }

    build(id) {
        const page = this.island._newPage(id);
        page.add_style_class_name('di-context-page');
        this.pages.set(id, page);
        this.render(id);
    }

    heading(parent, title, description) {
        if (title) parent.add_child(this.island._label(title, 'di-context-heading'));
        const hint = this.island._label(description, 'di-hint', {width: 374});
        hint.clutter_text.set_line_wrap(true);
        parent.add_child(hint);
    }

    card(parent, title, description, icon, action = null) {
        const row = new St.BoxLayout({style_class: 'di-context-row', x_expand: true});
        row.add_child(new St.Icon({icon_name: icon, icon_size: 23, style_class: 'di-context-icon', y_align: Clutter.ActorAlign.CENTER}));
        const text = column('di-context-copy');
        const name = this.island._label(title, 'di-context-title', {width: 276});
        name.clutter_text.set_ellipsize(Pango.EllipsizeMode.END); text.add_child(name);
        const detail = this.island._label(description, 'di-context-description', {width: 276});
        detail.clutter_text.set_ellipsize(Pango.EllipsizeMode.END); text.add_child(detail); row.add_child(text);
        if (action) {
            const button = new St.Button({style_class: 'di-context-card', reactive: true, can_focus: true, x_expand: true, accessible_name: `${title}: ${description}`});
            button.set_child(row); button.connect('clicked', action); parent.add_child(button);
        } else {
            row.add_style_class_name('di-context-card'); parent.add_child(row);
        }
        return {name, detail, row};
    }

    watch(object, signal, callback) {
        this.signals.push([object, object.connect(signal, callback)]);
    }

    activate(id) {
        this.stop();
        if (!this.island._menu.isOpen || !this.pages.has(id)) return;
        this.active = id; this.cancel = new Gio.Cancellable();
        this.render(id);
        if (id === 'downloads') {
            const folder = this.downloadFolder();
            if (!folder) return;
            try {
                this.monitor = folder.monitor_directory(Gio.FileMonitorFlags.NONE, this.cancel);
                this.monitor.connect('changed', () => {
                    this.island._clear(this.debounce);
                    this.debounce = this.island._timeout(250, () => { this.debounce = 0; if (this.active === id) this.loadDownloads(); return GLib.SOURCE_REMOVE; });
                });
            } catch {}
        } else if (id === 'world') {
            this.watch(this.island._settings, 'changed::world-clocks', () => this.renderWorld());
            this.timer = this.island._timeout(30000, () => { this.renderWorld(); return GLib.SOURCE_CONTINUE; });
        } else if (id === 'devices') {
            this.watch(Main.layoutManager, 'monitors-changed', () => this.renderDevices());
            const volumes = Gio.VolumeMonitor.get();
            for (const signal of ['mount-added', 'mount-removed', 'mount-changed']) this.watch(volumes, signal, () => this.renderDevices());
        } else if (id === 'tools') {
            this.watch(this.interface, 'changed::color-scheme', () => this.syncControls());
            this.watch(this.island._notificationSettings, 'changed::show-banners', () => this.syncControls());
            const mixer = this.island._mixer;
            if (mixer) {
                this.watch(mixer, 'default-source-changed', () => this.activate('tools'));
                const source = mixer.get_default_source();
                if (source) this.watch(source, 'notify::is-muted', () => this.syncControls());
            }
        }
    }

    stop() {
        this.active = null;
        this.deviceRevision++;
        this.cancel?.cancel(); this.cancel = null;
        this.downloadCancel?.cancel(); this.downloadCancel = null;
        this.monitor?.cancel(); this.monitor = null;
        for (const [object, signal] of this.signals) object.disconnect(signal);
        this.signals = [];
        this.island._clear(this.timer); this.timer = 0;
        this.island._clear(this.debounce); this.debounce = 0;
    }

    render(id) {
        if (id === 'downloads') this.renderDownloads();
        else if (id === 'world') this.renderWorld();
        else if (id === 'devices') this.renderDevices();
        else if (id === 'tools') this.renderControls();
    }

    downloadFolder() {
        const path = GLib.get_user_special_dir(GLib.UserDirectory.DIRECTORY_DOWNLOAD);
        return path ? Gio.File.new_for_path(path) : null;
    }

    renderDownloads() {
        const page = this.pages.get('downloads'); page.destroy_all_children();
        this.heading(page, null, 'Abre un archivo o añádelo al estante. No se hacen copias.');
        const scroll = this.island._scroll(80); this.downloadScroll = scroll; this.downloadList = column('di-context-list'); scroll.set_child(this.downloadList); page.add_child(scroll);
        this.downloadStatus = this.island._label('Abre esta vista para leer tu carpeta Descargas.', 'di-hint'); page.add_child(this.downloadStatus);
        page.add_child(this.island._chip('Abrir carpeta Descargas', () => { const file = this.downloadFolder(); if (file) this.island._openUri(file.get_uri()); }, 'folder-download-symbolic'));
        if (this.active === 'downloads') this.loadDownloads();
    }

    async loadDownloads() {
        this.downloadCancel?.cancel();
        const cancel = new Gio.Cancellable(); this.downloadCancel = cancel;
        const folder = this.downloadFolder();
        if (!folder) { this.downloadStatus.text = 'No hay una carpeta Descargas configurada.'; return; }
        this.downloadStatus.text = 'Leyendo Descargas…';
        let cursor;
        try {
            cursor = await new Promise((resolve, reject) => folder.enumerate_children_async('standard::name,standard::display-name,standard::type,standard::size,standard::is-hidden,time::modified', Gio.FileQueryInfoFlags.NOFOLLOW_SYMLINKS, GLib.PRIORITY_DEFAULT, cancel, (file, result) => { try { resolve(file.enumerate_children_finish(result)); } catch (error) { reject(error); } }));
            let infos = [], exhausted = false;
            while (infos.length < 1000 && !cancel.is_cancelled()) {
                const batch = await new Promise((resolve, reject) => cursor.next_files_async(100, GLib.PRIORITY_DEFAULT, cancel, (enumerator, result) => { try { resolve(enumerator.next_files_finish(result)); } catch (error) { reject(error); } }));
                infos.push(...batch); if (batch.length < 100) { exhausted = true; break; }
            }
            if (cancel.is_cancelled() || this.active !== 'downloads') return;
            const recent = infos.filter(info => info.get_file_type() === Gio.FileType.REGULAR && !info.get_is_hidden() && !/\.(part|partial|crdownload|tmp|download)$/i.test(info.get_name()))
                .sort((a,b) => b.get_attribute_uint64('time::modified') - a.get_attribute_uint64('time::modified')).slice(0, 12);
            this.downloadList.destroy_all_children();
            for (const info of recent) {
                const file = folder.get_child(info.get_name());
                const row = new St.BoxLayout({style_class: 'di-context-download'});
                const date = new Date(info.get_attribute_uint64('time::modified') * 1000).toLocaleDateString('es', {day: 'numeric', month: 'short'});
                this.card(row, info.get_display_name(), `${bytes(info.get_size())} · ${date}`, 'text-x-generic-symbolic', () => this.island._openUri(file.get_uri()));
                const add = this.island._iconBtn('list-add-symbolic', () => this.island._shelfAdd([file.get_uri()]));
                add.accessible_name = `Añadir ${info.get_display_name()} al estante`; row.add_child(add); this.downloadList.add_child(row);
            }
            this.downloadScroll.height = Math.min(300, Math.max(60, recent.length * 76));
            this.island._resizeIsland();
            this.downloadStatus.text = recent.length ? `${recent.length} ${recent.length === 1 ? 'archivo' : 'archivos'}${exhausted ? ' · más recientes primero' : ' · muestra de 1000 entradas'}` : 'No hay archivos descargados para mostrar.';
        } catch (error) {
            if (!cancel.is_cancelled() && this.active === 'downloads') this.downloadStatus.text = 'No se pudo leer Descargas. Abre la carpeta para comprobarla.';
        } finally {
            cursor?.close_async(GLib.PRIORITY_DEFAULT, null, () => {});
        }
    }

    renderWorld() {
        const page = this.pages.get('world'); if (!page) return;
        page.destroy_all_children();
        this.heading(page, null, 'Fecha y hora de cada ciudad. Personaliza las zonas en Ajustes.');
        const now = new Date();
        for (const zone of this.island._settings.get_strv('world-clocks').slice(0, 4)) {
            try {
                const time = now.toLocaleTimeString('es', {timeZone: zone, hour: '2-digit', minute: '2-digit'});
                const day = now.toLocaleDateString('es', {timeZone: zone, weekday: 'long', day: 'numeric', month: 'short'});
                const city = zone.split('/').at(-1).replaceAll('_', ' ');
                const {name, detail} = this.card(page, time, `${city} · ${day}`, 'preferences-system-time-symbolic');
                name.add_style_class_name('di-context-time'); detail.accessible_name = `${city}, ${day}`;
            } catch { this.card(page, zone, 'Zona horaria no válida; corrígela en Ajustes.', 'dialog-warning-symbolic'); }
        }
        if (!this.island._settings.get_strv('world-clocks').length) page.add_child(this.island._label('Añade una ciudad en Ajustes → Relojes del mundo.', 'di-hint'));
    }

    renderDevices() {
        const page = this.pages.get('devices'); if (!page) return;
        page.destroy_all_children();
        const revision = ++this.deviceRevision;
        this.heading(page, 'Pantallas', 'Monitores conectados y área de escritorio disponible.');
        for (const monitor of Main.layoutManager.monitors) this.card(page, `Pantalla ${monitor.index + 1}${monitor.index === Main.layoutManager.primaryIndex ? ' · Principal' : ''}`, `${monitor.width} × ${monitor.height} · ${Math.round((monitor.geometry_scale ?? 1) * 100)} %`, 'video-display-symbolic');
        page.add_child(this.island._chip('Configurar pantallas', () => { this.island._closeIsland(); this.island._spawn(['gnome-control-center', 'display']); }, 'preferences-system-symbolic'));
        this.heading(page, 'Discos y ubicaciones', 'Abre las unidades montadas. Su contenido permanece en su ubicación original.');
        const mounts = Gio.VolumeMonitor.get().get_mounts().filter(mount => !mount.is_shadowed()).slice(0, 8);
        if (!mounts.length) page.add_child(this.island._label('No hay unidades adicionales montadas.', 'di-hint'));
        const cancel = this.cancel;
        for (const mount of mounts) {
            const root = mount.get_root();
            const {detail} = this.card(page, mount.get_name(), root.is_native() ? 'Consultando espacio…' : 'Ubicación de red', root.is_native() ? 'drive-harddisk-symbolic' : 'folder-remote-symbolic', () => this.island._openUri(root.get_uri()));
            if (!root.is_native() || this.active !== 'devices') continue;
            root.query_filesystem_info_async('filesystem::size,filesystem::free', GLib.PRIORITY_DEFAULT, cancel, (file, result) => {
                try {
                    const info = file.query_filesystem_info_finish(result);
                    if (cancel !== this.cancel || cancel.is_cancelled() || revision !== this.deviceRevision) return;
                    detail.text = `${bytes(info.get_attribute_uint64('filesystem::free'))} libres de ${bytes(info.get_attribute_uint64('filesystem::size'))}`;
                } catch { if (cancel === this.cancel && !cancel?.is_cancelled() && revision === this.deviceRevision) detail.text = 'Espacio no disponible'; }
            });
        }
    }

    renderControls() {
        const e = this.island, page = this.pages.get('tools'); page.destroy_all_children();
        this.heading(page, null, 'El estado se sincroniza con GNOME. Pulsa una tarjeta para cambiarlo.');
        this.controls = new Map();
        const actions = [
            ['focus', 'Concentración', 'notifications-disabled-symbolic', () => e._notificationSettings.set_boolean('show-banners', !e._notificationSettings.get_boolean('show-banners'))],
            ['dark', 'Tema oscuro', 'weather-clear-night-symbolic', () => this.interface.set_string('color-scheme', this.interface.get_string('color-scheme') === 'prefer-dark' ? 'default' : 'prefer-dark')],
            ['awake', 'Mantener despierto', 'display-brightness-symbolic', () => e._awake.mode ? e._stopAwake() : e._toggleAwake(30)],
            ['microphone', 'Micrófono', 'audio-input-microphone-symbolic', () => { const source = e._mixer?.get_default_source(); source?.change_is_muted(!source.is_muted); }],
        ];
        for (const [id, title, icon, action] of actions) {
            const card = this.card(page, title, '', icon, action); this.controls.set(id, card);
        }
        const captures = new St.BoxLayout({style_class: 'di-glance-actions'});
        captures.add_child(e._chip('Captura', () => e._requestCapture(false), 'camera-photo-symbolic'));
        captures.add_child(e._chip('Grabar pantalla', () => e._requestCapture(true), 'media-record-symbolic')); page.add_child(captures);
        e._captureHistory = column('di-context-list'); page.add_child(e._captureHistory);
        if (e._captureFiles.length) {
            e._captureHistory.add_child(e._label('Capturas de esta sesión', 'di-context-heading'));
            for (const uri of e._captureFiles) e._captureHistory.add_child(e._chip(Gio.File.new_for_uri(uri).get_basename(), () => e._openUri(uri), 'image-x-generic-symbolic'));
        }
        this.syncControls();
    }

    syncControls() {
        if (!this.controls || this.active !== 'tools') return;
        const e = this.island, source = e._mixer?.get_default_source();
        const states = {
            focus: [!e._notificationSettings.get_boolean('show-banners'), 'Activada', 'Desactivada'],
            dark: [this.interface.get_string('color-scheme') === 'prefer-dark', 'Oscuro', 'Claro o predeterminado'],
            awake: [!!e._awake.mode, e._awake.mode === 'inf' ? 'Activo hasta desactivarlo' : `Activo hasta ${new Date(e._awake.end).toLocaleTimeString('es', {hour: '2-digit', minute: '2-digit'})}`, 'Desactivado'],
            microphone: [source && !source.is_muted, 'Activado', source ? 'Silenciado' : 'Sin micrófono disponible'],
        };
        for (const [id, [active, on, off]] of Object.entries(states)) {
            const card = this.controls.get(id); card.detail.text = active ? on : off;
            const button = card.row.get_parent();
            if (active) button.add_style_class_name('di-context-enabled'); else button.remove_style_class_name('di-context-enabled');
            button.accessible_name = `${card.name.text}: ${card.detail.text}`;
            if (id === 'microphone') { button.reactive = !!source; button.can_focus = !!source; }
        }
    }

    destroy() { this.stop(); this.pages.clear(); this.controls = null; }
}
