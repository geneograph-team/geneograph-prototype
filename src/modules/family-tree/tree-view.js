function renderFamilyTreePreserveScroll(trace = null, preparation)
{
    const scroll = main.querySelector('.tree-stage') ? getTreeCanvasScroll() : null;

    // If another action intentionally wants to center on a person,
    // let that behavior win instead of restoring old scroll.
    const hasPendingCenter = Boolean(state.treeCenterTargetId);

    renderFamilyTree(null, trace, preparation);

    if (!hasPendingCenter)
    {
        restoreTreeCanvasScroll(scroll);
    }

    return true;
}

const treeFullscreenRuntime = {
    requested: false,
    exitAfterEnter: false
};

function updateTreeFullscreenButton()
{
    const button = main.querySelector('[data-tree-fullscreen]');
    if (!button) return;
    const active = treeFullscreenRuntime.requested
        && document.fullscreenElement === document.documentElement;
    const label = t(active ? 'Exit full screen' : 'Enter full screen');
    button.setAttribute('aria-label', label);
    button.setAttribute('title', label);
    button.setAttribute('aria-pressed', String(active));
    button.innerHTML = active ? icon.fullscreenExit : icon.expand;
}

async function toggleTreeFullscreen()
{
    if (treeFullscreenRuntime.requested && document.fullscreenElement === document.documentElement)
    {
        await document.exitFullscreen();
        return;
    }
    if (!document.documentElement.requestFullscreen) return;
    treeFullscreenRuntime.requested = true;
    try
    {
        await document.documentElement.requestFullscreen();
    }
    catch
    {
        treeFullscreenRuntime.requested = false;
        treeFullscreenRuntime.exitAfterEnter = false;
        updateTreeFullscreenButton();
    }
}

function exitTreeFullscreen()
{
    if (!treeFullscreenRuntime.requested) return;
    if (document.fullscreenElement === document.documentElement)
    {
        document.exitFullscreen().catch(() => {});
    }
    else
    {
        treeFullscreenRuntime.exitAfterEnter = true;
    }
}

document.addEventListener('fullscreenchange', () =>
{
    if (treeFullscreenRuntime.requested
        && document.fullscreenElement === document.documentElement
        && (treeFullscreenRuntime.exitAfterEnter || state.activeModule !== 'Family Tree'))
    {
        document.exitFullscreen().catch(() => {});
        return;
    }
    const active = treeFullscreenRuntime.requested
        && document.fullscreenElement === document.documentElement
        && state.activeModule === 'Family Tree';
    document.documentElement.classList.toggle('tree-fullscreen', active);
    if (!active)
    {
        treeFullscreenRuntime.requested = false;
        treeFullscreenRuntime.exitAfterEnter = false;
    }
    updateTreeFullscreenButton();
});

let treeRelativeIntent = null;

let treeMobileMenuController = null;

function closeTreeMobileMenu()
{
    treeMobileMenuController?.abort();
    treeMobileMenuController = null;
    document.querySelector('#treeMobileMenu')?.remove();
    main.querySelector('[data-tree-mobile-more]')?.setAttribute('aria-expanded', 'false');
}

function openTreeMobileMenu(anchor)
{
    if (document.querySelector('#treeMobileMenu'))
    {
        closeTreeMobileMenu();
        return;
    }
    const menu = document.createElement('div');
    menu.id = 'treeMobileMenu';
    menu.className = 'menu-popover app-action-menu tree-mobile-menu';
    menu.setAttribute('role', 'menu');
    menu.innerHTML = `<button type="button" role="menuitem" data-tree-mobile-action="settings">${icon.settings}<span>${escapeHtml(t('Tree Settings'))}</span></button>
        <button type="button" role="menuitem" data-tree-mobile-action="export">${icon.export}<span>${escapeHtml(t('Export'))}</span></button>
        <button type="button" role="menuitem" data-tree-mobile-action="print">${icon.print}<span>${escapeHtml(t('Print'))}</span></button>`;
    document.body.appendChild(menu);
    positionAnchoredActionMenu(menu, anchor);
    anchor.setAttribute('aria-expanded', 'true');
    const controller = new AbortController();
    treeMobileMenuController = controller;
    menu.addEventListener('click', event =>
    {
        const action = event.target.closest('[data-tree-mobile-action]')?.dataset.treeMobileAction;
        if (!action) return;
        closeTreeMobileMenu();
        const original = action === 'settings' ? '[data-tree-settings]' : `[data-tree-mobile-original="${action}"]`;
        main.querySelector(original)?.click();
    });
    document.addEventListener('pointerdown', event =>
    {
        if (!menu.contains(event.target) && !anchor.contains(event.target)) closeTreeMobileMenu();
    }, { signal: controller.signal });
    document.addEventListener('keydown', event =>
    {
        if (event.key === 'Escape') closeTreeMobileMenu();
    }, { signal: controller.signal });
    menu.querySelector('button')?.focus();
}

function treePersonPickerResults(query)
{
    if (!query) return treeRecentPeople();
    const normalized = query.toLocaleLowerCase();
    return getPeople(currentFamilyTreeProjectId())
        .filter(person => !person.deleted)
        .filter(person => {
            const names = [connectPersonName(person), person.names?.first, person.names?.middle,
                person.names?.last, person.names?.maiden].filter(Boolean);
            return [...names, ...names.map(name => translateText(name))]
                .join(' ').toLocaleLowerCase().includes(normalized);
        })
        .sort((a, b) => connectPersonName(a).localeCompare(connectPersonName(b), state.language))
        .slice(0, 12);
}

function openTreePersonPicker(anchor)
{
    if (document.getElementById('projectMenu'))
    {
        closeMenu();
        return;
    }
    closeMenu();
    const picker = document.createElement('div');
    picker.id = 'projectMenu';
    picker.className = 'menu-popover tree-person-picker';
    picker.setAttribute('role', 'dialog');
    picker.setAttribute('aria-label', t('Find person'));
    picker.innerHTML = `<div class="app-search-field tree-person-picker-search">${icon.search}<input type="search" placeholder="${escapeHtml(t('Find person'))}" aria-label="${escapeHtml(t('Find person'))}" aria-controls="treePersonPickerResults" aria-expanded="true" aria-autocomplete="list" role="combobox"></div><div class="tree-person-picker-results" id="treePersonPickerResults" role="listbox" aria-label="${escapeHtml(t('Search results'))}"></div>`;
    document.body.appendChild(picker);
    if (window.innerWidth <= 900) mountMobileChoiceSheet(picker, anchor, t('Find person'));
    else
    {
        const rect = anchor.getBoundingClientRect();
        const width = Math.min(360, window.innerWidth - 24);
        picker.style.width = `${width}px`;
        picker.style.left = `${Math.max(12, Math.min(rect.left, window.innerWidth - width - 12))}px`;
        picker.style.top = `${rect.bottom + 6}px`;
    }
    const input = picker.querySelector('input');
    const list = picker.querySelector('#treePersonPickerResults');
    let results = [];
    let activeIndex = -1;
    const renderResults = () =>
    {
        const query = input.value.trim();
        results = treePersonPickerResults(query);
        activeIndex = -1;
        input.removeAttribute('aria-activedescendant');
        const rows = results.map((person, index) => `<button id="treePersonPickerOption${index}" class="tree-recent-person" type="button" role="option" aria-selected="false" data-tree-picker-person="${escapeHtml(person.id)}">${renderPersonAvatar(person, 'small-avatar')}<span><strong>${escapeHtml(connectPersonName(person))}</strong><small>${escapeHtml(connectPersonLifeLine(person))}</small></span>${person.id === state.selectedPersonId ? `<span class="tree-recent-current" aria-label="${escapeHtml(t('Selected'))}">${icon.check}</span>` : ''}</button>`).join('');
        list.innerHTML = `<div class="tree-recent-people-head">${escapeHtml(t(query ? 'Search results' : 'Recently selected people'))}</div>`
            + (rows || `<div class="tree-recent-people-empty" role="status">${escapeHtml(t(query ? 'No matching people.' : 'No recently selected people'))}</div>`);
        localizeUI(list, { suppressObserverReplay: true });
    };
    const choose = personId =>
    {
        closeMenu();
        navigateFamilyTreeToPerson(personId);
    };
    input.addEventListener('input', renderResults);
    input.addEventListener('keydown', event =>
    {
        if (event.key === 'Escape')
        {
            event.preventDefault(); event.stopPropagation(); closeMenu(); anchor.focus({ preventScroll: true });
        }
        else if (['ArrowDown', 'ArrowUp'].includes(event.key) && results.length)
        {
            event.preventDefault();
            activeIndex = (activeIndex + (event.key === 'ArrowDown' ? 1 : -1) + results.length) % results.length;
            list.querySelectorAll('[role="option"]').forEach((option, index) => option.setAttribute('aria-selected', String(index === activeIndex)));
            const option = list.querySelectorAll('[role="option"]')[activeIndex];
            input.setAttribute('aria-activedescendant', option.id);
            option.scrollIntoView({ block: 'nearest' });
        }
        else if (event.key === 'Enter' && results.length)
        {
            event.preventDefault(); choose(results[activeIndex < 0 ? 0 : activeIndex].id);
        }
    });
    list.addEventListener('click', event =>
    {
        const button = event.target.closest('[data-tree-picker-person]');
        if (button) choose(button.dataset.treePickerPerson);
    });
    renderResults();
    bindMenuLifecycle(anchor, { ignoreScrollWithin: picker });
    input.focus({ preventScroll: true });
}

function renderFamilyTree(readyProjection = null, trace = null, preparation = {})
{
    const projectId = currentFamilyTreeProjectId();
    treePerf.project(projectId);
    if (!readyProjection && !trace && projectId && treePerf.status().active)
        trace = treePerf.begin(projectId, 'render', treeProjectViewState(projectId));
    const renderStarted = trace && treePerf.now();
    appNavigationObserve();
    closeTreeMobileMenu();
    sidebar.innerHTML = '';
    const treeProjectId =
        currentFamilyTreeProjectId();
    const context = readyProjection ? null : preparation.context
        || treePerf.measure(trace, 'people', () => treeFocusContext(treeProjectId));
    const treePeopleSource = readyProjection?.people || context.people;
    if (!readyProjection) treePerf.count(trace, 'projectPeople', treePeopleSource.length);

    if (!treeProjectId || !treePeopleSource.length)
    {
        treePerf.finish(trace, 'empty');
        disposeTreeElkLayout();
        disposeTreeRenderer();
        main.innerHTML = `
          <div class="tree-shell tree-shell-empty">
            <section class="tree-empty-state" aria-labelledby="treeEmptyTitle">
              <div class="tree-empty-state-card">
                <div class="tree-empty-state-icon" aria-hidden="true">${icon.tree}</div>
                <h1 id="treeEmptyTitle">${escapeHtml(t('Start your family tree'))}</h1>
                <p>${escapeHtml(t('Add the first person to begin building this project\'s family tree.'))}</p>
                <button class="button primary" type="button" data-tree-add-first-person>
                  ${icon.plus}
                  ${escapeHtml(t('Add first person'))}
                </button>
              </div>
            </section>
          </div>
        `;
        main.querySelector('[data-tree-add-first-person]')?.addEventListener('click', () =>
        {
            openAddPersonModal('Add person', 'Create a new person in this project');
        });
        return;
    }

    const treeViewState = treeProjectViewState(treeProjectId);
    const focusPersonId = readyProjection?.focusPersonId || resolveTreeFocusPersonId(treePeopleSource, treeProjectId);
    const treeFamilies = readyProjection ? null : treePerf.measure(trace, 'families', () => treeContextFamilies(context));
    if (treeFamilies) treePerf.count(trace, 'projectFamilies', treeFamilies.length);
    const topology = readyProjection || preparation.projection || treePerf.measure(trace, 'projection', () => buildFamilyTreeProjection(treePeopleSource, treeFamilies, {
        focusPersonId,
        ancestorGenerations: treeViewState.ancestorGenerations,
        descendantGenerations: treeViewState.descendantGenerations,
        showCousins: treeViewState.showCousins
    }));
    const projection = readyProjection || treePerf.measure(trace, 'people', () => hydrateTreeProjection(topology, context));
    treePerf.count(trace, 'visiblePeople', projection.people.length);
    treePerf.count(trace, 'visibleFamilies', projection.families.length);
    const familyPeopleCountLabel =
        translateCountPhrase(formatProjectPeopleCount(treeProjectId));

    if (!projection.people.some(person => person.id === state.selectedPersonId))
    {
        state.selectedPersonId = projection.focusPersonId;
    }
    const selected = projection.people.find(person => person.id === state.selectedPersonId)
        || projection.people.find(person => person.id === projection.focusPersonId)
        || projection.people[0];
    if (selected?.id)
    {
        rememberTreeSelectedPerson(
            selected.id,
            treeProjectId
        );
    }

    const treeLayout = treeElkLayoutForProjection(treeProjectId, projection, treeViewState, trace);
    const shellMarkup = () => `
        <div
          class="tree-shell"
          style="
            --tree-card-width:
              ${TREE_GEOMETRY.cardWidth}px;

            --tree-card-height:
              ${TREE_GEOMETRY.cardHeight}px;

            --tree-card-padding:
              ${TREE_GEOMETRY.cardPadding}px;

            --tree-card-content-gap:
              ${TREE_GEOMETRY.cardContentGap}px;

            --tree-avatar-size:
              ${TREE_GEOMETRY.avatarSize}px;

            --tree-partner-dash-length:
              ${TREE_GEOMETRY.partnerDashLength};

            --tree-partner-dash-gap:
              ${TREE_GEOMETRY.partnerDashGap};

            --tree-placeholder-width:
              ${treeParentPlaceholderWidth(2)}px;

            --tree-placeholder-height:
              ${TREE_CARD_H}px;

            --tree-focus-control-width:
              ${TREE_GEOMETRY.focusControlWidth}px;

            --tree-focus-control-height:
              ${TREE_GEOMETRY.focusControlHeight}px;
          ">
          <div class="tree-workspace ${state.treeInspectorCollapsed ? 'inspector-collapsed' : ''} ${treeViewState.colorFill !== false ? 'has-color-fill' : ''}">
          <div class="tree-toolbar">
            <div class="tree-toolbar-left">
              <button class="tree-control tree-control-select" type="button" data-tree-person-picker aria-haspopup="dialog" aria-expanded="false" aria-label="${escapeHtml(t('Find person'))}: ${escapeHtml(selected?.name || '')}" title="${escapeHtml(selected?.name || '')}">
                <span class="tree-control-focus-icon" aria-hidden="true">${icon.profile}</span>
                <span class="tree-control-copy"><strong class="tree-control-name">${escapeHtml(selected?.name || '')}</strong><small class="tree-control-find">${icon.search}${escapeHtml(t('Find person'))}</small></span>
                <span class="tree-control-chevron" aria-hidden="true">${icon.chevron}</span>
              </button>
              <div class="view-modes" role="tablist" aria-label="${escapeHtml(t('Tree view mode'))}">
                ${['vertical', 'horizontal', 'fan'].map((mode, index) =>
                    `<button class="view-mode" type="button" role="tab" data-tree-view="${mode}" ${mode === 'fan' ? 'disabled' : ''}>${[icon.tree, icon.pedigreeView, icon.fanView][index]}<span>${escapeHtml(t(['Vertical', 'Horizontal', 'Fan'][index]))}</span></button>`).join('')}
              </div>
            </div>
            <div class="tree-toolbar-right">
              <label class="tree-view-mobile">${icon.tree}<select data-tree-orientation aria-label="${escapeHtml(t('Tree view mode'))}"><option value="vertical">${escapeHtml(t('Vertical'))}</option><option value="horizontal">${escapeHtml(t('Horizontal'))}</option><option disabled>${escapeHtml(t('Fan'))}</option></select>${icon.chevron}</label>
              <span class="tree-people-status" role="status" aria-label="${escapeHtml(t('People in project'))}: ${escapeHtml(familyPeopleCountLabel)}" title="${escapeHtml(t('People in project'))}">${escapeHtml(familyPeopleCountLabel)}</span>
              <details class="tree-branch-legend" hidden data-i18n-skip><summary></summary><div class="tree-branch-legend-content"></div></details>
              <button class="tree-icon-button tree-display-settings" type="button" data-tree-settings aria-label="${escapeHtml(t('Tree display settings'))}" title="${escapeHtml(t('Tree display settings'))}">${icon.slidersHorizontal}</button>
            </div>
          </div>

            <section class="tree-canvas" tabindex="0" aria-label="Family tree canvas">
              <div class="tree-stage">
                <svg class="tree-lines" aria-hidden="true"></svg>
                <div data-tree-placeholders></div>
                <div data-tree-cards></div>
                <div data-tree-focus-controls></div>
              </div>
              <div class="tree-layout-status" role="status" hidden></div>
              <div class="tree-zoom">
                <button class="zoom-button" type="button" data-zoom="out" aria-label="Zoom out">${icon.zoomOut}</button>
                <div class="zoom-value">${Math.round(state.treeZoom)}%</div>
                <button class="zoom-button" type="button" data-zoom="in" aria-label="Zoom in">${icon.zoomIn}</button>
                <button class="zoom-button" type="button" data-zoom="fit" aria-label="Fit tree">${icon.home}</button>
                <button class="zoom-button" type="button" data-tree-fullscreen aria-label="${escapeHtml(t(treeFullscreenRuntime.requested ? 'Exit full screen' : 'Enter full screen'))}" title="${escapeHtml(t(treeFullscreenRuntime.requested ? 'Exit full screen' : 'Enter full screen'))}" aria-pressed="${treeFullscreenRuntime.requested ? 'true' : 'false'}">${treeFullscreenRuntime.requested ? icon.fullscreenExit : icon.expand}</button>
              </div>
            </section>
          </div>
        </div>
      `;
    let runtime = treeRenderRuntime;
    const mount = runtime?.projectId !== treeProjectId || !runtime.shell.isConnected;
    if (mount)
    {
        disposeTreeRenderer();
        main.innerHTML = shellMarkup();
        const shell = main.querySelector('.tree-shell');
        const canvas = shell.querySelector('.tree-canvas');
        runtime = { projectId: treeProjectId, shell, canvas, stage: canvas.querySelector('.tree-stage'),
            workspace: shell.querySelector('.tree-workspace'), cards: canvas.querySelector('[data-tree-cards]'),
            placeholders: canvas.querySelector('[data-tree-placeholders]'), controls: canvas.querySelector('[data-tree-focus-controls]'),
            lines: canvas.querySelector('.tree-lines'), controller: new AbortController(), contentRevision: 0 };
        treeRenderRuntime = runtime;
        bindTreeViewport(runtime);
        bindTreeRenderer(runtime);
    }
    else if (runtime.language !== state.language)
    {
        localizeUI(runtime.shell, { suppressObserverReplay: true });
        updateTreeFullscreenButton();
    }
    runtime.language = state.language;
    for (const button of runtime.shell.querySelectorAll('[data-tree-view]'))
    {
        const active = button.dataset.treeView === treeViewState.orientation;
        button.classList.toggle('active', active);
        button.setAttribute('aria-selected', String(active));
        const label = { vertical: 'Vertical tree', horizontal: 'Horizontal tree', fan: 'Fan' }[button.dataset.treeView];
        button.setAttribute('aria-label', t(label));
        button.title = t(label);
    }
    runtime.shell.querySelector('[data-tree-orientation]').value = treeViewState.orientation;
    runtime.shell.querySelector('.tree-people-status').textContent = familyPeopleCountLabel;
    treePerf.measure(trace, 'inspector', () => updateTreeInspector(runtime, selected));
    const status = runtime.canvas.querySelector('.tree-layout-status');
    const diagnostics = treeLayout?.diagnostics || [];
    status.hidden = Boolean(treeLayout && !diagnostics.length);
    // Retain disclosure state while the same request is displayed, not across projects.
    const expanded = runtime.diagnosticRequest === treeElkRequest && Boolean(status.querySelector('details')?.open);
    runtime.diagnosticRequest = treeElkRequest;
    const signature = JSON.stringify([state.language, diagnostics, Boolean(treeLayout), Boolean(treeElkRequest?.error)]);
    if (status.dataset.signature !== signature)
    {
        status.dataset.signature = signature;
        status.replaceChildren();
        if (diagnostics.length)
        {
            const details = document.createElement('details');
            details.open = expanded;
            const summary = document.createElement('summary');
            summary.textContent = t('Some relationships require review.') + ' (' + diagnostics.length + ')';
            const list = document.createElement('ul');
            for (const diagnostic of diagnostics)
            {
                const item = document.createElement('li');
                const subject = document.createElement('strong');
                subject.textContent = diagnostic.subject || t('Tree layout');
                item.append(subject, document.createTextNode(' — ' + diagnostic.reason));
                if (diagnostic.technical)
                {
                    const technical = document.createElement('small');
                    technical.textContent = diagnostic.technical;
                    item.append(technical);
                }
                list.append(item);
            }
            details.append(summary, list);
            status.append(details);
        }
        else if (!status.hidden)
        {
            status.textContent = t(treeElkRequest?.error ? 'ELK could not lay out this tree.' : 'Calculating tree layout…');
            if (treeElkRequest?.error)
            {
                const retry = document.createElement('button');
                retry.type = 'button';
                retry.className = 'button secondary';
                retry.dataset.treeRetryLayout = '';
                retry.textContent = t('Retry');
                status.append(retry);
            }
        }
    }
    runtime.stage.hidden = !treeLayout;
    if (!treeLayout)
    {
        clearTreePortraits(runtime);
        runtime.scene = null;
        if (runtime.stage.contains(document.activeElement)) runtime.canvas.focus({ preventScroll: true });
        if (trace)
        {
            treePerf.span(trace, 'renderSync', treePerf.now() - renderStarted);
            treePerf.mark(trace, 'pendingFeedback');
            if (treeElkRequest?.error) treePerf.finish(trace, 'failed');
            else if (treeElkRequest?.trace !== trace) treePerf.finish(trace, 'unchanged');
        }
        return;
    }
    runtime.contentRevision++;
    const orientationChanged = runtime.sceneOrientation !== treeLayout.orientation;
    runtime.sceneOrientation = treeLayout.orientation;
    runtime.scene = treePerf.measure(trace, 'scene', () => createTreeRenderScene(treeLayout));
    treePerf.count(trace, 'cards', runtime.scene.cards.length);
    treePerf.count(trace, 'placeholders', runtime.scene.placeholders.length);
    treePerf.count(trace, 'paths', runtime.scene.paths.length);
    treePerf.count(trace, 'diagnostics', diagnostics.length);
    treePerf.measure(trace, 'colors', () => refreshTreeColors(runtime));
    runtime.request = treeElkRequest;
    runtime.focusId = focusPersonId;
    runtime.ancestors = treeViewState.ancestorGenerations;
    runtime.descendants = treeViewState.descendantGenerations;
    runtime.cousins = treeViewState.showCousins;
    runtime.editRevision = projection.editRevision;
    runtime.stage.style.width = runtime.scene.width + 'px';
    runtime.stage.style.height = runtime.scene.height + 'px';
    runtime.lines.setAttribute('viewBox', '0 0 ' + runtime.scene.width + ' ' + runtime.scene.height);
    updateTreeViewportLimits(runtime);
    const centerTarget = state.treeCenterTargetId;
    state.treeCenterTargetId = '';
    if (centerTarget) centerTreeOnOccurrence(runtime.scene.primaryByPerson.get(centerTarget), false);
    else
    {
        const bookmark = [treeViewState.canvasScroll, treeViewState.orientationBookmarks.get(treeLayout.orientation)]
            .find(candidate => candidate?.key === runtime.request.key);
        if (bookmark && (orientationChanged || runtime.bookmark !== bookmark))
            restoreTreeCanvasScroll(bookmark);
        else if (orientationChanged || !runtime.hasScene)
            centerTreeOnOccurrence(runtime.scene.primaryByPerson.get(focusPersonId), false);
        runtime.bookmark = bookmark;
    }
    runtime.hasScene = true;
    runtime.performanceTrace = trace;
    flushTreeViewport(runtime);
    runtime.performanceTrace = null;
    if (treeViewState.ancestryFocusReturn)
    {
        const occurrenceId = treeViewState.ancestryFocusReturn;
        const selector = '[data-tree-occurrence-id="' + CSS.escape(occurrenceId) + '"]';
        delete treeViewState.ancestryFocusReturn;
        if (!runtime.cards.querySelector(selector)) centerTreeOnOccurrence(runtime.scene.byOccurrence.get(occurrenceId));
        runtime.cards.querySelector(selector)?.focus({ preventScroll: true });
    }
    if (treeRelativeIntent && (treeRelativeIntent.projectId !== treeProjectId || treeRelativeIntent.personId !== focusPersonId))
        treeRelativeIntent = null;
    if (treeRelativeIntent)
    {
        const { personId } = treeRelativeIntent;
        treeRelativeIntent = null;
        const button = treePrimaryPersonCard(personId)?.querySelector('[data-card-add="relative"]');
        if (button) requestAnimationFrame(() => { if (button.isConnected) openRelativePopover(button, personId); });
    }
    if (trace)
    {
        treePerf.span(trace, 'renderSync', treePerf.now() - renderStarted);
        treePerf.mark(trace, 'scenePublished');
        treePerf.finish(trace, 'completed');
        const scene = runtime.scene;
        requestAnimationFrame(() =>
        {
            if (treeRenderRuntime === runtime && runtime.scene === scene && !runtime.stage.hidden)
                treePerf.mark(trace, 'frameOpportunity');
        });
    }
}

function treeConnectorPath(points)
{
    const normalized = (points || [])
        .map(point => ({ x: Math.round(Number(point.x)), y: Math.round(Number(point.y)) }))
        .filter(point => Number.isFinite(point.x) && Number.isFinite(point.y))
        .filter((point, index, list) => !index || point.x !== list[index - 1].x || point.y !== list[index - 1].y);
    if (normalized.length < 2) return '';
    return normalized.slice(1).reduce((path, point, index) =>
    {
        const previous = normalized[index];
        if (point.y === previous.y) return `${path} H${point.x}`;
        if (point.x === previous.x) return `${path} V${point.y}`;
        return `${path} L${point.x} ${point.y}`;
    }, `M${normalized[0].x} ${normalized[0].y}`);
}

function treePartnerConnectorClass(family)
{
    const type = String(family?.relationshipType || '').trim().toLowerCase();
    const status = String(family?.relationshipStatus || '').trim().toLowerCase();
    const dashed = ['separated', 'divorced'].includes(type)
        || ['separated', 'divorced'].includes(status);

    return dashed ? 'tree-line partner is-separated-or-divorced' : 'tree-line partner';
}

function renderTreeParentPlaceholder(placeholder, target = personById(placeholder.personId))
{
    const displayLabel = translateText(placeholder.label);
    return `<button class="add-parent-card" type="button" style="left:${placeholder.x}px;top:${placeholder.y}px;--tree-placeholder-width:${placeholder.width}px;--tree-placeholder-height:${placeholder.height}px" data-person-id="${placeholder.personId}" data-add-relative="${placeholder.rel}" aria-label="${escapeHtml(placeholder.label)} for ${escapeHtml(target.name)}"><span><span class="add-plus">${icon.plus}</span><span class="add-label">${escapeHtml(displayLabel).replace(' ', '<br>')}</span></span></button>`;
}

function renderTreeFocusControl(control)
{
    const person = personById(control.canonicalPersonId || control.personId);
    if (!person) return '';
    const localizedName = translateText(person.name);
    const accessibleLabel = state.language === 'ru'
        ? `Показать ветвь для ${localizedName}`
        : `Focus branch for ${localizedName}`;
    const visibleLabel = state.language === 'ru' ? 'Фокус' : 'Focus';
    return `<button class="tree-focus-control" type="button" style="left:${control.x}px;top:${control.y}px" data-tree-card-focus="${escapeHtml(person.id)}" data-i18n-skip aria-label="${escapeHtml(accessibleLabel)}">${icon.focus}<span>${visibleLabel}</span></button>`;
}

function renderTreePersonCard(person)
{
    const personId = person.canonicalPersonId || person.id;
    const repeated = person.occurrenceCount > 1;
    const primary = person.primary !== false;
    const collapsed = repeated && person.hasParents && !person.expanded;
    const selected =
        personId
          === state.selectedPersonId;

    const focused =
        personId
          === treeProjectViewState()
              .focusPersonId;

    const displayName = translateText(person.name || 'Unnamed person');
    const compactName = translateText(person.compactName || displayName);
    const givenName = person.first || compactName;
    const initials = treeCardInitials(person);
    const dates = treeCardDatePresentation(person.birthFact, person.deathFact, person.status, state.language);
    const editLabel = state.language === 'ru' ? `Редактировать: ${translateText(displayName)}` : `Edit ${displayName}`;
    const label = repeated
        ? `${translateText(displayName)} (${state.language === 'ru' ? 'карточек в дереве' : 'cards in tree'}: ${person.occurrenceCount})`
        : displayName;

    return `
        <article
          class="
            tree-person-card
            ${treePersonGenderClass(person)}
            ${selected ? 'selected' : ''}
            ${focused ? 'is-focus-person' : ''}
            ${repeated ? 'has-tree-occurrences' : ''}
          "
          style="
            left:${person.layoutX}px;
            top:${person.layoutY}px;
          "
          data-person-id="${escapeHtml(personId)}"
          data-tree-occurrence-id="${escapeHtml(person.id)}"
          data-tree-primary="${primary}"
          ${repeated && person.hasParents ? `data-tree-ancestry="${collapsed ? 'collapsed' : 'expanded'}"` : ''}
          tabindex="0"
          aria-label="${escapeHtml([translateText(label), ...dates].join(', '))}" data-i18n-skip
          ${
                focused && primary
                    ? 'aria-current="true"'
                    : ''
            }>

          ${collapsed && person.preferredContext
              ? `<button type="button" class="tree-occurrence-badge" data-tree-expand-ancestry aria-label="${escapeHtml(t('Show ancestry here'))}" title="${escapeHtml(t('Show ancestry here'))}">×${person.occurrenceCount}</button>`
              : repeated ? `<span class="tree-occurrence-badge" ${person.hasParents && person.expanded ? `title="${escapeHtml(t('Ancestry shown here'))}"` : 'aria-hidden="true"'}>×${person.occurrenceCount}</span>` : ''}
          <div class="tree-card-avatar-stack">
            <div class="person-avatar tree-avatar" aria-hidden="true">
              <span class="person-avatar-initials tree-initial-pair">${escapeHtml(initials.pair)}</span>
              <span class="person-avatar-initials tree-initial-single">${escapeHtml(initials.single)}</span>
            </div>
          </div>

          ${
                focused && primary
                    ? `
                  <span class="tree-focus-badge">
                    ${icon.focus}
                    <span>${escapeHtml(t('Focus'))}</span>
                  </span>
                `
                    : ''
            }

          <div class="tree-card-content">
            <span class="tree-given-name" aria-hidden="true">${escapeHtml(givenName)}</span>
            <h3
              class="tree-name tree-name-full"
              title="${escapeHtml(displayName)}">

              ${escapeHtml(displayName)}
            </h3>

            <h3 class="tree-name tree-name-compact" title="${escapeHtml(displayName)}">${escapeHtml(compactName)}</h3>
            ${renderTreeCardDateLines(
                person
            )}
          </div>

          <div class="card-actions">
            <button
              class="card-action"
              type="button"
              data-card-edit="${escapeHtml(personId)}"
              aria-label="${escapeHtml(editLabel)}" title="${escapeHtml(t('Edit'))}">

              ${icon.edit}
            </button>

            <button
              class="card-action"
              type="button"
              data-card-add="relative"
              aria-label="${escapeHtml(t('Add relative'))}" title="${escapeHtml(t('Add relative'))}">

              ${icon.plus}
            </button>
          </div>
        </article>
      `;
}

function treePersonGenderClass(person)
{
    const gender = String(person?.gender || '').toLowerCase();

    if (gender === 'female') return 'female';
    if (gender === 'male') return 'male';

    return 'unknown-gender';
}

const treeInitialSegmenter = typeof Intl.Segmenter === 'function' ? new Intl.Segmenter() : null;

function treeCardInitials(person)
{
    const names = person.names || {};
    const segmenter = treeInitialSegmenter;
    const initial = value =>
    {
        const text = normalizeNameSegment(value).toLocaleUpperCase();
        return (segmenter?.segment(text)[Symbol.iterator]().next().value?.segment || Array.from(text)[0] || '');
    };
    const given = initial(names.first);
    const family = initial(names.last || names.maiden);
    const single = given || family || initial(names.middle || names.prefix || names.suffix) || '?';
    return { single, pair: given && family ? given + family : single };
}

function treeCardDatePresentation(birth, death, status, language, compact = false)
{
    const format = input =>
    {
        const date = normalizeGenealogyDateInput(input);
        if (date.state !== 'known')
            return { text: date.state === 'unparsed' ? date.originalText : '', detailed: false };
        if (compact)
        {
            const compactPart = part => part.year
                || dateLabelFromParts(null, part.month, part.day, language, { padDay: false });
            const year = compactPart(date.first);
            const qualifier = (language === 'ru'
                ? { 'About / Circa': 'ок.', Calculated: 'выч.', Before: 'до', After: 'после' }
                : { 'About / Circa': 'c.', Calculated: 'calc.', Before: 'bef.', After: 'aft.' })[date.dateType];
            if (date.dateType === 'Between')
                return { text: (language === 'ru' ? 'между ' : 'bet. ') + year + '–' + compactPart(date.second), detailed: false };
            return { text: qualifier ? qualifier + ' ' + year : String(year), detailed: false };
        }
        return { text: genealogyDateDisplay(date, language, { padDay: false }),
            detailed: Boolean(date.first.month || date.second?.month || date.dateType === 'Between') };
    };
    const start = format(birth), end = format(death);
    const living = normalizeLivingStatus(status);
    if (start.text && end.text)
        return start.detailed || end.detailed ? [start.text, '– ' + end.text] : [start.text + '–' + end.text];
    if (end.text) return ['?–' + end.text];
    if (start.text) return [start.text + (living === 'Living' ? '' : '–?')];
    if (living === 'Living') return [];
    return [language === 'ru'
        ? (living === 'Deceased' ? 'Умер(ла)' : 'Неизвестно')
        : (living === 'Deceased' ? 'Deceased' : 'Unknown')];
}

function renderTreeCardDateLines(person)
{
    const dates = compact => treeCardDatePresentation(person.birthFact, person.deathFact, person.status, state.language, compact)
        .map(line => '<span>' + escapeHtml(line) + '</span>').join('');
    return '<div class="tree-dates tree-dates-full" aria-hidden="true" data-i18n-skip>' + dates(false) + '</div>'
        + '<div class="tree-dates tree-dates-compact" aria-hidden="true" data-i18n-skip>' + dates(true) + '</div>';
}

