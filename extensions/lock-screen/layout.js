import Clutter from 'gi://Clutter';
import GObject from 'gi://GObject';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

export const LockLayout = GObject.registerClass(class AureaLockLayout extends Clutter.LayoutManager {
    _init(dialog, profile) { super._init(); this.dialog = dialog; this.profile = profile; }

    vfunc_allocate(_container, box) {
        const [width, height] = box.get_size();
        const {dialog} = this;
        const allocate = (actor, y, maxHeight = height) => {
            const [, , naturalWidth, naturalHeight] = actor.get_preferred_size();
            const w = Math.min(width - 48, naturalWidth);
            const h = Math.min(maxHeight, naturalHeight);
            const bounds = new Clutter.ActorBox({x1: (width - w) / 2, y1: y, x2: (width + w) / 2, y2: y + h});
            actor.allocate(bounds);
            return h;
        };
        const top = Math.max(32, Math.min(96, height * 0.075));
        const keyboard = Main.layoutManager.keyboardBox;
        const keyboardHeight = keyboard?.visible && keyboard.mapped ? keyboard.height : 0;
        const showClock = height - keyboardHeight >= 560;
        dialog._clock.opacity = showClock ? 255 : 0;
        const clockHeight = showClock ? allocate(dialog._clock, top) : 0;
        const contentTop = showClock ? top + clockHeight + 24 : 24;
        const bottom = height - keyboardHeight - Math.max(32, height * 0.06);
        const [, , , promptHeight] = dialog._stack.get_preferred_size();
        const promptTop = Math.max(contentTop, bottom - promptHeight);
        allocate(dialog._stack, promptTop, Math.max(0, bottom - promptTop));
        const [, , , profileHeight] = this.profile.get_preferred_size();
        allocate(this.profile, Math.max(contentTop, bottom - profileHeight));
        dialog._notificationsBox.opacity = showClock ? 255 : 0;
        allocate(dialog._notificationsBox, top + clockHeight + 32,
            Math.max(0, promptTop - top - clockHeight - 56));
        if (dialog._otherUserButton.visible) {
            const [, , w, h] = dialog._otherUserButton.get_preferred_size();
            dialog._otherUserButton.allocate(new Clutter.ActorBox({
                x1: width - w - 28, y1: bottom - h, x2: width - 28, y2: bottom,
            }));
        }
    }
});
