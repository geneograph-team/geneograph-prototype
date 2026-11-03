const SHARED_FILTER_UNKNOWN_VALUE =
    '__unknown__';

function normalizeSharedFilterSearch(
    value
)
{
    return String(value || '')
        .normalize('NFKD')
        .replace(
            /\p{Diacritic}/gu,
            ''
        )
        .trim()
        .toLocaleLowerCase(
            state.language === 'ru'
                ? 'ru'
                : 'en'
        );
}

function normalizeSharedFilterYearRange(
    value
)
{
    const source =
        value
        && typeof value === 'object'
            ? value
            : {};

    const requestedMode =
        String(
            source.mode || ''
        ).toLowerCase();

    const mode =
        [
            'before',
            'after',
            'between'
        ].includes(requestedMode)
            ? requestedMode
            : '';

    return {
        mode,

        from:
          String(
              source.from ?? ''
          ).trim(),

        to:
          String(
              source.to ?? ''
          ).trim()
    };
}

function sharedFilterYearNumber(
    value
)
{
    const text =
        String(value ?? '')
            .trim();

    if (
        !/^\d{1,4}$/.test(text)
    )
    {
        return null;
    }

    const year =
        Number(text);

    return (
        Number.isInteger(year)
        && year >= 1
        && year <= 9999
    )
        ? year
        : null;
}

function sharedFilterYearRangeError(
    value
)
{
    const range =
        normalizeSharedFilterYearRange(
            value
        );

    if (!range.mode)
    {
        return '';
    }

    const fromYear =
        sharedFilterYearNumber(
            range.from
        );

    if (fromYear == null)
    {
        return translateText(
            range.mode === 'between'
                ? 'Enter a valid starting year.'
                : 'Enter a valid year.'
        );
    }

    if (
        range.mode !== 'between'
    )
    {
        return '';
    }

    const toYear =
        sharedFilterYearNumber(
            range.to
        );

    if (toYear == null)
    {
        return translateText(
            'Enter a valid ending year.'
        );
    }

    if (fromYear > toYear)
    {
        return translateText(
            'The starting year must not be later than the ending year.'
        );
    }

    return '';
}

function sharedFilterYearRangeLabel(
    value
)
{
    const range =
        normalizeSharedFilterYearRange(
            value
        );

    if (
        range.mode === 'before'
    )
    {
        return `${
            translateText('Before')
        } ${range.from}`;
    }

    if (
        range.mode === 'after'
    )
    {
        return `${
            translateText('After')
        } ${range.from}`;
    }

    if (
        range.mode === 'between'
    )
    {
        return `${
            range.from
        }–${
            range.to
        }`;
    }

    return '';
}

function sharedFilterYearMatches(
    yearValue,
    rangeValue
)
{
    const range =
        normalizeSharedFilterYearRange(
            rangeValue
        );

    if (
        !range.mode
        || sharedFilterYearRangeError(
            range
        )
    )
    {
        return true;
    }

    const year =
        sharedFilterYearNumber(
            yearValue
        );

    if (year == null)
    {
        return false;
    }

    const fromYear =
        sharedFilterYearNumber(
            range.from
        );

    if (
        range.mode === 'before'
    )
    {
        return year < fromYear;
    }

    if (
        range.mode === 'after'
    )
    {
        return year > fromYear;
    }

    const toYear =
        sharedFilterYearNumber(
            range.to
        );

    return (
        year >= fromYear
        && year <= toYear
    );
}

function cloneSharedFilterValues(
    schema,
    source = {}
)
{
    const result = {};

    schema.forEach(definition =>
    {
        const fallback =
            definition.control
            === 'year-range'
                ? definition.defaultValue
              || {}
                : definition.multiple
                    ? []
                    : definition.defaultValue
                ?? '';

        const sourceValue =
            Object.prototype
                .hasOwnProperty.call(
                    source || {},
                    definition.key
                )
                ? source[
                    definition.key
                ]
                : fallback;

        if (
            definition.control
            === 'year-range'
        )
        {
            result[
                definition.key
            ] =
                normalizeSharedFilterYearRange(
                    sourceValue
                );

            return;
        }

        result[
            definition.key
        ] =
            definition.multiple
                ? [
                    ...new Set(
                        (
                            Array.isArray(sourceValue)
                                ? sourceValue
                                : sourceValue
                                    ? [sourceValue]
                                    : []
                        )
                            .map(value =>
                                String(value)
                            )
                            .filter(Boolean)
                    )
                ]
                : sourceValue
              ?? fallback;
    });

    return result;
}

function sharedFilterOptions(
    definition
)
{
    const source =
        typeof definition.getOptions
          === 'function'
            ? definition.getOptions()
            : definition.options
            || [];

    return source.map(option =>
    {
        if (
            typeof option === 'string'
        )
        {
            return {
                value:
              option,

                label:
              option
            };
        }

        return {
            value:
            String(
                option?.value
              ?? ''
            ),

            label:
            String(
                option?.label
              ?? option?.value
              ?? ''
            ),

            keywords:
            Array.isArray(
                option?.keywords
            )
                ? option.keywords
                : [],

            count:
            Number.isFinite(
                Number(option?.count)
            )
                ? Number(option.count)
                : null
        };
    });
}

function sharedFilterDefinitionByKey(
    schema,
    key
)
{
    return schema.find(
        definition =>
            definition.key === key
    ) || null;
}

function sharedFilterValueIsActive(
    definition,
    value
)
{
    if (!definition)
    {
        return false;
    }

    if (
        definition.control
          === 'year-range'
    )
    {
        const range =
            normalizeSharedFilterYearRange(
                value
            );

        return Boolean(
            range.mode
          && !sharedFilterYearRangeError(
              range
          )
        );
    }

    if (definition.multiple)
    {
        return (
            Array.isArray(value)
          && value.length > 0
        );
    }

    if (
        definition.control === 'boolean'
    )
    {
        return Boolean(value);
    }

    return (
        String(value ?? '')
        !== String(
            definition.defaultValue
          ?? ''
        )
    );
}

function sharedFilterOptionLabel(
    definition,
    value
)
{
    const option =
        sharedFilterOptions(
            definition
        ).find(item =>
            item.value === String(value)
        );

    return translateText(
        option?.label
        || String(value || '')
    );
}

function sharedFilterDisplayValue(
    definition,
    value
)
{
    if (
        definition?.control
          === 'year-range'
    )
    {
        return sharedFilterYearRangeLabel(
            value
        );
    }
    if (
        definition?.multiple
    )
    {
        const values =
            Array.isArray(value)
                ? value
                : [];

        if (!values.length)
        {
            return '';
        }

        const labels =
            values.map(item =>
                sharedFilterOptionLabel(
                    definition,
                    item
                )
            );

        if (labels.length === 1)
        {
            return labels[0];
        }

        return `${
            labels[0]
        } +${
            labels.length - 1
        }`;
    }

    return sharedFilterOptionLabel(
        definition,
        value
    );
}

function sharedFilterOptionStatus(
    count
)
{
    if (
        state.language === 'ru'
    )
    {
        const rule =
            new Intl.PluralRules('ru')
                .select(count);

        const word =
            rule === 'one'
                ? 'вариант'
                : rule === 'few'
                    ? 'варианта'
                    : 'вариантов';

        return `${count} ${word}`;
    }

    return `${count} ${
        count === 1
            ? 'option'
            : 'options'
    } available`;
}

function sharedFilterRemoveValueLabel(
    label
)
{
    return state.language === 'ru'
        ? `Удалить: ${label}`
        : `Remove ${label}`;
}

function sharedFilterSafeId(
    value
)
{
    return String(value || '')
        .replace(
            /[^a-z0-9_-]+/gi,
            '-'
        );
}

function renderSharedFilterFields({
    schema,
    values,
    prefix
})
{
    const normalized =
        cloneSharedFilterValues(
            schema,
            values
        );

    const fields =
        schema.map(definition =>
        {
            const fieldId =
                `${prefix}-${
                    sharedFilterSafeId(
                        definition.key
                    )
                }`;

            const fieldClass =
                definition.layout === 'full'
                    ? 'shared-filter-field shared-filter-field--full'
                    : 'shared-filter-field';

            if (
                definition.control === 'combobox'
            )
            {
                const listboxId =
                    `${fieldId}-listbox`;

                return `
              <div
                class="${fieldClass}">

                <label
                  for="${escapeHtml(fieldId)}">
                  ${escapeHtml(
                        translateText(
                            definition.label
                        )
                    )}
                </label>

                <div
                  class="shared-filter-combobox"
                  data-shared-filter-combobox="${
                        escapeHtml(
                            definition.key
                        )
                    }">

                  <div
                    class="shared-filter-selected"
                    data-shared-filter-selected
                    hidden>
                  </div>

                  <div
                    class="
                      shared-filter-combobox-input
                    ">

                    ${icon.search}

                    <input
                      id="${escapeHtml(fieldId)}"
                      type="text"
                      role="combobox"
                      aria-autocomplete="list"
                      aria-expanded="false"
                      aria-controls="${
                            escapeHtml(
                                listboxId
                            )
                        }"
                      autocomplete="off"
                      placeholder="${
                            escapeHtml(
                                translateText(
                                    definition.placeholder
                            || 'Search'
                                )
                            )
                        }"
                      data-shared-filter-input>

                    <button
                      class="
                        shared-filter-combobox-toggle
                      "
                      type="button"
                      aria-label="${
                            escapeHtml(
                                translateText(
                                    'Open options'
                                )
                            )
                        }"
                      data-shared-filter-toggle>

                      ${icon.chevron}
                    </button>
                  </div>

                  <div
                    class="shared-filter-listbox"
                    id="${escapeHtml(listboxId)}"
                    role="listbox"
                    ${
                        definition.multiple
                            ? 'aria-multiselectable="true"'
                            : ''
                    }
                    data-shared-filter-listbox
                    hidden>
                  </div>

                  <span
                    class="
                      shared-filter-visually-hidden
                    "
                    aria-live="polite"
                    data-shared-filter-status>
                  </span>
                </div>
              </div>
            `;
            }
            if (
                definition.control
              === 'year-range'
            )
            {
                const range =
                    normalizeSharedFilterYearRange(
                        normalized[
                            definition.key
                        ]
                    );

                const isBetween =
                    range.mode === 'between';

                const error =
                    sharedFilterYearRangeError(
                        range
                    );

                const errorId =
                    `${fieldId}-error`;

                return `
              <div
                class="
                  ${fieldClass}
                  shared-filter-year-field
                ">
                <label id="${escapeHtml(fieldId)}-label">
                  ${escapeHtml(
                        translateText(
                            definition.label
                        )
                    )}
                </label>

                <div
                  class="shared-filter-year-range"
                  data-shared-filter-year-range="${
                        escapeHtml(
                            definition.key
                        )
                    }">

                  <div
                    class="
                      shared-filter-year-controls
                      ${range.mode ? '' : 'is-empty'}
                      ${isBetween ? 'is-between' : ''}
                    "
                    data-shared-filter-year-controls>

                    <div class="common-select-shell">
                      <select
                        class="compact-select common-select"
                        aria-labelledby="${escapeHtml(fieldId)}-label"
                        data-shared-filter-year-mode>

                        <option
                          value=""
                          ${range.mode ? '' : 'selected'}>

                          ${escapeHtml(
                                translateText(
                                    'Any year'
                                )
                            )}
                        </option>

                        <option
                          value="before"
                          ${
                                range.mode === 'before'
                                    ? 'selected'
                                    : ''
                            }>

                          ${escapeHtml(
                                translateText(
                                    'Before'
                                )
                            )}
                        </option>

                        <option
                          value="after"
                          ${
                                range.mode === 'after'
                                    ? 'selected'
                                    : ''
                            }>

                          ${escapeHtml(
                                translateText(
                                    'After'
                                )
                            )}
                        </option>

                        <option
                          value="between"
                          ${
                                isBetween
                                    ? 'selected'
                                    : ''
                            }>

                          ${escapeHtml(
                                translateText(
                                    'Between'
                                )
                            )}
                        </option>
                      </select>

                      <span
                        class="common-select-chevron"
                        aria-hidden="true">

                        ${icon.chevron}
                      </span>
                    </div>

                    <label
                      class="shared-filter-year-input-shell"
                      data-shared-filter-year-from-shell
                      ${range.mode ? '' : 'hidden'}>

                      <span
                        class="shared-filter-visually-hidden"
                        data-shared-filter-year-from-label>

                        ${escapeHtml(
                            translateText(
                                isBetween
                                    ? 'Year from'
                                    : 'Year'
                            )
                        )}
                      </span>

                      <input
                        class="shared-filter-year-input"
                        type="text"
                        inputmode="numeric"
                        maxlength="4"
                        autocomplete="off"
                        placeholder="${
                            escapeHtml(
                                translateText(
                                    isBetween
                                        ? 'From'
                                        : 'Year'
                                )
                            )
                        }"
                        value="${escapeHtml(range.from)}"
                        aria-describedby="${escapeHtml(errorId)}"
                        data-shared-filter-year-from>
                    </label>

                    <label
                      class="shared-filter-year-input-shell"
                      data-shared-filter-year-to-shell
                      ${isBetween ? '' : 'hidden'}>

                      <span
                        class="shared-filter-visually-hidden">

                        ${escapeHtml(
                            translateText(
                                'Year to'
                            )
                        )}
                      </span>

                      <input
                        class="shared-filter-year-input"
                        type="text"
                        inputmode="numeric"
                        maxlength="4"
                        autocomplete="off"
                        placeholder="${
                            escapeHtml(
                                translateText('To')
                            )
                        }"
                        value="${escapeHtml(range.to)}"
                        aria-describedby="${escapeHtml(errorId)}"
                        data-shared-filter-year-to>
                    </label>
                  </div>

                  <p
                    class="shared-filter-field-error"
                    id="${escapeHtml(errorId)}"
                    role="alert"
                    data-shared-filter-year-error
                    ${error ? '' : 'hidden'}>
                    ${escapeHtml(error)}
                  </p>
                </div>
              </div>
            `;
            }
            if (
                definition.control === 'boolean'
            )
            {
                return `
              <div
                class="
                  ${fieldClass}
                  shared-filter-boolean-field
                ">

                <span
                  class="
                    shared-filter-boolean-title
                  ">
                  ${escapeHtml(
                        translateText(
                            definition.label
                        )
                    )}
                </span>

                <label
                  class="
                    shared-filter-boolean-control
                  ">

                  <input
                    type="checkbox"
                    data-shared-filter-boolean="${
                        escapeHtml(
                            definition.key
                        )
                    }"
                    ${
                        normalized[
                            definition.key
                        ]
                            ? 'checked'
                            : ''
                    }>

                  <span>
                    ${escapeHtml(
                        translateText(
                            definition.checkboxLabel
                        || definition.label
                        )
                    )}
                  </span>
                </label>
              </div>
            `;
            }

            const options =
                sharedFilterOptions(
                    definition
                );

            return `
            <div class="${fieldClass}">
              <label
                for="${escapeHtml(fieldId)}">
                ${escapeHtml(
                    translateText(
                        definition.label
                    )
                )}
              </label>

              <div class="common-select-shell">
                <select
                  class="compact-select common-select"
                  id="${escapeHtml(fieldId)}"
                  data-shared-filter-select="${
                        escapeHtml(
                            definition.key
                        )
                    }">

                  ${options.map(option => `
                    <option
                      value="${
                            escapeHtml(
                                option.value
                            )
                        }"
                      ${
                            String(
                                normalized[
                                    definition.key
                                ]
                            ) === option.value
                                ? 'selected'
                                : ''
                        }>

                      ${escapeHtml(
                            translateText(
                                option.label
                            )
                        )}
                    </option>
                  `).join('')}
                </select>

                <span
                  class="common-select-chevron"
                  aria-hidden="true">

                  ${icon.chevron}
                </span>
              </div>
            </div>
          `;
        }).join('');

    return `
        <div
          class="shared-filter-fields"
          data-shared-filter-root="${
                escapeHtml(prefix)
            }">

          ${fields}
        </div>
      `;
}

