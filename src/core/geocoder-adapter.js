/*
 * Browser-only geocoder for #158.
 * Geoapify first, then LocationIQ silently if it fails or finds no matches.
 * Provider keys are public browser credentials, not server-side secrets.
 */
const geneographGeocoder = (function ()
{
    const endpoints = Object.freeze({
        geoapify: 'https://api.geoapify.com/v1/geocode/autocomplete',
        locationiq: 'https://api.locationiq.com/v1/autocomplete'
    });
    const limits = Object.freeze({
        geoapify: 300,
        locationiq: 1150
    });
    const nextRequestAt = { geoapify: 0, locationiq: 0 };
    const cooldownUntil = { geoapify: 0, locationiq: 0 };
    const timeoutMs = 6500;
    const maxQueryLength = 200;

    function abortError()
    {
        return new DOMException('Search cancelled', 'AbortError');
    }

    function cleanText(value)
    {
        return String(value == null ? '' : value)
            .replace(/[\u0000-\u001f\u007f]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 240);
    }

    function normalizeResult(item, index, source)
    {
        const lat = Number(item?.lat);
        const lng = Number(item?.lon);
        if (!Number.isFinite(lat) || lat < -90 || lat > 90
            || !Number.isFinite(lng) || lng < -180 || lng > 180)
        {
            return null;
        }

        let name;
        let primary;
        let context;
        if (source === 'geoapify')
        {
            name = cleanText(item.formatted);
            primary = cleanText(item.name || item.city || item.address_line1
                || name.split(',')[0]);
            context = cleanText(item.address_line2 || [
                item.county, item.state, item.country
            ].filter(Boolean).join(', '));
        }
        else
        {
            name = cleanText(item.display_name);
            primary = cleanText(item.display_place || name.split(',')[0]);
            context = cleanText(item.display_address
                || name.split(',').slice(1).join(', '));
        }

        if (!name) name = cleanText([primary, context].filter(Boolean).join(', '));
        if (!name) return null;
        return {
            id: 'map-result-' + index,
            kind: 'map',
            name,
            primary: primary || name,
            context,
            coordinates: { lat, lng }
        };
    }

    function normalizeResponse(json, source, limit)
    {
        const items = source === 'geoapify' ? json?.results : json;
        if (!Array.isArray(items)) throw new Error('Invalid geocoding response');
        return items.slice(0, limit)
            .map((item, index) => normalizeResult(item, index, source))
            .filter(Boolean);
    }

    function providerKey(source)
    {
        const field = source === 'geoapify' ? 'geoapifyKey' : 'locationiqKey';
        return cleanText(window.GENEOGRAPH_CONFIG?.[field] || '');
    }

    function wait(ms, signal)
    {
        if (signal?.aborted) return Promise.reject(abortError());
        if (ms <= 0) return Promise.resolve();
        return new Promise((resolve, reject) =>
        {
            const done = () =>
            {
                signal?.removeEventListener('abort', cancel);
                resolve();
            };
            const cancel = () =>
            {
                clearTimeout(timer);
                reject(abortError());
            };
            const timer = setTimeout(done, ms);
            signal?.addEventListener('abort', cancel, { once: true });
        });
    }

    function urlFor(source, query, key, limit, language)
    {
        const url = new URL(endpoints[source]);
        if (source === 'geoapify')
        {
            url.searchParams.set('text', query);
            url.searchParams.set('format', 'json');
            url.searchParams.set('apiKey', key);
            url.searchParams.set('lang', language);
        }
        else
        {
            url.searchParams.set('key', key);
            url.searchParams.set('q', query);
            url.searchParams.set('accept-language', language);
        }
        url.searchParams.set('limit', String(limit));
        return url;
    }

    async function request(source, query, signal, limit, language)
    {
        if (signal?.aborted) throw abortError();
        const key = providerKey(source);
        if (!key) throw new Error('Geocoder not configured');
        const now = Date.now();
        if (now < cooldownUntil[source])
        {
            throw new Error('Geocoder temporarily unavailable');
        }

        const readyAt = Math.max(now, nextRequestAt[source]);
        nextRequestAt[source] = readyAt + limits[source];
        await wait(readyAt - Date.now(), signal);

        if (signal?.aborted) throw abortError();
        // Modern browsers can compose the user's cancellation and our
        // timeout without a second abort event/forwarding listener.
        // This avoids manufacturing a new AbortError inside forwardAbort.
        const nativeSignals = typeof AbortSignal.any === 'function'
            && typeof AbortSignal.timeout === 'function';
        let fallbackController = null;
        let forwardAbort = null;
        let watchdog = null;
        let requestSignal;
        if (nativeSignals)
        {
            const timeout = AbortSignal.timeout(timeoutMs);
            requestSignal = signal
                ? AbortSignal.any([signal, timeout])
                : timeout;
        }
        else
        {
            // Compatibility with older browsers lacking AbortSignal.any.
            fallbackController = new AbortController();
            forwardAbort = () => fallbackController.abort(signal?.reason);
            signal?.addEventListener('abort', forwardAbort, { once: true });
            if (signal?.aborted) fallbackController.abort(signal.reason);
            watchdog = setTimeout(() => fallbackController.abort(
                new DOMException('Provider request timed out', 'TimeoutError')
            ), timeoutMs);
            requestSignal = fallbackController.signal;
        }
        try
        {
            const response = await fetch(urlFor(source, query, key, limit, language), {
                signal: requestSignal,
                cache: 'no-store'
            });
            if (!response.ok)
            {
                if (response.status === 429 || response.status === 401 || response.status === 403)
                {
                    cooldownUntil[source] = Date.now() + 5 * 60 * 1000;
                }
                else if (response.status >= 500)
                {
                    cooldownUntil[source] = Date.now() + 30 * 1000;
                }
                throw new Error('Geocoder service error');
            }
            return normalizeResponse(await response.json(), source, limit);
        }
        catch (error)
        {
            if (signal?.aborted) throw abortError();
            if (error.name === 'AbortError' || error.name === 'TimeoutError'
                || error instanceof TypeError)
            {
                cooldownUntil[source] = Date.now() + 15 * 1000;
            }
            throw error;
        }
        finally
        {
            if (watchdog !== null) clearTimeout(watchdog);
            if (forwardAbort) signal?.removeEventListener('abort', forwardAbort);
        }
    }

    async function search(query, signal, limit = 5)
    {
        const text = cleanText(query).slice(0, maxQueryLength);
        if (signal?.aborted) throw abortError();
        if (!text) return [];

        const count = Math.max(1, Math.min(10, Number(limit) || 5));
        const language = typeof state !== 'undefined' && state.language === 'ru'
            ? 'ru' : 'en';
        let primaryError = null;
        try
        {
            const results = await request('geoapify', text, signal, count, language);
            if (results.length) return results;
        }
        catch (error)
        {
            if (signal?.aborted) throw abortError();
            primaryError = error;
        }

        if (signal?.aborted) throw abortError();
        try
        {
            return await request('locationiq', text, signal, count, language);
        }
        catch (error)
        {
            if (signal?.aborted) throw abortError();
            if (primaryError) throw new Error('Geocoding is temporarily unavailable');
            return []; // Primary succeeded with no matches; fallback was unavailable.
        }
    }

    function attributionHtml()
    {
        return '<span class="place-search-attribution">'
            + '<a href="https://www.geoapify.com/" target="_blank" rel="noopener noreferrer">'
            + 'Powered by Geoapify</a>'
            + ' · <a href="https://locationiq.com" target="_blank" rel="noopener noreferrer">'
            + 'Search by LocationIQ.com</a>'
            + '</span>';
    }

    return Object.freeze({ search, attributionHtml, normalizeResult, normalizeResponse });
})();
