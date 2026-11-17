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
        this._injections.overrideMethod(proto, '_getCenterActorAllocation', original => function (area, actor, ...args) {
            const allocation = original.call(this, area, actor, ...args);
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
        const prompt = dialog._authPrompt;
        const alignment = [];
        const originalTranslation = prompt?._mainBox?.translation_x ?? 0;
        if (prompt?._inputWell && prompt?._entryArea) {
            const alignEntry = () => {
                if (!prompt._entry?.mapped || !prompt._mainBox?.mapped) return;
                const [px] = prompt.get_transformed_position();
                const [ex] = prompt._entry.get_transformed_position();
                const [pw] = prompt.get_transformed_size();
                const [ew] = prompt._entry.get_transformed_size();
                prompt._mainBox.translation_x += px + pw / 2 - ex - ew / 2;
            };
            for (const actor of [prompt, prompt._entryArea])
                alignment.push([actor, actor.connect('notify::allocation', alignEntry)]);
        }
        const destroy = dialog.connect('destroy', () => {
            for (const [actor, id] of alignment) actor.disconnect(id);
            controls.destroy();
            this._dialogs.delete(dialog);
        });
        this._dialogs.set(dialog, {controls, destroy, alignment, originalTranslation});
        dialog.queue_relayout();
    }

    disable() {
        this._keyboardPolicy.destroy();
        this._keyboardPolicy = null;
        this._injections.clear();
        for (const [dialog, {controls, destroy, alignment, originalTranslation}] of this._dialogs) {
            for (const [actor, id] of alignment) actor.disconnect(id);
            if (dialog._authPrompt?._mainBox) dialog._authPrompt._mainBox.translation_x = originalTranslation;
            dialog.disconnect(destroy);
            controls.destroy();
            dialog.queue_relayout();
        }
        this._dialogs.clear();
    }
}
