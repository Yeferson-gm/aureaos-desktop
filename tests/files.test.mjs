import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {verifyTree} from '../tools/files.mjs';

test('la verificación detecta archivos y enlaces alterados antes de instalar', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'aurea-files-'));
    const source = path.join(dir, 'source'), target = path.join(dir, 'target');
    try {
        fs.mkdirSync(source);
        fs.writeFileSync(path.join(source, 'icon.svg'), '<svg/>');
        fs.symlinkSync('icon.svg', path.join(source, 'alias.svg'));
        fs.cpSync(source, target, {recursive: true, verbatimSymlinks: true});
        assert.equal(verifyTree(source, target), 2);
        fs.writeFileSync(path.join(target, 'icon.svg'), 'different');
        assert.throws(() => verifyTree(source, target), /Archivo diferente/);
        fs.copyFileSync(path.join(source, 'icon.svg'), path.join(target, 'icon.svg'));
        fs.unlinkSync(path.join(target, 'alias.svg'));
        fs.symlinkSync('other.svg', path.join(target, 'alias.svg'));
        assert.throws(() => verifyTree(source, target), /Enlace diferente/);
    } finally {
        fs.rmSync(dir, {recursive: true});
    }
});
