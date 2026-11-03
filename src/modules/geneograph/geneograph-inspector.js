function renderGeneographInspectorHeader(
    title,
    subtitle,
    iconHtml = '',
    node = null,
    entityType = 'node',
    extraActions = ''
)
{
    const hasIcon =
        Boolean(iconHtml);

    return `
        <div class="geneo-inspector-header">
          <button
            class="
              people-collapse-button
              people-sidebar-toggle-icon
            "
            type="button"
            data-geneo-inspector-toggle
            aria-label="Collapse inspector"
            aria-expanded="true">
            ${icon.doublechevronSidebar}
          </button>

          <div
            class="
              geneo-inspector-identity
              ${hasIcon ? 'has-icon' : ''}
            ">

            ${
                hasIcon
                    ? `
                  <span
                    class="geneo-layer-icon"
                    aria-hidden="true">
                    ${iconHtml}
                  </span>
                `
                    : ''
            }

            <div class="geneo-inspector-title">
              <h2 title="${escapeHtml(title)}" ${node ? 'data-geneo-header-name' : ''}>
                ${escapeHtml(title)}
              </h2>

              ${node ? `<input class="geneo-input geneo-inspector-name-input" type="text"
                maxlength="${GENEO_LAYER_NAME_LIMIT}"
                value="${escapeHtml(localizedDataFieldValue(normalizeGeneographLayerName(node.name) || title))}"
                data-geneo-header-name-input data-user-content aria-label="${escapeHtml(t('Layer name'))}"
                hidden>` : ''}

              <span title="${escapeHtml(subtitle)}">
                ${escapeHtml(subtitle)}
              </span>
            </div>
          </div>
          ${node ? `<div class="geneo-inspector-header-actions">
            <button type="button" data-geneo-header-rename aria-label="${escapeHtml(`${t('Rename layer')}: ${title}`)}" title="${escapeHtml(t('Rename layer'))}">${icon.edit}</button>
            ${entityType === 'node' ? `<button type="button" data-geneo-header-lock aria-label="${escapeHtml(`${t(node.locked ? 'Unlock layer' : 'Lock layer')}: ${title}`)}" title="${escapeHtml(t(node.locked ? 'Unlock layer' : 'Lock layer'))}" aria-pressed="${node.locked ? 'true' : 'false'}">${node.locked ? icon.lock : icon.unlock}</button>` : ''}
            <button type="button" data-geneo-header-visible aria-label="${escapeHtml(`${t(node.visible ? 'Hide layer' : 'Show layer')}: ${title}`)}" title="${escapeHtml(t(node.visible ? 'Hide layer' : 'Show layer'))}" aria-pressed="${node.visible ? 'true' : 'false'}">${node.visible ? icon.eye : icon.eyeOff}</button>
          </div>` : entityType === 'board' ? `<div class="geneo-inspector-header-actions">
            <button type="button" data-geneo-settings aria-label="${escapeHtml(t('Edit board'))}" title="${escapeHtml(t('Edit board'))}">${icon.edit}</button>
          </div>` : extraActions}
        </div>
      `;
}
function geneoPersonCardFieldLabels()
{
    return {
        photo:
          'Photo',

        dates:
          'Life dates',

        livingStatus:
          'Status',

        birthPlace:
          'Birth place',

        deathPlace:
          'Death place',

        maidenName:
          'Maiden surname',

        linkIndicator:
          'Family Tree link indicator'
    };
}

function geneoPersonCardControlOptions()
{
    return {
        style: [
            ['standard', 'Standard'],
            ['compact', 'Compact'],
            ['chart', 'Chart'],
            ['portrait', 'Portrait']
        ],

        nameFormat: [
            ['full', 'Full name'],
            [
                'first-last',
                'First + surname'
            ],
            [
                'surname-first',
                'Surname first'
            ]
        ],

        dateFormat: [
            ['full', 'Full dates'],
            ['years', 'Years only']
        ],

        photoSize: [
            ['small', 'Small'],
            ['medium', 'Medium'],
            ['large', 'Large']
        ],

        photoAlignment: [
            ['left', 'Left'],
            ['right', 'Right']
        ],

        alignment: [
            ['left', 'Left'],
            ['center', 'Center'],
            ['right', 'Right']
        ],

        nameAlignment: [
            ['left', 'Left'],
            ['center', 'Center'],
            ['right', 'Right']
        ]
    };
}

function renderGeneographPersonCardSelect({
    key,
    label,
    value,
    scope,
    node = null,
    disabled = false,
    help = ''
})
{
    const options =
        geneoPersonCardControlOptions()[
            key
        ] || [];

    const id =
        `geneo-person-card-${
            scope
        }-${
            node?.id || 'board'
        }-${key}`;

    return `
        <div class="geneo-field">
          <label
            for="${escapeHtml(id)}">
            ${escapeHtml(label)}
          </label>

          <select
            class="geneo-select"
            id="${escapeHtml(id)}"
            data-geneo-person-card-setting="${escapeHtml(
                key
            )}"
            data-geneo-person-card-scope="${escapeHtml(
                scope
            )}"
            ${
                node
                    ? `
                  data-geneo-person-card-node="${escapeHtml(
                        node.id
                    )}"
                `
                    : ''
            }
            ${
                disabled
                    ? `
                  disabled
                  aria-disabled="true"
                `
                    : ''
            }>
            ${options
                .map(
                    ([
                        optionValue,
                        optionLabel
                    ]) => `
                  <option
                    value="${escapeHtml(
                        optionValue
                    )}"
                    ${
                        optionValue === value
                            ? 'selected'
                            : ''
                    }>
                    ${escapeHtml(
                        optionLabel
                    )}
                  </option>
                `
                )
                .join('')}
          </select>

          ${
                help
                    ? `
                <span
                  class="geneo-selection-help">
                  ${escapeHtml(help)}
                </span>
              `
                    : ''
            }
        </div>
      `;
}

function renderGeneographPersonCardStylePicker({
    scope,
    node = null,
    settings,
    disabled = false
})
{
    const styles = [
        {
            id: 'standard',
            label: 'Standard',
            subtitle: 'Detailed facts'
        },
        {
            id: 'compact',
            label: 'Compact',
            subtitle: 'Compact text card'
        },
        {
            id: 'chart',
            label: 'Chart',
            subtitle: 'Photo-first timeline'
        },
        {
            id: 'portrait',
            label: 'Portrait',
            subtitle: 'Photo-first'
        }
    ];

    return `
        <div
          class="geneo-person-style-picker"
          role="group"
          aria-label="Person card style">
          ${styles
                .map(style => `
              <button
                class="
                  geneo-person-style-option
                  ${
                        settings.style
                    === style.id
                            ? 'active'
                            : ''
                    }
                "
                type="button"
                data-geneo-person-card-style="${escapeHtml(
                    style.id
                )}"
                data-geneo-person-card-scope="${escapeHtml(
                    scope
                )}"
                ${
                    node
                        ? `
                      data-geneo-person-card-node="${escapeHtml(
                            node.id
                        )}"
                    `
                        : ''
                }
                aria-pressed="${
                    settings.style
                  === style.id
                        ? 'true'
                        : 'false'
                }"
                ${
                    disabled
                        ? `
                      disabled
                      aria-disabled="true"
                    `
                        : ''
                }>
                <span
                  class="geneo-person-style-preview-stage"
                  aria-hidden="true">
                  <span
                    class="
                      geneo-person-style-preview
                      preview-${escapeHtml(
                            style.id
                        )}
                    ">
                    ${style.id === 'compact' ? '' : '<span class="preview-photo"></span>'}
                    <span class="preview-name"></span>
                    <span class="preview-maiden"></span>
                    <span class="preview-birth"></span>
                    <span class="preview-death"></span>
                  </span>
                </span>

                <span class="geneo-person-style-copy">
                  <strong>${escapeHtml(
                        style.label
                    )}</strong>
                  <span>${escapeHtml(
                        style.subtitle
                    )}</span>
                </span>
              </button>
            `)
                .join('')}
        </div>
      `;
}

function renderGeneographPersonCardControls({
    scope,
    node = null
})
{
    const boardSettings =
        normalizeGeneographPersonCardSettings(
            selectedGeneographDiagram()
                ?.personCardDefaults
        );

    const settings =
        node
            ? geneoPersonCardEffectiveSettings(
                node
            )
            : boardSettings;

    const labels =
        geneoPersonCardFieldLabels();

    const select =
        (
            key,
            label,
            help = '',
            dependentDisabled = false
        ) =>
            renderGeneographPersonCardSelect({
                key,
                label,
                help,
                value:
              settings[key],
                scope,
                node,
                disabled: dependentDisabled
            });

    return `
        <div
          class="geneo-person-card-controls"
          data-geneo-person-card-controls
          >

          <div
            class="geneo-person-card-control-group">
            <strong
              class="geneo-person-card-group-title">
              Card style
            </strong>

            ${renderGeneographPersonCardStylePicker({
                scope,
                node,
                settings,
                disabled: false
            })}
          </div>

          <div
            class="geneo-person-card-control-group">
            <strong
              class="geneo-person-card-group-title">
              Formatting
            </strong>

            <div
              class="geneo-person-card-setting-grid">
              ${select(
                    'nameFormat',
                    'Name format'
                )}

              ${select(
                    'dateFormat',
                    'Date format',
                    '',
                    !settings.fields.dates
                )}

              ${scope === 'node' && settings.style !== 'compact' ? select(
                    'photoSize',
                    'Photo size',
                    '',
                    !settings.fields.photo
                ) : ''}

              ${['standard', 'chart'].includes(settings.style)
                    ? select('photoAlignment', 'Photo alignment', '', !settings.fields.photo)
                    : ''}

              ${
                    settings.style === 'standard'
                        ? `${select('nameAlignment', 'Name alignment')}
                           ${select('alignment', 'Dates alignment')}`
                        : settings.style === 'chart'
                        ? select('alignment', 'Text alignment')
                        : `
                    <div class="geneo-field">
                      <span
                        class="geneo-field-label">
                        Text alignment
                      </span>

                      <span
                        class="geneo-selection-help">
                        Centered by this style
                      </span>
                    </div>
                  `
                }
            </div>

          </div>

          <div
            class="geneo-person-card-control-group">
            <strong
              class="geneo-person-card-group-title">
              Displayed information
            </strong>

            <div
              class="geneo-person-card-options">
              ${Object.entries(labels)
                    .filter(([field]) =>
                        (scope !== 'board' || field !== 'livingStatus')
                        && geneoPersonCardFieldSupported(settings.style, field))
                    .map(
                        ([
                            field,
                            label
                        ]) =>
                        {
                            return `
                    <label
                      class="geneo-check">
                      <input
                        type="checkbox"
                        data-geneo-person-card-field="${escapeHtml(
                            field
                        )}"
                        data-geneo-person-card-scope="${escapeHtml(
                            scope
                        )}"
                        ${
                            node
                                ? `
                              data-geneo-person-card-node="${escapeHtml(
                                    node.id
                                )}"
                            `
                                : ''
                        }
                        ${
                            settings.fields[
                                field
                            ]
                                ? 'checked'
                                : ''
                        }
                        >
                      ${escapeHtml(label)}
                    </label>
                  `;
                        }
                    )
                    .join('')}
            </div>
          </div>
        </div>
      `;
}

function geneoInspectorContextForNode(
    node
)
{
    const supportedContexts = new Set([
        'person',
        'text',
        'sticky',
        'image',
        'panel',
        'place',
        'shape',
        'drawing'
    ]);

    return supportedContexts.has(
        node?.type
    )
        ? node.type
        : 'node';
}

function geneoInspectorSectionIsOpen(
    context,
    id
)
{
    return state
        .geneoInspectorSections
        ?.[context]
        ?.[id] !== false;
}

function renderGeneographInspectorSection({
    context,
    id,
    title,
    content,
    meta = '',
    actionHtml = '',
    inlineAction = false
})
{
    const sectionKey =
        `${context}:${id}`;

    return renderInspectorSection(
        sectionKey,
        title,
        meta,
        content,
        actionHtml,
        {
            open:
            geneoInspectorSectionIsOpen(
                context,
                id
            ),

            toggleAttribute:
            'data-geneo-inspector-section',

            sectionId:
            `geneo-inspector-${context}-${id}`,
            inlineAction
        }
    );
}

function renderGeneographInspectorDangerAction(
    label
)
{
    return `
        <div class="geneo-inspector-danger">
          <button
            class="button danger"
            type="button"
            data-geneo-delete-selection>
            ${icon.trash}
            ${escapeHtml(label)}
          </button>
        </div>
      `;
}

function bindGeneographInspectorSectionToggles()
{
    if (
        main.dataset
            .geneoInspectorSectionToggleBound
        === 'true'
    )
    {
        return;
    }

    main.dataset
        .geneoInspectorSectionToggleBound =
            'true';

    main.addEventListener(
        'click',
        event =>
        {
            const button =
                event.target.closest?.(
                    '[data-geneo-inspector-section]'
                );

            if (
                !button
            || !main.contains(button)
            )
            {
                return;
            }

            const sectionKey =
                button.dataset
                    .geneoInspectorSection
            || '';

            const separatorIndex =
                sectionKey.indexOf(':');

            if (separatorIndex < 1)
            {
                return;
            }

            const context =
                sectionKey.slice(
                    0,
                    separatorIndex
                );

            const id =
                sectionKey.slice(
                    separatorIndex + 1
                );

            if (!context || !id)
            {
                return;
            }

            const section =
                button.closest(
                    '.panel-section'
                );

            const bodyId =
                button.getAttribute(
                    'aria-controls'
                );

            const body =
                bodyId && section
                    ? section.querySelector(
                        `#${CSS.escape(bodyId)}`
                    )
                    : null;

            if (!section || !body)
            {
                return;
            }

            const open =
                !geneoInspectorSectionIsOpen(
                    context,
                    id
                );

            if (
                !state.geneoInspectorSections[
                    context
                ]
            )
            {
                state.geneoInspectorSections[
                    context
                ] = {};
            }

            state.geneoInspectorSections[
                context
            ][id] = open;

            button.setAttribute(
                'aria-expanded',
                String(open)
            );

            section.classList.toggle(
                'is-open',
                open
            );

            body.hidden = !open;
        }
    );
}

function renderGeneographPersonCardSection(
    node
)
{
    return renderGeneographInspectorSection({
        context: 'person',
        id: 'card',
        title: 'Card layout',
        content:
          renderGeneographPersonCardControls({
              scope: 'node',
              node
          })
    });
}

function renderGeneoShadowControl(scope, enabled)
{
    return `<label class="geneo-check geneo-shadow-control">
      <input type="checkbox" data-geneo-shadow="${scope}" ${enabled === true ? 'checked' : ''}
        ${enabled === null ? 'data-mixed="true" aria-checked="mixed"' : ''}>
      <span>${escapeHtml(t('Shadow'))}${enabled === null ? ` · ${escapeHtml(t('Mixed'))}` : ''}
        ${scope === 'canvas' ? `<small class="geneo-check-help">${escapeHtml(t('Default for board objects. Individual settings can override it.'))}</small>` : ''}
      </span>
    </label>`;
}

function renderGeneoPersonAppearanceControls({ scope, id, appearance, radius })
{
    const boardDefault = scope === 'card-default';

    return `
      <div class="geneo-person-appearance-controls">
        ${['fill', 'stroke', 'text'].map(property => renderGeneoPaintControl({
            scope, id, property
        })).join('')}
        ${boardDefault ? '' : renderGeneoContrastWarning(getGeneographNode(id))}
        <div class="geneo-card-default-dimensions">
          <label class="geneo-field"><span class="geneo-setting-label">Stroke width</span>
            <input class="geneo-input" type="number" min="1" max="12" step="1"
              value="${appearance.strokeWidth}" ${boardDefault
                ? `data-geneo-card-default-stroke-width="${id}"`
                : 'data-geneo-stroke-width="node"'}>
          </label>
          <label class="geneo-field"><span class="geneo-setting-label">Stroke pattern</span>
            <span class="common-select-shell">
              <select class="common-select" ${boardDefault
                ? `data-geneo-card-default-stroke-pattern="${id}"`
                : 'data-geneo-stroke-pattern="node"'} ${appearance.stroke.enabled ? '' : 'disabled'}>
                <option value="solid" ${appearance.strokePattern === 'solid' ? 'selected' : ''}>Solid</option>
                <option value="dashed" ${appearance.strokePattern === 'dashed' ? 'selected' : ''}>Dashed</option>
              </select>
              <span class="common-select-chevron" aria-hidden="true">${icon.chevron}</span>
            </span>
          </label>
        </div>
        <div class="geneo-person-card-radius-row">
          <label class="geneo-field" for="geneoPersonCardRadius-${id}"><span class="geneo-setting-label">Corner radius</span>
            <span class="geneo-selection-help">0–32 px</span>
          </label>
          <input class="geneo-input" id="geneoPersonCardRadius-${id}"
            type="number" min="0" max="32" step="1" value="${radius}"
            ${boardDefault
                ? `data-geneo-card-default-radius="${id}"`
                : `data-geneo-person-card-radius="node" data-geneo-person-card-node="${escapeHtml(id)}"`}>
        </div>
        ${scope === 'node' ? renderGeneoShadowControl('node', geneoEffectiveNodeShadow(getGeneographNode(id), selectedGeneographDiagram(), appearance.fill)) : ''}
      </div>`;
}

function renderGeneoCardDefaultAppearance()
{
    const diagram = selectedGeneographDiagram();
    const colored = diagram.canvas.colorPersonCardsByGender;
    const genders = colored ? ['male', 'female', 'unknown'] : ['neutral'];
    return `
      <label class="geneo-check geneo-gender-color-toggle">
        <input type="checkbox" data-geneo-person-gender-colors ${colored ? 'checked' : ''}>
        <span>Color person cards by gender</span>
      </label>
      ${genders.map(gender => {
        const appearance = diagram.cardAppearanceDefaults[gender];
        return `<div class="geneo-card-default-group" role="group" aria-label="${escapeHtml(t(capitalize(gender)))}">
          ${colored ? `<h3>${escapeHtml(capitalize(gender))}</h3>` : ''}
          ${renderGeneoPersonAppearanceControls({
              scope: 'card-default', id: gender, appearance,
              radius: appearance.cornerRadius
          })}
        </div>`;
      }).join('')}`;
}

function renderGeneographInspector()
{
    if (state.geneoInspectorCollapsed)
    {
        return `
          <aside class="geneo-inspector collapsed">
            <button
              class="
                people-collapse-button
                person-sidebar-restore-button
                sidebar-toggle-icon
                sidebar-toggle-icon-restore
              "
              type="button"
              data-geneo-inspector-toggle
              aria-label="Open inspector"
              aria-expanded="false">
              ${icon.doublechevronSidebar}
            </button>
          </aside>
        `;
    }

    const selectedNodes =
        selectedGeneographNodes();

    const selectedConnections =
        selectedGeneographConnections();

    if (
        selectedNodes.length
        + selectedConnections.length
        > 1
    )
    {
        return renderGeneographMultiSelectionInspector(
            selectedNodes,
            selectedConnections
        );
    }

    const node =
        selectedGeneographNode();

    const connection =
        selectedGeneographConnection();

    if (connection)
    {
        return renderGeneographConnectionInspector(
            connection
        );
    }

    if (node)
    {
        return renderGeneographNodeInspector(
            node
        );
    }

    const board = selectedGeneographBoard();
    const canvas =
        selectedGeneographDiagram().canvas;
    const highlight = geneoCanvasRuntime.objectHighlight || 'none';
    const appearanceContent = `
        ${renderGeneoPaintControl({
            scope: 'canvas',
            property: 'background'
        })}
        ${renderGeneoShadowControl('canvas', canvas.shadowEnabled)}

        <div class="geneo-field">
          <span class="geneo-field-label">
            Background pattern
          </span>

          <div
            class="geneo-background-pattern"
            role="group"
            aria-label="Background pattern">
            ${['dots', 'grid', 'clear']
                .map(pattern =>
                {
                    const label =
                        pattern === 'clear'
                            ? 'No pattern'
                            : capitalize(pattern);

                    return `
                  <button
                    type="button"
                    data-geneo-background-pattern="${pattern}"
                    aria-pressed="${
                        canvas.backgroundPattern
                      === pattern
                    }">
                    <span class="geneo-pattern-preview pattern-${pattern}" style="background-color:${geneoPaintCssColor(canvas.backgroundPaint)}" aria-hidden="true"></span>
                    ${escapeHtml(
                        t(label)
                    )}
                  </button>
                `;
                })
                .join('')}
          </div>
        </div>

        <label class="geneo-check">
          <input
            type="checkbox"
            data-geneo-snap
            ${
                canvas.snapToGrid
                    ? 'checked'
                    : ''
            }>
          <span>Snap to grid
            <small class="geneo-check-help">Align objects to the canvas grid when moving them.</small>
          </span>
        </label>
        <label class="geneo-check">
          <input
            type="checkbox"
            data-geneo-sockets
            ${
                canvas.alwaysShowSockets
                    ? 'checked'
                    : ''
            }>
          <span>Always show sockets
            <small class="geneo-check-help">Show connection points on every object.</small>
          </span>
        </label>
        <div class="geneo-field">
          <label for="geneoObjectHighlight">Highlight objects</label>
          <div class="common-select-shell">
            <select class="common-select" id="geneoObjectHighlight" data-geneo-object-highlight>
              ${[
                  ['none', 'No highlight'], ['person', 'People'], ['linked', 'Linked people'],
                  ['unlinked', 'Unlinked people'], ['image', 'Images'], ['place', 'Places'],
                  ['sticky', 'Sticky notes'], ['text', 'Text'], ['shape', 'Shapes'],
                  ['drawing', 'Drawings'], ['panel', 'Panels']
              ].map(([value, label]) => `<option value="${value}" ${highlight === value ? 'selected' : ''}>${escapeHtml(t(label))}</option>`).join('')}
            </select>
            <span class="common-select-chevron" aria-hidden="true">${icon.chevron}</span>
          </div>
        </div>
      `;

    return `
        <aside class="geneo-inspector">
          <div class="geneo-inspector-body">
            ${renderGeneographInspectorHeader(
                board.title,
                t('Board appearance and behavior'),
                '',
                null,
                'board'
            )}

            ${renderGeneographInspectorSection({
                context: 'canvas',
                id: 'appearance',
                title: 'Canvas appearance',
                content: appearanceContent
            })}

            ${renderGeneographInspectorSection({
                context: 'canvas',
                id: 'cardAppearance',
                title: 'Default card appearance',
                content: renderGeneoCardDefaultAppearance()
            })}

            ${renderGeneographInspectorSection({
                context: 'canvas',
                id: 'personCards',
                title: 'Default card layout',
                content:
                renderGeneographPersonCardControls({
                    scope: 'board'
                })
            })}
            ${renderGeneographInspectorSection({
                context: 'canvas',
                id: 'connectionDefaults',
                title: 'Default connection appearance',
                content: renderGeneoConnectionStyleFields(selectedGeneographDiagram().connectionDefaults, 'default')
            })}
            <div class="geneo-canvas-reset">
              <button class="button secondary" type="button" data-geneo-reset-canvas-defaults>Reset defaults</button>
            </div>
          </div>
        </aside>
      `;
}

function geneoSharedPersonCardValue(
    nodes,
    getter
)
{
    if (!nodes.length)
    {
        return null;
    }

    const values =
        nodes.map(
            node =>
                getter(
                    geneoPersonCardEffectiveSettings(
                        node
                    )
                )
        );

    return values.every(
        value =>
            value === values[0]
    )
        ? values[0]
        : null;
}

function geneoSharedPersonPaintValue(nodes, property, field)
{
    if (!nodes.length) return null;
    const values = nodes.map(node =>
        geneoResolveVisibleNodeAppearance(node)?.[property]?.[field]);
    return values.every(value => value === values[0]) ? values[0] : null;
}

function renderGeneographPersonMultiAppearance(nodes)
{
    const visible = nodes.map(node => geneoResolveVisibleNodeAppearance(node));
    const shared = key => {
        const values = visible.map(appearance => appearance[key]);
        return values.every(value => value === values[0]) ? values[0] : null;
    };
    const paintRow = property => {
        const color = geneoSharedPersonPaintValue(nodes, property, 'color');
        const opacity = geneoSharedPersonPaintValue(nodes, property, 'opacity');
        const enabled = geneoSharedPersonPaintValue(nodes, property, 'enabled');
        const label = capitalize(property);
        return `<div class="geneo-paint-row geneo-person-multi-paint-row ${enabled === false ? 'is-none' : ''}"
          data-geneo-person-multi-paint-row="${property}" data-geneo-paint-scope="person-multi" data-geneo-paint-property="${property}">
          <div class="geneo-paint-row-heading">
            <span class="geneo-paint-heading-copy"><span class="geneo-paint-label">${escapeHtml(label)}</span>
              ${enabled === null ? `<span class="geneo-paint-state">${escapeHtml(t('Mixed'))}</span>` : ''}
              ${enabled === false ? `<span class="geneo-paint-state">${escapeHtml(t('None'))}</span>` : ''}
            </span>
            ${property === 'text' ? '' : `<button class="geneo-paint-action" type="button"
              data-geneo-person-multi-paint-toggle="${property}">${escapeHtml(t(enabled === false ? 'Restore' : 'Remove'))}</button>`}
          </div>
          <div class="geneo-paint-controls">
            <button class="geneo-paint-swatch geneo-multi-paint-swatch ${color === null ? 'is-mixed' : ''}"
              type="button" data-geneo-paint-open style="${geneoPaintSwatchStyle({ color: color || '#FFFFFF', opacity: opacity ?? 100, enabled: enabled ?? true })}"
              title="${escapeHtml(color === null ? t('Mixed') : color)}" aria-label="${escapeHtml(t(`${label} color`))}"
              aria-haspopup="dialog" aria-expanded="false" ${enabled === false ? 'disabled' : ''}><span aria-hidden="true"></span></button>
            <input class="geneo-paint-hex" type="text" maxlength="7" spellcheck="false"
              value="${color || ''}" placeholder="${escapeHtml(t('Mixed'))}"
              data-geneo-person-multi-paint-hex="${property}"
              aria-label="${escapeHtml(t(`${label} hex color`))}" ${enabled === false ? 'disabled' : ''}>
            <label class="geneo-paint-opacity-number">
              <input type="number" min="0" max="100" step="1" value="${opacity ?? ''}"
                placeholder="${escapeHtml(t('Mixed'))}"
                data-geneo-person-multi-paint-opacity="${property}"
                aria-label="${escapeHtml(t(`${label} opacity`))}" ${enabled === false ? 'disabled' : ''}>
              <span aria-hidden="true">%</span>
            </label>
          </div>
        </div>`;
    };
    const width = shared('strokeWidth');
    const pattern = shared('strokePattern');
    const radius = geneoSharedPersonCardValue(nodes, settings => settings.cornerRadius);
    return renderGeneographInspectorSection({
        context: 'multi', id: 'appearance', title: 'Card appearance',
        content: `<div class="geneo-person-appearance-controls">
          ${['fill', 'stroke', 'text'].map(paintRow).join('')}
          <div class="geneo-card-default-dimensions">
            <label class="geneo-field"><span class="geneo-setting-label">Stroke width</span>
              <input class="geneo-input" type="number" min="1" max="12" step="1"
                value="${width ?? ''}" placeholder="${escapeHtml(t('Mixed'))}"
                data-geneo-person-multi-appearance="strokeWidth">
            </label>
            <label class="geneo-field"><span class="geneo-setting-label">Stroke pattern</span>
              <span class="common-select-shell">
                <select class="common-select" data-geneo-person-multi-appearance="strokePattern"
                  ${visible.every(appearance => !appearance.stroke.enabled) ? 'disabled' : ''}>
                  ${pattern === null ? `<option value="" selected>${escapeHtml(t('Mixed'))}</option>` : ''}
                  <option value="solid" ${pattern === 'solid' ? 'selected' : ''}>Solid</option>
                  <option value="dashed" ${pattern === 'dashed' ? 'selected' : ''}>Dashed</option>
                </select>
                <span class="common-select-chevron" aria-hidden="true">${icon.chevron}</span>
              </span>
            </label>
          </div>
          <div class="geneo-person-card-radius-row">
            <label class="geneo-field" for="geneoPersonMultiRadius"><span class="geneo-setting-label">Corner radius</span>
              <span class="geneo-selection-help">0–32 px</span>
            </label>
            <input class="geneo-input" id="geneoPersonMultiRadius" type="number" min="0" max="32" step="1"
              value="${radius ?? ''}" placeholder="${escapeHtml(t('Mixed'))}"
              data-geneo-person-multi-appearance="cornerRadius">
          </div>
          ${renderGeneoShadowControl('person-multi', geneoSharedNodeShadow(nodes, selectedGeneographDiagram(), node => geneoResolveVisibleNodeAppearance(node).fill))}
        </div>
        <button class="button secondary geneo-apply-gender" type="button"
          data-geneo-person-multi-apply-gender>${escapeHtml(t('Apply gender color'))}</button>`
    });
}

function renderGeneographPersonMultiSelectionControls(
    nodes
)
{
    const options = geneoPersonCardControlOptions();
    const styles = nodes.map(node => geneoPersonCardEffectiveSettings(node).style);
    const style = geneoSharedPersonCardValue(nodes, settings => settings.style);
    const sharedSetting = key => geneoSharedPersonCardValue(nodes, settings => settings[key]);
    const select = (key, label, disabled = false) => {
        const value = sharedSetting(key);
        return `<div class="geneo-field"><label for="geneoMultiCard-${key}">${escapeHtml(label)}</label>
          <span class="common-select-shell"><select class="common-select" id="geneoMultiCard-${key}"
            data-geneo-person-multi-setting="${key}" ${disabled ? 'disabled' : ''}>
            ${value === null ? `<option value="" selected>${escapeHtml(t('Mixed'))}</option>` : ''}
            ${options[key].map(([optionValue, optionLabel]) =>
                `<option value="${optionValue}" ${value === optionValue ? 'selected' : ''}>${escapeHtml(optionLabel)}</option>`).join('')}
          </select><span class="common-select-chevron" aria-hidden="true">${icon.chevron}</span></span>
        </div>`;
    };
    const fields = Object.entries(geneoPersonCardFieldLabels())
        .filter(([field]) => styles.every(cardStyle => geneoPersonCardFieldSupported(cardStyle, field)))
        .map(([field, label]) => {
            const value = geneoSharedPersonCardValue(nodes, settings => settings.fields[field]);
            return `<label class="geneo-check"><input type="checkbox"
              data-geneo-person-multi-field="${field}" data-mixed="${value === null}"
              ${value === true ? 'checked' : ''}>${escapeHtml(label)}</label>`;
        }).join('');

    return renderGeneographInspectorSection({
        context: 'multi', id: 'personCards', title: 'Card layout',
        content: `<div class="geneo-person-card-controls">
          <div class="geneo-person-card-control-group">
            <strong class="geneo-person-card-group-title">Card style</strong>
            ${renderGeneographPersonCardStylePicker({ scope: 'multi', settings: { style } })}
            ${style === null ? `<span class="geneo-selection-help">${escapeHtml(t('Mixed'))}</span>` : ''}
          </div>
          <div class="geneo-person-card-control-group">
            <strong class="geneo-person-card-group-title">Formatting</strong>
            <div class="geneo-person-card-setting-grid">
              ${select('nameFormat', 'Name format')}
              ${select('dateFormat', 'Date format', nodes.every(node => !geneoPersonCardEffectiveSettings(node).fields.dates))}
              ${styles.every(cardStyle => cardStyle !== 'compact')
                  ? select('photoSize', 'Photo size', nodes.every(node => !geneoPersonCardEffectiveSettings(node).fields.photo)) : ''}
              ${styles.every(cardStyle => ['standard', 'chart'].includes(cardStyle))
                  ? select('photoAlignment', 'Photo alignment', nodes.every(node => !geneoPersonCardEffectiveSettings(node).fields.photo)) : ''}
              ${style === 'standard' ? `${select('nameAlignment', 'Name alignment')}${select('alignment', 'Dates alignment')}` : ''}
              ${style === 'chart' ? select('alignment', 'Text alignment') : ''}
              ${['compact', 'portrait'].includes(style) ? `<div class="geneo-field"><span class="geneo-field-label">Text alignment</span><span class="geneo-selection-help">Centered by this style</span></div>` : ''}
            </div>
          </div>
          <div class="geneo-person-card-control-group">
            <strong class="geneo-person-card-group-title">Displayed information</strong>
            <div class="geneo-person-card-options">${fields}</div>
          </div>
        </div>`
    });
}

function geneoSharedConnectionValue(connections, getter)
{
    if (!connections.length) return null;
    const values = connections.map(getter);
    return values.every(value => value === values[0]) ? values[0] : null;
}

function geneoCommitMultiConnectionAppearance(key, value)
{
    const connections = selectedGeneographConnections();
    const diagram = selectedGeneographDiagram();
    if (!diagram || !connections.length) return;
    const eligible = key === 'arrows' ? connections.every(connection => connection.kind === 'visual')
        : key === 'showRelationshipDates' ? connections.every(connection => connection.kind === 'family-partner') : true;
    if (!eligible || connections.every(connection =>
        (key === 'showRelationshipDates' ? geneoEffectiveShowRelationshipDates(connection)
            : geneoEffectiveConnectionStyle(connection)[key]) === value)) return;
    geneoPushHistory();
    connections.forEach(connection =>
    {
        if (key === 'showRelationshipDates')
        {
            if (value === diagram.connectionDefaults.showRelationshipDates) delete connection.showRelationshipDates;
            else connection.showRelationshipDates = value;
        }
        else
        {
            connection.style ||= {};
            if (value === diagram.connectionDefaults[key]) delete connection.style[key];
            else connection.style[key] = value;
        }
    });
    touchGeneographBoard();
    renderGeneographEditorPreserveScroll({ preserveInspectorScroll: true, preserveSidebarScroll: true });
}

function geneoCommitMultiConnectionPaint(field, value)
{
    const connections = selectedGeneographConnections();
    const diagram = selectedGeneographDiagram();
    if (!diagram || !connections.length) return;
    if (connections.every(connection => geneoEffectiveConnectionStyle(connection).line[field] === value)) return;
    geneoPushHistory();
    connections.forEach(connection =>
    {
        const line = { ...geneoEffectiveConnectionStyle(connection).line, [field]: value };
        connection.style ||= {};
        if (['color', 'opacity', 'enabled'].every(key => line[key] === diagram.connectionDefaults.line[key])) delete connection.style.line;
        else connection.style.line = line;
    });
    touchGeneographBoard();
    renderGeneographEditorPreserveScroll({ preserveInspectorScroll: true, preserveSidebarScroll: true });
}

function renderGeneographMultiConnectionAppearance(connections, mixed = false)
{
    const shared = getter => geneoSharedConnectionValue(connections, getter);
    const styleValue = key => shared(connection => geneoEffectiveConnectionStyle(connection)[key]);
    const pattern = styleValue('pattern');
    const width = styleValue('width');
    const radius = styleValue('cornerRadius');
    const color = shared(connection => geneoEffectiveConnectionStyle(connection).line.color);
    const opacity = shared(connection => geneoEffectiveConnectionStyle(connection).line.opacity);
    const enabled = shared(connection => geneoEffectiveConnectionStyle(connection).line.enabled);
    const visualOnly = connections.every(connection => connection.kind === 'visual');
    const partnerOnly = connections.every(connection => connection.kind === 'family-partner');
    const arrows = visualOnly ? styleValue('arrows') : null;
    const dates = partnerOnly ? shared(connection => geneoEffectiveShowRelationshipDates(connection)) : null;
    return renderGeneographInspectorSection({
        context: 'multi', id: mixed ? 'connectionAppearance' : 'appearance', title: 'Appearance',
        content: `<div class="geneo-connection-style-fields" data-geneo-connection-fields="multi">
          <div class="geneo-field"><span class="geneo-setting-label">${escapeHtml(t('Pattern'))}</span>
            <button type="button" class="geneo-connection-default-pattern" data-geneo-connection-multi-pattern
              aria-label="${escapeHtml(`${t('Pattern')}: ${pattern ? t(GENEO_CONNECTION_PATTERN_LABELS[pattern]) : t('Mixed')}`)}"
              aria-haspopup="menu" aria-expanded="false">${pattern ? renderGeneoConnectionLineSample(pattern) : escapeHtml(t('Mixed'))}${icon.chevron}</button>
          </div>
          <label class="geneo-field"><span class="geneo-setting-label">${escapeHtml(t('Width'))}</span>
            <span class="geneo-number-unit"><input class="geneo-input" type="number" min="1" max="12" step="1"
              value="${width ?? ''}" placeholder="${escapeHtml(t('Mixed'))}" data-geneo-connection-multi-width><span aria-hidden="true">px</span></span>
          </label>
          <div class="geneo-paint-row geneo-person-multi-paint-row ${enabled === false ? 'is-none' : ''}" data-geneo-connection-multi-paint-row data-geneo-paint-scope="connection-multi" data-geneo-paint-property="line">
            <div class="geneo-paint-row-heading"><span class="geneo-paint-heading-copy"><span class="geneo-paint-label">${escapeHtml(t('Connection color'))}</span>
              ${enabled === null ? `<span class="geneo-paint-state">${escapeHtml(t('Mixed'))}</span>` : ''}
              ${enabled === false ? `<span class="geneo-paint-state">${escapeHtml(t('None'))}</span>` : ''}</span>
              <button class="geneo-paint-action" type="button" data-geneo-connection-multi-paint-toggle>${escapeHtml(t(enabled === false ? 'Restore' : 'Remove'))}</button></div>
            <div class="geneo-paint-controls">
              <button class="geneo-paint-swatch geneo-multi-paint-swatch ${color === null ? 'is-mixed' : ''}" type="button"
                data-geneo-paint-open style="${geneoPaintSwatchStyle({ color: color || '#D9E5E1', opacity: opacity ?? 100, enabled: enabled ?? true })}"
                title="${escapeHtml(color ?? t('Mixed'))}" aria-label="${escapeHtml(t('Connection color'))}"
                aria-haspopup="dialog" aria-expanded="false"><span aria-hidden="true"></span></button>
              <input class="geneo-paint-hex" type="text" maxlength="7" spellcheck="false" value="${color || ''}"
                placeholder="${escapeHtml(t('Mixed'))}" data-geneo-connection-multi-hex aria-label="${escapeHtml(t('Connection color'))}">
              <label class="geneo-paint-opacity-number"><input type="number" min="0" max="100" step="1"
                value="${opacity ?? ''}" placeholder="${escapeHtml(t('Mixed'))}" data-geneo-connection-multi-opacity
                aria-label="${escapeHtml(t('Line opacity'))}"><span aria-hidden="true">%</span></label>
            </div>
          </div>
          ${visualOnly ? `<fieldset class="geneo-connection-arrows"><legend class="geneo-setting-label">${escapeHtml(t('Arrowheads'))}</legend>
            <div class="geneo-connection-arrow-options">${GENEO_CONNECTION_ARROWS.map(value => `<label><input type="radio" name="geneo-multi-arrows" value="${value}" data-geneo-connection-multi-arrows ${arrows === value ? 'checked' : ''}><span>${escapeHtml(t(capitalize(value)))}</span></label>`).join('')}</div></fieldset>` : ''}
          <div class="geneo-person-card-radius-row geneo-connection-radius-row"><label class="geneo-field" for="geneoConnectionMultiRadius">
            <span class="geneo-setting-label">${escapeHtml(t('Corner radius'))}</span><span class="geneo-selection-help">0–32 px</span></label>
            <input class="geneo-input" id="geneoConnectionMultiRadius" type="number" min="0" max="32" step="1"
              value="${radius ?? ''}" placeholder="${escapeHtml(t('Mixed'))}" data-geneo-connection-multi-radius></div>
        </div>
        ${partnerOnly ? `<label class="geneo-check geneo-connection-date-default"><input type="checkbox" data-geneo-connection-multi-dates ${dates === true ? 'checked' : ''} data-mixed="${dates === null}"><span>${escapeHtml(t('Show relationship date on board'))}</span></label>` : ''}`
    });
}

function geneoBulkNodeSupports(node, property)
{
    if (property === 'fontSize') return ['text', 'sticky', 'place'].includes(node.type);
    if (property === 'fill') return !['image', 'drawing'].includes(node.type);
    if (property === 'text') return !['image', 'shape', 'drawing'].includes(node.type);
    if (property === 'cornerRadius') return node.type !== 'drawing'
        && (node.type !== 'shape' || normalizeGeneographShapeKind(node.shapeKind) !== 'ellipse');
    return true;
}

function geneoBulkNodeValue(node, property, field = '')
{
    if (property === 'cornerRadius') return node.type === 'person'
        ? geneoPersonCardEffectiveSettings(node).cornerRadius : node.appearance.cornerRadius;
    const appearance = node.type === 'person' ? geneoResolveVisibleNodeAppearance(node) : node.appearance;
    return field ? appearance[property][field] : appearance[property];
}

function geneoBulkNodeAppearanceIsDefault(node)
{
    if (node.type !== 'person') return !geneoNodeAppearanceIsDefault(node);
    const appearance = node.appearance || {};
    return ['fill', 'stroke', 'text'].some(key => appearance.paintOverrides?.[key] === true)
        || ['strokeWidth', 'strokePattern'].some(key => appearance.styleOverrides?.[key] === true)
        || appearance.shadowEnabled !== null
        || normalizeGeneographPersonCardOverrides(node.personCard).cornerRadius != null;
}

function renderGeneographGenericMultiAppearance(nodes)
{
    const shared = (property, field = '') => geneoSharedConnectionValue(nodes,
        node => geneoBulkNodeValue(node, property, field));
    const paintRow = property =>
    {
        if (!nodes.every(node => geneoBulkNodeSupports(node, property))) return '';
        const color = shared(property, 'color');
        const opacity = shared(property, 'opacity');
        const enabled = shared(property, 'enabled');
        const label = t(capitalize(property));
        return `<div class="geneo-paint-row geneo-person-multi-paint-row ${enabled === false ? 'is-none' : ''}" data-geneo-paint-scope="node-multi" data-geneo-paint-property="${property}">
          <div class="geneo-paint-row-heading"><span class="geneo-paint-heading-copy"><span class="geneo-paint-label">${escapeHtml(label)}</span>
            ${enabled === null ? `<span class="geneo-paint-state">${escapeHtml(t('Mixed'))}</span>` : ''}
            ${enabled === false ? `<span class="geneo-paint-state">${escapeHtml(t('None'))}</span>` : ''}</span>
            ${property !== 'text' ? `<button class="geneo-paint-action" type="button" data-geneo-bulk-paint-toggle="${property}">${escapeHtml(t(enabled === false ? 'Restore' : 'Remove'))}</button>` : ''}</div>
          <div class="geneo-paint-controls"><button class="geneo-paint-swatch geneo-multi-paint-swatch ${color === null ? 'is-mixed' : ''}" type="button"
            data-geneo-paint-open style="${geneoPaintSwatchStyle({ color: color || '#FFFFFF', opacity: opacity ?? 100, enabled: enabled ?? true })}"
            title="${escapeHtml(color || t('Mixed'))}" aria-label="${escapeHtml(t(`${capitalize(property)} color`))}"
            aria-haspopup="dialog" aria-expanded="false"><span aria-hidden="true"></span></button>
            <input class="geneo-paint-hex" type="text" maxlength="7" spellcheck="false" value="${color || ''}" placeholder="${escapeHtml(t('Mixed'))}"
              data-geneo-bulk-paint-hex="${property}" aria-label="${escapeHtml(t(`${capitalize(property)} hex color`))}">
            <label class="geneo-paint-opacity-number"><input type="number" min="0" max="100" step="1" value="${opacity ?? ''}"
              placeholder="${escapeHtml(t('Mixed'))}" data-geneo-bulk-paint-opacity="${property}" aria-label="${escapeHtml(t(`${capitalize(property)} opacity`))}"><span aria-hidden="true">%</span></label>
          </div></div>`;
    };
    const width = shared('strokeWidth');
    const pattern = shared('strokePattern');
    const radiusSupported = nodes.every(node => geneoBulkNodeSupports(node, 'cornerRadius'));
    const radius = radiusSupported ? shared('cornerRadius') : null;
    const fontSizeSupported = nodes.every(node => geneoBulkNodeSupports(node, 'fontSize'));
    const fontSize = fontSizeSupported ? shared('fontSize') : null;
    const shapesOnly = nodes.every(node => node.type === 'shape');
    const shapeKind = shapesOnly ? geneoSharedConnectionValue(nodes, node => normalizeGeneographShapeKind(node.shapeKind)) : null;
    return renderGeneographInspectorSection({
        context: 'multi', id: 'appearance', title: 'Appearance',
        content: `<div class="geneo-person-appearance-controls geneo-bulk-node-appearance">
          ${['fill', 'stroke', 'text'].map(paintRow).join('')}
          <div class="geneo-card-default-dimensions">
            <label class="geneo-field"><span class="geneo-setting-label">${escapeHtml(t('Stroke width'))}</span>
              <input class="geneo-input" type="number" min="1" max="12" step="1" value="${width ?? ''}"
                placeholder="${escapeHtml(t('Mixed'))}" data-geneo-bulk-appearance="strokeWidth"></label>
            <label class="geneo-field"><span class="geneo-setting-label">${escapeHtml(t('Stroke pattern'))}</span>
              <span class="common-select-shell"><select class="common-select" data-geneo-bulk-appearance="strokePattern">
                ${pattern === null ? `<option value="" selected>${escapeHtml(t('Mixed'))}</option>` : ''}
                <option value="solid" ${pattern === 'solid' ? 'selected' : ''}>${escapeHtml(t('Solid'))}</option>
                <option value="dashed" ${pattern === 'dashed' ? 'selected' : ''}>${escapeHtml(t('Dashed'))}</option>
              </select><span class="common-select-chevron" aria-hidden="true">${icon.chevron}</span></span></label>
          </div>
          ${radiusSupported ? `<div class="geneo-person-card-radius-row"><label class="geneo-field" for="geneoBulkNodeRadius">
            <span class="geneo-setting-label">${escapeHtml(t('Corner radius'))}</span><span class="geneo-selection-help">0–32 px</span></label>
            <input class="geneo-input" id="geneoBulkNodeRadius" type="number" min="0" max="32" step="1" value="${radius ?? ''}"
              placeholder="${escapeHtml(t('Mixed'))}" data-geneo-bulk-appearance="cornerRadius"></div>` : ''}
          ${fontSizeSupported ? `<div class="geneo-person-card-radius-row"><label class="geneo-field" for="geneoBulkNodeFontSize">
            <span class="geneo-setting-label">${escapeHtml(t('Font size'))}</span><span class="geneo-selection-help">8–72 px</span></label>
            <input class="geneo-input" id="geneoBulkNodeFontSize" type="number" min="8" max="72" step="1" value="${fontSize ?? ''}"
              placeholder="${escapeHtml(t('Mixed'))}" data-geneo-bulk-appearance="fontSize"></div>` : ''}
          ${shapesOnly ? `<label class="geneo-field"><span class="geneo-setting-label">${escapeHtml(t('Shape type'))}</span>
            <span class="common-select-shell"><select class="common-select" data-geneo-bulk-shape-kind>
              ${shapeKind === null ? `<option value="" selected>${escapeHtml(t('Mixed'))}</option>` : ''}
              ${GENEO_SHAPE_KINDS.map(shape => `<option value="${shape.id}" ${shapeKind === shape.id ? 'selected' : ''}>${escapeHtml(t(shape.label))}</option>`).join('')}
            </select><span class="common-select-chevron" aria-hidden="true">${icon.chevron}</span></span></label>` : ''}
          ${renderGeneoShadowControl('bulk', geneoSharedNodeShadow(nodes, selectedGeneographDiagram(), node => node.type === 'person' ? geneoResolveVisibleNodeAppearance(node).fill : node.appearance.fill))}
        </div>`
    });
}

function geneoBulkArrangeRoots(nodes)
{
    const selectedIds = new Set(nodes.map(node => node.id));
    return nodes.filter(node => !geneoNodeHasSelectedAncestor(node, selectedIds)
        && !geneoNodeEffectiveLocked(node));
}

function renderGeneographBulkArrange(nodes, mixed = false)
{
    const roots = geneoBulkArrangeRoots(nodes);
    if (roots.length < 2) return '';
    const command = (value, label, iconHtml, disabled = false) => `<button class="geneo-bulk-arrange-button" type="button"
        data-geneo-bulk-arrange="${value}" aria-label="${escapeHtml(t(label))}" title="${escapeHtml(t(label))}"
        ${disabled ? 'disabled' : ''}>${iconHtml}</button>`;
    return renderGeneographInspectorSection({
        context: 'multi', id: 'arrange', title: mixed ? 'Arrange objects' : 'Arrange',
        content: `<div class="geneo-bulk-arrange-layout"><div class="geneo-bulk-arrange-group"><span class="geneo-setting-label">${escapeHtml(t('Align'))}</span>
            <div class="geneo-bulk-command-row" role="group" aria-label="${escapeHtml(t('Align'))}">
              <div class="geneo-bulk-command-strip">${[
                ['left', 'Align left', icon.alignStartVertical], ['centerX', 'Align horizontal centers', icon.alignCenterVertical],
                ['right', 'Align right', icon.alignEndVertical]
              ].map(([value, label, iconHtml]) => command(value, label, iconHtml)).join('')}</div>
              <div class="geneo-bulk-command-strip">${[
                ['top', 'Align top', icon.alignStartHorizontal], ['centerY', 'Align vertical centers', icon.alignCenterHorizontal],
                ['bottom', 'Align bottom', icon.alignEndHorizontal]
              ].map(([value, label, iconHtml]) => command(value, label, iconHtml)).join('')}</div>
            </div></div>
          <div class="geneo-bulk-arrange-group"><span class="geneo-setting-label">${escapeHtml(t('Distribute'))}</span>
            <div class="geneo-bulk-command-strip" role="group" aria-label="${escapeHtml(t('Distribute'))}">
              ${command('distributeX', 'Distribute horizontally', icon.alignHorizontalSpaceBetween)}
              ${command('distributeY', 'Distribute vertically', icon.alignVerticalSpaceBetween)}</div></div></div>`
    });
}

function renderGeneographBulkActions(nodes, connections)
{
    const targets = geneoObjectGroupNodes(nodes.map(node => node.id));
    const selected = [...targets, ...connections];
    const allVisible = selected.every(item => item.visible !== false);
    const allUnlocked = targets.length && targets.every(node => !node.locked);
    const visibleAction = allVisible ? 'hide' : 'show';
    const lockAction = allUnlocked ? 'lock' : 'unlock';
    const button = (action, label, iconHtml) => `<button type="button" data-geneo-bulk-action="${action}"
        aria-label="${escapeHtml(t(label))}" title="${escapeHtml(t(label))}">${iconHtml}</button>`;
    return `<div class="geneo-inspector-header-actions geneo-bulk-header-actions">
      ${!nodes.length ? '' : button(lockAction, connections.length
        ? (lockAction === 'lock' ? 'Lock selected objects' : 'Unlock selected objects')
        : (lockAction === 'lock' ? 'Lock selected' : 'Unlock selected'), lockAction === 'lock' ? icon.unlock : icon.lock)}
      ${button(visibleAction, visibleAction === 'show' ? 'Show selected' : 'Hide selected', visibleAction === 'show' ? icon.eyeOff : icon.eye)}
    </div>`;
}

function renderGeneographMultiSelectionInspector(
    nodes,
    connections = []
)
{
    const labels = [
        ...nodes.map(
            geneoNodeTitle
        ),

        ...connections.map(
            geneoConnectionLabel
        )
    ];

    const mixed = Boolean(nodes.length && connections.length);
    const selectionGroup = (title, names) => `<div class="geneo-selection-group">
        <strong class="geneo-setting-label">${escapeHtml(t(title))} (${names.length})</strong>
        <ul class="geneo-selection-list">${names.slice(0, 6).map(name => `<li>${escapeHtml(name)}</li>`).join('')}</ul>
        ${names.length > 6 ? `<p class="geneo-selection-more">${escapeHtml(t('and {count} more').replace('{count}', names.length - 6))}</p>` : ''}
      </div>`;

    const peopleOnly =
        nodes.length > 0
        && nodes.every(
            node =>
                node.type === 'person'
        );
    const selectionContent = `
        ${nodes.length ? selectionGroup('Objects', nodes.map(geneoNodeTitle)) : ''}
        ${connections.length ? selectionGroup('Connections', connections.map(geneoConnectionLabel)) : ''}
        <p class="geneo-selection-help">
          ${escapeHtml(t('Drag a selected object or connector to move the selection.'))}
        </p>
      `;
    const objectSettings = nodes.length ? `
        ${renderGeneographBulkArrange(nodes, mixed)}
        ${peopleOnly ? `${renderGeneographPersonMultiAppearance(nodes)}
            ${renderGeneographPersonMultiSelectionControls(nodes)}
            <div class="geneo-inspector-reset"><button class="button secondary" type="button"
              data-geneo-person-multi-reset ${nodes.some(geneoPersonHasResettableSettings) ? '' : 'disabled'}>${escapeHtml(t('Reset to default'))}</button></div>`
            : `${renderGeneographGenericMultiAppearance(nodes)}
              <div class="geneo-inspector-reset"><button class="button secondary" type="button"
                data-geneo-bulk-node-reset ${nodes.some(geneoBulkNodeAppearanceIsDefault) ? '' : 'disabled'}>${escapeHtml(t('Reset to default'))}</button></div>`}
      ` : '';
    const connectionSettings = connections.length ? `${renderGeneographMultiConnectionAppearance(connections, mixed)}
        <div class="geneo-inspector-reset"><button class="button secondary" type="button"
          data-geneo-connection-multi-reset-default ${connections.some(connection => Object.keys(connection.style || {}).length || connection.showRelationshipDates !== undefined) ? '' : 'disabled'}>${escapeHtml(t('Reset to default'))}</button></div>` : '';
    const scope = (title, count, content) => `<div class="geneo-mixed-selection-scope">
        <h3 class="geneo-mixed-selection-scope-title">${escapeHtml(t(title))} (${count})</h3>${content}
      </div>`;

    return `
        <aside class="geneo-inspector">
          <div class="geneo-inspector-body">
            ${renderGeneographInspectorHeader(
                t('{count} items selected').replace('{count}', labels.length),
                'Multiple selection',
                icon.cursorSelect,
                null,
                'node',
                renderGeneographBulkActions(nodes, connections)
            )}

            ${renderGeneographInspectorSection({
                context: 'multi',
                id: 'selection',
                title: 'Selection',
                content: selectionContent
            })}

            ${mixed ? scope('Objects', nodes.length, objectSettings) + scope('Connections', connections.length, connectionSettings)
                : objectSettings + connectionSettings}

            ${renderGeneographInspectorDangerAction(
                'Delete selected'
            )}
          </div>
        </aside>
      `;
}

function renderGeneographPersonInspectorContent(
    person,
    node
)
{
    const birthPlace =
        geneoPersonPlaceLabel(
            person?.birth
        );

    const deathPlace =
        person?.livingStatus
        === 'Deceased'
            ? geneoPersonPlaceLabel(
                person?.death
            )
            : '';

    const maiden =
        person?.gender === 'female'
            ? String(
                person?.names?.maiden
              || ''
            ).trim()
            : '';

    const details = [
        birthPlace
            ? [
                'Birth place',
                birthPlace
            ]
            : null,

        deathPlace
            ? [
                'Death place',
                deathPlace
            ]
            : null
    ].filter(Boolean);

    const avatar = geneoPersonAvatarModel(person);
    const subtitle = [t(capitalize(person?.gender || 'unknown')), t(person?.livingStatus || 'Unknown')].join(' · ');
    return `
        <div class="geneo-person-inspector-hero${details.length ? ' has-places' : ''}">
          ${renderPersonAvatar(avatar, 'geneo-inspector-person-avatar', {
            preferCrop: avatar.hasBoardPhoto,
            faceRegionOverride: avatar.photoRegion,
            overlayHtml: renderGeneographAvatarAction(node, person, 'inspector')
        })}
          <div class="geneo-person-inspector-identity">
            <div class="geneo-person-inspector-name" title="${escapeHtml(maiden ? `${geneoPersonDisplayName(person)} (${maiden})` : geneoPersonDisplayName(person))}">
              <strong>${escapeHtml(geneoPersonDisplayName(person))}</strong>${maiden ? ` <span class="geneo-person-inspector-maiden">(${escapeHtml(maiden)})</span>` : ''}
            </div>
            <span>${escapeHtml(subtitle)}</span>
            <span>${escapeHtml(geneoPersonLifeDates(person))}</span>
          </div>
        </div>
        ${details.length ? `<dl class="geneo-person-summary">
          ${details
                .map(
                    ([
                        label,
                        value
                    ]) => `
                <div>
                  <dt>
                    ${escapeHtml(label)}
                  </dt>

                  <dd>
                    ${escapeHtml(value)}
                  </dd>
                </div>
              `
                )
                .join('')}
        </dl>` : ''}
      `;
}

function renderGeneographPersonTreeLinkSection(
    person
)
{
    const linkedPerson =
        person?.treePersonId
            ? getPerson(
                person.treePersonId
            )
            : null;
    const validLink = linkedPerson && !linkedPerson.deleted && linkedPerson.projectId === currentProjectId();

    const content =
        validLink
            ? (() =>
            {
                const name =
                    personDisplayName(
                        linkedPerson.id
                    );

                const birth =
                    relationBirthMeta(
                        linkedPerson
                    );

                const meta = [
                    'Family Tree person',

                    birth
                        ? `Born ${birth}`
                        : 'Dates unknown'
                ].join(' · ');

                return `
                <div
                  class="
                    relation-row
                    geneo-tree-link-row
                  ">
                  <div
                    class="
                      relation-row-main
                      geneo-tree-link-person-main
                    ">

                    ${renderPersonAvatar(
                    linkedPerson,
                    'small-avatar',
                    {
                        element: 'span'
                    }
                )}

                    <span class="relation-row-copy">
                      <strong
                        title="${escapeHtml(name)}">
                        ${escapeHtml(name)}
                      </strong>

                      <span
                        title="${escapeHtml(meta)}">
                        ${escapeHtml(meta)}
                      </span>
                    </span>
                  </div>

                  <div
                    class="relation-actions"
                    aria-label="Family Tree link actions">

                    <button
                      class="relation-action-button"
                      type="button"
                      data-geneo-link-person
                      aria-label="${escapeHtml(
                    `Change Family Tree link for ${name}`
                )}"
                      title="Change link">
                      ${icon.edit}
                    </button>

                    <button
                      class="
                        relation-action-button
                        danger
                      "
                      type="button"
                      data-geneo-unlink-person
                      aria-label="${escapeHtml(
                    `Unlink ${name} from this board person`
                )}"
                      title="Unlink">
                      ${icon.unlink}
                    </button>
                  </div>
                </div>
              `;
            })()
            : person?.treePersonId ? `<div class="relation-row geneo-tree-link-row is-warning"><button class="relation-row-main" type="button" data-geneo-link-person><span class="geneo-tree-link-warning-icon" aria-hidden="true">${icon.warning}</span><span class="relation-row-copy"><strong>Link needs attention</strong><span>Tree person is unavailable. Choose another match.</span></span></button></div>` : `
            <div
              class="
                relation-row
                geneo-tree-link-row
              ">
              <button
                class="relation-row-main"
                type="button"
                data-geneo-link-person
                aria-label="Link this board person to Family Tree">

                <span
                  class="geneo-tree-link-warning-icon"
                  aria-hidden="true">
                  ${icon.people}
                </span>

                <span class="relation-row-copy">
                  <strong>
                    Board only
                  </strong>

                  <span>
                    Review this person and their family before linking.
                  </span>
                </span>

                <span
                  class="geneo-tree-link-cta-arrow"
                  aria-hidden="true">
                  ${icon.chevron}
                </span>
              </button>
            </div>
          `;

    return renderGeneographInspectorSection({
        context: 'person',
        id: 'familyTreeLink',
        title: 'Family Tree link',
        content: `${content}${validLink || person?.treePersonId ? `<button class="button secondary geneo-import-action" type="button" data-geneo-import-family>${validLink ? 'Sync with Family Tree' : 'Repair Tree link'}</button>` : ''}`
    });
}

function renderGeneographLayerNameField(
    entityType,
    entity
)
{
    const node =
        entityType === 'node';

    const automaticName =
        node
            ? geneoDefaultNodeTitle(
                entity
            )
            : geneoDefaultConnectionLabel(
                entity
            );

    const value =
        normalizeGeneographLayerName(
            entity.name
        );

    const inputId =
        node
            ? 'geneoNodeLayerName'
            : 'geneoConnectionName';

    const descriptionId =
        `${inputId}Description`;

    return `
        <div class="geneo-field">
          <label for="${inputId}">
            Layer name
          </label>

          <input
            id="${inputId}"
            class="geneo-input"
            type="text"
            maxlength="${GENEO_LAYER_NAME_LIMIT}"
            value="${escapeHtml(
                localizedDataFieldValue(
                    value
                )
            )}"
            placeholder="${escapeHtml(
                localizedDataFieldValue(
                    automaticName
                )
            )}"
            data-geneo-entity-name="${escapeHtml(
                entityType
            )}"
            data-geneo-entity-id="${escapeHtml(
                entity.id
            )}"
            data-geneo-entity-source-name="${escapeHtml(
                value
            )}"
            data-user-content
            aria-describedby="${descriptionId}">
        </div>

        <p
          class="geneo-selection-help"
          id="${descriptionId}">
          ${
                node
                    ? 'Board organization only. Card content and linked records are unchanged.'
                    : 'Leave blank to use the automatic relationship or connector name.'
            }
        </p>
      `;
}

function renderGeneographImageSourceSection(node)
{
    const source = resolveGeneographImageSource(node);

    const dimensions =
        source.width && source.height
            ? `${source.width} × ${source.height}`
            : '';

    const size =
        source.sizeBytes > 0
            ? formatMediaBytes(source.sizeBytes)
            : '';

    const metadata = [dimensions, size]
        .filter(Boolean)
        .join(' · ');

    return renderGeneographInspectorSection({
        context: 'image',
        id: 'imageSource',
        title: t('Image details'),
        actionHtml: `<button class="geneo-section-edit" type="button" data-geneo-replace-image aria-label="${escapeHtml(t('Replace image'))}" title="${escapeHtml(t('Replace image'))}">${icon.edit}<span>${escapeHtml(t('Replace'))}</span></button>`,
        inlineAction: true,
        content: `
            ${
                source.available
                    ? `
                  <div class="geneo-image-source-card">
                    <div class="geneo-image-source-preview">
                      ${renderPhotoThumbnail(source.photo, {
                            label: source.displayName
                        })}
                      <span class="geneo-image-missing-placeholder geneo-image-load-fallback">${icon.image}<small>${escapeHtml(t('Image unavailable'))}</small></span>
                    </div>

                    <div class="geneo-image-source-copy">
                      <strong title="${escapeHtml(source.displayName)}">
                        ${escapeHtml(source.displayName)}
                      </strong>

                      ${
                            source.filename
                          && source.filename !== source.displayName
                                ? `
                              <span title="${escapeHtml(source.filename)}">
                                ${escapeHtml(source.filename)}
                              </span>
                            `
                                : ''
                        }

                      ${
                            metadata
                                ? `<span>${escapeHtml(metadata)}</span>`
                                : ''
                        }
                      <div class="geneo-image-source-origin">
                        <span>${escapeHtml(t(source.sourceLabel))}</span>
                        ${source.ref?.scope === 'project' ? `<button class="geneo-image-source-link" type="button" data-geneo-open-project-photo="${escapeHtml(source.ref.id)}">${escapeHtml(t('Open photo'))}</button>` : ''}
                      </div>
                    </div>
                  </div>
                `
                    : `
                  <div class="geneo-image-source-card geneo-image-source-card-missing" role="status">
                    <div class="geneo-image-source-preview geneo-image-missing-placeholder">
                      ${icon.image}
                      <small>${escapeHtml(t('Image unavailable'))}</small>
                    </div>
                    <div class="geneo-image-source-copy">
                      <strong>${escapeHtml(t('Image unavailable'))}</strong>
                      <span>${escapeHtml(t(source.ref?.scope === 'board' ? 'Board upload missing. Replace the image to restore this layer.' : source.ref?.scope === 'project' ? 'Project photo missing. Replace the image to restore this layer.' : 'No image selected. Replace the image to restore this layer.'))}</span>
                    </div>
                  </div>
                `
            }
        `
    });
}

function renderGeneographNodeLayoutSection(
    node
)
{
    const minimumSize =
        geneoNodeMinimumSize(
            node,
            node.width
        );

    const maximumSize =
        geneoNodeMaximumSize(
            node
        );

    const isPerson =
        node.type === 'person';

    const autoHeight =
        isPerson
        && geneoPersonCardUsesAutoHeight(
            node
        );

    const autoPlaceSize =
        geneoPlaceUsesAutoSize(node);

    const imageSource = node.type === 'image'
        ? resolveGeneographImageSource(node)
        : null;

    return renderGeneographInspectorSection({
        context:
          geneoInspectorContextForNode(
              node
          ),

        id: 'layout',
        title: 'Position & size',

        content: `
          <div class="geneo-layout-grid">
            <div class="geneo-field">
              <label for="geneoNodeLayoutX">
                X
              </label>

              <input
                class="geneo-input"
                id="geneoNodeLayoutX"
                type="number"
                data-geneo-layout="x"
                value="${Math.round(
                    node.x
                )}">
            </div>

            <div class="geneo-field">
              <label for="geneoNodeLayoutY">
                Y
              </label>

              <input
                class="geneo-input"
                id="geneoNodeLayoutY"
                type="number"
                data-geneo-layout="y"
                value="${Math.round(
                    node.y
                )}">
            </div>

            <div class="geneo-field">
              <label for="geneoNodeLayoutWidth">
                Width
              </label>

              <input
                class="geneo-input"
                id="geneoNodeLayoutWidth"
                type="number"
                min="${Math.round(
                    minimumSize.width
                )}"
                max="${Math.round(
                    maximumSize.width
                )}"
                data-geneo-layout="width"
                value="${Math.round(
                    node.width
                )}">
            </div>

            <div class="geneo-field">
              <label for="geneoNodeLayoutHeight">
                Height
              </label>

              <input
                class="geneo-input"
                id="geneoNodeLayoutHeight"
                type="number"
                min="${Math.round(
                    minimumSize.height
                )}"
                max="${Math.round(
                    maximumSize.height
                )}"
                data-geneo-layout="height"
                value="${Math.round(
                    node.height
                )}">
            </div>
          </div>

          ${
                node.type === 'place'
                    ? `
                <div class="geneo-place-size-controls">
                  <span class="geneo-selection-help">
                    ${
                        autoPlaceSize
                            ? 'Size fits the place name automatically'
                            : 'Manual size'
                    }
                  </span>

                  ${
                        autoPlaceSize
                            ? ''
                            : `
                        <button
                          class="button ghost compact"
                          type="button"
                          data-geneo-place-fit-content>
                          Fit to content
                        </button>
                      `
                    }
                </div>
              `
                    : ''
            }

          ${imageSource ? `<div class="geneo-place-size-controls"><button class="button ghost compact" type="button" data-geneo-image-fit ${imageSource.available && imageSource.width > 0 && imageSource.height > 0 ? '' : 'disabled'}>${escapeHtml(t('Fit to image'))}</button></div>` : ''}

          ${
                isPerson && !autoHeight
                    ? `
                <div class="geneo-person-size-controls">
                  <button
                    class="button ghost compact"
                    type="button"
                    data-geneo-person-fit-height>
                    Fit height to content
                  </button>
                </div>
              `
                    : ''
            }

        `
    });
}

function renderGeneographStrokeFields({ scope, appearance })
{
    const connection = scope === 'connection';
    const width = connection ? appearance.width : appearance.strokeWidth;
    const pattern = connection ? appearance.pattern : appearance.strokePattern;
    const strokeEnabled = connection ? appearance.line?.enabled : appearance.stroke?.enabled;
    const prefix = connection ? 'Connection' : 'Node';
    const options = (connection ? GENEO_CONNECTION_PATTERNS : ['solid', 'dashed']).map(value => `<option value="${value}" ${pattern === value ? 'selected' : ''}>${escapeHtml(t(GENEO_CONNECTION_PATTERN_LABELS[value]))}</option>`).join('');
    return `<div class="geneo-stroke-settings"><div class="geneo-field geneo-appearance-subfield"><label for="geneo${prefix}StrokeWidth">${escapeHtml(t('Width'))}</label><div class="geneo-number-unit"><input class="geneo-input" id="geneo${prefix}StrokeWidth" type="number" min="${GENEO_STROKE_WIDTH_MIN}" max="${GENEO_STROKE_WIDTH_MAX}" step="1" value="${Math.round(width)}" data-geneo-stroke-width="${scope}"><span aria-hidden="true">px</span></div></div><div class="geneo-field geneo-appearance-subfield"><label for="geneo${prefix}StrokePattern">${escapeHtml(t('Pattern'))}</label><div class="common-select-shell geneo-pattern-select-shell"><select class="common-select geneo-pattern-select" id="geneo${prefix}StrokePattern" data-geneo-stroke-pattern="${scope}" ${strokeEnabled ? '' : 'disabled'}>${options}</select><span class="common-select-chevron" aria-hidden="true">${icon.chevron}</span></div></div></div>`;
}

function renderGeneographPlaceInspectorContent(
    node
)
{
    const resolved =
        resolveGeneographPlace(node);
    const secondaryName = resolved.linked
        ? placeSecondaryName(resolved.place)
        : '';

    const content = `
        <div class="geneo-place-inspector-summary">
          <span aria-hidden="true">
            ${icon.mapPin}
          </span>

          <div>
            <strong>
              ${
                    resolved.linked
                        ? t('Linked project place')
                        : t('Board-only place')
                }
            </strong>
            ${secondaryName ? `<span title="${escapeHtml(secondaryName)}">${escapeHtml(secondaryName)}</span>` : ''}
          </div>
        </div>

        <div class="geneo-place-inspector-actions">
                <button
                  class="button secondary compact"
                  type="button"
                  data-geneo-edit-place="${escapeHtml(node.id)}">
                  ${escapeHtml(t('Change place'))}
                </button>
                ${resolved.linked ? `
                <button
                  class="geneo-image-source-link"
                  type="button"
                  data-geneo-open-place="${escapeHtml(node.id)}">
                  ${escapeHtml(t('Open in Places'))}
                </button>
                ` : ''}
        </div>
        ${resolved.linked ? `<div class="geneo-place-inspector-board-only">
                <button
                  class="geneo-image-source-link"
                  type="button"
                  data-geneo-place-board-only="${escapeHtml(node.id)}">
                  ${escapeHtml(t('Make board-only'))}
                </button>
                <p>${escapeHtml(t('Keep this name on the board without a link to the project place.'))}</p>
            </div>` : ''}
      `;

    return renderGeneographInspectorSection({
        context: 'place',
        id: 'content',
        title: t('Place'),
        content
    });
}

function renderGeneographShapeInspectorContent(
    node
)
{
    const kind =
        normalizeGeneographShapeKind(
            node.shapeKind
        );

    const content = `
        <div class="geneo-field">
          <label for="geneoShapeKind">${escapeHtml(t('Shape type'))}</label>
          <span class="common-select-shell"><select class="common-select" id="geneoShapeKind" data-geneo-inspector-shape-kind>${GENEO_SHAPE_KINDS.map(shape => `<option value="${shape.id}" ${shape.id === kind ? 'selected' : ''}>${escapeHtml(t(shape.label))}</option>`).join('')}</select><span class="common-select-chevron" aria-hidden="true">${icon.chevron}</span></span>
        </div>
      `;

    return renderGeneographInspectorSection({
        context: 'shape',
        id: 'content',
        title: 'Content',
        content
    });
}

function geneoNodeAppearanceIsDefault(node)
{
    return JSON.stringify(node.appearance) === JSON.stringify(geneoNodeDefaults(node.type).appearance);
}

function renderGeneoNodeRadiusControl(node)
{
    if (!['image', 'place', 'panel', 'sticky', 'text', 'shape'].includes(node.type)
        || (node.type === 'shape' && normalizeGeneographShapeKind(node.shapeKind) === 'ellipse')) return '';
    const id = `geneoNodeRadius-${node.id}`;
    return `<div class="geneo-person-card-radius-row geneo-node-radius-row"><label class="geneo-field" for="${escapeHtml(id)}"><span class="geneo-setting-label">${escapeHtml(t('Corner radius'))}</span><span class="geneo-selection-help">0–32 px</span></label><input class="geneo-input" id="${escapeHtml(id)}" type="number" min="0" max="32" step="1" value="${node.appearance.cornerRadius}" data-geneo-node-corner-radius="${escapeHtml(node.id)}"></div>`;
}

function renderGeneoNodeFontSizeControl(node)
{
    if (!['text', 'sticky', 'place'].includes(node.type)) return '';
    const id = `geneoNodeFontSize-${node.id}`;
    return `<div class="geneo-person-card-radius-row"><label class="geneo-field" for="${escapeHtml(id)}"><span class="geneo-setting-label">${escapeHtml(t('Font size'))}</span><span class="geneo-selection-help">8–72 px</span></label><input class="geneo-input" id="${escapeHtml(id)}" type="number" min="8" max="72" step="1" value="${node.appearance.fontSize}" data-geneo-node-font-size="${escapeHtml(node.id)}"></div>`;
}

function renderGeneographNodeInspector(
    node
)
{
    const context =
        geneoInspectorContextForNode(
            node
        );

    const appearance =
        node.appearance || {};

    const person =
        node.type === 'person'
            ? getGeneographPerson(
                node.personId
            )
            : null;

    const content =
        node.type === 'person'
            ? renderGeneographPersonInspectorContent(
                person,
                node
            )
            : node.type === 'panel'
                ? `
              <div class="geneo-field">
                <label for="geneoPanelTitle">
                  Panel title
                </label>

                <input
                  class="geneo-input"
                  id="geneoPanelTitle"
                  type="text"
                  maxlength="160"
                  data-geneo-node-field="title"
                  value="${escapeHtml(node.title || '')}">
              </div>

              <div class="geneo-field">
                <label for="geneoPanelDescription">
                  Panel description
                </label>

                <textarea
                  class="geneo-textarea"
                  id="geneoPanelDescription"
                  maxlength="500"
                  rows="4"
                  data-geneo-node-field="description"
                  placeholder="Describe the purpose or contents of this panel.">${escapeHtml(
                        node.description || ''
                    )}</textarea>

                <p class="geneo-selection-help">
                  Visible in panel properties only.
                </p>
              </div>
            `
                : isGeneographRichTextNode(
                    node
                )
                    ? renderGeneographRichTextInspectorContent(
                        node
                    )
                    : '';

    const contentSection =
        node.type === 'image'
            ? renderGeneographImageSourceSection(
                node
            )
            : node.type === 'place'
                ? renderGeneographPlaceInspectorContent(
                    node
                )
                : node.type === 'shape'
                    ? renderGeneographShapeInspectorContent(
                        node
                    )
                    : node.type === 'drawing'
                        ? ''
                        : renderGeneographInspectorSection({
                            context,
                            id: 'content',
                            title: node.type === 'person' ? 'Card content' : 'Content',
                            content,
                            actionHtml: node.type === 'person'
                                ? `<button class="geneo-section-edit" type="button" data-geneo-edit-person aria-label="${escapeHtml(t('Edit card content'))}">${icon.edit}<span>${escapeHtml(t('Edit'))}</span></button>`
                                : '',
                            inlineAction: node.type === 'person'
                        });

    const appearanceContent = node.type === 'person'
        ? `${renderGeneoPersonAppearanceControls({
            scope: 'node', id: node.id,
            appearance: geneoResolveVisibleNodeAppearance(node),
            radius: geneoPersonCardEffectiveSettings(node).cornerRadius
        })}
          <button class="button secondary geneo-apply-gender" type="button" data-geneo-apply-gender-color>${escapeHtml(t('Apply gender color'))}</button>`
        : `
        ${
            ['drawing', 'image'].includes(node.type)
                ? ''
                : `
              <div class="geneo-appearance-group">
                ${renderGeneoPaintControl({
                    scope: 'node',
                    id: node.id,
                    property: 'fill'
                })}
              </div>
            `
        }

        <div class="geneo-appearance-group">
          ${renderGeneoPaintControl({
                scope: 'node',
                id: node.id,
                property: 'stroke'
            })}

          ${renderGeneographStrokeFields({
                scope: 'node',
                appearance
            })}
        </div>

        ${
            [
                'image',
                'shape',
                'drawing'
            ].includes(node.type)
                ? ''
                : `
              <div class="geneo-appearance-group">
                ${renderGeneoPaintControl({
                    scope: 'node',
                    id: node.id,
                    property: 'text'
                })}

                ${renderGeneoContrastWarning(
                    node
                )}
              </div>
            `
        }

        ${renderGeneoNodeRadiusControl(node)}
        ${renderGeneoNodeFontSizeControl(node)}
        ${renderGeneoShadowControl('node', geneoEffectiveNodeShadow(node, selectedGeneographDiagram(), appearance.fill))}

      `;

    return `
        <aside class="geneo-inspector">
          <div class="geneo-inspector-body">
            ${renderGeneographInspectorHeader(
                geneoNodeTitle(node),
                t(capitalize(node.type)),
                geneoNodeIcon(node.type),
                node
            )}

            ${contentSection}

            ${
                node.type === 'person'
                    ? renderGeneographPersonTreeLinkSection(
                        person
                    )
                    : ''
            }

            ${renderGeneographInspectorSection({
                context,
                id: 'appearance',
                title: node.type === 'person' ? 'Card appearance' : 'Appearance',
                content: appearanceContent
            })}

            ${
                node.type === 'person'
                    ? renderGeneographPersonCardSection(
                        node
                    )
                    : ''
            }

            ${renderGeneographNodeLayoutSection(
                node
            )}

            ${node.type === 'person' ? `<div class="geneo-inspector-reset"><button class="button secondary" type="button" data-geneo-person-card-reset data-geneo-person-card-node="${escapeHtml(node.id)}" ${geneoPersonHasResettableSettings(node) ? '' : 'disabled'}>${escapeHtml(t('Reset to default'))}</button></div>` : `<div class="geneo-inspector-reset"><button class="button secondary" type="button" data-geneo-node-appearance-reset="${escapeHtml(node.id)}" ${geneoNodeAppearanceIsDefault(node) ? 'disabled' : ''}>${escapeHtml(t('Reset to default'))}</button></div>`}

            ${renderGeneographInspectorDangerAction(
                t(`Delete ${capitalize(node.type)}`)
            )}
          </div>
        </aside>
      `;
}

function renderGeneographConnectionInspector(
    connection
)
{
    const family =
        connection.kind === 'family-partner'
            ? getGeneographFamily(
                connection.familyId
            )
            : null;

    const resolved =
        family
            ? geneoRelationshipForFamily(
                family
            )
            : null;

    const relationship =
        resolved?.relationship;

    const relationshipType =
        relationship
            ? relationshipTypeFromLegacy(
                relationship
            )
            : 'Married';

    const startEvent =
        relationship
            ? partnerRelationshipStartEvent(
                relationship,
                relationshipType
            )
            : null;

    const marriageType =
        startEvent?.typeLabel
        || relationship?.marriageType
        || 'Civil';

    const relationshipSection =
        family
            ? renderGeneographInspectorSection({
                context: 'connection',
                id: 'relationship',
                title: 'Relationship details',
                content: `
                <div
                  class="
                    geneo-relationship-editor
                  "
                  data-geneo-relationship-editor>
                  <div class="geneo-field">
                    <label for="geneoRelationshipType">
                      Relationship type
                    </label>

                    <select
                      class="geneo-select"
                      id="geneoRelationshipType"
                      data-geneo-relationship-type>
                      ${addPersonRelationshipTypeOptions(
                            relationshipType
                        )}
                    </select>
                  </div>

                  ${renderPartnerRelationshipDateFields({
                        prefix:
                      'geneoRelationship',
                        relationshipType,
                        family: relationship
                    })}

                  <div
                    class="geneo-field"
                    data-add-person-marriage-type-field
                    ${
                        addPersonRelationshipShowsMarriageType(
                            relationshipType
                        )
                            ? ''
                            : 'hidden'
                    }>
                    <label for="geneoRelationshipMarriageType">
                      Marriage type
                    </label>

                    <select
                      class="geneo-select"
                      id="geneoRelationshipMarriageType"
                      data-geneo-marriage-type>
                      ${addPersonMarriageTypeOptions(
                            marriageType
                        )}
                    </select>
                  </div>

                </div>
              `
            })
            : '';

    const appearanceContent = `
        <div class="geneo-connection-type-row"><span class="geneo-connection-type-label">${connection.kind === 'visual' ? icon.link : icon.tree}<span>${escapeHtml(t(connection.kind === 'visual' ? 'Visual only' : 'Family relationship'))}</span></span>${connection.kind !== 'visual' ? `<button class="geneo-type-convert" type="button" data-geneo-make-visual>${escapeHtml(t('Make visual only'))}</button>` : ''}</div>
        ${renderGeneoConnectionInspectorStyleFields(connection)}
        ${family ? `<label class="geneo-check geneo-connection-date-default"><input type="checkbox" data-geneo-show-relationship-dates ${geneoEffectiveShowRelationshipDates(connection) ? 'checked' : ''}><span>${escapeHtml(t('Show relationship date on board'))}</span></label>` : ''}

        <div class="geneo-field">
          <label for="geneoConnectionRouting">
            Routing
          </label>

          <select
            class="geneo-select"
            id="geneoConnectionRouting"
            data-geneo-connection-routing>
            <option
              value="auto"
              ${
                    connection.route.mode === 'auto'
                        ? 'selected'
                        : ''
                }>
              Automatic
            </option>

            <option
              value="manual"
              ${
                    connection.route.mode === 'manual'
                        ? 'selected'
                        : ''
                }>
              Manual
            </option>
          </select>
        </div>

        <button
          class="button secondary"
          type="button"
          data-geneo-reset-route>
          Reset route
        </button>
      `;

    return `
        <aside class="geneo-inspector">
          <div class="geneo-inspector-body">
            ${renderGeneographInspectorHeader(
                geneoConnectionLabel(
                    connection
                ),
                'Connection',
                icon.link,
                connection,
                'connection'
            )}

            ${relationshipSection}

            ${renderGeneographInspectorSection({
                context: 'connection',
                id: 'appearance',
                title: 'Appearance',
                content: appearanceContent
            })}

            <div class="geneo-inspector-reset"><button class="button secondary" type="button" data-geneo-connection-reset-default ${Object.keys(connection.style || {}).length || connection.showRelationshipDates !== undefined ? '' : 'disabled'}>${escapeHtml(t('Reset to default'))}</button></div>

            ${renderGeneographInspectorDangerAction(
                'Delete connection'
            )}
          </div>
        </aside>
      `;
}

