'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const project = { id: 'qa' };
const people = [
    { id: 'one', projectId: 'qa', names: { last: 'Ross' }, birth: { placeId: 'a' }, death: { burialPlaceId: 'a' }, attributes: [{ placeIds: ['a', 'b'] }] },
    { id: 'two', projectId: 'qa', names: { last: 'Stone' }, deleted: true, events: [{ birthPlaceId: 'b' }] },
    { id: 'other', projectId: 'other', birth: { placeId: 'a' } }
];
const sampleData = {
    people,
    places: [{ id: 'a', projectId: 'qa' }, { id: 'b', projectId: 'qa' }, { id: 'foreign', projectId: 'other' }],
    events: [
        { projectId: 'qa', personIds: ['one', 'two', 'missing'], placeIds: ['a', 'a'], type: 'Birth', dateLabel: '1902' },
        { projectId: 'qa', personIds: ['two'], placeId: 'b', type: 'Birth', dateLabel: '1903' },
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
    'modules/places/place-record-helpers.js', 'shared/date-and-place-fields.js',
    'modules/places/filters.js', 'modules/places/directory.js'])
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../../src', file), 'utf8'), context, { filename: file });

context.setProjectReadModelActive(project.id);
const counts = context.placeSuggestionPeopleCounts(project.id);
const associations = context.placeAssociationIndex(project.id);
assert.equal(associations.counts, counts, 'directory and selector share the same provider');
const filters = { surname: 'ross', personId: 'one', eventType: 'Birth', yearFrom: '1900', yearTo: '1910' };
assert.equal(context.placeMatchesFilters(sampleData.places[0], filters, associations), true);
assert.equal(context.placeMatchesFilters(sampleData.places[1], filters, associations), false, 'the matching person must be associated with the matching event');
assert.equal(context.placeMatchesFilters(sampleData.places[0], { ...filters, personId: 'two' }, associations), false, 'surname and ID must match the same person');
for (const place of sampleData.places.filter(place => place.projectId === project.id))
{
    const options = { projectId: project.id };
    assert.deepEqual(Array.from(associations.peopleByPlaceId.get(place.id) || []),
        Array.from(context.getPeopleForPlace(place.id, options)), 'people retain canonical order and deleted records');
    assert.deepEqual(Array.from(associations.eventsByPlaceId.get(place.id) || []),
        Array.from(context.getEventsForPlace(place.id, options)), 'events are unique per place');
}
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

