import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import St from 'gi://St';
import Clutter from 'gi://Clutter';

const PROVIDERS = [
    {id: 'codex', name: 'Codex', desktops: ['codex.desktop', 'chatgpt.desktop'], extra: ['/usr/lib/chatgpt/resources/codex']},
    {id: 'claude', name: 'Claude', desktops: ['claude.desktop', 'com.anthropic.Claude.desktop'], extra: []},
    {id: 'opencode', name: 'OpenCode', desktops: ['ai.opencode.desktop.desktop', 'opencode-desktop.desktop'], extra: []},
];
export function discoverAssistants() {
    return PROVIDERS.map(provider => {
        const candidates = [GLib.find_program_in_path(provider.id), `${GLib.get_home_dir()}/.local/bin/${provider.id}`, `${GLib.get_home_dir()}/.${provider.id}/bin/${provider.id}`, ...provider.extra];
        const binary = candidates.find(path => path && GLib.file_test(path, GLib.FileTest.IS_EXECUTABLE) && !GLib.file_test(path, GLib.FileTest.IS_DIR)) ?? null;
        const desktop = provider.desktops.map(id => Gio.DesktopAppInfo.new(id)).find(Boolean) ?? null;
        return {...provider, binary, desktop};
    });
}
export function assistantCommand(provider, prompt, path) {
    if (!provider.binary) throw new Error('La herramienta de terminal no está instalada');
    if (typeof prompt !== 'string' || prompt.length > 12000) throw new Error('La consulta admite hasta 12 000 caracteres');
    const command = provider.id === 'opencode' ? [provider.binary] : [provider.binary, '--', prompt];
    return ['python3', `${path}/aurea-task.py`, '--title', `${provider.name} · sesión`, '--', ...command];
}
export class Assistants {
    constructor(island, page) {
        this.island = island;
        const block = new St.BoxLayout({orientation: Clutter.Orientation.VERTICAL, style_class: 'di-assistants'}); page.add_child(block);
        block.add_child(island._label('Tus asistentes', 'di-dashboard-title'));
        const hint = island._label('Consulta en una sesión interactiva o copia el texto y abre la aplicación.', 'di-hint', {width: 370}); hint.clutter_text.set_line_wrap(true); block.add_child(hint);
        this.prompt = this.field('Escribe una consulta…', ''); block.add_child(this.prompt);
        this.project = this.field('Carpeta de trabajo', GLib.get_home_dir()); block.add_child(this.project);
        this.status = island._label('', 'di-hint', {width: 370}); this.status.clutter_text.set_line_wrap(true);
        this.providers = new St.BoxLayout({orientation: Clutter.Orientation.VERTICAL, style_class: 'di-live-list'}); block.add_child(this.providers);
        block.add_child(island._chip('Volver a detectar herramientas', () => this.refresh(), 'view-refresh-symbolic'));
        block.add_child(this.status); this.refresh();
    }
    field(hint, text) {
        const field = new St.Entry({hint_text: hint, accessible_name: hint, text, can_focus: true, style_class: 'di-search'});
        field.clutter_text.editable = false;
        field.clutter_text.connect('key-focus-in', actor => { actor.editable = true; });
        field.clutter_text.connect('key-focus-out', actor => { actor.editable = false; });
        return field;
    }
    refresh() {
        this.providers.destroy_all_children();
        for (const provider of discoverAssistants()) {
            const row = new St.BoxLayout({orientation: Clutter.Orientation.VERTICAL, style_class: 'di-agent-card'});
            row.add_child(this.island._label(provider.name, 'di-dashboard-detail'));
            row.add_child(this.island._label(provider.binary ? 'Terminal disponible · sesión interactiva' : provider.desktop ? 'Aplicación disponible · pegar consulta al abrir' : 'No se encontró una instalación válida', 'di-hint'));
            const actions = new St.BoxLayout({style_class: 'di-glance-actions'});
            if (provider.binary) actions.add_child(this.island._chip('Iniciar sesión', () => this.start(provider), 'utilities-terminal-symbolic'));
            if (provider.desktop) actions.add_child(this.island._chip('Copiar y abrir app', () => {
                try {
                    const text = this.prompt.get_text(); if (text) St.Clipboard.get_default().set_text(St.ClipboardType.CLIPBOARD, text);
                    provider.desktop.launch([], global.create_app_launch_context(0, -1)); this.status.text = 'Consulta copiada. Pégala en la aplicación para continuar.';
                } catch (error) { this.status.text = error.message; }
            }, 'go-next-symbolic'));
            row.add_child(actions); this.providers.add_child(row);
        }
    }
    start(provider) {
        try {
            const prompt = this.prompt.get_text().trim();
            if (!prompt) throw new Error('Escribe la consulta antes de iniciar');
            const folder = this.project.get_text().trim().replace(/^~(?=\/|$)/, GLib.get_home_dir());
            if (!GLib.path_is_absolute(folder) || !GLib.file_test(folder, GLib.FileTest.IS_DIR)) throw new Error('Elige una carpeta de trabajo existente');
            const command = assistantCommand(provider, prompt, this.island.path);
            if (provider.id === 'opencode') St.Clipboard.get_default().set_text(St.ClipboardType.CLIPBOARD, prompt);
            const ptyxis = GLib.find_program_in_path('ptyxis'), terminal = GLib.find_program_in_path('gnome-terminal');
            const argv = ptyxis ? [ptyxis, '--new-window', '--working-directory', folder, '--', ...command] : terminal ? [terminal, '--working-directory', folder, '--', ...command] : null;
            if (!argv) throw new Error('No hay un terminal compatible. Usa Copiar y abrir app.');
            this.island._settings.set_boolean('agent-events', true);
            Gio.Subprocess.new(argv, Gio.SubprocessFlags.NONE);
            this.status.text = provider.id === 'opencode' ? 'Sesión abierta. Pega la consulta copiada para continuar.' : 'Sesión abierta. Las aprobaciones y respuestas permanecen en tu herramienta.';
        } catch (error) { this.status.text = error.message; }
    }
}
