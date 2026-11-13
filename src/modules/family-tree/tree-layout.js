/*
    * Canonical Family Tree geometry.
    *
    * Layout calculations and CSS variables must derive
    * from this object. Do not repeat these dimensions
    * elsewhere as numeric literals.
    */
const TREE_GEOMETRY = Object.freeze({
    cardWidth: 300,
    cardHeight: 124,
    cardPadding: 10,
    cardContentGap: 10,
    avatarSize: 68,

    get generationPitch()
    {
        return this.cardHeight + this.connectorRailOffset * 2;
    },
    spouseGap: 40,
    siblingGap: 48,
    subtreeGap: 96,

    paddingX: 900,
    paddingY: 500,
    minimumStageWidth: 4040,
    minimumStageHeight: 1800,

    parentPlaceholderHeight: 110,
    parentPlaceholderGap: 48,
    parentPlaceholderVerticalGap: 112,

    connectorRailOffset: 56,
    connectorLaneGap: 16,

    focusControlWidth: 84,
    focusControlHeight: 32,
    focusControlGap: 8
});

/*
    * Compatibility aliases keep the existing layout
    * implementation readable while all values still
    * come from one canonical source.
    */
const {
    cardWidth:
        TREE_CARD_W,

    cardHeight:
        TREE_CARD_H,

    generationPitch:
        TREE_GENERATION_GAP,

    spouseGap:
        TREE_SPOUSE_GAP,

    siblingGap:
        TREE_SIBLING_GAP,

    subtreeGap:
        TREE_SUBTREE_GAP,

    paddingX:
        TREE_PADDING_X,

    paddingY:
        TREE_PADDING_Y,

    minimumStageWidth:
        TREE_MIN_STAGE_W,

    minimumStageHeight:
        TREE_MIN_STAGE_H,

    parentPlaceholderHeight:
        PLACEHOLDER_H,

    parentPlaceholderGap:
        TREE_PARENT_PLACEHOLDER_GAP,

    parentPlaceholderVerticalGap:
        TREE_PARENT_PLACEHOLDER_VERTICAL_GAP,

    connectorRailOffset:
        TREE_CONNECTOR_RAIL_OFFSET,

    focusControlWidth:
        TREE_FOCUS_CONTROL_W,

    focusControlHeight:
        TREE_FOCUS_CONTROL_H,

    focusControlGap:
        TREE_FOCUS_CONTROL_GAP
} = TREE_GEOMETRY;

function treeParentPlaceholderWidth(roleCount)
{
    const count = Math.max(1, Math.min(2, Number(roleCount) || 1));
    return (TREE_CARD_W - (count - 1) * TREE_PARENT_PLACEHOLDER_GAP) / count;
}

function personById(id)
{
    const centralPerson = getPerson(id);
    if (centralPerson) return toTreePerson(centralPerson);
    return currentTreePeople()[0] || null;
}

function layoutFamilyTreeHorizontally({
    positionedPeople,
    parentPlaceholders = [],
    families = [],
    focalPersonId = '',
    focusActionPersonIds = new Set()
} = {})
{
    if (!positionedPeople?.length)
    {
        return;
    }

    const peopleById = new Map(
        positionedPeople.map(person => [
            person.id,
            person
        ])
    );

    const sourceOrderById = new Map(
        positionedPeople.map((person, index) => [
            person.id,
            Number.isFinite(person.sourceIndex)
                ? person.sourceIndex
                : index
        ])
    );

    const familyOrderById = new Map(
        families.map((family, index) => [
            family.id,
            index
        ])
    );

    const parentFamilyByChild = new Map();

    families.forEach(family =>
    {
        (family.children || []).forEach(childId =>
        {
            if (!parentFamilyByChild.has(childId))
            {
                parentFamilyByChild.set(
                    childId,
                    family
                );
            }
        });
    });

    /*
      * Partner-connected people form rigid blocks. Partner
      * distance is resolved inside the block; the layered
      * layout moves the complete block.
      */
    const disjointParent = new Map(
        positionedPeople.map(person => [
            person.id,
            person.id
        ])
    );

    function findRoot(personId)
    {
        const parentId =
            disjointParent.get(personId);

        if (
            !parentId
          || parentId === personId
        )
        {
            return parentId || personId;
        }

        const rootId =
            findRoot(parentId);

        disjointParent.set(
            personId,
            rootId
        );

        return rootId;
    }

    function unionPeople(leftId, rightId)
    {
        const leftRoot =
            findRoot(leftId);

        const rightRoot =
            findRoot(rightId);

        if (
            leftRoot
          && rightRoot
          && leftRoot !== rightRoot
        )
        {
            disjointParent.set(
                rightRoot,
                leftRoot
            );
        }
    }

    families.forEach(family =>
    {
        const left =
            peopleById.get(family.left);

        const right =
            peopleById.get(family.right);

        if (
            left
          && right
          && left.generation
            === right.generation
        )
        {
            unionPeople(
                left.id,
                right.id
            );
        }
    });

    const blocks = [];
    const blockById = new Map();
    const blockByPersonId = new Map();

    positionedPeople.forEach(person =>
    {
        const rootId =
            findRoot(person.id);

        const blockId =
            `people:${rootId}`;

        let block =
            blockById.get(blockId);

        if (!block)
        {
            block = {
                id: blockId,
                generation: person.generation,
                members: [],
                currentCenter: 0,
                width: 0,
                sourceOrder:
              Number.POSITIVE_INFINITY,
                incomingModels: [],
                outgoingModels: [],
                primaryIncomingId: ''
            };

            blockById.set(blockId, block);
            blocks.push(block);
        }

        const member = {
            id: person.id,
            kind: 'person',
            ref: person,
            width: TREE_CARD_W,
            localCenter: 0,
            block
        };

        block.members.push(member);

        block.sourceOrder = Math.min(
            block.sourceOrder,
            sourceOrderById.get(person.id)
            ?? Number.POSITIVE_INFINITY
        );

        blockByPersonId.set(
            person.id,
            block
        );
    });

    /*
      * Attach missing-parent placeholders to the block of
      * their known partner. If neither parent exists, create
      * one placeholder-only parent block.
      */
    const placeholderBlockByChild = new Map();
    const placeholderMembersByChild = new Map();

    parentPlaceholders.forEach(placeholder =>
    {
        const child =
            peopleById.get(placeholder.personId);

        if (!child) return;

        const parentFamily =
            parentFamilyByChild.get(child.id);

        const knownPartnerId =
            placeholder.rel === 'father'
                ? parentFamily?.right
                : parentFamily?.left;

        const knownPartner =
            knownPartnerId
                ? peopleById.get(knownPartnerId)
                : null;

        let block =
            knownPartner
                ? blockByPersonId.get(
                    knownPartner.id
                )
                : placeholderBlockByChild.get(
                    child.id
                );

        if (!block)
        {
            const blockId =
                `missing-parents:${child.id}`;

            block = {
                id: blockId,
                generation: child.generation - 1,
                members: [],
                currentCenter: 0,
                width: 0,
                sourceOrder:
              sourceOrderById.get(child.id)
              ?? Number.POSITIVE_INFINITY,
                incomingModels: [],
                outgoingModels: [],
                primaryIncomingId: ''
            };

            blockById.set(blockId, block);
            blocks.push(block);

            placeholderBlockByChild.set(
                child.id,
                block
            );
        }

        const member = {
            id: placeholder.id,
            kind: 'placeholder',
            role: placeholder.rel,
            childId: child.id,
            ref: placeholder,
            width:
            placeholder.width
            || treeParentPlaceholderWidth(1),
            localCenter: 0,
            block
        };

        block.members.push(member);

        placeholderBlockByChild.set(
            child.id,
            block
        );

        if (
            !placeholderMembersByChild.has(
                child.id
            )
        )
        {
            placeholderMembersByChild.set(
                child.id,
                []
            );
        }

        placeholderMembersByChild
            .get(child.id)
            .push(member);
    });

    const partnershipKey =
        (leftId, rightId) =>
            [leftId, rightId]
                .sort()
                .join('|');

    const partnershipKeys = new Set(
        families
            .filter(family =>
                peopleById.has(family.left)
            && peopleById.has(family.right)
            )
            .map(family =>
                partnershipKey(
                    family.left,
                    family.right
                )
            )
    );

    function gapBetweenMembers(
        leftMember,
        rightMember
    )
    {
        if (
            leftMember.kind === 'person'
          && rightMember.kind === 'person'
          && partnershipKeys.has(
              partnershipKey(
                  leftMember.id,
                  rightMember.id
              )
          )
        )
        {
            return TREE_SPOUSE_GAP;
        }

        if (
            leftMember.kind === 'placeholder'
          || rightMember.kind === 'placeholder'
        )
        {
            return TREE_PARENT_PLACEHOLDER_GAP;
        }

        return TREE_SIBLING_GAP;
    }

    function orderPartnerPath(personMembers)
    {
        if (personMembers.length < 2)
        {
            return personMembers;
        }

        const memberById = new Map(
            personMembers.map(member => [
                member.id,
                member
            ])
        );

        const neighboursById = new Map(
            personMembers.map(member => [
                member.id,
                []
            ])
        );

        families.forEach(family =>
        {
            if (
                memberById.has(family.left)
            && memberById.has(family.right)
            )
            {
                neighboursById
                    .get(family.left)
                    .push(family.right);

                neighboursById
                    .get(family.right)
                    .push(family.left);
            }
        });

        const isPath =
            [...neighboursById.values()]
                .every(neighbours =>
                    neighbours.length <= 2
                );

        if (!isPath)
        {
            return personMembers;
        }

        const endpoints =
            personMembers
                .filter(member =>
                    (
                        neighboursById.get(member.id)
                || []
                    ).length <= 1
                )
                .sort((left, right) =>
                    Number(left.ref.x || 0)
              - Number(right.ref.x || 0)
                );

        if (!endpoints.length)
        {
            return personMembers;
        }

        const ordered = [];
        const visited = new Set();

        let previousId = null;
        let currentId = endpoints[0].id;

        while (
            currentId
          && !visited.has(currentId)
        )
        {
            visited.add(currentId);
            ordered.push(memberById.get(currentId));

            const nextId =
                (
                    neighboursById.get(currentId)
              || []
                ).find(neighbourId =>
                    neighbourId !== previousId
              && !visited.has(neighbourId)
                );

            previousId = currentId;
            currentId = nextId || null;
        }

        return ordered.length
          === personMembers.length
            ? ordered
            : personMembers;
    }

    function orderFamilyBlockMembers(people, fathers, mothers)
    {
        const preferred = [
            ...fathers,
            ...orderPartnerPath(people),
            ...mothers
        ];

        if (!people.length || !(fathers.length + mothers.length))
        {
            return preferred;
        }

        const personMembers = new Map(
            people.map(member => [member.id, member])
        );
        const neighbours = new Map(
            preferred.map(member => [member, new Set()])
        );

        const connect = (left, right) =>
        {
            if (!left || !right || left === right) return;

            neighbours.get(left).add(right);
            neighbours.get(right).add(left);
        };

        families.forEach(family =>
        {
            connect(
                personMembers.get(family.left),
                personMembers.get(family.right)
            );
        });

        [...fathers, ...mothers].forEach(member =>
        {
            const family = parentFamilyByChild.get(member.childId);
            const knownParentId = member.role === 'father'
                ? family?.right
                : family?.left;

            connect(member, personMembers.get(knownParentId));
        });

        // Retain the existing handling for more complex partner networks.
        if ([...neighbours.values()].some(ids => ids.size > 2))
        {
            return preferred;
        }

        const start = preferred.find(member =>
            neighbours.get(member).size === 1
        );

        if (!start) return preferred;

        const ordered = [];
        const visited = new Set();
        let current = start;

        while (current && !visited.has(current))
        {
            visited.add(current);
            ordered.push(current);

            current = [...neighbours.get(current)].find(member =>
                !visited.has(member)
            );
        }

        return ordered.length === preferred.length
            ? ordered
            : preferred;
    }

    /*
      * Establish fixed coordinates inside each rigid block.
      */
    blocks.forEach(block =>
    {
        const people =
            block.members
                .filter(member =>
                    member.kind === 'person'
                )
                .sort((left, right) =>
                    Number(left.ref.x || 0)
              - Number(right.ref.x || 0)
                );

        const fathers =
            block.members
                .filter(member =>
                    member.kind === 'placeholder'
              && member.role === 'father'
                )
                .sort((left, right) =>
                    String(left.id)
                        .localeCompare(String(right.id))
                );

        const mothers =
            block.members
                .filter(member =>
                    member.kind === 'placeholder'
              && member.role === 'mother'
                )
                .sort((left, right) =>
                    String(left.id)
                        .localeCompare(String(right.id))
                );

        block.members = orderFamilyBlockMembers(
            people,
            fathers,
            mothers
        );

        const currentLeft = Math.min(
            ...block.members.map(member =>
                Number(member.ref.x || 0)
            )
        );

        const currentRight = Math.max(
            ...block.members.map(member =>
                Number(member.ref.x || 0)
            + member.width
            )
        );

        block.currentCenter =
            (currentLeft + currentRight) / 2;

        let cursor = 0;

        block.members.forEach(
            (member, index) =>
            {
                if (index)
                {
                    cursor += gapBetweenMembers(
                        block.members[index - 1],
                        member
                    );
                }

                member.localCenter =
                    cursor + member.width / 2;

                cursor += member.width;
            }
        );

        block.width = cursor;

        block.members.forEach(member =>
        {
            member.localCenter -=
                block.width / 2;
        });
    });

    function personMember(personId)
    {
        const block =
            blockByPersonId.get(personId);

        return block?.members.find(member =>
            member.kind === 'person'
          && member.id === personId
        ) || null;
    }

    function uniqueEntries(entries)
    {
        const seen = new Set();

        return entries.filter(entry =>
        {
            const key =
                `${entry.block.id}:${entry.member.id}`;

            if (seen.has(key)) return false;

            seen.add(key);
            return true;
        });
    }

    /*
      * Convert family records into explicit virtual family
      * models. A family model is positioned between its
      * parents and its children during ordering.
      */
    const familyModels = [];
    const placeholderChildrenWithModel =
        new Set();

    families.forEach(family =>
    {
        const visibleChildren =
            (family.children || [])
                .map(childId =>
                    peopleById.get(childId)
                )
                .filter(Boolean);

        const childrenByGeneration = new Map();

        visibleChildren.forEach(child =>
        {
            if (
                !childrenByGeneration.has(
                    child.generation
                )
            )
            {
                childrenByGeneration.set(
                    child.generation,
                    []
                );
            }

            childrenByGeneration
                .get(child.generation)
                .push(child);
        });

        childrenByGeneration.forEach(
            (children, childGeneration) =>
            {
                const parentEntries = [];

                [family.left, family.right]
                    .filter(Boolean)
                    .forEach(parentId =>
                    {
                        const member =
                            personMember(parentId);

                        if (!member) return;

                        parentEntries.push({
                            block: member.block,
                            member
                        });
                    });

                children.forEach(child =>
                {
                    const placeholderMembers =
                        placeholderMembersByChild.get(
                            child.id
                        )
                || [];

                    placeholderMembers.forEach(member =>
                    {
                        parentEntries.push({
                            block: member.block,
                            member
                        });

                        placeholderChildrenWithModel.add(
                            child.id
                        );
                    });
                });

                const childEntries =
                    children
                        .map(child =>
                        {
                            const member =
                                personMember(child.id);

                            return member
                                ? {
                                    block: member.block,
                                    member,
                                    childId: child.id
                                }
                                : null;
                        })
                        .filter(Boolean);

                const normalizedParents =
                    uniqueEntries(parentEntries);

                const normalizedChildren =
                    uniqueEntries(childEntries);

                if (
                    !normalizedParents.length
              || !normalizedChildren.length
                )
                {
                    return;
                }

                const model = {
                    id:
                `family:${family.id}:`
                + `${childGeneration}`,
                    familyId: family.id,
                    order:
                familyOrderById.get(family.id)
                ?? 0,
                    parentGeneration:
                Math.min(
                    ...normalizedParents.map(
                        entry =>
                            entry.block.generation
                    )
                ),
                    childGeneration,
                    parents: normalizedParents,
                    children: normalizedChildren
                };

                familyModels.push(model);
            }
        );
    });

    /*
      * Missing parents may exist before a persistent family
      * record exists. Represent them with a synthetic family.
      */
    placeholderMembersByChild.forEach(
        (placeholderMembers, childId) =>
        {
            if (
                placeholderChildrenWithModel.has(
                    childId
                )
            )
            {
                return;
            }

            const childMember =
                personMember(childId);

            if (!childMember) return;

            const parents =
                uniqueEntries(
                    placeholderMembers.map(member => ({
                        block: member.block,
                        member
                    }))
                );

            if (!parents.length) return;

            familyModels.push({
                id: `missing-family:${childId}`,
                familyId:
              `missing-parents:${childId}`,
                order: -1,
                parentGeneration:
              childMember.block.generation - 1,
                childGeneration:
              childMember.block.generation,
                parents,
                children: [
                    {
                        block: childMember.block,
                        member: childMember,
                        childId
                    }
                ]
            });
        }
    );

    familyModels.forEach(model =>
    {
        const parentBlocks =
            new Set(
                model.parents.map(entry =>
                    entry.block
                )
            );

        const childBlocks =
            new Set(
                model.children.map(entry =>
                    entry.block
                )
            );

        parentBlocks.forEach(block =>
        {
            block.outgoingModels.push(model);
        });

        childBlocks.forEach(block =>
        {
            block.incomingModels.push(model);
        });
    });

    /*
      * Every block chooses a primary incoming family for
      * sibling-contiguity constraints. The focal person’s
      * parent family receives priority for its block.
      */
    blocks.forEach(block =>
    {
        const focalCandidate =
            block.incomingModels.find(model =>
                model.children.some(entry =>
                    entry.childId === focalPersonId
                )
            );

        const primary =
            focalCandidate
          || [...block.incomingModels]
              .sort((left, right) =>
                  left.order - right.order
              || String(left.id)
                  .localeCompare(String(right.id))
              )[0];

        block.primaryIncomingId =
            primary?.id || '';
    });

    const rows = new Map();

    blocks.forEach(block =>
    {
        if (!rows.has(block.generation))
        {
            rows.set(block.generation, []);
        }

        rows.get(block.generation).push(block);
    });

    const generations =
        [...rows.keys()]
            .sort((left, right) =>
                left - right
            );

    rows.forEach(row =>
    {
        row.sort((left, right) =>
            left.currentCenter - right.currentCenter
          || left.sourceOrder - right.sourceOrder
          || String(left.id)
              .localeCompare(String(right.id))
        );
    });

    function median(values)
    {
        const numeric =
            values
                .filter(Number.isFinite)
                .sort((left, right) =>
                    left - right
                );

        if (!numeric.length) return null;

        const middle =
            Math.floor(numeric.length / 2);

        return numeric.length % 2
            ? numeric[middle]
            : (
                numeric[middle - 1]
              + numeric[middle]
            ) / 2;
    }

    function rowOrderIndex()
    {
        const result = new Map();

        rows.forEach(row =>
        {
            row.forEach((block, index) =>
            {
                result.set(block.id, index);
            });
        });

        return result;
    }

    function entryOrderIndex(entry, orderIndex)
    {
        const blockIndex = orderIndex.get(entry.block.id);
        return Number.isFinite(blockIndex)
            ? blockIndex + entry.member.localCenter / entry.block.width
            : null;
    }

    function neighbouringIndexes(
        block,
        direction,
        orderIndex
    )
    {
        const models =
            direction === 'down'
                ? block.incomingModels
                : block.outgoingModels;

        const entries = [];

        models.forEach(model =>
        {
            const neighbours =
                direction === 'down'
                    ? model.parents
                    : model.children;

            neighbours.forEach(entry =>
            {
                const index = entryOrderIndex(entry, orderIndex);

                if (Number.isFinite(index))
                {
                    entries.push(index);
                }
            });
        });

        return entries;
    }

    /*
      * Reorder one generation. Blocks belonging to the same
      * primary sibling group are sorted as one unit and can
      * never be interleaved by an unrelated family.
      */
    function reorderGeneration(
        generation,
        direction
    )
    {
        const row = rows.get(generation);

        if (!row?.length) return;

        const orderIndex =
            rowOrderIndex();

        const previousIndex = new Map(
            row.map((block, index) => [
                block.id,
                index
            ])
        );

        const unitsById = new Map();

        row.forEach(block =>
        {
            const unitId =
                block.primaryIncomingId
                    ? `siblings:${block.primaryIncomingId}`
                    : `single:${block.id}`;

            if (!unitsById.has(unitId))
            {
                unitsById.set(unitId, {
                    id: unitId,
                    blocks: [],
                    target: null,
                    previousIndex:
                previousIndex.get(block.id)
                });
            }

            unitsById
                .get(unitId)
                .blocks
                .push(block);
        });

        const units =
            [...unitsById.values()];

        units.forEach(unit =>
        {
            unit.blocks.sort((left, right) =>
            {
                if (left.primaryIncomingId && left.primaryIncomingId === right.primaryIncomingId)
                {
                    const model = familyModels.find(item => item.id === left.primaryIncomingId);
                    const childOrder = block => model.children.findIndex(entry => entry.block === block);
                    return childOrder(left) - childOrder(right);
                }
                const leftTarget =
                    median(
                        neighbouringIndexes(
                            left,
                            direction,
                            orderIndex
                        )
                    );

                const rightTarget =
                    median(
                        neighbouringIndexes(
                            right,
                            direction,
                            orderIndex
                        )
                    );

                if (
                    leftTarget !== null
              && rightTarget !== null
              && leftTarget !== rightTarget
                )
                {
                    return leftTarget - rightTarget;
                }

                return previousIndex.get(left.id)
              - previousIndex.get(right.id);
            });

            unit.target =
                median(
                    unit.blocks.flatMap(block =>
                        neighbouringIndexes(
                            block,
                            direction,
                            orderIndex
                        )
                    )
                );
        });

        units.sort((left, right) =>
        {
            if (
                left.target !== null
            && right.target !== null
            && left.target !== right.target
            )
            {
                return left.target
              - right.target;
            }

            if (left.target !== null) return -1;
            if (right.target !== null) return 1;

            return left.previousIndex
            - right.previousIndex;
        });

        rows.set(
            generation,
            units.flatMap(unit =>
                unit.blocks
            )
        );
    }

    function crossingScore()
    {
        const orderIndex =
            rowOrderIndex();

        const modelsByBand = new Map();

        familyModels.forEach(model =>
        {
            const key =
                `${model.parentGeneration}:`
            + `${model.childGeneration}`;

            if (!modelsByBand.has(key))
            {
                modelsByBand.set(key, []);
            }

            modelsByBand.get(key).push(model);
        });

        let crossings = 0;
        let span = 0;

        modelsByBand.forEach(models =>
        {
            const virtualFamilies =
                models
                    .map(model =>
                    {
                        const parentIndexes =
                            model.parents
                                .map(entry =>
                                    entryOrderIndex(entry, orderIndex)
                                )
                                .filter(Number.isFinite);

                        const childIndexes =
                            model.children
                                .map(entry =>
                                    entryOrderIndex(entry, orderIndex)
                                )
                                .filter(Number.isFinite);

                        const target =
                            median([
                                ...parentIndexes,
                                ...childIndexes
                            ]);

                        if (childIndexes.length)
                        {
                            span +=
                                Math.max(...childIndexes)
                    - Math.min(...childIndexes);
                        }

                        return {
                            model,
                            parentIndexes,
                            childIndexes,
                            target:
                    target
                    ?? Number.POSITIVE_INFINITY
                        };
                    })
                    .sort((left, right) =>
                        left.target - right.target
                || left.model.order
                  - right.model.order
                || String(left.model.id)
                    .localeCompare(
                        String(right.model.id)
                    )
                    );

            const parentEdges = [];
            const childEdges = [];

            virtualFamilies.forEach(
                (family, familyIndex) =>
                {
                    family.parentIndexes.forEach(
                        parentIndex =>
                        {
                            parentEdges.push({
                                source: parentIndex,
                                target: familyIndex,
                                familyId:
                      family.model.id
                            });
                        }
                    );

                    family.childIndexes.forEach(
                        childIndex =>
                        {
                            childEdges.push({
                                source: familyIndex,
                                target: childIndex,
                                familyId:
                      family.model.id
                            });
                        }
                    );
                }
            );

            function countEdgeCrossings(edges)
            {
                let count = 0;

                for (
                    let leftIndex = 0;
                    leftIndex < edges.length;
                    leftIndex += 1
                )
                {
                    for (
                        let rightIndex =
                            leftIndex + 1;
                        rightIndex < edges.length;
                        rightIndex += 1
                    )
                    {
                        const left =
                            edges[leftIndex];

                        const right =
                            edges[rightIndex];

                        if (
                            left.familyId
                  === right.familyId
                  || left.source
                    === right.source
                  || left.target
                    === right.target
                        )
                        {
                            continue;
                        }

                        if (
                            (
                                left.source
                    - right.source
                            )
                  * (
                      left.target
                    - right.target
                  )
                  < 0
                        )
                        {
                            count += 1;
                        }
                    }
                }

                return count;
            }

            crossings +=
                countEdgeCrossings(parentEdges)
            + countEdgeCrossings(childEdges);
        });

        return {
            crossings,
            span
        };
    }

    let bestScore =
        crossingScore();

    let bestOrder = new Map(
        generations.map(generation => [
            generation,
            rows
                .get(generation)
                .map(block =>
                    block.id
                )
        ])
    );

    const candidateOrders = new Map();
    function rememberOrder()
    {
        const order = new Map(generations.map(generation => [generation, rows.get(generation).map(block => block.id)]));
        candidateOrders.set(JSON.stringify([...order]), order);
    }
    rememberOrder();

    for (
        let sweep = 0;
        sweep < 12;
        sweep += 1
    )
    {
        generations
            .slice(1)
            .forEach(generation =>
            {
                reorderGeneration(
                    generation,
                    'down'
                );
            });

        // Also validate the ordering produced by the downward sweep.
        rememberOrder();

        generations
            .slice(0, -1)
            .reverse()
            .forEach(generation =>
            {
                reorderGeneration(
                    generation,
                    'up'
                );
            });

        const score =
            crossingScore();
        rememberOrder();

        const isBetter =
            score.crossings
            < bestScore.crossings
          || (
              score.crossings
              === bestScore.crossings
            && score.span
              < bestScore.span
          );

        if (isBetter)
        {
            bestScore = score;

            bestOrder = new Map(
                generations.map(generation => [
                    generation,
                    rows
                        .get(generation)
                        .map(block =>
                            block.id
                        )
                ])
            );
        }
    }

    function gapBetweenBlocks(
        leftBlock,
        rightBlock
    )
    {
        const sameSiblingGroup =
            leftBlock.primaryIncomingId
          && leftBlock.primaryIncomingId
            === rightBlock.primaryIncomingId;

        return sameSiblingGroup
            ? TREE_SIBLING_GAP
            : TREE_SUBTREE_GAP
            + 16;
    }

    /*
      * Weighted isotonic compaction. This solves the row’s
      * hard separation constraints without pushing blocks
      * through one another.
      */
    function solveOrderedRow(
        row,
        targetById,
        weightById = new Map()
    )
    {
        if (!row.length)
        {
            return new Map();
        }

        const separation = [0];

        for (
            let index = 1;
            index < row.length;
            index += 1
        )
        {
            separation[index] =
                separation[index - 1]
            + row[index - 1].width / 2
            + gapBetweenBlocks(
                row[index - 1],
                row[index]
            )
            + row[index].width / 2;
        }

        const pools = [];

        row.forEach((block, index) =>
        {
            const targetValue =
                Number(targetById.get(block.id));

            const target =
                (
                    Number.isFinite(targetValue)
                        ? targetValue
                        : block.currentCenter
                )
            - separation[index];

            const weight = Math.max(
                1,
                Number(weightById.get(block.id))
            || 1
            );

            pools.push({
                start: index,
                end: index,
                weight,
                weightedTotal:
              target * weight,
                mean: target
            });

            while (
                pools.length > 1
            && pools[pools.length - 2].mean
              > pools[pools.length - 1].mean
            )
            {
                const right = pools.pop();
                const left = pools.pop();

                const weight =
                    left.weight + right.weight;

                const weightedTotal =
                    left.weightedTotal
              + right.weightedTotal;

                pools.push({
                    start: left.start,
                    end: right.end,
                    weight,
                    weightedTotal,
                    mean:
                weightedTotal / weight
                });
            }
        });

        const result = new Map();

        pools.forEach(pool =>
        {
            for (
                let index = pool.start;
                index <= pool.end;
                index += 1
            )
            {
                result.set(
                    row[index].id,
                    pool.mean
                + separation[index]
                );
            }
        });

        return result;
    }

    const positionByBlockId = new Map();

    function initializePositions()
    {
        positionByBlockId.clear();
        rows.forEach(row =>
        {
            const targets = new Map(row.map(block => [block.id, block.currentCenter]));
            solveOrderedRow(row, targets).forEach((position, blockId) =>
            {
                positionByBlockId.set(blockId, position);
            });
        });
    }

    function entryX(entry)
    {
        const blockCenter =
            positionByBlockId.get(
                entry.block.id
            );

        if (!Number.isFinite(blockCenter))
        {
            return null;
        }

        return blockCenter
          + entry.member.localCenter;
    }

    function familyJunctionX(model)
    {
        const parentXs =
            model.parents
                .map(entryX)
                .filter(Number.isFinite);

        const childXs =
            model.children
                .map(entryX)
                .filter(Number.isFinite);

        const parentCenter =
            median(parentXs);

        const childCenter =
            childXs.length
                ? (
                    Math.min(...childXs)
                + Math.max(...childXs)
                ) / 2
                : null;

        if (
            parentCenter !== null
          && childCenter !== null
        )
        {
            return (
                parentCenter
            + childCenter
            ) / 2;
        }

        return parentCenter
          ?? childCenter;
    }

    /*
    * A family with one child should use a straight vertical
    * connector whenever its parent members belong to one
    * rigid block.
    *
    * Process generations from youngest to oldest. If a child
    * block is moved to align with its own descendants, its
    * parent block will subsequently follow that new position.
    */
    function enforceDirectSingleChildAlignments()
    {
        const eligibleModels =
            familyModels
                .map(model =>
                {
                    if (model.children.length !== 1)
                    {
                        return null;
                    }

                    const parentBlocks =
                        [
                            ...new Set(
                                model.parents.map(entry =>
                                    entry.block
                                )
                            )
                        ];

                    if (parentBlocks.length !== 1)
                    {
                        return null;
                    }

                    const parentBlock =
                        parentBlocks[0];

                    const childEntry =
                        model.children[0];

                    if (
                        !childEntry
              || parentBlock.id
                === childEntry.block.id
                    )
                    {
                        return null;
                    }

                    const parentEntries =
                        model.parents
                            .filter(entry =>
                                entry.block.id
                    === parentBlock.id
                            )
                            .sort((left, right) =>
                            {
                                const leftEdge =
                                    left.member.localCenter
                    - left.member.width / 2;

                                const rightEdge =
                                    right.member.localCenter
                    - right.member.width / 2;

                                return leftEdge - rightEdge;
                            });

                    if (!parentEntries.length)
                    {
                        return null;
                    }

                    const first =
                        parentEntries[0].member;

                    const last =
                        parentEntries[
                            parentEntries.length - 1
                        ].member;

                    /*
            * Match the connector router:
            * - one parent: use its center;
            * - two parents: use the center of the gap
            *   between their inner edges.
            */
                    const sourceOffset =
                        parentEntries.length > 1
                            ? (
                                (
                                    first.localCenter
                      + first.width / 2
                                )
                    + (
                        last.localCenter
                      - last.width / 2
                    )
                            ) / 2
                            : first.localCenter;

                    return {
                        model,
                        parentBlock,
                        childEntry,
                        sourceOffset
                    };
                })
                .filter(Boolean);

        const parentGenerations =
            [
                ...new Set(
                    eligibleModels.map(item =>
                        item.parentBlock.generation
                    )
                )
            ]
                .sort((left, right) =>
                    right - left
                );

        parentGenerations.forEach(generation =>
        {
            const row =
                rows.get(generation);

            if (!row?.length) return;

            const requestsByBlockId =
                new Map();

            eligibleModels
                .filter(item =>
                    item.parentBlock.generation
              === generation
                )
                .forEach(item =>
                {
                    const childBlockCenter =
                        positionByBlockId.get(
                            item.childEntry.block.id
                        );

                    if (
                        !Number.isFinite(
                            childBlockCenter
                        )
                    )
                    {
                        return;
                    }

                    const childConnectionX =
                        childBlockCenter
              + item.childEntry.member
                  .localCenter;

                    const requestedParentCenter =
                        childConnectionX
              - item.sourceOffset;

                    if (
                        !requestsByBlockId.has(
                            item.parentBlock.id
                        )
                    )
                    {
                        requestsByBlockId.set(
                            item.parentBlock.id,
                            []
                        );
                    }

                    requestsByBlockId
                        .get(item.parentBlock.id)
                        .push(requestedParentCenter);
                });

            if (!requestsByBlockId.size)
            {
                return;
            }

            const targets = new Map(
                row.map(block => [
                    block.id,
                    positionByBlockId.get(block.id)
            ?? block.currentCenter
                ])
            );

            const weights = new Map(
                row.map(block => [
                    block.id,
                    1
                ])
            );

            requestsByBlockId.forEach(
                (requestedCenters, blockId) =>
                {
                    targets.set(
                        blockId,
                        median(requestedCenters)
                    );

                    /*
            * This makes direct alignment effectively hard.
            * The row solver moves adjacent blocks when space
            * is required instead of leaving a visible jog.
            */
                    weights.set(
                        blockId,
                        1000000
                * requestedCenters.length
                    );
                }
            );

            solveOrderedRow(
                row,
                targets,
                weights
            ).forEach((position, blockId) =>
            {
                positionByBlockId.set(
                    blockId,
                    position
                );
            });
        });
    }

    /*
      * Alternate top-down and bottom-up passes. Virtual family
      * junctions pull parent and child groups toward a common
      * center, while row separation remains a hard constraint.
      */
    function relaxGeneration(
        generation,
        direction
    )
    {
        const row =
            rows.get(generation);

        if (!row?.length) return;

        const targets = new Map();
        const weights = new Map();

        row.forEach(block =>
        {
            const models =
                direction === 'down'
                    ? block.incomingModels
                    : block.outgoingModels;

            const desiredCenters = [];

            models.forEach(model =>
            {
                const junctionX =
                    familyJunctionX(model);

                if (!Number.isFinite(junctionX))
                {
                    return;
                }

                const entries =
                    direction === 'down'
                        ? model.children
                        : model.parents;

                entries
                    .filter(entry =>
                        entry.block.id === block.id
                    )
                    .forEach(entry =>
                    {
                        desiredCenters.push(
                            junctionX
                  - entry.member.localCenter
                        );
                    });
            });

            const current =
                positionByBlockId.get(block.id)
            ?? block.currentCenter;

            const desired =
                median(desiredCenters);

            targets.set(
                block.id,
                desired === null
                    ? current
                    : current * 0.25
                + desired * 0.75
            );

            weights.set(
                block.id,
                1 + desiredCenters.length
            );
        });

        solveOrderedRow(
            row,
            targets,
            weights
        ).forEach((position, blockId) =>
        {
            positionByBlockId.set(
                blockId,
                position
            );
        });
    }

    function solveCandidate(order)
    {
        order.forEach(
            (ids, generation) =>
            {
                rows.set(
                    generation,
                    ids
                        .map(id =>
                            blockById.get(id)
                        )
                        .filter(Boolean)
                );
            }
        );

        initializePositions();

        for (
            let iteration = 0;
            iteration < 16;
            iteration += 1
        )
        {
            generations
                .slice(1)
                .forEach(generation =>
                {
                    relaxGeneration(
                        generation,
                        'down'
                    );
                });

            generations
                .slice(0, -1)
                .reverse()
                .forEach(generation =>
                {
                    relaxGeneration(
                        generation,
                        'up'
                    );
                });
        }

        enforceDirectSingleChildAlignments();
    }

    // Validate the actual routed geometry, including each partner's attachment,
    // before accepting an ordering produced by the inexpensive crossing heuristic.
    function routedCandidateIssues()
    {
        const clones = new Map();
        blocks.forEach(block => block.members.forEach(member =>
        {
            const x = Math.round(positionByBlockId.get(block.id) + member.localCenter - member.width / 2);
            const height = member.ref.height || member.ref.h;
            clones.set(member.ref, {
                ...member.ref, x, width: member.width, height,
                leftX: x, rightX: x + member.width, centerX: x + member.width / 2,
                topY: member.ref.y, bottomY: member.ref.y + height, centerY: member.ref.y + height / 2
            });
        }));
        const candidatePeople = positionedPeople.map(person => clones.get(person));
        const candidatePlaceholders = parentPlaceholders.map(placeholder => clones.get(placeholder));
        const parentPlaceholdersByPerson = {};
        candidatePlaceholders.forEach(placeholder => (parentPlaceholdersByPerson[placeholder.personId] ||= []).push(placeholder));
        const candidate = {
            positionedPeople: candidatePeople,
            peopleById: Object.fromEntries(candidatePeople.map(person => [person.id, person])),
            parentPlaceholders: candidatePlaceholders, parentPlaceholdersByPerson, families,
            focusControls: candidatePeople.filter(person => focusActionPersonIds.has(person.id)).map(person => ({
                personId: person.id, x: person.rightX - TREE_FOCUS_CONTROL_W,
                y: person.y - TREE_FOCUS_CONTROL_H - TREE_FOCUS_CONTROL_GAP,
                width: TREE_FOCUS_CONTROL_W, height: TREE_FOCUS_CONTROL_H
            }))
        };
        candidate.connectorDescriptors = buildTreeConnectorDescriptors(candidate, { arrangeBands: true });
        return validateTreeLayout(candidate).length;
    }
    solveCandidate(bestOrder);
    let routedIssues = routedCandidateIssues();
    let acceptedPositions = new Map(positionByBlockId);
    if (routedIssues)
    {
        for (const order of candidateOrders.values())
        {
            solveCandidate(order);
            const issues = routedCandidateIssues();
            const displacement = positions => blocks.reduce((sum, block) => sum + Math.abs(positions.get(block.id) - block.currentCenter), 0);
            if (issues < routedIssues || (issues === routedIssues && displacement(positionByBlockId) < displacement(acceptedPositions)))
            {
                routedIssues = issues;
                acceptedPositions = new Map(positionByBlockId);
            }
            if (!routedIssues) break;
        }
    }
    acceptedPositions.forEach((position, id) => positionByBlockId.set(id, position));

    /*
      * Keep the focal person at its original center so adding
      * a relative does not move the complete canvas.
      */
    const focalPerson =
        peopleById.get(focalPersonId);

    const focalBlock =
        blockByPersonId.get(focalPersonId);

    const focalMember =
        personMember(focalPersonId);

    const originalFocalCenter =
        focalPerson
            ? focalPerson.x
            + TREE_CARD_W / 2
            : null;

    const calculatedFocalCenter =
        focalBlock
        && focalMember
            ? positionByBlockId.get(
                focalBlock.id
            )
            + focalMember.localCenter
            : null;

    const globalShift =
        Number.isFinite(originalFocalCenter)
        && Number.isFinite(calculatedFocalCenter)
            ? originalFocalCenter
            - calculatedFocalCenter
            : 0;

    blocks.forEach(block =>
    {
        const blockCenter =
            (
                positionByBlockId.get(block.id)
            ?? block.currentCenter
            )
          + globalShift;

        block.members.forEach(member =>
        {
            member.ref.x = Math.round(
                blockCenter
            + member.localCenter
            - member.width / 2
            );
        });
    });
}

function validateTreeLayout(layout)
{
    const issues = [];

    const rectangles = [
        ...(layout.positionedPeople || [])
            .map(person => ({
                id: `person:${person.id}`,
                left: person.leftX,
                right: person.rightX,
                top: person.topY,
                bottom: person.bottomY
            })),

        ...(layout.parentPlaceholders || [])
            .map(placeholder => ({
                id:
              `placeholder:${placeholder.id}`,
                left: placeholder.leftX,
                right: placeholder.rightX,
                top: placeholder.topY,
                bottom: placeholder.bottomY
            })),
        ...(layout.focusControls || []).map(control => ({
            id: `focus:${control.personId}`,
            left: control.x,
            right: control.x + control.width,
            top: control.y,
            bottom: control.y + control.height
        }))
    ];

    const placeholderGroups = new Map();
    (layout.parentPlaceholders || []).forEach(placeholder =>
    {
        if (!placeholderGroups.has(placeholder.personId)) placeholderGroups.set(placeholder.personId, []);
        placeholderGroups.get(placeholder.personId).push(placeholder);
    });
    placeholderGroups.forEach((group, personId) =>
    {
        const width = Math.max(...group.map(node => node.rightX)) - Math.min(...group.map(node => node.leftX));
        if (width !== TREE_CARD_W || group.some(node => node.width !== treeParentPlaceholderWidth(group.length)))
        {
            issues.push({ type: 'placeholder-width', personId, width, expectedWidth: TREE_CARD_W });
        }
    });
    (layout.connectorBands || []).forEach(band =>
    {
        const rails = band.families.map(family => family.railY);
        if (Math.min(...rails) - band.parentBottomY !== TREE_CONNECTOR_RAIL_OFFSET
          || band.childTopY - Math.max(...rails) !== TREE_CONNECTOR_RAIL_OFFSET)
        {
            issues.push({ type: 'rail-clearance', generation: band.generation, familyIds: band.families.map(family => family.familyId) });
        }
        band.families.forEach(family =>
        {
            if (family.laneConflict || family.railY !== band.parentBottomY + TREE_CONNECTOR_RAIL_OFFSET + family.laneIndex * TREE_GEOMETRY.connectorLaneGap)
            {
                issues.push({ type: 'routing-lane', familyId: family.familyId, lane: family.laneIndex });
            }
            (layout.focusControls || []).forEach(control =>
            {
                const person = layout.peopleById[control.personId];
                if (person?.generation === band.generation && control.y - family.railY < TREE_GEOMETRY.connectorLaneGap)
                {
                    issues.push({ type: 'focus-clearance', familyId: family.familyId, personId: control.personId });
                }
            });
        });
        band.families.forEach((left, index) => band.families.slice(index + 1).forEach(right =>
        {
            if (left.childXs.some(leftX => right.childXs.some(rightX => (left.sourceX - right.sourceX) * (leftX - rightX) < 0)))
            {
                issues.push({ type: 'ancestor-order', leftFamilyId: left.familyId, rightFamilyId: right.familyId });
            }
        }));
    });

    function rectanglesOverlap(left, right)
    {
        return (
            left.left < right.right
          && left.right > right.left
          && left.top < right.bottom
          && left.bottom > right.top
        );
    }

    for (
        let leftIndex = 0;
        leftIndex < rectangles.length;
        leftIndex += 1
    )
    {
        for (
            let rightIndex =
                leftIndex + 1;
            rightIndex < rectangles.length;
            rightIndex += 1
        )
        {
            const left =
                rectangles[leftIndex];

            const right =
                rectangles[rightIndex];

            if (rectanglesOverlap(left, right))
            {
                issues.push({
                    type: 'node-node',
                    leftId: left.id,
                    rightId: right.id
                });
            }
        }
    }

    const segments = [];

    (layout.connectorDescriptors || [])
        .forEach(descriptor =>
        {
            const points =
                descriptor.points || [];

            for (
                let index = 1;
                index < points.length;
                index += 1
            )
            {
                const start =
                    points[index - 1];

                const end =
                    points[index];

                if (
                    start.x === end.x
              && start.y === end.y
                )
                {
                    continue;
                }

                segments.push({
                    familyId:
                String(
                    descriptor.familyId
                  || ''
                ),
                    role: descriptor.role,
                    childId:
                descriptor.childId || '',
                    start,
                    end,
                    horizontal:
                start.y === end.y,
                    vertical:
                start.x === end.x
                });
            }
        });

    function segmentIntersectsRectangle(
        segment,
        rectangle
    )
    {
        if (segment.horizontal)
        {
            const minX = Math.min(
                segment.start.x,
                segment.end.x
            );

            const maxX = Math.max(
                segment.start.x,
                segment.end.x
            );

            return (
                segment.start.y > rectangle.top
            && segment.start.y < rectangle.bottom
            && maxX > rectangle.left
            && minX < rectangle.right
            );
        }

        if (segment.vertical)
        {
            const minY = Math.min(
                segment.start.y,
                segment.end.y
            );

            const maxY = Math.max(
                segment.start.y,
                segment.end.y
            );

            return (
                segment.start.x > rectangle.left
            && segment.start.x < rectangle.right
            && maxY > rectangle.top
            && minY < rectangle.bottom
            );
        }

        return false;
    }

    segments.forEach(segment =>
    {
        rectangles.forEach(rectangle =>
        {
            if (
                segmentIntersectsRectangle(
                    segment,
                    rectangle
                )
            )
            {
                issues.push({
                    type: 'edge-node',
                    familyId: segment.familyId,
                    role: segment.role,
                    nodeId: rectangle.id
                });
            }
        });
    });

    function rangeOverlap(
        leftStart,
        leftEnd,
        rightStart,
        rightEnd
    )
    {
        return (
            Math.min(leftEnd, rightEnd)
          - Math.max(leftStart, rightStart)
        );
    }

    for (
        let leftIndex = 0;
        leftIndex < segments.length;
        leftIndex += 1
    )
    {
        for (
            let rightIndex =
                leftIndex + 1;
            rightIndex < segments.length;
            rightIndex += 1
        )
        {
            const left =
                segments[leftIndex];

            const right =
                segments[rightIndex];

            if (
                left.familyId
            === right.familyId
            )
            {
                continue;
            }

            if (
                left.horizontal
            && right.horizontal
            && left.start.y
              === right.start.y
            )
            {
                const overlap =
                    rangeOverlap(
                        Math.min(
                            left.start.x,
                            left.end.x
                        ),
                        Math.max(
                            left.start.x,
                            left.end.x
                        ),
                        Math.min(
                            right.start.x,
                            right.end.x
                        ),
                        Math.max(
                            right.start.x,
                            right.end.x
                        )
                    );

                if (overlap > 1)
                {
                    issues.push({
                        type: 'edge-overlap',
                        leftFamilyId:
                  left.familyId,
                        rightFamilyId:
                  right.familyId,
                        orientation: 'horizontal'
                    });
                }

                continue;
            }

            if (
                left.vertical
            && right.vertical
            && left.start.x
              === right.start.x
            )
            {
                const overlap =
                    rangeOverlap(
                        Math.min(
                            left.start.y,
                            left.end.y
                        ),
                        Math.max(
                            left.start.y,
                            left.end.y
                        ),
                        Math.min(
                            right.start.y,
                            right.end.y
                        ),
                        Math.max(
                            right.start.y,
                            right.end.y
                        )
                    );

                if (overlap > 1)
                {
                    issues.push({
                        type: 'edge-overlap',
                        leftFamilyId:
                  left.familyId,
                        rightFamilyId:
                  right.familyId,
                        orientation: 'vertical'
                    });
                }

                continue;
            }

            const horizontal =
                left.horizontal
                    ? left
                    : right.horizontal
                        ? right
                        : null;

            const vertical =
                left.vertical
                    ? left
                    : right.vertical
                        ? right
                        : null;

            if (!horizontal || !vertical)
            {
                continue;
            }

            const horizontalMinX = Math.min(
                horizontal.start.x,
                horizontal.end.x
            );

            const horizontalMaxX = Math.max(
                horizontal.start.x,
                horizontal.end.x
            );

            const verticalMinY = Math.min(
                vertical.start.y,
                vertical.end.y
            );

            const verticalMaxY = Math.max(
                vertical.start.y,
                vertical.end.y
            );

            const crosses =
                vertical.start.x
              > horizontalMinX
            && vertical.start.x
              < horizontalMaxX
            && horizontal.start.y
              > verticalMinY
            && horizontal.start.y
              < verticalMaxY;

            if (crosses)
            {
                issues.push({
                    type: 'edge-crossing',
                    leftFamilyId:
                left.familyId,
                    rightFamilyId:
                right.familyId
                });
            }
        }
    }

    return issues;
}

function calculateTreeLayout(people, families, focusPersonId = '', options = {})
{
    const focalPersonId = people.some(person => person.id === focusPersonId)
        ? focusPersonId
        : people[0]?.id || '';
    const branchRoles = options.branchRoles || {};
    const peopleByRawId = new Map(people.map((person, index) => [person.id, { ...person, sourceIndex: index }]));

    // --- Indexes ---
    const parentFamilyByChild = new Map(); // childId -> family (first parent-child family found)
    const childFamiliesByParent = new Map(); // parentId -> [family]
    families.forEach(family =>
    {
        [family.left, family.right].filter(Boolean).forEach(pid =>
        {
            if (!childFamiliesByParent.has(pid)) childFamiliesByParent.set(pid, []);
            childFamiliesByParent.get(pid).push(family);
        });
        (family.children || []).forEach(cid =>
        {
            if (!parentFamilyByChild.has(cid)) parentFamilyByChild.set(cid, family);
        });
    });

    const layoutFamilyForPerson = personId =>
    {
        const personFamilies = childFamiliesByParent.get(personId) || [];
        return personFamilies.find(family => (family.children || []).length)
          || personFamilies.find(family =>
              [family.left, family.right]
                  .some(id => id && id !== personId && peopleByRawId.has(id))
          )
          || null;
    };

    // --- Generation assignment around the active focus person ---
    const generationByPerson = new Map();
    const visitGenQueue = [];
    const seedGen = (id, gen) =>
    {
        if (!peopleByRawId.has(id)) return;
        if (generationByPerson.has(id)) return;
        generationByPerson.set(id, gen);
        visitGenQueue.push(id);
    };
    seedGen(focalPersonId, 0);
    while (visitGenQueue.length)
    {
        const id = visitGenQueue.shift();
        const gen = generationByPerson.get(id);
        const parentFam = parentFamilyByChild.get(id);
        if (parentFam)
        {
            if (parentFam.left) seedGen(parentFam.left, gen - 1);
            if (parentFam.right) seedGen(parentFam.right, gen - 1);
        }
        (childFamiliesByParent.get(id) || []).forEach(fam =>
        {
            [fam.left, fam.right].filter(x => x && x !== id).forEach(pid => seedGen(pid, gen));
            (fam.children || []).forEach(cid => seedGen(cid, gen + 1));
        });
    }
    people.forEach(p =>
    {
        if (!generationByPerson.has(p.id)) generationByPerson.set(p.id, 0);
    });
    const minGen = Math.min(0, ...generationByPerson.values());
    generationByPerson.forEach((v, k) => generationByPerson.set(k, v - minGen));

    // --- Placeholders ---
    const missingParentRoles = personId =>
    {
        if (!branchRoles.placeholderPersonIds?.has(personId)) return [];
        const canonicalPresence = branchRoles.parentPresenceByPerson?.get(personId);
        if (canonicalPresence)
        {
            const missing = [];
            if (!canonicalPresence.father) missing.push('father');
            if (!canonicalPresence.mother) missing.push('mother');
            return missing;
        }
        const fam = parentFamilyByChild.get(personId);
        const missing = [];
        if (!fam) return ['father', 'mother'];
        if (!fam.left) missing.push('father');
        if (!fam.right) missing.push('mother');
        return missing;
    };
    const parentPlaceholderWidth = pid =>
    {
        const c = missingParentRoles(pid).length;
        if (!c) return 0;
        return TREE_CARD_W;
    };
    const personSlotWidth = pid => Math.max(TREE_CARD_W, parentPlaceholderWidth(pid));

    // --- Ancestor half-widths (Reingold-Tilford-style): for a person, how far its
    // ancestor block extends to the left and right of the person's card center.
    // This lets us keep left-side ancestors on the left and right-side on the right
    // so branches never cross.
    const ancestorHalvesMemo = new Map();
    function ancestorHalves(personId)
    {
        if (ancestorHalvesMemo.has(personId)) return ancestorHalvesMemo.get(personId);
        const selfHalf = personSlotWidth(personId) / 2;
        // Cycle guard
        ancestorHalvesMemo.set(personId, { left: selfHalf, right: selfHalf });
        const fam = parentFamilyByChild.get(personId);
        if (!fam)
        {
            const result = { left: selfHalf, right: selfHalf };
            ancestorHalvesMemo.set(personId, result);
            return result;
        }
        const fatherId = fam.left && peopleByRawId.has(fam.left) ? fam.left : null;
        const motherId = fam.right && peopleByRawId.has(fam.right) ? fam.right : null;
        const placeholderHalf = treeParentPlaceholderWidth(missingParentRoles(personId).length) / 2;
        const fH = fatherId ? ancestorHalves(fatherId) : { left: placeholderHalf, right: placeholderHalf };
        const mH = motherId ? ancestorHalves(motherId) : { left: placeholderHalf, right: placeholderHalf };
        // Distance between father and mother card centers must fit both their inner ancestor extents
        const dist = Math.max(
            TREE_CARD_W + TREE_SPOUSE_GAP,
            fH.right + TREE_SPOUSE_GAP + mH.left
        );
        // person is centered between father and mother
        const left = Math.max(selfHalf, dist / 2 + fH.left);
        const right = Math.max(selfHalf, dist / 2 + mH.right);
        const result = { left, right, dist, fH, mH, fatherId, motherId, fam };
        ancestorHalvesMemo.set(personId, result);
        return result;
    }

    function descendantRowUnit(personId)
    {
        const childFam = layoutFamilyForPerson(personId);
        const spouseId = childFam
            ? (childFam.left === personId ? childFam.right : childFam.left)
            : null;
        const hasSpouse = Boolean(spouseId && peopleByRawId.has(spouseId));
        if (!hasSpouse)
        {
            return { width: TREE_CARD_W, personCenterOffset: TREE_CARD_W / 2 };
        }
        const spouseIsLeft = childFam.right === personId;
        return {
            width: TREE_CARD_W * 2 + TREE_SPOUSE_GAP,
            personCenterOffset: spouseIsLeft
                ? TREE_CARD_W + TREE_SPOUSE_GAP + TREE_CARD_W / 2
                : TREE_CARD_W / 2
        };
    }

    // --- Placement ---
    const positionedById = new Map();
    const familyAnchors = {};
    const placedIds = new Set();
    const anyGen0Missing = people.some(p => (generationByPerson.get(p.id) ?? 0) === 0 && missingParentRoles(p.id).length);
    const topOffset = anyGen0Missing ? PLACEHOLDER_H + TREE_PARENT_PLACEHOLDER_VERTICAL_GAP : 0;
    const generationY = gen => TREE_PADDING_Y + topOffset + gen * TREE_GENERATION_GAP;

    function placePerson(personId, centerX, gen)
    {
        if (placedIds.has(personId)) return;
        const person = peopleByRawId.get(personId);
        if (!person) return;
        placedIds.add(personId);
        const y = generationY(gen);
        const x = Math.round(centerX - TREE_CARD_W / 2);
        positionedById.set(personId, { ...person, x, y, w: TREE_CARD_W, h: TREE_CARD_H, generation: gen });
    }

    // Keep each ancestor couple compact and expand its two branches outward.
    // A column pair lets a parent couple line up with the household directly below.
    function placeAncestors(personId, centerX, gen, branchSide = 'center', columns = null)
    {
        const h = ancestorHalves(personId);
        if (!h.fam) return;
        const parentGen = gen - 1;
        const compactDistance = TREE_CARD_W + TREE_SPOUSE_GAP;
        let fatherCenter;
        let motherCenter;
        if (columns)
        {
            fatherCenter = columns.left;
            motherCenter = columns.right;
        }
        else if (branchSide === 'left')
        {
            fatherCenter = centerX - compactDistance;
            motherCenter = centerX;
        }
        else if (branchSide === 'right')
        {
            fatherCenter = centerX;
            motherCenter = centerX + compactDistance;
        }
        else
        {
            fatherCenter = centerX - compactDistance / 2;
            motherCenter = centerX + compactDistance / 2;
        }
        if (h.fatherId && !placedIds.has(h.fatherId))
        {
            placePerson(h.fatherId, fatherCenter, parentGen);
            placeAncestors(h.fatherId, fatherCenter, parentGen, 'left');
        }
        if (h.motherId && !placedIds.has(h.motherId))
        {
            placePerson(h.motherId, motherCenter, parentGen);
            placeAncestors(h.motherId, motherCenter, parentGen, 'right');
        }
        familyAnchors[h.fam.id] = familyAnchors[h.fam.id] || { family: h.fam, generation: parentGen };
    }

    function placeAncestorsSpread(personId, centerX, gen)
    {
        const h = ancestorHalves(personId);
        if (!h.fam) return;
        const parentGen = gen - 1;
        const compactDistance = TREE_CARD_W + TREE_SPOUSE_GAP;
        const requiredDistance = Math.max(compactDistance, h.dist || compactDistance);
        const branchOffset = Math.max(0, requiredDistance - compactDistance) / 2;
        const fatherCenter = centerX - compactDistance / 2;
        const motherCenter = centerX + compactDistance / 2;
        if (h.fatherId && !placedIds.has(h.fatherId))
        {
            placePerson(h.fatherId, fatherCenter, parentGen);
            placeAncestorsSpread(h.fatherId, fatherCenter - branchOffset, parentGen);
        }
        if (h.motherId && !placedIds.has(h.motherId))
        {
            placePerson(h.motherId, motherCenter, parentGen);
            placeAncestorsSpread(h.motherId, motherCenter + branchOffset, parentGen);
        }
        familyAnchors[h.fam.id] = familyAnchors[h.fam.id] || { family: h.fam, generation: parentGen };
    }

    function placeDescendants(personId, centerX, gen, options = {})
    {
        const childFam = layoutFamilyForPerson(personId);
        if (!childFam)
        {
            if (!options.skipAncestors) placeAncestors(personId, centerX, gen);
            return;
        }
        const spouseId = childFam.left === personId ? childFam.right : childFam.left;
        let pairCenter = centerX;
        if (spouseId && peopleByRawId.has(spouseId))
        {
            const spouseIsLeft = childFam.right === personId;
            const pairDist = TREE_CARD_W + TREE_SPOUSE_GAP;
            const spouseCenter = spouseIsLeft ? centerX - pairDist : centerX + pairDist;
            if (!placedIds.has(spouseId))
            {
                placePerson(spouseId, spouseCenter, gen);
            }
            if (!options.skipAncestors)
            {
                const leftColumn = Math.min(centerX, spouseCenter);
                const rightColumn = Math.max(centerX, spouseCenter);
                placeAncestors(personId, centerX, gen, 'center', { left: leftColumn, right: rightColumn });
                placeAncestors(spouseId, spouseCenter, gen, spouseIsLeft ? 'left' : 'right');
            }
            pairCenter = (centerX + spouseCenter) / 2;
        }
        else if (!options.skipAncestors)
        {
            placeAncestors(personId, centerX, gen);
        }
        familyAnchors[childFam.id] = familyAnchors[childFam.id] || { family: childFam, generation: gen };
        const children = (childFam.children || []).filter(cid => peopleByRawId.has(cid));
        if (!children.length) return;
        const units = children.map(cid => ({ id: cid, ...descendantRowUnit(cid) }));
        const totalW = units.reduce((sum, unit) => sum + unit.width, 0)
          + Math.max(0, children.length - 1) * TREE_SIBLING_GAP;
        let cursor = pairCenter - totalW / 2;
        units.forEach(unit =>
        {
            const childCenter = cursor + unit.personCenterOffset;
            placePerson(unit.id, childCenter, gen + 1);
            placeDescendants(unit.id, childCenter, gen + 1);
            cursor += unit.width + TREE_SIBLING_GAP;
        });
    }

    function placeFocusedSiblingRow(personId, familyCenterX, gen)
    {
        const parentFamily = parentFamilyByChild.get(personId);
        const siblings = (parentFamily?.children || []).filter(id => peopleByRawId.has(id));
        if (siblings.length < 2) return false;
        const units = siblings.map(id => ({ id, ...descendantRowUnit(id) }));
        const totalW = units.reduce((sum, unit) => sum + unit.width, 0)
          + Math.max(0, units.length - 1) * TREE_SIBLING_GAP;
        let cursor = familyCenterX - totalW / 2;
        units.forEach(unit =>
        {
            const siblingCenter = cursor + unit.personCenterOffset;
            placePerson(unit.id, siblingCenter, gen);
            placeDescendants(unit.id, siblingCenter, gen, { skipAncestors: true });
            cursor += unit.width + TREE_SIBLING_GAP;
        });
        placeAncestorsSpread(personId, familyCenterX, gen);
        return true;
    }

    // Layout starts from the active focus person.
    const focalId = focalPersonId;
    if (focalId)
    {
        const focalGen = generationByPerson.get(focalId) ?? 0;
        // Enough left padding for focal's ancestor block
        const focalH = ancestorHalves(focalId);
        const focalX = TREE_PADDING_X + Math.max(focalH.left, TREE_CARD_W / 2);
        if (!placeFocusedSiblingRow(focalId, focalX, focalGen))
        {
            placePerson(focalId, focalX, focalGen);
            placeDescendants(focalId, focalX, focalGen);
        }
    }

    // Fallback: any unplaced person to the right, grouped by generation
    const unplacedByGen = new Map();
    people.forEach(p =>
    {
        if (placedIds.has(p.id)) return;
        const g = generationByPerson.get(p.id) ?? 0;
        if (!unplacedByGen.has(g)) unplacedByGen.set(g, []);
        unplacedByGen.get(g).push(p.id);
    });
    if (unplacedByGen.size)
    {
        let mx = TREE_PADDING_X;
        positionedById.forEach(p =>
        {
            if (p.x + p.w > mx) mx = p.x + p.w;
        });
        let cursor = mx + TREE_SUBTREE_GAP;
        unplacedByGen.forEach((ids, g) =>
        {
            ids.forEach(id =>
            {
                placePerson(id, cursor + TREE_CARD_W / 2, g);
                cursor += TREE_CARD_W + TREE_SIBLING_GAP;
            });
        });
    }

    const positionedPeople = people.map(p => positionedById.get(p.id)).filter(Boolean);

    // Build parent placeholders (in parent row above each child)
    const parentPlaceholders = [];
    positionedPeople.forEach(person =>
    {
        const roles = missingParentRoles(person.id);
        if (!roles.length) return;
        const placeholderWidth = treeParentPlaceholderWidth(roles.length);
        const placeholderHeight = roles.length === 1 ? TREE_CARD_H : PLACEHOLDER_H;
        const blockWidth = roles.length * placeholderWidth + Math.max(0, roles.length - 1) * TREE_PARENT_PLACEHOLDER_GAP;
        const startX = Math.round(person.x + TREE_CARD_W / 2 - blockWidth / 2);
        const py = person.generation > 0 ? generationY(person.generation - 1) : (person.y - TREE_PARENT_PLACEHOLDER_VERTICAL_GAP - placeholderHeight);
        roles.forEach((role, i) =>
        {
            const x = startX + i * (placeholderWidth + TREE_PARENT_PLACEHOLDER_GAP);
            parentPlaceholders.push({
                id: `${person.id}-${role}-placeholder`, personId: person.id, rel: role,
                label: role === 'father' ? 'Add father' : 'Add mother',
                x, y: py, width: placeholderWidth, height: placeholderHeight, generation: person.generation - 1,
                leftX: x, rightX: x + placeholderWidth, topY: py, bottomY: py + placeholderHeight,
                centerX: x + placeholderWidth / 2, centerY: py + placeholderHeight / 2
            });
        });
    });

    // A known parent and its missing partner are one visual family unit. Position
    // that placeholder beside the known parent before collision resolution so the
    // partner line can never span unrelated cards in the row.
    const initialPeopleById = new Map(positionedPeople.map(person => [person.id, person]));
    parentPlaceholders.forEach(placeholder =>
    {
        const parentFamily = parentFamilyByChild.get(placeholder.personId);
        if (!parentFamily) return;
        const father = parentFamily.left ? initialPeopleById.get(parentFamily.left) : null;
        const mother = parentFamily.right ? initialPeopleById.get(parentFamily.right) : null;
        if (placeholder.rel === 'father' && !father && mother)
        {
            placeholder.x = mother.x - TREE_PARENT_PLACEHOLDER_GAP - placeholder.width;
        }
        if (placeholder.rel === 'mother' && !mother && father)
        {
            placeholder.x = father.x + TREE_CARD_W + TREE_PARENT_PLACEHOLDER_GAP;
        }
    });

    /*
      * Reorder family blocks, reduce relationship crossings,
      * and solve horizontal coordinates with hard non-overlap
      * constraints. Vertical positions are unchanged.
      */
    layoutFamilyTreeHorizontally({
        positionedPeople,
        parentPlaceholders,
        families,
        focalPersonId,
        focusActionPersonIds: branchRoles.focusActionPersonIds
    });

    // Recompute geometry
    positionedPeople.forEach(person =>
    {
        person.width = TREE_CARD_W;
        person.height = TREE_CARD_H;
        person.leftX = person.x;
        person.rightX = person.x + TREE_CARD_W;
        person.topY = person.y;
        person.bottomY = person.y + TREE_CARD_H;
        person.centerX = person.x + TREE_CARD_W / 2;
        person.centerY = person.y + TREE_CARD_H / 2;
        person.layoutX = person.x;
        person.layoutY = person.y;
        person.missingParentRoles = missingParentRoles(person.id);
        person.isTopGeneration = person.generation === 0 || Boolean(person.missingParentRoles.length);
    });
    parentPlaceholders.forEach(pl =>
    {
        pl.leftX = pl.x; pl.rightX = pl.x + pl.width;
        pl.topY = pl.y; pl.bottomY = pl.y + pl.height;
        pl.centerX = pl.x + pl.width / 2; pl.centerY = pl.y + pl.height / 2;
    });

    const focusControls = positionedPeople
        .filter(person => branchRoles.focusActionPersonIds?.has(person.id))
        .map(person => ({
            personId: person.id,
            x: Math.round(person.rightX - TREE_FOCUS_CONTROL_W),
            y: Math.round(person.topY - TREE_FOCUS_CONTROL_H - TREE_FOCUS_CONTROL_GAP),
            width: TREE_FOCUS_CONTROL_W,
            height: TREE_FOCUS_CONTROL_H
        }));

    refreshTreeFamilyAnchors(families, positionedById, familyAnchors);

    const parentPlaceholdersByPerson = {};
    parentPlaceholders.forEach(pl =>
    {
        if (!parentPlaceholdersByPerson[pl.personId]) parentPlaceholdersByPerson[pl.personId] = [];
        parentPlaceholdersByPerson[pl.personId].push(pl);
    });

    const connectorLayout = {
        positionedPeople,
        peopleById: Object.fromEntries(positionedPeople.map(person => [person.id, person])),
        families,
        parentPlaceholders,
        parentPlaceholdersByPerson,
        focusControls
    };
    buildTreeConnectorDescriptors(connectorLayout, { arrangeBands: true });
    refreshTreeFamilyAnchors(families, positionedById, familyAnchors);

    const focusControlLayoutNodes = focusControls.map(control => ({
        control,
        get leftX()
        {
            return this.control.x;
        },
        get rightX()
        {
            return this.control.x + this.control.width;
        },
        get topY()
        {
            return this.control.y;
        },
        get bottomY()
        {
            return this.control.y + this.control.height;
        }
    }));
    const layoutNodes = [...positionedPeople, ...parentPlaceholders, ...focusControlLayoutNodes];
    const leftEdge = Math.min(TREE_PADDING_X, ...layoutNodes.map(n => n.leftX ?? n.x));
    // If any node is negative, shift everything right
    if (leftEdge < TREE_PADDING_X)
    {
        const shift = TREE_PADDING_X - leftEdge;
        positionedPeople.forEach(p =>
        {
            p.x += shift; p.leftX = p.x; p.rightX = p.x + p.w;
            p.centerX = p.x + p.w / 2; p.layoutX = p.x;
        });
        parentPlaceholders.forEach(pl =>
        {
            pl.x += shift; pl.leftX = pl.x; pl.rightX = pl.x + pl.width; pl.centerX = pl.x + pl.width / 2;
        });
        focusControls.forEach(control =>
        {
            control.x += shift;
        });
        refreshTreeFamilyAnchors(families, positionedById, familyAnchors);
    }
    const rightEdge = Math.max(TREE_MIN_STAGE_W - TREE_PADDING_X, ...layoutNodes.map(n => n.rightX ?? n.x + n.width));
    const bottomEdge = Math.max(
        TREE_MIN_STAGE_H - TREE_PADDING_Y,
        ...layoutNodes.map(node => node.bottomY ?? node.y + node.height)
    );
    const stageWidth = Math.ceil(rightEdge + TREE_PADDING_X);
    const stageHeight = Math.ceil(bottomEdge + TREE_PADDING_Y);
    const peopleById = Object.fromEntries(positionedPeople.map(p => [p.id, p]));
    const positionedLayoutById = new Map(positionedPeople.map(p => [p.id, p]));

    const layout = { positionedPeople, positionedById: positionedLayoutById, peopleById, families, familyAnchors, parentPlaceholders, parentPlaceholdersByPerson, focusControls, stageWidth, stageHeight };
    layout.connectorDescriptors =
        buildTreeConnectorDescriptors(layout);

    const treeLayoutIssues =
        validateTreeLayout(layout);

    if (treeLayoutIssues.length)
    {
        console.warn(
            '[Family Tree layout] Geometry issues detected',
            treeLayoutIssues
        );
    }
    return layout;
}

function refreshTreeFamilyAnchors(families, positionedById, familyAnchors)
{
    families.forEach(family =>
    {
        const parents = [family.left, family.right].map(id => positionedById.get(id)).filter(Boolean).sort((a, b) => a.x - b.x);
        if (!parents.length) return;
        const first = parents[0];
        const last = parents[parents.length - 1];
        const anchorX = parents.length > 1 ? Math.round(((first.x + first.w) + last.x) / 2) : Math.round(first.x + first.w / 2);
        const anchorY = Math.round(Math.max(...parents.map(parent => parent.y + parent.h)));
        const existing = familyAnchors[family.id] || {};
        familyAnchors[family.id] = { ...existing, x: anchorX, y: anchorY, family };
    });
}

