'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = name => fs.readFileSync(path.join(__dirname, '../../src', name), 'utf8');
const slice = (name, start, end) =>
{
    const source = read(name);
    const first = source.indexOf(start), last = source.indexOf(end, first + start.length);
    assert.ok(first >= 0 && last > first, name);
    return source.slice(first, last);
};
const people = [
    { id: 'luna', projectId: 'p1', names: { prefix: 'Dr.', first: 'Luna', middle: 'Mabel', last: 'Purrington', maiden: 'Whiskerfield', suffix: 'II' } },
    { id: 'other', projectId: 'p1', names: { first: 'Luna', middle: 'Mabel', last: 'Smith' } },
    { id: 'other2', projectId: 'p1', names: { first: 'Paul', last: 'Purrington' } },
    { id: 'ru', projectId: 'p1', names: { first: 'Анна', middle: 'Сергеевна', last: 'Фёдорова' } },
    { id: 'accent', projectId: 'p1', names: { first: 'Élodie', last: 'García' } },
    { id: 'foreign', projectId: 'p2', names: { first: 'Luna', middle: 'Mabel', last: 'Purrington' } },
    { id: 'deleted', projectId: 'p1', deleted: true, names: { first: 'Luna', middle: 'Mabel', last: 'Purrington' } }
];
const luna = people[0], original = JSON.stringify(luna);
const state = { language: 'en', peopleSearch: '' };
const deps = {
    state, translateText: value => value === 'Purrington' ? 'Муррингтон' : value,
    getPeople: id => people.filter(person => person.projectId === id),
    currentFamilyTreeProjectId: () => 'p1', treeRecentPeople: () => [luna],
    connectPersonName: person => [person.names.first, person.names.middle, person.names.last].filter(Boolean).join(' '),
    peopleFiltersWithDefaults: filters => ({ surnames: [], birthPlaceIds: [], birthYear: {}, living: 'Any', sourceLinks: 'all', ...filters }),
    normalizeSharedFilterSearch: value => String(value || '').toLowerCase(),
    getPeopleSourceStatus: () => '1 source linked', getPeopleSourceCount: () => 1,
    SHARED_FILTER_UNKNOWN_VALUE: '__unknown__'
};
const api = new Function(...Object.keys(deps), read('shared/person-name-helpers.js')
    + '\n' + slice('modules/family-tree/tree-view.js', 'function treePersonPickerResults(', 'function openTreePersonPicker(')
    + '\n' + slice('modules/people/directory.js', 'function peopleRecordsMatchingFilters(', 'function peopleFilterResultCount(')
    + '\nreturn { personSearchTokens, personSearchHaystack, personSearchMatches, treePersonPickerResults, peopleRecordsMatchingFilters };')(...Object.values(deps));
const match = (person, query, fields = []) => api.personSearchMatches(api.personSearchTokens(query), api.personSearchHaystack(person, fields));
for (const query of ['Lu Ma Pu', 'Pu Lu Ma', 'LUNA   ma pu', 'Mab Purr', 'Whisk Ma', 'Dr Lu II', 'Лу', 'Мурр'])
{
    // Localized example is explicitly provided only for surname.
    if (query === 'Лу') continue;
    assert.ok(match(luna, query), query);
}
for (const query of ['Lu Ma Smith', 'Paul Ma Pu', 'Whisk Smith', 'Luna unrelated'])
    assert.equal(match(luna, query), false, query);
assert.ok(match(luna, '    '));
assert.ok(match(luna, 'lu 1890', ['1890', 'London']));
assert.ok(match(people[3], 'фед сер ан'));
assert.ok(match(people[4], 'Gar elo'));
assert.equal(JSON.stringify(luna), original);
assert.deepEqual(api.treePersonPickerResults('Lu Ma Pu').map(person => person.id), ['luna']);
assert.deepEqual(api.treePersonPickerResults('  ').map(person => person.id), ['luna']);
const directory = people.filter(person => person.projectId === 'p1' && !person.deleted).map(person => ({
    id: person.id, surname: person.names.last, name: deps.connectPersonName(person),
    living: 'Deceased', birthPlace: 'London',
    personSearchText: api.personSearchHaystack(person, ['London', 'Deceased', '1 source linked'])
}));
assert.deepEqual(api.peopleRecordsMatchingFilters(directory, {}, 'Pu Lu Ma').map(row => row.id), ['luna']);
assert.deepEqual(api.peopleRecordsMatchingFilters(directory, {}, 'Ma Paul'), []);
assert.deepEqual(api.peopleRecordsMatchingFilters(directory, {}, 'Whisk Lon').map(row => row.id), ['luna']);
assert.deepEqual(api.peopleRecordsMatchingFilters(directory, {}, 'Lu 1 source').map(row => row.id), ['luna', 'other']);
assert.deepEqual(api.peopleRecordsMatchingFilters(directory, { surnames: ['Smith'] }, 'Lu Ma Pu'), []);
assert.equal(api.peopleRecordsMatchingFilters(directory, {}, ' ').length, directory.length);
const large = Array.from({ length: 6500 }, (_, index) => api.personSearchHaystack({
    names: { first: 'Person', middle: 'Middle', last: 'Family ' + index }
}));
const tokens = api.personSearchTokens('Per Mid 6499');
assert.equal(large.filter(text => api.personSearchMatches(tokens, text)).length, 1);
console.log('Shared person matching, Tree focus, directory metadata/filters and large prepared list passed.');
