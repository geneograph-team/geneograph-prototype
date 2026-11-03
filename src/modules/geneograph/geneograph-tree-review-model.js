// Review plans operate only on detached records. Live writes happen in the transaction below.
let geneoTreeImportDraft = null;

const GENEO_REVIEW_FACTS = [
    ['names.first', 'First name'], ['names.middle', 'Middle name'],
    ['names.last', 'Last name'], ['names.maiden', 'Maiden name'],
    ['gender', 'Gender'], ['livingStatus', 'Living status'],
    ['birth.date', 'Birth date'], ['birth.place', 'Birth place'],
    ['death.date', 'Death date'], ['death.place', 'Death place']
];

function geneoReviewEqual(left, right)
{
    const stable = value =>
    {
        if (Array.isArray(value)) return value.map(stable);
        if (value && typeof value === 'object')
        {
            if (value.first && value.dateType)
                value = Object.fromEntries(Object.entries(value).filter(([key]) => !['date', 'dateLabel', 'sortDate', 'date2', 'date2Label', 'sortDate2', 'originalText'].includes(key)));
            return Object.fromEntries(Object.keys(value).sort().filter(key => value[key] !== undefined).map(key => [key, stable(value[key])]));
        }
        return value ?? null;
    };
    return JSON.stringify(stable(left)) === JSON.stringify(stable(right));
}

function geneoReviewFact(person, key)
{
    if (!person) return undefined;
    if (key.startsWith('names.')) return person.names?.[key.slice(6)] || '';
    if (!key.includes('.')) return person[key] || (key === 'gender' ? 'unknown' : 'Unknown');
    const [vital, part] = key.split('.');
    const value = person[vital] || emptyGenealogyDate('Exact date');
    if (part === 'place') return { placeId: value.placeId || null, placeText: value.placeText || '', address: value.address || '' };
    const date = normalizeGenealogyDateInput(structuredClone(value), 'Exact date');
    return Object.fromEntries(['state', 'dateType', 'calendar', 'first', 'second', 'originalText'].map(field => [field, date[field]]));
}

function geneoReviewFactEmpty(value)
{
    if (value?.state) return value.state === 'empty';
    if (value?.dateType === 'Unknown') return false;
    if (value && typeof value === 'object')
        return !Object.entries(value).some(([key, item]) => !['dateType', 'calendar', 'dateKind'].includes(key) && Boolean(item));
    return value === '' || value === null;
}

function geneoReviewFactText(person, key)
{
    const value = geneoReviewFact(person, key);
    if (value === undefined) return t('Unavailable');
    if (geneoReviewFactEmpty(value)) return t('Empty');
    if (value?.state === 'unknown' || value?.dateType === 'Unknown') return t('Unknown');
    if (key.endsWith('.date')) return formatGenealogyDateLabel(person[key.split('.')[0]]) || t('Empty');
    if (key.endsWith('.place')) return geneoPersonPlaceLabel(person[key.split('.')[0]]) || t('Empty');
    if (key === 'gender') return t({ male: 'Male', female: 'Female', unknown: 'Unknown' }[value] || String(value));
    return t(String(value));
}

function geneoTreeImportFields(boardPerson, treePerson)
{
    return GENEO_REVIEW_FACTS.filter(([key]) => !geneoReviewEqual(geneoReviewFact(boardPerson, key), geneoReviewFact(treePerson, key)))
        .map(([key, label]) => [key, label, geneoReviewFactText(boardPerson, key), geneoReviewFactText(treePerson, key)]);
}

function geneoReviewSetFact(target, key, value)
{
    if (key.startsWith('names.'))
    {
        target.names = target.names || {};
        target.names[key.slice(6)] = value;
        target.names.display = [target.names.first, target.names.middle, target.names.last].filter(Boolean).join(' ');
        target.names.initials = `${target.names.first?.[0] || ''}${target.names.last?.[0] || ''}`.toUpperCase();
    }
    else if (!key.includes('.')) target[key] = value;
    else
    {
        const [vital, part] = key.split('.');
        const existing = target[vital] || emptyGenealogyDate('Exact date');
        target[vital] = normalizeGenealogyDateInput({ ...structuredClone(existing), ...structuredClone(value) });
    }
}

function geneoTreeImportNewPerson(person, id, projectId)
{
    const names = normalizeGeneographPersonNames(person);
    return { id, projectId, names: { ...names, display: geneoPersonDisplayName(person), initials: geneoPersonInitials(person) },
        gender: person.gender || 'unknown', livingStatus: person.livingStatus || 'Unknown', avatarClass: '',
        birth: structuredClone(person.birth || emptyGenealogyDate('Exact date')),
        death: structuredClone(person.death || emptyGenealogyDate('Exact date')),
        profile: { alternativeNames: null }, attributes: [], events: [], notes: [], citations: [],
        familyAsSpouseIds: [], familyAsChildIds: [], counts: { files: 0, notes: 0 },
        meta: { updated: 'Just now', sourceStatus: 'Unsourced' } };
}

function geneoTreeImportRelations(diagram, ids)
{
    const relations = [];
    for (const family of diagram.families)
    {
        const parents = family.partnerIds.filter(id => ids.has(id));
        if (parents.length === 2) relations.push({ id: `${family.id}:partner`, type: 'partner', ids: parents, familyId: family.id });
        for (const child of family.children)
            if (ids.has(child.personId) && parents.length)
                relations.push({ id: `${family.id}:child:${child.personId}`, type: 'child', ids: [...parents, child.personId], familyId: family.id });
    }
    for (const connection of diagram.connections.filter(item => item.kind === 'family-sibling'))
    {
        const people = [connection.source?.nodeId, connection.target?.nodeId]
            .map(id => diagram.nodes.find(node => node.id === id)?.personId).filter(id => ids.has(id));
        if (people.length === 2) relations.push({ id: connection.id, type: 'sibling', ids: people });
    }
    return relations;
}

function geneoReviewGraph(diagram)
{
    const graph = new Map(diagram.people.map(person => [person.id, []]));
    const join = (from, to, role, qualifier = '') =>
    {
        if (graph.has(from) && graph.has(to) && from !== to && !graph.get(from).some(edge => edge.id === to && edge.role === role))
            graph.get(from).push({ id: to, role, qualifier });
    };
    for (const family of diagram.families)
    {
        for (const parent of family.partnerIds)
        {
            for (const other of family.partnerIds) join(parent, other, 'Partners', family.relationshipType);
            for (const child of family.children)
            {
                join(parent, child.personId, 'Children', child.parentageType);
                join(child.personId, parent, 'Parents', child.parentageType);
            }
        }
        for (const child of family.children)
            for (const other of family.children) join(child.personId, other.personId, 'Siblings');
    }
    for (const relation of geneoTreeImportRelations(diagram, new Set(graph.keys())).filter(item => item.type === 'sibling'))
    {
        join(relation.ids[0], relation.ids[1], 'Siblings');
        join(relation.ids[1], relation.ids[0], 'Siblings');
    }
    return graph;
}

function geneoReviewRoles(diagram, anchorId)
{
    const graph = geneoReviewGraph(diagram);
    const roles = new Map([[anchorId, { group: 'Anchor person', path: [] }]]);
    const queue = [anchorId];
    while (queue.length)
    {
        const from = queue.shift();
        for (const edge of graph.get(from) || [])
        {
            if (roles.has(edge.id)) continue;
            const path = [...roles.get(from).path, { ...edge, from }];
            roles.set(edge.id, { group: path.length === 1 ? edge.role : 'Extended family', path });
            queue.push(edge.id);
        }
    }
    return roles;
}

function geneoTreeImportGroup(diagram, anchorId)
{
    const roles = geneoReviewRoles(diagram, anchorId);
    return diagram.people.filter(person => roles.has(person.id));
}

function geneoReviewParents(families, childId)
{
    return new Set(families.filter(family => (family.childIds || family.childrenIds || []).includes(childId))
        .flatMap(family => [familyPartnerAId(family), familyPartnerBId(family)]).filter(Boolean));
}

function geneoTreeImportMatches(person, projectId, draft = geneoTreeImportDraft)
{
    const names = normalizeGeneographPersonNames(person);
    const name = geneoPersonDisplayName(person).toLocaleLowerCase();
    const graph = draft ? geneoReviewGraph(draft.diagram) : new Map();
    const families = sampleData.families.filter(family => family.projectId === projectId);
    return getPeople(projectId).filter(candidate => !candidate.deleted).map(candidate =>
    {
        const compatibleName = Boolean(names.first || names.last) && (connectPersonName(candidate).toLocaleLowerCase() === name
            || Boolean(names.first && names.last && candidate.names?.first?.toLocaleLowerCase() === names.first.toLocaleLowerCase()
                && candidate.names?.last?.toLocaleLowerCase() === names.last.toLocaleLowerCase()));
        const birth = geneoReviewFact(person, 'birth.date');
        const otherBirth = geneoReviewFact(candidate, 'birth.date');
        const recordedBirth = !geneoReviewFactEmpty(birth) && !geneoReviewFactEmpty(otherBirth);
        const birthAgrees = recordedBirth && Boolean(birth.first?.year && otherBirth.first?.year) && genealogyDatesCompatible(birth, otherBirth);
        const givenNameAgrees = Boolean(names.first) && names.first.trim().toLocaleLowerCase() === candidate.names?.first?.trim().toLocaleLowerCase();
        const vitalConflict = person.gender !== 'unknown' && candidate.gender !== 'unknown' && person.gender !== candidate.gender
            || person.livingStatus !== 'Unknown' && candidate.livingStatus !== 'Unknown' && person.livingStatus !== candidate.livingStatus
            || ['birth.date', 'death.date'].some(key =>
            !geneoReviewFactEmpty(geneoReviewFact(person, key)) && !geneoReviewFactEmpty(geneoReviewFact(candidate, key))
            && !genealogyDatesCompatible(geneoReviewFact(person, key), geneoReviewFact(candidate, key)));
        const context = [];
        for (const edge of graph.get(person.id) || [])
        {
            const relativeId = draft?.choices.get(edge.id);
            if (!relativeId || ['skip', 'create', 'unlink'].includes(relativeId)) continue;
            const related = edge.role === 'Parents' ? geneoReviewParents(families, candidate.id).has(relativeId)
                : edge.role === 'Children' ? geneoReviewParents(families, relativeId).has(candidate.id)
                    : edge.role === 'Partners' ? families.some(family => [familyPartnerAId(family), familyPartnerBId(family)].includes(candidate.id)
                        && [familyPartnerAId(family), familyPartnerBId(family)].includes(relativeId))
                        : [...geneoReviewParents(families, candidate.id)].some(id => geneoReviewParents(families, relativeId).has(id));
            if (related) context.push(connectPersonName(getPerson(relativeId)));
        }
        const score = context.length * 200 + (compatibleName ? 100 : 0) + (birthAgrees ? 40 : 0)
            + (names.last && candidate.names?.last === names.last ? 10 : 0);
        const eligible = !vitalConflict && (compatibleName || givenNameAgrees && birthAgrees);
        return { person: candidate, score, context, eligible, strong: eligible && context.length > 0 && compatibleName && birthAgrees };
    }).sort((a, b) => b.score - a.score || connectPersonName(a.person).localeCompare(connectPersonName(b.person)));
}

function geneoReviewFamilyParents(family)
{
    return [familyPartnerAId(family), familyPartnerBId(family)].filter(Boolean);
}

function geneoReviewAllRelations(draft)
{
    const relations = [...draft.relations];
    const boardByTree = new Map(draft.people.map(person => [draft.choices.get(person.id), person.id])
        .filter(([id]) => id && !['create', 'skip', 'unlink'].includes(id) && sampleData.people.some(person => person.id === id && !person.deleted && person.projectId === draft.projectId)));
    for (const family of sampleData.families.filter(item => item.projectId === draft.projectId))
    {
        const parents = geneoReviewFamilyParents(family);
        const boardId = id => boardByTree.get(id) || draft.treeBoardPeople?.get(id)?.id;
        const boardParents = parents.map(boardId);
        const children = family.childIds || [];
        if (!parents.length || boardParents.some(id => !id) || ![...parents, ...children].some(id => boardByTree.has(id))) continue;
        for (const child of children.filter(id => boardByTree.has(id)))
        {
            for (const sibling of children.filter(id => id !== child && boardId(id)))
            {
                const key = `tree:${family.id}:sibling:${[child, sibling].sort().join(':')}`;
                const ids = [boardId(child), boardId(sibling)];
                if (!relations.some(relation => relation.id === key || relation.type === 'sibling' && geneoReviewEqual([...relation.ids].sort(), [...ids].sort())))
                    relations.push({ id: key, type: 'sibling', ids, treeIds: [child, sibling], treeFamilyId: family.id, origin: 'tree' });
            }
        }
        if (parents.length === 2 && !relations.some(relation => relation.type === 'partner' && geneoReviewEqual([...relation.ids].sort(), [...boardParents].sort())))
        {
            if (parents.some(id => boardByTree.has(id)))
                relations.push({ id: `tree:${family.id}:partner`, type: 'partner', ids: boardParents, treeIds: parents, treeFamilyId: family.id, origin: 'tree' });
        }
        for (const childId of children)
        {
            const child = boardId(childId);
            if (!child || ![...parents, childId].some(id => boardByTree.has(id))) continue;
            if (boardByTree.has(childId) && parents.some(id => !boardByTree.has(id)))
            {
                for (const parent of parents)
                {
                    const ids = [boardId(parent), child];
                    if (relations.some(relation => relation.type === 'child' && relation.ids.at(-1) === child && relation.ids.includes(ids[0]))) continue;
                    relations.push({ id: `tree:${family.id}:child:${childId}:parent:${parent}`, type: 'child', ids,
                        treeIds: [parent, childId], treeFamilyId: family.id, origin: 'tree' });
                }
                continue;
            }
            if (!child || relations.some(relation => relation.type === 'child' && relation.ids.at(-1) === child
                && geneoReviewEqual(relation.ids.slice(0, -1).sort(), [...boardParents].sort()))) continue;
            relations.push({ id: `tree:${family.id}:child:${childId}`, type: 'child', ids: [...boardParents, child], treeIds: [...parents, childId], treeFamilyId: family.id, origin: 'tree' });
        }
    }
    return relations;
}

function geneoReviewRelationshipData(family)
{
    if (!family) return null;
    const type = family.relationshipType || 'Unknown relationship';
    const start = partnerRelationshipStartEvent(family, type);
    const end = partnerRelationshipEndEvent(family, type);
    const events = [...(family.events || []).filter(event => event.relationshipManagedRole || ['MARR', 'DIV', 'ANUL'].includes(event.gedcomTag))];
    for (const [event, role] of [[start, 'start'], [end, 'end']])
        if (event && !events.some(item => item.id === event.id)) events.push({ ...event, relationshipManagedRole: role });
    return { relationshipType: type, relationshipStatus: family.relationshipStatus || partnerRelationshipDefinition(type).status,
        marriageType: family.marriageType || '', events: events.map(event => ({
            gedcomTag: event.gedcomTag || event.tag || '', eventType: event.eventType || '', typeLabel: event.typeLabel || '',
            date: normalizeGenealogyDateInput(structuredClone(event.date || event)),
            placeId: event.placeId || null, placeText: event.placeText || '', address: event.address || '',
            relationshipManagedRole: event.relationshipManagedRole || (event.id === start?.id ? 'start' : event.id === end?.id ? 'end' : '')
        })) };
}

function geneoReviewCopyRelationship(from, to)
{
    const data = geneoReviewRelationshipData(from);
    const events = data.events;
    delete data.events;
    Object.assign(to, structuredClone(data));
    const unmanaged = (to.events || []).filter(event => !event.relationshipManagedRole && !['MARR', 'DIV', 'ANUL'].includes(event.gedcomTag));
    const previous = to.events || [];
    to.events = [...unmanaged, ...events.map((event, index) =>
    {
        const existing = previous.find(item => event.relationshipManagedRole
            ? item.relationshipManagedRole === event.relationshipManagedRole || item.gedcomTag === event.gedcomTag
            : item.gedcomTag === event.gedcomTag && item.typeLabel === event.typeLabel);
        return { ...structuredClone(existing || {}), ...structuredClone(event), id: existing?.id || `${to.id}-review-${event.relationshipManagedRole || index}` };
    })];
    for (const event of to.events.filter(item => item.relationshipManagedRole && !Array.isArray(to.partnerIds)))
    {
        const prefix = event.relationshipManagedRole;
        for (const [field, value] of Object.entries(event.date || {}))
            if (['date', 'dateLabel', 'dateType', 'sortDate', 'calendar', 'originalText'].includes(field))
                to[prefix + field[0].toUpperCase() + field.slice(1)] = value;
        for (const field of ['placeId', 'placeText', 'address']) to[prefix + field[0].toUpperCase() + field.slice(1)] = event[field] || (field === 'placeId' ? null : '');
    }
}

function geneoReviewParentType(family, child, parentId = '')
{
    const recorded = child.parentChildTypes?.[parentId] || family.parentChildTypes?.[`${parentId}|${child.personId}`] || child.parentageType;
    const type = PARENT_CHILD_RELATIONSHIP_TYPES.find(value => value.toLowerCase() === String(recorded || '').toLowerCase());
    return type || (recorded ? null : 'Biological');
}

function geneoReviewNewFamily(id, projectId, parents)
{
    const [a = '', b = ''] = parents;
    return { id, projectId, type: 'family', partnerAId: a, partnerBId: b, partner1Id: a, partner2Id: b,
        personAId: a, personBId: b, fatherId: '', motherId: '', childIds: [], childrenIds: [],
        relationshipType: 'Unknown relationship', relationshipStatus: 'unknown', marriageType: '',
        parentChildTypes: {}, events: [], nonEvents: [], attributes: [], notes: [], citations: [], mediaIds: [] };
}

function geneoReviewValidatePerson(person, projectId)
{
    if (!person || !['male', 'female', 'unknown'].includes(person.gender) || !['Living', 'Deceased', 'Unknown'].includes(person.livingStatus))
        return 'The resulting person contains an invalid value.';
    for (const key of ['birth', 'death'])
    {
        const vital = person[key] || {};
        if (vital.placeId && !(sampleData.places || []).some(place => place.id === vital.placeId && place.projectId === projectId && !place.deleted))
            return 'A selected place is unavailable in this project.';
        const normalized = normalizeGenealogyDateInput(vital);
        const text = formatGenealogyDateLabel(normalized);
        if (normalized.state === 'unparsed')
            return 'A selected date is invalid. Edit the person before applying it.';
        if (key === 'death' && text && person.livingStatus !== 'Deceased')
            return 'Choose Deceased before copying a recorded death date.';
    }
    return '';
}

function geneoReviewCollection(key, board)
{
    return key.startsWith('board.') ? board.diagram[key.slice(6)] : sampleData[key];
}

function geneoReviewRecordSnapshot(board)
{
    const records = new Map();
    for (const key of ['people', 'families', 'events', 'archiveFiles', 'sourceLinks', 'board.people', 'board.families', 'board.connections', 'board.nodes'])
        for (const record of geneoReviewCollection(key, board) || []) records.set(`${key}:${record.id}`, structuredClone(record));
    return records;
}

function geneoReviewDraft(board, anchorId)
{
    const diagram = structuredClone(board.diagram);
    const represented = new Set(diagram.nodes.filter(node => node.type === 'person').map(node => node.personId));
    const people = diagram.people.filter(person => represented.has(person.id));
    const draft = { boardId: board.id, projectId: board.projectId, diagram, people, anchorId, activePersonId: anchorId,
        scope: 'branch', search: '', status: 'all', summaryOpen: false, mobileDetail: false,
        baseline: geneoReviewRecordSnapshot(board), choices: new Map(people.map(person =>
        {
            const tree = getPerson(person.treePersonId);
            return [person.id, tree && !tree.deleted && tree.projectId === board.projectId ? tree.id : 'skip'];
        })),
        fields: new Map(), relations: geneoTreeImportRelations(diagram, represented), relationChoices: new Map(),
        siblingFamilies: new Map(), siblingFamilyIds: new Map(people.map(person => [person.id, createRuntimeId('family')])),
        parentTypes: new Map(), matchQueries: new Map(), matchEditorOpenId: '',
        transferTypes: new Map(), treeParentChoices: new Map(), treeFamilyChoices: new Map(), relativeTargets: new Map(),
        newIds: new Map(people.map(person => [person.id, createRuntimeId('person')])),
        familyIds: new Map(diagram.families.map(family => [family.id, createRuntimeId('family')])), error: '' };
    geneoReviewPrepareTreeRelationIds(draft);
    return draft;
}

function geneoReviewPrepareTreeRelationIds(draft)
{
    draft.treeFamilyIds = new Map();
    draft.treeSubsetFamilyIds = new Map();
    draft.treeConnectionIds = new Map();
    draft.treeBoardPeople = draft.treeBoardPeople || new Map();
    draft.treeNodeIds = draft.treeNodeIds || new Map();
    for (const person of sampleData.people.filter(item => item.projectId === draft.projectId && !item.deleted))
    {
        const existing = draft.diagram.people.find(item => item.treePersonId === person.id);
        const before = draft.treeBoardPeople.get(person.id);
        const updated = existing ? structuredClone(existing) : createGeneographLinkedBoardPerson(person, draft.projectId);
        if (before && !existing) updated.id = before.id;
        draft.treeBoardPeople.set(person.id, updated);
        if (!draft.treeNodeIds.has(person.id)) draft.treeNodeIds.set(person.id, createRuntimeId('geneo-node'));
    }
    for (const family of sampleData.families.filter(item => item.projectId === draft.projectId))
    {
        draft.treeFamilyIds.set(family.id, createRuntimeId('geneo-family'));
        for (const parent of geneoReviewFamilyParents(family)) draft.treeSubsetFamilyIds.set(`${family.id}|${parent}`, createRuntimeId('geneo-family'));
        draft.treeConnectionIds.set(`tree:${family.id}:partner`, createRuntimeId('geneo-connection'));
        for (const childId of family.childIds || [])
        {
            draft.treeConnectionIds.set(`tree:${family.id}:child:${childId}`, createRuntimeId('geneo-connection'));
            for (const parent of geneoReviewFamilyParents(family))
                draft.treeConnectionIds.set(`tree:${family.id}:child:${childId}:parent:${parent}`, createRuntimeId('geneo-connection'));
            for (const sibling of (family.childIds || []).filter(id => id !== childId))
            {
                const key = `tree:${family.id}:sibling:${[childId, sibling].sort().join(':')}`;
                if (!draft.treeConnectionIds.has(key)) draft.treeConnectionIds.set(key, createRuntimeId('geneo-connection'));
                if (!draft.treeSubsetFamilyIds.has(key)) draft.treeSubsetFamilyIds.set(key, createRuntimeId('geneo-family'));
            }
        }
    }
}

function geneoReviewPersonById(draft, id)
{
    return draft.people.find(person => person.id === id) || [...(draft.treeBoardPeople?.values() || [])].find(person => person.id === id);
}

function geneoReviewTreeFamilyCandidates(draft, relation)
{
    const ids = relation.treeIds || relation.ids.map(id => draft.relativeTargets?.get(`${relation.id}|${id}`) || draft.choices.get(id));
    if (ids.some(id => !id || ['create', 'skip', 'unlink'].includes(id))) return [];
    const parents = relation.type === 'child' ? ids.slice(0, -1) : ids;
    const candidates = sampleData.families.filter(family => family.projectId === draft.projectId
        && (relation.type === 'child' ? (family.childIds || []).includes(ids.at(-1)) && parents.every(parent => geneoReviewFamilyParents(family).includes(parent))
            : geneoReviewEqual(geneoReviewFamilyParents(family).sort(), [...parents].sort())));
    const exact = candidates.filter(family => geneoReviewEqual(geneoReviewFamilyParents(family).sort(), [...parents].sort()));
    return exact.length ? exact : candidates;
}

function geneoReviewPlaceTreeCard(draft, diagram, person, relation, treeId)
{
    if (diagram.nodes.some(node => node.type === 'person' && node.personId === person.id)) return;
    const defaults = geneoNodeDefaults('person');
    const style = diagram.personCardDefaults.style;
    const size = GENEO_PERSON_CARD_GEOMETRY[style] || GENEO_PERSON_CARD_GEOMETRY.standard;
    const palette = diagram.cardAppearanceDefaults[diagram.canvas.colorPersonCardsByGender ? person.gender : 'neutral'] || diagram.cardAppearanceDefaults.neutral;
    const anchor = diagram.nodes.find(node => node.type === 'person' && relation.ids.includes(node.personId) && node.personId !== person.id)
        || diagram.nodes.find(node => node.type === 'person' && node.personId === draft.activePersonId);
    const isChild = relation.type === 'child' && relation.ids.at(-1) === person.id;
    let x = anchor ? anchor.x + (relation.type === 'partner' ? anchor.width + 80 : 0) : 0;
    let y = anchor ? anchor.y + (relation.type === 'child' ? isChild ? anchor.height + 100 : -size.height - 100 : 0) : 0;
    if (diagram.canvas.snapToGrid) { x = Math.round(x / 20) * 20; y = Math.round(y / 20) * 20; }
    const startX = x;
    const startY = y;
    let available = false;
    for (let attempt = 0; attempt < 10000; attempt++)
    {
        const collision = Math.abs(x) + size.width > GENEO_WORLD_LIMIT || Math.abs(y) + size.height > GENEO_WORLD_LIMIT || diagram.nodes.some(node => node.visible !== false && node.type !== 'panel'
            && x < node.x + node.width + 20 && x + size.width + 20 > node.x && y < node.y + node.height + 20 && y + size.height + 20 > node.y);
        if (!collision) { available = true; break; }
        x = startX + (Math.floor(attempt / 2) % 10 + 1) * (size.width + 80) * (attempt % 2 ? -1 : 1);
        y = startY + Math.floor(attempt / 20) * (size.height + 80) * (relation.type === 'child' && !isChild ? -1 : 1);
    }
    if (!available) return false;
    const node = { id: draft.treeNodeIds.get(treeId), type: 'person', personId: person.id, x, y,
        width: size.width, height: size.height, parentPanelId: null, order: Math.max(0, ...diagram.nodes.map(item => item.order || 0)) + 1,
        visible: true, locked: false, personCard: { heightMode: 'auto' }, appearance: { ...structuredClone(defaults.appearance),
            strokeWidth: palette.strokeWidth, strokePattern: palette.strokePattern, cornerRadius: palette.cornerRadius },
        chartCardLayoutVersion: 1, portraitCardLayoutVersion: 1 };
    const detached = { ...getGeneographBoard(draft.boardId), diagram: { ...structuredClone(diagram), nodes: [...structuredClone(diagram.nodes), node] } };
    const projectPeople = new Map([[draft.projectId, new Set(sampleData.people.filter(item => item.projectId === draft.projectId).map(item => item.id))]]);
    normalizeGeneographBoardRecord(detached, projectPeople);
    Object.assign(person, detached.diagram.people.find(item => item.id === person.id));
    diagram.nodes.push(detached.diagram.nodes.find(item => item.id === node.id));
    return true;
}

function geneoReviewApplyTransferType(draft, relation, destination)
{
    const value = draft.transferTypes?.get(relation.id);
    if (!value || relation.type !== 'partner') return;
    const start = partnerRelationshipStartEvent(destination, destination.relationshipType);
    const end = partnerRelationshipEndEvent(destination, destination.relationshipType);
    upsertPartnerRelationshipEvents(destination, { relationshipType: value, marriageType: destination.marriageType,
        startDate: start?.date, endDate: end?.date, startPlace: { text: start?.placeText || '', selectedPlaceId: start?.placeId || '', address: start?.address || '' },
        endPlace: { text: end?.placeText || '', selectedPlaceId: end?.placeId || '', address: end?.address || '' } },
    { resolvePlace: place => ({ placeId: place.selectedPlaceId || null, placeText: place.text || '', address: place.address || '' }) });
    if (Array.isArray(destination.partnerIds))
        for (const key of Object.keys(destination)) if (/^(start|end)(Date|Place|Sort|Calendar|Original|Address)/.test(key)) delete destination[key];
}

function geneoTreeImportPreview(draft)
{
    const board = getGeneographBoard(draft.boardId, { projectId: draft.projectId });
    const result = { patches: [], operations: [], errors: [], statuses: new Map(), mapping: new Map(), relations: geneoReviewAllRelations(draft) };
    const fail = (message, personId = '', relationId = '') => result.errors.push({ message: t(message), personId, relationId });
    if (!board || board.projectId !== currentProjectId())
    {
        fail('The board is no longer available.');
        return { ...result, error: result.errors[0].message };
    }
    const projected = { people: structuredClone(sampleData.people), families: structuredClone(sampleData.families),
        'board.people': structuredClone(board.diagram.people), 'board.families': structuredClone(board.diagram.families),
        'board.connections': structuredClone(board.diagram.connections), 'board.nodes': structuredClone(board.diagram.nodes) };
    const touchedPeople = new Set();
    const touchedFamilies = new Set();
    const reads = new Set();
    const read = (key, id) =>
    {
        if (!id) return;
        const token = `${key}:${id}`;
        if (reads.has(token)) return;
        reads.add(token);
        const before = draft.baseline.get(token) || null;
        const current = geneoReviewCollection(key, board)?.find(record => record.id === id) || null;
        if (!geneoReviewEqual(before, current)) fail('A reviewed record changed. Refresh the review to keep your choices and compare the latest values.');
    };
    const operation = (personId, type, label, extras = {}) => result.operations.push({ personId, type, label, ...extras });
    const used = new Map();
    for (const person of board.diagram.people)
    {
        const chosen = draft.choices.has(person.id) ? draft.choices.get(person.id) : person.treePersonId;
        const treeId = chosen === 'create' ? draft.newIds.get(person.id) : chosen && !['skip', 'unlink'].includes(chosen) ? chosen : '';
        if (!treeId) continue;
        if (chosen !== 'create' && !sampleData.people.some(item => item.id === treeId && !item.deleted && item.projectId === draft.projectId))
        {
            if (draft.fields.get(person.id)?.size || treeId !== person.treePersonId
                || draft.relations.some(relation => relation.ids.includes(person.id) && draft.relationChoices.has(relation.id)))
                fail('Choose an available person in this project.', person.id);
            continue;
        }
        if (used.has(treeId) && used.get(treeId) !== person.id)
            fail('This Tree person is already represented on the board. Locate the existing person instead.', person.id);
        used.set(treeId, person.id);
        result.mapping.set(person.id, treeId);
    }
    for (const person of draft.people)
    {
        const choice = draft.choices.get(person.id);
        const treeId = result.mapping.get(person.id);
        const fields = draft.fields.get(person.id) || new Map();
        const changedIdentity = choice === 'create' || choice === 'unlink' && Boolean(person.treePersonId) || Boolean(treeId && treeId !== person.treePersonId);
        if (!changedIdentity && !fields.size) continue;
        read('board.people', person.id);
        const boardPerson = projected['board.people'].find(record => record.id === person.id);
        if (!boardPerson) { fail('Reviewed person is no longer available.', person.id); continue; }
        if (choice === 'unlink')
        {
            if (fields.size || draft.relations.some(relation => relation.ids.includes(person.id) && draft.relationChoices.has(relation.id)))
            { fail('Remove this person’s selected transfers before unlinking, or keep the link.', person.id); continue; }
            boardPerson.treePersonId = null;
            boardPerson.syncState = 'local';
            operation(person.id, 'identity', 'Unlink from Family Tree');
            continue;
        }
        let tree = projected.people.find(record => record.id === treeId && !record.deleted && record.projectId === draft.projectId);
        if (choice === 'create')
        {
            if (projected.people.some(record => record.id === treeId)) { fail('A new person ID is already in use.', person.id); continue; }
            tree = geneoTreeImportNewPerson(boardPerson, treeId, draft.projectId);
            projected.people.push(tree);
            touchedPeople.add(treeId);
            operation(person.id, 'identity', 'Create in Tree');
        }
        else
        {
            read('people', treeId);
            if (!tree) { fail('Choose an available person in this project.', person.id); continue; }
            if (changedIdentity) operation(person.id, 'identity', 'Link existing');
        }
        if (!tree) continue;
        if (changedIdentity) boardPerson.treePersonId = treeId;
        for (const [key, source] of fields)
        {
            if (!GENEO_REVIEW_FACTS.some(([field]) => field === key) || !['board', 'tree'].includes(source))
            { fail('The selected fact is unavailable.', person.id); continue; }
            read('people', treeId);
            const originalTree = sampleData.people.find(record => record.id === treeId);
            const from = source === 'board' ? person : originalTree;
            if (!from) { fail('The selected fact is unavailable.', person.id); continue; }
            const value = geneoReviewFact(from, key);
            const target = source === 'board' ? tree : boardPerson;
            if (geneoReviewEqual(value, geneoReviewFact(target, key))) continue;
            geneoReviewSetFact(target, key, value);
            if (source === 'board') touchedPeople.add(treeId);
            operation(person.id, 'fact', GENEO_REVIEW_FACTS.find(([field]) => field === key)[1],
                { key, source, clear: geneoReviewFactEmpty(value), value: geneoReviewFactText(from, key), destination: source === 'board' ? 'In Family Tree' : 'On board' });
        }
        boardPerson.syncState = geneoTreeImportFields(boardPerson, tree).length ? 'modified' : 'linked';
        boardPerson.names = normalizeGeneographPersonNames(boardPerson);
        if (!String(tree.names?.first || '').trim() && !String(tree.names?.last || '').trim())
            fail('A person must have a first name or surname.', person.id);
        if (!boardPerson.names.first && !boardPerson.names.last) fail('A person must have a first name or surname.', person.id);
        for (const target of [tree, boardPerson])
        {
            const error = geneoReviewValidatePerson(target, draft.projectId);
            if (error) fail(error, person.id);
        }
    }
    const anchorId = result.mapping.get(draft.anchorId);
    for (const originalRelation of result.relations)
    {
        let relation = originalRelation;
        const decision = draft.relationChoices.get(relation.id);
        const configuredType = draft.transferTypes?.get(relation.id);
        if (decision && configuredType && !(relation.type === 'partner' ? ADD_PERSON_RELATIONSHIP_TYPES : PARENT_CHILD_RELATIONSHIP_TYPES).includes(configuredType))
        { fail('The selected relationship choice is unavailable.', draft.activePersonId, relation.id); continue; }
        const clears = [];
        let ids = relation.ids.map(id => result.mapping.get(id));
        if (relation.origin === 'tree')
        {
            const siblingExists = relation.type === 'sibling' && projected['board.families'].some(family => relation.ids.every(id => family.children.some(child => child.personId === id)));
            if (siblingExists && !decision) { result.statuses.set(relation.id, 'Same relationship'); continue; }
            result.statuses.set(relation.id, 'Not connected on board');
            if (!decision) continue;
            if (relation.treeIds)
            {
                if (relation.type === 'child' && relation.treeIds.length > 2)
                {
                    const missingParent = relation.treeIds.slice(0, -1).some(id => !projected['board.nodes'].some(node => node.personId === draft.treeBoardPeople.get(id)?.id)
                        && ![...result.mapping].some(([personId, treeId]) => treeId === id && projected['board.nodes'].some(node => node.personId === personId)));
                    const selected = draft.treeParentChoices?.get(relation.id);
                    if (missingParent && !selected)
                    { fail('Choose the parents to include on the board.', draft.activePersonId, relation.id); continue; }
                    if (selected && selected !== 'all')
                    {
                        const index = relation.treeIds.indexOf(selected);
                        if (index < 0 || index === relation.treeIds.length - 1)
                        { fail('Choose the parents to include on the board.', draft.activePersonId, relation.id); continue; }
                        relation = { ...relation, ids: [relation.ids[index], relation.ids.at(-1)], treeIds: [selected, relation.treeIds.at(-1)] };
                    }
                }
                for (let index = 0; index < relation.treeIds.length; index++)
                {
                    const treeId = relation.treeIds[index];
                    const personId = relation.ids[index];
                    read('people', treeId);
                    const tree = projected.people.find(person => person.id === treeId && person.projectId === draft.projectId && !person.deleted);
                    if (!tree) { fail('Choose an available person in this project.', draft.activePersonId, relation.id); continue; }
                    const mapped = [...result.mapping].find(([, value]) => value === treeId)?.[0];
                    if (mapped && mapped !== personId)
                    { relation = { ...relation, ids: relation.ids.map((id, slot) => slot === index ? mapped : id) }; continue; }
                    if (draft.choices.get(personId) === 'unlink')
                    { fail('Keep this person linked before adding their Tree relationship.', personId, relation.id); continue; }
                    let person = projected['board.people'].find(item => item.id === personId);
                    if (!person)
                    {
                        person = structuredClone(draft.treeBoardPeople.get(treeId));
                        projected['board.people'].push(person);
                    }
                    const noCard = !projected['board.nodes'].some(node => node.personId === personId);
                    if (noCard)
                    {
                        const diagram = { ...board.diagram, people: projected['board.people'], nodes: projected['board.nodes'], families: projected['board.families'], connections: projected['board.connections'] };
                        if (!geneoReviewPlaceTreeCard(draft, diagram, person, relation, treeId))
                        { fail('There is no clear space for this card. Make room on the board and try again.', draft.activePersonId, relation.id); continue; }
                        operation(draft.activePersonId, 'boardPerson', 'Add person to board', { addedPersonId: person.id, treeId, relationId: relation.id });
                    }
                    result.mapping.set(personId, treeId);
                }
                ids = relation.ids.map(id => result.mapping.get(id));
            }
            if (decision !== 'tree' || !anchorId || !ids.every(Boolean))
            { fail('Choose a Family Tree record for each person in this relationship.', relation.ids.at(-1), relation.id); continue; }
            if (relation.ids.some(id => !projected['board.nodes'].some(node => node.type === 'person' && node.personId === id)))
            { fail('There is no clear space for this card. Make room on the board and try again.', draft.activePersonId, relation.id); continue; }
            const treeFamily = projected.families.find(family => family.id === relation.treeFamilyId);
            if (!treeFamily || !draft.treeFamilyIds?.has(treeFamily.id) || !draft.treeConnectionIds?.has(relation.id))
            { fail('A reviewed record changed. Refresh the review to keep your choices and compare the latest values.'); continue; }
            read('families', treeFamily.id);
            for (const id of relation.ids) { read('board.people', id); read('people', result.mapping.get(id)); }
            if (relation.type === 'sibling')
            {
                let family = projected['board.families'].find(item => !item.partnerIds.length && item.children.some(child => relation.ids.includes(child.personId)));
                if (!family)
                {
                    family = { id: draft.treeSubsetFamilyIds.get(relation.id), partnerIds: [], children: [], relationshipType: 'Sibling relationship', relationshipStatus: 'active', marriageType: '', events: [] };
                    projected['board.families'].push(family);
                }
                for (let index = 0; index < relation.ids.length; index++)
                {
                    if (family.children.some(child => child.personId === relation.ids[index])) continue;
                    const types = geneoReviewFamilyParents(treeFamily).map(parent => parentChildRelationshipType(treeFamily, parent, ids[index]));
                    const type = draft.transferTypes.get(relation.id) || (new Set(types).size === 1 ? types[0] : '');
                    if (!type) fail('Choose relationship type', draft.activePersonId, relation.id);
                    else family.children.push({ personId: relation.ids[index], parentageType: type.toLowerCase() });
                }
                const [first, second] = relation.ids.map(id => projected['board.nodes'].find(node => node.personId === id));
                projected['board.connections'].push({ id: draft.treeConnectionIds.get(relation.id), kind: 'family-sibling', familyId: family.id,
                    source: { nodeId: first.id, port: 'top' }, target: { nodeId: second.id, port: 'top' }, name: '', visible: true, style: {}, route: { mode: 'auto', waypoints: [] } });
                operation(relation.ids.find(id => draft.people.some(person => person.id === id)) || draft.activePersonId, 'relationship', 'Family connections',
                    { relationId: relation.id, ids: relation.ids, source: 'tree', clears });
                continue;
            }
            const parents = relation.type === 'child' ? relation.ids.slice(0, -1) : relation.ids;
            let family = projected['board.families'].find(item => geneoReviewEqual([...item.partnerIds].sort(), [...parents].sort()));
            if (!family)
            {
                family = { id: parents.length === 1 ? draft.treeSubsetFamilyIds.get(`${treeFamily.id}|${ids[0]}`) || draft.treeFamilyIds.get(treeFamily.id) : draft.treeFamilyIds.get(treeFamily.id), partnerIds: [...parents], children: [],
                    relationshipType: 'Unknown relationship', relationshipStatus: 'unknown', marriageType: '', events: [] };
                projected['board.families'].push(family);
            }
            else read('board.families', family.id);
            const nodeFor = id => projected['board.nodes'].find(node => node.type === 'person' && node.personId === id);
            let source, target;
            if (relation.type === 'partner')
            {
                geneoReviewCopyRelationship(treeFamily, family);
                geneoReviewApplyTransferType(draft, relation, family);
                const [first, second] = parents.map(nodeFor).sort((a, b) => a.x - b.x);
                source = { nodeId: first.id, port: 'right' }; target = { nodeId: second.id, port: 'left' };
            }
            else
            {
                if (parents.length === 2 && !projected['board.connections'].some(connection => connection.kind === 'family-partner' && connection.familyId === family.id))
                {
                    if (draft.treeParentChoices?.get(relation.id) !== 'all')
                    { fail('Choose the parents to include on the board.', draft.activePersonId, relation.id); continue; }
                    const [first, second] = parents.map(nodeFor).sort((a, b) => a.x - b.x);
                    if (!board.diagram.families.some(item => item.id === family.id)) geneoReviewCopyRelationship(treeFamily, family);
                    projected['board.connections'].push({ id: draft.treeConnectionIds.get(`tree:${treeFamily.id}:partner`), kind: 'family-partner', familyId: family.id,
                        source: { nodeId: first.id, port: 'right' }, target: { nodeId: second.id, port: 'left' }, name: '', visible: true, style: {}, route: { mode: 'auto', waypoints: [] } });
                }
                const types = ids.slice(0, -1).map(id => draft.transferTypes?.get(relation.id) || parentChildRelationshipType(treeFamily, id, ids.at(-1)));
                if (new Set(types).size > 1)
                { fail('Different parentage types need separate board connections.', relation.ids.at(-1), relation.id); continue; }
                if (projected['board.families'].some(other => other.id !== family.id && other.children.some(child => child.personId === relation.ids.at(-1))
                    && other.partnerIds.some(parent => parents.includes(parent))))
                { fail('A parent link already exists on the board. Review it separately instead of replacing its family.', relation.ids.at(-1), relation.id); continue; }
                if (!family.children.some(child => child.personId === relation.ids.at(-1))) family.children.push({ personId: relation.ids.at(-1), parentageType: types[0].toLowerCase() });
                source = parents.length === 2 ? { familyId: family.id, port: 'bottom' } : { nodeId: nodeFor(parents[0]).id, port: 'bottom' };
                target = { nodeId: nodeFor(relation.ids.at(-1)).id, port: 'top' };
            }
            if (!projected['board.connections'].some(connection => connection.kind === (relation.type === 'partner' ? 'family-partner' : 'family-child') && connection.familyId === family.id && (relation.type === 'partner' || connection.target.nodeId === target.nodeId)))
                projected['board.connections'].push({ id: draft.treeConnectionIds.get(relation.id), kind: relation.type === 'partner' ? 'family-partner' : 'family-child',
                    familyId: family.id, source, target, name: '', visible: true, style: {}, route: { mode: 'auto', waypoints: [] } });
            const owner = draft.people.some(person => person.id === relation.ids.at(-1)) ? relation.ids.at(-1) : relation.ids.find(id => draft.people.some(person => person.id === id)) || draft.activePersonId;
            operation(owner, 'relationship', 'Family connections', { relationId: relation.id, ids: relation.ids, source: 'tree', clears });
            continue;
        }
        const source = draft.diagram.families.find(family => family.id === relation.familyId);
        const parentIds = relation.type === 'child' ? ids.slice(0, -1) : ids;
        const sameParents = family => geneoReviewEqual(geneoReviewFamilyParents(family).sort(), [...parentIds].sort());
        let target = relation.type === 'sibling' ? null : projected.families.find(family => family.projectId === draft.projectId && sameParents(family));
        let ambiguousFamily = false;
        if (!target && relation.type === 'child')
        {
            const candidates = projected.families.filter(family => family.projectId === draft.projectId && (family.childIds || []).includes(ids.at(-1))
                && parentIds.every(id => geneoReviewFamilyParents(family).includes(id)));
            target = candidates.length === 1 ? candidates[0] : candidates.find(family => family.id === draft.treeFamilyChoices?.get(relation.id)) || null;
            ambiguousFamily = candidates.length > 1 && !target;
        }
        const complete = ids.every(Boolean);
        let matches = complete && target && (relation.type === 'partner'
            ? geneoReviewEqual(geneoReviewRelationshipData(source), geneoReviewRelationshipData(target))
            : (target.childIds || []).includes(ids.at(-1)) && parentIds.every((parentId, index) =>
                parentChildRelationshipType(target, parentId, ids.at(-1)) === geneoReviewParentType(source, source.children.find(child => child.personId === relation.ids.at(-1)), relation.ids[index])));
        if (relation.type === 'sibling' && complete)
            matches = projected.families.some(family => (family.childIds || []).includes(ids[0]) && (family.childIds || []).includes(ids[1]));
        const connectionExists = target && (relation.type !== 'child' || (target.childIds || []).includes(ids.at(-1)));
        result.statuses.set(relation.id, matches ? 'Same relationship' : !complete ? 'Resolve identities first' : connectionExists ? 'Relationship differs' : 'Not connected in Tree');
        if (!decision) continue;
        if (ambiguousFamily) { fail('Choose the parent family to update.', relation.ids.at(-1), relation.id); continue; }
        if (!anchorId || !complete) { fail('Choose a Family Tree record for each person in this relationship.', relation.ids.at(-1), relation.id); continue; }
        for (const id of relation.ids) { read('board.people', id); read('people', result.mapping.get(id)); }
        if (source) read('board.families', source.id);
        if (target) read('families', target.id);
        if (matches)
        {
            const unchangedType = relation.type === 'partner' ? (decision === 'board' ? source.relationshipType : target.relationshipType)
                : decision === 'board' && relation.type === 'child' ? geneoReviewParentType(source, source.children.find(child => child.personId === relation.ids.at(-1)), relation.ids[0])
                    : relation.type === 'child' ? parentChildRelationshipType(target, parentIds[0], ids.at(-1)) : '';
            if (!configuredType || configuredType === unchangedType) continue;
        }
        if (relation.type === 'partner' && target)
        {
            const from = decision === 'tree' ? target : source;
            const to = decision === 'tree' ? source : target;
            for (const [role, getter] of [['start', partnerRelationshipStartEvent], ['end', partnerRelationshipEndEvent]])
            {
                const left = getter(from, from.relationshipType || 'Unknown relationship');
                const right = getter(to, to.relationshipType || 'Unknown relationship');
                if (formatGenealogyDateLabel(right?.date) && !formatGenealogyDateLabel(left?.date)) clears.push(role === 'start' ? 'Start date' : 'End date');
                if ((right?.placeId || right?.placeText) && !(left?.placeId || left?.placeText)) clears.push(role === 'start' ? 'Start place' : 'End place');
            }
        }
        if (relation.type === 'sibling')
        {
            const [familyId, onlyParent = ''] = (draft.siblingFamilies.get(relation.id) || '').split('::');
            const parentFamily = projected.families.find(family => family.id === familyId && family.projectId === draft.projectId);
            target = parentFamily;
            if (!target || !(target.childIds || []).some(id => ids.includes(id)))
            { fail('Choose the recorded parent family for these siblings.', relation.ids.at(-1), relation.id); continue; }
            read('families', target.id);
            if (decision !== 'board') { fail('Choose the board relationship to add this sibling.', relation.ids.at(-1), relation.id); continue; }
            if (onlyParent)
            {
                if (!geneoReviewFamilyParents(parentFamily).includes(onlyParent))
                { fail('Choose the recorded parent family for these siblings.', relation.ids.at(-1), relation.id); continue; }
                target = projected.families.find(family => family.projectId === draft.projectId
                    && geneoReviewEqual(geneoReviewFamilyParents(family), [onlyParent]));
                if (!target)
                {
                    target = geneoReviewNewFamily(draft.siblingFamilyIds.get(relation.ids.at(-1)), draft.projectId, [onlyParent]);
                    projected.families.push(target);
                }
                else read('families', target.id);
                for (const childId of ids.filter(id => (parentFamily.childIds || []).includes(id)))
                {
                    if ((target.childIds || []).includes(childId)) continue;
                    target.childIds.push(childId);
                    target.childrenIds = [...target.childIds];
                    target.parentChildTypes = target.parentChildTypes || {};
                    target.parentChildTypes[`${onlyParent}|${childId}`] = parentChildRelationshipType(parentFamily, onlyParent, childId);
                }
                touchedFamilies.add(target.id);
            }
            const other = ids.find(id => !(target.childIds || []).includes(id));
            if (other)
            {
                const selectedParents = geneoReviewFamilyParents(target);
                if (!selectedParents.length) { fail('The selected family has no recorded parents.', relation.ids.at(-1), relation.id); continue; }
                target.childIds = [...new Set([...(target.childIds || []), other])];
                target.childrenIds = [...target.childIds];
                target.parentChildTypes = target.parentChildTypes || {};
                const connection = draft.diagram.connections.find(item => item.id === relation.id);
                const type = draft.transferTypes?.get(relation.id) || draft.parentTypes.get(relation.id) || PARENT_CHILD_RELATIONSHIP_TYPES.find(item => item.toLowerCase() === String(connection?.parentageType || '').toLowerCase());
                if (!type) { fail('The recorded parentage type is unavailable.', relation.ids.at(-1), relation.id); continue; }
                for (const parent of selectedParents) target.parentChildTypes[`${parent}|${other}`] = type;
                touchedFamilies.add(target.id);
            }
        }
        else if (decision === 'tree')
        {
            if (!target || (relation.type === 'child' && !(target.childIds || []).includes(ids.at(-1))))
            { fail('There is no matching Tree connection to use.', relation.ids.at(-1), relation.id); continue; }
            const destination = projected['board.families'].find(family => family.id === source.id);
            if (relation.type === 'partner') { geneoReviewCopyRelationship(target, destination); geneoReviewApplyTransferType(draft, relation, destination); }
            else
            {
                const child = destination.children.find(item => item.personId === relation.ids.at(-1));
                const types = parentIds.map(parent => draft.transferTypes?.get(relation.id) || parentChildRelationshipType(target, parent, ids.at(-1)));
                if (new Set(types).size > 1)
                    fail('Different parentage types need separate board connections.', relation.ids.at(-1), relation.id);
                else child.parentageType = types[0].toLowerCase();
            }
        }
        else if (decision === 'board')
        {
            if (!target)
            {
                const id = draft.familyIds.get(source.id);
                target = projected.families.find(family => family.id === id);
                if (!target)
                {
                    target = geneoReviewNewFamily(id, draft.projectId, parentIds);
                    projected.families.push(target);
                }
            }
            if (relation.type === 'partner')
            {
                const type = source.relationshipType || 'Unknown relationship';
                const start = partnerRelationshipStartEvent(source, type);
                const end = partnerRelationshipEndEvent(source, type);
                if (end && !partnerRelationshipDateOrderIsValid(start?.date, end.date))
                    fail('The relationship end date must be after or equal to the start date.', relation.ids.at(-1), relation.id);
                geneoReviewCopyRelationship(source, target);
                geneoReviewApplyTransferType(draft, relation, target);
            }
            else
            {
                const childId = ids.at(-1);
                target.childIds = [...new Set([...(target.childIds || []), childId])];
                target.childrenIds = [...target.childIds];
                target.parentChildTypes = target.parentChildTypes || {};
                const child = source.children.find(item => item.personId === relation.ids.at(-1));
                parentIds.forEach((parentId, index) =>
                {
                    const type = draft.transferTypes?.get(relation.id) || draft.parentTypes.get(relation.id) || geneoReviewParentType(source, child, relation.ids[index]);
                    if (!type) fail('The recorded parentage type is unavailable.', relation.ids.at(-1), relation.id);
                    else target.parentChildTypes[`${parentId}|${childId}`] = type;
                });
            }
            touchedFamilies.add(target.id);
        }
        else { fail('The selected relationship choice is unavailable.'); continue; }
        operation(relation.ids.at(-1), 'relationship', 'Family connections', { relationId: relation.id, ids: relation.ids, source: decision, clears });
    }
    // Validate the projected ancestry, including existing links, without invoking live mutators.
    const ancestry = new Map();
    for (const family of projected.families.filter(item => item.projectId === draft.projectId))
    {
        for (const child of family.childIds || [])
        {
            if (!ancestry.has(child)) ancestry.set(child, new Set());
            for (const parent of geneoReviewFamilyParents(family)) ancestry.get(child).add(parent);
        }
    }
    const hasCycle = (id, path = new Set()) =>
    {
        if (path.has(id)) return true;
        const next = new Set([...path, id]);
        return [...(ancestry.get(id) || [])].some(parent => hasCycle(parent, next));
    };
    if (touchedFamilies.size && [...ancestry.keys()].some(id => hasCycle(id))) fail('This connection would create a relationship loop.');
    const boardAncestors = new Map(projected['board.people'].map(person => [person.id, new Set()]));
    for (const family of projected['board.families'])
        for (const child of family.children)
            for (const parent of family.partnerIds) boardAncestors.get(child.personId)?.add(parent);
    const boardCycle = (id, path = new Set()) => path.has(id) || [...(boardAncestors.get(id) || [])].some(parent => boardCycle(parent, new Set([...path, id])));
    if (result.operations.some(item => item.type === 'relationship' && item.source === 'tree') && [...boardAncestors.keys()].some(id => boardCycle(id)))
        fail('This connection would create a relationship loop.');
    const hasAncestor = (graph, id, ancestor, seen = new Set()) =>
    {
        if (seen.has(id)) return false;
        seen.add(id);
        return [...(graph.get(id) || [])].some(parent => parent === ancestor || hasAncestor(graph, parent, ancestor, seen));
    };
    for (const family of projected.families.filter(item => touchedFamilies.has(item.id)))
    {
        const [a, b] = geneoReviewFamilyParents(family);
        if (a && b && (hasAncestor(ancestry, a, b) || hasAncestor(ancestry, b, a))) fail('Direct ancestors cannot be partners.');
    }
    for (const relation of result.relations.filter(item => item.origin === 'tree' && ['partner', 'sibling'].includes(item.type) && draft.relationChoices.get(item.id) === 'tree'))
    {
        const [a, b] = relation.ids;
        if (hasAncestor(boardAncestors, a, b) || hasAncestor(boardAncestors, b, a)) fail(relation.type === 'partner' ? 'Direct ancestors cannot be partners.' : 'Direct ancestors cannot be siblings.');
    }
    for (const family of projected.families.filter(item => touchedFamilies.has(item.id)))
    {
        for (const id of [...geneoReviewFamilyParents(family), ...(family.childIds || [])])
        {
            const person = projected.people.find(item => item.id === id && !item.deleted && item.projectId === draft.projectId);
            if (!person) fail('Choose an available person in this project.');
            touchedPeople.add(id);
        }
        for (const child of family.childIds || [])
        {
            const biological = new Set(projected.families.filter(item => item.projectId === draft.projectId && (item.childIds || []).includes(child))
                .flatMap(item => geneoReviewFamilyParents(item).filter(parent => parentChildRelationshipType(item, parent, child) === 'Biological')));
            const genders = [...biological].map(id => projected.people.find(person => person.id === id)?.gender);
            if (biological.size > 2 || genders.filter(gender => gender === 'male').length > 1 || genders.filter(gender => gender === 'female').length > 1)
                fail('The biological parents conflict with an existing parent family. Review the parentage type.');
        }
    }
    for (const id of touchedPeople)
    {
        const person = projected.people.find(item => item.id === id);
        if (!person) continue;
        person.familyAsSpouseIds = projected.families.filter(family => geneoReviewFamilyParents(family).includes(id)).map(family => family.id);
        person.familyAsChildIds = projected.families.filter(family => (family.childIds || []).includes(id)).map(family => family.id);
    }
    const affectedEvent = event => touchedFamilies.has(event.familyId) || [...(event.personIds || []), ...(event.relatedPersonIds || [])].some(id => touchedPeople.has(id));
    if (touchedPeople.size || touchedFamilies.size)
    {
        const rebuilt = buildSampleEvents({ people: structuredClone(projected.people), families: structuredClone(projected.families) });
        projected.events = [...sampleData.events.filter(event => !affectedEvent(event)), ...rebuilt.filter(affectedEvent)];
        const removed = new Set(sampleData.events.filter(event => affectedEvent(event) && !projected.events.some(item => item.id === event.id)).map(event => event.id));
        projected.archiveFiles = sampleData.archiveFiles.map(file =>
            file.linkedEventIds?.some(id => removed.has(id)) ? { ...structuredClone(file), linkedEventIds: file.linkedEventIds.filter(id => !removed.has(id)) } : file);
        projected.sourceLinks = (sampleData.sourceLinks || []).filter(link => !(link.targetType === 'event' && removed.has(link.targetId)));
    }
    for (const [key, after] of Object.entries(projected))
    {
        const before = geneoReviewCollection(key, board) || [];
        const ids = new Set([...before, ...after].map(record => record.id));
        for (const id of ids)
        {
            const left = before.find(record => record.id === id) || null;
            const right = after.find(record => record.id === id) || null;
            if (geneoReviewEqual(left, right)) continue;
            read(key, id);
            result.patches.push({ key, id, before: structuredClone(left), after: structuredClone(right) });
        }
    }
    result.error = result.errors[0]?.message || '';
    return result;
}

function geneoReviewPatchesSafe(board, patches, expected = 'before')
{
    return patches.every(patch => geneoReviewEqual(geneoReviewCollection(patch.key, board)?.find(item => item.id === patch.id) || null, patch[expected]));
}

function geneoReviewWritePatches(board, patches, side)
{
    for (const patch of patches)
    {
        const collection = geneoReviewCollection(patch.key, board);
        const index = collection.findIndex(item => item.id === patch.id);
        const value = patch[side];
        if (!value) { if (index >= 0) collection.splice(index, 1); }
        else if (index < 0) collection.push(structuredClone(value));
        else
        {
            const existing = collection[index];
            for (const key of Object.keys(existing)) if (!(key in value)) delete existing[key];
            Object.assign(existing, structuredClone(value));
        }
    }
}

function geneoReviewHistoryCanRestore(entry)
{
    const board = selectedGeneographBoard();
    if (!board || board.id !== entry.boardId || !geneoReviewPatchesSafe(board, entry.patches, entry.side === 'before' ? 'after' : 'before')) return false;
    const deleting = entry.patches.filter(patch => !patch[entry.side]);
    for (const patch of deleting)
    {
        const allowed = new Set(entry.patches.map(item => `${item.key}:${item.id}`));
        for (const key of ['people', 'families', 'events', 'archiveFiles', 'sourceLinks', 'photos', 'notes', 'places', 'sources', 'board.people', 'board.families', 'board.connections', 'board.nodes'])
        {
            for (const record of geneoReviewCollection(key, board) || [])
                if (!allowed.has(`${key}:${record.id}`) && JSON.stringify(record).includes(JSON.stringify(patch.id))) return false;
        }
        if (patch.key === 'people' && sampleData.boards?.some(other => other.id !== board.id && other.diagram?.people.some(person => person.treePersonId === patch.id))) return false;
        if (patch.key === 'people' && board.diagram.people.some(person => person.treePersonId === patch.id && !allowed.has(`board.people:${person.id}`))) return false;
    }
    return true;
}

function geneoReviewRestoreHistory(entry)
{
    if (!geneoReviewHistoryCanRestore(entry)) return false;
    geneoReviewWritePatches(selectedGeneographBoard(), entry.patches, entry.side);
    touchGeneographBoard();
    return true;
}

function geneoTreeImportCommit()
{
    const draft = geneoTreeImportDraft;
    if (!draft) return false;
    const plan = geneoTreeImportPreview(draft);
    if (plan.error) { draft.error = plan.error; geneoTreeImportRender(); return false; }
    const board = getGeneographBoard(draft.boardId, { projectId: draft.projectId });
    if (!geneoReviewPatchesSafe(board, plan.patches)) return false;
    try
    {
        geneoReviewWritePatches(board, plan.patches, 'after');
        if (plan.patches.length)
            geneoPushHistorySnapshot(JSON.stringify({ geneoReviewHistory: true, boardId: board.id, side: 'before', patches: plan.patches }));
        touchGeneographBoard(board);
    }
    catch (error)
    {
        geneoReviewWritePatches(board, plan.patches, 'before');
        draft.error = t('No changes were applied. Review your choices and try again.');
        geneoTreeImportRender();
        return false;
    }
    geneoTreeImportDraft = null;
    closeModal();
    renderGeneographEditorPreserveScroll({ preserveInspectorScroll: true, preserveSidebarScroll: true });
    showToast('Reviewed changes applied.');
    return true;
}
