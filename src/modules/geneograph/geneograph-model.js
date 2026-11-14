function renderGeneograph()
{
    appNavigationObserve();
    if (geneoCtrlSelectPressed && (state.geneoView !== 'board'
        || geneoCtrlSelectContext?.boardId !== selectedGeneographBoard()?.id))
        setGeneoCtrlSelectPressed(false);
    workspace.classList.remove('no-sidebar');
    if (state.geneoView === 'board')
    {
        const board = selectedGeneographBoard();
        if (!board)
        {
            state.geneoView = 'home';
            state.selectedGeneoBoardId = null;
            renderGeneographHome();
            return;
        }
        const center = geneoCurrentViewportCenter()
          || geneoSavedViewport(board?.id)?.center
          || geneoCanvasRuntime.initialMobileCenter
          || geneoContentCenter();
        renderGeneographEditor();
        scheduleGeneographViewportRestore(center);
    }
    else
    {
        renderGeneographHome();
    }
}

function selectedGeneographBoard()
{
    return getGeneographBoard(state.selectedGeneoBoardId, {
        projectId: currentProjectId()
    });
}

const GENEO_PERSON_CARD_STYLES =
    Object.freeze([
        'standard',
        'compact',
        'chart',
        'portrait'
    ]);

const GENEO_PERSON_CARD_FORMAT_KEYS = [
    'nameFormat', 'dateFormat', 'photoSize',
    'photoAlignment', 'alignment', 'nameAlignment'
];

const GENEO_PERSON_CARD_FONT_DEFAULTS = Object.freeze({
    standard: { nameFontSize: 19, detailsFontSize: 13 },
    compact: { nameFontSize: 18, detailsFontSize: 14 },
    chart: { nameFontSize: 20, detailsFontSize: 16 },
    portrait: { nameFontSize: 20, detailsFontSize: 14 }
});

const GENEO_PERSON_CARD_FONT_RANGES = Object.freeze({
    nameFontSize: [14, 48],
    detailsFontSize: [10, 24]
});

function geneoValidPersonCardFontSize(key, value)
{
    const range = GENEO_PERSON_CARD_FONT_RANGES[key];
    return range && Number.isInteger(value) && value >= range[0] && value <= range[1];
}

const GENEO_PERSON_CARD_NAME_FORMATS =
    Object.freeze([
        'full',
        'first-last',
        'surname-first'
    ]);

const GENEO_PERSON_CARD_DATE_FORMATS =
    Object.freeze([
        'full',
        'years'
    ]);

const GENEO_PERSON_CARD_PHOTO_SIZES =
    Object.freeze([
        'small',
        'medium',
        'large'
    ]);

const GENEO_PERSON_CARD_PHOTO_ALIGNMENTS =
    Object.freeze(['left', 'right']);

const GENEO_PERSON_CARD_ALIGNMENTS =
    Object.freeze([
        'left',
        'center',
        'right'
    ]);

const GENEO_PERSON_CARD_ENUMS =
    Object.freeze({
        style:
          GENEO_PERSON_CARD_STYLES,

        nameFormat:
          GENEO_PERSON_CARD_NAME_FORMATS,

        dateFormat:
          GENEO_PERSON_CARD_DATE_FORMATS,

        photoSize:
          GENEO_PERSON_CARD_PHOTO_SIZES,

        photoAlignment:
          GENEO_PERSON_CARD_PHOTO_ALIGNMENTS,

        alignment:
          GENEO_PERSON_CARD_ALIGNMENTS,

        nameAlignment:
          GENEO_PERSON_CARD_ALIGNMENTS
    });

const GENEO_PERSON_CARD_GEOMETRY =
    Object.freeze({
        standard: {
            width: 360,
            height: 160,
            minWidth: 260,
            minHeight: 144,
            maxWidth: 600,
            maxHeight: 440
        },

        compact: {
            width: 320,
            height: 160,
            minWidth: 230,
            minHeight: 110,
            maxWidth: 560,
            maxHeight: 340
        },

        chart: {
            width: 440,
            height: 160,
            minWidth: 260,
            minHeight: 120,
            maxWidth: 700,
            maxHeight: 360
        },

        portrait: {
            width: 280,
            height: 360,
            minWidth: 200,
            minHeight: 300,
            maxWidth: 400,
            maxHeight: 660
        }
    });

function geneoPersonCardEnumValue(
    key,
    value,
    fallback
)
{
    return (
        GENEO_PERSON_CARD_ENUMS[key]
            ?.includes(value)
            ? value
            : fallback
    );
}

function geneoPersonCardSettingValueIsValid(
    key,
    value
)
{
    return Boolean(
        GENEO_PERSON_CARD_ENUMS[key]
            ?.includes(value)
    );
}

function geneoEmptyPersonCardOverrides(
    custom = false,
    heightMode = 'auto'
)
{
    return {
        custom:
          Boolean(custom),

        heightMode:
          heightMode === 'manual'
              ? 'manual'
              : 'auto',

        fields: {},
        photoByStyle: {},
        styleSettings: {},

        style: null,
        nameFormat: null,
        dateFormat: null,
        photoSize: null,
        photoAlignment: null,
        alignment: null,
        nameAlignment: null,
        nameFontSize: null,
        detailsFontSize: null,
        cornerRadius: null
    };
}

function geneoPersonCardDisplayName(
    person,
    format = 'full'
)
{
    const names =
        normalizeGeneographPersonNames(
            person || {}
        );

    let parts = [];

    if (format === 'first-last')
    {
        parts = [
            names.first,
            names.last
        ];
    }
    else if (
        format === 'surname-first'
    )
    {
        parts = [
            names.last,
            names.first,
            names.middle
        ];
    }
    else
    {
        parts = [
            names.first,
            names.middle,
            names.last
        ];
    }

    return (
        parts
            .filter(Boolean)
            .join(' ')
        || 'Unknown'
    );
}

function geneoPersonCardVitalDateLabel(
    vital,
    dateFormat = 'full'
)
{
    if (dateFormat === 'years')
    {
        return (
            timelineYearFromValue(vital)
          || ''
        );
    }

    return (
        formatGenealogyDateLabel(vital)
        || ''
    );
}

function geneoPersonCardDefaultFields(
    style = 'standard'
)
{
    return {
        photo: true,
        dates: true,
        livingStatus: true,
        birthPlace: true,
        deathPlace: true,
        maidenName: true,
        linkIndicator: false
    };
}

function geneoPersonCardDefaultPhotoPreferences()
{
    return {
        standard: true,
        compact: false,
        chart: true,
        portrait: true
    };
}

function geneoDefaultPersonCardSettings(
    style = 'standard'
)
{
    const normalizedStyle =
        [
            'standard',
            'compact',
            'chart',
            'portrait'
        ].includes(style)
            ? style
            : 'standard';

    return {
        style: normalizedStyle,
        nameFormat: 'full',
        dateFormat: 'full',
        photoSize: 'medium',
        photoAlignment: 'left',
        alignment: 'left',
        nameAlignment: 'left',
        ...GENEO_PERSON_CARD_FONT_DEFAULTS[normalizedStyle],

        fields:
          geneoPersonCardDefaultFields(
              normalizedStyle
          ),

        photoByStyle:
          geneoPersonCardDefaultPhotoPreferences(),

        styleSettings: {},

        cornerRadius: 8
    };
}

function geneoDefaultCardAppearances()
{
    const neutral = {
        fill: { color: geneoSemanticColor('--surface-card'), opacity: 100, enabled: true },
        stroke: { color: geneoSemanticColor('--border-default'), opacity: 100, enabled: false },
        text: { color: geneoSemanticColor('--text-primary'), opacity: 100, enabled: true },
        paintOverrides: { fill: false, stroke: false, text: false },
        strokeWidth: 2,
        strokePattern: 'solid',
        cornerRadius: 8
    };
    return {
        neutral,
        male: {
            ...structuredClone(neutral),
            fill: { color: geneoSemanticColor('--gg-accent-creative-blue-subtle-container'), opacity: 100, enabled: true },
            stroke: { color: geneoSemanticColor('--gg-accent-creative-blue-outline'), opacity: 100, enabled: true }
        },
        female: {
            ...structuredClone(neutral),
            fill: { color: geneoSemanticColor('--gg-accent-investigation-purple-subtle-container'), opacity: 100, enabled: true },
            stroke: { color: geneoSemanticColor('--gg-accent-investigation-purple-outline'), opacity: 100, enabled: true }
        },
        unknown: {
            ...structuredClone(neutral),
            fill: { color: geneoSemanticColor('--gg-status-offline-subtle-container'), opacity: 100, enabled: true },
            stroke: { color: geneoSemanticColor('--gg-status-offline-outline'), opacity: 100, enabled: true }
        }
    };
}

function normalizeGeneoCardAppearances(value, radius = 8)
{
    const defaults = geneoDefaultCardAppearances();
    const source = value && typeof value === 'object' ? value : {};
    return Object.fromEntries(Object.entries(defaults).map(([gender, fallback]) => {
        const entry = source[gender] && typeof source[gender] === 'object' ? source[gender] : {};
        return [gender, {
            fill: normalizeGeneoPaint(entry.fill, fallback.fill),
            stroke: normalizeGeneoPaint(entry.stroke, fallback.stroke),
            text: normalizeGeneoPaint(entry.text, fallback.text, { forceEnabled: true }),
            strokeWidth: Math.round(geneoNumber(entry.strokeWidth, fallback.strokeWidth, 1, 12)),
            strokePattern: entry.strokePattern === 'dashed' ? 'dashed' : 'solid',
            cornerRadius: Math.round(geneoNumber(entry.cornerRadius, radius, 0, 32)),
            paintOverrides: {
                fill: entry.paintOverrides?.fill === true,
                stroke: entry.paintOverrides?.stroke === true,
                text: entry.paintOverrides?.text === true
            }
        }];
    }));
}

function normalizeGeneographPersonCardSettings(
    value
)
{
    const baseDefaults =
        geneoDefaultPersonCardSettings();

    const source =
        value
        && typeof value === 'object'
            ? value
            : {};

    const style =
        geneoPersonCardEnumValue(
            'style',
            source.style,
            baseDefaults.style
        );

    const defaults =
        geneoDefaultPersonCardSettings(style);

    const sourceFields =
        source.fields
        && typeof source.fields === 'object'
            ? source.fields
            : {};

    const fields = {};

    const photoByStyle = {
        ...geneoPersonCardDefaultPhotoPreferences()
    };

    const sourcePhotoByStyle =
        source.photoByStyle
        && typeof source.photoByStyle === 'object'
            ? source.photoByStyle
            : {};

    Object.keys(photoByStyle).forEach(key =>
    {
        if (
            typeof sourcePhotoByStyle[key]
          === 'boolean'
        )
        {
            photoByStyle[key] =
                sourcePhotoByStyle[key];
        }
    });

    if (
        typeof sourceFields.photo === 'boolean'
        && !Object.hasOwn(
            sourcePhotoByStyle,
            style
        )
    )
    {
        photoByStyle[style] =
            sourceFields.photo;
    }

    Object.keys(
        defaults.fields
    ).forEach(key =>
    {
        fields[key] = key === 'photo'
            ? style !== 'compact' && photoByStyle[style]
            : typeof sourceFields[key]
              === 'boolean'
                ? sourceFields[key]
                : defaults.fields[key];
    });

    const styleSettings = {};
    GENEO_PERSON_CARD_STYLES.forEach(cardStyle =>
    {
        const saved = source.styleSettings?.[cardStyle];
        const preset = saved && typeof saved === 'object' ? saved : source;
        const cardDefaults = geneoDefaultPersonCardSettings(cardStyle);
        const presetFields = preset.fields && typeof preset.fields === 'object'
            ? preset.fields : sourceFields;
        const cardFields = { ...cardDefaults.fields };
        Object.keys(cardFields).forEach(field =>
        {
            if (typeof presetFields[field] === 'boolean')
                cardFields[field] = presetFields[field];
        });
        cardFields.photo = cardStyle !== 'compact' && photoByStyle[cardStyle];
        cardFields.linkIndicator = fields.linkIndicator;
        styleSettings[cardStyle] = { fields: cardFields };
        GENEO_PERSON_CARD_FORMAT_KEYS.forEach(key =>
        {
            const legacyAlignment = key === 'alignment'
                && !saved && cardStyle !== style
                && ['compact', 'portrait'].includes(style)
                ? cardDefaults.alignment : preset[key];
            const legacyNameAlignment = key === 'nameAlignment'
                && !Object.hasOwn(preset, 'nameAlignment')
                ? geneoPersonCardEnumValue('alignment', preset.alignment, cardDefaults.alignment)
                : legacyAlignment;
            styleSettings[cardStyle][key] = key === 'alignment'
                && ['compact', 'portrait'].includes(cardStyle)
                    ? 'center'
                    : geneoPersonCardEnumValue(key, legacyNameAlignment, cardDefaults[key]);
        });
        Object.keys(GENEO_PERSON_CARD_FONT_RANGES).forEach(key =>
        {
            styleSettings[cardStyle][key] = geneoValidPersonCardFontSize(key, saved?.[key])
                ? saved[key] : cardDefaults[key];
        });
    });

    const active = styleSettings[style];
    return {
        style,

        nameFormat:
          geneoPersonCardEnumValue(
              'nameFormat',
              active.nameFormat,
              defaults.nameFormat
          ),

        dateFormat:
          geneoPersonCardEnumValue(
              'dateFormat',
              active.dateFormat,
              defaults.dateFormat
          ),

        photoSize:
          geneoPersonCardEnumValue(
              'photoSize',
              active.photoSize,
              defaults.photoSize
          ),

        photoAlignment:
          geneoPersonCardEnumValue(
              'photoAlignment',
              active.photoAlignment,
              defaults.photoAlignment
          ),

        alignment: style === 'compact' ? 'center'
            : geneoPersonCardEnumValue(
                'alignment',
                active.alignment,
                defaults.alignment
            ),

        nameAlignment: active.nameAlignment,
        nameFontSize: active.nameFontSize,
        detailsFontSize: active.detailsFontSize,

        fields: active.fields,
        photoByStyle,
        styleSettings,

        cornerRadius:
          Math.round(
              geneoNumber(
                  source.cornerRadius,
                  defaults.cornerRadius,
                  0,
                  32
              )
          )
    };
}

function normalizeGeneographPersonCardOverrides(
    value,
    fallbackHeightMode = 'auto',
    inheritedStyle = 'standard'
)
{
    const source =
        value
        && typeof value === 'object'
            ? value
            : {};

    const heightMode =
        source.heightMode === 'manual'
            ? 'manual'
            : source.heightMode === 'auto'
                ? 'auto'
                : fallbackHeightMode === 'manual'
                    ? 'manual'
                    : 'auto';

    if (source.custom !== true)
    {
        return geneoEmptyPersonCardOverrides(
            false,
            heightMode
        );
    }

    const fields = {};
    const photoByStyle = {};

    const sourceFields =
        source.fields
        && typeof source.fields === 'object'
            ? source.fields
            : {};

    Object.keys(
        geneoDefaultPersonCardSettings()
            .fields
    ).forEach(key =>
    {
        if (
            typeof sourceFields[key]
          === 'boolean'
        )
        {
            fields[key] =
                sourceFields[key];
        }
    });

    const sourcePhotoByStyle =
        source.photoByStyle
        && typeof source.photoByStyle === 'object'
            ? source.photoByStyle
            : {};

    GENEO_PERSON_CARD_STYLES.forEach(style =>
    {
        if (
            typeof sourcePhotoByStyle[style]
          === 'boolean'
        )
        {
            photoByStyle[style] =
                sourcePhotoByStyle[style];
        }
    });

    const radius =
        source.cornerRadius == null
            ? NaN
            : Number(source.cornerRadius);

    const enumOverride =
        key =>
            geneoPersonCardSettingValueIsValid(
                key,
                source[key]
            )
                ? source[key]
                : null;

    const styleSettings = {};
    const legacyStyle = source.style || inheritedStyle;
    GENEO_PERSON_CARD_STYLES.forEach(style =>
    {
        const saved = source.styleSettings?.[style];
        const preset = saved && typeof saved === 'object' ? saved : source;
        const presetFields = preset.fields && typeof preset.fields === 'object'
            ? preset.fields : fields;
        const cardFields = {};
        Object.keys(geneoDefaultPersonCardSettings().fields).forEach(field =>
        {
            if (typeof presetFields[field] === 'boolean')
                cardFields[field] = presetFields[field];
        });
        styleSettings[style] = { fields: cardFields };
        GENEO_PERSON_CARD_FORMAT_KEYS.forEach(key =>
        {
            const legacyNameAlignment = key === 'nameAlignment'
                && saved && !Object.hasOwn(saved, 'nameAlignment')
                ? saved.alignment
                : key === 'nameAlignment' && !saved && style === legacyStyle
                  ? source.alignment : preset[key];
            styleSettings[style][key] = key === 'alignment'
                && ['compact', 'portrait'].includes(style)
                    ? null
                    : key === 'alignment' && !saved && style !== legacyStyle
                      && ['compact', 'portrait'].includes(legacyStyle)
                        ? null
                    : geneoPersonCardSettingValueIsValid(key, legacyNameAlignment)
                        ? legacyNameAlignment : null;
        });
        Object.keys(GENEO_PERSON_CARD_FONT_RANGES).forEach(key =>
        {
            styleSettings[style][key] = geneoValidPersonCardFontSize(key, saved?.[key])
                ? saved[key] : null;
        });
    });

    return {
        custom: true,
        heightMode,
        fields,
        photoByStyle,
        styleSettings,

        style:
          enumOverride('style'),

        nameFormat:
          enumOverride('nameFormat'),

        dateFormat:
          enumOverride('dateFormat'),

        photoSize:
          enumOverride('photoSize'),

        photoAlignment:
          enumOverride('photoAlignment'),

        alignment:
          enumOverride('alignment'),

        nameAlignment:
          enumOverride('nameAlignment'),

        nameFontSize: null,
        detailsFontSize: null,

        cornerRadius:
          Number.isFinite(radius)
              ? Math.round(
                  geneoNumber(
                      radius,
                      8,
                      0,
                      32
                  )
              )
              : null
    };
}

function geneoPersonCardEffectiveSettings(
    node,
    diagram = selectedGeneographDiagram()
)
{
    const boardSettings =
        normalizeGeneographPersonCardSettings(
            diagram?.personCardDefaults
        );

    const overrides =
        normalizeGeneographPersonCardOverrides(
            node?.personCard,
            'auto',
            boardSettings.style
        );

    if (!overrides.custom)
    {
        return {
            ...boardSettings,
            cornerRadius: geneoCardAppearanceForNode(node, diagram)?.cornerRadius ?? boardSettings.cornerRadius,
            heightMode: overrides.heightMode
        };
    }

    const style = overrides.style || boardSettings.style;
    const boardStyle = boardSettings.styleSettings[style];
    const overrideStyle = overrides.styleSettings[style];
    const value = key => overrideStyle[key] == null
        ? boardStyle[key] : overrideStyle[key];

    const inheritedFields = { ...boardStyle.fields };

    const photoOverride =
        typeof overrides.photoByStyle?.[style]
          === 'boolean'
            ? overrides.photoByStyle[style]
            : typeof overrideStyle.fields.photo
              === 'boolean'
                ? overrideStyle.fields.photo
                : null;

    return {
        style,
        heightMode: overrides.heightMode,

        nameFormat:
          value('nameFormat'),

        dateFormat:
          value('dateFormat'),

        photoSize:
          value('photoSize'),

        photoAlignment:
          value('photoAlignment'),

        alignment:
          style === 'compact' ? 'center' : value('alignment'),

        nameAlignment:
          style === 'standard' ? value('nameAlignment') : value('alignment'),

        nameFontSize: value('nameFontSize'),
        detailsFontSize: value('detailsFontSize'),

        fields: {
            ...inheritedFields,
            ...overrideStyle.fields,
            ...(
                photoOverride === null
                    ? {}
                    : { photo: photoOverride }
            ),
            ...(style === 'compact' ? { photo: false } : {})
        },

        cornerRadius:
          overrides.cornerRadius === null
              ? geneoCardAppearanceForNode(node, diagram)?.cornerRadius ?? boardSettings.cornerRadius
              : overrides.cornerRadius
    };
}

function geneoPersonCardHasOverrides(node)
{
    const overrides = normalizeGeneographPersonCardOverrides(node?.personCard);
    return overrides.custom && (
        ['style', 'nameFormat', 'dateFormat', 'photoSize', 'photoAlignment', 'alignment', 'nameAlignment', 'cornerRadius']
            .some(key => overrides[key] !== null)
        || Object.keys(overrides.fields).length > 0
        || Object.keys(overrides.photoByStyle).length > 0
        || Object.values(overrides.styleSettings).some(preset =>
            GENEO_PERSON_CARD_FORMAT_KEYS.some(key => preset[key] !== null)
            || Object.keys(GENEO_PERSON_CARD_FONT_RANGES).some(key => preset[key] !== null)
            || Object.keys(preset.fields).length > 0)
    );
}

function geneoPersonHasResettableSettings(node)
{
    if (node?.type !== 'person') return false;
    const card = normalizeGeneographPersonCardOverrides(node.personCard);
    const appearance = node.appearance || {};
    return geneoPersonCardHasOverrides({ personCard: { ...card, style: null } })
        || ['fill', 'stroke', 'text'].some(key => appearance.paintOverrides?.[key] === true)
        || ['strokeWidth', 'strokePattern'].some(key => appearance.styleOverrides?.[key] === true)
        || appearance.shadowEnabled !== null;
}

function geneoResetPersonCardSettings(node, diagram)
{
    const current = normalizeGeneographPersonCardOverrides(node.personCard);
    node.personCard = geneoEmptyPersonCardOverrides(Boolean(current.style), current.heightMode);
    node.personCard.style = current.style;
    const inherited = geneoPersonGenderAppearance(node, diagram);
    for (const key of ['fill', 'stroke', 'text'])
        node.appearance[key] = structuredClone(inherited[key]);
    node.appearance.strokeWidth = inherited.strokeWidth;
    node.appearance.strokePattern = inherited.strokePattern;
    node.appearance.shadowEnabled = null;
    node.appearance.paintOverrides = { fill: false, stroke: false, text: false };
    node.appearance.styleOverrides = { strokeWidth: false, strokePattern: false };
}

function geneoApplyPersonGenderAppearance(node, diagram)
{
    const person = getGeneographPerson(node.personId);
    const gender = ['male', 'female'].includes(person?.gender) ? person.gender : 'unknown';
    const preset = diagram.cardAppearanceDefaults[gender];
    if (!preset) return;
    for (const key of ['fill', 'stroke', 'text'])
        node.appearance[key] = structuredClone(preset[key]);
    node.appearance.strokeWidth = preset.strokeWidth;
    node.appearance.strokePattern = preset.strokePattern;
    node.appearance.paintOverrides = { fill: true, stroke: true, text: true };
    node.appearance.styleOverrides = { strokeWidth: true, strokePattern: true };
    node.personCard = normalizeGeneographPersonCardOverrides(node.personCard);
    node.personCard.custom = true;
    node.personCard.cornerRadius = preset.cornerRadius;
}

function geneoPersonCardFieldSupported(
    style,
    field
)
{
    if (field === 'photo' && style === 'compact') return false;
    if (field === 'livingStatus') return style === 'standard';

    if (
        field === 'birthPlace'
        || field === 'deathPlace'
    )
    {
        return style === 'standard';
    }

    return true;
}

function geneoPersonHasRecordedDeath(
    person
)
{
    return Boolean(
        formatGenealogyDateLabel(
            person?.death
        )
        || geneoPersonPlaceLabel(
            person?.death
        )
    );
}

function geneoPersonCardViewModel(
    node,
    diagram = selectedGeneographDiagram()
)
{
    const person =
        node?.type === 'person'
            ? (
                diagram?.people || []
            ).find(
                item =>
                    item.id === node.personId
            ) || null
            : null;

    const settings =
        geneoPersonCardEffectiveSettings(
            node,
            diagram
        );

    const fields =
        settings.fields;

    if (!person)
    {
        return {
            person: null,
            settings,
            fields,
            displayName: 'Unknown',
            maidenName: '',
            showPhoto:
            Boolean(fields.photo),
            lifeSpan: '',
            structuredLife: false,
            birthEvent: null,
            deathEvent: null,
            displayStatus: ''
        };
    }

    const displayName =
        geneoPersonCardDisplayName(
            person,
            settings.nameFormat
        );

    const surname =
        String(
            person.names?.last || ''
        ).trim();

    const rawMaidenName =
        person.gender === 'female'
            ? String(
                person.names?.maiden || ''
            ).trim()
            : '';

    const maidenName =
        fields.maidenName
        && rawMaidenName
        && rawMaidenName.localeCompare(
            surname,
            undefined,
            { sensitivity: 'accent' }
        ) !== 0
            ? rawMaidenName
            : '';

    const deceased =
        person.livingStatus ===
        'Deceased';

    const hasRecordedDeath =
        deceased
        && geneoPersonHasRecordedDeath(
            person
        );

    const detailedStyle = settings.style === 'standard';

    const birthDate =
        fields.dates
            ? geneoPersonCardVitalDateLabel(
                person.birth,
                settings.dateFormat
            )
            : '';

    const deathDate =
        fields.dates
        && deceased
            ? geneoPersonCardVitalDateLabel(
                person.death,
                settings.dateFormat
            )
            : '';

    const birthPlace =
        detailedStyle
        && fields.birthPlace
            ? geneoPersonPlaceLabel(
                person.birth
            )
            : '';

    const deathPlace =
        detailedStyle
        && fields.deathPlace
        && deceased
            ? geneoPersonPlaceLabel(
                person.death
            )
            : '';

    const birthEvent =
        detailedStyle
        && (
            birthDate
          || birthPlace
        )
            ? {
                date: birthDate,
                place: birthPlace
            }
            : null;

    const deathEvent =
        detailedStyle
        && (
            deathDate
          || deathPlace
        )
            ? {
                date: deathDate,
                place: deathPlace
            }
            : null;

    const structuredLife =
        detailedStyle
        && Boolean(
            birthEvent
          || deathEvent
        );

    const lifeSpan =
        fields.dates
        && !detailedStyle
            ? geneoPersonCardLifeSpan(
                person,
                settings.dateFormat
            )
            : '';
    const portraitLifeSpan = settings.style === 'portrait' && fields.dates
        ? birthDate && deathDate
            ? `${birthDate} – ${deathDate}`
            : birthDate
                ? `${state.language === 'ru' ? 'Род.' : 'Born'} ${birthDate}`
                : deathDate
                    ? `${state.language === 'ru' ? 'Ум.' : 'Died'} ${deathDate}`
                    : ''
        : '';

    /*
       * Living is intentionally not presented
       * as a card status. Only exceptional or
       * unresolved states appear.
       */
    const displayStatus =
        fields.livingStatus
        && (
            (
                deceased
            && !hasRecordedDeath
            )
          || person.livingStatus ===
            'Unknown'
        )
            ? person.livingStatus
            : '';

    return {
        person,
        settings,
        fields,
        displayName,
        maidenName,
        showPhoto:
          Boolean(fields.photo),
        lifeSpan,
        portraitLifeSpan,
        structuredLife,
        birthEvent,
        deathEvent,
        displayStatus
    };
}

function geneoPersonCardReferenceSize(
    node,
    diagram = selectedGeneographDiagram()
)
{
    const style =
        geneoPersonCardEffectiveSettings(
            node,
            diagram
        ).style
        || 'standard';

    const base =
        GENEO_PERSON_CARD_GEOMETRY[
            style
        ]
        || GENEO_PERSON_CARD_GEOMETRY
            .standard;

    return {
        width:
          base.width,

        height:
          base.height
    };
}

function geneoPersonCardGeometry(
    node,
    diagram = selectedGeneographDiagram()
)
{
    const style =
        geneoPersonCardEffectiveSettings(
            node,
            diagram
        ).style
        || 'standard';

    return (
        GENEO_PERSON_CARD_GEOMETRY[style]
        || GENEO_PERSON_CARD_GEOMETRY.standard
    );
}

function geneoPersonCardDimensionFactors(
    node,
    diagram = selectedGeneographDiagram()
)
{
    const geometry =
        geneoPersonCardGeometry(
            node,
            diagram
        );

    return {
        width:
          geneoNumber(
              Number(node?.width)
              / geometry.width,
              1,
              geometry.minWidth
              / geometry.width,
              geometry.maxWidth
              / geometry.width
          ),

        height:
          geneoNumber(
              Number(node?.height)
              / geometry.height,
              1,
              geometry.minHeight
              / geometry.height,
              geometry.maxHeight
              / geometry.height
          )
    };
}

function geneoSetPersonCardDimensions(
    node,
    factors,
    diagram = selectedGeneographDiagram()
)
{
    if (node?.type !== 'person')
    {
        return;
    }

    const geometry =
        geneoPersonCardGeometry(
            node,
            diagram
        );

    node.width =
        geneoNumber(
            geometry.width
            * geneoNumber(
                factors?.width,
                1
            ),
            geometry.width,
            geometry.minWidth,
            geometry.maxWidth
        );

    node.height =
        geneoNumber(
            geometry.height
            * geneoNumber(
                factors?.height,
                1
            ),
            geometry.height,
            geometry.minHeight,
            geometry.maxHeight
        );
}

function geneoCapturePersonCardDimensions(
    nodes,
    diagram = selectedGeneographDiagram()
)
{
    return new Map(
        (
            Array.isArray(nodes)
                ? nodes
                : []
        )
            .filter(
                node =>
                    node?.type === 'person'
            )
            .map(
                node => [
                    node.id,
                    geneoPersonCardDimensionFactors(
                        node,
                        diagram
                    )
                ]
            )
    );
}

function geneoRestorePersonCardDimensions(
    dimensionMap,
    diagram = selectedGeneographDiagram()
)
{
    if (!(dimensionMap instanceof Map))
    {
        return;
    }

    dimensionMap.forEach(
        (factors, nodeId) =>
        {
            const node =
                getGeneographNode(nodeId);

            if (node?.type !== 'person')
            {
                return;
            }

            geneoSetPersonCardDimensions(
                node,
                factors,
                diagram
            );
        }
    );
}

function geneoPersonCardPhotoBaseSize(
    settings
)
{
    const style =
        settings?.style
        || 'standard';

    const size =
        settings?.photoSize
        || 'medium';

    const values = {
        standard: {
            small: 56,
            medium: 64,
            large: 76
        },

        chart: {
            small: 108,
            medium: 130,
            large: 150
        },

        portrait: {
            small: 110,
            medium: 130,
            large: 150
        }
    };

    return (
        values[style]?.[size]
        || values.standard.medium
    );
}

function geneoPersonCardCssVariables(
    node,
    settings =
        geneoPersonCardEffectiveSettings(
            node
        )
)
{
    const photo =
        geneoPersonCardPhotoBaseSize(
            settings
        );

    return [
        `--geneo-card-photo-target:${photo}px`,
        `--geneo-card-name-size:${settings.nameFontSize}px`,
        `--geneo-card-details-size:${settings.detailsFontSize}px`
    ];
}

function geneoPersonCardMinimumSize(
    node,
    width = node?.width,
    diagram = selectedGeneographDiagram()
)
{
    const geometry =
        geneoPersonCardGeometry(
            node,
            diagram
        );

    return {
        width: geometry.minWidth,
        height: geometry.minHeight
    };
}

function ensureGeneographPersonCardSize(
    node,
    diagram = selectedGeneographDiagram()
)
{
    if (node?.type !== 'person')
    {
        return;
    }

    const geometry =
        geneoPersonCardGeometry(
            node,
            diagram
        );

    node.width =
        geneoNumber(
            node.width,
            geometry.width,
            geometry.minWidth,
            geometry.maxWidth
        );

    node.height =
        geneoNumber(
            node.height,
            geometry.height,
            geometry.minHeight,
            geometry.maxHeight
        );
    if (geneoPersonCardEffectiveSettings(node, diagram).style === 'chart')
        node.chartCardLayoutVersion = 1;
    if (geneoPersonCardEffectiveSettings(node, diagram).style === 'portrait')
        node.portraitCardLayoutVersion = 1;
}

function geneoPersonCardUsesAutoHeight(
    node,
    diagram = selectedGeneographDiagram()
)
{
    if (node?.type !== 'person')
    {
        return false;
    }

    const settings =
        geneoPersonCardEffectiveSettings(
            node,
            diagram
        );

    return (
        settings.style === 'standard'
        && settings.heightMode === 'auto'
    );
}

function geneoAutoPersonHeightSignature(
    node,
    content,
    diagram
)
{
    const settings =
        geneoPersonCardEffectiveSettings(
            node,
            diagram
        );

    const person =
        getGeneographPerson(
            node.personId
        );

    return JSON.stringify([
        state.language,
        Boolean(diagram.canvas.snapToGrid),
        Math.round(
            geneoNumber(
                node.width,
                0
            ) * 100
        ) / 100,
        settings,
        person?.treePersonId || '',
        person?.photoId || '',
        String(
            content.textContent || ''
        )
            .trim()
            .replace(/\s+/g, ' ')
    ]);
}

function syncGeneographAutoPersonCardHeights()
{
    const diagram = selectedGeneographDiagram();

    if (!diagram) return false;

    const changed = [];

    const signatureCache =
        geneoCanvasRuntime
            .autoPersonHeightSignatures
        || new Map();

    geneoCanvasRuntime
        .autoPersonHeightSignatures =
            signatureCache;

    const autoNodeIds =
        new Set(
            diagram.nodes
                .filter(node =>
                    geneoPersonCardUsesAutoHeight(
                        node,
                        diagram
                    )
                )
                .map(node => node.id)
        );

    for (
        const nodeId
        of signatureCache.keys()
    )
    {
        if (!autoNodeIds.has(nodeId))
        {
            signatureCache.delete(nodeId);
        }
    }

    diagram.nodes
        .filter(node =>
            geneoPersonCardUsesAutoHeight(
                node,
                diagram
            )
        )
        .forEach(node =>
        {
            const element = main.querySelector(
                `article[data-geneo-node="${CSS.escape(node.id)}"]`
            );

            const content = element?.querySelector(
                '.geneo-person-node-content'
            );

            if (!element || !content) return;

            const signature =
                geneoAutoPersonHeightSignature(
                    node,
                    content,
                    diagram
                );

            if (
                signatureCache.get(node.id)
            === signature
            )
            {
                return;
            }

            signatureCache.set(
                node.id,
                signature
            );

            const geometry =
                geneoPersonCardGeometry(
                    node,
                    diagram
                );

            const naturalHeight = Math.ceil(
                content.scrollHeight
            );

            const contentHeight = geneoNumber(
                naturalHeight,
                node.height,
                geometry.minHeight,
                geometry.maxHeight
            );
            const nextHeight = diagram.canvas.snapToGrid
                ? Math.min(geometry.maxHeight,
                    Math.ceil(contentHeight / (GENEO_GRID_SIZE * 2)) * GENEO_GRID_SIZE * 2)
                : Math.round(contentHeight);

            if (
                Math.abs(nextHeight - node.height)
            < 1
            )
            {
                return;
            }

            node.height = nextHeight;
            element.style.height = `${nextHeight}px`;
            changed.push(node);
        });

    if (!changed.length) return false;

    updateGeneographLiveGeometry(
        changed[0],
        changed
    );

    const selected = selectedGeneographNode();

    if (
        selected
        && changed.some(
            node => node.id === selected.id
        )
    )
    {
        const heightInput = main.querySelector(
            '[data-geneo-layout="height"]'
        );

        if (heightInput)
        {
            heightInput.value = Math.round(
                selected.height
            );
        }
    }

    return true;
}

function geneoPlaceUsesAutoSize(node)
{
    return (
        node?.type === 'place'
        && node.placeSizeMode !== 'manual'
    );
}

function syncGeneographAutoPlaceSizes()
{
    const diagram =
        selectedGeneographDiagram();

    if (!diagram)
    {
        return false;
    }

    const changed = [];

    /*
       * Text is measured using the Place label's actual
       * computed font, independently of the current node
       * width. This lets auto-sized nodes both grow and
       * shrink correctly.
       */
    const measurementCanvas =
        document.createElement('canvas');

    const measurementContext =
        measurementCanvas.getContext('2d');

    const cssPixels = value =>
        Number.parseFloat(value) || 0;

    diagram.nodes
        .filter(geneoPlaceUsesAutoSize)
        .forEach(node =>
        {
            const element =
                main.querySelector(
                    `article[data-geneo-node="${
                        CSS.escape(node.id)
                    }"]`
                );

            const content =
                element?.querySelector(
                    '.geneo-place-node-content'
                );

            const iconElement =
                content?.querySelector(
                    '.geneo-place-node-icon'
                );

            const nameElement =
                content?.querySelector(
                    '.geneo-place-node-name'
                );

            if (
                !element
            || !content
            || !iconElement
            || !nameElement
            )
            {
                return;
            }

            const contentStyle =
                getComputedStyle(content);

            const elementStyle =
                getComputedStyle(element);

            const nameStyle =
                getComputedStyle(nameElement);

            let nameWidth =
                nameElement.scrollWidth;

            if (measurementContext)
            {
                measurementContext.font = [
                    nameStyle.fontStyle,
                    nameStyle.fontWeight,
                    nameStyle.fontSize,
                    nameStyle.fontFamily
                ]
                    .filter(Boolean)
                    .join(' ');

                nameWidth =
                    measurementContext.measureText(
                        nameElement.textContent || ''
                    ).width;
            }

            const naturalWidth =
                Math.ceil(
                    cssPixels(
                        contentStyle.paddingLeft
                    )
              + iconElement.offsetWidth
              + cssPixels(
                  contentStyle.columnGap
                || contentStyle.gap
              )
              + nameWidth
              + cssPixels(
                  contentStyle.paddingRight
              )
              + cssPixels(
                  elementStyle.borderLeftWidth
              )
              + cssPixels(
                  elementStyle.borderRightWidth
              )
              + 2
                );

            const defaults =
                geneoNodeDefaults('place');

            const minimumSize =
                geneoNodeMinimumSize(node);

            const maximumSize =
                geneoNodeMaximumSize(node);

            const nextWidth =
                Math.round(
                    geneoNumber(
                        naturalWidth,
                        defaults.width,
                        minimumSize.width,
                        maximumSize.width
                    )
                );

            /*
           * Place content is deliberately one line.
           * Automatic sizing therefore restores its
           * canonical natural height.
           */
            const nextHeight =
                Math.round(
                    geneoNumber(
                        defaults.height,
                        defaults.height,
                        minimumSize.height,
                        maximumSize.height
                    )
                );

            if (
                nextWidth === node.width
            && nextHeight === node.height
            )
            {
                return;
            }

            node.width = nextWidth;
            node.height = nextHeight;

            element.style.width =
                `${nextWidth}px`;

            element.style.height =
                `${nextHeight}px`;

            changed.push(node);
        });

    if (!changed.length)
    {
        return false;
    }

    updateGeneographLiveGeometry(
        changed[0],
        changed
    );

    const selected =
        selectedGeneographNode();

    if (
        selected
        && changed.some(
            node => node.id === selected.id
        )
    )
    {
        const widthInput =
            main.querySelector(
                '[data-geneo-layout="width"]'
            );

        const heightInput =
            main.querySelector(
                '[data-geneo-layout="height"]'
            );

        if (widthInput)
        {
            widthInput.value =
                Math.round(selected.width);
        }

        if (heightInput)
        {
            heightInput.value =
                Math.round(selected.height);
        }
    }

    return true;
}

function geneoNodeCornerRadius(node)
{
    if (node?.type === 'person')
    {
        return (
            geneoPersonCardEffectiveSettings(
                node
            ).cornerRadius
        );
    }

    if (Number.isFinite(node?.appearance?.cornerRadius))
    {
        return node.appearance.cornerRadius;
    }

    return 8;
}

function geneoSemanticColor(token)
{
    return getComputedStyle(document.documentElement).getPropertyValue(token).trim();
}

function geneoDefaultCanvasColor()
{
    return geneoSemanticColor('--tree-canvas-surface');
}

function createEmptyGeneographDiagram()
{
    return {
        themeProvenanceVersion: 1,
        canvas: {
            backgroundPaint: { color: geneoDefaultCanvasColor(), opacity: 100, enabled: true },
            backgroundOverride: false,
            backgroundPattern: 'dots',
            snapToGrid: true,
            alwaysShowSockets: false,
            shadowEnabled: true,
            colorPersonCardsByGender: false
        },
        personCardDefaults:
          geneoDefaultPersonCardSettings(),
        cardAppearanceDefaults: geneoDefaultCardAppearances(),
        connectionDefaults: geneoDefaultConnectionStyle(),
        assets: [],
        people: [],
        families: [],
        nodes: [],
        connections: []
    };
}

function selectedGeneographDiagram()
{
    return selectedGeneographBoard()?.diagram || null;
}

function getGeneographNode(nodeId)
{
    return selectedGeneographDiagram()?.nodes.find(node => node.id === nodeId) || null;
}

function getGeneographConnection(connectionId)
{
    return selectedGeneographDiagram()?.connections.find(connection => connection.id === connectionId) || null;
}

function getGeneographPerson(personId)
{
    return selectedGeneographDiagram()?.people.find(person => person.id === personId) || null;
}

function normalizeGeneographPersonNames(person = {})
{
    const source = person.names && typeof person.names === 'object' ? person.names : {};
    let first = String(source.first || '').trim();
    let middle = String(source.middle || '').trim();
    let last = String(source.last || '').trim();
    const maiden = String(source.maiden || '').trim();
    if (!first && !middle && !last && person.displayName)
    {
        const parts = String(person.displayName).trim().split(/\s+/).filter(Boolean);
        first = parts.shift() || '';
        last = parts.length ? parts.pop() : '';
        middle = parts.join(' ');
    }
    return { first, middle, last, maiden };
}

function normalizeGeneographPersonVital(value, projectId)
{
    const source = value && typeof value === 'object' ? value : {};
    const normalized = normalizeGenealogyDateInput(value || emptyGenealogyDate('Exact date'));
    const requestedPlaceId = cleanDatePlaceId(source.placeId || normalized.placeId);
    const place = requestedPlaceId
        ? (sampleData.places || []).find(item => item.id === requestedPlaceId && item.projectId === projectId && !item.deleted)
        : null;
    return {
        ...normalized,
        placeId: place?.id || null,
        placeText: String(source.placeText || '').trim()
    };
}

function geneoPersonDisplayName(person)
{
    const names = normalizeGeneographPersonNames(person);
    if (names.first === 'Unknown father' && !names.middle && !names.last && !names.maiden) return t('Unknown father');
    return [names.first, names.middle, names.last].filter(Boolean).join(' ') || 'Unknown';
}

function geneoPersonInitials(person)
{
    const names = normalizeGeneographPersonNames(person);
    const parts = [names.first, names.last].filter(Boolean);
    return (parts.map(value => value[0]).join('').slice(0, 2) || 'U').toUpperCase();
}

function geneoPersonLifeDates(person)
{
    const birth = formatGenealogyDateLabel(person?.birth);
    const death = person?.livingStatus === 'Deceased' ? formatGenealogyDateLabel(person?.death) : '';
    if (birth && death) return `${birth} - ${death}`;
    if (birth) return `Born ${birth}`;
    if (death) return `Died ${death}`;
    return 'Dates unknown';
}

function geneoPersonPlaceLabel(vital)
{
    return getPlaceDisplay(vital?.placeId) || String(vital?.placeText || '').trim();
}

function getGeneographFamily(familyId)
{
    return selectedGeneographDiagram()?.families.find(family => family.id === familyId) || null;
}

function normalizeGeneographIdArray(
    value
)
{
    if (!Array.isArray(value))
    {
        return [];
    }

    return [
        ...new Set(
            value
                .map(item =>
                    String(
                        item || ''
                    ).trim()
                )
                .filter(Boolean)
        )
    ];
}

function getProjectBoards(
    projectId =
        currentProjectId(),
    {
        includeArchived =
            false
    } = {}
)
{
    return (
        sampleData.boards
        || []
    ).filter(board =>
        board.projectId
          === projectId
        && (
            includeArchived
          || !board.archived
        )
    );
}

function getGeneographBoard(
    boardId,
    {
        projectId =
            currentProjectId()
    } = {}
)
{
    const board =
        (
            sampleData.boards
          || []
        ).find(item =>
            item.id === boardId
        )
        || null;

    if (
        !board
        || (
            projectId
          && board.projectId
            !== projectId
        )
    )
    {
        return null;
    }

    return board;
}

function getProjectBoardCollections(
    projectId =
        currentProjectId()
)
{
    return (
        sampleData.boardCollections
        || []
    ).filter(collection =>
        collection.projectId
          === projectId
    );
}

function getBoardCollection(
    collectionId,
    {
        projectId =
            currentProjectId()
    } = {}
)
{
    const collection =
        (
            sampleData.boardCollections
          || []
        ).find(item =>
            item.id === collectionId
        )
        || null;

    if (
        !collection
        || (
            projectId
          && collection.projectId
            !== projectId
        )
    )
    {
        return null;
    }

    return collection;
}

function getCollectionsForBoard(
    boardId,
    {
        projectId =
            currentProjectId()
    } = {}
)
{
    const board =
        getGeneographBoard(
            boardId,
            {
                projectId
            }
        );

    if (!board)
    {
        return [];
    }

    return (
        board.collectionIds
        || []
    )
        .map(collectionId =>
            getBoardCollection(
                collectionId,
                {
                    projectId:
                board.projectId
                }
            )
        )
        .filter(Boolean);
}

function getBoardsForCollection(
    collectionId,
    {
        projectId =
            currentProjectId(),

        includeArchived =
            false
    } = {}
)
{
    const collection =
        getBoardCollection(
            collectionId,
            {
                projectId
            }
        );

    if (!collection)
    {
        return [];
    }

    return getProjectBoards(
        collection.projectId,
        {
            includeArchived
        }
    ).filter(board =>
        (
            board.collectionIds
          || []
        ).includes(
            collection.id
        )
    );
}

function setBoardCollections(
    boardId,
    collectionIds,
    {
        projectId =
            currentProjectId(),

        touchModified =
            true
    } = {}
)
{
    const board =
        getGeneographBoard(
            boardId,
            {
                projectId
            }
        );

    if (!board)
    {
        return null;
    }

    const validCollectionIds =
        new Set(
            getProjectBoardCollections(
                board.projectId
            ).map(collection =>
                collection.id
            )
        );

    const nextCollectionIds =
        normalizeGeneographIdArray(
            collectionIds
        ).filter(collectionId =>
            validCollectionIds.has(
                collectionId
            )
        );

    const unchanged =
        nextCollectionIds.length
          === board.collectionIds.length
        && nextCollectionIds.every(
            (
                collectionId,
                index
            ) =>
                collectionId
              === board.collectionIds[
                  index
              ]
        );

    if (unchanged)
    {
        return board;
    }

    board.collectionIds =
        nextCollectionIds;

    if (touchModified)
    {
        touchGeneographBoard(
            board
        );
    }

    return board;
}

function addBoardToCollection(
    boardId,
    collectionId,
    options = {}
)
{
    const board =
        getGeneographBoard(
            boardId,
            {
                projectId:
              options.projectId
              || currentProjectId()
            }
        );

    if (!board)
    {
        return null;
    }

    return setBoardCollections(
        board.id,
        [
            ...board.collectionIds,
            collectionId
        ],
        options
    );
}

function removeBoardFromCollection(
    boardId,
    collectionId,
    options = {}
)
{
    const board =
        getGeneographBoard(
            boardId,
            {
                projectId:
              options.projectId
              || currentProjectId()
            }
        );

    if (!board)
    {
        return null;
    }

    return setBoardCollections(
        board.id,
        board.collectionIds.filter(
            id =>
                id !== collectionId
        ),
        options
    );
}

function setGeneographBoardArchived(
    boardId,
    archived,
    {
        projectId =
            currentProjectId(),

        touchModified =
            true
    } = {}
)
{
    const board =
        getGeneographBoard(
            boardId,
            {
                projectId
            }
        );

    if (!board)
    {
        return null;
    }

    const nextArchived =
        Boolean(
            archived
        );

    if (
        board.archived
          === nextArchived
    )
    {
        return board;
    }

    board.archived =
        nextArchived;

    if (touchModified)
    {
        touchGeneographBoard(
            board
        );
    }

    return board;
}

function createGeneographCollection({
    name,
    description = '',
    projectId =
        currentProjectId()
} = {})
{
    projectId = validProjectById(projectId)?.id || '';
    const normalizedName =
        String(
            name || ''
        ).trim();

    if (!normalizedName || !projectId)
    {
        return null;
    }

    const collection = {
        id:
          createRuntimeId(
              'board-col'
          ),

        projectId,

        name:
          normalizedName,

        description:
          String(
              description || ''
          ).trim()
    };

    sampleData.boardCollections.push(
        collection
    );
    markPrototypeSessionEdited();

    return collection;
}

function activeGeneographCollection()
{
    if (
        state.geneoLibraryView
          !== 'collection'
        || !state
            .geneoActiveCollectionId
    )
    {
        return null;
    }

    return getBoardCollection(
        state.geneoActiveCollectionId
    );
}

function geneographLibraryContext()
{
    const activeCollection =
        activeGeneographCollection();

    if (activeCollection)
    {
        return {
            title:
            activeCollection.name,

            icon:
            icon.folder,

            description:
            activeCollection
                .description
            || '',

            emptyMessage:
            'No boards in this collection yet.'
        };
    }

    const contexts = {
        all: {
            title:
            'All boards',

            icon:
            icon.whiteboard,

            description:
            '',

            emptyMessage:
            'No boards yet.'
        },

        favorites: {
            title:
            'Favourites',

            icon:
            icon.star,

            description:
            '',

            emptyMessage:
            'No favourite boards yet.'
        },

        unassigned: {
            title:
            'Not in collection',

            icon:
            icon.folder,

            description:
            'Boards waiting to be organized.',

            emptyMessage:
            'Every active board belongs to a collection.'
        },

        archived: {
            title:
            'Archived',

            icon:
            icon.archive,

            description:
            'Boards kept outside your active Geneograph workspace.',

            emptyMessage:
            'No archived boards. Archived boards will appear here.'
        },

        collection: {
            title:
            'Collection',

            icon:
            icon.folder,

            description:
            '',

            emptyMessage:
            'No boards in this collection yet.'
        }
    };

    return (
        contexts[
            state.geneoLibraryView
        ]
        || contexts.all
    );
}

function geneographBoardSearchText(
    board
)
{
    const collections =
        getCollectionsForBoard(
            board.id,
            {
                projectId:
              board.projectId
            }
        )
            .map(collection =>
                `
              ${collection.name || ''}
              ${collection.description || ''}
            `
            )
            .join(' ');

    return `
        ${board.title || ''}
        ${board.description || ''}
        ${collections}
      `
        .trim()
        .toLowerCase();
}

function geneographBoardModifiedTime(
    board
)
{
    if (
        board.modified
          === 'Just now'
    )
    {
        return Number
            .POSITIVE_INFINITY;
    }

    const timestamp =
        Date.parse(
            board.modified || ''
        );

    return Number.isFinite(
        timestamp
    )
        ? timestamp
        : 0;
}

