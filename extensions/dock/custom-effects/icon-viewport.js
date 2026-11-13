import {GObject, St} from '../dependencies/gi.js';

export const IconViewport = GObject.registerClass(class AureaDockIconViewport extends St.BoxLayout {
    vfunc_pick(context) {
        if (this.clip_to_view) {
            super.vfunc_pick(context);
            return;
        }
        St.Widget.prototype.vfunc_pick.call(this, context);
        for (const child of this.get_children()) child.pick(context);
    }
});

export const IconScrollView = GObject.registerClass(class AureaDockIconScrollView extends St.ScrollView {
    vfunc_get_paint_volume(volume) {
        return St.Widget.prototype.vfunc_get_paint_volume.call(this, volume);
    }
});
