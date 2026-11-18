import {scrollView} from './shared/scroll-view.js';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import St from 'gi://St';
import Clutter from 'gi://Clutter';
import Soup from 'gi://Soup';
import Meta from 'gi://Meta';
import Pango from 'gi://Pango';
import Shell from 'gi://Shell';
import GdkPixbuf from 'gi://GdkPixbuf';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import * as Volume from 'resource:///org/gnome/shell/ui/status/volume.js';
import * as Screenshot from 'resource:///org/gnome/shell/ui/screenshot.js';
import {Slider} from 'resource:///org/gnome/shell/ui/slider.js';
import {Extension, InjectionManager} from 'resource:///org/gnome/shell/extensions/extension.js';
import {ActivityQueue, LiveActivities, springProgress} from './activities.js';
import {IslandMotion} from './motion.js';
import {IslandWorkspace, MODULES} from './workspace.js';
import {ContextTools} from './context-tools.js';
import {ShelfBridge} from './shelf-bridge.js';
import {MediaExtras} from './media-extras.js';
import {MusicTools} from './music-tools.js';
import {IslandStudio} from './studio.js';
import {AgentBridge} from './agent-bridge.js';
import {AudioMeter} from './audio-meter.js';
import {IslandOrnaments} from './ornaments.js';
import {buildAppLauncher} from './app-launcher.js';
import {IslandFiles} from './file-services.js';
import {meetingLink} from './content-models.js';


const OCULTAR_OSD_SISTEMA = true;
const CIUDAD_MANUAL = null;
const CIUDAD_RESPALDO = {nombre: 'Huánuco', lat: -9.93, lon: -76.24};
const MARQUEE = 212;
const MARQUEE_SPEED = 32;


const PREFIX = 'org.mpris.MediaPlayer2.';
const PATH = '/org/mpris/MediaPlayer2';
const PLAYER = 'org.mpris.MediaPlayer2.Player';
const PROPS = 'org.freedesktop.DBus.Properties';
const DBUS = 'org.freedesktop.DBus';
const UPOWER = 'org.freedesktop.UPower';
const UPOWER_DEV = '/org/freedesktop/UPower/devices/DisplayDevice';

const WIDTH = 380;
const PAD = 46;
const PAGE_H = 160;
const PAGE_CLIP_LIST = 190;
const ISLAND_W = WIDTH + PAD * 2;
const ART = 96;
const GAP = 16;
const RIGHT = WIDTH - ART - GAP;
const BAR_COUNT = 4;
const MAX_VISIBLE_NOTIFICATIONS = 30;

const TABS = [
    ['home', 'go-home-symbolic'],
    ['music', 'audio-x-generic-symbolic'],
    ['files', 'folder-symbolic'],
    ['clip', 'edit-paste-symbolic'],
    ['notes', 'document-edit-symbolic'],
    ['system', 'utilities-system-monitor-symbolic'],
    ['clock', 'alarm-symbolic'],
    ['today', 'x-office-calendar-symbolic'],
    ['weather', 'weather-clear-symbolic'],
    ['notifications', 'preferences-system-notifications-symbolic'],
    ['mirror', 'camera-web-symbolic'],
    ['tools', 'applications-utilities-symbolic'],
    ['downloads', 'folder-download-symbolic'],
    ['world', 'preferences-system-time-symbolic'],
    ['devices', 'video-display-symbolic'],
    ['studio', 'audio-input-microphone-symbolic'],
    ['agents', 'utilities-terminal-symbolic'],
];

const TAB_NAMES = {home: 'Inicio', music: 'Música', files: 'Archivos', clip: 'Portapapeles',
    notes: 'Notas y tareas', system: 'Sistema', clock: 'Temporizador', today: 'Calendario', weather: 'Clima',
    notifications: 'Notificaciones', mirror: 'Cámara', tools: 'Controles rápidos', downloads: 'Descargas', world: 'Relojes del mundo', devices: 'Pantallas y discos', studio: 'Estudio', agents: 'Asistentes', applications: 'Aplicaciones'};

const dec = new TextDecoder();
const enc = new TextEncoder();
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const pad2 = n => String(n).padStart(2, '0');
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
const easeInOutCubic = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

const formatTime = seconds => {
    const s = Math.max(0, Math.floor(Number(seconds) || 0));
    return `${Math.floor(s / 60)}:${pad2(s % 60)}`;
};
const formatClock = (ms, up = false) => {
    const s = Math.max(0, up ? Math.floor(ms / 1000) : Math.ceil(ms / 1000));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return h > 0 ? `${h}:${pad2(m)}:${pad2(s % 60)}` : `${pad2(m)}:${pad2(s % 60)}`;
};

const weatherInfo = (code, day) => {
    const n = day ? '' : '-night';
    if (code === 0) return [day ? 'weather-clear-symbolic' : 'weather-clear-night-symbolic', 'Despejado'];
    if (code <= 2) return [`weather-few-clouds${n}-symbolic`, 'Parcialmente nublado'];
    if (code === 3) return ['weather-overcast-symbolic', 'Nublado'];
    if (code === 45 || code === 48) return ['weather-fog-symbolic', 'Niebla'];
    if (code >= 51 && code <= 57) return ['weather-showers-scattered-symbolic', 'Llovizna'];
    if (code >= 61 && code <= 67) return ['weather-showers-symbolic', 'Lluvia'];
    if ((code >= 71 && code <= 77) || code === 85 || code === 86) return ['weather-snow-symbolic', 'Nieve'];
    if (code >= 80 && code <= 82) return ['weather-showers-symbolic', 'Chubascos'];
    if (code >= 95) return ['weather-storm-symbolic', 'Tormenta'];
    return ['weather-overcast-symbolic', 'Nublado'];
};
const aqiInfo = aqi => {
    if (aqi == null) return ['', ''];
    if (aqi <= 50) return ['Aire bueno', 'di-aqi-good'];
    if (aqi <= 100) return ['Aire moderado', 'di-aqi-mod'];
    if (aqi <= 150) return ['Aire dañino (sensibles)', 'di-aqi-bad'];
    if (aqi <= 200) return ['Aire dañino', 'di-aqi-bad'];
    return ['Aire muy dañino', 'di-aqi-bad'];
};

export default class DynamicIsland extends Extension {



    enable() {
        this._alive = true;
        this._epoch = (this._epoch ?? 0) + 1;
        for (const key of ['_taskList', '_eventsBox', '_clipList', '_shelfList', '_noteEntry', '_captureHistory', '_wTemp', '_clipSearch', '_shareChoices', '_mirrorBtn']) this[key] = null;
        this._sources = new Set();
        this._signals = [];
        this._subs = [];
        this._bus = Gio.DBus.session;
        this._cancel = new Gio.Cancellable();
        this._http = null;
        this._settings = this.getSettings();
        this._activities = new ActivityQueue();
        this._live = new LiveActivities();
        this._state = 'closed';
        this._hoverTimer = 0;
        this._leaveTimer = 0;
        this._openedByHover = false;
        this._notificationSeen = new WeakSet();
        this._notificationPrimed = false;
        this._movedClock = null;
        this._captureFiles = [];
        this._captureRequested = false;
        this._recordingStarted = 0;
        this._recordingTimer = 0;
        this._nm = null;
        this._bluetoothAdapter = null;
        this._bluetoothReadPending = false;
        this._networkPrevious = null;
        this._hardwareProcess = null;
        this._hardwareAt = 0;
        this._notificationSettings = new Gio.Settings({schema_id: 'org.gnome.desktop.notifications'});


        this._generation = 0;
        this._requestGeneration = 0;
        this._name = null;
        this._nm = null;
        this._status = 'Stopped';
        this._length = 0;
        this._position = 0;
        this._shuffle = false;
        this._loop = 'None';
        this._sub = 0;
        this._artUrl = null;
        this._seekDrag = false;
        this._volDrag = false;
        this._syncing = false;
        this._barsTimer = 0;
        this._marqueeText = null;
        this._marqueeOn = false;
        this._tickId = 0;


        this._mixer = null;
        this._mixerSignals = [];
        this._sink = null;
        this._sinkSignals = [];
        this._lastVol = null;
        this._osdShow = null;
        this._brightness = -1;
        this._brightnessScale = null;
        this._brightnessSignal = 0;
        this._bat = null;
        this._warn20 = false;
        this._warn10 = false;
        this._cpuPrev = null;
        this._sampler = 0;
        this._awake = {mode: null, end: 0, cookie: 0};
        this._awakeTimer = 0;


        this._hudActive = false;
        this._hudTimer = 0;
        this._clockLabelVisible = false;


        this._tab = 'music';
        this._pages = {};
        this._tabButtons = {};
        this._shelf = [];
        this._shelfPins = new Set();
        this._shelfSelection = new Set();
        this._fileJob = null;
        this._clips = [];
        this._cfg = {persistAll: true, ignorePw: true, max: 30, private: false};
        this._clipSaveTimer = 0;
        this._menu = null;
        this._island = null;
        this._finReady = false;
        this._tweenSource = 0;
        this._clipRows = new Map();
        this._clipBusy = false;
        this._popId = null;
        this._clipScroll = null;
        this._ignoreUntil = 0;
        this._currentId = null;
        this._noteSaveTimer = 0;
        this._mirror = null;
        this._notificationSignals = [];
        this._notificationRefresh = 0;


        this._tm = {mode: 'timer', left: 0, total: 0, endAt: 0, running: false, started: false,
            sw: 0, swStart: 0, swRunning: false, swStarted: false};
        this._clockTimer = 0;
        this._pomodoro = null;


        this._events = null;
        this._eventsSig = 0;
        this._weather = null;
        this._weatherAt = 0;
        this._weatherLoading = false;
        this._coords = CIUDAD_MANUAL;

        this._dataDir = GLib.build_filenamev([GLib.get_user_data_dir(), 'dynamic-island']);
        GLib.mkdir_with_parents(this._dataDir, 0o700);
        Gio.File.new_for_path(this._dataDir).set_attribute_uint32('unix::mode', 0o700, Gio.FileQueryInfoFlags.NONE, null);

        this._safe('config portapapeles', () => this._loadClipState());
        const clock = Main.panel.statusArea.dateMenu;
        if (clock?.visible && clock.get_parent() === Main.panel._centerBox) {
            this._movedClock = {actor: clock, index: Main.panel._centerBox.get_children().indexOf(clock)};
            Main.panel._centerBox.remove_child(clock);
            Main.panel._rightBox.insert_child_at_index(clock, 0);
        }
        this._ornaments = new IslandOrnaments(this);
        this._workspace = new IslandWorkspace(this);
        this._contextTools = new ContextTools(this);
        this._mediaExtras = new MediaExtras(this);
        this._musicTools = new MusicTools(this);
        this._studio = new IslandStudio(this);
        this._agents = new AgentBridge(this);
        this._audioMeter = new AudioMeter(this);
        this._buildPill();
        this._buildCard();

        this._selectTab(this._settings.get_string('initial-page'));
        this._connect(this._settings, 'changed', (_settings, key) => {
            this._pillBackground?.queue_repaint();
            this._islandBackground?.queue_repaint();
            if (['theme', 'glass-blur', 'corner-radius'].includes(key)) this._syncGlass();
            this._renderHome();
            if (['monitor', 'shape', 'corner-radius', 'notch-width'].includes(key)) this._closeIsland();
            if (key === 'timer-presets') this._renderTimerPresets();
            if (key === 'home-modules') this._workspace.rebuild();
            if (key === 'pinned-modules') this._refreshNavigation();
            if (key === 'audio-visualizer') { this._stopBars(); this._audioMeter.failed = false; }
            if (key === 'lyrics-enabled') { this._mediaExtras.key = null; if (this._mediaExtras.box?.visible) this._mediaExtras.load(); }
            if (key === 'watch-downloads') this._fileServices?.syncDownloads();
            if (key === 'agent-events') this._agents.syncEnabled();
            this._centerPill();
            this._syncFullscreen();
            if (!this._settings.get_boolean('cover-accent')) this._musicSurface.set_style('');
        });
        Main.wm.addKeybinding('toggle-island', this._settings, Meta.KeyBindingFlags.NONE,
            Shell.ActionMode.NORMAL | Shell.ActionMode.POPUP, () => this._menu.toggle());
        this._connect(Main.sessionMode, 'updated', () => this._syncFullscreen());
        this._connect(Main.overview, 'hidden', () => this._syncFullscreen());
        this._connect(Main.overview, 'showing', () => this._syncFullscreen());
        this._connect(global.display, 'in-fullscreen-changed', () => this._syncFullscreen());
        this._connect(Main.panel, 'notify::height', () => this._sizePill());
        this._connect(Main.layoutManager, 'monitors-changed', () => {
            this._shelfBridge?.close();
            this._closeIsland();
            this._sizePill();
        });
        this._syncFullscreen();
        this._updateProgress();
        this._updateToggles();

        this._safe('volumen', () => this._setupVolume());
        this._safe('osd', () => this._hookOsd());
        this._safe('brillo', () => this._setupBrightness());
        this._safe('batería', () => this._setupBattery());
        this._safe('bluetooth', () => this._setupBluetooth());
        this._safe('red', () => this._setupNetwork());
        this._safe('portapapeles', () => this._setupClipboard());
        this._safe('estante', () => { this._loadShelf(); this._fileServices = new IslandFiles(this); this._fileServices.syncShelf(); this._shelfBridge = new ShelfBridge(this); });

        this._safe('tareas', () => this._loadTasks());
        this._safe('temporizador', () => this._restoreTimer());
        this._safe('notificaciones', () => this._setupNotifications());
        this._safe('calendario', () => this._setupCalendar());
        this._safe('capturas', () => this._setupCaptureTools());
        this._safe('clima', () => {
            this._timeout(4000, () => { this._loadWeather(true); return GLib.SOURCE_REMOVE; });
            this._timeout(20 * 60 * 1000, () => { this._loadWeather(true); return GLib.SOURCE_CONTINUE; });
        });

        this._watch = this._bus.signal_subscribe(DBUS, DBUS, 'NameOwnerChanged', '/org/freedesktop/DBus', null,
            Gio.DBusSignalFlags.NONE, (_c, _s, _p, _i, _sig, params) => {
                if (params.deep_unpack()[0].startsWith(PREFIX)) this._discover();
            });
        this._subscribe(null, PROPS, 'PropertiesChanged', PATH, PLAYER, (_c, _s, _p, _i, _sig, params) => {
            const [, changed] = params.recursiveUnpack();
            if (changed.PlaybackStatus === 'Playing' && !this._settings.get_string('preferred-player')) this._discover();
        });
        this._discover();
    }

    disable() {
        this._alive = false;
        this._workspace?.editor.close(false, false);
        this._contextTools?.destroy();
        this._contextTools = null;
        this._bannerOverrides?.clear();
        this._bannerOverrides = null;
        Main.wm.removeKeybinding('toggle-island');
        this._activities?.clear();
        this._live?.clear();
        this._ornaments?.clear();
        this._studio?.destroy();
        this._agents?.destroy();
        this._audioMeter?.stop();
        this._motion?.destroy();
        this._motion = null;
        this._generation++;
        this._requestGeneration++;


        if (this._awake?.cookie) {
            try {
                this._bus.call('org.gnome.SessionManager', '/org/gnome/SessionManager', 'org.gnome.SessionManager',
                    'Uninhibit', new GLib.Variant('(u)', [this._awake.cookie]), null, Gio.DBusCallFlags.NONE, 1000, null, null);
            } catch (e) {            }
        }
        this._closeMirror();
        this._shelfBridge?.close();
        this._shelfBridge = null;
        this._fileServices?.destroy();
        this._fileServices = null;
        this._fileJob?.send_signal(15);
        this._fileJob = null;
        this._saveTimer();
        this._hardwareProcess?.force_exit();
        this._hardwareProcess = null;
        this._saveNotes();
        this._saveClips(true);

        for (const id of [...this._sources]) { try { GLib.Source.remove(id); } catch (e) {            } }
        this._sources.clear();
        this._cancel?.cancel();

        if (this._watch) this._bus.signal_unsubscribe(this._watch);
        if (this._sub) this._bus.signal_unsubscribe(this._sub);
        for (const [bus, id] of this._subs) bus.signal_unsubscribe(id);
        this._subs = [];
        if (this._brightnessSignal) this._brightnessScale.disconnect(this._brightnessSignal);
        this._brightnessSignal = 0;
        this._brightnessScale = null;

        for (const [obj, id] of this._signals) { try { obj.disconnect(id); } catch (e) {            } }
        this._signals = [];

        this._disconnectNotificationSignals();

        if (this._sink) for (const id of this._sinkSignals) { try { this._sink.disconnect(id); } catch (e) {            } }
        for (const id of this._mixerSignals) { try { this._mixer?.disconnect(id); } catch (e) {            } }
        this._sink = null;
        this._mixer = null;

        if (this._osdShow) { Main.osdWindowManager.show = this._osdShow; this._osdShow = null; }
        if (this._events) {
            try { if (this._eventsSig) this._events.disconnect(this._eventsSig); this._events.destroy?.(); } catch (e) {            }
            this._events = null;
        }
        this._releaseInteraction();
        if (this._island) {
            try { Main.layoutManager.removeChrome(this._island); } catch (e) {            }
            this._island.destroy();
            this._island = null;
            this._glass = null;
            this._glassEffect = null;
        }
        this._menu = null;
        if (this._host) this._host.destroy();
        else this._button?.destroy();
        this._host = null;
        this._button = null;
        this._pill = null;
        if (this._movedClock?.actor.get_parent() === Main.panel._rightBox) {
            Main.panel._rightBox.remove_child(this._movedClock.actor);
            Main.panel._centerBox.insert_child_at_index(this._movedClock.actor, this._movedClock.index);
        }
        this._movedClock = null;
        this._http = null;
        this._name = null;
        this._nm = null;
        this._settings = null;
        for (const key of ['_taskList', '_eventsBox', '_clipList', '_shelfList', '_noteEntry', '_captureHistory', '_wTemp', '_shareChoices', '_mirrorBtn']) this[key] = null;
    }




    _safe(name, fn) {
        try { fn(); } catch (e) { console.error(`Dynamic Island [${name}]: ${e.message}`); }
    }

    _duration(ms) {
        return this._settings.get_boolean('animations') && St.Settings.get().enable_animations ? Math.round(ms * this._settings.get_double('motion-speed')) : 0;
    }

    _syncFullscreen() {
        const mon = this._monitor();
        const hide = Main.sessionMode.isLocked || Main.overview.visible ||
            (this._settings.get_boolean('hide-fullscreen') && mon &&
            global.display.get_monitor_in_fullscreen(mon.index));
        if (hide) { this._closeIsland(); this._shelfBridge?.close(); this._closeMirror(); }
        this._button.visible = !hide;
        if (this._host) this._host.visible = !hide && !this._shelfBridge?.window;
        this._updatePill();
    }

    _timeout(ms, fn) {
        const id = GLib.timeout_add(GLib.PRIORITY_DEFAULT, ms, () => {
            if (!this._alive) { this._sources.delete(id); return GLib.SOURCE_REMOVE; }
            let result = GLib.SOURCE_REMOVE;
            try { result = fn(); } catch (e) { console.error(`Dynamic Island timer: ${e.message}\n${e.stack}`); }
            if (result !== GLib.SOURCE_CONTINUE) this._sources.delete(id);
            return result === GLib.SOURCE_CONTINUE ? GLib.SOURCE_CONTINUE : GLib.SOURCE_REMOVE;
        });
        this._sources.add(id);
        return id;
    }

    _clear(id) {
        if (id && this._sources.has(id)) {
            GLib.Source.remove(id);
            this._sources.delete(id);
        }
    }

    _connect(obj, signal, fn) {
        const id = obj.connect(signal, fn);
        this._signals.push([obj, id]);
        return id;
    }

    _subscribe(name, iface, member, path, arg0, cb) {
        const bus = this._serviceBus(name);
        const id = bus.signal_subscribe(name, iface, member, path, arg0, Gio.DBusSignalFlags.NONE, cb);
        this._subs.push([bus, id]);
        return id;
    }

    _serviceBus(name) {
        return name === UPOWER || name === 'org.bluez' ? Gio.DBus.system : this._bus;
    }

    _call(name, path, iface, method, params, callback) {
        if (!this._alive || !name) return;
        this._serviceBus(name).call(name, path, iface, method, params, null, Gio.DBusCallFlags.NONE, 2500, this._cancel,
            (connection, result) => {
                if (!this._alive) return;
                try {
                    const reply = connection.call_finish(result);
                    callback?.(reply);
                } catch (error) {
                    if (!error.matches?.(Gio.IOErrorEnum, Gio.IOErrorEnum.CANCELLED))
                        console.debug(`Dynamic Island: ${method}: ${error.message}`);
                }
            });
    }

    _request(name, iface, method, params, callback) {
        this._call(name, name === DBUS ? '/org/freedesktop/DBus' : PATH, iface, method, params, callback);
    }

    _setProperty(prop, variant, cb) {
        this._request(this._name, PROPS, 'Set', new GLib.Variant('(ssv)', [PLAYER, prop, variant]), cb);
    }

    _getJson(url, cb) {
        try {
            this._http ??= new Soup.Session({timeout: 10});
            const msg = Soup.Message.new('GET', url);
            if (!msg) { cb(null); return; }
            msg.request_headers.replace('User-Agent', 'AureaDesktop (https://github.com/Yeferson-gm/aureaos-desktop)');
            const cancel = this._cancel;
            this._http.send_and_read_async(msg, GLib.PRIORITY_DEFAULT, cancel, (session, res) => {
                if (!this._alive || cancel.is_cancelled()) return;
                try {
                    const bytes = session.send_and_read_finish(res);
                    if (msg.get_status() !== Soup.Status.OK) { cb(null); return; }
                    if (bytes.get_size() > 2 * 1024 * 1024) { cb(null); return; }
                    cb(JSON.parse(dec.decode(bytes.get_data())));
                } catch (e) { cb(null); }
            });
        } catch (e) { cb(null); }
    }

    _spawn(argv) {
        try {
            Gio.Subprocess.new(argv, Gio.SubprocessFlags.STDOUT_SILENCE | Gio.SubprocessFlags.STDERR_SILENCE);
            return true;
        } catch (e) {
            console.debug(`Dynamic Island: no se pudo lanzar ${argv[0]}: ${e.message}`);
            return false;
        }
    }

    _makeBar(width, height) {
        const track = new St.Widget({style_class: 'di-mini-track', width, height, layout_manager: new Clutter.FixedLayout()});
        const fill = new St.Widget({style_class: 'di-mini-fill', width: 0, height});
        track.add_child(fill);
        return {actor: track, set: ratio => fill.set_width(Math.round(width * clamp(ratio)))};
    }

    _label(text, cls = '', extra = {}) {
        return new St.Label({text, style_class: cls, y_align: Clutter.ActorAlign.CENTER, ...extra});
    }

    _iconBtn(icon, cb, cls = 'di-mini-btn', size = 14) {
        const b = new St.Button({style_class: cls, reactive: true, can_focus: true, y_align: Clutter.ActorAlign.CENTER});
        b.set_child(new St.Icon({icon_name: icon, icon_size: size}));
        b.connect('clicked', cb);
        return b;
    }

    _chip(text, cb, icon = null) {
        const b = new St.Button({style_class: 'di-chip', reactive: true, can_focus: true, accessible_name: text, y_align: Clutter.ActorAlign.CENTER});
        const row = new St.BoxLayout({style_class: 'di-chip-row'});
        if (icon) row.add_child(new St.Icon({icon_name: icon, icon_size: 12, y_align: Clutter.ActorAlign.CENTER}));
        const label = new St.Label({text, y_align: Clutter.ActorAlign.CENTER, x_expand: true});
        label.clutter_text.set_ellipsize(Pango.EllipsizeMode.END);
        row.add_child(label);
        b.set_child(row);
        b.connect('clicked', cb);
        b._label = label;
        return b;
    }

    _scroll(height) {
        return scrollView({
            style_class: 'di-scroll', width: WIDTH, height, overlay_scrollbars: true,
            hscrollbar_policy: St.PolicyType.NEVER, vscrollbar_policy: St.PolicyType.EXTERNAL,
        }, () => this._duration(160));
    }

    _newPage(id, height = -1) {
        const page = new St.BoxLayout({orientation: Clutter.Orientation.VERTICAL, style_class: 'di-page', width: WIDTH, height, visible: false});
        page._h = height;
        this._pages[id] = page;
        this._pagesBox.add_child(page);
        return page;
    }

    _head(title, ...widgets) {
        const head = new St.BoxLayout({style_class: 'di-head', width: WIDTH});
        head.add_child(this._label(title, 'di-h'));
        head.add_child(new St.Widget({x_expand: true}));
        for (const w of widgets) head.add_child(w);
        return head;
    }




    _buildPill() {
        this._button = new St.Button({reactive: true, can_focus: true, button_mask: St.ButtonMask.ONE | St.ButtonMask.THREE,
            accessible_name: 'Abrir isla dinámica'});
        this._button.add_style_class_name('di-button');
        this._pill = new St.Widget({
            style_class: 'di-pill',
            clip_to_allocation: true,
            layout_manager: new Clutter.BinLayout(),
            x_align: Clutter.ActorAlign.CENTER,
            y_align: Clutter.ActorAlign.CENTER,
        });
        this._pillBackground = new St.DrawingArea({
            x_expand: true,
            y_expand: true,
        });
        this._pillContent = new St.BoxLayout({
            style_class: 'di-pill-content',
            x_expand: true,
            y_expand: true,
            x_align: Clutter.ActorAlign.CENTER,
            y_align: Clutter.ActorAlign.CENTER,
        });
        this._pill.add_child(this._pillBackground);
        this._pill.add_child(this._pillContent);
        this._connect(this._pillBackground, 'repaint', area => this._paintTopIsland(area));
        this._connect(this._pill, 'notify::width', () => this._pillBackground?.queue_repaint());
        this._connect(this._button, 'notify::allocation', () => this._centerPill());
        this._connect(this._pill, 'notify::height', () => this._pillBackground?.queue_repaint());

        this._bars = new St.BoxLayout({style_class: 'di-bars', height: 16, y_align: Clutter.ActorAlign.CENTER, visible: false});
        this._barItems = [];
        for (let i = 0; i < BAR_COUNT; i++) {
            const bar = new St.Widget({style_class: 'di-bar', width: 3, height: 4, y_align: Clutter.ActorAlign.CENTER, y_expand: true});
            this._barItems.push(bar);
            this._bars.add_child(bar);
        }
        this._compactArt = new St.Icon({icon_name: 'audio-x-generic-symbolic', icon_size: 22, visible: false, style_class: 'di-compact-art'});
        this._mascot = this._ornaments.buildMascot();
        this._pillContent.add_child(this._mascot);
        this._pillContent.add_child(this._compactArt);
        this._pillContent.add_child(this._bars);

        this._marquee = new St.Widget({
            style_class: 'di-marquee-box', width: MARQUEE, height: 18, clip_to_allocation: true,
            layout_manager: new Clutter.FixedLayout(), y_align: Clutter.ActorAlign.CENTER, visible: false,
        });
        this._marqueeRow = new St.BoxLayout({});
        this._m1 = new St.Label({text: '', style_class: 'di-marquee'});
        this._m2 = new St.Label({text: '', style_class: 'di-marquee'});
        this._m1.clutter_text.set_ellipsize(0);
        this._m2.clutter_text.set_ellipsize(0);
        this._marqueeRow.add_child(this._m1);
        this._marqueeRow.add_child(this._m2);
        this._marqueeRow.set_position(0, 0);
        this._marquee.add_child(this._marqueeRow);
        this._pillContent.add_child(this._marquee);

        this._pillTimer = new St.Label({style_class: 'di-pill-timer', y_align: Clutter.ActorAlign.CENTER, visible: false});
        this._pillTimer.clutter_text.set_ellipsize(Pango.EllipsizeMode.END);
        this._pillTimer.width = 210;
        this._pillContent.add_child(this._pillTimer);
        this._activityCount = new St.Label({style_class: 'di-activity-count', y_align: Clutter.ActorAlign.CENTER, visible: false});
        this._pillContent.add_child(this._activityCount);

        this._hud = new St.BoxLayout({style_class: 'di-hud', y_align: Clutter.ActorAlign.CENTER, visible: false});
        this._hudIcon = new St.Icon({icon_name: 'audio-volume-high-symbolic', icon_size: 14, y_align: Clutter.ActorAlign.CENTER});
        this._hudBar = this._makeBar(70, 5);
        this._hudBar.actor.y_align = Clutter.ActorAlign.CENTER;
        this._hudLabel = new St.Label({style_class: 'di-hud-label', y_align: Clutter.ActorAlign.CENTER});
        this._hudLabel.clutter_text.set_ellipsize(Pango.EllipsizeMode.END);
        this._hud.add_child(this._hudIcon);
        this._hud.add_child(this._hudBar.actor);
        this._hud.add_child(this._hudLabel);
        this._pillContent.add_child(this._hud);

        this._button.set_child(this._pill);
        this._host = new St.Widget({layout_manager: new Clutter.BinLayout(), clip_to_allocation: true});
        this._button.x_align = Clutter.ActorAlign.CENTER;
        this._host.add_child(this._button);
        this._connect(this._host, 'notify::mapped', () => this._updatePill());
        Main.layoutManager.addTopChrome(this._host);



        this._connect(this._button, 'scroll-event', (_actor, event) => this._onIslandScroll(event));
        this._connect(this._button, 'clicked', (_actor, button) => {
            if (button === Clutter.BUTTON_SECONDARY) {
                this._activities.dismiss();
                this._presentActivity();
            } else {
                this._activatePill();
            }
        });
        this._connect(this._button, 'enter-event', () => {
            this._clear(this._leaveTimer);
            if (!this._settings.get_boolean('hover-open') || this._menu?.isOpen) return Clutter.EVENT_PROPAGATE;
            this._clear(this._hoverTimer);
            this._hoverTimer = this._timeout(this._settings.get_int('hover-delay'), () => {
                this._hoverTimer = 0;
                this._openedByHover = true;
                this._openIsland();
                return GLib.SOURCE_REMOVE;
            });
            return Clutter.EVENT_PROPAGATE;
        });
        this._connect(this._button, 'leave-event', () => {
            this._clear(this._hoverTimer);
            this._hoverTimer = 0;
            return Clutter.EVENT_PROPAGATE;
        });
        this._sizePill();
        this._timeout(600, () => { this._sizePill(); return GLib.SOURCE_REMOVE; });
    }

    _activatePill() {
        this._clear(this._hoverTimer);
        this._hoverTimer = 0;
        this._openedByHover = false;
        this._menu?.toggle();
    }

    _onIslandScroll(event) {
        if (!this._settings.get_boolean('gestures')) return Clutter.EVENT_PROPAGATE;
        let [dx, dy] = [0, 0];
        const direction = event.get_scroll_direction();
        if (direction === Clutter.ScrollDirection.SMOOTH) [dx, dy] = event.get_scroll_delta();
        else if (direction === Clutter.ScrollDirection.LEFT) dx = -1;
        else if (direction === Clutter.ScrollDirection.RIGHT) dx = 1;
        else dy = direction === Clutter.ScrollDirection.UP ? -1 : 1;
        if (event.get_state() & Clutter.ModifierType.SHIFT_MASK) {
            this._applyVolume(clamp((this._volume?.value ?? 0) - dy * 0.03));
            return Clutter.EVENT_STOP;
        }
        const now = GLib.get_monotonic_time() / 1000;
        if (now - (this._gestureAt ?? 0) < 300) return Clutter.EVENT_STOP;
        this._gestureTravel = (this._gestureTravel ?? 0) + (Math.abs(dx) > Math.abs(dy) ? dx : dy);
        if (Math.abs(this._gestureTravel) < 1) return Clutter.EVENT_STOP;
        const delta = Math.sign(this._gestureTravel);
        this._gestureTravel = 0;
        this._gestureAt = now;
        if (Math.abs(dx) > Math.abs(dy)) this._command(delta > 0 ? 'Next' : 'Previous');
        else this._cycleActivity(delta);
        return Clutter.EVENT_STOP;
    }

    _paintTopIsland(area) {
        const context = area.get_context();
        const [width, height] = area.get_surface_size();
        if (width <= 0 || height <= 0) {
            context.$dispose();
            return;
        }



        const floating = this._settings.get_string('shape') === 'floating';
        const shoulder = floating ? 0 : Math.max(1, Math.min(8, height / 3, width / 4));
        const radius = Math.max(1, Math.min(this._settings.get_int('corner-radius'),
            height - shoulder, (width - shoulder * 2) / 2));
        context.newPath();
        context.moveTo(0, 0);
        context.arc(0, shoulder, shoulder, -Math.PI / 2, 0);
        context.lineTo(shoulder, height - radius);
        context.arcNegative(shoulder + radius, height - radius,
            radius, Math.PI, Math.PI / 2);
        context.lineTo(width - shoulder - radius, height);
        context.arcNegative(width - shoulder - radius, height - radius,
            radius, Math.PI / 2, 0);
        context.lineTo(width - shoulder, shoulder);
        context.arc(width, shoulder, shoulder, Math.PI, Math.PI * 1.5);


        if (floating) {
            const r = Math.min(radius, height / 2);
            context.newPath();
            context.arc(width - r, r, r, -Math.PI / 2, 0);
            context.arc(width - r, height - r, r, 0, Math.PI / 2);
            context.arc(r, height - r, r, Math.PI / 2, Math.PI);
            context.arc(r, r, r, Math.PI, Math.PI * 1.5);
            context.closePath();
        }
        const glass = this._settings.get_string('theme') === 'glass';
        context.setSourceRGBA(glass ? 0.10 : 0, glass ? 0.13 : 0,
            glass ? 0.18 : 0, glass ? this._settings.get_double('opacity') : 1);
        context.fillPreserve();
        context.setSourceRGBA(1, 1, 1, 0.12);
        context.setLineWidth(1);
        context.stroke();
        context.$dispose();
    }

    _sizePill() {

        this._pill?.set_height(this._compactHeight());
        this._pillBackground?.queue_repaint();
        this._centerPill();
    }

    _compactHeight() {
        return this._settings.get_string('shape') === 'floating' ? 34 : Math.max(1, Main.panel.height || 26);
    }

    _monitor() {
        const index = this._settings.get_int('monitor');
        return Main.layoutManager.monitors[index] ?? Main.layoutManager.primaryMonitor;
    }

    _centerPill() {
        const monitor = this._monitor();
        if (!monitor || !this._host) return;
        const floating = this._settings.get_string('shape') === 'floating';
        this._host.set_position(monitor.x, monitor.y + (floating ? 8 : 0));
        const height = this._compactHeight();
        if (this._pill.height !== height) this._pill.set_height(height);
        this._host.set_size(monitor.width, height);
    }

    _toast(event) {
        if (!this._alive) return;
        this._activities.push({ms: this._settings.get_int('event-duration'), ...event});
        this._presentActivity();
    }

    _presentActivity() {
        this._clear(this._hudTimer);
        this._hudTimer = 0;
        const event = this._activities.current;
        if (!event) {
            this._hudActive = false;
            if (!this._menu?.isOpen) this._state = 'closed';
            this._updatePill();
            this._renderHome();
            return;
        }
        const {icon, text = '', fraction = null, warn = false} = event;
        this._hudIcon.icon_name = icon;
        this._hudBar.actor.visible = fraction !== null;
        if (fraction !== null) this._hudBar.set(fraction);
        this._hudLabel.set_text(text);
        if (warn) this._hud.add_style_class_name('di-hud-warn');
        else this._hud.remove_style_class_name('di-hud-warn');
        const was = this._hudActive;
        this._hudActive = true;
        if (!this._menu?.isOpen) this._state = 'activity';
        this._updatePill();
        if (!was) {
            this._hud.opacity = 0;
            this._hud.ease({opacity: 255, duration: this._duration(160), mode: Clutter.AnimationMode.EASE_OUT_QUAD});
        }
        this._clear(this._hudTimer);
        this._hudTimer = this._timeout(Math.max(20, event.expires - Date.now()), () => {
            this._hudTimer = 0;
            this._presentActivity();
            return GLib.SOURCE_REMOVE;
        });
        this._renderHome();
    }

    _syncLive() {
        this._live.update('music', this._name && this._status !== 'Stopped' ? {
            text: this._title?.text ?? 'Música', icon: 'audio-x-generic-symbolic', page: 'music', priority: 10} : null);
        this._live.update('timer', this._tm.running || this._tm.started ? {
            text: `Temporizador · ${formatClock(this._timerLeft())}`, icon: 'alarm-symbolic', page: 'clock', priority: 30} : null);
        this._live.update('stopwatch', this._tm.swRunning ? {
            text: `Cronómetro · ${formatClock(this._swElapsed(), true)}`, icon: 'alarm-symbolic', page: 'clock', priority: 20} : null);
        this._live.update('recording', this._recordingStarted ? {
            text: `● ${formatTime((Date.now() - this._recordingStarted) / 1000)}`, icon: 'media-record-symbolic', page: 'tools', priority: 50} : null);
        this._live.update('files', this._fileJob ? {
            text: 'Archivos · Procesando…', icon: 'folder-symbolic', page: 'files', priority: 25} : null);
    }

    _cycleActivity(delta) {
        this._activities.dismiss();
        this._syncLive();
        this._live.cycle(delta);
        this._presentActivity();
        this._renderHome();
    }

    _updatePill() {
        this._syncLive();
        const hud = this._hudActive;
        const active = !!this._name && this._status !== 'Stopped';
        const music = this._live.current?.key === 'music';
        const playing = music && this._status === 'Playing';
        const count = this._live.entries.length;
        this._pill.width = this._settings.get_int('notch-width') + (active ? 20 : 0);
        this._hud.visible = hud;
        this._bars.visible = !hud && music;
        this._marquee.visible = !hud && music;
        this._compactArt.visible = !hud && music && this._settings.get_boolean('compact-cover');
        this._mascot.visible = !hud && this._settings.get_boolean('show-mascot');
        this._marquee.width = MARQUEE - (this._mascot.visible ? 28 : 0) - (count > 1 ? 38 : 0) - (this._compactArt.visible ? 33 : 0);
        this._pillContent.set_style(!hud && music ? 'padding: 0 24px;' : null);
        this._pillTimer.visible = !hud && !!this._live.current && !music;
        if (this._pillTimer.visible) this._pillTimer.text = this._live.current.text;
        this._activityCount.visible = !hud && count > 1;
        this._activityCount.text = `+${count - 1}`;
        if (playing && !hud && this._host?.visible && this._button.mapped && !this._menu?.isOpen && this._duration(1)) {
            this._startBars();
            this._startMarquee();
        } else {
            this._stopBars();
            this._stopMarquee();
        }
    }

    _startBars() {
        if (this._settings.get_boolean('audio-visualizer')) { this._audioMeter.start(); return; }
        if (this._barsTimer) return;

        let phase = 0;
        const animate = () => {
            for (const [i, bar] of this._barItems.entries()) {
                bar.remove_all_transitions();
                bar.ease({height: 4 + 8 * (0.5 + 0.5 * Math.sin(phase + i)), duration: 350,
                    mode: Clutter.AnimationMode.EASE_IN_OUT_QUAD});
            }
            phase += 1;
        };
        animate();
        this._barsTimer = this._timeout(400, () => { animate(); return GLib.SOURCE_CONTINUE; });
    }

    _stopBars() {
        this._audioMeter?.stop();
        if (!this._barsTimer) return;
        this._clear(this._barsTimer);
        this._barsTimer = 0;
        for (const bar of this._barItems) {
            bar.remove_all_transitions();
            bar.ease({height: 4, duration: this._duration(200), mode: Clutter.AnimationMode.EASE_OUT_QUAD});
        }
    }

    _setMarqueeText(text) {
        if (text === this._marqueeText) return;
        this._marqueeText = text;
        this._buildMarquee();
        if (this._marqueeOn) { this._stopMarquee(); this._startMarquee(); }
    }

    _buildMarquee() {
        const unit = `${this._marqueeText || ''}   •   `;
        this._m1.set_text(unit);
        const unitWidth = this._m1.get_preferred_width(-1)[1] || 40;
        const text = unit.repeat(Math.max(1, Math.ceil(MARQUEE / unitWidth)));
        this._m1.set_text(text);
        this._m2.set_text(text);
    }

    _startMarquee() {
        if (this._marqueeOn) return;
        this._marqueeOn = true;
        const run = () => {
            if (!this._alive || !this._marqueeOn) return;
            if (!this._marqueeRow.mapped || !this._duration(1)) { this._marqueeOn = false; return; }
            const width = this._m1.get_preferred_width(-1)[1];
            if (!width || width <= 0) return;
            this._marqueeRow.translation_x = 0;
            this._marqueeRow.ease({
                translation_x: -width, duration: Math.round(width / MARQUEE_SPEED * 1000),
                mode: Clutter.AnimationMode.LINEAR, onComplete: () => run(),
            });
        };
        run();
    }

    _stopMarquee() {
        this._marqueeOn = false;
        this._marqueeRow?.remove_all_transitions();
        if (this._marqueeRow) this._marqueeRow.translation_x = 0;
    }




    _buildCard() {
        this._menu = {
            isOpen: false,
            close: () => this._closeIsland(),
            open: () => this._openIsland(),
            toggle: () => (this._menu.isOpen ? this._closeIsland() : this._openIsland()),
        };
        this._p = 0;
        this._grab = null;
        this._capId = 0;
        this._finReady = false;
        this._notch = {x: 0, y: 0, w: 180, h: 34};
        this._fin = {x: 0, y: 0, w: ISLAND_W, h: 300};


        this._island = new St.Widget({
            reactive: true, visible: false, clip_to_allocation: true, style_class: 'di-island',
            layout_manager: new Clutter.FixedLayout(),
        });
        this._glass = new St.Widget({reactive: false, clip_to_allocation: true});
        this._island.add_child(this._glass);
        this._glassEffect = new Shell.BlurEffect({mode: Shell.BlurMode.BACKGROUND});
        this._glass.add_effect(this._glassEffect);
        this._syncGlass();
        this._islandBackground = new St.DrawingArea();
        this._connect(this._islandBackground, 'repaint', area => this._paintTopIsland(area));
        this._connect(this._island, 'notify::width', () => this._syncIslandBackground());
        this._connect(this._island, 'notify::height', () => this._syncIslandBackground());
        this._island.add_child(this._islandBackground);

        const body = new St.BoxLayout({orientation: Clutter.Orientation.VERTICAL, style_class: 'di-body', width: ISLAND_W});
        this._content = body;
        this._topSpacer = new St.Widget({height: 28});
        body.add_child(this._topSpacer);


        const tabs = new St.BoxLayout({style_class: 'di-tabs', width: WIDTH, y_align: Clutter.ActorAlign.CENTER});
        this._navigation = tabs;
        tabs.reactive = true;
        this._connect(tabs, 'scroll-event', (_actor, event) => {
            const direction = event.get_scroll_direction();
            if (![Clutter.ScrollDirection.UP, Clutter.ScrollDirection.DOWN,
                Clutter.ScrollDirection.LEFT, Clutter.ScrollDirection.RIGHT].includes(direction)) return Clutter.EVENT_PROPAGATE;
            const forward = [Clutter.ScrollDirection.DOWN, Clutter.ScrollDirection.RIGHT].includes(direction);
            const index = TABS.findIndex(([id]) => id === this._tab);
            this._selectTab(TABS[(index + (forward ? 1 : -1) + TABS.length) % TABS.length][0]);
            return Clutter.EVENT_STOP;
        });
        this._playerLabel = new St.Label({text: '', style_class: 'di-top-player', width: 64});
        this._playerLabel.clutter_text.set_ellipsize(Pango.EllipsizeMode.END);
        this._refreshNavigation();
        body.add_child(tabs);
        this._sectionTitle = this._label('', 'di-section-title');
        body.add_child(this._sectionTitle);

        this._pagesBox = new St.BoxLayout({orientation: Clutter.Orientation.VERTICAL, width: WIDTH});
        this._pageViewport = this._scroll(-1);
        this._pageViewport.set_child(this._pagesBox);
        body.add_child(this._pageViewport);

        const builders = [
            ['home', () => this._buildHomePage()],
            ['music', () => this._buildMusicPage()],
            ['files', () => this._buildFilesPage()],
            ['clip', () => this._buildClipPage()],
            ['notes', () => this._buildNotesPage()],
            ['system', () => this._buildSystemPage()],
            ['clock', () => this._buildClockPage()],
            ['today', () => this._buildTodayPage()],
            ['weather', () => this._workspace.buildWeather()],
            ['notifications', () => this._buildNotificationsPage()],
            ['mirror', () => this._buildMirrorPage()],
            ...['tools', 'downloads', 'world', 'devices'].map(id => [id, () => this._contextTools.build(id)]),
            ['library', () => this._workspace.buildLibrary()],
            ['studio', () => this._studio.build()],
            ['agents', () => this._agents.build()],
            ['applications', () => buildAppLauncher(this)],
        ];
        this._builders = Object.fromEntries(builders);
        for (const id of ['music', 'system', 'clock', 'home', 'notifications']) this._ensurePage(id);

        this._island.add_child(body);
        this._island.accessible_name = 'Aurea · Isla dinámica';
        Main.layoutManager.addTopChrome(this._island);

        this._connect(this._island, 'key-press-event', (_a, event) => {
            if ((event.get_state() & Clutter.ModifierType.MOD1_MASK) &&
                [Clutter.KEY_Left, Clutter.KEY_Right].includes(event.get_key_symbol())) {
                const delta = event.get_key_symbol() === Clutter.KEY_Right ? 1 : -1;
                const index = TABS.findIndex(([id]) => id === this._tab);
                this._selectTab(TABS[(index + delta + TABS.length) % TABS.length][0]);
                return Clutter.EVENT_STOP;
            }
            if (event.get_key_symbol() === Clutter.KEY_Escape) {
                this._closeIsland();
                return Clutter.EVENT_STOP;
            }
            return Clutter.EVENT_PROPAGATE;
        });
        this._connect(this._island, 'enter-event', () => {
            this._clear(this._leaveTimer);
            return Clutter.EVENT_PROPAGATE;
        });
        this._connect(this._island, 'leave-event', () => {
            if (!this._openedByHover || !this._settings.get_boolean('auto-close')) return Clutter.EVENT_PROPAGATE;
            this._clear(this._leaveTimer);
            this._leaveTimer = this._timeout(650, () => {
                const [x, y] = global.get_pointer();
                if (x < this._island.x || x > this._island.x + this._island.width ||
                    y < this._island.y || y > this._island.y + this._island.height) this._closeIsland();
                return GLib.SOURCE_REMOVE;
            });
            return Clutter.EVENT_PROPAGATE;
        });
        this._connect(Main.overview, 'showing', () => this._closeIsland());
    }

    _syncGlass() {
        if (!this._glass) return;
        this._syncGlassVisibility();
        if ('sigma' in this._glassEffect) this._glassEffect.sigma = this._settings.get_int('glass-blur');
        else this._glassEffect.radius = this._settings.get_int('glass-blur') * 2;
        this._glassEffect.brightness = 0.7;
    }

    _syncGlassVisibility() {
        if (!this._glass || !this._glassEffect) return;
        const enabled = this._p >= 0.999 && this._glass.width > 1 && this._glass.height > 1 &&
            this._settings.get_string('theme') === 'glass' && this._settings.get_int('glass-blur') > 0;
        this._glass.visible = enabled; this._glassEffect.set_enabled(enabled);
    }

    _syncIslandBackground() {
        if (!this._island || !this._islandBackground) return;
        const width = Math.max(0, Math.round(this._island.width));
        const height = Math.max(0, Math.round(this._island.height));
        const inset = this._settings.get_int('corner-radius') + 8;
        this._glass.set_position(inset, inset);
        this._glass.set_size(Math.max(0, width - inset * 2), Math.max(0, height - inset * 2));
        this._syncGlassVisibility();
        this._islandBackground.set_position(0, 0);
        this._islandBackground.set_size(width, height);
        this._islandBackground.queue_repaint();
    }


    _applyIsland(p) {
        if (!this._island) return;
        this._p = p;
        this._syncGlassVisibility();
        const n = this._notch;
        const f = this._fin;
        const lerp = (a, b) => a + (b - a) * p;
        const w = Math.round(lerp(n.w, f.w));
        const h = Math.round(lerp(n.h, f.h));
        this._island.set_position(Math.round(lerp(n.x, f.x)), Math.round(lerp(n.y, f.y)));
        this._island.set_size(w, h);
        this._content.set_position(Math.round((w - ISLAND_W) / 2), 0);
        this._content.opacity = Math.round(255 * clamp((p - 0.25) / 0.6));
    }

    _runTween(from, to, duration, ease, done) {
        this._island.remove_all_transitions();
        this._motion ??= new IslandMotion(this._island);
        const span = Math.max(0.25, Math.abs(to - from));
        this._motion.run(from, to, this._duration(duration * span), ease,
            value => this._applyIsland(value), done);
    }

    _updateFinal() {
        const mon = this._monitor();
        const available = Math.max(80, mon.height - this._topSpacer.height - 130);
        this._pageViewport.set_height(Math.min(available, Math.ceil(this._pagesBox.get_preferred_height(WIDTH)[1]) + 2));
        const cx = this._notch.x + this._notch.w / 2;
        const x = clamp(Math.round(cx - ISLAND_W / 2), mon.x + 6, mon.x + mon.width - ISLAND_W - 6);
        this._content.queue_relayout();
        const h = Math.ceil(this._content.get_preferred_height(ISLAND_W)[1]);
        this._fin = {x, y: this._notch.y, w: ISLAND_W, h};
    }

    _resizeIsland() {
        if (!this._menu?.isOpen || !this._finReady || !this._island) return;
        const mon = this._monitor();
        this._pageViewport.set_height(Math.min(Math.max(80, mon.height - this._topSpacer.height - 130),
            Math.ceil(this._pagesBox.get_preferred_height(WIDTH)[1]) + 2));
        this._content.queue_relayout();
        const h = Math.ceil(this._content.get_preferred_height(ISLAND_W)[1]);
        if (h === this._fin.h) return;
        this._fin.h = h;
        if (this._motion?.timeline) return;
        this._island.remove_all_transitions();
        this._island.ease({height: h, duration: this._duration(240), mode: Clutter.AnimationMode.EASE_OUT_CUBIC});
    }

    _openIsland() {
        if (!this._alive || !this._island || this._menu.isOpen) return;
        if (this._workspace?.editor.actor || !this._monitor() || Main.sessionMode.isLocked || Main.overview.visible || this._shelfBridge?.process) return;
        this._centerPill();
        const [nx, ny] = this._pill.get_transformed_position();
        const [nw, nh] = this._pill.get_transformed_size();
        if (![nx, ny, nw, nh].every(Number.isFinite) || nw <= 0 || nh <= 0) return;
        this._notch = {x: Math.round(nx), y: Math.round(ny), w: Math.round(nw), h: Math.round(nh)};
        this._topSpacer.set_height(Math.max(22, this._notch.h - 8));

        this._menu.isOpen = true;
        this._pillContent.opacity = 0;
        this._stopBars();
        this._stopMarquee();
        this._state = 'expanding';
        this._finReady = false;
        if (!this._island.visible) {
            this._p = 0;
            this._applyIsland(0);
            this._island.show();
        }

        if (!this._acquireInteraction()) {
            this._menu.isOpen = false;
            this._pillContent.opacity = 255;
            this._island.hide();
            return;
        }

        try {
            this._refresh();
            this._syncVolume(false);
            this._startTick();
            this._tabEnter(this._tab);
            this._syncSampler();
            this._updateFinal();
            this._finReady = true;
            this._runTween(this._p, 1, 320, springProgress, () => { this._state = 'expanded'; });
        } catch (error) {
            console.error(`Dynamic Island: apertura: ${error.message}`);
            this._closeIsland();
        }
    }

    _onCaptured(event) {
        const type = event.type();
        if (type === Clutter.EventType.KEY_PRESS && event.get_key_symbol() === Clutter.KEY_Escape) {
            this._closeIsland();
            return Clutter.EVENT_STOP;
        }
        if (type !== Clutter.EventType.BUTTON_PRESS && type !== Clutter.EventType.TOUCH_BEGIN)
            return Clutter.EVENT_PROPAGATE;
        const [x, y] = event.get_coords();
        const ix = this._island.x;
        const iy = this._island.y;
        const iw = this._island.width;
        const ih = this._island.height;
        let target = null;
        try { target = global.stage.get_event_actor(event); } catch (e) {                         }
        const insideBounds = x >= ix && x <= ix + iw && y >= iy && y <= iy + ih;
        const inside = target ? this._island.contains(target) && insideBounds : insideBounds;

        if (!inside || y <= iy + this._topSpacer.height) {
            this._closeIsland();



            return Clutter.EVENT_STOP;
        }
        return Clutter.EVENT_PROPAGATE;
    }

    _acquireInteraction() {
        if (this._grab) return true;
        try {


            this._capId = this._island.connect(
                'captured-event', (_actor, event) => this._onCaptured(event));
            this._grab = Main.pushModal(this._island, {
                actionMode: Shell.ActionMode.POPUP,
            });
            if (this._grab) return true;
            this._releaseInteraction();
            return false;
        } catch (e) {
            console.error(`Dynamic Island: no se pudo capturar la entrada: ${e.message}`);
            this._releaseInteraction();
            return false;
        }
    }

    _releaseInteraction() {
        if (this._capId) {
            try { this._island?.disconnect(this._capId); } catch (e) {            }
            this._capId = 0;
        }
        if (this._grab) {
            const grab = this._grab;
            this._grab = null;
            try { Main.popModal(grab); } catch (e) {
                console.debug(`Dynamic Island: el grab ya había sido liberado: ${e.message}`);
            }
        }
    }

    _closeIsland() {
        this._contextTools?.stop();


        this._releaseInteraction();
        this._ornaments?.clear();
        this._studio?.stopMotion();
        if (this._studio?.recording) this._studio.recording.send_signal(15);
        if (!this._menu?.isOpen || !this._island) return;
        this._menu.isOpen = false;
        this._state = 'collapsing';
        this._finReady = false;
        for (const cleanup of [() => this._stopTick(), () => this._saveNotes(), () => this._syncSampler()]) {
            try { cleanup(); }
            catch (error) { console.debug(`Dynamic Island: cierre: ${error.message}`); }
        }
        const finish = () => {
            this._island?.hide();
            if (this._pillContent) this._pillContent.opacity = 255;
            this._state = this._hudActive ? 'activity' : 'closed';
            this._updatePill();
        };
        try { this._runTween(this._p, 0, 260, easeInOutCubic, finish); }
        catch (error) { finish(); }
    }

    openModule(id) {
        if (!this._alive || !Object.hasOwn(this._builders, id)) return false;
        this._selectTab(id); this._openIsland(); return true;
    }

    _selectTab(id) {
        this._ensurePage(id);
        if (!this._pages[id]) id = 'home';
        const previous = this._tab;
        if (previous === 'studio' && id !== 'studio') this._studio.stopMotion();
        this._tab = id;
        for (const [k, page] of Object.entries(this._pages)) page.visible = k === id;
        this._pagesBox.set_height(this._pages[id]?._h ?? -1);
        this._sectionTitle.set_text(id === 'library' ? 'Herramientas' : TAB_NAMES[id] ?? id);
        const page = this._pages[id];
        page.remove_all_transitions();
        page.opacity = 255;
        page.translation_y = 0;
        if (this._menu.isOpen && previous !== id && this._duration(1)) {
            page.opacity = 0;
            page.translation_y = 6;
            page.ease({opacity: 255, translation_y: 0, duration: this._duration(200), mode: Clutter.AnimationMode.EASE_OUT_CUBIC});
        }
        for (const [k, b] of Object.entries(this._tabButtons)) {
            if (k === id) b.add_style_class_name('di-tab-active');
            else b.remove_style_class_name('di-tab-active');
        }
        if (previous === 'notes' && id !== 'notes') this._saveNotes();
        this._tabEnter(id);
        this._syncSampler();
        this._resizeIsland();
    }

    _tabEnter(id) {
        this._contextTools?.activate(id);
        if (id === 'home') { this._renderHome(); if (this._menu.isOpen && this._settings.get_strv('home-modules').some(key => ['today', 'weather'].includes(key))) { this._ensurePage('today'); this._requestEvents(); this._loadWeather(false); } }
        else if (id === 'notes' && this._menu.isOpen) this._timeout(60, () => { this._noteEntry?.clutter_text.grab_key_focus(); return GLib.SOURCE_REMOVE; });
        else if (id === 'files') this._renderShelf();
        else if (id === 'clip') {
            this._renderClips();
            if (this._menu.isOpen) this._timeout(80, () => { this._clipSearch?.clutter_text.grab_key_focus(); return GLib.SOURCE_REMOVE; });
        }
        else if (id === 'clock') this._renderClock();
        else if (id === 'weather') { this._workspace.renderWeather(); this._loadWeather(false); }
        else if (id === 'today') { this._renderToday(); this._requestEvents(); this._loadWeather(false); }
        else if (id === 'notifications') this._renderNotifications();
        else if (id === 'mirror') this._renderMirror();
    }

    _requestCapture(recording) {
        this._closeIsland();
        this._timeout(this._duration(280) + 30, () => {
            this._captureRequested = !recording;
            if (recording) Screenshot.showScreenRecordingUI();
            else Screenshot.showScreenshotUI();
            return GLib.SOURCE_REMOVE;
        });
    }

    _setupCaptureTools() {
        this._connect(Main.screenshotUI, 'screenshot-taken', (_ui, file) => {
            if (!this._captureRequested) return;
            this._captureRequested = false;
            this._captureFiles.unshift(file.get_uri());
            this._captureFiles = this._captureFiles.slice(0, 5);
            this._shelfAdd([file.get_uri()]);
            if (!this._captureHistory) return;
            this._captureHistory.destroy_all_children();
            this._captureHistory.add_child(this._label('Capturas de esta sesión', 'di-h'));
            for (const uri of this._captureFiles)
                this._captureHistory.add_child(this._chip(Gio.File.new_for_uri(uri).get_basename(), () => this._openUri(uri)));
        });
        this._connect(Main.screenshotUI, 'notify::screencast-in-progress', () => {
            const recording = Main.screenshotUI.screencast_in_progress;
            this._recordingStarted = recording ? Date.now() : 0;
            this._clear(this._recordingTimer);
            this._recordingTimer = 0;
            if (recording) this._recordingTimer = this._timeout(1000, () => {
                this._updatePill();
                return GLib.SOURCE_CONTINUE;
            });
            this._toast({key: 'recording', icon: 'media-record-symbolic', priority: 70,
                text: recording ? 'Grabación de pantalla iniciada' : 'Grabación de pantalla terminada'});
        });
    }




    _buildHomePage() { this._workspace.buildHome(); }

    _renderHome() { this._workspace?.refresh(); }

    _refreshNavigation() {
        if (!this._navigation) return;
        this._navigation.destroy_all_children();
        this._tabButtons = {};
        const pinned = [...new Set(this._settings.get_strv('pinned-modules'))]
            .filter(id => MODULES.some(m => m[0] === id) && id !== 'home').slice(0, 2);
        for (const id of ['home', ...pinned, 'library']) {
            const name = id === 'library' ? 'Más' : TAB_NAMES[id];
            const icon = id === 'library' ? 'view-grid-symbolic' : MODULES.find(module => module[0] === id)?.[2] ?? 'go-home-symbolic';
            const button = this._chip(name, () => this._selectTab(id), icon);
            button.add_style_class_name('di-navigation-item');
            button._label.width = id === 'home' ? 36 : id === 'library' ? 24 : 64;
            button._label.clutter_text.set_ellipsize(Pango.EllipsizeMode.END);
            button.accessible_name = name;
            this._tabButtons[id] = button;
            this._navigation.add_child(button);
        }
        this._navigation.add_child(new St.Widget({x_expand: true}));
        this._navigation.add_child(this._iconBtn('window-close-symbolic', () => this._closeIsland(), 'di-top-btn', 14));
    }

    _ensurePage(id) {
        if (this._pages[id] || !this._builders[id]) return;
        try {
            this._builders[id]();
            if (id === 'notes') { this._loadNotes(); this._renderTasks(); }
            if (id === 'today') this._renderWeather();
        } catch (error) {
            console.error(`Isla: ${id}: ${error.message}`);
            const page = this._pages[id] ?? this._newPage(id);
            page.add_child(this._label(`No se pudo abrir esta sección: ${error.message}`, 'di-hint'));
        }
    }

    _buildMusicPage() {
        const page = this._newPage('music');
        page.add_style_class_name('di-page-music');
        const playerRow = new St.BoxLayout({style_class: 'di-head'});
        this._playerSelector = this._chip('Automático', () => {
            const choices = ['', ...(this._players ?? [])];
            const current = choices.indexOf(this._settings.get_string('preferred-player'));
            this._settings.set_string('preferred-player', choices[(current + 1) % choices.length]);
            this._discover();
        }, 'audio-speakers-symbolic');
        playerRow.add_child(this._playerSelector);
        playerRow.add_child(new St.Widget({x_expand: true}));
        playerRow.add_child(this._playerLabel);
        page.add_child(playerRow);

        const main = new St.BoxLayout({style_class: 'di-main', width: WIDTH});
        this._musicSurface = main;
        this._artPreview = false;
        const artToggle = this._chip('Portada', () => {
            this._artPreview = !this._artPreview;
            this._largeArt.visible = this._artPreview;
            this._resizeIsland();
        }, 'view-fullscreen-symbolic');
        playerRow.add_child(artToggle);
        this._art = new St.Bin({style_class: 'di-art', width: ART, height: ART, y_align: Clutter.ActorAlign.START});
        this._cover = new St.Icon({icon_name: 'audio-x-generic-symbolic', icon_size: 44});
        this._art.set_child(this._cover);
        main.add_child(this._art);

        const right = new St.BoxLayout({orientation: Clutter.Orientation.VERTICAL, style_class: 'di-right', width: RIGHT, height: ART});
        this._title = new St.Label({text: 'Sin música', style_class: 'di-title', width: RIGHT});
        this._title.clutter_text.set_ellipsize(3);
        this._artist = new St.Label({text: 'Abre un reproductor', style_class: 'di-artist', width: RIGHT});
        this._artist.clutter_text.set_ellipsize(3);
        right.add_child(this._title);
        right.add_child(this._artist);
        right.add_child(new St.Widget({y_expand: true}));

        this._seek = new Slider(0);
        this._seek.add_style_class_name('di-slider');
        this._seek.set_width(RIGHT);
        this._seek.connect('drag-begin', () => {
            this._seekDrag = true;
            this._seekTrackKey = this._musicTools.track.key;
            return Clutter.EVENT_PROPAGATE;
        });
        this._seek.connect('drag-end', () => {
            this._seekDrag = false;
            if (this._length > 0 && this._seekTrackKey === this._musicTools.track.key) this._seekTo(this._seek.value * this._length);
            return Clutter.EVENT_PROPAGATE;
        });
        this._seek.connect('notify::value', () => {
            if (this._syncingSeek) return;
            if (this._seekDrag) this._setTimes(this._seek.value * this._length);
            else if (this._length > 0) this._seekTo(this._seek.value * this._length);
        });
        right.add_child(this._seek);

        const times = new St.BoxLayout({style_class: 'di-times', width: RIGHT});
        this._elapsed = new St.Label({text: '0:00', style_class: 'di-time'});
        this._remaining = new St.Label({text: '-0:00', style_class: 'di-time'});
        times.add_child(this._elapsed);
        times.add_child(new St.Widget({x_expand: true}));
        times.add_child(this._remaining);
        right.add_child(times);

        const controls = new St.BoxLayout({style_class: 'di-controls di-music-transport', width: WIDTH, y_align: Clutter.ActorAlign.CENTER});
        controls.add_child(new St.Widget({x_expand: true}));
        const addControl = (icon, cb, kind = '') => {
            const button = new St.Button({style_class: `di-control ${kind}`.trim(), reactive: true, can_focus: true});
            const ic = new St.Icon({icon_name: icon, icon_size: kind === 'di-primary' ? 26 : 17});
            button.set_child(ic);
            button.connect('clicked', cb);
            controls.add_child(button);
            return {button, icon: ic};
        };
        this._shuffleBtn = addControl('media-playlist-shuffle-symbolic', () => this._toggleShuffle());
        this._previousBtn = addControl('media-skip-backward-symbolic', () => this._command('Previous'));
        this._playBtn = addControl('media-playback-start-symbolic', () => this._command('PlayPause'), 'di-primary');
        this._play = this._playBtn.icon;
        this._nextBtn = addControl('media-skip-forward-symbolic', () => this._command('Next'));
        this._loopBtn = addControl('media-playlist-repeat-symbolic', () => this._toggleLoop());
        controls.add_child(new St.Widget({x_expand: true}));
        main.add_child(right);
        page.add_child(main);
        page.add_child(controls);
        this._largeArt = new St.Bin({style_class: 'di-art', width: WIDTH, height: 260, visible: false});
        page.add_child(this._largeArt);

        const vol = new St.BoxLayout({style_class: 'di-volume-row', width: WIDTH, y_align: Clutter.ActorAlign.CENTER});
        this._volIcon = new St.Icon({icon_name: 'audio-volume-high-symbolic', icon_size: 14, style_class: 'di-vol-icon'});
        this._muteButton = new St.Button({style_class: 'di-control', reactive: true, can_focus: true,
            accessible_name: 'Silenciar salida de audio'});
        this._muteButton.set_child(this._volIcon);
        this._muteButton.connect('clicked', () => {
            if (this._sink) this._sink.change_is_muted(!this._sink.is_muted);
            else this._musicTools.setProperty('Volume', new GLib.Variant('d', this._musicTools.props.Volume > 0 ? 0 : this._musicTools.lastVolume ?? 0.5));
        });
        vol.add_child(this._muteButton);
        this._volume = new Slider(0.5);
        this._volume.add_style_class_name('di-slider');
        this._volume.add_style_class_name('di-volume');
        this._volume.set_width(WIDTH - 48);
        this._volume.accessible_name = 'Volumen de salida de audio';
        this._volume.connect('drag-begin', () => { this._volDrag = true; return Clutter.EVENT_PROPAGATE; });
        this._volume.connect('drag-end', () => { this._volDrag = false; return Clutter.EVENT_PROPAGATE; });
        this._volume.connect('notify::value', () => {
            if (this._syncing) return;
            this._applyVolume(this._volume.value);
        });
        vol.add_child(this._volume);
        page.add_child(vol);
        const audioTools = new St.BoxLayout({style_class: 'di-head'});
        this._outputButton = this._chip('Salida de audio', () => {
            const sinks = this._mixer?.get_sinks() ?? [];
            if (!sinks.length) return;
            const index = sinks.indexOf(this._sink);
            this._mixer.set_default_sink(sinks[(index + 1) % sinks.length]);
        }, 'audio-headphones-symbolic');
        audioTools.add_child(this._outputButton);
        audioTools.add_child(this._chip('Aplicaciones', () => {
            this._appAudio.visible = !this._appAudio.visible;
            if (this._appAudio.visible) this._renderAppAudio();
            this._resizeIsland();
        }, 'applications-multimedia-symbolic'));
        this._musicTools.build(page, controls, right);
        this._musicTools.more.add_child(audioTools);
        this._mediaExtras.build(this._musicTools.more, 330);
        this._appAudio = new St.BoxLayout({orientation: Clutter.Orientation.VERTICAL, style_class: 'di-list', visible: false});
        this._musicTools.more.add_child(this._appAudio);
    }

    _renderAppAudio() {
        this._appAudio.destroy_all_children();
        const inputs = this._mixer?.get_sink_inputs() ?? [];
        for (const stream of inputs) {
            const row = new St.BoxLayout({style_class: 'di-sysrow'});
            const label = this._label(stream.get_name() || stream.get_description() || 'Aplicación', 'di-hint', {width: 130});
            label.clutter_text.set_ellipsize(Pango.EllipsizeMode.END);
            row.add_child(label);
            const slider = new Slider(clamp(stream.volume / this._mixer.get_vol_max_norm()));
            slider.add_style_class_name('di-slider');
            slider.set_width(220);
            slider.accessible_name = `Volumen de ${label.get_text()}`;
            const id = stream.get_id();
            slider.connect('notify::value', () => {
                const live = this._mixer?.lookup_stream_id(id);
                if (!live) return;
                live.volume = Math.round(slider.value * this._mixer.get_vol_max_norm());
                live.push_volume();
            });
            row.add_child(slider);
            this._appAudio.add_child(row);
        }
        if (!inputs.length) this._appAudio.add_child(this._label('No hay aplicaciones emitiendo audio', 'di-hint'));
    }




    _buildFilesPage() {
        const page = this._newPage('files');
        page.add_child(this._head('Estante de archivos',
            this._chip('Añadir copiados', () => this._shelfAddFromClipboard(), 'edit-paste-symbolic'),
            this._iconBtn('user-trash-symbolic', () => this._shelfClear())));
        this._shelfList = new St.BoxLayout({orientation: Clutter.Orientation.VERTICAL, style_class: 'di-list'});
        this._shelfScroll = this._scroll(PAGE_H - 34);
        this._shelfScroll.add_child(this._shelfList);
        page.add_child(this._shelfScroll);
        page.add_child(this._chip('Arrastrar y previsualizar archivos', () => this._shelfBridge?.open(), 'view-grid-symbolic'));
        const tools = new St.BoxLayout({style_class: 'di-head'});
        for (const [operation, label] of [['zip', 'ZIP'], ['extract', 'Extraer'], ['png', 'PNG'], ['ocr', 'OCR']])
            tools.add_child(this._chip(label, () => this._runFileTool(operation)));
        page.add_child(tools);
        const media = new St.BoxLayout({style_class: 'di-head'});
        for (const operation of ['mp3', 'mp4']) media.add_child(this._chip(operation.toUpperCase(), () => this._runFileTool(operation)));
        media.add_child(this._chip('Seleccionar todos', () => {
            this._shelfSelection = new Set(this._shelfSelection.size === this._shelf.length ? [] : this._shelf);
            this._renderShelf();
        }));
        page.add_child(media);
        this._fileJobLabel = this._label('Selecciona archivos para procesarlos.', 'di-hint', {width: WIDTH});
        this._fileJobLabel.clutter_text.set_line_wrap(true);
        page.add_child(this._fileJobLabel);
        this._fileCancel = this._chip('Cancelar operación', () => {
            this._fileCancelled = true;
            this._fileJob?.send_signal(15);
        }, 'process-stop-symbolic');
        this._fileCancel.visible = false;
        page.add_child(this._fileCancel);
        this._fileResult = this._chip('Abrir resultado', () => this._openUri(GLib.filename_to_uri(this._fileResultPath, null)));
        this._fileResult.visible = false;
        page.add_child(this._fileResult);
    }

    _runFileTool(operation) {
        if (this._fileJob) return;
        const paths = this._shelf.filter(path => this._shelfSelection.has(path));
        if (!paths.length) {
            this._fileJobLabel.set_text('Selecciona al menos un archivo con su casilla.');
            return;
        }
        this._fileResult.visible = false;
        this._fileJobLabel.set_text(`${operation.toUpperCase()} · Procesando ${paths.length} elemento(s)…`);
        let process;
        try {
            process = Gio.Subprocess.new(['python3', `${this.path}/file-tools.py`, operation,
                JSON.stringify(paths), `${this._dataDir}/exports`],
            Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE);
        } catch (error) {
            this._fileJobLabel.set_text(`No se pudo iniciar: ${error.message}`);
            return;
        }
        this._fileJob = process;
        this._fileCancelled = false;
        this._fileCancel.visible = true;
        this._toast({key: 'files', icon: 'folder-symbolic', text: 'Operación de archivos en curso', priority: 30});
        process.communicate_utf8_async(null, null, (proc, result) => {
            let output;
            try { output = proc.communicate_utf8_finish(result); }
            catch (error) { if (this._alive) this._fileJobLabel.set_text(error.message); }
            if (!this._alive || this._fileJob !== proc) return;
            this._fileJob = null;
            this._fileCancel.visible = false;
            if (this._fileCancelled) {
                this._fileJobLabel.text = 'Operación cancelada. Originales conservados.';
                this._activities.dismiss('files'); this._presentActivity(); this._resizeIsland(); return;
            }
            try {
                const data = JSON.parse(output?.[1] || '{}');
                if (!proc.get_successful() || data.error || !data.path) throw new Error(data.error || 'La operación no pudo terminar');
                this._fileResultPath = data.path;
                this._fileResult.visible = true;
                this._fileJobLabel.set_text(`${operation.toUpperCase()} · Completado. Originales conservados.`);
                this._toast({key: 'files', icon: 'emblem-ok-symbolic', text: 'Archivos listos', priority: 30});
            } catch (error) {
                this._fileJobLabel.set_text(`Error: ${error.message}`);
                this._toast({key: 'files', icon: 'dialog-warning-symbolic', text: 'Error en la operación', warn: true});
            }
            this._resizeIsland();
        });
    }

    _shelfFile() { return GLib.build_filenamev([this._dataDir, 'shelf.json']); }

    _loadShelf() {
        try {
            const [ok, data] = GLib.file_get_contents(this._shelfFile());
            if (ok) {
                const state = JSON.parse(dec.decode(data));
                this._shelf = (state.files ?? []).filter(p => typeof p === 'string' && GLib.path_is_absolute(p) && GLib.file_test(p, GLib.FileTest.EXISTS)).slice(0, 50);
                this._shelfPins = new Set((state.pins ?? []).filter(p => this._shelf.includes(p)));
            }
        } catch (e) { this._shelf = []; }
    }

    _saveShelf() {
        this._fileServices?.syncShelf();
        try { GLib.file_set_contents(this._shelfFile(), JSON.stringify({files: this._shelf, pins: [...this._shelfPins]})); } catch (e) {            }
    }

    _shelfAddFromClipboard() {
        const clipboard = St.Clipboard.get_default();
        const fromText = () => {
            clipboard.get_text(St.ClipboardType.CLIPBOARD, (_c, text) => {
                const items = (text ?? '').split('\n').map(s => s.trim())
                    .filter(s => s.startsWith('file://') || s.startsWith('/'))
                    .map(s => s.startsWith('/') ? GLib.filename_to_uri(s, null) : s);
                if (items.length) this._shelfAdd(items);
                else this._toast({icon: 'folder-symbolic', text: 'Copia archivos primero (Ctrl+C)', ms: 2200});
            });
        };
        try {
            clipboard.get_content(St.ClipboardType.CLIPBOARD, 'x-special/gnome-copied-files', (_c, bytes) => {
                let uris = [];
                try {
                    if (bytes) uris = dec.decode(bytes.get_data()).split('\n').map(s => s.trim()).filter(s => s.startsWith('file://'));
                } catch (e) {            }
                if (uris.length) this._shelfAdd(uris);
                else fromText();
            });
        } catch (e) { fromText(); }
    }

    _shelfAdd(uris) {
        let added = 0;
        for (const uri of uris) {
            try {
                const path = GLib.filename_from_uri(uri)[0];
                if (this._shelf.length < 50 && GLib.file_test(path, GLib.FileTest.EXISTS) && !this._shelf.includes(path)) { this._shelf.push(path); added++; }
            } catch (e) {            }
        }
        this._shelf = this._shelf.slice(0, 50);
        this._saveShelf();
        this._renderShelf();
        this._toast({icon: 'folder-symbolic', text: added ? `${added} en el estante` : 'Ya estaban en el estante', ms: 1800});
    }

    _shelfClear() {
        this._shelf = this._shelf.filter(path => this._shelfPins.has(path));
        this._shelfSelection.clear();
        this._saveShelf();
        this._renderShelf();
    }

    _renderShelf() {
        if (!this._shelfList) return;
        const valid = this._shelf.filter(path => GLib.file_test(path, GLib.FileTest.EXISTS));
        if (valid.length !== this._shelf.length) { this._shelf = valid; this._saveShelf(); }
        this._shelfList.destroy_all_children();
        if (!this._shelf.length) {
            const hint = this._label('Copia archivos en tu gestor (Ctrl+C) y pulsa «Añadir copiados». Luego pégalos donde quieras o envíalos.', 'di-hint');
            hint.clutter_text.set_line_wrap(true);
            hint.width = WIDTH - 10;
            this._shelfList.add_child(hint);
            this._fitShelfPage();
            return;
        }
        for (const path of this._shelf) {
            const uri = GLib.filename_to_uri(path, null);
            const row = new St.BoxLayout({style_class: 'di-row', width: WIDTH - 12});
            const selected = this._shelfSelection.has(path);
            const check = this._iconBtn(selected ? 'checkbox-checked-symbolic' : 'checkbox-symbolic', () => {
                if (this._shelfSelection.has(path)) this._shelfSelection.delete(path);
                else this._shelfSelection.add(path);
                this._renderShelf();
            });
            check.accessible_name = `${selected ? 'Deseleccionar' : 'Seleccionar'} ${GLib.path_get_basename(path)}`;
            row.add_child(check);
            let gicon = null;
            try { gicon = Gio.File.new_for_path(path).query_info('standard::icon', Gio.FileQueryInfoFlags.NONE, null).get_icon(); } catch (e) {            }
            row.add_child(gicon ? new St.Icon({gicon, icon_size: 20}) : new St.Icon({icon_name: 'text-x-generic-symbolic', icon_size: 20}));
            const open = new St.Button({style_class: 'di-row-name', reactive: true, can_focus: true, x_expand: true, x_align: Clutter.ActorAlign.START});
            const name = new St.Label({text: GLib.path_get_basename(path), width: 120});
            name.clutter_text.set_ellipsize(Pango.EllipsizeMode.MIDDLE);
            open.set_child(name);
            open.connect('clicked', () => { this._openUri(uri); });
            row.add_child(open);
            row.add_child(this._iconBtn('edit-copy-symbolic', () => this._copyFile(uri)));
            const pin = this._iconBtn(this._shelfPins.has(path) ? 'starred-symbolic' : 'non-starred-symbolic', () => {
                if (this._shelfPins.has(path)) this._shelfPins.delete(path); else this._shelfPins.add(path);
                this._saveShelf(); this._renderShelf();
            });
            pin.accessible_name = this._shelfPins.has(path) ? 'Desfijar archivo' : 'Fijar archivo';
            row.add_child(pin);
            row.add_child(this._iconBtn('send-to-symbolic', () => this._sendFile(path, uri)));
            row.add_child(this._iconBtn('window-close-symbolic', () => {
                this._shelf = this._shelf.filter(p => p !== path);
                this._shelfPins.delete(path);
                this._shelfSelection.delete(path);
                this._saveShelf();
                this._renderShelf();
            }));
            this._shelfList.add_child(row);
        }
        this._fitShelfPage();
    }

    _fitShelfPage() {
        if (!this._shelfScroll || !this._shelfList) return;
        const natural = this._shelfList.get_preferred_height(WIDTH)[1];
        this._shelfScroll.set_height(clamp(Math.ceil(natural) + 4, 42, PAGE_H - 34));
        if (this._tab === 'files') this._resizeIsland();
    }

    _openUri(uri) {
        try {
            Gio.AppInfo.launch_default_for_uri(uri, global.create_app_launch_context(0, -1));
            this._menu.close();
        } catch (e) { this._toast({icon: 'dialog-warning-symbolic', text: 'No se pudo abrir', warn: true}); }
    }

    _copyFile(uri) {
        try {
            St.Clipboard.get_default().set_content(St.ClipboardType.CLIPBOARD, 'x-special/gnome-copied-files',
                new GLib.Bytes(enc.encode(`copy\n${uri}`)));
            this._toast({icon: 'edit-copy-symbolic', text: 'Listo para pegar (Ctrl+V)', ms: 2200});
        } catch (e) { this._toast({icon: 'dialog-warning-symbolic', text: 'No se pudo copiar', warn: true}); }
    }

    _sendFile(path, uri) {
        this._shareChoices?.destroy();
        this._shareChoices = new St.BoxLayout({orientation: Clutter.Orientation.VERTICAL, style_class: 'di-list'});
        this._pages.files.add_child(this._shareChoices);
        this._shareChoices.add_child(this._label('Elige una herramienta; el destino se selecciona en ella.', 'di-hint'));
        let count = 0;
        for (const [binary, label, argument] of [['localsend', 'LocalSend', path], ['kdeconnect-handler', 'KDE Connect', uri], ['bluetooth-sendto', 'Bluetooth', path]]) {
            if (!GLib.find_program_in_path(binary)) continue;
            count++;
            this._shareChoices.add_child(this._chip(label, () => {
                if (this._spawn([binary, argument])) {
                    this._toast({text: `${label} abierto. Confirma allí el envío.`, icon: 'send-to-symbolic'});
                    this._closeIsland();
                }
            }));
        }
        if (!count) this._shareChoices.add_child(this._label('Instala LocalSend, KDE Connect o bluetooth-sendto.', 'di-hint'));
        this._resizeIsland();
    }

    _clipFile() { return GLib.build_filenamev([this._dataDir, 'portapapeles.json']); }
    _clipDir() { return GLib.build_filenamev([this._dataDir, 'clips']); }
    _clipPath(e) { return GLib.build_filenamev([this._clipDir(), e.file]); }

    _loadClipState() {
        this._cfg = {persistAll: false, ignorePw: true, max: 30, private: true};
        this._clips = [];
        try {
            const [ok, data] = GLib.file_get_contents(this._clipFile());
            if (ok) {
                const json = JSON.parse(dec.decode(data));
                this._cfg = {...this._cfg, ...(json.cfg ?? {})};
                const entries = json.entries ?? [];
                this._clips = entries.filter(e => e && (e.type === 'text' ||
                    (e.file && GLib.file_test(this._clipPath(e), GLib.FileTest.EXISTS) &&
                    this._validStoredImage(e))));
                if (this._clips.length !== entries.length) this._saveClips(true);
            }
        } catch (e) {                   }
        this._purgeClipFiles(this._clips);
    }

    _validImageBytes(data, mime) {
        if (!data || data.length < 2) return false;
        if (mime === 'image/png')
            return data.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10]
                .every((byte, index) => data[index] === byte);
        if (mime === 'image/jpeg')
            return data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff;
        if (mime === 'image/webp')
            return data.length >= 12 && String.fromCharCode(...data.slice(0, 4)) === 'RIFF' &&
                String.fromCharCode(...data.slice(8, 12)) === 'WEBP';
        if (mime === 'image/bmp') return data[0] === 0x42 && data[1] === 0x4d;
        return false;
    }

    _validStoredImage(entry) {
        try {
            const [ok, data] = GLib.file_get_contents(this._clipPath(entry));
            return ok && this._validImageBytes(data, entry.mime);
        } catch (e) {
            return false;
        }
    }

    _persistedClips() {
        return this._clips.filter(e => this._cfg.persistAll || e.pinned || e.fav);
    }

    _purgeClipFiles(keepList) {
        try {
            const dir = Gio.File.new_for_path(this._clipDir());
            if (!dir.query_exists(null)) return;
            const keep = new Set(keepList.filter(e => e.file).map(e => e.file));
            const en = dir.enumerate_children('standard::name', Gio.FileQueryInfoFlags.NONE, null);
            let info;
            while ((info = en.next_file(null))) {
                const name = info.get_name();
                if (!keep.has(name)) dir.get_child(name).delete(null);
            }
        } catch (e) {            }
    }

    _saveClips(final = false) {
        const write = () => {
            this._clipSaveTimer = 0;
            try {
                GLib.mkdir_with_parents(this._dataDir, 0o755);
                GLib.file_set_contents(this._clipFile(), JSON.stringify({cfg: this._cfg, entries: this._persistedClips()}));
            } catch (e) {            }
        };
        this._clear(this._clipSaveTimer);
        this._clipSaveTimer = 0;
        if (final) {
            write();
            if (!this._cfg.persistAll) this._purgeClipFiles(this._persistedClips());
            return;
        }
        this._clipSaveTimer = this._timeout(800, () => { write(); return GLib.SOURCE_REMOVE; });
    }

    _setupClipboard() {
        const selection = global.display.get_selection();
        this._connect(selection, 'owner-changed', (_s, type) => {
            if (type === Meta.SelectionType.SELECTION_CLIPBOARD) this._onClipboard();
        });
        this._onClipboard();
    }

    _onClipboard() {
        if (!this._alive || this._cfg.private || Date.now() < this._ignoreUntil) return;
        const clipboard = St.Clipboard.get_default();
        let mimes = [];
        try { mimes = clipboard.get_mimetypes(St.ClipboardType.CLIPBOARD) ?? []; } catch (e) {            }
        if (this._cfg.ignorePw && mimes.some(m => m.toLowerCase().includes('passwordmanagerhint'))) return;
        const imageMime = ['image/png', 'image/jpeg', 'image/webp', 'image/bmp'].find(m => mimes.includes(m));
        if (imageMime) {
            try {
                clipboard.get_content(St.ClipboardType.CLIPBOARD, imageMime, (_c, bytes) => this._addImage(bytes, imageMime));
                return;
            } catch (e) {                   }
        }
        clipboard.get_text(St.ClipboardType.CLIPBOARD, (_c, text) => this._addText(text));
    }

    _pushClip(entry) {
        const existing = this._clips.find(e => e.id === entry.id);
        if (existing) {
            existing.t = Date.now();
            this._clips = [existing, ...this._clips.filter(e => e !== existing)];
            this._currentId = existing.id;
        } else {
            this._clips.unshift(entry);
            this._currentId = entry.id;
        }

        let count = 0;
        const removed = [];
        this._clips = this._clips.filter(e => {
            if (e.pinned || e.fav) return true;
            count++;
            if (count > this._cfg.max) { removed.push(e); return false; }
            return true;
        });
        for (const e of removed) this._deleteClipFile(e);
        this._popId = this._menu?.isOpen ? this._currentId : null;
        this._saveClips();
        if (this._tab === 'clip') this._renderClips();
    }

    _addText(text) {
        if (!this._alive || this._cfg.private || !text || !text.trim() || text.length > 50000) return;
        const id = GLib.compute_checksum_for_string(GLib.ChecksumType.SHA1, text, -1);
        this._pushClip({id, type: 'text', text, pinned: false, fav: false, t: Date.now()});
    }

    _addImage(bytes, mime) {
        if (!this._alive || this._cfg.private || !bytes) return;
        try {
            const size = bytes.get_size();
            if (size <= 0 || size > 15 * 1024 * 1024) return;
            const data = bytes.get_data();
            if (!this._validImageBytes(data, mime)) return;
            const id = GLib.compute_checksum_for_bytes(GLib.ChecksumType.SHA1, bytes);
            const ext = mime.split('/')[1].replace('jpeg', 'jpg');
            const file = `${id}.${ext}`;
            const path = GLib.build_filenamev([this._clipDir(), file]);
            if (!GLib.file_test(path, GLib.FileTest.EXISTS)) {
                GLib.mkdir_with_parents(this._clipDir(), 0o755);
                GLib.file_set_contents(path, data);
            }
            this._pushClip({id, type: 'image', file, mime, size, pinned: false, fav: false, t: Date.now()});
        } catch (e) { console.debug(`Dynamic Island: imagen del portapapeles: ${e.message}`); }
    }

    _deleteClipFile(e) {
        if (e.type !== 'image' || !e.file) return;
        try { Gio.File.new_for_path(this._clipPath(e)).delete(null); } catch (err) {            }
    }

    _copyClip(e) {
        if (this._clipBusy) return;
        this._ignoreUntil = Date.now() + 600;
        try {
            if (e.type === 'text') {
                St.Clipboard.get_default().set_text(St.ClipboardType.CLIPBOARD, e.text);
            } else {
                const [ok, data] = GLib.file_get_contents(this._clipPath(e));
                if (!ok) throw new Error('imagen no encontrada');
                St.Clipboard.get_default().set_content(St.ClipboardType.CLIPBOARD, e.mime, new GLib.Bytes(data));
            }
        } catch (err) {
            this._toast({icon: 'dialog-warning-symbolic', text: 'No se pudo copiar', warn: true});
            return;
        }

        e.t = Date.now();
        const previous = this._currentId;
        this._currentId = e.id;
        this._saveClips();
        this._clipBusy = true;

        const finish = delay => {
            this._clipBusy = false;
            this._renderClips();
            this._timeout(delay, () => {
                this._menu.close();
                this._toast({icon: 'edit-paste-symbolic', text: 'Copiado · pega con Ctrl+V', ms: 1800});
                return GLib.SOURCE_REMOVE;
            });
        };
        const canSlide = this._menu.isOpen && this._tab === 'clip' && previous && previous !== e.id
            && this._clipRows.has(previous) && this._clipRows.has(e.id);
        if (canSlide) {
            this._animateDot(previous, e.id, () => finish(170));
        } else {
            this._popId = e.id;
            finish(430);
        }
    }

    _animateDot(fromId, toId, done) {
        const from = this._clipRows.get(fromId).dot;
        const to = this._clipRows.get(toId).dot;
        const dy = to.get_transformed_position()[1] - from.get_transformed_position()[1];
        from.remove_all_transitions();
        from.ease({
            translation_y: dy, duration: this._duration(420), mode: Clutter.AnimationMode.EASE_OUT_BACK,
            onComplete: () => done(),
        });
    }

    _toggleClip(e, key) {
        e[key] = !e[key];
        this._saveClips();
        this._renderClips();
    }

    _deleteClip(e) {
        this._clips = this._clips.filter(x => x !== e);
        this._deleteClipFile(e);
        if (this._currentId === e.id) this._currentId = null;
        this._saveClips();
        this._renderClips();
    }

    _clearClips() {
        const removed = this._clips.filter(e => !e.pinned && !e.fav);
        this._clips = this._clips.filter(e => e.pinned || e.fav);
        for (const e of removed) this._deleteClipFile(e);
        this._currentId = null;
        this._saveClips();
        this._renderClips();
        this._toast({icon: 'user-trash-symbolic', text: 'Historial vaciado', ms: 1800});
    }

    _footRow(icon, text, cb, withSwitch = false, state = false) {
        const button = new St.Button({style_class: 'di-foot', reactive: true, can_focus: true, x_expand: true, width: WIDTH});

        const row = new St.BoxLayout({style_class: 'di-foot-row', width: WIDTH - 20, y_align: Clutter.ActorAlign.CENTER});
        if (icon) row.add_child(new St.Icon({icon_name: icon, icon_size: 15, y_align: Clutter.ActorAlign.CENTER}));
        row.add_child(new St.Label({text, y_align: Clutter.ActorAlign.CENTER}));
        row.add_child(new St.Widget({x_expand: true}));
        let sw = null;
        if (withSwitch) {
            sw = new PopupMenu.Switch(state);
            sw.add_style_class_name('di-switch');
            sw.y_align = Clutter.ActorAlign.CENTER;
            row.add_child(sw);
        }
        button.set_child(row);
        button.connect('clicked', () => cb(sw));
        return {button, sw};
    }

    _buildClipPage() {
        const page = this._newPage('clip', -1);
        page.add_style_class_name('di-page-clip');
        this._clipView = 'list';
        this._clipFavOnly = false;

        const searchRow = new St.BoxLayout({style_class: 'di-search-row', width: WIDTH, y_align: Clutter.ActorAlign.CENTER});
        this._clipSearch = new St.Entry({
            style_class: 'di-search', hint_text: 'Buscar en el historial…', can_focus: true, x_expand: true,
            primary_icon: new St.Icon({icon_name: 'edit-find-symbolic', style_class: 'di-search-icon'}),
        });
        this._clipSearch.clutter_text.connect('text-changed', () => this._renderClips());
        searchRow.add_child(this._clipSearch);
        this._clipFavBtn = this._iconBtn('non-starred-symbolic', () => {
            this._clipFavOnly = !this._clipFavOnly;
            this._clipFavBtn.get_child().icon_name = this._clipFavOnly ? 'starred-symbolic' : 'non-starred-symbolic';
            if (this._clipFavOnly) this._clipFavBtn.add_style_class_name('di-ico-fav');
            else this._clipFavBtn.remove_style_class_name('di-ico-fav');
            this._renderClips();
        }, 'di-mini-btn', 16);
        searchRow.add_child(this._clipFavBtn);
        page.add_child(searchRow);
        this._clipFilter = 'all';
        const filters = new St.BoxLayout({style_class: 'di-presets'});
        for (const [value, name] of [['all', 'Todo'], ['text', 'Texto'], ['link', 'Enlaces'], ['image', 'Imágenes']])
            filters.add_child(this._chip(name, () => { this._clipFilter = value; this._renderClips(); }));
        page.add_child(filters);

        this._clipList = new St.BoxLayout({orientation: Clutter.Orientation.VERTICAL, style_class: 'di-list'});
        this._clipScroll = this._scroll(PAGE_CLIP_LIST);
        this._clipScroll.add_child(this._clipList);
        page.add_child(this._clipScroll);

        page.add_child(new St.Widget({style_class: 'di-sep', height: 1}));

        const priv = this._footRow('security-high-symbolic', 'Modo privado', sw => {
            this._cfg.private = !this._cfg.private;
            sw.state = this._cfg.private;
            this._saveClips();
            this._toast({icon: 'security-high-symbolic', text: this._cfg.private ? 'Modo privado: no se guarda nada' : 'Modo privado desactivado', ms: 2000});
        }, true, this._cfg.private);
        page.add_child(priv.button);
        page.add_child(this._footRow('preferences-system-symbolic', 'Configuración', () => {
            this._clipView = this._clipView === 'settings' ? 'list' : 'settings';
            this._renderClips();
        }).button);
        page.add_child(this._footRow('user-trash-symbolic', 'Vaciar historial', () => this._clearClips()).button);
    }

    _renderClips() {
        if (!this._clipList) return;
        this._clipList.destroy_all_children();
        this._clipRows.clear();
        if (this._clipView === 'settings') {
            this._renderClipSettings();
            this._fitClipPage();
            return;
        }

        const query = (this._clipSearch?.get_text() ?? '').trim().toLowerCase();
        let list = [...this._clips.filter(e => e.pinned), ...this._clips.filter(e => !e.pinned)];
        if (this._clipFilter === 'image') list = list.filter(e => e.type === 'image');
        else if (this._clipFilter === 'link') list = list.filter(e => e.type === 'text' && /^https?:\/\//i.test(e.text));
        else if (this._clipFilter === 'text') list = list.filter(e => e.type === 'text');
        if (this._clipFavOnly) list = list.filter(e => e.fav);
        if (query) {
            list = list.filter(e => e.type === 'text'
                ? e.text.toLowerCase().includes(query)
                : 'imagen image foto captura'.includes(query));
        }
        if (!list.length) {
            this._clipList.add_child(this._label(
                this._clips.length ? 'Sin resultados.' : 'Aún no has copiado nada.', 'di-hint'));
            this._fitClipPage();
            return;
        }
        for (const e of list) this._clipList.add_child(this._clipRow(e));

        if (this._popId) {
            const slot = this._clipRows.get(this._popId);
            this._popId = null;
            if (slot) {
                slot.dot.set_pivot_point(0.5, 0.5);
                slot.dot.set_scale(0, 0);
                this._timeout(40, () => {
                    try {
                        slot.dot.ease({scale_x: 1, scale_y: 1, duration: this._duration(320), mode: Clutter.AnimationMode.EASE_OUT_BACK});
                    } catch (err) {                            }
                    return GLib.SOURCE_REMOVE;
                });
            }
        }
        this._fitClipPage();
    }

    _fitClipPage() {
        if (!this._clipScroll) return;
        const natural = this._clipList.get_preferred_height(-1)[1];
        this._clipScroll.set_height(clamp(Math.ceil(natural) + 6, 60, PAGE_CLIP_LIST));
        if (this._tab === 'clip') this._resizeIsland();
    }

    _clipRow(e) {
        const row = new St.BoxLayout({style_class: 'di-clip-row', width: WIDTH - 12, y_align: Clutter.ActorAlign.CENTER});
        const dot = new St.Widget({
            style_class: e.id === this._currentId ? 'di-clip-dot di-clip-dot-on' : 'di-clip-dot',
            width: 9, height: 9, y_align: Clutter.ActorAlign.CENTER,
        });
        row.add_child(dot);
        this._clipRows.set(e.id, {row, dot});

        const main = new St.Button({style_class: 'di-clip-main', reactive: true, can_focus: true, x_expand: true, x_align: Clutter.ActorAlign.START});
        const inner = new St.BoxLayout({style_class: 'di-clip-inner', y_align: Clutter.ActorAlign.CENTER});
        let label;
        if (e.type === 'image') {
            const thumb = new St.Bin({style_class: 'di-thumb', width: 34, height: 34, y_align: Clutter.ActorAlign.CENTER});
            thumb.set_style(`background-image: url("file://${this._clipPath(e)}"); background-size: cover;`);
            inner.add_child(thumb);
            label = new St.Label({text: `Imagen · ${Math.max(1, Math.round(e.size / 1024))} KB`, width: 112, y_align: Clutter.ActorAlign.CENTER});
        } else {
            const first = e.text.trim().split('\n').find(l => l.trim()) ?? '';
            label = new St.Label({text: first.replace(/\s+/g, ' '), width: 156, y_align: Clutter.ActorAlign.CENTER});
        }
        label.clutter_text.set_ellipsize(Pango.EllipsizeMode.END);
        inner.add_child(label);
        main.set_child(inner);
        main.connect('clicked', () => this._copyClip(e));
        row.add_child(main);

        row.add_child(new St.Icon({
            icon_name: e.type === 'image' ? 'image-x-generic-symbolic' : 'document-edit-symbolic',
            icon_size: 14, style_class: 'di-clip-type', y_align: Clutter.ActorAlign.CENTER,
        }));
        row.add_child(this._iconBtn('view-pin-symbolic', () => this._toggleClip(e, 'pinned'),
            e.pinned ? 'di-mini-btn di-ico-on' : 'di-mini-btn'));
        row.add_child(this._iconBtn('edit-copy-symbolic', () => this._copyClip(e)));
        row.add_child(this._iconBtn(e.fav ? 'starred-symbolic' : 'non-starred-symbolic', () => this._toggleClip(e, 'fav'),
            e.fav ? 'di-mini-btn di-ico-fav' : 'di-mini-btn'));
        row.add_child(this._iconBtn('user-trash-symbolic', () => this._deleteClip(e)));
        return row;
    }

    _renderClipSettings() {
        const list = this._clipList;
        list.add_child(this._footRow('go-previous-symbolic', 'Volver al historial', () => {
            this._clipView = 'list';
            this._renderClips();
        }).button);
        list.add_child(this._footRow('drive-harddisk-symbolic', 'Guardar historial en disco', sw => {
            this._cfg.persistAll = !this._cfg.persistAll;
            sw.state = this._cfg.persistAll;
            this._saveClips();
        }, true, this._cfg.persistAll).button);
        list.add_child(this._footRow('dialog-password-symbolic', 'Ignorar gestores de contraseñas', sw => {
            this._cfg.ignorePw = !this._cfg.ignorePw;
            sw.state = this._cfg.ignorePw;
            this._saveClips();
        }, true, this._cfg.ignorePw).button);

        const maxRow = new St.BoxLayout({style_class: 'di-foot-row di-foot', width: WIDTH, y_align: Clutter.ActorAlign.CENTER});
        maxRow.add_child(new St.Icon({icon_name: 'view-list-symbolic', icon_size: 15, y_align: Clutter.ActorAlign.CENTER}));
        maxRow.add_child(new St.Label({text: 'Máximo de entradas', y_align: Clutter.ActorAlign.CENTER}));
        maxRow.add_child(new St.Widget({x_expand: true}));
        const value = new St.Label({text: String(this._cfg.max), style_class: 'di-sys-val', y_align: Clutter.ActorAlign.CENTER, width: 30});
        const step = delta => {
            this._cfg.max = clamp(this._cfg.max + delta, 10, 100);
            value.set_text(String(this._cfg.max));
            this._saveClips();
        };
        maxRow.add_child(this._iconBtn('list-remove-symbolic', () => step(-10)));
        maxRow.add_child(value);
        maxRow.add_child(this._iconBtn('list-add-symbolic', () => step(10)));
        list.add_child(maxRow);
    }




    _buildNotesPage() {
        const page = this._newPage('notes');
        page.add_child(this._head('Notas rápidas',
            this._chip('Copiar', () => {
                St.Clipboard.get_default().set_text(St.ClipboardType.CLIPBOARD, this._noteEntry.get_text());
                this._toast({icon: 'edit-copy-symbolic', text: 'Nota copiada'});
            }, 'edit-copy-symbolic'),
            this._chip('Borrar', () => { this._noteEntry.set_text(''); this._saveNotes(); }, 'edit-clear-symbolic')));
        this._noteEntry = new St.Entry({style_class: 'di-note', hint_text: 'Escribe un recordatorio…', can_focus: true, x_expand: true});
        this._noteEntry.set_height(PAGE_H - 52);
        const ct = this._noteEntry.clutter_text;
        ct.set_single_line_mode(false);
        ct.set_activatable(false);
        ct.set_line_wrap(true);
        ct.set_line_wrap_mode(Pango.WrapMode.WORD_CHAR);
        ct.set_ellipsize(Pango.EllipsizeMode.NONE);
        ct.connect('text-changed', () => {
            this._clear(this._noteSaveTimer);
            this._noteSaveTimer = this._timeout(700, () => { this._noteSaveTimer = 0; this._saveNotes(); return GLib.SOURCE_REMOVE; });
        });
        page.add_child(this._noteEntry);
        const input = new St.Entry({style_class: 'di-search', hint_text: 'Nueva tarea · Enter para guardar', can_focus: true});
        input.clutter_text.connect('activate', () => {
            const text = input.get_text().trim();
            if (!text || text.length > 300) return;
            this._tasks.push({text, done: false});
            input.set_text('');
            this._saveTasks();
            this._renderTasks();
        });
        page.add_child(input);
        this._taskList = new St.BoxLayout({orientation: Clutter.Orientation.VERTICAL, style_class: 'di-list'});
        const scroll = this._scroll(108);
        scroll.set_child(this._taskList);
        page.add_child(scroll);
    }

    _loadTasks() {
        this._tasks = [];
        try {
            const data = JSON.parse(dec.decode(GLib.file_get_contents(`${this._dataDir}/tasks.json`)[1]));
            if (Array.isArray(data)) this._tasks = data.filter(item => typeof item?.text === 'string').slice(0, 200);
        } catch (e) {                          }
        this._renderTasks();
    }

    _saveTasks() {
        Gio.File.new_for_path(`${this._dataDir}/tasks.json`).replace_contents(enc.encode(JSON.stringify(this._tasks)),
            null, false, Gio.FileCreateFlags.PRIVATE | Gio.FileCreateFlags.REPLACE_DESTINATION, null);
    }

    _renderTasks() {
        if (!this._taskList) return;
        this._taskList.destroy_all_children();
        for (const task of this._tasks ?? []) {
            const row = new St.BoxLayout({style_class: 'di-row'});
            const toggle = this._chip(task.done ? '✓' : '○', () => {
                task.done = !task.done;
                this._saveTasks();
                this._renderTasks();
            });
            toggle.accessible_name = task.done ? 'Marcar como pendiente' : 'Completar tarea';
            row.add_child(toggle);
            const label = this._label(task.text, 'di-row-name', {width: WIDTH - 108, x_expand: true});
            label.clutter_text.set_ellipsize(Pango.EllipsizeMode.END);
            label.opacity = task.done ? 110 : 255;
            row.add_child(label);
            row.add_child(this._iconBtn('user-trash-symbolic', () => {
                this._tasks = this._tasks.filter(item => item !== task);
                this._saveTasks();
                this._renderTasks();
            }));
            this._taskList.add_child(row);
        }
        if (!this._tasks?.length) this._taskList.add_child(this._label('Sin tareas pendientes', 'di-hint'));
    }

    _notesFile() { return GLib.build_filenamev([this._dataDir, 'notas.txt']); }

    _loadNotes() {
        try {
            const [ok, data] = GLib.file_get_contents(this._notesFile());
            if (ok) this._noteEntry.set_text(dec.decode(data));
        } catch (e) {                         }
    }

    _saveNotes() {
        if (!this._noteEntry) return;
        try { GLib.file_set_contents(this._notesFile(), this._noteEntry.get_text()); } catch (e) {            }
    }




    _buildNotificationsPage() {
        const page = this._newPage('notifications', 208);
        page.add_style_class_name('di-page-notifications');
        this._notificationClearBtn = this._chip('Limpiar', () => this._clearNotifications(),
            'user-trash-symbolic');
        page.add_child(this._head('Notificaciones', this._notificationClearBtn));

        const scroll = this._scroll(168);
        this._notificationList = new St.BoxLayout({
            orientation: Clutter.Orientation.VERTICAL,
            style_class: 'di-notification-list',
            width: WIDTH,
        });
        scroll.set_child(this._notificationList);
        page.add_child(scroll);
    }

    _setupNotifications() {
        this._connect(Main.messageTray, 'source-added', () => this._scheduleNotificationsRender());
        this._connect(Main.messageTray, 'source-removed', () => this._scheduleNotificationsRender());
        this._bindNotificationSources();



        const tray = Main.messageTray;
        this._bannerOverrides = new InjectionManager();
        this._bannerOverrides.overrideMethod(tray, '_showNotification', () => function () {
            this._notificationQueue.length = 0;
            this.emit('queue-changed');
        });

        if (tray.queueCount) {
            tray._notificationQueue.length = 0;
            tray.emit('queue-changed');
        }
        if (tray._notification && tray._banner) {
            tray._updateNotificationTimeout(0);
            tray._hideNotification(false);
        }
    }

    _disconnectNotificationSignals() {
        for (const record of this._notificationSignals ?? []) {
            if (record.destroyed) continue;
            for (const id of record.ids) record.object.disconnect(id);
        }
        this._notificationSignals = [];
    }

    _watchNotificationObject(object, signals) {
        const record = {object, ids: [], destroyed: false};
        record.ids.push(object.connect('destroy', () => {
            record.destroyed = true;
            this._scheduleNotificationsRender();
        }));
        for (const signal of signals)
            record.ids.push(object.connect(signal, () => this._scheduleNotificationsRender()));
        this._notificationSignals.push(record);
    }

    _bindNotificationSources() {
        this._disconnectNotificationSignals();
        for (const source of Main.messageTray.getSources()) {
            try {
                this._watchNotificationObject(source, ['notification-added']);
            } catch (e) {                                                  }

            for (const notification of source.notifications ?? []) {
                if (!this._notificationSeen.has(notification)) {
                    this._notificationSeen.add(notification);
                    if (this._notificationPrimed && this._settings.get_boolean('notification-events') &&
                        this._notificationSettings.get_boolean('show-banners') &&
                        !this._settings.get_strv('muted-apps').includes(source.title ?? 'Aplicación')) {
                        const policy = this._notificationPolicy(source.title ?? 'Aplicación');
                        const text = policy.private
                            ? `${source.title ?? 'Aplicación'} · Nueva notificación`
                            : String(notification.title ?? 'Nueva notificación');
                        this._toast({key: 'notification', icon: 'preferences-system-notifications-symbolic', text, priority: 40, ms: policy.duration});
                    }
                }
                try { this._watchNotificationObject(notification, ['notify::acknowledged']); }
                catch (e) {                                 }
            }
        }
        this._notificationPrimed = true;
        this._renderNotifications();
    }

    _scheduleNotificationsRender() {
        if (this._notificationRefresh) return;
        this._notificationRefresh = this._timeout(30, () => {
            this._notificationRefresh = 0;
            this._bindNotificationSources();
            return GLib.SOURCE_REMOVE;
        });
    }

    _notificationPolicy(app) {
        let policies = {};
        try { policies = JSON.parse(this._settings.get_string('notification-policies')); } catch {}
        const stored = policies && typeof policies === 'object' && Object.hasOwn(policies, app) ? policies[app] : {};
        return {private: typeof stored.private === 'boolean' ? stored.private : this._settings.get_boolean('private-previews'),
            duration: Number.isFinite(stored.duration) ? clamp(stored.duration, 1000, 8000) : this._settings.get_int('event-duration')};
    }

    _setNotificationPolicy(app, update) {
        let policies = {};
        try { policies = JSON.parse(this._settings.get_string('notification-policies')); } catch {}
        if (!policies || typeof policies !== 'object' || Array.isArray(policies)) policies = {};
        const entries = Object.entries(policies).filter(([key]) => key !== app).slice(-99);
        this._settings.set_string('notification-policies', JSON.stringify(Object.fromEntries([...entries, [app, {...this._notificationPolicy(app), ...update}]])));
        this._scheduleNotificationsRender();
    }

    _notificationEntries() {
        const entries = [];
        for (const source of Main.messageTray.getSources()) {
            for (const notification of source.notifications ?? [])
                entries.push({source, notification});
        }
        return entries.reverse();
    }

    _renderNotifications() {
        if (!this._notificationList) return;
        for (const child of this._notificationList.get_children()) child.destroy();

        const entries = this._notificationEntries();
        this._notificationClearBtn.visible = entries.length > 0;
        const tab = this._tabButtons.notifications;
        if (entries.length > 0) tab?.add_style_class_name('di-tab-unread');
        else tab?.remove_style_class_name('di-tab-unread');
        if (tab) tab.accessible_name = entries.length > 0
            ? `Notificaciones, ${entries.length} pendientes`
            : 'Notificaciones';

        if (entries.length === 0) {
            const empty = new St.BoxLayout({
                orientation: Clutter.Orientation.VERTICAL,
                style_class: 'di-notification-empty',
                width: WIDTH,
                height: 150,
                x_align: Clutter.ActorAlign.CENTER,
                y_align: Clutter.ActorAlign.CENTER,
            });
            empty.add_child(new St.Icon({
                icon_name: 'notifications-disabled-symbolic',
                icon_size: 30,
                x_align: Clutter.ActorAlign.CENTER,
            }));
            empty.add_child(this._label('No hay notificaciones', 'di-hint', {
                x_align: Clutter.ActorAlign.CENTER,
            }));
            this._notificationList.add_child(empty);
            return;
        }

        const grouped = [...entries].sort((a, b) => String(a.source.title).localeCompare(String(b.source.title)));
        let previousApp = null;
        for (const {source, notification} of grouped.slice(0, MAX_VISIBLE_NOTIFICATIONS)) {
            const appName = source.title ?? 'Aplicación';
            if (appName !== previousApp) {
                const count = entries.filter(entry => entry.source === source).length;
                this._notificationList.add_child(this._label(`${appName} · ${count}`, 'di-dashboard-caption'));
                const policy = this._notificationPolicy(appName);
                const controls = new St.BoxLayout({style_class: 'di-presets'});
                controls.add_child(this._chip(policy.private ? 'Título oculto' : 'Mostrar título', () => this._setNotificationPolicy(appName, {private: !policy.private})));
                controls.add_child(this._chip(`${policy.duration / 1000} s`, () => this._setNotificationPolicy(appName, {duration: policy.duration >= 8000 ? 2000 : policy.duration + 2000})));
                this._notificationList.add_child(controls);
                previousApp = appName;
            }
            const button = new St.Button({
                style_class: 'di-notification-row',
                reactive: true,
                can_focus: true,
                x_expand: true,
            });
            const row = new St.BoxLayout({style_class: 'di-notification-inner', width: WIDTH - 16});
            const icon = new St.Icon({
                icon_name: 'preferences-system-notifications-symbolic',
                icon_size: 24,
                y_align: Clutter.ActorAlign.CENTER,
            });
            try {
                if (source.icon) icon.gicon = source.icon;
            } catch (e) {                                 }
            row.add_child(icon);

            const texts = new St.BoxLayout({orientation: Clutter.Orientation.VERTICAL, style_class: 'di-notification-texts', x_expand: true});
            const title = String(notification.title ?? source.title ?? 'Notificación');
            const body = String(notification.body ?? '');
            const titleLabel = this._label(title, 'di-notification-title');
            titleLabel.clutter_text.set_ellipsize(Pango.EllipsizeMode.END);
            texts.add_child(titleLabel);
            if (body) {
                const bodyLabel = this._label(body, 'di-notification-body');
                bodyLabel.clutter_text.set_ellipsize(Pango.EllipsizeMode.END);
                texts.add_child(bodyLabel);
            }
            row.add_child(texts);
            button.set_child(row);
            button.accessible_name = body ? `${title}. ${body}` : title;
            button.connect('clicked', () => {
                try { notification.activate?.(); } catch (e) {                                                }
                this._closeIsland();
            });
            this._notificationList.add_child(button);
            const actions = new St.BoxLayout({orientation: Clutter.Orientation.VERTICAL, style_class: 'di-notification-actions'});
            for (const action of (notification.actions ?? []).slice(0, 3)) {
                actions.add_child(this._chip(action.label, () => {
                    try { action.activate(); } catch { this._toast({text: 'Esta acción ya no está disponible', warn: true}); }
                    this._scheduleNotificationsRender();
                }));
            }
            actions.add_child(this._iconBtn('window-close-symbolic', () => {
                notification.destroy(); this._scheduleNotificationsRender();
            }));
            const app = source.title ?? 'Aplicación';
            const muted = this._settings.get_strv('muted-apps');
            const mute = this._iconBtn(muted.includes(app) ? 'notifications-symbolic' : 'notifications-disabled-symbolic', () => {
                this._settings.set_strv('muted-apps', muted.includes(app) ? muted.filter(name => name !== app) : [...muted, app]);
                this._scheduleNotificationsRender();
            });
            mute.accessible_name = `${muted.includes(app) ? 'Activar' : 'Silenciar'} avisos de ${app}`;
            actions.add_child(mute);
            this._notificationList.add_child(actions);
        }
    }

    _clearNotifications() {
        for (const {notification} of this._notificationEntries()) {
            try { notification.destroy?.(); } catch (e) {                    }
        }
        this._scheduleNotificationsRender();
    }




    _sysRow(label) {
        const row = new St.BoxLayout({style_class: 'di-sysrow', width: WIDTH, y_align: Clutter.ActorAlign.CENTER});
        row.add_child(this._label(label, 'di-sys-label', {width: 58}));
        return row;
    }

    _buildSystemPage() {
        const page = this._newPage('system');
        page.add_style_class_name('di-page-system');

        const cpu = this._sysRow('CPU');
        this._cpuBar = this._makeBar(230, 6);
        this._cpuBar.actor.y_align = Clutter.ActorAlign.CENTER;
        this._cpuVal = this._label('—', 'di-sys-val', {width: 60});
        cpu.add_child(this._cpuBar.actor);
        cpu.add_child(this._cpuVal);
        page.add_child(cpu);

        const ram = this._sysRow('RAM');
        this._ramBar = this._makeBar(230, 6);
        this._ramBar.actor.y_align = Clutter.ActorAlign.CENTER;
        this._ramVal = this._label('—', 'di-sys-val', {width: 60});
        ram.add_child(this._ramBar.actor);
        ram.add_child(this._ramVal);
        page.add_child(ram);

        this._batRow = this._sysRow('Batería');
        this._batBar = this._makeBar(230, 6);
        this._batBar.actor.y_align = Clutter.ActorAlign.CENTER;
        this._batVal = this._label('—', 'di-sys-val', {width: 60});
        this._batRow.add_child(this._batBar.actor);
        this._batRow.add_child(this._batVal);
        page.add_child(this._batRow);
        this._batteryDetails = this._label('', 'di-hint');
        page.add_child(this._batteryDetails);

        this._brightRow = this._sysRow('Brillo');
        this._brightSlider = new Slider(0.5);
        this._brightSlider.add_style_class_name('di-slider');
        this._brightSlider.add_style_class_name('di-volume');
        this._brightSlider.set_width(230);
        this._brightSlider.connect('notify::value', () => {
            if (this._syncing) return;
            if (this._brightnessScale) this._brightnessScale.value = clamp(this._brightSlider.value);
        });
        this._brightRow.add_child(this._brightSlider);
        this._brightVal = this._label('', 'di-sys-val', {width: 60});
        this._brightRow.add_child(this._brightVal);
        this._brightRow.visible = false;
        page.add_child(this._brightRow);

        const awake = this._sysRow('Despierto');
        this._awakeChips = {};
        for (const [key, text] of [['inf', '∞'], [30, '30 min'], [60, '1 h'], [120, '2 h']]) {
            const chip = this._chip(text, () => this._toggleAwake(key));
            this._awakeChips[key] = chip;
            awake.add_child(chip);
        }
        this._awakeVal = this._label('', 'di-sys-val', {width: 80});
        awake.add_child(this._awakeVal);
        page.add_child(awake);
        this._networkVal = this._label('Red · Esperando muestra…', 'di-hint');
        this._diskVal = this._label('Disco · Consultando…', 'di-hint');
        page.add_child(this._networkVal);
        page.add_child(this._diskVal);
        this._hardwareLabel = this._label('Sensores · Consultando…', 'di-hint', {width: WIDTH});
        this._hardwareLabel.clutter_text.set_line_wrap(true);
        page.add_child(this._hardwareLabel);
        this._connections = new St.BoxLayout({orientation: Clutter.Orientation.VERTICAL, style_class: 'di-list'});
        this._wifiButton = this._chip('Wi-Fi · Consultando…', () => {
            if (this._nm) this._nm.wireless_enabled = !this._nm.wireless_enabled;
        }, 'network-wireless-symbolic');
        this._wifiButton.reactive = false;
        this._connections.add_child(this._wifiButton);
        this._vpnLabel = this._label('VPN · Consultando…', 'di-hint');
        this._connections.add_child(this._vpnLabel);
        this._bluetoothButton = this._chip('Bluetooth · Consultando…', () => {
            const adapter = this._bluetoothAdapter;
            if (!adapter) return;
            this._call('org.bluez', adapter.path, PROPS, 'Set',
                new GLib.Variant('(ssv)', ['org.bluez.Adapter1', 'Powered', new GLib.Variant('b', !adapter.powered)]),
                () => this._readBluetoothDevices());
        }, 'bluetooth-symbolic');
        this._bluetoothButton.reactive = false;
        this._connections.add_child(this._bluetoothButton);
        this._bluetoothLabel = this._label('', 'di-hint', {width: WIDTH});
        this._bluetoothLabel.clutter_text.set_line_wrap(true);
        this._connections.add_child(this._bluetoothLabel);
        page.add_child(this._connections);
        const keyboard = new St.BoxLayout({style_class: 'di-head', visible: false});
        keyboard.add_child(this._label('Brillo del teclado', 'di-sys-label', {x_expand: true}));
        for (const [method, icon] of [['StepDown', 'list-remove-symbolic'], ['StepUp', 'list-add-symbolic']])
            keyboard.add_child(this._iconBtn(icon, () => this._call('org.gnome.SettingsDaemon.Power',
                '/org/gnome/SettingsDaemon/Power', 'org.gnome.SettingsDaemon.Power.Keyboard', method, null)));
        page.add_child(keyboard);
        this._call('org.gnome.SettingsDaemon.Power', '/org/gnome/SettingsDaemon/Power', PROPS, 'Get',
            new GLib.Variant('(ss)', ['org.gnome.SettingsDaemon.Power.Keyboard', 'Brightness']), reply => {
                keyboard.visible = reply.recursiveUnpack()[0] >= 0;
            });
        const lock = this._label('', 'di-hint');
        page.add_child(lock);
        const keymap = global.stage.get_context().get_backend().get_default_seat().get_keymap();
        const updateLock = () => { lock.set_text(keymap.get_caps_lock_state() ? 'Bloqueo de mayúsculas activado' : 'Bloqueo de mayúsculas desactivado'); };
        this._connect(keymap, 'state-changed', updateLock);
        updateLock();
        Gio.File.new_for_path(GLib.get_home_dir()).query_filesystem_info_async('filesystem::size,filesystem::free',
            GLib.PRIORITY_DEFAULT, this._cancel, (file, result) => {
                try {
                    const info = file.query_filesystem_info_finish(result);
                    if (this._alive) this._diskVal.set_text(`Disco · ${GLib.format_size(info.get_attribute_uint64('filesystem::free'))} libres de ${GLib.format_size(info.get_attribute_uint64('filesystem::size'))}`);
                } catch (e) { if (this._alive) this._diskVal.set_text('Disco · No disponible'); }
            });
    }

    _syncSampler() {
        const should = this._menu?.isOpen && this._tab === 'system';
        if (should && !this._sampler) {
            this._sampleSystem();
            this._sampler = this._timeout(1500, () => { this._sampleSystem(); return GLib.SOURCE_CONTINUE; });
        } else if (!should && this._sampler) {
            this._clear(this._sampler);
            this._sampler = 0;
            this._cpuPrev = null;
            this._networkPrevious = null;
            this._hardwareProcess?.force_exit();
            this._hardwareProcess = null;
        }
    }

    _sampleSystem() {
        if (Date.now() - this._hardwareAt > 6000) this._sampleHardware();
        try {
            const stat = dec.decode(GLib.file_get_contents('/proc/stat')[1]).split('\n')[0].split(/\s+/).slice(1).map(Number);
            const idle = stat[3] + (stat[4] || 0);
            const total = stat.slice(0, 8).reduce((a, b) => a + b, 0);
            if (this._cpuPrev) {
                const dt = total - this._cpuPrev.total;
                const di = idle - this._cpuPrev.idle;
                const ratio = dt > 0 ? clamp(1 - di / dt) : 0;
                this._cpuBar.set(ratio);
                this._cpuVal.set_text(`${Math.round(ratio * 100)}%`);
            }
            this._cpuPrev = {total, idle};
        } catch (e) {            }
        try {
            const mem = dec.decode(GLib.file_get_contents('/proc/meminfo')[1]);
            const get = key => Number((mem.match(new RegExp(`${key}:\\s+(\\d+)`)) ?? [])[1] ?? 0);
            const total = get('MemTotal');
            const avail = get('MemAvailable');
            if (total > 0) {
                const ratio = clamp((total - avail) / total);
                this._ramBar.set(ratio);
                this._ramVal.set_text(`${(((total - avail) / 1048576)).toFixed(1)} GB`);
            }
        } catch (e) {            }
        this._updateAwakeUI();
        try {
            const text = dec.decode(GLib.file_get_contents('/proc/net/dev')[1]);
            let rx = 0, tx = 0;
            for (const line of text.split('\n').slice(2)) {
                const [name, counters] = line.split(':');
                if (!counters || name.trim() === 'lo') continue;
                const values = counters.trim().split(/\s+/).map(Number);
                rx += values[0]; tx += values[8];
            }
            const now = this._now();
            if (this._networkPrevious && now > this._networkPrevious.time) {
                const dt = (now - this._networkPrevious.time) / 1000;
                this._networkVal.set_text(`Red · ↓ ${GLib.format_size(Math.max(0, (rx - this._networkPrevious.rx) / dt))}/s  ↑ ${GLib.format_size(Math.max(0, (tx - this._networkPrevious.tx) / dt))}/s`);
            }
            this._networkPrevious = {rx, tx, time: now};
        } catch (e) { this._networkVal.set_text('Red · No disponible'); }
    }

    _sampleHardware() {
        if (this._hardwareProcess) return;
        this._hardwareAt = Date.now();
        let proc;
        try {
            proc = Gio.Subprocess.new(['python3', `${this.path}/hardware-metrics.py`],
                Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_SILENCE);
        } catch (error) {
            this._hardwareLabel.set_text('Sensores · No disponibles');
            return;
        }
        this._hardwareProcess = proc;
        proc.communicate_utf8_async(null, this._cancel, (process, result) => {
            try {
                const [, output] = process.communicate_utf8_finish(result);
                if (!this._alive || this._hardwareProcess !== process || !this._menu.isOpen || this._tab !== 'system') return;
                const data = JSON.parse(output);
                const gpu = data.gpu.map(item => `${item.name}: ${item.usage}%`).join(' · ') || 'GPU: uso no disponible';
                const temperatures = data.temperatures.map(item => `${item.name}: ${item.celsius} °C`).join(' · ') || 'Temperaturas no disponibles';
                this._hardwareLabel.set_text(`${gpu}\n${temperatures}`);
            } catch (error) {
                if (this._alive && this._hardwareProcess === process) this._hardwareLabel.set_text('Sensores · No disponibles');
            } finally {
                if (this._hardwareProcess === process) this._hardwareProcess = null;
            }
        });
    }


    _toggleAwake(mode) {
        const same = this._awake.mode === mode;
        this._stopAwake();
        if (same) { this._toast({icon: 'weather-clear-night-symbolic', text: 'Pantalla: modo normal'}); return; }
        this._call('org.gnome.SessionManager', '/org/gnome/SessionManager', 'org.gnome.SessionManager', 'Inhibit',
            new GLib.Variant('(susu)', ['dynamic-island', 0, 'Mantener despierto', 12]), reply => {
                const [cookie] = reply.deep_unpack();
                this._awake = {mode, end: mode === 'inf' ? 0 : Date.now() + mode * 60000, cookie};
                if (mode !== 'inf') {
                    this._awakeTimer = this._timeout(mode * 60000, () => {
                        this._awakeTimer = 0;
                        this._stopAwake();
                        this._toast({icon: 'weather-clear-night-symbolic', text: 'Se acabó el tiempo despierto'});
                        return GLib.SOURCE_REMOVE;
                    });
                }
                this._updateAwakeUI();
                this._toast({icon: 'weather-clear-symbolic', text: mode === 'inf' ? 'Pantalla siempre activa' : `Despierto ${mode} min`});
            });
    }

    _stopAwake() {
        this._clear(this._awakeTimer);
        this._awakeTimer = 0;
        if (this._awake.cookie) {
            this._call('org.gnome.SessionManager', '/org/gnome/SessionManager', 'org.gnome.SessionManager', 'Uninhibit',
                new GLib.Variant('(u)', [this._awake.cookie]));
        }
        this._awake = {mode: null, end: 0, cookie: 0};
        this._updateAwakeUI();
    }

    _updateAwakeUI() {
        this._contextTools?.syncControls();
        if (!this._awakeChips) return;
        for (const [k, chip] of Object.entries(this._awakeChips)) {
            const on = String(this._awake.mode) === String(k);
            if (on) chip.add_style_class_name('di-chip-on'); else chip.remove_style_class_name('di-chip-on');
        }
        if (!this._awake.mode) this._awakeVal.set_text('');
        else if (this._awake.mode === 'inf') this._awakeVal.set_text('activo');
        else {
            const d = new Date(this._awake.end);
            this._awakeVal.set_text(`hasta ${pad2(d.getHours())}:${pad2(d.getMinutes())}`);
        }
    }




    _setupVolume() {
        this._mixer = Volume.getMixerControl();
        this._mixerSignals = [
            this._mixer.connect('default-sink-changed', () => this._bindSink()),
            this._mixer.connect('state-changed', () => { this._bindSink(); this._syncMicrophone(); }),
            this._mixer.connect('stream-added', () => this._syncMicrophone()),
            this._mixer.connect('stream-removed', () => this._syncMicrophone()),
        ];
        this._bindSink();
    }

    _syncMicrophone() {
        if (!this._alive || !this._mixer) return;
        const applications = (this._mixer.get_source_outputs?.() ?? []).filter(stream => !stream.is_virtual && stream.get_name?.() !== 'AureaOutputMeter').map(stream => stream.get_name?.() ?? 'Aplicación');
        this._live.update('microphone', applications.length ? {
            text: `Micrófono en uso · ${[...new Set(applications)].join(', ')}`,
            icon: 'audio-input-microphone-symbolic', page: 'system', priority: 40,
        } : null);
        this._updatePill();
    }

    _bindSink() {
        if (!this._alive || !this._mixer) return;
        const sink = this._mixer.get_default_sink();
        if (sink === this._sink) { this._syncVolume(false); return; }
        if (this._sink) for (const id of this._sinkSignals) { try { this._sink.disconnect(id); } catch (e) {            } }
        this._sinkSignals = [];
        this._sink = sink;
        if (this._outputButton) this._outputButton._label.set_text(sink ? 'Cambiar salida' : 'Sin salida de audio');
        this._lastVol = null;
        if (sink) {
            this._sinkSignals.push(sink.connect('notify::volume', () => this._syncVolume(true)));
            this._sinkSignals.push(sink.connect('notify::is-muted', () => this._syncVolume(true)));
        }
        this._syncVolume(false);
    }

    _syncVolume(announce = false) {
        if (!this._alive || !this._sink || !this._mixer) return;
        const max = this._mixer.get_vol_max_norm();
        const value = clamp(this._sink.volume / max);
        const shown = this._sink.is_muted ? 0 : value;
        if (!this._volDrag) {
            this._syncing = true;
            this._volume.value = value;
            this._syncing = false;
        }
        this._updateVolIcon(shown);
        if (this._musicTools) {
            this._musicTools.setEnabled(this._muteButton, true);
            this._musicTools.setEnabled(this._volume, true, 'Volumen de salida del sistema');
        }
        if (this._muteButton) this._muteButton.accessible_name = this._sink.is_muted ? 'Activar salida de audio' : 'Silenciar salida de audio';
        const changed = this._lastVol === null || Math.abs(value - this._lastVol.v) > 0.004 || this._sink.is_muted !== this._lastVol.m;
        if (announce && changed && this._lastVol !== null && !this._menu.isOpen) {
            this._toast({icon: this._volIconName(shown), fraction: shown, text: this._sink.is_muted ? 'Silencio' : `${Math.round(value * 100)}%`, ms: 1400});
        }
        this._lastVol = {v: value, m: this._sink.is_muted};
    }

    _applyVolume(value) {
        const v = clamp(value);
        this._updateVolIcon(v);
        if (this._sink && this._mixer) {
            const max = this._mixer.get_vol_max_norm();
            this._sink.volume = Math.round(v * max);
            this._sink.push_volume();
            if (v > 0 && this._sink.is_muted) this._sink.change_is_muted(false);
        } else {
            this._musicTools.setProperty('Volume', new GLib.Variant('d', v));
        }
    }

    _volIconName(v) {
        return v <= 0.001 ? 'audio-volume-muted-symbolic'
            : v < 0.34 ? 'audio-volume-low-symbolic'
            : v < 0.67 ? 'audio-volume-medium-symbolic' : 'audio-volume-high-symbolic';
    }

    _updateVolIcon(v) { this._volIcon.icon_name = this._volIconName(v); }

    _hookOsd() {
        if (!OCULTAR_OSD_SISTEMA) return;
        const osd = Main.osdWindowManager;
        if (!osd?.show) return;
        this._osdShow = osd.show;
        const original = this._osdShow;
        osd.show = (...args) => {
            try {
                const icon = args[1];
                const names = icon?.get_names?.() ?? icon?.names ?? [];
                if (/volume/.test(names.join(' ')) && this._sink) return undefined;
                if (/brightness/.test(names.join(' ')) && this._brightnessScale) return undefined;
            } catch (e) {            }
            return original.apply(osd, args);
        };
    }




    _setupBrightness() {
        const bind = () => {
            if (this._brightnessSignal) this._brightnessScale.disconnect(this._brightnessSignal);
            this._brightnessSignal = 0;
            this._brightnessScale = Main.brightnessManager?.globalScale ?? null;
            this._brightRow.visible = !!this._brightnessScale;
            if (!this._brightnessScale) return;
            this._brightnessSignal = this._brightnessScale.connect('notify::value', () =>
                this._onBrightness(Math.round(this._brightnessScale.value * 100), true));
            this._onBrightness(Math.round(this._brightnessScale.value * 100), false);
        };
        if (Main.brightnessManager) this._connect(Main.brightnessManager, 'changed', bind);
        bind();
    }

    _onBrightness(value, announce) {
        if (typeof value !== 'number' || value < 0) { this._brightRow.visible = false; return; }
        const changed = value !== this._brightness;
        this._brightness = value;
        this._brightRow.visible = true;
        this._syncing = true;
        this._brightSlider.value = value / 100;
        this._syncing = false;
        this._brightVal.set_text(`${value}%`);
        if (announce && changed && !this._menu.isOpen)
            this._toast({icon: 'display-brightness-symbolic', fraction: value / 100, text: `${value}%`, ms: 1400});
    }




    _batteryIcon(pct, charging) {
        const level = Math.min(100, Math.max(0, Math.round(pct / 10) * 10));
        return charging ? `battery-level-${level}-charging-symbolic` : `battery-level-${level}-symbolic`;
    }

    _setupBattery() {
        this._subscribe(UPOWER, PROPS, 'PropertiesChanged', UPOWER_DEV, 'org.freedesktop.UPower.Device', () => this._readBattery(false));
        this._readBattery(true);
    }

    _readBattery(initial) {
        this._call(UPOWER, UPOWER_DEV, PROPS, 'GetAll', new GLib.Variant('(s)', ['org.freedesktop.UPower.Device']), reply => {
            const [p] = reply.recursiveUnpack();
            if (!p.IsPresent) { this._bat = null; this._batRow.visible = false; this._batteryDetails.visible = false; return; }
            const pct = Math.round(p.Percentage);
            const state = p.State;
            const prev = this._bat;
            this._bat = {pct, state};
            this._renderHome();
            this._batRow.visible = true;
            const charging = state === 1 || state === 5;
            this._batBar.set(pct / 100);
            this._batVal.set_text(`${pct}%${charging ? ' ⚡' : ''}`);
            const estimate = Number(charging ? p.TimeToFull : p.TimeToEmpty);
            this._batteryDetails.visible = estimate > 0;
            if (estimate > 0) this._batteryDetails.set_text(`${charging ? 'Hasta completar carga' : 'Autonomía estimada'} · ${Math.floor(estimate / 3600)} h ${Math.floor(estimate % 3600 / 60)} min`);
            if (initial || !prev) return;

            if (state !== prev.state) {
                if (state === 1 && prev.state !== 5) {
                    this._toast({icon: this._batteryIcon(pct, true), text: `Cargando · ${pct}%`, ms: 2400});
                } else if (state === 2 && prev.state !== 6) {
                    this._toast({icon: this._batteryIcon(pct, false), text: `Desconectado · ${pct}%`, ms: 2400});
                } else if (state === 4) {
                    this._toast({icon: 'battery-level-100-charged-symbolic', text: 'Batería completa', ms: 2400});
                }
            }
            if (state === 2) {
                if (pct <= 10 && !this._warn10) {
                    this._warn10 = this._warn20 = true;
                    this._toast({icon: 'battery-level-10-symbolic', text: `Batería crítica · ${pct}%`, warn: true, ms: 5000});
                } else if (pct <= 20 && !this._warn20) {
                    this._warn20 = true;
                    this._toast({icon: 'battery-level-20-symbolic', text: `Batería baja · ${pct}%`, warn: true, ms: 4000});
                }
            } else if (charging) {
                this._warn10 = this._warn20 = false;
            }
        });
    }




    _setupBluetooth() {
        this._readBluetoothDevices();
        this._subscribe('org.bluez', PROPS, 'PropertiesChanged', null, null, () => this._readBluetoothDevices());
        this._subscribe('org.bluez', PROPS, 'PropertiesChanged', null, 'org.bluez.Device1', (_c, _s, path, _i, _sig, params) => {
            const [, changed] = params.recursiveUnpack();
            if (!('Connected' in changed)) return;
            const connected = !!changed.Connected;
            this._call('org.bluez', path, PROPS, 'GetAll', new GLib.Variant('(s)', ['org.bluez.Device1']), reply => {
                const [d] = reply.recursiveUnpack();
                const name = d.Alias ?? d.Name ?? 'Dispositivo';
                const kind = String(d.Icon ?? '');
                let icon = 'bluetooth-active-symbolic';
                if (/headphone|headset/.test(kind)) icon = 'audio-headphones-symbolic';
                else if (/keyboard/.test(kind)) icon = 'input-keyboard-symbolic';
                else if (/mouse/.test(kind)) icon = 'input-mouse-symbolic';
                else if (/phone/.test(kind)) icon = 'phone-symbolic';
                if (!connected) icon = 'bluetooth-disabled-symbolic';
                this._toast({icon, text: connected ? `${name} conectado` : `${name} desconectado`, ms: 2800});
            });
        });
    }

    _readBluetoothDevices() {
        if (this._bluetoothReadPending) return;
        this._bluetoothReadPending = true;

        Gio.DBus.system.call('org.bluez', '/', 'org.freedesktop.DBus.ObjectManager', 'GetManagedObjects',
            null, null, Gio.DBusCallFlags.NONE, 2500, this._cancel, (bus, result) => {
                this._bluetoothReadPending = false;
                try {
                    const [objects] = bus.call_finish(result).recursiveUnpack();
                    if (!this._alive) return;
                    const devices = [];
                    this._bluetoothAdapter = null;
                    for (const [path, interfaces] of Object.entries(objects)) {
                        const adapter = interfaces['org.bluez.Adapter1'];
                        if (adapter) this._bluetoothAdapter = {path, powered: !!adapter.Powered};
                        const device = interfaces['org.bluez.Device1'];
                        if (device?.Connected) {
                            const percent = interfaces['org.bluez.Battery1']?.Percentage;
                            devices.push(`${device.Alias ?? device.Name ?? 'Dispositivo'}${typeof percent === 'number' ? ` · ${percent}%` : ''}`);
                        }
                    }
                    this._bluetoothButton.reactive = !!this._bluetoothAdapter;
                    this._bluetoothButton._label.set_text(this._bluetoothAdapter ?
                        `Bluetooth · ${this._bluetoothAdapter.powered ? 'Activado' : 'Desactivado'}` : 'Bluetooth · Sin adaptador');
                    this._bluetoothLabel.set_text(devices.join('\n') || 'Sin dispositivos conectados');
                } catch (error) {
                    if (this._alive) this._bluetoothButton._label.set_text('Bluetooth · No disponible');
                }
            });
    }

    _setupNetwork() {
        const cancel = this._cancel;
        import('gi://NM').then(async ({default: NM}) => {
            const client = await NM.Client.new_async(cancel);
            if (!this._alive || cancel.is_cancelled()) return;
            this._nm = client;
            const update = () => {
                const active = client.get_active_connections();
                const names = active.filter(connection => !connection.get_vpn()).map(connection => connection.get_id());
                this._wifiButton._label.set_text(`Wi-Fi · ${client.wireless_enabled ? 'Activado' : 'Desactivado'}`);
                this._wifiButton.reactive = client.wireless_hardware_enabled;
                this._wifiButton.opacity = client.wireless_hardware_enabled ? 255 : 90;
                this._vpnLabel.set_text(`Red: ${names.join(', ') || 'Sin conexión'}\nVPN: ${active.filter(connection => connection.get_vpn()).map(connection => connection.get_id()).join(', ') || 'Desconectada'}`);
                this._vpnLabel.clutter_text.set_line_wrap(true);
                this._vpnLabel.width = WIDTH;
            };
            for (const signal of ['notify::wireless-enabled', 'notify::active-connections', 'notify::wireless-hardware-enabled'])
                this._connect(client, signal, update);
            update();
        }).catch(error => {
            if (this._alive && !cancel.is_cancelled()) {
                this._wifiButton._label.set_text('Wi-Fi · No disponible');
                this._vpnLabel.set_text('NetworkManager no disponible');
            }
        });
    }




    _now() { return GLib.get_monotonic_time() / 1000; }
    _timerLeft() { return this._tm.running ? Math.max(0, this._tm.endAt - this._now()) : this._tm.left; }
    _swElapsed() { return this._tm.swRunning ? this._tm.sw + (this._now() - this._tm.swStart) : this._tm.sw; }

    _buildClockPage() {
        const page = this._newPage('clock');
        const modes = new St.BoxLayout({style_class: 'di-modes', width: WIDTH});
        this._modeTimer = this._chip('Temporizador', () => this._setClockMode('timer'), 'alarm-symbolic');
        this._modeSw = this._chip('Cronómetro', () => this._setClockMode('sw'), 'preferences-system-time-symbolic');
        modes.add_child(this._modeTimer);
        modes.add_child(this._modeSw);
        modes.add_child(this._chip('Pomodoro', () => {
            this._tm.mode = 'timer';
            this._tm.running = false;
            this._tm.started = false;
            this._pomodoro = 'work';
            this._tm.left = this._tm.total = this._settings.get_int('focus-minutes') * 60000;
            this._clockToggle();
        }, 'focus-windows-symbolic'));
        page.add_child(modes);

        this._clockBig = new St.Label({text: '00:00', style_class: 'di-clock-big', x_align: Clutter.ActorAlign.CENTER, x_expand: true});
        page.add_child(this._clockBig);

        this._presets = new St.BoxLayout({style_class: 'di-presets', x_align: Clutter.ActorAlign.CENTER, x_expand: true});
        this._renderTimerPresets();
        page.add_child(this._presets);
        const duration = new St.Entry({style_class: 'di-search', hint_text: 'Minutos exactos · Enter', can_focus: true});
        duration.clutter_text.connect('activate', () => {
            const minutes = Number(duration.text);
            if (!Number.isFinite(minutes) || minutes < 1 || minutes > 1440) {
                this._toast({text: 'Usa entre 1 y 1440 minutos', icon: 'alarm-symbolic', warn: true}); return;
            }
            this._clockReset();
            this._tm.mode = 'timer';
            this._timerAdd(minutes);
            this._clockToggle();
        });
        page.add_child(duration);
        const adjust = new Slider(24 / 119);
        adjust.accessible_name = 'Duración: de 1 a 120 minutos';
        const adjustLabel = this._label('Arrastra para ajustar: 25 min', 'di-hint');
        adjust.connect('notify::value', () => { adjustLabel.text = `Duración: ${1 + Math.round(adjust.value * 119)} min`; });
        const applyDuration = () => {
            this._clockReset();
            this._tm.mode = 'timer';
            this._timerAdd(1 + Math.round(adjust.value * 119));
        };
        adjust.connect('drag-end', applyDuration);
        adjust.connect('key-release-event', () => { applyDuration(); return Clutter.EVENT_PROPAGATE; });
        page.add_child(adjustLabel);
        page.add_child(adjust);

        const ctl = new St.BoxLayout({style_class: 'di-clock-ctl', x_align: Clutter.ActorAlign.CENTER, x_expand: true});
        this._clockPlay = new St.Icon({icon_name: 'media-playback-start-symbolic', icon_size: 22});
        const play = new St.Button({style_class: 'di-clock-btn di-clock-main', reactive: true, can_focus: true});
        play.set_child(this._clockPlay);
        play.connect('clicked', () => this._clockToggle());
        ctl.add_child(play);
        ctl.add_child(this._iconBtn('view-refresh-symbolic', () => this._clockReset(), 'di-clock-btn', 18));
        page.add_child(ctl);
        const alarm = new St.Entry({style_class: 'di-search', hint_text: 'Alarma HH:MM · Enter para activar', can_focus: true});
        alarm.clutter_text.connect('activate', () => {
            const match = /^(\d{1,2}):(\d{2})$/.exec(alarm.get_text().trim());
            if (!match || Number(match[1]) > 23 || Number(match[2]) > 59) {
                this._toast({icon: 'alarm-symbolic', text: 'Usa una hora válida: HH:MM', warn: true});
                return;
            }
            const next = new Date();
            next.setHours(Number(match[1]), Number(match[2]), 0, 0);
            if (next.getTime() <= Date.now()) next.setDate(next.getDate() + 1);
            this._tm.mode = 'timer';
            this._tm.running = false;
            this._pomodoro = null;
            this._tm.left = this._tm.total = next.getTime() - Date.now();
            this._clockToggle();
        });
        page.add_child(alarm);
        this._worldClock = this._label('', 'di-hint', {width: WIDTH});
        this._worldClock.clutter_text.set_line_wrap(true);
        page.add_child(this._worldClock);
    }

    _renderTimerPresets() {
        if (!this._presets) return;
        this._presets.destroy_all_children();
        const values = this._settings.get_value('timer-presets').deepUnpack().filter(value => value >= 1 && value <= 1440).slice(0, 4);
        for (const minutes of values) this._presets.add_child(this._chip(`+${minutes} min`, () => this._timerAdd(minutes)));
    }

    _setClockMode(mode) {
        this._tm.mode = mode;
        this._renderClock();
    }

    _timerAdd(min) {
        const t = this._tm;
        t.left = this._timerLeft() + min * 60000;
        t.total = Math.max(t.total, t.left);
        if (t.running) t.endAt = this._now() + t.left;
        this._renderClock();
        this._saveTimer();
    }

    _clockToggle() {
        const t = this._tm;
        if (t.mode === 'timer') {
            if (t.running) {
                t.left = this._timerLeft();
                t.running = false;
            } else if (t.left > 0) {
                t.running = true;
                t.started = true;
                t.endAt = this._now() + t.left;
            } else {
                this._toast({icon: 'alarm-symbolic', text: 'Elige un tiempo (+1, +5…)', ms: 1800});
                return;
            }
        } else if (t.swRunning) {
            t.sw = this._swElapsed();
            t.swRunning = false;
        } else {
            t.swRunning = true;
            t.swStarted = true;
            t.swStart = this._now();
        }
        this._clockTickStart();
        this._renderClock();
        this._saveTimer();
    }

    _clockReset() {
        const t = this._tm;
        if (t.mode === 'timer') { t.running = false; t.started = false; t.left = 0; t.total = 0; }
        else { t.swRunning = false; t.swStarted = false; t.sw = 0; }
        this._renderClock();
        this._pomodoro = null;
        this._saveTimer();
    }

    _clockTickStart() {
        if (this._clockTimer) return;
        this._clockTimer = this._timeout(1000, () => {
            const t = this._tm;
            if (t.running && this._timerLeft() <= 0) this._timerFinished();
            this._renderClock();
            if (t.running || t.swRunning) return GLib.SOURCE_CONTINUE;
            this._clockTimer = 0;
            return GLib.SOURCE_REMOVE;
        });
    }

    _timerFinished() {
        this._ornaments.celebrate();
        const t = this._tm;
        t.running = false;
        t.started = false;
        t.left = 0;
        t.total = 0;
        if (this._pomodoro) {
            this._pomodoro = this._pomodoro === 'work' ? 'break' : 'work';
            t.left = t.total = this._settings.get_int(this._pomodoro === 'break' ? 'break-minutes' : 'focus-minutes') * 60000;
        }
        this._saveTimer();
        this._toast({icon: 'alarm-symbolic', text: 'Tiempo terminado', warn: true, ms: 6000});
        Main.notify('Temporizador', this._pomodoro ?
            `${this._pomodoro === 'break' ? 'Descanso' : 'Concentración'} preparado. Pulsa reproducir para continuar.` : '¡Se acabó el tiempo!');
        if (!this._settings.get_boolean('timer-sound')) return;
        try { global.display.get_sound_player().play_from_theme('alarm-clock-elapsed', 'Temporizador', null); } catch (e) {
            try { global.display.get_sound_player().play_from_theme('complete', 'Temporizador', null); } catch (e2) {            }
        }
    }

    _renderClock() {
        const t = this._tm;
        const timer = t.mode === 'timer';
        if (this._worldClock && this._menu?.isOpen && this._tab === 'clock')
            this._worldClock.set_text([['Lima', 'America/Lima'], ['Madrid', 'Europe/Madrid'],
                ['Nueva York', 'America/New_York'], ['Tokio', 'Asia/Tokyo']].map(([city, timeZone]) =>
                `${city} ${new Date().toLocaleTimeString('es', {timeZone, hour: '2-digit', minute: '2-digit'})}`).join(' · '));
        if (this._clockBig) {
            this._clockBig.set_text(timer ? formatClock(this._timerLeft()) : formatClock(this._swElapsed(), true));
            this._presets.visible = timer;
            const running = timer ? t.running : t.swRunning;
            this._clockPlay.icon_name = running ? 'media-playback-pause-symbolic' : 'media-playback-start-symbolic';
            if (timer) { this._modeTimer.add_style_class_name('di-chip-on'); this._modeSw.remove_style_class_name('di-chip-on'); }
            else { this._modeSw.add_style_class_name('di-chip-on'); this._modeTimer.remove_style_class_name('di-chip-on'); }
        }

        let text = null;
        if (t.running || t.started) text = formatClock(this._timerLeft());
        else if (t.swRunning || t.swStarted) text = formatClock(this._swElapsed(), true);
        const visible = !!text;
        if (text) this._pillTimer.set_text(text);
        this._clockLabelVisible = visible;
        this._updatePill();
        if (this._menu?.isOpen && this._tab === 'home') this._renderHome();
    }

    _saveTimer() {
        if (!this._dataDir || !this._tm) return;
        const left = this._timerLeft();
        const data = {...this._tm, left, wallEnd: this._tm.running ? Date.now() + left : 0,
            sw: this._swElapsed(), swRunning: false, pomodoro: this._pomodoro};
        try {
            Gio.File.new_for_path(`${this._dataDir}/timer.json`).replace_contents(enc.encode(JSON.stringify(data)),
                null, false, Gio.FileCreateFlags.PRIVATE | Gio.FileCreateFlags.REPLACE_DESTINATION, null);
        } catch (e) { console.debug(`Dynamic Island: guardar temporizador: ${e.message}`); }
    }

    _restoreTimer() {
        try {
            const data = JSON.parse(dec.decode(GLib.file_get_contents(`${this._dataDir}/timer.json`)[1]));
            if (!Number.isFinite(data.left) || !Number.isFinite(data.total)) return;
            this._tm = {...this._tm, ...data, mode: data.mode === 'sw' ? 'sw' : 'timer', swRunning: false};
            this._pomodoro = ['work', 'break'].includes(data.pomodoro) ? data.pomodoro : null;
            if (data.running && Number.isFinite(data.wallEnd)) {
                this._tm.left = Math.max(0, data.wallEnd - Date.now());
                this._tm.endAt = this._now() + this._tm.left;
                if (!this._tm.left) this._timerFinished();
                else this._clockTickStart();
            }
            this._renderClock();
        } catch (e) {                                         }
    }




    _buildTodayPage() {
        const page = this._newPage('today');
        page.add_style_class_name('di-page-today');
        this._calendarDate = new Date();
        this._calendarDate.setDate(1);
        this._calendarWeek = false;
        const calendarHead = new St.BoxLayout({style_class: 'di-head'});
        this._calendarTitle = this._label('', 'di-h', {x_expand: true});
        calendarHead.add_child(this._calendarTitle);
        calendarHead.add_child(this._chip('Mes / semana', () => {
            this._calendarWeek = !this._calendarWeek;
            this._renderCalendarGrid();
        }));
        for (const [delta, icon] of [[-1, 'go-previous-symbolic'], [1, 'go-next-symbolic']])
            calendarHead.add_child(this._iconBtn(icon, () => {
                this._calendarDate.setMonth(this._calendarDate.getMonth() + delta);
                this._renderCalendarGrid();
            }));
        page.add_child(calendarHead);
        this._calendarGrid = new St.BoxLayout({orientation: Clutter.Orientation.VERTICAL, style_class: 'di-calendar'});
        page.add_child(this._calendarGrid);
        this._renderCalendarGrid();

        const top = new St.BoxLayout({style_class: 'di-today-top', width: WIDTH});
        const left = new St.BoxLayout({style_class: 'di-today-left', width: 170, y_align: Clutter.ActorAlign.CENTER});
        this._todayDay = new St.Label({text: '1', style_class: 'di-today-day', y_align: Clutter.ActorAlign.CENTER});
        const dateCol = new St.BoxLayout({orientation: Clutter.Orientation.VERTICAL, y_align: Clutter.ActorAlign.CENTER});
        this._todayWeek = new St.Label({text: '', style_class: 'di-today-week'});
        this._todayMonth = new St.Label({text: '', style_class: 'di-today-month'});
        dateCol.add_child(this._todayWeek);
        dateCol.add_child(this._todayMonth);
        left.add_child(this._todayDay);
        left.add_child(dateCol);
        top.add_child(left);
        top.add_child(new St.Widget({x_expand: true}));

        const right = new St.BoxLayout({style_class: 'di-today-right', y_align: Clutter.ActorAlign.CENTER});
        this._wIcon = new St.Icon({icon_name: 'weather-overcast-symbolic', icon_size: 34, y_align: Clutter.ActorAlign.CENTER});
        const wCol = new St.BoxLayout({orientation: Clutter.Orientation.VERTICAL, y_align: Clutter.ActorAlign.CENTER});
        this._wTemp = new St.Label({text: '--°', style_class: 'di-w-temp'});
        this._wDesc = new St.Label({text: 'Cargando clima…', style_class: 'di-w-desc', width: 120});
        this._wDesc.clutter_text.set_ellipsize(Pango.EllipsizeMode.END);
        wCol.add_child(this._wTemp);
        wCol.add_child(this._wDesc);
        right.add_child(this._wIcon);
        right.add_child(wCol);
        top.add_child(right);
        page.add_child(top);

        const extra = new St.BoxLayout({style_class: 'di-w-extra', width: WIDTH});
        this._wExtra = new St.Label({text: '', style_class: 'di-w-desc', y_align: Clutter.ActorAlign.CENTER});
        this._aqiChip = new St.Label({text: '', style_class: 'di-aqi', y_align: Clutter.ActorAlign.CENTER, visible: false});
        extra.add_child(this._wExtra);
        extra.add_child(new St.Widget({x_expand: true}));
        extra.add_child(this._aqiChip);
        page.add_child(extra);

        this._eventsBox = new St.BoxLayout({orientation: Clutter.Orientation.VERTICAL, style_class: 'di-events', width: WIDTH});
        page.add_child(this._eventsBox);
    }

    _renderToday() {
        const d = new Date();
        this._todayDay.set_text(String(d.getDate()));
        this._todayWeek.set_text(cap(d.toLocaleDateString('es', {weekday: 'long'})));
        this._todayMonth.set_text(cap(d.toLocaleDateString('es', {month: 'long', year: 'numeric'})));
        this._renderWeather();
        this._renderEvents();
    }

    _renderCalendarGrid() {
        this._calendarGrid.destroy_all_children();
        const date = this._calendarDate;
        const today = new Date();
        this._calendarTitle.set_text(cap(date.toLocaleDateString('es', {month: 'long', year: 'numeric'})));
        const header = new St.BoxLayout({style_class: 'di-calendar-row'});
        for (const day of ['L', 'M', 'X', 'J', 'V', 'S', 'D'])
            header.add_child(new St.Bin({width: 48, height: 20,
                child: this._label(day, 'di-calendar-weekday', {x_align: Clutter.ActorAlign.CENTER})}));
        this._calendarGrid.add_child(header);
        const offset = (date.getDay() + 6) % 7;
        const days = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
        const currentMonth = today.getMonth() === date.getMonth() && today.getFullYear() === date.getFullYear();
        const selectedWeek = currentMonth ? Math.floor((today.getDate() + offset - 1) / 7) : 0;
        for (let week = 0; week < Math.ceil((days + offset) / 7); week++) {
            if (this._calendarWeek && week !== selectedWeek) continue;
            const row = new St.BoxLayout({style_class: 'di-calendar-row'});
            for (let col = 0; col < 7; col++) {
                const n = week * 7 + col - offset + 1;
                const cell = new St.Bin({width: 48, height: 28});
                if (n >= 1 && n <= days) {
                    const day = new St.Button({label: String(n), width: 28, height: 28,
                        style_class: `di-calendar-day${currentMonth && n === today.getDate() ? ' di-calendar-today' : ''}`,
                        can_focus: true, x_align: Clutter.ActorAlign.CENTER,
                        accessible_name: `${n} ${this._calendarTitle.get_text()}`});
                    day.connect('clicked', () => {
                        this._selectedDate = new Date(date.getFullYear(), date.getMonth(), n);
                        this._requestEvents();
                    });
                    cell.set_child(day);
                }
                row.add_child(cell);
            }
            this._calendarGrid.add_child(row);
        }
        this._resizeIsland();
    }

    _setupCalendar() {
        const epoch = this._epoch;
        import('resource:///org/gnome/shell/ui/calendar.js').then(mod => {
            if (!this._alive || epoch !== this._epoch) return;
            if (!mod.DBusEventSource) throw new Error('DBusEventSource no disponible');
            this._events = new mod.DBusEventSource();
            this._eventsSig = this._events.connect('changed', () => this._renderEvents());
            this._requestEvents();
        }).catch(e => {
            if (!this._alive || epoch !== this._epoch) return;
            console.debug(`Dynamic Island: eventos del calendario no disponibles: ${e.message}`);
            this._events = null;
            this._renderEvents();
        });
    }

    _eventRange() {
        const begin = this._selectedDate ? new Date(this._selectedDate) : new Date();
        begin.setHours(0, 0, 0, 0);
        const end = new Date(begin.getTime() + 14 * 86400000);
        return [begin, end];
    }

    _requestEvents() {
        if (!this._events) return;
        try {
            const [begin, end] = this._eventRange();
            this._events.requestRange(begin, end);
            this._renderEvents();
        } catch (e) { console.debug(`Dynamic Island: requestRange: ${e.message}`); }
    }

    _renderEvents() {
        this._eventsBox?.destroy_all_children();
        if (!this._events) {
            if (!this._eventsBox) return;
            this._eventsBox.add_child(this._label('Eventos no disponibles (abre Calendario de GNOME y agrega una cuenta).', 'di-hint', {width: WIDTH}));
            return;
        }
        let list = [];
        try {
            const [begin, end] = this._eventRange();
            const now = this._selectedDate ?? new Date();
            list = this._events.getEvents(begin, end)
                .filter(ev => (ev.end ?? ev.date) >= now)
                .sort((a, b) => a.date - b.date)
                .slice(0, 3);
        } catch (e) { list = []; }
        this._nextMeeting = list.find(event => !event.allDay && event.date >= new Date()) ?? null;
        this._renderHome();
        if (!this._eventsBox) return;
        if (!list.length) {
            this._eventsBox.add_child(this._label('Sin eventos en el intervalo seleccionado', 'di-hint'));
            return;
        }
        const today = new Date().toDateString();
        for (const ev of list) {
            const row = new St.BoxLayout({style_class: 'di-event'});
            const when = ev.allDay ? 'Todo el día'
                : `${ev.date.toDateString() === today ? '' : `${ev.date.toLocaleDateString('es', {day: 'numeric', month: 'short'})} `}${ev.date.toLocaleTimeString('es', {hour: '2-digit', minute: '2-digit'})}`;
            row.add_child(this._label(when, 'di-event-time', {width: 96}));
            const title = this._label(String(ev.summary ?? ''), 'di-event-title', {width: WIDTH - 110});
            title.clutter_text.set_ellipsize(Pango.EllipsizeMode.END);
            row.add_child(title);
            this._eventsBox.add_child(row);
            const url = meetingLink(ev);
            if (url) this._eventsBox.add_child(this._chip('Unirse a la reunión', () => this._openUri(url), 'camera-web-symbolic'));
        }
    }

    _loadWeather(force) {
        if (this._weatherLoading) return;
        if (!force && this._weather && Date.now() - this._weatherAt < 10 * 60 * 1000) return;
        this._weatherLoading = true;
        const fetchAll = coords => {
            const {lat, lon} = coords;
            const wUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,is_day&hourly=temperature_2m,precipitation_probability&daily=temperature_2m_max,temperature_2m_min&forecast_days=5&timezone=auto`;
            const aUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi,pm2_5&timezone=auto`;
            this._getJson(wUrl, w => {
                if (!w?.current) { this._weatherLoading = false; return; }
                this._weather = {w: w.current, hourly: w.hourly, daily: w.daily, aqi: null, city: coords.nombre ?? ''};
                this._weatherAt = Date.now(); this._renderWeather();
                this._getJson(aUrl, a => {
                    this._weatherLoading = false;
                    this._weather.aqi = a?.current?.us_aqi ?? null;
                    this._weatherAt = Date.now();
                    this._renderWeather();
                    if (this._weather.aqi !== null && this._weather.aqi > 150 && !this._aqiAlerted) {
                        this._aqiAlerted = true;
                        this._toast({icon: 'dialog-warning-symbolic', text: 'Calidad del aire mala', warn: true, ms: 4000});
                    }
                });
            });
        };
        if (this._coords) { fetchAll(this._coords); return; }
        this._getJson('https://ipwho.is/', geo => {
            if (geo?.success !== false && typeof geo?.latitude === 'number')
                this._coords = {nombre: geo.city ?? '', lat: geo.latitude, lon: geo.longitude};
            else
                this._coords = CIUDAD_RESPALDO;
            fetchAll(this._coords);
        });
    }

    _renderWeather() {
        this._workspace?.renderWeather(); this._workspace?.refresh();
        if (!this._wTemp) return;
        const data = this._weather;
        if (!data) return;
        const c = data.w;
        const [icon, desc] = weatherInfo(c.weather_code, c.is_day === 1);
        this._wIcon.icon_name = icon;
        this._wTemp.set_text(`${Math.round(c.temperature_2m)}°`);
        this._wDesc.set_text(data.city ? `${desc} · ${data.city}` : desc);
        this._wExtra.set_text(`Sensación ${Math.round(c.apparent_temperature)}° · Humedad ${Math.round(c.relative_humidity_2m)}% · Viento ${Math.round(c.wind_speed_10m)} km/h`);
        const [aqiText, aqiClass] = aqiInfo(data.aqi);
        this._aqiChip.visible = !!aqiText;
        this._aqiChip.set_text(aqiText);
        this._aqiChip.style_class = `di-aqi ${aqiClass}`;
    }




    _buildMirrorPage() {
        const page = this._newPage('mirror');
        page.add_style_class_name('di-page-mirror');
        page.add_child(new St.Icon({icon_name: 'camera-web-symbolic', icon_size: 40, style_class: 'di-mirror-icon', x_align: Clutter.ActorAlign.CENTER, x_expand: true}));
        const hint = this._label('Abre una vista auxiliar de tu cámara. Solo se activa al pulsar el botón y se apaga al cerrar su ventana o salir de ella.', 'di-hint', {x_expand: true});
        hint.clutter_text.set_line_wrap(true);
        hint.width = WIDTH - 20;
        page.add_child(hint);
        this._mirrorBtn = this._chip('Abrir espejo', () => this._toggleMirror(), 'camera-web-symbolic');
        this._mirrorBtn.x_align = Clutter.ActorAlign.CENTER;
        this._mirrorBtn.x_expand = true;
        page.add_child(this._mirrorBtn);
    }

    _renderMirror() {
        if (this._mirrorBtn) this._mirrorBtn._label.set_text(this._mirror ? 'Cerrar espejo' : 'Abrir espejo');
    }

    _toggleMirror() {
        if (this._mirror) { this._closeMirror(); return; }
        if (!GLib.find_program_in_path('gst-launch-1.0')) {
            this._toast({icon: 'dialog-warning-symbolic', text: 'Falta gst-launch-1.0 (GStreamer)', warn: true, ms: 3000});
            return;
        }
        const device = this._settings.get_string('camera-device');
        if (!/^\/dev\/video\d+$/.test(device) || !GLib.file_test(device, GLib.FileTest.EXISTS)) {
            this._toast({icon: 'dialog-warning-symbolic', text: 'No se encontró la cámara', warn: true, ms: 3000});
            return;
        }
        const argv = ['gst-launch-1.0', '-q', 'v4l2src', `device=${device}`, '!', 'videoconvert', '!', 'videoflip', 'method=horizontal-flip',
            '!', 'videoscale', '!', 'video/x-raw,width=320,height=240', '!', 'autovideosink'];
        let proc;
        try {
            proc = Gio.Subprocess.new(argv, Gio.SubprocessFlags.STDOUT_SILENCE | Gio.SubprocessFlags.STDERR_SILENCE);
        } catch (e) {
            this._toast({icon: 'dialog-warning-symbolic', text: 'No se pudo abrir la cámara', warn: true});
            return;
        }
        const state = {proc, pid: Number(proc.get_identifier()), win: null, startedAt: Date.now(), wasInside: false, outsideSince: 0, sig: 0, poll: 0};
        this._mirror = state;
        proc.wait_async(null, () => { if (this._mirror === state) this._closeMirror(); });
        state.sig = global.display.connect('window-created', (_d, win) => {
            if (win.get_pid() !== state.pid) return;
            state.win = win;
            const place = () => {
                try {
                    const mon = this._monitor();
                    const r = win.get_frame_rect();
                    win.make_above();
                    win.stick();
                    win.move_frame(true, Math.round(mon.x + (mon.width - r.width) / 2), mon.y + Main.panel.height + 14);
                } catch (e) {            }
            };
            this._timeout(250, () => { place(); return GLib.SOURCE_REMOVE; });
            this._timeout(800, () => { place(); return GLib.SOURCE_REMOVE; });
        });
        state.poll = this._timeout(300, () => {
            if (this._mirror !== state) return GLib.SOURCE_REMOVE;
            const now = Date.now();
            if (!state.win) return now - state.startedAt > 8000 ? (this._closeMirror(), GLib.SOURCE_REMOVE) : GLib.SOURCE_CONTINUE;
            const [px, py] = global.get_pointer();
            const r = state.win.get_frame_rect();
            const inside = px >= r.x && px <= r.x + r.width && py >= r.y && py <= r.y + r.height;
            if (inside) { state.wasInside = true; state.outsideSince = 0; }
            else {
                state.outsideSince ||= now;
                const grace = state.wasInside ? 900 : 6000;
                if (now - state.outsideSince > grace) { this._closeMirror(); return GLib.SOURCE_REMOVE; }
            }
            return GLib.SOURCE_CONTINUE;
        });
        this._menu.close();
        this._renderMirror();
    }

    _closeMirror() {
        const m = this._mirror;
        if (!m) return;
        this._mirror = null;
        this._clear(m.poll);
        if (m.sig) { try { global.display.disconnect(m.sig); } catch (e) {            } }
        try { m.proc.force_exit(); } catch (e) {            }
        this._renderMirror();
    }




    _discover() {
        const generation = ++this._generation;
        this._request(DBUS, DBUS, 'ListNames', null, reply => {
            if (generation !== this._generation) return;
            const [names] = reply.deep_unpack();
            const players = names.filter(name => name.startsWith(PREFIX));
            this._players = players;
            const preferred = this._settings.get_string('preferred-player');
            if (!players.length) { this._usePlayer(null); return; }
            if (players.includes(preferred)) { this._usePlayer(preferred); return; }
            let remaining = players.length;
            const playing = [];
            for (const candidate of players) {
                this._bus.call(candidate, PATH, PROPS, 'Get', new GLib.Variant('(ss)', [PLAYER, 'PlaybackStatus']),
                    null, Gio.DBusCallFlags.NONE, 2000, this._cancel, (bus, result) => {
                        try {
                            const [state] = bus.call_finish(result).recursiveUnpack();
                            if (state === 'Playing') playing.push(candidate);
                        } catch (e) {                                                               }
                        if (--remaining || !this._alive || generation !== this._generation) return;
                        this._usePlayer(playing.includes(this._name) ? this._name : playing[0] ??
                            (players.includes(this._name) ? this._name : players[0]));
                    });
            }
        });
    }

    _usePlayer(next) {
            if (next !== this._name) {
                if (this._sub) this._bus.signal_unsubscribe(this._sub);
                this._sub = 0;
                this._name = next;
                this._requestGeneration++;
                this._syncMediaCapabilities({});
                this._musicTools.update({});
                this._length = 0;
                this._position = 0;
                this._status = 'Stopped';
                this._artUrl = null;
                this._showArt(null);
                this._updateProgress();
                this._updatePill();
                if (next) this._sub = this._bus.signal_subscribe(next, PROPS, 'PropertiesChanged', PATH, PLAYER,
                    Gio.DBusSignalFlags.NONE, () => this._refresh());
            }
            const preferred = this._settings.get_string('preferred-player');
            this._playerSelector._label.set_text(preferred ? this._playerName(preferred) : 'Automático');
            this._refresh();
    }

    _syncMediaCapabilities(props) {
        const control = !!this._name && props.CanControl === true;
        const set = (button, enabled, label) => {
            button.reactive = enabled;
            button.can_focus = enabled;
            button.opacity = enabled ? 255 : 80;
            button.accessible_name = label;
        };
        set(this._playBtn.button, control && (this._status === 'Playing' ? props.CanPause === true : props.CanPlay === true), 'Reproducir o pausar');
        set(this._previousBtn.button, control && props.CanGoPrevious === true, 'Canción anterior');
        set(this._nextBtn.button, control && props.CanGoNext === true, 'Canción siguiente');
        set(this._shuffleBtn.button, control && 'Shuffle' in props, 'Reproducción aleatoria');
        set(this._loopBtn.button, control && 'LoopStatus' in props, 'Repetición');
        this._canSeek = control && props.CanSeek === true;
        set(this._seek, this._canSeek && this._length > 0, 'Posición de reproducción');
    }

    _playerName(name) {
        const parts = name.slice(PREFIX.length).split('.')
            .filter(p => !['com', 'org', 'io', 'net', 'app', 'desktop'].includes(p.toLowerCase()) && !/^instance\d+$/i.test(p));
        return parts[0] ?? name.slice(PREFIX.length);
    }

    _refresh() {
        const name = this._name;
        if (!name) {
            this._title.set_text('Sin música');
            this._artist.set_text('Abre un reproductor');
            this._playerLabel.set_text('');
            this._play.icon_name = 'media-playback-start-symbolic';
            this._status = 'Stopped';
            this._showArt(null);
            this._artUrl = null;
            this._length = 0;
            this._position = 0;
            this._updateProgress();
            this._updatePill();
            this._renderHome();
            this._shuffle = false;
            this._loop = 'None';
            this._updateToggles();
            this._syncMediaCapabilities({});
            this._musicTools.update({});
            return;
        }
        const generation = ++this._requestGeneration;
        this._request(name, PROPS, 'GetAll', new GLib.Variant('(s)', [PLAYER]), reply => {
            if (name !== this._name || generation !== this._requestGeneration) return;
            const [props] = reply.recursiveUnpack();
            const metadata = props.Metadata ?? {};
            const oldTitle = this._title.get_text();
            this._status = props.PlaybackStatus ?? 'Stopped';
            this._length = Math.max(0, Number(metadata['mpris:length'] ?? 0) / 1000000);
            const title = String(metadata['xesam:title'] || 'Sin título');
            this._title.set_text(title);
            const artists = metadata['xesam:artist'] ?? [];
            this._artist.set_text(Array.isArray(artists)
                ? (artists.join(', ') || 'Artista desconocido') : String(artists));
            this._playerLabel.set_text(this._playerName(name));
            this._play.icon_name = this._status === 'Playing'
                ? 'media-playback-pause-symbolic' : 'media-playback-start-symbolic';
            this._shuffle = !!props.Shuffle;
            this._loop = props.LoopStatus ?? 'None';
            this._updateToggles();
            this._setMarqueeText(title);
            this._updatePill();
            this._setArt(String(metadata['mpris:artUrl'] ?? ''));
            this._readPosition();
            this._syncMediaCapabilities(props);
            this._musicTools.update(props);
            this._renderHome();
            if (oldTitle !== title && this._status === 'Playing')
                this._toast({key: 'music', icon: 'audio-x-generic-symbolic', text: title, priority: 10});
        });
    }

    _readPosition() {
        if (!this._name) return;
        const name = this._name;
        const generation = this._requestGeneration;
        this._request(name, PROPS, 'Get', new GLib.Variant('(ss)', [PLAYER, 'Position']), reply => {
            if (name !== this._name || generation !== this._requestGeneration) return;
            const [position] = reply.recursiveUnpack();
            this._position = Math.max(0, Number(position) / 1000000);
            this._updateProgress();
        });
    }

    _setArt(url) {
        if (url === this._artUrl) return;
        this._artUrl = url;
        if (!url) { this._showArt(null); return; }
        try {
            if (url.startsWith('file://')) {
                this._showArt(GLib.filename_from_uri(url)[0]);
            } else if (url.startsWith('http://') || url.startsWith('https://')) {
                const dir = GLib.build_filenamev([GLib.get_user_cache_dir(), 'dynamic-island-art']);
                const key = GLib.compute_checksum_for_string(GLib.ChecksumType.SHA1, url, -1);
                const path = GLib.build_filenamev([dir, key]);
                if (GLib.file_test(path, GLib.FileTest.EXISTS)) { this._showArt(path); return; }
                this._showArt(null);
                const msg = Soup.Message.new('GET', url);
                if (!msg) return;
                this._http ??= new Soup.Session({timeout: 10});
                const cancel = this._cancel;
            this._http.send_and_read_async(msg, GLib.PRIORITY_DEFAULT, cancel, (session, res) => {
                    if (!this._alive) return;
                    try {
                        const bytes = session.send_and_read_finish(res);
                        if (msg.get_status() !== Soup.Status.OK) return;
                        GLib.mkdir_with_parents(dir, 0o755);
                        GLib.file_set_contents(path, bytes.get_data());
                        if (this._artUrl === url) this._showArt(path);
                    } catch (e) {
                        console.debug(`Dynamic Island: carátula: ${e.message}`);
                    }
                });
            } else {
                this._showArt(null);
            }
        } catch (e) {
            this._showArt(null);
        }
    }

    _showArt(path) {
        if (this._compactArt) this._compactArt.gicon = path ? Gio.FileIcon.new(Gio.File.new_for_path(path)) : Gio.ThemedIcon.new('audio-x-generic-symbolic');
        this._artPath = path;
        if (this._largeArt) this._largeArt.set_style(path ?
            `background-image: url("${GLib.filename_to_uri(path, null)}"); background-size: contain;` : '');
        this._musicSurface?.set_style('');
        if (path) {
            this._art.set_child(null);
            this._art.set_style(`background-image: url("${GLib.filename_to_uri(path, null)}"); background-size: cover;`);
            const cancel = this._cancel;
            Gio.File.new_for_path(path).read_async(GLib.PRIORITY_DEFAULT, cancel, (file, result) => {
                let stream;
                try { stream = file.read_finish(result); } catch (error) { return; }
                GdkPixbuf.Pixbuf.new_from_stream_at_scale_async(stream, 16, 16, false, cancel, (_source, res) => {
                    try {
                        const pixbuf = GdkPixbuf.Pixbuf.new_from_stream_finish(res);
                        if (!this._alive || cancel.is_cancelled() || this._artPath !== path || !this._settings.get_boolean('cover-accent')) return;
                        const pixels = pixbuf.get_pixels();
                        const channels = pixbuf.get_n_channels();
                        const stride = pixbuf.get_rowstride();
                        const sum = [0, 0, 0];
                        let count = 0;
                        for (let y = 0; y < pixbuf.height; y++) for (let x = 0; x < pixbuf.width; x++) {
                            const index = y * stride + x * channels;
                            for (let channel = 0; channel < 3; channel++) sum[channel] += pixels[index + channel];
                            count++;
                        }
                        const rgb = sum.map(value => Math.round(value / count));
                        this._musicSurface.set_style(`background-gradient-direction: horizontal; background-gradient-start: rgba(${rgb.join(',')},0.24); background-gradient-end: rgba(${rgb.join(',')},0.02); border-radius: 14px;`);
                    } catch (error) {                                                          }
                    finally { stream.close(null); }
                });
            });
        } else {
            this._art.set_style('');
            this._art.set_child(this._cover);
        }
    }

    _setTimes(position) {
        this._elapsed.set_text(formatTime(position));
        this._remaining.set_text('-' + formatTime(Math.max(0, this._length - position)));
    }

    _updateProgress() {
        this._mediaExtras?.refresh();
        const ratio = this._length > 0 ? clamp(this._position / this._length) : 0;
        if (!this._seekDrag) {
            this._syncingSeek = true;
            this._seek.value = ratio;
            this._syncingSeek = false;
            this._setTimes(this._position);
        }
    }

    _seekTo(target) {
        if (!this._canSeek) return;
        const position = Math.round(clamp(target, 0, Math.max(0, this._length - 0.001)) * 1000000);
        const trackId = this._musicTools.props.Metadata?.['mpris:trackid'];
        if (typeof trackId === 'string' && GLib.Variant.is_object_path(trackId) && trackId !== '/org/mpris/MediaPlayer2/TrackList/NoTrack')
            this._musicTools.request(PLAYER, 'SetPosition', new GLib.Variant('(ox)', [trackId, position]), () => this._readPosition());
        else
            this._musicTools.request(PLAYER, 'Seek', new GLib.Variant('(x)', [position - Math.round(this._position * 1000000)]), () => this._readPosition());
    }

    _startTick() {
        if (this._tickId) return;
        this._tickId = this._timeout(1000, () => {
            if (!this._menu?.isOpen) { this._tickId = 0; return GLib.SOURCE_REMOVE; }
            if (this._tab === 'music' && this._status === 'Playing' && !this._seekDrag) this._readPosition();
            if (this._tab === 'today') this._renderToday();
            if (this._tab === 'clock') this._renderClock();
            if (this._tab === 'home') this._workspace.refresh();
            return GLib.SOURCE_CONTINUE;
        });
    }

    _stopTick() {
        this._clear(this._tickId);
        this._tickId = 0;
    }

    _updateToggles() {
        const setActive = (btn, on) => {
            if (on) btn.button.add_style_class_name('di-active');
            else btn.button.remove_style_class_name('di-active');
        };
        setActive(this._shuffleBtn, this._shuffle);
        setActive(this._loopBtn, this._loop !== 'None');
        this._loopBtn.icon.icon_name = this._loop === 'Track'
            ? 'media-playlist-repeat-song-symbolic' : 'media-playlist-repeat-symbolic';
    }

    _toggleShuffle() {
        this._musicTools.setProperty('Shuffle', new GLib.Variant('b', !this._shuffle));
    }

    _toggleLoop() {
        const next = {None: 'Playlist', Playlist: 'Track', Track: 'None'}[this._loop] ?? 'None';
        this._musicTools.setProperty('LoopStatus', new GLib.Variant('s', next));
    }

    _command(method) {
        this._musicTools.command(method);
    }
}
