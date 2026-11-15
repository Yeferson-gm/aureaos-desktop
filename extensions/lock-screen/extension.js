import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import LockScreen from './lock.js';
import LoginPresentation from './login.js';

export default class SessionScreens extends LockScreen {
    enable() {
        if (Main.sessionMode.isGreeter) {
            this._login = new LoginPresentation(this.metadata);
            this._login.enable();
        } else {
            super.enable();
        }
    }

    disable() {
        if (this._login) {
            this._login.disable();
            this._login = null;
        } else {
            super.disable();
        }
    }
}
