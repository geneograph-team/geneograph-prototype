const GEDCOM_IMPORT_LIMITS = Object.freeze({
    bytes: 64 * 1024 * 1024,
    lines: 600000,
    lineLength: 4096,
    records: 30000,
    depth: 32,
    parseMilliseconds: 5000
});

class GedcomImportError extends Error
{
    constructor(message, line = null)
    {
        super(message);
        this.line = line;
    }
}

// Some exporters split a UTF-8 character across physical CONC lines.
function repairGedcomConcBytes(bytes)
{
    const source = new Uint8Array(bytes.buffer || bytes, bytes.byteOffset || 0, bytes.byteLength);
    const continuations = /(?:\r\n|\r|\n)[1-9][0-9]? +CONC /g;
    const byteText = new TextDecoder('windows-1252').decode(source);
    let repaired = null;
    for (const match of byteText.matchAll(continuations))
    {
        const boundary = match.index;
        const payload = boundary + match[0].length;
        let start = boundary - 1;
        while (start > boundary - 3 && (source[start] & 0xc0) === 0x80) start--;
        const lead = source[start];
        const width = lead >= 0xc2 && lead <= 0xdf ? 2
            : lead >= 0xe0 && lead <= 0xef ? 3
                : lead >= 0xf0 && lead <= 0xf4 ? 4 : 0;
        const missing = width - (boundary - start);
        if (missing <= 0 || payload + missing > source.length
            || !source.subarray(payload, payload + missing).every(byte => (byte & 0xc0) === 0x80)) continue;
        repaired ||= source.slice();
        repaired.copyWithin(boundary + missing, boundary, payload);
        repaired.set(source.subarray(payload, payload + missing), boundary);
    }
    return repaired;
}

function decodeGedcomImport(bytes)
{
    if (!bytes.byteLength || bytes.byteLength > GEDCOM_IMPORT_LIMITS.bytes)
        throw new GedcomImportError('Choose a nonempty GEDCOM file up to 64 MiB.');
    const decoder = new TextDecoder('utf-8', { fatal: true });
    try { return decoder.decode(bytes); }
    catch
    {
        const repaired = repairGedcomConcBytes(bytes);
        if (repaired)
        {
            try { return decoder.decode(repaired); }
            catch { /* Reject any remaining malformed UTF-8. */ }
        }
        throw new GedcomImportError('The GEDCOM file must use valid UTF-8 encoding.');
    }
}

function parseGedcomImport(...args)
{
    if (typeof appPerf === 'undefined' || !appPerf.enabled('Projects')) return parseGedcomImportWithDiagnosticsBody(...args);
    return appPerf.run('Projects', 'gedcomParse', () => parseGedcomImportWithDiagnosticsBody(...args));
}

function parseGedcomImportWithDiagnosticsBody(text)
{
    const limits = GEDCOM_IMPORT_LIMITS;
    const started = performance.now();
    const roots = [];
    const xrefs = new Map();
    const stack = [];
    const lines = text.split(/\r\n|\r|\n/);
    if (lines.length > limits.lines)
        throw new GedcomImportError('The GEDCOM file contains too many lines.');
    for (const [index, raw] of lines.entries())
    {
        const line = index + 1;
        if (index % 256 === 0 && performance.now() - started > limits.parseMilliseconds)
            throw new GedcomImportError('The GEDCOM file took too long to parse.');
        if (raw === '' && index === lines.length - 1) continue;
        if (raw.length > limits.lineLength)
            throw new GedcomImportError('A GEDCOM line is too long.', line);
        const match = /^(0|[1-9][0-9]?) +(?:(@[^@\s]+@) +)?([A-Z_][A-Z0-9_]*)(?:( +)(.*))?$/.exec(raw);
        if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufeff]/.test(raw))
            throw new GedcomImportError('Malformed GEDCOM line.', line);
        if (!match)
        {
            // Some exported NOTE values contain literal newlines without CONT.
            const previous = stack.at(-1);
            const note = previous?.tag === 'NOTE' ? previous
                : ['CONC', 'CONT'].includes(previous?.tag) && stack.at(-2)?.tag === 'NOTE' ? stack.at(-2) : null;
            if (!note || /^\s*\d/.test(raw))
                throw new GedcomImportError('Malformed GEDCOM line.', line);
            note.children.push({ tag: 'CONT', value: raw, line, xref: '', children: [] });
            continue;
        }
        const level = Number(match[1]);
        const [, , xref, tag, separator = '', payload = ''] = match;
        const value = ['NOTE', 'TEXT', 'DSCR', 'CONT', 'CONC'].includes(tag) ? separator.slice(1) + payload : payload;
        if (level > limits.depth || level > stack.length || (level && xref))
            throw new GedcomImportError('Invalid GEDCOM hierarchy.', line);
        if (!level && roots.length >= limits.records)
            throw new GedcomImportError('The GEDCOM file contains too many records.', line);
        const node = { tag, value, line, xref: xref || '', children: [] };
        if (xref)
        {
            if (xrefs.has(xref)) throw new GedcomImportError('Duplicate GEDCOM record ID.', line);
            xrefs.set(xref, node);
        }
        if (level) stack[level - 1].children.push(node);
        else roots.push(node);
        stack.length = level;
        stack.push(node);
    }

    const head = roots[0];
    const trailer = roots.at(-1);
    if (head?.tag !== 'HEAD' || trailer?.tag !== 'TRLR' || head.xref || trailer.xref
        || head.value || trailer.value || trailer.children.length
        || roots.slice(1, -1).some(record => ['HEAD', 'TRLR'].includes(record.tag)))
        throw new GedcomImportError('GEDCOM must contain one header and one final trailer.');
    const one = (parent, tag) =>
    {
        const children = parent?.children.filter(node => node.tag === tag) || [];
        if (children.length !== 1)
            throw new GedcomImportError('The GEDCOM header is incomplete or ambiguous.', parent?.line);
        return children[0];
    };
    const version = one(one(head, 'GEDC'), 'VERS').value.trim();
    if (version !== '5.5.1')
        throw new GedcomImportError('Only GEDCOM version 5.5.1 is supported.');
    if (one(head, 'CHAR').value.trim().toUpperCase() !== 'UTF-8')
        throw new GedcomImportError('The GEDCOM header must declare UTF-8 encoding.');
    for (const record of roots)
        if (['INDI', 'FAM'].includes(record.tag) && !record.xref)
            throw new GedcomImportError('A person or family record is missing its GEDCOM ID.', record.line);
    const exporter = head.children.find(node => node.tag === 'SOUR')?.value.trim().toUpperCase() || '';
    return { roots: roots.slice(1, -1), xrefs, version, exporter };
}


function parseGedcomDate(text)
{
    const splitCalendar = date =>
    {
        const marker = /^@#D([^@]+)@\s*/i.exec(date);
        return marker ? [date.slice(marker[0].length), marker[1].toUpperCase()] : [date, ''];
    };
    const russianMonths = {
        янв: 'JAN', фев: 'FEB', мар: 'MAR', апр: 'APR', май: 'MAY', мая: 'MAY', июн: 'JUN',
        июл: 'JUL', авг: 'AUG', сен: 'SEP', сент: 'SEP', окт: 'OCT', ноя: 'NOV', дек: 'DEC'
    };
    const normalizeDate = value => value
        .replace(/(^|\s)(?:приблизительно|примерно)(?:\s*:\s*|\s+)(?:в\s+)?(?=\d)/gi, '$1ABT ')
        .replace(/(^|\s)(янв|фев|мар|апр|май|мая|июн|июл|авг|сент?|окт|ноя|дек)\.?(?=\s|$)/gi,
            (_, prefix, month) => prefix + russianMonths[month.toLowerCase()]);
    const [value, outerCalendar] = splitCalendar(normalizeDate(text));
    const range = /^BET\s+(.+?)\s+AND\s+(.+)$/i.exec(value);
    const qualified = /^(ABT|EST|BEF|AFT|CAL|INT)\s+(.+)$/i.exec(value);
    const types = { ABT: 'About / Circa', EST: 'About / Circa', BEF: 'Before', AFT: 'After', CAL: 'Calculated', INT: 'Calculated' };
    const type = range ? 'Between' : qualified ? types[qualified[1].toUpperCase()] : 'Exact date';
    let firstText = range?.[1] || qualified?.[2] || value;
    if (qualified?.[1].toUpperCase() === 'INT') firstText = firstText.replace(/\s*\(.*\)\s*$/, '');
    const [first, firstCalendar] = splitCalendar(firstText);
    const [second, secondCalendar] = splitCalendar(range?.[2] || '');
    const calendars = new Set([outerCalendar, firstCalendar, secondCalendar].filter(Boolean));
    const code = calendars.values().next().value || 'GREGORIAN';
    if (calendars.size > 1 || !['GREGORIAN', 'JULIAN'].includes(code) || !first || (range && !second))
        return { valid: false };
    const calendar = code === 'JULIAN' ? 'Julian' : 'Gregorian';
    const rangeEndpoint = date => date.replace(/^ABT\s+/i, '');
    const result = parseGenealogyDateTextAsType(range ? rangeEndpoint(first) : first, type,
        { calendar, date2: range ? rangeEndpoint(second) : second });
    if (result.valid) result.value.originalText = text;
    return result;
}

function parseGedcomPeriod(text)
{
    const from = /^FROM\s+(.+?)(?:\s+TO\s+(.+))?$/i.exec(text);
    const to = /^TO\s+(.+)$/i.exec(text);
    if (!from && !to) return null;
    const start = from ? parseGedcomDate(from[1]) : null;
    const endText = from?.[2] || to?.[1];
    const end = endText ? parseGedcomDate(endText) : null;
    if ((start && (!start.valid || start.value.state !== 'known'))
        || (end && (!end.valid || end.value.state !== 'known'))) return null;
    return { fromDate: start?.value || null, toDate: end?.value || null };
}

function gedcomLocalAttachmentPath(value)
{
    let path = value.trim().replaceAll(String.fromCharCode(92), '/');
    if (/^file:\/\//i.test(path))
    {
        try { path = decodeURIComponent(path.slice(7)); }
        catch { return ''; }
    }
    path = path.replace(/^\/*[a-z]:\//i, '').replace(/^\/+/, '');
    const parts = path.split('/').filter(part => part && part !== '.');
    return parts.every(part => part !== '..' && !/[:\u0000-\u001f]/.test(part)) ? parts.join('/') : '';
}

function gedcomObjectFileLinks(node, parsed)
{
    return node.children.filter(child => child.tag === 'OBJE').flatMap(object =>
    {
        const record = parsed.xrefs.get(object.value.trim()) || object;
        if (record.tag !== 'OBJE') return [];
        return record.children.filter(child => child.tag === 'FILE').map(file => ({
            object, record, file, path: gedcomLocalAttachmentPath(file.value)
        }));
    });
}

function gedcomAttachmentReferences(parsed, online = false)
{
    const references = new Map();
    if (online && parsed.exporter !== 'MYHERITAGE') return references;
    function visit(node, owner)
    {
        for (const link of gedcomObjectFileLinks(node, parsed))
        {
            const value = link.file.value.trim();
            if (!value) continue;
            const remote = /^[a-z][a-z\d+.-]*:\/\//i.test(value) && !/^file:/i.test(value);
            if (online !== remote) continue;
            if (online)
            {
                let url;
                try { url = new URL(value); }
                catch { continue; }
                if (url.origin !== 'https://sites-cf.mhcache.com'
                    || url.username || url.password) continue;
            }
            const path = link.path;
            const key = online ? value : (path || value).normalize('NFC').toLowerCase();
            const entry = references.get(key) || { path, value, links: [] };
            entry.links.push({ ...link, owner, node });
            references.set(key, entry);
        }
        for (const child of node.children)
            if (child.tag !== 'OBJE') visit(child, owner);
    }
    for (const node of parsed.roots)
        if (node.tag !== 'OBJE') visit(node, node);
    return references;
}

const GEDCOM_ATTACHMENT_LIMIT = 500;
const GEDCOM_ATTACHMENT_BYTES = 80 * 1024 * 1024;

function gedcomAttachmentUsage(matches)
{
    const files = new Set([...matches.values()].filter(item => item.status === 'Ready to import').map(item => item.file));
    return { count: files.size, bytes: [...files].reduce((total, file) => total + file.size, 0) };
}

async function matchGedcomAttachments(references, folderFiles, current, reserved = new Map())
{
    const normalize = value => value.normalize('NFC').toLowerCase();
    const paths = new Map();
    const names = new Map();
    const index = (map, key, file) =>
    {
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(file);
    };
    for (const file of folderFiles)
    {
        const path = gedcomLocalAttachmentPath(file.webkitRelativePath || '');
        if (!path.includes('/')) continue;
        index(paths, normalize(path.slice(path.indexOf('/') + 1)), file);
        index(names, normalize(file.name), file);
    }
    const matches = new Map();
    const loaded = new Map();
    let { bytes, count: importedCount } = gedcomAttachmentUsage(reserved);
    for (const [key, reference] of references)
    {
        if (!current()) break;
        const path = normalize(reference.path);
        const basename = path.split('/').at(-1);
        const byName = names.get(basename) || [];
        const suffix = byName.filter(file => normalize(file.webkitRelativePath).endsWith('/' + path));
        const candidates = paths.get(path) || (suffix.length ? suffix : byName);
        const file = candidates.length === 1 ? candidates[0] : null;
        const extension = /\.([a-z0-9]{1,12})$/i.exec(reference.value)?.[1];
        const entry = { ...reference, extension, found: Boolean(file), file };
        matches.set(key, entry);
        if (!path) entry.status = 'Unsafe file path';
        else if (!candidates.length) entry.status = 'File not found';
        else if (!file) entry.status = 'More than one file matches';
        else if (loaded.has(file)) Object.assign(entry, loaded.get(file));
        else
        {
            const format = archiveDocumentExtension(file.name);
            try
            {
                if (!archiveImageExtensions.has(format) && !archiveDocumentExtensions.has(format))
                    entry.status = 'Unsupported file type';
                else if (!file.size) entry.status = 'File could not be read';
                else if (file.size > (archiveImageExtensions.has(format) ? PHOTO_UPLOAD_MAX_BYTES : archiveDocumentMaxBytes)
                    || importedCount >= GEDCOM_ATTACHMENT_LIMIT || bytes + file.size > GEDCOM_ATTACHMENT_BYTES)
                    entry.status = 'Attachment size or count limit exceeded';
                else
                {
                    const buffer = await file.arrayBuffer();
                    if (!current()) break;
                    if (archiveImageExtensions.has(format))
                    {
                        const mimeType = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' }[format];
                        entry.photo = await createPhotoUploadDraft(file.slice(0, file.size, mimeType));
                        entry.photo.filename = file.name;
                    }
                    else
                    {
                        const blob = new Blob([buffer], { type: file.type });
                        await archiveValidateDocument(format, buffer);
                        entry.blob = blob;
                    }
                    entry.status = 'Ready to import';
                    bytes += file.size;
                    importedCount++;
                }
            }
            catch { entry.status = 'File could not be read'; }
            loaded.set(file, { status: entry.status, photo: entry.photo, blob: entry.blob });
        }
    }
    return matches;
}

async function downloadGedcomPhotos(references, localMatches, signal, onProgress)
{
    const matches = new Map();
    let { bytes, count } = gedcomAttachmentUsage(localMatches);
    const extensions = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
    for (const [key, reference] of references)
    {
        if (signal.aborted) break;
        const entry = { ...reference, found: false, status: 'Linked photo could not be downloaded' };
        matches.set(key, entry);
        try
        {
            const maxBytes = Math.min(PHOTO_UPLOAD_MAX_BYTES, GEDCOM_ATTACHMENT_BYTES - bytes);
            if (count >= GEDCOM_ATTACHMENT_LIMIT || maxBytes <= 0)
            {
                entry.status = 'Attachment size or count limit exceeded';
                continue;
            }
            const response = await fetch(key, { mode: 'cors', credentials: 'omit', redirect: 'error',
                referrerPolicy: 'no-referrer', signal: AbortSignal.any([signal, AbortSignal.timeout(10000)]) });
            if (!response.ok || !response.body) continue;
            entry.found = true;
            const type = response.headers.get('content-type')?.split(';')[0].trim().toLowerCase();
            const extension = extensions[type];
            const reader = response.body.getReader();
            try
            {
                if (!Object.hasOwn(extensions, type))
                {
                    entry.status = 'Unsupported file type';
                    continue;
                }
                const chunks = [];
                let size = 0;
                while (true)
                {
                    const { done, value } = await reader.read();
                    if (done) break;
                    size += value.byteLength;
                    if (size > maxBytes) break;
                    chunks.push(value);
                }
                if (size > maxBytes)
                {
                    entry.status = 'Attachment size or count limit exceeded';
                    continue;
                }
                const basename = new URL(key).pathname.split('/').at(-1);
                const safeName = basename?.replace(/[^a-z0-9._-]/gi, '').slice(-120) || 'Photo-' + matches.size;
                const filename = safeName.toLowerCase().endsWith('.' + extension) ? safeName : safeName + '.' + extension;
                const file = new File(chunks, filename, { type });
                entry.photo = await createPhotoUploadDraft(file);
                entry.file = file;
                entry.extension = extension;
                entry.status = 'Ready to import';
                bytes += file.size;
                count++;
            }
            finally { await reader.cancel().catch(() => {}); }
        }
        catch { /* Unreadable or unavailable images do not block the genealogy. */ }
        finally { if (!signal.aborted) onProgress(matches.size); }
    }
    return matches;
}

// Imported HTML is never inserted into a document or passed to Quill's HTML
// clipboard. Only text and a small allowlist of canonical Delta attributes
// are emitted. Decode entities after tokenization, never as executable markup.
function gedcomPlainContent(body)
{
    return { body, ops: null, simplified: false };
}

function gedcomDecodeHtmlEntities(value, onUnknown)
{
    const named = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: '\u00a0',
        ensp: '\u2002', emsp: '\u2003', ndash: '–', mdash: '—', hellip: '…',
        lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”', laquo: '«', raquo: '»',
        bull: '•', copy: '©', reg: '®', trade: '™', euro: '€' };
    let decoder;
    return value.replace(/&(#(?:x[0-9a-f]+|\d+)|[a-z][a-z0-9]*);/gi, (entity, name) =>
    {
        if (name[0] === '#')
        {
            const hex = name[1]?.toLowerCase() === 'x';
            const code = parseInt(name.slice(hex ? 2 : 1), hex ? 16 : 10);
            if (code > 0 && code <= 0x10ffff && !(code >= 0xd800 && code <= 0xdfff)
                && !(code < 32 && ![9, 10, 13].includes(code))) return String.fromCodePoint(code);
            onUnknown();
            return '\ufffd';
        }
        if (Object.hasOwn(named, name)) return named[name];
        // Decode only this isolated, syntactically checked entity, not HTML.
        if (typeof document !== 'undefined' && typeof document.createElement === 'function')
        {
            decoder ||= document.createElement('textarea');
            decoder.innerHTML = entity;
            if (decoder.value !== entity) return decoder.value;
        }
        onUnknown();
        return entity;
    });
}

function gedcomSafeHtmlLink(value)
{
    if (!value || /[\s\u0000-\u001f\u007f]/.test(value)) return '';
    try
    {
        const url = new URL(value);
        return ['https:', 'http:', 'mailto:'].includes(url.protocol) && !url.username && !url.password ? value : '';
    }
    catch { return ''; }
}

function gedcomRichContent(value, checkDeadline = () => {})
{
    // Treat comparisons, unknown angle-bracket placeholders and unmatched
    // inline examples as literal plain text, not as a markup document.
    const opening = /<(p|div|span|strong|b|i|em|u|s|strike|del|a|ul|ol|li|blockquote|h[1-6]|table|tr|td|th|pre|font)(?=[\s>])/i;
    const closing = /<\/(?:p|div|span|strong|b|i|em|u|s|strike|del|a|ul|ol|li|blockquote|h[1-6]|table|tr|td|th|pre|font)\s*>/i;
    const blockStart = /^\s*<(?:p|div|ul|ol|li|blockquote|h[1-6]|table|pre|html|body)(?=[\s>])/i;
    const special = /<(?:br|hr|img|script|style|iframe|object|embed|svg|math|link|meta|video|audio|input|form|template)(?=[\s/>])/i;
    if (!(opening.test(value) && closing.test(value)) && !blockStart.test(value) && !special.test(value))
        return gedcomPlainContent(value);

    const inline = { b: 'bold', strong: 'bold', i: 'italic', em: 'italic', u: 'underline',
        s: 'strike', strike: 'strike', del: 'strike' };
    const blocks = new Set(['p', 'div', 'li', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'table', 'tr', 'td', 'th', 'pre']);
    const wrappers = new Set(['span', 'a', 'font', 'html', 'body', 'tbody', 'thead', 'tfoot']);
    const suppressed = new Set(['script', 'style', 'iframe', 'object', 'svg', 'math', 'template',
        'video', 'audio', 'head', 'noscript']);
    const voidTags = new Set(['br', 'hr', 'img', 'embed', 'link', 'meta', 'input', 'source', 'wbr', 'area', 'base', 'col', 'param']);
    const stack = [], lines = [];
    let current = [], pendingSpace = false, simplified = false, ignored = null;
    const mark = () => { simplified = true; };
    const attrsEqual = (a, b) => JSON.stringify(a || {}) === JSON.stringify(b || {});
    const append = (insert, attributes = {}) =>
    {
        if (!insert) return;
        const last = current.at(-1);
        if (last && attrsEqual(last.attributes, attributes)) last.insert += insert;
        else current.push(Object.keys(attributes).length ? { insert, attributes } : { insert });
    };
    const lineAttributes = () =>
    {
        const result = {};
        const list = stack.filter(frame => ['ul', 'ol'].includes(frame.tag));
        if (stack.some(frame => frame.tag === 'li') && list.length)
        {
            result.list = list.at(-1).tag === 'ol' ? 'ordered' : 'bullet';
            if (list.length > 1) result.indent = Math.min(8, list.length - 1);
            if (list.length > 9) mark();
        }
        else if (stack.some(frame => frame.tag === 'blockquote')) result.blockquote = true;
        else
        {
            const heading = stack.findLast(frame => /^h[1-6]$/.test(frame.tag));
            if (heading) result.header = heading.tag === 'h1' || heading.tag === 'h2' ? 2 : 3;
        }
        return result;
    };
    const flush = (force = false) =>
    {
        if (current.length || force) lines.push({ ops: current, attributes: lineAttributes() });
        current = [];
        pendingSpace = false;
    };
    const text = raw =>
    {
        if (!raw || ignored) return;
        if (/<\/?(?:p|div|span|strong|b|i|em|u|a|li|ul|ol|br|script|style|iframe|img)(?=[\s/>])/i.test(raw)) mark();
        const decoded = gedcomDecodeHtmlEntities(raw, mark).replace(/\u00a0/g, ' ');
        const attributes = Object.assign({}, ...stack.map(frame => frame.attributes));
        if (stack.some(frame => frame.tag === 'pre'))
        {
            const parts = decoded.replace(/\r\n?/g, '\n').split('\n');
            for (const [index, part] of parts.entries())
            {
                if (index) flush(true);
                append(part, attributes);
            }
            return;
        }
        const collapsed = decoded.replace(/[ \t\r\n\f]+/g, ' ');
        const trimmed = collapsed.trim();
        if (trimmed)
        {
            if (current.length && (pendingSpace || collapsed.startsWith(' '))) append(' ', attributes);
            append(trimmed, attributes);
            pendingSpace = collapsed.endsWith(' ');
        }
        else if (collapsed && current.length) pendingSpace = true;
    };
    const readAttributes = raw =>
    {
        const attributes = new Map();
        for (const match of raw.matchAll(/([^\s=/"'<>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>]+)))?/g))
            attributes.set(match[1].toLowerCase(), gedcomDecodeHtmlEntities(match[2] ?? match[3] ?? match[4] ?? '', mark));
        return attributes;
    };
    // The tokenizer is quote-aware; tag payloads are never evaluated.
    const tokens = /<!--[\s\S]*?(?:-->|$)|<!DOCTYPE[^>]*>|<\/?[a-z][\w:-]*(?=[\s/>])(?:"[^"]*"|'[^']*'|[^"'<>])*?>/gi;
    let offset = 0;
    for (const match of value.matchAll(tokens))
    {
        checkDeadline();
        text(value.slice(offset, match.index));
        offset = match.index + match[0].length;
        const raw = match[0];
        if (raw.startsWith('<!')) { mark(); continue; }
        const tagMatch = /^<(\/?)([a-z][\w:-]*)/i.exec(raw);
        const closing = Boolean(tagMatch[1]);
        const tag = tagMatch[2].toLowerCase();
        if (ignored)
        {
            if (tag === ignored.tag)
            {
                if (closing && --ignored.depth === 0) ignored = null;
                else if (!closing && !/\/>$/.test(raw)) ignored.depth++;
            }
            continue;
        }
        if (suppressed.has(tag))
        {
            mark();
            if (!closing && !/\/>$/.test(raw)) ignored = { tag, depth: 1 };
            continue;
        }
        if (tag === 'br' || tag === 'hr')
        {
            if (tag === 'hr') mark();
            if (!closing) flush(true);
            continue;
        }
        if (voidTags.has(tag)) { mark(); continue; }
        if (closing)
        {
            const index = stack.findLastIndex(frame => frame.tag === tag);
            if (index < 0) { mark(); continue; }
            if (index !== stack.length - 1) mark();
            if (blocks.has(tag)) flush();
            stack.length = index;
            continue;
        }
        if (blocks.has(tag)) flush();
        if (stack.length >= 64) { mark(); continue; }
        if (!blocks.has(tag) && !wrappers.has(tag) && !Object.hasOwn(inline, tag)) mark();
        if (['table', 'tr', 'td', 'th', 'pre', 'font', 'h1', 'h4', 'h5', 'h6'].includes(tag)) mark();
        const attributes = {};
        if (Object.hasOwn(inline, tag)) attributes[inline[tag]] = true;
        const rawAttributes = readAttributes(raw.slice(tagMatch[0].length, -1));
        for (const [name, attr] of rawAttributes)
        {
            if (name === 'href' && tag === 'a')
            {
                const link = gedcomSafeHtmlLink(attr.trim());
                if (link) attributes.link = link;
                else mark();
            }
            else if (name === 'style')
            {
                for (const declaration of attr.split(';'))
                {
                    const colon = declaration.indexOf(':');
                    if (colon < 0) { if (declaration.trim()) mark(); continue; }
                    const key = declaration.slice(0, colon).trim().toLowerCase();
                    const val = declaration.slice(colon + 1).trim().toLowerCase();
                    if (key === 'font-weight' && /^(?:bold|[6-9]00)$/.test(val)) attributes.bold = true;
                    else if (key === 'font-style' && /^(?:italic|oblique)$/.test(val)) attributes.italic = true;
                    else if (key === 'text-decoration' || key === 'text-decoration-line')
                    {
                        if (/\bunderline\b/.test(val)) attributes.underline = true;
                        if (/\bline-through\b/.test(val)) attributes.strike = true;
                        if (!/^(?:underline|line-through)(?:\s+(?:underline|line-through))*$/.test(val)) mark();
                    }
                    else mark();
                }
            }
            else if (name !== 'dir' && name !== 'lang') mark();
        }
        if (tag === 'a' && !rawAttributes.has('href')) mark();
        if (!/\/>$/.test(raw)) stack.push({ tag, attributes });
    }
    text(value.slice(offset));
    if (stack.length || ignored) mark();
    flush();
    const first = lines.findIndex(line => line.ops.length);
    while (lines.length && !lines.at(-1).ops.length) lines.pop();
    const ops = (first < 0 ? [] : lines.slice(first)).flatMap(line => [...line.ops, Object.keys(line.attributes).length
        ? { insert: '\n', attributes: line.attributes } : { insert: '\n' }]);
    const body = ops.map(op => op.insert).join('').slice(0, -1);
    return { body, ops: ops.some(op => op.attributes) ? ops : null, simplified };
}

// Plain-only evidence fields cannot store link attributes. Preserve a
// link destination alongside its label when the two are not identical.
function gedcomPlainEvidence(content)
{
    if (!content.ops) return content.body;
    let body = '', link = '', label = '';
    const finishLink = () =>
    {
        if (link && label.trim() !== link) body += ' (' + link + ')';
        link = '';
        label = '';
    };
    for (const operation of content.ops)
    {
        const nextLink = operation.attributes?.link || '';
        if (nextLink !== link) { finishLink(); link = nextLink; }
        body += operation.insert;
        if (link) label += operation.insert;
    }
    finishLink();
    return body.slice(0, -1);
}

// Compose event/citation labels and formatted excerpts without losing the
// final newline carrying Quill's list or heading attribute.
function gedcomJoinContent(parts)
{
    const values = parts.map(part => typeof part === 'string' ? gedcomPlainContent(part) : part)
        .filter(part => part.body.trim());
    const body = values.map(part => part.body).join('\n\n');
    const ops = values.some(part => part.ops) ? values.flatMap((part, index) => [
        ...(part.ops || [{ insert: part.body + '\n' }]),
        ...(index < values.length - 1 ? [{ insert: '\n' }] : [])
    ]) : null;
    return { body, ops, simplified: values.some(part => part.simplified) };
}

function mapGedcomImport(...args)
{
    if (typeof appPerf === 'undefined' || !appPerf.enabled('Projects')) return mapGedcomImportWithDiagnosticsBody(...args);
    return appPerf.run('Projects', 'gedcomMap', () => mapGedcomImportWithDiagnosticsBody(...args));
}

function mapGedcomImportWithDiagnosticsBody(parsed, project, matches = new Map(), references = gedcomAttachmentReferences(parsed))
{
    const { id: projectId } = project;
    const started = performance.now();
    let visited = 0;
    const checkDeadline = () =>
    {
        if (++visited % 128 === 0 && performance.now() - started > GEDCOM_IMPORT_LIMITS.parseMilliseconds)
            throw new GedcomImportError('The GEDCOM file took too long to parse.');
    };
    const warnings = new Map();
    const used = new Set();
    const peopleByXref = new Map();
    const familiesByXref = new Map();
    const places = new Map();
    const media = new Map();
    const eventOwners = new Map();
    const notes = new Map();
    const importedAt = project.createdAt || new Date().toISOString();
    const myHeritage = parsed.exporter === 'MYHERITAGE';
    const familio = parsed.exporter === 'FAMILIO';
    const conflictingPlaces = new Set();
    const sources = new Map();
    const sourceLinks = new Map();
    const onlinePhotos = new Set();
    const textCache = new WeakMap();
    const simplifiedText = new WeakSet();
    const reportSimplifiedText = node =>
    {
        if (simplifiedText.has(node)) return;
        simplifiedText.add(node);
        warn(node.tag, node.line, 'text-format');
    };
    const readRichText = node =>
    {
        if (textCache.has(node)) return textCache.get(node);
        used.add(node);
        const parts = [node.value.replace(/^@@/, '@')];
        for (const part of node.children)
        {
            checkDeadline();
            if (!['CONT', 'CONC'].includes(part.tag)) continue;
            parts.push(part.tag === 'CONT' ? '\n' : '', part.value);
            used.add(part);
        }
        const content = gedcomRichContent(parts.join(''), checkDeadline);
        if (content.simplified) reportSimplifiedText(node);
        textCache.set(node, content);
        return content;
    };
    const readText = node =>
    {
        const content = readRichText(node);
        if (content.ops) reportSimplifiedText(node);
        return gedcomPlainEvidence(content);
    };
    const addNote = (key, content, title) =>
    {
        const { body, ops } = typeof content === 'string' ? gedcomPlainContent(content) : content;
        const note = {
            id: projectId + '-note-' + (notes.size + 1), projectId,
            title: title ?? body.trim().split(/\r?\n/, 1)[0].slice(0, 100), body,
            bodyDelta: ops ? { ops } : null, bodyFormat: ops ? 'quill-delta-v1' : '', favorite: false, archived: false, tags: [], checklist: [],
            createdAt: importedAt, updatedAt: importedAt,
            linkedPersonIds: [], linkedEventIds: [], linkedPlaceIds: [], linkedPhotoIds: [],
            linkedArchiveFileIds: [], collectionIds: [], relatedNoteIds: []
        };
        notes.set(key, note);
        return note;
    };
    const importNotes = (owner, personIds, eventId, placeId) =>
    {
        for (const link of owner.children.filter(child => child.tag === 'NOTE'))
        {
            checkDeadline();
            if (familio && owner.tag === 'PLAC' && !link.children.length
                && /^https?:\/\/(?:www\.)?familio\.org\/settlements\/[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}\/?$/i.test(link.value.trim()))
            {
                used.add(link);
                continue;
            }
            const pointer = /^@[^@]+@$/.test(link.value.trim());
            const source = pointer ? parsed.xrefs.get(link.value.trim()) : link;
            if (source?.tag !== 'NOTE') continue;
            used.add(link);
            let note = notes.get(source);
            if (!note)
            {
                const content = readRichText(source);
                if (!content.body.trim()) continue;
                note = addNote(source, content);
            }
            for (const id of personIds)
                if (!note.linkedPersonIds.includes(id)) note.linkedPersonIds.push(id);
            if (eventId && !note.linkedEventIds.includes(eventId)) note.linkedEventIds.push(eventId);
            if (placeId && !note.linkedPlaceIds.includes(placeId)) note.linkedPlaceIds.push(placeId);
        }
    };
    const take = (node, tag) =>
    {
        const values = node.children.filter(child => child.tag === tag);
        if (values.length > 1) throw new GedcomImportError('A GEDCOM record repeats a field that must be unique.', values[1].line);
        if (values[0]) used.add(values[0]);
        return values[0];
    };
    const read = (node, tag) => take(node, tag)?.value.trim() || '';
    const restrictionFields = node =>
    {
        const value = node ? read(node, 'RESN') : '';
        return value ? { importedRestriction: value } : {};
    };
    const warn = (tag, line, kind = 'skipped') =>
    {
        const key = kind + ':' + tag;
        const entry = warnings.get(key) || { tag, kind, count: 0, lines: [] };
        entry.count++;
        if (entry.lines.length < 3) entry.lines.push(line);
        warnings.set(key, entry);
    };
    const resolve = (table, node) =>
    {
        const value = table.get(node.value.trim());
        if (!value) throw new GedcomImportError('A GEDCOM link points to a missing or incompatible record.', node.line);
        used.add(node);
        return value;
    };
    const positiveEvent = node =>
    {
        if (!node) return false;
        const marker = node.value.trim().toUpperCase();
        if (!marker || marker === 'Y') return true;
        used.add(node);
        warn(node.tag, node.line);
        return false;
    };
    const readCoordinate = (node, directions, validate) =>
    {
        const parsed = /^([NSEW])([0-9]+(?:\.[0-9]+)?)$/i.exec(node?.value.trim() || '');
        if (!parsed || !directions.includes(parsed[1].toUpperCase())) return null;
        const number = Number(parsed[2]) * (/[SW]/i.test(parsed[1]) ? -1 : 1);
        return validate(number) ? number : null;
    };
    const readPlace = node =>
    {
        const placeNode = take(node, 'PLAC');
        const placeText = placeNode?.value.trim() || '';
        if (!placeText) return { placeId: null, placeText };
        if (!places.has(placeText))
            places.set(placeText, { id: projectId + '-place-' + (places.size + 1), projectId,
                name: placeText, alternativeNames: [], coordinates: null });
        const place = places.get(placeText);
        const maps = placeNode.children.filter(child => child.tag === 'MAP');
        for (const map of maps)
        {
            used.add(map);
            const latitudes = map.children.filter(child => child.tag === 'LATI');
            const longitudes = map.children.filter(child => child.tag === 'LONG');
            for (const coordinate of [...latitudes, ...longitudes]) used.add(coordinate);
            const lat = readCoordinate(latitudes[0], 'NS', validLatitude);
            const lng = readCoordinate(longitudes[0], 'EW', validLongitude);
            if (latitudes.length !== 1 || longitudes.length !== 1 || lat === null || lng === null)
            {
                warn('MAP', map.line, 'place-coordinates-invalid');
                continue;
            }
            if (conflictingPlaces.has(place)) continue;
            if (place.coordinates && (place.coordinates.lat !== lat || place.coordinates.lng !== lng))
            {
                place.coordinates = null;
                conflictingPlaces.add(place);
                warn('MAP', map.line, 'place-coordinates-conflict');
            }
            else place.coordinates = { lat, lng };
        }
        importNotes(placeNode, [], null, place.id);
        return { placeId: place.id, placeText };
    };
    const readDate = dateNode =>
    {
        const dateText = dateNode?.value.trim() || '';
        const parsedDate = dateText ? parseGedcomDate(dateText) : null;
        const date = parsedDate?.valid ? parsedDate.value : emptyGenealogyDate();
        if (dateText && !parsedDate?.valid)
        {
            date.state = 'unparsed';
            date.originalText = dateText;
            warn(dateNode.tag, dateNode.line, 'date-text');
        }
        return date;
    };
    const vital = node =>
    {
        if (!node) return { ...emptyGenealogyDate(), placeId: null, placeText: '' };
        used.add(node);
        return { ...readDate(take(node, 'DATE')), ...readPlace(node) };
    };

    for (const node of parsed.roots)
    {
        checkDeadline();
        if (node.tag === 'INDI')
        {
            used.add(node);
            const nameNodes = node.children.filter(child => child.tag === 'NAME');
            const name = nameNodes[0];
            const names = { first: '', last: '' };
            if (name)
            {
                used.add(name);
                const parts = /^(.*?)\/([^/]*)\/\s*(.*)$/.exec(name.value);
                names.first = read(name, 'GIVN') || (parts?.[1] || (!parts ? name.value : '')).trim();
                names.last = read(name, 'SURN') || parts?.[2].trim() || '';
                names.prefix = read(name, 'NPFX');
                names.suffix = read(name, 'NSFX') || parts?.[3].trim() || '';
                const maiden = nameNodes.slice(1).filter(candidate =>
                    candidate.children.some(child => child.tag === 'TYPE' && ['birth', 'maiden'].includes(child.value.trim().toLowerCase())));
                if (maiden.length === 1)
                {
                    const surname = take(maiden[0], 'SURN')?.value.trim() || /\/([^/]*)\//.exec(maiden[0].value)?.[1].trim();
                    if (surname)
                    {
                        names.maiden = surname;
                        used.add(maiden[0]);
                        take(maiden[0], 'TYPE');
                    }
                }
            }
            if ((myHeritage || familio) && name)
            {
                const marriedNode = take(name, '_MARNM');
                const married = marriedNode?.value.trim();
                const surnameKey = value => value.normalize('NFC').toLowerCase();
                if (married && surnameKey(married) !== surnameKey(names.last))
                {
                    if (names.last && names.maiden && surnameKey(names.maiden) !== surnameKey(names.last))
                        warn('_MARNM', marriedNode.line, 'name-conflict');
                    if (names.last && !names.maiden) names.maiden = names.last;
                    names.last = married;
                }
            }
            const sex = take(node, 'SEX');
            const gender = sex?.value.trim() === 'M' ? 'male' : sex?.value.trim() === 'F' ? 'female' : 'unknown';
            if (sex && !['M', 'F', 'U', ''].includes(sex.value.trim())) warn('SEX', sex.line);
            const birth = take(node, 'BIRT');
            const death = take(node, 'DEAT');
            const deceased = positiveEvent(death);
            const hasBirth = positiveEvent(birth);
            const record = {
                id: projectId + '-person-' + (peopleByXref.size + 1), projectId, names, gender,
                livingStatus: deceased ? 'Deceased' : 'Living',
                birth: vital(hasBirth ? birth : null), death: vital(deceased ? death : null),
                ...restrictionFields(node), profile: {}, events: [], attributes: [], notes: [], citations: [], mediaIds: []
            };
            Object.assign(record.birth, restrictionFields(birth));
            Object.assign(record.death, restrictionFields(death));
            const aliasTags = myHeritage ? ['NICK', '_FORMERNAME', '_AKA'] : ['NICK'];
            const aliases = nameNodes.flatMap(candidate => candidate.children.filter(child => aliasTags.includes(child.tag)))
                .map(alias => readText(alias).trim()).filter(Boolean);
            if (aliases.length) record.profile.alternativeNames = [...new Set(aliases)].join('; ');
            importNotes(node, [record.id]);
            for (const description of node.children.filter(child => child.tag === 'DSCR'))
            {
                const content = readRichText(description);
                if (!content.body.trim()) continue;
                addNote(description, content, t('Physical description')).linkedPersonIds.push(record.id);
            }
            if (hasBirth)
            {
                eventOwners.set(birth, 'event-' + record.id + '-birth');
                importNotes(birth, [record.id], eventOwners.get(birth));
            }
            if (deceased)
            {
                const cause = read(death, 'CAUS');
                if (cause) record.death.cause = cause;
                eventOwners.set(death, 'event-' + record.id + '-death');
                importNotes(death, [record.id], eventOwners.get(death));
            }
            for (const event of node.children.filter(child => ['BAPM', 'BURI'].includes(child.tag)))
            {
                if (!positiveEvent(event)) continue;
                const { placeId, placeText, ...date } = vital(event);
                record.events.push({ id: record.id + '-event-' + (record.events.length + 1),
                    gedcomTag: event.tag, date, placeId, placeText, ...restrictionFields(event) });
                eventOwners.set(event, 'event-' + record.events.at(-1).id);
                importNotes(event, [record.id], eventOwners.get(event));
            }
            for (const fact of node.children.filter(child => ['EDUC', 'OCCU', 'RELI', 'EVEN', 'GRAD', 'NATI', 'TITL', 'NCHI', 'CHR'].includes(child.tag)))
            {
                const value = fact.value.trim();
                if (fact.tag === 'CHR' && !positiveEvent(fact)) continue;
                if (fact.tag === 'NCHI' && !/^\d+$/.test(value)) continue;
                const type = fact.tag === 'EVEN' ? read(fact, 'TYPE') :
                    ({ GRAD: 'Graduation', CHR: 'Christening', NATI: 'National origin', TITL: 'Title', NCHI: 'Recorded child count' }[fact.tag] || '');
                const dateNode = take(fact, 'DATE');
                const place = readPlace(fact);
                if (!value && !type && !dateNode && !place.placeId && !fact.children.some(child => child.tag === 'NOTE')) continue;
                used.add(fact);
                const tag = ['EDUC', 'OCCU', 'RELI'].includes(fact.tag) ? fact.tag : 'FACT';
                const id = record.id + '-attribute-' + (record.attributes.length + 1);
                const ranged = ['EDUC', 'OCCU'].includes(tag);
                const period = ranged && dateNode ? parseGedcomPeriod(dateNode.value.trim()) : null;
                const date = dateNode && !period ? readDate(dateNode) : null;
                const dateFields = period || (date ? (ranged ? { fromDate: date } : { date }) : {});
                const attribute = { id, tag, value: value.toUpperCase() === 'Y' && tag === 'FACT' ? '' : value,
                    ...place, ...dateFields, ...restrictionFields(fact) };
                if (tag === 'FACT') attribute.type = t(type || 'Other event');
                record.attributes.push(attribute);
                if (tag !== 'RELI') eventOwners.set(fact, 'event-' + id);
                const noteBody = fact.children.filter(child => child.tag === 'NOTE' && !/^@[^@]+@$/.test(child.value.trim()))
                    .map(readText).filter(value => value.trim()).join('\n');
                if (noteBody) attribute.notes = noteBody;
                importNotes(fact, [record.id], eventOwners.get(fact));
            }
            peopleByXref.set(node.xref, record);
        }
        else if (node.tag === 'FAM')
        {
            if (myHeritage && !node.children.length)
            {
                used.add(node);
                continue;
            }
            used.add(node);
            familiesByXref.set(node.xref, { id: projectId + '-family-' + (familiesByXref.size + 1),
                projectId, type: 'family', gedcomXref: node.xref, partnerAId: '', partnerBId: '', ...restrictionFields(node),
                childIds: [], parentChildTypes: {}, events: [], attributes: [], notes: [], citations: [], mediaIds: [],
                relationshipType: 'Unknown relationship', relationshipStatus: 'unknown' });
        }
    }
    for (const [xref, family] of familiesByXref)
    {
        checkDeadline();
        const node = parsed.xrefs.get(xref);
        for (const [tag, field, hint] of [['HUSB', 'partnerAId', 'partnerARoleHint'], ['WIFE', 'partnerBId', 'partnerBRoleHint']])
        {
            const member = take(node, tag);
            if (!member) continue;
            family[field] = resolve(peopleByXref, member).id;
            family[hint] = tag;
        }
        for (const child of node.children.filter(item => item.tag === 'CHIL'))
        {
            const id = resolve(peopleByXref, child).id;
            if (family.childIds.includes(id)) throw new GedcomImportError('A family contains a duplicate child link.', child.line);
            family.childIds.push(id);
        }
        for (const event of node.children.filter(item => ['MARR', 'DIV', 'ANUL', 'EVEN', 'NCHI'].includes(item.tag)))
        {
            const recordedCount = event.tag === 'NCHI';
            if (recordedCount && !/^\d+$/.test(event.value.trim())) continue;
            if (!recordedCount && event.tag !== 'EVEN' && !positiveEvent(event)) continue;
            const { placeId, placeText, ...date } = vital(event);
            const type = read(event, 'TYPE');
            const eventType = ({ MARR: 'Marriage', DIV: 'Divorce', ANUL: 'Annulment', NCHI: 'Recorded child count' })[event.tag]
                || type || 'Other event';
            family.events.push({ id: family.id + '-event-' + (family.events.length + 1), gedcomTag: event.tag,
                eventType, date, placeId, placeText, typeLabel: type, ...restrictionFields(event),
                ...(recordedCount ? { description: event.value.trim() } : {}) });
            const partnerIds = [family.partnerAId, family.partnerBId].filter(Boolean);
            if (partnerIds.length === 2) eventOwners.set(event, 'event-' + family.id + '-' + family.events.at(-1).id);
            if (partnerIds.length)
                importNotes(event, partnerIds, partnerIds.length === 2
                    ? 'event-' + family.id + '-' + family.events.at(-1).id : null);
        }
        if (family.events.some(event => event.gedcomTag === 'ANUL'))
        {
            family.relationshipType = 'Annulled';
            family.relationshipStatus = 'annulled';
        }
        else if (family.events.some(event => event.gedcomTag === 'DIV'))
        {
            family.relationshipType = 'Divorced';
            family.relationshipStatus = 'divorced';
        }
        else if (family.events.some(event => event.gedcomTag === 'MARR'))
        {
            family.relationshipType = 'Married';
            family.relationshipStatus = 'active';
        }
    }

    const familyNoteEvents = new Map([
        ['ENGA', 'Engagement'], ['MARB', 'Marriage banns'], ['MARC', 'Marriage contract'],
        ['MARL', 'Marriage license'], ['MARS', 'Marriage settlement'], ['DIVF', 'Divorce filing'],
        ['CENS', 'Census']
    ]);
    const parentage = [];
    const ambiguousParentage = new Set();
    for (const [xref, person] of peopleByXref)
    {
        checkDeadline();
        const seen = new Set();
        const personNode = parsed.xrefs.get(xref);
        const adoptions = new Set(personNode.children.filter(node => node.tag === 'ADOP')
            .flatMap(node => node.children.filter(child => child.tag === 'FAMC').map(child => child.value.trim())));
        for (const link of personNode.children.filter(item => ['FAMS', 'FAMC'].includes(item.tag)))
        {
            const family = resolve(familiesByXref, link);
            const key = link.tag + family.id;
            if (seen.has(key)) throw new GedcomImportError('A person repeats a GEDCOM family link.', link.line);
            seen.add(key);
            if (link.tag === 'FAMS')
            {
                if ([family.partnerAId, family.partnerBId].includes(person.id)) continue;
                if (!family.partnerAId) family.partnerAId = person.id;
                else if (!family.partnerBId) family.partnerBId = person.id;
                else throw new GedcomImportError('GEDCOM partner claims disagree about a family.', link.line);
            }
            else
            {
                const status = take(link, 'STAT');
                if (status && status.value.trim().toLowerCase() !== 'proven')
                {
                    if (status.value.trim().toLowerCase() === 'disproven' && family.childIds.includes(person.id))
                        throw new GedcomImportError('GEDCOM child claims disagree about a family.', status.line);
                    ambiguousParentage.add(family.id + '|' + person.id);
                    warn('STAT', status.line);
                    continue;
                }
                if (!family.childIds.includes(person.id)) family.childIds.push(person.id);
                const pedigree = take(link, 'PEDI');
                const type = new Map([['birth', 'Biological'], ['adopted', 'Adoptive'], ['foster', 'Foster']])
                    .get(pedigree?.value.trim().toLowerCase());
                if (type && !(type === 'Adoptive' && adoptions.has(link.value.trim()))) parentage.push({ family, person, type });
                else if (pedigree?.value.trim())
                {
                    ambiguousParentage.add(family.id + '|' + person.id);
                    if (!type) warn('PEDI', pedigree.line);
                }
            }
        }
    }
    for (const [xref, person] of peopleByXref)
    {
        checkDeadline();
        for (const event of parsed.xrefs.get(xref).children.filter(node => node.tag === 'ADOP'))
        {
            const link = event.children.find(node => node.tag === 'FAMC');
            const role = link?.children.find(node => node.tag === 'ADOP');
            const choice = role?.value.trim().toUpperCase();
            if (!role || !['HUSB', 'WIFE', 'BOTH'].includes(choice))
            {
                const family = familiesByXref.get(link?.value.trim());
                if (family) ambiguousParentage.add(family.id + '|' + person.id);
                continue;
            }
            const family = resolve(familiesByXref, link);
            const parents = [
                ['HUSB', family.partnerAId, family.partnerARoleHint],
                ['WIFE', family.partnerBId, family.partnerBRoleHint]
            ].filter(([tag, id, hint]) => id && (choice === 'BOTH' || (choice === tag && hint === tag)));
            if (!parents.length || (choice === 'BOTH' && parents.length !== 2))
            {
                ambiguousParentage.add(family.id + '|' + person.id);
                warn('FAMC', link.line);
                continue;
            }
            used.add(event);
            used.add(role);
            if (!family.childIds.includes(person.id)) family.childIds.push(person.id);
            for (const [, id] of parents)
                parentage.push({ family, person, type: 'Adoptive', parentId: id });
        }
    }
    for (const { family, person, type, parentId } of parentage)
        for (const parent of parentId ? [parentId] : [family.partnerAId, family.partnerBId].filter(Boolean))
            family.parentChildTypes[parent + '|' + person.id] = type;

    for (const [xref, family] of familiesByXref)
    {
        const parents = [family.partnerAId, family.partnerBId].filter(Boolean);
        const familyNode = parsed.xrefs.get(xref);
        importNotes(familyNode, parents);
        for (const event of familyNode.children.filter(child => familyNoteEvents.has(child.tag)))
        {
            checkDeadline();
            if (!positiveEvent(event)) continue;
            used.add(event);
            const title = t(familyNoteEvents.get(event.tag));
            const date = read(event, 'DATE');
            const { placeId, placeText } = readPlace(event);
            const type = read(event, 'TYPE');
            const details = event.children.filter(child => child.tag === 'NOTE' && !/^@[^@]+@$/.test(child.value.trim()))
                .map(readRichText);
            const initialContent = gedcomJoinContent([type, date, placeText, ...details]);
            const referencedDetails = [];
            for (const pointer of event.children.filter(child => child.tag === 'NOTE' && /^@[^@]+@$/.test(child.value.trim())))
            {
                const target = parsed.xrefs.get(pointer.value.trim());
                if (target?.tag !== 'NOTE') continue;
                used.add(pointer);
                referencedDetails.push(readRichText(target));
            }
            const content = gedcomJoinContent([initialContent.body ? initialContent : title, ...referencedDetails]);
            const note = addNote(event, content, title);
            Object.assign(note, restrictionFields(event));
            note.linkedPersonIds = parents;
            if (placeId) note.linkedPlaceIds.push(placeId);
        }
        for (const childId of family.childIds)
        {
            checkDeadline();
            if (ambiguousParentage.has(family.id + '|' + childId)) continue;
            for (const parentId of parents)
                family.parentChildTypes[parentId + '|' + childId] ??= 'Biological';
        }
    }

    const sourceDetail = (label, value) => value ? t(label) + ': ' + value : '';
    for (const node of parsed.roots)
    {
        checkDeadline();
        if (node.tag !== 'SOUR' || !node.xref) continue;
        used.add(node);
        const titleNode = take(node, 'TITL');
        const title = (titleNode && readText(titleNode).trim()) || t('Untitled source');
        const authorNode = take(node, 'AUTH');
        const author = authorNode ? readText(authorNode).trim() : '';
        const classification = myHeritage ? read(node, '_TYPE') : '';
        const medium = myHeritage ? read(node, '_MEDI') : '';
        const publicationNode = take(node, 'PUBL');
        const publication = publicationNode ? readText(publicationNode).trim() : '';
        const text = node.children.filter(child => child.tag === 'TEXT').map(readText);
        const category = ['Collection', 'Discovery', 'Smart Matching'].includes(classification) ? 'online'
            : publication ? 'publication' : '';
        sources.set(node.xref, {
            id: projectId + '-source-' + (sources.size + 1), projectId, title, category,
            providedBy: author, reference: publication, url: '', placeId: null, accessedDate: '',
            notes: [...text, sourceDetail('Source classification', classification),
                sourceDetail('Source medium', medium)].filter(Boolean).join('\n\n'),
            favorite: false, createdAt: importedAt, updatedAt: importedAt
        });
    }

    const linkSource = (sourceId, targetType, targetId) =>
    {
        const key = [sourceId, targetType, targetId].join(':');
        if (sourceLinks.has(key)) return;
        sourceLinks.set(key, { id: projectId + '-source-link-' + (sourceLinks.size + 1),
            projectId, sourceId, targetType, targetId });
    };
    function importCitations(node, personIds, eventIds = [])
    {
        checkDeadline();
        for (const citation of node.children.filter(child => child.tag === 'SOUR'))
        {
            checkDeadline();
            const source = sources.get(citation.value.trim());
            if (!source) continue;
            used.add(citation);
            const targets = [...eventIds];
            const page = take(citation, 'PAGE');
            const details = [sourceDetail('Page or reference', page ? readText(page).trim() : '')];
            for (const context of citation.children.filter(child => child.tag === 'EVEN'))
            {
                used.add(context);
                const role = take(context, 'ROLE');
                details.push(sourceDetail('Cited event', readText(context).trim()),
                    sourceDetail('Role', role ? readText(role).trim() : ''));
                if (node.tag !== 'INDI' && node.tag !== 'FAM') continue;
                const tags = context.value.trim().toUpperCase().split(/\s*,\s*/);
                const candidates = node.children.filter(child => tags.includes(child.tag) && eventOwners.has(child));
                if (candidates.length === 1) targets.push(eventOwners.get(candidates[0]));
            }
            for (const data of citation.children.filter(child => child.tag === 'DATA'))
            {
                used.add(data);
                details.push(sourceDetail('Citation date', read(data, 'DATE')));
                for (const text of data.children.filter(child => child.tag === 'TEXT')) details.push(readRichText(text));
            }
            for (const text of citation.children.filter(child => child.tag === 'TEXT')) details.push(readRichText(text));
            for (const id of personIds) linkSource(source.id, 'person', id);
            for (const id of targets) linkSource(source.id, 'event', id);
            const content = gedcomJoinContent(details);
            if (!content.body) continue;
            const note = addNote(citation, content, source.title.slice(0, 100));
            note.linkedPersonIds = [...personIds];
            note.linkedEventIds = [...new Set(targets)];
            linkSource(source.id, 'note', note.id);
        }
        for (const child of node.children)
            if (eventOwners.has(child)) importCitations(child, personIds, [eventOwners.get(child)]);
    }
    for (const [xref, person] of peopleByXref) importCitations(parsed.xrefs.get(xref), [person.id]);
    for (const xref of familiesByXref.keys())
    {
        // A family citation without an event belongs to the family, not to each individual.
        const node = parsed.xrefs.get(xref);
        for (const event of node.children)
            if (eventOwners.has(event)) importCitations(event, [], [eventOwners.get(event)]);
    }

    const archiveFiles = [];
    const attachmentAssets = new Map();
    const primaryPhotos = new Map();
    const attachmentReport = [];
    const byFile = new Map();
    for (const [key, reference] of references)
    {
        checkDeadline();
        const match = matches.get(key);
        const entry = { name: reference.value, extension: match?.extension || /\.([a-z0-9]{1,12})$/i.exec(reference.value)?.[1],
            found: match?.found ?? false, status: match?.status || 'File not selected' };
        attachmentReport.push(entry);
        if (match?.status !== 'Ready to import') continue;
        const group = byFile.get(match.file) || [];
        group.push({ reference, match, entry });
        byFile.set(match.file, group);
    }
    for (const group of byFile.values())
    {
        checkDeadline();
        const { photo, blob, file } = group[0].match;
        const links = group.flatMap(item => item.reference.links);
        const personFor = link => link.node === link.owner && link.owner.tag === 'INDI'
            ? peopleByXref.get(link.owner.xref) : null;
        const supported = link => personFor(link) || eventOwners.has(link.node);
        const supportedLinks = links.filter(supported);
        if (!supportedLinks.length)
        {
            for (const { entry } of group) entry.status = 'No supported record to link';
            continue;
        }
        const personIds = [...new Set(supportedLinks.map(link => personFor(link)?.id).filter(Boolean))];
        const eventIds = [...new Set(supportedLinks.map(link => eventOwners.get(link.node)).filter(Boolean))];
        const title = links.flatMap(link => [link.file, link.record])
            .flatMap(node => node.children).find(child => child.tag === 'TITL')?.value.trim();
        if (photo && !eventIds.length)
        {
            const { filename, src, mimeType, width, height, sizeBytes } = photo;
            const id = projectId + '-photo-' + (media.size + 1);
            media.set(file, { id, projectId, kind: 'photo', title: title || filename, filename, src, mimeType,
                width, height, sizeBytes, personIds, albumIds: [], placeId: null, placeText: '', caption: '',
                favorite: false, createdAt: importedAt, updatedAt: importedAt });
            const dateNodes = myHeritage ? links.flatMap(link => link.object.children.filter(child => child.tag === '_DATE')) : [];
            if (dateNodes.length && new Set(dateNodes.map(node => node.value.trim())).size === 1)
            {
                for (const node of dateNodes) used.add(node);
                media.get(file).date = readDate(dateNodes[0]);
            }
            for (const link of supportedLinks)
            {
                const person = personFor(link);
                if (link.object.children.some(child =>
                    (child.tag === '_PRIM' || (myHeritage && child.tag === '_PERSONALPHOTO'))
                        && child.value.trim().toUpperCase() === 'Y'))
                {
                    const candidates = primaryPhotos.get(person) || new Set();
                    candidates.add(id);
                    primaryPhotos.set(person, candidates);
                }
            }
        }
        else
        {
            const id = projectId + '-archive-' + (archiveFiles.length + 1);
            const extension = archiveDocumentExtension(file.name);
            const kind = photo ? 'img' : extension === 'pdf' ? 'pdf' : extension === 'csv' ? 'sheet' : 'doc';
            archiveFiles.push({ id, projectId, folderId: null, name: file.name, kind,
                type: photo ? 'Image' : extension.toUpperCase(), mimeType: photo?.mimeType || file.type, sizeBytes: file.size,
                favorite: false, description: title || '', previewUrl: photo?.src || '',
                linkedPersonIds: personIds, linkedEventIds: eventIds, linkedNoteIds: [],
                documentPlaceId: null, linkedPlaceIds: [], addedAt: importedAt, updatedAt: importedAt });
            attachmentAssets.set(id, blob || file);
        }
        for (const link of supportedLinks)
        {
            used.add(link.object);
            used.add(link.record);
            used.add(link.file);
            for (const node of [link.object, link.record, link.file])
                for (const child of node.children)
                    if (['TITL', '_PRIM'].includes(child.tag) || (myHeritage && child.tag === '_PERSONALPHOTO')) used.add(child);
        }
        for (const { reference, entry } of group)
            entry.status = reference.links.every(supported) ? 'Imported' : reference.links.some(supported)
                ? 'Imported with some links skipped' : 'No supported record to link';
    }

    for (const [person, candidates] of primaryPhotos)
        if (candidates.size === 1) person.primaryPhotoId = candidates.values().next().value;

    function account(node, parent)
    {
        checkDeadline();
        if ((!parent && node.tag === 'SUBM') || node.tag === 'RESI') return;
        const fileNodes = node.tag === 'OBJE' ? node.children.filter(child => child.tag === 'FILE') : [];
        if (myHeritage && fileNodes.length && fileNodes.every(file => /^https?:\/\//i.test(file.value.trim())))
        {
            for (const file of fileNodes) onlinePhotos.add(file.value.trim());
            return;
        }
        const technical = ['_UID', '_UPD', 'RIN', 'EMAIL', 'AGE', 'QUAY', '_FILESIZE', '_PHOTO_RIN'].includes(node.tag)
            || (familio && node.tag === '_FAMILIO_GUID' && parent?.tag === 'PLAC')
            || (node.tag === 'FORM' && ['OBJE', 'FILE'].includes(parent?.tag));
        if (!used.has(node) && !technical) warn(node.tag, node.line);
        for (const child of node.children) account(child, node);
    }
    for (const node of parsed.roots) account(node);

    const people = [...peopleByXref.values()];
    const families = [...familiesByXref.values()];
    if (!people.length) throw new GedcomImportError('The GEDCOM file contains no people.');
    const records = { people, families, places: [...places.values()], media: [...media.values()], notes: [...notes.values()], archiveFiles,
        sources: [...sources.values()], sourceLinks: [...sourceLinks.values()] };
    const draft = prepareProjectDraft({ ...project, defaultPersonId: people[0].id }, records);
    if (draft.errors.length) return { errors: draft.errors };
    const distinctFilesFound = new Set([...matches].filter(([, match]) => match.found)
        .map(([key, match]) => match.file || key)).size;
    for (const entry of attachmentReport)
    {
        if (entry.status.startsWith('Imported')) onlinePhotos.delete(entry.name);
        if (entry.name.startsWith('https://sites-cf.mhcache.com/'))
            entry.name = new URL(entry.name).pathname.split('/').at(-1) || t('Photo');
    }
    return { ...draft, warnings: [...warnings.values()], attachmentReport, attachmentAssets, distinctFilesFound, onlinePhotoCount: onlinePhotos.size };
}


function gedcomDraftMetadata(name)
{
    const now = new Date().toISOString();
    const occupied = new Set(PROJECT_OWNED_COLLECTIONS.flatMap(key => (sampleData[key] || []).map(record => record.id)));
    const base = uniqueProjectId();
    let id = base;
    let suffix = 2;
    while (sampleData.projects.some(project => project.id === id)
        || [...occupied].some(recordId => recordId.startsWith(id + '-')))
        id = base + '-ged-' + suffix++;
    return { id, name, desc: '', createdAt: now, modifiedAt: now, status: 'Local project', cover: 'paper' };
}

function commitGedcomImport(...args)
{
    if (typeof appPerf === 'undefined' || !appPerf.enabled('Projects')) return commitGedcomImportWithDiagnosticsBody(...args);
    return appPerf.run('Projects', 'gedcomCommit', () => commitGedcomImportWithDiagnosticsBody(...args));
}

function commitGedcomImportWithDiagnosticsBody(draft, report = gedcomImportReport(draft))
{
    const projectId = draft.project.id;
    const trace = typeof appPerf === 'undefined' ? null : appPerf.currentDetailed('Projects');
    if (trace)
    {
        appPerf.count(trace, 'projectPeople', draft.records.people.length);
        appPerf.count(trace, 'projectFamilies', draft.records.families.length);
    }
    const previous = { projects: sampleData.projects, activity: sampleData.activity };
    const next = {
        projects: [...sampleData.projects, draft.project],
        activity: [...(sampleData.activity || []), {
            id: `gedcom-import:${projectId}`,
            projectId,
            type: 'gedcom-import',
            module: 'Family Tree',
            title: 'GEDCOM imported',
            detail: 'View GEDCOM import report',
            occurredAt: new Date().toISOString()
        }]
    };
    const previousState = { ...state, treeProjectViews: structuredClone(state.treeProjectViews) };
    let previousContinuation;
    try { previousContinuation = localStorage.getItem(PROJECT_CONTINUATION_STORAGE_KEY); }
    catch (_error) {}
    for (const [key, records] of Object.entries(draft.records))
    {
        previous[key] = sampleData[key];
        next[key] = [...(sampleData[key] || []), ...records];
    }
    try
    {
        Object.assign(sampleData, next);
        gedcomImportReports.set(projectId, report);
        for (const [id, blob] of draft.attachmentAssets) archiveDocumentBytes.set(id, blob);
        const activate = () => activateProject(projectId, { moduleName: 'Family Tree' });
        const activated = withoutProjectReadModelRetention(activate);
        if (!activated) throw new Error('Project activation failed');
    }
    catch (error)
    {
        const viewChanged = state.currentProjectId !== previousState.currentProjectId
            || state.activeModule !== previousState.activeModule;
        for (const id of draft.attachmentAssets.keys()) archiveDocumentBytes.delete(id);
        gedcomImportReports.delete(projectId);
        Object.assign(sampleData, previous);
        Object.assign(state, previousState);
        disposeProjectReadModel();
        setProjectReadModelActive(state.projectOpen ? state.currentProjectId : null);
        try
        {
            if (previousContinuation === null) localStorage.removeItem(PROJECT_CONTINUATION_STORAGE_KEY);
            else if (previousContinuation !== undefined)
                localStorage.setItem(PROJECT_CONTINUATION_STORAGE_KEY, previousContinuation);
        }
        catch (_error) {}
        if (viewChanged)
        {
            const openerId = modalReturnFocus?.id;
            render();
            if (openerId && !modalReturnFocus?.isConnected)
                modalReturnFocus = document.getElementById(openerId);
        }
        throw error;
    }
    markPrototypeSessionEdited();
    setProjectReadModelActive(projectId);
}

const gedcomImportReports = new Map();

function gedcomImportReport(draft)
{
    const { people, families, places } = draft.records;
    const facts = people.reduce((count, person) => count + person.events.length + person.attributes.length
        + Number(person.birth.state !== 'empty' || Boolean(person.birth.placeId))
        + Number(person.livingStatus === 'Deceased'), 0)
        + families.reduce((count, family) => count + family.events.length, 0);
    const rows = [['People', people.length], ['Families', families.length],
        ['Places', places.length], ['Facts', facts]];
    if (draft.records.media.length) rows.push(['Photos', draft.records.media.length]);
    if (draft.records.archiveFiles.length) rows.push(['Imported Archive files', draft.records.archiveFiles.length]);
    if (draft.records.notes.length) rows.push(['Notes', draft.records.notes.length]);
    if (draft.records.sources.length) rows.push(['Sources', draft.records.sources.length]);
    const authored = Object.fromEntries(PROJECT_DRAFT_COLLECTIONS.filter(key => draft.records[key])
        .map(key => [key, draft.records[key]]));
    const authoredCount = Object.values(authored).reduce((count, records) => count + records.length, 0);
    const manifestBytes = new TextEncoder().encode(JSON.stringify({
        project: draft.project, records: authored
    }, (key, value) => ['src', 'previewUrl'].includes(key) && typeof value === 'string' && value.startsWith('data:')
        ? '' : value)).byteLength;
    return { rows: rows.filter(([, count]) => count > 0), warnings: draft.warnings, attachments: draft.attachmentReport,
        attachmentCount: draft.records.media.length + draft.records.archiveFiles.length, distinctFilesFound: draft.distinctFilesFound, onlinePhotoCount: draft.onlinePhotoCount, overBackupRecordLimit: authoredCount > 50000,
        overBackupManifestLimit: manifestBytes > 32 * 1024 * 1024 };
}

function gedcomImportSummary(report)
{
    return '<dl class="gedcom-counts" tabindex="0" aria-label="' + escapeHtml(t('Import summary')) + '">' + report.rows.map(([label, value]) => '<div><dt>' + escapeHtml(t(label)) + '</dt><dd>' + value + '</dd></div>').join('')
        + '</dl>';
}

function gedcomImportWarnings(report)
{
    const warningGroup = (kind, title) =>
    {
        const entries = report.warnings.filter(item => item.kind === kind);
        if (!entries.length) return '';
        const total = entries.reduce((count, item) => count + item.count, 0);
        const examples = entries.slice(0, 25).map(item => '<li><strong>' + escapeHtml(item.tag) + '</strong> × '
            + item.count + ' <small>(' + escapeHtml(t('Lines')) + ' ' + item.lines.join(', ') + ')</small></li>').join('');
        return '<details><summary>' + escapeHtml(t(title)) + ' (' + total + ')</summary><ul>' + examples + '</ul>'
            + (entries.length > 25 ? '<p>' + escapeHtml(t('Showing the first 25 tag types.')) + '</p>' : '') + '</details>';
    };
    return (report.onlinePhotoCount ? '<p>' + escapeHtml(t('Online photo files not imported: {count}')
        .replace('{count}', report.onlinePhotoCount)) + '</p>' : '')
        + warningGroup('name-conflict', 'Conflicting maiden names')
        + warningGroup('place-coordinates-invalid', 'Incomplete or invalid place coordinates skipped')
        + warningGroup('place-coordinates-conflict', 'Conflicting place coordinates skipped')
        + warningGroup('skipped', 'Skipped or unsupported GEDCOM data')
        + warningGroup('date-text', 'Dates preserved as text')
        + warningGroup('text-format', 'Imported text formatting simplified or unsafe content omitted')
        + (report.overBackupRecordLimit ? '<p>' + escapeHtml(t('This project exceeds the 50,000-record limit for project backups.')) + '</p>' : '')
        + (report.overBackupManifestLimit ? '<p>' + escapeHtml(t('This project exceeds the 32 MiB metadata limit for project backups.')) + '</p>' : '');
}

function gedcomAttachmentSummary(report, committed = false)
{
    const { attachments: entries, attachmentCount, distinctFilesFound } = report;
    if (!entries.length) return '';
    const found = entries.filter(item => item.found).length;
    const incomplete = entries.filter(item => item.status !== 'Imported');
    const progressLabel = found === distinctFilesFound ? '{found} of {total} files found'
        : '{found} of {total} file references matched';
    const progress = t(progressLabel).replace('{found}', found).replace('{total}', entries.length);
    const countLabel = committed ? '{count} attachments imported' : '{count} attachments ready to import';
    return '<p>' + escapeHtml(progress) + ' · ' + escapeHtml(t(countLabel).replace('{count}', attachmentCount)) + '</p>'
        + (incomplete.length ? '<details class="gedcom-attachment-warnings"><summary>'
            + escapeHtml(t('Attachments that need attention')) + ' (' + incomplete.length + ')</summary><ul>'
            + incomplete.map(item => '<li><bdi data-user-content>' + escapeHtml(item.name) + '</bdi> · '
                + (item.extension ? escapeHtml(item.extension.toUpperCase()) + ' · ' : '')
                + escapeHtml(t(item.status)) + '</li>').join('') + '</ul></details>' : '');
}

function openImportModal()
{
    openModal(`<div class="modal gedcom-import-modal" role="dialog" aria-modal="true" aria-labelledby="importTitle">
        <div class="modal-header"><h2 id="importTitle">${escapeHtml(t('Import GEDCOM'))}</h2>
        <button class="close-button" type="button" data-close aria-label="${escapeHtml(t('Close'))}">${icon.close}</button></div>
        <form data-gedcom-import><div class="modal-body gedcom-import-body">
        <div class="gedcom-file-row gedcom-file-selector">
            <button type="button" class="button secondary" data-gedcom-choose data-modal-initial-focus>${icon.import}<span>${escapeHtml(t('Select GEDCOM file'))}</span></button>
            <div class="gedcom-file-identity" hidden>
                <span class="gedcom-file-name" data-gedcom-file-name data-user-content></span>
                <span class="gedcom-file-version" data-gedcom-version hidden></span>
            </div>
            <input id="gedcomFile" type="file" accept=".ged" hidden>
        </div>
        <div class="gedcom-error-panel" data-gedcom-error hidden role="alert" tabindex="-1">
            <strong>${escapeHtml(t("Couldn't import GEDCOM"))}</strong>
            <p data-gedcom-error-detail></p>
            <p>${escapeHtml(t('No project was created. Check the file and try again, or select another GEDCOM file.'))}</p>
        </div>
        <div class="field full" data-gedcom-name hidden><label for="gedcomProjectName">${escapeHtml(t('Project name'))}</label><input id="gedcomProjectName" maxlength="120" required disabled></div>
        <div class="gedcom-preview" data-gedcom-preview aria-live="polite"></div>
        <section class="gedcom-attachments" data-gedcom-attachments hidden aria-labelledby="gedcomAttachmentsTitle">
            <h3 id="gedcomAttachmentsTitle">${escapeHtml(t('Attach referenced files'))}</h3>
            <p data-gedcom-attachment-help hidden></p>
            <div class="gedcom-file-row" data-gedcom-local hidden>
                <button type="button" class="button secondary" data-gedcom-folder-choose>${escapeHtml(t('Select folder'))}</button>
                <span class="gedcom-file-name" data-gedcom-folder-name data-user-content hidden></span>
                <button type="button" class="button secondary gedcom-folder-remove" data-gedcom-folder-remove hidden
                    title="${escapeHtml(t('Remove selected folder'))}" aria-label="${escapeHtml(t('Remove selected folder'))}">${icon.trash}</button>
                <input type="file" webkitdirectory multiple data-gedcom-folder hidden>
            </div>
            <div class="gedcom-file-row" data-gedcom-online hidden>
                <button type="button" class="button secondary" data-gedcom-download>${escapeHtml(t('Download linked photos'))}</button>
                <span data-gedcom-download-status aria-live="polite"></span>
            </div>
            <div data-gedcom-attachment-status aria-live="polite"></div>
        </section>
        <div class="gedcom-preview" data-gedcom-warnings></div>
        </div><div class="modal-footer gedcom-import-footer">
        <p class="gedcom-session-note">${escapeHtml(t('Imported projects stay in this session. Reloading discards them and any edits.'))}</p>
        <div class="gedcom-import-footer-actions">
            <button class="button secondary" type="button" data-close>${escapeHtml(t('Cancel'))}</button>
            <button class="button primary" type="submit" hidden disabled>${escapeHtml(t('Import to new project'))}</button>
        </div></div></form></div>`);
    const form = modalBackdrop.querySelector('[data-gedcom-import]');
    const find = selector => form.querySelector(selector);
    const input = find('#gedcomFile');
    const choose = find('[data-gedcom-choose]');
    const fileName = find('[data-gedcom-file-name]');
    const version = find('[data-gedcom-version]');
    const name = find('#gedcomProjectName');
    const preview = find('[data-gedcom-preview]');
    const warnings = find('[data-gedcom-warnings]');
    const error = find('[data-gedcom-error]');
    const submit = find('[type="submit"]');
    const attachments = find('[data-gedcom-attachments]');
    const folderInput = find('[data-gedcom-folder]');
    const folderChoose = find('[data-gedcom-folder-choose]');
    const folderRemove = find('[data-gedcom-folder-remove]');
    const folderName = find('[data-gedcom-folder-name]');
    const attachmentHelp = find('[data-gedcom-attachment-help]');
    const attachmentStatus = find('[data-gedcom-attachment-status]');
    const localRow = find('[data-gedcom-local]');
    const onlineRow = find('[data-gedcom-online]');
    const download = find('[data-gedcom-download]');
    const downloadStatus = find('[data-gedcom-download-status]');
    let parsed, project, references, onlineReferences;
    let matches = new Map();
    let onlineMatches = new Map();
    let downloadController;
    let revision = 0;
    const isCurrent = request => form.isConnected && request === revision;
    function showError(failure)
    {
        const detail = failure instanceof GedcomImportError
            ? t(failure.message) + (failure.line ? ' (' + t('Line') + ' ' + failure.line + ')' : '')
            : t('GEDCOM import failed. No project was created.');
        find('[data-gedcom-error-detail]').textContent = detail + (failure.diagnostic ? ' ' + failure.diagnostic : '');
        error.hidden = false;
        error.focus();
    }
    function buildDraft(candidate = parsed, title = name.value.trim() || project.name)
    {
        const stagedReferences = new Map([...references, ...[...onlineReferences].filter(([key]) => onlineMatches.has(key))]);
        const draft = mapGedcomImport(candidate, { ...project, name: title },
            new Map([...matches, ...onlineMatches]), stagedReferences);
        if (draft.errors.length)
        {
            const failure = new GedcomImportError('The GEDCOM records could not be validated.');
            failure.diagnostic = draft.errors[0];
            throw failure;
        }
        return draft;
    }
    function renderPreview(draft)
    {
        const report = gedcomImportReport(draft);
        preview.innerHTML = gedcomImportSummary(report);
        warnings.innerHTML = gedcomImportWarnings(report);
        attachmentStatus.innerHTML = gedcomAttachmentSummary(report);
    }
    function clearFolder()
    {
        folderInput.value = '';
        matches = new Map();
        folderChoose.textContent = t('Select folder');
        folderRemove.hidden = folderName.hidden = true;
        folderName.textContent = folderName.title = '';
        attachmentHelp.hidden = !references?.size;
        attachmentStatus.replaceChildren();
    }
    async function readFile(file)
    {
        if (!file) return;
        const request = ++revision;
        parsed = null;
        downloadController?.abort();
        onlineMatches = new Map();
        downloadStatus.textContent = '';
        download.disabled = false;
        folderChoose.disabled = folderRemove.disabled = false;
        clearFolder();
        preview.replaceChildren();
        warnings.replaceChildren();
        choose.querySelector('span').textContent = t('Change file');
        fileName.textContent = fileName.title = file.name;
        version.hidden = true;
        fileName.parentElement.hidden = false;
        error.hidden = true;
        submit.hidden = submit.disabled = name.disabled = attachments.hidden = true;
        name.closest('[data-gedcom-name]').hidden = true;
        try
        {
            if (!/\.ged$/i.test(file.name)) throw new GedcomImportError('Choose a .ged file.');
            if (!file.size || file.size > GEDCOM_IMPORT_LIMITS.bytes)
                throw new GedcomImportError('Choose a nonempty GEDCOM file up to 64 MiB.');
            preview.textContent = t('Reading GEDCOM…');
            const bytes = await file.arrayBuffer();
            if (!isCurrent(request)) return;
            const candidate = parseGedcomImport(decodeGedcomImport(bytes));
            name.value = file.name.replace(/\.ged$/i, '').trim().slice(0, 120) || t('Imported family tree');
            project = gedcomDraftMetadata(name.value);
            references = gedcomAttachmentReferences(candidate);
            onlineReferences = gedcomAttachmentReferences(candidate, true);
            const draft = buildDraft(candidate);
            parsed = candidate;
            version.textContent = 'GEDCOM ' + parsed.version;
            version.hidden = false;
            renderPreview(draft);
            name.closest('[data-gedcom-name]').hidden = false;
            submit.hidden = submit.disabled = name.disabled = false;
            attachments.hidden = !references.size && !onlineReferences.size;
            localRow.hidden = !references.size;
            onlineRow.hidden = !onlineReferences.size;
            attachmentHelp.hidden = !references.size;
            attachmentStatus.replaceChildren();
            if (references.size)
            {
                attachments.hidden = false;
                attachmentHelp.textContent = t('Select the folder with the files for this GEDCOM.');
                attachmentStatus.replaceChildren();
            }
            name.focus();
        }
        catch (failure)
        {
            if (!isCurrent(request)) return;
            preview.replaceChildren();
            showError(failure);
        }
    }
    choose.addEventListener('click', () => input.click());
    input.addEventListener('change', () =>
    {
        const file = input.files[0];
        input.value = '';
        readFile(file);
    });
    folderChoose.addEventListener('click', () => folderInput.click());
    folderInput.addEventListener('change', async () =>
    {
        const files = [...folderInput.files];
        folderInput.value = '';
        if (!parsed || !files.length) return;
        const request = ++revision;
        error.hidden = true;
        folderChoose.textContent = t('Change folder');
        const roots = new Set(files.map(file => file.webkitRelativePath?.split('/')[0] || ''));
        const root = roots.size === 1 ? roots.values().next().value : '';
        folderName.textContent = folderName.title = root.trim() || t('Selected folder');
        folderRemove.hidden = folderName.hidden = false;
        attachmentHelp.hidden = true;
        submit.disabled = true;
        download.disabled = true;
        attachmentStatus.textContent = t('Looking for referenced files…');
        try
        {
            const result = await matchGedcomAttachments(references, files, () => isCurrent(request), onlineMatches);
            if (!isCurrent(request)) return;
            matches = result;
            renderPreview(buildDraft());
        }
        catch
        {
            if (!isCurrent(request)) return;
            matches = new Map();
            renderPreview(buildDraft());
            attachmentStatus.textContent = t('The folder could not be read. Select another folder or continue without attachments.');
        }
        finally { if (isCurrent(request)) submit.disabled = download.disabled = false; }
    });
    function removeFolder()
    {
        ++revision;
        clearFolder();
        renderPreview(buildDraft());
        if (!onlineMatches.size)
            attachmentStatus.insertAdjacentHTML('afterbegin', '<p>' + escapeHtml(t('Attachments will be skipped.')) + '</p>');
        submit.disabled = download.disabled = false;
        folderChoose.focus();
    }
    folderRemove.addEventListener('click', removeFolder);
    download.addEventListener('click', async () =>
    {
        if (!parsed || download.disabled) return;
        const request = ++revision;
        const controller = new AbortController();
        downloadController = controller;
        const closeObserver = new MutationObserver(() =>
        {
            if (!form.isConnected) controller.abort();
        });
        closeObserver.observe(modalBackdrop, { childList: true });
        download.disabled = folderChoose.disabled = folderRemove.disabled = submit.disabled = true;
        const progress = done =>
        {
            if (isCurrent(request))
                downloadStatus.textContent = t('Downloading linked photos: {done} of {total}')
                    .replace('{done}', done).replace('{total}', onlineReferences.size);
        };
        progress(0);
        try
        {
            const result = await downloadGedcomPhotos(onlineReferences, matches, controller.signal, progress);
            if (!isCurrent(request)) return;
            onlineMatches = result;
            renderPreview(buildDraft());
            downloadStatus.textContent = '';
        }
        catch
        {
            if (isCurrent(request)) downloadStatus.textContent = t('Linked photo could not be downloaded');
        }
        finally
        {
            closeObserver.disconnect();
            if (isCurrent(request)) download.disabled = folderChoose.disabled = folderRemove.disabled = submit.disabled = false;
        }
    });
    form.addEventListener('submit', event =>
    {
        event.preventDefault();
        if (!parsed || !name.value.trim() || submit.disabled) return;
        submit.disabled = true;
        error.hidden = true;
        let draft, report;
        try
        {
            draft = buildDraft();
            report = gedcomImportReport(draft);
            commitGedcomImport(draft, report);
        }
        catch (failure)
        {
            showError(failure);
            submit.disabled = false;
            return;
        }
        closeModal();

        showGedcomImportResult(report);
    });
}

function showGedcomImportResult(report)
{
    openModal('<div class="modal" role="dialog" aria-modal="true" aria-labelledby="gedcomResultTitle">'
        + '<div class="modal-header"><h2 id="gedcomResultTitle">' + escapeHtml(t('GEDCOM imported')) + '</h2></div>'
        + '<div class="modal-body">' + gedcomImportSummary(report) + gedcomAttachmentSummary(report, true)
        + '<p>' + escapeHtml(t('Imported projects stay in this session. Reloading discards them and any edits.')) + '</p>' + gedcomImportWarnings(report) + '</div>'
        + '<div class="modal-footer"><button class="button primary" type="button" data-close>'
        + escapeHtml(t('Done')) + '</button></div></div>');
}
