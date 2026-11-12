import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import St from 'gi://St';
import Pango from 'gi://Pango';
import Clutter from 'gi://Clutter';
import {IslandMotion} from './motion.js';

export class IslandStudio {
    constructor(island) {
        this.island = island;
        this.recording = null;
        this.transcribing = null;
        this.generation = 0;
    }

    build() {
        const e = this.island;
        const page = e._newPage('studio');
        this.status = e._label('Dictado local · El audio no sale del equipo.', 'di-hint', {width: 360});
        this.status.clutter_text.set_line_wrap(true);
        page.add_child(this.status);
        this.recordButton = e._chip('Grabar dictado', () => this.toggleRecording(), 'audio-input-microphone-symbolic');
        page.add_child(this.recordButton);
        this.text = new St.Entry({style_class: 'di-note', hint_text: 'Escribe o pega tu guion…', can_focus: true, height: 120});
        this.text.clutter_text.set_single_line_mode(false);
        this.text.clutter_text.set_activatable(false);
        this.text.clutter_text.set_line_wrap(true);
        page.add_child(this.text);
        const controls = new St.BoxLayout({style_class: 'di-presets'});
        controls.add_child(e._chip('Copiar', () => St.Clipboard.get_default().set_text(St.ClipboardType.CLIPBOARD, this.text.text)));
        controls.add_child(e._chip('Teleprompter', () => this.play()));
        controls.add_child(e._chip('Detener', () => this.stopMotion()));
        page.add_child(controls);
        this.viewport = new St.Widget({height: 150, width: 380, clip_to_allocation: true,
            layout_manager: new Clutter.FixedLayout(), visible: false});
        this.script = e._label('', 'di-prompter', {width: 360});
        this.script.clutter_text.set_line_wrap(true);
        this.script.clutter_text.set_line_wrap_mode(Pango.WrapMode.WORD_CHAR);
        this.viewport.add_child(this.script);
        page.add_child(this.viewport);
        this.motion = new IslandMotion(this.viewport);
    }

    play() {
        this.stopMotion();
        this.script.text = this.text.text.slice(0, 20000);
        if (!this.script.text.trim()) return;
        this.viewport.show();
        this.script.translation_y = 140;
        const height = this.script.get_preferred_height(360)[1];
        const words = this.script.text.trim().split(/\s+/).length;
        const duration = Math.max(4000, words / this.island._settings.get_int('prompter-speed') * 60000);
        this.motion.run(0, 1, duration, t => t, t => {
            this.script.translation_y = 140 - t * (height + 140);
        }, () => this.stopMotion());
        this.island._resizeIsland();
    }

    stopMotion() { this.motion?.stop(); }

    toggleRecording() {
        if (this.recording) { this.recording.send_signal(15); this.status.text = 'Preparando transcripción…'; return; }
        if (this.transcribing) {
            this.generation++;
            const process = this.transcribing; this.transcribing = null;
            const directory = this.directory; this.directory = null;
            process.force_exit();
            process.wait_async(null, () => this.clean(directory));
            this.recordButton._label.text = 'Grabar dictado';
            this.status.text = 'Transcripción cancelada.';
            return;
        }
        const model = this.island._settings.get_string('dictation-model');
        const binary = GLib.find_program_in_path('whisper-cli');
        if (!binary || !GLib.file_test(model, GLib.FileTest.IS_REGULAR) || !GLib.find_program_in_path('parec')) {
            this.status.text = 'Para dictar: instala whisper.cpp (whisper-cli), PulseAudio utils y selecciona un modelo local en Ajustes.';
            return;
        }
        const generation = ++this.generation;
        this.directory = GLib.dir_make_tmp('aurea-dictation-XXXXXX');
        const wav = `${this.directory}/voice.wav`;
        const output = `${this.directory}/transcript`;
        this.recording = Gio.Subprocess.new(['python3', `${this.island.path}/audio-tools.py`, 'record', wav], Gio.SubprocessFlags.STDERR_SILENCE);
        this.recordButton._label.text = 'Detener y transcribir';
        this.status.text = 'Grabando micrófono · Máximo 5 minutos · Pulsa para detener';
        this.recording.wait_async(null, (proc, result) => {
            proc.wait_finish(result);
            if (generation !== this.generation || !this.island._alive) return;
            this.recording = null;
            this.recordButton._label.text = 'Grabar dictado';
            if (!proc.get_successful()) { this.status.text = 'No se pudo grabar el micrófono.'; this.clean(); return; }
            this.status.text = 'Transcribiendo localmente…';
            this.recordButton._label.text = 'Cancelar transcripción';
            this.transcribing = Gio.Subprocess.new([binary, '-t', '2', '-m', model, '-f', wav, '-l', 'auto', '-otxt', '-of', output],
                Gio.SubprocessFlags.STDOUT_SILENCE | Gio.SubprocessFlags.STDERR_SILENCE);
            this.transcribing.wait_async(null, (process, response) => {
                process.wait_finish(response);
                if (generation !== this.generation || !this.island._alive) return;
                this.transcribing = null;
                this.recordButton._label.text = 'Grabar dictado';
                try {
                    if (!process.get_successful()) throw new Error('transcripción');
                    this.text.text = new TextDecoder().decode(GLib.file_get_contents(`${output}.txt`)[1]).slice(0, 20000);
                    this.status.text = 'Listo. Revisa y copia el texto para pegarlo en tu aplicación.';
                } catch { this.status.text = 'No se pudo transcribir. Comprueba el modelo de whisper.cpp.'; }
                this.clean();
            });
        });
    }

    clean(directory = this.directory) {
        if (!directory) return;
        for (const name of ['voice.wav', 'transcript.txt']) {
            try { Gio.File.new_for_path(`${directory}/${name}`).delete(null); } catch {}
        }
        GLib.rmdir(directory);
        if (this.directory === directory) this.directory = null;
    }

    destroy() {
        this.generation++;
        this.motion?.destroy();
        const processes = [this.recording, this.transcribing].filter(Boolean);
        const directory = this.directory;
        this.directory = null;
        this.recording = this.transcribing = null;
        if (!processes.length) { this.clean(directory); return; }
        let remaining = processes.length;
        for (const process of processes) {
            process.send_signal(15);
            process.wait_async(null, () => { if (--remaining === 0) this.clean(directory); });
        }
    }
}
