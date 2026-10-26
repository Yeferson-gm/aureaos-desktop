import fs from 'node:fs';
import path from 'node:path';

export function verifyTree(source, target, ignored = new Set()) {
    let count = 0;
    for (const entry of fs.readdirSync(source, {withFileTypes: true})) {
        if (ignored.has(entry.name)) continue;
        const a = path.join(source, entry.name), b = path.join(target, entry.name);
        if (entry.isSymbolicLink()) {
            if (!fs.lstatSync(b).isSymbolicLink() || fs.readlinkSync(a) !== fs.readlinkSync(b))
                throw new Error(`Enlace diferente: ${b}`);
            count++;
        } else if (entry.isDirectory()) count += verifyTree(a, b, ignored);
        else {
            if (!fs.lstatSync(b).isFile() || !fs.readFileSync(a).equals(fs.readFileSync(b)))
                throw new Error(`Archivo diferente: ${b}`);
            count++;
        }
    }
    return count;
}
