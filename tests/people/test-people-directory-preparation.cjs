'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const projects = [{ id: 'p1', defaultPersonId: 'silver' }, { id: 'p2', defaultPersonId: 'foreign' }, { id: 'empty' }];
const sampleData = { projects, people: [], sourceLinks: [] };
const birth = year => ({ state: 'known', dateType: 'Exact date', calendar: 'Gregorian', first: { year } });
for (let index = 0; index < 135; index += 1)
{
    sampleData.people.push({
        id: index ? 'p' + index : 'silver', projectId: 'p1',
        names: { first: 'Person ' + index, last: index % 2 ? 'Birch' : 'Maple' },
        birth: birth(1800 + index), livingStatus: 'Deceased',
        updatedAt: '2026-11-26T00:00:00Z'
    });
}
sampleData.people.push({ ...sampleData.people[0], id: 'foreign', projectId: 'p2' });
sampleData.sourceLinks.push(
    { projectId: 'p1', targetType: 'person', targetId: 'p130', sourceId: 's1' },
    { projectId: 'p1', targetType: 'person', targetId: 'p130', sourceId: 's1' },
    { projectId: 'p2', targetType: 'person', targetId: 'p130', sourceId: 'wrong-project' }
);
const state = {
    language: 'en', selectedPeopleId: 'silver', peopleView: 'directory',
    peopleSort: 'first', peopleSortDirection: 'ascending', peopleSearch: ''
};
const counts = { graph: 0, display: 0, profile: 0 };
let activeProject = 'p1';
let displayedRows;
const classList = { remove() {} };
const context = vm.createContext({
    sampleData, state, prototypeSessionEditRevision: 0,
    document: { documentElement: { lang: 'en' } },
    currentProjectId: () => activeProject,
    validProjectById: id => projects.find(project => project.id === id),
    treeDefaultPersonId: id => projects.find(project => project.id === id)?.defaultPersonId,
    getPeople: id => sampleData.people.filter(person => person.projectId === id),
    getPerson: id => sampleData.people.find(person => person.id === id),
    centralFamilyRecords: () => [], buildPersonRelationshipGraph: () => new Map(),
    buildPersonRelationshipLabelMap(projectId, reference)
    {
        counts.graph++;
        return new Map(sampleData.people.filter(person => person.projectId === projectId)
            .map(person => [person.id, person.id === reference ? 'Self' : 'Relative']));
    },
    sourceLinksForProject: id => sampleData.sourceLinks.filter(link => !id || link.projectId === id),
    sourceIdsForTarget: (type, id, project) => [...new Set(sampleData.sourceLinks
        .filter(link => link.targetType === type && link.targetId === id && link.projectId === project)
        .map(link => link.sourceId))],
    getPlaceDisplay: id => id === 'town' ? 'Town' : '',
    getPlaceEventDisplay: event => event?.placeId === 'town' ? 'Town' : event?.placeText || '',
    cleanEditFieldValue: value => String(value || '').trim(),
    timelineYearFromValue: date => date?.first?.year || '',
    getPersonPhotoCount: () => 0, getArchiveFilesForPerson: () => [], getNotesForPerson: () => [], getParents: () => [],
    t: value => value, escapeHtml: value => value, icon: {},
    main: { classList }, workspace: { classList }, sidebar: {},
    appNavigationObserve() {}, bindPeopleSidebar() {}, renderPersonSidebar() {},
    replaceSharedSearchMarkup(root, markup) { root.innerHTML = markup; },
    renderPeopleProfile(_row, person) { counts.profile++; assert.equal(person.projectId, activeProject); },
    bindPeopleControls(rows) { displayedRows = Array.from(rows, row => row.id); }
});
for (const file of [
    'shared/genealogy-dates', 'shared/person-name-helpers', 'shared/filter-fields', 'shared/inspector-sort',
    'core/project-read-model', 'shared/project-read-providers', 'shared/tree-seed-model', 'modules/people/directory'
])
{
    const filename = path.join(__dirname, '../../src', file + '.js');
    vm.runInContext(fs.readFileSync(filename, 'utf8'), context, { filename });
}
const display = context.toPeopleDisplayRecord;
context.toPeopleDisplayRecord = (...args) => { counts.display++; return display(...args); };
for (const name of ['renderPeopleSidebar', 'renderPeopleDirectoryControls', 'renderPeopleTable',
    'renderPeopleMobileList', 'renderPeopleTableFooter'])
{
    context[name] = () => '';
}

const { peopleDirectoryContext, peopleRecordsMatchingFilters, sortPeopleRecords, renderPeople } = context;
context.setProjectReadModelActive('p1');
const first = peopleDirectoryContext();
const legacy = sampleData.people.filter(person => person.projectId === 'p1').map(person => ({
    id: person.id,
    name: [person.names.first, person.names.last].join(' '),
    first: person.names.first,
    surname: person.names.last,
    living: person.livingStatus,
    birth: context.formatGenealogyDateLabel(person.birth),
    birthPlace: context.getPlaceEventDisplay(person.birth),
    birthPlaceId: person.birth.placeId || '',
    updatedAt: person.updatedAt,
    relation: person.id === 'silver' ? 'Self' : 'Relative',
    sourceCount: context.sourceIdsForTarget('person', person.id, person.projectId).length
}));
const query = (rows, filters, text, sort) =>
    Array.from(sortPeopleRecords(peopleRecordsMatchingFilters(rows, filters, text), sort), row => row.id);
assert.equal(first.records.length, 135);
assert.deepEqual(query(first.records, {}, 'Birch  Person  13', 'first'),
    query(legacy, {}, 'Birch Person 13', 'first'));
assert.ok(query(first.records, {}, 'Birch Person 13', 'first').includes('p13'));
assert.equal(query(first.records, {}, 'Birch Maple', 'first').length, 0);
assert.equal(first.records.find(row => row.id === 'p130').sourceCount, 1);
assert.equal(peopleDirectoryContext(), first);
for (const [filters, text, sort] of [
    [{}, '', 'first'], [{ surnames: ['Birch'] }, '', 'last'],
    [{ sourceLinks: 'linked' }, '', 'created'], [{ sourceLinks: 'unlinked' }, 'Relative', 'birth'],
    [{ birthYear: { mode: 'after', from: '1920' } }, '', 'birth'], [{}, '1 source linked', 'updated'],
    [{}, 'no matches', 'first']
])
{
    assert.deepEqual(query(first.records, filters, text, sort), query(legacy, filters, text, sort));
}

for (const rowsPerPage of [10, 25, 50, 100])
{
    state.peopleRowsPerPage = rowsPerPage;
    counts.display = 0;
    renderPeople();
    assert.equal(counts.display, rowsPerPage);
    assert.equal(displayedRows.length, rowsPerPage);
}
state.peopleRowsPerPage = 25;
renderPeople();
state.peoplePage = 3;
renderPeople();
assert.equal(displayedRows[0], 'p50');

sampleData.sourceLinks = sampleData.sourceLinks.filter(link => link.projectId !== 'p1');
assert.equal(peopleDirectoryContext().records.find(row => row.id === 'p130').sourceCount, 0);
sampleData.sourceLinks = [
    ...sampleData.sourceLinks,
    { projectId: 'p1', targetType: 'person', targetId: 'p130', sourceId: 's1' }
];
assert.equal(peopleDirectoryContext().records.find(row => row.id === 'p130').sourceCount, 1);

context.setPeopleSelection(['silver', 'p130', 'foreign']);
assert.deepEqual(Array.from(state.peopleSelectedIds), ['silver', 'p130']);

const originalGraphCount = counts.graph;
context.peopleDirectoryContext = () => assert.fail('Profile must not prepare the directory');
state.peopleView = 'profile';
for (const selectedId of ['p130', 'p131', 'foreign', 'missing'])
{
    state.selectedPeopleId = selectedId;
    counts.display = 0;
    renderPeople();
    assert.equal(counts.display, 1);
    assert.equal(counts.graph, originalGraphCount);
}
context.peopleDirectoryContext = peopleDirectoryContext;
assert.equal(counts.profile, 4);
assert.equal(state.peopleSelectedIds.length, 0);
assert.equal(state.selectedPeopleId, 'silver');

sampleData.people[1].names.first = 'Edited';
sampleData.people[1].deleted = true;
sampleData.sourceLinks.find(link => link.projectId === 'p1').targetId = 'silver';
context.invalidateProjectReadModel();
const edited = peopleDirectoryContext();
assert.notEqual(edited, first);
assert.equal(edited.peopleById.has('p1'), false);
assert.equal(edited.records.find(row => row.id === 'silver').sourceCount, 1);
sampleData.people[1].deleted = false;
context.invalidateProjectReadModel();
assert.equal(peopleDirectoryContext().records.find(row => row.id === 'p1').first, 'Edited');
projects[0].defaultPersonId = 'p130';
assert.equal(peopleDirectoryContext().records.find(row => row.id === 'p130').relation, 'Self');
state.language = 'ru';
const russian = peopleDirectoryContext();
assert.equal(russian.language, 'ru');
activeProject = 'p2';
context.setProjectReadModelActive('p2');
assert.deepEqual(Array.from(peopleDirectoryContext().peopleById.keys()), ['foreign']);
activeProject = 'p1';
context.setProjectReadModelActive('p1');
assert.notEqual(peopleDirectoryContext(), russian);
activeProject = 'empty';
context.setProjectReadModelActive('empty');
state.peopleView = 'profile';
renderPeople();
assert.equal(state.peopleView, 'directory');
assert.deepEqual(displayedRows, []);
console.log('People directory query parity, bounded page preparation, direct Profile and cache invalidation passed.');

