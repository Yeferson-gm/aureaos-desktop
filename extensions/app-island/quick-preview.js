import {scrollView} from './shared/scroll-view.js';
import Clutter from 'gi://Clutter';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import St from 'gi://St';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import {column, label, button, entry} from './ui.js';
import {normalize} from './model.js';

export class QuickPreview {
    constructor(owner) { this.owner = owner; this.serial = 0; }
    bind(actor, open) {
        actor.track_hover = true;
        actor.connect('notify::hover', () => {
            this.cancelTimer();
            this.timer = this.owner._timeout(actor.hover ? 300 : 450, () => {
                this.timer = 0;
                if (actor.hover) { if (this.anchor !== actor || !this.actor) open(); }
                else if (!this.actor?.hover) this.close();
            });
        });
    }
    cancelTimer() { this.owner._clear(this.timer); this.timer = 0; }
    create(title, anchor) {
        this.close(); this.anchor = anchor;
        const dark = this.owner.settings.theme !== 'light';
        if (!this.surface) {
            this.surface = column({reactive: true, track_hover: true});
            Main.layoutManager.addChrome(this.surface, {trackFullscreen: false});
        }
        this.actor = this.surface; this.actor.destroy_all_children();
        this.actor.style_class = `ai-quick-preview${dark ? ' ai-quick-dark' : ''}`;
        this.actor.show();
        const head = new St.BoxLayout({style_class: 'ai-head'}); this.title = label(title, 'ai-title'); this.title.x_expand = true; head.add_child(this.title);
        head.add_child(button('Cerrar', () => this.close(), 'window-close-symbolic')); this.actor.add_child(head);
        this.status = label('', 'ai-muted'); this.actor.add_child(this.status);
        this.scroll = scrollView({x_expand: true, hscrollbar_policy: St.PolicyType.NEVER, vscrollbar_policy: St.PolicyType.EXTERNAL});
        this.body = column({style_class: 'ai-list'}); this.scroll.set_child(this.body); this.actor.add_child(this.scroll);
        this.footer = new St.BoxLayout({style_class: 'ai-line'}); this.actor.add_child(this.footer);
        if (this.hoverSignal) this.actor.disconnect(this.hoverSignal);
        this.hoverSignal = this.actor.connect('notify::hover', () => {
            if (!this.actor) return;
            this.cancelTimer();
            if (!this.actor.hover) this.timer = this.owner._timeout(450, () => { this.timer = 0; if (!this.anchor?.hover) this.close(); });
        });
        this.capture = global.stage.connect('captured-event', (_stage, event) => {
            if (event.type() === Clutter.EventType.KEY_PRESS && event.get_key_symbol() === Clutter.KEY_Escape) this.close();
            if (event.type() === Clutter.EventType.BUTTON_PRESS) {
                const [x, y] = event.get_coords(), [ax, ay] = this.actor.get_transformed_position();
                if (x < ax || y < ay || x > ax + this.actor.width || y > ay + this.actor.height) {
                    const [bx, by] = this.anchor.get_transformed_position();
                    if (x < bx || y < by || x > bx + this.anchor.width || y > by + this.anchor.height) this.close();
                }
            }
            return Clutter.EVENT_PROPAGATE;
        });
        this.owner._reveal(true); this.position();
        const actor = this.actor;
        actor.opacity = 0;
        this.animationTimer = this.owner._timeout(20, () => {
            this.animationTimer = 0;
            if (this.actor === actor && actor.get_stage()) actor.ease({opacity: 255, duration: this.owner._duration(140), mode: Clutter.AnimationMode.EASE_OUT_CUBIC});
        });
    }
    position() {
        if (!this.actor?.get_stage()) return;
        const m = this.owner._monitor(), scale = St.ThemeContext.get_for_stage(global.stage).scale_factor;
        const width = Math.min(338 * scale, m.width - 32 * scale);
        this.actor.set_width(width); this.scroll.set_style(`max-height: ${Math.max(120, Math.min(360, m.height / scale - 220))}px;`);
        const [x, y] = this.anchor.get_transformed_position();
        const height = this.actor.get_preferred_height(width)[1];
        const preferred = this.owner._side() === 'right' ? x - width - 8 * scale : x + this.anchor.width + 8 * scale;
        this.actor.set_position(Math.max(m.x + 8 * scale, Math.min(preferred, m.x + m.width - width - 8 * scale)),
            Math.max(m.y + 36 * scale, Math.min(y, m.y + m.height - height - 12 * scale)));
    }
    grid(items, icon, name, activate) {
        this.body.destroy_all_children();
        const grid = new St.Widget({layout_manager: new Clutter.GridLayout({column_homogeneous: true}), x_expand: true});
        items.forEach((item, index) => {
            const cell = button(name(item), () => activate(item)); cell.add_style_class_name('ai-preview-cell');
            const content = column({style_class: 'ai-preview-cell-content'}), image = icon(item); image.x_align = Clutter.ActorAlign.CENTER;
            content.add_child(image); content.add_child(label(name(item), 'ai-preview-name')); cell.set_child(content);
            grid.layout_manager.attach(cell, index % 3, Math.floor(index / 3), 1, 1);
        });
        for (let i = items.length; i < 3; i++) grid.layout_manager.attach(new St.Widget({width: 90}), i, 0, 1, 1);
        this.body.add_child(grid); this.position();
    }
    group(category, anchor) {
        this.create(category.name, anchor); this.groupId = category.id;
        const items = this.owner._model.profile.items.filter(item => item.category === category.id);
        this.status.text = `${items.length} accesos · abre uno o todo el grupo`;
        this.grid(items, item => this.owner._icon(item, 40), item => this.owner._name(item), item => { this.close(); this.owner._launch(item); });
        this.footer.add_child(button('Organizar', () => { this.close(); this.owner._setOpen(true); this.owner._categoryActions(category); }));
        this.footer.add_child(button('Abrir grupo', () => { this.close(); this.owner._openGroup(category.id); }));
        this.position();
    }
    folder(item, anchor) {
        this.create(this.owner._name(item), anchor); this.root = Gio.File.new_for_uri(item.target); this.file = this.root; this.query = ''; this.sortRecent = false;
        const tools = new St.BoxLayout({style_class: 'ai-line'});
        this.up = button('Subir una carpeta', () => { const parent = this.file.get_parent(); if (parent) this.load(parent); }, 'go-up-symbolic'); tools.add_child(this.up);
        this.search = entry('Buscar en esta carpeta'); this.search.set_primary_icon(new St.Icon({icon_name: 'edit-find-symbolic', icon_size: 16})); this.search.clutter_text.connect('text-changed', () => { this.query = normalize(this.search.get_text()); this.renderFiles(); }); tools.add_child(this.search);
        tools.add_child(button('Ordenar por nombre o fecha', actor => { this.sortRecent = !this.sortRecent; actor.label = this.sortRecent ? 'Recientes' : 'A–Z'; this.renderFiles(); })); tools.get_last_child().label = 'A–Z';
        this.actor.insert_child_at_index(tools, 2);
        this.footer.add_child(button('Abrir en Archivos', () => { const uri = this.file.get_uri(); this.close(); this.owner._launch({type: 'uri', target: uri, alias: ''}); }));
        this.footer.add_child(button('Fijar carpeta', () => { const uri = this.file.get_uri(); this.close(); this.owner._addResource(uri); }));
        this.load(this.file);
    }
    load(file) {
        this.cancel?.cancel(); this.monitor?.cancel(); this.monitor = null;
        this.cancel = new Gio.Cancellable(); const serial = ++this.serial; this.file = file; this.entries = []; this.status.text = 'Leyendo carpeta…';
        this.title.text = file.get_basename(); this.up.reactive = !file.equal(this.root); this.up.opacity = this.up.reactive ? 255 : 70;
        this.body.destroy_all_children(); this.position();
        file.enumerate_children_async('standard::name,standard::display-name,standard::icon,standard::type,standard::is-hidden,time::modified', Gio.FileQueryInfoFlags.NONE, GLib.PRIORITY_DEFAULT, this.cancel, (source, result) => {
            try {
                const cursor = source.enumerate_children_finish(result);
                cursor.next_files_async(121, GLib.PRIORITY_DEFAULT, this.cancel, (enumerator, batch) => {
                    try {
                        const infos = enumerator.next_files_finish(batch);
                        if (!this.actor || serial !== this.serial) return;
                        this.limited = infos.length > 120;
                        this.entries = infos.slice(0, 120).filter(info => !info.get_is_hidden()).map(info => ({info, file: file.get_child(info.get_name())}));
                        this.renderFiles();
                        this.monitor = file.monitor_directory(Gio.FileMonitorFlags.NONE, this.cancel);
                        this.monitor.connect('changed', () => { this.owner._clear(this.refreshTimer); this.refreshTimer = this.owner._timeout(200, () => { this.refreshTimer = 0; if (this.actor) this.load(this.file); }); });
                    } catch (error) { if (this.actor && serial === this.serial) this.status.text = `No se pudo leer: ${error.message}`; }
                    finally { enumerator.close_async(GLib.PRIORITY_DEFAULT, null, () => {}); }
                });
            } catch (error) { if (this.actor && serial === this.serial) this.status.text = `No se pudo abrir: ${error.message}`; }
        });
    }
    renderFiles() {
        if (!this.actor || !this.entries) return;
        const entries = this.entries.filter(item => normalize(item.info.get_display_name()).includes(this.query)).sort((a, b) =>
            this.sortRecent ? b.info.get_attribute_uint64('time::modified') - a.info.get_attribute_uint64('time::modified') : a.info.get_display_name().localeCompare(b.info.get_display_name(), 'es', {numeric: true}));
        this.status.text = `${entries.length} elementos${this.limited ? ' · muestra limitada; abre Archivos para ver todo' : ''}`;
        this.grid(entries, item => new St.Icon({gicon: item.info.get_icon(), icon_size: 40}), item => item.info.get_display_name(), item => {
            if (item.info.get_file_type() === Gio.FileType.DIRECTORY) this.load(item.file);
            else { const uri = item.file.get_uri(); this.close(); this.owner._launch({type: 'uri', target: uri, alias: ''}); }
        });
        if (!entries.length) this.body.add_child(label(this.query ? 'Sin coincidencias' : 'Carpeta vacía', 'ai-muted'));
    }
    close() {
        this.owner._clear(this.animationTimer); this.animationTimer = 0;
        this.cancelTimer(); this.owner._clear(this.refreshTimer); this.refreshTimer = 0; this.serial++;
        this.cancel?.cancel(); this.cancel = null; this.monitor?.cancel(); this.monitor = null; this.entries = null;
        if (this.capture) global.stage.disconnect(this.capture); this.capture = 0;
        if (this.actor) {
            const actor = this.actor; this.actor = null;
            actor.remove_all_transitions(); actor.hide();
        }
        this.anchor = null; this.groupId = null;
        if (this.owner._root && !this.owner._open) this.owner._reveal(this.owner._root.hover);
    }
    destroy() { this.close(); if (this.surface) { this.surface.destroy(); this.surface = null; } }
}
