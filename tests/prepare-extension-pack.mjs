import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {compileResources} from '../tools/extension-resources.mjs';
const root = path.resolve(import.meta.dirname, '..');
const target = process.env.DI_TEST_DIR;
if (!target?.startsWith('/tmp/aurea-pack-')) throw new Error('Destino aislado obligatorio');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'docs/upstream-extensions.json')));
for (const name of [...Object.keys(manifest), 'topbar']) {
    const source = path.join(root, 'extensions', name);
    const metadata = JSON.parse(fs.readFileSync(path.join(source, 'metadata.json')));
    const output = path.join(target, 'data/gnome-shell/extensions', metadata.uuid);
    fs.cpSync(source, output, {recursive: true, dereference: true});
    compileResources(output);
    if (fs.existsSync(path.join(output, 'schemas'))) execFileSync('glib-compile-schemas', ['--strict', path.join(output, 'schemas')]);
}
fs.writeFileSync(path.join(target, 'manifest.json'), JSON.stringify(manifest));
fs.cpSync(path.join(root, 'extensions/dynamic-island/tests/driver'), path.join(target, 'data/gnome-shell/extensions/island-test-driver@local'), {recursive: true});
for (const id of ['migration-before@local', 'migration-after@local']) {
    const destination = path.join(target, 'data/gnome-shell/extensions', id);
    fs.mkdirSync(destination, {recursive: true});
    fs.writeFileSync(path.join(destination, 'metadata.json'), JSON.stringify({uuid: id, name: 'Isolated migration fixture', description: 'Test only', 'shell-version': ['50']}));
    fs.writeFileSync(path.join(destination, 'extension.js'), "import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js'; export default class Fixture extends Extension { enable() {} disable() {} }");
}
