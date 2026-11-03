function renderGeneographEditor()
{
    geneoClearAlignmentGuides();
    if (geneoImageCropRuntime?.boardId !== selectedGeneographBoard()?.id) geneoImageCropRuntime = null;
    if (geneoImageCropRuntime && !resolveGeneographImageSource(getGeneographNode(geneoImageCropRuntime.nodeId)).available)
        geneoImageCropRuntime = null;
    if (geneoCtrlSelectPressed && (geneoCtrlSelectContext?.tool !== state.geneoTool
        || geneoCtrlSelectContext?.boardId !== selectedGeneographBoard()?.id))
        setGeneoCtrlSelectPressed(false);
    closeGeneographObjectContextMenu();
    const richTextDraft = captureGeneographRichTextDraft();
    destroyGeneographRichTextEditor();
    if (geneoPaintRuntime.popover) closeGeneoPaintPopover({ restoreFocus: false });
    normalizeGeneographRuntimeData();
    pruneGeneographSelection();
    if (
        state.geneoLayerRename
        && !getGeneographRenameEntity(
            state.geneoLayerRename.entityType,
            state.geneoLayerRename.entityId
        )
    )
    {
        state.geneoLayerRename = null;
    }
    geneoEnsureHistory();
    const board = selectedGeneographBoard();
    if (!board)
    {
        state.geneoView = 'home'; renderGeneographHome(); return;
    }
    const zoom = Math.max(.25, Math.min(2, state.geneoZoom / 100));
    renderGeneographEditorSidebar(board);
    const diagram = board.diagram;
    const bounds = geneoDerivedCanvasBounds(diagram);
    geneoCanvasRuntime.bounds = bounds;
    const gridOriginX = (((-bounds.left % GENEO_GRID_SIZE) + GENEO_GRID_SIZE) % GENEO_GRID_SIZE) * zoom;
    const gridOriginY = (((-bounds.top % GENEO_GRID_SIZE) + GENEO_GRID_SIZE) % GENEO_GRID_SIZE) * zoom;
    const ordered = diagram.nodes.slice().sort((a, b) => (a.type === 'panel' ? -1000 : 0) + a.order - ((b.type === 'panel' ? -1000 : 0) + b.order));
    const stageClasses = [
        'geneo-canvas-stage',
        geneoEffectiveCanvasTool() === 'select' && state.geneoTool !== 'select' ? 'temporary-select-tool' : '',
        state.geneoTool === 'connect' ? 'connection-tool' : '',
        state.geneoTool === 'panel'
            ? 'panel-tool'
            : '',
        state.geneoTool === 'sticky'
            ? 'sticky-tool'
            : '',
        state.geneoTool === 'text'
            ? 'text-tool'
            : '',
        state.geneoTool === 'shape'
            ? 'shape-tool'
            : '',
        state.geneoTool === 'pencil'
            ? 'pencil-tool'
            : '',
        state.geneoConnectionDraft ? 'is-connecting' : '',
        diagram.canvas.alwaysShowSockets ? 'show-sockets' : ''
    ].filter(Boolean).join(' ');
    geneoCanvasRuntime.suppressEdgeExpansion = true;
    main.innerHTML = `<section class="geneo-editor">
      <div
        class="geneo-editor-toolbar"
        role="toolbar"
        aria-label="${
            escapeHtml(
                t('Geneograph board tools')
            )
        }"
        data-toolbar-density="expanded">

        <div class="geneo-editor-toolbar-left">
          <div
            class="geneo-history-group"
            role="group"
            aria-label="${escapeHtml(t('History'))}">

            <button
              class="geneo-toolbar-button geneo-icon-button"
              type="button"
              data-geneo-undo
              aria-label="${escapeHtml(t('Undo'))}"
              title="${escapeHtml(t('Undo'))}"
              ${
                    geneoHistoryRuntime.undo.length
                        ? ''
                        : 'disabled'
                }>

              ${icon.undo}
            </button>

            <button
              class="geneo-toolbar-button geneo-icon-button"
              type="button"
              data-geneo-redo
              aria-label="${escapeHtml(t('Redo'))}"
              title="${escapeHtml(t('Redo'))}"
              ${
                    geneoHistoryRuntime.redo.length
                        ? ''
                        : 'disabled'
                }>

              ${icon.redo}
            </button>
          </div>

          <div
            class="geneo-tool-group${['select', 'pan', 'pencil'].includes(state.geneoTool) ? '' : ' is-icon-only'}"
            role="group"
            aria-label="${
                escapeHtml(t('Working mode'))
            }">

            ${
                renderGeneoModeTool(
                    'select',
                    icon.cursorSelect,
                    'Select'
                )
            }

            ${
                renderGeneoModeTool(
                    'pan',
                    icon.pan,
                    'Pan'
                )
            }

            ${
                renderGeneoModeTool(
                    'pencil',
                    icon.edit,
                    'Pencil'
                )
            }
          </div>

          ${renderGeneoConnectionSplitTool()}

          <div
            class="geneo-toolbar-objects"
            aria-label="${
                escapeHtml(t('Add objects'))
            }">

            ${
                renderGeneoPersonSplitTool()
            }

            ${
                renderGeneoToolbarObjectButton(
                    'place',
                    icon.mapPin,
                    'Place'
                )
            }

            ${
                renderGeneoToolbarObjectButton(
                    'image',
                    icon.image,
                    'Image'
                )
            }

            ${
                renderGeneoToolbarObjectButton(
                    'panel',
                    icon.panel,
                    'Panel'
                )
            }

            ${renderGeneoContentSplitTool()}

            ${renderGeneoShapeSplitTool()}
          </div>
        </div>

        <div class="geneo-editor-toolbar-right">
          <button
            class="geneo-toolbar-button"
            type="button"
            data-geneo-toolbar-item="export"
            data-geneo-export
            aria-label="${
                escapeHtml(t('Export board'))
            }"
            title="${
                escapeHtml(t('Export board'))
            }">

            ${icon.export}
            <span>${escapeHtml(t('Export'))}</span>
          </button>

          <button
            class="geneo-toolbar-button geneo-icon-button geneo-toolbar-overflow"
            type="button"
            data-geneo-toolbar-overflow
            aria-label="${
                escapeHtml(t('More board tools'))
            }"
            title="${
                escapeHtml(t('More board tools'))
            }"
            aria-haspopup="menu"
            aria-expanded="false">

            ${icon.more}
          </button>
        </div>
      </div>
        ${renderGeneoConnectionToolPanel()}
        ${renderGeneoCreationToolPanel('drawing')}
        ${renderGeneoCreationToolPanel('shape')}
        <div class="geneo-editor-main ${state.geneoInspectorCollapsed ? 'inspector-collapsed' : ''}"><div class="geneo-canvas-viewport" data-geneo-canvas-viewport style="--geneo-canvas-background:${escapeHtml(geneoPaintCssColor(diagram.canvas.backgroundPaint))}"><div class="geneo-canvas-wrap" data-geneo-canvas-wrap><div class="geneo-board-space pattern-${escapeHtml(diagram.canvas.backgroundPattern)}" style="width:${bounds.width * zoom}px;height:${bounds.height * zoom}px;--geneo-canvas-zoom:${zoom};--geneo-grid-origin-x:${gridOriginX}px;--geneo-grid-origin-y:${gridOriginY}px"><div class="${stageClasses}" data-geneo-stage style="width:${bounds.width}px;height:${bounds.height}px;transform:scale(${zoom})">
          ${renderGeneographConnectors()}<div class="geneo-panel-draft" data-geneo-panel-draft hidden><span data-geneo-panel-draft-size></span></div><div class="geneo-selection-marquee" data-geneo-marquee hidden></div><div class="geneo-alignment-guides" aria-hidden="true"><div class="geneo-alignment-guide vertical" data-geneo-align-x hidden></div><div class="geneo-alignment-guide horizontal" data-geneo-align-y hidden></div></div>${ordered.map(renderGeneographObject).join('')}
          </div></div></div><div class="geneo-zoom-overlay canvas-zoom"><button class="geneo-zoom-button zoom-button" type="button" data-geneo-zoom="out" aria-label="Zoom out">${icon.zoomOut}</button><span class="geneo-zoom-value zoom-value">${state.geneoZoom}%</span><button class="geneo-zoom-button zoom-button" type="button" data-geneo-zoom="in" aria-label="Zoom in">${icon.zoomIn}</button><button class="geneo-zoom-button zoom-button" type="button" data-geneo-zoom="fit" aria-label="Fit board">${icon.home}</button></div></div>${renderGeneographInspector()}</div>
          </section>`;
    localizeUI(
        main,
        {
            suppressObserverReplay: true
        }
    );

    const autoHeightsChanged =
        syncGeneographAutoPersonCardHeights();

    const autoPlaceSizesChanged =
        syncGeneographAutoPlaceSizes();

    if (
        autoHeightsChanged
        || autoPlaceSizesChanged
    )
    {
        localizeUI(
            main.querySelector(
                '.geneo-connections'
            ),
            {
                suppressObserverReplay: true
            }
        );
    }

    bindGeneographEditor();
    if (geneoImageCropRuntime) requestAnimationFrame(geneoPositionImageCropToolbar);
    ensureGeneographKeyboardBinding();
    const editingNode =
        getGeneographNode(
            state.geneoInlineEditNodeId
        );

    if (
        isGeneographRichTextNode(
            editingNode
        )
    )
    {
        const matchingDraft =
            richTextDraft?.nodeId
            === editingNode.id
                ? richTextDraft
                : null;

        requestAnimationFrame(
            () =>
            {
                initializeGeneographRichTextEditor(
                    editingNode,
                    {
                        draft:
                  matchingDraft
                    }
                );
            }
        );
    }
}

function renderGeneographEditorPreserveScroll({
    preserveInspectorScroll = false,
    preserveSidebarScroll = false
} = {})
{
    const center = geneoCurrentViewportCenter();

    const inspectorScrollTop = preserveInspectorScroll
        ? (
            main.querySelector(
                '.geneo-inspector:not(.collapsed)'
            )?.scrollTop ?? null
        )
        : null;
    const sidebarScrollTop = preserveSidebarScroll
        ? sidebar.querySelector('.geneo-sidebar')?.scrollTop ?? null
        : null;

    renderGeneographEditor();

    scheduleGeneographViewportRestore(center, () =>
    {
        if (inspectorScrollTop !== null)
        {
            const inspector = main.querySelector(
                '.geneo-inspector:not(.collapsed)'
            );

            if (inspector)
            {
                const maximumScrollTop = Math.max(
                    0,
                    inspector.scrollHeight - inspector.clientHeight
                );

                inspector.scrollTop = Math.min(
                    inspectorScrollTop,
                    maximumScrollTop
                );
            }
        }

        if (sidebarScrollTop !== null)
        {
            const geneoSidebar = sidebar.querySelector('.geneo-sidebar');
            if (geneoSidebar)
            {
                geneoSidebar.scrollTop = Math.min(
                    sidebarScrollTop,
                    Math.max(0, geneoSidebar.scrollHeight - geneoSidebar.clientHeight)
                );
            }
        }
        if (geneoImageCropRuntime) geneoPositionImageCropToolbar();
    });
}

function geneoNodeCenter(
    node
)
{
    if (!node)
    {
        return null;
    }

    return {
        x:
          node.x
          + node.width / 2,

        y:
          node.y
          + node.height / 2
    };
}

function renderGeneographEditorPreserveCenter(center = null)
{
    const point = center || geneoCurrentViewportCenter();
    renderGeneographEditor();
    scheduleGeneographViewportRestore(point);
}

function nextGeneoObjectPosition(width, height)
{
    const center = geneoCurrentViewportCenter() || geneoContentCenter();
    const baseX = center.x - width / 2;
    const baseY = center.y - height / 2;
    const nodes = selectedGeneographDiagram()?.nodes || [];
    const overlaps = candidate => nodes.some(node =>
        candidate.x < node.x + node.width + 18
        && candidate.x + width + 18 > node.x
        && candidate.y < node.y + node.height + 18
        && candidate.y + height + 18 > node.y
    );
    const offsets = [{ x: 0, y: 0 }];
    for (let ring = 1; ring <= 10; ring += 1)
    {
        const step = ring * 34;
        offsets.push(
            { x: step, y: 0 }, { x: step, y: step }, { x: 0, y: step },
            { x: -step, y: step }, { x: -step, y: 0 }, { x: -step, y: -step },
            { x: 0, y: -step }, { x: step, y: -step }
        );
    }
    const candidate = offsets.map(offset => ({
        x: baseX + offset.x,
        y: baseY + offset.y
    })).find(position => !overlaps(position));
    return candidate || { x: baseX, y: baseY };
}

function isGeneographRichTextNode(
    node
)
{
    return Boolean(
        node
        && (
            node.type === 'text'
          || node.type === 'sticky'
        )
    );
}

function geneographRichTextDisplayHtml(
    node
)
{
    const text =
        String(
            node?.text || ''
        );

    if (!text)
    {
        return `
          <span
            class="geneo-rich-text-placeholder">
            Double-click to edit
          </span>
        `;
    }

    return renderRichTextDeltaHtml(
        node.textFormat
          === 'quill-delta-v1'
            ? node.textDelta
            : null,

        text
    );
}

function renderGeneographRichTextInspectorContent(
    node
)
{
    const editing =
        state.geneoInlineEditNodeId
          === node.id;

    if (!editing)
    {
        return `
          <div
            class="
              geneo-rich-text-inspector-preview
              geneo-rich-text-inspector-${escapeHtml(
                    node.type
                )}
            " role="button" tabindex="0" aria-label="${escapeHtml(t('Edit text'))}" title="${escapeHtml(t('Edit text'))}" data-geneo-edit-rich-text="${escapeHtml(node.id)}">
            ${geneographRichTextDisplayHtml(
                node
            )}
          </div>

        `;
    }

    const toolbarLabel =
        node.type === 'sticky'
            ? 'Sticky note formatting'
            : 'Text formatting';

    return `
        <div
          class="geneo-rich-text-inspector"
          data-geneo-rich-text-inspector="${escapeHtml(
                node.id
            )}">

          <div
            class="notes-rich-editor-shell geneo-rich-text-inspector-editor-shell"
            data-geneo-inspector-rich-text-editor-shell>

            ${renderRichTextToolbar({
                id:
                'geneoInspectorRichTextToolbar',

                className:
                'geneo-rich-text-inspector-toolbar',

                ariaLabel:
                toolbarLabel
            })}

            <div
              class="geneo-rich-text-inspector-editor"
              data-geneo-inspector-rich-text-editor>
            </div>

            <textarea
              class="geneo-rich-text-inspector-fallback"
              data-geneo-inspector-rich-text-fallback
              aria-label="${escapeHtml(
                    node.type === 'sticky'
                        ? 'Sticky note content'
                        : 'Text block content'
                )}"
              hidden>${escapeHtml(
                    node.text || ''
                )}</textarea>
          </div>

          <div
            class="geneo-rich-text-inspector-actions">
            <button
              class="button secondary"
              type="button"
              data-geneo-rich-text-cancel>
              Cancel
            </button>

            <button
              class="button primary"
              type="button"
              data-geneo-rich-text-done>
              Done
            </button>
          </div>
        </div>
      `;
}

function renderGeneographRichTextToolbar(
    node
)
{
    if (
        !isGeneographRichTextNode(
            node
        )
        || state.geneoInlineEditNodeId
          !== node.id
    )
    {
        return '';
    }

    return renderRichTextToolbar({
        id:
          'geneoRichTextToolbar',

        className:
          'geneo-rich-text-toolbar',

        ariaLabel:
          node.type === 'sticky'
              ? 'Sticky note formatting'
              : 'Text formatting'
    });
}

function captureGeneographRichTextDraft()
{
    if (
        !geneoRichTextRuntime
            .nodeId
    )
    {
        return null;
    }

    return {
        nodeId:
          geneoRichTextRuntime
              .nodeId,

        delta:
          cloneRichTextDelta(
              geneoRichTextRuntime
                  .draftDelta
          ),

        text:
          geneoRichTextRuntime
              .draftText,

        fallbackActive:
          geneoRichTextRuntime
              .fallbackActive
    };
}

function destroyGeneographRichTextEditor()
{
    Object.entries(
        geneoRichTextRuntime.instances
    ).forEach(([
        surface,
        instance
    ]) =>
    {
        const handler =
            geneoRichTextRuntime
                .textChangeHandlers[
                    surface
                ];

        if (
            instance
          && handler
        )
        {
            instance.off(
                'text-change',
                handler
            );
        }
    });

    if (
        geneoRichTextRuntime
            .outsidePointerHandler
    )
    {
        document.removeEventListener(
            'pointerdown',
            geneoRichTextRuntime
                .outsidePointerHandler,
            true
        );
    }

    if (
        geneoRichTextRuntime
            .keydownHandler
    )
    {
        document.removeEventListener(
            'keydown',
            geneoRichTextRuntime
                .keydownHandler,
            true
        );
    }

    geneoRichTextRuntime.nodeId =
        '';

    geneoRichTextRuntime.instances = {
        canvas: null,
        inspector: null
    };

    geneoRichTextRuntime
        .textChangeHandlers = {
            canvas: null,
            inspector: null
        };

    geneoRichTextRuntime
        .fallbackElements = {
            canvas: null,
            inspector: null
        };

    geneoRichTextRuntime
        .outsidePointerHandler =
            null;

    geneoRichTextRuntime
        .keydownHandler =
            null;

    geneoRichTextRuntime.draftDelta =
        null;

    geneoRichTextRuntime.draftText =
        '';

    geneoRichTextRuntime.syncing =
        false;

    geneoRichTextRuntime
        .fallbackActive =
            false;
}

function bindGeneographRichTextSessionGuards(
    node
)
{
    const selector =
        `[data-geneo-node="${
            CSS.escape(node.id)
        }"]`;

    const outsidePointerHandler =
        event =>
        {
            if (
                geneoRichTextRuntime
                    .nodeId !== node.id
            )
            {
                return;
            }

            if (
                event.target.closest(
                    selector
                )
            || event.target.closest(
                '[data-geneo-rich-text-inspector]'
            )
            )
            {
                return;
            }

            event.preventDefault();
            event.stopPropagation();

            commitGeneoInlineEdit(
                false
            );
        };

    const keydownHandler =
        event =>
        {
            if (
                geneoRichTextRuntime
                    .nodeId !== node.id
            )
            {
                return;
            }

            if (
                event.key === 'Escape'
            )
            {
                event.preventDefault();
                event.stopPropagation();

                commitGeneoInlineEdit(
                    true
                );

                return;
            }

            if (
                event.key === 'Enter'
            && (
                event.ctrlKey
              || event.metaKey
            )
            )
            {
                event.preventDefault();
                event.stopPropagation();

                commitGeneoInlineEdit(
                    false
                );
            }
        };

    geneoRichTextRuntime
        .outsidePointerHandler =
            outsidePointerHandler;

    geneoRichTextRuntime
        .keydownHandler =
            keydownHandler;

    document.addEventListener(
        'pointerdown',
        outsidePointerHandler,
        true
    );

    document.addEventListener(
        'keydown',
        keydownHandler,
        true
    );
}

function initializeGeneographRichTextEditor(
    node,
    {
        draft = null
    } = {}
)
{
    if (
        !isGeneographRichTextNode(
            node
        )
    )
    {
        return;
    }

    const nodeElement =
        main.querySelector(
            `[data-geneo-node="${
                CSS.escape(node.id)
            }"]`
        );

    const inspector =
        main.querySelector(
            `[data-geneo-rich-text-inspector="${
                CSS.escape(node.id)
            }"]`
        );

    if (!nodeElement)
    {
        return;
    }

    const matchingDraft =
        draft?.nodeId === node.id
            ? draft
            : null;

    const initialDelta =
        matchingDraft
            ? cloneRichTextDelta(
                matchingDraft.delta
            )
            : cloneRichTextDelta(
                node.textDelta
            );

    const initialText =
        matchingDraft
            ? String(
                matchingDraft.text || ''
            )
            : String(
                node.text || ''
            );

    geneoRichTextRuntime.nodeId =
        node.id;

    geneoRichTextRuntime.draftDelta =
        initialDelta;

    geneoRichTextRuntime.draftText =
        initialText;

    const surfaces = [
        {
            key: 'canvas',

            shell:
            nodeElement.querySelector(
                '[data-geneo-rich-text-editor-shell]'
            ),

            toolbar:
            nodeElement.querySelector(
                '#geneoRichTextToolbar'
            ),

            editorHost:
            nodeElement.querySelector(
                '[data-geneo-rich-text-editor]'
            ),

            fallback:
            nodeElement.querySelector(
                '[data-geneo-rich-text-fallback]'
            ),

            bounds:
            nodeElement,

            editorLabel:
            node.type === 'sticky'
                ? 'Sticky note content'
                : 'Text block content'
        },

        {
            key: 'inspector',

            shell:
            inspector?.querySelector(
                '[data-geneo-inspector-rich-text-editor-shell]'
            ),

            toolbar:
            inspector?.querySelector(
                '#geneoInspectorRichTextToolbar'
            ),

            editorHost:
            inspector?.querySelector(
                '[data-geneo-inspector-rich-text-editor]'
            ),

            fallback:
            inspector?.querySelector(
                '[data-geneo-inspector-rich-text-fallback]'
            ),

            bounds:
            inspector,

            editorLabel:
            node.type === 'sticky'
                ? 'Sticky note content'
                : 'Text block content'
        }
    ].filter(surface =>
        surface.shell
        && surface.toolbar
        && surface.editorHost
        && surface.fallback
    );

    if (!surfaces.length)
    {
        return;
    }

    bindGeneographRichTextSessionGuards(
        node
    );

    const requestedSurface =
        state.geneoInlineEditSurface
          === 'inspector'
            ? 'inspector'
            : 'canvas';

    const center =
        geneoCurrentViewportCenter();

    /*
       * Plain-text fallback uses both surfaces
       * as synchronized views of the same draft.
       */
    if (
        typeof window.Quill
          !== 'function'
    )
    {
        geneoRichTextRuntime
            .fallbackActive =
                true;

        surfaces.forEach(surface =>
        {
            surface.toolbar.hidden =
                true;

            surface.editorHost.hidden =
                true;

            surface.fallback.hidden =
                false;

            surface.fallback.value =
                initialText;

            geneoRichTextRuntime
                .fallbackElements[
                    surface.key
                ] =
                    surface.fallback;

            surface.fallback.addEventListener(
                'focus',
                () =>
                {
                    state.geneoInlineEditSurface =
                        surface.key;
                }
            );

            surface.fallback.addEventListener(
                'input',
                () =>
                {
                    geneoRichTextRuntime
                        .draftText =
                            surface.fallback.value;

                    geneoRichTextRuntime
                        .draftDelta =
                            null;

                    Object.entries(
                        geneoRichTextRuntime
                            .fallbackElements
                    ).forEach(([
                        key,
                        element
                    ]) =>
                    {
                        if (
                            key !== surface.key
                  && element
                        )
                        {
                            element.value =
                                surface.fallback.value;
                        }
                    });
                }
            );
        });

        const target =
            geneoRichTextRuntime
                .fallbackElements[
                    requestedSurface
                ]
          || geneoRichTextRuntime
              .fallbackElements.canvas
          || geneoRichTextRuntime
              .fallbackElements.inspector;

        requestAnimationFrame(
            () =>
            {
                target?.focus({
                    preventScroll: true
                });

                if (
                    target
              && state
                  .geneoInlineEditSelectAll
                )
                {
                    target.select();
                }

                state
                    .geneoInlineEditSelectAll =
                        false;

                if (
                    requestedSurface
              === 'canvas'
              && center
                )
                {
                    scheduleGeneographViewportRestore(
                        center
                    );
                }
            }
        );

        return;
    }

    const synchronize =
        (
            sourceKey,
            sourceInstance
        ) =>
        {
            if (
                geneoRichTextRuntime.syncing
            )
            {
                return;
            }

            geneoRichTextRuntime.syncing =
                true;

            const delta =
                normalizeRichTextDelta(
                    sourceInstance
                        .getContents()
                );

            geneoRichTextRuntime
                .draftDelta =
                    delta;

            geneoRichTextRuntime
                .draftText =
                    plainTextFromQuill(
                        sourceInstance
                    );

            Object.entries(
                geneoRichTextRuntime
                    .instances
            ).forEach(([
                key,
                instance
            ]) =>
            {
                if (
                    key === sourceKey
              || !instance
                )
                {
                    return;
                }

                if (delta)
                {
                    instance.setContents(
                        delta,
                        'silent'
                    );
                }
                else
                {
                    instance.setText(
                        geneoRichTextRuntime
                            .draftText,
                        'silent'
                    );
                }
            });

            geneoRichTextRuntime.syncing =
                false;
        };

    surfaces.forEach(surface =>
    {
        const instance =
            createRichTextQuill({
                editorHost:
              surface.editorHost,

                toolbar:
              surface.toolbar,

                bounds:
              surface.bounds,

                placeholder:
              node.type === 'sticky'
                  ? 'Write a note…'
                  : 'Enter text…',

                toolbarLabel:
              node.type === 'sticky'
                  ? 'Sticky note formatting'
                  : 'Text formatting',

                editorLabel:
              surface.editorLabel
            });

        if (!instance)
        {
            return;
        }

        if (initialDelta)
        {
            instance.setContents(
                initialDelta,
                'silent'
            );
        }
        else
        {
            instance.setText(
                initialText,
                'silent'
            );
        }

        instance.history.clear();

        geneoRichTextRuntime
            .instances[
                surface.key
            ] =
                instance;

        const textChangeHandler =
            (
                delta,
                oldDelta,
                source
            ) =>
            {
                if (
                    source !== 'user'
              || geneoRichTextRuntime
                  .nodeId !== node.id
                )
                {
                    return;
                }

                synchronize(
                    surface.key,
                    instance
                );
            };

        geneoRichTextRuntime
            .textChangeHandlers[
                surface.key
            ] =
                textChangeHandler;

        instance.on(
            'text-change',
            textChangeHandler
        );

        instance.root.addEventListener(
            'focus',
            () =>
            {
                state.geneoInlineEditSurface =
                    surface.key;
            }
        );

        surface.toolbar.addEventListener(
            'pointerdown',
            () =>
            {
                state.geneoInlineEditSurface =
                    surface.key;
            }
        );
    });

    const targetInstance =
        geneoRichTextRuntime
            .instances[
                requestedSurface
            ]
        || geneoRichTextRuntime
            .instances.canvas
        || geneoRichTextRuntime
            .instances.inspector;

    requestAnimationFrame(
        () =>
        {
            if (!targetInstance)
            {
                return;
            }

            targetInstance.root.focus({
                preventScroll: true
            });

            const contentLength =
                Math.max(
                    0,
                    targetInstance
                        .getLength() - 1
                );

            if (
                state
                    .geneoInlineEditSelectAll
            && contentLength
            )
            {
                targetInstance.setSelection(
                    0,
                    contentLength,
                    'silent'
                );
            }
            else
            {
                targetInstance.setSelection(
                    contentLength,
                    0,
                    'silent'
                );
            }

            state
                .geneoInlineEditSelectAll =
                    false;

            /*
           * Quill's selection update occurs after
           * the board rerender. Reassert the object
           * center after that focus/selection work.
           */
            if (
                requestedSurface
            === 'canvas'
            && center
            )
            {
                scheduleGeneographViewportRestore(
                    center
                );
            }
        }
    );
}

function focusGeneographInlineEditor()
{
    const input = main.querySelector('[data-geneo-inline-input]');
    if (!input)
    {
        state.geneoInlineEditSelectAll = false;
        return;
    }
    input.focus({ preventScroll: true });
    if (state.geneoInlineEditSelectAll && typeof input.select === 'function') input.select();
    state.geneoInlineEditSelectAll = false;
}

function beginGeneographInlineEdit(
    nodeId,
    {
        selectAll = false,
        surface = 'canvas'
    } = {}
)
{
    const node =
        getGeneographNode(
            nodeId
        );

    if (
        !node
        || ![
            'text',
            'sticky',
            'panel'
        ].includes(node.type)
    )
    {
        return;
    }

    if (
        state.geneoInlineEditNodeId
        && state.geneoInlineEditNodeId
          !== nodeId
    )
    {
        commitGeneoInlineEdit(
            false
        );
    }

    selectGeneographNode(
        nodeId
    );

    state.geneoInlineEditNodeId =
        nodeId;

    state.geneoInlineEditSelectAll =
        selectAll;

    state.geneoInlineEditSurface =
        surface === 'inspector'
            ? 'inspector'
            : 'canvas';

    renderGeneographEditorPreserveScroll({
        preserveInspectorScroll:
          true
    });

    if (node.type === 'panel')
    {
        requestAnimationFrame(
            focusGeneographInlineEditor
        );
    }
}

function addGeneographObject(
    type
)
{
    cancelGeneographPencilStroke();
    if (
        !GENEO_NODE_TYPES.has(type)
    )
    {
        return;
    }

    if (
        [
            'panel',
            'sticky',
            'text',
            'shape'
        ].includes(type)
    )
    {
        activateGeneographPlacementTool(
            type
        );

        return;
    }

    const endedPlacementTool =
        [
            'panel',
            'sticky',
            'text',
            'shape'
        ].includes(state.geneoTool);

    if (endedPlacementTool)
    {
        finishGeneographPlacementTool();
        renderGeneographEditorPreserveScroll({ preserveInspectorScroll: true });
    }

    cancelGeneographConnectionDraft();

    if (type === 'person')
    {
        openAddGeneographPersonModal();
        return;
    }

    if (type === 'image')
    {
        openGeneographImagePicker();
        return;
    }

    if (type === 'place')
    {
        openGeneographPlaceModal();
    }
}

function geneoCurrentMoveTool()
{
    return ['select', 'pan'].includes(
        state.geneoTool
    )
        ? state.geneoTool
        : 'pan';
}

function finishGeneographPlacementTool()
{
    const returnTool =
        state.geneoPlacementReturnTool;

    state.geneoPlacementReturnTool =
        null;

    state.geneoTool =
        ['select', 'pan'].includes(
            returnTool
        )
            ? returnTool
            : 'pan';
}

function activateGeneographPlacementTool(
    type
)
{
    cancelGeneographPencilStroke();
    if (
        ![
            'panel',
            'sticky',
            'text',
            'shape'
        ].includes(type)
    )
    {
        return;
    }

    cancelGeneographConnectionDraft();

    const alreadyActive =
        state.geneoTool === type;

    if (alreadyActive)
    {
        if (type === 'shape')
        {
            geneoCreationToolSettings('shape').panelOpen = true;
            renderGeneographEditorPreserveScroll();
            return;
        }
        finishGeneographPlacementTool();

        renderGeneographEditorPreserveScroll();

        return;
    }

    state.geneoPlacementReturnTool =
        geneoCurrentMoveTool();

    state.geneoTool =
        type;

    if (type === 'shape') geneoCreationToolSettings('shape').panelOpen = true;

    renderGeneographEditorPreserveScroll();

    const instruction =
        type === 'panel'
            ? 'Drag on empty canvas to draw a panel.'
            : type === 'shape'
                ? `Drag on empty canvas to draw a ${geneoShapeLabel(geneoCreationToolSettings('shape').shapeKind).toLowerCase()}, or click to use the default size.`
                : type === 'sticky'
                    ? 'Click empty canvas or a panel to place a sticky note.'
                    : 'Click empty canvas or a panel to place a text block.';

    showToast(
        instruction
    );
}

function geneoPanelDraftRect(start, current)
{
    const left = Math.min(start.x, current.x);
    const top = Math.min(start.y, current.y);
    const right = Math.max(start.x, current.x);
    const bottom = Math.max(start.y, current.y);

    return {
        x: left,
        y: top,
        width: right - left,
        height: bottom - top
    };
}

function updateGeneographPanelDraftDom(start, current)
{
    const draft = main.querySelector(
        '[data-geneo-panel-draft]'
    );

    if (!draft) return;

    const bounds =
        geneoCanvasRuntime.bounds
        || {
            left: 0,
            top: 0
        };

    const rect = geneoPanelDraftRect(
        start,
        current
    );

    draft.hidden = false;
    draft.style.left = `${rect.x - bounds.left}px`;
    draft.style.top = `${rect.y - bounds.top}px`;
    draft.style.width = `${rect.width}px`;
    draft.style.height = `${rect.height}px`;

    const shapePreview = state.geneoTool === 'shape';
    draft.classList.toggle('shape-preview', shapePreview);
    if (shapePreview)
    {
        const settings = geneoCreationToolSettings('shape');
        draft.style.setProperty('--geneo-node-bg', geneoPaintCssColor(settings.appearance.fill));
        draft.style.setProperty('--geneo-node-stroke', geneoPaintCssColor(settings.appearance.stroke));
        draft.style.setProperty('--geneo-node-stroke-width', String(settings.appearance.strokeWidth));
        draft.classList.toggle('stroke-dashed', settings.appearance.strokePattern === 'dashed');
        draft.querySelector('.geneo-shape-svg')?.remove();
        draft.insertAdjacentHTML('afterbegin', renderGeneographShapeContent({
            shapeKind: settings.shapeKind, width: Math.max(1, rect.width), height: Math.max(1, rect.height),
            appearance: settings.appearance
        }));
    }

    const size = draft.querySelector(
        '[data-geneo-panel-draft-size]'
    );

    if (size)
    {
        size.textContent =
            `${Math.round(rect.width)} × ${Math.round(rect.height)}`;
    }
}

function hideGeneographPanelDraftDom()
{
    const draft = main.querySelector(
        '[data-geneo-panel-draft]'
    );

    if (draft)
    {
        draft.hidden = true;
    }
}

function geneoPointToSegmentDistance(point, start, end)
{
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    if (!dx && !dy) return Math.hypot(point.x - start.x, point.y - start.y);
    const ratio = Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / (dx * dx + dy * dy)));
    return Math.hypot(point.x - (start.x + ratio * dx), point.y - (start.y + ratio * dy));
}

function simplifyGeneographDrawingPoints(points, tolerance)
{
    if (!Array.isArray(points) || points.length <= 2) return points ? [...points] : [];
    let farthestIndex = 0;
    let farthestDistance = 0;
    for (let index = 1; index < points.length - 1; index += 1)
    {
        const distance = geneoPointToSegmentDistance(points[index], points[0], points.at(-1));
        if (distance > farthestDistance)
        {
            farthestDistance = distance;
            farthestIndex = index;
        }
    }
    if (farthestDistance <= tolerance) return [points[0], points.at(-1)];
    const first = simplifyGeneographDrawingPoints(points.slice(0, farthestIndex + 1), tolerance);
    const second = simplifyGeneographDrawingPoints(points.slice(farthestIndex), tolerance);
    return [...first.slice(0, -1), ...second];
}

function geneoSmoothAbsolutePath(points)
{
    if (!Array.isArray(points) || points.length < 2) return '';
    const number = value => Number(value.toFixed(3));
    let path = `M ${number(points[0].x)} ${number(points[0].y)}`;
    for (let index = 1; index < points.length - 1; index += 1)
    {
        const point = points[index];
        const next = points[index + 1];
        path += ` Q ${number(point.x)} ${number(point.y)} ${number((point.x + next.x) / 2)} ${number((point.y + next.y) / 2)}`;
    }
    const last = points.at(-1);
    return `${path} L ${number(last.x)} ${number(last.y)}`;
}

function updateGeneographPencilPreview(points = [])
{
    const preview = main.querySelector('[data-geneo-pencil-preview]');
    if (!preview) return;
    const path = geneoSmoothAbsolutePath(points);
    preview.hidden = !path;
    preview.setAttribute('d', path);
}

function cancelGeneographPencilStroke()
{
    if (geneoPointerState?.kind !== 'pencil') return false;
    geneoDrawPanPending = false;
    const activeStroke = geneoPointerState;
    geneoPointerState = null;
    if (activeStroke.wrap?.hasPointerCapture?.(activeStroke.pointerId))
    {
        activeStroke.wrap.releasePointerCapture(activeStroke.pointerId);
    }
    updateGeneographPencilPreview();
    return true;
}

function createGeneographDrawingFromPoints(sourcePoints, beforeSnapshot = null)
{
    const diagram = selectedGeneographDiagram();
    const defaults = geneoNodeDefaults('drawing');
    const zoom = Math.max(.25, state.geneoZoom / 100);
    const points = simplifyGeneographDrawingPoints(sourcePoints, 1.5 / zoom);
    if (!diagram || points.length < 2) return null;
    const length = points.slice(1).reduce((total, point, index) => total + Math.hypot(point.x - points[index].x, point.y - points[index].y), 0);
    if (length < 4 / zoom) return null;
    const minX = Math.min(...points.map(point => point.x));
    const maxX = Math.max(...points.map(point => point.x));
    const minY = Math.min(...points.map(point => point.y));
    const maxY = Math.max(...points.map(point => point.y));
    const width = Math.max(defaults.minWidth, maxX - minX);
    const height = Math.max(defaults.minHeight, maxY - minY);
    const x = (minX + maxX) / 2 - width / 2;
    const y = (minY + maxY) / 2 - height / 2;
    const drawing = {
        id: createRuntimeId('geneo-node'),
        type: 'drawing',
        points: points.map(point => ({
            x: geneoNumber((point.x - x) / width, 0, 0, 1),
            y: geneoNumber((point.y - y) / height, 0, 0, 1)
        })),
        x,
        y,
        width,
        height,
        parentPanelId: null,
        order: Math.max(0, ...diagram.nodes.map(item => item.order || 0)) + 1,
        visible: true,
        locked: false,
        appearance: structuredClone(geneoCreationToolSettings('drawing').appearance)
    };
    if (beforeSnapshot) geneoPushHistorySnapshot(beforeSnapshot);
    else geneoPushHistory();
    diagram.nodes.push(drawing);
    drawing.parentPanelId = geneoContainingPanelForNode(drawing)?.id || null;
    selectGeneographNode(drawing.id);
    touchGeneographBoard();
    return drawing;
}

function createGeneographPanelFromRect(rect)
{
    const diagram = selectedGeneographDiagram();
    const defaults = geneoNodeDefaults('panel');

    if (
        !diagram
        || rect.width < defaults.minWidth
        || rect.height < defaults.minHeight
    )
    {
        return null;
    }

    geneoPushHistory();

    const panel = {
        id: createRuntimeId('geneo-node'),
        type: 'panel',
        title: 'New panel',
        description: '',
        x: snapGeneographCoordinate(rect.x),
        y: snapGeneographCoordinate(rect.y),
        width: rect.width,
        height: rect.height,
        parentPanelId: null,
        order:
          Math.max(
              0,
              ...diagram.nodes.map(item => item.order || 0)
          ) + 1,
        visible: true,
        locked: false,
        appearance: {
            ...defaults.appearance
        }
    };

    diagram.nodes.push(panel);

    reconcileGeneographPanelMembership(panel.id);
    selectGeneographNode(panel.id);
    touchGeneographBoard();

    return panel;
}

function createGeneographShapeFromRect(rect, { useDefaultSize = false } = {})
{
    const diagram = selectedGeneographDiagram();
    const defaults = geneoNodeDefaults('shape');
    if (!diagram || !rect) return null;
    const source = useDefaultSize
        ? {
            x: rect.x - defaults.width / 2,
            y: rect.y - defaults.height / 2,
            width: defaults.width,
            height: defaults.height
        }
        : rect;
    if (source.width < defaults.minWidth || source.height < defaults.minHeight) return null;
    const position = snapGeneographPoint({ x: source.x, y: source.y });
    const shape = {
        id: createRuntimeId('geneo-node'),
        type: 'shape',
        shapeKind: normalizeGeneographShapeKind(geneoCreationToolSettings('shape').shapeKind),
        x: position.x,
        y: position.y,
        width: Math.max(defaults.minWidth, snapGeneographCoordinate(source.width)),
        height: Math.max(defaults.minHeight, snapGeneographCoordinate(source.height)),
        parentPanelId: null,
        order: Math.max(0, ...diagram.nodes.map(item => item.order || 0)) + 1,
        visible: true,
        locked: false,
        appearance: structuredClone(geneoCreationToolSettings('shape').appearance)
    };
    geneoPushHistory();
    diagram.nodes.push(shape);
    shape.parentPanelId = geneoContainingPanelForNode(shape)?.id || null;
    selectGeneographNode(shape.id);
    touchGeneographBoard();
    return shape;
}

function createGeneographPlaceNode(placeRef)
{
    const diagram = selectedGeneographDiagram();
    const defaults = geneoNodeDefaults('place');
    if (!diagram || !placeRef) return null;
    const position = snapGeneographPoint(nextGeneoObjectPosition(defaults.width, defaults.height));
    const node = {
        id: createRuntimeId('geneo-node'),
        type: 'place',
        placeRef: structuredClone(placeRef),
        placeSizeMode: 'auto',
        x: position.x,
        y: position.y,
        width: defaults.width,
        height: defaults.height,
        parentPanelId: null,
        order: Math.max(0, ...diagram.nodes.map(item => item.order || 0)) + 1,
        visible: true,
        locked: false,
        appearance: structuredClone(defaults.appearance)
    };
    diagram.nodes.push(node);
    node.parentPanelId = geneoContainingPanelForNode(node)?.id || null;
    selectGeneographNode(node.id);
    return node;
}

