const GEDCOM_IMPORT_LIMITS = Object.freeze({
    bytes: 8 * 1024 * 1024,
    lines: 120000,
    lineLength: 4096,
    records: 15000,
    depth: 32,
    parseMilliseconds: 1500
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
        throw new GedcomImportError('Choose a nonempty GEDCOM file up to 8 MiB.');
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

function parseGedcomImport(text)
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
        const match = /^(0|[1-9][0-9]?) +(?:(@[^@\s]+@) +)?([A-Z_][A-Z0-9_]*)(?: +(.*))?$/.exec(raw);
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
        const [, , xref, tag, value = ''] = match;
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
    return { roots: roots.slice(1, -1), xrefs, version };
}


function parseGedcomDate(text)
{
    const splitCalendar = date =>
    {
        const marker = /^@#D([^@]+)@\s*/i.exec(date);
        return marker ? [date.slice(marker[0].length), marker[1].toUpperCase()] : [date, ''];
    };
    const [value, outerCalendar] = splitCalendar(text);
    const range = /^BET\s+(.+?)\s+AND\s+(.+)$/i.exec(value);
    const qualified = /^(ABT|EST|BEF|AFT)\s+(.+)$/i.exec(value);
    const types = { ABT: 'About / Circa', EST: 'About / Circa', BEF: 'Before', AFT: 'After' };
    const type = range ? 'Between' : qualified ? types[qualified[1].toUpperCase()] : 'Exact date';
    const [first, firstCalendar] = splitCalendar(range?.[1] || qualified?.[2] || value);
    const [second, secondCalendar] = splitCalendar(range?.[2] || '');
    const calendars = new Set([outerCalendar, firstCalendar, secondCalendar].filter(Boolean));
    const code = calendars.values().next().value || 'GREGORIAN';
    if (calendars.size > 1 || !['GREGORIAN', 'JULIAN'].includes(code) || !first || (range && !second))
        return { valid: false };
    const calendar = code === 'JULIAN' ? 'Julian' : 'Gregorian';
    const result = parseGenealogyDateTextAsType(first, type, { calendar, date2: second });
    if (result.valid) result.value.originalText = text;
    return result;
}

function gedcomLocalPhotoPath(value)
{
    const parts = value.trim().replaceAll('\\', '/').split('/').filter(part => part !== '.');
    return parts.every(part => part && part !== '..' && !part.includes(':')) ? parts.join('/') : '';
}

function gedcomPersonPhotoLinks(node, parsed)
{
    return node.children.filter(child => child.tag === 'OBJE').flatMap(object =>
    {
        const record = parsed.xrefs.get(object.value.trim()) || object;
        if (record.tag !== 'OBJE') return [];
        return record.children.filter(child => child.tag === 'FILE').map(file => ({
            object, record, file, path: gedcomLocalPhotoPath(file.value)
        }));
    });
}

async function readGedcomLocalPhotos(parsed, gedcomFile, folderFiles)
{
    const photos = new Map();
    if (!folderFiles.length) return photos;
    const selectedGedcom = folderFiles.find(file => /\.ged$/i.test(file.name) && file.name === gedcomFile.name
        && file.size === gedcomFile.size);
    const gedcomPath = selectedGedcom?.webkitRelativePath || '';
    const base = gedcomPath.slice(0, gedcomPath.lastIndexOf('/') + 1);
    const candidates = new Map();
    for (const file of folderFiles)
    {
        const path = file.webkitRelativePath;
        if (!path || (base && !path.startsWith(base))) continue;
        const relative = gedcomLocalPhotoPath(path.slice(base ? base.length : path.indexOf('/') + 1));
        for (const key of base ? [relative] : [relative, gedcomLocalPhotoPath(path)])
            if (key) candidates.set(key, file);
    }
    const paths = new Set(parsed.roots.filter(node => node.tag === 'INDI')
        .flatMap(node => gedcomPersonPhotoLinks(node, parsed).map(link => link.path)).filter(Boolean));
    let bytes = 0;
    for (const path of paths)
    {
        const file = candidates.get(path);
        if (!file || photos.size >= 500 || bytes + file.size > 80 * 1024 * 1024) continue;
        try
        {
            photos.set(path, await createPhotoUploadDraft(file));
            bytes += file.size;
        }
        catch { /* Unsupported or unreadable images are counted as unavailable. */ }
    }
    return photos;
}

function mapGedcomImport(parsed, project, localPhotos = new Map())
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
    const missingPhotos = new Set();
    const take = (node, tag) =>
    {
        const values = node.children.filter(child => child.tag === tag);
        if (values.length > 1) throw new GedcomImportError('A GEDCOM record repeats a field that must be unique.', values[1].line);
        if (values[0]) used.add(values[0]);
        return values[0];
    };
    const read = (node, tag) => take(node, tag)?.value.trim() || '';
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
    const readPlace = node =>
    {
        const placeText = read(node, 'PLAC');
        if (placeText && !places.has(placeText))
            places.set(placeText, { id: projectId + '-place-' + (places.size + 1), projectId,
                name: placeText, alternativeNames: [], coordinates: null });
        return { placeId: places.get(placeText)?.id || null, placeText };
    };
    const vital = node =>
    {
        if (!node) return { ...emptyGenealogyDate(), placeId: null, placeText: '' };
        used.add(node);
        const dateNode = take(node, 'DATE');
        const dateText = dateNode?.value.trim() || '';
        const parsedDate = dateText ? parseGedcomDate(dateText) : null;
        const date = parsedDate?.valid ? parsedDate.value : emptyGenealogyDate();
        if (dateText && !parsedDate?.valid)
        {
            date.state = 'unparsed';
            date.originalText = dateText;
            warn('DATE', dateNode.line, 'date-text');
        }
        return { ...date, ...readPlace(node) };
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
            const sex = take(node, 'SEX');
            const gender = sex?.value.trim() === 'M' ? 'male' : sex?.value.trim() === 'F' ? 'female' : 'unknown';
            if (sex && !['M', 'F', 'U', ''].includes(sex.value.trim())) warn('SEX', sex.line);
            const birth = take(node, 'BIRT');
            const death = take(node, 'DEAT');
            const deceased = positiveEvent(death);
            const record = {
                id: projectId + '-person-' + (peopleByXref.size + 1), projectId, names, gender,
                livingStatus: deceased ? 'Deceased' : 'Living',
                birth: vital(positiveEvent(birth) ? birth : null), death: vital(deceased ? death : null),
                profile: {}, events: [], attributes: [], notes: [], citations: [], mediaIds: []
            };
            for (const event of node.children.filter(child => ['BAPM', 'BURI'].includes(child.tag)))
            {
                if (!positiveEvent(event)) continue;
                const { placeId, placeText, ...date } = vital(event);
                record.events.push({ id: record.id + '-event-' + (record.events.length + 1),
                    gedcomTag: event.tag, date, placeId, placeText });
            }
            for (const fact of node.children.filter(child => ['EDUC', 'OCCU', 'RELI'].includes(child.tag)))
            {
                const value = fact.value.trim();
                const place = readPlace(fact);
                if (!value && !place.placeId) continue;
                used.add(fact);
                record.attributes.push({ id: record.id + '-attribute-' + (record.attributes.length + 1),
                    tag: fact.tag, value, ...place });
            }
            for (const link of gedcomPersonPhotoLinks(node, parsed))
            {
                const { path, object, file } = link;
                if (!path) continue;
                const photo = localPhotos.get(path);
                if (!photo)
                {
                    missingPhotos.add(path);
                    continue;
                }
                used.add(object);
                used.add(link.record);
                used.add(file);
                const title = link.record.children.find(child => child.tag === 'TITL');
                const primary = object.children.find(child => child.tag === '_PRIM');
                if (title) used.add(title);
                if (primary) used.add(primary);
                if (!media.has(path))
                {
                    const { filename, src, mimeType, width, height, sizeBytes } = photo;
                    media.set(path, {
                        id: projectId + '-photo-' + (media.size + 1), projectId, kind: 'photo',
                        title: title?.value.trim() || filename, filename, src, mimeType, width, height, sizeBytes,
                        personIds: [], albumIds: [], placeId: null, placeText: '', caption: '', favorite: false,
                        createdAt: project.createdAt, updatedAt: project.modifiedAt
                    });
                }
                const linked = media.get(path);
                if (!linked.personIds.includes(record.id)) linked.personIds.push(record.id);
                if (primary?.value.trim().toUpperCase() === 'Y' && !record.primaryPhotoId)
                    record.primaryPhotoId = linked.id;
            }
            peopleByXref.set(node.xref, record);
        }
        else if (node.tag === 'FAM')
        {
            used.add(node);
            familiesByXref.set(node.xref, { id: projectId + '-family-' + (familiesByXref.size + 1),
                projectId, type: 'family', gedcomXref: node.xref, partnerAId: '', partnerBId: '',
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
        for (const event of node.children.filter(item => ['MARR', 'DIV'].includes(item.tag)))
        {
            if (!positiveEvent(event)) continue;
            const { placeId, placeText, ...date } = vital(event);
            const married = event.tag === 'MARR';
            family.events.push({ id: family.id + '-event-' + (family.events.length + 1), gedcomTag: event.tag,
                eventType: married ? 'Marriage' : 'Divorce', date, placeId, placeText, typeLabel: read(event, 'TYPE') });
        }
        if (family.events.some(event => event.gedcomTag === 'DIV'))
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

    const parentage = [];
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
                    warn('STAT', status.line);
                    continue;
                }
                if (!family.childIds.includes(person.id)) family.childIds.push(person.id);
                const pedigree = take(link, 'PEDI');
                const type = new Map([['birth', 'Biological'], ['adopted', 'Adoptive'], ['foster', 'Foster']])
                    .get(pedigree?.value.trim().toLowerCase());
                if (type && !(type === 'Adoptive' && adoptions.has(link.value.trim()))) parentage.push({ family, person, type });
                else if (pedigree) warn('PEDI', pedigree.line);
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
            if (!role || !['HUSB', 'WIFE', 'BOTH'].includes(choice)) continue;
            const family = resolve(familiesByXref, link);
            const parents = [
                ['HUSB', family.partnerAId, family.partnerARoleHint],
                ['WIFE', family.partnerBId, family.partnerBRoleHint]
            ].filter(([tag, id, hint]) => id && (choice === 'BOTH' || (choice === tag && hint === tag)));
            if (!parents.length || (choice === 'BOTH' && parents.length !== 2))
            {
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

    function account(node)
    {
        checkDeadline();
        if (!used.has(node)) warn(node.tag, node.line);
        for (const child of node.children) account(child);
    }
    for (const node of parsed.roots) account(node);

    const people = [...peopleByXref.values()];
    const families = [...familiesByXref.values()];
    if (!people.length) throw new GedcomImportError('The GEDCOM file contains no people.');
    const records = { people, families, places: [...places.values()], media: [...media.values()] };
    const draft = prepareProjectDraft({ ...project, defaultPersonId: people[0].id }, records);
    if (draft.errors.length) return { errors: draft.errors };
    return { ...draft, warnings: [...warnings.values()], missingPhotos: missingPhotos.size };
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

function commitGedcomImport(draft)
{
    const previous = { projects: sampleData.projects };
    const next = { projects: [...sampleData.projects, draft.project] };
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
        if (!activateProject(draft.project.id, { moduleName: 'Family Tree' }))
            throw new Error('Project activation failed');
    }
    catch (error)
    {
        const viewChanged = state.currentProjectId !== previousState.currentProjectId
            || state.activeModule !== previousState.activeModule;
        Object.assign(sampleData, previous);
        Object.assign(state, previousState);
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
}

const gedcomImportReports = new Map();

function gedcomImportReport(draft)
{
    const { people, families, places } = draft.records;
    const relationships = families.reduce((count, family) =>
        count + Number(Boolean(family.partnerAId && family.partnerBId))
            + family.childIds.length * (Number(Boolean(family.partnerAId)) + Number(Boolean(family.partnerBId))), 0);
    const facts = people.reduce((count, person) => count + person.events.length + person.attributes.length
        + Number(person.birth.state !== 'empty' || Boolean(person.birth.placeId))
        + Number(person.livingStatus === 'Deceased'), 0)
        + families.reduce((count, family) => count + family.events.length, 0);
    const rows = [['People', people.length], ['Families', families.length], ['Relationships', relationships],
        ['Places', places.length], ['Facts', facts]];
    if (draft.records.media?.length || draft.missingPhotos) rows.push(['Photos', draft.records.media.length]);
    if (draft.missingPhotos) rows.push(['Local photos unavailable', draft.missingPhotos]);
    const authored = Object.fromEntries(PROJECT_DRAFT_COLLECTIONS.filter(key => draft.records[key])
        .map(key => [key, draft.records[key]]));
    const authoredCount = Object.values(authored).reduce((count, records) => count + records.length, 0);
    const manifestBytes = new TextEncoder().encode(JSON.stringify({
        project: draft.project, records: authored
    })).byteLength;
    return { rows, warnings: draft.warnings, overBackupRecordLimit: authoredCount > 50000,
        overBackupManifestLimit: manifestBytes > 32 * 1024 * 1024 };
}

function gedcomImportSummary(report)
{
    const { rows } = report;
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
    return '<dl class="gedcom-counts">' + rows.map(([label, value]) => '<div><dt>' + escapeHtml(t(label)) + '</dt><dd>' + value + '</dd></div>').join('')
        + '</dl><p class="gedcom-session-note">' + escapeHtml(t('People without a recorded death are imported as living.')) + '</p>'
        + warningGroup('skipped', 'Skipped or unsupported GEDCOM data')
        + warningGroup('date-text', 'Dates preserved as text')
        + (report.overBackupRecordLimit ? '<p>' + escapeHtml(t('This project exceeds the 50,000-record limit for project backups.')) + '</p>' : '')
        + (report.overBackupManifestLimit ? '<p>' + escapeHtml(t('This project exceeds the 32 MiB metadata limit for project backups.')) + '</p>' : '');
}

function openImportModal(initialFile = null)
{
    openModal(`<div class="modal" role="dialog" aria-modal="true" aria-labelledby="importTitle">
        <div class="modal-header"><h2 id="importTitle">${escapeHtml(t('Import GEDCOM'))}</h2>
        <button class="close-button" type="button" data-close aria-label="${escapeHtml(t('Close'))}">${icon.close}</button></div>
        <form data-gedcom-import><div class="modal-body gedcom-import-body">
        <div class="gedcom-file-row">
            <button type="button" class="button secondary" data-gedcom-choose data-modal-initial-focus>${icon.import}${escapeHtml(t('Choose file'))}</button>
            <span class="gedcom-file-name" data-gedcom-file-name role="status" data-user-content>${escapeHtml(t('Supports .ged files'))}</span>
            <input id="gedcomFile" type="file" accept=".ged" hidden>
            <button type="button" class="button secondary" data-gedcom-folder-choose>${escapeHtml(t('Choose folder'))}</button>
            <input type="file" webkitdirectory multiple data-gedcom-folder hidden>
        </div>
        <div class="field full" data-gedcom-name hidden><label for="gedcomProjectName">${escapeHtml(t('Project name'))}</label><input id="gedcomProjectName" maxlength="120" required disabled></div>
        <div class="gedcom-preview" data-gedcom-preview aria-live="polite"></div>
        <p class="gedcom-error" data-gedcom-error role="alert"></p>
        <p class="gedcom-session-note">${escapeHtml(t('Imported projects stay in this session. Reloading discards them and any edits.'))}</p>
        </div><div class="modal-footer"><button class="button secondary" type="button" data-close>${escapeHtml(t('Cancel'))}</button>
        <button class="button primary" type="submit" disabled>${escapeHtml(t('Import to new project'))}</button></div></form></div>`);
    const form = modalBackdrop.querySelector('[data-gedcom-import]');
    const input = form.querySelector('#gedcomFile');
    const fileName = form.querySelector('[data-gedcom-file-name]');
    form.querySelector('[data-gedcom-choose]').addEventListener('click', () => input.click());
    const name = form.querySelector('#gedcomProjectName');
    const preview = form.querySelector('[data-gedcom-preview]');
    const error = form.querySelector('[data-gedcom-error]');
    const submit = form.querySelector('[type="submit"]');
    let parsed = null;
    let selectedFile = null;
    let folderFiles = [];
    let localPhotos = new Map();
    const folderInput = form.querySelector('[data-gedcom-folder]');
    form.querySelector('[data-gedcom-folder-choose]').addEventListener('click', () => folderInput.click());
    let readSequence = 0;
    const showError = failure =>
    {
        error.textContent = failure instanceof GedcomImportError
            ? t(failure.message) + (failure.line ? ' (' + t('Line') + ' ' + failure.line + ')' : '')
            : t('GEDCOM import failed. No project was created.');
    };
    async function readFile(file)
    {
        const sequence = ++readSequence;
        selectedFile = file;
        parsed = null;
        preview.replaceChildren();
        fileName.textContent = file?.name || t('Supports .ged files');
        error.textContent = '';
        submit.disabled = name.disabled = true;
        name.closest('[data-gedcom-name]').hidden = true;
        if (!file) return;
        try
        {
            if (!/\.ged$/i.test(file.name)) throw new GedcomImportError('Choose a .ged file.');
            if (!file.size || file.size > GEDCOM_IMPORT_LIMITS.bytes)
                throw new GedcomImportError('Choose a nonempty GEDCOM file up to 8 MiB.');
            const bytes = await file.arrayBuffer();
            if (!form.isConnected || sequence !== readSequence) return;
            const candidate = parseGedcomImport(decodeGedcomImport(bytes));
            name.value = file.name.replace(/\.ged$/i, '').trim().slice(0, 120) || t('Imported family tree');
            const matched = await readGedcomLocalPhotos(candidate, file, folderFiles);
            if (!form.isConnected || sequence !== readSequence) return;
            localPhotos = matched;
            const draft = mapGedcomImport(candidate, gedcomDraftMetadata(name.value), localPhotos);
            if (draft.errors.length)
            {
                error.textContent = t('The GEDCOM records could not be validated.') + ' ' + draft.errors[0];
                return;
            }
            parsed = candidate;
            preview.innerHTML = '<p class="gedcom-file-version">GEDCOM ' + candidate.version + '</p>' + gedcomImportSummary(gedcomImportReport(draft));
            name.closest('[data-gedcom-name]').hidden = false;
            submit.disabled = name.disabled = false;
        }
        catch (failure)
        {
            if (form.isConnected && sequence === readSequence) showError(failure);
        }
    }
    input.addEventListener('change', () => readFile(input.files[0]));
    folderInput.addEventListener('change', () =>
    {
        folderFiles = [...folderInput.files];
        if (!folderFiles.length) return;
        if (selectedFile) { readFile(selectedFile); return; }
        const gedcomFiles = folderFiles.filter(file => /\.ged$/i.test(file.name));
        if (gedcomFiles.length === 1) readFile(gedcomFiles[0]);
        else error.textContent = t('Choose the GEDCOM file to match photos from this folder.');
    });
    form.addEventListener('submit', event =>
    {
        event.preventDefault();
        const value = name.value.trim();
        if (!parsed || !value || submit.disabled) return;
        submit.disabled = true;
        error.textContent = '';
        try
        {
            const draft = mapGedcomImport(parsed, gedcomDraftMetadata(value), localPhotos);
            if (draft.errors.length)
            {
                error.textContent = t('The GEDCOM records could not be validated.') + ' ' + draft.errors[0];
                return;
            }
            commitGedcomImport(draft);
            closeModal();
            const report = gedcomImportReport(draft);
            gedcomImportReports.set(draft.project.id, report);
            showGedcomImportResult(report);
        }
        catch (failure) { showError(failure); }
        finally { if (form.isConnected) submit.disabled = false; }
    });
    if (initialFile) readFile(initialFile);
}

function showGedcomImportResult(report)
{
    openModal('<div class="modal" role="dialog" aria-modal="true" aria-labelledby="gedcomResultTitle">'
        + '<div class="modal-header"><h2 id="gedcomResultTitle">' + escapeHtml(t('GEDCOM imported')) + '</h2></div>'
        + '<div class="modal-body">' + gedcomImportSummary(report)
        + '<p>' + escapeHtml(t('Imported projects stay in this session. Reloading discards them and any edits.')) + '</p></div>'
        + '<div class="modal-footer"><button class="button primary" type="button" data-close>'
        + escapeHtml(t('Done')) + '</button></div></div>');
}

function bindGedcomDropzone(zone)
{
    if (!zone) return;
    zone.addEventListener('click', () => openImportModal());
    zone.addEventListener('dragover', event => event.preventDefault());
    zone.addEventListener('drop', event =>
    {
        event.preventDefault();
        const file = event.dataTransfer.files[0];
        if (file) openImportModal(file);
    });
}
