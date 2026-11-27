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
    // Named, inhabited OSM places; administrative areas and localities are excluded.
    const settlementTypes = Object.freeze([
        'city', 'town', 'village', 'hamlet', 'isolated_dwelling', 'farm'
    ]);

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

    function settlementType(item, source)
    {
        if (!item || typeof item !== 'object') return '';
        if (source === 'geoapify')
        {
            const resultType = cleanText(item.result_type).toLowerCase();
            const rawPlace = cleanText(item.datasource?.raw?.place).toLowerCase();
            // Geoapify groups populated places under result_type=city.
            // Explicit OSM metadata must not contradict that classification.
            if (rawPlace && !settlementTypes.includes(rawPlace)) return '';
            if (resultType === 'city') return rawPlace || 'city';
            return (!resultType || resultType === 'unknown')
                && settlementTypes.includes(rawPlace) ? rawPlace : '';
        }
        if (source === 'locationiq'
            && cleanText(item.class).toLowerCase() === 'place')
        {
            const type = cleanText(item.type).toLowerCase();
            return settlementTypes.includes(type) ? type : '';
        }
        return '';
    }

    function settlementIdentities(item, source)
    {
        const ids = [];
        if (source === 'geoapify' && item.place_id)
            ids.push('geoapify:' + cleanText(item.place_id));

        const osm = source === 'geoapify' ? item.datasource?.raw : item;
        const osmType = cleanText(osm?.osm_type).toLowerCase();
        const osmId = cleanText(osm?.osm_id);
        if (osmType && osmId) ids.push('osm:' + osmType + ':' + osmId);
        return ids;
    }

    function sameSettlement(a, b)
    {
        if (a.identities.some(id => b.identities.includes(id))) return true;
        // A shared name alone is not proof of identity. The fallback requires
        // identical localized text, settlement type, context and nearby points.
        const key = value => cleanText(value).normalize('NFKC').toLowerCase();
        return a.type === b.type
            && key(a.result.primary) === key(b.result.primary)
            && key(a.result.rawContext) === key(b.result.rawContext)
            && key(a.result.context) === key(b.result.context)
            && Math.abs(a.result.coordinates.lat - b.result.coordinates.lat) < 0.0015
            && Math.abs(a.result.coordinates.lng - b.result.coordinates.lng) < 0.0015;
    }

    function normalizedAdminContext(item, source, primary, language)
    {
        const address = source === 'geoapify' ? item : item.address || {};
        const countryCode = cleanText(address.country_code).toUpperCase();
        let country = cleanText(address.country);
        if (countryCode && /^[A-Z]{2}$/.test(countryCode))
        {
            try { country = new Intl.DisplayNames([language], { type: 'region', fallback: 'none' }).of(countryCode) || country; }
            catch { /* retain provider name */ }
        }
        const region = cleanText(address.state || address.region);
        const regionCode = cleanText(address.state_code || address['ISO3166-2-lvl4']);
        const key = value => cleanText(value).normalize('NFKC').toLowerCase();
        // Poland: documented PL-18 (Podkarpackie); PK is the provider's
        // observed abbreviation. Scope the mapping to Poland and do not
        // guess names for unrelated codes or countries.
        const podkarpackie = /^(?:pk|pl-18|рк|podkarpackie(?: voivodeship)?|województwo podkarpackie|subcarpathian(?: voivodeship)?|подкарпатское воеводство)$/i;
        const mappedRegion = countryCode === 'PL' && (podkarpackie.test(region) || podkarpackie.test(regionCode))
            ? language === 'ru' ? 'Подкарпатское воеводство' : 'Subcarpathian Voivodeship' : region;
        const fallback = cleanText(source === 'geoapify' ? item.address_line2
            : item.display_address || cleanText(item.display_name).split(',').slice(1).join(', '));
        const postcode = key(address.postcode);
        const fallbackParts = fallback.split(',').map(cleanText).filter(value => value
            && key(value) !== postcode && !/^\d[\d\s-]*$/.test(value));
        const county = cleanText(address.county || address.district);
        const parts = [county, mappedRegion, country].filter(Boolean);
        // Keep useful provider context if structured fields are incomplete.
        // Only discard a provider code when the full corresponding field is known.
        if (!mappedRegion)
        {
            for (const part of fallbackParts)
            {
                if (key(part) === key(country) || key(part) === key(address.country)) continue;
                if (countryCode === 'PL' && podkarpackie.test(part))
                    parts.splice(Math.max(0, parts.length - Number(Boolean(country))), 0,
                        language === 'ru' ? 'Подкарпатское воеводство' : 'Subcarpathian Voivodeship');
                else if (!parts.some(value => key(value) === key(part)))
                    parts.splice(Math.max(0, parts.length - Number(Boolean(country))), 0, part);
            }
        }
        else
        {
            if (!county && country && fallbackParts.length > 2)
            {
                const extra = fallbackParts.slice(0, -2).filter(part =>
                    ![primary, mappedRegion, region, regionCode, country, address.country].some(value => key(value) === key(part))
                    && !(countryCode === 'PL' && podkarpackie.test(part)));
                parts.unshift(...extra);
            }
            if (!country && fallbackParts.length) parts.push(fallbackParts.at(-1));
        }
        const seen = new Set([key(primary)]);
        return parts.filter(value =>
        {
            const normalized = key(value);
            if (!normalized || seen.has(normalized)) return false;
            seen.add(normalized);
            return true;
        }).join(', ');
    }

    function normalizeResult(item, index, source, language = 'en')
    {
        if (!settlementType(item, source)) return null;
        if (item?.lat == null || item?.lon == null || cleanText(item.lat) === '' || cleanText(item.lon) === '') return null;
        const lat = Number(item.lat);
        const lng = Number(item.lon);
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

        const rawContext = context;
        context = normalizedAdminContext(item, source, primary, language);
        name = [primary, context].filter(Boolean).join(', ') || name;
        if (!name) return null;
        return {
            id: 'map-result-' + index,
            kind: 'map',
            name,
            primary: primary || name,
            context,
            rawContext,
            coordinates: { lat, lng }
        };
    }

    function normalizeResponse(json, source, limit, language = 'en')
    {
        const items = source === 'geoapify' ? json?.results : json;
        if (!Array.isArray(items)) throw new Error('Invalid geocoding response');
        const results = [];
        const accepted = [];
        for (const item of items)
        {
            const type = settlementType(item, source);
            if (!type) continue;
            const result = normalizeResult(item, results.length, source, language);
            if (!result) continue;
            const candidate = {
                type, result, identities: settlementIdentities(item, source)
            };
            if (accepted.some(previous => sameSettlement(previous, candidate)))
                continue;
            accepted.push(candidate);
            results.push(result);
            if (results.length >= limit) break;
        }
        return results;
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
            url.searchParams.set('type', 'city');
        }
        else
        {
            url.searchParams.set('key', key);
            url.searchParams.set('q', query);
            url.searchParams.set('accept-language', language);
            url.searchParams.set('tag', settlementTypes
                .map(type => 'place:' + type).join(','));
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
            // Request a bounded candidate pool once; filter and deduplicate
            // before applying the requested display limit.
            const candidateLimit = Math.min(20, Math.max(10, limit * 3));
            const response = await fetch(urlFor(source, query, key, candidateLimit, language), {
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
            return normalizeResponse(await response.json(), source, limit, language);
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
