function renderGeneographEditorSidebar(board)
{
    const diagram = board.diagram;
    const query = state.geneoLayerSearch.trim().toLowerCase();
    const selectedIds = geneoSelectedNodeIdSet();
    const selectedConnectionIds = geneoSelectedConnectionIdSet();
    const matches = node => geneoItemFilterMatches(node.type, geneoNodeEffectiveVisible(node), selectedIds.has(node.id))
        && (!query || `${geneoNodeTitle(node)} ${node.type} ${t(node.type)} ${node.visible === false ? t('Hidden') : ''}`.toLowerCase().includes(query));
    const connections = diagram.connections.filter(connection => {
        if (!geneoItemFilterMatches(connection.kind, geneoConnectionEffectiveVisible(connection), selectedConnectionIds.has(connection.id))) return false;
        const names = `${geneoConnectionLabel(connection)} ${geneoDefaultConnectionLabel(connection)} ${geneoConnectionKindLabel(connection)} ${connection.kind} ${connection.visible === false ? t('Hidden') : ''}`;
        return !query || names.toLowerCase().includes(query);
    });
    const filter = state.geneoItemFilter || { types: [], status: 'all' };
    const filterActive = filter.types.length || filter.status !== 'all';
    const ownedConnections = new Map();
    const orphanConnections = [];
    const visibleIds = new Set(diagram.nodes.filter(matches).map(node => node.id));
    connections.forEach(connection =>
    {
        const owner = geneoSidebarConnectionOwner(connection, diagram);
        if (!owner) { orphanConnections.push(connection); return; }
        if (!ownedConnections.has(owner)) ownedConnections.set(owner, []);
        ownedConnections.get(owner).push(connection);
        visibleIds.add(owner);
    });
    [...visibleIds].forEach(id =>
    {
        let node = diagram.nodes.find(item => item.id === id);
        const seen = new Set();
        while (node?.parentPanelId && !seen.has(node.parentPanelId))
        { seen.add(node.parentPanelId); visibleIds.add(node.parentPanelId); node = diagram.nodes.find(item => item.id === node.parentPanelId); }
    });
    const rootItems = diagram.nodes.filter(node => !node.parentPanelId && visibleIds.has(node.id)).sort((a, b) => b.order - a.order);
    const row = (
        node,
        depth = 0
    ) =>
    {
        const displayName =
            geneoNodeTitle(node);

        const renaming =
            geneoLayerRenameMatches(
                'node',
                node.id
            );

        return `
          <div
            class="geneo-layer-row ${
                selectedIds.has(node.id)
                    ? 'selected'
                    : ''
            }"
            style="--layer-depth:${depth}"
            data-geneo-layer-type="${escapeHtml(node.type)}"
            data-geneo-layer="${
                escapeHtml(node.id)
            }"
            draggable="${!renaming && !geneoNodeEffectiveLocked(node)}"
            tabindex="${renaming ? -1 : 0}">
            <span class="geneo-layer-icon">
              ${geneoNodeIcon(node.type)}
            </span>

            ${
                renderGeneographLayerNameCell(
                    'node',
                    node.id,
                    displayName
                )
            }

            <span class="geneo-layer-actions">
              <button class="geneo-layer-toggle" type="button" data-geneo-locate-node="${escapeHtml(node.id)}" ${geneoNodeEffectiveVisible(node) ? '' : 'disabled'} aria-label="${escapeHtml(`${t('Locate on canvas')}: ${displayName}`)}" title="${escapeHtml(t('Locate on canvas'))}">${icon.mapCenter}</button>

            <button
              class="geneo-layer-toggle"
              type="button"
              data-geneo-toggle-visible="${
                    escapeHtml(node.id)
                }"
              aria-label="${
                    node.visible
                        ? 'Hide'
                        : 'Show'
                } ${escapeHtml(displayName)}">
              ${
                    node.visible
                        ? icon.eye
                        : icon.eyeOff
                }
            </button>

            <button
              class="geneo-layer-toggle"
              type="button"
              data-geneo-toggle-lock="${
                    escapeHtml(node.id)
                }"
              aria-label="${
                    node.locked
                        ? 'Unlock'
                        : 'Lock'
                } ${escapeHtml(displayName)}">
              ${
                    node.locked
                        ? icon.lock
                        : icon.unlock
                }
            </button>
            </span>
          </div>
        `;
    };
    const connectionRow =
        (connection, depth = 1) =>
        {
            const displayName =
                geneoConnectionLabel(
                    connection
                );

            const renaming =
                geneoLayerRenameMatches(
                    'connection',
                    connection.id
                );

            return `
          <div
            class="geneo-layer-row ${
                selectedConnectionIds.has(
                    connection.id
                )
                    ? 'selected'
                    : ''
            }"
            style="--layer-depth:${depth}"
            draggable="false"
            data-geneo-layer-connection="${
                escapeHtml(connection.id)
            }"
            tabindex="${renaming ? -1 : 0}">
            <span class="geneo-layer-icon">
              ${icon.link}
            </span>

            <span class="geneo-layer-identity">
              ${renderGeneographLayerNameCell('connection', connection.id, displayName)}
              <span class="geneo-layer-subtitle" title="${escapeHtml(geneoDefaultConnectionLabel(connection))}">${escapeHtml(normalizeGeneographLayerName(connection.name) ? geneoDefaultConnectionLabel(connection) : geneoConnectionKindLabel(connection))}</span>
            </span>
            <span class="geneo-layer-paint-status" data-geneo-connection-paint-status ${connection.visible === false || geneoEffectiveConnectionStyle(connection).line.enabled ? 'hidden' : ''}>${escapeHtml(t('No stroke'))}</span>
            <span class="geneo-layer-actions">
              <button class="geneo-layer-toggle" type="button" data-geneo-locate-connection="${escapeHtml(connection.id)}" ${geneoConnectionEffectiveVisible(connection) ? '' : 'disabled'} aria-label="${escapeHtml(`${t('Locate on canvas')}: ${displayName}`)}" title="${escapeHtml(t('Locate on canvas'))}">${icon.mapCenter}</button>
              <button class="geneo-layer-toggle" type="button" data-geneo-toggle-connection-visible="${escapeHtml(connection.id)}" aria-label="${escapeHtml(`${t(connection.visible === false ? 'Show' : 'Hide')} ${displayName}`)}" title="${escapeHtml(t(connection.visible === false ? 'Show' : 'Hide'))}">${connection.visible === false ? icon.eyeOff : icon.eye}</button>
            </span>
          </div>
        `;
        };
    if (!geneoConnectionDisclosureState.has(board.id)) geneoConnectionDisclosureState.set(board.id, new Set());
    const expanded = geneoConnectionDisclosureState.get(board.id);
    const previousConnectionSelection = geneoConnectionDisclosureSelection.get(board.id) || new Set();
    geneoConnectionDisclosureSelection.set(board.id, new Set(selectedConnectionIds));
    connections.filter(connection => selectedConnectionIds.has(connection.id) && !previousConnectionSelection.has(connection.id)).forEach(connection =>
    {
        let owner = diagram.nodes.find(node => node.id === geneoSidebarConnectionOwner(connection, diagram));
        const seen = new Set();
        while (owner && !seen.has(owner.id))
        {
            seen.add(owner.id);
            expanded.add(owner.id);
            if (owner.type === 'panel') state.geneoCollapsedPanels[owner.id] = false;
            owner = diagram.nodes.find(node => node.id === owner.parentPanelId);
        }
    });
    const renderBlock = (node, depth = 0) =>
    {
        const children = diagram.nodes.filter(child => child.parentPanelId === node.id && visibleIds.has(child.id)).sort((a, b) => b.order - a.order);
        const links = ownedConnections.get(node.id) || [];
        const expandable = children.length || links.length;
        const collapsed = !query && !filterActive && (node.type === 'panel' ? Boolean(state.geneoCollapsedPanels[node.id]) : !expanded.has(node.id));
        return `<div class="geneo-item-block" data-geneo-layer-block="${escapeHtml(node.id)}">${expandable ? `<div class="geneo-layer-panel-head" style="--layer-depth:${depth}"><button class="geneo-layer-disclosure" type="button" ${node.type === 'panel' ? 'data-geneo-collapse-panel' : 'data-geneo-collapse-connections'}="${escapeHtml(node.id)}" aria-label="${escapeHtml(geneoNodeTitle(node))}" aria-expanded="${!collapsed}">${icon.chevron}</button>${row(node, depth)}</div>` : row(node, depth)}${collapsed ? '' : children.map(child => renderBlock(child, depth + 1)).join('') + links.map(connection => connectionRow(connection, depth + 1)).join('')}</div>`;
    };
    const itemsMarkup = rootItems.map(node => renderBlock(node)).join('') + (orphanConnections.length ? `<div class="geneo-other-connections"><div class="geneo-context-heading">${escapeHtml(t('Other connections'))}</div>${orphanConnections.map(connection => connectionRow(connection, 0)).join('')}</div>` : '');
    sidebar.innerHTML = `<nav class="geneo-sidebar geneo-board-panel" aria-label="Geneograph board navigation">
        <section class="geneo-sidebar-section navigation"><div class="side-section-title">Navigation</div><div class="side-nav">${renderGeneoAllBoardsNavigationButton({ editor: true })}</div></section>
        <section class="geneo-sidebar-section geneo-layers"><div class="side-section-title">${escapeHtml(t('Board items'))}</div><div class="geneo-sidebar-section-body"><div class="geneo-layer-tools"><input class="geneo-object-search" id="geneoLayerSearch" type="search" aria-label="${escapeHtml(t('Search board items'))}" placeholder="${escapeHtml(t('Search board items'))}" value="${escapeHtml(state.geneoLayerSearch)}"><button class="geneo-item-filter-trigger ${filterActive ? 'active' : ''}" type="button" data-geneo-item-filter-trigger aria-label="${escapeHtml(t('Filter items'))}" title="${escapeHtml(t('Filter items'))}" aria-expanded="${Boolean(state.geneoItemFilterOpen)}" aria-controls="geneoItemFilterMenu">${icon.filter}</button><div id="geneoItemFilterMenu">${renderGeneoItemFilterMenu()}</div></div><div class="geneo-layer-list">${itemsMarkup}${!rootItems.length && !orphanConnections.length ? `<div class="geneo-item-empty">${escapeHtml(t(diagram.nodes.length || diagram.connections.length ? 'No matching items' : 'No items on this board'))}${(diagram.nodes.length || diagram.connections.length) && (query || filterActive) ? `<button type="button" data-geneo-item-filter-clear>${escapeHtml(t('Clear search and filters'))}</button>` : ''}</div>` : ''}</div></div></section>
      </nav>`;

    localizeUI(
        sidebar,
        {
            suppressObserverReplay: true
        }
    );
}

function geneoConnectionEndpointNames(reference)
{
    return [...new Set(geneoConnectionReferenceNodes(reference)
        .map(node => geneoNodeTitle(node)))];
}

function geneoConnectionKindLabel(connection)
{
    return t({
        'family-partner': 'Partners',
        'family-child': 'Parent-child relationship',
        'family-sibling': 'Siblings',
        visual: 'Visual connection'
    }[connection.kind] || 'Visual connection');
}

function geneoDefaultConnectionLabel(connection)
{
    const source = geneoConnectionEndpointNames(connection.source);
    const target = geneoConnectionEndpointNames(connection.target);
    if (!source.length || !target.length) return geneoConnectionKindLabel(connection);
    if (connection.kind === 'family-child')
        return `${target.join(' & ')} · ${t(source.length === 1 ? 'Parent' : 'Parents')}: ${source.join(' & ')}`;
    return `${source.join(' & ')} - ${target.join(' & ')}`;
}

function geneoConnectionLabel(
    connection
)
{
    return (
        normalizeGeneographLayerName(
            connection?.name
        )
        || geneoDefaultConnectionLabel(
            connection
        )
    );
}

function getGeneographRenameEntity(
    entityType,
    entityId
)
{
    if (entityType === 'node')
    {
        return getGeneographNode(entityId);
    }

    if (entityType === 'connection')
    {
        return getGeneographConnection(
            entityId
        );
    }

    return null;
}

function geneoRenameEntityDisplayName(
    entityType,
    entity
)
{
    return entityType === 'node'
        ? geneoNodeTitle(entity)
        : geneoConnectionLabel(entity);
}

function geneoLayerRenameMatches(
    entityType,
    entityId
)
{
    return Boolean(
        state.geneoLayerRename
        && state.geneoLayerRename.entityType
          === entityType
        && state.geneoLayerRename.entityId
          === entityId
    );
}

function renameGeneographEntity(
    entityType,
    entityId,
    value
)
{
    const entity =
        getGeneographRenameEntity(
            entityType,
            entityId
        );

    if (!entity) return false;

    const currentName =
        normalizeGeneographLayerName(
            entity.name
        );

    const nextName =
        normalizeGeneographLayerName(
            value
        );

    if (currentName === nextName)
    {
        return false;
    }

    geneoPushHistory();

    entity.name = nextName;

    touchGeneographBoard();

    return true;
}

function focusGeneographLayerRow(
    entityType,
    entityId
)
{
    const attribute =
        entityType === 'node'
            ? 'data-geneo-layer'
            : 'data-geneo-layer-connection';

    const selector =
        `[${attribute}="${
            CSS.escape(String(entityId))
        }"]`;

    sidebar
        .querySelector(selector)
        ?.focus({
            preventScroll: true
        });
}

function beginGeneographLayerRename(
    entityType,
    entityId
)
{
    const entity =
        getGeneographRenameEntity(
            entityType,
            entityId
        );

    if (!entity) return;

    if (entityType === 'node')
    {
        selectGeneographNode(entityId);
    }
    else
    {
        selectGeneographConnection(
            entityId
        );
    }

    const originalName =
        normalizeGeneographLayerName(
            entity.name
        );

    const initialDisplay =
        localizedDataFieldValue(
            normalizeGeneographLayerName(
                geneoRenameEntityDisplayName(
                    entityType,
                    entity
                )
            )
        );

    state.geneoLayerRename = {
        entityType,
        entityId,
        originalName,
        initialDisplay,
        draft: initialDisplay
    };

    renderGeneographEditorPreserveScroll();

    requestAnimationFrame(() =>
    {
        const input =
            sidebar.querySelector(
                '[data-geneo-layer-rename-input]'
            );

        if (!input) return;

        input.focus({
            preventScroll: true
        });

        input.select();
    });
}

function finishGeneographLayerRename({
    cancel = false,
    value = '',
    restoreFocus = true
} = {})
{
    const rename =
        state.geneoLayerRename;

    if (!rename) return;

    const {
        entityType,
        entityId,
        originalName,
        initialDisplay
    } = rename;

    state.geneoLayerRename = null;

    if (!cancel)
    {
        const submittedName =
            normalizeGeneographLayerName(
                value
            );

        /*
        * Pressing Enter without editing an
        * automatic fallback should not freeze
        * that fallback as a custom name.
        */
        const nextName =
            submittedName === initialDisplay
                ? originalName
                : submittedName;

        renameGeneographEntity(
            entityType,
            entityId,
            nextName
        );
    }

    renderGeneographEditorPreserveScroll();

    if (!restoreFocus) return;

    requestAnimationFrame(() =>
    {
        focusGeneographLayerRow(
            entityType,
            entityId
        );
    });
}

function renderGeneographLayerNameCell(
    entityType,
    entityId,
    displayName
)
{
    const localizedDisplayName =
        localizedDataFieldValue(
            displayName
        );

    if (
        geneoLayerRenameMatches(
            entityType,
            entityId
        )
    )
    {
        return `
          <input
            class="geneo-layer-name-input"
            type="text"
            maxlength="${GENEO_LAYER_NAME_LIMIT}"
            value="${
                escapeHtml(
                    state.geneoLayerRename.draft
                )
            }"
            data-geneo-layer-rename-input
            data-geneo-rename-type="${
                escapeHtml(entityType)
            }"
            data-geneo-rename-id="${
                escapeHtml(entityId)
            }"
            data-user-content
            aria-label="${
                entityType === 'node'
                    ? 'Rename layer'
                    : 'Rename connection'
            }">
        `;
    }

    return `
        <span
          class="name"
          data-geneo-layer-rename-handle
          data-user-content
          title="${escapeHtml(localizedDisplayName)}">
          ${escapeHtml(localizedDisplayName)}
        </span>
      `;
}

function geneoRelationshipForFamily(family)
{
    return { relationship: family, central: false };
}

function geneoResolveBoardPersonPlace(value)
{
    const text = String(value?.text ?? value ?? '').trim();
    const projectId = selectedGeneographBoard()?.projectId || currentProjectId();
    const selected = text && (sampleData.places || []).find(place => place.id === value?.selectedPlaceId && place.projectId === projectId && !place.deleted);
    const place = selected || (text ? findExactPlaceMatch(text, projectId) : null);
    return { placeId: place?.id || null, placeText: text, address: value?.address || '', created: false };
}

function geneoEffectiveShowRelationshipDates(connection, diagram = selectedGeneographDiagram())
{
    return connection?.showRelationshipDates ?? diagram?.connectionDefaults?.showRelationshipDates ?? false;
}

function geneoPartnerRelationshipDateLabel(connection)
{
    if (connection?.kind !== 'family-partner' || !geneoEffectiveShowRelationshipDates(connection)) return '';
    const family = getGeneographFamily(connection.familyId);
    const relationship = geneoRelationshipForFamily(family).relationship;
    return partnerRelationshipDateSummary(relationship).rangeLabel || '';
}

function renderGeneographRelationshipDateLabel(connection, points)
{
    const label = geneoPartnerRelationshipDateLabel(connection);
    const midpoint = label ? geneoPolylineMidpoint(points) : null;
    if (!midpoint) return '';
    const width = Math.max(72, Math.min(260, label.length * 7 + 20));
    return `<g class="geneo-relationship-date" transform="translate(${midpoint.x} ${midpoint.y - 18})" aria-label="Relationship date ${escapeHtml(label)}"><rect x="${-width / 2}" y="-13" width="${width}" height="24" rx="4"></rect><text text-anchor="middle" dominant-baseline="middle">${escapeHtml(label)}</text></g>`;
}

function geneoRgbToHsv({ r, g, b })
{
    const red = r / 255;
    const green = g / 255;
    const blue = b / 255;
    const maximum = Math.max(red, green, blue);
    const minimum = Math.min(red, green, blue);
    const delta = maximum - minimum;
    let hue = 0;
    if (delta)
    {
        if (maximum === red) hue = 60 * (((green - blue) / delta) % 6);
        else if (maximum === green) hue = 60 * ((blue - red) / delta + 2);
        else hue = 60 * ((red - green) / delta + 4);
    }
    if (hue < 0) hue += 360;
    return {
        h: hue,
        s: maximum ? delta / maximum * 100 : 0,
        v: maximum * 100
    };
}

function geneoHsvToHex({ h, s, v })
{
    const hue = ((geneoNumber(h, 0) % 360) + 360) % 360;
    const saturation = geneoNumber(s, 0, 0, 100) / 100;
    const value = geneoNumber(v, 0, 0, 100) / 100;
    const chroma = value * saturation;
    const x = chroma * (1 - Math.abs((hue / 60) % 2 - 1));
    const offset = value - chroma;
    let channels = [0, 0, 0];
    if (hue < 60) channels = [chroma, x, 0];
    else if (hue < 120) channels = [x, chroma, 0];
    else if (hue < 180) channels = [0, chroma, x];
    else if (hue < 240) channels = [0, x, chroma];
    else if (hue < 300) channels = [x, 0, chroma];
    else channels = [chroma, 0, x];
    return `#${channels.map(channel => Math.round((channel + offset) * 255).toString(16).padStart(2, '0')).join('')}`.toUpperCase();
}

function geneoPaintTargetKey(target)
{
    return target ? `${target.scope}:${target.id || 'canvas'}:${target.property}` : '';
}

function geneoBulkPaintScope(scope)
{
    return ['person-multi', 'node-multi', 'connection-multi'].includes(scope);
}

function geneoBulkPaintValue(target, item)
{
    return target.scope === 'connection-multi' ? geneoEffectiveConnectionStyle(item).line
        : target.scope === 'person-multi' ? geneoResolveVisibleNodeAppearance(item)[target.property]
            : geneoBulkNodeValue(item, target.property);
}

function geneoBulkPaintTarget(scope, property)
{
    const connections = scope === 'connection-multi';
    const items = connections ? selectedGeneographConnections() : selectedGeneographNodes();
    if (!items.length || (connections && property !== 'line')
        || (!connections && (!['fill', 'stroke', 'text'].includes(property)
            || items.some(node => scope === 'person-multi' ? node.type !== 'person'
                : !geneoBulkNodeSupports(node, property))))) return null;
    const target = { scope, id: '', property, items, label: connections ? t('Connection color') : t(capitalize(property)),
        supportsOpacity: true, supportsNone: property !== 'text', resettable: false,
        defaultPaint: connections ? selectedGeneographDiagram().connectionDefaults.line
            : { color: '#FFFFFF', opacity: 100, enabled: true } };
    const values = items.map(item => geneoBulkPaintValue(target, item));
    const shared = field => values.every(value => value[field] === values[0][field]) ? values[0][field] : null;
    target.mixed = { color: shared('color') === null, opacity: shared('opacity') === null,
        enabled: shared('enabled') === null };
    target.paint = { color: shared('color') || target.defaultPaint.color,
        opacity: shared('opacity') ?? 100, enabled: shared('enabled') ?? true };
    return target;
}

function geneoApplyBulkPaintChanges(target, changes)
{
    const diagram = selectedGeneographDiagram();
    if (!diagram) return;
    target.items.forEach(item =>
    {
        for (const [field, value] of Object.entries(changes))
        {
            if (target.scope !== 'connection-multi')
            {
                geneoUpdateBulkNodeAppearance(item, target.property, field, value, diagram);
                continue;
            }
            const line = { ...geneoEffectiveConnectionStyle(item).line, [field]: value };
            item.style ||= {};
            if (['color', 'opacity', 'enabled'].every(key => line[key] === diagram.connectionDefaults.line[key]))
                delete item.style.line;
            else item.style.line = line;
        }
    });
}

function geneoRestoreBulkPaintItems(interaction)
{
    interaction.beforeItems.forEach(({ id, appearance, style }) =>
    {
        if (appearance)
        {
            const node = getGeneographNode(id);
            if (node) node.appearance = structuredClone(appearance);
        }
        else
        {
            const connection = getGeneographConnection(id);
            if (connection) connection.style = structuredClone(style);
        }
    });
}

function resolveGeneoPaintTarget(reference)
{
    if (!reference) return null;
    const { scope, id = '', property } = reference;
    if (geneoBulkPaintScope(scope)) return geneoBulkPaintTarget(scope, property);
    if (scope === 'creation-tool' && ['drawing', 'shape'].includes(id) && ['fill', 'stroke'].includes(property))
    {
        const appearance = geneoCreationToolSettings(id).appearance;
        if (id === 'drawing' && property === 'fill') return null;
        return { scope, id, property, label: t(capitalize(property)), paint: appearance[property],
            supportsOpacity: true, supportsNone: true, resettable: false,
            defaultPaint: geneoNodeDefaults(id).appearance[property] };
    }
    if (scope === 'connection-default' && property === 'line')
    {
        const line = selectedGeneographDiagram()?.connectionDefaults?.line;
        if (!line) return null;
        return { scope, id, property, label: t('Connection color'), paint: line,
            supportsOpacity: true, supportsNone: false, resettable: false,
            defaultPaint: geneoDefaultConnectionStyle().line };
    }
    if (scope === 'connection-tool' && property === 'line')
    {
        geneoPaintRuntime.toolPaint ||= { ...geneoConnectionToolStyle().line };
        return { scope, id, property, label: t('Connection color'), paint: geneoPaintRuntime.toolPaint,
            supportsOpacity: true, supportsNone: false, resettable: false,
            defaultPaint: selectedGeneographDiagram().connectionDefaults.line };
    }
    if (scope === 'card-default')
    {
        const appearance = selectedGeneographDiagram()?.cardAppearanceDefaults?.[id];
        if (!appearance || !['fill', 'stroke', 'text'].includes(property)) return null;
        return {
            scope, id, property, label: capitalize(property),
            paint: appearance[property],
            supportsOpacity: true, supportsNone: property !== 'text', resettable: false,
            defaultPaint: geneoDefaultCardAppearances()[id][property]
        };
    }
    if (scope === 'canvas')
    {
        const canvas = selectedGeneographDiagram()?.canvas;
        if (!canvas || property !== 'background') return null;
        return {
            scope, id: selectedGeneographBoard()?.id || '', property,
            label: 'Background', paint: canvas.backgroundPaint,
            supportsOpacity: false, supportsNone: false, resettable: false,
            defaultPaint: { color: geneoDefaultCanvasColor(), opacity: 100, enabled: true }
        };
    }
    if (scope === 'connection')
    {
        const connection = getGeneographConnection(id);
        if (!connection || property !== 'line') return null;
        return {
            scope, id, property, entity: connection,
            label: 'Connection color', paint: connection.style.line || { ...geneoEffectiveConnectionStyle(connection).line },
            supportsOpacity: true, supportsNone: true, resettable: true,
            defaultPaint: selectedGeneographDiagram().connectionDefaults.line
        };
    }
    if (scope !== 'node') return null;
    const node = getGeneographNode(id);
    if (!node || !['fill', 'stroke', 'text'].includes(property)) return null;
    const applicable =
        property === 'text'
            ? node.type !== 'image'
            : property !== 'fill' || node.type !== 'image';
    if (!applicable) return null;
    const defaults = geneoNodeDefaults(node.type).appearance;
    const person = node.type === 'person';
    const inheritedPaint = person ? geneoPersonGenderAppearance(node)?.[property] : null;
    const hasPaintOverride = person && node.appearance.paintOverrides?.[property] === true;
    return {
        scope, id, property, entity: node,
        label:
          property === 'fill'
              ? (
                  node.type === 'text'
                      ? 'Background'
                      : 'Fill'
              )
              : property === 'text'
                  ? node.type === 'panel' ? 'Title text' : 'Text'
                  : 'Stroke',
        // The inspector reads the same effective paint as the canvas.
        // Do not expose an inherited preset for mutation: edits must be
        // written as an individual node override instead.
        paint: person && !hasPaintOverride ? structuredClone(inheritedPaint) : node.appearance[property],
        supportsOpacity: true,
        supportsNone: property !== 'text',
        resettable: property === 'text',
        defaultPaint: inheritedPaint || defaults[property]
    };
}

function geneoPaintReferenceFromElement(element)
{
    const host = element?.closest?.('[data-geneo-paint-scope]');
    if (!host) return null;
    return {
        scope: host.dataset.geneoPaintScope,
        id: host.dataset.geneoPaintId || '',
        property: host.dataset.geneoPaintProperty
    };
}

function geneoPaintDataAttributes(target)
{
    return `data-geneo-paint-scope="${escapeHtml(target.scope)}" data-geneo-paint-id="${escapeHtml(target.id || '')}" data-geneo-paint-property="${escapeHtml(target.property)}"`;
}

function geneoPaintSwatchStyle(paint)
{
    return `--geneo-paint-color:${normalizeGeneoHexColor(paint.color)};--geneo-paint-rendered:${geneoPaintCssColor({ ...paint, enabled: true })}`;
}

function renderGeneoPaintControl(reference)
{
    const target = resolveGeneoPaintTarget(reference);
    if (!target) return '';

    const paint = target.paint;
    const disabled = !paint.enabled;
    const actionSubject = target.label.toLowerCase();

    const action = target.supportsNone
        ? `
          <button
            class="geneo-paint-action"
            type="button"
            data-geneo-paint-toggle
            aria-label="${escapeHtml(
                disabled
                    ? `Restore ${actionSubject} color`
                    : `Remove ${actionSubject} color`
            )}">
            ${escapeHtml(t(disabled ? 'Restore' : 'Remove'))}
          </button>
        `
        : target.resettable
            ? `
            <button
              class="geneo-paint-action"
              type="button"
              data-geneo-paint-reset
              aria-label="${escapeHtml(
                    `Reset ${actionSubject} color to default`
                )}">
              Reset
            </button>
          `
            : '';

    return `
        <div
          class="geneo-paint-row ${disabled ? 'is-none' : ''}"
          ${geneoPaintDataAttributes(target)}>

          <div class="geneo-paint-row-heading">
            <div class="geneo-paint-heading-copy">
              <span class="geneo-paint-label">
                ${escapeHtml(target.label)}
              </span>

              <span
                class="geneo-paint-state"
                data-geneo-paint-state
                ${disabled ? '' : 'hidden'}>
                ${escapeHtml(t('None'))}
              </span>
            </div>

            ${action}
          </div>

          <div class="geneo-paint-controls ${
                target.supportsOpacity ? '' : 'is-color-only'
            }">
            <button
              class="geneo-paint-swatch"
              type="button"
              data-geneo-paint-open
              style="${geneoPaintSwatchStyle(paint)}"
              aria-label="${escapeHtml(
                    `Edit ${target.label} color, ${
                        disabled
                            ? 'None'
                            : `${paint.color}, ${paint.opacity}% opacity`
                    }`
                )}"
              aria-expanded="false"
              aria-controls="geneoPaintPopover"
              ${disabled ? 'disabled' : ''}>
              <span aria-hidden="true"></span>
            </button>

            <input
              class="geneo-paint-hex"
              type="text"
              value="${escapeHtml(paint.color)}"
              maxlength="7"
              spellcheck="false"
              autocomplete="off"
              data-geneo-paint-hex
              aria-label="${escapeHtml(`${target.label} hex color`)}"
              ${disabled ? 'disabled' : ''}>

            ${
                target.supportsOpacity
                    ? `
                  <label class="geneo-paint-opacity-number">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value="${paint.opacity}"
                      data-geneo-paint-opacity-number
                      aria-label="${escapeHtml(
                            `${target.label} opacity`
                        )}"
                      ${disabled ? 'disabled' : ''}>

                    <span aria-hidden="true">%</span>
                  </label>
                `
                    : ''
            }
          </div>
        </div>
      `;
}

function geneoCompositeRgb(foreground, background, alpha)
{
    const amount = geneoNumber(alpha, 1, 0, 1);
    return {
        r: Math.round(foreground.r * amount + background.r * (1 - amount)),
        g: Math.round(foreground.g * amount + background.g * (1 - amount)),
        b: Math.round(foreground.b * amount + background.b * (1 - amount))
    };
}

function geneoRelativeLuminance(rgb)
{
    const channel = value =>
    {
        const normalized = value / 255;
        return normalized <= .03928 ? normalized / 12.92 : ((normalized + .055) / 1.055) ** 2.4;
    };
    return .2126 * channel(rgb.r) + .7152 * channel(rgb.g) + .0722 * channel(rgb.b);
}

function geneoContrastRatio(first, second)
{
    const light = Math.max(geneoRelativeLuminance(first), geneoRelativeLuminance(second));
    const dark = Math.min(geneoRelativeLuminance(first), geneoRelativeLuminance(second));
    return (light + .05) / (dark + .05);
}

function geneoPersonGenderAppearance(
    node,
    diagram =
        selectedGeneographDiagram()
)
{
    if (node?.type !== 'person')
    {
        return null;
    }

    const person =
        (
            diagram.people || []
        ).find(
            item =>
                item.id === node.personId
        );

    const gender = diagram?.canvas?.colorPersonCardsByGender
        ? ['male', 'female'].includes(person?.gender) ? person.gender : 'unknown'
        : 'neutral';
    const appearance = diagram?.cardAppearanceDefaults?.[gender]
        || geneoDefaultCardAppearances()[gender];
    return { gender: gender === 'neutral' ? '' : gender, ...appearance };
}

function geneoCardAppearanceForNode(node, diagram = selectedGeneographDiagram())
{
    return geneoPersonGenderAppearance(node, diagram);
}

function geneoResolveVisibleNodeAppearance(
    node,
    diagram =
        selectedGeneographDiagram()
)
{
    const savedAppearance =
        node?.appearance || {};

    const genderAppearance =
        geneoPersonGenderAppearance(
            node,
            diagram
        );

    if (!genderAppearance)
    {
        return {
            gender: '',
            fill:
            savedAppearance.fill,
            stroke:
            savedAppearance.stroke,
            text:
            savedAppearance.text
        };
    }

    const paintOverrides =
        savedAppearance.paintOverrides
        && typeof savedAppearance
            .paintOverrides === 'object'
            ? savedAppearance
                .paintOverrides
            : {};

    const resolvePaint =
        property =>
            paintOverrides[property]
          === true
                ? savedAppearance[property]
                : genderAppearance[property];

    return {
        gender:
          genderAppearance.gender,

        fill:
          resolvePaint('fill'),

        stroke:
          resolvePaint('stroke'),

        text:
          resolvePaint('text'),
        strokeWidth: savedAppearance.styleOverrides?.strokeWidth
            ? savedAppearance.strokeWidth : genderAppearance.strokeWidth,
        strokePattern: savedAppearance.styleOverrides?.strokePattern
            ? savedAppearance.strokePattern : genderAppearance.strokePattern
    };
}

function geneoTextContrastRatio(
    node
)
{
    if (
        !node
        || node.type === 'image'
    )
    {
        return null;
    }

    const diagram =
        selectedGeneographDiagram();

    const canvasPaint =
        diagram?.canvas
            ?.backgroundPaint;

    const canvasRgb =
        geneoHexToRgb(
            canvasPaint?.color
          || '#0F1413'
        );

    const visibleAppearance =
        geneoResolveVisibleNodeAppearance(
            node,
            diagram
        );

    const fill =
        visibleAppearance.fill;

    const text =
        visibleAppearance.text;

    const background =
        fill?.enabled
            ? geneoCompositeRgb(
                geneoHexToRgb(
                    fill.color
                ),
                canvasRgb,
                fill.opacity / 100
            )
            : canvasRgb;

    const visibleText =
        geneoCompositeRgb(
            geneoHexToRgb(
                text.color
            ),
            background,
            text.opacity / 100
        );

    return geneoContrastRatio(
        visibleText,
        background
    );
}

function renderGeneoContrastWarning(node)
{
    const ratio = geneoTextContrastRatio(node);
    const warning = Number.isFinite(ratio) && ratio < 4.5;
    return `<p class="geneo-contrast-warning" data-geneo-contrast-warning ${warning ? '' : 'hidden'}>${icon.warning}<span><strong>${escapeHtml(t('Low text contrast'))}</strong> <span data-geneo-contrast-ratio>(${Number.isFinite(ratio) ? ratio.toFixed(1) : '0.0'}:1).</span> ${escapeHtml(t('Consider a clearer text or fill color.'))}</span></p>`;
}

function geneoPaintTargetMatches(element, target)
{
    const reference = geneoPaintReferenceFromElement(element);
    return geneoPaintTargetKey(reference) === geneoPaintTargetKey(target);
}

function applyGeneoPaintTargetToDom(reference)
{
    const target = resolveGeneoPaintTarget(reference);
    if (!target) return;
    if (target.scope === 'card-default')
    {
        selectedGeneographDiagram()?.nodes.filter(node => node.type === 'person').forEach(node =>
        {
            const element = main.querySelector(`[data-geneo-node="${CSS.escape(node.id)}"]`);
            if (!element) return;
            const visible = geneoResolveVisibleNodeAppearance(node);
            element.style.setProperty('--geneo-node-bg', geneoPaintCssColor(visible.fill));
            element.style.setProperty('--geneo-node-gap-bg', geneoPersonActionGapColor(visible.fill));
            element.style.setProperty('--geneo-node-stroke', geneoPaintCssColor(visible.stroke));
            element.style.setProperty('--geneo-node-text', geneoPaintCssColor(visible.text));
            element.style.setProperty('--geneo-node-stroke-style', visible.stroke?.enabled ? visible.strokePattern : 'none');
            element.style.setProperty('--geneo-node-stroke-width', `${visible.strokeWidth}px`);
        });
    }
    else if (target.scope === 'node')
    {
        const node =
            target.entity;

        const element =
            main.querySelector(
                `[data-geneo-node="${
                    CSS.escape(node.id)
                }"]`
            );

        if (element)
        {
            const visibleAppearance =
                geneoResolveVisibleNodeAppearance(
                    node
                );

            const visibleFill =
                visibleAppearance.fill;

            const visibleStroke =
                visibleAppearance.stroke;

            const visibleText =
                visibleAppearance.text;

            element.style.setProperty(
                '--geneo-node-bg',
                geneoPaintCssColor(
                    visibleFill
                )
            );

            element.style.setProperty(
                '--geneo-node-gap-bg',
                geneoPersonActionGapColor(visibleFill)
            );

            element.style.setProperty(
                '--geneo-node-stroke',
                geneoPaintCssColor(
                    visibleStroke
                )
            );

            element.style.setProperty(
                '--geneo-node-stroke-style',
                visibleStroke?.enabled
                    ? (visibleAppearance.strokePattern || node.appearance.strokePattern)
                    : 'none'
            );

            element.style.setProperty(
                '--geneo-node-stroke-width',
                `${visibleAppearance.strokeWidth ?? node.appearance.strokeWidth}px`
            );

            element.style.setProperty(
                '--geneo-node-text',
                geneoPaintCssColor(
                    visibleText
                )
            );

            if (node.type === 'sticky')
            {
                element.classList.toggle(
                    'has-paper-fill',
                    Boolean(
                        visibleFill?.enabled
                && geneoNumber(
                    visibleFill.opacity,
                    100,
                    0,
                    100
                ) > 0
                    )
                );
            }
        }
    }
    else if (target.scope === 'connection-default')
    {
        main.querySelectorAll('[data-geneo-connection-group]').forEach(group =>
        {
            const connection = getGeneographConnection(group.dataset.geneoConnectionGroup);
            if (!connection || connection.style?.line) return;
            const color = geneoPaintCssColor(target.paint);
            group.querySelector('.geneo-connection-line')?.setAttribute('stroke', color);
            group.querySelector('marker path')?.setAttribute('fill', color);
        });
        refreshGeneoConnectionToolUi();
    }
    else if (target.scope === 'connection')
    {
        const group = main.querySelector(`[data-geneo-connection-group="${CSS.escape(target.id)}"]`);
        group?.classList.toggle('no-stroke', !target.paint.enabled);
        group?.querySelector('.geneo-connection-line')?.setAttribute('stroke', geneoPaintCssColor(target.paint));
        group?.querySelector('marker path')?.setAttribute('fill', geneoPaintCssColor(target.paint));
        const status = sidebar.querySelector(`[data-geneo-layer-connection="${CSS.escape(target.id)}"] [data-geneo-connection-paint-status]`);
        if (status) status.hidden = target.paint.enabled;
    }
    else
    {
        main.querySelector('[data-geneo-canvas-viewport]')?.style.setProperty('--geneo-canvas-background', geneoPaintCssColor(target.paint));
    }
}

function updateGeneoContrastWarning()
{
    const node = selectedGeneographNode();
    const warning = main.querySelector('[data-geneo-contrast-warning]');
    if (!warning || !node) return;
    const ratio = geneoTextContrastRatio(node);
    const visible = Number.isFinite(ratio) && ratio < 4.5;
    warning.hidden = !visible;
    const ratioCopy = warning.querySelector('[data-geneo-contrast-ratio]');
    if (ratioCopy) ratioCopy.textContent = `(${Number.isFinite(ratio) ? ratio.toFixed(1) : '0.0'}:1).`;
}

function syncGeneoPaintUi(reference, sourceInput = null)
{
    const target = resolveGeneoPaintTarget(reference);
    if (!target) return;
    if (geneoBulkPaintScope(target.scope))
    {
        main.querySelectorAll('[data-geneo-paint-scope]').forEach(row =>
        {
            if (!geneoPaintTargetMatches(row, target)) return;
            row.classList.toggle('is-none', target.paint.enabled === false && !target.mixed.enabled);
            const swatch = row.querySelector('[data-geneo-paint-open]');
            if (swatch)
            {
                swatch.classList.toggle('is-mixed', target.mixed.color);
                swatch.style.cssText = geneoPaintSwatchStyle(target.paint);
                swatch.title = target.mixed.color ? t('Mixed') : target.paint.color;
                swatch.disabled = target.paint.enabled === false && !target.mixed.enabled;
            }
            const hex = row.querySelector('.geneo-paint-hex');
            if (hex)
            {
                if (hex !== sourceInput) hex.value = target.mixed.color ? '' : target.paint.color;
                hex.disabled = target.paint.enabled === false && !target.mixed.enabled;
            }
            const opacity = row.querySelector('.geneo-paint-opacity-number input');
            if (opacity)
            {
                if (opacity !== sourceInput) opacity.value = target.mixed.opacity ? '' : target.paint.opacity;
                opacity.disabled = target.paint.enabled === false && !target.mixed.enabled;
            }
            const state = row.querySelector('.geneo-paint-state');
            if (state) state.textContent = target.mixed.enabled ? t('Mixed')
                : target.paint.enabled ? '' : t('None');
            const action = row.querySelector('.geneo-paint-action');
            if (action) action.textContent = t(target.paint.enabled === false && !target.mixed.enabled ? 'Restore' : 'Remove');
        });
        target.items.forEach(item => applyGeneoPaintTargetToDom({
            scope: target.scope === 'connection-multi' ? 'connection' : 'node', id: item.id,
            property: target.property
        }));
        syncGeneoPaintPopover(target, sourceInput);
        return;
    }
    if (target.scope === 'creation-tool')
    {
        refreshGeneoCreationToolUi(target.id);
        syncGeneoPaintPopover(target, sourceInput);
        return;
    }
    if (target.scope === 'connection-tool')
    {
        refreshGeneoConnectionToolUi();
        syncGeneoPaintPopover(target, sourceInput);
        return;
    }
    document.querySelectorAll('[data-geneo-paint-scope]').forEach(row =>
    {
        if (!geneoPaintTargetMatches(row, target)) return;
        row.classList.toggle('is-none', !target.paint.enabled);
        const stateLabel = row.querySelector('[data-geneo-paint-state]');
        if (stateLabel) stateLabel.hidden = target.paint.enabled;
        const swatch = row.querySelector('[data-geneo-paint-open]');

        if (swatch)
        {
            swatch.setAttribute(
                'style',
                geneoPaintSwatchStyle(target.paint)
            );

            swatch.setAttribute(
                'aria-label',
                translateAttributeValue(
                    `Edit ${target.label} color, ${
                        target.paint.enabled
                            ? `${target.paint.color}, ${target.paint.opacity}% opacity`
                            : 'None'
                    }`
                )
            );

            swatch.disabled = !target.paint.enabled;

            if (!target.paint.enabled)
            {
                swatch.setAttribute('aria-expanded', 'false');
            }
        }

        const hex = row.querySelector('[data-geneo-paint-hex]');

        if (hex && hex !== sourceInput)
        {
            hex.value = target.paint.color;
        }

        if (hex)
        {
            hex.disabled = !target.paint.enabled;
        }

        const opacity = row.querySelector(
            '[data-geneo-paint-opacity-number]'
        );

        if (opacity && opacity !== sourceInput)
        {
            opacity.value = target.paint.opacity;
        }

        if (opacity)
        {
            opacity.disabled = !target.paint.enabled;
        }

        const toggle = row.querySelector('[data-geneo-paint-toggle]');

        if (toggle)
        {
            const isPopover = row.classList.contains(
                'geneo-paint-popover'
            );

            const visibleLabel = target.paint.enabled
                ? isPopover
                    ? `Remove ${target.label}`
                    : 'Remove'
                : isPopover
                    ? `Restore ${target.label}`
                    : 'Restore';

            toggle.textContent = t(visibleLabel);

            toggle.setAttribute(
                'aria-label',
                translateAttributeValue(
                    target.paint.enabled
                        ? `Remove ${target.label.toLowerCase()} color`
                        : `Restore ${target.label.toLowerCase()} color`
                )
            );
        }
    });
    if (target.scope === 'node' && target.property === 'stroke')
    {
        const pattern = main.querySelector('[data-geneo-stroke-pattern="node"]');
        if (pattern) pattern.disabled = !target.paint.enabled;
    }
    if (target.scope === 'connection')
    {
        const pattern = main.querySelector('[data-geneo-connection-inspector-pattern]');
        if (pattern) pattern.disabled = !target.paint.enabled;
    }
    applyGeneoPaintTargetToDom(target);
    updateGeneoContrastWarning();
    syncGeneoPaintPopover(target, sourceInput);
}

function geneoPaintOverrideState(
    target
)
{
    if (target?.scope === 'creation-tool') return geneoCreationToolSettings(target.id).appearance.paintOverrides?.[target.property] === true;
    if (target?.scope === 'canvas') return selectedGeneographDiagram()?.canvas?.backgroundOverride === true;
    if (target?.scope === 'card-default') return selectedGeneographDiagram()?.cardAppearanceDefaults?.[target.id]?.paintOverrides?.[target.property] === true;
    if (target?.scope === 'connection-default') return selectedGeneographDiagram()?.connectionDefaults?.lineOverride === true;
    if (target?.scope === 'connection-tool') return Boolean(geneoConnectionToolRuntime.overrides.line);
    if (target?.scope === 'connection') return Boolean(target.entity?.style?.line);
    if (
        target?.scope !== 'node'
        || ![
            'fill',
            'stroke',
            'text'
        ].includes(
            target.property
        )
    )
    {
        return false;
    }

    return target.entity
        .appearance
        ?.paintOverrides
        ?.[target.property]
        === true;
}

function setGeneoPaintOverrideState(
    target,
    overridden
)
{
    if (target?.scope === 'creation-tool')
    {
        const appearance = geneoCreationToolSettings(target.id).appearance;
        appearance.paintOverrides ||= { fill: false, stroke: false, text: false };
        appearance.paintOverrides[target.property] = Boolean(overridden);
        return true;
    }
    if (target?.scope === 'canvas')
    {
        selectedGeneographDiagram().canvas.backgroundOverride = Boolean(overridden);
        return true;
    }
    if (target?.scope === 'card-default')
    {
        const appearance = selectedGeneographDiagram().cardAppearanceDefaults[target.id];
        appearance.paintOverrides ||= { fill: false, stroke: false, text: false };
        appearance.paintOverrides[target.property] = Boolean(overridden);
        return true;
    }
    if (target?.scope === 'connection-default')
    {
        selectedGeneographDiagram().connectionDefaults.lineOverride = Boolean(overridden);
        return true;
    }
    if (target?.scope === 'connection-tool')
    {
        const defaults = selectedGeneographDiagram().connectionDefaults.line;
        if (overridden && JSON.stringify(target.paint) !== JSON.stringify(defaults))
            geneoConnectionToolRuntime.overrides.line = { ...target.paint };
        else delete geneoConnectionToolRuntime.overrides.line;
        return true;
    }
    if (target?.scope === 'connection')
    {
        target.entity.style ||= {};
        if (overridden) target.entity.style.line = { ...target.paint };
        else delete target.entity.style.line;
        return true;
    }
    if (
        target?.scope !== 'node'
        || ![
            'fill',
            'stroke',
            'text'
        ].includes(
            target.property
        )
    )
    {
        return false;
    }

    const appearance =
        target.entity.appearance;

    // A person may display the board's gender preset while keeping a
    // different saved paint. Copy the edited effective value onto the node;
    // never mutate the board preset (or discard another card's inheritance).
    if (target.entity.type === 'person')
    {
        appearance[target.property] = Boolean(overridden)
            ? structuredClone(target.paint)
            : structuredClone(geneoPersonGenderAppearance(target.entity)?.[target.property]);
    }

    const previous =
        appearance.paintOverrides
            ?.[target.property]
        === true;

    const next =
        Boolean(overridden);

    appearance.paintOverrides = {
        fill:
          appearance.paintOverrides
              ?.fill === true,

        stroke:
          appearance.paintOverrides
              ?.stroke === true,

        text:
          appearance.paintOverrides
              ?.text === true,

        [target.property]:
          next
    };

    return previous !== next;
}

function beginGeneoPaintInteraction(
    reference
)
{
    const target =
        resolveGeneoPaintTarget(
            reference
        );

    if (!target)
    {
        return null;
    }

    if (
        geneoPaintRuntime.interaction
    )
    {
        commitGeneoPaintInteraction();
    }

    geneoPaintRuntime.interaction = {
        key:
          geneoPaintTargetKey(
              target
          ),

        reference: {
            scope: target.scope,
            id: target.id,
            property: target.property
        },

        beforeDiagram:
          geneoSnapshot(),

        beforePaint:
          structuredClone(
              target.paint
          ),

        // Required to cancel a preview without changing an inherited
        // node's dormant, saved paint or its override provenance.
        beforeStoredPaint: target.scope === 'node' && target.entity.type === 'person'
            ? structuredClone(target.entity.appearance[target.property]) : null,

        beforeOverride:
          geneoPaintOverrideState(
              target
          ),

        lastValidPaint:
          structuredClone(
              target.paint
          )
    };

    if (geneoBulkPaintScope(target.scope))
    {
        geneoPaintRuntime.interaction.beforeItems = target.items.map(item => ({
            id: item.id,
            appearance: target.scope === 'connection-multi' ? null : structuredClone(item.appearance),
            style: target.scope === 'connection-multi' ? structuredClone(item.style) : null
        }));
    }

    return target;
}

function previewGeneoPaint(
    reference,
    changes,
    sourceInput = null
)
{
    const target =
        resolveGeneoPaintTarget(
            reference
        );

    if (
        !target
        || (
            !target.paint.enabled
          && !(
              'enabled' in changes
          )
        )
    )
    {
        return false;
    }

    if (geneoBulkPaintScope(target.scope))
    {
        const normalized = { ...changes };
        if ('color' in normalized) normalized.color = normalizeGeneoHexColor(normalized.color);
        if ('opacity' in normalized) normalized.opacity = Math.round(geneoNumber(normalized.opacity, 100, 0, 100));
        geneoApplyBulkPaintChanges(target, normalized);
        syncGeneoPaintUi(target, sourceInput);
        return true;
    }

    const beforePaint = JSON.stringify(target.paint);
    Object.assign(
        target.paint,
        changes
    );

    target.paint.color =
        normalizeGeneoHexColor(
            target.paint.color,
            target.defaultPaint.color
        );

    target.paint.opacity =
        Math.round(
            geneoNumber(
                target.paint.opacity,
                100,
                0,
                100
            )
        );

    if (!target.supportsNone)
    {
        target.paint.enabled = true;
    }

    if (target.scope === 'node' && target.entity.type === 'person'
        && beforePaint === JSON.stringify(target.paint)) return false;

    /* A direct paint edit creates an individual override. */
    setGeneoPaintOverrideState(
        target,
        true
    );

    const interaction =
        geneoPaintRuntime.interaction;

    if (
        interaction?.key
        === geneoPaintTargetKey(
            target
        )
    )
    {
        interaction.lastValidPaint =
            structuredClone(
                target.paint
            );
    }

    syncGeneoPaintUi(
        target,
        sourceInput
    );

    return true;
}

function commitGeneoPaintInteraction()
{
    const interaction =
        geneoPaintRuntime.interaction;

    if (!interaction)
    {
        return false;
    }

    geneoPaintRuntime.interaction =
        null;

    const target =
        resolveGeneoPaintTarget(
            interaction.reference
        );

    if (!target)
    {
        return false;
    }

    if (geneoBulkPaintScope(target.scope))
    {
        if (geneoSnapshot() === interaction.beforeDiagram) return false;
        geneoPushHistorySnapshot(interaction.beforeDiagram);
        touchGeneographBoard();
        return true;
    }

    const paintChanged =
        JSON.stringify(
            interaction.beforePaint
        )
        !== JSON.stringify(
            target.paint
        );

    const overrideChanged =
        interaction.beforeOverride
        !== geneoPaintOverrideState(
            target
        );

    if (
        !paintChanged
        && !overrideChanged
    )
    {
        return false;
    }

    if (!['connection-tool', 'creation-tool'].includes(target.scope))
    {
        geneoPushHistorySnapshot(interaction.beforeDiagram);
        touchGeneographBoard();
    }

    return true;
}

function cancelGeneoPaintInteraction()
{
    const interaction =
        geneoPaintRuntime.interaction;

    if (!interaction)
    {
        return false;
    }

    geneoPaintRuntime.interaction =
        null;

    const target =
        resolveGeneoPaintTarget(
            interaction.reference
        );

    if (!target)
    {
        return false;
    }

    if (geneoBulkPaintScope(target.scope))
    {
        geneoRestoreBulkPaintItems(interaction);
        syncGeneoPaintUi(target);
        return true;
    }

    if (target.scope === 'node' && target.entity.type === 'person')
    {
        // Restore the actual serialized node state, not the inherited
        // display value that was captured when the interaction began.
        target.entity.appearance.paintOverrides ||= {};
        target.entity.appearance.paintOverrides[target.property] = interaction.beforeOverride;
        target.entity.appearance[target.property] = structuredClone(interaction.beforeStoredPaint);
    }
    else
    {
        Object.assign(target.paint, structuredClone(interaction.beforePaint));
        setGeneoPaintOverrideState(target, interaction.beforeOverride);
    }

    syncGeneoPaintUi(
        target
    );

    return true;
}

function restoreLastValidGeneoPaintInteraction(sourceInput = null)
{
    const interaction = geneoPaintRuntime.interaction;
    if (!interaction) return false;
    const target = resolveGeneoPaintTarget(interaction.reference);
    if (!target) return false;
    if (geneoBulkPaintScope(target.scope))
    {
        syncGeneoPaintUi(target, sourceInput);
        return true;
    }
    Object.assign(target.paint, structuredClone(interaction.lastValidPaint));
    if (target.scope === 'connection') setGeneoPaintOverrideState(target, interaction.beforeOverride);
    syncGeneoPaintUi(target, sourceInput);
    return true;
}

function commitGeneoPaintAction(
    reference,
    update,
    {
        resetOverride = false,
        field = null
    } = {}
)
{
    const target =
        resolveGeneoPaintTarget(
            reference
        );

    if (!target)
    {
        return false;
    }

    if (geneoBulkPaintScope(target.scope))
    {
        const beforeDiagram = geneoSnapshot();
        const beforePaint = { ...target.paint };
        update(target);
        const changes = {};
        for (const key of ['color', 'opacity', 'enabled'])
        {
            if (target.paint[key] !== beforePaint[key] || (key === field && target.mixed[key]))
                changes[key] = target.paint[key];
        }
        if (!Object.keys(changes).length) return false;
        geneoApplyBulkPaintChanges(target, changes);
        if (geneoSnapshot() === beforeDiagram) return false;
        geneoPushHistorySnapshot(beforeDiagram);
        touchGeneographBoard();
        syncGeneoPaintUi(target);
        return true;
    }

    const beforeDiagram =
        geneoSnapshot();

    const beforePaint =
        JSON.stringify(
            target.paint
        );

    const beforeOverride =
        geneoPaintOverrideState(
            target
        );

    update(target);

    target.paint.color =
        normalizeGeneoHexColor(
            target.paint.color,
            target.defaultPaint.color
        );

    target.paint.opacity =
        Math.round(
            geneoNumber(
                target.paint.opacity,
                100,
                0,
                100
            )
        );

    if (!target.supportsNone)
    {
        target.paint.enabled = true;
    }

    // Reapplying an inherited value is not a customization. A reset may
    // still need to clear an existing override even when colors match.
    if (target.scope === 'node' && target.entity.type === 'person'
        && beforePaint === JSON.stringify(target.paint)
        && (!resetOverride || !beforeOverride)) return false;

    setGeneoPaintOverrideState(
        target,
        !resetOverride
    );

    const paintChanged =
        beforePaint
        !== JSON.stringify(
            target.paint
        );

    const overrideChanged =
        beforeOverride
        !== geneoPaintOverrideState(
            target
        );

    if (
        !paintChanged
        && !overrideChanged
    )
    {
        return false;
    }

    if (!['connection-tool', 'creation-tool'].includes(target.scope))
    {
        geneoPushHistorySnapshot(beforeDiagram);
        touchGeneographBoard();
    }

    syncGeneoPaintUi(
        target
    );

    return true;
}

function renderGeneoPaintPopover(reference)
{
    const target = resolveGeneoPaintTarget(reference);
    if (!target) return '';
    const paint = target.paint;
    const hsv = geneoRgbToHsv(geneoHexToRgb(paint.color));
    geneoPaintRuntime.hsv = hsv;
    const disabled = !paint.enabled;
    return `<div class="geneo-paint-popover" id="geneoPaintPopover" role="dialog" aria-modal="false" aria-labelledby="geneoPaintPopoverTitle" ${geneoPaintDataAttributes(target)}>
        <div class="geneo-paint-popover-header"><strong id="geneoPaintPopoverTitle">${escapeHtml(target.label)}</strong><button type="button" data-geneo-paint-close aria-label="Close ${escapeHtml(target.label)} color picker">${icon.close}</button></div>
        <div class="geneo-paint-popover-body">
          <div class="geneo-paint-sv" tabindex="0" role="slider" aria-label="${escapeHtml(target.label)} saturation and brightness" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(hsv.v)}" aria-valuetext="Saturation ${Math.round(hsv.s)}%, brightness ${Math.round(hsv.v)}%" data-geneo-paint-sv style="--geneo-hue:${Math.round(hsv.h)}"><span style="left:${hsv.s}%;top:${100 - hsv.v}%" ${target.mixed?.color ? 'hidden' : ''} aria-hidden="true"></span></div>
          <label class="geneo-paint-slider-row"><span>Hue</span><input type="range" min="0" max="359" step="1" value="${Math.round(hsv.h)}" data-geneo-paint-hue ${disabled ? 'disabled' : ''}></label>
          ${target.supportsOpacity ? `<label class="geneo-paint-slider-row"><span>Opacity</span><input class="geneo-paint-alpha" type="range" min="0" max="100" step="1" value="${paint.opacity}" data-geneo-paint-opacity style="--geneo-paint-color:${paint.color};--geneo-paint-opacity:${paint.opacity}%" ${disabled ? 'disabled' : ''}></label>` : ''}
          <div class="geneo-paint-popover-fields"><label><span>Hex</span><input type="text" maxlength="7" value="${target.mixed?.color ? '' : paint.color}" placeholder="${target.mixed?.color ? escapeHtml(t('Mixed')) : ''}" spellcheck="false" autocomplete="off" data-geneo-paint-hex ${disabled ? 'disabled' : ''}></label>${target.supportsOpacity ? `<label><span>Opacity</span><span class="geneo-paint-percent-input"><input type="number" min="0" max="100" step="1" value="${target.mixed?.opacity ? '' : paint.opacity}" placeholder="${target.mixed?.opacity ? escapeHtml(t('Mixed')) : ''}" data-geneo-paint-opacity-number ${disabled ? 'disabled' : ''}><span aria-hidden="true">%</span></span></label>` : ''}</div>
          <div
            class="geneo-paint-suggestions"
            role="group"
            aria-label="Suggested board colors">
            ${
                GENEO_BOARD_COLORS.map(item =>
                {
                    const selected = !target.mixed?.color &&
                        normalizeGeneoHexColor(item.color)
                  === normalizeGeneoHexColor(paint.color);

                    return `
                  <button
                    type="button"
                    data-geneo-paint-suggestion="${item.color}"
                    style="--geneo-suggestion:${item.color}"
                    aria-label="${escapeHtml(
                        `${item.name}, ${item.color}`
                    )}"
                    aria-pressed="${selected}"
                    title="${escapeHtml(
                        `${item.name} · ${item.color}`
                    )}"
                    ${disabled ? 'disabled' : ''}>
                  </button>
                `;
                }).join('')
            }
          </div>

          <div class="geneo-paint-popover-footer">
            ${
                target.supportsNone
                    ? `
                  <button
                    class="geneo-paint-none"
                    type="button"
                    data-geneo-paint-toggle>
                    ${escapeHtml(t(
                        `${disabled ? 'Restore' : 'Remove'} ${target.label}`
                    ))}
                  </button>
                `
                    : target.resettable
                        ? `
                    <button
                      class="geneo-paint-none"
                      type="button"
                      data-geneo-paint-reset>
                      Reset to default
                    </button>
                  `
                        : ''
            }
          </div>
      </div>`;
}

function positionGeneoPaintPopover()
{
    const { popover, opener } = geneoPaintRuntime;
    const inspector = main.querySelector('.geneo-inspector:not(.collapsed)');
    if (!popover || !opener?.isConnected) return;
    if (['connection-tool', 'creation-tool'].includes(geneoPaintRuntime.target?.scope))
    {
        const rect = opener.getBoundingClientRect();
        const width = Math.min(360, window.innerWidth - 24);
        const height = Math.min(popover.scrollHeight, window.innerHeight - 24);
        popover.style.width = `${width}px`;
        popover.style.maxHeight = `${window.innerHeight - 24}px`;
        popover.style.left = `${Math.max(12, Math.min(rect.left, window.innerWidth - width - 12))}px`;
        popover.style.top = `${rect.bottom + height + 6 <= window.innerHeight - 12 ? rect.bottom + 6 : Math.max(12, rect.top - height - 6)}px`;
        return;
    }
    if (!inspector) return;
    const inspectorRect = inspector.getBoundingClientRect();
    const openerRect = opener.getBoundingClientRect();
    const margin = 8;
    const width = Math.max(280, Math.min(360, inspectorRect.width - margin * 2));
    popover.style.width = `${width}px`;
    popover.style.maxHeight = `${Math.max(280, inspectorRect.height - margin * 2)}px`;
    const measuredHeight = Math.min(popover.scrollHeight, inspectorRect.height - margin * 2);
    const below = openerRect.bottom + 6;
    const above = openerRect.top - measuredHeight - 6;
    const top = below + measuredHeight <= inspectorRect.bottom - margin
        ? below
        : Math.max(inspectorRect.top + margin, above);
    popover.style.left = `${Math.max(inspectorRect.left + margin, Math.min(openerRect.right - width, inspectorRect.right - width - margin))}px`;
    popover.style.top = `${top}px`;
}

function syncGeneoPaintPopover(reference, sourceInput = null)
{
    const popover = geneoPaintRuntime.popover;
    const target = resolveGeneoPaintTarget(reference);
    if (!popover || !target || geneoPaintTargetKey(target) !== geneoPaintTargetKey(geneoPaintRuntime.target)) return;
    const hsv = geneoRgbToHsv(geneoHexToRgb(target.paint.color));
    geneoPaintRuntime.hsv = hsv;
    popover.classList.toggle('is-none', !target.paint.enabled);
    const sv = popover.querySelector('[data-geneo-paint-sv]');
    if (sv)
    {
        sv.style.setProperty('--geneo-hue', Math.round(hsv.h));
        sv.setAttribute('aria-valuenow', Math.round(hsv.v));
        sv.setAttribute('aria-valuetext', `Saturation ${Math.round(hsv.s)}%, brightness ${Math.round(hsv.v)}%`);
        const marker = sv.querySelector('span');
        if (marker)
        {
            marker.hidden = Boolean(target.mixed?.color);
            marker.style.left = `${hsv.s}%`; marker.style.top = `${100 - hsv.v}%`;
        }
    }
    const hue = popover.querySelector('[data-geneo-paint-hue]');
    if (hue && hue !== sourceInput) hue.value = Math.round(hsv.h);
    const alpha = popover.querySelector('[data-geneo-paint-opacity]');
    if (alpha && alpha !== sourceInput) alpha.value = target.paint.opacity;
    if (alpha)
    {
        alpha.style.setProperty(
            '--geneo-paint-color',
            target.paint.color
        );

        alpha.style.setProperty(
            '--geneo-paint-opacity',
            `${target.paint.opacity}%`
        );
    }
    const hex = popover.querySelector('[data-geneo-paint-hex]');
    if (hex && hex !== sourceInput) hex.value = target.mixed?.color ? '' : target.paint.color;
    const number = popover.querySelector('[data-geneo-paint-opacity-number]');
    if (number && number !== sourceInput) number.value = target.mixed?.opacity ? '' : target.paint.opacity;
    popover.querySelectorAll('input, [data-geneo-paint-suggestion]').forEach(control =>
    {
        if (!control.matches('[data-geneo-paint-close]')) control.disabled = !target.paint.enabled;
    });
    const selectedColor = normalizeGeneoHexColor(
        target.paint.color
    );

    popover
        .querySelectorAll('[data-geneo-paint-suggestion]')
        .forEach(button =>
        {
            const selected = !target.mixed?.color &&
                normalizeGeneoHexColor(
                    button.dataset.geneoPaintSuggestion
                ) === selectedColor;

            button.setAttribute(
                'aria-pressed',
                String(selected)
            );
        });

    const toggle = popover.querySelector(
        '[data-geneo-paint-toggle]'
    );

    if (toggle)
    {
        toggle.textContent = t(
            `${target.paint.enabled ? 'Remove' : 'Restore'} ${
                target.label
            }`
        );

        toggle.setAttribute(
            'aria-label',
            translateAttributeValue(
                target.paint.enabled
                    ? `Remove ${target.label.toLowerCase()} color`
                    : `Restore ${target.label.toLowerCase()} color`
            )
        );
    }
}

function closeGeneoPaintPopover({ commit = true, restoreFocus = true } = {})
{
    const opener = geneoPaintRuntime.opener;
    const inspector = main.querySelector('.geneo-inspector:not(.collapsed)');
    const scrollTop = inspector?.scrollTop ?? null;
    if (commit) commitGeneoPaintInteraction();
    else cancelGeneoPaintInteraction();
    geneoPaintRuntime.controller?.abort();
    geneoPaintRuntime.popover?.remove();
    opener?.setAttribute('aria-expanded', 'false');
    geneoPaintRuntime = createGeneoPaintRuntime();
    if (scrollTop !== null && inspector) inspector.scrollTop = scrollTop;
    if (restoreFocus && opener?.isConnected) opener.focus({ preventScroll: true });
}

function updateGeneoPaintFromSv(event, reference, element)
{
    const rect = element.getBoundingClientRect();
    const saturation = geneoNumber((event.clientX - rect.left) / rect.width * 100, 0, 0, 100);
    const value = geneoNumber((rect.bottom - event.clientY) / rect.height * 100, 0, 0, 100);
    const hsv = { ...(geneoPaintRuntime.hsv || { h: 0 }), s: saturation, v: value };
    geneoPaintRuntime.hsv = hsv;
    previewGeneoPaint(reference, { color: geneoHsvToHex(hsv) });
}

function bindGeneoPaintPopover(reference)
{
    const popover = geneoPaintRuntime.popover;
    if (!popover) return;
    const sv = popover.querySelector('[data-geneo-paint-sv]');
    sv?.addEventListener('pointerdown', event =>
    {
        if (!resolveGeneoPaintTarget(reference)?.paint.enabled) return;
        event.preventDefault();
        beginGeneoPaintInteraction(reference);
        sv.setPointerCapture(event.pointerId);
        updateGeneoPaintFromSv(event, reference, sv);
    });
    sv?.addEventListener('pointermove', event =>
    {
        if (!sv.hasPointerCapture(event.pointerId)) return;
        updateGeneoPaintFromSv(event, reference, sv);
    });
    sv?.addEventListener('pointerup', event =>
    {
        if (sv.hasPointerCapture(event.pointerId)) sv.releasePointerCapture(event.pointerId);
        commitGeneoPaintInteraction();
    });
    sv?.addEventListener('keydown', event =>
    {
        if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
        if (!resolveGeneoPaintTarget(reference)?.paint.enabled) return;
        event.preventDefault();
        if (!geneoPaintRuntime.interaction) beginGeneoPaintInteraction(reference);
        const amount = event.shiftKey ? 10 : 1;
        const hsv = { ...geneoPaintRuntime.hsv };
        if (event.key === 'ArrowLeft') hsv.s = Math.max(0, hsv.s - amount);
        if (event.key === 'ArrowRight') hsv.s = Math.min(100, hsv.s + amount);
        if (event.key === 'ArrowDown') hsv.v = Math.max(0, hsv.v - amount);
        if (event.key === 'ArrowUp') hsv.v = Math.min(100, hsv.v + amount);
        geneoPaintRuntime.hsv = hsv;
        previewGeneoPaint(reference, { color: geneoHsvToHex(hsv) });
    });
    sv?.addEventListener('keyup', event =>
    {
        if (event.key.startsWith('Arrow')) commitGeneoPaintInteraction();
    });
    bindGeneoPaintRange(popover.querySelector('[data-geneo-paint-hue]'), reference, input =>
    {
        const hsv = { ...geneoPaintRuntime.hsv, h: Number(input.value) };
        geneoPaintRuntime.hsv = hsv;
        previewGeneoPaint(reference, { color: geneoHsvToHex(hsv) }, input);
    });
    bindGeneoPaintRange(popover.querySelector('[data-geneo-paint-opacity]'), reference, input =>
    {
        previewGeneoPaint(reference, { opacity: Number(input.value) }, input);
    });
    bindGeneoPaintTextInput(popover.querySelector('[data-geneo-paint-hex]'), reference, 'hex');
    bindGeneoPaintTextInput(popover.querySelector('[data-geneo-paint-opacity-number]'), reference, 'opacity');
    popover.querySelectorAll('[data-geneo-paint-suggestion]').forEach(button => button.addEventListener('click', () =>
    {
        commitGeneoPaintAction(reference, target =>
        {
            target.paint.color = button.dataset.geneoPaintSuggestion;
        }, { field: 'color' });
    }));
    popover
        .querySelector('[data-geneo-paint-toggle]')
        ?.addEventListener('click', () =>
        {
            const currentTarget = resolveGeneoPaintTarget(reference);
            if (!currentTarget) return;

            const removingPaint = currentTarget.paint.enabled;

            const changed = commitGeneoPaintAction(
                reference,
                target =>
                {
                    target.paint.enabled = !target.paint.enabled;
                }
            );

            if (!changed || !removingPaint) return;

            closeGeneoPaintPopover({
                restoreFocus: false
            });

            requestAnimationFrame(() =>
            {
                const inspectorRow = [
                    ...main.querySelectorAll('.geneo-paint-row')
                ].find(row =>
                    geneoPaintTargetMatches(row, reference)
                );

                inspectorRow
                    ?.querySelector('[data-geneo-paint-toggle], [data-geneo-person-multi-paint-toggle], [data-geneo-bulk-paint-toggle], [data-geneo-connection-multi-paint-toggle]')
                    ?.focus({ preventScroll: true });
            });
        });
    popover
        .querySelector(
            '[data-geneo-paint-reset]'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                commitGeneoPaintAction(
                    reference,

                    target =>
                    {
                        Object.assign(
                            target.paint,
                            structuredClone(
                                target.defaultPaint
                            ),
                            {
                                enabled: true
                            }
                        );
                    },

                    {
                        resetOverride: true
                    }
                );
            }
        );
    popover.querySelector('[data-geneo-paint-close]')?.addEventListener('click', () => closeGeneoPaintPopover());
}

function bindGeneoPaintRange(input, reference, update)
{
    if (!input) return;
    input.addEventListener('input', () =>
    {
        if (!geneoPaintRuntime.interaction) beginGeneoPaintInteraction(reference);
        update(input);
    });
    input.addEventListener('change', commitGeneoPaintInteraction);
    input.addEventListener('pointerup', commitGeneoPaintInteraction);
    input.addEventListener('blur', commitGeneoPaintInteraction);
}

function bindGeneoPaintTextInput(input, reference, type)
{
    if (!input) return;
    input.addEventListener('focus', () => beginGeneoPaintInteraction(reference));
    input.addEventListener('input', () =>
    {
        if (!geneoPaintRuntime.interaction) beginGeneoPaintInteraction(reference);
        if (type === 'hex')
        {
            const valid = /^#?[0-9a-f]{3}$/i.test(input.value.trim()) || /^#?[0-9a-f]{6}$/i.test(input.value.trim());
            input.classList.toggle('invalid', !valid);
            input.setAttribute('aria-invalid', String(!valid));
            if (valid) previewGeneoPaint(reference, { color: normalizeGeneoHexColor(input.value) }, input);
        }
        else if (input.value.trim() !== '' && Number.isFinite(Number(input.value)))
        {
            previewGeneoPaint(reference, { opacity: Math.round(geneoNumber(input.value, 100, 0, 100)) }, input);
        }
    });
    input.addEventListener('keydown', event =>
    {
        if (event.key === 'Escape')
        {
            event.preventDefault();
            cancelGeneoPaintInteraction();
            input.classList.remove('invalid');
            input.setAttribute('aria-invalid', 'false');
            const target = resolveGeneoPaintTarget(reference);
            if (target) input.value = target.mixed?.[type === 'hex' ? 'color' : 'opacity'] ? ''
                : type === 'hex' ? target.paint.color : target.paint.opacity;
            input.select();
        }
        else if (event.key === 'Enter')
        {
            event.preventDefault();
            input.blur();
        }
    });
    input.addEventListener('blur', () =>
    {
        if (type === 'hex' && input.classList.contains('invalid')) restoreLastValidGeneoPaintInteraction(input);
        if (type === 'opacity' && input.value.trim() === '') restoreLastValidGeneoPaintInteraction(input);
        const target = resolveGeneoPaintTarget(reference);
        if (target) input.value = target.mixed?.[type === 'hex' ? 'color' : 'opacity'] ? ''
            : type === 'hex' ? target.paint.color : target.paint.opacity;
        input.classList.remove('invalid');
        input.setAttribute('aria-invalid', 'false');
        commitGeneoPaintInteraction();
    });
}

function openGeneoPaintPopover(reference, opener)
{
    if (geneoPaintRuntime.popover) closeGeneoPaintPopover({ restoreFocus: false });
    const target = resolveGeneoPaintTarget(reference);
    const inspector = main.querySelector('.geneo-inspector:not(.collapsed)');
    if (!target || (!['connection-tool', 'creation-tool'].includes(target.scope) && !inspector) || !opener) return;
    const scrollTop = inspector?.scrollTop;
    const wrapper = document.createElement('div');
    wrapper.innerHTML = renderGeneoPaintPopover(target).trim();
    const popover = wrapper.firstElementChild;
    document.body.appendChild(popover);
    localizeUI(
        popover,
        {
            suppressObserverReplay: true
        }
    );
    const controller = new AbortController();
    geneoPaintRuntime.target = { scope: target.scope, id: target.id, property: target.property };
    geneoPaintRuntime.opener = opener;
    geneoPaintRuntime.popover = popover;
    geneoPaintRuntime.controller = controller;
    opener.setAttribute('aria-expanded', 'true');
    bindGeneoPaintPopover(geneoPaintRuntime.target);
    positionGeneoPaintPopover();
    if (inspector && scrollTop !== undefined) inspector.scrollTop = scrollTop;
    popover.querySelector('[data-geneo-paint-sv]')?.focus({ preventScroll: true });
    document.addEventListener('pointerdown', event =>
    {
        if (popover.contains(event.target) || opener.contains(event.target)) return;
        closeGeneoPaintPopover();
    }, { capture: true, signal: controller.signal });
    document.addEventListener('keydown', event =>
    {
        if (event.key !== 'Escape') return;
        event.preventDefault();
        closeGeneoPaintPopover({ commit: false });
    }, { signal: controller.signal });
    inspector?.addEventListener('scroll', positionGeneoPaintPopover, { passive: true, signal: controller.signal });
    window.addEventListener('resize', positionGeneoPaintPopover, { passive: true, signal: controller.signal });
}

function bindGeneoPaintControls()
{
    main.querySelectorAll('[data-geneo-paint-scope]').forEach(row =>
    {
        const reference = geneoPaintReferenceFromElement(row);
        row.querySelector('[data-geneo-paint-open]')?.addEventListener('click', event => openGeneoPaintPopover(reference, event.currentTarget));
        bindGeneoPaintTextInput(row.querySelector('[data-geneo-paint-hex]'), reference, 'hex');
        bindGeneoPaintTextInput(row.querySelector('[data-geneo-paint-opacity-number]'), reference, 'opacity');
        row.querySelector('[data-geneo-paint-toggle]')?.addEventListener('click', () =>
        {
            commitGeneoPaintAction(reference, target =>
            {
                target.paint.enabled = !target.paint.enabled;
            });
        });
        row
            .querySelector(
                '[data-geneo-paint-reset]'
            )
            ?.addEventListener(
                'click',
                () =>
                {
                    commitGeneoPaintAction(
                        reference,

                        target =>
                        {
                            Object.assign(
                                target.paint,
                                structuredClone(
                                    target.defaultPaint
                                ),
                                {
                                    enabled: true
                                }
                            );
                        },

                        {
                            resetOverride: true
                        }
                    );
                }
            );
    });
}

