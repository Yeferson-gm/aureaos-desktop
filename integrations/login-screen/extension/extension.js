import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import {LoginDialog} from 'resource:///org/gnome/shell/gdm/loginDialog.js';
import * as SystemActions from 'resource:///org/gnome/shell/misc/systemActions.js';
import {Extension, InjectionManager} from 'resource:///org/gnome/shell/extensions/extension.js';
import {placePrompt, PowerControls} from './presentation.js';

export default class LoginPresentation extends Extension {
    enable() {
        this._dialogs = new Map();
        this._injections = new InjectionManager();
        const extension = this;
        const proto = LoginDialog.prototype;
        this._injections.overrideMethod(proto, '_init', original => function (...args) {
            original.call(this, ...args);
            extension._decorate(this);
        });
        this._injections.overrideMethod(proto, '_getCenterActorAllocation', original => function (area, actor) {
            const allocation = original.call(this, area, actor);
            return actor === this._authPrompt ? placePrompt(area, allocation) : allocation;
        });
        this._injections.overrideMethod(proto, '_getBottomButtonGroupAllocation', original => function (area) {
            const allocation = original.call(this, area);
            extension._dialogs.get(this)?.controls.allocate(area, allocation);
            return allocation;
        });
        if (Main.screenShield?._dialog instanceof LoginDialog)
            this._decorate(Main.screenShield._dialog);
    }

    _decorate(dialog, actions = SystemActions.getDefault()) {
        if (this._dialogs.has(dialog)) return;
        const controls = new PowerControls(actions);
        dialog.add_child(controls.actor);
        const destroy = dialog.connect('destroy', () => {
            controls.destroy();
            this._dialogs.delete(dialog);
        });
        this._dialogs.set(dialog, {controls, destroy});
        dialog.queue_relayout();
    }

    disable() {
        this._injections.clear();
        for (const [dialog, {controls, destroy}] of this._dialogs) {
            dialog.disconnect(destroy);
            controls.destroy();
            dialog.queue_relayout();
        }
        this._dialogs.clear();
    }
}
