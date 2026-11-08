// "Save" in the prototype writes to memory, not durable project storage.
// Track committed edits for the remainder of the browser session. Do not treat
// navigation, filtering, selection or project viewing as edits.
let prototypeSessionHasEdits = false;
let prototypeSessionUnloadListening = false;

function markPrototypeSessionEdited()
{
    if (prototypeSessionHasEdits) return;
    prototypeSessionHasEdits = true;
    updatePrototypeSessionUnloadGuard();
}

function prototypeSessionBeforeUnload(event)
{
    if (!prototypeSessionHasEdits && !projectSettingsHasUnsavedChanges()) return;
    event.preventDefault();
    event.returnValue = '';
}

function updatePrototypeSessionUnloadGuard()
{
    const shouldListen = prototypeSessionHasEdits || projectSettingsHasUnsavedChanges();
    if (shouldListen === prototypeSessionUnloadListening) return;
    prototypeSessionUnloadListening = shouldListen;
    window[shouldListen ? 'addEventListener' : 'removeEventListener'](
        'beforeunload', prototypeSessionBeforeUnload
    );
}

document.addEventListener('keydown', event =>
{
    if (event.key !== 'Escape') return;
    if (state.activeModule === 'Places' && placesMapRuntime.mode !== 'browse')
    {
        cancelPlacesMapEditing();
        return;
    }
    if (state.activeModule === 'Places' && state.placesMapInfoExpanded)
    {
        state.placesMapInfoExpanded = false;
        const panel = document.querySelector('#placesMapInfoPanel');
        const button = document.querySelector('#placesMapInfoToggle');
        if (panel) panel.hidden = true;
        button?.setAttribute('aria-expanded', 'false');
        return;
    }
    closeModal();
    closeMenu();
    if (
        state.activeModule === 'People'
        && state.peopleView === 'directory'
        && state.peopleSelectedIds.length
    )
    {
        clearPeopleSelection();
        renderPeople();
    }
});
main.addEventListener('click', e =>
{
    const personPhotoEdit = e.target.closest('[data-person-photo-edit]');
    if (personPhotoEdit)
    {
        e.preventDefault();
        openPersonPhotoPicker(personPhotoEdit.dataset.personPhotoEdit);
        return;
    }

    normalizeCentralNoteRelationships();
});

normalizeAllGenealogyDateRecords();
rebuildSampleEventsAndPruneSourceLinks();
render();
maybeOfferGeneoProductTour();
