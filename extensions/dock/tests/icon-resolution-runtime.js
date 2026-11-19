import Clutter from 'gi://Clutter';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import Shell from 'gi://Shell';
import St from 'gi://St';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

export async function testIconResolution(extensionPath, wait) {
    const directory = GLib.getenv('DI_TEST_DIR');
    if (!directory) throw new Error('Solo en sesión aislada');
    const {IconResolution} = await import(`file://${extensionPath}/custom-effects/icon-resolution.js`);
    const resolution = new IconResolution();
    const stripes = Array.from({length: 20}, (_, index) =>
        `<rect x="${4 + index * 2}" y="4" width="1" height="40" fill="white"/>`).join('');
    GLib.file_set_contents(`${directory}/sharpness.svg`,
        `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><rect width="48" height="48" fill="black"/>${stripes}</svg>`);
    const gicon = new Gio.FileIcon({file: Gio.File.new_for_path(`${directory}/sharpness.svg`)});
    const themeScale = St.ThemeContext.get_for_stage(global.stage).scale_factor;
    const size = 48 * themeScale;
    const probes = [];
    try {
        for (const [index, name] of ['native', 'corrected', 'legacy'].entries()) {
            const holder = new St.Bin({x: 80 + index * 128, y: 160, width: size, height: size,
                style: 'background-color: black;', x_align: Clutter.ActorAlign.START,
                y_align: Clutter.ActorAlign.START});
            const icon = new St.Icon({gicon, icon_size: name === 'legacy' ? 84 : 48});
            holder.set_child(icon);
            Main.uiGroup.add_child(holder);
            probes.push({name, holder, icon});
            if (name === 'corrected') resolution.prepare(icon, 48, 1.75);
        }
        await wait(500);
        const legacy = probes[2].icon;
        legacy.set_size(size, size);
        for (const texture of legacy.get_children()) {
            texture.set_size(size, size);
            texture.set_content_scaling_filters(Clutter.ScalingFilter.TRILINEAR, Clutter.ScalingFilter.LINEAR);
        }
        await wait(300);
        const geometry = probes.map(({name, holder}) => {
            const [x, y] = holder.get_transformed_position();
            const [width, height] = holder.get_transformed_size();
            return {name, x, y, width, height};
        });
        const stream = Gio.File.new_for_path(`${directory}/sharpness.png`)
            .replace(null, false, Gio.FileCreateFlags.REPLACE_DESTINATION, null);
        await new Shell.Screenshot().screenshot(false, stream);
        stream.close(null);
        GLib.file_set_contents(`${directory}/sharpness.json`, JSON.stringify({
            width: global.stage.width, height: global.stage.height, probes: geometry,
        }));
        const corrected = probes[1].icon;
        const textures = corrected.get_children();
        for (let step = 0; step < 120; step++) resolution.update(corrected, 1 + 0.75 * Math.sin(step / 120 * Math.PI));
        resolution.update(corrected, 1);
        if (corrected.get_children().some((child, index) => child !== textures[index]))
            throw new Error('La ampliación vuelve a crear texturas');
        resolution.destroy();
        await wait(200);
        if (corrected.icon_size !== 48 || corrected.get_children().some(child => child instanceof St.Icon))
            throw new Error('La resolución no se restaura al desactivar');
    } finally {
        resolution.destroy();
        for (const {holder} of probes) holder.destroy();
    }
}
