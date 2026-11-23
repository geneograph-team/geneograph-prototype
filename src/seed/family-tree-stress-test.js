// TEMPORARY INTERNAL FIXTURE — remove before open user testing.
// Issue #381. Startup loads only this small generator; records appear on first open.
const FAMILY_TREE_STRESS_TEST_PROJECT_ID = 'p-family-tree-stress';
const FAMILY_TREE_STRESS_TEST_PERSON_COUNT = 1200;
const FAMILY_TREE_STRESS_TEST_COHORTS = Object.freeze([
    12, 18, 28, 44, 68, 104, 156, 220, 270, 280
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
    const previousParents = new Map();
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
                gender: i % 2 === 0 ? 'male' : 'female',
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

    const sharedParent = (a, b) =>
    {
        const aParents = previousParents.get(a.id) || [];
        const bParents = previousParents.get(b.id) || [];
        return aParents.some(parent => bParents.includes(parent));
    };
    const makeFamily = (a, b) =>
    {
        const family = {
            id: 'stress-family-' + pad(families.length + 1),
            projectId: FAMILY_TREE_STRESS_TEST_PROJECT_ID,
            type: 'family',
            partnerAId: a.id,
            partnerBId: b?.id || '',
            relationshipType: b ? 'Married' : 'Single parent',
            relationshipStatus: 'unknown',
            childIds: [],
            parentChildTypes: {},
            events: [], attributes: [], notes: [], citations: [], mediaIds: []
        };
        families.push(family);
        return family;
    };

    for (let generation = 0; generation < cohorts.length - 1; generation += 1)
    {
        const parents = cohorts[generation];
        const children = cohorts[generation + 1];
        const generationFamilies = [];
        if (generation === 0)
        {
            // Overlapping couples connect all twelve founders through real family edges.
            for (let i = 0; i < parents.length - 1; i += 1)
                generationFamilies.push(makeFamily(parents[i], parents[i + 1]));
        }
        else
        {
            // Match unrelated male/female cohort members. An augmenting-path
            // assignment avoids mating siblings and known half-siblings.
            const males = parents.filter(person => person.gender === 'male');
            const females = parents.filter(person => person.gender === 'female');
            const matchedFemale = new Map();
            const assign = (male, visited) =>
            {
                for (const female of females)
                {
                    if (visited.has(female.id) || sharedParent(male, female)) continue;
                    visited.add(female.id);
                    const previous = matchedFemale.get(female.id);
                    if (!previous || assign(previous, visited))
                    {
                        matchedFemale.set(female.id, male);
                        return true;
                    }
                }
                return false;
            };
            for (const male of males)
                if (!assign(male, new Set()))
                    throw new Error('Stress fixture could not pair generation ' + generation);

            let index = 0;
            for (const [femaleId, male] of matchedFemale)
            {
                const female = parents.find(person => person.id === femaleId);
                generationFamilies.push(makeFamily(male,
                    generation >= 2 && index % 17 === 7 ? null : female));
                index += 1;
            }

            // Another recorded partnership with children creates half-sibling
            // contexts without duplicating child memberships.
            const alternateParent = parents.find(person =>
                person.gender === 'female' && !sharedParent(parents[0], person)
                && !generationFamilies.some(family =>
                    family.partnerAId === parents[0].id && family.partnerBId === person.id));
            if (generation >= 2 && alternateParent)
                generationFamilies.push(makeFamily(parents[0], alternateParent));
        }

        // Every family gets a child. Reserve exactly seven extra children for
        // every 27th family to create repeatable 8-child sibling groups.
        const quota = generationFamilies.map(() => 1);
        let remaining = children.length - generationFamilies.length;
        if (remaining < 0) throw new Error('Not enough children in generation ' + generation);
        const wide = [];
        for (let i = 0; i < quota.length && remaining >= 7; i += 27)
        {
            quota[i] += 7;
            wide.push(i);
            remaining -= 7;
        }
        const ordinary = quota.map((unused, index) => index)
            .filter(index => !wide.includes(index));
        for (let i = 0; i < remaining; i += 1)
            quota[ordinary[(i + generation) % ordinary.length]] += 1;

        // Round-robin allocations avoid clustering siblings in adjacent IDs.
        let cursor = 0;
        const assigned = new Map();
        while (cursor < children.length)
        {
            for (let i = 0; i < quota.length; i += 1)
            {
                if (!quota[i]) continue;
                const family = generationFamilies[i];
                const child = children[cursor++];
                family.childIds.push(child.id);
                assigned.set(child.id, [family.partnerAId, family.partnerBId].filter(Boolean));
                for (const parentId of [family.partnerAId, family.partnerBId].filter(Boolean))
                    family.parentChildTypes[parentId + '|' + child.id] = 'Biological';
                quota[i] -= 1;
            }
        }
        previousParents.clear();
        for (const [childId, parentsForChild] of assigned)
            previousParents.set(childId, parentsForChild);
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
