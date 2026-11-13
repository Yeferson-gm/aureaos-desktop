import GLib from 'gi://GLib';

export async function benchmark(controller, blur) {
    if (!GLib.getenv('DI_TEST_DIR')) throw new Error('Solo en sesión aislada');
    const wait = ms => new Promise(resolve => GLib.timeout_add(GLib.PRIORITY_DEFAULT, ms, () => {resolve(); return GLib.SOURCE_REMOVE;}));
    const sample = () => {
        const text = new TextDecoder().decode(GLib.file_get_contents('/proc/self/stat')[1]);
        const fields = text.split(') ').at(-1).split(' ');
        return {ticks: Number(fields[11]) + Number(fields[12]), time: GLib.get_monotonic_time()};
    };
    const original = controller._updateFrame;
    let frames = 0, allocations = 0;
    controller._updateFrame = function () { frames++; return original.call(this); };
    const id = blur.connect('notify::allocation', () => allocations++);
    const report = {};
    try {
        controller._pointer = null; controller._startFrames(); await wait(1000);
        frames = 0; await wait(500);
        report.idleFrames = frames;
        if (frames) throw new Error('Ampliación consume cuadros en reposo');
        const icons = controller._items().filter(i => i.scalable);
        const start = icons[0].center, end = icons.at(-1).center;
        const before = sample(); frames = allocations = 0;
        for (let step = 0; step < 120; step++) {
            controller._pointer = start + (end - start) * (0.5 - Math.cos(step * Math.PI / 30) / 2);
            controller._startFrames();
            await wait(16);
        }
        const after = sample();
        report.frames = frames; report.blurAllocations = allocations;
        report.shellCpuPercentOneCore = 100 * (after.ticks - before.ticks) / Number(GLib.getenv('AUREA_DOCK_CLK_TCK')) / ((after.time - before.time) / 1e6);
        report.durationMs = (after.time - before.time) / 1000;
        GLib.file_set_contents(`${GLib.getenv('DI_TEST_DIR')}/benchmark.json`, JSON.stringify(report));
    } finally {
        blur.disconnect(id); controller._updateFrame = original;
        controller._pointer = null; controller._startFrames(); await wait(1000);
    }
}
