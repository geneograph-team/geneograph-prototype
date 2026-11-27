'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const read = file => fs.readFileSync(path.join(__dirname, '../../', file), 'utf8');
const ranges = [
    [
        "src/core/state-tree-core.js",
        "const TREE_PALETTE_DEFAULTS",
        "function normalizeTreePalette"
    ],
    [
        "src/modules/family-tree/tree-branches.js",
        "function treePaletteLinearRgb",
        "function applyTreePalette"
    ],
    [
        "src/modules/geneograph/geneograph-model.js",
        "const geneoSharedPaletteCache",
        "function normalizeGeneoCardAppearances"
    ],
    [
        "src/modules/geneograph/geneograph-model.js",
        "function geneoDefaultCanvasColor",
        "function selectedGeneographDiagram"
    ],
    [
        "src/modules/geneograph/geneograph-editor-core.js",
        "function geneoBoardColorGroups",
        "function normalizeGeneoPaint"
    ],
    [
        "src/modules/geneograph/geneograph-editor-core.js",
        "function geneoHexToRgb",
        "function geneoPaintCssColor"
    ],
    [
        "src/modules/geneograph/geneograph-editor-core.js",
        "function geneoNodeDefaults",
        "function geneoNodeMinimumSize("
    ],
    [
        "src/modules/geneograph/geneograph-sidebar.js",
        "function geneoCompositeRgb",
        "function geneoTextContrastRatio"
    ],
    [
        "src/modules/geneograph/geneograph-theme-board.js",
        "function geneoApplyThemeDefaultsToDiagram",
        "window.addEventListener"
    ]
];
const source = ranges.map(([file, start, end]) =>
{
    const content = read(file), from = content.indexOf(start), to = content.indexOf(end, from + start.length);
    assert.ok(from >= 0 && to >= 0, file + ' ' + start);
    return content.slice(from, to);
}).join('\n');
const context = vm.createContext({ assert });
vm.runInContext("let currentTheme = 'light';\nconst geneoThemeColor = (dark, light) => currentTheme === 'light' ? light : dark;\nconst geneoSemanticColor = token => token === '--tree-canvas-surface' ? geneoThemeColor('#0B0F0E', '#F1F2F3') : '#798A80';\nconst geneoNumber = (value, fallback, min = -Infinity, max = Infinity) => Math.min(max, Math.max(min, Number.isFinite(Number(value)) ? Number(value) : fallback));\nconst normalizeGeneographPersonCardSettings = () => ({});\nconst geneoDefaultConnectionStyle = () => ({ line: { color: '#798A80', opacity: 100, enabled: true } });" + '\n' + source + '\n' + "    for (const theme of ['light', 'dark'])\n    {\n        currentTheme = theme;\n        const defaults = geneoDefaultCardAppearances();\n        for (const category of ['neutral', 'male', 'female', 'unknown'])\n        {\n            const tones = treePaletteTones(TREE_PALETTE_DEFAULTS[theme][category], theme);\n            const appearance = defaults[category];\n            assert.equal(appearance.fill.color, tones.detail.toUpperCase());\n            assert.equal(appearance.stroke.color, tones['detail-outline'].toUpperCase());\n            assert.ok(treePaletteContrast(appearance.fill.color, appearance.text.color) >= 4.5);\n            const diagram = { canvas: { backgroundPaint: { color: geneoDefaultCanvasColor() }, colorPersonCardsByGender: true },\n                people: [{ id: 'p', gender: category }], cardAppearanceDefaults: defaults };\n            const node = { type: 'person', personId: 'p', appearance: { paintOverrides: {} } };\n            if (category === 'neutral') diagram.canvas.colorPersonCardsByGender = false;\n            const visible = geneoResolveVisibleNodeAppearance(node, diagram);\n            assert.equal(visible.fill.color, appearance.fill.color);\n            const tile = geneoPersonAvatarPaint(visible, diagram);\n            assert.equal(tile.fill, tones.avatar);\n            assert.ok(treePaletteContrast(tile.fill, tile.ink) >= 4.5);\n            node.appearance.fill = { color: '#101010', opacity: 100, enabled: true };\n            node.appearance.paintOverrides.fill = true;\n            const custom = geneoResolveVisibleNodeAppearance(node, diagram);\n            assert.equal(custom.fill.color, '#101010');\n            assert.ok(treePaletteContrast(custom.fill.color, custom.text.color) >= 4.5);\n            const customAvatar = geneoPersonAvatarPaint(custom, diagram);\n            assert.ok(treePaletteContrast(customAvatar.fill, customAvatar.ink) >= 4.5);\n            assert.notEqual(customAvatar.fill, custom.fill.color);\n            node.appearance.text = { color: '#121212', opacity: 75, enabled: true };\n            node.appearance.paintOverrides.text = true;\n            assert.deepEqual(geneoResolveVisibleNodeAppearance(node, diagram).text, node.appearance.text);\n            node.appearance.paintOverrides.text = false;\n            defaults[category].text = { color: '#222222', opacity: 80, enabled: true };\n            defaults[category].paintOverrides.text = true;\n            assert.deepEqual(geneoResolveVisibleNodeAppearance(node, diagram).text, defaults[category].text);\n            defaults[category].paintOverrides.text = false;\n            node.appearance.fill.enabled = false;\n            const transparent = geneoResolveVisibleNodeAppearance(node, diagram);\n            assert.equal(transparent.fill.enabled, false);\n            const tile2 = geneoPersonAvatarPaint(transparent, diagram);\n            assert.ok(treePaletteContrast(tile2.fill, tile2.ink) >= 4.5);\n        }\n        const groups = geneoBoardColorGroups();\n        assert.equal(groups[0].items.length, 16);\n        assert.equal(new Set(groups[0].items.map(item => item.color)).size, 16);\n        for (let i = 0; i < 16; i++) assert.equal(groups[0].items[i].color, TREE_PALETTE_DEFAULTS[theme][i+1].toUpperCase());\n        assert.equal(groups[1].items.length, 4);\n        assert.equal(groups[2].items.length, 4);\n        for (const group of groups) for (const item of group.items) assert.match(item.color, /^#[0-9A-F]{6}$/);\n        const shape = geneoNodeDefaults('shape').appearance;\n        const green = geneoSharedPaletteTones('descendants');\n        assert.equal(shape.fill.color, green.detail.toUpperCase());\n        assert.equal(shape.stroke.color, green['detail-outline'].toUpperCase());\n        assert.ok(treePaletteContrast(shape.fill.color, shape.text.color) >= 4.5);\n    }\n    currentTheme = 'light';\n    const diagram = createEmptyGeneographDiagram();\n    diagram.cardAppearanceDefaults.male.fill = { color: '#123456', opacity: 63, enabled: true };\n    diagram.cardAppearanceDefaults.male.paintOverrides.fill = true;\n    diagram.cardAppearanceDefaults.female.stroke.enabled = false;\n    diagram.canvas.backgroundOverride = true;\n    diagram.canvas.backgroundPaint.color = '#121212';\n    const node = { type: 'person', personId: 'p', appearance: { fill: { color: '#987654', opacity: 70, enabled: false }, stroke: { color: '#888888', opacity: 80, enabled: true }, text: { color: '#777777', opacity: 90, enabled: true }, paintOverrides: { fill: true, stroke: false, text: true } } };\n    diagram.people.push({ id: 'p', gender: 'male' });\n    diagram.nodes.push(node);\n    const sticky = geneoNodeDefaults('sticky').appearance;\n    assert.equal(sticky.fill.color, '#FFF2CF');\n    currentTheme = 'dark';\n    geneoApplyThemeDefaultsToDiagram(diagram);\n    assert.equal(diagram.cardAppearanceDefaults.male.fill.color, '#123456');\n    assert.equal(diagram.cardAppearanceDefaults.male.fill.opacity, 63);\n    assert.equal(diagram.cardAppearanceDefaults.female.fill.color, geneoSharedPaletteTones('female').detail.toUpperCase());\n    assert.equal(diagram.cardAppearanceDefaults.female.stroke.enabled, false);\n    assert.equal(diagram.canvas.backgroundPaint.color, '#121212');\n    assert.equal(node.appearance.fill.color, '#987654');\n    assert.equal(node.appearance.fill.enabled, false);\n    assert.equal(node.appearance.text.color, '#777777');\n    assert.equal(node.appearance.stroke.color, geneoSharedPaletteTones('neutral')['detail-outline'].toUpperCase());\n    assert.equal(node.appearance.stroke.opacity, 80);\n    assert.equal(geneoNodeDefaults('sticky').appearance.fill.color, '#D4AA6B');", context);
console.log('Shared board palette, inherited paint contrast, manual swatches and theme overrides passed.');
