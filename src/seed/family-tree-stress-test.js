// TEMPORARY INTERNAL FIXTURE — remove before open user testing.
// Issue #381. Startup loads only this small generator; records appear on first open.
const FAMILY_TREE_STRESS_TEST_PROJECT_ID = 'p-family-tree-stress';
const FAMILY_TREE_STRESS_TEST_PERSON_COUNT = 1200;
const FAMILY_TREE_STRESS_TEST_COHORTS = Object.freeze([
    2, 10, 22, 40, 64, 96, 150, 220, 280, 316
]);
let familyTreeStressTestLoaded = false;

function familyTreeStressTestIsLoaded(projectId)
{
    return projectId === FAMILY_TREE_STRESS_TEST_PROJECT_ID && familyTreeStressTestLoaded;
}

function buildFamilyTreeStressTestFixture()
{
    const people = [];
    const families = [];
    const cohorts = [];
    const pad = value => String(value).padStart(4, '0');
    const emptyDate = () => ({
        state: 'empty', dateType: 'Exact date', calendar: 'Gregorian',
        originalText: '', first: { year: null, month: null, day: null },
        second: null, placeId: null
    });
    const yearDate = year => ({
        state: 'known', dateType: 'Exact date', calendar: 'Gregorian',
        originalText: String(year), first: { year, month: null, day: null },
        second: null, placeId: null
    });

    FAMILY_TREE_STRESS_TEST_COHORTS.forEach((count, generation) =>
    {
        const year = 1740 + generation * 30;
        const cohort = [];
        for (let i = 0; i < count; i += 1)
        {
            const number = people.length + 1;
            const person = {
                id: 'stress-person-' + pad(number),
                projectId: FAMILY_TREE_STRESS_TEST_PROJECT_ID,
                names: { first: 'Person', middle: '', last: pad(number),
                    maiden: '', prefix: '', suffix: '' },
                // The paired people are a descendant and a new spouse.
                // Vary the descendant's gender between branches.
                gender: generation < 9
                    ? ((Math.floor(i / 2) + generation + i % 2) % 2 ? 'female' : 'male')
                    : (i % 2 === 0 ? 'male' : 'female'),
                livingStatus: year >= 1950 ? 'Living' : 'Deceased',
                birth: yearDate(year),
                death: emptyDate(),
                profile: { alternativeNames: null },
                events: [], attributes: [], notes: [], citations: [], mediaIds: []
            };
            people.push(person);
            cohort.push(person);
        }
        cohorts.push(cohort);
    });

    const makeFamily = (a, b) =>
    {
        const family = {
            id: 'stress-family-' + pad(families.length + 1),
            projectId: FAMILY_TREE_STRESS_TEST_PROJECT_ID,
            type: 'family',
            partnerAId: a.id,
            partnerBId: b.id,
            relationshipType: 'Married',
            relationshipStatus: 'unknown',
            childIds: [],
            parentChildTypes: {},
            events: [], attributes: [], notes: [], citations: [], mediaIds: []
        };
        families.push(family);
        return family;
    };

    // Each new generation consists of descendant/spouse pairs (except the
    // last generation, which contains children only). A spouse is introduced
    // without recorded parents. Only the descendant continues the connected
    // ancestral branch. This deliberately avoids pedigree collapse, multiple
    // partner families and repeated visual person instances in the Tree.
    for (let generation = 0; generation < cohorts.length - 1; generation += 1)
    {
        const parents = cohorts[generation];
        const next = cohorts[generation + 1];
        const generationFamilies = [];

        for (let index = 0; index < parents.length; index += 2)
            generationFamilies.push(makeFamily(parents[index], parents[index + 1]));

        const children = generation + 1 === cohorts.length - 1
            ? next
            : next.filter((person, index) => index % 2 === 0);

        // Every couple has at least one child. Reserve 7 extra children for
        // selected households to produce 8-sibling stress cases; distribute
        // the remainder deterministically without interleaving siblings.
        const quota = generationFamilies.map(() => 1);
        let remaining = children.length - quota.length;
        if (remaining < 0)
            throw new Error('Not enough children in generation ' + generation);

        const wide = new Set();
        for (let index = 0; index < quota.length && remaining >= 7; index += 19)
        {
            quota[index] += 7;
            remaining -= 7;
            wide.add(index);
        }

        const ordinary = quota.map((unused, index) => index)
            .filter(index => !wide.has(index));
        for (let offset = 0; offset < remaining; offset += 1)
        {
            const index = ordinary[(offset + generation) % ordinary.length];
            quota[index] += 1;
        }

        let cursor = 0;
        for (let index = 0; index < generationFamilies.length; index += 1)
        {
            const family = generationFamilies[index];
            for (let childIndex = 0; childIndex < quota[index]; childIndex += 1)
            {
                const child = children[cursor++];
                family.childIds.push(child.id);
                family.parentChildTypes[family.partnerAId + '|' + child.id] = 'Biological';
                family.parentChildTypes[family.partnerBId + '|' + child.id] = 'Biological';
            }
        }
        if (cursor !== children.length)
            throw new Error('Unassigned children in generation ' + generation);
    }

    return { people, families };
}

function ensureFamilyTreeStressTestProjectLoaded(projectId)
{
    if (projectId !== FAMILY_TREE_STRESS_TEST_PROJECT_ID) return true;
    if (familyTreeStressTestLoaded) return true;
    const project = sampleData.projects.find(item => item.id === projectId);
    if (!project) return false;

    // Build and validate off-state, so a failure never partially publishes data.
    const fixture = buildFamilyTreeStressTestFixture();
    const errors = validateProjectDraft(project, fixture);
    if (errors.length)
    {
        console.error('[family-tree-stress-test] Invalid technical fixture', errors);
        return false;
    }
    const events = buildSampleEvents({ ...fixture, places: [] });
    sampleData.people.push(...fixture.people);
    sampleData.families.push(...fixture.families);
    sampleData.events.push(...events);
    familyTreeStressTestLoaded = true;
    return true;
}
