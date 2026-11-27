'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const read = file => fs.readFileSync(path.join(__dirname, '../../src', file), 'utf8');
const context = vm.createContext({ document: { title: 'GeneoGraph' }, state: { language: 'ru' }, assert });
const scripts = [...read('index.html').matchAll(/src="(localization\/[^"]+\.js)"/g)].map(match => match[1]);
for (const file of [...scripts, 'shared/person-name-helpers.js'])
    vm.runInContext(read(file), context, { filename: file });

vm.runInContext(`
const slowEmbedded = value =>
{
    for (const rule of RU_EXACT_EMBEDDED_RULES)
    {
        rule.pattern.lastIndex = 0;
        value = value.replace(rule.pattern, (_match, prefix) => prefix + rule.translation);
    }
    return value;
};

const examples = [
    'Open Luna Purrington profile',
    'Actions for Silver Whiskerfield',
    'About 12 March 1900',
    '1 source linked', '25 sources linked', 'Deceased', 'Daughter',
    'Pawford, North Yorkshire, England',
    'Office and Off / Saved / Saving',
    'Unidentified village near Pawford, North Yorkshire, England',
    'Связь: Grandmother, Unknown father and Direct descendant',
    'Élodie Garcia · 1904–1960'
];
const composite = Object.keys(RU_EXACT)
    .filter((key, index) => index % 11 === 0)
    .map(key => 'Ω' + key + ' / ' + key + ' _ ' + key);
for (const value of [...examples, ...composite])
    assert.equal(replaceEmbeddedLocalization(value), slowEmbedded(value), value);

const optimized = replaceEmbeddedLocalization;
const luna = { names: { prefix: 'Dr.', first: 'Luna', middle: 'Mabel',
    last: 'Purrington', maiden: 'Whiskerfield', suffix: 'II' } };
const metadata = ['Pawford, North Yorkshire, England', 'Daughter', 'Deceased', '25 sources linked'];
const snapshot = JSON.stringify(luna);
const previous = [];
replaceEmbeddedLocalization = slowEmbedded;
for (const value of examples) previous.push(translateDynamicPhrase(value));
const previousHaystack = personSearchHaystack(luna, metadata);
localizationTextCache.clear();
replaceEmbeddedLocalization = optimized;
for (let index = 0; index < examples.length; index++)
    assert.equal(translateDynamicPhrase(examples[index]), previous[index], examples[index]);
const actual = personSearchHaystack(luna, metadata);
assert.equal(actual, previousHaystack);
for (const query of ['Вискер лу пУРР', 'Ma Lu Pu Dr II', 'доч поуф 25', 'источ пурр', '25 sources Daughter'])
    assert.ok(personSearchMatches(personSearchTokens(query), actual), query);

let ruleTrials = 0;
const originalReplace = RegExp.prototype[Symbol.replace];
for (const rule of RU_EXACT_EMBEDDED_RULES)
{
    rule.pattern[Symbol.replace] = function (...args)
    {
        ruleTrials++;
        return originalReplace.apply(this, args);
    };
}
localizationTextCache.clear();
const names = Array.from({ length: 6481 }, (_, index) =>
    personSearchHaystack({ names: { first: 'Qvzexa' + index, last: 'Yzxorum' + index } }));
assert.equal(names.length, 6481);
assert.equal(ruleTrials, 0, 'non-candidate names must perform no embedded regex replacements');
assert.ok(localizationTextCache.size <= 4096);
assert.equal(personSearchMatches(personSearchTokens('Qvzexa6480 Yzxorum6480'), names[6480]), true);
state.language = 'en';
assert.equal(personSearchMatches(personSearchTokens('луна'), personSearchHaystack(luna, metadata)), false);
state.language = 'ru';
assert.equal(personSearchMatches(personSearchTokens('луна'), personSearchHaystack(luna, metadata)), true);
assert.equal(JSON.stringify(luna), snapshot);

const synthetic = (source, translation) => ({
    source, translation, pattern: new RegExp('(^|[^a-zA-Z])' + source + '(?=$|[^a-zA-Z])', 'g')
});
RU_EXACT_EMBEDDED_RULES.splice(0, RU_EXACT_EMBEDDED_RULES.length,
    synthetic('Earlier', 'END'), synthetic('Original', 'Later Earlier'), synthetic('Later', 'Cascaded'));
ruEmbeddedRulesByPrefix = undefined;
assert.equal(replaceEmbeddedLocalization('Original / Earlier'), 'Cascaded Earlier / END');
assert.equal(replaceEmbeddedLocalization('Original / Earlier'), slowEmbedded('Original / Earlier'));
`, context);
console.log('Russian search and UI translation parity, rule ordering, and bounded embedded-rule work passed.');

