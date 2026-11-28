'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../../src/core/app-shell.js'), 'utf8');
const settings = source.slice(source.indexOf('function normalizeGlobalSettingsSection('),
    source.indexOf('function syncDiagnosticsTopbar()'));
const css = fs.readFileSync(path.join(__dirname, '../../src/core/foundation.css'), 'utf8');
const nav = ['general', 'storage', 'diagnostics', 'about'].map(section =>
{
    const attributes = {};
    return { dataset: { globalSettingsSection: section }, attributes,
        classList: { toggle: (name, value) => { attributes[name] = value; } },
        setAttribute: (name, value) => { attributes[name] = value; },
        removeAttribute: name => { delete attributes[name]; } };
});
const panel = { innerHTML: '', scrollTop: 75 };
const root = { querySelector: selector => selector === '.global-settings-panel' ? panel : null,
    querySelectorAll: () => nav };
const context = vm.createContext({
    assert, modalBackdrop: root, state: { globalSettingsSection: 'general', language: 'en' },
    icon: { copy: '<svg></svg>', chevron: '', settings: '', syncoffline: '', recording: '', info: '' },
    window: { geneographTheme: { getPreference: () => 'system' } },
    geneographBuildInfo: { version: '1.6.1', shortRevision: '96219dd' },
    t: value => value, escapeHtml: value => String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;'),
    geneographLandingUrl: value => 'https://geneograph.com/' + (value || ''),
    diagnosticsSettingsMarkup: () => '<h3 id="globalSettingsPanelTitle">Diagnostics</h3>',
    bindDiagnosticsSettings: () => {}, localizeUI: () => {}
});
vm.runInContext(settings + '\n' + [
    "const general = renderGlobalSettingsPanel('general');",
    "assert.match(general, /Appearance/);",
    "assert.match(general, /Regional preferences/);",
    "assert.match(general, /Product tour/);",
    "assert.match(general, /data-global-settings-tour/);",
    "assert.doesNotMatch(general, /globalStartupPreview|Time zone/);",
    "const about = renderGlobalSettingsPanel('about');",
    "assert.match(about, /Application/);",
    "assert.match(about, /Legal &amp; credits/);",
    "assert.match(about, /1.6.1-96219dd/);",
    "assert.match(about, /https:\\/\\/www.geoapify.com\\//);",
    "assert.doesNotMatch(about, /Product tour|Help center|Contact us/);",
    "assert.equal((renderGlobalSettingsNav().match(/data-global-settings-section=/g) || []).length, 4);",
    "assert.match(renderGlobalSettingsPanel('storage'), /not available/);",
    "assert.match(renderGlobalSettingsPanel('diagnostics'), /Diagnostics/);",
    "selectGlobalSettingsSection('about');",
    "assert.equal(state.globalSettingsSection, 'about');",
    "assert.equal(modalBackdrop.querySelector('.global-settings-panel').scrollTop, 0);",
    "modalBackdrop.querySelector('.global-settings-panel').scrollTop = 42;",
    "selectGlobalSettingsSection('about', true);",
    "assert.equal(modalBackdrop.querySelector('.global-settings-panel').scrollTop, 42);",
    "selectGlobalSettingsSection('about');",
    "assert.equal(modalBackdrop.querySelector('.global-settings-panel').scrollTop, 42);",
    "selectGlobalSettingsSection('unknown');",
    "assert.equal(state.globalSettingsSection, 'general');"
].join('\n'), context);
assert.equal(nav[0].attributes['aria-current'], 'true');
assert.equal(nav[3].attributes['aria-current'], undefined);
assert.match(css, /\.global-settings-panel\s*\{[^}]*min-height:\s*0;[^}]*overflow-y:\s*auto;/s);
assert.match(css, /#modalBackdrop > \.modal\.global-settings-modal > \.modal-body\s*\{[^}]*overflow:\s*hidden;/s);
assert.match(css, /@media \(max-height: 360px\), \(max-width: 840px\) and \(max-height: 480px\)/);
console.log('Global settings markup, section navigation and scroll ownership checks passed.');
