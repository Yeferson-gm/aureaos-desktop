import {PasswordKeyboardPolicy} from './keyboardPolicy.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import {LoginDialog} from 'resource:///org/gnome/shell/gdm/loginDialog.js';
import * as SystemActions from 'resource:///org/gnome/shell/misc/systemActions.js';
import {Extension, InjectionManager} from 'resource:///org/gnome/shell/extensions/extension.js';
import {placePrompt, PowerControls} from './presentation.js';

export default class LoginPresentation extends Extension {
    enable() {
        this._keyboardPolicy = new PasswordKeyboardPolicy();
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
            try { extension._dialogs.get(this)?.controls.allocate(area, allocation); }
            catch (error) { console.error('Aurea Login: controles inferiores', error); }
            return allocation;
        });
        if (Main.screenShield?._dialog instanceof LoginDialog)
            this._decorate(Main.screenShield._dialog);
    }

    _decorate(dialog, actions = null) {
        if (this._dialogs.has(dialog)) return;
        let controls;
        try {
            controls = new PowerControls(actions ?? SystemActions.getDefault());
            dialog.add_child(controls.actor);
        } catch (error) {
            controls?.destroy();
            console.error('Aurea Login: se conserva el acceso nativo', error);
            return;
        }
        const destroy = dialog.connect('destroy', () => {
            controls.destroy();
            this._dialogs.delete(dialog);
        });
        this._dialogs.set(dialog, {controls, destroy});
        dialog.queue_relayout();
    }

    disable() {
        this._keyboardPolicy.destroy();
        this._keyboardPolicy = null;
        this._injections.clear();
        for (const [dialog, {controls, destroy}] of this._dialogs) {
            dialog.disconnect(destroy);
            controls.destroy();
            dialog.queue_relayout();
        }
        this._dialogs.clear();
    }
}
