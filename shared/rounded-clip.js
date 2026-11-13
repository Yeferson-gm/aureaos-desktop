import Clutter from 'gi://Clutter';
import GObject from 'gi://GObject';
import Mtk from 'gi://Mtk';

function project(matrix, point) {
    return [0, 1, 2, 3].map(row => point.reduce((sum, value, column) => sum + matrix[column * 4 + row] * value, 0));
}

export function createRoundedMask(typeName) {
return GObject.registerClass({GTypeName: typeName}, class RoundedMask extends Clutter.Effect {
    resize(width, height, radius) {
        this._width = Math.max(1, width);
        this._height = Math.max(1, height);
        this._radius = Math.max(0, Math.min(radius, width / 2, height / 2));
    }

    vfunc_paint(_node, context, _flags) {
        const framebuffer = context.get_framebuffer();
        const model = framebuffer.get_modelview_matrix().to_float();
        const projection = framebuffer.get_projection_matrix().to_float();
        const viewport = framebuffer.get_viewport4fv();
        const screen = (x, y) => {
            const p = project(projection, project(model, [x, y, 0, 1]));
            return [viewport[0] + (p[0] / p[3] + 1) * viewport[2] / 2,
                viewport[1] + (1 - p[1] / p[3]) * viewport[3] / 2];
        };
        const [x, y] = screen(0, 0);
        const [right, bottom] = screen(this._width, this._height);
        const rx = this._radius * (right - x) / this._width;
        const ry = this._radius * (bottom - y) / this._height;
        const topRight = screen(this._width, 0);
        const bottomLeft = screen(0, this._height);
        const rotated = Math.abs(topRight[1] - y) > 0.01 || Math.abs(bottomLeft[0] - x) > 0.01;
        const key = [x, y, right, bottom, rx, ry, ...topRight, ...bottomLeft].join(',');
        if (key !== this._key) {
            const region = Mtk.Region.create();
            if (rotated) {
                const radius = this._radius;
                const corners = [[this._width - radius, radius, -Math.PI / 2],
                    [this._width - radius, this._height - radius, 0],
                    [radius, this._height - radius, Math.PI / 2], [radius, radius, Math.PI]];
                const points = corners.flatMap(([cx, cy, start]) => Array.from({length: 33}, (_, i) => {
                    const angle = start + i * Math.PI / 64;
                    return screen(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
                }));
                const top = Math.min(...points.map(p => p[1]));
                const endY = Math.max(...points.map(p => p[1]));
                for (let row = Math.ceil(top + 0.5); row < Math.floor(endY - 0.5); row++) {
                    const scan = row + 0.5;
                    const intersections = [];
                    for (let i = 0; i < points.length; i++) {
                        const a = points[i], b = points[(i + 1) % points.length];
                        if ((a[1] <= scan && b[1] > scan) || (b[1] <= scan && a[1] > scan))
                            intersections.push(a[0] + (scan - a[1]) * (b[0] - a[0]) / (b[1] - a[1]));
                    }
                    if (intersections.length < 2) continue;
                    const left = Math.ceil(Math.min(...intersections) + 0.5);
                    const end = Math.floor(Math.max(...intersections) - 0.5);
                    if (end > left) region.union_rectangle(new Mtk.Rectangle({x: left, y: row, width: end - left, height: 1}));
                }
            } else {
                for (let row = Math.ceil(y + 0.5); row < Math.floor(bottom - 0.5); row++) {
                    const dy = Math.max(y + ry - row - 0.5, row + 0.5 - bottom + ry, 0);
                    const inset = ry > 0 ? rx * (1 - Math.sqrt(Math.max(0, 1 - dy * dy / (ry * ry)))) : 0;
                    const left = Math.ceil(x + inset + 0.5);
                    const end = Math.floor(right - inset - 0.5);
                    if (end > left) region.union_rectangle(new Mtk.Rectangle({x: left, y: row, width: end - left, height: 1}));
                }
            }
            this._region = region;
            this._key = key;
        }
        framebuffer.push_region_clip(this._region);
        try { this.get_actor().continue_paint(context); }
        finally { framebuffer.pop_clip(); }
    }
});
}
