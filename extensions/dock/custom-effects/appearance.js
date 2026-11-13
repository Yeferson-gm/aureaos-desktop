import {Gio, St} from '../dependencies/gi.js';

export function appearanceState(settings, desktop, shell = St.Settings.get()) {
    const choice = settings.get_string('material-theme');
    return {
        dark: choice === 'dark' || (choice === 'auto' && desktop.get_string('color-scheme') === 'prefer-dark'),
        contrast: shell.high_contrast,
    };
}

export function watchAppearance(actor, settings, update = () => {}) {
    const desktop = new Gio.Settings({schema_id: 'org.gnome.desktop.interface'});
    const shell = St.Settings.get();
    const sync = () => {
        const state = appearanceState(settings, desktop, shell);
        for (const [name, active] of [['aurea-dark', state.dark], ['aurea-contrast', state.contrast]]) {
            if (active) actor.add_style_class_name(name);
            else actor.remove_style_class_name(name);
        }
        update(state);
    };
    const signals = [
        [desktop, desktop.connect('changed::color-scheme', sync)],
        [settings, settings.connect('changed::material-theme', sync)],
        [shell, shell.connect('notify::high-contrast', sync)],
    ];
    let dead = false;
    const dispose = () => {
        if (dead) return;
        dead = true;
        for (const [object, id] of signals) object.disconnect(id);
    };
    signals.push([actor, actor.connect('destroy', dispose)]);
    sync();
    return dispose;
}

export function styleMenu(menu, settings) {
    watchAppearance(menu.actor, settings, ({dark, contrast}) => {
        const rgb = dark ? '29,32,38' : '244,246,250';
        const foreground = dark ? '#f4f5f7' : '#20242b';
        menu.box.set_style(`background-color: rgba(${rgb},${contrast ? 1 : 0.97}); background-gradient-direction: none; color: ${foreground}; border: ${contrast ? '2px solid ' + foreground : '1px solid ' + (dark ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.72)')};`);
    });
}
