// Family Chart owns and mutates these records. Canonical identities and family
// context stay in the host; only the detached person graph goes to the engine.
function buildNativeFamilyChartInput(people, families, { contextual = false } = {})
{
    const peopleById = new Map(people.map(person => [person.id, person]));
    const nodes = new Map(people.map(person => [person.id, {
        id: person.id,
        data: { gender: { male: 'M', female: 'F' }[person.gender] || '' },
        rels: { parents: [], spouses: [], children: [] }
    }]));
    const parentFamilyByChild = new Map();
    const parentRolesByChild = new Map();
    const partnershipFamilies = new Map();
    const issues = [];

    for (const family of families)
    {
        const parents = [family.left, family.right].filter(Boolean);
        const children = family.children || [];
        for (const child of children)
        {
            const roles = parentRolesByChild.get(child) || {};
            if (family.left) roles.father = family.left;
            if (family.right) roles.mother = family.right;
            parentRolesByChild.set(child, roles);
        }
        if ([...parents, ...children].some(id => !nodes.has(id)))
        {
            issues.push({ type: 'missing-person', familyId: family.id });
            continue;
        }
        const [left, right] = parents;
        if (right)
        {
            const key = JSON.stringify([...parents].sort());
            if (partnershipFamilies.has(key) && !contextual)
                issues.push({ type: 'multiple-families-for-partners', familyId: family.id });
            else
                partnershipFamilies.set(key, family);
            if (!nodes.get(left).rels.spouses.includes(right)) nodes.get(left).rels.spouses.push(right);
            if (!nodes.get(right).rels.spouses.includes(left)) nodes.get(right).rels.spouses.push(left);
        }

        for (const child of children)
        {
            if (!parents.length)
                issues.push({ type: 'parentless-family', familyId: family.id, personId: child });
            if (parentFamilyByChild.has(child))
            {
                if (!contextual) issues.push({ type: 'multiple-parent-families', familyId: family.id, personId: child });
                continue;
            }
            parentFamilyByChild.set(child, family);
            nodes.get(child).rels.parents.push(...parents);
            for (const parent of parents) nodes.get(parent).rels.children.push(child);
        }
    }

    if (!issues.length)
    {
        const cyclePerson = projectParentCycle(peopleById, families,
            family => [family.left, family.right], family => family.children || []);
        if (cyclePerson) issues.push({ type: 'parent-cycle', personId: cyclePerson });
    }

    return {
        data: issues.length ? null : [...nodes.values()],
        peopleById,
        parentFamilyByChild,
        parentRolesByChild,
        partnershipFamilies,
        familyById: new Map(families.map(family => [family.id, family])),
        familyContexts: contextual ? families.map(family => ({
            id: family.id,
            parents: [family.left, family.right].filter(Boolean),
            children: [...(family.children || [])]
        })) : null,
        issues
    };
}
