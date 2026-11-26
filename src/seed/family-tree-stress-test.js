// TEMPORARY INTERNAL FIXTURE — remove before open user testing.
// Issue #446 replaces the synthetic #381 pedigree with a pseudonymized GEDCOM.
const FAMILY_TREE_STRESS_TEST_PROJECT_ID = 'p-family-tree-stress';
const FAMILY_TREE_STRESS_TEST_PERSON_COUNT = 6481;
const FAMILY_TREE_STRESS_TEST_FAMILY_COUNT = 1950;
let familyTreeStressTestLoaded = false;

function familyTreeStressTestIsLoaded(projectId)
{
    return projectId === FAMILY_TREE_STRESS_TEST_PROJECT_ID && familyTreeStressTestLoaded;
}

function buildFamilyTreeStressTestFixture(project, gedcom = FAMILY_TREE_STRESS_TEST_GEDCOM)
{
    const draft = mapGedcomImport(parseGedcomImport(gedcom), project);
    if (draft.errors.length) throw new Error(draft.errors.join('\n'));
    if (draft.records.people.length !== FAMILY_TREE_STRESS_TEST_PERSON_COUNT
        || draft.records.families.length !== FAMILY_TREE_STRESS_TEST_FAMILY_COUNT
        || draft.project.defaultPersonId !== project.defaultPersonId)
        throw new Error('Unexpected technical fixture counts or default person.');
    return draft;
}

function ensureFamilyTreeStressTestProjectLoaded(projectId)
{
    if (projectId !== FAMILY_TREE_STRESS_TEST_PROJECT_ID) return true;
    if (familyTreeStressTestLoaded) return true;
    const project = sampleData.projects.find(item => item.id === projectId);
    if (!project) return false;

    try
    {
        // The importer prepares and validates a detached draft including derived events.
        // Publish complete collections together; do not activate or create a second project.
        const draft = buildFamilyTreeStressTestFixture(project);
        const next = Object.fromEntries(Object.entries(draft.records).map(([key, records]) =>
            [key, [...(sampleData[key] || []), ...records]]));
        Object.assign(sampleData, next);
        familyTreeStressTestLoaded = true;
        return true;
    }
    catch (error)
    {
        console.error('[family-tree-stress-test] Invalid or missing technical fixture', error);
        return false;
    }
}
