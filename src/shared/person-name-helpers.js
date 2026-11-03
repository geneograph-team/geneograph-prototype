// ---------- Name prefix / suffix (shared) ----------
const PREFIX_SUGGESTIONS = ['Dr.', 'Prof.', 'Rev.', 'Sir', 'Lady', 'Capt.'];
const SUFFIX_SUGGESTIONS = ['Jr.', 'Sr.', 'II', 'III', 'IV', 'PhD'];

function normalizeNameSegment(value)
{
    return String(value == null ? '' : value).trim();
}

function formatPersonFullName(person)
{
    const n = person?.names || {};
    if (person?.meta?.placeholderRole === 'father'
        && ![n.prefix, n.first, n.middle, n.last, n.suffix].some(value => normalizeNameSegment(value)))
        return 'Unknown father';
    return [n.prefix, n.first, n.middle, n.last, n.suffix]
        .map(normalizeNameSegment)
        .filter(Boolean)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function formatPersonInitials(person)
{
    const n = person?.names || {};
    const f = normalizeNameSegment(n.first);
    const l = normalizeNameSegment(n.last);
    const initials = `${f[0] || ''}${l[0] || ''}`.toUpperCase();
    return initials || (n.initials || '??');
}

function rebuildPersonDisplayName(person)
{
    if (!person || !person.names) return person;

    if (person.meta?.placeholderRole === 'father'
        && [person.names.prefix, person.names.first, person.names.middle, person.names.last,
            person.names.suffix].some(value => normalizeNameSegment(value)))
        delete person.meta.placeholderRole;

    person.names.display = formatPersonFullName(person);
    person.names.initials = formatPersonInitials(person);

    return person;
}

function collectNameAffixValue(inputEl)
{
    if (!inputEl) return '';
    return normalizeNameSegment(inputEl.value);
}

function nameAffixSuggestionList(kind)
{
    return kind === 'prefix' ? PREFIX_SUGGESTIONS : SUFFIX_SUGGESTIONS;
}

function renderNameAffixCombobox({ id, label, value = '', kind = 'prefix', className = 'full', inputAttrs = '' } = {})
{
    const listId = `${id}List`;
    const placeholder = kind === 'prefix' ? 'e.g. Dr., Sir, Lady' : 'e.g. Jr., III, PhD';
    return `<div class="field ${escapeHtml(className)} place-combobox-field name-affix-combobox-field" data-name-affix-combobox data-name-affix-kind="${escapeHtml(kind)}">
        <label for="${escapeHtml(id)}">${escapeHtml(label)}</label>
        <div class="place-combobox-shell">
          <input
            id="${escapeHtml(id)}"
            data-source-value="${escapeHtml(value)}"
            value="${escapeHtml(localizedDataFieldValue(value))}"
            placeholder="${escapeHtml(placeholder)}"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded="false"
            aria-controls="${escapeHtml(listId)}"
            autocomplete="off"
            data-name-affix-input
            ${inputAttrs}>
          <div class="place-combobox-list" id="${escapeHtml(listId)}" role="listbox" hidden></div>
        </div>
      </div>`;
}

function bindNameAffixComboboxes(root = document)
{
    if (!root || typeof root.querySelectorAll !== 'function') return;
    root.querySelectorAll('[data-name-affix-combobox]').forEach(field =>
    {
        if (field.dataset.nameAffixBound) return;
        field.dataset.nameAffixBound = 'true';
        const input = field.querySelector('[data-name-affix-input]');
        const list = field.querySelector('.place-combobox-list');
        if (!input || !list) return;
        const kind = field.dataset.nameAffixKind === 'suffix' ? 'suffix' : 'prefix';
        const suggestions = nameAffixSuggestionList(kind);
        let activeIndex = -1;
        let currentOptions = [];
        let openBeforePointer = null;

        function buildOptions(query)
        {
            const q = (query || '').trim().toLowerCase();
            if (!q) return suggestions.slice();
            return suggestions.filter(s => s.toLowerCase().includes(q));
        }

        function renderList()
        {
            if (!currentOptions.length)
            {
                list.hidden = true;
                list.innerHTML = '';
                input.setAttribute('aria-expanded', 'false');
                input.removeAttribute('aria-activedescendant');
                return;
            }
            list.innerHTML = currentOptions.map((opt, i) =>
            {
                const active = i === activeIndex ? ' active' : '';
                const optId = `${input.id}-opt-${i}`;
                return `<div class="place-combobox-option${active}" role="option" id="${escapeHtml(optId)}" aria-selected="${i === activeIndex ? 'true' : 'false'}" data-name-affix-opt="${i}">
              <div class="place-combobox-copy"><strong>${escapeHtml(opt)}</strong></div>
            </div>`;
            }).join('');
            list.hidden = false;
            input.setAttribute('aria-expanded', 'true');
            if (activeIndex >= 0)
            {
                input.setAttribute('aria-activedescendant', `${input.id}-opt-${activeIndex}`);
            }
            else
            {
                input.removeAttribute('aria-activedescendant');
            }
        }

        function refresh()
        {
            currentOptions = buildOptions(input.value);
            activeIndex = currentOptions.length ? 0 : -1;
            renderList();
        }

        function close()
        {
            list.hidden = true;
            list.innerHTML = '';
            input.setAttribute('aria-expanded', 'false');
            input.removeAttribute('aria-activedescendant');
            activeIndex = -1;
            currentOptions = [];
        }

        function chooseOption(value)
        {
            if (value == null) return;
            input.value = value;
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
            close();
        }

        input.addEventListener('focus', refresh);
        input.addEventListener('pointerdown', () =>
        {
            openBeforePointer = !list.hidden;
        });
        input.addEventListener('click', () =>
        {
            const wasOpen = openBeforePointer;
            openBeforePointer = null;
            if (wasOpen === true) close();
            else if (list.hidden) refresh();
        });
        input.addEventListener('input', refresh);
        input.addEventListener('keydown', event =>
        {
            if (list.hidden && (event.key === 'ArrowDown' || event.key === 'ArrowUp'))
            {
                refresh();
                event.preventDefault();
                return;
            }
            if (event.key === 'ArrowDown')
            {
                event.preventDefault();
                if (!currentOptions.length) return;
                activeIndex = (activeIndex + 1) % currentOptions.length;
                renderList();
            }
            else if (event.key === 'ArrowUp')
            {
                event.preventDefault();
                if (!currentOptions.length) return;
                activeIndex = (activeIndex - 1 + currentOptions.length) % currentOptions.length;
                renderList();
            }
            else if (event.key === 'Home' && !list.hidden)
            {
                event.preventDefault();
                activeIndex = 0;
                renderList();
            }
            else if (event.key === 'End' && !list.hidden)
            {
                event.preventDefault();
                activeIndex = currentOptions.length - 1;
                renderList();
            }
            else if (event.key === 'Enter')
            {
                if (!list.hidden && activeIndex >= 0)
                {
                    event.preventDefault();
                    chooseOption(currentOptions[activeIndex]);
                }
            }
            else if (event.key === 'Escape')
            {
                if (!list.hidden)
                {
                    event.preventDefault();
                    close();
                }
            }
            else if (event.key === 'Tab')
            {
                close();
            }
        });
        input.addEventListener('blur', () => setTimeout(close, 120));
        list.addEventListener('mousedown', event =>
        {
            const opt = event.target.closest('[data-name-affix-opt]');
            if (!opt) return;
            event.preventDefault();
            const idx = Number(opt.dataset.nameAffixOpt);
            chooseOption(currentOptions[idx]);
        });
    });
}
// ---------- end name affix ----------

