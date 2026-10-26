
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
}

export function springProgress(t) {

    const response = x => 1 - (1 + 8 * x) * Math.exp(-8 * x);
    return response(Math.max(0, Math.min(1, t))) / response(1);
}
