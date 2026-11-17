import Clutter from 'gi://Clutter';
import St from 'gi://St';
import Pango from 'gi://Pango';
import {parseLyrics, currentLyric} from './content-models.js';

export class MediaExtras {
    constructor(island) {
        this.island = island;
        this.cache = new Map();
        this.lines = [];
        this.key = null;
        this.pending = false;
    }

    build(page) {
        const e = this.island;
        this.button = e._chip('Letras · LRCLIB', () => {
            this.box.visible = !this.box.visible;
            if (this.box.visible) this.load();
            e._resizeIsland();
        }, 'view-list-symbolic');
        page.add_child(this.button);
        this.box = new St.BoxLayout({orientation: Clutter.Orientation.VERTICAL, visible: false, style_class: 'di-lyrics'});
        this.labels = ['di-hint', 'di-lyric-current', 'di-hint'].map(cls => {
            const label = e._label('', cls, {width: 360});
            label.clutter_text.set_line_wrap(true);
            label.clutter_text.set_line_wrap_mode(Pango.WrapMode.WORD_CHAR);
            this.box.add_child(label);
            return label;
        });
        page.add_child(this.box);
    }

    load() {
        const e = this.island;
        if (!e._settings.get_boolean('lyrics-enabled')) {
            this.lines = [];
            this.labels[0].text = this.labels[2].text = '';
            this.labels[1].text = 'Activa Letras en Ajustes. Se enviarán título y artista a LRCLIB.';
            return;
        }
        const key = `${e._name}:${e._title.text}:${e._artist.text}`;
        if (this.pending || this.key === key) return;
        this.key = key;
        this.lines = [];
        this.labels[0].text = this.labels[2].text = '';
        if (this.cache.has(key)) { this.apply(this.cache.get(key)); return; }
        if (!e._name) { this.labels[1].text = 'Inicia una canción para ver su letra.'; return; }
        this.labels[1].text = 'Buscando letra…';
        this.pending = true;
        const url = `https://lrclib.net/api/get?track_name=${encodeURIComponent(e._title.text)}&artist_name=${encodeURIComponent(e._artist.text)}`;
        e._getJson(url, data => {
            this.pending = false;
            if (!e._alive) return;
            if (key !== `${e._name}:${e._title.text}:${e._artist.text}`) { this.key = null; this.load(); return; }
            this.cache.set(key, data);
            if (this.cache.size > 20) this.cache.delete(this.cache.keys().next().value);
            this.apply(data);
        });
    }

    apply(data) {
        this.lines = parseLyrics(data?.syncedLyrics);
        this.labels[1].text = data?.instrumental ? 'Instrumental' :
            data?.plainLyrics?.slice(0, 2500) || 'Letra no disponible. Puedes volver a intentarlo al cambiar de canción.';
        this.refresh();
        this.island._resizeIsland();
    }

    refresh() {
        if (!this.box?.visible) return;
        if (this.key !== `${this.island._name}:${this.island._title.text}:${this.island._artist.text}`) this.load();
        if (!this.lines.length) return;
        const line = currentLyric(this.lines, this.island._position);
        this.labels[0].text = line.previous;
        this.labels[1].text = line.current || '…';
        this.labels[2].text = line.next;
    }
}
