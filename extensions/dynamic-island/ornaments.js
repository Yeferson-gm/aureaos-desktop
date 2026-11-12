import St from 'gi://St';
import Clutter from 'gi://Clutter';

export class IslandOrnaments {
    constructor(island) {
        this.island = island;
        this.particles = new Set();
    }

    buildMascot() {
        const actor = new St.DrawingArea({width: 20, height: 20, y_align: Clutter.ActorAlign.CENTER,
            accessible_name: 'Mascota de Aurea', reactive: false, visible: false});
        actor.connect('repaint', area => {
            const cr = area.get_context();
            cr.setSourceRGBA(0.72, 0.82, 1, 1);
            cr.moveTo(3, 9); cr.lineTo(2, 2); cr.lineTo(8, 5);
            cr.lineTo(12, 5); cr.lineTo(18, 2); cr.lineTo(17, 9);
            cr.curveTo(20, 20, 0, 20, 3, 9); cr.fill();
            cr.setSourceRGBA(0.04, 0.06, 0.10, 1);
            cr.arc(7, 10, 1.1, 0, Math.PI * 2); cr.fill();
            cr.arc(13, 10, 1.1, 0, Math.PI * 2); cr.fill();
            cr.moveTo(9, 13); cr.lineTo(11, 13); cr.lineTo(10, 14.5); cr.closePath(); cr.fill();
            cr.$dispose();
        });
        return actor;
    }

    celebrate() {
        this.clear();
        const e = this.island;
        if (!e._settings.get_boolean('celebration-effects') || !e._duration(1) || !e._menu.isOpen || e._state !== 'expanded') return;
        for (let index = 0; index < 8; index++) {
            const dot = new St.Widget({width: 4, height: 4, reactive: false,
                style: `border-radius: 2px; background-color: ${index % 2 ? '#b8cdff' : '#f3d89b'};`});
            dot.set_position(e._island.width / 2, 42);
            e._island.add_child(dot);
            this.particles.add(dot);
            const angle = Math.PI * (index + 0.5) / 8;
            dot.ease({translation_x: Math.cos(angle) * 120, translation_y: 24 + Math.sin(angle) * 65,
                opacity: 0, scale_x: 0.5, scale_y: 0.5, duration: e._duration(600),
                mode: Clutter.AnimationMode.EASE_OUT_CUBIC,
                onComplete: () => { this.particles.delete(dot); dot.destroy(); }});
        }
    }

    clear() {
        for (const dot of this.particles) { dot.remove_all_transitions(); dot.destroy(); }
        this.particles.clear();
    }
}
