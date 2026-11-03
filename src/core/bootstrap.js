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
