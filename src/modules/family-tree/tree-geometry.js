const TREE_GEOMETRY = Object.freeze({
    cardWidth: 300,
    cardHeight: 124,
    cardPadding: 10,
    cardContentGap: 10,
    avatarSize: 68,
    partnerGap: 40,
    partnerDashLength: 10,
    partnerDashGap: 8,
    connectorLaneGap: 16,
    focusControlWidth: 84,
    focusControlHeight: 32,
    focusControlGap: 8
});

const {
    cardWidth: TREE_CARD_W,
    cardHeight: TREE_CARD_H,
    focusControlWidth: TREE_FOCUS_CONTROL_W,
    focusControlHeight: TREE_FOCUS_CONTROL_H,
    focusControlGap: TREE_FOCUS_CONTROL_GAP
} = TREE_GEOMETRY;

function treeParentPlaceholderWidth(roleCount, direction = 'DOWN')
{
    if (direction === 'RIGHT') return TREE_CARD_W;
    const count = Math.max(1, Math.min(2, Number(roleCount) || 1));
    return (TREE_CARD_W - (count - 1) * TREE_GEOMETRY.partnerGap) / count;
}
