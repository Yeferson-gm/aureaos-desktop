import Gio from 'gi://Gio';
import {clamp, hex255, rgb01} from './util.js';

let _ajustes = null;
export function oscuroSistema() {
    try {
        _ajustes ??= new Gio.Settings({schema_id: 'org.gnome.desktop.interface'});
        return _ajustes.get_string('color-scheme') === 'prefer-dark';
    } catch (_e) {
        return true;
    }
}

export const ESTILO_DEF = {
    glass: {opacidad: 42, desenfoque: 45},
    solido: {opacidad: 100, desenfoque: 0},
};

export function estiloNuevo(tipo = 'glass') {
    return {
        estilo: tipo, tema: 'global', radio: 24, tinte: '', acento: '', borde: true, sombra: true,
        escala: 100, ...ESTILO_DEF[tipo],
    };
}

export function paleta(est, glob) {
    const modo = !est.tema || est.tema === 'global' ? glob.tema : est.tema;
    const oscuro = modo === 'oscuro' || (modo === 'auto' && oscuroSistema());
    const acento = est.acento || '#0a84ff';
    const texto = oscuro ? '#f5f5f7' : '#1c1c1e';
    return {
        oscuro, acento, texto,
        texto2: oscuro ? 'rgba(235,235,245,0.84)' : 'rgba(60,60,67,0.84)',
        sep: oscuro ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.12)',
        superficie: oscuro ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.06)',
        rojo: '#ff453a', verde: '#30d158', naranja: '#ff9f0a', amarillo: '#ffd60a',
        rgb: {texto: rgb01(texto), acento: rgb01(acento), rojo: rgb01('#ff453a'), verde: rgb01('#30d158'),
            naranja: rgb01('#ff9f0a')},
    };
}

export function cssMarco(est, pal) {
    const glass = est.estilo === 'glass';
    const base = est.tinte || (pal.oscuro ? (glass ? '#353640' : '#1e1e24') : '#ffffff');
    const [r, g, b] = hex255(base);
    const a = clamp(est.opacidad, 0, 100) / 100;
    let s = `font-family: "Adwaita Sans", sans-serif; background-color: rgba(${r},${g},${b},${a}); border-radius: ${est.radio}px; color: ${pal.texto};`;
    if (est.borde) {
        s += glass
            ? `border: 1px solid rgba(255,255,255,${pal.oscuro ? 0.18 : 0.38});`
            : `border: 1px solid ${pal.oscuro ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.09)'};`;
    }
    if (est.sombra)
        s += `box-shadow: 0 3px 12px rgba(0,0,0,${glass ? 0.14 : 0.18});`;
    return s;
}
