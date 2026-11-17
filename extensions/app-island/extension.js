import Clutter from 'gi://Clutter';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import Meta from 'gi://Meta';
import Shell from 'gi://Shell';
import St from 'gi://St';
import Pango from 'gi://Pango';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as DND from 'resource:///org/gnome/shell/ui/dnd.js';
import * as AppFavorites from 'resource:///org/gnome/shell/ui/appFavorites.js';
import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import {DEFAULTS, normalize, categoryFor} from './model.js';
import {Statistics} from './statistics.js';
import {QuickPreview} from './quick-preview.js';
import {Store} from './store.js';
import {column, label, button, buttonContent, entry, edit} from './ui.js';
import {createRoundedMask} from './rounded-clip.js';

const Mask = createRoundedMask('AureaFavoritesMask');
const PRIMARY = St.ButtonMask.PRIMARY ?? St.ButtonMask.ONE;
const MIDDLE = St.ButtonMask.MIDDLE ?? St.ButtonMask.TWO;
const SECONDARY = St.ButtonMask.SECONDARY ?? St.ButtonMask.THREE;

export default class AppIsland extends Extension {
    enable() {
        this._signals = []; this._sources = new Set(); this._rows = new Map(); this._pending = new Map();
        this._appSystem = Shell.AppSystem.get_default();
        this._interface = new Gio.Settings({schema_id: 'org.gnome.desktop.interface'});
        this._a11y = new Gio.Settings({schema_id: 'org.gnome.desktop.a11y.interface'});
        this._store = new Store(GLib.build_filenamev([GLib.get_user_data_dir(), 'side-dock', 'favoritos.json']),
            AppFavorites.getAppFavorites().getFavorites().map(a => a.get_id()).slice(0, 5), id => {
                const app = this._appSystem.lookup_app(id); return {categories: app?.get_app_info()?.get_categories()};
            });
        this._model = this._store.model;
        const occupied = this._model.profile.categories.filter(c => this._model.profile.items.some(item => item.category === c.id));
        if (occupied.length && occupied.every(c => c.collapsed)) occupied[0].collapsed = false;
        this._kind = 'all';
        this._view = 'favorites'; this._query = ''; this._open = false; this._scrollValues = new Map();
        this._root = new St.Widget({name: 'aureaFavorites', layout_manager: new Clutter.BinLayout(), reactive: true, track_hover: true, clip_to_allocation: true});
        this._glass = new St.Widget({x_expand: true, y_expand: true, style: 'background-color: rgba(0,0,0,0.004);'});
        this._mask = new Mask(); this._glass.add_effect(this._mask);
        this._blur = new Shell.BlurEffect({mode: Shell.BlurMode.BACKGROUND, radius: 24, brightness: 1});
        this._glass.add_effect(this._blur); this._blur.set_enabled(false);
        this._root.add_child(this._glass);
        this._surface = new St.Widget({style_class: 'ai-surface', x_expand: true, y_expand: true});
        this._root.add_child(this._surface);
        this._bar = column({style_class: 'ai-bar', x_expand: true, y_expand: true});
        this._root.add_child(this._bar);
        this._panel = column({style_class: 'ai-panel', visible: false, x_expand: true, y_expand: true});
        this._root.add_child(this._panel);
        this._handle = button('Abrir favoritas', () => this._setOpen(true));
        this._handle.set_style('padding: 0; width: 7px; background-color: transparent;');
        this._handle.set_child(new St.Widget({width: 2, height: 24, opacity: 0}));
        this._root.add_child(this._handle);
        Main.layoutManager.addChrome(this._root, {trackFullscreen: true});
        for (const prop of ['x', 'y', 'width', 'height', 'translation-x'])
            this._connect(this._root, `notify::${prop}`, () => this._clip());
        this._connect(this._root, 'notify::hover', () => {
            this._clear(this._edgeTimer);
            if (this._open || this._dragging) return;
            this._edgeTimer = this._timeout(this._root.hover ? this.settings.delay : this.settings.hideDelay,
                () => this._reveal(this._root.hover));
        });
        this._connect(this._appSystem, 'app-state-changed', () => this._updateStates());
        this._connect(this._appSystem, 'installed-changed', () => this._render());
        this._connect(Main.layoutManager, 'monitors-changed', () => { this._setOpen(false); this._layout(); });
        this._connect(global.display, 'in-fullscreen-changed', () => { this._statistics?.show(false); this._quickPreview?.close(); });
        this._connect(Main.overview, 'showing', () => { this._setOpen(false); this._root.hide(); this._quickPreview?.close(); this._statistics?.show(false); this._statistics?.trigger.hide(); });
        this._connect(Main.overview, 'hidden', () => { this._root.show(); this._statistics?.layout(); });
        this._connect(this._interface, 'changed', () => { this._theme(); this._layout(); });
        this._connect(this._a11y, 'changed', () => this._theme());
        this._connect(global.display, 'accelerator-activated', (_d, action) => {
            if (action === this._accelerator) this._setOpen(!this._open);
        });
        this._quickPreview = new QuickPreview(this);
        this._shortcut(); this._buildPanel(); this._renderBar(); this._layout(); this._theme();
        this._statistics = new Statistics(this);
        if (Main.overview.visible) this._root.hide();
    }
    get settings() { return this._model.settings; }
    _connect(obj, signal, fn) { this._signals.push([obj, obj.connect(signal, fn)]); }
    _timeout(ms, fn) {
        const id = GLib.timeout_add(GLib.PRIORITY_DEFAULT, ms, () => {
            this._sources.delete(id); if (this._root) fn(); return GLib.SOURCE_REMOVE;
        }); this._sources.add(id); return id;
    }
    _clear(id) { if (this._sources.delete(id)) GLib.Source.remove(id); }
    _duration(ms) {
        const st = St.Settings.get();
        return !st.enable_animations || (St.ReducedMotion && st.reduced_motion === St.ReducedMotion.REDUCE) ? 0 : ms;
    }
    _monitor() {
        const all = Main.layoutManager.monitors;
        return all.find(m => `${m.x},${m.y}` === this.settings.monitor) ?? Main.layoutManager.primaryMonitor;
    }
    _side() {
        this._sharedEdge = false;
        const m = this._monitor(); if (!m) return this.settings.side;
        const border = this.settings.side === 'right' ? m.x + m.width : m.x;
        const shared = Main.layoutManager.monitors.some(n => n !== m && n.y < m.y + m.height && n.y + n.height > m.y &&
            (this.settings.side === 'right' ? n.x === border : n.x + n.width === border));
        if (!shared) return this.settings.side;
        const opposite = this.settings.side === 'right' ? m.x : m.x + m.width;
        const blocked = Main.layoutManager.monitors.some(n => n !== m && n.y < m.y + m.height && n.y + n.height > m.y &&
            (this.settings.side === 'right' ? n.x + n.width === opposite : n.x === opposite));
        this._sharedEdge = blocked;
        return blocked ? this.settings.side : this.settings.side === 'right' ? 'left' : 'right';
    }
    _geometry() {
        const m = this._monitor(); if (!m) return null;
        const work = Main.layoutManager.getWorkAreaForMonitor(m.index);
        const scale = St.ThemeContext.get_for_stage(global.stage).scale_factor;
        const width = this._open ? Math.min(360 * scale, work.width - 32 * scale) : 64 * scale;
        const content = this._panel.get_preferred_height(width)[1];
        const height = Math.max(112 * scale, Math.min(work.height - 24 * scale,
            this._open ? Math.max(260 * scale, Math.min(content, 620 * scale)) : this._bar.get_preferred_height(width)[1]));
        const side = this._side();
        return {x: side === 'right' ? m.x + m.width - width - 8 * scale : m.x + 8 * scale,
            y: work.y + Math.round((work.height - height) / 2), width, height};
    }
    _layout() {
        this._quickPreview?.close();
        if (!this._root) return;
        const g = this._geometry(); if (!g) return;
        this._root.remove_all_transitions(); this._root.set_position(g.x, g.y); this._root.set_size(g.width, g.height);
        this._handle.x_align = this._side() === 'right' ? Clutter.ActorAlign.START : Clutter.ActorAlign.END;
        this._reveal(this._open || this._root.hover, false); this._clip(); this._statistics?.layout();
    }
    _clip() {
        if (!this._root) return;
        const m = this._monitor(); if (!m) return;
        const a = this._root, x = a.x + a.translation_x, y = a.y;
        const left = Math.max(0, m.x - x), top = Math.max(0, m.y - y);
        a.set_clip(left, top, Math.max(0, Math.min(a.width, m.x + m.width - x) - left),
            Math.max(0, Math.min(a.height, m.y + m.height - y) - top));
        this._mask.resize(a.width, a.height, 22 * St.ThemeContext.get_for_stage(global.stage).scale_factor);
    }
    _reveal(show, animate = true) {
        if (!show && this._quickPreview?.actor) return;
        if (this._sharedEdge && !this._open) show = false;
        const scale = St.ThemeContext.get_for_stage(global.stage).scale_factor;
        const offset = show ? 0 : (this._root.width + (8 - this.settings.edge) * scale) * (this._side() === 'right' ? 1 : -1);
        this._root.ease({translation_x: offset, duration: animate ? this._duration(180) : 0, mode: Clutter.AnimationMode.EASE_OUT_CUBIC});
    }
    _shortcut() {
        if (this._accelerator) {
            Main.wm.allowKeybinding(Meta.external_binding_name_for_action(this._accelerator), Shell.ActionMode.NONE);
            global.display.ungrab_accelerator(this._accelerator);
        }
        this._accelerator = global.display.grab_accelerator(this.settings.shortcut, Meta.KeyBindingFlags.NONE);
        if (this._accelerator) Main.wm.allowKeybinding(Meta.external_binding_name_for_action(this._accelerator), Shell.ActionMode.NORMAL | Shell.ActionMode.POPUP);
        else this._message('El atajo está ocupado o no es válido. Puedes cambiarlo en Ajustes.');
    }
    _setOpen(open) {
        this._quickPreview?.close();
        if (!this._root || this._open === open) return;
        this._clear(this._edgeTimer); this._clear(this._previewTimer); this._clearPopup();
        this._open = open;
        if (open) {
            this._previousFocus = global.stage.get_key_focus();
            this._grab = Main.pushModal(this._root, {actionMode: Shell.ActionMode.POPUP});
            if (!this._grab) {
                if (this._grab) Main.popModal(this._grab);
                this._grab = null; this._open = false; return;
            }
            this._capture = this._root.connect('captured-event', (_actor, ev) => this._event(ev));
            this._panel.show(); this._bar.hide(); this._handle.hide(); this._render();
            this._timeout(0, () => { this._scroll.vadjustment.value = this._model.profile.scroll ?? 0; });
        } else {
            this._model.profile.scroll = this._scroll.vadjustment.value; this._save();
            this._release(); this._panel.hide(); this._bar.show(); this._handle.show();
        }
        const g = this._geometry();
        this._root.ease({...g, translation_x: 0, duration: this._duration(open ? 240 : 180), mode: Clutter.AnimationMode.EASE_OUT_CUBIC,
            onComplete: () => { if (!this._open) this._reveal(this._root.hover); }});
        this._theme();
        if (open) this._search.grab_key_focus();
    }
    _release() {
        if (this._capture) { this._root.disconnect(this._capture); this._capture = 0; }
        if (this._grab) { Main.popModal(this._grab); this._grab = null; }
        try { this._previousFocus?.grab_key_focus(); } catch {}
        this._previousFocus = null;
    }
    _event(ev) {
        if (ev.type() === Clutter.EventType.KEY_PRESS) {
            const key = ev.get_key_symbol();
            if (key === Clutter.KEY_Escape) {
                if (this._popup) this._clearPopup();
                else if (this._view !== 'favorites') this._switch('favorites');
                else this._setOpen(false);
                return Clutter.EVENT_STOP;
            }
            const focus = global.stage.get_key_focus();
            const focused = [...this._rows.values()].find(r => focus && r.actor.contains(focus));
            if (focused && [Clutter.KEY_Menu, Clutter.KEY_F10].includes(key)) { this._actions(focused.item); return Clutter.EVENT_STOP; }
            if ([Clutter.KEY_Down, Clutter.KEY_Up, Clutter.KEY_Left, Clutter.KEY_Right].includes(key) && focused) {
                this._panel.navigate_focus(global.stage.get_key_focus(), ({[Clutter.KEY_Down]: St.DirectionType.DOWN, [Clutter.KEY_Up]: St.DirectionType.UP, [Clutter.KEY_Left]: St.DirectionType.LEFT, [Clutter.KEY_Right]: St.DirectionType.RIGHT})[key], true);
                return Clutter.EVENT_STOP;
            }
        }
        if ([Clutter.EventType.BUTTON_PRESS, Clutter.EventType.TOUCH_BEGIN].includes(ev.type())) {
            const [x, y] = ev.get_coords(), a = this._root;
            if (x < a.x + a.translation_x || x > a.x + a.translation_x + a.width || y < a.y || y > a.y + a.height) {
                this._setOpen(false); return Clutter.EVENT_STOP;
            }
        }
        return Clutter.EVENT_PROPAGATE;
    }
    _theme() {
        const dark = this.settings.theme !== 'light';
        const contrast = this._a11y.get_boolean('high-contrast');
        this._root.set_style_class_name(`ai-root ${dark ? 'ai-dark' : 'ai-light'}${contrast ? ' ai-contrast' : ''}${this.settings.density === 'compact' ? ' ai-compact' : ''}`);
        const solid = contrast || this.settings.material === 'solid';
        if (solid) this._root.add_style_class_name('ai-solid');
        if (!this._open) this._root.add_style_class_name('ai-rail');
        this._blur.set_enabled(this._open && !solid);
    }
    _save() {
        try { this._store.save(); return true; }
        catch (error) { this._message(error.message); return false; }
    }
    _change(fn, render = true) {
        const before = JSON.stringify(this._model.data), undo = this._model.undo;
        try {
            fn();
            if (!this._save()) { this._model.data = JSON.parse(before); this._model.undo = undo; return; }
            this._renderBar(); if (render) this._render(); this._theme(); this._layout();
        } catch (error) { this._model.data = JSON.parse(before); this._model.undo = undo; this._message(error.message); }
    }
    _name(item) { return item.alias || (item.type === 'app' ? this._appSystem.lookup_app(item.target)?.get_name() ?? item.target : Gio.File.new_for_uri(item.target).get_basename() ?? item.target); }
    _icon(item, size = 38) {
        if (item.type === 'app') return this._appSystem.lookup_app(item.target)?.create_icon_texture(size) ?? new St.Icon({icon_name: 'application-x-executable-symbolic', icon_size: size});
        if (item.target.startsWith('file:')) {
            try {
                const info = Gio.File.new_for_uri(item.target).query_info('standard::icon', Gio.FileQueryInfoFlags.NONE, null);
                return new St.Icon({gicon: info.get_icon(), icon_size: size});
            } catch { return new St.Icon({icon_name: 'dialog-warning-symbolic', icon_size: size}); }
        }
        return new St.Icon({icon_name: 'web-browser', icon_size: size});
    }
    _message(text) { if (this._status) this._status.text = text; else this._initialMessage = text; }
    _launch(item, newWindow = false, keep = false) {
        try {
            if (item.type === 'app') {
                const app = this._appSystem.lookup_app(item.target);
                if (!app) throw Error('La aplicación ya no está instalada.');
                if (this._pending.has(item.id) && app.state !== Shell.AppState.RUNNING) return;
                if (newWindow && app.can_open_new_window()) app.open_new_window(-1); else app.activate();
                this._clear(this._pending.get(item.id));
                this._pending.set(item.id, this._timeout(6000, () => { this._pending.delete(item.id); this._updateStates(); }));
            } else {
                const file = Gio.File.new_for_uri(item.target);
                if (item.target.startsWith('file:') && !file.query_exists(null)) throw Error('El archivo o carpeta ya no existe.');
                Gio.AppInfo.launch_default_for_uri(item.target, global.create_app_launch_context(0, -1));
            }
            this._updateStates();
            if (!keep) this._setOpen(false);
            return true;
        } catch (error) { this._message(`${this._name(item)}: ${error.message}`); return false; }
    }
    _renderBar() {
        this._quickPreview?.close();
        this._bar.destroy_all_children();
        for (const item of this._model.quickItems().slice(0, this.settings.quickCount)) {
            const folder = item.type === 'uri' && item.target.startsWith('file:') && Gio.File.new_for_uri(item.target).query_file_type(Gio.FileQueryInfoFlags.NONE, null) === Gio.FileType.DIRECTORY;
            const b = button(this._name(item), (_b, mouse) => {
                if (mouse === 3) { this._setOpen(true); this._actions(item); }
                else if (folder && mouse === 1) this._quickPreview.folder(item, b);
                else this._launch(item, mouse === 2);
            });
            b.button_mask = PRIMARY | MIDDLE | SECONDARY; b.set_child(this._icon(item, 36));
            b.add_style_class_name('ai-rail-button');
            this._bar.add_child(b);
            if (folder) this._quickPreview.bind(b, () => this._quickPreview.folder(item, b));
        }
        for (const category of this._model.profile.categories.filter(c => c.quick).slice(0, 4)) {
            const b = button(category.name, () => this._quickPreview.group(category, b));
            b.add_style_class_name('ai-rail-button');
            const items = this._model.profile.items.filter(item => item.category === category.id).slice(0, 4);
            const mosaic = new St.Widget({width: 36, height: 36, layout_manager: new Clutter.GridLayout()});
            items.forEach((item, index) => mosaic.layout_manager.attach(this._icon(item, 16), index % 2, Math.floor(index / 2), 1, 1));
            if (!items.length) mosaic.add_child(new St.Icon({icon_name: 'folder-symbolic', icon_size: 32}));
            b.set_child(mosaic); this._bar.add_child(b); this._quickPreview.bind(b, () => this._quickPreview.group(category, b));
        }
        if (this._bar.get_n_children()) this._bar.add_child(new St.Widget({style_class: 'ai-rail-divider'}));
        const open = button('Abrir favoritas', () => this._setOpen(true), 'view-grid-symbolic');
        open.add_style_class_name('ai-rail-button'); this._bar.add_child(open);
    }
    disable() {
        this._quickPreview?.destroy(); this._quickPreview = null;
        this._statistics?.destroy(); this._statistics = null;
        this._clearPopup(); this._release();
        for (const id of this._sources) GLib.Source.remove(id);
        this._sources.clear();
        for (const [object, id] of this._signals) object.disconnect(id);
        if (this._accelerator) {
            Main.wm.allowKeybinding(Meta.external_binding_name_for_action(this._accelerator), Shell.ActionMode.NONE);
            global.display.ungrab_accelerator(this._accelerator);
        }
        this._root.remove_all_transitions(); Main.layoutManager.removeChrome(this._root); this._root.destroy(); this._root = null;
        this._rows.clear(); this._pending.clear(); this._model = this._store = null;
    }
    _buildPanel() {
        const head = new St.BoxLayout({style_class: 'ai-head'});
        head.add_child(new St.Icon({icon_name: 'folder-symbolic', icon_size: 22, style_class: 'ai-brand-icon', y_align: Clutter.ActorAlign.CENTER}));
        this._heading = label('Tu espacio', 'ai-title'); this._heading.x_expand = true; head.add_child(this._heading);
        head.add_child(button('Cerrar espacio', () => this._setOpen(false), 'window-close-symbolic'));
        this._panel.add_child(head);
        this._profileButton = button('', () => this._switch('profiles'));
        this._profileButton.add_style_class_name('ai-profile');
        this._search = entry('Buscar archivos y favoritos');
        this._search.set_primary_icon(new St.Icon({icon_name: 'edit-find-symbolic', icon_size: 16}));
        this._search.clutter_text.connect('text-changed', () => {
            this._query = this._search.get_text(); this._clear(this._searchTimer);
            this._searchTimer = this._timeout(80, () => this._render());
        });
        this._search.clutter_text.connect('activate', () => {
            if (this._view === 'add') { const app = this._candidates()[0]; if (app) this._addApp(app); }
            else { const item = this._items()[0]; if (item) this._launch(item); }
        });
        this._panel.add_child(label('Carpetas, archivos y grupos a mano', 'ai-muted'));
        this._panel.add_child(this._search);
        this._kinds = new St.BoxLayout({style_class: 'ai-segments'});
        for (const [id, title, icon] of [['all', 'Todo', 'view-grid-symbolic'], ['files', 'Archivos', 'folder-symbolic'], ['apps', 'Apps', 'application-x-executable-symbolic']]) {
            const tab = buttonContent(button(title, () => { this._kind = id; this._onlyRunning = false; this._render(); }), title, icon); tab.x_expand = true; tab.kind = id; this._kinds.add_child(tab);
        }
        this._panel.add_child(this._kinds);
        const controls = new St.BoxLayout({style_class: 'ai-line'});
        this._back = buttonContent(button('Volver', () => this._switch('favorites')), 'Volver', 'go-previous-symbolic');
        this._filter = button('Solo abiertas', () => { this._onlyRunning = !this._onlyRunning; this._render(); });
        this._profileButton.x_expand = true;
        controls.add_child(this._profileButton); controls.add_child(this._back); controls.add_child(this._filter); this._panel.add_child(controls);
        this._scroll = new St.ScrollView({x_expand: true, y_expand: true, overlay_scrollbars: true,
            hscrollbar_policy: St.PolicyType.NEVER, vscrollbar_policy: St.PolicyType.AUTOMATIC});
        this._list = column({style_class: 'ai-list', x_expand: true, y_align: Clutter.ActorAlign.START}); this._scroll.set_child(this._list); this._panel.add_child(this._scroll);
        this._status = label(this._store.error ?? this._initialMessage ?? '', 'ai-status');
        this._status.clutter_text.line_wrap = true; this._status.clutter_text.ellipsize = Pango.EllipsizeMode.END;
        this._status.connect('notify::text', () => { this._status.visible = !!this._status.text; }); this._status.visible = !!this._status.text;
        this._panel.add_child(this._status);
        const actions = new St.BoxLayout({style_class: 'ai-footer-actions'});
        const add = buttonContent(button('Añadir', () => this._switch('add')), 'Añadir', 'list-add-symbolic'); add.x_expand = true; add.add_style_class_name('ai-primary'); actions.add_child(add);
        actions.add_child(buttonContent(button('Organizar', () => this._switch('settings')), 'Organizar', 'emblem-system-symbolic'));
        this._panel.add_child(actions);
        this._undo = button('Deshacer', () => this._change(() => this._model.restore())); this._panel.add_child(this._undo);
    }
    _switch(view) {
        this._scrollValues.set(`${this._model.data.active}:${this._view}`, this._scroll.vadjustment.value);
        this._view = view; this._clearPopup();
        this._search.set_text(''); this._query = ''; this._render(); this._layout();
        const position = this._scrollValues.get(`${this._model.data.active}:${view}`) ?? 0;
        this._timeout(0, () => { this._scroll.vadjustment.value = position; });
        if (view === 'add' || view === 'favorites') this._search.grab_key_focus();
    }
    _items() {
        return this._model.filter(this._query, item => this._name(item)).filter(item => this._kind === 'all' || (this._kind === 'files' ? item.type === 'uri' : item.type === 'app')).filter(item => !this._onlyRunning ||
            (item.type === 'app' && this._appSystem.lookup_app(item.target)?.state === Shell.AppState.RUNNING));
    }
    _candidates() {
        const query = normalize(this._query.trim()); if (query.length < 2) return [];
        return this._appSystem.get_installed().filter(i => i.should_show())
            .map(i => this._appSystem.lookup_app(i.get_id()))
            .filter(app => app && normalize(app.get_name()).includes(query) && !this._model.profile.items.some(i => i.type === 'app' && i.target === app.get_id()))
            .slice(0, 8);
    }
    _addApp(app) {
        this._change(() => this._model.add({id: app.get_id(), type: 'app', target: app.get_id(),
            category: this._model.category(categoryFor(app.get_app_info()?.get_categories())), quick: this._model.profile.items.length < this.settings.quickCount}));
        this._message(`${app.get_name()} añadida`);
    }
    _render() {
        if (!this._panel || !this._open) return;
        const focus = global.stage.get_key_focus();
        const focusedId = [...this._rows].find(([, r]) => focus && r.actor.contains(focus))?.[0];
        const scroll = this._scroll.vadjustment.value;
        this._clearPopup();
        for (const row of this._rows.values()) row.actor.get_parent()?.remove_child(row.actor);
        this._list.destroy_all_children();
        buttonContent(this._profileButton, `Espacio: ${this._model.profile.name}`, 'avatar-default-symbolic');
        this._profileButton.get_child().x_expand = true;
        this._profileButton.get_child().x_align = Clutter.ActorAlign.START;
        this._back.visible = this._view !== 'favorites'; this._filter.visible = this._view === 'favorites' && this._kind === 'apps';
        this._filter.set_style_class_name(`ai-button ai-filter${this._onlyRunning ? ' ai-selected' : ''}`);
        buttonContent(this._filter, 'En uso', this._onlyRunning ? 'object-select-symbolic' : 'media-playback-start-symbolic');
        this._search.visible = ['favorites', 'add'].includes(this._view);
        this._search.hint_text = this._view === 'add' ? 'Buscar una aplicación…' : 'Buscar archivos y favoritos';
        this._heading.text = {add: 'Añadir acceso', settings: 'Organizar', profiles: 'Espacios'}[this._view] ?? 'Tu espacio';
        this._undo.visible = !!this._model.undo;
        this._kinds.visible = this._view === 'favorites';
        for (const tab of this._kinds.get_children()) tab.set_style_class_name(`ai-button${tab.kind === this._kind ? ' ai-selected' : ''}`);
        if (this._view === 'settings') this._settingsView();
        else if (this._view === 'profiles') this._profilesView();
        else if (this._view === 'add') {
            edit(this._list, 'Carpeta, archivo o enlace', '', value => this._addResource(value));
            this._list.add_child(buttonContent(button('Pegar archivos copiados', () => this._pasteFiles()), 'Pegar archivos copiados', 'edit-paste-symbolic'));
            this._list.add_child(label('Aplicaciones favoritas', 'ai-section-title'));
            const apps = this._candidates();
            if (!apps.length) this._list.add_child(label(this._query.length < 2 ? 'Escribe al menos dos letras' : 'Sin coincidencias nuevas', 'ai-muted'));
            for (const app of apps) this._list.add_child(button(app.get_name(), () => this._addApp(app)));

        } else {
            const items = this._items();
            if (!items.length) {
                this._list.add_child(label(this._query || this._onlyRunning ? 'No hay coincidencias' : this._kind === 'files' ? 'Guarda aquí tus carpetas y archivos' : 'Elige tus accesos favoritos', 'ai-empty-title'));
                this._list.add_child(label('Copia archivos en Archivos y pégalos aquí,\no añade una ruta desde el botón +.', 'ai-empty-help'));
                this._list.add_child(button('Añadir carpeta, archivo o app', () => this._switch('add')));
            }
            for (const c of this._model.profile.categories) {
                const selected = items.filter(i => i.category === c.id);
                if (!selected.length) continue;
                const head = new St.BoxLayout({style_class: 'ai-category-head'});
                const toggle = buttonContent(button(c.name, () => this._change(() => { c.collapsed = !c.collapsed; })), c.name, c.collapsed && !this._query ? 'pan-end-symbolic' : 'pan-down-symbolic');
                toggle.get_child().x_align = Clutter.ActorAlign.START; toggle.get_child().x_expand = true;
                toggle.x_expand = true; toggle.add_style_class_name('ai-category-toggle'); head.add_child(toggle);
                head.add_child(label(String(selected.length), 'ai-category-count'));
                head.add_child(button(`Organizar ${c.name}`, () => this._categoryActions(c), 'view-more-symbolic'));
                this._list.add_child(head); this._dropTarget(head, c.id);
                if (c.collapsed && !this._query) continue;
                let row;
                for (const [index, item] of selected.entries()) {
                    if (this.settings.layout === 'list') this._list.add_child(this._row(item).actor);
                    else {
                        if (index % 3 === 0) { row = new St.BoxLayout({style_class: 'ai-grid-line', x_expand: true, y_expand: false}); this._list.add_child(row); }
                        row.add_child(this._row(item).actor);
                        if (index === selected.length - 1) for (let n = index % 3 + 1; n < 3; n++) row.add_child(new St.Widget({width: 92, x_expand: true}));
                    }
                }
            }
        }
        for (const [id, row] of this._rows) if (!this._model.profile.items.some(i => i.id === id)) { row.actor.destroy(); this._rows.delete(id); }
        this._updateStates();
        this._scroll.vadjustment.value = scroll;
        if (focusedId && this._rows.get(focusedId)?.actor.get_parent()) this._rows.get(focusedId).launch.grab_key_focus();
    }
    _row(item) {
        const signature = `${this.settings.layout}:${this._name(item)}:${item.target}:${item.category}`;
        let row = this._rows.get(item.id);
        if (row?.signature === signature && row.item === item) return row;
        row?.actor.destroy();
        const actor = column({style_class: this.settings.layout === 'grid' ? 'ai-tile' : 'ai-row', x_expand: true, y_expand: false});
        const content = this.settings.layout === 'grid' ? column({style_class: 'ai-tile-content'}) : new St.BoxLayout({style_class: 'ai-line'});
        const icon = this._icon(item, 44); icon.x_align = Clutter.ActorAlign.CENTER;
        content.add_child(icon); content.add_child(label(this._name(item)));
        const launch = button(this._name(item), (_b, mouse) => mouse === 3 ? this._actions(item) : this._launch(item, mouse === 2));
        launch.button_mask = PRIMARY | MIDDLE | SECONDARY; launch.set_child(content); actor.add_child(launch);
        const status = label('', 'ai-item-status'); actor.add_child(status);
        actor.accessible_name = this._name(item);
        const draggable = DND.makeDraggable(launch);
        launch._delegate = {island: this, itemId: item.id, getDragActor: () => this._icon(item), getDragActorSource: () => content.get_first_child()};
        draggable.connect('drag-begin', () => { this._dragging = true; this._clearPopup(); });
        draggable.connect('drag-end', () => { this._dragging = false; });
        draggable.connect('drag-cancelled', () => { this._dragging = false; });
        this._dropTarget(actor, item.category, item.id);
        launch.connect('key-focus-in', () => this._message(`${this._name(item)} · Enter para abrir · Menú para opciones`));
        launch.connect('notify::hover', () => {
            if (launch.hover) this._message(`${this._name(item)} · Clic derecho para opciones`);
            this._clear(this._previewTimer);
            if (launch.hover && this.settings.previews && item.type === 'app')
                this._previewTimer = this._timeout(550, () => { if (!this._dragging && this._open && launch.hover) this._windows(item); });
        });
        row = {actor, launch, status, signature, item}; this._rows.set(item.id, row); return row;
    }
    _dropTarget(actor, category, before = null) {
        actor._delegate = {
            handleDragOver: source => source.island === this ? DND.DragMotionResult.MOVE_DROP : DND.DragMotionResult.NO_DROP,
            acceptDrop: source => {
                if (source.island !== this) return false;
                this._timeout(0, () => this._change(() => this._model.move(source.itemId, category, before)));
                return true;
            },
        };
    }
    _updateStates() {
        for (const row of this._rows.values()) {
            const app = row.item.type === 'app' ? this._appSystem.lookup_app(row.item.target) : null;
            if (app?.state === Shell.AppState.RUNNING && this._pending.has(row.item.id)) {
                this._clear(this._pending.get(row.item.id)); this._pending.delete(row.item.id);
            }
            row.status.text = row.item.type !== 'app' ? '' : !app ? 'No instalada' : app.state === Shell.AppState.RUNNING ? '●' : this._pending.has(row.item.id) ? 'Abriendo…' : '';
            row.status.visible = true;
            row.status.opacity = row.status.text.length ? 255 : 0;
        }
        if (this._onlyRunning && this._open) {
            const ids = this._items().map(i => i.id).join('|');
            if (ids !== this._runningIds) { this._runningIds = ids; this._render(); }
        }
    }
    _popupBox(title) {
        this._clearPopup();
        const box = column({style_class: 'ai-popover', x_expand: true, y_expand: true});
        const head = new St.BoxLayout({style_class: 'ai-head'}); const name = label(title, 'ai-section-title'); name.x_expand = true;
        head.add_child(name); head.add_child(button('Cerrar opciones', () => this._clearPopup(), 'window-close-symbolic')); box.add_child(head);
        const scroll = new St.ScrollView({x_expand: true, y_expand: true, hscrollbar_policy: St.PolicyType.NEVER});
        const body = column({style_class: 'ai-list'}); scroll.set_child(body); box.add_child(scroll);
        this._popup = box; this._root.add_child(box); head.get_last_child().grab_key_focus(); return body;
    }
    _clearPopup() {
        if (!this._popup) return;
        this._popup.destroy(); this._popup = null;
        if (this._open) this._search?.grab_key_focus();
    }
    _actions(item) {
        const box = this._popupBox(this._name(item));
        const action = (title, fn) => box.add_child(button(title, () => { this._clearPopup(); fn(); }));
        action('Abrir', () => this._launch(item));
        if (item.type === 'uri' && item.target.startsWith('file:')) {
            const file = Gio.File.new_for_uri(item.target);
            if (file.query_file_type(Gio.FileQueryInfoFlags.NONE, null) === Gio.FileType.DIRECTORY)
                action('Ver contenido', () => this._folder(item));
        }
        if (item.type === 'app') {
            const app = this._appSystem.lookup_app(item.target);
            if (app?.can_open_new_window()) action('Nueva ventana', () => this._launch(item, true));
            if (app?.get_windows().length) action('Elegir ventana', () => this._windows(item));
        }
        action(item.quick ? 'Quitar de acceso rápido' : 'Fijar en acceso rápido', () => this._change(() => { item.quick = !item.quick; }));
        if (item.quick) {
            action('Subir en acceso rápido', () => this._change(() => this._model.reorderQuick(item.id, -1)));
            action('Bajar en acceso rápido', () => this._change(() => this._model.reorderQuick(item.id, 1)));
        }
        action(item.launch ? 'Excluir de Abrir grupo' : 'Incluir en Abrir grupo', () => this._change(() => { item.launch = !item.launch; }));
        edit(box, 'Nombre visible', this._name(item), value => this._change(() => { item.alias = value.trim().slice(0, 120); }));
        edit(box, 'Crear grupo y mover aquí', '', value => this._change(() => this._model.move(item.id, this._model.category(value))));
        box.add_child(label('Mover a', 'ai-section-title'));
        for (const c of this._model.profile.categories) action(c.name, () => this._change(() => this._model.move(item.id, c.id)));
        action('Subir', () => this._change(() => this._model.reorder(item.id, -1)));
        action('Bajar', () => this._change(() => this._model.reorder(item.id, 1)));
        action('Quitar favorita', () => this._change(() => this._model.remove(item.id)));
    }
    _windows(item) {
        const windows = this._appSystem.lookup_app(item.target)?.get_windows() ?? [];
        if (!windows.length) return;
        const box = this._popupBox(this._name(item));
        for (const window of windows) {
            const b = button(window.get_title() || this._name(item), () => { this._setOpen(false); Main.activateWindow(window); });
            const actor = window.get_compositor_private();
            if (actor && this.settings.previews) {
                const content = column({style_class: 'ai-list'});
                content.add_child(new Clutter.Clone({source: actor, width: 260, height: Math.max(40, Math.min(150, 260 * actor.height / Math.max(1, actor.width)))}));
                content.add_child(label(window.get_title() || this._name(item))); b.set_child(content);
            }
            box.add_child(b);
        }
    }
    _categoryActions(category) {
        const box = this._popupBox(category.name);
        box.add_child(button(category.quick ? 'Desfijar grupo del lateral' : 'Fijar grupo en el lateral', () => this._change(() => { category.quick = !category.quick; })));
        edit(box, 'Nombre de categoría', category.name, value => this._change(() => { if (value.trim()) category.name = value.trim().slice(0, 120); }));
        box.add_child(button('Abrir grupo', () => this._openGroup(category.id)));
        for (const [title, step] of [['Subir', -1], ['Bajar', 1]]) box.add_child(button(title, () => this._change(() => {
            const categories = this._model.profile.categories, i = categories.indexOf(category), j = i + step;
            if (j >= 0 && j < categories.length) [categories[i], categories[j]] = [categories[j], categories[i]];
        })));
        box.add_child(button('Eliminar categoría · conservar accesos', () => this._change(() => this._model.deleteCategory(category.id))));
    }
    _openGroup(category = null) {
        this._clearPopup();
        const items = this._model.profile.items.filter(i => i.launch && (!category || i.category === category));
        let index = 0; const failures = [];
        const next = () => {
            if (!this._root || index >= items.length) { this._message(`${index - failures.length}/${items.length} abiertos${failures.length ? ` · No se abrieron: ${failures.join(', ')}` : ''}`); return; }
            const item = items[index++];
            if (!this._launch(item, false, true)) failures.push(this._name(item));
            this._message(`Abriendo ${index}/${items.length}…`); this._timeout(150, next);
        }; next();
    }
    _addResource(value) {
        this._change(() => {
            value = value.trim(); if (value.startsWith('~/')) value = GLib.get_home_dir() + value.slice(1);
            const uri = value.startsWith('/') ? Gio.File.new_for_path(value).get_uri() : value;
            if (!/^(https?:\/\/|file:\/\/\/)/i.test(uri)) throw Error('Escribe una ruta absoluta o un enlace http/https.');
            if (uri.startsWith('file:') && !Gio.File.new_for_uri(uri).query_exists(null)) throw Error('La ruta no existe.');
            this._model.add({id: GLib.uuid_string_random(), type: 'uri', target: uri, category: this._model.category('Recursos'), alias: ''});
        });
    }
    _pasteFiles() {
        St.Clipboard.get_default().get_content(St.ClipboardType.CLIPBOARD, 'x-special/gnome-copied-files', (_clipboard, bytes) => {
            if (!this._root) return;
            if (!bytes) { this._message('Copia archivos en el gestor de archivos y vuelve a intentarlo.'); return; }
            const lines = new TextDecoder().decode(bytes.get_data ? bytes.get_data() : bytes).split('\n');
            const uris = lines.filter(line => line.startsWith('file:///')).slice(0, 40);
            this._change(() => {
                const category = this._model.category('Recursos');
                for (const uri of uris) if (Gio.File.new_for_uri(uri).query_exists(null))
                    this._model.add({id: GLib.uuid_string_random(), type: 'uri', target: uri, category});
            });
            this._message('Accesos añadidos. Los archivos originales permanecen en su ubicación.');
        });
    }
    _folder(item) {
        const box = this._popupBox(this._name(item));
        const popup = this._popup;
        box.add_child(button('Abrir carpeta', () => this._launch(item)));
        const file = Gio.File.new_for_uri(item.target);
        file.enumerate_children_async('standard::name,standard::display-name,standard::icon', Gio.FileQueryInfoFlags.NONE, GLib.PRIORITY_DEFAULT, null, (source, result) => {
            let enumerator;
            try {
                enumerator = source.enumerate_children_finish(result);
                enumerator.next_files_async(40, GLib.PRIORITY_DEFAULT, null, (cursor, batch) => {
                    try {
                        const entries = cursor.next_files_finish(batch);
                        if (!this._root || this._popup !== popup) return;
                        if (!entries.length) box.add_child(label('Esta carpeta está vacía', 'ai-muted'));
                        for (const info of entries) {
                            const target = {id: GLib.uuid_string_random(), type: 'uri', target: file.get_child(info.get_name()).get_uri(), alias: info.get_display_name()};
                            box.add_child(button(info.get_display_name(), () => this._launch(target)));
                        }
                        if (entries.length === 40) box.add_child(label('Abre la carpeta para ver todos los elementos', 'ai-muted'));
                    } catch (error) { this._message(error.message); }
                    finally { cursor.close_async(GLib.PRIORITY_DEFAULT, null, () => {}); }
                });
            } catch (error) { this._message(error.message); }
        });
    }
    _profilesView() {
        for (const profile of this._model.data.profiles) this._list.add_child(button(profile.name, () => {
            this._change(() => { this._model.data.active = profile.id; }); this._switch('favorites');
        }));
        edit(this._list, 'Nuevo perfil', '', value => this._change(() => this._model.newProfile(value)));
        edit(this._list, 'Renombrar perfil actual', this._model.profile.name, value => this._change(() => { if (value.trim()) this._model.profile.name = value.trim().slice(0, 120); }));
        this._list.add_child(button('Abrir recursos marcados del perfil', () => this._openGroup()));
        if (this._model.data.profiles.length > 1) this._list.add_child(button('Eliminar perfil · Deshacer disponible', () => this._change(() => this._model.transact(() => {
            this._model.data.profiles = this._model.data.profiles.filter(p => p.id !== this._model.data.active);
            this._model.data.active = this._model.data.profiles[0].id;
        }))));
    }
    _settingsView() {
        this._list.add_child(buttonContent(button('Ver estadísticas', () => { this._setOpen(false); this._statistics.show(true); }), 'Ver estadísticas', 'computer-symbolic'));
        edit(this._list, 'Nueva categoría', '', value => this._change(() => this._model.category(value)));
        const choice = (title, key, values, labels = values) => {
            const index = Math.max(0, values.indexOf(this.settings[key]));
            this._list.add_child(button(`${title}: ${labels[index]}`, () => this._change(() => { this.settings[key] = values[(index + 1) % values.length]; })));
        };
        choice('Estadísticas · zona inferior izquierda', 'statistics', [true, false], ['Activadas', 'Desactivadas']);
        choice('Apariencia', 'theme', ['auto', 'light', 'dark'], ['Aurea oscura', 'Clara', 'Oscura']);
        choice('Material', 'material', ['glass', 'solid'], ['Vidrio', 'Sólido']);
        choice('Distribución', 'layout', ['grid', 'list'], ['Cuadrícula', 'Lista']);
        choice('Densidad', 'density', ['comfortable', 'compact'], ['Cómoda', 'Compacta']);
        choice('Borde preferido', 'side', ['right', 'left'], ['Derecho', 'Izquierdo']);
        const monitors = Main.layoutManager.monitors;
        choice('Pantalla', 'monitor', ['primary', ...monitors.map(m => `${m.x},${m.y}`)], ['Principal', ...monitors.map((m, i) => `Pantalla ${i + 1} (${m.width}×${m.height})`)]);
        choice('Accesos rápidos', 'quickCount', [3, 4, 5, 6, 7, 8]);
        choice('Indicador de borde', 'edge', [1, 2, 3, 4, 6]);
        choice('Espera al abrir (ms)', 'delay', [80, 180, 300, 500]);
        choice('Espera al ocultar (ms)', 'hideDelay', [200, 400, 650, 1000]);
        choice('Vista previa al pasar el cursor', 'previews', [false, true], ['Desactivada', 'Activada']);
        edit(this._list, 'Atajo de teclado', this.settings.shortcut, value => {
            this._change(() => { this.settings.shortcut = value.trim(); }); this._shortcut();
        });
        this._list.add_child(button('Restaurar apariencia', () => this._change(() => {
            for (const key of ['theme', 'material', 'layout', 'density']) this.settings[key] = DEFAULTS[key];
        })));
        this._list.add_child(button('Restaurar apertura', () => { this._change(() => {
            for (const key of ['side', 'monitor', 'edge', 'delay', 'hideDelay', 'quickCount', 'shortcut']) this.settings[key] = DEFAULTS[key];
        }); this._shortcut(); }));
        edit(this._list, 'Exportar a ruta JSON', '', value => {
            try { this._store.export(value); this._message('Organización exportada.'); } catch (e) { this._message(e.message); }
        });
        edit(this._list, 'Importar desde ruta JSON', '', value => {
            try { this._model = this._store.import(value); this._renderBar(); this._switch('favorites'); this._theme(); this._shortcut(); }
            catch (e) { this._message(e.message); }
        });
    }
}
