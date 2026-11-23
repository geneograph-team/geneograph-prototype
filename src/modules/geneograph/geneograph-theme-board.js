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
