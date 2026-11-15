import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {verifyTree} from './files.mjs';
import {parseTag} from './version.mjs';
import {parseInstallOptions, validateMigrations} from './install-options.mjs';
import {installTarget} from './install-target.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const {folder, action, component} = parseInstallOptions(process.argv.slice(2));
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
const migrations = release.migrations ?? {};
validateMigrations(migrations, release.extensions);
if (action === 'apply' && !testRoot && process.getuid?.() === 0)
    throw new Error('Instala como usuario de la sesión GNOME, sin sudo.');
const data = testRoot ? path.join(testRoot, 'data') : process.env.XDG_DATA_HOME ?? path.join(os.homedir(), '.local/share');
const config = testRoot ? path.join(testRoot, 'config') : process.env.XDG_CONFIG_HOME ?? path.join(os.homedir(), '.config');
const themes = testRoot ? path.join(testRoot, 'themes') : path.join(os.homedir(), '.themes');
const targets = [];
const systemTargets = new Set();
const systemData = testRoot ? path.join(testRoot, 'system') : '/usr/share';
if (component && !Object.hasOwn(release.extensions, component)) throw new Error(`Componente desconocido: ${component}`);
const selectedExtensions = component ? {[component]: release.extensions[component]} : release.extensions;
for (const uuid of Object.values(selectedExtensions)) {
    if (!/^[\w.-]+@[\w.-]+$/.test(uuid)) throw new Error('UUID inválido');
    const source = path.join(releaseDir, 'extensions', uuid);
    const metadata = JSON.parse(fs.readFileSync(path.join(source, 'metadata.json')));
    if (metadata.uuid !== uuid || metadata.version !== version.integer || metadata['version-name'] !== version.name)
        throw new Error(`Metadatos inconsistentes: ${uuid}`);
    const userTarget = path.join(data, 'gnome-shell/extensions', uuid);
    const systemTarget = path.join(systemData, 'gnome-shell/extensions', uuid);
    if (uuid === 'aurea-lock-screen@local' && fs.existsSync(path.join(systemTarget, 'metadata.json'))) {
        targets.push([source, systemTarget]);
        systemTargets.add(systemTarget);
        if (action !== 'preview' && fs.existsSync(userTarget))
            throw new Error('Acceso y bloqueo tiene una copia de usuario. Completa la unificación indicada en README antes de instalar.');
    } else {
        targets.push([source, userTarget]);
    }
}
if (!component) for (const [group, destination] of [['gtk', themes], ['icons', path.join(data, 'icons')], ['cursors', path.join(data, 'icons')]]) {
    for (const entry of fs.readdirSync(path.join(releaseDir, 'theme', group), {withFileTypes: true})) {
        if (entry.isDirectory()) targets.push([path.join(releaseDir, 'theme', group, entry.name), path.join(destination, entry.name)]);
    }
}
if (!component) targets.push([path.join(releaseDir, 'theme/gtk-overrides'), path.join(config, 'gtk-4.0')]);
if (action === 'preview') {
    console.log(targets.map(([, target]) => target).join('\n'));
    console.log('Vista previa: usa --apply para instalar; --check para verificar.');
    process.exit(0);
}
if (action === 'apply') {
    for (const [source, target] of targets) {
        if (!systemTargets.has(target)) continue;
        try { verifyTree(source, target); }
        catch (error) { throw new Error('Actualiza primero Acceso y bloqueo con el instalador administrativo de GDM del mismo paquete.', {cause: error}); }
    }
    for (const [, target] of targets) {
        const stat = fs.lstatSync(target, {throwIfNoEntry: false});
        if (stat && !stat.isDirectory()) throw new Error(`Destino no es un directorio normal: ${target}`);
    }
    if (!testRoot) {
        for (const command of ['gio', 'gjs', 'gsettings', 'gtk-update-icon-cache']) {
            const available = (process.env.PATH ?? '').split(path.delimiter).some(dir => {
                try { fs.accessSync(path.join(dir, command), fs.constants.X_OK); return true; }
                catch { return false; }
            });
            if (!available) throw new Error(`Falta la herramienta: ${command}`);
        }
        execFileSync('gjs', ['-c', "const Gio = imports.gi.Gio; Gio.DBus.session.get_unique_name(); new Gio.Settings({schema_id: 'org.gnome.shell'}).get_strv('enabled-extensions');"], {stdio: 'pipe'});
    }
}
let files = 0;
for (const [source, target] of targets) {
    const isGtk = target === path.join(config, 'gtk-4.0');
    const ignored = isGtk ? new Set(['settings.ini']) : new Set();
    if (action === 'apply' && !systemTargets.has(target))
        installTarget(source, target, {preserveSettings: isGtk, testMode: Boolean(testRoot)});
    files += verifyTree(source, target, ignored);
}
if (action === 'apply' && !testRoot && !component) {
    execFileSync('gjs', [path.join(root, 'tools/migrate-identities.js'), JSON.stringify(migrations), '--live']);
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
    const dataDirs = [data, ...(process.env.XDG_DATA_DIRS ?? '/usr/local/share:/usr/share').split(path.delimiter)];
    const schemaDir = ['aurea-shell-theme@local', 'user-theme@gnome-shell-extensions.gcampax.github.com'].flatMap(uuid => dataDirs.map(dir => path.join(dir, 'gnome-shell/extensions', uuid, 'schemas')))
        .find(dir => fs.existsSync(path.join(dir, 'gschemas.compiled')));
    if (schemaDir) {
        const args = ['--schemadir', schemaDir];
        const current = execFileSync('gsettings', [...args, 'get', 'org.gnome.shell.extensions.user-theme', 'name'], {encoding: 'utf8'}).trim();
        if (current.includes('WhiteSur')) execFileSync('gsettings', [...args, 'set', 'org.gnome.shell.extensions.user-theme', 'name', current.replaceAll('WhiteSur', 'Aurea27')]);
    }
}
console.log(`${files} archivos/enlaces verificados. Versión ${version.name}.`);
if (action === 'apply' && testRoot) console.log('Instalación de prueba: no se modificó la sesión GNOME.');
else if (action === 'apply') console.log('Copias anteriores sustituidas enviadas a la papelera. Cierra sesión para recargar las extensiones.');
