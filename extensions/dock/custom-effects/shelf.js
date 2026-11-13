




import {Clutter, Shell, St} from '../dependencies/gi.js';

import {watchAppearance} from './appearance.js';

export class GlassShelf {
    constructor(dash, settings) {
        this._dash = dash;
        this._settings = settings;
        this._inset = 8;
        this._a = 0;
        this._b = 0;
        this._ids = [];

        const bg = dash._background;
        this.blur = new St.Widget({
            name: 'dashtodockGlassBlur', reactive: false,
            style: 'background-color: rgba(0, 0, 0, 0.004);',
        });
        const bind = (coordinate, offset) => {
            const c = new Clutter.BindConstraint({source: bg, coordinate, offset});
            this.blur.add_constraint(c);
            return c;
        };
        this._cx = bind(Clutter.BindCoordinate.X, this._inset);
        this._cy = bind(Clutter.BindCoordinate.Y, this._inset);
        this._cw = bind(Clutter.BindCoordinate.WIDTH, -2 * this._inset);
        this._ch = bind(Clutter.BindCoordinate.HEIGHT, -2 * this._inset);
        dash.insert_child_below(this.blur, bg);
        this.blur.connect('notify::allocation', () => this._applyOffsets());

        for (const key of ['glass-shelf', 'glass-blur'])
            this._ids.push(settings.connect(`changed::${key}`, () => this._sync()));
        this._styleId = bg.connect('style-changed', () => this._syncInset());
        this._appearance = watchAppearance(dash, settings, state => {
            this._contrast = state.contrast;
            this._sync();
        });
    }

    destroy() {
        this._appearance();
        for (const id of this._ids)
            this._settings.disconnect(id);
        this._ids = [];
        const bg = this._dash._background;
        if (bg && this._styleId)
            bg.disconnect(this._styleId);
        this._styleId = 0;
        this._dash.remove_style_class_name('mac-shelf');
        this.blur.clear_effects();
        this.blur.destroy();
        this.blur = null;
    }


    setStretch(a, b) {
        if (this._a === a && this._b === b) return;
        this._a = a;
        this._b = b;
        this._applyOffsets();
    }

    _applyOffsets() {
        const horizontal = this._dash._isHorizontal;
        const size = horizontal ? this.blur.width : this.blur.height;
        const stretch = size > 0 ? Math.max(0, size + this._b - this._a) / size : 1;
        this.blur.set_pivot_point(0, 0);
        this.blur.scale_x = horizontal ? stretch : 1;
        this.blur.scale_y = horizontal ? 1 : stretch;
        this.blur.translation_x = horizontal ? this._a : 0;
        this.blur.translation_y = horizontal ? 0 : this._a;
    }

    _syncInset() {
        try {
            const r = this._dash._background.get_theme_node().get_border_radius(St.Corner.TOPLEFT);
            const inset = Math.ceil(r * 0.3) + 1;
            if (inset !== this._inset && inset >= 0 && inset < 40) {
                this._inset = inset;
                this._cx.offset = this._cy.offset = inset;
                this._cw.offset = this._ch.offset = -2 * inset;
                this._applyOffsets();
            }
        } catch (_e) {

        }
    }

    _sync() {
        const enabled = this._settings.get_boolean('glass-shelf');
        if (enabled)
            this._dash.add_style_class_name('mac-shelf');
        else
            this._dash.remove_style_class_name('mac-shelf');

        this.blur.clear_effects();
        const strength = this._settings.get_int('glass-blur');
        this.blur.visible = enabled && strength > 0 && !this._contrast;
        if (!this.blur.visible)
            return;
        try {
            const fx = new Shell.BlurEffect({mode: Shell.BlurMode.BACKGROUND});
            const sigma = Math.max(2, strength);
            if ('sigma' in fx)
                fx.sigma = sigma;
            else if ('radius' in fx)
                fx.radius = sigma * 2;
            fx.brightness = 0.96;
            this.blur.add_effect(fx);
        } catch (e) {
            console.error(`[Dock macOS 27] desenfoque no disponible: ${e.message}`);
        }
    }
}
