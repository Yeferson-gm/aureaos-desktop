import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {verifyTree} from './files.mjs';
import {parseTag} from './version.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const folder = process.argv.find((arg, i) => i > 1 && !arg.startsWith('--'));
if (!folder) throw new Error('Uso: node tools/install.mjs dist/aurea-27-VERSION [--apply | --check]');
const releaseDir = fs.realpathSync(folder);
if (!releaseDir.startsWith(path.join(root, 'dist') + path.sep)) throw new Error('Usa un paquete generado en dist/');
const release = JSON.parse(fs.readFileSync(path.join(releaseDir, 'release.json')));
const version = parseTag(release.tag);
if (version.name !== release.name || release.stack !== 'Aurea 27') throw new Error('Paquete desconocido');
for (const line of fs.readFileSync(path.join(releaseDir, 'SHA256SUMS'), 'utf8').trim().split('\n')) {
    const [hash, relative] = line.split('  ');
    const file = path.resolve(releaseDir, relative);
    if (!file.startsWith(releaseDir + path.sep) || !/^[a-f0-9]{64}$/.test(hash)) throw new Error('Manifest inválido');
    if (crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex') !== hash)
        throw new Error(`Paquete modificado: ${relative}`);
}
const testRoot = process.env.AUREA_TEST_ROOT;
const data = testRoot ? path.join(testRoot, 'data') : process.env.XDG_DATA_HOME ?? path.join(os.homedir(), '.local/share');
const config = testRoot ? path.join(testRoot, 'config') : process.env.XDG_CONFIG_HOME ?? path.join(os.homedir(), '.config');
const themes = testRoot ? path.join(testRoot, 'themes') : path.join(os.homedir(), '.themes');
const targets = [];
for (const uuid of Object.values(release.extensions)) {
    if (!/^[\w.@-]+$/.test(uuid)) throw new Error('UUID inválido');
    const source = path.join(releaseDir, 'extensions', uuid);
    const metadata = JSON.parse(fs.readFileSync(path.join(source, 'metadata.json')));
    if (metadata.uuid !== uuid || metadata.version !== version.integer || metadata['version-name'] !== version.name)
        throw new Error(`Metadatos inconsistentes: ${uuid}`);
    targets.push([source, path.join(data, 'gnome-shell/extensions', uuid)]);
}
for (const [group, destination] of [['gtk', themes], ['icons', path.join(data, 'icons')], ['cursors', path.join(data, 'icons')]]) {
    for (const entry of fs.readdirSync(path.join(releaseDir, 'theme', group), {withFileTypes: true})) {
        if (entry.isDirectory()) targets.push([path.join(releaseDir, 'theme', group, entry.name), path.join(destination, entry.name)]);
    }
}
targets.push([path.join(releaseDir, 'theme/gtk-overrides'), path.join(config, 'gtk-4.0')]);
if (!process.argv.includes('--apply') && !process.argv.includes('--check')) {
    console.log(targets.map(([, target]) => target).join('\n'));
    console.log('Vista previa: usa --apply para instalar; --check para verificar.');
    process.exit(0);
}
let files = 0;
for (const [source, target] of targets) {
    const isGtk = target === path.join(config, 'gtk-4.0');
    const ignored = isGtk ? new Set(['settings.ini']) : new Set();
    if (process.argv.includes('--apply')) {
        fs.mkdirSync(path.dirname(target), {recursive: true});
        if (fs.existsSync(target) && fs.lstatSync(target).isSymbolicLink()) throw new Error(`Destino enlazado: ${target}`);
        const stage = fs.mkdtempSync(path.join(path.dirname(target), '.aurea-install-'));
        const next = path.join(stage, 'next'), previous = path.join(stage, 'previous');
        if (isGtk && fs.existsSync(target)) fs.cpSync(target, next, {recursive: true, verbatimSymlinks: true});
        fs.cpSync(source, next, {recursive: true, verbatimSymlinks: true,
            filter: file => !(isGtk && path.basename(file) === 'settings.ini' && fs.existsSync(path.join(next, 'settings.ini')))});
        verifyTree(source, next, ignored);
        const exists = fs.existsSync(target);
        if (exists) fs.renameSync(target, previous);
        try { fs.renameSync(next, target); }
        catch (error) { if (exists) fs.renameSync(previous, target); throw error; }
        if (exists && testRoot) fs.rmSync(previous, {recursive: true});
        else if (exists) execFileSync('gio', ['trash', previous]);
        fs.rmdirSync(stage);
    }
    files += verifyTree(source, target, ignored);
}
if (process.argv.includes('--apply') && !testRoot) {
    const migrations = release.migrations ?? {};
    for (const [oldId, newId] of Object.entries(migrations)) {
        if (!/^[\w.@-]+$/.test(oldId) || !Object.values(release.extensions).includes(newId))
            throw new Error('Migración de UUID inválida');
    }
    execFileSync('gjs', [path.join(root, 'tools/migrate-identities.js'), JSON.stringify(migrations)]);
    for (const oldId of Object.keys(migrations)) {
        for (const group of ['extensions', 'extension-updates']) {
            const old = path.join(data, 'gnome-shell', group, oldId);
            if (fs.existsSync(old)) execFileSync('gio', ['trash', old]);
        }
    }
    for (const name of ['Aurea27', 'Aurea27-light', 'Aurea27-dark'])
        execFileSync('gtk-update-icon-cache', ['-f', '-t', path.join(data, 'icons', name)]);
    const settings = [['org.gnome.desktop.interface', 'gtk-theme'], ['org.gnome.desktop.interface', 'icon-theme'],
        ['org.gnome.desktop.interface', 'cursor-theme'], ['org.gnome.desktop.wm.preferences', 'theme']];
    for (const [schema, key] of settings) {
        const current = execFileSync('gsettings', ['get', schema, key], {encoding: 'utf8'}).trim();
        if (current.includes('WhiteSur')) execFileSync('gsettings', ['set', schema, key, current.replaceAll('WhiteSur', 'Aurea27')]);
    }
    const schemaDir = '/usr/share/gnome-shell/extensions/user-theme@gnome-shell-extensions.gcampax.github.com/schemas';
    if (fs.existsSync(schemaDir)) {
        const args = ['--schemadir', schemaDir];
        const current = execFileSync('gsettings', [...args, 'get', 'org.gnome.shell.extensions.user-theme', 'name'], {encoding: 'utf8'}).trim();
        if (current.includes('WhiteSur')) execFileSync('gsettings', [...args, 'set', 'org.gnome.shell.extensions.user-theme', 'name', current.replaceAll('WhiteSur', 'Aurea27')]);
    }
}
console.log(`${files} archivos/enlaces verificados. Versión ${version.name}.`);
if (process.argv.includes('--apply')) console.log('Copias anteriores sustituidas enviadas a la papelera. Cierra sesión para recargar las extensiones.');
