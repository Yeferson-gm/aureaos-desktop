import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import Shell from 'gi://Shell';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

export async function checkMenuIcons(bar, wait) {
    if (!GLib.getenv('DI_TEST_DIR')) throw new Error('Requiere Shell aislado');
    const find = (actor, name) => actor.has_style_class_name?.(name) ? actor : actor.get_children().map(child => find(child, name)).find(Boolean);
    const check = menu => {
        for (const item of menu._getMenuItems()) {
            if (item.has_style_class_name?.('lintel-item') && !item.has_style_class_name('lintel-item-info')) {
                const icon = find(item, 'lintel-item-icon');
                if (!icon?.gicon && !icon?.icon_name) throw new Error('Falta icono: ' + item.label?.text);
                if (item.mapped && item.label.width && icon.x + icon.width > item.label.x) throw new Error('Icono sobre el texto: ' + item.label.text);
            }
            if (item.menu) check(item.menu);
            else if (item instanceof PopupMenu.PopupMenuSection) check(item);
        }
    };
    const config = {...bar._cfg.values};
    bar._cfg.values.menuIcons = 'all';
    for (const mode of ['claro', 'oscuro']) {
        bar._cfg.values.temaMenus = mode; bar._applyTheme();
        for (const button of [bar._apple, bar._name, ...bar._dyn, ...Object.entries(Main.panel.statusArea).filter(([id]) => /^lintel-(sound|keyboard|wifi|bluetooth|clock|battery)$/.test(id)).map(([, button]) => button)]) {
            button.menu.open(); await wait(120); check(button.menu);
            if (button === bar._apple) {
                const stream = Gio.File.new_for_path(GLib.getenv('DI_TEST_DIR') + '/menu-icons-' + mode + '.png').replace(null, false, Gio.FileCreateFlags.REPLACE_DESTINATION, null);
                await new Shell.Screenshot().screenshot(false, stream); stream.close(null);
            }
            button.menu.close();
        }
    }
    const keyboard = Main.panel.statusArea['lintel-keyboard'];
    if (keyboard) {
        keyboard._build();
        const selected = keyboard.menu._getMenuItems().find(item => find(item, 'lintel-item-selection'));
        if (!selected || selected._icon.icon_name !== 'input-keyboard-symbolic') throw new Error('Selección sustituye el icono de teclado');
    }
    const controls = Main.panel.statusArea['lintel-cc'].controls;
    for (const page of ['power', 'focus', 'privacy']) {
        controls.showPage(page);
        for (const row of controls.body.get_children())
            if (row.has_style_class_name('aurea-detail-row') && !find(row, 'aurea-detail-icon')) throw new Error('Detalle sin icono: ' + page);
    }
    controls.showPage(null);

    const published = bar._ctx.published;
    const groups = published.groups;
    const action = new Gio.SimpleAction({name: 'copy', state: new GLib.Variant('b', true)});
    const group = new Gio.SimpleActionGroup(); group.add_action(action);
    published.groups = {app: group};
    let activated = 0; action.connect('activate', () => activated++);
    const model = new Gio.Menu();
    const leaf = Gio.MenuItem.new('_Copiar', 'app.copy');
    leaf.set_icon(Gio.ThemedIcon.new('edit-copy-symbolic')); model.append_item(leaf);
    const submenu = Gio.MenuItem.new_submenu('_Más opciones', model);
    submenu.set_icon(Gio.ThemedIcon.new('folder-symbolic'));
    const root = new Gio.Menu(); root.append_item(submenu);
    const menu = new PopupMenu.PopupMenuSection();
    const entries = [];
    published.fill(menu, root, (_, options, activate) => entries.push({options, activate}));
    const nested = menu._getMenuItems()[0];
    if (!nested.icon.gicon.equal(Gio.ThemedIcon.new('folder-symbolic'))) throw new Error('Se pierde icono exportado del submenú');
    if (!entries[0].options.gicon.equal(Gio.ThemedIcon.new('edit-copy-symbolic')) || !entries[0].options.checked || entries[0].options.label !== 'Copiar') throw new Error('Se pierde icono o estado de acción exportada');
    entries[0].activate();
    action.set_enabled(false); entries[0].activate();
    if (activated !== 1) throw new Error('Los iconos alteran la activación del menú');
    menu.destroy(); published.groups = groups;
    bar._cfg.values = config; bar._applyTheme();
}
