import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import St from 'gi://St';

export class ThemeTokens {
    constructor() {
        const [file, stream] = Gio.File.new_tmp('aurea-topbar-XXXXXX.css'); stream.close(null);
        this.file = file;
    }
    apply(config) {
        const contrast = config.contrast || St.Settings.get().high_contrast;
        const accent = contrast ? '#185abc' : config.accent;
        const css = `
.lintel-menu .popup-menu-item:hover, .lintel-menu .popup-menu-item:focus,
.lintel-menu .lintel-cc-tile:hover, .lintel-menu .lintel-cc-tile:focus,
.lintel-menu .aurea-detail-row:hover, .lintel-menu .aurea-detail-row:focus,
.lintel-menu .aurea-icon-action:hover, .lintel-menu .aurea-icon-action:focus,
.lintel-menu .aurea-control-icon:checked { background-color: ${accent}; color: white; }
.lintel-menu .lintel-slider { -barlevel-active-background-color: ${accent}; }
.lintel-menu .lintel-cal-today { background-color: ${accent}; color: white; }
.lintel-menu .aurea-control-status, .lintel-menu .aurea-detail-subtitle { color: ${contrast ? '#30343b' : '#5d6570'}; }
.lintel-menu.lintel-dark .aurea-control-status, .lintel-menu.lintel-dark .aurea-detail-subtitle { color: ${contrast ? '#f4f5f7' : '#bec4cd'}; }
.lintel-menu .lintel-cc-holder, .lintel-menu .lintel-cc-holder:hover,
.lintel-menu .lintel-cc-holder:focus, .lintel-menu .lintel-item-info:hover { background-color: transparent; }
`;
        this.theme?.unload_stylesheet(this.file);
        GLib.file_set_contents(this.file.get_path(), css);
        this.theme = St.ThemeContext.get_for_stage(global.stage).get_theme();
        this.theme.load_stylesheet(this.file);
    }
    destroy() { this.theme?.unload_stylesheet(this.file); this.file.delete(null); }
}
