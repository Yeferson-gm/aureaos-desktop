import Clutter from 'gi://Clutter';
import GLib from 'gi://GLib';
import St from 'gi://St';
import Shell from 'gi://Shell';
import Pango from 'gi://Pango';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as DND from 'resource:///org/gnome/shell/ui/dnd.js';
import {scrollView} from './shared/scroll-view.js';
import {MODULES, HOME_LIMIT, homeModules, placeModule} from './workspace-model.js';

export class WorkspaceEditor {
    constructor(workspace) {
        this.workspace = workspace;
        this.island = workspace.island;
        this.signals = [];
        this.actor = null;
    }

    open() {
        const e = this.island;
        if (this.actor || !e._alive || Main.sessionMode.isLocked || Main.overview.visible) return;
        const monitor = e._monitor();
        if (!monitor) return;
        e._closeIsland();
        this.draft = homeModules(e._settings.get_strv('home-modules'));
        this.history = [];
        this.actor = new St.Widget({style_class: 'di-editor-backdrop', reactive: true,
            x: monitor.x, y: monitor.y, width: monitor.width, height: monitor.height,
            layout_manager: new Clutter.BinLayout(), clip_to_allocation: true});
        const scale = St.ThemeContext.get_for_stage(global.stage).scale_factor;
        const width = Math.max(260, Math.min(920, monitor.width / scale - 40));
        this.columns = width >= 760 ? 3 : width >= 500 ? 2 : 1;
        this.tileWidth = Math.floor((width - 96 - (this.columns - 1) * 12) / this.columns);
        this.panel = new St.BoxLayout({orientation: Clutter.Orientation.VERTICAL, style_class: 'di-editor-panel',
            width, x_align: Clutter.ActorAlign.CENTER, y_align: Clutter.ActorAlign.CENTER});
        this.actor.add_child(this.panel);
        const heading = new St.BoxLayout({style_class: 'di-editor-heading'});
        const titles = new St.BoxLayout({orientation: Clutter.Orientation.VERTICAL, x_expand: true, style_class: 'di-editor-titles'});
        titles.add_child(e._label('Personaliza tu isla', 'di-editor-title'));
        titles.add_child(e._label('Arrastra para añadir, ordenar o quitar tarjetas.', 'di-editor-description'));
        heading.add_child(titles);
        heading.add_child(e._chip('Cancelar', () => this.close(false), 'window-close-symbolic'));
        const done = e._chip('Listo', () => this.close(true), 'object-select-symbolic');
        done.add_style_class_name('di-editor-done'); heading.add_child(done);
        this.panel.add_child(heading);
        this.preview = new St.BoxLayout({orientation: Clutter.Orientation.VERTICAL, style_class: 'di-editor-preview', reactive: true});
        this.availableHeight = monitor.height / scale - 70;
        this.previewScroll = scrollView({hscrollbar_policy: St.PolicyType.NEVER, vscrollbar_policy: St.PolicyType.EXTERNAL});
        this.previewScroll.set_child(this.preview);
        this.panel.add_child(this.previewScroll);
        this.dropTarget(this.preview, 'preview');
        const toolbar = new St.BoxLayout({style_class: 'di-editor-toolbar'});
        this.status = e._label('', 'di-editor-description', {x_expand: true}); toolbar.add_child(this.status);
        this.undoButton = e._chip('Deshacer', () => {
            const previous = this.history.pop();
            if (previous) { this.draft = previous; this.render(); }
        }, 'edit-undo-symbolic');
        toolbar.add_child(this.undoButton);
        toolbar.add_child(e._chip('Restaurar', () => this.change(['music', 'today', 'weather']), 'view-refresh-symbolic'));
        this.panel.add_child(toolbar);
        this.scroll = scrollView({style_class: 'di-editor-scroll', overlay_scrollbars: true,
            hscrollbar_policy: St.PolicyType.NEVER, vscrollbar_policy: St.PolicyType.EXTERNAL,
            height: Math.max(100, Math.min(390, monitor.height / scale - 390))});
        this.gallery = new St.BoxLayout({orientation: Clutter.Orientation.VERTICAL, style_class: 'di-editor-gallery', reactive: true});
        this.scroll.set_child(this.gallery); this.panel.add_child(this.scroll);
        this.dropTarget(this.gallery, 'gallery');
        this.removeZone = new St.BoxLayout({style_class: 'di-editor-remove', reactive: true});
        this.removeZone.add_child(new St.Icon({icon_name: 'list-remove-symbolic', icon_size: 16}));
        this.removeZone.add_child(e._label('Suelta aquí para quitar de Inicio · Tus datos se conservan', 'di-editor-description'));
        this.dropTarget(this.removeZone, 'gallery'); this.panel.add_child(this.removeZone);
        this.actor.connect('key-press-event', (_actor, event) => {
            if (event.get_key_symbol() !== Clutter.KEY_Escape) return Clutter.EVENT_PROPAGATE;
            this.close(false); return Clutter.EVENT_STOP;
        });
        this.actor.connect('button-press-event', (_actor, event) => {
            if (global.stage.get_event_actor(event) === this.actor) this.close(false);
            return Clutter.EVENT_PROPAGATE;
        });
        for (const [object, signal] of [[Main.layoutManager, 'monitors-changed'], [Main.overview, 'showing'], [Main.sessionMode, 'updated']])
            this.signals.push([object, object.connect(signal, () => {
                if (object !== Main.sessionMode || Main.sessionMode.isLocked) this.close(false, false);
            })]);
        this.render();
        Main.layoutManager.addTopChrome(this.actor);
        this.grab = Main.pushModal(this.actor, {actionMode: Shell.ActionMode.POPUP});
        if (!this.grab) { this.close(false, false); return; }
        done.grab_key_focus();
        this.panel.opacity = 0;
        this.panel.ease({opacity: 255, duration: e._duration(180), mode: Clutter.AnimationMode.EASE_OUT_CUBIC});
    }

    tile(id, origin, width = this.tileWidth) {
        const e = this.island;
        const [, name, icon] = MODULES.find(module => module[0] === id);
        const tile = new St.Button({style_class: `di-editor-tile di-module-${id}`, width,
            reactive: true, can_focus: true, track_hover: true, accessible_name: `${name}. ${origin === 'preview' ? 'En Inicio. Alt y flechas para mover; Suprimir para quitar.' : 'Añadir a Inicio'}`});
        const content = new St.BoxLayout({orientation: Clutter.Orientation.VERTICAL, style_class: 'di-editor-tile-content'});
        const header = new St.BoxLayout({style_class: 'di-editor-tile-header'});
        const value = this.workspace.value(id);
        header.add_child(new St.Icon({icon_name: icon, icon_size: value ? 18 : 28,
            style_class: 'di-editor-module-icon', y_align: Clutter.ActorAlign.CENTER}));
        if (value) header.add_child(e._label(value, 'di-editor-value'));
        header.add_child(new St.Widget({x_expand: true}));
        const used = this.draft.includes(id);
        header.add_child(e._label(used ? 'En uso' : '+ Añadir', used ? 'di-editor-badge' : 'di-editor-description'));
        content.add_child(header);
        content.add_child(e._label(name, 'di-editor-tile-title'));
        const summary = e._label(this.workspace.summaries()[id] ?? 'Abrir herramienta', 'di-editor-tile-summary', {width: width - 28});
        summary.clutter_text.set_ellipsize(Pango.EllipsizeMode.END); content.add_child(summary);
        tile.set_child(content);
        tile.connect('clicked', () => {
            if (!this.dragging && origin === 'gallery') {
                if (this.draft.includes(id)) this.previewTiles.get(id)?.grab_key_focus();
                else this.place(id);
            }
        });
        tile.connect('key-press-event', (_actor, event) => {
            const key = event.get_key_symbol();
            if (origin !== 'preview') return Clutter.EVENT_PROPAGATE;
            if (key === Clutter.KEY_Delete) { this.remove(id); return Clutter.EVENT_STOP; }
            if (event.get_state() & Clutter.ModifierType.MOD1_MASK && [Clutter.KEY_Left, Clutter.KEY_Right].includes(key)) {
                const index = this.draft.indexOf(id);
                const destination = key === Clutter.KEY_Left ? index - 1 : index + 1;
                if (destination >= 0 && destination < this.draft.length) {
                    const next = [...this.draft]; [next[index], next[destination]] = [next[destination], next[index]];
                    this.change(next, id);
                }
                return Clutter.EVENT_STOP;
            }
            return Clutter.EVENT_PROPAGATE;
        });
        tile._delegate = {editor: this, module: id, origin,
            getDragActor: () => {
                const ghost = new St.Bin({style_class: `di-editor-ghost di-module-${id}`, width: tile.width, height: tile.height});
                ghost.set_child(new Clutter.Clone({source: content})); return ghost;
            }, getDragActorSource: () => tile};
        const draggable = DND.makeDraggable(tile, {timeoutThreshold: 200, dragActorOpacity: 235, dragActorMaxSize: 240});
        draggable.connect('drag-begin', () => {
            this.dragging = draggable; tile.opacity = 110;
            this.status.text = 'Suelta en Inicio para colocar · Suelta en la galería para quitar';
            this.autoScroll = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 32, () => {
                if (!this.actor || !this.dragging) { this.autoScroll = 0; return GLib.SOURCE_REMOVE; }
                const [x,y] = global.get_pointer();
                for (const view of [this.previewScroll, this.scroll]) {
                    const [left,top] = view.get_transformed_position(), [width,height] = view.get_transformed_size();
                    if (x < left || x > left+width || y < top || y > top+height) continue;
                    const delta = y < top+28 ? -7 : y > top+height-28 ? 7 : 0;
                    const adjustment = view.vadjustment;
                    if (delta) adjustment.value = Math.max(adjustment.lower, Math.min(adjustment.upper-adjustment.page_size, adjustment.value+delta));
                }
                return GLib.SOURCE_CONTINUE;
            });
        });
        draggable.connect('drag-end', () => {
            if (this.autoScroll) GLib.source_remove(this.autoScroll);
            this.autoScroll = 0;
            this.dragging = null; tile.opacity = 255; this.highlight(null);
            this.queueRender(id);
        });
        tile.connect('key-focus-in', () => {
            const view = origin === 'preview' ? this.previewScroll : this.scroll;
            const [,y] = tile.get_transformed_position(), [,top] = view.get_transformed_position();
            const height = tile.get_transformed_size()[1], visible = view.get_transformed_size()[1];
            const adjustment = view.vadjustment;
            const offset = y < top ? y-top : y+height > top+visible ? y+height-top-visible : 0;
            if (offset) adjustment.ease(adjustment.value+offset, {duration: e._duration(140), mode: Clutter.AnimationMode.EASE_OUT_CUBIC});
        });
        if (origin === 'preview') this.dropTarget(tile, 'preview', id);
        return tile;
    }

    dropTarget(actor, zone, before = null) {
        actor._delegate = {...actor._delegate,
            handleDragOver: source => {
                if (source.editor !== this || (zone === 'gallery' && source.origin !== 'preview')) return DND.DragMotionResult.CONTINUE;
                if (zone === 'preview' && !this.draft.includes(source.module) && this.draft.length >= HOME_LIMIT) {
                    this.status.text = `Puedes tener hasta ${HOME_LIMIT} tarjetas. Quita una antes de añadir otra.`;
                    return DND.DragMotionResult.NO_DROP;
                }
                this.highlight(actor);
                return DND.DragMotionResult.MOVE_DROP;
            },
            acceptDrop: source => {
                if (source.editor !== this || (zone === 'gallery' && source.origin !== 'preview')) return false;
                if (zone === 'preview' && !this.draft.includes(source.module) && this.draft.length >= HOME_LIMIT) return false;
                if (zone === 'preview') this.place(source.module, before);
                else this.remove(source.module);
                return true;
            },
        };
    }

    highlight(actor) {
        if (this.target === actor) return;
        this.target?.remove_style_class_name('di-editor-drop');
        this.target = actor; actor?.add_style_class_name('di-editor-drop');
    }

    place(id, before = null) {
        if (!this.draft.includes(id) && this.draft.length >= HOME_LIMIT) {
            this.status.text = `Límite de ${HOME_LIMIT} tarjetas. Quita una para añadir otra.`; return;
        }
        this.change(placeModule(this.draft, id, before), id);
    }

    remove(id) { this.change(this.draft.filter(value => value !== id)); }

    change(next, focus = null) {
        if (next.join(',') === this.draft.join(',')) return;
        this.history.push([...this.draft]);
        if (this.history.length > 20) this.history.shift();
        this.draft = next;
        if (!this.dragging) this.queueRender(focus);
    }

    queueRender(focus = null) {
        if (this.redraw) GLib.source_remove(this.redraw);
        this.redraw = GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
            this.redraw = 0;
            if (this.pendingClose) { const args = this.pendingClose; this.pendingClose = null; this.close(...args); }
            else if (this.actor) this.render(focus);
            return GLib.SOURCE_REMOVE;
        });
    }

    render(focus = null) {
        if (!this.actor || this.dragging) return;
        this.highlight(null);
        const scroll = this.scroll.vadjustment.value;
        this.preview.destroy_all_children(); this.gallery.destroy_all_children();
        this.previewTiles = new Map(); this.galleryTiles = new Map();
        let row;
        this.draft.forEach((id, index) => {
            if (index % this.columns === 0) { row = new St.BoxLayout({style_class: 'di-editor-row'}); this.preview.add_child(row); }
            const tile = this.tile(id, 'preview'); row.add_child(tile); this.previewTiles.set(id, tile);
        });
        if (!this.draft.length) this.preview.add_child(this.island._label('Tu isla empieza aquí. Arrastra una tarjeta desde la galería.', 'di-editor-empty'));
        MODULES.filter(([id]) => id !== 'home' && (id !== 'applications' || this.island._settings.get_boolean('app-launcher'))).forEach(([id], index) => {
            if (index % this.columns === 0) { row = new St.BoxLayout({style_class: 'di-editor-row'}); this.gallery.add_child(row); }
            const tile = this.tile(id, 'gallery'); row.add_child(tile); this.galleryTiles.set(id, tile);
        });
        const previewHeight = Math.min(Math.max(100, Math.ceil(this.draft.length / this.columns) * 126 + 24), this.availableHeight * .4);
        this.previewScroll.height = previewHeight;
        this.scroll.height = Math.max(100, Math.min(340, this.availableHeight - previewHeight - 220));
        this.status.text = `${this.draft.length} de ${HOME_LIMIT} tarjetas · Galería`;
        this.undoButton.reactive = this.history.length > 0; this.undoButton.opacity = this.history.length ? 255 : 110;
        this.scroll.vadjustment.value = scroll;
        this.previewTiles.get(focus)?.grab_key_focus();
    }

    close(save = false, reopen = true) {
        if (!this.actor) return;
        if (this.dragging) {
            if (this.pendingClose) return;
            this.pendingClose = [save, reopen];
            this.dragging._cancelDrag(global.get_current_time()); return;
        }
        if (this.redraw) GLib.source_remove(this.redraw);
        this.redraw = 0;
        if (save) this.island._settings.set_strv('home-modules', this.draft);
        for (const [object, signal] of this.signals) object.disconnect(signal);
        this.signals = [];
        if (this.grab) Main.popModal(this.grab);
        this.grab = null; this.highlight(null);
        Main.layoutManager.removeChrome(this.actor); this.actor.destroy(); this.actor = null;
        this.previewTiles = null; this.galleryTiles = null;
        if (reopen && this.island._alive) this.island.openModule('home');
    }
}
