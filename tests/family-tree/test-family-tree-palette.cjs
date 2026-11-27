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
        const primary = dark ? '#14221c' : '#202729';
        const secondary = dark ? '#26352d' : '#515e63';
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
            assert.ok(treePaletteContrast(tones.avatar, primary) >= 4.5, color + ' avatar initials');
            // Avatar background is decorative, not a separate control; a
            // perceptible tonal step is sufficient while the ink meets AA.
            assert.ok(treePaletteContrast(tones.detail, tones.avatar) >= 1.5, color + ' avatar separation');
            for (const role of ['detail', 'compact', 'actions'])
            {
                assert.ok(treePaletteContrast(tones[role], primary) >= 4.5, color + ' ' + role);
                if (dark)
                {
                    assert.ok(treePaletteContrast(tones[role], canvas) >= 3, color + ' luminous card boundary');
                    assert.ok(treePaletteContrast(tones[role], tones['detail-outline']) >= 3, color + ' detailed outline');
                    assert.ok(treePaletteLab(tones[role])[0] >= 0.73, color + ' luminous lightness');
                }
                assert.ok(treePaletteContrast(tones[role], secondary) >= 5, color + ' secondary ' + role);
                const a = treePaletteLab(tones[role]), b = treePaletteLab(primary);
                const hover = treePaletteTone([0, a[1] * .97 + b[1] * .03, a[2] * .97 + b[2] * .03],
                    a[0] * .97 + b[0] * .03, 1, 1);
                assert.ok(treePaletteContrast(hover, secondary) >= 4.5, color + ' hover ' + role);
                assert.ok(treePaletteContrast(hover, primary) >= 4.5, color + ' primary hover ' + role);
            }
        }
        const defaultsTones = Object.values(defaults[theme]).map(color => treePaletteTones(color, theme));
        for (const color of Object.values(defaults[theme]))
            assert.equal(treePaletteTones(color, theme).overview, color);
        // Independent outline categories must remain visible against every
        // default fill category, not just the matching hue.
        for (const fill of defaultsTones)
            for (const outline of defaultsTones)
                for (const role of ['detail', 'compact', 'actions'])
                    assert.ok(treePaletteContrast(fill[role], outline['detail-outline']) >= 3,
                        theme + ' independent detailed outline');
    }
    assert.ok(treePaletteContrast('#80c5a0', '#153d29') >= 4.5, 'light selected avatar initials');
    assert.ok(treePaletteContrast('#80c5a0', '#ddeee3') >= 1.5, 'light selected avatar separation');
    assert.ok(treePaletteContrast('#89d7ab', '#14221c') >= 4.5, 'dark selected avatar initials');
    assert.ok(treePaletteContrast('#89d7ab', '#123c2b') >= 3, 'dark selected avatar separation');
    const props = new Map();
    let writes = 0;
    const runtime = { shell: { style: { setProperty(key, value) { writes++; props.set(key, value); } } } };
    applyTreePalette(runtime, defaults);
    assert.equal(writes, 42 * 9);
    applyTreePalette(runtime, defaults);
    assert.equal(writes, 42 * 9);
    const next = normalizeTreePalette({ light: { male: '#ff0000' } });
    applyTreePalette(runtime, next);
    assert.equal(props.get('--tree-palette-light-male-detail'), treePaletteTones('#ff0000', 'light').detail);
    assert.equal(props.get('--tree-palette-light-1-detail'), treePaletteTones(defaults.light['1'], 'light').detail);
`, context);
console.log('Tree palette defaults, bounded custom tones, contrast, hover and palette reuse passed.');
