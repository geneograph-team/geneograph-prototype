'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const read = file => fs.readFileSync(path.join(__dirname, '../..', file), 'utf8');
const context = vm.createContext({ assert });
const state = read('src/core/state-tree-core.js');
vm.runInContext(state.slice(state.indexOf('const TREE_PALETTE_DEFAULTS'), state.indexOf('function treeDisplaySettings'))
    + read('src/modules/family-tree/tree-branches.js'), context);
vm.runInContext(`
    const defaults = normalizeTreePalette();
    for (const theme of ['light', 'dark'])
    {
        const dark = theme === 'dark';
        const canvas = dark ? '#0b0f0e' : '#f1f2f3';
        const primary = dark ? '#e5e9eb' : '#202729';
        const secondary = dark ? '#b7c1c5' : '#515e63';
        const colors = [...Object.values(defaults[theme]), '#000000', '#ffffff', '#808080'];
        for (const r of ['00', '55', 'aa', 'ff'])
            for (const g of ['00', '55', 'aa', 'ff'])
                for (const b of ['00', '55', 'aa', 'ff'])
                    colors.push('#' + r + g + b);
        for (const color of colors)
        {
            const tones = treePaletteTones(color, theme);
            for (const value of Object.values(tones)) assert.match(value, /^#[0-9a-f]{6}$/i);
            assert.ok(treePaletteContrast(tones.overview, tones.ink) >= 4.5, color + ' label');
            assert.ok(treePaletteContrast(tones.connector, canvas) >= 3, color + ' connector');
            assert.ok(treePaletteContrast(tones.outline, canvas) >= 3, color + ' outline');
            for (const role of ['detail', 'compact', 'actions'])
            {
                assert.ok(treePaletteContrast(tones[role], primary) >= 4.5, color + ' ' + role);
                assert.ok(treePaletteContrast(tones[role], secondary) >= 5, color + ' secondary ' + role);
                const a = treePaletteLab(tones[role]), b = treePaletteLab(primary);
                const hover = treePaletteTone([0, a[1] * .97 + b[1] * .03, a[2] * .97 + b[2] * .03],
                    a[0] * .97 + b[0] * .03, 1, 1);
                assert.ok(treePaletteContrast(hover, secondary) >= 4.5, color + ' hover ' + role);
            }
        }
        for (const color of Object.values(defaults[theme]))
            assert.equal(treePaletteTones(color, theme).overview, color);
    }
    const props = new Map();
    let writes = 0;
    const runtime = { shell: { style: { setProperty(key, value) { writes++; props.set(key, value); } } } };
    applyTreePalette(runtime, defaults);
    assert.equal(writes, 40 * 7);
    applyTreePalette(runtime, defaults);
    assert.equal(writes, 40 * 7);
    const next = normalizeTreePalette({ light: { male: '#ff0000' } });
    applyTreePalette(runtime, next);
    assert.equal(props.get('--tree-palette-light-male-detail'), treePaletteTones('#ff0000', 'light').detail);
    assert.equal(props.get('--tree-palette-light-1-detail'), treePaletteTones(defaults.light['1'], 'light').detail);
`, context);
console.log('Tree palette defaults, bounded custom tones, contrast, hover and palette reuse passed.');
