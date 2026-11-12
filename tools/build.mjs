import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {gitVersion} from './version.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const version = gitVersion(root);
const stack = JSON.parse(fs.readFileSync(path.join(root, 'stack.json')));
const parent = path.join(root, 'dist');
const target = path.join(parent, `aurea-27-${version.name}`);
if (fs.existsSync(target)) throw new Error(`El paquete ya existe: ${target}. No se sobrescribe.`);
fs.mkdirSync(parent, {recursive: true});
const staging = fs.mkdtempSync(path.join(parent, '.build-'));
const excluded = new Set(['tests', 'tools', '.git', '__pycache__', 'node_modules', 'gschemas.compiled', 'icon-theme.cache']);
const sources = {};
for (const name of Object.keys(stack.extensions)) {
    const source = path.join(root, 'extensions', name, name === 'widgets' ? 'source' : '');
    const metadata = JSON.parse(fs.readFileSync(path.join(source, 'metadata.json')));
    const output = path.join(staging, 'extensions', metadata.uuid);
    fs.cpSync(source, output, {recursive: true, verbatimSymlinks: true, filter: file =>
        !excluded.has(path.basename(file)) && !/^test[-.]/.test(path.basename(file))});
    metadata.version = version.integer;
    metadata['version-name'] = version.name;
    fs.writeFileSync(path.join(output, 'metadata.json'), JSON.stringify(metadata, null, 2) + '\n');
    if (fs.existsSync(path.join(output, 'schemas')))
        execFileSync('glib-compile-schemas', ['--strict', path.join(output, 'schemas')]);
    sources[name] = metadata.uuid;
}
for (const group of ['gtk', 'icons', 'cursors', 'gtk-overrides'])
    fs.cpSync(path.join(root, 'theme', group), path.join(staging, 'theme', group), {recursive: true, verbatimSymlinks: true});
for (const group of ['gtk', 'icons', 'cursors']) {
    const license = group === 'cursors' ? 'LICENSE' : 'COPYING';
    for (const entry of fs.readdirSync(path.join(staging, 'theme', group), {withFileTypes: true})) {
        if (entry.isDirectory()) fs.copyFileSync(path.join(staging, 'theme', group, license), path.join(staging, 'theme', group, entry.name, license));
    }
}
fs.cpSync(path.join(root, 'docs'), path.join(staging, 'docs'), {recursive: true});
fs.cpSync(path.join(root, 'presets'), path.join(staging, 'presets'), {recursive: true});
fs.copyFileSync(path.join(root, 'README.md'), path.join(staging, 'README.md'));
fs.writeFileSync(path.join(staging, 'release.json'), JSON.stringify({stack: stack.name, ...version, extensions: sources, migrations: stack.migrations}, null, 2) + '\n');
const hashes = [];
function hashFiles(dir) {
    for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
        const file = path.join(dir, entry.name);
        if (entry.isDirectory()) hashFiles(file);
        else if (entry.isFile()) hashes.push(`${crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')}  ${path.relative(staging, file)}`);
    }
}
hashFiles(staging);
fs.writeFileSync(path.join(staging, 'SHA256SUMS'), hashes.sort().join('\n') + '\n');
fs.renameSync(staging, target);
console.log(target);
