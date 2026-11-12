import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {parseInstallOptions} from '../tools/install-options.mjs';
import {installTarget} from '../tools/install-target.mjs';

test('selección explícita de componente valida argumentos', () => {
    assert.deepEqual(parseInstallOptions(['dist/release', '--apply', '--component=dynamic-island']),
        {folder: 'dist/release', action: 'apply', component: 'dynamic-island'});
    for (const args of [['x', '--component='], ['x', '--component=../outside'], ['x', '--component=a', '--component=b']])
        assert.throws(() => parseInstallOptions(args));
});

const root = new URL('..', import.meta.url).pathname;
test('un fallo de preparación conserva el destino y retira el temporal', () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'aurea-stage-test-'));
    const target = path.join(directory, 'installed');
    fs.mkdirSync(target);
    fs.writeFileSync(path.join(target, 'original'), 'keep');
    try {
        assert.throws(() => installTarget(path.join(directory, 'missing'), target, {testMode: true}));
        assert.equal(fs.readFileSync(path.join(target, 'original'), 'utf8'), 'keep');
        assert.deepEqual(fs.readdirSync(directory), ['installed']);
    } finally {
        fs.rmSync(directory, {recursive: true});
    }
});
test('instalar en destino aislado conserva preferencias y valida el resultado', () => {
    fs.mkdirSync(path.join(root, 'dist'), {recursive: true});
    const release = fs.mkdtempSync(path.join(root, 'dist/.install-test-'));
    const target = fs.mkdtempSync(path.join(os.tmpdir(), 'aurea-install-test-'));
    const entries = {
        'release.json': JSON.stringify({stack: 'Aurea 27', name: '0.0.1', tag: 'v0.0.1', extensions: {test: 'test@aurea.local'}}),
        'extensions/test@aurea.local/metadata.json': JSON.stringify({uuid: 'test@aurea.local', version: 1, 'version-name': '0.0.1'}),
        'extensions/test@aurea.local/extension.js': 'export default class {}',
        'theme/gtk-overrides/gtk.css': '* {}',
        'theme/gtk-overrides/settings.ini': '[Settings]\nkeep=no\n',
    };
    const call = (...actions) => execFileSync('node', ['tools/install.mjs', release, ...actions], {
        cwd: root, env: {...process.env, AUREA_TEST_ROOT: target}, stdio: 'pipe',
    });
    try {
        for (const group of ['gtk', 'icons', 'cursors']) fs.mkdirSync(path.join(release, 'theme', group), {recursive: true});
        const hashes = [];
        for (const [relative, content] of Object.entries(entries)) {
            fs.mkdirSync(path.dirname(path.join(release, relative)), {recursive: true});
            fs.writeFileSync(path.join(release, relative), content);
            hashes.push(`${crypto.createHash('sha256').update(content).digest('hex')}  ${relative}`);
        }
        fs.writeFileSync(path.join(release, 'SHA256SUMS'), hashes.join('\n') + '\n');
        assert.throws(() => call('--apply', '--check'));
        assert.throws(() => call('--unknown'));
        assert.equal(fs.existsSync(path.join(target, 'data')), false);
        const invalid = JSON.stringify({...JSON.parse(entries['release.json']), migrations: {'../outside': 'test@aurea.local'}});
        fs.writeFileSync(path.join(release, 'release.json'), invalid);
        fs.writeFileSync(path.join(release, 'SHA256SUMS'), hashes.map(line => line.endsWith('  release.json')
            ? `${crypto.createHash('sha256').update(invalid).digest('hex')}  release.json` : line).join('\n') + '\n');
        assert.throws(() => call('--apply'));
        assert.equal(fs.existsSync(path.join(target, 'data')), false);
        fs.writeFileSync(path.join(release, 'release.json'), entries['release.json']);
        fs.writeFileSync(path.join(release, 'SHA256SUMS'), hashes.join('\n') + '\n');
        assert.throws(() => call('--apply', '--component=missing'));
        call('--apply', '--component=test');
        call('--check', '--component=test');
        assert.equal(fs.existsSync(path.join(target, 'config')), false);
        const config = path.join(target, 'config/gtk-4.0');
        fs.mkdirSync(path.dirname(config), {recursive: true});
        fs.symlinkSync(path.join(target, 'missing-config'), config);
        assert.throws(() => call('--apply'));
        assert.equal(fs.readFileSync(path.join(target, 'data/gnome-shell/extensions/test@aurea.local/extension.js'), 'utf8'), entries['extensions/test@aurea.local/extension.js']);
        fs.unlinkSync(config);
        fs.mkdirSync(config, {recursive: true});
        fs.writeFileSync(path.join(config, 'settings.ini'), '[Settings]\nkeep=yes\n');
        fs.writeFileSync(path.join(config, 'old.css'), '* { color: red; }');
        fs.symlinkSync(path.join(config, 'old.css'), path.join(config, 'gtk.css'));
        call('--apply');
        assert.equal(fs.readFileSync(path.join(config, 'settings.ini'), 'utf8'), '[Settings]\nkeep=yes\n');
        call('--check');
        fs.writeFileSync(path.join(target, 'data/gnome-shell/extensions/test@aurea.local/extension.js'), 'wrong');
        assert.throws(() => call('--check'));
        call('--apply');
        call('--check');
        const settingsEnv = {...process.env, XDG_CONFIG_HOME: path.join(target, 'settings'), GSETTINGS_BACKEND: 'keyfile'};
        const setting = (key, value) => execFileSync('gsettings', ['set', 'org.gnome.shell', key, JSON.stringify(value)], {env: settingsEnv});
        setting('enabled-extensions', ['old@local', 'other@local']);
        setting('disabled-extensions', ['off@local']);
        execFileSync('gjs', ['tools/migrate-identities.js', JSON.stringify({'old@local': 'new@local', 'off@local': 'new-off@local'})], {cwd: root, env: settingsEnv});
        const values = execFileSync('gjs', ['-c', "const s = new imports.gi.Gio.Settings({schema_id:'org.gnome.shell'}); print(JSON.stringify([s.get_strv('enabled-extensions'),s.get_strv('disabled-extensions')]));"], {env: settingsEnv, encoding: 'utf8'});
        assert.deepEqual(JSON.parse(values), [['new@local', 'other@local'], ['new-off@local']]);
        fs.appendFileSync(path.join(release, 'extensions/test@aurea.local/extension.js'), 'tampered');
        assert.throws(() => call('--apply'));
    } finally {
        fs.rmSync(release, {recursive: true});
        fs.rmSync(target, {recursive: true});
    }
});
