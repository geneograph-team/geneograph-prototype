function geneoRelationshipEditorFingerprint(editor)
{
    return JSON.stringify([...editor.querySelectorAll('input, select')]
        .filter(input => !input.matches('[data-geneo-show-relationship-dates]'))
        .map(input => [input.id, input.value, input.dataset.placeId || '', input.dataset.placeCoordinates || '']));
}

function saveGeneographPartnerRelationship(editor)
{
    const connection = selectedGeneographConnection();
    const family = connection?.kind === 'family-partner' ? getGeneographFamily(connection.familyId) : null;
    if (!connection || !family || !editor) return false;
    const relationshipType = editor.querySelector('[data-geneo-relationship-type]')?.value || 'Married';
    const definition = partnerRelationshipDefinition(relationshipType);
    const startDate = collectGenealogyDateField('geneoRelationshipStartDate');
    const endDate = definition.hasEnd ? collectGenealogyDateField('geneoRelationshipEndDate') : emptyGenealogyDate('Exact date');
    if (!startDate || (definition.hasEnd && !endDate))
    {
        return false;
    }
    if (definition.hasEnd && !partnerRelationshipDateOrderIsValid(startDate, endDate))
    {
        setGenealogyDateFieldError(editor.querySelector('[data-genealogy-date-field="geneoRelationshipEndDate"]'),
            'The relationship end date must be after or equal to the start date.');
        return false;
    }
    const beforeSnapshot = geneoSnapshot();
    const resolved = geneoRelationshipForFamily(family);
    if (!resolved.relationship)
    {
        showToast('The relationship could not be updated.'); return false;
    }
    const focusedId = editor.contains(document.activeElement) ? document.activeElement.id : '';
    geneoPushHistorySnapshot(beforeSnapshot);
    upsertPartnerRelationshipEvents(resolved.relationship, {
        relationshipType,
        marriageType: editor.querySelector('[data-geneo-marriage-type]')?.value || 'Civil',
        startDate,
        startPlace: readPlaceInputValue('[data-partner-relationship-start-place]', editor),
        endDate,
        endPlace: definition.hasEnd ? readPlaceInputValue('[data-partner-relationship-end-place]', editor) : { text: '', selectedPlaceId: '' }
    }, { resolvePlace: geneoResolveBoardPersonPlace });
    resolved.relationship.updatedAt = 'Just now';
    touchGeneographBoard();
    renderGeneographEditorPreserveScroll({ preserveInspectorScroll: true });
    if (focusedId) requestAnimationFrame(() => main.querySelector(`#${CSS.escape(focusedId)}`)?.focus({ preventScroll: true }));
    return true;
}

function bindGeneographInspectorNameField()
{
    const input =
        main.querySelector(
            '[data-geneo-entity-name]'
        );

    if (!input) return;

    const entityType =
        input.dataset.geneoEntityName;

    const entityId =
        input.dataset.geneoEntityId;

    input.addEventListener(
        'keydown',
        event =>
        {
            if (event.key === 'Enter')
            {
                event.preventDefault();
                event.stopPropagation();
                input.blur();
                return;
            }

            if (event.key !== 'Escape')
            {
                return;
            }

            event.preventDefault();
            event.stopPropagation();

            const entity =
                getGeneographRenameEntity(
                    entityType,
                    entityId
                );

            input.value =
                localizedDataFieldValue(
                    normalizeGeneographLayerName(
                        entity?.name
                    )
                );

            input.blur();
        }
    );

    input.addEventListener(
        'change',
        event =>
        {
            const changed =
                renameGeneographEntity(
                    entityType,
                    entityId,
                    collectLocalizedDataFieldValue(
                        event.target,
                        event.target.dataset
                            .geneoEntitySourceName
                    )
                );

            if (!changed) return;

            renderGeneographEditorPreserveScroll({
                preserveInspectorScroll: true
            });
        }
    );
}

function bindGeneographNodeHeader()
{
    const node = selectedGeneographNode();
    const connection = node ? null : selectedGeneographConnection();
    const entity = node || connection;
    const entityType = node ? 'node' : 'connection';
    if (!entity) return;
    const renameButton = main.querySelector('[data-geneo-header-rename]');
    const input = main.querySelector('[data-geneo-header-name-input]');
    const heading = main.querySelector('[data-geneo-header-name]');
    if (renameButton && input && heading)
    {
        renameButton.addEventListener('click', () =>
        {
            heading.hidden = true;
            input.hidden = false;
            input.focus({ preventScroll: true });
            input.select();
        });
        let finished = false;
        const finish = cancel =>
        {
            if (finished || input.hidden) return;
            finished = true;
            const originalName = normalizeGeneographLayerName(entity.name);
            const displayedName = localizedDataFieldValue(originalName || (node ? geneoNodeTitle(node) : geneoConnectionLabel(connection)));
            if (!cancel)
            {
                const nextName = input.value === displayedName
                    ? originalName
                    : collectLocalizedDataFieldValue(input, originalName);
                renameGeneographEntity(entityType, entity.id, nextName);
            }
            renderGeneographEditorPreserveScroll({ preserveInspectorScroll: true });
            requestAnimationFrame(() => main.querySelector('[data-geneo-header-rename]')?.focus({ preventScroll: true }));
        };
        input.addEventListener('keydown', event =>
        {
            if (!['Enter', 'Escape'].includes(event.key)) return;
            event.preventDefault();
            event.stopPropagation();
            finish(event.key === 'Escape');
        });
        input.addEventListener('blur', () => finish(false));
    }
    for (const [selector, key] of [['[data-geneo-header-lock]', 'locked'], ['[data-geneo-header-visible]', 'visible']])
    {
        main.querySelector(selector)?.addEventListener('click', () =>
        {
            const current = entityType === 'node' ? getGeneographNode(entity.id) : getGeneographConnection(entity.id);
            if (!current) return;
            geneoPushHistory();
            current[key] = !current[key];
            touchGeneographBoard();
            renderGeneographEditorPreserveScroll({ preserveInspectorScroll: true });
            requestAnimationFrame(() => main.querySelector(selector)?.focus({ preventScroll: true }));
        });
    }
}

function bindGeneographPersonCardControls()
{
    const diagram =
        selectedGeneographDiagram();

    if (!diagram) return;

    const commit = (
        scaleMap = null
    ) =>
    {
        diagram.personCardDefaults =
            normalizeGeneographPersonCardSettings(
                diagram.personCardDefaults
            );
        if (
            scaleMap instanceof Map
        )
        {
            geneoRestorePersonCardDimensions(
                scaleMap,
                diagram
            );
        }

        diagram.nodes
            .filter(
                node =>
                    node.type === 'person'
            )
            .forEach(
                node =>
                    ensureGeneographPersonCardSize(
                        node,
                        diagram
                    )
            );

        touchGeneographBoard();

        renderGeneographEditorPreserveScroll({
            preserveInspectorScroll: true,
            preserveSidebarScroll: true
        });
    };

    const ensureCustomNode =
        node =>
        {
            if (
                node?.type !== 'person'
            )
            {
                return null;
            }

            if (
                node.personCard?.custom
            !== true
            )
            {
                const heightMode =
                    node.personCard?.heightMode;

                node.personCard =
                    geneoEmptyPersonCardOverrides(
                        true,
                        heightMode
                    );
            }

            node.personCard.fields =
                node.personCard.fields
            || {};

            return node;
        };

    main.querySelectorAll('[data-geneo-person-font]').forEach(input => input.addEventListener('change', () =>
    {
        const key = input.dataset.geneoPersonFont;
        const value = Number(input.value);
        if (input.value.trim() === '' || !input.checkValidity() || !geneoValidPersonCardFontSize(key, value))
        {
            input.reportValidity();
            input.focus();
            return;
        }
        const scope = input.dataset.geneoPersonFontScope;
        if (scope === 'board')
        {
            const style = diagram.personCardDefaults.style;
            if (diagram.personCardDefaults.styleSettings[style][key] === value) return;
            geneoPushHistory();
            diagram.personCardDefaults.styleSettings[style][key] = value;
            commit();
            return;
        }
        const nodes = scope === 'multi'
            ? selectedGeneographNodes().filter(node => node.type === 'person')
            : [getGeneographNode(input.dataset.geneoPersonCardNode)].filter(node => node?.type === 'person');
        const changed = nodes.filter(node =>
        {
            const style = geneoPersonCardEffectiveSettings(node, diagram).style;
            return node.personCard?.styleSettings?.[style]?.[key] !== value;
        });
        if (!changed.length) return;
        geneoPushHistory();
        changed.forEach(node =>
        {
            ensureCustomNode(node);
            const style = geneoPersonCardEffectiveSettings(node, diagram).style;
            node.personCard.styleSettings ||= {};
            node.personCard.styleSettings[style] ||= { fields: {} };
            node.personCard.styleSettings[style][key] = value;
        });
        commit();
    }));

    const resetPersonFonts = (nodes, keys) =>
    {
        const changed = nodes.filter(node =>
        {
            const style = geneoPersonCardEffectiveSettings(node, diagram).style;
            return keys.some(key => geneoValidPersonCardFontSize(key, node.personCard?.styleSettings?.[style]?.[key]));
        });
        if (!changed.length) return;
        geneoPushHistory();
        changed.forEach(node =>
        {
            const style = geneoPersonCardEffectiveSettings(node, diagram).style;
            keys.forEach(key => { node.personCard.styleSettings[style][key] = null; });
        });
        commit();
    };
    main.querySelectorAll('[data-geneo-person-font-reset]').forEach(button => button.addEventListener('click', () =>
        resetPersonFonts([getGeneographNode(button.dataset.geneoPersonCardNode)].filter(node => node?.type === 'person'),
            [button.dataset.geneoPersonFontReset])));
    main.querySelectorAll('[data-geneo-person-font-multi-reset]').forEach(button => button.addEventListener('click', () =>
        resetPersonFonts(selectedGeneographNodes().filter(node => node.type === 'person'),
            [button.dataset.geneoPersonFontMultiReset])));
    main.querySelectorAll('[data-geneo-person-font-board-reset]').forEach(button => button.addEventListener('click', () =>
    {
        const style = diagram.personCardDefaults.style;
        const key = button.dataset.geneoPersonFontBoardReset;
        if (!Object.hasOwn(GENEO_PERSON_CARD_FONT_RANGES, key)) return;
        const current = diagram.personCardDefaults.styleSettings[style];
        const value = GENEO_PERSON_CARD_FONT_DEFAULTS[style][key];
        if (current[key] === value) return;
        geneoPushHistory();
        current[key] = value;
        commit();
    }));

    main
        .querySelectorAll(
            '[data-geneo-person-card-style]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () =>
                {
                    const value =
                        button.dataset
                            .geneoPersonCardStyle;

                    const scope =
                        button.dataset
                            .geneoPersonCardScope;

                    if (
                        !geneoPersonCardSettingValueIsValid(
                            'style',
                            value
                        )
                    )
                    {
                        return;
                    }

                    if (scope === 'multi')
                    {
                        const nodes = selectedGeneographNodes().filter(node => node.type === 'person');
                        if (!nodes.length || nodes.every(node =>
                            geneoPersonCardEffectiveSettings(node, diagram).style === value)) return;
                        const scales = geneoCapturePersonCardDimensions(nodes, diagram);
                        geneoPushHistory();
                        nodes.forEach(node =>
                        {
                            ensureCustomNode(node);
                            node.personCard.style = value === diagram.personCardDefaults.style ? null : value;
                        });
                        commit(scales);
                        return;
                    }

                    if (scope === 'board')
                    {
                        if (
                            diagram
                                .personCardDefaults
                                .style
                  === value
                        )
                        {
                            return;
                        }

                        const scales =
                            geneoCapturePersonCardDimensions(
                                diagram.nodes,
                                diagram
                            );

                        geneoPushHistory();

                        const previousStyle =
                            diagram.personCardDefaults.style;

                        const photoByStyle = {
                            ...geneoPersonCardDefaultPhotoPreferences(),
                            ...diagram.personCardDefaults
                                .photoByStyle
                        };

                        photoByStyle[previousStyle] =
                            diagram.personCardDefaults
                                .fields.photo;

                        diagram.personCardDefaults
                            .photoByStyle = photoByStyle;

                        diagram.personCardDefaults
                            .fields.photo =
                                photoByStyle[value];

                        diagram
                            .personCardDefaults
                            .style =
                                value;

                        commit(scales);
                        return;
                    }

                    const node =
                        getGeneographNode(
                            button.dataset
                                .geneoPersonCardNode
                        );

                    if (node?.type !== 'person')
                    {
                        return;
                    }

                    const effective =
                        geneoPersonCardEffectiveSettings(
                            node,
                            diagram
                        );

                    if (
                        effective.style === value
                    )
                    {
                        return;
                    }

                    const scales =
                        geneoCapturePersonCardDimensions(
                            [node],
                            diagram
                        );

                    geneoPushHistory();
                    ensureCustomNode(node);

                    const boardValue =
                        diagram
                            .personCardDefaults
                            .style;

                    node.personCard.style =
                        value === boardValue
                            ? null
                            : value;

                    commit(scales);
                }
            );
        });

    main
        .querySelector(
            '[data-geneo-person-card-reset]'
        )
        ?.addEventListener(
            'click',
            event =>
            {
                const node =
                    getGeneographNode(
                        event.target.dataset
                            .geneoPersonCardNode
                    );

                if (
                    node?.type !== 'person'
                )
                {
                    return;
                }

                if (!geneoPersonHasResettableSettings(node))
                {
                    return;
                }

                geneoPushHistory();
                geneoResetPersonCardSettings(node, diagram);
                commit();
            }
        );

    main.querySelector('[data-geneo-node-appearance-reset]')?.addEventListener('click', event =>
    {
        const node = getGeneographNode(event.currentTarget.dataset.geneoNodeAppearanceReset);
        if (!node || node.type === 'person' || geneoNodeAppearanceIsDefault(node)) return;
        geneoPushHistory();
        node.appearance = structuredClone(geneoNodeDefaults(node.type).appearance);
        touchGeneographBoard();
        renderGeneographEditorPreserveScroll({ preserveInspectorScroll: true });
    });

    main
        .querySelectorAll(
            '[data-geneo-person-card-setting]'
        )
        .forEach(select =>
        {
            select.addEventListener(
                'change',
                () =>
                {
                    const key =
                        select.dataset
                            .geneoPersonCardSetting;

                    const scope =
                        select.dataset
                            .geneoPersonCardScope;

                    const value =
                        select.value;

                    if (
                        !geneoPersonCardSettingValueIsValid(
                            key,
                            value
                        )
                    )
                    {
                        return;
                    }

                    if (scope === 'board')
                    {
                        if (
                            normalizeGeneographPersonCardSettings(
                                diagram.personCardDefaults
                            ).styleSettings[diagram.personCardDefaults.style][key] === value
                        )
                        {
                            return;
                        }

                        geneoPushHistory();

                        diagram.personCardDefaults
                            .styleSettings[diagram.personCardDefaults.style][key] = value;

                        commit();
                        return;
                    }

                    const node =
                        getGeneographNode(
                            select.dataset
                                .geneoPersonCardNode
                        );

                    if (node?.type !== 'person')
                    {
                        return;
                    }

                    const effective =
                        geneoPersonCardEffectiveSettings(
                            node
                        );

                    if (
                        effective[key] === value
                    )
                    {
                        return;
                    }

                    geneoPushHistory();
                    ensureCustomNode(node);

                    const style = effective.style;
                    const boardValue = normalizeGeneographPersonCardSettings(
                        diagram.personCardDefaults
                    ).styleSettings[style][key];
                    node.personCard.styleSettings ||= {};
                    node.personCard.styleSettings[style] ||= { fields: {} };
                    node.personCard.styleSettings[style][key] =
                        value === boardValue ? null : value;

                    commit();
                }
            );
        });

    main
        .querySelectorAll(
            '[data-geneo-person-card-field]'
        )
        .forEach(input =>
        {
            input.addEventListener(
                'change',
                () =>
                {
                    const field =
                        input.dataset
                            .geneoPersonCardField;

                    const scope =
                        input.dataset
                            .geneoPersonCardScope;

                    if (
                        !Object.hasOwn(
                            geneoDefaultPersonCardSettings()
                                .fields,
                            field
                        )
                    )
                    {
                        return;
                    }

                    if (scope === 'board')
                    {
                        const current =
                            diagram
                                .personCardDefaults
                                .fields[field];

                        if (
                            current
                  === input.checked
                        )
                        {
                            return;
                        }

                        geneoPushHistory();

                        diagram.personCardDefaults.fields[field] = input.checked;
                        if (field !== 'linkIndicator')
                            diagram.personCardDefaults.styleSettings[
                                diagram.personCardDefaults.style
                            ].fields[field] = input.checked;

                        if (field === 'photo')
                        {
                            diagram.personCardDefaults
                                .photoByStyle = {
                                    ...geneoPersonCardDefaultPhotoPreferences(),
                                    ...diagram.personCardDefaults
                                        .photoByStyle,
                                    [diagram.personCardDefaults.style]:
                        input.checked
                                };
                        }

                        commit();
                        return;
                    }

                    const node =
                        getGeneographNode(
                            input.dataset
                                .geneoPersonCardNode
                        );

                    if (node?.type !== 'person')
                    {
                        return;
                    }

                    const effective =
                        geneoPersonCardEffectiveSettings(
                            node
                        );

                    if (
                        effective.fields[field]
                === input.checked
                    )
                    {
                        return;
                    }

                    geneoPushHistory();
                    ensureCustomNode(node);

                    node.personCard.fields =
                        node.personCard.fields
                || {};

                    const boardSettings =
                        normalizeGeneographPersonCardSettings(
                            diagram.personCardDefaults
                        );

                    const boardValue = boardSettings.styleSettings[
                        effective.style
                    ].fields[field];

                    node.personCard.styleSettings ||= {};
                    node.personCard.styleSettings[effective.style] ||= { fields: {} };
                    const styleFields = node.personCard.styleSettings[
                        effective.style
                    ].fields;

                    if (field === 'photo')
                    {
                        node.personCard.photoByStyle =
                            node.personCard.photoByStyle
                  || {};

                        delete styleFields.photo;

                        if (input.checked === boardValue)
                        {
                            delete node.personCard
                                .photoByStyle[
                                    effective.style
                                ];
                        }
                        else
                        {
                            node.personCard
                                .photoByStyle[
                                    effective.style
                                ] = input.checked;
                        }
                    }
                    else if (
                        input.checked === boardValue
                    )
                    {
                        delete styleFields[field];
                    }
                    else
                    {
                        styleFields[field] = input.checked;
                    }

                    commit();
                }
            );
        });

    main
        .querySelectorAll(
            '[data-geneo-person-card-radius]'
        )
        .forEach(input =>
        {
            input.addEventListener(
                'change',
                () =>
                {
                    const radius =
                        Math.round(
                            geneoNumber(
                                input.value,
                                8,
                                0,
                                32
                            )
                        );

                    const scope =
                        input.dataset
                            .geneoPersonCardRadius;

                    if (scope === 'board')
                    {
                        if (
                            diagram
                                .personCardDefaults
                                .cornerRadius
                  === radius
                        )
                        {
                            return;
                        }

                        geneoPushHistory();

                        diagram
                            .personCardDefaults
                            .cornerRadius =
                                radius;

                        commit();
                        return;
                    }

                    const node =
                        getGeneographNode(
                            input.dataset
                                .geneoPersonCardNode
                        );

                    if (node?.type !== 'person')
                    {
                        return;
                    }

                    if (
                        geneoPersonCardEffectiveSettings(
                            node
                        ).cornerRadius
                === radius
                    )
                    {
                        return;
                    }

                    geneoPushHistory();
                    ensureCustomNode(node);

                    const boardRadius =
                        geneoCardAppearanceForNode(node, diagram)?.cornerRadius
                        ?? diagram.personCardDefaults.cornerRadius;

                    node.personCard
                        .cornerRadius =
                            radius === boardRadius
                                ? null
                                : radius;

                    commit();
                }
            );
        });

    /*
       * Multi-person presentation controls.
       */
    main
        .querySelectorAll(
            '[data-geneo-person-multi-field]'
        )
        .forEach(input =>
        {
            input.indeterminate =
                input.dataset.mixed
            === 'true';

            input.addEventListener(
                'change',
                () =>
                {
                    const nodes =
                        selectedGeneographNodes()
                            .filter(
                                node =>
                                    node.type
                      === 'person'
                            );

                    if (!nodes.length) return;

                    const field =
                        input.dataset
                            .geneoPersonMultiField;

                    if (
                        !Object.hasOwn(
                            geneoDefaultPersonCardSettings()
                                .fields,
                            field
                        )
                    )
                    {
                        return;
                    }

                    geneoPushHistory();

                    nodes.forEach(node =>
                    {
                        ensureCustomNode(node);

                        const effective =
                            geneoPersonCardEffectiveSettings(
                                node,
                                diagram
                            );

                        const boardSettings =
                            normalizeGeneographPersonCardSettings(
                                diagram.personCardDefaults
                            );

                        const boardValue = boardSettings.styleSettings[
                            effective.style
                        ].fields[field];
                        node.personCard.styleSettings ||= {};
                        node.personCard.styleSettings[effective.style] ||= { fields: {} };
                        const styleFields = node.personCard.styleSettings[
                            effective.style
                        ].fields;

                        if (field === 'photo')
                        {
                            node.personCard.photoByStyle =
                                node.personCard.photoByStyle
                    || {};

                            delete styleFields.photo;

                            if (input.checked === boardValue)
                            {
                                delete node.personCard
                                    .photoByStyle[
                                        effective.style
                                    ];
                            }
                            else
                            {
                                node.personCard
                                    .photoByStyle[
                                        effective.style
                                    ] = input.checked;
                            }
                        }
                        else if (
                            input.checked === boardValue
                        )
                        {
                            delete styleFields[field];
                        }
                        else
                        {
                            styleFields[field] = input.checked;
                        }
                    });

                    commit();
                }
            );
        });

    main
        .querySelectorAll(
            '[data-geneo-person-multi-setting]'
        )
        .forEach(select =>
        {
            select.addEventListener(
                'change',
                () =>
                {
                    const value =
                        select.value;

                    const key =
                        select.dataset
                            .geneoPersonMultiSetting;

                    if (
                        !value
                || !geneoPersonCardSettingValueIsValid(
                    key,
                    value
                )
                    )
                    {
                        return;
                    }

                    const nodes =
                        selectedGeneographNodes()
                            .filter(
                                node =>
                                    node.type
                      === 'person'
                            );

                    if (!nodes.length) return;

                    const scales =
                        geneoCapturePersonCardDimensions(
                            nodes,
                            diagram
                        );

                    geneoPushHistory();

                    nodes.forEach(node =>
                    {
                        ensureCustomNode(node);

                        if (key === 'style')
                        {
                            node.personCard.style =
                                value === diagram.personCardDefaults.style
                                    ? null : value;
                        }
                        else
                        {
                            const style = geneoPersonCardEffectiveSettings(node, diagram).style;
                            const boardValue = normalizeGeneographPersonCardSettings(
                                diagram.personCardDefaults
                            ).styleSettings[style][key];
                            node.personCard.styleSettings ||= {};
                            node.personCard.styleSettings[style] ||= { fields: {} };
                            node.personCard.styleSettings[style][key] =
                                value === boardValue ? null : value;
                        }
                    });

                    commit(scales);
                }
            );
        });

    main.querySelector('[data-geneo-person-multi-reset]')?.addEventListener('click', () =>
    {
        const nodes = selectedGeneographNodes().filter(geneoPersonHasResettableSettings);
        if (!nodes.length) return;
        geneoPushHistory();
        nodes.forEach(node => geneoResetPersonCardSettings(node, diagram));
        commit();
    });
}

function bindGeneographPersonMultiAppearance()
{
    const diagram = selectedGeneographDiagram();
    if (!diagram) return;
    const selected = () => selectedGeneographNodes().filter(node => node.type === 'person');
    const commit = update =>
    {
        const nodes = selected();
        if (!nodes.length) return;
        geneoPushHistory();
        nodes.forEach(node => update(node));
        touchGeneographBoard();
        renderGeneographEditorPreserveScroll({
            preserveInspectorScroll: true, preserveSidebarScroll: true
        });
    };
    const updatePaint = (property, field, value) => commit(node =>
    {
        const appearance = geneoResolveVisibleNodeAppearance(node);
        node.appearance[property] = { ...appearance[property], [field]: value };
        node.appearance.paintOverrides ||= { fill: false, stroke: false, text: false };
        node.appearance.paintOverrides[property] = true;
    });

    main.querySelectorAll('[data-geneo-person-multi-paint-hex]')
        .forEach(input => input.addEventListener('change', () =>
        {
            const value = input.value.trim();
            if (!/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value))
            {
                input.setCustomValidity(t('Enter a valid hex color.'));
                input.reportValidity();
                input.focus();
                return;
            }
            input.setCustomValidity('');
            updatePaint(input.dataset.geneoPersonMultiPaintHex, 'color', normalizeGeneoHexColor(value));
        }));
    main.querySelectorAll('[data-geneo-person-multi-paint-opacity]')
        .forEach(input => input.addEventListener('change', () =>
        {
            if (input.value.trim() === '' || !input.checkValidity())
            {
                input.reportValidity();
                input.focus();
                return;
            }
            updatePaint(input.dataset.geneoPersonMultiPaintOpacity, 'opacity', Number(input.value));
        }));
    main.querySelectorAll('[data-geneo-person-multi-paint-toggle]')
        .forEach(button => button.addEventListener('click', () =>
        {
            const property = button.dataset.geneoPersonMultiPaintToggle;
            const enabled = selected().every(node =>
                geneoResolveVisibleNodeAppearance(node)[property].enabled === false);
            updatePaint(property, 'enabled', enabled);
        }));
    main.querySelectorAll('[data-geneo-person-multi-appearance]')
        .forEach(input => input.addEventListener('change', () =>
        {
            const key = input.dataset.geneoPersonMultiAppearance;
            let value = input.value;
            if (key === 'strokePattern')
            {
                if (!['solid', 'dashed'].includes(value)) return;
            }
            else
            {
                if (value.trim() === '' || !input.checkValidity())
                {
                    input.reportValidity();
                    input.focus();
                    return;
                }
                value = Number(value);
            }
            commit(node =>
            {
                if (key === 'cornerRadius')
                {
                    node.personCard = normalizeGeneographPersonCardOverrides(node.personCard);
                    node.personCard.custom = true;
                    const boardRadius = geneoCardAppearanceForNode(node, diagram)?.cornerRadius
                        ?? diagram.personCardDefaults.cornerRadius;
                    node.personCard.cornerRadius = value === boardRadius ? null : value;
                }
                else
                {
                    node.appearance[key] = value;
                    node.appearance.styleOverrides ||= { strokeWidth: false, strokePattern: false };
                    node.appearance.styleOverrides[key] = true;
                }
            });
        }));
    main.querySelector('[data-geneo-person-multi-apply-gender]')?.addEventListener('click', () =>
        commit(node => geneoApplyPersonGenderAppearance(node, diagram)));
}

function geneoUpdateBulkNodeAppearance(node, property, field, value, diagram)
{
    if (property === 'fontSize' && node.type === 'place' && node.appearance.fontSize !== value)
    {
        node.placeSizeMode = 'manual';
    }
    if (property === 'cornerRadius' && node.type === 'person')
    {
        node.personCard = normalizeGeneographPersonCardOverrides(node.personCard);
        node.personCard.custom = true;
        const inherited = geneoCardAppearanceForNode(node, diagram)?.cornerRadius
            ?? diagram.personCardDefaults.cornerRadius;
        node.personCard.cornerRadius = value === inherited ? null : value;
        return;
    }
    if (field)
    {
        const paint = geneoBulkNodeValue(node, property);
        node.appearance[property] = { ...paint, [field]: value };
        node.appearance.paintOverrides ||= { fill: false, stroke: false, text: false };
        node.appearance.paintOverrides[property] = true;
        return;
    }
    node.appearance[property] = value;
    if (node.type === 'person' && ['strokeWidth', 'strokePattern'].includes(property))
    {
        node.appearance.styleOverrides ||= { strokeWidth: false, strokePattern: false };
        node.appearance.styleOverrides[property] = true;
    }
}

function geneoResetBulkNodeAppearance(node, diagram)
{
    if (node.type !== 'person')
    {
        node.appearance = structuredClone(geneoNodeDefaults(node.type).appearance);
        return;
    }
    const inherited = geneoPersonGenderAppearance(node, diagram);
    for (const key of ['fill', 'stroke', 'text']) node.appearance[key] = structuredClone(inherited[key]);
    node.appearance.strokeWidth = inherited.strokeWidth;
    node.appearance.strokePattern = inherited.strokePattern;
    node.appearance.shadowEnabled = null;
    node.appearance.paintOverrides = { fill: false, stroke: false, text: false };
    node.appearance.styleOverrides = { strokeWidth: false, strokePattern: false };
    node.personCard = normalizeGeneographPersonCardOverrides(node.personCard);
    node.personCard.cornerRadius = null;
}

function geneoApplyBulkArrangement(nodes, command)
{
    const roots = geneoBulkArrangeRoots(nodes);
    if (roots.length < 2) return;
    const x = command === 'distributeX' || ['left', 'centerX', 'right'].includes(command);
    const ordered = [...roots].sort((a, b) => (x ? a.x - b.x : a.y - b.y));
    const first = ordered[0];
    const last = ordered.at(-1);
    const position = new Map();
    if (command.startsWith('distribute'))
    {
        const start = x ? first.x : first.y;
        const end = x ? last.x + last.width : last.y + last.height;
        const total = ordered.reduce((sum, node) => sum + (x ? node.width : node.height), 0);
        const gap = Math.max(20, (end - start - total) / (ordered.length - 1));
        let cursor = start;
        ordered.forEach((node, index) =>
        {
            if (index > 0) position.set(node.id, cursor);
            cursor += (x ? node.width : node.height) + gap;
        });
    }
    else
    {
        const left = Math.min(...roots.map(node => node.x));
        const right = Math.max(...roots.map(node => node.x + node.width));
        const top = Math.min(...roots.map(node => node.y));
        const bottom = Math.max(...roots.map(node => node.y + node.height));
        roots.forEach(node => position.set(node.id, ({
            left, centerX: (left + right - node.width) / 2, right: right - node.width,
            top, centerY: (top + bottom - node.height) / 2, bottom: bottom - node.height
        })[command]));
    }
    const moves = new Map();
    roots.forEach(root =>
    {
        const target = position.get(root.id);
        if (target === undefined) return;
        const dx = x ? target - root.x : 0;
        const dy = x ? 0 : target - root.y;
        if (!dx && !dy) return;
        geneoObjectGroupNodes([root.id]).forEach(node =>
        {
            if (!geneoNodeEffectiveLocked(node)) moves.set(node.id, { dx, dy });
        });
    });
    if (!moves.size) return;
    const diagram = selectedGeneographDiagram();
    geneoPushHistory();
    diagram.connections.forEach(connection =>
    {
        if (connection.route?.mode !== 'manual') return;
        const sourceNodes = geneoConnectionReferenceNodes(connection.source);
        const targetNodes = geneoConnectionReferenceNodes(connection.target);
        const endpoints = [...sourceNodes, ...targetNodes];
        if (!endpoints.length || !endpoints.every(node => moves.has(node.id))) return;
        const delta = moves.get(endpoints[0].id);
        if (!endpoints.every(node => moves.get(node.id).dx === delta.dx && moves.get(node.id).dy === delta.dy)) return;
        connection.route.waypoints.forEach(point => { point.x += delta.dx; point.y += delta.dy; });
    });
    moves.forEach(({ dx, dy }, id) =>
    {
        const node = getGeneographNode(id);
        node.x += dx;
        node.y += dy;
    });
    touchGeneographBoard();
    renderGeneographEditorPreserveScroll({ preserveInspectorScroll: true, preserveSidebarScroll: true });
}

function bindGeneographGenericBulkControls()
{
    const selected = () => selectedGeneographNodes();
    const commitAppearance = (property, field, value) =>
    {
        const nodes = selected();
        const diagram = selectedGeneographDiagram();
        if (!diagram || !nodes.length || nodes.some(node => !geneoBulkNodeSupports(node, property))) return;
        if (nodes.every(node => geneoBulkNodeValue(node, property, field) === value)) return;
        geneoPushHistory();
        nodes.forEach(node => geneoUpdateBulkNodeAppearance(node, property, field, value, diagram));
        touchGeneographBoard();
        renderGeneographEditorPreserveScroll({ preserveInspectorScroll: true, preserveSidebarScroll: true });
    };
    main.querySelectorAll('[data-geneo-bulk-paint-hex]').forEach(input => input.addEventListener('change', () =>
    {
        if (!/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.test(input.value.trim()))
        {
            input.setCustomValidity(t('Enter a valid hex color.'));
            input.reportValidity();
            return;
        }
        input.setCustomValidity('');
        commitAppearance(input.dataset.geneoBulkPaintHex, 'color', normalizeGeneoHexColor(input.value));
    }));
    main.querySelectorAll('[data-geneo-bulk-paint-opacity]').forEach(input => input.addEventListener('change', () =>
    {
        if (input.value.trim() === '' || !input.checkValidity()) { input.reportValidity(); return; }
        commitAppearance(input.dataset.geneoBulkPaintOpacity, 'opacity', Number(input.value));
    }));
    main.querySelectorAll('[data-geneo-bulk-paint-toggle]').forEach(button => button.addEventListener('click', () =>
    {
        const property = button.dataset.geneoBulkPaintToggle;
        commitAppearance(property, 'enabled', selected().every(node =>
            geneoBulkNodeValue(node, property, 'enabled') === false));
    }));
    main.querySelectorAll('[data-geneo-bulk-appearance]').forEach(input => input.addEventListener('change', () =>
    {
        const property = input.dataset.geneoBulkAppearance;
        if (property === 'strokePattern')
        {
            if (['solid', 'dashed'].includes(input.value)) commitAppearance(property, '', input.value);
            return;
        }
        if (input.value.trim() === '' || !input.checkValidity()) { input.reportValidity(); return; }
        commitAppearance(property, '', Number(input.value));
    }));
    main.querySelector('[data-geneo-bulk-shape-kind]')?.addEventListener('change', event =>
    {
        const nodes = selected();
        const kind = event.currentTarget.value;
        if (!nodes.length || !nodes.every(node => node.type === 'shape')
            || !GENEO_SHAPE_KINDS.some(shape => shape.id === kind)
            || nodes.every(node => node.shapeKind === kind)) return;
        geneoPushHistory();
        nodes.forEach(node => { node.shapeKind = kind; });
        touchGeneographBoard();
        renderGeneographEditorPreserveScroll({ preserveInspectorScroll: true, preserveSidebarScroll: true });
    });
    main.querySelector('[data-geneo-bulk-node-reset]')?.addEventListener('click', () =>
    {
        const nodes = selected();
        if (!nodes.length || !nodes.some(geneoBulkNodeAppearanceIsDefault)) return;
        geneoPushHistory();
        const diagram = selectedGeneographDiagram();
        nodes.forEach(node => geneoResetBulkNodeAppearance(node, diagram));
        touchGeneographBoard();
        renderGeneographEditorPreserveScroll({ preserveInspectorScroll: true, preserveSidebarScroll: true });
    });
    main.querySelectorAll('[data-geneo-bulk-arrange]').forEach(button => button.addEventListener('click', () =>
        geneoApplyBulkArrangement(selected(), button.dataset.geneoBulkArrange)));
    main.querySelectorAll('[data-geneo-bulk-action]').forEach(button => button.addEventListener('click', () =>
    {
        const action = button.dataset.geneoBulkAction;
        const nodes = selected();
        const connections = selectedGeneographConnections();
        const targets = action === 'lock' || action === 'unlock' ? geneoObjectGroupNodes()
            : [...geneoObjectGroupNodes(), ...connections];
        const property = action === 'show' || action === 'hide' ? 'visible' : 'locked';
        const value = action === 'show' || action === 'lock';
        if ((!nodes.length && !connections.length) || !targets.length
            || targets.every(item => item[property] === value)) return;
        geneoPushHistory();
        targets.forEach(item => { item[property] = value; });
        touchGeneographBoard();
        renderGeneographEditorPreserveScroll({ preserveInspectorScroll: true, preserveSidebarScroll: true });
    }));
}

const GENEO_CANVAS_CLICK_DRAG_THRESHOLD = 6;

const GENEO_CANVAS_INTERACTIVE_SELECTOR = [
    'button',
    'input',
    'textarea',
    'select',
    'a',
    '[contenteditable]',
    '.rich-text-toolbar',
    '.ql-tooltip',
    '[data-geneo-node]',
    '.geneo-connection-hit',
    '.geneo-segment-hit',
    '[data-geneo-waypoint]',
    '[data-geneo-family-junction]'
].join(',');

function geneographCanvasTargetIsInteractive(
    target
)
{
    const element =
        target instanceof Element
            ? target
            : target?.parentElement || null;

    return Boolean(
        element?.closest(
            GENEO_CANVAS_INTERACTIVE_SELECTOR
        )
    );
}

function bindGeneographIntentionalCanvasClick(
    wrap
)
{
    if (!wrap) return;

    const thresholdSquared =
        GENEO_CANVAS_CLICK_DRAG_THRESHOLD
        * GENEO_CANVAS_CLICK_DRAG_THRESHOLD;

    let gesture = null;
    let allowNextCanvasClick = false;

    const removeWindowListeners = () =>
    {
        window.removeEventListener(
            'pointermove',
            handlePointerMove,
            true
        );

        window.removeEventListener(
            'pointerup',
            handlePointerUp,
            true
        );

        window.removeEventListener(
            'pointercancel',
            handlePointerCancel,
            true
        );
    };

    const resetGesture = () =>
    {
        gesture = null;
        removeWindowListeners();
    };

    const handlePointerMove = event =>
    {
        if (
            !gesture ||
          event.pointerId !== gesture.pointerId
        )
        {
            return;
        }

        const deltaX =
            event.clientX - gesture.startX;

        const deltaY =
            event.clientY - gesture.startY;

        if (
            deltaX * deltaX + deltaY * deltaY >
          thresholdSquared
        )
        {
            gesture.moved = true;
        }
    };

    const finishPointerGesture = (
        event,
        cancelled = false
    ) =>
    {
        if (
            !gesture ||
          event.pointerId !== gesture.pointerId
        )
        {
            return;
        }

        const deltaX =
            event.clientX - gesture.startX;

        const deltaY =
            event.clientY - gesture.startY;

        const exceededThreshold =
            gesture.moved ||
          deltaX * deltaX + deltaY * deltaY >
            thresholdSquared;

        allowNextCanvasClick =
            !cancelled &&
          gesture.startedOnEmptyCanvas &&
          !geneographCanvasTargetIsInteractive(
              event.target
          ) &&
          !exceededThreshold;

        resetGesture();
    };

    function handlePointerUp(event)
    {
        finishPointerGesture(
            event,
            false
        );
    }

    function handlePointerCancel(event)
    {
        finishPointerGesture(
            event,
            true
        );
    }

    /*
       * Capture phase records the true pointer origin before
       * a node, Quill, or another board control can stop the
       * event from propagating.
       */
    wrap.addEventListener(
        'pointerdown',
        event =>
        {
            allowNextCanvasClick = false;
            resetGesture();

            if (
                event.button !== 0 ||
            event.isPrimary === false
            )
            {
                return;
            }

            gesture = {
                pointerId: event.pointerId,
                startX: event.clientX,
                startY: event.clientY,
                startedOnEmptyCanvas:
              !geneographCanvasTargetIsInteractive(
                  event.target
              ),
                moved: false
            };

            /*
           * Window listeners let the gesture finish safely
           * even when the pointer leaves the original node.
           * They do not prevent defaults or capture the pointer.
           */
            window.addEventListener(
                'pointermove',
                handlePointerMove,
                true
            );

            window.addEventListener(
                'pointerup',
                handlePointerUp,
                true
            );

            window.addEventListener(
                'pointercancel',
                handlePointerCancel,
                true
            );
        },
        true
    );

    wrap.addEventListener(
        'click',
        event =>
        {
            const intentionalCanvasClick =
                allowNextCanvasClick;

            /*
           * Consume the authorization once. A later synthetic
           * or unrelated click must not inherit it.
           */
            allowNextCanvasClick = false;

            if (
                !intentionalCanvasClick ||
            geneoCanvasRuntime.suppressNodeClick ||
            geneographCanvasTargetIsInteractive(
                event.target
            )
            )
            {
                return;
            }

            if (geneoImageCropRuntime)
            {
                if (event.detail === 2)
                {
                    event.preventDefault();
                    geneoFinishImageCrop(true, { restoreFocus: false });
                }
                return;
            }

            if (
                geneoEffectiveCanvasTool() === 'connect'
            )
            {
            /*
             * Preserve the existing connect-mode behavior:
             * the first empty-canvas click remains inert and
             * the second click in a double-click exits to Pan.
             */
                if (event.detail !== 2)
                {
                    return;
                }

                event.preventDefault();

                exitGeneographConnectionTool();
                return;
            }

            const hadSelection =
                Boolean(
                    state.selectedGeneoNodeId
              || state.selectedGeneoConnectionId
              || state.selectedGeneoNodeIds
                  .length
              || state
                  .selectedGeneoConnectionIds
                  .length
              || Number.isInteger(
                  state.selectedGeneoWaypointIndex
              )
                );

            const hadConnectionDraft =
                Boolean(
                    state.geneoConnectionDraft
                );

            selectGeneographCanvas();
            cancelGeneographConnectionDraft();

            /*
           * Clicking an already selected Canvas is a no-op.
           * Avoid recreating the inspector and losing its
           * current scroll position.
           */
            if (
                !hadSelection
            && !hadConnectionDraft
            )
            {
                return;
            }

            renderGeneographEditorPreserveScroll({
                preserveInspectorScroll: true,
                preserveSidebarScroll: true
            });
        }
    );
}

function refreshGeneoConnectionToolUi()
{
    const style = geneoConnectionToolStyle();
    const panel = main.querySelector('[data-geneo-connection-panel]');
    const pattern = panel?.querySelector('[data-geneo-connection-tool-pattern]');
    const arrows = panel?.querySelector('[data-geneo-connection-tool-arrows]');
    const swatch = panel?.querySelector('[data-geneo-connection-tool-swatch]');
    const width = panel?.querySelector('[data-geneo-connection-tool-width]');
    if (pattern)
    {
        pattern.querySelector('.geneo-line-sample')?.replaceWith(...new DOMParser().parseFromString(renderGeneoConnectionLineSample(style.pattern), 'text/html').body.children);
        pattern.title = t(GENEO_CONNECTION_PATTERN_LABELS[style.pattern]);
        pattern.setAttribute('aria-label', `${t('Pattern')}: ${pattern.title}`);
    }
    if (arrows)
    {
        arrows.querySelector('.geneo-line-sample')?.replaceWith(...new DOMParser().parseFromString(renderGeneoConnectionArrowSample(style.arrows), 'text/html').body.children);
        arrows.title = `${t('Arrowheads')}: ${t(capitalize(style.arrows))}`;
        arrows.setAttribute('aria-label', arrows.title);
    }
    if (swatch)
    {
        swatch.setAttribute('style', geneoPaintSwatchStyle(style.line));
        swatch.setAttribute('aria-label', `${t('Connection color')}: ${style.line.color}`);
    }
    if (width) width.value = style.width;
    const mainButton = main.querySelector('[data-geneo-connection-main]');
    if (mainButton)
    {
        const title = `${t('Connect')}: ${t(GENEO_CONNECTION_PATTERN_LABELS[style.pattern])}`;
        mainButton.title = title;
        mainButton.setAttribute('aria-label', title);
    }
    const preview = main.querySelector('[data-geneo-connection-preview]');
    if (preview)
    {
        preview.style.stroke = geneoPaintCssColor(style.line);
        preview.style.strokeWidth = String(style.width);
        preview.style.strokeDasharray = geneoConnectionDashArray(style.pattern, style.width) || 'none';
        for (const end of ['start', 'end'])
        {
            const active = style.arrows === end || style.arrows === 'both';
            if (active) preview.setAttribute(`marker-${end}`, 'url(#geneo-preview-arrow)');
            else preview.removeAttribute(`marker-${end}`);
        }
        main.querySelector('#geneo-preview-arrow path')?.setAttribute('fill', geneoPaintCssColor(style.line));
    }
}

function refreshGeneoCreationToolUi(tool)
{
    const settings = geneoCreationToolSettings(tool);
    const appearance = settings.appearance;
    const panel = main.querySelector(`[data-geneo-creation-panel="${tool}"]`);
    panel?.querySelectorAll('[data-geneo-creation-swatch]').forEach(swatch =>
    {
        const property = swatch.dataset.geneoCreationSwatch;
        const paint = appearance[property];
        swatch.setAttribute('style', geneoPaintSwatchStyle(paint));
        swatch.classList.toggle('is-none', !paint.enabled);
        swatch.setAttribute('aria-label', `${t(capitalize(property))}: ${paint.enabled ? paint.color : t('None')}`);
    });
    const width = panel?.querySelector('[data-geneo-creation-width]');
    if (width) width.value = appearance.strokeWidth;
    const pattern = panel?.querySelector('[data-geneo-creation-pattern]');
    if (pattern)
    {
        pattern.querySelector('.geneo-line-sample')?.replaceWith(...new DOMParser().parseFromString(renderGeneoConnectionLineSample(appearance.strokePattern), 'text/html').body.children);
        pattern.setAttribute('aria-label', `${t('Pattern')}: ${t(GENEO_CONNECTION_PATTERN_LABELS[appearance.strokePattern])}`);
    }
    const preview = main.querySelector('[data-geneo-pencil-preview]');
    if (tool === 'drawing' && preview)
    {
        preview.style.stroke = geneoPaintCssColor(appearance.stroke);
        preview.style.strokeWidth = String(appearance.strokeWidth);
        preview.style.strokeDasharray = appearance.strokePattern === 'dashed' ? '8 7' : 'none';
    }
}

function openGeneoCreationPatternMenu(anchor, tool)
{
    if (!(anchor instanceof HTMLElement) || closeGeneoOpenMenuOnTrigger(anchor)) return;
    closeMenu();
    const pattern = geneoCreationToolSettings(tool).appearance.strokePattern;
    const menu = document.createElement('div');
    menu.id = 'projectMenu';
    menu.className = 'menu-popover tool-options-menu';
    menu.setAttribute('role', 'menu');
    menu.setAttribute('aria-label', t('Stroke pattern'));
    menu.innerHTML = ['solid', 'dashed'].map(value => `<button type="button" role="menuitemradio" aria-label="${escapeHtml(t(GENEO_CONNECTION_PATTERN_LABELS[value]))}" aria-checked="${pattern === value}" data-geneo-creation-pattern-option="${value}">${renderGeneoConnectionLineSample(value)}</button>`).join('');
    document.body.appendChild(menu);
    const rect = anchor.getBoundingClientRect();
    menu.style.left = `${Math.max(12, Math.min(rect.left, window.innerWidth - menu.offsetWidth - 12))}px`;
    menu.style.top = `${rect.bottom + menu.offsetHeight + 7 <= window.innerHeight - 12 ? rect.bottom + 7 : Math.max(12, rect.top - menu.offsetHeight - 7)}px`;
    if (window.innerWidth <= 900) mountMobileChoiceSheet(menu, anchor, t('Stroke pattern'));
    menu.addEventListener('click', event =>
    {
        const option = event.target.closest('[data-geneo-creation-pattern-option]');
        if (!option) return;
        geneoCreationToolSettings(tool).appearance.strokePattern = option.dataset.geneoCreationPatternOption;
        closeMenu();
        refreshGeneoCreationToolUi(tool);
    });
    menu.addEventListener('keydown', event =>
    {
        const items = [...menu.querySelectorAll('[role="menuitemradio"]')];
        const index = items.indexOf(document.activeElement);
        if (event.key === 'Escape')
        {
            event.preventDefault(); event.stopPropagation(); closeMenu(); anchor.focus({ preventScroll: true });
        }
        else if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key))
        {
            event.preventDefault();
            items[event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1
                : (index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]?.focus({ preventScroll: true });
        }
    });
    bindMenuLifecycle(anchor, { ignoreScrollWithin: anchor.closest('[data-geneo-creation-panel]') });
    menu.querySelector('[aria-checked="true"]')?.focus({ preventScroll: true });
}

function bindGeneoConnectionControls()
{
    const toolPanel = main.querySelector('[data-geneo-connection-panel]');
    const connectButton = main.querySelector('[data-geneo-connection-main]');
    const editor = main.querySelector('.geneo-editor');
    if (toolPanel && connectButton && editor && window.innerWidth > 900)
    {
        const left = connectButton.getBoundingClientRect().left - editor.getBoundingClientRect().left;
        toolPanel.style.left = `${Math.max(12, Math.min(left, editor.clientWidth - toolPanel.offsetWidth - 12))}px`;
    }
    main.querySelectorAll('[data-geneo-connection-fields]').forEach(group =>
    {
        const scope = group.dataset.geneoConnectionFields;
        if (scope !== 'default') return;
        const prefix = `[data-geneo-connection-${scope}-`;
        const commit = (key, value) =>
        {
            const diagram = selectedGeneographDiagram();
            if (!diagram) return;
            if (scope === 'default')
            {
                const current = key === 'line' ? diagram.connectionDefaults.line.color : diagram.connectionDefaults[key];
                const next = key === 'line' ? value.color : value;
                if (current === next) return;
                geneoPushHistory();
                if (key === 'line') diagram.connectionDefaults.line = value;
                else diagram.connectionDefaults[key] = value;
                touchGeneographBoard();
            }
            else
            {
                geneoConnectionToolStyle();
                const defaultValue = key === 'line' ? diagram.connectionDefaults.line.color : diagram.connectionDefaults[key];
                const next = key === 'line' ? value.color : value;
                if (next === defaultValue) delete geneoConnectionToolRuntime.overrides[key];
                else geneoConnectionToolRuntime.overrides[key] = value;
            }
            if (scope === 'default') requestAnimationFrame(() => renderGeneographEditorPreserveScroll({ preserveInspectorScroll: true }));
            else refreshGeneoConnectionToolUi();
        };
        group.querySelector(`${prefix}width]`)?.addEventListener('change', event => commit('width', Math.round(geneoNumber(event.target.value, 2, 1, 12))));
        group.querySelector(`${prefix}radius]`)?.addEventListener('change', event => commit('cornerRadius', Math.round(geneoNumber(event.target.value, 0, 0, 32))));
        group.querySelector(`${prefix}dates]`)?.addEventListener('change', event => commit('showRelationshipDates', event.target.checked));
        group.querySelector(`${prefix}pattern]`)?.addEventListener('click', event => openGeneoConnectionStyleMenu(event.currentTarget, 'pattern', 'default'));
        group.querySelectorAll(`${prefix}arrows]`).forEach(input => input.addEventListener('change', () => { if (input.checked) commit('arrows', input.value); }));
    });
    main.querySelector('[data-geneo-connection-tool-pattern]')?.addEventListener('click', event => openGeneoConnectionStyleMenu(event.currentTarget));
    main.querySelector('[data-geneo-connection-inspector-pattern]')?.addEventListener('click', event => openGeneoConnectionStyleMenu(event.currentTarget, 'pattern', 'connection'));
    main.querySelector('[data-geneo-connection-multi-pattern]')?.addEventListener('click', event => openGeneoConnectionStyleMenu(event.currentTarget, 'pattern', 'multi'));
    main.querySelector('[data-geneo-connection-multi-width]')?.addEventListener('change', event =>
    {
        const input = event.currentTarget;
        if (input.value.trim() === '' || !input.checkValidity()) { input.reportValidity(); return; }
        geneoCommitMultiConnectionAppearance('width', Number(input.value));
    });
    main.querySelector('[data-geneo-connection-multi-radius]')?.addEventListener('change', event =>
    {
        const input = event.currentTarget;
        if (input.value.trim() === '' || !input.checkValidity()) { input.reportValidity(); return; }
        geneoCommitMultiConnectionAppearance('cornerRadius', Number(input.value));
    });
    main.querySelector('[data-geneo-connection-multi-hex]')?.addEventListener('change', event =>
    {
        const input = event.currentTarget;
        if (!/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.test(input.value.trim()))
        {
            input.setCustomValidity(t('Enter a valid hex color.'));
            input.reportValidity();
            return;
        }
        input.setCustomValidity('');
        geneoCommitMultiConnectionPaint('color', normalizeGeneoHexColor(input.value));
    });
    main.querySelector('[data-geneo-connection-multi-opacity]')?.addEventListener('change', event =>
    {
        const input = event.currentTarget;
        if (input.value.trim() === '' || !input.checkValidity()) { input.reportValidity(); return; }
        geneoCommitMultiConnectionPaint('opacity', Number(input.value));
    });
    main.querySelector('[data-geneo-connection-multi-paint-toggle]')?.addEventListener('click', () =>
    {
        const connections = selectedGeneographConnections();
        geneoCommitMultiConnectionPaint('enabled', connections.every(connection =>
            geneoEffectiveConnectionStyle(connection).line.enabled === false));
    });
    main.querySelectorAll('[data-geneo-connection-multi-arrows]').forEach(input => input.addEventListener('change', () =>
    {
        if (input.checked) geneoCommitMultiConnectionAppearance('arrows', input.value);
    }));
    const dateToggle = main.querySelector('[data-geneo-connection-multi-dates]');
    if (dateToggle)
    {
        dateToggle.indeterminate = dateToggle.dataset.mixed === 'true';
        dateToggle.addEventListener('change', () => geneoCommitMultiConnectionAppearance('showRelationshipDates', dateToggle.checked));
    }
    main.querySelector('[data-geneo-make-visual]')?.addEventListener('click', () => openGeneoMakeVisualConfirmation(selectedGeneographConnection()));
    main.querySelector('[data-geneo-connection-purpose]')?.addEventListener('click', event => openGeneoConnectionPurposeMenu(event.currentTarget));
    main.querySelector('[data-geneo-connection-tool-arrows]')?.addEventListener('click', event => openGeneoConnectionStyleMenu(event.currentTarget, 'arrows'));
    main.querySelector('[data-geneo-connection-tool-swatch]')?.addEventListener('click', event => openGeneoPaintPopover({ scope: 'connection-tool', property: 'line' }, event.currentTarget));
    main.querySelector('[data-geneo-connection-tool-width]')?.addEventListener('change', event =>
    {
        const width = Math.round(geneoNumber(event.target.value, 2, 1, 12));
        const defaults = selectedGeneographDiagram().connectionDefaults;
        if (width === defaults.width) delete geneoConnectionToolRuntime.overrides.width;
        else geneoConnectionToolRuntime.overrides.width = width;
        refreshGeneoConnectionToolUi();
    });
    main.querySelector('[data-geneo-connection-panel-close]')?.addEventListener('click', () =>
    {
        geneoConnectionToolRuntime.panelOpen = false;
        renderGeneographEditorPreserveScroll();
        main.querySelector('[data-geneo-connection-main]')?.focus({ preventScroll: true });
    });
    main.querySelector('[data-geneo-connection-tool-reset]')?.addEventListener('click', () =>
    {
        if (geneoPaintRuntime.popover) closeGeneoPaintPopover({ restoreFocus: false });
        geneoConnectionToolRuntime.overrides = {};
        refreshGeneoConnectionToolUi();
    });
    main.querySelectorAll('[data-geneo-connection-arrows]').forEach(input => input.addEventListener('change', () =>
    {
        const connection = selectedGeneographConnection();
        if (!connection || connection.kind !== 'visual' || !input.checked) return;
        if (geneoEffectiveConnectionStyle(connection).arrows === input.value) return;
        geneoPushHistory();
        if (input.value === selectedGeneographDiagram().connectionDefaults.arrows) delete connection.style.arrows;
        else connection.style.arrows = input.value;
        touchGeneographBoard();
        renderGeneographEditorPreserveScroll({ preserveInspectorScroll: true });
    }));
    main.querySelector('[data-geneo-connection-radius]')?.addEventListener('change', event =>
    {
        const connection = selectedGeneographConnection();
        if (!connection) return;
        const radius = Math.round(geneoNumber(event.target.value,
            geneoEffectiveConnectionStyle(connection).cornerRadius, 0, 32));
        if (radius === geneoEffectiveConnectionStyle(connection).cornerRadius) return;
        geneoPushHistory();
        if (radius === selectedGeneographDiagram().connectionDefaults.cornerRadius)
            delete connection.style.cornerRadius;
        else connection.style.cornerRadius = radius;
        touchGeneographBoard();
        renderGeneographEditorPreserveScroll({ preserveInspectorScroll: true });
    });
    main.querySelector('[data-geneo-connection-reset-default]')?.addEventListener('click', () =>
    {
        const connection = selectedGeneographConnection();
        if (!connection || (!Object.keys(connection.style || {}).length && connection.showRelationshipDates === undefined)) return;
        geneoPushHistory();
        connection.style = {};
        delete connection.showRelationshipDates;
        touchGeneographBoard();
        renderGeneographEditorPreserveScroll({ preserveInspectorScroll: true });
    });
    main.querySelector('[data-geneo-connection-multi-reset-default]')?.addEventListener('click', () =>
    {
        const connections = selectedGeneographConnections();
        if (!connections.length
            || !connections.some(connection => Object.keys(connection.style || {}).length || connection.showRelationshipDates !== undefined)) return;
        geneoPushHistory();
        connections.forEach(connection => { connection.style = {}; delete connection.showRelationshipDates; });
        touchGeneographBoard();
        renderGeneographEditorPreserveScroll({ preserveInspectorScroll: true });
    });
}

function bindGeneoCreationToolControls()
{
    const editor = main.querySelector('.geneo-editor');
    main.querySelectorAll('[data-geneo-creation-panel]').forEach(panel =>
    {
        const tool = panel.dataset.geneoCreationPanel;
        const anchor = main.querySelector(tool === 'drawing' ? '[data-geneo-tool="pencil"]' : '[data-geneo-shape-main]');
        if (editor && anchor && window.innerWidth > 900)
        {
            const left = anchor.getBoundingClientRect().left - editor.getBoundingClientRect().left;
            panel.style.left = `${Math.max(12, Math.min(left, editor.clientWidth - panel.offsetWidth - 12))}px`;
        }
        panel.querySelectorAll('[data-geneo-creation-swatch]').forEach(swatch => swatch.addEventListener('click', () =>
            openGeneoPaintPopover({ scope: 'creation-tool', id: tool, property: swatch.dataset.geneoCreationSwatch }, swatch)));
        panel.querySelector('[data-geneo-creation-width]')?.addEventListener('change', event =>
        {
            const appearance = geneoCreationToolSettings(tool).appearance;
            appearance.strokeWidth = Math.round(geneoNumber(event.target.value, appearance.strokeWidth, 1, 12));
            refreshGeneoCreationToolUi(tool);
        });
        panel.querySelector('[data-geneo-creation-pattern]')?.addEventListener('click', event =>
            openGeneoCreationPatternMenu(event.currentTarget, tool));
        panel.querySelector('[data-geneo-creation-shape-kind]')?.addEventListener('click', event =>
            openGeneoShapeMenu(event.currentTarget));
        panel.querySelector('[data-geneo-creation-reset]')?.addEventListener('click', () =>
        {
            if (geneoPaintRuntime.popover) closeGeneoPaintPopover({ restoreFocus: false });
            const settings = geneoCreationToolSettings(tool);
            settings.appearance = structuredClone(geneoNodeDefaults(tool).appearance);
            if (tool === 'shape') settings.shapeKind = 'rectangle';
            renderGeneographEditorPreserveScroll();
        });
        panel.querySelector('[data-geneo-creation-close]')?.addEventListener('click', () =>
        {
            geneoCreationToolSettings(tool).panelOpen = false;
            renderGeneographEditorPreserveScroll();
        });
    });
    refreshGeneoCreationToolUi('drawing');
}

function bindGeneographEditor()
{
    bindGeneographInspectorSectionToggles();

    bindGeneographToolbarDensity();
    bindGeneographToolbarKeyboard();

    const wrap = main.querySelector(
        '[data-geneo-canvas-wrap]'
    );
    if (!main.dataset.geneoConnectionClickBoundaryBound)
    {
        main.dataset.geneoConnectionClickBoundaryBound = 'true';
        main.addEventListener('pointerdown', event =>
        {
            if (!event.target.closest('.geneo-connection-hit, .geneo-segment-hit')) clearGeneographConnectionClick();
        }, true);
    }
    main.querySelector('[data-geneo-undo]')?.addEventListener('click', undoGeneographChange); main.querySelector('[data-geneo-redo]')?.addEventListener('click', redoGeneographChange);
    main
        .querySelectorAll('[data-geneo-add]')
        .forEach(button =>
        {
            button.addEventListener('click', () =>
            {
                addGeneographObject(
                    button.dataset.geneoAdd
                );
            });
        });
    main
        .querySelectorAll(
            '[data-geneo-edit-rich-text]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () =>
                {
                    beginGeneographInlineEdit(
                        button.dataset
                            .geneoEditRichText,
                        {
                            surface:
                    'inspector'
                        }
                    );
                }
            );
            button.addEventListener('keydown', event =>
            {
                if (event.key !== 'Enter' && event.key !== ' ') return;
                event.preventDefault();
                button.click();
            });
        });

    main
        .querySelector(
            '[data-geneo-rich-text-done]'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                commitGeneoInlineEdit(
                    false
                );
            }
        );

    main
        .querySelector(
            '[data-geneo-rich-text-cancel]'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                commitGeneoInlineEdit(
                    true
                );
            }
        );
    main
        .querySelectorAll('[data-geneo-placement-tool]')
        .forEach(button =>
        {
            button.addEventListener('click', () =>
            {
                activateGeneographPlacementTool(
                    button.dataset.geneoPlacementTool
                );
            });
        });
    main.querySelector('[data-geneo-person-main]')?.addEventListener('click', () =>
        addGeneographObject('person'));
    const personMenuButton = main.querySelector('[data-geneo-person-menu]');
    personMenuButton?.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        openGeneoPersonGenderMenu(personMenuButton);
    });
    main
        .querySelectorAll(
            '[data-geneo-tool]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () =>
                {
                    setGeneoCtrlSelectPressed(false);
                    cancelGeneographPencilStroke();
                    cancelGeneographConnectionDraft();

                    state.geneoPlacementReturnTool =
                        null;

                    state.geneoTool =
                        button.dataset.geneoTool;

                    if (state.geneoTool === 'pencil') geneoCreationToolSettings('drawing').panelOpen = true;

                    hideGeneographPanelDraftDom();

                    renderGeneographEditorPreserveScroll();
                }
            );
        });
    main
        .querySelector(
            '[data-geneo-connection-main]'
        )
        ?.addEventListener('click', event =>
        {
            activateGeneographConnectionTool();
        });
    const connectionMenuButton = main.querySelector('[data-geneo-connection-menu]');
    connectionMenuButton?.addEventListener('click', event =>
    {
        event.preventDefault();
        event.stopPropagation();
        openGeneoConnectionPurposeMenu(connectionMenuButton, true);
    });
    /*
      * Notes & text main action.
      * Repeats the last content type selected
      * from the Notes & text menu.
      */
    main
        .querySelector(
            '[data-geneo-content-main]'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                const kind =
                    normalizeGeneographContentKind(
                        state.geneoContentKind
                    );

                activateGeneographPlacementTool(
                    kind
                );
            }
        );

    main.querySelectorAll('[data-geneo-mobile-content]').forEach(button =>
        button.addEventListener('click', () =>
        {
            const kind = normalizeGeneographContentKind(button.dataset.geneoMobileContent);
            state.geneoContentKind = kind;
            activateGeneographPlacementTool(kind);
        }));

    /*
      * Notes & text dropdown.
      */
    const contentMenuButton =
        main.querySelector(
            '[data-geneo-content-menu]'
        );

    contentMenuButton
        ?.addEventListener(
            'click',
            event =>
            {
                event.preventDefault();
                event.stopPropagation();

                openGeneoContentMenu(
                    contentMenuButton
                );
            }
        );

    /*
      * Shapes main action.
      * Activates the currently selected shape.
      */
    main
        .querySelector(
            '[data-geneo-shape-main]'
        )
        ?.addEventListener(
            'click',
            event =>
            {
                if (window.innerWidth <= 900) openGeneoShapeMenu(event.currentTarget);
                else activateGeneographPlacementTool('shape');
            }
        );

    /*
      * Shapes dropdown.
      */
    const shapeMenuButton =
        main.querySelector(
            '[data-geneo-shape-menu]'
        );

    shapeMenuButton
        ?.addEventListener(
            'click',
            event =>
            {
                event.preventDefault();
                event.stopPropagation();

                openGeneoShapeMenu(
                    shapeMenuButton
                );
            }
        );

    /*
      * Responsive toolbar overflow menu.
      */
    const toolbarOverflowButton =
        main.querySelector(
            '[data-geneo-toolbar-overflow]'
        );

    toolbarOverflowButton
        ?.addEventListener(
            'click',
            event =>
            {
                event.preventDefault();
                event.stopPropagation();

                openGeneoToolbarOverflowMenu(
                    toolbarOverflowButton
                );
            }
        );
    main.querySelectorAll('[data-geneo-edit-person-node]').forEach(button =>
    {
        button.addEventListener('click', event =>
        {
            event.preventDefault();
            event.stopPropagation();
            const node = getGeneographNode(button.dataset.geneoEditPersonNode);
            if (node?.type === 'person' && getGeneographPerson(node.personId))
            {
                openGeneographPersonModal(node.personId);
            }
        });
    });
    main.querySelectorAll('[data-geneo-avatar-person]').forEach(button =>
    {
        button.addEventListener('pointerdown', event => event.stopPropagation());
        button.addEventListener('click', event =>
        {
            event.preventDefault();
            event.stopPropagation();
            openGeneographAvatarPicker(button.dataset.geneoAvatarPerson, {
                nodeId: button.dataset.geneoAvatarNode,
                location: button.dataset.geneoAvatarLocation
            });
        });
    });
    main
        .querySelectorAll(
            '[data-geneo-add-relative]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                event =>
                {
                    event.preventDefault();
                    event.stopPropagation();

                    openGeneographRelativePopover(
                        button,
                        button.dataset
                            .geneoAddRelative
                    );
                }
            );
        });
    main.querySelectorAll('[data-geneo-port-node]').forEach(button => button.addEventListener('click', event =>
    {
        event.stopPropagation();
        if (geneoCtrlSelectPressed) return;
        const reference = { nodeId: button.dataset.geneoPortNode, port: button.dataset.geneoPort };
        activateGeneographConnectionPoint(reference);
    }));
    main.querySelectorAll('[data-geneo-family-junction]').forEach(junction => junction.addEventListener('click', event =>
    {
        event.stopPropagation();
        if (geneoCtrlSelectPressed) return;
        const reference = { familyId: junction.dataset.geneoFamilyJunction, port: 'bottom' };
        activateGeneographConnectionPoint(reference);
    }));
    const connectionTargetSelector = '[data-geneo-port-node], [data-geneo-family-junction]';
    wrap.addEventListener('pointerover', event =>
    {
        if (geneoCtrlSelectPressed) return;
        const target = event.target.closest?.(connectionTargetSelector);
        if (target) setGeneographConnectionHoverTarget(target);
    });
    wrap.addEventListener('pointerout', event =>
    {
        const target = event.target.closest?.(connectionTargetSelector);
        if (target && !target.contains(event.relatedTarget) && document.activeElement !== target)
            setGeneographConnectionHoverTarget(null);
    });
    wrap.addEventListener('focusin', event =>
    {
        if (geneoCtrlSelectPressed) return;
        const target = event.target.closest?.(connectionTargetSelector);
        if (target) setGeneographConnectionHoverTarget(target);
    });
    wrap.addEventListener('focusout', event =>
    {
        const target = event.target.closest?.(connectionTargetSelector);
        if (target && !target.matches(':hover')) setGeneographConnectionHoverTarget(null);
    });
    wrap.addEventListener('scroll', updateGeneographConnectionTip, { passive: true });
    wrap.addEventListener('contextmenu', event =>
    {
        if (geneographCanvasTargetIsInteractive(event.target)) return;
        if (state.geneoTool !== 'connect' && state.geneoTool !== 'pencil') return;
        event.preventDefault();
        event.stopPropagation();
        if (state.geneoTool === 'connect')
        {
            exitGeneographConnectionTool();
            return;
        }
        if (geneoPointerState?.kind === 'pencil')
        {
            geneoDrawPanPending = true;
            return;
        }
        updateGeneographPencilPreview();
        geneoCreationToolSettings('drawing').panelOpen = false;
        state.geneoTool = 'pan';
        setGeneoCtrlSelectPressed(false);
        renderGeneographEditorPreserveScroll();
    });
    main
        .querySelectorAll(
            '[data-geneo-node]'
        )
        .forEach(element =>
        {
            const interactiveSelector =
                [
                    'button',
                    'input',
                    'textarea',
                    'select',
                    'a',
                    '[contenteditable="true"]',
                    '.rich-text-toolbar',
                    '.ql-tooltip'
                ].join(',');

            element.addEventListener('contextmenu', event =>
            {
                if (event.target.closest('input,textarea,select,[contenteditable="true"],.ql-editor')) return;
                event.preventDefault();
                event.stopPropagation();
                openGeneographObjectContextMenu(element.dataset.geneoNode, event.clientX, event.clientY);
            });

            element.addEventListener('keydown', event =>
            {
                if (event.key === 'Enter' && event.target === element
                    && getGeneographNode(element.dataset.geneoNode)?.type === 'image')
                {
                    event.preventDefault();
                    geneoBeginImageCrop(getGeneographNode(element.dataset.geneoNode));
                    return;
                }
                if ((event.shiftKey && event.key === 'F10') || event.key === 'ContextMenu')
                {
                    event.preventDefault();
                    event.stopPropagation();
                    const rect = element.getBoundingClientRect();
                    openGeneographObjectContextMenu(element.dataset.geneoNode, rect.left + 12, rect.top + 12);
                }
            });

            element.addEventListener(
                'pointerdown',
                event =>
                {
                    if (geneoImageCropRuntime?.nodeId === element.dataset.geneoNode)
                    {
                        const handle = event.target.closest('[data-geneo-image-crop-handle]');
                        const photoBounds = event.target.closest('.geneo-image-crop-bounds');
                        if (event.button === 0 && handle)
                        {
                            const node = getGeneographNode(element.dataset.geneoNode);
                            const source = resolveGeneographImageSource(node);
                            const metrics = geneoImageCropMetrics(node, source, geneoImageCropRuntime.draft);
                            geneoImageCropRuntime.drag = {
                                kind: 'scale', pointerId: event.pointerId,
                                handle: handle.dataset.geneoImageCropHandle,
                                clientX: event.clientX, clientY: event.clientY,
                                x: metrics.x, y: metrics.y, zoom: metrics.zoom,
                                baseWidth: metrics.width, baseHeight: metrics.height,
                                boardZoom: Math.max(.1, state.geneoZoom / 100)
                            };
                            handle.setPointerCapture(event.pointerId);
                            event.preventDefault();
                        }
                        else if (event.button === 0 && (photoBounds || event.target.closest('.geneo-image-node-media')))
                        {
                            geneoImageCropRuntime.drag = {
                                kind: 'move',
                                pointerId: event.pointerId, clientX: event.clientX, clientY: event.clientY,
                                x: geneoImageCropRuntime.draft.x, y: geneoImageCropRuntime.draft.y,
                                width: element.getBoundingClientRect().width,
                                height: element.getBoundingClientRect().height
                            };
                            (photoBounds || event.target).setPointerCapture(event.pointerId);
                            event.preventDefault();
                        }
                        event.stopPropagation();
                        return;
                    }
                    if (
                        !startGeneographResize(
                            event
                        )
                    )
                    {
                        startGeneographObjectDrag(
                            event
                        );
                    }
                }
            );

            element.addEventListener(
                'click',
                event =>
                {
                    if (
                        geneoCanvasRuntime
                            .suppressNodeClick
                || event.target.closest(
                    interactiveSelector
                )
                    )
                    {
                        return;
                    }

                    const clickedNode = getGeneographNode(element.dataset.geneoNode);
                    if (clickedNode?.type === 'image')
                    {
                        if (geneoImageCropRuntime?.nodeId === clickedNode.id) return;
                        const now = performance.now();
                        if (geneoImageLastClick?.id === clickedNode.id && now - geneoImageLastClick.time < 450)
                        {
                            geneoImageLastClick = null;
                            event.preventDefault();
                            geneoBeginImageCrop(clickedNode);
                            return;
                        }
                        geneoImageLastClick = { id: clickedNode.id, time: now };
                    }
                    if (clickedNode?.type === 'panel' && geneoEffectiveCanvasTool() === 'select'
                        && !geneoPanelDirectTarget(event, element)) return;

                    selectGeneographNode(
                        element.dataset
                            .geneoNode,
                        {
                            toggle:
                    event.shiftKey
                    || event.ctrlKey
                    || event.metaKey
                        }
                    );

                    renderGeneographEditorPreserveScroll();
                }
            );

            element.addEventListener(
                'dblclick',
                event =>
                {
                    if (
                        event.target.closest(
                            interactiveSelector
                        )
                    )
                    {
                        return;
                    }

                    const node =
                        getGeneographNode(
                            element.dataset
                                .geneoNode
                        );

                    if (node?.type === 'image')
                    {
                        event.preventDefault();
                        geneoBeginImageCrop(node);
                        return;
                    }

                    if (
                        node
                && [
                    'sticky',
                    'text',
                    'panel'
                ].includes(
                    node.type
                )
                    )
                    {
                        event.preventDefault();

                        beginGeneographInlineEdit(
                            node.id,
                            { selectAll: node.type === 'panel' }
                        );
                    }
                }
            );
        });
    main.querySelectorAll('[data-geneo-image-crop-handle]').forEach(handle =>
    {
        handle.addEventListener('keydown', event =>
        {
            if (!['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft'].includes(event.key)) return;
            event.preventDefault();
            event.stopPropagation();
            const direction = ['ArrowUp', 'ArrowRight'].includes(event.key) ? 1 : -1;
            geneoScaleImageCropFromHandle(handle.dataset.geneoImageCropHandle,
                geneoImageCropRuntime.draft.zoom + direction * (event.shiftKey ? .2 : .05));
        });
    });
    main.querySelector('[data-geneo-image-crop-reset]')?.addEventListener('click', () =>
    {
        geneoImageCropRuntime.draft = { ...geneoImageCropRuntime.initial };
        geneoRefreshImageCropDom();
    });
    main.querySelector('[data-geneo-image-crop-fit]')?.addEventListener('click', () =>
    {
        geneoImageCropRuntime.draft = { zoom: 1, x: 0, y: 0 };
        geneoRefreshImageCropDom();
    });
    main.querySelector('[data-geneo-image-crop-cancel]')?.addEventListener('click', () => geneoFinishImageCrop(false));
    main.querySelector('[data-geneo-image-crop-apply]')?.addEventListener('click', () => geneoFinishImageCrop(true));
    main.querySelectorAll('.geneo-connection-hit').forEach(path => path.addEventListener('pointerdown', startGeneographConnectionDrag));
    main.querySelectorAll('.geneo-connection-hit, .geneo-segment-hit').forEach(path => path.addEventListener('click', handleGeneographConnectionClick));
    main.querySelectorAll('.geneo-connection-hit, .geneo-segment-hit, .geneo-family-bus-hit, [data-geneo-waypoint]')
        .forEach(element => bindGeneoConnectionContextMenu(element));
    const connectionInspector = main.querySelector('[data-geneo-inspector-connection]');
    if (connectionInspector) bindGeneoConnectionContextMenu(connectionInspector, 'inspector');
    main.querySelectorAll('.geneo-connection-hit').forEach(path => path.addEventListener('keydown', event =>
    {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        event.stopPropagation();
        const id = path.dataset.geneoConnection;
        selectGeneographConnection(id);
        renderGeneographEditorPreserveScroll();
        main.querySelector(`[data-geneo-connection="${CSS.escape(id)}"]`)?.focus({ preventScroll: true });
    }));
    main.querySelectorAll('[data-geneo-family-bus]').forEach(path =>
    {
        path.addEventListener('pointerdown', path.hasAttribute('data-geneo-family-bus-rail')
            ? startGeneographFamilyBusRailDrag
            : event => event.stopPropagation());
        path.addEventListener('click', handleGeneographFamilyBusSelection);
        path.addEventListener('keydown', handleGeneographFamilyBusSelection);
    });
    main.querySelectorAll('[data-geneo-waypoint]').forEach(point =>
    {
        point.addEventListener('click', event =>
        {
            event.stopPropagation(); selectGeneographConnection(point.dataset.geneoConnection, Number(point.dataset.geneoWaypoint)); renderGeneographEditorPreserveScroll();
        }); point.addEventListener('pointerdown', event =>
        {
            if (event.button !== 0) return;
            event.preventDefault(); event.stopPropagation(); clearGeneographConnectionClick(); selectGeneographConnection(point.dataset.geneoConnection, Number(point.dataset.geneoWaypoint)); geneoPushHistory(); geneoPointerState = { kind: 'waypoint', connectionId: point.dataset.geneoConnection, index: Number(point.dataset.geneoWaypoint), moved: false };
        });
    });
    main.querySelectorAll('[data-geneo-segment]').forEach(segment => segment.addEventListener('pointerdown', event =>
    {
        if (event.button !== 0) return;
        event.preventDefault(); event.stopPropagation();
        const connection = getGeneographConnection(segment.dataset.geneoConnection); if (!connection) return; const index = Number(segment.dataset.geneoSegment); const points = geneoConnectionPoints(connection);
        if (geneoSelectedConnectionIdSet().has(connection.id)
            && selectedGeneographNodes().length + selectedGeneographConnections().length > 1
            && startGeneographSelectedConnectionDrag(event, connection)) return;
        if (index < 1 || index >= points.length - 2) return;
        geneoPushHistory();
        if (connection.route.mode !== 'manual') connection.route = { mode: 'manual', waypoints: points.slice(1, -1).map(snapGeneographPoint) };
        const firstWaypoint = index - 1, secondWaypoint = index; const first = connection.route.waypoints[firstWaypoint], second = connection.route.waypoints[secondWaypoint]; if (!first || !second) return;
        geneoPointerState = { kind: 'segment', connectionId: connection.id, start: geneoPointerToCanvas(event), firstWaypoint, secondWaypoint, first: { ...first }, second: { ...second }, vertical: Math.abs(first.x - second.x) < Math.abs(first.y - second.y), moved: false };
    }));
    wrap?.addEventListener('pointerdown', () =>
    {
        const pendingExpansion = Boolean(
            geneoCanvasRuntime.edgeExpansionFrame
          || geneoCanvasRuntime.pendingEdgeExpansion
        );
        cancelGeneographEdgeExpansion({ pending: pendingExpansion });
        cancelGeneographViewportRestore({ releaseSuppression: true });
    }, { capture: true });
    wrap?.addEventListener('click', event =>
    {
        bindGeneographIntentionalCanvasClick(
            wrap
        );
    });
    wrap?.addEventListener('pointerdown', event =>
    {
        if (geneoPointerState || event.button !== 0 || event.isPrimary === false)
        {
            return;
        }
        const canvasTool = geneoEffectiveCanvasTool();
        if (
            canvasTool === 'sticky'
          || canvasTool === 'text'
        )
        {
            const placementType =
                canvasTool;

            /*
           * Text and Sticky can be placed on
           * empty canvas or inside a Panel.
           * Existing objects and interaction
           * controls are not placement surfaces.
           */
            const blockedControl =
                event.target.closest(
                    [
                        'button',
                        'input',
                        'textarea',
                        'select',
                        'a',
                        '[contenteditable="true"]',
                        '.rich-text-toolbar',
                        '.ql-tooltip',
                        '[data-geneo-connection]',
                        '.geneo-connection-hit',
                        '.geneo-segment-hit',
                        '[data-geneo-waypoint]',
                        '[data-geneo-family-junction]'
                    ].join(',')
                );

            if (blockedControl)
            {
                return;
            }

            const nodeElement =
                event.target.closest(
                    '[data-geneo-node]'
                );

            if (nodeElement)
            {
                const clickedNode =
                    getGeneographNode(
                        nodeElement.dataset
                            .geneoNode
                    );

                if (
                    clickedNode?.type
                !== 'panel'
                )
                {
                    return;
                }
            }

            event.preventDefault();
            event.stopPropagation();

            createGeneographRichTextNodeAtPoint(
                placementType,
                geneoPointerToCanvas(
                    event
                )
            );

            return;
        }

        if (canvasTool === 'pencil')
        {
            if (event.target.closest([
                'button',
                'input',
                'textarea',
                'select',
                'a',
                '[contenteditable="true"]',
                '.rich-text-toolbar',
                '.ql-tooltip'
            ].join(','))) return;
            event.preventDefault();
            event.stopPropagation();
            const point = geneoPointerToCanvas(event);
            geneoPointerState = {
                kind: 'pencil',
                pointerId: event.pointerId,
                wrap,
                points: [point],
                beforeSnapshot: geneoSnapshot(),
                moved: false
            };
            wrap.setPointerCapture?.(event.pointerId);
            updateGeneographPencilPreview(geneoPointerState.points);
            return;
        }

        const placementNodeElement = event.target.closest('[data-geneo-node]');
        const connecting = canvasTool === 'connect';
        const panelInterior = canvasTool === 'select'
            && getGeneographNode(placementNodeElement?.dataset.geneoNode)?.type === 'panel'
            && !geneoPanelDirectTarget(event, placementNodeElement);
        const drawingShapeOnPanel = canvasTool === 'shape'
          && getGeneographNode(placementNodeElement?.dataset.geneoNode)?.type === 'panel';
        if (
            event.target.closest(
                [
                    'button',
                    'input',
                    'textarea',
                    'select',
                    'a',
                    '[contenteditable="true"]',
                    '.rich-text-toolbar',
                    '.ql-tooltip',
                    '[data-geneo-waypoint]',
                    '[data-geneo-family-junction]'
                ].join(',')
            )
          || (!connecting && event.target.closest('[data-geneo-connection]'))
          || (placementNodeElement && !panelInterior && !drawingShapeOnPanel && !connecting)
        )
        {
            return;
        }

        if (canvasTool === 'pan' || connecting)
        {
            geneoPointerState = {
                kind: 'pan',
                fromConnect: connecting,
                wrap,
                clientX: event.clientX,
                clientY: event.clientY,
                left: wrap.scrollLeft,
                top: wrap.scrollTop,
                moved: false
            };
        }
        else if (canvasTool === 'select')
        {
            const additive = event.shiftKey;

            geneoPointerState = {
                kind: 'marquee',
                start: geneoPointerToCanvas(event),
                current: geneoPointerToCanvas(event),
                baseIds: additive
                    ? [...geneoSelectedNodeIdSet()]
                    : [],
                baseConnectionIds: additive
                    ? [...geneoSelectedConnectionIdSet()]
                    : [],
                additive,
                panelId: panelInterior ? placementNodeElement.dataset.geneoNode : null,
                moved: false
            };

            if (!additive)
            {
                setGeneographSelection();
            }
        }
        else if (
            canvasTool === 'panel'
          || canvasTool === 'shape'
        )
        {
            const point = snapGeneographPoint(
                geneoPointerToCanvas(event)
            );

            geneoPointerState = {
                kind: canvasTool === 'shape' ? 'draw-shape' : 'draw-panel',
                start: point,
                current: point,
                moved: false
            };

            updateGeneographPanelDraftDom(
                point,
                point
            );
        }
        else
        {
            return;
        }
        event.preventDefault();
    });
    wrap?.addEventListener('wheel', queueGeneographWheelZoom, { passive: false });
    wrap?.addEventListener('scroll', expandGeneographCanvasNearEdge, { passive: true });
    ensureGeneographPointerBinding();
    main.querySelector('[data-geneo-inline-input]')?.addEventListener('blur', () => commitGeneoInlineEdit(false));
    main.querySelector('[data-geneo-inline-input]')?.addEventListener('keydown', event =>
    {
        if (event.key === 'Escape')
        {
            event.preventDefault(); commitGeneoInlineEdit(true);
        }
        else if (event.key === 'Enter' && (event.ctrlKey || event.metaKey || event.target.tagName === 'INPUT'))
        {
            event.preventDefault(); commitGeneoInlineEdit(false);
        }
    });
    main.querySelectorAll('[data-geneo-zoom]').forEach(button => button.addEventListener('click', () =>
    {
        const nextZoom = button.dataset.geneoZoom === 'in' ? geneoNextZoom(1) : button.dataset.geneoZoom === 'out' ? geneoNextZoom(-1) : 65;
        setGeneographZoom(nextZoom, { center: geneoCurrentViewportCenter() });
    }));
    main.querySelector('[data-geneo-inspector-toggle]')?.addEventListener('click', () =>
    {
        state.geneoInspectorCollapsed = !state.geneoInspectorCollapsed; renderGeneographEditorPreserveScroll();
    });
    main
        .querySelector(
            '[data-geneo-export]'
        )
        ?.addEventListener(
            'click',
            event => exportGeneographBoard(event.currentTarget)
        );
    main
        .querySelectorAll('[data-geneo-node-field]')
        .forEach(input =>
        {
            /*
          * Capture the node identity while binding.
          * Do not resolve through the current selection
          * after the user starts interacting elsewhere.
          */
            const nodeId =
                state.selectedGeneoNodeId;

            input.addEventListener('change', () =>
            {
                const node =
                    getGeneographNode(nodeId);

                if (!node) return;

                const field =
                    input.dataset.geneoNodeField;

                if (!field) return;

                const nextValue =
                    input.value;

                if (node[field] === nextValue)
                {
                    return;
                }

                geneoPushHistory();

                node[field] = nextValue;

                touchGeneographBoard();

                renderGeneographEditorPreserveScroll({
                    preserveInspectorScroll: true
                });
            });
        });
    bindGeneoPaintControls();
    bindGeneoConnectionControls();
    bindGeneoCreationToolControls();
    main.querySelectorAll('[data-geneo-stroke-pattern]').forEach(input =>
    {
        input.addEventListener('change', event =>
        {
            const scope = event.target.dataset.geneoStrokePattern;
            const entity = scope === 'connection' ? selectedGeneographConnection() : selectedGeneographNode();
            if (!entity) return;
            const target = scope === 'connection' ? entity.style : entity.appearance;
            const nextPattern = scope === 'connection' && GENEO_CONNECTION_PATTERNS.includes(event.target.value) ? event.target.value : event.target.value === 'dashed' ? 'dashed' : 'solid';
            const currentPattern = scope === 'connection' ? geneoEffectiveConnectionStyle(entity).pattern
                : entity.type === 'person' ? geneoResolveVisibleNodeAppearance(entity).strokePattern : target.strokePattern;
            if (currentPattern === nextPattern) return;
            geneoPushHistory();
            if (scope === 'connection')
            {
                if (nextPattern === selectedGeneographDiagram().connectionDefaults.pattern) delete target.pattern;
                else target.pattern = nextPattern;
            }
            else target.strokePattern = nextPattern;
            if (scope === 'node' && entity.type === 'person')
            {
                entity.appearance.styleOverrides ||= { strokeWidth: false, strokePattern: false };
                entity.appearance.styleOverrides.strokePattern = true;
            }
            touchGeneographBoard();
            renderGeneographEditorPreserveScroll({ preserveInspectorScroll: true });
        });
    });
    main.querySelectorAll('[data-geneo-stroke-width]').forEach(input =>
    {
        const scope = input.dataset.geneoStrokeWidth;
        const entityId = scope === 'connection'
            ? state.selectedGeneoConnectionId
            : state.selectedGeneoNodeId;
        const commitStrokeWidth = () =>
        {
            const entity = scope === 'connection'
                ? getGeneographConnection(entityId)
                : getGeneographNode(entityId);
            if (!entity) return;
            const target = scope === 'connection' ? entity.style : entity.appearance;
            const key = scope === 'connection' ? 'width' : 'strokeWidth';
            const currentWidth = scope === 'connection' ? geneoEffectiveConnectionStyle(entity).width
                : entity.type === 'person' ? geneoResolveVisibleNodeAppearance(entity).strokeWidth : target[key];
            const nextWidth = Math.round(geneoNumber(
                input.value,
                currentWidth,
                GENEO_STROKE_WIDTH_MIN,
                GENEO_STROKE_WIDTH_MAX
            ));
            input.value = nextWidth;
            if (currentWidth === nextWidth) return;
            geneoPushHistory();
            if (scope === 'connection')
            {
                if (nextWidth === selectedGeneographDiagram().connectionDefaults.width) delete target.width;
                else target.width = nextWidth;
            }
            else target[key] = nextWidth;
            if (scope === 'node' && entity.type === 'person')
            {
                entity.appearance.styleOverrides ||= { strokeWidth: false, strokePattern: false };
                entity.appearance.styleOverrides.strokeWidth = true;
            }
            touchGeneographBoard();
            renderGeneographEditorPreserveScroll({ preserveInspectorScroll: true });
        };
        input.addEventListener('change', commitStrokeWidth);
        input.addEventListener('keydown', event =>
        {
            if (event.key !== 'Enter') return;
            event.preventDefault();
            commitStrokeWidth();
        });
    });
    const nodeRadiusInput = main.querySelector('[data-geneo-node-corner-radius]');
    if (nodeRadiusInput)
    {
        const commitNodeRadius = () =>
        {
            const node = getGeneographNode(nodeRadiusInput.dataset.geneoNodeCornerRadius);
            if (!node || !Number.isFinite(node.appearance?.cornerRadius)) return;
            const radius = Math.round(geneoNumber(nodeRadiusInput.value, node.appearance.cornerRadius, 0, 32));
            nodeRadiusInput.value = radius;
            if (radius === node.appearance.cornerRadius) return;
            geneoPushHistory();
            node.appearance.cornerRadius = radius;
            touchGeneographBoard();
            renderGeneographEditorPreserveScroll({ preserveInspectorScroll: true });
        };
        nodeRadiusInput.addEventListener('change', commitNodeRadius);
        nodeRadiusInput.addEventListener('keydown', event =>
        {
            if (event.key !== 'Enter') return;
            event.preventDefault();
            commitNodeRadius();
        });
    }
    const imageOpacityInput = main.querySelector('[data-geneo-image-opacity]');
    if (imageOpacityInput)
    {
        const commitImageOpacity = () =>
        {
            const node = getGeneographNode(imageOpacityInput.dataset.geneoImageOpacity);
            if (!node || node.type !== 'image') return;
            const opacity = Math.round(geneoNumber(imageOpacityInput.value, node.appearance.imageOpacity ?? 100, 0, 100));
            imageOpacityInput.value = opacity;
            if (opacity === (node.appearance.imageOpacity ?? 100)) return;
            geneoPushHistory();
            node.appearance.imageOpacity = opacity;
            touchGeneographBoard();
            renderGeneographEditorPreserveScroll({ preserveInspectorScroll: true });
        };
        imageOpacityInput.addEventListener('change', commitImageOpacity);
        imageOpacityInput.addEventListener('keydown', event =>
        {
            if (event.key !== 'Enter') return;
            event.preventDefault();
            commitImageOpacity();
        });
    }
    const nodeFontSizeInput = main.querySelector('[data-geneo-node-font-size]');
    if (nodeFontSizeInput)
    {
        const commitNodeFontSize = () =>
        {
            const node = getGeneographNode(nodeFontSizeInput.dataset.geneoNodeFontSize);
            if (!node || !['text', 'sticky', 'place'].includes(node.type)) return;
            if (nodeFontSizeInput.value.trim() === '' || !nodeFontSizeInput.checkValidity())
            {
                nodeFontSizeInput.reportValidity();
                return;
            }
            const fontSize = Number(nodeFontSizeInput.value);
            if (fontSize === node.appearance.fontSize) return;
            geneoPushHistory();
            node.appearance.fontSize = fontSize;
            if (node.type === 'place') node.placeSizeMode = 'manual';
            touchGeneographBoard();
            renderGeneographEditorPreserveScroll({ preserveInspectorScroll: true });
        };
        nodeFontSizeInput.addEventListener('change', commitNodeFontSize);
        nodeFontSizeInput.addEventListener('keydown', event =>
        {
            if (event.key !== 'Enter') return;
            event.preventDefault();
            commitNodeFontSize();
        });
    }
    main
        .querySelectorAll(
            '[data-geneo-layout]'
        )
        .forEach(input =>
        {
            input.addEventListener(
                'change',
                () =>
                {
                    const node =
                        selectedGeneographNode();

                    if (!node) return;

                    const field =
                        input.dataset
                            .geneoLayout;

                    const minimumSize =
                        geneoNodeMinimumSize(
                            node,
                            node.width
                        );

                    const maximumSize =
                        geneoNodeMaximumSize(
                            node
                        );

                    const minimum =
                        field === 'width'
                            ? minimumSize.width
                            : field === 'height'
                                ? minimumSize.height
                                : -GENEO_WORLD_LIMIT;

                    const maximum =
                        field === 'width'
                            ? maximumSize.width
                            : field === 'height'
                                ? maximumSize.height
                                : GENEO_WORLD_LIMIT;

                    const nextValue =
                        geneoNumber(
                            input.value,
                            node[field],
                            minimum,
                            maximum
                        );

                    if (
                        nextValue ===
                node[field]
                    )
                    {
                        return;
                    }

                    geneoPushHistory();

                    if (
                        node.type === 'person'
                && field === 'height'
                    )
                    {
                        node.personCard.heightMode =
                            'manual';
                    }

                    if (
                        node.type === 'place'
                && [
                    'width',
                    'height'
                ].includes(field)
                    )
                    {
                        node.placeSizeMode =
                            'manual';
                    }

                    node[field] =
                        nextValue;

                    if (
                        node.type === 'panel'
                    )
                    {
                        reconcileGeneographPanelMembership(
                            node.id
                        );
                    }

                    touchGeneographBoard();

                    renderGeneographEditorPreserveScroll({
                        preserveInspectorScroll:
                  true
                    });
                }
            );
        });

    main
        .querySelector(
            '[data-geneo-place-fit-content]'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                const node =
                    selectedGeneographNode();

                if (
                    node?.type !== 'place'
              || geneoPlaceUsesAutoSize(node)
                )
                {
                    return;
                }

                geneoPushHistory();

                node.placeSizeMode =
                    'auto';

                touchGeneographBoard();

                renderGeneographEditorPreserveScroll({
                    preserveInspectorScroll: true,
                    preserveSidebarScroll: true
                });
            }
        );

    main.querySelector('[data-geneo-image-fit]')?.addEventListener('click', () =>
    {
        const node = selectedGeneographNode();
        if (node?.type !== 'image') return;
        const source = resolveGeneographImageSource(node);
        if (!source.available || !(source.width > 0 && source.height > 0)) return;
        const ratio = source.width / source.height;
        const minimum = geneoNodeMinimumSize(node);
        const maximum = geneoNodeMaximumSize(node);
        const width = Math.round(Math.max(minimum.width, minimum.height * ratio,
            Math.min(node.width, maximum.width, maximum.height * ratio)));
        const height = Math.round(width / ratio);
        if (node.width === width && node.height === height) return;
        geneoPushHistory();
        node.x += (node.width - width) / 2;
        node.y += (node.height - height) / 2;
        node.width = width;
        node.height = height;
        touchGeneographBoard();
        renderGeneographEditorPreserveScroll({ preserveInspectorScroll: true });
    });
    main
        .querySelector(
            '[data-geneo-person-fit-height]'
        )
        ?.addEventListener('click', () =>
        {
            const node = selectedGeneographNode();

            if (
                node?.type !== 'person'
            || node.personCard?.heightMode === 'auto'
            )
            {
                return;
            }

            geneoPushHistory();
            node.personCard.heightMode = 'auto';
            touchGeneographBoard();

            renderGeneographEditorPreserveScroll({
                preserveInspectorScroll: true,
                preserveSidebarScroll: true
            });
        });

    main.querySelector('[data-geneo-apply-gender-color]')?.addEventListener('click', () =>
    {
        const node = selectedGeneographNode();
        const diagram = selectedGeneographDiagram();
        if (node?.type !== 'person' || !diagram) return;
        geneoPushHistory();
        geneoApplyPersonGenderAppearance(node, diagram);
        touchGeneographBoard();
        renderGeneographEditorPreserveScroll({ preserveInspectorScroll: true });
        requestAnimationFrame(() => main.querySelector('[data-geneo-apply-gender-color]')?.focus({ preventScroll: true }));
    });
    main.querySelector('[data-geneo-link-person]')?.addEventListener('click', openGeneographTreePersonPicker);
    main.querySelector('[data-geneo-import-family]')?.addEventListener('click', () => openGeneographTreeImport());
    main.querySelector('[data-geneo-edit-person]')?.addEventListener('click', () =>
    {
        const person = getGeneographPerson(selectedGeneographNode()?.personId); if (person) openGeneographPersonModal(person.id);
    });
    main
        .querySelector(
            '[data-geneo-unlink-person]'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                const person =
                    getGeneographPerson(
                        selectedGeneographNode()
                            ?.personId
                    );

                if (!person) return;

                geneoPushHistory();

                person.treePersonId =
                    null;

                person.syncState =
                    'local';

                touchGeneographBoard();

                renderGeneographEditorPreserveScroll({
                    preserveInspectorScroll: true,
                    preserveSidebarScroll: true
                });

                showToast(
                    'Person unlinked from Family Tree.'
                );
            }
        );
    main.querySelector('[data-geneo-edit-place]')?.addEventListener('click', event => openGeneographPlaceModal(event.currentTarget.dataset.geneoEditPlace));
    main.querySelector('[data-geneo-place-board-only]')?.addEventListener('click', event => makeGeneographPlaceBoardOnly(event.currentTarget.dataset.geneoPlaceBoardOnly));
    main.querySelector('[data-geneo-open-place]')?.addEventListener('click', event => openGeneographPlaceInPlaces(event.currentTarget.dataset.geneoOpenPlace));
    main.querySelector('[data-geneo-inspector-shape-kind]')?.addEventListener('change', event =>
    {
        const node = selectedGeneographNode();
        const kind = event.target.value;
        if (node?.type !== 'shape' || !GENEO_SHAPE_KINDS.some(shape => shape.id === kind) || node.shapeKind === kind) return;
        geneoPushHistory();
        node.shapeKind = kind;
        touchGeneographBoard();
        renderGeneographEditorPreserveScroll({ preserveInspectorScroll: true });
    });
    main
        .querySelector('[data-geneo-replace-image]')
        ?.addEventListener('click', () =>
        {
            const node = selectedGeneographNode();

            if (node?.type === 'image')
            {
                openGeneographImagePicker({
                    mode: 'replace',
                    nodeId: node.id
                });
            }
        });

    main
        .querySelector('[data-geneo-open-project-photo]')
        ?.addEventListener('click', event =>
        {
            const photoId =
                event.currentTarget.dataset.geneoOpenProjectPhoto;

            if (getPhoto(photoId, {
                projectId: selectedGeneographBoard()?.projectId || ''
            }))
            {
                openAlbumsForPhoto(photoId);
            }
        });
    main.querySelector('[data-geneo-delete-selection]')?.addEventListener('click', deleteGeneographSelection);
    const relationshipEditor = main.querySelector('[data-geneo-relationship-editor]');
    if (relationshipEditor)
    {
        bindGenealogyDateFields(relationshipEditor);
        bindPlaceComboboxes(relationshipEditor);
        let committed = geneoRelationshipEditorFingerprint(relationshipEditor);
        const commit = () =>
        {
            const current = geneoRelationshipEditorFingerprint(relationshipEditor);
            if (current === committed) return;
            if (saveGeneographPartnerRelationship(relationshipEditor)) committed = current;
        };
        relationshipEditor.addEventListener('change', event =>
        {
            if (event.target.matches('[data-geneo-relationship-type]'))
                updatePartnerRelationshipFields(relationshipEditor, event.target.value);
            commit();
        });
        relationshipEditor.addEventListener('genealogy-date-committed', commit);
    }
    main.querySelector('[data-geneo-show-relationship-dates]')?.addEventListener('change', event =>
    {
        const connection = selectedGeneographConnection(); if (!connection) return;
        if (geneoEffectiveShowRelationshipDates(connection) === event.target.checked) return;
        geneoPushHistory();
        if (event.target.checked === selectedGeneographDiagram().connectionDefaults.showRelationshipDates)
            delete connection.showRelationshipDates;
        else connection.showRelationshipDates = event.target.checked;
        touchGeneographBoard(); renderGeneographEditorPreserveScroll();
    });
    main
        .querySelector('[data-geneo-connection-routing]')
        ?.addEventListener('change', event =>
        {
            const connection =
                selectedGeneographConnection();

            if (!connection) return;

            const automaticPoints = connection.route.mode === 'auto'
                && event.target.value === 'manual' && !connection.route.waypoints.length
                ? geneoConnectionPoints(connection) : null;
            geneoPushHistory();

            connection.route.mode =
                event.target.value;

            if (connection.route.mode === 'manual') delete connection.route.railY;

            if (
                connection.route.mode === 'manual'
            && !connection.route.waypoints.length
            )
            {
                const points = automaticPoints ||
                    geneoConnectionPoints({
                        ...connection,
                        route: {
                            mode: 'auto',
                            waypoints: []
                        }
                    });

                connection.route.waypoints =
                    points
                        .slice(1, -1)
                        .map(snapGeneographPoint);
            }

            touchGeneographBoard();

            renderGeneographEditorPreserveScroll({
                preserveInspectorScroll: true
            });
        });

    main
        .querySelector('[data-geneo-reset-route]')
        ?.addEventListener('click', () =>
        {
            const connection =
                selectedGeneographConnection();

            if (!connection) return;

            geneoPushHistory();

            const bus = geneoFamilyChildBusGroups().byConnection.get(connection.id);
            bus?.connectionIds.forEach(id =>
            {
                const member = getGeneographConnection(id);
                if (member?.route) delete member.route.railY;
            });

            connection.route = {
                mode: 'auto',
                waypoints: []
            };

            touchGeneographBoard();

            renderGeneographEditorPreserveScroll({
                preserveInspectorScroll: true
            });
        });
    main.querySelectorAll('[data-geneo-background-pattern]').forEach(button => button.addEventListener('click', () => updateGeneoCanvasSetting('backgroundPattern', button.dataset.geneoBackgroundPattern)));
    main.querySelector('[data-geneo-sockets]')?.addEventListener('change', event => updateGeneoCanvasSetting('alwaysShowSockets', event.target.checked));
    main.querySelector('[data-geneo-snap]')?.addEventListener('change', event => updateGeneoCanvasSetting('snapToGrid', event.target.checked));
    main.querySelector('[data-geneo-object-highlight]')?.addEventListener('change', event => {
        geneoCanvasRuntime.objectHighlight = event.target.value;
        renderGeneographEditorPreserveScroll({ preserveInspectorScroll: true });
    });
    main.querySelector('[data-geneo-person-gender-colors]')?.addEventListener('change', event => updateGeneoCanvasSetting('colorPersonCardsByGender', event.target.checked));
    const cardDefaults = selectedGeneographDiagram().cardAppearanceDefaults;
    const updateCardDefault = (gender, key, value) => {
        const appearance = cardDefaults?.[gender];
        if (!appearance || appearance[key] === value) return;
        geneoPushHistory();
        appearance[key] = value;
        if (gender === 'neutral' && key === 'cornerRadius')
            selectedGeneographDiagram().personCardDefaults.cornerRadius = value;
        touchGeneographBoard();
        renderGeneographEditorPreserveScroll({ preserveInspectorScroll: true });
    };
    main.querySelectorAll('[data-geneo-card-default-stroke-width]').forEach(input =>
        input.addEventListener('change', () => {
            const gender = input.dataset.geneoCardDefaultStrokeWidth;
            updateCardDefault(gender, 'strokeWidth', Math.round(geneoNumber(input.value, cardDefaults[gender].strokeWidth, 1, 12)));
        }));
    main.querySelectorAll('[data-geneo-card-default-stroke-pattern]').forEach(input =>
        input.addEventListener('change', () =>
            updateCardDefault(input.dataset.geneoCardDefaultStrokePattern, 'strokePattern', input.value === 'dashed' ? 'dashed' : 'solid')));
    main.querySelectorAll('[data-geneo-card-default-radius]').forEach(input =>
        input.addEventListener('change', () => {
            const gender = input.dataset.geneoCardDefaultRadius;
            updateCardDefault(gender, 'cornerRadius', Math.round(geneoNumber(input.value, cardDefaults[gender].cornerRadius, 0, 32)));
        }));
    main.querySelector('[data-geneo-settings]')?.addEventListener('click', openGeneographSettingsModal);
    main.querySelector('[data-geneo-reset-canvas-defaults]')?.addEventListener('click', () => {
        const diagram = selectedGeneographDiagram();
        if (!diagram) return;
        geneoPushHistory();
        const defaults = createEmptyGeneographDiagram();
        diagram.canvas = defaults.canvas;
        diagram.cardAppearanceDefaults = defaults.cardAppearanceDefaults;
        diagram.personCardDefaults = defaults.personCardDefaults;
        diagram.connectionDefaults = defaults.connectionDefaults;
        geneoConnectionToolRuntime.overrides = {};
        geneoCanvasRuntime.objectHighlight = 'none';
        touchGeneographBoard();
        renderGeneographEditorPreserveScroll({ preserveInspectorScroll: true });
    });
    bindGeneographInspectorNameField();
    bindGeneographNodeHeader();
    bindGeneographPersonCardControls();
    bindGeneographPersonMultiAppearance();
    bindGeneographGenericBulkControls();
    bindGeneographShadowControls();
    bindGeneographSidebarControls();
    bindToasts(main);
}

function bindGeneographShadowControls()
{
    main.querySelectorAll('[data-geneo-shadow]').forEach(input =>
    {
        if (input.dataset.mixed === 'true') input.indeterminate = true;
        input.addEventListener('change', () =>
        {
            const diagram = selectedGeneographDiagram();
            if (!diagram) return;
            const scope = input.dataset.geneoShadow;
            if (scope === 'canvas')
            {
                updateGeneoCanvasSetting('shadowEnabled', input.checked);
                return;
            }
            const nodes = scope === 'node' ? [selectedGeneographNode()].filter(Boolean)
                : selectedGeneographNodes();
            if (!nodes.length || nodes.every(node => node.appearance.shadowEnabled === input.checked)) return;
            geneoPushHistory();
            nodes.forEach(node => { node.appearance.shadowEnabled = input.checked; });
            touchGeneographBoard();
            renderGeneographEditorPreserveScroll({ preserveInspectorScroll: true, preserveSidebarScroll: true });
        });
    });
}

function ensureGeneographPointerBinding()
{
    if (geneoPointerBound) return;
    geneoPointerBound = true;
    window.addEventListener('pointermove', moveGeneographObject);
    window.addEventListener('pointerup', endGeneographObjectDrag);
    window.addEventListener('pointercancel', endGeneographObjectDrag);
    document.addEventListener('selectstart', event =>
    {
        if (geneoPointerState?.kind === 'move-group' && geneoPointerState.axisLockAllowed)
            event.preventDefault();
    });
}

function updateGeneoCanvasSetting(field, value)
{
    const canvas = selectedGeneographDiagram().canvas;

    if (canvas[field] === value) return;

    geneoPushHistory();
    canvas[field] = value;
    touchGeneographBoard();

    renderGeneographEditorPreserveScroll({
        preserveInspectorScroll: true,
        preserveSidebarScroll: true
    });
}

function bindGeneographSidebarControls()
{
    geneoCancelLayerDrag();
    const layerList = sidebar.querySelector('.geneo-layer-list');
    layerList?.addEventListener('dragover', event =>
    {
        if (!geneoLayerDrag) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = geneoUpdateLayerDrop(event.clientX, event.clientY) ? 'move' : 'none';
    });
    layerList?.addEventListener('drop', event =>
    {
        if (!geneoLayerDrag) return;
        event.preventDefault(); geneoUpdateLayerDrop(event.clientX, event.clientY); geneoFinishLayerDrop();
    });
    layerList?.addEventListener('dragleave', event =>
    {
        if (geneoLayerDrag && !layerList.contains(event.relatedTarget))
        {
            geneoLayerDrag.targetId = '';
            layerList.querySelectorAll('.layer-drop-before, .layer-drop-after').forEach(element => element.classList.remove('layer-drop-before', 'layer-drop-after'));
        }
    });
    sidebar.querySelectorAll('[data-geneo-layer-connection]').forEach(row => row.addEventListener('dragstart', event => event.preventDefault()));
    sidebar.querySelectorAll('[data-geneo-collapse-connections]').forEach(button => button.addEventListener('click', () =>
    {
        const expanded = geneoConnectionDisclosureState.get(selectedGeneographBoard().id);
        const id = button.dataset.geneoCollapseConnections;
        if (expanded.has(id)) expanded.delete(id); else expanded.add(id);
        renderGeneographEditorPreserveScroll({ preserveSidebarScroll: true });
    }));
    if (
        !sidebar.dataset
            .geneoLayerRenameBound
    )
    {
        sidebar.dataset
            .geneoLayerRenameBound = 'true';

        /*
        * The sidebar contents are replaced after
        * selection. Detect the second mouse press
        * from the persistent sidebar element.
        */
        sidebar.addEventListener(
            'mousedown',
            event =>
            {
                if (
                    event.button !== 0
              || event.detail !== 2
                )
                {
                    return;
                }

                const handle =
                    event.target.closest?.(
                        '[data-geneo-layer-rename-handle]'
                    );

                if (!handle) return;

                const nodeRow =
                    handle.closest(
                        '[data-geneo-layer]'
                    );

                const connectionRow =
                    handle.closest(
                        '[data-geneo-layer-connection]'
                    );

                if (!nodeRow && !connectionRow)
                {
                    return;
                }

                event.preventDefault();
                event.stopPropagation();

                if (nodeRow)
                {
                    beginGeneographLayerRename(
                        'node',
                        nodeRow.dataset.geneoLayer
                    );
                }
                else
                {
                    beginGeneographLayerRename(
                        'connection',
                        connectionRow.dataset
                            .geneoLayerConnection
                    );
                }
            },
            true
        );
    }
    sidebar.querySelector('[data-geneo-all-boards]')?.addEventListener('click', () =>
    {
        captureGeneographViewport(); cancelGeneographConnectionDraft(); state.geneoView = 'home'; selectGeneographCanvas(); renderGeneographHome();
    });
    sidebar.querySelector('[data-geneo-item-filter-trigger]')?.addEventListener('click', event =>
    {
        state.geneoItemFilterOpen = !state.geneoItemFilterOpen;
        const menu = sidebar.querySelector('[data-geneo-item-filter-menu]');
        if (menu) menu.hidden = !state.geneoItemFilterOpen;
        event.currentTarget.setAttribute('aria-expanded', String(state.geneoItemFilterOpen));
        if (state.geneoItemFilterOpen) menu?.querySelector('input')?.focus();
    });
    sidebar.querySelectorAll('[data-geneo-item-filter-type]').forEach(input => input.addEventListener('change', () =>
    {
        state.geneoItemFilter.types = [...sidebar.querySelectorAll('[data-geneo-item-filter-type]:checked')]
            .map(item => item.dataset.geneoItemFilterType);
        renderGeneographEditorPreserveScroll({ preserveSidebarScroll: true });
        sidebar.querySelector(`[data-geneo-item-filter-type="${input.dataset.geneoItemFilterType}"]`)?.focus({ preventScroll: true });
    }));
    sidebar.querySelectorAll('[data-geneo-item-filter-status]').forEach(input => input.addEventListener('change', () =>
    {
        state.geneoItemFilter.status = input.dataset.geneoItemFilterStatus;
        renderGeneographEditorPreserveScroll({ preserveSidebarScroll: true });
        sidebar.querySelector(`[data-geneo-item-filter-status="${input.dataset.geneoItemFilterStatus}"]`)?.focus({ preventScroll: true });
    }));
    sidebar.querySelectorAll('[data-geneo-item-filter-clear]').forEach(button => button.addEventListener('click', () =>
    {
        state.geneoItemFilter = { types: [], status: 'all' };
        state.geneoLayerSearch = '';
        state.geneoItemFilterOpen = false;
        renderGeneographEditorPreserveScroll({ preserveSidebarScroll: true });
        sidebar.querySelector('#geneoLayerSearch')?.focus({ preventScroll: true });
    }));
    if (!sidebar.dataset.geneoItemFilterDismissBound)
    {
        sidebar.dataset.geneoItemFilterDismissBound = 'true';
        document.addEventListener('pointerdown', event =>
        {
            if (!state.geneoItemFilterOpen || event.target.closest?.('[data-geneo-item-filter-trigger], [data-geneo-item-filter-menu]')) return;
            state.geneoItemFilterOpen = false;
            const menu = sidebar.querySelector('[data-geneo-item-filter-menu]');
            if (menu) menu.hidden = true;
            sidebar.querySelector('[data-geneo-item-filter-trigger]')?.setAttribute('aria-expanded', 'false');
        });
        document.addEventListener('keydown', event =>
        {
            if (event.key !== 'Escape' || !state.geneoItemFilterOpen) return;
            event.preventDefault();
            state.geneoItemFilterOpen = false;
            const menu = sidebar.querySelector('[data-geneo-item-filter-menu]');
            if (menu) menu.hidden = true;
            const trigger = sidebar.querySelector('[data-geneo-item-filter-trigger]');
            trigger?.setAttribute('aria-expanded', 'false');
            trigger?.focus({ preventScroll: true });
        });
    }
    sidebar.querySelector('#geneoLayerSearch')?.addEventListener('input', event =>
    {
        state.geneoLayerSearch = event.target.value; renderGeneographEditorPreserveScroll(); requestAnimationFrame(() =>
        {
            const input = sidebar.querySelector('#geneoLayerSearch'); if (input)
            {
                input.focus(); input.setSelectionRange(input.value.length, input.value.length);
            }
        });
    });
    sidebar
        .querySelectorAll(
            '[data-geneo-layer]'
        )
        .forEach(row =>
        {
            row.addEventListener(
                'click',
                event =>
                {
                    if (
                        event.target.closest(
                            'button,input'
                        )
                    )
                    {
                        return;
                    }

                    const nodeId = row.dataset.geneoLayer;
                    const boardId = selectedGeneographBoard()?.id;
                    if (event.shiftKey && !event.ctrlKey && !event.metaKey)
                    {
                        const displayedIds = [...sidebar.querySelectorAll('.geneo-layer-list [data-geneo-layer]')]
                            .map(item => item.dataset.geneoLayer);
                        const anchorId = geneoLayerRangeAnchor?.boardId === boardId
                            ? geneoLayerRangeAnchor.nodeId : null;
                        setGeneographNodeSelection(geneoLayerRangeIds(displayedIds, anchorId, nodeId), nodeId);
                        if (!displayedIds.includes(anchorId)) geneoLayerRangeAnchor = { boardId, nodeId };
                    }
                    else
                    {
                        selectGeneographNode(nodeId, { toggle: event.ctrlKey || event.metaKey });
                        if (!event.ctrlKey && !event.metaKey) geneoLayerRangeAnchor = { boardId, nodeId };
                    }
                    renderGeneographEditorPreserveScroll();
                }
            );

            row.addEventListener(
                'keydown',
                event =>
                {
                    if (
                        event.target.closest('button,input')
                    )
                    {
                        return;
                    }

                    if (event.key === 'F2')
                    {
                        event.preventDefault();

                        beginGeneographLayerRename(
                            'node',
                            row.dataset.geneoLayer
                        );

                        return;
                    }

                    if (
                        event.key !== 'Enter'
                && event.key !== ' '
                    )
                    {
                        return;
                    }

                    event.preventDefault();

                    selectGeneographNode(
                        row.dataset.geneoLayer,
                        {
                            toggle:
                    event.shiftKey
                    || event.ctrlKey
                    || event.metaKey
                        }
                    );

                    renderGeneographEditorPreserveScroll();
                }
            );

            bindGeneoLayerRow(row);
        });
    sidebar
        .querySelectorAll(
            '[data-geneo-layer-connection]'
        )
        .forEach(row =>
        {
            bindGeneoConnectionContextMenu(row, 'sidebar');
            row.addEventListener(
                'click',
                event =>
                {
                    if (
                        event.target.closest('button,input')
                    )
                    {
                        return;
                    }

                    selectGeneographConnection(
                        row.dataset
                            .geneoLayerConnection,
                        null,
                        {
                            toggle:
                    event.shiftKey
                    || event.ctrlKey
                    || event.metaKey
                        }
                    );

                    renderGeneographEditorPreserveScroll();
                }
            );

            row.addEventListener(
                'keydown',
                event =>
                {
                    if (
                        event.target.closest('button,input')
                    )
                    {
                        return;
                    }

                    if (event.key === 'F2')
                    {
                        event.preventDefault();

                        beginGeneographLayerRename(
                            'connection',
                            row.dataset
                                .geneoLayerConnection
                        );

                        return;
                    }

                    if (
                        event.key !== 'Enter'
                && event.key !== ' '
                    )
                    {
                        return;
                    }

                    event.preventDefault();

                    selectGeneographConnection(
                        row.dataset
                            .geneoLayerConnection
                    );

                    renderGeneographEditorPreserveScroll();
                }
            );
        });
    sidebar.querySelectorAll('[data-geneo-toggle-connection-visible]').forEach(button => button.addEventListener('click', event =>
    {
        event.stopPropagation();
        const connection = getGeneographConnection(button.dataset.geneoToggleConnectionVisible);
        if (!connection) return;
        geneoPushHistory();
        connection.visible = connection.visible === false;
        touchGeneographBoard();
        renderGeneographEditorPreserveScroll({ preserveSidebarScroll: true });
    }));
    sidebar.querySelectorAll('[data-geneo-locate-node]').forEach(button => button.addEventListener('click', event =>
    {
        event.stopPropagation();
        const node = getGeneographNode(button.dataset.geneoLocateNode);
        if (!node || !geneoNodeEffectiveVisible(node)) return;
        const center = { x: node.x + node.width / 2, y: node.y + node.height / 2 };
        selectGeneographNode(node.id);
        renderGeneographEditorPreserveScroll({ preserveSidebarScroll: true });
        scheduleGeneographViewportRestore(center);
    }));
    sidebar.querySelectorAll('[data-geneo-locate-connection]').forEach(button => button.addEventListener('click', event =>
    {
        event.stopPropagation();
        const connection = getGeneographConnection(button.dataset.geneoLocateConnection);
        if (!connection || !geneoConnectionEffectiveVisible(connection)) return;
        const points = geneoConnectionPoints(connection);
        const center = points.length ? {
            x: (Math.min(...points.map(point => point.x)) + Math.max(...points.map(point => point.x))) / 2,
            y: (Math.min(...points.map(point => point.y)) + Math.max(...points.map(point => point.y))) / 2
        } : null;
        selectGeneographConnection(connection.id);
        renderGeneographEditorPreserveScroll({ preserveSidebarScroll: true });
        scheduleGeneographViewportRestore(center);
    }));
    sidebar.querySelectorAll('[data-geneo-toggle-visible]').forEach(button => button.addEventListener('click', event =>
    {
        event.stopPropagation(); const node = getGeneographNode(button.dataset.geneoToggleVisible); if (node)
        {
            geneoPushHistory(); node.visible = !node.visible; touchGeneographBoard(); renderGeneographEditorPreserveScroll();
        }
    }));
    sidebar.querySelectorAll('[data-geneo-toggle-lock]').forEach(button => button.addEventListener('click', event =>
    {
        event.stopPropagation(); const node = getGeneographNode(button.dataset.geneoToggleLock); if (node)
        {
            geneoPushHistory(); node.locked = !node.locked; touchGeneographBoard(); renderGeneographEditorPreserveScroll();
        }
    }));
    sidebar.querySelectorAll('[data-geneo-collapse-panel]').forEach(button => button.addEventListener('click', () =>
    {
        const id = button.dataset.geneoCollapsePanel; state.geneoCollapsedPanels[id] = !state.geneoCollapsedPanels[id]; renderGeneographEditorPreserveScroll();
    }));
    const renameInput =
        sidebar.querySelector(
            '[data-geneo-layer-rename-input]'
        );

    if (renameInput)
    {
        renameInput.addEventListener(
            'input',
            event =>
            {
                const rename =
                    state.geneoLayerRename;

                if (!rename) return;

                if (
                    rename.entityType
                !== event.target.dataset
                    .geneoRenameType
              || rename.entityId
                !== event.target.dataset
                    .geneoRenameId
                )
                {
                    return;
                }

                rename.draft =
                    event.target.value;
            }
        );

        renameInput.addEventListener(
            'keydown',
            event =>
            {
                if (event.key === 'Enter')
                {
                    event.preventDefault();
                    event.stopPropagation();

                    finishGeneographLayerRename({
                        value: event.target.value,
                        restoreFocus: true
                    });

                    return;
                }

                if (event.key === 'Escape')
                {
                    event.preventDefault();
                    event.stopPropagation();

                    finishGeneographLayerRename({
                        cancel: true,
                        restoreFocus: true
                    });
                }
            }
        );

        renameInput.addEventListener(
            'blur',
            event =>
            {
                const value =
                    event.target.value;

                const entityType =
                    event.target.dataset
                        .geneoRenameType;

                const entityId =
                    event.target.dataset
                        .geneoRenameId;

                setTimeout(() =>
                {
                    if (
                        !geneoLayerRenameMatches(
                            entityType,
                            entityId
                        )
                    )
                    {
                        return;
                    }

                    finishGeneographLayerRename({
                        value,
                        restoreFocus: false
                    });
                }, 0);
            }
        );
    }
}

function ensureGeneographKeyboardBinding()
{
    if (geneoKeyboardBound) return; geneoKeyboardBound = true;
    document.addEventListener('keydown', event =>
    {
        if (event.key === 'Shift')
        {
            geneoShiftPressed = true;
        }
        if (event.key === 'Control' && !event.repeat && state.activeModule === 'Geneograph'
            && state.geneoView === 'board' && !modalBackdrop.classList.contains('open')
            && !event.target.closest?.('input,textarea,select,[contenteditable="true"]'))
        {
            setGeneoCtrlSelectPressed(true);
        }
        if (state.activeModule !== 'Geneograph' || state.geneoView !== 'board' || modalBackdrop.classList.contains('open')) return;
        if (event.key === 'Escape' && geneoImageCropRuntime)
        {
            event.preventDefault();
            event.stopPropagation();
            geneoFinishImageCrop(false);
            return;
        }
        if (event.key === 'Enter' && geneoImageCropRuntime && !event.target.closest?.('button'))
        {
            event.preventDefault();
            geneoFinishImageCrop(true);
            return;
        }
        if (event.key === 'Escape' && event.target.closest?.('[data-geneo-connection-panel]'))
        {
            event.preventDefault();
            geneoConnectionToolRuntime.panelOpen = false;
            renderGeneographEditorPreserveScroll();
            suppressSplitFocusAfterEscape(main.querySelector('[data-geneo-connection-main]'));
            return;
        }
        const editable = event.target.closest('input,textarea,select,[contenteditable="true"]');
        if (editable) return;
        if (event.ctrlKey || event.metaKey)
        {
            const key = event.key.toLowerCase();
            if (key === 'c' && selectedGeneographNodes().length)
            {
                event.preventDefault(); copyGeneographSelection(); return;
            }
            if (key === 'x' && selectedGeneographNodes().length)
            {
                event.preventDefault(); closeGeneographObjectContextMenu(); cutGeneographSelection(); return;
            }
            if (key === 'v' && geneoObjectClipboard?.boardId === selectedGeneographBoard()?.id)
            {
                event.preventDefault(); closeGeneographObjectContextMenu(); pasteGeneographObjects(); return;
            }
        }
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z')
        {
            event.preventDefault(); event.shiftKey ? redoGeneographChange() : undoGeneographChange(); return;
        }
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y')
        {
            event.preventDefault(); redoGeneographChange(); return;
        }
        if (event.key === 'Escape' && (state.geneoTool === 'pencil' || geneoPointerState?.kind === 'pencil'))
        {
            event.preventDefault();
            cancelGeneographPencilStroke();
            state.geneoTool = 'pan';
            renderGeneographEditorPreserveScroll();
            return;
        }
        if (event.key === 'Escape' && geneoPointerState?.kind === 'move-group')
        {
            event.preventDefault();
            const drag = geneoPointerState;
            geneoPointerState = null;
            const board = selectedGeneographBoard();
            if (board) board.diagram = JSON.parse(drag.beforeSnapshot);
            geneoHistoryRuntime.undo.length = drag.undoLength;
            geneoHistoryRuntime.redo = drag.redo;
            geneoClearAlignmentGuides();
            renderGeneographEditorPreserveScroll();
            return;
        }
        if (
            event.key === 'Escape'
          && (
              state.geneoTool === 'panel'
            || state.geneoTool === 'sticky'
            || state.geneoTool === 'text'
            || state.geneoTool === 'shape'
            || geneoPointerState?.kind
              === 'draw-panel'
            || geneoPointerState?.kind
              === 'draw-shape'
          )
        )
        {
            event.preventDefault();

            geneoPointerState = null;
            hideGeneographPanelDraftDom();

            finishGeneographPlacementTool();

            renderGeneographEditorPreserveScroll();
            return;
        }
        if (event.key === 'Escape' && state.geneoConnectionDraft)
        {
            event.preventDefault(); cancelGeneographConnectionDraft(); renderGeneographEditorPreserveScroll(); return;
        }
        if (event.key === 'Escape' && geneoCanvasRuntime.connectionClick)
        {
            event.preventDefault(); clearGeneographConnectionClick(); return;
        }
        if (event.key === 'Delete' || event.key === 'Backspace')
        {
            if (Number.isInteger(state.selectedGeneoWaypointIndex))
            {
                const connection = selectedGeneographConnection(); if (connection?.route.waypoints[state.selectedGeneoWaypointIndex])
                {
                    geneoPushHistory(); connection.route.waypoints.splice(state.selectedGeneoWaypointIndex, 1); state.selectedGeneoWaypointIndex = null; touchGeneographBoard(); renderGeneographEditorPreserveScroll();
                }
            }
            else deleteGeneographSelection(); return;
        }
        const selectedNodes = selectedGeneographNodes();
        const selectedConnections = selectedGeneographConnections();
        if ((!selectedNodes.length && !selectedConnections.length) || !['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.key)) return;
        const moving = geneoGroupMoveSnapshot(selectedNodes);
        const movingConnections = geneoConnectionMoveSnapshot(moving, selectedConnections);
        if (!moving.length && !movingConnections.length) return;
        event.preventDefault(); geneoPushHistory();
        const requested = event.shiftKey ? 10 : 1;
        const amount = selectedGeneographDiagram().canvas.snapToGrid ? GENEO_GRID_SIZE : requested;
        const dx = event.key === 'ArrowLeft' ? -amount : event.key === 'ArrowRight' ? amount : 0;
        const dy = event.key === 'ArrowUp' ? -amount : event.key === 'ArrowDown' ? amount : 0;
        applyGeneographSelectionTranslation({ nodes: moving, connections: movingConnections }, dx, dy);
        touchGeneographBoard(); renderGeneographEditorPreserveScroll();
    });
    document.addEventListener('keyup', event =>
    {
        if (event.key === 'Shift')
        {
            geneoShiftPressed = false;
        }
        if (event.key === 'Control') setGeneoCtrlSelectPressed(false);
    });
    document.addEventListener('focusin', event =>
    {
        if (event.target.closest?.('input,textarea,select,[contenteditable="true"]')
            || modalBackdrop.contains(event.target)) setGeneoCtrlSelectPressed(false);
    });
    window.addEventListener('blur', () =>
    {
        geneoShiftPressed = false;
        setGeneoCtrlSelectPressed(false);
    });
}

function openSimpleModal(title, message)
{
    openModal(`<div class="modal" role="dialog" aria-modal="true" aria-labelledby="simpleModalTitle"><div class="modal-header"><div><h2 id="simpleModalTitle">${escapeHtml(title)}</h2><p>${escapeHtml(message)}</p></div><button class="close-button" type="button" data-close>${icon.close}</button></div><div class="modal-footer"><button class="button primary" type="button" data-close>Got it</button></div></div>`);
}

