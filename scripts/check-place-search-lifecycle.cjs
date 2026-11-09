/* Browser geocoder contract tests. No real provider credentials or network. */
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const adapterText = fs.readFileSync(path.join(root, 'src/core/geocoder-adapter.js'), 'utf8');
const sharedText = fs.readFileSync(path.join(root, 'src/shared/date-and-place-fields.js'), 'utf8');
const sharedStart = sharedText.indexOf('async function searchSharedPlaceMapResults(');
const sharedEnd = sharedText.indexOf('\nfunction bindPlaceComboboxes(', sharedStart);
assert.ok(sharedStart >= 0 && sharedEnd > sharedStart, 'Shared search function missing');

function harness(fetcher, { shortTimeout = false, legacy = false } = {})
{
    const requests = [];
    const context = {
        window: { GENEOGRAPH_CONFIG: {
            geoapifyKey: 'test-only-geo', locationiqKey: 'test-only-liq'
        } },
        state: { language: 'en' },
        URL, DOMException, AbortController,
        AbortSignal: legacy ? { any: undefined, timeout: undefined } : AbortSignal,
        Date, setTimeout, clearTimeout,
        fetch: (url, options) =>
        {
            const parsed = new URL(url);
            const provider = parsed.hostname.includes('geoapify') ? 'geoapify' : 'locationiq';
            requests.push({ provider, query: parsed.searchParams.get('text')
                || parsed.searchParams.get('q'), signal: options.signal });
            return fetcher(provider, options.signal, requests);
        }
    };
    const code = shortTimeout
        ? adapterText.replace('const timeoutMs = 6500;', 'const timeoutMs = 25;')
        : adapterText;
    vm.runInNewContext(code + '\n'
        + sharedText.slice(sharedStart, sharedEnd) + '\n'
        + 'this.geocoder = geneographGeocoder;\n'
        + 'this.sharedSearch = searchSharedPlaceMapResults;', context);
    return { ...context, requests };
}

const success = provider => ({
    ok: true,
    status: 200,
    json: async () => provider === 'geoapify'
        ? { results: [{ name: 'Odesa', formatted: 'Odesa, Ukraine',
            lat: 46.4825, lon: 30.7233 }] }
        : [{ display_name: 'Odesa, Ukraine', display_place: 'Odesa',
            display_address: 'Ukraine', lat: '46.4825', lon: '30.7233' }]
});
const empty = { ok: true, status: 200, json: async () => ({ results: [] }) };
const httpError = code => ({ ok: false, status: code });

function delayedResponse(signal, provider, ms = 150)
{
    return new Promise((resolve, reject) =>
    {
        const timer = setTimeout(() => {
            signal.removeEventListener('abort', cancel);
            resolve(success(provider));
        }, ms);
        function cancel()
        {
            clearTimeout(timer);
            reject(signal.reason || new DOMException('cancelled', 'AbortError'));
        }
        signal.addEventListener('abort', cancel, { once: true });
        if (signal.aborted) cancel();
    });
}

async function run()
{
    {
        const h = harness(provider => Promise.resolve(success(provider)));
        const rows = await h.sharedSearch('Odesa', new AbortController().signal);
        assert.equal(rows.length, 1);
        assert.equal(rows[0].kind, 'map');
        assert.equal(rows[0].coordinates.lat, 46.4825);
        assert.deepEqual(h.requests.map(x => x.provider), ['geoapify']);
    }
    {
        const h = harness(provider => Promise.resolve(
            provider === 'geoapify' ? empty : success(provider)));
        assert.equal((await h.sharedSearch('Odesa', new AbortController().signal)).length, 1);
        assert.deepEqual(h.requests.map(x => x.provider), ['geoapify', 'locationiq']);
    }
    {
        const h = harness(provider => Promise.resolve(
            provider === 'geoapify' ? httpError(401) : success(provider)));
        assert.equal((await h.sharedSearch('Odesa', new AbortController().signal)).length, 1);
        assert.deepEqual(h.requests.map(x => x.provider), ['geoapify', 'locationiq']);
    }
    {
        const h = harness(() => Promise.resolve(httpError(503)));
        await assert.rejects(() => h.sharedSearch('Odesa', new AbortController().signal),
            /temporarily unavailable/);
        assert.deepEqual(h.requests.map(x => x.provider), ['geoapify', 'locationiq']);
    }
    {
        // An explicitly aborted request must not start either provider.
        const h = harness(provider => Promise.resolve(success(provider)));
        const caller = new AbortController();
        caller.abort();
        assert.equal((await h.sharedSearch('Odesa', caller.signal)).length, 0);
        assert.equal(h.requests.length, 0);
    }
    for (const legacy of [false, true])
    {
        let started;
        const requested = new Promise(resolve => { started = resolve; });
        const h = harness((provider, signal) =>
        {
            started();
            return delayedResponse(signal, provider);
        }, { legacy });
        const caller = new AbortController();
        const searching = h.sharedSearch('Odesa', caller.signal);
        await requested;
        const reason = new DOMException('Superseded place query', 'AbortError');
        caller.abort(reason);
        assert.equal((await searching).length, 0);
        assert.equal(h.requests.length, 1, 'Cancellation must not call fallback');
        assert.equal(h.requests[0].signal.aborted, true);
        assert.equal(h.requests[0].signal.reason, reason,
            'The transport should preserve the caller cancellation reason');
    }
    {
        // Internal provider timeout must trigger fallback, not user cancellation.
        const h = harness((provider, signal) =>
            provider === 'geoapify' ? delayedResponse(signal, provider, 500)
                : Promise.resolve(success(provider)), { shortTimeout: true });
        const rows = await h.sharedSearch('Odesa', new AbortController().signal);
        assert.equal(rows.length, 1);
        assert.deepEqual(h.requests.map(x => x.provider), ['geoapify', 'locationiq']);
        assert.equal(h.requests[0].signal.reason?.name, 'TimeoutError');
    }
    {
        // Aborting while parsing response body must still be ignored.
        let notify;
        const startedBody = new Promise(resolve => { notify = resolve; });
        const h = harness((provider, signal) => Promise.resolve({
            ok: true, status: 200,
            json: () => new Promise((_resolve, reject) =>
            {
                notify();
                signal.addEventListener('abort', () => reject(signal.reason), { once: true });
            })
        }));
        const caller = new AbortController();
        const searching = h.sharedSearch('Odesa', caller.signal);
        await startedBody;
        caller.abort();
        assert.equal((await searching).length, 0);
        assert.equal(h.requests.length, 1);
    }
    console.log('Place search lifecycle: success, fallback, cancellation, timeout and parsing passed.');
}

run().catch(error =>
{
    console.error(error);
    process.exitCode = 1;
});
