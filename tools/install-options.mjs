export function parseInstallOptions(args) {
    const folders = args.filter(arg => !arg.startsWith('--'));
    const flags = args.filter(arg => arg.startsWith('--'));
    const actions = flags.filter(flag => ['--apply', '--check'].includes(flag));
    const components = flags.filter(flag => flag.startsWith('--component='));
    if (folders.length !== 1 || actions.length > 1 || components.length > 1 || flags.length !== actions.length + components.length)
        throw new Error('Uso: aurea.sh install RUTA [--apply | --check] [--component=NOMBRE]');
    const component = components[0]?.slice('--component='.length) ?? null;
    if (component !== null && !/^[a-z][a-z0-9-]*$/.test(component)) throw new Error('Componente inválido');
    return {folder: folders[0], action: actions[0]?.slice(2) ?? 'preview', component};
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
