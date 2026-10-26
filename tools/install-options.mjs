export function parseInstallOptions(args) {
    const folders = args.filter(arg => !arg.startsWith('--'));
    const flags = args.filter(arg => arg.startsWith('--'));
    if (folders.length !== 1 || flags.length > 1 || flags.some(flag => !['--apply', '--check'].includes(flag)))
        throw new Error('Uso: aurea.sh install RUTA [--apply | --check]');
    return {folder: folders[0], action: flags[0]?.slice(2) ?? 'preview'};
}

export function validateMigrations(migrations, extensions) {
    if (!migrations || typeof migrations !== 'object' || Array.isArray(migrations))
        throw new Error('Migraciones inválidas');
    const ids = new Set(Object.values(extensions));
    for (const [oldId, newId] of Object.entries(migrations)) {
        if (!/^[\w.-]+@[\w.-]+$/.test(oldId) || !ids.has(newId) || ids.has(oldId))
            throw new Error(`Migración de UUID inválida: ${oldId}`);
    }
}
