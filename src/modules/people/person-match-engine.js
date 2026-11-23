// Derived, project-scoped identity search. Never changes canonical records.
const PersonMatchEngine = (() =>
{
    const SOFT_YEAR_TOLERANCE = 5;
    const MAX_EVALUATED = 400;
    const CYRILLIC = {
        а: 'a', б: 'b', в: 'v', г: 'g', ґ: 'g', д: 'd', е: 'e', ё: 'yo', є: 'ye', ж: 'zh',
        з: 'z', и: 'i', і: 'i', ї: 'yi', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o',
        п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch',
        ш: 'sh', щ: 'sh', ь: '', ы: 'y', ъ: '', э: 'e', ю: 'yu', я: 'ya'
    };
    const NAME_ROLES = ['first', 'middle', 'last', 'maiden'];

    function normalized(value)
    {
        return String(value ?? '').normalize('NFKC').trim().toLowerCase().replace(/\s+/g, ' ');
    }

    function latin(value)
    {
        return normalized(value).replace(/[а-яёіїєґ]/g, letter => CYRILLIC[letter] ?? letter);
    }

    function keys(value)
    {
        const original = normalized(value);
        return [...new Set([original, latin(original)].filter(Boolean))];
    }

    function meaningful(value)
    {
        const name = normalized(value);
        return name.length >= 3 && !['unknown', 'unnamed', 'неизвестно', 'неизвестный', 'неизвестная'].includes(name);
    }

    function grams(value)
    {
        const source = normalized(value);
        if (source.length < 4) return [];
        const result = new Set();
        for (let i = 0; i <= source.length - 3; i += 1) result.add(source.slice(i, i + 3));
        return [...result];
    }

    function distance(left, right, max)
    {
        if (Math.abs(left.length - right.length) > max) return max + 1;
        let row = Array.from({ length: right.length + 1 }, (_, i) => i);
        for (let i = 1; i <= left.length; i += 1)
        {
            const next = [i];
            let smallest = i;
            for (let j = 1; j <= right.length; j += 1)
            {
                const value = Math.min(next[j - 1] + 1, row[j] + 1,
                    row[j - 1] + (left[i - 1] === right[j - 1] ? 0 : 1));
                next[j] = value;
                smallest = Math.min(smallest, value);
            }
            if (smallest > max) return max + 1;
            row = next;
        }
        return row[right.length];
    }

    function nameQuality(query, candidate)
    {
        if (!meaningful(query) || !meaningful(candidate)) return 0;
        let quality = 0;
        for (const a of keys(query)) for (const b of keys(candidate))
        {
            if (a === b) return 3;
            const limit = Math.min(a.length, b.length) >= 5 ? 2 : 1;
            if (Math.max(a.length, b.length) <= 48 && Math.min(a.length, b.length) >= 4
                && distance(a, b, limit) <= limit) quality = 2;
        }
        return quality;
    }

    function alternativeNames(value)
    {
        return String(value || '').split(/[;|\n]+/).map(part =>
            normalized(part).split(/[\s,()]+/).filter(meaningful)).filter(parts => parts.length);
    }

    function nameValues(person)
    {
        const names = person.names || {};
        const aliases = alternativeNames(person.profile?.alternativeNames);
        const givenAliases = aliases.map(parts => parts[0]);
        const middleAliases = aliases.filter(parts => parts.length > 2).flatMap(parts => parts.slice(1, -1));
        const surnameAliases = aliases.filter(parts => parts.length >= 2).map(parts => parts.at(-1));
        return {
            first: [names.first, ...givenAliases].filter(meaningful),
            middle: [names.middle, ...middleAliases].filter(meaningful),
            last: [names.last, names.maiden, ...surnameAliases].filter(meaningful),
            maiden: [names.maiden, names.last, ...surnameAliases].filter(meaningful)
        };
    }

    function placeValues(event, places)
    {
        const record = event?.placeId ? places.get(event.placeId) : null;
        const values = [event?.placeText, record?.name, ...(record?.alternativeNames || [])];
        return [...new Set(values.flatMap(value =>
        {
            if (!value) return [];
            const raw = normalized(value);
            return [raw, normalized(raw.split(',')[0])].filter(Boolean);
        }))];
    }

    function relationshipIndex(families)
    {
        const related = new Map();
        const add = (personId, kind, targetId) =>
        {
            if (!personId || !targetId || personId === targetId) return;
            if (!related.has(personId)) related.set(personId, { parent: new Set(), child: new Set(), sibling: new Set(), partner: new Set() });
            related.get(personId)[kind].add(targetId);
        };
        for (const family of families)
        {
            const parents = [...new Set([family.partnerAId, family.partnerBId].filter(Boolean))];
            const children = [...new Set(family.childIds || [])];
            if (parents.length === 2)
            {
                add(parents[0], 'partner', parents[1]);
                add(parents[1], 'partner', parents[0]);
            }
            for (const parent of parents) for (const child of children)
            {
                add(parent, 'child', child);
                add(child, 'parent', parent);
            }
            for (const child of children) for (const sibling of children) add(child, 'sibling', sibling);
        }
        return related;
    }

    function preparePerson(person, places)
    {
        return {
            id: person.id,
            person,
            names: nameValues(person),
            birth: person.birth,
            death: person.death,
            birthPlaces: placeValues(person.birth, places),
            deathPlaces: placeValues(person.death, places)
        };
    }

    function createIndex(people, places, families, projectId)
    {
        const placeMap = new Map((places || []).filter(place => place.projectId === projectId).map(place => [place.id, place]));
        const entries = new Map();
        const byName = new Map();
        const byGram = new Map();
        const add = (map, key, id) =>
        {
            if (!map.has(key)) map.set(key, new Set());
            map.get(key).add(id);
        };
        for (const person of people || [])
        {
            if (!person?.id || person.projectId !== projectId || person.deleted) continue;
            const entry = preparePerson(person, placeMap);
            entries.set(person.id, entry);
            const tokens = new Set(Object.values(entry.names).flat().flatMap(keys).filter(meaningful));
            for (const token of tokens)
            {
                add(byName, token, person.id);
                for (const gram of grams(token)) add(byGram, gram, person.id);
            }
        }
        return { projectId, entries, byName, byGram, places: placeMap,
            relationships: relationshipIndex((families || []).filter(family => family.projectId === projectId)) };
    }

    function yearWindow(event)
    {
        const first = event?.first?.year;
        if (!first) return null;
        if (event.dateType === 'Before') return { min: -Infinity, max: first };
        if (event.dateType === 'After') return { min: first, max: Infinity };
        if (event.dateType === 'Between')
            return { min: first, max: event.second?.year || first };
        if (event.dateType === 'About / Circa')
            return { min: first - SOFT_YEAR_TOLERANCE, max: first + SOFT_YEAR_TOLERANCE };
        return { min: first, max: first };
    }

    // Same civil-day conversion used by the structured genealogy date model.
    function dayNumber(parts, calendar)
    {
        const { year, month, day } = parts || {};
        if (!year || !month || !day) return null;
        const a = Math.floor((14 - month) / 12);
        const y = year + 4800 - a;
        const m = month + 12 * a - 3;
        return day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4)
            + (calendar === 'Julian' ? -32083 : -Math.floor(y / 100) + Math.floor(y / 400) - 32045);
    }

    function dateEvidence(left, right)
    {
        if (left?.state !== 'known' || right?.state !== 'known')
            return { strength: 0, conflict: false, yearGap: null };
        const a = left.first || {}, b = right.first || {};
        const leftWindow = yearWindow(left), rightWindow = yearWindow(right);
        const gap = leftWindow && rightWindow ? Math.max(0,
            leftWindow.min - rightWindow.max, rightWindow.min - leftWindow.max) : null;
        const conflict = gap !== null && gap > SOFT_YEAR_TOLERANCE;
        const years = a.year && b.year ? Math.abs(a.year - b.year) : null;
        const exact = (left.dateType || 'Exact date') === 'Exact date'
            && (right.dateType || 'Exact date') === 'Exact date';
        const sameCalendar = (left.calendar || 'Gregorian') === (right.calendar || 'Gregorian');
        const sameParts = a.month && a.day && b.month && b.day
            && a.month === b.month && a.day === b.day && sameCalendar;
        const leftDay = dayNumber(a, left.calendar), rightDay = dayNumber(b, right.calendar);
        const sameCivilDay = leftDay !== null && rightDay !== null && leftDay === rightDay;
        const precise = exact && (sameCivilDay || (sameParts && (gap === null || gap <= SOFT_YEAR_TOLERANCE)));
        const strength = conflict ? 0 : precise ? 2 : gap === 0 ? 1 : 0;
        return { strength, conflict, yearGap: years };
    }

    function placeEvidence(left, right, leftValues, rightValues, places)
    {
        if (left?.placeId && right?.placeId)
        {
            if (left.placeId === right.placeId) return 2;
            // Different saved Places can share a short city name. Compare
            // complete recorded names/aliases, not truncated display labels.
            const a = places.get(left.placeId);
            const b = places.get(right.placeId);
            if (!a || !b) return 0;
            const fullNames = place => [place.name, ...(place.alternativeNames || [])]
                .map(normalized).filter(Boolean);
            const otherNames = new Set(fullNames(b));
            return fullNames(a).some(name => otherNames.has(name)) ? 2 : 0;
        }
        // When one side is unlinked text, partial locality labels are useful.
        return leftValues.some(value => rightValues.includes(value)) ? 2 : 0;
    }

    function candidateIds(index, draft)
    {
        const counts = new Map();
        for (const role of NAME_ROLES)
        {
            const value = draft.names?.[role];
            if (!meaningful(value)) continue;
            const hits = new Map();
            for (const key of keys(value))
            {
                const exact = index.byName.get(key);
                for (const id of exact || []) hits.set(id, 10);
                if (exact?.size) continue;
                const gramHits = new Map();
                for (const gram of grams(key)) for (const id of index.byGram.get(gram) || [])
                    gramHits.set(id, (gramHits.get(id) || 0) + 1);
                for (const [id, count] of gramHits)
                    if (count >= 2 && !hits.has(id)) hits.set(id, 1 + count);
            }
            for (const [id, strength] of hits) counts.set(id, (counts.get(id) || 0) + strength);
        }
        const relevance = id =>
        {
            const entry = index.entries.get(id);
            if (!entry) return 0;
            let bonus = 0;
            if (draft.birth?.placeId && draft.birth.placeId === entry.birth?.placeId) bonus += 15;
            const day = draft.birth?.first?.day;
            const month = draft.birth?.first?.month;
            if (day && month && day === entry.birth?.first?.day && month === entry.birth?.first?.month) bonus += 15;
            return bonus;
        };
        return [...counts].sort((a, b) => b[1] + relevance(b[0]) - a[1] - relevance(a[0])
            || a[0].localeCompare(b[0])).slice(0, MAX_EVALUATED).map(item => item[0]);
    }

    function evaluate(entry, draft, context)
    {
        let nameMatches = 0;
        let score = 0;
        const matchedNameValues = new Set();
        const reasons = [];
        for (const role of NAME_ROLES)
        {
            const query = draft.names?.[role];
            if (!meaningful(query)) continue;
            const quality = Math.max(0, ...entry.names[role].map(value => nameQuality(query, value)));
            if (quality && !matchedNameValues.has(normalized(query)))
            {
                matchedNameValues.add(normalized(query));
                nameMatches += 1;
                score += quality === 3 ? 24 : 15;
                reasons.push({ kind: 'name', field: role, exact: quality === 3 });
            }
            else if (role === 'last' && meaningful(entry.person.names?.last)) score -= 4;
        }
        if (!nameMatches) return null;
        const birth = dateEvidence(draft.birth, entry.birth);
        const death = dateEvidence(draft.death, entry.death);
        if (birth.conflict || death.conflict) return null;
        const draftBirthPlaces = placeValues(draft.birth, context.places);
        const draftDeathPlaces = placeValues(draft.death, context.places);
        const birthPlace = placeEvidence(draft.birth, entry.birth, draftBirthPlaces, entry.birthPlaces, context.places);
        const deathPlace = placeEvidence(draft.death, entry.death, draftDeathPlaces, entry.deathPlaces, context.places);
        const hasStrongDate = birth.strength === 2 || death.strength === 2;
        const hasPlace = Boolean(birthPlace || deathPlace);
        const related = context.relationships.get(entry.id);
        const inverse = { parent: 'child', child: 'parent', partner: 'partner', sibling: 'sibling' };
        const family = Boolean(context.anchorPersonId && context.relationshipType
            && related?.[inverse[context.relationshipType]]?.has(context.anchorPersonId));
        const strongSecondary = Number(hasStrongDate) + Number(hasPlace) + Number(family);
        if (nameMatches < 2 && strongSecondary < 2) return null;
        if (birth.strength) { score += birth.strength === 2 ? 12 : 3; reasons.push({ kind: 'date', field: 'birth' }); }
        if (death.strength) { score += death.strength === 2 ? 10 : 2; reasons.push({ kind: 'date', field: 'death' }); }
        if (birthPlace) { score += 10; reasons.push({ kind: 'place', field: 'birth' }); }
        if (deathPlace) { score += 9; reasons.push({ kind: 'place', field: 'death' }); }
        if (family) { score += 10; reasons.push({ kind: 'family' }); }
        if (birth.yearGap) score -= Math.min(birth.yearGap, SOFT_YEAR_TOLERANCE) * 2;
        if (death.yearGap) score -= Math.min(death.yearGap, SOFT_YEAR_TOLERANCE) * 2;
        return { personId: entry.id, person: entry.person, score,
            tier: nameMatches >= 2 && strongSecondary >= 2 && score >= 65 ? 'strong' : 'moderate', reasons };
    }

    // A future SQL adapter can prepare candidate projections, then reuse
    // this evaluator without the in-memory retrieval index.
    function rankCandidates(entries, draft, options = {})
    {
        // A SQL-backed candidate source must always supply the project scope.
        if (!options.projectId) return [];
        const names = NAME_ROLES.filter(role => meaningful(draft.names?.[role]));
        if (!names.length) return [];
        const context = {
            places: options.places || new Map(),
            relationships: options.relationships || new Map(),
            anchorPersonId: options.anchorPersonId || '',
            relationshipType: options.relationshipType || ''
        };
        const excluded = new Set(options.excludeIds || []);
        const results = [];
        for (const entry of entries)
        {
            if (!entry || excluded.has(entry.id) || entry.person.deleted
                || entry.person.projectId !== options.projectId) continue;
            const match = evaluate(entry, draft, context);
            if (match) results.push(match);
        }
        return results.sort((a, b) => b.score - a.score || a.personId.localeCompare(b.personId))
            .slice(0, Math.max(1, options.limit || 2));
    }

    function search(index, draft, options = {})
    {
        return rankCandidates(candidateIds(index, draft).map(id => index.entries.get(id)), draft, {
            ...options,
            projectId: index.projectId,
            places: index.places,
            relationships: index.relationships
        });
    }

    return { preparePerson, createIndex, rankCandidates, search, dateEvidence,
        nameQuality, SOFT_YEAR_TOLERANCE };
})();
