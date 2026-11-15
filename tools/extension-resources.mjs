import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
export function compileResources(directory) {
    const metadata = JSON.parse(fs.readFileSync(path.join(directory, 'metadata.json')));
    for (const folder of ['po', 'locale']) {
        const source = path.join(directory, folder);
        if (!fs.existsSync(source)) continue;
        for (const file of fs.readdirSync(source).filter(name => name.endsWith('.po'))) {
            const output = path.join(directory, 'locale', file.slice(0, -3), 'LC_MESSAGES');
            fs.mkdirSync(output, {recursive: true});
            execFileSync('msgfmt', ['-o', path.join(output, `${metadata['gettext-domain']}.mo`), path.join(source, file)]);
        }
    }
    if (metadata.uuid === 'aurea-desktop-cube@local') {
        const resources = path.join(directory, 'resources');
        const files = [];
        function visit(dir) {
            for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
                const file = path.join(dir, entry.name);
                if (entry.isDirectory()) visit(file);
                else if (!entry.name.endsWith('.gresource') && !entry.name.endsWith('.gresource.xml')) files.push(path.relative(resources, file));
            }
        }
        visit(resources);
        const xml = path.join(resources, 'desktop-cube.gresource.xml');
        fs.writeFileSync(xml, `<gresources><gresource>${files.map(f => `<file>${f}</file>`).join('')}</gresource></gresources>`);
        execFileSync('glib-compile-resources', [xml, `--sourcedir=${resources}`, `--target=${path.join(resources, 'desktop-cube.gresource')}`]);
    }
}
