/* ---------- People filter configuration ---------- */

const defaultPeopleFilters =
    Object.freeze({
        surnames:
          Object.freeze([]),

        birthPlaceIds:
          Object.freeze([]),
        birthYear:
          Object.freeze({
              mode:
              '',

              from:
              '',

              to:
              ''
          }),

        living:
          'Any',

        sourceLinks:
          'all'
    });

function peopleSurnameFilterOptions()
{
    const values =
        new Map();

    getPeople(
        currentProjectId()
    )
        .filter(person =>
            person
          && !person.deleted
        )
        .forEach(person =>
        {
            const surname =
                String(
                    person.names?.last
              || ''
                ).trim();

            if (!surname)
            {
                return;
            }

            const key =
                normalizeSharedFilterSearch(
                    surname
                );

            const existing =
                values.get(key);

            if (existing)
            {
                existing.count += 1;
            }
            else
            {
                values.set(
                    key,
                    {
                        value:
                  surname,

                        label:
                  surname,

                        count:
                  1
                    }
                );
            }
        });

    const collator =
        new Intl.Collator(
            state.language === 'ru'
                ? 'ru'
                : 'en',
            {
                sensitivity:
              'base'
            }
        );

    return [
        ...values.values()
    ].sort(
        (left, right) =>
            collator.compare(
                left.label,
                right.label
            )
    );
}

function peopleBirthPlaceFilterOptions()
{
    const counts =
        new Map();

    let unknownCount = 0;

    getPeople(
        currentProjectId()
    )
        .filter(person =>
            person
          && !person.deleted
        )
        .forEach(person =>
        {
            const placeId =
                String(
                    person.birth?.placeId
              || ''
                ).trim();

            if (!placeId)
            {
                unknownCount += 1;
                return;
            }

            counts.set(
                placeId,
                (
                    counts.get(placeId)
              || 0
                ) + 1
            );
        });

    const options =
        [
            ...counts.entries()
        ].map(
            ([
                placeId,
                count
            ]) =>
            {
                const place =
                    sampleData.places
                        .find(item =>
                            item.id === placeId
                        );

                return {
                    value:
                placeId,

                    label:
                getPlaceDisplay(
                    placeId
                ),

                    keywords:
                [
                    ...(place
                        ?.alternativeNames
                    || [])
                ],

                    count
                };
            }
        );

    if (unknownCount)
    {
        options.push({
            value:
            SHARED_FILTER_UNKNOWN_VALUE,

            label:
            'Unknown birth place',

            count:
            unknownCount
        });
    }

    const collator =
        new Intl.Collator(
            state.language === 'ru'
                ? 'ru'
                : 'en',
            {
                sensitivity:
              'base'
            }
        );

    return options.sort(
        (left, right) =>
            collator.compare(
                translateText(
                    left.label
                ),
                translateText(
                    right.label
                )
            )
    );
}

const peopleFilterSchema =
    Object.freeze([
        Object.freeze({
            key:
            'surnames',

            label:
            'Surname',

            control:
            'combobox',

            multiple:
            true,

            layout:
            'full',

            placeholder:
            'Search surnames',

            getOptions:
            peopleSurnameFilterOptions
        }),

        Object.freeze({
            key:
            'birthPlaceIds',

            label:
            'Birth place',

            control:
            'combobox',

            multiple:
            true,

            layout:
            'full',

            placeholder:
            'Search birth places',

            getOptions:
            peopleBirthPlaceFilterOptions
        }),

        Object.freeze({
            key:
            'birthYear',

            label:
            'Birth year',

            control:
            'year-range',

            layout:
            'full',

            defaultValue:
            Object.freeze({
                mode:
                '',

                from:
                '',

                to:
                ''
            })
        }),
        Object.freeze({
            key:
            'living',

            label:
            'Living status',

            control:
            'select',

            defaultValue:
            'Any',

            options:
            Object.freeze([
                Object.freeze({
                    value:
                  'Any',

                    label:
                  'Any'
                }),

                Object.freeze({
                    value:
                  'Living',

                    label:
                  'Living'
                }),

                Object.freeze({
                    value:
                  'Deceased',

                    label:
                  'Deceased'
                }),

                Object.freeze({
                    value:
                  'Unknown',

                    label:
                  'Unknown'
                })
            ])
        }),
        Object.freeze({
            key:
            'sourceLinks',

            label:
            'Sources',

            control:
            'select',

            defaultValue:
            'all',

            options:
            Object.freeze([
                Object.freeze({
                    value:
                  'all',

                    label:
                  'Any source status'
                }),

                Object.freeze({
                    value:
                  'linked',

                    label:
                  'With sources'
                }),

                Object.freeze({
                    value:
                  'unlinked',

                    label:
                  'Without sources'
                })
            ])
        })
    ]);

function peopleFiltersWithDefaults(
    filters = state.peopleFilters
)
{
    return cloneSharedFilterValues(
        peopleFilterSchema,
        {
            ...defaultPeopleFilters,
            ...(filters || {})
        }
    );
}

function renderPeopleFilterFields(
    filters = defaultPeopleFilters,
    prefix = 'people-filter'
)
{
    return renderSharedFilterFields({
        schema:
          peopleFilterSchema,

        values:
          peopleFiltersWithDefaults(
              filters
          ),

        prefix
    });
}

function bindPeopleFilterFields(
    root,
    filters,
    prefix,
    onChange =
        () =>
        {}
)
{
    const controller =
        bindSharedFilterFields(
            root,
            {
                schema:
              peopleFilterSchema,

                values:
              peopleFiltersWithDefaults(
                  filters
              ),

                prefix,
                onChange
            }
        );

    root.peopleFilterController =
        controller;

    return controller;
}

function readPeopleFilterFields(
    root
)
{
    return (
        root
            ?.peopleFilterController
            ?.getValues()
        || peopleFiltersWithDefaults(
            defaultPeopleFilters
        )
    );
}

function resetPeopleFilterFields(
    root
)
{
    root
        ?.peopleFilterController
        ?.reset();
}

const peopleColumnGroups = [
    ['Identity & personal', [
        ['living', 'Living status', 120, true], ['gender', 'Gender', 104],
        ['middle', 'Middle name / Patronymic', 200], ['maiden', 'Maiden name', 145], ['religion', 'Religion', 135]
    ]],
    ['Life events', [
        ['birth', 'Birth date', 130, true], ['birthPlace', 'Birth place', 175, true],
        ['death', 'Death date', 130, true], ['deathPlace', 'Death place', 175, true],
        ['age', 'Age / Age at death', 150], ['baptismDate', 'Baptism date', 138],
        ['baptismPlace', 'Baptism place', 175], ['burialPlace', 'Burial place', 175], ['causeOfDeath', 'Cause of death', 160]
    ]],
    ['Family', [['relationship', 'Relationship', 150], ['children', 'Children count', 130]]],
    ['Record metadata', [['created', 'Created', 130], ['updated', 'Last updated', 130]]]
];
const peopleColumns = peopleColumnGroups.flatMap(([, columns]) => columns);
const defaultPeopleColumns = Object.fromEntries(peopleColumns.map(([key, , , enabled]) => [key, Boolean(enabled)]));
const peopleFixedColumnWidth = 48 + 220 + 52;
let peopleColumnsResizeObserver;

let peopleSavedViews = [
    {
        id:
          'whiskerfield-line',

        name:
          'Whiskerfield surname',

        description:
          'All Whiskerfield surname records.',

        filters: {
            surnames:
            ['Whiskerfield']
        }
    },

    {
        id:
          'meowbridge-places',

        name:
          'Meowbridge place',

        description:
          'People and records connected to Meowbridge.',

        filters: {
            birthPlaceIds:
            ['place-meowbridge']
        }
    },

    {
        id:
          'born-before-1900',

        name:
          'Born before 1900',

        description:
          'People born before 1900.',

        filters: {
            birthYear: { mode: 'before', from: '1900', to: '' }
        }
    }
];

peopleSavedViews.forEach(view =>
{
    view.projectId = 'p1';
    view.sampleName = view.name;
    view.sampleDescription = view.description;
});

function peopleSavedViewText(view, field)
{
    const value = view?.[field] || '';
    const original = field === 'name' ? view?.sampleName : view?.sampleDescription;
    return original && value === original ? translateText(value) : value;
}

function peopleProjectSavedViews()
{
    return peopleSavedViews.filter(view => view.projectId === currentProjectId());
}

let peopleDirectoryCache = null;

function peopleDirectoryContext(projectId = currentProjectId())
{
    const defaultId = validProjectById(projectId)?.defaultPersonId;
    const revision = prototypeSessionEditRevision;
    // Source-link updates can replace the collection before their caller commits the edit revision.
    const sourceLinks = sampleData.sourceLinks;
    if (peopleDirectoryCache?.projectId === projectId
        && peopleDirectoryCache.revision === revision
        && peopleDirectoryCache.sourceLinks === sourceLinks
        && peopleDirectoryCache.defaultId === defaultId
        && peopleDirectoryCache.language === state.language)
    {
        return peopleDirectoryCache;
    }

    const people = getPeople(projectId).filter(person => !person.deleted);
    const peopleById = new Map(people.map(person => [person.id, person]));
    const labels = buildPersonRelationshipLabelMap(projectId, treeDefaultPersonId(projectId));
    const placeLabels = new Map();
    const placeLabel = event =>
    {
        const id = event?.placeId;
        if (id && !placeLabels.has(id)) placeLabels.set(id, cleanEditFieldValue(getPlaceDisplay(id)));
        return placeLabels.get(id) || cleanEditFieldValue(event?.placeText);
    };

    const sourceIdsByPerson = new Map();
    for (const link of sourceLinksForProject(projectId))
    {
        if (link.targetType !== 'person' || !link.sourceId || !peopleById.has(link.targetId)) continue;
        if (!sourceIdsByPerson.has(link.targetId)) sourceIdsByPerson.set(link.targetId, new Set());
        sourceIdsByPerson.get(link.targetId).add(link.sourceId);
    }

    const records = people.map(person => ({
        ...toPeopleQueryRecord(person, labels, placeLabel),
        birthFact: person.birth,
        sourceCount: sourceIdsByPerson.get(person.id)?.size || 0
    }));
    peopleDirectoryCache = { projectId, revision, defaultId, language: state.language, sourceLinks, peopleById, records };
    return peopleDirectoryCache;
}

function peopleProjectHasPeople(projectId = currentProjectId())
{
    return Boolean(projectId && sampleData.people.some(person => person.projectId === projectId && !person.deleted));
}

function peopleProfilePerson(personId, projectId = currentProjectId())
{
    if (!projectId) return null;
    const person = getPerson(personId);
    return person?.projectId === projectId && !person.deleted ? person : null;
}

function selectedPeoplePerson(projectId, peopleById)
{
    const lookup = peopleById ? id => peopleById.get(id) : id => peopleProfilePerson(id, projectId);
    const person = lookup(state.selectedPeopleId) || lookup('silver')
        || (peopleById ? peopleById.values().next().value
            : sampleData.people.find(item => item.projectId === projectId && !item.deleted));
    state.selectedPeopleId = person?.id || '';
    return person || null;
}

const peopleDateMonths = Object.freeze({
    jan: 0,
    january: 0,
    feb: 1,
    february: 1,
    mar: 2,
    march: 2,
    apr: 3,
    april: 3,
    may: 4,
    jun: 5,
    june: 5,
    jul: 6,
    july: 6,
    aug: 7,
    august: 7,
    sep: 8,
    sept: 8,
    september: 8,
    oct: 9,
    october: 9,
    nov: 10,
    november: 10,
    dec: 11,
    december: 11
});

function peopleDateMonthIndex(value)
{
    const key = String(value || '').trim().toLowerCase();
    return Object.prototype.hasOwnProperty.call(peopleDateMonths, key)
        ? peopleDateMonths[key]
        : null;
}

function validPeopleDate(year, month, day)
{
    const date = new Date(year, month, day);

    return date.getFullYear() === year
        && date.getMonth() === month
        && date.getDate() === day
        ? date
        : null;
}

function parsePeoplePrototypeDate(value)
{
    const model = normalizeGenealogyDateInput(value), parts = model.first;
    if (model.dateType !== 'Exact date' || !parts.year || !parts.month || !parts.day) return null;
    const civil = genealogyCivilFromDay(genealogyDayNumber(parts.year, parts.month, parts.day, model.calendar));
    const date = new Date(0); date.setFullYear(civil.year, civil.month - 1, civil.day); date.setHours(0, 0, 0, 0);
    return date;
}

function peopleSortDateValue(value)
{
    const text = String(value || '').trim().toLowerCase();

    if (!text || text === '-') return Number.NaN;
    if (text === 'just now' || text === 'today') return Number.MAX_SAFE_INTEGER;
    if (text === 'yesterday') return Number.MAX_SAFE_INTEGER - 1;

    const date = genealogyDateSortValue(value);
    return Number.isFinite(date) ? date : Number.NaN;
}

function sortPeopleRecords(
    records,
    sort = state.peopleSort
)
{
    return appSortRecords(records, {
        field:
          sort,

        direction:
          state.peopleSortDirection,

        extractors: {
            first: {
                type: 'text',
                get: record =>
                    record.first
            },

            last: {
                type: 'text',
                get: record =>
                    record.surname
            },

            birth: {
                type: 'number',
                get: record =>
                    peopleSortDateValue(
                        record.birth
                    )
            },

            updated: {
                type: 'number',
                get: record =>
                    appSortTimestamp(
                        record.updatedAt
                    )
            },

            created: {
                type: 'number',
                get: record =>
                    appSortTimestamp(
                        record.createdAt
                    )
            }
        },

        getFallback:
          record => record.name
    });
}

function calculatePeopleAge(fromDate, toDate = new Date())
{
    if (!fromDate || !toDate || toDate < fromDate) return null;
    let age = toDate.getFullYear() - fromDate.getFullYear();
    const beforeBirthday = toDate.getMonth() < fromDate.getMonth() || (toDate.getMonth() === fromDate.getMonth() && toDate.getDate() < fromDate.getDate());
    if (beforeBirthday) age -= 1;
    return age >= 0 ? age : null;
}

function peopleHeroLifeSummaryItems(
    person,
    options = {}
)
{
    const birth =
        cleanGenealogyDateText(
            person?.birth
        );

    const death =
        cleanGenealogyDateText(
            person?.death
        );

    const birthDate =
        parsePeoplePrototypeDate(
            person?.birth
        );

    const deathDate =
        parsePeoplePrototypeDate(
            person?.death
        );

    const livingStatus =
        normalizeLivingStatus(
            person?.living
          ?? person?.livingStatus
        );

    const isLiving =
        livingStatus === 'Living';

    const showsDeath =
        livingStatus !== 'Living';

    const birthPlace =
        options.includeBirthPlace
            ? person?.birthPlace || ''
            : '';

    const deathPlace =
        options.includeDeathPlace
            ? person?.deathPlace || ''
            : '';

    const central = person?.id ? getPerson(person.id) : null;
    const currentAge = isLiving ? genealogyAgeRange(central?.birth || person?.birth) : null;

    const items = [
        {
            label: 'Birth',
            value:
            birth || 'Unknown',
            detail:
            currentAge !== null
                ? `Age: ${currentAge}`
                : '',
            place:
            birthPlace
        }
    ];

    if (showsDeath)
    {
        const ageAtDeath = genealogyAgeRange(central?.birth || person?.birth, central?.death || person?.death);

        items.push({
            label: 'Death',
            value:
            death || 'Unknown',
            detail:
            ageAtDeath !== null
                ? `Age: ${ageAtDeath}`
                : '',
            place:
            deathPlace
        });
    }

    return items;
}

function renderPeopleHeroLifeSummary(
    person,
    options = {}
)
{
    const items =
        peopleHeroLifeSummaryItems(
            person,
            options
        );

    return `
        <div
          class="profile-hero-life"
          role="list">

          ${items
                .map(item => `
              <div
                class="profile-hero-life-item${options.showEventIcons ? ' profile-hero-life-item--with-icon' : ''}"
                role="listitem">

                ${options.showEventIcons
                    ? `
                  <span class="profile-hero-life-icon" aria-hidden="true">
                    ${item.label === 'Birth' ? icon.birth : icon.death}
                  </span>
                `
                    : ''}

                <span class="profile-hero-life-label">
                  ${escapeHtml(item.label)}
                </span>

                <div class="profile-hero-life-details">
                  <div class="profile-hero-life-primary">
                    <strong>
                      ${escapeHtml(item.value)}
                    </strong>

                    ${item.detail
                        ? `
                      <span class="profile-hero-life-age">
                        ${escapeHtml(item.detail)}
                      </span>
                    `
                        : ''}
                  </div>

                  ${item.place
                    ? `
                    <span class="profile-hero-life-place">
                      ${escapeHtml(item.place)}
                    </span>
                  `
                    : ''}
                </div>
              </div>
            `)
                .join('')}
        </div>
      `;
}

function peopleTableMinimumWidth(columns)
{
    return peopleFixedColumnWidth + peopleColumns.reduce((total, [key, , width]) =>
        total + (columns[key] ? width : 0), 0);
}

function peopleColumnsWithDefaults(overrides = state.peopleVisibleColumns, width = Infinity)
{
    const columns = { ...defaultPeopleColumns, ...overrides };
    if (Object.keys(overrides || {}).length) return columns;

    for (const key of ['deathPlace', 'birthPlace'])
    {
        if (peopleTableMinimumWidth(columns) > width)
            columns[key] = false;
    }
    return columns;
}

function peopleColumnsCustomized()
{
    return Object.keys(state.peopleVisibleColumns || {}).length > 0;
}

function observePeopleTableColumns()
{
    peopleColumnsResizeObserver?.disconnect();
    const wrap = main.querySelector('.people-table-wrap');
    const table = wrap?.querySelector('.people-table');
    if (!table) return;
    const update = () =>
    {
        const columns = peopleColumnsWithDefaults(state.peopleVisibleColumns, wrap.clientWidth);
        table.style.minWidth = `${peopleTableMinimumWidth(columns)}px`;
        for (const cell of table.querySelectorAll('[data-people-table-column]'))
            cell.hidden = !columns[cell.dataset.peopleTableColumn];
    };
    const observer = new ResizeObserver(() =>
    {
        if (wrap.isConnected) update();
        else observer.disconnect();
    });
    peopleColumnsResizeObserver = observer;
    observer.observe(wrap);
    update();
}

function getPeopleSourceCount(
    person
)
{
    if (!person?.id)
    {
        return 0;
    }

    if (
        Number.isInteger(
            person.sourceCount
        )
    )
    {
        return person.sourceCount;
    }

    const centralPerson =
        getPerson(
            person.id
        );

    if (!centralPerson)
    {
        return 0;
    }

    return sourceIdsForTarget(
        'person',
        centralPerson.id,
        centralPerson.projectId
    ).length;
}

function getPeopleSourceStatus(
    person
)
{
    const count =
        getPeopleSourceCount(
            person
        );

    return `${count} ${
        count === 1
            ? 'source'
            : 'sources'
    } linked`;
}

function hasActivePeopleFilters(
    filters = state.peopleFilters
)
{
    const normalized =
        peopleFiltersWithDefaults(
            filters
        );

    return peopleFilterSchema
        .some(definition =>
            sharedFilterValueIsActive(
                definition,
                normalized[
                    definition.key
                ]
            )
        );
}

function activePeopleFilterEntries(
    filters = state.peopleFilters
)
{
    const normalized =
        peopleFiltersWithDefaults(
            filters
        );

    return peopleFilterSchema
        .filter(definition =>
            sharedFilterValueIsActive(
                definition,
                normalized[
                    definition.key
                ]
            )
        )
        .map(definition => [
            definition.key,
            definition.label,
            sharedFilterDisplayValue(
                definition,
                normalized[
                    definition.key
                ]
            )
        ]);
}

function activePeopleFilterCount(
    filters = state.peopleFilters
)
{
    return activePeopleFilterEntries(
        filters
    ).length;
}

function peopleRecordsMatchingFilters(
    records,
    filters,
    searchQuery =
        state.peopleSearch
)
{
    const normalized =
        peopleFiltersWithDefaults(
            filters
        );

    const selectedSurnames =
        new Set(
            normalized.surnames.map(
                normalizeSharedFilterSearch
            )
        );

    const selectedBirthPlaceIds =
        new Set(
            normalized.birthPlaceIds
        );

    const normalizedQuery =
        normalizeSharedFilterSearch(
            searchQuery
        );

    const filterBirth = Boolean(normalized.birthYear.mode && normalized.birthYear.from);

    return records.filter(person =>
    {
        if (
            selectedSurnames.size
          && !selectedSurnames.has(
              normalizeSharedFilterSearch(
                  person.surname
              )
          )
        )
        {
            return false;
        }

        if (
            selectedBirthPlaceIds.size
        )
        {
            const hasKnownPlace =
                Boolean(
                    person.birthPlaceId
                );

            const matchesKnownPlace =
                hasKnownPlace
            && selectedBirthPlaceIds.has(
                person.birthPlaceId
            );

            const matchesUnknownPlace =
                !hasKnownPlace
            && selectedBirthPlaceIds.has(
                SHARED_FILTER_UNKNOWN_VALUE
            );

            if (
                !matchesKnownPlace
            && !matchesUnknownPlace
            )
            {
                return false;
            }
        }

        if (
            filterBirth
          && !genealogyDateMatchesYearFilter(
                (Object.hasOwn(person, 'birthFact') ? person.birthFact : getPerson(person.id)?.birth) || person.birth,
                normalized.birthYear
            )
        )
        {
            return false;
        }

        if (
            normalized.living !== 'Any'
          && person.living
            !== normalized.living
        )
        {
            return false;
        }

        const sourceCount = normalized.sourceLinks === 'all' ? 0 : getPeopleSourceCount(person);

        if (
            normalized.sourceLinks
            === 'linked'
          && sourceCount === 0
        )
        {
            return false;
        }

        if (
            normalized.sourceLinks
            === 'unlinked'
          && sourceCount > 0
        )
        {
            return false;
        }

        if (normalizedQuery)
        {
            const searchText =
                normalizeSharedFilterSearch(
                    [
                        person.name,
                        person.birthPlace,
                        person.relation,
                        person.living,
                        getPeopleSourceStatus(
                            person
                        )
                    ]
                        .filter(Boolean)
                        .join(' ')
                );

            if (
                !searchText.includes(
                    normalizedQuery
                )
            )
            {
                return false;
            }
        }

        return true;
    });
}

function peopleFilterResultCount(
    filters
)
{
    return peopleRecordsMatchingFilters(
        peopleDirectoryContext().records,
        filters
    ).length;
}

function peopleFilterApplyLabel(
    filters
)
{
    const count =
        peopleFilterResultCount(
            filters
        );

    if (
        state.language === 'ru'
    )
    {
        return `Показать ${
            translateCountPhrase(
                `${count} people`
            )
        }`;
    }

    return `Show ${count} ${
        count === 1
            ? 'person'
            : 'people'
    }`;
}

function filteredPeople(records = peopleDirectoryContext().records)
{
    return sortPeopleRecords(
        peopleRecordsMatchingFilters(
            records,
            peopleFiltersWithDefaults()
        )
    );
}

const PEOPLE_ROWS_PER_PAGE_OPTIONS =
    Object.freeze([
        10,
        25,
        50,
        100
    ]);

function normalizePeopleRowsPerPage(
    value = state.peopleRowsPerPage
)
{
    const parsedValue =
        Number(value);

    return PEOPLE_ROWS_PER_PAGE_OPTIONS
        .includes(parsedValue)
        ? parsedValue
        : 25;
}

/*
    * Search, sorting, filters, saved views, and project changes
    * should return the user to the first page.
    *
    * Keeping the reset here avoids duplicating page-reset logic
    * across every filter and search handler.
    */
function peoplePaginationQueryKey()
{
    return JSON.stringify({
        projectId:
          currentProjectId(),

        search:
          String(
              state.peopleSearch || ''
          )
              .trim()
              .toLowerCase(),

        sort: {
            field:
            state.peopleSort
            || 'updated',

            direction:
            normalizeAppSortDirection(
                state.peopleSortDirection
            )
        },

        filters:
          peopleFiltersWithDefaults()
    });
}

function syncPeoplePaginationQuery()
{
    const nextKey =
        peoplePaginationQueryKey();

    if (
        state.peoplePaginationQueryKey
        === nextKey
    )
    {
        return;
    }

    state.peoplePaginationQueryKey =
        nextKey;

    state.peoplePage = 1;
}

function getPeoplePagination(
    totalCount
)
{
    const normalizedTotal =
        Math.max(
            0,
            Number(totalCount) || 0
        );

    const rowsPerPage =
        normalizePeopleRowsPerPage();

    state.peopleRowsPerPage =
        rowsPerPage;

    const totalPages =
        Math.max(
            1,
            Math.ceil(
                normalizedTotal
            / rowsPerPage
            )
        );

    const requestedPage =
        Number(state.peoplePage)
        || 1;

    const currentPage =
        Math.min(
            totalPages,
            Math.max(
                1,
                Math.trunc(
                    requestedPage
                )
            )
        );

    state.peoplePage =
        currentPage;

    const startIndex =
        normalizedTotal
            ? (
                currentPage - 1
            ) * rowsPerPage
            : 0;

    const endIndex =
        Math.min(
            startIndex
          + rowsPerPage,
            normalizedTotal
        );

    return {
        totalCount:
          normalizedTotal,

        rowsPerPage,

        totalPages,

        currentPage,

        startIndex,

        endIndex,

        firstVisible:
          normalizedTotal
              ? startIndex + 1
              : 0,

        lastVisible:
          normalizedTotal
              ? endIndex
              : 0
    };
}

function peoplePaginationTokens(
    currentPage,
    totalPages
)
{
    if (
        totalPages <= 7
    )
    {
        return Array.from(
            {
                length:
              totalPages
            },
            (_, index) =>
                index + 1
        );
    }

    const importantPages =
        [
            1,
            currentPage - 1,
            currentPage,
            currentPage + 1,
            totalPages
        ]
            .filter(
                page =>
                    page >= 1
              && page <= totalPages
            );

    const pages =
        [
            ...new Set(
                importantPages
            )
        ].sort(
            (a, b) =>
                a - b
        );

    const tokens = [];
    let previousPage = 0;

    pages.forEach(page =>
    {
        const gap =
            page - previousPage;

        if (
            previousPage
          && gap === 2
        )
        {
            tokens.push(
                previousPage + 1
            );
        }
        else if (
            previousPage
          && gap > 2
        )
        {
            tokens.push(
                'ellipsis'
            );
        }

        tokens.push(page);

        previousPage =
            page;
    });

    return tokens;
}

function renderPeoplePagination(
    pagination
)
{
    if (
        pagination.totalPages <= 1
    )
    {
        return '';
    }

    const tokens =
        peoplePaginationTokens(
            pagination.currentPage,
            pagination.totalPages
        );

    return `
        <nav
          class="pagination"
          aria-label="People pages">

          <button
            class="
              page-button
              icon-rotate-left
            "
            type="button"
            data-people-page="${
                pagination.currentPage - 1
            }"
            aria-label="Previous page"
            ${
                pagination.currentPage === 1
                    ? 'disabled'
                    : ''
            }>
            ${icon.chevron}
          </button>

          ${tokens.map(
                (token, index) =>
                {
                    if (
                        token === 'ellipsis'
                    )
                    {
                        return `
                  <span
                    class="
                      pagination-ellipsis
                    "
                    aria-hidden="true"
                    data-pagination-gap="${
                        index
                    }">
                    …
                  </span>
                `;
                    }

                    const active =
                        token
                === pagination.currentPage;

                    return `
                <button
                  class="
                    page-button
                    ${
                        active
                            ? 'active'
                            : ''
                    }
                  "
                  type="button"
                  data-people-page="${
                        token
                    }"
                  aria-label="
                    Go to page ${token}
                  "
                  ${
                        active
                            ? 'aria-current="page"'
                            : ''
                    }>
                  ${token}
                </button>
              `;
                }
            ).join('')}

          <button
            class="page-button"
            type="button"
            data-people-page="${
                pagination.currentPage + 1
            }"
            aria-label="Next page"
            ${
                pagination.currentPage
                === pagination.totalPages
                    ? 'disabled'
                    : ''
            }>
            ${icon.chevron}
          </button>
        </nav>
      `;
}

function renderPeopleTableFooter(
    pagination
)
{
    const rangeLabel =
        pagination.totalCount
            ? `${
                pagination.firstVisible
            }–${
                pagination.lastVisible
            }`
            : '0';

    const peopleNoun =
        pagination.totalCount === 1
            ? 'person'
            : 'people';

    return `
        <div
          class="
            table-footer
            people-table-footer
          ">

          <span
            class="
              people-table-footer-summary
            "
            aria-live="polite">
            Showing ${rangeLabel}
            of ${pagination.totalCount}
            ${peopleNoun}
          </span>

          ${renderPeoplePagination(
                pagination
            )}
          <label
            class="people-rows-per-page"
            for="peopleRowsPerPage">

            <span class="people-rows-per-page-label">
              Rows per page
            </span>

            <span
              class="
                common-select-shell
                people-rows-select-shell
              ">

              <select
                class="
                  common-select
                  people-rows-select
                "
                id="peopleRowsPerPage"
                aria-label="Rows per page">

                ${PEOPLE_ROWS_PER_PAGE_OPTIONS
                    .map(option => `
                    <option
                      value="${option}"
                      ${
                            pagination.rowsPerPage
                          === option
                                ? 'selected'
                                : ''
                        }>
                      ${option}
                    </option>
                  `)
                    .join('')}
              </select>

              <span
                class="
                  common-select-chevron
                  people-rows-select-chevron
                "
                aria-hidden="true">
                ${icon.chevron}
              </span>
            </span>
          </label>
        </div>
      `;
}

function peopleSelectedIdSet()
{
    return new Set(Array.isArray(state.peopleSelectedIds) ? state.peopleSelectedIds : []);
}

function peopleSelectedRecords()
{
    const selectedIds = peopleSelectedIdSet();
    return getPeople(currentProjectId()).filter(person => selectedIds.has(person.id));
}

function prunePeopleSelection(peopleById)
{
    setPeopleSelection(state.peopleSelectedIds, peopleById);
}

function clearPeopleSelection()
{
    state.peopleSelectedIds = [];
    state.peopleSelectionAnchorId = '';
}

function setPeopleSelection(personIds, validIds = new Set(getPeople(currentProjectId()).map(person => person.id)))
{
    state.peopleSelectedIds = [...new Set(Array.isArray(personIds) ? personIds : [])]
        .filter(personId => validIds.has(personId));

    if (!state.peopleSelectedIds.length || !validIds.has(state.peopleSelectionAnchorId))
    {
        state.peopleSelectionAnchorId = '';
    }
}

function togglePeopleSelection(personId, options = {})
{
    const rows = Array.isArray(options.rows) ? options.rows : [];
    const visibleIds = rows.map(person => person.id);
    const selectedIds = peopleSelectedIdSet();
    const anchorIndex = visibleIds.indexOf(state.peopleSelectionAnchorId);
    const personIndex = visibleIds.indexOf(personId);

    if (options.shiftKey && anchorIndex >= 0 && personIndex >= 0)
    {
        const start = Math.min(anchorIndex, personIndex);
        const end = Math.max(anchorIndex, personIndex);
        visibleIds.slice(start, end + 1).forEach(id => selectedIds.add(id));
    }
    else
    {
        if (selectedIds.has(personId)) selectedIds.delete(personId);
        else selectedIds.add(personId);
        state.peopleSelectionAnchorId = personId;
    }

    setPeopleSelection([...selectedIds]);
}

function peopleVisibleSelectionState(rows)
{
    const visibleIds = (Array.isArray(rows) ? rows : []).map(person => person.id);
    const selectedIds = peopleSelectedIdSet();
    const selectedVisibleIds = visibleIds.filter(personId => selectedIds.has(personId));

    return {
        visibleIds,
        selectedVisibleIds,
        allVisibleSelected: visibleIds.length > 0 && selectedVisibleIds.length === visibleIds.length,
        someVisibleSelected: selectedVisibleIds.length > 0
    };
}

function renderPeopleActiveFilters()
{
    if (!hasActivePeopleFilters())
    {
        return '';
    }

    const chips = activePeopleFilterEntries()
        .map(([key, label, value]) => `
          <span class="filter-chip active-filter-chip">
            <span class="active-filter-chip-copy">
              <strong>${escapeHtml(label)}:</strong>
              ${escapeHtml(value)}
            </span>

            <button
              class="active-filter-chip-remove"
              type="button"
              data-people-remove-filter="${escapeHtml(key)}"
              aria-label="Remove ${escapeHtml(label)} filter"
              title="Remove filter">
              ${icon.close}
            </button>
          </span>
        `)
        .join('');

    return `
        <div
          class="people-filterbar"
          aria-label="Active People filters">
          ${chips}

          <span class="active-filter-actions">
            <button
              class="text-action"
              type="button"
              id="peopleClearFilters">
              Clear all
            </button>

            <button
              class="people-save-view"
              type="button"
              id="peopleSaveView">
              Save filter
            </button>
          </span>
        </div>
      `;
}

let peopleMobileSearchOpen = false;

function renderPeopleNormalToolbar()
{
    const activeFilterCount =
        activePeopleFilterCount();

    const hasActiveFilters =
        activeFilterCount > 0;

    return `
        <div class="people-toolbar people-normal-toolbar ${peopleMobileSearchOpen ? 'mobile-search-open' : ''}">
          <button class="people-mobile-search-trigger" type="button" data-people-mobile-search aria-label="${escapeHtml(t('Search people'))}" title="${escapeHtml(t('Search people'))}">${icon.search}</button>
          <label class="app-search-field people-search-field">
            ${icon.search}

            <input
              id="peopleSearch"
              type="search"
              placeholder="Search people..."
              value="${escapeHtml(state.peopleSearch)}">
          </label>
          <button class="people-mobile-search-close" type="button" data-people-mobile-search-close aria-label="${escapeHtml(t('Close'))}" title="${escapeHtml(t('Close'))}">${icon.close}</button>

          <button
            class="button secondary people-columns-button ${
                peopleColumnsCustomized()
                    ? 'active'
                    : ''
            }"
            type="button"
            id="peopleColumnsButton"
            aria-haspopup="dialog"
            aria-label="Columns"
            title="Columns">
            ${icon.grid}
            <span>Columns</span>
          </button>

          <button
            class="people-filter-button ${
                hasActiveFilters
                    ? 'active'
                    : ''
            }"
            type="button"
            id="peopleFilterButton"
            aria-haspopup="dialog"
            aria-expanded="false"
            aria-label="${
                hasActiveFilters
                    ? `Filters, ${activeFilterCount} active`
                    : 'Open people filters'
            }">
            <span
              class="people-filter-icon"
              aria-hidden="true">
              ${
                    hasActiveFilters
                        ? icon.filterclear
                        : icon.filter
                }
            </span>

            <span>Filters</span>

            ${
                hasActiveFilters
                    ? `
                  <span class="people-filter-count">
                    ${activeFilterCount}
                  </span>
                `
                    : ''
            }
          </button>
          ${renderAppSortControl({
                id: 'peopleSort',
                field: state.peopleSort,
                direction: state.peopleSortDirection,
                ariaLabel: 'Sort people',
                options: APP_SORT_OPTIONS.people
            })}
          <button
            class="button primary"
            type="button"
            id="addPeoplePerson"
            aria-label="Add person"
            title="Add person">
            ${icon.plus}
            <span class="people-add-person-full">Add person</span>
            <span class="people-add-person-compact">${escapeHtml(t('Add'))}</span>
          </button>
        </div>
      `;
}

function renderPeopleBulkToolbar()
{
    const count = peopleSelectedRecords().length;
    return `<div class="people-bulk-toolbar" aria-label="Bulk actions for selected people">
        <strong class="people-bulk-summary">${count} selected</strong>
        <div class="people-bulk-actions">
          <button class="button secondary" type="button" data-people-bulk-add-board>${icon.whiteboard} ${escapeHtml(t('Add to canvas'))}</button>
          <button class="button danger" type="button" data-people-bulk-delete>${icon.trash} Delete selected</button>
          <button class="button secondary" type="button" data-people-bulk-clear>Clear</button>
        </div>
      </div>`;
}

function renderPeopleDirectoryControls()
{
    const toolbar = state.peopleSelectedIds.length
        ? renderPeopleBulkToolbar()
        : renderPeopleNormalToolbar();

    return `<div class="people-directory-controls">
        <div class="people-toolbar-slot">${toolbar}</div>
        ${renderPeopleActiveFilters()}
      </div>`;
}

function renderPeople(...args)
{
    if (typeof appPerf === 'undefined' || !appPerf.enabled('People')) return renderPeopleWithDiagnosticsBody(...args);
    return appPerf.run('People', 'render', () => renderPeopleWithDiagnosticsBody(...args));
}

function renderPeopleWithDiagnosticsBody()
{
    appNavigationObserve();
    const projectId = currentProjectId();

    workspace.classList.remove(
        'no-sidebar'
    );

    sidebar.innerHTML = '';

    if (state.peopleView === 'profile')
    {
        const person = selectedPeoplePerson(projectId);
        if (person)
        {
            clearPeopleSelection();
            renderPeopleSidebar(true);
            renderPeopleProfile(toPeopleDisplayRecord(person), person);
            return;
        }
        state.peopleView = 'directory';
    }

    const { peopleById, records } = peopleDirectoryContext(projectId);
    const selected = selectedPeoplePerson(projectId, peopleById);
    prunePeopleSelection(peopleById);

    main.classList.remove(
        'people-profile-main'
    );

    const hasProjectPeople = peopleById.size > 0;
    renderPeopleSidebar(hasProjectPeople);

    /*
      * filteredPeople() returns the complete filtered and sorted
      * result. Pagination is deliberately applied afterward.
      */
    const filteredRows =
        filteredPeople(records);

    syncPeoplePaginationQuery();

    const pagination =
        getPeoplePagination(
            filteredRows.length
        );

    const visibleRows = filteredRows
        .slice(pagination.startIndex, pagination.endIndex)
        .map(record => toPeopleDisplayRecord(peopleById.get(record.id), record));

    main.innerHTML = `
        <div
          class="
            people-layout
            ${
                !hasProjectPeople
                    ? 'no-preview'
                    : state.peoplePreviewCollapsed
                    ? 'preview-collapsed'
                    : ''
            }
          ">

          <section
            class="people-content"
            aria-label="People directory">

            ${renderPeopleDirectoryControls()}

            <div
              class="people-table-wrap ${!filteredRows.length ? 'is-empty' : ''}">
              ${renderPeopleTable(
                    visibleRows, peopleById
                )}
              ${renderPeopleMobileList(visibleRows)}
              ${!filteredRows.length ? `<section class="people-directory-empty" aria-labelledby="peopleEmptyTitle">${!hasProjectPeople ? `<div class="tree-empty-state-card"><div class="tree-empty-state-icon" aria-hidden="true">${icon.tree}</div><h1 id="peopleEmptyTitle">${escapeHtml(t('Start your family tree'))}</h1><p>${escapeHtml(t('Add the first person to begin building this project\'s family tree.'))}</p><button class="button primary" type="button" data-people-add-first>${icon.plus}${escapeHtml(t('Add first person'))}</button></div>` : `<div><h2 id="peopleEmptyTitle">${escapeHtml(t('No matches found'))}</h2><button class="button secondary" type="button" data-people-clear-empty>${escapeHtml(t('Clear search and filters'))}</button></div>`}</section>` : ''}
            </div>

            ${renderPeopleTableFooter(
                pagination
            )}
          </section>

          ${hasProjectPeople ? renderPersonSidebar(
                selected?.id,
                'people'
            ) : ''}
        </div>
      `;

    bindPeopleControls(
        visibleRows
    );
}

function renderPeopleSidebar(profileAvailable)
{
    sidebar.innerHTML = renderPeopleSidebarInner(profileAvailable);
    bindPeopleSidebar(sidebar);
}

function renderPeopleSidebarInner(profileAvailable = peopleProjectHasPeople())
{
    const savedViewsMarkup = peopleProjectSavedViews().map(view =>
    {
        const isActive = state.peopleSavedViewId === view.id;

        return `<div class="people-saved-filter-row ${isActive ? 'active' : ''}">
          <button
            class="people-saved-filter-main"
            type="button"
            data-saved-view="${escapeHtml(view.id)}"
            title="${escapeHtml(view.name)}">
            ${icon.folder}
            <span class="people-saved-filter-name">${escapeHtml(view.name)}</span>
          </button>

          <button
            class="more-button people-saved-filter-more"
            type="button"
            data-saved-view-menu="${escapeHtml(view.id)}"
            aria-label="Actions for ${escapeHtml(view.name)}"
            aria-haspopup="menu">
            ${icon.more}
          </button>
        </div>`;
    }).join('');

    return `<div>
          <div class="side-section-title">Navigation</div>

          <div class="side-nav">
            <button
              class="side-link ${state.peopleView !== 'profile' && state.peopleSide === 'people' ? 'active' : ''}"
              type="button"
              data-people-side="people">
              ${icon.peoplegroup}
              <span>People</span>
            </button>

            <button
              class="side-link ${state.peopleView === 'profile' ? 'active' : ''} ${profileAvailable ? '' : 'people-nav-unavailable'}"
              type="button"
              data-open-profile
              ${profileAvailable ? '' : 'disabled'}>
              ${icon.profile}
              <span>Profile</span>
            </button>

            <button
              class="side-link people-nav-unavailable"
              type="button"
              data-placeholder-view="Review center">
              ${icon.search}
              <span>Review center</span>
              <span class="people-review-count">5</span>
            </button>

            <button
              class="side-link people-nav-unavailable"
              type="button"
              data-placeholder-view="Statistics">
              ${icon.grid}
              <span>Statistics</span>
            </button>
          </div>
        </div>

        <div>
          <div class="side-section-title with-add">
            <span>Saved filters</span>

            <button
              class="side-add-button"
              type="button"
              id="peopleSidebarSaveView"
              aria-label="Create saved filter">
              ${icon.plus}
            </button>
          </div>

          <div class="side-nav">
            ${savedViewsMarkup || `<p class="places-sidebar-empty">No saved filters</p>`}
          </div>
        </div>`;
}

function peopleTableColumnValue(key, row, person, childIdsByParent)
{
    switch (key)
    {
        case 'gender': return t(row.gender === 'female' ? 'Female' : row.gender === 'male' ? 'Male' : 'Unknown');
        case 'middle': return person?.names?.middle;
        case 'maiden': return person?.names?.maiden;
        case 'religion': return personAttributeByTag(person, 'RELI')?.value;
        case 'age':
            if (row.living === 'Deceased') return genealogyAgeRange(person?.birth, person?.death || null);
            return row.living === 'Living' ? genealogyAgeRange(person?.birth) : null;
        case 'baptismDate': return formatGenealogyDateLabel(personEventByTag(person, 'BAPM')?.date);
        case 'baptismPlace': return getPlaceEventDisplay(personEventByTag(person, 'BAPM'));
        case 'burialPlace': return editPlaceValue(person?.death?.burialPlaceId, person?.death?.burialPlaceText)
            || getPlaceEventDisplay(personEventByTag(person, 'BURI'));
        case 'causeOfDeath': return person?.death?.cause;
        case 'relationship': return row.relation;
        case 'children': return childIdsByParent.get(row.id)?.size || 0;
        case 'created': return formatProjectDate(row.createdAt, '');
        case 'updated': return formatProjectDate(row.updatedAt, row.updated || '');
        default: return row[key];
    }
}

function renderPeopleTable(rows, peopleById)
{
    const columns = peopleColumnsWithDefaults();
    const enabledColumns = peopleColumns.filter(([key]) => columns[key]);
    const childIdsByParent = new Map();
    if (columns.children && rows.length)
    {
        const visibleIds = new Set(rows.map(person => person.id));
        for (const family of centralFamilyRecords())
        {
            for (const parentId of [familyPartnerAId(family), familyPartnerBId(family)])
            {
                if (!visibleIds.has(parentId)) continue;
                if (!childIdsByParent.has(parentId)) childIdsByParent.set(parentId, new Set());
                const children = childIdsByParent.get(parentId);
                for (const childId of family.childIds || [])
                {
                    if (peopleById.has(childId) || getPerson(childId)) children.add(childId);
                }
            }
        }
    }
    const selectedIds = peopleSelectedIdSet();
    const headers = [
        `<th class="people-select-column"><input class="people-select-checkbox" type="checkbox" data-people-select-visible aria-label="${escapeHtml(t('Select all visible people'))}" ${rows.length ? '' : 'disabled'}></th>`,
        '<th>Name</th>',
        ...enabledColumns.map(([key, label, width]) =>
            `<th data-people-table-column="${key}" style="width:${width}px" title="${escapeHtml(t(label))}">${escapeHtml(t(label))}</th>`),
        `<th class="people-actions-column"><span class="sr-only">${escapeHtml(t('Actions'))}</span></th>`
    ].join('');
    return `<table class="people-table"><thead><tr>${headers}</tr></thead><tbody>
        ${rows.map(person =>
        {
            const isPreviewed = person.id === state.selectedPeopleId;
            const isSelected = selectedIds.has(person.id);
            const central = peopleById.get(person.id);
            const rowClasses = [isPreviewed ? 'is-previewed' : '', isSelected ? 'is-selected' : ''].filter(Boolean).join(' ');
            return `
            <tr
              class="${escapeHtml(
                    rowClasses
                )}"
              data-people-row="${escapeHtml(
                    person.id
                )}"
              ${
                    isPreviewed
                        ? 'aria-current="true"'
                        : ''
                }
              tabindex="0">
            <td class="people-select-column">
            <input class="people-select-checkbox" type="checkbox" data-people-select-id="${escapeHtml(person.id)}" aria-label="Select ${escapeHtml(person.name)}" ${isSelected ? 'checked' : ''}></td>
            <td>
              <div class="person-cell">
                ${renderPersonAvatar(
                    person,
                    'small-avatar'
                )}

                <div class="person-cell-copy">
                  <strong title="${escapeHtml(person.name)}">
                    ${escapeHtml(person.name)}
                  </strong>

                  <span title="${escapeHtml(person.relation)}">
                    ${escapeHtml(person.relation)}
                  </span>
                </div>
              </div>
            </td>
            ${enabledColumns.map(([key]) =>
            {
                const value = peopleTableColumnValue(key, person, central, childIdsByParent);
                const display = escapeHtml(value === '' || value == null ? '—' : String(value));
                return `<td data-people-table-column="${key}" title="${display}">${display}</td>`;
            }).join('')}
            <td class="people-actions-column"><button class="more-button people-row-action" type="button" aria-label="Actions for ${escapeHtml(person.name)}" aria-haspopup="menu" aria-expanded="false" data-people-row-menu="${escapeHtml(person.id)}">${icon.more}</button></td></tr>`;
        }).join('')}
      </tbody></table>`;
}

function renderPeopleMobileList(rows)
{
    const selectedIds = peopleSelectedIdSet();
    return `<div class="people-mobile-list" aria-label="${escapeHtml(t('People'))}">
        <label class="people-mobile-select-all"><input class="people-select-checkbox" type="checkbox" data-people-select-visible aria-label="${escapeHtml(t('Select all visible people'))}"><span>${escapeHtml(t('Select all visible people'))}</span></label>
        ${rows.map(person => `<article class="people-mobile-row ${person.id === state.selectedPeopleId ? 'is-previewed' : ''} ${selectedIds.has(person.id) ? 'is-selected' : ''}" data-people-row="${escapeHtml(person.id)}" tabindex="0" ${person.id === state.selectedPeopleId ? 'aria-current="true"' : ''}>
            <input class="people-select-checkbox" type="checkbox" data-people-select-id="${escapeHtml(person.id)}" aria-label="${escapeHtml(t('Select'))} ${escapeHtml(person.name)}" ${selectedIds.has(person.id) ? 'checked' : ''}>
            ${renderPersonAvatar(person, 'small-avatar')}
            <div class="people-mobile-copy">
                <strong>${escapeHtml(person.name)}</strong>
                <span>${escapeHtml([person.relation, person.living].filter(Boolean).join(' · '))}</span>
                <small>${escapeHtml([person.birth, person.death].filter(Boolean).join(' – '))}</small>
            </div>
            <button class="more-button people-row-action" type="button" data-people-row-menu="${escapeHtml(person.id)}" aria-label="${escapeHtml(t('Actions for'))} ${escapeHtml(person.name)}" aria-haspopup="menu">${icon.more}</button>
            <button class="people-mobile-profile" type="button" data-people-open-profile="${escapeHtml(person.id)}">${escapeHtml(t('View profile'))}${icon.chevron}</button>
        </article>`).join('')}
    </div>`;
}

