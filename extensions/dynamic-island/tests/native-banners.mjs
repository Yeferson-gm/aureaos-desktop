import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../extension.js', import.meta.url), 'utf8');
function check(code) {
    const tray = {
        _notification: {}, _banner: {}, _notificationQueue: [{}, {}],
        get queueCount() { return this._notificationQueue.length; },
        emit() {}, _showNotification() { throw new Error('Se mostró un banner nativo'); },
        _updateNotificationTimeout(value) { assert.equal(value, 0); },
        _hideNotification(animate) {
            assert.equal(animate, false);
            this._notification = null;
            this._banner = null;
        },
    };
    const original = tray._showNotification;
    class InjectionManager {
        overrideMethod(object, name, factory) {
            this.clear = () => { object[name] = original; };
            object[name] = factory(original);
        }
    }
    const context = vm.createContext({
        Extension: class {}, InjectionManager, Main: {messageTray: tray}, TextDecoder, TextEncoder,
    });
    vm.runInContext(code.replace(/^import .*;\n/gm, '')
        .replace('export default class', 'class') + '\nglobalThis.Island = DynamicIsland;', context);
    const island = new context.Island();
    island._connect = () => {};
    island._bindNotificationSources = () => {};
    island._setupNotifications();
    assert.equal(tray._banner, null, 'Un banner anterior debe cerrarse al activar');
    assert.equal(tray.queueCount, 0, 'No dejar banners atrasados');
    tray._notificationQueue.push({});
    tray._showNotification();
    assert.equal(tray.queueCount, 0, 'No acumular presentaciones pendientes');
    island._bannerOverrides.clear();
    assert.equal(tray._showNotification, original, 'Restaurar el método original');
}
check(source);

const mutant = source.replace('if (tray._notification && tray._banner)',
    'if (!tray._notification && tray._banner)');
assert.notEqual(mutant, source);
assert.throws(() => check(mutant), /Un banner anterior debe cerrarse/);
console.log('Banners: supresión, cola, restauración y mutación verificadas.');
