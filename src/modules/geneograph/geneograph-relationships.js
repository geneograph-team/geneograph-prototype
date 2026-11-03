function findGeneographFamilyForPartners(firstPersonId, secondPersonId)
{
    return selectedGeneographDiagram()?.families.find(family => family.partnerIds.length === 2 && family.partnerIds.includes(firstPersonId) && family.partnerIds.includes(secondPersonId)) || null;
}

function geneoPersonIdForNode(nodeId)
{
    const node = getGeneographNode(nodeId); return node?.type === 'person' ? node.personId : null;
}

function geneoHasAncestor(ancestorId, personId, seen = new Set())
{
    if (ancestorId === personId) return true;
    if (seen.has(personId)) return false;
    seen.add(personId);
    const parentFamilies = selectedGeneographDiagram().families.filter(family => family.children.some(child => child.personId === personId));
    return parentFamilies.some(family => family.partnerIds.some(parentId => geneoHasAncestor(ancestorId, parentId, seen)));
}

function geneoSiblingFamilyForPerson(personId)
{
    const diagram = selectedGeneographDiagram();
    return diagram?.families.find(family =>
        family.partnerIds.length === 0
        && family.children.some(child => child.personId === personId)
        && diagram.connections.some(connection => connection.kind === 'family-sibling' && connection.familyId === family.id)
    ) || null;
}

function createGeneographSiblingRelationship(firstPersonId, secondPersonId, source, target)
{
    const diagram = selectedGeneographDiagram();
    const firstFamily = geneoSiblingFamilyForPerson(firstPersonId);
    const secondFamily = geneoSiblingFamilyForPerson(secondPersonId);
    let family = firstFamily || secondFamily;
    if (!family)
    {
        family = {
            id: createRuntimeId('geneo-family'),
            partnerIds: [],
            children: [],
            relationshipType: 'Sibling relationship',
            relationshipStatus: 'active',
            marriageType: '',
            events: []
        };
        diagram.families.push(family);
    }
    if (firstFamily && secondFamily && firstFamily.id !== secondFamily.id)
    {
        secondFamily.children.forEach(child =>
        {
            if (!firstFamily.children.some(item => item.personId === child.personId)) firstFamily.children.push({ ...child });
        });
        diagram.connections.forEach(connection =>
        {
            if (connection.kind === 'family-sibling' && connection.familyId === secondFamily.id) connection.familyId = firstFamily.id;
        });
        diagram.families = diagram.families.filter(item => item.id !== secondFamily.id);
        family = firstFamily;
    }
    [firstPersonId, secondPersonId].forEach(personId =>
    {
        if (!family.children.some(child => child.personId === personId)) family.children.push({ personId, parentageType: 'unknown' });
    });
    diagram.connections.push(geneoCreateConnection('family-sibling', source, target, family.id));
    return family;
}

function rebuildGeneographSiblingFamily(familyId)
{
    const diagram = selectedGeneographDiagram();
    const family = getGeneographFamily(familyId);
    if (!diagram || !family) return;
    const siblingConnections = diagram.connections.filter(connection => connection.kind === 'family-sibling' && connection.familyId === familyId);
    if (!siblingConnections.length)
    {
        diagram.families = diagram.families.filter(item => item.id !== familyId);
        return;
    }
    const personIds = new Set();
    siblingConnections.forEach(connection =>
    {
        [connection.source?.nodeId, connection.target?.nodeId].forEach(nodeId =>
        {
            const personId = geneoPersonIdForNode(nodeId);
            if (personId) personIds.add(personId);
        });
    });
    family.children = [...personIds].map(personId => ({ personId, parentageType: 'unknown' }));
}

function canCreateGeneographConnection(source, target, purpose = 'automatic')
{
    if (!source || !target) return { valid: false, reason: 'Choose two connection points.' };
    if (source.nodeId && source.nodeId === target.nodeId) return { valid: false, reason: 'An item cannot connect to itself.' };
    const sourceNode = getGeneographNode(source.nodeId); const targetNode = getGeneographNode(target.nodeId);
    if (purpose === 'visual') return sourceNode && targetNode
        ? { valid: true, kind: 'visual' }
        : { valid: false, reason: 'Visual connections use object sockets, not family junctions.' };
    const sourcePersonId = geneoPersonIdForNode(source.nodeId); const targetPersonId = geneoPersonIdForNode(target.nodeId);
    if (source.familyId && targetPersonId && target.port === 'top')
    {
        const family = getGeneographFamily(source.familyId);
        if (!family) return { valid: false, reason: 'That family is no longer available.' };
        if (family.children.some(child => child.personId === targetPersonId)) return { valid: false, reason: 'That child already belongs to this family.' };
        if (family.partnerIds.some(parentId => geneoHasAncestor(targetPersonId, parentId))) return { valid: false, reason: 'This relationship would create an ancestry cycle.' };
        return { valid: true, kind: 'family-child', familyId: source.familyId, childPersonId: targetPersonId, childReference: target };
    }
    if (target.familyId && sourcePersonId && source.port === 'top')
    {
        const family = getGeneographFamily(target.familyId);
        if (!family) return { valid: false, reason: 'That family is no longer available.' };
        if (family.children.some(child => child.personId === sourcePersonId)) return { valid: false, reason: 'That child already belongs to this family.' };
        if (family.partnerIds.some(parentId => geneoHasAncestor(sourcePersonId, parentId))) return { valid: false, reason: 'This relationship would create an ancestry cycle.' };
        return { valid: true, kind: 'family-child', familyId: target.familyId, childPersonId: sourcePersonId, childReference: source };
    }
    if (sourcePersonId && targetPersonId)
    {
        if (source.port === 'top' && target.port === 'top')
        {
            if (geneoHasAncestor(sourcePersonId, targetPersonId) || geneoHasAncestor(targetPersonId, sourcePersonId)) return { valid: false, reason: 'Direct ancestors cannot be siblings.' };
            const sourceFamily = geneoSiblingFamilyForPerson(sourcePersonId);
            const targetFamily = geneoSiblingFamilyForPerson(targetPersonId);
            if (sourceFamily && targetFamily && sourceFamily.id === targetFamily.id) return { valid: false, reason: 'That sibling relationship already exists.' };
            return { valid: true, kind: 'family-sibling', sourcePersonId, targetPersonId };
        }
        const horizontal = ['left', 'right'].includes(source.port) && ['left', 'right'].includes(target.port) && source.port !== target.port;
        if (horizontal)
        {
            if (geneoHasAncestor(sourcePersonId, targetPersonId) || geneoHasAncestor(targetPersonId, sourcePersonId)) return { valid: false, reason: 'Direct ancestors cannot be partners.' };
            if (findGeneographFamilyForPartners(sourcePersonId, targetPersonId)) return { valid: false, reason: 'That partner relationship already exists.' };
            return { valid: true, kind: 'family-partner', sourcePersonId, targetPersonId };
        }
        const sourceIsParent = source.port === 'bottom' && target.port === 'top';
        const targetIsParent = target.port === 'bottom' && source.port === 'top';
        if (sourceIsParent || targetIsParent)
        {
            const parentPersonId = sourceIsParent ? sourcePersonId : targetPersonId; const childPersonId = sourceIsParent ? targetPersonId : sourcePersonId;
            if (geneoHasAncestor(childPersonId, parentPersonId)) return { valid: false, reason: 'This relationship would create an ancestry cycle.' };
            if (selectedGeneographDiagram().families.some(family => family.partnerIds.includes(parentPersonId) && family.children.some(child => child.personId === childPersonId))) return { valid: false, reason: 'That parent-child relationship already exists.' };
            return {
                valid: true,
                kind: 'family-child',
                parentPersonId,
                childPersonId,
                parentReference: sourceIsParent ? source : target,
                childReference: sourceIsParent ? target : source
            };
        }
        return { valid: false, reason: 'Use side ports for partners and vertical ports for parent-child relationships.' };
    }
    if (sourceNode && targetNode) return { valid: true, kind: 'visual' };
    return { valid: false, reason: 'These points cannot be connected.' };
}

function createGeneographPartnerRelationship(firstPersonId, secondPersonId, source, target)
{
    const diagram = selectedGeneographDiagram();
    let family = findGeneographFamilyForPartners(firstPersonId, secondPersonId);
    if (!family)
    {
        family = { id: createRuntimeId('geneo-family'), partnerIds: [firstPersonId, secondPersonId], children: [], relationshipType: 'Married', relationshipStatus: 'active', marriageType: 'Civil', events: [] }; diagram.families.push(family);
    }
    if (!diagram.connections.some(item => item.kind === 'family-partner' && item.familyId === family.id)) diagram.connections.push(geneoCreateConnection('family-partner', source, target, family.id));
    return family;
}

function addGeneographChildToFamily(familyId, childPersonId, target)
{
    const diagram = selectedGeneographDiagram(); const family = getGeneographFamily(familyId); if (!family) return null;
    if (!family.children.some(child => child.personId === childPersonId)) family.children.push({ personId: childPersonId, parentageType: 'biological' });
    if (!diagram.connections.some(item => item.kind === 'family-child' && item.familyId === familyId && item.target.nodeId === target.nodeId)) diagram.connections.push(geneoCreateConnection('family-child', { familyId, port: 'bottom' }, target, familyId));
    return family;
}

function createGeneographParentChildRelationship(parentPersonId, childPersonId, source, target)
{
    const diagram = selectedGeneographDiagram();
    let family = diagram.families.find(item => item.partnerIds.length === 1 && item.partnerIds[0] === parentPersonId);
    if (!family)
    {
        family = { id: createRuntimeId('geneo-family'), partnerIds: [parentPersonId], children: [], relationshipType: 'Unknown relationship', relationshipStatus: 'active', marriageType: '', events: [] }; diagram.families.push(family);
    }
    addGeneographChildToFamily(family.id, childPersonId, target);
    const connection = diagram.connections.find(item => item.kind === 'family-child' && item.familyId === family.id && item.target.nodeId === target.nodeId);
    if (connection && !connection.source.nodeId) connection.source = { ...source };
    return family;
}

function geneoCreateConnection(kind, source, target, familyId = null)
{
    geneoConnectionToolStyle();
    const overrides = { ...geneoConnectionToolRuntime.overrides };
    if (overrides.line) overrides.line = { ...overrides.line };
    if (kind !== 'visual') delete overrides.arrows;
    return { id: createRuntimeId('geneo-connection'), kind, familyId, source: { ...source }, target: { ...target }, visible: true, style: overrides, route: { mode: 'auto', waypoints: [] } };
}

function commitGeneographConnection(source, target)
{
    const result = canCreateGeneographConnection(source, target, geneoConnectionToolRuntime.purpose); if (!result.valid)
    {
        geneoConnectionToolRuntime.offerVisual = geneoConnectionToolRuntime.purpose !== 'visual'
            && Boolean(source.nodeId && target.nodeId && source.nodeId !== target.nodeId);
        showToast(result.reason); return false;
    }
    const diagram = selectedGeneographDiagram();
    const duplicate = geneoConnectionCandidateExists(source, target, result.kind);
    if (duplicate)
    {
        showToast('That connection already exists.'); return false;
    }
    geneoPushHistory();
    if (result.kind === 'family-partner') createGeneographPartnerRelationship(result.sourcePersonId, result.targetPersonId, source, target);
    else if (result.kind === 'family-sibling') createGeneographSiblingRelationship(result.sourcePersonId, result.targetPersonId, source, target);
    else if (result.kind === 'family-child' && result.familyId) addGeneographChildToFamily(result.familyId, result.childPersonId, result.childReference);
    else if (result.kind === 'family-child') createGeneographParentChildRelationship(result.parentPersonId, result.childPersonId, result.parentReference, result.childReference);
    else diagram.connections.push(geneoCreateConnection('visual', source, target));
    touchGeneographBoard(); return true;
}

function openGeneoMakeVisualConfirmation(connection)
{
    if (!connection || connection.kind === 'visual') return;
    const boardId = selectedGeneographBoard()?.id;
    const snapshot = geneoSnapshot();
    const family = getGeneographFamily(connection.familyId);
    const parents = (family?.partnerIds || []).map(id => selectedGeneographDiagram().nodes.find(node => node.type === 'person' && node.personId === id)).filter(Boolean);
    const needsParent = Boolean(connection.source.familyId || connection.target.familyId);
    if (needsParent && !parents.length) { showToast(t('Add a parent card before converting this connection.')); return; }
    openModal(`<div class="modal" role="dialog" aria-modal="true" aria-labelledby="geneoVisualTitle"><div class="modal-header"><h2 id="geneoVisualTitle">${escapeHtml(t('Make visual only?'))}</h2><button type="button" class="close-button" data-close aria-label="${escapeHtml(t('Close'))}">${icon.close}</button></div><div class="modal-body"><p>${escapeHtml(t('This removes the board relationship, not the people. The line will no longer be included in Family Tree sync. Family Tree records will not change.'))}</p>${connection.kind === 'family-partner' && family?.children.length ? `<p>${escapeHtml(t('Shared children will keep separate links to each parent.'))}</p>` : ''}${needsParent ? `<div class="field"><label for="geneoVisualParent">${escapeHtml(t('Connect visually from'))}</label><select id="geneoVisualParent">${parents.map(node => `<option value="${escapeHtml(node.id)}">${escapeHtml(geneoNodeTitle(node))}</option>`).join('')}</select></div>` : ''}</div><div class="modal-footer"><button class="button secondary" type="button" data-close>${escapeHtml(t('Cancel'))}</button><button class="button primary" type="button" data-geneo-confirm-visual>${escapeHtml(t('Make visual only'))}</button></div></div>`);
    modalBackdrop.querySelector('[data-geneo-confirm-visual]')?.addEventListener('click', () =>
    {
        if (selectedGeneographBoard()?.id !== boardId || geneoSnapshot() !== snapshot)
        { showToast(t('The board changed. Close this dialog and try again.')); return; }
        const current = getGeneographConnection(connection.id);
        if (!current) return;
        const diagram = selectedGeneographDiagram();
        const visual = structuredClone(current);
        if (needsParent)
        {
            const reference = { nodeId: modalBackdrop.querySelector('#geneoVisualParent').value, port: 'bottom' };
            if (visual.source.familyId) visual.source = reference;
            if (visual.target.familyId) visual.target = reference;
        }
        if (geneoConnectionCandidateExists(visual.source, visual.target, 'visual'))
        { showToast(t('That connection already exists.')); return; }
        geneoPushHistory();
        if (current.kind === 'family-partner' && family)
        {
            family.partnerIds.filter(() => family.children.length).forEach(parentId =>
            {
                const parentNode = diagram.nodes.find(node => node.type === 'person' && node.personId === parentId);
                let single = diagram.families.find(item => item.partnerIds.length === 1 && item.partnerIds[0] === parentId);
                if (!single)
                {
                    single = { id: createRuntimeId('geneo-family'), partnerIds: [parentId], children: [], relationshipType: 'Unknown relationship', relationshipStatus: 'active', marriageType: '', events: [] };
                    diagram.families.push(single);
                }
                family.children.forEach(child =>
                {
                    const childNode = diagram.nodes.find(node => node.type === 'person' && node.personId === child.personId);
                    if (!single.children.some(item => item.personId === child.personId)) single.children.push({ ...child });
                    if (!childNode || !parentNode) return;
                    const original = diagram.connections.find(item => item.kind === 'family-child' && item.familyId === family.id && item.target.nodeId === childNode.id);
                    if (!diagram.connections.some(item => item.kind === 'family-child' && item.familyId === single.id && item.target.nodeId === childNode.id))
                        diagram.connections.push({ ...(original ? structuredClone(original) : geneoCreateConnection('family-child', {}, {}, single.id)),
                            id: createRuntimeId('geneo-connection'), familyId: single.id,
                            source: { nodeId: parentNode.id, port: 'bottom' }, target: { nodeId: childNode.id, port: 'top' }, route: { mode: 'auto', waypoints: [] } });
                });
            });
            diagram.connections = diagram.connections.filter(item => item.familyId !== family.id);
            diagram.families = diagram.families.filter(item => item.id !== family.id);
        }
        else removeGeneographRelationship(current.id);
        visual.kind = 'visual';
        visual.familyId = null;
        if (diagram.connectionDefaults.arrows !== 'none') visual.style.arrows = 'none';
        delete visual.showRelationshipDates;
        diagram.connections.push(visual);
        selectGeneographConnection(visual.id);
        touchGeneographBoard();
        closeModal();
        renderGeneographEditorPreserveScroll();
    });
}

function removeGeneographRelationship(connectionId)
{
    const diagram = selectedGeneographDiagram(); const connection = getGeneographConnection(connectionId); if (!connection) return;
    diagram.connections = diagram.connections.filter(item => item.id !== connectionId);
    if (connection.kind === 'family-partner' && connection.familyId)
    {
        const family = getGeneographFamily(connection.familyId);
        diagram.connections = diagram.connections.filter(item => item.familyId !== connection.familyId);
        diagram.families = diagram.families.filter(item => item.id !== connection.familyId);
    }
    else if (connection.kind === 'family-child' && connection.familyId)
    {
        const family = getGeneographFamily(connection.familyId); const childId = geneoPersonIdForNode(connection.target.nodeId);
        if (family && childId) family.children = family.children.filter(child => child.personId !== childId);
        if (family && !family.partnerIds.length && !family.children.length) diagram.families = diagram.families.filter(item => item.id !== family.id);
    }
    else if (connection.kind === 'family-sibling' && connection.familyId)
    {
        rebuildGeneographSiblingFamily(connection.familyId);
    }
}

function geneoObjectGroupNodes(nodeIds = [...geneoSelectedNodeIdSet()])
{
    const diagram = selectedGeneographDiagram();
    if (!diagram) return [];
    const included = new Set(nodeIds);
    let changed = true;
    while (changed)
    {
        changed = false;
        diagram.nodes.forEach(node =>
        {
            if (node.parentPanelId && included.has(node.parentPanelId) && !included.has(node.id))
            {
                included.add(node.id);
                changed = true;
            }
        });
    }
    return diagram.nodes.filter(node => included.has(node.id));
}

function geneoObjectSnapshot(nodes)
{
    const diagram = selectedGeneographDiagram();
    if (!diagram || !nodes.length) return null;
    const personIds = new Set(nodes.filter(node => node.type === 'person').map(node => node.personId));
    const assetIds = new Set(nodes.filter(node => node.type === 'image' && node.imageRef?.scope === 'board').map(node => node.imageRef.id));
    diagram.people.forEach(person =>
    {
        if (personIds.has(person.id) && person.photoAssetId) assetIds.add(person.photoAssetId);
    });
    return structuredClone({
        boardId: selectedGeneographBoard().id,
        nodes,
        people: diagram.people.filter(person => personIds.has(person.id)),
        assets: (diagram.assets || []).filter(asset => assetIds.has(asset.id)),
        pasteCount: 0
    });
}

function copyGeneographSelection()
{
    const snapshot = geneoObjectSnapshot(geneoObjectGroupNodes());
    if (!snapshot) return false;
    geneoObjectClipboard = { ...snapshot, mode: 'copy' };
    return true;
}

function geneoDetachCutPeople(personIds)
{
    if (!personIds.size) return;
    const diagram = selectedGeneographDiagram();
    diagram.families = diagram.families.filter(family =>
    {
        family.partnerIds = family.partnerIds.filter(id => !personIds.has(id));
        family.children = family.children.filter(child => !personIds.has(child.personId));
        return family.partnerIds.length || family.relationshipType === 'Sibling relationship' && family.children.length;
    });
    const familyIds = new Set(diagram.families.map(family => family.id));
    diagram.connections = diagram.connections.filter(connection =>
        !connection.familyId || familyIds.has(connection.familyId));
}

function cutGeneographSelection()
{
    const nodes = geneoObjectGroupNodes();
    const snapshot = geneoObjectSnapshot(nodes);
    if (!snapshot) return false;
    geneoObjectClipboard = { ...snapshot, mode: 'cut' };
    setGeneographNodeSelection(nodes.map(node => node.id));
    deleteGeneographSelection({ detachFamilies: true });
    return true;
}

function pasteGeneographObjects(snapshot = geneoObjectClipboard, { duplicate = false } = {})
{
    const diagram = selectedGeneographDiagram();
    if (!diagram || !snapshot?.nodes?.length || snapshot.boardId !== selectedGeneographBoard()?.id) return false;
    const cut = snapshot.mode === 'cut' && !duplicate;
    if (cut && snapshot.nodes.some(node => diagram.nodes.some(existing => existing.id === node.id
        || node.type === 'person' && existing.type === 'person' && existing.personId === node.personId)))
    {
        geneoObjectClipboard = null;
        showToast(t('Cut objects are already on this board.'));
        return false;
    }
    if (cut && snapshot.people.some(person => !diagram.people.some(item => item.id === person.id)))
    {
        geneoObjectClipboard = null;
        showToast(t('Cut objects are no longer available.'));
        return false;
    }
    const assetIds = new Set((diagram.assets || []).map(asset => asset.id));
    const missingAssets = snapshot.assets.filter(asset => !assetIds.has(asset.id));
    const personMap = new Map();
    const nodeMap = new Map(snapshot.nodes.map(node => [node.id, createRuntimeId('geneo-node')]));
    const minX = Math.min(...snapshot.nodes.map(node => node.x));
    const minY = Math.min(...snapshot.nodes.map(node => node.y));
    const maxX = Math.max(...snapshot.nodes.map(node => node.x + node.width));
    const maxY = Math.max(...snapshot.nodes.map(node => node.y + node.height));
    const center = geneoCurrentViewportCenter() || geneoContentCenter();
    const offset = duplicate ? 24 : (snapshot.pasteCount || 0) * 24;
    const dx = duplicate ? 24 : center.x - (minX + maxX) / 2 + offset;
    const dy = duplicate ? 24 : center.y - (minY + maxY) / 2 + offset;
    const nextOrder = Math.max(0, ...diagram.nodes.map(node => node.order || 0));

    geneoPushHistory();
    if (missingAssets.length) diagram.assets.push(...structuredClone(missingAssets));
    if (!cut)
    {
        snapshot.people.forEach(person =>
        {
            const id = createRuntimeId('geneo-person');
            personMap.set(person.id, id);
            diagram.people.push({ ...structuredClone(person), id, treePersonId: null, syncState: 'local' });
        });
    }
    const pastedNodes = snapshot.nodes.map((node, index) => ({
        ...structuredClone(node),
        id: nodeMap.get(node.id),
        personId: node.type === 'person' ? (personMap.get(node.personId) || node.personId) : node.personId,
        parentPanelId: nodeMap.get(node.parentPanelId) || null,
        x: geneoNumber(node.x + dx, node.x, -GENEO_WORLD_LIMIT, GENEO_WORLD_LIMIT),
        y: geneoNumber(node.y + dy, node.y, -GENEO_WORLD_LIMIT, GENEO_WORLD_LIMIT),
        order: nextOrder + index + 1
    }));
    diagram.nodes.push(...pastedNodes);
    setGeneographNodeSelection(pastedNodes.map(node => node.id), pastedNodes.at(-1)?.id);
    touchGeneographBoard();
    renderGeneographEditorPreserveScroll();
    if (cut) geneoObjectClipboard = null;
    else if (!duplicate) snapshot.pasteCount += 1;
    return true;
}

function duplicateGeneographSelection()
{
    const snapshot = geneoObjectSnapshot(geneoObjectGroupNodes());
    return snapshot ? pasteGeneographObjects({ ...snapshot, mode: 'copy' }, { duplicate: true }) : false;
}

function geneoSetSelectedObjectsProperty(property, value)
{
    const nodes = geneoObjectGroupNodes();
    if (!nodes.length || nodes.every(node => node[property] === value)) return;
    geneoPushHistory();
    nodes.forEach(node => { node[property] = value; });
    if (property === 'visible' && !value) selectGeneographCanvas();
    touchGeneographBoard();
    renderGeneographEditorPreserveScroll();
}

