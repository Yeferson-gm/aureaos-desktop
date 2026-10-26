(async () => {
    const Main = await import('resource:///org/gnome/shell/ui/main.js');
    const {default: GLib} = await import('gi://GLib');
    const {default: Gio} = await import('gi://Gio');
    const {default: Shell} = await import('gi://Shell');
    const {default: Clutter} = await import('gi://Clutter');
    const {default: St} = await import('gi://St');
    const {default: Meta} = await import('gi://Meta');
    if (!GLib.getenv('DI_TEST_DIR')) throw new Error('Solo se permite esta prueba en la sesión aislada');
    const wait = ms => new Promise(resolve => GLib.timeout_add(GLib.PRIORITY_DEFAULT, ms, () => {resolve(); return GLib.SOURCE_REMOVE;}));
    const ext = Main.extensionManager.lookup('lintel-widgets@local');
    if (ext.state !== 1) throw new Error(JSON.stringify({state:ext.state, errors:ext.error}));
    const core = ext.stateObj._esc;
    Main.overview.hide();
    await wait(1200);
    if (core.marcos.length !== 4) throw new Error('Faltan widgets iniciales');
    const video = Main.extensionManager.lookup('aurea-wallpaper@local').stateObj._wallpaper;
    if (!video._sourceActor) throw new Error('Vídeo no disponible');
    if (core.capa.get_parent() !== global.window_group) throw new Error('Capa de escritorio incorrecta');
    const desktop = new St.Widget({name:'desktop-icons-fixture'});
    global.window_group.add_child(desktop);
    const enumerate = core._ventanasEscritorio;
    core._ventanasEscritorio = () => [desktop];
    core.colocar();
    if (core.capa.get_previous_sibling() !== desktop) throw new Error('Widgets detrás de iconos');
    const app = new St.Widget({name: 'normal-window-fixture'});
    app.meta_window = {};
    global.window_group.add_child(app);

    global.window_group.set_child_above_sibling(core.capa, null);
    core._pedirColocar();
    await new Promise(resolve => global.compositor.get_laters().add(Meta.LaterType.BEFORE_REDRAW, () => {
        resolve(); return GLib.SOURCE_REMOVE;
    }));
    const belowApp = () => {
        const children = global.window_group.get_children();
        if (children.indexOf(core.capa) >= children.indexOf(app))
            throw new Error('Widgets sobre la aplicación antes de pintar');
    };
    belowApp();

    global.window_group.set_child_above_sibling(desktop, null);
    core.colocar();
    belowApp();
    app.destroy();
    core._ventanasEscritorio = enumerate;
    desktop.destroy();
    core.colocar();
    const scan = actor => {
        if (actor.text?.startsWith('Error en')) throw new Error(actor.text);
        actor.get_children().forEach(scan);
    };
    scan(core.capa);
    const output = Gio.File.new_for_path(`${GLib.getenv('DI_TEST_DIR')}/widgets.png`).replace(null,false,Gio.FileCreateFlags.NONE,null);
    await new Shell.Screenshot().screenshot(false,output); output.close(null);
    core.modoEdicion(true);
    if (core.capa.get_parent() !== Main.uiGroup) throw new Error('Capa de edición incorrecta');
    const frame = core.marcos[0];
    const original = {...frame.cfg};
    frame._iniciarDrag('mover', {get_coords:() => [100,100]});
    frame._arrastrar(45,30,Clutter.ModifierType.MOD1_MASK);
    frame._terminarDrag();
    if (frame.cfg.x !== original.x+45 || frame.cfg.y !== original.y+30) throw new Error('Arrastre incorrecto');
    frame._iniciarDrag('br', {get_coords:() => [100,100]});
    frame._arrastrar(60,40,Clutter.ModifierType.MOD1_MASK);
    frame._terminarDrag();
    if (frame.cfg.w !== original.w+60 || frame.cfg.h !== original.h+40) throw new Error('Redimensionado incorrecto');
    frame.fijarRect(original.x,original.y,original.w,original.h);
    core.modoEdicion(false);


    const click = async actor => {
        if (!actor.reactive) throw new Error('Botón no reactivo');
        actor.emit('clicked', Clutter.BUTTON_PRIMARY);
        await wait(250);
    };
    core.cfg.global.animaciones = false;
    const editable = core.agregar('baterias');
    editable.fijarRect(600, 300, 380, 170);
    await wait(300);
    const buttons = editable._barra.get_children();
    const material = editable.cfg.estilo.estilo;
    await click(buttons[2]);
    if (editable.cfg.estilo.estilo === material) throw new Error('Acción: estilo no cambia');
    if (editable._drag) throw new Error('Clic en botón inició arrastre');
    const count = core.marcos.length;
    await click(buttons[3]);
    if (core.marcos.length !== count + 1) throw new Error('Acción: duplicar no funciona');
    core.quitar(core.marcos.at(-1));
    await wait(250);
    await click(buttons[1]);
    if (!core.hojas.length) throw new Error('Acción: ajustes no abre');
    for (const h of [...core.hojas]) h.cerrar();
    await wait(200);
    await click(buttons[0]);
    if (core.marcos.includes(editable)) throw new Error('Acción: quitar no funciona');
    core.modoEdicion(false);
    core.cfg.global.animaciones = true;
    core.abrirAjustes(); await wait(300);
    for (const h of [...core.hojas]) h.cerrar();
    core.abrirGaleria(); await wait(300);
    const gallery = core.hojas.at(-1);
    const cards = [];
    const collect = actor => {
        if (actor.has_style_class_name?.('lintel-card')) cards.push(actor);
        actor.get_children().forEach(collect);
    };
    collect(gallery.cuerpo);
    if (cards.length !== 13) throw new Error(`Tarjetas: ${cards.length}`);
    const rect = actor => {
        const [x,y] = actor.get_transformed_position();
        const [w,h] = actor.get_transformed_size();
        return {x,y,w,h};
    };
    for (let i=0; i<cards.length; i++) {
        const a = rect(cards[i]);
        if (a.h < 110) throw new Error(`Tarjeta ${i} comprimida: ${a.h}`);
        for (let j=i+1; j<cards.length; j++) {
            const b = rect(cards[j]);
            if (a.x < b.x+b.w-1 && a.x+a.w > b.x+1 && a.y < b.y+b.h-1 && a.y+a.h > b.y+1)
                throw new Error(`Tarjetas superpuestas: ${i}, ${j}`);
        }
    }
    const galleryOutput = Gio.File.new_for_path(`${GLib.getenv('DI_TEST_DIR')}/gallery.png`).replace(null,false,Gio.FileCreateFlags.NONE,null);
    await new Shell.Screenshot().screenshot(false,galleryOutput); galleryOutput.close(null);
    for (const h of [...core.hojas]) h.cerrar();
    for (const type of ['notas','fotos','recordatorios','musica','podcasts','contactos','buscar','noticias','tiempouso']) {
        const widget = core.agregar(type);
        core.modoEdicion(false);
        await wait(350);
        scan(widget.actor);
        core.quitar(widget);
    }
    ext.stateObj.disable();
    ext.stateObj.enable();
    await wait(500);
    scan(ext.stateObj._esc.capa);
    return 'PASS: 13 widgets construidos, ajustes, galería, edición y ciclo de vida';
})().then(async result => {
    const {default: Gio} = await import('gi://Gio');
    const {default: GLib} = await import('gi://GLib');
    Gio.File.new_for_path(GLib.getenv('DI_TEST_DIR') + '/result.txt')
        .replace_contents(new TextEncoder().encode('PASS: ' + JSON.stringify(result)), null, false, Gio.FileCreateFlags.NONE, null);
}).catch(async error => {
    const {default: Gio} = await import('gi://Gio');
    const {default: GLib} = await import('gi://GLib');
    Gio.File.new_for_path(GLib.getenv('DI_TEST_DIR') + '/result.txt')
        .replace_contents(new TextEncoder().encode('FAIL: ' + error.message + String.fromCharCode(10) + error.stack), null, false, Gio.FileCreateFlags.NONE, null);
})
