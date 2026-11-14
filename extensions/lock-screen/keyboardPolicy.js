import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import {Keyboard} from 'resource:///org/gnome/shell/ui/keyboard.js';
import {InjectionManager} from 'resource:///org/gnome/shell/extensions/extension.js';

export class PasswordKeyboardPolicy {
    constructor(blocked = () => Main.sessionMode.isGreeter || Main.sessionMode.isLocked) {
        this._blocked = blocked;
        this._injections = new InjectionManager();
        for (const method of ['open', '_open', 'gestureProgress']) {
            this._injections.overrideMethod(Keyboard.prototype, method, original => function (...args) {
                if (blocked()) {
                    this.close(true);
                    return;
                }
                return original.call(this, ...args);
            });
        }
        this._modeSignal = Main.sessionMode.connect('updated', () => this._close());
        this._close();
    }

    _close() {
        if (this._blocked()) Main.keyboard.keyboardActor?.close(true);
    }

    destroy() {
        Main.sessionMode.disconnect(this._modeSignal);
        this._injections.clear();
    }
}
