// Extrae/empaqueta los bloques de fuentes sin ejecutar el instalador adjunto.
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const installer = path.join(root, 'instalar-macos27-widgets.sh');
const pattern = /write_file ([\w./-]+) <<'(__LW_FILE_\d+__)'\n([\s\S]*?)\n\2/g;
let count = 0;
const input = fs.readFileSync(installer, 'utf8');
const output = input.replace(pattern, (block, name, end, body) => {
    const file = path.resolve(root, 'source', name);
    if (!file.startsWith(path.join(root, 'source') + '/')) throw new Error('Ruta inválida');
    count++;
    if (process.argv[2] === 'pack')
        return `write_file ${name} <<'${end}'\n${fs.readFileSync(file, 'utf8').trimEnd()}\n${end}`;
    fs.mkdirSync(path.dirname(file), {recursive:true});
    fs.writeFileSync(file, body + '\n');
    return block;
});
if (count !== 26) throw new Error(`Bloques inesperados: ${count}`);
if (process.argv[2] === 'pack') fs.writeFileSync(installer, output);
console.log(`${count} archivos ${process.argv[2] === 'pack' ? 'empaquetados' : 'extraídos'}`);
