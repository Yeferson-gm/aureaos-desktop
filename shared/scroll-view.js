import Clutter from 'gi://Clutter';
import St from 'gi://St';

export function scrollView(properties = {}, duration = () => 160) {
    const view = new St.ScrollView({
        hscrollbar_policy: St.PolicyType.NEVER,
        vscrollbar_policy: St.PolicyType.EXTERNAL,
        ...properties,
    });
    const adjustment = view.vadjustment;
    let target = null;
    let direction = 0;
    const stop = () => {
        adjustment.remove_transition('value');
        target = null;
        direction = 0;
    };
    view.connect('scroll-event', (_view, event) => {
        const next = event.get_scroll_direction();
        if (next !== Clutter.ScrollDirection.UP && next !== Clutter.ScrollDirection.DOWN) {
            stop();
            return Clutter.EVENT_PROPAGATE;
        }
        if (event.get_flags() & Clutter.EventFlags.FLAG_POINTER_EMULATED)
            return Clutter.EVENT_PROPAGATE;
        const sign = next === Clutter.ScrollDirection.DOWN ? 1 : -1;
        const start = target !== null && direction === sign && adjustment.get_transition('value') ? target : adjustment.value;
        const limit = Math.max(adjustment.lower, adjustment.upper - adjustment.page_size);
        target = Math.max(adjustment.lower, Math.min(limit, start + sign * Math.pow(adjustment.page_size, 2 / 3)));
        direction = sign;
        if (target === adjustment.value) return Clutter.EVENT_PROPAGATE;
        const settings = St.Settings.get();
        const reduced = St.ReducedMotion && settings.reduced_motion === St.ReducedMotion.REDUCE;
        adjustment.ease(target, {
            duration: settings.enable_animations && !reduced ? duration() : 0,
            mode: Clutter.AnimationMode.EASE_OUT_CUBIC,
        });
        return Clutter.EVENT_STOP;
    });
    view.connect('notify::mapped', () => { if (!view.mapped) stop(); });
    return view;
}
