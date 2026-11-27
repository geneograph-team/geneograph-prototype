'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const api = new Function('state', 'translateText', 'escapeHtml', 'icon', 'window', 'document', 'CustomEvent',
    read('src/shared/person-name-helpers.js') + '\n' + read('src/shared/filter-fields.js') + '\n' + read('src/shared/filter-interactions.js')
    + '\nreturn { renderSharedFilterFields, bindSharedFilterFields };')(
    { language: 'en' }, x => x, x => String(x), {},
    { innerHeight: 900, innerWidth: 1200 }, { activeElement: null }, class {});
function element()
{
    const events = {};
    return {
        events, attrs: {}, style: {}, hidden: true, innerHTML: '', value: '', dataset: {},
        classList: { add() {}, remove() {}, toggle() {} },
        addEventListener(name, handler) { events[name] = handler; },
        setAttribute(key, value) { this.attrs[key] = value; },
        removeAttribute(key) { delete this.attrs[key]; },
        querySelector() { return null; },
        getBoundingClientRect() { return { top: 100, bottom: 142, width: 280, left: 50 }; },
        focus() { events.focus?.(); },
        closest() { return null; },
        dispatchEvent() {}
    };
}
function setup(searchOnly, personSearch = false)
{
    let changes = 0, optionReads = 0;
    const definition = { key: 'person', label: 'Person', control: 'combobox', searchOnly, personSearch,
        defaultValue: '', getOptions() {
            optionReads++;
            return [{ value: 'a', label: 'Alice' }, { value: 'b', label: 'Bob' },
                { value: 'luna', label: 'Luna Mabel Purrington', person: { names: { first: 'Luna', middle: 'Mabel', last: 'Purrington', maiden: 'Whiskerfield' } } }];
        } };
    const schema = [definition], prefix = 'test', values = {};
    const markup = api.renderSharedFilterFields({ schema, prefix, values });
    const input = element(), toggle = searchOnly ? null : element(), listbox = element(),
        selected = element(), status = element(), combobox = element(), container = element();
    listbox.id = 'test-person-listbox';
    combobox.querySelector = selector => ({
        '[data-shared-filter-input]': input,
        '[data-shared-filter-toggle]': toggle,
        '[data-shared-filter-listbox]': listbox,
        '[data-shared-filter-selected]': selected,
        '[data-shared-filter-status]': status
    })[selector] || null;
    container.dataset.sharedFilterRoot = prefix;
    container.querySelector = selector => selector.startsWith('[data-shared-filter-combobox=') ? combobox : null;
    const rootElement = { querySelectorAll: () => [container] };
    const binding = api.bindSharedFilterFields(rootElement, { schema, prefix, values, onChange: () => changes++ });
    return { markup, input, toggle, listbox, selected, binding, status, get changes() { return changes; },
        get optionReads() { return optionReads; } };
}
function type(picker, value)
{
    picker.input.value = value;
    picker.input.events.input();
}
function key(picker, value)
{
    let prevented = false;
    picker.input.events.keydown({ key: value, preventDefault() { prevented = true; }, stopPropagation() {} });
    return prevented;
}
const search = setup(true);
assert.ok(search.markup.includes('is-search-only'));
assert.equal(search.markup.includes('data-shared-filter-toggle'), false);
assert.ok(search.markup.includes('role="combobox"'));
search.input.focus();
search.input.events.pointerdown();
search.input.events.click();
assert.equal(search.listbox.hidden, true);
assert.equal(search.optionReads, 0);
assert.equal(key(search, 'ArrowDown'), false);
type(search, '   ');
assert.equal(search.listbox.hidden, true);
assert.equal(search.optionReads, 0);
type(search, 'ali');
assert.equal(search.listbox.hidden, false);
assert.ok(search.listbox.innerHTML.includes('Alice'));
assert.equal(search.listbox.innerHTML.includes('Bob'), false);
assert.equal(search.input.attrs['aria-expanded'], 'true');
assert.equal(key(search, 'Enter'), true);
assert.equal(search.binding.getValues().person, 'a');
assert.equal(search.changes, 1);
assert.equal(search.listbox.hidden, true);
assert.equal(search.input.value, '');
assert.equal(search.selected.hidden, false);
assert.equal(search.listbox.innerHTML, '');
type(search, 'missing');
assert.ok(search.listbox.innerHTML.includes('No matching options.'));
assert.equal(key(search, 'Enter'), true);
assert.equal(search.changes, 1);
type(search, '');
assert.equal(search.listbox.hidden, true);
assert.equal(search.input.attrs['aria-expanded'], 'false');
type(search, 'bob');
assert.equal(key(search, 'Escape'), true);
assert.equal(search.listbox.hidden, true);
assert.equal(search.binding.getValues().person, 'a');
const personPicker = setup(true, true);
personPicker.input.focus();
assert.equal(personPicker.listbox.hidden, true);
type(personPicker, ' Pu  Lu Ma ');
assert.ok(personPicker.listbox.innerHTML.includes('Luna Mabel Purrington'));
assert.equal(personPicker.listbox.innerHTML.includes('Alice'), false);
type(personPicker, 'Whisk Ma');
assert.ok(personPicker.listbox.innerHTML.includes('Luna Mabel Purrington'));
assert.equal(key(personPicker, 'Enter'), true);
assert.equal(personPicker.binding.getValues().person, 'luna');
assert.equal(personPicker.listbox.hidden, true);
type(personPicker, 'Lu Bob');
assert.ok(personPicker.listbox.innerHTML.includes('No matching options.'));
const dropdown = setup(false);
assert.ok(dropdown.markup.includes('data-shared-filter-toggle'));
dropdown.input.focus();
assert.equal(dropdown.listbox.hidden, false);
assert.ok(dropdown.listbox.innerHTML.includes('Alice'));
assert.ok(dropdown.listbox.innerHTML.includes('Bob'));
type(dropdown, 'Pu Lu Ma');
assert.ok(dropdown.listbox.innerHTML.includes('No matching options.'));
dropdown.toggle.events.click();
assert.equal(dropdown.listbox.hidden, true);
console.log('Tree settings search-only mode and ordinary dropdown behavior passed.');
