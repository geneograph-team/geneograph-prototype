function closeGenealogyDateEditor()
{
    genealogyDatePopover?.remove();
    genealogyDatePopover = null;
    document.querySelectorAll('[data-genealogy-date-details][aria-expanded="true"]').forEach(button => button.setAttribute('aria-expanded', 'false'));
    if (genealogyDateOutsideHandler) document.removeEventListener('click', genealogyDateOutsideHandler);
    if (genealogyDateKeyHandler) document.removeEventListener('keydown', genealogyDateKeyHandler, true);
    genealogyDateOutsideHandler = null;
    genealogyDateKeyHandler = null;
    const returnField = genealogyDateReturnFocus?.dataset.genealogyDateDetails;
    const target = genealogyDateReturnFocus?.isConnected ? genealogyDateReturnFocus
        : returnField ? document.querySelector(`[data-genealogy-date-details="${CSS.escape(returnField)}"]`) : null;
    target?.focus({ preventScroll: true });
    genealogyDateReturnFocus = null;
}

function updateGenealogyDateEditorVisibility(popover)
{
    const between = popover.querySelector('[data-editor-type]').value === 'Between';
    popover.querySelector('[data-first-date-label]').hidden = !between;
    popover.querySelector('.genealogy-date-second-date').hidden = !between;
    const firstToggle = popover.querySelector('[data-calendar-toggle=""]');
    const firstLabel = t(between ? 'Choose From date' : 'Choose a full date');
    firstToggle.setAttribute('aria-label', firstLabel);
    firstToggle.title = firstLabel;
    const target = popover.querySelector('[data-grid-target]');
    target.hidden = !between;
    if (!between) target.value = '';
    popover.querySelector('.genealogy-calendar-nav')?.classList.toggle('has-endpoint', between);
}

function genealogyDateAmbiguityHtml(parsed)
{
    if (!parsed?.ambiguity) return '';
    return `<div class="genealogy-date-choices"><button type="button" class="button secondary" data-date-resolve="day" data-number="${parsed.ambiguity}">${escapeHtml(t('Day'))} ${parsed.ambiguity}</button><button type="button" class="button secondary" data-date-resolve="year" data-number="${parsed.ambiguity}">${escapeHtml(t('Year'))} ${parsed.ambiguity}</button></div>`;
}

function openGenealogyDateEditor(anchor, fieldId)
{
    const root = document.querySelector(`[data-genealogy-date-field="${CSS.escape(fieldId)}"]`);
    if (!root) return;
    closeGenealogyDateEditor();
    genealogyDateReturnFocus = anchor;
    anchor?.setAttribute('aria-expanded', 'true');
    const stored = normalizeGenealogyDateInput(readGenealogyDateModel(root));
    const type = root.querySelector('[data-genealogy-date-type]')?.value || stored.dateType;
    const liveText = root.querySelector('[data-genealogy-date-input]')?.value || '';
    const liveEnd = root.querySelector('[data-genealogy-date-input-to]')?.value || '';
    const live = parseGenealogyDateTextAsType(liveText, type, { calendar: stored.calendar, date2: liveEnd });
    const model = live.valid ? live.value : stored;
    const parts = genealogyDatePartsFromModel(model);
    const firstDraft = parseBaseGenealogyDate(liveText, { calendar: stored.calendar });
    const secondDraft = parseBaseGenealogyDate(liveEnd, { calendar: stored.calendar });
    for (const [suffix, draft] of [['', firstDraft], ['2', secondDraft]])
        if (draft && !draft.invalid) for (const key of ['day', 'month', 'year']) parts[`${key}${suffix}`] = draft[key] ? String(draft[key]).padStart(key === 'year' ? 4 : 2, '0') : '';
    const popover = document.createElement('div');
    popover.className = 'genealogy-date-popover';
    popover.setAttribute('role', 'dialog');
    popover.setAttribute('aria-label', t('Date details'));
    const componentMonthOptions = selected => `<option value="">${escapeHtml(t('Month'))}</option>${GENEALOGY_MONTHS.map(([value, english, , russian]) => `<option value="${value}" ${value === selected ? 'selected' : ''}>${value} ${state.language === 'ru' ? russian : english}</option>`).join('')}`;
    const row = suffix => `<div class="genealogy-date-parts-row has-calendar-toggle full">${['day', 'month', 'year'].map(part =>
    {
        const id = `dateEditor${part}${suffix}`;
        return `<div class="genealogy-date-part-field"><label for="${id}">${escapeHtml(t(part === 'day' ? 'Day' : part === 'month' ? 'Month' : 'Year'))}</label>${part === 'month'
            ? `<select id="${id}" data-editor-month${suffix}>${componentMonthOptions(parts[`month${suffix}`])}</select>`
            : `<input id="${id}" data-editor-${part}${suffix} inputmode="${part === 'year' ? 'text' : 'numeric'}" value="${escapeHtml(parts[`${part}${suffix}`])}" placeholder="${part === 'day' ? 'DD' : 'YYYY'}">`}</div>`;
    }).join('')}<button type="button" class="genealogy-calendar-toggle" data-calendar-toggle="${suffix}" aria-label="${escapeHtml(t(suffix ? 'Choose To date' : 'Choose From date'))}" title="${escapeHtml(t(suffix ? 'Choose To date' : 'Choose From date'))}" aria-expanded="false" aria-controls="dateEditorCalendarPanel">${icon.calendar}</button></div>`;
    popover.innerHTML = `<div class="genealogy-date-popover-header"><strong>${escapeHtml(t('Date details'))}</strong><button class="close-button" type="button" data-genealogy-date-close aria-label="${escapeHtml(t('Close date details'))}">${icon.close}</button></div>
        <div class="genealogy-date-editor-grid"><div class="genealogy-date-part-field full"><label for="dateEditorSmart">${escapeHtml(t('Smart date'))}</label><input id="dateEditorSmart" data-editor-smart value="${escapeHtml(liveText || formatGenealogyDateLabel(model))}" placeholder="${escapeHtml(t('e.g. 1900, 14 Feb, =1900-50'))}"></div>
        <div class="genealogy-date-part-field"><label for="dateEditorType">${escapeHtml(t('Date type'))}</label><select id="dateEditorType" data-editor-type>${genealogyDateTypeOptions(type)}</select></div>
        <div class="genealogy-date-part-field"><label for="dateEditorCalendar">${escapeHtml(t('Calendar'))}</label><select id="dateEditorCalendar" data-editor-calendar>${GENEALOGY_CALENDARS.map(value => `<option value="${value}" ${model.calendar === value ? 'selected' : ''}>${escapeHtml(t(value))}</option>`).join('')}</select></div>
        <div class="genealogy-date-first-date full"><strong data-first-date-label hidden>${escapeHtml(t('From'))}</strong>${row('')}</div><div class="genealogy-date-second-date full" hidden><strong>${escapeHtml(t('To'))}</strong>${row('2')}</div>
        <div class="full genealogy-date-validation" role="status" data-editor-validation></div>
        <div class="full genealogy-calendar" id="dateEditorCalendarPanel" hidden><div data-date-grid></div></div></div>
        <div class="genealogy-date-actions"><button class="button secondary" type="button" data-date-clear>${escapeHtml(t('Clear'))}</button><button class="button secondary" type="button" data-genealogy-date-close>${escapeHtml(t('Cancel'))}</button><button class="button primary" type="button" data-genealogy-date-apply>${escapeHtml(t('Apply'))}</button></div>`;
    document.body.appendChild(popover);
    genealogyDatePopover = popover;
    let last = 'smart';
    const get = name => popover.querySelector(`[data-editor-${name}]`);
    const read = () => ({ calendar: get('calendar').value, ...Object.fromEntries(['day', 'month', 'year', 'day2', 'month2', 'year2'].map(key => [key, get(key).value.trim()])) });
    const fromParts = () => buildGenealogyDateFromParts(get('type').value, read());
    const fromSmart = () => parseGenealogyDateTextAsType(get('smart').value, get('type').value,
        { calendar: get('calendar').value, date2: get('type').value === 'Between' ? dateValueFromParts(get('year2').value, get('month2').value, get('day2').value) : '' });
    let lastParsed = null;
    const syncCalendarButtons = () =>
    {
        const target = popover.querySelector('[data-grid-target]')?.value || '';
        const open = !popover.querySelector('.genealogy-calendar').hidden;
        popover.querySelectorAll('[data-calendar-toggle]').forEach(button =>
            button.setAttribute('aria-expanded', String(open && button.dataset.calendarToggle === target)));
    };
    const show = parsed =>
    {
        lastParsed = parsed;
        const validation = popover.querySelector('[data-editor-validation]');
        validation.innerHTML = parsed.valid ? '' : `${escapeHtml(t(parsed.message))}${genealogyDateAmbiguityHtml(parsed)}`;
        validation.style.display = parsed.valid ? 'none' : 'block';
        if (parsed.valid)
        {
            if (last === 'smart')
            {
                const next = genealogyDatePartsFromModel(parsed.value);
                for (const [key, value] of Object.entries(next)) get(key).value = value;
                get('type').value = parsed.value.dateType;
            }
            else get('smart').value = formatGenealogyDateLabel(parsed.value);
        }
        updateGenealogyDateEditorVisibility(popover);
        syncCalendarButtons();
        return parsed;
    };
    get('smart').addEventListener('input', () => { last = 'smart'; show(fromSmart()); });
    const resolveSmartCalculation = () =>
    {
        const raw = get('smart').value.trim();
        const prefix = raw.match(/^(about|circa|ca\.?|before|after|около|примерно|приблизительно|до|после)\s+/i)?.[0] || '';
        const calculation = calculateGenealogyYear(raw.slice(prefix.length));
        if (!calculation) return;
        if (calculation.valid) get('smart').value = `${prefix}${calculation.year}`;
        last = 'smart';
        show(fromSmart());
    };
    get('smart').addEventListener('blur', resolveSmartCalculation);
    get('smart').addEventListener('keydown', event =>
    {
        if (event.key !== 'Enter') return;
        event.preventDefault();
        resolveSmartCalculation();
    });
    for (const key of ['day', 'month', 'year', 'day2', 'month2', 'year2', 'type', 'calendar'])
        get(key).addEventListener(key.startsWith('month') || ['type', 'calendar'].includes(key) ? 'change' : 'input', () => { last = 'parts'; show(fromParts()); if (key === 'calendar') renderGrid(); });
    for (const key of ['year', 'year2'])
    {
        const resolveYearCalculation = () =>
        {
            const calculation = calculateGenealogyYear(get(key).value);
            if (calculation?.valid)
            {
                get(key).value = String(calculation.year);
                last = 'parts'; show(fromParts());
            }
            else if (calculation) { last = 'parts'; show(fromParts()); }
        };
        get(key).addEventListener('blur', resolveYearCalculation);
        get(key).addEventListener('keydown', event =>
        {
            if (event.key !== 'Enter') return;
            event.preventDefault();
            resolveYearCalculation();
        });
    }
    popover.addEventListener('click', event =>
    {
        const toggle = event.target.closest('[data-calendar-toggle]');
        if (toggle)
        {
            const calendarPanel = popover.querySelector('.genealogy-calendar');
            const target = popover.querySelector('[data-grid-target]');
            const endpoint = get('type').value === 'Between' ? toggle.dataset.calendarToggle : '';
            if (!calendarPanel.hidden && target.value === endpoint) calendarPanel.hidden = true;
            else
            {
                calendarPanel.hidden = false;
                target.value = endpoint;
                focusCalendarDate(endpoint);
            }
            syncCalendarButtons();
        }
        const resolve = event.target.closest('[data-date-resolve]');
        if (resolve)
        {
            if (lastParsed?.endpoint === 2)
            {
                for (const key of ['day2', 'month2', 'year2']) get(key).value = '';
                get(resolve.dataset.dateResolve === 'day' ? 'day2' : 'year2').value = resolve.dataset.number;
                last = 'parts'; show(fromParts());
            }
            else { get('smart').value = `${resolve.dataset.dateResolve} ${resolve.dataset.number}`; last = 'smart'; show(fromSmart()); }
            get('smart').focus();
        }
        if (event.target.closest('[data-date-clear]'))
        {
            get('smart').value = '';
            last = 'smart'; show(fromSmart());
        }
    });
    popover.querySelectorAll('[data-genealogy-date-close]').forEach(button => button.addEventListener('click', closeGenealogyDateEditor));
    popover.querySelector('[data-genealogy-date-apply]').addEventListener('click', () =>
    {
        const parsed = show(last === 'smart' ? fromSmart() : fromParts());
        if (!parsed.valid) return;
        applyGenealogyDateToField(fieldId, { ...stored, ...parsed.value });
        closeGenealogyDateEditor();
    });
    const today = new Date();
    let gridYear = model.first.year || today.getFullYear(), gridMonth = model.first.month || today.getMonth() + 1;
    const focusCalendarDate = endpoint =>
    {
        gridYear = Number(get(`year${endpoint}`).value) || Number(get('year').value) || today.getFullYear();
        gridMonth = Number(get(`month${endpoint}`).value) || Number(get('month').value) || today.getMonth() + 1;
        renderGrid();
    };
    const shiftMonth = delta =>
    {
        gridMonth += delta;
        while (gridMonth < 1) { gridMonth += 12; gridYear--; }
        while (gridMonth > 12) { gridMonth -= 12; gridYear++; }
        gridYear = Math.max(1, Math.min(9999, gridYear));
    };
    const renderGrid = focusDay =>
    {
        const grid = popover.querySelector('[data-date-grid]'), calendar = get('calendar').value;
        const selectedEndpoint = grid.querySelector('[data-grid-target]')?.value || '';
        const first = ((genealogyDayNumber(gridYear, gridMonth, 1, calendar) % 7) + 7) % 7;
        const names = state.language === 'ru' ? ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'] : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        grid.innerHTML = `<div class="genealogy-calendar-nav"><select data-grid-target aria-label="${escapeHtml(t('Date'))}"><option value="">${escapeHtml(t('From'))}</option><option value="2" ${selectedEndpoint === '2' ? 'selected' : ''}>${escapeHtml(t('To'))}</option></select><button type="button" class="icon-button" data-grid-month="-1" aria-label="${escapeHtml(t('Previous month'))}">${icon.chevron}</button><select data-grid-month-select aria-label="${escapeHtml(t('Month'))}">${genealogyMonthOptions(gridMonth)}</select><input data-grid-year inputmode="numeric" aria-label="${escapeHtml(t('Year'))}" value="${gridYear}"><button type="button" class="icon-button" data-grid-month="1" aria-label="${escapeHtml(t('Next month'))}">${icon.chevron}</button></div><div class="genealogy-calendar-days" role="grid" aria-label="${escapeHtml(`${monthShort(gridMonth)} ${gridYear}`)}">${names.map(name => `<span role="columnheader">${name}</span>`).join('')}${'<span aria-hidden="true"></span>'.repeat(first)}${Array.from({ length: genealogyMonthDays(gridYear, gridMonth, calendar) }, (_, index) => index + 1).map(day => `<button type="button" role="gridcell" tabindex="${day === (focusDay || 1) ? 0 : -1}" data-grid-day="${day}" aria-label="${escapeHtml(dateLabelFromParts(gridYear, gridMonth, day, state.language))}">${day}</button>`).join('')}</div>`;
        updateGenealogyDateEditorVisibility(popover);
        syncCalendarButtons();
        if (focusDay) grid.querySelector(`[data-grid-day="${focusDay}"]`)?.focus();
    };
    popover.querySelector('[data-date-grid]').addEventListener('change', event =>
    {
        if (event.target.hasAttribute('data-grid-target')) { focusCalendarDate(event.target.value); return; }
        if (event.target.hasAttribute('data-grid-year'))
        {
            const year = Number(event.target.value);
            if (!Number.isInteger(year) || year < 1 || year > 9999) return;
            gridYear = year;
        }
        if (event.target.hasAttribute('data-grid-month-select')) gridMonth = Number(event.target.value) || gridMonth;
        renderGrid();
    });
    popover.querySelector('[data-date-grid]').addEventListener('click', event =>
    {
        const shift = event.target.closest('[data-grid-month]');
        if (shift) { shiftMonth(Number(shift.dataset.gridMonth)); renderGrid(); }
        const day = event.target.closest('[data-grid-day]');
        if (!day) return;
        const suffix = popover.querySelector('[data-grid-target]').value;
        get(`day${suffix}`).value = day.dataset.gridDay;
        get(`month${suffix}`).value = String(gridMonth).padStart(2, '0');
        get(`year${suffix}`).value = String(gridYear).padStart(4, '0');
        last = 'parts'; show(fromParts());
    });
    popover.querySelector('[data-date-grid]').addEventListener('keydown', event =>
    {
        const button = event.target.closest('[data-grid-day]');
        if (!button) return;
        let day = Number(button.dataset.gridDay);
        const delta = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[event.key];
        if (delta) day += delta;
        else if (event.key === 'Home') day -= ((genealogyDayNumber(gridYear, gridMonth, day, get('calendar').value) % 7) + 7) % 7;
        else if (event.key === 'End') day += 6 - ((genealogyDayNumber(gridYear, gridMonth, day, get('calendar').value) % 7) + 7) % 7;
        else if (['PageUp', 'PageDown'].includes(event.key)) { shiftMonth((event.key === 'PageUp' ? -1 : 1) * (event.shiftKey ? 12 : 1)); day = Math.min(day, genealogyMonthDays(gridYear, gridMonth, get('calendar').value)); }
        else return;
        event.preventDefault();
        while (day < 1) { shiftMonth(-1); day += genealogyMonthDays(gridYear, gridMonth, get('calendar').value); }
        while (day > genealogyMonthDays(gridYear, gridMonth, get('calendar').value)) { day -= genealogyMonthDays(gridYear, gridMonth, get('calendar').value); shiftMonth(1); }
        renderGrid(day);
    });
    renderGrid();
    updateGenealogyDateEditorVisibility(popover);
    show(last === 'smart' ? fromSmart() : fromParts());
    genealogyDateOutsideHandler = event => { if (!event.composedPath().includes(popover) && !event.composedPath().includes(anchor)) closeGenealogyDateEditor(); };
    genealogyDateKeyHandler = event =>
    {
        if (event.key === 'Escape') { event.preventDefault(); event.stopImmediatePropagation(); closeGenealogyDateEditor(); }
        if (event.key === 'Tab')
        {
            const focusable = [...popover.querySelectorAll('button, input, select, summary')].filter(element => element.getClientRects().length && !element.disabled && element.tabIndex >= 0);
            const first = focusable[0], last = focusable.at(-1);
            if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
            else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
        }
    };
    setTimeout(() => { if (genealogyDatePopover === popover) document.addEventListener('click', genealogyDateOutsideHandler); }, 0);
    document.addEventListener('keydown', genealogyDateKeyHandler, true);
    get('smart').focus({ preventScroll: true });
}
