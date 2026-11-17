import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import {IslandModel} from './model.js';
export class Store {
    constructor(path, defaults, lookup) {
        this.file = Gio.File.new_for_path(path);
        this.error = null;
        try {
            const [ok, bytes] = this.file.load_contents(null);
            if (!ok) throw Error('No se pudo leer el archivo.');
            if (bytes.length > 2 * 1024 * 1024) throw Error('El archivo supera 2 MB.');
            this.model = new IslandModel(JSON.parse(new TextDecoder().decode(bytes)), lookup);
        } catch (error) {
            if (!error.matches?.(Gio.IOErrorEnum, Gio.IOErrorEnum.NOT_FOUND)) this.error = error.message;
            this.model = new IslandModel({favoritos: defaults}, lookup);
        }
    }
    save() {
        if (this.error) throw Error(`Guardado bloqueado para conservar el original: ${this.error}. Importa una copia válida desde Ajustes.`);
        GLib.mkdir_with_parents(this.file.get_parent().get_path(), 0o700);
        this.file.replace_contents(new TextEncoder().encode(JSON.stringify(this.model.data, null, 2)),
            null, true, Gio.FileCreateFlags.PRIVATE | Gio.FileCreateFlags.REPLACE_DESTINATION, null);
    }
    import(path) {
        const file = Gio.File.new_for_path(path);
        const [ok, bytes] = file.load_contents(null);
        if (!ok || bytes.length > 2 * 1024 * 1024) throw Error('Importación inválida o demasiado grande.');
        const next = new IslandModel(JSON.parse(new TextDecoder().decode(bytes)));
        const old = this.model, error = this.error;
        this.model = next; this.error = null;
        try { this.save(); } catch (e) { this.model = old; this.error = error; throw e; }
        return next;
    }
    export(path) {
        if (Gio.File.new_for_path(path).equal(this.file)) throw Error('Elige un destino distinto al archivo activo.');
        Gio.File.new_for_path(path).replace_contents(new TextEncoder().encode(JSON.stringify(this.model.data, null, 2)),
            null, false, Gio.FileCreateFlags.PRIVATE, null);
    }
}
