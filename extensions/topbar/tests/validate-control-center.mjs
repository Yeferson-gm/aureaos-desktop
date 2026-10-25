import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const css = readFileSync(new URL('../stylesheet.css', import.meta.url), 'utf8');
const source = readFileSync(new URL('../extension.js', import.meta.url), 'utf8');
const installer = readFileSync(new URL('../instalar-macos27-top-bar.sh', import.meta.url), 'utf8');
const runtime = readFileSync(
    `${process.env.HOME}/.local/share/gnome-shell/extensions/lintel-v2@local/extension.js`, 'utf8');
const runtimeCss = readFileSync(
    `${process.env.HOME}/.local/share/gnome-shell/extensions/lintel-v2@local/stylesheet.css`, 'utf8');

function embedded(file, marker) {
    const pattern = new RegExp(
        `write_file ${file} <<'(${marker})'\\n([\\s\\S]*?)\\n\\1`);
    return installer.match(pattern)?.[2] ?? null;
}

assert.equal(runtime, source, 'La versión instalada debe coincidir con el proyecto del Escritorio');
assert.equal(runtimeCss, css, 'El CSS instalado debe coincidir con el proyecto del Escritorio');
assert.equal(`${embedded('extension\\.js', '__LINTEL_EXTENSION_JS__')}\n`, source,
    'El instalador debe contener el extension.js verificado');
assert.equal(`${embedded('stylesheet\\.css', '__LINTEL_STYLESHEET__')}\n`, css,
    'El instalador debe contener el stylesheet.css verificado');

const braces = [...css].reduce((depth, character) => {
    if (character === '{')
        return depth + 1;
    if (character === '}') {
        assert.ok(depth > 0, 'El CSS no debe contener cierres de bloque sin apertura');
        return depth - 1;
    }
    return depth;
}, 0);
assert.equal(braces, 0, 'Todos los bloques CSS deben quedar correctamente cerrados');

function block(selector) {
    const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = css.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`));
    assert.ok(match, `No se encontró el selector ${selector}`);
    return match[1];
}

function px(selector, property) {
    const match = block(selector).match(new RegExp(`${property}\\s*:\\s*(\\d+)px`));
    assert.ok(match, `No se encontró ${property} en ${selector}`);
    return Number(match[1]);
}

function optionalPx(selector, property, fallbackSelector = null) {
    const match = block(selector).match(new RegExp(`${property}\\s*:\\s*(\\d+)px`));
    return match ? Number(match[1]) : fallbackSelector ? px(fallbackSelector, property) : 0;
}

function horizontalPadding(selector, fallbackSelector = null) {
    const match = block(selector).match(/padding\s*:\s*(\d+)px(?:\s+(\d+)px)?/);
    if (match)
        return Number(match[2] ?? match[1]);
    return fallbackSelector ? horizontalPadding(fallbackSelector) : 0;
}

function horizontalOuter(selector, fallbackSelector = null) {
    return px(selector, 'width') +
        2 * horizontalPadding(selector, fallbackSelector) +
        2 * optionalPx(selector, 'border', fallbackSelector);
}

const contentWidth = px('.lintel-cc-content', 'width');
const contentOuter = contentWidth + 2 * px('.lintel-cc-content', 'padding');
assert.equal(contentOuter, 300, 'El modal completo debe medir exactamente 300 px');

const gap = px('.lintel-cc-primary,\n.lintel-cc-utility-row', 'spacing');
const groupOuter = horizontalOuter('.lintel-cc-group');
const featuresWidth = px('.lintel-cc-features', 'width');
assert.equal(groupOuter + gap + featuresWidth, contentWidth,
    'La fila principal debe caber exactamente dentro del modal');

assert.equal(horizontalOuter('.lintel-cc-tile.lintel-cc-vtile', '.lintel-cc-tile'), featuresWidth,
    'Los mosaicos verticales no deben desbordar su columna');
assert.equal(2 * horizontalOuter('.lintel-cc-tile.lintel-cc-wtile', '.lintel-cc-tile') + gap, contentWidth,
    'Los dos mosaicos anchos deben caber exactamente en una fila');
assert.equal(horizontalOuter('.lintel-cc-slider'), contentWidth,
    'Los deslizadores deben respetar el ancho interior del modal');

assert.match(source, /org\.gnome\.shell\.extensions\.caffeine/,
    'Debe integrarse con la configuración real de Caffeine');
assert.match(source, /cli-toggle/,
    'Caffeine debe poder activarse y desactivarse desde el Centro de control');
assert.match(source, /'Caffeine'/, 'Debe mostrarse la acción Caffeine');
assert.match(source, /'Privacidad'/, 'Debe mostrarse la acción Privacidad');
assert.match(source, /'Micrófono'/, 'Debe mostrarse un control de micrófono bajo Sonido');
assert.match(source, /get_default_source\(\)/,
    'El micrófono debe seguir la fuente de entrada predeterminada de PipeWire');
assert.match(source, /Main\.brightnessManager/,
    'El brillo debe usar el gestor real de GNOME 50');
assert.doesNotMatch(source, /org\.gnome\.SettingsDaemon\.Power\.Screen/,
    'No debe depender de la interfaz de brillo eliminada en GNOME 50');
assert.match(source, /net\.hadess\.PowerProfiles/,
    'Los modos de energía deben usar el servicio real de tuned-ppd');
assert.match(source, /ActiveProfile/,
    'El control de energía debe leer y cambiar el perfil activo');
assert.match(source, /ctx\.powerProfiles\.cycle\(\)/,
    'El mosaico Energía debe cambiar perfiles, no abrir solo Ajustes');
assert.match(source, /org\.gnome\.shell\.extensions\.Battery-Health-Charging/,
    'Debe integrarse con Battery Health Charging instalada');
assert.match(source, /ChargeLimitToggle/,
    'Debe reutilizar el control de la extensión de cuidado de batería');
assert.match(source, /ctx\.batteryCare\.toggle\(\)/,
    'Cuidado de batería debe activarse y desactivarse desde el Centro de control');
assert.match(source, /'Cuidado batería'/,
    'Debe mostrarse la acción de cuidado de batería');
assert.match(source, /getRfkillManager/,
    'Debe reutilizar el control real de modo avión de GNOME');
assert.match(source, /'Modo avión'/,
    'Debe incluir el modo avión cuando el hardware lo permita');
assert.match(source, /'Brillo'/,
    'El deslizador de pantalla debe identificarse claramente como Brillo');

const visibleShadows = [...css.matchAll(/(?:box|text|icon)-shadow\s*:\s*([^;]+);/g)]
    .map(match => match[1].trim())
    .filter(value => value !== 'none');
assert.deepEqual(visibleShadows, [],
    'La barra superior y todos sus desplegables deben quedar sin sombras');

console.log('Centro de control: geometría y acciones verificadas.');
