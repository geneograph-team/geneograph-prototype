function openNotesLinkEntityModal(
    type
)
{
    if (
        type === 'archiveFile'
    )
    {
        openNoteFilesModal();
        return;
    }

    if (
        type === 'photo'
    )
    {
        openNotesPhotosModal();
        return;
    }

    if (
        type === 'person'
    )
    {
        openNotesPeopleModal();
        return;
    }

    if (
        type === 'event'
    )
    {
        openNotesEventsModal();
        return;
    }

    if (
        type === 'place'
    )
    {
        openNotesPlacesModal();
        return;
    }

    if (
        type === 'source'
    )
    {
        const note =
            selectedNote();

        if (!note)
        {
            return;
        }

        openSourcesForTargetModal({
            targetType:
            'note',

            targetId:
            note.id,

            projectId:
            note.projectId,

            title:
            'Add sources',

            subtitle:
            `Connect existing sources to ${
                note.title
              || 'this note'
            }.`,

            afterSave:
            renderNotesPreservingInteraction
        });
    }
}

/*
      Shared note picker

      Used by:
      - Notes → Add related note
      - Albums inspector → Add note
      - Family Tree inspector → Add note later

      The picker only stages and adds new links.
      Existing links are displayed as disabled rows
      when they appear in search results.

      Removing an existing link remains a contextual
      action in the sidebar/editor where that link is shown.
    */

function notePickerSharedIds(
    firstValues = [],
    secondValues = []
)
{
    const secondIds =
        new Set(
            secondValues || []
        );

    return [
        ...new Set(
            firstValues || []
        )
    ].filter(id =>
        secondIds.has(id)
    );
}

function relatedNotePickerSuggestionScore(
    sourceNote,
    candidate
)
{
    if (
        !sourceNote
        || !candidate
    )
    {
        return 0;
    }

    let score = 0;

    const entityWeights = {
        person: 9,
        event: 8,
        source: 7,
        archiveFile: 7,
        place: 5,
        photo: 4
    };

    Object.entries(
        entityWeights
    ).forEach(([
        type,
        weight
    ]) =>
    {
        const config =
            getNoteEntityConfig(
                type
            );

        if (!config)
        {
            return;
        }

        score +=
            notePickerSharedIds(
                noteEntityLinkedIds(
                    sourceNote,
                    type
                ),
                noteEntityLinkedIds(
                    candidate,
                    type
                )
            ).length
          * weight;
    });

    score +=
        notePickerSharedIds(
            sourceNote.collectionIds,
            candidate.collectionIds
        ).length
        * 2;

    score +=
        notePickerSharedIds(
            sourceNote.tags,
            candidate.tags
        ).length
        * 2;

    return score;
}


function openNotesRelatedModal()
{
    const note =
        selectedNote();

    if (!note)
    {
        return;
    }

    const existingNoteIds =
        (
            note.relatedNoteIds
          || []
        ).filter(noteId =>
            Boolean(
                getNote(
                    noteId,
                    {
                        projectId:
                  note.projectId,

                        includeArchived:
                  true
                    }
                )
            )
        );

    openNoteLinkPickerModal({
        projectId:
          note.projectId,

        title:
          'Add related notes',

        description:
          state.language === 'ru'
              ? `Добавьте связанные заметки к «${
                  localizedDataFieldValue(note.title)
                || 'Заметка без названия'
              }».`
              : `Link notes to “${
                  note.title || 'Untitled note'
              }”.`,

        helperText:
          'The relationship will appear in both notes.',

        existingNoteIds,

        /*
          Prevent the current Note from
          relating to itself.
        */
        excludeNoteIds: [
            note.id
        ],

        includeArchived:
          true,

        existingStatus:
          'Already related',

        existingMetaLabel:
          'already related',

        getSuggestionScore:
          candidate =>
              relatedNotePickerSuggestionScore(
                  note,
                  candidate
              ),

        onSave:
          (selectedNoteIds, context) =>
          {
              if (context?.changes)
              {
                  const current = getNote(note.id, { projectId: note.projectId, includeArchived: true });
                  if (!current) return false;
                  updateRelatedNoteLinks(current.id, rpApplyConnectionChanges(current.relatedNoteIds || [], context));
                  return true;
              }
              const currentNote =
                  getNote(
                      note.id,
                      {
                          projectId:
                    note.projectId,

                          includeArchived:
                    true
                      }
                  );

              if (!currentNote)
              {
                  return false;
              }

              updateRelatedNoteLinks(
                  currentNote.id,
                  normalizeCentralNoteIdArray([
                      ...(
                          currentNote
                              .relatedNoteIds
                  || []
                      ),

                      ...selectedNoteIds
                  ])
              );

              return true;
          },

        afterSave:
          renderNotesPreservingInteraction,
    });
}

