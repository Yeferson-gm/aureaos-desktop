import {Clutter, St} from '../dependencies/gi.js';

export class IconResolution {
    constructor() { this._icons = new Map(); }

    prepare(icon, size, maximum) {
        if (!(icon instanceof St.Icon)) return;
        let state = this._icons.get(icon);
        if (!state) {
            const native = new St.Icon({gicon: icon.gicon, fallback_gicon: icon.fallback_gicon,
                icon_size: size, style_class: icon.style_class, reactive: false,
                x_align: Clutter.ActorAlign.CENTER, y_align: Clutter.ActorAlign.CENTER});
            state = {originalSize: icon.icon_size, originalWidth: icon.width, originalHeight: icon.height,
                native, enlarged: false, textures: new Map()};
            this._icons.set(icon, state);
            state.added = icon.connect('child-added', (_icon, texture) => this._sizeTexture(texture, state));
            state.destroyed = icon.connect('destroy', () => this._icons.delete(icon));
            state.identity = icon.connect('notify::gicon', () => { native.gicon = icon.gicon; });
            state.fallback = icon.connect('notify::fallback-gicon', () => { native.fallback_gicon = icon.fallback_gicon; });
            state.style = icon.connect('notify::style-class', () => { native.style_class = icon.style_class; });
            icon.add_child(native);
        }
        const scale = St.ThemeContext.get_for_stage(global.stage).scale_factor;
        const allocation = size * scale;
        const resolution = Math.ceil(size * maximum);
        if (state.allocation === allocation && state.resolution === resolution) return;
        state.allocation = allocation;
        state.resolution = resolution;
        state.native.icon_size = size;
        state.native.set_size(allocation, allocation);
        icon.set_size(allocation, allocation);
        icon.icon_size = resolution;
        for (const texture of icon.get_children()) this._sizeTexture(texture, state);
        this.update(icon, icon.get_parent()?.scale_x ?? 1);
    }

    _sizeTexture(texture, state) {
        if (!state.allocation || texture === state.native) return;
        texture.set_size(state.allocation, state.allocation);
        texture.set_content_scaling_filters(Clutter.ScalingFilter.TRILINEAR, Clutter.ScalingFilter.LINEAR);
        if (!state.textures.has(texture)) {
            state.textures.set(texture, texture.connect('destroy', () => state.textures.delete(texture)));
        }
        texture.opacity = state.enlarged ? 255 : 0;
    }

    update(icon, scale) {
        const state = this._icons.get(icon);
        if (!state) return;
        const enlarged = scale > 1.001;
        if (state.enlarged === enlarged) return;
        state.enlarged = enlarged;
        state.native.opacity = state.enlarged ? 0 : 255;
        for (const texture of state.textures.keys()) texture.opacity = state.enlarged ? 255 : 0;
    }

    destroy() {
        for (const [icon, state] of this._icons) {
            for (const signal of [state.added, state.destroyed, state.identity, state.fallback, state.style])
                icon.disconnect(signal);
            for (const [texture, signal] of state.textures) {
                texture.disconnect(signal);
                texture.opacity = 255;
            }
            state.native.destroy();
            icon.icon_size = state.originalSize;
            icon.set_size(state.originalWidth, state.originalHeight);
        }
        this._icons.clear();
    }
}
