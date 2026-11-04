const RU_PLURAL_RULES_FORMATTER =
    new Intl.PluralRules('ru');

const RU_NUMBER_FORMATTER =
    new Intl.NumberFormat('ru');

const LOCALIZATION_TEXT_CACHE_LIMIT =
    4096;

const localizationTextCache =
    new Map();

function cacheLocalizedText(
    source,
    translated
)
{
    if (
        !localizationTextCache.has(source)
        && localizationTextCache.size
          >= LOCALIZATION_TEXT_CACHE_LIMIT
    )
    {
        localizationTextCache.delete(
            localizationTextCache
                .keys()
                .next()
                .value
        );
    }

    localizationTextCache.set(
        source,
        translated
    );

    return translated;
}

const RU_LOCALIZATION = Object.freeze({
    ui: RU_UI_MODULE_BLOCKS,
    terms: RU_TERM_BLOCKS,
    data: RU_DATA_BLOCKS,
    plurals: RU_PLURALS
});


const DEFAULT_DOCUMENT_TITLE =
    document.title;

const LOCALIZABLE_DOM_ATTRIBUTES =
    Object.freeze([
        'placeholder',
        'aria-label',
        'aria-description',
        'aria-valuetext',
        'aria-placeholder',
        'title',
        'alt',
        'data-toast'
    ]);

const LOCALIZABLE_DOM_ATTRIBUTE_SELECTOR =
    LOCALIZABLE_DOM_ATTRIBUTES
        .map(attribute =>
            `[${attribute}]`
        )
        .join(',');

function escapeLocalizationRegExp(
    value
)
{
    return String(value)
        .replace(
            /[.*+?^${}()|[\]\\]/g,
            '\\$&'
        );
}

/*
    * Attribute values often contain composed copy:
    *
    * "Open Silver Whiskerfield profile"
    * "Actions for Luna Purrington"
    *
    * Translate known RU_UI fragments, but only at
    * token boundaries so short keys do not corrupt
    * unrelated words.
    *
    * Example:
    * "Off" must not mutate "Office".
    */
const RU_EXACT_EMBEDDED_RULES =
    Object.keys(
        RU_EXACT
    )
        .filter(key =>
            key.length > 2
          && RU_EXACT[key] !== key
        )
        .sort(
            (left, right) =>
                right.length
            - left.length
        )
        .map(key => ({
            translation:
            RU_EXACT[key],

            pattern:
            new RegExp(
                `(^|[^\\p{L}\\p{N}_])${escapeLocalizationRegExp(
                    key
                )}(?=$|[^\\p{L}\\p{N}_])`,
                'gu'
            )
        }));


function isTechnicalLocalizationValue(
    value
)
{
    const source =
        String(value || '').trim();

    if (!source)
    {
        return false;
    }

    /*
      * Do not translate URL or filesystem contents.
      * These are data/identifiers, not localized UI.
      */
    return /^(?:https?:\/\/|mailto:|tel:|[a-z]:\\|\/(?:[^/\s]+\/)+)/i
        .test(source);
}

function normalizeLang(lang)
{
    return SUPPORTED_LANGUAGES.includes(lang) ? lang : 'en';
}

function initialLanguage()
{
    const url = new URL(window.location.href);
    const requested = url.searchParams.get('lang');
    if (!SUPPORTED_LANGUAGES.includes(requested))
    {
        return normalizeLang(localStorage.getItem(LANGUAGE_STORAGE_KEY) || 'en');
    }

    localStorage.setItem(LANGUAGE_STORAGE_KEY, requested);
    url.searchParams.delete('lang');
    try
    {
        history.replaceState(history.state, '', url.href);
    }
    catch (_error)
    {
        // Some direct-file browsers disallow history replacement.
    }
    return requested;
}

function translateExact(value)
{
    if (!value) return value;

    const trimmed =
        String(value).trim();

    return (
        state.language === 'ru'
        && Object.prototype
            .hasOwnProperty.call(
                RU_EXACT,
                trimmed
            )
    )
        ? RU_EXACT[trimmed]
        : trimmed;
}

function t(
    key
)
{
    const source =
        key == null
            ? ''
            : String(key);

    if (
        state.language !== 'ru'
    )
    {
        return source;
    }

    return Object.prototype
        .hasOwnProperty.call(
            RU_UI,
            source
        )
        ? RU_UI[source]
        : source;
}

function translateCountPhrase(
    text
)
{
    if (
        state.language !== 'ru'
    )
    {
        return text;
    }

    return String(text).replace(
        /(\d[\d\s.,]*)\s+(people|person|places|place|stops|stop|photos|photo|albums|album|files|file|folders|folder|notes|note|events|event|sources|source|questions|question|projects|project|objects|object|boards|board|connections|connection|relationships|relationship|items|item|names|name|years|year|records|record|collections|collection|subfolders|subfolder)\b/gi,
        (
            match,
            rawNumber,
            noun
        ) =>
        {
            const number =
                Number(
                    String(rawNumber)
                        .replace(
                            /[\s,]/g,
                            ''
                        )
                );

            if (
                !Number.isFinite(
                    number
                )
            )
            {
                return match;
            }

            const forms =
                RU_PLURALS[noun]
            || RU_PLURALS[
                noun.toLowerCase()
            ];

            if (!forms)
            {
                return match;
            }

            const rule =
                RU_PLURAL_RULES_FORMATTER
                    .select(number);

            const word =
                forms[rule]
            || forms.other;

            return `${
                RU_NUMBER_FORMATTER
                    .format(number)
            } ${word}`;
        }
    );
}

function translateDynamicPhrase(core)
{
    if (
        state.language !== 'ru'
        || core == null
        || core === ''
    )
    {
        return core;
    }

    const photoLinkInstruction = String(core).trim().match(
        /^Selected and uploaded photos will be linked to ([\s\S]+)\.$/
    );

    if (photoLinkInstruction)
    {
        return `Выбранные и загруженные фотографии будут связаны с «${photoLinkInstruction[1]}».`;
    }

    const sourceLinkInstruction = String(core).trim().match(
        /^Connect existing sources to ([\s\S]+)\.$/
    );

    if (sourceLinkInstruction)
    {
        if (sourceLinkInstruction[1] === 'this record')
        {
            return 'Связать существующие источники с этой записью.';
        }

        return `Связать существующие источники с «${sourceLinkInstruction[1]}».`;
    }

    const folderDropMessage = String(core).trim().match(
        /^Drop files here to add them to “([\s\S]*)”, or click to choose files\.$/
    );

    if (folderDropMessage)
    {
        const folderName = folderDropMessage[1];

        return `Перетащите файлы сюда, чтобы добавить их в папку «${translateExact(folderName)}», или нажмите, чтобы выбрать файлы.`;
    }

    const movePlaceInstruction = String(core).trim().match(
        /^Drag the draft marker or click the map to reposition ([\s\S]+)\.$/
    );

    if (movePlaceInstruction)
    {
        return `Перетащите маркер или нажмите на карту, чтобы изменить положение места «${movePlaceInstruction[1]}».`;
    }

    const positionPlaceInstruction = String(core).trim().match(
        /^Click the map to position ([\s\S]+), or use the map centre\.$/
    );

    if (positionPlaceInstruction)
    {
        return `Нажмите на карту, чтобы указать положение места «${positionPlaceInstruction[1]}», или используйте центр карты.`;
    }

    let out =
        String(core).trim();

    const repl =
        (pattern, replacement) =>
        {
            out = out.replace(
                pattern,
                replacement
            );
        };

    const formatNumber =
        value =>
        {
            const number =
                Number(
                    String(value)
                        .replace(
                            /[\s,]/g,
                            ''
                        )
                );

            return Number.isFinite(number)
                ? RU_NUMBER_FORMATTER
                    .format(number)
                : String(value);
        };

    /*
        Translate an exact dynamic value when possible.

        This is important for database values such as:
        - project names
        - person names
        - places
        - modules
        - statuses
        - sample-data labels

        If a lowercase dynamic value such as "projects"
        is received, also try the capitalized RU_UI key.
      */
    const translateValue =
        value =>
        {
            const source =
                String(value || '').trim();

            if (!source)
            {
                return source;
            }

            const exact =
                translateExact(source);

            if (exact !== source)
            {
                return exact;
            }

            const capitalized =
                source.charAt(0)
                    .toUpperCase()
            + source.slice(1);

            const capitalizedTranslation =
                translateExact(
                    capitalized
                );

            if (
                capitalizedTranslation
              !== capitalized
            )
            {
                return capitalizedTranslation;
            }

            return source;
        };

    /*
       * Places map-position summaries.
       *
       * Supports both the standalone status and
       * the summary containing coordinates.
       */
    repl(
        /^Mapped(?:\s+at\s+(.+))?$/i,
        (
            _match,
            coordinates
        ) =>
            coordinates
                ? `На карте: ${coordinates}`
                : 'На карте'
    );

    /*
        formatProjectDate() currently produces English
        month abbreviations. Translate them when they occur
        inside generated date phrases.
      */
    const translateDateValue =
        value =>
        {
            const translated =
                translateValue(value);

            const monthNames = {
                jan: 'янв.',
                january: 'января',
                feb: 'февр.',
                february: 'февраля',
                mar: 'мар.',
                march: 'марта',
                apr: 'апр.',
                april: 'апреля',
                may: 'мая',
                jun: 'июн.',
                june: 'июня',
                jul: 'июл.',
                july: 'июля',
                aug: 'авг.',
                august: 'августа',
                sep: 'сент.',
                september: 'сентября',
                oct: 'окт.',
                october: 'октября',
                nov: 'нояб.',
                november: 'ноября',
                dec: 'дек.',
                december: 'декабря'
            };

            return String(translated)
                .replace(
                    /\btoday at\b/gi,
                    'сегодня в'
                )
                .replace(
                    /\byesterday at\b/gi,
                    'вчера в'
                )
                .replace(
                    /\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\b/gi,
                    match =>
                        monthNames[
                            match.toLowerCase()
                        ] || match
                );
        };

    const pluralWord =
        (noun, count) =>
        {
            const source =
                String(noun || '');

            const forms =
                RU_PLURALS[source]
            || RU_PLURALS[
                source.toLowerCase()
            ];

            if (!forms)
            {
                return translateValue(
                    source
                );
            }

            const numericCount =
                Number(count);

            const rule =
                RU_PLURAL_RULES_FORMATTER
                    .select(
                        Number.isFinite(
                            numericCount
                        )
                            ? numericCount
                            : 0
                    );

            return forms[rule]
            || forms.other;
        };

    const countPhrase =
        (count, noun) =>
        {
            const numericCount =
                Number(
                    String(count)
                        .replace(
                            /[\s,]/g,
                            ''
                        )
                );

            if (
                !Number.isFinite(
                    numericCount
                )
            )
            {
                return `${count} ${translateValue(noun)}`;
            }

            return `${
                RU_NUMBER_FORMATTER
                    .format(numericCount)
            } ${
                pluralWord(
                    noun,
                    numericCount
                )
            }`;
        };

    // Project insights: translate descriptions for any count.
    repl(
        /\b(\d+)\s+(?:person is|people are)\s+missing birth details\.$/i,
        (_, count) =>
            `Неполные сведения о рождении: ${
                translateCountPhrase(`${count} people`)
            }.`
    );

    repl(
        /\b(\d+)\s+archive\s+(?:file is|files are)\s+missing source information\.$/i,
        (_, count) =>
            `Архивные файлы без источника: ${formatNumber(count)}.`
    );

    repl(
        /\b(\d+)\s+(?:photo is|photos are)\s+not assigned to an album\.$/i,
        (_, count) =>
            `Фото вне альбомов: ${formatNumber(count)}.`
    );

    repl(
        /\b(\d+)\s+(?:place needs|places need)\s+review\.$/i,
        (_, count) =>
            `Места для проверки: ${formatNumber(count)}.`
    );

    const countNouns =
        'people|person|places|place|stops|stop|photos|photo|albums|album|files|file|notes|note|events|event|sources|source|questions|question|projects|project|objects|object|boards|board|connections|connection|relationships|relationship|items|item|names|name|years|year|records|record|collections|collection|subfolders|subfolder';

    /*
        Sorting / searching / pagination
      */

    repl(
        /^Sort:\s*(.+)$/i,
        (_, value) =>
            `Сортировка: ${
                translateValue(value)
            }`
    );

    repl(
        /^Search\s+(.+?)(\.{3})?$/i,
        (_, value, ellipsis) =>
            `Поиск: ${
                translateValue(value)
            }${ellipsis || ''}`
    );

    repl(
        /^Rows per page:\s*(\d+)$/i,
        (_, number) =>
            `Строк на странице: ${
                formatNumber(number)
            }`
    );

    repl(
        new RegExp(
            `^Showing\\s+(.+?)\\s+of\\s+(\\d+)\\s+(${countNouns})$`,
            'i'
        ),
        (
            _,
            range,
            total,
            noun
        ) =>
            `Показано ${range} из ${
                formatNumber(total)
            } ${
                pluralWord(
                    noun,
                    Number(total)
                )
            }`
    );

    repl(
        /^Showing\s+(\d+)\s+of\s+(\d+)$/i,
        (_, current, total) =>
            `Показано ${formatNumber(current)} из ${formatNumber(total)}`
    );

    /*
        Example:
        1 of 4 projects
      */
    repl(
        new RegExp(
            `^(\\d+)\\s+of\\s+(\\d+)\\s+(${countNouns})$`,
            'i'
        ),
        (
            _,
            current,
            total,
            noun
        ) =>
            `${
                formatNumber(current)
            } из ${
                formatNumber(total)
            } ${
                pluralWord(
                    noun,
                    Number(total)
                )
            }`
    );

    repl(
        new RegExp(
            `^(\\d+)\\s+(${countNouns})\\s+selected$`,
            'i'
        ),
        (_, number, noun) =>
            `Выбрано: ${countPhrase(number, noun)}`
    );

    repl(
        /^(\d+)\s+selected$/i,
        (_, number) =>
            `Выбрано: ${
                formatNumber(number)
            }`
    );

    repl(
        /^(\d+)\s+events?\s+added to source\.$/i,
        (_, number) =>
            `К источнику добавлено ${
                countPhrase(
                    number,
                    'event'
                )
            }.`
    );
    repl(
        /^(\d+)\s+sources?\s+linked$/i,
        (_, number) =>
            `Связано: ${
                countPhrase(
                    number,
                    'source'
                )
            }`
    );
    /*
        Notification count.
      */
    repl(
        /^(\d+)\s+items?\s+need\s+attention$/i,
        (_, number) =>
            `Требуют внимания: ${
                formatNumber(number)
            }`
    );

    /*
        Relative dates and timestamps
      */

    repl(
        /^today at\s+(.+)$/i,
        (_, value) =>
            `сегодня в ${value}`
    );

    repl(
        /^yesterday at\s+(.+)$/i,
        (_, value) =>
            `вчера в ${value}`
    );

    repl(
        /^Last opened\s+(.+)$/i,
        (_, value) =>
            `Открыто: ${
                translateDateValue(value)
            }`
    );

    repl(
        /^Last modified\s+(.+)$/i,
        (_, value) =>
            `Последнее изменение: ${
                translateDateValue(value)
            }`
    );

    repl(
        /^Modified\s+(.+)$/i,
        (_, value) =>
            `Изменено: ${
                translateDateValue(value)
            }`
    );

    repl(
        /^Created\s+(.+)$/i,
        (_, value) =>
            `Создано: ${
                translateDateValue(value)
            }`
    );

    repl(
        /^Added\s+(.+)$/i,
        (_, value) =>
            `Добавлено: ${
                translateDateValue(value)
            }`
    );

    repl(
        /^Updated\s+(.+)$/i,
        (_, value) =>
            `Обновлено: ${
                translateDateValue(value)
            }`
    );

    /*
        Count + action.

        Examples:
        4 photos added
        17 people added
      */
    repl(
        new RegExp(
            `^(\\d+)\\s+(${countNouns})\\s+added$`,
            'i'
        ),
        (
            _,
            number,
            noun
        ) =>
            `Добавлено ${
                countPhrase(
                    number,
                    noun
                )
            }`
    );

    repl(
        /^(\d+)\s+added$/i,
        (_, number) =>
            `Добавлено: ${formatNumber(number)}`
    );

    /*
        Person / genealogy phrases
      */

    repl(
        /^Keep children with\s+(.+)$/i,
        (
            _,
            person
        ) =>
            `Оставить детей с: ${
                translateValue(person)
            }`
    );

    repl(
        /^This will remove\s+(.+?)\s+as\s+(.+?)[’']s parent\. Neither person will be deleted\.$/i,
        (
            _,
            parent,
            child
        ) =>
            `Будет удалена связь «${
                translateValue(parent)
            } — родитель ${
                translateValue(child)
            }». Записи людей останутся в проекте.`
    );

    repl(
        /^This will remove\s+(.+?)\s+as\s+(.+?)[’']s child\. Neither person will be deleted\.$/i,
        (
            _,
            child,
            parent
        ) =>
            `Будет удалена связь «${
                translateValue(child)
            } — ребёнок ${
                translateValue(parent)
            }». Записи людей останутся в проекте.`
    );

    repl(
        /^This will remove the partner relationship between\s+(.+?)\s+and\s+(.+?)\. Neither person will be deleted\.(?:\s+(Choose which parent should keep the children after unlinking\.))?$/i,
        (
            _,
            firstPerson,
            secondPerson,
            childDecision
        ) =>
            `Партнёрская связь между «${
                translateValue(firstPerson)
            }» и «${
                translateValue(secondPerson)
            }» будет удалена. Записи людей останутся в проекте.${
                childDecision
                    ? ' Выберите родителя, с которым останутся дети после удаления связи.'
                    : ''
            }`
    );

    repl(
        /^Born:?\s+(.+?)\s*\((living person|deceased)\)$/i,
        (
            _,
            date,
            status
        ) =>
        {
            const statusKey =
                status.toLowerCase()
              === 'deceased'
                    ? 'Deceased'
                    : 'Living';

            return `Рождение: ${
                translateDateValue(date)
            } · ${
                translateValue(
                    statusKey
                )
            }`;
        }
    );

    repl(
        /^Born:?\s+(.+)$/i,
        (_, value) =>
            `Рождение: ${
                translateDateValue(value)
            }`
    );

    repl(
        /^Died:?\s+(.+)$/i,
        (_, value) =>
            `Смерть: ${
                translateDateValue(value)
            }`
    );

    repl(
        /^(\d+)\s+relationships?$/i,
        (_, number) =>
            `${formatNumber(number)} родственных связей`
    );

    repl(
        /^(\d+)\s+items?$/i,
        (_, number) =>
            `${formatNumber(number)} элементов`
    );

    repl(
        /^(\d+)\s+linked records?(?:\s+·\s+Updated\s+(.+))?$/i,
        (_, number, date) =>
            `${formatNumber(number)} связанных записей${
                date
                    ? ` · Обновлено ${translateDateValue(date)}`
                    : ''
            }`
    );

    repl(
        /^(\d+)\s+connected events?$/i,
        (_, number) =>
            `${formatNumber(number)} связанных событий`
    );

    repl(
        /^(.+?)\s+\((\d+)\)$/,
        (_, value, number) =>
            `${translateValue(value)} (${formatNumber(number)})`
    );

    repl(
        /^(About|After|Before)\s+(.+)$/i,
        (_, qualifier, value) =>
        {
            const labels = {
                about: 'Около',
                after: 'После',
                before: 'До'
            };

            return `${labels[qualifier.toLowerCase()]} ${translateDateValue(value)}`;
        }
    );

    repl(
        /^Child of\s+(.+)\s+and\s+(.+)$/i,
        (_, first, second) =>
            `Родители ${
                translateValue(first)
            } и ${
                translateValue(second)
            }`
    );

    repl(
        /^Child of unknown parents$/i,
        () =>
            'Родители не указаны'
    );

    repl(
        /^Child of\s+(.+)$/i,
        (_, parent) =>
            `Родитель: ${
                translateValue(parent)
            }`
    );

    repl(
        /^Father of\s+(.+)$/i,
        (_, person) =>
            `Отец ${
                translateValue(person)
            }`
    );

    repl(
        /^Mother of\s+(.+)$/i,
        (_, person) =>
            `Мать ${
                translateValue(person)
            }`
    );

    repl(
        /^Parent of\s+(.+)$/i,
        (_, person) =>
            `Родитель ${
                translateValue(person)
            }`
    );

    /*
        Project-copy names.
      */

    repl(
        /^(.+?)\s+copy(?:\s+(\d+))?$/i,
        (
            _,
            value,
            suffix
        ) =>
            `Копия «${
                translateValue(value)
            }»${
                suffix
                    ? ` ${suffix}`
                    : ''
            }`
    );

    /*
        Add-to-album modal counts.
      */

    repl(
        new RegExp(
            `^(\\d+)\\s+selected\\s+(${countNouns})$`,
            'i'
        ),
        (_, number, noun) =>
            `Выбрано: ${
                countPhrase(
                    number,
                    noun
                )
            }`
    );

    repl(
        new RegExp(
            `^(\\d+)\\s+(${countNouns})\\s+selected\\s*·\\s*(\\d+)\\s+(${countNouns})\\s+chosen$`,
            'i'
        ),
        (
            _,
            firstCount,
            firstNoun,
            secondCount,
            secondNoun
        ) =>
            `Выбрано: ${
                countPhrase(
                    firstCount,
                    firstNoun
                )
            } · Выбрано: ${
                countPhrase(
                    secondCount,
                    secondNoun
                )
            }`
    );

    repl(
        /^Add to\s+(\d+)\s+(albums?)$/i,
        (_, number, noun) =>
            `Добавить в ${
                countPhrase(
                    number,
                    noun
                )
            }`
    );

    repl(
        /^(\d+)\s+of\s+(\d+)\s+already added$/i,
        (_, existing, total) =>
            `Уже добавлено: ${
                formatNumber(existing)
            } из ${
                formatNumber(total)
            }`
    );

    /*
        Dynamic accessible labels / actions.
      */

    repl(
        /^Preview of\s+(.+?)\s+cover$/i,
        (_, value) =>
            `Предпросмотр обложки проекта «${
                translateValue(value)
            }»`
    );

    repl(
        /^Open\s+(.+?)\s+(Projects|Family Tree|People|Geneograph|Albums|Archive|Notes|Places|Publish)\s+activity$/i,
        (
            _,
            project,
            module
        ) =>
            `Открыть действия: ${
                translateValue(project)
            } · ${
                translateValue(module)
            }`
    );

    repl(
        /^Open\s+(Projects|Family Tree|People|Geneograph|Albums|Archive|Notes|Places|Publish)\s+for\s+(.+)$/i,
        (
            _,
            module,
            context
        ) =>
            `Открыть ${
                translateValue(module)
            }: ${
                translateValue(context)
            }`
    );

    repl(
        /^Actions for\s+(.+)$/i,
        (_, value) =>
            `Действия: ${translateValue(value)}`
    );

    repl(
        /^More actions for\s+(.+)$/i,
        (_, value) =>
            `Другие действия: ${translateValue(value)}`
    );

    repl(
        /^Add\s+(father|mother)\s+for\s+(.+)$/i,
        (_, relation, value) =>
            `Добавить ${
                relation.toLowerCase() === 'father'
                    ? 'отца'
                    : 'мать'
            } для ${translateValue(value)}`
    );

    repl(
        /^Remove photo from\s+(.+)$/i,
        (_, value) =>
            `Удалить фотографию из альбома «${translateValue(value)}»`
    );

    repl(
        /^Open full-size preview of\s+(.+)$/i,
        (_, value) =>
            `Открыть полноразмерный просмотр: ${translateValue(value)}`
    );

    repl(
        /^Open profile for\s+(.+)$/i,
        (_, value) =>
            `Открыть профиль ${translateValue(value)}`
    );

    repl(
        /^Open\s+(.+?)\s+profile$/i,
        (_, value) =>
            `Открыть профиль ${translateValue(value)}`
    );

    repl(
        /^Open\s+(.+?)\s+in\s+(Archive|Albums|Notes|Places)$/i,
        (_, value, module) =>
            `Открыть ${translateValue(value)} в разделе «${translateValue(module)}»`
    );

    repl(
        /^Open review for\s+(.+)$/i,
        (_, value) =>
            `Открыть проверку: ${translateValue(value)}`
    );

    repl(
        /^(?:Add|Change) photo for\s+(.+)$/i,
        (_, value) =>
            `Изменить фотографию: ${translateValue(value)}`
    );

    repl(
        /^Age:\s*(\d+)$/i,
        (_, number) =>
            `Возраст: ${formatNumber(number)}`
    );

    repl(
        /^From\s+(.+)$/i,
        (_, value) =>
            `С ${translateDateValue(value)}`
    );

    repl(
        /^With\s+(.+)$/i,
        (_, value) =>
            `С ${translateValue(value)}`
    );

    repl(
        /^Unlink\s+(?!.*\s+from this board person$)(.+)$/i,
        (_, value) =>
            `Удалить связь ${translateValue(value)}`
    );

    repl(
        /^Edit relationship with\s+(.+)$/i,
        (_, value) =>
            `Изменить связь с ${translateValue(value)}`
    );

    repl(
        /^(Photos|Notes)\s+(?:for|linked to)\s+(.+)$/i,
        (_, kind, value) =>
            `${translateValue(kind)}: ${translateValue(value)}`
    );

    repl(
        /^Open note:\s*(.+)$/i,
        (_, value) =>
            `Открыть заметку: ${translateValue(value)}`
    );

    repl(
        /^(Hide|Show|Lock|Unlock)\s+(.+)$/i,
        (_, action, value) =>
        {
            const labels = {
                hide: 'Скрыть',
                show: 'Показать',
                lock: 'Заблокировать',
                unlock: 'Разблокировать'
            };

            return `${labels[action.toLowerCase()]}: ${translateValue(value)}`;
        }
    );

    repl(
        /^Draw\s+(.+)$/i,
        (_, value) =>
            `Нарисовать: ${translateValue(value)}`
    );

    repl(
        /^(?:Change|Edit)\s+(.+?)\s+color,\s*(#[0-9A-F]{6}),\s*(\d+)%\s+opacity$/i,
        (_, property, color, opacity) =>
        {
            const properties = {
                fill: 'заливку',
                stroke: 'обводку',
                text: 'текст',
                line: 'линию',
                background: 'фон',
                'title text': 'текст заголовка'
            };

            return `Изменить ${
                properties[property.toLowerCase()]
            || translateValue(property).toLowerCase()
            }: ${color}, непрозрачность ${opacity}%`;
        }
    );

    repl(
        /^(Remove|Restore)\s+(.+?)\s+color$/i,
        (_, action, property) =>
        {
            const properties = {
                fill: 'заливку',
                stroke: 'обводку',
                line: 'линию',
                background: 'фон'
            };
            const verb = action.toLowerCase() === 'remove'
                ? 'Убрать'
                : 'Восстановить';

            return `${verb} ${
                properties[property.toLowerCase()]
            || translateValue(property).toLowerCase()
            }`;
        }
    );

    repl(
        /^Edit\s+(.+?)\s+details$/i,
        (_, field) =>
        {
            const fields = {
                'birth date': 'дату рождения',
                'death date': 'дату смерти',
                'marriage date': 'дату брака',
                'divorce date': 'дату развода',
                'start date': 'дату начала',
                'end date': 'дату окончания'
            };

            return `Изменить ${
                fields[field.toLowerCase()]
            || translateValue(field).toLowerCase()
            }`;
        }
    );

    repl(
        /^This place is connected to\s+(\d+)\s+records?\s+but has no map position\.$/i,
        (_, number) =>
            `Это место связано с ${countPhrase(number, 'records')}, но не отмечено на карте.`
    );

    repl(
        /^Resize\s+(.+?)\s+from\s+(top|right|bottom|left)\s+edge$/i,
        (_, value, edge) =>
        {
            const labels = {
                top: 'верхнюю',
                right: 'правую',
                bottom: 'нижнюю',
                left: 'левую'
            };

            return `Изменить размер «${translateValue(value)}» за ${labels[edge.toLowerCase()]} границу`;
        }
    );

    repl(
        /^Resize\s+(.+?)\s+from\s+(nw|ne|se|sw)\s+corner$/i,
        (_, value, corner) =>
        {
            const labels = {
                nw: 'верхний левый',
                ne: 'верхний правый',
                se: 'нижний правый',
                sw: 'нижний левый'
            };

            return `Изменить размер «${translateValue(value)}» за ${labels[corner.toLowerCase()]} угол`;
        }
    );

    repl(
        /^Add relative to\s+(.+)$/i,
        (_, value) =>
            `Добавить родственника для ${translateValue(value)}`
    );

    repl(
        /^to\s+(.+)$/i,
        (_, value) =>
            `для ${translateValue(value)}`
    );

    repl(
        /^Create a new person and add as\s+(.+?)[\u2019']s\s+(father|mother|parent|son|daughter|child|brother|sister|partner|spouse|relative)$/i,
        (_, personName, relationship) =>
        {
            const labels = {
                father: 'отца',
                mother: 'мать',
                parent: 'родителя',
                son: 'сына',
                daughter: 'дочь',
                child: 'ребёнка',
                brother: 'брата',
                sister: 'сестру',
                partner: 'партнёра',
                spouse: 'супруга',
                relative: 'родственника'
            };

            return `Создать нового человека и добавить как ${labels[relationship.toLowerCase()]} для ${translateValue(personName)}`;
        }
    );

    repl(
        /^Find a person in this project and connect them to\s+(.+)\.$/i,
        (_, value) =>
            `Найдите человека в этом проекте и свяжите его с ${translateValue(value)}.`
    );

    repl(
        /^(.+?)\s+already has recorded parents\. The selected person will be connected as an additional parent\.$/i,
        (_, value) =>
            `У ${translateValue(value)} уже указаны родители. Выбранный человек будет добавлен как ещё один родитель.`
    );

    repl(
        /^Create a new person and connect as\s+(parent|child|partner)$/i,
        (_, relationship) =>
        {
            const labels = {
                parent: 'родителя',
                child: 'ребёнка',
                partner: 'партнёра'
            };

            return `Создать нового человека и привязать в качестве ${labels[relationship.toLowerCase()]}`;
        }
    );

    repl(
        /^(?:Change|Edit) Family Tree link for\s+(.+)$/i,
        (_, value) =>
            `Изменить связь с семейным древом: ${translateValue(value)}`
    );

    repl(
        /^(\d+)\s+of\s+(\d+)\s+complete$/i,
        (_, completed, total) =>
            `Выполнено ${formatNumber(completed)} из ${formatNumber(total)}`
    );

    repl(
        /^Complete\s+(.+)$/i,
        (_, value) =>
            `Отметить выполненным: ${translateValue(value)}`
    );

    repl(
        /^Remove\s+(.+?)\s+from this note$/i,
        (_, value) =>
            `Удалить «${translateValue(value)}» из этой заметки`
    );

    repl(
        /^Browse files and subfolders in\s+(.+)\.$/i,
        (_, value) =>
            `Файлы и вложенные папки: ${translateValue(value)}.`
    );

    repl(
        /^Favourites in\s+(.+)\.$/i,
        (_, value) =>
            `Избранное в папке «${translateValue(value)}».`
    );

    repl(
        /^Go to\s+(.+?)\s+root$/i,
        (_, value) =>
            `Перейти в корень «${translateValue(value)}»`
    );

    repl(
        /^Close add\s+(.+?)\s+dialog$/i,
        (_, value) =>
            `Закрыть окно добавления: ${translateValue(value)}`
    );

    repl(
        /^View events for\s+(.+)$/i,
        (_, value) =>
            `Просмотреть события: ${translateValue(value)}`
    );

    repl(
        /^(.+?)\s+is already linked to this file$/i,
        (_, value) =>
            `«${translateValue(value)}» уже связано с этим файлом`
    );

    repl(
        /^(\d+)\s+recorded events?$/i,
        (_, number) =>
            `Записано ${translateCountPhrase(`${number} events`)}`
    );

    repl(
        /^(\d+)\s+notes available\s+·\s+(\d+)\s+already\s+(linked|selected)$/i,
        (_, available, existing, status) =>
            `Доступно заметок: ${formatNumber(available)} · ${
                status.toLowerCase() === 'selected'
                    ? 'уже выбрано'
                    : 'уже связано'
            }: ${formatNumber(existing)}`
    );

    repl(
        new RegExp(
            `^(\\d+)\\s+(${countNouns})\\s+excluded$`,
            'i'
        ),
        (_, number, noun) =>
            `Исключено: ${countPhrase(number, noun)}`
    );

    repl(
        /^Unlink\s+(.+?)\s+from this board person$/i,
        (_, value) =>
            `Удалить связь «${translateValue(value)}» с человеком на холсте`
    );

    repl(
        /^Unlink\s+(.+?)\s+from this person$/i,
        (_, value) =>
            `Удалить связь «${translateValue(value)}» с этим человеком`
    );

    repl(
        /^Select\s+(.+)$/i,
        (_, value) =>
            `Выбрать: ${translateValue(value)}`
    );

    repl(
        /^Collapse\s+(.+)$/i,
        (_, value) =>
            `Свернуть: ${translateValue(value)}`
    );

    repl(
        /^Show\s+(.+)$/i,
        (_, value) =>
            `Показать: ${translateValue(value)}`
    );

    repl(
        /^View\s+(.+?)\s+profile$/i,
        (_, value) =>
            `Открыть профиль ${translateValue(value)}`
    );

    repl(
        /^Remove\s+(.+?)\s+from favourites$/i,
        (_, value) =>
            `Убрать из избранного: ${translateValue(value)}`
    );

    repl(
        /^Add\s+(.+?)\s+to favourites$/i,
        (_, value) =>
            `Добавить в избранное: ${translateValue(value)}`
    );

    repl(
        /^(Son|Daughter)\s+(.+)$/i,
        (_, relation, value) =>
            `${translateValue(relation)} ${translateValue(value)}`
    );

    /*
        Person-resource modal titles and descriptions.

        These rules must run before the generic /^Add ...$/
        fallback. Otherwise "Add photos for Name" becomes the
        mixed-language "Добавить: photos for Name".
      */

    repl(
        /^Add photos for\s+(.+)$/i,
        (_, personName) =>
            `Добавить фотографии — ${translateValue(personName)}`
    );

    repl(
        /^Add files to\s+(.+)$/i,
        (_, personName) =>
            `Добавить файлы — ${translateValue(personName)}`
    );

    repl(
        /^(\d+)\s+files?\s+added to\s+(.+)\.$/i,
        (_, count, personName) =>
        {
            const form = RU_PLURAL_RULES_FORMATTER.select(Number(count));
            const verb = form === 'one' ? 'добавлен' : form === 'few' ? 'добавлены' : 'добавлено';
            return `${translateValue(personName)}: ${verb} ${countPhrase(count, 'file')}.`;
        }
    );

    repl(
        /^(\d+)\s+notes?\s+(?:was|were)\s+linked to\s+(.+)\.$/i,
        (_, count, personName) =>
        {
            const form = RU_PLURAL_RULES_FORMATTER.select(Number(count));
            const verb = form === 'one' ? 'связана' : form === 'few' ? 'связаны' : 'связано';
            return `${translateValue(personName)}: ${verb} ${countPhrase(count, 'note')}.`;
        }
    );

    repl(
        /^Link existing notes to\s+[“"](.+)[”"]\.$/i,
        (_, personName) =>
            `Связать существующие заметки с «${translateValue(personName)}».`
    );

    repl(
        /^Link existing notes to\s+(.+)\.$/i,
        (_, personName) =>
            `Связать существующие заметки с «${translateValue(personName)}».`
    );

    /*
        Generic CRUD fallbacks.

        Common UI actions should still have exact RU_UI
        pairs. These rules cover dynamically constructed
        labels that do not have an exact pair.
      */

    repl(
        /^Create\s+(.+)$/i,
        (_, value) =>
            `Создать ${
                translateValue(value)
            }`
    );

    repl(
        /^Add\s+(.+)$/i,
        (_, value) =>
            `Добавить ${
                translateValue(value)
            }`
    );

    repl(
        /^Edit\s+(.+)$/i,
        (_, value) =>
            `Изменить ${
                translateValue(value)
            }`
    );

    repl(
        /^Open\s+(.+)$/i,
        (_, value) =>
            `Открыть ${
                translateValue(value)
            }`
    );

    repl(
        /^Delete\s+(.+)\?$/i,
        (_, value) =>
            `Удалить «${
                translateValue(value)
            }»?`
    );

    /*
        Empty states
      */

    repl(
        /^No\s+(.+?)\s+found\.?$/i,
        (_, value) =>
            `Не найдено: ${
                translateValue(value)
            }`
    );

    repl(
        /^No\s+(.+?)\s+match(?:es)?\.?$/i,
        (_, value) =>
            `Нет совпадений: ${
                translateValue(value)
            }`
    );

    repl(
        /^No\s+(.+?)\s+yet\.?$/i,
        (_, value) =>
            `Пока нет: ${
                translateValue(value)
            }`
    );

    /*
        Prototype / placeholder messages
      */

    repl(
        /^(.+?)\s+will be added later\.?$/i,
        (_, value) =>
            `Будет добавлено позже: ${
                translateValue(value)
            }.`
    );

    repl(
        /^(.+?)\s+is simulated\.?$/i,
        (_, value) =>
            `Смоделировано: ${
                translateValue(value)
            }.`
    );

    repl(
        /^(.+?)\s+is a placeholder\.?$/i,
        (_, value) =>
            `Заглушка: ${
                translateValue(value)
            }.`
    );

    repl(
        /^(.+?)\s+flow is a visual placeholder\.?$/i,
        (_, value) =>
            `Сценарий «${
                translateValue(value)
            }» пока является визуальной заглушкой.`
    );

    repl(
        /^(.+?)\s+help would open here\.?$/i,
        (_, value) =>
            `Здесь откроется справка «${
                translateValue(value)
            }».`
    );

    repl(
        /^(.+?)\s+would open here\.?$/i,
        (_, value) =>
            `Здесь откроется: ${
                translateValue(value)
            }.`
    );

    if (
        /(?:\d.*\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\b|\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\b.*\d)/i
            .test(out)
    )
    {
        out = translateDateValue(out);
    }

    RU_EXACT_EMBEDDED_RULES
        .forEach(rule =>
        {
            rule.pattern.lastIndex = 0;
            out = out.replace(
                rule.pattern,
                (match, prefix) =>
                    `${prefix}${rule.translation}`
            );
        });

    const directTranslation =
        translateValue(out);

    if (
        directTranslation !== out
    )
    {
        out = directTranslation;
    }

    return translateCountPhrase(out);
}

function translateText(
    value
)
{
    if (
        state.language !== 'ru'
        || value == null
    )
    {
        return value;
    }

    const raw =
        String(value);

    const leading =
        raw.match(/^\s*/)[0];

    const trailing =
        raw.match(/\s*$/)[0];

    const core =
        raw
            .trim()
            .replace(/\s+/g, ' ');

    if (!core)
    {
        return raw;
    }

    let exact =
        localizationTextCache.get(
            core
        );

    if (exact === undefined)
    {
        exact =
            Object.prototype
                .hasOwnProperty.call(
                    RU_EXACT,
                    core
                )
                ? RU_EXACT[core]
                : translateDynamicPhrase(
                    core
                );

        cacheLocalizedText(
            core,
            exact
        );
    }

    return (
        leading
        + exact
        + trailing
    );
}

function translateAttributeValue(
    value
)
{
    if (
        state.language !== 'ru'
        || !value
    )
    {
        return value;
    }

    const source =
        String(value);

    if (
        isTechnicalLocalizationValue(
            source
        )
    )
    {
        return source;
    }

    return translateText(source);
}

/*
    * Database-backed editable controls need different
    * treatment from normal DOM text.
    *
    * Display the localized value, but retain the canonical
    * source value if the user saves without editing it.
    */
function localizedDataFieldValue(
    value
)
{
    const source =
        value == null
            ? ''
            : String(value);

    return state.language === 'ru'
        ? translateText(source)
        : source;
}

function localizedNoteBodyText(value)
{
    return String(value || '')
        .split('\n')
        .map(line => translateText(line))
        .join('\n');
}

function localizedNoteBodyDelta(delta)
{
    if (!delta || state.language !== 'ru') return delta;
    return {
        ops: delta.ops.map(operation => ({
            ...operation,
            insert: localizedNoteBodyText(operation.insert)
        }))
    };
}

function collectLocalizedDataFieldValue(
    control,
    sourceValue
)
{
    const source =
        sourceValue == null
            ? ''
            : String(sourceValue);

    if (!control)
    {
        return source;
    }

    const current =
        String(
            control.value ?? ''
        );

    const localizedSource =
        localizedDataFieldValue(
            source
        );

    /*
      * If the rendered localized value was never changed,
      * return the original canonical database value.
      *
      * If the user actually edited it, return their edit.
      */
    return current
        === localizedSource
        ? source
        : current;
}

function applyLanguage()
{
    state.language =
        normalizeLang(
            state.language
          || localStorage.getItem(
              LANGUAGE_STORAGE_KEY
          )
          || 'en'
        );

    document.documentElement.lang =
        state.language;

    document.title =
        state.language === 'ru'
            ? translateText(
                DEFAULT_DOCUMENT_TITLE
            )
            : DEFAULT_DOCUMENT_TITLE;
}

function setLanguage(
    lang,
    rerender = true
)
{
    const next =
        normalizeLang(lang);

    if (
        state.language === next
    )
    {
        return;
    }

    if (state.projectOpen && state.activeModule === 'Family Tree')
    {
        captureTreeCanvasScroll();
    }

    state.language =
        next;

    localStorage.setItem(
        LANGUAGE_STORAGE_KEY,
        next
    );

    applyLanguage();

    if (rerender)
    {
        render();
    }
}

function shouldLocalizeTextNode(
    node
)
{
    if (
        !node
        || node.nodeType
          !== Node.TEXT_NODE
        || !node.nodeValue
            ?.trim()
    )
    {
        return false;
    }

    const parent =
        node.parentElement;

    if (!parent)
    {
        return false;
    }

    /*
      * Never mutate implementation content.
      */
    if (
        parent.closest(
            'script, style, svg, [data-i18n-skip]'
        )
    )
    {
        return false;
    }

    /*
      * Explicit user-authored content remains canonical.
      *
      * Geneograph layer names currently use this marker.
      */
    if (
        parent.closest(
            '[data-user-content]'
        )
    )
    {
        return false;
    }

    /*
      * Do not rewrite live editor models from the DOM.
      *
      * Textareas and rich-text editors must use the
      * localizedDataFieldValue pattern (or their own
      * model-level equivalent) instead.
      */
    if (
        parent.closest(
            'textarea, [contenteditable="true"]'
        )
    )
    {
        return false;
    }

    return true;
}

function localizeTextNode(
    node
)
{
    if (
        state.language !== 'ru'
        || !shouldLocalizeTextNode(
            node
        )
    )
    {
        return;
    }

    const parent =
        node.parentElement;

    const source =
        node.nodeValue;

    /*
      * An <option> without an explicit value normally
      * uses its visible text as its value.
      *
      * Preserve the original English value before
      * translating its label so application logic keeps
      * receiving its canonical enum.
      */
    if (
        parent?.tagName === 'OPTION'
        && !parent.hasAttribute(
            'value'
        )
    )
    {
        parent.setAttribute(
            'value',
            source.trim()
        );
    }

    const translated =
        translateText(source);

    /*
      * Important because MutationObserver also watches
      * characterData. Do not create another mutation when
      * nothing changed.
      */
    if (
        translated !== source
    )
    {
        node.nodeValue =
            translated;
    }
}

function localizeElementAttribute(
    element,
    attribute
)
{
    if (
        state.language !== 'ru'
        || !(element instanceof Element)
        || !LOCALIZABLE_DOM_ATTRIBUTES
            .includes(attribute)
        || element.closest(
            '[data-i18n-skip], [data-user-content]'
        )
        || !element.hasAttribute(
            attribute
        )
    )
    {
        return;
    }

    const source =
        element.getAttribute(
            attribute
        );

    const translated =
        translateAttributeValue(
            source
        );

    if (
        translated !== source
    )
    {
        element.setAttribute(
            attribute,
            translated
        );
    }
}

function localizeElementAttributes(
    element
)
{
    if (
        !(element instanceof Element)
    )
    {
        return;
    }

    LOCALIZABLE_DOM_ATTRIBUTES
        .forEach(attribute =>
        {
            localizeElementAttribute(
                element,
                attribute
            );
        });
}

const explicitlyLocalizedRoots =
    new Set();

function markLocalizationRootHandled(
    root
)
{
    if (
        !root
        || root.nodeType
          === Node.TEXT_NODE
    )
    {
        return;
    }

    explicitlyLocalizedRoots.add(
        root
    );

    queueMicrotask(() =>
    {
        explicitlyLocalizedRoots.delete(
            root
        );
    });
}

function localizationMutationIsHandled(
    node
)
{
    if (!node) return false;

    const target =
        node.nodeType
          === Node.TEXT_NODE
            ? node.parentNode
            : node;

    if (!target) return false;

    for (
        const root
        of explicitlyLocalizedRoots
    )
    {
        if (
            root === target
          || root.contains?.(target)
        )
        {
            return true;
        }
    }

    return false;
}

function localizeUI(
    root = document.body,
    {
        suppressObserverReplay = false
    } = {}
)
{
    applyLanguage();

    if (
        state.language !== 'ru'
        || !root
    )
    {
        return;
    }

    if (suppressObserverReplay)
    {
        markLocalizationRootHandled(
            root
        );
    }

    /*
      * MutationObserver can pass an individual Text node.
      * TreeWalker does not process its root as nextNode(),
      * so handle it explicitly.
      */
    if (
        root.nodeType
          === Node.TEXT_NODE
    )
    {
        localizeTextNode(root);
        return;
    }

    /*
      * querySelectorAll() does not include root itself.
      * The old implementation therefore missed attributes
      * on newly-added root elements.
      */
    if (
        root instanceof Element
    )
    {
        localizeElementAttributes(
            root
        );
    }

    const walker =
        document.createTreeWalker(
            root,
            NodeFilter.SHOW_TEXT
        );

    const textNodes =
        [];

    while (
        walker.nextNode()
    )
    {
        textNodes.push(
            walker.currentNode
        );
    }

    textNodes.forEach(
        localizeTextNode
    );

    root.querySelectorAll?.(
        LOCALIZABLE_DOM_ATTRIBUTE_SELECTOR
    ).forEach(
        localizeElementAttributes
    );
}

// Centralized GEDCOM-style sample data for the prototype.

/*
      Source of truth
      ---------------
      People, family records, places, events, media links, and notes live in this
      centralized in-file model. Family Tree and People derive their display data
      from this structure rather than legacy module arrays.
    */
