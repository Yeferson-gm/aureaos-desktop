import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {ResponseCache} from '../source/lib/response-cache.js';

let now = 0;
assert.throws(() => new ResponseCache({maxEntries: 0}), RangeError);
assert.throws(() => new ResponseCache({maxBytes: -1}), RangeError);
const cache = new ResponseCache({maxEntries: 2, maxBytes: 8, now: () => now});
cache.set('a', 'aa', 100);
cache.set('b', 'bb', 100);
assert.equal(cache.bytes, 8);
assert.equal(cache.get('a', 100), 'aa');
cache.set('c', 'cc', 100);
assert.equal(cache.get('b', 100), undefined);
assert.equal(cache.size, 2);
cache.set('oversized', new Uint8Array(9), 100);
assert.equal(cache.get('oversized', 100), undefined);
now = 50;
assert.equal(cache.get('a', 20), undefined);
now = 101;
assert.equal(cache.get('a', 100), undefined);
assert.equal(cache.bytes, 0);
const bounded = new ResponseCache();
for (let i = 0; i < 1000; i++) bounded.set(`response-${i}`, new Uint8Array(128 * 1024), 10000);
assert.equal(bounded.bytes, 4 * 1024 * 1024);
assert.equal(bounded.size, 32);
bounded.clear();
assert.equal(bounded.bytes, 0);

const requests = [];
const context = vm.createContext({ResponseCache, TextDecoder,
    GLib: {build_filenamev: p => p.join('/'), get_user_config_dir: () => '/config', get_user_cache_dir: () => '/cache', PRIORITY_DEFAULT: 0},
    Soup: {Session: class {
        send_and_read_async(message, priority, cancel, callback) { requests.push(error => callback(this, {error})); }
        send_and_read_finish(result) {
            if (result.error) throw result.error;
            return {get_data: () => new TextEncoder().encode('answer')};
        }
        abort() {}
    }, Message: {new: () => ({get_status: () => 200})}},
});
const source = fs.readFileSync(new URL('../source/lib/util.js', import.meta.url), 'utf8')
    .replace(/^import .*;\n/gm, '').replace(/^export /gm, '');
vm.runInContext(source + '\nglobalThis.api = {http, cerrarHttp, cache: _cache, pending: _pending};', context);
const {http, cerrarHttp} = context.api;
const a = http('https://fixture/a', {ttl: 1000}), b = http('https://fixture/a', {ttl: 1000});
assert.equal(requests.length, 1, 'Concurrent callers share one transfer');
requests.shift()();
assert.deepEqual(await Promise.all([a, b]), ['answer', 'answer']);
assert.equal(context.api.pending.size, 0);
assert.equal(await http('https://fixture/a', {ttl: 1000}), 'answer');
assert.equal(requests.length, 0);
const binary = http('https://fixture/a', {ttl: 1000, binario: true});
assert.equal(requests.length, 1, 'Binary and text must not share cached values');
requests.shift()();
assert.ok((await binary) instanceof Uint8Array);
const old = http('https://fixture/late', {ttl: 1000});
cerrarHttp();
requests.shift()();
await old;
assert.equal(context.api.cache.size, 0, 'Late response must not repopulate a closed cache');
assert.equal(context.api.pending.size, 0);
const failures = Promise.allSettled([http('https://fixture/failure'), http('https://fixture/failure')]);
assert.equal(requests.length, 1);
requests.shift()(new Error('Network unavailable'));
assert.ok((await failures).every(result => result.status === 'rejected'));
assert.equal(context.api.pending.size, 0);
const retry = http('https://fixture/failure');
requests.shift()();
assert.equal(await retry, 'answer');
const stale = http('https://fixture/restart', {ttl: 1000});
cerrarHttp();
const current = http('https://fixture/restart', {ttl: 1000});
requests.shift()();
await stale;
assert.equal(context.api.pending.size, 1, 'Old completion cannot remove the new transfer');
assert.equal(context.api.cache.size, 0);
requests.shift()();
await current;
assert.equal(context.api.pending.size, 0);
assert.equal(context.api.cache.size, 1);
cerrarHttp();
console.log('PASS: cache 4 MiB / 64 entries, expiration, LRU, oversized values, shared transfers, data types and shutdown');
