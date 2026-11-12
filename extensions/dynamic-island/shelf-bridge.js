import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

export class ShelfBridge {
    constructor(island) {
        this.island = island;
        this.process = null;
        const dnd = global.backend.get_dnd();
        island._connect(dnd, 'dnd-position-change', (_dnd, x, y) => {
            if (this.process || Main.sessionMode.isLocked || !island._host.visible) return;
            const [px, py] = island._pill.get_transformed_position();
            if (x >= px && x <= px + island._pill.width && y >= py && y <= py + island._pill.height)
                this.open();
        });
    }

    open() {
        if (this.process || Main.sessionMode.isLocked) return;
        const e = this.island;
        e._closeIsland();
        const cancel = new Gio.Cancellable();
        this.cancel = cancel;
        const launcher = new Gio.SubprocessLauncher({flags: Gio.SubprocessFlags.STDOUT_PIPE});
        launcher.setenv('GSK_RENDERER', 'gl', true);
        const process = launcher.spawnv(['/usr/bin/python3', `${e.path}/shelf-window.py`, JSON.stringify(e._shelf)]);
        this.process = process;
        this.launchTimeout = e._timeout(10000, () => {
            this.launchTimeout = 0;
            if (this.process === process && !this.window) {
                this.close();
                e._toast({text: 'No se pudo mostrar el estante GTK.', icon: 'dialog-warning-symbolic', warn: true});
            }
            return GLib.SOURCE_REMOVE;
        });
        this.windowSignal = global.display.connect('window-created', (_d, win) => {
            if (win.get_pid() !== Number(process.get_identifier())) return;
            this.window = win;
            e._clear(this.launchTimeout);
            this.launchTimeout = 0;
            const place = () => {
                if (this.process !== process) return GLib.SOURCE_REMOVE;
                const monitor = e._monitor();
                const rect = win.get_frame_rect();
                win.move_frame(true, monitor.x + Math.round((monitor.width - rect.width) / 2), monitor.y + 8);
                win.make_above();
                win.activate(global.get_current_time());
                e._host.hide();
                e._updatePill();
                return GLib.SOURCE_REMOVE;
            };
            e._timeout(100, place);
        });
        const stream = new Gio.DataInputStream({base_stream: process.get_stdout_pipe()});
        const read = () => stream.read_line_async(GLib.PRIORITY_DEFAULT, cancel, (input, result) => {
            try {
                const [line] = input.read_line_finish_utf8(result);
                if (line === null || this.process !== process) return;
                const data = JSON.parse(line);
                if (Array.isArray(data.files)) e._shelfAdd(data.files.slice(0, 50)
                    .filter(path => typeof path === 'string' && GLib.path_is_absolute(path))
                    .map(path => Gio.File.new_for_path(path).get_uri()));
                read();
            } catch (error) {
                if (!cancel.is_cancelled()) console.debug(`Estante: ${error.message}`);
            }
        });
        read();
        process.wait_async(null, () => {
            if (this.process !== process) return;
            this.close(false);
            if (e._alive) e._syncFullscreen();
        });
    }

    close(terminate = true) {
        const process = this.process;
        this.process = null;
        this.window = null;
        this.island._clear(this.launchTimeout);
        this.launchTimeout = 0;
        this.cancel?.cancel();
        if (this.windowSignal) global.display.disconnect(this.windowSignal);
        this.windowSignal = 0;
        if (terminate) process?.force_exit();
        if (process && this.island._alive) this.island._timeout(0, () => {
            this.island._syncFullscreen();
            return GLib.SOURCE_REMOVE;
        });
    }
}
