import Gio from 'gi://Gio';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import {iconFor} from './menu-icons.js';

const attribute = (model, index, key) => model.get_item_attribute_value(index, key, null)?.deepUnpack();
const label = text => String(text ?? '').replace(/__|_([^_])/g, (match, letter) => letter ?? '_');
function menuIcon(model, index) {
    const value = model.get_item_attribute_value(index, 'icon', null);
    if (!value) return null;
    try { return Gio.Icon.deserialize(value); }
    catch { return null; }
}

export class PublishedMenus {
    constructor(changed) { this.changed = changed; this.signals = []; }
    setWindow(window) {
        const bus = window?.get_gtk_unique_bus_name?.();
        const path = window?.get_gtk_menubar_object_path?.() ?? window?.get_gtk_app_menu_object_path?.();
        const signature = `${bus}:${path}:${window?.get_gtk_window_object_path?.()}`;
        if (signature === this.signature) return;
        this.clear(); this.signature = signature; this.window = window;
        if (!bus || !path) return;
        this.model = Gio.DBusMenuModel.get(Gio.DBus.session, bus, path);
        this.groups = {};
        for (const [prefix, objectPath] of [['app', window.get_gtk_application_object_path?.()], ['win', window.get_gtk_window_object_path?.()]]) {
            if (!objectPath) continue;
            const group = Gio.DBusActionGroup.get(Gio.DBus.session, bus, objectPath);
            this.groups[prefix] = group;
            for (const signal of ['action-added', 'action-removed', 'action-enabled-changed', 'action-state-changed'])
                this.signals.push([group, group.connect(signal, () => this.changed())]);
        }
        this.watch(this.model, 0); this.changed();
    }
    watch(model, depth) {
        if (depth > 5 || this.signals.some(([object]) => object === model)) return;
        this.signals.push([model, model.connect('items-changed', () => {
            this.watchChildren(model, depth); this.changed();
        })]);
        this.watchChildren(model, depth);
    }
    watchChildren(model, depth) {
        for (let index = 0; index < Math.min(100, model.get_n_items()); index++)
            for (const link of ['section', 'submenu']) {
                const child = model.get_item_link(index, link);
                if (child) this.watch(child, depth + 1);
            }
    }
    get specs() {
        if (!this.model?.get_n_items()) return [];
        const specs = [];
        for (let index = 0; index < this.model.get_n_items(); index++) {
            const child = this.model.get_item_link(index, 'submenu');
            if (child) specs.push({title: label(attribute(this.model, index, 'label')), model: child});
        }
        return specs.length ? specs : [{title: 'Acciones', model: this.model}];
    }
    fill(menu, model, addItem, depth = 0) {
        if (depth > 5) return;
        for (let index = 0; index < Math.min(100, model.get_n_items()); index++) {
            const section = model.get_item_link(index, 'section');
            if (section) { if (index) menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem()); this.fill(menu, section, addItem, depth + 1); continue; }
            const title = label(attribute(model, index, 'label'));
            const gicon = menuIcon(model, index);
            const submenu = model.get_item_link(index, 'submenu');
            if (submenu) {
                const item = new PopupMenu.PopupSubMenuMenuItem(title, true);
                item.add_style_class_name('lintel-item');
                item.icon.add_style_class_name('lintel-item-icon');
                if (gicon) item.icon.gicon = gicon;
                else item.icon.icon_name = iconFor(title, '', 'view-list-symbolic');
                this.fill(item.menu, submenu, addItem, depth + 1); menu.addMenuItem(item); continue;
            }
            const full = attribute(model, index, 'action') ?? '';
            const [prefix, ...rest] = full.split('.'), action = rest.join('.');
            const group = this.groups?.[prefix];
            const enabled = group?.has_action(action) && group.get_action_enabled(action);
            const state = group?.has_action(action) ? group.get_action_state(action) : null;
            const target = model.get_item_attribute_value(index, 'target', null);
            const checked = state && (target ? state.equal(target) : state.get_type_string() === 'b' && state.get_boolean());
            addItem(menu, {label: title, gicon, action: full, disabled: !enabled, checked: !!checked}, () => {
                if (group?.has_action(action) && group.get_action_enabled(action)) group.activate_action(action, target);
            });
        }
    }
    clear() { this.signals.forEach(([object, signal]) => object.disconnect(signal)); this.signals = []; this.model = null; this.groups = {}; }
    destroy() { this.clear(); }
}
