import Clutter from 'gi://Clutter';
import GLib from 'gi://GLib';
import Shell from 'gi://Shell';
import St from 'gi://St';
import * as BoxPointer from 'resource:///org/gnome/shell/ui/boxpointer.js';

let lastClosed = 0;
export class MenuSurface {
    constructor(menu, before, getTheme) {
        this.menu = menu; this.getTheme = getTheme;
        menu.actor.set_offscreen_redirect(0);
        this.stack = new St.Widget({layout_manager: new Clutter.BinLayout()});
        this.glass = new St.Widget({reactive: false, clip_to_allocation: true, style: 'background-color: rgba(0,0,0,0.004);'});
        this.blur = new Shell.BlurEffect({mode: Shell.BlurMode.BACKGROUND}); this.glass.add_effect(this.blur);
        const bin = menu._boxPointer.bin;
        bin.set_child(null); bin.set_child(this.stack);
        this.stack.add_child(this.glass); this.stack.add_child(menu.box);
        this.allocation = this.stack.connect('notify::allocation', () => this.size());
        const open = menu.open.bind(menu), close = menu.close.bind(menu);
        menu.open = () => {
            if (menu.isOpen) return;
            const resuming = menu.actor.visible && menu.actor.opacity > 0 && menu.actor.opacity < 255;
            const opacity = menu.actor.opacity;
            before(); this.apply();
            menu.actor.remove_all_transitions(); menu.actor.translation_y = 0; menu.actor.scale_x = menu.actor.scale_y = 1;
            open(BoxPointer.PopupAnimation.NONE);
            const event = Clutter.get_current_event();
            const keyboard = [Clutter.EventType.KEY_PRESS, Clutter.EventType.KEY_RELEASE].includes(event?.type());
            const duration = keyboard ? 0 : resuming ? Math.min(120, this.duration()) : GLib.get_monotonic_time() - lastClosed < 180000 ? 0 : this.duration();
            if (duration) {
                menu.actor.opacity = resuming ? opacity : 0; menu.actor.translation_y = resuming ? 0 : -5;
                menu.actor.ease({opacity: 255, translation_y: 0, duration, mode: Clutter.AnimationMode.EASE_OUT_CUBIC});
            }
            this.blur.set_enabled(this.glass.visible);
        };
        menu.close = () => {
            if (!menu.isOpen) return;
            lastClosed = GLib.get_monotonic_time();
            menu.actor.remove_all_transitions(); menu.actor.translation_y = 0;
            close(this.duration() ? BoxPointer.PopupAnimation.FADE : BoxPointer.PopupAnimation.NONE);
            this.blur.set_enabled(false);
        };
        const destroy = menu.destroy.bind(menu);
        menu.destroy = () => {
            if (this.dead) return;
            this.dead = true;
            menu.actor.remove_all_transitions();
            close(BoxPointer.PopupAnimation.NONE);
            this.stack.disconnect(this.allocation);
            menu.actor.hide();
            GLib.idle_add(GLib.PRIORITY_LOW, () => {
                destroy();
                this.blur = null;
                return GLib.SOURCE_REMOVE;
            });
        };
    }
    duration() {
        const t = this.getTheme();
        if (t.reducedMotion || !St.Settings.get().enable_animations) return 0;
        return this.menu.actor.has_style_class_name('lintel-cc-menu') ? t.animMs : Math.min(60, t.animMs);
    }
    size() {
        if (this.dead) return;
        const inset = this.menu.actor.has_style_class_name('lintel-cc-menu') ? 20 : 12;
        this.glass.set_position(inset, inset);
        this.glass.set_size(Math.max(0, this.stack.width - inset * 2), Math.max(0, this.stack.height - inset * 2));
    }
    apply() {
        if (this.dead) return;
        const t = this.getTheme(), high = t.contrast || St.Settings.get().high_contrast;
        const glass = t.material === 'glass' && !high && t.blur > 0;
        this.glass.visible = glass; this.blur.set_enabled(glass && this.menu.isOpen);
        if ('sigma' in this.blur) this.blur.sigma = t.blur ?? 18;
        else this.blur.radius = (t.blur ?? 18) * 2;
        this.blur.brightness = 1;
        const alpha = glass ? Math.max(0.55, t.opacity ?? 0.72) : 1;
        const rgb = t.menuDark ? '29,32,38' : '244,246,250';
        this.menu.box.set_style(`background-color: rgba(${rgb},${alpha}); background-gradient-direction: none; border-color: ${t.menuDark ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.65)'};`);
        this.size();
    }
}
