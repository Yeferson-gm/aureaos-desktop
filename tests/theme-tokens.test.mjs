import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';

test('la hoja temporal se retira de ambos temas antes de borrarse', () => {
    const code = fs.readFileSync(new URL('../extensions/topbar/theme-tokens.js', import.meta.url), 'utf8')
        .replace(/^import .*;\n/gm, '').replace('export class ThemeTokens', 'globalThis.ThemeTokens = class ThemeTokens');
    const original = new Set(), replacement = new Set();
    const wrap = files => ({load_stylesheet: file => files.add(file), unload_stylesheet: file => files.delete(file)});
    let current = wrap(original), exists = true;
    const file = {get_path: () => '/tmp/test.css', query_exists: () => exists, delete() {
        assert.equal(original.size + replacement.size, 0);
        exists = false;
    }};
    const context = vm.createContext({Set, global: {stage: {}}, foregroundFor: () => '#fff',
        Gio: {File: {new_tmp: () => [file, {close() {}}]}}, GLib: {file_set_contents() {}},
        St: {Settings: {get: () => ({})}, ThemeContext: {get_for_stage: () => ({get_theme: () => current})}}});
    vm.runInContext(code, context);
    const tokens = new context.ThemeTokens();
    tokens.apply({accent: '#0055ff'});
    replacement.add(file);
    current = wrap(replacement);
    tokens.apply({accent: '#0066ff'});
    assert.equal(original.size, 0);
    assert.equal(replacement.size, 1);
    tokens.destroy();
    tokens.destroy();
    assert.equal(exists, false);
});
