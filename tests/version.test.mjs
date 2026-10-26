import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {parseTag, gitVersion} from '../tools/version.mjs';

test('una etiqueta determina la versión semántica y el entero de GNOME', () => {
    assert.deepEqual(parseTag('v0.0.1'), {name: '0.0.1', integer: 1});
    assert.deepEqual(parseTag('v2.3.4'), {name: '2.3.4', integer: 2003004});
    for (const value of ['latest', '0.0.1', 'v1.1000.0', 'v01.2.3', 'v0.0.0'])
        assert.throws(() => parseTag(value));
});

test('una distribución requiere HEAD etiquetado y árbol limpio', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'aurea-version-'));
    const git = (...args) => execFileSync('git', ['-C', root, ...args], {stdio: 'pipe'});
    try {
        git('init', '-q');
        git('config', 'user.name', 'Prueba');
        git('config', 'user.email', 'test@example.invalid');
        fs.writeFileSync(path.join(root, 'README.md'), '# Prueba\n');
        git('add', '.');
        git('commit', '-qm', 'initial');
        assert.throws(() => gitVersion(root));
        git('tag', 'v0.0.1');
        assert.equal(gitVersion(root).name, '0.0.1');
        fs.appendFileSync(path.join(root, 'README.md'), 'Cambio\n');
        assert.throws(() => gitVersion(root), /limpio/);
        git('add', '.');
        git('commit', '-qm', 'next');
        assert.throws(() => gitVersion(root));
    } finally {
        fs.rmSync(root, {recursive: true});
    }
});
