import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

export class AudioMeter {
    constructor(island) {
        this.island = island;
        this.process = null;
        this.failed = false;
    }

    start() {
        if (this.process || this.failed) return;
        if (!GLib.find_program_in_path('parec') || !GLib.find_program_in_path('pactl')) { this.failed = true; return; }
        const cancel = new Gio.Cancellable();
        this.cancel = cancel;
        const proc = Gio.Subprocess.new(['python3', `${this.island.path}/audio-tools.py`, 'levels'],
            Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_SILENCE);
        this.process = proc;
        const stream = new Gio.DataInputStream({base_stream: proc.get_stdout_pipe()});
        const read = () => stream.read_line_async(GLib.PRIORITY_DEFAULT, cancel, (input, result) => {
            try {
                const [line] = input.read_line_finish_utf8(result);
                if (this.process !== proc || line === null) return;
                const levels = JSON.parse(line);
                if (Array.isArray(levels)) this.island._barItems.forEach((bar, index) => {
                    bar.height = 3 + 12 * Math.max(0, Math.min(1, Number(levels[index]) || 0));
                });
                read();
            } catch (error) { if (!cancel.is_cancelled() && this.process === proc) this.failed = true; }
        });
        read();
        proc.wait_async(null, () => {
            if (this.process !== proc) return;
            this.process = null;
            this.failed = true;
            this.island._toast({key: 'audio-meter', text: 'Audio real no disponible; revisa el servicio de sonido', icon: 'audio-volume-muted-symbolic'});
        });
    }

    stop() {
        this.cancel?.cancel();
        const proc = this.process;
        this.process = null;
        proc?.send_signal(15);
    }
}
