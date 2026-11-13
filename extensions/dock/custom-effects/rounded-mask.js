import {Cogl, GObject, Shell} from '../dependencies/gi.js';

export const RoundedMask = GObject.registerClass(class AureaDockRoundedMask extends Shell.GLSLEffect {
    vfunc_build_pipeline() {
        this.add_glsl_snippet(Cogl.SnippetHook.FRAGMENT,
            'uniform vec2 dock_size; uniform float dock_radius;',
            `vec2 point = cogl_tex_coord_in[0].xy * dock_size;
             vec2 distance = abs(point - dock_size * 0.5) - dock_size * 0.5 + vec2(dock_radius);
             float edge = length(max(distance, vec2(0.0))) + min(max(distance.x, distance.y), 0.0) - dock_radius;
             cogl_color_out *= 1.0 - smoothstep(-0.75, 0.75, edge);`, false);
    }

    resize(width, height, radius) {
        this.set_uniform_float(this.get_uniform_location('dock_size'), 2, [Math.max(1, width), Math.max(1, height)]);
        this.set_uniform_float(this.get_uniform_location('dock_radius'), 1, [Math.max(0, Math.min(radius, width / 2, height / 2))]);
    }
});
