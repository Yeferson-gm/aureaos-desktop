
export class ActivityQueue {
    constructor(now = () => Date.now()) {
        this._now = now;
        this._entries = [];
        this._sequence = 0;
    }

    push(event) {
        const key = event.key ?? event.icon ?? 'activity';
        const entry = {...event, key, priority: event.priority ?? (event.warn ? 100 : 20),
            expires: this._now() + Math.max(1000, event.ms ?? 2500), sequence: ++this._sequence};
        this._entries = this._entries.filter(item => item.key !== key && item.expires > this._now());
        this._entries.push(entry);
        this._entries.sort((a, b) => b.priority - a.priority || b.sequence - a.sequence);
        this._entries = this._entries.slice(0, 8);
        return this.current;
    }

    get current() {
        this._entries = this._entries.filter(item => item.expires > this._now());
        return this._entries[0] ?? null;
    }

    get entries() {
        this.current;
        return [...this._entries];
    }

    clear() { this._entries = []; }

    dismiss(key = this.current?.key) {
        this._entries = this._entries.filter(entry => entry.key !== key);
        return this.current;
    }
}

export class LiveActivities {
    constructor() {
        this.items = new Map();
        this.selected = null;
    }

    update(key, value) {
        if (value) this.items.set(key, {...value, key});
        else this.items.delete(key);
        if (!this.items.has(this.selected)) this.selected = this.entries[0]?.key ?? null;
    }

    get entries() {
        return [...this.items.values()].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
    }

    get current() { return this.items.get(this.selected) ?? this.entries[0] ?? null; }

    cycle(delta = 1) {
        const entries = this.entries;
        if (!entries.length) return null;
        const index = entries.findIndex(item => item.key === this.selected);
        this.selected = entries[(index + delta + entries.length) % entries.length].key;
        return this.current;
    }

    clear() { this.items.clear(); this.selected = null; }
}

export function springProgress(t) {

    const response = x => 1 - (1 + 8 * x) * Math.exp(-8 * x);
    return response(Math.max(0, Math.min(1, t))) / response(1);
}
