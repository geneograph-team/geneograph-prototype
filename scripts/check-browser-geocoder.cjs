/* Dependency-free contract tests for the browser-only geocoding adapter (#158). */
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const adapterText = read('src/core/geocoder-adapter.js');
const html = read('src/index.html');
const shared = read('src/shared/date-and-place-fields.js');
const workflow = read('.github/workflows/deploy-prototype.yml');
const geocoderConfig = read('src/browser-config.js');
const places = read('src/modules/places/editor.js');
const geneograph = read('src/modules/geneograph/geneograph-pickers.js');
const about = read('src/core/app-shell.js');

assert.match(html, /src="browser-config\.js"/);
assert.ok(html.indexOf('geocoder-adapter.js') < html.indexOf('shared/date-and-place-fields.js'));
assert.doesNotMatch(html, /maptilerKey|api\.maptiler\.com/);
assert.doesNotMatch(shared, /api\.maptiler\.com|placesMaptilerKey/);
assert.match(shared, /geneographGeocoder\.search\(query, signal, 5\)/);
assert.match(workflow, /secrets\.GEOAPIFY_BROWSER_KEY/);
assert.match(workflow, /secrets\.LOCATIONIQ_BROWSER_KEY/);
assert.doesNotMatch(geocoderConfig, /maptilerKey/);
assert.match(places, /geneographGeocoder\.attributionHtml\(\)/);
assert.match(geneograph, /geneographGeocoder\.attributionHtml\(\)/);
assert.match(about, /Data providers/);

const geoResult = { lat: 49.8397, lon: 24.0297, name: 'Lviv',
    formatted: 'Lviv, Ukraine', address_line2: 'Ukraine' };
const liqResult = { lat: '49.8397', lon: '24.0297', display_place: 'Львів',
    display_name: 'Львів, Україна', display_address: 'Україна' };
const ok = data => ({ ok: true, status: 200, json: async () => data });
const httpError = status => ({ ok: false, status });

function createContext(responses)
{
    const calls = [];
    const context = {
        window: { GENEOGRAPH_CONFIG: { geoapifyKey: 'test-geo-key',
            locationiqKey: 'test-location-key' } },
        state: { language: 'ru' },
        URL,
        AbortController,
        DOMException,
        setTimeout,
        clearTimeout,
        Date,
        fetch: async (url, options) =>
        {
            const parsed = new URL(url);
            calls.push({ url: parsed, signal: options.signal });
            const item = responses.shift();
            if (item instanceof Error) throw item;
            if (typeof item === 'function') return item(options);
            if (!item) throw new Error('Unexpected request');
            return item;
        }
    };
    vm.runInNewContext(adapterText + '\nthis.geocoder = geneographGeocoder;', context);
    return { geocoder: context.geocoder, calls, context };
}

async function run()
{
    {
        const { geocoder, calls } = createContext([ok({ results: [geoResult] })]);
        const results = await geocoder.search('Lwów');
        assert.equal(results.length, 1);
        assert.equal(results[0].kind, 'map');
        assert.equal(results[0].name, 'Lviv, Ukraine');
        assert.equal(results[0].coordinates.lat, 49.8397);
        assert.equal(calls.length, 1);
        assert.equal(calls[0].url.searchParams.get('lang'), 'ru');
        assert.equal(calls[0].url.searchParams.get('apiKey'), 'test-geo-key');
        assert.match(geocoder.attributionHtml(), /Powered by Geoapify/);
        assert.match(geocoder.attributionHtml(), /Search by LocationIQ.com/);
    }
    {
        const { geocoder, calls } = createContext([
            ok({ results: [] }), ok([liqResult])
        ]);
        const results = await geocoder.search('Львів');
        assert.equal(results.length, 1);
        assert.equal(results[0].primary, 'Львів');
        assert.equal(calls.length, 2);
        assert.equal(calls[1].url.searchParams.get('key'), 'test-location-key');
        assert.equal(calls[1].url.searchParams.get('accept-language'), 'ru');
    }
    {
        const { geocoder, calls } = createContext([
            httpError(429), ok([liqResult]), ok([liqResult])
        ]);
        assert.equal((await geocoder.search('Lwów')).length, 1);
        assert.equal((await geocoder.search('Lwów')).length, 1);
        assert.equal(calls.length, 3);
        assert.equal(calls[2].url.hostname, 'api.locationiq.com');
    }
    {
        const { geocoder, calls } = createContext([
            new TypeError('Network down'), ok([liqResult])
        ]);
        assert.equal((await geocoder.search('Lviv')).length, 1);
        assert.equal(calls.length, 2);
    }
    {
        // An internal provider timeout must fall back, unlike a caller abort.
        const { geocoder, calls } = createContext([
            new DOMException('Provider timed out', 'AbortError'), ok([liqResult])
        ]);
        assert.equal((await geocoder.search('Lviv')).length, 1);
        assert.equal(calls.length, 2);
    }
    {
        const { geocoder } = createContext([httpError(500), httpError(500)]);
        await assert.rejects(() => geocoder.search('Lviv'), /temporarily unavailable/);
    }
    {
        const { geocoder } = createContext([ok({ results: [] }), httpError(403)]);
        assert.equal((await geocoder.search('Unknown place')).length, 0);
    }
    {
        const { geocoder, calls } = createContext([ok({ results: [geoResult] })]);
        const cancelled = new AbortController();
        cancelled.abort();
        await assert.rejects(() => geocoder.search('Lviv', cancelled.signal),
            error => error.name === 'AbortError');
        assert.equal(calls.length, 0);
    }
    {
        const controller = new AbortController();
        const { geocoder, calls } = createContext([
            options => new Promise((_resolve, reject) =>
            {
                options.signal.addEventListener('abort', () =>
                    reject(new DOMException('cancelled', 'AbortError')), { once: true });
                controller.abort();
            })
        ]);
        await assert.rejects(() => geocoder.search('Lviv', controller.signal),
            error => error.name === 'AbortError');
        assert.equal(calls.length, 1);
    }
    console.log('Browser geocoder fallback, normalization and cancellation checks passed.');
}

run().catch(error =>
{
    console.error(error);
    process.exitCode = 1;
});
