import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const paths = [
    new URL('../stylesheet.css', import.meta.url),
];

for (const path of paths) {
    const css = fs.readFileSync(path, 'utf8');
    test(`top panel resets inherited chrome in ${path.pathname}`, () => {
        const match = css.match(/#panel\.lintel-panel[\s\S]*?\{([^}]*)\}/);
        assert.ok(match, 'missing Lintel panel rule');
        assert.match(match[1], /border:\s*(?:none|0)/);
        assert.match(match[1], /border-radius:\s*0/);
        assert.match(match[1], /box-shadow:\s*none/);
    });
}
