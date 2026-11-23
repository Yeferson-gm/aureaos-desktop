(async () => {
    const {default: GLib} = await import('gi://GLib');
    const {default: St} = await import('gi://St');
    const {default: Gio} = await import('gi://Gio');
    const Main = await import('resource:///org/gnome/shell/ui/main.js');
    const directory = GLib.getenv('DI_TEST_DIR');
    if (!directory?.startsWith('/tmp/aurea-window-effects-')) throw new Error('Isolated test only');
    const pause = ms => new Promise(resolve => GLib.timeout_add(GLib.PRIORITY_DEFAULT, ms, () => { resolve(); return GLib.SOURCE_REMOVE; }));
    const check = (condition, message) => { if (!condition) throw new Error(message); };
    const baseline = GLib.getenv('AUREA_EFFECTS_BASELINE') === '1';
    let fixture;
    try {
        Main.overview.hide();
        await pause(400);
        const manager = Main.extensionManager;
        const originalShouldAnimate = Main.wm._shouldAnimateActor;
        const originalComplete = Main.wm._shellwm.completed_minimize;
        for (const id of ['aurea-magic-lamp@local', 'aurea-window-motion@local']) {
            await manager.enableExtension(id);
            await pause(300);
            check(manager.lookup(id).state === 1, `Enable ${id}: ${manager.lookup(id).state} ${JSON.stringify(manager.lookup(id).errors)}`);
        }
        const motion = manager.lookup('aurea-window-motion@local').stateObj;
        const {WobblyEffect} = await import(`file://${motion.path}/src/effects/wobbly.js`);
        fixture = new St.Widget({x: 400, y: 200, width: 900, height: 600, style: 'background-color: #3478f6;'});
        Main.uiGroup.add_child(fixture);
        const effect = new WobblyEffect({settingsData: motion.settingsData, op: 'move'});
        fixture.add_effect_with_name('test-motion', effect);
        let frames = 0;
        const timer = effect.timerId;
        timer.connect('new-frame', () => frames++);
        await pause(200);
        frames = 0;
        await pause(600);
        const idleFrames = frames;
        for (let index = 0; index < 24; index++) {
            fixture.set_position(400 + index * 8, 200 + Math.sin(index / 4) * 40);
            await pause(16);
        }
        check(effect.wobblyModel.objects.every(p => Number.isFinite(p.x) && Number.isFinite(p.y)), 'Finite moving geometry');
        const settleStart = GLib.get_monotonic_time();
        effect.on_end_event(fixture);
        for (let i = 0; i < 40 && fixture.get_effect('test-motion'); i++) await pause(50);
        const settleMs = (GLib.get_monotonic_time() - settleStart) / 1000;
        check(!fixture.get_effect('test-motion'), 'Release must remove effect');
        const actor = global.get_window_actors().find(a => a.meta_window.get_title().startsWith('Aurea Dock fixture'));
        check(actor, 'Fixture window');
        const parent = actor.get_parent(), originalRedraw = parent.queue_redraw;
        let parentRedraws = 0, lampFrames = 0;
        parent.queue_redraw = function () { parentRedraws++; return originalRedraw.call(this); };
        try {
            for (let i = 0; i < 2; i++) {
                actor.meta_window.minimize();
                await pause(50);
                const lamp = actor.get_effect('minimize-magic-lamp-effect');
                check(lamp?.timerId, 'Minimize effect started');
                lamp.timerId.connect('new-frame', () => lampFrames++);
                await pause(550);
                check(!actor.get_effect('minimize-magic-lamp-effect'), 'Minimize completes');
                actor.meta_window.unminimize();
                await pause(50);
                const restore = actor.get_effect('unminimize-magic-lamp-effect');
                check(restore?.timerId, 'Restore effect started');
                restore.timerId.connect('new-frame', () => lampFrames++);
                await pause(550);
                check(!actor.get_effect('unminimize-magic-lamp-effect') && actor.visible, 'Restore completes');
            }
        } finally { parent.queue_redraw = originalRedraw; }
        if (!baseline) {
            const held = new WobblyEffect({settingsData: motion.settingsData, op: 'move'});
            fixture.add_effect_with_name('test-motion', held);
            await pause(50);
            fixture.set_position(500, 250);
            await pause(1600);
            check(!held.timerId.is_playing(), 'Stationary grab must stop its timeline');
            const previousX = held.wobblyModel.immobileObject.x;
            fixture.set_position(540, 250);
            await pause(50);
            check(held.timerId.is_playing() && held.wobblyModel.immobileObject.x > previousX, 'Drag resumes after idle');
            held.destroy(); held.destroy();
            check(!held.timerId && !held.overviewShowingEvent && !held.actorDestroyId, 'Motion cleanup is idempotent');

            const lampModule = manager.lookup('aurea-magic-lamp@local').stateObj;
            const overlap = new WobblyEffect({settingsData: motion.settingsData, op: 'move'});
            actor.add_effect_with_name('wobbly-compiz-effect', overlap);
            actor.meta_window.minimize(); await pause(60);
            check(overlap.destroyed && !actor.get_effect('wobbly-compiz-effect'), 'Minimize removes drag deformation');
            actor.meta_window.unminimize(); await pause(400);
            for (let i = 0; i < 4; i++) {
                actor.meta_window.minimize();
                await pause(60);
                const interrupted = actor.get_effect('minimize-magic-lamp-effect');
                check(interrupted?.timerId, 'Interrupted minimize starts');
                const interruptedTimer = interrupted.timerId;
                actor.meta_window.unminimize();
                await pause(60);
                check(!interruptedTimer.is_playing(), 'Cancelled timeline must stop');
                interrupted.destroy();
                await pause(400);
                check(actor.visible && !actor.get_effect('unminimize-magic-lamp-effect'), 'Rapid restore remains visible');
            }
            const uiSettings = new Gio.Settings({schema_id: 'org.gnome.desktop.interface'});
            uiSettings.set_boolean('enable-animations', false);
            await pause(150);
            check(lampModule.motionDisabled() && motion.motionDisabled(), 'Respect disabled motion');
            actor.meta_window.minimize(); await pause(80);
            check(!actor.get_effect('minimize-magic-lamp-effect'), 'No deformation with reduced animations');
            actor.meta_window.unminimize(); await pause(80);
            check(actor.visible, 'Immediate restore remains visible');
            uiSettings.set_boolean('enable-animations', true);
            await pause(150);

            actor.meta_window.minimize(); await pause(60);
            const disabling = actor.get_effect('minimize-magic-lamp-effect');
            const disablingTimer = disabling?.timerId;
            check(disablingTimer, 'Disable test starts active animation');
            await manager.disableExtension('aurea-magic-lamp@local');
            await pause(300);
            check(!disablingTimer.is_playing() && !actor.get_effect('minimize-magic-lamp-effect'), 'Disable finishes active animation');
            check(Main.wm._shouldAnimateActor === originalShouldAnimate && Main.wm._shellwm.completed_minimize === originalComplete, 'Restore native methods');
            actor.meta_window.unminimize(); await pause(500);
            check(actor.visible, 'Native restore after disable');
        }
        for (const id of ['aurea-window-motion@local', 'aurea-magic-lamp@local']) {
            await manager.disableExtension(id);
            await pause(300);
            check(manager.lookup(id).state === 2, `Disable ${id}`);
        }
        const metrics = {idleFrames, settleMs, parentRedraws, lampFrames, animations: St.Settings.get().enable_animations};
        GLib.file_set_contents(`${directory}/metrics.json`, JSON.stringify(metrics, null, 2));
        if (!baseline) {
            check(idleFrames === 0, 'Idle drag must not schedule frames');
            check(parentRedraws === 0, 'Lamp must not redraw all sibling windows');
        }
        GLib.file_set_contents(`${directory}/result.txt`, `PASS: ${JSON.stringify(metrics)}\n`);
    } catch (error) {
        GLib.file_set_contents(`${directory}/result.txt`, `FAIL: ${error.message}\n${error.stack}\n`);
    } finally { fixture?.destroy(); }
})();
