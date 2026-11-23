import assert from 'node:assert/strict';
import {mergeDevices} from './device-model.js';
const bluez = {'/device/mouse': {'org.bluez.Device1': {Connected: true, Alias: 'Mouse', Address: 'AB:CD:EF', Icon: 'input-mouse'},
    'org.bluez.Battery1': {Percentage: 0}}, '/device/off': {'org.bluez.Device1': {Connected: false, Alias: 'Old'}},
    '/device/headset': {'org.bluez.Device1': {Connected: true, Alias: 'Audífonos', Icon: 'audio-headset'}}};
const data = mergeDevices([{path: '/battery', IsPresent: true, Type: 2, Model: 'Equipo', Percentage: 77, State: 1},
    {path: '/mouse', IsPresent: true, Type: 5, Model: 'Mouse', Serial: 'AB_CD_EF', Percentage: 20},
    {path: '/absent', IsPresent: false, Type: 2, Percentage: 33}], bluez);
assert.equal(data.length, 3);
assert.equal(data.find(item => item.name === 'Mouse').percentage, 0);
assert.equal(data.find(item => item.name === 'Audífonos').percentage, null);
assert.equal(data.find(item => item.name === 'Equipo').charging, true);
assert.equal(data.at(-1).kind, 'computer');
assert.deepEqual(mergeDevices([{IsPresent: true, Type: 1, Percentage: 0}]), []);
assert.equal(mergeDevices([{IsPresent: true, Type: 2, Percentage: NaN}])[0].percentage, null);
assert.equal(mergeDevices([{IsPresent: true, Type: 2, Percentage: 70, BatteryLevel: 6}])[0].percentage, null);
console.log('PASS: baterías reales, ceros válidos, ausencias, niveles aproximados y deduplicación');
