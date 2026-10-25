// Estante de vidrio del dock (macOS 27): desenfoque real del fondo + estilo CSS.
//
// El desenfoque de Shell es rectangular; se recorta por dentro del radio de las
// esquinas (inset ≈ 0,3 × radio) para que nunca asome fuera del borde redondeado.

import {Clutter, Shell, St} from '../dependencies/gi.js';

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

        for (const key of ['glass-shelf', 'glass-blur'])
            this._ids.push(settings.connect(`changed::${key}`, () => this._sync()));
        this._styleId = bg.connect('style-changed', () => this._syncInset());
        this._sync();
    }

    destroy() {
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

    // Estiramiento del estante cuando el dock se ensancha (ver magnification.js).
    setStretch(a, b) {
        this._a = a;
        this._b = b;
        this._applyOffsets();
    }

    _applyOffsets() {
        const horizontal = this._dash._isHorizontal;
        const i = this._inset;
        const grow = this._b - this._a;
        this._cx.offset = i + (horizontal ? this._a : 0);
        this._cy.offset = i + (horizontal ? 0 : this._a);
        this._cw.offset = -2 * i + (horizontal ? grow : 0);
        this._ch.offset = -2 * i + (horizontal ? 0 : grow);
    }

    _syncInset() {
        try {
            const r = this._dash._background.get_theme_node().get_border_radius(St.Corner.TOPLEFT);
            const inset = Math.ceil(r * 0.3) + 1;
            if (inset !== this._inset && inset >= 0 && inset < 40) {
                this._inset = inset;
                this._applyOffsets();
            }
        } catch (_e) {
            // se conserva el valor anterior
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
        this.blur.visible = enabled && strength > 0;
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
