'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const project = { id: 'qa' };
const people = [
    { id: 'one', projectId: 'qa', birth: { placeId: 'a' }, death: { burialPlaceId: 'a' }, attributes: [{ placeIds: ['a', 'b'] }] },
    { id: 'two', projectId: 'qa', deleted: true, events: [{ birthPlaceId: 'b' }] },
    { id: 'other', projectId: 'other', birth: { placeId: 'a' } }
];
const sampleData = {
    people,
    places: [{ id: 'a', projectId: 'qa' }, { id: 'b', projectId: 'qa' }, { id: 'foreign', projectId: 'other' }],
    events: [
        { projectId: 'qa', personIds: ['one', 'two', 'missing'], placeIds: ['a', 'a'] },
        { projectId: 'other', personIds: ['one'], placeId: 'b' }
    ]
};
let personPasses = 0;
const context = vm.createContext({
    sampleData,
    validProjectById: id => id === project.id ? project : null,
    getPeople: id => { personPasses++; return people.filter(person => person.projectId === id); },
    currentProjectId: () => project.id
});
for (const file of ['core/project-read-model.js', 'shared/project-read-providers.js',
    'modules/places/place-record-helpers.js', 'shared/date-and-place-fields.js'])
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../../src', file), 'utf8'), context, { filename: file });

context.setProjectReadModelActive(project.id);
const counts = context.placeSuggestionPeopleCounts(project.id);
for (const place of sampleData.places.filter(place => place.projectId === project.id))
    assert.equal(counts.get(place.id) || 0, context.getPeopleForPlace(place.id, { projectId: project.id }).length);
assert.equal(counts.has('foreign'), false);
assert.equal(context.placeSuggestionPeopleCounts(project.id), counts);
assert.equal(personPasses, 1, 'tie-breaking must prepare people only once');
context.invalidateProjectReadModel(project.id, ['notes']);
assert.equal(context.placeSuggestionPeopleCounts(project.id), counts);
sampleData.events[0].placeIds = ['b'];
context.invalidateProjectReadModel(project.id, ['events']);
const edited = context.placeSuggestionPeopleCounts(project.id);
assert.notEqual(edited, counts);
assert.equal(edited.get('a'), context.getPeopleForPlace('a', { projectId: project.id }).length);
assert.equal(personPasses, 1, 'event edits retain the person index');
assert.equal(context.placeSuggestionPeopleCounts('other').size, 0);
console.log('Place suggestion association parity, cache reuse, edit freshness and project scope passed.');

