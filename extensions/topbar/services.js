import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import Shell from 'gi://Shell';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import {getRfkillManager} from 'resource:///org/gnome/shell/ui/status/rfkill.js';
import {run, busCall, settingsForExtension} from './platform.js';
const clamp = (value, low = 0, high = 1) => Math.max(low, Math.min(high, value));
class Model {
    onChange(fn) {
        this._cb ??= new Set();
        this._cb.add(fn);
        return () => this._cb.delete(fn);
    }

    _emit() {
        this._cb?.forEach(f => f());
    }
}



class Sound extends Model {
    constructor() {
        super();
        this.mixer = null;
        this.sink = null;
        this.source = null;
        this._ids = [];
        this._sinkIds = [];
        this._sourceIds = [];
        this._dead = false;
    }

    async load() {
        try {
            const mod = await import('resource:///org/gnome/shell/ui/status/volume.js');
            if (this._dead)
                return;
            this.mixer = mod.getMixerControl();
            this._ids = [
                'default-sink-changed', 'default-source-changed', 'state-changed',
                'stream-added', 'stream-removed',
            ].map(s => this.mixer.connect(s, () => this._bind()));
            this._bind();
        } catch (e) {
            console.error(`[Lintel] sonido no disponible: ${e}`);
        }
    }

    _bind() {
        const sink = this.mixer?.get_default_sink() ?? null;
        const source = this.mixer?.get_default_source() ?? null;
        if (sink !== this.sink) {
            this._sinkIds.forEach(id => this.sink?.disconnect(id));
            this.sink = sink;
            this._sinkIds = sink
                ? ['notify::volume', 'notify::is-muted'].map(s => sink.connect(s, () => this._emit()))
                : [];
        }
        if (source !== this.source) {
            this._sourceIds.forEach(id => this.source?.disconnect(id));
            this.source = source;
            this._sourceIds = source
                ? ['notify::volume', 'notify::is-muted'].map(s => source.connect(s, () => this._emit()))
                : [];
        }
        this._emit();
    }

    get ready() {
        return !!this.sink;
    }

    get level() {
        return this.sink ? clamp(this.sink.volume / this.mixer.get_vol_max_norm()) : 0;
    }

    get muted() {
        return !this.sink || this.sink.is_muted || this.sink.volume === 0;
    }

    setLevel(v) {
        if (!this.sink)
            return;
        this.sink.volume = Math.round(clamp(v) * this.mixer.get_vol_max_norm());
        this.sink.push_volume();
        if (this.sink.is_muted && v > 0)
            this.sink.change_is_muted(false);
    }

    toggleMute() {
        this.sink?.change_is_muted(!this.sink.is_muted);
    }

    get iconName() {
        const l = this.level;
        if (this.muted)
            return 'audio-volume-muted-symbolic';
        if (l < 0.34)
            return 'audio-volume-low-symbolic';
        if (l < 0.67)
            return 'audio-volume-medium-symbolic';
        return 'audio-volume-high-symbolic';
    }


    get iconFile() {
        const l = this.level;
        if (this.muted)
            return 'lintel-sound-muted-symbolic';
        if (l < 0.34)
            return 'lintel-sound-low-symbolic';
        if (l < 0.67)
            return 'lintel-sound-medium-symbolic';
        return 'lintel-sound-high-symbolic';
    }

    get sinks() {
        return this.mixer?.get_sinks() ?? [];
    }

    get micReady() {
        return !!this.source;
    }

    get micLevel() {
        return this.source ? clamp(this.source.volume / this.mixer.get_vol_max_norm()) : 0;
    }

    get micMuted() {
        return !this.source || this.source.is_muted || this.source.volume === 0;
    }


    get micInUse() {
        try {
            return (this.mixer?.get_source_outputs?.() ?? []).some(stream => {
                const id = `${stream.application_id ?? ''} ${stream.name ?? ''}`;
                return !/VolumeControl|peak|pavucontrol|gnome-shell/i.test(id);
            });
        } catch (e) {
            return false;
        }
    }

    setMicLevel(v) {
        if (!this.source)
            return;
        this.source.volume = Math.round(clamp(v) * this.mixer.get_vol_max_norm());
        this.source.push_volume();
        if (this.source.is_muted && v > 0)
            this.source.change_is_muted(false);
    }

    get micIconName() {
        return this.micMuted
            ? 'microphone-sensitivity-muted-symbolic'
            : 'audio-input-microphone-symbolic';
    }

    setDefault(stream) {
        this.mixer?.set_default_sink(stream);
    }

    destroy() {
        this._dead = true;
        this._sinkIds.forEach(id => this.sink?.disconnect(id));
        this._sourceIds.forEach(id => this.source?.disconnect(id));
        this._ids.forEach(id => this.mixer?.disconnect(id));
        this._cb?.clear();
    }
}

class Brightness extends Model {
    constructor() {
        super();
        this._manager = Main.brightnessManager;
        this._scale = null;
        this._scaleId = 0;
        this._managerId = this._manager?.connect('changed', () => this._bindScale()) ?? 0;
        this._bindScale();
    }

    _bindScale() {
        if (this._scaleId)
            this._scale?.disconnect(this._scaleId);
        this._scale = this._manager?.globalScale ?? null;
        this._scaleId = this._scale?.connect('notify::value', () => this._emit()) ?? 0;
        this._emit();
    }

    get available() {
        return this._scale !== null;
    }

    get level() {
        return clamp(this._scale?.value ?? 0);
    }

    setLevel(v) {
        if (this._scale)
            this._scale.value = clamp(v);
    }

    destroy() {
        if (this._scaleId)
            this._scale?.disconnect(this._scaleId);
        if (this._managerId)
            this._manager?.disconnect(this._managerId);
        this._scaleId = 0;
        this._managerId = 0;
        this._scale = null;
        this._manager = null;
        this._cb?.clear();
    }
}

const PowerProfilesProxy = Gio.DBusProxy.makeProxyWrapper(`
<node><interface name="net.hadess.PowerProfiles">
  <property name="ActiveProfile" type="s" access="readwrite"/>
  <property name="Profiles" type="aa{sv}" access="read"/>
  <property name="PerformanceDegraded" type="s" access="read"/>
</interface></node>`);

const POWER_PROFILE_NAMES = {
    'power-saver': 'Ahorro de energía',
    balanced: 'Balanceado',
    performance: 'Rendimiento',
};

const POWER_PROFILE_ICONS = {
    'power-saver': 'power-profile-power-saver-symbolic',
    balanced: 'power-profile-balanced-symbolic',
    performance: 'power-profile-performance-symbolic',
};

class PowerProfiles extends Model {
    constructor() {
        super();
        this._dead = false;
        this._proxy = new PowerProfilesProxy(Gio.DBus.system,
            'net.hadess.PowerProfiles', '/net/hadess/PowerProfiles',
            (proxy, error) => {
                if (error || this._dead)
                    return;
                this._id = proxy.connect('g-properties-changed', () => this._emit());
                this._ownerId = proxy.connect('notify::g-name-owner', () => this._emit());
                this._emit();
            });
    }

    get profiles() {
        return (this._proxy?.Profiles ?? [])
            .map(properties => properties.Profile?.unpack?.() ?? properties.Profile)
            .filter(Boolean);
    }

    get available() {
        return this._proxy?.g_name_owner !== null && this.profiles.length > 0;
    }

    get limitation() {
        return this._proxy?.PerformanceDegraded ?? '';
    }

    get active() {
        return this._proxy?.ActiveProfile ?? 'balanced';
    }

    get label() {
        return POWER_PROFILE_NAMES[this.active] ?? 'Personalizado';
    }

    get iconName() {
        return POWER_PROFILE_ICONS[this.active] ?? 'gnome-power-manager-symbolic';
    }

    setProfile(profile) {
        if (!this.available || !this.profiles.includes(profile) || this.pending) return;
        this.pending = true;
        this._emit();
        this._cancel ??= new Gio.Cancellable();
        Gio.DBus.system.call('net.hadess.PowerProfiles', '/net/hadess/PowerProfiles',
            'org.freedesktop.DBus.Properties', 'Set',
            new GLib.Variant('(ssv)', ['net.hadess.PowerProfiles', 'ActiveProfile', new GLib.Variant('s', profile)]),
            null, Gio.DBusCallFlags.NONE, 10000, this._cancel, (connection, result) => {
                try { connection.call_finish(result); }
                catch (error) { if (!this._dead) Main.notifyError('Energía', error.message); }
                this.pending = false;
                if (!this._dead) this._emit();
            });
    }

    destroy() {
        this._dead = true;
        this._cancel?.cancel();
        if (this._id) this._proxy?.disconnect(this._id);
        if (this._ownerId) this._proxy?.disconnect(this._ownerId);
        this._proxy = null;
        this._cb?.clear();
    }
}

const BATTERY_HEALTH_SCHEMA = 'org.gnome.shell.extensions.Battery-Health-Charging';
const BATTERY_HEALTH_UUID = 'Battery-Health-Charging@maniacx.github.com';

class BatteryCare extends Model {
    constructor() {
        super();
        this._settings = settingsForExtension(BATTERY_HEALTH_SCHEMA, BATTERY_HEALTH_UUID);
        this._ids = [];
        if (this._settings) {
            for (const key of ['charging-mode', 'device-type', 'polkit-status'])
                this._ids.push(this._settings.connect(`changed::${key}`, () => this._emit()));
        }
    }

    get available() {
        return !!this._settings && this._settings.get_int('device-type') > 0 &&
            this._settings.get_string('polkit-status') === 'installed';
    }

    get mode() {
        return this._settings?.get_string('charging-mode') ?? 'ful';
    }

    get enabled() {
        return this.mode !== 'ful';
    }

    get label() {
        const mode = this.mode;
        if (mode === 'max')
            return `Máxima vida · ${this._settings.get_int('current-max-end-threshold')} %`;
        if (mode === 'bal')
            return `Equilibrado · ${this._settings.get_int('current-bal-end-threshold')} %`;
        if (mode === 'adv')
            return 'Adaptativo';
        if (mode === 'exp')
            return 'Carga rápida';
        return 'Carga completa';
    }

    _findChargeLimitToggle() {
        const root = Main.panel.statusArea.quickSettings?.menu?.box;
        const pending = root ? [root] : [];
        while (pending.length) {
            const actor = pending.pop();
            const schemaId = actor?._settings?.settings_schema?.get_id?.();
            if (actor?.constructor?.name?.includes('ChargeLimitToggle') ||
                schemaId === BATTERY_HEALTH_SCHEMA)
                return actor;
            pending.push(...(actor?.get_children?.() ?? []));
        }
        return null;
    }

    get modes() {
        const toggle = this._findChargeLimitToggle();
        const candidates = [
            ['ful', '_menuItemFul', 'Carga completa'], ['bal', '_menuItemBal', 'Equilibrado'],
            ['max', '_menuItemMax', 'Máxima vida útil'], ['adv', '_menuItemAdv', 'Adaptativo'],
            ['exp', '_menuItemExp', 'Carga rápida'],
        ];
        return candidates.filter(([, field]) => toggle?.[field]?.visible).map(([id, field, label]) => ({
            id, field, label, description: ['ful', 'bal', 'max'].includes(id)
                ? `Límite configurado: ${this._settings.get_int(`current-${id}-end-threshold`)} %` : 'Gestionado por el equipo',
        }));
    }

    setMode(id) {
        const mode = this.modes.find(item => item.id === id);
        if (!mode) throw new Error('Este modo no está disponible en el equipo');
        this._findChargeLimitToggle()[mode.field].emit('activate', null);
    }

    toggle() {
        const toggle = this._findChargeLimitToggle();
        if (toggle) {
            toggle.emit('clicked');
        } else {
            Main.notifyError('Cuidado de batería',
                'No se encontró el control activo de Battery Health Charging.');
        }
    }

    destroy() {
        this._ids.forEach(id => this._settings?.disconnect(id));
        this._ids = [];
        this._settings?.run_dispose?.();
        this._settings = null;
        this._cb?.clear();
    }
}

class AirplaneMode extends Model {
    constructor() {
        super();
        this._manager = getRfkillManager();
        this._ids = [
            this._manager.connect('notify::airplane-mode', () => this._emit()),
            this._manager.connect('notify::show-airplane-mode', () => this._emit()),
        ];
    }

    get available() {
        return this._manager.show_airplane_mode;
    }

    get enabled() {
        return this._manager.airplane_mode;
    }

    toggle() {
        this._manager.airplane_mode = !this._manager.airplane_mode;
    }

    destroy() {
        this._ids.forEach(id => this._manager?.disconnect(id));
        this._ids = [];
        this._manager = null;
        this._cb?.clear();
    }
}


const BLUEZ = 'org.bluez';

const BT_ICONS = {
    'audio-headset': 'audio-headset-symbolic',
    'audio-headphones': 'audio-headphones-symbolic',
    'audio-card': 'audio-speakers-symbolic',
    'input-keyboard': 'input-keyboard-symbolic',
    'input-mouse': 'input-mouse-symbolic',
    'input-gaming': 'input-gaming-symbolic',
    'input-tablet': 'input-tablet-symbolic',
    phone: 'phone-symbolic',
    computer: 'computer-symbolic',
    'camera-photo': 'camera-photo-symbolic',
    printer: 'printer-symbolic',
};
const btIcon = name => BT_ICONS[name] ?? 'bluetooth-active-symbolic';

class Bluetooth extends Model {
    constructor() {
        super();
        this._cancel = new Gio.Cancellable();
        this._dead = false;
        this._adapterPath = null;
        this._powered = false;
        this._discovering = false;
        this._devices = [];
        this._busy = new Set();
        this._refreshId = 0;
        this._lastDiscovery = 0;
        this._weStarted = false;

        const queue = () => this._queueRefresh();
        const sub = (iface, member) => Gio.DBus.system.signal_subscribe(
            BLUEZ, iface, member, null, null, Gio.DBusSignalFlags.NONE, queue);
        this._subs = [
            sub('org.freedesktop.DBus.Properties', 'PropertiesChanged'),
            sub('org.freedesktop.DBus.ObjectManager', 'InterfacesAdded'),
            sub('org.freedesktop.DBus.ObjectManager', 'InterfacesRemoved'),
        ];
        this._watchId = Gio.bus_watch_name(Gio.BusType.SYSTEM, BLUEZ, Gio.BusNameWatcherFlags.NONE,
            () => this._queueRefresh(),
            () => {
                this._adapterPath = null;
                this._devices = [];
                this._emit();
            });
        this.refresh();
    }

    _queueRefresh() {
        if (this._dead || this._refreshId)
            return;
        this._refreshId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 400, () => {
            this._refreshId = 0;
            this.refresh();
            return GLib.SOURCE_REMOVE;
        });
    }

    refresh() {
        const serial = this._refreshSerial = (this._refreshSerial ?? 0) + 1;
        Gio.DBus.system.call(BLUEZ, '/', 'org.freedesktop.DBus.ObjectManager', 'GetManagedObjects',
            null, null, Gio.DBusCallFlags.NO_AUTO_START, 10000, this._cancel, (c, r) => {
                if (this._dead || serial !== this._refreshSerial)
                    return;
                try {
                    const [objects] = c.call_finish(r).recursiveUnpack();
                    this._parse(objects);
                } catch (e) {
                    this._adapterPath = null;
                    this._devices = [];
                }
                this._emit();
            });
    }

    _parse(objects) {
        let adapterPath = null;
        let adapter = null;
        for (const [path, ifaces] of Object.entries(objects)) {
            if (ifaces['org.bluez.Adapter1'] && !adapterPath) {
                adapterPath = path;
                adapter = ifaces['org.bluez.Adapter1'];
            }
        }
        const devices = [];
        for (const [path, ifaces] of Object.entries(objects)) {
            const d = ifaces['org.bluez.Device1'];
            if (!d || d.Adapter !== adapterPath)
                continue;

            if (!d.Paired && !d.Name)
                continue;
            devices.push({
                path,
                name: d.Alias || d.Name || d.Address,
                icon: d.Icon ?? '',
                paired: !!d.Paired,
                connected: !!d.Connected,
                rssi: d.RSSI ?? -127,
            });
        }
        this._adapterPath = adapterPath;
        this._powered = !!adapter?.Powered;
        this._discovering = !!adapter?.Discovering;
        this._devices = devices;
    }

    get available() {
        return !!this._adapterPath;
    }

    get powered() {
        return this._powered;
    }

    get discovering() {
        return this._discovering;
    }

    get paired() {
        return this._devices.filter(d => d.paired)
            .sort((a, b) => (b.connected - a.connected) || a.name.localeCompare(b.name));
    }

    get nearby() {
        return this._devices.filter(d => !d.paired).sort((a, b) => b.rssi - a.rssi);
    }

    isBusy(device) {
        return this._busy.has(device.path);
    }

    setPowered(v) {
        if (!this._adapterPath || this._powerPending)
            return;
        this._powerPending = true;
        Gio.DBus.system.call(BLUEZ, this._adapterPath,
            'org.freedesktop.DBus.Properties', 'Set',
            new GLib.Variant('(ssv)', ['org.bluez.Adapter1', 'Powered', GLib.Variant.new_boolean(v)]),
            null, Gio.DBusCallFlags.NONE, 10000, this._cancel, (connection, result) => {
                this._powerPending = false;
                try { connection.call_finish(result); }
                catch (error) {
                    if (!this._dead) Main.notify('Bluetooth', `No se pudo cambiar el estado: ${error.message}`);
                }
                if (!this._dead) this.refresh();
            });
    }

    startDiscovery() {
        if (!this._adapterPath || !this._powered || this._discovering)
            return;
        const now = GLib.get_monotonic_time() / 1e6;
        if (now - this._lastDiscovery < 3)
            return;
        this._lastDiscovery = now;
        this._weStarted = true;
        busCall(Gio.DBus.system, BLUEZ, this._adapterPath, 'org.bluez.Adapter1', 'StartDiscovery');
    }

    stopDiscovery() {
        if (!this._weStarted || !this._adapterPath)
            return;
        this._weStarted = false;
        busCall(Gio.DBus.system, BLUEZ, this._adapterPath, 'org.bluez.Adapter1', 'StopDiscovery');
    }

    _deviceCall(path, method, done) {
        Gio.DBus.system.call(BLUEZ, path, 'org.bluez.Device1', method, null, null,
            Gio.DBusCallFlags.NONE, 30000, this._cancel, (c, r) => {
                let error = null;
                try {
                    c.call_finish(r);
                } catch (e) {
                    error = e;
                }
                if (!this._dead) done?.(error);
            });
    }


    toggleDevice(device) {
        if (this._busy.has(device.path))
            return;
        this._busy.add(device.path);
        this._emit();
        const finish = error => {
            this._busy.delete(device.path);
            if (error)
                !this._dead && Main.notifyError('Bluetooth', `${device.name}: ${error.message}`);
            if (!this._dead) {
                this.refresh();
                this._emit();
            }

            if (error && !device.paired)
                run('gnome-control-center bluetooth');
        };
        if (device.connected) {
            this._deviceCall(device.path, 'Disconnect', finish);
        } else if (device.paired) {
            this._deviceCall(device.path, 'Connect', finish);
        } else {
            this._deviceCall(device.path, 'Pair', error => {
                if (error)
                    return finish(error);
                busCall(Gio.DBus.system, BLUEZ, device.path, 'org.freedesktop.DBus.Properties', 'Set',
                    new GLib.Variant('(ssv)', ['org.bluez.Device1', 'Trusted', GLib.Variant.new_boolean(true)]));
                return this._deviceCall(device.path, 'Connect', finish);
            });
        }
    }

    destroy() {
        this._dead = true;
        this._cancel.cancel();
        this.stopDiscovery();
        this._subs.forEach(id => Gio.DBus.system.signal_unsubscribe(id));
        this._subs = [];
        if (this._watchId)
            Gio.bus_unwatch_name(this._watchId);
        this._watchId = 0;
        if (this._refreshId)
            GLib.source_remove(this._refreshId);
        this._refreshId = 0;
        this._cb?.clear();
    }
}





class Privacy extends Model {
    constructor(ctx) {
        super();
        this._ctx = ctx;
        this._dead = false;
        this._timer = 0;
        this._handles = new Map();
        this._ctl = null;
        this._ctlId = 0;
        this._shot = null;
        this._shotId = 0;
        this.camera = false;

        this._offSound = ctx.sound.onChange(() => this._emit());
        try {
            this._ctl = global.backend.get_remote_access_controller?.() ?? null;
            this._ctlId = this._ctl?.connect('new-handle', (c, handle) => this._track(handle)) ?? 0;
        } catch (e) {
            console.error(`[Lintel] RemoteAccess no disponible: ${e}`);
        }
        try {
            this._shot = Main.screenshotUI ?? null;
            this._shotId = this._shot?.connect('notify::screencast-in-progress', () => this._emit()) ?? 0;
        } catch (e) {
            this._shot = null;
        }
        this._pollCamera();
    }

    get mic() {
        return this._ctx.sound.micInUse;
    }

    get screen() {
        return this._handles.size > 0 || !!this._shot?.screencast_in_progress;
    }

    get any() {
        return this.mic || this.camera || this.screen;
    }

    _track(handle) {
        if (!(handle.is_recording ?? handle.isRecording ?? false))
            return;
        const id = handle.connect('stopped', () => {
            handle.disconnect(id);
            this._handles.delete(handle);
            if (!this._dead)
                this._emit();
        });
        this._handles.set(handle, id);
        this._emit();
    }

    _setCamera(value) {
        if (value === this.camera || this._dead)
            return;
        this.camera = value;
        this._emit();
    }

    _pollCamera() {
        this._cameraMonitor = new Shell.CameraMonitor();
        this._cameraId = this._cameraMonitor.connect('notify::cameras-in-use', () =>
            this._setCamera(this._cameraMonitor.cameras_in_use));
        this._setCamera(this._cameraMonitor.cameras_in_use);
    }

    destroy() {
        this._dead = true;
        if (this._cameraId) this._cameraMonitor.disconnect(this._cameraId);
        this._cameraMonitor = null;
        this._ctx.cancel(this._timer);
        this._offSound?.();
        if (this._ctlId)
            this._ctl?.disconnect(this._ctlId);
        if (this._shotId)
            this._shot?.disconnect(this._shotId);
        this._handles.forEach((id, handle) => handle.disconnect(id));
        this._handles.clear();
        this._cb?.clear();
    }
}



export {Sound, Brightness, PowerProfiles, BatteryCare, AirplaneMode, Bluetooth, Privacy, btIcon};
