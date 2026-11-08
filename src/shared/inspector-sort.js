function sectionIsOpen(id)
{
    return state.inspectorSections[id] !== false;
}

function renderInspectorSection(
    id,
    title,
    meta,
    content,
    actionHtml = '',
    options = {}
)
{
    const open =
        typeof options.open === 'boolean'
            ? options.open
            : sectionIsOpen(id);

    const toggleAttribute =
        options.toggleAttribute
            || 'data-toggle-section';

    const sectionId =
        options.sectionId
            || `section-${id}`;

    const showAction =
        open
            || options.alwaysShowAction;

    const inlineAction =
        showAction
            && actionHtml
            && options.inlineAction
            ? `
                <span class="panel-section-inline-action">
                  ${actionHtml}
                </span>
              `
            : '';

    const bodyAction =
        open
            && actionHtml
            && !options.inlineAction
            ? `
                <div class="panel-section-action">
                  ${actionHtml}
                </div>
              `
            : '';

    const footerHtml =
        open
            && options.footerHtml
            ? `
                <div class="panel-section-footer">
                  ${options.footerHtml}
                </div>
              `
            : '';

    const header = `
            <button
              class="panel-section-header"
              type="button"
              ${toggleAttribute}="${escapeHtml(id)}"
              aria-expanded="${open ? 'true' : 'false'}"
              aria-controls="${escapeHtml(sectionId)}">

              <span class="panel-section-heading">
                <h3>${escapeHtml(title)}</h3>

                ${
                    meta
                        ? `<span class="panel-section-count" title="${escapeHtml(meta)}">${escapeHtml(meta)}</span>`
                        : ''
                }
              </span>

              ${
                    inlineAction
                        ? ''
                        : `
                    <span class="panel-section-extra">
                      <span
                        class="panel-section-arrow"
                        aria-hidden="true">
                      </span>
                    </span>
                  `
                }
            </button>
          `;

    const headerRow = inlineAction
        ? `
              <div class="panel-section-header-row">
                ${header}

                <span class="panel-section-extra">
                  ${inlineAction}

                  <button
                    class="panel-section-chevron-toggle"
                    type="button"
                    ${toggleAttribute}="${escapeHtml(id)}"
                    aria-label="${escapeHtml(t('Toggle section'))}: ${escapeHtml(t(title))}"
                    aria-expanded="${open ? 'true' : 'false'}"
                    aria-controls="${escapeHtml(sectionId)}">
                    <span class="panel-section-arrow" aria-hidden="true"></span>
                  </button>
                </span>
              </div>
            `
        : header;

    return `
            <section
              class="panel-section ${
                    open ? 'is-open' : ''
                }">

              ${headerRow}

              <div
                class="panel-section-body"
                id="${escapeHtml(sectionId)}"
                ${open ? '' : 'hidden'}>

                ${bodyAction}
                ${content}
                ${footerHtml}
              </div>
            </section>
          `;
}

function renderInspectorSectionEmpty(
    message
)
{
    return `
          <div class="inspector-section-empty">
            ${escapeHtml(
                translateText(message)
            )}
          </div>
        `;
}

function renderPersonPanelViewAll({
    resource,
    count,
    personId
})
{
    if (!count || !personId)
    {
        return '';
    }

    const nouns = {
        photos:
            count === 1
                ? 'photo'
                : 'photos',

        archive:
            count === 1
                ? 'file'
                : 'files',

        notes:
            count === 1
                ? 'note'
                : 'notes'
    };

    const noun =
        nouns[resource]
          || 'items';

    return `
          <button
            class="panel-section-view-all"
            type="button"
            data-person-resource-view="${
                escapeHtml(resource)
            }"
            data-person-resource-person="${
                escapeHtml(personId)
            }">

            <span>
              View all ${count}
              ${escapeHtml(noun)}
            </span>

            <span
              class="
                panel-section-view-all-icon
              "
              aria-hidden="true">
              ${icon.chevron}
            </span>
          </button>
        `;
}

function renderPanelButtonLabel(iconHtml, label)
{
    return `<span class="panel-button-label">
        <span class="panel-button-icon" aria-hidden="true">${iconHtml}</span>
        <span class="panel-button-text">${escapeHtml(label)}</span>
      </span>`;
}

const APP_SORT_OPTIONS = Object.freeze({
    projects: [
        { value: 'name', label: 'Name' },
        { value: 'updated', label: 'Last updated' },
        { value: 'created', label: 'Date created' },
        { value: 'people', label: 'People count' }
    ],

    people: [
        { value: 'first', label: 'First name' },
        { value: 'last', label: 'Last name' },
        { value: 'birth', label: 'Birth date' },
        { value: 'updated', label: 'Last updated' },
        { value: 'created', label: 'Date created' }
    ],

    geneograph: [
        { value: 'name', label: 'Name' },
        { value: 'updated', label: 'Last updated' },
        { value: 'created', label: 'Date created' }
    ],

    albums: [
        { value: 'photoName', label: 'Photo name' },
        { value: 'updated', label: 'Last updated' },
        { value: 'added', label: 'Date added' }
    ],

    archiveFiles: [
        { value: 'name', label: 'File name' },
        { value: 'updated', label: 'Last updated' },
        { value: 'added', label: 'Date added' },
        { value: 'type', label: 'Type' }
    ],

    archiveSources: [
        { value: 'name', label: 'Name' },
        { value: 'updated', label: 'Last updated' },
        { value: 'created', label: 'Date created' }
    ],

    notes: [
        { value: 'name', label: 'Name' },
        { value: 'updated', label: 'Last updated' },
        { value: 'created', label: 'Date created' }
    ],

    places: [
        { value: 'name', label: 'Name' },
        { value: 'updated', label: 'Last updated' },
        { value: 'created', label: 'Date created' }
    ]
});

const appSortControlRegistry =
    new Map();

function normalizeAppSortDirection(
    direction
)
{
    return direction === 'ascending'
        ? 'ascending'
        : 'descending';
}

function appSortTimestamp(value)
{
    const timestamp =
        Date.parse(value);

    return Number.isFinite(timestamp)
        ? timestamp
        : Number.NaN;
}

function appSortCollator()
{
    return new Intl.Collator(
        state.language === 'ru'
            ? 'ru'
            : 'en',
        {
            sensitivity: 'base',
            numeric: true
        }
    );
}

function compareAppSortValues(
    first,
    second,
    {
        type = 'text',
        direction = 'ascending'
    } = {}
)
{
    const normalizedDirection =
        normalizeAppSortDirection(
            direction
        );

    const firstMissing =
        type === 'number'
            ? !Number.isFinite(first)
            : !String(first ?? '').trim();

    const secondMissing =
        type === 'number'
            ? !Number.isFinite(second)
            : !String(second ?? '').trim();

    /*
      * Missing values are always last. Do this
      * before applying the direction multiplier.
      */
    if (firstMissing && secondMissing)
    {
        return 0;
    }

    if (firstMissing)
    {
        return 1;
    }

    if (secondMissing)
    {
        return -1;
    }

    let comparison;

    if (type === 'number')
    {
        comparison =
            first - second;
    }
    else
    {
        comparison =
            appSortCollator().compare(
                String(first),
                String(second)
            );
    }

    return normalizedDirection
        === 'descending'
        ? -comparison
        : comparison;
}

function appSortRecords(
    records,
    {
        field,
        direction,
        extractors,
        getFallback = null
    }
)
{
    const extractor =
        extractors[field]
        || Object.values(extractors)[0];

    return records
        .map((record, index) => ({
            record,
            index
        }))
        .sort((firstItem, secondItem) =>
        {
            const first =
                firstItem.record;

            const second =
                secondItem.record;

            const comparison =
                compareAppSortValues(
                    extractor.get(first),
                    extractor.get(second),
                    {
                        type:
                  extractor.type,
                        direction
                    }
                );

            if (comparison)
            {
                return comparison;
            }

            if (getFallback)
            {
                const fallbackComparison =
                    compareAppSortValues(
                        getFallback(first),
                        getFallback(second),
                        {
                            type: 'text',
                            direction
                        }
                    );

                if (fallbackComparison)
                {
                    return fallbackComparison;
                }
            }

            /*
          * Preserve source order for completely
          * equivalent records.
          */
            return (
                firstItem.index
            - secondItem.index
            );
        })
        .map(item => item.record);
}

function renderAppSortControl({
    id,
    field,
    direction,
    ariaLabel,
    options,
    className = ''
})
{
    const normalizedDirection =
        normalizeAppSortDirection(
            direction
        );

    const selectedOption =
        options.find(option =>
            option.value === field
        )
        || options[0];

    const directionLabel =
        normalizedDirection
          === 'ascending'
            ? 'Ascending'
            : 'Descending';

    return `
        <span
          class="
            app-sort-field
            ${escapeHtml(className)}
          "
          data-app-sort-control>

          <button
            class="app-sort-trigger"
            type="button"
            id="${escapeHtml(id)}"
            data-app-sort-trigger
            aria-label="${escapeHtml(
                `${ariaLabel}: ${
                    t(selectedOption.label)
                }, ${t(directionLabel)}`
            )}"
            aria-haspopup="dialog"
            aria-expanded="false">

            <span
              class="
                app-sort-icon
                ${
                    normalizedDirection
                    === 'ascending'
                        ? 'is-ascending'
                        : 'is-descending'
                }
              "
              aria-hidden="true">
              ${icon.sortLines}
            </span>

            <span class="app-sort-current">
              ${escapeHtml(
                    t(selectedOption.label)
                )}
            </span>

            <span
              class="app-sort-chevron"
              aria-hidden="true">
              ${icon.chevron}
            </span>
          </button>
        </span>
      `;
}

function renderAppSortOption({
    value,
    label,
    selected,
    attribute
})
{
    return `
        <button
          class="app-sort-option"
          type="button"
          role="radio"
          aria-checked="${
                selected
                    ? 'true'
                    : 'false'
            }"
          ${attribute}="${escapeHtml(
                value
            )}">

          <span
            class="app-sort-option-check"
            aria-hidden="true">
            ${
                selected
                    ? icon.check
                    : ''
            }
          </span>

          <span>
            ${escapeHtml(t(label))}
          </span>
        </button>
      `;
}

function openAppSortPopover(
    id,
    focusSection = ''
)
{
    const config =
        appSortControlRegistry.get(id);

    const anchor =
        document.getElementById(id);

    if (
        !config
        || !anchor
    )
    {
        return;
    }

    closeMenu();

    const field =
        config.getField();

    const direction =
        normalizeAppSortDirection(
            config.getDirection()
        );

    const menu =
        document.createElement('div');

    menu.id =
        'projectMenu';

    menu.className =
        'menu-popover app-sort-popover';

    menu.dataset.appSortId =
        id;

    menu.setAttribute(
        'role',
        'dialog'
    );

    menu.setAttribute(
        'aria-label',
        t('Sort')
    );

    menu.innerHTML = `
        <section class="app-sort-popover-section">
          <div class="app-sort-popover-title">
            ${escapeHtml(t('Sort by'))}
          </div>

          <div
            class="app-sort-popover-group"
            role="radiogroup"
            aria-label="${escapeHtml(
                t('Sort by')
            )}">

            ${config.options
                .map(option =>
                    renderAppSortOption({
                        value:
                    option.value,

                        label:
                    option.label,

                        selected:
                    option.value
                      === field,

                        attribute:
                    'data-app-sort-field'
                    })
                )
                .join('')}
          </div>
        </section>

        <section class="app-sort-popover-section">
          <div class="app-sort-popover-title">
            ${escapeHtml(t('Direction'))}
          </div>

          <div
            class="app-sort-popover-group"
            role="radiogroup"
            aria-label="${escapeHtml(
                t('Direction')
            )}">

            ${renderAppSortOption({
                value:
                'ascending',

                label:
                'Ascending',

                selected:
                direction
                  === 'ascending',

                attribute:
                'data-app-sort-direction'
            })}

            ${renderAppSortOption({
                value:
                'descending',

                label:
                'Descending',

                selected:
                direction
                  === 'descending',

                attribute:
                'data-app-sort-direction'
            })}
          </div>
        </section>
      `;

    document.body.appendChild(menu);

    const rect =
        anchor.getBoundingClientRect();

    const margin =
        12;

    const left =
        Math.min(
            Math.max(
                margin,
                rect.right
              - menu.offsetWidth
            ),
            Math.max(
                margin,
                window.innerWidth
              - menu.offsetWidth
              - margin
            )
        );

    let top =
        rect.bottom + 6;

    if (
        top + menu.offsetHeight
          > window.innerHeight - margin
    )
    {
        top =
            Math.max(
                margin,
                rect.top
              - menu.offsetHeight
              - 6
            );
    }

    menu.style.left =
        `${left}px`;

    menu.style.top =
        `${top}px`;

    anchor.setAttribute(
        'aria-expanded',
        'true'
    );

    function applySelection(
        nextField,
        nextDirection,
        section
    )
    {
        closeMenu();

        config.onChange({
            field:
            nextField,

            direction:
            normalizeAppSortDirection(
                nextDirection
            )
        });

        /*
        * The module rerenders after a change.
        * Reopen the same control so the user can
        * select both the field and direction in
        * one interaction.
        */
        requestAnimationFrame(() =>
        {
            openAppSortPopover(
                id,
                section
            );
        });
    }

    menu.addEventListener(
        'click',
        event =>
        {
            const fieldButton =
                event.target.closest(
                    '[data-app-sort-field]'
                );

            if (fieldButton)
            {
                applySelection(
                    fieldButton.dataset
                        .appSortField,
                    direction,
                    'field'
                );

                return;
            }

            const directionButton =
                event.target.closest(
                    '[data-app-sort-direction]'
                );

            if (directionButton)
            {
                applySelection(
                    field,
                    directionButton.dataset
                        .appSortDirection,
                    'direction'
                );
            }
        }
    );

    menu.addEventListener(
        'keydown',
        event =>
        {
            if (event.key === 'Escape')
            {
                event.preventDefault();
                event.stopPropagation();

                closeMenu();
                anchor.focus({
                    preventScroll: true
                });

                return;
            }

            const current =
                event.target.closest(
                    '.app-sort-option'
                );

            if (!current)
            {
                return;
            }

            const group =
                current.closest(
                    '[role="radiogroup"]'
                );

            const buttons = [
                ...group.querySelectorAll(
                    '.app-sort-option'
                )
            ];

            const index =
                buttons.indexOf(current);

            let nextIndex =
                index;

            if (
                event.key === 'ArrowDown'
            || event.key === 'ArrowRight'
            )
            {
                nextIndex =
                    (index + 1)
              % buttons.length;
            }
            else if (
                event.key === 'ArrowUp'
            || event.key === 'ArrowLeft'
            )
            {
                nextIndex =
                    (
                        index - 1
                + buttons.length
                    )
              % buttons.length;
            }
            else if (
                event.key === 'Home'
            )
            {
                nextIndex = 0;
            }
            else if (
                event.key === 'End'
            )
            {
                nextIndex =
                    buttons.length - 1;
            }
            else
            {
                return;
            }

            event.preventDefault();

            buttons[nextIndex].focus();
        }
    );

    bindMenuLifecycle(anchor);

    const focusSelector =
        focusSection === 'direction'
            ? '[data-app-sort-direction][aria-checked="true"]'
            : focusSection === 'field'
                ? '[data-app-sort-field][aria-checked="true"]'
                : '.app-sort-option[aria-checked="true"]';

    menu.querySelector(
        focusSelector
    )?.focus({
        preventScroll: true
    });
}

function bindAppSortControl(
    root,
    {
        id,
        options,
        getField,
        getDirection,
        onChange
    }
)
{
    const trigger =
        document.getElementById(id);

    if (
        !trigger
        || !root?.contains(trigger)
    )
    {
        return;
    }

    appSortControlRegistry.set(
        id,
        {
            options,
            getField,
            getDirection,
            onChange
        }
    );

    trigger.addEventListener(
        'click',
        () =>
        {
            const existingMenu =
                document.getElementById(
                    'projectMenu'
                );

            if (
                existingMenu?.dataset
                    .appSortId === id
            )
            {
                closeMenu();
                return;
            }

            openAppSortPopover(id);
        }
    );
}

