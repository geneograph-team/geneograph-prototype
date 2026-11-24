'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const context = vm.createContext({
    TextDecoder, TextEncoder, Blob, performance, structuredClone,
    state: { language: 'en' },
    document: { documentElement: { lang: 'en' } },
    t: value => value,
    translateText: value => value
});
for (const file of [
    'shared/genealogy-dates', 'shared/person-name-helpers', 'modules/places/place-record-helpers',
    'shared/relationships', 'modules/family-tree/relationships', 'shared/tree-seed-model',
    'modules/people/person-form-fields', 'modules/people/person-editor', 'modules/people/relationship-editor',
    'modules/archive/archive-sources', 'core/validation', 'modules/archive/archive-documents', 'modules/projects/gedcom-import'
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
assert.deepEqual(Object.values(families[0].parentChildTypes), ['Biological', 'Biological']);
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
const unsupportedPedigree = map(file([
    '0 @I1@ INDI', '0 @I2@ INDI', '1 FAMC @F1@', '2 PEDI sealing',
    '0 @F1@ FAM', '1 HUSB @I1@', '1 CHIL @I2@'
]));
assert.deepEqual(Array.from(unsupportedPedigree.errors), []);
assert.deepEqual(Object.keys(unsupportedPedigree.records.families[0].parentChildTypes), []);
assert.ok(unsupportedPedigree.warnings.some(warning => warning.tag === 'PEDI'));

const localizedDate = context.parseGedcomDate('11 ноя 1894');
assert.equal(localizedDate.valid, true);
assert.equal(localizedDate.value.first.month, 11);
assert.equal(localizedDate.value.originalText, '11 ноя 1894');
for (const text of ['Приблизительно: 1940', 'Приблизительно в 1845', 'Примерно в 1712'])
{
    const date = context.parseGedcomDate(text);
    assert.equal(date.valid, true);
    assert.equal(date.value.dateType, 'About / Circa');
    assert.equal(date.value.originalText, text);
}
assert.equal(context.parseGedcomDate('16 фер 1832').valid, false);

const approximateRange = context.parseGedcomDate('BET ABT 1974 AND ABT 1980');
assert.equal(approximateRange.valid, true);
assert.equal(approximateRange.value.dateType, 'Between');
assert.equal(approximateRange.value.first.year, 1974);
assert.equal(approximateRange.value.second.year, 1980);
assert.equal(approximateRange.value.originalText, 'BET ABT 1974 AND ABT 1980');

const myHeritageRows = [
    '0 @I1@ INDI', '1 NAME Ada /Birth/', '2 SURN Birth', '2 _MARNM Married',
    '1 RESI', '2 EMAIL ada@example.test', '2 ADDR Private address', '3 CITY Private place',
    '1 _UPD timestamp', '1 RIN 1',
    '1 DEAT', '2 DATE 2010', '2 AGE 42',
    '1 EDUC University', '2 DATE 1990', '2 NOTE Education note',
    '1 EVEN', '2 TYPE Departure', '2 DATE 1991', '2 PLAC Departure place',
    '1 OBJE', '2 FILE https://example.test/image.jpg', '2 _FILESIZE 100',
    '1 SOUR @S1@', '2 EVEN DEAT', '3 ROLE Witness', '2 PAGE 7', '2 QUAY 2',
    '2 DATA', '3 DATE 2020', '3 TEXT First', '4 CONC  excerpt',
    '1 SOUR @S1@', '2 PAGE 9', '2 DATA', '3 TEXT Second excerpt',
    '0 @I2@ INDI', '1 NAME Eve /Original/', '2 SURN Original', '2 _MARNM Original',
    '1 OBJE', '2 FILE https://example.test/image.jpg',
    '0 @I3@ INDI', '1 NAME Beatrice /Keep/', '2 SURN Keep',
    '0 @S1@ SOUR', '1 TITL Source title', '1 AUTH Author', '1 PUBL Published',
    '1 TEXT Source', '2 CONT Second line', '1 _TYPE Collection', '1 _MEDI 123',
    '0 @F1@ FAM'
];
const heritage = map(file(['1 SOUR MYHERITAGE', ...myHeritageRows]));
assert.deepEqual(Array.from(heritage.errors), []);
assert.equal(heritage.records.people[0].names.last, 'Married');
assert.equal(heritage.records.people[0].names.maiden, 'Birth');
assert.equal(heritage.records.people[1].names.maiden, undefined);
assert.equal(heritage.records.people[2].names.last, 'Keep');
assert.equal(heritage.onlinePhotoCount, 1);
assert.equal(heritage.records.places.length, 1);
assert.equal(heritage.records.sources[0].title, 'Source title');
assert.equal(heritage.records.sources[0].category, 'online');
assert.match(heritage.records.sources[0].notes, /Source\nSecond line/);
const firstCitation = heritage.records.notes.find(note => note.body.includes('First excerpt'));
const secondCitation = heritage.records.notes.find(note => note.body.includes('Second excerpt'));
assert.match(firstCitation.body, /Page or reference: 7/);
assert.match(secondCitation.body, /Page or reference: 9/);
assert.equal(firstCitation.linkedEventIds[0], heritage.records.events.find(event => event.type === 'death').id);
assert.equal(secondCitation.linkedEventIds.length, 0);
assert.equal(heritage.records.sourceLinks.filter(link => link.targetType === 'person').length, 1);
assert.equal(heritage.records.sourceLinks.filter(link => link.targetType === 'note').length, 2);
assert.ok(heritage.records.events.some(event => event.title === 'Departure' && event.placeText === 'Departure place'));
assert.ok(heritage.records.notes.find(note => note.body === 'Education note').linkedEventIds.length);
assert.equal(heritage.warnings.length, 0);
const otherExporter = map(file(['1 SOUR AgelongTree', '0 @I1@ INDI',
    '1 NAME Ada /Birth/', '2 SURN Birth', '2 _MARNM Married']));
assert.equal(otherExporter.records.people[0].names.last, 'Birth');
assert.equal(otherExporter.records.people[0].names.maiden, undefined);

const familio = map(file([
    '1 SOUR FAMILIO', '0 @I1@ INDI', '1 NAME Ada /Birth/', '2 _MARNM Married',
    '1 BIRT', '2 PLAC Village', '3 MAP', '4 LATI S12.5', '4 LONG W45.25',
    '3 NOTE https://familio.org/settlements/12345678-1234-1234-1234-123456789abc',
    '3 _FAMILIO_GUID 12345678-1234-1234-1234-123456789abc',
    '3 NOTE Research note', '1 DEAT', '2 PLAC Village', '3 MAP', '4 LATI S12.5', '4 LONG W45.25'
]));
assert.deepEqual(Array.from(familio.errors), []);
assert.equal(familio.records.people[0].names.last, 'Married');
assert.equal(familio.records.people[0].names.maiden, 'Birth');
assert.equal(familio.records.places.length, 1);
assert.equal(familio.records.places[0].coordinates.lat, -12.5);
assert.equal(familio.records.places[0].coordinates.lng, -45.25);
assert.equal(familio.records.notes.length, 1);
assert.equal(familio.records.notes[0].body, 'Research note');
assert.equal(familio.records.notes[0].linkedPlaceIds[0], familio.records.places[0].id);
assert.equal(familio.warnings.length, 0);
const coordinateWarnings = map(file([
    '0 @I1@ INDI', '1 BIRT', '2 PLAC Village', '3 MAP', '4 LATI N12', '4 LONG E30',
    '1 DEAT', '2 PLAC Village', '3 MAP', '4 LATI N15', '4 LONG E30',
    '0 @I2@ INDI', '1 BIRT', '2 PLAC Town', '3 MAP', '4 LATI N91', '4 LONG E30'
]));
assert.deepEqual(Array.from(coordinateWarnings.errors), []);
assert.ok(coordinateWarnings.records.places.every(place => place.coordinates === null));
assert.deepEqual(Array.from(coordinateWarnings.warnings, warning => warning.kind),
    ['place-coordinates-conflict', 'place-coordinates-invalid']);

async function verifyAttachments()
{
    const source = parse(file([
        '0 @I1@ INDI', '1 OBJE @M1@', '2 _PRIM Y',
        '1 OBJE @M2@', '1 DEAT', '2 OBJE @M2@',
        '0 @I2@ INDI', '1 OBJE', '2 FILE TREE.GED.FILES\\portrait.jpg',
        '1 OBJE', '2 FILE notes.csv', '1 OBJE', '2 FILE ../unsafe.txt',
        '1 OBJE', '2 FILE ambiguous.txt', '1 OBJE', '2 FILE bad.exe',
        '1 OBJE', '2 FILE unreadable.txt', '1 OBJE', '2 FILE huge.txt',
        '1 OBJE', '2 FILE https://example.test/portrait.jpg',
        '0 @M1@ OBJE', '1 FILE tree.ged.files/portrait.jpg',
        '0 @M2@ OBJE', '1 FILE documents/report.txt'
    ]));
    const references = context.gedcomAttachmentReferences(source);
    assert.equal(references.size, 8);
    const selected = (name, relative, content = 'Readable') => ({
        name, type: 'text/plain', size: content.length, webkitRelativePath: 'Root/' + relative,
        async arrayBuffer() { return new TextEncoder().encode(content).buffer; }
    });
    const portrait = selected('portrait.jpg', 'tree.ged.files/portrait.jpg');
    context.PHOTO_UPLOAD_MAX_BYTES = 10 * 1024 * 1024;
    portrait.slice = () => portrait;
    context.createPhotoUploadDraft = async () => ({
        filename: 'portrait.jpg', src: 'data:image/jpeg;base64,AA==', mimeType: 'image/jpeg', width: 1, height: 1, sizeBytes: 1
    });
    const unreadable = selected('unreadable.txt', 'unreadable.txt');
    unreadable.arrayBuffer = async () => { throw Error('Unavailable'); };
    const huge = selected('huge.txt', 'huge.txt');
    huge.size = 30 * 1024 * 1024;
    const folder = [portrait, selected('portrait.jpg', 'elsewhere/portrait.jpg'),
        selected('report.txt', 'documents/report.txt'), selected('ambiguous.txt', 'one/ambiguous.txt'),
        selected('ambiguous.txt', 'two/ambiguous.txt'), selected('bad.exe', 'bad.exe'), unreadable, huge];
    const matches = await context.matchGedcomAttachments(references, folder, () => true);
    assert.equal(matches.get('ambiguous.txt').status, 'More than one file matches');
    assert.equal(matches.get('../unsafe.txt').status, 'Unsafe file path');
    assert.equal(matches.get('notes.csv').status, 'File not found');
    assert.equal(matches.get('bad.exe').status, 'Unsupported file type');
    assert.equal(matches.get('unreadable.txt').status, 'File could not be read');
    assert.equal(matches.get('huge.txt').status, 'Attachment size or count limit exceeded');
    assert.equal((await context.matchGedcomAttachments(references, folder, () => false)).size, 0);
    const draft = context.mapGedcomImport(source, project, matches, references);
    assert.deepEqual(Array.from(draft.errors), []);
    assert.equal(draft.records.media.length, 1);
    assert.equal(draft.records.media[0].personIds.length, 2);
    assert.equal(draft.records.people[0].primaryPhotoId, draft.records.media[0].id);
    assert.equal(draft.records.archiveFiles.length, 1);
    const document = draft.records.archiveFiles[0];
    assert.equal(document.linkedPersonIds[0], draft.records.people[0].id);
    assert.equal(document.linkedEventIds[0], draft.records.events.find(event => event.type === 'death').id);
    assert.equal(await draft.attachmentAssets.get(document.id).text(), 'Readable');
    assert.equal(draft.attachmentReport.filter(entry => entry.status === 'Imported').length, 2);
    const report = context.gedcomImportReport(draft);
    assert.equal(report.attachmentCount, 2);
    assert.deepEqual(JSON.parse(JSON.stringify(report.rows)), [
        ['People', 2], ['Facts', 1], ['Photos', 1], ['Imported Archive files', 1]
    ]);
    const emptyCounts = context.gedcomImportReport(map(file(['0 @I1@ INDI'])));
    assert.deepEqual(JSON.parse(JSON.stringify(emptyCounts.rows)), [['People', 1]]);
    assert.ok(draft.warnings.some(warning => warning.tag === 'FILE'));
}

verifyAttachments().then(() =>
{
    console.log('GEDCOM decoding, canonical mapping, warnings, attachment matching, and invalid inputs passed.');
}).catch(error =>
{
    console.error(error);
    process.exitCode = 1;
});
