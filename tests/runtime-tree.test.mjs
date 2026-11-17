import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {verifyRuntimeTree} from '../tools/runtime-tree.mjs';
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'aurea-runtime-'));
try {
    const source = path.join(root, 'source'), target = path.join(root, 'package');
    fs.mkdirSync(source); fs.writeFileSync(path.join(root, 'shared.js'), 'export const value = 1;');
    fs.symlinkSync('../shared.js', path.join(source, 'shared.js'));
    fs.cpSync(source, target, {recursive: true, verbatimSymlinks: true});
    assert.throws(() => verifyRuntimeTree(target), /no enlaces/);
    fs.rmSync(target, {recursive: true});
    fs.cpSync(source, target, {recursive: true, dereference: true});
    fs.rmSync(path.join(root, 'shared.js'));
    verifyRuntimeTree(target);
    assert.equal(fs.readFileSync(path.join(target, 'shared.js'), 'utf8'), 'export const value = 1;');
    console.log('PASS: paquete independiente del árbol de desarrollo; enlaces rechazados');
} finally { fs.rmSync(root, {recursive: true, force: true}); }
