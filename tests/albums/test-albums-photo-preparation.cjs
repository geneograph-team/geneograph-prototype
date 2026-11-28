'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const projects = [{ id: 'p1' }, { id: 'p2' }];
const person = (id, name, projectId = 'p1') => ({ id, projectId, name });
const people = [person('tagged', 'Tagged'), person('a', 'Ada Stone'), person('b', 'Beth North'),
    person('z', 'Zed Last'), { ...person('deleted', 'Deleted'), deleted: true }, person('foreign', 'Foreign', 'p2')];
const photo = (id, personIds, albumIds = []) => ({ id, projectId: 'p1', title: id, personIds, albumIds, width: 300, height: 200 });
const selected = photo('current', ['tagged'], ['album']);
const media = [selected, photo('shared', ['a', 'a'], ['album']), photo('cotag', ['tagged', 'b'])];
const sampleData = { people, media };
const domains = [];
const normalize = value => String(value || '').toLowerCase().trim();
const context = vm.createContext({
    sampleData, state: { language: 'en' }, currentProjectId: () => 'p1',
    validProjectById: id => projects.find(project => project.id === id),
    getPeople: id => people.filter(person => person.projectId === id),
    getPerson: id => people.find(person => person.id === id),
    getProjectPhotos: id => media.filter(photo => photo.projectId === id),
    getPhoto: (id, options) => media.find(photo => photo.id === id && (!options?.projectId || photo.projectId === options.projectId)),
    getPlaceDisplay: () => '', getPlaceEventDisplay: () => '', getProjectAlbums: () => [{ id: 'album', name: 'Album' }],
    connectPersonName: person => person.name, formatPersonFullName: person => person.name,
    albumPhotoPersonDates: () => '',
    personSearchTokens: value => normalize(value).split(' ').filter(Boolean),
    normalizePersonSearch: normalize,
    personSearchHaystack: person => normalize(person.name),
    personSearchMatches: (tokens, haystack) => tokens.every(token => haystack.includes(token)),
    invalidateLinkedPlaceDismissals() {},
    updatePrototypeSessionUnloadGuard() {},
    photoIsTaggedWithPerson: (photo, person) => photo.personIds.includes(person.id)
});
for (const file of ['core/project-read-model.js', 'shared/project-read-providers.js', 'modules/albums/photo-layout-and-crop.js',
    'modules/albums/photo-actions.js', 'modules/albums/library.js'])
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../../src', file), 'utf8'), context, { filename: file });
vm.runInContext(fs.readFileSync(path.join(__dirname, '../../src/core/bootstrap.js'), 'utf8')
    .split('function prototypeSessionBeforeUnload')[0], context);
const invalidate = context.invalidateProjectReadModel;
context.invalidateProjectReadModel = (id, touched) =>
{
    domains.push(touched);
    invalidate(id, touched);
};

context.setProjectReadModelActive('p1');
const ranks = (query = '', archive = false) => Array.from(
    context.rankAlbumTagCandidates(selected, new Set(selected.personIds), archive, query), person => person.id);
assert.deepEqual(ranks(), ['b', 'a', 'z']);
assert.deepEqual(ranks('', true), ['a', 'b', 'z']);
assert.deepEqual(ranks('last zed'), ['z']);
assert.deepEqual(ranks('deleted'), []);
assert.deepEqual(ranks('foreign'), []);
const initial = context.albumTagPeopleSearch('p1');
people[3].name = 'Edited person';
context.invalidateProjectReadModel('p1', ['people']);
assert.notEqual(context.albumTagPeopleSearch('p1'), initial);
assert.deepEqual(ranks('last zed'), []);
assert.deepEqual(ranks('edited'), ['z']);
context.setPhotoPersonIds(selected.id, ['tagged', 'a', 'a', 'foreign', 'missing'], { rerender: false });
assert.deepEqual([...selected.personIds], ['tagged', 'a']);
assert.deepEqual(ranks(), ['b', 'z']);
assert.deepEqual([...domains.at(-1)], ['media']);
assert.equal(context.setPhotoPersonRegion(selected, 'foreign', { x: 0, y: 0, width: 1, height: 1 }), false);
assert.equal(context.setPhotoPersonRegion(selected, 'a', { x: 9, y: -3, width: 0.7, height: 0.4 }), true);
const region = context.photoPersonRegion(selected, 'a');
assert.ok(region.x + region.width <= 1 && region.y === 0);
people[1].primaryPhotoId = selected.id;
context.setPhotoPersonIds(selected.id, ['tagged'], { rerender: false });
assert.equal(people[1].primaryPhotoId, '');
assert.equal(context.photoPersonRegion(selected, 'a'), null);
assert.deepEqual([...domains.at(-1)].sort(), ['media', 'people']);
const activePeople = context.projectPeopleIndex(context.acquireProjectReadModel('p1'));
const foreign = people.find(person => person.id === 'foreign');
foreign.primaryPhotoId = selected.id;
const beforeForeignRepair = domains.length;
context.setPhotoPersonIds(selected.id, ['tagged', 'a'], { rerender: false });
assert.equal(foreign.primaryPhotoId, '');
assert.deepEqual(domains.slice(beforeForeignRepair).map(touched => [...touched]), [['media'], ['people']]);
assert.equal(context.projectPeopleIndex(context.acquireProjectReadModel('p1')), activePeople);

for (let i = 0; i < 52; i++)
{
    const id = 'bulk-' + String(i).padStart(2, '0');
    people.push({ ...people[3], id, name: 'Bulk ' + (i < 50 ? 'Exact ' : 'Overflow ') + id });
}
context.invalidateProjectReadModel('p1', ['people']);
for (const archive of [false, true])
{
    for (const [query, cap, expectedTotal] of [
        [' ', 20, ranks('', archive).length],
        ['bulk', 50, 52], ['bulk exact', 50, 50], ['bulk overflow', 50, 2],
        ['bulk-51', 50, 1], ['deleted', 50, 0], ['foreign', 50, 0], ['tagged', 50, 0]
    ])
    {
        const { shown, total } = context.albumTagCandidateResults(selected, new Set(selected.personIds), archive, query);
        assert.equal(total, expectedTotal, query);
        assert.equal(shown.length, Math.min(cap, total), query);
        assert.deepEqual(Array.from(shown, person => person.id), ranks(query, archive).slice(0, cap));
    }
}

const index = context.albumPhotoSearchIndex('p1');
assert.equal(context.photoMatchesSearch(media[1], 'stone ada', ['stone', 'ada'], index), true);
assert.equal(context.photoMatchesSearch(media[1], 'album', ['album'], index), true);
media[1].albumIds = [];
context.invalidateProjectReadModel('p1', ['media']);
assert.equal(context.photoMatchesSearch(media[1], 'album', ['album'], context.albumPhotoSearchIndex('p1')), false);
context.setProjectReadModelActive('p2');
assert.deepEqual(Array.from(context.albumTagPeopleSearch('p2'), item => item.person.id), ['foreign']);
const rows = context.buildJustifiedPhotoRows(media, 920);
assert.deepEqual(Array.from(rows.flatMap(row => row.items), item => item.photo.id), media.map(photo => photo.id));
console.log('Albums ranking, eligibility, photo search freshness, tag and region integrity, and resize order passed.');
