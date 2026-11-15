import Clutter from 'gi://Clutter';
import St from 'gi://St';

export function placePrompt(area, allocation) {
    const height = allocation.y2 - allocation.y1;
    const available = area.y2 - area.y1;
    const top = Math.round(area.y1 + available * 0.14);
    if (top + height + 120 <= area.y2) {
        allocation.y1 = top;
        allocation.y2 = top + height;
    }
    return allocation;
}

export class PowerControls {
    constructor(actions) {
        this.actor = new St.BoxLayout({style_class: 'aurea-login-power'});
        this._actions = actions;
        this._signals = [];
        this.buttons = [];
        const entries = [
            ['Apagar equipo', 'system-shutdown-symbolic', 'can-power-off', 'activatePowerOff'],
            ['Reiniciar', 'system-reboot-symbolic', 'can-restart', 'activateRestart'],
            ['Reposo', 'media-playback-pause-symbolic', 'can-suspend', 'activateSuspend'],
        ];
        for (const [label, icon, property, method] of entries) {
            const content = new St.BoxLayout({orientation: Clutter.Orientation.VERTICAL, style_class: 'aurea-login-power-content'});
            content.add_child(new St.Icon({icon_name: icon, style_class: 'aurea-login-power-icon', x_align: Clutter.ActorAlign.CENTER}));
            content.add_child(new St.Label({text: label, x_align: Clutter.ActorAlign.CENTER}));
            const button = new St.Button({child: content, style_class: 'aurea-login-power-button', accessible_name: label, track_hover: true});
            const available = () => Boolean(actions[property.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())]);
            const sync = () => button.set({reactive: available(), can_focus: available(), opacity: available() ? 255 : 90});
            button.connect('clicked', () => {
                if (!available()) return;
                try { actions[method](); } catch (error) { console.error(`Aurea Login: ${method}`, error); }
            });
            this._signals.push(actions.connect(`notify::${property}`, sync));
            this.actor.add_child(button);
            this.buttons.push(button);
            sync();
        }
        actions.forceUpdate();
    }

    allocate(area, nativeControls) {
        const [, , width, height] = this.actor.get_preferred_size();
        const margin = Math.max(20, (area.y2 - area.y1) * 0.045);
        const x = Math.round((area.x1 + area.x2 - width) / 2);
        const y = Math.round(area.y2 - height - margin);
        const right = x + width;
        const overlaps = nativeControls && nativeControls.x2 > nativeControls.x1 &&
            x < nativeControls.x2 && right > nativeControls.x1;
        this.actor.visible = !overlaps && area.y2 - area.y1 >= 480 && width <= area.x2 - area.x1;
        if (!this.actor.visible) return;
        this.actor.allocate(new Clutter.ActorBox({x1: x, y1: y, x2: x + width, y2: y + height}));
    }

    destroy() {
        for (const signal of this._signals.splice(0)) this._actions.disconnect(signal);
        this.actor.destroy();
    }
}
