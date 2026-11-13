function renderFamilyTreePreserveScroll()
{
    const scroll = getTreeCanvasScroll();

    // If another action intentionally wants to center on a person,
    // let that behavior win instead of restoring old scroll.
    const hasPendingCenter = Boolean(state.treeCenterTargetId);

    renderFamilyTree();

    if (!hasPendingCenter)
    {
        restoreTreeCanvasScroll(scroll);
    }

    return true;
}

const treeZoomRuntime = {
    frame: null,
    delta: 0,
    clientX: 0,
    clientY: 0
};

const treeFullscreenRuntime = {
    requested: false,
    exitAfterEnter: false,
    center: null
};

function treeFullscreenCenter()
{
    const canvas = main.querySelector('.tree-canvas');
    if (!canvas) return null;
    const zoom = state.treeZoom / 100;
    return {
        x: (canvas.scrollLeft + canvas.clientWidth / 2) / zoom,
        y: (canvas.scrollTop + canvas.clientHeight / 2) / zoom
    };
}

function restoreTreeFullscreenCenter(center = treeFullscreenRuntime.center)
{
    const canvas = main.querySelector('.tree-canvas');
    if (!canvas || !center) return;
    const zoom = state.treeZoom / 100;
    canvas.scrollLeft = center.x * zoom - canvas.clientWidth / 2;
    canvas.scrollTop = center.y * zoom - canvas.clientHeight / 2;
}

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
    treeFullscreenRuntime.center = treeFullscreenCenter();
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
    treeFullscreenRuntime.center = treeFullscreenCenter();
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
    const center = treeFullscreenRuntime.center;
    requestAnimationFrame(() => restoreTreeFullscreenCenter(center));
});

let treeCardLastClick = null;

function treeViewportPointAtClient(clientX, clientY)
{
    const canvas = main.querySelector('.tree-canvas');
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const zoom = state.treeZoom / 100;
    return {
        x: (canvas.scrollLeft + clientX - rect.left) / zoom,
        y: (canvas.scrollTop + clientY - rect.top) / zoom
    };
}

function restoreTreeViewportAnchor(point, clientX, clientY)
{
    const canvas = main.querySelector('.tree-canvas');
    if (!canvas || !point) return;
    const rect = canvas.getBoundingClientRect();
    const zoom = state.treeZoom / 100;
    canvas.scrollLeft = point.x * zoom - (clientX - rect.left);
    canvas.scrollTop = point.y * zoom - (clientY - rect.top);
}

function applyTreeZoomToDom(options = {})
{
    const canvas = main.querySelector('.tree-canvas');
    const stageSpace = canvas?.querySelector('.tree-stage-space');
    const stage = stageSpace?.querySelector('.tree-stage');
    if (!canvas || !stageSpace || !stage) return false;
    const scale = state.treeZoom / 100;
    const stageWidth = Number.parseFloat(stage.style.width) || stage.offsetWidth;
    const stageHeight = Number.parseFloat(stage.style.height) || stage.offsetHeight;
    stageSpace.style.width = `${stageWidth * scale}px`;
    stageSpace.style.height = `${stageHeight * scale}px`;
    stage.style.transform = `scale(${scale})`;
    const value = canvas.querySelector('.tree-zoom .zoom-value');
    if (value) value.textContent = `${state.treeZoom}%`;
    if (options.anchor)
    {
        restoreTreeViewportAnchor(options.anchor, options.clientX, options.clientY);
    }
    else if (options.center)
    {
        canvas.scrollLeft = options.center.x * scale - canvas.clientWidth / 2;
        canvas.scrollTop = options.center.y * scale - canvas.clientHeight / 2;
    }
    return true;
}

function setTreeZoom(nextZoom, options = {})
{
    const zoom = Math.max(70, Math.min(130, Math.round(nextZoom)));
    if (zoom === state.treeZoom) return false;
    const canvas = main.querySelector('.tree-canvas');
    const center = options.anchor ? null : canvas ? {
        x: (canvas.scrollLeft + canvas.clientWidth / 2) / (state.treeZoom / 100),
        y: (canvas.scrollTop + canvas.clientHeight / 2) / (state.treeZoom / 100)
    } : null;
    state.treeZoom = zoom;
    return applyTreeZoomToDom({ ...options, center });
}

function queueTreeWheelZoom(event)
{
    event.preventDefault();
    treeZoomRuntime.delta += event.deltaY;
    treeZoomRuntime.clientX = event.clientX;
    treeZoomRuntime.clientY = event.clientY;
    if (treeZoomRuntime.frame) return;
    treeZoomRuntime.frame = requestAnimationFrame(() =>
    {
        treeZoomRuntime.frame = null;
        const delta = treeZoomRuntime.delta;
        treeZoomRuntime.delta = 0;
        if (!delta) return;
        const clientX = treeZoomRuntime.clientX;
        const clientY = treeZoomRuntime.clientY;
        const anchor = treeViewportPointAtClient(clientX, clientY);
        setTreeZoom(state.treeZoom + (delta < 0 ? 10 : -10), { anchor, clientX, clientY });
    });
}

function bindTreeCanvasPan()
{
    const canvas = main.querySelector('.tree-canvas');

    if (!canvas) return;

    const DRAG_THRESHOLD = 4;

    /*
      * Person cards are intentionally omitted. Their non-control
      * surfaces can initiate panning, while clicking without
      * moving continues to activate the card.
      */
    const interactiveSelector = [
        '.add-parent-card',
        '.tree-zoom',
        'button',
        'input',
        'select',
        'textarea',
        'a',
        '[contenteditable="true"]'
    ].join(', ');

    let gesture = null;
    let suppressNextClick = false;
    const touches = new Map();
    let touchGesture = null;

    const touchMidpoint = () =>
    {
        const [first, second] = [...touches.values()];
        return {
            x: (first.x + second.x) / 2,
            y: (first.y + second.y) / 2,
            distance: Math.hypot(first.x - second.x, first.y - second.y)
        };
    };

    const beginTouchPinch = () =>
    {
        const midpoint = touchMidpoint();
        touchGesture = {
            kind: 'pinch',
            zoom: state.treeZoom,
            distance: Math.max(1, midpoint.distance),
            anchor: treeViewportPointAtClient(midpoint.x, midpoint.y)
        };
        suppressNextClick = true;
        canvas.classList.remove('is-panning');
        touches.forEach((_, pointerId) => canvas.setPointerCapture?.(pointerId));
    };

    canvas.addEventListener('pointerdown', event =>
    {
        if (event.pointerType !== 'touch') return;
        touches.set(event.pointerId, { x: event.clientX, y: event.clientY });
        if (touches.size === 2)
        {
            beginTouchPinch();
        }
        else if (touches.size === 1 && !event.target.closest(interactiveSelector))
        {
            touchGesture = {
                kind: 'pan', pointerId: event.pointerId,
                x: event.clientX, y: event.clientY,
                left: canvas.scrollLeft, top: canvas.scrollTop,
                moved: false
            };
        }
    });

    canvas.addEventListener('pointermove', event =>
    {
        if (event.pointerType !== 'touch' || !touches.has(event.pointerId)) return;
        touches.set(event.pointerId, { x: event.clientX, y: event.clientY });
        if (touchGesture?.kind === 'pinch' && touches.size >= 2)
        {
            const midpoint = touchMidpoint();
            setTreeZoom(touchGesture.zoom * midpoint.distance / touchGesture.distance, {
                anchor: touchGesture.anchor,
                clientX: midpoint.x,
                clientY: midpoint.y
            });
            restoreTreeViewportAnchor(touchGesture.anchor, midpoint.x, midpoint.y);
            event.preventDefault();
        }
        else if (touchGesture?.kind === 'pan' && touchGesture.pointerId === event.pointerId)
        {
            const dx = event.clientX - touchGesture.x;
            const dy = event.clientY - touchGesture.y;
            if (!touchGesture.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
            touchGesture.moved = true;
            suppressNextClick = true;
            canvas.classList.add('is-panning');
            canvas.setPointerCapture?.(event.pointerId);
            canvas.scrollLeft = touchGesture.left - dx;
            canvas.scrollTop = touchGesture.top - dy;
            event.preventDefault();
        }
    });

    const endTouch = event =>
    {
        if (event.pointerType !== 'touch' || !touches.delete(event.pointerId)) return;
        if (canvas.hasPointerCapture?.(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
        if (touchGesture?.kind === 'pinch')
        {
            // Do not turn the remaining finger into a pan after a pinch.
            if (!touches.size) touchGesture = null;
        }
        else if (touchGesture?.pointerId === event.pointerId)
        {
            touchGesture = null;
            canvas.classList.remove('is-panning');
        }
        if (!touches.size && suppressNextClick)
        {
            setTimeout(() => { suppressNextClick = false; }, 500);
        }
    };
    canvas.addEventListener('pointerup', endTouch);
    canvas.addEventListener('pointercancel', endTouch);

    const finishGesture = event =>
    {
        if (!gesture) return;

        if (
            event?.pointerId !== undefined &&
          event.pointerId !== gesture.pointerId
        )
        {
            return;
        }

        const pointerId = gesture.pointerId;
        const didPan = gesture.didPan;

        gesture = null;
        canvas.classList.remove('is-panning');

        /*
        * A stationary press must remain a normal browser click.
        */
        if (!didPan)
        {
            suppressNextClick = false;
        }

        if (canvas.hasPointerCapture?.(pointerId))
        {
            try
            {
                canvas.releasePointerCapture(pointerId);
            }
            catch
            {
            /*
            * The browser may already have released capture.
            */
            }
        }
    };

    canvas.addEventListener('pointerdown', event =>
    {
        if (
            event.button !== 0 ||
          event.isPrimary === false ||
          event.pointerType === 'touch'
        )
        {
            return;
        }

        const target =
            event.target instanceof Element
                ? event.target
                : null;

        if (target?.closest(interactiveSelector))
        {
            return;
        }

        suppressNextClick = false;

        gesture = {
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            startScrollLeft: canvas.scrollLeft,
            startScrollTop: canvas.scrollTop,
            didPan: false
        };

        /*
        * Do not call setPointerCapture here. Keeping the original
        * pointer target is what allows stationary card clicks.
        */
    });

    canvas.addEventListener('pointermove', event =>
    {
        if (
            !gesture ||
          event.pointerId !== gesture.pointerId
        )
        {
            return;
        }

        const deltaX = event.clientX - gesture.startX;
        const deltaY = event.clientY - gesture.startY;

        if (!gesture.didPan)
        {
            const distance = Math.hypot(deltaX, deltaY);

            if (distance < DRAG_THRESHOLD)
            {
                return;
            }

            gesture.didPan = true;
            suppressNextClick = true;
            canvas.classList.add('is-panning');

            /*
          * Capture only after this gesture has become a pan.
          */
            canvas.setPointerCapture?.(event.pointerId);

            window.getSelection()?.removeAllRanges();
        }

        event.preventDefault();

        canvas.scrollLeft =
            gesture.startScrollLeft - deltaX;

        canvas.scrollTop =
            gesture.startScrollTop - deltaY;
    });

    /*
      * Dragging from a card can still produce a synthetic click
      * after pointerup. Consume that click only when a real pan
      * crossed the drag threshold.
      */
    canvas.addEventListener(
        'click',
        event =>
        {
            if (!suppressNextClick) return;

            suppressNextClick = false;
            event.preventDefault();
            event.stopImmediatePropagation();
        },
        true
    );

    canvas.addEventListener('pointerup', finishGesture);
    canvas.addEventListener('pointercancel', finishGesture);
    canvas.addEventListener('lostpointercapture', finishGesture);
}

const treeSearchRuntime = {
    input: null,
    menu: null,
    controller: null,
    results: [],
    activeIndex: -1
};

function hideTreeSearchResults()
{
    treeSearchRuntime.menu?.remove();
    treeSearchRuntime.menu = null;
    treeSearchRuntime.results = [];
    treeSearchRuntime.activeIndex = -1;
    treeSearchRuntime.input?.setAttribute('aria-expanded', 'false');
    treeSearchRuntime.input?.removeAttribute('aria-controls');
    treeSearchRuntime.input?.removeAttribute('aria-activedescendant');
}

function disposeTreeSearch()
{
    hideTreeSearchResults();
    treeSearchRuntime.controller?.abort();
    treeSearchRuntime.controller = null;
    treeSearchRuntime.input = null;
}

function positionTreeSearchResults()
{
    const { input, menu } = treeSearchRuntime;
    if (!input?.isConnected || !menu) return;

    const rect = input.closest('.app-search-field').getBoundingClientRect();
    const width = Math.min(332, window.innerWidth - 24);
    menu.style.width = `${width}px`;
    menu.style.left = `${Math.max(12, Math.min(rect.left, window.innerWidth - width - 12))}px`;
    const below = window.innerHeight - rect.bottom - 12;
    const above = rect.top - 12;
    menu.style.maxHeight = `${Math.max(80, Math.min(360, Math.max(below, above)))}px`;
    menu.style.top = below >= Math.min(menu.scrollHeight, 280) || below >= above
        ? `${rect.bottom + 6}px`
        : `${Math.max(12, rect.top - Math.min(menu.scrollHeight, 360) - 6)}px`;
}

function setTreeSearchActiveIndex(index)
{
    const { input, menu, results } = treeSearchRuntime;
    if (!menu || !results.length) return;
    treeSearchRuntime.activeIndex = (index + results.length) % results.length;
    menu.querySelectorAll('[role="option"]').forEach((option, optionIndex) =>
    {
        const active = optionIndex === treeSearchRuntime.activeIndex;
        option.classList.toggle('is-active', active);
        option.setAttribute('aria-selected', String(active));
    });
    const activeOption = menu.querySelectorAll('[role="option"]')[treeSearchRuntime.activeIndex];
    input.setAttribute('aria-activedescendant', activeOption.id);
    activeOption.scrollIntoView({ block: 'nearest' });
}

function updateTreeSearchResults()
{
    const input = treeSearchRuntime.input;
    const query = input?.value.trim().toLocaleLowerCase();
    if (!query)
    {
        hideTreeSearchResults();
        return;
    }

    const projectId = currentFamilyTreeProjectId();
    const results = getPeople(projectId)
        .filter(person => !person.deleted)
        .filter(person =>
        {
            const names = [
                connectPersonName(person),
                person.names?.first,
                person.names?.middle,
                person.names?.last,
                person.names?.maiden
            ].filter(Boolean);
            return [...names, ...names.map(name => translateText(name))]
                .join(' ').toLocaleLowerCase().includes(query);
        })
        .sort((a, b) => connectPersonName(a).localeCompare(connectPersonName(b), state.language))
        .slice(0, 12);
    treeSearchRuntime.results = results;
    treeSearchRuntime.activeIndex = -1;
    input.removeAttribute('aria-activedescendant');

    const menu = treeSearchRuntime.menu || document.createElement('div');
    menu.id = 'treeSearchResults';
    menu.className = 'menu-popover tree-search-results';
    menu.setAttribute('role', 'listbox');
    menu.setAttribute('aria-label', t('Search results'));
    menu.innerHTML = results.length
        ? results.map((person, index) => `<button id="treeSearchOption${index}" class="tree-recent-person" type="button" role="option" aria-selected="false" tabindex="-1" data-tree-search-person="${escapeHtml(person.id)}">
              ${renderPersonAvatar(person, 'small-avatar')}
              <span><strong>${escapeHtml(connectPersonName(person))}</strong><small>${escapeHtml(connectPersonLifeLine(person))}</small></span>
            </button>`).join('')
        : `<div class="tree-recent-people-empty" role="status">${escapeHtml(t('No matching people.'))}</div>`;
    if (!menu.isConnected) document.body.appendChild(menu);
    treeSearchRuntime.menu = menu;
    input.setAttribute('aria-controls', menu.id);
    input.setAttribute('aria-expanded', 'true');
    localizeUI(menu, { suppressObserverReplay: true });
    positionTreeSearchResults();
}

function bindTreeSearch()
{
    const input = main.querySelector('#treeSearch');
    if (!input) return;
    const controller = new AbortController();
    const { signal } = controller;
    treeSearchRuntime.input = input;
    treeSearchRuntime.controller = controller;
    let openBeforePointer = null;

    input.addEventListener('input', updateTreeSearchResults, { signal });
    input.addEventListener('focus', updateTreeSearchResults, { signal });
    input.addEventListener('pointerdown', () =>
    {
        openBeforePointer = Boolean(treeSearchRuntime.menu);
    }, { signal });
    input.addEventListener('click', () =>
    {
        const wasOpen = openBeforePointer;
        openBeforePointer = null;
        if (wasOpen === true) hideTreeSearchResults();
        else if (!treeSearchRuntime.menu) updateTreeSearchResults();
    }, { signal });
    input.addEventListener('keydown', event =>
    {
        if (event.key === 'Escape')
        {
            if (!treeSearchRuntime.menu) return;
            event.preventDefault();
            event.stopPropagation();
            hideTreeSearchResults();
        }
        else if (event.key === 'ArrowDown' || event.key === 'ArrowUp')
        {
            if (!treeSearchRuntime.menu) updateTreeSearchResults();
            if (!treeSearchRuntime.results.length) return;
            event.preventDefault();
            setTreeSearchActiveIndex(treeSearchRuntime.activeIndex + (event.key === 'ArrowDown' ? 1 : -1));
        }
        else if (event.key === 'Enter' && treeSearchRuntime.menu)
        {
            const person = treeSearchRuntime.results[treeSearchRuntime.activeIndex < 0
                ? 0 : treeSearchRuntime.activeIndex];
            if (!person) return;
            event.preventDefault();
            hideTreeSearchResults();
            input.value = '';
            navigateFamilyTreeToPerson(person.id);
        }
    }, { signal });
    document.addEventListener('pointerdown', event =>
    {
        if (!input.closest('.app-search-field')?.contains(event.target)
            && !treeSearchRuntime.menu?.contains(event.target)) hideTreeSearchResults();
    }, { signal });
    document.addEventListener('scroll', positionTreeSearchResults, { capture: true, signal });
    window.addEventListener('resize', positionTreeSearchResults, { signal });
    document.addEventListener('pointerdown', event =>
    {
        const option = event.target.closest('[data-tree-search-person]');
        if (option && treeSearchRuntime.menu?.contains(option)) event.preventDefault();
    }, { signal });
    document.addEventListener('click', event =>
    {
        const option = event.target.closest('[data-tree-search-person]');
        if (!option || !treeSearchRuntime.menu?.contains(option)) return;
        const personId = option.dataset.treeSearchPerson;
        hideTreeSearchResults();
        input.value = '';
        navigateFamilyTreeToPerson(personId);
    }, { signal });
}

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
    menu.className = 'tree-mobile-menu';
    menu.setAttribute('role', 'menu');
    menu.innerHTML = `<button type="button" role="menuitem" data-tree-mobile-action="settings">${icon.settings}<span>${escapeHtml(t('Tree Settings'))}</span></button>
        <button type="button" role="menuitem" data-tree-mobile-action="export">${icon.export}<span>${escapeHtml(t('Export'))}</span></button>
        <button type="button" role="menuitem" data-tree-mobile-action="print">${icon.print}<span>${escapeHtml(t('Print'))}</span></button>`;
    document.body.appendChild(menu);
    const rect = anchor.getBoundingClientRect();
    menu.style.top = `${rect.bottom + 6}px`;
    menu.style.left = `${Math.max(8, Math.min(rect.right - menu.offsetWidth, window.innerWidth - menu.offsetWidth - 8))}px`;
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

function renderFamilyTree()
{
    appNavigationObserve();
    closeTreeMobileMenu();
    disposeTreeSearch();
    sidebar.innerHTML = '';
    const treeProjectId =
        currentFamilyTreeProjectId();
    const treePeopleSource = currentTreePeople();
    const treeFamiliesSource = currentTreeFamilies();

    if (!treeProjectId || !treePeopleSource.length)
    {
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
    const focusPersonId = resolveTreeFocusPersonId(treePeopleSource, treeProjectId);
    const projection = buildFamilyTreeProjection(treePeopleSource, treeFamiliesSource, {
        focusPersonId,
        ancestorGenerations: treeViewState.ancestorGenerations,
        descendantGenerations: treeViewState.descendantGenerations,
        showCousins: treeViewState.showCousins
    });
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

    const treeLayout = calculateTreeLayout(
        projection.people,
        projection.families,
        projection.focusPersonId,
        { branchRoles: projection.branchRoles }
    );
    main.innerHTML = `
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

            --tree-placeholder-width:
              ${treeParentPlaceholderWidth(2)}px;

            --tree-placeholder-height:
              ${TREE_GEOMETRY.parentPlaceholderHeight}px;

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
                ${['Classic','Pedigree','Fan'].map((view, index) => `<button class="view-mode ${state.treeView === view ? 'active' : ''}" type="button" role="tab" aria-label="${escapeHtml(t(view))}" aria-selected="${state.treeView === view ? 'true' : 'false'}" ${view === 'Classic' ? '' : 'disabled'} data-tree-view="${view}" title="${escapeHtml(t(view === 'Classic' ? 'Classic view' : view + ' view will be added later.'))}">${[icon.tree, icon.pedigreeView, icon.fanView][index]}<span>${escapeHtml(t(view))}</span></button>`).join('')}
              </div>
            </div>
            <div class="tree-toolbar-right">
              <label class="tree-view-mobile">${icon.tree}<select aria-label="${escapeHtml(t('Tree view mode'))}"><option value="Classic">${escapeHtml(t('Classic'))}</option><option value="Pedigree" disabled>${escapeHtml(t('Pedigree'))}</option><option value="Fan" disabled>${escapeHtml(t('Fan'))}</option></select>${icon.chevron}</label>
              <span class="tree-people-status" role="status" aria-label="${escapeHtml(t('People in project'))}: ${escapeHtml(familyPeopleCountLabel)}" title="${escapeHtml(t('People in project'))}">${escapeHtml(familyPeopleCountLabel)}</span>
              <button class="tree-icon-button tree-display-settings" type="button" data-tree-settings aria-label="${escapeHtml(t('Tree display settings'))}" title="${escapeHtml(t('Tree display settings'))}">${icon.slidersHorizontal}</button>
            </div>
          </div>

            <section class="tree-canvas" aria-label="Family tree canvas">
              <div class="tree-stage-space" style="width:${treeLayout.stageWidth * state.treeZoom / 100}px;height:${treeLayout.stageHeight * state.treeZoom / 100}px;">
                <div class="tree-stage" style="width:${treeLayout.stageWidth}px;height:${treeLayout.stageHeight}px;transform: scale(${state.treeZoom / 100});">
                  ${renderTreeLines(treeLayout)}
                  ${treeLayout.parentPlaceholders.map(renderTreeParentPlaceholder).join('')}
                  ${treeLayout.positionedPeople.map(renderTreePersonCard).join('')}
                  ${treeLayout.focusControls.map(renderTreeFocusControl).join('')}
                </div>
              </div>
              <div class="tree-zoom">
                <button class="zoom-button" type="button" data-zoom="out" aria-label="Zoom out">${icon.zoomOut}</button>
                <div class="zoom-value">${state.treeZoom}%</div>
                <button class="zoom-button" type="button" data-zoom="in" aria-label="Zoom in">${icon.zoomIn}</button>
                <button class="zoom-button" type="button" data-zoom="fit" aria-label="Fit tree">${icon.home}</button>
                <button class="zoom-button" type="button" data-tree-fullscreen aria-label="${escapeHtml(t(treeFullscreenRuntime.requested ? 'Exit full screen' : 'Enter full screen'))}" title="${escapeHtml(t(treeFullscreenRuntime.requested ? 'Exit full screen' : 'Enter full screen'))}" aria-pressed="${treeFullscreenRuntime.requested ? 'true' : 'false'}">${treeFullscreenRuntime.requested ? icon.fullscreenExit : icon.expand}</button>
              </div>
            </section>
            ${renderPersonSidebar(selected.id, 'tree')}
          </div>
        </div>
      `;
    bindTreeCanvasPan();
    main.querySelector('.tree-canvas')?.addEventListener('click', event =>
    {
        if (event.target.closest('button, a, input, select, textarea, [contenteditable="true"]')
            || event.detail < 2 && !event.target.closest('.tree-person-card'))
        {
            treeCardLastClick = null;
            return;
        }
        const previous = treeCardLastClick;
        if (event.detail < 2 || !previous || previous.projectId !== currentFamilyTreeProjectId()
            || performance.now() - previous.time > 500
            || Math.hypot(event.clientX - previous.x, event.clientY - previous.y) > 6) return;
        // Selection rerenders the cards before the second click can reach its original target.
        event.preventDefault();
        event.stopImmediatePropagation();
        treeCardLastClick = null;
        setTreeFocusPerson(previous.personId);
    }, true);
    main.querySelector('.tree-canvas')?.addEventListener('wheel', queueTreeWheelZoom, { passive: false });
    main
        .querySelectorAll('.tree-person-card[data-person-id]')
        .forEach(card =>
        {
            const selectCard = () =>
            {
                navigateFamilyTreeToPerson(
                    card.dataset.personId,
                    {
                        focusBranch: false,
                        center: false
                    }
                );
            };

            card.addEventListener('click', event =>
            {
                if (event.target.closest('button, a, input, select, textarea, [contenteditable="true"]'))
                {
                    treeCardLastClick = null;
                    return;
                }
                const projectId = currentFamilyTreeProjectId();
                treeCardLastClick = event.detail > 0 ? {
                    projectId, personId: card.dataset.personId, time: performance.now(), x: event.clientX, y: event.clientY
                } : null;
                selectCard();
            });

            card.addEventListener('dblclick', event =>
            {
                if (event.target.closest('button, a, input, select, textarea, [contenteditable="true"]')) return;
                event.preventDefault();
                treeCardLastClick = null;
                setTreeFocusPerson(card.dataset.personId);
            });

            card.addEventListener('keydown', event =>
            {
                if (
                    event.target !== card ||
              !['Enter', ' '].includes(event.key)
                )
                {
                    return;
                }

                event.preventDefault();
                selectCard();
            });
        });
    main
        .querySelectorAll('[data-card-add]')
        .forEach(button =>
            button.addEventListener(
                'click',
                event =>
                {
                    event.stopPropagation();

                    const card =
                        button.closest(
                            '[data-person-id]'
                        );

                    const anchorPersonId =
                        card?.dataset.personId
                || state.selectedPersonId;

                    if (!anchorPersonId) return;

                    const currentFocusId = treeProjectViewState().focusPersonId;
                    if (currentFocusId !== anchorPersonId)
                    {
                        focusTreeBranchForRelative(anchorPersonId);
                        requestAnimationFrame(() =>
                        {
                            requestAnimationFrame(() =>
                            {
                                const refreshedButton = main.querySelector(
                                    `.tree-person-card[data-person-id="${CSS.escape(anchorPersonId)}"] [data-card-add="relative"]`
                                );
                                openRelativePopover(refreshedButton || button, anchorPersonId);
                            });
                        });
                        return;
                    }

                    state.selectedPersonId = anchorPersonId;

                    openRelativePopover(
                        button,
                        anchorPersonId
                    );
                }
            )
        );
    main.querySelectorAll('[data-card-edit]').forEach(button => button.addEventListener('click', e =>
    {
        e.stopPropagation();
        openEditPersonModal(button.dataset.cardEdit);
    }));
    main.querySelectorAll('[data-tree-card-focus]').forEach(button => button.addEventListener('click', event =>
    {
        event.stopPropagation();
        const personId = button.dataset.treeCardFocus;
        if (personId) setTreeFocusPerson(personId);
    }));
    main.querySelectorAll('[data-add-relative]').forEach(button => button.addEventListener('click', () =>
    {
        const target = personById(button.dataset.personId || state.selectedPersonId);
        if (target?.id) focusTreeBranchForRelative(target.id);
        openAddPersonModal(`Add ${button.dataset.addRelative}`, `Create a new person and add as ${target.name.split(' ')[0]}'s ${button.dataset.addRelative}`, { relativeType: button.dataset.addRelative, personId: target.id });
    }));
    main.querySelectorAll('[data-tree-view]').forEach(button => button.addEventListener('click', () =>
    {
        if (button.dataset.treeView !== 'Classic') return;
        state.treeView = 'Classic';
        renderFamilyTree();
    }));
    main.querySelectorAll('[data-zoom]').forEach(button => button.addEventListener('click', () =>
    {
        if (button.dataset.zoom === 'fit')
        {
            setTreeZoom(100);
            centerTreeOnPerson(treeProjectViewState().focusPersonId);
            return;
        }
        setTreeZoom(state.treeZoom + (button.dataset.zoom === 'in' ? 10 : -10));
    }));
    main.querySelector('[data-tree-fullscreen]')?.addEventListener('click', toggleTreeFullscreen);
    main.querySelector('[data-tree-person-picker]')?.addEventListener('click', event =>
    {
        event.stopPropagation();
        openTreePersonPicker(event.currentTarget);
    });
    main.querySelector('[data-tree-settings]')?.addEventListener('click', openTreeSettingsModal);
    bindPersonSidebar(main, 'tree');
    const centerTargetId =
        state.treeCenterTargetId;

    state.treeCenterTargetId = '';

    if (centerTargetId)
    {
        centerTreeOnPerson(centerTargetId);
    }
    else if (
        treeViewState.canvasScroll
    )
    {
        restoreTreeCanvasScroll(
            treeViewState.canvasScroll
        );
    }
    const canvas = main.querySelector('.tree-canvas');
    canvas?.addEventListener('scroll', () =>
    {
        treeFullscreenRuntime.center = treeFullscreenCenter();
    }, { passive: true });
    treeFullscreenRuntime.center = treeFullscreenCenter();
}

function treeLayoutNode(layout, id)
{
    return id ? layout?.peopleById?.[id] || null : null;
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

function buildTreeConnectorDescriptors(
    layout,
    { arrangeBands = false } = {}
)
{
    const descriptors = [];
    const drafts = [];
    const partnerKeys = new Set();
    const partnerGroups = [];

    function normalizePoints(points)
    {
        return (points || [])
            .map(point => ({
                x: Math.round(
                    Number(point.x)
                ),
                y: Math.round(
                    Number(point.y)
                )
            }))
            .filter(point =>
                Number.isFinite(point.x)
            && Number.isFinite(point.y)
            )
            .filter((point, index, list) =>
                !index
            || point.x
              !== list[index - 1].x
            || point.y
              !== list[index - 1].y
            );
    }

    function addDescriptor(descriptor)
    {
        const points =
            normalizePoints(
                descriptor.points
            );

        const d =
            treeConnectorPath(points);

        if (!d) return;

        const key =
            `${descriptor.familyId}|`
          + `${descriptor.role}|`
          + `${descriptor.childId || ''}|`
          + d;

        if (
            descriptors.some(item =>
                item.key === key
            )
        )
        {
            return;
        }

        descriptors.push({
            ...descriptor,
            points,
            d,
            key
        });
    }

    function addPartnerConnector(
        familyId,
        parentNodes
    )
    {
        if (
            parentNodes.length < 2
          || partnerKeys.has(familyId)
        )
        {
            return;
        }

        partnerKeys.add(familyId);
        partnerGroups.push({ familyId, parentNodes });
    }

    function renderPartnerConnector({ familyId, parentNodes })
    {
        const ordered =
            [...parentNodes]
                .sort((left, right) =>
                    left.leftX - right.leftX
                );

        const first = ordered[0];
        const last =
            ordered[ordered.length - 1];

        const partnerY = Math.round(
            (
                first.centerY
            + last.centerY
            ) / 2
        );

        addDescriptor({
            familyId,
            role: 'partner',
            className: 'tree-line partner',
            points: [
                {
                    x: first.rightX,
                    y: first.centerY
                },
                {
                    x: first.rightX,
                    y: partnerY
                },
                {
                    x: last.leftX,
                    y: partnerY
                },
                {
                    x: last.leftX,
                    y: last.centerY
                }
            ]
        });
    }

    function addDraft({
        familyId,
        role,
        parentNodes,
        children
    })
    {
        if (
            !parentNodes.length
          || !children.length
        )
        {
            return;
        }

        const orderedParents =
            [...parentNodes]
                .sort((left, right) =>
                    left.leftX - right.leftX
                );

        const orderedChildren =
            [...children]
                .sort((left, right) =>
                    left.centerX - right.centerX
                );

        addPartnerConnector(
            familyId,
            orderedParents
        );

        const firstParent =
            orderedParents[0];

        const lastParent =
            orderedParents[
                orderedParents.length - 1
            ];

        const sourceX =
            orderedParents.length > 1
                ? Math.round(
                    (
                        firstParent.rightX
                  + lastParent.leftX
                    ) / 2
                )
                : Math.round(
                    firstParent.centerX
                );

        const sourceY =
            orderedParents.length > 1
                ? Math.round(
                    (
                        firstParent.centerY
                  + lastParent.centerY
                    ) / 2
                )
                : Math.round(
                    firstParent.bottomY
                );

        const childCenters =
            orderedChildren.map(child =>
                Math.round(child.centerX)
            );

        drafts.push({
            familyId,
            role,
            parentNodes: orderedParents,
            children: orderedChildren,
            sourceX,
            sourceY,
            parentBottomY:
            Math.max(
                ...orderedParents.map(parent =>
                    parent.bottomY
                )
            ),
            childTopY:
            Math.min(
                ...orderedChildren.map(child =>
                    child.topY
                )
            ),
            childGeneration:
            Math.min(
                ...orderedChildren.map(child =>
                    Number(child.generation)
                )
            ),
            minX:
            Math.min(
                sourceX,
                ...childCenters
            ),
            maxX:
            Math.max(
                sourceX,
                ...childCenters
            ),
            laneIndex: 0,
            railY: 0
        });
    }

    const parentFamilyByChild = new Map();

    (layout.families || []).forEach(family =>
    {
        (family.children || []).forEach(childId =>
        {
            if (!parentFamilyByChild.has(childId))
            {
                parentFamilyByChild.set(childId, family);
            }
        });
    });

    (layout.families || []).forEach(family =>
    {
        const children = (family.children || [])
            .map(id => treeLayoutNode(layout, id))
            .filter(Boolean);

        const knownParents = [family.left, family.right]
            .map(id => treeLayoutNode(layout, id))
            .filter(Boolean);

        const placeholders = (family.children || []).flatMap(childId =>
            parentFamilyByChild.get(childId)?.id === family.id
                ? layout.parentPlaceholdersByPerson?.[childId] || []
                : []
        );

        const parentNodes = [
            ...new Map(
                [...knownParents, ...placeholders].map(node => [
                    node.id,
                    node
                ])
            ).values()
        ];

        if (!parentNodes.length) return;

        // Preserve the partner line even for a childless family.
        addPartnerConnector(family.id, parentNodes);

        if (!children.length) return;

        // Use the same family grouping as the horizontal layout.
        addDraft({
            familyId: family.id,
            role: placeholders.length
                ? 'placeholder-descendant'
                : 'descendant',
            parentNodes,
            children
        });
    });

    // Preserve Add parents controls when no saved parent family exists.
    Object.entries(
        layout.parentPlaceholdersByPerson || {}
    ).forEach(([personId, placeholders]) =>
    {
        if (parentFamilyByChild.has(personId)) return;

        const child = treeLayoutNode(layout, personId);
        if (!child || !placeholders.length) return;

        addDraft({
            familyId: `missing-parents:${personId}`,
            role: 'placeholder-descendant',
            parentNodes: placeholders,
            children: [child]
        });
    });

    /*
      * Allocate lanes per complete generation band. Placeholder
      * and normal families now compete for the same lanes.
      */
    const draftsByBand = new Map();

    drafts.forEach(draft =>
    {
        const bandKey =
            Number.isFinite(
                draft.childGeneration
            )
                ? `generation:${draft.childGeneration}`
                : `coordinates:`
              + `${draft.parentBottomY}:`
              + `${draft.childTopY}`;

        if (!draftsByBand.has(bandKey))
        {
            draftsByBand.set(
                bandKey,
                []
            );
        }

        draftsByBand
            .get(bandKey)
            .push(draft);
    });

    draftsByBand.forEach(group =>
    {
        group.sort((left, right) =>
            left.minX - right.minX
          || left.sourceX - right.sourceX
          || String(left.familyId)
              .localeCompare(
                  String(right.familyId)
              )
        );

        const predecessors = new Map(group.map(draft => [draft, new Set()]));
        const insideRail = (draft, x) => x >= draft.minX && x <= draft.maxX;
        group.forEach(rail => group.forEach(other =>
        {
            if (rail === other) return;
            // A trunk must finish above a rail it would cross; a child drop starts below it.
            if (insideRail(rail, other.sourceX)) predecessors.get(rail).add(other);
            if (other.children.some(child => insideRail(rail, child.centerX))) predecessors.get(other).add(rail);
        }));

        const pending = new Set(group);
        const assigned = new Set();
        const lanes = [];
        while (pending.size)
        {
            const draft = [...pending].find(item => [...predecessors.get(item)].every(parent => assigned.has(parent)))
            || [...pending][0];
            draft.laneConflict = [...predecessors.get(draft)].some(parent => !assigned.has(parent));
            let lane = Math.max(0, ...[...predecessors.get(draft)].filter(parent => assigned.has(parent)).map(parent => parent.laneIndex + 1));
            while ((lanes[lane] || []).some(other => draft.minX <= other.maxX + 8 && draft.maxX + 8 >= other.minX)) lane += 1;
            if (!lanes[lane]) lanes[lane] = [];
            lanes[lane].push(draft);
            draft.laneIndex = lane;
            assigned.add(draft);
            pending.delete(draft);
        }
        group.laneCount = Math.max(1, lanes.length);
    });

    const rows = new Map();
    [...(layout.positionedPeople || []), ...(layout.parentPlaceholders || [])].forEach(node =>
    {
        if (!rows.has(node.generation)) rows.set(node.generation, []);
        rows.get(node.generation).push(node);
    });
    if (arrangeBands && rows.size)
    {
        const generations = [...rows.keys()].sort((left, right) => left - right);
        let nextTop = Math.min(...rows.get(generations[0]).map(node => node.y));
        generations.forEach((generation, index) =>
        {
            const row = rows.get(generation);
            row.forEach(node =>
            {
                node.y = nextTop;
                node.topY = nextTop;
                node.bottomY = nextTop + (node.height || node.h);
                node.centerY = nextTop + (node.height || node.h) / 2;
                if (node.layoutY !== undefined) node.layoutY = nextTop;
            });
            const nextGeneration = generations[index + 1];
            const laneCount = draftsByBand.get(`generation:${nextGeneration}`)?.laneCount || 1;
            nextTop += Math.max(...row.map(node => node.height || node.h))
            + TREE_CONNECTOR_RAIL_OFFSET * 2
            + (laneCount - 1) * TREE_GEOMETRY.connectorLaneGap;
        });
        (layout.focusControls || []).forEach(control =>
        {
            const person = treeLayoutNode(layout, control.personId);
            if (person) control.y = person.topY - TREE_FOCUS_CONTROL_H - TREE_FOCUS_CONTROL_GAP;
        });
    }

    layout.connectorBands = [];
    draftsByBand.forEach(group =>
    {
        const generation = group[0].childGeneration;
        const parentRow = rows.get(generation - 1) || group.flatMap(draft => draft.parentNodes);
        const childRow = rows.get(generation) || group.flatMap(draft => draft.children);
        const parentBottomY = Math.max(...parentRow.map(node => node.bottomY));
        const childTopY = Math.min(...childRow.map(node => node.topY));
        group.forEach(draft =>
        {
            const first = draft.parentNodes[0];
            const last = draft.parentNodes[draft.parentNodes.length - 1];
            draft.sourceY = draft.parentNodes.length > 1
                ? Math.round((first.centerY + last.centerY) / 2)
                : Math.round(first.bottomY);
            draft.railY = parentBottomY + TREE_CONNECTOR_RAIL_OFFSET
            + draft.laneIndex * TREE_GEOMETRY.connectorLaneGap;
        });
        layout.connectorBands.push({
            generation, parentBottomY, childTopY, laneCount: group.laneCount,
            families: group.map(draft => ({
                familyId: draft.familyId, sourceX: draft.sourceX,
                childXs: draft.children.map(child => child.centerX),
                minX: draft.minX, maxX: draft.maxX,
                laneIndex: draft.laneIndex, railY: draft.railY, laneConflict: draft.laneConflict
            }))
        });
    });
    partnerGroups.forEach(renderPartnerConnector);

    drafts.forEach(draft =>
    {
        const directChild =
            draft.children.length === 1
                ? draft.children[0]
                : null;

        const hasDirectAlignment =
            directChild
          && Math.abs(
              Math.round(draft.sourceX)
            - Math.round(directChild.centerX)
          ) <= 1;

        if (hasDirectAlignment)
        {
            /*
          * Use one uninterrupted path. Do not split a direct
          * connection into trunk, zero-width rail and child drop.
          */
            addDescriptor({
                familyId:
              draft.familyId,

                role:
              `${draft.role}-direct`,

                childId:
              directChild.id,

                className:
              'tree-line descendant',

                points: [
                    {
                        x: draft.sourceX,
                        y: draft.sourceY
                    },
                    {
                        x: draft.sourceX,
                        y: directChild.topY
                    }
                ]
            });

            return;
        }
        addDescriptor({
            familyId: draft.familyId,
            role:
            `${draft.role}-trunk`,
            className:
            'tree-line descendant',
            points: [
                {
                    x: draft.sourceX,
                    y: draft.sourceY
                },
                {
                    x: draft.sourceX,
                    y: draft.railY
                }
            ]
        });

        addDescriptor({
            familyId: draft.familyId,
            role:
            `${draft.role}-rail`,
            className:
            'tree-line descendant',
            points: [
                {
                    x: draft.minX,
                    y: draft.railY
                },
                {
                    x: draft.maxX,
                    y: draft.railY
                }
            ]
        });

        draft.children.forEach(child =>
        {
            addDescriptor({
                familyId: draft.familyId,
                role:
              `${draft.role}-child`,
                childId: child.id,
                className:
              'tree-line descendant',
                points: [
                    {
                        x: child.centerX,
                        y: draft.railY
                    },
                    {
                        x: child.centerX,
                        y: child.topY
                    }
                ]
            });
        });
    });

    return descriptors.map(
        ({ key, ...descriptor }) =>
            descriptor
    );
}

function renderTreeLines(layout)
{
    const descriptors = layout.connectorDescriptors || buildTreeConnectorDescriptors(layout);
    const paths = descriptors.map(descriptor => `<path class="${descriptor.className}" data-tree-family-id="${escapeHtml(String(descriptor.familyId || ''))}" data-tree-connection-role="${escapeHtml(descriptor.role)}" ${descriptor.childId ? `data-tree-child-id="${escapeHtml(descriptor.childId)}"` : ''} d="${descriptor.d}"/>`);
    return `<svg class="tree-lines" viewBox="0 0 ${layout.stageWidth} ${layout.stageHeight}" width="${layout.stageWidth}" height="${layout.stageHeight}" aria-hidden="true">
        ${paths.join('\n        ')}
      </svg>`;
}

function renderTreeParentPlaceholder(placeholder)
{
    const target = personById(placeholder.personId);
    const displayLabel = translateText(placeholder.label);
    return `<button class="add-parent-card" type="button" style="left:${placeholder.x}px;top:${placeholder.y}px;--tree-placeholder-width:${placeholder.width}px;--tree-placeholder-height:${placeholder.height}px" data-person-id="${placeholder.personId}" data-add-relative="${placeholder.rel}" aria-label="${escapeHtml(placeholder.label)} for ${escapeHtml(target.name)}"><span><span class="add-plus">${icon.plus}</span><span class="add-label">${escapeHtml(displayLabel).replace(' ', '<br>')}</span></span></button>`;
}

function renderTreeFocusControl(control)
{
    const person = personById(control.personId);
    if (!person) return '';
    const localizedName = translateText(person.name);
    const accessibleLabel = state.language === 'ru'
        ? `Показать ветвь для ${localizedName}`
        : `Focus branch for ${localizedName}`;
    const visibleLabel = state.language === 'ru' ? 'Фокус' : 'Focus';
    return `<button class="tree-focus-control" type="button" style="left:${control.x}px;top:${control.y}px" data-tree-card-focus="${escapeHtml(person.id)}" data-i18n-skip aria-label="${escapeHtml(accessibleLabel)}">${icon.focus}<span>${visibleLabel}</span></button>`;
}

function renderTreePersonCard(
    person
)
{
    const selected =
        person.id
          === state.selectedPersonId;

    const focused =
        person.id
          === treeProjectViewState()
              .focusPersonId;

    const displayName =
        String(
            person.name
          || 'Unnamed person'
        );

    return `
        <article
          class="
            tree-person-card
            ${treePersonGenderClass(person)}
            ${selected ? 'selected' : ''}
            ${focused ? 'is-focus-person' : ''}
          "
          style="
            left:${person.layoutX}px;
            top:${person.layoutY}px;
          "
          data-person-id="${escapeHtml(person.id)}"
          tabindex="0"
          aria-label="${escapeHtml(displayName)}"
          ${
                focused
                    ? 'aria-current="true"'
                    : ''
            }>

          <div class="tree-card-avatar-stack">
            ${renderPersonAvatar(
                person,
                'tree-avatar'
            )}

            ${
                focused
                    ? `
                  <span class="tree-focus-badge">
                    ${icon.focus}
                    <span>Focus</span>
                  </span>
                `
                    : ''
            }
          </div>

          <div class="tree-card-content">
            <h3
              class="tree-name"
              title="${escapeHtml(displayName)}">

              ${escapeHtml(displayName)}
            </h3>

            ${renderTreeCardDateLines(
                person
            )}
          </div>

          <div class="card-actions">
            <button
              class="card-action"
              type="button"
              data-card-edit="${escapeHtml(person.id)}"
              aria-label="Edit ${escapeHtml(displayName)}">

              ${icon.edit}
            </button>

            <button
              class="card-action"
              type="button"
              data-card-add="relative"
              aria-label="Add relative">

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

function renderTreeCardDateLines(person)
{
    const lines = [];
    const status = normalizeLivingStatus(person.status);
    const birthDate = String(person.birth || '').trim();
    const deathDate = String(person.death || '').trim();

    if (birthDate)
    {
        lines.push(`<span>Born: ${escapeHtml(birthDate)}</span>`);
    }

    if (status === 'Deceased')
    {
        lines.push(
            deathDate
                ? `<span>Died: ${escapeHtml(deathDate)}</span>`
                : '<span>Deceased</span>'
        );
    }
    else if (status === 'Unknown')
    {
        lines.push('<span>Unknown</span>');
    }

    return lines.length
        ? `<div class="tree-dates">${lines.join('')}</div>`
        : '';
}
