/* Transient object-alignment math shared by the board drag handler and focused test. */
function geneoAlignmentBounds(nodes)
{
    if (!nodes.length) return null;
    return {
        left: Math.min(...nodes.map(node => node.x)),
        top: Math.min(...nodes.map(node => node.y)),
        right: Math.max(...nodes.map(node => node.x + node.width)),
        bottom: Math.max(...nodes.map(node => node.y + node.height))
    };
}

function geneoAlignmentAnchor(rect, axis, kind)
{
    if (axis === 'x')
    {
        if (kind === 'start') return rect.left;
        if (kind === 'center') return (rect.left + rect.right) / 2;
        return rect.right;
    }
    if (kind === 'start') return rect.top;
    if (kind === 'center') return (rect.top + rect.bottom) / 2;
    return rect.bottom;
}

function geneoAlignmentRect(node)
{
    return { left: node.x, top: node.y, right: node.x + node.width, bottom: node.y + node.height };
}

function geneoAlignmentBestMatch(axis, moving, targets, rawDelta, otherDelta, zoom, previous)
{
    const capture = 6 / zoom;
    const release = 10 / zoom;
    const candidates = [];
    const rects = targets.filter(target => target.visible !== false && target.type !== 'drawing')
        .map(target => ({ target, rect: geneoAlignmentRect(target) }));
    for (const { target, rect } of rects)
    {
        for (const anchor of ['start', 'center', 'end'])
        {
            const position = geneoAlignmentAnchor(rect, axis, anchor);
            const offset = position - geneoAlignmentAnchor(moving, axis, anchor) - rawDelta;
            const distance = Math.abs(offset);
            const key = `${target.id}:${anchor}`;
            if (distance <= (key === previous?.key ? release : capture))
                candidates.push({ key, targetId: target.id, anchor, position, offset, distance, rect, kind: 'direct' });
        }
    }
    const people = rects.filter(item => item.target.type === 'person');
    for (let i = 0; i < people.length; i++)
    {
        for (let j = i + 1; j < people.length; j++)
        {
            const pair = [people[i], people[j]].sort((a, b) =>
                geneoAlignmentAnchor(a.rect, axis, 'start') - geneoAlignmentAnchor(b.rect, axis, 'start')
                || String(a.target.id).localeCompare(String(b.target.id)));
            const [first, second] = pair;
            const gapStart = geneoAlignmentAnchor(first.rect, axis, 'end');
            const gapEnd = geneoAlignmentAnchor(second.rect, axis, 'start');
            const movingSize = geneoAlignmentAnchor(moving, axis, 'end') - geneoAlignmentAnchor(moving, axis, 'start');
            if (gapEnd - gapStart < movingSize) continue;
            const otherAxis = axis === 'x' ? 'y' : 'x';
            const overlapStart = Math.max(geneoAlignmentAnchor(first.rect, otherAxis, 'start'), geneoAlignmentAnchor(second.rect, otherAxis, 'start'));
            const overlapEnd = Math.min(geneoAlignmentAnchor(first.rect, otherAxis, 'end'), geneoAlignmentAnchor(second.rect, otherAxis, 'end'));
            const movingOtherCenter = geneoAlignmentAnchor(moving, otherAxis, 'center') + otherDelta;
            if (overlapEnd <= overlapStart || movingOtherCenter < overlapStart || movingOtherCenter > overlapEnd) continue;
            const position = (gapStart + gapEnd) / 2;
            const offset = position - geneoAlignmentAnchor(moving, axis, 'center') - rawDelta;
            const distance = Math.abs(offset);
            const key = `midpoint:${axis}:${first.target.id}:${second.target.id}`;
            if (distance <= (key === previous?.key ? release : capture))
                candidates.push({ key, anchor: 'center', position, offset, distance, kind: 'midpoint',
                    rect: {
                        left: Math.min(first.rect.left, second.rect.left),
                        top: Math.min(first.rect.top, second.rect.top),
                        right: Math.max(first.rect.right, second.rect.right),
                        bottom: Math.max(first.rect.bottom, second.rect.bottom)
                    } });
        }
    }
    const retained = candidates.find(candidate => candidate.key === previous?.key);
    if (retained) return retained;
    candidates.sort((a, b) => a.distance - b.distance
        || (a.kind === 'direct' ? -1 : 1) - (b.kind === 'direct' ? -1 : 1)
        || String(a.targetId || a.key).localeCompare(String(b.targetId || b.key))
        || ['start', 'center', 'end'].indexOf(a.anchor) - ['start', 'center', 'end'].indexOf(b.anchor));
    return candidates[0] || null;
}

function geneoCalculateAlignment({ movingNodes, targets, dx, dy, fallbackDx = dx,
    fallbackDy = dy, zoom = 1, previous = null, lockedAxis = null })
{
    const bounds = geneoAlignmentBounds(movingNodes);
    const empty = { dx: fallbackDx, dy: fallbackDy, matches: { x: null, y: null }, guides: { x: null, y: null } };
    if (!bounds || movingNodes.some(node => node.type === 'drawing')) return empty;
    const movingIds = new Set(movingNodes.map(node => node.id));
    const stationary = targets.filter(target => !movingIds.has(target.id));
    const scale = Math.max(.25, Math.min(2, zoom));
    const x = lockedAxis === 'x' ? null : geneoAlignmentBestMatch('x', bounds, stationary, dx, dy, scale, previous?.x);
    const y = lockedAxis === 'y' ? null : geneoAlignmentBestMatch('y', bounds, stationary, dy, dx, scale, previous?.y);
    const finalDx = x ? dx + x.offset : fallbackDx;
    const finalDy = y ? dy + y.offset : fallbackDy;
    return {
        dx: finalDx, dy: finalDy,
        matches: { x: x ? { key: x.key } : null, y: y ? { key: y.key } : null },
        guides: {
            x: x ? {
                position: x.position,
                start: Math.min(bounds.top + finalDy, x.rect.top),
                end: Math.max(bounds.bottom + finalDy, x.rect.bottom)
            } : null,
            y: y ? {
                position: y.position,
                start: Math.min(bounds.left + finalDx, y.rect.left),
                end: Math.max(bounds.right + finalDx, y.rect.right)
            } : null
        }
    };
}

function geneoLayerRangeIds(displayedIds, anchorId, targetId)
{
    const start = displayedIds.indexOf(anchorId);
    const end = displayedIds.indexOf(targetId);
    if (start < 0 || end < 0) return [targetId];
    return displayedIds.slice(Math.min(start, end), Math.max(start, end) + 1);
}

function geneoAxisLockForMove(current, shiftHeld, dx, dy)
{
    if (!shiftHeld) return null;
    if (current) return current;
    if (Math.max(Math.abs(dx), Math.abs(dy)) <= 1) return null;
    return Math.abs(dx) >= Math.abs(dy) ? 'y' : 'x';
}

if (typeof module !== 'undefined' && module.exports)
    module.exports = { geneoAlignmentBounds, geneoCalculateAlignment, geneoLayerRangeIds, geneoAxisLockForMove };
