import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import {KeyboardLight} from '../keyboard-light.js';
import {keyboardFixture} from './keyboard-light-fixture.js';

const wait = ms => new Promise(resolve => GLib.timeout_add(GLib.PRIORITY_DEFAULT, ms, () => { resolve(); return GLib.SOURCE_REMOVE; }));
const check = (value, message) => { if (!value) throw new Error(message); };
const until = async condition => { for (let i = 0; i < 100 && !condition(); i++) await wait(20); check(condition(), 'Tiempo de espera agotado'); };
const fixture = await keyboardFixture();
const model = new KeyboardLight();
try {
    await until(() => model.available);
    model.toggle(); await until(() => !model.pending && model.level === 1);
    model.setLevel(.4); await until(() => !model.pending && model.level === .5);
    model.toggle(); await until(() => !model.pending && model.level === 0);
    model.toggle(); await until(() => !model.pending && model.level === .5);
    fixture.change(100); await until(() => model.level === 1);
    model.setLevel(.5); model.setLevel(1); model.setLevel(0);
    await until(() => !model.pending && model.level === 0);
    check(fixture.writes.at(-1) === 0, 'Se perdió el último movimiento');
    const writes = fixture.writes.length;
    model.setLevel(NaN); await wait(40);
    check(fixture.writes.length === writes, 'Se envió un nivel inválido');
    fixture.change(-1); await until(() => !model.available);
    model.toggle(); check(fixture.writes.length === writes, 'Escritura sin hardware');
    fixture.change(50); await until(() => model.available);
    fixture.exported.unexport(); model.setLevel(1);
    await until(() => !!model.error && !model.pending);
    check(model.level === .5, 'Un error inventó un nivel aplicado');
    fixture.exported.export(Gio.DBus.session, '/org/gnome/SettingsDaemon/Power');
    model.destroy();
    const cancelled = new KeyboardLight(); cancelled.destroy(); await wait(100);
    print('PASS: luz de teclado, niveles reales, restauración, cambios externos, cola, ausencia, error y cancelación');
} finally { model.destroy(); fixture.destroy(); }
