function geneoSeedDarkPaintColors(type)
{
    const common = { fill: '#18211F', stroke: '#52615D', text: '#F1F5F3' };
    if (type === 'sticky') return { fill: '#D4AA6B', stroke: '#A77C3F', text: '#241C10' };
    if (type === 'shape') return { fill: '#173029', stroke: '#62D99A', text: common.text };
    if (type === 'drawing') return { ...common, stroke: '#D9E5E1' };
    return common;
}

function geneoMarkSeedThemeProvenance(diagram)
{
    diagram.themeProvenanceVersion = 1;
    const legacyCanvasDefaults = new Set(['#0F1413', '#F3F7F2', geneoDefaultCanvasColor().toUpperCase()]);
    diagram.canvas.backgroundOverride = !legacyCanvasDefaults.has(
        String(diagram.canvas.backgroundPaint?.color || '').toUpperCase()
    );
    diagram.connectionDefaults.lineOverride = diagram.connectionDefaults.line?.color !== '#D9E5E1';
    for (const [gender, appearance] of Object.entries(diagram.cardAppearanceDefaults || {}))
    {
        const dark = {
            neutral: ['#173029', '#62D99A', '#F1F5F3'],
            unknown: ['#173029', '#62D99A', '#F1F5F3'],
            male: ['#172A32', '#5A9BD8', '#F2F8FB'],
            female: ['#2D2437', '#8D6CE8', '#F6F1FB']
        }[gender];
        appearance.paintOverrides = Object.fromEntries(['fill', 'stroke', 'text'].map((key, index) =>
            [key, !dark || appearance[key]?.color !== dark[index]]));
    }
    for (const node of diagram.nodes || [])
    {
        if (node.type === 'person') continue;
        const dark = geneoSeedDarkPaintColors(node.type);
        node.appearance.paintOverrides = Object.fromEntries(['fill', 'stroke', 'text'].map(key =>
            [key, Boolean(node.appearance[key] && node.appearance[key].color !== dark[key])]));
    }
}

function geneoApplyThemeDefaultsToDiagram(diagram)
{
    if (diagram?.themeProvenanceVersion !== 1) return;
    const defaults = createEmptyGeneographDiagram();
    if (!diagram.canvas.backgroundOverride)
        diagram.canvas.backgroundPaint.color = defaults.canvas.backgroundPaint.color;
    for (const [gender, appearance] of Object.entries(diagram.cardAppearanceDefaults || {}))
    {
        const preset = defaults.cardAppearanceDefaults[gender];
        if (!preset) continue;
        for (const key of ['fill', 'stroke', 'text'])
            if (appearance[key] && appearance.paintOverrides?.[key] !== true)
                appearance[key].color = preset[key].color;
    }
    if (diagram.connectionDefaults?.line && diagram.connectionDefaults.lineOverride !== true)
        diagram.connectionDefaults.line.color = defaults.connectionDefaults.line.color;
    for (const node of diagram.nodes || [])
    {
        if (!node.appearance) continue;
        const preset = node.type === 'person'
            ? geneoPersonGenderAppearance(node, diagram)
            : geneoNodeDefaults(node.type).appearance;
        for (const key of ['fill', 'stroke', 'text'])
            if (node.appearance[key] && preset?.[key] && node.appearance.paintOverrides?.[key] !== true)
                node.appearance[key].color = preset[key].color;
    }
}

window.addEventListener('geneograph-theme-change', () =>
{
    for (const board of sampleData.boards || []) geneoApplyThemeDefaultsToDiagram(board.diagram);
    for (const tool of ['drawing', 'shape'])
    {
        const appearance = geneoCreationToolRuntime[tool]?.appearance;
        const preset = geneoNodeDefaults(tool).appearance;
        for (const key of ['fill', 'stroke', 'text'])
            if (appearance?.[key] && appearance.paintOverrides?.[key] !== true)
                appearance[key].color = preset[key].color;
    }
    if (state.activeModule !== 'Geneograph') return;
    if (state.geneoView === 'board')
        renderGeneographEditorPreserveScroll({ preserveInspectorScroll: true, preserveSidebarScroll: true });
    else
        renderGeneographHome();
});
