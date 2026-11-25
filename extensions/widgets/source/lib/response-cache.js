export class ResponseCache {
    constructor({maxEntries = 64, maxBytes = 4 * 1024 * 1024, now = () => Date.now()} = {}) {
        if (!Number.isInteger(maxEntries) || maxEntries < 1 || !Number.isFinite(maxBytes) || maxBytes < 0)
            throw new RangeError('Invalid cache capacity');
        this.maxEntries = maxEntries;
        this.maxBytes = maxBytes;
        this.now = now;
        this.entries = new Map();
        this.bytes = 0;
    }

    get size() { return this.entries.size; }

    remove(key) {
        const entry = this.entries.get(key);
        if (!entry) return;
        this.bytes -= entry.bytes;
        this.entries.delete(key);
    }

    prune() {
        const now = this.now();
        for (const [key, entry] of this.entries)
            if (entry.expires <= now) this.remove(key);
    }

    get(key, ttl) {
        this.prune();
        const entry = this.entries.get(key);
        if (!entry || ttl <= 0 || this.now() - entry.created >= ttl) return undefined;
        this.entries.delete(key);
        this.entries.set(key, entry);
        return entry.value;
    }

    set(key, value, ttl) {
        this.remove(key);
        this.prune();
        const bytes = typeof value === 'string' ? value.length * 2 : value.byteLength;
        if (!Number.isFinite(ttl) || ttl <= 0 || !Number.isFinite(bytes) || bytes > this.maxBytes) return;
        while (this.entries.size >= this.maxEntries || this.bytes + bytes > this.maxBytes)
            this.remove(this.entries.keys().next().value);
        const created = this.now();
        this.entries.set(key, {value, bytes, created, expires: created + ttl});
        this.bytes += bytes;
    }

    clear() {
        this.entries.clear();
        this.bytes = 0;
    }
}
