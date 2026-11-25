// Session-local portrait derivatives. A consumer holds a lease until it clears its image.
const portraitThumbnailLimits = Object.freeze({
    tiers: [128, 256, 512],
    entries: 200,
    encodedBytes: 24 * 1024 * 1024,
    decodedBytes: 48 * 1024 * 1024,
    sourcePixels: 16 * 1024 * 1024,
    concurrent: 2
});

let portraitThumbnailJobs = 0;
const portraitThumbnailSchedulers = new Set();

function portraitThumbnailTier(size, dpr = window.devicePixelRatio || 1)
{
    return portraitThumbnailLimits.tiers.find(tier => tier >= size * dpr) || 512;
}

function portraitThumbnailSource(photo)
{
    const source = typeof photo?.src === 'string' ? photo.src.trim() : '';
    if (!source) return '';
    if (/^(data:image\/|blob:)/i.test(source)) return source;
    const url = new URL(source, document.baseURI);
    if (url.protocol === 'file:' && location.protocol === 'file:')
        return url.href.startsWith(new URL('.', document.baseURI).href) ? url.href : '';
    return /^https?:$/.test(url.protocol) && url.origin === location.origin ? url.href : '';
}

async function generatePortraitThumbnail({ source, crop, region, aspect, tier, sourcePixels })
{
    if (sourcePixels > portraitThumbnailLimits.sourcePixels) throw new Error('Portrait source exceeds decode budget');
    const image = new Image();
    image.decoding = 'async';
    try
    {
        image.src = source;
        await image.decode();
        const iw = image.naturalWidth, ih = image.naturalHeight;
        if (!iw || !ih || iw * ih > portraitThumbnailLimits.sourcePixels)
            throw new Error('Portrait source exceeds decode budget');

        const turns = !region && (crop.rotation === 90 || crop.rotation === 270);
        const unitWidth = Math.min(1, aspect), unitHeight = Math.min(1, 1 / aspect);
        const fitWidth = turns ? unitHeight : unitWidth;
        const fitHeight = turns ? unitWidth : unitHeight;
        const scale = region
            ? Math.max(unitWidth / (region.width * iw), unitHeight / (region.height * ih))
            : Math.max(fitWidth / iw, fitHeight / ih) * crop.zoom;
        const edge = Math.min(tier, Math.max(1, Math.floor(1 / scale)));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(unitWidth * edge));
        canvas.height = Math.max(1, Math.round(unitHeight * edge));
        try
        {
            const ctx = canvas.getContext('2d', { alpha: true });
            ctx.scale(canvas.width / unitWidth, canvas.height / unitHeight);
            ctx.translate(unitWidth / 2, unitHeight / 2);
            if (region)
            {
                ctx.drawImage(image, -(region.x + region.width / 2) * iw * scale,
                    -(region.y + region.height / 2) * ih * scale, iw * scale, ih * scale);
            }
            else
            {
                ctx.translate((.5 - crop.centerX) * unitWidth, (.5 - crop.centerY) * unitHeight);
                ctx.rotate(crop.rotation * Math.PI / 180);
                ctx.beginPath();
                ctx.rect(-fitWidth * crop.zoom / 2, -fitHeight * crop.zoom / 2,
                    fitWidth * crop.zoom, fitHeight * crop.zoom);
                ctx.clip();
                ctx.drawImage(image, -iw * scale / 2, -ih * scale / 2, iw * scale, ih * scale);
            }
            const bytes = canvas.width * canvas.height * 4;
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/webp', .88));
            if (!blob) throw new Error('Portrait encode failed');
            return { blob, bytes };
        }
        finally { canvas.width = canvas.height = 0; }
    }
    finally { image.removeAttribute('src'); }
}

function createPortraitThumbnailCache(generate = generatePortraitThumbnail)
{
    const limits = portraitThumbnailLimits;
    const entries = new Map();
    const stats = { hits: 0, misses: 0, jobs: 0, failures: 0, encoded: 0, decoded: 0, revoked: 0 };
    let disposed = false;

    function remove(entry)
    {
        if (entries.get(entry.key) !== entry) return;
        entries.delete(entry.key);
        if (entry.url)
        {
            URL.revokeObjectURL(entry.url);
            stats.revoked++;
        }
        stats.encoded -= entry.encoded || 0;
        stats.decoded -= entry.decoded || 0;
    }

    function makeRoom(count, encoded, decoded, except)
    {
        while (entries.size + count > limits.entries || stats.encoded + encoded > limits.encodedBytes
            || stats.decoded + decoded > limits.decodedBytes)
        {
            const oldest = [...entries.values()].find(entry => entry !== except && !entry.listeners.size && !entry.running);
            if (!oldest) return false;
            remove(oldest);
        }
        return true;
    }

    function pump()
    {
        while (!disposed && portraitThumbnailJobs < limits.concurrent)
        {
            const entry = [...entries.values()].find(item => item.request && !item.running);
            if (!entry) break;
            entry.running = true;
            portraitThumbnailJobs++;
            stats.jobs++;
            Promise.resolve().then(() => generate(entry.request)).then(result =>
            {
                if (disposed || !entry.listeners.size)
                {
                    remove(entry);
                    return;
                }
                if (!makeRoom(0, result.blob.size, result.bytes, entry))
                {
                    remove(entry);
                    return;
                }
                entry.url = URL.createObjectURL(result.blob);
                stats.encoded += entry.encoded = result.blob.size;
                stats.decoded += entry.decoded = result.bytes;
                entry.listeners.forEach(listener => listener(entry.url));
            }).catch(() =>
            {
                stats.failures++;
                if (disposed) remove(entry);
            }).finally(() =>
            {
                entry.running = false;
                entry.request = null;
                portraitThumbnailJobs--;
                portraitThumbnailSchedulers.forEach(schedule => schedule());
            });
        }
    }

    portraitThumbnailSchedulers.add(pump);
    return {
        stats,
        entries,
        subscribe(key, request, listener)
        {
            let entry = entries.get(key);
            if (disposed) return () => {};
            if (entry)
            {
                stats.hits++;
                entries.delete(key);
                entries.set(key, entry);
            }
            else
            {
                if (!makeRoom(1, 0, 0)) return null;
                stats.misses++;
                entry = { key, request, listeners: new Set() };
                entries.set(key, entry);
            }
            entry.listeners.add(listener);
            if (entry.url) listener(entry.url);
            pump();
            return () =>
            {
                entry.listeners.delete(listener);
                if (!entry.listeners.size && entry.request && !entry.running) remove(entry);
            };
        },
        dispose()
        {
            disposed = true;
            portraitThumbnailSchedulers.delete(pump);
            for (const entry of entries.values())
            {
                entry.listeners.clear();
                remove(entry);
            }
        }
    };
}
