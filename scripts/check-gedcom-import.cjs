'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const context = vm.createContext({
    TextDecoder, performance, structuredClone,
    state: { language: 'en' },
    document: { documentElement: { lang: 'en' } },
    t: value => value,
    translateText: value => value
});
for (const file of [
    'shared/genealogy-dates', 'shared/person-name-helpers', 'modules/places/place-record-helpers',
    'shared/relationships', 'modules/family-tree/relationships', 'shared/tree-seed-model',
    'modules/people/person-form-fields', 'modules/people/person-editor', 'modules/people/relationship-editor',
    'core/validation', 'modules/projects/gedcom-import'
])
{
    const filename = path.join(__dirname, '../src', file + '.js');
    vm.runInContext(fs.readFileSync(filename, 'utf8'), context, { filename });
}

const header = ['0 HEAD', '1 GEDC', '2 VERS 5.5.1', '1 CHAR UTF-8'];
const file = rows => [...header, ...rows, '0 TRLR'].join('\n');
const rows = [
    '0 @I1@ INDI', '1 NAME Мария /Иванова/', '1 BIRT', '2 DATE ABT 1970', '2 PLAC Москва',
    '1 OCCU Archivist', '1 DEAT N', '1 NOTE Person note',
    '0 @I2@ INDI', '1 NAME Ada /Example/', '1 FAMC @F2@', '2 PEDI foster',
    '1 BIRT', '2 DATE BET 1995 AND 1997',
    '0 @I3@ INDI', '1 NAME Robert /Example/', '1 SEX M',
    '0 @F1@ FAM', '1 HUSB @I3@', '1 WIFE @I1@', '1 CHIL @I2@',
    '1 MARR', '2 DATE BEF 1999', '2 PLAC Москва',
    '0 @F2@ FAM', '1 WIFE @I1@',
    '0 @F3@ FAM', '1 HUSB @I3@', '1 WIFE @I1@', '1 MARR N'
];
const source = file(rows);
const project = { id: 'ged-project', name: 'GEDCOM test', createdAt: '2026-01-01T00:00:00Z' };
const parse = value => context.parseGedcomImport(value);
const map = value => context.mapGedcomImport(parse(value), project);
const decoded = context.decodeGedcomImport(Buffer.from('\uFEFF' + source));
const mapped = map(decoded);
assert.deepEqual(Array.from(mapped.errors), []);
const { people, families, places, events } = mapped.records;
assert.equal(people[0].names.first, 'Мария');
assert.equal(people[0].gender, 'unknown');
assert.equal(people[0].livingStatus, 'Living');
assert.equal(people[1].livingStatus, 'Living');
assert.equal(people[0].birth.first.year, 1970);
assert.equal(people[1].birth.first.year, 1995);
assert.equal(people[1].birth.second.year, 1997);
assert.equal(people[0].attributes[0].value, 'Archivist');
assert.equal(places.length, 1);
assert.equal(places[0].name, 'Москва');
assert.equal(families.length, 3);
assert.equal(families[0].partnerBId, families[2].partnerBId);
assert.notEqual(families[0].id, families[2].id);
assert.equal(families[1].partnerAId, '');
assert.equal(families[1].childIds[0], people[1].id);
assert.deepEqual(Object.keys(families[0].parentChildTypes), []);
assert.equal(Object.values(families[1].parentChildTypes)[0], 'Foster');
assert.equal(families[2].relationshipType, 'Unknown relationship');
assert.ok(events.some(event => event.type === 'marriage'));
assert.equal(mapped.records.notes[0].body, 'Person note');
assert.equal(mapped.records.notes[0].linkedPersonIds[0], people[0].id);
assert.ok(!mapped.warnings.some(warning => warning.tag === 'NOTE'));
assert.equal(JSON.stringify(map(decoded).records), JSON.stringify(mapped.records));
const estimated = map(source.replace('ABT 1970', 'EST AUG 1970').replace('1 DEAT N', '1 DEAT Y'));
assert.equal(estimated.records.people[0].birth.dateType, 'About / Circa');
assert.equal(estimated.records.people[0].birth.first.month, 8);
assert.equal(estimated.records.people[0].birth.originalText, 'EST AUG 1970');
assert.equal(estimated.records.people[0].livingStatus, 'Deceased');
assert.ok(!estimated.warnings.some(warning => warning.kind === 'date-text'));
const julian = map(source.replace('ABT 1970', '@#DJULIAN@ 29 MAR 1836')).records.people[0].birth;
assert.equal(julian.calendar, 'Julian');
assert.deepEqual([julian.first.year, julian.first.month, julian.first.day], [1836, 3, 29]);
assert.equal(julian.originalText, '@#DJULIAN@ 29 MAR 1836');
assert.equal(context.parseGedcomDate('ABT @#DJULIAN@ 29 FEB 1900').value.calendar, 'Julian');
assert.equal(context.parseGedcomDate('BET @#DJULIAN@ 1836 AND @#DGREGORIAN@ 1837').valid, false);
const unparsed = map(source.replace('ABT 1970', 'INT 1970 (estimated from census)'));
assert.equal(unparsed.records.people[0].birth.originalText, 'INT 1970 (estimated from census)');
assert.equal(unparsed.records.people[0].birth.state, 'unparsed');
assert.ok(unparsed.warnings.some(warning => warning.tag === 'DATE' && warning.kind === 'date-text'));

const splitConc = Buffer.concat([
    Buffer.from('1 NOTE A'), Buffer.from([0xd0]), Buffer.from('\r\n2 CONC '),
    Buffer.from([0xb5]), Buffer.from('B')
]);
assert.equal(context.decodeGedcomImport(splitConc), '1 NOTE Aе\r\n2 CONC B');
assert.throws(() => context.decodeGedcomImport(Buffer.concat([splitConc, Buffer.from([0xff])])), /valid UTF-8/);
assert.throws(() => context.decodeGedcomImport(Buffer.from(splitConc.toString('latin1').replace('CONC', 'CONT'), 'latin1')), /valid UTF-8/);
const wrappedNote = map(file(['0 @I1@ INDI', '1 NOTE First line', 'Unprefixed note text', '2 CONC Last part']));
assert.deepEqual(Array.from(wrappedNote.errors), []);
assert.equal(wrappedNote.records.notes[0].body, 'First line\nUnprefixed note textLast part');
assert.ok(!wrappedNote.warnings.some(item => ['NOTE', 'CONT', 'CONC'].includes(item.tag)));
const deathNote = map(file([
    '0 @S@ SUBM', '1 NAME Exporter',
    '0 @I1@ INDI', '1 NAME Ada /Example/', '1 _UID external-id',
    '1 DEAT', '2 CAUS Illness', '2 NOTE @N1@',
    '1 OBJE', '2 FILE missing.jpg', '3 FORM jpg',
    '0 @N1@ NOTE First', '1 CONC  part', '1 CONT Second line'
]));
assert.deepEqual(Array.from(deathNote.errors), []);
assert.equal(deathNote.records.people[0].death.cause, 'Illness');
assert.equal(deathNote.records.notes[0].body, 'First part\nSecond line');
assert.equal(deathNote.records.notes[0].linkedEventIds[0], deathNote.records.events.find(event => event.type === 'death').id);
assert.ok(!deathNote.warnings.some(item => ['SUBM', 'NAME', '_UID', 'FORM', 'CAUS', 'NOTE', 'CONC', 'CONT'].includes(item.tag)));
assert.throws(() => parse(file(['0 @I1@ INDI', '1 NOTE First line', '2 invalid tag'])), /Malformed/);
assert.throws(() => context.decodeGedcomImport(Uint8Array.of(0xff)), /valid UTF-8/);
assert.throws(() => context.decodeGedcomImport(new Uint8Array(8 * 1024 * 1024 + 1)), /8 MiB/);
for (const [invalid, diagnostic] of [
    [source.replace('5.5.1', '7.0'), /5.5.1/],
    [source.replace('UTF-8', 'ANSEL'), /UTF-8/],
    [source.replace('1 NAME', '3 NAME'), /hierarchy/],
    [source.replace('0 @I3@ INDI', '0 @I1@ INDI'), /Duplicate/],
    [source.replace('0 @I3@ INDI', '0 INDI'), /missing its GEDCOM ID/],
    [source.replace('1 CHIL @I2@', '1 CHIL @missing@'), /missing or incompatible/],
    [source.replace('1 NOTE Person note', '1 NOTE ' + 'x'.repeat(4100)), /too long/]
])
    assert.throws(() => map(invalid), diagnostic);

assert.ok(map(file([
    '0 @I1@ INDI', '0 @I2@ INDI',
    '0 @F1@ FAM', '1 HUSB @I1@', '1 CHIL @I2@',
    '0 @F2@ FAM', '1 HUSB @I2@', '1 CHIL @I1@'
])).errors.some(error => error.includes('parent cycle')));
const adoption = map(file([
    '0 @I1@ INDI', '0 @I2@ INDI', '0 @I3@ INDI',
    '1 FAMC @F1@', '2 PEDI adopted', '1 ADOP', '2 FAMC @F1@', '3 ADOP WIFE',
    '0 @F1@ FAM', '1 HUSB @I1@', '1 WIFE @I2@', '1 CHIL @I3@'
]));
assert.deepEqual(Array.from(adoption.errors), []);
const adoptedFamily = adoption.records.families[0];
assert.deepEqual(Object.entries(adoptedFamily.parentChildTypes),
    [[adoptedFamily.partnerBId + '|' + adoptedFamily.childIds[0], 'Adoptive']]);

assert.throws(() => map(file([
    '0 @I1@ INDI', '0 @I2@ INDI', '1 FAMC @F1@', '2 STAT disproven',
    '0 @F1@ FAM', '1 HUSB @I1@', '1 CHIL @I2@'
])), /child claims disagree/);
const mediaInput = parse(file([
    '0 @I1@ INDI', '1 OBJE', '2 FILE tree.ged.files/portrait.jpg', '2 _PRIM Y',
    '0 @I2@ INDI', '1 OBJE', '2 FILE tree.ged.files/portrait.jpg',
    '1 OBJE', '2 FILE https://example.test/portrait.jpg'
]));
const mediaDraft = context.mapGedcomImport(mediaInput,
    { ...project, createdAt: '2026-01-01T00:00:00Z', modifiedAt: '2026-01-01T00:00:00Z' },
    new Map([['tree.ged.files/portrait.jpg', {
        filename: 'portrait.jpg', src: 'data:image/jpeg;base64,AA==', mimeType: 'image/jpeg', width: 1, height: 1, sizeBytes: 1
    }]]));
assert.deepEqual(Array.from(mediaDraft.errors), []);
assert.equal(mediaDraft.records.media.length, 1);
assert.equal(mediaDraft.records.media[0].personIds.length, 2);
assert.equal(mediaDraft.records.people[0].primaryPhotoId, mediaDraft.records.media[0].id);
assert.equal(mediaDraft.missingPhotos, 0);
assert.ok(mediaDraft.warnings.some(warning => warning.tag === 'FILE' && warning.count === 1));
console.log('GEDCOM decoding, canonical mapping, warnings, and invalid inputs passed.');
