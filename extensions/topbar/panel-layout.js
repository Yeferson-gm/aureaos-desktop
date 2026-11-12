import Clutter from 'gi://Clutter';
import GLib from 'gi://GLib';
import Shell from 'gi://Shell';
import St from 'gi://St';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

export class PanelLayout {
    constructor(extension, makeOverflow, addEntry) {
        this.ext = extension; this.ctx = extension._ctx; this.signals = []; this.off = this.ctx.config.onChange(() => this.queue());
        this.leftMore = makeOverflow('Más menús'); this.rightMore = makeOverflow('Más indicadores');
        Main.panel.addToStatusArea('lintel-menu-overflow', this.leftMore, -1, 'left');
        Main.panel.addToStatusArea('lintel-indicator-overflow', this.rightMore, 0, 'right');
        this.addEntry = addEntry;
        this.leftMore.beforeOpen(() => this.fill(this.leftMore, this.hiddenLeft));
        this.rightMore.beforeOpen(() => this.fill(this.rightMore, this.hiddenRight));
        for (const [object, event] of [[Main.layoutManager, 'monitors-changed'], [Main.panel, 'notify::allocation'],
            [global.display, 'in-fullscreen-changed'], [Main.overview, 'showing'], [Main.overview, 'hidden']])
            this.signals.push([object, object.connect(event, () => this.queue())]);
        this.edge = new St.Widget({reactive: true, visible: false});
        Main.layoutManager.addChrome(this.edge, {affectsStruts: false, trackFullscreen: false});
        this.signals.push([this.edge, this.edge.connect('enter-event', () => { this.reveal(); return Clutter.EVENT_PROPAGATE; })]);
        this.signals.push([Main.panel, Main.panel.connect('leave-event', () => { this.scheduleHide(); return Clutter.EVENT_PROPAGATE; })]);
        this.signals.push([Main.panel, Main.panel.connect('enter-event', () => { this.reveal(); return Clutter.EVENT_PROPAGATE; })]);
        this.initialTranslation = Main.layoutManager.panelBox.translation_y;
        for (const [, button] of extension._right) this.signals.push([button.menu, button.menu.connect('open-state-changed', (_, open) => open ? this.reveal() : this.scheduleHide())]);
        this.queue();
    }
    queue() {
        if (this.dead || this.timer) return;
        this.timer = this.ctx.later(100, () => { this.timer = 0; this.layout(); });
    }
    fill(overflow, entries = []) {
        overflow.menu.removeAll();
        for (const button of entries) this.addEntry(overflow.menu, {label: button._text?.text || button.accessible_name || 'Control'}, () => {
            const menu = button.menu, original = menu.sourceActor;
            menu.sourceActor = overflow;
            const id = menu.connect('open-state-changed', (_, open) => { if (!open) { menu.sourceActor = original; menu.disconnect(id); } });
            this.ctx.later(0, () => menu.open());
        });
    }
    visible(id, button) {
        const c = this.ctx, policy = c.config.values.visibility[id];
        if (policy === 'never') return false;
        const available = {privacy: c.privacy.active, keyboard: button._sources?.().length > 1,
            wifi: !!c.wifi.device, bluetooth: c.bluetooth.available, sound: c.sound.ready};
        if (available[id] === false) return false;
        if (policy !== 'active') return true;
        return ({wifi: !!c.wifi.activeSsid, bluetooth: c.bluetooth.paired.some(d => d.connected),
            sound: !c.sound.muted, battery: (button._proxy?.Percentage ?? 100) < 25 || button._proxy?.State === 1})[id] ?? true;
    }
    layout() {
        if (this.dead) return;
        const monitor = Main.layoutManager.primaryMonitor;
        if (!monitor) return;
        const values = this.ctx.config.values;
        const scale = St.ThemeContext.get_for_stage(global.stage).scale_factor;
        const island = Main.extensionManager.lookup('dynamic-island-gnome50@local')?.stateObj;
        const notch = island ? (island._notch?.w ?? 300) : 0;
        const budget = (monitor.width - notch) / 2 - 18 * scale;
        const width = button => button.container.get_preferred_width(-1)[1];
        this.ext._name._text.set_style('max-width: 150px;');
        this.hiddenLeft = [];
        let used = width(this.ext._apple) + width(this.ext._name) + width(this.leftMore);
        for (const button of this.ext._dyn) {
            used += width(button);
            const show = used <= budget;
            button.container.visible = show;
            if (!show) this.hiddenLeft.push(button);
        }
        this.leftMore.container.visible = this.hiddenLeft.length > 0;
        const order = [...this.ext._right].sort((a, b) => values.indicators.indexOf(a[0].slice(7)) - values.indicators.indexOf(b[0].slice(7)));
        const rightBox = Main.panel._rightBox;
        order.forEach(([, button], index) => {
            button.set_style(`-natural-hpadding: ${values.spacing}px; -minimum-hpadding: 3px;`);
            if (rightBox.get_children().indexOf(button.container) !== index + 1) rightBox.set_child_at_index(button.container, index + 1);
        });
        const own = new Set([...order.map(([, b]) => b.container), this.rightMore.container]);
        used = rightBox.get_children().filter(child => !own.has(child) && child.visible).reduce((total, child) => total + child.get_preferred_width(-1)[1], 0);
        const visible = order.filter(([role, b]) => this.visible(role.slice(7), b));
        const keep = new Set(visible.map(([, b]) => b));
        used += visible.reduce((total, [, b]) => total + width(b), 0);
        this.hiddenRight = [];
        if (used > budget) {
            used += width(this.rightMore);
            for (const [role, button] of visible) {
                if (used <= budget) break;
                if (['lintel-cc', 'lintel-clock', 'lintel-privacy'].includes(role)) continue;
                used -= width(button); keep.delete(button); this.hiddenRight.push(button);
            }
        }
        for (const [, button] of order) button.container.visible = keep.has(button);
        this.rightMore.container.visible = this.hiddenRight.length > 0;
        this.edge.set_position(monitor.x, monitor.y); this.edge.set_size(monitor.width, 2);
        this.edge.visible = values.autohide !== 'never';
        this.scheduleHide();
    }
    reveal() {
        this.ctx.cancel(this.hideTimer); this.hideTimer = 0;
        Main.layoutManager.panelBox.remove_all_transitions();
        Main.layoutManager.panelBox.ease({translation_y: this.initialTranslation, duration: this.motion(), mode: Clutter.AnimationMode.EASE_OUT_CUBIC});
    }
    motion() { return this.ctx.config.values.reducedMotion || !St.Settings.get().enable_animations ? 0 : 160; }
    scheduleHide() {
        this.ctx.cancel(this.hideTimer);
        this.hideTimer = this.ctx.later(600, () => {
            this.hideTimer = 0;
            const mode = this.ctx.config.values.autohide;
            const monitor = Main.layoutManager.primaryMonitor;
            const [x, y] = global.get_pointer();
            const over = monitor && x >= monitor.x && x < monitor.x + monitor.width && y < monitor.y + Main.panel.height;
            const hide = mode !== 'never' && !Main.overview.visible && !Main.panel.menuManager.activeMenu && !over &&
                (mode === 'always' || monitor?.inFullscreen);
            Main.layoutManager.panelBox.ease({translation_y: hide ? -Main.panel.height : this.initialTranslation, duration: this.motion(), mode: Clutter.AnimationMode.EASE_OUT_CUBIC});
        });
    }
    destroy() {
        this.dead = true; this.ctx.cancel(this.timer); this.ctx.cancel(this.hideTimer); this.off();
        this.signals.forEach(([object, signal]) => object.disconnect(signal));
        this.leftMore.destroy(); this.rightMore.destroy(); this.edge.destroy();
        Main.layoutManager.panelBox.remove_all_transitions(); Main.layoutManager.panelBox.translation_y = this.initialTranslation;
    }
}

export class AdaptiveContrast {
    constructor(config, apply) {
        this.config = config; this.apply = apply; this.light = null; this.dead = false;
        this.off = config.onChange(() => this.update()); this.update();
    }
    update() {
        if (this.timer) GLib.source_remove(this.timer);
        this.timer = 0;
        const c = this.config.values;
        if (this.dead || !c.adaptiveContrast || c.texto !== 'auto' || c.colorTexto || c.colorIconos) return;
        const sample = async () => {
            if (this.busy || this.dead || Main.panel.menuManager.activeMenu) return;
            this.busy = true;
            try {
                const monitor = Main.layoutManager.primaryMonitor;
                const shot = new Shell.Screenshot();
                const [color] = await shot.pick_color(Math.floor(monitor.x + monitor.width * 0.35), monitor.y + 1);
                const luminance = (color.red * .2126 + color.green * .7152 + color.blue * .0722) / 255;
                const light = this.light === null ? luminance < .5 : this.light ? luminance < .62 : luminance < .38;
                if (!this.dead && light !== this.light) { this.light = light; this.apply(); }
            } catch (error) { this.light = null; }
            finally { this.busy = false; }
        };
        this.timer = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 3, () => { sample(); return GLib.SOURCE_CONTINUE; }); sample();
    }
    destroy() { this.dead = true; this.off(); if (this.timer) GLib.source_remove(this.timer); }
}
