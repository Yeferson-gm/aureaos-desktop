import fs from 'node:fs';
import vm from 'node:vm';
export function controller(extra = {}) {
    const source = fs.readFileSync(new URL('./extension.js', import.meta.url), 'utf8').replace(/^import .*;\n/gm, '').replace('export default class', 'class');
    const context = vm.createContext({Extension: class {}, createRoundedMask: () => class {},
        St: {ButtonMask: {}, ThemeContext: {get_for_stage: () => ({scale_factor: 1})}},
        global: {stage: {}}, Clutter: {AnimationMode: {EASE_OUT_CUBIC: 1}}, ...extra});
    vm.runInContext(`${source}\nglobalThis.Controller = AppIsland;`, context);
    return Object.create(context.Controller.prototype);
}
