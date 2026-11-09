/* Fail fast if localization modules cannot initialize in real script order. */
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'src/index.html'), 'utf8');
const files = [...html.matchAll(/<script src="(localization\/[^"]+\.js)" defer><\/script>/g)]
    .map(match => match[1]);
const catalogIndex = files.indexOf('localization/catalog.js');

assert.ok(catalogIndex >= 0, 'Localization catalog must be loaded in index.html');
assert.ok(files.includes('localization/shared-projects.js'), 'Shared dictionary missing');
assert.ok(files.includes('localization/notes-places-terms.js'), 'Places dictionary missing');
assert.ok(catalogIndex < files.indexOf('localization/runtime.js'),
    'Localization catalog must load before its runtime');

const sandbox = vm.createContext({});
for (const filename of files.slice(0, catalogIndex + 1))
{
    // Execute all dictionaries with shared global lexical bindings, just as
    // classic deferred scripts do in the browser.
    const source = fs.readFileSync(path.join(root, 'src', filename), 'utf8');
    vm.runInContext(source, sandbox, { filename });
}

const counters = vm.runInContext('({'
    + 'ui: Object.keys(RU_UI).length,'
    + 'data: Object.keys(RU_DATA).length,'
    + 'exact: Object.keys(RU_EXACT).length,'
    + "draft: RU_UI['Draft place position'],"
    + "ready: RU_EXACT['Draft place position']"
    + '})', sandbox);
assert.ok(counters.ui > 1000, 'RU_UI should contain populated translations');
assert.ok(counters.data > 100, 'RU_DATA should contain populated translations');
assert.equal(counters.exact, counters.ui + counters.data,
    'RU_EXACT should contain every UI and data translation without collisions');
assert.equal(counters.draft, 'Черновая позиция места');
assert.equal(counters.ready, counters.draft);

// Ensure the duplicate-key guard itself still rejects overlapping blocks.
assert.throws(() => vm.runInContext(
    "buildLocalizationMap('test', { a: { test: 'one' }, b: { test: 'two' } })",
    sandbox
), /Duplicate localization key "test"/);

console.log('Localization startup and duplicate-key checks passed.');
