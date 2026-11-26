const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { performance } = require('node:perf_hooks');
const code = fs.readFileSync(require('node:path').join(__dirname, '../../src/modules/people/person-match-engine.js'), 'utf8');
const Engine = vm.runInNewContext(code + '\nPersonMatchEngine;');
const date = (year, month, day, type = 'Exact date', placeId = '') => ({
    state: year || month || day ? 'known' : 'empty', dateType: type, calendar: 'Gregorian',
    first: { year, month, day }, second: null, placeId
});
const person = (id, names, birth, profile = {}) => ({ id, projectId: 'p1', names, birth,
    death: date(null, null, null), profile });
const silver = person('silver', { first: 'Silver', middle: '', last: 'Whiskerfield', maiden: '' }, date(1998, 3, 3, 'Exact date', 'pawford'));
const luna = person('luna', { first: 'Luna', middle: 'Mabel', last: '', maiden: 'Purrington' }, date(1999, 8, 12, 'Exact date', 'pawford'));
const other = person('other', { first: 'Other', middle: '', last: 'Surname', maiden: '' }, date(1968, 8, 12, 'Exact date', 'elsewhere'));
const places = [{ id: 'pawford', projectId: 'p1', name: 'Pawford, England', alternativeNames: ['Pawford town'] },
    { id: 'elsewhere', projectId: 'p1', name: 'Elsewhere' }];
const index = Engine.createIndex([silver, luna, other], places, [], 'p1');
const query = (names, birth = date(null, null, null)) => ({ names, birth, death: date(null, null, null) });
const match = q => Array.from(Engine.search(index, q), row => row.personId);
assert.deepEqual(match(query({ first: 'Silver' })), []);
assert.deepEqual(match(query({ last: 'Whiskerfield' })), []);
assert.deepEqual(match(query({}, date(null, 3, 3, 'Exact date', 'pawford'))), []);
assert.deepEqual(match(query({ first: 'Silver' }, date(null, null, null, 'Exact date', 'pawford'))), []);
assert.deepEqual(match(query({ first: 'Silvy', last: 'Whiskerfield' })), ['silver']);
assert.deepEqual(match(query({ first: 'Silver' }, date(null, 3, 3, 'Exact date', 'pawford'))), ['silver']);
assert.deepEqual(match(query({ last: 'Whiskerfield' }, date(null, 3, 3, 'Exact date', 'pawford'))), ['silver']);
assert.deepEqual(match(query({ first: 'Silver' }, date(1998, null, null, 'Exact date', 'pawford'))), []);
const lunaMatch = Engine.search(index, query({ first: 'Luna', middle: 'Mabel', last: 'Whiskerfield' }, date(1998, null, null)));
assert.equal(lunaMatch[0]?.personId, 'luna');
assert.equal(lunaMatch[0]?.tier, 'moderate');
assert.deepEqual(match(query({ first: 'Silver', last: 'Whiskerfield' }, date(1920, 1, 1))), []);
assert.equal(Engine.nameQuality('Луна', 'Luna'), 3);
const oldCalendar = date(1582, 10, 5); oldCalendar.calendar = 'Julian';
const newCalendar = date(1582, 10, 15);
assert.equal(Engine.dateEvidence(oldCalendar, newCalendar).strength, 2);
const distantRange = date(1700, null, null, 'Between');
distantRange.second = { year: 1701, month: null, day: null };
assert.equal(Engine.dateEvidence(distantRange, date(1900, null, null)).conflict, true);
const aliases = [person('alia', { first: 'Maria', middle: '', last: 'Ivanova', maiden: '' }, date(1850, null, null), { alternativeNames: 'Mary Smith' })];
const aliasIndex = Engine.createIndex(aliases, [], [], 'p1');
assert.equal(Engine.search(aliasIndex, query({ first: 'Mary', last: 'Smith' }))[0]?.personId, 'alia');
const placesById = new Map(places.map(place => [place.id, place]));
const sqlStyle = Engine.rankCandidates([Engine.preparePerson(silver, placesById)],
    query({ first: 'Silver' }, date(null, 3, 3, 'Exact date', 'pawford')),
    { places: placesById, projectId: 'p1' });
assert.equal(sqlStyle[0]?.personId, 'silver');

// Distinct canonical Places with the same short locality must not count
// as corroborating evidence when their full recorded locations differ.
const ambiguousPlaces = [...places, { id: 'pawford-fr', projectId: 'p1',
    name: 'Pawford, France', alternativeNames: [] }];
const locationIndex = Engine.createIndex([silver], ambiguousPlaces, [], 'p1');
assert.deepEqual(Array.from(Engine.search(locationIndex,
    query({ first: 'Silver' }, date(null, 3, 3, 'Exact date', 'pawford-fr'))),
    row => row.personId), []);
const freeTextBirth = { ...date(null, 3, 3), placeText: 'Pawford' };
assert.deepEqual(Array.from(Engine.search(locationIndex, query({ first: 'Silver' }, freeTextBirth)),
    row => row.personId), ['silver']);
assert.deepEqual(Array.from(Engine.search(aliasIndex, query({ first: 'Mary', middle: 'Mary' })), x => x.personId), []);
const deleted = { ...person('deleted', { first: 'Silvy', last: 'Whiskerfield' }, date(1998, 3, 3)), deleted: true };
const foreign = { ...person('foreign', { first: 'Silvy', last: 'Whiskerfield' }, date(1998, 3, 3)), projectId: 'p2' };
const safeIndex = Engine.createIndex([silver, deleted, foreign], places, [], 'p1');
assert.deepEqual(Array.from(Engine.search(safeIndex, query({ first: 'Silvy', last: 'Whiskerfield' })), x => x.personId), ['silver']);
assert.deepEqual(Array.from(Engine.search(safeIndex, query({ first: 'Silvy', last: 'Whiskerfield' }), { excludeIds: ['silver'] }), x => x.personId), []);
const parent = person('parent', { first: 'Oliver', last: 'Moss' }, date(1965, 1, 1));
const child = person('child', { first: 'Child', last: 'Moss' }, date(1990, 1, 1));
const familyIndex = Engine.createIndex([parent, child], [], [{ projectId: 'p1', partnerAId: 'parent', partnerBId: '', childIds: ['child'] }], 'p1');
const yearOnly = query({ first: 'Oliver' }, date(1965, null, null));
assert.deepEqual(Array.from(Engine.search(familyIndex, yearOnly, { anchorPersonId: 'child', relationshipType: 'parent' }), x => x.personId), []);
const familyDraft = query({ first: 'Oliver' }, date(1965, 1, 1));
assert.equal(Engine.search(familyIndex, familyDraft, { anchorPersonId: 'child', relationshipType: 'parent' })[0]?.personId, 'parent');
const many = Array.from({ length: 10000 }, (_, i) => person('p-' + i, { first: 'Person' + i, middle: '', last: 'Surname' + (i % 200), maiden: '' }, date(1900 + i % 100, null, null)));
const start = performance.now();
const bigIndex = Engine.createIndex(many, [], [], 'p1');
const buildMs = performance.now() - start;
const queryStart = performance.now();
for (let i = 0; i < 1000; i += 1)
    Engine.search(bigIndex, query({ first: 'Person9999', last: 'Surname199' }));
const queryMs = (performance.now() - queryStart) / 1000;
console.log(JSON.stringify({ pass: true, people: many.length, buildMs: Math.round(buildMs), avgQueryMs: Number(queryMs.toFixed(2)) }));
