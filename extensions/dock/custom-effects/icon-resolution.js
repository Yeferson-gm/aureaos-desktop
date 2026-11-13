import {Clutter, St} from '../dependencies/gi.js';

export class IconResolution {
    constructor() { this._icons = new Map(); }

    prepare(icon, size, maximum) {
        if (!(icon instanceof St.Icon)) return;
        let state = this._icons.get(icon);
        if (!state) {
            state = {originalSize: icon.icon_size, originalWidth: icon.width, originalHeight: icon.height};
            this._icons.set(icon, state);
            state.added = icon.connect('child-added', (_icon, texture) => this._sizeTexture(texture, state));
            state.destroyed = icon.connect('destroy', () => this._icons.delete(icon));
        }
        const scale = St.ThemeContext.get_for_stage(global.stage).scale_factor;
        const allocation = size * scale;
        const resolution = Math.ceil(size * maximum);
        if (state.allocation === allocation && state.resolution === resolution) return;
        state.allocation = allocation;
        state.resolution = resolution;
        icon.set_size(allocation, allocation);
        icon.icon_size = resolution;
        for (const texture of icon.get_children()) this._sizeTexture(texture, state);
    }

    _sizeTexture(texture, state) {
        if (!state.allocation) return;
        texture.set_size(state.allocation, state.allocation);
        texture.set_content_scaling_filters(Clutter.ScalingFilter.TRILINEAR, Clutter.ScalingFilter.LINEAR);
    }

    destroy() {
        for (const [icon, state] of this._icons) {
            icon.disconnect(state.added);
            icon.disconnect(state.destroyed);
            icon.icon_size = state.originalSize;
            icon.set_size(state.originalWidth, state.originalHeight);
        }
        this._icons.clear();
    }
}
