function renderGenealogyDateField(
    fieldId,
    label,
    dateInput,
    options = {}
)
{
    const defaultDateType =
        options.defaultDateType
        || options.defaultType
        || 'Exact date';

    const initialModel =
        normalizeGenealogyDateInput(
            dateInput
          || emptyGenealogyDate(
              defaultDateType
          ),
            defaultDateType
        );

    const model = initialModel;

    const inputId =
        options.inputId
        || `${fieldId}Date`;

    const typeId =
        options.typeId
        || `${fieldId}DateType`;

    const inputToId =
        options.inputToId
        || `${inputId}To`;

    const placeholder =
        options.placeholder
        || 'e.g. 14 Feb 1915';

    const fieldClass =
        options.className
        || '';

    const isBetween =
        model.dateType
          === 'Between';

    const hiddenValue =
        escapeHtml(
            JSON.stringify(
                model
            )
        );

    const startValue =
        formatGenealogyDateStartLabel(
            model
        );

    const endValue =
        formatGenealogyDateEndLabel(
            model
        );

    return `
        <div
          class="
            field
            genealogy-date-field
            ${isBetween ? 'is-between' : ''}
            ${escapeHtml(fieldClass)}
          "
          data-genealogy-date-field="${escapeHtml(
                fieldId
            )}"
          >

          <label for="${escapeHtml(inputId)}">
            ${escapeHtml(label)}
          </label>

          <div class="genealogy-date-controls">
            <div
              class="
                common-select-shell
                genealogy-date-type-shell
              ">

              <select
                class="
                  compact-select
                  common-select
                  genealogy-date-type
                "
                id="${escapeHtml(typeId)}"
                data-genealogy-date-type>

                ${genealogyDateTypeOptions(
                    model.dateType
                )}
              </select>

              <span
                class="common-select-chevron"
                aria-hidden="true">

                ${icon.chevron}
              </span>
            </div>

            <div
              class="genealogy-date-range-shell"
              data-genealogy-date-range-shell>

              <div class="genealogy-date-range-cell">
                <span>From</span>

                <input
                  class="genealogy-date-input"
                  id="${escapeHtml(inputId)}"
                  data-genealogy-date-input
                  data-source-value="${escapeHtml(
                        startValue
                    )}"
                  value="${escapeHtml(
                        localizedDataFieldValue(
                            startValue
                        )
                    )}"
                  placeholder="${escapeHtml(
                        placeholder
                    )}">
              </div>

              <div
                class="genealogy-date-range-cell"
                data-genealogy-date-to-cell>

                <span>To</span>

                <input
                  class="genealogy-date-input"
                  id="${escapeHtml(inputToId)}"
                  data-genealogy-date-input-to
                  data-source-value="${escapeHtml(
                        endValue
                    )}"
                  value="${escapeHtml(
                        localizedDataFieldValue(
                            endValue
                        )
                    )}"
                  placeholder="e.g. 14 Feb 1925">
              </div>
            </div>

            <button
              class="genealogy-date-details-button"
              type="button"
              data-genealogy-date-details="${escapeHtml(
                    fieldId
                )}"
              aria-label="Edit ${escapeHtml(
                    label
                )} details"
              aria-expanded="false">

              ${icon.calendar}
            </button>
          </div>

          <input
            type="hidden"
            data-genealogy-date-model
            value="${hiddenValue}">

          <div class="genealogy-date-standard-status" data-genealogy-date-status>${model.calendar === 'Julian' ? escapeHtml(t('Julian')) : ''}</div>

          <div class="genealogy-date-validation" data-genealogy-date-validation></div>
        </div>
      `;
}

function readGenealogyDateModel(fieldRoot)
{
    try
    {
        return JSON.parse(fieldRoot?.querySelector('[data-genealogy-date-model]')?.value || '{}');
    }
    catch
    {
        return emptyGenealogyDate();
    }
}

function setGenealogyDateFieldError(
    fieldRoot,
    message = '',
    parsed = null
)
{
    if (!fieldRoot) return;

    fieldRoot.classList.toggle(
        'has-error',
        Boolean(message)
    );

    const validation =
        fieldRoot.querySelector(
            '[data-genealogy-date-validation]'
        );

    if (validation)
    {
        validation.dataset.endpoint = String(parsed?.endpoint || 1);
        validation.innerHTML = `${escapeHtml(message ? t(message) : '')}${genealogyDateAmbiguityHtml(parsed)}`;
    }
}

function collectGenealogyDateField(fieldId, options = {})
{
    const root = document.querySelector(`[data-genealogy-date-field="${CSS.escape(fieldId)}"]`);
    if (!root) return emptyGenealogyDate();
    const model = readGenealogyDateModel(root);
    const type = root.querySelector('[data-genealogy-date-type]')?.value || model.dateType || 'Unknown';
    const input = root.querySelector('[data-genealogy-date-input]');
    const inputTo = root.querySelector('[data-genealogy-date-input-to]');
    const text = collectLocalizedDataFieldValue(input, input?.dataset.sourceValue || '');
    const text2 = collectLocalizedDataFieldValue(inputTo, inputTo?.dataset.sourceValue || '');
    const parsed = parseGenealogyDateTextAsType(text, type, {
        calendar: model.calendar,
        date2: type === 'Between' ? text2 : model.date2 || model.date2Label,
        date2Label: type === 'Between' ? text2 : model.date2 || model.date2Label
    });
    if (!parsed.valid)
    {
        setGenealogyDateFieldError(root, parsed.message, parsed);
        return options.allowInvalid ? { ...emptyGenealogyDate(type), invalid: true, message: parsed.message } : null;
    }
    const value = {
        ...parsed.value,
        placeId: cleanDatePlaceId(model.placeId),
        reason: model.reason || '',
        burialPlaceId: cleanDatePlaceId(model.burialPlaceId)
    };
    const startId = ({ addPersonDeath: 'addPersonBirth', geneoPersonDeath: 'geneoPersonBirth', profileInlineDeathField: 'profileInlineBirthField' })[fieldId]
        || (/To(?:Date)?$/.test(fieldId) ? fieldId.replace(/To(Date)?$/, 'From$1') : /EndDate$/.test(fieldId) ? fieldId.replace(/EndDate$/, 'StartDate') : '');
    const startRoot = startId ? document.querySelector(`[data-genealogy-date-field="${CSS.escape(startId)}"]`) : null;
    if (startRoot)
    {
        const start = parseGenealogyDateTextAsType(startRoot.querySelector('[data-genealogy-date-input]')?.value,
            startRoot.querySelector('[data-genealogy-date-type]')?.value, { calendar: readGenealogyDateModel(startRoot).calendar,
                date2: startRoot.querySelector('[data-genealogy-date-input-to]')?.value });
        if (start.valid && genealogyDateDefinitelyAfter(start.value, value))
        {
            setGenealogyDateFieldError(root, /Death/.test(fieldId) ? 'The death date is earlier than the birth date.' : 'The end date is earlier than the start date.');
            return null;
        }
    }
    applyGenealogyDateToField(fieldId, value, { silent: true });
    return value;
}

function applyGenealogyDateToField(fieldId, dateInput, options = {})
{
    const root = document.querySelector(`[data-genealogy-date-field="${CSS.escape(fieldId)}"]`);
    if (!root) return;
    const value = normalizeGenealogyDateInput(dateInput);
    const input = root.querySelector('[data-genealogy-date-input]');
    const inputTo = root.querySelector('[data-genealogy-date-input-to]');
    const type = root.querySelector('[data-genealogy-date-type]');
    const model = root.querySelector('[data-genealogy-date-model]');
    const status = root.querySelector('[data-genealogy-date-status]');
    const rangeShell = root.querySelector('[data-genealogy-date-range-shell]');
    if (type) type.value = value.dateType;
    if (input)
    {
        const source = formatGenealogyDateStartLabel(value);
        input.dataset.sourceValue = source;
        input.value = localizedDataFieldValue(source);
    }
    if (inputTo)
    {
        const source = value.dateType === 'Between' ? formatGenealogyDateEndLabel(value) : '';
        inputTo.dataset.sourceValue = source;
        inputTo.value = localizedDataFieldValue(source);
    }
    if (rangeShell) rangeShell.classList.toggle('is-between', value.dateType === 'Between');
    const controls = root.querySelector('.genealogy-date-controls');
    root.classList.toggle('is-between', value.dateType === 'Between');
    if (controls) controls.classList.toggle('is-between', value.dateType === 'Between');
    if (model) model.value = JSON.stringify(value);
    if (status)
    {
        status.textContent =
            value.calendar === 'Julian'
                ? t('Julian')
                : '';
    }
    if (!options.keepError) setGenealogyDateFieldError(root, '');
    if (!options.silent) root.dispatchEvent(new Event('genealogy-date-committed', { bubbles: true }));
}


function setPlaceAddressDisclosureState(
    field,
    expanded,
    {
        clear = false,
        focus = false
    } = {}
)
{
    const disclosure =
        field?.querySelector(
            '[data-place-address-disclosure]'
        );

    const toggle =
        disclosure?.querySelector(
            '[data-place-address-toggle]'
        );

    const toggleLabel =
        disclosure?.querySelector(
            '[data-place-address-toggle-label]'
        );

    const addressFields =
        disclosure?.querySelector(
            '[data-place-address-fields]'
        );

    const addressInput =
        disclosure?.querySelector(
            '[data-place-address]'
        );

    if (
        !disclosure
        || !toggle
        || !addressFields
    )
    {
        return;
    }

    const isExpanded =
        Boolean(expanded);

    if (
        clear
        && addressInput
    )
    {
        addressInput.value = '';
        addressInput.dataset.sourceValue = '';

        addressInput.dispatchEvent(
            new Event(
                'input',
                {
                    bubbles: true
                }
            )
        );

        addressInput.dispatchEvent(
            new Event(
                'change',
                {
                    bubbles: true
                }
            )
        );
    }

    disclosure.classList.toggle(
        'has-address',
        isExpanded
    );

    toggle.classList.toggle(
        'is-remove',
        isExpanded
    );

    toggle.setAttribute(
        'aria-expanded',
        isExpanded
            ? 'true'
            : 'false'
    );

    addressFields.hidden =
        !isExpanded;

    if (toggleLabel)
    {
        toggleLabel.textContent =
            t(
                isExpanded
                    ? '- Remove address'
                    : '+ Add address'
            );
    }

    if (
        isExpanded
        && focus
        && addressInput
    )
    {
        requestAnimationFrame(
            () =>
            {
                addressInput.focus({
                    preventScroll: true
                });
            }
        );
    }
}

async function searchSharedPlaceMapResults(query, signal)
{
    // Superseded autocomplete requests are expected, not UI failures.
    // Every caller ignores results once its AbortSignal is cancelled.
    if (signal?.aborted) return [];
    try
    {
        const results = await geneographGeocoder.search(query, signal, 5);
        return signal?.aborted ? [] : results;
    }
    catch (error)
    {
        if (signal?.aborted) return [];
        throw error;
    }
}

function bindPlaceComboboxes(root = document)
{
    if (!root || typeof root.querySelectorAll !== 'function') return;
    const fields = root.querySelectorAll('[data-place-combobox]');
    fields.forEach(field =>
    {
        if (field.dataset.placeBound) return;

        field.dataset.placeBound = 'true';

        const addressToggle =
            field.querySelector(
                '[data-place-address-toggle]'
            );

        const addressFields =
            field.querySelector(
                '[data-place-address-fields]'
            );

        if (
            addressToggle
          && addressFields
        )
        {
            setPlaceAddressDisclosureState(
                field,
                !addressFields.hidden
            );

            addressToggle.addEventListener(
                'click',
                () =>
                {
                    const expanded =
                        addressToggle.getAttribute(
                            'aria-expanded'
                        ) === 'true';

                    setPlaceAddressDisclosureState(
                        field,
                        !expanded,
                        {
                            clear: expanded,
                            focus: !expanded
                        }
                    );
                }
            );
        }

        const input =
            field.querySelector(
                '[data-place-input]'
            );

        const list =
            field.querySelector(
                '.place-combobox-list'
            );

        if (!input || !list) return;

        let activeIndex = -1;
        let currentOptions = [];
        let openBeforePointer = null;
        let mapResults = [];
        let mapQuery = '';
        let mapState = 'idle';
        let mapError = '';
        let searchTimer = null;
        let searchController = null;
        let choosingOption = false;
        const projectId = String(input.dataset.placeProjectId || currentProjectId() || '').trim();
        input.dataset.placeProjectId = projectId;

        function placeMatchScore(place, q)
        {
            const nq = normalizePlaceLookupText(q);
            if (!nq) return 1;
            const candidates = [place.name, placePrimaryName(place), placeSecondaryName(place), placeCountry(place), ...placeAlternativeNames(place)]
                .flatMap(value => [value, localizedDataFieldValue(value)]);
            for (const c of candidates)
            {
                if (!c) continue;
                const nc = normalizePlaceLookupText(c);
                if (nc.startsWith(nq)) return 3;
                if (nc.includes(nq)) return 2;
            }
            return 0;
        }

        function buildOptions(query)
        {
            const pool = projectId
                ? (sampleData.places || []).filter(p => !p.deleted && p.projectId === projectId)
                : [];
            const trimmed = (query || '').trim();
            const scored = pool
                .map(p => ({ place: p, score: placeMatchScore(p, trimmed) }))
                .filter(x => x.score > 0)
                .sort((a, b) => (b.score - a.score) || (getPeopleForPlace(b.place.id, { projectId: b.place.projectId }).length - getPeopleForPlace(a.place.id, { projectId: a.place.projectId }).length) || a.place.name.localeCompare(b.place.name))
                .slice(0, 8)
                .map(x => ({ type: 'place', place: x.place }));
            const opts = scored;
            if (trimmed.length >= PLACE_EDITOR_GEOCODER_MIN_LENGTH && mapQuery === trimmed)
            {
                mapResults.forEach(result => opts.push({ type: 'map', result }));
            }
            if (trimmed)
            {
                const nq = normalizePlaceLookupText(trimmed);
                const hasExact = pool.some(p => [placeDisplayText(p), localizedDataFieldValue(placeDisplayText(p))].some(value => normalizePlaceLookupText(value) === nq));
                if (!hasExact) opts.push({ type: 'create', text: trimmed });
            }
            return opts;
        }

        function renderList()
        {
            if (!currentOptions.length)
            {
                list.hidden = true;
                list.innerHTML = '';
                input.setAttribute('aria-expanded', 'false');
                return;
            }
            let previousGroup = '';
            const mapStatus = mapState === 'loading'
                ? `<div class="place-combobox-status">${escapeHtml(t('Searching map results...'))}</div>`
                : mapState === 'empty'
                    ? `<div class="place-combobox-status">${escapeHtml(t('No matching map results. You can still use the entered text.'))}</div>`
                    : mapState === 'unavailable'
                        ? `<div class="place-combobox-status">${escapeHtml(t(mapError || 'Map search is unavailable.'))} <button type="button" data-place-map-retry>${escapeHtml(t('Retry'))}</button></div>`
                        : '';
            list.innerHTML = currentOptions.map((opt, i) =>
            {
                const active = i === activeIndex ? ' active' : '';
                const group = opt.type === 'place' ? 'Project places' : opt.type === 'map' ? 'Map results' : 'Use entered text';
                const heading = group === previousGroup ? '' : `<div class="place-combobox-group" role="presentation">${escapeHtml(t(group))}</div>`;
                previousGroup = group;
                if (opt.type === 'create')
                {
                    const createLabel = field.dataset.placeCreateLabel || 'Create place from entered text';
                    return `${mapStatus ? `<div class="place-combobox-group" role="presentation">${escapeHtml(t('Map results'))}</div>${mapStatus}` : ''}${heading}<div class="place-combobox-option${active}" id="${list.id}Option${i}" role="option" aria-selected="${i === activeIndex}" data-place-opt="${i}" data-place-create="1"><div class="place-combobox-copy"><strong>${escapeHtml(t(createLabel))}</strong><span>${escapeHtml(opt.text)}</span></div></div>`;
                }
                if (opt.type === 'map')
                {
                    const result = opt.result;
                    return `${heading}<div class="place-combobox-option${active}" id="${list.id}Option${i}" role="option" aria-selected="${i === activeIndex}" data-place-opt="${i}"><div class="place-combobox-copy"><strong>${escapeHtml(result.primary)}</strong><span>${escapeHtml(result.context || result.name)}</span></div></div>`;
                }
                const p = opt.place;
                const primary = placePrimaryName(p) || 'Place';
                const secondary = placeSecondaryName(p);
                return `${heading}<div class="place-combobox-option${active}" id="${list.id}Option${i}" role="option" aria-selected="${i === activeIndex}" data-place-opt="${i}" data-place-id="${escapeHtml(p.id)}">
              <div class="place-combobox-copy"><strong>${escapeHtml(primary)}</strong>${secondary ? `<span>${escapeHtml(secondary)}</span>` : ''}</div>
            </div>`;
            }).join('');
            list.hidden = false;
            input.setAttribute('aria-expanded', 'true');
            input.setAttribute('aria-activedescendant', activeIndex >= 0 ? `${list.id}Option${activeIndex}` : '');
        }

        function refresh()
        {
            currentOptions = buildOptions(input.value);
            activeIndex = currentOptions.length ? 0 : -1;
            renderList();
        }

        function scheduleMapSearch(query, immediate = false)
        {
            clearTimeout(searchTimer);
            searchController?.abort();
            const trimmed = query.trim();
            if (trimmed && findExactPlaceMatch(trimmed, projectId))
            {
                mapState = 'idle'; mapResults = []; mapQuery = '';
                refresh();
                return;
            }
            if (trimmed.length < PLACE_EDITOR_GEOCODER_MIN_LENGTH)
            {
                mapState = 'idle'; mapResults = []; mapQuery = '';
                refresh();
                return;
            }
            if (!immediate && mapQuery === trimmed && ['ready', 'empty'].includes(mapState)) return;
            mapQuery = trimmed;
            mapResults = [];
            mapState = 'loading';
            refresh();
            searchTimer = setTimeout(async () =>
            {
                const controller = new AbortController();
                searchController = controller;
                try
                {
                    const results = await searchSharedPlaceMapResults(trimmed, controller.signal);
                    if (controller.signal.aborted || input.value.trim() !== trimmed || !field.isConnected) return;
                    mapResults = results;
                    mapState = results.length ? 'ready' : 'empty';
                }
                catch (error)
                {
                    if (controller.signal.aborted || input.value.trim() !== trimmed || !field.isConnected) return;
                    mapState = 'unavailable';
                    mapError = error.message;
                }
                if (document.activeElement === input) refresh();
            }, immediate ? 0 : PLACE_EDITOR_GEOCODER_DEBOUNCE_MS);
        }

        function close()
        {
            clearTimeout(searchTimer);
            searchController?.abort();
            list.hidden = true;
            list.innerHTML = '';
            input.setAttribute('aria-expanded', 'false');
            input.removeAttribute('aria-activedescendant');
            activeIndex = -1;
            currentOptions = [];
        }

        function chooseOption(opt)
        {
            if (!opt) return;
            clearTimeout(searchTimer);
            searchController?.abort();
            mapState = 'idle';
            if (opt.type === 'place')
            {
                const source = placeDisplayText(opt.place) || opt.place.name || '';
                input.dataset.sourceValue = source;
                input.value = localizedDataFieldValue(source);
                input.dataset.placeId = opt.place.id;
                delete input.dataset.placeCoordinates;
            }
            else if (opt.type === 'map')
            {
                input.dataset.sourceValue = opt.result.name;
                input.value = localizedDataFieldValue(opt.result.name);
                input.dataset.placeId = '';
                input.dataset.placeCoordinates = JSON.stringify(opt.result.coordinates);
            }
            else
            {
            // create: keep typed text; clear selection so save-time creates the record
                input.dataset.placeId = '';
                delete input.dataset.placeCoordinates;
            }
            choosingOption = true;
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
            choosingOption = false;
            close();
        }

        input.addEventListener('focus', () => { refresh(); scheduleMapSearch(input.value); });
        input.addEventListener('pointerdown', () =>
        {
            openBeforePointer = !list.hidden;
        });
        input.addEventListener('click', () =>
        {
            const wasOpen = openBeforePointer;
            openBeforePointer = null;
            if (wasOpen === true) close();
            else if (list.hidden) refresh();
        });
        input.addEventListener('input', () =>
        {
            // if typed text no longer matches selected place display, clear selection
            if (input.dataset.placeId)
            {
                const sel = getPlace(input.dataset.placeId);
                const selectedDisplay = sel
                    ? localizedDataFieldValue(placeDisplayText(sel))
                    : '';
                if (!sel || normalizePlaceLookupText(input.value) !== normalizePlaceLookupText(selectedDisplay))
                {
                    input.dataset.placeId = '';
                }
            }
            if (input.dataset.placeCoordinates && normalizePlaceLookupText(input.value) !== normalizePlaceLookupText(input.dataset.sourceValue || '')) delete input.dataset.placeCoordinates;
            if (!choosingOption) scheduleMapSearch(input.value);
            refresh();
        });
        input.addEventListener('keydown', event =>
        {
            if (list.hidden && (event.key === 'ArrowDown' || event.key === 'ArrowUp'))
            {
                refresh();
                event.preventDefault();
                return;
            }
            if (event.key === 'ArrowDown')
            {
                event.preventDefault();
                if (!currentOptions.length) return;
                activeIndex = (activeIndex + 1) % currentOptions.length;
                renderList();
            }
            else if (event.key === 'ArrowUp')
            {
                event.preventDefault();
                if (!currentOptions.length) return;
                activeIndex = (activeIndex - 1 + currentOptions.length) % currentOptions.length;
                renderList();
            }
            else if (event.key === 'Enter')
            {
                if (!list.hidden && activeIndex >= 0)
                {
                    event.preventDefault();
                    chooseOption(currentOptions[activeIndex]);
                }
            }
            else if (event.key === 'Escape')
            {
                if (!list.hidden)
                {
                    event.preventDefault();
                    close();
                }
            }
        });
        input.addEventListener('blur', () =>
        {
            setTimeout(close, 120);
        });
        list.addEventListener('pointerdown', event =>
        {
            if (event.target.closest('[data-place-map-retry]'))
            {
                event.preventDefault();
                scheduleMapSearch(input.value, true);
                return;
            }
            const opt = event.target.closest('[data-place-opt]');
            if (!opt) return;
            event.preventDefault();
            const idx = Number(opt.dataset.placeOpt);
            chooseOption(currentOptions[idx]);
        });
        list.addEventListener('click', event =>
        {
            if (event.detail === 0 && event.target.closest('[data-place-map-retry]')) scheduleMapSearch(input.value, true);
        });
    });
}

function normalizeGenealogyDateStartControl(
    field
)
{
    const model =
        readGenealogyDateModel(field);

    const input =
        field.querySelector(
            '[data-genealogy-date-input]'
        );

    const inputTo =
        field.querySelector(
            '[data-genealogy-date-input-to]'
        );

    if (!input)
    {
        return;
    }

    /*
      * Use the previous model type. When the change event
      * runs, the select already contains the new type.
      */
    const previousType =
        normalizeGenealogyDateType(
            model.dateType
        );

    const text =
        collectLocalizedDataFieldValue(
            input,
            input.dataset.sourceValue || ''
        );

    const text2 =
        collectLocalizedDataFieldValue(
            inputTo,
            inputTo?.dataset.sourceValue || ''
        );

    const parsed =
        parseGenealogyDateTextAsType(
            text,
            previousType,
            {
                calendar:
              model.calendar
              || 'Gregorian',

                date2:
              previousType === 'Between'
                  ? text2
                  : model.date2
                  || model.date2Label
                  || '',

                date2Label:
              previousType === 'Between'
                  ? text2
                  : model.date2
                  || model.date2Label
                  || ''
            }
        );

    /*
      * Preserve genuinely invalid user input so validation
      * can report it instead of silently replacing it.
      */
    if (!parsed.valid)
    {
        return;
    }

    const source =
        formatGenealogyDateStartLabel(
            parsed.value
        );

    input.dataset.sourceValue =
        source;

    input.value =
        localizedDataFieldValue(
            source
        );
}

function bindGenealogyDateFields(root = document)
{
    root.querySelectorAll('[data-genealogy-date-details]').forEach(button =>
    {
        if (button.dataset.dateBound) return;
        button.dataset.dateBound = 'true';
        button.addEventListener('click', event =>
        {
            event.preventDefault();
            event.stopPropagation();
            openGenealogyDateEditor(button, button.dataset.genealogyDateDetails);
        });
    });
    root.querySelectorAll('[data-genealogy-date-field]').forEach(field =>
    {
        if (!field.dataset.partialDateBound)
        {
            field.dataset.partialDateBound = 'true';
            field.addEventListener('click', event =>
            {
                const resolve = event.target.closest('[data-date-resolve]');
                if (!resolve) return;
                const input = field.querySelector(resolve.closest('[data-genealogy-date-validation]')?.dataset.endpoint === '2'
                    ? '[data-genealogy-date-input-to]' : '[data-genealogy-date-input]');
                input.value = `${resolve.dataset.dateResolve} ${resolve.dataset.number}`;
                input.dataset.sourceValue = input.value;
                clearError(); input.dispatchEvent(new Event('change', { bubbles: true })); input.focus();
            });
        }
        const type = field.querySelector('[data-genealogy-date-type]');
        const input = field.querySelector('[data-genealogy-date-input]');
        const inputTo = field.querySelector('[data-genealogy-date-input-to]');
        const clearError = () => setGenealogyDateFieldError(field, '');
        const resolveDateInput = active =>
        {
            const calculation = calculateGenealogyYear(active.value);
            if (calculation?.valid)
            {
                active.value = String(calculation.year);
                active.dataset.sourceValue = active.value;
            }
            const parsed = parseGenealogyDateTextAsType(input?.value, type?.value,
                { calendar: readGenealogyDateModel(field).calendar, date2: inputTo?.value });
            if (!parsed.valid)
            {
                setGenealogyDateFieldError(field, parsed.message, parsed);
                return;
            }
            clearError();
        };
        const bindDateCommit = active =>
        {
            active.addEventListener('blur', () => resolveDateInput(active));
            active.addEventListener('keydown', event =>
            {
                if (event.key !== 'Enter') return;
                event.preventDefault();
                resolveDateInput(active);
            });
        };
        if (type && !type.dataset.dateBound)
        {
            type.dataset.dateBound = 'true';
            type.addEventListener('change', () =>
            {
                normalizeGenealogyDateStartControl(
                    field
                );

                const currentModel =
                    readGenealogyDateModel(field);
                const selectedType = normalizeGenealogyDateType(type.value);
                field.classList.toggle('is-between', selectedType === 'Between');
                const model = field.querySelector('[data-genealogy-date-model]');
                if (model) model.value = JSON.stringify({ ...currentModel, dateType: selectedType });
                clearError();
            });
        }
        if (input && !input.dataset.dateBound)
        {
            input.dataset.dateBound = 'true';
            input.addEventListener('input', clearError);
            bindDateCommit(input);
        }
        if (inputTo && !inputTo.dataset.dateBound)
        {
            inputTo.dataset.dateBound = 'true';
            inputTo.addEventListener('input', clearError);
            bindDateCommit(inputTo);
        }
    });
}

