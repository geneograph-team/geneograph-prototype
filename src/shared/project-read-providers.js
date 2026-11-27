const PROJECT_RELATIONSHIP_DOMAINS = Object.freeze(['people', 'families']);

function projectPeopleIndex(context)
{
    return context.read('people:index', ['people'], projectId =>
    {
        const raw = new Map();
        const eligible = new Map();
        const people = getPeople(projectId);
        const trace = typeof appPerf === 'undefined' ? null : appPerf.currentDetailed();
        if (trace) appPerf.count(trace, 'projectPeople', people.length);
        for (const person of people)
        {
            if (!person?.id || raw.has(person.id)) continue;
            raw.set(person.id, person);
            if (!person.deleted) eligible.set(person.id, person);
        }
        return Object.freeze({
            rawById: readOnlyProjectMap(raw),
            eligibleById: readOnlyProjectMap(eligible),
            eligible: Object.freeze([...eligible.values()])
        });
    });
}

function projectFamilyIndex(context)
{
    return context.read('families:index', PROJECT_RELATIONSHIP_DOMAINS, projectId =>
    {
        const people = projectPeopleIndex(context);
        const families = [];
        const byId = new Map();
        const byParent = new Map();
        const byChild = new Map();
        const add = (index, id, family) =>
        {
            if (!id || !people.rawById.has(id)) return;
            if (!index.has(id)) index.set(id, []);
            index.get(id).push(family);
        };
        const trace = typeof appPerf === 'undefined' ? null : appPerf.currentDetailed();
        let membershipVisits = 0;
        if (projectId)
        {
            const records = centralFamilyRecords();
            if (trace) appPerf.count(trace, 'familyRecordsScanned', records.length, true);
            for (const family of records)
            {
                if (!family || (family.projectId && family.projectId !== projectId)) continue;
                const parents = new Set([familyPartnerAId(family), familyPartnerBId(family)]);
                const children = new Set(family.childIds || []);
                if (!family.projectId && ![...parents, ...children].some(id => people.rawById.has(id))) continue;
                families.push(family);
                if (family.id && !byId.has(family.id)) byId.set(family.id, family);
                for (const id of parents) add(byParent, id, family);
                for (const id of children) add(byChild, id, family);
                if (trace) membershipVisits += parents.size + children.size;
            }
        }
        for (const bucket of [...byParent.values(), ...byChild.values()]) Object.freeze(bucket);
        const empty = Object.freeze([]);
        if (trace)
        {
            appPerf.count(trace, 'projectFamilies', families.length);
            appPerf.count(trace, 'membershipEdgesVisited', membershipVisits, true);
        }
        return Object.freeze({
            families: Object.freeze(families),
            byId: readOnlyProjectMap(byId),
            lookupPerson: id => people.rawById.get(id) || null,
            parentFamilies: id => byChild.get(id) || empty,
            partnerFamilies: id => byParent.get(id) || empty
        });
    });
}

function projectRelationshipLabels(context, referenceId)
{
    return context.read('families:labels', PROJECT_RELATIONSHIP_DOMAINS, projectId =>
    {
        const people = projectPeopleIndex(context);
        const families = projectFamilyIndex(context);
        const graph = context.read('families:graph', PROJECT_RELATIONSHIP_DOMAINS, id =>
            buildPersonRelationshipGraph(id, people.eligible, families.families, families.lookupPerson));
        return readOnlyProjectMap(buildPersonRelationshipLabelMap(projectId, referenceId, graph, families.lookupPerson));
    }, [referenceId]);
}
