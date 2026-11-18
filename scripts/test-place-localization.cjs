'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, 'src', file), 'utf8');
const editor = read('modules/places/editor.js');
const directory = read('modules/places/directory.js');
const runtime = read('localization/runtime.js');
const routePicker = read('modules/places/route-picker.js');
const inspector = read('modules/places/inspector.js');
const files = [...read('index.html').matchAll(/<script src="(localization\/[^"]+\.js)" defer><\/script>/g)]
    .map(match => match[1]);
const catalog = files.indexOf('localization/catalog.js');
assert.ok(catalog >= 0, 'localization catalog is required');
const state = { language: 'ru' };
const sandbox = vm.createContext({ state, console });
for (const filename of files.slice(0, catalog + 1))
    vm.runInContext(read(filename), sandbox, { filename });
vm.runInContext(read('localization/plurals.js'), sandbox);
vm.runInContext([
    "const RU_PLURAL_RULES_FORMATTER = new Intl.PluralRules('ru');",
    "const RU_NUMBER_FORMATTER = new Intl.NumberFormat('ru');",
    "function t(key) { return state.language === 'ru' ? (RU_UI[key] || key) : key; }",
    "function translateText(source) { return state.language === 'ru' ? (RU_EXACT[source] || source) : source; }",
    "function translateExact(source) { return RU_EXACT[source] || source; }",
    "const RU_EXACT_EMBEDDED_RULES = [];"
].join('\n'), sandbox);
function excerpt(text, from, next)
{
    const start = text.indexOf(from), end = text.indexOf(next, start + from.length);
    assert.ok(start >= 0 && end > start, 'missing function block ' + from);
    return text.slice(start, end);
}
vm.runInContext(excerpt(runtime, 'function translateCountPhrase(', 'function translateDynamicPhrase('), sandbox);
vm.runInContext(excerpt(runtime, 'function translateDynamicPhrase(', 'function translateText('), sandbox);
vm.runInContext(excerpt(runtime, 'function localizedDataFieldValue(', 'function applyLanguage()'), sandbox);
vm.runInContext(excerpt(editor, 'function parsePlaceEditorCoordinate(', 'function readPlaceEditorRadiusState('), sandbox);
vm.runInContext(excerpt(editor, 'const PLACE_EDITOR_SAMPLE_IDS', 'function createPlaceEditorDraft('), sandbox);
vm.runInContext(excerpt(directory, 'function placeReviewT(', 'function placeReviewMatchesSearch('), sandbox);
vm.runInContext(excerpt(directory, 'function routeExcludedReasonSummary(', 'function renderPlacesRouteSummary('), sandbox);
const run = code => vm.runInContext(code, sandbox);
assert.equal(run("t('Not on map')"), 'Нет координат');
assert.equal(run("t('On map')"), 'Есть координаты');
assert.equal(run("t('No map position')"), 'Координаты не указаны');
assert.equal(run("t('Add position')"), 'Добавить координаты');
assert.equal(run("t('This place has no map position.')"), 'Координаты не указаны.');
for (const n of [1, 2, 5, 11, 21])
{
    const input = 'This place is connected to ' + n + ' '
        + (n === 1 ? 'record' : 'records') + ' but has no map position.';
    sandbox.linkedWarningInput = input;
    assert.equal(run('translateDynamicPhrase(linkedWarningInput)'),
        'Координаты не указаны. Связанных записей: ' + n + '.',
        'whole-sentence warning grammar for count ' + n);
}
assert.equal(run("t('Dismiss')"), 'Скрыть', 'global Dismiss stays unchanged');
assert.equal(run("placeReviewT('Dismiss')"), 'Отклонить');
assert.equal(run("placeReviewT('Dismissed')"), 'Отклонённые');
assert.equal(run("placeReviewT('Restore')"), 'Вернуть на проверку');
for (const [n, form] of [[1,'событие'],[2,'события'],[5,'событий'],[11,'событий'],[21,'событие']])
{
    sandbox.testRoute = { excludedCount:n, excludedByReason:{ missingDate:1,missingYear:0,missingPlace:n-1,missingCoordinates:0 } };
    assert.equal(run('placesRouteExcludedHeading(testRoute)'),
        'Не включено в маршрут: ' + n + ' ' + form);
    const reasons = run('routeExcludedReasonSummary(testRoute)');
    assert.ok(reasons.startsWith('без даты: 1'));
    assert.ok(!reasons.includes('excluded') && !reasons.includes('undated'));
}
assert.equal(run("routeExcludedReasonSummary({excludedByReason:{missingCoordinates:2,missingYear:1}})"),
    'без известного года: 1 · без координат: 2');
for (const [label,min,max,input,expected] of [
    ['Latitude',-90,90,'181','Широта должна быть в диапазоне от −90 до 90.'],
    ['Longitude',-180,180,'181','Долгота должна быть в диапазоне от −180 до 180.']
])
{
    sandbox.options = {label,minimum:min,maximum:max,example:'53.959400'};
    const result = run('parsePlaceEditorCoordinate(' + JSON.stringify(input) + ', options)');
    assert.equal(result.valid, false);
    assert.equal(result.message, expected);
}
assert.equal(run("readPlaceEditorCoordinateState('53,9594','-1,082').valid"), true);
assert.equal(run("readPlaceEditorCoordinateState('53,9594','').valid"), false);
assert.equal(run("readPlaceEditorCoordinateState('invalid','20').valid"), false);
const seed = { id:'place-meowbridge-school',projectId:'p1',
    name:'Meowbridge School, North Yorkshire, England',alternativeNames:['Meowbridge school'] };
sandbox.getPlace = id => id === seed.id ? seed : id === 'custom' ? {id,projectId:'p1'} : null;
sandbox.seedDraft = {mode:'edit',placeId:seed.id,
    original:{name:seed.name,alternativeNames:seed.alternativeNames.slice()}};
const name = run('placeEditorDisplayedName(seedDraft,seedDraft.original.name)');
const alias = run('placeEditorDisplayedName(seedDraft,seedDraft.original.alternativeNames[0])');
assert.equal(name, 'Школа Мяубриджа, Северный Йоркшир, Англия');
assert.equal(alias, 'Школа Мяубриджа');
sandbox.nameText = name;
sandbox.aliasText = alias;
assert.equal(run('placeEditorCanonicalName(seedDraft,nameText,[seedDraft.original.name])'), seed.name);
assert.equal(run('placeEditorCanonicalAlternatives(seedDraft,aliasText)[0]'), seed.alternativeNames[0]);
assert.equal(run("placeEditorCanonicalName(seedDraft,'Моя школа',[seedDraft.original.name])"), 'Моя школа');
state.language='en';
assert.equal(run('placeEditorCanonicalName(seedDraft,nameText,[seedDraft.original.name])'),seed.name,
    'language switch does not change canonical name');
assert.equal(run('placeEditorDisplayedName(seedDraft,seedDraft.original.name)'),seed.name);
state.language='ru';
sandbox.customDraft={mode:'edit',placeId:'custom',
    original:{name:seed.name,alternativeNames:['Meowbridge school']}};
assert.equal(run('placeEditorDisplayedName(customDraft,customDraft.original.name)'),seed.name);
assert.match(runtime, /Координаты не указаны\. Связанных записей:/);
assert.ok(routePicker.includes('placesRouteExcludedHeading(route)'));
assert.ok(inspector.includes("placeReviewT('Dismiss')"));
state.language='en';
assert.equal(run("placeReviewT('Dismiss')"),'Dismiss');
assert.equal(run("readPlaceEditorCoordinateState('90','-180').valid"),true);

// Inspector warning cards share one layout and keep their existing actions.
sandbox.icon = { warning: '<svg class="warning-icon"></svg>',
    openlink: '<svg class="open-icon"></svg>' };
sandbox.escapeHtml = value => String(value ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
sandbox.placePrimaryName = place => place.name;
vm.runInContext(excerpt(inspector, 'function renderPlaceAttention(', 'function renderPlacesInspector('), sandbox);
sandbox.warningOptions = {
    place: { id: 'place-1', name: 'Pawford' },
    title: 'Координаты не указаны',
    description: 'Координаты не указаны. Связанных записей: 1.',
    issueCount: 2,
    actions: '<button data-place-review-fix="place-1">Add position</button>'
};
const warningHtml = run('renderPlaceAttention(warningOptions)');
assert.match(warningHtml, /class="places-attention-header"/);
assert.match(warningHtml, /class="places-attention-description"/);
assert.match(warningHtml, /class="places-attention-actions"/);
assert.match(warningHtml, /data-place-review-view="place-1"/);
assert.match(warningHtml, /data-place-review-fix="place-1"/);
assert.match(warningHtml, /2 issues/);
sandbox.warningOptions = {
    place: { id: 'place-1', name: 'Pawford' },
    title: 'Possible duplicates',
    description: 'Pawford, North Yorkshire, England'
};
const duplicateHtml = run('renderPlaceAttention(warningOptions)');
assert.match(duplicateHtml, /class="places-attention-header"/);
assert.match(duplicateHtml, /class="places-attention-description"/);
assert.doesNotMatch(duplicateHtml, /places-attention-actions|2 issues/,
    'duplicate warning has no empty action row or count');
assert.equal((inspector.split('function renderPlacesInspector(')[1].match(/renderPlaceAttention\(\{/g) || []).length, 2,
    'both warning types use the shared card template');
assert.match(inspector, /data-place-review-dismiss=/,
    'dismiss action selector remains wired');

const warningCss = read('modules/places/main.css');
const descriptionCss = warningCss.match(/\.places-attention-description\s*\{([^}]+)\}/)?.[1] || '';
const actionsCss = warningCss.match(/\.places-attention-actions\s*\{([^}]+)\}/)?.[1] || '';
const headerCss = warningCss.match(/\.places-attention-header\s*\{([^}]+)\}/)?.[1] || '';
assert.match(descriptionCss, /grid-column:\s*2\s*;/);
assert.match(actionsCss, /grid-column:\s*2\s*;/);
assert.match(descriptionCss, /font-size:\s*13px\s*;/);
assert.match(headerCss, /flex-wrap:\s*wrap\s*;/);


// Review reasons identify the dismissal action, without renaming general reasons.
vm.runInContext(excerpt(directory, 'function renderPlaceReviewListRow(', 'function renderPlaceDuplicateReviewRow('), sandbox);
sandbox.placeReviewConnectionTotal = () => 1;
sandbox.placePrimaryName = place => place.name;
sandbox.placeSecondaryName = place => place.broaderName || '';
sandbox.placeReviewDismissalReason = dismissal => dismissal.reason;
sandbox.PLACE_REVIEW_DEFAULT_MISSING_REASON = 'Exact position not identified';
sandbox.icon.mapPin = '';
sandbox.reviewRow = {
    place: { id: 'place-1', name: 'Pawford' },
    issue: { type: 'missing_coordinates' },
    dismissal: { reason: 'Exact position not identified' }
};
state.language = 'ru';
const dismissedMarkup = run('renderPlaceReviewListRow(reviewRow)');
assert.equal((dismissedMarkup.match(/Причина отклонения/g) || []).length, 2,
    'dismissed reason display and editor use the complete Russian label');
assert.match(dismissedMarkup, /data-place-review-restore=/);
assert.match(directory, /querySelector\('\[data-place-review-restore\]'\)\?\.setAttribute\('hidden', ''\)/,
    'editing a dismissal hides its Restore button');
assert.match(directory, /querySelector\('\[data-place-review-restore\]'\)\?\.removeAttribute\('hidden'\)/,
    'canceling a dismissal edit restores its button');
state.language = 'en';
assert.equal(run("t('Dismissal reason')"), 'Dismissal reason');
const dismissedEnglish = run('renderPlaceReviewListRow(reviewRow)');
assert.equal((dismissedEnglish.match(/Dismissal reason/g) || []).length, 2);

sandbox.duplicateHost = { hidden: true, innerHTML: '' };
sandbox.modalBackdrop = { querySelector: () => sandbox.duplicateHost };
sandbox.icon.close = '<svg class="dismiss-icon"></svg>';
sandbox.icon.chevron = '<svg class="chevron-icon"></svg>';
sandbox.findPlaceEditorDuplicate = () => ({
    place: { id: 'existing-place', name: 'Pawford, England', coordinates: null },
    reasons: ['The names match.'], alternativeConflict: false
});
sandbox.placeEditorCoordinateTextFromStored = () => ({ latitude: '', longitude: '' });
sandbox.readPlaceEditorCoordinateState = () => ({ hasCoordinates: false });
sandbox.placeAlternativeNames = () => [];
sandbox.localizeUI = () => {};
sandbox.placeEditorDraft = {
    mode: 'edit', placeId: 'current-place', dismissedDuplicateId: null
};
vm.runInContext(excerpt(editor, 'function renderPlaceEditorDuplicateWarning(',
    'function updatePlaceEditorAlternativeSummary('), sandbox);
run('renderPlaceEditorDuplicateWarning()');
const editWarning = sandbox.duplicateHost.innerHTML;
const warningHeader = editWarning.match(/<div class="place-duplicate-heading">([\s\S]*?)<\/div>/)?.[1] || '';
const warningActions = editWarning.match(/<div class="place-duplicate-actions">([\s\S]*?)<\/div>/)?.[1] || '';
assert.match(warningHeader, /class="button ghost compact place-duplicate-dismiss"/);
assert.match(warningHeader, /data-place-duplicate-ignore=/,
    'editor Dismiss preserves its draft-only handler selector');
assert.match(warningHeader, /<svg class="dismiss-icon"><\/svg><span>Dismiss<\/span>/,
    'Dismiss shows the sidebar close icon and English label');
assert.doesNotMatch(warningActions, /data-place-duplicate-ignore=/,
    'Dismiss is not duplicated in the bottom action row');
assert.match(warningActions, /class="button ghost compact place-duplicate-details"[^>]*aria-expanded="false"/,
    'Place details begins as an accessible collapsed disclosure');
assert.match(warningActions, /<svg class="chevron-icon"><\/svg>/,
    'Place details has a disclosure chevron');
assert.match(warningActions, /class="button secondary compact place-duplicate-merge"/,
    'Merge uses a scoped neutral outline style');
assert.match(warningActions, /data-place-duplicate-details[\s\S]*data-place-review-merge/,
    'Place details and Merge share one action row');
assert.match(warningActions, />Merge<\/button>/,
    'merge action uses the shorter label');
assert.doesNotMatch(editWarning, /You can create this place without dismissing the warning|Review \/ Merge/);

state.language = 'ru';
run('renderPlaceEditorDuplicateWarning()');
assert.match(sandbox.duplicateHost.innerHTML, /<svg class="dismiss-icon"><\/svg><span>Отклонить<\/span>/,
    'editor Dismiss uses Places-only Russian text');
assert.equal(run("t('Dismiss')"), 'Скрыть',
    'the general Dismiss translation is unchanged');
state.language = 'en';
sandbox.placeEditorDraft.mode = 'add';
run('renderPlaceEditorDuplicateWarning()');
const addWarning = sandbox.duplicateHost.innerHTML;
assert.match(addWarning, /data-place-use-existing=/,
    'Create Place still offers Use existing');
assert.match(addWarning, /class="button secondary compact place-duplicate-use-existing"/);
assert.doesNotMatch(addWarning, /data-place-review-merge=/,
    'Create Place does not expose Merge');
assert.match(addWarning.match(/<div class="place-duplicate-heading">([\s\S]*?)<\/div>/)?.[1] || '',
    /<svg class="dismiss-icon"><\/svg><span>Dismiss<\/span>/,
    'Create Place shares the compact Dismiss header');

const placesCss = read('modules/places/main.css');
assert.match(placesCss, /\.place-duplicate-heading \.place-duplicate-dismiss\s*\{[^}]*margin-inline-start:\s*auto/s,
    'Dismiss aligns to the trailing edge of the warning header');
assert.match(placesCss, /\.places-attention-actions \.places-attention-dismiss,\s*\.place-editor-duplicate \.place-duplicate-dismiss\s*\{/,
    'editor and inspector Dismiss share the same palette rule');
assert.match(placesCss, /\.place-editor-duplicate \.button\s*\{[^}]*min-height:\s*34px;[^}]*font-weight:\s*600;[^}]*letter-spacing:\s*normal/s,
    'buttons use consistent compact typography and normal letter spacing');
assert.match(placesCss, /\.place-duplicate-details\[aria-expanded="true"\] svg\s*\{[^}]*transform:\s*rotate\(-90deg\)/s,
    'disclosure chevron reflects aria-expanded without another handler');
const amberButtons = placesCss.match(/\.places-attention-actions \.places-attention-fix,\s*\.place-editor-duplicate \.place-duplicate-merge,\s*\.place-editor-duplicate \.place-duplicate-use-existing\s*\{([^}]+)\}/)?.[1] || '';
assert.match(amberButtons, /background:\s*var\(--gg-status-warning-accent\);/,
    'Merge and Use existing share the sidebar Add position warning-accent background');
assert.match(amberButtons, /color:\s*var\(--gg-status-warning-on-accent\);/,
    'warning-accent buttons share the sidebar foreground contrast role');
assert.match(amberButtons, /border-color:\s*var\(--gg-status-warning-outline\);/,
    'warning-accent buttons share the sidebar outline');
assert.match(placesCss, /\.places-attention-actions \.places-attention-fix:hover,\s*\.place-editor-duplicate \.place-duplicate-merge:hover,\s*\.place-editor-duplicate \.place-duplicate-use-existing:hover\s*\{[^}]*filter:\s*brightness\(1\.06\)/s,
    'Merge and Use existing share the sidebar hover treatment');
assert.match(placesCss, /\.place-editor-duplicate \.place-duplicate-merge,\s*\.place-editor-duplicate \.place-duplicate-use-existing\s*\{[^}]*min-height:\s*32px;[^}]*padding:\s*5px 9px;[^}]*font-size:\s*12px/s,
    'warning primary actions match Add position button dimensions and typography');
assert.doesNotMatch(placesCss, /\.place-editor-duplicate \.place-duplicate-merge:hover,\s*\.place-editor-duplicate \.place-duplicate-use-existing:hover\s*\{\s*background:\s*var\(--surface-card-hover\)/s,
    'obsolete neutral hover override is removed');
assert.match(placesCss, /@media \(pointer: coarse\)\s*\{[^}]*\.place-editor-duplicate \.button\s*\{[^}]*min-height:\s*44px/s,
    'coarse pointer controls provide a larger touch target');
assert.match(editor, /draft\.dismissedDuplicateId = ignoreId;/,
    'Dismiss still affects only the active Place draft');
assert.match(directory, /row\.classList\.add\('is-editing-reason'\)/,
    'editing a reason activates the full-width review row');
assert.match(directory, /classList\.remove\('is-editing-reason'\)/,
    'Cancel restores the normal review layout');
assert.match(placesCss, /\.places-review-list-row\.is-editing-reason \.places-review-row-actions\s*\{[^}]*display:\s*none/s,
    'review action controls are hidden while a reason is being edited');

console.log('Places localization, dismissal reason, and duplicate warning layout OK');
