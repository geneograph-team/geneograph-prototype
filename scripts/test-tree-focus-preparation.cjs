// Run against the isolated sample application in a browser.
async function checkTreeFocusPreparation()
{
    activateProject('p1', { moduleName: 'Family Tree' });
    const require = (ok, message) => { if (!ok) throw Error(message); };
    const projectId = currentFamilyTreeProjectId();
    const options = { focusPersonId: treeProjectViewState(projectId).focusPersonId, ancestorGenerations: 4,
        descendantGenerations: 3, showCousins: true };
    const old = () => buildFamilyTreeProjection(currentTreePeople(), currentTreeFamilies(), options);
    const prepare = () =>
    {
        const context = treeFocusContext(projectId);
        return hydrateTreeProjection(buildFamilyTreeProjection(context.people, treeContextFamilies(context), options), context);
    };
    const same = (a, b, label) => require(JSON.stringify(a) === JSON.stringify(b), label);
    const baseline = old();
    const fresh = prepare();
    same(fresh.people, baseline.people, 'Visible display differs');
    same(fresh.families, baseline.families, 'Projected families differ');
    same(prepareElkTreeInput(fresh), prepareElkTreeInput(baseline), 'ELK input differs');
    const id = options.focusPersonId;
    const person = getPerson(id);
    const expected = fresh.people.find(p => p.id === id);
    const calls = { hydrated: 0, projectPhotos: 0, projectNotes: 0 };
    const convert = toTreePerson, photos = getProjectPhotos, notes = getProjectNotes;
    toTreePerson = (record, context) => { if (context) calls.hydrated++; return convert(record, context); };
    getProjectPhotos = (...args) => { calls.projectPhotos++; return photos(...args); };
    getProjectNotes = (...args) => { calls.projectNotes++; return notes(...args); };
    try
    {
        for (let i = 0; i < 6500; i++) sampleData.people.push({ id: 'focus-prep-hidden-' + i, projectId });
        sampleData.media.push({ id: 'focus-prep-photo', projectId, personIds: [id, id] },
            { id: 'focus-prep-outside-photo', projectId: 'elsewhere', personIds: [id] });
        sampleData.archiveFiles.push({ id: 'focus-prep-file', linkedPersonIds: [id, id] },
            { id: 'focus-prep-deleted-file', projectId, deleted: true, linkedPersonIds: [id] });
        sampleData.notes.push({ id: 'focus-prep-note', projectId, linkedPersonIds: [id, id] },
            { id: 'focus-prep-archived-note', projectId, archived: true, linkedPersonIds: [id] });
        const before = JSON.stringify(person);
        const changed = prepare();
        const card = changed.people.find(p => p.id === id);
        same([card.photos, card.files, card.notes], [expected.photos + 1, expected.files + 1, expected.notes + 1], 'Resource count semantics');
        same(calls, { hydrated: fresh.people.length, projectPhotos: 1, projectNotes: 1 }, 'Unexpected hydration or scan count');
        same(JSON.stringify(person), before, 'Canonical person was changed');
        for (const key of ['media', 'archiveFiles', 'notes'])
            for (const resource of sampleData[key])
                if (resource.id.startsWith('focus-prep-'))
                {
                    resource.personIds = [];
                    resource.linkedPersonIds = [];
                }
        const unlinked = prepare().people.find(p => p.id === id);
        same([unlinked.photos, unlinked.files, unlinked.notes], [expected.photos, expected.files, expected.notes], 'Unlink freshness');
        const originalName = person.names;
        try
        {
            person.names = { ...originalName, first: 'Updated', last: '' };
            same(prepare().people, old().people, 'Edited name or surname fallback differs');
        }
        finally { person.names = originalName; }

        for (let i = 0; i < 150 && !treeRenderRuntime?.scene; i++)
            await new Promise(resolve => setTimeout(resolve, 20));
        const outside = 'focus-prep-hidden-0';
        require(!treeRenderRuntime?.scene?.primaryByPerson.has(outside), 'Fixture person was already visible');
        const makeContext = treeFocusContext;
        let contexts = 0;
        treeFocusContext = (...args) => { contexts++; return makeContext(...args); };
        try
        {
            const before = calls.hydrated;
            require(navigateFamilyTreeToPerson(outside), 'Off-tree navigation failed');
            require(treeProjectViewState(projectId).focusPersonId === outside, 'Off-tree focus differs');
            require(contexts === 1 && calls.hydrated === before + 1, 'Off-tree path repeated preparation or hydrated invisible people');
        }
        finally { treeFocusContext = makeContext; }
    }
    finally
    {
        sampleData.people = sampleData.people.filter(person => !person.id.startsWith('focus-prep-hidden-'));
        toTreePerson = convert;
        getProjectPhotos = photos;
        getProjectNotes = notes;
        for (const key of ['media', 'archiveFiles', 'notes'])
            sampleData[key] = sampleData[key].filter(record => !record.id.startsWith('focus-prep-'));
    }
    return { people: fresh.people.length, families: fresh.families.length, baselineMatch: true };
}
if (typeof module !== 'undefined') module.exports = checkTreeFocusPreparation;
