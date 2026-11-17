import assert from 'node:assert/strict';
import {controlRows, panelSize} from '../control-layout.js';
import {normalizeConfig} from '../settings-model.js';
const config = normalizeConfig({modules: ['wifi','bluetooth','sound','power','battery','focus']});
assert.ok(normalizeConfig().modules.includes('keyboardLight'));
assert.equal(normalizeConfig().sizes.keyboardLight, 'wide');
assert.deepEqual(normalizeConfig({modules: ['keyboardLight']}).modules, ['keyboardLight']);
assert.deepEqual(controlRows(['keyboardLight'], {keyboardLight: 'wide'}, () => false), []);
assert.deepEqual(controlRows(config.modules, config.sizes), [['wifi','bluetooth'],['sound'],['power','battery'],['focus']]);
assert.deepEqual(controlRows(config.modules, config.sizes, id => !['bluetooth','battery'].includes(id)), [['wifi'],['sound'],['power','focus']]);
assert.deepEqual(controlRows([], {}), []);
for (const scale of [1, 1.25, 1.5, 2]) {
    const size = panelSize(1280, 800, scale);
    assert.ok(size.width + 32 <= 1280 / scale);
    assert.ok(size.height + 100 <= 800 / scale);
}
assert.deepEqual(controlRows(['wifi','sound','bluetooth'], {wifi:'wide', sound:'wide', bluetooth:'wide'}), [['wifi'],['sound'],['bluetooth']]);
console.log('PASS: disposición configurable, reflujo sin hardware y límites por escala');
