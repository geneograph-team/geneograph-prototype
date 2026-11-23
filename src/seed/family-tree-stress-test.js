// TEMPORARY INTERNAL FIXTURE — remove before open user testing.
// Issue #381. v3 is a complete 10-generation upward ancestor pedigree.
// Loading the code at startup does NOT generate records: first project open does.
const FAMILY_TREE_STRESS_TEST_PROJECT_ID = 'p-family-tree-stress';
const FAMILY_TREE_STRESS_TEST_ANCESTOR_LEVELS = 9;
const FAMILY_TREE_STRESS_TEST_PERSON_COUNT =
    2 ** (FAMILY_TREE_STRESS_TEST_ANCESTOR_LEVELS + 1) - 1;
let familyTreeStressTestLoaded = false;

function familyTreeStressTestIsLoaded(projectId)
{
    return projectId === FAMILY_TREE_STRESS_TEST_PROJECT_ID && familyTreeStressTestLoaded;
}

function buildFamilyTreeStressTestFixture()
{
    const people = [];
    const families = [];
    const pad = value => String(value).padStart(4, '0');
    const id = number => 'stress-person-' + pad(number);
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

    // Standard binary pedigree numbering:
    // Person 0001 = proband (bottom), 0002 = father, 0003 = mother,
    // 0004/0005 = paternal grandparents, 0006/0007 = maternal grandparents.
    // For person n, father = 2n and mother = 2n + 1.
    // All 9 levels of parents are known, so the first 10 rows contain
    // 1, 2, 4, 8, ... 512 distinct people with NO pedigree collapse.
    for (let number = 1; number <= FAMILY_TREE_STRESS_TEST_PERSON_COUNT; number += 1)
    {
        const generation = Math.floor(Math.log2(number));
        const birthYear = 2000 - generation * 30;
        people.push({
            id: id(number),
            projectId: FAMILY_TREE_STRESS_TEST_PROJECT_ID,
            names: { first: 'Person', middle: '', last: pad(number),
                maiden: '', prefix: '', suffix: '' },
            gender: number % 2 === 0 ? 'male' : 'female',
            livingStatus: birthYear >= 1950 ? 'Living' : 'Deceased',
            birth: yearDate(birthYear),
            death: emptyDate(),
            profile: { alternativeNames: null },
            events: [], attributes: [], notes: [], citations: [], mediaIds: []
        });
    }

    // Exactly one canonical family for each child who has recorded parents.
    // Each parent appears in ONE family as a partner and, unless in the
    // oldest generation, ONE other family as a child. The result is a
    // connected acyclic person–family graph with no repeated visual paths.
    const childrenWithParents = Math.floor(FAMILY_TREE_STRESS_TEST_PERSON_COUNT / 2);
    for (let childNumber = 1; childNumber <= childrenWithParents; childNumber += 1)
    {
        const fatherId = id(childNumber * 2);
        const motherId = id(childNumber * 2 + 1);
        const childId = id(childNumber);
        families.push({
            id: 'stress-family-' + pad(childNumber),
            projectId: FAMILY_TREE_STRESS_TEST_PROJECT_ID,
            type: 'family',
            partnerAId: fatherId,
            partnerBId: motherId,
            relationshipType: 'Married',
            relationshipStatus: 'unknown',
            childIds: [childId],
            parentChildTypes: {
                [fatherId + '|' + childId]: 'Biological',
                [motherId + '|' + childId]: 'Biological'
            },
            events: [], attributes: [], notes: [], citations: [], mediaIds: []
        });
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
