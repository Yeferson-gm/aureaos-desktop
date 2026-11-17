import Clutter from 'gi://Clutter';
import St from 'gi://St';
import Pango from 'gi://Pango';
export const column = (props = {}) => new St.BoxLayout({orientation: Clutter.Orientation.VERTICAL, ...props});
export function label(text, style = 'ai-name') {
    const actor = new St.Label({text, style_class: style, y_align: Clutter.ActorAlign.CENTER});
    actor.clutter_text.ellipsize = Pango.EllipsizeMode.END;
    return actor;
}
export function button(text, action, icon = null) {
    const actor = new St.Button({style_class: 'ai-button', can_focus: true, reactive: true, accessible_name: text});
    if (icon) actor.set_child(new St.Icon({icon_name: icon, icon_size: 16}));
    else actor.label = text;
    actor.connect('clicked', action); return actor;
}
export function entry(hint, value = '') {
    const actor = new St.Entry({hint_text: hint, text: value, accessible_name: hint, can_focus: true, x_expand: true, style_class: 'ai-entry'});
    actor.clutter_text.editable = false;
    actor.clutter_text.connect('key-focus-in', text => { text.editable = true; });
    actor.clutter_text.connect('key-focus-out', text => { text.editable = false; });
    return actor;
}
export function edit(parent, title, initial, save) {
    parent.add_child(label(title, 'ai-section-title'));
    const row = new St.BoxLayout({style_class: 'ai-line'}), field = entry(title, initial);
    const submit = () => save(field.get_text());
    field.clutter_text.connect('activate', submit);
    row.add_child(field); row.add_child(button('Guardar', submit)); parent.add_child(row); return field;
}

export function buttonContent(actor, text, icon) {
    actor.accessible_name = text;
    const row = new St.BoxLayout({style_class: 'ai-action-content', x_align: Clutter.ActorAlign.CENTER});
    row.add_child(new St.Icon({icon_name: icon, icon_size: 15, y_align: Clutter.ActorAlign.CENTER}));
    const caption = label(text); row.add_child(caption); actor.set_child(row);
    return actor;
}
