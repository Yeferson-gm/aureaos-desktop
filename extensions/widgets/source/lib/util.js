import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import Soup from 'gi://Soup?version=3.0';
import {ResponseCache} from './response-cache.js';

export const CFG_DIR = GLib.build_filenamev([GLib.get_user_config_dir(), 'lintel-widgets']);
export const CACHE_DIR = GLib.build_filenamev([GLib.get_user_cache_dir(), 'lintel-widgets']);

export const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
export const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto',
    'septiembre', 'octubre', 'noviembre', 'diciembre'];

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
export const pad = n => String(n).padStart(2, '0');
export const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const nuevoId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
export const fechaLarga = d => `${DIAS[d.getDay()]}, ${d.getDate()} de ${MESES[d.getMonth()]}`;
export const clonar = o => JSON.parse(JSON.stringify(o));

export function hex255(hex) {
    const h = (hex || '#000000').replace('#', '');
    const f = h.length === 3 ? h.split('').map(c => c + c).join('') : h.padEnd(6, '0');
    return [parseInt(f.slice(0, 2), 16), parseInt(f.slice(2, 4), 16), parseInt(f.slice(4, 6), 16)];
}
export const rgb01 = hex => hex255(hex).map(v => v / 255);
export const rgbaCss = (hex, a) => `rgba(${hex255(hex).join(',')},${a})`;

export function fmtDur(seg) {
    const h = Math.floor(seg / 3600);
    const m = Math.floor(seg % 3600 / 60);
    return h ? `${h} h ${m} min` : `${m} min`;
}

export function haceTiempo(fecha) {
    if (!fecha)
        return '';
    const s = Math.max(0, (Date.now() - fecha.getTime()) / 1000);
    if (s < 3600) return `hace ${Math.max(1, Math.floor(s / 60))} min`;
    if (s < 86400) return `hace ${Math.floor(s / 3600)} h`;
    if (s < 86400 * 30) return `hace ${Math.floor(s / 86400)} d`;
    return `${fecha.getDate()} ${MESES[fecha.getMonth()].slice(0, 3)}`;
}


export function leerJSON(file, def) {
    try {
        const [ok, bytes] = GLib.file_get_contents(file);
        if (ok)
            return JSON.parse(new TextDecoder().decode(bytes));
    } catch (_e) {

    }
    return def;
}

export function escribirJSON(file, obj) {
    try {
        GLib.mkdir_with_parents(GLib.path_get_dirname(file), 0o755);
        GLib.file_set_contents(file, JSON.stringify(obj));
    } catch (e) {
        console.error(`[Widgets] escribir ${file}: ${e.message}`);
    }
}

export class Almacen {
    constructor(nombre, defecto) {
        this.file = GLib.build_filenamev([CFG_DIR, `${nombre}.json`]);
        this.datos = Object.assign(clonar(defecto), leerJSON(this.file, {}));
        this._t = 0;
    }

    guardar() {
        if (this._t)
            GLib.source_remove(this._t);
        this._t = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 700, () => {
            this._t = 0;
            escribirJSON(this.file, this.datos);
            return GLib.SOURCE_REMOVE;
        });
    }

    destruir() {
        if (this._t) {
            GLib.source_remove(this._t);
            this._t = 0;
            escribirJSON(this.file, this.datos);
        }
    }
}

export function uriDe(path) {
    return Gio.File.new_for_path(path).get_uri();
}

export function abrirUri(uri) {
    try {
        Gio.AppInfo.launch_default_for_uri(uri, global.create_app_launch_context(0, -1));
    } catch (e) {
        console.error(`[Widgets] abrir ${uri}: ${e.message}`);
    }
}

export function dirImagenes() {
    return GLib.get_user_special_dir(GLib.UserDirectory.DIRECTORY_PICTURES) ??
        GLib.build_filenamev([GLib.get_home_dir(), 'Pictures']);
}

export function listarImagenes(dir, prof = 1, limite = 2500, sinEnlaces = false) {
    const out = [];
    const attrs = 'standard::name,standard::type,standard::content-type,standard::size,time::modified,standard::is-hidden';
    const rec = (d, nivel, album) => {
        let en;
        try {
            en = Gio.File.new_for_path(d).enumerate_children(attrs,
                sinEnlaces ? Gio.FileQueryInfoFlags.NOFOLLOW_SYMLINKS : Gio.FileQueryInfoFlags.NONE, null);
        } catch (_e) {
            return;
        }
        let i;
        while ((i = en.next_file(null)) !== null && out.length < limite) {
            if (i.get_is_hidden())
                continue;
            if (sinEnlaces && i.get_file_type() !== Gio.FileType.REGULAR)
                continue;
            const p = GLib.build_filenamev([d, i.get_name()]);
            if (i.get_file_type() === Gio.FileType.DIRECTORY) {
                if (nivel < prof)
                    rec(p, nivel + 1, i.get_name());
            } else if ((i.get_content_type() ?? '').startsWith('image/')) {
                out.push({
                    path: p, album, size: Number(i.get_size()),
                    mtime: Number(i.get_attribute_uint64('time::modified')),
                });
            }
        }
        en.close(null);
    };
    rec(dir, 0, '');
    return out;
}


let _sesion = null;
const _cache = new ResponseCache();
const _pending = new Map();
let _httpGeneration = 0;

export function http(url, {ttl = 0, binario = false} = {}) {
    const key = `${binario ? 'bytes' : 'text'}:${url}`;
    const hit = ttl ? _cache.get(key, ttl) : undefined;
    if (hit !== undefined) return Promise.resolve(hit);
    const generation = _httpGeneration;
    const remember = value => {
        if (generation === _httpGeneration && ttl) _cache.set(key, value, ttl);
        return value;
    };
    if (_pending.has(key)) return _pending.get(key).then(remember);
    _sesion ??= new Soup.Session({timeout: 15, user_agent: 'Mozilla/5.0 (X11; Linux x86_64) LintelWidgets/1.0'});
    const request = new Promise((resolve, reject) => {
        let msg = null;
        try {
            msg = Soup.Message.new('GET', url);
        } catch (e) {
            reject(e);
            return;
        }
        if (!msg) {
            reject(new Error('URL no válida'));
            return;
        }
        _sesion.send_and_read_async(msg, GLib.PRIORITY_DEFAULT, null, (s, r) => {
            try {
                const bytes = s.send_and_read_finish(r);
                const st = msg.get_status();
                if (st >= 400)
                    throw new Error(`HTTP ${st}`);
                const v = binario ? bytes.get_data() : new TextDecoder().decode(bytes.get_data());
                resolve(v);
            } catch (e) {
                reject(e);
            }
        });
    });
    _pending.set(key, request);
    return request.then(remember).finally(() => {
        if (_pending.get(key) === request) _pending.delete(key);
    });
}

export function cerrarHttp() {
    _httpGeneration++;
    _pending.clear();
    _sesion?.abort();
    _sesion = null;
    _cache.clear();
}


export async function imagenLocal(url) {
    if (url.startsWith('file://'))
        return Gio.File.new_for_uri(url).get_path();
    const ruta = GLib.build_filenamev([CACHE_DIR, `img-${GLib.compute_checksum_for_string(GLib.ChecksumType.MD5, url, -1)}`]);
    if (GLib.file_test(ruta, GLib.FileTest.EXISTS))
        return ruta;
    const bytes = await http(url, {binario: true});
    GLib.mkdir_with_parents(CACHE_DIR, 0o755);
    GLib.file_set_contents(ruta, bytes);
    return ruta;
}


export function llamar(bus, dest, ruta, iface, metodo, params = null, tipo = null, timeout = 4000) {
    return new Promise((res, rej) => {
        bus.call(dest, ruta, iface, metodo, params, tipo ? new GLib.VariantType(tipo) : null,
            Gio.DBusCallFlags.NONE, timeout, null, (c, r) => {
                try {
                    res(c.call_finish(r));
                } catch (e) {
                    rej(e);
                }
            });
    });
}

export async function props(bus, dest, ruta, iface) {
    const v = await llamar(bus, dest, ruta, 'org.freedesktop.DBus.Properties', 'GetAll',
        new GLib.Variant('(s)', [iface]), '(a{sv})');
    return v.recursiveUnpack()[0];
}

export function fijarProp(bus, dest, ruta, iface, nombre, tipo, valor) {
    return llamar(bus, dest, ruta, 'org.freedesktop.DBus.Properties', 'Set',
        new GLib.Variant('(ssv)', [iface, nombre, new GLib.Variant(tipo, valor)]));
}


export async function dispositivosKde() {
    const bus = Gio.DBus.session;
    let ids;
    try {
        const r = await llamar(bus, 'org.kde.kdeconnect', '/modules/kdeconnect',
            'org.kde.kdeconnect.daemon', 'devices', new GLib.Variant('(bb)', [false, true]), '(as)');
        ids = r.recursiveUnpack()[0];
    } catch (_e) {
        return null;
    }
    const out = [];
    for (const id of ids) {
        const ruta = `/modules/kdeconnect/devices/${id}`;
        try {
            const p = await props(bus, 'org.kde.kdeconnect', ruta, 'org.kde.kdeconnect.device');
            const d = {id, ruta, nombre: p.name, tipo: p.type, alcanzable: !!p.isReachable, bateria: null, cargando: false};
            if (d.alcanzable) {
                try {
                    const b = await props(bus, 'org.kde.kdeconnect', `${ruta}/battery`, 'org.kde.kdeconnect.device.battery');
                    d.bateria = b.charge ?? null;
                    d.cargando = !!b.isCharging;
                } catch (_e) {

                }
            }
            out.push(d);
        } catch (_e) {

        }
    }
    return out;
}


const ENT = {amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' '};
function decod(s) {
    return s.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (m, e) => {
        if (e[0] === '#') {
            const n = e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
            try {
                return String.fromCodePoint(n);
            } catch (_e) {
                return m;
            }
        }
        return ENT[e.toLowerCase()] ?? m;
    });
}
const sinCdata = s => s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
const texto = s => decod(sinCdata(s)).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

export function parsearFeed(xml) {
    const bloques = xml.match(/<(item|entry)[\s>][\s\S]*?<\/\1>/gi) ?? [];
    const tag = (b, n) => {
        const m = b.match(new RegExp(`<${n}(?:\\s[^>]*)?>([\\s\\S]*?)</${n}>`, 'i'));
        return m ? m[1] : '';
    };
    const attr = (b, n, a) => {
        const m = b.match(new RegExp(`<${n}\\s[^>]*?${a}=["']([^"']+)["']`, 'i'));
        return m ? decod(m[1]) : '';
    };
    const items = bloques.slice(0, 40).map(b => {
        const enlace = texto(tag(b, 'link')) || attr(b, 'link', 'href');
        const f = texto(tag(b, 'pubDate') || tag(b, 'published') || tag(b, 'updated') || tag(b, 'dc:date'));
        const fecha = f ? new Date(f) : null;
        const desc = tag(b, 'description') || tag(b, 'summary') || tag(b, 'content:encoded') || tag(b, 'content');
        let imagen = attr(b, 'media:thumbnail', 'url') || attr(b, 'media:content', 'url') ||
            (/type=["']image/i.test(b) ? attr(b, 'enclosure', 'url') : '') || attr(b, 'itunes:image', 'href');
        if (!imagen) {
            const m = decod(sinCdata(desc)).match(/<img[^>]+src=["']([^"']+)["']/i);
            imagen = m ? m[1] : '';
        }
        const enc = b.match(/<enclosure[^>]+>/i)?.[0] ?? '';
        const audio = /audio|\.mp3|\.m4a|\.ogg/i.test(enc) ? (enc.match(/url=["']([^"']+)["']/i)?.[1] ?? '') : '';
        return {
            titulo: texto(tag(b, 'title')), enlace, imagen, audio: decod(audio),
            fecha: fecha && !isNaN(fecha) ? fecha : null,
            resumen: texto(desc).slice(0, 420), duracion: texto(tag(b, 'itunes:duration')),
        };
    }).filter(i => i.titulo);
    const antes = xml.split(/<(?:item|entry)[\s>]/i)[0];
    return {
        titulo: texto(tag(antes, 'title')),
        imagen: attr(antes, 'itunes:image', 'href') || texto(tag(tag(antes, 'image'), 'url')),
        items,
    };
}


function pascua(y) {
    const a = y % 19, b = Math.floor(y / 100), c = y % 100;
    const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const mes = Math.floor((h + l - 7 * m + 114) / 31);
    const dia = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(y, mes - 1, dia);
}

const _feriados = new Map();
export function feriadosPeru(y) {
    if (_feriados.has(y))
        return _feriados.get(y);
    const m = new Map();
    const fijo = {
        '01-01': 'Año Nuevo', '05-01': 'Día del Trabajo', '06-07': 'Batalla de Arica y Día de la Bandera',
        '06-29': 'San Pedro y San Pablo', '07-23': 'Día de la Fuerza Aérea del Perú', '07-28': 'Fiestas Patrias',
        '07-29': 'Fiestas Patrias', '08-06': 'Batalla de Junín', '08-30': 'Santa Rosa de Lima',
        '10-08': 'Combate de Angamos', '11-01': 'Todos los Santos', '12-08': 'Inmaculada Concepción',
        '12-09': 'Batalla de Ayacucho', '12-25': 'Navidad',
    };
    for (const [k, v] of Object.entries(fijo))
        m.set(`${y}-${k}`, v);
    const p = pascua(y);
    for (const [off, n] of [[-3, 'Jueves Santo'], [-2, 'Viernes Santo']])
        m.set(iso(new Date(p.getFullYear(), p.getMonth(), p.getDate() + off)), n);
    _feriados.set(y, m);
    return m;
}
