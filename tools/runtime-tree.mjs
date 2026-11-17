import fs from 'node:fs';
import path from 'node:path';
export function verifyRuntimeTree(directory) {
    for (const entry of fs.readdirSync(directory, {withFileTypes: true})) {
        const file = path.join(directory, entry.name);
        if (entry.isSymbolicLink()) throw new Error(`El módulo distribuido debe contener archivos propios, no enlaces: ${file}`);
        if (entry.isDirectory()) verifyRuntimeTree(file);
    }
}
