import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const stack = JSON.parse(fs.readFileSync(path.join(root, 'stack.json')));
const run = (program, args, options = {}) => execFileSync(program, args, {cwd: root, stdio: 'inherit', ...options});
run('bash', ['-n', 'aurea.sh']);
let syntax = 0, links = 0;
function inspect(dir) {
    for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
        const file = path.join(dir, entry.name);
        if (entry.isSymbolicLink()) {
            const target = fs.realpathSync(file);
            if (!target.startsWith(root + path.sep)) throw new Error(`Enlace externo: ${file}`);
            links++;
        } else if (entry.isDirectory()) inspect(file);
        else if (/\.(js|mjs)$/.test(file)) { run('node', ['--check', file]); syntax++; }
        else if (file.endsWith('.sh')) { run('bash', ['-n', file]); syntax++; }
        else if (file.endsWith('.py')) {
            run('python3', ['-c', 'import ast, pathlib, sys; ast.parse(pathlib.Path(sys.argv[1]).read_text(), filename=sys.argv[1])', file]);
            syntax++;
        }
    }
}
for (const dir of ['shared', 'extensions', 'theme', 'integrations', 'tools', 'tests']) inspect(path.join(root, dir));
for (const name of Object.keys(stack.extensions)) {
    const source = path.join(root, 'extensions', name, name === 'widgets' ? 'source' : '');
    const metadata = JSON.parse(fs.readFileSync(path.join(source, 'metadata.json')));
    if (metadata.version !== undefined || metadata['version-name'] !== undefined)
        throw new Error(`Versión fijada en código: ${name}`);
    if (!metadata.name.startsWith('Aurea 27')) throw new Error(`Marca incorrecta: ${name}`);
    if (fs.existsSync(path.join(source, 'schemas')))
        run('glib-compile-schemas', ['--strict', '--dry-run', path.join(source, 'schemas')]);
    if (fs.existsSync(path.join(source, 'stylesheet.css')))
        run('gjs', ['-c', 'const {St,Gio}=imports.gi; new St.Theme().load_stylesheet(Gio.File.new_for_path(ARGV[0]));', path.join(source, 'stylesheet.css')],
            {env: {...process.env, GI_TYPELIB_PATH: ['/usr/lib64/gnome-shell', ...fs.readdirSync('/usr/lib64').filter(n => /^mutter-\d+$/.test(n)).map(n => '/usr/lib64/' + n)].join(':'), LD_LIBRARY_PATH: '/usr/lib64/gnome-shell'}});
}
const tests = [
    'tests/version.test.mjs',
    'tests/runtime-tree.test.mjs',
    'tests/files.test.mjs',
    'tests/install.test.mjs',
    'tests/theme-tokens.test.mjs',
    'extensions/dynamic-island/tests/activities.mjs',
    'extensions/dynamic-island/tests/content-models.mjs',
    'extensions/dynamic-island/tests/music-model.mjs',
    'extensions/dynamic-island/tests/workspace-model.mjs',
    'extensions/dynamic-island/tests/studio-lifecycle.mjs',
    'extensions/dynamic-island/tests/native-banners.mjs',
    'extensions/dynamic-island/tests/validate-notifications.mjs',
    'extensions/app-island/test-model.mjs',
    'extensions/app-island/test-devices.mjs',
    'extensions/app-island/test-metrics.mjs',
    'extensions/app-island/test-panel.mjs',
    'extensions/app-island/test-autohide.mjs',
    'extensions/app-island/test-monitor-clip.mjs',
    'extensions/topbar/tests/settings-model.mjs',
    'extensions/topbar/tests/bluetooth-model.mjs',
    'extensions/topbar/tests/validate-control-center.mjs',
    'extensions/topbar/tests/validate-panel-style.mjs',
    'extensions/dock/tests/badge-follow-test.mjs',
    'extensions/dock/tests/indicator-follow-test.mjs',
    'extensions/dock/tests/magnification-test.js',
    'extensions/dock/tests/glass-style-test.mjs',
    'extensions/widgets/tools/test-battery-icon.mjs',
    'extensions/widgets/tools/test-edit-buttons.mjs',
    'extensions/widgets/tools/test-photos.mjs',
    'extensions/widgets/tools/test-stacking.mjs',
    'extensions/widgets/tools/test-weather-colors.mjs',
    'extensions/widgets/tools/test-widget-list.mjs',
    'integrations/desktop/test-renderer.mjs',
    'integrations/desktop/test-desktop-drop.mjs',
];
for (const file of tests) {
    const args = process.versions.bun && fs.readFileSync(file, 'utf8').includes("from 'node:test'") ? ['test', './' + file] : [file];
    run(process.execPath, args);
}
run('dbus-run-session', ['--', 'gjs', '-m', 'extensions/topbar/tests/keyboard-light-runtime.js'], {env: {...process.env, AUREA_KEYBOARD_TEST: '1'}});
run('python3', ['integrations/login-screen/test_manage.py']);
run('python3', ['integrations/boot-menu/test_manage.py']);
run(process.execPath, ['theme/tools/folders/install.mjs', '--check'], {env: {...process.env, ICON_TEST_ROOT: path.join(root, 'theme/icons')}});
console.log(`Aurea 27: ${syntax} archivos de código, ${links} enlaces, ${tests.length} pruebas y esquemas/CSS verificados.`);
