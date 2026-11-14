import Clutter from 'gi://Clutter';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import Shell from 'gi://Shell';
import St from 'gi://St';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

export async function verifyDesign(core, wait) {
    const dir = GLib.getenv('DI_TEST_DIR');
    if (!dir) throw new Error('Solo sesión aislada');
    const root = core.ext.dir.get_uri();
    const {Marco} = await import(`${root}/lib/marco.js`);
    const {estiloNuevo} = await import(`${root}/lib/estilo.js`);
    const {LISTA, MODULOS} = await import(`${root}/widgets/index.js`);
    const originalWeather = MODULOS.clima.Widget.prototype._cargar;
    const originalBattery = MODULOS.baterias.Widget.prototype._cargar;
    MODULOS.clima.Widget.prototype._cargar = async function () {
        this._d = {
            current: {temperature_2m: 26, weather_code: 2, is_day: 1, time: '2026-11-12T12:00', relative_humidity_2m: 64, wind_speed_10m: 12, apparent_temperature: 27},
            hourly: {time: Array.from({length: 8}, (_, i) => `2026-11-12T${12 + i}:00`), temperature_2m: [26,27,28,28,27,25,24,23], weather_code: [2,1,0,0,1,2,3,3]},
            daily: {time: Array.from({length: 7}, (_, i) => `2026-11-${12 + i}`), temperature_2m_min: [18,18,19,18,17,18,19], temperature_2m_max: [28,27,29,26,25,26,28], weather_code: [2,1,0,3,3,2,0], precipitation_probability_max: [10,5,0,20,20,5,0]},
        };
        this._pintar();
    };
    MODULOS.baterias.Widget.prototype._cargar = async function () {
        this._lista = [{nombre: 'Equipo de prueba', tipo: 'Batería del equipo', principal: true, pct: 80, estado: 1, llenar: 1800, vaciar: 0}];
        this._pintar();
    };
    const surface = new St.Widget({width: 1920, height: 1080, style: 'background-gradient-direction: vertical; background-gradient-start: #638b9c; background-gradient-end: #aab3a4;'});
    Main.uiGroup.add_child(surface);
    const savedData = JSON.parse(JSON.stringify(core.datos.datos));
    core.datos.datos.notas = [{id: 'sample', texto: 'Ideas para mañana\nRevisar el diseño y preparar una nueva presentación.', color: '#ffd60a', imgs: [], mod: 1}];
    core.datos.datos.tareas = ['Revisar el proyecto', 'Pasear por el parque', 'Leer un capítulo'].map((t, i) => ({id: `t${i}`, t, lista: 'l1', ok: false, prio: 0, fecha: ''}));
    core.datos.datos.contactos = ['Ana Ejemplo', 'Luis Ejemplo', 'Sara Ejemplo'].map((nombre, i) => ({id: `c${i}`, nombre, tel: '', email: '', cumple: '', nota: '', foto: ''}));
    const oldTheme = core.cfg.global.tema;
    const oldMotion = core.cfg.global.animaciones;
    const frames = [];
    let tested = 0;
    const clear = () => { for (const frame of frames.splice(0)) frame.destruir(); };
    const scan = actor => {
        if (actor.text?.startsWith('Error en')) throw new Error(actor.text);
        actor.get_children().forEach(scan);
    };
    try {
        core.cfg.global.animaciones = false;
        for (const theme of ['claro', 'oscuro']) {
            core.cfg.global.tema = theme;
            for (const size of ['S', 'M', 'L']) {
                for (let page = 0; page < 3; page++) {
                    clear();
                    const modules = LISTA.slice(page * 6, page * 6 + 6);
                    for (const [i, mod] of modules.entries()) {
                        const [w, h] = mod.META.tam[size];
                        const cfg = {id: `design-${tested}`, tipo: mod.META.id, x: 70 + (i % 3) * 560, y: 80 + Math.floor(i / 3) * 460, w, h,
                            opts: {}, estilo: estiloNuevo(theme === 'oscuro' ? 'glass' : 'solido')};
                        if (mod.META.id === 'reloj' && size !== 'S') cfg.opts.estilo = 'mundial';
                        const frame = new Marco(core, cfg, mod);
                        frames.push(frame); surface.add_child(frame.actor);
                        frame.aparecer();
                        if (frame.actor.opacity !== 255 || frame.actor.scale_x !== 1)
                            throw new Error('Movimiento reducido no respetado');
                        if (frame._inst.movimiento) throw new Error('Movimiento activo con preferencia desactivada');
                        tested++;
                    }
                    await wait(250);
                    frames.forEach(frame => scan(frame.actor));
                    const file = Gio.File.new_for_path(`${dir}/design-${theme}-${size}-${page}.png`).replace(null, false, Gio.FileCreateFlags.NONE, null);
                    await new Shell.Screenshot().screenshot(false, file); file.close(null);
                }
            }
        }
        for (const night of [false, true]) {
            clear();
            const codes = [0, 2, 3, 61, 95, 71, 45];
            for (const [i, code] of codes.entries()) {
                const cfg = {id: `weather-${i}`, tipo: 'clima', x: 70 + (i % 4) * 450, y: 80 + Math.floor(i / 4) * 460,
                    w: 380, h: 380, opts: {}, estilo: estiloNuevo('glass')};
                const frame = new Marco(core, cfg, MODULOS.clima);
                frames.push(frame); surface.add_child(frame.actor);
                frame.aparecer();
                frame._inst._d.current.weather_code = code;
                frame._inst._d.current.is_day = night ? 0 : 1;
                frame._inst._pintar();
            }
            await wait(250);
            frames.forEach(frame => scan(frame.actor));
            const file = Gio.File.new_for_path(`${dir}/weather-${night ? 'night' : 'day'}.png`).replace(null, false, Gio.FileCreateFlags.NONE, null);
            await new Shell.Screenshot().screenshot(false, file); file.close(null);
        }
        clear();
        const pattern = new St.DrawingArea({width: 1920, height: 1080});
        pattern.connect('repaint', () => {
            const cr = pattern.get_context();
            for (let y = 0; y < 1080; y += 8) for (let x = 0; x < 1920; x += 8) {
                const color = ((x + y) / 8) % 2 ? 0.9 : 0.1;
                cr.setSourceRGB(color, color, color); cr.rectangle(x, y, 8, 8); cr.fill();
            }
            cr.$dispose();
        });
        surface.add_child(pattern);
        const cfg = {id: 'glass-test', tipo: 'reloj', x: 70, y: 80, w: 380, h: 170, opts: {}, estilo: estiloNuevo('glass')};
        const frame = new Marco(core, cfg, MODULOS.reloj);
        frames.push(frame); surface.add_child(frame.actor);
        const geometries = {};
        const capture = async name => {
            await wait(200);
            const file = Gio.File.new_for_path(`${dir}/${name}.png`).replace(null, false, Gio.FileCreateFlags.NONE, null);
            await new Shell.Screenshot().screenshot(false, file); file.close(null);
        };
        for (const [name, w, h, rotation] of [['normal', 380, 170, 0], ['resized', 480, 250, 0], ['editing', 380, 170, 7]]) {
            frame.fijarRect(70, 80, w, h);
            frame.actor.rotation_angle_z = rotation;
            frame._blur.visible = false; await capture(`glass-${name}-off`);
            frame._blur.visible = true; await capture(`glass-${name}-on`);
            frame._blurMask.set_enabled(false); await capture(`glass-${name}-unclipped`);
            frame._blurMask.set_enabled(true);
            geometries[name] = {position: [70,80], size: [w,h], rotation, radius: [24,24], stage: [1920,1080]};
        }
        GLib.file_set_contents(`${dir}/glass.json`, JSON.stringify(geometries));
    } finally {
        clear(); surface.destroy();
        core.datos.datos = savedData;
        core.cfg.global.tema = oldTheme; core.cfg.global.animaciones = oldMotion;
        MODULOS.clima.Widget.prototype._cargar = originalWeather;
        MODULOS.baterias.Widget.prototype._cargar = originalBattery;
    }
    if (tested !== 78) throw new Error(`Matriz incompleta: ${tested}`);
    return tested;
}
