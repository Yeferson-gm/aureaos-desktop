import St from 'gi://St';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import Shell from 'gi://Shell';

export async function testGlass(dock) {
    if (!GLib.getenv('DI_TEST_DIR')) throw new Error('Solo en sesión aislada');
    const wait = ms => new Promise(resolve => GLib.timeout_add(GLib.PRIORITY_DEFAULT, ms, () => {resolve(); return GLib.SOURCE_REMOVE;}));
    const width = global.stage.width, height = global.stage.height;
    const pattern = new St.DrawingArea({width, height});
    pattern.connect('repaint', () => {
        const cr = pattern.get_context();
        for (let y = 0; y < height; y += 8) for (let x = 0; x < width; x += 8) {
            const color = ((x + y) / 8) % 2 ? 0.9 : 0.1;
            cr.setSourceRGB(color, color, color);
            cr.rectangle(x, y, 8, 8); cr.fill();
        }
        cr.$dispose();
    });
    dock.get_parent().insert_child_below(pattern, dock);
    const shelf = dock.dash._glassShelf;
    const background = dock.dash._background;
    const controller = dock.dash._magnification;
    const capture = async name => {
        await wait(250);
        const stream = Gio.File.new_for_path(`${GLib.getenv('DI_TEST_DIR')}/${name}.png`)
            .replace(null, false, Gio.FileCreateFlags.REPLACE_DESTINATION, null);
        await new Shell.Screenshot().screenshot(false, stream); stream.close(null);
    };
    const geometries = {};
    try {
        for (const mode of ['rest', 'magnified']) {
            controller._pointer = mode === 'rest' ? null : controller._items()[0].center;
            controller._startFrames();
            await wait(1000);
            shelf.blur.visible = false;
            await capture(`glass-${mode}-off`);
            shelf.blur.visible = true;
            await capture(`glass-${mode}-on`);
            shelf._mask.set_enabled(false);
            await capture(`glass-${mode}-unclipped`);
            shelf._mask.set_enabled(true);
            geometries[mode] = {
                position: background.get_transformed_position(), size: background.get_transformed_size(),
                radius: [shelf._radius * background.scale_x, shelf._radius * background.scale_y],
                stage: [width, height],
            };
        }
        GLib.file_set_contents(`${GLib.getenv('DI_TEST_DIR')}/glass.json`, JSON.stringify(geometries));
    } finally {
        pattern.destroy(); shelf.blur.visible = true; shelf._mask.set_enabled(true);
        controller._pointer = null; controller._startFrames();
    }
}
