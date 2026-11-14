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
    core.cfg.global.animaciones = true;
    const liveAdded = core.agregar('notas');
    await wait(500);
    if (!liveAdded.actor.mapped || liveAdded.actor.opacity !== 255)
        throw new Error(`Alta invisible: mapped=${liveAdded.actor.mapped}, opacity=${liveAdded.actor.opacity}`);
    core.modoEdicion(false);
    await wait(300);
    if (!liveAdded.actor.mapped || liveAdded.actor.opacity !== 255)
        throw new Error('Alta invisible tras terminar edición');
    core.quitar(liveAdded);
    await wait(250);
    const interrupted = core.agregar('notas');
    core.modoEdicion(false);
    await wait(350);
    if (!interrupted.actor.mapped || interrupted.actor.opacity !== 255 || interrupted.actor.scale_x !== 1)
        throw new Error('Alta invisible al interrumpir la animación');
    core.quitar(interrupted);
    await wait(250);
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
    const editable = core.agregar('notas');
    editable.fijarRect(600, 300, 380, 170);
    await wait(300);
    const buttons = editable._barra.get_children();
    const material = editable.cfg.estilo.estilo;
    await click(buttons[2]);
    if (editable.cfg.estilo.estilo === material) throw new Error('Acción: estilo no cambia');
    if (editable._drag) throw new Error('Clic en botón inició arrastre');
    const count = core.marcos.length;
    if (buttons.length !== 3) throw new Error('Sigue disponible la acción Duplicar');
    if (core.agregar('notas', 'S') !== editable || core.marcos.length !== count)
        throw new Error('Alta repetida crea un duplicado');
    await click(buttons[1]);
    if (!core.hojas.length) throw new Error('Acción: ajustes no abre');
    const entries = [];
    const findEntries = actor => {
        if (actor instanceof St.Entry) entries.push(actor);
        actor.get_children().forEach(findEntries);
    };
    findEntries(core.hojas.at(-1).cuerpo);
    if (entries.length < 2) throw new Error('Faltan medidas editables');
    entries[0].grab_key_focus(); await wait(100);
    if (!entries[0].clutter_text.editable) throw new Error('No se puede editar el campo enfocado');
    global.stage.set_key_focus(null); await wait(100);
    if (entries[0].clutter_text.editable) throw new Error('Campo sin foco mantiene modo de entrada');
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
    const clockCard = cards.find(card => card.get_children()[0].get_children()[1].text === 'Reloj');
    if (clockCard.get_children().at(-1).get_children().map(b => b.label).join(',') !== 'Mostrar,Ajustes')
        throw new Error('Galería ofrece añadir un tipo existente');
    const notesCard = cards.find(card => card.get_children()[0].get_children()[1].text === 'Notas');
    const addNotes = notesCard.get_children().at(-1).get_children()[1];
    core.modoEdicion(false);
    addNotes.emit('clicked', Clutter.BUTTON_PRIMARY);
    addNotes.emit('clicked', Clutter.BUTTON_PRIMARY);
    await wait(400);
    const notes = core.marcos.filter(m => m.cfg.tipo === 'notas');
    if (notes.length !== 1 || !notes[0].actor.mapped || notes[0].actor.opacity !== 255)
        throw new Error('Doble clic en galería crea duplicados o deja el widget invisible');
    core.quitar(notes[0]);
    core.modoEdicion(false);
    await wait(250);
    for (const h of [...core.hojas]) h.cerrar();
    for (const type of ['notas','fotos','recordatorios','musica','podcasts','contactos','buscar','noticias','tiempouso']) {
        const widget = core.agregar(type);
        core.modoEdicion(false);
        await wait(350);
        scan(widget.actor);
        core.quitar(widget);
    }
    const {verifyDesign} = await import(`file://${GLib.getenv('DI_TEST_DIR')}/design-eval.js`);
    await verifyDesign(core, wait);
    const firstClock = core.cfg.widgets.find(w => w.tipo === 'reloj');
    const copy = {...firstClock, id: 'duplicate-fixture', opts: {...firstClock.opts, retained: 'test'}};
    core.cfg.widgets.push(copy);
    core.guardarCfg();
    ext.stateObj.disable();
    ext.stateObj.enable();
    await wait(500);
    const restored = ext.stateObj._esc;
    scan(restored.capa);
    if (restored.marcos.filter(m => m.cfg.tipo === 'reloj').length !== 1 ||
        restored.cfg.widgets.find(w => w.tipo === 'reloj').id !== firstClock.id ||
        restored.cfg.widgetsArchivados?.[0]?.opts.retained !== 'test')
        throw new Error('Migración de duplicados pierde configuración o mantiene copias activas');
    ext.stateObj.disable();
    ext.stateObj.enable();
    await wait(500);
    if (ext.stateObj._esc.cfg.widgetsArchivados.length !== 1)
        throw new Error('Migración de duplicados no es idempotente');
    return 'PASS: altas visibles con animación e interrupciones, galería sin duplicados, migración conservadora, 78 variantes y ciclo de vida';
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
