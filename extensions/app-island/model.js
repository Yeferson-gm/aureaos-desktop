export const DEFAULTS = Object.freeze({side: 'right', monitor: 'primary', edge: 3,
    delay: 180, hideDelay: 400, theme: 'auto', material: 'glass', layout: 'grid',
    statistics: true, quickCount: 5, previews: false, shortcut: '<Super><Alt>f', density: 'comfortable'});
export const CATEGORIES = [
    ['Internet', ['WebBrowser', 'Network', 'Email', 'Chat']],
    ['Multimedia', ['AudioVideo', 'Audio', 'Video']], ['Diseño', ['Graphics', 'Photography']],
    ['Oficina', ['Office']], ['Desarrollo', ['Development']], ['Juegos', ['Game']],
    ['Sistema', ['System', 'Settings']], ['Utilidades', ['Utility']],
];
export const normalize = text => String(text).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase();
const name = value => String(value ?? '').trim().slice(0, 120);
const unique = values => [...new Set(values)];
const enumValue = (value, choices, fallback) => choices.includes(value) ? value : fallback;
export function preferences(input = {}) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) input = {};
    const number = (key, min, max) => Number.isFinite(input[key]) ? Math.round(Math.max(min, Math.min(max, input[key]))) : DEFAULTS[key];
    return {...DEFAULTS, side: enumValue(input.side, ['left', 'right'], DEFAULTS.side),
        monitor: typeof input.monitor === 'string' ? input.monitor.slice(0, 160) : 'primary',
        theme: enumValue(input.theme, ['auto', 'light', 'dark'], 'auto'),
        material: enumValue(input.material, ['glass', 'solid'], 'glass'),
        layout: enumValue(input.layout, ['grid', 'list'], 'grid'),
        density: enumValue(input.density, ['comfortable', 'compact'], 'comfortable'),
        edge: number('edge', 1, 6), delay: number('delay', 80, 800),
        hideDelay: number('hideDelay', 150, 1200), quickCount: number('quickCount', 1, 8),
        statistics: input.statistics !== false, previews: input.previews === true,
        shortcut: typeof input.shortcut === 'string' && input.shortcut.length < 80 ? input.shortcut : DEFAULTS.shortcut};
}
export function categoryFor(categories) {
    const tokens = String(categories ?? '').split(';');
    return CATEGORIES.find(([, keys]) => keys.some(key => tokens.includes(key)))?.[0] ?? 'Otras';
}
export function migrate(raw, lookup = () => null) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw Error('El archivo de favoritas no es válido.');
    if (Array.isArray(raw.favoritos) && !raw.format) {
        const groups = new Map();
        const items = unique(raw.favoritos.filter(id => typeof id === 'string')).map((id, index) => {
            const app = lookup(id);
            const title = categoryFor(app?.categories);
            if (!groups.has(title)) groups.set(title, `category-${groups.size}`);
            return {id, type: 'app', target: id, alias: '', category: groups.get(title), quick: index < 5, launch: true};
        });
        return {format: 1, settings: {...DEFAULTS}, active: 'personal', profiles: [{id: 'personal', name: 'Personal',
            categories: [...groups].map(([title, id]) => ({id, name: title, collapsed: false})), items}]};
    }
    if (raw.format !== 1 || !Array.isArray(raw.profiles) || !raw.profiles.length)
        throw Error('Formato de isla no compatible; se conserva el archivo original.');
    if (raw.profiles.length > 20) throw Error('Máximo 20 perfiles; no se modificó el original.');
    const profiles = raw.profiles.map((profile, index) => {
        if (!profile || typeof profile !== 'object') throw Error('Perfil inválido.');
        if (profile.categories?.length > 60 || profile.items?.length > 240) throw Error('Perfil demasiado grande; no se modificó el original.');
        const categories = [], seen = new Set();
        for (const c of (Array.isArray(profile.categories) ? profile.categories : []).slice(0, 60)) {
            if (!c || typeof c.id !== 'string' || !name(c.id) || seen.has(c.id)) continue;
            seen.add(c.id); categories.push({id: c.id, name: name(c.name) || 'Categoría', collapsed: c.collapsed === true, quick: c.quick === true});
        }
        if (!categories.length) categories.push({id: 'general', name: 'General', collapsed: false});
        const items = [], ids = new Set(), targets = new Set();
        for (const item of (Array.isArray(profile.items) ? profile.items : []).slice(0, 240)) {
            if (!item || !['app', 'uri'].includes(item.type) || !name(item.id) || ids.has(item.id) || typeof item.target !== 'string') continue;
            if (item.type === 'uri' && !/^(https?:\/\/|file:\/\/\/)/i.test(item.target)) continue;
            const key = `${item.type}:${item.target}`;
            if (targets.has(key)) continue;
            ids.add(item.id); targets.add(key);
            items.push({id: item.id, type: item.type, target: item.target, alias: name(item.alias),
                category: categories.some(c => c.id === item.category) ? item.category : categories[0].id,
                quick: item.quick === true, quickOrder: Number.isFinite(item.quickOrder) ? item.quickOrder : items.length, launch: item.launch !== false});
        }
        return {id: `profile-${index}`, scroll: Math.max(0, Number(profile.scroll) || 0), name: name(profile.name) || 'Perfil', categories, items};
    });
    const activeIndex = raw.profiles.findIndex(p => p.id === raw.active);
    return {format: 1, settings: preferences(raw.settings), active: profiles[Math.min(profiles.length - 1, Math.max(0, activeIndex))].id, profiles};
}
export class IslandModel {
    constructor(raw, lookup) { this.data = migrate(raw, lookup); this.undo = null; }
    get profile() { return this.data.profiles.find(p => p.id === this.data.active) ?? this.data.profiles[0]; }
    get settings() { return this.data.settings; }
    transact(fn) { const before = JSON.stringify(this.data); fn(); this.undo = before; }
    restore() { if (this.undo) { this.data = JSON.parse(this.undo); this.undo = null; } }
    category(title) {
        title = name(title); if (!title) throw Error('Escribe un nombre.');
        const found = this.profile.categories.find(c => normalize(c.name) === normalize(title));
        if (found) return found.id;
        if (this.profile.categories.length >= 60) throw Error('Máximo 60 categorías por perfil.');
        const id = `category-${Date.now()}-${this.profile.categories.length}`;
        this.profile.categories.push({id, name: title, collapsed: false}); return id;
    }
    add(item) {
        if (this.profile.items.some(i => i.type === item.type && i.target === item.target)) return false;
        if (this.profile.items.length >= 240) throw Error('Este perfil alcanzó 240 accesos.');
        this.profile.items.push({...item, alias: name(item.alias), quick: item.quick === true, launch: true}); return true;
    }
    quickItems() {
        return this.profile.items.filter(i => i.quick).sort((a, b) => (a.quickOrder ?? this.profile.items.indexOf(a)) - (b.quickOrder ?? this.profile.items.indexOf(b)));
    }
    reorderQuick(id, direction) {
        const items = this.quickItems(), index = items.findIndex(i => i.id === id), next = index + direction;
        if (index < 0 || next < 0 || next >= items.length) return;
        this.transact(() => {
            [items[index], items[next]] = [items[next], items[index]];
            items.forEach((item, order) => { item.quickOrder = order; });
        });
    }
    remove(id) { this.transact(() => { this.profile.items = this.profile.items.filter(i => i.id !== id); }); }
    move(id, category, beforeId = null) {
        if (!this.profile.categories.some(c => c.id === category)) return;
        const item = this.profile.items.find(i => i.id === id); if (!item || id === beforeId) return;
        this.transact(() => {
            this.profile.items = this.profile.items.filter(i => i.id !== id); item.category = category;
            const index = this.profile.items.findIndex(i => i.id === beforeId);
            this.profile.items.splice(index < 0 ? this.profile.items.length : index, 0, item);
        });
    }
    reorder(id, direction) {
        const item = this.profile.items.find(i => i.id === id); if (!item) return;
        const peers = this.profile.items.filter(i => i.category === item.category);
        const index = peers.indexOf(item), other = peers[index + direction]; if (!other) return;
        this.move(id, item.category, direction < 0 ? other.id : peers[index + 2]?.id);
    }
    deleteCategory(id) {
        this.transact(() => {
            this.profile.categories = this.profile.categories.filter(c => c.id !== id);
            const target = this.category('General');
            for (const item of this.profile.items) if (item.category === id) item.category = target;
        });
    }
    newProfile(title) {
        if (!name(title)) throw Error('Escribe un nombre.');
        if (this.data.profiles.length >= 20) throw Error('Máximo 20 perfiles.');
        const id = `profile-${Date.now()}-${this.data.profiles.length}`;
        this.data.profiles.push({id, name: name(title), categories: [{id: 'general', name: 'General', collapsed: false}], items: []});
        this.data.active = id;
    }
    filter(query, displayName) {
        const term = normalize(query.trim());
        return this.profile.items.filter(item => normalize(`${item.alias} ${displayName(item)} ${this.profile.categories.find(c => c.id === item.category)?.name}`).includes(term));
    }
}
