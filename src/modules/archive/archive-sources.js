const SOURCE_CATEGORIES =
    Object.freeze([
        Object.freeze({
            value:
            'institution',

            label:
            'Archive, library, or institution',

            shortLabel:
            'Institutions'
        }),

        Object.freeze({
            value:
            'online',

            label:
            'Website or online database',

            shortLabel:
            'Online sources'
        }),

        Object.freeze({
            value:
            'publication',

            label:
            'Book, newspaper, or publication',

            shortLabel:
            'Publications'
        }),

        Object.freeze({
            value:
            'person',

            label:
            'Person, interview, or correspondence',

            shortLabel:
            'People & correspondence'
        }),

        Object.freeze({
            value:
            'private-collection',

            label:
            'Family or personal collection',

            shortLabel:
            'Family & personal'
        }),

        Object.freeze({
            value:
            'other',

            label:
            'Other source',

            shortLabel:
            'Other'
        })
    ]);

const SOURCE_CATEGORY_BY_VALUE =
    new Map(
        SOURCE_CATEGORIES.map(
            category => [
                category.value,
                category
            ]
        )
    );

function sourceCategoryLabel(
    value,
    fallback =
        'Not categorized'
)
{
    return SOURCE_CATEGORY_BY_VALUE
        .get(value)
        ?.label
        || fallback;
}

function localizedSourceCategoryLabel(
    value,
    fallback =
        'Not categorized'
)
{
    const label =
        sourceCategoryLabel(
            value,
            fallback
        );

    return label
        ? translateText(label)
        : '';
}

function sourceCategoryShortLabel(
    value,
    fallback =
        'Not categorized'
)
{
    return SOURCE_CATEGORY_BY_VALUE
        .get(value)
        ?.shortLabel
        || fallback;
}

function localizedSourceCategoryShortLabel(
    value,
    fallback =
        'Not categorized'
)
{
    const label =
        sourceCategoryShortLabel(
            value,
            fallback
        );

    return label
        ? translateText(label)
        : '';
}

function archiveFolderById(id, projectId = currentProjectId())
{
    if (!id || !projectId) return null;
    return (sampleData.archiveFolders || []).find(folder =>
        folder.id === id
        && folder.projectId === projectId
    ) || null;
}

function archiveFileById(id, projectId = currentProjectId())
{
    if (!id || !projectId) return null;
    return (sampleData.archiveFiles || []).find(file =>
        file.id === id
        && file.projectId === projectId
    ) || null;
}

function archiveSourceById(id, projectId = currentProjectId())
{
    if (!id || !projectId) return null;
    return (sampleData.sources || []).find(source =>
        source.id === id
        && source.projectId === projectId
    ) || null;
}

function archiveSourceCustodialPlace(source)
{
    const place = source?.placeId ? getPlace(source.placeId) : null;
    return place && place.projectId === source.projectId
        ? place
        : null;
}

function archiveSourceCustodialPlaceLabel(source)
{
    const place = archiveSourceCustodialPlace(source);
    return place ? placeDisplayText(place) : '';
}

const SOURCE_LINK_TARGET_TYPES =
    Object.freeze([
        'file',
        'photo',
        'person',
        'event',
        'note',
        'place'
    ]);

function sourceTargetRecord(
    targetType,
    targetId,
    projectId =
        currentProjectId()
)
{
    if (
        !SOURCE_LINK_TARGET_TYPES.includes(
            targetType
        )
        || !targetId
    )
    {
        return null;
    }

    let record =
        null;

    if (targetType === 'file')
    {
        record =
            archiveFileById(
                targetId,
                projectId
            );
    }
    else if (
        targetType === 'photo'
    )
    {
        record =
            getPhoto(
                targetId,
                {
                    projectId
                }
            );
    }
    else if (
        targetType === 'person'
    )
    {
        record =
            getPerson(
                targetId
            );
    }
    else if (
        targetType === 'event'
    )
    {
        record =
            (
                sampleData.events || []
            ).find(event =>
                event.id === targetId
            )
          || null;
    }
    else if (
        targetType === 'note'
    )
    {
        record =
            getNote(
                targetId,
                {
                    projectId,
                    includeArchived:
                true
                }
            );
    }
    else if (
        targetType === 'place'
    )
    {
        record =
            getPlace(
                targetId
            );
    }

    if (
        !record
        || (
            projectId
          && record.projectId
          && record.projectId
            !== projectId
        )
    )
    {
        return null;
    }

    return record;
}

function sourceLinksForProject(
    projectId =
        currentProjectId()
)
{
    return (
        sampleData.sourceLinks || []
    ).filter(link =>
        !projectId
        || link.projectId
          === projectId
    );
}

function sourceLinksForSource(
    sourceId,
    targetType = '',
    projectId =
        currentProjectId()
)
{
    return sourceLinksForProject(
        projectId
    ).filter(link =>
        link.sourceId === sourceId
        && (
            !targetType
          || link.targetType
            === targetType
        )
    );
}

function sourceLinksForTarget(
    targetType,
    targetId,
    projectId =
        currentProjectId()
)
{
    return sourceLinksForProject(
        projectId
    ).filter(link =>
        link.targetType === targetType
        && link.targetId === targetId
    );
}

function sourceTargetIds(
    sourceId,
    targetType,
    projectId =
        currentProjectId()
)
{
    return archiveUniqueIds(
        sourceLinksForSource(
            sourceId,
            targetType,
            projectId
        ).map(link =>
            link.targetId
        )
    );
}

function sourceIdsForTarget(
    targetType,
    targetId,
    projectId =
        currentProjectId()
)
{
    return archiveUniqueIds(
        sourceLinksForTarget(
            targetType,
            targetId,
            projectId
        ).map(link =>
            link.sourceId
        )
    );
}

function connectedSourceTargetLabel(
    targetType,
    target
)
{
    if (!target)
    {
        return 'record';
    }

    if (targetType === 'person')
    {
        return (
            personResourceDisplayName(target)
          || target.name
          || 'person'
        );
    }

    if (targetType === 'photo')
    {
        return (
            target.title
          || target.filename
          || 'photo'
        );
    }

    if (targetType === 'file')
    {
        return (
            target.name
          || target.title
          || 'file'
        );
    }

    if (targetType === 'event')
    {
        return (
            target.title
          || target.typeLabel
          || target.type
          || 'event'
        );
    }

    if (targetType === 'note')
    {
        return (
            target.title
          || 'note'
        );
    }

    if (targetType === 'place')
    {
        return (
            placeDisplayText(target)
          || target.name
          || 'place'
        );
    }

    return (
        target.title
        || target.name
        || 'record'
    );
}

function currentArchiveSourceTargetFilter()
{
    const filter =
        state.archiveSourceTargetFilter;

    if (
        !filter
        || !SOURCE_LINK_TARGET_TYPES.includes(
            filter.targetType
        )
        || !filter.targetId
        || filter.projectId
          !== currentProjectId()
    )
    {
        return null;
    }

    const target =
        sourceTargetRecord(
            filter.targetType,
            filter.targetId,
            filter.projectId
        );

    return target
        ? {
            ...filter,
            target
        }
        : null;
}

function openArchiveSourcesForTarget({
    targetType,
    targetId,
    projectId =
        currentProjectId()
})
{
    const target =
        sourceTargetRecord(
            targetType,
            targetId,
            projectId
        );

    if (!target)
    {
        showToast(
            'The connected record is no longer available.'
        );

        return;
    }

    const sourceIds =
        sourceIdsForTarget(
            targetType,
            targetId,
            projectId
        );

    const activated =
        activateProject(
            projectId,
            {
                moduleName:
              'Archive',

                renderNow:
              false,

                reset:
              false
            }
        );

    if (!activated)
    {
        return;
    }

    state.archiveView =
        'sources';

    state.archiveSearch =
        '';

    state.archiveSourceCategoryFilter =
        'all';

    state.archiveSourceConnectionFilter =
        'all';

    state.archiveSourceFavouriteOnly =
        false;

    state.archiveSourceTargetFilter = {
        targetType,
        targetId,
        projectId
    };

    state.archiveSelectedSourceId =
        sourceIds[0]
        || null;

    state.archiveSelectedFileId =
        null;

    state.archiveSelectedFileIds =
        [];

    state.archiveInspectorCollapsed =
        false;

    render();
}

function archiveEventEvidencePeople(event, projectId)
{
    if (!event || event.projectId !== projectId || !Array.isArray(event.personIds))
    {
        return null;
    }

    const people = [...new Set(event.personIds)].map(personId => getPerson(personId));
    return people.every(person => person && person.projectId === projectId)
        ? people
        : null;
}

function sourceLinkMutationDomains(targetType)
{
    const targetDomain = { file: 'archive', photo: 'media', person: 'people',
        event: 'events', note: 'notes', place: 'places' }[targetType];
    return targetDomain ? ['sources', targetDomain] : ['sources'];
}

function setSourceIdsForTarget(
    targetType,
    targetId,
    nextSourceIds,
    {
        projectId =
            currentProjectId(),
        notify = true
    } = {}
)
{
    const target =
        sourceTargetRecord(
            targetType,
            targetId,
            projectId
        );

    if (!target)
    {
        return null;
    }

    const targetProjectId =
        target.projectId
        || projectId;

    const normalizedSourceIds =
        archiveUniqueIds(
            nextSourceIds
        );

    const eventPeople = targetType === 'event'
        ? archiveEventEvidencePeople(target, targetProjectId)
        : null;

    if (targetType === 'event' && !eventPeople)
    {
        return null;
    }

    const sources =
        normalizedSourceIds.map(
            sourceId =>
                archiveSourceById(
                    sourceId,
                    targetProjectId
                )
        );

    if (
        sources.some(source =>
            !source
        )
    )
    {
        return null;
    }

    const desiredIds =
        new Set(
            normalizedSourceIds
        );

    const currentLinks =
        sourceLinksForTarget(
            targetType,
            targetId,
            targetProjectId
        );
    const currentIds = new Set(currentLinks.map(link => link.sourceId));
    if (currentIds.size === desiredIds.size && [...desiredIds].every(id => currentIds.has(id)))
        return [...currentIds];

    const affectedSourceIds =
        new Set([
            ...currentLinks.map(link =>
                link.sourceId
            ),
            ...normalizedSourceIds
        ]);

    sampleData.sourceLinks =
        (
            sampleData.sourceLinks || []
        ).filter(link =>
        {
            const sameTarget =
                link.projectId
              === targetProjectId
            && link.targetType
              === targetType
            && link.targetId
              === targetId;

            return (
                !sameTarget
            || desiredIds.has(
                link.sourceId
            )
            );
        });

    const retainedIds =
        new Set(
            sourceIdsForTarget(
                targetType,
                targetId,
                targetProjectId
            )
        );

    const newlyLinkedSourceIds = normalizedSourceIds.filter(sourceId => !retainedIds.has(sourceId));

    normalizedSourceIds.forEach(
        sourceId =>
        {
            if (
                retainedIds.has(
                    sourceId
                )
            )
            {
                return;
            }

            sampleData.sourceLinks.push({
                id:
              createRuntimeId(
                  'source-link'
              ),

                projectId:
              targetProjectId,

                sourceId,
                targetType,
                targetId
            });
        }
    );

    if (eventPeople)
    {
        newlyLinkedSourceIds.forEach(sourceId => eventPeople.forEach(person =>
        {
            if (!sourceIdsForTarget('person', person.id, targetProjectId).includes(sourceId))
            {
                sampleData.sourceLinks.push({
                    id: createRuntimeId('source-link'),
                    projectId: targetProjectId,
                    sourceId,
                    targetType: 'person',
                    targetId: person.id
                });
            }
        }));
    }

    const now =
        new Date().toISOString();

    affectedSourceIds.forEach(
        sourceId =>
        {
            const source =
                archiveSourceById(
                    sourceId,
                    targetProjectId
                );

            if (source)
            {
                source.updatedAt =
                    now;
            }
        }
    );

    target.updatedAt =
        now;

    if (targetType === 'file')
    {
        target.updated =
            'Just now';
    }

    if (notify)
    {
        markPrototypeSessionEdited(targetProjectId, sourceLinkMutationDomains(targetType),
            { placeReferences: targetType === 'place' });
    }
    return sourceIdsForTarget(
        targetType,
        targetId,
        targetProjectId
    );
}

function setSourceLink(
    sourceId,
    targetType,
    targetId,
    shouldLink = true,
    {
        projectId =
            currentProjectId(),
        notify = true
    } = {}
)
{
    const currentIds =
        sourceIdsForTarget(
            targetType,
            targetId,
            projectId
        );

    const nextIds =
        shouldLink
            ? archiveUniqueIds([
                ...currentIds,
                sourceId
            ])
            : currentIds.filter(id =>
                id !== sourceId
            );

    const savedIds =
        setSourceIdsForTarget(
            targetType,
            targetId,
            nextIds,
            {
                projectId, notify
            }
        );

    if (!savedIds)
    {
        return false;
    }

    return shouldLink
        ? savedIds.includes(
            sourceId
        )
        : !savedIds.includes(
            sourceId
        );
}

function sourcesForTarget(
    targetType,
    targetId,
    projectId =
        currentProjectId()
)
{
    if (
        !sourceTargetRecord(
            targetType,
            targetId,
            projectId
        )
    )
    {
        return [];
    }

    return sourceIdsForTarget(
        targetType,
        targetId,
        projectId
    )
        .map(sourceId =>
            archiveSourceById(
                sourceId,
                projectId
            )
        )
        .filter(Boolean);
}

function connectedSourceMeta(
    source
)
{
    return [
        localizedSourceCategoryLabel(
            source?.category,
            ''
        ),

        source?.providedBy,

        source?.reference
    ]
        .filter(Boolean)
        .slice(0, 2)
        .join(' · ')
        || 'Source record';
}

function connectedSourceOrigin(
    source
)
{
    return localizedDataFieldValue(String(
        source?.providedBy
        || archiveSourceCustodialPlaceLabel(source)
        || ''
    ).trim())
      || t('Origin not specified');
}

function connectedSourceDetailMeta(
    source
)
{
    const category =
        localizedSourceCategoryLabel(
            source?.category,
            ''
        );

    const reference =
        localizedDataFieldValue(String(
            source?.reference
          || ''
        ).trim());

    const accessed =
        source?.accessedDate
            ? `${t('Accessed')} ${
                archiveFormatDate(
                    source.accessedDate
                )
            }`
            : '';

    return [
        category,

        /*
          Where-found information is more useful in
          a connected item than the accessed date.
          Use the date only as a fallback.
        */
        reference || accessed
    ]
        .filter(Boolean)
        .join(' · ')
        || 'Source record';
}

function openConnectedSource(
    sourceId,
    projectId =
        currentProjectId()
)
{
    const source =
        archiveSourceById(
            sourceId,
            projectId
        );

    if (!source)
    {
        showToast(
            'The source is no longer available.'
        );

        return;
    }

    if (
        state.activeModule === 'Archive'
        && typeof archiveRememberCurrentLocation
          === 'function'
    )
    {
        archiveRememberCurrentLocation();
    }

    state.activeModule =
        'Archive';

    state.archiveView =
        'sources';

    state.archiveSearch =
        '';

    state.archiveSourceCategoryFilter =
        'all';

    state.archiveSourceConnectionFilter =
        'all';

    state.archiveSourceFavouriteOnly =
        false;

    state.archiveSelectedSourceId =
        source.id;

    state.archiveInspectorCollapsed =
        false;

    state.archiveSelectedFileIds =
        [];

    render();
}
function renderConnectedSourceList({
    targetType,
    targetId,

    projectId =
        currentProjectId(),

    sources =
        sourcesForTarget(
            targetType,
            targetId,
            projectId
        ),

    emptyText =
        'No sources linked.',

    limit = 4,
    showAllWhenEmpty = false,

    readOnly =
        false
})
{
    const validSources =
        (
            Array.isArray(sources)
                ? sources
                : []
        ).filter(Boolean);

    const visibleSources =
        validSources.slice(0, limit);

    const footer = `
        <div class="panel-section-footer">
          <button
            class="panel-section-view-all"
            type="button"
            data-connected-source-view-all
            data-connected-source-target-type="${escapeHtml(targetType)}"
            data-connected-source-target-id="${escapeHtml(targetId)}"
            data-connected-source-project="${escapeHtml(projectId)}"
            aria-label="View all ${validSources.length} sources">

            <span>View all sources</span>

            <span
              class="panel-section-view-all-icon"
              aria-hidden="true">
              ${icon.chevron}
            </span>
          </button>
        </div>
      `;

    if (!visibleSources.length)
    {
        return renderInspectorSectionEmpty(emptyText)
            + (showAllWhenEmpty ? footer : '');
    }

    const sourceItems =
        visibleSources
            .map(source =>
            {
                const title =
                    localizedDataFieldValue(
                        source.title || 'Untitled source'
                    );

                const sourceProjectId =
                    source.projectId
              || projectId;

                const origin =
                    connectedSourceOrigin(
                        source
                    );

                const metadata =
                    connectedSourceDetailMeta(
                        source
                    );

                const mainContent = `
              <span
                class="connected-source-icon"
                aria-hidden="true">

                <span
                  class="connected-source-icon-record">
                  ${icon.archive}
                </span>

                <span
                  class="connected-source-icon-link">
                  ${icon.link}
                </span>
              </span>

              <span class="connected-source-copy">
                <strong
                  class="connected-source-title"
                  title="${escapeHtml(title)}">

                  ${escapeHtml(title)}
                </strong>

                <span
                  class="connected-source-origin"
                  title="${escapeHtml(origin)}">

                  ${escapeHtml(origin)}
                </span>

                <span
                  class="connected-source-meta"
                  title="${escapeHtml(metadata)}">

                  ${escapeHtml(metadata)}
                </span>
              </span>
            `;

                return `
              <div
                class="
                  relation-row
                  connected-source-item
                ">

                ${
                    readOnly
                        ? `
                      <div
                        class="
                          relation-row-main
                          connected-source-main
                        ">

                        ${mainContent}
                      </div>
                    `
                        : `
                      <button
                        class="
                          relation-row-main
                          connected-source-main
                        "
                        type="button"
                        data-connected-source-open="${escapeHtml(
                            source.id
                        )}"
                        data-connected-source-project="${escapeHtml(
                            sourceProjectId
                        )}"
                        aria-label="Open source ${escapeHtml(
                            title
                        )}">

                        ${mainContent}
                      </button>
                    `
                }

                ${
                    readOnly
                        ? ''
                        : `
                      <div class="relation-actions">
                        <button
                          class="
                            relation-action-button
                            danger
                          "
                          type="button"
                          data-connected-source-unlink="${escapeHtml(
                                source.id
                            )}"
                          data-connected-source-target-type="${escapeHtml(
                                targetType
                            )}"
                          data-connected-source-target-id="${escapeHtml(
                                targetId
                            )}"
                          data-connected-source-project="${escapeHtml(
                                sourceProjectId
                            )}"
                          aria-label="Unlink ${escapeHtml(
                                title
                            )}"
                          title="Unlink source">

                          ${icon.unlink}
                        </button>
                      </div>
                    `
                }
              </div>
            `;
            })
            .join('');

    return `
        <div
          class="relationship-list connected-source-list"
          data-connected-source-list>
          ${sourceItems}
        </div>

        ${footer}
      `;
}

function openConnectedSourceUnlinkConfirm({
    sourceId,
    targetType,
    targetId,
    projectId = currentProjectId(),
    onUnlinked = null
})
{
    const source =
        archiveSourceById(sourceId, projectId);

    const target =
        sourceTargetRecord(
            targetType,
            targetId,
            projectId
        );

    if (!source || !target)
    {
        showToast(
            t('The source or connected record is no longer available.')
        );
        return;
    }

    const sourceLabel =
        source.title || t('Untitled source');

    const targetLabel =
        connectedSourceTargetLabel(targetType, target);

    const question = t(
        'Remove the connection between “{source}” and “{record}”?'
    ).replace(
        /\{source\}|\{record\}/g,
        token =>
            token === '{source}'
                ? sourceLabel
                : targetLabel
    );

    openModal(`
        <div
          class="modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="connectedSourceUnlinkTitle"
          aria-describedby="connectedSourceUnlinkQuestion">

          <div class="modal-header">
            <div>
              <h2 id="connectedSourceUnlinkTitle">
                ${escapeHtml(t('Unlink source?'))}
              </h2>
            </div>

            <button
              class="close-button"
              type="button"
              data-close
              aria-label="${escapeHtml(t('Close'))}">
              ${icon.close}
            </button>
          </div>

          <div class="modal-body">
            <p id="connectedSourceUnlinkQuestion">
              ${escapeHtml(question)}
            </p>

            <div class="unlink-relationship-warning">
              <span>
                ${escapeHtml(t(
                    'Only this connection will be removed. Both records and their other connections will remain in the project.'
                ))}
              </span>
            </div>
          </div>

          <div class="modal-footer">
            <button
              class="button secondary"
              type="button"
              data-close>
              ${escapeHtml(t('Cancel'))}
            </button>

            <button
              class="button danger"
              type="button"
              data-connected-source-confirm-unlink>
              ${escapeHtml(t('Unlink'))}
            </button>
          </div>
        </div>
      `);

    const confirmButton =
        modalBackdrop.querySelector(
            '[data-connected-source-confirm-unlink]'
        );

    confirmButton?.addEventListener('click', () =>
    {
        // Recheck the records before committing the change.
        const currentSource =
            archiveSourceById(sourceId, projectId);

        const currentTarget =
            sourceTargetRecord(
                targetType,
                targetId,
                projectId
            );

        if (!currentSource || !currentTarget)
        {
            showToast(t(
                'The source or connected record is no longer available.'
            ));
            return;
        }

        confirmButton.disabled = true;

        const removed = setSourceLink(
            sourceId,
            targetType,
            targetId,
            false,
            { projectId }
        );

        if (!removed)
        {
            confirmButton.disabled = false;
            showToast(t(
                'The source link could not be removed.'
            ));
            return;
        }

        closeModal();

        if (typeof onUnlinked === 'function')
        {
            onUnlinked({
                sourceId,
                targetType,
                targetId,
                projectId
            });
        }

        showToast(t('Source unlinked.'));
    });
}

function bindConnectedSourceLinks(
    root,
    { onUnlinked = null } = {}
)
{
    if (!root)
    {
        return;
    }

    root.querySelectorAll(
        '[data-connected-source-view-all]'
    ).forEach(button =>
    {
        button.addEventListener('click', () =>
        {
            openArchiveSourcesForTarget({
                targetType:
              button.dataset.connectedSourceTargetType,
                targetId:
              button.dataset.connectedSourceTargetId,
                projectId:
              button.dataset.connectedSourceProject
              || currentProjectId()
            });
        });
    });

    root.querySelectorAll(
        '[data-connected-source-open]'
    ).forEach(button =>
    {
        button.addEventListener('click', () =>
        {
            openConnectedSource(
                button.dataset.connectedSourceOpen,
                button.dataset.connectedSourceProject
              || currentProjectId()
            );
        });
    });

    root.querySelectorAll(
        '[data-connected-source-unlink]'
    ).forEach(button =>
    {
        button.addEventListener('click', event =>
        {
            event.preventDefault();
            event.stopPropagation();

            openConnectedSourceUnlinkConfirm({
                sourceId:
              button.dataset.connectedSourceUnlink,
                targetType:
              button.dataset.connectedSourceTargetType,
                targetId:
              button.dataset.connectedSourceTargetId,
                projectId:
              button.dataset.connectedSourceProject
              || currentProjectId(),
                onUnlinked
            });
        });
    });
}


function removeSourceLinksForSource(
    sourceId
)
{
    sampleData.sourceLinks =
        (
            sampleData.sourceLinks || []
        ).filter(link =>
            link.sourceId !== sourceId
        );
}

function removeSourceLinksForTarget(
    targetType,
    targetId
)
{
    sampleData.sourceLinks =
        (
            sampleData.sourceLinks || []
        ).filter(link =>
            !(
                link.targetType
              === targetType
            && link.targetId
              === targetId
            )
        );
}

function removeSourceLinksForTargets(
    targetType,
    targetIds
)
{
    const ids =
        new Set(
            targetIds || []
        );

    sampleData.sourceLinks =
        (
            sampleData.sourceLinks || []
        ).filter(link =>
            !(
                link.targetType
              === targetType
            && ids.has(
                link.targetId
            )
            )
        );
}

function pruneInvalidSourceLinks(changes)
{
    const seen =
        new Set();
    const previous = sampleData.sourceLinks || [];

    const retained = previous.filter(link =>
        {
            if (
                !link
            || !link.id
            || !link.projectId
            || !link.sourceId
            || !link.targetId
            || !SOURCE_LINK_TARGET_TYPES
                .includes(
                    link.targetType
                )
            )
            {
                return false;
            }

            const source =
                archiveSourceById(
                    link.sourceId,
                    link.projectId
                );

            const target =
                sourceTargetRecord(
                    link.targetType,
                    link.targetId,
                    link.projectId
                );

            const key =
                [
                    link.projectId,
                    link.sourceId,
                    link.targetType,
                    link.targetId
                ].join('|');

            if (
                !source
            || !target
            || seen.has(key)
            )
            {
                return false;
            }

            seen.add(
                key
            );

            return true;
        });
    if (retained.length === previous.length) return;
    sampleData.sourceLinks = retained;
    if (!changes) return;
    // Filter preserves order and object identity, including repeated references
    // to the same link object. Account for each removed occurrence.
    let retainedIndex = 0;
    for (const link of previous)
    {
        if (retainedIndex < retained.length && link === retained[retainedIndex]) retainedIndex++;
        else recordProjectMutation(changes, link?.projectId, 'sources');
    }
}

