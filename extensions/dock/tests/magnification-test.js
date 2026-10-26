import {
    clamp,
    distributeOffsets,
    iconOverflow,
    magnificationLevel,
    magnifiedScale,
    pointInExpandedBox,
    settleToward,
} from '../custom-effects/magnification-math.js';
import {selectVisualActor} from '../custom-effects/actor-selection.js';

function assertEqual(actual, expected, message) {
    if (actual !== expected)
        throw new Error(`${message}: expected ${expected}, got ${actual}`);
}

function assertClose(actual, expected, message) {
    if (Math.abs(actual - expected) > 0.000001)
        throw new Error(`${message}: expected ${expected}, got ${actual}`);
}

assertEqual(clamp(-1, 0, 1), 0, 'clamp limits the lower bound');
assertEqual(clamp(2, 0, 1), 1, 'clamp limits the upper bound');
assertEqual(clamp(0.5, 0, 1), 0.5, 'clamp preserves a valid value');

assertClose(magnificationLevel(0, 100), 1, 'the pointer peak has full level');
assertClose(magnificationLevel(100, 100), 0, 'the radius edge has no level');
assertClose(magnificationLevel(200, 100), 0, 'outside the radius has no level');
assertClose(magnificationLevel(50, 100), 0.5, 'the raised cosine has a smooth midpoint');

assertClose(magnifiedScale(1.8, 1), 1.8, 'the closest icon reaches the configured maximum');
assertClose(magnifiedScale(1.8, 0), 1, 'an unaffected icon keeps its original size');
assertClose(magnifiedScale(0.5, 1), 1, 'a scale below one is never applied');

assertClose(iconOverflow(48, 1.55), 13.2,
    'visual overflow equals half of the added icon extent');
assertClose(iconOverflow(48, 0.8), 0,
    'a scale below one never creates visual overflow');

const dockBox = {x1: 100, y1: 900, x2: 500, y2: 960};
assertEqual(pointInExpandedBox(dockBox, 240, 885, true, 20), true,
    'pointer just above a horizontal dock remains inside its visual area');
assertEqual(pointInExpandedBox(dockBox, 240, 840, true, 20), false,
    'pointer leaving a horizontal dock clears magnification');
assertEqual(pointInExpandedBox(dockBox, 550, 930, false, 20), false,
    'pointer leaving a vertical dock clears magnification');

const iconImageOnly = {name: 'icon-bin'};
const completeVisual = {name: 'icon-container'};
assertEqual(selectVisualActor({
    _iconContainer: completeVisual,
    icon: {_iconBin: iconImageOnly},
}), iconImageOnly,
'magnification scales only the image; badge and indicator have independent positioning tests');
assertEqual(selectVisualActor({icon: {_iconBin: iconImageOnly}}), iconImageOnly,
    'magnification keeps a safe fallback for non-application dock items');

assertClose(settleToward(1, 2, 90, 90), 1.6321205588,
    'smoothing moves continuously toward the target');
assertClose(settleToward(1.5, 1.5, 16, 90), 1.5,
    'smoothing preserves a settled value');

const offsets = distributeOffsets([10, 30, 15], 1);
assertClose(offsets[0], -20, 'left neighbours move away from the active icon');
assertClose(offsets[1], 0, 'the active icon stays at the pointer anchor');
assertClose(offsets[2], 22.5, 'right neighbours move away from the active icon');

console.log('magnification-test: OK');
