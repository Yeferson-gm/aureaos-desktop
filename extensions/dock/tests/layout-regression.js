import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import St from 'gi://St';
import Clutter from 'gi://Clutter';

export async function testLayout(dockManager, wait) {
    const dash = dockManager.mainDock.dash;
    const controller = dash._magnification;
    const shell = new Gio.Settings({schema_id: 'org.gnome.shell'});
    const favorites = shell.get_strv('favorite-apps');
    const samples = [];
    const sample = label => {
        const bg = dash._background;
        samples.push({label, background: bg.width, container: dash._dashContainer.width,
            preferred: dash._dashContainer.get_preferred_width(-1), scale: bg.scale_x,
            blurScale: dash._glassShelf.blur.scale_x, shelf: {...controller._shelf}});
    };
    try {
        controller._pointer = null;
        controller._startFrames();
        await wait(800);
        sample('initial');
        const initialWidth = dash._background.width;
        controller._pointer = controller._items()[1].center;
        controller._startFrames();
        await wait(600);
        sample('hover');
        shell.set_strv('favorite-apps', favorites.slice(0, 1));
        await wait(800);
        controller._pointer = null;
        controller._startFrames();
        await wait(800);
        sample('shrink');
        shell.set_strv('favorite-apps', favorites);
        await wait(800);
        sample('restored');
        if (Math.abs(dash._background.width - initialWidth) > 2)
            throw new Error('El ancho no vuelve al contenido tras cambiar las aplicaciones');
        if (dash._background.scale_x !== 1 || dash._glassShelf.blur.scale_x !== 1)
            throw new Error('El vidrio conserva la ampliación después de retirar el puntero');
        controller._stopFrames();
        controller._shelf = {a: -40, b: 40};
        controller._writeShelf(-40, 40);
        const background = dash._background;
        const savedBox = background.get_allocation_box();
        try {
            background.allocate(new Clutter.ActorBox({x1: savedBox.x1, y1: savedBox.y1,
                x2: savedBox.x2 + 200, y2: savedBox.y2}));
            const visibleWidth = background.get_transformed_size()[0];
            if (Math.abs(visibleWidth - background.width - 80) > 2)
                throw new Error('Una reasignación tardía alarga el fondo más que los iconos');
        } finally {
            background.allocate(savedBox);
            controller._resetImmediately();
        }
        const trash = dash._box.get_children().find(actor => actor.child?.app?.isTrash);
        if (trash && dash._separator) {
            const departing = new St.Widget();
            departing.animatingOut = true;
            dash._box.insert_child_below(departing, trash);
            dash._updateLocationSeparator();
            departing.destroy();
            const children = dash._box.get_children();
            const isSeparator = actor => actor.has_style_class_name?.('dash-separator');
            if (children.some((actor, index) => index > 0 && isSeparator(actor) && isSeparator(children[index - 1])))
                throw new Error('Dos separadores juntos al terminar el cierre de una aplicación');
            const separator = dash._separator;
            const position = children.indexOf(separator);
            dash._box.remove_child(separator);
            try {
                for (let i = 0; i < 5; i++) {
                    dash._updateLocationSeparator();
                    const order = dash._box.get_children();
                    if (order[order.indexOf(trash) - 1] !== dash._locSeparator)
                        throw new Error('El separador cambia de lado al actualizarse');
                }
            } finally {
                dash._locSeparator?.get_parent()?.remove_child(dash._locSeparator);
                dash._box.insert_child_at_index(separator, position);
                dash._updateLocationSeparator();
            }
        }
    } finally {
        shell.set_strv('favorite-apps', favorites);
        controller._pointer = null;
        controller._startFrames();
        await wait(600);
        GLib.file_set_contents(`${GLib.getenv('DI_TEST_DIR')}/layout.json`, JSON.stringify(samples, null, 2));
    }
}
