import {Sound, Brightness, PowerProfiles, BatteryCare, AirplaneMode, Bluetooth, Privacy, btIcon} from './services.js';
import {KeyboardLight} from './keyboard-light.js';
import {run, busCall, settingsFor, settingsForExtension} from './platform.js';
import {ThemeTokens} from './theme-tokens.js';
import {PublishedMenus} from './published-menus.js';
import {PanelLayout, AdaptiveContrast} from './panel-layout.js';
import {MenuSurface} from './menu-surface.js';
import {ControlCenter} from './control-center.js';
import {Config} from './configuration.js';
import Clutter from 'gi://Clutter';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import Meta from 'gi://Meta';
import NM from 'gi://NM';
import Shell from 'gi://Shell';
import St from 'gi://St';

import * as AppFavorites from 'resource:///org/gnome/shell/ui/appFavorites.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import {Slider} from 'resource:///org/gnome/shell/ui/slider.js';
import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';




const AJUSTES = {
    INDICADORES_PRIVACIDAD: true,
    INDICADOR_TECLADO: true,
    SEMANA_INICIA_LUNES: true,
};

const CENTER = Clutter.ActorAlign.CENTER;
const START = Clutter.ActorAlign.START;
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));


const theme = {textColor: null, iconColor: null, menuDark: false, animMs: 70};

let ICON_DIR = '';
const fileIcon = name => Gio.icon_new_for_string(`${ICON_DIR}/${name}.svg`);

const iconProps = name => name.startsWith('lintel-')
    ? {gicon: fileIcon(name)}
    : {icon_name: name};

const ICON_RULES = [
    [/^Acerca de/, 'help-about-symbolic'],
    [/Tienda de aplicaciones/, 'system-software-install-symbolic'],
    [/^(Ajustes|Configuración)/, 'emblem-system-symbolic'],
    [/Forzar salida/, 'process-stop-symbolic'],
    [/^Suspender/, 'media-playback-pause-symbolic'],
    [/^Reiniciar/, 'system-reboot-symbolic'],
    [/^Apagar/, 'system-shutdown-symbolic'],
    [/^Bloquear/, 'system-lock-screen-symbolic'],
    [/^Cerrar sesión/, 'system-log-out-symbolic'],
    [/Captura/, 'camera-photo-symbolic'],
    [/Vista general/, 'focus-windows-symbolic'],
    [/^Aplicaciones$/, 'view-app-grid-symbolic'],
    [/fondo de pantalla|^Aspecto/, 'preferences-desktop-wallpaper-symbolic'],
    [/Abrir Calendario/, 'x-office-calendar-symbolic'],
    [/Abrir Archivos/, 'folder-symbolic'],
    [/Nueva ventana privada/, 'security-high-symbolic'],
    [/Nueva ventana/, 'window-new-symbolic'],
    [/Nueva carpeta/, 'folder-new-symbolic'],
    [/siguiente/i, 'go-next-symbolic'],
    [/anterior/i, 'go-previous-symbolic'],
    [/Nueva pestaña/, 'tab-new-symbolic'],
    [/Guardar/, 'document-save-symbolic'],
    [/Imprimir/, 'document-print-symbolic'],
    [/Ir a ubicación|Abrir ubicación/, 'folder-open-symbolic'],
    [/^Abrir/, 'document-open-symbolic'],
    [/Salir de/, 'application-exit-symbolic'],
    [/^Cerrar/, 'window-close-symbolic'],
    [/^Deshacer/, 'edit-undo-symbolic'],
    [/^Rehacer/, 'edit-redo-symbolic'],
    [/^Cortar/, 'edit-cut-symbolic'],
    [/^Copiar/, 'edit-copy-symbolic'],
    [/^Pegar/, 'edit-paste-symbolic'],
    [/Seleccionar todo/, 'edit-select-all-symbolic'],
    [/^Buscar/, 'edit-find-symbolic'],
    [/Acercar/, 'zoom-in-symbolic'],
    [/Alejar/, 'zoom-out-symbolic'],
    [/Tamaño real/, 'zoom-original-symbolic'],
    [/Pantalla completa/, 'view-fullscreen-symbolic'],
    [/Recargar|Actualizar/, 'view-refresh-symbolic'],
    [/^Minimizar|^Ocultar/, 'window-minimize-symbolic'],
    [/^Zoom$/, 'window-maximize-symbolic'],
    [/izquierda/, 'go-previous-symbolic'],
    [/derecha/, 'go-next-symbolic'],
    [/historial/i, 'document-open-recent-symbolic'],
    [/Añadir marcador/, 'bookmark-new-symbolic'],
    [/marcador/i, 'user-bookmarks-symbolic'],
    [/^Mostrar todo$/, 'view-restore-symbolic'],
    [/archivos ocultos/, 'view-reveal-symbolic'],
    [/^Atrás/, 'go-previous-symbolic'],
    [/^Adelante/, 'go-next-symbolic'],
    [/^Inicio|Carpeta personal/, 'go-home-symbolic'],
    [/Carpeta superior/, 'go-up-symbolic'],
    [/Propiedades/, 'document-properties-symbolic'],
    [/Como iconos/, 'view-grid-symbolic'],
    [/Como lista/, 'view-list-symbolic'],
    [/Código fuente/, 'text-x-generic-symbolic'],
    [/^Ayuda/, 'help-browser-symbolic'],
];

function iconFor(label) {
    if (!label)
        return null;
    for (const [re, icon] of ICON_RULES) {
        if (re.test(label))
            return icon;
    }
    return null;
}


const MODS = {
    ctrl: ['⌘', Clutter.KEY_Control_L],
    shift: ['⇧', Clutter.KEY_Shift_L],
    alt: ['⌥', Clutter.KEY_Alt_L],
    super: ['❖', Clutter.KEY_Super_L],
};
const KEY_GLYPH = {
    Left: '←', Right: '→', Up: '↑', Down: '↓', Return: '↩', Escape: '⎋',
    Tab: '⇥', Delete: '⌦', BackSpace: '⌫', plus: '+', minus: '−',
    comma: ',', Home: '↖', space: '␣',
};

function parseCombo(c) {
    const parts = c.split('+');
    return {key: parts.pop(), mods: parts};
}

function keyval(name) {
    return name.length === 1 ? name.toLowerCase().charCodeAt(0) : Clutter[`KEY_${name}`];
}

function hintOf(combo) {
    const {key, mods} = parseCombo(combo);
    const k = KEY_GLYPH[key] ?? (key.length === 1 ? key.toUpperCase() : key);
    if (theme.shortcuts === 'mac')
        return mods.map(m => MODS[m][0]).join('') + k;
    return [...mods.map(cap), k].join('+');
}


class Context {
    constructor(ext) {
        this.path = ext.path;
        ICON_DIR = `${ext.path}/icons`;
        this.win = null;
        this.app = null;
        this._sources = new Set();
        this._dev = null;
    }

    icon(name) {
        return fileIcon(name);
    }

    later(ms, fn) {
        const id = GLib.timeout_add(GLib.PRIORITY_DEFAULT, ms, () => {
            this._sources.delete(id);
            fn();
            return GLib.SOURCE_REMOVE;
        });
        this._sources.add(id);
        return id;
    }

    cancel(id) {
        if (id && this._sources.has(id)) {
            GLib.source_remove(id);
            this._sources.delete(id);
        }
    }

    sendKeys(combo, w = this.win) {
        this.later(150, () => {
            try {
                if (!w || !global.get_window_actors().some(actor => actor.meta_window === w)) return;
                if (global.display.focus_window !== w) Main.activateWindow(w);
                this.later(40, () => {
                    if (global.display.focus_window === w) this._press(combo);
                });
            } catch (e) {
                console.error(`[Lintel] atajo ${combo}: ${e}`);
            }
        });
    }

    _press(combo) {
        if (!this._dev) {
            const backend = global.stage.context?.get_backend?.() ?? Clutter.get_default_backend();
            this._dev = backend.get_default_seat()
                .create_virtual_device(Clutter.InputDeviceType.KEYBOARD_DEVICE);
        }
        const {key, mods} = parseCombo(combo);
        const kv = keyval(key);
        const P = Clutter.KeyState.PRESSED, R = Clutter.KeyState.RELEASED;
        const t = () => GLib.get_monotonic_time();
        mods.forEach(m => this._dev.notify_keyval(t(), MODS[m][1], P));
        this._dev.notify_keyval(t(), kv, P);
        this._dev.notify_keyval(t(), kv, R);
        [...mods].reverse().forEach(m => this._dev.notify_keyval(t(), MODS[m][1], R));
    }

    destroy() {
        this._sources.forEach(id => GLib.source_remove(id));
        this._sources.clear();
        this._dev?.run_dispose();
        this._dev = null;
    }
}


const LintelItem = GObject.registerClass(
class LintelItem extends PopupMenu.PopupBaseMenuItem {
    _init({
        label, icon, gicon, hint, checked = false, disabled = false, bold = false,
        info = false, heading = false, keepOpen = false, trailing = [],
    }) {
        super._init(info ? {activate: false, hover: false, can_focus: false} : {});
        this.add_style_class_name('lintel-item');
        this._keepOpen = keepOpen;
        this._keepOpenCb = null;
        if (info)
            this.add_style_class_name('lintel-item-info');
        if (heading)
            this.add_style_class_name('lintel-item-heading');
        if (!info) {

            if (gicon || checked || icon) {
                this._icon = new St.Icon({
                    style_class: 'popup-menu-icon lintel-item-icon',
                    y_align: CENTER,
                    ...(gicon ? {gicon} : {icon_name: checked ? 'object-select-symbolic' : icon}),
                });
                this.add_child(this._icon);
            } else {
                this.add_child(new St.Widget({style_class: 'lintel-item-icon-slot'}));
            }
        }
        this.label = new St.Label({
            text: label,
            x_expand: true,
            y_align: CENTER,
            style_class: bold ? 'lintel-item-label lintel-item-bold' : 'lintel-item-label',
        });
        this.add_child(this.label);
        this.label_actor = this.label;
        if (hint) {
            this.add_child(new St.Label({
                text: hint, y_align: CENTER, style_class: 'lintel-item-hint',
            }));
        }
        for (const name of trailing) {
            this.add_child(new St.Icon({
                ...iconProps(name), y_align: CENTER, style_class: 'lintel-item-trailing',
            }));
        }
        if (disabled)
            this.setSensitive(false);
    }

    activate(event) {
        if (this._keepOpen) {
            this._keepOpenCb?.(event);
            return;
        }
        super.activate(event);
    }
});


const LintelToggleItem = GObject.registerClass({
    Signals: {'toggled': {param_types: [GObject.TYPE_BOOLEAN]}},
}, class LintelToggleItem extends PopupMenu.PopupBaseMenuItem {
    _init(label, active) {
        super._init();
        this.add_style_class_name('lintel-item');
        this.add_style_class_name('lintel-toggle-item');
        this.label = new St.Label({
            text: label,
            x_expand: true,
            y_align: CENTER,
            style_class: 'lintel-item-label lintel-item-bold',
        });
        this.add_child(this.label);
        this.label_actor = this.label;
        this._switch = new PopupMenu.Switch(active);
        this._syncingState = false;
        this._switch.connect('notify::state', () => {
            if (!this._syncingState) this.emit('toggled', this._switch.state);
        });
        this._switch.y_align = CENTER;
        this.add_child(this._switch);
    }

    get state() {
        return this._switch.state;
    }


    setState(value) {
        this._syncingState = true;
        try { this._switch.state = value; }
        finally { this._syncingState = false; }
    }

    activate() {
        this._switch.toggle();
    }
});

function addItem(menu, opts, cb) {
    if (opts.icon === undefined && !opts.gicon && !opts.checked && !opts.info)
        opts = {...opts, icon: theme.menuIcons === 'none' ? null : /^(Apagar|Reiniciar|Suspender|Bloquear|Captura|Personalizar)/.test(opts.label) ? iconFor(opts.label) : null};
    const item = new LintelItem(opts);
    if (cb) {
        if (opts.keepOpen)
            item._keepOpenCb = cb;
        else
            item.connect('activate', cb);
    }
    menu.addMenuItem(item);
    return item;
}

const addSep = menu => menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
const addHeading = (menu, label) => addItem(menu, {label, info: true, heading: true});



const buttons = new Set();

function refreshTheme() {
    buttons.forEach(b => b.applyTheme());
}

const LintelButton = GObject.registerClass(
class LintelButton extends PanelMenu.Button {
    _init(name, align = 0.0, noMenu = false) {
        super._init(align, name, noMenu);
        this.add_style_class_name('lintel-button');
        this._before = null;
        this._hasMenu = !noMenu;

        this._noTint = false;
        buttons.add(this);
        this.connect('destroy', () => buttons.delete(this));
        if (!noMenu) {
            this.menu.actor.add_style_class_name('lintel-menu');
            this.menu.box.add_style_class_name('lintel-menu-content');
            this._wrapMenu();
        }
        this.applyTheme();
    }


    _wrapMenu() {
        this._surface = new MenuSurface(this.menu, () => {
            try { this._before?.(); }
            catch (error) { console.error(`[Aurea] menú: ${error}`); }
        }, () => theme);
        this.menu.connect('open-state-changed', (_, open) => this.retint(open));
    }

    beforeOpen(fn) {
        this._before = fn;
    }

    applyTheme() {
        if (this._hasMenu) {
            if (theme.menuDark)
                this.menu.actor.add_style_class_name('lintel-dark');
            else
                this.menu.actor.remove_style_class_name('lintel-dark');
        }
        this._surface?.apply();
        this.retint(this._hasMenu && this.menu.isOpen);
    }



    retint(open = false) {
        if (this._noTint)
            return;
        const paint = actor => {
            if (actor instanceof St.Label)
                actor.set_style(!open && theme.textColor ? `color: ${theme.textColor};` : null);
            else if (actor instanceof St.Icon)
                actor.set_style(!open && theme.iconColor ? `color: ${theme.iconColor};` : null);
            actor.get_children?.().forEach(paint);
        };
        this.get_children().forEach(paint);
    }
});

const TextButton = GObject.registerClass(
class TextButton extends LintelButton {
    _init(title, bold = false) {
        super._init(title, 0.0);
        this._text = new St.Label({
            text: title,
            y_align: CENTER,
            style_class: bold ? 'lintel-bar-label lintel-bar-bold' : 'lintel-bar-label',
        });
        this.add_child(this._text);
    }
});


const winOps = {
    close: ctx => ctx.win?.delete(global.get_current_time()),
    minimize: ctx => ctx.win?.minimize(),
    zoom: ctx => {
        const w = ctx.win;
        if (!w)
            return;
        try {
            const max = typeof w.is_maximized === 'function'
                ? w.is_maximized()
                : w.get_maximized() === Meta.MaximizeFlags.BOTH;
            if (max) {
                w.unmaximize();
            } else {
                try {
                    w.maximize();
                } catch (e) {
                    w.maximize(Meta.MaximizeFlags.BOTH);
                }
            }
        } catch (e) {
            console.error(`[Lintel] zoom: ${e}`);
        }
    },
    fullscreen: ctx => {
        const w = ctx.win;
        if (w)
            w.is_fullscreen() ? w.unmake_fullscreen() : w.make_fullscreen();
    },
};


const E = {
    undo: {label: 'Deshacer', keys: 'ctrl+z'},
    redo: {label: 'Rehacer', keys: 'ctrl+shift+z'},
    cut: {label: 'Cortar', keys: 'ctrl+x'},
    copy: {label: 'Copiar', keys: 'ctrl+c'},
    paste: {label: 'Pegar', keys: 'ctrl+v'},
    all: {label: 'Seleccionar todo', keys: 'ctrl+a'},
    find: {label: 'Buscar…', keys: 'ctrl+f'},
    zoomIn: {label: 'Acercar', keys: 'ctrl+plus'},
    zoomOut: {label: 'Alejar', keys: 'ctrl+minus'},
    zoom0: {label: 'Tamaño real', keys: 'ctrl+0'},
    full: {label: 'Pantalla completa', run: winOps.fullscreen},
    print: {label: 'Imprimir…', keys: 'ctrl+p'},
    closeWin: {label: 'Cerrar ventana', run: winOps.close},
};

const WINDOW_MENU = {
    title: 'Ventana',
    items: [
        {label: 'Minimizar', run: winOps.minimize},
        {label: 'Zoom', hint: '', run: winOps.zoom},
        {label: 'Mosaico a la izquierda', keys: 'super+Left'},
        {label: 'Mosaico a la derecha', keys: 'super+Right'},
        'sep',
        {label: 'Vista general', hint: 'Super', run: () => Main.overview.toggle()},
        'sep',
        'windows',
    ],
};

const HELP_MENU = {
    title: 'Ayuda',
    items: [
        {label: 'Buscar', hint: 'Super', run: () => Main.overview.show()},
        {label: (ctx, app) => `Ayuda de ${app?.get_name() ?? 'GNOME'}`, keys: 'F1'},
    ],
};

const MENUS = {
    desktop: [
        {title: 'Archivo', items: [
            {label: 'Abrir Archivos', run: () => run('nautilus')},
            {label: 'Captura de pantalla…', run: () => Main.screenshotUI.open()},
        ]},
        {title: 'Edición', items: [
            {label: 'Cambiar fondo de pantalla…', run: () => run('gnome-control-center background')},
            {label: 'Aspecto…', run: () => run('gnome-control-center appearance')},
        ]},
        {title: 'Visualización', items: [
            {label: 'Vista general de actividades', hint: 'Super', run: () => Main.overview.toggle()},
            {label: 'Aplicaciones', run: () => Main.overview.showApps()},
        ]},
        WINDOW_MENU,
        HELP_MENU,
    ],
    generic: [
        {title: 'Archivo', items: [
            {label: 'Nueva ventana', keys: 'ctrl+n'},
            {label: 'Abrir…', keys: 'ctrl+o'},
            {label: 'Guardar', keys: 'ctrl+s'},
            {label: 'Guardar como…', keys: 'ctrl+shift+s'},
            'sep', E.print, 'sep', E.closeWin,
        ]},
        {title: 'Edición', items: [
            E.undo, E.redo, 'sep', E.cut, E.copy, E.paste, E.all, 'sep', E.find,
        ]},
        {title: 'Visualización', items: [E.zoomIn, E.zoomOut, E.zoom0, 'sep', E.full]},
        WINDOW_MENU,
        HELP_MENU,
    ],
    files: [
        {title: 'Archivo', items: [
            {label: 'Nueva ventana', keys: 'ctrl+n'},
            {label: 'Nueva pestaña', keys: 'ctrl+t'},
            {label: 'Nueva carpeta', keys: 'ctrl+shift+n'},
            'sep',
            {label: 'Abrir', keys: 'Return'},
            {label: 'Propiedades', keys: 'alt+Return'},
            'sep', E.closeWin,
        ]},
        {title: 'Edición', items: [
            E.undo, 'sep', E.cut, E.copy, E.paste, E.all,
            {label: 'Invertir selección', keys: 'ctrl+shift+i'},
            'sep', E.find,
        ]},
        {title: 'Visualización', items: [
            {label: 'Como iconos', keys: 'ctrl+1'},
            {label: 'Como lista', keys: 'ctrl+2'},
            'sep',
            {label: 'Mostrar archivos ocultos', keys: 'ctrl+h'},
            'sep', E.zoomIn, E.zoomOut,
            {label: 'Actualizar', keys: 'F5'},
        ]},
        {title: 'Ir', items: [
            {label: 'Atrás', keys: 'alt+Left'},
            {label: 'Adelante', keys: 'alt+Right'},
            {label: 'Carpeta superior', keys: 'alt+Up'},
            'sep',
            {label: 'Carpeta personal', keys: 'alt+Home'},
            {label: 'Ir a ubicación…', keys: 'ctrl+l'},
        ]},
        WINDOW_MENU,
        HELP_MENU,
    ],
    browser: [
        {title: 'Archivo', items: [
            {label: 'Nueva pestaña', keys: 'ctrl+t'},
            {label: 'Nueva ventana', keys: 'ctrl+n'},
            {label: 'Nueva ventana privada',
                keys: (ctx, app) => /firefox/i.test(app?.get_id() ?? '') ? 'ctrl+shift+p' : 'ctrl+shift+n'},
            {label: 'Abrir ubicación…', keys: 'ctrl+l'},
            'sep',
            {label: 'Cerrar pestaña', keys: 'ctrl+w'},
            {label: 'Cerrar ventana', run: winOps.close},
            'sep', E.print,
        ]},
        {title: 'Edición', items: [E.undo, E.redo, 'sep', E.cut, E.copy, E.paste, E.all, 'sep', E.find]},
        {title: 'Visualización', items: [
            {label: 'Recargar esta página', keys: 'ctrl+r'},
            'sep', E.zoomIn, E.zoomOut, E.zoom0, 'sep', E.full,
            'sep',
            {label: 'Código fuente de la página', keys: 'ctrl+u'},
        ]},
        {title: 'Historial', items: [
            {label: 'Atrás', keys: 'alt+Left'},
            {label: 'Adelante', keys: 'alt+Right'},
            {label: 'Inicio', keys: 'alt+Home'},
            'sep',
            {label: 'Mostrar todo el historial', keys: 'ctrl+h'},
        ]},
        {title: 'Marcadores', items: [
            {label: 'Añadir marcador…', keys: 'ctrl+d'},
            {label: 'Mostrar marcadores', keys: 'ctrl+b'},
        ]},
        {title: 'Ventana', items: [
            {label: 'Pestaña siguiente', keys: 'ctrl+Tab'},
            {label: 'Pestaña anterior', keys: 'ctrl+shift+Tab'},
            'sep',
            ...WINDOW_MENU.items,
        ]},
        HELP_MENU,
    ],
    terminal: [
        {title: 'Shell', items: [
            {label: 'Nueva pestaña', keys: 'ctrl+shift+t'},
            {label: 'Nueva ventana', keys: 'ctrl+shift+n'},
            'sep',
            {label: 'Cerrar pestaña', keys: 'ctrl+shift+w'},
            {label: 'Cerrar ventana', run: winOps.close},
        ]},
        {title: 'Edición', items: [
            {label: 'Copiar', keys: 'ctrl+shift+c'},
            {label: 'Pegar', keys: 'ctrl+shift+v'},
            {label: 'Seleccionar todo', keys: 'ctrl+shift+a'},
            'sep',
            {label: 'Buscar…', keys: 'ctrl+shift+f'},
        ]},
        {title: 'Visualización', items: [E.zoomIn, E.zoomOut, E.zoom0, 'sep', E.full]},
        WINDOW_MENU,
        HELP_MENU,
    ],
};

function profileFor(app) {
    if (!app)
        return 'desktop';
    const id = (app.get_id() ?? '').toLowerCase();
    const cats = (app.get_app_info?.()?.get_categories?.() ?? '').toLowerCase();
    if (/nautilus|org\.gnome\.files|nemo|dolphin|thunar|caja/.test(id))
        return 'files';
    if (cats.includes('webbrowser') || /firefox|chrome|chromium|epiphany|brave|vivaldi|opera|msedge/.test(id))
        return 'browser';
    if (cats.includes('terminalemulator') || /terminal|console|kitty|alacritty|ptyxis|wezterm|foot/.test(id))
        return 'terminal';
    return 'generic';
}

function fillMenu(menu, specs, ctx, app) {
    const target = ctx.win;
    const captured = Object.create(ctx); captured.win = target;
    for (const spec of specs) {
        if (spec === 'sep') {
            addSep(menu);
            continue;
        }
        if (spec === 'windows') {
            const wins = app?.get_windows() ?? [];
            if (!wins.length)
                addItem(menu, {label: 'Sin ventanas', disabled: true});
            for (const w of wins) {
                addItem(menu, {label: w.get_title() || app.get_name(), checked: w === ctx.win},
                    () => Main.activateWindow(w));
            }
            continue;
        }
        const label = typeof spec.label === 'function' ? spec.label(ctx, app) : spec.label;
        const keys = typeof spec.keys === 'function' ? spec.keys(ctx, app) : spec.keys;
        const unsupported = !spec.run && (!target || profileFor(app) === 'generic');
        addItem(menu, {label, hint: keys ? hintOf(keys) : spec.hint, disabled: unsupported}, () => {
            if (target && !global.get_window_actors().some(actor => actor.meta_window === target)) return;
            if (spec.run) spec.run(captured, app);
            else ctx.sendKeys(keys, target);
        });
    }
}

const MenuBarButton = GObject.registerClass(
class MenuBarButton extends TextButton {
    _init(ctx, spec, app) {
        super._init(spec.title);
        this._ctx = ctx;
        this._spec = spec;
        this._app = app;
        this.beforeOpen(() => this._build());
        this._build();
    }

    _build() {
        this.menu.removeAll();
        if (this._spec.model) this._ctx.published.fill(this.menu, this._spec.model, addItem);
        else fillMenu(this.menu, this._spec.items, this._ctx, this._app);
    }
});


function sessionCall(method, params = null) {
    busCall(Gio.DBus.session, 'org.gnome.SessionManager', '/org/gnome/SessionManager',
        'org.gnome.SessionManager', method, params);
}

const AppleButton = GObject.registerClass(
class AppleButton extends LintelButton {
    _init(ctx) {
        super._init('Menú de la manzana', 0.0);
        this._ctx = ctx;
        this.add_child(new St.Icon({
            gicon: ctx.icon('lintel-apple-symbolic'),
            style_class: 'system-status-icon lintel-apple-icon',
            y_align: CENTER,
        }));
        this.beforeOpen(() => this._build());
        this._build();
    }

    _build() {
        const menu = this.menu, ctx = this._ctx, app = ctx.app;
        menu.removeAll();
        addItem(menu, {label: 'Acerca de este equipo'}, () => run('gnome-control-center system'));
        addSep(menu);
        addItem(menu, {label: 'Personalizar Aurea…'}, () => ctx.openPreferences());
        addItem(menu, {label: 'Configuración del Sistema…'}, () => run('gnome-control-center'));
        addItem(menu, {label: 'Tienda de aplicaciones…'}, () => run('gnome-software'));
        addSep(menu);

        const favs = new PopupMenu.PopupSubMenuMenuItem('Aplicaciones favoritas', true);
        favs.icon.icon_name = 'starred-symbolic';
        favs.icon.add_style_class_name('lintel-item-icon');
        for (const fav of AppFavorites.getAppFavorites().getFavorites()) {
            addItem(favs.menu, {label: fav.get_name(), gicon: fav.get_icon()}, () => fav.activate());
        }
        menu.addMenuItem(favs);
        addItem(menu, {label: 'Vista general de actividades', hint: 'Super'}, () => Main.overview.toggle());
        addItem(menu, {label: 'Captura de pantalla…', hint: 'Impr Pant'}, () => Main.screenshotUI.open());
        addSep(menu);
        addItem(menu, {
            label: app ? `Forzar salida de ${app.get_name()}` : 'Forzar salida…',
            disabled: !app,
        }, () => app?.get_windows().forEach(w => w.kill()));
        addSep(menu);
        addItem(menu, {label: 'Suspender'}, () => busCall(Gio.DBus.system, 'org.freedesktop.login1',
            '/org/freedesktop/login1', 'org.freedesktop.login1.Manager', 'Suspend',
            new GLib.Variant('(b)', [true])));
        addItem(menu, {label: 'Reiniciar…'}, () => sessionCall('Reboot'));
        addItem(menu, {label: 'Apagar…'}, () => sessionCall('Shutdown'));
        addSep(menu);
        addItem(menu, {label: 'Bloquear pantalla', hint: 'Super+L'},
            () => Main.screenShield.lock(true));
        addItem(menu, {label: `Cerrar sesión de ${GLib.get_real_name()}…`},
            () => sessionCall('Logout', new GLib.Variant('(u)', [0])));
    }
});


const AppNameButton = GObject.registerClass(
class AppNameButton extends TextButton {
    _init(ctx) {
        super._init('Escritorio', true);
        this._ctx = ctx;
        this._app = null;
        this.beforeOpen(() => this._build());
        this._build();
    }

    setApp(app) {
        this._app = app;
        this._text.text = app ? app.get_name() : 'Escritorio';
        this.accessible_name = this._text.text;
    }

    _workspaceWindows() {
        return global.workspace_manager.get_active_workspace().list_windows()
            .filter(w => w.get_window_type() === Meta.WindowType.NORMAL);
    }

    _build() {
        const menu = this.menu, ctx = this._ctx, app = this._app;
        menu.removeAll();
        if (!app) {
            addItem(menu, {label: 'Acerca de GNOME Shell'}, () => run('gnome-control-center system'));
            addSep(menu);
            addItem(menu, {label: 'Ajustes…'}, () => run('gnome-control-center'));
            return;
        }
        const name = app.get_name();
        addItem(menu, {label: `Acerca de ${name}`},
            () => run(`gnome-software --details=${GLib.shell_quote(app.get_id())}`));
        addSep(menu);


        const info = app.get_app_info?.();
        const actions = info?.list_actions?.() ?? [];
        if (actions.length) {
            addSep(menu);
            for (const a of actions) {
                addItem(menu, {label: info.get_action_name(a)},
                    () => info.launch_action(a, global.create_app_launch_context(0, -1)));
            }
        }
        addSep(menu);
        addItem(menu, {label: `Ocultar ${name}`},
            () => app.get_windows().forEach(w => w.minimize()));
        addItem(menu, {label: 'Ocultar otros'}, () => {
            const tracker = Shell.WindowTracker.get_default();
            this._workspaceWindows()
                .filter(w => !w.minimized && tracker.get_window_app(w) !== app)
                .forEach(w => w.minimize());
        });
        addItem(menu, {label: 'Mostrar todo'},
            () => this._workspaceWindows().forEach(w => w.minimized && w.unminimize()));
        addSep(menu);
        addItem(menu, {label: `Salir de ${name}`}, () => app.request_quit());
    }
});


const UPowerProxy = Gio.DBusProxy.makeProxyWrapper(`
<node><interface name="org.freedesktop.UPower.Device">
  <property name="State" type="u" access="read"/>
  <property name="Percentage" type="d" access="read"/>
  <property name="TimeToEmpty" type="x" access="read"/>
  <property name="TimeToFull" type="x" access="read"/>
  <property name="IsPresent" type="b" access="read"/>
  <property name="IconName" type="s" access="read"/>
</interface></node>`);

const fmtHM = s => `${Math.floor(s / 3600)}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}`;


const batteryIcon = p => {
    const pct = Math.round(clamp(p.Percentage / 100) * 20) * 5;
    const plugged = [1, 4, 5].includes(p.State);
    return `lintel-battery-${pct}${plugged ? '-charging' : ''}-symbolic`;
};

const BatteryButton = GObject.registerClass(
class BatteryButton extends LintelButton {
    _init() {
        super._init('Batería', 1.0);
        this._dead = false;
        const box = new St.BoxLayout({style_class: 'lintel-battery-indicator'});
        this._pct = new St.Label({y_align: CENTER, style_class: 'lintel-bar-label lintel-tnum'});
        this._icon = new St.Icon({
            style_class: 'system-status-icon lintel-battery-icon',
            gicon: fileIcon('lintel-battery-100-symbolic'),
        });
        box.add_child(this._pct);
        box.add_child(this._icon);
        this.add_child(box);
        this.container.visible = false;
        this._proxy = new UPowerProxy(Gio.DBus.system, 'org.freedesktop.UPower',
            '/org/freedesktop/UPower/devices/DisplayDevice', (p, err) => {
                if (err || this._dead)
                    return;
                this._id = p.connect('g-properties-changed', () => this._sync());
                this._sync();
            });
        this.connect('destroy', () => {
            this._dead = true;
            if (this._id)
                this._proxy?.disconnect(this._id);
            this._proxy = null;
        });
        this.beforeOpen(() => this._build());
    }

    _sync() {
        const p = this._proxy;
        if (!p)
            return;
        this.container.visible = !!p.IsPresent;
        this._pct.text = `${Math.round(p.Percentage)}%`;
        this._icon.gicon = fileIcon(batteryIcon(p));
    }

    _build() {
        const menu = this.menu, p = this._proxy;
        menu.removeAll();
        if (!p)
            return;
        const charging = p.State === 1, full = p.State === 4;
        addItem(menu, {label: 'Batería', bold: true, info: true});
        addItem(menu, {
            label: `${Math.round(p.Percentage)} %  ·  ${full ? 'Completa' : charging ? 'Cargando' : 'Usando batería'}`,
            info: true,
        });
        const secs = charging ? Number(p.TimeToFull) : Number(p.TimeToEmpty);
        if (!full && secs > 0) {
            addItem(menu, {
                label: charging ? `${fmtHM(secs)} para completar la carga` : `${fmtHM(secs)} restantes`,
                info: true,
            });
        }
        addSep(menu);
        addItem(menu, {label: 'Ajustes de Batería…'}, () => run('gnome-control-center power'));
    }
});


const BluetoothButton = GObject.registerClass(
class BluetoothButton extends LintelButton {
    _init(ctx) {
        super._init('Bluetooth', 1.0);
        this._ctx = ctx;
        this._header = null;
        this._list = null;
        this._listSig = '';
        this._rebuildId = 0;
        this._icon = new St.Icon({
            style_class: 'system-status-icon',
            gicon: fileIcon('lintel-bluetooth-off-symbolic'),
        });
        this.add_child(this._icon);
        this.menu.box.add_style_class_name('lintel-menu-wide');
        this._off = ctx.bluetooth.onChange(() => this._onModel());
        this.beforeOpen(() => this._build());
        this.menu.connect('open-state-changed', (m, open) => this._onOpenChanged(open));
        this.connect('destroy', () => {
            if (this._pollId) GLib.source_remove(this._pollId);
            this._pollId = 0;
        });
        this.connect('destroy', () => this._off());
        this._sync();
    }

    _sync() {
        const bluetooth = this._ctx.bluetooth;
        this.container.visible = bluetooth.available;
        this._icon.gicon = fileIcon(bluetooth.powered
            ? 'lintel-bluetooth-on-symbolic'
            : 'lintel-bluetooth-off-symbolic');
    }

    _onModel() {
        this._sync();
        if (!this.menu.isOpen)
            return;
        if (this._ctx.bluetooth.powered)
            this._ctx.bluetooth.startDiscovery();
        this._soon();
    }

    _onOpenChanged(open) {
        const bluetooth = this._ctx.bluetooth;
        if (this._pollId) GLib.source_remove(this._pollId);
        this._pollId = 0;
        if (open) {
            bluetooth.refresh();
            bluetooth.startDiscovery();
            this._pollId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 2, () => {
                bluetooth.refresh();
                return GLib.SOURCE_CONTINUE;
            });
        } else {
            bluetooth.stopDiscovery();
        }
    }


    _soon() {
        if (this._rebuildId)
            return;
        this._rebuildId = this._ctx.later(200, () => {
            this._rebuildId = 0;
            if (!this.menu.isOpen)
                return;
            this._header?.setState(this._ctx.bluetooth.powered);
            this._fillList(false);
        });
    }

    _build() {
        const menu = this.menu, bluetooth = this._ctx.bluetooth;
        menu.removeAll();
        this._header = new LintelToggleItem('Bluetooth', bluetooth.powered);
        this._header.connect('toggled', (item, state) => bluetooth.setPowered(state));
        menu.addMenuItem(this._header);
        this._list = new PopupMenu.PopupMenuSection();
        menu.addMenuItem(this._list);
        this._listSig = '';
        this._fillList(true);
        addSep(menu);
        addItem(menu, {label: 'Ajustes de Bluetooth…'}, () => run('gnome-control-center bluetooth'));
    }

    _fillList(force) {
        const list = this._list, bluetooth = this._ctx.bluetooth;
        if (!list)
            return;
        const paired = bluetooth.paired;
        const nearby = bluetooth.nearby.slice(0, 8);
        const sig = JSON.stringify([
            bluetooth.powered, bluetooth.discovering,
            paired.map(d => [d.path, d.name, d.icon, d.connected, bluetooth.isBusy(d)]),
            nearby.map(d => [d.path, d.name, d.icon, bluetooth.isBusy(d)]),
        ]);
        if (!force && sig === this._listSig)
            return;
        this._listSig = sig;
        list.removeAll();
        if (!bluetooth.powered)
            return;

        const row = device => addItem(list, {
            label: device.name,
            icon: btIcon(device.icon),
            hint: bluetooth.isBusy(device) ? 'Conectando…' : device.connected ? 'Conectado' : undefined,
            keepOpen: true,
        }, () => bluetooth.toggleDevice(device));

        addSep(list);
        if (paired.length) {
            addHeading(list, 'Mis dispositivos');
            paired.forEach(row);
        }
        addHeading(list, 'Dispositivos cercanos');
        nearby.forEach(row);
        if (!nearby.length) {
            addItem(list, {
                label: bluetooth.discovering ? 'Buscando dispositivos…' : 'Sin dispositivos cercanos',
                info: true,
            });
        }
    }
});


const wifiLevel = s => s > 80 ? 'excellent' : s > 55 ? 'good' : s > 30 ? 'ok' : s > 5 ? 'weak' : 'none';

const wifiBars = s => s > 55 ? 3 : s > 30 ? 2 : s > 5 ? 1 : 0;
const ssidOf = ap => {
    const raw = ap.get_ssid();
    return raw ? NM.utils_ssid_to_utf8(raw.get_data()) : null;
};

const WifiButton = GObject.registerClass(
class WifiButton extends LintelButton {
    _init(ctx) {
        super._init('Wi-Fi', 1.0);
        this._ctx = ctx;
        this._dead = false;
        this._cancel = new Gio.Cancellable();
        this._client = null;
        this._ids = [];
        this._devIds = [];
        this._apId = 0;
        this._ap = null;
        this._rebuildId = 0;
        this._scanId = 0;
        this._header = null;
        this._list = null;
        this._listSig = '';
        this._connecting = null;
        this._listeners = new Set();
        this._icon = new St.Icon({
            style_class: 'system-status-icon',
            gicon: fileIcon('lintel-wifi-off-symbolic'),
        });
        this.add_child(this._icon);
        this.container.visible = false;
        this.menu.box.add_style_class_name('lintel-menu-wide');
        this.beforeOpen(() => this._build());
        this.menu.connect('open-state-changed', (m, open) => this._onOpenChanged(open));
        this.connect('destroy', () => this._teardown());
        NM.Client.new_async(this._cancel, (o, res) => {
            try {
                const c = NM.Client.new_finish(res);
                if (this._dead)
                    return;
                this._client = c;
                this._ids = [
                    'notify::wireless-enabled', 'notify::active-connections',
                    'notify::connectivity', 'device-added', 'device-removed',
                ]
                    .map(s => c.connect(s, () => this._sync()));
                this._sync();
            } catch (e) {
                console.error(`[Lintel] NetworkManager: ${e}`);
            }
        });
    }

    onChange(fn) {
        this._listeners.add(fn);
        return () => this._listeners.delete(fn);
    }

    get enabled() {
        return this._client?.wireless_enabled ?? false;
    }

    get device() {
        return this._client?.get_devices().find(d => d.get_device_type() === NM.DeviceType.WIFI) ?? null;
    }

    get activeSsid() {
        const ap = this.device?.get_active_access_point?.();
        return ap ? ssidOf(ap) : null;
    }

    get ethernetDevices() {
        return this._client?.get_devices()
            .filter(d => d.get_device_type() === NM.DeviceType.ETHERNET) ?? [];
    }

    get ethernetAvailable() {
        return this.ethernetDevices.length > 0;
    }

    get ethernetConnected() {
        return this.ethernetDevices.some(d => d.get_state() === NM.DeviceState.ACTIVATED);
    }

    get ethernetName() {
        const device = this.ethernetDevices
            .find(d => d.get_state() === NM.DeviceState.ACTIVATED);
        return device?.get_active_connection?.()?.get_id?.() ?? null;
    }

    get vpnAvailable() {
        return this._client?.get_connections()
            .some(c => c.get_connection_type?.() === 'vpn') ?? false;
    }

    get vpnActive() {
        return this._client?.get_active_connections()
            .some(c => c.get_vpn?.()) ?? false;
    }

    setEnabled(v) {
        if (!this._client || this._powerPending) return;
        this._powerPending = true;
        this._listeners.forEach(fn => fn());
        this._client.dbus_set_property(NM.DBUS_PATH, NM.DBUS_INTERFACE, 'WirelessEnabled',
            GLib.Variant.new_boolean(v), 10000, this._cancel, (client, result) => {
                try { client.dbus_set_property_finish(result); }
                catch (error) { if (!this._dead) Main.notifyError('Wi-Fi', error.message); }
                this._powerPending = false;
                if (!this._dead) this._listeners.forEach(fn => fn());
            });
    }

    _watch() {
        const dev = this.device;
        this._devIds.forEach(([o, id]) => GObject.signal_handler_disconnect(o, id));
        this._devIds = [];
        if (dev) {
            this._devIds.push([dev, dev.connect('notify::active-access-point', () => this._sync())]);
            this._devIds.push([dev, dev.connect('notify::last-scan', () => this._soon())]);
            this._devIds.push([dev, dev.connect('notify::state', () => this._soon())]);
            this._devIds.push([dev, dev.connect('access-point-added', () => this._soon())]);
            this._devIds.push([dev, dev.connect('access-point-removed', () => this._soon())]);
        }
        for (const device of this.ethernetDevices)
            this._devIds.push([device, device.connect('notify::state', () => this._sync())]);
        this._watchedDev = dev;
        this._watchedDevices = this._deviceSignature();
    }

    _deviceSignature() {
        return this._client?.get_devices().map(d => d.get_path()).sort().join('|') ?? '';
    }

    _sync() {
        if (this._dead)
            return;
        const dev = this.device;
        if (dev !== this._watchedDev || this._deviceSignature() !== this._watchedDevices)
            this._watch();
        this.container.visible = !!dev;
        const ap = dev?.get_active_access_point?.() ?? null;
        if (this._apId && this._ap)
            this._ap.disconnect(this._apId);
        this._apId = 0;
        this._ap = ap;
        if (ap)
            this._apId = ap.connect('notify::strength', () => this._sync());
        this._icon.gicon = fileIcon(!this.enabled
            ? 'lintel-wifi-off-symbolic'
            : `lintel-wifi-${ap ? wifiBars(ap.get_strength()) : 0}-symbolic`);
        this._listeners.forEach(f => f());
        this._soon();
    }

    _scan() {
        if (!this.enabled)
            return;
        try {
            this.device?.request_scan_async(this._cancel, (device, result) => {
                try { device.request_scan_finish(result); } catch (error) { }
            });
        } catch (e) {

        }
    }

    _onOpenChanged(open) {
        this._ctx.cancel(this._scanId);
        this._scanId = 0;
        if (!open)
            return;
        this._scan();

        const tick = () => {
            if (!this.menu.isOpen)
                return;
            this._scan();
            this._scanId = this._ctx.later(8000, tick);
        };
        this._scanId = this._ctx.later(8000, tick);
    }


    _soon() {
        if (!this.menu.isOpen || this._rebuildId)
            return;
        this._rebuildId = this._ctx.later(250, () => {
            this._rebuildId = 0;
            if (!this.menu.isOpen)
                return;
            this._header?.setState(this.enabled);
            this._fillList(false);
        });
    }

    _build() {
        const menu = this.menu;
        menu.removeAll();
        this._header = new LintelToggleItem('Wi-Fi', this.enabled);
        this._header.connect('toggled', (item, state) => {
            this.setEnabled(state);
            if (state)
                this._ctx.later(1500, () => this._scan());
        });
        menu.addMenuItem(this._header);
        this._list = new PopupMenu.PopupMenuSection();
        menu.addMenuItem(this._list);
        this._listSig = '';
        this._fillList(true);
        addSep(menu);
        addItem(menu, {label: 'Ajustes de Wi-Fi…'}, () => run('gnome-control-center wifi'));
    }

    _knownSsids() {
        const known = new Set();
        for (const conn of this._client?.get_connections() ?? []) {
            const raw = conn.get_setting_wireless?.()?.get_ssid();
            if (raw)
                known.add(NM.utils_ssid_to_utf8(raw.get_data()));
        }
        return known;
    }

    _networkRows() {
        const dev = this.device;
        if (!dev)
            return [];
        const active = this.activeSsid;
        const known = this._knownSsids();
        const best = new Map();
        for (const ap of dev.get_access_points()) {
            const ssid = ssidOf(ap);
            if (!ssid)
                continue;
            const current = best.get(ssid);
            if (!current || current.get_strength() < ap.get_strength())
                best.set(ssid, ap);
        }
        return [...best.entries()].map(([ssid, ap]) => ({
            ssid,
            ap,
            active: ssid === active,
            secure: ap.get_rsn_flags() !== 0 || ap.get_wpa_flags() !== 0,
            strength: ap.get_strength(),
            known: known.has(ssid),
        })).sort((a, b) => (b.active - a.active) || (b.known - a.known) || (b.strength - a.strength));
    }

    _fillList(force) {
        const list = this._list;
        if (!list)
            return;
        const rows = this.enabled ? this._networkRows() : [];
        const sig = JSON.stringify([
            this.enabled, !!this.device, this._connecting,
            rows.map(r => [r.ssid, r.active, r.secure, wifiLevel(r.strength), r.known]),
        ]);
        if (!force && sig === this._listSig)
            return;
        this._listSig = sig;
        list.removeAll();
        if (!this.enabled || !this.device)
            return;

        addSep(list);
        if (!rows.length) {
            addItem(list, {label: 'Buscando redes…', info: true});
            return;
        }
        const row = r => addItem(list, {
            label: r.ssid,
            icon: null,
            checked: r.active,
            hint: this._connecting === r.ssid ? 'Conectando…' : undefined,
            trailing: [
                ...(r.secure ? ['channel-secure-symbolic'] : []),
                `lintel-wifi-${wifiBars(r.strength)}-symbolic`,
            ],
            keepOpen: true,
        }, () => {
            if (!r.active)
                this._connect(r);
        });

        const active = rows.filter(r => r.active);
        const others = rows.filter(r => !r.active).slice(0, 12);
        active.forEach(row);
        if (others.length) {
            addHeading(list, active.length ? 'Otras redes' : 'Redes cercanas');
            others.forEach(row);
        }
    }

    _connect(row) {
        const dev = this.device;
        if (!this._client || !dev || this._connecting)
            return;
        this._connecting = row.ssid;
        this._listeners.forEach(fn => fn());
        this._fillList(true);

        const finish = (client, res, added) => {
            if (this._dead)
                return;
            try {
                if (added)
                    client.add_and_activate_connection_finish(res);
                else
                    client.activate_connection_finish(res);
            } catch (e) {
                Main.notifyError('Wi-Fi', `${row.ssid}: ${e.message}`);
            }
            this._connecting = null;
            this._listeners.forEach(fn => fn());
            if (this.menu.isOpen)
                this._fillList(true);
        };

        const known = this._client.get_connections().find(conn => {
            const raw = conn.get_setting_wireless?.()?.get_ssid();
            return raw && NM.utils_ssid_to_utf8(raw.get_data()) === row.ssid;
        });
        if (known) {
            this._client.activate_connection_async(known, dev, row.ap.get_path(), this._cancel,
                (c, r) => finish(c, r, false));
        } else {

            this._client.add_and_activate_connection_async(null, dev, row.ap.get_path(), this._cancel,
                (c, r) => finish(c, r, true));
        }
    }

    _teardown() {
        this._dead = true;
        this._cancel.cancel();
        this._ctx.cancel(this._scanId);
        this._ctx.cancel(this._rebuildId);
        this._ids.forEach(id => this._client?.disconnect(id));
        this._devIds.forEach(([o, id]) => GObject.signal_handler_disconnect(o, id));
        if (this._apId && this._ap)
            this._ap.disconnect(this._apId);
        this._listeners.clear();
        this._client = null;
    }
});


function makeSlider(value, onChange, styleClass = 'lintel-slider') {
    const slider = new Slider(value);
    slider.add_style_class_name(styleClass);
    slider.x_expand = true;
    slider.y_align = CENTER;
    let busy = false;
    slider.connect('notify::value', () => {
        if (!busy)
            onChange(slider.value);
    });
    slider.setSilently = v => {
        busy = true;
        slider.value = v;
        busy = false;
    };
    return slider;
}


const SoundButton = GObject.registerClass(
class SoundButton extends LintelButton {
    _init(ctx) {
        super._init('Sonido', 1.0);
        this._ctx = ctx;
        this._icon = new St.Icon({
            style_class: 'system-status-icon',
            gicon: fileIcon('lintel-sound-medium-symbolic'),
        });
        this.add_child(this._icon);
        this._off = ctx.sound.onChange(() => this._sync());
        this.connect('destroy', () => this._off());
        this.beforeOpen(() => this._build());
        this._sync();
    }

    _sync() {
        this._icon.gicon = fileIcon(this._ctx.sound.iconFile);
        this.container.visible = this._ctx.sound.ready;
        if (this._slider)
            this._slider.setSilently(this._ctx.sound.level);
    }

    _build() {
        const menu = this.menu, sound = this._ctx.sound;
        menu.removeAll();
        addItem(menu, {label: 'Sonido', bold: true, info: true});
        const row = new PopupMenu.PopupBaseMenuItem({activate: false});
        row.add_style_class_name('lintel-slider-row');
        const mute = new St.Button({child: new St.Icon({icon_name: sound.iconName, style_class: 'lintel-slider-icon'}),
            style_class: 'lintel-slider-button', can_focus: true});
        mute.connect('clicked', () => sound.toggleMute());
        this._slider = makeSlider(sound.level, v => sound.setLevel(v));
        row.add_child(mute);
        row.add_child(this._slider);
        row.connect('key-press-event', (a, ev) => this._slider.emit('key-press-event', ev));
        menu.addMenuItem(row);

        const sinks = sound.sinks;
        if (sinks.length > 1) {
            addSep(menu);
            addItem(menu, {label: 'Salida', bold: true, info: true});
            for (const s of sinks) {
                addItem(menu, {label: s.description ?? s.name, checked: s === sound.sink},
                    () => sound.setDefault(s));
            }
        }
        addSep(menu);
        addItem(menu, {label: 'Ajustes de Sonido…'}, () => run('gnome-control-center sound'));
    }
});


const SearchButton = GObject.registerClass(
class SearchButton extends LintelButton {
    _init() {
        super._init('Buscar', 1.0, true);
        this.add_child(new St.Icon({
            style_class: 'system-status-icon',
            gicon: fileIcon('lintel-search-symbolic'),
        }));
        this.connect('button-release-event', (_, event) => {
            if (event.get_button() !== Clutter.BUTTON_PRIMARY) return Clutter.EVENT_PROPAGATE;
            this.activate(); return Clutter.EVENT_STOP;
        });
        this.connect('key-press-event', (_, event) => {
            if (![Clutter.KEY_Return, Clutter.KEY_space].includes(event.get_key_symbol())) return Clutter.EVENT_PROPAGATE;
            this.activate(); return Clutter.EVENT_STOP;
        });
    }
    activate() { Main.overview.toggle(); }
});


const PrivacyButton = GObject.registerClass(
class PrivacyButton extends LintelButton {
    _init(ctx) {
        super._init('Privacidad', 1.0, true);
        this._ctx = ctx;
        this._noTint = true;
        this.reactive = false;
        this.can_focus = false;
        const box = new St.BoxLayout({style_class: 'lintel-privacy-box'});
        const make = (icon, cls) => new St.Icon({
            gicon: fileIcon(icon),
            style_class: `system-status-icon lintel-priv-icon ${cls}`,
        });
        this._mic = make('lintel-mic-symbolic', 'lintel-priv-mic');
        this._camera = make('lintel-camera-symbolic', 'lintel-priv-camera');
        this._screen = make('lintel-record-symbolic', 'lintel-priv-screen');
        [this._mic, this._camera, this._screen].forEach(i => box.add_child(i));
        this.add_child(box);
        this._off = ctx.privacy.onChange(() => this._sync());
        this.connect('destroy', () => this._off());
        this._sync();
    }

    _sync() {
        const p = this._ctx.privacy;
        this._mic.visible = p.mic;
        this._camera.visible = p.camera;
        this._screen.visible = p.screen;
        this.container.visible = p.any;
    }
});


const KeyboardButton = GObject.registerClass(
class KeyboardButton extends LintelButton {
    _init(ctx) {
        super._init('Teclado', 1.0);
        this._ctx = ctx;
        this._dead = false;
        this._mgr = null;
        this._ids = [];
        this._label = new St.Label({y_align: CENTER, style_class: 'lintel-bar-label lintel-kbd-label'});
        this.add_child(this._label);
        this.container.visible = false;
        this.beforeOpen(() => this._build());
        this.connect('destroy', () => {
            this._dead = true;
            this._ids.forEach(id => this._mgr?.disconnect(id));
            this._ids = [];
            this._mgr = null;
        });
        import('resource:///org/gnome/shell/ui/status/keyboard.js').then(mod => {
            if (this._dead)
                return;
            this._mgr = mod.getInputSourceManager();
            this._ids = ['sources-changed', 'current-source-changed']
                .map(s => this._mgr.connect(s, () => this._sync()));
            this._sync();
        }).catch(e => console.error(`[Lintel] teclado no disponible: ${e}`));
    }

    _sources() {
        return Object.values(this._mgr?.inputSources ?? {}).sort((a, b) => a.index - b.index);
    }

    _sync() {
        if (this._dead)
            return;
        const current = this._mgr?.currentSource;
        this._label.text = (current?.shortName ?? current?.displayName ?? '').toUpperCase();
        this.container.visible = this._sources().length > 1;
    }

    _build() {
        const menu = this.menu, current = this._mgr?.currentSource;
        menu.removeAll();
        for (const source of this._sources()) {
            addItem(menu, {label: source.displayName ?? source.shortName, checked: source === current},
                () => source.activate(true));
        }
        addSep(menu);
        addItem(menu, {label: 'Ajustes de Teclado…'}, () => run('gnome-control-center keyboard'));
    }
});







const ControlCenterButton = GObject.registerClass(
class ControlCenterButton extends LintelButton {
    _init(ctx) {
        super._init('Centro de Control', 1.0);
        this.menu.actor.add_style_class_name('lintel-cc-menu');
        this.menu.box.add_style_class_name('lintel-cc-menu-content');
        this.add_child(new St.Icon({gicon: ctx.icon('lintel-controls-symbolic'), style_class: 'system-status-icon'}));
        this.controls = new ControlCenter(this, ctx, {settingsFor, settingsForExtension, makeSlider, run});
        this.connect('destroy', () => this.controls.destroy());
    }
});

const ClockButton = GObject.registerClass(
class ClockButton extends LintelButton {
    _init(ctx) {
        super._init('Fecha y hora', 1.0);
        this._ctx = ctx;
        this._text = new St.Label({y_align: CENTER, style_class: 'lintel-bar-label lintel-tnum'});
        this.add_child(this._text);
        this._settings = settingsFor('org.gnome.desktop.interface');
        this._off = ctx.config.onChange(() => this._tick());
        this._formatId = this._settings.connect('changed::clock-format', () => this._tick());
        this._timer = 0;
        this._tick();
        this.connect('destroy', () => {
            this._off(); this._settings.disconnect(this._formatId);
            if (this._timer) GLib.source_remove(this._timer);
        });

        const holder = new PopupMenu.PopupBaseMenuItem({activate: false, hover: false, can_focus: false});
        holder.add_style_class_name('lintel-cal-holder');
        this._cal = new St.BoxLayout({orientation: Clutter.Orientation.VERTICAL, style_class: 'lintel-cal'});
        holder.add_child(this._cal);
        this.menu.addMenuItem(holder);
        addSep(this.menu);
        addItem(this.menu, {label: 'Abrir Calendario…'}, () => run('gnome-calendar'));
        addItem(this.menu, {label: 'Ajustes de Fecha y Hora…'}, () => run('gnome-control-center datetime'));
        this.beforeOpen(() => {
            const now = GLib.DateTime.new_now_local();
            this._y = now.get_year();
            this._m = now.get_month();
            this._draw();
        });
    }

    _tick() {
        if (this._timer) GLib.source_remove(this._timer);
        const c = this._ctx.config.values, now = GLib.DateTime.new_now_local();
        const format = c.clockFormat === 'system' ? this._settings.get_string('clock-format') : c.clockFormat;
        const time = (format === '12h' ? '%-I:%M' : '%H:%M') + (c.clockSeconds ? ':%S' : '') + (format === '12h' ? ' %p' : '');
        this._text.text = now.format((c.clockDate ? '%a %-d %b  ' : '') + time);
        this.accessible_name = now.format('%A %-d %B, %H:%M');
        this._timer = GLib.timeout_add(GLib.PRIORITY_DEFAULT, c.clockSeconds ? 1000 : (60 - now.get_second()) * 1000, () => {
            this._timer = 0; this._tick(); return GLib.SOURCE_REMOVE;
        });
    }

    _shift(delta) {
        this._m += delta;
        if (this._m < 1) {
            this._m = 12;
            this._y--;
        } else if (this._m > 12) {
            this._m = 1;
            this._y++;
        }
        this._draw();
    }

    _calendarCell(text, styleClass) {
        const cell = new St.Widget({
            style_class: styleClass,
            layout_manager: new Clutter.BinLayout(),
        });
        if (text) {
            cell.add_child(new St.Label({
                text,
                x_align: CENTER,
                y_align: CENTER,
                style_class: 'lintel-cal-cell-label',
            }));
        }
        return cell;
    }

    _draw() {
        this._cal.destroy_all_children();
        const first = GLib.DateTime.new_local(this._y, this._m, 1, 0, 0, 0);
        const days = first.add_months(1).add_days(-1).get_day_of_month();
        const dow = first.get_day_of_week();
        const offset = AJUSTES.SEMANA_INICIA_LUNES ? dow - 1 : dow % 7;
        const now = GLib.DateTime.new_now_local();

        const head = new St.BoxLayout({style_class: 'lintel-cal-head'});
        head.add_child(new St.Label({text: cap(first.format('%B %Y')), x_expand: true, y_align: CENTER,
            style_class: 'lintel-cal-title'}));
        for (const [icon, d] of [['go-previous-symbolic', -1], ['go-next-symbolic', 1]]) {
            const b = new St.Button({child: new St.Icon({icon_name: icon, style_class: 'lintel-cal-nav-icon'}),
                style_class: 'lintel-cal-nav', can_focus: true});
            b.connect('clicked', () => this._shift(d));
            head.add_child(b);
        }
        this._cal.add_child(head);

        const weekdays = new St.BoxLayout();
        const base = AJUSTES.SEMANA_INICIA_LUNES ? 1 : 7;
        for (let i = 0; i < 7; i++) {
            const d = GLib.DateTime.new_local(2024, 1, base + i, 0, 0, 0);
            const weekend = d.get_day_of_week() >= 6;
            weekdays.add_child(this._calendarCell(d.format('%a').charAt(0).toUpperCase(),
                weekend ? 'lintel-cal-cell lintel-cal-weekday lintel-cal-weekend'
                    : 'lintel-cal-cell lintel-cal-weekday'));
        }
        this._cal.add_child(weekdays);

        let row = null;
        for (let i = 0; i < Math.ceil((offset + days) / 7) * 7; i++) {
            if (i % 7 === 0) {
                row = new St.BoxLayout();
                this._cal.add_child(row);
            }
            const n = i - offset + 1;
            if (n < 1 || n > days) {
                row.add_child(this._calendarCell('', 'lintel-cal-cell'));
                continue;
            }
            const isToday = n === now.get_day_of_month() && this._m === now.get_month() && this._y === now.get_year();
            const weekend = i % 7 >= (AJUSTES.SEMANA_INICIA_LUNES ? 5 : 6) || (!AJUSTES.SEMANA_INICIA_LUNES && i % 7 === 0);
            let cls = 'lintel-cal-cell lintel-cal-day';
            if (weekend)
                cls += ' lintel-cal-weekend';
            if (isToday)
                cls += ' lintel-cal-today';
            row.add_child(this._calendarCell(String(n), cls));
        }
    }
});


export default class LintelV2 extends Extension {
    enable() {
        this._alive = true;
        this._ctx = new Context(this);
        const ctx = this._ctx;
        this._signals = [];
        this._native = [];
        this._dyn = [];
        this._appId = undefined;
        this._appTimer = 0;

        this._cfg = new Config();
        ctx.config = this._cfg;
        ctx.openPreferences = () => this.openPreferences();
        ctx.published = new PublishedMenus(() => {
            ctx.cancel(this._menusTimer);
            this._menusTimer = ctx.later(120, () => {
                this._menusTimer = 0;
                if (!Main.panel.menuManager.activeMenu) this._rebuildMenus(ctx.app);
            });
        });
        ctx.sound = new Sound();
        ctx.brightness = new Brightness();
        ctx.keyboardLight = new KeyboardLight();
        ctx.powerProfiles = new PowerProfiles();
        ctx.batteryCare = new BatteryCare();
        ctx.airplaneMode = new AirplaneMode();
        ctx.bluetooth = new Bluetooth();
        ctx.privacy = new Privacy(ctx);
        ctx.sound.load();

        this._tokens = new ThemeTokens();
        this._hideNative();
        this._applyPanelStyle();

        const panel = Main.panel;
        this._apple = new AppleButton(ctx);
        this._name = new AppNameButton(ctx);
        this._name.connect('destroy', () => { this._alive = false; ctx.cancel(this._appTimer); });
        panel.addToStatusArea('lintel-apple', this._apple, 0, 'left');
        panel.addToStatusArea('lintel-app', this._name, 1, 'left');



        ctx.wifi = new WifiButton(ctx);
        this._right = [];
        if (AJUSTES.INDICADORES_PRIVACIDAD)
            this._right.push(['lintel-privacy', new PrivacyButton(ctx)]);
        if (AJUSTES.INDICADOR_TECLADO)
            this._right.push(['lintel-keyboard', new KeyboardButton(ctx)]);
        this._right.push(
            ['lintel-battery', new BatteryButton()],
            ['lintel-wifi', ctx.wifi],
            ['lintel-bluetooth', new BluetoothButton(ctx)],
            ['lintel-sound', new SoundButton(ctx)],
            ['lintel-search', new SearchButton()],
            ['lintel-cc', new ControlCenterButton(ctx)],
            ['lintel-clock', new ClockButton(ctx)],
        );
        for (const [role, button] of this._right) {

            button.add_style_class_name(role === 'lintel-clock' ? 'lintel-right-text' : 'lintel-right');
            panel.addToStatusArea(role, button, panel._rightBox.get_n_children(), 'right');
        }

        this._preview = Gio.DBusExportedObject.wrapJSObject('<node><interface name="org.aurea.Topbar"><method name="Preview"/></interface></node>', {
            Preview: () => Main.panel.statusArea['lintel-cc'].menu.open(),
        });
        this._preview.export(Gio.DBus.session, '/org/aurea/Topbar');
        const tracker = Shell.WindowTracker.get_default();
        this._tracker = tracker;
        this._signals.push([tracker, tracker.connect('notify::focus-app', () => this._queueApp())]);
        this._signals.push([global.display, global.display.connect('notify::focus-window', () => {
            const w = global.display.focus_window;
            if (w && [Meta.WindowType.NORMAL, Meta.WindowType.DIALOG].includes(w.get_window_type())) {
                ctx.win = w;
                ctx.published.setWindow(w);
            }
        })]);
        ctx.win = global.display.focus_window;
        ctx.published.setWindow(ctx.win);
        this._queueApp(true);
        this._layout = new PanelLayout(this, title => {
            const button = new TextButton('•••'); button.accessible_name = title; return button;
        }, addItem);
        this._contrast = new AdaptiveContrast(this._cfg, () => this._applyTheme());
        this._layoutOffs = [ctx.wifi, ctx.bluetooth, ctx.sound, ctx.privacy].map(model => model.onChange(() => this._layout?.queue()));
        refreshTheme();
    }

    disable() {
        this._alive = false;
        this._contrast?.destroy(); this._contrast = null;
        this._layoutOffs?.forEach(off => off()); this._layoutOffs = [];
        this._layout?.destroy(); this._layout = null;
        this._signals?.forEach(([o, id]) => o.disconnect(id));
        this._signals = null;
        this._ctx?.cancel(this._appTimer);
        this._dyn.forEach(b => b.destroy());
        this._dyn = [];
        this._right?.forEach(([, b]) => b.destroy());
        this._right = null;
        this._name?.destroy();
        this._apple?.destroy();
        this._name = this._apple = null;
        this._preview?.unexport(); this._preview = null;
        this._tokens?.destroy(); this._tokens = null;
        this._restorePanelStyle();
        this._native.forEach(([c, v]) => v ? c.show() : c.hide());
        this._native = [];
        this._ctx?.published?.destroy();
        this._ctx?.privacy?.destroy();
        this._ctx?.sound?.destroy();
        this._ctx?.brightness?.destroy();
        this._ctx?.keyboardLight?.destroy();
        this._ctx?.powerProfiles?.destroy();
        this._ctx?.batteryCare?.destroy();
        this._ctx?.airplaneMode?.destroy();
        this._ctx?.bluetooth?.destroy();
        this._ctx?.destroy();
        this._ctx = null;
        this._cfg?.destroy();
        this._cfg = null;
        buttons.clear();
    }

    _hideNative() {
        const area = Main.panel.statusArea;
        for (const key of ['activities', 'quickSettings', 'dateMenu', 'keyboard']) {
            const c = area[key]?.container;
            if (!c)
                continue;
            this._native.push([c, c.visible]);
            c.hide();
            if (key === 'keyboard') {

                this._signals.push([c, c.connect('notify::visible', () => {
                    if (c.visible) c.hide();
                })]);
            }
        }
    }

    _applyPanelStyle() {
        this._ifaceSettings = settingsFor('org.gnome.desktop.interface');
        Main.panel.add_style_class_name('lintel-panel');
        if (this._ifaceSettings)
            this._styleId = this._ifaceSettings.connect('changed::color-scheme', () => this._applyTheme());
        this._cfgOff = this._cfg.onChange(() => this._applyTheme());
        const settings = St.Settings.get();
        this._signals.push([settings, settings.connect('notify::high-contrast', () => this._applyTheme())]);
        this._applyTheme();
    }


    _applyTheme() {
        const c = this._cfg.values;
        const dark = this._ifaceSettings?.get_string('color-scheme') === 'prefer-dark';
        let light = c.texto === 'claro';
        if (c.texto === 'auto')
            light = c.adaptiveContrast && !c.colorTexto && !c.colorIconos && this._contrast?.light !== null ? this._contrast?.light ?? dark : dark;
        Main.panel.remove_style_class_name(light ? 'lintel-text-dark' : 'lintel-text-light');
        Main.panel.add_style_class_name(light ? 'lintel-text-light' : 'lintel-text-dark');
        theme.textColor = c.colorTexto;
        theme.iconColor = c.colorIconos;
        theme.menuDark = c.temaMenus === 'oscuro' || (c.temaMenus === 'auto' && dark);
        theme.animMs = c.animacionMs;
        for (const key of ['material', 'blur', 'opacity', 'contrast', 'reducedMotion', 'accent', 'shortcuts', 'menuIcons']) theme[key] = c[key];
        this._tokens?.apply(c);
        refreshTheme();
    }

    _restorePanelStyle() {
        if (this._styleId)
            this._ifaceSettings?.disconnect(this._styleId);
        this._styleId = 0;
        this._cfgOff?.();
        this._cfgOff = null;
        this._ifaceSettings = null;
        ['lintel-panel', 'lintel-text-light', 'lintel-text-dark']
            .forEach(c => Main.panel.remove_style_class_name(c));
    }


    _queueApp(now = false) {
        if (!this._alive) return;
        this._ctx.cancel(this._appTimer);
        this._appTimer = this._ctx.later(now ? 0 : 60, () => {
            this._appTimer = 0;
            this._applyApp();
        });
    }

    _applyApp() {
        if (!this._alive) return;
        const app = this._tracker.focus_app;
        if (!app && Main.panel.menuManager?.activeMenu && this._appId)
            return;
        const id = app?.get_id() ?? null;
        if (id === this._appId)
            return;
        this._appId = id;
        this._ctx.app = app;
        this._name.setApp(app);
        this._rebuildMenus(app);
    }

    _rebuildMenus(app) {
        if (!this._alive) return;
        this._dyn.forEach(b => b.destroy());
        this._dyn = [];
        const published = this._ctx.published.specs;
        const profile = profileFor(app);
        const specs = app && published.length ? [...published, WINDOW_MENU] : profile === 'generic' ? [WINDOW_MENU] : MENUS[profile];
        specs.forEach((spec, i) => {
            const button = new MenuBarButton(this._ctx, spec, app);
            Main.panel.addToStatusArea(`lintel-menu-${i}`, button, 2 + i, 'left');
            this._dyn.push(button);
        });
        this._layout?.queue();
        refreshTheme();
    }
}
