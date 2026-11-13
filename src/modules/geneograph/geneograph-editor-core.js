function renderGeneoModeTool(
    type,
    iconSvg,
    label
)
{
    const active =
        state.geneoTool === type;

    const localizedLabel =
        t(label);

    return `
        <button
          class="geneo-tool ${
                active
                    ? 'active'
                    : ''
            }"
          type="button"
          data-geneo-tool="${escapeHtml(type)}"
          aria-pressed="${
                active
                    ? 'true'
                    : 'false'
            }"
          aria-label="${escapeHtml(localizedLabel)}"
          title="${escapeHtml(localizedLabel)}">

          <span aria-hidden="true">
            ${iconSvg}
          </span>

          <span class="geneo-tool-label">
            ${escapeHtml(localizedLabel)}
          </span>
        </button>
      `;
}

function activateGeneographConnectionTool()
{
    cancelGeneographPencilStroke();
    cancelGeneographConnectionDraft();

    state.geneoPlacementReturnTool =
        null;

    state.geneoTool =
        'connect';

    geneoConnectionToolStyle();
    geneoConnectionToolRuntime.purpose = 'automatic';
    geneoConnectionToolRuntime.offerVisual = false;
    geneoConnectionToolRuntime.panelOpen = true;

    renderGeneographEditorPreserveScroll();
}

function exportGeneographBoard(anchor = null)
{
    openGeneographExportMenu(anchor || main.querySelector('[data-geneo-export]')
        || main.querySelector('[data-geneo-toolbar-overflow]'));
}

function renderGeneoToolbarObjectButton(
    type,
    iconSvg,
    label
)
{
    const isPlacementTool =
        [
            'panel',
            'sticky',
            'text'
        ].includes(type);

    const active =
        isPlacementTool
        && state.geneoTool === type;

    const actionAttribute =
        isPlacementTool
            ? `data-geneo-placement-tool="${
                escapeHtml(type)
            }"`
            : `data-geneo-add="${
                escapeHtml(type)
            }"`;

    const actionLabel =
        type === 'panel'
            ? `Draw ${label}`
            : isPlacementTool
                ? `Place ${label}`
                : `Add ${label}`;

    const localizedActionLabel =
        translateText(actionLabel);

    return `
        <button
          class="geneo-toolbar-object ${
                active
                    ? 'active'
                    : ''
            }"
          type="button"
          data-geneo-toolbar-item="${
                escapeHtml(type)
            }"
          ${actionAttribute}
          ${
                isPlacementTool
                    ? `aria-pressed="${
                        active
                            ? 'true'
                            : 'false'
                    }"`
                    : ''
            }
          title="${
                escapeHtml(localizedActionLabel)
            }"
          aria-label="${
                escapeHtml(localizedActionLabel)
            }">

          <span aria-hidden="true">
            ${iconSvg}
          </span>

          <span class="geneo-toolbar-label">
            ${escapeHtml(t(label))}
          </span>
        </button>
      `;
}

function geneoToolbarPersonGender()
{
    return ['male', 'female', 'unknown'].includes(state.geneoPersonGender)
        ? state.geneoPersonGender
        : 'male';
}

function closeGeneoOpenMenuOnTrigger(anchor)
{
    if (anchor.getAttribute('aria-expanded') !== 'true' || !document.getElementById('projectMenu')) return false;
    closeMenu();
    if (!lastInteractionWasKeyboard) anchor.blur();
    return true;
}

function restoreGeneoMenuFocusAfterEscape(anchor)
{
    if (anchor.closest('.tool-split'))
    {
        suppressSplitFocusAfterEscape(anchor);
    }
    else anchor.focus({ preventScroll: true });
}

function renderGeneoPersonSplitTool()
{
    const gender = geneoToolbarPersonGender();
    const actionLabel = `${t('Add person')}: ${t(capitalize(gender))}`;

    return `
        <div class="tool-split" data-tool-split="person" data-geneo-toolbar-item="person">
          <button class="tool-split-main" type="button" data-geneo-person-main
            aria-label="${escapeHtml(actionLabel)}" title="${escapeHtml(actionLabel)}">
            ${icon.profile}
            <span>${escapeHtml(t('Person'))}</span>
          </button>
          <button class="tool-split-trigger" type="button" data-geneo-person-menu
            aria-label="${escapeHtml(t('Choose person gender'))}"
            title="${escapeHtml(t('Choose person gender'))}"
            aria-haspopup="menu" aria-expanded="false">
            ${icon.chevron}
          </button>
        </div>`;
}

function openGeneoPersonGenderMenu(anchor)
{
    if (!(anchor instanceof HTMLElement)) return;
    if (closeGeneoOpenMenuOnTrigger(anchor)) return;
    closeMenu();
    const rect = anchor.getBoundingClientRect();
    const menu = document.createElement('div');
    menu.className = 'menu-popover tool-options-menu';
    menu.id = 'projectMenu';
    menu.setAttribute('role', 'menu');
    menu.setAttribute('aria-label', t('Choose person gender'));
    menu.style.top = `${rect.bottom + 7}px`;
    menu.style.left = `${Math.max(12, Math.min(rect.left - 118, window.innerWidth - 210))}px`;
    menu.innerHTML = ['male', 'female', 'unknown'].map(gender => {
        return `<button type="button" role="menuitemradio" aria-checked="${geneoToolbarPersonGender() === gender}"
            data-geneo-person-gender="${gender}"><span>${escapeHtml(t(capitalize(gender)))}</span></button>`;
    }).join('');
    document.body.appendChild(menu);
    if (window.innerWidth <= 900) mountMobileChoiceSheet(menu, anchor, t('Choose person gender'));
    anchor.setAttribute('aria-expanded', 'true');
    menu.addEventListener('click', event => {
        const button = event.target.closest('[data-geneo-person-gender]');
        if (!button) return;
        state.geneoPersonGender = button.dataset.geneoPersonGender;
        closeMenu();
        addGeneographObject('person');
    });
    menu.addEventListener('keydown', event => {
        const items = [...menu.querySelectorAll('[role="menuitemradio"]')];
        const index = items.indexOf(document.activeElement);
        if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            closeMenu();
            restoreGeneoMenuFocusAfterEscape(anchor);
        } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            items[(index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]?.focus();
        } else if (event.key === 'Home' || event.key === 'End') {
            event.preventDefault();
            items[event.key === 'Home' ? 0 : items.length - 1]?.focus();
        }
    });
    bindMenuLifecycle(anchor);
    requestAnimationFrame(() => menu.querySelector('[aria-checked="true"]')?.focus({ preventScroll: true }));
}

function renderGeneoConnectionLineSample(pattern, color = 'currentColor')
{
    const dash = geneoConnectionDashArray(pattern, 2);
    return `<svg class="geneo-line-sample" viewBox="0 0 88 16" aria-hidden="true"><line x1="3" y1="8" x2="85" y2="8" stroke="${escapeHtml(color)}" stroke-width="2" stroke-linecap="round" ${dash ? `stroke-dasharray="${dash}"` : ''}></line></svg>`;
}

function renderGeneoConnectionStyleFields(style, scope)
{
    const prefix = scope === 'default' ? 'geneo-connection-default' : 'geneo-connection-tool';
    return `<div class="geneo-connection-style-fields" data-geneo-connection-fields="${scope}">
      <div class="geneo-field"><span class="geneo-setting-label">${escapeHtml(t('Pattern'))}</span><button type="button" class="geneo-connection-default-pattern" data-${prefix}-pattern aria-label="${escapeHtml(`${t('Pattern')}: ${t(GENEO_CONNECTION_PATTERN_LABELS[style.pattern])}`)}" title="${escapeHtml(t(GENEO_CONNECTION_PATTERN_LABELS[style.pattern]))}" aria-haspopup="menu" aria-expanded="false">${renderGeneoConnectionLineSample(style.pattern)}<span class="common-select-chevron" aria-hidden="true">${icon.chevron}</span></button></div>
      <label class="geneo-field"><span class="geneo-setting-label">${escapeHtml(t('Width'))}</span><span class="geneo-number-unit"><input class="geneo-input" type="number" min="1" max="12" step="1" value="${style.width}" data-${prefix}-width><span aria-hidden="true">px</span></span></label>
      ${renderGeneoPaintControl({ scope: 'connection-default', property: 'line' })}
      <fieldset class="geneo-connection-arrows"><legend class="geneo-setting-label">${escapeHtml(t('Arrowheads'))}</legend><div class="geneo-connection-arrow-options">${GENEO_CONNECTION_ARROWS.map(value => `<label><input type="radio" name="${prefix}-arrows" value="${value}" data-${prefix}-arrows ${style.arrows === value ? 'checked' : ''}><span>${escapeHtml(t(capitalize(value)))}</span></label>`).join('')}</div></fieldset>
      <div class="geneo-person-card-radius-row geneo-connection-radius-row"><label class="geneo-field" for="geneoConnectionDefaultRadius"><span class="geneo-setting-label">${escapeHtml(t('Corner radius'))}</span><span class="geneo-selection-help">0–32 px</span></label><input class="geneo-input" id="geneoConnectionDefaultRadius" type="number" min="0" max="32" step="1" value="${style.cornerRadius}" data-geneo-connection-default-radius></div>
      <label class="geneo-check geneo-connection-date-default"><input type="checkbox" data-geneo-connection-default-dates ${style.showRelationshipDates ? 'checked' : ''}><span>${escapeHtml(t('Show relationship date on board'))}</span></label>
    </div>`;
}

function renderGeneoConnectionInspectorStyleFields(connection)
{
    const style = geneoEffectiveConnectionStyle(connection);
    return `<div class="geneo-connection-style-fields" data-geneo-connection-fields="inspector">
      <div class="geneo-field"><span class="geneo-setting-label">${escapeHtml(t('Pattern'))}</span><button type="button" class="geneo-connection-default-pattern" data-geneo-connection-inspector-pattern aria-label="${escapeHtml(`${t('Pattern')}: ${t(GENEO_CONNECTION_PATTERN_LABELS[style.pattern])}`)}" title="${escapeHtml(t(GENEO_CONNECTION_PATTERN_LABELS[style.pattern]))}" aria-haspopup="menu" aria-expanded="false" ${style.line.enabled ? '' : 'disabled'}>${renderGeneoConnectionLineSample(style.pattern)}<span class="common-select-chevron" aria-hidden="true">${icon.chevron}</span></button></div>
      <div class="geneo-field"><label class="geneo-setting-label" for="geneoConnectionStrokeWidth">${escapeHtml(t('Width'))}</label><span class="geneo-number-unit"><input class="geneo-input" id="geneoConnectionStrokeWidth" type="number" min="1" max="12" step="1" value="${style.width}" data-geneo-stroke-width="connection"><span aria-hidden="true">px</span></span></div>
      ${renderGeneoPaintControl({ scope: 'connection', id: connection.id, property: 'line' })}
      ${connection.kind === 'visual' ? `<fieldset class="geneo-connection-arrows"><legend class="geneo-setting-label">${escapeHtml(t('Arrowheads'))}</legend><div class="geneo-connection-arrow-options">${GENEO_CONNECTION_ARROWS.map(value => `<label><input type="radio" name="geneo-inspector-arrows" value="${value}" data-geneo-connection-arrows ${style.arrows === value ? 'checked' : ''}><span>${escapeHtml(t(capitalize(value)))}</span></label>`).join('')}</div></fieldset>` : ''}
      <div class="geneo-person-card-radius-row geneo-connection-radius-row"><label class="geneo-field" for="geneoConnectionRadius"><span class="geneo-setting-label">${escapeHtml(t('Corner radius'))}</span><span class="geneo-selection-help">0–32 px</span></label><input class="geneo-input" id="geneoConnectionRadius" type="number" min="0" max="32" step="1" value="${style.cornerRadius}" data-geneo-connection-radius></div>
    </div>`;
}

function renderGeneoConnectionArrowSample(arrows)
{
    const start = arrows === 'start' || arrows === 'both';
    const end = arrows === 'end' || arrows === 'both';
    return `<svg class="geneo-line-sample" viewBox="0 0 88 16" aria-hidden="true"><line x1="3" y1="8" x2="85" y2="8" stroke="currentColor" stroke-width="2"></line>${start ? '<path d="M3 8 L11 4 M3 8 L11 12" fill="none" stroke="currentColor" stroke-width="2"></path>' : ''}${end ? '<path d="M85 8 L77 4 M85 8 L77 12" fill="none" stroke="currentColor" stroke-width="2"></path>' : ''}</svg>`;
}

function renderGeneoConnectionPurposeButton()
{
    const visual = geneoConnectionToolRuntime.purpose === 'visual';
    const label = `${t('Connection type')}: ${t(visual ? 'Visual only' : 'Automatic')}`;
    const title = geneoConnectionToolRuntime.offerVisual ? `${label}. ${t('Choose Visual only to draw without a family relationship.')}` : label;
    return `<button type="button" class="geneo-connection-choice geneo-connection-purpose ${geneoConnectionToolRuntime.offerVisual ? 'needs-choice' : ''}" data-geneo-connection-purpose aria-label="${escapeHtml(label)}" title="${escapeHtml(title)}" aria-haspopup="menu" aria-expanded="false">${visual ? icon.link : icon.tree}${icon.chevron}</button>`;
}

function openGeneoConnectionPurposeMenu(anchor, activateTool = false)
{
    if (closeGeneoOpenMenuOnTrigger(anchor)) return;
    closeMenu();
    const menu = document.createElement('div');
    menu.id = 'projectMenu';
    menu.className = 'menu-popover tool-options-menu geneo-purpose-menu';
    menu.setAttribute('role', 'menu');
    menu.setAttribute('aria-label', t('Connection type'));
    menu.innerHTML = ['automatic', 'visual'].map(value => `<button type="button" role="menuitemradio" aria-checked="${(geneoConnectionToolRuntime.purpose || 'automatic') === value}" data-purpose="${value}">${value === 'visual' ? icon.link : icon.tree}<span><strong>${escapeHtml(t(value === 'visual' ? 'Visual only' : 'Automatic'))}</strong>${value === 'automatic' ? `<small>${escapeHtml(t('Family relationships between people; visual links for other objects.'))}</small>` : ''}</span><span class="geneo-purpose-check">${(geneoConnectionToolRuntime.purpose || 'automatic') === value ? icon.check : ''}</span></button>`).join('');
    document.body.appendChild(menu);
    const rect = anchor.getBoundingClientRect();
    menu.style.left = `${Math.max(12, Math.min(rect.left, innerWidth - menu.offsetWidth - 12))}px`;
    menu.style.top = `${rect.bottom + menu.offsetHeight + 7 <= innerHeight - 12 ? rect.bottom + 7 : Math.max(12, rect.top - menu.offsetHeight - 7)}px`;
    if (innerWidth <= 900) mountMobileChoiceSheet(menu, anchor, t('Connection type'));
    anchor.setAttribute('aria-expanded', 'true');
    menu.addEventListener('click', event =>
    {
        const option = event.target.closest('[data-purpose]');
        if (!option) return;
        if (activateTool)
        {
            cancelGeneographPencilStroke();
            cancelGeneographConnectionDraft();
            state.geneoPlacementReturnTool = null;
            state.geneoTool = 'connect';
            geneoConnectionToolStyle();
            geneoConnectionToolRuntime.panelOpen = true;
        }
        geneoConnectionToolRuntime.purpose = option.dataset.purpose;
        geneoConnectionToolRuntime.offerVisual = false;
        closeMenu();
        if (activateTool)
        {
            renderGeneographEditorPreserveScroll();
            return;
        }
        anchor.innerHTML = `${option.dataset.purpose === 'visual' ? icon.link : icon.tree}${icon.chevron}`;
        anchor.classList.remove('needs-choice');
        const label = `${t('Connection type')}: ${t(option.dataset.purpose === 'visual' ? 'Visual only' : 'Automatic')}`;
        anchor.title = label; anchor.setAttribute('aria-label', label);
        anchor.focus({ preventScroll: true });
        updateGeneographConnectionTip();
    });
    menu.addEventListener('keydown', event =>
    {
        const items = [...menu.querySelectorAll('[role="menuitemradio"]')];
        const index = items.indexOf(document.activeElement);
        if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); closeMenu(); restoreGeneoMenuFocusAfterEscape(anchor); }
        else if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key))
        {
            event.preventDefault();
            items[event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]?.focus();
        }
    });
    bindMenuLifecycle(anchor, { ignoreScrollWithin: anchor.closest('[data-geneo-connection-panel]') });
    requestAnimationFrame(() => menu.querySelector('[aria-checked="true"]')?.focus({ preventScroll: true }));
}

function renderGeneoConnectionToolPanel()
{
    if (state.geneoTool !== 'connect' || !geneoConnectionToolRuntime.panelOpen) return '';
    const style = geneoConnectionToolStyle();
    return `<section class="geneo-tool-settings geneo-connection-tool-panel" data-geneo-connection-panel role="toolbar" aria-label="${escapeHtml(t('Connection settings'))}"><div class="geneo-connection-tool-row">${renderGeneoConnectionPurposeButton()}<button type="button" class="geneo-connection-choice" data-geneo-connection-tool-pattern aria-label="${escapeHtml(`${t('Pattern')}: ${t(GENEO_CONNECTION_PATTERN_LABELS[style.pattern])}`)}" title="${escapeHtml(t(GENEO_CONNECTION_PATTERN_LABELS[style.pattern]))}" aria-haspopup="menu" aria-expanded="false">${renderGeneoConnectionLineSample(style.pattern)}${icon.chevron}</button><button type="button" class="geneo-connection-tool-swatch geneo-paint-swatch" data-geneo-connection-tool-swatch data-geneo-paint-scope="connection-tool" data-geneo-paint-id="" data-geneo-paint-property="line" data-geneo-paint-open style="${geneoPaintSwatchStyle(style.line)}" aria-label="${escapeHtml(`${t('Connection color')}: ${style.line.color}`)}" title="${escapeHtml(t('Connection color'))}" aria-haspopup="dialog" aria-expanded="false"><span></span></button><label class="geneo-connection-tool-width"><input type="number" min="1" max="12" step="1" value="${style.width}" data-geneo-connection-tool-width aria-label="${escapeHtml(`${t('Width')} (px)`)}" title="${escapeHtml(`${t('Width')} (px)`)}"><span aria-hidden="true">px</span></label><button type="button" class="geneo-connection-choice" data-geneo-connection-tool-arrows aria-label="${escapeHtml(`${t('Arrowheads')}: ${t(capitalize(style.arrows))}`)}" title="${escapeHtml(`${t('Arrowheads')}: ${t(capitalize(style.arrows))}`)}" aria-haspopup="menu" aria-expanded="false">${renderGeneoConnectionArrowSample(style.arrows)}${icon.chevron}</button><span class="geneo-connection-tool-divider" aria-hidden="true"></span><button type="button" class="geneo-connection-tool-icon" data-geneo-connection-tool-reset aria-label="${escapeHtml(t('Reset to board defaults'))}" title="${escapeHtml(t('Reset to board defaults'))}">${icon.undo}</button><button type="button" class="geneo-connection-tool-icon" data-geneo-connection-panel-close aria-label="${escapeHtml(t('Close connection settings'))}" title="${escapeHtml(t('Close connection settings'))}">${icon.close}</button></div></section>`;
}

function renderGeneoCreationToolPanel(tool)
{
    const active = tool === 'drawing' ? 'pencil' : 'shape';
    const settings = geneoCreationToolSettings(tool);
    if (state.geneoTool !== active || !settings.panelOpen) return '';
    const appearance = settings.appearance;
    const swatch = property => `<button type="button" class="geneo-connection-tool-swatch geneo-paint-swatch ${appearance[property].enabled ? '' : 'is-none'}" data-geneo-creation-swatch="${property}" data-geneo-paint-scope="creation-tool" data-geneo-paint-id="${tool}" data-geneo-paint-property="${property}" data-geneo-paint-open style="${geneoPaintSwatchStyle(appearance[property])}" aria-label="${escapeHtml(`${t(capitalize(property))}: ${appearance[property].enabled ? appearance[property].color : t('None')}`)}" title="${escapeHtml(t(capitalize(property)))}" aria-haspopup="dialog" aria-expanded="false"><span></span></button>`;
    const pattern = `<button type="button" class="geneo-connection-choice" data-geneo-creation-pattern="${tool}" aria-label="${escapeHtml(`${t('Pattern')}: ${t(GENEO_CONNECTION_PATTERN_LABELS[appearance.strokePattern])}`)}" title="${escapeHtml(t('Stroke pattern'))}" aria-haspopup="menu" aria-expanded="false">${renderGeneoConnectionLineSample(appearance.strokePattern)}${icon.chevron}</button>`;
    const width = `<label class="geneo-connection-tool-width"><input type="number" min="1" max="12" step="1" value="${appearance.strokeWidth}" data-geneo-creation-width="${tool}" aria-label="${escapeHtml(`${t('Stroke width')} (px)`)}" title="${escapeHtml(`${t('Stroke width')} (px)`)}"><span aria-hidden="true">px</span></label>`;
    const shape = tool === 'shape';
    const shapeChoice = shape ? `<button type="button" class="geneo-connection-choice geneo-creation-shape-choice" data-geneo-creation-shape-kind aria-label="${escapeHtml(`${t('Shape type')}: ${t(geneoShapeLabel(settings.shapeKind))}`)}" title="${escapeHtml(t('Shape type'))}" aria-haspopup="menu" aria-expanded="false"><span class="geneo-shape-option-preview shape-${escapeHtml(settings.shapeKind)}" aria-hidden="true"></span>${icon.chevron}</button>` : '';
    return `<section class="geneo-tool-settings geneo-connection-tool-panel geneo-creation-tool-panel" data-geneo-creation-panel="${tool}" role="toolbar" aria-label="${escapeHtml(t(shape ? 'Shape settings' : 'Drawing settings'))}"><div class="geneo-connection-tool-row">${shapeChoice}${shape ? swatch('fill') : ''}${swatch('stroke')}${width}${pattern}<span class="geneo-connection-tool-divider" aria-hidden="true"></span><button type="button" class="geneo-connection-tool-icon" data-geneo-creation-reset aria-label="${escapeHtml(t('Reset to default'))}" title="${escapeHtml(t('Reset to default'))}">${icon.undo}</button><button type="button" class="geneo-connection-tool-icon" data-geneo-creation-close aria-label="${escapeHtml(t('Close settings'))}" title="${escapeHtml(t('Close settings'))}">${icon.close}</button></div></section>`;
}

function renderGeneoConnectionSplitTool()
{
    const purposeLabel = geneoConnectionToolRuntime.purpose === 'visual' ? 'Visual only' : 'Automatic';

    const active =
        state.geneoTool === 'connect';

    const title =
        `${t('Connect')}: ${t(purposeLabel)}`;

    return `
        <div
          class="tool-split ${
                active
                    ? 'active'
                    : ''
            }"
          data-tool-split="connection"
          data-geneo-toolbar-item="connect">

          <button
            class="tool-split-main"
            type="button"
            data-geneo-connection-main
            aria-pressed="${
                active
                    ? 'true'
                    : 'false'
            }"
            aria-label="${escapeHtml(title)}"
            title="${escapeHtml(title)}">

            ${icon.link}

            <span>
              ${escapeHtml(t('Connect'))}
            </span>
          </button>

          <button
            class="tool-split-trigger"
            type="button"
            data-geneo-connection-menu
            aria-label="${
                escapeHtml(
                    t('Connection type')
                )
            }"
            title="${escapeHtml(t('Connection type'))}"
            aria-haspopup="menu"
            aria-expanded="false">

            ${icon.chevron}
          </button>
        </div>
      `;
}

function openGeneoConnectionStyleMenu(anchor, choice = 'pattern', scope = 'tool')
{
    if (!(anchor instanceof HTMLElement)) return;
    if (closeGeneoOpenMenuOnTrigger(anchor)) return;
    closeMenu();
    const style = scope === 'default' ? selectedGeneographDiagram().connectionDefaults
        : scope === 'connection' ? geneoEffectiveConnectionStyle(selectedGeneographConnection())
            : scope === 'multi' ? { [choice]: geneoSharedConnectionValue(selectedGeneographConnections(), connection => geneoEffectiveConnectionStyle(connection)[choice]) }
                : geneoConnectionToolStyle();
    const arrows = choice === 'arrows';
    const values = arrows ? GENEO_CONNECTION_ARROWS : GENEO_CONNECTION_PATTERNS;
    const label = arrows ? t('Arrowheads') : t('Connection pattern');
    const rect = anchor.getBoundingClientRect();
    const menu = document.createElement('div');
    menu.className = 'menu-popover tool-options-menu';
    menu.id = 'projectMenu';
    menu.setAttribute('role', 'menu');
    menu.setAttribute('aria-label', label);
    menu.innerHTML = values.map(value => `<button type="button" role="menuitemradio" aria-label="${escapeHtml(t(arrows ? capitalize(value) : GENEO_CONNECTION_PATTERN_LABELS[value]))}" title="${escapeHtml(t(arrows ? capitalize(value) : GENEO_CONNECTION_PATTERN_LABELS[value]))}" aria-checked="${style[choice] === value}" data-geneo-connector="${value}">${arrows ? renderGeneoConnectionArrowSample(value) : renderGeneoConnectionLineSample(value)}</button>`).join('');
    document.body.appendChild(menu);
    menu.style.left = `${Math.max(12, Math.min(rect.left, window.innerWidth - menu.offsetWidth - 12))}px`;
    menu.style.top = `${rect.bottom + menu.offsetHeight + 7 <= window.innerHeight - 12
        ? rect.bottom + 7 : Math.max(12, rect.top - menu.offsetHeight - 7)}px`;
    if (window.innerWidth <= 900) mountMobileChoiceSheet(menu, anchor, label);
    anchor.setAttribute('aria-expanded', 'true');
    menu.addEventListener('click', event =>
    {
        const button = event.target.closest('[data-geneo-connector]');
        if (!button) return;
        const value = button.dataset.geneoConnector;
        if (scope === 'default')
        {
            if (style[choice] !== value)
            {
                geneoPushHistory();
                selectedGeneographDiagram().connectionDefaults[choice] = value;
                touchGeneographBoard();
            }
            closeMenu();
            renderGeneographEditorPreserveScroll({ preserveInspectorScroll: true });
            return;
        }
        if (scope === 'connection')
        {
            const connection = selectedGeneographConnection();
            if (connection && geneoEffectiveConnectionStyle(connection)[choice] !== value)
            {
                geneoPushHistory();
                if (value === selectedGeneographDiagram().connectionDefaults[choice]) delete connection.style[choice];
                else connection.style[choice] = value;
                touchGeneographBoard();
            }
            closeMenu();
            renderGeneographEditorPreserveScroll({ preserveInspectorScroll: true });
            return;
        }
        if (scope === 'multi')
        {
            geneoCommitMultiConnectionAppearance(choice, value);
            closeMenu();
            return;
        }
        geneoConnectionToolStyle();
        if (!anchor.closest('[data-geneo-connection-panel]'))
        {
            cancelGeneographConnectionDraft();
            geneoConnectionToolRuntime.purpose = 'automatic';
        }
        state.geneoTool = 'connect';
        if (value === selectedGeneographDiagram().connectionDefaults[choice]) delete geneoConnectionToolRuntime.overrides[choice];
        else geneoConnectionToolRuntime.overrides[choice] = value;
        geneoConnectionToolRuntime.panelOpen = true;
        closeMenu();
        if (anchor.closest('[data-geneo-connection-panel]')) refreshGeneoConnectionToolUi();
        else renderGeneographEditorPreserveScroll();
    });
    menu.addEventListener('keydown', event =>
    {
        const items = [...menu.querySelectorAll('[role="menuitemradio"]')];
        const index = items.indexOf(document.activeElement);
        if (event.key === 'Escape')
        {
            event.preventDefault();
            event.stopPropagation();
            closeMenu();
            restoreGeneoMenuFocusAfterEscape(anchor);
        }
        else if (event.key === 'ArrowDown' || event.key === 'ArrowUp')
        {
            event.preventDefault();
            items[(index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]?.focus();
        }
        else if (event.key === 'Home' || event.key === 'End')
        {
            event.preventDefault();
            items[event.key === 'Home' ? 0 : items.length - 1]?.focus();
        }
    });
    bindMenuLifecycle(anchor, { ignoreScrollWithin: anchor.closest('[data-geneo-connection-panel], .geneo-inspector') });
    requestAnimationFrame(() => menu.querySelector('[aria-checked="true"]')?.focus({ preventScroll: true }));
}

function normalizeGeneographContentKind(
    value
)
{
    return value === 'text'
        ? 'text'
        : 'sticky';
}

function renderGeneoContentSplitTool()
{
    const kind =
        normalizeGeneographContentKind(
            state.geneoContentKind
        );

    const active =
        [
            'sticky',
            'text'
        ].includes(state.geneoTool);

    const actionLabel =
        kind === 'text'
            ? 'Text'
            : 'Sticky note';

    const selectedIcon =
        kind === 'text'
            ? icon.text
            : icon.note;

    return `
        <div
          class="tool-split ${
                active
                    ? 'active'
                    : ''
            }"
          data-tool-split="content"
          data-geneo-toolbar-item="content">

          <button
            class="tool-split-main"
            type="button"
            data-geneo-content-main
            aria-pressed="${
                active
                    ? 'true'
                    : 'false'
            }"
            aria-label="${
                escapeHtml(t(actionLabel))
            }"
            title="${
                escapeHtml(t(actionLabel))
            }">

            ${selectedIcon}

            <span>
              ${escapeHtml(t('Notes & text'))}
            </span>
          </button>

          <button
            class="tool-split-trigger"
            type="button"
            data-geneo-content-menu
            aria-label="${
                escapeHtml(
                    t('Choose content type')
                )
            }"
            title="${escapeHtml(t('Choose content type'))}"
            aria-haspopup="menu"
            aria-expanded="false">

            ${icon.chevron}
          </button>

          <button class="geneo-mobile-content-tool" type="button" data-geneo-mobile-content="sticky" aria-label="${escapeHtml(t('Sticky note'))}" title="${escapeHtml(t('Sticky note'))}" aria-pressed="${state.geneoTool === 'sticky'}">${icon.note}</button>
          <button class="geneo-mobile-content-tool" type="button" data-geneo-mobile-content="text" aria-label="${escapeHtml(t('Text'))}" title="${escapeHtml(t('Text'))}" aria-pressed="${state.geneoTool === 'text'}">${icon.text}</button>
        </div>
      `;
}

function openGeneoContentMenu(
    anchor
)
{
    if (
        !(anchor instanceof HTMLElement)
    )
    {
        return;
    }

    if (closeGeneoOpenMenuOnTrigger(anchor)) return;
    closeMenu();

    const selected =
        normalizeGeneographContentKind(
            state.geneoContentKind
        );

    const rect =
        anchor.getBoundingClientRect();

    const menu =
        document.createElement('div');

    menu.className =
        'menu-popover tool-options-menu';

    menu.id =
        'projectMenu';

    menu.setAttribute(
        'role',
        'menu'
    );

    menu.setAttribute(
        'aria-label',
        t('Choose content type')
    );

    menu.style.top =
        `${rect.bottom + 7}px`;

    menu.style.left =
        `${
            Math.max(
                12,
                Math.min(
                    rect.left - 118,
                    window.innerWidth - 210
                )
            )
        }px`;

    menu.innerHTML = `
        <button
          type="button"
          role="menuitemradio"
          aria-checked="${
                selected === 'sticky'
                    ? 'true'
                    : 'false'
            }"
          data-geneo-content-kind="sticky">

          ${icon.note}

          <span>
            ${escapeHtml(t('Sticky note'))}
          </span>
        </button>

        <button
          type="button"
          role="menuitemradio"
          aria-checked="${
                selected === 'text'
                    ? 'true'
                    : 'false'
            }"
          data-geneo-content-kind="text">

          ${icon.text}

          <span>
            ${escapeHtml(t('Text'))}
          </span>
        </button>
      `;

    document.body.appendChild(menu);

    anchor.setAttribute(
        'aria-expanded',
        'true'
    );

    menu.addEventListener(
        'click',
        event =>
        {
            const button =
                event.target.closest(
                    '[data-geneo-content-kind]'
                );

            if (!button) return;

            const kind =
                normalizeGeneographContentKind(
                    button.dataset
                        .geneoContentKind
                );

            state.geneoContentKind =
                kind;

            closeMenu();

            activateGeneographPlacementTool(
                kind
            );
        }
    );

    menu.addEventListener(
        'keydown',
        event =>
        {
            const items = [
                ...menu.querySelectorAll(
                    '[role="menuitemradio"]'
                )
            ];

            const index =
                items.indexOf(
                    document.activeElement
                );

            if (event.key === 'Escape')
            {
                event.preventDefault();
                event.stopPropagation();

                closeMenu();
                restoreGeneoMenuFocusAfterEscape(anchor);

                return;
            }

            if (
                event.key === 'ArrowDown'
            || event.key === 'ArrowUp'
            )
            {
                event.preventDefault();

                const direction =
                    event.key === 'ArrowDown'
                        ? 1
                        : -1;

                items[
                    (
                        index
                + direction
                + items.length
                    ) % items.length
                ]?.focus();

                return;
            }

            if (
                event.key === 'Home'
            || event.key === 'End'
            )
            {
                event.preventDefault();

                items[
                    event.key === 'Home'
                        ? 0
                        : items.length - 1
                ]?.focus();
            }
        }
    );

    bindMenuLifecycle(anchor);

    requestAnimationFrame(
        () =>
        {
            menu
                .querySelector(
                    '[aria-checked="true"]'
                )
                ?.focus({ preventScroll: true });
        }
    );
}

function renderGeneoShapeSplitTool()
{
    const kind =
        normalizeGeneographShapeKind(
            geneoCreationToolSettings('shape').shapeKind
        );

    const selectedShapeLabel =
        geneoShapeLabel(kind);

    const active =
        state.geneoTool === 'shape';

    const title =
        `${t('Shapes')}: ${
            t(selectedShapeLabel)
        }`;

    return `
        <div
          class="tool-split ${
                active
                    ? 'active'
                    : ''
            }"
          data-tool-split="shape"
          data-geneo-toolbar-item="shape">

          <button
            class="tool-split-main"
            type="button"
            data-geneo-shape-main
            aria-haspopup="${window.innerWidth <= 900 ? 'dialog' : 'false'}"
            aria-expanded="false"
            aria-pressed="${
                active
                    ? 'true'
                    : 'false'
            }"
            aria-label="${escapeHtml(title)}"
            title="${escapeHtml(title)}">

            ${icon.shape}

            <span>
              ${escapeHtml(t('Shapes'))}
            </span>
          </button>

          <button
            class="tool-split-trigger"
            type="button"
            data-geneo-shape-menu
            aria-label="${
                escapeHtml(t('Choose shape'))
            }"
            title="${escapeHtml(t('Choose shape'))}"
            aria-haspopup="menu"
            aria-expanded="false">

            ${icon.chevron}
          </button>
        </div>
      `;
}

function openGeneoShapeMenu(anchor)
{
    if (!(anchor instanceof HTMLElement)) return;
    if (closeGeneoOpenMenuOnTrigger(anchor)) return;
    closeMenu();
    const selected = normalizeGeneographShapeKind(geneoCreationToolSettings('shape').shapeKind);
    const rect = anchor.getBoundingClientRect();
    const menu = document.createElement('div');
    menu.className = 'menu-popover tool-options-menu geneo-shape-options-menu';
    menu.id = 'projectMenu';
    menu.setAttribute('role', 'menu');
    menu.setAttribute('aria-label', t('Shape type'));
    menu.innerHTML = GENEO_SHAPE_KINDS.map(shape => `<button type="button" role="menuitemradio" aria-label="${escapeHtml(t(shape.label))}" aria-checked="${selected === shape.id}" data-geneo-shape-kind="${escapeHtml(shape.id)}"><span class="geneo-shape-option-preview shape-${escapeHtml(shape.id)}" aria-hidden="true"></span><span>${escapeHtml(t(shape.label))}</span></button>`).join('');
    document.body.appendChild(menu);
    menu.style.left = `${Math.max(12, Math.min(rect.left, window.innerWidth - menu.offsetWidth - 12))}px`;
    menu.style.top = `${rect.bottom + menu.offsetHeight + 7 <= window.innerHeight - 12 ? rect.bottom + 7 : Math.max(12, rect.top - menu.offsetHeight - 7)}px`;
    if (window.innerWidth <= 900) mountMobileChoiceSheet(menu, anchor, t('Shapes'));
    anchor.setAttribute('aria-expanded', 'true');
    menu.addEventListener('click', event =>
    {
        const button = event.target.closest('[data-geneo-shape-kind]');
        if (!button) return;
        geneoCreationToolSettings('shape').shapeKind = normalizeGeneographShapeKind(button.dataset.geneoShapeKind);
        geneoCreationToolSettings('shape').panelOpen = true;
        closeMenu();
        if (state.geneoTool === 'shape') renderGeneographEditorPreserveScroll();
        else activateGeneographPlacementTool('shape');
        if (lastInteractionWasKeyboard) requestAnimationFrame(() =>
            (main.querySelector('[data-geneo-shape-main]:not([tabindex="-1"])')
                || main.querySelector('[data-geneo-toolbar-overflow]'))?.focus({ preventScroll: true }));
    });
    menu.addEventListener('keydown', event =>
    {
        const items = [...menu.querySelectorAll('[role="menuitemradio"]')];
        const index = items.indexOf(document.activeElement);
        if (event.key === 'Escape')
        {
            event.preventDefault();
            event.stopPropagation();
            closeMenu();
            restoreGeneoMenuFocusAfterEscape(anchor);
        }
        else if (event.key === 'ArrowDown' || event.key === 'ArrowUp')
        {
            event.preventDefault();
            items[(index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]?.focus();
        }
        else if (event.key === 'Home' || event.key === 'End')
        {
            event.preventDefault();
            items[event.key === 'Home' ? 0 : items.length - 1]?.focus();
        }
    });
    bindMenuLifecycle(anchor);
    requestAnimationFrame(() => menu.querySelector('[aria-checked="true"]')?.focus({ preventScroll: true }));
}

function geneoToolbarOverflowItems(toolbar)
{
    const mobile = window.innerWidth <= 900;
    const groups = [
        ['history', [['undo', 'Undo', icon.undo], ['redo', 'Redo', icon.redo]]],
        ['modes', [['select', 'Select', icon.cursorSelect], ['pan', 'Pan', icon.pan], ['pencil', 'Pencil', icon.edit]]],
        ['connect', [['connect', 'Connect', icon.link], ['connection-style', 'Connection style', icon.link]]],
        ['person', [['person', 'Person', icon.profile], ['person-gender', 'Choose person gender', icon.chevron]]],
        ['place', [['place', 'Place', icon.mapPin]]],
        ['image', [['image', 'Image', icon.image]]],
        ['panel', [['panel', 'Panel', icon.panel]]],
        ['content', mobile
            ? [['sticky', 'Sticky note', icon.note], ['text', 'Text', icon.text]]
            : [['content', state.geneoContentKind === 'text' ? 'Text' : 'Sticky note',
                state.geneoContentKind === 'text' ? icon.text : icon.note],
            ['content-style', 'Choose content type', icon.chevron]]],
        ['shape', mobile
            ? [['shape', 'Shapes', icon.shape]]
            : [['shape', 'Shapes', icon.shape], ['shape-style', 'Choose shape', icon.shape]]],
        ['export', [['export', 'Export board', icon.export]]]
    ];
    return groups.flatMap(([id, actions]) =>
        geneoToolbarControl(toolbar, id)?.hasAttribute('data-geneo-hidden')
            ? actions.map(([action, label, itemIcon]) => ({ action, label: t(label), icon: itemIcon,
                disabled: action === 'undo' ? !geneoHistoryRuntime.undo.length
                    : action === 'redo' ? !geneoHistoryRuntime.redo.length : false }))
            : []);
}

function openGeneoToolbarOverflowMenu(
    anchor
)
{
    if (
        !(anchor instanceof HTMLElement)
    )
    {
        return;
    }

    closeMenu();

    const toolbar =
        main.querySelector(
            '.geneo-editor-toolbar'
        );

    const items = geneoToolbarOverflowItems(toolbar);
    if (!items.length) return;

    const rect =
        anchor.getBoundingClientRect();

    const menu =
        document.createElement('div');

    menu.className =
        'menu-popover tool-options-menu geneo-toolbar-overflow-menu';

    menu.id =
        'projectMenu';

    menu.setAttribute(
        'role',
        'menu'
    );

    menu.setAttribute(
        'aria-label',
        t('More board tools')
    );

    menu.style.top =
        `${rect.bottom + 7}px`;

    menu.style.left =
        `${
            Math.max(
                12,
                Math.min(
                    rect.right - 220,
                    window.innerWidth - 232
                )
            )
        }px`;

    menu.innerHTML =
        items
            .map(
                item => `
              <button
                type="button"
                role="menuitem"
                ${item.disabled ? 'disabled' : ''}
                data-geneo-toolbar-action="${
                    escapeHtml(item.action)
                }">

                ${item.icon}

                <span>
                  ${escapeHtml(item.label)}
                </span>
              </button>
            `
            )
            .join('');

    document.body.appendChild(menu);

    anchor.setAttribute(
        'aria-expanded',
        'true'
    );

    menu.addEventListener(
        'click',
        event =>
        {
            const button =
                event.target.closest(
                    '[data-geneo-toolbar-action]'
                );

            if (!button) return;

            const action =
                button.dataset
                    .geneoToolbarAction;

            if (
                action === 'connection-style'
            )
            {
                closeMenu();

                requestAnimationFrame(
                    () =>
                    {
                        openGeneoConnectionStyleMenu(
                            anchor
                        );
                    }
                );

                return;
            }

            if (action === 'shape-style' || action === 'content-style' || action === 'person-gender')
            {
                closeMenu();
                requestAnimationFrame(() => (action === 'shape-style'
                    ? openGeneoShapeMenu : action === 'content-style'
                        ? openGeneoContentMenu : openGeneoPersonGenderMenu)(anchor));
                return;
            }

            closeMenu();

            if (
                [
                    'person',
                    'place',
                    'image'
                ].includes(action)
            )
            {
                addGeneographObject(action);
                return;
            }

            if (action === 'content')
            {
                main.querySelector('[data-geneo-content-main]')?.click();
                return;
            }

            if (action === 'sticky' || action === 'text')
            {
                state.geneoContentKind = action;
                activateGeneographPlacementTool(action);
                return;
            }

            if (action === 'panel')
            {
                activateGeneographPlacementTool(
                    'panel'
                );

                return;
            }

            if (action === 'connect')
            {
                activateGeneographConnectionTool();
                return;
            }

            if (action === 'shape')
            {
                if (window.innerWidth <= 900) openGeneoShapeMenu(anchor);
                else activateGeneographPlacementTool('shape');
                return;
            }

            if (['undo', 'redo', 'select', 'pan', 'pencil'].includes(action))
            {
                main.querySelector(action === 'undo' || action === 'redo'
                    ? `[data-geneo-${action}]` : `[data-geneo-tool="${action}"]`)?.click();
                return;
            }

            if (action === 'export')
            {
                exportGeneographBoard(anchor);
            }
        }
    );

    menu.addEventListener(
        'keydown',
        event =>
        {
            const items = [
                ...menu.querySelectorAll(
                    '[role="menuitem"]'
                )
            ];

            const index =
                items.indexOf(
                    document.activeElement
                );

            if (event.key === 'Escape')
            {
                event.preventDefault();
                event.stopPropagation();

                closeMenu();
                anchor.focus();

                return;
            }

            if (
                event.key === 'ArrowDown'
            || event.key === 'ArrowUp'
            )
            {
                event.preventDefault();

                const direction =
                    event.key === 'ArrowDown'
                        ? 1
                        : -1;

                items[
                    (
                        index
                + direction
                + items.length
                    ) % items.length
                ]?.focus();

                return;
            }

            if (
                event.key === 'Home'
            || event.key === 'End'
            )
            {
                event.preventDefault();

                items[
                    event.key === 'Home'
                        ? 0
                        : items.length - 1
                ]?.focus();
            }
        }
    );

    bindMenuLifecycle(anchor);

    requestAnimationFrame(
        () =>
        {
            menu
                .querySelector(
                    '[role="menuitem"]'
                )
                ?.focus();
        }
    );
}

const GENEO_TOOLBAR_ORDER_RIGHT_TO_LEFT = [
    'export', 'shape', 'content', 'panel', 'image', 'place',
    'person', 'connect', 'modes', 'history'
];

function geneoToolbarControl(toolbar, id)
{
    if (id === 'modes') return toolbar?.querySelector('.geneo-tool-group');
    if (id === 'history') return toolbar?.querySelector('.geneo-history-group');
    return toolbar?.querySelector(`[data-geneo-toolbar-item="${id}"]`);
}

function geneoVisibleToolbarButtons(
    toolbar
)
{
    if (!toolbar) return [];

    return [
        ...toolbar.querySelectorAll(
            'button:not(:disabled)'
        )
    ].filter(
        button =>
            button.getClientRects().length > 0
          && getComputedStyle(button)
              .visibility !== 'hidden'
    );
}

function syncGeneoToolbarTabStops(
    toolbar,
    preferredButton = null
)
{
    const buttons =
        geneoVisibleToolbarButtons(
            toolbar
        );

    if (!buttons.length) return;

    const current =
        buttons.includes(preferredButton)
            ? preferredButton
            : buttons.includes(
                document.activeElement
            )
                ? document.activeElement
                : buttons.find(
                    button =>
                        button.tabIndex === 0
                )
              || buttons[0];

    buttons.forEach(
        button =>
        {
            button.tabIndex =
                button === current
                    ? 0
                    : -1;
        }
    );
}

function bindGeneographToolbarDensity()
{
    const toolbar =
        main.querySelector(
            '.geneo-editor-toolbar'
        );

    if (!toolbar) return;

    geneoToolbarResizeObserver
        ?.disconnect();

    const updateDensity = width =>
    {
        const left = toolbar.querySelector('.geneo-editor-toolbar-left');
        const right = toolbar.querySelector('.geneo-editor-toolbar-right');
        const objects = toolbar.querySelector('.geneo-toolbar-objects');
        toolbar.dataset.toolbarDensity = width >= 1320 ? 'expanded' : 'adaptive';
        delete toolbar.dataset.geneoOverflow;
        GENEO_TOOLBAR_ORDER_RIGHT_TO_LEFT.forEach(id =>
        {
            const control = geneoToolbarControl(toolbar, id);
            control?.removeAttribute('data-geneo-icon-only');
            control?.removeAttribute('data-geneo-hidden');
        });
        objects?.removeAttribute('data-geneo-hidden');
        if (width < 1320)
        {
            const style = getComputedStyle(toolbar);
            const available = width - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight)
                - parseFloat(style.columnGap || style.gap || 0);
            const contentWidth = container =>
            {
                const children = [...container.children]
                    .filter(child => getComputedStyle(child).display !== 'none');
                const gap = parseFloat(getComputedStyle(container).columnGap || 0);
                return children.reduce((sum, child) => sum + Math.max(
                    child.scrollWidth, child.getBoundingClientRect().width), 0)
                    + Math.max(0, children.length - 1) * gap;
            };
            const fits = () => contentWidth(left) + contentWidth(right)
                + (width > 900 && toolbar.querySelector('.geneo-tool-group.is-icon-only:not([data-geneo-icon-only]):not([data-geneo-hidden])')
                    ? 84 : 0) <= available + 1;
            for (const id of GENEO_TOOLBAR_ORDER_RIGHT_TO_LEFT)
            {
                if (fits()) break;
                if (id === 'history' || (width <= 900 && id === 'connect')) continue;
                geneoToolbarControl(toolbar, id)?.setAttribute('data-geneo-icon-only', '');
            }
            const overflowOrder = width <= 900
                ? GENEO_TOOLBAR_ORDER_RIGHT_TO_LEFT.filter(id => !['history', 'modes', 'connect'].includes(id)).concat('history')
                : GENEO_TOOLBAR_ORDER_RIGHT_TO_LEFT;
            for (const id of overflowOrder)
            {
                if (fits()) break;
                geneoToolbarControl(toolbar, id)?.setAttribute('data-geneo-hidden', '');
                toolbar.dataset.geneoOverflow = 'true';
                if ([...objects.children].every(child => child.hasAttribute('data-geneo-hidden')))
                    objects.setAttribute('data-geneo-hidden', '');
            }
        }
        syncGeneoToolbarTabStops(toolbar);
    };

    updateDensity(
        toolbar.getBoundingClientRect()
            .width
    );

    if (
        typeof ResizeObserver
          === 'function'
    )
    {
        geneoToolbarResizeObserver =
            new ResizeObserver(
                entries =>
                {
                    const entry =
                        entries[0];

                    if (!entry) return;

                    updateDensity(
                        entry.contentRect.width
                    );
                }
            );

        geneoToolbarResizeObserver
            .observe(toolbar);
    }
}

function bindGeneographToolbarKeyboard()
{
    const toolbar =
        main.querySelector(
            '.geneo-editor-toolbar'
        );

    if (!toolbar) return;

    syncGeneoToolbarTabStops(
        toolbar
    );

    toolbar.addEventListener(
        'focusin',
        event =>
        {
            const button =
                event.target.closest('button');

            if (!button) return;

            syncGeneoToolbarTabStops(
                toolbar,
                button
            );
        }
    );

    toolbar.addEventListener(
        'keydown',
        event =>
        {
            if (
                ![
                    'ArrowLeft',
                    'ArrowRight',
                    'Home',
                    'End'
                ].includes(event.key)
            )
            {
                return;
            }

            const current =
                event.target.closest('button');

            if (!current) return;

            const buttons =
                geneoVisibleToolbarButtons(
                    toolbar
                );

            const index =
                buttons.indexOf(current);

            if (index < 0) return;

            event.preventDefault();

            let nextIndex =
                index;

            if (event.key === 'Home')
            {
                nextIndex = 0;
            }
            else if (event.key === 'End')
            {
                nextIndex =
                    buttons.length - 1;
            }
            else
            {
                const direction =
                    event.key === 'ArrowRight'
                        ? 1
                        : -1;

                nextIndex =
                    (
                        index
                + direction
                + buttons.length
                    ) % buttons.length;
            }

            const nextButton =
                buttons[nextIndex];

            syncGeneoToolbarTabStops(
                toolbar,
                nextButton
            );

            nextButton?.focus();
        }
    );
}

function validateSampleGeneographCollections(
    warn,
    projectIds
)
{
    const collectionIds =
        new Set();

    (
        sampleData.boardCollections
        || []
    ).forEach(collection =>
    {
        if (!collection.id)
        {
            warn(
                'Board collection is missing an ID'
            );

            return;
        }

        if (
            collectionIds.has(
                collection.id
            )
        )
        {
            warn(
                `Duplicate board collection ID: ${
                    collection.id
                }`
            );
        }

        collectionIds.add(
            collection.id
        );

        if (
            !projectIds.has(
                collection.projectId
            )
        )
        {
            warn(
                `Board collection ${
                    collection.id
                } points to missing project ${
                    collection.projectId
                }`
            );
        }

        if (
            !String(
                collection.name || ''
            ).trim()
        )
        {
            warn(
                `Board collection ${
                    collection.id
                } has no name`
            );
        }
    });

    (
        sampleData.boards
        || []
    ).forEach(board =>
    {
        if (
            !projectIds.has(
                board.projectId
            )
        )
        {
            warn(
                `Board ${
                    board.id
                } points to missing project ${
                    board.projectId
                }`
            );
        }
        if (
            typeof board.archived
            !== 'boolean'
        )
        {
            warn(
                `Board ${
                    board.id
                } has an invalid archived state`
            );
        }
        (
            board.collectionIds
          || []
        ).forEach(collectionId =>
        {
            const collection =
                getBoardCollection(
                    collectionId,
                    {
                        projectId:
                  board.projectId
                    }
                );

            if (!collection)
            {
                warn(
                    `Board ${
                        board.id
                    } points to invalid collection ${
                        collectionId
                    }`
                );
            }
        });

        const diagram =
            board.diagram;

        if (
            !diagram
          || !Array.isArray(diagram.people)
          || !Array.isArray(diagram.families)
          || !Array.isArray(diagram.nodes)
          || !Array.isArray(diagram.connections)
        )
        {
            warn(
                `Board ${board.id} has an invalid diagram`
            );
            return;
        }

        if (!isCanonicalGeneoPaint(diagram.canvas?.backgroundPaint, { mustBeEnabled: true, fixedOpacity: 100 }))
        {
            warn(`Board ${board.id} has an invalid canvas background paint`);
        }

        const peopleIds =
            new Set();
        const nodeIds =
            new Set();
        const familyIds =
            new Set();

        diagram.people
            .forEach(person =>
            {
                if (
                    !person.id
              || peopleIds.has(person.id)
                )
                {
                    warn(
                        `Board ${board.id} has a duplicate or missing person ID`
                    );
                }
                peopleIds.add(person.id);

                if (
                    person.treePersonId
              && !(sampleData.people || [])
                  .some(treePerson =>
                      treePerson.id === person.treePersonId
                  && treePerson.projectId === board.projectId
                  )
                )
                {
                    warn(
                        `Board person ${person.id} has an invalid Family Tree link`
                    );
                }
            });

        diagram.nodes
            .forEach(node =>
            {
                if (
                    !node.id
              || nodeIds.has(node.id)
              || !GENEO_NODE_TYPES.has(node.type)
                )
                {
                    warn(
                        `Board ${board.id} has an invalid node`
                    );
                }
                nodeIds.add(node.id);

                (node.type === 'image' ? ['stroke', 'text'] : ['fill', 'stroke', 'text']).forEach(property =>
                {
                    if (!isCanonicalGeneoPaint(node.appearance?.[property], { mustBeEnabled: property === 'text' }))
                    {
                        warn(`Node ${node.id} has an invalid ${property} paint`);
                    }
                });
                if (!['solid', 'dashed'].includes(node.appearance?.strokePattern))
                {
                    warn(`Node ${node.id} has an invalid stroke pattern`);
                }
                if (
                    !Number.isInteger(node.appearance?.strokeWidth)
              || node.appearance.strokeWidth < GENEO_STROKE_WIDTH_MIN
              || node.appearance.strokeWidth > GENEO_STROKE_WIDTH_MAX
                )
                {
                    warn(`Node ${node.id} has an invalid stroke width`);
                }

                if (
                    node.type === 'person'
              && !peopleIds.has(node.personId)
                )
                {
                    warn(
                        `Person node ${node.id} points to a missing board person`
                    );
                }
                if (
                    node.type === 'person'
              && !['auto', 'manual'].includes(
                  node.personCard?.heightMode
              )
                )
                {
                    warn(
                        `Person node ${node.id} has an invalid height mode`
                    );
                }
                if (
                    node.type === 'shape'
              && !GENEO_SHAPE_KINDS.some(shape => shape.id === node.shapeKind)
                )
                {
                    warn(`Shape node ${node.id} has an invalid shape kind`);
                }
                if (
                    ['shape', 'image', 'place', 'panel', 'sticky', 'text'].includes(node.type)
              && (
                  !Number.isInteger(node.appearance?.cornerRadius)
                || node.appearance.cornerRadius < 0
                || node.appearance.cornerRadius > 32
              )
                )
                {
                    warn(`${node.type} node ${node.id} has an invalid corner radius`);
                }
                if (node.type === 'image' && (!Number.isInteger(node.appearance?.imageOpacity)
                    || node.appearance.imageOpacity < 0 || node.appearance.imageOpacity > 100))
                {
                    warn(`Image node ${node.id} has an invalid opacity`);
                }
                if (['text', 'sticky', 'place'].includes(node.type)
                    && (!Number.isInteger(node.appearance?.fontSize)
                        || node.appearance.fontSize < 8 || node.appearance.fontSize > 72))
                {
                    warn(`${node.type} node ${node.id} has an invalid font size`);
                }
                if (
                    node.type === 'drawing'
              && (
                  !Array.isArray(node.points)
                || node.points.length < 2
                || node.points.some(point =>
                    !Number.isFinite(point?.x)
                  || !Number.isFinite(point?.y)
                  || point.x < 0
                  || point.x > 1
                  || point.y < 0
                  || point.y > 1
                )
              )
                )
                {
                    warn(`Drawing node ${node.id} has invalid points`);
                }
                if (node.type === 'place')
                {
                    const ref = node.placeRef;
                    const projectPlace = ref?.scope === 'project'
                        ? (sampleData.places || []).find(place => place.id === ref.id)
                        : null;
                    if (
                        !ref
                || !['project', 'board'].includes(ref.scope)
                || (ref.scope === 'board' && !String(ref.name || '').trim())
                || (ref.scope === 'project' && (
                    !projectPlace
                  || projectPlace.deleted
                  || projectPlace.projectId !== board.projectId
                ))
                    )
                    {
                        warn(`Place node ${node.id} has an invalid place reference`);
                    }
                    if (
                        ![
                            'auto',
                            'manual'
                        ].includes(
                            node.placeSizeMode
                        )
                    )
                    {
                        warn(
                            `Place node ${node.id} has an invalid size mode`
                        );
                    }
                }
            });

        diagram.families
            .forEach(family =>
            {
                if (
                    !family.id
              || familyIds.has(family.id)
                )
                {
                    warn(
                        `Board ${board.id} has an invalid family ID`
                    );
                }
                familyIds.add(family.id);

                [
                    ...(family.partnerIds || []),
                    ...(family.children || [])
                        .map(child => child.personId)
                ].forEach(personId =>
                {
                    if (!peopleIds.has(personId))
                    {
                        warn(
                            `Family ${family.id} points to a missing board person`
                        );
                    }
                });
            });

        if (!isCanonicalGeneoPaint(diagram.connectionDefaults?.line)
            || !Number.isInteger(diagram.connectionDefaults?.width)
            || diagram.connectionDefaults.width < GENEO_STROKE_WIDTH_MIN
            || diagram.connectionDefaults.width > GENEO_STROKE_WIDTH_MAX
            || !GENEO_CONNECTION_PATTERNS.includes(diagram.connectionDefaults?.pattern)
            || !GENEO_CONNECTION_ARROWS.includes(diagram.connectionDefaults?.arrows)
            || !Number.isInteger(diagram.connectionDefaults?.cornerRadius)
            || diagram.connectionDefaults.cornerRadius < 0
            || diagram.connectionDefaults.cornerRadius > 32
            || typeof diagram.connectionDefaults.showRelationshipDates !== 'boolean')
        {
            warn(`Board ${board.id} has invalid connection defaults`);
        }

        const connectionIds =
            new Set();

        diagram.connections
            .forEach(connection =>
            {
                if (
                    !connection.id
              || connectionIds.has(connection.id)
                )
                {
                    warn(
                        `Board ${board.id} has an invalid connection ID`
                    );
                }
                connectionIds.add(connection.id);

                if (typeof connection.visible !== 'boolean')
                    warn(`Connection ${connection.id} has invalid visibility`);

                if (connection.style?.line && !isCanonicalGeneoPaint(connection.style.line))
                {
                    warn(`Connection ${connection.id} has an invalid line paint`);
                }
                if (
                    connection.style?.width !== undefined && (!Number.isInteger(connection.style.width)
              || connection.style.width < GENEO_STROKE_WIDTH_MIN
              || connection.style.width > GENEO_STROKE_WIDTH_MAX)
                )
                {
                    warn(`Connection ${connection.id} has an invalid stroke width`);
                }
                if (connection.style?.pattern !== undefined && !GENEO_CONNECTION_PATTERNS.includes(connection.style.pattern))
                {
                    warn(`Connection ${connection.id} has an invalid line pattern`);
                }
                if (connection.style?.arrows !== undefined && (connection.kind !== 'visual' || !GENEO_CONNECTION_ARROWS.includes(connection.style.arrows)))
                    warn(`Connection ${connection.id} has invalid arrowheads`);
                if (connection.style?.cornerRadius !== undefined
                    && (!Number.isInteger(connection.style.cornerRadius)
                        || connection.style.cornerRadius < 0 || connection.style.cornerRadius > 32))
                    warn(`Connection ${connection.id} has an invalid corner radius`);
                if (connection.showRelationshipDates !== undefined
                    && typeof connection.showRelationshipDates !== 'boolean')
                    warn(`Connection ${connection.id} has an invalid relationship-date setting`);

                [
                    connection.source,
                    connection.target
                ].forEach(reference =>
                {
                    if (
                        reference?.nodeId
                && !nodeIds.has(reference.nodeId)
                    )
                    {
                        warn(
                            `Connection ${connection.id} points to a missing node`
                        );
                    }
                    if (
                        reference?.familyId
                && !familyIds.has(reference.familyId)
                    )
                    {
                        warn(
                            `Connection ${connection.id} points to a missing family`
                        );
                    }
                });
            });
    });
}

function openGeneographBoardDetailsModal({
    boardId =
        null
} = {})
{
    const editing =
        Boolean(
            boardId
        );

    const board =
        editing
            ? getGeneographBoard(
                boardId
            )
            : null;

    if (
        editing
        && !board
    )
    {
        showToast(
            'Board not found.'
        );

        return;
    }

    const projectId =
        board?.projectId
        || requireActiveProjectId();
    if (!projectId) return;

    const inheritedCollection =
        !editing
        && state.geneoLibraryView
          === 'collection'
            ? activeGeneographCollection()
            : null;

    const selectedCollectionIds =
        new Set(
            editing
                ? (
                    board.collectionIds
                || []
                )
                : inheritedCollection
                    ? [
                        inheritedCollection.id
                    ]
                    : []
        );

    const modalTitle =
        editing
            ? 'Edit board'
            : 'New board';

    const modalDescription =
        editing
            ? 'Update the board name, description and collections.'
            : 'Create a visual workspace for research, evidence and visual exploration.';

    const submitLabel =
        editing
            ? 'Save changes'
            : 'Create board';

    openModal(`
        <div
          class="
            modal
            geneo-board-create-modal
          "
          role="dialog"
          aria-modal="true"
          aria-labelledby="geneographBoardDetailsTitle">

          <div
            class="
              modal-header
            ">

            <div>
              <h2
                id="geneographBoardDetailsTitle">

                ${escapeHtml(
                    modalTitle
                )}
              </h2>

              <p>
                ${escapeHtml(
                    modalDescription
                )}
              </p>
            </div>

            <button
              class="
                close-button
              "
              type="button"
              data-close
              aria-label="Close">

              ${icon.close}
            </button>
          </div>

          <form
            data-geneo-board-details-form>

            <div
              class="
                modal-body
                form-grid
              ">

              <div
                class="
                  field
                ">

                <label
                  for="geneoBoardDetailsName">

                  Board name
                </label>

                <input
                  id="geneoBoardDetailsName"
                  type="text"
                  required
                  maxlength="160"
                  autocomplete="off"
                  value="${escapeHtml(
                        board?.title
                    || ''
                    )}"
                  placeholder="e.g. Unknown father theory">
              </div>

              <div
                class="
                  field
                ">

                <label
                  for="geneoBoardDetailsDescription">

                  Description
                </label>

                <textarea
                  id="geneoBoardDetailsDescription"
                  rows="3"
                  maxlength="500"
                  placeholder="Research question or intended output">${escapeHtml(
                        board?.description
                    || ''
                    )}</textarea>
              </div>

              ${renderGeneographCollectionChooser({
                    projectId,
                    selectedCollectionIds
                })}
            </div>

            <div
              class="
                modal-footer
              ">

              <button
                class="
                  button
                  secondary
                "
                type="button"
                data-close>

                Cancel
              </button>

              <button
                class="
                  button
                  primary
                "
                type="submit">

                ${escapeHtml(
                    submitLabel
                )}
              </button>
            </div>
          </form>
        </div>
      `);

    const modal =
        modalBackdrop.querySelector(
            '.geneo-board-create-modal'
        );

    if (!modal)
    {
        return;
    }

    bindGeneographCollectionChooser(
        modal,
        {
            projectId,
            selectedCollectionIds
        }
    );

    const form =
        modal.querySelector(
            '[data-geneo-board-details-form]'
        );

    const nameInput =
        modal.querySelector(
            '#geneoBoardDetailsName'
        );

    const descriptionInput =
        modal.querySelector(
            '#geneoBoardDetailsDescription'
        );

    form
        ?.addEventListener(
            'submit',
            event =>
            {
                event.preventDefault();

                const title =
                    nameInput
                        ?.value
                        .trim()
              || '';

                if (!title)
                {
                    nameInput?.focus();

                    showToast(
                        'Enter a board name.'
                    );

                    return;
                }

                const description =
                    descriptionInput
                        ?.value
                        .trim()
              || '';

                if (editing)
                {
                    board.title =
                        title;

                    board.description =
                        description;

                    setBoardCollections(
                        board.id,
                        [
                            ...selectedCollectionIds
                        ],
                        {
                            projectId:
                    board.projectId,

                            touchModified:
                    false
                        }
                    );

                    touchGeneographBoard(
                        board
                    );

                    closeModal();

                    renderGeneographHome();

                    showToast(
                        'Board updated.'
                    );

                    return;
                }
                const now =
                    new Date().toISOString();

                const newBoard = {
                    id:
                createRuntimeId(
                    'board'
                ),

                    projectId,

                    title,

                    description,

                    collectionIds: [
                        ...selectedCollectionIds
                    ],

                    modified:
                'Just now',
                    modifiedAt: now,
                    createdAt: now,
                    favorite:
                false,
                    archived:
                false,
                    thumb:
                'theory',
                    diagram:
                createEmptyGeneographDiagram()
                };

                sampleData.boards.unshift(
                    newBoard
                );
                markPrototypeSessionEdited();

                state.selectedGeneoBoardId =
                    newBoard.id;

                const createdWithCollections =
                    selectedCollectionIds.size
                > 0;

                if (
                    state.geneoLibraryView
                === 'favorites'
              || state.geneoLibraryView
                === 'archived'
              || (
                  state.geneoLibraryView
                  === 'unassigned'
                && createdWithCollections
              )
                )
                {
                    state.geneoLibraryView =
                        'all';

                    state.geneoActiveCollectionId =
                        null;
                }

                closeModal();

                renderGeneographHome();

                showToast(
                    'Board created.'
                );
            }
        );

    requestAnimationFrame(
        () =>
        {
            nameInput?.focus();

            if (editing)
            {
                nameInput?.select();
            }
        }
    );
}

function openCreateGeneographBoardModal()
{
    openGeneographBoardDetailsModal();
}

function openEditGeneographBoardModal(
    boardId
)
{
    openGeneographBoardDetailsModal({
        boardId
    });
}

function openGeneographSettingsModal()
{
    cancelGeneographPencilStroke();
    const board =
        selectedGeneographBoard();

    if (!board)
    {
        return;
    }

    const selectedCollectionIds =
        new Set(
            board.collectionIds
          || []
        );

    openModal(`
        <div
          class="modal geneo-board-settings-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="boardSettingsTitle">

          <div class="modal-header">
            <div>
              <h2
                id="boardSettingsTitle">

                Board settings
              </h2>

            </div>

            <button
              class="
                close-button
              "
              type="button"
              data-close
              aria-label="Close">

              ${icon.close}
            </button>
          </div>

          <form
            id="geneographBoardSettingsForm">

            <div
              class="
                modal-body
                form-grid
              ">

              <div class="field">
                <label
                  for="geneographSettingsName">

                  Board name
                </label>

                <input
                  id="geneographSettingsName"
                  type="text"
                  required
                  maxlength="160"
                  value="${escapeHtml(
                        board.title
                    )}">
              </div>

              <div class="field">
                <label
                  for="geneographSettingsDescription">

                  Description
                </label>

                <textarea
                  id="geneographSettingsDescription"
                  maxlength="500"
                  rows="2">${escapeHtml(
                        board.description
                    || ''
                    )}</textarea>
              </div>

              ${renderGeneographCollectionChooser({
                    projectId:
                  board.projectId,

                    selectedCollectionIds
                })}
            </div>

            <div class="modal-footer">
              <button
                class="
                  button
                  secondary
                "
                type="button"
                data-close>

                Cancel
              </button>

              <button
                class="
                  button
                  primary
                "
                type="submit">

                Save settings
              </button>
            </div>
          </form>
        </div>
      `);

    const modal =
        modalBackdrop.querySelector(
            '.modal'
        );

    bindGeneographCollectionChooser(
        modal,
        {
            projectId:
            board.projectId,

            selectedCollectionIds
        }
    );

    modalBackdrop
        .querySelector(
            '#geneographBoardSettingsForm'
        )
        ?.addEventListener(
            'submit',
            event =>
            {
                event.preventDefault();

                const name =
                    modalBackdrop
                        .querySelector(
                            '#geneographSettingsName'
                        )
                        ?.value
                        .trim()
              || '';

                if (!name)
                {
                    modalBackdrop
                        .querySelector(
                            '#geneographSettingsName'
                        )
                        ?.focus();

                    return;
                }

                board.title =
                    name;

                board.description =
                    modalBackdrop
                        .querySelector(
                            '#geneographSettingsDescription'
                        )
                        ?.value
                        .trim()
              || '';

                setBoardCollections(
                    board.id,
                    [
                        ...selectedCollectionIds
                    ],
                    {
                        projectId:
                  board.projectId,

                        touchModified:
                  false
                    }
                );

                touchGeneographBoard(
                    board
                );

                closeModal();

                renderGeneographEditorPreserveScroll();

                showToast(
                    'Board settings updated.'
                );
            }
        );
}

const GENEO_NODE_TYPES = new Set(['person', 'image', 'sticky', 'text', 'panel', 'shape', 'place', 'drawing']);
const GENEO_SHAPE_KINDS = Object.freeze([
    { id: 'rectangle', label: 'Rectangle' },
    { id: 'ellipse', label: 'Ellipse' },
    { id: 'diamond', label: 'Diamond' },
    { id: 'triangle', label: 'Triangle' },
    { id: 'hexagon', label: 'Hexagon' }
]);
const GENEO_STROKE_WIDTH_MIN = 1;
const GENEO_STROKE_WIDTH_MAX = 12;
const GENEO_CONNECTION_PATTERNS = ['solid', 'dashed', 'dotted', 'alternating'];
const GENEO_CONNECTION_ARROWS = ['none', 'start', 'end', 'both'];
const GENEO_CONNECTION_PATTERN_LABELS = { solid: 'Solid', dashed: 'Dashed', dotted: 'Dotted', alternating: 'Short-long dashes' };
let geneoConnectionToolRuntime = { boardId: '', overrides: {}, panelOpen: false };
let geneoCreationToolRuntime = { boardId: '', drawing: null, shape: null };

function geneoCreationToolSettings(tool)
{
    const boardId = selectedGeneographBoard()?.id || '';
    if (geneoCreationToolRuntime.boardId !== boardId)
        geneoCreationToolRuntime = { boardId, drawing: null, shape: null };
    if (!geneoCreationToolRuntime[tool])
        geneoCreationToolRuntime[tool] = {
            appearance: structuredClone(geneoNodeDefaults(tool).appearance),
            panelOpen: false,
            ...(tool === 'shape' ? { shapeKind: 'rectangle' } : {})
        };
    return geneoCreationToolRuntime[tool];
}

function geneoDefaultConnectionStyle()
{
    return { line: { color: geneoThemeColor('#D9E5E1', geneoSemanticColor('--tree-connection')), opacity: 100, enabled: true }, lineOverride: false, width: 4, pattern: 'solid', arrows: 'none', cornerRadius: 0, showRelationshipDates: false };
}

function geneoNormalizeConnectionDefaults(value)
{
    const fallback = geneoDefaultConnectionStyle();
    return {
        line: geneoPaintFromLegacy(value?.line, value?.color, fallback.line),
        lineOverride: value?.lineOverride === true,
        width: Math.round(geneoNumber(value?.width, fallback.width, GENEO_STROKE_WIDTH_MIN, GENEO_STROKE_WIDTH_MAX)),
        pattern: GENEO_CONNECTION_PATTERNS.includes(value?.pattern) ? value.pattern : fallback.pattern,
        arrows: GENEO_CONNECTION_ARROWS.includes(value?.arrows) ? value.arrows : fallback.arrows,
        cornerRadius: Math.round(geneoNumber(value?.cornerRadius, fallback.cornerRadius, 0, 32)),
        showRelationshipDates: typeof value?.showRelationshipDates === 'boolean'
            ? value.showRelationshipDates : fallback.showRelationshipDates
    };
}

function geneoNormalizeConnectionOverrides(value, kind = 'visual')
{
    const result = {};
    if (value?.line) result.line = geneoPaintFromLegacy(value.line, value.line?.color, geneoDefaultConnectionStyle().line);
    if (Number.isInteger(value?.width) && value.width >= GENEO_STROKE_WIDTH_MIN && value.width <= GENEO_STROKE_WIDTH_MAX) result.width = value.width;
    if (GENEO_CONNECTION_PATTERNS.includes(value?.pattern)) result.pattern = value.pattern;
    if (kind === 'visual' && GENEO_CONNECTION_ARROWS.includes(value?.arrows)) result.arrows = value.arrows;
    if (Number.isInteger(value?.cornerRadius) && value.cornerRadius >= 0 && value.cornerRadius <= 32)
        result.cornerRadius = value.cornerRadius;
    return result;
}

function geneoEffectiveConnectionStyle(connection, diagram = selectedGeneographDiagram())
{
    const defaults = diagram?.connectionDefaults || geneoDefaultConnectionStyle();
    const overrides = connection?.style || {};
    return { ...defaults, ...overrides, arrows: connection?.kind === 'visual' ? overrides.arrows ?? defaults.arrows : 'none' };
}

function geneoConnectionToolStyle()
{
    const boardId = selectedGeneographBoard()?.id || '';
    if (geneoConnectionToolRuntime.boardId !== boardId) geneoConnectionToolRuntime = { boardId, overrides: {}, panelOpen: false };
    return { ...(selectedGeneographDiagram()?.connectionDefaults || geneoDefaultConnectionStyle()), ...geneoConnectionToolRuntime.overrides };
}

function geneoConnectionDashArray(pattern, width)
{
    if (pattern === 'dotted') return `${width} ${width * 3}`;
    if (pattern === 'alternating') return `${width * 2} ${width * 2} ${width * 6} ${width * 2}`;
    if (pattern === 'dashed') return `${width * 4} ${width * 3}`;
    return '';
}
const GENEO_GRID_SIZE = 20;
const GENEO_TOP_ROUTE_CLEARANCE = GENEO_GRID_SIZE * 4;
const GENEO_HISTORY_LIMIT = 50;
const GENEO_LAYER_NAME_LIMIT = 80;
let geneoPointerState = null;

let geneoHistoryRuntime = {
    boardId: '',
    undo: [],
    redo: []
};
let geneoObjectClipboard = null;

let geneoToolbarResizeObserver = null;

let geneoCanvasRuntime =
    createGeneoCanvasRuntime();
let geneoPaintRuntime = createGeneoPaintRuntime();
let geneoKeyboardBound = false;
let geneoShiftPressed = false;
let geneoCtrlSelectPressed = false;
let geneoCtrlSelectContext = null;
let geneoDrawPanPending = false;
let geneoPointerBound = false;
let geneoImageUploadRequestId = 0;
let geneoImageCropRuntime = null;
let geneoImageLastClick = null;

function geneoNormalizeImageCrop(value)
{
    if (!value || typeof value !== 'object') return null;
    return {
        zoom: geneoNumber(value.zoom, 1, 1, 4),
        x: geneoNumber(value.x, 0, -1, 1),
        y: geneoNumber(value.y, 0, -1, 1)
    };
}

function geneoImageCropMetrics(node, source, crop)
{
    const ratio = source.width / source.height;
    const width = Math.max(node.width, node.height * ratio);
    const height = width / ratio;
    const zoom = crop?.zoom || 1;
    const maxX = Math.max(0, (width * zoom - node.width) / (2 * node.width));
    const maxY = Math.max(0, (height * zoom - node.height) / (2 * node.height));
    return { width, height, maxX, maxY, zoom,
        x: Math.max(-maxX, Math.min(maxX, crop?.x || 0)),
        y: Math.max(-maxY, Math.min(maxY, crop?.y || 0)) };
}

function geneoImageCropStyle(node, source, crop)
{
    const metrics = geneoImageCropMetrics(node, source, crop);
    return `--geneo-crop-width:${metrics.width}px;--geneo-crop-height:${metrics.height}px;--geneo-crop-scaled-width:${metrics.width * metrics.zoom}px;--geneo-crop-scaled-height:${metrics.height * metrics.zoom}px;--geneo-crop-x:${metrics.x * node.width}px;--geneo-crop-y:${metrics.y * node.height}px;--geneo-crop-zoom:${metrics.zoom}`;
}

function geneoRefreshImageCropDom()
{
    const runtime = geneoImageCropRuntime;
    const node = runtime && getGeneographNode(runtime.nodeId);
    if (!node) return;
    const source = resolveGeneographImageSource(node);
    const metrics = geneoImageCropMetrics(node, source, runtime.draft);
    runtime.draft.x = metrics.x;
    runtime.draft.y = metrics.y;
    const style = geneoImageCropStyle(node, source, runtime.draft);
    const element = main.querySelector(`[data-geneo-node="${CSS.escape(node.id)}"]`);
    element?.querySelectorAll('.geneo-image-node-media, .geneo-image-crop-preview, .geneo-image-crop-bounds')
        .forEach(item => item.style.cssText = style);
    geneoPositionImageCropToolbar();
}

function geneoScaleImageCropFromHandle(handle, zoom)
{
    const runtime = geneoImageCropRuntime;
    const node = runtime && getGeneographNode(runtime.nodeId);
    if (!node) return;
    const source = resolveGeneographImageSource(node);
    const metrics = geneoImageCropMetrics(node, source, runtime.draft);
    const nextZoom = geneoNumber(zoom, metrics.zoom, 1, 4);
    const delta = nextZoom - metrics.zoom;
    runtime.draft.zoom = nextZoom;
    runtime.draft.x = metrics.x + (handle.includes('e') ? 1 : handle.includes('w') ? -1 : 0)
        * metrics.width * delta / (2 * node.width);
    runtime.draft.y = metrics.y + (handle.includes('s') ? 1 : handle.includes('n') ? -1 : 0)
        * metrics.height * delta / (2 * node.height);
    geneoRefreshImageCropDom();
}

function geneoFinishImageCrop(apply, { render = true, restoreFocus = true } = {})
{
    const runtime = geneoImageCropRuntime;
    if (!runtime) return;
    const node = getGeneographNode(runtime.nodeId);
    if (apply && node)
    {
        const crop = geneoNormalizeImageCrop(runtime.draft);
        if (JSON.stringify(node.imageCrop || null) !== JSON.stringify(crop))
        {
            geneoPushHistory();
            node.imageCrop = crop;
            touchGeneographBoard();
        }
    }
    geneoImageCropRuntime = null;
    if (render) renderGeneographEditorPreserveScroll({ preserveInspectorScroll: true, preserveSidebarScroll: true });
    if (restoreFocus) requestAnimationFrame(() => main.querySelector(`[data-geneo-node="${CSS.escape(runtime.nodeId)}"]`)?.focus({ preventScroll: true }));
}

function geneoBeginImageCrop(node)
{
    const source = resolveGeneographImageSource(node);
    if (!source.available || !source.photo?.src || !(source.width > 0 && source.height > 0)) return;
    selectGeneographNode(node.id);
    geneoImageCropRuntime = {
        boardId: selectedGeneographBoard().id,
        nodeId: node.id,
        draft: geneoNormalizeImageCrop(node.imageCrop) || { zoom: 1, x: 0, y: 0 },
        initial: geneoNormalizeImageCrop(node.imageCrop) || { zoom: 1, x: 0, y: 0 },
        drag: null
    };
    renderGeneographEditorPreserveScroll({ preserveInspectorScroll: true, preserveSidebarScroll: true });
    requestAnimationFrame(() => main.querySelector('[data-geneo-image-crop-handle="se"]')?.focus({ preventScroll: true }));
}

function geneoPositionImageCropToolbar()
{
    const toolbar = main.querySelector('[data-geneo-image-crop-toolbar]');
    const bounds = main.querySelector('.geneo-image-crop-bounds');
    const viewport = main.querySelector('[data-geneo-canvas-viewport]');
    const node = toolbar?.closest('[data-geneo-node]');
    if (!toolbar || !bounds || !viewport || !node) return;
    const view = viewport.getBoundingClientRect();
    const photo = bounds.getBoundingClientRect();
    const frame = node.getBoundingClientRect();
    const zoom = Math.max(.25, state.geneoZoom / 100);
    const width = toolbar.offsetWidth * zoom;
    const height = toolbar.offsetHeight * zoom;
    const centerX = Math.max(view.left + 8 + width / 2,
        Math.min(view.right - 8 - width / 2, photo.left + photo.width / 2));
    const below = photo.bottom + 8;
    const above = photo.top - height - 8;
    const top = below + height <= view.bottom - 8 ? below
        : above >= view.top + 8 ? above
            : Math.max(view.top + 8, Math.min(view.bottom - height - 8, below));
    toolbar.style.left = `${(centerX - frame.left) / zoom}px`;
    toolbar.style.top = `${(top - frame.top) / zoom}px`;
    toolbar.style.bottom = 'auto';
    toolbar.style.marginLeft = '0';
}

function geneoNumber(value, fallback, min = -Infinity, max = Infinity)
{
    const number = Number(value);
    return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
}

function geneoEffectiveCanvasTool()
{
    return geneoCtrlSelectPressed && state.activeModule === 'Geneograph'
        && state.geneoView === 'board' && !modalBackdrop.classList.contains('open')
        && geneoCtrlSelectContext?.tool === state.geneoTool
        && geneoCtrlSelectContext?.boardId === selectedGeneographBoard()?.id
        ? 'select' : state.geneoTool;
}

function setGeneoCtrlSelectPressed(pressed)
{
    if (geneoCtrlSelectPressed === pressed) return;
    geneoCtrlSelectPressed = pressed;
    geneoCtrlSelectContext = pressed
        ? { tool: state.geneoTool, boardId: selectedGeneographBoard()?.id } : null;
    main.querySelector('.geneo-canvas-stage')?.classList.toggle('temporary-select-tool', pressed);
    if (pressed) setGeneographConnectionHoverTarget(null);
}
function normalizeGeneographLayerName(value)
{
    return String(value ?? '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, GENEO_LAYER_NAME_LIMIT);
}

function snapGeneographCoordinate(value)
{
    const number = geneoNumber(value, 0, -GENEO_WORLD_LIMIT, GENEO_WORLD_LIMIT);
    return selectedGeneographDiagram()?.canvas.snapToGrid
        ? Math.round(number / GENEO_GRID_SIZE) * GENEO_GRID_SIZE
        : number;
}

function snapGeneographPoint(point)
{
    if (!point) return null;
    return {
        x: snapGeneographCoordinate(point.x),
        y: snapGeneographCoordinate(point.y)
    };
}

const GENEO_BOARD_COLORS = [
    { color: '#101817', name: 'Ink' },
    { color: '#26312E', name: 'Graphite' },
    { color: '#D9E5E1', name: 'Mist' },
    { color: '#F3F1E9', name: 'Paper' },
    { color: '#173029', name: 'Deep moss' },
    { color: '#172A32', name: 'Archive blue' },
    { color: '#2D2437', name: 'Plum' },
    { color: '#302B1D', name: 'Sepia' },
    { color: '#2FAE74', name: 'Geneograph green' },
    { color: '#62D99A', name: 'Mint' },
    { color: '#4FB3A5', name: 'Teal' },
    { color: '#5DADEC', name: 'Blue' },
    { color: '#AA8CE8', name: 'Violet' },
    { color: '#D4AA6B', name: 'Amber' },
    { color: '#D9828B', name: 'Rose' },
    { color: '#C75B5B', name: 'Conflict red' }
];

function normalizeGeneoHexColor(value, fallback = '#101817')
{
    const text = String(value || '').trim();
    const short = text.match(/^#?([0-9a-f]{3})$/i);
    const full = text.match(/^#?([0-9a-f]{6})$/i);
    if (short)
    {
        return `#${short[1].split('').map(character => `${character}${character}`).join('')}`.toUpperCase();
    }
    if (full) return `#${full[1]}`.toUpperCase();
    const safeFallback = String(fallback || '#101817').match(/^#?([0-9a-f]{6})$/i);
    return safeFallback ? `#${safeFallback[1]}`.toUpperCase() : '#101817';
}

function normalizeGeneoPaint(value, fallback = {}, {
    forceEnabled = false,
    forceOpacity = null
} = {})
{
    const source = value && typeof value === 'object' ? value : {};
    const defaultPaint = fallback && typeof fallback === 'object' ? fallback : {};
    return {
        color: normalizeGeneoHexColor(source.color, defaultPaint.color || '#101817'),
        opacity: forceOpacity === null
            ? Math.round(geneoNumber(source.opacity, defaultPaint.opacity ?? 100, 0, 100))
            : Math.round(geneoNumber(forceOpacity, 100, 0, 100)),
        enabled: forceEnabled ? true : source.enabled !== false
    };
}

function geneoPaintFromLegacy(sourcePaint, legacyColor, fallback, options = {})
{
    if (sourcePaint && typeof sourcePaint === 'object')
    {
        return normalizeGeneoPaint(sourcePaint, fallback, options);
    }
    return normalizeGeneoPaint({
        color: legacyColor,
        opacity: options.legacyOpacity ?? fallback.opacity,
        enabled: options.legacyEnabled ?? fallback.enabled
    }, fallback, options);
}

function geneoHexToRgb(color)
{
    const normalized = normalizeGeneoHexColor(color);
    return {
        r: Number.parseInt(normalized.slice(1, 3), 16),
        g: Number.parseInt(normalized.slice(3, 5), 16),
        b: Number.parseInt(normalized.slice(5, 7), 16)
    };
}

function geneoPaintCssColor(paint, { disabledColor = 'transparent' } = {})
{
    if (!paint?.enabled) return disabledColor;
    const { r, g, b } = geneoHexToRgb(paint.color);
    return `rgba(${r}, ${g}, ${b}, ${geneoNumber(paint.opacity, 100, 0, 100) / 100})`;
}

function geneoPersonActionGapColor(paint)
{
    return paint?.enabled && geneoNumber(paint.opacity, 100, 0, 100) === 100
        ? geneoPaintCssColor(paint)
        : 'transparent';
}

function isCanonicalGeneoPaint(paint, { mustBeEnabled = false, fixedOpacity = null } = {})
{
    return Boolean(
        paint
        && typeof paint === 'object'
        && /^#[0-9A-F]{6}$/.test(paint.color)
        && Number.isInteger(paint.opacity)
        && paint.opacity >= 0
        && paint.opacity <= 100
        && typeof paint.enabled === 'boolean'
        && (!mustBeEnabled || paint.enabled)
        && (fixedOpacity === null || paint.opacity === fixedOpacity)
    );
}

function geneoAppearance(value, defaults = {}, nodeType = '')
{
    const source = value && typeof value === 'object' ? value : {};
    const legacyStrokeType = ['dashed', 'solid', 'none'].includes(source.strokeType)
        ? source.strokeType
        : null;
    const defaultPattern = defaults.strokePattern === 'dashed' ? 'dashed' : 'solid';
    const result = { ...defaults, ...source };
    result.shadowEnabled = geneoShadowOverride(source.shadowEnabled);
    if (nodeType === 'image') delete result.fill;
    else result.fill = geneoPaintFromLegacy(
        source.fill,
        source.backgroundColor,
        defaults.fill,
        { legacyOpacity: nodeType === 'panel' ? 68 : 100 }
    );
    if (nodeType === 'image')
    {
        result.imageOpacity = Math.round(geneoNumber(source.imageOpacity, 100, 0, 100));
    }
    result.stroke = geneoPaintFromLegacy(
        source.stroke,
        source.strokeColor,
        defaults.stroke,
        { legacyEnabled: legacyStrokeType !== 'none' }
    );
    result.text = geneoPaintFromLegacy(
        source.text,
        source.textColor,
        defaults.text,
        { forceEnabled: true }
    );
    if (nodeType === 'person')
    {
        const sourceOverrides =
            source.paintOverrides
          && typeof source.paintOverrides
            === 'object'
                ? source.paintOverrides
                : {};

        result.paintOverrides = {
            fill:
            sourceOverrides.fill
            === true,

            stroke:
            sourceOverrides.stroke
            === true,

            text:
            sourceOverrides.text
            === true
        };
        result.styleOverrides = {
            strokeWidth: source.styleOverrides?.strokeWidth === true
                || (!source.styleOverrides && source.strokeWidth != null && source.strokeWidth !== 2),
            strokePattern: source.styleOverrides?.strokePattern === true
                || (!source.styleOverrides && source.strokePattern === 'dashed')
        };
    }
    else
    {
        result.paintOverrides = {
            fill: source.paintOverrides?.fill === true,
            stroke: source.paintOverrides?.stroke === true,
            text: source.paintOverrides?.text === true
        };
    }
    result.strokePattern = legacyStrokeType && legacyStrokeType !== 'none'
        ? legacyStrokeType
        : ['solid', 'dashed'].includes(source.strokePattern)
            ? source.strokePattern
            : defaultPattern;
    result.strokeWidth = Math.round(geneoNumber(
        source.strokeWidth,
        defaults.strokeWidth || GENEO_STROKE_WIDTH_MIN,
        GENEO_STROKE_WIDTH_MIN,
        GENEO_STROKE_WIDTH_MAX
    ));
    if (Number.isFinite(Number(defaults.cornerRadius)))
    {
        result.cornerRadius = Math.round(geneoNumber(
            source.cornerRadius,
            defaults.cornerRadius,
            0,
            32
        ));
    }
    else
    {
        delete result.cornerRadius;
    }
    if (['text', 'sticky', 'place'].includes(nodeType))
    {
        result.fontSize = Math.round(geneoNumber(source.fontSize, defaults.fontSize, 8, 72));
    }
    else
    {
        delete result.fontSize;
    }
    delete result.backgroundColor;
    delete result.strokeColor;
    delete result.textColor;
    delete result.strokeType;
    return result;
}

function geneoFilenameStem(filename)
{
    return String(filename || '')
        .trim()
        .replace(/\.[^.]+$/, '')
        || 'Image';
}

function geneoImageRecordName(record)
{
    return String(
        record?.title
        || record?.displayName
        || record?.filename
        || ''
    ).trim() || 'Image';
}

function normalizeGeneographImageRef(node)
{
    const source = node?.imageRef;

    if (
        source
        && ['project', 'board'].includes(source.scope)
        && String(source.id || '').trim()
    )
    {
        return {
            scope: source.scope,
            id: String(source.id).trim()
        };
    }

    // One-time migration for the previous Geneograph image model.
    if (String(node?.photoId || '').trim())
    {
        return {
            scope: 'project',
            id: String(node.photoId).trim()
        };
    }

    return null;
}

function normalizeGeneographShapeKind(value)
{
    const kind = String(value || '').trim().toLowerCase();
    if (kind === 'rounded-rectangle') return 'rectangle';
    return GENEO_SHAPE_KINDS.some(shape => shape.id === kind)
        ? kind
        : 'rectangle';
}

function geneoShapeLabel(value)
{
    const kind = normalizeGeneographShapeKind(value);
    return GENEO_SHAPE_KINDS.find(shape => shape.id === kind)?.label || 'Rectangle';
}

function normalizeGeneographDrawingPoints(value)
{
    const points = [];
    (Array.isArray(value) ? value : []).forEach(point =>
    {
        const x = Number(point?.x);
        const y = Number(point?.y);
        if (!Number.isFinite(x) || !Number.isFinite(y)) return;
        const next = {
            x: geneoNumber(x, 0, 0, 1),
            y: geneoNumber(y, 0, 0, 1)
        };
        const previous = points.at(-1);
        if (previous && Math.hypot(next.x - previous.x, next.y - previous.y) < 0.0001) return;
        points.push(next);
    });
    return points;
}

function normalizeGeneographPlaceRef(node, projectId = selectedGeneographBoard()?.projectId || '')
{
    const source = node?.placeRef;
    if (source?.scope === 'project')
    {
        const id = String(source.id || '').trim();
        const place = id ? getPlace(id) : null;
        if (place && !place.deleted && place.projectId === projectId)
        {
            return {
                scope: 'project',
                id,
                fallbackName: String(placePrimaryName(place) || place.name || source.fallbackName || 'Place').trim().slice(0, 160)
            };
        }
        const fallbackName = String(source.fallbackName || node?.placeName || '').trim().slice(0, 160);
        return fallbackName ? { scope: 'board', name: fallbackName } : null;
    }
    if (source?.scope === 'board')
    {
        const name = String(source.name || '').replace(/\s+/g, ' ').trim().slice(0, 160);
        return name ? { scope: 'board', name } : null;
    }
    const legacyPlaceId = String(node?.placeId || '').trim();
    const legacyPlace = legacyPlaceId ? getPlace(legacyPlaceId) : null;
    if (legacyPlace && !legacyPlace.deleted && legacyPlace.projectId === projectId)
    {
        return {
            scope: 'project',
            id: legacyPlace.id,
            fallbackName: String(placePrimaryName(legacyPlace) || legacyPlace.name || 'Place').trim().slice(0, 160)
        };
    }
    const legacyName = String(node?.placeName || node?.title || '').replace(/\s+/g, ' ').trim().slice(0, 160);
    return legacyName ? { scope: 'board', name: legacyName } : null;
}

function resolveGeneographPlace(node, board = selectedGeneographBoard())
{
    const ref = normalizeGeneographPlaceRef(node, board?.projectId || '');
    if (!ref) return { ref: null, place: null, linked: false, name: 'Place' };
    if (ref.scope === 'project')
    {
        const place = getPlace(ref.id);
        if (place && !place.deleted && place.projectId === board?.projectId)
        {
            return {
                ref,
                place,
                linked: true,
                name: placePrimaryName(place) || place.name || ref.fallbackName || 'Place'
            };
        }
    }
    return {
        ref,
        place: null,
        linked: false,
        name: ref.name || ref.fallbackName || 'Place'
    };
}

function normalizeGeneographBoardAsset(asset)
{
    if (!asset || typeof asset !== 'object') return null;

    const id = String(asset.id || '').trim();
    const src = String(asset.src || '').trim();
    const mimeType = String(asset.mimeType || '').trim();

    if (
        !id
        || !src
        || !PHOTO_UPLOAD_ALLOWED_TYPES.includes(mimeType)
    )
    {
        return null;
    }

    const filename = String(
        asset.filename || 'Uploaded image'
    ).trim() || 'Uploaded image';

    const now = new Date().toISOString();

    return {
        id,
        kind: 'photo',
        filename,
        displayName:
          String(asset.displayName || '').trim()
          || geneoFilenameStem(filename),
        src,
        mimeType,
        width: geneoNumber(asset.width, 0, 1),
        height: geneoNumber(asset.height, 0, 1),
        sizeBytes: geneoNumber(asset.sizeBytes, 0, 0),
        createdAt:
          Number.isFinite(Date.parse(asset.createdAt))
              ? asset.createdAt
              : now,
        updatedAt:
          Number.isFinite(Date.parse(asset.updatedAt))
              ? asset.updatedAt
              : now
    };
}

function getGeneographBoardAsset(
    assetId,
    diagram = selectedGeneographDiagram()
)
{
    return (
        diagram?.assets || []
    ).find(asset => asset.id === assetId) || null;
}

function resolveGeneographImageSource(
    node,
    {
        board = selectedGeneographBoard(),
        diagram = board?.diagram
    } = {}
)
{
    const ref = normalizeGeneographImageRef(node);

    if (!ref)
    {
        return {
            ref: null,
            available: false,
            photo: null,
            displayName: 'Image',
            filename: '',
            sourceLabel: 'No source'
        };
    }

    if (ref.scope === 'project')
    {
        const photo = getPhoto(ref.id, {
            projectId: board?.projectId || ''
        });

        if (!photo || photo.deletedAt)
        {
            return {
                ref,
                available: false,
                photo: null,
                displayName: 'Image',
                filename: '',
                sourceLabel: 'Project photo'
            };
        }

        return {
            ref,
            available: true,
            photo,
            displayName: geneoImageRecordName(photo),
            filename: String(photo.filename || photo.title || '').trim(),
            sourceLabel: 'Project photo',
            width: Number(photo.width) || 0,
            height: Number(photo.height) || 0,
            sizeBytes: Number(photo.sizeBytes) || 0
        };
    }

    const asset = getGeneographBoardAsset(ref.id, diagram);

    if (!asset)
    {
        return {
            ref,
            available: false,
            photo: null,
            displayName: 'Image',
            filename: '',
            sourceLabel: 'Board upload'
        };
    }

    return {
        ref,
        available: true,
        photo: asset,
        displayName: geneoImageRecordName(asset),
        filename: String(asset.filename || '').trim(),
        sourceLabel: 'Board upload',
        width: Number(asset.width) || 0,
        height: Number(asset.height) || 0,
        sizeBytes: Number(asset.sizeBytes) || 0
    };
}

function geneoImageSourceName(node)
{
    const source = resolveGeneographImageSource(node);
    return source.available ? source.displayName : 'Image';
}

function pruneGeneographBoardAssets(
    diagram = selectedGeneographDiagram()
)
{
    if (!diagram) return false;

    const referencedIds = new Set(
        diagram.nodes
            .filter(node =>
                node.type === 'image'
            && node.imageRef?.scope === 'board'
            && node.imageRef.id
            )
            .map(node => node.imageRef.id)
    );
    diagram.people?.forEach(person =>
    {
        if (person.photoAssetId) referencedIds.add(person.photoAssetId);
    });

    const assets = Array.isArray(diagram.assets)
        ? diagram.assets
        : [];

    const nextAssets = assets.filter(asset =>
        referencedIds.has(asset.id)
    );

    if (nextAssets.length === assets.length) return false;

    diagram.assets = nextAssets;
    return true;
}

function uniqueGeneographBoardAssetId(
    diagram = selectedGeneographDiagram()
)
{
    let id;

    do
    {
        id = createRuntimeId('geneo-asset');
    } while (
        diagram?.assets?.some(asset => asset.id === id)
    );

    return id;
}

function createGeneographBoardAsset(
    draft,
    diagram = selectedGeneographDiagram()
)
{
    if (!diagram || !photoUploadDraftIsValid(draft)) return null;

    diagram.assets = Array.isArray(diagram.assets)
        ? diagram.assets
        : [];

    const now = new Date().toISOString();
    const filename = String(
        draft.filename || 'Uploaded image'
    ).trim() || 'Uploaded image';

    const asset = {
        id: uniqueGeneographBoardAssetId(diagram),
        kind: 'photo',
        filename,
        displayName: geneoFilenameStem(filename),
        src: draft.src,
        mimeType: draft.mimeType,
        width: draft.width,
        height: draft.height,
        sizeBytes: draft.sizeBytes,
        createdAt: now,
        updatedAt: now
    };

    diagram.assets.push(asset);
    return asset;
}

function geneoImageNodeSize(source)
{
    const defaults = geneoNodeDefaults('image');
    const sourceWidth = Number(source?.width);
    const sourceHeight = Number(source?.height);

    if (
        !Number.isFinite(sourceWidth)
        || !Number.isFinite(sourceHeight)
        || sourceWidth <= 0
        || sourceHeight <= 0
    )
    {
        return {
            width: defaults.width,
            height: defaults.height
        };
    }

    // Exact for normal photo ratios; extreme panoramas remain manageable
    // and are shown uncropped through object-fit: contain.
    const ratio = Math.min(
        2.4,
        Math.max(.45, sourceWidth / sourceHeight)
    );

    let width = defaults.width;
    let height = width / ratio;

    if (height < defaults.minHeight)
    {
        height = defaults.minHeight;
        width = height * ratio;
    }

    if (height > 360)
    {
        height = 360;
        width = height * ratio;
    }

    return {
        width: Math.round(Math.max(defaults.minWidth, width)),
        height: Math.round(Math.max(defaults.minHeight, height))
    };
}

function normalizeGeneographRuntimeData()
{
    state.geneoShapeKind = normalizeGeneographShapeKind(state.geneoShapeKind);
    const projects = new Set((sampleData.projects || []).map(project => project.id));
    const projectPeople = new Map();
    (sampleData.people || []).forEach(person =>
    {
        if (!projectPeople.has(person.projectId)) projectPeople.set(person.projectId, new Set());
        projectPeople.get(person.projectId).add(person.id);
    });
    sampleData.boardCollections = (sampleData.boardCollections || []).filter(Boolean).map(collection => ({
        id: String(collection.id || '').trim(),
        projectId: String(collection.projectId || ''),
        name: String(collection.name || 'Untitled collection').trim(),
        description: String(collection.description || '').trim()
    })).filter(collection => collection.id && projects.has(collection.projectId));
    sampleData.boards = (sampleData.boards || []).filter(Boolean).map(board =>
        normalizeGeneographBoardRecord(board, projectPeople));
    sampleData.boards.forEach(board => geneoApplyThemeDefaultsToDiagram(board.diagram));
    const boardIds = new Set(sampleData.boards.map(board => board.id));
    Object.keys(state.geneoBoardViewports || {}).forEach(boardId =>
    {
        if (!boardIds.has(boardId)) clearGeneographViewport(boardId);
    });
}

function normalizeGeneographBoardRecord(board, projectPeople)
{
        board.id = String(board.id || createRuntimeId('board'));
        board.projectId = String(board.projectId || '');
        board.title = String(board.title || 'Untitled board').trim() || 'Untitled board';
        board.description = String(board.description || '').trim();
        board.collectionIds = normalizeGeneographIdArray(board.collectionIds);
        board.favorite = Boolean(board.favorite);
        board.archived = Boolean(board.archived);
        board.modifiedAt = Number.isFinite(Date.parse(board.modifiedAt)) ? board.modifiedAt : new Date().toISOString();
        board.modified = String(board.modified || formatProjectModified?.(board) || 'Just now');
        const source = board.diagram && typeof board.diagram === 'object' ? board.diagram : createEmptyGeneographDiagram();
        const canvas = source.canvas && typeof source.canvas === 'object' ? source.canvas : {};
        const backgroundPattern = ['dots', 'grid', 'clear'].includes(canvas.backgroundPattern)
            ? canvas.backgroundPattern
            : canvas.gridVisible === false ? 'clear' : 'dots';
        const diagram = {
            themeProvenanceVersion: source.themeProvenanceVersion === 1 ? 1 : 0,
            canvas: {
                backgroundPaint: geneoPaintFromLegacy(
                    canvas.backgroundPaint,
                    canvas.backgroundColor,
                    { color: geneoDefaultCanvasColor(), opacity: 100, enabled: true },
                    { forceEnabled: true, forceOpacity: 100 }
                ),
                backgroundOverride: canvas.backgroundOverride === true,
                backgroundPattern,
                snapToGrid: Boolean(canvas.snapToGrid),
                alwaysShowSockets: Boolean(canvas.alwaysShowSockets),
                shadowEnabled: canvas.shadowEnabled !== false,
                colorPersonCardsByGender:
              Boolean(canvas.colorPersonCardsByGender)
            },
            personCardDefaults:
            normalizeGeneographPersonCardSettings(
                source.personCardDefaults
            ),
            cardAppearanceDefaults: normalizeGeneoCardAppearances(
                source.cardAppearanceDefaults,
                source.personCardDefaults?.cornerRadius ?? 8
            ),
            connectionDefaults: geneoNormalizeConnectionDefaults(source.connectionDefaults),
            assets: [],
            people: [],
            families: [],
            nodes: [],
            connections: []
        };
        const assetIds = new Set();

        (Array.isArray(source.assets) ? source.assets : [])
            .forEach(sourceAsset =>
            {
                const asset = normalizeGeneographBoardAsset(sourceAsset);

                if (!asset || assetIds.has(asset.id)) return;

                assetIds.add(asset.id);
                diagram.assets.push(asset);
            });
        const personIds = new Set();
        (Array.isArray(source.people) ? source.people : []).forEach(person =>
        {
            if (!person || !person.id || personIds.has(person.id)) return;
            personIds.add(person.id);
            const treePersonId = person.treePersonId ? String(person.treePersonId) : null;
            const names = normalizeGeneographPersonNames(person);
            const legacyDeath = formatGenealogyDateLabel(person.death);
            const livingStatus = ['Living', 'Deceased', 'Unknown'].includes(person.livingStatus)
                ? person.livingStatus
                : legacyDeath ? 'Deceased' : 'Living';
            diagram.people.push({
                id: String(person.id), treePersonId,
                syncState: ['local', 'linked', 'modified'].includes(person.syncState) ? person.syncState : (treePersonId ? 'linked' : 'local'),
                names,
                gender: ['male', 'female', 'unknown'].includes(String(person.gender || person.sex || '').toLowerCase())
                    ? String(person.gender || person.sex).toLowerCase()
                    : 'unknown',
                livingStatus,
                birth: normalizeGeneographPersonVital(person.birth, board.projectId),
                death: normalizeGeneographPersonVital(person.death, board.projectId),
                photoId: person.photoId || null,
                photoAssetId: assetIds.has(person.photoAssetId) ? person.photoAssetId : null,
                photoCrop:
              person.photoCrop
                  ? normalizePersonPhotoCrop(
                      person.photoCrop
                  )
                  : null,
                photoRegion: normalizeFaceRegion(person.photoRegion, FACE_REGION_MIN)
            });
        });
        const nodeIds = new Set();

        (Array.isArray(source.nodes) ? source.nodes : [])
            .forEach((node, index) =>
            {
                if (
                    !node
              || !node.id
              || nodeIds.has(node.id)
              || !GENEO_NODE_TYPES.has(node.type)
                )
                {
                    return;
                }

                if (
                    node.type === 'person'
              && !personIds.has(node.personId)
                )
                {
                    return;
                }

                nodeIds.add(node.id);

                const defaults = geneoNodeDefaults(node.type);
                const legacyRoundedShape = node.type === 'shape'
              && String(node.shapeKind || '').trim().toLowerCase() === 'rounded-rectangle';
                const appearanceDefaults = legacyRoundedShape
                    ? { ...defaults.appearance, cornerRadius: 12 }
                    : defaults.appearance;

                const normalizedNode = {
                    ...node,
                    id: String(node.id),
                    type: node.type,
                    name: String(node.name || '').trim().slice(0, 80),
                    x: geneoNumber(
                        node.x,
                        120 + index * 18,
                        -GENEO_WORLD_LIMIT,
                        GENEO_WORLD_LIMIT
                    ),
                    y: geneoNumber(
                        node.y,
                        120 + index * 18,
                        -GENEO_WORLD_LIMIT,
                        GENEO_WORLD_LIMIT
                    ),
                    width: geneoNumber(
                        node.width,
                        defaults.width,
                        defaults.minWidth,
                        node.type === 'person'
                            ? defaults.maxWidth
                            : 10000
                    ),
                    height: geneoNumber(
                        node.height,
                        defaults.height,
                        defaults.minHeight,
                        node.type === 'person'
                            ? defaults.maxHeight
                            : 10000
                    ),
                    parentPanelId: node.parentPanelId || null,
                    order: geneoNumber(node.order, index + 1),
                    visible: node.visible !== false,
                    locked: Boolean(node.locked),
                    appearance: geneoAppearance(
                        node.appearance,
                        appearanceDefaults,
                        node.type
                    )
                };
                if (node.type === 'person')
                {
                    const sourcePersonCard =
                        node.personCard
                && typeof node.personCard === 'object'
                            ? node.personCard
                            : {};

                    const legacyStyle =
                        geneoPersonCardSettingValueIsValid(
                            'style',
                            sourcePersonCard.style
                        )
                            ? sourcePersonCard.style
                            : diagram.personCardDefaults.style;
                    if (!source.cardAppearanceDefaults && !diagram.canvas.colorPersonCardsByGender)
                    {
                        const neutral = diagram.cardAppearanceDefaults.neutral;
                        for (const property of ['fill', 'stroke', 'text'])
                        {
                            if (node.appearance?.paintOverrides?.[property] === true) continue;
                            const expected = property === 'stroke' && legacyStyle !== 'standard'
                                ? { ...neutral.stroke, enabled: true } : neutral[property];
                            normalizedNode.appearance.paintOverrides[property] =
                                JSON.stringify(normalizedNode.appearance[property]) !== JSON.stringify(expected);
                        }
                    }

                    const legacyDefaultHeight =
                        legacyStyle === 'standard'
                && Math.abs(
                    Number(node.height) - 220
                ) < .5;

                    const legacyPhotoOverride =
                        sourcePersonCard.custom === true
                && typeof sourcePersonCard
                    .fields?.photo === 'boolean'
                && !Object.hasOwn(
                    sourcePersonCard.photoByStyle
                    || {},
                    legacyStyle
                );

                    const personCardSource =
                        legacyPhotoOverride
                            ? {
                                ...sourcePersonCard,
                                fields: {
                                    ...sourcePersonCard.fields,
                                    photo: undefined
                                },
                                photoByStyle: {
                                    ...sourcePersonCard.photoByStyle,
                                    [legacyStyle]:
                          sourcePersonCard
                              .fields.photo
                                }
                            }
                            : sourcePersonCard;

                    normalizedNode.personCard =
                        normalizeGeneographPersonCardOverrides(
                            personCardSource,
                            legacyDefaultHeight
                                ? 'auto'
                                : 'manual',
                            diagram.personCardDefaults.style
                        );

                    if (legacyStyle === 'chart' && node.chartCardLayoutVersion !== 1)
                    {
                        const width = Math.max(normalizedNode.width, 420);
                        const height = Math.max(normalizedNode.height, GENEO_PERSON_CARD_GEOMETRY.chart.height);
                        normalizedNode.x -= (width - normalizedNode.width) / 2;
                        normalizedNode.y -= (height - normalizedNode.height) / 2;
                        normalizedNode.width = width;
                        normalizedNode.height = height;
                    }

                    if (legacyStyle === 'portrait' && node.portraitCardLayoutVersion !== 1)
                    {
                        const width = Math.max(normalizedNode.width, 235);
                        const height = Math.max(normalizedNode.height, 360);
                        normalizedNode.x -= (width - normalizedNode.width) / 2;
                        normalizedNode.y -= (height - normalizedNode.height) / 2;
                        normalizedNode.width = width;
                        normalizedNode.height = height;
                    }

                    ensureGeneographPersonCardSize(
                        normalizedNode,
                        diagram
                    );
                }
                if (node.type === 'shape')
                {
                    normalizedNode.shapeKind = normalizeGeneographShapeKind(node.shapeKind);
                }
                else
                {
                    delete normalizedNode.shapeKind;
                }
                if (node.type === 'drawing')
                {
                    normalizedNode.points = normalizeGeneographDrawingPoints(node.points);
                    if (normalizedNode.points.length < 2) return;
                }
                else
                {
                    delete normalizedNode.points;
                }
                if (node.type === 'place')
                {
                    normalizedNode.placeRef =
                        normalizeGeneographPlaceRef(
                            node,
                            board.projectId
                        );

                    if (!normalizedNode.placeRef)
                    {
                        return;
                    }

                    normalizedNode.placeSizeMode =
                        node.placeSizeMode === 'manual'
                            ? 'manual'
                            : 'auto';

                    delete normalizedNode.placeId;
                    delete normalizedNode.placeName;
                    delete normalizedNode.title;
                }
                else
                {
                    delete normalizedNode.placeRef;
                    delete normalizedNode.placeSizeMode;
                }
                if (node.type === 'panel')
                {
                    normalizedNode.title =
                        String(node.title ?? '')
                            .trim()
                            .slice(0, 160);

                    normalizedNode.description =
                        String(node.description || '')
                            .trim()
                            .slice(0, 500);
                }
                else
                {
                    delete normalizedNode.description;
                }

                if (node.type === 'image')
                {
                    const imageRef = normalizeGeneographImageRef(node);
                    normalizedNode.imageRef = imageRef;
                    normalizedNode.imageCrop = geneoNormalizeImageCrop(node.imageCrop);

                    // Preserve a genuinely custom legacy title as the new layer
                    // name, but do not retain duplicated media titles.
                    const legacyTitle = String(node.title || '').trim();

                    let referencedRecord = null;

                    if (imageRef?.scope === 'project')
                    {
                        referencedRecord = getPhoto(imageRef.id, {
                            projectId: board.projectId
                        });
                    }
                    else if (imageRef?.scope === 'board')
                    {
                        referencedRecord = diagram.assets.find(
                            asset => asset.id === imageRef.id
                        ) || null;
                    }

                    const implicitNames = new Set(
                        [
                            referencedRecord?.title,
                            referencedRecord?.displayName,
                            referencedRecord?.filename,
                            geneoFilenameStem(referencedRecord?.filename)
                        ]
                            .map(value => String(value || '').trim())
                            .filter(Boolean)
                    );

                    if (
                        !normalizedNode.name
                && legacyTitle
                && !implicitNames.has(legacyTitle)
                    )
                    {
                        normalizedNode.name = legacyTitle.slice(0, 80);
                    }

                    delete normalizedNode.photoId;
                    delete normalizedNode.title;
                }

                diagram.nodes.push(normalizedNode);
            });
        diagram.nodes.forEach(node =>
        {
            const parent = diagram.nodes.find(candidate => candidate.id === node.parentPanelId && candidate.type === 'panel');
            if (!parent || parent.id === node.id) node.parentPanelId = null;
        });
        pruneGeneographBoardAssets(diagram);
        const familyIds = new Set();
        (Array.isArray(source.families) ? source.families : []).forEach(family =>
        {
            if (!family || !family.id || familyIds.has(family.id)) return;
            const partnerIds = normalizeGeneographIdArray(family.partnerIds).filter(id => personIds.has(id)).slice(0, 2);
            const children = [];
            (Array.isArray(family.children) ? family.children : []).forEach(child =>
            {
                if (!child || !personIds.has(child.personId) || children.some(item => item.personId === child.personId)) return;
                children.push({ personId: child.personId, parentageType: String(child.parentageType || 'biological') });
            });
            if (!partnerIds.length && !children.length) return;
            familyIds.add(family.id);
            diagram.families.push({
                id: String(family.id),
                partnerIds,
                children,
                relationshipType: String(family.relationshipType || 'Married'),
                relationshipStatus: String(family.relationshipStatus || 'active'),
                marriageType: String(family.marriageType || ''),
                events: Array.isArray(family.events) ? family.events.map(event => ({ ...event, date: normalizeGenealogyDateInput(event.date || event) })) : []
            });
        });
        const connectionIds = new Set();
        (Array.isArray(source.connections) ? source.connections : []).forEach(connection =>
        {
            if (!connection || !connection.id || connectionIds.has(connection.id)) return;
            const sourceValid = connection.source?.nodeId ? nodeIds.has(connection.source.nodeId) : familyIds.has(connection.source?.familyId);
            const targetValid = connection.target?.nodeId ? nodeIds.has(connection.target.nodeId) : familyIds.has(connection.target?.familyId);
            if (!sourceValid || !targetValid) return;
            connectionIds.add(connection.id);
            diagram.connections.push({
                id: String(connection.id),
                kind: ['family-partner', 'family-child', 'family-sibling', 'visual'].includes(connection.kind) ? connection.kind : 'visual',
                visible: connection.visible !== false,
                name: normalizeGeneographLayerName(
                    connection.name
                ),
                familyId: familyIds.has(connection.familyId) ? connection.familyId : null,
                source: { ...connection.source }, target: { ...connection.target },
                style: geneoNormalizeConnectionOverrides(connection.style, connection.kind),
                ...(typeof connection.showRelationshipDates === 'boolean'
                    ? { showRelationshipDates: connection.showRelationshipDates } : {}),
                route: {
                    mode: connection.route?.mode === 'manual' ? 'manual' : 'auto',
                    waypoints: (Array.isArray(connection.route?.waypoints) ? connection.route.waypoints : []).map(point => ({
                        x: geneoNumber(point?.x, 0, -GENEO_WORLD_LIMIT, GENEO_WORLD_LIMIT),
                        y: geneoNumber(point?.y, 0, -GENEO_WORLD_LIMIT, GENEO_WORLD_LIMIT)
                    })),
                    ...(connection.kind === 'family-child' && connection.route?.mode !== 'manual'
                        && Number.isFinite(connection.route?.railY)
                        ? { railY: geneoNumber(connection.route.railY, 0, -GENEO_WORLD_LIMIT, GENEO_WORLD_LIMIT) }
                        : {})
                }
            });
        });
        board.diagram = diagram;
        delete board.people;
        delete board.evidence;
        delete board.questions;
    return board;
}

function geneoNodeDefaults(type)
{
    const common = {
        appearance: {
            fill: { color: geneoThemeColor('#18211F', '#FFFFFF'), opacity: 100, enabled: true },
            stroke: { color: geneoThemeColor('#52615D', '#8FA99A'), opacity: 100, enabled: true },
            strokeWidth: 1,
            strokePattern: 'solid',
            shadowEnabled: null,
            text: { color: geneoThemeColor('#F1F5F3', '#17251E'), opacity: 100, enabled: true },
            paintOverrides: { fill: false, stroke: false, text: false }
        }
    };

    if (type === 'person')
    {
        const geometry =
            GENEO_PERSON_CARD_GEOMETRY
                .standard;

        return {
            ...common,

            appearance: {
                ...common.appearance,

                paintOverrides: {
                    fill: false,
                    stroke: false,
                    text: false
                }
            },

            width:
            geometry.width,

            height:
            geometry.height,

            /*
           * Normalization uses the full style
           * envelope, then applies the selected
           * style limits.
           */
            minWidth: 170,
            maxWidth: 700,
            minHeight: 100,
            maxHeight: 660
        };
    }

    if (type === 'image')
    {
        const appearance = { ...common.appearance, cornerRadius: 8, imageOpacity: 100 };
        delete appearance.fill;
        return {
            ...common,
            appearance,
            width: 280,
            height: 200,
            minWidth: 160,
            minHeight: 120
        };
    }

    if (type === 'sticky')
    {
        return {
            ...common,
            width: 220,
            height: 200,
            minWidth: 160,
            minHeight: 120,
            appearance: {
                ...common.appearance,
                fill: {
                    color: geneoThemeColor('#D4AA6B', '#FFF2CF'),
                    opacity: 100,
                    enabled: true
                },
                stroke: {
                    color: geneoThemeColor('#A77C3F', '#A77C3F'),
                    opacity: 100,
                    enabled: true
                },
                strokeWidth: 1,
                strokePattern: 'solid',
                text: {
                    color: geneoThemeColor('#241C10', '#4F4326'),
                    opacity: 100,
                    enabled: true
                },
                cornerRadius: 8,
                fontSize: 15
            }
        };
    }

    if (type === 'text')
    {
        return {
            ...common,

            width: 320,
            height: 80,
            minWidth: 120,
            minHeight: 48,

            appearance: {
                ...common.appearance,

                /*
             * Text blocks are transparent by default.
             * The stored colors remain available so
             * Background / Stroke can be restored
             * directly from the Appearance inspector.
             */
                fill: {
                    ...common.appearance.fill,
                    enabled: false
                },

                stroke: {
                    ...common.appearance.stroke,
                    enabled: false
                },

                strokeWidth: 1,
                strokePattern: 'solid',

                text: {
                    ...common.appearance.text
                },

                cornerRadius: 8,
                fontSize: 18
            }
        };
    }

    if (type === 'shape')
    {
        return {
            ...common,
            width: 180,
            height: 120,
            minWidth: 60,
            minHeight: 60,
            appearance: {
                ...common.appearance,
                fill: { color: geneoThemeColor('#173029', '#E4EDE7'), opacity: 100, enabled: true },
                stroke: { color: geneoThemeColor('#62D99A', '#1B6847'), opacity: 100, enabled: true },
                strokeWidth: 2,
                strokePattern: 'solid',
                cornerRadius: 8
            }
        };
    }

    if (type === 'drawing')
    {
        return {
            ...common,
            width: 160,
            height: 100,
            minWidth: 12,
            minHeight: 12,
            appearance: {
                ...common.appearance,
                fill: { ...common.appearance.fill, enabled: false },
                stroke: { color: geneoThemeColor('#D9E5E1', '#526B5C'), opacity: 100, enabled: true },
                strokeWidth: 2,
                strokePattern: 'solid'
            }
        };
    }

    if (type === 'place')
    {
        return {
            ...common,
            width: 240,
            height: 54,
            minWidth: 96,
            minHeight: 44,
            appearance: {
                ...common.appearance,
                fill: { color: geneoSemanticColor('--geneo-place-fill'), opacity: 100, enabled: true },
                stroke: { color: geneoSemanticColor('--geneo-place-stroke'), opacity: 100, enabled: true },
                strokeWidth: 1,
                strokePattern: 'solid',
                text: { color: geneoSemanticColor('--geneo-place-text'), opacity: 100, enabled: true },
                cornerRadius: 8,
                fontSize: 13
            }
        };
    }

    return {
        ...common,
        width: 480,
        height: 320,
        minWidth: 240,
        minHeight: 180,

        appearance: {
            ...common.appearance,

            fill: {
                ...common.appearance.fill,
                opacity: 68
            },

            strokePattern: 'dashed',
            cornerRadius: 8
        }
    };
}

function geneoNodeMinimumSize(
    node,
    width = node?.width
)
{
    if (node?.type === 'person')
    {
        return geneoPersonCardMinimumSize(
            node,
            width
        );
    }

    const defaults =
        geneoNodeDefaults(
            node?.type
        );

    return {
        width:
          defaults.minWidth,

        height:
          defaults.minHeight
    };
}

function geneoNodeMaximumSize(
    node
)
{
    if (node?.type === 'person')
    {
        const geometry =
            geneoPersonCardGeometry(
                node
            );

        return {
            width: geometry.maxWidth,
            height: geometry.maxHeight
        };
    }

    return {
        width: 10000,
        height: 10000
    };
}

function touchGeneographBoard(board = selectedGeneographBoard())
{
    if (!board) return;
    board.modifiedAt = new Date().toISOString();
    board.modified = 'Just now';
    markPrototypeSessionEdited();
    invalidateGeneographBoardPreview(board.id);
}

function geneoEnsureHistory()
{
    const boardId = selectedGeneographBoard()?.id || '';
    if (geneoHistoryRuntime.boardId !== boardId) geneoHistoryRuntime = { boardId, undo: [], redo: [] };
}

function geneoSnapshot()
{
    return JSON.stringify(selectedGeneographDiagram());
}

function geneoHistoryCompanionSnapshot(snapshot)
{
    const parsed = JSON.parse(snapshot);
    if (parsed?.geneoReviewHistory) return JSON.stringify({ ...parsed, side: parsed.side === 'before' ? 'after' : 'before' });
    return geneoSnapshot();
}

function geneoPushHistory()
{
    geneoEnsureHistory();
    const snapshot = geneoSnapshot();
    if (geneoHistoryRuntime.undo.at(-1) !== snapshot) geneoHistoryRuntime.undo.push(snapshot);
    if (geneoHistoryRuntime.undo.length > GENEO_HISTORY_LIMIT) geneoHistoryRuntime.undo.shift();
    geneoHistoryRuntime.redo = [];
}

function geneoPushHistorySnapshot(snapshot)
{
    if (!snapshot) return;
    geneoEnsureHistory();
    if (geneoHistoryRuntime.undo.at(-1) !== snapshot) geneoHistoryRuntime.undo.push(snapshot);
    if (geneoHistoryRuntime.undo.length > GENEO_HISTORY_LIMIT) geneoHistoryRuntime.undo.shift();
    geneoHistoryRuntime.redo = [];
}

function geneoRestoreSnapshot(
    snapshot
)
{
    const board =
        selectedGeneographBoard();

    if (!board || !snapshot)
    {
        return false;
    }

    try
    {
        const parsed = JSON.parse(snapshot);
        if (parsed?.geneoReviewHistory) return geneoReviewRestoreHistory(parsed);
        board.diagram = parsed;

        state.geneoLayerRename = null;

        normalizeGeneographRuntimeData();
        touchGeneographBoard(board);

        return true;
    }
    catch (error)
    {
        console.warn(
            'Unable to restore Geneograph history',
            error
        );

        return false;
    }
}

function undoGeneographChange()
{
    cancelGeneographPencilStroke();
    geneoEnsureHistory();
    const snapshot = geneoHistoryRuntime.undo.at(-1);
    if (!snapshot) return;
    const entry = JSON.parse(snapshot);
    if (entry?.geneoReviewHistory && !geneoReviewHistoryCanRestore(entry))
    { showToast('This review cannot be undone because affected records changed.'); return; }
    geneoHistoryRuntime.undo.pop();
    geneoHistoryRuntime.redo.push(geneoHistoryCompanionSnapshot(snapshot));
    if (geneoRestoreSnapshot(snapshot)) renderGeneographEditorPreserveScroll({ preserveInspectorScroll: true, preserveSidebarScroll: true });
}

function redoGeneographChange()
{
    cancelGeneographPencilStroke();
    geneoEnsureHistory();
    const snapshot = geneoHistoryRuntime.redo.at(-1);
    if (!snapshot) return;
    const entry = JSON.parse(snapshot);
    if (entry?.geneoReviewHistory && !geneoReviewHistoryCanRestore(entry))
    { showToast('This review cannot be redone because affected records changed.'); return; }
    geneoHistoryRuntime.redo.pop();
    geneoHistoryRuntime.undo.push(geneoHistoryCompanionSnapshot(snapshot));
    if (geneoRestoreSnapshot(snapshot)) renderGeneographEditorPreserveScroll({ preserveInspectorScroll: true, preserveSidebarScroll: true });
}

function geneoSelectedNodeIdSet()
{
    return new Set(Array.isArray(state.selectedGeneoNodeIds) ? state.selectedGeneoNodeIds : []);
}
function geneoSelectedConnectionIdSet()
{
    return new Set(Array.isArray(state.selectedGeneoConnectionIds) ? state.selectedGeneoConnectionIds : []);
}
function selectedGeneographNodes()
{
    const selectedIds = geneoSelectedNodeIdSet();
    return selectedGeneographDiagram()?.nodes.filter(node => selectedIds.has(node.id)) || [];
}
function selectedGeneographConnections()
{
    const selectedIds = geneoSelectedConnectionIdSet();
    return selectedGeneographDiagram()?.connections.filter(connection => selectedIds.has(connection.id)) || [];
}
function selectedGeneographNode()
{
    return getGeneographNode(state.selectedGeneoNodeId);
}
function selectedGeneographConnection()
{
    return getGeneographConnection(state.selectedGeneoConnectionId);
}
function pruneGeneographSelection()
{
    const nodeIds = [...geneoSelectedNodeIdSet()].filter(id => Boolean(getGeneographNode(id)));
    const connectionIds = [...geneoSelectedConnectionIdSet()].filter(id => Boolean(getGeneographConnection(id)));
    state.selectedGeneoNodeIds = nodeIds;
    state.selectedGeneoConnectionIds = connectionIds;
    if (!nodeIds.includes(state.selectedGeneoNodeId)) state.selectedGeneoNodeId = nodeIds.at(-1) || null;
    if (!connectionIds.includes(state.selectedGeneoConnectionId))
    {
        state.selectedGeneoConnectionId = connectionIds.at(-1) || null;
        state.selectedGeneoWaypointIndex = null;
    }
}
function selectGeneographCanvas()
{
    state.selectedGeneoNodeId = null; state.selectedGeneoNodeIds = []; state.selectedGeneoConnectionId = null; state.selectedGeneoConnectionIds = []; state.selectedGeneoWaypointIndex = null;
}
function setGeneographSelection(nodeIds = [], connectionIds = [], primary = {})
{
    const validIds = [...new Set(Array.isArray(nodeIds) ? nodeIds : [])].filter(id => Boolean(getGeneographNode(id)));
    const validConnectionIds = [...new Set(Array.isArray(connectionIds) ? connectionIds : [])].filter(id => Boolean(getGeneographConnection(id)));
    if (geneoImageCropRuntime && (validIds.some(id => id !== geneoImageCropRuntime.nodeId) || validConnectionIds.length))
        geneoFinishImageCrop(true, { render: false, restoreFocus: false });
    state.selectedGeneoNodeIds = validIds;
    state.selectedGeneoConnectionIds = validConnectionIds;
    state.selectedGeneoNodeId = validIds.includes(primary.nodeId) ? primary.nodeId : validIds.at(-1) || null;
    state.selectedGeneoConnectionId = validConnectionIds.includes(primary.connectionId) ? primary.connectionId : validConnectionIds.at(-1) || null;
    state.selectedGeneoWaypointIndex = null;
}
function setGeneographNodeSelection(nodeIds, primaryId = '')
{
    setGeneographSelection(nodeIds, [], { nodeId: primaryId });
}
function selectGeneographNode(nodeId, options = {})
{
    const id = getGeneographNode(nodeId)?.id;
    if (!id)
    {
        selectGeneographCanvas(); return;
    }
    const current = geneoSelectedNodeIdSet();
    if (options.toggle)
    {
        if (current.has(id)) current.delete(id); else current.add(id);
        setGeneographSelection([...current], [...geneoSelectedConnectionIdSet()], { nodeId: current.has(id) ? id : [...current].at(-1) });
    }
    else if (options.add)
    {
        current.add(id); setGeneographSelection([...current], [...geneoSelectedConnectionIdSet()], { nodeId: id });
    }
    else
    {
        setGeneographNodeSelection([id], id);
    }
}
function selectGeneographConnection(connectionId, waypointIndex = null, options = {})
{
    const id = getGeneographConnection(connectionId)?.id;
    if (!id)
    {
        selectGeneographCanvas(); return;
    }
    if (options.toggle || options.add)
    {
        const nodes = [...geneoSelectedNodeIdSet()];
        const connections = geneoSelectedConnectionIdSet();
        if (options.toggle && connections.has(id)) connections.delete(id); else connections.add(id);
        setGeneographSelection(nodes, [...connections], { connectionId: connections.has(id) ? id : [...connections].at(-1) });
    }
    else
    {
        setGeneographSelection([], [id], { connectionId: id });
    }
    state.selectedGeneoWaypointIndex = Number.isInteger(waypointIndex) && state.selectedGeneoConnectionId === id ? waypointIndex : null;
}

function geneoNodeEffectiveVisible(node)
{
    if (!node?.visible) return false;
    const parent = getGeneographNode(node.parentPanelId);
    return !parent || geneoNodeEffectiveVisible(parent);
}

function geneoConnectionReferenceNodes(reference)
{
    const diagram = selectedGeneographDiagram();
    if (!diagram || !reference) return [];

    if (reference.nodeId)
    {
        const node = getGeneographNode(reference.nodeId);
        return node ? [node] : [];
    }

    if (!reference.familyId) return [];

    const family = getGeneographFamily(reference.familyId);
    if (!family) return [];

    const partnerIds = new Set(
        family.partnerIds || []
    );

    return diagram.nodes.filter(node =>
        node.type === 'person'
        && partnerIds.has(node.personId)
    );
}

function geneoConnectionReferenceEffectiveVisible(reference)
{
    const nodes = geneoConnectionReferenceNodes(reference);

    return nodes.length > 0
        && nodes.every(geneoNodeEffectiveVisible);
}

function geneoConnectionEffectiveVisible(connection)
{
    return Boolean(
        connection
        && connection.visible !== false
        && geneoConnectionReferenceEffectiveVisible(
            connection.source
        )
        && geneoConnectionReferenceEffectiveVisible(
            connection.target
        )
    );
}

function geneoNodeEffectiveLocked(node)
{
    if (!node) return true;
    const parent = getGeneographNode(node.parentPanelId);
    return node.locked || (parent ? geneoNodeEffectiveLocked(parent) : false);
}

function geneoNodeFullyInsidePanel(node, panel)
{
    return Boolean(node && panel && panel.type === 'panel' && node.id !== panel.id
        && node.x >= panel.x
        && node.y >= panel.y
        && node.x + node.width <= panel.x + panel.width
        && node.y + node.height <= panel.y + panel.height);
}

function geneoContainingPanelForNode(node)
{
    return selectedGeneographDiagram().nodes
        .filter(item => item.type === 'panel' && item.id !== node?.id && geneoNodeEffectiveVisible(item))
        .sort((a, b) => b.order - a.order)
        .find(panel => geneoNodeFullyInsidePanel(node, panel)) || null;
}

function reconcileGeneographPanelMembership(panelId)
{
    const diagram = selectedGeneographDiagram();
    const panel = getGeneographNode(panelId);
    if (!diagram || panel?.type !== 'panel') return false;
    let changed = false;
    diagram.nodes.forEach(node =>
    {
        if (node.id === panel.id || node.type === 'panel') return;
        const inside = geneoNodeEffectiveVisible(node) && geneoNodeFullyInsidePanel(node, panel);
        if (inside && node.parentPanelId !== panel.id)
        {
            node.parentPanelId = panel.id;
            changed = true;
        }
        else if (!inside && node.parentPanelId === panel.id)
        {
            node.parentPanelId = null;
            changed = true;
        }
    });
    return changed;
}

function geneoDefaultNodeTitle(node)
{
    if (!node) return 'Canvas';

    if (node.type === 'person')
    {
        return geneoPersonDisplayName(
            getGeneographPerson(node.personId)
        );
    }

    if (node.type === 'image')
    {
        return geneoImageSourceName(node);
    }

    if (node.type === 'panel')
    {
        return node.title || 'Panel';
    }

    if (node.type === 'shape')
    {
        return geneoShapeLabel(node.shapeKind);
    }

    if (node.type === 'place')
    {
        return resolveGeneographPlace(node).name;
    }

    if (node.type === 'drawing')
    {
        return 'Pencil stroke';
    }

    /*
      * Sticky content is independent from its layer
      * identity. Users can provide a custom layer name
      * through the Layer section.
      */
    if (node.type === 'sticky')
    {
        return 'Sticky note';
    }

    return (
        String(node.text || 'Text')
            .split(/\r?\n/)[0]
        || 'Untitled'
    );
}

function geneoNodeTitle(node)
{
    return (
        normalizeGeneographLayerName(
            node?.name
        )
        || geneoDefaultNodeTitle(node)
    );
}

function geneoNodeIcon(type)
{
    return type === 'person'
        ? icon.profile
        : type === 'image'
            ? icon.image
            : type === 'sticky'
                ? icon.note
                : type === 'text'
                    ? icon.text
                    : type === 'place'
                        ? icon.mapPin
                        : type === 'drawing'
                            ? icon.edit
                            : icon.shape;
}

function geneoContentBounds(diagram = selectedGeneographDiagram())
{
    const extents = [];
    (diagram?.nodes || []).forEach(node =>
    {
        extents.push({ x: node.x, y: node.y });
        extents.push({ x: node.x + node.width, y: node.y + node.height });
    });
    (diagram?.connections || []).forEach(connection =>
    {
        (connection.route?.waypoints || []).forEach(point => extents.push(point));
    });
    (diagram?.families || []).forEach(family =>
    {
        if (family.partnerIds.length === 2) extents.push(geneoFamilyJunction(family.id));
    });
    if (!extents.length) return { left: -300, top: -220, right: 300, bottom: 220, width: 600, height: 440 };
    const xs = extents.map(point => point.x);
    const ys = extents.map(point => point.y);
    const left = Math.min(...xs);
    const top = Math.min(...ys);
    const right = Math.max(...xs);
    const bottom = Math.max(...ys);
    return { left, top, right, bottom, width: Math.max(1, right - left), height: Math.max(1, bottom - top) };
}

function geneoDerivedCanvasBounds(diagram = selectedGeneographDiagram())
{
    const boardId = selectedGeneographBoard()?.id || '';
    if (geneoCanvasRuntime.boardId !== boardId)
    {
        geneoCanvasRuntime = createGeneoCanvasRuntime(boardId);
    }
    const zoom = Math.max(.25, Math.min(2, state.geneoZoom / 100));
    const wrap = main.querySelector('[data-geneo-canvas-wrap]');
    const viewportWidth = Math.max(900, (wrap?.clientWidth || main.clientWidth || 1200) / zoom);
    const viewportHeight = Math.max(640, (wrap?.clientHeight || main.clientHeight || 760) / zoom);
    const content = geneoContentBounds(diagram);
    let left = Math.floor((content.left - GENEO_CANVAS_MARGIN) / GENEO_GRID_SIZE) * GENEO_GRID_SIZE;
    let top = Math.floor((content.top - GENEO_CANVAS_MARGIN) / GENEO_GRID_SIZE) * GENEO_GRID_SIZE;
    let right = Math.ceil((content.right + GENEO_CANVAS_MARGIN) / GENEO_GRID_SIZE) * GENEO_GRID_SIZE;
    let bottom = Math.ceil((content.bottom + GENEO_CANVAS_MARGIN) / GENEO_GRID_SIZE) * GENEO_GRID_SIZE;
    const previous = geneoCanvasRuntime.bounds;
    if (previous)
    {
        left = Math.min(left, previous.left);
        top = Math.min(top, previous.top);
        right = Math.max(right, previous.right);
        bottom = Math.max(bottom, previous.bottom);
    }
    const minimumWidth = viewportWidth + GENEO_CANVAS_MARGIN * 2;
    const minimumHeight = viewportHeight + GENEO_CANVAS_MARGIN * 2;
    if (right - left < minimumWidth)
    {
        const extra = (minimumWidth - (right - left)) / 2;
        left -= extra;
        right += extra;
    }
    if (bottom - top < minimumHeight)
    {
        const extra = (minimumHeight - (bottom - top)) / 2;
        top -= extra;
        bottom += extra;
    }
    left = Math.max(-GENEO_WORLD_LIMIT, left);
    top = Math.max(-GENEO_WORLD_LIMIT, top);
    right = Math.min(GENEO_WORLD_LIMIT, right);
    bottom = Math.min(GENEO_WORLD_LIMIT, bottom);
    return { left, top, right, bottom, width: right - left, height: bottom - top };
}

function geneoCurrentViewportCenter()
{
    const wrap = main.querySelector('[data-geneo-canvas-wrap]');
    const bounds = geneoCanvasRuntime.bounds;
    if (!wrap || !bounds) return null;
    const zoom = state.geneoZoom / 100;
    return {
        x: bounds.left + (wrap.scrollLeft + wrap.clientWidth / 2) / zoom,
        y: bounds.top + (wrap.scrollTop + wrap.clientHeight / 2) / zoom
    };
}

function geneoSavedViewport(boardId = selectedGeneographBoard()?.id)
{
    const saved = boardId ? state.geneoBoardViewports?.[boardId] : null;
    if (!saved || !Number.isFinite(saved.center?.x) || !Number.isFinite(saved.center?.y) || !Number.isFinite(saved.zoom)) return null;
    return saved;
}

function captureGeneographViewport(boardId = selectedGeneographBoard()?.id)
{
    if (!boardId) return null;
    const center = geneoCurrentViewportCenter() || geneoSavedViewport(boardId)?.center;
    if (!center || !Number.isFinite(center.x) || !Number.isFinite(center.y)) return null;
    const saved = {
        center: { x: center.x, y: center.y },
        zoom: Math.max(25, Math.min(200, Math.round(state.geneoZoom)))
    };
    state.geneoBoardViewports[boardId] = saved;
    return saved;
}

function clearGeneographViewport(boardId)
{
    if (boardId && state.geneoBoardViewports) delete state.geneoBoardViewports[boardId];
}

function restoreGeneographViewportCenter(point)
{
    const wrap = main.querySelector('[data-geneo-canvas-wrap]');
    const bounds = geneoCanvasRuntime.bounds;
    if (!wrap || !bounds || !point) return false;
    const zoom = state.geneoZoom / 100;
    wrap.scrollLeft = (point.x - bounds.left) * zoom - wrap.clientWidth / 2;
    wrap.scrollTop = (point.y - bounds.top) * zoom - wrap.clientHeight / 2;
    return true;
}

function cancelGeneographViewportRestore({ releaseSuppression = false } = {})
{
    if (geneoCanvasRuntime.viewportReleaseFrame)
    {
        cancelAnimationFrame(geneoCanvasRuntime.viewportReleaseFrame);
    }
    geneoCanvasRuntime.viewportReleaseFrame = null;
    geneoCanvasRuntime.viewportRestoreToken += 1;
    if (releaseSuppression) geneoCanvasRuntime.suppressEdgeExpansion = false;
}

function cancelGeneographEdgeExpansion({ pending = false } = {})
{
    if (geneoCanvasRuntime.edgeExpansionFrame)
    {
        cancelAnimationFrame(geneoCanvasRuntime.edgeExpansionFrame);
    }
    geneoCanvasRuntime.edgeExpansionFrame = null;
    if (pending) geneoCanvasRuntime.pendingEdgeExpansion = true;
}

function scheduleGeneographViewportRestore(point, afterRestore = null)
{
    const boardId = selectedGeneographBoard()?.id || '';
    cancelGeneographViewportRestore();
    const token = geneoCanvasRuntime.viewportRestoreToken;
    geneoCanvasRuntime.suppressEdgeExpansion = true;

    if (
        selectedGeneographBoard()?.id !== boardId
    )
    {
        geneoCanvasRuntime.suppressEdgeExpansion = false;
        return;
    }

    if (point && !restoreGeneographViewportCenter(point))
    {
        geneoCanvasRuntime.suppressEdgeExpansion = false;
        return;
    }

    afterRestore?.();
    captureGeneographViewport(boardId);

    /*
       * Restoration must complete before another pointer gesture can begin.
       * A frame is used only to release edge-expansion suppression after the
       * browser has painted the already-restored viewport.
       */
    geneoCanvasRuntime.viewportReleaseFrame = requestAnimationFrame(() =>
    {
        geneoCanvasRuntime.viewportReleaseFrame = null;
        if (
            token !== geneoCanvasRuntime.viewportRestoreToken
          || selectedGeneographBoard()?.id !== boardId
        )
        {
            return;
        }
        geneoCanvasRuntime.suppressEdgeExpansion = false;
        if (geneoCanvasRuntime.pendingEdgeExpansion && !geneoPointerState)
        {
            geneoCanvasRuntime.pendingEdgeExpansion = false;
            expandGeneographCanvasNearEdge();
        }
    });
}

function geneoViewportPointAtClient(clientX, clientY)
{
    const wrap = main.querySelector('[data-geneo-canvas-wrap]');
    const bounds = geneoCanvasRuntime.bounds;
    if (!wrap || !bounds) return null;
    const rect = wrap.getBoundingClientRect();
    const zoom = state.geneoZoom / 100;
    return {
        x: bounds.left + (wrap.scrollLeft + clientX - rect.left) / zoom,
        y: bounds.top + (wrap.scrollTop + clientY - rect.top) / zoom
    };
}

function applyGeneographZoomToDom(options = {})
{
    const wrap = main.querySelector('[data-geneo-canvas-wrap]');
    const boardSpace = wrap?.querySelector('.geneo-board-space');
    const stage = boardSpace?.querySelector('[data-geneo-stage]');
    const bounds = geneoCanvasRuntime.bounds;
    if (!wrap || !boardSpace || !stage || !bounds) return false;
    const zoom = state.geneoZoom / 100;
    const gridOriginX = (((-bounds.left % GENEO_GRID_SIZE) + GENEO_GRID_SIZE) % GENEO_GRID_SIZE) * zoom;
    const gridOriginY = (((-bounds.top % GENEO_GRID_SIZE) + GENEO_GRID_SIZE) % GENEO_GRID_SIZE) * zoom;
    boardSpace.style.width = `${bounds.width * zoom}px`;
    boardSpace.style.height = `${bounds.height * zoom}px`;
    boardSpace.style.setProperty('--geneo-canvas-zoom', zoom);
    boardSpace.style.setProperty('--geneo-grid-origin-x', `${gridOriginX}px`);
    boardSpace.style.setProperty('--geneo-grid-origin-y', `${gridOriginY}px`);
    stage.style.transform = `scale(${zoom})`;
    const value = main.querySelector('.geneo-zoom-value');
    if (value) value.textContent = `${state.geneoZoom}%`;
    if (options.anchor)
    {
        const rect = wrap.getBoundingClientRect();
        wrap.scrollLeft = (options.anchor.x - bounds.left) * zoom - (options.clientX - rect.left);
        wrap.scrollTop = (options.anchor.y - bounds.top) * zoom - (options.clientY - rect.top);
    }
    else if (options.center)
    {
        wrap.scrollLeft = (options.center.x - bounds.left) * zoom - wrap.clientWidth / 2;
        wrap.scrollTop = (options.center.y - bounds.top) * zoom - wrap.clientHeight / 2;
    }
    if (geneoCanvasRuntime.zoomSettleFrame) cancelAnimationFrame(geneoCanvasRuntime.zoomSettleFrame);
    captureGeneographViewport();
    geneoCanvasRuntime.zoomSettleFrame = requestAnimationFrame(() =>
    {
        geneoCanvasRuntime.zoomSettleFrame = null;
        geneoCanvasRuntime.zooming = false;
        geneoCanvasRuntime.suppressEdgeExpansion = false;
    });
    return true;
}

function setGeneographZoom(nextZoom, options = {})
{
    const zoom = Math.max(25, Math.min(200, Math.round(nextZoom)));
    if (zoom === state.geneoZoom) return false;
    const center = options.center || (!options.anchor ? geneoCurrentViewportCenter() : null);
    cancelGeneographViewportRestore({ releaseSuppression: true });
    if (geneoCanvasRuntime.edgeExpansionFrame) cancelAnimationFrame(geneoCanvasRuntime.edgeExpansionFrame);
    geneoCanvasRuntime.edgeExpansionFrame = null;
    geneoCanvasRuntime.zooming = true;
    geneoCanvasRuntime.suppressEdgeExpansion = true;
    state.geneoZoom = zoom;
    return applyGeneographZoomToDom({ ...options, center });
}

function queueGeneographWheelZoom(event)
{
    event.preventDefault();
    geneoCanvasRuntime.zoomDelta = (Number.isFinite(geneoCanvasRuntime.zoomDelta) ? geneoCanvasRuntime.zoomDelta : 0) + event.deltaY;
    geneoCanvasRuntime.zoomClientX = event.clientX;
    geneoCanvasRuntime.zoomClientY = event.clientY;
    if (geneoCanvasRuntime.zoomFrame) return;
    geneoCanvasRuntime.zoomFrame = requestAnimationFrame(() =>
    {
        geneoCanvasRuntime.zoomFrame = null;
        const delta = geneoCanvasRuntime.zoomDelta;
        geneoCanvasRuntime.zoomDelta = 0;
        if (!delta) return;
        const clientX = geneoCanvasRuntime.zoomClientX;
        const clientY = geneoCanvasRuntime.zoomClientY;
        const anchor = geneoViewportPointAtClient(clientX, clientY);
        setGeneographZoom(state.geneoZoom + (delta < 0 ? 10 : -10), { anchor, clientX, clientY });
    });
}

function geneoContentCenter()
{
    const content = geneoContentBounds();
    return { x: (content.left + content.right) / 2, y: (content.top + content.bottom) / 2 };
}

function expandGeneographCanvasNearEdge()
{
    if (
        geneoCanvasRuntime.suppressEdgeExpansion
        || geneoCanvasRuntime.zooming
        || geneoPointerState
    )
    {
        geneoCanvasRuntime.pendingEdgeExpansion = true;
        return;
    }
    if (geneoCanvasRuntime.edgeExpansionFrame) return;
    geneoCanvasRuntime.edgeExpansionFrame = requestAnimationFrame(() =>
    {
        geneoCanvasRuntime.edgeExpansionFrame = null;
        if (
            geneoCanvasRuntime.suppressEdgeExpansion
          || geneoCanvasRuntime.zooming
          || geneoPointerState
        )
        {
            geneoCanvasRuntime.pendingEdgeExpansion = true;
            return;
        }
        const wrap = main.querySelector('[data-geneo-canvas-wrap]');
        const bounds = geneoCanvasRuntime.bounds;
        if (!wrap || !bounds) return;
        const center = geneoCurrentViewportCenter();
        const zoom = state.geneoZoom / 100;
        const threshold = GENEO_CANVAS_EDGE_THRESHOLD;
        const expansion = GENEO_CANVAS_EXPANSION;
        const next = { ...bounds };
        if (wrap.scrollLeft < threshold && next.left > -GENEO_WORLD_LIMIT) next.left = Math.max(-GENEO_WORLD_LIMIT, next.left - expansion);
        if (wrap.scrollTop < threshold && next.top > -GENEO_WORLD_LIMIT) next.top = Math.max(-GENEO_WORLD_LIMIT, next.top - expansion);
        if (wrap.scrollLeft + wrap.clientWidth > bounds.width * zoom - threshold && next.right < GENEO_WORLD_LIMIT) next.right = Math.min(GENEO_WORLD_LIMIT, next.right + expansion);
        if (wrap.scrollTop + wrap.clientHeight > bounds.height * zoom - threshold && next.bottom < GENEO_WORLD_LIMIT) next.bottom = Math.min(GENEO_WORLD_LIMIT, next.bottom + expansion);
        geneoCanvasRuntime.pendingEdgeExpansion = false;
        if (next.left === bounds.left && next.top === bounds.top && next.right === bounds.right && next.bottom === bounds.bottom) return;
        next.width = next.right - next.left;
        next.height = next.bottom - next.top;
        geneoCanvasRuntime.bounds = next;
        renderGeneographEditorPreserveCenter(center);
    });
}

function geneoCanvasPointForNode(node, port = 'bottom')
{
    if (!node) return { x: 0, y: 0 };
    if (port === 'top') return { x: node.x + node.width / 2, y: node.y };
    if (port === 'left') return { x: node.x, y: node.y + node.height / 2 };
    if (port === 'right') return { x: node.x + node.width, y: node.y + node.height / 2 };
    return { x: node.x + node.width / 2, y: node.y + node.height };
}

function geneoPartnerConnectionForFamily(familyId)
{
    return selectedGeneographDiagram()?.connections.find(connection =>
        connection.kind === 'family-partner'
        && connection.familyId === familyId
        && connection.source?.nodeId
        && connection.target?.nodeId
    ) || null;
}

function geneoPolylineMidpoint(points)
{
    const segments = (Array.isArray(points) ? points : []).slice(0, -1).map((start, index) =>
    {
        const end = points[index + 1];
        return { start, end, length: Math.hypot(end.x - start.x, end.y - start.y) };
    }).filter(segment => segment.length > 0);
    const totalLength = segments.reduce((sum, segment) => sum + segment.length, 0);
    if (!segments.length || !totalLength) return null;
    let remaining = totalLength / 2;
    for (const segment of segments)
    {
        if (remaining <= segment.length)
        {
            const progress = remaining / segment.length;
            return {
                x: segment.start.x + (segment.end.x - segment.start.x) * progress,
                y: segment.start.y + (segment.end.y - segment.start.y) * progress
            };
        }
        remaining -= segment.length;
    }
    return { ...segments.at(-1).end };
}

function geneoFamilyJunction(familyId)
{
    const family = getGeneographFamily(familyId);
    const nodes = (family?.partnerIds || []).map(personId => selectedGeneographDiagram().nodes.find(node => node.type === 'person' && node.personId === personId)).filter(Boolean);
    if (!nodes.length) return { x: 0, y: 0 };
    if (nodes.length === 1) return geneoCanvasPointForNode(nodes[0], 'bottom');
    const partnerConnection = geneoPartnerConnectionForFamily(familyId);
    const partnerPoints = partnerConnection ? geneoConnectionPoints(partnerConnection) : null;
    if (partnerPoints?.length > 1)
    {
        const radius = geneoEffectiveConnectionStyle(partnerConnection).cornerRadius;
        const segments = partnerPoints.slice(0, -1).map((rawStart, index) =>
        {
            const rawEnd = partnerPoints[index + 1];
            const length = Math.hypot(rawEnd.x - rawStart.x, rawEnd.y - rawStart.y);
            if (length < 1) return null;
            const startCut = geneoConnectionCornerCut(partnerPoints, index, radius) / length;
            const endCut = geneoConnectionCornerCut(partnerPoints, index + 1, radius) / length;
            const coordinate = value => radius ? Number(value.toFixed(2)) : Math.round(value);
            const start = { x: coordinate(rawStart.x + (rawEnd.x - rawStart.x) * startCut),
                y: coordinate(rawStart.y + (rawEnd.y - rawStart.y) * startCut) };
            const end = { x: coordinate(rawEnd.x - (rawEnd.x - rawStart.x) * endCut),
                y: coordinate(rawEnd.y - (rawEnd.y - rawStart.y) * endCut) };
            return { start, end, length: Math.hypot(end.x - start.x, end.y - start.y),
                horizontal: Math.abs(start.y - end.y) < .001 };
        }).filter(segment => segment?.length > 1);
        segments.sort((a, b) => Number(b.horizontal) - Number(a.horizontal) || b.length - a.length);
        const segment = segments[0];
        if (segment)
        {
            const midpoint = { x: (segment.start.x + segment.end.x) / 2,
                y: (segment.start.y + segment.end.y) / 2 };
            if (!selectedGeneographDiagram()?.canvas.snapToGrid) return midpoint;
            const clamp = (value, a, b) => Math.max(Math.min(a, b), Math.min(Math.max(a, b), value));
            if (segment.horizontal)
                return { x: clamp(snapGeneographCoordinate(midpoint.x), segment.start.x, segment.end.x), y: segment.start.y };
            if (Math.abs(segment.start.x - segment.end.x) < .001)
                return { x: segment.start.x, y: clamp(snapGeneographCoordinate(midpoint.y), segment.start.y, segment.end.y) };
            return midpoint;
        }
    }
    const first = geneoCanvasPointForNode(nodes[0], nodes[0].x < nodes[1].x ? 'right' : 'left');
    const second = geneoCanvasPointForNode(nodes[1], nodes[0].x < nodes[1].x ? 'left' : 'right');
    return { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 };
}

function geneoConnectionPoint(reference)
{
    if (reference?.familyId) return geneoFamilyJunction(reference.familyId);
    return geneoCanvasPointForNode(getGeneographNode(reference?.nodeId), reference?.port);
}

function geneoFamilyChildBusGroups(diagram = selectedGeneographDiagram())
{
    const candidates = new Map();
    for (const connection of diagram?.connections || [])
    {
        if (connection.kind !== 'family-child' || !connection.familyId
            || connection.route?.mode === 'manual' || connection.target?.port !== 'top'
            || !geneoConnectionEffectiveVisible(connection)) continue;
        const source = connection.source || {};
        const sourceKey = source.familyId ? `family:${source.familyId}` : `node:${source.nodeId}`;
        const style = geneoEffectiveConnectionStyle(connection, diagram);
        const styleKey = JSON.stringify([style.line?.color, style.line?.opacity,
            style.line?.enabled, style.width, style.pattern, style.cornerRadius]);
        const key = JSON.stringify([connection.familyId, sourceKey, source.port, styleKey]);
        if (!candidates.has(key)) candidates.set(key, []);
        candidates.get(key).push(connection);
    }
    const buses = [];
    const byConnection = new Map();
    for (const group of candidates.values())
    {
        if (group.length < 2) continue;
        const start = geneoConnectionPoint(group[0].source);
        const ends = new Map(group.map(connection =>
            [connection.id, geneoConnectionPoint(connection.target)]));
        const parentBottom = Math.max(start.y, ...geneoConnectionReferenceNodes(group[0].source)
            .map(node => node.y + node.height));
        const lowerBound = parentBottom + GENEO_GRID_SIZE;
        const upperBound = Math.min(...[...ends.values()].map(point => point.y)) - GENEO_GRID_SIZE;
        if (lowerBound > upperBound) continue;
        const savedRailY = group.find(connection => Number.isFinite(connection.route?.railY))?.route.railY;
        let railY = Math.max(lowerBound, Math.min(upperBound,
            savedRailY ?? (lowerBound + upperBound) / 2));
        if (diagram.canvas.snapToGrid)
        {
            const firstGridY = Math.ceil(lowerBound / GENEO_GRID_SIZE) * GENEO_GRID_SIZE;
            const lastGridY = Math.floor(upperBound / GENEO_GRID_SIZE) * GENEO_GRID_SIZE;
            if (firstGridY > lastGridY) continue;
            railY = Math.max(firstGridY, Math.min(lastGridY, snapGeneographCoordinate(railY)));
        }
        const childXs = [...ends.values()].map(point => point.x);
        const bus = {
            connectionIds: group.map(connection => connection.id),
            start, ends, railY, lowerBound, upperBound,
            minX: Math.min(start.x, ...childXs),
            maxX: Math.max(start.x, ...childXs),
            style: geneoEffectiveConnectionStyle(group[0], diagram)
        };
        buses.push(bus);
        bus.connectionIds.forEach(id => byConnection.set(id, bus));
    }
    return { buses, byConnection };
}

function geneoConnectionPoints(connection, busByConnection = null)
{
    const start = geneoConnectionPoint(connection.source);
    const end = geneoConnectionPoint(connection.target);
    if (connection.route?.mode === 'manual' && connection.route.waypoints?.length) return [start, ...connection.route.waypoints, end];
    if (connection.kind === 'family-child')
    {
        const bus = (busByConnection || geneoFamilyChildBusGroups().byConnection).get(connection.id);
        if (bus) return [start, { x: start.x, y: bus.railY },
            { x: end.x, y: bus.railY }, end];
    }
    if (connection.kind === 'family-sibling' && connection.source?.port === 'top' && connection.target?.port === 'top')
    {
        const routeY = snapGeneographCoordinate(Math.min(start.y, end.y) - GENEO_TOP_ROUTE_CLEARANCE);
        return [start, { x: start.x, y: routeY }, { x: end.x, y: routeY }, end];
    }
    if (Math.abs(start.x - end.x) < 4 || Math.abs(start.y - end.y) < 4) return [start, end];
    const vertical = ['top', 'bottom'].includes(connection.source?.port) || connection.source?.familyId;
    if (vertical)
    {
        const midY = Math.round((start.y + end.y) / 2); return [start, { x: start.x, y: midY }, { x: end.x, y: midY }, end];
    }
    const midX = Math.round((start.x + end.x) / 2); return [start, { x: midX, y: start.y }, { x: midX, y: end.y }, end];
}

function geneoPolylinePath(points)
{
    return points.map((point, index) => `${index ? 'L' : 'M'} ${Math.round(point.x)} ${Math.round(point.y)}`).join(' ');
}

function geneoConnectionCornerCut(points, index, radius)
{
    if (!radius || index <= 0 || index >= points.length - 1) return 0;
    const previous = points[index - 1];
    const current = points[index];
    const next = points[index + 1];
    const incoming = { x: previous.x - current.x, y: previous.y - current.y };
    const outgoing = { x: next.x - current.x, y: next.y - current.y };
    const incomingLength = Math.hypot(incoming.x, incoming.y);
    const outgoingLength = Math.hypot(outgoing.x, outgoing.y);
    if (!incomingLength || !outgoingLength
        || Math.abs(incoming.x * outgoing.y - incoming.y * outgoing.x)
            < incomingLength * outgoingLength * .001) return 0;
    return Math.min(radius, incomingLength / 2, outgoingLength / 2);
}

function geneoRoundedPolylinePath(points, radius = 0)
{
    if (!radius || points.length < 3) return geneoPolylinePath(points);
    const coordinate = value => Number(value.toFixed(2));
    const commands = [`M ${coordinate(points[0].x)} ${coordinate(points[0].y)}`];
    for (let index = 1; index < points.length - 1; index++)
    {
        const current = points[index];
        const cut = geneoConnectionCornerCut(points, index, radius);
        if (!cut)
        {
            commands.push(`L ${coordinate(current.x)} ${coordinate(current.y)}`);
            continue;
        }
        const previous = points[index - 1];
        const next = points[index + 1];
        const incomingLength = Math.hypot(previous.x - current.x, previous.y - current.y);
        const outgoingLength = Math.hypot(next.x - current.x, next.y - current.y);
        const before = {
            x: current.x + (previous.x - current.x) * cut / incomingLength,
            y: current.y + (previous.y - current.y) * cut / incomingLength
        };
        const after = {
            x: current.x + (next.x - current.x) * cut / outgoingLength,
            y: current.y + (next.y - current.y) * cut / outgoingLength
        };
        commands.push(`L ${coordinate(before.x)} ${coordinate(before.y)}`,
            `Q ${coordinate(current.x)} ${coordinate(current.y)} ${coordinate(after.x)} ${coordinate(after.y)}`);
    }
    const end = points.at(-1);
    commands.push(`L ${coordinate(end.x)} ${coordinate(end.y)}`);
    return commands.join(' ');
}

function geneoProjectedPointOnSegment(point, start, end)
{
    const horizontal = Math.abs(start.y - end.y) <= Math.abs(start.x - end.x);
    if (horizontal)
    {
        return {
            x: Math.max(Math.min(start.x, end.x), Math.min(Math.max(start.x, end.x), point.x)),
            y: start.y
        };
    }

    return {
        x: start.x,
        y: Math.max(Math.min(start.y, end.y), Math.min(Math.max(start.y, end.y), point.y))
    };
}

function geneoPointInsideRect(point, rect)
{
    return point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom;
}

function geneoSegmentOrientation(first, second, third)
{
    const value = (second.y - first.y) * (third.x - second.x) - (second.x - first.x) * (third.y - second.y);
    return Math.abs(value) < .001 ? 0 : value > 0 ? 1 : 2;
}

function geneoPointOnSegment(first, point, second)
{
    return point.x <= Math.max(first.x, second.x) + .001 && point.x >= Math.min(first.x, second.x) - .001
        && point.y <= Math.max(first.y, second.y) + .001 && point.y >= Math.min(first.y, second.y) - .001;
}

function geneoSegmentsIntersect(firstStart, firstEnd, secondStart, secondEnd)
{
    const firstA = geneoSegmentOrientation(firstStart, firstEnd, secondStart);
    const firstB = geneoSegmentOrientation(firstStart, firstEnd, secondEnd);
    const secondA = geneoSegmentOrientation(secondStart, secondEnd, firstStart);
    const secondB = geneoSegmentOrientation(secondStart, secondEnd, firstEnd);
    if (firstA !== firstB && secondA !== secondB) return true;
    if (firstA === 0 && geneoPointOnSegment(firstStart, secondStart, firstEnd)) return true;
    if (firstB === 0 && geneoPointOnSegment(firstStart, secondEnd, firstEnd)) return true;
    if (secondA === 0 && geneoPointOnSegment(secondStart, firstStart, secondEnd)) return true;
    return secondB === 0 && geneoPointOnSegment(secondStart, firstEnd, secondEnd);
}

function geneoConnectionIntersectsRect(connection, rect)
{
    if (!geneoConnectionEffectiveVisible(connection)) return false;
    const corners = [
        { x: rect.left, y: rect.top }, { x: rect.right, y: rect.top },
        { x: rect.right, y: rect.bottom }, { x: rect.left, y: rect.bottom }
    ];
    const edges = corners.map((corner, index) => [corner, corners[(index + 1) % corners.length]]);
    const points = geneoConnectionPoints(connection);
    return points.slice(0, -1).some((start, index) =>
    {
        const end = points[index + 1];
        return geneoPointInsideRect(start, rect) || geneoPointInsideRect(end, rect)
          || edges.some(([edgeStart, edgeEnd]) => geneoSegmentsIntersect(start, end, edgeStart, edgeEnd));
    });
}

function geneoDrawingWorldPoints(node)
{
    if (node?.type !== 'drawing') return [];
    return normalizeGeneographDrawingPoints(node.points).map(point => ({
        x: node.x + point.x * node.width,
        y: node.y + point.y * node.height
    }));
}

function geneoDrawingIntersectsRect(node, rect)
{
    const points = geneoDrawingWorldPoints(node);
    if (points.length < 2) return false;
    const corners = [
        { x: rect.left, y: rect.top },
        { x: rect.right, y: rect.top },
        { x: rect.right, y: rect.bottom },
        { x: rect.left, y: rect.bottom }
    ];
    const edges = corners.map((corner, index) => [corner, corners[(index + 1) % corners.length]]);
    return points.slice(0, -1).some((start, index) =>
    {
        const end = points[index + 1];
        return geneoPointInsideRect(start, rect)
          || geneoPointInsideRect(end, rect)
          || edges.some(([edgeStart, edgeEnd]) => geneoSegmentsIntersect(start, end, edgeStart, edgeEnd));
    });
}

function insertGeneographWaypoint(connectionId, point, requestedSegmentIndex = null)
{
    const connection = getGeneographConnection(connectionId);
    if (!connection || !point) return false;
    const points = geneoConnectionPoints(connection);
    if (points.length < 2) return false;
    let segmentIndex = Number.isInteger(requestedSegmentIndex) ? requestedSegmentIndex : 0;
    let insertionPoint = null;
    let bestDistance = Infinity;
    points.slice(0, -1).forEach((start, index) =>
    {
        if (Number.isInteger(requestedSegmentIndex) && index !== requestedSegmentIndex) return;
        const projected = geneoProjectedPointOnSegment(point, start, points[index + 1]);
        const distance = Math.hypot(projected.x - point.x, projected.y - point.y);
        if (distance < bestDistance)
        {
            bestDistance = distance;
            segmentIndex = index;
            insertionPoint = projected;
        }
    });
    if (!insertionPoint || points.some(existing => Math.hypot(existing.x - insertionPoint.x, existing.y - insertionPoint.y) < 3)) return false;
    insertionPoint = snapGeneographPoint(insertionPoint);
    if (points.some(existing => Math.hypot(existing.x - insertionPoint.x, existing.y - insertionPoint.y) < 3)) return false;
    const waypoints = connection.route?.mode === 'manual'
        ? connection.route.waypoints.map(existing => ({ ...existing }))
        : points.slice(1, -1).map(existing => snapGeneographPoint(existing));
    const insertAt = Math.max(0, Math.min(segmentIndex, waypoints.length));
    geneoPushHistory();
    waypoints.splice(insertAt, 0, insertionPoint);
    connection.route = { mode: 'manual', waypoints };
    touchGeneographBoard();
    selectGeneographConnection(connection.id, insertAt);
    renderGeneographEditorPreserveScroll();
    return true;
}

function geneoConnectionPreviewPoints(reference, end)
{
    const start = geneoConnectionPoint(reference);
    if (!end) return [start, start];
    if (Math.abs(start.x - end.x) < 4 || Math.abs(start.y - end.y) < 4) return [start, end];
    const vertical = ['top', 'bottom'].includes(reference?.port) || reference?.familyId;
    if (vertical) return [start, { x: start.x, y: end.y }, end];
    return [start, { x: end.x, y: start.y }, end];
}

