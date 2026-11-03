function currentPlacesRouteInitialPersonId()
{
    const candidates = [
        state.placesRoutePersonId,
        state.selectedPersonId,
        state.selectedPeopleId
    ];

    return candidates.find(personId =>
    {
        const person =
            getPerson(personId);

        return Boolean(
            person
          && !person.deleted
          && person.projectId
            === currentProjectId()
        );
    }) || '';
}

function placesRoutePopupCount(
    count,
    singular,
    plural
)
{
    return `${
        count
    } ${
        t(
            count === 1
                ? singular
                : plural
        )
    }`;
}

function placesRoutePopupStopSummary(
    route
)
{
    return `${
        placesRoutePopupCount(
            route.stops.length,
            'stop',
            'stops'
        )
    } ${
        t('across')
    } ${
        placesRoutePopupCount(
            route.distinctPlaceCount,
            'place',
            'places'
        )
    }`;
}

function placesRoutePopupPersonLifeLine(
    person
)
{
    const birth =
        formatGenealogyDateLabel(
            person?.birth
        );

    const death =
        formatGenealogyDateLabel(
            person?.death
        );

    if (birth && death)
    {
        return `${birth} - ${death}`;
    }

    if (birth)
    {
        return birth;
    }

    if (death)
    {
        return `${t('Died')} ${death}`;
    }

    return t('Dates unknown');
}

function placesRoutePopupSelectionMatches(
    route
)
{
    if (
        !route?.configured
        || !state.placesShowRoute
    )
    {
        return false;
    }

    if (
        route.mode
          !== state.placesRouteMode
    )
    {
        return false;
    }

    return route.mode === 'person'
        ? route.personId
            === state.placesRoutePersonId
        : route.surname
            === state.placesRouteSurname;
}

function placesRoutePopupOptions(
    mode,
    people,
    surnames
)
{
    if (mode === 'surname')
    {
        return surnames.map(item =>
        {
            const route =
                derivePlacesRoute({
                    mode: 'surname',
                    surname: item.surname
                });

            return {
                value: item.surname,
                label: item.surname,

                selectedMeta:
              placesRoutePopupCount(
                  item.count,
                  'person',
                  'people'
              ),

                resultMeta:
              route.available
                  ? `${
                      placesRoutePopupCount(
                          item.count,
                          'person',
                          'people'
                      )
                  } · ${
                      placesRoutePopupCount(
                          route
                              .distinctPlaceCount,
                          'place',
                          'places'
                      )
                  }`
                  : `${
                      placesRoutePopupCount(
                          item.count,
                          'person',
                          'people'
                      )
                  } · ${
                      t(
                          'Not enough mapped history'
                      )
                  }`,

                person: null
            };
        });
    }

    return people.map(person =>
    {
        const route =
            derivePlacesRoute({
                mode: 'person',
                personId: person.id
            });

        return {
            value: person.id,

            label:
            person.names?.display
            || person.name
            || t('Unnamed person'),

            selectedMeta:
            placesRoutePopupPersonLifeLine(
                person
            ),

            resultMeta:
            route.available
                ? placesRoutePopupStopSummary(
                    route
                )
                : t(
                    'Not enough mapped history'
                ),

            person
        };
    });
}

function renderPlacesRoutePopupPicker({
    draft,
    options,
    matches,
    open,
    activeIndex
})
{
    const selectedValue =
        draft.mode === 'person'
            ? draft.personId
            : draft.surname;

    const selected =
        options.find(
            option =>
                option.value
              === selectedValue
        );

    const isSurname =
        draft.mode === 'surname';

    const label =
        t(
            isSurname
                ? 'Surname'
                : 'Person'
        );

    const placeholder =
        t(
            isSurname
                ? 'Search surnames...'
                : 'Search people...'
        );

    const emptyLabel =
        t(
            isSurname
                ? 'No matching surnames.'
                : 'No matching people.'
        );

    return `
        <div
          class="
            places-route-popup-field
          ">

          <span
            class="
              places-route-popup-label
            ">
            ${escapeHtml(label)}
          </span>

          <div
            class="
              places-route-popup-picker
              ${open ? 'is-open' : ''}
            ">

            ${
                selected && !open
                    ? `
                  <button
                    class="
                      places-route-popup-subject
                      ${
                            isSurname
                                ? 'is-surname'
                                : ''
                        }
                    "
                    type="button"
                    data-route-subject-open
                    aria-haspopup="listbox"
                    aria-expanded="false"
                    aria-controls="placesRouteSubjectResults">

                    ${
                        selected.person
                            ? renderPersonAvatar(
                                selected.person,
                                'places-route-popup-avatar',
                                {
                                    element: 'span',
                                    attrs:
                                'aria-hidden="true"'
                                }
                            )
                            : ''
                    }

                    <span
                      class="
                        places-route-popup-subject-copy
                      ">
                      <strong>
                        ${escapeHtml(
                            selected.label
                        )}
                      </strong>

                      <small>
                        ${escapeHtml(
                            selected
                                .selectedMeta
                        )}
                      </small>
                    </span>

                    <span
                      class="
                        places-route-popup-change
                      ">
                      ${escapeHtml(
                            t('Change')
                        )}
                    </span>
                  </button>
                `
                    : `
                  <label
                    class="
                      app-search-field
                      places-route-popup-search
                    "
                    aria-label="${
                        escapeHtml(
                            placeholder
                        )
                    }">

                    ${icon.search}

                    <input
                      id="placesRouteSubjectSearch"
                      type="search"
                      role="combobox"
                      autocomplete="off"
                      aria-autocomplete="list"
                      aria-expanded="${open}"
                      aria-controls="placesRouteSubjectResults"
                      aria-activedescendant="${
                            activeIndex >= 0
                                ? `placesRouteSubjectOption${activeIndex}`
                                : ''
                        }"
                      value="${escapeHtml(
                            draft.query
                        )}"
                      placeholder="${escapeHtml(
                            placeholder
                        )}">
                  </label>
                `
            }

            <div
              id="placesRouteSubjectResults"
              class="
                places-route-popup-options
              "
              role="listbox"
              ${open ? '' : 'hidden'}>

              ${
                    matches.length
                        ? matches
                            .map(
                                (
                                    option,
                                    index
                                ) =>
                                {
                                    const
                                        optionSelected =
                                            option.value
                              === selectedValue;

                                    return `
                            <button
                              id="placesRouteSubjectOption${index}"
                              class="
                                places-route-popup-option
                                ${
                                    isSurname
                                        ? 'is-surname'
                                        : ''
                                }
                                ${
                                    optionSelected
                                        ? 'selected'
                                        : ''
                                }
                                ${
                                    index
                                    === activeIndex
                                        ? 'highlighted'
                                        : ''
                                }
                              "
                              type="button"
                              role="option"
                              aria-selected="${
                                    optionSelected
                                }"
                              data-route-subject-value="${
                                    escapeHtml(
                                        option.value
                                    )
                                }">

                              ${
                                    option.person
                                        ? renderPersonAvatar(
                                            option.person,
                                            'places-route-popup-avatar',
                                            {
                                                element:
                                          'span',
                                                attrs:
                                          'aria-hidden="true"'
                                            }
                                        )
                                        : ''
                                }

                              <span
                                class="
                                  places-route-popup-option-copy
                                ">
                                <strong>
                                  ${escapeHtml(
                                        option.label
                                    )}
                                </strong>

                                <small>
                                  ${escapeHtml(
                                        option
                                            .resultMeta
                                    )}
                                </small>
                              </span>

                              ${
                                    optionSelected
                                        ? `
                                    <span
                                      class="
                                        places-route-popup-option-check
                                      "
                                      aria-hidden="true">
                                      ${icon.check}
                                    </span>
                                  `
                                        : '<span></span>'
                                }
                            </button>
                          `;
                                }
                            )
                            .join('')
                        : `
                    <span
                      class="
                        places-route-popup-empty
                      ">
                      ${escapeHtml(
                            emptyLabel
                        )}
                    </span>
                  `
                }
            </div>
          </div>
        </div>
      `;
}

function renderPlacesRoutePopupPreview(
    route
)
{
    if (!route.configured)
    {
        return `
          <p
            class="
              places-route-popup-hint
            ">
            ${escapeHtml(
                t(
                    route.mode === 'surname'
                        ? 'Select a surname to preview its route.'
                        : 'Select a person to preview their route.'
                )
            )}
          </p>
        `;
    }

    const excludedSummary =
        routeExcludedReasonSummary(
            route
        )
            .split(' - ')
            .join(' · ');

    const metrics = [
        route.mode === 'surname'
            ? placesRoutePopupCount(
                route.peopleCount,
                'person',
                'people'
            )
            : '',

        placesRoutePopupStopSummary(
            route
        ),

        route.dateSpan
    ].filter(Boolean);

    return `
        <div
          class="
            places-route-popup-preview
            ${
                route.available
                    ? ''
                    : 'is-unavailable'
            }
          "
          role="status"
          aria-live="polite">

          <span
            class="
              places-route-popup-preview-icon
            "
            aria-hidden="true">
            ${
                route.available
                    ? icon.check
                    : icon.warning
            }
          </span>

          <div
            class="
              places-route-popup-preview-copy
            ">

            <strong>
              ${escapeHtml(
                    t(
                        route.available
                            ? 'Route available'
                            : 'Not enough mapped history'
                    )
                )}
            </strong>

            ${
                route.available
                    ? metrics
                        .map(
                            metric => `
                        <span>
                          ${escapeHtml(
                                metric
                            )}
                        </span>
                      `
                        )
                        .join('')
                    : `
                  <span>
                    ${escapeHtml(
                        t(
                            'At least two dated, mapped places are needed.'
                        )
                    )}
                  </span>
                `
            }

            ${
                route.excludedCount > 0
                    ? `
                  <small>
                    <strong>
                      ${
                            route.excludedCount
                        } ${
                            escapeHtml(
                                t(
                                    route
                                        .excludedCount
                              === 1
                                        ? 'event excluded'
                                        : 'events excluded'
                                )
                            )
                        }
                    </strong>

                    ${
                        excludedSummary
                            ? `
                          <span>
                            ${escapeHtml(
                                excludedSummary
                            )}
                          </span>
                        `
                            : ''
                    }
                  </small>
                `
                    : ''
            }

            ${
                !route.available
              && route
                  .excludedByReason
                  .missingCoordinates > 0
                    ? `
                  <button
                    class="
                      places-route-popup-review
                    "
                    type="button"
                    data-route-review-unmapped>
                    ${escapeHtml(
                        t(
                            'Review unmapped places'
                        )
                    )}
                  </button>
                `
                    : ''
            }
          </div>
        </div>
      `;
}

function openPlacesRouteMenu(
    anchor
)
{
    closeMenu();

    const people =
        getPeople(
            currentProjectId()
        )
            .filter(
                person =>
                    person
              && !person.deleted
            )
            .sort(
                (
                    first,
                    second
                ) =>
                    (
                        first.names?.display
                || first.name
                || ''
                    )
                        .localeCompare(
                            second.names
                                ?.display
                  || second.name
                  || ''
                        )
            );

    const surnames =
        getProjectRouteSurnames();

    const draft = {
        mode:
          [
              'person',
              'surname'
          ].includes(
              state.placesRouteMode
          )
              ? state.placesRouteMode
              : 'person',

        personId:
          state
              .placesRoutePersonId
          || currentPlacesRouteInitialPersonId(),

        surname:
          state
              .placesRouteSurname
          || '',

        query: ''
    };

    let resultsOpen = false;
    let activeIndex = -1;

    const popover =
        document.createElement(
            'div'
        );

    popover.className =
        'menu-popover places-route-popover';

    popover.id =
        'projectMenu';

    popover.setAttribute(
        'role',
        'dialog'
    );

    popover.setAttribute(
        'aria-modal',
        'false'
    );

    popover.setAttribute(
        'aria-labelledby',
        'placesRoutePopoverTitle'
    );

    popover.setAttribute(
        'aria-describedby',
        'placesRoutePopoverDescription'
    );

    popover.addEventListener(
        'click',
        event =>
            event.stopPropagation()
    );

    const allOptions = () =>
        placesRoutePopupOptions(
            draft.mode,
            people,
            surnames
        );

    const visibleOptions = () =>
    {
        const query =
            draft.query
                .trim()
                .toLowerCase();

        return allOptions()
            .filter(
                option =>
                    !query
              || option.label
                  .toLowerCase()
                  .includes(query)
            )
            .slice(
                0,
                draft.mode === 'person'
                    ? 12
                    : 16
            );
    };

    const selectedValue = () =>
        draft.mode === 'person'
            ? draft.personId
            : draft.surname;

    const setSelectedValue =
        value =>
        {
            if (
                draft.mode === 'person'
            )
            {
                draft.personId = value;
            }
            else
            {
                draft.surname = value;
            }
        };

    const positionPopover = () =>
    {
        const rect =
            anchor
                .getBoundingClientRect();

        const width =
            Math.min(
                400,
                window.innerWidth - 24
            );

        popover.style.width =
            `${width}px`;

        popover.style.maxHeight = '';
        const availableBelow = window.innerHeight - rect.bottom - 20;
        const availableAbove = rect.top - 20;
        const placeBelow = availableBelow >= popover.offsetHeight
            || availableBelow >= availableAbove;
        const available = placeBelow ? availableBelow : availableAbove;
        popover.classList.toggle('is-constrained', popover.offsetHeight > available);
        popover.style.maxHeight = `${Math.max(0, available)}px`;
        const top = placeBelow ? rect.bottom + 8
            : rect.top - popover.offsetHeight - 8;

        popover.style.left =
            `${
                Math.max(
                    12,
                    Math.min(
                        rect.right - width,
                        window.innerWidth
                  - width
                  - 12
                    )
                )
            }px`;

        popover.style.top = `${Math.max(12, top)}px`;
    };

    const positionOptions = () =>
    {
        const picker =
            popover.querySelector(
                '.places-route-popup-picker.is-open'
            );

        const options =
            picker?.querySelector(
                '.places-route-popup-options:not([hidden])'
            );

        if (
            !picker
          || !options
        )
        {
            return;
        }

        const rect =
            picker.getBoundingClientRect();

        const availableBelow =
            window.innerHeight
          - rect.bottom
          - 12;

        const availableAbove =
            rect.top - 12;

        const expectedHeight =
            Math.min(
                options.scrollHeight,
                240
            );

        picker.classList.toggle(
            'opens-up',
            !popover.classList.contains('is-constrained')
          && availableBelow
            < expectedHeight
          && availableAbove
            > availableBelow
        );
    };

    const focusControl =
        controlName =>
        {
            const selectors = {
                search:
              '#placesRouteSubjectSearch',

                subject:
              '[data-route-subject-open]',

                personMode:
              '[data-route-mode="person"]',

                surnameMode:
              '[data-route-mode="surname"]'
            };

            requestAnimationFrame(
                () =>
                {
                    positionOptions();

                    const control =
                        popover
                            .querySelector(
                                selectors[
                                    controlName
                                ]
                            );

                    control?.focus({
                        preventScroll: true
                    });

                    if (
                        control
                instanceof
                  HTMLInputElement
                    )
                    {
                        control
                            .setSelectionRange(
                                control.value.length,
                                control.value.length
                            );
                    }

                    if (
                        activeIndex >= 0
                    )
                    {
                        popover
                            .querySelector(
                                `#placesRouteSubjectOption${activeIndex}`
                            )
                            ?.scrollIntoView({
                                block: 'nearest'
                            });
                    }
                }
            );
        };

    const selectOption =
        value =>
        {
            setSelectedValue(value);

            draft.query = '';
            resultsOpen = false;
            activeIndex = -1;

            renderPopover({
                focus: 'subject'
            });
        };

    const renderPopover = ({
        focus = ''
    } = {}) =>
    {
        const options =
            allOptions();

        const matches =
            visibleOptions();

        const draftRoute =
            derivePlacesRoute({
                mode: draft.mode,

                personId:
              draft.mode === 'person'
                  ? draft.personId
                  : '',

                surname:
              draft.mode === 'surname'
                  ? draft.surname
                  : ''
            });

        const currentRoute =
            currentPlacesRoute();

        const routeShown =
            placesRoutePopupSelectionMatches(
                draftRoute
            );

        const hasShownRoute =
            Boolean(
                state.placesShowRoute
            && currentRoute.configured
            );

        popover.innerHTML = `
          <div
            class="
              places-route-popover-head
            ">

            <strong
              id="placesRoutePopoverTitle">
              ${escapeHtml(
                    t('Calculate route')
                )}
            </strong>

            <span
              id="placesRoutePopoverDescription">
              ${escapeHtml(
                    t(
                        'Choose a person or surname. Routes use dated events with mapped places.'
                    )
                )}
            </span>
          </div>

          <div
            class="
              places-route-mode
            "
            role="group"
            aria-label="${escapeHtml(
                t('Route mode')
            )}">

            <button
              type="button"
              data-route-mode="person"
              class="${
                    draft.mode === 'person'
                        ? 'active'
                        : ''
                }"
              aria-pressed="${
                    draft.mode === 'person'
                }">
              ${escapeHtml(
                    t('Person')
                )}
            </button>

            <button
              type="button"
              data-route-mode="surname"
              class="${
                    draft.mode === 'surname'
                        ? 'active'
                        : ''
                }"
              aria-pressed="${
                    draft.mode === 'surname'
                }">
              ${escapeHtml(
                    t('Surname')
                )}
            </button>
          </div>

          <div
            class="
              places-route-popup-body
            ">

            ${renderPlacesRoutePopupPicker({
                draft,
                options,
                matches,
                open: resultsOpen,
                activeIndex
            })}

            ${renderPlacesRoutePopupPreview(
                draftRoute
            )}
          </div>

          <div
            class="
              places-route-popover-actions
            ">

            ${
                hasShownRoute
                    ? `
                  <button
                    class="
                      button
                      ghost
                    "
                    type="button"
                    data-route-clear>
                    ${escapeHtml(
                        t(
                            'Clear shown route'
                        )
                    )}
                  </button>
                `
                    : '<span></span>'
            }

            <button
              class="
                button
                primary
              "
              type="button"
              data-route-show
              ${
                    !draftRoute.available
                || routeShown
                        ? 'disabled'
                        : ''
                }>
              ${escapeHtml(
                    t(
                        routeShown
                            ? 'Route shown'
                            : 'Show route'
                    )
                )}
            </button>
          </div>
        `;

        popover
            .querySelectorAll(
                '[data-route-mode]'
            )
            .forEach(button =>
            {
                button.addEventListener(
                    'click',
                    () =>
                    {
                        const mode =
                            button.dataset
                                .routeMode;

                        if (
                            mode === draft.mode
                        )
                        {
                            return;
                        }

                        draft.mode = mode;
                        draft.query = '';
                        resultsOpen = false;
                        activeIndex = -1;

                        renderPopover({
                            focus:
                    mode === 'person'
                        ? 'personMode'
                        : 'surnameMode'
                        });
                    }
                );
            });

        popover
            .querySelector(
                '[data-route-subject-open]'
            )
            ?.addEventListener(
                'click',
                () =>
                {
                    draft.query = '';
                    resultsOpen = true;
                    activeIndex = -1;

                    renderPopover({
                        focus: 'search'
                    });
                }
            );

        const search =
            popover.querySelector(
                '#placesRouteSubjectSearch'
            );
        let openBeforePointer = null;

        const openResults = () =>
        {
            if (resultsOpen)
            {
                return;
            }

            resultsOpen = true;
            activeIndex = -1;

            renderPopover({
                focus: 'search'
            });
        };

        search?.addEventListener(
            'focus',
            openResults
        );

        search?.addEventListener(
            'pointerdown',
            () =>
            {
                openBeforePointer = resultsOpen;
            }
        );

        search?.addEventListener(
            'click',
            () =>
            {
                const wasOpen = openBeforePointer;
                openBeforePointer = null;
                if (wasOpen === true)
                {
                    resultsOpen = false;
                    activeIndex = -1;
                    popover.querySelector('#placesRouteSubjectResults').hidden = true;
                    search.setAttribute('aria-expanded', 'false');
                    search.removeAttribute('aria-activedescendant');
                }
                else if (wasOpen === false || !resultsOpen)
                {
                    openResults();
                }
            }
        );

        search?.addEventListener(
            'input',
            event =>
            {
                draft.query =
                    event.target.value;

                resultsOpen = true;
                activeIndex = -1;

                renderPopover({
                    focus: 'search'
                });
            }
        );

        search?.addEventListener(
            'keydown',
            event =>
            {
                const matchesNow =
                    visibleOptions();

                if (
                    event.key
                === 'ArrowDown'
              || event.key
                === 'ArrowUp'
                )
                {
                    event.preventDefault();

                    const direction =
                        event.key
                  === 'ArrowDown'
                            ? 1
                            : -1;

                    if (!resultsOpen)
                    {
                        resultsOpen = true;

                        activeIndex =
                            direction > 0
                                ? 0
                                : Math.max(
                                    0,
                                    matchesNow
                                        .length - 1
                                );
                    }
                    else if (
                        matchesNow.length
                    )
                    {
                        activeIndex =
                            activeIndex < 0
                                ? (
                                    direction > 0
                                        ? 0
                                        : matchesNow
                                            .length - 1
                                )
                                : (
                                    activeIndex
                        + direction
                        + matchesNow
                            .length
                                )
                      % matchesNow
                          .length;
                    }

                    renderPopover({
                        focus: 'search'
                    });

                    return;
                }

                if (
                    event.key === 'Enter'
              && activeIndex >= 0
                )
                {
                    event.preventDefault();

                    const option =
                        matchesNow[
                            activeIndex
                        ];

                    if (option)
                    {
                        selectOption(
                            option.value
                        );
                    }

                    return;
                }

                if (
                    event.key === 'Escape'
              && resultsOpen
                )
                {
                    event.preventDefault();
                    event.stopPropagation();

                    resultsOpen = false;
                    activeIndex = -1;

                    renderPopover({
                        focus:
                  selectedValue()
                      ? 'subject'
                      : (
                          draft.mode
                          === 'person'
                              ? 'personMode'
                              : 'surnameMode'
                      )
                    });
                }
            }
        );

        popover
            .querySelectorAll(
                '[data-route-subject-value]'
            )
            .forEach(button =>
            {
                button.addEventListener(
                    'click',
                    () =>
                    {
                        selectOption(
                            button.dataset
                                .routeSubjectValue
                        );
                    }
                );
            });

        popover
            .querySelector(
                '[data-route-review-unmapped]'
            )
            ?.addEventListener(
                'click',
                () =>
                {
                    closeMenu();
                    openPlacesNeedsReview();
                }
            );

        popover
            .querySelector(
                '[data-route-show]'
            )
            ?.addEventListener(
                'click',
                () =>
                {
                    const route =
                        derivePlacesRoute({
                            mode: draft.mode,

                            personId:
                    draft.mode
                      === 'person'
                        ? draft.personId
                        : '',

                            surname:
                    draft.mode
                      === 'surname'
                        ? draft.surname
                        : ''
                        });

                    if (!route.available)
                    {
                        return;
                    }

                    state.placesRouteMode =
                        draft.mode;

                    state
                        .placesRoutePersonId =
                            draft.mode
                    === 'person'
                                ? draft.personId
                                : '';

                    state
                        .placesRouteSurname =
                            draft.mode
                    === 'surname'
                                ? draft.surname
                                : '';

                    state.placesShowRoute =
                        true;

                    closeMenu();
                    renderPlacesMain();

                    requestAnimationFrame(
                        () =>
                            requestAnimationFrame(
                                () =>
                                {
                                    const activeRoute =
                                        currentPlacesRoute();

                                    if (
                                        activeRoute.available
                                    )
                                    {
                                        fitPlacesMap(
                                            activeRoute
                                                .stops
                                                .map(
                                                    stop =>
                                                        stop.place
                                                )
                                        );
                                    }
                                }
                            )
                    );
                }
            );

        popover
            .querySelector(
                '[data-route-clear]'
            )
            ?.addEventListener(
                'click',
                () =>
                {
                    clearPlacesRoute();
                    closeMenu();
                    renderPlacesMain();
                }
            );

        positionPopover();

        if (focus)
        {
            focusControl(focus);
        }
        else
        {
            requestAnimationFrame(
                positionOptions
            );
        }
    };

    document.body.appendChild(
        popover
    );

    anchor.setAttribute(
        'aria-expanded',
        'true'
    );

    renderPopover();
    bindMenuLifecycle(anchor);
}

