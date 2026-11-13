







import {Clutter, GLib, Meta, St} from '../dependencies/gi.js';
import {getCursorTracker} from '../utils.js';
import {selectVisualActor} from './actor-selection.js';
import {
    clamp,
    iconOverflow,
    magnificationLevel,
    magnifiedScale,
    settleToward,
} from './magnification-math.js';
import {lensOffset} from './lens-math.js';
import {IconResolution} from './icon-resolution.js';

const ACTIVATION_PADDING = 24;
const INFLUENCE_RADIUS_ICONS = 2.6;
const SCALE_EPSILON = 0.002;
const OFFSET_EPSILON = 0.05;

export class MagnificationController {
    constructor(dash, settings) {
        this._dash = dash;
        this._settings = settings;
        this._box = dash._box;
        this._isHorizontal = dash._isHorizontal;
        this._position = dash._position;
        this._pointer = null;
        this._states = new Map();
        this._resolution = new IconResolution();
        this._suspended = new Set();
        this._shelf = {a: 0, b: 0};
        this._configuredActors = new Map();
        this._laterId = 0;
        this._lastFrameUs = 0;
        this._settingIds = [];
        this._motionSettings = St.Settings.get();
        this._motionId = this._motionSettings.connect('notify::enable-animations',
            () => this._onSettingsChanged());

        this._sizeId = dash.connect('icon-size-changed', () => this._startFrames());
        this._addedId = this._box.connect('child-added', () => this._startFrames());
        this._cursorTracker = getCursorTracker();
        this._cursorId = this._cursorTracker.connect('position-invalidated',
            () => this._updatePointerPosition());
        for (const key of ['magnify-icons', 'magnification-max-scale', 'magnification-response-ms']) {
            this._settingIds.push(settings.connect(`changed::${key}`,
                () => this._onSettingsChanged()));
        }
        this._updatePointerPosition();
    }

    destroy() {
        this._stopFrames();
        this._resetImmediately();
        this._dash.disconnect(this._sizeId);
        this._box.disconnect(this._addedId);
        this._resolution.destroy();
        for (const [actor, state] of this._configuredActors) {
            actor.disconnect(state.destroyed);
            actor.reactive = state.reactive;
        }
        this._configuredActors.clear();
        this._cursorTracker.disconnect(this._cursorId);
        this._motionSettings.disconnect(this._motionId);
        for (const id of this._settingIds)
            this._settings.disconnect(id);
        this._settingIds = [];
        this._states.clear();
        this._box = null;
        this._cursorTracker = null;
        this._settings = null;
        this._dash = null;
    }

    _enabled() {
        return this._settings.get_boolean('magnify-icons') && this._motionSettings.enable_animations && !this._suspended.size;
    }

    suspend(reason, active) {
        if (active) this._suspended.add(reason);
        else this._suspended.delete(reason);
        this._onSettingsChanged();
    }

    _maximumScale() {
        return clamp(this._settings.get_double('magnification-max-scale'), 1, 2);
    }

    _responseMs() {
        return clamp(this._settings.get_int('magnification-response-ms'), 40, 220);
    }

    _radius() {
        return this._dash.iconSize * INFLUENCE_RADIUS_ICONS;
    }

    _onSettingsChanged() {
        if (!this._enabled()) {
            this._pointer = null;
            this._stopFrames();
            this._resetImmediately();
            return;
        }
        this._updatePointerPosition();
        this._startFrames();
    }


    _updatePointerPosition() {
        if (!this._enabled()) {
            if (this._pointer !== null) {
                this._pointer = null;
                this._startFrames();
            }
            return;
        }

        const [sx, sy] = global.get_pointer();
        const pointer = this._isInside(sx, sy) ? (this._isHorizontal ? sx : sy) : null;
        if (pointer !== this._pointer) {
            this._pointer = pointer;
            this._startFrames();
        }
    }

    _isInside(sx, sy) {
        const c = this._dash._dashContainer;
        if (!c?.get_stage() || !c.mapped)
            return false;

        const [x, y] = c.get_transformed_position();
        const [w, h] = c.get_transformed_size();
        const maximum = this._maximumScale();
        const along = (maximum - 1) * this._radius() / 2 + 4;
        const across = iconOverflow(this._dash.iconSize, maximum) + ACTIVATION_PADDING;
        const p = this._position;
        const before = (p === St.Side.BOTTOM || p === St.Side.RIGHT) ? across : 4;
        const after = (p === St.Side.TOP || p === St.Side.LEFT) ? across : 4;

        if (this._isHorizontal) {
            return sx >= x - along && sx <= x + w + along &&
                sy >= y - before && sy <= y + h + after;
        }
        return sy >= y - along && sy <= y + h + along &&
            sx >= x - before && sx <= x + w + after;
    }


    _startFrames() {
        if (this._laterId)
            return;
        this._laterId = global.compositor.get_laters().add(
            Meta.LaterType.BEFORE_REDRAW, () => {
                const animating = this._updateFrame();
                if (!animating) {
                    this._laterId = 0;
                    return GLib.SOURCE_REMOVE;
                }
                return GLib.SOURCE_CONTINUE;
            });
    }

    _stopFrames() {
        if (!this._laterId)
            return;
        global.compositor.get_laters().remove(this._laterId);
        this._laterId = 0;
        this._lastFrameUs = 0;
    }

    _items() {
        const list = [];
        const horizontal = this._isHorizontal;
        const push = (container, visual, scalable) => {
            if (!visual || !container?.get_stage())
                return;
            if (scalable) {
                this._configureIconActor(visual);
                this._resolution.prepare(visual.get_child?.(), this._dash.iconSize,
                    this._settings.get_boolean('magnify-icons') ? this._maximumScale() : 1);
            }
            const [x, y] = container.get_transformed_position();
            const [w, h] = container.get_transformed_size();
            const start = horizontal ? x : y;
            const extent = horizontal ? w : h;
            list.push({
                actor: visual, scalable,
                start, end: start + extent, center: start + extent / 2,
            });
        };

        for (const item of this._box.get_children())
            push(item, selectVisualActor(item.child?._delegate), true);

        const showApps = this._dash._showAppsIcon;
        if (showApps?.visible)
            push(showApps, selectVisualActor(showApps), true);

        for (const sep of [this._dash._separator, this._dash._locSeparator])
            push(sep, sep, false);

        return list;
    }

    _configureIconActor(actor) {
        if (this._configuredActors.has(actor))
            return;

        actor.set_content_scaling_filters(
            Clutter.ScalingFilter.TRILINEAR,
            Clutter.ScalingFilter.TRILINEAR);
        const firstChild = actor.get_child?.() ?? actor.get_first_child?.();
        firstChild?.set_content_scaling_filters(
            Clutter.ScalingFilter.TRILINEAR,
            Clutter.ScalingFilter.TRILINEAR);
        const state = {reactive: actor.reactive};
        actor.reactive = true;
        state.destroyed = actor.connect('destroy', () => {
            this._states.delete(actor);
            this._configuredActors.delete(actor);
        });
        this._configuredActors.set(actor, state);
    }

    _updateFrame() {
        const now = GLib.get_monotonic_time();
        const elapsedMs = this._lastFrameUs ? (now - this._lastFrameUs) / 1000 : 1000 / 60;
        this._lastFrameUs = now;

        const items = this._items();
        const pointer = this._pointer;
        const active = this._enabled() && pointer !== null && items.length > 0;
        const maximum = this._maximumScale();
        const radius = this._radius();
        const present = new Set();
        let unsettled = false;

        for (const item of items) {
            present.add(item.actor);
            let scale = 1;
            let offset = 0;
            if (active) {
                if (item.scalable) {
                    scale = magnifiedScale(maximum,
                        magnificationLevel(Math.abs(pointer - item.center), radius));
                }
                offset = lensOffset(item.center, pointer, radius, maximum);
            }
            unsettled = this._applyState(item.actor, scale, offset, elapsedMs) || unsettled;
        }

        let a = 0;
        let b = 0;
        if (active) {
            a = lensOffset(Math.min(...items.map(i => i.start)), pointer, radius, maximum);
            b = lensOffset(Math.max(...items.map(i => i.end)), pointer, radius, maximum);
        }
        unsettled = this._applyShelf(a, b, elapsedMs) || unsettled;

        for (const [actor] of this._states) {
            if (!present.has(actor))
                this._states.delete(actor);
        }

        if (!unsettled)
            this._lastFrameUs = 0;
        return unsettled;
    }

    _applyState(actor, targetScale, targetOffset, elapsedMs) {
        const state = this._states.get(actor) ?? {scale: 1, offset: 0};
        const responseMs = this._responseMs();
        const nextScale = settleToward(state.scale, targetScale, elapsedMs, responseMs);
        const nextOffset = settleToward(state.offset, targetOffset, elapsedMs, responseMs);
        const settled = Math.abs(nextScale - targetScale) <= SCALE_EPSILON &&
            Math.abs(nextOffset - targetOffset) <= OFFSET_EPSILON;
        const scale = settled ? targetScale : nextScale;
        const offset = settled ? targetOffset : nextOffset;
        const [pivotX, pivotY] = this._pivot();

        actor.set_pivot_point(pivotX, pivotY);
        actor.scale_x = scale;
        actor.scale_y = scale;

        if (this._isHorizontal)
            actor.translation_x = offset;
        else
            actor.translation_y = offset;

        this._states.set(actor, {scale, offset});
        return !settled;
    }


    _applyShelf(targetA, targetB, elapsedMs) {
        const s = this._shelf;
        const responseMs = this._responseMs();
        s.a = settleToward(s.a, targetA, elapsedMs, responseMs);
        s.b = settleToward(s.b, targetB, elapsedMs, responseMs);
        const settled = Math.abs(s.a - targetA) <= OFFSET_EPSILON &&
            Math.abs(s.b - targetB) <= OFFSET_EPSILON;
        if (settled) {
            s.a = targetA;
            s.b = targetB;
        }
        this._writeShelf(s.a, s.b);
        return !settled;
    }

    _writeShelf(a, b) {
        const bg = this._dash?._background;
        if (bg) {
            const size = this._isHorizontal ? bg.get_width() : bg.get_height();
            const k = size > 0 ? (size + (b - a)) / size : 1;
            if (this._isHorizontal) {
                bg.set_pivot_point(0, 0.5);
                bg.scale_x = k;
                bg.translation_x = a;
            } else {
                bg.set_pivot_point(0.5, 0);
                bg.scale_y = k;
                bg.translation_y = a;
            }
        }
        this._dash?._glassShelf?.setStretch(a, b);
    }

    _pivot() {
        switch (this._position) {
        case St.Side.BOTTOM: return [0.5, 1];
        case St.Side.TOP: return [0.5, 0];
        case St.Side.LEFT: return [0, 0.5];
        case St.Side.RIGHT: return [1, 0.5];
        default: return [0.5, 0.5];
        }
    }

    _resetImmediately() {
        for (const [actor] of this._states) {
            actor.scale_x = 1;
            actor.scale_y = 1;
            if (this._isHorizontal)
                actor.translation_x = 0;
            else
                actor.translation_y = 0;
        }
        this._shelf = {a: 0, b: 0};
        this._writeShelf(0, 0);
    }
}
