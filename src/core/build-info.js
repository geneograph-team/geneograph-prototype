// Normalize the embedded artifact identity once for About and Diagnostics.
const geneographBuildInfo = (() =>
{
    const raw = globalThis.GENEOGRAPH_BUILD_DATA;
    const unknown = Object.freeze({ version: null, revision: null, shortRevision: null,
        tag: null, distance: null, channel: 'local' });
    if (!raw || typeof raw.revision !== 'string' ||
        !/^(?:[0-9a-f]{40}|[0-9a-f]{64})$/.test(raw.revision)) return unknown;

    const tagged = typeof raw.tag === 'string' &&
        /^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(raw.tag) &&
        Number.isSafeInteger(raw.distance) && raw.distance >= 0;
    if (!tagged && (raw.tag !== null || raw.distance !== null)) return unknown;

    const revision = raw.revision;
    const tag = tagged ? raw.tag : null;
    const distance = tagged ? raw.distance : null;
    const version = tag ? tag.slice(1) + (distance ? '-dev.' + distance : '') : null;
    return Object.freeze({ version, revision, shortRevision: revision.slice(0, 7),
        tag, distance, channel: tag && distance === 0 ? 'release' : 'development' });
})();
