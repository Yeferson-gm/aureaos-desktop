import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {verifyTree} from './files.mjs';

export function installTarget(source, target, {preserveSettings = false, testMode = false} = {}) {
    fs.mkdirSync(path.dirname(target), {recursive: true});
    const stage = fs.mkdtempSync(path.join(path.dirname(target), '.aurea-install-'));
    const next = path.join(stage, 'next');
    const previous = path.join(stage, 'previous');
    const ignored = preserveSettings ? new Set(['settings.ini']) : new Set();
    const hadPrevious = fs.existsSync(target);
    try {
        if (preserveSettings && hadPrevious)
            fs.cpSync(target, next, {recursive: true, verbatimSymlinks: true});
        fs.cpSync(source, next, {
            recursive: true,
            verbatimSymlinks: true,
            filter: file => !(preserveSettings && file === path.join(source, 'settings.ini')
                && fs.existsSync(path.join(next, 'settings.ini'))),
        });
        verifyTree(source, next, ignored);
        if (hadPrevious) fs.renameSync(target, previous);
        try {
            fs.renameSync(next, target);
        } catch (error) {
            if (hadPrevious) fs.renameSync(previous, target);
            throw error;
        }
    } catch (error) {
        const recovery = fs.existsSync(previous);
        if (!recovery) fs.rmSync(stage, {recursive: true});
        const detail = recovery ? ` Copia recuperable: ${previous}` : ' No quedan archivos temporales de este intento.';
        throw new Error(`No se pudo instalar ${target}.${detail}`, {cause: error});
    }
    if (hadPrevious && testMode) fs.rmSync(previous, {recursive: true});
    else if (hadPrevious) execFileSync('gio', ['trash', previous]);
    fs.rmdirSync(stage);
}
