const GENEALOGY_DATE_TYPES = ['Exact date', 'About / Circa', 'Before', 'After', 'Between'];
const GENEALOGY_CALENDARS = ['Gregorian', 'Julian'];
const GENEALOGY_MONTHS = [
    ['01', 'Jan', 'January', 'янв.', 'январь', 'января'],
    ['02', 'Feb', 'February', 'февр.', 'февраль', 'февраля'],
    ['03', 'Mar', 'March', 'мар.', 'март', 'марта'],
    ['04', 'Apr', 'April', 'апр.', 'апрель', 'апреля'],
    ['05', 'May', 'May', 'май', 'май', 'мая'],
    ['06', 'Jun', 'June', 'июн.', 'июнь', 'июня'],
    ['07', 'Jul', 'July', 'июл.', 'июль', 'июля'],
    ['08', 'Aug', 'August', 'авг.', 'август', 'августа'],
    ['09', 'Sep', 'September', 'сент.', 'сентябрь', 'сентября'],
    ['10', 'Oct', 'October', 'окт.', 'октябрь', 'октября'],
    ['11', 'Nov', 'November', 'нояб.', 'ноябрь', 'ноября'],
    ['12', 'Dec', 'December', 'дек.', 'декабрь', 'декабря']
];
let genealogyDatePopover = null;
let genealogyDateOutsideHandler = null;
let genealogyDateKeyHandler = null;
let genealogyDateReturnFocus = null;

function normalizeGenealogyDateType(type)
{
    const aliases = { exact: 'Exact date', year: 'Exact date', 'year only': 'Exact date',
        about: 'About / Circa', circa: 'About / Circa', before: 'Before', after: 'After', between: 'Between' };
    const text = String(type || '').trim().toLowerCase();
    return aliases[text] || GENEALOGY_DATE_TYPES.find(value => value.toLowerCase() === text) || 'Exact date';
}

function genealogyDateTypeOptions(selected = 'Exact date')
{
    const active = normalizeGenealogyDateType(selected);
    return GENEALOGY_DATE_TYPES.map(type => `<option value="${type}" ${type === active ? 'selected' : ''}>${escapeHtml(t(type === 'Exact date' ? 'Exact' : type))}</option>`).join('');
}

function genealogyMonthOptions(selected = '')
{
    const active = String(selected || '').padStart(2, '0');
    return `<option value="">${t('Month')}</option>${GENEALOGY_MONTHS.map(([value, , long, , ru]) => `<option value="${value}" ${value === active ? 'selected' : ''}>${value} - ${state.language === 'ru' ? ru : long}</option>`).join('')}`;
}

function cleanGenealogyDateText(value)
{
    const text = String(value ?? '').trim();
    return ['-', '--', '—', 'null', 'undefined', 'n/a', 'not applicable', 'вЂ”'].includes(text.toLowerCase()) ? '' : text;
}

function cleanDatePlaceId(value)
{
    return cleanGenealogyDateText(value) || null;
}

function emptyGenealogyDate(dateType = 'Exact date')
{
    return { state: 'empty', dateType: normalizeGenealogyDateType(dateType), calendar: 'Gregorian',
        first: { year: null, month: null, day: null }, second: null, originalText: '',
        date: '', dateLabel: '', sortDate: '', date2: '', date2Label: '', sortDate2: '' };
}

function monthByName(value)
{
    const text = String(value || '').toLowerCase().replace(/\.$/, '');
    return GENEALOGY_MONTHS.find(row => row.slice(1).some(name => name.toLowerCase().replace(/\.$/, '') === text))?.[0] || '';
}

function monthShort(value)
{
    return GENEALOGY_MONTHS.find(row => Number(row[0]) === Number(value))?.[1] || '';
}

function genealogyMonthDays(year, month, calendar = 'Gregorian')
{
    if (Number(month) === 2)
    {
        if (!year) return 29;
        const leap = Number(year) % 4 === 0 && (calendar === 'Julian' || Number(year) % 100 !== 0 || Number(year) % 400 === 0);
        return leap ? 29 : 28;
    }
    return [4, 6, 9, 11].includes(Number(month)) ? 30 : 31;
}

function genealogyDateParts(year = null, month = null, day = null, calendar = 'Gregorian')
{
    const parts = Object.fromEntries(Object.entries({ year, month, day }).map(([key, value]) =>
        [key, value === '' || value === null || value === undefined ? null : Number(value)]));
    if (Object.entries(parts).some(([key, value]) => value !== null && (!Number.isInteger(value)
        || value < 1 || value > ({ year: 9999, month: 12, day: 31 })[key]))
        || parts.day && parts.month && parts.day > genealogyMonthDays(parts.year, parts.month, calendar)) return null;
    return parts;
}

function isValidGregorianDate(year, month, day)
{
    return Boolean(year && month && day && genealogyDateParts(year, month, day));
}

function sortDateFromParts(year, month = '', day = '')
{
    return year ? `${String(year).padStart(4, '0')}${String(month || 0).padStart(2, '0')}${String(day || 0).padStart(2, '0')}` : '';
}

function dateValueFromParts(year, month = '', day = '')
{
    const y = year ? String(year).padStart(4, '0') : '';
    const m = month ? String(month).padStart(2, '0') : '';
    const d = day ? String(day).padStart(2, '0') : '';
    if (y && m && d) return `${d}.${m}.${y}`;
    if (y && m) return `${m}.${y}`;
    if (y && d) return `day ${Number(d)} year ${y}`;
    if (y) return y;
    if (m && d) return `${Number(d)} ${monthShort(m)}`;
    if (m) return monthShort(m);
    return d ? `day ${Number(d)}` : '';
}

function dateLabelFromParts(year, month = '', day = '', language = 'en')
{
    const ru = language === 'ru';
    const y = year ? String(year).padStart(4, '0') : '';
    const row = GENEALOGY_MONTHS.find(item => Number(item[0]) === Number(month));
    const m = row ? ru ? day ? row[5] : row[4] : day || year ? row[1] : row[2] : '';
    if (m) return [day ? y ? String(day).padStart(2, '0') : String(Number(day)) : '', m, y].filter(Boolean).join(' ');
    if (day) return `${ru ? 'День' : 'Day'} ${Number(day)}${y ? `, ${y}` : ''}`;
    return y;
}

function calculateGenealogyYear(text)
{
    const raw = String(text ?? '').trim();
    const match = raw.match(/^=\s*(\d{1,4})\s*([+-])\s*(\d{1,4})$/);
    if (!match)
    {
        if (raw.startsWith('='))
            return { valid: false, message: 'Enter a year calculation such as =1900-50.' };
        const bare = raw.match(/^(\d{1,4})\s*([+-])\s*(\d{1,4})$/);
        if (bare && !(bare[2] === '-' && /^\d{4}-\d{1,2}$/.test(raw)
            && Number(bare[3]) >= 1 && Number(bare[3]) <= 12))
            return { valid: false, message: 'Year calculations must start with =. Try =1900-50.' };
        return null;
    }
    const baseYear = Number(match[1]);
    const year = baseYear + (match[2] === '+' ? 1 : -1) * Number(match[3]);
    return baseYear >= 1 && Number.isInteger(year) && year >= 1 && year <= 9999
        ? { valid: true, year }
        : { valid: false, message: 'The calculated year must be between 1 and 9999.' };
}

function parseBaseGenealogyDate(text, options = {})
{
    const raw = cleanGenealogyDateText(text).replace(/\s*\((?:year unknown|год неизвестен)\)$/i, '');
    if (!raw) return null;
    const calculation = calculateGenealogyYear(raw);
    if (calculation)
    {
        if (!calculation.valid) return { invalid: true, message: calculation.message };
        const parts = genealogyDateParts(calculation.year);
        return { ...parts, calculated: true, date: String(calculation.year) };
    }
    let match, parts;
    if ((match = raw.match(/^(\d{4})-(\d{1,2})(?:-(\d{1,2}))?$/))) parts = genealogyDateParts(match[1], match[2], match[3], options.calendar);
    else if ((match = raw.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{3,4})$/))) parts = genealogyDateParts(match[3], match[2], match[1], options.calendar);
    else if ((match = raw.match(/^(\d{1,2})[./](\d{3,4})$/))) parts = genealogyDateParts(match[2], match[1], null, options.calendar);
    else if ((match = raw.match(/^(\d{1,2})[./](\d{1,2})$/))) parts = genealogyDateParts(null, match[2], match[1], options.calendar);
    else if ((match = raw.match(/^(?:day|день|число)\s+(\d{1,2})(?:\s+(?:year|год)\s+(\d{1,4}))?$/i))) parts = genealogyDateParts(match[2], null, match[1], options.calendar);
    else if ((match = raw.match(/^(?:year|год)\s+(\d{1,4})$/i))) parts = genealogyDateParts(match[1]);
    else if ((match = raw.match(/^(?:day|день)\s+(\d{1,2}),\s+(\d{4})(?:\s+\((?:month unknown|месяц неизвестен)\))?$/i))) parts = genealogyDateParts(match[2], null, match[1], options.calendar);
    else if ((match = raw.match(/^(\d{1,2})\s+([\p{L}.]+)(?:\s+(\d{1,4})(?:\s*г\.?)?)?$/u)))
    {
        const month = monthByName(match[2]);
        parts = month ? genealogyDateParts(match[3], month, match[1], options.calendar) : null;
    }
    else if ((match = raw.match(/^([\p{L}.]+)(?:\s+(\d{1,4})(?:\s*г\.?)?)?$/u)))
    {
        const month = monthByName(match[1]);
        parts = month ? genealogyDateParts(match[2], month, null, options.calendar) : null;
    }
    else if ((match = raw.match(/^(\d{1,4})$/)))
    {
        if (match[1].length < 4 && Number(match[1]) <= 31)
            return { invalid: true, ambiguity: Number(match[1]), message: 'Choose whether this number is a day or a year.' };
        parts = genealogyDateParts(match[1]);
    }
    else if ((match = raw.match(/^([\p{L}.]+)\s+(\d{1,2}),?\s+(\d{4})$/u)))
        parts = genealogyDateParts(match[3], monthByName(match[1]), match[2], options.calendar);
    if (!parts || !Object.values(parts).some(Boolean)) return { invalid: true, message: 'Enter a valid date or the known date parts.' };
    return { ...parts, precision: ['year', 'month', 'day'].filter(key => parts[key] !== null).join('-'),
        date: dateValueFromParts(parts.year, parts.month, parts.day), dateLabel: dateLabelFromParts(parts.year, parts.month, parts.day),
        sortDate: sortDateFromParts(parts.year, parts.month, parts.day) };
}

function genealogyDayNumber(year, month, day, calendar = 'Gregorian')
{
    const a = Math.floor((14 - month) / 12), y = year + 4800 - a, m = month + 12 * a - 3;
    return day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4)
        + (calendar === 'Julian' ? -32083 : -Math.floor(y / 100) + Math.floor(y / 400) - 32045);
}

function genealogyPartBounds(parts, calendar)
{
    if (!parts?.year) return null;
    const months = parts.month ? [parts.month] : Array.from({ length: 12 }, (_, index) => index + 1);
    const bounds = months.filter(month => !parts.day || parts.day <= genealogyMonthDays(parts.year, month, calendar))
        .map(month => [genealogyDayNumber(parts.year, month, parts.day || 1, calendar),
            genealogyDayNumber(parts.year, month, parts.day || genealogyMonthDays(parts.year, month, calendar), calendar)]);
    return { min: bounds[0][0], max: bounds.at(-1)[1] };
}

function genealogyDateFromBase(base, type, originalText = '', calendar = 'Gregorian', secondBase = null)
{
    if (!base || base.invalid) return { valid: false, ...base, message: base?.message || 'Enter a valid date or the known date parts.' };
    const normalizedType = normalizeGenealogyDateType(type);
    if (normalizedType === 'Between' && (!secondBase || secondBase.invalid))
        return { valid: false, message: 'Between dates need a valid second date.', ambiguity: secondBase?.ambiguity, endpoint: 2 };
    const first = genealogyDateParts(base.year, base.month, base.day, calendar);
    const second = normalizedType === 'Between' ? genealogyDateParts(secondBase.year, secondBase.month, secondBase.day, calendar) : null;
    const startBounds = genealogyPartBounds(first, calendar), endBounds = genealogyPartBounds(second, calendar);
    if (startBounds && endBounds && startBounds.min > endBounds.max)
        return { valid: false, message: 'The second date must be after or equal to the first date.' };
    const value = { ...emptyGenealogyDate(normalizedType), state: 'known', first, second, calendar,
        originalText, date: dateValueFromParts(first.year, first.month, first.day), dateLabel: '',
        sortDate: sortDateFromParts(first.year, first.month, first.day),
        date2: second ? dateValueFromParts(second.year, second.month, second.day) : '',
        date2Label: second ? dateLabelFromParts(second.year, second.month, second.day) : '',
        sortDate2: second ? sortDateFromParts(second.year, second.month, second.day) : '' };
    value.dateLabel = genealogyDateDisplay(value, 'en');
    return { valid: true, value };
}

function genealogyDateDisplay(value, language = 'en')
{
    if (value.state === 'unknown') return language === 'ru' ? 'Дата неизвестна' : 'Date unknown';
    if (value.state === 'unparsed') return value.originalText;
    if (value.state !== 'known') return '';
    const label = dateLabelFromParts(value.first.year, value.first.month, value.first.day, language);
    const prefixes = language === 'ru' ? { 'About / Circa': 'Около', Before: 'До', After: 'После' }
        : { 'About / Circa': 'About', Before: 'Before', After: 'After' };
    if (value.dateType === 'Between')
    {
        const second = value.second || {};
        return `${language === 'ru' ? 'Между' : 'Between'} ${label} ${language === 'ru' ? 'и' : 'and'} ${dateLabelFromParts(second.year, second.month, second.day, language)}`;
    }
    return prefixes[value.dateType] ? `${prefixes[value.dateType]} ${label}` : label;
}

function parseGenealogyDateTextAsType(text, type, options = {})
{
    const raw = cleanGenealogyDateText(text), calendar = GENEALOGY_CALENDARS.includes(options.calendar) ? options.calendar : 'Gregorian';
    let normalizedType = normalizeGenealogyDateType(type);
    if (!raw) return options.date2 ? { valid: false, message: 'Enter the first date.' } : { valid: true, value: { ...emptyGenealogyDate(normalizedType), calendar } };
    if (/^(unknown|date unknown|неизвестно|дата неизвестна)$/i.test(raw))
        return { valid: true, value: { ...emptyGenealogyDate(), state: 'unknown', calendar, originalText: raw } };
    const range = raw.match(/^(?:between|между)\s+(.+?)\s+(?:and|и)\s+(.+)$/i)
        || raw.match(/^(\d{4})\s*[–—-]\s*(\d{4})$/);
    if (range) return genealogyDateFromBase(parseBaseGenealogyDate(range[1], { calendar }), 'Between', raw, calendar, parseBaseGenealogyDate(range[2], { calendar }));
    const prefix = raw.match(/^(about|circa|ca\.?|before|after|около|примерно|приблизительно|до|после)\s+/i);
    if (prefix) normalizedType = /^(before|до)$/i.test(prefix[1]) ? 'Before' : /^(after|после)$/i.test(prefix[1]) ? 'After' : 'About / Circa';
    return genealogyDateFromBase(parseBaseGenealogyDate(raw.replace(/^(about|circa|ca\.?|before|after|около|примерно|приблизительно|до|после)\s+/i, ''), { calendar }), normalizedType, raw, calendar,
        normalizedType === 'Between' ? parseBaseGenealogyDate(options.date2 || options.date2Label, { calendar }) : null);
}

function parseGenealogyDateText(text)
{
    return parseGenealogyDateTextAsType(text, 'Exact date');
}

function buildGenealogyDateFromParts(type, parts = {})
{
    const calendar = parts.calendar || 'Gregorian';
    const firstCalculation = calculateGenealogyYear(parts.year);
    const secondCalculation = calculateGenealogyYear(parts.year2);
    if (firstCalculation?.valid === false) return { valid: false, message: firstCalculation.message };
    if (secondCalculation?.valid === false) return { valid: false, message: secondCalculation.message };
    const first = genealogyDateParts(firstCalculation?.year ?? parts.year, parts.month, parts.day, calendar);
    const second = genealogyDateParts(secondCalculation?.year ?? parts.year2, parts.month2, parts.day2, calendar);
    if (!first || !second) return { valid: false, message: 'Enter a valid date or the known date parts.' };
    if (!Object.values(first).some(Boolean) && !Object.values(second).some(Boolean)) return { valid: true, value: { ...emptyGenealogyDate(type), calendar } };
    if (!Object.values(first).some(Boolean)) return { valid: false, message: 'Enter the first date.' };
    return genealogyDateFromBase(first, type, '', calendar, Object.values(second).some(Boolean) ? second : null);
}

function normalizeGenealogyDateInput(input, fallbackType = 'Exact date')
{
    if (!input) return emptyGenealogyDate(fallbackType);
    if (typeof input === 'string')
    {
        const parsed = parseGenealogyDateText(input);
        return parsed.valid ? parsed.value : { ...emptyGenealogyDate(fallbackType), state: 'unparsed', originalText: cleanGenealogyDateText(input) };
    }
    if (input.date && typeof input.date === 'object' && !input.first) return normalizeGenealogyDateInput(input.date, fallbackType);
    const type = normalizeGenealogyDateType(input.dateType || fallbackType), calendar = input.calendar || 'Gregorian';
    let parsed;
    if (input.state === 'unknown' || input.dateType === 'Unknown') parsed = { valid: true, value: { ...emptyGenealogyDate(type), state: 'unknown', calendar } };
    else if (input.first && input.state !== 'unparsed')
        parsed = buildGenealogyDateFromParts(type, { ...input.first, calendar, year2: input.second?.year, month2: input.second?.month, day2: input.second?.day });
    else parsed = parseGenealogyDateTextAsType(input.date || input.fromDate || input.dateLabel || input.originalText, type,
        { calendar, date2: input.date2 || input.toDate || input.date2Label });
    const value = parsed.valid ? parsed.value : { ...emptyGenealogyDate(type), state: 'unparsed', calendar, originalText: cleanGenealogyDateText(input.originalText || input.dateLabel || input.date) };
    return { ...input, ...value, originalText: cleanGenealogyDateText(input.originalText || value.originalText),
        placeId: cleanDatePlaceId(input.placeId), reason: input.reason || '', burialPlaceId: cleanDatePlaceId(input.burialPlaceId) };
}

function formatGenealogyDateLabel(input)
{
    return genealogyDateDisplay(normalizeGenealogyDateInput(input), document.documentElement.lang === 'ru' ? 'ru' : 'en');
}

function formatGenealogyDateStartLabel(input)
{
    const value = normalizeGenealogyDateInput(input);
    return value.state === 'known' ? dateLabelFromParts(value.first.year, value.first.month, value.first.day, document.documentElement.lang)
        : value.state === 'unknown' ? document.documentElement.lang === 'ru' ? 'Дата неизвестна' : 'Date unknown' : value.originalText || '';
}

function formatGenealogyDateEndLabel(input)
{
    const value = normalizeGenealogyDateInput(input), second = value.second;
    return second ? dateLabelFromParts(second.year, second.month, second.day, document.documentElement.lang) : '';
}

function genealogyDatePartsFromModel(input)
{
    const value = normalizeGenealogyDateInput(input), first = value.first || {}, second = value.second || {};
    const part = number => number ? String(number).padStart(2, '0') : '';
    return { year: first.year ? String(first.year).padStart(4, '0') : '', month: part(first.month), day: part(first.day),
        year2: second.year ? String(second.year).padStart(4, '0') : '', month2: part(second.month), day2: part(second.day) };
}

function genealogyDateBounds(input)
{
    const value = normalizeGenealogyDateInput(input);
    if (value.state !== 'known') return null;
    const first = genealogyPartBounds(value.first, value.calendar);
    if (value.dateType === 'About / Circa') return null;
    if (value.dateType === 'Before') return first ? { min: -Infinity, max: first.min - 1 } : null;
    if (value.dateType === 'After') return first ? { min: first.max + 1, max: Infinity } : null;
    if (value.dateType === 'Between')
    {
        const second = genealogyPartBounds(value.second, value.calendar);
        return first || second ? { min: first?.min ?? -Infinity, max: second?.max ?? Infinity } : null;
    }
    return first;
}

function genealogyDateSortValue(input)
{
    const value = normalizeGenealogyDateInput(input);
    return genealogyPartBounds(value.first, value.calendar)?.min ?? genealogyPartBounds(value.second, value.calendar)?.min ?? Infinity;
}

function genealogyDateDefinitelyAfter(first, second)
{
    const a = genealogyDateBounds(first), b = genealogyDateBounds(second);
    return Boolean(a && b && a.min > b.max);
}

function genealogyDateMatchesYearFilter(input, range)
{
    if (!range?.mode || !Number.isInteger(Number(range.from)) || !range.from) return true;
    const value = normalizeGenealogyDateInput(input);
    if (!value.first?.year && !value.second?.year) return false;
    const bounds = genealogyDateBounds(value) || genealogyPartBounds(value.first, value.calendar);
    if (!bounds) return false;
    const first = Number(range.from), last = Number(range.to || range.from);
    const min = range.mode === 'before' ? -Infinity : range.mode === 'after'
        ? genealogyDayNumber(first, 12, 31) + 1 : genealogyDayNumber(first, 1, 1);
    const max = range.mode === 'after' ? Infinity : range.mode === 'before'
        ? genealogyDayNumber(first, 1, 1) - 1 : genealogyDayNumber(last, 12, 31);
    return bounds.min <= max && bounds.max >= min;
}

function genealogyDatesCompatible(left, right)
{
    const a = normalizeGenealogyDateInput(left), b = normalizeGenealogyDateInput(right);
    if (a.state !== 'known' || b.state !== 'known') return true;
    const ab = genealogyDateBounds(a), bb = genealogyDateBounds(b);
    if (ab && bb && (ab.min > bb.max || bb.min > ab.max)) return false;
    if (a.calendar !== b.calendar || a.dateType !== 'Exact date' || b.dateType !== 'Exact date') return true;
    return ['year', 'month', 'day'].every(key => !a.first[key] || !b.first[key] || a.first[key] === b.first[key]);
}

function genealogyCivilFromDay(number)
{
    const a = number + 32044, b = Math.floor((4 * a + 3) / 146097), c = a - Math.floor(146097 * b / 4);
    const d = Math.floor((4 * c + 3) / 1461), e = c - Math.floor(1461 * d / 4), m = Math.floor((5 * e + 2) / 153);
    return { year: 100 * b + d - 4800 + Math.floor(m / 10), month: m + 3 - 12 * Math.floor(m / 10),
        day: e - Math.floor((153 * m + 2) / 5) + 1 };
}

function genealogyAgeRange(birth, occurrence = undefined)
{
    const now = new Date();
    const end = occurrence === undefined ? buildGenealogyDateFromParts('Exact date', { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() }).value : occurrence;
    const a = genealogyDateBounds(birth), b = genealogyDateBounds(end);
    if (!a || !b || ![a.min, a.max, b.min, b.max].every(Number.isFinite) || b.max < a.min) return null;
    const age = (from, to) =>
    {
        const x = genealogyCivilFromDay(from), y = genealogyCivilFromDay(to);
        return y.year - x.year - (y.month < x.month || y.month === x.month && y.day < x.day ? 1 : 0);
    };
    const low = Math.max(0, age(a.max, b.min)), high = age(a.min, b.max);
    return low === high ? low : `${low}–${high}`;
}

function normalizeAllGenealogyDateRecords()
{
    const personDates = person =>
    {
        for (const key of ['birth', 'death']) person[key] = normalizeGenealogyDateInput(person[key]);
        for (const event of person.events || []) if (event.date) event.date = normalizeGenealogyDateInput(event.date);
        for (const attribute of person.attributes || [])
            for (const key of ['date', 'fromDate', 'toDate']) if (attribute[key]) attribute[key] = normalizeGenealogyDateInput(attribute[key]);
    };
    (sampleData.people || []).forEach(personDates);
    for (const family of sampleData.families || [])
        for (const event of family.events || []) if (event.date) event.date = normalizeGenealogyDateInput(event.date);
    for (const photo of sampleData.media || []) photo.date = normalizeGenealogyDateInput(photo.date);
    for (const file of sampleData.archiveFiles || [])
        if (file.documentDate) file.documentDate = normalizeGenealogyDateInput(file.documentDate.value
            ? { date: file.documentDate.value, dateType: file.documentDate.type } : file.documentDate);
    for (const source of sampleData.sources || [])
    {
        const value = normalizeGenealogyDateInput(source.accessedDate);
        source.accessedDate = value.state === 'empty' ? '' : value;
    }
    for (const board of sampleData.boards || [])
    {
        (board.diagram?.people || []).forEach(personDates);
        for (const family of board.diagram?.families || [])
            for (const event of family.events || []) if (event.date) event.date = normalizeGenealogyDateInput(event.date);
    }
}
