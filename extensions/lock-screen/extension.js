import Clutter from 'gi://Clutter';
import GDesktopEnums from 'gi://GDesktopEnums';
import Meta from 'gi://Meta';
import St from 'gi://St';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as UnlockDialog from 'resource:///org/gnome/shell/ui/unlockDialog.js';
import * as UserWidget from 'resource:///org/gnome/shell/ui/userWidget.js';
import {Extension, InjectionManager} from 'resource:///org/gnome/shell/extensions/extension.js';
import {LockLayout} from './layout.js';

export default class LockScreen extends Extension {
    enable() {
        this._dialogs = new Map();
        this._injections = new InjectionManager();
        const extension = this;
        const proto = UnlockDialog.UnlockDialog.prototype;
        this._injections.overrideMethod(proto, '_init', original => function (...args) {
            original.call(this, ...args); extension._decorate(this);
        });
        this._injections.overrideMethod(proto, '_createBackground', () => function (index) {
            const monitor = Main.layoutManager.monitors[index];
            const container = new St.Widget({x: monitor.x, y: monitor.y, width: monitor.width, height: monitor.height});
            const background = new Meta.Background({meta_display: global.display});
            background.set_file(extension.dir.get_child('assets/WhiteSur-dark.jpg'), GDesktopEnums.BackgroundStyle.ZOOM);
            const actor = new Meta.BackgroundActor({meta_display: global.display, monitor: index, width: monitor.width, height: monitor.height});
            actor.content.set({background, vignette: false, brightness: 1});
            container.add_child(actor);
            this._backgroundGroup.add_child(container);
        });
        this._injections.overrideMethod(proto, '_setTransitionProgress', original => function (progress) {
            original.call(this, progress);
            if (!extension._dialogs.has(this)) return;
            this._clock.set({visible: true, opacity: 255, scale_x: 1, scale_y: 1, translation_y: 0});
            extension._dialogs.get(this).profile.set({visible: progress < 1, opacity: Math.round(255 * (1 - progress))});
        });
        const dialog = Main.screenShield?._dialog;
        if (dialog instanceof UnlockDialog.UnlockDialog) {
            this._decorate(dialog); dialog._updateBackgrounds();
        }
    }

    _decorate(dialog) {
        if (this._dialogs.has(dialog)) return;
        const box = dialog._stack.get_parent();
        const profile = new St.BoxLayout({orientation: Clutter.Orientation.VERTICAL, style_class: 'aurea-lock-profile'});
        profile.add_child(new UserWidget.UserWidget(dialog._user, Clutter.Orientation.VERTICAL));
        const state = {box, profile, layout: box.layout_manager};
        this._dialogs.set(dialog, state);
        dialog.add_style_class_name('aurea-lock');
        dialog._stack.remove_child(dialog._clock);
        box.add_child(dialog._clock);
        dialog._clock.set_child_below_sibling(dialog._clock._date, dialog._clock._time);
        dialog._clock.remove_child(dialog._clock._hint);
        profile.add_child(dialog._clock._hint);
        box.add_child(profile);
        box.layout_manager = new LockLayout(dialog, profile);
        const keyboard = Main.layoutManager.keyboardBox;
        state.keyboardSignals = ['notify::height', 'notify::visible', 'notify::mapped'].map(signal =>
            keyboard.connect(signal, () => box.queue_relayout()));
        state.disconnectKeyboard = () => {
            for (const id of state.keyboardSignals.splice(0)) keyboard.disconnect(id);
        };
        state.destroy = dialog.connect('destroy', () => {
            state.disconnectKeyboard(); this._dialogs.delete(dialog);
        });
        dialog._setTransitionProgress(dialog._adjustment.value);
    }

    disable() {
        this._injections.clear();
        for (const [dialog, state] of this._dialogs) {
            dialog.disconnect(state.destroy);
            state.disconnectKeyboard();
            state.box.layout_manager = state.layout;
            state.profile.remove_child(dialog._clock._hint);
            dialog._clock.add_child(dialog._clock._hint);
            dialog._clock.set_child_above_sibling(dialog._clock._date, dialog._clock._time);
            state.box.remove_child(dialog._clock);
            dialog._stack.add_child(dialog._clock);
            state.profile.destroy();
            dialog._notificationsBox.opacity = 255;
            dialog.remove_style_class_name('aurea-lock');
            dialog._setTransitionProgress(dialog._adjustment.value);
            dialog._updateBackgrounds();
        }
        this._dialogs.clear(); this._injections = null;
    }
}
