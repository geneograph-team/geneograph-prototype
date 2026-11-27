'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const project = { id: 'review-project' };
const person = (id, first, last, year, extra = {}) => ({
    id, projectId: project.id, gender: 'unknown', livingStatus: 'Unknown',
    names: { first, last }, birth: { year }, ...extra
});
const people = [
    person('exact', 'Ada', 'Ross', 1900),
    person('same-date', 'Ada', 'Stone', 1900),
    person('conflict', 'Ada', 'Ross', 1915),
    person('other', 'Beth', 'Ross', 1900),
    person('deleted', 'Ada', 'Ross', 1900, { deleted: true }),
    person('foreign', 'Ada', 'Ross', 1900, { projectId: 'elsewhere' })
];
const context = vm.createContext({
    state: { language: 'en' }, structuredClone,
    validProjectById: id => id === project.id ? project : null,
    getPeople: id => people.filter(person => person.projectId === id),
    normalizeGeneographPersonNames: person => person.names,
    geneoPersonDisplayName: person => [person.names.first, person.names.last].join(' '),
    connectPersonName: person => person ? [person.names.first, person.names.last].join(' ') : '',
    emptyGenealogyDate: () => ({}),
    normalizeGenealogyDateInput: ({ year }) => ({ state: year ? 'known' : 'empty', first: { year } }),
    genealogyDatesCompatible: (a, b) => a.first.year === b.first.year
});
for (const file of ['core/project-read-model.js', 'shared/project-read-providers.js', 'modules/geneograph/geneograph-tree-review-model.js'])
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../../src', file), 'utf8'), context, { filename: file });

context.setProjectReadModelActive(project.id);
const ids = items => Array.from(items, item => item.person.id);
const match = (input, options) => context.geneoTreeImportMatches(input, project.id, null, options);
const input = person('draft', 'Ada', 'Ross', 1900);
const shortlist = () => ids(match(input, { eligibleOnly: true }));
const full = () => ids(match(input).filter(item => item.eligible));
const index = () => context.geneoReviewMatchNames(context.acquireProjectReadModel(project.id));
assert.deepEqual(shortlist(), ['exact', 'same-date']);
assert.deepEqual(shortlist(), full());
assert.deepEqual(ids(match(person('draft', 'Ada', 'Ross'), { eligibleOnly: true })), ['exact', 'conflict']);
const before = index();
context.invalidateProjectReadModel(project.id, ['notes']);
assert.equal(index(), before);
people[1].birth.year = 1902;
context.invalidateProjectReadModel(project.id, ['people']);
assert.notEqual(index(), before);
assert.deepEqual(shortlist(), ['exact']);
assert.deepEqual(shortlist(), full());
assert.ok(ids(match(input, { evaluateEligibility: false })).includes('other'), 'Manual selection searches the full project');
console.log('Sync automatic match ordering, project eligibility, date conflicts and index invalidation passed.');
