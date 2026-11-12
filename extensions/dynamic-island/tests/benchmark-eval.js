(async () => {
    const wait = ms => new Promise(resolve => GLib.timeout_add(GLib.PRIORITY_DEFAULT, ms, () => { resolve(); return GLib.SOURCE_REMOVE; }));
    const read = path => new TextDecoder().decode(GLib.file_get_contents(path)[1]);
    const sample = () => {
        const stat = read('/proc/self/stat').split(') ')[1].split(' ');
        return {time: GLib.get_monotonic_time(), ticks: Number(stat[11]) + Number(stat[12]),
            rssKB: Number(read('/proc/self/status').split(String.fromCharCode(10)).find(line => line.startsWith('VmRSS:')).replace(/[^0-9]/g, ''))};
    };
    const measure = (start, end) => ({seconds: (end.time - start.time) / 1e6,
        cpuPercentOneCore: 100 * (end.ticks - start.ticks) / Number(GLib.getenv('DI_CLOCK_TICKS')) / ((end.time - start.time) / 1e6),
        rssBeforeKB: start.rssKB, rssAfterKB: end.rssKB});
    const e = Main.extensionManager.lookup('dynamic-island-gnome50@local').stateObj;
    Main.overview.hide(); e._closeIsland();
    await wait(2000);
    const idleStart = sample(); await wait(5000); const idleEnd = sample();
    const motionStart = sample();
    for (let index = 0; index < 20; index++) { e._openIsland(); await wait(350); e._closeIsland(); await wait(300); }
    const motionEnd = sample();
    if (e._grab || e._menu.isOpen) throw new Error('Queda entrada retenida');
    return JSON.stringify({idle: measure(idleStart, idleEnd), motion20: measure(motionStart, motionEnd)});
})().then(value => GLib.file_set_contents(`${GLib.getenv('DI_TEST_DIR')}/result.txt`, value))
.catch(error => GLib.file_set_contents(`${GLib.getenv('DI_TEST_DIR')}/result.txt`, `FAIL: ${error.message}`))
