/* Board shadow inheritance and effective object shadows. */
function geneoShadowOverride(value)
{
    return typeof value === 'boolean' ? value : null;
}

function geneoDefaultShadowForNode(node, fill)
{
    if (node?.type === 'sticky')
        return fill?.enabled !== false && Number(fill?.opacity ?? 100) > 0;
    return ['person', 'image', 'panel', 'place'].includes(node?.type);
}

function geneoEffectiveNodeShadow(node, diagram, fill = node?.appearance?.fill)
{
    const override = geneoShadowOverride(node?.appearance?.shadowEnabled);
    if (override !== null) return override;
    return diagram?.canvas?.shadowEnabled !== false && geneoDefaultShadowForNode(node, fill);
}

function geneoSharedNodeShadow(nodes, diagram, fillForNode = node => node.appearance?.fill)
{
    if (!nodes.length) return null;
    const values = nodes.map(node => geneoEffectiveNodeShadow(node, diagram, fillForNode(node)));
    return values.every(value => value === values[0]) ? values[0] : null;
}

if (typeof module !== 'undefined' && module.exports)
    module.exports = { geneoShadowOverride, geneoDefaultShadowForNode, geneoEffectiveNodeShadow, geneoSharedNodeShadow };
