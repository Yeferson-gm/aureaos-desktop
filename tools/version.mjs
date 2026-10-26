import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

export function parseTag(tag) {
    const match = /^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.exec(tag);
    if (!match) throw new Error(`Etiqueta semántica inválida: ${tag}`);
    const [major, minor, patch] = match.slice(1).map(Number);
    const integer = major * 1000000 + minor * 1000 + patch;
    if (minor > 999 || patch > 999 || !Number.isSafeInteger(integer) || integer < 1 || integer > 2147483647)
        throw new Error('Versión fuera del rango compatible con GNOME');
    return {name: tag.slice(1), integer};
}

export function gitVersion(root) {
    const git = (...args) => execFileSync('git', ['-C', root, ...args], {encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe']}).trim();
    if (git('status', '--porcelain')) throw new Error('La distribución requiere un árbol Git limpio');
    const tag = git('describe', '--tags', '--exact-match', '--match', 'v[0-9]*', 'HEAD');
    return {...parseTag(tag), tag, commit: git('rev-parse', 'HEAD')};
}

if (process.argv[1] === fileURLToPath(import.meta.url))
    console.log(JSON.stringify(gitVersion(new URL('..', import.meta.url).pathname), null, 2));
