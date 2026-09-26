import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import axios from 'axios';

const storage = () => {
    const values = new Map();
    return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), clear: () => values.clear() };
};
globalThis.localStorage = storage();
globalThis.sessionStorage = storage();
globalThis.window = new EventTarget();
const { default: client } = await import('../src/api/axios.js');
const response = (config, data = {}) => ({ config, data, headers: {}, status: 200, statusText: 'OK' });
beforeEach(() => {
    client.clearCache();
    localStorage.clear();
    sessionStorage.clear();
});

test('simultaneous reads do not cancel one another', async () => {
    const adapter = async config => {
        await new Promise(resolve => setTimeout(resolve, 5));
        assert.equal(config.signal.aborted, false);
        return response(config);
    };
    await Promise.all([client.get('/survey', { adapter }), client.get('/survey', { adapter })]);
    assert.deepEqual(client.getPendingRequests(), []);
});

test('already canceled signals never reach the adapter', async () => {
    const controller = new AbortController();
    controller.abort();
    await assert.rejects(client.get('/survey', {
        signal: controller.signal, adapter: () => assert.fail('request dispatched'),
    }), axios.isCancel);
    assert.deepEqual(client.getPendingRequests(), []);
});

test('transient reads retry once, writes never retry', async () => {
    for (const method of ['get', 'post']) {
        let calls = 0;
        const adapter = async config => {
            calls++;
            throw new axios.AxiosError('network unavailable', 'ERR_NETWORK', config);
        };
        await assert.rejects(client({ method, url: '/survey', adapter, retryDelay: 0 }));
        assert.equal(calls, method === 'get' ? 2 : 1);
    }
});

test('cache bypass, mutations and account changes fetch fresh data', async () => {
    let calls = 0;
    const adapter = async config => response(config, ++calls);
    const read = options => client.getWithCache('/survey', {}, { adapter, ...options });
    assert.equal((await read()).data, 1);
    assert.equal((await read()).data, 1);
    assert.equal((await read({ cache: false })).data, 2);
    await client.post('/survey', {}, { adapter });
    assert.equal((await read()).data, 4);
    localStorage.setItem('TOKEN', 'another-account');
    assert.equal((await read()).data, 5);
});

test('canceling during retry backoff prevents a second request', async () => {
    const controller = new AbortController();
    let calls = 0;
    const pending = client.get('/survey', {
        signal: controller.signal,
        retryDelay: 25,
        adapter: async config => {
            calls++;
            setTimeout(() => controller.abort(), 1);
            throw new axios.AxiosError('network unavailable', 'ERR_NETWORK', config);
        },
    });
    await assert.rejects(pending, axios.isCancel);
    assert.equal(calls, 1);
});

test('superseded debounced calls settle and use the newest parameters', async () => {
    const options = { requestKey: 'search', debounceTime: 1, adapter: async config => response(config, config.params) };
    const first = client.getDebouncedWithCancel('/survey', { q: 'old' }, options);
    const rejected = assert.rejects(first, axios.isCancel);
    const second = client.getDebouncedWithCancel('/survey', { q: 'new' }, options);
    await rejected;
    assert.deepEqual((await second).data, { q: 'new' });
});

test('clearing debounce timers settles callers without dispatching', async () => {
    const promise = client.getDebouncedWithCancel('/survey', {}, { adapter: () => assert.fail('request dispatched') });
    const rejected = assert.rejects(promise, axios.isCancel);
    assert.equal(client.clearDebouncedRequests(), 1);
    await rejected;
});

test('a read started before a mutation cannot refill the invalidated cache', async () => {
    let finish;
    const pending = client.getWithCache('/survey', {}, {
        adapter: config => new Promise(resolve => { finish = () => resolve(response(config, 'old')); }),
    });
    await new Promise(resolve => setImmediate(resolve));
    await client.post('/survey', {}, { adapter: async config => response(config) });
    finish();
    await pending;
    const fresh = await client.getWithCache('/survey', {}, { adapter: async config => response(config, 'new') });
    assert.equal(fresh.data, 'new');
});
