import Clutter from 'gi://Clutter';
import St from 'gi://St';

export class MusicPanel {
    constructor(tools) {
        this.tools = tools;
        this.island = tools.island;
        this.sections = {};
        this.tabs = {};
        this.actor = new St.BoxLayout({orientation: Clutter.Orientation.VERTICAL,
            style_class: 'di-music-options', visible: false});
        const tabs = new St.BoxLayout({style_class: 'di-music-option-tabs'});
        this.actor.add_child(tabs);
        for (const [id, label, icon] of [['playback', 'Reproducción', 'media-playback-start-symbolic'],
            ['audio', 'Sonido', 'audio-speakers-symbolic'], ['track', 'Canción', 'audio-x-generic-symbolic']]) {
            const button = this.island._chip(label, () => this.select(id), icon);
            button.add_style_class_name('di-music-option-tab');
            button.x_expand = true;
            this.tabs[id] = button;
            tabs.add_child(button);
            const section = new St.BoxLayout({orientation: Clutter.Orientation.VERTICAL,
                style_class: 'di-music-option-section', visible: false});
            this.sections[id] = section;
            this.actor.add_child(section);
        }
        this.select('playback');
    }

    row(parent, title, icon, callback, value = '') {
        const button = new St.Button({style_class: 'di-music-option-row', reactive: true, can_focus: true,
            x_expand: true, x_align: Clutter.ActorAlign.FILL, accessible_name: title});
        const row = new St.BoxLayout({style_class: 'di-music-option-content', x_expand: true, x_align: Clutter.ActorAlign.FILL, y_align: Clutter.ActorAlign.CENTER});
        row.add_child(new St.Icon({icon_name: icon, icon_size: 17, style_class: 'di-music-option-icon'}));
        const label = this.island._label(title, 'di-music-option-label', {x_expand: true});
        label.clutter_text.set_ellipsize(3);
        row.add_child(label);
        const state = this.island._label(value, 'di-music-option-value');
        row.add_child(state);
        button.set_child(row);
        button._label = label;
        button._value = state;
        button.connect('clicked', callback);
        parent.add_child(button);
        return button;
    }

    select(id) {
        this.selected = id;
        for (const [key, section] of Object.entries(this.sections)) {
            section.visible = key === id;
            this.tabs[key][key === id ? 'add_style_pseudo_class' : 'remove_style_pseudo_class']('checked');
        }
        if (id === 'audio') this.tools.refreshOutputs?.();
        this.island._resizeIsland();
    }

    state(button, text, active = false) {
        button._value.text = text;
        button[active ? 'add_style_class_name' : 'remove_style_class_name']('di-music-option-active');
        button.accessible_name = `${button._label.text}: ${text}`;
    }
}
