'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const project = { id: 'p1' };
const other = { id: 'p2' };
const owners = Array.from({ length: 8 }, (_, i) => ({ id: 'p' + i, projectId: 'p1', name: 'Person ' + i, deleted: i === 0 }));
const foreign = { id: 'foreign', projectId: 'p2', name: 'Foreign' };
const people = [...owners, foreign];
const events = owners.flatMap(person => [1900, 1900, 1940, 1920].map((year, i) => ({
    id: person.id + '-' + i, title: 'Event ' + year, type: 'birth', date: { first: { year } }, personIds: [person.id, person.id],
    relatedPersonIds: ['foreign', 'missing']
})));
events.push({ id: 'ownerless', type: 'birth', personIds: ['missing'], relatedPersonIds: ['p0'] },
    { id: 'fallback', type: 'birth', relatedPersonIds: ['p0', 'p1'] },
    { id: 'joint', type: 'marriage', personIds: ['p1', 'p2', 'p1'] });
const state = { language: 'en' };
let globalLookups = 0, dateKeys = 0;
const context = vm.createContext({
    state, sampleData: { people },
    validProjectById: id => id === project.id ? project : id === other.id ? other : null,
    getPeople: id => people.filter(person => person.projectId === id),
    getPerson: id => { globalLookups++; return people.find(person => person.id === id); },
    formatPersonFullName: person => person.name,
    genealogyDateSortValue: event => { dateKeys++; return event.date?.first.year ?? Number.MAX_SAFE_INTEGER; },
    formatGenealogyDateLabel: event => String(event.date?.first.year || ''),
    translateText: s => s, t: s => s, escapeHtml: s => String(s), icon: { chevron: '' },
    renderPersonAvatar: () => ''
});
for (const file of ['core/project-read-model.js', 'shared/project-read-providers.js', 'modules/places/inspector.js'])
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../../src', file), 'utf8'), context, { filename: file });

context.setProjectReadModelActive(project.id);
const place = { id: 'heavy', projectId: project.id };
const prepare = () =>
{
    const read = context.acquireProjectReadModel(project.id);
    const index = context.projectPeopleIndex(read);
    return context.placeInspectorPreparedEvents(place, events, read, index, context.placeInspectorPersonResolver(index));
};
const first = prepare();
assert.equal(dateKeys, events.length, 'Compute each date key once');
assert.equal(globalLookups, 1, 'Only the unresolved owner requires the legacy lookup');
assert.equal(first.groups.find(group => group.person.id === 'p0').person.deleted, true);
assert.deepEqual(Array.from(first.groups[0].events, event => event.id), ['p0-0', 'p0-1', 'p0-3', 'p0-2', 'fallback']);
assert.deepEqual(Array.from(first.otherEvents, event => event.id), ['ownerless']);
assert.equal(first.groups.filter(group => group.events.some(event => event.id === 'joint')).length, 2);

const preview = () => context.renderPlaceInspectorEvents(events, place);
const rows = html => [...html.matchAll(/places-inspector-event-row/g)].length;
const cards = html => [...html.matchAll(/data-place-connected-person=/g)].length;
const collapsed = preview();
assert.equal(cards(collapsed), 5);
assert.equal(rows(collapsed), 16);
assert.match(collapsed, /Related to Foreign/);
assert.match(collapsed, /View all/);
state.placesInspectorShowAllEvents = true;
const expanded = preview();
assert.equal(cards(expanded), 8);
assert.equal(rows(expanded), 37);
assert.match(expanded, /Show less/);
state.placesInspectorShowAllEvents = false;
assert.equal(preview(), collapsed);

// Canonically scoped owners can reuse the cached projection.
events.splice(events.findIndex(event => event.id === 'ownerless'), 1);
context.invalidateProjectReadModel('p1', ['events']);
const cached = prepare();
assert.equal(prepare(), cached);
context.invalidateProjectReadModel('p1', ['notes']);
assert.equal(prepare(), cached);
owners[0].name = 'Zed';
context.invalidateProjectReadModel('p1', ['people']);
assert.notEqual(prepare(), cached);
assert.equal(prepare().groups.at(-1).name, 'Zed');
const beforeLocale = prepare();
state.language = 'ru';
assert.notEqual(prepare(), beforeLocale);
const beforeSwitch = prepare();
context.setProjectReadModelActive(other.id);
context.setProjectReadModelActive(project.id);
assert.notEqual(prepare(), beforeSwitch);

// A foreign owner must reflect changes even outside the active project's revision.
events.push({ id: 'foreign-owner', personIds: ['foreign'] });
context.invalidateProjectReadModel('p1', ['events']);
assert.equal(prepare().groups.find(group => group.person.id === 'foreign').name, 'Foreign');
foreign.name = 'Updated across projects';
assert.equal(prepare().groups.find(group => group.person.id === 'foreign').name, 'Updated across projects');
console.log('Places inspector stable grouping, preview and expansion, resolution bounds and scoped freshness passed.');
