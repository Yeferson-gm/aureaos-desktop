import Clutter from 'gi://Clutter';
import Atk from 'gi://Atk';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import St from 'gi://St';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import {MODULES} from './settings-model.js';
import {controlRows, panelSize} from './control-layout.js';

const ICONS = {wifi: 'network-wireless-symbolic', bluetooth: 'bluetooth-active-symbolic', brightness: 'display-brightness-symbolic', sound: 'audio-volume-high-symbolic', microphone: 'audio-input-microphone-symbolic', power: 'power-profile-balanced-symbolic', battery: 'battery-level-80-symbolic', focus: 'notifications-disabled-symbolic', night: 'night-light-symbolic', appearance: 'weather-clear-night-symbolic', airplane: 'airplane-mode-symbolic', caffeine: 'alarm-symbolic', privacy: 'security-high-symbolic', displays: 'video-display-symbolic', vpn: 'network-vpn-symbolic', ethernet: 'network-wired-symbolic', screenshot: 'camera-photo-symbolic'};
const PROFILES = {'power-saver': 'Ahorro de energía', balanced: 'Balanceado', performance: 'Rendimiento'};
const NightProxy = Gio.DBusProxy.makeProxyWrapper('<node><interface name="org.gnome.SettingsDaemon.Color"><property name="NightLightActive" type="b" access="read"/></interface></node>');

export class ControlCenter {
    constructor(button, ctx, {settingsFor, settingsForExtension, makeSlider, run}) {
        this.button = button; this.ctx = ctx; this.makeSlider = makeSlider; this.run = run;
        this.offs = []; this.signals = []; this.cards = new Map(); this.page = null;
        this.settings = {
            appearance: settingsFor('org.gnome.desktop.interface'), night: settingsFor('org.gnome.settings-daemon.plugins.color'),
            focus: settingsFor('org.gnome.desktop.notifications'), privacy: settingsFor('org.gnome.desktop.privacy'),
            location: settingsFor('org.gnome.system.location'),
            caffeine: settingsForExtension('org.gnome.shell.extensions.caffeine', 'caffeine@patapon.info'),
        };
        for (const setting of Object.values(this.settings).filter(Boolean)) this.signals.push([setting, setting.connect('changed', () => this.sync())]);
        for (const model of [ctx.wifi, ctx.bluetooth, ctx.sound, ctx.brightness, ctx.powerProfiles, ctx.batteryCare, ctx.airplaneMode, ctx.privacy])
            this.offs.push(model.onChange(() => this.sync()));
        this.night = new NightProxy(Gio.DBus.session, 'org.gnome.SettingsDaemon.Color', '/org/gnome/SettingsDaemon/Color', (proxy, error) => {
            if (this.dead || error) return;
            this.signals.push([proxy, proxy.connect('g-properties-changed', () => this.sync())]); this.sync();
        });
        this.signals.push([this.settings.appearance, this.settings.appearance.connect('changed::text-scaling-factor', () => this.showPage(this.page))]);
        this.holder = new PopupMenu.PopupBaseMenuItem({activate: false, hover: false, can_focus: false});
        this.holder.add_style_class_name('lintel-cc-holder');
        this.root = new St.BoxLayout({vertical: true, style_class: 'aurea-controls', x_expand: true});
        this.holder.add_child(this.root); button.menu.addMenuItem(this.holder);
        this.header = new St.BoxLayout({style_class: 'aurea-controls-header'}); this.root.add_child(this.header);
        this.back = this.action('go-previous-symbolic', 'Volver al Centro de Control', () => this.showPage(null));
        this.title = new St.Label({text: 'Centro de Control', y_align: Clutter.ActorAlign.CENTER, x_expand: true, style_class: 'aurea-controls-title'});
        this.header.add_child(this.back); this.header.add_child(this.title);
        this.header.add_child(this.action('document-edit-symbolic', 'Editar controles', () => { button.menu.close(); ctx.openPreferences(); }));
        this.scroll = new St.ScrollView({style_class: 'aurea-controls-scroll', overlay_scrollbars: true, hscrollbar_policy: St.PolicyType.NEVER, vscrollbar_policy: St.PolicyType.AUTOMATIC});
        this.body = new St.BoxLayout({vertical: true, style_class: 'aurea-controls-body', x_expand: true});
        this.scroll.set_child(this.body); this.root.add_child(this.scroll);
        this.footer = this.row('Ajustes del Sistema', 'Abrir Ajustes ↗', () => { button.menu.close(); run('gnome-control-center'); });
        this.root.add_child(this.footer);
        this.offs.push(ctx.config.onChange(() => this.showPage(this.page)));
        this.signals.push([Main.layoutManager, Main.layoutManager.connect('monitors-changed', () => this.resize())]);
        this.signals.push([button.menu, button.menu.connect('open-state-changed', (_, open) => {
            if (open) { this.resize(); if (this.page) this.showPage(null); else this.sync(); }
            else { ctx.bluetooth.stopDiscovery(); this.cancelRefresh(); }
        })]);
        this.showPage(null);
    }
    action(icon, name, callback) {
        const button = new St.Button({style_class: 'aurea-icon-action', can_focus: true, accessible_name: name, child: new St.Icon({icon_name: icon, icon_size: 16})});
        button.connect('clicked', () => this.perform(callback)); return button;
    }
    perform(callback) {
        try { callback(); } catch (error) { Main.notifyError('Centro de Control', error.message); }
    }
    row(title, subtitle, callback, checked = false, enabled = true) {
        const button = new St.Button({style_class: 'aurea-detail-row', can_focus: enabled, reactive: enabled, x_expand: true, accessible_name: `${title}. ${subtitle}${checked ? '. Seleccionado' : ''}`});
        const content = new St.BoxLayout({style_class: 'aurea-detail-content'});
        const labels = new St.BoxLayout({vertical: true, x_expand: true});
        labels.add_child(new St.Label({text: title, style_class: 'aurea-detail-title'}));
        if (subtitle) labels.add_child(new St.Label({text: subtitle, style_class: 'aurea-detail-subtitle'}));
        content.add_child(labels);
        if (checked) content.add_child(new St.Icon({icon_name: 'object-select-symbolic', icon_size: 16, y_align: Clutter.ActorAlign.CENTER}));
        button.set_child(content); button.connect('clicked', () => this.perform(callback));
        if (!enabled) button.add_style_pseudo_class('insensitive');
        return button;
    }
    resize() {
        if (!this.button.get_stage()) return;
        const monitor = Main.layoutManager.findMonitorForActor(this.button) ?? Main.layoutManager.primaryMonitor;
        if (!monitor) return;
        const scale = St.ThemeContext.get_for_stage(global.stage).scale_factor;
        const size = panelSize(monitor.width, monitor.height, scale, this.settings.appearance.get_double('text-scaling-factor'));
        this.root.set_style(`width: ${size.width}px;`);
        if (!this.page) for (const row of this.body.get_children()) {
            const children = row.get_children();
            if (row.has_style_class_name('aurea-control-row')) for (const child of children)
                child.set_width((size.width - 8 * (children.length - 1)) / children.length);
        }
        const headerHeight = this.header.get_preferred_height(size.width)[1];
        const footerHeight = this.footer.get_preferred_height(size.width)[1];
        this.scroll.set_style(`max-height: ${Math.max(120, size.height - headerHeight - footerHeight - 44)}px;`);
    }
    available(id) {
        const c = this.ctx;
        return ({wifi: !!c.wifi.device, bluetooth: c.bluetooth.available, brightness: c.brightness.available,
            sound: c.sound.ready, microphone: c.sound.micReady, power: c.powerProfiles.available,
            battery: c.batteryCare.available, airplane: c.airplaneMode.available, caffeine: !!this.settings.caffeine,
            ethernet: c.wifi.ethernetAvailable, vpn: c.wifi.vpnAvailable})[id] ?? true;
    }
    state(id) {
        const c = this.ctx, s = this.settings;
        switch (id) {
        case 'wifi': return [c.wifi.enabled, c.wifi._powerPending ? 'Cambiando…' : c.wifi._connecting ? 'Conectando…' : c.wifi.activeSsid ?? (c.wifi.enabled ? 'Sin conexión' : 'Desactivado')];
        case 'bluetooth': return [c.bluetooth.powered, c.bluetooth._powerPending ? 'Cambiando…' : c.bluetooth.paired.filter(d => d.connected).map(d => d.name).join(', ') || (c.bluetooth.powered ? 'Activado' : 'Desactivado')];
        case 'power': return [false, c.powerProfiles.pending ? 'Aplicando…' : c.powerProfiles.label];
        case 'battery': return [c.batteryCare.enabled, c.batteryCare.label];
        case 'airplane': return [c.airplaneMode.enabled, c.airplaneMode.enabled ? 'Activado' : 'Desactivado'];
        case 'appearance': return [s.appearance.get_string('color-scheme') === 'prefer-dark', s.appearance.get_string('color-scheme') === 'prefer-dark' ? 'Oscuro' : 'Claro'];
        case 'focus': return [!s.focus.get_boolean('show-banners'), !s.focus.get_boolean('show-banners') ? (this.focusTimer ? 'Temporal' : 'Activado') : 'Desactivado'];
        case 'night': return [!!this.night?.NightLightActive, this.night?.NightLightActive ? 'Activa ahora' : s.night.get_boolean('night-light-enabled') ? 'Programada' : 'Desactivada'];
        case 'caffeine': return [s.caffeine?.get_boolean('cli-toggle'), s.caffeine?.get_boolean('cli-toggle') ? 'Pantalla activa' : 'Desactivado'];
        case 'privacy': return [c.privacy.any, c.privacy.any ? 'Sensores en uso' : 'Permisos y actividad'];
        case 'ethernet': return [c.wifi.ethernetConnected, `${c.wifi.ethernetConnected ? 'Conectado' : 'Desconectado'} · Ajustes ↗`];
        case 'vpn': return [c.wifi.vpnActive, `${c.wifi.vpnActive ? 'Conectada' : 'Desconectada'} · Ajustes ↗`];
        case 'displays': return [false, 'Ajustes de pantallas ↗'];
        case 'screenshot': return [false, 'Seleccionar área'];
        default: return [false, ''];
        }
    }
    toggle(id) {
        const c = this.ctx, s = this.settings;
        switch (id) {
        case 'wifi': c.wifi.setEnabled(!c.wifi.enabled); break;
        case 'bluetooth': c.bluetooth.setPowered(!c.bluetooth.powered); break;
        case 'appearance': s.appearance.set_string('color-scheme', this.state(id)[0] ? 'prefer-light' : 'prefer-dark'); break;
        case 'airplane': c.airplaneMode.toggle(); break;
        case 'caffeine': s.caffeine.set_boolean('cli-toggle', !s.caffeine.get_boolean('cli-toggle')); break;
        case 'night': s.night.set_boolean('night-light-enabled', !s.night.get_boolean('night-light-enabled')); break;
        case 'focus': this.setFocus(!this.state(id)[0]); break;
        case 'screenshot': this.button.menu.close(); Main.screenshotUI.open(); break;
        case 'displays': case 'vpn': case 'ethernet': this.button.menu.close(); this.run(`gnome-control-center ${id === 'displays' ? 'display' : 'network'}`); break;
        default: this.showPage(id);
        }
        this.sync();
    }
    setFocus(on, minutes = 0) {
        const previous = this.focusTimer ? this.previousBanners : this.settings.focus.get_boolean('show-banners');
        if (this.focusTimer) GLib.source_remove(this.focusTimer);
        this.focusTimer = 0;
        if (on && minutes) {
            this.previousBanners = previous;
            this.focusTimer = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, minutes * 60, () => {
                this.focusTimer = 0; this.settings.focus.set_boolean('show-banners', this.previousBanners); return GLib.SOURCE_REMOVE;
            });
        }
        this.settings.focus.set_boolean('show-banners', !on);
    }
    tile(id, wide) {
        if (['brightness', 'sound', 'microphone'].includes(id)) return this.sliderCard(id);
        const card = new St.BoxLayout({style_class: 'aurea-control-card', x_expand: true});
        const toggle = new St.Button({style_class: 'lintel-cc-tile aurea-control-main', can_focus: true, x_expand: true, accessible_name: MODULES[id]});
        const content = new St.BoxLayout({style_class: 'aurea-control-content', x_expand: true});
        const icon = new St.Icon({icon_name: ICONS[id], icon_size: 18, style_class: 'aurea-control-icon', y_align: Clutter.ActorAlign.CENTER});
        content.add_child(icon);
        const labels = new St.BoxLayout({vertical: true, x_expand: true, y_align: Clutter.ActorAlign.CENTER});
        labels.add_child(new St.Label({text: MODULES[id], style_class: 'aurea-control-label'}));
        const status = new St.Label({style_class: 'aurea-control-status'}); labels.add_child(status); content.add_child(labels);
        if (['wifi', 'bluetooth', 'appearance', 'focus', 'night', 'airplane', 'caffeine'].includes(id)) toggle.accessible_role = Atk.Role.TOGGLE_BUTTON;
        toggle.set_child(content); toggle.connect('clicked', () => this.perform(() => this.toggle(id))); card.add_child(toggle);
        if (['wifi', 'bluetooth', 'focus', 'night'].includes(id)) card.add_child(this.action('go-next-symbolic', `Detalles de ${MODULES[id]}`, () => this.showPage(id)));
        this.cards.set(id, {toggle, status, icon, wide}); return card;
    }
    sliderCard(id) {
        const c = this.ctx, mic = id === 'microphone', bright = id === 'brightness';
        const card = new St.BoxLayout({vertical: true, x_expand: true, style_class: 'aurea-slider-card'});
        const header = new St.BoxLayout();
        header.add_child(new St.Label({text: MODULES[id], x_expand: true, style_class: 'aurea-control-label', y_align: Clutter.ActorAlign.CENTER}));
        const value = new St.Label({style_class: 'aurea-control-status', y_align: Clutter.ActorAlign.CENTER}); header.add_child(value);
        if (!bright) header.add_child(this.action('go-next-symbolic', `Dispositivos de ${MODULES[id]}`, () => this.showPage(id)));
        card.add_child(header);
        const row = new St.BoxLayout({style_class: 'aurea-slider-row'});
        const icon = new St.Icon({icon_name: ICONS[id], icon_size: 16, y_align: Clutter.ActorAlign.CENTER});
        if (bright) row.add_child(icon);
        else {
            const mute = new St.Button({child: icon, style_class: 'aurea-icon-action', can_focus: true, accessible_name: `Silenciar ${MODULES[id]}`});
            mute.connect('clicked', () => mic ? c.sound.source?.change_is_muted(!c.sound.micMuted) : c.sound.toggleMute()); row.add_child(mute);
        }
        const slider = this.makeSlider(0, v => bright ? c.brightness.setLevel(v) : mic ? c.sound.setMicLevel(v) : c.sound.setLevel(v));
        slider.accessible_name = MODULES[id]; row.add_child(slider); card.add_child(row);
        this.cards.set(id, {slider, value, icon}); return card;
    }
    showPage(id) {
        this.ctx.bluetooth.stopDiscovery(); this.cancelRefresh(); this.page = id;
        this.body.destroy_all_children(); this.cards.clear();
        this.back.visible = !!id; this.title.text = id ? MODULES[id] : 'Centro de Control';
        if (!id) {
            const values = this.ctx.config.values;
            this.availability = values.modules.map(x => `${x}:${this.available(x)}`).join('|');
            const sizes = this.settings.appearance.get_double('text-scaling-factor') >= 1.4
                ? Object.fromEntries(values.modules.map(key => [key, 'wide'])) : values.sizes;
            for (const ids of controlRows(values.modules, sizes, x => this.available(x))) {
                const row = new St.BoxLayout({style_class: 'aurea-control-row', x_expand: true});
                for (const key of ids) row.add_child(this.tile(key, ids.length === 1));
                this.body.add_child(row);
            }
            if (!this.cards.size) this.body.add_child(this.row('Añadir controles', 'Personaliza este panel', () => { this.button.menu.close(); this.ctx.openPreferences(); }));
        } else {
            this.drawDetails();
            if (id === 'wifi') this.ctx.wifi._scan();
            if (id === 'bluetooth') this.ctx.bluetooth.startDiscovery();
        }
        this.sync(); this.resize();
    }
    detail(title, subtitle, callback, checked = false, enabled = true) { this.body.add_child(this.row(title, subtitle, callback, checked, enabled)); }
    drawDetails() {
        const c = this.ctx, s = this.settings, id = this.page;
        switch (id) {
        case 'power':
            if (c.powerProfiles.limitation) this.detail('Rendimiento limitado', c.powerProfiles.limitation, () => {}, false, false);
            for (const profile of c.powerProfiles.profiles) this.detail(PROFILES[profile] ?? profile, profile === 'performance' ? 'Más velocidad y consumo' : profile === 'power-saver' ? 'Prioriza autonomía' : 'Equilibrio entre consumo y respuesta', () => c.powerProfiles.setProfile(profile), c.powerProfiles.active === profile, !c.powerProfiles.pending);
            break;
        case 'battery':
            this.detail('Estado actual', c.batteryCare.label, () => {}, false, false);
            for (const mode of c.batteryCare.modes) this.detail(mode.label, mode.description, () => c.batteryCare.setMode(mode.id), c.batteryCare.mode === mode.id);
            break;
        case 'wifi':
            this.detail('Wi-Fi', this.state(id)[1], () => this.toggle(id), c.wifi.enabled, !c.wifi._powerPending);
            for (const network of c.wifi.enabled ? c.wifi._networkRows() : []) this.detail(network.ssid, c.wifi._connecting === network.ssid ? 'Conectando…' : network.active ? 'Conectado' : network.secure ? 'Red protegida' : 'Red abierta', () => { c.wifi._connect(network); this.sync(); }, network.active, !c.wifi._connecting);
            this.detail('Otras redes y ajustes', 'Abrir Wi-Fi ↗', () => { this.button.menu.close(); this.run('gnome-control-center wifi'); }); break;
        case 'bluetooth':
            this.detail('Bluetooth', this.state(id)[1], () => this.toggle(id), c.bluetooth.powered, !c.bluetooth._powerPending);
            for (const device of c.bluetooth.powered ? [...c.bluetooth.paired, ...c.bluetooth.nearby] : []) this.detail(device.name, c.bluetooth.isBusy(device) ? 'Conectando…' : device.connected ? 'Conectado · pulsar para desconectar' : device.paired ? 'Guardado · conectar' : 'Emparejar', () => c.bluetooth.toggleDevice(device), device.connected, !c.bluetooth.isBusy(device));
            this.detail('Ajustes de Bluetooth', 'Abrir ajustes y emparejamiento ↗', () => { this.button.menu.close(); this.run('gnome-control-center bluetooth'); }); break;
        case 'sound': case 'microphone': {
            const mic = id === 'microphone', streams = mic ? c.sound.mixer?.get_sources() ?? [] : c.sound.sinks;
            for (const stream of streams) this.detail(stream.description ?? stream.name ?? 'Dispositivo', mic ? 'Entrada de audio' : 'Salida de audio', () => mic ? c.sound.mixer.set_default_source(stream) : c.sound.setDefault(stream), stream === (mic ? c.sound.source : c.sound.sink));
            if (!streams.length) this.detail('Sin dispositivos disponibles', '', () => {}, false, false);
            break;
        }
        case 'focus':
            this.detail('Desactivar No molestar', 'Permitir avisos', () => this.setFocus(false), !this.state(id)[0]);
            for (const minutes of [30, 60, 120]) this.detail(`Durante ${minutes} minutos`, 'Restaurar después el estado anterior', () => this.setFocus(true, minutes));
            this.detail('Hasta desactivarlo', '', () => this.setFocus(true), this.state(id)[0] && !this.focusTimer); break;
        case 'night':
            this.detail('Luz nocturna', this.state(id)[1], () => this.toggle(id), s.night.get_boolean('night-light-enabled'));
            this.detail('Horario y temperatura', 'Abrir ajustes de pantalla ↗', () => { this.button.menu.close(); this.run('gnome-control-center display'); }); break;
        case 'privacy':
            this.detail('Actividad detectada', [c.privacy.mic && 'Micrófono', c.privacy.camera && 'Cámara', c.privacy.screen && 'Pantalla'].filter(Boolean).join(' · ') || 'Sin actividad detectada', () => {}, false, false);
            for (const [title, setting, key, inverse] of [['Cámara', s.privacy, 'disable-camera', true], ['Micrófono', s.privacy, 'disable-microphone', true], ['Ubicación', s.location, 'enabled', false]]) {
                const enabled = inverse ? !setting.get_boolean(key) : setting.get_boolean(key);
                this.detail(title, `${enabled ? 'Permitido' : 'Bloqueado'} por la preferencia de GNOME`, () => setting.set_boolean(key, !setting.get_boolean(key)), enabled);
            }
            this.detail('Los permisos no prueban actividad', 'Algunas aplicaciones no respetan estas preferencias.', () => {}, false, false); break;
        }
    }
    cancelRefresh() { if (this.refresh) this.ctx.cancel(this.refresh); this.refresh = 0; }
    sync() {
        if (this.dead) return;
        if (!this.page) {
            const signature = this.ctx.config.values.modules.map(x => `${x}:${this.available(x)}`).join('|');
            if (this.availability !== signature) { this.showPage(null); return; }
            for (const [id, card] of this.cards) {
                if (card.slider) {
                    const level = id === 'brightness' ? this.ctx.brightness.level : id === 'microphone' ? this.ctx.sound.micLevel : this.ctx.sound.level;
                    card.slider.setSilently(level); card.value.text = `${Math.round(level * 100)} %`;
                    if (id !== 'brightness') card.icon.icon_name = id === 'microphone' ? this.ctx.sound.micIconName : this.ctx.sound.iconName;
                } else {
                    const [on, text] = this.state(id); card.status.text = text;
                    card.toggle.accessible_name = `${MODULES[id]}. ${text}`;
                    if (card.toggle.accessible_role === Atk.Role.TOGGLE_BUTTON) {
                        if (on) card.toggle.add_accessible_state(Atk.StateType.CHECKED);
                        else card.toggle.remove_accessible_state(Atk.StateType.CHECKED);
                    }
                    on ? card.icon.add_style_pseudo_class('checked') : card.icon.remove_style_pseudo_class('checked');
                }
            }
        } else if (this.button.menu.isOpen && !this.refresh) {
            this.refresh = this.ctx.later(150, () => {
                this.refresh = 0;
                const focus = global.stage.get_key_focus();
                const name = focus?.accessible_name;
                this.body.destroy_all_children(); this.drawDetails();
                if (name) this.body.get_children().find(a => a.accessible_name === name)?.grab_key_focus();
            });
        }
    }
    destroy() {
        this.dead = true; this.cancelRefresh(); this.ctx.bluetooth.stopDiscovery();
        if (this.focusTimer) { GLib.source_remove(this.focusTimer); this.settings.focus.set_boolean('show-banners', this.previousBanners); }
        this.offs.forEach(off => off()); this.signals.forEach(([object, signal]) => object.disconnect(signal));
        Object.values(this.settings).forEach(setting => setting?.run_dispose()); this.night?.run_dispose();
    }
}
