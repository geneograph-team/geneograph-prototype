function centralFamilyRecords()
{
    return sampleData.families;
}

function familyPartnerAId(family)
{
    return family?.partnerAId || '';
}

function familyPartnerBId(family)
{
    return family?.partnerBId || '';
}

function familyPartnerRole(family, personId)
{
    if (!family || !personId) return '';
    const partnerA = familyPartnerAId(family);
    const partnerB = familyPartnerBId(family);
    const hint = partnerA === personId
        ? family.partnerARoleHint || ''
        : partnerB === personId
            ? family.partnerBRoleHint || ''
            : '';
    if (hint === 'HUSB') return 'father';
    if (hint === 'WIFE') return 'mother';
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
    let fatherId = familyFatherId(family);
    let motherId = familyMotherId(family);
    const ids = [rawA, rawB].filter(Boolean);

    // The layout has two slots. Keep both recorded parents even when their
    // roles are identical or unspecified.
    const unplaced = ids.filter(id => id !== fatherId && id !== motherId);
    if (!fatherId) fatherId = unplaced.shift();
    if (!motherId) motherId = unplaced.shift();

    return { fatherId: fatherId || '', motherId: motherId || '' };
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
    'Guardian',
    'Unknown parentage'
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
        : 'Unknown parentage';
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
    return rel?.type === 'family';
}

function relationshipPartnerAId(rel)
{
    return rel?.partnerAId || '';
}

function relationshipPartnerBId(rel)
{
    return rel?.partnerBId || '';
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
                        ...(family.childIds || [])
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
        familyRelationshipType(
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

function familyRelationshipType(family)
{
    return family?.relationshipType || 'Unknown relationship';
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
        address: values.address || '',
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


