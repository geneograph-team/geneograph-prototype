'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const context = vm.createContext({
    window: { GENEO_SEED_BOARD_ASSETS: [] },
    t: text => text,
    state: { language: 'en' },
    document: { documentElement: { lang: 'en' } },
    structuredClone
});
const files = [
    'seed/sample-data', 'shared/genealogy-dates', 'modules/places/place-record-helpers',
    'shared/relationships', 'modules/family-tree/relationships', 'shared/tree-seed-model',
    'modules/people/person-form-fields', 'modules/people/person-editor', 'shared/date-and-place-fields',
    'seed/seed-archive-records', 'seed/seed-notes-records', 'seed/seed-geneograph-collections',
    'assets/boards/whiskerfield-tree-research', 'core/validation'
];
for (const file of files)
{
    const filename = path.join(__dirname, '../src', file + '.js');
    vm.runInContext(fs.readFileSync(filename, 'utf8'), context, { filename });
}

const sample = vm.runInContext('sampleData', context);
const project = sample.projects[0];
const collections = vm.runInContext('PROJECT_OWNED_COLLECTIONS', context);
const authored = Object.fromEntries(collections.filter(key => key !== 'events').map(key => [key, sample[key] || []]));
const [board] = context.window.GENEO_SEED_BOARD_ASSETS;
authored.boards = [{ id: board.id, projectId: board.projectId, diagram: board.payload.board.diagram,
    collectionIds: ['board-col-research-theory'] }];

const before = JSON.stringify(authored);
const prepared = context.prepareProjectDraft(project, JSON.parse(before));
assert.deepEqual(Array.from(prepared.errors), []);
assert.ok(prepared.records.events.length);
assert.equal(context.prepareProjectDraft(project, { events: [] }).errors.length, 1);
assert.equal(context.prepareProjectDraft(project, { people: {} }).errors.length, 1);
assert.equal(context.prepareProjectDraft({ id: 'blank', name: 'Blank' }, {}).records.events.length, 0);
const restored = JSON.parse(before);
const rebuiltEvents = context.buildSampleEvents(restored);
assert.equal(JSON.stringify(restored), before, "Timeline reconstruction must not modify canonical records.");
restored.events = rebuiltEvents;
assert.deepEqual(Array.from(context.validateProjectDraft(project, restored)), []);
assert.equal(JSON.stringify(authored), before);
const eventIds = Array.from(restored.events, event => event.id);
assert.equal(new Set(eventIds).size, eventIds.length);
assert.deepEqual(Array.from(context.buildSampleEvents(restored), event => event.id), eventIds);
assert.ok(restored.archiveFiles.find(file => file.id === 'af5').linkedEventIds.includes(
    'event-rel-silver-luna-partner-rel-silver-luna-partner-marriage'));
assert.ok(restored.notes.some(note => note.linkedEventIds.length));
assert.ok(restored.sourceLinks.length);
assert.deepEqual(Array.from(context.validateProjectDraft({ id: 'blank', name: 'Blank' }, {})), []);
assert.equal(context.validateProjectDraft({ id: 1, name: 'Blank' }, {}).length, 1);
assert.equal(context.validateProjectDraft({ id: 'blank', name: '   ' }, {}).length, 1);

const folders = restored.archiveFolders;
const root = folders.find(folder => folder.id === 'pawford');
root.parentId = 'fond12';
assert.ok(context.validateProjectDraft(project, restored).some(error => error.includes('folder hierarchy contains a cycle')));
root.parentId = null;

const union = restored.families.find(family => family.id === 'rel-silver-luna-partner');
const secondUnion = structuredClone(union);
secondUnion.id = 'separate-union';
secondUnion.events = [];
secondUnion.parentChildTypes['silver|oliver'] = 'Guardian';
restored.families.push(secondUnion);
restored.events = context.buildSampleEvents(restored);
assert.deepEqual(Array.from(context.validateProjectDraft(project, restored)), []);
secondUnion.parentChildTypes['missing|oliver'] = 'Guardian';
assert.ok(context.validateProjectDraft(project, restored).some(error => error.includes('missing membership')));
delete secondUnion.parentChildTypes['missing|oliver'];
restored.boards[0].diagram.connections[0].source = { nodeId: 'missing', port: 'bottom' };
assert.ok(context.validateProjectDraft(project, restored).some(error => error.includes('.source references missing ID missing')));
console.log('Sample project round trip, stable evidence IDs, family memberships, and board references passed.');
