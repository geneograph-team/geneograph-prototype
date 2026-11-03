function centralFamilyRecords()
{
    sampleData.families = Array.isArray(sampleData.families) ? sampleData.families : [];
    return sampleData.families;
}

function familyPartnerAId(family)
{
    return family?.partnerAId || family?.partner1Id || family?.personAId || '';
}

function familyPartnerBId(family)
{
    return family?.partnerBId || family?.partner2Id || family?.personBId || '';
}

function familyPartnerRole(family, personId)
{
    if (!family || !personId) return '';
    const partnerA = familyPartnerAId(family);
    const partnerB = familyPartnerBId(family);
    const hint = partnerA === personId
        ? family.partnerARoleHint || family.partner1RoleHint || family.personARoleHint || family.husbandRoleHint || ''
        : partnerB === personId
            ? family.partnerBRoleHint || family.partner2RoleHint || family.personBRoleHint || family.wifeRoleHint || ''
            : '';
    const text = String(hint || '').trim().toLowerCase();
    if (['husb', 'husband', 'father', 'male', 'dad'].includes(text)) return 'father';
    if (['wife', 'mother', 'female', 'mom', 'mum'].includes(text)) return 'mother';
    const gender = String(getPerson(personId)?.gender || '').toLowerCase();
    if (gender === 'male') return 'father';
    if (gender === 'female') return 'mother';
    return '';
}

function familyFatherId(family)
{
    const ids = [familyPartnerAId(family), familyPartnerBId(family)].filter(Boolean);
    return ids.find(id => familyPartnerRole(family, id) === 'father') || '';
}

function familyMotherId(family)
{
    const ids = [familyPartnerAId(family), familyPartnerBId(family)].filter(Boolean);
    return ids.find(id => familyPartnerRole(family, id) === 'mother') || '';
}

function normalizedFamilyPair(family)
{
    const rawA = familyPartnerAId(family);
    const rawB = familyPartnerBId(family);
    let fatherId = family.fatherId || family.husbandId || familyFatherId(family);
    let motherId = family.motherId || family.wifeId || familyMotherId(family);
    const ids = [rawA, rawB].filter(Boolean);

    if (!fatherId && !motherId && ids.length === 2)
    {
        fatherId = ids[0];
        motherId = ids[1];
    }
    else if (!fatherId && !motherId && ids.length === 1)
    {
        const role = familyPartnerRole(family, ids[0]);
        if (role === 'mother') motherId = ids[0];
        else fatherId = ids[0];
    }

    return { fatherId: fatherId || '', motherId: motherId || '' };
}

function familyPairKey(fatherId = '', motherId = '')
{
    return `${fatherId || ''}|${motherId || ''}`;
}

function familyIncludesPerson(family, personId)
{
    return familyPartnerAId(family) === personId || familyPartnerBId(family) === personId;
}

function familyPartnerId(family, personId)
{
    return familyPartnerAId(family) === personId ? familyPartnerBId(family) : familyPartnerAId(family);
}

const PARENT_CHILD_RELATIONSHIP_TYPES = Object.freeze([
    'Biological',
    'Adoptive',
    'Step',
    'Foster',
    'Guardian'
]);

function normalizeParentChildRelationshipType(
    value
)
{
    const normalized = String(value || '').trim();

    return PARENT_CHILD_RELATIONSHIP_TYPES.includes(
        normalized
    )
        ? normalized
        : 'Biological';
}

function sanitizeParentChildTypes(types)
{
    if (
        !types
        || typeof types !== 'object'
        || Array.isArray(types)
    )
    {
        return {};
    }

    return Object.fromEntries(
        Object.entries(types)
            .filter(([key]) => Boolean(key))
            .map(([key, value]) => [
                key,
                normalizeParentChildRelationshipType(value)
            ])
    );
}

function buildFamiliesFromRelationshipRecords(records = [])
{
    const source = Array.isArray(records) ? records : [];
    const familyMap = new Map();
    const pairToFamilyId = new Map();
    const parentChildRecords = source.filter(record => record?.type === 'parentChild');

    const rememberFamily = family =>
    {
        const pair = normalizedFamilyPair(family);
        const normalized = {
            ...family,
            type: 'family',
            fatherId: pair.fatherId,
            motherId: pair.motherId,
            partnerAId: pair.fatherId || '',
            partnerBId: pair.motherId || '',
            partner1Id: pair.fatherId || '',
            partner2Id: pair.motherId || '',
            personAId: pair.fatherId || '',
            personBId: pair.motherId || '',
            partnerARoleHint: pair.fatherId ? 'HUSB' : '',
            partnerBRoleHint: pair.motherId ? 'WIFE' : '',
            childIds: [...new Set([...(family.childIds || []), ...(family.childrenIds || [])].filter(Boolean))],
            events: Array.isArray(family.events) ? family.events : [],
            attributes: Array.isArray(family.attributes) ? family.attributes : [],
            notes: Array.isArray(family.notes) ? family.notes : [],
            citations: Array.isArray(family.citations) ? family.citations : [],
            mediaIds: Array.isArray(family.mediaIds) ? family.mediaIds : [],
            parentChildTypes: sanitizeParentChildTypes(
                family.parentChildTypes
            ),
        };
        normalized.relationshipType = relationshipTypeFromLegacy(normalized);
        normalized.relationshipStatus = normalized.relationshipStatus || 'active';
        normalized.gedcomXref = normalized.gedcomXref || `@F${normalized.id.replace(/[^a-z0-9]/gi, '').toUpperCase()}@`;
        const key = familyPairKey(normalized.fatherId, normalized.motherId);
        const existingId = (normalized.fatherId || normalized.motherId) ? pairToFamilyId.get(key) : '';
        if (existingId && existingId !== normalized.id && familyMap.has(existingId))
        {
            const existing = familyMap.get(existingId);
            existing.childIds = [...new Set([...(existing.childIds || []), ...(normalized.childIds || [])])];
            existing.events = [...(existing.events || []), ...(normalized.events || [])];
            existing.attributes = [...(existing.attributes || []), ...(normalized.attributes || [])];
            existing.notes = [...(existing.notes || []), ...(normalized.notes || [])];
            existing.citations = [...(existing.citations || []), ...(normalized.citations || [])];
            existing.mediaIds = [...new Set([...(existing.mediaIds || []), ...(normalized.mediaIds || [])])];
            existing.parentChildTypes = {
                ...sanitizeParentChildTypes(
                    existing.parentChildTypes
                ),
                ...sanitizeParentChildTypes(
                    normalized.parentChildTypes
                )
            };
            return existing;
        }
        familyMap.set(normalized.id, normalized);
        if ((normalized.fatherId || normalized.motherId) && !pairToFamilyId.has(key)) pairToFamilyId.set(key, normalized.id);
        return normalized;
    };

    source.filter(record => isFamilyRelationship(record)).forEach(record =>
    {
        const partnerAId = relationshipPartnerAId(record);
        const partnerBId = relationshipPartnerBId(record);
        const id = record.id || relationshipIdForPartners(partnerAId, partnerBId);
        rememberFamily({ ...record, id, partnerAId, partnerBId, partner1Id: partnerAId, partner2Id: partnerBId, personAId: partnerAId, personBId: partnerBId });
    });

    const parentLinksByChild = new Map();
    parentChildRecords.forEach(link =>
    {
        if (!link.parentId || !link.childId) return;
        if (!parentLinksByChild.has(link.childId)) parentLinksByChild.set(link.childId, { childId: link.childId, projectId: link.projectId, fatherId: '', motherId: '' });
        const group = parentLinksByChild.get(link.childId);
        const role = String(link.parentRole || getPerson(link.parentId)?.gender || '').toLowerCase();
        if (role === 'mother' || role === 'female') group.motherId = link.parentId;
        else group.fatherId = link.parentId;
    });

    const ensureParentFamily = group =>
    {
        const key = familyPairKey(group.fatherId, group.motherId);
        let familyId = pairToFamilyId.get(key);
        if (!familyId)
        {
            const idBits = [group.fatherId || 'unknown-father', group.motherId || 'unknown-mother', group.childId].join('-');
            familyId = `fam-${idBits}`;
            const family = rememberFamily({
                id: familyId,
                projectId: group.projectId,
                type: 'family',
                fatherId: group.fatherId,
                motherId: group.motherId,
                partnerAId: group.fatherId || '',
                partnerBId: group.motherId || '',
                relationshipType: 'Unknown relationship',
                relationshipStatus: 'active',
                childIds: []
            });
            pairToFamilyId.set(key, family.id);
        }
        const family = familyMap.get(familyId);
        if (family && !family.childIds.includes(group.childId)) family.childIds.push(group.childId);
    };

    parentLinksByChild.forEach(ensureParentFamily);

    const preferredChildFamily = new Map();
    Array.from(familyMap.values()).forEach(family =>
    {
        family.childIds = (family.childIds || []).filter(childId =>
        {
            if (!preferredChildFamily.has(childId))
            {
                preferredChildFamily.set(childId, family.id);
                return true;
            }
            return preferredChildFamily.get(childId) === family.id;
        });
    });

    return Array.from(familyMap.values());
}

function syncFamilyReciprocalLinks()
{
    sampleData.people.forEach(person =>
    {
        person.familyAsSpouseIds = [];
        person.familyAsChildIds = [];
    });
    centralFamilyRecords().forEach(family =>
    {
        [familyPartnerAId(family), familyPartnerBId(family)].filter(Boolean).forEach(personId =>
        {
            const person = getPerson(personId);
            if (person && !person.familyAsSpouseIds.includes(family.id)) person.familyAsSpouseIds.push(family.id);
        });
        (family.childIds || []).forEach(personId =>
        {
            const person = getPerson(personId);
            if (person && !person.familyAsChildIds.includes(family.id)) person.familyAsChildIds.push(family.id);
        });
    });
}

function uniquePeopleById(people)
{
    const seen = new Set();

    return people.filter(person =>
    {
        if (!person?.id || seen.has(person.id))
        {
            return false;
        }

        seen.add(person.id);
        return true;
    });
}

function getParents(personId)
{
    const parents = centralFamilyRecords()
        .filter(family =>
            (family.childIds || []).includes(personId)
        )
        .flatMap(family =>
            [
                familyPartnerAId(family),
                familyPartnerBId(family)
            ]
                .filter(Boolean)
                .map(parentId =>
                {
                    const parent = getPerson(parentId);

                    if (!parent) return null;

                    return {
                        ...parent,
                        parentRole:
                  familyPartnerRole(family, parentId)
                  || 'parent'
                    };
                })
        )
        .filter(Boolean);

    return uniquePeopleById(parents);
}

function getChildren(personId)
{
    const childIds = new Set(
        centralFamilyRecords()
            .filter(family =>
                familyIncludesPerson(family, personId)
            )
            .flatMap(family => family.childIds || [])
    );

    return [...childIds]
        .map(childId => getPerson(childId))
        .filter(Boolean);
}

function isFamilyRelationship(rel)
{
    return rel?.type === 'family' || rel?.type === 'partner';
}

function relationshipPartnerAId(rel)
{
    return rel?.partnerAId || rel?.partner1Id || rel?.personAId || '';
}

function relationshipPartnerBId(rel)
{
    return rel?.partnerBId || rel?.partner2Id || rel?.personBId || '';
}

function relationshipIncludesPerson(rel, personId)
{
    return isFamilyRelationship(rel) && (relationshipPartnerAId(rel) === personId || relationshipPartnerBId(rel) === personId);
}

function getPartnerRelationships(personId)
{
    const id = String(personId || '');

    return centralFamilyRecords()
        .filter(family =>
        {
            if (!familyIncludesPerson(family, id)) return false;

            const partnerId = familyPartnerId(family, id);
            return Boolean(partnerId && getPerson(partnerId));
        });
}

function getRelationshipPartnerId(rel, personId)
{
    return relationshipPartnerAId(rel) === personId ? relationshipPartnerBId(rel) : relationshipPartnerAId(rel);
}

function getRelationshipPartner(rel, personId)
{
    return getPerson(getRelationshipPartnerId(rel, personId));
}

function getPartners(personId)
{
    return getPartnerRelationships(personId)
        .map(rel => getRelationshipPartner(rel, personId))
        .filter(Boolean);
}

function genderedPersonRelationship(
    personId,
    {
        male,
        female,
        neutral
    }
)
{
    const gender =
        String(
            getPerson(personId)?.gender
          || ''
        ).toLowerCase();

    if (gender === 'male')
    {
        return male;
    }

    if (gender === 'female')
    {
        return female;
    }

    return neutral;
}

function addPersonRelationshipGraphEdge(
    graph,
    fromPersonId,
    edge
)
{
    if (
        !fromPersonId
        || !edge?.personId
        || fromPersonId === edge.personId
        || !graph.has(fromPersonId)
        || !graph.has(edge.personId)
    )
    {
        return;
    }

    const edges =
        graph.get(fromPersonId);

    const duplicate =
        edges.some(existing =>
            existing.personId === edge.personId
          && existing.kind === edge.kind
          && existing.familyId === edge.familyId
        );

    if (!duplicate)
    {
        edges.push(edge);
    }
}

function buildPersonRelationshipGraph(
    projectId
)
{
    const people =
        getPeople(projectId)
            .filter(person =>
                person?.id
            && !person.deleted
            );

    const graph =
        new Map(
            people.map(person => [
                person.id,
                []
            ])
        );

    centralFamilyRecords()
        .filter(family =>
            family
          && family.relationshipStatus
            !== 'deleted'
          && (
              !projectId
            || !family.projectId
            || family.projectId
              === projectId
          )
        )
        .forEach(family =>
        {
            const firstPartnerId =
                familyPartnerAId(family);

            const secondPartnerId =
                familyPartnerBId(family);

            if (
                firstPartnerId
            && secondPartnerId
            )
            {
                addPersonRelationshipGraphEdge(
                    graph,
                    firstPartnerId,
                    {
                        personId:
                  secondPartnerId,

                        kind:
                  'partner',

                        familyId:
                  family.id,

                        family
                    }
                );

                addPersonRelationshipGraphEdge(
                    graph,
                    secondPartnerId,
                    {
                        personId:
                  firstPartnerId,

                        kind:
                  'partner',

                        familyId:
                  family.id,

                        family
                    }
                );
            }

            const parentIds =
                [
                    firstPartnerId,
                    secondPartnerId
                ].filter(Boolean);

            const childIds =
                [
                    ...new Set([
                        ...(family.childIds || []),
                        ...(family.childrenIds || [])
                    ])
                ].filter(Boolean);

            childIds.forEach(childId =>
            {
                parentIds.forEach(parentId =>
                {
                    const parentRole =
                        familyPartnerRole(
                            family,
                            parentId
                        )
                || 'parent';

                    addPersonRelationshipGraphEdge(
                        graph,
                        parentId,
                        {
                            personId:
                    childId,

                            kind:
                    'child',

                            parentRole,

                            familyId:
                    family.id,

                            family
                        }
                    );

                    addPersonRelationshipGraphEdge(
                        graph,
                        childId,
                        {
                            personId:
                    parentId,

                            kind:
                    'parent',

                            parentRole,

                            familyId:
                    family.id,

                            family
                        }
                    );
                });
            });
        });

    return graph;
}

function partnerRelationshipLabel(
    edge
)
{
    const family =
        edge?.family;

    const relationshipType =
        relationshipTypeFromLegacy(
            family
        );

    const relationshipStatus =
        String(
            family?.relationshipStatus
          || ''
        ).trim().toLowerCase();

    const formerTypes =
        new Set([
            'Former partner',
            'Separated',
            'Divorced',
            'Annulled'
        ]);

    if (
        relationshipStatus === 'ended'
        || formerTypes.has(
            relationshipType
        )
    )
    {
        return 'Former partner';
    }

    if (
        relationshipType === 'Married'
    )
    {
        return 'Spouse';
    }

    return 'Partner';
}

function ancestorRelationshipLabel(
    personId,
    depth,
    firstParentRole = '',
    {
        inLaw = false
    } = {}
)
{
    let label = '';

    if (depth === 1)
    {
        label =
            genderedPersonRelationship(
                personId,
                {
                    male:
                'Father',

                    female:
                'Mother',

                    neutral:
                'Parent'
                }
            );
    }
    else if (depth === 2)
    {
        label =
            genderedPersonRelationship(
                personId,
                {
                    male:
                'Grandfather',

                    female:
                'Grandmother',

                    neutral:
                'Grandparent'
                }
            );

        if (!inLaw)
        {
            const side =
                firstParentRole === 'father'
                    ? 'Paternal'
                    : firstParentRole === 'mother'
                        ? 'Maternal'
                        : '';

            if (side)
            {
                label =
                    `${side} ${
                        label.toLowerCase()
                    }`;
            }
        }
    }
    else if (depth === 3)
    {
        label =
            genderedPersonRelationship(
                personId,
                {
                    male:
                'Great-grandfather',

                    female:
                'Great-grandmother',

                    neutral:
                'Great-grandparent'
                }
            );
    }
    else
    {
        return 'Distant ancestor';
    }

    return inLaw
        ? `${label}-in-law`
        : label;
}

function descendantRelationshipLabel(
    personId,
    depth,
    {
        inLaw = false
    } = {}
)
{
    if (
        inLaw
        && depth !== 1
    )
    {
        return 'Relative';
    }

    let label = '';

    if (depth === 1)
    {
        label =
            genderedPersonRelationship(
                personId,
                {
                    male:
                'Son',

                    female:
                'Daughter',

                    neutral:
                'Child'
                }
            );
    }
    else if (depth === 2)
    {
        label =
            genderedPersonRelationship(
                personId,
                {
                    male:
                'Grandson',

                    female:
                'Granddaughter',

                    neutral:
                'Grandchild'
                }
            );
    }
    else if (depth === 3)
    {
        label =
            genderedPersonRelationship(
                personId,
                {
                    male:
                'Great-grandson',

                    female:
                'Great-granddaughter',

                    neutral:
                'Great-grandchild'
                }
            );
    }
    else
    {
        return 'Distant descendant';
    }

    return inLaw
        ? `${label}-in-law`
        : label;
}

function siblingRelationshipLabel(
    personId,
    {
        inLaw = false
    } = {}
)
{
    const label =
        genderedPersonRelationship(
            personId,
            {
                male:
              'Brother',

                female:
              'Sister',

                neutral:
              'Sibling'
            }
        );

    return inLaw
        ? `${label}-in-law`
        : label;
}

function stepParentRelationshipLabel(
    personId
)
{
    return genderedPersonRelationship(
        personId,
        {
            male:
            'Stepfather',

            female:
            'Stepmother',

            neutral:
            'Stepparent'
        }
    );
}

function stepChildRelationshipLabel(
    personId
)
{
    return genderedPersonRelationship(
        personId,
        {
            male:
            'Stepson',

            female:
            'Stepdaughter',

            neutral:
            'Stepchild'
        }
    );
}

function pathHasRelationshipKinds(
    path,
    kinds
)
{
    return (
        path.length === kinds.length
        && path.every(
            (edge, index) =>
                edge.kind === kinds[index]
        )
    );
}

function personRelationshipLabelFromPath(
    personId,
    path
)
{
    if (!path.length)
    {
        return 'Self';
    }

    if (
        path.length === 1
        && path[0].kind === 'partner'
    )
    {
        return partnerRelationshipLabel(
            path[0]
        );
    }

    if (
        path.every(edge =>
            edge.kind === 'parent'
        )
    )
    {
        return ancestorRelationshipLabel(
            personId,
            path.length,
            path[0]?.parentRole || ''
        );
    }

    if (
        path.every(edge =>
            edge.kind === 'child'
        )
    )
    {
        return descendantRelationshipLabel(
            personId,
            path.length
        );
    }

    if (
        pathHasRelationshipKinds(
            path,
            [
                'parent',
                'child'
            ]
        )
    )
    {
        return siblingRelationshipLabel(
            personId
        );
    }

    /*
      * Ancestor of a partner:
      * partner -> parent -> parent...
      */
    if (
        path[0]?.kind === 'partner'
        && path
            .slice(1)
            .every(edge =>
                edge.kind === 'parent'
            )
    )
    {
        const ancestorPath =
            path.slice(1);

        return ancestorRelationshipLabel(
            personId,
            ancestorPath.length,
            ancestorPath[0]
                ?.parentRole
            || '',
            {
                inLaw:
              true
            }
        );
    }

    /*
      * Partner of a child.
      */
    if (
        pathHasRelationshipKinds(
            path,
            [
                'child',
                'partner'
            ]
        )
    )
    {
        return descendantRelationshipLabel(
            personId,
            1,
            {
                inLaw:
              true
            }
        );
    }

    /*
      * Partner of a parent.
      */
    if (
        pathHasRelationshipKinds(
            path,
            [
                'parent',
                'partner'
            ]
        )
    )
    {
        return stepParentRelationshipLabel(
            personId
        );
    }

    /*
      * Child of a partner.
      */
    if (
        pathHasRelationshipKinds(
            path,
            [
                'partner',
                'child'
            ]
        )
    )
    {
        return stepChildRelationshipLabel(
            personId
        );
    }

    /*
      * Partner's sibling or sibling's partner.
      */
    if (
        pathHasRelationshipKinds(
            path,
            [
                'partner',
                'parent',
                'child'
            ]
        )
        || pathHasRelationshipKinds(
            path,
            [
                'parent',
                'child',
                'partner'
            ]
        )
    )
    {
        return siblingRelationshipLabel(
            personId,
            {
                inLaw:
              true
            }
        );
    }

    /*
      * Parent's sibling.
      */
    if (
        pathHasRelationshipKinds(
            path,
            [
                'parent',
                'parent',
                'child'
            ]
        )
    )
    {
        return genderedPersonRelationship(
            personId,
            {
                male:
              'Uncle',

                female:
              'Aunt',

                neutral:
              'Parent\'s sibling'
            }
        );
    }

    /*
      * Sibling's child.
      */
    if (
        pathHasRelationshipKinds(
            path,
            [
                'parent',
                'child',
                'child'
            ]
        )
    )
    {
        return genderedPersonRelationship(
            personId,
            {
                male:
              'Nephew',

                female:
              'Niece',

                neutral:
              'Sibling\'s child'
            }
        );
    }

    /*
      * First cousin:
      * parent -> grandparent ->
      * grandparent's child -> cousin
      */
    if (
        pathHasRelationshipKinds(
            path,
            [
                'parent',
                'parent',
                'child',
                'child'
            ]
        )
    )
    {
        return 'First cousin';
    }

    return 'Relative';
}

function buildPersonRelationshipLabelMap(
    projectId,
    referencePersonId =
        treeDefaultPersonId(projectId)
)
{
    const graph =
        buildPersonRelationshipGraph(
            projectId
        );

    const labels =
        new Map(
            [...graph.keys()].map(personId => [
                personId,
                'Relative'
            ])
        );

    if (
        !referencePersonId
        || !graph.has(referencePersonId)
    )
    {
        return labels;
    }

    const paths =
        new Map([
            [
                referencePersonId,
                []
            ]
        ]);

    const queue =
        [referencePersonId];

    for (
        let index = 0;
        index < queue.length;
        index += 1
    )
    {
        const currentPersonId =
            queue[index];

        const currentPath =
            paths.get(currentPersonId)
          || [];

        (
            graph.get(currentPersonId)
          || []
        ).forEach(edge =>
        {
            if (
                paths.has(edge.personId)
            )
            {
                return;
            }

            paths.set(
                edge.personId,
                [
                    ...currentPath,
                    edge
                ]
            );

            queue.push(edge.personId);
        });
    }

    paths.forEach(
        (path, personId) =>
        {
            labels.set(
                personId,
                personRelationshipLabelFromPath(
                    personId,
                    path
                )
            );
        }
    );

    return labels;
}

function personRelationshipLabel(
    personId,
    referencePersonId = ''
)
{
    const person =
        getPerson(personId);

    if (!person)
    {
        return 'Relative';
    }

    const projectId =
        person.projectId
        || currentProjectId();

    const resolvedReferencePersonId =
        referencePersonId
        || treeDefaultPersonId(
            projectId
        );

    return (
        buildPersonRelationshipLabelMap(
            projectId,
            resolvedReferencePersonId
        ).get(personId)
        || 'Relative'
    );
}

function relationshipTypeLabel(type)
{
    const value = String(type || '').trim();
    return value || 'Partner';
}

function relationshipTypeFromLegacy(rel)
{
    if (rel?.relationshipType) return rel.relationshipType;
    const label = String(rel?.label || '').toLowerCase();
    if (label.includes('spouse') || label.includes('married')) return 'Married';
    if (label.includes('former')) return 'Former partner';
    return 'Partner';
}

function relationshipEventByTag(rel, tag)
{
    return (rel?.events || []).find(event => event.gedcomTag === tag) || null;
}

function relationshipHasMeaningfulEvent(event)
{
    const date = normalizeGenealogyDateInput(event?.date || {}, 'Exact date');
    return Boolean(formatGenealogyDateLabel(date) || cleanDatePlaceId(event?.placeId) || cleanEditFieldValue(event?.placeText));
}

function createRelationshipEvent(tag, eventType, values = {})
{
    const date = normalizeGenealogyDateInput(values.date || {}, 'Exact date');
    return {
        id: values.id || `event-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        eventType,
        gedcomTag: tag,
        typeLabel: values.typeLabel || '',
        date,
        placeId: cleanDatePlaceId(values.placeId),
        placeText: values.placeText || '',
        sortDate: date.sortDate || '',
        confidence: values.confidence || ''
    };
}

function getSiblings(personId)
{
    const parentIds = getParents(personId).map(parent => parent.id);
    if (!parentIds.length) return [];
    const siblingIds = new Set();
    parentIds.forEach(parentId => getChildren(parentId).forEach(child =>
    {
        if (child.id !== personId) siblingIds.add(child.id);
    }));
    return Array.from(siblingIds).map(getPerson).filter(Boolean);
}

function getEventsForPerson(personId)
{
    return sampleData.events.filter(event => event.personIds?.includes(personId));
}


