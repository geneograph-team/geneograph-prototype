'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const context = vm.createContext({
    TextDecoder, TextEncoder, Blob, File, URL, Response, AbortSignal, performance, structuredClone,
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
    const filename = path.join(__dirname, '../../src', file + '.js');
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
const interpreted = map(source.replace('ABT 1970', 'INT 1970 (estimated from census)'));
assert.equal(interpreted.records.people[0].birth.originalText, 'INT 1970 (estimated from census)');
assert.equal(interpreted.records.people[0].birth.dateType, 'Calculated');
assert.equal(interpreted.records.people[0].birth.first.year, 1970);
assert.ok(!interpreted.warnings.some(warning => warning.kind === 'date-text'));
assert.equal(context.parseGedcomDate('CAL 2 MAR 1870').value.dateType, 'Calculated');
assert.equal(context.parseGedcomDate('FROM 1904 TO 1915').valid, false);
assert.match(context.genealogyDateDisplay(interpreted.records.people[0].birth), /^Calculated /);


const richNotes = map(file([
    '1 SOUR MYHERITAGE',
    '0 @I1@ INDI', '1 NAME Ada /Example/', '1 NOTE @N1@',
    '1 OCCU Researcher', '2 NOTE <p>Archive <em>extract</em></p>',
    '1 SOUR @S1@', '2 PAGE <span>Record &amp; page</span>',
    '2 DATA', '3 TEXT <p><strong>Evidence</strong> <a href="https://example.test/record?a=1&amp;b=2">link</a></p>',
    '0 @I2@ INDI', '1 NOTE @N1@',
    '0 @N1@ NOTE <p style="text-align:left;"><strong><span style="font-family:Calibri;font-size:13pt">Архив &amp; ',
    '1 CONC опись</span></strong><br />запись&nbsp;№ 29</p>',
    '1 CONT <p><u>Second</u> &lt;literal&gt; &#x41;</p><ul><li>One</li><li><i>Two</i></li></ul><p>&nbsp;</p>',
    '0 @S1@ SOUR', '1 TITL <b>Archive</b>', '1 TEXT <p>Source &amp; text <a href="https://example.test/source">record</a></p>'
]));
assert.deepEqual(Array.from(richNotes.errors), []);
const importedRich = richNotes.records.notes[0];
assert.equal(importedRich.title, 'Архив & опись');
assert.equal(importedRich.body, 'Архив & опись\nзапись № 29\nSecond <literal> A\nOne\nTwo');
assert.equal(importedRich.bodyFormat, 'quill-delta-v1');
assert.equal(importedRich.bodyDelta.ops.map(op => op.insert).join(''), importedRich.body + '\n');
assert.ok(importedRich.bodyDelta.ops.some(op => op.attributes?.bold && op.insert.includes('Архив')));
assert.ok(importedRich.bodyDelta.ops.some(op => op.attributes?.underline && op.insert === 'Second'));
assert.equal(importedRich.bodyDelta.ops.filter(op => op.attributes?.list === 'bullet').length, 2);
assert.equal(importedRich.linkedPersonIds.length, 2);
assert.equal(richNotes.records.people[0].attributes[0].notes, 'Archive extract');
assert.equal(richNotes.records.sources[0].title, 'Archive');
const citationRich = richNotes.records.sources[0];
assert.ok(citationRich.notes.includes('Source & text record (https://example.test/source)'));
assert.ok(citationRich.notes.includes('Page or reference: Record & page'));
assert.ok(citationRich.notes.includes('Evidence link (https://example.test/record?a=1&b=2)'));
assert.equal(citationRich.url, 'https://example.test/record?a=1&b=2');
assert.equal(richNotes.records.notes.length, 2);
assert.ok(!richNotes.records.notes.some(note => note.body.includes('Evidence')));
assert.ok(richNotes.warnings.some(warning => warning.kind === 'text-format'));

// MyHeritage evidence can contain HTML delimiters escaped twice. Reconstruct
// continuations before unwrapping and preserve literal unknown placeholders.
const escapedEvidence = map(file([
    '1 SOUR MYHERITAGE', '0 @I1@ INDI', '1 NOTE Literal &amp;lt;br&amp;gt; example',
    '1 SOUR @S1@', '2 DATA', '3 TEXT Example person&amp;lt;br&amp;',
    '4 CONC gt;Пол: мужчина&amp;lt;br&amp;gt;Рождение: 1900',
    '4 CONC &amp;lt;br /&amp;gt;Page: 139&amp;lt;br&amp;gt;&amp;lt;private&amp;gt;',
    '4 CONC &amp;lt;br&amp;gt;&amp;lt;a id=\'household\'&amp;gt;Household&amp;lt;/a&amp;gt;',
    '4 CONC &amp;lt;br&amp;gt;&amp;lt;a href=&amp;quot;https://example.test/record?a=1&amp;amp;b=2&amp;quot;&amp;gt;Record&amp;lt;/a&amp;gt;',
    '4 CONC &amp;lt;br&amp;gt;A&amp;nbsp;B',
    '0 @S1@ SOUR', '1 TITL Register', '1 TEXT First&lt;br&gt;Second'
]));
assert.deepEqual(Array.from(escapedEvidence.errors), []);
assert.equal(escapedEvidence.records.notes[0].body, 'Literal &amp;lt;br&amp;gt; example');
const escapedSource = escapedEvidence.records.sources[0];
assert.equal(escapedSource.notes, 'First\nSecond\n\nExample person\nПол: мужчина\nРождение: 1900\nPage: 139\n<private>\nHousehold\nRecord (https://example.test/record?a=1&b=2)\nA B');
assert.equal(escapedSource.url, 'https://example.test/record?a=1&b=2');
const unsafeEscapedEvidence = map(file([
    '0 @I1@ INDI', '1 SOUR @S1@', '2 TEXT First&amp;lt;br&amp;gt;',
    '3 CONC &amp;lt;script&amp;gt;bad()&amp;lt;/script&amp;gt;',
    '3 CONC &amp;lt;a href=&amp;quot;javascript:bad()&amp;quot;&amp;gt;Safe label&amp;lt;/a&amp;gt;',
    '0 @S1@ SOUR', '1 TITL Register'
]));
assert.deepEqual(Array.from(unsafeEscapedEvidence.errors), []);
assert.equal(unsafeEscapedEvidence.records.sources[0].notes, 'First\nSafe label');
assert.equal(unsafeEscapedEvidence.records.sources[0].url, '');
assert.ok(unsafeEscapedEvidence.warnings.some(warning => warning.kind === 'text-format'));
const literalEvidence = map(file([
    '0 @I1@ INDI', '1 SOUR @S1@', '2 TEXT A &amp; B &amp;lt;private&amp;gt; and 2 &lt; 3',
    '0 @S1@ SOUR', '1 TITL Register'
]));
assert.equal(literalEvidence.records.sources[0].notes, 'A &amp; B &amp;lt;private&amp;gt; and 2 &lt; 3');


const normalizedPlaces = map(file([
    '0 @I1@ INDI', '1 BIRT', '2 PLAC Exampletown, County, Polska',
    '3 NOTE Place evidence', '1 DEAT', '2 PLAC Exampletown, County, Poland',
    '0 @I2@ INDI', '1 BIRT', '2 PLAC Exampletown, Other County, Poland',
    '1 DEAT', '2 PLAC Exampletown, 50.0, 22.0',
    '0 @I3@ INDI', '1 BIRT', '2 PLAC Exampletown, 50.1, 22.1',
    '1 DEAT', '2 PLAC Exampletown, 95.0, 22.0',
    '0 @I4@ INDI', '1 BIRT', '2 PLAC Exampletown, 50.0, 22.0',
    '3 MAP', '4 LATI N50.2', '4 LONG E22.2'
]));
assert.deepEqual(Array.from(normalizedPlaces.errors), []);
assert.equal(normalizedPlaces.records.places.length, 5);
const normalizedPlace = normalizedPlaces.records.places[0];
assert.equal(normalizedPlace.name, 'Exampletown, County, Polska');
assert.deepEqual(Array.from(normalizedPlace.alternativeNames), ['Exampletown, County, Poland']);
assert.equal(normalizedPlaces.records.people[0].birth.placeId, normalizedPlaces.records.people[0].death.placeId);
assert.equal(normalizedPlaces.records.notes[0].linkedPlaceIds[0], normalizedPlace.id);
assert.equal(normalizedPlace.createdAt, project.createdAt);
assert.equal(normalizedPlaces.records.places.find(place => place.name === 'Exampletown, 50.0, 22.0').coordinates, null);
assert.equal(normalizedPlaces.records.places.find(place => place.name === 'Exampletown, 50.1, 22.1').coordinates.lat, 50.1);
assert.ok(normalizedPlaces.warnings.some(warning => warning.kind === 'place-coordinates-conflict'));
assert.ok(normalizedPlaces.warnings.some(warning => warning.kind === 'place-coordinates-invalid'));
assert.equal(context.placeCountryId({name:'Kraków, Polska'}), 'PL');
assert.equal(context.placeCountryId({name:'Warsaw, Poland'}), 'PL');
assert.equal(context.placeCountryId({name:'Место, Украина'}), 'UA');
assert.equal(context.placeCountryId({name:'Место, Харьковская обл.'}), 'unknown');
assert.equal(context.placeCountryId({name:'Москва, СССР'}), 'history:ussr');
assert.equal(context.placeCountryId({name:'Место, Россия (Region, Russia)'}), 'RU');
assert.equal(context.placeCountryId({name:'Место, Россия (Ukraine)'}), 'unknown');
assert.equal(context.placeContext({name:'Poland'}).countryOnly, true);
assert.equal(context.placeContext({name:'Polska (Poland)'}).countryOnly, true);
assert.equal(context.placeContext({name:'Example cemetery, Poland'}).nonSettlement, true);
assert.equal(context.placeContext({name:'с. Пример, Польша'}).settlementHint, true);
assert.equal(context.placeCountryFilterId('Польша'), 'PL');
assert.equal(context.placeCountryLabel('PL', 'ru'), 'Польша');
assert.equal(normalizedPlaces.placeCoordinateReviewIds.length, 2);
assert.equal(context.placeContext({name:'Харьковская обл.'}).administrative, true);
assert.deepEqual(Array.from(context.placeNameParts({name:'Village (old, new), County, Poland'})), ['Village (old, new)', 'County', 'Poland']);

const literalNotes = map(file(['0 @I1@ INDI', '1 NOTE 2 < 3; <placeholder>; A & B &amp; C']));
assert.equal(literalNotes.records.notes[0].body, '2 < 3; <placeholder>; A & B &amp; C');
assert.equal(literalNotes.records.notes[0].bodyDelta, null);
const unsafeNotes = map(file(['0 @I1@ INDI',
    '1 NOTE <p onclick="bad()">Safe <script>bad()</script><img src="https://example.test/x" onerror="bad()">',
    '2 CONC <a href="jav&#x61;script:bad()">click</a> <b>bold</p>',
    '1 NOTE <style>hidden</style><iframe src="https://example.test/y">hidden</iframe>'
]));
assert.deepEqual(Array.from(unsafeNotes.errors), []);
assert.equal(unsafeNotes.records.notes.length, 1);
assert.equal(unsafeNotes.records.notes[0].body, 'Safe click bold');
assert.ok(!unsafeNotes.records.notes[0].bodyDelta.ops.some(op => op.attributes?.link));
assert.ok(unsafeNotes.warnings.some(warning => warning.kind === 'text-format'));
const familyRich = map(file([
    '0 @I1@ INDI', '0 @I2@ INDI', '0 @F1@ FAM', '1 HUSB @I1@', '1 WIFE @I2@',
    '1 ENGA', '2 DATE 1890', '2 NOTE <p><b>First</b></p>', '2 NOTE @N1@',
    '0 @N1@ NOTE <ol><li>Second</li></ol>'
]));
assert.deepEqual(Array.from(familyRich.errors), []);
assert.equal(familyRich.records.notes[0].body, '1890\n\nFirst\n\nSecond');
assert.equal(familyRich.records.notes[0].bodyDelta.ops.map(op => op.insert).join(''), '1890\n\nFirst\n\nSecond\n');
assert.equal(familyRich.records.notes[0].bodyDelta.ops.at(-1).attributes.list, 'ordered');

const onlyReferencedFamily = map(file([
    '0 @I1@ INDI', '0 @I2@ INDI', '0 @F1@ FAM', '1 HUSB @I1@', '1 WIFE @I2@',
    '1 ENGA', '2 NOTE @N1@', '0 @N1@ NOTE <p><b>Referenced</b></p>'
]));
assert.deepEqual(Array.from(onlyReferencedFamily.errors), []);
assert.equal(onlyReferencedFamily.records.notes[0].body, 'Engagement\n\nReferenced');
assert.equal(onlyReferencedFamily.records.notes[0].bodyDelta.ops.map(op => op.insert).join(''), 'Engagement\n\nReferenced\n');

const familyEventNotes = map(file([
    '0 @I1@ INDI', '0 @I2@ INDI', '0 @F1@ FAM', '1 HUSB @I1@', '1 WIFE @I2@',
    '1 MARR', '2 DATE 1890', '1 ENGA', '2 DATE 1889', '2 PLAC Hall',
    '2 NOTE First', '3 CONC  detail', '2 RESN confidential'
]));
assert.deepEqual(Array.from(familyEventNotes.errors), []);
assert.equal(familyEventNotes.warnings.length, 0);
assert.equal(familyEventNotes.records.families[0].events.length, 1);
const engagementNote = familyEventNotes.records.notes[0];
assert.equal(engagementNote.title, 'Engagement');
assert.equal(engagementNote.body, '1889\n\nHall\n\nFirst detail');
assert.equal(engagementNote.linkedPersonIds.length, 2);
assert.equal(engagementNote.linkedPlaceIds.length, 1);
assert.equal(engagementNote.importedRestriction, 'confidential');

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
assert.throws(() => context.decodeGedcomImport(new Uint8Array(64 * 1024 * 1024 + 1)), /64 MiB/);
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
assert.equal(heritage.records.sources.length, 2);
const firstCitation = heritage.records.sources.find(source => source.notes.includes('First excerpt'));
const secondCitation = heritage.records.sources.find(source => source.notes.includes('Second excerpt'));
assert.match(firstCitation.notes, /Page or reference: 7/);
assert.match(firstCitation.notes, /Citation quality \(GEDCOM\): 2/);
assert.match(secondCitation.notes, /Page or reference: 9/);
assert.equal(heritage.records.sourceLinks.find(link => link.sourceId === firstCitation.id && link.targetType === 'event').targetId,
    heritage.records.events.find(event => event.type === 'death').id);
assert.ok(!heritage.records.sourceLinks.some(link => link.sourceId === secondCitation.id && link.targetType === 'event'));
assert.equal(heritage.records.sourceLinks.filter(link => link.targetType === 'person').length, 2);
assert.equal(heritage.records.sourceLinks.filter(link => link.targetType === 'note').length, 0);
assert.equal(heritage.records.notes.length, 1);
assert.ok(heritage.records.events.some(event => event.title === 'Departure' && event.placeText === 'Departure place'));
assert.ok(heritage.records.notes.find(note => note.body === 'Education note').linkedEventIds.length);
assert.equal(heritage.warnings.length, 0);

const citationRows = [
    '1 SOUR MYHERITAGE',
    '0 @I1@ INDI', '1 NOTE @N1@', '1 SOUR @S1@',
    '1 BIRT', '2 DATE 1900', '2 SOUR @S1@', '3 PAGE https://example.test/match/1', '3 DATA',
    '4 TEXT <b>Match</b> evidence', '3 QUAY 2',
    '1 DEAT', '2 DATE 1970', '2 SOUR @S1@', '3 PAGE https://example.test/match/1', '3 DATA',
    '4 TEXT <b>Match</b> evidence', '3 QUAY 2',
    '1 SOUR @S1@', '2 PAGE https://example.test/match/1', '2 DATA', '3 TEXT Different excerpt', '2 QUAY 2',
    '1 SOUR @S1@', '2 PAGE https://example.test/match/1', '2 DATA', '3 TEXT <b>Match</b> evidence', '2 QUAY 1',
    '0 @I2@ INDI', '1 SOUR @S1@',
    '1 SOUR @S1@', '2 PAGE https://example.test/match/1', '2 DATA', '3 TEXT <b>Match</b>',
    '4 CONC  evidence', '2 QUAY 2',
    '1 SOUR @S1@', '2 PAGE https://example.test/match/2', '2 DATA', '3 TEXT Separate record',
    '1 SOUR @S2@', '2 PAGE https://example.test/match/1', '2 DATA', '3 TEXT <b>Match</b> evidence', '2 QUAY 2',
    '1 SOUR @S2@', '2 PAGE https://example.test/a', '2 TEXT https://example.test/b',
    '1 SOUR @S2@', '2 PAGE javascript:alert(1)', '2 TEXT <a href="https://user:secret@example.test">Unsafe</a>',
    '1 SOUR @S2@', '2 PAGE <a href="https://example.test/locator">Record locator</a>',
    '1 SOUR @S2@', '2 PAGE Book 3', '2 NOTE @N1@',
    '0 @N1@ NOTE <b>Genuine research note</b>',
    '0 @S1@ SOUR', '1 TITL Family website', '1 AUTH Provider', '1 _TYPE Smart Matching',
    '1 PUBL Original reference', '1 TEXT General provenance',
    '0 @S2@ SOUR', '1 TITL Family website', '1 _TYPE Discovery',
    '0 @S3@ SOUR', '1 TITL Standalone source'
];
const citationMapped = map(file(citationRows));
assert.deepEqual(Array.from(citationMapped.errors), []);
assert.equal(citationMapped.records.sources.length, 11);
assert.equal(citationMapped.records.notes.length, 1);
assert.equal(citationMapped.records.notes[0].body, 'Genuine research note');
assert.equal(citationMapped.records.notes[0].bodyFormat, 'quill-delta-v1');
assert.equal(citationMapped.records.notes[0].linkedPersonIds.length, 2);
const citationSources = citationMapped.records.sources;
const citationLinks = citationMapped.records.sourceLinks;
const citationPeople = citationMapped.records.people;
const shared = citationSources.find(source => source.notes === 'General provenance\n\nSource classification: Smart Matching');
assert.equal(citationLinks.filter(link => link.sourceId === shared.id && link.targetType === 'person').length, 2);
const matched = citationSources.find(source => source.notes.includes('Smart Matching') && source.notes.includes('Match evidence')
    && source.notes.includes('Citation quality (GEDCOM): 2'));
assert.equal(matched.url, 'https://example.test/match/1');
assert.equal(matched.providedBy, 'Provider');
assert.equal(matched.reference, 'Original reference');
assert.equal(matched.category, 'online');
assert.equal(citationLinks.filter(link => link.sourceId === matched.id && link.targetType === 'person').length, 2);
assert.equal(citationLinks.filter(link => link.sourceId === matched.id && link.targetType === 'event').length, 2);
const separate = citationSources.find(source => source.notes.includes('Separate record'));
assert.equal(separate.url, 'https://example.test/match/2');
assert.deepEqual(Array.from(citationLinks.filter(link => link.sourceId === separate.id).map(link => link.targetId)), [citationPeople[1].id]);
assert.ok(citationSources.some(source => source.notes.includes('Different excerpt')));
assert.ok(citationSources.some(source => source.notes.includes('Citation quality (GEDCOM): 1')));
assert.ok(citationSources.some(source => source.notes.includes('Discovery') && source.notes.includes('Match evidence')));
const ambiguousUrl = citationSources.find(source => source.notes.includes('https://example.test/a'));
assert.equal(ambiguousUrl.url, '');
assert.ok(ambiguousUrl.notes.includes('https://example.test/b'));
const unsafeUrl = citationSources.find(source => source.notes.includes('javascript:alert(1)'));
assert.equal(unsafeUrl.url, '');
assert.ok(unsafeUrl.notes.includes('Unsafe'));
assert.equal(context.gedcomCitationUrl([{ body: 'javascript:https://example.test/embedded', ops: null }]), '');
assert.equal(context.gedcomCitationUrl([{ body: 'See (https://example.test/record)', ops: null }]), 'https://example.test/record');
assert.equal(context.gedcomCitationUrl([{ body: 'https://example.test/a https://example.test/b', ops: null }]), '');
const anchorUrl = citationSources.find(source => source.notes.includes('Record locator'));
assert.equal(anchorUrl.url, 'https://example.test/locator');
assert.ok(anchorUrl.notes.includes('Record locator (https://example.test/locator)'));
assert.ok(citationSources.some(source => source.title === 'Standalone source'));
assert.ok(!citationSources.some(source => source.notes === 'Source classification: Discovery'));
const explicitNoteSource = citationSources.find(source => source.notes.includes('Book 3'));
assert.ok(citationLinks.some(link => link.sourceId === explicitNoteSource.id
    && link.targetType === 'note' && link.targetId === citationMapped.records.notes[0].id));
assert.equal(JSON.stringify(map(file(citationRows)).records), JSON.stringify(citationMapped.records));
const citationFamily = map(file([
    '0 @I1@ INDI', '0 @I2@ INDI', '0 @F1@ FAM', '1 HUSB @I1@', '1 WIFE @I2@',
    '1 MARR', '2 DATE 1900', '1 SOUR @S1@', '2 EVEN MARR', '2 PAGE Marriage record',
    '1 SOUR @S1@', '2 PAGE Family record', '0 @S1@ SOUR', '1 TITL Register'
]));
assert.deepEqual(Array.from(citationFamily.errors), []);
assert.equal(citationFamily.records.sources.length, 2);
assert.equal(citationFamily.records.notes.length, 0);
assert.equal(citationFamily.records.sourceLinks.length, 1);
assert.equal(citationFamily.records.sourceLinks[0].targetType, 'event');
assert.equal(citationFamily.records.sourceLinks[0].targetId, citationFamily.records.events.find(event => event.type === 'marriage').id);
assert.ok(citationFamily.warnings.some(warning => warning.kind === 'citation-target'));

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

const additionalTags = map(file([
    '1 SOUR MYHERITAGE',
    '0 @I1@ INDI', '1 NAME Ada /Example/', '2 NICK A', '2 _FORMERNAME Old name', '2 _AKA Alias',
    '1 DSCR Description', '2 CONC  continued', '1 DSCR', '1 NATI Origin', '2 NOTE Origin evidence',
    '1 TITL Title text',
    '0 @I2@ INDI', '1 NAME Robert /Example/',
    '0 @I3@ INDI', '1 NAME Child /Example/',
    '0 @F1@ FAM', '1 HUSB @I2@', '1 WIFE @I1@', '1 CHIL @I3@',
    '1 MARR', '2 DATE 1990', '1 ANUL', '1 NCHI 3', '1 NOTE Family', '2 CONC  history'
]));
assert.deepEqual(Array.from(additionalTags.errors), []);
assert.equal(additionalTags.warnings.length, 0);
const additional = additionalTags.records;
assert.equal(additional.people[0].profile.alternativeNames, 'A; Old name; Alias');
assert.equal(additional.notes.find(note => note.title === 'Physical description').body, 'Description continued');
assert.ok(additional.events.some(event => event.title === 'National origin' && event.description === 'Origin'));
assert.ok(additional.events.some(event => event.title === 'Title' && event.description === 'Title text'));
assert.ok(additional.notes.find(note => note.body === 'Origin evidence').linkedEventIds.length);
assert.equal(additional.notes.find(note => note.body === 'Family history').linkedPersonIds.length, 2);
assert.equal(additional.families[0].childIds.length, 1);
assert.equal(additional.families[0].relationshipType, 'Annulled');
assert.equal(additional.families[0].relationshipStatus, 'annulled');
assert.ok(additional.events.some(event => event.title === 'Recorded child count' && event.description === '3'));
assert.ok(additional.events.some(event => event.title === 'Annulment'));
assert.ok(additional.events.some(event => event.title === 'Marriage'));

const restricted = map(file([
    '0 @I1@ INDI', '1 RESN privacy', '1 BIRT', '2 DATE 1990', '2 RESN confidential',
    '1 CHR', '2 DATE 1991', '2 PLAC Chapel', '2 RESN locked',
    '1 BAPM', '2 DATE 1992', '2 RESN privacy',
    '0 @I2@ INDI',
    '0 @F1@ FAM', '1 RESN confidential', '1 HUSB @I1@', '1 WIFE @I2@',
    '1 MARR', '2 DATE 2010', '2 RESN locked'
]));
assert.deepEqual(Array.from(restricted.errors), []);
assert.equal(restricted.warnings.length, 0);
assert.equal(restricted.records.people[0].importedRestriction, 'privacy');
assert.equal(restricted.records.people[0].birth.importedRestriction, 'confidential');
assert.equal(restricted.records.people[0].attributes[0].importedRestriction, 'locked');
assert.equal(restricted.records.people[0].events[0].importedRestriction, 'privacy');
assert.equal(restricted.records.families[0].importedRestriction, 'confidential');
assert.equal(restricted.records.families[0].events[0].importedRestriction, 'locked');
assert.ok(restricted.records.events.some(event => event.type === 'customFact'
    && event.title === 'Christening' && event.first.year === 1991 && event.placeText === 'Chapel'));
assert.ok(restricted.records.events.some(event => event.type === 'baptism' && event.first.year === 1992));

const periods = map(file([
    '0 @I1@ INDI', '1 EDUC School', '2 DATE FROM 1 SEP 2020 TO 22 JUN 2023',
    '1 OCCU Job', '2 DATE FROM 6 NOV 2022', '1 OCCU Earlier job', '2 DATE TO 2019',
    '1 EVEN', '2 TYPE Other', '2 DATE FROM 2020 TO 2023'
]));
assert.deepEqual(Array.from(periods.errors), []);
const [educationPeriod, occupationStart, occupationEnd, customPeriod] = periods.records.people[0].attributes;
assert.equal(educationPeriod.fromDate.first.year, 2020);
assert.equal(educationPeriod.toDate.first.day, 22);
assert.equal(occupationStart.fromDate.first.month, 11);
assert.equal(occupationStart.toDate, null);
assert.equal(occupationEnd.fromDate, null);
assert.equal(occupationEnd.toDate.first.year, 2019);
assert.equal(customPeriod.date.state, 'unparsed');
assert.equal(periods.warnings.find(warning => warning.kind === 'date-text').count, 1);


// MyHeritage photo identity and face positions belong to the direct person
// OBJE, not filenames. Deliberately place cutouts before their original.
const mhOriginal = 'family.jpg';
const mhCutoutA = 'face-a.jpg';
const mhCutoutB = 'face-b.jpg';
const mhPhotoRows = (original, cropA, cropB, positionA = '100 20 300 220', positionB = '500 100 700 300') => [
    '1 SOUR MYHERITAGE',
    '0 @I1@ INDI', '1 OBJE', '2 FILE ' + cropA, '2 _PHOTO_RIN C1', '2 _CUTOUT Y',
    '2 _PARENTRIN P1', '2 _PRIM Y', '2 _PERSONALPHOTO Y',
    '1 OBJE', '2 FILE ' + original, '2 _PHOTO_RIN P1', '2 _PARENTPHOTO Y',
    '2 TITL Family photo', '2 _POSITION ' + positionA, '2 _PRIM_CUTOUT Y',
    '0 @I2@ INDI', '1 OBJE', '2 FILE ' + cropB, '2 _PHOTO_RIN C2', '2 _CUTOUT Y',
    '2 _PARENTRIN P1', '2 _PRIM Y',
    '1 OBJE', '2 FILE ' + original, '2 _PHOTO_RIN P1', '2 _PARENTPHOTO Y',
    '2 _POSITION ' + positionB, '2 _PRIM_CUTOUT Y'
];
function mhPhotoDraft(input, missing = [])
{
    const refs = context.gedcomAttachmentReferences(input);
    const matches = new Map([...refs].filter(([key]) => !missing.includes(key)).map(([key, ref]) =>
    {
        const file = { name: key, size: 1, type: 'image/jpeg' };
        return [key, { ...ref, file, found: true, status: 'Ready to import',
            photo: { filename: key, src: 'data:image/jpeg;base64,AA==', mimeType: 'image/jpeg',
                width: key === mhOriginal ? 1000 : 200, height: key === mhOriginal ? 400 : 200, sizeBytes: 1 } }];
    }));
    return context.mapGedcomImport(input, project, matches, refs);
}
const mhPhotoInput = parse(file(mhPhotoRows(mhOriginal, mhCutoutA, mhCutoutB)));
const mhPhotoMapped = mhPhotoDraft(mhPhotoInput);
assert.deepEqual(Array.from(mhPhotoMapped.errors), []);
assert.equal(mhPhotoMapped.records.media.length, 1);
const mhPhoto = mhPhotoMapped.records.media[0];
const [mhPersonA, mhPersonB] = mhPhotoMapped.records.people;
assert.equal(mhPhoto.title, 'Family photo');
assert.deepEqual(Array.from(mhPhoto.personIds), [mhPersonA.id, mhPersonB.id]);
assert.deepEqual(JSON.parse(JSON.stringify(mhPhoto.personRegions[mhPersonA.id])), { x: .1, y: .05, width: .2, height: .5 });
assert.deepEqual(JSON.parse(JSON.stringify(mhPhoto.personRegions[mhPersonB.id])), { x: .5, y: .25, width: .2, height: .5 });
assert.equal(mhPersonA.primaryPhotoId, mhPhoto.id);
assert.equal(mhPersonB.primaryPhotoId, mhPhoto.id);
assert.equal(mhPhotoMapped.attachmentReport.filter(entry => entry.status === 'Consolidated portrait crop').length, 2);
const mhMissing = mhPhotoDraft(mhPhotoInput, [mhOriginal]);
assert.deepEqual(Array.from(mhMissing.errors), []);
assert.equal(mhMissing.records.media.length, 2);
assert.equal(mhMissing.attachmentReport.filter(entry => entry.status === 'Imported fallback portrait').length, 2);
const mhInvalid = mhPhotoDraft(parse(file(mhPhotoRows(mhOriginal, mhCutoutA, mhCutoutB, '100 20 300 500'))));
assert.deepEqual(Array.from(mhInvalid.errors), []);
assert.equal(mhInvalid.records.media.length, 2);
assert.equal(mhInvalid.records.people[0].primaryPhotoId, mhInvalid.records.media.find(photo => photo.filename === mhCutoutA).id);
assert.equal(mhInvalid.records.people[1].primaryPhotoId, mhInvalid.records.media.find(photo => photo.filename === mhOriginal).id);
const mhNoPosition = mhPhotoDraft(parse(file(mhPhotoRows(mhOriginal, mhCutoutA, mhCutoutB)
    .filter(row => row !== '2 _POSITION 100 20 300 220'))));
assert.deepEqual(Array.from(mhNoPosition.errors), []);
assert.equal(mhNoPosition.records.media.length, 2);
assert.equal(mhNoPosition.records.people[0].primaryPhotoId, mhNoPosition.records.media.find(photo => photo.filename === mhCutoutA).id);
const mhAmbiguous = mhPhotoDraft(parse(file([...mhPhotoRows(mhOriginal, mhCutoutA, mhCutoutB),
    '1 OBJE', '2 FILE similar.jpg', '2 _PHOTO_RIN P1', '2 _POSITION 0 0 100 100'])));
assert.deepEqual(Array.from(mhAmbiguous.errors), []);
assert.equal(mhAmbiguous.records.media.length, 4);
const mhUnrelated = mhPhotoDraft(parse(file([...mhPhotoRows(mhOriginal, mhCutoutA, mhCutoutB),
    '1 OBJE', '2 FILE family-copy.jpg', '2 _PHOTO_RIN unrelated'])));
assert.equal(mhUnrelated.records.media.length, 2);


// Imported collections are ordinary records, built only from the final
// detached media/note collections, not attachment references or citations.
function assertImportedCollections(draft, name = 'Imported')
{
    assert.deepEqual(Array.from(draft.errors), []);
    const { records } = draft;
    assert.equal(records.albums.length, Number(records.media.length > 0));
    assert.equal(records.noteCollections.length, Number(records.notes.length > 0));
    if (records.media.length)
    {
        const album = records.albums[0];
        assert.equal(album.projectId, draft.project.id);
        assert.equal(album.name, name);
        assert.equal(album.description, '');
        assert.equal(album.createdAt, draft.project.createdAt);
        for (const photo of records.media) assert.deepEqual(Array.from(photo.albumIds), [album.id]);
    }
    if (records.notes.length)
    {
        const collection = records.noteCollections[0];
        assert.equal(collection.projectId, draft.project.id);
        assert.equal(collection.name, name);
        assert.equal(collection.description, '');
        for (const note of records.notes) assert.deepEqual(Array.from(note.collectionIds), [collection.id]);
    }
}
const collectionInput = parse(file([
    '0 @I1@ INDI', '1 NOTE First note', '1 NOTE @N1@',
    '1 OBJE', '2 FILE portrait.jpg', '2 _PRIM Y',
    '0 @I2@ INDI', '1 NOTE @N1@', '0 @N1@ NOTE Shared note'
]));
const collectionRefs = context.gedcomAttachmentReferences(collectionInput);
const collectionFile = { name: 'portrait.jpg', size: 1, type: 'image/jpeg' };
const collectionMatches = new Map([...collectionRefs].map(([key, ref]) => [key, {
    ...ref, file: collectionFile, status: 'Ready to import', found: true,
    photo: { filename: 'portrait.jpg', src: 'data:image/jpeg;base64,AA==',
        mimeType: 'image/jpeg', width: 100, height: 100, sizeBytes: 1 }
}]));
const collectionDraft = context.mapGedcomImport(collectionInput, project, collectionMatches, collectionRefs);
assertImportedCollections(collectionDraft);
assert.equal(collectionDraft.records.media.length, 1);
assert.equal(collectionDraft.records.notes.length, 2);
assert.equal(collectionDraft.records.notes.find(note => note.body === 'Shared note').linkedPersonIds.length, 2);
assert.equal(collectionDraft.records.people[0].primaryPhotoId, collectionDraft.records.media[0].id);
const collectionsReport = context.gedcomImportReport(collectionDraft);
assert.equal(collectionsReport.attachmentCount, 1);
assert.equal(collectionsReport.rows.find(row => row[0] === 'Photos')[1], 1);
assert.equal(collectionsReport.rows.find(row => row[0] === 'Notes')[1], 2);
assert.equal(collectionsReport.rows.find(row => row[0] === 'Albums')[1], 1);
assert.equal(collectionsReport.rows.find(row => row[0] === 'Note collections')[1], 1);
const missingCollectionDraft = context.mapGedcomImport(collectionInput, project, new Map(), collectionRefs);
assertImportedCollections(missingCollectionDraft);
assert.equal(missingCollectionDraft.records.albums.length, 0);
assert.equal(missingCollectionDraft.records.noteCollections[0].id, collectionDraft.records.noteCollections[0].id);
const rebuiltCollectionDraft = context.mapGedcomImport(collectionInput, project, collectionMatches, collectionRefs);
assert.equal(JSON.stringify(rebuiltCollectionDraft.records), JSON.stringify(collectionDraft.records));
const isolatedCollectionDraft = context.mapGedcomImport(collectionInput, { ...project, id: 'other-import' }, collectionMatches, collectionRefs);
assertImportedCollections(isolatedCollectionDraft);
assert.notEqual(isolatedCollectionDraft.records.albums[0].id, collectionDraft.records.albums[0].id);
assert.notEqual(isolatedCollectionDraft.records.noteCollections[0].id, collectionDraft.records.noteCollections[0].id);
assertImportedCollections(map(file(['0 @I1@ INDI'])));
assertImportedCollections(map(file(['0 @I1@ INDI', '1 NOTE Just a note'])));
const citationOnlyCollection = map(file([
    '0 @I1@ INDI', '1 SOUR @S1@', '2 PAGE 12', '2 TEXT Citation only', '0 @S1@ SOUR', '1 TITL Register'
]));
assertImportedCollections(citationOnlyCollection);
assert.equal(citationOnlyCollection.records.sources.length, 1);
assert.equal(citationOnlyCollection.records.noteCollections.length, 0);

function verifyImportedCollectionLocalization()
{
    const dictionarySource = fs.readFileSync(path.join(__dirname, '../../src/localization/shared-projects.js'), 'utf8');
    const dictionary = vm.runInNewContext(dictionarySource + '\nRU_UI_PROJECTS;');
    const previous = context.t;
    try
    {
        context.t = key => dictionary[key] || key;
        const draft = context.mapGedcomImport(collectionInput, project, collectionMatches, collectionRefs);
        assertImportedCollections(draft, 'Импортированные');
        assert.equal(dictionary['Note collections'], 'Коллекции заметок');
    }
    finally { context.t = previous; }
}
verifyImportedCollectionLocalization();

// Simulate a failed activation after the atomic commit has staged collections.
// The actual commit writer must restore the old collections and report state.
function verifyImportedCollectionRollback()
{
    const previousState = { ...context.state };
    const previousGlobals = {};
    const existingAlbum = { id: 'existing-album', projectId: 'existing', name: 'Imported' };
    const existingCollection = { id: 'existing-note-col', projectId: 'existing', name: 'Imported' };
    const live = Object.fromEntries(Object.keys(collectionDraft.records).map(key => [key, []]));
    Object.assign(live, { projects: [{ id: 'existing' }], activity: [], albums: [existingAlbum], noteCollections: [existingCollection] });
    const snapshot = JSON.stringify(live);
    const stubs = {
        sampleData: live, withoutProjectReadModelRetention: action => action(),
        activateProject: () => false, disposeProjectReadModel: () => {}, setProjectReadModelActive: () => {}
    };
    for (const key of Object.keys(stubs)) previousGlobals[key] = context[key];
    try
    {
        Object.assign(context, stubs);
        Object.assign(context.state, { currentProjectId: 'existing', activeModule: 'Projects', projectOpen: true, treeProjectViews: {} });
        // Discarding and rebuilding a preview must not change the live state.
        context.mapGedcomImport(collectionInput, project, collectionMatches, collectionRefs);
        assert.equal(JSON.stringify(live), snapshot);
        assert.throws(() => context.commitGedcomImport(collectionDraft, collectionsReport), /Project activation failed/);
        assert.equal(JSON.stringify(live), snapshot);
        assert.equal(context.state.currentProjectId, 'existing');
        assert.equal(vm.runInContext('gedcomImportReports.has("ged-project")', context), false);
    }
    finally
    {
        Object.assign(context, previousGlobals);
        for (const key of Object.keys(context.state)) delete context.state[key];
        Object.assign(context.state, previousState);
    }
}
verifyImportedCollectionRollback();

assertImportedCollections(mhPhotoMapped);
assertImportedCollections(mhMissing);
assertImportedCollections(mhInvalid);
assertImportedCollections(richNotes);
assertImportedCollections(citationMapped);

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
    assertImportedCollections(draft);
    assert.deepEqual(JSON.parse(JSON.stringify(report.rows)), [
        ['People', 2], ['Facts', 1], ['Photos', 1], ['Imported Archive files', 1], ['Albums', 1]
    ]);
    const emptyCounts = context.gedcomImportReport(map(file(['0 @I1@ INDI'])));
    assert.deepEqual(JSON.parse(JSON.stringify(emptyCounts.rows)), [['People', 1]]);
    assert.ok(draft.warnings.some(warning => warning.tag === 'FILE'));
}

async function verifyOnlinePhotos()
{
    const url = 'https://sites-cf.mhcache.com/shared.jpg';
    const missing = 'https://sites-cf.mhcache.com/missing.jpg';
    const rows = ['0 @I1@ INDI', '1 OBJE', '2 FILE ' + url, '2 _PERSONALPHOTO Y',
        '0 @I2@ INDI', '1 OBJE', '2 FILE ' + url, '1 OBJE', '2 FILE ' + missing,
        '1 OBJE', '2 FILE https://unrelated.example/photo.jpg'];
    const input = parse(file(['1 SOUR MYHERITAGE', ...rows]));
    const refs = context.gedcomAttachmentReferences(input, true);
    assert.equal(refs.size, 2);
    assert.equal(context.gedcomAttachmentReferences(parse(file(rows)), true).size, 0);
    const requested = [];
    context.fetch = async (key, options) =>
    {
        requested.push(key);
        assert.equal(options.credentials, 'omit');
        assert.equal(options.redirect, 'error');
        return key === missing ? new Response(null, { status: 404 })
            : new Response(new Uint8Array([1]), { headers: { 'content-type': 'image/jpeg' } });
    };
    const matches = await context.downloadGedcomPhotos(refs, new Map(), new AbortController().signal, () => {});
    assert.deepEqual(requested, [url, missing]);
    assert.equal(matches.get(missing).status, 'Linked photo could not be downloaded');
    const draft = context.mapGedcomImport(input, project, matches, refs);
    assert.deepEqual(Array.from(draft.errors), []);
    assert.equal(draft.records.media.length, 1);
    assert.equal(draft.records.media[0].personIds.length, 2);
    assert.equal(draft.records.people[0].primaryPhotoId, draft.records.media[0].id);
    assert.equal(draft.onlinePhotoCount, 2);
    assertImportedCollections(draft);
}


async function verifyMyHeritageCutouts()
{
    const base = 'https://sites-cf.mhcache.com/';
    const original = base + mhOriginal, cropA = base + mhCutoutA, cropB = base + mhCutoutB;
    const input = parse(file(mhPhotoRows(original, cropA, cropB)));
    const refs = context.gedcomAttachmentReferences(input, true);
    const requested = [];
    context.createPhotoUploadDraft = async file => ({
        filename: file.name, src: 'data:image/jpeg;base64,AA==', mimeType: 'image/jpeg',
        width: file.name === mhOriginal ? 1000 : 200, height: file.name === mhOriginal ? 400 : 200, sizeBytes: 1
    });
    context.fetch = async key =>
    {
        requested.push(key);
        return new Response(new Uint8Array([1]), { headers: { 'content-type': 'image/jpeg' } });
    };
    const matches = await context.downloadGedcomPhotos(refs, new Map(), new AbortController().signal, () => {});
    assert.deepEqual(requested, [original]);
    const mapped = context.mapGedcomImport(input, project, matches, refs);
    assert.deepEqual(Array.from(mapped.errors), []);
    assert.equal(mapped.records.media.length, 1);
    assert.equal(mapped.onlinePhotoCount, 0);
    assertImportedCollections(mapped);
    requested.length = 0;
    context.fetch = async key =>
    {
        requested.push(key);
        return key === original ? new Response(null, { status: 404 })
            : new Response(new Uint8Array([1]), { headers: { 'content-type': 'image/jpeg' } });
    };
    const fallback = await context.downloadGedcomPhotos(refs, new Map(), new AbortController().signal, () => {});
    assert.deepEqual(requested, [original, cropA, cropB]);
    const fallbackDraft = context.mapGedcomImport(input, project, fallback, refs);
    assert.deepEqual(Array.from(fallbackDraft.errors), []);
    assert.equal(fallbackDraft.records.media.length, 2);
    assert.equal(fallbackDraft.onlinePhotoCount, 1);
    assertImportedCollections(fallbackDraft);

    const local = context.gedcomAttachmentReferences(mhPhotoInput);
    const read = [];
    const folder = [mhCutoutA, mhCutoutB, mhOriginal].map(name =>
    {
        const file = { name, size: 1, type: 'image/jpeg', webkitRelativePath: 'Root/' + name,
            async arrayBuffer() { read.push(name); return new Uint8Array([1]).buffer; } };
        file.slice = () => file;
        return file;
    });
    const localMatches = await context.matchGedcomAttachments(local, folder, () => true);
    assert.deepEqual(read, [mhOriginal]);
    const localDraft = context.mapGedcomImport(mhPhotoInput, project, localMatches, local);
    assert.deepEqual(Array.from(localDraft.errors), []);
    assert.equal(localDraft.records.media.length, 1);
    assertImportedCollections(localDraft);
}


// The import dialog has no pre-import matching settings. The progress and
// stop action are hidden until an automatic lookup actually runs.
const automaticImportDialogSource = context.openImportModal.toString();
assert.ok(!automaticImportDialogSource.includes('data-gedcom-geocode-enabled'));
assert.ok(!automaticImportDialogSource.includes('gedcomGeocodeTitle'));
assert.ok(automaticImportDialogSource.includes('data-gedcom-geocode-notice hidden'));
assert.ok(automaticImportDialogSource.includes('data-gedcom-geocode-progress aria-live="polite" hidden'));
assert.ok(automaticImportDialogSource.includes('data-gedcom-geocode-stop hidden'));
assert.ok(automaticImportDialogSource.includes('await matchGedcomPlaceCoordinates(draft, {'));

async function verifyAutomaticPlaceMatching()
{
    const draft = map(file([
        '0 @I1@ INDI', '1 BIRT', '2 PLAC Rzeszow, Podkarpackie, Poland',
        '1 DEAT', '2 PLAC Rzeszów, Poland',
        '0 @I2@ INDI', '1 BIRT', '2 PLAC Rzeszów',
        '1 DEAT', '2 PLAC Москва, СССР',
        '0 @I3@ INDI', '1 BIRT', '2 PLAC Cemetery, Poland',
        '1 DEAT', '2 PLAC Poland',
        '0 @I4@ INDI', '1 BIRT', '2 PLAC Other, Poland', '3 MAP', '4 LATI N50', '4 LONG E22',
        '1 DEAT', '2 PLAC Invalid, Poland', '3 MAP', '4 LATI N95', '4 LONG E22'
    ]));
    assert.deepEqual(Array.from(draft.errors), []);
    const before = JSON.stringify(draft.records.places);
    const calls = [];
    const candidate = { names: ['Rzeszów'], countryCode: 'PL', admin: ['Podkarpackie'],
        type: 'city', identities: ['one'], regionNames: ['Podkarpackie'], countyNames: [],
        confidence: .9, coordinates: { lat: 50.04, lng: 22 } };
    const lookup = async query => { calls.push(query); return {status:'results', candidates:[candidate]}; };
    const result = await context.matchGedcomPlaceCoordinates(draft, { lookup });
    assert.equal(calls.length, 2);
    assert.equal(result.stats.assigned, 2);
    assert.equal(result.stats.existing, 1);
    assert.equal(result.stats.ineligible, 5);
    assert.equal(JSON.stringify(draft.records.places), before);
    context.applyGedcomPlaceMatching(draft, result);
    assert.equal(draft.records.places[0].name, 'Rzeszow, Podkarpackie, Poland');
    assert.equal(draft.records.places[0].coordinates.lat, 50.04);
    assert.equal(draft.records.places.find(place => place.name === 'Other, Poland').coordinates.lat, 50);
    assert.equal(context.gedcomImportReport(draft).placeMatching.assigned, 2);
    const plan = { primary:'Rzeszów', country:'PL', admin:[] };
    assert.equal(context.gedcomStrongPlaceMatch(plan, {status:'results',candidates:[candidate,{...candidate, identities:['two'],coordinates:{lat:51,lng:22}}]}), null);
    assert.equal(context.gedcomStrongPlaceMatch(plan, {status:'results',candidates:[candidate],truncated:true}), null);
    assert.equal(context.gedcomStrongPlaceMatch({...plan,admin:['Different County']}, {status:'results',candidates:[candidate]}), null);
    const namesake = {...candidate, identities:['two'], admin:['Mazowieckie'], regionNames:['Mazowieckie'], coordinates:{lat:52,lng:21}};
    assert.equal(context.gedcomStrongPlaceMatch({...plan,admin:['Podkarpackie']},{status:'results',candidates:[candidate,namesake]}).lat,50.04);
    assert.equal(context.gedcomStrongPlaceMatch({...plan,admin:['Podkarpackie']},{status:'results',candidates:[candidate,{...namesake,regionNames:[]}]}),null);
    assert.equal(context.gedcomStrongPlaceMatch(plan,{status:'results',candidates:[candidate,{...candidate,coordinates:{lat:51,lng:22}}]}),null);
    assert.equal(context.gedcomStrongPlaceMatch(plan, {status:'results',candidates:[{...candidate,countryCode:'DE'}]}), null);
    const many = { records: { places: Array.from({length:160}, (_,i)=>({id:'p'+i,name:'Town '+i+', Poland',coordinates:null})), events:[],people:[] } };
    many.records.events.push({placeId:'p159'});
    calls.length = 0;
    const emptyLookup = async query => { calls.push(query); return {status:'empty',candidates:[]}; };
    const capped = await context.matchGedcomPlaceCoordinates(many, {lookup:emptyLookup});
    assert.equal(calls.length,150);
    assert.equal(calls[0],'Town 159, Poland');
    assert.equal(capped.stats.budget,10);
    assert.equal(capped.stats.uncertain,150);
    const unavailable = await context.matchGedcomPlaceCoordinates(many,{lookup:async()=>({status:'unavailable',candidates:[]})});
    assert.equal(unavailable.stats.unavailable,150);
    assert.equal(unavailable.coordinates.size,0);
    assert.equal(unavailable.stats.budget,10);
    let quotaCalls=0;
    const quota=await context.matchGedcomPlaceCoordinates(many,{lookup:async()=>{quotaCalls++;return {status:'quota',candidates:[]};}});
    assert.equal(quotaCalls,1);
    assert.equal(quota.stats.quota,150);
    const controller=new AbortController();
    let stoppedCalls=0;
    const stopped=await context.matchGedcomPlaceCoordinates(many,{signal:controller.signal,lookup:async()=>{stoppedCalls++;controller.abort();return {status:'empty',candidates:[]};}});
    assert.equal(stoppedCalls,1);
    assert.equal(stopped.stats.stopped,150);
    const duplicate={records:{places:[{id:'a',name:'Example, Poland',coordinates:null},{id:'b',name:'Example, Polska',coordinates:null}],events:[],people:[]}};
    const duplicateResult=await context.matchGedcomPlaceCoordinates(duplicate,{lookup:emptyLookup});
    assert.equal(duplicateResult.stats.lookups,1);
    assert.equal(duplicateResult.stats.checked,2);
}

verifyAttachments().then(verifyOnlinePhotos).then(verifyMyHeritageCutouts).then(verifyAutomaticPlaceMatching).then(() =>
{
    console.log('GEDCOM decoding, canonical mapping, warnings, attachment matching, and invalid inputs passed.');
}).catch(error =>
{
    console.error(error);
    process.exitCode = 1;
});
