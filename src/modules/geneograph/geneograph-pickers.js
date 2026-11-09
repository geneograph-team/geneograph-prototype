function cleanGeneographPlacePickerName(
    value
)
{
    return String(value || '')
        .replace(
            /[\r\n\u0000-\u001F\u007F]/g,
            ' '
        )
        .replace(
            /\s+/g,
            ' '
        )
        .trim()
        .slice(
            0,
            160
        );
}

function geneographPlacePickerMatchScore(
    place,
    query
)
{
    const normalizedQuery =
        normalizePlaceLookupText(query);

    if (!normalizedQuery)
    {
        return 1;
    }

    const candidates = [
        place.name,
        placePrimaryName(place),
        placeSecondaryName(place),
        placeCountry(place),
        ...placeAlternativeNames(place)
    ];

    for (const candidate of candidates)
    {
        if (!candidate) continue;

        const normalizedCandidate =
            normalizePlaceLookupText(
                candidate
            );

        if (
            normalizedCandidate.startsWith(
                normalizedQuery
            )
        )
        {
            return 3;
        }

        if (
            normalizedCandidate.includes(
                normalizedQuery
            )
        )
        {
            return 2;
        }
    }

    return 0;
}

function geneographPlacePickerViewModel(
    projectId,
    pickerState
)
{
    const query =
        cleanGeneographPlacePickerName(
            pickerState.query
        );

    const allPlaces =
        projectPlaces(projectId)
            .filter(place =>
                place &&
            !place.deleted
            );

    const exactPlace =
        query
            ? allPlaces.find(place =>
                normalizePlaceLookupText(
                    placeDisplayText(place)
                ) ===
              normalizePlaceLookupText(
                  query
              )
            ) || null
            : null;

    const matches =
        allPlaces
            .map(place => ({
                place,

                score:
              geneographPlacePickerMatchScore(
                  place,
                  query
              ),

                peopleCount:
              getPeopleForPlace(
                  place.id,
                  {
                      projectId
                  }
              ).length
            }))
            .filter(item =>
                item.score > 0
            )
            .sort(
                (left, right) =>
                    right.score - left.score
              || right.peopleCount
                - left.peopleCount
              || placeDisplayText(
                  left.place
              ).localeCompare(
                  placeDisplayText(
                      right.place
                  )
              )
            )
            .map(item =>
                item.place
            );

    return {
        query,
        allPlaces,
        matches,
        exactPlace,

        boardOnlyCandidate:
          query && !exactPlace
              ? query
              : ''
    };
}

function renderGeneographPlacePickerResults(
    model,
    pickerState
)
{
    return model.matches
        .map(place =>
        {
            const selected =
                pickerState.choice?.type
              === 'project'
            && pickerState.choice
                .placeId === place.id;

            const primary =
                placePrimaryName(place)
            || placeDisplayText(place)
            || 'Unnamed place';

            const context =
                placeSecondaryName(place)
            || t('Project place');

            return `
            <button
              class="
                rp-record geneo-place-picker-option
                ${selected ? 'selected' : ''}
              "
              type="button"
              data-geneo-place-picker-choice="project"
              data-geneo-place-picker-id="${escapeHtml(
                    place.id
                )}"
              aria-pressed="${
                    selected
                        ? 'true'
                        : 'false'
                }"
              aria-label="${escapeHtml(
                    `${t('Select')} ${primary}`
                )}"
              title="${escapeHtml(placeDisplayText(place))}">

              <span class="rp-record-icon" aria-hidden="true">${icon.mapPin}</span>
              <span
                class="rp-record-copy geneo-place-picker-option-copy">
                <strong>
                  ${escapeHtml(primary)}
                </strong>

                <span>
                  ${escapeHtml(context)}
                </span>
              </span>

              <span
                class="geneo-place-picker-check"
                data-geneo-place-picker-check
                aria-hidden="true"
                ${selected ? '' : 'hidden'}>
                ${icon.check}
              </span>
            </button>
          `;
        })
        .join('');
}

function renderGeneographBoardOnlyPlaceChoice(
    model,
    pickerState
)
{
    if (!model.boardOnlyCandidate)
    {
        return '';
    }

    const selected =
        pickerState.choice?.type
          === 'board'
        && normalizePlaceLookupText(
            pickerState.choice.name
        ) ===
          normalizePlaceLookupText(
              model.boardOnlyCandidate
          );

    return `
        <button
          class="
            rp-record geneo-place-board-choice
            ${selected ? 'selected' : ''}
          "
          type="button"
          data-geneo-place-picker-choice="board"
          data-geneo-board-place-name="${escapeHtml(
                model.boardOnlyCandidate
            )}"
          title="${escapeHtml(model.boardOnlyCandidate)}"
          aria-pressed="${
                selected
                    ? 'true'
                    : 'false'
            }">

          <span class="rp-record-icon" aria-hidden="true">${icon.mapPin}</span>
          <span
            class="rp-record-copy geneo-place-board-choice-copy">
            <strong>${escapeHtml(t('Use on this board only'))}</strong>

            <span class="geneo-place-board-choice-name">
              ${escapeHtml(model.boardOnlyCandidate)}
            </span>

            <span
              class="geneo-place-board-choice-meta">
              ${escapeHtml(t('Not added to Places'))}
            </span>
          </span>

          <span
            class="geneo-place-picker-check"
            data-geneo-place-picker-check
            aria-hidden="true"
            ${selected ? '' : 'hidden'}>
            ${icon.check}
          </span>
        </button>
      `;
}

function geneographPlacePickerPrimaryLabel(
    pickerState,
    editing
)
{
    if (
        pickerState.choice?.type
          === 'board'
    )
    {
        return editing
            ? 'Save board-only place'
            : 'Add board-only place';
    }

    return editing
        ? 'Save changes'
        : 'Add place';
}

function renderGeneographPlacePickerModal({
    editing,
    pickerState,
    model
})
{
    return `
        <div
          class="modal resource-picker geneo-place-modal"
          data-resource-picker="places"
          role="dialog"
          aria-modal="true"
          aria-labelledby="geneoPlaceModalTitle">

          <form
            class="geneo-place-picker-form"
            data-geneo-place-form
            novalidate>

            <div class="modal-header">
              <div>
                <h2 id="geneoPlaceModalTitle">
                  ${escapeHtml(t(editing ? 'Change place' : 'Add place'))}
                </h2>

                <p>
                  ${escapeHtml(t('Search project places or the map.'))}
                </p>
              </div>

              <button
                class="close-button"
                type="button"
                data-close
                aria-label="${escapeHtml(t('Close'))}">
                ${icon.close}
              </button>
            </div>

            <div class="rp-toolbar geneo-place-picker-toolbar">
              <label class="app-search-field rp-search geneo-place-picker-search" for="geneoPlacePickerSearch">
                ${icon.search}
                <input
                  id="geneoPlacePickerSearch"
                  type="search"
                  aria-label="${escapeHtml(t('Find a place'))}"
                  value="${escapeHtml(
                        pickerState.query
                    )}"
                  placeholder="${escapeHtml(t('Search project places or the map'))}"
                  autocomplete="off"
                  aria-controls="geneoPlacePickerOptions"
                  data-geneo-place-picker-search
                  autofocus>
              </label>
            </div>

            <nav class="rp-path" aria-label="${escapeHtml(t('Location'))}">
              <span class="rp-path-icon" aria-hidden="true">${icon.mapPin}</span>
              <span aria-current="page">${escapeHtml(t('All places'))}</span>
            </nav>

            <div class="modal-body rp-content geneo-place-picker-body">

              <div class="geneo-place-picker-options" id="geneoPlacePickerOptions" data-geneo-place-picker-options>
              <section
                class="geneo-place-picker-results-section"
                aria-labelledby="geneoPlacePickerResultsTitle"
                data-geneo-place-project-group
                ${model.matches.length ? '' : 'hidden'}>

                <div
                  class="geneo-place-picker-results-heading">
                  <h3 id="geneoPlacePickerResultsTitle">
                    ${escapeHtml(t('Project places'))}
                  </h3>

                </div>

                <div
                  class="geneo-place-picker-results"
                  data-geneo-place-picker-results
                  aria-label="${escapeHtml(t('Project place results'))}">
                  ${renderGeneographPlacePickerResults(
                        model,
                        pickerState
                    )}
                </div>
              </section>

              <section class="geneo-place-picker-results-section" aria-labelledby="geneoPlaceMapResultsTitle" data-geneo-place-map-group hidden>
                <div class="geneo-place-picker-results-heading">
                  <h3 id="geneoPlaceMapResultsTitle">${escapeHtml(t('Map results'))}</h3>
                  <span>${escapeHtml(t('Choosing a map result adds it to Places.'))}</span>
                </div>
                <div class="geneo-place-picker-results" data-geneo-place-map-results></div>
              </section>

              <div class="geneo-place-picker-status" data-geneo-place-picker-status role="status" aria-live="polite"></div>

              <div class="geneo-place-board-choice-host" data-geneo-place-board-choice-host ${model.boardOnlyCandidate ? '' : 'hidden'}>
                ${renderGeneographBoardOnlyPlaceChoice(model, pickerState)}
              </div>
              </div>

              <span
                class="
                  field-error
                  geneo-place-picker-error
                "
                id="geneoPlacePickerError"
                data-geneo-place-error
                role="alert"
                aria-live="polite">
              </span>
            </div>

            <div class="modal-footer">
              <span class="geneo-place-selection-summary" data-geneo-place-selection>
                ${escapeHtml(t('No place selected'))}
              </span>
              <div class="rp-footer-actions">
                <button
                  class="button secondary"
                  type="button"
                  data-close>
                  ${escapeHtml(t('Cancel'))}
                </button>

                <button
                  class="button primary"
                  type="submit"
                  data-geneo-place-picker-submit
                  ${pickerState.choice ? '' : 'disabled'}>
                  ${escapeHtml(t(
                      geneographPlacePickerPrimaryLabel(
                          pickerState,
                          editing
                      )
                  ))}
                </button>
              </div>
            </div>
          </form>
        </div>
      `;
}

function openGeneographPlaceModal(
    nodeId = ''
)
{
    const board =
        selectedGeneographBoard();

    const node =
        nodeId
            ? getGeneographNode(
                nodeId
            )
            : null;

    if (
        !board
        || (
            nodeId
          && node?.type !== 'place'
        )
    )
    {
        return;
    }

    const resolved =
        node
            ? resolveGeneographPlace(
                node,
                board
            )
            : null;

    const editing =
        Boolean(node);

    const initialBoardName =
        resolved && !resolved.linked
            ? cleanGeneographPlacePickerName(
                resolved.name
            )
            : '';

    const pickerState = {
        query:
          initialBoardName,

        choice:
          resolved?.linked
              ? {
                  type: 'project',
                  placeId:
                  resolved.place.id
              }
              : null
    };

    if (
        initialBoardName
        && !geneographPlacePickerViewModel(
            board.projectId,
            pickerState
        ).exactPlace
    )
    {
        pickerState.choice = {
            type: 'board',
            name: initialBoardName
        };
    }

    const initialModel =
        geneographPlacePickerViewModel(
            board.projectId,
            pickerState
        );

    openModal(
        renderGeneographPlacePickerModal({
            editing,
            pickerState,
            model: initialModel
        })
    );

    const form =
        modalBackdrop.querySelector(
            '[data-geneo-place-form]'
        );

    const searchInput =
        form?.querySelector(
            '[data-geneo-place-picker-search]'
        );

    const resultsHost =
        form?.querySelector(
            '[data-geneo-place-picker-results]'
        );

    const boardChoiceHost =
        form?.querySelector(
            '[data-geneo-place-board-choice-host]'
        );

    const mapHost = form?.querySelector('[data-geneo-place-map-results]');
    const projectGroup = form?.querySelector('[data-geneo-place-project-group]');
    const mapGroup = form?.querySelector('[data-geneo-place-map-group]');
    const statusHost = form?.querySelector('[data-geneo-place-picker-status]');
    const optionsHost = form?.querySelector('[data-geneo-place-picker-options]');
    let mapResults = [];
    let mapState = 'idle';
    let mapTimer = null;
    let mapController = null;

    const primaryButton =
        form?.querySelector(
            '[data-geneo-place-picker-submit]'
        );
    const selectionSummary = form?.querySelector('[data-geneo-place-selection]');

    const errorElement =
        form?.querySelector(
            '[data-geneo-place-error]'
        );

    if (
        !form
        || !searchInput
        || !resultsHost
        || !boardChoiceHost
        || !projectGroup
        || !mapGroup
        || !statusHost
        || !optionsHost
        || !primaryButton
    )
    {
        return;
    }

    const clearError = () =>
    {
        if (errorElement) errorElement.textContent = '';

        searchInput.removeAttribute(
            'aria-invalid'
        );
        searchInput.removeAttribute('aria-describedby');
    };

    const choiceIsSelected = (
        button
    ) =>
    {
        const type =
            button.dataset
                .geneoPlacePickerChoice;

        if (type === 'project')
        {
            return (
                pickerState.choice?.type
              === 'project'
            && pickerState.choice
                .placeId ===
                button.dataset
                    .geneoPlacePickerId
            );
        }

        if (type === 'board')
        {
            return (
                pickerState.choice?.type
              === 'board'
            && normalizePlaceLookupText(
                pickerState.choice.name
            ) ===
              normalizePlaceLookupText(
                  button.dataset
                      .geneoBoardPlaceName
              )
            );
        }

        if (type === 'map')
        {
            return pickerState.choice?.type === 'map'
                && pickerState.choice.name === mapResults[Number(button.dataset.geneoPlaceMapIndex)]?.name;
        }

        return false;
    };

    const updateChoiceUi = () =>
    {
        form
            .querySelectorAll(
                '[data-geneo-place-picker-choice]'
            )
            .forEach(button =>
            {
                const selected =
                    choiceIsSelected(
                        button
                    );

                button.classList.toggle(
                    'selected',
                    selected
                );

                button.setAttribute(
                    'aria-pressed',
                    selected
                        ? 'true'
                        : 'false'
                );

                const check =
                    button.querySelector(
                        '[data-geneo-place-picker-check]'
                    );

                if (check)
                {
                    check.hidden =
                        !selected;
                }
            });

        primaryButton.disabled =
            !pickerState.choice;

        primaryButton.textContent =
            t(geneographPlacePickerPrimaryLabel(
                pickerState,
                editing
            ));

        const choice = pickerState.choice;
        const place = choice?.type === 'project' ? getPlace(choice.placeId) : null;
        const name = choice?.type === 'project' && place ? placePrimaryName(place) || placeDisplayText(place)
            : choice?.name;
        if (selectionSummary)
        {
            selectionSummary.textContent = name
                ? `${t('Selected place')}: ${name}`
                : t('No place selected');
            selectionSummary.title = name || '';
        }
    };

    const renderStatus = model =>
    {
        let message = '';
        if (!model.matches.length && mapGroup.hidden)
        {
            if (!model.query)
                message = 'No project places yet. Search for a place to add it to this board.';
            else if (mapState === 'empty')
                message = 'No matching places found.';
            else if (mapState === 'idle')
                message = t('Type at least {count} characters to search the map.')
                    .replace('{count}', String(PLACE_EDITOR_GEOCODER_MIN_LENGTH));
        }
        statusHost.textContent = message ? t(message) : '';
        statusHost.hidden = !message;
    };

    const refreshResults = () =>
    {
        const model =
            geneographPlacePickerViewModel(
                board.projectId,
                pickerState
            );

        resultsHost.innerHTML =
            renderGeneographPlacePickerResults(
                model,
                pickerState
            );
        projectGroup.hidden = !model.matches.length;

        boardChoiceHost.innerHTML =
            renderGeneographBoardOnlyPlaceChoice(
                model,
                pickerState
            );
        boardChoiceHost.hidden = !model.boardOnlyCandidate;

        renderStatus(model);
        updateChoiceUi();
    };

    const renderMapResults = () =>
    {
        if (!mapHost) return;
        mapGroup.hidden = !(['loading', 'unavailable', 'ready', 'empty'].includes(mapState) &&
            (mapState !== 'ready' || mapResults.length));
        mapHost.innerHTML = mapState === 'loading'
            ? `<div class="place-combobox-status">${escapeHtml(t('Searching map results...'))}</div>`
            : mapState === 'unavailable'
                ? `<div class="place-combobox-status">${escapeHtml(t('Map search is unavailable. You can retry or use the entered text.'))} <button type="button" data-geneo-place-map-retry>${escapeHtml(t('Retry'))}</button></div>`
                : mapState === 'empty'
                    ? `<div class="place-combobox-status">${escapeHtml(t('No matching map results. You can still use the entered text.'))}</div>`
                    : mapResults.map((result, index) => `<button class="rp-record geneo-place-picker-option" type="button" data-geneo-place-picker-choice="map" data-geneo-place-map-index="${index}" aria-pressed="false" aria-label="${escapeHtml(`${t('Select')} ${result.name}`)}" title="${escapeHtml(result.name)}"><span class="rp-record-icon" aria-hidden="true">${icon.mapPin}</span><span class="rp-record-copy geneo-place-picker-option-copy"><strong>${escapeHtml(result.primary)}</strong><span>${escapeHtml(result.context || result.name)}</span></span><span class="geneo-place-picker-check" data-geneo-place-picker-check aria-hidden="true" hidden>${icon.check}</span></button>`).join('');
        mapHost.insertAdjacentHTML('beforeend', geneographGeocoder.attributionHtml());
        renderStatus(geneographPlacePickerViewModel(board.projectId, pickerState));
        updateChoiceUi();
    };

    const scheduleMapSearch = (immediate = false) =>
    {
        clearTimeout(mapTimer);
        mapController?.abort();
        const query = searchInput.value.trim();
        mapResults = [];
        if (query && findExactPlaceMatch(query, board.projectId))
        {
            mapState = 'idle';
            renderMapResults();
            return;
        }
        if (query.length < PLACE_EDITOR_GEOCODER_MIN_LENGTH)
        {
            mapState = 'idle';
            renderMapResults();
            return;
        }
        mapState = 'loading';
        renderMapResults();
        mapTimer = setTimeout(async () =>
        {
            const controller = new AbortController();
            mapController = controller;
            try
            {
                const results = await searchSharedPlaceMapResults(query, controller.signal);
                if (controller.signal.aborted || !form.isConnected || searchInput.value.trim() !== query) return;
                mapResults = results;
                mapState = results.length ? 'ready' : 'empty';
            }
            catch (error)
            {
                if (controller.signal.aborted || !form.isConnected || searchInput.value.trim() !== query) return;
                mapState = 'unavailable';
            }
            renderMapResults();
        }, immediate ? 0 : PLACE_EDITOR_GEOCODER_DEBOUNCE_MS);
    };

    searchInput.addEventListener(
        'input',
        () =>
        {
            pickerState.query =
                searchInput.value;

            /*
          * Typing changes the candidate but does not implicitly
          * select either a Project place or a board-only place.
          */
            pickerState.choice =
                null;

            clearError();
            refreshResults();
            scheduleMapSearch();
        }
    );

    searchInput.addEventListener('keydown', event =>
    {
        if (event.key !== 'ArrowDown') return;
        const first = [...optionsHost.querySelectorAll('[data-geneo-place-picker-choice]')]
            .find(button => button.getClientRects().length);
        if (!first) return;
        event.preventDefault();
        first.focus();
    });

    renderMapResults();
    if (searchInput.value.trim()) scheduleMapSearch();
    requestAnimationFrame(() =>
    {
        optionsHost.querySelector('[data-geneo-place-picker-choice].selected')
            ?.scrollIntoView({ block: 'nearest' });
    });

    form.addEventListener('click', event =>
    {
        if (event.target.closest('[data-geneo-place-map-retry]')) scheduleMapSearch(true);
    });

    form.addEventListener(
        'click',
        event =>
        {
            const choiceButton =
                event.target.closest(
                    '[data-geneo-place-picker-choice]'
                );

            if (
                !choiceButton
            || !form.contains(
                choiceButton
            )
            )
            {
                return;
            }

            const choiceType =
                choiceButton.dataset
                    .geneoPlacePickerChoice;

            if (
                choiceType === 'project'
            )
            {
                const place =
                    getPlace(
                        choiceButton.dataset
                            .geneoPlacePickerId
                    );

                if (
                    !place
              || place.deleted
              || place.projectId
                !== board.projectId
                )
                {
                    pickerState.choice = null;
                    refreshResults();
                    scheduleMapSearch();
                    errorElement.textContent = t('This place is no longer available. Choose another place.');
                    searchInput.setAttribute('aria-describedby', 'geneoPlacePickerError');
                    return;
                }

                pickerState.choice = {
                    type: 'project',
                    placeId: place.id
                };
            }
            else if (
                choiceType === 'board'
            )
            {
                const name =
                    cleanGeneographPlacePickerName(
                        choiceButton.dataset
                            .geneoBoardPlaceName
                    );

                if (!name) return;

                pickerState.choice = {
                    type: 'board',
                    name
                };
            }
            else if (choiceType === 'map')
            {
                const result = mapResults[Number(choiceButton.dataset.geneoPlaceMapIndex)];
                if (!result) return;
                pickerState.choice = { type: 'map', name: result.name, coordinates: result.coordinates };
            }
            else
            {
                return;
            }

            clearError();

            /*
          * Do not rerender the result buttons after selection.
          * Updating their state in place preserves keyboard focus.
          */
            updateChoiceUi();
        }
    );

    form.addEventListener(
        'submit',
        event =>
        {
            event.preventDefault();

            let nextRef = null;
            let createdPlace = null;
            let staleProjectPlace = false;

            if (
                pickerState.choice?.type
              === 'project'
            )
            {
                const projectPlace =
                    getPlace(
                        pickerState.choice
                            .placeId
                    );

                const validProjectPlace =
                    projectPlace
              && !projectPlace.deleted
              && projectPlace.projectId
                === board.projectId;

                if (validProjectPlace)
                {
                    nextRef = {
                        scope: 'project',
                        id: projectPlace.id,
                        fallbackName:
                  String(
                      placePrimaryName(
                          projectPlace
                      )
                    || projectPlace.name
                    || ''
                  )
                      .trim()
                      .slice(
                          0,
                          160
                      )
                    };
                }
                else staleProjectPlace = true;
            }
            else if (
                pickerState.choice?.type
              === 'board'
            )
            {
                const boardOnlyName =
                    cleanGeneographPlacePickerName(
                        pickerState.choice.name
                    );

                if (boardOnlyName)
                {
                    nextRef = {
                        scope: 'board',
                        name: boardOnlyName
                    };
                }
            }

            else if (pickerState.choice?.type === 'map')
            {
                const resolvedPlace = resolvePlaceInputValue(
                    pickerState.choice.name,
                    '',
                    '',
                    { projectId: board.projectId, coordinates: pickerState.choice.coordinates }
                );
                const place = getPlace(resolvedPlace.placeId);
                if (resolvedPlace.created) createdPlace = place;
                if (place && place.projectId === board.projectId)
                {
                    nextRef = { scope: 'project', id: place.id, fallbackName: placePrimaryName(place) || place.name };
                }
            }

            if (!nextRef)
            {
                if (createdPlace)
                {
                    const index = sampleData.places.indexOf(createdPlace);
                    if (index >= 0) sampleData.places.splice(index, 1);
                }
                if (staleProjectPlace)
                {
                    pickerState.choice = null;
                    refreshResults();
                    scheduleMapSearch();
                }
                if (errorElement) errorElement.textContent = t(staleProjectPlace
                    ? 'This place is no longer available. Choose another place.'
                    : 'Choose a place from the results or use the entered name on this board.');

                searchInput.setAttribute(
                    'aria-invalid',
                    'true'
                );
                searchInput.setAttribute('aria-describedby', 'geneoPlacePickerError');

                searchInput.focus({
                    preventScroll: true
                });

                return;
            }

            geneoPushHistory();

            const target =
                node
            || createGeneographPlaceNode(
                nextRef
            );

            if (!target)
            {
                if (createdPlace)
                {
                    const index = sampleData.places.indexOf(createdPlace);
                    if (index >= 0) sampleData.places.splice(index, 1);
                }
                geneoHistoryRuntime
                    .undo
                    .pop();

                return;
            }

            if (node)
            {
                target.placeRef =
                    nextRef;
            }

            touchGeneographBoard();
            closeModal();

            renderGeneographEditorPreserveScroll({
                preserveInspectorScroll: editing
            });

            requestAnimationFrame(() =>
            {
                main
                    .querySelector(
                        `[data-geneo-node="${CSS.escape(target.id)}"]`
                    )
                    ?.focus({ preventScroll: true });
            });

            showToast(
                editing
                    ? 'Place object updated.'
                    : 'Place added to board.'
            );
        }
    );

    requestAnimationFrame(
        () =>
        {
            searchInput.focus({
                preventScroll: true
            });

            const cursorPosition =
                searchInput.value.length;

            searchInput.setSelectionRange(
                cursorPosition,
                cursorPosition
            );
        }
    );
}

function makeGeneographPlaceBoardOnly(nodeId)
{
    const node = getGeneographNode(nodeId);
    if (node?.type !== 'place') return;
    const name = resolveGeneographPlace(node).name;
    geneoPushHistory();
    node.placeRef = { scope: 'board', name };
    touchGeneographBoard();
    renderGeneographEditorPreserveScroll({ preserveInspectorScroll: true });
    showToast('Place is now board-only.');
}

function openGeneographPlaceInPlaces(nodeId)
{
    const node = getGeneographNode(nodeId);
    const resolved = node?.type === 'place' ? resolveGeneographPlace(node) : null;
    if (!resolved?.linked) return;
    captureGeneographViewport();
    state.activeModule = 'Places';
    state.placesView = 'list';
    state.selectedPlaceId = resolved.place.id;
    render();
}

function createGeneographRichTextNodeAtPoint(
    type,
    point
)
{
    const diagram =
        selectedGeneographDiagram();

    if (
        !diagram
        || !point
        || ![
            'sticky',
            'text'
        ].includes(type)
    )
    {
        return null;
    }

    const defaults =
        geneoNodeDefaults(type);

    /*
       * The click represents the visual center
       * of the new object.
       */
    const position =
        snapGeneographPoint({
            x:
            point.x
            - defaults.width / 2,

            y:
            point.y
            - defaults.height / 2
        });

    const text =
        type === 'text'
            ? 'New text'
            : '';

    const textDelta =
        type === 'text'
            ? {
                ops: [
                    {
                        insert:
                    'New text'
                    },

                    {
                        insert: '\n',

                        attributes: {
                            header: 2
                        }
                    }
                ]
            }
            : null;

    geneoPushHistory();

    const node = {
        id:
          createRuntimeId(
              'geneo-node'
          ),

        type,

        text,
        textDelta,

        textFormat:
          textDelta
              ? 'quill-delta-v1'
              : '',

        x: position.x,
        y: position.y,

        width:
          defaults.width,

        height:
          defaults.height,

        parentPanelId: null,

        order:
          Math.max(
              0,
              ...diagram.nodes.map(
                  item =>
                      item.order || 0
              )
          ) + 1,

        visible: true,
        locked: false,

        appearance:
          structuredClone(
              defaults.appearance
          )
    };

    diagram.nodes.push(node);

    node.parentPanelId =
        geneoContainingPanelForNode(
            node
        )?.id || null;

    selectGeneographNode(
        node.id
    );

    touchGeneographBoard();

    /*
       * Placement is one-shot. Return to the
       * movement mode that was active before
       * Text/Sticky placement was armed.
       */
    finishGeneographPlacementTool();

    beginGeneographInlineEdit(
        node.id,
        {
            selectAll:
            type === 'text',

            surface:
            'canvas'
        }
    );

    return node;
}

function clearGeneographConnectionClick()
{
    geneoCanvasRuntime.connectionClick = null;
}

function handleGeneographConnectionClick(event)
{
    event.stopPropagation();
    const path = event.currentTarget;
    const connectionId = path?.dataset.geneoConnection || '';
    const modified = event.shiftKey || event.ctrlKey || event.metaKey;
    if (!connectionId || geneoCanvasRuntime.suppressNodeClick)
    {
        clearGeneographConnectionClick();
        return;
    }
    const segmentValue = path.matches('.geneo-segment-hit') ? Number(path.dataset.geneoSegment) : null;
    const segmentIndex = Number.isInteger(segmentValue) ? segmentValue : null;
    const previous = geneoCanvasRuntime.connectionClick;
    const now = performance.now();
    const distance = previous ? Math.hypot(event.clientX - previous.clientX, event.clientY - previous.clientY) : Infinity;
    const isDoubleClick = !modified
        && previous?.connectionId === connectionId
        && now - previous.at <= 450
        && distance <= 7;
    if (isDoubleClick)
    {
        event.preventDefault();
        const requestedSegment = Number.isInteger(segmentIndex) ? segmentIndex : previous.segmentIndex;
        const point = geneoPointerToCanvas(event);
        clearGeneographConnectionClick();
        insertGeneographWaypoint(connectionId, point, Number.isInteger(requestedSegment) ? requestedSegment : null);
        return;
    }
    geneoCanvasRuntime.connectionClick = modified ? null : {
        connectionId,
        segmentIndex,
        clientX: event.clientX,
        clientY: event.clientY,
        at: now
    };
    selectGeneographConnection(connectionId, null, { toggle: modified });
    renderGeneographEditorPreserveScroll();
}

function handleGeneographFamilyBusSelection(event)
{
    if (event.type === 'keydown' && ['ArrowUp', 'ArrowDown'].includes(event.key)
        && event.currentTarget.hasAttribute('data-geneo-family-bus-rail'))
    {
        event.preventDefault();
        event.stopPropagation();
        const ids = (event.currentTarget.dataset.geneoFamilyBus || '').split(',');
        const bus = geneoFamilyChildBusGroups().buses.find(item =>
            item.connectionIds.join(',') === ids.join(','));
        if (!bus) return;
        const step = selectedGeneographDiagram().canvas.snapToGrid ? GENEO_GRID_SIZE : 10;
        const nextY = geneoClampFamilyBusRailY(bus, bus.railY
            + (event.key === 'ArrowDown' ? step : -step));
        if (nextY === bus.railY) return;
        geneoPushHistory();
        geneoSetFamilyBusRailY(bus, nextY);
        setGeneographSelection([], ids, { connectionId: ids.at(-1) });
        touchGeneographBoard();
        renderGeneographEditorPreserveScroll();
        main.querySelector(`[data-geneo-family-bus-rail][data-geneo-family-bus="${CSS.escape(ids.join(','))}"]`)
            ?.focus({ preventScroll: true });
        return;
    }
    if (event.type === 'keydown' && !['Enter', ' '].includes(event.key)) return;
    event.preventDefault();
    event.stopPropagation();
    const ids = (event.currentTarget.dataset.geneoFamilyBus || '').split(',')
        .filter(id => Boolean(getGeneographConnection(id)));
    if (!ids.length) return;
    const modified = event.shiftKey || event.ctrlKey || event.metaKey;
    if (modified)
    {
        const selected = geneoSelectedConnectionIdSet();
        const remove = ids.every(id => selected.has(id));
        ids.forEach(id => remove ? selected.delete(id) : selected.add(id));
        setGeneographSelection([...geneoSelectedNodeIdSet()], [...selected],
            { connectionId: selected.has(ids.at(-1)) ? ids.at(-1) : [...selected].at(-1) });
    }
    else setGeneographSelection([], ids, { connectionId: ids.at(-1) });
    renderGeneographEditorPreserveScroll();
    if (event.type === 'keydown')
        main.querySelector(`${event.currentTarget.hasAttribute('data-geneo-family-bus-rail')
            ? '[data-geneo-family-bus-rail]' : ''}[data-geneo-family-bus="${CSS.escape(ids.join(','))}"]`)
            ?.focus({ preventScroll: true });
}

function geneoClampFamilyBusRailY(bus, value)
{
    let minimum = bus.lowerBound;
    let maximum = bus.upperBound;
    if (selectedGeneographDiagram()?.canvas.snapToGrid)
    {
        minimum = Math.ceil(minimum / GENEO_GRID_SIZE) * GENEO_GRID_SIZE;
        maximum = Math.floor(maximum / GENEO_GRID_SIZE) * GENEO_GRID_SIZE;
    }
    return Math.max(minimum, Math.min(maximum,
        selectedGeneographDiagram()?.canvas.snapToGrid
            ? snapGeneographCoordinate(value) : Math.round(value)));
}

function geneoSetFamilyBusRailY(bus, value)
{
    bus.connectionIds.forEach(id =>
    {
        const connection = getGeneographConnection(id);
        if (connection?.route?.mode === 'auto') connection.route.railY = value;
    });
}

function startGeneographFamilyBusRailDrag(event)
{
    if (geneoPointerState || event.isPrimary === false || event.button !== 0
        || !['select', 'pan'].includes(geneoEffectiveCanvasTool())
        || event.shiftKey || event.ctrlKey || event.metaKey) return;
    const ids = (event.currentTarget.dataset.geneoFamilyBus || '').split(',');
    const bus = geneoFamilyChildBusGroups().buses.find(item =>
        item.connectionIds.join(',') === ids.join(','));
    if (!bus) return;
    geneoPushHistory();
    setGeneographSelection([], ids, { connectionId: ids.at(-1) });
    geneoPointerState = {
        kind: 'family-bus-rail', pointerId: event.pointerId,
        connectionIds: ids, start: geneoPointerToCanvas(event),
        railY: bus.railY, lowerBound: bus.lowerBound, upperBound: bus.upperBound,
        moved: false
    };
    event.preventDefault();
    event.stopPropagation();
}

function geneoRelativeDefaultGender(type, anchorNodeId = '')
{
    if (['parent', 'child', 'sibling'].includes(type)) return 'unknown';
    if (type === 'partner')
    {
        const anchorNode = getGeneographNode(anchorNodeId);
        const gender = getGeneographPerson(anchorNode?.personId)?.gender;
        return gender === 'male' ? 'female' : gender === 'female' ? 'male' : 'unknown';
    }
    if (
        ['father', 'son', 'brother']
            .includes(type)
    )
    {
        return 'male';
    }

    if (
        ['mother', 'daughter', 'sister']
            .includes(type)
    )
    {
        return 'female';
    }

    return 'male';
}

function geneoRelativeLabel(type)
{
    const labels = {
        father: 'father',
        mother: 'mother',
        parent: 'parent',
        partner: 'partner',
        son: 'son',
        daughter: 'daughter',
        child: 'child',
        brother: 'brother',
        sister: 'sister',
        sibling: 'sibling'
    };

    return labels[type] || 'relative';
}

function geneoRelativeCategory(type)
{
    if (
        ['father', 'mother', 'parent']
            .includes(type)
    )
    {
        return 'parent';
    }

    if (
        ['son', 'daughter', 'child']
            .includes(type)
    )
    {
        return 'child';
    }

    if (
        ['brother', 'sister', 'sibling']
            .includes(type)
    )
    {
        return 'sibling';
    }

    return 'partner';
}

function geneoFirstParentForAddedParent(childNode, newParentPersonId = null)
{
    const diagram = selectedGeneographDiagram();
    if (!diagram || childNode?.type !== 'person') return null;
    const parentFamilies = diagram.families.filter(family =>
        family.partnerIds.length && family.children.some(child => child.personId === childNode.personId));
    const parentIds = new Set(parentFamilies.flatMap(family => family.partnerIds));
    if (parentIds.size !== 1 || parentIds.has(newParentPersonId)) return null;
    const family = parentFamilies.find(item => item.partnerIds.length === 1);
    if (!family) return null;
    const connection = diagram.connections.find(item => item.kind === 'family-child'
        && item.familyId === family.id && item.target?.nodeId === childNode.id);
    const parentNode = diagram.nodes.find(node => node.id === connection?.source?.nodeId
        && node.type === 'person' && node.personId === family.partnerIds[0])
        || diagram.nodes.find(node => node.type === 'person'
            && node.personId === family.partnerIds[0]);
    return connection && parentNode ? { family, connection, parentNode } : null;
}

function geneoRelativeNodePlacement(
    anchorNode,
    relativeType,
    width,
    height
)
{
    const diagram =
        selectedGeneographDiagram();

    const category =
        geneoRelativeCategory(
            relativeType
        );

    const horizontalGap = 110;
    const verticalGap = 130;

    const centerX =
        anchorNode.x
        + anchorNode.width / 2
        - width / 2;

    const centerY =
        anchorNode.y
        + anchorNode.height / 2
        - height / 2;

    const candidates = [];

    if (category === 'parent')
    {
        const firstParent = geneoFirstParentForAddedParent(anchorNode)?.parentNode;
        if (firstParent)
        {
            for (const offset of [0, -1, 1])
            {
                const y = firstParent.y + offset * (height + verticalGap);
                candidates.push(
                    { x: firstParent.x + firstParent.width + horizontalGap, y },
                    { x: firstParent.x - width - horizontalGap, y }
                );
            }
        }
    }

    for (let step = 1; step <= 6; step += 1)
    {
        if (category === 'parent')
        {
            const y =
                anchorNode.y
            - height
            - verticalGap * step;

            [0, -1, 1].forEach(column =>
            {
                candidates.push({
                    x:
                centerX
                + column
                  * (width + horizontalGap),
                    y
                });
            });
        }
        else if (category === 'child')
        {
            const y =
                anchorNode.y
            + anchorNode.height
            + verticalGap * step;

            [0, -1, 1].forEach(column =>
            {
                candidates.push({
                    x:
                centerX
                + column
                  * (width + horizontalGap),
                    y
                });
            });
        }
        else
        {
            const distance =
                step
            * (width + horizontalGap);

            candidates.push(
                {
                    x:
                anchorNode.x
                + anchorNode.width
                + horizontalGap
                + (step - 1)
                  * (width + horizontalGap),
                    y: centerY
                },
                {
                    x:
                anchorNode.x
                - width
                - horizontalGap
                - (step - 1)
                  * (width + horizontalGap),
                    y: centerY
                },
                {
                    x:
                anchorNode.x
                + anchorNode.width
                + horizontalGap,
                    y:
                centerY
                + distance
                },
                {
                    x:
                anchorNode.x
                - width
                - horizontalGap,
                    y:
                centerY
                + distance
                }
            );
        }
    }

    const parentPanel =
        getGeneographNode(
            anchorNode.parentPanelId
        );

    const nodes =
        diagram.nodes.filter(node =>
            node.id !== parentPanel?.id
        );

    const overlaps = position =>
        nodes.some(node =>
            position.x
            < node.x + node.width + 18
          && position.x + width + 18
            > node.x
          && position.y
            < node.y + node.height + 18
          && position.y + height + 18
            > node.y
        );

    const insideParent = position =>
        Boolean(
            parentPanel?.type === 'panel'
          && position.x >= parentPanel.x + 16
          && position.y >= parentPanel.y + 16
          && position.x + width
            <= parentPanel.x
              + parentPanel.width
              - 16
          && position.y + height
            <= parentPanel.y
              + parentPanel.height
              - 16
        );

    const snappedCandidates =
        candidates.map(position =>
            snapGeneographPoint(position)
        );

    let position = parentPanel
        ? snappedCandidates.find(candidate =>
            insideParent(candidate)
            && !overlaps(candidate)
        )
        : null;

    position =
        position
        || snappedCandidates.find(candidate =>
            !overlaps(candidate)
        )
        || nextGeneoObjectPosition(
            width,
            height
        );

    return {
        ...position,
        parentPanelId:
          parentPanel
          && insideParent(position)
              ? parentPanel.id
              : geneoContainingPanelForNode({
                  id: '',
                  type: 'person',
                  ...position,
                  width,
                  height,
                  visible: true
              })?.id || null
    };
}

function geneoRelativeFamilyChoices(relative)
{
    const diagram = selectedGeneographDiagram();
    const anchor = getGeneographNode(relative?.anchorNodeId);
    if (!anchor) return [];
    const category = geneoRelativeCategory(relative.type);
    let families = diagram.families.filter(family => family.partnerIds.length && (category === 'child'
        ? family.partnerIds.includes(anchor.personId)
        : family.children.some(child => child.personId === anchor.personId)));
    const attachAnchor = category === 'sibling' && !families.length && Boolean(relative.existingPersonId);
    if (attachAnchor) families = diagram.families.filter(family => family.partnerIds.length
        && family.children.some(child => child.personId === relative.existingPersonId));
    const choices = [];
    families.forEach(family =>
    {
        const parents = family.partnerIds.filter(id => getGeneographPerson(id));
        if (parents.length > 1) choices.push({ value: `family:${family.id}`, familyId: family.id, parentIds: parents });
        parents.forEach(id =>
        {
            if (category === 'child' && id !== anchor.personId) return;
            if (!choices.some(choice => choice.parentIds.length === 1 && choice.parentIds[0] === id))
                choices.push({ value: `parent:${id}`, parentIds: [id], familyId: parents.length === 1 ? family.id : '' });
        });
    });
    if (category === 'child' && !choices.some(choice => choice.parentIds.length === 1 && choice.parentIds[0] === anchor.personId))
        choices.push({ value: `parent:${anchor.personId}`, parentIds: [anchor.personId], familyId: '' });
    if (category === 'sibling' && !families.length)
        choices.push({ value: 'unknown-father', parentIds: [], familyId: '' });
    if (attachAnchor && families.length) choices.forEach(choice => choice.attachAnchor = true);
    return choices;
}

function geneoRelativeFamilyDefault(relative)
{
    if (relative?.familySelection) return relative.familySelection;
    const choices = geneoRelativeFamilyChoices(relative);
    const couples = choices.filter(choice => choice.parentIds.length === 2);
    return couples.length === 1 ? couples[0].value : couples.length > 1 ? ''
        : choices.length === 1 ? choices[0].value : '';
}

function renderGeneoRelativeConfiguration(relative)
{
    if (!relative) return '';
    const category = geneoRelativeCategory(relative.type);
    if (category === 'partner')
    {
        return `<section class="add-person-family-connection geneo-relative-partner" data-geneo-relative-config>
          <h3 class="form-section-title">${escapeHtml(t('Relationship details'))}</h3>
          <div class="field add-person-select-field"><label for="geneoRelativePartnerType">${escapeHtml(t('Relationship type'))}</label>
            <select id="geneoRelativePartnerType" class="compact-select add-person-select">${addPersonRelationshipTypeOptions('Married')}</select><span class="add-person-select-chevron" aria-hidden="true">${icon.chevron}</span></div>
          <div data-geneo-partner-dates>${renderPartnerRelationshipDateFields({ prefix: 'geneoRelativePartner', relationshipType: 'Married' })}</div>
          <div class="field add-person-select-field" data-geneo-relative-marriage><label for="geneoRelativeMarriageType">${escapeHtml(t('Marriage type'))}</label><select id="geneoRelativeMarriageType" class="compact-select add-person-select">${addPersonMarriageTypeOptions('Civil')}</select><span class="add-person-select-chevron" aria-hidden="true">${icon.chevron}</span></div>
          <div class="field add-person-select-field"><label for="geneoRelativeChildren">${escapeHtml(t('Children'))}</label><select id="geneoRelativeChildren" class="compact-select add-person-select"><option value="none">${escapeHtml(t('Keep existing parent links'))}</option><option value="add">${escapeHtml(t('Add this partner as a parent to existing children'))}</option></select><span class="add-person-select-chevron" aria-hidden="true">${icon.chevron}</span></div>
          <p class="form-error" data-geneo-relative-error hidden></p>
        </section>`;
    }
    const choices = geneoRelativeFamilyChoices(relative);
    const selected = geneoRelativeFamilyDefault(relative);
    const autoFather = choices.some(choice => choice.value === 'unknown-father');
    const anchor = getGeneographNode(relative.anchorNodeId);
    const biologicalParents = [...new Set(selectedGeneographDiagram().families.flatMap(family => family.children.some(child => child.personId === anchor?.personId && child.parentageType === 'biological') ? family.partnerIds : []))];
    const suggestedGender = geneoRelativeDefaultGender(relative.type, relative.anchorNodeId);
    const initialType = relative.detailType || (category === 'parent' && (biologicalParents.length >= 2
        || (suggestedGender !== 'unknown' && biologicalParents.some(id => getGeneographPerson(id)?.gender === suggestedGender))) ? 'Adoptive' : 'Biological');
    const fields = `<div class="add-person-family-body">
      <div class="field add-person-select-field"><label for="geneoRelativeType">${escapeHtml(t('Relationship type'))}</label><select id="geneoRelativeType" class="compact-select add-person-select" ${autoFather ? 'disabled' : ''}>${parentChildRelationshipTypeOptions(initialType)}</select><span class="add-person-select-chevron" aria-hidden="true">${icon.chevron}</span></div>
      ${['child', 'sibling'].includes(category) ? `<div class="field add-person-select-field"><label for="geneoRelativeFamily">${escapeHtml(t(category === 'sibling' ? 'Shared parents' : 'Parents'))}</label><select id="geneoRelativeFamily" class="compact-select add-person-select"><option value="">${escapeHtml(t('Choose parents'))}</option>${choices.map(choice =>
      {
          const names = choice.parentIds.map(id => geneoPersonDisplayName(getGeneographPerson(id)));
          const label = category === 'child' && names.length === 1
              ? state.language === 'ru' ? `Только ${names[0]}` : `${names[0]} only`
              : names.join(state.language === 'ru' ? ' и ' : ' and ');
          return `<option value="${escapeHtml(choice.value)}" ${choice.value === selected ? 'selected' : ''}>${escapeHtml(choice.value === 'unknown-father' ? t('Unknown father') : label)}</option>`;
      }).join('')}</select><span class="add-person-select-chevron" aria-hidden="true">${icon.chevron}</span>${category === 'child' ? `<span class="field-help">${escapeHtml(t('Choose who will be recorded as this child’s parents.'))}</span>` : ''}</div>` : ''}
      </div><p class="form-error" data-geneo-relative-error hidden></p>`;
    return ['child', 'sibling'].includes(category)
        ? `<details class="add-person-family-connection add-person-facts-section geneo-relative-family" data-geneo-relative-config ${selected ? '' : 'open'}><summary class="add-person-facts-header" aria-expanded="${selected ? 'false' : 'true'}"><span class="add-person-facts-header-main"><span class="add-person-facts-chevron" aria-hidden="true">${icon.chevron}</span><span>${escapeHtml(t('Family connection'))}</span></span></summary><div class="add-person-facts-body">${fields}${autoFather ? `<p class="panel-muted">${escapeHtml(t('An Unknown father will be created for both siblings.'))}</p>` : ''}</div></details>`
        : `<section class="add-person-family-connection" data-geneo-relative-config>${fields}</section>`;
}

function collectGeneoRelativeConfiguration(relative)
{
    if (!relative) return {};
    const category = geneoRelativeCategory(relative.type);
    const fail = message =>
    {
        const section = modalBackdrop.querySelector('[data-geneo-relative-config]');
        if (section?.tagName === 'DETAILS') section.open = true;
        const error = section?.querySelector('[data-geneo-relative-error]');
        if (error) { error.hidden = false; error.textContent = t(message); }
        section?.querySelector('#geneoRelativeFamily, select')?.focus();
        return null;
    };
    if (category === 'partner')
    {
        const relationshipType = modalBackdrop.querySelector('#geneoRelativePartnerType')?.value || 'Married';
        const definition = partnerRelationshipDefinition(relationshipType);
        const startDate = collectGenealogyDateField('geneoRelativePartnerStartDate');
        const endDate = definition.hasEnd ? collectGenealogyDateField('geneoRelativePartnerEndDate') : emptyGenealogyDate('Exact date');
        if (!startDate || !endDate || (definition.hasEnd && !partnerRelationshipDateOrderIsValid(startDate, endDate)))
            return fail('Check the relationship dates before saving.');
        return { relationshipType, startDate, endDate,
            marriageType: definition.showsMarriageType ? modalBackdrop.querySelector('#geneoRelativeMarriageType')?.value || 'Civil' : '',
            startPlace: readPlaceInputValue('#geneoRelativePartnerStartPlace', modalBackdrop),
            endPlace: readPlaceInputValue('#geneoRelativePartnerEndPlace', modalBackdrop),
            addChildren: modalBackdrop.querySelector('#geneoRelativeChildren')?.value === 'add' };
    }
    const detailType = modalBackdrop.querySelector('#geneoRelativeType')?.value || relative.detailType || 'Biological';
    if (category === 'parent') return { detailType };
    const selection = modalBackdrop.querySelector('#geneoRelativeFamily')?.value || relative.familySelection || geneoRelativeFamilyDefault(relative);
    const choice = geneoRelativeFamilyChoices(relative).find(item => item.value === selection);
    if (!choice) return fail('Choose parents before continuing.');
    return { ...choice, detailType };
}

function geneoValidateRelativeConfiguration(relative, config, person = null)
{
    if (!relative || !config) return Boolean(config);
    const anchor = getGeneographNode(relative.anchorNodeId);
    if (!anchor) return false;
    const category = geneoRelativeCategory(relative.type);
    const diagram = selectedGeneographDiagram();
    const edges = diagram.families.flatMap(family => family.partnerIds.flatMap(parent => family.children.map(child => [parent, child.personId])));
    const reaches = (start, end, seen = new Set()) => start === end || (!seen.has(start) && (seen.add(start), edges.some(([parent, child]) => parent === start && reaches(child, end, seen))));
    const childId = category === 'parent' || config.attachAnchor ? anchor.personId : person?.id;
    const parents = category === 'parent' ? person ? [person.id] : [] : config.parentIds || [];
    let message = '';
    if (person?.id === anchor.personId) message = 'An item cannot connect to itself.';
    if (childId && parents.some(id => reaches(childId, id))) message = 'This relationship would create a loop.';
    if (person && category === 'sibling' && !config.attachAnchor)
    {
        const existing = diagram.families.filter(family => family.partnerIds.length && family.children.some(child => child.personId === person.id));
        if (existing.length && !existing.some(family => family.partnerIds.some(id => parents.includes(id))))
            message = 'These people have different recorded parents. Review their parents before connecting them as siblings.';
    }
    if (config.detailType === 'Biological' && childId)
    {
        const existingParents = [...new Set(diagram.families.flatMap(family => family.children.some(child => child.personId === childId && child.parentageType === 'biological') ? family.partnerIds : []))];
        const combined = [...new Set([...existingParents, ...parents])];
        if (combined.length > 2 || ['male', 'female'].some(gender => combined.filter(id => (id === person?.id ? person : getGeneographPerson(id))?.gender === gender).length > 1))
            message = 'Choose a non-biological relationship type for this parent connection.';
    }
    if (childId && parents.some(id => edges.some(([parent, child]) => parent === id && child === childId)))
        message = 'That connection already exists.';
    if (category === 'partner' && config.addChildren && person)
    {
        const children = diagram.families.filter(family => family.partnerIds.length === 1 && family.partnerIds[0] === anchor.personId).flatMap(family => family.children);
        if (children.some(child => reaches(child.personId, person.id))) message = 'This relationship would create a loop.';
        if (children.some(child => child.parentageType === 'biological') && person.gender !== 'unknown'
            && getGeneographPerson(anchor.personId)?.gender === person.gender)
            message = 'Keep existing parent links and edit the children\'s parentage separately.';
    }
    if (!message) return true;
    const section = modalBackdrop.querySelector('[data-geneo-relative-config]');
    if (section?.tagName === 'DETAILS') section.open = true;
    const error = section?.querySelector('[data-geneo-relative-error]');
    if (error) { error.hidden = false; error.textContent = t(message); }
    else showToast(t(message));
    section?.querySelector('select')?.focus();
    return false;
}

function connectGeneographCreatedRelative(
    anchorNode,
    relativeNode,
    relativeType,
    configuration = null
)
{
    const category =
        geneoRelativeCategory(
            relativeType
        );

    const anchorPersonId =
        anchorNode.personId;

    const relativePersonId =
        relativeNode.personId;

    if (configuration && ['child', 'sibling'].includes(category))
    {
        let family = configuration.familyId ? getGeneographFamily(configuration.familyId) : null;
        let parents = configuration.parentIds || [];
        if (configuration.value === 'unknown-father')
        {
            const father = { id: createRuntimeId('geneo-person'), treePersonId: null, syncState: 'local',
                names: { first: 'Unknown father', middle: '', last: '', maiden: '' }, gender: 'male', livingStatus: 'Unknown',
                birth: emptyGenealogyDate('Exact date'), death: emptyGenealogyDate('Exact date'), photoId: null };
            selectedGeneographDiagram().people.push(father);
            createGeneographPersonNodeForBoardPerson(father, { relative: { anchorNodeId: anchorNode.id, type: 'father' } });
            parents = [father.id];
        }
        if (!family) family = selectedGeneographDiagram().families.find(item => item.partnerIds.length === parents.length && parents.every(id => item.partnerIds.includes(id)));
        if (!family)
        {
            family = { id: createRuntimeId('geneo-family'), partnerIds: [...parents], children: [], relationshipType: 'Unknown relationship', relationshipStatus: 'active', marriageType: '', events: [] };
            selectedGeneographDiagram().families.push(family);
        }
        if (configuration.value === 'unknown-father') addGeneographChildToFamily(family.id, anchorPersonId, { nodeId: anchorNode.id, port: 'top' });
        if (configuration.attachAnchor)
        {
            const alreadyLinked = family.children.some(child => child.personId === anchorPersonId);
            addGeneographChildToFamily(family.id, anchorPersonId, { nodeId: anchorNode.id, port: 'top' });
            if (!alreadyLinked) family.children.find(child => child.personId === anchorPersonId).parentageType = configuration.detailType.toLowerCase();
            return;
        }
        const already = family.children.some(child => child.personId === relativePersonId);
        addGeneographChildToFamily(family.id, relativePersonId, { nodeId: relativeNode.id, port: 'top' });
        if (!already) family.children.find(child => child.personId === relativePersonId).parentageType = configuration.detailType.toLowerCase();
        return;
    }

    if (category === 'parent')
    {
        const candidateParent = geneoFirstParentForAddedParent(anchorNode, relativePersonId);
        const firstParent = candidateParent && (!configuration || candidateParent.family.children.find(child => child.personId === anchorPersonId)?.parentageType === configuration.detailType.toLowerCase()) ? candidateParent : null;
        if (firstParent)
        {
            const firstNode = firstParent.parentNode;
            const relativeIsRight = relativeNode.x >= firstNode.x;
            const family = createGeneographPartnerRelationship(
                firstNode.personId, relativePersonId,
                { nodeId: firstNode.id, port: relativeIsRight ? 'right' : 'left' },
                { nodeId: relativeNode.id, port: relativeIsRight ? 'left' : 'right' }
            );
            const child = firstParent.family.children.find(item => item.personId === anchorPersonId);
            if (!family.children.some(item => item.personId === anchorPersonId))
                family.children.push(child ? { ...child } : { personId: anchorPersonId, parentageType: 'biological' });
            if (configuration) family.children.find(item => item.personId === anchorPersonId).parentageType = configuration.detailType.toLowerCase();
            firstParent.connection.familyId = family.id;
            firstParent.connection.source = { familyId: family.id, port: 'bottom' };
            firstParent.connection.route = { mode: 'auto', waypoints: [] };
            firstParent.family.children = firstParent.family.children.filter(item => item.personId !== anchorPersonId);
            if (!firstParent.family.children.length)
                selectedGeneographDiagram().families = selectedGeneographDiagram().families.filter(item => item.id !== firstParent.family.id);
            return;
        }
        const family = createGeneographParentChildRelationship(
            relativePersonId,
            anchorPersonId,
            {
                nodeId: relativeNode.id,
                port: 'bottom'
            },
            {
                nodeId: anchorNode.id,
                port: 'top'
            }
        );
        if (configuration) family.children.find(item => item.personId === anchorPersonId).parentageType = configuration.detailType.toLowerCase();

        return;
    }

    if (category === 'child')
    {
        createGeneographParentChildRelationship(
            anchorPersonId,
            relativePersonId,
            {
                nodeId: anchorNode.id,
                port: 'bottom'
            },
            {
                nodeId: relativeNode.id,
                port: 'top'
            }
        );

        return;
    }

    if (category === 'sibling')
    {
        createGeneographSiblingRelationship(
            anchorPersonId,
            relativePersonId,
            {
                nodeId: anchorNode.id,
                port: 'top'
            },
            {
                nodeId: relativeNode.id,
                port: 'top'
            }
        );

        return;
    }

    const relativeIsRight =
        relativeNode.x >= anchorNode.x;

    const partnerFamily = createGeneographPartnerRelationship(
        anchorPersonId,
        relativePersonId,
        {
            nodeId: anchorNode.id,
            port:
            relativeIsRight
                ? 'right'
                : 'left'
        },
        {
            nodeId: relativeNode.id,
            port:
            relativeIsRight
                ? 'left'
                : 'right'
        }
    );
    if (configuration)
    {
        const definition = partnerRelationshipDefinition(configuration.relationshipType);
        partnerFamily.relationshipType = configuration.relationshipType;
        partnerFamily.relationshipStatus = definition.status;
        partnerFamily.marriageType = configuration.marriageType;
        const resolvePlace = input => geneoResolveBoardPersonPlace(input, '');
        upsertManagedRelationshipEvent(partnerFamily, 'start', definition, configuration.startDate, configuration.startPlace, configuration.marriageType, { resolvePlace });
        if (definition.hasEnd) upsertManagedRelationshipEvent(partnerFamily, 'end', definition, configuration.endDate, configuration.endPlace, configuration.marriageType, { resolvePlace });
        if (configuration.addChildren)
        {
            const diagram = selectedGeneographDiagram();
            diagram.families.filter(family => family.id !== partnerFamily.id && family.partnerIds.length === 1 && family.partnerIds[0] === anchorPersonId).forEach(family =>
            {
                family.children.forEach(child =>
                {
                    if (!partnerFamily.children.some(item => item.personId === child.personId)) partnerFamily.children.push({ ...child });
                });
                diagram.connections.filter(connection => connection.kind === 'family-child' && connection.familyId === family.id).forEach(connection =>
                {
                    connection.familyId = partnerFamily.id;
                    connection.source = { familyId: partnerFamily.id, port: 'bottom' };
                    connection.route = { mode: 'auto', waypoints: [] };
                });
                diagram.families = diagram.families.filter(item => item.id !== family.id);
            });
        }
    }
}

function openGeneographRelativePopover(
    anchor,
    nodeId
)
{
    const node =
        getGeneographNode(nodeId);

    const person =
        node?.type === 'person'
            ? getGeneographPerson(
                node.personId
            )
            : null;

    if (!anchor || !node || !person)
    {
        return;
    }

    closeMenu();

    const displayName =
        geneoPersonDisplayName(person);

    const popover =
        document.createElement('div');

    popover.className =
        'relative-popover geneo-relative-popover';

    popover.id = 'relativePopover';

    popover.setAttribute(
        'role',
        'dialog'
    );

    popover.setAttribute(
        'aria-label',
        `Add relative to ${displayName}`
    );

    popover.innerHTML = `
        <div class="relative-popover-body">
          <h2>New relative</h2>
          <p>to ${escapeHtml(displayName)}</p>

          <div class="relative-group">
            Parents
          </div>

          <div class="relative-grid">
            <button
              class="relative-choice"
              type="button"
              data-geneo-relative="father">
              <span class="gender-icon">
                ${icon.male}
              </span>
              Father
            </button>

            <button
              class="relative-choice female"
              type="button"
              data-geneo-relative="mother">
              <span class="gender-icon">
                ${icon.female}
              </span>
              Mother
            </button>

            <button
              class="relative-choice geneo-relative-choice wide"
              type="button"
              data-geneo-relative="parent">
              <span class="relative-choice-icon">
                ${icon.profile}
              </span>
              Parent
            </button>
          </div>

          <div class="relative-group">
            Partner
          </div>

          <div class="relative-grid">
            <button
              class="relative-choice geneo-relative-choice wide"
              type="button"
              data-geneo-relative="partner">
              <span class="relative-choice-icon marriage-icon">
                ${icon.marriage}
              </span>
              Partner / Spouse
            </button>
          </div>

          <div class="relative-group">
            Children
          </div>

          <div class="relative-grid">
            <button
              class="relative-choice"
              type="button"
              data-geneo-relative="son">
              <span class="gender-icon">
                ${icon.male}
              </span>
              Son
            </button>

            <button
              class="relative-choice female"
              type="button"
              data-geneo-relative="daughter">
              <span class="gender-icon">
                ${icon.female}
              </span>
              Daughter
            </button>

            <button
              class="relative-choice geneo-relative-choice wide"
              type="button"
              data-geneo-relative="child">
              <span class="relative-choice-icon">
                ${icon.profile}
              </span>
              Child
            </button>
          </div>

          <div class="relative-group">
            Siblings
          </div>

          <div class="relative-grid">
            <button
              class="relative-choice"
              type="button"
              data-geneo-relative="brother">
              <span class="gender-icon">
                ${icon.male}
              </span>
              Brother
            </button>

            <button
              class="relative-choice female"
              type="button"
              data-geneo-relative="sister">
              <span class="gender-icon">
                ${icon.female}
              </span>
              Sister
            </button>

            <button
              class="relative-choice geneo-relative-choice wide"
              type="button"
              data-geneo-relative="sibling">
              <span class="relative-choice-icon">
                ${icon.profile}
              </span>
              Sibling
            </button>
          </div>
        </div>
      `;

    document.body.appendChild(popover);

    anchor.setAttribute(
        'aria-expanded',
        'true'
    );

    positionRelativePopover(
        popover,
        anchor
    );

    popover
        .querySelectorAll(
            '[data-geneo-relative]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () =>
                {
                    const relativeType =
                        button.dataset.geneoRelative;

                    closeMenu();

                    openGeneographPersonModal(
                        '',
                        {
                            relative: {
                                anchorNodeId: node.id,
                                type: relativeType
                            }
                        }
                    );
                }
            );
        });

    bindMenuLifecycle(anchor);

    requestAnimationFrame(() =>
    {
        popover
            .querySelector(
                '[data-geneo-relative]'
            )
            ?.focus();
    });
}

let geneoPersonPossibleMatchState = {
    selectedPersonId: '',
    refreshFrame: null
};

function collectGeneographPersonDraftForMatching()
{
    const value =
        selector =>
            modalBackdrop
                ?.querySelector(selector)
                ?.value
          || '';

    const firstName =
        normalizeAddPersonMatchText(
            value('#geneoPersonFirstName')
        );

    const middleName =
        normalizeAddPersonMatchText(
            value('#geneoPersonMiddleName')
        );

    const lastName =
        normalizeAddPersonMatchText(
            value('#geneoPersonLastName')
        );

    const maidenName =
        normalizeAddPersonMatchText(
            value('#geneoPersonMaidenName')
        );

    const birthDate =
        normalizeAddPersonMatchText(
            value('#geneoPersonBirthDate')
        );

    const deathDate =
        normalizeAddPersonMatchText(
            value('#geneoPersonDeathDate')
        );

    const birthPlace =
        normalizeAddPersonMatchText(
            value('#geneoPersonBirthPlace')
        );

    const deathPlace =
        normalizeAddPersonMatchText(
            value('#geneoPersonDeathPlace')
        );

    return {
        firstName,
        middleName,
        lastName,
        maidenName,
        birthDate,
        deathDate,
        birthPlace,
        deathPlace,
        hasSignal: Boolean(
            firstName
          || middleName
          || lastName
          || maidenName
          || birthDate
          || deathDate
          || birthPlace
          || deathPlace
        )
    };
}

function geneoPossibleMatchScoreOptions(
    options = {}
)
{
    const anchorNode =
        options.relative?.anchorNodeId
            ? getGeneographNode(
                options.relative.anchorNodeId
            )
            : null;

    const anchorPerson =
        anchorNode?.type === 'person'
            ? getGeneographPerson(
                anchorNode.personId
            )
            : null;

    return {
        connectToPersonId:
          anchorPerson?.treePersonId
          || ''
    };
}

function findGeneographPersonPossibleMatches(
    options = {}
)
{
    const draft =
        collectGeneographPersonDraftForMatching();

    if (!draft.hasSignal) return [];

    const projectId =
        selectedGeneographBoard()?.projectId
        || currentProjectId();

    const scoreOptions =
        geneoPossibleMatchScoreOptions(
            options
        );

    return getPeople(projectId)
        .filter(person =>
            person?.id
          && !person.deleted
          && person.id
            !== scoreOptions.connectToPersonId
        )
        .map(person => ({
            person,
            score:
            scoreAddPersonPossibleMatch(
                person,
                draft,
                scoreOptions
            )
        }))
        .filter(item => item.score >= 24)
        .sort(
            (first, second) =>
                second.score - first.score
            || connectPersonName(
                first.person
            ).localeCompare(
                connectPersonName(
                    second.person
                )
            )
        )
        .slice(0, 2);
}

function renderGeneographPersonPossibleMatchesCard(
    options = {},
    {
        initial = false
    } = {}
)
{
    const draft =
        initial
            ? { hasSignal: false }
            : collectGeneographPersonDraftForMatching();

    const matches =
        initial
            ? []
            : findGeneographPersonPossibleMatches(
                options
            );

    const selectedStillVisible =
        matches.some(item =>
            item.person.id
          === geneoPersonPossibleMatchState
              .selectedPersonId
        );

    if (
        geneoPersonPossibleMatchState
            .selectedPersonId
        && !selectedStillVisible
    )
    {
        geneoPersonPossibleMatchState
            .selectedPersonId = '';
    }

    const header = `
        <h3>
          Possible matches<br>
          <span class="panel-muted">
            Similar people in Family Tree
          </span>
        </h3>
      `;

    if (!draft.hasSignal)
    {
        return `<div class="modal-side-card" data-geneo-person-possible-matches aria-live="polite">
          ${header}
          <div class="add-person-match-empty">
            Enter a name, date, or place to check the Family Tree.
          </div>
        </div>`;
    }

    if (!matches.length)
    {
        return `<div class="modal-side-card" data-geneo-person-possible-matches aria-live="polite">
          ${header}
          <div class="add-person-match-empty">
            No strong matches found in the Family Tree.
          </div>
        </div>`;
    }

    const relative =
        Boolean(
            options.relative
        );

    return `<div class="modal-side-card" data-geneo-person-possible-matches aria-live="polite">
        ${header}
        <div class="add-person-match-list">
          ${matches.map(item =>
                renderAddPersonPossibleMatchRow(
                    item,
                    {
                        context: 'geneograph',
                        selectedPersonId:
                  geneoPersonPossibleMatchState
                      .selectedPersonId
                    }
                )
            ).join('')}
        </div>
        <button
          class="button primary add-person-match-action"
          type="button"
          data-geneo-person-match-action
          ${selectedStillVisible ? '' : 'disabled'}>
          ${icon.link}
          <span>
            ${relative ? 'Connect selected' : 'Add selected'}
          </span>
        </button>
      </div>`;
}

function bindGeneographPersonPossibleMatchCard(
    options = {}
)
{
    modalBackdrop
        ?.querySelectorAll(
            '[data-geneo-person-possible-match]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () =>
                {
                    geneoPersonPossibleMatchState
                        .selectedPersonId =
                            button.dataset
                                .geneoPersonPossibleMatch
                  || '';

                    refreshGeneographPersonPossibleMatches(
                        options,
                        {
                            focusSelected: true
                        }
                    );
                }
            );
        });

    modalBackdrop
        ?.querySelector(
            '[data-geneo-person-match-action]'
        )
        ?.addEventListener(
            'click',
            () =>
                commitGeneographPersonPossibleMatch(
                    options
                )
        );
}

function refreshGeneographPersonPossibleMatches(
    options = {},
    {
        focusSelected = false
    } = {}
)
{
    const current =
        modalBackdrop?.querySelector(
            '[data-geneo-person-possible-matches]'
        );

    if (!current) return;

    const body =
        modalBackdrop.querySelector(
            '.modal-body'
        );

    const scrollTop =
        body?.scrollTop || 0;

    current.outerHTML =
        renderGeneographPersonPossibleMatchesCard(
            options
        );

    const refreshed =
        modalBackdrop.querySelector(
            '[data-geneo-person-possible-matches]'
        );

    localizeUI(
        refreshed,
        {
            suppressObserverReplay: true
        }
    );
    bindGeneographPersonPossibleMatchCard(
        options
    );

    if (body)
    {
        body.scrollTop = scrollTop;
    }

    if (
        focusSelected
        && geneoPersonPossibleMatchState
            .selectedPersonId
    )
    {
        refreshed
            ?.querySelector(
                `[data-geneo-person-possible-match="${CSS.escape(
                    geneoPersonPossibleMatchState
                        .selectedPersonId
                )}"]`
            )
            ?.focus({
                preventScroll: true
            });
    }
}

function scheduleGeneographPersonPossibleMatchesRefresh(
    options = {}
)
{
    if (
        geneoPersonPossibleMatchState
            .refreshFrame
    )
    {
        cancelAnimationFrame(
            geneoPersonPossibleMatchState
                .refreshFrame
        );
    }

    geneoPersonPossibleMatchState
        .refreshFrame =
            requestAnimationFrame(() =>
            {
                geneoPersonPossibleMatchState
                    .refreshFrame = null;

                refreshGeneographPersonPossibleMatches(
                    options
                );
            });
}

function renderGeneographPersonStatusField(status)
{
    return `<div class="field add-person-status-field"><label>Living status</label><button class="add-person-status-button" type="button" id="geneoPersonStatusButton" aria-haspopup="listbox" aria-expanded="false"><span class="add-person-status-current"><span class="add-person-status-dot ${statusDotClass(status)}"></span><span id="geneoPersonStatusLabel">${escapeHtml(status)}</span></span><span class="add-person-status-chevron" aria-hidden="true">${icon.chevron}</span></button><input type="hidden" id="geneoPersonLivingStatus" value="${escapeHtml(status)}"><div class="add-person-status-menu" id="geneoPersonStatusMenu" role="listbox" hidden>${['Living', 'Deceased', 'Unknown'].map(value => `<button class="add-person-status-option ${value === status ? 'active' : ''}" type="button" role="option" aria-selected="${value === status}" data-geneo-person-status="${value}"><span><span class="add-person-status-dot ${statusDotClass(value)}"></span>${value}</span><span data-status-check>${value === status ? icon.check : ''}</span></button>`).join('')}</div></div>`;
}

function renderGeneographPersonModal(
    person = null,
    {
        relative = null,
        gender: initialGender
    } = {}
)
{
    const editing = Boolean(person);

    const names =
        normalizeGeneographPersonNames(
            person || {}
        );

    const defaultGender = ['male', 'female', 'unknown'].includes(initialGender)
        ? initialGender
        : relative
            ? geneoRelativeDefaultGender(relative.type, relative.anchorNodeId)
            : 'male';

    const gender =
        ['male', 'female', 'unknown']
            .includes(person?.gender)
            ? person.gender
            : defaultGender;

    const anchorNode = relative ? getGeneographNode(relative.anchorNodeId) : null;
    const statusSuggested = !editing && anchorNode?.type === 'person'
        && suggestedRelativeLivingStatus(getGeneographPerson(anchorNode.personId)?.birth, geneoRelativeCategory(relative.type)) === 'Deceased';
    const status = person?.livingStatus || (statusSuggested ? 'Deceased' : 'Living');

    const relativeLabel =
        relative
            ? geneoRelativeLabel(
                relative.type
            )
            : '';

    const modalTitle =
        editing
            ? 'Edit person'
            : relative
                ? `Add ${relativeLabel}`
                : 'Add person';

    const modalDescription =
        editing
            ? 'Update this board person without changing the linked Family Tree record.'
            : relative
                ? 'Create a board-local person and connect them to the selected card.'
                : 'Create a board-local person. You can link them to Family Tree later.';
    const birth = person?.birth || { ...emptyGenealogyDate('Exact date'), placeId: null, placeText: '' };
    const death = person?.death || { ...emptyGenealogyDate('Exact date'), placeId: null, placeText: '' };
    return `<div class="modal add-person-modal geneo-person-modal" role="dialog" aria-modal="true" aria-labelledby="geneoPersonModalTitle">
        <div class="modal-header add-person-header">
          <div class="add-person-icon" aria-hidden="true">
            ${icon.people}
          </div>
          <div>
            <h2 id="geneoPersonModalTitle">${escapeHtml(modalTitle)}</h2>
            <p>${escapeHtml(modalDescription)}</p>
          </div>
          <button class="close-button" type="button" data-close aria-label="Close">
            ${icon.close}
          </button>
        </div>

        <form id="geneoPersonForm">
          <div class="modal-body add-person-grid geneo-person-grid ${editing ? 'is-editing' : ''}">
            <div class="form-grid geneo-person-form">
              <section>
                <h3 class="form-section-title">Identity</h3>
                <div class="two-col-form add-person-demographics">
                  <div class="field add-person-select-field">
                    <label for="geneoPersonGender">Gender</label>
                    <select class="compact-select add-person-select" id="geneoPersonGender">
                      <option value="male" ${gender === 'male' ? 'selected' : ''}>Male</option>
                      <option value="female" ${gender === 'female' ? 'selected' : ''}>Female</option>
                      <option value="unknown" ${gender === 'unknown' ? 'selected' : ''}>Unknown</option>
                    </select>
                    <span class="add-person-select-chevron" aria-hidden="true">${icon.chevron}</span>
                  </div>

                  ${renderGeneographPersonStatusField(status)}
                </div><div class="two-col-form add-person-name-fields">
                  <div class="field">
                    <label for="geneoPersonFirstName">First name</label>
                    <input id="geneoPersonFirstName" data-source-value="${escapeHtml(names.first)}" value="${escapeHtml(localizedDataFieldValue(names.first))}" placeholder="e.g. Silver" autofocus>
                  </div>

                  <div class="field">
                    <label for="geneoPersonMiddleName">Middle name / Patronym</label>
                    <input id="geneoPersonMiddleName" data-source-value="${escapeHtml(names.middle)}" value="${escapeHtml(localizedDataFieldValue(names.middle))}" placeholder="e.g. Purrington" title="${escapeHtml(t('Middle name or patronym, if recorded.'))}">
                  </div>

                  <div class="field">
                    <label for="geneoPersonLastName">Last name</label>
                    <input id="geneoPersonLastName" data-source-value="${escapeHtml(names.last)}" value="${escapeHtml(localizedDataFieldValue(names.last))}" placeholder="e.g. Whiskerfield">
                  </div>

                  <div class="field" data-geneo-maiden-name ${gender === 'female' ? '' : 'hidden'}>
                    <label for="geneoPersonMaidenName">Maiden name</label>
                    <input id="geneoPersonMaidenName" data-source-value="${escapeHtml(names.maiden)}" value="${escapeHtml(localizedDataFieldValue(names.maiden))}">
                  </div>
                </div>
              </section>

              <section>
                <h3 class="form-section-title">Life events</h3>
                <div class="add-person-life-grid">
                  <div class="add-person-life-event-block">
                    ${renderGenealogyDateField('geneoPersonBirth', 'Birth date', birth, {
                        inputId: 'geneoPersonBirthDate',
                        typeId: 'geneoPersonBirthDateType',
                        placeholder: 'e.g. 14 Feb 1915',
                        defaultDateType: 'Exact date',
                        className: 'genealogy-date-inline-range'
                    })}

                    ${renderPlaceCombobox({
                        id: 'geneoPersonBirthPlace',
                        label: 'Birth place',
                        value: placeInputDisplayValue(birth.placeId, birth.placeText),
                        selectedPlaceId: birth.placeId || '',
                        showAddress: false,
                        placeholder: 'Search or type a place',
                        inputAttrs: `data-place-project-id="${escapeHtml(selectedGeneographBoard()?.projectId || currentProjectId())}"`
                    })}
                  </div>

                  <div class="add-person-life-event-block add-person-death-fields" data-geneo-death-fields ${status === 'Deceased' ? '' : 'hidden'}>
                    ${renderGenealogyDateField('geneoPersonDeath', 'Death date', death, {
                        inputId: 'geneoPersonDeathDate',
                        typeId: 'geneoPersonDeathDateType',
                        placeholder: 'e.g. 14 Feb 1915',
                        defaultDateType: 'Exact date',
                        className: 'genealogy-date-inline-range'
                    })}

                    ${renderPlaceCombobox({
                        id: 'geneoPersonDeathPlace',
                        label: 'Death place',
                        value: placeInputDisplayValue(death.placeId, death.placeText),
                        selectedPlaceId: death.placeId || '',
                        showAddress: false,
                        placeholder: 'Search or type a place',
                        inputAttrs: `data-place-project-id="${escapeHtml(selectedGeneographBoard()?.projectId || currentProjectId())}"`
                    })}
                  </div>
                </div>
              </section>
            </div>

            ${editing ? '' : `
              <aside class="geneo-person-match-rail">
                ${renderGeneographPersonPossibleMatchesCard({ relative }, { initial: true })}
              </aside>
            `}
            ${!editing ? renderGeneoRelativeConfiguration(relative) : ''}
          </div>

          <div class="modal-footer add-person-footer">
            <div class="add-person-footer-left">${!editing && relative && ['child', 'sibling'].includes(geneoRelativeCategory(relative.type)) ? `<label class="checkbox-row"><input type="checkbox" id="geneoPersonAddAnother">${escapeHtml(t('Create and add another'))}</label>` : ''}</div>
            <div class="add-person-footer-actions">
              <button class="button secondary" type="button" data-close>Cancel</button>
              <button class="button primary" type="submit">
                ${
                    editing
                        ? 'Save changes'
                        : relative
                            ? `Add ${escapeHtml(relativeLabel)}`
                            : 'Add person'
                }
              </button>
            </div>
          </div>
        </form>
      </div>`;
}

function updateGeneographPersonModalConditionalFields({ clearDeath = false } = {})
{
    const gender = modalBackdrop.querySelector('#geneoPersonGender')?.value || 'unknown';
    const status = modalBackdrop.querySelector('#geneoPersonLivingStatus')?.value || 'Living';
    const deathFields = modalBackdrop.querySelector('[data-geneo-death-fields]');
    const maiden = modalBackdrop.querySelector('[data-geneo-maiden-name]');
    if (maiden) maiden.hidden = gender !== 'female';
    if (deathFields) deathFields.hidden = status !== 'Deceased';
    if (clearDeath && status !== 'Deceased')
    {
        applyGenealogyDateToField('geneoPersonDeath', emptyGenealogyDate('Exact date'));
        const input = modalBackdrop.querySelector('#geneoPersonDeathPlace');
        if (input)
        {
            input.value = ''; input.dataset.placeId = '';
        }
    }
}

function geneoBoardRepresentationForTreePerson(
    treePersonId
)
{
    const diagram =
        selectedGeneographDiagram();

    if (!diagram || !treePersonId)
    {
        return {
            person: null,
            node: null
        };
    }

    const person =
        diagram.people.find(item =>
            item.treePersonId === treePersonId
        ) || null;

    const node =
        person
            ? diagram.nodes.find(item =>
                item.type === 'person'
              && item.personId === person.id
            ) || null
            : null;

    return {
        person,
        node
    };
}

function createGeneographLinkedBoardPerson(
    treePerson,
    projectId
)
{
    const gender =
        String(
            treePerson?.gender || ''
        ).toLowerCase();

    const recordedDeath =
        geneoPersonHasRecordedDeath(
            treePerson
        );

    const livingStatus =
        [
            'Living',
            'Deceased',
            'Unknown'
        ].includes(
            treePerson?.livingStatus
        )
            ? treePerson.livingStatus
            : recordedDeath
                ? 'Deceased'
                : 'Living';

    return {
        id:
          createRuntimeId(
              'geneo-person'
          ),
        treePersonId:
          treePerson.id,
        syncState: 'linked',
        names:
          normalizeGeneographPersonNames(
              treePerson
          ),
        gender:
          [
              'male',
              'female',
              'unknown'
          ].includes(gender)
              ? gender
              : 'unknown',
        livingStatus,
        birth:
          normalizeGeneographPersonVital(
              treePerson.birth,
              projectId
          ),
        death:
          livingStatus === 'Deceased'
              ? normalizeGeneographPersonVital(
                  treePerson.death,
                  projectId
              )
              : {
                  ...emptyGenealogyDate(
                      'Exact date'
                  ),
                  placeId: null,
                  placeText: ''
              },
        photoId: null,
        photoCrop: null,
        photoRegion: null
    };
}

function createGeneographPersonNodeForBoardPerson(
    boardPerson,
    {
        relative = null
    } = {}
)
{
    const diagram =
        selectedGeneographDiagram();

    if (!diagram || !boardPerson)
    {
        return null;
    }

    const anchorNode =
        relative?.anchorNodeId
            ? getGeneographNode(
                relative.anchorNodeId
            )
            : null;

    const defaults =
        geneoNodeDefaults('person');

    const personCard =
        geneoEmptyPersonCardOverrides(
            false,
            'manual'
        );

    const draftNode = {
        type: 'person',
        personId: boardPerson.id,
        width: defaults.width,
        height: defaults.height,
        personCard
    };

    const reference =
        geneoPersonCardReferenceSize(
            draftNode,
            diagram
        );

    const standardCard =
        geneoPersonCardEffectiveSettings(
            draftNode,
            diagram
        ).style === 'standard';

    const placement =
        anchorNode && relative
            ? geneoRelativeNodePlacement(
                anchorNode,
                relative.type,
                reference.width,
                reference.height
            )
            : {
                ...nextGeneoObjectPosition(
                    reference.width,
                    reference.height
                ),
                parentPanelId: null
            };

    const node = {
        id:
          createRuntimeId(
              'geneo-node'
          ),
        type: 'person',
        personId: boardPerson.id,
        x: placement.x,
        y: placement.y,
        width: reference.width,
        height: reference.height,
        parentPanelId:
          placement.parentPanelId
          || null,
        order:
          Math.max(
              0,
              ...diagram.nodes.map(item =>
                  item.order || 0
              )
          ) + 1,
        visible: true,
        locked: false,
        personCard,
        appearance: {
            ...defaults.appearance,
            paintOverrides: {
                ...defaults.appearance.paintOverrides,
                stroke: false
            },
            fill: {
                color: '#173029',
                opacity: 100,
                enabled: true
            },
            stroke: {
                color: '#62D99A',
                opacity: 100,
                enabled: !standardCard
            },
            strokeWidth: 2
        }
    };

    diagram.nodes.push(node);
    return node;
}

function geneoRelativeConnectionEndpoints(
    anchorNode,
    relativeNode,
    relativeType
)
{
    const category =
        geneoRelativeCategory(
            relativeType
        );

    if (category === 'parent')
    {
        return {
            source: {
                nodeId: relativeNode.id,
                port: 'bottom'
            },
            target: {
                nodeId: anchorNode.id,
                port: 'top'
            }
        };
    }

    if (category === 'child')
    {
        return {
            source: {
                nodeId: anchorNode.id,
                port: 'bottom'
            },
            target: {
                nodeId: relativeNode.id,
                port: 'top'
            }
        };
    }

    if (category === 'sibling')
    {
        return {
            source: {
                nodeId: anchorNode.id,
                port: 'top'
            },
            target: {
                nodeId: relativeNode.id,
                port: 'top'
            }
        };
    }

    const relativeIsRight =
        relativeNode.x >= anchorNode.x;

    return {
        source: {
            nodeId: anchorNode.id,
            port:
            relativeIsRight
                ? 'right'
                : 'left'
        },
        target: {
            nodeId: relativeNode.id,
            port:
            relativeIsRight
                ? 'left'
                : 'right'
        }
    };
}

function geneoPersonFormTransaction(action)
{
    const board = selectedGeneographBoard();
    const snapshot = board ? JSON.stringify(board.diagram) : null;
    const undo = [...geneoHistoryRuntime.undo];
    const redo = [...geneoHistoryRuntime.redo];
    try { return action(); }
    catch (error)
    {
        if (board && snapshot) board.diagram = JSON.parse(snapshot);
        geneoHistoryRuntime.undo = undo;
        geneoHistoryRuntime.redo = redo;
        console.error(error);
        showToast(t('The person could not be added. No changes were saved.'));
        return false;
    }
}

function commitGeneographPersonPossibleMatch(options = {})
{
    return geneoPersonFormTransaction(() => commitGeneographPersonPossibleMatchDraft(options));
}

function commitGeneographPersonPossibleMatchDraft(
    options = {}
)
{
    const treePerson =
        getPerson(
            geneoPersonPossibleMatchState
                .selectedPersonId
        );

    const board =
        selectedGeneographBoard();

    const diagram =
        selectedGeneographDiagram();

    if (
        !treePerson
        || !board
        || !diagram
        || treePerson.projectId
          !== board.projectId
        || treePerson.deleted
    )
    {
        showToast(
            'Select a possible match first.'
        );
        return;
    }

    const relative =
        options.relative || null;

    const anchorNode =
        relative?.anchorNodeId
            ? getGeneographNode(
                relative.anchorNodeId
            )
            : null;

    if (
        relative
        && anchorNode?.type !== 'person'
    )
    {
        showToast(
            'The original person card is no longer available.'
        );
        return;
    }

    let {
        person: boardPerson,
        node
    } = geneoBoardRepresentationForTreePerson(
        treePerson.id
    );

    const connectionRelative = relative ? { ...relative, existingPersonId: boardPerson?.id || '' } : null;
    if (relative && geneoRelativeCategory(relative.type) === 'sibling'
        && geneoRelativeFamilyChoices(connectionRelative).some(choice => choice.attachAnchor)
        && !geneoRelativeFamilyChoices(connectionRelative).some(choice => choice.value === modalBackdrop.querySelector('#geneoRelativeFamily')?.value))
    {
        const section = modalBackdrop.querySelector('[data-geneo-relative-config]');
        if (section)
        {
            section.outerHTML = renderGeneoRelativeConfiguration(connectionRelative);
            modalBackdrop.querySelector('[data-geneo-relative-config]').open = true;
            localizeUI(modalBackdrop);
            modalBackdrop.querySelector('#geneoRelativeFamily')?.focus();
        }
        return;
    }
    const relativeConfiguration = collectGeneoRelativeConfiguration(connectionRelative);
    const proposedPerson = boardPerson || createGeneographLinkedBoardPerson(treePerson, board.projectId);
    if (!relativeConfiguration || !geneoValidateRelativeConfiguration(relative, relativeConfiguration, proposedPerson)) return;

    if (relative && node)
    {
        const endpoints =
            geneoRelativeConnectionEndpoints(
                anchorNode,
                node,
                relative.type
            );

        const validation =
            canCreateGeneographConnection(
                endpoints.source,
                endpoints.target
            );

        if (!validation.valid)
        {
            showToast(
                validation.reason
            || 'This relationship cannot be created.'
            );
            return;
        }
    }

    const creatingPerson =
        !boardPerson;

    const creatingNode =
        !node;

    const connecting =
        Boolean(relative);

    const mutating =
        creatingPerson
        || creatingNode
        || connecting;

    if (mutating)
    {
        geneoPushHistory();
    }

    if (!boardPerson)
    {
        boardPerson =
            createGeneographLinkedBoardPerson(
                treePerson,
                board.projectId
            );

        diagram.people.push(
            boardPerson
        );
    }

    if (!node)
    {
        node =
            createGeneographPersonNodeForBoardPerson(
                boardPerson,
                {
                    relative
                }
            );
    }

    if (!node) return;

    if (relative)
    {
        connectGeneographCreatedRelative(
            anchorNode,
            node,
            relative.type,
            relativeConfiguration
        );
    }

    selectGeneographNode(
        node.id
    );

    if (mutating)
    {
        touchGeneographBoard();
    }

    closeModal();

    if (
        !mutating
        && node
    )
    {
        renderGeneographEditorPreserveCenter(
            geneoNodeCenter(node)
        );
    }
    else
    {
        renderGeneographEditorPreserveScroll();
    }

    requestAnimationFrame(() =>
    {
        main
            .querySelector(
                `[data-geneo-node="${CSS.escape(node.id)}"]`
            )
            ?.focus({
                preventScroll: true
            });
    });

    const name =
        connectPersonName(
            treePerson
        );

    if (relative)
    {
        showToast(
            connectedRelativeToast(name, relative.type)
        );
        return;
    }

    showToast(
        creatingNode
            ? `${name} added to board.`
            : `${name} is already on this board.`
    );
}

function saveGeneographPersonModal(
    personId = '',
    options = {}
)
{
    return geneoPersonFormTransaction(() => saveGeneographPersonModalDraft(personId, options));
}

function saveGeneographPersonModalDraft(
    personId = '',
    {
        relative = null
    } = {}
)
{
    const existing =
        personId
            ? getGeneographPerson(personId)
            : null;

    const anchorNode =
        relative?.anchorNodeId
            ? getGeneographNode(
                relative.anchorNodeId
            )
            : null;

    if (
        relative
        && anchorNode?.type !== 'person'
    )
    {
        showToast(
            'The original person card is no longer available.'
        );

        closeModal();
        return;
    }

    const birthDate =
        collectGenealogyDateField(
            'geneoPersonBirth'
        );

    const status =
        modalBackdrop
            .querySelector(
                '#geneoPersonLivingStatus'
            )?.value
        || 'Living';

    const deathDate =
        status === 'Deceased'
            ? collectGenealogyDateField(
                'geneoPersonDeath'
            )
            : emptyGenealogyDate(
                'Exact date'
            );

    if (!birthDate || !deathDate)
    {
        modalBackdrop
            .querySelector(
                '.genealogy-date-field.has-error input'
            )
            ?.focus({
                preventScroll: true
            });

        return;
    }

    if (status === 'Deceased' && genealogyDateDefinitelyAfter(birthDate, deathDate))
    {
        showToast(t('The death date is earlier than the birth date.'));
        return;
    }

    const projectId =
        selectedGeneographBoard()
            ?.projectId
        || currentProjectId();

    const birthPlace =
        geneoResolveBoardPersonPlace(
            readPlaceInputValue(
                '#geneoPersonBirthPlace',
                modalBackdrop
            ),
            existing?.birth?.placeId || ''
        );

    const deathPlace =
        status === 'Deceased'
            ? geneoResolveBoardPersonPlace(
                readPlaceInputValue(
                    '#geneoPersonDeathPlace',
                    modalBackdrop
                ),
                existing?.death?.placeId || ''
            )
            : {
                placeId: null,
                placeText: ''
            };

    const gender =
        modalBackdrop
            .querySelector(
                '#geneoPersonGender'
            )?.value
        || 'unknown';

    const enteredFirstName =
        collectLocalizedDataFieldValue(
            modalBackdrop.querySelector(
                '#geneoPersonFirstName'
            ),
            existing?.names?.first || ''
        ).trim();

    const values = {
        names: {
            first:
            enteredFirstName
            || (
                existing
                    ? ''
                    : 'Unknown'
            ),

            middle:
            collectLocalizedDataFieldValue(
                modalBackdrop.querySelector(
                    '#geneoPersonMiddleName'
                ),
                existing?.names?.middle || ''
            ).trim(),

            last:
            collectLocalizedDataFieldValue(
                modalBackdrop.querySelector(
                    '#geneoPersonLastName'
                ),
                existing?.names?.last || ''
            ).trim(),

            maiden:
            gender === 'female'
                ? collectLocalizedDataFieldValue(
                    modalBackdrop.querySelector(
                        '#geneoPersonMaidenName'
                    ),
                    existing?.names?.maiden || ''
                ).trim()
                : ''
        },

        gender,
        livingStatus: status,

        birth:
          normalizeGeneographPersonVital(
              {
                  ...birthDate,
                  placeId:
                birthPlace.placeId || null,
                  placeText:
                birthPlace.placeText || ''
              },
              projectId
          ),

        death:
          status === 'Deceased'
              ? normalizeGeneographPersonVital(
                  {
                      ...deathDate,
                      placeId:
                    deathPlace.placeId
                    || null,
                      placeText:
                    deathPlace.placeText
                    || ''
                  },
                  projectId
              )
              : normalizeGeneographPersonVital(existing?.death, projectId)
    };

    const diagram =
        selectedGeneographDiagram();

    if (!diagram || !projectId) return;

    const relativeConfiguration = collectGeneoRelativeConfiguration(relative);
    if (!relativeConfiguration || !geneoValidateRelativeConfiguration(relative, relativeConfiguration, existing || { id: '__new-relative', ...values })) return;
    const addAnother = Boolean(modalBackdrop.querySelector('#geneoPersonAddAnother')?.checked);

    geneoPushHistory();

    let createdNode = null;

    if (existing)
    {
        Object.assign(existing, values);

        if (existing.treePersonId)
        {
            existing.syncState = 'modified';
        }
        diagram.nodes
            .filter(
                node =>
                    node.type === 'person'
              && node.personId
                === existing.id
            )
            .forEach(
                node =>
                    ensureGeneographPersonCardSize(
                        node,
                        diagram
                    )
            );
    }
    else
    {
        const defaults =
            geneoNodeDefaults('person');

        const person = {
            id:
          createRuntimeId(
              'geneo-person'
          ),

            treePersonId: null,
            syncState: 'local',

            ...values,

            photoId: null,
            photoCrop: null,
            photoRegion: null
        };

        diagram.people.push(person);

        const personCard =
            geneoEmptyPersonCardOverrides(
                false,
                'manual'
            );

        const draftNode = {
            type: 'person',
            personId: person.id,
            width:
          defaults.width,
            height:
          defaults.height,
            personCard
        };

        const reference =
            geneoPersonCardReferenceSize(
                draftNode,
                diagram
            );

        const standardCard =
            geneoPersonCardEffectiveSettings(
                draftNode,
                diagram
            ).style === 'standard';

        draftNode.width =
            reference.width;

        draftNode.height =
            reference.height;

        const initialWidth =
            draftNode.width;

        const initialHeight =
            draftNode.height;

        const placement =
            anchorNode && relative
                ? geneoRelativeNodePlacement(
                    anchorNode,
                    relative.type,
                    initialWidth,
                    initialHeight
                )
                : {
                    ...nextGeneoObjectPosition(
                        initialWidth,
                        initialHeight
                    ),

                    parentPanelId: null
                };

        createdNode = {
            id:
          createRuntimeId(
              'geneo-node'
          ),

            type: 'person',
            personId: person.id,

            x: placement.x,
            y: placement.y,

            width:
          initialWidth,

            height:
          initialHeight,

            parentPanelId:
          placement.parentPanelId
          || null,

            order:
          Math.max(
              0,
              ...diagram.nodes.map(
                  item =>
                      item.order || 0
              )
          ) + 1,

            visible: true,
            locked: false,

            personCard,

            appearance: {
                ...defaults.appearance,
                paintOverrides: {
                    ...defaults.appearance.paintOverrides,
                    stroke: false
                },

                fill: {
                    color: '#173029',
                    opacity: 100,
                    enabled: true
                },

                stroke: {
                    color: '#62D99A',
                    opacity: 100,
                    enabled: !standardCard
                },

                strokeWidth: 2
            }
        };

        diagram.nodes.push(
            createdNode
        );

        if (anchorNode && relative)
        {
            connectGeneographCreatedRelative(
                anchorNode,
                createdNode,
                relative.type,
                relativeConfiguration
            );
        }

        selectGeneographNode(
            createdNode.id
        );
    }

    touchGeneographBoard();

    closeModal();

    renderGeneographEditorPreserveScroll();

    if (createdNode && addAnother && relative)
    {
        openGeneographPersonModal('', { relative: { ...relative,
            familySelection: relativeConfiguration.value === 'unknown-father'
                ? geneoRelativeFamilyDefault({ ...relative, familySelection: '' }) : relativeConfiguration.value,
            detailType: relativeConfiguration.detailType } });
        return;
    }

    if (createdNode)
    {
        requestAnimationFrame(() =>
        {
            main
                .querySelector(
                    `[data-geneo-node="${CSS.escape(createdNode.id)}"]`
                )
                ?.focus({ preventScroll: true });
        });
    }

    if (createdNode && relative)
    {
        showToast(
            `${
                capitalize(
                    geneoRelativeLabel(
                        relative.type
                    )
                )
            } added to the board.`
        );

        return;
    }

    showToast(
        existing
            ? 'Board person updated.'
            : 'Person added to board.'
    );
}

function bindGeneographPersonModal(personId = '', options = {})
{
    const form = modalBackdrop.querySelector('#geneoPersonForm');
    form?.addEventListener('toggle', event =>
    {
        if (event.target.matches('.geneo-relative-family'))
            event.target.querySelector('summary')?.setAttribute('aria-expanded', String(event.target.open));
    }, true);
    const statusButton = modalBackdrop.querySelector('#geneoPersonStatusButton');
    const statusMenu = modalBackdrop.querySelector('#geneoPersonStatusMenu');
    bindGenealogyDateFields(modalBackdrop);
    bindPlaceComboboxes(modalBackdrop);
    modalBackdrop.querySelector('#geneoRelativePartnerType')?.addEventListener('change', event =>
    {
        const section = modalBackdrop.querySelector('[data-geneo-relative-config]');
        updatePartnerRelationshipFields(section, event.target.value);
        const marriage = section.querySelector('[data-geneo-relative-marriage]');
        if (marriage) marriage.hidden = !partnerRelationshipDefinition(event.target.value).showsMarriageType;
    });
    modalBackdrop.querySelector('#geneoPersonGender')?.addEventListener('change', () =>
    {
        updateGeneographPersonModalConditionalFields();
        scheduleGeneographPersonPossibleMatchesRefresh(options);
    });
    statusButton?.addEventListener('click', event =>
    {
        event.stopPropagation();
        const open = Boolean(statusMenu?.hidden);
        if (statusMenu) statusMenu.hidden = !open;
        statusButton.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    statusMenu?.querySelectorAll('[data-geneo-person-status]').forEach(button => button.addEventListener('click', () =>
    {
        const status = button.dataset.geneoPersonStatus;
        modalBackdrop.querySelector('#geneoPersonLivingStatus').value = status;
        modalBackdrop.querySelector('#geneoPersonStatusLabel').textContent = status;
        const dot = modalBackdrop.querySelector('.add-person-status-current .add-person-status-dot');
        if (dot) dot.className = `add-person-status-dot ${statusDotClass(status)}`;
        statusMenu.hidden = true;
        statusButton.setAttribute('aria-expanded', 'false');
        statusMenu.querySelectorAll('[data-geneo-person-status]').forEach(option =>
        {
            const selected = option.dataset.geneoPersonStatus === status;
            option.classList.toggle('active', selected);
            option.setAttribute('aria-selected', selected ? 'true' : 'false');
            const check = option.querySelector('[data-status-check]');
            if (check) check.innerHTML = selected ? icon.check : '';
        });
        updateGeneographPersonModalConditionalFields({ clearDeath: true });
        scheduleGeneographPersonPossibleMatchesRefresh(options);
    }));

    bindGeneographPersonPossibleMatchCard(
        options
    );

    [
        '#geneoPersonFirstName',
        '#geneoPersonMiddleName',
        '#geneoPersonLastName',
        '#geneoPersonMaidenName',
        '#geneoPersonBirthDate',
        '#geneoPersonDeathDate',
        '#geneoPersonBirthPlace',
        '#geneoPersonDeathPlace'
    ].forEach(selector =>
    {
        const input =
            modalBackdrop.querySelector(
                selector
            );

        if (!input) return;

        input.addEventListener(
            'input',
            () =>
                scheduleGeneographPersonPossibleMatchesRefresh(
                    options
                )
        );

        input.addEventListener(
            'change',
            () =>
                scheduleGeneographPersonPossibleMatchesRefresh(
                    options
                )
        );
    });

    form?.addEventListener(
        'submit',
        event =>
        {
            event.preventDefault();

            saveGeneographPersonModal(
                personId,
                options
            );
        }
    );
    updateGeneographPersonModalConditionalFields();
}

function openGeneographPersonModal(
    personId = '',
    options = {}
)
{
    const person =
        personId
            ? getGeneographPerson(personId)
            : null;

    if (personId && !person) return;

    if (
        geneoPersonPossibleMatchState
            .refreshFrame
    )
    {
        cancelAnimationFrame(
            geneoPersonPossibleMatchState
                .refreshFrame
        );
    }

    geneoPersonPossibleMatchState = {
        selectedPersonId: '',
        refreshFrame: null
    };

    openModal(
        renderGeneographPersonModal(
            person,
            options
        )
    );

    bindGeneographPersonModal(
        person?.id || '',
        options
    );
}

function openAddGeneographPersonModal()
{
    openGeneographPersonModal('', { gender: geneoToolbarPersonGender() });
}

function resetGeneographImagePickerState()
{
    geneoImageUploadRequestId += 1;

    state.geneoImagePicker = {
        open: false,
        mode: 'add',
        nodeId: null,
        personId: null,
        originNodeId: null,
        originLocation: 'card',
        step: 'choose',
        avatarRegion: null,
        sourceTab: 'project',
        addView: 'results',
        albumScopeId: '',
        imageSort: 'name',
        search: '',
        filters: { favorite: false, person: '', tagged: false },
        selectedProjectPhotoIds: [],
        uploadDrafts: [],
        addUploadsToAlbum: false,
        uploadAlbumId: '',
        uploadErrors: [],
        uploadBusy: false
    };
}

function geneoImagePickerProjectId()
{
    return selectedGeneographBoard()?.projectId || '';
}

function geneoImagePickerProjectPhotos()
{
    const projectId = geneoImagePickerProjectId();
    const query = state.geneoImagePicker.search
        .trim()
        .toLowerCase();

    return getProjectPhotos(projectId)
        .filter(photo => !photo.deletedAt)
        .filter(photo =>
            !query || photoSearchText(photo).includes(query)
        );
}

function geneoImagePickerSelectedProjectIds()
{
    return new Set(
        state.geneoImagePicker.selectedProjectPhotoIds || []
    );
}

function geneoImageUploadDraftAsPhoto(draft)
{
    if (!draft) return null;

    return {
        id: draft.id,
        kind: 'photo',
        title: geneoFilenameStem(draft.filename),
        filename: draft.filename,
        src: draft.src,
        mimeType: draft.mimeType,
        width: draft.width,
        height: draft.height,
        sizeBytes: draft.sizeBytes,

    };
}

function geneoImagePickerSelectedSources()
{
    const picker = state.geneoImagePicker;
    const projectId = geneoImagePickerProjectId();

    const projectSources = [
        ...geneoImagePickerSelectedProjectIds()
    ]
        .map(photoId =>
            getPhoto(photoId, { projectId })
        )
        .filter(photo => photo && !photo.deletedAt)
        .map(photo => ({
            scope: 'project',
            photo
        }));

    const uploadSources = (
        picker.uploadDrafts || []
    )
        .filter(photoUploadDraftIsValid)
        .map(draft => ({
            scope: 'board',
            photo: geneoImageUploadDraftAsPhoto(draft),
            draft
        }));

    /*
      * Replacement remains a single-source workflow. The active tab
      * determines whether the project photo or uploaded draft is used.
      */
    if (['replace', 'avatar'].includes(picker.mode))
    {
        return picker.sourceTab === 'upload'
            ? uploadSources.slice(0, 1)
            : projectSources.slice(0, 1);
    }

    /*
      * Add mode combines selections from both tabs so users can select
      * project photos, upload additional images, and add them together.
      */
    return [
        ...projectSources,
        ...uploadSources
    ];
}

function geneoImagePickerPendingCount()
{
    return geneoImagePickerSelectedSources().length;
}

function geneoImagePickerCountLabel(count)
{
    if (state.geneoImagePicker.mode === 'avatar') return count ? t('Photo selected') : t('No photo selected');
    if (!count) return t('No images selected');

    if (state.geneoImagePicker.mode === 'add' && state.language === 'ru')
    {
        return `Выбрано изображений: ${count}`;
    }

    return `${count} ${
        count === 1 ? 'image' : 'images'
    } selected`;
}

function geneoImagePickerActionLabel(count)
{
    if (state.geneoImagePicker.mode === 'avatar') return t('Adjust photo');
    if (state.geneoImagePicker.mode === 'replace')
    {
        return t('Replace image');
    }

    if (!count) return t('Add images');

    if (state.language === 'ru') return `Добавить изображений: ${count}`;

    return `Add ${count} ${
        count === 1 ? 'image' : 'images'
    }`;
}

function renderGeneographImageCandidate(photo)
{
    const selected =
        geneoImagePickerSelectedProjectIds().has(photo.id);

    const replacing =
        ['replace', 'avatar'].includes(state.geneoImagePicker.mode);

    const title = geneoImageRecordName(photo);

    const metadata = [
        photo.width && photo.height
            ? `${photo.width} × ${photo.height}`
            : '',
        formatPhotoDate(photo)
    ]
        .filter(Boolean)
        .join(' · ');

    const actionLabel = replacing
        ? `Use ${title}`
        : `${selected ? 'Deselect' : 'Select'} ${title}`;

    return `
        <button
          class="
            person-photo-candidate
            person-photos-adder-candidate
          "
          type="button"
          data-geneo-image-candidate="${escapeHtml(photo.id)}"
          aria-pressed="${selected}"
          aria-label="${escapeHtml(actionLabel)}">

          <span class="person-photo-candidate-preview">
            ${renderPhotoThumbnail(photo, {
                label: title
            })}

            <span
              class="person-photos-adder-check"
              data-geneo-image-candidate-check
              ${selected ? '' : 'hidden'}
              aria-hidden="true">
              ${icon.check}
            </span>
          </span>

          <span class="person-photo-candidate-copy">
            <strong>${escapeHtml(title)}</strong>
            <span>
              ${escapeHtml(metadata || 'Project photo')}
            </span>
          </span>
        </button>
      `;
}

function renderGeneographImageProjectResults()
{
    const allPhotos = getProjectPhotos(
        geneoImagePickerProjectId()
    ).filter(photo => !photo.deletedAt);

    const photos = geneoImagePickerProjectPhotos();
    const hasSearch = Boolean(
        state.geneoImagePicker.search.trim()
    );

    if (!allPhotos.length)
    {
        return `
          <div class="person-photo-empty">
            <div>
              <strong>No project photos yet.</strong>
              <span class="muted">
                Upload an image that will stay local to this board.
              </span>
              <button
                class="button primary"
                type="button"
                data-geneo-image-show-upload>
                Upload new image
              </button>
            </div>
          </div>
        `;
    }

    if (!photos.length)
    {
        return `
          <div class="person-photo-empty">
            <div>
              <strong>No matching project photos.</strong>

              <div class="person-photo-empty-actions">
                ${
                    hasSearch
                        ? `
                      <button
                        class="button secondary"
                        type="button"
                        data-geneo-image-clear-search>
                        Clear search
                      </button>
                    `
                        : ''
                }

                <button
                  class="button primary"
                  type="button"
                  data-geneo-image-show-upload>
                  Upload new image
                </button>
              </div>
            </div>
          </div>
        `;
    }

    return `
        <div class="person-photo-candidate-grid">
          ${photos.map(renderGeneographImageCandidate).join('')}
        </div>
      `;
}

function renderGeneographImageProjectPanel()
{
    return `
        <div class="person-photo-project-panel">
          <div class="person-photo-project-controls">
            <label
              class="search-input"
              aria-label="Search project photos">
              ${icon.search}

              <input
                type="search"
                data-geneo-image-search
                value="${escapeHtml(state.geneoImagePicker.search)}"
                placeholder="Search project photos">
            </label>
          </div>

          <div
            class="person-photo-project-results"
            data-geneo-image-project-results>
            ${renderGeneographImageProjectResults()}
          </div>
        </div>
      `;
}

function renderGeneographImageUploadDraft(draft)
{
    const photo = geneoImageUploadDraftAsPhoto(draft);
    const title = draft.filename || 'Uploaded image';

    if (state.geneoImagePicker.mode === 'avatar')
    {
        return `<article class="person-photo-candidate person-photos-adder-upload-card">
          <span class="person-photo-candidate-preview">
            ${renderPhotoThumbnail(photo, { label: title })}
            <button class="person-photos-adder-upload-remove" type="button"
              data-geneo-image-remove-upload="${escapeHtml(draft.id)}"
              aria-label="${escapeHtml(`Remove ${title}`)}" title="Remove upload">${icon.close}</button>
          </span>
          <span class="person-photo-candidate-copy"><strong>${escapeHtml(title)}</strong>
            <span>${escapeHtml(`${draft.width} × ${draft.height} · ${formatMediaBytes(draft.sizeBytes)}`)}</span>
          </span>
        </article>`;
    }

    return `
        <article class="rp-upload-tile">
          <span class="rp-upload-tile-preview">
            ${renderPhotoThumbnail(photo, {
                label: title
            })}
          </span>
          <strong title="${escapeHtml(title)}">${escapeHtml(title)}</strong>
          <small>${escapeHtml(`${draft.width} × ${draft.height} · ${formatMediaBytes(draft.sizeBytes)}`)}</small>
          <button class="rp-upload-remove" type="button"
            data-geneo-image-remove-upload="${escapeHtml(draft.id)}"
            aria-label="${escapeHtml(`${t('Remove')}: ${title}`)}"
            ${state.geneoImagePicker.uploadBusy ? 'disabled' : ''}>${icon.close}</button>
        </article>
      `;
}

function renderGeneographImageUploadErrors()
{
    const errors =
        state.geneoImagePicker.uploadErrors || [];

    if (!errors.length) return '';

    return `
        <div
          class="person-photos-adder-upload-errors"
          role="alert">
          <strong>
            ${
                errors.length === 1
                    ? 'One file could not be added:'
                    : `${errors.length} files could not be added:`
            }
          </strong>

          <ul>
            ${errors
                .map(error => `
                <li>${escapeHtml(error)}</li>
              `)
                .join('')}
          </ul>
        </div>
      `;
}

function renderGeneographImageUploadPanel()
{
    const picker = state.geneoImagePicker;
    const drafts = picker.uploadDrafts || [];
    const replacing = ['replace', 'avatar'].includes(picker.mode);
    const adding = picker.mode === 'add';
    const albums = adding ? getProjectAlbums(geneoImagePickerProjectId()).filter(album => !album.deleted) : [];

    const maxMegabytes = Math.round(
        PHOTO_UPLOAD_MAX_BYTES / (1024 * 1024)
    );

    const promptTitle = replacing
        ? drafts.length
            ? 'Choose a different image'
            : 'Drop an image here'
        : drafts.length
            ? 'Add more images'
            : 'Drop images here';

    const chooseLabel = replacing
        ? drafts.length
            ? 'Choose a different image'
            : 'Choose image'
        : drafts.length
            ? 'Choose more images'
            : 'Choose images';

    if (adding || replacing)
    {
            const detail = state.language === 'ru'
            ? `JPEG, PNG или WebP, до ${maxMegabytes} МБ на файл.`
            : `JPEG, PNG, or WebP up to ${maxMegabytes} MB each.`;
        return `
          <div class="person-photo-picker-notice">${escapeHtml(adding
                ? state.language === 'ru'
                    ? 'Без выбора альбома изображения будут доступны только на этой доске.'
                    : 'Without an album, uploads stay local to this board and do not appear in Albums.'
                : t('This upload will be stored only inside this board and will not appear in Albums.'))}</div>
          <div class="person-photos-adder-upload-panel">
            <div class="person-photo-upload-dropzone person-photos-adder-upload-dropzone upload-dropzone ${drafts.length ? 'has-drafts' : ''}"
              data-geneo-image-dropzone role="button" tabindex="0" aria-label="${escapeHtml(t(adding ? 'Choose photos' : 'Choose image'))}">
              <input type="file" accept="${PHOTO_UPLOAD_ALLOWED_TYPES.join(',')}" ${adding ? 'multiple' : ''} data-geneo-image-file hidden>
              ${renderUploadDropzonePrompt(adding ? drafts.length ? 'Add more photos' : 'Choose photos'
                : drafts.length ? 'Choose a different image' : 'Choose image', detail)}
            </div>
            ${renderGeneographImageUploadErrors()}
            ${drafts.length ? `<div class="rp-upload-tiles" aria-label="${escapeHtml(state.language === 'ru' ? 'Выбранные изображения' : 'Selected images')}">${drafts.map(renderGeneographImageUploadDraft).join('')}</div>` : ''}
            ${adding ? `<div class="geneo-image-album-choice">
              <label><input type="checkbox" data-geneo-image-add-to-album
                ${picker.addUploadsToAlbum ? 'checked' : ''} ${albums.length ? '' : 'disabled'}>
                ${escapeHtml(t('Add to album'))}</label>
              ${albums.length ? `<select data-geneo-image-album aria-label="${escapeHtml(state.language === 'ru' ? 'Выберите альбом' : 'Choose album')}"
                ${picker.addUploadsToAlbum ? '' : 'hidden disabled'}>
                <option value="">${escapeHtml(state.language === 'ru' ? 'Выберите альбом' : 'Choose album')}</option>
                ${albums.map(album => `<option value="${escapeHtml(album.id)}" ${picker.uploadAlbumId === album.id ? 'selected' : ''}>${escapeHtml(album.title || album.name || '')}</option>`).join('')}
              </select>` : `<p>${escapeHtml(state.language === 'ru' ? 'Сначала создайте альбом в разделе «Альбомы».' : 'Create an album in Albums first.')}</p>`}
            </div>` : ''}
          </div>`;
    }

    return `
        <div class="person-photo-picker-notice">
          ${
                replacing
                    ? 'This upload will be stored only inside this board and will not appear in Albums.'
                    : 'Uploaded images will stay local to this board and will not appear in Albums.'
            }
        </div>

        <div class="person-photos-adder-upload-panel">
          <div
            class="
              person-photo-upload-dropzone
              person-photos-adder-upload-dropzone
              ${drafts.length ? 'has-drafts' : ''}
            "
            data-geneo-image-dropzone>

            <input
              type="file"
              accept="${PHOTO_UPLOAD_ALLOWED_TYPES.join(',')}"
              ${replacing ? '' : 'multiple'}
              data-geneo-image-file
              hidden>

            <div class="person-photo-upload-prompt">
              ${icon.import}

              <strong>${promptTitle}</strong>

              <p>
                JPEG, PNG, or WebP up to
                ${maxMegabytes} MB each.
              </p>

              <button
                class="button primary"
                type="button"
                data-geneo-image-choose-file>
                ${chooseLabel}
              </button>
            </div>
          </div>

          ${renderGeneographImageUploadErrors()}

          ${
                drafts.length
                    ? `
                <div
                  class="
                    person-photo-candidate-grid
                    person-photos-adder-upload-grid
                  ">
                  ${drafts
                        .map(renderGeneographImageUploadDraft)
                        .join('')}
                </div>
              `
                    : ''
            }
        </div>
      `;
}

function renderGeneographAddImageResults()
{
    const picker = state.geneoImagePicker;
    const single = ['replace', 'avatar'].includes(picker.mode);
    if (single && picker.addView === 'selected' && picker.sourceTab === 'upload') return '';
    const projectId = geneoImagePickerProjectId();
    const selected = geneoImagePickerSelectedProjectIds();
    let photos = getProjectPhotos(projectId).filter(photo => !photo.deletedAt);
    if (picker.addView === 'selected') photos = photos.filter(photo => selected.has(photo.id));
    if (picker.albumScopeId) photos = photos.filter(photo => (photo.albumIds || []).includes(picker.albumScopeId));
    const filters = picker.filters || {};
    const boardPerson = picker.mode === 'avatar' ? getGeneographPerson(picker.personId) : null;
    photos = photos.filter(photo => (picker.mode === 'avatar' && photo.id === boardPerson?.photoId)
        || ((!filters.favorite || photo.favorite)
            && (!filters.person || getPhotoPeople(photo).some(person => person.id === filters.person))
            && (!filters.tagged || (boardPerson && photoIsTaggedWithPerson(photo, boardPerson.treePersonId || boardPerson.id)))));
    const query = picker.search.trim().toLowerCase();
    if (query) photos = photos.filter(photo => photoSearchText(photo).includes(query));
    photos.sort((a, b) => picker.imageSort === 'updated'
        ? String(b.updatedAt || '').localeCompare(String(a.updatedAt || ''))
        : picker.imageSort === 'date'
            ? String(formatPhotoDate(b)).localeCompare(String(formatPhotoDate(a)))
            : geneoImageRecordName(a).localeCompare(geneoImageRecordName(b), state.language === 'ru' ? 'ru' : 'en'));

    if (!photos.length)
    {
        if (picker.addView === 'selected' && picker.uploadDrafts.length) return '';
        return `<div class="rp-empty"><p>${escapeHtml(state.language === 'ru' ? 'Фотографии не найдены.' : 'No photos found.')}</p>
          ${picker.mode === 'avatar' && filters.tagged ? `<button type="button" class="button secondary" data-geneo-image-show-all>${escapeHtml(state.language === 'ru' ? 'Показать все фотографии' : 'Show all photos')}</button>` : ''}</div>`;
    }

    return `<div class="rp-results rp-photo-grid">${photos.map(photo =>
    {
        const title = geneoImageRecordName(photo);
        const checked = selected.has(photo.id);
        const meta = picker.mode === 'avatar' && photo.id === getGeneographPerson(picker.personId)?.photoId
            ? t('Current photo') : '';
        return `<article class="rp-record ${checked ? 'is-selected' : ''}">
          ${single ? `<button type="button" class="rp-record-select" data-geneo-image-candidate="${escapeHtml(photo.id)}" aria-pressed="${checked}" aria-label="${escapeHtml(`Use ${title}`)}">` : '<label class="rp-record-select">'}
            <div class="rp-thumbnail">${renderPhotoThumbnail(photo, { label: title })}</div>
            <span class="rp-record-copy"><span class="rp-record-title"><strong title="${escapeHtml(title)}">${escapeHtml(title)}</strong></span>
              ${photo.caption ? `<span class="rp-description">${escapeHtml(photo.caption)}</span>` : ''}
              ${meta ? `<small title="${escapeHtml(meta)}">${escapeHtml(meta)}</small>` : ''}
            </span>
            ${single ? `<span class="rp-selection-mark" data-geneo-image-candidate-check aria-hidden="true">${icon.check}</span>` : `<input type="checkbox"
              data-geneo-image-candidate="${escapeHtml(photo.id)}"
              aria-label="${escapeHtml(`${checked ? 'Deselect' : 'Select'} ${title}`)}" ${checked ? 'checked' : ''}>`}
          ${single ? '</button>' : '</label>'}
        </article>`;
    }).join('')}</div>`;
}

function renderGeneographAddImageModal({ focusSelector = '' } = {})
{
    const picker = state.geneoImagePicker;
    const replacing = picker.mode === 'replace';
    const avatarMode = picker.mode === 'avatar';
    const single = replacing || avatarMode;
    const boardPerson = avatarMode ? getGeneographPerson(picker.personId) : null;
    const count = geneoImagePickerPendingCount();
    const albumReady = !picker.addUploadsToAlbum || getProjectAlbums(geneoImagePickerProjectId())
        .some(album => album.id === picker.uploadAlbumId && !album.deleted);
    const albums = getProjectAlbums(geneoImagePickerProjectId()).filter(album => !album.deleted);
    const scope = albums.find(album => album.id === picker.albumScopeId);
    const view = picker.addView;
    const text = (en, ru) => escapeHtml(state.language === 'ru' ? ru : en);

    openModal(`<section class="modal resource-picker geneo-image-add-modal ${view === 'upload' ? `rp-upload-staging ${picker.uploadDrafts.length ? 'has-items' : ''}` : ''}" data-resource-picker="photos"
      data-geneo-image-picker role="dialog" aria-modal="true" aria-labelledby="geneoImagePickerTitle">
      <header class="modal-header"><div><h2 id="geneoImagePickerTitle">${avatarMode ? escapeHtml(t('Change photo for {name}').replace('{name}', geneoPersonDisplayName(boardPerson))) : escapeHtml(t(replacing ? 'Replace image' : 'Add images'))}</h2>
        <p>${avatarMode ? escapeHtml(t('This photo will appear only on this board.')) : escapeHtml(t(replacing ? 'Choose one project photo or upload a replacement stored locally in this board.'
            : 'Select project photos, upload new images, or combine both sources in one addition.'))}</p></div>
        <button type="button" class="close-button" ${avatarMode ? 'data-geneo-avatar-cancel' : 'data-close'} aria-label="${text('Close', 'Закрыть')}">${icon.close}</button>
      </header>
      <div class="rp-toolbar">
        <button type="button" class="button secondary" data-geneo-image-browse>${icon.folder}<span>${text('Browse', 'Обзор')}</span></button>
        <label class="app-search-field rp-search">${icon.search}<input type="search" data-geneo-image-search
          value="${escapeHtml(picker.search)}" aria-label="${text('Search', 'Поиск')}" placeholder="${text('Search', 'Поиск')}"></label>
        <button type="button" class="icon-button ${avatarMode && picker.filters?.tagged ? 'is-active' : ''}" data-geneo-image-filters aria-label="${text('Filters', 'Фильтры')}" aria-expanded="false" aria-pressed="${Boolean(avatarMode && picker.filters?.tagged)}" title="${text('Filters', 'Фильтры')}">${icon.filter}</button>
        <div class="rp-sort">${icon.sortLines}<select data-geneo-image-sort aria-label="${text('Sort', 'Сортировка')}">
          <option value="name" ${picker.imageSort === 'name' ? 'selected' : ''}>${text('Name', 'Название')}</option>
          <option value="updated" ${picker.imageSort === 'updated' ? 'selected' : ''}>${text('Recently updated', 'Недавно изменённые')}</option>
          <option value="date" ${picker.imageSort === 'date' ? 'selected' : ''}>${text('Photo date', 'Дата фотографии')}</option>
        </select><span class="rp-sort-chevron" aria-hidden="true">${icon.chevron}</span></div>
        <button type="button" class="button secondary rp-create" data-geneo-image-show-upload>${icon.plus}<span>${text('Upload photos', 'Загрузить фотографии')}</span></button>
      </div>
      <nav class="rp-path" aria-label="${text('Location', 'Расположение')}">
        <span class="rp-path-icon" aria-hidden="true">${icon.folder}</span>
        <span aria-current="page">${view === 'upload' ? text('Upload photos', 'Загрузить фотографии') : view === 'browse' ? text('Browse', 'Обзор') : view === 'selected' ? text('Selected', 'Выбрано') : escapeHtml(scope?.title || scope?.name || (state.language === 'ru' ? 'Все фотографии' : 'All photos'))}</span>
      </nav>
      <div class="rp-content" tabindex="-1">
        ${view === 'upload' ? renderGeneographImageUploadPanel()
            : view === 'browse' ? `<div class="rp-scopes"><button type="button" class="rp-scope" data-geneo-image-scope="">${icon.folder}<span>${text('All photos', 'Все фотографии')}</span>${icon.chevron}</button>
                ${albums.map(album => `<button type="button" class="rp-scope" data-geneo-image-scope="${escapeHtml(album.id)}">${icon.folder}<span>${escapeHtml(album.title || album.name || '')}</span>${icon.chevron}</button>`).join('')}</div>`
            : `<div data-geneo-image-project-results>${renderGeneographAddImageResults()}</div>
                ${view === 'selected' && picker.uploadDrafts.length && (!single || picker.sourceTab === 'upload') ? `<section class="geneo-image-selected-uploads">
                  <h3>${text('Uploaded images', 'Загруженные изображения')}</h3>
                  <div class="rp-upload-tiles">${picker.uploadDrafts.map(renderGeneographImageUploadDraft).join('')}</div>
                </section>` : ''}`}
      </div>
      <footer class="modal-footer">
        <div class="rp-footer-left">${avatarMode && (boardPerson?.photoId || boardPerson?.photoAssetId) ? `<button type="button" class="button secondary" data-geneo-avatar-remove>${escapeHtml(t('Remove current photo'))}</button>` : `<button type="button" class="rp-selected" data-geneo-image-selected ${count ? '' : 'disabled'}>${text('Selected', 'Выбрано')} (${count}) ${icon.chevron}</button>`}</div>
        <div class="rp-footer-actions"><button type="button" class="button secondary" ${avatarMode ? 'data-geneo-avatar-cancel' : 'data-close'}>${escapeHtml(t('Cancel'))}</button>
          <button type="button" class="button primary" data-geneo-image-confirm ${count && !picker.uploadBusy && albumReady ? '' : 'disabled'}>${escapeHtml(geneoImagePickerActionLabel(count))}</button></div>
      </footer>
    </section>`);
    bindGeneographImagePickerModal();
    rpEnhanceSortControl(modalBackdrop.querySelector('.geneo-image-add-modal'), '[data-geneo-image-sort]');
    bindGeneographAddImageModal();
    if (focusSelector) requestAnimationFrame(() => modalBackdrop.querySelector(focusSelector)?.focus());
}

function renderGeneographImagePickerModal({
    focusSelector = ''
} = {})
{
    const picker = state.geneoImagePicker;
    if (!picker.open) return;
    if (picker.mode === 'add' || picker.mode === 'replace' || (picker.mode === 'avatar' && picker.step === 'choose'))
    {
        renderGeneographAddImageModal({ focusSelector });
        return;
    }
    if (picker.mode === 'avatar' && picker.step === 'adjust')
    {
        renderGeneographAvatarAdjustModal();
        return;
    }

    const replacing = ['replace', 'avatar'].includes(picker.mode);
    const avatarMode = picker.mode === 'avatar';
    const boardPerson = avatarMode ? getGeneographPerson(picker.personId) : null;
    const canRemove = Boolean(boardPerson?.photoId || boardPerson?.photoAssetId);
    const count = geneoImagePickerPendingCount();
    const albumReady = !picker.addUploadsToAlbum || (picker.uploadAlbumId &&
        getProjectAlbums(geneoImagePickerProjectId()).some(album => album.id === picker.uploadAlbumId && !album.deleted));
    const canConfirm = count > 0 && !picker.uploadBusy && albumReady;

    openModal(`
        <div
          class="
            modal
            person-photo-picker-modal
            geneo-image-picker-modal
            ${picker.mode === 'add' ? 'rp-upload-staging geneo-image-add-modal' : ''}
            ${picker.mode === 'add' && picker.uploadDrafts.length ? 'has-items' : ''}
          "
          data-geneo-image-picker
          role="dialog"
          aria-modal="true"
          aria-labelledby="geneoImagePickerTitle">

          <div class="modal-header">
            <div>
              <h2 id="geneoImagePickerTitle">
                 ${avatarMode ? escapeHtml(t('Change photo for {name}').replace('{name}', geneoPersonDisplayName(boardPerson))) : replacing ? 'Replace image' : escapeHtml(t('Add images'))}
              </h2>

              <p>
                ${
                    avatarMode
                        ? escapeHtml(t('This photo will appear only on this board.'))
                        : replacing
                        ? 'Choose one project photo or upload a replacement stored locally in this board.'
                        : escapeHtml(t('Select project photos, upload new images, or combine both sources in one addition.'))
                }
              </p>
            </div>

            <button
              class="close-button"
              type="button"
              ${avatarMode ? 'data-geneo-avatar-cancel' : 'data-close'}
              aria-label="${avatarMode ? escapeHtml(t('Close')) : 'Close'}">
              ${icon.close}
            </button>
          </div>

          <div
            class="
              modal-body
              person-photo-picker-body
            ">
            ${avatarMode ? `<div class="person-photo-picker-step" aria-label="${escapeHtml(t('Choose photo'))}">${escapeHtml(t('Choose photo'))}</div>` : ''}
            <div
              class="person-photo-picker-tabs"
              role="tablist"
              aria-label="${escapeHtml(avatarMode ? t('Avatar source') : t('Image source'))}">

              <button
                class="person-photo-picker-tab"
                type="button"
                role="tab"
                data-geneo-image-tab="project"
                aria-selected="${
                    picker.sourceTab
                  === 'project'
                }">
                 ${escapeHtml(t('Project photos'))}
              </button>

              <button
                class="person-photo-picker-tab"
                type="button"
                role="tab"
                data-geneo-image-tab="upload"
                aria-selected="${
                    picker.sourceTab
                  === 'upload'
                }">
                 ${escapeHtml(t('Upload new'))}
              </button>
            </div>

            <div
              role="tabpanel"
              aria-label="${
                    picker.sourceTab
                === 'project'
                        ? 'Project photos'
                        : 'Upload new images'
                }">
              ${
                    picker.sourceTab
                === 'project'
                        ? renderGeneographImageProjectPanel()
                        : renderGeneographImageUploadPanel()
                }
            </div>
          </div>

          <div
            class="
              modal-footer
              person-photos-adder-footer
              geneo-image-picker-footer
            "
            data-geneo-image-footer
            ${
                 count > 0 || canRemove || avatarMode || picker.mode === 'add'
                    ? ''
                    : 'hidden'
            }>

            <span
              class="person-photos-adder-count"
              data-geneo-image-count>
              ${escapeHtml(
                    geneoImagePickerCountLabel(
                        count
                    )
                )}
            </span>

            <div class="modal-footer-actions">
              ${canRemove ? `<button class="button ghost" type="button" data-geneo-avatar-remove>${escapeHtml(t('Remove board photo'))}</button>` : ''}
              <button
                class="button secondary"
                type="button"
                 ${avatarMode ? 'data-geneo-avatar-cancel' : 'data-close'}>
                 ${avatarMode ? escapeHtml(t('Cancel')) : 'Cancel'}
              </button>

              <button
                class="button primary"
                type="button"
                data-geneo-image-confirm
                ${
                    canConfirm
                        ? ''
                        : 'disabled'
                }>
                ${
                    picker.uploadBusy
                        ? 'Preparing images…'
                        : escapeHtml(
                            geneoImagePickerActionLabel(
                                count
                            )
                        )
                }
              </button>
            </div>
          </div>
        </div>
      `);

    bindGeneographImagePickerModal();

    if (focusSelector)
    {
        requestAnimationFrame(() =>
        {
            modalBackdrop
                .querySelector(focusSelector)
                ?.focus();
        });
    }
}

function refreshGeneographImagePickerSelectionUi()
{
    const modal = modalBackdrop.querySelector(
        '[data-geneo-image-picker]'
    );

    if (!modal) return;

    const picker = state.geneoImagePicker;
    const selectedIds =
        geneoImagePickerSelectedProjectIds();

    modal
        .querySelectorAll('[data-geneo-image-candidate]')
        .forEach(card =>
        {
            const photoId =
                card.dataset.geneoImageCandidate;

            const selected =
                selectedIds.has(photoId);

            card.setAttribute(
                'aria-pressed',
                String(selected)
            );
            card.closest('.rp-record')?.classList.toggle('is-selected', selected);

            if (card.matches('input[type="checkbox"]'))
            {
                card.checked = selected;
                card.closest('.rp-record')?.classList.toggle('is-selected', selected);
            }

            const title =
                card.querySelector(
                    '.person-photo-candidate-copy strong'
                )?.textContent
                || card.closest('.rp-record')?.querySelector('.rp-record-copy strong')?.textContent
                || 'image';

            card.setAttribute(
                'aria-label',
                ['replace', 'avatar'].includes(picker.mode)
                    ? `Use ${title}`
                    : `${selected ? 'Deselect' : 'Select'} ${title}`
            );

            const check = card.querySelector(
                '[data-geneo-image-candidate-check]'
            );

            if (check)
            {
                check.hidden = !selected;
            }
        });

    const count = geneoImagePickerPendingCount();

    const footer =
        modal.querySelector(
            '[data-geneo-image-footer]'
        );

    if (footer)
    {
        footer.hidden =
            count === 0 && !['avatar', 'add'].includes(picker.mode);
    }

    const countElement = modal.querySelector(
        '[data-geneo-image-count]'
    );

    if (countElement)
    {
        countElement.textContent =
            geneoImagePickerCountLabel(count);
    }

    const selectedButton = modal.querySelector('[data-geneo-image-selected]');
    if (selectedButton)
    {
        selectedButton.innerHTML = `${state.language === 'ru' ? 'Выбрано' : 'Selected'} (${count}) ${icon.chevron}`;
        selectedButton.disabled = count === 0;
    }

    const confirmButton = modal.querySelector(
        '[data-geneo-image-confirm]'
    );

    if (confirmButton)
    {
        confirmButton.disabled =
            count === 0 || picker.uploadBusy || (picker.addUploadsToAlbum &&
                !getProjectAlbums(geneoImagePickerProjectId()).some(album => album.id === picker.uploadAlbumId && !album.deleted));

        confirmButton.textContent =
            picker.uploadBusy
                ? 'Preparing images…'
                : geneoImagePickerActionLabel(count);
    }
}

function bindGeneographImageProjectResultActions(
    root = modalBackdrop
)
{
    root
        .querySelectorAll('[data-geneo-image-candidate]')
        .forEach(button =>
        {
            button.addEventListener('click', () =>
            {
                const photoId =
                    button.dataset.geneoImageCandidate;

                const selectedIds =
                    geneoImagePickerSelectedProjectIds();

                if (['replace', 'avatar'].includes(state.geneoImagePicker.mode))
                {
                    selectedIds.clear();
                    selectedIds.add(photoId);
                }
                else if (selectedIds.has(photoId))
                {
                    selectedIds.delete(photoId);
                }
                else
                {
                    selectedIds.add(photoId);
                }

                state.geneoImagePicker
                    .selectedProjectPhotoIds = [
                        ...selectedIds
                    ];

                /*
            * Update the cards and footer in place. Reopening the modal
            * here would reset its internal scroll position.
            */
                refreshGeneographImagePickerSelectionUi();
            });
        });

    root
        .querySelector('[data-geneo-image-clear-search]')
        ?.addEventListener('click', () =>
        {
            state.geneoImagePicker.search = '';

            renderGeneographImagePickerModal({
                focusSelector: '[data-geneo-image-search]'
            });
        });

    root
        .querySelectorAll('[data-geneo-image-show-upload]')
        .forEach(button =>
        {
            button.addEventListener('click', () =>
            {
                state.geneoImagePicker.sourceTab = 'upload';
                state.geneoImagePicker.addView = 'upload';

                renderGeneographImagePickerModal({
                    focusSelector:
                '[data-geneo-image-dropzone]'
                });
            });
        });
}

function updateGeneographImageProjectResults()
{
    const host = modalBackdrop.querySelector(
        '[data-geneo-image-project-results]'
    );

    if (!host) return;

    host.innerHTML = ['add', 'replace', 'avatar'].includes(state.geneoImagePicker.mode)
        ? renderGeneographAddImageResults()
        : renderGeneographImageProjectResults();
    bindGeneographImageProjectResultActions(host);
}

async function processGeneographImageUploads(fileList)
{
    const picker = state.geneoImagePicker;

    if (!picker.open) return;

    const replacing = ['replace', 'avatar'].includes(picker.mode);

    let files = Array.from(fileList || [])
        .filter(Boolean);

    if (replacing)
    {
        files = files.slice(0, 1);
    }
    else
    {
        const knownSignatures = new Set(
            (picker.uploadDrafts || [])
                .map(draft => draft.signature)
        );

        files = files.filter(file =>
        {
            const signature =
                photoUploadFileSignature(file);

            if (knownSignatures.has(signature))
            {
                return false;
            }

            knownSignatures.add(signature);
            return true;
        });
    }

    if (!files.length) return;

    const requestId =
        ++geneoImageUploadRequestId;

    picker.uploadBusy = true;
    picker.uploadErrors = [];

    refreshGeneographImagePickerSelectionUi();

    const results = await Promise.all(
        files.map(async file =>
        {
            try
            {
                return {
                    draft: await createPhotoUploadDraft(
                        file,
                        {
                            idPrefix:
                    'geneo-image-upload-draft'
                        }
                    ),
                    error: ''
                };
            }
            catch (error)
            {
                return {
                    draft: null,
                    error:
                error?.message
                || `${file.name || 'File'} — could not be read`
                };
            }
        })
    );

    if (
        requestId !== geneoImageUploadRequestId
        || !state.geneoImagePicker.open
    )
    {
        return;
    }

    const drafts = results
        .map(result => result.draft)
        .filter(Boolean);

    if (replacing)
    {
        /*
        * An invalid replacement should not discard a previously
        * prepared valid draft.
        */
        if (drafts.length)
        {
            picker.uploadDrafts = [drafts[0]];
        }
    }
    else
    {
        picker.uploadDrafts = [
            ...picker.uploadDrafts,
            ...drafts
        ];
    }

    picker.uploadErrors = results
        .map(result =>
        {
            if (!result.error || picker.mode !== 'avatar') return result.error;
            if (result.error.includes('unsupported file type')) return t('Use a JPEG, PNG, or WebP photo.');
            if (result.error.includes('larger than')) return t('Photo must be smaller than 20 MB.');
            return t('Could not read this photo. Choose another file.');
        })
        .filter(Boolean);

    picker.uploadBusy = false;

    renderGeneographImagePickerModal({
        focusSelector: '[data-geneo-image-dropzone]'
    });
}

function geneoImageBatchLayout(
    selections,
    diagram
)
{
    const items = selections.map(selection => ({
        selection,
        size: geneoImageNodeSize(selection.photo)
    }));

    if (items.length === 1)
    {
        const { width, height } = items[0].size;

        return [{
            ...items[0],
            position:
            nextGeneoObjectPosition(width, height)
        }];
    }

    const gap = 24;
    const columns = Math.min(
        4,
        Math.ceil(Math.sqrt(items.length))
    );

    const rows = Math.ceil(
        items.length / columns
    );

    const cellWidth =
        Math.max(...items.map(item => item.size.width))
        + gap;

    const cellHeight =
        Math.max(...items.map(item => item.size.height))
        + gap;

    const center =
        geneoCurrentViewportCenter()
        || geneoContentCenter();

    const baseX =
        center.x - (columns * cellWidth - gap) / 2;

    const baseY =
        center.y - (rows * cellHeight - gap) / 2;

    const basePositions = items.map((item, index) =>
    {
        const column = index % columns;
        const row = Math.floor(index / columns);

        return {
            x:
            baseX
            + column * cellWidth
            + (cellWidth - gap - item.size.width) / 2,

            y:
            baseY
            + row * cellHeight
            + (cellHeight - gap - item.size.height) / 2
        };
    });

    const existingNodes = diagram.nodes || [];

    const overlapsExistingNode = offset =>
        basePositions.some((position, index) =>
        {
            const width = items[index].size.width;
            const height = items[index].size.height;

            const candidate = {
                x: position.x + offset.x,
                y: position.y + offset.y
            };

            return existingNodes.some(node =>
                candidate.x < node.x + node.width + 18
            && candidate.x + width + 18 > node.x
            && candidate.y < node.y + node.height + 18
            && candidate.y + height + 18 > node.y
            );
        });

    const step = Math.max(
        80,
        Math.round(
            Math.min(cellWidth, cellHeight) / 2
        )
    );

    const offsets = [{ x: 0, y: 0 }];

    for (let ring = 1; ring <= 12; ring += 1)
    {
        const distance = ring * step;

        offsets.push(
            { x: distance, y: 0 },
            { x: distance, y: distance },
            { x: 0, y: distance },
            { x: -distance, y: distance },
            { x: -distance, y: 0 },
            { x: -distance, y: -distance },
            { x: 0, y: -distance },
            { x: distance, y: -distance }
        );
    }

    const offset =
        offsets.find(candidate =>
            !overlapsExistingNode(candidate)
        )
        || offsets[0];

    return items.map((item, index) => ({
        ...item,
        position: {
            x: basePositions[index].x + offset.x,
            y: basePositions[index].y + offset.y
        }
    }));
}

function applyGeneographImagePickerSelection()
{
    const picker = state.geneoImagePicker;
    const selections =
        geneoImagePickerSelectedSources();

    const diagram =
        selectedGeneographDiagram();

    if (
        !picker.open
        || !selections.length
        || !diagram
        || picker.uploadBusy
    )
    {
        return;
    }

    const targetAlbum = picker.mode === 'add' && picker.addUploadsToAlbum
        ? getProjectAlbums(geneoImagePickerProjectId()).find(album => album.id === picker.uploadAlbumId && !album.deleted)
        : null;
    if (picker.mode === 'add' && picker.addUploadsToAlbum && !targetAlbum) return;

    if (targetAlbum)
    {
        for (const source of selections.filter(item => item.scope === 'board'))
        {
            const photo = createMediaFromPhotoUpload({
                projectId: geneoImagePickerProjectId(),
                draft: source.draft,
                idPrefix: 'geneo-album-photo'
            });
            if (!photo) return;
            photo.albumIds = [targetAlbum.id];
            source.scope = 'project';
            source.photo = photo;
        }
        touchProjectModified(sampleData.projects.find(project => project.id === geneoImagePickerProjectId()));
    }

    const replacing =
        picker.mode === 'replace';

    const existingNode = replacing
        ? getGeneographNode(picker.nodeId)
        : null;
    let focusNodeId = existingNode?.id || '';

    if (
        replacing
        && existingNode?.type !== 'image'
    )
    {
        return;
    }

    const selection = selections[0];
    const currentRef = existingNode?.imageRef;

    if (
        replacing
        && selection.scope === 'project'
        && currentRef?.scope === 'project'
        && currentRef.id === selection.photo.id
    )
    {
        resetGeneographImagePickerState();
        closeModal({ force: true });
        return;
    }

    geneoPushHistory();

    const createImageRef = source =>
    {
        if (source.scope === 'board')
        {
            const asset = createGeneographBoardAsset(
                source.draft,
                diagram
            );

            return asset
                ? {
                    scope: 'board',
                    id: asset.id
                }
                : null;
        }

        return {
            scope: 'project',
            id: source.photo.id
        };
    };

    if (replacing)
    {
        const imageRef =
            createImageRef(selection);

        if (!imageRef) return;

        existingNode.imageRef = imageRef;
        existingNode.imageCrop = null;
        delete existingNode.photoId;
        delete existingNode.title;
    }
    else
    {
        const defaults =
            geneoNodeDefaults('image');

        const layout =
            geneoImageBatchLayout(
                selections,
                diagram
            );

        let nextOrder =
            Math.max(
                0,
                ...diagram.nodes.map(
                    item => item.order || 0
                )
            );

        const addedNodeIds = [];

        layout.forEach(item =>
        {
            const imageRef =
                createImageRef(item.selection);

            if (!imageRef) return;

            nextOrder += 1;

            const node = {
                id: createRuntimeId('geneo-node'),
                type: 'image',
                imageRef,
                ...item.position,
                width: item.size.width,
                height: item.size.height,
                parentPanelId: null,
                order: nextOrder,
                visible: true,
                locked: false,
                appearance: {
                    ...defaults.appearance
                }
            };

            diagram.nodes.push(node);
            addedNodeIds.push(node.id);
        });

        if (!addedNodeIds.length) return;

        setGeneographNodeSelection(
            addedNodeIds,
            addedNodeIds.at(-1)
        );
        focusNodeId = addedNodeIds.at(-1) || '';
    }

    pruneGeneographBoardAssets(diagram);
    touchGeneographBoard();

    const addedCount = replacing
        ? 1
        : selections.length;

    const message = replacing
        ? 'Image replaced.'
        : `${addedCount} ${
            addedCount === 1 ? 'image' : 'images'
        } added to the board.`;

    resetGeneographImagePickerState();
    closeModal({ force: true });

    renderGeneographEditorPreserveScroll({
        preserveInspectorScroll: replacing
    });

    if (focusNodeId)
    {
        requestAnimationFrame(() =>
        {
            main
                .querySelector(
                    `[data-geneo-node="${CSS.escape(focusNodeId)}"]`
                )
                ?.focus({ preventScroll: true });
        });
    }

    showToast(message);
}

function bindGeneographImagePickerModal()
{
    if (state.geneoImagePicker.mode === 'avatar')
    {
        modalBackdrop.querySelectorAll('[data-geneo-avatar-cancel]').forEach(button =>
            button.addEventListener('click', cancelGeneographAvatarPicker));
        modalBackdrop.querySelector('[data-geneo-avatar-remove]')?.addEventListener('click', removeGeneographAvatarPhoto);
    }
    modalBackdrop
        .querySelectorAll('[data-geneo-image-tab]')
        .forEach(button =>
        {
            button.addEventListener('click', () =>
            {
                state.geneoImagePicker.sourceTab =
                    button.dataset.geneoImageTab;

                state.geneoImagePicker.uploadErrors = [];

                renderGeneographImagePickerModal({
                    focusSelector:
                `[data-geneo-image-tab="${button.dataset.geneoImageTab}"]`
                });
            });

            button.addEventListener('keydown', event =>
            {
                if (
                    !['ArrowLeft', 'ArrowRight']
                        .includes(event.key)
                )
                {
                    return;
                }

                event.preventDefault();

                state.geneoImagePicker.sourceTab =
                    state.geneoImagePicker.sourceTab === 'project'
                        ? 'upload'
                        : 'project';

                renderGeneographImagePickerModal({
                    focusSelector:
                `[data-geneo-image-tab="${state.geneoImagePicker.sourceTab}"]`
                });
            });
        });

    modalBackdrop
        .querySelector('[data-geneo-image-search]')
        ?.addEventListener('input', event =>
        {
            state.geneoImagePicker.search =
                event.target.value;

            if (['add', 'replace', 'avatar'].includes(state.geneoImagePicker.mode)
                && !['results', 'selected'].includes(state.geneoImagePicker.addView))
            {
                state.geneoImagePicker.addView = 'results';
                renderGeneographImagePickerModal({ focusSelector: '[data-geneo-image-search]' });
                return;
            }

            updateGeneographImageProjectResults();
        });

    bindGeneographImageProjectResultActions(
        modalBackdrop
    );

    const fileInput = modalBackdrop.querySelector(
        '[data-geneo-image-file]'
    );

    const albumCheckbox = modalBackdrop.querySelector('[data-geneo-image-add-to-album]');
    const albumSelect = modalBackdrop.querySelector('[data-geneo-image-album]');
    albumCheckbox?.addEventListener('change', () =>
    {
        state.geneoImagePicker.addUploadsToAlbum = albumCheckbox.checked;
        if (albumSelect)
        {
            albumSelect.hidden = !albumCheckbox.checked;
            albumSelect.disabled = !albumCheckbox.checked;
        }
        refreshGeneographImagePickerSelectionUi();
    });
    albumSelect?.addEventListener('change', () =>
    {
        state.geneoImagePicker.uploadAlbumId = albumSelect.value;
        refreshGeneographImagePickerSelectionUi();
    });

    bindUploadDropzoneChooser(modalBackdrop.querySelector('[data-geneo-image-dropzone]'), fileInput);

    modalBackdrop
        .querySelector('[data-geneo-image-choose-file]')
        ?.addEventListener('click', () =>
        {
            fileInput?.click();
        });

    fileInput?.addEventListener('change', () =>
    {
        processGeneographImageUploads(
            fileInput.files
        );
    });

    modalBackdrop
        .querySelectorAll(
            '[data-geneo-image-remove-upload]'
        )
        .forEach(button =>
        {
            button.addEventListener('click', () =>
            {
                const draftId =
                    button.dataset.geneoImageRemoveUpload;

                state.geneoImagePicker.uploadDrafts =
                    state.geneoImagePicker.uploadDrafts
                        .filter(draft =>
                            draft.id !== draftId
                        );

                state.geneoImagePicker.uploadErrors = [];

                renderGeneographImagePickerModal({
                    focusSelector:
                '[data-geneo-image-dropzone]'
                });
            });
        });

    const dropzone = modalBackdrop.querySelector(
        '[data-geneo-image-dropzone]'
    );

    if (dropzone)
    {
        ['dragenter', 'dragover'].forEach(type =>
        {
            dropzone.addEventListener(type, event =>
            {
                event.preventDefault();

                dropzone.classList.add(
                    'is-dragging'
                );
            });
        });

        ['dragleave', 'drop'].forEach(type =>
        {
            dropzone.addEventListener(type, event =>
            {
                event.preventDefault();

                dropzone.classList.remove(
                    'is-dragging'
                );
            });
        });

        dropzone.addEventListener('drop', event =>
        {
            processGeneographImageUploads(
                event.dataTransfer?.files
            );
        });
    }

    modalBackdrop
        .querySelector('[data-geneo-image-confirm]')
        ?.addEventListener(
            'click',
            state.geneoImagePicker.mode === 'avatar'
                ? advanceGeneographAvatarPicker
                : applyGeneographImagePickerSelection
        );
}

function bindGeneographAddImageModal()
{
    const picker = state.geneoImagePicker;
    const root = modalBackdrop.querySelector('.geneo-image-add-modal');
    root?.querySelector('[data-geneo-image-project-results]')?.addEventListener('click', event =>
    {
        if (!event.target.closest('[data-geneo-image-show-all]')) return;
        picker.filters = { favorite: false, person: '', tagged: false };
        const trigger = root.querySelector('[data-geneo-image-filters]');
        trigger.classList.remove('is-active');
        trigger.setAttribute('aria-pressed', 'false');
        updateGeneographImageProjectResults();
    });
    root?.querySelector('[data-geneo-image-filters]')?.addEventListener('click', () =>
    {
        const existing = root.querySelector('.rp-filter-panel');
        if (existing) { existing.remove(); root.querySelector('[data-geneo-image-filters]').setAttribute('aria-expanded', 'false'); return; }
        const panel = document.createElement('section');
        panel.className = 'rp-filter-panel';
        panel.setAttribute('role', 'dialog');
        panel.setAttribute('aria-label', state.language === 'ru' ? 'Фильтры' : 'Filters');
        panel.innerHTML = `<h3>${state.language === 'ru' ? 'Фильтры' : 'Filters'}</h3>${rpPhotoFilterFieldsMarkup(geneoImagePickerProjectId(), picker.filters, { tagged: picker.mode === 'avatar' })}
          <div class="rp-filter-actions"><button class="button secondary" type="button" data-geneo-clear-filters>${state.language === 'ru' ? 'Сбросить фильтры' : 'Clear filters'}</button>
          <button class="button primary" type="button" data-geneo-done-filters>${state.language === 'ru' ? 'Готово' : 'Done'}</button></div>`;
        root.append(panel);
        const trigger = root.querySelector('[data-geneo-image-filters]');
        const bounds = root.getBoundingClientRect();
        const target = trigger.getBoundingClientRect();
        panel.style.top = `${target.bottom - bounds.top + 8}px`;
        panel.style.right = bounds.width <= 600 ? '12px' : '24px';
        panel.style.maxHeight = `${Math.max(180, bounds.bottom - target.bottom - 100)}px`;
        trigger.setAttribute('aria-expanded', 'true');
        rpBindPhotoFilterFields(panel.querySelector('.rp-photo-filters'), picker.filters, values =>
        {
            picker.filters = values;
            trigger.classList.toggle('is-active', Boolean(picker.mode === 'avatar' && values.tagged));
            trigger.setAttribute('aria-pressed', String(Boolean(picker.mode === 'avatar' && values.tagged)));
            updateGeneographImageProjectResults();
        });
        panel.querySelector('[data-geneo-clear-filters]').addEventListener('click', () =>
        {
            picker.filters = { favorite: false, person: '', tagged: false };
            trigger.classList.remove('is-active');
            trigger.setAttribute('aria-pressed', 'false');
            panel.remove(); trigger.setAttribute('aria-expanded', 'false');
            updateGeneographImageProjectResults();
        });
        panel.querySelector('[data-geneo-done-filters]').addEventListener('click', () =>
        {
            panel.remove(); trigger.setAttribute('aria-expanded', 'false'); trigger.focus();
        });
        panel.addEventListener('keydown', event =>
        {
            if (event.key !== 'Escape') return;
            event.stopPropagation();
            panel.remove(); trigger.setAttribute('aria-expanded', 'false'); trigger.focus();
        });
        panel.querySelector('input')?.focus();
    });
    root?.addEventListener('pointerdown', event =>
    {
        if (event.target.closest('.rp-filter-panel,[data-geneo-image-filters]')) return;
        root.querySelector('.rp-filter-panel')?.remove();
        root.querySelector('[data-geneo-image-filters]').setAttribute('aria-expanded', 'false');
    });
    modalBackdrop.querySelector('[data-geneo-image-browse]')?.addEventListener('click', () =>
    {
        picker.addView = picker.addView === 'browse' ? 'results' : 'browse';
        if (['replace', 'avatar'].includes(picker.mode)) picker.sourceTab = 'project';
        renderGeneographImagePickerModal({ focusSelector: '[data-geneo-image-browse]' });
    });
    modalBackdrop.querySelector('[data-geneo-image-selected]')?.addEventListener('click', () =>
    {
        picker.addView = picker.addView === 'selected' ? 'results' : 'selected';
        renderGeneographImagePickerModal({ focusSelector: '[data-geneo-image-selected]' });
    });
    modalBackdrop.querySelectorAll('[data-geneo-image-scope]').forEach(button =>
        button.addEventListener('click', () =>
        {
            picker.albumScopeId = button.dataset.geneoImageScope;
            picker.addView = 'results';
            if (['replace', 'avatar'].includes(picker.mode)) picker.sourceTab = 'project';
            renderGeneographImagePickerModal({ focusSelector: '[data-geneo-image-search]' });
        }));
    modalBackdrop.querySelector('[data-geneo-image-sort]')?.addEventListener('change', event =>
    {
        picker.imageSort = event.target.value;
        updateGeneographImageProjectResults();
    });
}

function geneoAvatarCropToRegion(value, photo)
{
    const crop = normalizePersonPhotoCrop(value);
    const aspect = (Number(photo?.width) || 1) / (Number(photo?.height) || 1);
    const width = Math.min(1, 1 / aspect) / crop.zoom;
    const height = Math.min(1, aspect) / crop.zoom;
    return normalizeFaceRegion({
        x: .5 + (crop.centerX - .5) * width - width / 2,
        y: .5 + (crop.centerY - .5) * height - height / 2,
        width, height
    }, FACE_REGION_MIN);
}

function geneoAvatarPickerSelection()
{
    return geneoImagePickerSelectedSources()[0] || null;
}

function geneoAvatarPickerRestoreFocus(picker)
{
    if (!picker?.originNodeId) return;
    requestAnimationFrame(() => main.querySelector(
        `[data-geneo-avatar-node="${CSS.escape(picker.originNodeId)}"][data-geneo-avatar-location="${picker.originLocation}"]`
    )?.focus({ preventScroll: true }));
}

function closeGeneographAvatarPicker({ render = false } = {})
{
    const picker = { ...state.geneoImagePicker };
    resetGeneographImagePickerState();
    closeModal({ force: true });
    if (render) renderGeneographEditorPreserveScroll({ preserveInspectorScroll: true, preserveSidebarScroll: true });
    geneoAvatarPickerRestoreFocus(picker);
}

function cancelGeneographAvatarPicker()
{
    closeGeneographAvatarPicker();
}

function advanceGeneographAvatarPicker()
{
    const picker = state.geneoImagePicker;
    const selection = geneoAvatarPickerSelection();
    if (picker.mode !== 'avatar' || !selection || picker.uploadBusy) return;
    const person = getGeneographPerson(picker.personId);
    if (!person) return;
    const sameSource = selection.scope === 'project'
        ? person.photoId === selection.photo.id
        : person.photoAssetId === selection.draft?.id;
    picker.avatarRegion = sameSource
        ? normalizeFaceRegion(person.photoRegion, FACE_REGION_MIN)
            || (person.photoCrop ? geneoAvatarCropToRegion(person.photoCrop, selection.photo) : { ...FACE_REGION_DEFAULT })
        : { ...FACE_REGION_DEFAULT };
    picker.step = 'adjust';
    renderGeneographAvatarAdjustModal();
}

function renderGeneographAvatarAdjustModal()
{
    const picker = state.geneoImagePicker;
    const selection = geneoAvatarPickerSelection();
    const person = getGeneographPerson(picker.personId);
    if (!selection || !person) return;
    const photo = selection.photo;
    const region = normalizeFaceRegion(picker.avatarRegion, FACE_REGION_MIN) || { ...FACE_REGION_DEFAULT };
    picker.avatarRegion = region;
    const preview = () => renderPersonPhotoRegionMedia(photo, region);
    openModal(`<div class="modal person-photo-picker-modal geneo-avatar-picker-modal" data-geneo-image-picker data-geneo-avatar-adjust role="dialog" aria-modal="true" aria-labelledby="geneoAvatarAdjustTitle">
      <div class="modal-header"><div><h2 id="geneoAvatarAdjustTitle">${escapeHtml(t('Change photo for {name}').replace('{name}', geneoPersonDisplayName(person)))}</h2><p>${escapeHtml(t('This photo will appear only on this board.'))}</p></div>
        <button class="close-button" type="button" data-geneo-avatar-cancel aria-label="${escapeHtml(t('Close'))}">${icon.close}</button></div>
      <div class="modal-body person-photo-picker-body">
        <div class="person-photo-picker-step" aria-label="${escapeHtml(t('Adjust photo'))}">${escapeHtml(t('Adjust photo'))}</div>
        <div class="person-photo-adjust-layout">
          <div class="person-photo-crop-column">
            ${renderFaceRegionSelector(photo, region)}
            <p class="person-photo-crop-hint">${escapeHtml(t('Drag to select a face. Move the box or drag its corner to adjust it.'))}</p>
            <button class="person-photo-tool-button" type="button" data-geneo-avatar-reset>${escapeHtml(t('Reset area'))}</button>
          </div>
          <aside class="person-photo-preview-column" aria-label="${escapeHtml(t('Avatar previews'))}">
            <div class="person-photo-preview-card"><strong>${escapeHtml(t('Card preview'))}</strong><div class="person-photo-preview-avatar geneo-card">${preview()}</div></div>
            <div class="person-photo-preview-card"><strong>${escapeHtml(t('Inspector preview'))}</strong><div class="person-photo-preview-avatar geneo-inspector-preview">${preview()}</div></div>
          </aside>
        </div>
      </div>
      <div class="modal-footer"><button class="button secondary" type="button" data-geneo-avatar-back>${escapeHtml(t('Back'))}</button><div class="modal-footer-actions">
        <button class="button secondary" type="button" data-geneo-avatar-cancel>${escapeHtml(t('Cancel'))}</button>
        <button class="button primary" type="button" data-geneo-avatar-save>${escapeHtml(t('Use photo'))}</button>
      </div></div></div>`);
    bindGeneographAvatarAdjustModal();
    requestAnimationFrame(() => modalBackdrop.querySelector('[data-face-region-box]')?.focus());
}

function bindGeneographAvatarAdjustModal()
{
    const root = modalBackdrop.querySelector('[data-geneo-avatar-adjust]');
    if (!root) return;
    bindFaceRegionSelector(root,
        () => state.geneoImagePicker.avatarRegion,
        region =>
        {
            state.geneoImagePicker.avatarRegion = region;
            root.querySelectorAll('.person-photo-region-preview').forEach(preview =>
            {
                preview.dataset.faceRegion = JSON.stringify(region);
                positionFaceRegionMedia(preview);
            });
        });
    root.querySelector('[data-geneo-avatar-reset]')?.addEventListener('click', () =>
    {
        state.geneoImagePicker.avatarRegion = { ...FACE_REGION_DEFAULT };
        renderGeneographAvatarAdjustModal();
    });
    root.querySelector('[data-geneo-avatar-back]')?.addEventListener('click', () =>
    {
        state.geneoImagePicker.step = 'choose';
        renderGeneographImagePickerModal();
    });
    root.querySelector('[data-geneo-avatar-save]')?.addEventListener('click', saveGeneographAvatarPhoto);
    root.querySelectorAll('[data-geneo-avatar-cancel]').forEach(button => button.addEventListener('click', cancelGeneographAvatarPicker));
}

function saveGeneographAvatarPhoto()
{
    const picker = state.geneoImagePicker;
    const board = selectedGeneographBoard();
    const person = getGeneographPerson(picker.personId);
    const selection = geneoAvatarPickerSelection();
    if (!board || board.id !== picker.boardId || !person || !selection || picker.step !== 'adjust') return;
    const projectPhoto = selection.scope === 'project'
        ? getPhoto(selection.photo.id, { projectId: board.projectId })
        : null;
    const existingAsset = selection.scope === 'board'
        ? getGeneographBoardAsset(selection.draft?.id, board.diagram)
        : null;
    if (selection.scope === 'project' ? !projectPhoto || projectPhoto.deletedAt : !existingAsset && !photoUploadDraftIsValid(selection.draft))
    {
        modalBackdrop.querySelector('[data-geneo-avatar-save]')?.insertAdjacentHTML('beforebegin', `<span class="geneo-avatar-error" role="alert">${escapeHtml(t('This photo is no longer available. Choose another.'))}</span>`);
        return;
    }
    const region = normalizeFaceRegion(picker.avatarRegion, FACE_REGION_MIN) || { ...FACE_REGION_DEFAULT };
    const unchangedSource = selection.scope === 'project'
        ? person.photoId === projectPhoto.id && !person.photoAssetId
        : person.photoAssetId === existingAsset?.id && !person.photoId;
    if (unchangedSource && !person.photoCrop
        && JSON.stringify(person.photoRegion) === JSON.stringify(region))
    {
        closeGeneographAvatarPicker();
        return;
    }
    geneoPushHistory();
    const asset = selection.scope === 'board'
        ? existingAsset || createGeneographBoardAsset(selection.draft, board.diagram)
        : null;
    person.photoId = projectPhoto?.id || null;
    person.photoAssetId = asset?.id || null;
    person.photoCrop = null;
    person.photoRegion = region;
    pruneGeneographBoardAssets(board.diagram);
    touchGeneographBoard();
    closeGeneographAvatarPicker({ render: true });
}

function removeGeneographAvatarPhoto()
{
    const picker = state.geneoImagePicker;
    const board = selectedGeneographBoard();
    const person = getGeneographPerson(picker.personId);
    if (!board || board.id !== picker.boardId || !person || (!person.photoId && !person.photoAssetId)) return;
    geneoPushHistory();
    person.photoId = null;
    person.photoAssetId = null;
    person.photoCrop = null;
    person.photoRegion = null;
    pruneGeneographBoardAssets(board.diagram);
    touchGeneographBoard();
    closeGeneographAvatarPicker({ render: true });
}

function openGeneographAvatarPicker(personId, { nodeId = null, location = 'card' } = {})
{
    const board = selectedGeneographBoard();
    const person = getGeneographPerson(personId);
    if (!board || !person) return;
    const photos = getProjectPhotos(board.projectId).filter(photo => !photo.deletedAt);
    const asset = person.photoAssetId ? getGeneographBoardAsset(person.photoAssetId, board.diagram) : null;
    resetGeneographImagePickerState();
    Object.assign(state.geneoImagePicker, {
        open: true, mode: 'avatar', boardId: board.id, personId,
        originNodeId: nodeId, originLocation: location,
        sourceTab: 'project',
        addView: 'results',
        filters: { favorite: false, person: '', tagged: photos.some(photo => photoIsTaggedWithPerson(photo, person.treePersonId || person.id)) },
        selectedProjectPhotoIds: person.photoId ? [person.photoId] : [],
        uploadDrafts: asset ? [{ ...asset }] : [],
        avatarRegion: normalizeFaceRegion(person.photoRegion, FACE_REGION_MIN)
    });
    if (!photos.length && !asset) state.geneoImagePicker.sourceTab = 'upload';
    renderGeneographImagePickerModal();
}

function openGeneographImagePicker({
    mode = 'add',
    nodeId = null
} = {})
{
    const replacing = mode === 'replace';

    const node = replacing
        ? getGeneographNode(nodeId)
        : null;

    if (
        replacing
        && node?.type !== 'image'
    )
    {
        return;
    }

    const photos = getProjectPhotos(
        geneoImagePickerProjectId()
    ).filter(photo => !photo.deletedAt);

    const currentRef = replacing
        ? normalizeGeneographImageRef(node)
        : null;

    resetGeneographImagePickerState();

    Object.assign(state.geneoImagePicker, {
        open: true,
        mode: replacing ? 'replace' : 'add',
        nodeId: replacing ? node.id : null,

        sourceTab:
          currentRef?.scope === 'project'
          || photos.length
              ? 'project'
              : 'upload',

        selectedProjectPhotoIds:
          currentRef?.scope === 'project'
              ? [currentRef.id]
              : [],

        uploadDrafts: [],
        uploadErrors: [],
        uploadBusy: false
    });

    if (replacing && state.geneoImagePicker.sourceTab === 'upload')
    {
        state.geneoImagePicker.addView = 'upload';
    }

    renderGeneographImagePickerModal();
}

function openGeneographTreePersonPicker()
{
    openGeneographTreeImport();
}

