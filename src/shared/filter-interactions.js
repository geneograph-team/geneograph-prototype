function bindSharedFilterFields(
    root,
    {
        schema,
        values,
        prefix,
        onChange =
            () =>
            {}
    }
)
{
    const container =
        [
            ...root.querySelectorAll(
                '[data-shared-filter-root]'
            )
        ].find(element =>
            element.dataset
                .sharedFilterRoot
            === prefix
        );

    if (!container)
    {
        return null;
    }

    const currentValues =
        cloneSharedFilterValues(
            schema,
            values
        );

    const comboboxBindings = [];
    const yearRangeBindings = [];

    const getValues =
        () =>
            cloneSharedFilterValues(
                schema,
                currentValues
            );

    const notifyChange = () =>
    {
        const nextValues =
            getValues();

        onChange(nextValues);

        container.dispatchEvent(
            new CustomEvent(
                'shared-filter-change',
                {
                    bubbles:
                true,

                    detail:
                nextValues
                }
            )
        );
    };

    const closeOtherComboboxes =
        activeBinding =>
        {
            comboboxBindings
                .filter(binding =>
                    binding !== activeBinding
                )
                .forEach(binding =>
                    binding.close()
                );
        };

    schema.forEach(definition =>
    {
        const yearRangeRoot =
            container.querySelector(
                `[data-shared-filter-year-range="${
                    definition.key
                }"]`
            );

        if (yearRangeRoot)
        {
            const controls =
                yearRangeRoot.querySelector(
                    '[data-shared-filter-year-controls]'
                );

            const modeSelect =
                yearRangeRoot.querySelector(
                    '[data-shared-filter-year-mode]'
                );

            const fromShell =
                yearRangeRoot.querySelector(
                    '[data-shared-filter-year-from-shell]'
                );

            const fromLabel =
                yearRangeRoot.querySelector(
                    '[data-shared-filter-year-from-label]'
                );

            const fromInput =
                yearRangeRoot.querySelector(
                    '[data-shared-filter-year-from]'
                );

            const toShell =
                yearRangeRoot.querySelector(
                    '[data-shared-filter-year-to-shell]'
                );

            const toInput =
                yearRangeRoot.querySelector(
                    '[data-shared-filter-year-to]'
                );

            const errorRoot =
                yearRangeRoot.querySelector(
                    '[data-shared-filter-year-error]'
                );

            if (
                !controls
          || !modeSelect
          || !fromShell
          || !fromInput
          || !toShell
          || !toInput
          || !errorRoot
            )
            {
                return;
            }

            const updatePresentation =
                () =>
                {
                    const range =
                        normalizeSharedFilterYearRange(
                            currentValues[
                                definition.key
                            ]
                        );

                    const isBetween =
                        range.mode === 'between';

                    controls.classList.toggle(
                        'is-empty',
                        !range.mode
                    );

                    controls.classList.toggle(
                        'is-between',
                        isBetween
                    );

                    fromShell.hidden =
                        !range.mode;

                    toShell.hidden =
                        !isBetween;

                    if (fromLabel)
                    {
                        fromLabel.textContent =
                            translateText(
                                isBetween
                                    ? 'Year from'
                                    : 'Year'
                            );
                    }

                    fromInput.placeholder =
                        translateText(
                            isBetween
                                ? 'From'
                                : 'Year'
                        );

                    toInput.placeholder =
                        translateText(
                            'To'
                        );

                    const fromYear =
                        sharedFilterYearNumber(
                            range.from
                        );

                    const toYear =
                        sharedFilterYearNumber(
                            range.to
                        );

                    const orderInvalid =
                        isBetween
              && fromYear != null
              && toYear != null
              && fromYear > toYear;

                    const error =
                        sharedFilterYearRangeError(
                            range
                        );

                    errorRoot.hidden =
                        !error;

                    errorRoot.textContent =
                        error;

                    if (
                        range.mode
              && fromYear == null
                    )
                    {
                        fromInput.setAttribute(
                            'aria-invalid',
                            'true'
                        );
                    }
                    else
                    {
                        fromInput.removeAttribute(
                            'aria-invalid'
                        );
                    }

                    if (
                        isBetween
              && (
                  toYear == null
                || orderInvalid
              )
                    )
                    {
                        toInput.setAttribute(
                            'aria-invalid',
                            'true'
                        );
                    }
                    else
                    {
                        toInput.removeAttribute(
                            'aria-invalid'
                        );
                    }
                };

            const sync =
                () =>
                {
                    const range =
                        normalizeSharedFilterYearRange(
                            currentValues[
                                definition.key
                            ]
                        );

                    currentValues[
                        definition.key
                    ] = range;

                    modeSelect.value =
                        range.mode;

                    fromInput.value =
                        range.from;

                    toInput.value =
                        range.to;

                    updatePresentation();
                };

            modeSelect.addEventListener(
                'change',
                () =>
                {
                    const range =
                        normalizeSharedFilterYearRange(
                            currentValues[
                                definition.key
                            ]
                        );

                    range.mode =
                        modeSelect.value;

                    if (!range.mode)
                    {
                        range.from = '';
                        range.to = '';
                    }
                    else if (
                        range.mode !== 'between'
                    )
                    {
                        range.to = '';
                    }

                    currentValues[
                        definition.key
                    ] = range;

                    sync();
                    notifyChange();

                    if (range.mode)
                    {
                        requestAnimationFrame(
                            () =>
                            {
                                fromInput.focus({
                                    preventScroll:
                      true
                                });
                            }
                        );
                    }
                }
            );

            const bindYearInput =
                (
                    input,
                    property
                ) =>
                {
                    input.addEventListener(
                        'input',
                        () =>
                        {
                            const sanitized =
                                input.value
                                    .replace(/\D/g, '')
                                    .slice(0, 4);

                            if (
                                input.value !== sanitized
                            )
                            {
                                input.value =
                                    sanitized;
                            }

                            const range =
                                normalizeSharedFilterYearRange(
                                    currentValues[
                                        definition.key
                                    ]
                                );

                            range[property] =
                                sanitized;

                            currentValues[
                                definition.key
                            ] = range;

                            updatePresentation();
                            notifyChange();
                        }
                    );
                };

            bindYearInput(
                fromInput,
                'from'
            );

            bindYearInput(
                toInput,
                'to'
            );

            yearRangeBindings.push({
                definition,
                sync
            });

            sync();
            return;
        }
        const select =
            container.querySelector(
                `[data-shared-filter-select="${
                    definition.key
                }"]`
            );

        if (select)
        {
            select.addEventListener(
                'change',
                () =>
                {
                    currentValues[
                        definition.key
                    ] =
                        select.value;

                    notifyChange();
                }
            );

            return;
        }

        const booleanInput =
            container.querySelector(
                `[data-shared-filter-boolean="${
                    definition.key
                }"]`
            );

        if (booleanInput)
        {
            booleanInput.addEventListener(
                'change',
                () =>
                {
                    currentValues[
                        definition.key
                    ] =
                        Boolean(
                            booleanInput.checked
                        );

                    notifyChange();
                }
            );

            return;
        }

        const combobox =
            container.querySelector(
                `[data-shared-filter-combobox="${
                    definition.key
                }"]`
            );

        if (!combobox)
        {
            return;
        }

        const input =
            combobox.querySelector(
                '[data-shared-filter-input]'
            );

        const toggle =
            combobox.querySelector(
                '[data-shared-filter-toggle]'
            );

        const listbox =
            combobox.querySelector(
                '[data-shared-filter-listbox]'
            );

        const selectedRoot =
            combobox.querySelector(
                '[data-shared-filter-selected]'
            );

        const status =
            combobox.querySelector(
                '[data-shared-filter-status]'
            );

        if (
            !input
          || !toggle
          || !listbox
          || !selectedRoot
        )
        {
            return;
        }

        let query = '';
        let activeIndex = -1;
        let visibleOptions = [];
        let openBeforePointer = null;

        const optionId =
            index =>
                `${
                    listbox.id
                }-option-${
                    index
                }`;

        const selectedValues = () =>
        {
            const value =
                currentValues[
                    definition.key
                ];

            if (definition.multiple)
            {
                return Array.isArray(value)
                    ? value
                    : [];
            }

            return value == null
            || value === ''
                ? []
                : [
                    String(value)
                ];
        };

        const renderSelected = () =>
        {
            const valuesToRender =
                selectedValues();

            selectedRoot.hidden =
                valuesToRender.length === 0;

            selectedRoot.innerHTML =
                valuesToRender.map(value =>
                {
                    const label =
                        sharedFilterOptionLabel(
                            definition,
                            value
                        );

                    return `
                <span
                  class="shared-filter-token">

                  <span
                    class="
                      shared-filter-token-label
                    ">
                    ${escapeHtml(label)}
                  </span>

                  <button
                    class="
                      shared-filter-token-remove
                    "
                    type="button"
                    data-shared-filter-remove="${
                        escapeHtml(value)
                    }"
                    aria-label="${
                        escapeHtml(
                            sharedFilterRemoveValueLabel(
                                label
                            )
                        )
                    }">

                    ${icon.close}
                  </button>
                </span>
              `;
                }).join('');
        };

        const positionListbox = () =>
        {
            const inputShell =
                combobox.querySelector(
                    '.shared-filter-combobox-input'
                )
            || input;

            const rect =
                inputShell
                    .getBoundingClientRect();

            const margin = 12;
            const gap = 5;
            const preferredHeight = 320;

            const spaceBelow =
                window.innerHeight
            - rect.bottom
            - margin
            - gap;

            const spaceAbove =
                rect.top
            - margin
            - gap;

            const openAbove =
                spaceBelow < preferredHeight
            && spaceAbove > spaceBelow;

            const availableHeight =
                Math.max(
                    80,
                    Math.min(
                        preferredHeight,
                        openAbove
                            ? spaceAbove
                            : spaceBelow
                    )
                );

            const width =
                Math.min(
                    rect.width,
                    window.innerWidth
                - margin * 2
                );

            const left =
                Math.min(
                    Math.max(
                        margin,
                        rect.left
                    ),
                    window.innerWidth
                - width
                - margin
                );

            listbox.classList.toggle(
                'is-above',
                openAbove
            );

            listbox.style.left =
                `${left}px`;

            listbox.style.width =
                `${width}px`;

            listbox.style.maxHeight =
                `${availableHeight}px`;

            if (openAbove)
            {
                listbox.style.top =
                    'auto';

                listbox.style.bottom =
                    `${
                        window.innerHeight
                - rect.top
                + gap
                    }px`;
            }
            else
            {
                listbox.style.top =
                    `${rect.bottom + gap}px`;

                listbox.style.bottom =
                    'auto';
            }
        };

        const renderOptions = () =>
        {
            const normalizedQuery =
                normalizeSharedFilterSearch(
                    query
                );

            visibleOptions =
                sharedFilterOptions(
                    definition
                ).filter(option =>
                {
                    if (!normalizedQuery)
                    {
                        return true;
                    }

                    const searchText =
                        [
                            option.label,
                            translateText(
                                option.label
                            ),
                            ...(option.keywords || [])
                        ]
                            .map(
                                normalizeSharedFilterSearch
                            )
                            .join(' ');

                    return searchText.includes(
                        normalizedQuery
                    );
                });

            if (
                activeIndex
            >= visibleOptions.length
            )
            {
                activeIndex =
                    visibleOptions.length - 1;
            }

            if (
                activeIndex < 0
            && visibleOptions.length
            )
            {
                activeIndex = 0;
            }

            const chosen =
                new Set(
                    selectedValues()
                );

            listbox.innerHTML =
                visibleOptions.length
                    ? visibleOptions
                        .map(
                            (option, index) => `
                      <button
                        class="
                          shared-filter-option
                          ${
                                index === activeIndex
                                    ? 'is-active'
                                    : ''
                            }
                        "
                        id="${
                            escapeHtml(
                                optionId(index)
                            )
                        }"
                        type="button"
                        role="option"
                        aria-selected="${
                            chosen.has(
                                option.value
                            )
                                ? 'true'
                                : 'false'
                        }"
                        data-shared-filter-option="${
                            escapeHtml(
                                option.value
                            )
                        }">

                        <span
                          class="
                            shared-filter-option-check
                          "
                          aria-hidden="true">
                          ${icon.check}
                        </span>

                        <span
                          class="
                            shared-filter-option-label
                          ">
                          ${escapeHtml(
                                translateText(
                                    option.label
                                )
                            )}
                        </span>

                        ${
                            option.count == null
                                ? ''
                                : `
                              <span
                                class="
                                  shared-filter-option-count
                                ">
                                ${option.count}
                              </span>
                            `
                        }
                      </button>
                    `
                        )
                        .join('')
                    : `
                  <div
                    class="shared-filter-empty">
                    ${escapeHtml(
                        translateText(
                            'No matching options.'
                        )
                    )}
                  </div>
                `;

            if (
                activeIndex >= 0
            && visibleOptions.length
            )
            {
                input.setAttribute(
                    'aria-activedescendant',
                    optionId(activeIndex)
                );
            }
            else
            {
                input.removeAttribute(
                    'aria-activedescendant'
                );
            }

            if (status)
            {
                status.textContent =
                    sharedFilterOptionStatus(
                        visibleOptions.length
                    );
            }
        };

        const open = () =>
        {
            closeOtherComboboxes(
                binding
            );

            renderOptions();

            listbox.hidden = false;

            combobox.classList.add(
                'is-open'
            );

            input.setAttribute(
                'aria-expanded',
                'true'
            );

            toggle.setAttribute(
                'aria-label',
                translateText(
                    'Close options'
                )
            );

            positionListbox();
        };

        const close = () =>
        {
            listbox.hidden = true;

            combobox.classList.remove(
                'is-open'
            );

            input.setAttribute(
                'aria-expanded',
                'false'
            );

            input.removeAttribute(
                'aria-activedescendant'
            );

            toggle.setAttribute(
                'aria-label',
                translateText(
                    'Open options'
                )
            );
        };

        const setSelectedValue =
            value =>
            {
                const oldValues =
                    selectedValues();

                if (definition.multiple)
                {
                    currentValues[
                        definition.key
                    ] =
                        oldValues.includes(value)
                            ? oldValues.filter(
                                item =>
                                    item !== value
                            )
                            : [
                                ...oldValues,
                                value
                            ];
                }
                else
                {
                    currentValues[
                        definition.key
                    ] =
                        value;

                    close();
                }

                query = '';
                input.value = '';

                renderSelected();
                renderOptions();
                notifyChange();

                input.focus();
            };

        const binding = {
            definition,
            input,
            open,
            close,

            sync()
            {
                renderSelected();
                renderOptions();
            }
        };

        comboboxBindings.push(
            binding
        );

        renderSelected();

        input.addEventListener(
            'focus',
            open
        );

        input.addEventListener(
            'pointerdown',
            () =>
            {
                openBeforePointer = !listbox.hidden;
            }
        );

        input.addEventListener(
            'click',
            () =>
            {
                const wasOpen = openBeforePointer;
                openBeforePointer = null;

                if (wasOpen === true)
                {
                    close();
                }
                else if (listbox.hidden)
                {
                    open();
                }
            }
        );

        input.addEventListener(
            'input',
            () =>
            {
                query =
                    input.value;

                activeIndex = 0;
                open();
            }
        );

        input.addEventListener(
            'keydown',
            event =>
            {
                if (
                    event.key === 'ArrowDown'
                )
                {
                    event.preventDefault();

                    if (listbox.hidden)
                    {
                        open();
                    }
                    else if (
                        visibleOptions.length
                    )
                    {
                        activeIndex =
                            Math.min(
                                activeIndex + 1,
                                visibleOptions.length - 1
                            );

                        renderOptions();
                    }

                    listbox
                        .querySelector(
                            '.shared-filter-option.is-active'
                        )
                        ?.scrollIntoView({
                            block:
                    'nearest'
                        });

                    return;
                }

                if (
                    event.key === 'ArrowUp'
                )
                {
                    event.preventDefault();

                    if (listbox.hidden)
                    {
                        open();
                    }
                    else if (
                        visibleOptions.length
                    )
                    {
                        activeIndex =
                            Math.max(
                                activeIndex - 1,
                                0
                            );

                        renderOptions();
                    }

                    listbox
                        .querySelector(
                            '.shared-filter-option.is-active'
                        )
                        ?.scrollIntoView({
                            block:
                    'nearest'
                        });

                    return;
                }

                if (
                    event.key === 'Enter'
              && !listbox.hidden
              && activeIndex >= 0
              && visibleOptions[
                  activeIndex
              ]
                )
                {
                    event.preventDefault();

                    setSelectedValue(
                        visibleOptions[
                            activeIndex
                        ].value
                    );

                    return;
                }

                if (
                    event.key === 'Escape'
              && !listbox.hidden
                )
                {
                    event.preventDefault();
                    event.stopPropagation();

                    close();
                }
            }
        );

        toggle.addEventListener(
            'click',
            () =>
            {
                if (listbox.hidden)
                {
                    input.focus();
                    open();
                }
                else
                {
                    close();
                }
            }
        );

        listbox.addEventListener(
            'pointerdown',
            event =>
            {
                if (
                    event.target.closest(
                        '[data-shared-filter-option]'
                    )
                )
                {
                    event.preventDefault();
                }
            }
        );

        listbox.addEventListener(
            'click',
            event =>
            {
                const option =
                    event.target.closest(
                        '[data-shared-filter-option]'
                    );

                if (!option)
                {
                    return;
                }

                /*
            * setSelectedValue() rebuilds the listbox.
            * Stop this click before its original target
            * is removed and document treats it as an
            * outside click.
            */
                event.preventDefault();
                event.stopPropagation();

                setSelectedValue(
                    option.dataset
                        .sharedFilterOption
                );
            }
        );

        selectedRoot.addEventListener(
            'click',
            event =>
            {
                const removeButton =
                    event.target.closest(
                        '[data-shared-filter-remove]'
                    );

                if (!removeButton)
                {
                    return;
                }

                event.preventDefault();
                event.stopPropagation();

                const value =
                    removeButton.dataset
                        .sharedFilterRemove;

                currentValues[
                    definition.key
                ] =
                    definition.multiple
                        ? selectedValues()
                            .filter(item =>
                                item !== value
                            )
                        : definition.defaultValue
                  ?? '';

                renderSelected();
                renderOptions();
                notifyChange();

                input.focus();
            }
        );

        combobox.addEventListener(
            'focusout',
            () =>
            {
                setTimeout(
                    () =>
                    {
                        if (
                            !combobox.contains(
                                document.activeElement
                            )
                        )
                        {
                            close();
                        }
                    },
                    0
                );
            }
        );
    });

    const panelBody =
        container.closest(
            '.shared-filter-panel-body'
        );

    panelBody?.addEventListener(
        'scroll',
        () =>
        {
            comboboxBindings.forEach(
                binding =>
                    binding.close()
            );
        },
        {
            passive:
            true
        }
    );

    const reset = () =>
    {
        const defaults =
            cloneSharedFilterValues(
                schema,
                {}
            );

        Object.assign(
            currentValues,
            defaults
        );

        schema.forEach(definition =>
        {
            const select =
                container.querySelector(
                    `[data-shared-filter-select="${
                        definition.key
                    }"]`
                );

            if (select)
            {
                select.value =
                    currentValues[
                        definition.key
                    ];
            }

            const booleanInput =
                container.querySelector(
                    `[data-shared-filter-boolean="${
                        definition.key
                    }"]`
                );

            if (booleanInput)
            {
                booleanInput.checked =
                    Boolean(
                        currentValues[
                            definition.key
                        ]
                    );
            }
        });
        yearRangeBindings.forEach(
            binding =>
                binding.sync()
        );
        comboboxBindings.forEach(
            binding =>
                binding.sync()
        );

        notifyChange();
    };

    return {
        getValues,
        reset,

        getErrors()
        {
            return schema
                .filter(definition =>
                    definition.control
                === 'year-range'
                )
                .map(definition =>
                    sharedFilterYearRangeError(
                        currentValues[
                            definition.key
                        ]
                    )
                )
                .filter(Boolean);
        },

        focusFirstInvalid()
        {
            container
                .querySelector(
                    '[aria-invalid="true"]'
                )
                ?.focus({
                    preventScroll:
                true
                });
        },

        openCombobox(key)
        {
            const binding =
                comboboxBindings.find(
                    item =>
                        item.definition.key
                  === key
                );

            if (!binding)
            {
                return;
            }

            binding.input.focus({
                preventScroll:
              true
            });

            binding.open();
        },

        focusFirst()
        {
            container
                .querySelector(
                    [
                        '[data-shared-filter-input]',
                        '[data-shared-filter-year-mode]',
                        '[data-shared-filter-select]'
                    ].join(', ')
                )
                ?.focus();
        }
    };
}

function positionSharedFilterPanel(
    panel,
    anchor
)
{
    if (
        window.innerWidth <= 640
    )
    {
        panel.classList.add(
            'is-mobile'
        );
    }

    const margin = 12;
    const gap = 8;

    const anchorRect =
        anchor.getBoundingClientRect();

    const left =
        window.innerWidth <= 640
            ? margin
            : Math.min(
                Math.max(
                    margin,
                    anchorRect.right - panel.offsetWidth
                ),
                window.innerWidth - panel.offsetWidth - margin
            );

    const below =
        anchorRect.bottom
        + gap;

    const spaceBelow = window.innerHeight - margin - below;
    const spaceAbove = anchorRect.top - gap - margin;
    const placeBelow = panel.offsetHeight <= spaceBelow || spaceBelow >= spaceAbove;
    panel.style.maxHeight = `${Math.max(0, placeBelow ? spaceBelow : spaceAbove)}px`;
    const top = placeBelow ? below : anchorRect.top - gap - panel.offsetHeight;

    panel.style.left =
        `${left}px`;

    panel.style.top =
        `${top}px`;
}

