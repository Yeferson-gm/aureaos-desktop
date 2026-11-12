import Clutter from 'gi://Clutter';

export class IslandMotion {
    constructor(actor) {
        this.actor = actor;
        this.timeline = null;
        this.generation = 0;
    }

    stop() {
        this.generation++;
        this.timeline?.stop();
        this.timeline = null;
    }

    run(from, to, duration, curve, update, complete) {
        this.stop();
        const generation = this.generation;
        if (!duration || Math.abs(to - from) < 0.0001) {
            update(to);
            complete?.();
            return;
        }
        const timeline = Clutter.Timeline.new_for_actor(this.actor, Math.max(1, Math.round(duration)));
        this.timeline = timeline;
        timeline.connect('new-frame', () => {
            if (generation !== this.generation) return;
            update(from + (to - from) * curve(timeline.get_progress()));
        });
        timeline.connect('completed', () => {
            if (generation !== this.generation) return;
            this.timeline = null;
            update(to);
            complete?.();
        });
        update(from);
        timeline.start();
    }

    destroy() {
        this.stop();
        this.actor = null;
    }
}
