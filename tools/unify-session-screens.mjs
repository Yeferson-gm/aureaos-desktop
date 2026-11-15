import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {execFileSync} from 'node:child_process';
import {verifyTree} from './files.mjs';
const [folder, action = '--check'] = process.argv.slice(2);
if (!folder || !['--check', '--apply'].includes(action) || process.argv.length > 4)
    throw new Error('Uso: node tools/unify-session-screens.mjs PAQUETE [--check | --apply]');
const uuid = 'aurea-lock-screen@local';
const source = path.resolve(folder, 'extensions', uuid);
const system = path.join('/usr/share/gnome-shell/extensions', uuid);
verifyTree(source, system);
const metadata = JSON.parse(fs.readFileSync(path.join(system, 'metadata.json')));
if (metadata.uuid !== uuid || !['gdm', 'user', 'unlock-dialog'].every(mode => metadata['session-modes'].includes(mode)))
    throw new Error('Falta instalar el módulo unificado del sistema. Aplica primero el instalador administrativo de GDM.');
const user = path.join(process.env.XDG_DATA_HOME ?? path.join(os.homedir(), '.local/share'), 'gnome-shell/extensions', uuid);
if (fs.existsSync(user) && action === '--apply')
    execFileSync('gjs', [path.join(import.meta.dirname, 'retire-user-lock.js')], {stdio: 'inherit'});
if (fs.existsSync(user)) throw new Error('Aún existe la copia de usuario; usa --apply para retirarla conservando su activación.');
console.log('Una sola instalación de Acceso y bloqueo: módulo del sistema verificado.');
