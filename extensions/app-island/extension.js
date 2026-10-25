import Clutter from 'gi://Clutter';
import GLib from 'gi://GLib';
import Pango from 'gi://Pango';
import Shell from 'gi://Shell';
import St from 'gi://St';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as AppFavorites from 'resource:///org/gnome/shell/ui/appFavorites.js';
import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';

// ======================= AJUSTES =======================
const LADO = 'derecha';     // 'derecha' o 'izquierda'
const MAX_FAVS = 5;         // favoritos visibles en la barra
const MAX_GUARDADOS = 24;   // panel personal, no catálogo de aplicaciones
const ICONO = 28;           // icono en la barra
const BOTON = 40;           // botón compacto en la barra
const OFFSET_Y = 0;         // sube/baja la isla (negativo = sube)
const CURVA = 8;            // unión corta al borde, igual que el notch superior
const RADIO = 8;            // esquinas discretas, casi rectangulares
const ANCHO_BARRA = 54;
const ANCHO_PANEL = 360;
const ALTO_PANEL = 560;
const COLOR = [0.12, 0.14, 0.17, 0.78];   // Vidrio ahumado: conserva contraste sin negro opaco
const AUTO_OCULTAR = true;
const BORDE_VISIBLE = 6;
// =======================================================

const CATEGORIAS = [
    ['Internet', ['WebBrowser', 'Network', 'Email', 'InstantMessaging', 'Chat', 'P2P']],
    ['Multimedia', ['AudioVideo', 'Audio', 'Video', 'Player', 'Music']],
    ['Gráficos', ['Graphics', 'Photography']],
    ['Oficina', ['Office', 'Calendar', 'Spreadsheet']],
    ['Desarrollo', ['Development', 'IDE', 'Debugger']],
    ['Juegos', ['Game']],
    ['Sistema', ['System', 'Settings', 'Monitor', 'TerminalEmulator', 'PackageManager']],
    ['Utilidades', ['Utility', 'Accessibility', 'TextEditor', 'Archiving', 'FileManager']],
];
const HINT = 'Clic: abrir · Botón central: nueva ventana';

export default class SideDock extends Extension {
    enable() {
        this._alive = true;
        this._signals = [];
        this._sources = new Set();
        this._hintTimer = 0;
        this._queueId = 0;
        this._open = false;
        this._grab = null;
        this._captureSignal = 0;
        this._scroll = null;
        this._hint = null;
        this._view = 'favorites';
        this._collapsed = new Set();
        this._appSystem = Shell.AppSystem.get_default();

        this._file = GLib.build_filenamev([GLib.get_user_data_dir(), 'side-dock', 'favoritos.json']);
        GLib.mkdir_with_parents(GLib.path_get_dirname(this._file), 0o755);
        this._loadFavs();

        const side = LADO === 'derecha' ? Clutter.ActorAlign.END : Clutter.ActorAlign.START;

        this._root = new St.Widget({
            style_class: 'sd-root',
            layout_manager: new Clutter.BinLayout(),
            reactive: true,
            track_hover: true,
            clip_to_allocation: true,
        });
        this._bg = new St.DrawingArea({x_expand: true, y_expand: true});
        this._bg.connect('repaint', a => this._paint(a));
        this._root.add_child(this._bg);
        this._connect(this._root, 'notify::width', () => this._bg?.queue_repaint());
        this._connect(this._root, 'notify::height', () => this._bg?.queue_repaint());
        for (const property of ['x', 'y', 'width', 'height', 'translation-x', 'translation-y'])
            this._connect(this._root, `notify::${property}`, () => this._syncMonitorClip());
        this._connect(this._root, 'notify::hover', () => {
            this._clear(this._hideTimer);
            this._hideTimer = 0;
            if (this._root.hover || this._open)
                this._syncAutoHide(true);
            else
                this._hideTimer = this._timeout(650, () => {
                    this._hideTimer = 0;
                    this._syncAutoHide(true);
                });
        });

        this._bar = new St.BoxLayout({
            name: 'sideDockBar',
            style_class: 'sd-bar', orientation: Clutter.Orientation.VERTICAL, width: ANCHO_BARRA,
            x_expand: true, y_expand: true, x_align: side, y_align: Clutter.ActorAlign.CENTER,
        });
        this._bar.set_style(`padding: ${CURVA + 5}px 0;`);
        this._root.add_child(this._bar);

        this._panel = new St.BoxLayout({
            name: 'sideDockPanel',
            style_class: 'sd-panel', orientation: Clutter.Orientation.VERTICAL, width: ANCHO_PANEL,
            x_expand: true, y_expand: true, x_align: side, y_align: Clutter.ActorAlign.CENTER,
            visible: false, opacity: 0,
        });
        this._panel.set_style(`padding: ${CURVA + 12}px 20px;`);
        this._root.add_child(this._panel);

        // Tirador superpuesto al margen: no añade altura ni invade los iconos.
        this._handle = new St.Button({
            name: 'sideDockHandle', style_class: 'sd-handle', width: 7,
            reactive: true, can_focus: true, x_expand: true, y_expand: true,
            x_align: LADO === 'derecha' ? Clutter.ActorAlign.START : Clutter.ActorAlign.END,
            accessible_name: 'Abrir isla de favoritas',
            child: new St.Widget({style_class: 'sd-grip', width: 2, height: 26, x_expand: true, y_expand: true,
                x_align: Clutter.ActorAlign.CENTER, y_align: Clutter.ActorAlign.CENTER}),
        });
        this._handle.connect('clicked', () => this._setOpen(true));
        this._root.add_child(this._handle);

        // En GNOME Shell 50 un actor reactivo ya pertenece a la región de
        // entrada. El parámetro antiguo affectsInputRegion provoca que la
        // extensión falle al iniciar.
        Main.layoutManager.addChrome(this._root, {trackFullscreen: true});

        this._connect(this._appSystem, 'app-state-changed', () => this._queue());
        this._connect(this._appSystem, 'installed-changed', () => this._queue());
        this._connect(Main.layoutManager, 'monitors-changed', () => this._relayout());
        this._connect(Main.overview, 'showing', () => { this._setOpen(false); this._root?.hide(); });
        this._connect(Main.overview, 'hidden', () => this._root?.show());
        this._rebuildBar();
        this._apply(false);
        this._syncAutoHide(false);
        if (Main.overview.visible) this._root.hide();
    }

    disable() {
        this._alive = false;
        this._releaseInteraction();
        for (const id of [...this._sources]) { try { GLib.Source.remove(id); } catch (e) { /* nada */ } }
        this._sources.clear();
        for (const [obj, id] of this._signals) { try { obj.disconnect(id); } catch (e) { /* nada */ } }
        this._signals = [];
        if (this._root) {
            this._root.remove_all_transitions();
            try { Main.layoutManager.removeChrome(this._root); } catch (e) { /* nada */ }
            this._root.destroy();
            this._root = null;
        }
        this._bar = this._panel = this._bg = this._scroll = this._hint = null;
        this._handle = this._list = this._entry = this._tabs = this._subtitle = null;
        this._appSystem = null;
    }

    // ---------------------------------------------------------------- utilidades
    _connect(obj, signal, fn) {
        this._signals.push([obj, obj.connect(signal, fn)]);
    }

    _timeout(ms, fn) {
        const id = GLib.timeout_add(GLib.PRIORITY_DEFAULT, ms, () => {
            this._sources.delete(id);
            if (this._alive) { try { fn(); } catch (e) { console.error(`Side Dock timer: ${e.message}`); } }
            return GLib.SOURCE_REMOVE;
        });
        this._sources.add(id);
        return id;
    }

    _clear(id) {
        if (id && this._sources.has(id)) { GLib.Source.remove(id); this._sources.delete(id); }
    }

    _queue() {
        if (this._queueId) return;
        this._queueId = this._timeout(100, () => {
            this._queueId = 0;
            this._rebuildBar();
            if (this._open) this._renderContent();
        });
    }

    _adj() {
        try { return this._scroll?.vadjustment ?? this._scroll?.vscroll?.adjustment ?? null; } catch (e) { return null; }
    }

    // ---------------------------------------------------------------- favoritos
    _loadFavs() {
        this._favIds = null;
        try {
            const [ok, bytes] = GLib.file_get_contents(this._file);
            if (ok) {
                const d = JSON.parse(new TextDecoder().decode(bytes));
                if (Array.isArray(d.favoritos)) this._favIds = [...new Set(d.favoritos.filter(x => typeof x === 'string'))];
            }
        } catch (e) { /* primera vez */ }
        if (!this._favIds) {
            this._favIds = AppFavorites.getAppFavorites().getFavorites().map(a => a.get_id()).slice(0, MAX_FAVS);
            this._saveFavs();
        }
    }

    _saveFavs() {
        try {
            GLib.file_set_contents(this._file, JSON.stringify({favoritos: this._favIds}, null, 2));
        } catch (e) { console.error(`Side Dock: no se pudo guardar favoritos: ${e.message}`); }
    }

    _favApps() {
        return this._favIds.map(id => this._appSystem.lookup_app(id)).filter(Boolean);
    }

    _toggleFav(app) {
        const id = app.get_id();
        const i = this._favIds.indexOf(id);
        if (i >= 0) {
            this._favIds.splice(i, 1);
        } else {
            if (this._favApps().length >= MAX_GUARDADOS) {
                this._flash(`Máximo ${MAX_GUARDADOS} favoritas. Quita una primero.`);
                return;
            }
            this._favIds.push(id);
        }
        this._saveFavs();
        this._rebuildBar();
        if (this._open) this._renderContent();
        this._flash(`${app.get_name()} ${i >= 0 ? 'quitada de' : 'añadida a'} favoritas`);
    }

    _flash(text) {
        if (!this._hint) return;
        this._hint.text = text;
        this._clear(this._hintTimer);
        this._hintTimer = this._timeout(2800, () => { if (this._hint) this._hint.text = this._baseHint; });
    }

    // ---------------------------------------------------------------- forma (gota)
    _paint(area) {
        const cr = area.get_context();
        const [w, h] = area.get_surface_size();
        const F = Math.max(1, Math.min(CURVA, w - 1, h / 4));
        const bh = h - 2 * F;
        const R = Math.max(1, Math.min(RADIO, bh / 2, w - F));
        if (LADO !== 'derecha') { cr.translate(w, 0); cr.scale(-1, 1); }
        cr.newPath();
        cr.moveTo(w, 0);
        cr.arc(w - F, 0, F, 0, Math.PI / 2);                              // curva superior hacia el borde
        cr.lineTo(R, F);
        cr.arcNegative(R, F + R, R, -Math.PI / 2, -Math.PI);              // esquina superior interior
        cr.lineTo(0, F + bh - R);
        cr.arcNegative(R, F + bh - R, R, Math.PI, Math.PI / 2);           // esquina inferior interior
        cr.lineTo(w - F, F + bh);
        cr.arc(w - F, h, F, -Math.PI / 2, 0);                             // curva inferior hacia el borde
        cr.setSourceRGBA(...COLOR);
        cr.fillPreserve();                                                // relleno (el trazo abierto no dibuja el borde pegado a la pantalla)
        cr.setSourceRGBA(1, 1, 1, 0.12);
        cr.setLineWidth(1);
        cr.stroke();                                                      // borde fino tipo cristal
        cr.$dispose();
    }

    // ---------------------------------------------------------------- geometría
    _syncMonitorClip() {
        const actor = this._root;
        const monitor = Main.layoutManager.primaryMonitor;
        if (!actor || !monitor) return;
        // El escritorio virtual continúa en el monitor vecino. Ocultar por
        // traslación no basta: recortamos también el dibujo y la región de clic.
        // Se recalcula con cada propiedad animada, no con un temporizador.
        const x = actor.x + actor.translation_x;
        const y = actor.y + actor.translation_y;
        const left = Math.max(0, monitor.x - x);
        const top = Math.max(0, monitor.y - y);
        const right = Math.min(actor.width, monitor.x + monitor.width - x);
        const bottom = Math.min(actor.height, monitor.y + monitor.height - y);
        actor.set_clip(left, top, Math.max(0, right - left), Math.max(0, bottom - top));
    }

    _syncAutoHide(animate) {
        if (!this._root) return;
        const hidden = AUTO_OCULTAR && !this._open && !this._root.hover;
        const offset = hidden ? (ANCHO_BARRA - BORDE_VISIBLE) * (LADO === 'derecha' ? 1 : -1) : 0;
        if (animate)
            this._root.ease({translation_x: offset, duration: 220,
                mode: Clutter.AnimationMode.EASE_OUT_CUBIC});
        else
            this._root.translation_x = offset;
    }

    _geometry(open) {
        const m = Main.layoutManager.primaryMonitor;
        if (!m) return null;
        let w, h;
        if (open) {
            w = ANCHO_PANEL;
            h = Math.min(ALTO_PANEL, m.height - 120);
        } else {
            w = ANCHO_BARRA;
            h = this._bar.get_preferred_height(ANCHO_BARRA)[1];
        }
        const x = LADO === 'derecha' ? m.x + m.width - w : m.x;
        const y = Math.round(m.y + (m.height - h) / 2 + OFFSET_Y);
        return {x, y, w, h};
    }

    _apply(animate) {
        if (!this._root) return;
        const g = this._geometry(this._open);
        if (!g) return;
        if (animate) {
            this._root.ease({x: g.x, y: g.y, width: g.w, height: g.h, duration: 340,
                mode: Clutter.AnimationMode.EASE_OUT_QUART});
        } else {
            this._root.remove_all_transitions();
            this._root.set_position(g.x, g.y);
            this._root.set_size(g.w, g.h);
        }
    }

    _relayout() {
        if (!this._root) return;
        this._apply(false);
        const geometry = this._geometry(true);
        if (this._open && geometry) this._panel.set_height(geometry.h);
        this._syncAutoHide(false);
        this._syncMonitorClip();
    }

    // ---------------------------------------------------------------- abrir / cerrar
    _setOpen(open) {
        if (!this._root || this._open === open) return;
        this._open = open;
        this._clear(this._hideTimer);
        this._hideTimer = 0;
        this._syncAutoHide(true);
        const E = Clutter.AnimationMode;
        this._bar.remove_all_transitions();
        this._panel.remove_all_transitions();

        if (open) {
            this._view = 'favorites';
            this._handle.hide();
            this._buildPanel(this._geometry(true)?.h);
            this._panel.opacity = 0;
            this._panel.show();
            if (!this._acquireInteraction()) {
                this._open = false;
                this._panel.hide();
                this._bar.show();
                this._handle.show();
                this._apply(false);
                this._syncAutoHide(false);
                return;
            }
            this._bar.ease({opacity: 0, duration: 90, mode: E.LINEAR,
                onComplete: () => { if (this._open && this._bar) this._bar.hide(); }});
            this._panel.ease({opacity: 255, duration: 220, delay: 130, mode: E.EASE_OUT_CUBIC});
        } else {
            this._clear(this._searchTimer);
            this._clear(this._hintTimer);
            this._searchTimer = this._hintTimer = 0;
            this._releaseInteraction();
            this._handle.show();
            this._panel.ease({opacity: 0, duration: 90, mode: E.LINEAR,
                onComplete: () => {
                    if (this._open || !this._panel) return;
                    this._panel.hide();
                    this._panel.destroy_all_children();
                    this._scroll = null;
                    this._hint = null;
                    this._list = this._entry = this._tabs = this._subtitle = null;
                }});
            this._bar.opacity = 0;
            this._bar.show();
            this._bar.ease({opacity: 255, duration: 220, delay: 130, mode: E.EASE_OUT_CUBIC});
        }
        this._apply(true);
        if (open) this._closeButton.grab_key_focus();
    }

    _acquireInteraction() {
        if (!this._root) return false;
        if (this._grab) return true;
        try {
            this._captureSignal = this._root.connect(
                'captured-event', (_actor, event) => this._onEvent(event));
            this._grab = Main.pushModal(this._root, {
                actionMode: Shell.ActionMode.POPUP,
            });
            if (this._grab) return true;
            this._releaseInteraction();
            return false;
        } catch (e) {
            console.error(`Side Dock: no se pudo capturar la entrada: ${e.message}`);
            this._releaseInteraction();
            return false;
        }
    }

    _releaseInteraction() {
        if (this._captureSignal) {
            try { this._root?.disconnect(this._captureSignal); } catch (e) { /* nada */ }
            this._captureSignal = 0;
        }
        if (this._grab) {
            const grab = this._grab;
            this._grab = null;
            try { Main.popModal(grab); } catch (e) {
                console.debug(`Side Dock: el grab ya había sido liberado: ${e.message}`);
            }
        }
    }

    _onEvent(ev) {
        if (!this._open || !this._root) return Clutter.EVENT_PROPAGATE;
        const t = ev.type();
        if (t === Clutter.EventType.KEY_PRESS && ev.get_key_symbol() === Clutter.KEY_Escape) {
            this._setOpen(false);
            return Clutter.EVENT_STOP;
        }
        if (t === Clutter.EventType.BUTTON_PRESS || t === Clutter.EventType.TOUCH_BEGIN) {
            const [x, y] = ev.get_coords();
            const rx = this._root.x;
            const ry = this._root.y;
            const rw = this._root.width;
            const rh = this._root.height;
            let target = null;
            try { target = global.stage.get_event_actor(ev); } catch (e) { /* prueba sintética */ }
            const insideBounds = x >= rx && x <= rx + rw && y >= ry && y <= ry + rh;
            const inside = target ? this._root.contains(target) && insideBounds : insideBounds;
            if (!inside) {
                this._setOpen(false);
                // El clic que descarta la isla no debe atravesarla y activar
                // accidentalmente la ventana que está debajo.
                return Clutter.EVENT_STOP;
            }
        }
        return Clutter.EVENT_PROPAGATE;
    }

    // ---------------------------------------------------------------- barra
    _rebuildBar() {
        if (!this._bar) return;
        this._bar.destroy_all_children();
        const favs = this._favApps().slice(0, MAX_FAVS);
        for (const app of favs) this._bar.add_child(this._barButton(app));

        if (!this._open) this._apply(this._root.mapped);
    }

    _barButton(app) {
        const holder = new Clutter.Actor({layout_manager: new Clutter.FixedLayout(), width: BOTON, height: BOTON});
        const icon = app.create_icon_texture(ICONO);
        icon.set_position(Math.round((BOTON - ICONO) / 2), Math.round((BOTON - ICONO) / 2));
        holder.add_child(icon);
        const btn = new St.Button({
            style_class: 'sd-btn', reactive: true, can_focus: true, child: holder,
            x_align: Clutter.ActorAlign.CENTER, accessible_name: app.get_name(),
            button_mask: St.ButtonMask.ONE | St.ButtonMask.TWO | St.ButtonMask.THREE,
        });
        btn.connect('clicked', (_b, button) => {
            try {
                if (button === 3) this._setOpen(true);
                else if (button === 2 && app.can_open_new_window()) app.open_new_window(-1);
                else app.activate();
            } catch (e) { console.error(`Side Dock: ${e.message}`); }
        });
        return btn;
    }

    // ---------------------------------------------------------------- panel
    _groups(apps) {
        const map = new Map(CATEGORIAS.map(([n]) => [n, []]));
        const otras = [];
        for (const app of apps) {
            const info = app.get_app_info();
            const cats = (info?.get_categories?.() ?? '').split(';');
            const found = CATEGORIAS.find(([, keys]) => keys.some(k => cats.includes(k)));
            (found ? map.get(found[0]) : otras).push(app);
        }
        const sort = l => l.sort((a, b) => a.get_name().localeCompare(b.get_name()));
        return [...[...map.entries()].map(([n, l]) => [n, sort(l)]), ['Otras', sort(otras)]]
            .filter(([, list]) => list.length > 0);
    }

    _findCandidates(query) {
        const normalize = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase();
        const term = normalize(query.trim());
        if (term.length < 2) return [];
        return this._appSystem.get_installed()
            .filter(info => info.should_show() && !this._favIds.includes(info.get_id()))
            .map(info => this._appSystem.lookup_app(info.get_id()))
            .filter(app => app && normalize(app.get_name()).includes(term))
            .sort((a, b) => a.get_name().localeCompare(b.get_name()))
            .slice(0, 8);
    }

    _buildPanel(height) {
        if (!this._panel) return;
        this._panel.destroy_all_children();
        if (height) this._panel.set_height(height);

        const head = new St.BoxLayout({style_class: 'sd-head'});
        const title = new St.BoxLayout({orientation: Clutter.Orientation.VERTICAL, x_expand: true});
        title.add_child(new St.Label({text: 'Tu isla', style_class: 'sd-title'}));
        this._subtitle = new St.Label({text: 'Tus accesos, por categoría', style_class: 'sd-subtitle'});
        title.add_child(this._subtitle);
        head.add_child(title);
        head.add_child(this._action('list-add-symbolic', 'Añadir favorita', () => this._switchView('add')));
        this._closeButton = this._action('window-close-symbolic', 'Cerrar isla', () => this._setOpen(false));
        head.add_child(this._closeButton);
        this._panel.add_child(head);

        const tabs = new St.BoxLayout({style_class: 'sd-tabs'});
        this._tabs = new Map();
        for (const [view, label] of [['favorites', 'Favoritas'], ['running', 'En uso']]) {
            const button = new St.Button({label, style_class: 'sd-tab', reactive: true,
                can_focus: true, toggle_mode: true, x_expand: true});
            button.connect('clicked', () => this._switchView(view));
            tabs.add_child(button);
            this._tabs.set(view, button);
        }
        this._panel.add_child(tabs);

        this._entry = new St.Entry({style_class: 'sd-search', hint_text: 'Nombre de la aplicación…',
            accessible_name: 'Buscar una aplicación para añadir a favoritas', can_focus: true,
            primary_icon: new St.Icon({icon_name: 'edit-find-symbolic', icon_size: 16}), visible: false});
        this._entry.clutter_text.connect('text-changed', () => {
            this._clear(this._searchTimer);
            this._searchTimer = this._timeout(120, () => {this._searchTimer = 0; this._renderContent();});
        });
        this._panel.add_child(this._entry);

        this._scroll = new St.ScrollView({
            style_class: 'sd-scroll', overlay_scrollbars: true, x_expand: true, y_expand: true,
            hscrollbar_policy: St.PolicyType.NEVER, vscrollbar_policy: St.PolicyType.AUTOMATIC,
        });
        this._list = new St.BoxLayout({
            orientation: Clutter.Orientation.VERTICAL,
            style_class: 'sd-list',
        });
        this._scroll.set_child(this._list);
        this._panel.add_child(this._scroll);

        this._hint = new St.Label({text: HINT, style_class: 'sd-hint'});
        this._hint.clutter_text.line_wrap = true;
        this._hint.clutter_text.ellipsize = Pango.EllipsizeMode.NONE;
        this._panel.add_child(this._hint);
        this._renderContent();
    }

    _action(icon, label, callback) {
        const button = new St.Button({style_class: 'sd-action', reactive: true, can_focus: true,
            accessible_name: label, child: new St.Icon({icon_name: icon, icon_size: 16}),
            y_align: Clutter.ActorAlign.CENTER});
        button.connect('clicked', callback);
        return button;
    }

    _switchView(view) {
        this._view = view;
        this._entry.visible = view === 'add';
        this._subtitle.text = view === 'add' ? 'Añadir una favorita' : 'Tus accesos, por categoría';
        this._renderContent();
        const adj = this._adj();
        if (adj) adj.value = 0;
        if (view === 'add') this._entry.grab_key_focus();
    }

    _renderContent() {
        if (!this._open || !this._list) return;
        const focus = global.stage.get_key_focus();
        const restoreFocus = focus && this._list.contains(focus);
        const favorites = this._favApps();
        const running = this._appSystem.get_running();
        this._tabs.get('favorites').label = `Favoritas · ${favorites.length}`;
        this._tabs.get('running').label = `En uso · ${running.length}`;
        for (const [view, button] of this._tabs) button.checked = view === this._view;
        this._list.destroy_all_children();
        const adding = this._view === 'add';
        const query = this._entry.get_text();
        const apps = adding ? this._findCandidates(query) : this._view === 'running' ? running : favorites;
        if (!apps.length) {
            const text = adding ? (query.trim().length < 2
                ? 'Escribe al menos 2 letras.\nSolo aparecerán coincidencias para añadir.'
                : 'Sin coincidencias nuevas.\nPrueba con otro nombre.')
                : this._view === 'running' ? 'No hay aplicaciones abiertas.'
                    : 'Tu isla está lista.\nPulsa + para añadir tus favoritas.';
            const empty = new St.Label({text, style_class: 'sd-empty'});
            empty.clutter_text.line_wrap = true;
            this._list.add_child(empty);
        }
        for (const [name, group] of this._groups(apps)) this._section(this._list, name, group, adding);
        this._baseHint = adding ? 'Hasta 8 coincidencias · Pulsa + para guardar'
            : `Las primeras ${MAX_FAVS} favoritas aparecen en la barra.\n${HINT}`;
        this._hint.text = this._baseHint;
        // Una actualización de estado no debe dejar el teclado en un actor destruido.
        if (restoreFocus) (this._tabs.get(this._view) ?? this._closeButton).grab_key_focus();
    }

    _section(list, title, apps, adding) {
        const key = `${this._view}:${title}`;
        const card = new St.BoxLayout({style_class: 'sd-category', orientation: Clutter.Orientation.VERTICAL});
        const heading = new St.BoxLayout({style_class: 'sd-category-heading', x_expand: true});
        heading.add_child(new St.Label({text: title, x_expand: true}));
        heading.add_child(new St.Label({text: String(apps.length), style_class: 'sd-count'}));
        const arrow = new St.Icon({icon_name: this._collapsed.has(key) ? 'pan-end-symbolic' : 'pan-down-symbolic', icon_size: 12});
        heading.add_child(arrow);
        const toggle = new St.Button({child: heading, style_class: 'sd-category-toggle',
            reactive: true, can_focus: true, toggle_mode: true, checked: !this._collapsed.has(key),
            accessible_name: `${title}, ${apps.length} aplicaciones`});
        card.add_child(toggle);
        const body = new St.BoxLayout({orientation: Clutter.Orientation.VERTICAL, visible: !this._collapsed.has(key)});
        for (const app of apps) body.add_child(this._appRow(app, adding));
        card.add_child(body);
        toggle.connect('clicked', () => {
            if (toggle.checked) this._collapsed.delete(key);
            else this._collapsed.add(key);
            body.visible = toggle.checked;
            arrow.icon_name = toggle.checked ? 'pan-down-symbolic' : 'pan-end-symbolic';
        });
        list.add_child(card);
    }

    _activateApp(app, newWindow = false) {
        this._setOpen(false);
        try {
            if (newWindow && app.can_open_new_window()) app.open_new_window(-1);
            else app.activate();
        } catch (e) {
            console.error(`Side Dock: ${e.message}`);
            Main.notify('Isla lateral', `No se pudo abrir ${app.get_name()}.`);
        }
    }

    _appRow(app, adding) {
        const fav = this._favIds.includes(app.get_id());
        const row = new St.BoxLayout({style_class: 'sd-app-row'});
        const content = new St.BoxLayout({style_class: 'sd-app-content', x_expand: true});
        content.add_child(app.create_icon_texture(32));
        const text = new St.BoxLayout({orientation: Clutter.Orientation.VERTICAL, x_expand: true,
            y_align: Clutter.ActorAlign.CENTER});
        const name = new St.Label({text: app.get_name(), style_class: 'sd-name', x_expand: true});
        name.clutter_text.ellipsize = Pango.EllipsizeMode.END;
        text.add_child(name);
        const active = app.state === Shell.AppState.RUNNING;
        text.add_child(new St.Label({text: active ? 'En uso' : adding ? 'Añadir a tu isla' : 'Lista para abrir',
            style_class: active ? 'sd-app-status sd-running' : 'sd-app-status'}));
        content.add_child(text);
        const btn = new St.Button({
            style_class: 'sd-app-launch', reactive: true, can_focus: true, child: content, x_expand: true,
            accessible_name: adding ? `Añadir ${app.get_name()}` : `Abrir ${app.get_name()}`,
            button_mask: St.ButtonMask.ONE | St.ButtonMask.TWO,
        });
        btn.connect('clicked', (_b, button) => {
            if (adding) this._toggleFav(app);
            else this._activateApp(app, button === 2);
        });
        row.add_child(btn);
        const pin = this._action(fav ? 'starred-symbolic' : 'list-add-symbolic',
            `${fav ? 'Quitar de favoritas' : 'Añadir a favoritas'}: ${app.get_name()}`, () => this._toggleFav(app));
        if (fav) pin.add_style_class_name('sd-star');
        row.add_child(pin);
        return row;
    }
}
