import Meta from 'gi://Meta';
import Shell from 'gi://Shell';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';

import {Escritorio} from './lib/escritorio.js';

export default class WidgetsDelEscritorio extends Extension {
    enable() {
        this._esc = new Escritorio(this);
        this._esc.iniciar();
        try {
            Main.wm.addKeybinding('alternar-edicion', this.getSettings(),
                Meta.KeyBindingFlags.IGNORE_AUTOREPEAT, Shell.ActionMode.NORMAL | Shell.ActionMode.OVERVIEW,
                () => this._esc.modoEdicion(!this._esc.editando));
            this._atajo = true;
        } catch (e) {
            console.error(`[Widgets] atajo no disponible: ${e.message}`);
            this._atajo = false;
        }
    }

    disable() {
        if (this._atajo)
            Main.wm.removeKeybinding('alternar-edicion');
        this._atajo = false;
        this._esc?.detener();
        this._esc = null;
    }
}
