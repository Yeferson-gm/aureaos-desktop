import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';

// Un solo recurso instalado; los nombres antiguos siguen resolviendo para no
// romper aplicaciones que solicitan, por ejemplo, folder-blue o folder-open.
const project = path.dirname(fileURLToPath(import.meta.url));
const iconRoot = process.env.ICON_TEST_ROOT ?? path.join(os.homedir(), '.local/share/icons');
const themes = ['WhiteSur', 'WhiteSur-light', 'WhiteSur-dark'];
const master = path.join(iconRoot, 'WhiteSur/places/scalable/folder.svg');
const symbolic = path.join(iconRoot, 'WhiteSur/places/symbolic/folder-symbolic.svg');
const folderName = /^(?:folder(?:-.*)?|user-home(?:-symbolic)?|user-desktop(?:-symbolic)?|desktop)\.svg$/;
const targets = new Set();
for (const theme of themes) {
    const themeRoot = path.join(iconRoot, theme);
    if (!fs.existsSync(path.join(themeRoot, 'index.theme')))
        throw Error(`No se encuentra el tema requerido: ${themeRoot}`);
    for (const size of ['16', '22', '24', 'scalable', 'symbolic']) {
        const dir = fs.realpathSync(path.join(themeRoot, 'places', size));
        if (!dir.startsWith(`${iconRoot}/`)) throw Error(`Destino fuera del tema: ${dir}`);
        for (const name of fs.readdirSync(dir)) {
            if (folderName.test(name)) targets.add(path.join(dir, name));
        }
    }
    targets.add(path.join(themeRoot, 'mimes/symbolic/inode-directory-symbolic.svg'));
}
if (!targets.has(master)) throw Error('Falta la carpeta principal; no se modificó nada');
if (process.argv.includes('--check')) {
    for (const target of targets) {
        const expectedMaster = target.endsWith('-symbolic.svg') ? symbolic : master;
        const expected = fs.readFileSync(path.join(project, path.basename(expectedMaster)), 'utf8');
        if (fs.realpathSync(target) !== expectedMaster || fs.readFileSync(target, 'utf8') !== expected)
            throw Error(`Aún hay una carpeta de otro estilo: ${target}`);
    }
    console.log(`PASS: ${targets.size} nombres/tamaños, una base cian y su silueta simbólica`);
} else if (process.argv.includes('--apply')) {
    // El llamador debe haber guardado una copia temporal antes de aplicar.
    if (fs.lstatSync(master).isSymbolicLink()) throw Error('El recurso principal debe ser un archivo normal');
    fs.copyFileSync(path.join(project, 'folder.svg'), master);
    fs.copyFileSync(path.join(project, 'folder-symbolic.svg'), symbolic);
    for (const target of targets) {
        const expectedMaster = target.endsWith('-symbolic.svg') ? symbolic : master;
        if (target === expectedMaster) continue;
        if (fs.lstatSync(target).isSymbolicLink() &&
            path.resolve(path.dirname(target), fs.readlinkSync(target)) === expectedMaster) continue;
        fs.unlinkSync(target);
        fs.symlinkSync(path.relative(path.dirname(target), expectedMaster), target);
    }
    for (const theme of themes)
        execFileSync('gtk-update-icon-cache', ['-f', '-t', path.join(iconRoot, theme)], {stdio: 'inherit'});
    console.log(`Actualizados ${targets.size} nombres; no se crearon temas alternativos.`);
} else {
    console.log(`Se unificarán ${targets.size} nombres en ${master}. Usa --apply o --check.`);
}
