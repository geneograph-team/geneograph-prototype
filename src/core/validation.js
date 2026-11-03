function validateSampleData()
{
    const warn = message => console.warn('[sampleData]', message);
    const personIds = new Set(sampleData.people.map(person => person.id));
    const projectIds = new Set(sampleData.projects.map(project => project.id));
    if (projectIds.size !== sampleData.projects.length)
    {
        warn('Projects contain duplicate IDs');
    }

    const projectOwnedCollections = [
        'people',
        'families',
        'relationships',
        'relationshipSeed',
        'educationSeed',
        'places',
        'placeSavedFilters',
        'placeIssues',
        'events',
        'media',
        'albums',
        'archiveFolders',
        'archiveFiles',
        'sources',
        'sourceLinks',
        'archiveImports',
        'archiveIssues',
        'noteCollections',
        'notes',
        'boardCollections',
        'boards',
        'links',
        'publishDrafts',
        'activity',
        'notifications'
    ];

    projectOwnedCollections.forEach(collectionName =>
    {
        const records = Array.isArray(sampleData[collectionName])
            ? sampleData[collectionName]
            : [];
        const ids = records.map(record => record?.id).filter(Boolean);
        if (new Set(ids).size !== ids.length)
        {
            warn(`${collectionName} contains duplicate IDs`);
        }
        records.forEach(record =>
        {
            if (!record?.projectId || !projectIds.has(record.projectId))
            {
                warn(`${collectionName} record ${record?.id || '(missing ID)'} points to missing project ${record?.projectId || '(none)'}`);
            }
        });
    });

    const archiveFolderMap = new Map(
        (sampleData.archiveFolders || []).map(folder => [folder.id, folder])
    );
    (sampleData.archiveFolders || []).forEach(folder =>
    {
        const parentId = folder.parentId === 'null' ? null : folder.parentId;
        if (!parentId) return;
        const parent = archiveFolderMap.get(parentId);
        if (!parent)
        {
            warn(`Archive folder ${folder.id} points to missing parent ${parentId}`);
        }
        else if (parent.projectId !== folder.projectId)
        {
            warn(`Archive folder ${folder.id} has a cross-project parent ${parentId}`);
        }
    });
    const placeIds = new Set(sampleData.places.map(place => place.id));
    const familyIds = new Set(centralFamilyRecords().map(family => family.id));
    const mediaIds = new Set((sampleData.media || []).map(media => media.id));
    const albumIds = new Set((sampleData.albums || []).map(album => album.id));
    const archiveFileIds =
        new Set(
            (
                sampleData.archiveFiles || []
            ).map(file =>
                file.id
            )
        );
    const mediaById =
        new Map(
            (
                sampleData.media || []
            ).map(photo => [
                photo.id,
                photo
            ])
        );

    const eventIds =
        new Set(
            (
                sampleData.events || []
            ).map(event =>
                event.id
            )
        );

    const noteCollectionIds =
        new Set(
            (
                sampleData.noteCollections || []
            ).map(collection =>
                collection.id
            )
        );

    const noteIds =
        new Set(
            (
                sampleData.notes || []
            ).map(note =>
                note.id
            )
        );

    const noteCollectionById =
        new Map(
            (
                sampleData.noteCollections || []
            ).map(collection => [
                collection.id,
                collection
            ])
        );

    const personById =
        new Map(
            (
                sampleData.people || []
            ).map(person => [
                person.id,
                person
            ])
        );

    const placeById =
        new Map(
            (
                sampleData.places || []
            ).map(place => [
                place.id,
                place
            ])
        );

    const eventById =
        new Map(
            (
                sampleData.events || []
            ).map(event => [
                event.id,
                event
            ])
        );

    const sourceById =
        new Map(
            (
                sampleData.sources || []
            ).map(source => [
                source.id,
                source
            ])
        );

    const archiveFileById =
        new Map(
            (
                sampleData.archiveFiles || []
            ).map(file => [
                file.id,
                file
            ])
        );

    const noteById =
        new Map(
            (
                sampleData.notes || []
            ).map(note => [
                note.id,
                note
            ])
        );
    const seen = collectionName =>
    {
        const ids = new Set();
        (sampleData[collectionName] || []).forEach(item =>
        {
            if (!item?.id) warn(`${collectionName} item is missing an ID`);
            if (item?.id && ids.has(item.id)) warn(`Duplicate ${collectionName} ID: ${item.id}`);
            if (item?.id) ids.add(item.id);
        });
    };

    validateSampleNotesFixture(warn);

    validateSampleGeneographCollections(
        warn,
        projectIds
    );

    sampleData.noteCollections.forEach(
        collection =>
        {
            if (
                !projectIds.has(
                    collection.projectId
                )
            )
            {
                warn(
                    `Note collection ${
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
                    `Note collection ${
                        collection.id
                    } has no name`
                );
            }

            if (
                typeof collection.description
              !== 'string'
            )
            {
                warn(
                    `Note collection ${
                        collection.id
                    } has an invalid description`
                );
            }
        }
    );

    const canonicalNoteArrayFields = [
        'collectionIds',
        'checklist',
        'linkedPersonIds',
        'linkedPlaceIds',
        'linkedEventIds',
        'linkedPhotoIds',
        'linkedArchiveFileIds',
        'relatedNoteIds'
    ];

    const forbiddenNoteFields = [
        'type',
        'status',
        'collectionId',
        'caseId',
        'confidence',
        'question',
        'conclusion',
        'evidence',
        'tasks',
        'deleted',
        'linkedPeople',
        'linkedPlaces',
        'linkedSources',
        'linkedSourceIds',
        'created',
        'updated',
        'sortRank',
        'excerpt',
        'pinned',
        'personIds',
        'relatedNotes',
        'tags'
    ];

    const validateNoteReferences = (
        note,
        field,
        records,
        label
    ) =>
    {
        (
            note[field] || []
        ).forEach(id =>
        {
            const record =
                records.get(id);

            if (!record)
            {
                warn(
                    `Note ${
                        note.id
                    } ${field} points to missing ${
                        label
                    } ${id}`
                );

                return;
            }

            if (
                record.projectId
            && record.projectId
              !== note.projectId
            )
            {
                warn(
                    `Note ${
                        note.id
                    } and ${
                        label
                    } ${id} are in different projects`
                );
            }
        });
    };

    sampleData.notes.forEach(note =>
    {
        if (
            !projectIds.has(
                note.projectId
            )
        )
        {
            warn(
                `Note ${
                    note.id
                } points to missing project ${
                    note.projectId
                }`
            );
        }

        if (
            !String(
                note.title || ''
            ).trim()
        )
        {
            warn(
                `Note ${
                    note.id
                } has no title`
            );
        }

        if (
            typeof note.body
            !== 'string'
        )
        {
            warn(
                `Note ${
                    note.id
                } has an invalid body`
            );
        }

        const normalizedBodyDelta =
            note.bodyDelta
                ? normalizeRichTextDelta(
                    note.bodyDelta
                )
                : null;

        if (
            note.bodyDelta
          && !normalizedBodyDelta
        )
        {
            warn(
                `Note ${
                    note.id
                } has an invalid bodyDelta`
            );
        }

        if (
            note.bodyFormat
          && note.bodyFormat
            !== 'quill-delta-v1'
        )
        {
            warn(
                `Note ${
                    note.id
                } has an unsupported bodyFormat ${
                    note.bodyFormat
                }`
            );
        }

        if (
            note.bodyFormat
            === 'quill-delta-v1'
          && !normalizedBodyDelta
        )
        {
            warn(
                `Note ${
                    note.id
                } declares Quill content without a valid Delta`
            );
        }

        if (
            normalizedBodyDelta
          && note.bodyFormat
            !== 'quill-delta-v1'
        )
        {
            warn(
                `Note ${
                    note.id
                } has Delta content without the Quill format marker`
            );
        }

        if (
            typeof note.favorite
            !== 'boolean'
        )
        {
            warn(
                `Note ${
                    note.id
                } favorite must be boolean`
            );
        }

        if (
            typeof note.archived
            !== 'boolean'
        )
        {
            warn(
                `Note ${
                    note.id
                } archived must be boolean`
            );
        }

        canonicalNoteArrayFields.forEach(
            field =>
            {
                if (
                    !Array.isArray(
                        note[field]
                    )
                )
                {
                    warn(
                        `Note ${
                            note.id
                        } ${field} must be an array`
                    );

                    return;
                }

                if (
                    field !== 'checklist'
              && new Set(
                  note[field]
              ).size
                !== note[field].length
                )
                {
                    warn(
                        `Note ${
                            note.id
                        } has duplicate values in ${field}`
                    );
                }
            }
        );

        (
            note.collectionIds || []
        ).forEach(collectionId =>
        {
            const collection =
                noteCollectionById.get(
                    collectionId
                );

            if (
                !noteCollectionIds.has(
                    collectionId
                )
            || !collection
            )
            {
                warn(
                    `Note ${
                        note.id
                    } points to missing collection ${
                        collectionId
                    }`
                );

                return;
            }

            if (
                collection.projectId
              !== note.projectId
            )
            {
                warn(
                    `Note ${
                        note.id
                    } and collection ${
                        collectionId
                    } are in different projects`
                );
            }
        });

        const checklistIds =
            new Set();

        (
            note.checklist || []
        ).forEach(item =>
        {
            if (
                !item
            || typeof item
              !== 'object'
            )
            {
                warn(
                    `Note ${
                        note.id
                    } has an invalid checklist item`
                );

                return;
            }

            if (
                !String(
                    item.id || ''
                ).trim()
            )
            {
                warn(
                    `Note ${
                        note.id
                    } has a checklist item without an ID`
                );
            }
            else if (
                checklistIds.has(
                    item.id
                )
            )
            {
                warn(
                    `Note ${
                        note.id
                    } has duplicate checklist ID ${
                        item.id
                    }`
                );
            }
            else
            {
                checklistIds.add(
                    item.id
                );
            }

            if (
                !String(
                    item.text || ''
                ).trim()
            )
            {
                warn(
                    `Note ${
                        note.id
                    } has an empty checklist item`
                );
            }

            if (
                typeof item.done
              !== 'boolean'
            )
            {
                warn(
                    `Note ${
                        note.id
                    } checklist item ${
                        item.id
                    } has invalid done state`
                );
            }
        });

        validateNoteReferences(
            note,
            'linkedPersonIds',
            personById,
            'person'
        );

        validateNoteReferences(
            note,
            'linkedPlaceIds',
            placeById,
            'place'
        );

        validateNoteReferences(
            note,
            'linkedEventIds',
            eventById,
            'event'
        );

        validateNoteReferences(
            note,
            'linkedPhotoIds',
            mediaById,
            'photo'
        );

        validateNoteReferences(
            note,
            'linkedArchiveFileIds',
            archiveFileById,
            'archive file'
        );

        (
            note.linkedPersonIds || []
        ).forEach(personId =>
        {
            if (
                !personIds.has(
                    personId
                )
            )
            {
                warn(
                    `Note ${
                        note.id
                    } points to missing person ${
                        personId
                    }`
                );
            }
        });

        (
            note.linkedPlaceIds || []
        ).forEach(placeId =>
        {
            if (
                !placeIds.has(
                    placeId
                )
            )
            {
                warn(
                    `Note ${
                        note.id
                    } points to missing place ${
                        placeId
                    }`
                );
            }
        });

        (
            note.linkedEventIds || []
        ).forEach(eventId =>
        {
            if (
                !eventIds.has(
                    eventId
                )
            )
            {
                warn(
                    `Note ${
                        note.id
                    } points to missing event ${
                        eventId
                    }`
                );
            }
        });
        (
            note.linkedArchiveFileIds || []
        ).forEach(fileId =>
        {
            if (
                !archiveFileIds.has(
                    fileId
                )
            )
            {
                warn(
                    `Note ${
                        note.id
                    } points to missing archive file ${
                        fileId
                    }`
                );
            }
        });

        (
            note.relatedNoteIds || []
        ).forEach(relatedNoteId =>
        {
            if (
                relatedNoteId
              === note.id
            )
            {
                warn(
                    `Note ${
                        note.id
                    } relates to itself`
                );

                return;
            }

            const relatedNote =
                noteById.get(
                    relatedNoteId
                );

            if (
                !noteIds.has(
                    relatedNoteId
                )
            || !relatedNote
            )
            {
                warn(
                    `Note ${
                        note.id
                    } points to missing related note ${
                        relatedNoteId
                    }`
                );

                return;
            }

            if (
                relatedNote.projectId
              !== note.projectId
            )
            {
                warn(
                    `Note ${
                        note.id
                    } and related note ${
                        relatedNoteId
                    } are in different projects`
                );
            }

            if (
                !(
                    relatedNote.relatedNoteIds
              || []
                ).includes(note.id)
            )
            {
                warn(
                    `Note ${
                        note.id
                    } and related note ${
                        relatedNoteId
                    } are not reciprocal`
                );
            }
        });

        [
            'createdAt',
            'updatedAt'
        ].forEach(field =>
        {
            if (
                !Number.isFinite(
                    Date.parse(
                        note[field] || ''
                    )
                )
            )
            {
                warn(
                    `Note ${
                        note.id
                    } has an invalid ${field} timestamp`
                );
            }
        });

        forbiddenNoteFields.forEach(
            field =>
            {
                if (
                    Object.prototype
                        .hasOwnProperty
                        .call(
                            note,
                            field
                        )
                )
                {
                    warn(
                        `Note ${
                            note.id
                        } still contains legacy field ${field}`
                    );
                }
            }
        );
    });

    [
        'projects',
        'people',
        'families',
        'places',
        'placeSavedFilters',
        'placeIssues',
        'sources',
        'sourceLinks',
        'archiveFiles',
        'media',
        'albums',
        'notes',
        'noteCollections',
        'boards',
        'boardObjects',
        'boardConnectors',
        'publishDrafts',
        'notifications',
        'activity'
    ].forEach(seen);

    const forbiddenSourceFields = [
        'type',
        'repositoryOwner',
        'holder',
        'description',
        'updated',
        'linkedPersonIds',
        'linkedEventIds',
        'linkedNoteIds',
        'linkedPlaceIds',
        'placeIds'
    ];

    (
        sampleData.sources || []
    ).forEach(source =>
    {
        if (
            !String(
                source.title || ''
            ).trim()
        )
        {
            warn(
                `Source ${source.id} has no title`
            );
        }

        if (
            source.category
          && !SOURCE_CATEGORY_BY_VALUE.has(
              source.category
          )
        )
        {
            warn(
                `Source ${
                    source.id
                } has invalid category ${
                    source.category
                }`
            );
        }

        forbiddenSourceFields.forEach(
            field =>
            {
                if (
                    Object.prototype
                        .hasOwnProperty
                        .call(
                            source,
                            field
                        )
                )
                {
                    warn(
                        `Source ${
                            source.id
                        } contains obsolete field ${
                            field
                        }`
                    );
                }
            }
        );
    });

    const sourceLinkKeys =
        new Set();

    (
        sampleData.sourceLinks || []
    ).forEach(link =>
    {
        const source =
            sourceById.get(
                link.sourceId
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

        if (!source)
        {
            warn(
                `Source link ${link.id} points to missing source ${link.sourceId}`
            );
        }

        if (
            !SOURCE_LINK_TARGET_TYPES.includes(
                link.targetType
            )
        )
        {
            warn(
                `Source link ${link.id} has invalid target type ${link.targetType}`
            );
        }

        if (!target)
        {
            warn(
                `Source link ${link.id} points to missing ${link.targetType} ${link.targetId}`
            );
        }

        if (
            source
          && source.projectId
            !== link.projectId
        )
        {
            warn(
                `Source link ${link.id} and source ${source.id} are in different projects`
            );
        }

        if (
            target?.projectId
          && target.projectId
            !== link.projectId
        )
        {
            warn(
                `Source link ${link.id} and target ${link.targetId} are in different projects`
            );
        }

        if (
            sourceLinkKeys.has(
                key
            )
        )
        {
            warn(
                `Duplicate Source connection: ${key}`
            );
        }

        sourceLinkKeys.add(
            key
        );
    });

    (
        sampleData.archiveFiles || []
    ).forEach(file =>
    {
        if (
            Object.prototype
                .hasOwnProperty
                .call(
                    file,
                    'linkedSourceIds'
                )
        )
        {
            warn(
                `Archive file ${file.id} still contains legacy field linkedSourceIds`
            );
        }
    });

    const archiveFileLinkDefinitions = [
        {
            field: 'linkedPersonIds',
            label: 'person',
            records: personById
        },
        {
            field: 'linkedEventIds',
            label: 'event',
            records: eventById
        },
        {
            field: 'linkedNoteIds',
            label: 'note',
            records: noteById
        },
        {
            field: 'linkedPlaceIds',
            label: 'place',
            records: placeById
        },
        {
            field: 'placeIds',
            label: 'place',
            records: placeById
        }
    ];

    (sampleData.archiveFiles || []).forEach(file =>
    {
        if (!projectIds.has(file.projectId))
        {
            warn(
                `Archive file ${file.id} points to missing project ${file.projectId}`
            );
        }

        archiveFileLinkDefinitions.forEach(definition =>
        {
            const values =
                Array.isArray(file[definition.field])
                    ? file[definition.field]
                    : [];

            if (
                file[definition.field] != null
            && !Array.isArray(file[definition.field])
            )
            {
                warn(
                    `Archive file ${file.id} ${definition.field} must be an array`
                );
            }

            if (new Set(values).size !== values.length)
            {
                warn(
                    `Archive file ${file.id} has duplicate IDs in ${definition.field}`
                );
            }

            values.forEach(recordId =>
            {
                const record =
                    definition.records.get(recordId);

                if (!record)
                {
                    warn(
                        `Archive file ${file.id} points to missing ${definition.label} ${recordId}`
                    );
                }
                else if (
                    record.projectId
              && file.projectId
              && record.projectId !== file.projectId
                )
                {
                    warn(
                        `Archive file ${file.id} and ${definition.label} ${recordId} are in different projects`
                    );
                }
            });
        });

        const linkedPlaceIds =
            archiveUniqueIds(
                file.linkedPlaceIds
            );

        const compatibilityPlaceIds =
            archiveUniqueIds(
                file.placeIds
            );

        const documentPlaceId =
            String(
                file.documentPlaceId || ''
            ).trim();

        if (
            linkedPlaceIds.length > 1
          || compatibilityPlaceIds.length > 1
        )
        {
            warn(
                `Archive file ${file.id} has more than one linked place`
            );
        }

        if (documentPlaceId)
        {
            const place =
                placeById.get(
                    documentPlaceId
                );

            if (!place)
            {
                warn(
                    `Archive file ${file.id} points to missing place ${documentPlaceId}`
                );
            }
            else if (
                place.projectId
            && file.projectId
            && place.projectId !== file.projectId
            )
            {
                warn(
                    `Archive file ${file.id} and place ${documentPlaceId} are in different projects`
                );
            }
        }

        const documentPlaceIds =
            documentPlaceId
                ? [documentPlaceId]
                : [];

        const samePlaceIds =
            (first, second) =>
                first.length === second.length
            && first.every(
                (placeId, index) =>
                    placeId === second[index]
            );

        if (
            !samePlaceIds(
                documentPlaceIds,
                linkedPlaceIds
            )
          || !samePlaceIds(
              documentPlaceIds,
              compatibilityPlaceIds
          )
        )
        {
            warn(
                `Archive file ${file.id} has inconsistent documentPlaceId, linkedPlaceIds, and placeIds`
            );
        }
    });

    (sampleData.places || []).forEach(place =>
    {
        if (!projectIds.has(place.projectId)) warn(`Place ${place.id} points to missing project ${place.projectId}`);
        if (!String(place.name || '').trim()) warn(`Place ${place.id} has no name`);
        if (!Array.isArray(place.alternativeNames)) warn(`Place ${place.id} alternativeNames must be an array`);
        if (new Set((place.alternativeNames || []).map(name => normalizePlaceLookupText(name))).size !== (place.alternativeNames || []).length) warn(`Place ${place.id} has duplicate alternative names`);
        if (place.coordinates && (!validLatitude(place.coordinates.lat) || !validLongitude(place.coordinates.lng))) warn(`Place ${place.id} has invalid coordinates`);
        if (!Number.isFinite(Date.parse(place.updatedAt || ''))) warn(`Place ${place.id} has an invalid updatedAt timestamp`);
    });

    (
        sampleData.placeSavedFilters || []
    )
        .forEach(savedFilter =>
        {
            if (
                !projectIds.has(
                    savedFilter.projectId
                )
            )
            {
                warn(
                    `Place saved filter ${savedFilter.id} points to missing project ${savedFilter.projectId}`
                );
            }

            if (
                !String(
                    savedFilter.name || ''
                ).trim()
            )
            {
                warn(
                    `Place saved filter ${savedFilter.id} has no name`
                );
            }

            if (
                !savedFilter.filters
            || typeof savedFilter.filters
              !== 'object'
            )
            {
                warn(
                    `Place saved filter ${savedFilter.id} has invalid filters`
                );
            }
        });

    (sampleData.placeIssues || []).forEach(issue =>
    {
        const place = getPlace(issue.placeId);
        if (!projectIds.has(issue.projectId)) warn(`Place issue ${issue.id} points to missing project ${issue.projectId}`);
        if (!place) warn(`Place issue ${issue.id} points to missing place ${issue.placeId}`);
        else if (place.projectId !== issue.projectId) warn(`Place issue ${issue.id} and place ${issue.placeId} are in different projects`);
        if (issue.status !== 'dismissed') warn(`Place issue ${issue.id} must be a dismissal record`);
        if (!PLACE_REVIEW_COORDINATE_ISSUE_TYPES.includes(issue.type)) warn(`Place issue ${issue.id} has invalid type ${issue.type}`);
        if (!Number.isFinite(Date.parse(issue.dismissedAt || ''))) warn(`Place issue ${issue.id} has an invalid dismissedAt timestamp`);
    });

    if (sampleData.media.length !== 14) warn(`Expected exactly 14 seeded media records; found ${sampleData.media.length}`);

    (sampleData.albums || []).forEach(album =>
    {
        if (!projectIds.has(album.projectId)) warn(`Album ${album.id} points to missing project ${album.projectId}`);
        if (!String(album.name || '').trim()) warn(`Album ${album.id} has no name`);
        if (!Number.isFinite(Date.parse(album.createdAt || ''))) warn(`Album ${album.id} has an invalid createdAt timestamp`);
    });

    (sampleData.media || []).forEach(photo =>
    {
        if (photo.kind !== 'photo') warn(`Media ${photo.id} has unsupported kind ${photo.kind}`);
        if (!projectIds.has(photo.projectId)) warn(`Media ${photo.id} points to missing project ${photo.projectId}`);
        if (!Array.isArray(photo.personIds)) warn(`Media ${photo.id} personIds must be an array`);
        if (!Array.isArray(photo.albumIds)) warn(`Media ${photo.id} albumIds must be an array`);
        if (new Set(photo.personIds || []).size !== (photo.personIds || []).length) warn(`Media ${photo.id} has duplicate person IDs`);
        if (new Set(photo.albumIds || []).size !== (photo.albumIds || []).length) warn(`Media ${photo.id} has duplicate album IDs`);
        (photo.personIds || []).forEach(personId =>
        {
            const person = getPerson(personId);
            if (!person) warn(`Media ${photo.id} points to missing person ${personId}`);
            else if (person.projectId !== photo.projectId) warn(`Media ${photo.id} and person ${personId} are in different projects`);
        });
        if (photo.personRegions != null)
        {
            if (!photo.personRegions || typeof photo.personRegions !== 'object' || Array.isArray(photo.personRegions)) warn(`Media ${photo.id} has invalid face regions`);
            else Object.entries(photo.personRegions).forEach(([personId, region]) =>
            {
                if (!(photo.personIds || []).includes(personId)) warn(`Media ${photo.id} has face area for untagged person ${personId}`);
                if (!region || !['x', 'y', 'width', 'height'].every(key => Number.isFinite(region[key]))
                    || region.x < 0 || region.y < 0 || region.width < FACE_REGION_MIN || region.height < FACE_REGION_MIN
                    || region.x + region.width > 1.000001 || region.y + region.height > 1.000001)
                    warn(`Media ${photo.id} has invalid face area for ${personId}`);
            });
        }
        (photo.albumIds || []).forEach(albumId =>
        {
            const album = sampleData.albums.find(item => item.id === albumId);
            if (!albumIds.has(albumId)) warn(`Media ${photo.id} points to missing album ${albumId}`);
            else if (album.projectId !== photo.projectId) warn(`Media ${photo.id} and album ${albumId} are in different projects`);
        });
        if (!photo.date || typeof photo.date !== 'object' || Array.isArray(photo.date)) warn(`Media ${photo.id} has an invalid structured date`);
        else
        {
            const normalizedType = normalizeGenealogyDateType(photo.date.dateType || 'Exact date');
            if (normalizedType !== photo.date.dateType) warn(`Media ${photo.id} has invalid date type ${photo.date.dateType}`);
            if (normalizedType === 'Between' && (!photo.date.fromDate || !photo.date.toDate)) warn(`Media ${photo.id} has an incomplete Between date`);
        }
        if (photo.placeId && !placeIds.has(photo.placeId)) warn(`Media ${photo.id} points to missing place ${photo.placeId}`);
        if (!Number.isFinite(photo.width) || photo.width <= 0) warn(`Media ${photo.id} has invalid width`);
        if (!Number.isFinite(photo.height) || photo.height <= 0) warn(`Media ${photo.id} has invalid height`);
        if (!Number.isFinite(photo.sizeBytes) || photo.sizeBytes < 0) warn(`Media ${photo.id} has invalid sizeBytes`);
        ['createdAt', 'updatedAt'].forEach(field =>
        {
            if (!Number.isFinite(Date.parse(photo[field] || ''))) warn(`Media ${photo.id} has invalid ${field}`);
        });
    });

    sampleData.people.forEach(person =>
    {
        if (!projectIds.has(person.projectId)) warn(`Person ${person.id} points to missing project ${person.projectId}`);
        [person.birth?.placeId, person.death?.placeId, person.death?.burialPlaceId].filter(Boolean).forEach(placeId =>
        {
            if (!placeIds.has(placeId)) warn(`Missing place ID ${placeId} on person ${person.id}`);
        });
        (person.familyAsSpouseIds || []).forEach(familyId =>
        {
            if (!familyIds.has(familyId)) warn(`Person ${person.id} points to missing spouse family ${familyId}`);
        });
        (person.familyAsChildIds || []).forEach(familyId =>
        {
            if (!familyIds.has(familyId)) warn(`Person ${person.id} points to missing child family ${familyId}`);
        });
        (person.attributes || []).forEach(attribute =>
        {
            if (attribute.placeId && !placeIds.has(attribute.placeId)) warn(`Attribute ${attribute.id} points to missing place ${attribute.placeId}`);
            (attribute.mediaIds || []).forEach(mediaId =>
            {
                if (!mediaIds.has(mediaId)) warn(`Attribute ${attribute.id} points to missing media ${mediaId}`);
            });
        });
        (person.events || []).forEach(event =>
        {
            if (event.placeId && !placeIds.has(event.placeId)) warn(`Event ${event.id} points to missing place ${event.placeId}`);
            (event.mediaIds || []).forEach(mediaId =>
            {
                if (!mediaIds.has(mediaId)) warn(`Event ${event.id} points to missing media ${mediaId}`);
            });
        });
        if (
            person.primaryPhotoId
        )
        {
            const primaryPhoto =
                getPhoto(
                    person.primaryPhotoId
                );

            if (!primaryPhoto)
            {
                warn(
                    `Person ${
                        person.id
                    } points to missing primary photo ${
                        person.primaryPhotoId
                    }`
                );
            }
            else if (
                primaryPhoto.projectId
              !== person.projectId
            )
            {
                warn(
                    `Person ${
                        person.id
                    } primary photo is in another project`
                );
            }
            else if (
                !(
                    primaryPhoto.personIds || []
                ).includes(
                    person.id
                )
            )
            {
                warn(
                    `Person ${
                        person.id
                    } is not tagged in primary photo ${
                        primaryPhoto.id
                    }`
                );
            }
        }
        if (person.primaryPhotoCrop != null)
        {
            const crop = person.primaryPhotoCrop;
            if (!Number.isFinite(crop.centerX) || crop.centerX < 0 || crop.centerX > 1) warn(`Person ${person.id} has invalid primary photo centerX`);
            if (!Number.isFinite(crop.centerY) || crop.centerY < 0 || crop.centerY > 1) warn(`Person ${person.id} has invalid primary photo centerY`);
            if (!Number.isFinite(crop.zoom) || crop.zoom < PERSON_PHOTO_ZOOM_MIN || crop.zoom > PERSON_PHOTO_ZOOM_MAX) warn(`Person ${person.id} has invalid primary photo zoom`);
            if (!PERSON_PHOTO_ROTATIONS.includes(crop.rotation)) warn(`Person ${person.id} has invalid primary photo rotation`);
        }
    });

    centralFamilyRecords().forEach(family =>
    {
        [familyPartnerAId(family), familyPartnerBId(family)].filter(Boolean).forEach(personId =>
        {
            if (!personIds.has(personId)) warn(`Family ${family.id} points to missing partner ${personId}`);
        });
        (family.childIds || []).forEach(personId =>
        {
            if (!personIds.has(personId)) warn(`Family ${family.id} points to missing child ${personId}`);
        });
        (family.events || []).forEach(event =>
        {
            if (event.placeId && !placeIds.has(event.placeId)) warn(`Family event ${event.id} points to missing place ${event.placeId}`);
        });
    });

    (sampleData.events || []).forEach(event =>
    {
        (event.personIds || []).forEach(personId =>
        {
            if (!personIds.has(personId)) warn(`Derived event ${event.id} points to missing person ${personId}`);
        });
        if (event.placeId && !placeIds.has(event.placeId)) warn(`Derived event ${event.id} points to missing place ${event.placeId}`);
    });

    (sampleData.links || []).forEach(link =>
    {
        if (!link.id) warn('Link is missing an ID');
    });
}

const defaultPlaceFilters = Object.freeze({
    personId: '',
    surname: '',
    yearFrom: '',
    yearTo: '',
    eventType: '',
    country: '',
    mapped: 'all'
});

