import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
const root = process.env.AUREA_PROJECT;
const data = process.env.XDG_DATA_HOME;
if (!root || !process.env.DI_TEST_DIR || !data.startsWith(process.env.DI_TEST_DIR + '/')) throw new Error('Solo sesión aislada');
fs.mkdirSync(process.env.XDG_CONFIG_HOME, {recursive: true});
const desktop = path.join(process.env.DI_TEST_DIR, 'Desktop');
fs.mkdirSync(desktop);
fs.writeFileSync(path.join(process.env.XDG_CONFIG_HOME, 'user-dirs.dirs'), `XDG_DESKTOP_DIR="${desktop}"\n`);
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'stack.json')));
const count = Number(execFileSync('git', ['-C', root, 'rev-list', '--count', 'HEAD'], {encoding: 'utf8'}));
const revision = execFileSync('git', ['-C', root, 'rev-parse', '--short', 'HEAD'], {encoding: 'utf8'}).trim();
for (const name of Object.keys(manifest.extensions)) {
    const input = path.join(root, 'extensions', name, name === 'widgets' ? 'source' : '');
    const metadata = JSON.parse(fs.readFileSync(path.join(input, 'metadata.json')));
    const target = path.join(data, 'gnome-shell/extensions', metadata.uuid);
    fs.cpSync(input, target, {recursive: true, verbatimSymlinks: true});
    fs.writeFileSync(path.join(target, 'metadata.json'), JSON.stringify({...metadata, version: count, 'version-name': `test-${revision}`}));
    if (fs.existsSync(path.join(target, 'schemas'))) execFileSync('glib-compile-schemas', ['--strict', path.join(target, 'schemas')]);
}
fs.cpSync(path.join(root, 'extensions/dynamic-island/tests/driver'), path.join(data, 'gnome-shell/extensions/island-test-driver@local'), {recursive: true});
const shellVersion = execFileSync('gnome-shell', ['--version'], {encoding: 'utf8'}).match(/\b(\d+)\./)?.[1];
if (!shellVersion) throw new Error('No se pudo detectar la versión de GNOME');
fs.writeFileSync(path.join(data, 'gnome-shell', `update-check-${shellVersion}`), '');
