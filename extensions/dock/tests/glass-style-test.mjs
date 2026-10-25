import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const paths = [
    new URL('../stylesheet.css', import.meta.url),
    new URL('file://' + process.env.HOME + '/.local/share/gnome-shell/extensions/macos27-dock@local/stylesheet.css'),
];

for (const path of paths) {
    const css = fs.readFileSync(path, 'utf8');
    test(`dock shelf is Tahoe glass in ${path.pathname}`, () => {
        const match = css.match(/#dashtodockContainer\.dashtodock #dash \.dash-background\s*\{([^}]*)\}/s);
        assert.ok(match, 'missing high-specificity custom-theme shelf rule');
        assert.doesNotMatch(match[1], /#303030|rgba\(0\s*,\s*0\s*,\s*0/);
        assert.match(match[1], /rgba\(255\s*,\s*255\s*,\s*255\s*,\s*0\.10\)/);
        assert.match(match[1], /border:\s*1px solid rgba\(255\s*,\s*255\s*,\s*255\s*,\s*0\.20\)/);
    });
}
