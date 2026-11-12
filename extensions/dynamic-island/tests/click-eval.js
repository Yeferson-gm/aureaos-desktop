(async () => {
    if (!GLib.getenv('DI_TEST_DIR')) throw new Error('Solo en la sesión aislada');
    const {default: Clutter} = await import('gi://Clutter');
    const wait = ms => new Promise(resolve => GLib.timeout_add(GLib.PRIORITY_DEFAULT, ms, () => { resolve(); return GLib.SOURCE_REMOVE; }));
    const island = Main.extensionManager.lookup('dynamic-island-gnome50@local').stateObj;
    Main.overview.hide();
    island._settings.set_boolean('hover-open', false);
    await wait(700);
    const seat = global.stage.context.get_backend().get_default_seat();
    const pointer = seat.create_virtual_device(Clutter.InputDeviceType.POINTER_DEVICE);
    const keyboard = seat.create_virtual_device(Clutter.InputDeviceType.KEYBOARD_DEVICE);
    await wait(500);
    const [x, y] = island._pill.get_transformed_position();
    const [w, h] = island._pill.get_transformed_size();
    const px = x + w / 2, py = y + h / 2;
    const picked = global.stage.get_actor_at_pos(Clutter.PickMode.REACTIVE, px, py);
    let pressed = 0, released = 0, clicked = 0;
    const handlers = [
        island._button.connect('button-press-event', () => { pressed++; return Clutter.EVENT_PROPAGATE; }),
        island._button.connect('button-release-event', () => { released++; return Clutter.EVENT_PROPAGATE; }),
        island._button.connect('clicked', () => clicked++),
    ];
    const movePointer = async () => {
        for (let attempt = 0; attempt < 10; attempt++) {
            pointer.notify_absolute_motion(GLib.get_monotonic_time(), px, py);
            await wait(80);
            const [actualX, actualY] = global.get_pointer();
            if (Math.abs(actualX - px) < 1 && Math.abs(actualY - py) < 1) return;
        }
        throw new Error('El puntero virtual no alcanzó la isla');
    };
    try {
        await movePointer();
        pointer.notify_button(GLib.get_monotonic_time(), Clutter.BUTTON_PRIMARY, Clutter.ButtonState.PRESSED);
        await wait(60);
        pointer.notify_button(GLib.get_monotonic_time(), Clutter.BUTTON_PRIMARY, Clutter.ButtonState.RELEASED);
        await wait(500);
        console.log(JSON.stringify({picked: String(picked), pressed, released, clicked, open: island._menu.isOpen}));
        if (!island._menu.isOpen) throw new Error('El clic de puntero no abre la isla');
        await movePointer();
        pointer.notify_button(GLib.get_monotonic_time(), Clutter.BUTTON_PRIMARY, Clutter.ButtonState.PRESSED);
        await wait(60);
        pointer.notify_button(GLib.get_monotonic_time(), Clutter.BUTTON_PRIMARY, Clutter.ButtonState.RELEASED);
        await wait(400);
        if (island._menu.isOpen || island._grab) throw new Error('Segundo clic no cierra o retiene entrada');
        console.log('Segundo clic: cerrado y sin grab');
        island._activities.clear();
        island._toast({key: 'right-click-fixture', text: 'Aviso de prueba', icon: 'dialog-information-symbolic'});
        pointer.notify_button(GLib.get_monotonic_time(), Clutter.BUTTON_SECONDARY, Clutter.ButtonState.PRESSED);
        await wait(60);
        pointer.notify_button(GLib.get_monotonic_time(), Clutter.BUTTON_SECONDARY, Clutter.ButtonState.RELEASED);
        await wait(150);
        if (island._menu.isOpen || island._activities.current) throw new Error('Clic derecho no descarta o abre el panel');
        console.log('Clic derecho: aviso descartado');
        for (const key of [Clutter.KEY_Return, Clutter.KEY_space]) {
            console.log(`Probando tecla ${key}`);
            island._button.grab_key_focus();
            keyboard.notify_keyval(GLib.get_monotonic_time(), key, Clutter.KeyState.PRESSED);
            await wait(60);
            keyboard.notify_keyval(GLib.get_monotonic_time(), key, Clutter.KeyState.RELEASED);
            await wait(500);
            if (!island._menu.isOpen) throw new Error('El teclado no abre la isla');
            keyboard.notify_keyval(GLib.get_monotonic_time(), Clutter.KEY_Escape, Clutter.KeyState.PRESSED);
            keyboard.notify_keyval(GLib.get_monotonic_time(), Clutter.KEY_Escape, Clutter.KeyState.RELEASED);
            await wait(400);
            if (island._menu.isOpen || island._grab) throw new Error('Escape no cierra o retiene entrada');
        }
        return 'PASS: clic abre, segundo clic cierra, clic derecho descarta, Enter/Espacio abren y Escape cierra sin retener entrada';
    } finally {
        for (const id of handlers) island._button.disconnect(id);
        pointer.run_dispose();
        keyboard.run_dispose();
        island._closeIsland();
    }
})().then(result => GLib.file_set_contents(`${GLib.getenv('DI_TEST_DIR')}/result.txt`, result))
.catch(error => GLib.file_set_contents(`${GLib.getenv('DI_TEST_DIR')}/result.txt`, `FAIL: ${error.message}\n${error.stack}`))
