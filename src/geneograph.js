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
        fill: { color: '#173029', opacity: 100, enabled: true },
        stroke: { color: '#62D99A', opacity: 100, enabled: false },
        text: { color: '#F1F5F3', opacity: 100, enabled: true },
        strokeWidth: 2,
        strokePattern: 'solid',
        cornerRadius: 8
    };
    return {
        neutral,
        male: {
            ...structuredClone(neutral),
            fill: { color: '#172A32', opacity: 100, enabled: true },
            stroke: { color: '#5A9BD8', opacity: 100, enabled: true },
            text: { color: '#F2F8FB', opacity: 100, enabled: true }
        },
        female: {
            ...structuredClone(neutral),
            fill: { color: '#2D2437', opacity: 100, enabled: true },
            stroke: { color: '#8D6CE8', opacity: 100, enabled: true },
            text: { color: '#F6F1FB', opacity: 100, enabled: true }
        },
        unknown: structuredClone(neutral)
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
            cornerRadius: Math.round(geneoNumber(entry.cornerRadius, radius, 0, 32))
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
        || ['strokeWidth', 'strokePattern'].some(key => appearance.styleOverrides?.[key] === true);
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
        `--geneo-card-photo-target:${photo}px`
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

function createEmptyGeneographDiagram()
{
    return {
        canvas: {
            backgroundPaint: { color: '#0F1413', opacity: 100, enabled: true },
            backgroundPattern: 'dots',
            snapToGrid: true,
            alwaysShowSockets: false,
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

let geneoMobileBoardSearchOpen = false;

function renderGeneographHome()
{
    cancelGeneographPencilStroke();
    const filtered =
        filteredGeneographBoards();

    const libraryContext =
        geneographLibraryContext();

    const sectionTitle =
        libraryContext.title;

    const sectionIcon =
        libraryContext.icon;

    const sectionDescription =
        libraryContext.description;

    sidebar.innerHTML = `
        <nav
          class="
            geneo-sidebar
          "
          aria-label="Geneograph navigation">

          <div data-geneo-tour-target="library-navigation">
            <div
              class="
                side-section-title
              ">

              Navigation
            </div>

            <div class="side-nav">
              ${renderGeneoAllBoardsNavigationButton()}

              ${renderGeneoLibraryViewButton(
                    'favorites',
                    'Favourites',
                    icon.star
                )}
              ${renderGeneoLibraryViewButton(
                    'unassigned',
                    'Not in collection',
                    icon.folder
                )}

              ${renderGeneoLibraryViewButton(
                    'archived',
                    'Archived',
                    icon.archive
                )}
            </div>
          </div>

          <div data-geneo-tour-target="library-collections">
            <div
              class="
                side-section-title
                with-add
              ">

              <span>
                Collections
              </span>

              <button
                class="
                  side-add-button
                "
                type="button"
                data-geneo-add-collection
                aria-label="Create collection"
                title="Create collection">

                ${icon.plus}
              </button>
            </div>

            <div class="side-nav">
              ${renderGeneographCollectionSidebarRows()}
            </div>
          </div>

          <div
            class="
              geneo-sidebar-tip
            ">

            <div class="tip-card">
              <div class="tip-title">
                ${icon.tip}
                Tip of the day
              </div>

              <p>
                Use Geneograph boards to collect
                hypotheses before adding relationships
                to the structured Family Tree.
              </p>

              <button
                class="
                  link
                  tip-link
                "
                type="button"
                data-toast="
                  Geneograph learning center
                  will be added later.
                ">

                <span
                  class="
                    tip-link-text
                  ">

                  Learn more
                </span>

                <span
                  class="
                    tip-link-icon
                  "
                  aria-hidden="true">

                  ${icon.openlink}
                </span>
              </button>
            </div>
          </div>
        </nav>
      `;

    main.innerHTML = `
        <section
          class="
            geneo-home-page
          ">

          ${renderArchivePageHead({
                title:
              'Geneograph Visual Boards',

                subtitle:
              'Your personal space for research, visualizations and publications.',

                actions: `
              <button
                class="
                  button
                  secondary
                "
                type="button"
                data-geneo-import
                aria-label="${escapeHtml(t('Import board'))}">

                ${icon.import}
                <span>${escapeHtml(t('Import board'))}</span>
              </button>
              <input type="file" accept=".ggboard" data-geneo-import-file hidden>

              <button
                class="
                  button
                  primary
                "
                type="button"
                data-geneo-create>

                ${icon.plus}
                New board
              </button>
            `
            })}

          <div
            class="
              geneo-board-toolbar ${geneoMobileBoardSearchOpen ? 'mobile-search-open' : ''}
            ">

            <div
              class="
                geneo-board-toolbar-left
              ">

              <button class="geneo-mobile-search-trigger" type="button" data-geneo-mobile-search aria-label="${escapeHtml(t('Search boards'))}" title="${escapeHtml(t('Search boards'))}">${icon.search}</button>
              <label
                class="
                  app-search-field
                "
                aria-label="Search boards">

                ${icon.search}

                <input
                  id="geneoBoardSearch"
                  type="search"
                  placeholder="Search boards..."
                  value="${escapeHtml(
                        state.geneoBoardSearch
                    )}">
              </label>
              <button class="geneo-mobile-search-close" type="button" data-geneo-mobile-search-close aria-label="${escapeHtml(t('Close'))}" title="${escapeHtml(t('Close'))}">${icon.close}</button>
            </div>

            <div
              class="
                geneo-board-toolbar-right
              ">
              ${renderAppSortControl({
                    id: 'geneoBoardSort',
                    field: state.geneoBoardSort,
                    direction: state.geneoBoardSortDirection,
                    ariaLabel: 'Sort boards',
                    options: APP_SORT_OPTIONS.geneograph
                })}
              <button
                class="
                  toolbar-button
                  ${
                        state.geneoBoardViewMode
                      === 'grid'
                            ? 'active'
                            : ''
                    }
                "
                type="button"
                data-geneo-board-view="grid"
                aria-label="Grid view">

                ${icon.grid}
              </button>

              <button
                class="
                  toolbar-button
                  ${
                        state.geneoBoardViewMode
                      === 'list'
                            ? 'active'
                            : ''
                    }
                "
                type="button"
                data-geneo-board-view="list"
                aria-label="List view">

                ${icon.list}
              </button>
            </div>
          </div>

          <div
            class="
              geneo-board-section
            ">

            <h2
              class="
                section-heading
              ">

              ${sectionIcon}

              ${escapeHtml(
                    sectionTitle
                )}

              (${filtered.length})
            </h2>

            ${
                sectionDescription
                    ? `
                  <p
                    class="
                      geneo-board-section-description
                    ">

                    ${escapeHtml(
                        sectionDescription
                    )}
                  </p>
                `
                    : ''
            }

            ${renderGeneographBoardCollection(
                filtered
            )}
          </div>
        </section>
      `;

    bindGeneographHome();
}

function renderGeneoLibraryViewButton(
    view,
    label,
    iconHtml
)
{
    const active =
        state.geneoLibraryView
          === view;

    return `
        <button
          class="
            side-link
            ${active ? 'active' : ''}
          "
          type="button"
          data-geneo-library-view="${escapeHtml(
                view
            )}">

          ${iconHtml}

          <span>
            ${escapeHtml(
                label
            )}
          </span>
        </button>
      `;
}

function renderGeneoAllBoardsNavigationButton({ editor = false } = {})
{
    const active = !editor && state.geneoLibraryView === 'all';
    return `
        <button
          class="side-link ${active ? 'active' : ''}"
          type="button"
          ${editor ? 'data-geneo-all-boards' : 'data-geneo-library-view="all"'}>
          ${icon.whiteboard}
          <span>All Boards</span>
        </button>
      `;
}

function renderGeneographCollectionSidebarRows()
{
    const collections =
        getProjectBoardCollections();

    if (!collections.length)
    {
        return `
          <div
            class="
              geneo-collection-sidebar-empty
            ">

            ${escapeHtml(t('No collections yet'))}
          </div>
        `;
    }

    return collections
        .map(collection =>
        {
            const active =
                state.geneoLibraryView
              === 'collection'
            && state
                .geneoActiveCollectionId
              === collection.id;

            return `
            <div
              class="
                sidebar-entity-row
                ${active ? 'active' : ''}
              ">

              <button
                class="
                  sidebar-entity-main
                "
                type="button"
                data-geneo-collection="${escapeHtml(
                    collection.id
                )}"
                title="${escapeHtml(
                    collection.name
                )}">

                ${icon.folder}

                <span
                  class="
                    sidebar-entity-name
                  ">

                  ${escapeHtml(
                        collection.name
                    )}
                </span>
              </button>

              <button
                class="
                  more-button
                  sidebar-entity-more
                "
                type="button"
                data-geneo-collection-menu="${escapeHtml(
                    collection.id
                )}"
                aria-label="Actions for ${escapeHtml(
                    collection.name
                )}"
                aria-haspopup="menu">

                ${icon.more}
              </button>
            </div>
          `;
        })
        .join('');
}

function filteredGeneographBoards()
{
    const projectId =
        currentProjectId();

    const query =
        state.geneoBoardSearch
            .trim()
            .toLowerCase();

    let list;

    if (
        state.geneoLibraryView
          === 'archived'
    )
    {
        list =
            getProjectBoards(
                projectId,
                {
                    includeArchived:
                true
                }
            ).filter(board =>
                board.archived
            );
    }
    else if (
        state.geneoLibraryView
          === 'collection'
    )
    {
        const collection =
            activeGeneographCollection();

        list =
            collection
                ? getBoardsForCollection(
                    collection.id,
                    {
                        projectId
                    }
                )
                : [];
    }
    else
    {
        list =
            getProjectBoards(
                projectId
            );

        if (
            state.geneoLibraryView
            === 'favorites'
        )
        {
            list =
                list.filter(board =>
                    board.favorite
                );
        }

        if (
            state.geneoLibraryView
            === 'unassigned'
        )
        {
            list =
                list.filter(board =>
                    !(
                        board.collectionIds
                || []
                    ).length
                );
        }
    }

    if (query)
    {
        list =
            list.filter(board =>
                geneographBoardSearchText(
                    board
                ).includes(
                    query
                )
            );
    }
    return appSortRecords(list, {
        field:
          state.geneoBoardSort,

        direction:
          state.geneoBoardSortDirection,

        extractors: {
            name: {
                type: 'text',
                get: board =>
                    board.title
            },

            updated: {
                type: 'number',
                get:
              geneographBoardModifiedTime
            },

            created: {
                type: 'number',
                get: board =>
                    appSortTimestamp(
                        board.createdAt
                    )
            }
        },

        getFallback:
          board => board.title
    });
}

function renderGeneographNewBoardTile()
{
    return `
        <div class="library-create-tile" data-geneo-create-tile>
          <button class="library-create-primary" type="button" data-geneo-create>
            <span class="library-create-icon" aria-hidden="true">${icon.plus}</span>
            <span class="library-create-copy"><strong>${escapeHtml(t('New board'))}</strong><span>${escapeHtml(t('A visual workspace for your research.'))}</span></span>
          </button>
          <div class="library-create-secondary">
            <button class="library-import-action" type="button" data-geneo-import>${icon.import}${escapeHtml(t('Import board...'))}</button>
          </div>
          <div class="library-drop-feedback" aria-hidden="true">${icon.import}<strong>${escapeHtml(t('Drop to import board'))}</strong></div>
        </div>
      `;
}

function renderGeneographBoardEmptyState()
{
    const query =
        state.geneoBoardSearch
            .trim();

    const context =
        geneographLibraryContext();

    const message =
        query
            ? 'No boards match this search.'
            : context.emptyMessage;

    return `
        <div class="panel">
          <div
            class="
              panel-body
              geneo-board-empty
            ">

            ${escapeHtml(
                message
            )}
          </div>
        </div>
      `;
}

function renderGeneographBoardCollection(
    list
)
{
    const viewClass =
        state.geneoBoardViewMode
          === 'list'
            ? 'geneo-board-list'
            : 'geneo-board-grid';

    const showNewBoardTile =
        !state.geneoBoardSearch
            .trim()
        && [
            'all',
            'collection',
            'unassigned'
        ].includes(
            state.geneoLibraryView
        );

    if (
        !list.length
        && !showNewBoardTile
    )
    {
        return renderGeneographBoardEmptyState();
    }

    return `
        <div
          class="${viewClass}">

          ${list
                .map(
                    renderGeneographBoardCard
                )
                .join('')}

          ${
                showNewBoardTile
                    ? renderGeneographNewBoardTile()
                    : ''
            }
        </div>
      `;
}

function renderGeneographBoardCollectionChips(
    board,
    limit = 2
)
{
    const collections =
        getCollectionsForBoard(
            board.id,
            {
                projectId:
              board.projectId
            }
        );

    if (!collections.length)
    {
        return `
          <div
            class="
              geneo-board-collections
            ">

            <span
              class="
                geneo-board-collection-chip
                no-collection
              "
              title="No collection assigned">

              No collection
            </span>
          </div>
        `;
    }

    const visible =
        collections.slice(
            0,
            limit
        );

    const hiddenCount =
        collections.length
        - visible.length;

    return `
        <div
          class="
            geneo-board-collections
          ">

          ${visible
                .map(collection => `
              <span
                class="
                  geneo-board-collection-chip
                "
                title="
                ${escapeHtml(
                    localizedDataFieldValue(collection.name)
                )}
                ">
                ${escapeHtml(
                    localizedDataFieldValue(collection.name)
                )}
              </span>
            `)
                .join('')}

          ${
                hiddenCount > 0
                    ? `
                <span
                  class="
                    geneo-board-collection-chip
                    count
                  "
                  title="${hiddenCount} more collections">

                  +${hiddenCount}
                </span>
              `
                    : ''
            }
        </div>
      `;
}

function renderGeneographBoardCard(
    board
)
{
    const favouriteLabel =
        board.favorite
            ? `Remove ${board.title} from favourites`
            : `Add ${board.title} to favourites`;

    return `
        <article
          class="
            geneo-board-card
          "
          data-geneo-board-id="${escapeHtml(
                board.id
            )}">

          <div
            class="
              geneo-thumb
            ">
            ${renderGeneographBoardPreview(board, state.geneoBoardViewMode === 'list' ? 'square' : 'wide')}
            <div class="geneo-board-cover-shade"></div>
            <h3 class="geneo-board-cover-title">${escapeHtml(board.title)}</h3>
          </div>

          <button class="geneo-board-open-area" type="button" data-geneo-open-board="${escapeHtml(board.id)}" aria-label="Open ${escapeHtml(board.title)}" title="${escapeHtml(board.title)}"></button>

          <button class="geneo-star ${board.favorite ? 'active' : ''}" type="button" data-geneo-fav="${escapeHtml(board.id)}" aria-label="${escapeHtml(favouriteLabel)}" aria-pressed="${board.favorite ? 'true' : 'false'}">${icon.star}</button>

          <button class="geneo-more" type="button" data-geneo-board-menu="${escapeHtml(board.id)}" aria-label="More actions for ${escapeHtml(board.title)}" aria-haspopup="menu" aria-expanded="false">${icon.more}</button>

          <div
            class="
              geneo-board-body
            ">
          <h3 title="${escapeHtml(board.title)}">
            ${escapeHtml(
                board.title
            )}
          </h3>

          ${renderGeneographBoardCollectionChips(
                board
            )}
            <div class="geneo-board-modified geneo-board-modified-list">${escapeHtml(formatProjectModified(board))}</div>
          </div>

          <div
            class="
              geneo-board-footer
            ">

            <div class="geneo-board-modified geneo-board-modified-grid" title="${escapeHtml(formatProjectModified(board))}">${escapeHtml(formatProjectModified(board))}</div>

            <button
              class="
                small-open
              "
              type="button"
              data-geneo-open-board="${escapeHtml(
                    board.id
                )}">

              Open
            </button>

          </div>
        </article>
      `;
}

function geneographCanvasCountLabel(count)
{
    if (state.language !== 'ru')
    {
        return `${count} ${count === 1 ? 'canvas' : 'canvases'}`;
    }

    const form = new Intl.PluralRules('ru').select(count);
    const noun = {
        one: 'холст',
        few: 'холста',
        many: 'холстов',
        other: 'холста'
    }[form];

    return `${count} ${noun}`;
}

function renderGeneographCollectionChoiceRows(
    projectId,
    selectedCollectionIds,
    query = ''
)
{
    const normalizedQuery =
        String(
            query || ''
        )
            .trim()
            .toLowerCase();

    const collections =
        getProjectBoardCollections(
            projectId
        )
            .filter(collection =>
            {
                if (!normalizedQuery)
                {
                    return true;
                }

                return `
              ${collection.name || ''}
              ${collection.description || ''}
              ${localizedDataFieldValue(collection.name || '')}
              ${localizedDataFieldValue(collection.description || '')}
            `
                    .toLowerCase()
                    .includes(
                        normalizedQuery
                    );
            });

    if (!collections.length)
    {
        if (normalizedQuery)
        {
            return `
            <div
              class="
                album-picker-empty
              ">

              <div
                class="
                  album-picker-empty-card
                ">

                <strong>
                  No collections match this search
                </strong>

                <p>
                  Try another collection name
                  or description.
                </p>

                <button
                  class="
                    button
                    secondary
                  "
                  type="button"
                  data-geneo-collection-clear-search>

                  Clear search
                </button>
              </div>
            </div>
          `;
        }

        return `
          <div
            class="
              album-picker-empty
            ">

            <div
              class="
                album-picker-empty-card
              ">

              <strong>
                No collections yet
              </strong>

              <p>
                Create a collection to organize
                this board.
              </p>

              <button
                class="
                  button
                  primary
                "
                type="button"
                data-geneo-inline-collection-toggle>

                Create collection
              </button>
            </div>
          </div>
        `;
    }

    return collections
        .map(collection =>
        {
            const selected =
                selectedCollectionIds.has(
                    collection.id
                );

            return `
            <label
              class="
                album-picker-result
                ${
                    selected
                        ? 'is-selected'
                        : ''
                }
              "
              data-geneo-collection-row="${escapeHtml(
                    collection.id
                )}">

              <span
                class="
                  album-picker-copy
                ">

                <strong>
                  ${escapeHtml(
                        localizedDataFieldValue(collection.name)
                    || translateText('Untitled collection')
                    )}
                </strong>

                <span
                  class="
                    album-picker-description
                  ">
                  ${escapeHtml(
                        localizedDataFieldValue(collection.description)
                    || translateText('No description')
                    )}
                </span>

              </span>

              <input
                type="checkbox"
                value="${escapeHtml(
                    collection.id
                )}"
                data-geneo-collection-choice
                ${
                    selected
                        ? 'checked'
                        : ''
                }
                aria-label="${escapeHtml(
                    `${
                        selected
                            ? 'Remove'
                            : 'Add'
                    } ${
                        collection.name
                    }`
                )}">
            </label>
          `;
        })
        .join('');
}

function renderGeneographCollectionChooser({
    projectId =
        currentProjectId(),

    selectedCollectionIds =
        new Set()
} = {})
{
    return `
        <section
          class="
            geneo-collection-chooser
          "
          aria-labelledby="geneoCollectionChooserLabel">

          <div
            class="
              geneo-collection-chooser-head
            ">

            <h3
              id="geneoCollectionChooserLabel">

              Collections
            </h3>
          </div>

          <div
            class="
              album-picker-browse
              geneo-collection-browse
            "
            data-geneo-collection-browse>

            <div class="geneo-collection-search-row">
            <div
              class="
                field
                photo-people-search-field
                album-picker-search
              ">

              <div
                class="
                  search-input
                ">

                ${icon.search}

                <input
                  id="geneoCollectionSearch"
                  type="search"
                  data-geneo-collection-search
                  aria-label="Search collections"
                  placeholder="Search collections"
                  autocomplete="off">
              </div>
            </div>

            <button
              class="button secondary compact geneo-collection-new-button"
              type="button"
              data-geneo-inline-collection-toggle
              aria-label="New collection"
              title="New collection">
              ${icon.plus}<span>New collection</span>
            </button>
            </div>

            <section
              class="
                album-picker-results-panel
              ">

              <span class="geneo-collection-status" data-geneo-collection-results-meta role="status" aria-live="polite"></span>

              <div
                class="
                  photo-people-results
                  album-picker-results
                  geneo-collection-results
                "
                data-geneo-collection-choice-list>

                ${renderGeneographCollectionChoiceRows(
                    projectId,
                    selectedCollectionIds
                )}
              </div>
            </section>
          </div>

          <div
            class="
              album-picker-create
              geneo-collection-create-panel
            "
            data-geneo-inline-collection-panel
            hidden>

            <div
              class="
                album-picker-create-copy
              ">

              <strong>
                Create a new collection
              </strong>

              <span>
                Creates the collection immediately and selects it for this board. Canceling the board form will not delete it.
              </span>
            </div>

            <div
              class="
                album-picker-create-fields
              ">

              <div class="field">
                <label
                  for="geneoInlineCollectionName">

                  Collection name
                </label>

                <input
                  id="geneoInlineCollectionName"
                  type="text"
                  maxlength="120"
                  data-geneo-inline-collection-name
                  autocomplete="off"
                  placeholder="e.g. Pawford research">
              </div>

              <div class="field">
                <label
                  for="geneoInlineCollectionDescription">

                  Description
                </label>

                <textarea
                  id="geneoInlineCollectionDescription"
                  rows="3"
                  maxlength="500"
                  data-geneo-inline-collection-description
                  placeholder="Optional description"></textarea>
              </div>
            </div>

            <div
              class="
                geneo-inline-collection-actions
              ">

              <button
                class="
                  button
                  secondary
                "
                type="button"
                data-geneo-inline-collection-cancel>

                Back
              </button>

              <button
                class="
                  button
                  primary
                "
                type="button"
                data-geneo-inline-collection-create>

                Create and select
              </button>
            </div>
          </div>
        </section>
      `;
}

function bindGeneographCollectionChooser(
    root,
    {
        projectId =
            currentProjectId(),

        selectedCollectionIds
    }
)
{
    if (
        !root
        || !selectedCollectionIds
    )
    {
        return;
    }

    let query =
        '';

    const browsePanel =
        root.querySelector(
            '[data-geneo-collection-browse]'
        );

    const createPanel =
        root.querySelector(
            '[data-geneo-inline-collection-panel]'
        );

    const resultsHost =
        root.querySelector(
            '[data-geneo-collection-choice-list]'
        );

    const resultsMeta =
        root.querySelector(
            '[data-geneo-collection-results-meta]'
        );

    const searchInput =
        root.querySelector(
            '[data-geneo-collection-search]'
        );

    const nameInput =
        root.querySelector(
            '[data-geneo-inline-collection-name]'
        );

    const descriptionInput =
        root.querySelector(
            '[data-geneo-inline-collection-description]'
        );

    const visibleCollections =
        () =>
        {
            const normalizedQuery =
                query
                    .trim()
                    .toLowerCase();

            return getProjectBoardCollections(
                projectId
            ).filter(collection =>
            {
                if (!normalizedQuery)
                {
                    return true;
                }

                return `
              ${collection.name || ''}
              ${collection.description || ''}
              ${localizedDataFieldValue(collection.name || '')}
              ${localizedDataFieldValue(collection.description || '')}
            `
                    .toLowerCase()
                    .includes(
                        normalizedQuery
                    );
            });
        };

    const updateResultsMeta = () =>
    {
        const count = visibleCollections().length;
        const selected = selectedCollectionIds.size;

        if (resultsMeta)
        {
            resultsMeta.textContent = state.language === 'ru'
                ? `Коллекций: ${count} · Выбрано: ${selected}`
                : `${count} ${
                    count === 1 ? 'collection' : 'collections'
                } · ${selected} selected`;
        }
    };

    const renderResults =
        () =>
        {
            if (!resultsHost)
            {
                return;
            }

            resultsHost.innerHTML =
                renderGeneographCollectionChoiceRows(
                    projectId,
                    selectedCollectionIds,
                    query
                );

            localizeUI(resultsHost);
            updateResultsMeta();
        };

    const showBrowse =
        () =>
        {
            if (browsePanel)
            {
                browsePanel.hidden =
                    false;
            }

            if (createPanel)
            {
                createPanel.hidden =
                    true;
            }
        };

    const showCreate =
        () =>
        {
            if (browsePanel)
            {
                browsePanel.hidden =
                    true;
            }

            if (createPanel)
            {
                createPanel.hidden =
                    false;
            }

            requestAnimationFrame(
                () =>
                    nameInput?.focus()
            );
        };

    searchInput
        ?.addEventListener(
            'input',
            event =>
            {
                query =
                    event.currentTarget
                        .value;

                renderResults();
            }
        );

    root.addEventListener(
        'change',
        event =>
        {
            const checkbox =
                event.target.closest(
                    '[data-geneo-collection-choice]'
                );

            if (!checkbox)
            {
                return;
            }

            const collectionId =
                checkbox.value;

            if (checkbox.checked)
            {
                selectedCollectionIds.add(
                    collectionId
                );
            }
            else
            {
                selectedCollectionIds.delete(
                    collectionId
                );
            }

            checkbox
                .closest(
                    '[data-geneo-collection-row]'
                )
                ?.classList.toggle(
                    'is-selected',
                    checkbox.checked
                );

            updateResultsMeta();
        }
    );

    root.addEventListener(
        'click',
        event =>
        {
            if (
                event.target.closest(
                    '[data-geneo-inline-collection-toggle]'
                )
            )
            {
                event.preventDefault();

                showCreate();

                return;
            }

            if (
                event.target.closest(
                    '[data-geneo-inline-collection-cancel]'
                )
            )
            {
                event.preventDefault();

                showBrowse();

                searchInput?.focus();

                return;
            }

            if (
                event.target.closest(
                    '[data-geneo-collection-clear-search]'
                )
            )
            {
                event.preventDefault();

                query =
                    '';

                if (searchInput)
                {
                    searchInput.value =
                        '';
                }

                renderResults();

                searchInput?.focus();

                return;
            }

            if (
                !event.target.closest(
                    '[data-geneo-inline-collection-create]'
                )
            )
            {
                return;
            }

            event.preventDefault();

            const name =
                nameInput
                    ?.value
                    .trim()
            || '';

            const description =
                descriptionInput
                    ?.value
                    .trim()
            || '';

            if (!name)
            {
                nameInput?.focus();

                showToast(
                    'Enter a collection name.'
                );

                return;
            }

            const collection =
                createGeneographCollection({
                    name,
                    description,
                    projectId
                });

            if (!collection)
            {
                return;
            }

            selectedCollectionIds.add(
                collection.id
            );

            if (nameInput)
            {
                nameInput.value =
                    '';
            }

            if (descriptionInput)
            {
                descriptionInput.value =
                    '';
            }

            query =
                '';

            if (searchInput)
            {
                searchInput.value =
                    '';
            }

            showBrowse();

            renderResults();

            requestAnimationFrame(
                () =>
                {
                    root
                        .querySelector(
                            `[data-geneo-collection-row="${
                                CSS.escape(
                                    collection.id
                                )
                            }"]`
                        )
                        ?.scrollIntoView({
                            block:
                    'nearest'
                        });
                }
            );

            showToast(
                'Collection created.'
            );
        }
    );

    renderResults();
}

function renderGeneographCollectionModal({
    titleId,
    title,
    intro,
    formId,
    nameId,
    descriptionId,
    name = '',
    description = '',
    submitLabel
})
{
    return `
        <div
          class="
            modal
            geneo-collection-modal
          "
          role="dialog"
          aria-modal="true"
          aria-labelledby="${escapeHtml(
                titleId
            )}">

          <div class="modal-header">
            <div>
              <h2
                id="${escapeHtml(
                    titleId
                )}">

                ${escapeHtml(
                    title
                )}
              </h2>

              <p>
                ${escapeHtml(
                    intro
                )}
              </p>
            </div>

            <button
              class="
                close-button
              "
              type="button"
              data-close
              aria-label="Close">

              ${icon.close}
            </button>
          </div>

          <form
            class="
              geneo-collection-form
            "
            id="${escapeHtml(
                formId
            )}">

            <div
              class="
                modal-body
                form-grid
              ">

              <div class="field">
                <label
                  for="${escapeHtml(
                        nameId
                    )}">

                  Collection name
                </label>

                <input
                  id="${escapeHtml(
                        nameId
                    )}"
                  type="text"
                  required
                  maxlength="120"
                  autocomplete="off"
                  value="${escapeHtml(
                        name
                    )}"
                  placeholder="e.g. Pawford research">
              </div>

              <div class="field">
                <label
                  for="${escapeHtml(
                        descriptionId
                    )}">

                  Description
                </label>

                <textarea
                  id="${escapeHtml(
                        descriptionId
                    )}"
                  rows="4"
                  maxlength="500"
                  placeholder="Optional description">${escapeHtml(
                        description
                    )}</textarea>
              </div>
            </div>

            <div class="modal-footer">
              <button
                class="
                  button
                  secondary
                "
                type="button"
                data-close>

                Cancel
              </button>

              <button
                class="
                  button
                  primary
                "
                type="submit">

                ${escapeHtml(
                    submitLabel
                )}
              </button>
            </div>
          </form>
        </div>
      `;
}

function openNewGeneographCollectionModal()
{
    openModal(
        renderGeneographCollectionModal({
            titleId:
            'newGeneographCollectionTitle',

            title:
            'Create collection',

            intro:
            'Collections keep related boards together.',

            formId:
            'geneographCollectionForm',

            nameId:
            'geneographCollectionName',

            descriptionId:
            'geneographCollectionDescription',

            submitLabel:
            'Create collection'
        })
    );

    const form =
        modalBackdrop.querySelector(
            '#geneographCollectionForm'
        );

    const nameInput =
        modalBackdrop.querySelector(
            '#geneographCollectionName'
        );

    const descriptionInput =
        modalBackdrop.querySelector(
            '#geneographCollectionDescription'
        );

    form?.addEventListener(
        'submit',
        event =>
        {
            event.preventDefault();

            const name =
                nameInput
                    ?.value
                    .trim()
            || '';

            const description =
                descriptionInput
                    ?.value
                    .trim()
            || '';

            if (!name)
            {
                nameInput?.focus();

                showToast(
                    'Enter a collection name.'
                );

                return;
            }

            const collection =
                createGeneographCollection({
                    name,
                    description
                });

            if (!collection)
            {
                return;
            }

            state.geneoLibraryView =
                'collection';

            state.geneoActiveCollectionId =
                collection.id;

            closeModal();

            renderGeneographHome();

            showToast(
                'Collection created.'
            );
        }
    );

    requestAnimationFrame(
        () =>
            nameInput?.focus()
    );
}

function openEditGeneographCollectionModal(
    collectionId
)
{
    const collection =
        getBoardCollection(
            collectionId
        );

    if (!collection)
    {
        return;
    }

    openModal(
        renderGeneographCollectionModal({
            titleId:
            'editGeneographCollectionTitle',

            title:
            'Edit collection',

            intro:
            'Update the collection name and description. Boards stay in this collection.',

            formId:
            'geneographEditCollectionForm',

            nameId:
            'geneographEditCollectionName',

            descriptionId:
            'geneographEditCollectionDescription',

            name:
            collection.name,

            description:
            collection.description,

            submitLabel:
            'Save changes'
        })
    );

    const form =
        modalBackdrop.querySelector(
            '#geneographEditCollectionForm'
        );

    const nameInput =
        modalBackdrop.querySelector(
            '#geneographEditCollectionName'
        );

    const descriptionInput =
        modalBackdrop.querySelector(
            '#geneographEditCollectionDescription'
        );

    form?.addEventListener(
        'submit',
        event =>
        {
            event.preventDefault();

            const name =
                nameInput
                    ?.value
                    .trim()
            || '';

            if (!name)
            {
                nameInput?.focus();

                showToast(
                    'Enter a collection name.'
                );

                return;
            }

            collection.name =
                name;

            collection.description =
                descriptionInput
                    ?.value
                    .trim()
            || '';

            closeModal();

            renderGeneographHome();

            showToast(
                'Collection updated.'
            );
        }
    );

    requestAnimationFrame(
        () =>
        {
            nameInput?.focus();
            nameInput?.select();
        }
    );
}

function openDeleteGeneographCollectionModal(
    collectionId
)
{
    const collection =
        getBoardCollection(
            collectionId
        );

    if (!collection)
    {
        return;
    }

    const affectedBoards =
        getBoardsForCollection(
            collection.id,
            {
                projectId:
              collection.projectId,

                includeArchived:
              true
            }
        );
    const ru = state.language === 'ru';

    const title = ru
        ? 'Удалить коллекцию?'
        : 'Delete collection?';

    const description = ru
        ? 'Коллекция будет удалена. Холсты и их связи с другими коллекциями сохранятся.'
        : 'The collection will be deleted. Its canvases and their links to other collections will remain.';

    const impact = ru
        ? 'Будет удалена только связь с этой коллекцией. Данные холстов сохранятся.'
        : 'Only membership in this collection will be removed. Canvas data will remain unchanged.';

    const collectionLabel =
        localizedDataFieldValue(collection.name)
        || (ru ? 'Коллекция без названия' : 'Untitled collection');

    openModal(`
        <div
          class="modal"
          data-i18n-skip
          role="dialog"
          aria-modal="true"
          aria-labelledby="deleteGeneographCollectionTitle">

          <div class="modal-header">
            <div>
              <h2 id="deleteGeneographCollectionTitle">
                ${escapeHtml(title)}
              </h2>
              <p>${escapeHtml(description)}</p>
            </div>

            <button
              class="close-button"
              type="button"
              data-close
              aria-label="${ru ? 'Закрыть' : 'Close'}">
              ${icon.close}
            </button>
          </div>

          <div class="modal-body">
            <div class="notes-evidence-card">
              <strong>${escapeHtml(collectionLabel)}</strong>
              <p>
                ${escapeHtml(
                    geneographCanvasCountLabel(affectedBoards.length)
                )}
              </p>
              <p>${escapeHtml(impact)}</p>
            </div>
          </div>

          <div class="modal-footer">
            <button class="button secondary" type="button" data-close>
              ${ru ? 'Отмена' : 'Cancel'}
            </button>

            <button
              class="button danger"
              type="button"
              id="geneographConfirmDeleteCollection">
              ${ru ? 'Удалить коллекцию' : 'Delete collection'}
            </button>
          </div>
        </div>
      `);

    modalBackdrop
        .querySelector(
            '#geneographConfirmDeleteCollection'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                affectedBoards.forEach(
                    board =>
                    {
                        removeBoardFromCollection(
                            board.id,
                            collection.id,
                            {
                                projectId:
                      collection.projectId,

                                touchModified:
                      false
                            }
                        );
                    }
                );

                const index =
                    sampleData
                        .boardCollections
                        .findIndex(item =>
                            item.id
                    === collection.id
                        );

                if (index >= 0)
                {
                    sampleData
                        .boardCollections
                        .splice(
                            index,
                            1
                        );
                }

                if (
                    state.geneoActiveCollectionId
                === collection.id
                )
                {
                    state.geneoLibraryView =
                        'all';

                    state.geneoActiveCollectionId =
                        null;
                }

                closeModal();

                renderGeneographHome();

                showToast(
                    'Collection deleted. Boards kept.'
                );
            }
        );
}

function openGeneographCollectionMenu(
    collectionId,
    anchor
)
{
    closeMenu();

    const collection =
        getBoardCollection(
            collectionId
        );

    if (
        !collection
        || !anchor
    )
    {
        return;
    }

    const rect =
        anchor
            .getBoundingClientRect();

    const menu =
        document
            .createElement(
                'div'
            );

    menu.className =
        'menu-popover';

    menu.id =
        'projectMenu';

    menu.style.top =
        `${rect.bottom + 6}px`;

    menu.style.left =
        `${
            Math.max(
                12,
                rect.right - 200
            )
        }px`;

    menu.innerHTML = `
        <button
          type="button"
          data-action="edit">

          Edit collection
        </button>

        <button
          type="button"
          data-action="delete"
          class="danger">

          Delete collection
        </button>
      `;

    document.body.appendChild(
        menu
    );

    menu.addEventListener(
        'click',
        event =>
        {
            const action =
                event.target
                    .closest(
                        '[data-action]'
                    )
                    ?.dataset.action;

            if (!action)
            {
                return;
            }

            closeMenu();

            if (
                action === 'edit'
            )
            {
                openEditGeneographCollectionModal(
                    collection.id
                );

                return;
            }

            if (
                action === 'delete'
            )
            {
                openDeleteGeneographCollectionModal(
                    collection.id
                );
            }
        }
    );

    bindMenuLifecycle(
        anchor
    );
}

function bindGeneographHome()
{
    main.querySelectorAll('[data-geneo-import]').forEach(button =>
        button.addEventListener('click', () => main.querySelector('[data-geneo-import-file]')?.click()));
    main.querySelector('[data-geneo-import-file]')?.addEventListener('change', event =>
    {
        const file = event.currentTarget.files?.[0];
        event.currentTarget.value = '';
        if (file) importGeneographBoardFile(file);
    });
    const importTile = main.querySelector('[data-geneo-create-tile]');
    if (importTile)
    {
        ['dragenter', 'dragover'].forEach(type => importTile.addEventListener(type, event =>
        {
            if (!Array.from(event.dataTransfer?.types || []).includes('Files')) return;
            event.preventDefault();
            event.stopPropagation();
            event.dataTransfer.dropEffect = 'copy';
            importTile.classList.add('is-dragging');
        }));
        importTile.addEventListener('dragleave', event =>
        {
            if (!importTile.contains(event.relatedTarget)) importTile.classList.remove('is-dragging');
        });
        importTile.addEventListener('drop', event =>
        {
            event.preventDefault();
            event.stopPropagation();
            importTile.classList.remove('is-dragging');
            const file = event.dataTransfer?.files?.[0];
            if (file) importGeneographBoardFile(file);
        });
        importTile.addEventListener('dragend', () => importTile.classList.remove('is-dragging'));
    }
    main
        .querySelectorAll(
            '[data-geneo-create]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                openCreateGeneographBoardModal
            );
        });

    sidebar
        .querySelectorAll(
            '[data-geneo-library-view]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () =>
                {
                    state.geneoLibraryView =
                        button.dataset
                            .geneoLibraryView;

                    state.geneoActiveCollectionId =
                        null;

                    renderGeneographHome();
                }
            );
        });

    sidebar
        .querySelectorAll(
            '[data-geneo-collection]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () =>
                {
                    state.geneoLibraryView =
                        'collection';

                    state.geneoActiveCollectionId =
                        button.dataset
                            .geneoCollection;

                    renderGeneographHome();
                }
            );
        });

    sidebar
        .querySelector(
            '[data-geneo-add-collection]'
        )
        ?.addEventListener(
            'click',
            openNewGeneographCollectionModal
        );

    sidebar
        .querySelectorAll(
            '[data-geneo-collection-menu]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                event =>
                {
                    event.stopPropagation();

                    openGeneographCollectionMenu(
                        button.dataset
                            .geneoCollectionMenu,
                        button
                    );
                }
            );
        });

    main.querySelector('[data-geneo-mobile-search]')?.addEventListener('click', () =>
    {
        geneoMobileBoardSearchOpen = true;
        main.querySelector('.geneo-board-toolbar')?.classList.add('mobile-search-open');
        main.querySelector('#geneoBoardSearch')?.focus();
    });
    main.querySelector('[data-geneo-mobile-search-close]')?.addEventListener('click', () =>
    {
        geneoMobileBoardSearchOpen = false;
        main.querySelector('.geneo-board-toolbar')?.classList.remove('mobile-search-open');
        main.querySelector('[data-geneo-mobile-search]')?.focus();
    });
    bindSearchInput(
        main,
        '#geneoBoardSearch',
        'geneoBoardSearch',
        renderGeneographHome
    );
    bindAppSortControl(main, {
        id: 'geneoBoardSort',
        options:
          APP_SORT_OPTIONS.geneograph,
        getField: () =>
            state.geneoBoardSort,
        getDirection: () =>
            state.geneoBoardSortDirection,

        onChange: ({
            field,
            direction
        }) =>
        {
            state.geneoBoardSort = field;
            state.geneoBoardSortDirection =
                direction;

            renderGeneographHome();
        }
    });
    main
        .querySelectorAll(
            '[data-geneo-board-view]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () =>
                {
                    state.geneoBoardViewMode =
                        button.dataset
                            .geneoBoardView;

                    renderGeneographHome();
                }
            );
        });

    main
        .querySelectorAll(
            '[data-geneo-open-board]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                event =>
                {
                    event.stopPropagation();

                    openGeneographBoard(
                        button.dataset
                            .geneoOpenBoard
                    );
                }
            );
        });

    main
        .querySelectorAll(
            '[data-geneo-fav]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                event =>
                {
                    event.stopPropagation();

                    const board =
                        getGeneographBoard(
                            button.dataset
                                .geneoFav
                        );

                    if (board)
                    {
                        board.favorite =
                            !board.favorite;

                        touchGeneographBoard(
                            board
                        );
                    }

                    renderGeneographHome();
                }
            );
        });

    main
        .querySelectorAll(
            '[data-geneo-board-menu]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                event =>
                {
                    event.stopPropagation();

                    openGeneographBoardMenu(
                        button.dataset
                            .geneoBoardMenu,
                        button
                    );
                }
            );
        });

    bindToasts(
        sidebar
    );
}

function openGeneographBoard(id)
{
    appNavigationMarkIntent();
    cancelGeneographPencilStroke();
    closeGeneographObjectContextMenu();
    closeMenu();
    const previousBoard = selectedGeneographBoard();
    if (previousBoard?.id !== id) geneoObjectClipboard = null;
    if (previousBoard?.id !== id)
    {
        state.geneoLayerSearch = '';
        state.geneoItemFilter = { types: [], status: 'all' };
        state.geneoItemFilterOpen = false;
    }
    if (state.geneoView === 'board' && previousBoard?.id && previousBoard.id !== id) captureGeneographViewport(previousBoard.id);
    const savedViewport = geneoSavedViewport(id);
    state.selectedGeneoBoardId = id;
    state.geneoView = 'board';
    state.selectedGeneoNodeId = null;
    state.selectedGeneoNodeIds = [];
    state.selectedGeneoConnectionId = null;
    state.selectedGeneoConnectionIds = [];
    state.selectedGeneoWaypointIndex = null;
    cancelGeneographConnectionDraft();
    state.geneoTool = 'pan';
    state.geneoZoom = savedViewport?.zoom || 83;
    if (!savedViewport && window.innerWidth <= 900)
        state.geneoZoom = window.innerWidth <= 350 ? 42 : 50;
    state.geneoInlineEditNodeId = null;
    state.geneoLayerRename = null;
    geneoCanvasRuntime = createGeneoCanvasRuntime(id);
    if (!savedViewport && window.innerWidth <= 900)
    {
        const nodes = selectedGeneographDiagram()?.nodes || [];
        const panel = nodes.find(node => node.id === 'gn-panel') || nodes.find(node => node.type === 'panel');
        const household = panel ? nodes.filter(node => node.parentPanelId === panel.id) : [];
        const focus = household.length ? household : panel ? [panel] : [];
        geneoCanvasRuntime.initialMobileCenter = focus.length
            ? {
                x: (Math.min(...focus.map(node => node.x)) + Math.max(...focus.map(node => node.x + node.width))) / 2,
                y: (Math.min(...focus.map(node => node.y)) + Math.max(...focus.map(node => node.y + node.height))) / 2
            }
            : geneoContentCenter();
    }
    geneoHistoryRuntime = {
        boardId: id,
        undo: [],
        redo: []
    };
    render();
}

function deleteGeneographBoard(
    boardId,
    projectId = currentProjectId()
)
{
    // Recheck the project and record when confirmation is submitted.
    if (projectId !== currentProjectId()) return false;

    const board = getGeneographBoard(boardId, { projectId });
    if (!board) return false;

    const index = sampleData.boards.findIndex(item =>
        item.id === boardId && item.projectId === projectId
    );

    if (index < 0) return false;

    invalidateGeneographBoardPreview(boardId);

    const ownsEditorState =
        state.selectedGeneoBoardId === boardId
        || geneoCanvasRuntime.boardId === boardId;

    if (ownsEditorState)
    {
        geneoObjectClipboard = null;
        // Cancel pending editor interactions before removing the canvas.
        cancelGeneographPencilStroke();
        cancelGeneographConnectionDraft();
        geneoPointerState = null;

        state.selectedGeneoBoardId = null;
        state.selectedGeneoNodeId = null;
        state.selectedGeneoNodeIds = [];
        state.selectedGeneoConnectionId = null;
        state.selectedGeneoConnectionIds = [];
        state.selectedGeneoWaypointIndex = null;
        state.geneoInlineEditNodeId = null;
        state.geneoLayerRename = null;
        state.geneoTool = 'pan';

        geneoCanvasRuntime = createGeneoCanvasRuntime(null);
        geneoPaintRuntime = createGeneoPaintRuntime();
    }

    if (
        ownsEditorState
        || geneoHistoryRuntime.boardId === boardId
    )
    {
        geneoHistoryRuntime = {
            boardId: null,
            undo: [],
            redo: []
        };
    }

    clearGeneographViewport(boardId);

    // Remove the canvas container, not the records it references.
    sampleData.boards.splice(index, 1);

    return true;
}

function openDeleteGeneographBoardConfirm(boardId)
{
    const projectId = currentProjectId();
    const board = getGeneographBoard(boardId, { projectId });

    if (!board) return;

    const ru = state.language === 'ru';

    const title = ru
        ? 'Удалить холст?'
        : 'Delete canvas?';

    const boardTitle =
        localizedDataFieldValue(board.title)
        || (ru ? 'Холст без названия' : 'Untitled canvas');

    const explanation = ru
        ? 'Холст, его расположение объектов и содержимое, созданное только на этом холсте, будут удалены. Связанные записи проекта и другие холсты сохранятся.'
        : 'This canvas, its object layout, and content created only on this canvas will be deleted. Linked project records and other canvases will remain.';

    const warning = ru
        ? 'Это действие невозможно отменить.'
        : 'This action cannot be undone.';

    openModal(`
        <div
          class="modal"
          data-i18n-skip
          role="dialog"
          aria-modal="true"
          aria-labelledby="deleteGeneographBoardTitle">

          <div class="modal-header">
            <div>
              <h2 id="deleteGeneographBoardTitle">
                ${escapeHtml(title)}
              </h2>
              <p>${escapeHtml(boardTitle)}</p>
            </div>

            <button
              class="close-button"
              type="button"
              data-close
              aria-label="${ru ? 'Закрыть' : 'Close'}">
              ${icon.close}
            </button>
          </div>

          <div class="modal-body">
            <p>${escapeHtml(explanation)}</p>
            <p><strong>${escapeHtml(warning)}</strong></p>
          </div>

          <div class="modal-footer">
            <button
              class="button secondary"
              type="button"
              data-close>
              ${ru ? 'Отмена' : 'Cancel'}
            </button>

            <button
              class="button danger"
              type="button"
              data-confirm-geneo-board-delete>
              ${ru ? 'Удалить холст' : 'Delete canvas'}
            </button>
          </div>
        </div>
      `);

    modalBackdrop
        .querySelector('[data-confirm-geneo-board-delete]')
        ?.addEventListener('click', event =>
        {
            const button = event.currentTarget;
            button.disabled = true;

            const deleted = deleteGeneographBoard(
                boardId,
                projectId
            );

            closeModal();

            if (!deleted)
            {
                showToast(
                    ru
                        ? 'Холст недоступен. Обновите список и повторите попытку.'
                        : 'The canvas is unavailable. Refresh the list and try again.'
                );
                return;
            }

            // Keep the current collection/filter context.
            // Empty collections remain available.
            state.geneoView = 'home';
            renderGeneographHome();

            showToast(
                ru ? 'Холст удалён.' : 'Canvas deleted.'
            );
        }, { once: true });
}

function openGeneographBoardMenu(
    id,
    anchor
)
{
    closeMenu();

    const board =
        getGeneographBoard(
            id
        );

    if (
        !board
        || !anchor
    )
    {
        return;
    }

    const rect =
        anchor
            .getBoundingClientRect();

    const menu =
        document
            .createElement(
                'div'
            );

    menu.className =
        'menu-popover';

    menu.id =
        'projectMenu';

    menu.style.top =
        `${rect.bottom + 6}px`;

    menu.style.left =
        `${
            Math.max(
                12,
                rect.right - 190
            )
        }px`;

    menu.innerHTML = `
        <button
          type="button"
          data-action="edit">

          Edit
        </button>

        <button
          type="button"
          data-action="duplicate">

          Duplicate
        </button>

        <button
          type="button"
          data-action="archive">

          ${
                board.archived
                    ? 'Unarchive'
                    : 'Archive'
            }
        </button>

        <button
          type="button"
          class="danger"
          data-action="delete">

          Delete
        </button>
      `;

    document.body.appendChild(
        menu
    );

    menu.addEventListener(
        'click',
        event =>
        {
            const action =
                event.target
                    .closest(
                        '[data-action]'
                    )
                    ?.dataset.action;

            if (!action)
            {
                return;
            }

            closeMenu();

            if (
                action === 'edit'
            )
            {
                openEditGeneographBoardModal(
                    board.id
                );

                return;
            }

            if (
                action === 'archive'
            )
            {
                const nextArchived =
                    !board.archived;

                const updatedBoard =
                    setGeneographBoardArchived(
                        board.id,
                        nextArchived,
                        {
                            projectId:
                    board.projectId
                        }
                    );

                if (!updatedBoard)
                {
                    return;
                }

                state.geneoLibraryView =
                    nextArchived
                        ? 'archived'
                        : 'all';

                state.geneoActiveCollectionId =
                    null;

                renderGeneographHome();

                showToast(
                    nextArchived
                        ? 'Board archived.'
                        : 'Board unarchived.'
                );

                return;
            }
            if (action === 'delete')
            {
                openDeleteGeneographBoardConfirm(board.id);
                return;
            }
            showToast(
                `${
                    capitalize(
                        action
                    )
                } board action simulated.`
            );
        }
    );

    bindMenuLifecycle(
        anchor
    );
}

function renderGeneoModeTool(
    type,
    iconSvg,
    label
)
{
    const active =
        state.geneoTool === type;

    const localizedLabel =
        t(label);

    return `
        <button
          class="geneo-tool ${
                active
                    ? 'active'
                    : ''
            }"
          type="button"
          data-geneo-tool="${escapeHtml(type)}"
          aria-pressed="${
                active
                    ? 'true'
                    : 'false'
            }"
          aria-label="${escapeHtml(localizedLabel)}"
          title="${escapeHtml(localizedLabel)}">

          <span aria-hidden="true">
            ${iconSvg}
          </span>

          <span class="geneo-tool-label">
            ${escapeHtml(localizedLabel)}
          </span>
        </button>
      `;
}

function activateGeneographConnectionTool()
{
    cancelGeneographPencilStroke();
    cancelGeneographConnectionDraft();

    state.geneoPlacementReturnTool =
        null;

    state.geneoTool =
        'connect';

    geneoConnectionToolStyle();
    geneoConnectionToolRuntime.purpose = 'automatic';
    geneoConnectionToolRuntime.offerVisual = false;
    geneoConnectionToolRuntime.panelOpen = true;

    renderGeneographEditorPreserveScroll();
}

function exportGeneographBoard(anchor = null)
{
    openGeneographExportMenu(anchor || main.querySelector('[data-geneo-export]')
        || main.querySelector('[data-geneo-toolbar-overflow]'));
}

function renderGeneoToolbarObjectButton(
    type,
    iconSvg,
    label
)
{
    const isPlacementTool =
        [
            'panel',
            'sticky',
            'text'
        ].includes(type);

    const active =
        isPlacementTool
        && state.geneoTool === type;

    const actionAttribute =
        isPlacementTool
            ? `data-geneo-placement-tool="${
                escapeHtml(type)
            }"`
            : `data-geneo-add="${
                escapeHtml(type)
            }"`;

    const actionLabel =
        type === 'panel'
            ? `Draw ${label}`
            : isPlacementTool
                ? `Place ${label}`
                : `Add ${label}`;

    const localizedActionLabel =
        translateText(actionLabel);

    return `
        <button
          class="geneo-toolbar-object ${
                active
                    ? 'active'
                    : ''
            }"
          type="button"
          data-geneo-toolbar-item="${
                escapeHtml(type)
            }"
          ${actionAttribute}
          ${
                isPlacementTool
                    ? `aria-pressed="${
                        active
                            ? 'true'
                            : 'false'
                    }"`
                    : ''
            }
          title="${
                escapeHtml(localizedActionLabel)
            }"
          aria-label="${
                escapeHtml(localizedActionLabel)
            }">

          <span aria-hidden="true">
            ${iconSvg}
          </span>

          <span class="geneo-toolbar-label">
            ${escapeHtml(t(label))}
          </span>
        </button>
      `;
}

function geneoToolbarPersonGender()
{
    return ['male', 'female', 'unknown'].includes(state.geneoPersonGender)
        ? state.geneoPersonGender
        : 'male';
}

function closeGeneoOpenMenuOnTrigger(anchor)
{
    if (anchor.getAttribute('aria-expanded') !== 'true' || !document.getElementById('projectMenu')) return false;
    closeMenu();
    if (!lastInteractionWasKeyboard) anchor.blur();
    return true;
}

function restoreGeneoMenuFocusAfterEscape(anchor)
{
    if (anchor.closest('.tool-split'))
    {
        suppressSplitFocusAfterEscape(anchor);
    }
    else anchor.focus({ preventScroll: true });
}

function renderGeneoPersonSplitTool()
{
    const gender = geneoToolbarPersonGender();
    const actionLabel = `${t('Add person')}: ${t(capitalize(gender))}`;

    return `
        <div class="tool-split" data-tool-split="person" data-geneo-toolbar-item="person">
          <button class="tool-split-main" type="button" data-geneo-person-main
            aria-label="${escapeHtml(actionLabel)}" title="${escapeHtml(actionLabel)}">
            ${icon.profile}
            <span>${escapeHtml(t('Person'))}</span>
          </button>
          <button class="tool-split-trigger" type="button" data-geneo-person-menu
            aria-label="${escapeHtml(t('Choose person gender'))}"
            title="${escapeHtml(t('Choose person gender'))}"
            aria-haspopup="menu" aria-expanded="false">
            ${icon.chevron}
          </button>
        </div>`;
}

function openGeneoPersonGenderMenu(anchor)
{
    if (!(anchor instanceof HTMLElement)) return;
    if (closeGeneoOpenMenuOnTrigger(anchor)) return;
    closeMenu();
    const rect = anchor.getBoundingClientRect();
    const menu = document.createElement('div');
    menu.className = 'menu-popover tool-options-menu';
    menu.id = 'projectMenu';
    menu.setAttribute('role', 'menu');
    menu.setAttribute('aria-label', t('Choose person gender'));
    menu.style.top = `${rect.bottom + 7}px`;
    menu.style.left = `${Math.max(12, Math.min(rect.left - 118, window.innerWidth - 210))}px`;
    menu.innerHTML = ['male', 'female', 'unknown'].map(gender => {
        return `<button type="button" role="menuitemradio" aria-checked="${geneoToolbarPersonGender() === gender}"
            data-geneo-person-gender="${gender}"><span>${escapeHtml(t(capitalize(gender)))}</span></button>`;
    }).join('');
    document.body.appendChild(menu);
    if (window.innerWidth <= 900) mountMobileChoiceSheet(menu, anchor, t('Choose person gender'));
    anchor.setAttribute('aria-expanded', 'true');
    menu.addEventListener('click', event => {
        const button = event.target.closest('[data-geneo-person-gender]');
        if (!button) return;
        state.geneoPersonGender = button.dataset.geneoPersonGender;
        closeMenu();
        addGeneographObject('person');
    });
    menu.addEventListener('keydown', event => {
        const items = [...menu.querySelectorAll('[role="menuitemradio"]')];
        const index = items.indexOf(document.activeElement);
        if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            closeMenu();
            restoreGeneoMenuFocusAfterEscape(anchor);
        } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            items[(index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]?.focus();
        } else if (event.key === 'Home' || event.key === 'End') {
            event.preventDefault();
            items[event.key === 'Home' ? 0 : items.length - 1]?.focus();
        }
    });
    bindMenuLifecycle(anchor);
    requestAnimationFrame(() => menu.querySelector('[aria-checked="true"]')?.focus({ preventScroll: true }));
}

function renderGeneoConnectionLineSample(pattern, color = 'currentColor')
{
    const dash = geneoConnectionDashArray(pattern, 2);
    return `<svg class="geneo-line-sample" viewBox="0 0 88 16" aria-hidden="true"><line x1="3" y1="8" x2="85" y2="8" stroke="${escapeHtml(color)}" stroke-width="2" stroke-linecap="round" ${dash ? `stroke-dasharray="${dash}"` : ''}></line></svg>`;
}

function renderGeneoConnectionStyleFields(style, scope)
{
    const prefix = scope === 'default' ? 'geneo-connection-default' : 'geneo-connection-tool';
    return `<div class="geneo-connection-style-fields" data-geneo-connection-fields="${scope}">
      <div class="geneo-field"><span class="geneo-setting-label">${escapeHtml(t('Pattern'))}</span><button type="button" class="geneo-connection-default-pattern" data-${prefix}-pattern aria-label="${escapeHtml(`${t('Pattern')}: ${t(GENEO_CONNECTION_PATTERN_LABELS[style.pattern])}`)}" title="${escapeHtml(t(GENEO_CONNECTION_PATTERN_LABELS[style.pattern]))}" aria-haspopup="menu" aria-expanded="false">${renderGeneoConnectionLineSample(style.pattern)}${icon.chevron}</button></div>
      <label class="geneo-field"><span class="geneo-setting-label">${escapeHtml(t('Width'))}</span><span class="geneo-number-unit"><input class="geneo-input" type="number" min="1" max="12" step="1" value="${style.width}" data-${prefix}-width><span aria-hidden="true">px</span></span></label>
      ${renderGeneoPaintControl({ scope: 'connection-default', property: 'line' })}
      <fieldset class="geneo-connection-arrows"><legend class="geneo-setting-label">${escapeHtml(t('Arrowheads'))}</legend><div class="geneo-connection-arrow-options">${GENEO_CONNECTION_ARROWS.map(value => `<label><input type="radio" name="${prefix}-arrows" value="${value}" data-${prefix}-arrows ${style.arrows === value ? 'checked' : ''}><span>${escapeHtml(t(capitalize(value)))}</span></label>`).join('')}</div></fieldset>
      <div class="geneo-person-card-radius-row geneo-connection-radius-row"><label class="geneo-field" for="geneoConnectionDefaultRadius"><span class="geneo-setting-label">${escapeHtml(t('Corner radius'))}</span><span class="geneo-selection-help">0–32 px</span></label><input class="geneo-input" id="geneoConnectionDefaultRadius" type="number" min="0" max="32" step="1" value="${style.cornerRadius}" data-geneo-connection-default-radius></div>
      <label class="geneo-check geneo-connection-date-default"><input type="checkbox" data-geneo-connection-default-dates ${style.showRelationshipDates ? 'checked' : ''}><span>${escapeHtml(t('Show relationship date on board'))}</span></label>
    </div>`;
}

function renderGeneoConnectionInspectorStyleFields(connection)
{
    const style = geneoEffectiveConnectionStyle(connection);
    return `<div class="geneo-connection-style-fields" data-geneo-connection-fields="inspector">
      <div class="geneo-field"><span class="geneo-setting-label">${escapeHtml(t('Pattern'))}</span><button type="button" class="geneo-connection-default-pattern" data-geneo-connection-inspector-pattern aria-label="${escapeHtml(`${t('Pattern')}: ${t(GENEO_CONNECTION_PATTERN_LABELS[style.pattern])}`)}" title="${escapeHtml(t(GENEO_CONNECTION_PATTERN_LABELS[style.pattern]))}" aria-haspopup="menu" aria-expanded="false" ${style.line.enabled ? '' : 'disabled'}>${renderGeneoConnectionLineSample(style.pattern)}${icon.chevron}</button></div>
      <div class="geneo-field"><label class="geneo-setting-label" for="geneoConnectionStrokeWidth">${escapeHtml(t('Width'))}</label><span class="geneo-number-unit"><input class="geneo-input" id="geneoConnectionStrokeWidth" type="number" min="1" max="12" step="1" value="${style.width}" data-geneo-stroke-width="connection"><span aria-hidden="true">px</span></span></div>
      ${renderGeneoPaintControl({ scope: 'connection', id: connection.id, property: 'line' })}
      ${connection.kind === 'visual' ? `<fieldset class="geneo-connection-arrows"><legend class="geneo-setting-label">${escapeHtml(t('Arrowheads'))}</legend><div class="geneo-connection-arrow-options">${GENEO_CONNECTION_ARROWS.map(value => `<label><input type="radio" name="geneo-inspector-arrows" value="${value}" data-geneo-connection-arrows ${style.arrows === value ? 'checked' : ''}><span>${escapeHtml(t(capitalize(value)))}</span></label>`).join('')}</div></fieldset>` : ''}
      <div class="geneo-person-card-radius-row geneo-connection-radius-row"><label class="geneo-field" for="geneoConnectionRadius"><span class="geneo-setting-label">${escapeHtml(t('Corner radius'))}</span><span class="geneo-selection-help">0–32 px</span></label><input class="geneo-input" id="geneoConnectionRadius" type="number" min="0" max="32" step="1" value="${style.cornerRadius}" data-geneo-connection-radius></div>
    </div>`;
}

function renderGeneoConnectionArrowSample(arrows)
{
    const start = arrows === 'start' || arrows === 'both';
    const end = arrows === 'end' || arrows === 'both';
    return `<svg class="geneo-line-sample" viewBox="0 0 88 16" aria-hidden="true"><line x1="3" y1="8" x2="85" y2="8" stroke="currentColor" stroke-width="2"></line>${start ? '<path d="M3 8 L11 4 M3 8 L11 12" fill="none" stroke="currentColor" stroke-width="2"></path>' : ''}${end ? '<path d="M85 8 L77 4 M85 8 L77 12" fill="none" stroke="currentColor" stroke-width="2"></path>' : ''}</svg>`;
}

function renderGeneoConnectionPurposeButton()
{
    const visual = geneoConnectionToolRuntime.purpose === 'visual';
    const label = `${t('Connection type')}: ${t(visual ? 'Visual only' : 'Automatic')}`;
    const title = geneoConnectionToolRuntime.offerVisual ? `${label}. ${t('Choose Visual only to draw without a family relationship.')}` : label;
    return `<button type="button" class="geneo-connection-choice geneo-connection-purpose ${geneoConnectionToolRuntime.offerVisual ? 'needs-choice' : ''}" data-geneo-connection-purpose aria-label="${escapeHtml(label)}" title="${escapeHtml(title)}" aria-haspopup="menu" aria-expanded="false">${visual ? icon.link : icon.tree}${icon.chevron}</button>`;
}

function openGeneoConnectionPurposeMenu(anchor)
{
    if (closeGeneoOpenMenuOnTrigger(anchor)) return;
    closeMenu();
    const menu = document.createElement('div');
    menu.id = 'projectMenu';
    menu.className = 'menu-popover tool-options-menu geneo-purpose-menu';
    menu.setAttribute('role', 'menu');
    menu.setAttribute('aria-label', t('Connection type'));
    menu.innerHTML = ['automatic', 'visual'].map(value => `<button type="button" role="menuitemradio" aria-checked="${(geneoConnectionToolRuntime.purpose || 'automatic') === value}" data-purpose="${value}">${value === 'visual' ? icon.link : icon.tree}<span><strong>${escapeHtml(t(value === 'visual' ? 'Visual only' : 'Automatic'))}</strong>${value === 'automatic' ? `<small>${escapeHtml(t('Family relationships between people; visual links for other objects.'))}</small>` : ''}</span><span class="geneo-purpose-check">${(geneoConnectionToolRuntime.purpose || 'automatic') === value ? icon.check : ''}</span></button>`).join('');
    document.body.appendChild(menu);
    const rect = anchor.getBoundingClientRect();
    menu.style.left = `${Math.max(12, Math.min(rect.left, innerWidth - menu.offsetWidth - 12))}px`;
    menu.style.top = `${rect.bottom + menu.offsetHeight + 7 <= innerHeight - 12 ? rect.bottom + 7 : Math.max(12, rect.top - menu.offsetHeight - 7)}px`;
    if (innerWidth <= 900) mountMobileChoiceSheet(menu, anchor, t('Connection type'));
    anchor.setAttribute('aria-expanded', 'true');
    menu.addEventListener('click', event =>
    {
        const option = event.target.closest('[data-purpose]');
        if (!option) return;
        geneoConnectionToolRuntime.purpose = option.dataset.purpose;
        geneoConnectionToolRuntime.offerVisual = false;
        closeMenu();
        anchor.innerHTML = `${option.dataset.purpose === 'visual' ? icon.link : icon.tree}${icon.chevron}`;
        anchor.classList.remove('needs-choice');
        const label = `${t('Connection type')}: ${t(option.dataset.purpose === 'visual' ? 'Visual only' : 'Automatic')}`;
        anchor.title = label; anchor.setAttribute('aria-label', label);
        anchor.focus({ preventScroll: true });
        updateGeneographConnectionTip();
    });
    menu.addEventListener('keydown', event =>
    {
        const items = [...menu.querySelectorAll('[role="menuitemradio"]')];
        const index = items.indexOf(document.activeElement);
        if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); closeMenu(); restoreGeneoMenuFocusAfterEscape(anchor); }
        else if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key))
        {
            event.preventDefault();
            items[event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]?.focus();
        }
    });
    bindMenuLifecycle(anchor, { ignoreScrollWithin: anchor.closest('[data-geneo-connection-panel]') });
    requestAnimationFrame(() => menu.querySelector('[aria-checked="true"]')?.focus({ preventScroll: true }));
}

function renderGeneoConnectionToolPanel()
{
    if (state.geneoTool !== 'connect' || !geneoConnectionToolRuntime.panelOpen) return '';
    const style = geneoConnectionToolStyle();
    return `<section class="geneo-tool-settings geneo-connection-tool-panel" data-geneo-connection-panel role="toolbar" aria-label="${escapeHtml(t('Connection settings'))}"><div class="geneo-connection-tool-row">${renderGeneoConnectionPurposeButton()}<button type="button" class="geneo-connection-choice" data-geneo-connection-tool-pattern aria-label="${escapeHtml(`${t('Pattern')}: ${t(GENEO_CONNECTION_PATTERN_LABELS[style.pattern])}`)}" title="${escapeHtml(t(GENEO_CONNECTION_PATTERN_LABELS[style.pattern]))}" aria-haspopup="menu" aria-expanded="false">${renderGeneoConnectionLineSample(style.pattern)}${icon.chevron}</button><button type="button" class="geneo-connection-tool-swatch geneo-paint-swatch" data-geneo-connection-tool-swatch data-geneo-paint-scope="connection-tool" data-geneo-paint-id="" data-geneo-paint-property="line" data-geneo-paint-open style="${geneoPaintSwatchStyle(style.line)}" aria-label="${escapeHtml(`${t('Connection color')}: ${style.line.color}`)}" title="${escapeHtml(t('Connection color'))}" aria-haspopup="dialog" aria-expanded="false"><span></span></button><label class="geneo-connection-tool-width"><input type="number" min="1" max="12" step="1" value="${style.width}" data-geneo-connection-tool-width aria-label="${escapeHtml(`${t('Width')} (px)`)}" title="${escapeHtml(`${t('Width')} (px)`)}"><span aria-hidden="true">px</span></label><button type="button" class="geneo-connection-choice" data-geneo-connection-tool-arrows aria-label="${escapeHtml(`${t('Arrowheads')}: ${t(capitalize(style.arrows))}`)}" title="${escapeHtml(`${t('Arrowheads')}: ${t(capitalize(style.arrows))}`)}" aria-haspopup="menu" aria-expanded="false">${renderGeneoConnectionArrowSample(style.arrows)}${icon.chevron}</button><span class="geneo-connection-tool-divider" aria-hidden="true"></span><button type="button" class="geneo-connection-tool-icon" data-geneo-connection-tool-reset aria-label="${escapeHtml(t('Reset to board defaults'))}" title="${escapeHtml(t('Reset to board defaults'))}">${icon.undo}</button><button type="button" class="geneo-connection-tool-icon" data-geneo-connection-panel-close aria-label="${escapeHtml(t('Close connection settings'))}" title="${escapeHtml(t('Close connection settings'))}">${icon.close}</button></div></section>`;
}

function renderGeneoCreationToolPanel(tool)
{
    const active = tool === 'drawing' ? 'pencil' : 'shape';
    const settings = geneoCreationToolSettings(tool);
    if (state.geneoTool !== active || !settings.panelOpen) return '';
    const appearance = settings.appearance;
    const swatch = property => `<button type="button" class="geneo-connection-tool-swatch geneo-paint-swatch ${appearance[property].enabled ? '' : 'is-none'}" data-geneo-creation-swatch="${property}" data-geneo-paint-scope="creation-tool" data-geneo-paint-id="${tool}" data-geneo-paint-property="${property}" data-geneo-paint-open style="${geneoPaintSwatchStyle(appearance[property])}" aria-label="${escapeHtml(`${t(capitalize(property))}: ${appearance[property].enabled ? appearance[property].color : t('None')}`)}" title="${escapeHtml(t(capitalize(property)))}" aria-haspopup="dialog" aria-expanded="false"><span></span></button>`;
    const pattern = `<button type="button" class="geneo-connection-choice" data-geneo-creation-pattern="${tool}" aria-label="${escapeHtml(`${t('Pattern')}: ${t(GENEO_CONNECTION_PATTERN_LABELS[appearance.strokePattern])}`)}" title="${escapeHtml(t('Stroke pattern'))}" aria-haspopup="menu" aria-expanded="false">${renderGeneoConnectionLineSample(appearance.strokePattern)}${icon.chevron}</button>`;
    const width = `<label class="geneo-connection-tool-width"><input type="number" min="1" max="12" step="1" value="${appearance.strokeWidth}" data-geneo-creation-width="${tool}" aria-label="${escapeHtml(`${t('Stroke width')} (px)`)}" title="${escapeHtml(`${t('Stroke width')} (px)`)}"><span aria-hidden="true">px</span></label>`;
    const shape = tool === 'shape';
    const shapeChoice = shape ? `<button type="button" class="geneo-connection-choice geneo-creation-shape-choice" data-geneo-creation-shape-kind aria-label="${escapeHtml(`${t('Shape type')}: ${t(geneoShapeLabel(settings.shapeKind))}`)}" title="${escapeHtml(t('Shape type'))}" aria-haspopup="menu" aria-expanded="false"><span class="geneo-shape-option-preview shape-${escapeHtml(settings.shapeKind)}" aria-hidden="true"></span>${icon.chevron}</button>` : '';
    return `<section class="geneo-tool-settings geneo-connection-tool-panel geneo-creation-tool-panel" data-geneo-creation-panel="${tool}" role="toolbar" aria-label="${escapeHtml(t(shape ? 'Shape settings' : 'Drawing settings'))}"><div class="geneo-connection-tool-row">${shapeChoice}${shape ? swatch('fill') : ''}${swatch('stroke')}${width}${pattern}<span class="geneo-connection-tool-divider" aria-hidden="true"></span><button type="button" class="geneo-connection-tool-icon" data-geneo-creation-reset aria-label="${escapeHtml(t('Reset to default'))}" title="${escapeHtml(t('Reset to default'))}">${icon.undo}</button><button type="button" class="geneo-connection-tool-icon" data-geneo-creation-close aria-label="${escapeHtml(t('Close settings'))}" title="${escapeHtml(t('Close settings'))}">${icon.close}</button></div></section>`;
}

function renderGeneoConnectionSplitTool()
{
    const pattern = geneoConnectionToolStyle().pattern;
    const styleLabel = GENEO_CONNECTION_PATTERN_LABELS[pattern];

    const active =
        state.geneoTool === 'connect';

    const title =
        `${t('Connect')}: ${t(styleLabel)}`;

    return `
        <div
          class="tool-split ${
                active
                    ? 'active'
                    : ''
            }"
          data-tool-split="connection"
          data-geneo-toolbar-item="connect">

          <button
            class="tool-split-main"
            type="button"
            data-geneo-connection-main
            aria-pressed="${
                active
                    ? 'true'
                    : 'false'
            }"
            aria-label="${escapeHtml(title)}"
            title="${escapeHtml(title)}">

            ${icon.link}

            <span>
              ${escapeHtml(t('Connect'))}
            </span>
          </button>

          <button
            class="tool-split-trigger"
            type="button"
            data-geneo-connection-menu
            aria-label="${
                escapeHtml(
                    t('Choose connection style')
                )
            }"
            title="${escapeHtml(t('Choose connection style'))}"
            aria-haspopup="menu"
            aria-expanded="false">

            ${icon.chevron}
          </button>
        </div>
      `;
}

function openGeneoConnectionStyleMenu(anchor, choice = 'pattern', scope = 'tool')
{
    if (!(anchor instanceof HTMLElement)) return;
    if (closeGeneoOpenMenuOnTrigger(anchor)) return;
    closeMenu();
    const style = scope === 'default' ? selectedGeneographDiagram().connectionDefaults
        : scope === 'connection' ? geneoEffectiveConnectionStyle(selectedGeneographConnection())
            : scope === 'multi' ? { [choice]: geneoSharedConnectionValue(selectedGeneographConnections(), connection => geneoEffectiveConnectionStyle(connection)[choice]) }
                : geneoConnectionToolStyle();
    const arrows = choice === 'arrows';
    const values = arrows ? GENEO_CONNECTION_ARROWS : GENEO_CONNECTION_PATTERNS;
    const label = arrows ? t('Arrowheads') : t('Connection pattern');
    const rect = anchor.getBoundingClientRect();
    const menu = document.createElement('div');
    menu.className = 'menu-popover tool-options-menu';
    menu.id = 'projectMenu';
    menu.setAttribute('role', 'menu');
    menu.setAttribute('aria-label', label);
    menu.innerHTML = values.map(value => `<button type="button" role="menuitemradio" aria-label="${escapeHtml(t(arrows ? capitalize(value) : GENEO_CONNECTION_PATTERN_LABELS[value]))}" title="${escapeHtml(t(arrows ? capitalize(value) : GENEO_CONNECTION_PATTERN_LABELS[value]))}" aria-checked="${style[choice] === value}" data-geneo-connector="${value}">${arrows ? renderGeneoConnectionArrowSample(value) : renderGeneoConnectionLineSample(value)}</button>`).join('');
    document.body.appendChild(menu);
    menu.style.left = `${Math.max(12, Math.min(rect.left, window.innerWidth - menu.offsetWidth - 12))}px`;
    menu.style.top = `${rect.bottom + menu.offsetHeight + 7 <= window.innerHeight - 12
        ? rect.bottom + 7 : Math.max(12, rect.top - menu.offsetHeight - 7)}px`;
    if (window.innerWidth <= 900) mountMobileChoiceSheet(menu, anchor, label);
    anchor.setAttribute('aria-expanded', 'true');
    menu.addEventListener('click', event =>
    {
        const button = event.target.closest('[data-geneo-connector]');
        if (!button) return;
        const value = button.dataset.geneoConnector;
        if (scope === 'default')
        {
            if (style[choice] !== value)
            {
                geneoPushHistory();
                selectedGeneographDiagram().connectionDefaults[choice] = value;
                touchGeneographBoard();
            }
            closeMenu();
            renderGeneographEditorPreserveScroll({ preserveInspectorScroll: true });
            return;
        }
        if (scope === 'connection')
        {
            const connection = selectedGeneographConnection();
            if (connection && geneoEffectiveConnectionStyle(connection)[choice] !== value)
            {
                geneoPushHistory();
                if (value === selectedGeneographDiagram().connectionDefaults[choice]) delete connection.style[choice];
                else connection.style[choice] = value;
                touchGeneographBoard();
            }
            closeMenu();
            renderGeneographEditorPreserveScroll({ preserveInspectorScroll: true });
            return;
        }
        if (scope === 'multi')
        {
            geneoCommitMultiConnectionAppearance(choice, value);
            closeMenu();
            return;
        }
        geneoConnectionToolStyle();
        if (!anchor.closest('[data-geneo-connection-panel]'))
        {
            cancelGeneographConnectionDraft();
            geneoConnectionToolRuntime.purpose = 'automatic';
        }
        state.geneoTool = 'connect';
        if (value === selectedGeneographDiagram().connectionDefaults[choice]) delete geneoConnectionToolRuntime.overrides[choice];
        else geneoConnectionToolRuntime.overrides[choice] = value;
        geneoConnectionToolRuntime.panelOpen = true;
        closeMenu();
        if (anchor.closest('[data-geneo-connection-panel]')) refreshGeneoConnectionToolUi();
        else renderGeneographEditorPreserveScroll();
    });
    menu.addEventListener('keydown', event =>
    {
        const items = [...menu.querySelectorAll('[role="menuitemradio"]')];
        const index = items.indexOf(document.activeElement);
        if (event.key === 'Escape')
        {
            event.preventDefault();
            event.stopPropagation();
            closeMenu();
            restoreGeneoMenuFocusAfterEscape(anchor);
        }
        else if (event.key === 'ArrowDown' || event.key === 'ArrowUp')
        {
            event.preventDefault();
            items[(index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]?.focus();
        }
        else if (event.key === 'Home' || event.key === 'End')
        {
            event.preventDefault();
            items[event.key === 'Home' ? 0 : items.length - 1]?.focus();
        }
    });
    bindMenuLifecycle(anchor, { ignoreScrollWithin: anchor.closest('[data-geneo-connection-panel], .geneo-inspector') });
    requestAnimationFrame(() => menu.querySelector('[aria-checked="true"]')?.focus({ preventScroll: true }));
}

function normalizeGeneographContentKind(
    value
)
{
    return value === 'text'
        ? 'text'
        : 'sticky';
}

function renderGeneoContentSplitTool()
{
    const kind =
        normalizeGeneographContentKind(
            state.geneoContentKind
        );

    const active =
        [
            'sticky',
            'text'
        ].includes(state.geneoTool);

    const actionLabel =
        kind === 'text'
            ? 'Text'
            : 'Sticky note';

    const selectedIcon =
        kind === 'text'
            ? icon.text
            : icon.note;

    return `
        <div
          class="tool-split ${
                active
                    ? 'active'
                    : ''
            }"
          data-tool-split="content"
          data-geneo-toolbar-item="content">

          <button
            class="tool-split-main"
            type="button"
            data-geneo-content-main
            aria-pressed="${
                active
                    ? 'true'
                    : 'false'
            }"
            aria-label="${
                escapeHtml(t(actionLabel))
            }"
            title="${
                escapeHtml(t(actionLabel))
            }">

            ${selectedIcon}

            <span>
              ${escapeHtml(t('Notes & text'))}
            </span>
          </button>

          <button
            class="tool-split-trigger"
            type="button"
            data-geneo-content-menu
            aria-label="${
                escapeHtml(
                    t('Choose content type')
                )
            }"
            title="${escapeHtml(t('Choose content type'))}"
            aria-haspopup="menu"
            aria-expanded="false">

            ${icon.chevron}
          </button>

          <button class="geneo-mobile-content-tool" type="button" data-geneo-mobile-content="sticky" aria-label="${escapeHtml(t('Sticky note'))}" title="${escapeHtml(t('Sticky note'))}" aria-pressed="${state.geneoTool === 'sticky'}">${icon.note}</button>
          <button class="geneo-mobile-content-tool" type="button" data-geneo-mobile-content="text" aria-label="${escapeHtml(t('Text'))}" title="${escapeHtml(t('Text'))}" aria-pressed="${state.geneoTool === 'text'}">${icon.text}</button>
        </div>
      `;
}

function openGeneoContentMenu(
    anchor
)
{
    if (
        !(anchor instanceof HTMLElement)
    )
    {
        return;
    }

    if (closeGeneoOpenMenuOnTrigger(anchor)) return;
    closeMenu();

    const selected =
        normalizeGeneographContentKind(
            state.geneoContentKind
        );

    const rect =
        anchor.getBoundingClientRect();

    const menu =
        document.createElement('div');

    menu.className =
        'menu-popover tool-options-menu';

    menu.id =
        'projectMenu';

    menu.setAttribute(
        'role',
        'menu'
    );

    menu.setAttribute(
        'aria-label',
        t('Choose content type')
    );

    menu.style.top =
        `${rect.bottom + 7}px`;

    menu.style.left =
        `${
            Math.max(
                12,
                Math.min(
                    rect.left - 118,
                    window.innerWidth - 210
                )
            )
        }px`;

    menu.innerHTML = `
        <button
          type="button"
          role="menuitemradio"
          aria-checked="${
                selected === 'sticky'
                    ? 'true'
                    : 'false'
            }"
          data-geneo-content-kind="sticky">

          ${icon.note}

          <span>
            ${escapeHtml(t('Sticky note'))}
          </span>
        </button>

        <button
          type="button"
          role="menuitemradio"
          aria-checked="${
                selected === 'text'
                    ? 'true'
                    : 'false'
            }"
          data-geneo-content-kind="text">

          ${icon.text}

          <span>
            ${escapeHtml(t('Text'))}
          </span>
        </button>
      `;

    document.body.appendChild(menu);

    anchor.setAttribute(
        'aria-expanded',
        'true'
    );

    menu.addEventListener(
        'click',
        event =>
        {
            const button =
                event.target.closest(
                    '[data-geneo-content-kind]'
                );

            if (!button) return;

            const kind =
                normalizeGeneographContentKind(
                    button.dataset
                        .geneoContentKind
                );

            state.geneoContentKind =
                kind;

            closeMenu();

            activateGeneographPlacementTool(
                kind
            );
        }
    );

    menu.addEventListener(
        'keydown',
        event =>
        {
            const items = [
                ...menu.querySelectorAll(
                    '[role="menuitemradio"]'
                )
            ];

            const index =
                items.indexOf(
                    document.activeElement
                );

            if (event.key === 'Escape')
            {
                event.preventDefault();
                event.stopPropagation();

                closeMenu();
                restoreGeneoMenuFocusAfterEscape(anchor);

                return;
            }

            if (
                event.key === 'ArrowDown'
            || event.key === 'ArrowUp'
            )
            {
                event.preventDefault();

                const direction =
                    event.key === 'ArrowDown'
                        ? 1
                        : -1;

                items[
                    (
                        index
                + direction
                + items.length
                    ) % items.length
                ]?.focus();

                return;
            }

            if (
                event.key === 'Home'
            || event.key === 'End'
            )
            {
                event.preventDefault();

                items[
                    event.key === 'Home'
                        ? 0
                        : items.length - 1
                ]?.focus();
            }
        }
    );

    bindMenuLifecycle(anchor);

    requestAnimationFrame(
        () =>
        {
            menu
                .querySelector(
                    '[aria-checked="true"]'
                )
                ?.focus({ preventScroll: true });
        }
    );
}

function renderGeneoShapeSplitTool()
{
    const kind =
        normalizeGeneographShapeKind(
            geneoCreationToolSettings('shape').shapeKind
        );

    const selectedShapeLabel =
        geneoShapeLabel(kind);

    const active =
        state.geneoTool === 'shape';

    const title =
        `${t('Shapes')}: ${
            t(selectedShapeLabel)
        }`;

    return `
        <div
          class="tool-split ${
                active
                    ? 'active'
                    : ''
            }"
          data-tool-split="shape"
          data-geneo-toolbar-item="shape">

          <button
            class="tool-split-main"
            type="button"
            data-geneo-shape-main
            aria-haspopup="${window.innerWidth <= 900 ? 'dialog' : 'false'}"
            aria-expanded="false"
            aria-pressed="${
                active
                    ? 'true'
                    : 'false'
            }"
            aria-label="${escapeHtml(title)}"
            title="${escapeHtml(title)}">

            ${icon.shape}

            <span>
              ${escapeHtml(t('Shapes'))}
            </span>
          </button>

          <button
            class="tool-split-trigger"
            type="button"
            data-geneo-shape-menu
            aria-label="${
                escapeHtml(t('Choose shape'))
            }"
            title="${escapeHtml(t('Choose shape'))}"
            aria-haspopup="menu"
            aria-expanded="false">

            ${icon.chevron}
          </button>
        </div>
      `;
}

function openGeneoShapeMenu(anchor)
{
    if (!(anchor instanceof HTMLElement)) return;
    if (closeGeneoOpenMenuOnTrigger(anchor)) return;
    closeMenu();
    const selected = normalizeGeneographShapeKind(geneoCreationToolSettings('shape').shapeKind);
    const rect = anchor.getBoundingClientRect();
    const menu = document.createElement('div');
    menu.className = 'menu-popover tool-options-menu geneo-shape-options-menu';
    menu.id = 'projectMenu';
    menu.setAttribute('role', 'menu');
    menu.setAttribute('aria-label', t('Shape type'));
    menu.innerHTML = GENEO_SHAPE_KINDS.map(shape => `<button type="button" role="menuitemradio" aria-label="${escapeHtml(t(shape.label))}" aria-checked="${selected === shape.id}" data-geneo-shape-kind="${escapeHtml(shape.id)}"><span class="geneo-shape-option-preview shape-${escapeHtml(shape.id)}" aria-hidden="true"></span><span>${escapeHtml(t(shape.label))}</span></button>`).join('');
    document.body.appendChild(menu);
    menu.style.left = `${Math.max(12, Math.min(rect.left, window.innerWidth - menu.offsetWidth - 12))}px`;
    menu.style.top = `${rect.bottom + menu.offsetHeight + 7 <= window.innerHeight - 12 ? rect.bottom + 7 : Math.max(12, rect.top - menu.offsetHeight - 7)}px`;
    if (window.innerWidth <= 900) mountMobileChoiceSheet(menu, anchor, t('Shapes'));
    anchor.setAttribute('aria-expanded', 'true');
    menu.addEventListener('click', event =>
    {
        const button = event.target.closest('[data-geneo-shape-kind]');
        if (!button) return;
        geneoCreationToolSettings('shape').shapeKind = normalizeGeneographShapeKind(button.dataset.geneoShapeKind);
        geneoCreationToolSettings('shape').panelOpen = true;
        closeMenu();
        if (state.geneoTool === 'shape') renderGeneographEditorPreserveScroll();
        else activateGeneographPlacementTool('shape');
        if (lastInteractionWasKeyboard) requestAnimationFrame(() =>
            (main.querySelector('[data-geneo-shape-main]:not([tabindex="-1"])')
                || main.querySelector('[data-geneo-toolbar-overflow]'))?.focus({ preventScroll: true }));
    });
    menu.addEventListener('keydown', event =>
    {
        const items = [...menu.querySelectorAll('[role="menuitemradio"]')];
        const index = items.indexOf(document.activeElement);
        if (event.key === 'Escape')
        {
            event.preventDefault();
            event.stopPropagation();
            closeMenu();
            restoreGeneoMenuFocusAfterEscape(anchor);
        }
        else if (event.key === 'ArrowDown' || event.key === 'ArrowUp')
        {
            event.preventDefault();
            items[(index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]?.focus();
        }
        else if (event.key === 'Home' || event.key === 'End')
        {
            event.preventDefault();
            items[event.key === 'Home' ? 0 : items.length - 1]?.focus();
        }
    });
    bindMenuLifecycle(anchor);
    requestAnimationFrame(() => menu.querySelector('[aria-checked="true"]')?.focus({ preventScroll: true }));
}

function geneoToolbarOverflowItems(toolbar)
{
    const mobile = window.innerWidth <= 900;
    const groups = [
        ['history', [['undo', 'Undo', icon.undo], ['redo', 'Redo', icon.redo]]],
        ['modes', [['select', 'Select', icon.cursorSelect], ['pan', 'Pan', icon.pan], ['pencil', 'Pencil', icon.edit]]],
        ['connect', [['connect', 'Connect', icon.link], ['connection-style', 'Connection style', icon.link]]],
        ['person', [['person', 'Person', icon.profile], ['person-gender', 'Choose person gender', icon.chevron]]],
        ['place', [['place', 'Place', icon.mapPin]]],
        ['image', [['image', 'Image', icon.image]]],
        ['panel', [['panel', 'Panel', icon.panel]]],
        ['content', mobile
            ? [['sticky', 'Sticky note', icon.note], ['text', 'Text', icon.text]]
            : [['content', state.geneoContentKind === 'text' ? 'Text' : 'Sticky note',
                state.geneoContentKind === 'text' ? icon.text : icon.note],
            ['content-style', 'Choose content type', icon.chevron]]],
        ['shape', mobile
            ? [['shape', 'Shapes', icon.shape]]
            : [['shape', 'Shapes', icon.shape], ['shape-style', 'Choose shape', icon.shape]]],
        ['export', [['export', 'Export board', icon.export]]]
    ];
    return groups.flatMap(([id, actions]) =>
        geneoToolbarControl(toolbar, id)?.hasAttribute('data-geneo-hidden')
            ? actions.map(([action, label, itemIcon]) => ({ action, label: t(label), icon: itemIcon,
                disabled: action === 'undo' ? !geneoHistoryRuntime.undo.length
                    : action === 'redo' ? !geneoHistoryRuntime.redo.length : false }))
            : []);
}

function openGeneoToolbarOverflowMenu(
    anchor
)
{
    if (
        !(anchor instanceof HTMLElement)
    )
    {
        return;
    }

    closeMenu();

    const toolbar =
        main.querySelector(
            '.geneo-editor-toolbar'
        );

    const items = geneoToolbarOverflowItems(toolbar);
    if (!items.length) return;

    const rect =
        anchor.getBoundingClientRect();

    const menu =
        document.createElement('div');

    menu.className =
        'menu-popover tool-options-menu geneo-toolbar-overflow-menu';

    menu.id =
        'projectMenu';

    menu.setAttribute(
        'role',
        'menu'
    );

    menu.setAttribute(
        'aria-label',
        t('More board tools')
    );

    menu.style.top =
        `${rect.bottom + 7}px`;

    menu.style.left =
        `${
            Math.max(
                12,
                Math.min(
                    rect.right - 220,
                    window.innerWidth - 232
                )
            )
        }px`;

    menu.innerHTML =
        items
            .map(
                item => `
              <button
                type="button"
                role="menuitem"
                ${item.disabled ? 'disabled' : ''}
                data-geneo-toolbar-action="${
                    escapeHtml(item.action)
                }">

                ${item.icon}

                <span>
                  ${escapeHtml(item.label)}
                </span>
              </button>
            `
            )
            .join('');

    document.body.appendChild(menu);

    anchor.setAttribute(
        'aria-expanded',
        'true'
    );

    menu.addEventListener(
        'click',
        event =>
        {
            const button =
                event.target.closest(
                    '[data-geneo-toolbar-action]'
                );

            if (!button) return;

            const action =
                button.dataset
                    .geneoToolbarAction;

            if (
                action === 'connection-style'
            )
            {
                closeMenu();

                requestAnimationFrame(
                    () =>
                    {
                        openGeneoConnectionStyleMenu(
                            anchor
                        );
                    }
                );

                return;
            }

            if (action === 'shape-style' || action === 'content-style' || action === 'person-gender')
            {
                closeMenu();
                requestAnimationFrame(() => (action === 'shape-style'
                    ? openGeneoShapeMenu : action === 'content-style'
                        ? openGeneoContentMenu : openGeneoPersonGenderMenu)(anchor));
                return;
            }

            closeMenu();

            if (
                [
                    'person',
                    'place',
                    'image'
                ].includes(action)
            )
            {
                addGeneographObject(action);
                return;
            }

            if (action === 'content')
            {
                main.querySelector('[data-geneo-content-main]')?.click();
                return;
            }

            if (action === 'sticky' || action === 'text')
            {
                state.geneoContentKind = action;
                activateGeneographPlacementTool(action);
                return;
            }

            if (action === 'panel')
            {
                activateGeneographPlacementTool(
                    'panel'
                );

                return;
            }

            if (action === 'connect')
            {
                activateGeneographConnectionTool();
                return;
            }

            if (action === 'shape')
            {
                if (window.innerWidth <= 900) openGeneoShapeMenu(anchor);
                else activateGeneographPlacementTool('shape');
                return;
            }

            if (['undo', 'redo', 'select', 'pan', 'pencil'].includes(action))
            {
                main.querySelector(action === 'undo' || action === 'redo'
                    ? `[data-geneo-${action}]` : `[data-geneo-tool="${action}"]`)?.click();
                return;
            }

            if (action === 'export')
            {
                exportGeneographBoard(anchor);
            }
        }
    );

    menu.addEventListener(
        'keydown',
        event =>
        {
            const items = [
                ...menu.querySelectorAll(
                    '[role="menuitem"]'
                )
            ];

            const index =
                items.indexOf(
                    document.activeElement
                );

            if (event.key === 'Escape')
            {
                event.preventDefault();
                event.stopPropagation();

                closeMenu();
                anchor.focus();

                return;
            }

            if (
                event.key === 'ArrowDown'
            || event.key === 'ArrowUp'
            )
            {
                event.preventDefault();

                const direction =
                    event.key === 'ArrowDown'
                        ? 1
                        : -1;

                items[
                    (
                        index
                + direction
                + items.length
                    ) % items.length
                ]?.focus();

                return;
            }

            if (
                event.key === 'Home'
            || event.key === 'End'
            )
            {
                event.preventDefault();

                items[
                    event.key === 'Home'
                        ? 0
                        : items.length - 1
                ]?.focus();
            }
        }
    );

    bindMenuLifecycle(anchor);

    requestAnimationFrame(
        () =>
        {
            menu
                .querySelector(
                    '[role="menuitem"]'
                )
                ?.focus();
        }
    );
}

const GENEO_TOOLBAR_ORDER_RIGHT_TO_LEFT = [
    'export', 'shape', 'content', 'panel', 'image', 'place',
    'person', 'connect', 'modes', 'history'
];

function geneoToolbarControl(toolbar, id)
{
    if (id === 'modes') return toolbar?.querySelector('.geneo-tool-group');
    if (id === 'history') return toolbar?.querySelector('.geneo-history-group');
    return toolbar?.querySelector(`[data-geneo-toolbar-item="${id}"]`);
}

function geneoVisibleToolbarButtons(
    toolbar
)
{
    if (!toolbar) return [];

    return [
        ...toolbar.querySelectorAll(
            'button:not(:disabled)'
        )
    ].filter(
        button =>
            button.getClientRects().length > 0
          && getComputedStyle(button)
              .visibility !== 'hidden'
    );
}

function syncGeneoToolbarTabStops(
    toolbar,
    preferredButton = null
)
{
    const buttons =
        geneoVisibleToolbarButtons(
            toolbar
        );

    if (!buttons.length) return;

    const current =
        buttons.includes(preferredButton)
            ? preferredButton
            : buttons.includes(
                document.activeElement
            )
                ? document.activeElement
                : buttons.find(
                    button =>
                        button.tabIndex === 0
                )
              || buttons[0];

    buttons.forEach(
        button =>
        {
            button.tabIndex =
                button === current
                    ? 0
                    : -1;
        }
    );
}

function bindGeneographToolbarDensity()
{
    const toolbar =
        main.querySelector(
            '.geneo-editor-toolbar'
        );

    if (!toolbar) return;

    geneoToolbarResizeObserver
        ?.disconnect();

    const updateDensity = width =>
    {
        const left = toolbar.querySelector('.geneo-editor-toolbar-left');
        const right = toolbar.querySelector('.geneo-editor-toolbar-right');
        const objects = toolbar.querySelector('.geneo-toolbar-objects');
        toolbar.dataset.toolbarDensity = width >= 1320 ? 'expanded' : 'adaptive';
        delete toolbar.dataset.geneoOverflow;
        GENEO_TOOLBAR_ORDER_RIGHT_TO_LEFT.forEach(id =>
        {
            const control = geneoToolbarControl(toolbar, id);
            control?.removeAttribute('data-geneo-icon-only');
            control?.removeAttribute('data-geneo-hidden');
        });
        objects?.removeAttribute('data-geneo-hidden');
        if (width < 1320)
        {
            const style = getComputedStyle(toolbar);
            const available = width - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight)
                - parseFloat(style.columnGap || style.gap || 0);
            const contentWidth = container =>
            {
                const children = [...container.children]
                    .filter(child => getComputedStyle(child).display !== 'none');
                const gap = parseFloat(getComputedStyle(container).columnGap || 0);
                return children.reduce((sum, child) => sum + Math.max(
                    child.scrollWidth, child.getBoundingClientRect().width), 0)
                    + Math.max(0, children.length - 1) * gap;
            };
            const fits = () => contentWidth(left) + contentWidth(right)
                + (width > 900 && toolbar.querySelector('.geneo-tool-group.is-icon-only:not([data-geneo-icon-only]):not([data-geneo-hidden])')
                    ? 84 : 0) <= available + 1;
            for (const id of GENEO_TOOLBAR_ORDER_RIGHT_TO_LEFT)
            {
                if (fits()) break;
                if (id === 'history' || (width <= 900 && id === 'connect')) continue;
                geneoToolbarControl(toolbar, id)?.setAttribute('data-geneo-icon-only', '');
            }
            const overflowOrder = width <= 900
                ? GENEO_TOOLBAR_ORDER_RIGHT_TO_LEFT.filter(id => !['history', 'modes', 'connect'].includes(id)).concat('history')
                : GENEO_TOOLBAR_ORDER_RIGHT_TO_LEFT;
            for (const id of overflowOrder)
            {
                if (fits()) break;
                geneoToolbarControl(toolbar, id)?.setAttribute('data-geneo-hidden', '');
                toolbar.dataset.geneoOverflow = 'true';
                if ([...objects.children].every(child => child.hasAttribute('data-geneo-hidden')))
                    objects.setAttribute('data-geneo-hidden', '');
            }
        }
        syncGeneoToolbarTabStops(toolbar);
    };

    updateDensity(
        toolbar.getBoundingClientRect()
            .width
    );

    if (
        typeof ResizeObserver
          === 'function'
    )
    {
        geneoToolbarResizeObserver =
            new ResizeObserver(
                entries =>
                {
                    const entry =
                        entries[0];

                    if (!entry) return;

                    updateDensity(
                        entry.contentRect.width
                    );
                }
            );

        geneoToolbarResizeObserver
            .observe(toolbar);
    }
}

function bindGeneographToolbarKeyboard()
{
    const toolbar =
        main.querySelector(
            '.geneo-editor-toolbar'
        );

    if (!toolbar) return;

    syncGeneoToolbarTabStops(
        toolbar
    );

    toolbar.addEventListener(
        'focusin',
        event =>
        {
            const button =
                event.target.closest('button');

            if (!button) return;

            syncGeneoToolbarTabStops(
                toolbar,
                button
            );
        }
    );

    toolbar.addEventListener(
        'keydown',
        event =>
        {
            if (
                ![
                    'ArrowLeft',
                    'ArrowRight',
                    'Home',
                    'End'
                ].includes(event.key)
            )
            {
                return;
            }

            const current =
                event.target.closest('button');

            if (!current) return;

            const buttons =
                geneoVisibleToolbarButtons(
                    toolbar
                );

            const index =
                buttons.indexOf(current);

            if (index < 0) return;

            event.preventDefault();

            let nextIndex =
                index;

            if (event.key === 'Home')
            {
                nextIndex = 0;
            }
            else if (event.key === 'End')
            {
                nextIndex =
                    buttons.length - 1;
            }
            else
            {
                const direction =
                    event.key === 'ArrowRight'
                        ? 1
                        : -1;

                nextIndex =
                    (
                        index
                + direction
                + buttons.length
                    ) % buttons.length;
            }

            const nextButton =
                buttons[nextIndex];

            syncGeneoToolbarTabStops(
                toolbar,
                nextButton
            );

            nextButton?.focus();
        }
    );
}

function validateSampleGeneographCollections(
    warn,
    projectIds
)
{
    const collectionIds =
        new Set();

    (
        sampleData.boardCollections
        || []
    ).forEach(collection =>
    {
        if (!collection.id)
        {
            warn(
                'Board collection is missing an ID'
            );

            return;
        }

        if (
            collectionIds.has(
                collection.id
            )
        )
        {
            warn(
                `Duplicate board collection ID: ${
                    collection.id
                }`
            );
        }

        collectionIds.add(
            collection.id
        );

        if (
            !projectIds.has(
                collection.projectId
            )
        )
        {
            warn(
                `Board collection ${
                    collection.id
                } points to missing project ${
                    collection.projectId
                }`
            );
        }

        if (
            !String(
                collection.name || ''
            ).trim()
        )
        {
            warn(
                `Board collection ${
                    collection.id
                } has no name`
            );
        }
    });

    (
        sampleData.boards
        || []
    ).forEach(board =>
    {
        if (
            !projectIds.has(
                board.projectId
            )
        )
        {
            warn(
                `Board ${
                    board.id
                } points to missing project ${
                    board.projectId
                }`
            );
        }
        if (
            typeof board.archived
            !== 'boolean'
        )
        {
            warn(
                `Board ${
                    board.id
                } has an invalid archived state`
            );
        }
        (
            board.collectionIds
          || []
        ).forEach(collectionId =>
        {
            const collection =
                getBoardCollection(
                    collectionId,
                    {
                        projectId:
                  board.projectId
                    }
                );

            if (!collection)
            {
                warn(
                    `Board ${
                        board.id
                    } points to invalid collection ${
                        collectionId
                    }`
                );
            }
        });

        const diagram =
            board.diagram;

        if (
            !diagram
          || !Array.isArray(diagram.people)
          || !Array.isArray(diagram.families)
          || !Array.isArray(diagram.nodes)
          || !Array.isArray(diagram.connections)
        )
        {
            warn(
                `Board ${board.id} has an invalid diagram`
            );
            return;
        }

        if (!isCanonicalGeneoPaint(diagram.canvas?.backgroundPaint, { mustBeEnabled: true, fixedOpacity: 100 }))
        {
            warn(`Board ${board.id} has an invalid canvas background paint`);
        }

        const peopleIds =
            new Set();
        const nodeIds =
            new Set();
        const familyIds =
            new Set();

        diagram.people
            .forEach(person =>
            {
                if (
                    !person.id
              || peopleIds.has(person.id)
                )
                {
                    warn(
                        `Board ${board.id} has a duplicate or missing person ID`
                    );
                }
                peopleIds.add(person.id);

                if (
                    person.treePersonId
              && !(sampleData.people || [])
                  .some(treePerson =>
                      treePerson.id === person.treePersonId
                  && treePerson.projectId === board.projectId
                  )
                )
                {
                    warn(
                        `Board person ${person.id} has an invalid Family Tree link`
                    );
                }
            });

        diagram.nodes
            .forEach(node =>
            {
                if (
                    !node.id
              || nodeIds.has(node.id)
              || !GENEO_NODE_TYPES.has(node.type)
                )
                {
                    warn(
                        `Board ${board.id} has an invalid node`
                    );
                }
                nodeIds.add(node.id);

                (node.type === 'image' ? ['stroke', 'text'] : ['fill', 'stroke', 'text']).forEach(property =>
                {
                    if (!isCanonicalGeneoPaint(node.appearance?.[property], { mustBeEnabled: property === 'text' }))
                    {
                        warn(`Node ${node.id} has an invalid ${property} paint`);
                    }
                });
                if (!['solid', 'dashed'].includes(node.appearance?.strokePattern))
                {
                    warn(`Node ${node.id} has an invalid stroke pattern`);
                }
                if (
                    !Number.isInteger(node.appearance?.strokeWidth)
              || node.appearance.strokeWidth < GENEO_STROKE_WIDTH_MIN
              || node.appearance.strokeWidth > GENEO_STROKE_WIDTH_MAX
                )
                {
                    warn(`Node ${node.id} has an invalid stroke width`);
                }

                if (
                    node.type === 'person'
              && !peopleIds.has(node.personId)
                )
                {
                    warn(
                        `Person node ${node.id} points to a missing board person`
                    );
                }
                if (
                    node.type === 'person'
              && !['auto', 'manual'].includes(
                  node.personCard?.heightMode
              )
                )
                {
                    warn(
                        `Person node ${node.id} has an invalid height mode`
                    );
                }
                if (
                    node.type === 'shape'
              && !GENEO_SHAPE_KINDS.some(shape => shape.id === node.shapeKind)
                )
                {
                    warn(`Shape node ${node.id} has an invalid shape kind`);
                }
                if (
                    ['shape', 'image', 'place', 'panel', 'sticky', 'text'].includes(node.type)
              && (
                  !Number.isInteger(node.appearance?.cornerRadius)
                || node.appearance.cornerRadius < 0
                || node.appearance.cornerRadius > 32
              )
                )
                {
                    warn(`${node.type} node ${node.id} has an invalid corner radius`);
                }
                if (['text', 'sticky', 'place'].includes(node.type)
                    && (!Number.isInteger(node.appearance?.fontSize)
                        || node.appearance.fontSize < 8 || node.appearance.fontSize > 72))
                {
                    warn(`${node.type} node ${node.id} has an invalid font size`);
                }
                if (
                    node.type === 'drawing'
              && (
                  !Array.isArray(node.points)
                || node.points.length < 2
                || node.points.some(point =>
                    !Number.isFinite(point?.x)
                  || !Number.isFinite(point?.y)
                  || point.x < 0
                  || point.x > 1
                  || point.y < 0
                  || point.y > 1
                )
              )
                )
                {
                    warn(`Drawing node ${node.id} has invalid points`);
                }
                if (node.type === 'place')
                {
                    const ref = node.placeRef;
                    const projectPlace = ref?.scope === 'project'
                        ? (sampleData.places || []).find(place => place.id === ref.id)
                        : null;
                    if (
                        !ref
                || !['project', 'board'].includes(ref.scope)
                || (ref.scope === 'board' && !String(ref.name || '').trim())
                || (ref.scope === 'project' && (
                    !projectPlace
                  || projectPlace.deleted
                  || projectPlace.projectId !== board.projectId
                ))
                    )
                    {
                        warn(`Place node ${node.id} has an invalid place reference`);
                    }
                    if (
                        ![
                            'auto',
                            'manual'
                        ].includes(
                            node.placeSizeMode
                        )
                    )
                    {
                        warn(
                            `Place node ${node.id} has an invalid size mode`
                        );
                    }
                }
            });

        diagram.families
            .forEach(family =>
            {
                if (
                    !family.id
              || familyIds.has(family.id)
                )
                {
                    warn(
                        `Board ${board.id} has an invalid family ID`
                    );
                }
                familyIds.add(family.id);

                [
                    ...(family.partnerIds || []),
                    ...(family.children || [])
                        .map(child => child.personId)
                ].forEach(personId =>
                {
                    if (!peopleIds.has(personId))
                    {
                        warn(
                            `Family ${family.id} points to a missing board person`
                        );
                    }
                });
            });

        if (!isCanonicalGeneoPaint(diagram.connectionDefaults?.line)
            || !Number.isInteger(diagram.connectionDefaults?.width)
            || diagram.connectionDefaults.width < GENEO_STROKE_WIDTH_MIN
            || diagram.connectionDefaults.width > GENEO_STROKE_WIDTH_MAX
            || !GENEO_CONNECTION_PATTERNS.includes(diagram.connectionDefaults?.pattern)
            || !GENEO_CONNECTION_ARROWS.includes(diagram.connectionDefaults?.arrows)
            || !Number.isInteger(diagram.connectionDefaults?.cornerRadius)
            || diagram.connectionDefaults.cornerRadius < 0
            || diagram.connectionDefaults.cornerRadius > 32
            || typeof diagram.connectionDefaults.showRelationshipDates !== 'boolean')
        {
            warn(`Board ${board.id} has invalid connection defaults`);
        }

        const connectionIds =
            new Set();

        diagram.connections
            .forEach(connection =>
            {
                if (
                    !connection.id
              || connectionIds.has(connection.id)
                )
                {
                    warn(
                        `Board ${board.id} has an invalid connection ID`
                    );
                }
                connectionIds.add(connection.id);

                if (typeof connection.visible !== 'boolean')
                    warn(`Connection ${connection.id} has invalid visibility`);

                if (connection.style?.line && !isCanonicalGeneoPaint(connection.style.line))
                {
                    warn(`Connection ${connection.id} has an invalid line paint`);
                }
                if (
                    connection.style?.width !== undefined && (!Number.isInteger(connection.style.width)
              || connection.style.width < GENEO_STROKE_WIDTH_MIN
              || connection.style.width > GENEO_STROKE_WIDTH_MAX)
                )
                {
                    warn(`Connection ${connection.id} has an invalid stroke width`);
                }
                if (connection.style?.pattern !== undefined && !GENEO_CONNECTION_PATTERNS.includes(connection.style.pattern))
                {
                    warn(`Connection ${connection.id} has an invalid line pattern`);
                }
                if (connection.style?.arrows !== undefined && (connection.kind !== 'visual' || !GENEO_CONNECTION_ARROWS.includes(connection.style.arrows)))
                    warn(`Connection ${connection.id} has invalid arrowheads`);
                if (connection.style?.cornerRadius !== undefined
                    && (!Number.isInteger(connection.style.cornerRadius)
                        || connection.style.cornerRadius < 0 || connection.style.cornerRadius > 32))
                    warn(`Connection ${connection.id} has an invalid corner radius`);
                if (connection.showRelationshipDates !== undefined
                    && typeof connection.showRelationshipDates !== 'boolean')
                    warn(`Connection ${connection.id} has an invalid relationship-date setting`);

                [
                    connection.source,
                    connection.target
                ].forEach(reference =>
                {
                    if (
                        reference?.nodeId
                && !nodeIds.has(reference.nodeId)
                    )
                    {
                        warn(
                            `Connection ${connection.id} points to a missing node`
                        );
                    }
                    if (
                        reference?.familyId
                && !familyIds.has(reference.familyId)
                    )
                    {
                        warn(
                            `Connection ${connection.id} points to a missing family`
                        );
                    }
                });
            });
    });
}

function openGeneographBoardDetailsModal({
    boardId =
        null
} = {})
{
    const editing =
        Boolean(
            boardId
        );

    const board =
        editing
            ? getGeneographBoard(
                boardId
            )
            : null;

    if (
        editing
        && !board
    )
    {
        showToast(
            'Board not found.'
        );

        return;
    }

    const projectId =
        board?.projectId
        || requireActiveProjectId();
    if (!projectId) return;

    const inheritedCollection =
        !editing
        && state.geneoLibraryView
          === 'collection'
            ? activeGeneographCollection()
            : null;

    const selectedCollectionIds =
        new Set(
            editing
                ? (
                    board.collectionIds
                || []
                )
                : inheritedCollection
                    ? [
                        inheritedCollection.id
                    ]
                    : []
        );

    const modalTitle =
        editing
            ? 'Edit board'
            : 'New board';

    const modalDescription =
        editing
            ? 'Update the board name, description and collections.'
            : 'Create a visual workspace for research, evidence and visual exploration.';

    const submitLabel =
        editing
            ? 'Save changes'
            : 'Create board';

    openModal(`
        <div
          class="
            modal
            geneo-board-create-modal
          "
          role="dialog"
          aria-modal="true"
          aria-labelledby="geneographBoardDetailsTitle">

          <div
            class="
              modal-header
            ">

            <div>
              <h2
                id="geneographBoardDetailsTitle">

                ${escapeHtml(
                    modalTitle
                )}
              </h2>

              <p>
                ${escapeHtml(
                    modalDescription
                )}
              </p>
            </div>

            <button
              class="
                close-button
              "
              type="button"
              data-close
              aria-label="Close">

              ${icon.close}
            </button>
          </div>

          <form
            data-geneo-board-details-form>

            <div
              class="
                modal-body
                form-grid
              ">

              <div
                class="
                  field
                ">

                <label
                  for="geneoBoardDetailsName">

                  Board name
                </label>

                <input
                  id="geneoBoardDetailsName"
                  type="text"
                  required
                  maxlength="160"
                  autocomplete="off"
                  value="${escapeHtml(
                        board?.title
                    || ''
                    )}"
                  placeholder="e.g. Unknown father theory">
              </div>

              <div
                class="
                  field
                ">

                <label
                  for="geneoBoardDetailsDescription">

                  Description
                </label>

                <textarea
                  id="geneoBoardDetailsDescription"
                  rows="3"
                  maxlength="500"
                  placeholder="Research question or intended output">${escapeHtml(
                        board?.description
                    || ''
                    )}</textarea>
              </div>

              ${renderGeneographCollectionChooser({
                    projectId,
                    selectedCollectionIds
                })}
            </div>

            <div
              class="
                modal-footer
              ">

              <button
                class="
                  button
                  secondary
                "
                type="button"
                data-close>

                Cancel
              </button>

              <button
                class="
                  button
                  primary
                "
                type="submit">

                ${escapeHtml(
                    submitLabel
                )}
              </button>
            </div>
          </form>
        </div>
      `);

    const modal =
        modalBackdrop.querySelector(
            '.geneo-board-create-modal'
        );

    if (!modal)
    {
        return;
    }

    bindGeneographCollectionChooser(
        modal,
        {
            projectId,
            selectedCollectionIds
        }
    );

    const form =
        modal.querySelector(
            '[data-geneo-board-details-form]'
        );

    const nameInput =
        modal.querySelector(
            '#geneoBoardDetailsName'
        );

    const descriptionInput =
        modal.querySelector(
            '#geneoBoardDetailsDescription'
        );

    form
        ?.addEventListener(
            'submit',
            event =>
            {
                event.preventDefault();

                const title =
                    nameInput
                        ?.value
                        .trim()
              || '';

                if (!title)
                {
                    nameInput?.focus();

                    showToast(
                        'Enter a board name.'
                    );

                    return;
                }

                const description =
                    descriptionInput
                        ?.value
                        .trim()
              || '';

                if (editing)
                {
                    board.title =
                        title;

                    board.description =
                        description;

                    setBoardCollections(
                        board.id,
                        [
                            ...selectedCollectionIds
                        ],
                        {
                            projectId:
                    board.projectId,

                            touchModified:
                    false
                        }
                    );

                    touchGeneographBoard(
                        board
                    );

                    closeModal();

                    renderGeneographHome();

                    showToast(
                        'Board updated.'
                    );

                    return;
                }
                const now =
                    new Date().toISOString();

                const newBoard = {
                    id:
                createRuntimeId(
                    'board'
                ),

                    projectId,

                    title,

                    description,

                    collectionIds: [
                        ...selectedCollectionIds
                    ],

                    modified:
                'Just now',
                    modifiedAt: now,
                    createdAt: now,
                    favorite:
                false,
                    archived:
                false,
                    thumb:
                'theory',
                    diagram:
                createEmptyGeneographDiagram()
                };

                sampleData.boards.unshift(
                    newBoard
                );

                state.selectedGeneoBoardId =
                    newBoard.id;

                const createdWithCollections =
                    selectedCollectionIds.size
                > 0;

                if (
                    state.geneoLibraryView
                === 'favorites'
              || state.geneoLibraryView
                === 'archived'
              || (
                  state.geneoLibraryView
                  === 'unassigned'
                && createdWithCollections
              )
                )
                {
                    state.geneoLibraryView =
                        'all';

                    state.geneoActiveCollectionId =
                        null;
                }

                closeModal();

                renderGeneographHome();

                showToast(
                    'Board created.'
                );
            }
        );

    requestAnimationFrame(
        () =>
        {
            nameInput?.focus();

            if (editing)
            {
                nameInput?.select();
            }
        }
    );
}

function openCreateGeneographBoardModal()
{
    openGeneographBoardDetailsModal();
}

function openEditGeneographBoardModal(
    boardId
)
{
    openGeneographBoardDetailsModal({
        boardId
    });
}

function openGeneographSettingsModal()
{
    cancelGeneographPencilStroke();
    const board =
        selectedGeneographBoard();

    if (!board)
    {
        return;
    }

    const selectedCollectionIds =
        new Set(
            board.collectionIds
          || []
        );

    openModal(`
        <div
          class="modal geneo-board-settings-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="boardSettingsTitle">

          <div class="modal-header">
            <div>
              <h2
                id="boardSettingsTitle">

                Board settings
              </h2>

            </div>

            <button
              class="
                close-button
              "
              type="button"
              data-close
              aria-label="Close">

              ${icon.close}
            </button>
          </div>

          <form
            id="geneographBoardSettingsForm">

            <div
              class="
                modal-body
                form-grid
              ">

              <div class="field">
                <label
                  for="geneographSettingsName">

                  Board name
                </label>

                <input
                  id="geneographSettingsName"
                  type="text"
                  required
                  maxlength="160"
                  value="${escapeHtml(
                        board.title
                    )}">
              </div>

              <div class="field">
                <label
                  for="geneographSettingsDescription">

                  Description
                </label>

                <textarea
                  id="geneographSettingsDescription"
                  maxlength="500"
                  rows="2">${escapeHtml(
                        board.description
                    || ''
                    )}</textarea>
              </div>

              ${renderGeneographCollectionChooser({
                    projectId:
                  board.projectId,

                    selectedCollectionIds
                })}
            </div>

            <div class="modal-footer">
              <button
                class="
                  button
                  secondary
                "
                type="button"
                data-close>

                Cancel
              </button>

              <button
                class="
                  button
                  primary
                "
                type="submit">

                Save settings
              </button>
            </div>
          </form>
        </div>
      `);

    const modal =
        modalBackdrop.querySelector(
            '.modal'
        );

    bindGeneographCollectionChooser(
        modal,
        {
            projectId:
            board.projectId,

            selectedCollectionIds
        }
    );

    modalBackdrop
        .querySelector(
            '#geneographBoardSettingsForm'
        )
        ?.addEventListener(
            'submit',
            event =>
            {
                event.preventDefault();

                const name =
                    modalBackdrop
                        .querySelector(
                            '#geneographSettingsName'
                        )
                        ?.value
                        .trim()
              || '';

                if (!name)
                {
                    modalBackdrop
                        .querySelector(
                            '#geneographSettingsName'
                        )
                        ?.focus();

                    return;
                }

                board.title =
                    name;

                board.description =
                    modalBackdrop
                        .querySelector(
                            '#geneographSettingsDescription'
                        )
                        ?.value
                        .trim()
              || '';

                setBoardCollections(
                    board.id,
                    [
                        ...selectedCollectionIds
                    ],
                    {
                        projectId:
                  board.projectId,

                        touchModified:
                  false
                    }
                );

                touchGeneographBoard(
                    board
                );

                closeModal();

                renderGeneographEditorPreserveScroll();

                showToast(
                    'Board settings updated.'
                );
            }
        );
}

const GENEO_NODE_TYPES = new Set(['person', 'image', 'sticky', 'text', 'panel', 'shape', 'place', 'drawing']);
const GENEO_SHAPE_KINDS = Object.freeze([
    { id: 'rectangle', label: 'Rectangle' },
    { id: 'ellipse', label: 'Ellipse' },
    { id: 'diamond', label: 'Diamond' },
    { id: 'triangle', label: 'Triangle' },
    { id: 'hexagon', label: 'Hexagon' }
]);
const GENEO_STROKE_WIDTH_MIN = 1;
const GENEO_STROKE_WIDTH_MAX = 12;
const GENEO_CONNECTION_PATTERNS = ['solid', 'dashed', 'dotted', 'alternating'];
const GENEO_CONNECTION_ARROWS = ['none', 'start', 'end', 'both'];
const GENEO_CONNECTION_PATTERN_LABELS = { solid: 'Solid', dashed: 'Dashed', dotted: 'Dotted', alternating: 'Short-long dashes' };
let geneoConnectionToolRuntime = { boardId: '', overrides: {}, panelOpen: false };
let geneoCreationToolRuntime = { boardId: '', drawing: null, shape: null };

function geneoCreationToolSettings(tool)
{
    const boardId = selectedGeneographBoard()?.id || '';
    if (geneoCreationToolRuntime.boardId !== boardId)
        geneoCreationToolRuntime = { boardId, drawing: null, shape: null };
    if (!geneoCreationToolRuntime[tool])
        geneoCreationToolRuntime[tool] = {
            appearance: structuredClone(geneoNodeDefaults(tool).appearance),
            panelOpen: false,
            ...(tool === 'shape' ? { shapeKind: 'rectangle' } : {})
        };
    return geneoCreationToolRuntime[tool];
}

function geneoDefaultConnectionStyle()
{
    return { line: { color: '#D9E5E1', opacity: 100, enabled: true }, width: 2, pattern: 'solid', arrows: 'none', cornerRadius: 0, showRelationshipDates: false };
}

function geneoNormalizeConnectionDefaults(value)
{
    const fallback = geneoDefaultConnectionStyle();
    return {
        line: geneoPaintFromLegacy(value?.line, value?.color, fallback.line),
        width: Math.round(geneoNumber(value?.width, fallback.width, GENEO_STROKE_WIDTH_MIN, GENEO_STROKE_WIDTH_MAX)),
        pattern: GENEO_CONNECTION_PATTERNS.includes(value?.pattern) ? value.pattern : fallback.pattern,
        arrows: GENEO_CONNECTION_ARROWS.includes(value?.arrows) ? value.arrows : fallback.arrows,
        cornerRadius: Math.round(geneoNumber(value?.cornerRadius, fallback.cornerRadius, 0, 32)),
        showRelationshipDates: typeof value?.showRelationshipDates === 'boolean'
            ? value.showRelationshipDates : fallback.showRelationshipDates
    };
}

function geneoNormalizeConnectionOverrides(value, kind = 'visual')
{
    const result = {};
    if (value?.line) result.line = geneoPaintFromLegacy(value.line, value.line?.color, geneoDefaultConnectionStyle().line);
    if (Number.isInteger(value?.width) && value.width >= GENEO_STROKE_WIDTH_MIN && value.width <= GENEO_STROKE_WIDTH_MAX) result.width = value.width;
    if (GENEO_CONNECTION_PATTERNS.includes(value?.pattern)) result.pattern = value.pattern;
    if (kind === 'visual' && GENEO_CONNECTION_ARROWS.includes(value?.arrows)) result.arrows = value.arrows;
    if (Number.isInteger(value?.cornerRadius) && value.cornerRadius >= 0 && value.cornerRadius <= 32)
        result.cornerRadius = value.cornerRadius;
    return result;
}

function geneoEffectiveConnectionStyle(connection, diagram = selectedGeneographDiagram())
{
    const defaults = diagram?.connectionDefaults || geneoDefaultConnectionStyle();
    const overrides = connection?.style || {};
    return { ...defaults, ...overrides, arrows: connection?.kind === 'visual' ? overrides.arrows ?? defaults.arrows : 'none' };
}

function geneoConnectionToolStyle()
{
    const boardId = selectedGeneographBoard()?.id || '';
    if (geneoConnectionToolRuntime.boardId !== boardId) geneoConnectionToolRuntime = { boardId, overrides: {}, panelOpen: false };
    return { ...(selectedGeneographDiagram()?.connectionDefaults || geneoDefaultConnectionStyle()), ...geneoConnectionToolRuntime.overrides };
}

function geneoConnectionDashArray(pattern, width)
{
    if (pattern === 'dotted') return `${width} ${width * 3}`;
    if (pattern === 'alternating') return `${width * 2} ${width * 2} ${width * 6} ${width * 2}`;
    if (pattern === 'dashed') return `${width * 4} ${width * 3}`;
    return '';
}
const GENEO_GRID_SIZE = 20;
const GENEO_TOP_ROUTE_CLEARANCE = GENEO_GRID_SIZE * 4;
const GENEO_HISTORY_LIMIT = 50;
const GENEO_LAYER_NAME_LIMIT = 80;
let geneoPointerState = null;

let geneoHistoryRuntime = {
    boardId: '',
    undo: [],
    redo: []
};
let geneoObjectClipboard = null;

let geneoToolbarResizeObserver = null;

let geneoCanvasRuntime =
    createGeneoCanvasRuntime();
let geneoPaintRuntime = createGeneoPaintRuntime();
let geneoKeyboardBound = false;
let geneoShiftPressed = false;
let geneoCtrlSelectPressed = false;
let geneoCtrlSelectContext = null;
let geneoDrawPanPending = false;
let geneoPointerBound = false;
let geneoImageUploadRequestId = 0;
let geneoImageCropRuntime = null;
let geneoImageLastClick = null;

function geneoNormalizeImageCrop(value)
{
    if (!value || typeof value !== 'object') return null;
    return {
        zoom: geneoNumber(value.zoom, 1, 1, 4),
        x: geneoNumber(value.x, 0, -1, 1),
        y: geneoNumber(value.y, 0, -1, 1)
    };
}

function geneoImageCropMetrics(node, source, crop)
{
    const ratio = source.width / source.height;
    const width = Math.max(node.width, node.height * ratio);
    const height = width / ratio;
    const zoom = crop?.zoom || 1;
    const maxX = Math.max(0, (width * zoom - node.width) / (2 * node.width));
    const maxY = Math.max(0, (height * zoom - node.height) / (2 * node.height));
    return { width, height, maxX, maxY, zoom,
        x: Math.max(-maxX, Math.min(maxX, crop?.x || 0)),
        y: Math.max(-maxY, Math.min(maxY, crop?.y || 0)) };
}

function geneoImageCropStyle(node, source, crop)
{
    const metrics = geneoImageCropMetrics(node, source, crop);
    return `--geneo-crop-width:${metrics.width}px;--geneo-crop-height:${metrics.height}px;--geneo-crop-scaled-width:${metrics.width * metrics.zoom}px;--geneo-crop-scaled-height:${metrics.height * metrics.zoom}px;--geneo-crop-x:${metrics.x * node.width}px;--geneo-crop-y:${metrics.y * node.height}px;--geneo-crop-zoom:${metrics.zoom}`;
}

function geneoRefreshImageCropDom()
{
    const runtime = geneoImageCropRuntime;
    const node = runtime && getGeneographNode(runtime.nodeId);
    if (!node) return;
    const source = resolveGeneographImageSource(node);
    const metrics = geneoImageCropMetrics(node, source, runtime.draft);
    runtime.draft.x = metrics.x;
    runtime.draft.y = metrics.y;
    const style = geneoImageCropStyle(node, source, runtime.draft);
    const element = main.querySelector(`[data-geneo-node="${CSS.escape(node.id)}"]`);
    element?.querySelectorAll('.geneo-image-node-media, .geneo-image-crop-preview, .geneo-image-crop-bounds')
        .forEach(item => item.style.cssText = style);
    geneoPositionImageCropToolbar();
}

function geneoScaleImageCropFromHandle(handle, zoom)
{
    const runtime = geneoImageCropRuntime;
    const node = runtime && getGeneographNode(runtime.nodeId);
    if (!node) return;
    const source = resolveGeneographImageSource(node);
    const metrics = geneoImageCropMetrics(node, source, runtime.draft);
    const nextZoom = geneoNumber(zoom, metrics.zoom, 1, 4);
    const delta = nextZoom - metrics.zoom;
    runtime.draft.zoom = nextZoom;
    runtime.draft.x = metrics.x + (handle.includes('e') ? 1 : handle.includes('w') ? -1 : 0)
        * metrics.width * delta / (2 * node.width);
    runtime.draft.y = metrics.y + (handle.includes('s') ? 1 : handle.includes('n') ? -1 : 0)
        * metrics.height * delta / (2 * node.height);
    geneoRefreshImageCropDom();
}

function geneoFinishImageCrop(apply, { render = true, restoreFocus = true } = {})
{
    const runtime = geneoImageCropRuntime;
    if (!runtime) return;
    const node = getGeneographNode(runtime.nodeId);
    if (apply && node)
    {
        const crop = geneoNormalizeImageCrop(runtime.draft);
        if (JSON.stringify(node.imageCrop || null) !== JSON.stringify(crop))
        {
            geneoPushHistory();
            node.imageCrop = crop;
            touchGeneographBoard();
        }
    }
    geneoImageCropRuntime = null;
    if (render) renderGeneographEditorPreserveScroll({ preserveInspectorScroll: true, preserveSidebarScroll: true });
    if (restoreFocus) requestAnimationFrame(() => main.querySelector(`[data-geneo-node="${CSS.escape(runtime.nodeId)}"]`)?.focus({ preventScroll: true }));
}

function geneoBeginImageCrop(node)
{
    const source = resolveGeneographImageSource(node);
    if (!source.available || !source.photo?.src || !(source.width > 0 && source.height > 0)) return;
    selectGeneographNode(node.id);
    geneoImageCropRuntime = {
        boardId: selectedGeneographBoard().id,
        nodeId: node.id,
        draft: geneoNormalizeImageCrop(node.imageCrop) || { zoom: 1, x: 0, y: 0 },
        initial: geneoNormalizeImageCrop(node.imageCrop) || { zoom: 1, x: 0, y: 0 },
        drag: null
    };
    renderGeneographEditorPreserveScroll({ preserveInspectorScroll: true, preserveSidebarScroll: true });
    requestAnimationFrame(() => main.querySelector('[data-geneo-image-crop-handle="se"]')?.focus({ preventScroll: true }));
}

function geneoPositionImageCropToolbar()
{
    const toolbar = main.querySelector('[data-geneo-image-crop-toolbar]');
    const bounds = main.querySelector('.geneo-image-crop-bounds');
    const viewport = main.querySelector('[data-geneo-canvas-viewport]');
    const node = toolbar?.closest('[data-geneo-node]');
    if (!toolbar || !bounds || !viewport || !node) return;
    const view = viewport.getBoundingClientRect();
    const photo = bounds.getBoundingClientRect();
    const frame = node.getBoundingClientRect();
    const zoom = Math.max(.25, state.geneoZoom / 100);
    const width = toolbar.offsetWidth * zoom;
    const height = toolbar.offsetHeight * zoom;
    const centerX = Math.max(view.left + 8 + width / 2,
        Math.min(view.right - 8 - width / 2, photo.left + photo.width / 2));
    const below = photo.bottom + 8;
    const above = photo.top - height - 8;
    const top = below + height <= view.bottom - 8 ? below
        : above >= view.top + 8 ? above
            : Math.max(view.top + 8, Math.min(view.bottom - height - 8, below));
    toolbar.style.left = `${(centerX - frame.left) / zoom}px`;
    toolbar.style.top = `${(top - frame.top) / zoom}px`;
    toolbar.style.bottom = 'auto';
    toolbar.style.marginLeft = '0';
}

function geneoNumber(value, fallback, min = -Infinity, max = Infinity)
{
    const number = Number(value);
    return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
}

function geneoEffectiveCanvasTool()
{
    return geneoCtrlSelectPressed && state.activeModule === 'Geneograph'
        && state.geneoView === 'board' && !modalBackdrop.classList.contains('open')
        && geneoCtrlSelectContext?.tool === state.geneoTool
        && geneoCtrlSelectContext?.boardId === selectedGeneographBoard()?.id
        ? 'select' : state.geneoTool;
}

function setGeneoCtrlSelectPressed(pressed)
{
    if (geneoCtrlSelectPressed === pressed) return;
    geneoCtrlSelectPressed = pressed;
    geneoCtrlSelectContext = pressed
        ? { tool: state.geneoTool, boardId: selectedGeneographBoard()?.id } : null;
    main.querySelector('.geneo-canvas-stage')?.classList.toggle('temporary-select-tool', pressed);
    if (pressed) setGeneographConnectionHoverTarget(null);
}
function normalizeGeneographLayerName(value)
{
    return String(value ?? '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, GENEO_LAYER_NAME_LIMIT);
}

function snapGeneographCoordinate(value)
{
    const number = geneoNumber(value, 0, -GENEO_WORLD_LIMIT, GENEO_WORLD_LIMIT);
    return selectedGeneographDiagram()?.canvas.snapToGrid
        ? Math.round(number / GENEO_GRID_SIZE) * GENEO_GRID_SIZE
        : number;
}

function snapGeneographPoint(point)
{
    if (!point) return null;
    return {
        x: snapGeneographCoordinate(point.x),
        y: snapGeneographCoordinate(point.y)
    };
}

const GENEO_BOARD_COLORS = [
    { color: '#101817', name: 'Ink' },
    { color: '#26312E', name: 'Graphite' },
    { color: '#D9E5E1', name: 'Mist' },
    { color: '#F3F1E9', name: 'Paper' },
    { color: '#173029', name: 'Deep moss' },
    { color: '#172A32', name: 'Archive blue' },
    { color: '#2D2437', name: 'Plum' },
    { color: '#302B1D', name: 'Sepia' },
    { color: '#2FAE74', name: 'Geneograph green' },
    { color: '#62D99A', name: 'Mint' },
    { color: '#4FB3A5', name: 'Teal' },
    { color: '#5DADEC', name: 'Blue' },
    { color: '#AA8CE8', name: 'Violet' },
    { color: '#D4AA6B', name: 'Amber' },
    { color: '#D9828B', name: 'Rose' },
    { color: '#C75B5B', name: 'Conflict red' }
];

function normalizeGeneoHexColor(value, fallback = '#101817')
{
    const text = String(value || '').trim();
    const short = text.match(/^#?([0-9a-f]{3})$/i);
    const full = text.match(/^#?([0-9a-f]{6})$/i);
    if (short)
    {
        return `#${short[1].split('').map(character => `${character}${character}`).join('')}`.toUpperCase();
    }
    if (full) return `#${full[1]}`.toUpperCase();
    const safeFallback = String(fallback || '#101817').match(/^#?([0-9a-f]{6})$/i);
    return safeFallback ? `#${safeFallback[1]}`.toUpperCase() : '#101817';
}

function normalizeGeneoPaint(value, fallback = {}, {
    forceEnabled = false,
    forceOpacity = null
} = {})
{
    const source = value && typeof value === 'object' ? value : {};
    const defaultPaint = fallback && typeof fallback === 'object' ? fallback : {};
    return {
        color: normalizeGeneoHexColor(source.color, defaultPaint.color || '#101817'),
        opacity: forceOpacity === null
            ? Math.round(geneoNumber(source.opacity, defaultPaint.opacity ?? 100, 0, 100))
            : Math.round(geneoNumber(forceOpacity, 100, 0, 100)),
        enabled: forceEnabled ? true : source.enabled !== false
    };
}

function geneoPaintFromLegacy(sourcePaint, legacyColor, fallback, options = {})
{
    if (sourcePaint && typeof sourcePaint === 'object')
    {
        return normalizeGeneoPaint(sourcePaint, fallback, options);
    }
    return normalizeGeneoPaint({
        color: legacyColor,
        opacity: options.legacyOpacity ?? fallback.opacity,
        enabled: options.legacyEnabled ?? fallback.enabled
    }, fallback, options);
}

function geneoHexToRgb(color)
{
    const normalized = normalizeGeneoHexColor(color);
    return {
        r: Number.parseInt(normalized.slice(1, 3), 16),
        g: Number.parseInt(normalized.slice(3, 5), 16),
        b: Number.parseInt(normalized.slice(5, 7), 16)
    };
}

function geneoPaintCssColor(paint, { disabledColor = 'transparent' } = {})
{
    if (!paint?.enabled) return disabledColor;
    const { r, g, b } = geneoHexToRgb(paint.color);
    return `rgba(${r}, ${g}, ${b}, ${geneoNumber(paint.opacity, 100, 0, 100) / 100})`;
}

function geneoPersonActionGapColor(paint)
{
    return paint?.enabled && geneoNumber(paint.opacity, 100, 0, 100) === 100
        ? geneoPaintCssColor(paint)
        : 'transparent';
}

function isCanonicalGeneoPaint(paint, { mustBeEnabled = false, fixedOpacity = null } = {})
{
    return Boolean(
        paint
        && typeof paint === 'object'
        && /^#[0-9A-F]{6}$/.test(paint.color)
        && Number.isInteger(paint.opacity)
        && paint.opacity >= 0
        && paint.opacity <= 100
        && typeof paint.enabled === 'boolean'
        && (!mustBeEnabled || paint.enabled)
        && (fixedOpacity === null || paint.opacity === fixedOpacity)
    );
}

function geneoAppearance(value, defaults = {}, nodeType = '')
{
    const source = value && typeof value === 'object' ? value : {};
    const legacyStrokeType = ['dashed', 'solid', 'none'].includes(source.strokeType)
        ? source.strokeType
        : null;
    const defaultPattern = defaults.strokePattern === 'dashed' ? 'dashed' : 'solid';
    const result = { ...defaults, ...source };
    if (nodeType === 'image') delete result.fill;
    else result.fill = geneoPaintFromLegacy(
        source.fill,
        source.backgroundColor,
        defaults.fill,
        { legacyOpacity: nodeType === 'panel' ? 68 : 100 }
    );
    result.stroke = geneoPaintFromLegacy(
        source.stroke,
        source.strokeColor,
        defaults.stroke,
        { legacyEnabled: legacyStrokeType !== 'none' }
    );
    result.text = geneoPaintFromLegacy(
        source.text,
        source.textColor,
        defaults.text,
        { forceEnabled: true }
    );
    if (nodeType === 'person')
    {
        const sourceOverrides =
            source.paintOverrides
          && typeof source.paintOverrides
            === 'object'
                ? source.paintOverrides
                : {};

        result.paintOverrides = {
            fill:
            sourceOverrides.fill
            === true,

            stroke:
            sourceOverrides.stroke
            === true,

            text:
            sourceOverrides.text
            === true
        };
        result.styleOverrides = {
            strokeWidth: source.styleOverrides?.strokeWidth === true
                || (!source.styleOverrides && source.strokeWidth != null && source.strokeWidth !== 2),
            strokePattern: source.styleOverrides?.strokePattern === true
                || (!source.styleOverrides && source.strokePattern === 'dashed')
        };
    }
    else
    {
        delete result.paintOverrides;
    }
    result.strokePattern = legacyStrokeType && legacyStrokeType !== 'none'
        ? legacyStrokeType
        : source.strokePattern === 'dashed'
            ? 'dashed'
            : defaultPattern;
    result.strokeWidth = Math.round(geneoNumber(
        source.strokeWidth,
        defaults.strokeWidth || GENEO_STROKE_WIDTH_MIN,
        GENEO_STROKE_WIDTH_MIN,
        GENEO_STROKE_WIDTH_MAX
    ));
    if (Number.isFinite(Number(defaults.cornerRadius)))
    {
        result.cornerRadius = Math.round(geneoNumber(
            source.cornerRadius,
            defaults.cornerRadius,
            0,
            32
        ));
    }
    else
    {
        delete result.cornerRadius;
    }
    if (['text', 'sticky', 'place'].includes(nodeType))
    {
        result.fontSize = Math.round(geneoNumber(source.fontSize, defaults.fontSize, 8, 72));
    }
    else
    {
        delete result.fontSize;
    }
    delete result.backgroundColor;
    delete result.strokeColor;
    delete result.textColor;
    delete result.strokeType;
    return result;
}

function geneoFilenameStem(filename)
{
    return String(filename || '')
        .trim()
        .replace(/\.[^.]+$/, '')
        || 'Image';
}

function geneoImageRecordName(record)
{
    return String(
        record?.title
        || record?.displayName
        || record?.filename
        || ''
    ).trim() || 'Image';
}

function normalizeGeneographImageRef(node)
{
    const source = node?.imageRef;

    if (
        source
        && ['project', 'board'].includes(source.scope)
        && String(source.id || '').trim()
    )
    {
        return {
            scope: source.scope,
            id: String(source.id).trim()
        };
    }

    // One-time migration for the previous Geneograph image model.
    if (String(node?.photoId || '').trim())
    {
        return {
            scope: 'project',
            id: String(node.photoId).trim()
        };
    }

    return null;
}

function normalizeGeneographShapeKind(value)
{
    const kind = String(value || '').trim().toLowerCase();
    if (kind === 'rounded-rectangle') return 'rectangle';
    return GENEO_SHAPE_KINDS.some(shape => shape.id === kind)
        ? kind
        : 'rectangle';
}

function geneoShapeLabel(value)
{
    const kind = normalizeGeneographShapeKind(value);
    return GENEO_SHAPE_KINDS.find(shape => shape.id === kind)?.label || 'Rectangle';
}

function normalizeGeneographDrawingPoints(value)
{
    const points = [];
    (Array.isArray(value) ? value : []).forEach(point =>
    {
        const x = Number(point?.x);
        const y = Number(point?.y);
        if (!Number.isFinite(x) || !Number.isFinite(y)) return;
        const next = {
            x: geneoNumber(x, 0, 0, 1),
            y: geneoNumber(y, 0, 0, 1)
        };
        const previous = points.at(-1);
        if (previous && Math.hypot(next.x - previous.x, next.y - previous.y) < 0.0001) return;
        points.push(next);
    });
    return points;
}

function normalizeGeneographPlaceRef(node, projectId = selectedGeneographBoard()?.projectId || '')
{
    const source = node?.placeRef;
    if (source?.scope === 'project')
    {
        const id = String(source.id || '').trim();
        const place = id ? getPlace(id) : null;
        if (place && !place.deleted && place.projectId === projectId)
        {
            return {
                scope: 'project',
                id,
                fallbackName: String(placePrimaryName(place) || place.name || source.fallbackName || 'Place').trim().slice(0, 160)
            };
        }
        const fallbackName = String(source.fallbackName || node?.placeName || '').trim().slice(0, 160);
        return fallbackName ? { scope: 'board', name: fallbackName } : null;
    }
    if (source?.scope === 'board')
    {
        const name = String(source.name || '').replace(/\s+/g, ' ').trim().slice(0, 160);
        return name ? { scope: 'board', name } : null;
    }
    const legacyPlaceId = String(node?.placeId || '').trim();
    const legacyPlace = legacyPlaceId ? getPlace(legacyPlaceId) : null;
    if (legacyPlace && !legacyPlace.deleted && legacyPlace.projectId === projectId)
    {
        return {
            scope: 'project',
            id: legacyPlace.id,
            fallbackName: String(placePrimaryName(legacyPlace) || legacyPlace.name || 'Place').trim().slice(0, 160)
        };
    }
    const legacyName = String(node?.placeName || node?.title || '').replace(/\s+/g, ' ').trim().slice(0, 160);
    return legacyName ? { scope: 'board', name: legacyName } : null;
}

function resolveGeneographPlace(node, board = selectedGeneographBoard())
{
    const ref = normalizeGeneographPlaceRef(node, board?.projectId || '');
    if (!ref) return { ref: null, place: null, linked: false, name: 'Place' };
    if (ref.scope === 'project')
    {
        const place = getPlace(ref.id);
        if (place && !place.deleted && place.projectId === board?.projectId)
        {
            return {
                ref,
                place,
                linked: true,
                name: placePrimaryName(place) || place.name || ref.fallbackName || 'Place'
            };
        }
    }
    return {
        ref,
        place: null,
        linked: false,
        name: ref.name || ref.fallbackName || 'Place'
    };
}

function normalizeGeneographBoardAsset(asset)
{
    if (!asset || typeof asset !== 'object') return null;

    const id = String(asset.id || '').trim();
    const src = String(asset.src || '').trim();
    const mimeType = String(asset.mimeType || '').trim();

    if (
        !id
        || !src
        || !PHOTO_UPLOAD_ALLOWED_TYPES.includes(mimeType)
    )
    {
        return null;
    }

    const filename = String(
        asset.filename || 'Uploaded image'
    ).trim() || 'Uploaded image';

    const now = new Date().toISOString();

    return {
        id,
        kind: 'photo',
        filename,
        displayName:
          String(asset.displayName || '').trim()
          || geneoFilenameStem(filename),
        src,
        mimeType,
        width: geneoNumber(asset.width, 0, 1),
        height: geneoNumber(asset.height, 0, 1),
        sizeBytes: geneoNumber(asset.sizeBytes, 0, 0),
        createdAt:
          Number.isFinite(Date.parse(asset.createdAt))
              ? asset.createdAt
              : now,
        updatedAt:
          Number.isFinite(Date.parse(asset.updatedAt))
              ? asset.updatedAt
              : now
    };
}

function getGeneographBoardAsset(
    assetId,
    diagram = selectedGeneographDiagram()
)
{
    return (
        diagram?.assets || []
    ).find(asset => asset.id === assetId) || null;
}

function resolveGeneographImageSource(
    node,
    {
        board = selectedGeneographBoard(),
        diagram = board?.diagram
    } = {}
)
{
    const ref = normalizeGeneographImageRef(node);

    if (!ref)
    {
        return {
            ref: null,
            available: false,
            photo: null,
            displayName: 'Image',
            filename: '',
            sourceLabel: 'No source'
        };
    }

    if (ref.scope === 'project')
    {
        const photo = getPhoto(ref.id, {
            projectId: board?.projectId || ''
        });

        if (!photo || photo.deletedAt)
        {
            return {
                ref,
                available: false,
                photo: null,
                displayName: 'Image',
                filename: '',
                sourceLabel: 'Project photo'
            };
        }

        return {
            ref,
            available: true,
            photo,
            displayName: geneoImageRecordName(photo),
            filename: String(photo.filename || photo.title || '').trim(),
            sourceLabel: 'Project photo',
            width: Number(photo.width) || 0,
            height: Number(photo.height) || 0,
            sizeBytes: Number(photo.sizeBytes) || 0
        };
    }

    const asset = getGeneographBoardAsset(ref.id, diagram);

    if (!asset)
    {
        return {
            ref,
            available: false,
            photo: null,
            displayName: 'Image',
            filename: '',
            sourceLabel: 'Board upload'
        };
    }

    return {
        ref,
        available: true,
        photo: asset,
        displayName: geneoImageRecordName(asset),
        filename: String(asset.filename || '').trim(),
        sourceLabel: 'Board upload',
        width: Number(asset.width) || 0,
        height: Number(asset.height) || 0,
        sizeBytes: Number(asset.sizeBytes) || 0
    };
}

function geneoImageSourceName(node)
{
    const source = resolveGeneographImageSource(node);
    return source.available ? source.displayName : 'Image';
}

function pruneGeneographBoardAssets(
    diagram = selectedGeneographDiagram()
)
{
    if (!diagram) return false;

    const referencedIds = new Set(
        diagram.nodes
            .filter(node =>
                node.type === 'image'
            && node.imageRef?.scope === 'board'
            && node.imageRef.id
            )
            .map(node => node.imageRef.id)
    );
    diagram.people?.forEach(person =>
    {
        if (person.photoAssetId) referencedIds.add(person.photoAssetId);
    });

    const assets = Array.isArray(diagram.assets)
        ? diagram.assets
        : [];

    const nextAssets = assets.filter(asset =>
        referencedIds.has(asset.id)
    );

    if (nextAssets.length === assets.length) return false;

    diagram.assets = nextAssets;
    return true;
}

function uniqueGeneographBoardAssetId(
    diagram = selectedGeneographDiagram()
)
{
    let id;

    do
    {
        id = createRuntimeId('geneo-asset');
    } while (
        diagram?.assets?.some(asset => asset.id === id)
    );

    return id;
}

function createGeneographBoardAsset(
    draft,
    diagram = selectedGeneographDiagram()
)
{
    if (!diagram || !photoUploadDraftIsValid(draft)) return null;

    diagram.assets = Array.isArray(diagram.assets)
        ? diagram.assets
        : [];

    const now = new Date().toISOString();
    const filename = String(
        draft.filename || 'Uploaded image'
    ).trim() || 'Uploaded image';

    const asset = {
        id: uniqueGeneographBoardAssetId(diagram),
        kind: 'photo',
        filename,
        displayName: geneoFilenameStem(filename),
        src: draft.src,
        mimeType: draft.mimeType,
        width: draft.width,
        height: draft.height,
        sizeBytes: draft.sizeBytes,
        createdAt: now,
        updatedAt: now
    };

    diagram.assets.push(asset);
    return asset;
}

function geneoImageNodeSize(source)
{
    const defaults = geneoNodeDefaults('image');
    const sourceWidth = Number(source?.width);
    const sourceHeight = Number(source?.height);

    if (
        !Number.isFinite(sourceWidth)
        || !Number.isFinite(sourceHeight)
        || sourceWidth <= 0
        || sourceHeight <= 0
    )
    {
        return {
            width: defaults.width,
            height: defaults.height
        };
    }

    // Exact for normal photo ratios; extreme panoramas remain manageable
    // and are shown uncropped through object-fit: contain.
    const ratio = Math.min(
        2.4,
        Math.max(.45, sourceWidth / sourceHeight)
    );

    let width = defaults.width;
    let height = width / ratio;

    if (height < defaults.minHeight)
    {
        height = defaults.minHeight;
        width = height * ratio;
    }

    if (height > 360)
    {
        height = 360;
        width = height * ratio;
    }

    return {
        width: Math.round(Math.max(defaults.minWidth, width)),
        height: Math.round(Math.max(defaults.minHeight, height))
    };
}

function normalizeGeneographRuntimeData()
{
    state.geneoShapeKind = normalizeGeneographShapeKind(state.geneoShapeKind);
    const projects = new Set((sampleData.projects || []).map(project => project.id));
    const projectPeople = new Map();
    (sampleData.people || []).forEach(person =>
    {
        if (!projectPeople.has(person.projectId)) projectPeople.set(person.projectId, new Set());
        projectPeople.get(person.projectId).add(person.id);
    });
    sampleData.boardCollections = (sampleData.boardCollections || []).filter(Boolean).map(collection => ({
        id: String(collection.id || '').trim(),
        projectId: String(collection.projectId || ''),
        name: String(collection.name || 'Untitled collection').trim(),
        description: String(collection.description || '').trim()
    })).filter(collection => collection.id && projects.has(collection.projectId));
    sampleData.boards = (sampleData.boards || []).filter(Boolean).map(board =>
        normalizeGeneographBoardRecord(board, projectPeople));
    const boardIds = new Set(sampleData.boards.map(board => board.id));
    Object.keys(state.geneoBoardViewports || {}).forEach(boardId =>
    {
        if (!boardIds.has(boardId)) clearGeneographViewport(boardId);
    });
}

function normalizeGeneographBoardRecord(board, projectPeople)
{
        board.id = String(board.id || createRuntimeId('board'));
        board.projectId = String(board.projectId || '');
        board.title = String(board.title || 'Untitled board').trim() || 'Untitled board';
        board.description = String(board.description || '').trim();
        board.collectionIds = normalizeGeneographIdArray(board.collectionIds);
        board.favorite = Boolean(board.favorite);
        board.archived = Boolean(board.archived);
        board.modifiedAt = Number.isFinite(Date.parse(board.modifiedAt)) ? board.modifiedAt : new Date().toISOString();
        board.modified = String(board.modified || formatProjectModified?.(board) || 'Just now');
        const source = board.diagram && typeof board.diagram === 'object' ? board.diagram : createEmptyGeneographDiagram();
        const canvas = source.canvas && typeof source.canvas === 'object' ? source.canvas : {};
        const backgroundPattern = ['dots', 'grid', 'clear'].includes(canvas.backgroundPattern)
            ? canvas.backgroundPattern
            : canvas.gridVisible === false ? 'clear' : 'dots';
        const diagram = {
            canvas: {
                backgroundPaint: geneoPaintFromLegacy(
                    canvas.backgroundPaint,
                    canvas.backgroundColor,
                    { color: '#0F1413', opacity: 100, enabled: true },
                    { forceEnabled: true, forceOpacity: 100 }
                ),
                backgroundPattern,
                snapToGrid: Boolean(canvas.snapToGrid),
                alwaysShowSockets: Boolean(canvas.alwaysShowSockets),
                colorPersonCardsByGender:
              Boolean(canvas.colorPersonCardsByGender)
            },
            personCardDefaults:
            normalizeGeneographPersonCardSettings(
                source.personCardDefaults
            ),
            cardAppearanceDefaults: normalizeGeneoCardAppearances(
                source.cardAppearanceDefaults,
                source.personCardDefaults?.cornerRadius ?? 8
            ),
            connectionDefaults: geneoNormalizeConnectionDefaults(source.connectionDefaults),
            assets: [],
            people: [],
            families: [],
            nodes: [],
            connections: []
        };
        const assetIds = new Set();

        (Array.isArray(source.assets) ? source.assets : [])
            .forEach(sourceAsset =>
            {
                const asset = normalizeGeneographBoardAsset(sourceAsset);

                if (!asset || assetIds.has(asset.id)) return;

                assetIds.add(asset.id);
                diagram.assets.push(asset);
            });
        const personIds = new Set();
        (Array.isArray(source.people) ? source.people : []).forEach(person =>
        {
            if (!person || !person.id || personIds.has(person.id)) return;
            personIds.add(person.id);
            const treePersonId = person.treePersonId ? String(person.treePersonId) : null;
            const names = normalizeGeneographPersonNames(person);
            const legacyDeath = formatGenealogyDateLabel(person.death);
            const livingStatus = ['Living', 'Deceased', 'Unknown'].includes(person.livingStatus)
                ? person.livingStatus
                : legacyDeath ? 'Deceased' : 'Living';
            diagram.people.push({
                id: String(person.id), treePersonId,
                syncState: ['local', 'linked', 'modified'].includes(person.syncState) ? person.syncState : (treePersonId ? 'linked' : 'local'),
                names,
                gender: ['male', 'female', 'unknown'].includes(String(person.gender || person.sex || '').toLowerCase())
                    ? String(person.gender || person.sex).toLowerCase()
                    : 'unknown',
                livingStatus,
                birth: normalizeGeneographPersonVital(person.birth, board.projectId),
                death: normalizeGeneographPersonVital(person.death, board.projectId),
                photoId: person.photoId || null,
                photoAssetId: assetIds.has(person.photoAssetId) ? person.photoAssetId : null,
                photoCrop:
              person.photoCrop
                  ? normalizePersonPhotoCrop(
                      person.photoCrop
                  )
                  : null,
                photoRegion: normalizeFaceRegion(person.photoRegion, FACE_REGION_MIN)
            });
        });
        const nodeIds = new Set();

        (Array.isArray(source.nodes) ? source.nodes : [])
            .forEach((node, index) =>
            {
                if (
                    !node
              || !node.id
              || nodeIds.has(node.id)
              || !GENEO_NODE_TYPES.has(node.type)
                )
                {
                    return;
                }

                if (
                    node.type === 'person'
              && !personIds.has(node.personId)
                )
                {
                    return;
                }

                nodeIds.add(node.id);

                const defaults = geneoNodeDefaults(node.type);
                const legacyRoundedShape = node.type === 'shape'
              && String(node.shapeKind || '').trim().toLowerCase() === 'rounded-rectangle';
                const appearanceDefaults = legacyRoundedShape
                    ? { ...defaults.appearance, cornerRadius: 12 }
                    : defaults.appearance;

                const normalizedNode = {
                    ...node,
                    id: String(node.id),
                    type: node.type,
                    name: String(node.name || '').trim().slice(0, 80),
                    x: geneoNumber(
                        node.x,
                        120 + index * 18,
                        -GENEO_WORLD_LIMIT,
                        GENEO_WORLD_LIMIT
                    ),
                    y: geneoNumber(
                        node.y,
                        120 + index * 18,
                        -GENEO_WORLD_LIMIT,
                        GENEO_WORLD_LIMIT
                    ),
                    width: geneoNumber(
                        node.width,
                        defaults.width,
                        defaults.minWidth,
                        node.type === 'person'
                            ? defaults.maxWidth
                            : 10000
                    ),
                    height: geneoNumber(
                        node.height,
                        defaults.height,
                        defaults.minHeight,
                        node.type === 'person'
                            ? defaults.maxHeight
                            : 10000
                    ),
                    parentPanelId: node.parentPanelId || null,
                    order: geneoNumber(node.order, index + 1),
                    visible: node.visible !== false,
                    locked: Boolean(node.locked),
                    appearance: geneoAppearance(
                        node.appearance,
                        appearanceDefaults,
                        node.type
                    )
                };
                if (node.type === 'person')
                {
                    const sourcePersonCard =
                        node.personCard
                && typeof node.personCard === 'object'
                            ? node.personCard
                            : {};

                    const legacyStyle =
                        geneoPersonCardSettingValueIsValid(
                            'style',
                            sourcePersonCard.style
                        )
                            ? sourcePersonCard.style
                            : diagram.personCardDefaults.style;
                    if (!source.cardAppearanceDefaults && !diagram.canvas.colorPersonCardsByGender)
                    {
                        const neutral = diagram.cardAppearanceDefaults.neutral;
                        for (const property of ['fill', 'stroke', 'text'])
                        {
                            if (node.appearance?.paintOverrides?.[property] === true) continue;
                            const expected = property === 'stroke' && legacyStyle !== 'standard'
                                ? { ...neutral.stroke, enabled: true } : neutral[property];
                            normalizedNode.appearance.paintOverrides[property] =
                                JSON.stringify(normalizedNode.appearance[property]) !== JSON.stringify(expected);
                        }
                    }

                    const legacyDefaultHeight =
                        legacyStyle === 'standard'
                && Math.abs(
                    Number(node.height) - 220
                ) < .5;

                    const legacyPhotoOverride =
                        sourcePersonCard.custom === true
                && typeof sourcePersonCard
                    .fields?.photo === 'boolean'
                && !Object.hasOwn(
                    sourcePersonCard.photoByStyle
                    || {},
                    legacyStyle
                );

                    const personCardSource =
                        legacyPhotoOverride
                            ? {
                                ...sourcePersonCard,
                                fields: {
                                    ...sourcePersonCard.fields,
                                    photo: undefined
                                },
                                photoByStyle: {
                                    ...sourcePersonCard.photoByStyle,
                                    [legacyStyle]:
                          sourcePersonCard
                              .fields.photo
                                }
                            }
                            : sourcePersonCard;

                    normalizedNode.personCard =
                        normalizeGeneographPersonCardOverrides(
                            personCardSource,
                            legacyDefaultHeight
                                ? 'auto'
                                : 'manual',
                            diagram.personCardDefaults.style
                        );

                    if (legacyStyle === 'chart' && node.chartCardLayoutVersion !== 1)
                    {
                        const width = Math.max(normalizedNode.width, 420);
                        const height = Math.max(normalizedNode.height, GENEO_PERSON_CARD_GEOMETRY.chart.height);
                        normalizedNode.x -= (width - normalizedNode.width) / 2;
                        normalizedNode.y -= (height - normalizedNode.height) / 2;
                        normalizedNode.width = width;
                        normalizedNode.height = height;
                    }

                    if (legacyStyle === 'portrait' && node.portraitCardLayoutVersion !== 1)
                    {
                        const width = Math.max(normalizedNode.width, 235);
                        const height = Math.max(normalizedNode.height, 360);
                        normalizedNode.x -= (width - normalizedNode.width) / 2;
                        normalizedNode.y -= (height - normalizedNode.height) / 2;
                        normalizedNode.width = width;
                        normalizedNode.height = height;
                    }

                    ensureGeneographPersonCardSize(
                        normalizedNode,
                        diagram
                    );
                }
                if (node.type === 'shape')
                {
                    normalizedNode.shapeKind = normalizeGeneographShapeKind(node.shapeKind);
                }
                else
                {
                    delete normalizedNode.shapeKind;
                }
                if (node.type === 'drawing')
                {
                    normalizedNode.points = normalizeGeneographDrawingPoints(node.points);
                    if (normalizedNode.points.length < 2) return;
                }
                else
                {
                    delete normalizedNode.points;
                }
                if (node.type === 'place')
                {
                    normalizedNode.placeRef =
                        normalizeGeneographPlaceRef(
                            node,
                            board.projectId
                        );

                    if (!normalizedNode.placeRef)
                    {
                        return;
                    }

                    normalizedNode.placeSizeMode =
                        node.placeSizeMode === 'manual'
                            ? 'manual'
                            : 'auto';

                    delete normalizedNode.placeId;
                    delete normalizedNode.placeName;
                    delete normalizedNode.title;
                }
                else
                {
                    delete normalizedNode.placeRef;
                    delete normalizedNode.placeSizeMode;
                }
                if (node.type === 'panel')
                {
                    normalizedNode.title =
                        String(node.title ?? '')
                            .trim()
                            .slice(0, 160);

                    normalizedNode.description =
                        String(node.description || '')
                            .trim()
                            .slice(0, 500);
                }
                else
                {
                    delete normalizedNode.description;
                }

                if (node.type === 'image')
                {
                    const imageRef = normalizeGeneographImageRef(node);
                    normalizedNode.imageRef = imageRef;
                    normalizedNode.imageCrop = geneoNormalizeImageCrop(node.imageCrop);

                    // Preserve a genuinely custom legacy title as the new layer
                    // name, but do not retain duplicated media titles.
                    const legacyTitle = String(node.title || '').trim();

                    let referencedRecord = null;

                    if (imageRef?.scope === 'project')
                    {
                        referencedRecord = getPhoto(imageRef.id, {
                            projectId: board.projectId
                        });
                    }
                    else if (imageRef?.scope === 'board')
                    {
                        referencedRecord = diagram.assets.find(
                            asset => asset.id === imageRef.id
                        ) || null;
                    }

                    const implicitNames = new Set(
                        [
                            referencedRecord?.title,
                            referencedRecord?.displayName,
                            referencedRecord?.filename,
                            geneoFilenameStem(referencedRecord?.filename)
                        ]
                            .map(value => String(value || '').trim())
                            .filter(Boolean)
                    );

                    if (
                        !normalizedNode.name
                && legacyTitle
                && !implicitNames.has(legacyTitle)
                    )
                    {
                        normalizedNode.name = legacyTitle.slice(0, 80);
                    }

                    delete normalizedNode.photoId;
                    delete normalizedNode.title;
                }

                diagram.nodes.push(normalizedNode);
            });
        diagram.nodes.forEach(node =>
        {
            const parent = diagram.nodes.find(candidate => candidate.id === node.parentPanelId && candidate.type === 'panel');
            if (!parent || parent.id === node.id) node.parentPanelId = null;
        });
        pruneGeneographBoardAssets(diagram);
        const familyIds = new Set();
        (Array.isArray(source.families) ? source.families : []).forEach(family =>
        {
            if (!family || !family.id || familyIds.has(family.id)) return;
            const partnerIds = normalizeGeneographIdArray(family.partnerIds).filter(id => personIds.has(id)).slice(0, 2);
            const children = [];
            (Array.isArray(family.children) ? family.children : []).forEach(child =>
            {
                if (!child || !personIds.has(child.personId) || children.some(item => item.personId === child.personId)) return;
                children.push({ personId: child.personId, parentageType: String(child.parentageType || 'biological') });
            });
            if (!partnerIds.length && !children.length) return;
            familyIds.add(family.id);
            diagram.families.push({
                id: String(family.id),
                partnerIds,
                children,
                relationshipType: String(family.relationshipType || 'Married'),
                relationshipStatus: String(family.relationshipStatus || 'active'),
                marriageType: String(family.marriageType || ''),
                events: Array.isArray(family.events) ? family.events.map(event => ({ ...event, date: normalizeGenealogyDateInput(event.date || event) })) : []
            });
        });
        const connectionIds = new Set();
        (Array.isArray(source.connections) ? source.connections : []).forEach(connection =>
        {
            if (!connection || !connection.id || connectionIds.has(connection.id)) return;
            const sourceValid = connection.source?.nodeId ? nodeIds.has(connection.source.nodeId) : familyIds.has(connection.source?.familyId);
            const targetValid = connection.target?.nodeId ? nodeIds.has(connection.target.nodeId) : familyIds.has(connection.target?.familyId);
            if (!sourceValid || !targetValid) return;
            connectionIds.add(connection.id);
            diagram.connections.push({
                id: String(connection.id),
                kind: ['family-partner', 'family-child', 'family-sibling', 'visual'].includes(connection.kind) ? connection.kind : 'visual',
                visible: connection.visible !== false,
                name: normalizeGeneographLayerName(
                    connection.name
                ),
                familyId: familyIds.has(connection.familyId) ? connection.familyId : null,
                source: { ...connection.source }, target: { ...connection.target },
                style: geneoNormalizeConnectionOverrides(connection.style, connection.kind),
                ...(typeof connection.showRelationshipDates === 'boolean'
                    ? { showRelationshipDates: connection.showRelationshipDates } : {}),
                route: {
                    mode: connection.route?.mode === 'manual' ? 'manual' : 'auto',
                    waypoints: (Array.isArray(connection.route?.waypoints) ? connection.route.waypoints : []).map(point => ({
                        x: geneoNumber(point?.x, 0, -GENEO_WORLD_LIMIT, GENEO_WORLD_LIMIT),
                        y: geneoNumber(point?.y, 0, -GENEO_WORLD_LIMIT, GENEO_WORLD_LIMIT)
                    })),
                    ...(connection.kind === 'family-child' && connection.route?.mode !== 'manual'
                        && Number.isFinite(connection.route?.railY)
                        ? { railY: geneoNumber(connection.route.railY, 0, -GENEO_WORLD_LIMIT, GENEO_WORLD_LIMIT) }
                        : {})
                }
            });
        });
        board.diagram = diagram;
        delete board.people;
        delete board.evidence;
        delete board.questions;
    return board;
}

function geneoNodeDefaults(type)
{
    const common = {
        appearance: {
            fill: { color: '#18211F', opacity: 100, enabled: true },
            stroke: { color: '#52615D', opacity: 100, enabled: true },
            strokeWidth: 1,
            strokePattern: 'solid',
            text: { color: '#F1F5F3', opacity: 100, enabled: true }
        }
    };

    if (type === 'person')
    {
        const geometry =
            GENEO_PERSON_CARD_GEOMETRY
                .standard;

        return {
            ...common,

            appearance: {
                ...common.appearance,

                paintOverrides: {
                    fill: false,
                    stroke: false,
                    text: false
                }
            },

            width:
            geometry.width,

            height:
            geometry.height,

            /*
           * Normalization uses the full style
           * envelope, then applies the selected
           * style limits.
           */
            minWidth: 170,
            maxWidth: 700,
            minHeight: 100,
            maxHeight: 660
        };
    }

    if (type === 'image')
    {
        const appearance = { ...common.appearance, cornerRadius: 8 };
        delete appearance.fill;
        return {
            ...common,
            appearance,
            width: 280,
            height: 200,
            minWidth: 160,
            minHeight: 120
        };
    }

    if (type === 'sticky')
    {
        return {
            ...common,
            width: 220,
            height: 200,
            minWidth: 160,
            minHeight: 120,
            appearance: {
                ...common.appearance,
                fill: {
                    color: '#D4AA6B',
                    opacity: 100,
                    enabled: true
                },
                stroke: {
                    color: '#A77C3F',
                    opacity: 100,
                    enabled: true
                },
                strokeWidth: 1,
                strokePattern: 'solid',
                text: {
                    color: '#241C10',
                    opacity: 100,
                    enabled: true
                },
                cornerRadius: 8,
                fontSize: 15
            }
        };
    }

    if (type === 'text')
    {
        return {
            ...common,

            width: 320,
            height: 80,
            minWidth: 120,
            minHeight: 48,

            appearance: {
                ...common.appearance,

                /*
             * Text blocks are transparent by default.
             * The stored colors remain available so
             * Background / Stroke can be restored
             * directly from the Appearance inspector.
             */
                fill: {
                    ...common.appearance.fill,
                    enabled: false
                },

                stroke: {
                    ...common.appearance.stroke,
                    enabled: false
                },

                strokeWidth: 1,
                strokePattern: 'solid',

                text: {
                    ...common.appearance.text
                },

                cornerRadius: 8,
                fontSize: 18
            }
        };
    }

    if (type === 'shape')
    {
        return {
            ...common,
            width: 180,
            height: 120,
            minWidth: 60,
            minHeight: 60,
            appearance: {
                ...common.appearance,
                fill: { color: '#173029', opacity: 100, enabled: true },
                stroke: { color: '#62D99A', opacity: 100, enabled: true },
                strokeWidth: 2,
                strokePattern: 'solid',
                cornerRadius: 8
            }
        };
    }

    if (type === 'drawing')
    {
        return {
            ...common,
            width: 160,
            height: 100,
            minWidth: 12,
            minHeight: 12,
            appearance: {
                ...common.appearance,
                fill: { ...common.appearance.fill, enabled: false },
                stroke: { color: '#D9E5E1', opacity: 100, enabled: true },
                strokeWidth: 2,
                strokePattern: 'solid'
            }
        };
    }

    if (type === 'place')
    {
        return {
            ...common,
            width: 240,
            height: 54,
            minWidth: 96,
            minHeight: 44,
            appearance: {
                ...common.appearance,
                fill: { color: '#18211F', opacity: 100, enabled: true },
                stroke: { color: '#52615D', opacity: 100, enabled: true },
                strokeWidth: 1,
                strokePattern: 'solid',
                text: { color: '#F1F5F3', opacity: 100, enabled: true },
                cornerRadius: 8,
                fontSize: 13
            }
        };
    }

    return {
        ...common,
        width: 480,
        height: 320,
        minWidth: 240,
        minHeight: 180,

        appearance: {
            ...common.appearance,

            fill: {
                ...common.appearance.fill,
                opacity: 68
            },

            strokePattern: 'dashed',
            cornerRadius: 8
        }
    };
}

function geneoNodeMinimumSize(
    node,
    width = node?.width
)
{
    if (node?.type === 'person')
    {
        return geneoPersonCardMinimumSize(
            node,
            width
        );
    }

    const defaults =
        geneoNodeDefaults(
            node?.type
        );

    return {
        width:
          defaults.minWidth,

        height:
          defaults.minHeight
    };
}

function geneoNodeMaximumSize(
    node
)
{
    if (node?.type === 'person')
    {
        const geometry =
            geneoPersonCardGeometry(
                node
            );

        return {
            width: geometry.maxWidth,
            height: geometry.maxHeight
        };
    }

    return {
        width: 10000,
        height: 10000
    };
}

function touchGeneographBoard(board = selectedGeneographBoard())
{
    if (!board) return;
    board.modifiedAt = new Date().toISOString();
    board.modified = 'Just now';
    invalidateGeneographBoardPreview(board.id);
}

function geneoEnsureHistory()
{
    const boardId = selectedGeneographBoard()?.id || '';
    if (geneoHistoryRuntime.boardId !== boardId) geneoHistoryRuntime = { boardId, undo: [], redo: [] };
}

function geneoSnapshot()
{
    return JSON.stringify(selectedGeneographDiagram());
}

function geneoHistoryCompanionSnapshot(snapshot)
{
    const parsed = JSON.parse(snapshot);
    if (parsed?.geneoReviewHistory) return JSON.stringify({ ...parsed, side: parsed.side === 'before' ? 'after' : 'before' });
    return geneoSnapshot();
}

function geneoPushHistory()
{
    geneoEnsureHistory();
    const snapshot = geneoSnapshot();
    if (geneoHistoryRuntime.undo.at(-1) !== snapshot) geneoHistoryRuntime.undo.push(snapshot);
    if (geneoHistoryRuntime.undo.length > GENEO_HISTORY_LIMIT) geneoHistoryRuntime.undo.shift();
    geneoHistoryRuntime.redo = [];
}

function geneoPushHistorySnapshot(snapshot)
{
    if (!snapshot) return;
    geneoEnsureHistory();
    if (geneoHistoryRuntime.undo.at(-1) !== snapshot) geneoHistoryRuntime.undo.push(snapshot);
    if (geneoHistoryRuntime.undo.length > GENEO_HISTORY_LIMIT) geneoHistoryRuntime.undo.shift();
    geneoHistoryRuntime.redo = [];
}

function geneoRestoreSnapshot(
    snapshot
)
{
    const board =
        selectedGeneographBoard();

    if (!board || !snapshot)
    {
        return false;
    }

    try
    {
        const parsed = JSON.parse(snapshot);
        if (parsed?.geneoReviewHistory) return geneoReviewRestoreHistory(parsed);
        board.diagram = parsed;

        state.geneoLayerRename = null;

        normalizeGeneographRuntimeData();
        touchGeneographBoard(board);

        return true;
    }
    catch (error)
    {
        console.warn(
            'Unable to restore Geneograph history',
            error
        );

        return false;
    }
}

function undoGeneographChange()
{
    cancelGeneographPencilStroke();
    geneoEnsureHistory();
    const snapshot = geneoHistoryRuntime.undo.at(-1);
    if (!snapshot) return;
    const entry = JSON.parse(snapshot);
    if (entry?.geneoReviewHistory && !geneoReviewHistoryCanRestore(entry))
    { showToast('This review cannot be undone because affected records changed.'); return; }
    geneoHistoryRuntime.undo.pop();
    geneoHistoryRuntime.redo.push(geneoHistoryCompanionSnapshot(snapshot));
    if (geneoRestoreSnapshot(snapshot)) renderGeneographEditorPreserveScroll({ preserveInspectorScroll: true, preserveSidebarScroll: true });
}

function redoGeneographChange()
{
    cancelGeneographPencilStroke();
    geneoEnsureHistory();
    const snapshot = geneoHistoryRuntime.redo.at(-1);
    if (!snapshot) return;
    const entry = JSON.parse(snapshot);
    if (entry?.geneoReviewHistory && !geneoReviewHistoryCanRestore(entry))
    { showToast('This review cannot be redone because affected records changed.'); return; }
    geneoHistoryRuntime.redo.pop();
    geneoHistoryRuntime.undo.push(geneoHistoryCompanionSnapshot(snapshot));
    if (geneoRestoreSnapshot(snapshot)) renderGeneographEditorPreserveScroll({ preserveInspectorScroll: true, preserveSidebarScroll: true });
}

function geneoSelectedNodeIdSet()
{
    return new Set(Array.isArray(state.selectedGeneoNodeIds) ? state.selectedGeneoNodeIds : []);
}
function geneoSelectedConnectionIdSet()
{
    return new Set(Array.isArray(state.selectedGeneoConnectionIds) ? state.selectedGeneoConnectionIds : []);
}
function selectedGeneographNodes()
{
    const selectedIds = geneoSelectedNodeIdSet();
    return selectedGeneographDiagram()?.nodes.filter(node => selectedIds.has(node.id)) || [];
}
function selectedGeneographConnections()
{
    const selectedIds = geneoSelectedConnectionIdSet();
    return selectedGeneographDiagram()?.connections.filter(connection => selectedIds.has(connection.id)) || [];
}
function selectedGeneographNode()
{
    return getGeneographNode(state.selectedGeneoNodeId);
}
function selectedGeneographConnection()
{
    return getGeneographConnection(state.selectedGeneoConnectionId);
}
function pruneGeneographSelection()
{
    const nodeIds = [...geneoSelectedNodeIdSet()].filter(id => Boolean(getGeneographNode(id)));
    const connectionIds = [...geneoSelectedConnectionIdSet()].filter(id => Boolean(getGeneographConnection(id)));
    state.selectedGeneoNodeIds = nodeIds;
    state.selectedGeneoConnectionIds = connectionIds;
    if (!nodeIds.includes(state.selectedGeneoNodeId)) state.selectedGeneoNodeId = nodeIds.at(-1) || null;
    if (!connectionIds.includes(state.selectedGeneoConnectionId))
    {
        state.selectedGeneoConnectionId = connectionIds.at(-1) || null;
        state.selectedGeneoWaypointIndex = null;
    }
}
function selectGeneographCanvas()
{
    state.selectedGeneoNodeId = null; state.selectedGeneoNodeIds = []; state.selectedGeneoConnectionId = null; state.selectedGeneoConnectionIds = []; state.selectedGeneoWaypointIndex = null;
}
function setGeneographSelection(nodeIds = [], connectionIds = [], primary = {})
{
    const validIds = [...new Set(Array.isArray(nodeIds) ? nodeIds : [])].filter(id => Boolean(getGeneographNode(id)));
    const validConnectionIds = [...new Set(Array.isArray(connectionIds) ? connectionIds : [])].filter(id => Boolean(getGeneographConnection(id)));
    if (geneoImageCropRuntime && (validIds.some(id => id !== geneoImageCropRuntime.nodeId) || validConnectionIds.length))
        geneoFinishImageCrop(true, { render: false, restoreFocus: false });
    state.selectedGeneoNodeIds = validIds;
    state.selectedGeneoConnectionIds = validConnectionIds;
    state.selectedGeneoNodeId = validIds.includes(primary.nodeId) ? primary.nodeId : validIds.at(-1) || null;
    state.selectedGeneoConnectionId = validConnectionIds.includes(primary.connectionId) ? primary.connectionId : validConnectionIds.at(-1) || null;
    state.selectedGeneoWaypointIndex = null;
}
function setGeneographNodeSelection(nodeIds, primaryId = '')
{
    setGeneographSelection(nodeIds, [], { nodeId: primaryId });
}
function selectGeneographNode(nodeId, options = {})
{
    const id = getGeneographNode(nodeId)?.id;
    if (!id)
    {
        selectGeneographCanvas(); return;
    }
    const current = geneoSelectedNodeIdSet();
    if (options.toggle)
    {
        if (current.has(id)) current.delete(id); else current.add(id);
        setGeneographSelection([...current], [...geneoSelectedConnectionIdSet()], { nodeId: current.has(id) ? id : [...current].at(-1) });
    }
    else if (options.add)
    {
        current.add(id); setGeneographSelection([...current], [...geneoSelectedConnectionIdSet()], { nodeId: id });
    }
    else
    {
        setGeneographNodeSelection([id], id);
    }
}
function selectGeneographConnection(connectionId, waypointIndex = null, options = {})
{
    const id = getGeneographConnection(connectionId)?.id;
    if (!id)
    {
        selectGeneographCanvas(); return;
    }
    if (options.toggle || options.add)
    {
        const nodes = [...geneoSelectedNodeIdSet()];
        const connections = geneoSelectedConnectionIdSet();
        if (options.toggle && connections.has(id)) connections.delete(id); else connections.add(id);
        setGeneographSelection(nodes, [...connections], { connectionId: connections.has(id) ? id : [...connections].at(-1) });
    }
    else
    {
        setGeneographSelection([], [id], { connectionId: id });
    }
    state.selectedGeneoWaypointIndex = Number.isInteger(waypointIndex) && state.selectedGeneoConnectionId === id ? waypointIndex : null;
}

function geneoNodeEffectiveVisible(node)
{
    if (!node?.visible) return false;
    const parent = getGeneographNode(node.parentPanelId);
    return !parent || geneoNodeEffectiveVisible(parent);
}

function geneoConnectionReferenceNodes(reference)
{
    const diagram = selectedGeneographDiagram();
    if (!diagram || !reference) return [];

    if (reference.nodeId)
    {
        const node = getGeneographNode(reference.nodeId);
        return node ? [node] : [];
    }

    if (!reference.familyId) return [];

    const family = getGeneographFamily(reference.familyId);
    if (!family) return [];

    const partnerIds = new Set(
        family.partnerIds || []
    );

    return diagram.nodes.filter(node =>
        node.type === 'person'
        && partnerIds.has(node.personId)
    );
}

function geneoConnectionReferenceEffectiveVisible(reference)
{
    const nodes = geneoConnectionReferenceNodes(reference);

    return nodes.length > 0
        && nodes.every(geneoNodeEffectiveVisible);
}

function geneoConnectionEffectiveVisible(connection)
{
    return Boolean(
        connection
        && connection.visible !== false
        && geneoConnectionReferenceEffectiveVisible(
            connection.source
        )
        && geneoConnectionReferenceEffectiveVisible(
            connection.target
        )
    );
}

function geneoNodeEffectiveLocked(node)
{
    if (!node) return true;
    const parent = getGeneographNode(node.parentPanelId);
    return node.locked || (parent ? geneoNodeEffectiveLocked(parent) : false);
}

function geneoNodeFullyInsidePanel(node, panel)
{
    return Boolean(node && panel && panel.type === 'panel' && node.id !== panel.id
        && node.x >= panel.x
        && node.y >= panel.y
        && node.x + node.width <= panel.x + panel.width
        && node.y + node.height <= panel.y + panel.height);
}

function geneoContainingPanelForNode(node)
{
    return selectedGeneographDiagram().nodes
        .filter(item => item.type === 'panel' && item.id !== node?.id && geneoNodeEffectiveVisible(item))
        .sort((a, b) => b.order - a.order)
        .find(panel => geneoNodeFullyInsidePanel(node, panel)) || null;
}

function reconcileGeneographPanelMembership(panelId)
{
    const diagram = selectedGeneographDiagram();
    const panel = getGeneographNode(panelId);
    if (!diagram || panel?.type !== 'panel') return false;
    let changed = false;
    diagram.nodes.forEach(node =>
    {
        if (node.id === panel.id || node.type === 'panel') return;
        const inside = geneoNodeEffectiveVisible(node) && geneoNodeFullyInsidePanel(node, panel);
        if (inside && node.parentPanelId !== panel.id)
        {
            node.parentPanelId = panel.id;
            changed = true;
        }
        else if (!inside && node.parentPanelId === panel.id)
        {
            node.parentPanelId = null;
            changed = true;
        }
    });
    return changed;
}

function geneoDefaultNodeTitle(node)
{
    if (!node) return 'Canvas';

    if (node.type === 'person')
    {
        return geneoPersonDisplayName(
            getGeneographPerson(node.personId)
        );
    }

    if (node.type === 'image')
    {
        return geneoImageSourceName(node);
    }

    if (node.type === 'panel')
    {
        return node.title || 'Panel';
    }

    if (node.type === 'shape')
    {
        return geneoShapeLabel(node.shapeKind);
    }

    if (node.type === 'place')
    {
        return resolveGeneographPlace(node).name;
    }

    if (node.type === 'drawing')
    {
        return 'Pencil stroke';
    }

    /*
      * Sticky content is independent from its layer
      * identity. Users can provide a custom layer name
      * through the Layer section.
      */
    if (node.type === 'sticky')
    {
        return 'Sticky note';
    }

    return (
        String(node.text || 'Text')
            .split(/\r?\n/)[0]
        || 'Untitled'
    );
}

function geneoNodeTitle(node)
{
    return (
        normalizeGeneographLayerName(
            node?.name
        )
        || geneoDefaultNodeTitle(node)
    );
}

function geneoNodeIcon(type)
{
    return type === 'person'
        ? icon.profile
        : type === 'image'
            ? icon.image
            : type === 'sticky'
                ? icon.note
                : type === 'text'
                    ? icon.text
                    : type === 'place'
                        ? icon.mapPin
                        : type === 'drawing'
                            ? icon.edit
                            : icon.shape;
}

function geneoContentBounds(diagram = selectedGeneographDiagram())
{
    const extents = [];
    (diagram?.nodes || []).forEach(node =>
    {
        extents.push({ x: node.x, y: node.y });
        extents.push({ x: node.x + node.width, y: node.y + node.height });
    });
    (diagram?.connections || []).forEach(connection =>
    {
        (connection.route?.waypoints || []).forEach(point => extents.push(point));
    });
    (diagram?.families || []).forEach(family =>
    {
        if (family.partnerIds.length === 2) extents.push(geneoFamilyJunction(family.id));
    });
    if (!extents.length) return { left: -300, top: -220, right: 300, bottom: 220, width: 600, height: 440 };
    const xs = extents.map(point => point.x);
    const ys = extents.map(point => point.y);
    const left = Math.min(...xs);
    const top = Math.min(...ys);
    const right = Math.max(...xs);
    const bottom = Math.max(...ys);
    return { left, top, right, bottom, width: Math.max(1, right - left), height: Math.max(1, bottom - top) };
}

function geneoDerivedCanvasBounds(diagram = selectedGeneographDiagram())
{
    const boardId = selectedGeneographBoard()?.id || '';
    if (geneoCanvasRuntime.boardId !== boardId)
    {
        geneoCanvasRuntime = createGeneoCanvasRuntime(boardId);
    }
    const zoom = Math.max(.25, Math.min(2, state.geneoZoom / 100));
    const wrap = main.querySelector('[data-geneo-canvas-wrap]');
    const viewportWidth = Math.max(900, (wrap?.clientWidth || main.clientWidth || 1200) / zoom);
    const viewportHeight = Math.max(640, (wrap?.clientHeight || main.clientHeight || 760) / zoom);
    const content = geneoContentBounds(diagram);
    let left = Math.floor((content.left - GENEO_CANVAS_MARGIN) / GENEO_GRID_SIZE) * GENEO_GRID_SIZE;
    let top = Math.floor((content.top - GENEO_CANVAS_MARGIN) / GENEO_GRID_SIZE) * GENEO_GRID_SIZE;
    let right = Math.ceil((content.right + GENEO_CANVAS_MARGIN) / GENEO_GRID_SIZE) * GENEO_GRID_SIZE;
    let bottom = Math.ceil((content.bottom + GENEO_CANVAS_MARGIN) / GENEO_GRID_SIZE) * GENEO_GRID_SIZE;
    const previous = geneoCanvasRuntime.bounds;
    if (previous)
    {
        left = Math.min(left, previous.left);
        top = Math.min(top, previous.top);
        right = Math.max(right, previous.right);
        bottom = Math.max(bottom, previous.bottom);
    }
    const minimumWidth = viewportWidth + GENEO_CANVAS_MARGIN * 2;
    const minimumHeight = viewportHeight + GENEO_CANVAS_MARGIN * 2;
    if (right - left < minimumWidth)
    {
        const extra = (minimumWidth - (right - left)) / 2;
        left -= extra;
        right += extra;
    }
    if (bottom - top < minimumHeight)
    {
        const extra = (minimumHeight - (bottom - top)) / 2;
        top -= extra;
        bottom += extra;
    }
    left = Math.max(-GENEO_WORLD_LIMIT, left);
    top = Math.max(-GENEO_WORLD_LIMIT, top);
    right = Math.min(GENEO_WORLD_LIMIT, right);
    bottom = Math.min(GENEO_WORLD_LIMIT, bottom);
    return { left, top, right, bottom, width: right - left, height: bottom - top };
}

function geneoCurrentViewportCenter()
{
    const wrap = main.querySelector('[data-geneo-canvas-wrap]');
    const bounds = geneoCanvasRuntime.bounds;
    if (!wrap || !bounds) return null;
    const zoom = state.geneoZoom / 100;
    return {
        x: bounds.left + (wrap.scrollLeft + wrap.clientWidth / 2) / zoom,
        y: bounds.top + (wrap.scrollTop + wrap.clientHeight / 2) / zoom
    };
}

function geneoSavedViewport(boardId = selectedGeneographBoard()?.id)
{
    const saved = boardId ? state.geneoBoardViewports?.[boardId] : null;
    if (!saved || !Number.isFinite(saved.center?.x) || !Number.isFinite(saved.center?.y) || !Number.isFinite(saved.zoom)) return null;
    return saved;
}

function captureGeneographViewport(boardId = selectedGeneographBoard()?.id)
{
    if (!boardId) return null;
    const center = geneoCurrentViewportCenter() || geneoSavedViewport(boardId)?.center;
    if (!center || !Number.isFinite(center.x) || !Number.isFinite(center.y)) return null;
    const saved = {
        center: { x: center.x, y: center.y },
        zoom: Math.max(25, Math.min(200, Math.round(state.geneoZoom)))
    };
    state.geneoBoardViewports[boardId] = saved;
    return saved;
}

function clearGeneographViewport(boardId)
{
    if (boardId && state.geneoBoardViewports) delete state.geneoBoardViewports[boardId];
}

function restoreGeneographViewportCenter(point)
{
    const wrap = main.querySelector('[data-geneo-canvas-wrap]');
    const bounds = geneoCanvasRuntime.bounds;
    if (!wrap || !bounds || !point) return false;
    const zoom = state.geneoZoom / 100;
    wrap.scrollLeft = (point.x - bounds.left) * zoom - wrap.clientWidth / 2;
    wrap.scrollTop = (point.y - bounds.top) * zoom - wrap.clientHeight / 2;
    return true;
}

function cancelGeneographViewportRestore({ releaseSuppression = false } = {})
{
    if (geneoCanvasRuntime.viewportReleaseFrame)
    {
        cancelAnimationFrame(geneoCanvasRuntime.viewportReleaseFrame);
    }
    geneoCanvasRuntime.viewportReleaseFrame = null;
    geneoCanvasRuntime.viewportRestoreToken += 1;
    if (releaseSuppression) geneoCanvasRuntime.suppressEdgeExpansion = false;
}

function cancelGeneographEdgeExpansion({ pending = false } = {})
{
    if (geneoCanvasRuntime.edgeExpansionFrame)
    {
        cancelAnimationFrame(geneoCanvasRuntime.edgeExpansionFrame);
    }
    geneoCanvasRuntime.edgeExpansionFrame = null;
    if (pending) geneoCanvasRuntime.pendingEdgeExpansion = true;
}

function scheduleGeneographViewportRestore(point, afterRestore = null)
{
    const boardId = selectedGeneographBoard()?.id || '';
    cancelGeneographViewportRestore();
    const token = geneoCanvasRuntime.viewportRestoreToken;
    geneoCanvasRuntime.suppressEdgeExpansion = true;

    if (
        selectedGeneographBoard()?.id !== boardId
    )
    {
        geneoCanvasRuntime.suppressEdgeExpansion = false;
        return;
    }

    if (point && !restoreGeneographViewportCenter(point))
    {
        geneoCanvasRuntime.suppressEdgeExpansion = false;
        return;
    }

    afterRestore?.();
    captureGeneographViewport(boardId);

    /*
       * Restoration must complete before another pointer gesture can begin.
       * A frame is used only to release edge-expansion suppression after the
       * browser has painted the already-restored viewport.
       */
    geneoCanvasRuntime.viewportReleaseFrame = requestAnimationFrame(() =>
    {
        geneoCanvasRuntime.viewportReleaseFrame = null;
        if (
            token !== geneoCanvasRuntime.viewportRestoreToken
          || selectedGeneographBoard()?.id !== boardId
        )
        {
            return;
        }
        geneoCanvasRuntime.suppressEdgeExpansion = false;
        if (geneoCanvasRuntime.pendingEdgeExpansion && !geneoPointerState)
        {
            geneoCanvasRuntime.pendingEdgeExpansion = false;
            expandGeneographCanvasNearEdge();
        }
    });
}

function geneoViewportPointAtClient(clientX, clientY)
{
    const wrap = main.querySelector('[data-geneo-canvas-wrap]');
    const bounds = geneoCanvasRuntime.bounds;
    if (!wrap || !bounds) return null;
    const rect = wrap.getBoundingClientRect();
    const zoom = state.geneoZoom / 100;
    return {
        x: bounds.left + (wrap.scrollLeft + clientX - rect.left) / zoom,
        y: bounds.top + (wrap.scrollTop + clientY - rect.top) / zoom
    };
}

function applyGeneographZoomToDom(options = {})
{
    const wrap = main.querySelector('[data-geneo-canvas-wrap]');
    const boardSpace = wrap?.querySelector('.geneo-board-space');
    const stage = boardSpace?.querySelector('[data-geneo-stage]');
    const bounds = geneoCanvasRuntime.bounds;
    if (!wrap || !boardSpace || !stage || !bounds) return false;
    const zoom = state.geneoZoom / 100;
    const gridOriginX = (((-bounds.left % GENEO_GRID_SIZE) + GENEO_GRID_SIZE) % GENEO_GRID_SIZE) * zoom;
    const gridOriginY = (((-bounds.top % GENEO_GRID_SIZE) + GENEO_GRID_SIZE) % GENEO_GRID_SIZE) * zoom;
    boardSpace.style.width = `${bounds.width * zoom}px`;
    boardSpace.style.height = `${bounds.height * zoom}px`;
    boardSpace.style.setProperty('--geneo-canvas-zoom', zoom);
    boardSpace.style.setProperty('--geneo-grid-origin-x', `${gridOriginX}px`);
    boardSpace.style.setProperty('--geneo-grid-origin-y', `${gridOriginY}px`);
    stage.style.transform = `scale(${zoom})`;
    const value = main.querySelector('.geneo-zoom-value');
    if (value) value.textContent = `${state.geneoZoom}%`;
    if (options.anchor)
    {
        const rect = wrap.getBoundingClientRect();
        wrap.scrollLeft = (options.anchor.x - bounds.left) * zoom - (options.clientX - rect.left);
        wrap.scrollTop = (options.anchor.y - bounds.top) * zoom - (options.clientY - rect.top);
    }
    else if (options.center)
    {
        wrap.scrollLeft = (options.center.x - bounds.left) * zoom - wrap.clientWidth / 2;
        wrap.scrollTop = (options.center.y - bounds.top) * zoom - wrap.clientHeight / 2;
    }
    if (geneoCanvasRuntime.zoomSettleFrame) cancelAnimationFrame(geneoCanvasRuntime.zoomSettleFrame);
    captureGeneographViewport();
    geneoCanvasRuntime.zoomSettleFrame = requestAnimationFrame(() =>
    {
        geneoCanvasRuntime.zoomSettleFrame = null;
        geneoCanvasRuntime.zooming = false;
        geneoCanvasRuntime.suppressEdgeExpansion = false;
    });
    return true;
}

function setGeneographZoom(nextZoom, options = {})
{
    const zoom = Math.max(25, Math.min(200, Math.round(nextZoom)));
    if (zoom === state.geneoZoom) return false;
    const center = options.center || (!options.anchor ? geneoCurrentViewportCenter() : null);
    cancelGeneographViewportRestore({ releaseSuppression: true });
    if (geneoCanvasRuntime.edgeExpansionFrame) cancelAnimationFrame(geneoCanvasRuntime.edgeExpansionFrame);
    geneoCanvasRuntime.edgeExpansionFrame = null;
    geneoCanvasRuntime.zooming = true;
    geneoCanvasRuntime.suppressEdgeExpansion = true;
    state.geneoZoom = zoom;
    return applyGeneographZoomToDom({ ...options, center });
}

function queueGeneographWheelZoom(event)
{
    event.preventDefault();
    geneoCanvasRuntime.zoomDelta = (Number.isFinite(geneoCanvasRuntime.zoomDelta) ? geneoCanvasRuntime.zoomDelta : 0) + event.deltaY;
    geneoCanvasRuntime.zoomClientX = event.clientX;
    geneoCanvasRuntime.zoomClientY = event.clientY;
    if (geneoCanvasRuntime.zoomFrame) return;
    geneoCanvasRuntime.zoomFrame = requestAnimationFrame(() =>
    {
        geneoCanvasRuntime.zoomFrame = null;
        const delta = geneoCanvasRuntime.zoomDelta;
        geneoCanvasRuntime.zoomDelta = 0;
        if (!delta) return;
        const clientX = geneoCanvasRuntime.zoomClientX;
        const clientY = geneoCanvasRuntime.zoomClientY;
        const anchor = geneoViewportPointAtClient(clientX, clientY);
        setGeneographZoom(state.geneoZoom + (delta < 0 ? 10 : -10), { anchor, clientX, clientY });
    });
}

function geneoContentCenter()
{
    const content = geneoContentBounds();
    return { x: (content.left + content.right) / 2, y: (content.top + content.bottom) / 2 };
}

function expandGeneographCanvasNearEdge()
{
    if (
        geneoCanvasRuntime.suppressEdgeExpansion
        || geneoCanvasRuntime.zooming
        || geneoPointerState
    )
    {
        geneoCanvasRuntime.pendingEdgeExpansion = true;
        return;
    }
    if (geneoCanvasRuntime.edgeExpansionFrame) return;
    geneoCanvasRuntime.edgeExpansionFrame = requestAnimationFrame(() =>
    {
        geneoCanvasRuntime.edgeExpansionFrame = null;
        if (
            geneoCanvasRuntime.suppressEdgeExpansion
          || geneoCanvasRuntime.zooming
          || geneoPointerState
        )
        {
            geneoCanvasRuntime.pendingEdgeExpansion = true;
            return;
        }
        const wrap = main.querySelector('[data-geneo-canvas-wrap]');
        const bounds = geneoCanvasRuntime.bounds;
        if (!wrap || !bounds) return;
        const center = geneoCurrentViewportCenter();
        const zoom = state.geneoZoom / 100;
        const threshold = GENEO_CANVAS_EDGE_THRESHOLD;
        const expansion = GENEO_CANVAS_EXPANSION;
        const next = { ...bounds };
        if (wrap.scrollLeft < threshold && next.left > -GENEO_WORLD_LIMIT) next.left = Math.max(-GENEO_WORLD_LIMIT, next.left - expansion);
        if (wrap.scrollTop < threshold && next.top > -GENEO_WORLD_LIMIT) next.top = Math.max(-GENEO_WORLD_LIMIT, next.top - expansion);
        if (wrap.scrollLeft + wrap.clientWidth > bounds.width * zoom - threshold && next.right < GENEO_WORLD_LIMIT) next.right = Math.min(GENEO_WORLD_LIMIT, next.right + expansion);
        if (wrap.scrollTop + wrap.clientHeight > bounds.height * zoom - threshold && next.bottom < GENEO_WORLD_LIMIT) next.bottom = Math.min(GENEO_WORLD_LIMIT, next.bottom + expansion);
        geneoCanvasRuntime.pendingEdgeExpansion = false;
        if (next.left === bounds.left && next.top === bounds.top && next.right === bounds.right && next.bottom === bounds.bottom) return;
        next.width = next.right - next.left;
        next.height = next.bottom - next.top;
        geneoCanvasRuntime.bounds = next;
        renderGeneographEditorPreserveCenter(center);
    });
}

function geneoCanvasPointForNode(node, port = 'bottom')
{
    if (!node) return { x: 0, y: 0 };
    if (port === 'top') return { x: node.x + node.width / 2, y: node.y };
    if (port === 'left') return { x: node.x, y: node.y + node.height / 2 };
    if (port === 'right') return { x: node.x + node.width, y: node.y + node.height / 2 };
    return { x: node.x + node.width / 2, y: node.y + node.height };
}

function geneoPartnerConnectionForFamily(familyId)
{
    return selectedGeneographDiagram()?.connections.find(connection =>
        connection.kind === 'family-partner'
        && connection.familyId === familyId
        && connection.source?.nodeId
        && connection.target?.nodeId
    ) || null;
}

function geneoPolylineMidpoint(points)
{
    const segments = (Array.isArray(points) ? points : []).slice(0, -1).map((start, index) =>
    {
        const end = points[index + 1];
        return { start, end, length: Math.hypot(end.x - start.x, end.y - start.y) };
    }).filter(segment => segment.length > 0);
    const totalLength = segments.reduce((sum, segment) => sum + segment.length, 0);
    if (!segments.length || !totalLength) return null;
    let remaining = totalLength / 2;
    for (const segment of segments)
    {
        if (remaining <= segment.length)
        {
            const progress = remaining / segment.length;
            return {
                x: segment.start.x + (segment.end.x - segment.start.x) * progress,
                y: segment.start.y + (segment.end.y - segment.start.y) * progress
            };
        }
        remaining -= segment.length;
    }
    return { ...segments.at(-1).end };
}

function geneoFamilyJunction(familyId)
{
    const family = getGeneographFamily(familyId);
    const nodes = (family?.partnerIds || []).map(personId => selectedGeneographDiagram().nodes.find(node => node.type === 'person' && node.personId === personId)).filter(Boolean);
    if (!nodes.length) return { x: 0, y: 0 };
    if (nodes.length === 1) return geneoCanvasPointForNode(nodes[0], 'bottom');
    const partnerConnection = geneoPartnerConnectionForFamily(familyId);
    const partnerPoints = partnerConnection ? geneoConnectionPoints(partnerConnection) : null;
    if (partnerPoints?.length > 1)
    {
        const radius = geneoEffectiveConnectionStyle(partnerConnection).cornerRadius;
        const segments = partnerPoints.slice(0, -1).map((rawStart, index) =>
        {
            const rawEnd = partnerPoints[index + 1];
            const length = Math.hypot(rawEnd.x - rawStart.x, rawEnd.y - rawStart.y);
            if (length < 1) return null;
            const startCut = geneoConnectionCornerCut(partnerPoints, index, radius) / length;
            const endCut = geneoConnectionCornerCut(partnerPoints, index + 1, radius) / length;
            const coordinate = value => radius ? Number(value.toFixed(2)) : Math.round(value);
            const start = { x: coordinate(rawStart.x + (rawEnd.x - rawStart.x) * startCut),
                y: coordinate(rawStart.y + (rawEnd.y - rawStart.y) * startCut) };
            const end = { x: coordinate(rawEnd.x - (rawEnd.x - rawStart.x) * endCut),
                y: coordinate(rawEnd.y - (rawEnd.y - rawStart.y) * endCut) };
            return { start, end, length: Math.hypot(end.x - start.x, end.y - start.y),
                horizontal: Math.abs(start.y - end.y) < .001 };
        }).filter(segment => segment?.length > 1);
        segments.sort((a, b) => Number(b.horizontal) - Number(a.horizontal) || b.length - a.length);
        const segment = segments[0];
        if (segment)
        {
            const midpoint = { x: (segment.start.x + segment.end.x) / 2,
                y: (segment.start.y + segment.end.y) / 2 };
            if (!selectedGeneographDiagram()?.canvas.snapToGrid) return midpoint;
            const clamp = (value, a, b) => Math.max(Math.min(a, b), Math.min(Math.max(a, b), value));
            if (segment.horizontal)
                return { x: clamp(snapGeneographCoordinate(midpoint.x), segment.start.x, segment.end.x), y: segment.start.y };
            if (Math.abs(segment.start.x - segment.end.x) < .001)
                return { x: segment.start.x, y: clamp(snapGeneographCoordinate(midpoint.y), segment.start.y, segment.end.y) };
            return midpoint;
        }
    }
    const first = geneoCanvasPointForNode(nodes[0], nodes[0].x < nodes[1].x ? 'right' : 'left');
    const second = geneoCanvasPointForNode(nodes[1], nodes[0].x < nodes[1].x ? 'left' : 'right');
    return { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 };
}

function geneoConnectionPoint(reference)
{
    if (reference?.familyId) return geneoFamilyJunction(reference.familyId);
    return geneoCanvasPointForNode(getGeneographNode(reference?.nodeId), reference?.port);
}

function geneoFamilyChildBusGroups(diagram = selectedGeneographDiagram())
{
    const candidates = new Map();
    for (const connection of diagram?.connections || [])
    {
        if (connection.kind !== 'family-child' || !connection.familyId
            || connection.route?.mode === 'manual' || connection.target?.port !== 'top'
            || !geneoConnectionEffectiveVisible(connection)) continue;
        const source = connection.source || {};
        const sourceKey = source.familyId ? `family:${source.familyId}` : `node:${source.nodeId}`;
        const style = geneoEffectiveConnectionStyle(connection, diagram);
        const styleKey = JSON.stringify([style.line?.color, style.line?.opacity,
            style.line?.enabled, style.width, style.pattern, style.cornerRadius]);
        const key = JSON.stringify([connection.familyId, sourceKey, source.port, styleKey]);
        if (!candidates.has(key)) candidates.set(key, []);
        candidates.get(key).push(connection);
    }
    const buses = [];
    const byConnection = new Map();
    for (const group of candidates.values())
    {
        if (group.length < 2) continue;
        const start = geneoConnectionPoint(group[0].source);
        const ends = new Map(group.map(connection =>
            [connection.id, geneoConnectionPoint(connection.target)]));
        const parentBottom = Math.max(start.y, ...geneoConnectionReferenceNodes(group[0].source)
            .map(node => node.y + node.height));
        const lowerBound = parentBottom + GENEO_GRID_SIZE;
        const upperBound = Math.min(...[...ends.values()].map(point => point.y)) - GENEO_GRID_SIZE;
        if (lowerBound > upperBound) continue;
        const savedRailY = group.find(connection => Number.isFinite(connection.route?.railY))?.route.railY;
        let railY = Math.max(lowerBound, Math.min(upperBound,
            savedRailY ?? (lowerBound + upperBound) / 2));
        if (diagram.canvas.snapToGrid)
        {
            const firstGridY = Math.ceil(lowerBound / GENEO_GRID_SIZE) * GENEO_GRID_SIZE;
            const lastGridY = Math.floor(upperBound / GENEO_GRID_SIZE) * GENEO_GRID_SIZE;
            if (firstGridY > lastGridY) continue;
            railY = Math.max(firstGridY, Math.min(lastGridY, snapGeneographCoordinate(railY)));
        }
        const childXs = [...ends.values()].map(point => point.x);
        const bus = {
            connectionIds: group.map(connection => connection.id),
            start, ends, railY, lowerBound, upperBound,
            minX: Math.min(start.x, ...childXs),
            maxX: Math.max(start.x, ...childXs),
            style: geneoEffectiveConnectionStyle(group[0], diagram)
        };
        buses.push(bus);
        bus.connectionIds.forEach(id => byConnection.set(id, bus));
    }
    return { buses, byConnection };
}

function geneoConnectionPoints(connection, busByConnection = null)
{
    const start = geneoConnectionPoint(connection.source);
    const end = geneoConnectionPoint(connection.target);
    if (connection.route?.mode === 'manual' && connection.route.waypoints?.length) return [start, ...connection.route.waypoints, end];
    if (connection.kind === 'family-child')
    {
        const bus = (busByConnection || geneoFamilyChildBusGroups().byConnection).get(connection.id);
        if (bus) return [start, { x: start.x, y: bus.railY },
            { x: end.x, y: bus.railY }, end];
    }
    if (connection.kind === 'family-sibling' && connection.source?.port === 'top' && connection.target?.port === 'top')
    {
        const routeY = snapGeneographCoordinate(Math.min(start.y, end.y) - GENEO_TOP_ROUTE_CLEARANCE);
        return [start, { x: start.x, y: routeY }, { x: end.x, y: routeY }, end];
    }
    if (Math.abs(start.x - end.x) < 4 || Math.abs(start.y - end.y) < 4) return [start, end];
    const vertical = ['top', 'bottom'].includes(connection.source?.port) || connection.source?.familyId;
    if (vertical)
    {
        const midY = Math.round((start.y + end.y) / 2); return [start, { x: start.x, y: midY }, { x: end.x, y: midY }, end];
    }
    const midX = Math.round((start.x + end.x) / 2); return [start, { x: midX, y: start.y }, { x: midX, y: end.y }, end];
}

function geneoPolylinePath(points)
{
    return points.map((point, index) => `${index ? 'L' : 'M'} ${Math.round(point.x)} ${Math.round(point.y)}`).join(' ');
}

function geneoConnectionCornerCut(points, index, radius)
{
    if (!radius || index <= 0 || index >= points.length - 1) return 0;
    const previous = points[index - 1];
    const current = points[index];
    const next = points[index + 1];
    const incoming = { x: previous.x - current.x, y: previous.y - current.y };
    const outgoing = { x: next.x - current.x, y: next.y - current.y };
    const incomingLength = Math.hypot(incoming.x, incoming.y);
    const outgoingLength = Math.hypot(outgoing.x, outgoing.y);
    if (!incomingLength || !outgoingLength
        || Math.abs(incoming.x * outgoing.y - incoming.y * outgoing.x)
            < incomingLength * outgoingLength * .001) return 0;
    return Math.min(radius, incomingLength / 2, outgoingLength / 2);
}

function geneoRoundedPolylinePath(points, radius = 0)
{
    if (!radius || points.length < 3) return geneoPolylinePath(points);
    const coordinate = value => Number(value.toFixed(2));
    const commands = [`M ${coordinate(points[0].x)} ${coordinate(points[0].y)}`];
    for (let index = 1; index < points.length - 1; index++)
    {
        const current = points[index];
        const cut = geneoConnectionCornerCut(points, index, radius);
        if (!cut)
        {
            commands.push(`L ${coordinate(current.x)} ${coordinate(current.y)}`);
            continue;
        }
        const previous = points[index - 1];
        const next = points[index + 1];
        const incomingLength = Math.hypot(previous.x - current.x, previous.y - current.y);
        const outgoingLength = Math.hypot(next.x - current.x, next.y - current.y);
        const before = {
            x: current.x + (previous.x - current.x) * cut / incomingLength,
            y: current.y + (previous.y - current.y) * cut / incomingLength
        };
        const after = {
            x: current.x + (next.x - current.x) * cut / outgoingLength,
            y: current.y + (next.y - current.y) * cut / outgoingLength
        };
        commands.push(`L ${coordinate(before.x)} ${coordinate(before.y)}`,
            `Q ${coordinate(current.x)} ${coordinate(current.y)} ${coordinate(after.x)} ${coordinate(after.y)}`);
    }
    const end = points.at(-1);
    commands.push(`L ${coordinate(end.x)} ${coordinate(end.y)}`);
    return commands.join(' ');
}

function geneoProjectedPointOnSegment(point, start, end)
{
    const horizontal = Math.abs(start.y - end.y) <= Math.abs(start.x - end.x);
    if (horizontal)
    {
        return {
            x: Math.max(Math.min(start.x, end.x), Math.min(Math.max(start.x, end.x), point.x)),
            y: start.y
        };
    }

    return {
        x: start.x,
        y: Math.max(Math.min(start.y, end.y), Math.min(Math.max(start.y, end.y), point.y))
    };
}

function geneoPointInsideRect(point, rect)
{
    return point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom;
}

function geneoSegmentOrientation(first, second, third)
{
    const value = (second.y - first.y) * (third.x - second.x) - (second.x - first.x) * (third.y - second.y);
    return Math.abs(value) < .001 ? 0 : value > 0 ? 1 : 2;
}

function geneoPointOnSegment(first, point, second)
{
    return point.x <= Math.max(first.x, second.x) + .001 && point.x >= Math.min(first.x, second.x) - .001
        && point.y <= Math.max(first.y, second.y) + .001 && point.y >= Math.min(first.y, second.y) - .001;
}

function geneoSegmentsIntersect(firstStart, firstEnd, secondStart, secondEnd)
{
    const firstA = geneoSegmentOrientation(firstStart, firstEnd, secondStart);
    const firstB = geneoSegmentOrientation(firstStart, firstEnd, secondEnd);
    const secondA = geneoSegmentOrientation(secondStart, secondEnd, firstStart);
    const secondB = geneoSegmentOrientation(secondStart, secondEnd, firstEnd);
    if (firstA !== firstB && secondA !== secondB) return true;
    if (firstA === 0 && geneoPointOnSegment(firstStart, secondStart, firstEnd)) return true;
    if (firstB === 0 && geneoPointOnSegment(firstStart, secondEnd, firstEnd)) return true;
    if (secondA === 0 && geneoPointOnSegment(secondStart, firstStart, secondEnd)) return true;
    return secondB === 0 && geneoPointOnSegment(secondStart, firstEnd, secondEnd);
}

function geneoConnectionIntersectsRect(connection, rect)
{
    if (!geneoConnectionEffectiveVisible(connection)) return false;
    const corners = [
        { x: rect.left, y: rect.top }, { x: rect.right, y: rect.top },
        { x: rect.right, y: rect.bottom }, { x: rect.left, y: rect.bottom }
    ];
    const edges = corners.map((corner, index) => [corner, corners[(index + 1) % corners.length]]);
    const points = geneoConnectionPoints(connection);
    return points.slice(0, -1).some((start, index) =>
    {
        const end = points[index + 1];
        return geneoPointInsideRect(start, rect) || geneoPointInsideRect(end, rect)
          || edges.some(([edgeStart, edgeEnd]) => geneoSegmentsIntersect(start, end, edgeStart, edgeEnd));
    });
}

function geneoDrawingWorldPoints(node)
{
    if (node?.type !== 'drawing') return [];
    return normalizeGeneographDrawingPoints(node.points).map(point => ({
        x: node.x + point.x * node.width,
        y: node.y + point.y * node.height
    }));
}

function geneoDrawingIntersectsRect(node, rect)
{
    const points = geneoDrawingWorldPoints(node);
    if (points.length < 2) return false;
    const corners = [
        { x: rect.left, y: rect.top },
        { x: rect.right, y: rect.top },
        { x: rect.right, y: rect.bottom },
        { x: rect.left, y: rect.bottom }
    ];
    const edges = corners.map((corner, index) => [corner, corners[(index + 1) % corners.length]]);
    return points.slice(0, -1).some((start, index) =>
    {
        const end = points[index + 1];
        return geneoPointInsideRect(start, rect)
          || geneoPointInsideRect(end, rect)
          || edges.some(([edgeStart, edgeEnd]) => geneoSegmentsIntersect(start, end, edgeStart, edgeEnd));
    });
}

function insertGeneographWaypoint(connectionId, point, requestedSegmentIndex = null)
{
    const connection = getGeneographConnection(connectionId);
    if (!connection || !point) return false;
    const points = geneoConnectionPoints(connection);
    if (points.length < 2) return false;
    let segmentIndex = Number.isInteger(requestedSegmentIndex) ? requestedSegmentIndex : 0;
    let insertionPoint = null;
    let bestDistance = Infinity;
    points.slice(0, -1).forEach((start, index) =>
    {
        if (Number.isInteger(requestedSegmentIndex) && index !== requestedSegmentIndex) return;
        const projected = geneoProjectedPointOnSegment(point, start, points[index + 1]);
        const distance = Math.hypot(projected.x - point.x, projected.y - point.y);
        if (distance < bestDistance)
        {
            bestDistance = distance;
            segmentIndex = index;
            insertionPoint = projected;
        }
    });
    if (!insertionPoint || points.some(existing => Math.hypot(existing.x - insertionPoint.x, existing.y - insertionPoint.y) < 3)) return false;
    insertionPoint = snapGeneographPoint(insertionPoint);
    if (points.some(existing => Math.hypot(existing.x - insertionPoint.x, existing.y - insertionPoint.y) < 3)) return false;
    const waypoints = connection.route?.mode === 'manual'
        ? connection.route.waypoints.map(existing => ({ ...existing }))
        : points.slice(1, -1).map(existing => snapGeneographPoint(existing));
    const insertAt = Math.max(0, Math.min(segmentIndex, waypoints.length));
    geneoPushHistory();
    waypoints.splice(insertAt, 0, insertionPoint);
    connection.route = { mode: 'manual', waypoints };
    touchGeneographBoard();
    selectGeneographConnection(connection.id, insertAt);
    renderGeneographEditorPreserveScroll();
    return true;
}

function geneoConnectionPreviewPoints(reference, end)
{
    const start = geneoConnectionPoint(reference);
    if (!end) return [start, start];
    if (Math.abs(start.x - end.x) < 4 || Math.abs(start.y - end.y) < 4) return [start, end];
    const vertical = ['top', 'bottom'].includes(reference?.port) || reference?.familyId;
    if (vertical) return [start, { x: start.x, y: end.y }, end];
    return [start, { x: end.x, y: start.y }, end];
}

function renderGeneographConnectors()
{
    const diagram = selectedGeneographDiagram();
    if (!diagram) return '';
    const { buses, byConnection } = geneoFamilyChildBusGroups(diagram);
    const bounds = geneoCanvasRuntime.bounds || geneoDerivedCanvasBounds(diagram);
    const previewPath = state.geneoConnectionDraft
        ? geneoRoundedPolylinePath(geneoConnectionPreviewPoints(state.geneoConnectionDraft, geneoCanvasRuntime.connectionPreviewPoint), geneoConnectionToolStyle().cornerRadius)
        : '';
    const selectedConnectionIds = geneoSelectedConnectionIdSet();
    const connectionPaintRank = connection => connection.kind === 'family-partner'
        ? 2
        : selectedConnectionIds.has(connection.id) ? 1 : 0;
    const orderedConnections = diagram.connections
        .filter(geneoConnectionEffectiveVisible)
        .sort((first, second) =>
            connectionPaintRank(first)
          - connectionPaintRank(second)
        );
    return `<svg class="geneo-connections" viewBox="${bounds.left} ${bounds.top} ${bounds.width} ${bounds.height}" style="--geneo-connection-hit-width:${14 / Math.max(.25, state.geneoZoom / 100)}px;--geneo-segment-hit-width:${18 / Math.max(.25, state.geneoZoom / 100)}px" aria-label="Board connections">
        ${buses.map(bus =>
        {
            const trunkPath = geneoPolylinePath([bus.start, { x: bus.start.x, y: bus.railY }]);
            const leftEnds = [...bus.ends.values()].filter(point => point.x === bus.minX);
            const rightEnds = [...bus.ends.values()].filter(point => point.x === bus.maxX);
            const leftCut = leftEnds.length === 1 && bus.minX < bus.start.x
                ? Math.min(bus.style.cornerRadius, (bus.maxX - bus.minX) / 2,
                    (leftEnds[0].y - bus.railY) / 2, bus.start.x - bus.minX) : 0;
            const rightCut = rightEnds.length === 1 && bus.maxX > bus.start.x
                ? Math.min(bus.style.cornerRadius, (bus.maxX - bus.minX) / 2,
                    (rightEnds[0].y - bus.railY) / 2, bus.maxX - bus.start.x) : 0;
            const railPath = geneoPolylinePath([{ x: bus.minX + leftCut, y: bus.railY }, { x: bus.maxX - rightCut, y: bus.railY }]);
            const busPath = `${trunkPath} ${railPath}`;
            const paint = bus.style.line;
            const selected = bus.connectionIds.every(id => selectedConnectionIds.has(id));
            const dash = geneoConnectionDashArray(bus.style.pattern, bus.style.width);
            return `<g class="geneo-connection geneo-family-bus ${selected ? 'selected' : ''} ${paint.enabled ? '' : 'no-stroke'}" data-geneo-family-bus-group="${escapeHtml(bus.connectionIds.join(','))}">
              <path class="geneo-family-bus-hit" d="${trunkPath}" data-geneo-family-bus="${escapeHtml(bus.connectionIds.join(','))}" role="button" tabindex="0" aria-label="${escapeHtml(t('Select family connections'))}"></path>
              <path class="geneo-family-bus-hit geneo-family-bus-rail-hit" d="${railPath}" data-geneo-family-bus="${escapeHtml(bus.connectionIds.join(','))}" data-geneo-family-bus-rail role="button" tabindex="0" aria-label="${escapeHtml(t('Move family rail'))}"></path>
              <path class="geneo-connection-line" d="${busPath}" stroke="${escapeHtml(geneoPaintCssColor(paint))}" stroke-width="${bus.style.width}" stroke-linecap="round" ${dash ? `stroke-dasharray="${dash}"` : ''}></path>
              <path class="geneo-connection-selection-guide" d="${busPath}"></path>
            </g>`;
        }).join('')}
        ${orderedConnections.map(connection =>
        {
            const selected = selectedConnectionIds.has(connection.id);
            const bus = byConnection.get(connection.id);
            const points = geneoConnectionPoints(connection, byConnection);
            const end = points.at(-1);
            const style = geneoEffectiveConnectionStyle(connection, diagram);
            const busEndXs = bus ? [...bus.ends.values()].map(point => point.x) : [];
            const busCut = bus && busEndXs.filter(x => x === end.x).length === 1
                && end.x !== bus.start.x && (end.x === bus.minX || end.x === bus.maxX)
                ? Math.min(style.cornerRadius, (bus.maxX - bus.minX) / 2,
                    (end.y - bus.railY) / 2, Math.abs(end.x - bus.start.x)) : 0;
            const path = bus && busCut
                ? `M ${end.x + (end.x === bus.minX ? busCut : -busCut)} ${bus.railY} Q ${end.x} ${bus.railY} ${end.x} ${bus.railY + busCut} L ${end.x} ${end.y}`
                : bus ? geneoPolylinePath([{ x: end.x, y: bus.railY }, end])
                    : geneoRoundedPolylinePath(points, style.cornerRadius);
            const linePaint = style.line;
            const dash = geneoConnectionDashArray(style.pattern, style.width);
            const markerId = `geneo-arrow-${connection.id}`;
            const marker = connection.kind === 'visual' && style.arrows !== 'none'
                ? `<defs><marker id="${escapeHtml(markerId)}" viewBox="0 0 8 8" markerWidth="5" markerHeight="5" refX="8" refY="4" orient="auto-start-reverse" markerUnits="strokeWidth"><path d="M0 0 L8 4 L0 8 Z" fill="${escapeHtml(geneoPaintCssColor(linePaint))}"></path></marker></defs>` : '';
            const arrowAttrs = marker ? `${['start', 'both'].includes(style.arrows) ? `marker-start="url(#${escapeHtml(markerId)})"` : ''} ${['end', 'both'].includes(style.arrows) ? `marker-end="url(#${escapeHtml(markerId)})"` : ''}` : '';
            const familyJunction = connection.kind === 'family-partner' && connection.familyId
                ? geneoFamilyJunction(connection.familyId)
                : null;
            return `<g class="geneo-connection ${selected ? 'selected' : ''} ${linePaint.enabled ? '' : 'no-stroke'}" data-geneo-connection-group="${escapeHtml(connection.id)}">${marker}
            <path class="geneo-connection-hit" d="${path}" data-geneo-connection="${escapeHtml(connection.id)}"></path>
            ${selected && !bus ? points.slice(0, -1).map((point, index) =>
            {
                const next = points[index + 1];
                if (index <= 0 || index >= points.length - 2) return '';
                const length = Math.hypot(next.x - point.x, next.y - point.y);
                if (!length) return '';
                const startCut = geneoConnectionCornerCut(points, index, style.cornerRadius);
                const endCut = geneoConnectionCornerCut(points, index + 1, style.cornerRadius);
                const startRatio = startCut / length;
                const endRatio = endCut / length;
                return `<line class="geneo-segment-hit" x1="${point.x + (next.x - point.x) * startRatio}" y1="${point.y + (next.y - point.y) * startRatio}" x2="${next.x - (next.x - point.x) * endRatio}" y2="${next.y - (next.y - point.y) * endRatio}" data-geneo-segment="${index}" data-geneo-connection="${escapeHtml(connection.id)}"></line>`;
            }).join('') : ''}
            <path class="geneo-connection-line" d="${path}" stroke="${escapeHtml(geneoPaintCssColor(linePaint))}" stroke-width="${style.width}" stroke-linecap="round" ${dash ? `stroke-dasharray="${dash}"` : ''} ${arrowAttrs}></path>
            <path class="geneo-connection-selection-guide" d="${path}"></path>
            ${renderGeneographRelationshipDateLabel(connection, points)}
            ${selected && connection.route.mode === 'manual' ? connection.route.waypoints.map((point, index) => `<circle class="geneo-waypoint ${state.selectedGeneoConnectionId === connection.id && state.selectedGeneoWaypointIndex === index ? 'selected' : ''}" cx="${point.x}" cy="${point.y}" r="6" data-geneo-waypoint="${index}" data-geneo-connection="${escapeHtml(connection.id)}"></circle>`).join('') : ''}
            ${familyJunction ? `<circle class="geneo-family-junction" cx="${familyJunction.x}" cy="${familyJunction.y}" r="7" data-geneo-family-junction="${escapeHtml(connection.familyId)}" tabindex="0"><title>Connect child to this family</title></circle>` : ''}
          </g>`;
        }).join('')}
        ${state.geneoConnectionDraft ? (() => { const style = geneoConnectionToolStyle(); const dash = geneoConnectionDashArray(style.pattern, style.width); const color = geneoPaintCssColor(style.line); const marker = `<defs><marker id="geneo-preview-arrow" viewBox="0 0 8 8" markerWidth="5" markerHeight="5" refX="8" refY="4" orient="auto-start-reverse" markerUnits="strokeWidth"><path d="M0 0 L8 4 L0 8 Z" fill="${escapeHtml(color)}"></path></marker></defs>`; return `${marker}<path class="geneo-connection-preview" data-geneo-connection-preview d="${previewPath}" style="stroke:${escapeHtml(color)};stroke-width:${style.width};stroke-dasharray:${dash || 'none'}" ${['start', 'both'].includes(style.arrows) ? 'marker-start="url(#geneo-preview-arrow)"' : ''} ${['end', 'both'].includes(style.arrows) ? 'marker-end="url(#geneo-preview-arrow)"' : ''}></path>`; })() : ''}
        <path class="geneo-pencil-preview" data-geneo-pencil-preview hidden></path>
      </svg>`;
}

function geneoPersonAvatarModel(person)
{
    const board =
        selectedGeneographBoard();

    const treeCandidate =
        person?.treePersonId
            ? getPerson(person.treePersonId)
            : null;
    const treePerson = treeCandidate && !treeCandidate.deleted && treeCandidate.projectId === board?.projectId ? treeCandidate : null;

    const boardPhoto = person?.photoId
        ? getPhoto(person.photoId, { projectId: board?.projectId || '' })
        : null;
    const embeddedPhoto = person?.photoAssetId
        ? getGeneographBoardAsset(person.photoAssetId, board?.diagram)
        : null;
    const hasBoardPhoto = Boolean(boardPhoto || embeddedPhoto);
    const photoId = embeddedPhoto
        ? ''
        : boardPhoto?.id || treePerson?.primaryPhotoId || '';

    const usesTreePhoto =
        Boolean(
            treePerson
          && !hasBoardPhoto
          && photoId
          && photoId === treePerson.primaryPhotoId
        );

    const displayName =
        geneoPersonDisplayName(person);

    return {
        id:
          `geneo-avatar-${person?.id || 'unknown'}`,
        projectId:
          board?.projectId
          || treePerson?.projectId
          || '',
        names: {
            ...normalizeGeneographPersonNames(person),
            display: displayName,
            initials:
            geneoPersonInitials(person)
        },
        primaryPhotoId: photoId,
        embeddedPhoto,
        primaryPhotoCrop:
          usesTreePhoto
              ? treePerson.primaryPhotoCrop
              : hasBoardPhoto ? person?.photoCrop : null,
        photoRegion: hasBoardPhoto ? normalizeFaceRegion(person?.photoRegion, FACE_REGION_MIN) : null,
        hasBoardPhoto,
        avatarClass:
          treePerson?.avatarClass
          || ''
    };
}

function geneoPersonCardLifeSpan(
    person,
    dateFormat = 'full'
)
{
    const birth =
        geneoPersonCardVitalDateLabel(
            person?.birth,
            dateFormat
        );

    const death =
        person?.livingStatus ===
        'Deceased'
            ? geneoPersonCardVitalDateLabel(
                person?.death,
                dateFormat
            )
            : '';

    if (birth && death)
    {
        return `${birth} – ${death}`;
    }

    if (birth)
    {
        return `Born ${birth}`;
    }

    if (death)
    {
        return `Died ${death}`;
    }

    return '';
}

function renderGeneographPersonLifeEvent(
    label,
    event,
    shortLabel = ''
)
{
    if (
        !event
        || (
            !event.date
          && !event.place
        )
    )
    {
        return '';
    }

    const fullLabel =
        shortLabel && state.language === 'ru'
            ? label === 'Born' ? 'Рождение' : 'Смерть'
            : label;

    return `
        <div class="geneo-person-life-event">
          <span
            class="geneo-person-life-event-kind">
            ${
                shortLabel
                    ? `<abbr data-i18n-skip title="${escapeHtml(fullLabel)}" aria-label="${escapeHtml(fullLabel)}">${escapeHtml(shortLabel)}</abbr>`
                    : escapeHtml(label)
            }
          </span>

          <span
            class="geneo-person-life-event-value">
            ${
                event.date
                    ? `
                  <span
                    class="geneo-person-life-event-date"
                    title="${escapeHtml(
                        event.date
                    )}">
                    ${escapeHtml(
                        event.date
                    )}
                  </span>
                `
                    : ''
            }

            ${
                event.date
              && event.place
                    ? `
                  <span
                    class="geneo-person-life-event-separator"
                    aria-hidden="true">
                    ·
                  </span>
                `
                    : ''
            }

            ${
                event.place
                    ? `
                  <span
                    class="geneo-person-life-event-place"
                    title="${escapeHtml(
                        event.place
                    )}">
                    ${escapeHtml(
                        event.place
                    )}
                  </span>
                `
                    : ''
            }
          </span>
        </div>
      `;
}

function renderGeneographPersonAddRelativeAction(node)
{
    const displayName = geneoPersonCardViewModel(node)?.displayName
        || geneoNodeTitle(node);
    return `
        <button
          class="geneo-person-add-relative"
          type="button"
          data-geneo-add-relative="${escapeHtml(node.id)}"
          aria-label="${escapeHtml(`Add relative to ${displayName}`)}"
          aria-haspopup="dialog"
          aria-expanded="false"
          title="Add relative">
          ${icon.plus}
        </button>
      `;
}

function renderGeneographPersonEditAction(node)
{
    return `
        <button
          class="geneo-person-edit-action"
          type="button"
          data-geneo-edit-person-node="${escapeHtml(node.id)}"
          aria-label="Edit person details"
          title="Edit person details">
          ${icon.edit}
        </button>
      `;
}

function renderGeneographAvatarAction(node, person, location = 'card')
{
    const avatar = geneoPersonAvatarModel(person);
    const hasPhoto = Boolean(avatar.embeddedPhoto || getPhoto(avatar.primaryPhotoId, { projectId: avatar.projectId }));
    const label = t(hasPhoto ? 'Change avatar' : 'Add avatar');
    return `<button class="geneo-avatar-action ${location === 'inspector' ? 'in-inspector' : ''}" type="button" data-geneo-avatar-person="${escapeHtml(person.id)}" data-geneo-avatar-node="${escapeHtml(node.id)}" data-geneo-avatar-location="${location}" aria-label="${escapeHtml(`${label}: ${geneoPersonDisplayName(person)}`)}" title="${escapeHtml(label)}">${icon.camera}</button>`;
}

function renderGeneographPersonNode(
    node
)
{
    const model =
        geneoPersonCardViewModel(
            node
        );

    const person =
        model.person;

    if (!person) return '';

    const identityTitle =
        model.maidenName
            ? `${
                model.displayName
            } (${model.maidenName})`
            : model.displayName;

    const avatarModel = geneoPersonAvatarModel(person);
    const avatar = model.showPhoto
        ? renderPersonAvatar(avatarModel, 'geneo-person-avatar', {
            preferCrop: avatarModel.hasBoardPhoto,
            faceRegionOverride: avatarModel.photoRegion,
            overlayHtml: renderGeneographAvatarAction(node, person)
        })
        : '';

    const compactStyle = model.settings.style !== 'standard';

    const compactLife =
        [
            model.lifeSpan,
            ...(['chart', 'compact', 'portrait'].includes(model.settings.style) ? [] : [model.displayStatus])
        ]
            .filter(Boolean)
            .join(' · ');

    const statusContent =
        model.displayStatus
            ? `
            <span
              class="
                geneo-person-status
                status-dot
                ${statusDotClass(
                    model.displayStatus
                )}
              ">
              ${escapeHtml(
                    model.displayStatus
                )}
            </span>
          `
            : '';

    const lifeContent =
        compactStyle
            ? compactLife
                ? `
              <span class="geneo-person-life-summary" title="${escapeHtml(model.settings.style === 'portrait' ? model.portraitLifeSpan : compactLife)}">
                ${escapeHtml(model.settings.style === 'portrait'
                    ? model.portraitLifeSpan : compactLife)}
              </span>
            `
                : ''
            : `
            ${
                model.structuredLife
                    ? `
                  <div
                    class="geneo-person-life-events">
                    ${renderGeneographPersonLifeEvent(
                        'Born',
                        model.birthEvent,
                        model.settings.style === 'standard'
                            ? state.language === 'ru' ? 'род.' : 'Born:'
                            : ''
                    )}

                    ${renderGeneographPersonLifeEvent(
                        'Died',
                        model.deathEvent,
                        model.settings.style === 'standard'
                            ? state.language === 'ru' ? 'ум.' : 'Died:'
                            : ''
                    )}
                  </div>
                `
                    : model.lifeSpan
                        ? `
                    <span
                      class="geneo-person-life-span"
                      title="${escapeHtml(
                            model.lifeSpan
                        )}">
                      ${escapeHtml(
                            model.lifeSpan
                        )}
                    </span>
                  `
                        : ''
            }

            ${statusContent}
          `;

    return `
        <div
          class="
            geneo-person-node-content
            ${
                model.showPhoto
                    ? ''
                    : 'no-photo'
            }
          ">
          ${avatar}

          <div
            class="geneo-person-identity-block">
            <span
              class="geneo-person-name-wrap"
              title="${escapeHtml(
                    identityTitle
                )}">
              <strong
                class="geneo-person-name">
                ${escapeHtml(
                    model.displayName
                )}
              </strong>

              ${
                    model.maidenName
                        ? `
                    <span
                      class="geneo-person-maiden"
                      title="${escapeHtml(
                            `Maiden surname: ${model.maidenName}`
                        )}">
                      (${escapeHtml(
                            model.maidenName
                        )})
                    </span>
                  `
                        : ''
                }
            </span>
          </div>

          ${
                lifeContent
                    ? `
                <div
                  class="geneo-person-life">
                  ${lifeContent}
                </div>
              `
                    : ''
            }

        </div>
      `;
}

function geneoRoundedPolygonPath(points, radius = 0)
{
    if (!Array.isArray(points) || points.length < 3) return '';
    const corners = points.map((point, index) =>
    {
        const previous = points[(index - 1 + points.length) % points.length];
        const next = points[(index + 1) % points.length];
        const previousLength = Math.hypot(previous.x - point.x, previous.y - point.y);
        const nextLength = Math.hypot(next.x - point.x, next.y - point.y);
        const distance = Math.max(0, Math.min(radius, previousLength / 2, nextLength / 2));
        const toward = (target, length) => ({
            x: point.x + (target.x - point.x) * (length ? distance / length : 0),
            y: point.y + (target.y - point.y) * (length ? distance / length : 0)
        });
        return {
            point,
            incoming: toward(previous, previousLength),
            outgoing: toward(next, nextLength)
        };
    });
    const number = value => Number(value.toFixed(3));
    return corners.reduce((path, corner, index) =>
    {
        const incoming = `${number(corner.incoming.x)} ${number(corner.incoming.y)}`;
        const vertex = `${number(corner.point.x)} ${number(corner.point.y)}`;
        const outgoing = `${number(corner.outgoing.x)} ${number(corner.outgoing.y)}`;
        return `${path}${index ? ' L' : 'M'} ${incoming} Q ${vertex} ${outgoing}`;
    }, '') + ' Z';
}

function renderGeneographShapeContent(node)
{
    const kind = normalizeGeneographShapeKind(node?.shapeKind);
    const width = Math.max(1, geneoNumber(node?.width, 100));
    const height = Math.max(1, geneoNumber(node?.height, 100));
    const inset = 1;
    const radius = Math.min(
        Math.round(geneoNumber(node?.appearance?.cornerRadius, 8, 0, 32)),
        Math.max(0, Math.min(width, height) / 2 - inset)
    );
    const polygonPoints = {
        diamond: [
            { x: width / 2, y: inset },
            { x: width - inset, y: height / 2 },
            { x: width / 2, y: height - inset },
            { x: inset, y: height / 2 }
        ],
        triangle: [
            { x: width / 2, y: inset },
            { x: width - inset, y: height - inset },
            { x: inset, y: height - inset }
        ],
        hexagon: [
            { x: width * .25, y: inset },
            { x: width * .75, y: inset },
            { x: width - inset, y: height / 2 },
            { x: width * .75, y: height - inset },
            { x: width * .25, y: height - inset },
            { x: inset, y: height / 2 }
        ]
    };
    const geometry = kind === 'rectangle'
        ? `<rect x="${inset}" y="${inset}" width="${Math.max(0, width - inset * 2)}" height="${Math.max(0, height - inset * 2)}" rx="${radius}" ry="${radius}"></rect>`
        : kind === 'ellipse'
            ? `<ellipse cx="${width / 2}" cy="${height / 2}" rx="${Math.max(0, width / 2 - inset)}" ry="${Math.max(0, height / 2 - inset)}"></ellipse>`
            : `<path d="${geneoRoundedPolygonPath(polygonPoints[kind], radius)}"></path>`;
    return `<svg class="geneo-shape-svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" aria-hidden="true" focusable="false"><g vector-effect="non-scaling-stroke">${geometry}</g></svg>`;
}

function geneoDrawingPath(points, width = 1, height = 1)
{
    const resolved = normalizeGeneographDrawingPoints(points).map(point => ({
        x: point.x * width,
        y: point.y * height
    }));
    if (resolved.length < 2) return '';
    const number = value => Number(value.toFixed(3));
    let path = `M ${number(resolved[0].x)} ${number(resolved[0].y)}`;
    for (let index = 1; index < resolved.length - 1; index += 1)
    {
        const point = resolved[index];
        const next = resolved[index + 1];
        path += ` Q ${number(point.x)} ${number(point.y)} ${number((point.x + next.x) / 2)} ${number((point.y + next.y) / 2)}`;
    }
    const last = resolved.at(-1);
    return `${path} L ${number(last.x)} ${number(last.y)}`;
}

function renderGeneographDrawingContent(node)
{
    const width = Math.max(1, geneoNumber(node?.width, 1));
    const height = Math.max(1, geneoNumber(node?.height, 1));
    const path = geneoDrawingPath(node?.points, width, height);
    return `<svg class="geneo-drawing-svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path class="geneo-drawing-line" d="${path}"></path><path class="geneo-drawing-hit" d="${path}"></path></svg>`;
}

function renderGeneographPlaceContent(node)
{
    const resolved = resolveGeneographPlace(node);
    return `<div class="geneo-place-node-content" title="${escapeHtml(resolved.name)}"><span class="geneo-place-node-icon" aria-hidden="true">${icon.mapPin}</span><span class="geneo-place-node-name">${escapeHtml(resolved.name)}</span></div>`;
}

function renderGeneographNodeContent(
    node
)
{
    const editing =
        state.geneoInlineEditNodeId
          === node.id;

    if (node.type === 'person')
    {
        return (
            renderGeneographPersonNode(
                node
            )
        );
    }

    if (node.type === 'image')
    {
        const source =
            resolveGeneographImageSource(
                node
            );
        const editingCrop = geneoImageCropRuntime?.nodeId === node.id
            && geneoImageCropRuntime.boardId === selectedGeneographBoard()?.id;
        const crop = editingCrop ? geneoImageCropRuntime.draft : node.imageCrop;
        const cropStyle = crop && source.width > 0 && source.height > 0
            ? geneoImageCropStyle(node, source, crop) : '';

        const layerName =
            geneoNodeTitle(node);

        return `
          <div
            class="geneo-image-node-media ${cropStyle ? 'has-crop' : ''}"
            style="${cropStyle}">
            ${
                source.available
                    ? renderPhotoThumbnail(
                        source.photo,
                        {
                            label:
                        layerName
                        }
                    ) + `<span class="geneo-image-missing-placeholder geneo-image-load-fallback">${icon.image}<small>${escapeHtml(t('Image unavailable'))}</small></span>`
                    : `
                   <span
                     class="geneo-image-missing-placeholder">
                    ${icon.image}

                    <small>
                       ${escapeHtml(t('Image unavailable'))}
                    </small>
                  </span>
                `
            }
          </div>

          <span
            class="geneo-image-layer-label"
            aria-hidden="true"
            title="${escapeHtml(
                layerName
            )}">
            ${escapeHtml(
                layerName
            )}
          </span>
        `;
    }

    if (node.type === 'shape')
    {
        return renderGeneographShapeContent(node);
    }

    if (node.type === 'place')
    {
        return renderGeneographPlaceContent(node);
    }

    if (node.type === 'drawing')
    {
        return renderGeneographDrawingContent(node);
    }

    if (
        isGeneographRichTextNode(
            node
        )
    )
    {
        if (editing)
        {
            return `
            <div
              class="
                geneo-rich-text-editor-shell
                geneo-rich-text-editor-${escapeHtml(
                    node.type
                )}
              "
              data-geneo-rich-text-editor-shell>

              <div
                class="geneo-rich-text-editor-host"
                data-geneo-rich-text-editor>
              </div>

              <textarea
                class="geneo-rich-text-fallback"
                data-geneo-rich-text-fallback
                aria-label="${escapeHtml(
                    node.type === 'sticky'
                        ? 'Sticky note content'
                        : 'Text block content'
                )}"
                hidden>${escapeHtml(
                    node.text || ''
                )}</textarea>
            </div>
          `;
        }

        return `
          <div
            class="
              geneo-rich-text-copy
              geneo-${escapeHtml(
                    node.type
                )}-copy
            ">
            ${geneographRichTextDisplayHtml(
                node
            )}
          </div>
        `;
    }

    const panelTitle =
        String(
            node.title ?? ''
        ).trim();

    if (editing)
    {
        return `
          <input
            class="geneo-inline-editor"
            data-geneo-inline-input
            maxlength="160"
            value="${escapeHtml(
                panelTitle
            )}">
        `;
    }

    return panelTitle
        ? `
          <span
            class="geneo-panel-title">
            ${escapeHtml(
                panelTitle
            )}
          </span>
        `
        : '';
}

function renderGeneographPorts(
    node
)
{
    if (node?.type === 'drawing') return '';
    if (
        isGeneographRichTextNode(
            node
        )
        && state.geneoInlineEditNodeId
          === node.id
    )
    {
        return '';
    }

    return [
        'top',
        'right',
        'bottom',
        'left'
    ]
        .map(port => `
          <button
            class="
              geneo-port
              ${
                    state
                        .geneoConnectionDraft
                        ?.nodeId === node.id
                && state
                    .geneoConnectionDraft
                    ?.port === port
                        ? 'active'
                        : ''
                }
            "
            type="button"
            data-geneo-port="${port}"
            data-geneo-port-node="${escapeHtml(
                node.id
            )}"
            aria-label="Connect from ${port}">
          </button>
        `)
        .join('');
}

function renderGeneographResizeHandles(
    node
)
{
    if (
        selectedGeneographNodes().length
          !== 1
        || selectedGeneographConnections()
            .length
        || state.selectedGeneoNodeId
          !== node.id
        || geneoNodeEffectiveLocked(node)
        || (
            isGeneographRichTextNode(
                node
            )
          && state.geneoInlineEditNodeId
            === node.id
        )
    )
    {
        return '';
    }

    const handles = [
        'nw',
        'ne',
        'se',
        'sw',
        'n',
        'e',
        's',
        'w'
    ];

    return handles
        .map(handle => `
          <button
            class="
              ${
                    handle.length === 1
                        ? 'geneo-resize-edge'
                        : 'geneo-resize-handle'
                }
              ${handle}
            "
            type="button"
            data-geneo-resize="${handle}"
            data-geneo-node="${escapeHtml(
                node.id
            )}"
            aria-label="${escapeHtml(
                `${t(({
                        n: 'Resize from top edge',
                        e: 'Resize from right edge',
                        s: 'Resize from bottom edge',
                        w: 'Resize from left edge',
                        nw: 'Resize from top left corner',
                        ne: 'Resize from top right corner',
                        se: 'Resize from bottom right corner',
                        sw: 'Resize from bottom left corner'
                    })[handle]
                )}: ${geneoNodeTitle(node)}`
            )}">
          </button>
        `)
        .join('');
}

function renderGeneographObject(node)
{
    if (
        !geneoNodeEffectiveVisible(node)
    )
    {
        return '';
    }

    const appearance =
        node.appearance || {};

    const richEditing =
        isGeneographRichTextNode(
            node
        )
        && state.geneoInlineEditNodeId
          === node.id;

    const personSettings =
        node.type === 'person'
            ? geneoPersonCardEffectiveSettings(
                node
            )
            : null;
    const boardPerson = node.type === 'person' ? getGeneographPerson(node.personId) : null;
    const treeMatch = boardPerson?.treePersonId ? getPerson(boardPerson.treePersonId) : null;
    const personLinked = Boolean(treeMatch && !treeMatch.deleted && treeMatch.projectId === currentProjectId());
    const highlight = geneoCanvasRuntime.objectHighlight || 'none';
    const highlighted = highlight === node.type
        || (node.type === 'person' && (highlight === 'linked' && personLinked
            || highlight === 'unlinked' && !personLinked));
    const dimmed = highlight !== 'none' && !highlighted;
    const visibleAppearance =
        geneoResolveVisibleNodeAppearance(
            node
        );

    const genderColorClass =
        visibleAppearance.gender
            ? `geneo-person-gender-${
                visibleAppearance.gender
            }`
            : '';

    const visibleFill =
        visibleAppearance.fill;

    const visibleStroke =
        visibleAppearance.stroke;

    const visibleText =
        visibleAppearance.text;

    const strokePattern =
        (visibleAppearance.strokePattern || appearance.strokePattern)
          === 'dashed'
            ? 'dashed'
            : 'solid';

    const bounds =
        geneoCanvasRuntime.bounds
        || {
            left: 0,
            top: 0
        };

    const style = [
        `left:${node.x - bounds.left}px`,
        `top:${node.y - bounds.top}px`,
        `width:${node.width}px`,
        `height:${node.height}px`,
        `--geneo-node-bg:${geneoPaintCssColor(
            visibleFill
        )}`,
        `--geneo-node-gap-bg:${geneoPersonActionGapColor(visibleFill)}`,
        `--geneo-node-stroke:${geneoPaintCssColor(
            visibleStroke
        )}`,
        `--geneo-node-stroke-width:${
            visibleAppearance.strokeWidth ?? appearance.strokeWidth ?? GENEO_STROKE_WIDTH_MIN
        }px`,
        `--geneo-node-stroke-style:${
            visibleStroke?.enabled
                ? strokePattern
                : 'none'
        }`,
        `--geneo-node-text:${geneoPaintCssColor(
            visibleText
        )}`,
        `--geneo-node-radius:${
            geneoNodeCornerRadius(node)
        }px`,
        ...(['text', 'sticky', 'place'].includes(node.type)
            ? [`--geneo-node-font-size:${appearance.fontSize}px`]
            : []),

        ...(
            personSettings
                ? geneoPersonCardCssVariables(
                    node,
                    personSettings
                )
                : []
        ),

        `z-index:${
            richEditing || geneoImageCropRuntime?.nodeId === node.id
                ? 1000
                : node.type === 'panel'
                    ? Math.max(
                        1,
                        Math.min(
                            10,
                            node.order
                        )
                    )
                    : 20 + node.order
        }`
    ].join(';');

    return `
        <article
          class="
            geneo-node
            geneo-node-${node.type}
            ${
                geneoSelectedNodeIdSet()
                    .has(node.id)
                    ? 'selected'
                    : ''
            }
            ${
                geneoNodeEffectiveLocked(
                    node
                )
                    ? 'locked'
                    : ''
            }
            ${
                richEditing
                    ? 'is-rich-editing'
                    : ''
            }
            ${
                node.type === 'sticky'
              && appearance.fill?.enabled
              && geneoNumber(
                  appearance.fill.opacity,
                  100,
                  0,
                  100
              ) > 0
                    ? 'has-paper-fill'
                    : ''
            }
            ${
                visibleStroke?.enabled
                    ? `stroke-${strokePattern}`
                    : 'stroke-none'
            }
            ${genderColorClass}
            ${dimmed ? 'geneo-object-dimmed' : ''}
          "
          style="${style}"
          data-geneo-node="${escapeHtml(
                node.id
            )}"
          ${node.type === 'shape' ? `data-geneo-shape-kind="${escapeHtml(normalizeGeneographShapeKind(node.shapeKind))}"` : ''}
          ${boardPerson && personSettings?.fields.linkIndicator ? `data-geneo-person-link-status="${personLinked ? 'linked' : boardPerson.treePersonId ? 'attention' : 'board'}"` : ''}
          ${
                personSettings
                    ? `
                data-geneo-person-card-style="${escapeHtml(
                    personSettings.style
                )}"
                data-geneo-person-card-align="${escapeHtml(
                    personSettings.alignment
                )}"
                data-geneo-person-card-name-align="${escapeHtml(
                    personSettings.nameAlignment
                )}"
                data-geneo-person-card-photo="${escapeHtml(
                    personSettings.photoSize
                )}"
                data-geneo-person-card-photo-align="${escapeHtml(
                    personSettings.photoAlignment
                )}"
                data-geneo-person-card-height-mode="${escapeHtml(
                    personSettings.heightMode
                )}"
              `
                    : ''
            }
          tabindex="0"
          aria-label="${escapeHtml(
                geneoNodeTitle(node)
            )}${boardPerson && personSettings?.fields.linkIndicator ? `, ${personLinked ? 'Linked to Family Tree' : boardPerson.treePersonId ? 'Link needs attention' : 'Board only'}` : ''}">
          <div
            class="geneo-node-content">
            ${renderGeneographNodeContent(
                node
            )}
          </div>

          ${node.type === 'image' && geneoImageCropRuntime?.nodeId === node.id
                && geneoImageCropRuntime.boardId === selectedGeneographBoard()?.id
                ? (() => { const source = resolveGeneographImageSource(node);
                    const crop = geneoImageCropRuntime.draft;
                    const cropStyle = geneoImageCropStyle(node, source, crop);
                    return `<div class="geneo-image-crop-preview" style="${cropStyle}" aria-hidden="true"><img src="${escapeHtml(source.photo.src || '')}" alt=""></div>
                    <div class="geneo-image-crop-bounds" style="${cropStyle}">
                      ${[['nw', 'top left'], ['ne', 'top right'], ['se', 'bottom right'], ['sw', 'bottom left']]
                        .map(([corner, position]) => `<button class="geneo-image-crop-handle ${corner}" type="button" data-geneo-image-crop-handle="${corner}" aria-label="${escapeHtml(t(`Resize photo from ${position}`))}" title="${escapeHtml(t(`Resize photo from ${position}`))}"></button>`).join('')}
                      ${[['n', 'top'], ['e', 'right'], ['s', 'bottom'], ['w', 'left']]
                        .map(([edge, position]) => `<button class="geneo-image-crop-edge ${edge}" type="button" data-geneo-image-crop-handle="${edge}" aria-label="${escapeHtml(t(`Resize photo from ${position} edge`))}" title="${escapeHtml(t(`Resize photo from ${position} edge`))}"></button>`).join('')}
                    </div>
                    <div class="geneo-image-crop-toolbar" data-geneo-image-crop-toolbar>
                      <button type="button" data-geneo-image-crop-reset>${escapeHtml(t('Reset'))}</button>
                      <button type="button" data-geneo-image-crop-fit>${escapeHtml(t('Fit'))}</button>
                      <button type="button" data-geneo-image-crop-cancel>${escapeHtml(t('Cancel'))}</button>
                      <button type="button" data-geneo-image-crop-apply>${escapeHtml(t('Apply'))}</button>
                    </div>`; })() : ''}

          ${node.type === 'person' && ['compact', 'chart', 'portrait'].includes(personSettings?.style) ? '<span class="geneo-person-action-gap" aria-hidden="true"></span>' : ''}

          ${
                node.type === 'person'
                    ? renderGeneographPersonAddRelativeAction(node)
                    : ''
            }

          ${
                node.type === 'person'
              && ['standard', 'compact', 'chart', 'portrait'].includes(personSettings?.style)
                    ? renderGeneographPersonEditAction(node)
                    : ''
          }

          ${renderGeneographRichTextToolbar(
                node
            )}

          ${renderGeneographPorts(
                node
            )}

          ${renderGeneographResizeHandles(
                node
            )}
        </article>
      `;
}

const GENEO_ITEM_FILTER_TYPES = [
    ['person', 'People'], ['image', 'Images'], ['place', 'Places'],
    ['sticky', 'Sticky notes'], ['text', 'Text'], ['shape', 'Shapes'],
    ['drawing', 'Drawings'], ['panel', 'Panels'],
    ['family-partner', 'Partners'], ['family-child', 'Parent-child relationship'],
    ['family-sibling', 'Siblings'], ['visual', 'Visual connection']
];

function geneoItemFilterMatches(type, visible, selected)
{
    const filter = state.geneoItemFilter || { types: [], status: 'all' };
    return (!filter.types.length || filter.types.includes(type))
        && (filter.status !== 'hidden' || !visible)
        && (filter.status !== 'selected' || selected);
}

function renderGeneoItemFilterMenu()
{
    const filter = state.geneoItemFilter || { types: [], status: 'all' };
    return `<div class="geneo-item-filter-menu" data-geneo-item-filter-menu ${state.geneoItemFilterOpen ? '' : 'hidden'}>
        <div class="geneo-item-filter-heading">${escapeHtml(t('Item type'))}</div>
        ${GENEO_ITEM_FILTER_TYPES.map(([value, label], index) => `${index === 8 ? `<div class="geneo-item-filter-heading">${escapeHtml(t('Connections'))}</div>` : ''}
            <label><input type="checkbox" data-geneo-item-filter-type="${value}" ${filter.types.includes(value) ? 'checked' : ''}><span>${escapeHtml(t(label))}</span></label>`).join('')}
        <div class="geneo-item-filter-heading">${escapeHtml(t('Show items'))}</div>
        ${[['all', 'All items'], ['hidden', 'Hidden items'], ['selected', 'Selected items']]
            .map(([value, label]) => `<label><input type="radio" name="geneoItemStatus" data-geneo-item-filter-status="${value}" ${filter.status === value ? 'checked' : ''}><span>${escapeHtml(t(label))}</span></label>`).join('')}
        <button class="geneo-item-filter-clear" type="button" data-geneo-item-filter-clear>${escapeHtml(t('Clear filters'))}</button>
      </div>`;
}

const geneoConnectionDisclosureState = new Map();
const geneoConnectionDisclosureSelection = new Map();

function geneoSidebarConnectionOwner(connection, diagram)
{
    const reference = connection.kind === 'family-child' ? connection.target : connection.source;
    if (reference?.nodeId && diagram.nodes.some(node => node.id === reference.nodeId)) return reference.nodeId;
    const family = diagram.families.find(item => item.id === (reference?.familyId || connection.familyId));
    for (const id of family?.partnerIds || [])
    {
        const node = diagram.nodes.find(item => item.type === 'person' && item.personId === id);
        if (node) return node.id;
    }
    return '';
}

function renderGeneographEditorSidebar(board)
{
    const diagram = board.diagram;
    const query = state.geneoLayerSearch.trim().toLowerCase();
    const selectedIds = geneoSelectedNodeIdSet();
    const selectedConnectionIds = geneoSelectedConnectionIdSet();
    const matches = node => geneoItemFilterMatches(node.type, geneoNodeEffectiveVisible(node), selectedIds.has(node.id))
        && (!query || `${geneoNodeTitle(node)} ${node.type} ${t(node.type)} ${node.visible === false ? t('Hidden') : ''}`.toLowerCase().includes(query));
    const connections = diagram.connections.filter(connection => {
        if (!geneoItemFilterMatches(connection.kind, geneoConnectionEffectiveVisible(connection), selectedConnectionIds.has(connection.id))) return false;
        const names = `${geneoConnectionLabel(connection)} ${geneoDefaultConnectionLabel(connection)} ${geneoConnectionKindLabel(connection)} ${connection.kind} ${connection.visible === false ? t('Hidden') : ''}`;
        return !query || names.toLowerCase().includes(query);
    });
    const filter = state.geneoItemFilter || { types: [], status: 'all' };
    const filterActive = filter.types.length || filter.status !== 'all';
    const ownedConnections = new Map();
    const orphanConnections = [];
    const visibleIds = new Set(diagram.nodes.filter(matches).map(node => node.id));
    connections.forEach(connection =>
    {
        const owner = geneoSidebarConnectionOwner(connection, diagram);
        if (!owner) { orphanConnections.push(connection); return; }
        if (!ownedConnections.has(owner)) ownedConnections.set(owner, []);
        ownedConnections.get(owner).push(connection);
        visibleIds.add(owner);
    });
    [...visibleIds].forEach(id =>
    {
        let node = diagram.nodes.find(item => item.id === id);
        const seen = new Set();
        while (node?.parentPanelId && !seen.has(node.parentPanelId))
        { seen.add(node.parentPanelId); visibleIds.add(node.parentPanelId); node = diagram.nodes.find(item => item.id === node.parentPanelId); }
    });
    const rootItems = diagram.nodes.filter(node => !node.parentPanelId && visibleIds.has(node.id)).sort((a, b) => b.order - a.order);
    const row = (
        node,
        depth = 0
    ) =>
    {
        const displayName =
            geneoNodeTitle(node);

        const renaming =
            geneoLayerRenameMatches(
                'node',
                node.id
            );

        return `
          <div
            class="geneo-layer-row ${
                selectedIds.has(node.id)
                    ? 'selected'
                    : ''
            }"
            style="--layer-depth:${depth}"
            data-geneo-layer="${
                escapeHtml(node.id)
            }"
            draggable="${!renaming && !geneoNodeEffectiveLocked(node)}"
            tabindex="${renaming ? -1 : 0}">
            <span class="geneo-layer-icon">
              ${geneoNodeIcon(node.type)}
            </span>

            ${
                renderGeneographLayerNameCell(
                    'node',
                    node.id,
                    displayName
                )
            }

            <span class="geneo-layer-actions">
              <button class="geneo-layer-toggle" type="button" data-geneo-locate-node="${escapeHtml(node.id)}" ${geneoNodeEffectiveVisible(node) ? '' : 'disabled'} aria-label="${escapeHtml(`${t('Locate on canvas')}: ${displayName}`)}" title="${escapeHtml(t('Locate on canvas'))}">${icon.mapCenter}</button>

            <button
              class="geneo-layer-toggle"
              type="button"
              data-geneo-toggle-visible="${
                    escapeHtml(node.id)
                }"
              aria-label="${
                    node.visible
                        ? 'Hide'
                        : 'Show'
                } ${escapeHtml(displayName)}">
              ${
                    node.visible
                        ? icon.eye
                        : icon.eyeOff
                }
            </button>

            <button
              class="geneo-layer-toggle"
              type="button"
              data-geneo-toggle-lock="${
                    escapeHtml(node.id)
                }"
              aria-label="${
                    node.locked
                        ? 'Unlock'
                        : 'Lock'
                } ${escapeHtml(displayName)}">
              ${
                    node.locked
                        ? icon.lock
                        : icon.unlock
                }
            </button>
            </span>
          </div>
        `;
    };
    const connectionRow =
        (connection, depth = 1) =>
        {
            const displayName =
                geneoConnectionLabel(
                    connection
                );

            const renaming =
                geneoLayerRenameMatches(
                    'connection',
                    connection.id
                );

            return `
          <div
            class="geneo-layer-row ${
                selectedConnectionIds.has(
                    connection.id
                )
                    ? 'selected'
                    : ''
            }"
            style="--layer-depth:${depth}"
            draggable="false"
            data-geneo-layer-connection="${
                escapeHtml(connection.id)
            }"
            tabindex="${renaming ? -1 : 0}">
            <span class="geneo-layer-icon">
              ${icon.link}
            </span>

            <span class="geneo-layer-identity">
              ${renderGeneographLayerNameCell('connection', connection.id, displayName)}
              <span class="geneo-layer-subtitle" title="${escapeHtml(geneoDefaultConnectionLabel(connection))}">${escapeHtml(normalizeGeneographLayerName(connection.name) ? geneoDefaultConnectionLabel(connection) : geneoConnectionKindLabel(connection))}</span>
            </span>
            <span class="geneo-layer-paint-status" data-geneo-connection-paint-status ${connection.visible === false || geneoEffectiveConnectionStyle(connection).line.enabled ? 'hidden' : ''}>${escapeHtml(t('No stroke'))}</span>
            <span class="geneo-layer-actions">
              <button class="geneo-layer-toggle" type="button" data-geneo-locate-connection="${escapeHtml(connection.id)}" ${geneoConnectionEffectiveVisible(connection) ? '' : 'disabled'} aria-label="${escapeHtml(`${t('Locate on canvas')}: ${displayName}`)}" title="${escapeHtml(t('Locate on canvas'))}">${icon.mapCenter}</button>
              <button class="geneo-layer-toggle" type="button" data-geneo-toggle-connection-visible="${escapeHtml(connection.id)}" aria-label="${escapeHtml(`${t(connection.visible === false ? 'Show' : 'Hide')} ${displayName}`)}" title="${escapeHtml(t(connection.visible === false ? 'Show' : 'Hide'))}">${connection.visible === false ? icon.eyeOff : icon.eye}</button>
            </span>
          </div>
        `;
        };
    if (!geneoConnectionDisclosureState.has(board.id)) geneoConnectionDisclosureState.set(board.id, new Set());
    const expanded = geneoConnectionDisclosureState.get(board.id);
    const previousConnectionSelection = geneoConnectionDisclosureSelection.get(board.id) || new Set();
    geneoConnectionDisclosureSelection.set(board.id, new Set(selectedConnectionIds));
    connections.filter(connection => selectedConnectionIds.has(connection.id) && !previousConnectionSelection.has(connection.id)).forEach(connection =>
    {
        let owner = diagram.nodes.find(node => node.id === geneoSidebarConnectionOwner(connection, diagram));
        const seen = new Set();
        while (owner && !seen.has(owner.id))
        {
            seen.add(owner.id);
            expanded.add(owner.id);
            if (owner.type === 'panel') state.geneoCollapsedPanels[owner.id] = false;
            owner = diagram.nodes.find(node => node.id === owner.parentPanelId);
        }
    });
    const renderBlock = (node, depth = 0) =>
    {
        const children = diagram.nodes.filter(child => child.parentPanelId === node.id && visibleIds.has(child.id)).sort((a, b) => b.order - a.order);
        const links = ownedConnections.get(node.id) || [];
        const expandable = children.length || links.length;
        const collapsed = !query && !filterActive && (node.type === 'panel' ? Boolean(state.geneoCollapsedPanels[node.id]) : !expanded.has(node.id));
        return `<div class="geneo-item-block" data-geneo-layer-block="${escapeHtml(node.id)}">${expandable ? `<div class="geneo-layer-panel-head" style="--layer-depth:${depth}"><button class="geneo-layer-disclosure" type="button" ${node.type === 'panel' ? 'data-geneo-collapse-panel' : 'data-geneo-collapse-connections'}="${escapeHtml(node.id)}" aria-label="${escapeHtml(geneoNodeTitle(node))}" aria-expanded="${!collapsed}">${icon.chevron}</button>${row(node, depth)}</div>` : row(node, depth)}${collapsed ? '' : children.map(child => renderBlock(child, depth + 1)).join('') + links.map(connection => connectionRow(connection, depth + 1)).join('')}</div>`;
    };
    const itemsMarkup = rootItems.map(node => renderBlock(node)).join('') + (orphanConnections.length ? `<div class="geneo-other-connections"><div class="geneo-context-heading">${escapeHtml(t('Other connections'))}</div>${orphanConnections.map(connection => connectionRow(connection, 0)).join('')}</div>` : '');
    sidebar.innerHTML = `<nav class="geneo-sidebar geneo-board-panel" aria-label="Geneograph board navigation">
        <section class="geneo-sidebar-section navigation"><div class="side-section-title">Navigation</div><div class="side-nav">${renderGeneoAllBoardsNavigationButton({ editor: true })}</div></section>
        <section class="geneo-sidebar-section geneo-layers"><div class="side-section-title">${escapeHtml(t('Board items'))}</div><div class="geneo-sidebar-section-body"><div class="geneo-layer-tools"><input class="geneo-object-search" id="geneoLayerSearch" type="search" aria-label="${escapeHtml(t('Search board items'))}" placeholder="${escapeHtml(t('Search board items'))}" value="${escapeHtml(state.geneoLayerSearch)}"><button class="geneo-item-filter-trigger ${filterActive ? 'active' : ''}" type="button" data-geneo-item-filter-trigger aria-label="${escapeHtml(t('Filter items'))}" title="${escapeHtml(t('Filter items'))}" aria-expanded="${Boolean(state.geneoItemFilterOpen)}" aria-controls="geneoItemFilterMenu">${icon.filter}</button><div id="geneoItemFilterMenu">${renderGeneoItemFilterMenu()}</div></div><div class="geneo-layer-list">${itemsMarkup}${!rootItems.length && !orphanConnections.length ? `<div class="geneo-item-empty">${escapeHtml(t(diagram.nodes.length || diagram.connections.length ? 'No matching items' : 'No items on this board'))}${(diagram.nodes.length || diagram.connections.length) && (query || filterActive) ? `<button type="button" data-geneo-item-filter-clear>${escapeHtml(t('Clear search and filters'))}</button>` : ''}</div>` : ''}</div></div></section>
      </nav>`;

    localizeUI(
        sidebar,
        {
            suppressObserverReplay: true
        }
    );
}

function geneoConnectionEndpointNames(reference)
{
    return [...new Set(geneoConnectionReferenceNodes(reference)
        .map(node => geneoNodeTitle(node)))];
}

function geneoConnectionKindLabel(connection)
{
    return t({
        'family-partner': 'Partners',
        'family-child': 'Parent-child relationship',
        'family-sibling': 'Siblings',
        visual: 'Visual connection'
    }[connection.kind] || 'Visual connection');
}

function geneoDefaultConnectionLabel(connection)
{
    const source = geneoConnectionEndpointNames(connection.source);
    const target = geneoConnectionEndpointNames(connection.target);
    if (!source.length || !target.length) return geneoConnectionKindLabel(connection);
    if (connection.kind === 'family-child')
        return `${target.join(' & ')} · ${t(source.length === 1 ? 'Parent' : 'Parents')}: ${source.join(' & ')}`;
    return `${source.join(' & ')} - ${target.join(' & ')}`;
}

function geneoConnectionLabel(
    connection
)
{
    return (
        normalizeGeneographLayerName(
            connection?.name
        )
        || geneoDefaultConnectionLabel(
            connection
        )
    );
}

function getGeneographRenameEntity(
    entityType,
    entityId
)
{
    if (entityType === 'node')
    {
        return getGeneographNode(entityId);
    }

    if (entityType === 'connection')
    {
        return getGeneographConnection(
            entityId
        );
    }

    return null;
}

function geneoRenameEntityDisplayName(
    entityType,
    entity
)
{
    return entityType === 'node'
        ? geneoNodeTitle(entity)
        : geneoConnectionLabel(entity);
}

function geneoLayerRenameMatches(
    entityType,
    entityId
)
{
    return Boolean(
        state.geneoLayerRename
        && state.geneoLayerRename.entityType
          === entityType
        && state.geneoLayerRename.entityId
          === entityId
    );
}

function renameGeneographEntity(
    entityType,
    entityId,
    value
)
{
    const entity =
        getGeneographRenameEntity(
            entityType,
            entityId
        );

    if (!entity) return false;

    const currentName =
        normalizeGeneographLayerName(
            entity.name
        );

    const nextName =
        normalizeGeneographLayerName(
            value
        );

    if (currentName === nextName)
    {
        return false;
    }

    geneoPushHistory();

    entity.name = nextName;

    touchGeneographBoard();

    return true;
}

function focusGeneographLayerRow(
    entityType,
    entityId
)
{
    const attribute =
        entityType === 'node'
            ? 'data-geneo-layer'
            : 'data-geneo-layer-connection';

    const selector =
        `[${attribute}="${
            CSS.escape(String(entityId))
        }"]`;

    sidebar
        .querySelector(selector)
        ?.focus({
            preventScroll: true
        });
}

function beginGeneographLayerRename(
    entityType,
    entityId
)
{
    const entity =
        getGeneographRenameEntity(
            entityType,
            entityId
        );

    if (!entity) return;

    if (entityType === 'node')
    {
        selectGeneographNode(entityId);
    }
    else
    {
        selectGeneographConnection(
            entityId
        );
    }

    const originalName =
        normalizeGeneographLayerName(
            entity.name
        );

    const initialDisplay =
        localizedDataFieldValue(
            normalizeGeneographLayerName(
                geneoRenameEntityDisplayName(
                    entityType,
                    entity
                )
            )
        );

    state.geneoLayerRename = {
        entityType,
        entityId,
        originalName,
        initialDisplay,
        draft: initialDisplay
    };

    renderGeneographEditorPreserveScroll();

    requestAnimationFrame(() =>
    {
        const input =
            sidebar.querySelector(
                '[data-geneo-layer-rename-input]'
            );

        if (!input) return;

        input.focus({
            preventScroll: true
        });

        input.select();
    });
}

function finishGeneographLayerRename({
    cancel = false,
    value = '',
    restoreFocus = true
} = {})
{
    const rename =
        state.geneoLayerRename;

    if (!rename) return;

    const {
        entityType,
        entityId,
        originalName,
        initialDisplay
    } = rename;

    state.geneoLayerRename = null;

    if (!cancel)
    {
        const submittedName =
            normalizeGeneographLayerName(
                value
            );

        /*
        * Pressing Enter without editing an
        * automatic fallback should not freeze
        * that fallback as a custom name.
        */
        const nextName =
            submittedName === initialDisplay
                ? originalName
                : submittedName;

        renameGeneographEntity(
            entityType,
            entityId,
            nextName
        );
    }

    renderGeneographEditorPreserveScroll();

    if (!restoreFocus) return;

    requestAnimationFrame(() =>
    {
        focusGeneographLayerRow(
            entityType,
            entityId
        );
    });
}

function renderGeneographLayerNameCell(
    entityType,
    entityId,
    displayName
)
{
    const localizedDisplayName =
        localizedDataFieldValue(
            displayName
        );

    if (
        geneoLayerRenameMatches(
            entityType,
            entityId
        )
    )
    {
        return `
          <input
            class="geneo-layer-name-input"
            type="text"
            maxlength="${GENEO_LAYER_NAME_LIMIT}"
            value="${
                escapeHtml(
                    state.geneoLayerRename.draft
                )
            }"
            data-geneo-layer-rename-input
            data-geneo-rename-type="${
                escapeHtml(entityType)
            }"
            data-geneo-rename-id="${
                escapeHtml(entityId)
            }"
            data-user-content
            aria-label="${
                entityType === 'node'
                    ? 'Rename layer'
                    : 'Rename connection'
            }">
        `;
    }

    return `
        <span
          class="name"
          data-geneo-layer-rename-handle
          data-user-content
          title="${escapeHtml(localizedDisplayName)}">
          ${escapeHtml(localizedDisplayName)}
        </span>
      `;
}

function geneoRelationshipForFamily(family)
{
    return { relationship: family, central: false };
}

function geneoResolveBoardPersonPlace(value)
{
    const text = String(value?.text ?? value ?? '').trim();
    const projectId = selectedGeneographBoard()?.projectId || currentProjectId();
    const selected = text && (sampleData.places || []).find(place => place.id === value?.selectedPlaceId && place.projectId === projectId && !place.deleted);
    const place = selected || (text ? findExactPlaceMatch(text, projectId) : null);
    return { placeId: place?.id || null, placeText: text, address: value?.address || '', created: false };
}

function geneoEffectiveShowRelationshipDates(connection, diagram = selectedGeneographDiagram())
{
    return connection?.showRelationshipDates ?? diagram?.connectionDefaults?.showRelationshipDates ?? false;
}

function geneoPartnerRelationshipDateLabel(connection)
{
    if (connection?.kind !== 'family-partner' || !geneoEffectiveShowRelationshipDates(connection)) return '';
    const family = getGeneographFamily(connection.familyId);
    const relationship = geneoRelationshipForFamily(family).relationship;
    return partnerRelationshipDateSummary(relationship).rangeLabel || '';
}

function renderGeneographRelationshipDateLabel(connection, points)
{
    const label = geneoPartnerRelationshipDateLabel(connection);
    const midpoint = label ? geneoPolylineMidpoint(points) : null;
    if (!midpoint) return '';
    const width = Math.max(72, Math.min(260, label.length * 7 + 20));
    return `<g class="geneo-relationship-date" transform="translate(${midpoint.x} ${midpoint.y - 18})" aria-label="Relationship date ${escapeHtml(label)}"><rect x="${-width / 2}" y="-13" width="${width}" height="24" rx="4"></rect><text text-anchor="middle" dominant-baseline="middle">${escapeHtml(label)}</text></g>`;
}

function geneoRgbToHsv({ r, g, b })
{
    const red = r / 255;
    const green = g / 255;
    const blue = b / 255;
    const maximum = Math.max(red, green, blue);
    const minimum = Math.min(red, green, blue);
    const delta = maximum - minimum;
    let hue = 0;
    if (delta)
    {
        if (maximum === red) hue = 60 * (((green - blue) / delta) % 6);
        else if (maximum === green) hue = 60 * ((blue - red) / delta + 2);
        else hue = 60 * ((red - green) / delta + 4);
    }
    if (hue < 0) hue += 360;
    return {
        h: hue,
        s: maximum ? delta / maximum * 100 : 0,
        v: maximum * 100
    };
}

function geneoHsvToHex({ h, s, v })
{
    const hue = ((geneoNumber(h, 0) % 360) + 360) % 360;
    const saturation = geneoNumber(s, 0, 0, 100) / 100;
    const value = geneoNumber(v, 0, 0, 100) / 100;
    const chroma = value * saturation;
    const x = chroma * (1 - Math.abs((hue / 60) % 2 - 1));
    const offset = value - chroma;
    let channels = [0, 0, 0];
    if (hue < 60) channels = [chroma, x, 0];
    else if (hue < 120) channels = [x, chroma, 0];
    else if (hue < 180) channels = [0, chroma, x];
    else if (hue < 240) channels = [0, x, chroma];
    else if (hue < 300) channels = [x, 0, chroma];
    else channels = [chroma, 0, x];
    return `#${channels.map(channel => Math.round((channel + offset) * 255).toString(16).padStart(2, '0')).join('')}`.toUpperCase();
}

function geneoPaintTargetKey(target)
{
    return target ? `${target.scope}:${target.id || 'canvas'}:${target.property}` : '';
}

function geneoBulkPaintScope(scope)
{
    return ['person-multi', 'node-multi', 'connection-multi'].includes(scope);
}

function geneoBulkPaintValue(target, item)
{
    return target.scope === 'connection-multi' ? geneoEffectiveConnectionStyle(item).line
        : target.scope === 'person-multi' ? geneoResolveVisibleNodeAppearance(item)[target.property]
            : geneoBulkNodeValue(item, target.property);
}

function geneoBulkPaintTarget(scope, property)
{
    const connections = scope === 'connection-multi';
    const items = connections ? selectedGeneographConnections() : selectedGeneographNodes();
    if (!items.length || (connections && property !== 'line')
        || (!connections && (!['fill', 'stroke', 'text'].includes(property)
            || items.some(node => scope === 'person-multi' ? node.type !== 'person'
                : !geneoBulkNodeSupports(node, property))))) return null;
    const target = { scope, id: '', property, items, label: connections ? t('Connection color') : t(capitalize(property)),
        supportsOpacity: true, supportsNone: property !== 'text', resettable: false,
        defaultPaint: connections ? selectedGeneographDiagram().connectionDefaults.line
            : { color: '#FFFFFF', opacity: 100, enabled: true } };
    const values = items.map(item => geneoBulkPaintValue(target, item));
    const shared = field => values.every(value => value[field] === values[0][field]) ? values[0][field] : null;
    target.mixed = { color: shared('color') === null, opacity: shared('opacity') === null,
        enabled: shared('enabled') === null };
    target.paint = { color: shared('color') || target.defaultPaint.color,
        opacity: shared('opacity') ?? 100, enabled: shared('enabled') ?? true };
    return target;
}

function geneoApplyBulkPaintChanges(target, changes)
{
    const diagram = selectedGeneographDiagram();
    if (!diagram) return;
    target.items.forEach(item =>
    {
        for (const [field, value] of Object.entries(changes))
        {
            if (target.scope !== 'connection-multi')
            {
                geneoUpdateBulkNodeAppearance(item, target.property, field, value, diagram);
                continue;
            }
            const line = { ...geneoEffectiveConnectionStyle(item).line, [field]: value };
            item.style ||= {};
            if (['color', 'opacity', 'enabled'].every(key => line[key] === diagram.connectionDefaults.line[key]))
                delete item.style.line;
            else item.style.line = line;
        }
    });
}

function geneoRestoreBulkPaintItems(interaction)
{
    interaction.beforeItems.forEach(({ id, appearance, style }) =>
    {
        if (appearance)
        {
            const node = getGeneographNode(id);
            if (node) node.appearance = structuredClone(appearance);
        }
        else
        {
            const connection = getGeneographConnection(id);
            if (connection) connection.style = structuredClone(style);
        }
    });
}

function resolveGeneoPaintTarget(reference)
{
    if (!reference) return null;
    const { scope, id = '', property } = reference;
    if (geneoBulkPaintScope(scope)) return geneoBulkPaintTarget(scope, property);
    if (scope === 'creation-tool' && ['drawing', 'shape'].includes(id) && ['fill', 'stroke'].includes(property))
    {
        const appearance = geneoCreationToolSettings(id).appearance;
        if (id === 'drawing' && property === 'fill') return null;
        return { scope, id, property, label: t(capitalize(property)), paint: appearance[property],
            supportsOpacity: true, supportsNone: true, resettable: false,
            defaultPaint: geneoNodeDefaults(id).appearance[property] };
    }
    if (scope === 'connection-default' && property === 'line')
    {
        const line = selectedGeneographDiagram()?.connectionDefaults?.line;
        if (!line) return null;
        return { scope, id, property, label: t('Connection color'), paint: line,
            supportsOpacity: true, supportsNone: false, resettable: false,
            defaultPaint: geneoDefaultConnectionStyle().line };
    }
    if (scope === 'connection-tool' && property === 'line')
    {
        geneoPaintRuntime.toolPaint ||= { ...geneoConnectionToolStyle().line };
        return { scope, id, property, label: t('Connection color'), paint: geneoPaintRuntime.toolPaint,
            supportsOpacity: true, supportsNone: false, resettable: false,
            defaultPaint: selectedGeneographDiagram().connectionDefaults.line };
    }
    if (scope === 'card-default')
    {
        const appearance = selectedGeneographDiagram()?.cardAppearanceDefaults?.[id];
        if (!appearance || !['fill', 'stroke', 'text'].includes(property)) return null;
        return {
            scope, id, property, label: capitalize(property),
            paint: appearance[property],
            supportsOpacity: true, supportsNone: property !== 'text', resettable: false,
            defaultPaint: geneoDefaultCardAppearances()[id][property]
        };
    }
    if (scope === 'canvas')
    {
        const canvas = selectedGeneographDiagram()?.canvas;
        if (!canvas || property !== 'background') return null;
        return {
            scope, id: selectedGeneographBoard()?.id || '', property,
            label: 'Background', paint: canvas.backgroundPaint,
            supportsOpacity: false, supportsNone: false, resettable: false,
            defaultPaint: { color: '#0F1413', opacity: 100, enabled: true }
        };
    }
    if (scope === 'connection')
    {
        const connection = getGeneographConnection(id);
        if (!connection || property !== 'line') return null;
        return {
            scope, id, property, entity: connection,
            label: 'Connection color', paint: connection.style.line || { ...geneoEffectiveConnectionStyle(connection).line },
            supportsOpacity: true, supportsNone: true, resettable: true,
            defaultPaint: selectedGeneographDiagram().connectionDefaults.line
        };
    }
    if (scope !== 'node') return null;
    const node = getGeneographNode(id);
    if (!node || !['fill', 'stroke', 'text'].includes(property)) return null;
    const applicable =
        property === 'text'
            ? node.type !== 'image'
            : property !== 'fill' || node.type !== 'image';
    if (!applicable) return null;
    const defaults = geneoNodeDefaults(node.type).appearance;
    return {
        scope, id, property, entity: node,
        label:
          property === 'fill'
              ? (
                  node.type === 'text'
                      ? 'Background'
                      : 'Fill'
              )
              : property === 'text'
                  ? node.type === 'panel' ? 'Title text' : 'Text'
                  : 'Stroke',
        paint: node.appearance[property],
        supportsOpacity: true,
        supportsNone: property !== 'text',
        resettable: property === 'text',
        defaultPaint: defaults[property]
    };
}

function geneoPaintReferenceFromElement(element)
{
    const host = element?.closest?.('[data-geneo-paint-scope]');
    if (!host) return null;
    return {
        scope: host.dataset.geneoPaintScope,
        id: host.dataset.geneoPaintId || '',
        property: host.dataset.geneoPaintProperty
    };
}

function geneoPaintDataAttributes(target)
{
    return `data-geneo-paint-scope="${escapeHtml(target.scope)}" data-geneo-paint-id="${escapeHtml(target.id || '')}" data-geneo-paint-property="${escapeHtml(target.property)}"`;
}

function geneoPaintSwatchStyle(paint)
{
    return `--geneo-paint-color:${normalizeGeneoHexColor(paint.color)};--geneo-paint-rendered:${geneoPaintCssColor({ ...paint, enabled: true })}`;
}

function renderGeneoPaintControl(reference)
{
    const target = resolveGeneoPaintTarget(reference);
    if (!target) return '';

    const paint = target.paint;
    const disabled = !paint.enabled;
    const actionSubject = target.label.toLowerCase();

    const action = target.supportsNone
        ? `
          <button
            class="geneo-paint-action"
            type="button"
            data-geneo-paint-toggle
            aria-label="${escapeHtml(
                disabled
                    ? `Restore ${actionSubject} color`
                    : `Remove ${actionSubject} color`
            )}">
            ${escapeHtml(t(disabled ? 'Restore' : 'Remove'))}
          </button>
        `
        : target.resettable
            ? `
            <button
              class="geneo-paint-action"
              type="button"
              data-geneo-paint-reset
              aria-label="${escapeHtml(
                    `Reset ${actionSubject} color to default`
                )}">
              Reset
            </button>
          `
            : '';

    return `
        <div
          class="geneo-paint-row ${disabled ? 'is-none' : ''}"
          ${geneoPaintDataAttributes(target)}>

          <div class="geneo-paint-row-heading">
            <div class="geneo-paint-heading-copy">
              <span class="geneo-paint-label">
                ${escapeHtml(target.label)}
              </span>

              <span
                class="geneo-paint-state"
                data-geneo-paint-state
                ${disabled ? '' : 'hidden'}>
                ${escapeHtml(t('None'))}
              </span>
            </div>

            ${action}
          </div>

          <div class="geneo-paint-controls ${
                target.supportsOpacity ? '' : 'is-color-only'
            }">
            <button
              class="geneo-paint-swatch"
              type="button"
              data-geneo-paint-open
              style="${geneoPaintSwatchStyle(paint)}"
              aria-label="${escapeHtml(
                    `Edit ${target.label} color, ${
                        disabled
                            ? 'None'
                            : `${paint.color}, ${paint.opacity}% opacity`
                    }`
                )}"
              aria-expanded="false"
              aria-controls="geneoPaintPopover"
              ${disabled ? 'disabled' : ''}>
              <span aria-hidden="true"></span>
            </button>

            <input
              class="geneo-paint-hex"
              type="text"
              value="${escapeHtml(paint.color)}"
              maxlength="7"
              spellcheck="false"
              autocomplete="off"
              data-geneo-paint-hex
              aria-label="${escapeHtml(`${target.label} hex color`)}"
              ${disabled ? 'disabled' : ''}>

            ${
                target.supportsOpacity
                    ? `
                  <label class="geneo-paint-opacity-number">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value="${paint.opacity}"
                      data-geneo-paint-opacity-number
                      aria-label="${escapeHtml(
                            `${target.label} opacity`
                        )}"
                      ${disabled ? 'disabled' : ''}>

                    <span aria-hidden="true">%</span>
                  </label>
                `
                    : ''
            }
          </div>
        </div>
      `;
}

function geneoCompositeRgb(foreground, background, alpha)
{
    const amount = geneoNumber(alpha, 1, 0, 1);
    return {
        r: Math.round(foreground.r * amount + background.r * (1 - amount)),
        g: Math.round(foreground.g * amount + background.g * (1 - amount)),
        b: Math.round(foreground.b * amount + background.b * (1 - amount))
    };
}

function geneoRelativeLuminance(rgb)
{
    const channel = value =>
    {
        const normalized = value / 255;
        return normalized <= .03928 ? normalized / 12.92 : ((normalized + .055) / 1.055) ** 2.4;
    };
    return .2126 * channel(rgb.r) + .7152 * channel(rgb.g) + .0722 * channel(rgb.b);
}

function geneoContrastRatio(first, second)
{
    const light = Math.max(geneoRelativeLuminance(first), geneoRelativeLuminance(second));
    const dark = Math.min(geneoRelativeLuminance(first), geneoRelativeLuminance(second));
    return (light + .05) / (dark + .05);
}

function geneoPersonGenderAppearance(
    node,
    diagram =
        selectedGeneographDiagram()
)
{
    if (node?.type !== 'person')
    {
        return null;
    }

    const person =
        (
            diagram.people || []
        ).find(
            item =>
                item.id === node.personId
        );

    const gender = diagram?.canvas?.colorPersonCardsByGender
        ? ['male', 'female'].includes(person?.gender) ? person.gender : 'unknown'
        : 'neutral';
    const appearance = diagram?.cardAppearanceDefaults?.[gender]
        || geneoDefaultCardAppearances()[gender];
    return { gender: gender === 'neutral' ? '' : gender, ...appearance };
}

function geneoCardAppearanceForNode(node, diagram = selectedGeneographDiagram())
{
    return geneoPersonGenderAppearance(node, diagram);
}

function geneoResolveVisibleNodeAppearance(
    node,
    diagram =
        selectedGeneographDiagram()
)
{
    const savedAppearance =
        node?.appearance || {};

    const genderAppearance =
        geneoPersonGenderAppearance(
            node,
            diagram
        );

    if (!genderAppearance)
    {
        return {
            gender: '',
            fill:
            savedAppearance.fill,
            stroke:
            savedAppearance.stroke,
            text:
            savedAppearance.text
        };
    }

    const paintOverrides =
        savedAppearance.paintOverrides
        && typeof savedAppearance
            .paintOverrides === 'object'
            ? savedAppearance
                .paintOverrides
            : {};

    const resolvePaint =
        property =>
            paintOverrides[property]
          === true
                ? savedAppearance[property]
                : genderAppearance[property];

    return {
        gender:
          genderAppearance.gender,

        fill:
          resolvePaint('fill'),

        stroke:
          resolvePaint('stroke'),

        text:
          resolvePaint('text'),
        strokeWidth: savedAppearance.styleOverrides?.strokeWidth
            ? savedAppearance.strokeWidth : genderAppearance.strokeWidth,
        strokePattern: savedAppearance.styleOverrides?.strokePattern
            ? savedAppearance.strokePattern : genderAppearance.strokePattern
    };
}

function geneoTextContrastRatio(
    node
)
{
    if (
        !node
        || node.type === 'image'
    )
    {
        return null;
    }

    const diagram =
        selectedGeneographDiagram();

    const canvasPaint =
        diagram?.canvas
            ?.backgroundPaint;

    const canvasRgb =
        geneoHexToRgb(
            canvasPaint?.color
          || '#0F1413'
        );

    const visibleAppearance =
        geneoResolveVisibleNodeAppearance(
            node,
            diagram
        );

    const fill =
        visibleAppearance.fill;

    const text =
        visibleAppearance.text;

    const background =
        fill?.enabled
            ? geneoCompositeRgb(
                geneoHexToRgb(
                    fill.color
                ),
                canvasRgb,
                fill.opacity / 100
            )
            : canvasRgb;

    const visibleText =
        geneoCompositeRgb(
            geneoHexToRgb(
                text.color
            ),
            background,
            text.opacity / 100
        );

    return geneoContrastRatio(
        visibleText,
        background
    );
}

function renderGeneoContrastWarning(node)
{
    const ratio = geneoTextContrastRatio(node);
    const warning = Number.isFinite(ratio) && ratio < 4.5;
    return `<p class="geneo-contrast-warning" data-geneo-contrast-warning ${warning ? '' : 'hidden'}>${icon.warning}<span><strong>${escapeHtml(t('Low text contrast'))}</strong> <span data-geneo-contrast-ratio>(${Number.isFinite(ratio) ? ratio.toFixed(1) : '0.0'}:1).</span> ${escapeHtml(t('Consider a clearer text or fill color.'))}</span></p>`;
}

function geneoPaintTargetMatches(element, target)
{
    const reference = geneoPaintReferenceFromElement(element);
    return geneoPaintTargetKey(reference) === geneoPaintTargetKey(target);
}

function applyGeneoPaintTargetToDom(reference)
{
    const target = resolveGeneoPaintTarget(reference);
    if (!target) return;
    if (target.scope === 'card-default')
    {
        selectedGeneographDiagram()?.nodes.filter(node => node.type === 'person').forEach(node =>
        {
            const element = main.querySelector(`[data-geneo-node="${CSS.escape(node.id)}"]`);
            if (!element) return;
            const visible = geneoResolveVisibleNodeAppearance(node);
            element.style.setProperty('--geneo-node-bg', geneoPaintCssColor(visible.fill));
            element.style.setProperty('--geneo-node-gap-bg', geneoPersonActionGapColor(visible.fill));
            element.style.setProperty('--geneo-node-stroke', geneoPaintCssColor(visible.stroke));
            element.style.setProperty('--geneo-node-text', geneoPaintCssColor(visible.text));
            element.style.setProperty('--geneo-node-stroke-style', visible.stroke?.enabled ? visible.strokePattern : 'none');
        });
    }
    else if (target.scope === 'node')
    {
        const node =
            target.entity;

        const element =
            main.querySelector(
                `[data-geneo-node="${
                    CSS.escape(node.id)
                }"]`
            );

        if (element)
        {
            const visibleAppearance =
                geneoResolveVisibleNodeAppearance(
                    node
                );

            const visibleFill =
                visibleAppearance.fill;

            const visibleStroke =
                visibleAppearance.stroke;

            const visibleText =
                visibleAppearance.text;

            element.style.setProperty(
                '--geneo-node-bg',
                geneoPaintCssColor(
                    visibleFill
                )
            );

            element.style.setProperty(
                '--geneo-node-gap-bg',
                geneoPersonActionGapColor(visibleFill)
            );

            element.style.setProperty(
                '--geneo-node-stroke',
                geneoPaintCssColor(
                    visibleStroke
                )
            );

            element.style.setProperty(
                '--geneo-node-stroke-style',
                visibleStroke?.enabled
                    ? node.appearance
                        .strokePattern
                    : 'none'
            );

            element.style.setProperty(
                '--geneo-node-text',
                geneoPaintCssColor(
                    visibleText
                )
            );

            if (node.type === 'sticky')
            {
                element.classList.toggle(
                    'has-paper-fill',
                    Boolean(
                        visibleFill?.enabled
                && geneoNumber(
                    visibleFill.opacity,
                    100,
                    0,
                    100
                ) > 0
                    )
                );
            }
        }
    }
    else if (target.scope === 'connection-default')
    {
        main.querySelectorAll('[data-geneo-connection-group]').forEach(group =>
        {
            const connection = getGeneographConnection(group.dataset.geneoConnectionGroup);
            if (!connection || connection.style?.line) return;
            const color = geneoPaintCssColor(target.paint);
            group.querySelector('.geneo-connection-line')?.setAttribute('stroke', color);
            group.querySelector('marker path')?.setAttribute('fill', color);
        });
        refreshGeneoConnectionToolUi();
    }
    else if (target.scope === 'connection')
    {
        const group = main.querySelector(`[data-geneo-connection-group="${CSS.escape(target.id)}"]`);
        group?.classList.toggle('no-stroke', !target.paint.enabled);
        group?.querySelector('.geneo-connection-line')?.setAttribute('stroke', geneoPaintCssColor(target.paint));
        group?.querySelector('marker path')?.setAttribute('fill', geneoPaintCssColor(target.paint));
        const status = sidebar.querySelector(`[data-geneo-layer-connection="${CSS.escape(target.id)}"] [data-geneo-connection-paint-status]`);
        if (status) status.hidden = target.paint.enabled;
    }
    else
    {
        main.querySelector('[data-geneo-canvas-viewport]')?.style.setProperty('--geneo-canvas-background', geneoPaintCssColor(target.paint));
    }
}

function updateGeneoContrastWarning()
{
    const node = selectedGeneographNode();
    const warning = main.querySelector('[data-geneo-contrast-warning]');
    if (!warning || !node) return;
    const ratio = geneoTextContrastRatio(node);
    const visible = Number.isFinite(ratio) && ratio < 4.5;
    warning.hidden = !visible;
    const ratioCopy = warning.querySelector('[data-geneo-contrast-ratio]');
    if (ratioCopy) ratioCopy.textContent = `(${Number.isFinite(ratio) ? ratio.toFixed(1) : '0.0'}:1).`;
}

function syncGeneoPaintUi(reference, sourceInput = null)
{
    const target = resolveGeneoPaintTarget(reference);
    if (!target) return;
    if (geneoBulkPaintScope(target.scope))
    {
        main.querySelectorAll('[data-geneo-paint-scope]').forEach(row =>
        {
            if (!geneoPaintTargetMatches(row, target)) return;
            row.classList.toggle('is-none', target.paint.enabled === false && !target.mixed.enabled);
            const swatch = row.querySelector('[data-geneo-paint-open]');
            if (swatch)
            {
                swatch.classList.toggle('is-mixed', target.mixed.color);
                swatch.style.cssText = geneoPaintSwatchStyle(target.paint);
                swatch.title = target.mixed.color ? t('Mixed') : target.paint.color;
                swatch.disabled = target.paint.enabled === false && !target.mixed.enabled;
            }
            const hex = row.querySelector('.geneo-paint-hex');
            if (hex)
            {
                if (hex !== sourceInput) hex.value = target.mixed.color ? '' : target.paint.color;
                hex.disabled = target.paint.enabled === false && !target.mixed.enabled;
            }
            const opacity = row.querySelector('.geneo-paint-opacity-number input');
            if (opacity)
            {
                if (opacity !== sourceInput) opacity.value = target.mixed.opacity ? '' : target.paint.opacity;
                opacity.disabled = target.paint.enabled === false && !target.mixed.enabled;
            }
            const state = row.querySelector('.geneo-paint-state');
            if (state) state.textContent = target.mixed.enabled ? t('Mixed')
                : target.paint.enabled ? '' : t('None');
            const action = row.querySelector('.geneo-paint-action');
            if (action) action.textContent = t(target.paint.enabled === false && !target.mixed.enabled ? 'Restore' : 'Remove');
        });
        target.items.forEach(item => applyGeneoPaintTargetToDom({
            scope: target.scope === 'connection-multi' ? 'connection' : 'node', id: item.id,
            property: target.property
        }));
        syncGeneoPaintPopover(target, sourceInput);
        return;
    }
    if (target.scope === 'creation-tool')
    {
        refreshGeneoCreationToolUi(target.id);
        syncGeneoPaintPopover(target, sourceInput);
        return;
    }
    if (target.scope === 'connection-tool')
    {
        refreshGeneoConnectionToolUi();
        syncGeneoPaintPopover(target, sourceInput);
        return;
    }
    document.querySelectorAll('[data-geneo-paint-scope]').forEach(row =>
    {
        if (!geneoPaintTargetMatches(row, target)) return;
        row.classList.toggle('is-none', !target.paint.enabled);
        const stateLabel = row.querySelector('[data-geneo-paint-state]');
        if (stateLabel) stateLabel.hidden = target.paint.enabled;
        const swatch = row.querySelector('[data-geneo-paint-open]');

        if (swatch)
        {
            swatch.setAttribute(
                'style',
                geneoPaintSwatchStyle(target.paint)
            );

            swatch.setAttribute(
                'aria-label',
                translateAttributeValue(
                    `Edit ${target.label} color, ${
                        target.paint.enabled
                            ? `${target.paint.color}, ${target.paint.opacity}% opacity`
                            : 'None'
                    }`
                )
            );

            swatch.disabled = !target.paint.enabled;

            if (!target.paint.enabled)
            {
                swatch.setAttribute('aria-expanded', 'false');
            }
        }

        const hex = row.querySelector('[data-geneo-paint-hex]');

        if (hex && hex !== sourceInput)
        {
            hex.value = target.paint.color;
        }

        if (hex)
        {
            hex.disabled = !target.paint.enabled;
        }

        const opacity = row.querySelector(
            '[data-geneo-paint-opacity-number]'
        );

        if (opacity && opacity !== sourceInput)
        {
            opacity.value = target.paint.opacity;
        }

        if (opacity)
        {
            opacity.disabled = !target.paint.enabled;
        }

        const toggle = row.querySelector('[data-geneo-paint-toggle]');

        if (toggle)
        {
            const isPopover = row.classList.contains(
                'geneo-paint-popover'
            );

            const visibleLabel = target.paint.enabled
                ? isPopover
                    ? `Remove ${target.label}`
                    : 'Remove'
                : isPopover
                    ? `Restore ${target.label}`
                    : 'Restore';

            toggle.textContent = t(visibleLabel);

            toggle.setAttribute(
                'aria-label',
                translateAttributeValue(
                    target.paint.enabled
                        ? `Remove ${target.label.toLowerCase()} color`
                        : `Restore ${target.label.toLowerCase()} color`
                )
            );
        }
    });
    if (target.scope === 'node' && target.property === 'stroke')
    {
        const pattern = main.querySelector('[data-geneo-stroke-pattern="node"]');
        if (pattern) pattern.disabled = !target.paint.enabled;
    }
    if (target.scope === 'connection')
    {
        const pattern = main.querySelector('[data-geneo-connection-inspector-pattern]');
        if (pattern) pattern.disabled = !target.paint.enabled;
    }
    applyGeneoPaintTargetToDom(target);
    updateGeneoContrastWarning();
    syncGeneoPaintPopover(target, sourceInput);
}

function geneoPaintOverrideState(
    target
)
{
    if (target?.scope === 'creation-tool') return false;
    if (target?.scope === 'connection-tool') return Boolean(geneoConnectionToolRuntime.overrides.line);
    if (target?.scope === 'connection') return Boolean(target.entity?.style?.line);
    if (
        target?.scope !== 'node'
        || target.entity?.type
          !== 'person'
        || ![
            'fill',
            'stroke',
            'text'
        ].includes(
            target.property
        )
    )
    {
        return false;
    }

    return target.entity
        .appearance
        ?.paintOverrides
        ?.[target.property]
        === true;
}

function setGeneoPaintOverrideState(
    target,
    overridden
)
{
    if (target?.scope === 'creation-tool') return false;
    if (target?.scope === 'connection-tool')
    {
        const defaults = selectedGeneographDiagram().connectionDefaults.line;
        if (overridden && JSON.stringify(target.paint) !== JSON.stringify(defaults))
            geneoConnectionToolRuntime.overrides.line = { ...target.paint };
        else delete geneoConnectionToolRuntime.overrides.line;
        return true;
    }
    if (target?.scope === 'connection')
    {
        target.entity.style ||= {};
        if (overridden) target.entity.style.line = { ...target.paint };
        else delete target.entity.style.line;
        return true;
    }
    if (
        target?.scope !== 'node'
        || target.entity?.type
          !== 'person'
        || ![
            'fill',
            'stroke',
            'text'
        ].includes(
            target.property
        )
    )
    {
        return false;
    }

    const appearance =
        target.entity.appearance;

    const previous =
        appearance.paintOverrides
            ?.[target.property]
        === true;

    const next =
        Boolean(overridden);

    appearance.paintOverrides = {
        fill:
          appearance.paintOverrides
              ?.fill === true,

        stroke:
          appearance.paintOverrides
              ?.stroke === true,

        text:
          appearance.paintOverrides
              ?.text === true,

        [target.property]:
          next
    };

    return previous !== next;
}

function beginGeneoPaintInteraction(
    reference
)
{
    const target =
        resolveGeneoPaintTarget(
            reference
        );

    if (!target)
    {
        return null;
    }

    if (
        geneoPaintRuntime.interaction
    )
    {
        commitGeneoPaintInteraction();
    }

    geneoPaintRuntime.interaction = {
        key:
          geneoPaintTargetKey(
              target
          ),

        reference: {
            scope: target.scope,
            id: target.id,
            property: target.property
        },

        beforeDiagram:
          geneoSnapshot(),

        beforePaint:
          structuredClone(
              target.paint
          ),

        beforeOverride:
          geneoPaintOverrideState(
              target
          ),

        lastValidPaint:
          structuredClone(
              target.paint
          )
    };

    if (geneoBulkPaintScope(target.scope))
    {
        geneoPaintRuntime.interaction.beforeItems = target.items.map(item => ({
            id: item.id,
            appearance: target.scope === 'connection-multi' ? null : structuredClone(item.appearance),
            style: target.scope === 'connection-multi' ? structuredClone(item.style) : null
        }));
    }

    return target;
}

function previewGeneoPaint(
    reference,
    changes,
    sourceInput = null
)
{
    const target =
        resolveGeneoPaintTarget(
            reference
        );

    if (
        !target
        || (
            !target.paint.enabled
          && !(
              'enabled' in changes
          )
        )
    )
    {
        return false;
    }

    if (geneoBulkPaintScope(target.scope))
    {
        const normalized = { ...changes };
        if ('color' in normalized) normalized.color = normalizeGeneoHexColor(normalized.color);
        if ('opacity' in normalized) normalized.opacity = Math.round(geneoNumber(normalized.opacity, 100, 0, 100));
        geneoApplyBulkPaintChanges(target, normalized);
        syncGeneoPaintUi(target, sourceInput);
        return true;
    }

    Object.assign(
        target.paint,
        changes
    );

    target.paint.color =
        normalizeGeneoHexColor(
            target.paint.color,
            target.defaultPaint.color
        );

    target.paint.opacity =
        Math.round(
            geneoNumber(
                target.paint.opacity,
                100,
                0,
                100
            )
        );

    if (!target.supportsNone)
    {
        target.paint.enabled = true;
    }

    /*
       * A direct paint edit is an explicit
       * object-level override.
       */
    setGeneoPaintOverrideState(
        target,
        true
    );

    const interaction =
        geneoPaintRuntime.interaction;

    if (
        interaction?.key
        === geneoPaintTargetKey(
            target
        )
    )
    {
        interaction.lastValidPaint =
            structuredClone(
                target.paint
            );
    }

    syncGeneoPaintUi(
        target,
        sourceInput
    );

    return true;
}

function commitGeneoPaintInteraction()
{
    const interaction =
        geneoPaintRuntime.interaction;

    if (!interaction)
    {
        return false;
    }

    geneoPaintRuntime.interaction =
        null;

    const target =
        resolveGeneoPaintTarget(
            interaction.reference
        );

    if (!target)
    {
        return false;
    }

    if (geneoBulkPaintScope(target.scope))
    {
        if (geneoSnapshot() === interaction.beforeDiagram) return false;
        geneoPushHistorySnapshot(interaction.beforeDiagram);
        touchGeneographBoard();
        return true;
    }

    const paintChanged =
        JSON.stringify(
            interaction.beforePaint
        )
        !== JSON.stringify(
            target.paint
        );

    const overrideChanged =
        interaction.beforeOverride
        !== geneoPaintOverrideState(
            target
        );

    if (
        !paintChanged
        && !overrideChanged
    )
    {
        return false;
    }

    if (!['connection-tool', 'creation-tool'].includes(target.scope))
    {
        geneoPushHistorySnapshot(interaction.beforeDiagram);
        touchGeneographBoard();
    }

    return true;
}

function cancelGeneoPaintInteraction()
{
    const interaction =
        geneoPaintRuntime.interaction;

    if (!interaction)
    {
        return false;
    }

    geneoPaintRuntime.interaction =
        null;

    const target =
        resolveGeneoPaintTarget(
            interaction.reference
        );

    if (!target)
    {
        return false;
    }

    if (geneoBulkPaintScope(target.scope))
    {
        geneoRestoreBulkPaintItems(interaction);
        syncGeneoPaintUi(target);
        return true;
    }

    Object.assign(
        target.paint,
        structuredClone(
            interaction.beforePaint
        )
    );

    setGeneoPaintOverrideState(
        target,
        interaction.beforeOverride
    );

    syncGeneoPaintUi(
        target
    );

    return true;
}

function restoreLastValidGeneoPaintInteraction(sourceInput = null)
{
    const interaction = geneoPaintRuntime.interaction;
    if (!interaction) return false;
    const target = resolveGeneoPaintTarget(interaction.reference);
    if (!target) return false;
    if (geneoBulkPaintScope(target.scope))
    {
        syncGeneoPaintUi(target, sourceInput);
        return true;
    }
    Object.assign(target.paint, structuredClone(interaction.lastValidPaint));
    if (target.scope === 'connection') setGeneoPaintOverrideState(target, interaction.beforeOverride);
    syncGeneoPaintUi(target, sourceInput);
    return true;
}

function commitGeneoPaintAction(
    reference,
    update,
    {
        resetOverride = false,
        field = null
    } = {}
)
{
    const target =
        resolveGeneoPaintTarget(
            reference
        );

    if (!target)
    {
        return false;
    }

    if (geneoBulkPaintScope(target.scope))
    {
        const beforeDiagram = geneoSnapshot();
        const beforePaint = { ...target.paint };
        update(target);
        const changes = {};
        for (const key of ['color', 'opacity', 'enabled'])
        {
            if (target.paint[key] !== beforePaint[key] || (key === field && target.mixed[key]))
                changes[key] = target.paint[key];
        }
        if (!Object.keys(changes).length) return false;
        geneoApplyBulkPaintChanges(target, changes);
        if (geneoSnapshot() === beforeDiagram) return false;
        geneoPushHistorySnapshot(beforeDiagram);
        touchGeneographBoard();
        syncGeneoPaintUi(target);
        return true;
    }

    const beforeDiagram =
        geneoSnapshot();

    const beforePaint =
        JSON.stringify(
            target.paint
        );

    const beforeOverride =
        geneoPaintOverrideState(
            target
        );

    update(target);

    target.paint.color =
        normalizeGeneoHexColor(
            target.paint.color,
            target.defaultPaint.color
        );

    target.paint.opacity =
        Math.round(
            geneoNumber(
                target.paint.opacity,
                100,
                0,
                100
            )
        );

    if (!target.supportsNone)
    {
        target.paint.enabled = true;
    }

    setGeneoPaintOverrideState(
        target,
        !resetOverride
    );

    const paintChanged =
        beforePaint
        !== JSON.stringify(
            target.paint
        );

    const overrideChanged =
        beforeOverride
        !== geneoPaintOverrideState(
            target
        );

    if (
        !paintChanged
        && !overrideChanged
    )
    {
        return false;
    }

    if (!['connection-tool', 'creation-tool'].includes(target.scope))
    {
        geneoPushHistorySnapshot(beforeDiagram);
        touchGeneographBoard();
    }

    syncGeneoPaintUi(
        target
    );

    return true;
}

function renderGeneoPaintPopover(reference)
{
    const target = resolveGeneoPaintTarget(reference);
    if (!target) return '';
    const paint = target.paint;
    const hsv = geneoRgbToHsv(geneoHexToRgb(paint.color));
    geneoPaintRuntime.hsv = hsv;
    const disabled = !paint.enabled;
    return `<div class="geneo-paint-popover" id="geneoPaintPopover" role="dialog" aria-modal="false" aria-labelledby="geneoPaintPopoverTitle" ${geneoPaintDataAttributes(target)}>
        <div class="geneo-paint-popover-header"><strong id="geneoPaintPopoverTitle">${escapeHtml(target.label)}</strong><button type="button" data-geneo-paint-close aria-label="Close ${escapeHtml(target.label)} color picker">${icon.close}</button></div>
        <div class="geneo-paint-popover-body">
          <div class="geneo-paint-sv" tabindex="0" role="slider" aria-label="${escapeHtml(target.label)} saturation and brightness" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(hsv.v)}" aria-valuetext="Saturation ${Math.round(hsv.s)}%, brightness ${Math.round(hsv.v)}%" data-geneo-paint-sv style="--geneo-hue:${Math.round(hsv.h)}"><span style="left:${hsv.s}%;top:${100 - hsv.v}%" ${target.mixed?.color ? 'hidden' : ''} aria-hidden="true"></span></div>
          <label class="geneo-paint-slider-row"><span>Hue</span><input type="range" min="0" max="359" step="1" value="${Math.round(hsv.h)}" data-geneo-paint-hue ${disabled ? 'disabled' : ''}></label>
          ${target.supportsOpacity ? `<label class="geneo-paint-slider-row"><span>Opacity</span><input class="geneo-paint-alpha" type="range" min="0" max="100" step="1" value="${paint.opacity}" data-geneo-paint-opacity style="--geneo-paint-color:${paint.color};--geneo-paint-opacity:${paint.opacity}%" ${disabled ? 'disabled' : ''}></label>` : ''}
          <div class="geneo-paint-popover-fields"><label><span>Hex</span><input type="text" maxlength="7" value="${target.mixed?.color ? '' : paint.color}" placeholder="${target.mixed?.color ? escapeHtml(t('Mixed')) : ''}" spellcheck="false" autocomplete="off" data-geneo-paint-hex ${disabled ? 'disabled' : ''}></label>${target.supportsOpacity ? `<label><span>Opacity</span><span class="geneo-paint-percent-input"><input type="number" min="0" max="100" step="1" value="${target.mixed?.opacity ? '' : paint.opacity}" placeholder="${target.mixed?.opacity ? escapeHtml(t('Mixed')) : ''}" data-geneo-paint-opacity-number ${disabled ? 'disabled' : ''}><span aria-hidden="true">%</span></span></label>` : ''}</div>
          <div
            class="geneo-paint-suggestions"
            role="group"
            aria-label="Suggested board colors">
            ${
                GENEO_BOARD_COLORS.map(item =>
                {
                    const selected = !target.mixed?.color &&
                        normalizeGeneoHexColor(item.color)
                  === normalizeGeneoHexColor(paint.color);

                    return `
                  <button
                    type="button"
                    data-geneo-paint-suggestion="${item.color}"
                    style="--geneo-suggestion:${item.color}"
                    aria-label="${escapeHtml(
                        `${item.name}, ${item.color}`
                    )}"
                    aria-pressed="${selected}"
                    title="${escapeHtml(
                        `${item.name} · ${item.color}`
                    )}"
                    ${disabled ? 'disabled' : ''}>
                  </button>
                `;
                }).join('')
            }
          </div>

          <div class="geneo-paint-popover-footer">
            ${
                target.supportsNone
                    ? `
                  <button
                    class="geneo-paint-none"
                    type="button"
                    data-geneo-paint-toggle>
                    ${escapeHtml(t(
                        `${disabled ? 'Restore' : 'Remove'} ${target.label}`
                    ))}
                  </button>
                `
                    : target.resettable
                        ? `
                    <button
                      class="geneo-paint-none"
                      type="button"
                      data-geneo-paint-reset>
                      Reset to default
                    </button>
                  `
                        : ''
            }
          </div>
      </div>`;
}

function positionGeneoPaintPopover()
{
    const { popover, opener } = geneoPaintRuntime;
    const inspector = main.querySelector('.geneo-inspector:not(.collapsed)');
    if (!popover || !opener?.isConnected) return;
    if (['connection-tool', 'creation-tool'].includes(geneoPaintRuntime.target?.scope))
    {
        const rect = opener.getBoundingClientRect();
        const width = Math.min(360, window.innerWidth - 24);
        const height = Math.min(popover.scrollHeight, window.innerHeight - 24);
        popover.style.width = `${width}px`;
        popover.style.maxHeight = `${window.innerHeight - 24}px`;
        popover.style.left = `${Math.max(12, Math.min(rect.left, window.innerWidth - width - 12))}px`;
        popover.style.top = `${rect.bottom + height + 6 <= window.innerHeight - 12 ? rect.bottom + 6 : Math.max(12, rect.top - height - 6)}px`;
        return;
    }
    if (!inspector) return;
    const inspectorRect = inspector.getBoundingClientRect();
    const openerRect = opener.getBoundingClientRect();
    const margin = 8;
    const width = Math.max(280, Math.min(360, inspectorRect.width - margin * 2));
    popover.style.width = `${width}px`;
    popover.style.maxHeight = `${Math.max(280, inspectorRect.height - margin * 2)}px`;
    const measuredHeight = Math.min(popover.scrollHeight, inspectorRect.height - margin * 2);
    const below = openerRect.bottom + 6;
    const above = openerRect.top - measuredHeight - 6;
    const top = below + measuredHeight <= inspectorRect.bottom - margin
        ? below
        : Math.max(inspectorRect.top + margin, above);
    popover.style.left = `${Math.max(inspectorRect.left + margin, Math.min(openerRect.right - width, inspectorRect.right - width - margin))}px`;
    popover.style.top = `${top}px`;
}

function syncGeneoPaintPopover(reference, sourceInput = null)
{
    const popover = geneoPaintRuntime.popover;
    const target = resolveGeneoPaintTarget(reference);
    if (!popover || !target || geneoPaintTargetKey(target) !== geneoPaintTargetKey(geneoPaintRuntime.target)) return;
    const hsv = geneoRgbToHsv(geneoHexToRgb(target.paint.color));
    geneoPaintRuntime.hsv = hsv;
    popover.classList.toggle('is-none', !target.paint.enabled);
    const sv = popover.querySelector('[data-geneo-paint-sv]');
    if (sv)
    {
        sv.style.setProperty('--geneo-hue', Math.round(hsv.h));
        sv.setAttribute('aria-valuenow', Math.round(hsv.v));
        sv.setAttribute('aria-valuetext', `Saturation ${Math.round(hsv.s)}%, brightness ${Math.round(hsv.v)}%`);
        const marker = sv.querySelector('span');
        if (marker)
        {
            marker.hidden = Boolean(target.mixed?.color);
            marker.style.left = `${hsv.s}%`; marker.style.top = `${100 - hsv.v}%`;
        }
    }
    const hue = popover.querySelector('[data-geneo-paint-hue]');
    if (hue && hue !== sourceInput) hue.value = Math.round(hsv.h);
    const alpha = popover.querySelector('[data-geneo-paint-opacity]');
    if (alpha && alpha !== sourceInput) alpha.value = target.paint.opacity;
    if (alpha)
    {
        alpha.style.setProperty(
            '--geneo-paint-color',
            target.paint.color
        );

        alpha.style.setProperty(
            '--geneo-paint-opacity',
            `${target.paint.opacity}%`
        );
    }
    const hex = popover.querySelector('[data-geneo-paint-hex]');
    if (hex && hex !== sourceInput) hex.value = target.mixed?.color ? '' : target.paint.color;
    const number = popover.querySelector('[data-geneo-paint-opacity-number]');
    if (number && number !== sourceInput) number.value = target.mixed?.opacity ? '' : target.paint.opacity;
    popover.querySelectorAll('input, [data-geneo-paint-suggestion]').forEach(control =>
    {
        if (!control.matches('[data-geneo-paint-close]')) control.disabled = !target.paint.enabled;
    });
    const selectedColor = normalizeGeneoHexColor(
        target.paint.color
    );

    popover
        .querySelectorAll('[data-geneo-paint-suggestion]')
        .forEach(button =>
        {
            const selected = !target.mixed?.color &&
                normalizeGeneoHexColor(
                    button.dataset.geneoPaintSuggestion
                ) === selectedColor;

            button.setAttribute(
                'aria-pressed',
                String(selected)
            );
        });

    const toggle = popover.querySelector(
        '[data-geneo-paint-toggle]'
    );

    if (toggle)
    {
        toggle.textContent = t(
            `${target.paint.enabled ? 'Remove' : 'Restore'} ${
                target.label
            }`
        );

        toggle.setAttribute(
            'aria-label',
            translateAttributeValue(
                target.paint.enabled
                    ? `Remove ${target.label.toLowerCase()} color`
                    : `Restore ${target.label.toLowerCase()} color`
            )
        );
    }
}

function closeGeneoPaintPopover({ commit = true, restoreFocus = true } = {})
{
    const opener = geneoPaintRuntime.opener;
    const inspector = main.querySelector('.geneo-inspector:not(.collapsed)');
    const scrollTop = inspector?.scrollTop ?? null;
    if (commit) commitGeneoPaintInteraction();
    else cancelGeneoPaintInteraction();
    geneoPaintRuntime.controller?.abort();
    geneoPaintRuntime.popover?.remove();
    opener?.setAttribute('aria-expanded', 'false');
    geneoPaintRuntime = createGeneoPaintRuntime();
    if (scrollTop !== null && inspector) inspector.scrollTop = scrollTop;
    if (restoreFocus && opener?.isConnected) opener.focus({ preventScroll: true });
}

function updateGeneoPaintFromSv(event, reference, element)
{
    const rect = element.getBoundingClientRect();
    const saturation = geneoNumber((event.clientX - rect.left) / rect.width * 100, 0, 0, 100);
    const value = geneoNumber((rect.bottom - event.clientY) / rect.height * 100, 0, 0, 100);
    const hsv = { ...(geneoPaintRuntime.hsv || { h: 0 }), s: saturation, v: value };
    geneoPaintRuntime.hsv = hsv;
    previewGeneoPaint(reference, { color: geneoHsvToHex(hsv) });
}

function bindGeneoPaintPopover(reference)
{
    const popover = geneoPaintRuntime.popover;
    if (!popover) return;
    const sv = popover.querySelector('[data-geneo-paint-sv]');
    sv?.addEventListener('pointerdown', event =>
    {
        if (!resolveGeneoPaintTarget(reference)?.paint.enabled) return;
        event.preventDefault();
        beginGeneoPaintInteraction(reference);
        sv.setPointerCapture(event.pointerId);
        updateGeneoPaintFromSv(event, reference, sv);
    });
    sv?.addEventListener('pointermove', event =>
    {
        if (!sv.hasPointerCapture(event.pointerId)) return;
        updateGeneoPaintFromSv(event, reference, sv);
    });
    sv?.addEventListener('pointerup', event =>
    {
        if (sv.hasPointerCapture(event.pointerId)) sv.releasePointerCapture(event.pointerId);
        commitGeneoPaintInteraction();
    });
    sv?.addEventListener('keydown', event =>
    {
        if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
        if (!resolveGeneoPaintTarget(reference)?.paint.enabled) return;
        event.preventDefault();
        if (!geneoPaintRuntime.interaction) beginGeneoPaintInteraction(reference);
        const amount = event.shiftKey ? 10 : 1;
        const hsv = { ...geneoPaintRuntime.hsv };
        if (event.key === 'ArrowLeft') hsv.s = Math.max(0, hsv.s - amount);
        if (event.key === 'ArrowRight') hsv.s = Math.min(100, hsv.s + amount);
        if (event.key === 'ArrowDown') hsv.v = Math.max(0, hsv.v - amount);
        if (event.key === 'ArrowUp') hsv.v = Math.min(100, hsv.v + amount);
        geneoPaintRuntime.hsv = hsv;
        previewGeneoPaint(reference, { color: geneoHsvToHex(hsv) });
    });
    sv?.addEventListener('keyup', event =>
    {
        if (event.key.startsWith('Arrow')) commitGeneoPaintInteraction();
    });
    bindGeneoPaintRange(popover.querySelector('[data-geneo-paint-hue]'), reference, input =>
    {
        const hsv = { ...geneoPaintRuntime.hsv, h: Number(input.value) };
        geneoPaintRuntime.hsv = hsv;
        previewGeneoPaint(reference, { color: geneoHsvToHex(hsv) }, input);
    });
    bindGeneoPaintRange(popover.querySelector('[data-geneo-paint-opacity]'), reference, input =>
    {
        previewGeneoPaint(reference, { opacity: Number(input.value) }, input);
    });
    bindGeneoPaintTextInput(popover.querySelector('[data-geneo-paint-hex]'), reference, 'hex');
    bindGeneoPaintTextInput(popover.querySelector('[data-geneo-paint-opacity-number]'), reference, 'opacity');
    popover.querySelectorAll('[data-geneo-paint-suggestion]').forEach(button => button.addEventListener('click', () =>
    {
        commitGeneoPaintAction(reference, target =>
        {
            target.paint.color = button.dataset.geneoPaintSuggestion;
        }, { field: 'color' });
    }));
    popover
        .querySelector('[data-geneo-paint-toggle]')
        ?.addEventListener('click', () =>
        {
            const currentTarget = resolveGeneoPaintTarget(reference);
            if (!currentTarget) return;

            const removingPaint = currentTarget.paint.enabled;

            const changed = commitGeneoPaintAction(
                reference,
                target =>
                {
                    target.paint.enabled = !target.paint.enabled;
                }
            );

            if (!changed || !removingPaint) return;

            closeGeneoPaintPopover({
                restoreFocus: false
            });

            requestAnimationFrame(() =>
            {
                const inspectorRow = [
                    ...main.querySelectorAll('.geneo-paint-row')
                ].find(row =>
                    geneoPaintTargetMatches(row, reference)
                );

                inspectorRow
                    ?.querySelector('[data-geneo-paint-toggle], [data-geneo-person-multi-paint-toggle], [data-geneo-bulk-paint-toggle], [data-geneo-connection-multi-paint-toggle]')
                    ?.focus({ preventScroll: true });
            });
        });
    popover
        .querySelector(
            '[data-geneo-paint-reset]'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                commitGeneoPaintAction(
                    reference,

                    target =>
                    {
                        Object.assign(
                            target.paint,
                            structuredClone(
                                target.defaultPaint
                            ),
                            {
                                enabled: true
                            }
                        );
                    },

                    {
                        resetOverride: true
                    }
                );
            }
        );
    popover.querySelector('[data-geneo-paint-close]')?.addEventListener('click', () => closeGeneoPaintPopover());
}

function bindGeneoPaintRange(input, reference, update)
{
    if (!input) return;
    input.addEventListener('input', () =>
    {
        if (!geneoPaintRuntime.interaction) beginGeneoPaintInteraction(reference);
        update(input);
    });
    input.addEventListener('change', commitGeneoPaintInteraction);
    input.addEventListener('pointerup', commitGeneoPaintInteraction);
    input.addEventListener('blur', commitGeneoPaintInteraction);
}

function bindGeneoPaintTextInput(input, reference, type)
{
    if (!input) return;
    input.addEventListener('focus', () => beginGeneoPaintInteraction(reference));
    input.addEventListener('input', () =>
    {
        if (!geneoPaintRuntime.interaction) beginGeneoPaintInteraction(reference);
        if (type === 'hex')
        {
            const valid = /^#?[0-9a-f]{3}$/i.test(input.value.trim()) || /^#?[0-9a-f]{6}$/i.test(input.value.trim());
            input.classList.toggle('invalid', !valid);
            input.setAttribute('aria-invalid', String(!valid));
            if (valid) previewGeneoPaint(reference, { color: normalizeGeneoHexColor(input.value) }, input);
        }
        else if (input.value.trim() !== '' && Number.isFinite(Number(input.value)))
        {
            previewGeneoPaint(reference, { opacity: Math.round(geneoNumber(input.value, 100, 0, 100)) }, input);
        }
    });
    input.addEventListener('keydown', event =>
    {
        if (event.key === 'Escape')
        {
            event.preventDefault();
            cancelGeneoPaintInteraction();
            input.classList.remove('invalid');
            input.setAttribute('aria-invalid', 'false');
            const target = resolveGeneoPaintTarget(reference);
            if (target) input.value = target.mixed?.[type === 'hex' ? 'color' : 'opacity'] ? ''
                : type === 'hex' ? target.paint.color : target.paint.opacity;
            input.select();
        }
        else if (event.key === 'Enter')
        {
            event.preventDefault();
            input.blur();
        }
    });
    input.addEventListener('blur', () =>
    {
        if (type === 'hex' && input.classList.contains('invalid')) restoreLastValidGeneoPaintInteraction(input);
        if (type === 'opacity' && input.value.trim() === '') restoreLastValidGeneoPaintInteraction(input);
        const target = resolveGeneoPaintTarget(reference);
        if (target) input.value = target.mixed?.[type === 'hex' ? 'color' : 'opacity'] ? ''
            : type === 'hex' ? target.paint.color : target.paint.opacity;
        input.classList.remove('invalid');
        input.setAttribute('aria-invalid', 'false');
        commitGeneoPaintInteraction();
    });
}

function openGeneoPaintPopover(reference, opener)
{
    if (geneoPaintRuntime.popover) closeGeneoPaintPopover({ restoreFocus: false });
    const target = resolveGeneoPaintTarget(reference);
    const inspector = main.querySelector('.geneo-inspector:not(.collapsed)');
    if (!target || (!['connection-tool', 'creation-tool'].includes(target.scope) && !inspector) || !opener) return;
    const scrollTop = inspector?.scrollTop;
    const wrapper = document.createElement('div');
    wrapper.innerHTML = renderGeneoPaintPopover(target).trim();
    const popover = wrapper.firstElementChild;
    document.body.appendChild(popover);
    localizeUI(
        popover,
        {
            suppressObserverReplay: true
        }
    );
    const controller = new AbortController();
    geneoPaintRuntime.target = { scope: target.scope, id: target.id, property: target.property };
    geneoPaintRuntime.opener = opener;
    geneoPaintRuntime.popover = popover;
    geneoPaintRuntime.controller = controller;
    opener.setAttribute('aria-expanded', 'true');
    bindGeneoPaintPopover(geneoPaintRuntime.target);
    positionGeneoPaintPopover();
    if (inspector && scrollTop !== undefined) inspector.scrollTop = scrollTop;
    popover.querySelector('[data-geneo-paint-sv]')?.focus({ preventScroll: true });
    document.addEventListener('pointerdown', event =>
    {
        if (popover.contains(event.target) || opener.contains(event.target)) return;
        closeGeneoPaintPopover();
    }, { capture: true, signal: controller.signal });
    document.addEventListener('keydown', event =>
    {
        if (event.key !== 'Escape') return;
        event.preventDefault();
        closeGeneoPaintPopover({ commit: false });
    }, { signal: controller.signal });
    inspector?.addEventListener('scroll', positionGeneoPaintPopover, { passive: true, signal: controller.signal });
    window.addEventListener('resize', positionGeneoPaintPopover, { passive: true, signal: controller.signal });
}

function bindGeneoPaintControls()
{
    main.querySelectorAll('[data-geneo-paint-scope]').forEach(row =>
    {
        const reference = geneoPaintReferenceFromElement(row);
        row.querySelector('[data-geneo-paint-open]')?.addEventListener('click', event => openGeneoPaintPopover(reference, event.currentTarget));
        bindGeneoPaintTextInput(row.querySelector('[data-geneo-paint-hex]'), reference, 'hex');
        bindGeneoPaintTextInput(row.querySelector('[data-geneo-paint-opacity-number]'), reference, 'opacity');
        row.querySelector('[data-geneo-paint-toggle]')?.addEventListener('click', () =>
        {
            commitGeneoPaintAction(reference, target =>
            {
                target.paint.enabled = !target.paint.enabled;
            });
        });
        row
            .querySelector(
                '[data-geneo-paint-reset]'
            )
            ?.addEventListener(
                'click',
                () =>
                {
                    commitGeneoPaintAction(
                        reference,

                        target =>
                        {
                            Object.assign(
                                target.paint,
                                structuredClone(
                                    target.defaultPaint
                                ),
                                {
                                    enabled: true
                                }
                            );
                        },

                        {
                            resetOverride: true
                        }
                    );
                }
            );
    });
}

function renderGeneographInspectorHeader(
    title,
    subtitle,
    iconHtml = '',
    node = null,
    entityType = 'node',
    extraActions = ''
)
{
    const hasIcon =
        Boolean(iconHtml);

    return `
        <div class="geneo-inspector-header">
          <button
            class="
              people-collapse-button
              people-sidebar-toggle-icon
            "
            type="button"
            data-geneo-inspector-toggle
            aria-label="Collapse inspector"
            aria-expanded="true">
            ${icon.doublechevronSidebar}
          </button>

          <div
            class="
              geneo-inspector-identity
              ${hasIcon ? 'has-icon' : ''}
            ">

            ${
                hasIcon
                    ? `
                  <span
                    class="geneo-layer-icon"
                    aria-hidden="true">
                    ${iconHtml}
                  </span>
                `
                    : ''
            }

            <div class="geneo-inspector-title">
              <h2 title="${escapeHtml(title)}" ${node ? 'data-geneo-header-name' : ''}>
                ${escapeHtml(title)}
              </h2>

              ${node ? `<input class="geneo-input geneo-inspector-name-input" type="text"
                maxlength="${GENEO_LAYER_NAME_LIMIT}"
                value="${escapeHtml(localizedDataFieldValue(normalizeGeneographLayerName(node.name) || title))}"
                data-geneo-header-name-input data-user-content aria-label="${escapeHtml(t('Layer name'))}"
                hidden>` : ''}

              <span title="${escapeHtml(subtitle)}">
                ${escapeHtml(subtitle)}
              </span>
            </div>
          </div>
          ${node ? `<div class="geneo-inspector-header-actions">
            <button type="button" data-geneo-header-rename aria-label="${escapeHtml(`${t('Rename layer')}: ${title}`)}" title="${escapeHtml(t('Rename layer'))}">${icon.edit}</button>
            ${entityType === 'node' ? `<button type="button" data-geneo-header-lock aria-label="${escapeHtml(`${t(node.locked ? 'Unlock layer' : 'Lock layer')}: ${title}`)}" title="${escapeHtml(t(node.locked ? 'Unlock layer' : 'Lock layer'))}" aria-pressed="${node.locked ? 'true' : 'false'}">${node.locked ? icon.lock : icon.unlock}</button>` : ''}
            <button type="button" data-geneo-header-visible aria-label="${escapeHtml(`${t(node.visible ? 'Hide layer' : 'Show layer')}: ${title}`)}" title="${escapeHtml(t(node.visible ? 'Hide layer' : 'Show layer'))}" aria-pressed="${node.visible ? 'true' : 'false'}">${node.visible ? icon.eye : icon.eyeOff}</button>
          </div>` : entityType === 'board' ? `<div class="geneo-inspector-header-actions">
            <button type="button" data-geneo-settings aria-label="${escapeHtml(t('Edit board'))}" title="${escapeHtml(t('Edit board'))}">${icon.edit}</button>
          </div>` : extraActions}
        </div>
      `;
}
function geneoPersonCardFieldLabels()
{
    return {
        photo:
          'Photo',

        dates:
          'Life dates',

        livingStatus:
          'Status',

        birthPlace:
          'Birth place',

        deathPlace:
          'Death place',

        maidenName:
          'Maiden surname',

        linkIndicator:
          'Family Tree link indicator'
    };
}

function geneoPersonCardControlOptions()
{
    return {
        style: [
            ['standard', 'Standard'],
            ['compact', 'Compact'],
            ['chart', 'Chart'],
            ['portrait', 'Portrait']
        ],

        nameFormat: [
            ['full', 'Full name'],
            [
                'first-last',
                'First + surname'
            ],
            [
                'surname-first',
                'Surname first'
            ]
        ],

        dateFormat: [
            ['full', 'Full dates'],
            ['years', 'Years only']
        ],

        photoSize: [
            ['small', 'Small'],
            ['medium', 'Medium'],
            ['large', 'Large']
        ],

        photoAlignment: [
            ['left', 'Left'],
            ['right', 'Right']
        ],

        alignment: [
            ['left', 'Left'],
            ['center', 'Center'],
            ['right', 'Right']
        ],

        nameAlignment: [
            ['left', 'Left'],
            ['center', 'Center'],
            ['right', 'Right']
        ]
    };
}

function renderGeneographPersonCardSelect({
    key,
    label,
    value,
    scope,
    node = null,
    disabled = false,
    help = ''
})
{
    const options =
        geneoPersonCardControlOptions()[
            key
        ] || [];

    const id =
        `geneo-person-card-${
            scope
        }-${
            node?.id || 'board'
        }-${key}`;

    return `
        <div class="geneo-field">
          <label
            for="${escapeHtml(id)}">
            ${escapeHtml(label)}
          </label>

          <select
            class="geneo-select"
            id="${escapeHtml(id)}"
            data-geneo-person-card-setting="${escapeHtml(
                key
            )}"
            data-geneo-person-card-scope="${escapeHtml(
                scope
            )}"
            ${
                node
                    ? `
                  data-geneo-person-card-node="${escapeHtml(
                        node.id
                    )}"
                `
                    : ''
            }
            ${
                disabled
                    ? `
                  disabled
                  aria-disabled="true"
                `
                    : ''
            }>
            ${options
                .map(
                    ([
                        optionValue,
                        optionLabel
                    ]) => `
                  <option
                    value="${escapeHtml(
                        optionValue
                    )}"
                    ${
                        optionValue === value
                            ? 'selected'
                            : ''
                    }>
                    ${escapeHtml(
                        optionLabel
                    )}
                  </option>
                `
                )
                .join('')}
          </select>

          ${
                help
                    ? `
                <span
                  class="geneo-selection-help">
                  ${escapeHtml(help)}
                </span>
              `
                    : ''
            }
        </div>
      `;
}

function renderGeneographPersonCardStylePicker({
    scope,
    node = null,
    settings,
    disabled = false
})
{
    const styles = [
        {
            id: 'standard',
            label: 'Standard',
            subtitle: 'Detailed facts'
        },
        {
            id: 'compact',
            label: 'Compact',
            subtitle: 'Compact text card'
        },
        {
            id: 'chart',
            label: 'Chart',
            subtitle: 'Photo-first timeline'
        },
        {
            id: 'portrait',
            label: 'Portrait',
            subtitle: 'Photo-first'
        }
    ];

    return `
        <div
          class="geneo-person-style-picker"
          role="group"
          aria-label="Person card style">
          ${styles
                .map(style => `
              <button
                class="
                  geneo-person-style-option
                  ${
                        settings.style
                    === style.id
                            ? 'active'
                            : ''
                    }
                "
                type="button"
                data-geneo-person-card-style="${escapeHtml(
                    style.id
                )}"
                data-geneo-person-card-scope="${escapeHtml(
                    scope
                )}"
                ${
                    node
                        ? `
                      data-geneo-person-card-node="${escapeHtml(
                            node.id
                        )}"
                    `
                        : ''
                }
                aria-pressed="${
                    settings.style
                  === style.id
                        ? 'true'
                        : 'false'
                }"
                ${
                    disabled
                        ? `
                      disabled
                      aria-disabled="true"
                    `
                        : ''
                }>
                <span
                  class="geneo-person-style-preview-stage"
                  aria-hidden="true">
                  <span
                    class="
                      geneo-person-style-preview
                      preview-${escapeHtml(
                            style.id
                        )}
                    ">
                    ${style.id === 'compact' ? '' : '<span class="preview-photo"></span>'}
                    <span class="preview-name"></span>
                    <span class="preview-maiden"></span>
                    <span class="preview-birth"></span>
                    <span class="preview-death"></span>
                  </span>
                </span>

                <span class="geneo-person-style-copy">
                  <strong>${escapeHtml(
                        style.label
                    )}</strong>
                  <span>${escapeHtml(
                        style.subtitle
                    )}</span>
                </span>
              </button>
            `)
                .join('')}
        </div>
      `;
}

function renderGeneographPersonCardControls({
    scope,
    node = null
})
{
    const boardSettings =
        normalizeGeneographPersonCardSettings(
            selectedGeneographDiagram()
                ?.personCardDefaults
        );

    const settings =
        node
            ? geneoPersonCardEffectiveSettings(
                node
            )
            : boardSettings;

    const labels =
        geneoPersonCardFieldLabels();

    const select =
        (
            key,
            label,
            help = '',
            dependentDisabled = false
        ) =>
            renderGeneographPersonCardSelect({
                key,
                label,
                help,
                value:
              settings[key],
                scope,
                node,
                disabled: dependentDisabled
            });

    return `
        <div
          class="geneo-person-card-controls"
          data-geneo-person-card-controls
          >

          <div
            class="geneo-person-card-control-group">
            <strong
              class="geneo-person-card-group-title">
              Card style
            </strong>

            ${renderGeneographPersonCardStylePicker({
                scope,
                node,
                settings,
                disabled: false
            })}
          </div>

          <div
            class="geneo-person-card-control-group">
            <strong
              class="geneo-person-card-group-title">
              Formatting
            </strong>

            <div
              class="geneo-person-card-setting-grid">
              ${select(
                    'nameFormat',
                    'Name format'
                )}

              ${select(
                    'dateFormat',
                    'Date format',
                    '',
                    !settings.fields.dates
                )}

              ${scope === 'node' && settings.style !== 'compact' ? select(
                    'photoSize',
                    'Photo size',
                    '',
                    !settings.fields.photo
                ) : ''}

              ${['standard', 'chart'].includes(settings.style)
                    ? select('photoAlignment', 'Photo alignment', '', !settings.fields.photo)
                    : ''}

              ${
                    settings.style === 'standard'
                        ? `${select('nameAlignment', 'Name alignment')}
                           ${select('alignment', 'Dates alignment')}`
                        : settings.style === 'chart'
                        ? select('alignment', 'Text alignment')
                        : `
                    <div class="geneo-field">
                      <span
                        class="geneo-field-label">
                        Text alignment
                      </span>

                      <span
                        class="geneo-selection-help">
                        Centered by this style
                      </span>
                    </div>
                  `
                }
            </div>

          </div>

          <div
            class="geneo-person-card-control-group">
            <strong
              class="geneo-person-card-group-title">
              Displayed information
            </strong>

            <div
              class="geneo-person-card-options">
              ${Object.entries(labels)
                    .filter(([field]) =>
                        (scope !== 'board' || field !== 'livingStatus')
                        && geneoPersonCardFieldSupported(settings.style, field))
                    .map(
                        ([
                            field,
                            label
                        ]) =>
                        {
                            return `
                    <label
                      class="geneo-check">
                      <input
                        type="checkbox"
                        data-geneo-person-card-field="${escapeHtml(
                            field
                        )}"
                        data-geneo-person-card-scope="${escapeHtml(
                            scope
                        )}"
                        ${
                            node
                                ? `
                              data-geneo-person-card-node="${escapeHtml(
                                    node.id
                                )}"
                            `
                                : ''
                        }
                        ${
                            settings.fields[
                                field
                            ]
                                ? 'checked'
                                : ''
                        }
                        >
                      ${escapeHtml(label)}
                    </label>
                  `;
                        }
                    )
                    .join('')}
            </div>
          </div>
        </div>
      `;
}

function geneoInspectorContextForNode(
    node
)
{
    const supportedContexts = new Set([
        'person',
        'text',
        'sticky',
        'image',
        'panel',
        'place',
        'shape',
        'drawing'
    ]);

    return supportedContexts.has(
        node?.type
    )
        ? node.type
        : 'node';
}

function geneoInspectorSectionIsOpen(
    context,
    id
)
{
    return state
        .geneoInspectorSections
        ?.[context]
        ?.[id] !== false;
}

function renderGeneographInspectorSection({
    context,
    id,
    title,
    content,
    meta = '',
    actionHtml = '',
    inlineAction = false
})
{
    const sectionKey =
        `${context}:${id}`;

    return renderInspectorSection(
        sectionKey,
        title,
        meta,
        content,
        actionHtml,
        {
            open:
            geneoInspectorSectionIsOpen(
                context,
                id
            ),

            toggleAttribute:
            'data-geneo-inspector-section',

            sectionId:
            `geneo-inspector-${context}-${id}`,
            inlineAction
        }
    );
}

function renderGeneographInspectorDangerAction(
    label
)
{
    return `
        <div class="geneo-inspector-danger">
          <button
            class="button danger"
            type="button"
            data-geneo-delete-selection>
            ${icon.trash}
            ${escapeHtml(label)}
          </button>
        </div>
      `;
}

function bindGeneographInspectorSectionToggles()
{
    if (
        main.dataset
            .geneoInspectorSectionToggleBound
        === 'true'
    )
    {
        return;
    }

    main.dataset
        .geneoInspectorSectionToggleBound =
            'true';

    main.addEventListener(
        'click',
        event =>
        {
            const button =
                event.target.closest?.(
                    '[data-geneo-inspector-section]'
                );

            if (
                !button
            || !main.contains(button)
            )
            {
                return;
            }

            const sectionKey =
                button.dataset
                    .geneoInspectorSection
            || '';

            const separatorIndex =
                sectionKey.indexOf(':');

            if (separatorIndex < 1)
            {
                return;
            }

            const context =
                sectionKey.slice(
                    0,
                    separatorIndex
                );

            const id =
                sectionKey.slice(
                    separatorIndex + 1
                );

            if (!context || !id)
            {
                return;
            }

            const section =
                button.closest(
                    '.panel-section'
                );

            const bodyId =
                button.getAttribute(
                    'aria-controls'
                );

            const body =
                bodyId && section
                    ? section.querySelector(
                        `#${CSS.escape(bodyId)}`
                    )
                    : null;

            if (!section || !body)
            {
                return;
            }

            const open =
                !geneoInspectorSectionIsOpen(
                    context,
                    id
                );

            if (
                !state.geneoInspectorSections[
                    context
                ]
            )
            {
                state.geneoInspectorSections[
                    context
                ] = {};
            }

            state.geneoInspectorSections[
                context
            ][id] = open;

            button.setAttribute(
                'aria-expanded',
                String(open)
            );

            section.classList.toggle(
                'is-open',
                open
            );

            body.hidden = !open;
        }
    );
}

function renderGeneographPersonCardSection(
    node
)
{
    return renderGeneographInspectorSection({
        context: 'person',
        id: 'card',
        title: 'Card layout',
        content:
          renderGeneographPersonCardControls({
              scope: 'node',
              node
          })
    });
}

function renderGeneoPersonAppearanceControls({ scope, id, appearance, radius })
{
    const boardDefault = scope === 'card-default';

    return `
      <div class="geneo-person-appearance-controls">
        ${['fill', 'stroke', 'text'].map(property => renderGeneoPaintControl({
            scope, id, property
        })).join('')}
        ${boardDefault ? '' : renderGeneoContrastWarning(getGeneographNode(id))}
        <div class="geneo-card-default-dimensions">
          <label class="geneo-field"><span class="geneo-setting-label">Stroke width</span>
            <input class="geneo-input" type="number" min="1" max="12" step="1"
              value="${appearance.strokeWidth}" ${boardDefault
                ? `data-geneo-card-default-stroke-width="${id}"`
                : 'data-geneo-stroke-width="node"'}>
          </label>
          <label class="geneo-field"><span class="geneo-setting-label">Stroke pattern</span>
            <span class="common-select-shell">
              <select class="common-select" ${boardDefault
                ? `data-geneo-card-default-stroke-pattern="${id}"`
                : 'data-geneo-stroke-pattern="node"'} ${appearance.stroke.enabled ? '' : 'disabled'}>
                <option value="solid" ${appearance.strokePattern === 'solid' ? 'selected' : ''}>Solid</option>
                <option value="dashed" ${appearance.strokePattern === 'dashed' ? 'selected' : ''}>Dashed</option>
              </select>
              <span class="common-select-chevron" aria-hidden="true">${icon.chevron}</span>
            </span>
          </label>
        </div>
        <div class="geneo-person-card-radius-row">
          <label class="geneo-field" for="geneoPersonCardRadius-${id}"><span class="geneo-setting-label">Corner radius</span>
            <span class="geneo-selection-help">0–32 px</span>
          </label>
          <input class="geneo-input" id="geneoPersonCardRadius-${id}"
            type="number" min="0" max="32" step="1" value="${radius}"
            ${boardDefault
                ? `data-geneo-card-default-radius="${id}"`
                : `data-geneo-person-card-radius="node" data-geneo-person-card-node="${escapeHtml(id)}"`}>
        </div>
      </div>`;
}

function renderGeneoCardDefaultAppearance()
{
    const diagram = selectedGeneographDiagram();
    const colored = diagram.canvas.colorPersonCardsByGender;
    const genders = colored ? ['male', 'female', 'unknown'] : ['neutral'];
    return `
      <label class="geneo-check geneo-gender-color-toggle">
        <input type="checkbox" data-geneo-person-gender-colors ${colored ? 'checked' : ''}>
        <span>Color person cards by gender</span>
      </label>
      ${genders.map(gender => {
        const appearance = diagram.cardAppearanceDefaults[gender];
        return `<div class="geneo-card-default-group" role="group" aria-label="${escapeHtml(t(capitalize(gender)))}">
          ${colored ? `<h3>${escapeHtml(capitalize(gender))}</h3>` : ''}
          ${renderGeneoPersonAppearanceControls({
              scope: 'card-default', id: gender, appearance,
              radius: appearance.cornerRadius
          })}
        </div>`;
      }).join('')}`;
}

function renderGeneographInspector()
{
    if (state.geneoInspectorCollapsed)
    {
        return `
          <aside class="geneo-inspector collapsed">
            <button
              class="
                people-collapse-button
                person-sidebar-restore-button
                sidebar-toggle-icon
                sidebar-toggle-icon-restore
              "
              type="button"
              data-geneo-inspector-toggle
              aria-label="Open inspector"
              aria-expanded="false">
              ${icon.doublechevronSidebar}
            </button>
          </aside>
        `;
    }

    const selectedNodes =
        selectedGeneographNodes();

    const selectedConnections =
        selectedGeneographConnections();

    if (
        selectedNodes.length
        + selectedConnections.length
        > 1
    )
    {
        return renderGeneographMultiSelectionInspector(
            selectedNodes,
            selectedConnections
        );
    }

    const node =
        selectedGeneographNode();

    const connection =
        selectedGeneographConnection();

    if (connection)
    {
        return renderGeneographConnectionInspector(
            connection
        );
    }

    if (node)
    {
        return renderGeneographNodeInspector(
            node
        );
    }

    const board = selectedGeneographBoard();
    const canvas =
        selectedGeneographDiagram().canvas;
    const highlight = geneoCanvasRuntime.objectHighlight || 'none';
    const appearanceContent = `
        ${renderGeneoPaintControl({
            scope: 'canvas',
            property: 'background'
        })}

        <div class="geneo-field">
          <span class="geneo-field-label">
            Background pattern
          </span>

          <div
            class="geneo-background-pattern"
            role="group"
            aria-label="Background pattern">
            ${['dots', 'grid', 'clear']
                .map(pattern =>
                {
                    const label =
                        pattern === 'clear'
                            ? 'No pattern'
                            : capitalize(pattern);

                    return `
                  <button
                    type="button"
                    data-geneo-background-pattern="${pattern}"
                    aria-pressed="${
                        canvas.backgroundPattern
                      === pattern
                    }">
                    <span class="geneo-pattern-preview pattern-${pattern}" style="background-color:${geneoPaintCssColor(canvas.backgroundPaint)}" aria-hidden="true"></span>
                    ${escapeHtml(
                        t(label)
                    )}
                  </button>
                `;
                })
                .join('')}
          </div>
        </div>

        <label class="geneo-check">
          <input
            type="checkbox"
            data-geneo-snap
            ${
                canvas.snapToGrid
                    ? 'checked'
                    : ''
            }>
          <span>Snap to grid
            <small class="geneo-check-help">Align objects to the canvas grid when moving them.</small>
          </span>
        </label>
        <label class="geneo-check">
          <input
            type="checkbox"
            data-geneo-sockets
            ${
                canvas.alwaysShowSockets
                    ? 'checked'
                    : ''
            }>
          <span>Always show sockets
            <small class="geneo-check-help">Show connection points on every object.</small>
          </span>
        </label>
        <div class="geneo-field">
          <label for="geneoObjectHighlight">Highlight objects</label>
          <div class="common-select-shell">
            <select class="common-select" id="geneoObjectHighlight" data-geneo-object-highlight>
              ${[
                  ['none', 'No highlight'], ['person', 'People'], ['linked', 'Linked people'],
                  ['unlinked', 'Unlinked people'], ['image', 'Images'], ['place', 'Places'],
                  ['sticky', 'Sticky notes'], ['text', 'Text'], ['shape', 'Shapes'],
                  ['drawing', 'Drawings'], ['panel', 'Panels']
              ].map(([value, label]) => `<option value="${value}" ${highlight === value ? 'selected' : ''}>${escapeHtml(t(label))}</option>`).join('')}
            </select>
            <span class="common-select-chevron" aria-hidden="true">${icon.chevron}</span>
          </div>
        </div>
      `;

    return `
        <aside class="geneo-inspector">
          <div class="geneo-inspector-body">
            ${renderGeneographInspectorHeader(
                board.title,
                t('Board appearance and behavior'),
                '',
                null,
                'board'
            )}

            ${renderGeneographInspectorSection({
                context: 'canvas',
                id: 'appearance',
                title: 'Canvas appearance',
                content: appearanceContent
            })}

            ${renderGeneographInspectorSection({
                context: 'canvas',
                id: 'cardAppearance',
                title: 'Default card appearance',
                content: renderGeneoCardDefaultAppearance()
            })}

            ${renderGeneographInspectorSection({
                context: 'canvas',
                id: 'personCards',
                title: 'Default card layout',
                content:
                renderGeneographPersonCardControls({
                    scope: 'board'
                })
            })}
            ${renderGeneographInspectorSection({
                context: 'canvas',
                id: 'connectionDefaults',
                title: 'Default connection appearance',
                content: renderGeneoConnectionStyleFields(selectedGeneographDiagram().connectionDefaults, 'default')
            })}
            <div class="geneo-canvas-reset">
              <button class="button secondary" type="button" data-geneo-reset-canvas-defaults>Reset defaults</button>
            </div>
          </div>
        </aside>
      `;
}

function geneoSharedPersonCardValue(
    nodes,
    getter
)
{
    if (!nodes.length)
    {
        return null;
    }

    const values =
        nodes.map(
            node =>
                getter(
                    geneoPersonCardEffectiveSettings(
                        node
                    )
                )
        );

    return values.every(
        value =>
            value === values[0]
    )
        ? values[0]
        : null;
}

function geneoSharedPersonPaintValue(nodes, property, field)
{
    if (!nodes.length) return null;
    const values = nodes.map(node =>
        geneoResolveVisibleNodeAppearance(node)?.[property]?.[field]);
    return values.every(value => value === values[0]) ? values[0] : null;
}

function renderGeneographPersonMultiAppearance(nodes)
{
    const visible = nodes.map(node => geneoResolveVisibleNodeAppearance(node));
    const shared = key => {
        const values = visible.map(appearance => appearance[key]);
        return values.every(value => value === values[0]) ? values[0] : null;
    };
    const paintRow = property => {
        const color = geneoSharedPersonPaintValue(nodes, property, 'color');
        const opacity = geneoSharedPersonPaintValue(nodes, property, 'opacity');
        const enabled = geneoSharedPersonPaintValue(nodes, property, 'enabled');
        const label = capitalize(property);
        return `<div class="geneo-paint-row geneo-person-multi-paint-row ${enabled === false ? 'is-none' : ''}"
          data-geneo-person-multi-paint-row="${property}" data-geneo-paint-scope="person-multi" data-geneo-paint-property="${property}">
          <div class="geneo-paint-row-heading">
            <span class="geneo-paint-heading-copy"><span class="geneo-paint-label">${escapeHtml(label)}</span>
              ${enabled === null ? `<span class="geneo-paint-state">${escapeHtml(t('Mixed'))}</span>` : ''}
              ${enabled === false ? `<span class="geneo-paint-state">${escapeHtml(t('None'))}</span>` : ''}
            </span>
            ${property === 'text' ? '' : `<button class="geneo-paint-action" type="button"
              data-geneo-person-multi-paint-toggle="${property}">${escapeHtml(t(enabled === false ? 'Restore' : 'Remove'))}</button>`}
          </div>
          <div class="geneo-paint-controls">
            <button class="geneo-paint-swatch geneo-multi-paint-swatch ${color === null ? 'is-mixed' : ''}"
              type="button" data-geneo-paint-open style="${geneoPaintSwatchStyle({ color: color || '#FFFFFF', opacity: opacity ?? 100, enabled: enabled ?? true })}"
              title="${escapeHtml(color === null ? t('Mixed') : color)}" aria-label="${escapeHtml(t(`${label} color`))}"
              aria-haspopup="dialog" aria-expanded="false" ${enabled === false ? 'disabled' : ''}><span aria-hidden="true"></span></button>
            <input class="geneo-paint-hex" type="text" maxlength="7" spellcheck="false"
              value="${color || ''}" placeholder="${escapeHtml(t('Mixed'))}"
              data-geneo-person-multi-paint-hex="${property}"
              aria-label="${escapeHtml(t(`${label} hex color`))}" ${enabled === false ? 'disabled' : ''}>
            <label class="geneo-paint-opacity-number">
              <input type="number" min="0" max="100" step="1" value="${opacity ?? ''}"
                placeholder="${escapeHtml(t('Mixed'))}"
                data-geneo-person-multi-paint-opacity="${property}"
                aria-label="${escapeHtml(t(`${label} opacity`))}" ${enabled === false ? 'disabled' : ''}>
              <span aria-hidden="true">%</span>
            </label>
          </div>
        </div>`;
    };
    const width = shared('strokeWidth');
    const pattern = shared('strokePattern');
    const radius = geneoSharedPersonCardValue(nodes, settings => settings.cornerRadius);
    return renderGeneographInspectorSection({
        context: 'multi', id: 'appearance', title: 'Card appearance',
        content: `<div class="geneo-person-appearance-controls">
          ${['fill', 'stroke', 'text'].map(paintRow).join('')}
          <div class="geneo-card-default-dimensions">
            <label class="geneo-field"><span class="geneo-setting-label">Stroke width</span>
              <input class="geneo-input" type="number" min="1" max="12" step="1"
                value="${width ?? ''}" placeholder="${escapeHtml(t('Mixed'))}"
                data-geneo-person-multi-appearance="strokeWidth">
            </label>
            <label class="geneo-field"><span class="geneo-setting-label">Stroke pattern</span>
              <span class="common-select-shell">
                <select class="common-select" data-geneo-person-multi-appearance="strokePattern"
                  ${visible.every(appearance => !appearance.stroke.enabled) ? 'disabled' : ''}>
                  ${pattern === null ? `<option value="" selected>${escapeHtml(t('Mixed'))}</option>` : ''}
                  <option value="solid" ${pattern === 'solid' ? 'selected' : ''}>Solid</option>
                  <option value="dashed" ${pattern === 'dashed' ? 'selected' : ''}>Dashed</option>
                </select>
                <span class="common-select-chevron" aria-hidden="true">${icon.chevron}</span>
              </span>
            </label>
          </div>
          <div class="geneo-person-card-radius-row">
            <label class="geneo-field" for="geneoPersonMultiRadius"><span class="geneo-setting-label">Corner radius</span>
              <span class="geneo-selection-help">0–32 px</span>
            </label>
            <input class="geneo-input" id="geneoPersonMultiRadius" type="number" min="0" max="32" step="1"
              value="${radius ?? ''}" placeholder="${escapeHtml(t('Mixed'))}"
              data-geneo-person-multi-appearance="cornerRadius">
          </div>
        </div>
        <button class="button secondary geneo-apply-gender" type="button"
          data-geneo-person-multi-apply-gender>${escapeHtml(t('Apply gender color'))}</button>`
    });
}

function renderGeneographPersonMultiSelectionControls(
    nodes
)
{
    const options = geneoPersonCardControlOptions();
    const styles = nodes.map(node => geneoPersonCardEffectiveSettings(node).style);
    const style = geneoSharedPersonCardValue(nodes, settings => settings.style);
    const sharedSetting = key => geneoSharedPersonCardValue(nodes, settings => settings[key]);
    const select = (key, label, disabled = false) => {
        const value = sharedSetting(key);
        return `<div class="geneo-field"><label for="geneoMultiCard-${key}">${escapeHtml(label)}</label>
          <span class="common-select-shell"><select class="common-select" id="geneoMultiCard-${key}"
            data-geneo-person-multi-setting="${key}" ${disabled ? 'disabled' : ''}>
            ${value === null ? `<option value="" selected>${escapeHtml(t('Mixed'))}</option>` : ''}
            ${options[key].map(([optionValue, optionLabel]) =>
                `<option value="${optionValue}" ${value === optionValue ? 'selected' : ''}>${escapeHtml(optionLabel)}</option>`).join('')}
          </select><span class="common-select-chevron" aria-hidden="true">${icon.chevron}</span></span>
        </div>`;
    };
    const fields = Object.entries(geneoPersonCardFieldLabels())
        .filter(([field]) => styles.every(cardStyle => geneoPersonCardFieldSupported(cardStyle, field)))
        .map(([field, label]) => {
            const value = geneoSharedPersonCardValue(nodes, settings => settings.fields[field]);
            return `<label class="geneo-check"><input type="checkbox"
              data-geneo-person-multi-field="${field}" data-mixed="${value === null}"
              ${value === true ? 'checked' : ''}>${escapeHtml(label)}</label>`;
        }).join('');

    return renderGeneographInspectorSection({
        context: 'multi', id: 'personCards', title: 'Card layout',
        content: `<div class="geneo-person-card-controls">
          <div class="geneo-person-card-control-group">
            <strong class="geneo-person-card-group-title">Card style</strong>
            ${renderGeneographPersonCardStylePicker({ scope: 'multi', settings: { style } })}
            ${style === null ? `<span class="geneo-selection-help">${escapeHtml(t('Mixed'))}</span>` : ''}
          </div>
          <div class="geneo-person-card-control-group">
            <strong class="geneo-person-card-group-title">Formatting</strong>
            <div class="geneo-person-card-setting-grid">
              ${select('nameFormat', 'Name format')}
              ${select('dateFormat', 'Date format', nodes.every(node => !geneoPersonCardEffectiveSettings(node).fields.dates))}
              ${styles.every(cardStyle => cardStyle !== 'compact')
                  ? select('photoSize', 'Photo size', nodes.every(node => !geneoPersonCardEffectiveSettings(node).fields.photo)) : ''}
              ${styles.every(cardStyle => ['standard', 'chart'].includes(cardStyle))
                  ? select('photoAlignment', 'Photo alignment', nodes.every(node => !geneoPersonCardEffectiveSettings(node).fields.photo)) : ''}
              ${style === 'standard' ? `${select('nameAlignment', 'Name alignment')}${select('alignment', 'Dates alignment')}` : ''}
              ${style === 'chart' ? select('alignment', 'Text alignment') : ''}
              ${['compact', 'portrait'].includes(style) ? `<div class="geneo-field"><span class="geneo-field-label">Text alignment</span><span class="geneo-selection-help">Centered by this style</span></div>` : ''}
            </div>
          </div>
          <div class="geneo-person-card-control-group">
            <strong class="geneo-person-card-group-title">Displayed information</strong>
            <div class="geneo-person-card-options">${fields}</div>
          </div>
        </div>`
    });
}

function geneoSharedConnectionValue(connections, getter)
{
    if (!connections.length) return null;
    const values = connections.map(getter);
    return values.every(value => value === values[0]) ? values[0] : null;
}

function geneoCommitMultiConnectionAppearance(key, value)
{
    const connections = selectedGeneographConnections();
    const diagram = selectedGeneographDiagram();
    if (!diagram || !connections.length) return;
    const eligible = key === 'arrows' ? connections.every(connection => connection.kind === 'visual')
        : key === 'showRelationshipDates' ? connections.every(connection => connection.kind === 'family-partner') : true;
    if (!eligible || connections.every(connection =>
        (key === 'showRelationshipDates' ? geneoEffectiveShowRelationshipDates(connection)
            : geneoEffectiveConnectionStyle(connection)[key]) === value)) return;
    geneoPushHistory();
    connections.forEach(connection =>
    {
        if (key === 'showRelationshipDates')
        {
            if (value === diagram.connectionDefaults.showRelationshipDates) delete connection.showRelationshipDates;
            else connection.showRelationshipDates = value;
        }
        else
        {
            connection.style ||= {};
            if (value === diagram.connectionDefaults[key]) delete connection.style[key];
            else connection.style[key] = value;
        }
    });
    touchGeneographBoard();
    renderGeneographEditorPreserveScroll({ preserveInspectorScroll: true, preserveSidebarScroll: true });
}

function geneoCommitMultiConnectionPaint(field, value)
{
    const connections = selectedGeneographConnections();
    const diagram = selectedGeneographDiagram();
    if (!diagram || !connections.length) return;
    if (connections.every(connection => geneoEffectiveConnectionStyle(connection).line[field] === value)) return;
    geneoPushHistory();
    connections.forEach(connection =>
    {
        const line = { ...geneoEffectiveConnectionStyle(connection).line, [field]: value };
        connection.style ||= {};
        if (['color', 'opacity', 'enabled'].every(key => line[key] === diagram.connectionDefaults.line[key])) delete connection.style.line;
        else connection.style.line = line;
    });
    touchGeneographBoard();
    renderGeneographEditorPreserveScroll({ preserveInspectorScroll: true, preserveSidebarScroll: true });
}

function renderGeneographMultiConnectionAppearance(connections, mixed = false)
{
    const shared = getter => geneoSharedConnectionValue(connections, getter);
    const styleValue = key => shared(connection => geneoEffectiveConnectionStyle(connection)[key]);
    const pattern = styleValue('pattern');
    const width = styleValue('width');
    const radius = styleValue('cornerRadius');
    const color = shared(connection => geneoEffectiveConnectionStyle(connection).line.color);
    const opacity = shared(connection => geneoEffectiveConnectionStyle(connection).line.opacity);
    const enabled = shared(connection => geneoEffectiveConnectionStyle(connection).line.enabled);
    const visualOnly = connections.every(connection => connection.kind === 'visual');
    const partnerOnly = connections.every(connection => connection.kind === 'family-partner');
    const arrows = visualOnly ? styleValue('arrows') : null;
    const dates = partnerOnly ? shared(connection => geneoEffectiveShowRelationshipDates(connection)) : null;
    return renderGeneographInspectorSection({
        context: 'multi', id: mixed ? 'connectionAppearance' : 'appearance', title: 'Appearance',
        content: `<div class="geneo-connection-style-fields" data-geneo-connection-fields="multi">
          <div class="geneo-field"><span class="geneo-setting-label">${escapeHtml(t('Pattern'))}</span>
            <button type="button" class="geneo-connection-default-pattern" data-geneo-connection-multi-pattern
              aria-label="${escapeHtml(`${t('Pattern')}: ${pattern ? t(GENEO_CONNECTION_PATTERN_LABELS[pattern]) : t('Mixed')}`)}"
              aria-haspopup="menu" aria-expanded="false">${pattern ? renderGeneoConnectionLineSample(pattern) : escapeHtml(t('Mixed'))}${icon.chevron}</button>
          </div>
          <label class="geneo-field"><span class="geneo-setting-label">${escapeHtml(t('Width'))}</span>
            <span class="geneo-number-unit"><input class="geneo-input" type="number" min="1" max="12" step="1"
              value="${width ?? ''}" placeholder="${escapeHtml(t('Mixed'))}" data-geneo-connection-multi-width><span aria-hidden="true">px</span></span>
          </label>
          <div class="geneo-paint-row geneo-person-multi-paint-row ${enabled === false ? 'is-none' : ''}" data-geneo-connection-multi-paint-row data-geneo-paint-scope="connection-multi" data-geneo-paint-property="line">
            <div class="geneo-paint-row-heading"><span class="geneo-paint-heading-copy"><span class="geneo-paint-label">${escapeHtml(t('Connection color'))}</span>
              ${enabled === null ? `<span class="geneo-paint-state">${escapeHtml(t('Mixed'))}</span>` : ''}
              ${enabled === false ? `<span class="geneo-paint-state">${escapeHtml(t('None'))}</span>` : ''}</span>
              <button class="geneo-paint-action" type="button" data-geneo-connection-multi-paint-toggle>${escapeHtml(t(enabled === false ? 'Restore' : 'Remove'))}</button></div>
            <div class="geneo-paint-controls">
              <button class="geneo-paint-swatch geneo-multi-paint-swatch ${color === null ? 'is-mixed' : ''}" type="button"
                data-geneo-paint-open style="${geneoPaintSwatchStyle({ color: color || '#D9E5E1', opacity: opacity ?? 100, enabled: enabled ?? true })}"
                title="${escapeHtml(color ?? t('Mixed'))}" aria-label="${escapeHtml(t('Connection color'))}"
                aria-haspopup="dialog" aria-expanded="false"><span aria-hidden="true"></span></button>
              <input class="geneo-paint-hex" type="text" maxlength="7" spellcheck="false" value="${color || ''}"
                placeholder="${escapeHtml(t('Mixed'))}" data-geneo-connection-multi-hex aria-label="${escapeHtml(t('Connection color'))}">
              <label class="geneo-paint-opacity-number"><input type="number" min="0" max="100" step="1"
                value="${opacity ?? ''}" placeholder="${escapeHtml(t('Mixed'))}" data-geneo-connection-multi-opacity
                aria-label="${escapeHtml(t('Line opacity'))}"><span aria-hidden="true">%</span></label>
            </div>
          </div>
          ${visualOnly ? `<fieldset class="geneo-connection-arrows"><legend class="geneo-setting-label">${escapeHtml(t('Arrowheads'))}</legend>
            <div class="geneo-connection-arrow-options">${GENEO_CONNECTION_ARROWS.map(value => `<label><input type="radio" name="geneo-multi-arrows" value="${value}" data-geneo-connection-multi-arrows ${arrows === value ? 'checked' : ''}><span>${escapeHtml(t(capitalize(value)))}</span></label>`).join('')}</div></fieldset>` : ''}
          <div class="geneo-person-card-radius-row geneo-connection-radius-row"><label class="geneo-field" for="geneoConnectionMultiRadius">
            <span class="geneo-setting-label">${escapeHtml(t('Corner radius'))}</span><span class="geneo-selection-help">0–32 px</span></label>
            <input class="geneo-input" id="geneoConnectionMultiRadius" type="number" min="0" max="32" step="1"
              value="${radius ?? ''}" placeholder="${escapeHtml(t('Mixed'))}" data-geneo-connection-multi-radius></div>
        </div>
        ${partnerOnly ? `<label class="geneo-check geneo-connection-date-default"><input type="checkbox" data-geneo-connection-multi-dates ${dates === true ? 'checked' : ''} data-mixed="${dates === null}"><span>${escapeHtml(t('Show relationship date on board'))}</span></label>` : ''}`
    });
}

function geneoBulkNodeSupports(node, property)
{
    if (property === 'fontSize') return ['text', 'sticky', 'place'].includes(node.type);
    if (property === 'fill') return !['image', 'drawing'].includes(node.type);
    if (property === 'text') return !['image', 'shape', 'drawing'].includes(node.type);
    if (property === 'cornerRadius') return node.type !== 'drawing'
        && (node.type !== 'shape' || normalizeGeneographShapeKind(node.shapeKind) !== 'ellipse');
    return true;
}

function geneoBulkNodeValue(node, property, field = '')
{
    if (property === 'cornerRadius') return node.type === 'person'
        ? geneoPersonCardEffectiveSettings(node).cornerRadius : node.appearance.cornerRadius;
    const appearance = node.type === 'person' ? geneoResolveVisibleNodeAppearance(node) : node.appearance;
    return field ? appearance[property][field] : appearance[property];
}

function geneoBulkNodeAppearanceIsDefault(node)
{
    if (node.type !== 'person') return !geneoNodeAppearanceIsDefault(node);
    const appearance = node.appearance || {};
    return ['fill', 'stroke', 'text'].some(key => appearance.paintOverrides?.[key] === true)
        || ['strokeWidth', 'strokePattern'].some(key => appearance.styleOverrides?.[key] === true)
        || normalizeGeneographPersonCardOverrides(node.personCard).cornerRadius != null;
}

function renderGeneographGenericMultiAppearance(nodes)
{
    const shared = (property, field = '') => geneoSharedConnectionValue(nodes,
        node => geneoBulkNodeValue(node, property, field));
    const paintRow = property =>
    {
        if (!nodes.every(node => geneoBulkNodeSupports(node, property))) return '';
        const color = shared(property, 'color');
        const opacity = shared(property, 'opacity');
        const enabled = shared(property, 'enabled');
        const label = t(capitalize(property));
        return `<div class="geneo-paint-row geneo-person-multi-paint-row ${enabled === false ? 'is-none' : ''}" data-geneo-paint-scope="node-multi" data-geneo-paint-property="${property}">
          <div class="geneo-paint-row-heading"><span class="geneo-paint-heading-copy"><span class="geneo-paint-label">${escapeHtml(label)}</span>
            ${enabled === null ? `<span class="geneo-paint-state">${escapeHtml(t('Mixed'))}</span>` : ''}
            ${enabled === false ? `<span class="geneo-paint-state">${escapeHtml(t('None'))}</span>` : ''}</span>
            ${property !== 'text' ? `<button class="geneo-paint-action" type="button" data-geneo-bulk-paint-toggle="${property}">${escapeHtml(t(enabled === false ? 'Restore' : 'Remove'))}</button>` : ''}</div>
          <div class="geneo-paint-controls"><button class="geneo-paint-swatch geneo-multi-paint-swatch ${color === null ? 'is-mixed' : ''}" type="button"
            data-geneo-paint-open style="${geneoPaintSwatchStyle({ color: color || '#FFFFFF', opacity: opacity ?? 100, enabled: enabled ?? true })}"
            title="${escapeHtml(color || t('Mixed'))}" aria-label="${escapeHtml(t(`${capitalize(property)} color`))}"
            aria-haspopup="dialog" aria-expanded="false"><span aria-hidden="true"></span></button>
            <input class="geneo-paint-hex" type="text" maxlength="7" spellcheck="false" value="${color || ''}" placeholder="${escapeHtml(t('Mixed'))}"
              data-geneo-bulk-paint-hex="${property}" aria-label="${escapeHtml(t(`${capitalize(property)} hex color`))}">
            <label class="geneo-paint-opacity-number"><input type="number" min="0" max="100" step="1" value="${opacity ?? ''}"
              placeholder="${escapeHtml(t('Mixed'))}" data-geneo-bulk-paint-opacity="${property}" aria-label="${escapeHtml(t(`${capitalize(property)} opacity`))}"><span aria-hidden="true">%</span></label>
          </div></div>`;
    };
    const width = shared('strokeWidth');
    const pattern = shared('strokePattern');
    const radiusSupported = nodes.every(node => geneoBulkNodeSupports(node, 'cornerRadius'));
    const radius = radiusSupported ? shared('cornerRadius') : null;
    const fontSizeSupported = nodes.every(node => geneoBulkNodeSupports(node, 'fontSize'));
    const fontSize = fontSizeSupported ? shared('fontSize') : null;
    const shapesOnly = nodes.every(node => node.type === 'shape');
    const shapeKind = shapesOnly ? geneoSharedConnectionValue(nodes, node => normalizeGeneographShapeKind(node.shapeKind)) : null;
    return renderGeneographInspectorSection({
        context: 'multi', id: 'appearance', title: 'Appearance',
        content: `<div class="geneo-person-appearance-controls geneo-bulk-node-appearance">
          ${['fill', 'stroke', 'text'].map(paintRow).join('')}
          <div class="geneo-card-default-dimensions">
            <label class="geneo-field"><span class="geneo-setting-label">${escapeHtml(t('Stroke width'))}</span>
              <input class="geneo-input" type="number" min="1" max="12" step="1" value="${width ?? ''}"
                placeholder="${escapeHtml(t('Mixed'))}" data-geneo-bulk-appearance="strokeWidth"></label>
            <label class="geneo-field"><span class="geneo-setting-label">${escapeHtml(t('Stroke pattern'))}</span>
              <span class="common-select-shell"><select class="common-select" data-geneo-bulk-appearance="strokePattern">
                ${pattern === null ? `<option value="" selected>${escapeHtml(t('Mixed'))}</option>` : ''}
                <option value="solid" ${pattern === 'solid' ? 'selected' : ''}>${escapeHtml(t('Solid'))}</option>
                <option value="dashed" ${pattern === 'dashed' ? 'selected' : ''}>${escapeHtml(t('Dashed'))}</option>
              </select><span class="common-select-chevron" aria-hidden="true">${icon.chevron}</span></span></label>
          </div>
          ${radiusSupported ? `<div class="geneo-person-card-radius-row"><label class="geneo-field" for="geneoBulkNodeRadius">
            <span class="geneo-setting-label">${escapeHtml(t('Corner radius'))}</span><span class="geneo-selection-help">0–32 px</span></label>
            <input class="geneo-input" id="geneoBulkNodeRadius" type="number" min="0" max="32" step="1" value="${radius ?? ''}"
              placeholder="${escapeHtml(t('Mixed'))}" data-geneo-bulk-appearance="cornerRadius"></div>` : ''}
          ${fontSizeSupported ? `<div class="geneo-person-card-radius-row"><label class="geneo-field" for="geneoBulkNodeFontSize">
            <span class="geneo-setting-label">${escapeHtml(t('Font size'))}</span><span class="geneo-selection-help">8–72 px</span></label>
            <input class="geneo-input" id="geneoBulkNodeFontSize" type="number" min="8" max="72" step="1" value="${fontSize ?? ''}"
              placeholder="${escapeHtml(t('Mixed'))}" data-geneo-bulk-appearance="fontSize"></div>` : ''}
          ${shapesOnly ? `<label class="geneo-field"><span class="geneo-setting-label">${escapeHtml(t('Shape type'))}</span>
            <span class="common-select-shell"><select class="common-select" data-geneo-bulk-shape-kind>
              ${shapeKind === null ? `<option value="" selected>${escapeHtml(t('Mixed'))}</option>` : ''}
              ${GENEO_SHAPE_KINDS.map(shape => `<option value="${shape.id}" ${shapeKind === shape.id ? 'selected' : ''}>${escapeHtml(t(shape.label))}</option>`).join('')}
            </select><span class="common-select-chevron" aria-hidden="true">${icon.chevron}</span></span></label>` : ''}
        </div>`
    });
}

function geneoBulkArrangeRoots(nodes)
{
    const selectedIds = new Set(nodes.map(node => node.id));
    return nodes.filter(node => !geneoNodeHasSelectedAncestor(node, selectedIds)
        && !geneoNodeEffectiveLocked(node));
}

function renderGeneographBulkArrange(nodes, mixed = false)
{
    const roots = geneoBulkArrangeRoots(nodes);
    if (roots.length < 2) return '';
    const command = (value, label, iconHtml, disabled = false) => `<button class="geneo-bulk-arrange-button" type="button"
        data-geneo-bulk-arrange="${value}" aria-label="${escapeHtml(t(label))}" title="${escapeHtml(t(label))}"
        ${disabled ? 'disabled' : ''}>${iconHtml}</button>`;
    return renderGeneographInspectorSection({
        context: 'multi', id: 'arrange', title: mixed ? 'Arrange objects' : 'Arrange',
        content: `<div class="geneo-bulk-arrange-layout"><div class="geneo-bulk-arrange-group"><span class="geneo-setting-label">${escapeHtml(t('Align'))}</span>
            <div class="geneo-bulk-command-row" role="group" aria-label="${escapeHtml(t('Align'))}">
              <div class="geneo-bulk-command-strip">${[
                ['left', 'Align left', icon.alignStartVertical], ['centerX', 'Align horizontal centers', icon.alignCenterVertical],
                ['right', 'Align right', icon.alignEndVertical]
              ].map(([value, label, iconHtml]) => command(value, label, iconHtml)).join('')}</div>
              <div class="geneo-bulk-command-strip">${[
                ['top', 'Align top', icon.alignStartHorizontal], ['centerY', 'Align vertical centers', icon.alignCenterHorizontal],
                ['bottom', 'Align bottom', icon.alignEndHorizontal]
              ].map(([value, label, iconHtml]) => command(value, label, iconHtml)).join('')}</div>
            </div></div>
          <div class="geneo-bulk-arrange-group"><span class="geneo-setting-label">${escapeHtml(t('Distribute'))}</span>
            <div class="geneo-bulk-command-strip" role="group" aria-label="${escapeHtml(t('Distribute'))}">
              ${command('distributeX', 'Distribute horizontally', icon.alignHorizontalSpaceBetween)}
              ${command('distributeY', 'Distribute vertically', icon.alignVerticalSpaceBetween)}</div></div></div>`
    });
}

function renderGeneographBulkActions(nodes, connections)
{
    const targets = geneoObjectGroupNodes(nodes.map(node => node.id));
    const selected = [...targets, ...connections];
    const allVisible = selected.every(item => item.visible !== false);
    const allUnlocked = targets.length && targets.every(node => !node.locked);
    const visibleAction = allVisible ? 'hide' : 'show';
    const lockAction = allUnlocked ? 'lock' : 'unlock';
    const button = (action, label, iconHtml) => `<button type="button" data-geneo-bulk-action="${action}"
        aria-label="${escapeHtml(t(label))}" title="${escapeHtml(t(label))}">${iconHtml}</button>`;
    return `<div class="geneo-inspector-header-actions geneo-bulk-header-actions">
      ${!nodes.length ? '' : button(lockAction, connections.length
        ? (lockAction === 'lock' ? 'Lock selected objects' : 'Unlock selected objects')
        : (lockAction === 'lock' ? 'Lock selected' : 'Unlock selected'), lockAction === 'lock' ? icon.unlock : icon.lock)}
      ${button(visibleAction, visibleAction === 'show' ? 'Show selected' : 'Hide selected', visibleAction === 'show' ? icon.eyeOff : icon.eye)}
    </div>`;
}

function renderGeneographMultiSelectionInspector(
    nodes,
    connections = []
)
{
    const labels = [
        ...nodes.map(
            geneoNodeTitle
        ),

        ...connections.map(
            geneoConnectionLabel
        )
    ];

    const mixed = Boolean(nodes.length && connections.length);
    const selectionGroup = (title, names) => `<div class="geneo-selection-group">
        <strong class="geneo-setting-label">${escapeHtml(t(title))} (${names.length})</strong>
        <ul class="geneo-selection-list">${names.slice(0, 6).map(name => `<li>${escapeHtml(name)}</li>`).join('')}</ul>
        ${names.length > 6 ? `<p class="geneo-selection-more">${escapeHtml(t('and {count} more').replace('{count}', names.length - 6))}</p>` : ''}
      </div>`;

    const peopleOnly =
        nodes.length > 0
        && nodes.every(
            node =>
                node.type === 'person'
        );
    const selectionContent = `
        ${nodes.length ? selectionGroup('Objects', nodes.map(geneoNodeTitle)) : ''}
        ${connections.length ? selectionGroup('Connections', connections.map(geneoConnectionLabel)) : ''}
        <p class="geneo-selection-help">
          ${escapeHtml(t('Drag a selected object or connector to move the selection.'))}
        </p>
      `;
    const objectSettings = nodes.length ? `
        ${renderGeneographBulkArrange(nodes, mixed)}
        ${peopleOnly ? `${renderGeneographPersonMultiAppearance(nodes)}
            ${renderGeneographPersonMultiSelectionControls(nodes)}
            <div class="geneo-inspector-reset"><button class="button secondary" type="button"
              data-geneo-person-multi-reset ${nodes.some(geneoPersonHasResettableSettings) ? '' : 'disabled'}>${escapeHtml(t('Reset to default'))}</button></div>`
            : `${renderGeneographGenericMultiAppearance(nodes)}
              <div class="geneo-inspector-reset"><button class="button secondary" type="button"
                data-geneo-bulk-node-reset ${nodes.some(geneoBulkNodeAppearanceIsDefault) ? '' : 'disabled'}>${escapeHtml(t('Reset to default'))}</button></div>`}
      ` : '';
    const connectionSettings = connections.length ? `${renderGeneographMultiConnectionAppearance(connections, mixed)}
        <div class="geneo-inspector-reset"><button class="button secondary" type="button"
          data-geneo-connection-multi-reset-default ${connections.some(connection => Object.keys(connection.style || {}).length || connection.showRelationshipDates !== undefined) ? '' : 'disabled'}>${escapeHtml(t('Reset to default'))}</button></div>` : '';
    const scope = (title, count, content) => `<div class="geneo-mixed-selection-scope">
        <h3 class="geneo-mixed-selection-scope-title">${escapeHtml(t(title))} (${count})</h3>${content}
      </div>`;

    return `
        <aside class="geneo-inspector">
          <div class="geneo-inspector-body">
            ${renderGeneographInspectorHeader(
                t('{count} items selected').replace('{count}', labels.length),
                'Multiple selection',
                icon.cursorSelect,
                null,
                'node',
                renderGeneographBulkActions(nodes, connections)
            )}

            ${renderGeneographInspectorSection({
                context: 'multi',
                id: 'selection',
                title: 'Selection',
                content: selectionContent
            })}

            ${mixed ? scope('Objects', nodes.length, objectSettings) + scope('Connections', connections.length, connectionSettings)
                : objectSettings + connectionSettings}

            ${renderGeneographInspectorDangerAction(
                'Delete selected'
            )}
          </div>
        </aside>
      `;
}

function renderGeneographPersonInspectorContent(
    person,
    node
)
{
    const birthPlace =
        geneoPersonPlaceLabel(
            person?.birth
        );

    const deathPlace =
        person?.livingStatus
        === 'Deceased'
            ? geneoPersonPlaceLabel(
                person?.death
            )
            : '';

    const maiden =
        person?.gender === 'female'
            ? String(
                person?.names?.maiden
              || ''
            ).trim()
            : '';

    const details = [
        birthPlace
            ? [
                'Birth place',
                birthPlace
            ]
            : null,

        deathPlace
            ? [
                'Death place',
                deathPlace
            ]
            : null
    ].filter(Boolean);

    const avatar = geneoPersonAvatarModel(person);
    const subtitle = [t(capitalize(person?.gender || 'unknown')), t(person?.livingStatus || 'Unknown')].join(' · ');
    return `
        <div class="geneo-person-inspector-hero${details.length ? ' has-places' : ''}">
          ${renderPersonAvatar(avatar, 'geneo-inspector-person-avatar', {
            preferCrop: avatar.hasBoardPhoto,
            faceRegionOverride: avatar.photoRegion,
            overlayHtml: renderGeneographAvatarAction(node, person, 'inspector')
        })}
          <div class="geneo-person-inspector-identity">
            <div class="geneo-person-inspector-name" title="${escapeHtml(maiden ? `${geneoPersonDisplayName(person)} (${maiden})` : geneoPersonDisplayName(person))}">
              <strong>${escapeHtml(geneoPersonDisplayName(person))}</strong>${maiden ? ` <span class="geneo-person-inspector-maiden">(${escapeHtml(maiden)})</span>` : ''}
            </div>
            <span>${escapeHtml(subtitle)}</span>
            <span>${escapeHtml(geneoPersonLifeDates(person))}</span>
          </div>
        </div>
        ${details.length ? `<dl class="geneo-person-summary">
          ${details
                .map(
                    ([
                        label,
                        value
                    ]) => `
                <div>
                  <dt>
                    ${escapeHtml(label)}
                  </dt>

                  <dd>
                    ${escapeHtml(value)}
                  </dd>
                </div>
              `
                )
                .join('')}
        </dl>` : ''}
      `;
}

function renderGeneographPersonTreeLinkSection(
    person
)
{
    const linkedPerson =
        person?.treePersonId
            ? getPerson(
                person.treePersonId
            )
            : null;
    const validLink = linkedPerson && !linkedPerson.deleted && linkedPerson.projectId === currentProjectId();

    const content =
        validLink
            ? (() =>
            {
                const name =
                    personDisplayName(
                        linkedPerson.id
                    );

                const birth =
                    relationBirthMeta(
                        linkedPerson
                    );

                const meta = [
                    'Family Tree person',

                    birth
                        ? `Born ${birth}`
                        : 'Dates unknown'
                ].join(' · ');

                return `
                <div
                  class="
                    relation-row
                    geneo-tree-link-row
                  ">
                  <div
                    class="
                      relation-row-main
                      geneo-tree-link-person-main
                    ">

                    ${renderPersonAvatar(
                    linkedPerson,
                    'small-avatar',
                    {
                        element: 'span'
                    }
                )}

                    <span class="relation-row-copy">
                      <strong
                        title="${escapeHtml(name)}">
                        ${escapeHtml(name)}
                      </strong>

                      <span
                        title="${escapeHtml(meta)}">
                        ${escapeHtml(meta)}
                      </span>
                    </span>
                  </div>

                  <div
                    class="relation-actions"
                    aria-label="Family Tree link actions">

                    <button
                      class="relation-action-button"
                      type="button"
                      data-geneo-link-person
                      aria-label="${escapeHtml(
                    `Change Family Tree link for ${name}`
                )}"
                      title="Change link">
                      ${icon.edit}
                    </button>

                    <button
                      class="
                        relation-action-button
                        danger
                      "
                      type="button"
                      data-geneo-unlink-person
                      aria-label="${escapeHtml(
                    `Unlink ${name} from this board person`
                )}"
                      title="Unlink">
                      ${icon.unlink}
                    </button>
                  </div>
                </div>
              `;
            })()
            : person?.treePersonId ? `<div class="relation-row geneo-tree-link-row is-warning"><button class="relation-row-main" type="button" data-geneo-link-person><span class="geneo-tree-link-warning-icon" aria-hidden="true">${icon.warning}</span><span class="relation-row-copy"><strong>Link needs attention</strong><span>Tree person is unavailable. Choose another match.</span></span></button></div>` : `
            <div
              class="
                relation-row
                geneo-tree-link-row
              ">
              <button
                class="relation-row-main"
                type="button"
                data-geneo-link-person
                aria-label="Link this board person to Family Tree">

                <span
                  class="geneo-tree-link-warning-icon"
                  aria-hidden="true">
                  ${icon.people}
                </span>

                <span class="relation-row-copy">
                  <strong>
                    Board only
                  </strong>

                  <span>
                    Review this person and their family before linking.
                  </span>
                </span>

                <span
                  class="geneo-tree-link-cta-arrow"
                  aria-hidden="true">
                  ${icon.chevron}
                </span>
              </button>
            </div>
          `;

    return renderGeneographInspectorSection({
        context: 'person',
        id: 'familyTreeLink',
        title: 'Family Tree link',
        content: `${content}${validLink || person?.treePersonId ? `<button class="button secondary geneo-import-action" type="button" data-geneo-import-family>${validLink ? 'Sync with Family Tree' : 'Repair Tree link'}</button>` : ''}`
    });
}

function renderGeneographLayerNameField(
    entityType,
    entity
)
{
    const node =
        entityType === 'node';

    const automaticName =
        node
            ? geneoDefaultNodeTitle(
                entity
            )
            : geneoDefaultConnectionLabel(
                entity
            );

    const value =
        normalizeGeneographLayerName(
            entity.name
        );

    const inputId =
        node
            ? 'geneoNodeLayerName'
            : 'geneoConnectionName';

    const descriptionId =
        `${inputId}Description`;

    return `
        <div class="geneo-field">
          <label for="${inputId}">
            Layer name
          </label>

          <input
            id="${inputId}"
            class="geneo-input"
            type="text"
            maxlength="${GENEO_LAYER_NAME_LIMIT}"
            value="${escapeHtml(
                localizedDataFieldValue(
                    value
                )
            )}"
            placeholder="${escapeHtml(
                localizedDataFieldValue(
                    automaticName
                )
            )}"
            data-geneo-entity-name="${escapeHtml(
                entityType
            )}"
            data-geneo-entity-id="${escapeHtml(
                entity.id
            )}"
            data-geneo-entity-source-name="${escapeHtml(
                value
            )}"
            data-user-content
            aria-describedby="${descriptionId}">
        </div>

        <p
          class="geneo-selection-help"
          id="${descriptionId}">
          ${
                node
                    ? 'Board organization only. Card content and linked records are unchanged.'
                    : 'Leave blank to use the automatic relationship or connector name.'
            }
        </p>
      `;
}

function renderGeneographImageSourceSection(node)
{
    const source = resolveGeneographImageSource(node);

    const dimensions =
        source.width && source.height
            ? `${source.width} × ${source.height}`
            : '';

    const size =
        source.sizeBytes > 0
            ? formatMediaBytes(source.sizeBytes)
            : '';

    const metadata = [dimensions, size]
        .filter(Boolean)
        .join(' · ');

    return renderGeneographInspectorSection({
        context: 'image',
        id: 'imageSource',
        title: t('Image details'),
        actionHtml: `<button class="geneo-section-edit" type="button" data-geneo-replace-image aria-label="${escapeHtml(t('Replace image'))}" title="${escapeHtml(t('Replace image'))}">${icon.edit}<span>${escapeHtml(t('Replace'))}</span></button>`,
        inlineAction: true,
        content: `
            ${
                source.available
                    ? `
                  <div class="geneo-image-source-card">
                    <div class="geneo-image-source-preview">
                      ${renderPhotoThumbnail(source.photo, {
                            label: source.displayName
                        })}
                      <span class="geneo-image-missing-placeholder geneo-image-load-fallback">${icon.image}<small>${escapeHtml(t('Image unavailable'))}</small></span>
                    </div>

                    <div class="geneo-image-source-copy">
                      <strong title="${escapeHtml(source.displayName)}">
                        ${escapeHtml(source.displayName)}
                      </strong>

                      ${
                            source.filename
                          && source.filename !== source.displayName
                                ? `
                              <span title="${escapeHtml(source.filename)}">
                                ${escapeHtml(source.filename)}
                              </span>
                            `
                                : ''
                        }

                      ${
                            metadata
                                ? `<span>${escapeHtml(metadata)}</span>`
                                : ''
                        }
                      <div class="geneo-image-source-origin">
                        <span>${escapeHtml(t(source.sourceLabel))}</span>
                        ${source.ref?.scope === 'project' ? `<button class="geneo-image-source-link" type="button" data-geneo-open-project-photo="${escapeHtml(source.ref.id)}">${escapeHtml(t('Open photo'))}</button>` : ''}
                      </div>
                    </div>
                  </div>
                `
                    : `
                  <div class="geneo-image-source-card geneo-image-source-card-missing" role="status">
                    <div class="geneo-image-source-preview geneo-image-missing-placeholder">
                      ${icon.image}
                      <small>${escapeHtml(t('Image unavailable'))}</small>
                    </div>
                    <div class="geneo-image-source-copy">
                      <strong>${escapeHtml(t('Image unavailable'))}</strong>
                      <span>${escapeHtml(t(source.ref?.scope === 'board' ? 'Board upload missing. Replace the image to restore this layer.' : source.ref?.scope === 'project' ? 'Project photo missing. Replace the image to restore this layer.' : 'No image selected. Replace the image to restore this layer.'))}</span>
                    </div>
                  </div>
                `
            }
        `
    });
}

function renderGeneographNodeLayoutSection(
    node
)
{
    const minimumSize =
        geneoNodeMinimumSize(
            node,
            node.width
        );

    const maximumSize =
        geneoNodeMaximumSize(
            node
        );

    const isPerson =
        node.type === 'person';

    const autoHeight =
        isPerson
        && geneoPersonCardUsesAutoHeight(
            node
        );

    const autoPlaceSize =
        geneoPlaceUsesAutoSize(node);

    const imageSource = node.type === 'image'
        ? resolveGeneographImageSource(node)
        : null;

    return renderGeneographInspectorSection({
        context:
          geneoInspectorContextForNode(
              node
          ),

        id: 'layout',
        title: 'Position & size',

        content: `
          <div class="geneo-layout-grid">
            <div class="geneo-field">
              <label for="geneoNodeLayoutX">
                X
              </label>

              <input
                class="geneo-input"
                id="geneoNodeLayoutX"
                type="number"
                data-geneo-layout="x"
                value="${Math.round(
                    node.x
                )}">
            </div>

            <div class="geneo-field">
              <label for="geneoNodeLayoutY">
                Y
              </label>

              <input
                class="geneo-input"
                id="geneoNodeLayoutY"
                type="number"
                data-geneo-layout="y"
                value="${Math.round(
                    node.y
                )}">
            </div>

            <div class="geneo-field">
              <label for="geneoNodeLayoutWidth">
                Width
              </label>

              <input
                class="geneo-input"
                id="geneoNodeLayoutWidth"
                type="number"
                min="${Math.round(
                    minimumSize.width
                )}"
                max="${Math.round(
                    maximumSize.width
                )}"
                data-geneo-layout="width"
                value="${Math.round(
                    node.width
                )}">
            </div>

            <div class="geneo-field">
              <label for="geneoNodeLayoutHeight">
                Height
              </label>

              <input
                class="geneo-input"
                id="geneoNodeLayoutHeight"
                type="number"
                min="${Math.round(
                    minimumSize.height
                )}"
                max="${Math.round(
                    maximumSize.height
                )}"
                data-geneo-layout="height"
                value="${Math.round(
                    node.height
                )}">
            </div>
          </div>

          ${
                node.type === 'place'
                    ? `
                <div class="geneo-place-size-controls">
                  <span class="geneo-selection-help">
                    ${
                        autoPlaceSize
                            ? 'Size fits the place name automatically'
                            : 'Manual size'
                    }
                  </span>

                  ${
                        autoPlaceSize
                            ? ''
                            : `
                        <button
                          class="button ghost compact"
                          type="button"
                          data-geneo-place-fit-content>
                          Fit to content
                        </button>
                      `
                    }
                </div>
              `
                    : ''
            }

          ${imageSource ? `<div class="geneo-place-size-controls"><button class="button ghost compact" type="button" data-geneo-image-fit ${imageSource.available && imageSource.width > 0 && imageSource.height > 0 ? '' : 'disabled'}>${escapeHtml(t('Fit to image'))}</button></div>` : ''}

          ${
                isPerson && !autoHeight
                    ? `
                <div class="geneo-person-size-controls">
                  <button
                    class="button ghost compact"
                    type="button"
                    data-geneo-person-fit-height>
                    Fit height to content
                  </button>
                </div>
              `
                    : ''
            }

        `
    });
}

function renderGeneographStrokeFields({ scope, appearance })
{
    const connection = scope === 'connection';
    const width = connection ? appearance.width : appearance.strokeWidth;
    const pattern = connection ? appearance.pattern : appearance.strokePattern;
    const strokeEnabled = connection ? appearance.line?.enabled : appearance.stroke?.enabled;
    const prefix = connection ? 'Connection' : 'Node';
    const options = (connection ? GENEO_CONNECTION_PATTERNS : ['solid', 'dashed']).map(value => `<option value="${value}" ${pattern === value ? 'selected' : ''}>${escapeHtml(t(GENEO_CONNECTION_PATTERN_LABELS[value]))}</option>`).join('');
    return `<div class="geneo-stroke-settings"><div class="geneo-field geneo-appearance-subfield"><label for="geneo${prefix}StrokeWidth">${escapeHtml(t('Width'))}</label><div class="geneo-number-unit"><input class="geneo-input" id="geneo${prefix}StrokeWidth" type="number" min="${GENEO_STROKE_WIDTH_MIN}" max="${GENEO_STROKE_WIDTH_MAX}" step="1" value="${Math.round(width)}" data-geneo-stroke-width="${scope}"><span aria-hidden="true">px</span></div></div><div class="geneo-field geneo-appearance-subfield"><label for="geneo${prefix}StrokePattern">${escapeHtml(t('Pattern'))}</label><div class="common-select-shell geneo-pattern-select-shell"><select class="common-select geneo-pattern-select" id="geneo${prefix}StrokePattern" data-geneo-stroke-pattern="${scope}" ${strokeEnabled ? '' : 'disabled'}>${options}</select><span class="common-select-chevron" aria-hidden="true">${icon.chevron}</span></div></div></div>`;
}

function renderGeneographPlaceInspectorContent(
    node
)
{
    const resolved =
        resolveGeneographPlace(node);

    const content = `
        <div class="geneo-place-inspector-summary">
          <span aria-hidden="true">
            ${icon.mapPin}
          </span>

          <div>
            <strong>
              ${escapeHtml(resolved.name)}
            </strong>

            <span>
              ${
                    resolved.linked
                        ? t('Linked project place')
                        : t('Board-only place')
                }
            </span>
          </div>
        </div>

        ${resolved.linked ? `<div class="geneo-place-inspector-actions">
                <button
                  class="geneo-image-source-link"
                  type="button"
                  data-geneo-open-place="${escapeHtml(node.id)}">
                  ${escapeHtml(t('Open in Places'))}
                </button>

                <button
                  class="button secondary"
                  type="button"
                  data-geneo-place-board-only="${escapeHtml(node.id)}">
                  ${escapeHtml(t('Make board-only'))}
                </button>
            </div>` : ''}
      `;

    return renderGeneographInspectorSection({
        context: 'place',
        id: 'content',
        title: t('Content'),
        content,
        actionHtml: `<button class="geneo-section-edit" type="button" data-geneo-edit-place="${escapeHtml(node.id)}" aria-label="${escapeHtml(t('Change place'))}">${icon.edit}<span>${escapeHtml(t('Edit'))}</span></button>`,
        inlineAction: true
    });
}

function renderGeneographShapeInspectorContent(
    node
)
{
    const kind =
        normalizeGeneographShapeKind(
            node.shapeKind
        );

    const content = `
        <div class="geneo-field">
          <label for="geneoShapeKind">${escapeHtml(t('Shape type'))}</label>
          <span class="common-select-shell"><select class="common-select" id="geneoShapeKind" data-geneo-inspector-shape-kind>${GENEO_SHAPE_KINDS.map(shape => `<option value="${shape.id}" ${shape.id === kind ? 'selected' : ''}>${escapeHtml(t(shape.label))}</option>`).join('')}</select><span class="common-select-chevron" aria-hidden="true">${icon.chevron}</span></span>
        </div>
      `;

    return renderGeneographInspectorSection({
        context: 'shape',
        id: 'content',
        title: 'Content',
        content
    });
}

function geneoNodeAppearanceIsDefault(node)
{
    return JSON.stringify(node.appearance) === JSON.stringify(geneoNodeDefaults(node.type).appearance);
}

function renderGeneoNodeRadiusControl(node)
{
    if (!['image', 'place', 'panel', 'sticky', 'text', 'shape'].includes(node.type)
        || (node.type === 'shape' && normalizeGeneographShapeKind(node.shapeKind) === 'ellipse')) return '';
    const id = `geneoNodeRadius-${node.id}`;
    return `<div class="geneo-person-card-radius-row geneo-node-radius-row"><label class="geneo-field" for="${escapeHtml(id)}"><span class="geneo-setting-label">${escapeHtml(t('Corner radius'))}</span><span class="geneo-selection-help">0–32 px</span></label><input class="geneo-input" id="${escapeHtml(id)}" type="number" min="0" max="32" step="1" value="${node.appearance.cornerRadius}" data-geneo-node-corner-radius="${escapeHtml(node.id)}"></div>`;
}

function renderGeneoNodeFontSizeControl(node)
{
    if (!['text', 'sticky', 'place'].includes(node.type)) return '';
    const id = `geneoNodeFontSize-${node.id}`;
    return `<div class="geneo-person-card-radius-row"><label class="geneo-field" for="${escapeHtml(id)}"><span class="geneo-setting-label">${escapeHtml(t('Font size'))}</span><span class="geneo-selection-help">8–72 px</span></label><input class="geneo-input" id="${escapeHtml(id)}" type="number" min="8" max="72" step="1" value="${node.appearance.fontSize}" data-geneo-node-font-size="${escapeHtml(node.id)}"></div>`;
}

function renderGeneographNodeInspector(
    node
)
{
    const context =
        geneoInspectorContextForNode(
            node
        );

    const appearance =
        node.appearance || {};

    const person =
        node.type === 'person'
            ? getGeneographPerson(
                node.personId
            )
            : null;

    const content =
        node.type === 'person'
            ? renderGeneographPersonInspectorContent(
                person,
                node
            )
            : node.type === 'panel'
                ? `
              <div class="geneo-field">
                <label for="geneoPanelTitle">
                  Panel title
                </label>

                <input
                  class="geneo-input"
                  id="geneoPanelTitle"
                  type="text"
                  maxlength="160"
                  data-geneo-node-field="title"
                  value="${escapeHtml(node.title || '')}">
              </div>

              <div class="geneo-field">
                <label for="geneoPanelDescription">
                  Panel description
                </label>

                <textarea
                  class="geneo-textarea"
                  id="geneoPanelDescription"
                  maxlength="500"
                  rows="4"
                  data-geneo-node-field="description"
                  placeholder="Describe the purpose or contents of this panel.">${escapeHtml(
                        node.description || ''
                    )}</textarea>

                <p class="geneo-selection-help">
                  Visible in panel properties only.
                </p>
              </div>
            `
                : isGeneographRichTextNode(
                    node
                )
                    ? renderGeneographRichTextInspectorContent(
                        node
                    )
                    : '';

    const contentSection =
        node.type === 'image'
            ? renderGeneographImageSourceSection(
                node
            )
            : node.type === 'place'
                ? renderGeneographPlaceInspectorContent(
                    node
                )
                : node.type === 'shape'
                    ? renderGeneographShapeInspectorContent(
                        node
                    )
                    : node.type === 'drawing'
                        ? ''
                        : renderGeneographInspectorSection({
                            context,
                            id: 'content',
                            title: node.type === 'person' ? 'Card content' : 'Content',
                            content,
                            actionHtml: node.type === 'person'
                                ? `<button class="geneo-section-edit" type="button" data-geneo-edit-person aria-label="${escapeHtml(t('Edit card content'))}">${icon.edit}<span>${escapeHtml(t('Edit'))}</span></button>`
                                : '',
                            inlineAction: node.type === 'person'
                        });

    const appearanceContent = node.type === 'person'
        ? `${renderGeneoPersonAppearanceControls({
            scope: 'node', id: node.id,
            appearance: geneoResolveVisibleNodeAppearance(node),
            radius: geneoPersonCardEffectiveSettings(node).cornerRadius
        })}
          <button class="button secondary geneo-apply-gender" type="button" data-geneo-apply-gender-color>${escapeHtml(t('Apply gender color'))}</button>`
        : `
        ${
            ['drawing', 'image'].includes(node.type)
                ? ''
                : `
              <div class="geneo-appearance-group">
                ${renderGeneoPaintControl({
                    scope: 'node',
                    id: node.id,
                    property: 'fill'
                })}
              </div>
            `
        }

        <div class="geneo-appearance-group">
          ${renderGeneoPaintControl({
                scope: 'node',
                id: node.id,
                property: 'stroke'
            })}

          ${renderGeneographStrokeFields({
                scope: 'node',
                appearance
            })}
        </div>

        ${
            [
                'image',
                'shape',
                'drawing'
            ].includes(node.type)
                ? ''
                : `
              <div class="geneo-appearance-group">
                ${renderGeneoPaintControl({
                    scope: 'node',
                    id: node.id,
                    property: 'text'
                })}

                ${renderGeneoContrastWarning(
                    node
                )}
              </div>
            `
        }

        ${renderGeneoNodeRadiusControl(node)}
        ${renderGeneoNodeFontSizeControl(node)}

      `;

    return `
        <aside class="geneo-inspector">
          <div class="geneo-inspector-body">
            ${renderGeneographInspectorHeader(
                geneoNodeTitle(node),
                t(capitalize(node.type)),
                geneoNodeIcon(node.type),
                node
            )}

            ${contentSection}

            ${
                node.type === 'person'
                    ? renderGeneographPersonTreeLinkSection(
                        person
                    )
                    : ''
            }

            ${renderGeneographInspectorSection({
                context,
                id: 'appearance',
                title: node.type === 'person' ? 'Card appearance' : 'Appearance',
                content: appearanceContent
            })}

            ${
                node.type === 'person'
                    ? renderGeneographPersonCardSection(
                        node
                    )
                    : ''
            }

            ${renderGeneographNodeLayoutSection(
                node
            )}

            ${node.type === 'person' ? `<div class="geneo-inspector-reset"><button class="button secondary" type="button" data-geneo-person-card-reset data-geneo-person-card-node="${escapeHtml(node.id)}" ${geneoPersonHasResettableSettings(node) ? '' : 'disabled'}>${escapeHtml(t('Reset to default'))}</button></div>` : `<div class="geneo-inspector-reset"><button class="button secondary" type="button" data-geneo-node-appearance-reset="${escapeHtml(node.id)}" ${geneoNodeAppearanceIsDefault(node) ? 'disabled' : ''}>${escapeHtml(t('Reset to default'))}</button></div>`}

            ${renderGeneographInspectorDangerAction(
                t(`Delete ${capitalize(node.type)}`)
            )}
          </div>
        </aside>
      `;
}

function renderGeneographConnectionInspector(
    connection
)
{
    const family =
        connection.kind === 'family-partner'
            ? getGeneographFamily(
                connection.familyId
            )
            : null;

    const resolved =
        family
            ? geneoRelationshipForFamily(
                family
            )
            : null;

    const relationship =
        resolved?.relationship;

    const relationshipType =
        relationship
            ? relationshipTypeFromLegacy(
                relationship
            )
            : 'Married';

    const startEvent =
        relationship
            ? partnerRelationshipStartEvent(
                relationship,
                relationshipType
            )
            : null;

    const marriageType =
        startEvent?.typeLabel
        || relationship?.marriageType
        || 'Civil';

    const relationshipSection =
        family
            ? renderGeneographInspectorSection({
                context: 'connection',
                id: 'relationship',
                title: 'Relationship details',
                content: `
                <div
                  class="
                    geneo-relationship-editor
                  "
                  data-geneo-relationship-editor>
                  <div class="geneo-field">
                    <label for="geneoRelationshipType">
                      Relationship type
                    </label>

                    <select
                      class="geneo-select"
                      id="geneoRelationshipType"
                      data-geneo-relationship-type>
                      ${addPersonRelationshipTypeOptions(
                            relationshipType
                        )}
                    </select>
                  </div>

                  ${renderPartnerRelationshipDateFields({
                        prefix:
                      'geneoRelationship',
                        relationshipType,
                        family: relationship
                    })}

                  <div
                    class="geneo-field"
                    data-add-person-marriage-type-field
                    ${
                        addPersonRelationshipShowsMarriageType(
                            relationshipType
                        )
                            ? ''
                            : 'hidden'
                    }>
                    <label for="geneoRelationshipMarriageType">
                      Marriage type
                    </label>

                    <select
                      class="geneo-select"
                      id="geneoRelationshipMarriageType"
                      data-geneo-marriage-type>
                      ${addPersonMarriageTypeOptions(
                            marriageType
                        )}
                    </select>
                  </div>

                </div>
              `
            })
            : '';

    const appearanceContent = `
        <div class="geneo-connection-type-row"><span class="geneo-connection-type-label">${connection.kind === 'visual' ? icon.link : icon.tree}<span>${escapeHtml(t(connection.kind === 'visual' ? 'Visual only' : 'Family relationship'))}</span></span>${connection.kind !== 'visual' ? `<button class="geneo-type-convert" type="button" data-geneo-make-visual>${escapeHtml(t('Make visual only'))}</button>` : ''}</div>
        ${renderGeneoConnectionInspectorStyleFields(connection)}
        ${family ? `<label class="geneo-check geneo-connection-date-default"><input type="checkbox" data-geneo-show-relationship-dates ${geneoEffectiveShowRelationshipDates(connection) ? 'checked' : ''}><span>${escapeHtml(t('Show relationship date on board'))}</span></label>` : ''}

        <div class="geneo-field">
          <label for="geneoConnectionRouting">
            Routing
          </label>

          <select
            class="geneo-select"
            id="geneoConnectionRouting"
            data-geneo-connection-routing>
            <option
              value="auto"
              ${
                    connection.route.mode === 'auto'
                        ? 'selected'
                        : ''
                }>
              Automatic
            </option>

            <option
              value="manual"
              ${
                    connection.route.mode === 'manual'
                        ? 'selected'
                        : ''
                }>
              Manual
            </option>
          </select>
        </div>

        <button
          class="button secondary"
          type="button"
          data-geneo-reset-route>
          Reset route
        </button>
      `;

    return `
        <aside class="geneo-inspector">
          <div class="geneo-inspector-body">
            ${renderGeneographInspectorHeader(
                geneoConnectionLabel(
                    connection
                ),
                'Connection',
                icon.link,
                connection,
                'connection'
            )}

            ${relationshipSection}

            ${renderGeneographInspectorSection({
                context: 'connection',
                id: 'appearance',
                title: 'Appearance',
                content: appearanceContent
            })}

            <div class="geneo-inspector-reset"><button class="button secondary" type="button" data-geneo-connection-reset-default ${Object.keys(connection.style || {}).length || connection.showRelationshipDates !== undefined ? '' : 'disabled'}>${escapeHtml(t('Reset to default'))}</button></div>

            ${renderGeneographInspectorDangerAction(
                'Delete connection'
            )}
          </div>
        </aside>
      `;
}

function renderGeneographEditor()
{
    if (geneoImageCropRuntime?.boardId !== selectedGeneographBoard()?.id) geneoImageCropRuntime = null;
    if (geneoImageCropRuntime && !resolveGeneographImageSource(getGeneographNode(geneoImageCropRuntime.nodeId)).available)
        geneoImageCropRuntime = null;
    if (geneoCtrlSelectPressed && (geneoCtrlSelectContext?.tool !== state.geneoTool
        || geneoCtrlSelectContext?.boardId !== selectedGeneographBoard()?.id))
        setGeneoCtrlSelectPressed(false);
    closeGeneographObjectContextMenu();
    const richTextDraft = captureGeneographRichTextDraft();
    destroyGeneographRichTextEditor();
    if (geneoPaintRuntime.popover) closeGeneoPaintPopover({ restoreFocus: false });
    normalizeGeneographRuntimeData();
    pruneGeneographSelection();
    if (
        state.geneoLayerRename
        && !getGeneographRenameEntity(
            state.geneoLayerRename.entityType,
            state.geneoLayerRename.entityId
        )
    )
    {
        state.geneoLayerRename = null;
    }
    geneoEnsureHistory();
    const board = selectedGeneographBoard();
    if (!board)
    {
        state.geneoView = 'home'; renderGeneographHome(); return;
    }
    const zoom = Math.max(.25, Math.min(2, state.geneoZoom / 100));
    renderGeneographEditorSidebar(board);
    const diagram = board.diagram;
    const bounds = geneoDerivedCanvasBounds(diagram);
    geneoCanvasRuntime.bounds = bounds;
    const gridOriginX = (((-bounds.left % GENEO_GRID_SIZE) + GENEO_GRID_SIZE) % GENEO_GRID_SIZE) * zoom;
    const gridOriginY = (((-bounds.top % GENEO_GRID_SIZE) + GENEO_GRID_SIZE) % GENEO_GRID_SIZE) * zoom;
    const ordered = diagram.nodes.slice().sort((a, b) => (a.type === 'panel' ? -1000 : 0) + a.order - ((b.type === 'panel' ? -1000 : 0) + b.order));
    const stageClasses = [
        'geneo-canvas-stage',
        geneoEffectiveCanvasTool() === 'select' && state.geneoTool !== 'select' ? 'temporary-select-tool' : '',
        state.geneoTool === 'connect' ? 'connection-tool' : '',
        state.geneoTool === 'panel'
            ? 'panel-tool'
            : '',
        state.geneoTool === 'sticky'
            ? 'sticky-tool'
            : '',
        state.geneoTool === 'text'
            ? 'text-tool'
            : '',
        state.geneoTool === 'shape'
            ? 'shape-tool'
            : '',
        state.geneoTool === 'pencil'
            ? 'pencil-tool'
            : '',
        state.geneoConnectionDraft ? 'is-connecting' : '',
        diagram.canvas.alwaysShowSockets ? 'show-sockets' : ''
    ].filter(Boolean).join(' ');
    geneoCanvasRuntime.suppressEdgeExpansion = true;
    main.innerHTML = `<section class="geneo-editor">
      <div
        class="geneo-editor-toolbar"
        role="toolbar"
        aria-label="${
            escapeHtml(
                t('Geneograph board tools')
            )
        }"
        data-toolbar-density="expanded">

        <div class="geneo-editor-toolbar-left">
          <div
            class="geneo-history-group"
            role="group"
            aria-label="${escapeHtml(t('History'))}">

            <button
              class="geneo-toolbar-button geneo-icon-button"
              type="button"
              data-geneo-undo
              aria-label="${escapeHtml(t('Undo'))}"
              title="${escapeHtml(t('Undo'))}"
              ${
                    geneoHistoryRuntime.undo.length
                        ? ''
                        : 'disabled'
                }>

              ${icon.undo}
            </button>

            <button
              class="geneo-toolbar-button geneo-icon-button"
              type="button"
              data-geneo-redo
              aria-label="${escapeHtml(t('Redo'))}"
              title="${escapeHtml(t('Redo'))}"
              ${
                    geneoHistoryRuntime.redo.length
                        ? ''
                        : 'disabled'
                }>

              ${icon.redo}
            </button>
          </div>

          <div
            class="geneo-tool-group${['select', 'pan', 'pencil'].includes(state.geneoTool) ? '' : ' is-icon-only'}"
            role="group"
            aria-label="${
                escapeHtml(t('Working mode'))
            }">

            ${
                renderGeneoModeTool(
                    'select',
                    icon.cursorSelect,
                    'Select'
                )
            }

            ${
                renderGeneoModeTool(
                    'pan',
                    icon.pan,
                    'Pan'
                )
            }

            ${
                renderGeneoModeTool(
                    'pencil',
                    icon.edit,
                    'Pencil'
                )
            }
          </div>

          ${renderGeneoConnectionSplitTool()}

          <div
            class="geneo-toolbar-objects"
            aria-label="${
                escapeHtml(t('Add objects'))
            }">

            ${
                renderGeneoPersonSplitTool()
            }

            ${
                renderGeneoToolbarObjectButton(
                    'place',
                    icon.mapPin,
                    'Place'
                )
            }

            ${
                renderGeneoToolbarObjectButton(
                    'image',
                    icon.image,
                    'Image'
                )
            }

            ${
                renderGeneoToolbarObjectButton(
                    'panel',
                    icon.panel,
                    'Panel'
                )
            }

            ${renderGeneoContentSplitTool()}

            ${renderGeneoShapeSplitTool()}
          </div>
        </div>

        <div class="geneo-editor-toolbar-right">
          <button
            class="geneo-toolbar-button"
            type="button"
            data-geneo-toolbar-item="export"
            data-geneo-export
            aria-label="${
                escapeHtml(t('Export board'))
            }"
            title="${
                escapeHtml(t('Export board'))
            }">

            ${icon.export}
            <span>${escapeHtml(t('Export'))}</span>
          </button>

          <button
            class="geneo-toolbar-button geneo-icon-button geneo-toolbar-overflow"
            type="button"
            data-geneo-toolbar-overflow
            aria-label="${
                escapeHtml(t('More board tools'))
            }"
            title="${
                escapeHtml(t('More board tools'))
            }"
            aria-haspopup="menu"
            aria-expanded="false">

            ${icon.more}
          </button>
        </div>
      </div>
        ${renderGeneoConnectionToolPanel()}
        ${renderGeneoCreationToolPanel('drawing')}
        ${renderGeneoCreationToolPanel('shape')}
        <div class="geneo-editor-main ${state.geneoInspectorCollapsed ? 'inspector-collapsed' : ''}"><div class="geneo-canvas-viewport" data-geneo-canvas-viewport style="--geneo-canvas-background:${escapeHtml(geneoPaintCssColor(diagram.canvas.backgroundPaint))}"><div class="geneo-canvas-wrap" data-geneo-canvas-wrap><div class="geneo-board-space pattern-${escapeHtml(diagram.canvas.backgroundPattern)}" style="width:${bounds.width * zoom}px;height:${bounds.height * zoom}px;--geneo-canvas-zoom:${zoom};--geneo-grid-origin-x:${gridOriginX}px;--geneo-grid-origin-y:${gridOriginY}px"><div class="${stageClasses}" data-geneo-stage style="width:${bounds.width}px;height:${bounds.height}px;transform:scale(${zoom})">
          ${renderGeneographConnectors()}<div class="geneo-panel-draft" data-geneo-panel-draft hidden><span data-geneo-panel-draft-size></span></div><div class="geneo-selection-marquee" data-geneo-marquee hidden></div>${ordered.map(renderGeneographObject).join('')}
          </div></div></div><div class="geneo-zoom-overlay canvas-zoom"><button class="geneo-zoom-button zoom-button" type="button" data-geneo-zoom="out" aria-label="Zoom out">${icon.zoomOut}</button><span class="geneo-zoom-value zoom-value">${state.geneoZoom}%</span><button class="geneo-zoom-button zoom-button" type="button" data-geneo-zoom="in" aria-label="Zoom in">${icon.zoomIn}</button><button class="geneo-zoom-button zoom-button" type="button" data-geneo-zoom="fit" aria-label="Fit board">${icon.home}</button></div></div>${renderGeneographInspector()}</div>
          </section>`;
    localizeUI(
        main,
        {
            suppressObserverReplay: true
        }
    );

    const autoHeightsChanged =
        syncGeneographAutoPersonCardHeights();

    const autoPlaceSizesChanged =
        syncGeneographAutoPlaceSizes();

    if (
        autoHeightsChanged
        || autoPlaceSizesChanged
    )
    {
        localizeUI(
            main.querySelector(
                '.geneo-connections'
            ),
            {
                suppressObserverReplay: true
            }
        );
    }

    bindGeneographEditor();
    if (geneoImageCropRuntime) requestAnimationFrame(geneoPositionImageCropToolbar);
    ensureGeneographKeyboardBinding();
    const editingNode =
        getGeneographNode(
            state.geneoInlineEditNodeId
        );

    if (
        isGeneographRichTextNode(
            editingNode
        )
    )
    {
        const matchingDraft =
            richTextDraft?.nodeId
            === editingNode.id
                ? richTextDraft
                : null;

        requestAnimationFrame(
            () =>
            {
                initializeGeneographRichTextEditor(
                    editingNode,
                    {
                        draft:
                  matchingDraft
                    }
                );
            }
        );
    }
}

function renderGeneographEditorPreserveScroll({
    preserveInspectorScroll = false,
    preserveSidebarScroll = false
} = {})
{
    const center = geneoCurrentViewportCenter();

    const inspectorScrollTop = preserveInspectorScroll
        ? (
            main.querySelector(
                '.geneo-inspector:not(.collapsed)'
            )?.scrollTop ?? null
        )
        : null;
    const sidebarScrollTop = preserveSidebarScroll
        ? sidebar.querySelector('.geneo-sidebar')?.scrollTop ?? null
        : null;

    renderGeneographEditor();

    scheduleGeneographViewportRestore(center, () =>
    {
        if (inspectorScrollTop !== null)
        {
            const inspector = main.querySelector(
                '.geneo-inspector:not(.collapsed)'
            );

            if (inspector)
            {
                const maximumScrollTop = Math.max(
                    0,
                    inspector.scrollHeight - inspector.clientHeight
                );

                inspector.scrollTop = Math.min(
                    inspectorScrollTop,
                    maximumScrollTop
                );
            }
        }

        if (sidebarScrollTop !== null)
        {
            const geneoSidebar = sidebar.querySelector('.geneo-sidebar');
            if (geneoSidebar)
            {
                geneoSidebar.scrollTop = Math.min(
                    sidebarScrollTop,
                    Math.max(0, geneoSidebar.scrollHeight - geneoSidebar.clientHeight)
                );
            }
        }
        if (geneoImageCropRuntime) geneoPositionImageCropToolbar();
    });
}

function geneoNodeCenter(
    node
)
{
    if (!node)
    {
        return null;
    }

    return {
        x:
          node.x
          + node.width / 2,

        y:
          node.y
          + node.height / 2
    };
}

function renderGeneographEditorPreserveCenter(center = null)
{
    const point = center || geneoCurrentViewportCenter();
    renderGeneographEditor();
    scheduleGeneographViewportRestore(point);
}

function nextGeneoObjectPosition(width, height)
{
    const center = geneoCurrentViewportCenter() || geneoContentCenter();
    const baseX = center.x - width / 2;
    const baseY = center.y - height / 2;
    const nodes = selectedGeneographDiagram()?.nodes || [];
    const overlaps = candidate => nodes.some(node =>
        candidate.x < node.x + node.width + 18
        && candidate.x + width + 18 > node.x
        && candidate.y < node.y + node.height + 18
        && candidate.y + height + 18 > node.y
    );
    const offsets = [{ x: 0, y: 0 }];
    for (let ring = 1; ring <= 10; ring += 1)
    {
        const step = ring * 34;
        offsets.push(
            { x: step, y: 0 }, { x: step, y: step }, { x: 0, y: step },
            { x: -step, y: step }, { x: -step, y: 0 }, { x: -step, y: -step },
            { x: 0, y: -step }, { x: step, y: -step }
        );
    }
    const candidate = offsets.map(offset => ({
        x: baseX + offset.x,
        y: baseY + offset.y
    })).find(position => !overlaps(position));
    return candidate || { x: baseX, y: baseY };
}

function isGeneographRichTextNode(
    node
)
{
    return Boolean(
        node
        && (
            node.type === 'text'
          || node.type === 'sticky'
        )
    );
}

function geneographRichTextDisplayHtml(
    node
)
{
    const text =
        String(
            node?.text || ''
        );

    if (!text)
    {
        return `
          <span
            class="geneo-rich-text-placeholder">
            Double-click to edit
          </span>
        `;
    }

    return renderRichTextDeltaHtml(
        node.textFormat
          === 'quill-delta-v1'
            ? node.textDelta
            : null,

        text
    );
}

function renderGeneographRichTextInspectorContent(
    node
)
{
    const editing =
        state.geneoInlineEditNodeId
          === node.id;

    if (!editing)
    {
        return `
          <div
            class="
              geneo-rich-text-inspector-preview
              geneo-rich-text-inspector-${escapeHtml(
                    node.type
                )}
            " role="button" tabindex="0" aria-label="${escapeHtml(t('Edit text'))}" title="${escapeHtml(t('Edit text'))}" data-geneo-edit-rich-text="${escapeHtml(node.id)}">
            ${geneographRichTextDisplayHtml(
                node
            )}
          </div>

        `;
    }

    const toolbarLabel =
        node.type === 'sticky'
            ? 'Sticky note formatting'
            : 'Text formatting';

    return `
        <div
          class="geneo-rich-text-inspector"
          data-geneo-rich-text-inspector="${escapeHtml(
                node.id
            )}">

          <div
            class="notes-rich-editor-shell geneo-rich-text-inspector-editor-shell"
            data-geneo-inspector-rich-text-editor-shell>

            ${renderRichTextToolbar({
                id:
                'geneoInspectorRichTextToolbar',

                className:
                'geneo-rich-text-inspector-toolbar',

                ariaLabel:
                toolbarLabel
            })}

            <div
              class="geneo-rich-text-inspector-editor"
              data-geneo-inspector-rich-text-editor>
            </div>

            <textarea
              class="geneo-rich-text-inspector-fallback"
              data-geneo-inspector-rich-text-fallback
              aria-label="${escapeHtml(
                    node.type === 'sticky'
                        ? 'Sticky note content'
                        : 'Text block content'
                )}"
              hidden>${escapeHtml(
                    node.text || ''
                )}</textarea>
          </div>

          <div
            class="geneo-rich-text-inspector-actions">
            <button
              class="button secondary"
              type="button"
              data-geneo-rich-text-cancel>
              Cancel
            </button>

            <button
              class="button primary"
              type="button"
              data-geneo-rich-text-done>
              Done
            </button>
          </div>
        </div>
      `;
}

function renderGeneographRichTextToolbar(
    node
)
{
    if (
        !isGeneographRichTextNode(
            node
        )
        || state.geneoInlineEditNodeId
          !== node.id
    )
    {
        return '';
    }

    return renderRichTextToolbar({
        id:
          'geneoRichTextToolbar',

        className:
          'geneo-rich-text-toolbar',

        ariaLabel:
          node.type === 'sticky'
              ? 'Sticky note formatting'
              : 'Text formatting'
    });
}

function captureGeneographRichTextDraft()
{
    if (
        !geneoRichTextRuntime
            .nodeId
    )
    {
        return null;
    }

    return {
        nodeId:
          geneoRichTextRuntime
              .nodeId,

        delta:
          cloneRichTextDelta(
              geneoRichTextRuntime
                  .draftDelta
          ),

        text:
          geneoRichTextRuntime
              .draftText,

        fallbackActive:
          geneoRichTextRuntime
              .fallbackActive
    };
}

function destroyGeneographRichTextEditor()
{
    Object.entries(
        geneoRichTextRuntime.instances
    ).forEach(([
        surface,
        instance
    ]) =>
    {
        const handler =
            geneoRichTextRuntime
                .textChangeHandlers[
                    surface
                ];

        if (
            instance
          && handler
        )
        {
            instance.off(
                'text-change',
                handler
            );
        }
    });

    if (
        geneoRichTextRuntime
            .outsidePointerHandler
    )
    {
        document.removeEventListener(
            'pointerdown',
            geneoRichTextRuntime
                .outsidePointerHandler,
            true
        );
    }

    if (
        geneoRichTextRuntime
            .keydownHandler
    )
    {
        document.removeEventListener(
            'keydown',
            geneoRichTextRuntime
                .keydownHandler,
            true
        );
    }

    geneoRichTextRuntime.nodeId =
        '';

    geneoRichTextRuntime.instances = {
        canvas: null,
        inspector: null
    };

    geneoRichTextRuntime
        .textChangeHandlers = {
            canvas: null,
            inspector: null
        };

    geneoRichTextRuntime
        .fallbackElements = {
            canvas: null,
            inspector: null
        };

    geneoRichTextRuntime
        .outsidePointerHandler =
            null;

    geneoRichTextRuntime
        .keydownHandler =
            null;

    geneoRichTextRuntime.draftDelta =
        null;

    geneoRichTextRuntime.draftText =
        '';

    geneoRichTextRuntime.syncing =
        false;

    geneoRichTextRuntime
        .fallbackActive =
            false;
}

function bindGeneographRichTextSessionGuards(
    node
)
{
    const selector =
        `[data-geneo-node="${
            CSS.escape(node.id)
        }"]`;

    const outsidePointerHandler =
        event =>
        {
            if (
                geneoRichTextRuntime
                    .nodeId !== node.id
            )
            {
                return;
            }

            if (
                event.target.closest(
                    selector
                )
            || event.target.closest(
                '[data-geneo-rich-text-inspector]'
            )
            )
            {
                return;
            }

            event.preventDefault();
            event.stopPropagation();

            commitGeneoInlineEdit(
                false
            );
        };

    const keydownHandler =
        event =>
        {
            if (
                geneoRichTextRuntime
                    .nodeId !== node.id
            )
            {
                return;
            }

            if (
                event.key === 'Escape'
            )
            {
                event.preventDefault();
                event.stopPropagation();

                commitGeneoInlineEdit(
                    true
                );

                return;
            }

            if (
                event.key === 'Enter'
            && (
                event.ctrlKey
              || event.metaKey
            )
            )
            {
                event.preventDefault();
                event.stopPropagation();

                commitGeneoInlineEdit(
                    false
                );
            }
        };

    geneoRichTextRuntime
        .outsidePointerHandler =
            outsidePointerHandler;

    geneoRichTextRuntime
        .keydownHandler =
            keydownHandler;

    document.addEventListener(
        'pointerdown',
        outsidePointerHandler,
        true
    );

    document.addEventListener(
        'keydown',
        keydownHandler,
        true
    );
}

function initializeGeneographRichTextEditor(
    node,
    {
        draft = null
    } = {}
)
{
    if (
        !isGeneographRichTextNode(
            node
        )
    )
    {
        return;
    }

    const nodeElement =
        main.querySelector(
            `[data-geneo-node="${
                CSS.escape(node.id)
            }"]`
        );

    const inspector =
        main.querySelector(
            `[data-geneo-rich-text-inspector="${
                CSS.escape(node.id)
            }"]`
        );

    if (!nodeElement)
    {
        return;
    }

    const matchingDraft =
        draft?.nodeId === node.id
            ? draft
            : null;

    const initialDelta =
        matchingDraft
            ? cloneRichTextDelta(
                matchingDraft.delta
            )
            : cloneRichTextDelta(
                node.textDelta
            );

    const initialText =
        matchingDraft
            ? String(
                matchingDraft.text || ''
            )
            : String(
                node.text || ''
            );

    geneoRichTextRuntime.nodeId =
        node.id;

    geneoRichTextRuntime.draftDelta =
        initialDelta;

    geneoRichTextRuntime.draftText =
        initialText;

    const surfaces = [
        {
            key: 'canvas',

            shell:
            nodeElement.querySelector(
                '[data-geneo-rich-text-editor-shell]'
            ),

            toolbar:
            nodeElement.querySelector(
                '#geneoRichTextToolbar'
            ),

            editorHost:
            nodeElement.querySelector(
                '[data-geneo-rich-text-editor]'
            ),

            fallback:
            nodeElement.querySelector(
                '[data-geneo-rich-text-fallback]'
            ),

            bounds:
            nodeElement,

            editorLabel:
            node.type === 'sticky'
                ? 'Sticky note content'
                : 'Text block content'
        },

        {
            key: 'inspector',

            shell:
            inspector?.querySelector(
                '[data-geneo-inspector-rich-text-editor-shell]'
            ),

            toolbar:
            inspector?.querySelector(
                '#geneoInspectorRichTextToolbar'
            ),

            editorHost:
            inspector?.querySelector(
                '[data-geneo-inspector-rich-text-editor]'
            ),

            fallback:
            inspector?.querySelector(
                '[data-geneo-inspector-rich-text-fallback]'
            ),

            bounds:
            inspector,

            editorLabel:
            node.type === 'sticky'
                ? 'Sticky note content'
                : 'Text block content'
        }
    ].filter(surface =>
        surface.shell
        && surface.toolbar
        && surface.editorHost
        && surface.fallback
    );

    if (!surfaces.length)
    {
        return;
    }

    bindGeneographRichTextSessionGuards(
        node
    );

    const requestedSurface =
        state.geneoInlineEditSurface
          === 'inspector'
            ? 'inspector'
            : 'canvas';

    const center =
        geneoCurrentViewportCenter();

    /*
       * Plain-text fallback uses both surfaces
       * as synchronized views of the same draft.
       */
    if (
        typeof window.Quill
          !== 'function'
    )
    {
        geneoRichTextRuntime
            .fallbackActive =
                true;

        surfaces.forEach(surface =>
        {
            surface.toolbar.hidden =
                true;

            surface.editorHost.hidden =
                true;

            surface.fallback.hidden =
                false;

            surface.fallback.value =
                initialText;

            geneoRichTextRuntime
                .fallbackElements[
                    surface.key
                ] =
                    surface.fallback;

            surface.fallback.addEventListener(
                'focus',
                () =>
                {
                    state.geneoInlineEditSurface =
                        surface.key;
                }
            );

            surface.fallback.addEventListener(
                'input',
                () =>
                {
                    geneoRichTextRuntime
                        .draftText =
                            surface.fallback.value;

                    geneoRichTextRuntime
                        .draftDelta =
                            null;

                    Object.entries(
                        geneoRichTextRuntime
                            .fallbackElements
                    ).forEach(([
                        key,
                        element
                    ]) =>
                    {
                        if (
                            key !== surface.key
                  && element
                        )
                        {
                            element.value =
                                surface.fallback.value;
                        }
                    });
                }
            );
        });

        const target =
            geneoRichTextRuntime
                .fallbackElements[
                    requestedSurface
                ]
          || geneoRichTextRuntime
              .fallbackElements.canvas
          || geneoRichTextRuntime
              .fallbackElements.inspector;

        requestAnimationFrame(
            () =>
            {
                target?.focus({
                    preventScroll: true
                });

                if (
                    target
              && state
                  .geneoInlineEditSelectAll
                )
                {
                    target.select();
                }

                state
                    .geneoInlineEditSelectAll =
                        false;

                if (
                    requestedSurface
              === 'canvas'
              && center
                )
                {
                    scheduleGeneographViewportRestore(
                        center
                    );
                }
            }
        );

        return;
    }

    const synchronize =
        (
            sourceKey,
            sourceInstance
        ) =>
        {
            if (
                geneoRichTextRuntime.syncing
            )
            {
                return;
            }

            geneoRichTextRuntime.syncing =
                true;

            const delta =
                normalizeRichTextDelta(
                    sourceInstance
                        .getContents()
                );

            geneoRichTextRuntime
                .draftDelta =
                    delta;

            geneoRichTextRuntime
                .draftText =
                    plainTextFromQuill(
                        sourceInstance
                    );

            Object.entries(
                geneoRichTextRuntime
                    .instances
            ).forEach(([
                key,
                instance
            ]) =>
            {
                if (
                    key === sourceKey
              || !instance
                )
                {
                    return;
                }

                if (delta)
                {
                    instance.setContents(
                        delta,
                        'silent'
                    );
                }
                else
                {
                    instance.setText(
                        geneoRichTextRuntime
                            .draftText,
                        'silent'
                    );
                }
            });

            geneoRichTextRuntime.syncing =
                false;
        };

    surfaces.forEach(surface =>
    {
        const instance =
            createRichTextQuill({
                editorHost:
              surface.editorHost,

                toolbar:
              surface.toolbar,

                bounds:
              surface.bounds,

                placeholder:
              node.type === 'sticky'
                  ? 'Write a note…'
                  : 'Enter text…',

                toolbarLabel:
              node.type === 'sticky'
                  ? 'Sticky note formatting'
                  : 'Text formatting',

                editorLabel:
              surface.editorLabel
            });

        if (!instance)
        {
            return;
        }

        if (initialDelta)
        {
            instance.setContents(
                initialDelta,
                'silent'
            );
        }
        else
        {
            instance.setText(
                initialText,
                'silent'
            );
        }

        instance.history.clear();

        geneoRichTextRuntime
            .instances[
                surface.key
            ] =
                instance;

        const textChangeHandler =
            (
                delta,
                oldDelta,
                source
            ) =>
            {
                if (
                    source !== 'user'
              || geneoRichTextRuntime
                  .nodeId !== node.id
                )
                {
                    return;
                }

                synchronize(
                    surface.key,
                    instance
                );
            };

        geneoRichTextRuntime
            .textChangeHandlers[
                surface.key
            ] =
                textChangeHandler;

        instance.on(
            'text-change',
            textChangeHandler
        );

        instance.root.addEventListener(
            'focus',
            () =>
            {
                state.geneoInlineEditSurface =
                    surface.key;
            }
        );

        surface.toolbar.addEventListener(
            'pointerdown',
            () =>
            {
                state.geneoInlineEditSurface =
                    surface.key;
            }
        );
    });

    const targetInstance =
        geneoRichTextRuntime
            .instances[
                requestedSurface
            ]
        || geneoRichTextRuntime
            .instances.canvas
        || geneoRichTextRuntime
            .instances.inspector;

    requestAnimationFrame(
        () =>
        {
            if (!targetInstance)
            {
                return;
            }

            targetInstance.root.focus({
                preventScroll: true
            });

            const contentLength =
                Math.max(
                    0,
                    targetInstance
                        .getLength() - 1
                );

            if (
                state
                    .geneoInlineEditSelectAll
            && contentLength
            )
            {
                targetInstance.setSelection(
                    0,
                    contentLength,
                    'silent'
                );
            }
            else
            {
                targetInstance.setSelection(
                    contentLength,
                    0,
                    'silent'
                );
            }

            state
                .geneoInlineEditSelectAll =
                    false;

            /*
           * Quill's selection update occurs after
           * the board rerender. Reassert the object
           * center after that focus/selection work.
           */
            if (
                requestedSurface
            === 'canvas'
            && center
            )
            {
                scheduleGeneographViewportRestore(
                    center
                );
            }
        }
    );
}

function focusGeneographInlineEditor()
{
    const input = main.querySelector('[data-geneo-inline-input]');
    if (!input)
    {
        state.geneoInlineEditSelectAll = false;
        return;
    }
    input.focus({ preventScroll: true });
    if (state.geneoInlineEditSelectAll && typeof input.select === 'function') input.select();
    state.geneoInlineEditSelectAll = false;
}

function beginGeneographInlineEdit(
    nodeId,
    {
        selectAll = false,
        surface = 'canvas'
    } = {}
)
{
    const node =
        getGeneographNode(
            nodeId
        );

    if (
        !node
        || ![
            'text',
            'sticky',
            'panel'
        ].includes(node.type)
    )
    {
        return;
    }

    if (
        state.geneoInlineEditNodeId
        && state.geneoInlineEditNodeId
          !== nodeId
    )
    {
        commitGeneoInlineEdit(
            false
        );
    }

    selectGeneographNode(
        nodeId
    );

    state.geneoInlineEditNodeId =
        nodeId;

    state.geneoInlineEditSelectAll =
        selectAll;

    state.geneoInlineEditSurface =
        surface === 'inspector'
            ? 'inspector'
            : 'canvas';

    renderGeneographEditorPreserveScroll({
        preserveInspectorScroll:
          true
    });

    if (node.type === 'panel')
    {
        requestAnimationFrame(
            focusGeneographInlineEditor
        );
    }
}

function addGeneographObject(
    type
)
{
    cancelGeneographPencilStroke();
    if (
        !GENEO_NODE_TYPES.has(type)
    )
    {
        return;
    }

    if (
        [
            'panel',
            'sticky',
            'text',
            'shape'
        ].includes(type)
    )
    {
        activateGeneographPlacementTool(
            type
        );

        return;
    }

    const endedPlacementTool =
        [
            'panel',
            'sticky',
            'text',
            'shape'
        ].includes(state.geneoTool);

    if (endedPlacementTool)
    {
        finishGeneographPlacementTool();
        renderGeneographEditorPreserveScroll({ preserveInspectorScroll: true });
    }

    cancelGeneographConnectionDraft();

    if (type === 'person')
    {
        openAddGeneographPersonModal();
        return;
    }

    if (type === 'image')
    {
        openGeneographImagePicker();
        return;
    }

    if (type === 'place')
    {
        openGeneographPlaceModal();
    }
}

function geneoCurrentMoveTool()
{
    return ['select', 'pan'].includes(
        state.geneoTool
    )
        ? state.geneoTool
        : 'pan';
}

function finishGeneographPlacementTool()
{
    const returnTool =
        state.geneoPlacementReturnTool;

    state.geneoPlacementReturnTool =
        null;

    state.geneoTool =
        ['select', 'pan'].includes(
            returnTool
        )
            ? returnTool
            : 'pan';
}

function activateGeneographPlacementTool(
    type
)
{
    cancelGeneographPencilStroke();
    if (
        ![
            'panel',
            'sticky',
            'text',
            'shape'
        ].includes(type)
    )
    {
        return;
    }

    cancelGeneographConnectionDraft();

    const alreadyActive =
        state.geneoTool === type;

    if (alreadyActive)
    {
        if (type === 'shape')
        {
            geneoCreationToolSettings('shape').panelOpen = true;
            renderGeneographEditorPreserveScroll();
            return;
        }
        finishGeneographPlacementTool();

        renderGeneographEditorPreserveScroll();

        return;
    }

    state.geneoPlacementReturnTool =
        geneoCurrentMoveTool();

    state.geneoTool =
        type;

    if (type === 'shape') geneoCreationToolSettings('shape').panelOpen = true;

    renderGeneographEditorPreserveScroll();

    const instruction =
        type === 'panel'
            ? 'Drag on empty canvas to draw a panel.'
            : type === 'shape'
                ? `Drag on empty canvas to draw a ${geneoShapeLabel(geneoCreationToolSettings('shape').shapeKind).toLowerCase()}, or click to use the default size.`
                : type === 'sticky'
                    ? 'Click empty canvas or a panel to place a sticky note.'
                    : 'Click empty canvas or a panel to place a text block.';

    showToast(
        instruction
    );
}

function geneoPanelDraftRect(start, current)
{
    const left = Math.min(start.x, current.x);
    const top = Math.min(start.y, current.y);
    const right = Math.max(start.x, current.x);
    const bottom = Math.max(start.y, current.y);

    return {
        x: left,
        y: top,
        width: right - left,
        height: bottom - top
    };
}

function updateGeneographPanelDraftDom(start, current)
{
    const draft = main.querySelector(
        '[data-geneo-panel-draft]'
    );

    if (!draft) return;

    const bounds =
        geneoCanvasRuntime.bounds
        || {
            left: 0,
            top: 0
        };

    const rect = geneoPanelDraftRect(
        start,
        current
    );

    draft.hidden = false;
    draft.style.left = `${rect.x - bounds.left}px`;
    draft.style.top = `${rect.y - bounds.top}px`;
    draft.style.width = `${rect.width}px`;
    draft.style.height = `${rect.height}px`;

    const shapePreview = state.geneoTool === 'shape';
    draft.classList.toggle('shape-preview', shapePreview);
    if (shapePreview)
    {
        const settings = geneoCreationToolSettings('shape');
        draft.style.setProperty('--geneo-node-bg', geneoPaintCssColor(settings.appearance.fill));
        draft.style.setProperty('--geneo-node-stroke', geneoPaintCssColor(settings.appearance.stroke));
        draft.style.setProperty('--geneo-node-stroke-width', String(settings.appearance.strokeWidth));
        draft.classList.toggle('stroke-dashed', settings.appearance.strokePattern === 'dashed');
        draft.querySelector('.geneo-shape-svg')?.remove();
        draft.insertAdjacentHTML('afterbegin', renderGeneographShapeContent({
            shapeKind: settings.shapeKind, width: Math.max(1, rect.width), height: Math.max(1, rect.height),
            appearance: settings.appearance
        }));
    }

    const size = draft.querySelector(
        '[data-geneo-panel-draft-size]'
    );

    if (size)
    {
        size.textContent =
            `${Math.round(rect.width)} × ${Math.round(rect.height)}`;
    }
}

function hideGeneographPanelDraftDom()
{
    const draft = main.querySelector(
        '[data-geneo-panel-draft]'
    );

    if (draft)
    {
        draft.hidden = true;
    }
}

function geneoPointToSegmentDistance(point, start, end)
{
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    if (!dx && !dy) return Math.hypot(point.x - start.x, point.y - start.y);
    const ratio = Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / (dx * dx + dy * dy)));
    return Math.hypot(point.x - (start.x + ratio * dx), point.y - (start.y + ratio * dy));
}

function simplifyGeneographDrawingPoints(points, tolerance)
{
    if (!Array.isArray(points) || points.length <= 2) return points ? [...points] : [];
    let farthestIndex = 0;
    let farthestDistance = 0;
    for (let index = 1; index < points.length - 1; index += 1)
    {
        const distance = geneoPointToSegmentDistance(points[index], points[0], points.at(-1));
        if (distance > farthestDistance)
        {
            farthestDistance = distance;
            farthestIndex = index;
        }
    }
    if (farthestDistance <= tolerance) return [points[0], points.at(-1)];
    const first = simplifyGeneographDrawingPoints(points.slice(0, farthestIndex + 1), tolerance);
    const second = simplifyGeneographDrawingPoints(points.slice(farthestIndex), tolerance);
    return [...first.slice(0, -1), ...second];
}

function geneoSmoothAbsolutePath(points)
{
    if (!Array.isArray(points) || points.length < 2) return '';
    const number = value => Number(value.toFixed(3));
    let path = `M ${number(points[0].x)} ${number(points[0].y)}`;
    for (let index = 1; index < points.length - 1; index += 1)
    {
        const point = points[index];
        const next = points[index + 1];
        path += ` Q ${number(point.x)} ${number(point.y)} ${number((point.x + next.x) / 2)} ${number((point.y + next.y) / 2)}`;
    }
    const last = points.at(-1);
    return `${path} L ${number(last.x)} ${number(last.y)}`;
}

function updateGeneographPencilPreview(points = [])
{
    const preview = main.querySelector('[data-geneo-pencil-preview]');
    if (!preview) return;
    const path = geneoSmoothAbsolutePath(points);
    preview.hidden = !path;
    preview.setAttribute('d', path);
}

function cancelGeneographPencilStroke()
{
    if (geneoPointerState?.kind !== 'pencil') return false;
    geneoDrawPanPending = false;
    const activeStroke = geneoPointerState;
    geneoPointerState = null;
    if (activeStroke.wrap?.hasPointerCapture?.(activeStroke.pointerId))
    {
        activeStroke.wrap.releasePointerCapture(activeStroke.pointerId);
    }
    updateGeneographPencilPreview();
    return true;
}

function createGeneographDrawingFromPoints(sourcePoints, beforeSnapshot = null)
{
    const diagram = selectedGeneographDiagram();
    const defaults = geneoNodeDefaults('drawing');
    const zoom = Math.max(.25, state.geneoZoom / 100);
    const points = simplifyGeneographDrawingPoints(sourcePoints, 1.5 / zoom);
    if (!diagram || points.length < 2) return null;
    const length = points.slice(1).reduce((total, point, index) => total + Math.hypot(point.x - points[index].x, point.y - points[index].y), 0);
    if (length < 4 / zoom) return null;
    const minX = Math.min(...points.map(point => point.x));
    const maxX = Math.max(...points.map(point => point.x));
    const minY = Math.min(...points.map(point => point.y));
    const maxY = Math.max(...points.map(point => point.y));
    const width = Math.max(defaults.minWidth, maxX - minX);
    const height = Math.max(defaults.minHeight, maxY - minY);
    const x = (minX + maxX) / 2 - width / 2;
    const y = (minY + maxY) / 2 - height / 2;
    const drawing = {
        id: createRuntimeId('geneo-node'),
        type: 'drawing',
        points: points.map(point => ({
            x: geneoNumber((point.x - x) / width, 0, 0, 1),
            y: geneoNumber((point.y - y) / height, 0, 0, 1)
        })),
        x,
        y,
        width,
        height,
        parentPanelId: null,
        order: Math.max(0, ...diagram.nodes.map(item => item.order || 0)) + 1,
        visible: true,
        locked: false,
        appearance: structuredClone(geneoCreationToolSettings('drawing').appearance)
    };
    if (beforeSnapshot) geneoPushHistorySnapshot(beforeSnapshot);
    else geneoPushHistory();
    diagram.nodes.push(drawing);
    drawing.parentPanelId = geneoContainingPanelForNode(drawing)?.id || null;
    selectGeneographNode(drawing.id);
    touchGeneographBoard();
    return drawing;
}

function createGeneographPanelFromRect(rect)
{
    const diagram = selectedGeneographDiagram();
    const defaults = geneoNodeDefaults('panel');

    if (
        !diagram
        || rect.width < defaults.minWidth
        || rect.height < defaults.minHeight
    )
    {
        return null;
    }

    geneoPushHistory();

    const panel = {
        id: createRuntimeId('geneo-node'),
        type: 'panel',
        title: 'New panel',
        description: '',
        x: snapGeneographCoordinate(rect.x),
        y: snapGeneographCoordinate(rect.y),
        width: rect.width,
        height: rect.height,
        parentPanelId: null,
        order:
          Math.max(
              0,
              ...diagram.nodes.map(item => item.order || 0)
          ) + 1,
        visible: true,
        locked: false,
        appearance: {
            ...defaults.appearance
        }
    };

    diagram.nodes.push(panel);

    reconcileGeneographPanelMembership(panel.id);
    selectGeneographNode(panel.id);
    touchGeneographBoard();

    return panel;
}

function createGeneographShapeFromRect(rect, { useDefaultSize = false } = {})
{
    const diagram = selectedGeneographDiagram();
    const defaults = geneoNodeDefaults('shape');
    if (!diagram || !rect) return null;
    const source = useDefaultSize
        ? {
            x: rect.x - defaults.width / 2,
            y: rect.y - defaults.height / 2,
            width: defaults.width,
            height: defaults.height
        }
        : rect;
    if (source.width < defaults.minWidth || source.height < defaults.minHeight) return null;
    const position = snapGeneographPoint({ x: source.x, y: source.y });
    const shape = {
        id: createRuntimeId('geneo-node'),
        type: 'shape',
        shapeKind: normalizeGeneographShapeKind(geneoCreationToolSettings('shape').shapeKind),
        x: position.x,
        y: position.y,
        width: Math.max(defaults.minWidth, snapGeneographCoordinate(source.width)),
        height: Math.max(defaults.minHeight, snapGeneographCoordinate(source.height)),
        parentPanelId: null,
        order: Math.max(0, ...diagram.nodes.map(item => item.order || 0)) + 1,
        visible: true,
        locked: false,
        appearance: structuredClone(geneoCreationToolSettings('shape').appearance)
    };
    geneoPushHistory();
    diagram.nodes.push(shape);
    shape.parentPanelId = geneoContainingPanelForNode(shape)?.id || null;
    selectGeneographNode(shape.id);
    touchGeneographBoard();
    return shape;
}

function createGeneographPlaceNode(placeRef)
{
    const diagram = selectedGeneographDiagram();
    const defaults = geneoNodeDefaults('place');
    if (!diagram || !placeRef) return null;
    const position = snapGeneographPoint(nextGeneoObjectPosition(defaults.width, defaults.height));
    const node = {
        id: createRuntimeId('geneo-node'),
        type: 'place',
        placeRef: structuredClone(placeRef),
        placeSizeMode: 'auto',
        x: position.x,
        y: position.y,
        width: defaults.width,
        height: defaults.height,
        parentPanelId: null,
        order: Math.max(0, ...diagram.nodes.map(item => item.order || 0)) + 1,
        visible: true,
        locked: false,
        appearance: structuredClone(defaults.appearance)
    };
    diagram.nodes.push(node);
    node.parentPanelId = geneoContainingPanelForNode(node)?.id || null;
    selectGeneographNode(node.id);
    return node;
}

function cleanGeneographPlacePickerName(
    value
)
{
    return String(value || '')
        .replace(
            /[\r\n\u0000-\u001F\u007F]/g,
            ' '
        )
        .replace(
            /\s+/g,
            ' '
        )
        .trim()
        .slice(
            0,
            160
        );
}

function geneographPlacePickerMatchScore(
    place,
    query
)
{
    const normalizedQuery =
        normalizePlaceLookupText(query);

    if (!normalizedQuery)
    {
        return 1;
    }

    const candidates = [
        place.name,
        placePrimaryName(place),
        placeSecondaryName(place),
        placeCountry(place),
        ...placeAlternativeNames(place)
    ];

    for (const candidate of candidates)
    {
        if (!candidate) continue;

        const normalizedCandidate =
            normalizePlaceLookupText(
                candidate
            );

        if (
            normalizedCandidate.startsWith(
                normalizedQuery
            )
        )
        {
            return 3;
        }

        if (
            normalizedCandidate.includes(
                normalizedQuery
            )
        )
        {
            return 2;
        }
    }

    return 0;
}

function geneographPlacePickerViewModel(
    projectId,
    pickerState
)
{
    const query =
        cleanGeneographPlacePickerName(
            pickerState.query
        );

    const allPlaces =
        projectPlaces(projectId)
            .filter(place =>
                place &&
            !place.deleted
            );

    const exactPlace =
        query
            ? allPlaces.find(place =>
                normalizePlaceLookupText(
                    placeDisplayText(place)
                ) ===
              normalizePlaceLookupText(
                  query
              )
            ) || null
            : null;

    const matches =
        allPlaces
            .map(place => ({
                place,

                score:
              geneographPlacePickerMatchScore(
                  place,
                  query
              ),

                peopleCount:
              getPeopleForPlace(
                  place.id,
                  {
                      projectId
                  }
              ).length
            }))
            .filter(item =>
                item.score > 0
            )
            .sort(
                (left, right) =>
                    right.score - left.score
              || right.peopleCount
                - left.peopleCount
              || placeDisplayText(
                  left.place
              ).localeCompare(
                  placeDisplayText(
                      right.place
                  )
              )
            )
            .map(item =>
                item.place
            );

    return {
        query,
        allPlaces,
        matches,
        exactPlace,

        boardOnlyCandidate:
          query && !exactPlace
              ? query
              : ''
    };
}

function renderGeneographPlacePickerResults(
    model,
    pickerState
)
{
    return model.matches
        .map(place =>
        {
            const selected =
                pickerState.choice?.type
              === 'project'
            && pickerState.choice
                .placeId === place.id;

            const primary =
                placePrimaryName(place)
            || placeDisplayText(place)
            || 'Unnamed place';

            const context =
                placeSecondaryName(place)
            || t('Project place');

            return `
            <button
              class="
                geneo-place-picker-option
                ${selected ? 'selected' : ''}
              "
              type="button"
              data-geneo-place-picker-choice="project"
              data-geneo-place-picker-id="${escapeHtml(
                    place.id
                )}"
              aria-pressed="${
                    selected
                        ? 'true'
                        : 'false'
                }"
              aria-label="${escapeHtml(
                    `${t('Select')} ${primary}`
                )}"
              title="${escapeHtml(placeDisplayText(place))}">

              <span
                class="geneo-place-picker-option-copy">
                <strong>
                  ${escapeHtml(primary)}
                </strong>

                <span>
                  ${escapeHtml(context)}
                </span>
              </span>

              <span
                class="geneo-place-picker-check"
                data-geneo-place-picker-check
                aria-hidden="true"
                ${selected ? '' : 'hidden'}>
                ${icon.check}
              </span>
            </button>
          `;
        })
        .join('');
}

function renderGeneographBoardOnlyPlaceChoice(
    model,
    pickerState
)
{
    if (!model.boardOnlyCandidate)
    {
        return '';
    }

    const selected =
        pickerState.choice?.type
          === 'board'
        && normalizePlaceLookupText(
            pickerState.choice.name
        ) ===
          normalizePlaceLookupText(
              model.boardOnlyCandidate
          );

    return `
        <button
          class="
            geneo-place-board-choice
            ${selected ? 'selected' : ''}
          "
          type="button"
          data-geneo-place-picker-choice="board"
          data-geneo-board-place-name="${escapeHtml(
                model.boardOnlyCandidate
            )}"
          title="${escapeHtml(model.boardOnlyCandidate)}"
          aria-pressed="${
                selected
                    ? 'true'
                    : 'false'
            }">

          <span
            class="geneo-place-board-choice-copy">
            <strong>${escapeHtml(t('Use on this board only'))}</strong>

            <span class="geneo-place-board-choice-name">
              ${escapeHtml(model.boardOnlyCandidate)}
            </span>

            <span
              class="geneo-place-board-choice-meta">
              ${escapeHtml(t('Not added to Places'))}
            </span>
          </span>

          <span
            class="geneo-place-picker-check"
            data-geneo-place-picker-check
            aria-hidden="true"
            ${selected ? '' : 'hidden'}>
            ${icon.check}
          </span>
        </button>
      `;
}

function geneographPlacePickerPrimaryLabel(
    pickerState,
    editing
)
{
    if (
        pickerState.choice?.type
          === 'board'
    )
    {
        return editing
            ? 'Save board-only place'
            : 'Add board-only place';
    }

    return editing
        ? 'Save changes'
        : 'Add place';
}

function renderGeneographPlacePickerModal({
    editing,
    pickerState,
    model
})
{
    return `
        <div
          class="modal geneo-place-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="geneoPlaceModalTitle">

          <form
            class="geneo-place-picker-form"
            data-geneo-place-form
            novalidate>

            <div class="modal-header">
              <div>
                <h2 id="geneoPlaceModalTitle">
                  ${escapeHtml(t(editing ? 'Change place' : 'Add place'))}
                </h2>

                <p>
                  ${escapeHtml(t('Search project places or the map.'))}
                </p>
              </div>

              <button
                class="close-button"
                type="button"
                data-close
                aria-label="${escapeHtml(t('Close'))}">
                ${icon.close}
              </button>
            </div>

            <div
              class="
                modal-body
                geneo-place-picker-body
              ">

              <div
                class="
                  field
                  geneo-place-picker-search
                ">
                <label for="geneoPlacePickerSearch">
                  ${escapeHtml(t('Find a place'))}
                </label>

                <input
                  id="geneoPlacePickerSearch"
                  type="search"
                  value="${escapeHtml(
                        pickerState.query
                    )}"
                  placeholder="${escapeHtml(t('Search project places or the map'))}"
                  autocomplete="off"
                  aria-controls="geneoPlacePickerOptions"
                  data-geneo-place-picker-search
                  autofocus>
              </div>

              <div class="geneo-place-picker-options" id="geneoPlacePickerOptions" data-geneo-place-picker-options>
              <section
                class="geneo-place-picker-results-section"
                aria-labelledby="geneoPlacePickerResultsTitle"
                data-geneo-place-project-group
                ${model.matches.length ? '' : 'hidden'}>

                <div
                  class="geneo-place-picker-results-heading">
                  <h3 id="geneoPlacePickerResultsTitle">
                    ${escapeHtml(t('Project places'))}
                  </h3>

                </div>

                <div
                  class="geneo-place-picker-results"
                  data-geneo-place-picker-results
                  aria-label="${escapeHtml(t('Project place results'))}">
                  ${renderGeneographPlacePickerResults(
                        model,
                        pickerState
                    )}
                </div>
              </section>

              <section class="geneo-place-picker-results-section" aria-labelledby="geneoPlaceMapResultsTitle" data-geneo-place-map-group hidden>
                <div class="geneo-place-picker-results-heading">
                  <h3 id="geneoPlaceMapResultsTitle">${escapeHtml(t('Map results'))}</h3>
                  <span>${escapeHtml(t('Choosing a map result adds it to Places.'))}</span>
                </div>
                <div class="geneo-place-picker-results" data-geneo-place-map-results></div>
              </section>

              <div class="geneo-place-picker-status" data-geneo-place-picker-status role="status" aria-live="polite"></div>

              <div class="geneo-place-board-choice-host" data-geneo-place-board-choice-host ${model.boardOnlyCandidate ? '' : 'hidden'}>
                ${renderGeneographBoardOnlyPlaceChoice(model, pickerState)}
              </div>
              </div>

              <span
                class="
                  field-error
                  geneo-place-picker-error
                "
                id="geneoPlacePickerError"
                data-geneo-place-error
                role="alert"
                aria-live="polite">
              </span>
            </div>

            <div class="modal-footer">
              <button
                class="button secondary"
                type="button"
                data-close>
                ${escapeHtml(t('Cancel'))}
              </button>

              <button
                class="button primary"
                type="submit"
                data-geneo-place-picker-submit
                ${
                    pickerState.choice
                        ? ''
                        : 'disabled'
                }>
                ${escapeHtml(t(
                    geneographPlacePickerPrimaryLabel(
                        pickerState,
                        editing
                    )
                ))}
              </button>
            </div>
          </form>
        </div>
      `;
}

function openGeneographPlaceModal(
    nodeId = ''
)
{
    const board =
        selectedGeneographBoard();

    const node =
        nodeId
            ? getGeneographNode(
                nodeId
            )
            : null;

    if (
        !board
        || (
            nodeId
          && node?.type !== 'place'
        )
    )
    {
        return;
    }

    const resolved =
        node
            ? resolveGeneographPlace(
                node,
                board
            )
            : null;

    const editing =
        Boolean(node);

    const initialBoardName =
        resolved && !resolved.linked
            ? cleanGeneographPlacePickerName(
                resolved.name
            )
            : '';

    const pickerState = {
        query:
          initialBoardName,

        choice:
          resolved?.linked
              ? {
                  type: 'project',
                  placeId:
                  resolved.place.id
              }
              : null
    };

    if (
        initialBoardName
        && !geneographPlacePickerViewModel(
            board.projectId,
            pickerState
        ).exactPlace
    )
    {
        pickerState.choice = {
            type: 'board',
            name: initialBoardName
        };
    }

    const initialModel =
        geneographPlacePickerViewModel(
            board.projectId,
            pickerState
        );

    openModal(
        renderGeneographPlacePickerModal({
            editing,
            pickerState,
            model: initialModel
        })
    );

    const form =
        modalBackdrop.querySelector(
            '[data-geneo-place-form]'
        );

    const searchInput =
        form?.querySelector(
            '[data-geneo-place-picker-search]'
        );

    const resultsHost =
        form?.querySelector(
            '[data-geneo-place-picker-results]'
        );

    const boardChoiceHost =
        form?.querySelector(
            '[data-geneo-place-board-choice-host]'
        );

    const mapHost = form?.querySelector('[data-geneo-place-map-results]');
    const projectGroup = form?.querySelector('[data-geneo-place-project-group]');
    const mapGroup = form?.querySelector('[data-geneo-place-map-group]');
    const statusHost = form?.querySelector('[data-geneo-place-picker-status]');
    const optionsHost = form?.querySelector('[data-geneo-place-picker-options]');
    let mapResults = [];
    let mapState = 'idle';
    let mapTimer = null;
    let mapController = null;

    const primaryButton =
        form?.querySelector(
            '[data-geneo-place-picker-submit]'
        );

    const errorElement =
        form?.querySelector(
            '[data-geneo-place-error]'
        );

    if (
        !form
        || !searchInput
        || !resultsHost
        || !boardChoiceHost
        || !projectGroup
        || !mapGroup
        || !statusHost
        || !optionsHost
        || !primaryButton
    )
    {
        return;
    }

    const clearError = () =>
    {
        if (errorElement) errorElement.textContent = '';

        searchInput.removeAttribute(
            'aria-invalid'
        );
        searchInput.removeAttribute('aria-describedby');
    };

    const choiceIsSelected = (
        button
    ) =>
    {
        const type =
            button.dataset
                .geneoPlacePickerChoice;

        if (type === 'project')
        {
            return (
                pickerState.choice?.type
              === 'project'
            && pickerState.choice
                .placeId ===
                button.dataset
                    .geneoPlacePickerId
            );
        }

        if (type === 'board')
        {
            return (
                pickerState.choice?.type
              === 'board'
            && normalizePlaceLookupText(
                pickerState.choice.name
            ) ===
              normalizePlaceLookupText(
                  button.dataset
                      .geneoBoardPlaceName
              )
            );
        }

        if (type === 'map')
        {
            return pickerState.choice?.type === 'map'
                && pickerState.choice.name === mapResults[Number(button.dataset.geneoPlaceMapIndex)]?.name;
        }

        return false;
    };

    const updateChoiceUi = () =>
    {
        form
            .querySelectorAll(
                '[data-geneo-place-picker-choice]'
            )
            .forEach(button =>
            {
                const selected =
                    choiceIsSelected(
                        button
                    );

                button.classList.toggle(
                    'selected',
                    selected
                );

                button.setAttribute(
                    'aria-pressed',
                    selected
                        ? 'true'
                        : 'false'
                );

                const check =
                    button.querySelector(
                        '[data-geneo-place-picker-check]'
                    );

                if (check)
                {
                    check.hidden =
                        !selected;
                }
            });

        primaryButton.disabled =
            !pickerState.choice;

        primaryButton.textContent =
            t(geneographPlacePickerPrimaryLabel(
                pickerState,
                editing
            ));
    };

    const renderStatus = model =>
    {
        let message = '';
        if (!model.matches.length && mapGroup.hidden)
        {
            if (!model.query)
                message = 'No project places yet. Search for a place to add it to this board.';
            else if (mapState === 'empty')
                message = 'No matching places found.';
            else if (mapState === 'idle')
                message = t('Type at least {count} characters to search the map.')
                    .replace('{count}', String(PLACE_EDITOR_GEOCODER_MIN_LENGTH));
        }
        statusHost.textContent = message ? t(message) : '';
        statusHost.hidden = !message;
    };

    const refreshResults = () =>
    {
        const model =
            geneographPlacePickerViewModel(
                board.projectId,
                pickerState
            );

        resultsHost.innerHTML =
            renderGeneographPlacePickerResults(
                model,
                pickerState
            );
        projectGroup.hidden = !model.matches.length;

        boardChoiceHost.innerHTML =
            renderGeneographBoardOnlyPlaceChoice(
                model,
                pickerState
            );
        boardChoiceHost.hidden = !model.boardOnlyCandidate;

        renderStatus(model);
        updateChoiceUi();
    };

    const renderMapResults = () =>
    {
        if (!mapHost) return;
        mapGroup.hidden = !(['loading', 'unavailable', 'ready'].includes(mapState) &&
            (mapState !== 'ready' || mapResults.length));
        mapHost.innerHTML = mapState === 'loading'
            ? `<div class="place-combobox-status">${escapeHtml(t('Searching map results...'))}</div>`
            : mapState === 'unavailable'
                ? `<div class="place-combobox-status">${escapeHtml(t('Map search is unavailable. You can retry or use the entered text.'))} <button type="button" data-geneo-place-map-retry>${escapeHtml(t('Retry'))}</button></div>`
                : mapState === 'empty'
                    ? `<div class="place-combobox-status">${escapeHtml(t('No matching map results. You can still use the entered text.'))}</div>`
                    : mapResults.map((result, index) => `<button class="geneo-place-picker-option" type="button" data-geneo-place-picker-choice="map" data-geneo-place-map-index="${index}" aria-pressed="false" aria-label="${escapeHtml(`${t('Select')} ${result.name}`)}" title="${escapeHtml(result.name)}"><span class="geneo-place-picker-option-copy"><strong>${escapeHtml(result.primary)}</strong><span>${escapeHtml(result.context || result.name)}</span></span><span class="geneo-place-picker-check" data-geneo-place-picker-check aria-hidden="true" hidden>${icon.check}</span></button>`).join('');
        renderStatus(geneographPlacePickerViewModel(board.projectId, pickerState));
        updateChoiceUi();
    };

    const scheduleMapSearch = (immediate = false) =>
    {
        clearTimeout(mapTimer);
        mapController?.abort();
        const query = searchInput.value.trim();
        mapResults = [];
        if (query && findExactPlaceMatch(query, board.projectId))
        {
            mapState = 'idle';
            renderMapResults();
            return;
        }
        if (query.length < PLACE_EDITOR_GEOCODER_MIN_LENGTH)
        {
            mapState = 'idle';
            renderMapResults();
            return;
        }
        mapState = 'loading';
        renderMapResults();
        mapTimer = setTimeout(async () =>
        {
            const controller = new AbortController();
            mapController = controller;
            try
            {
                const results = await searchSharedPlaceMapResults(query, controller.signal);
                if (controller.signal.aborted || !form.isConnected || searchInput.value.trim() !== query) return;
                mapResults = results;
                mapState = results.length ? 'ready' : 'empty';
            }
            catch (error)
            {
                if (controller.signal.aborted || !form.isConnected || searchInput.value.trim() !== query) return;
                mapState = 'unavailable';
            }
            renderMapResults();
        }, immediate ? 0 : PLACE_EDITOR_GEOCODER_DEBOUNCE_MS);
    };

    searchInput.addEventListener(
        'input',
        () =>
        {
            pickerState.query =
                searchInput.value;

            /*
          * Typing changes the candidate but does not implicitly
          * select either a Project place or a board-only place.
          */
            pickerState.choice =
                null;

            clearError();
            refreshResults();
            scheduleMapSearch();
        }
    );

    searchInput.addEventListener('keydown', event =>
    {
        if (event.key !== 'ArrowDown') return;
        const first = [...optionsHost.querySelectorAll('[data-geneo-place-picker-choice]')]
            .find(button => button.getClientRects().length);
        if (!first) return;
        event.preventDefault();
        first.focus();
    });

    renderMapResults();
    if (searchInput.value.trim()) scheduleMapSearch();
    requestAnimationFrame(() =>
    {
        optionsHost.querySelector('[data-geneo-place-picker-choice].selected')
            ?.scrollIntoView({ block: 'nearest' });
    });

    form.addEventListener('click', event =>
    {
        if (event.target.closest('[data-geneo-place-map-retry]')) scheduleMapSearch(true);
    });

    form.addEventListener(
        'click',
        event =>
        {
            const choiceButton =
                event.target.closest(
                    '[data-geneo-place-picker-choice]'
                );

            if (
                !choiceButton
            || !form.contains(
                choiceButton
            )
            )
            {
                return;
            }

            const choiceType =
                choiceButton.dataset
                    .geneoPlacePickerChoice;

            if (
                choiceType === 'project'
            )
            {
                const place =
                    getPlace(
                        choiceButton.dataset
                            .geneoPlacePickerId
                    );

                if (
                    !place
              || place.deleted
              || place.projectId
                !== board.projectId
                )
                {
                    pickerState.choice = null;
                    refreshResults();
                    scheduleMapSearch();
                    errorElement.textContent = t('This place is no longer available. Choose another place.');
                    searchInput.setAttribute('aria-describedby', 'geneoPlacePickerError');
                    return;
                }

                pickerState.choice = {
                    type: 'project',
                    placeId: place.id
                };
            }
            else if (
                choiceType === 'board'
            )
            {
                const name =
                    cleanGeneographPlacePickerName(
                        choiceButton.dataset
                            .geneoBoardPlaceName
                    );

                if (!name) return;

                pickerState.choice = {
                    type: 'board',
                    name
                };
            }
            else if (choiceType === 'map')
            {
                const result = mapResults[Number(choiceButton.dataset.geneoPlaceMapIndex)];
                if (!result) return;
                pickerState.choice = { type: 'map', name: result.name, coordinates: result.coordinates };
            }
            else
            {
                return;
            }

            clearError();

            /*
          * Do not rerender the result buttons after selection.
          * Updating their state in place preserves keyboard focus.
          */
            updateChoiceUi();
        }
    );

    form.addEventListener(
        'submit',
        event =>
        {
            event.preventDefault();

            let nextRef = null;
            let createdPlace = null;
            let staleProjectPlace = false;

            if (
                pickerState.choice?.type
              === 'project'
            )
            {
                const projectPlace =
                    getPlace(
                        pickerState.choice
                            .placeId
                    );

                const validProjectPlace =
                    projectPlace
              && !projectPlace.deleted
              && projectPlace.projectId
                === board.projectId;

                if (validProjectPlace)
                {
                    nextRef = {
                        scope: 'project',
                        id: projectPlace.id,
                        fallbackName:
                  String(
                      placePrimaryName(
                          projectPlace
                      )
                    || projectPlace.name
                    || ''
                  )
                      .trim()
                      .slice(
                          0,
                          160
                      )
                    };
                }
                else staleProjectPlace = true;
            }
            else if (
                pickerState.choice?.type
              === 'board'
            )
            {
                const boardOnlyName =
                    cleanGeneographPlacePickerName(
                        pickerState.choice.name
                    );

                if (boardOnlyName)
                {
                    nextRef = {
                        scope: 'board',
                        name: boardOnlyName
                    };
                }
            }

            else if (pickerState.choice?.type === 'map')
            {
                const resolvedPlace = resolvePlaceInputValue(
                    pickerState.choice.name,
                    '',
                    '',
                    { projectId: board.projectId, coordinates: pickerState.choice.coordinates }
                );
                const place = getPlace(resolvedPlace.placeId);
                if (resolvedPlace.created) createdPlace = place;
                if (place && place.projectId === board.projectId)
                {
                    nextRef = { scope: 'project', id: place.id, fallbackName: placePrimaryName(place) || place.name };
                }
            }

            if (!nextRef)
            {
                if (createdPlace)
                {
                    const index = sampleData.places.indexOf(createdPlace);
                    if (index >= 0) sampleData.places.splice(index, 1);
                }
                if (staleProjectPlace)
                {
                    pickerState.choice = null;
                    refreshResults();
                    scheduleMapSearch();
                }
                if (errorElement) errorElement.textContent = t(staleProjectPlace
                    ? 'This place is no longer available. Choose another place.'
                    : 'Choose a place from the results or use the entered name on this board.');

                searchInput.setAttribute(
                    'aria-invalid',
                    'true'
                );
                searchInput.setAttribute('aria-describedby', 'geneoPlacePickerError');

                searchInput.focus({
                    preventScroll: true
                });

                return;
            }

            geneoPushHistory();

            const target =
                node
            || createGeneographPlaceNode(
                nextRef
            );

            if (!target)
            {
                if (createdPlace)
                {
                    const index = sampleData.places.indexOf(createdPlace);
                    if (index >= 0) sampleData.places.splice(index, 1);
                }
                geneoHistoryRuntime
                    .undo
                    .pop();

                return;
            }

            if (node)
            {
                target.placeRef =
                    nextRef;
            }

            touchGeneographBoard();
            closeModal();

            renderGeneographEditorPreserveScroll({
                preserveInspectorScroll: editing
            });

            requestAnimationFrame(() =>
            {
                main
                    .querySelector(
                        `[data-geneo-node="${CSS.escape(target.id)}"]`
                    )
                    ?.focus({ preventScroll: true });
            });

            showToast(
                editing
                    ? 'Place object updated.'
                    : 'Place added to board.'
            );
        }
    );

    requestAnimationFrame(
        () =>
        {
            searchInput.focus({
                preventScroll: true
            });

            const cursorPosition =
                searchInput.value.length;

            searchInput.setSelectionRange(
                cursorPosition,
                cursorPosition
            );
        }
    );
}

function makeGeneographPlaceBoardOnly(nodeId)
{
    const node = getGeneographNode(nodeId);
    if (node?.type !== 'place') return;
    const name = resolveGeneographPlace(node).name;
    geneoPushHistory();
    node.placeRef = { scope: 'board', name };
    touchGeneographBoard();
    renderGeneographEditorPreserveScroll({ preserveInspectorScroll: true });
    showToast('Place is now board-only.');
}

function openGeneographPlaceInPlaces(nodeId)
{
    const node = getGeneographNode(nodeId);
    const resolved = node?.type === 'place' ? resolveGeneographPlace(node) : null;
    if (!resolved?.linked) return;
    captureGeneographViewport();
    state.activeModule = 'Places';
    state.placesView = 'list';
    state.selectedPlaceId = resolved.place.id;
    render();
}

function createGeneographRichTextNodeAtPoint(
    type,
    point
)
{
    const diagram =
        selectedGeneographDiagram();

    if (
        !diagram
        || !point
        || ![
            'sticky',
            'text'
        ].includes(type)
    )
    {
        return null;
    }

    const defaults =
        geneoNodeDefaults(type);

    /*
       * The click represents the visual center
       * of the new object.
       */
    const position =
        snapGeneographPoint({
            x:
            point.x
            - defaults.width / 2,

            y:
            point.y
            - defaults.height / 2
        });

    const text =
        type === 'text'
            ? 'New text'
            : '';

    const textDelta =
        type === 'text'
            ? {
                ops: [
                    {
                        insert:
                    'New text'
                    },

                    {
                        insert: '\n',

                        attributes: {
                            header: 2
                        }
                    }
                ]
            }
            : null;

    geneoPushHistory();

    const node = {
        id:
          createRuntimeId(
              'geneo-node'
          ),

        type,

        text,
        textDelta,

        textFormat:
          textDelta
              ? 'quill-delta-v1'
              : '',

        x: position.x,
        y: position.y,

        width:
          defaults.width,

        height:
          defaults.height,

        parentPanelId: null,

        order:
          Math.max(
              0,
              ...diagram.nodes.map(
                  item =>
                      item.order || 0
              )
          ) + 1,

        visible: true,
        locked: false,

        appearance:
          structuredClone(
              defaults.appearance
          )
    };

    diagram.nodes.push(node);

    node.parentPanelId =
        geneoContainingPanelForNode(
            node
        )?.id || null;

    selectGeneographNode(
        node.id
    );

    touchGeneographBoard();

    /*
       * Placement is one-shot. Return to the
       * movement mode that was active before
       * Text/Sticky placement was armed.
       */
    finishGeneographPlacementTool();

    beginGeneographInlineEdit(
        node.id,
        {
            selectAll:
            type === 'text',

            surface:
            'canvas'
        }
    );

    return node;
}

function clearGeneographConnectionClick()
{
    geneoCanvasRuntime.connectionClick = null;
}

function handleGeneographConnectionClick(event)
{
    event.stopPropagation();
    const path = event.currentTarget;
    const connectionId = path?.dataset.geneoConnection || '';
    const modified = event.shiftKey || event.ctrlKey || event.metaKey;
    if (!connectionId || geneoCanvasRuntime.suppressNodeClick)
    {
        clearGeneographConnectionClick();
        return;
    }
    const segmentValue = path.matches('.geneo-segment-hit') ? Number(path.dataset.geneoSegment) : null;
    const segmentIndex = Number.isInteger(segmentValue) ? segmentValue : null;
    const previous = geneoCanvasRuntime.connectionClick;
    const now = performance.now();
    const distance = previous ? Math.hypot(event.clientX - previous.clientX, event.clientY - previous.clientY) : Infinity;
    const isDoubleClick = !modified
        && previous?.connectionId === connectionId
        && now - previous.at <= 450
        && distance <= 7;
    if (isDoubleClick)
    {
        event.preventDefault();
        const requestedSegment = Number.isInteger(segmentIndex) ? segmentIndex : previous.segmentIndex;
        const point = geneoPointerToCanvas(event);
        clearGeneographConnectionClick();
        insertGeneographWaypoint(connectionId, point, Number.isInteger(requestedSegment) ? requestedSegment : null);
        return;
    }
    geneoCanvasRuntime.connectionClick = modified ? null : {
        connectionId,
        segmentIndex,
        clientX: event.clientX,
        clientY: event.clientY,
        at: now
    };
    selectGeneographConnection(connectionId, null, { toggle: modified });
    renderGeneographEditorPreserveScroll();
}

function handleGeneographFamilyBusSelection(event)
{
    if (event.type === 'keydown' && ['ArrowUp', 'ArrowDown'].includes(event.key)
        && event.currentTarget.hasAttribute('data-geneo-family-bus-rail'))
    {
        event.preventDefault();
        event.stopPropagation();
        const ids = (event.currentTarget.dataset.geneoFamilyBus || '').split(',');
        const bus = geneoFamilyChildBusGroups().buses.find(item =>
            item.connectionIds.join(',') === ids.join(','));
        if (!bus) return;
        const step = selectedGeneographDiagram().canvas.snapToGrid ? GENEO_GRID_SIZE : 10;
        const nextY = geneoClampFamilyBusRailY(bus, bus.railY
            + (event.key === 'ArrowDown' ? step : -step));
        if (nextY === bus.railY) return;
        geneoPushHistory();
        geneoSetFamilyBusRailY(bus, nextY);
        setGeneographSelection([], ids, { connectionId: ids.at(-1) });
        touchGeneographBoard();
        renderGeneographEditorPreserveScroll();
        main.querySelector(`[data-geneo-family-bus-rail][data-geneo-family-bus="${CSS.escape(ids.join(','))}"]`)
            ?.focus({ preventScroll: true });
        return;
    }
    if (event.type === 'keydown' && !['Enter', ' '].includes(event.key)) return;
    event.preventDefault();
    event.stopPropagation();
    const ids = (event.currentTarget.dataset.geneoFamilyBus || '').split(',')
        .filter(id => Boolean(getGeneographConnection(id)));
    if (!ids.length) return;
    const modified = event.shiftKey || event.ctrlKey || event.metaKey;
    if (modified)
    {
        const selected = geneoSelectedConnectionIdSet();
        const remove = ids.every(id => selected.has(id));
        ids.forEach(id => remove ? selected.delete(id) : selected.add(id));
        setGeneographSelection([...geneoSelectedNodeIdSet()], [...selected],
            { connectionId: selected.has(ids.at(-1)) ? ids.at(-1) : [...selected].at(-1) });
    }
    else setGeneographSelection([], ids, { connectionId: ids.at(-1) });
    renderGeneographEditorPreserveScroll();
    if (event.type === 'keydown')
        main.querySelector(`${event.currentTarget.hasAttribute('data-geneo-family-bus-rail')
            ? '[data-geneo-family-bus-rail]' : ''}[data-geneo-family-bus="${CSS.escape(ids.join(','))}"]`)
            ?.focus({ preventScroll: true });
}

function geneoClampFamilyBusRailY(bus, value)
{
    let minimum = bus.lowerBound;
    let maximum = bus.upperBound;
    if (selectedGeneographDiagram()?.canvas.snapToGrid)
    {
        minimum = Math.ceil(minimum / GENEO_GRID_SIZE) * GENEO_GRID_SIZE;
        maximum = Math.floor(maximum / GENEO_GRID_SIZE) * GENEO_GRID_SIZE;
    }
    return Math.max(minimum, Math.min(maximum,
        selectedGeneographDiagram()?.canvas.snapToGrid
            ? snapGeneographCoordinate(value) : Math.round(value)));
}

function geneoSetFamilyBusRailY(bus, value)
{
    bus.connectionIds.forEach(id =>
    {
        const connection = getGeneographConnection(id);
        if (connection?.route?.mode === 'auto') connection.route.railY = value;
    });
}

function startGeneographFamilyBusRailDrag(event)
{
    if (geneoPointerState || event.isPrimary === false || event.button !== 0
        || !['select', 'pan'].includes(geneoEffectiveCanvasTool())
        || event.shiftKey || event.ctrlKey || event.metaKey) return;
    const ids = (event.currentTarget.dataset.geneoFamilyBus || '').split(',');
    const bus = geneoFamilyChildBusGroups().buses.find(item =>
        item.connectionIds.join(',') === ids.join(','));
    if (!bus) return;
    geneoPushHistory();
    setGeneographSelection([], ids, { connectionId: ids.at(-1) });
    geneoPointerState = {
        kind: 'family-bus-rail', pointerId: event.pointerId,
        connectionIds: ids, start: geneoPointerToCanvas(event),
        railY: bus.railY, lowerBound: bus.lowerBound, upperBound: bus.upperBound,
        moved: false
    };
    event.preventDefault();
    event.stopPropagation();
}

function geneoRelativeDefaultGender(type, anchorNodeId = '')
{
    if (['parent', 'child', 'sibling'].includes(type)) return 'unknown';
    if (type === 'partner')
    {
        const anchorNode = getGeneographNode(anchorNodeId);
        const gender = getGeneographPerson(anchorNode?.personId)?.gender;
        return gender === 'male' ? 'female' : gender === 'female' ? 'male' : 'unknown';
    }
    if (
        ['father', 'son', 'brother']
            .includes(type)
    )
    {
        return 'male';
    }

    if (
        ['mother', 'daughter', 'sister']
            .includes(type)
    )
    {
        return 'female';
    }

    return 'male';
}

function geneoRelativeLabel(type)
{
    const labels = {
        father: 'father',
        mother: 'mother',
        parent: 'parent',
        partner: 'partner',
        son: 'son',
        daughter: 'daughter',
        child: 'child',
        brother: 'brother',
        sister: 'sister',
        sibling: 'sibling'
    };

    return labels[type] || 'relative';
}

function geneoRelativeCategory(type)
{
    if (
        ['father', 'mother', 'parent']
            .includes(type)
    )
    {
        return 'parent';
    }

    if (
        ['son', 'daughter', 'child']
            .includes(type)
    )
    {
        return 'child';
    }

    if (
        ['brother', 'sister', 'sibling']
            .includes(type)
    )
    {
        return 'sibling';
    }

    return 'partner';
}

function geneoFirstParentForAddedParent(childNode, newParentPersonId = null)
{
    const diagram = selectedGeneographDiagram();
    if (!diagram || childNode?.type !== 'person') return null;
    const parentFamilies = diagram.families.filter(family =>
        family.partnerIds.length && family.children.some(child => child.personId === childNode.personId));
    const parentIds = new Set(parentFamilies.flatMap(family => family.partnerIds));
    if (parentIds.size !== 1 || parentIds.has(newParentPersonId)) return null;
    const family = parentFamilies.find(item => item.partnerIds.length === 1);
    if (!family) return null;
    const connection = diagram.connections.find(item => item.kind === 'family-child'
        && item.familyId === family.id && item.target?.nodeId === childNode.id);
    const parentNode = diagram.nodes.find(node => node.id === connection?.source?.nodeId
        && node.type === 'person' && node.personId === family.partnerIds[0])
        || diagram.nodes.find(node => node.type === 'person'
            && node.personId === family.partnerIds[0]);
    return connection && parentNode ? { family, connection, parentNode } : null;
}

function geneoRelativeNodePlacement(
    anchorNode,
    relativeType,
    width,
    height
)
{
    const diagram =
        selectedGeneographDiagram();

    const category =
        geneoRelativeCategory(
            relativeType
        );

    const horizontalGap = 110;
    const verticalGap = 130;

    const centerX =
        anchorNode.x
        + anchorNode.width / 2
        - width / 2;

    const centerY =
        anchorNode.y
        + anchorNode.height / 2
        - height / 2;

    const candidates = [];

    if (category === 'parent')
    {
        const firstParent = geneoFirstParentForAddedParent(anchorNode)?.parentNode;
        if (firstParent)
        {
            for (const offset of [0, -1, 1])
            {
                const y = firstParent.y + offset * (height + verticalGap);
                candidates.push(
                    { x: firstParent.x + firstParent.width + horizontalGap, y },
                    { x: firstParent.x - width - horizontalGap, y }
                );
            }
        }
    }

    for (let step = 1; step <= 6; step += 1)
    {
        if (category === 'parent')
        {
            const y =
                anchorNode.y
            - height
            - verticalGap * step;

            [0, -1, 1].forEach(column =>
            {
                candidates.push({
                    x:
                centerX
                + column
                  * (width + horizontalGap),
                    y
                });
            });
        }
        else if (category === 'child')
        {
            const y =
                anchorNode.y
            + anchorNode.height
            + verticalGap * step;

            [0, -1, 1].forEach(column =>
            {
                candidates.push({
                    x:
                centerX
                + column
                  * (width + horizontalGap),
                    y
                });
            });
        }
        else
        {
            const distance =
                step
            * (width + horizontalGap);

            candidates.push(
                {
                    x:
                anchorNode.x
                + anchorNode.width
                + horizontalGap
                + (step - 1)
                  * (width + horizontalGap),
                    y: centerY
                },
                {
                    x:
                anchorNode.x
                - width
                - horizontalGap
                - (step - 1)
                  * (width + horizontalGap),
                    y: centerY
                },
                {
                    x:
                anchorNode.x
                + anchorNode.width
                + horizontalGap,
                    y:
                centerY
                + distance
                },
                {
                    x:
                anchorNode.x
                - width
                - horizontalGap,
                    y:
                centerY
                + distance
                }
            );
        }
    }

    const parentPanel =
        getGeneographNode(
            anchorNode.parentPanelId
        );

    const nodes =
        diagram.nodes.filter(node =>
            node.id !== parentPanel?.id
        );

    const overlaps = position =>
        nodes.some(node =>
            position.x
            < node.x + node.width + 18
          && position.x + width + 18
            > node.x
          && position.y
            < node.y + node.height + 18
          && position.y + height + 18
            > node.y
        );

    const insideParent = position =>
        Boolean(
            parentPanel?.type === 'panel'
          && position.x >= parentPanel.x + 16
          && position.y >= parentPanel.y + 16
          && position.x + width
            <= parentPanel.x
              + parentPanel.width
              - 16
          && position.y + height
            <= parentPanel.y
              + parentPanel.height
              - 16
        );

    const snappedCandidates =
        candidates.map(position =>
            snapGeneographPoint(position)
        );

    let position = parentPanel
        ? snappedCandidates.find(candidate =>
            insideParent(candidate)
            && !overlaps(candidate)
        )
        : null;

    position =
        position
        || snappedCandidates.find(candidate =>
            !overlaps(candidate)
        )
        || nextGeneoObjectPosition(
            width,
            height
        );

    return {
        ...position,
        parentPanelId:
          parentPanel
          && insideParent(position)
              ? parentPanel.id
              : geneoContainingPanelForNode({
                  id: '',
                  type: 'person',
                  ...position,
                  width,
                  height,
                  visible: true
              })?.id || null
    };
}

function geneoRelativeFamilyChoices(relative)
{
    const diagram = selectedGeneographDiagram();
    const anchor = getGeneographNode(relative?.anchorNodeId);
    if (!anchor) return [];
    const category = geneoRelativeCategory(relative.type);
    let families = diagram.families.filter(family => family.partnerIds.length && (category === 'child'
        ? family.partnerIds.includes(anchor.personId)
        : family.children.some(child => child.personId === anchor.personId)));
    const attachAnchor = category === 'sibling' && !families.length && Boolean(relative.existingPersonId);
    if (attachAnchor) families = diagram.families.filter(family => family.partnerIds.length
        && family.children.some(child => child.personId === relative.existingPersonId));
    const choices = [];
    families.forEach(family =>
    {
        const parents = family.partnerIds.filter(id => getGeneographPerson(id));
        if (parents.length > 1) choices.push({ value: `family:${family.id}`, familyId: family.id, parentIds: parents });
        parents.forEach(id =>
        {
            if (category === 'child' && id !== anchor.personId) return;
            if (!choices.some(choice => choice.parentIds.length === 1 && choice.parentIds[0] === id))
                choices.push({ value: `parent:${id}`, parentIds: [id], familyId: parents.length === 1 ? family.id : '' });
        });
    });
    if (category === 'child' && !choices.some(choice => choice.parentIds.length === 1 && choice.parentIds[0] === anchor.personId))
        choices.push({ value: `parent:${anchor.personId}`, parentIds: [anchor.personId], familyId: '' });
    if (category === 'sibling' && !families.length)
        choices.push({ value: 'unknown-father', parentIds: [], familyId: '' });
    if (attachAnchor && families.length) choices.forEach(choice => choice.attachAnchor = true);
    return choices;
}

function geneoRelativeFamilyDefault(relative)
{
    if (relative?.familySelection) return relative.familySelection;
    const choices = geneoRelativeFamilyChoices(relative);
    const couples = choices.filter(choice => choice.parentIds.length === 2);
    return couples.length === 1 ? couples[0].value : couples.length > 1 ? ''
        : choices.length === 1 ? choices[0].value : '';
}

function renderGeneoRelativeConfiguration(relative)
{
    if (!relative) return '';
    const category = geneoRelativeCategory(relative.type);
    if (category === 'partner')
    {
        return `<section class="add-person-family-connection geneo-relative-partner" data-geneo-relative-config>
          <h3 class="form-section-title">${escapeHtml(t('Relationship details'))}</h3>
          <div class="field add-person-select-field"><label for="geneoRelativePartnerType">${escapeHtml(t('Relationship type'))}</label>
            <select id="geneoRelativePartnerType" class="compact-select add-person-select">${addPersonRelationshipTypeOptions('Married')}</select><span class="add-person-select-chevron" aria-hidden="true">${icon.chevron}</span></div>
          <div data-geneo-partner-dates>${renderPartnerRelationshipDateFields({ prefix: 'geneoRelativePartner', relationshipType: 'Married' })}</div>
          <div class="field add-person-select-field" data-geneo-relative-marriage><label for="geneoRelativeMarriageType">${escapeHtml(t('Marriage type'))}</label><select id="geneoRelativeMarriageType" class="compact-select add-person-select">${addPersonMarriageTypeOptions('Civil')}</select><span class="add-person-select-chevron" aria-hidden="true">${icon.chevron}</span></div>
          <div class="field add-person-select-field"><label for="geneoRelativeChildren">${escapeHtml(t('Children'))}</label><select id="geneoRelativeChildren" class="compact-select add-person-select"><option value="none">${escapeHtml(t('Keep existing parent links'))}</option><option value="add">${escapeHtml(t('Add this partner as a parent to existing children'))}</option></select><span class="add-person-select-chevron" aria-hidden="true">${icon.chevron}</span></div>
          <p class="form-error" data-geneo-relative-error hidden></p>
        </section>`;
    }
    const choices = geneoRelativeFamilyChoices(relative);
    const selected = geneoRelativeFamilyDefault(relative);
    const autoFather = choices.some(choice => choice.value === 'unknown-father');
    const anchor = getGeneographNode(relative.anchorNodeId);
    const biologicalParents = [...new Set(selectedGeneographDiagram().families.flatMap(family => family.children.some(child => child.personId === anchor?.personId && child.parentageType === 'biological') ? family.partnerIds : []))];
    const suggestedGender = geneoRelativeDefaultGender(relative.type, relative.anchorNodeId);
    const initialType = relative.detailType || (category === 'parent' && (biologicalParents.length >= 2
        || (suggestedGender !== 'unknown' && biologicalParents.some(id => getGeneographPerson(id)?.gender === suggestedGender))) ? 'Adoptive' : 'Biological');
    const fields = `<div class="add-person-family-body">
      <div class="field add-person-select-field"><label for="geneoRelativeType">${escapeHtml(t('Relationship type'))}</label><select id="geneoRelativeType" class="compact-select add-person-select" ${autoFather ? 'disabled' : ''}>${parentChildRelationshipTypeOptions(initialType)}</select><span class="add-person-select-chevron" aria-hidden="true">${icon.chevron}</span></div>
      ${['child', 'sibling'].includes(category) ? `<div class="field add-person-select-field"><label for="geneoRelativeFamily">${escapeHtml(t(category === 'sibling' ? 'Shared parents' : 'Parents'))}</label><select id="geneoRelativeFamily" class="compact-select add-person-select"><option value="">${escapeHtml(t('Choose parents'))}</option>${choices.map(choice =>
      {
          const names = choice.parentIds.map(id => geneoPersonDisplayName(getGeneographPerson(id)));
          const label = category === 'child' && names.length === 1
              ? state.language === 'ru' ? `Только ${names[0]}` : `${names[0]} only`
              : names.join(state.language === 'ru' ? ' и ' : ' and ');
          return `<option value="${escapeHtml(choice.value)}" ${choice.value === selected ? 'selected' : ''}>${escapeHtml(choice.value === 'unknown-father' ? t('Unknown father') : label)}</option>`;
      }).join('')}</select><span class="add-person-select-chevron" aria-hidden="true">${icon.chevron}</span>${category === 'child' ? `<span class="field-help">${escapeHtml(t('Choose who will be recorded as this child’s parents.'))}</span>` : ''}</div>` : ''}
      </div><p class="form-error" data-geneo-relative-error hidden></p>`;
    return ['child', 'sibling'].includes(category)
        ? `<details class="add-person-family-connection add-person-facts-section geneo-relative-family" data-geneo-relative-config ${selected ? '' : 'open'}><summary class="add-person-facts-header" aria-expanded="${selected ? 'false' : 'true'}"><span class="add-person-facts-header-main"><span class="add-person-facts-chevron" aria-hidden="true">${icon.chevron}</span><span>${escapeHtml(t('Family connection'))}</span></span></summary><div class="add-person-facts-body">${fields}${autoFather ? `<p class="panel-muted">${escapeHtml(t('An Unknown father will be created for both siblings.'))}</p>` : ''}</div></details>`
        : `<section class="add-person-family-connection" data-geneo-relative-config>${fields}</section>`;
}

function collectGeneoRelativeConfiguration(relative)
{
    if (!relative) return {};
    const category = geneoRelativeCategory(relative.type);
    const fail = message =>
    {
        const section = modalBackdrop.querySelector('[data-geneo-relative-config]');
        if (section?.tagName === 'DETAILS') section.open = true;
        const error = section?.querySelector('[data-geneo-relative-error]');
        if (error) { error.hidden = false; error.textContent = t(message); }
        section?.querySelector('#geneoRelativeFamily, select')?.focus();
        return null;
    };
    if (category === 'partner')
    {
        const relationshipType = modalBackdrop.querySelector('#geneoRelativePartnerType')?.value || 'Married';
        const definition = partnerRelationshipDefinition(relationshipType);
        const startDate = collectGenealogyDateField('geneoRelativePartnerStartDate');
        const endDate = definition.hasEnd ? collectGenealogyDateField('geneoRelativePartnerEndDate') : emptyGenealogyDate('Exact date');
        if (!startDate || !endDate || (definition.hasEnd && !partnerRelationshipDateOrderIsValid(startDate, endDate)))
            return fail('Check the relationship dates before saving.');
        return { relationshipType, startDate, endDate,
            marriageType: definition.showsMarriageType ? modalBackdrop.querySelector('#geneoRelativeMarriageType')?.value || 'Civil' : '',
            startPlace: readPlaceInputValue('#geneoRelativePartnerStartPlace', modalBackdrop),
            endPlace: readPlaceInputValue('#geneoRelativePartnerEndPlace', modalBackdrop),
            addChildren: modalBackdrop.querySelector('#geneoRelativeChildren')?.value === 'add' };
    }
    const detailType = modalBackdrop.querySelector('#geneoRelativeType')?.value || relative.detailType || 'Biological';
    if (category === 'parent') return { detailType };
    const selection = modalBackdrop.querySelector('#geneoRelativeFamily')?.value || relative.familySelection || geneoRelativeFamilyDefault(relative);
    const choice = geneoRelativeFamilyChoices(relative).find(item => item.value === selection);
    if (!choice) return fail('Choose parents before continuing.');
    return { ...choice, detailType };
}

function geneoValidateRelativeConfiguration(relative, config, person = null)
{
    if (!relative || !config) return Boolean(config);
    const anchor = getGeneographNode(relative.anchorNodeId);
    if (!anchor) return false;
    const category = geneoRelativeCategory(relative.type);
    const diagram = selectedGeneographDiagram();
    const edges = diagram.families.flatMap(family => family.partnerIds.flatMap(parent => family.children.map(child => [parent, child.personId])));
    const reaches = (start, end, seen = new Set()) => start === end || (!seen.has(start) && (seen.add(start), edges.some(([parent, child]) => parent === start && reaches(child, end, seen))));
    const childId = category === 'parent' || config.attachAnchor ? anchor.personId : person?.id;
    const parents = category === 'parent' ? person ? [person.id] : [] : config.parentIds || [];
    let message = '';
    if (person?.id === anchor.personId) message = 'An item cannot connect to itself.';
    if (childId && parents.some(id => reaches(childId, id))) message = 'This relationship would create a loop.';
    if (person && category === 'sibling' && !config.attachAnchor)
    {
        const existing = diagram.families.filter(family => family.partnerIds.length && family.children.some(child => child.personId === person.id));
        if (existing.length && !existing.some(family => family.partnerIds.some(id => parents.includes(id))))
            message = 'These people have different recorded parents. Review their parents before connecting them as siblings.';
    }
    if (config.detailType === 'Biological' && childId)
    {
        const existingParents = [...new Set(diagram.families.flatMap(family => family.children.some(child => child.personId === childId && child.parentageType === 'biological') ? family.partnerIds : []))];
        const combined = [...new Set([...existingParents, ...parents])];
        if (combined.length > 2 || ['male', 'female'].some(gender => combined.filter(id => (id === person?.id ? person : getGeneographPerson(id))?.gender === gender).length > 1))
            message = 'Choose a non-biological relationship type for this parent connection.';
    }
    if (childId && parents.some(id => edges.some(([parent, child]) => parent === id && child === childId)))
        message = 'That connection already exists.';
    if (category === 'partner' && config.addChildren && person)
    {
        const children = diagram.families.filter(family => family.partnerIds.length === 1 && family.partnerIds[0] === anchor.personId).flatMap(family => family.children);
        if (children.some(child => reaches(child.personId, person.id))) message = 'This relationship would create a loop.';
        if (children.some(child => child.parentageType === 'biological') && person.gender !== 'unknown'
            && getGeneographPerson(anchor.personId)?.gender === person.gender)
            message = 'Keep existing parent links and edit the children\'s parentage separately.';
    }
    if (!message) return true;
    const section = modalBackdrop.querySelector('[data-geneo-relative-config]');
    if (section?.tagName === 'DETAILS') section.open = true;
    const error = section?.querySelector('[data-geneo-relative-error]');
    if (error) { error.hidden = false; error.textContent = t(message); }
    else showToast(t(message));
    section?.querySelector('select')?.focus();
    return false;
}

function connectGeneographCreatedRelative(
    anchorNode,
    relativeNode,
    relativeType,
    configuration = null
)
{
    const category =
        geneoRelativeCategory(
            relativeType
        );

    const anchorPersonId =
        anchorNode.personId;

    const relativePersonId =
        relativeNode.personId;

    if (configuration && ['child', 'sibling'].includes(category))
    {
        let family = configuration.familyId ? getGeneographFamily(configuration.familyId) : null;
        let parents = configuration.parentIds || [];
        if (configuration.value === 'unknown-father')
        {
            const father = { id: createRuntimeId('geneo-person'), treePersonId: null, syncState: 'local',
                names: { first: 'Unknown father', middle: '', last: '', maiden: '' }, gender: 'male', livingStatus: 'Unknown',
                birth: emptyGenealogyDate('Exact date'), death: emptyGenealogyDate('Exact date'), photoId: null };
            selectedGeneographDiagram().people.push(father);
            createGeneographPersonNodeForBoardPerson(father, { relative: { anchorNodeId: anchorNode.id, type: 'father' } });
            parents = [father.id];
        }
        if (!family) family = selectedGeneographDiagram().families.find(item => item.partnerIds.length === parents.length && parents.every(id => item.partnerIds.includes(id)));
        if (!family)
        {
            family = { id: createRuntimeId('geneo-family'), partnerIds: [...parents], children: [], relationshipType: 'Unknown relationship', relationshipStatus: 'active', marriageType: '', events: [] };
            selectedGeneographDiagram().families.push(family);
        }
        if (configuration.value === 'unknown-father') addGeneographChildToFamily(family.id, anchorPersonId, { nodeId: anchorNode.id, port: 'top' });
        if (configuration.attachAnchor)
        {
            const alreadyLinked = family.children.some(child => child.personId === anchorPersonId);
            addGeneographChildToFamily(family.id, anchorPersonId, { nodeId: anchorNode.id, port: 'top' });
            if (!alreadyLinked) family.children.find(child => child.personId === anchorPersonId).parentageType = configuration.detailType.toLowerCase();
            return;
        }
        const already = family.children.some(child => child.personId === relativePersonId);
        addGeneographChildToFamily(family.id, relativePersonId, { nodeId: relativeNode.id, port: 'top' });
        if (!already) family.children.find(child => child.personId === relativePersonId).parentageType = configuration.detailType.toLowerCase();
        return;
    }

    if (category === 'parent')
    {
        const candidateParent = geneoFirstParentForAddedParent(anchorNode, relativePersonId);
        const firstParent = candidateParent && (!configuration || candidateParent.family.children.find(child => child.personId === anchorPersonId)?.parentageType === configuration.detailType.toLowerCase()) ? candidateParent : null;
        if (firstParent)
        {
            const firstNode = firstParent.parentNode;
            const relativeIsRight = relativeNode.x >= firstNode.x;
            const family = createGeneographPartnerRelationship(
                firstNode.personId, relativePersonId,
                { nodeId: firstNode.id, port: relativeIsRight ? 'right' : 'left' },
                { nodeId: relativeNode.id, port: relativeIsRight ? 'left' : 'right' }
            );
            const child = firstParent.family.children.find(item => item.personId === anchorPersonId);
            if (!family.children.some(item => item.personId === anchorPersonId))
                family.children.push(child ? { ...child } : { personId: anchorPersonId, parentageType: 'biological' });
            if (configuration) family.children.find(item => item.personId === anchorPersonId).parentageType = configuration.detailType.toLowerCase();
            firstParent.connection.familyId = family.id;
            firstParent.connection.source = { familyId: family.id, port: 'bottom' };
            firstParent.connection.route = { mode: 'auto', waypoints: [] };
            firstParent.family.children = firstParent.family.children.filter(item => item.personId !== anchorPersonId);
            if (!firstParent.family.children.length)
                selectedGeneographDiagram().families = selectedGeneographDiagram().families.filter(item => item.id !== firstParent.family.id);
            return;
        }
        const family = createGeneographParentChildRelationship(
            relativePersonId,
            anchorPersonId,
            {
                nodeId: relativeNode.id,
                port: 'bottom'
            },
            {
                nodeId: anchorNode.id,
                port: 'top'
            }
        );
        if (configuration) family.children.find(item => item.personId === anchorPersonId).parentageType = configuration.detailType.toLowerCase();

        return;
    }

    if (category === 'child')
    {
        createGeneographParentChildRelationship(
            anchorPersonId,
            relativePersonId,
            {
                nodeId: anchorNode.id,
                port: 'bottom'
            },
            {
                nodeId: relativeNode.id,
                port: 'top'
            }
        );

        return;
    }

    if (category === 'sibling')
    {
        createGeneographSiblingRelationship(
            anchorPersonId,
            relativePersonId,
            {
                nodeId: anchorNode.id,
                port: 'top'
            },
            {
                nodeId: relativeNode.id,
                port: 'top'
            }
        );

        return;
    }

    const relativeIsRight =
        relativeNode.x >= anchorNode.x;

    const partnerFamily = createGeneographPartnerRelationship(
        anchorPersonId,
        relativePersonId,
        {
            nodeId: anchorNode.id,
            port:
            relativeIsRight
                ? 'right'
                : 'left'
        },
        {
            nodeId: relativeNode.id,
            port:
            relativeIsRight
                ? 'left'
                : 'right'
        }
    );
    if (configuration)
    {
        const definition = partnerRelationshipDefinition(configuration.relationshipType);
        partnerFamily.relationshipType = configuration.relationshipType;
        partnerFamily.relationshipStatus = definition.status;
        partnerFamily.marriageType = configuration.marriageType;
        const resolvePlace = input => geneoResolveBoardPersonPlace(input, '');
        upsertManagedRelationshipEvent(partnerFamily, 'start', definition, configuration.startDate, configuration.startPlace, configuration.marriageType, { resolvePlace });
        if (definition.hasEnd) upsertManagedRelationshipEvent(partnerFamily, 'end', definition, configuration.endDate, configuration.endPlace, configuration.marriageType, { resolvePlace });
        if (configuration.addChildren)
        {
            const diagram = selectedGeneographDiagram();
            diagram.families.filter(family => family.id !== partnerFamily.id && family.partnerIds.length === 1 && family.partnerIds[0] === anchorPersonId).forEach(family =>
            {
                family.children.forEach(child =>
                {
                    if (!partnerFamily.children.some(item => item.personId === child.personId)) partnerFamily.children.push({ ...child });
                });
                diagram.connections.filter(connection => connection.kind === 'family-child' && connection.familyId === family.id).forEach(connection =>
                {
                    connection.familyId = partnerFamily.id;
                    connection.source = { familyId: partnerFamily.id, port: 'bottom' };
                    connection.route = { mode: 'auto', waypoints: [] };
                });
                diagram.families = diagram.families.filter(item => item.id !== family.id);
            });
        }
    }
}

function openGeneographRelativePopover(
    anchor,
    nodeId
)
{
    const node =
        getGeneographNode(nodeId);

    const person =
        node?.type === 'person'
            ? getGeneographPerson(
                node.personId
            )
            : null;

    if (!anchor || !node || !person)
    {
        return;
    }

    closeMenu();

    const displayName =
        geneoPersonDisplayName(person);

    const popover =
        document.createElement('div');

    popover.className =
        'relative-popover geneo-relative-popover';

    popover.id = 'relativePopover';

    popover.setAttribute(
        'role',
        'dialog'
    );

    popover.setAttribute(
        'aria-label',
        `Add relative to ${displayName}`
    );

    popover.innerHTML = `
        <div class="relative-popover-body">
          <h2>New relative</h2>
          <p>to ${escapeHtml(displayName)}</p>

          <div class="relative-group">
            Parents
          </div>

          <div class="relative-grid">
            <button
              class="relative-choice"
              type="button"
              data-geneo-relative="father">
              <span class="gender-icon">
                ${icon.male}
              </span>
              Father
            </button>

            <button
              class="relative-choice female"
              type="button"
              data-geneo-relative="mother">
              <span class="gender-icon">
                ${icon.female}
              </span>
              Mother
            </button>

            <button
              class="relative-choice geneo-relative-choice wide"
              type="button"
              data-geneo-relative="parent">
              <span class="relative-choice-icon">
                ${icon.profile}
              </span>
              Parent
            </button>
          </div>

          <div class="relative-group">
            Partner
          </div>

          <div class="relative-grid">
            <button
              class="relative-choice geneo-relative-choice wide"
              type="button"
              data-geneo-relative="partner">
              <span class="relative-choice-icon marriage-icon">
                ${icon.marriage}
              </span>
              Partner / Spouse
            </button>
          </div>

          <div class="relative-group">
            Children
          </div>

          <div class="relative-grid">
            <button
              class="relative-choice"
              type="button"
              data-geneo-relative="son">
              <span class="gender-icon">
                ${icon.male}
              </span>
              Son
            </button>

            <button
              class="relative-choice female"
              type="button"
              data-geneo-relative="daughter">
              <span class="gender-icon">
                ${icon.female}
              </span>
              Daughter
            </button>

            <button
              class="relative-choice geneo-relative-choice wide"
              type="button"
              data-geneo-relative="child">
              <span class="relative-choice-icon">
                ${icon.profile}
              </span>
              Child
            </button>
          </div>

          <div class="relative-group">
            Siblings
          </div>

          <div class="relative-grid">
            <button
              class="relative-choice"
              type="button"
              data-geneo-relative="brother">
              <span class="gender-icon">
                ${icon.male}
              </span>
              Brother
            </button>

            <button
              class="relative-choice female"
              type="button"
              data-geneo-relative="sister">
              <span class="gender-icon">
                ${icon.female}
              </span>
              Sister
            </button>

            <button
              class="relative-choice geneo-relative-choice wide"
              type="button"
              data-geneo-relative="sibling">
              <span class="relative-choice-icon">
                ${icon.profile}
              </span>
              Sibling
            </button>
          </div>
        </div>
      `;

    document.body.appendChild(popover);

    anchor.setAttribute(
        'aria-expanded',
        'true'
    );

    positionRelativePopover(
        popover,
        anchor
    );

    popover
        .querySelectorAll(
            '[data-geneo-relative]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () =>
                {
                    const relativeType =
                        button.dataset.geneoRelative;

                    closeMenu();

                    openGeneographPersonModal(
                        '',
                        {
                            relative: {
                                anchorNodeId: node.id,
                                type: relativeType
                            }
                        }
                    );
                }
            );
        });

    bindMenuLifecycle(anchor);

    requestAnimationFrame(() =>
    {
        popover
            .querySelector(
                '[data-geneo-relative]'
            )
            ?.focus();
    });
}

let geneoPersonPossibleMatchState = {
    selectedPersonId: '',
    refreshFrame: null
};

function collectGeneographPersonDraftForMatching()
{
    const value =
        selector =>
            modalBackdrop
                ?.querySelector(selector)
                ?.value
          || '';

    const firstName =
        normalizeAddPersonMatchText(
            value('#geneoPersonFirstName')
        );

    const middleName =
        normalizeAddPersonMatchText(
            value('#geneoPersonMiddleName')
        );

    const lastName =
        normalizeAddPersonMatchText(
            value('#geneoPersonLastName')
        );

    const maidenName =
        normalizeAddPersonMatchText(
            value('#geneoPersonMaidenName')
        );

    const birthDate =
        normalizeAddPersonMatchText(
            value('#geneoPersonBirthDate')
        );

    const deathDate =
        normalizeAddPersonMatchText(
            value('#geneoPersonDeathDate')
        );

    const birthPlace =
        normalizeAddPersonMatchText(
            value('#geneoPersonBirthPlace')
        );

    const deathPlace =
        normalizeAddPersonMatchText(
            value('#geneoPersonDeathPlace')
        );

    return {
        firstName,
        middleName,
        lastName,
        maidenName,
        birthDate,
        deathDate,
        birthPlace,
        deathPlace,
        hasSignal: Boolean(
            firstName
          || middleName
          || lastName
          || maidenName
          || birthDate
          || deathDate
          || birthPlace
          || deathPlace
        )
    };
}

function geneoPossibleMatchScoreOptions(
    options = {}
)
{
    const anchorNode =
        options.relative?.anchorNodeId
            ? getGeneographNode(
                options.relative.anchorNodeId
            )
            : null;

    const anchorPerson =
        anchorNode?.type === 'person'
            ? getGeneographPerson(
                anchorNode.personId
            )
            : null;

    return {
        connectToPersonId:
          anchorPerson?.treePersonId
          || ''
    };
}

function findGeneographPersonPossibleMatches(
    options = {}
)
{
    const draft =
        collectGeneographPersonDraftForMatching();

    if (!draft.hasSignal) return [];

    const projectId =
        selectedGeneographBoard()?.projectId
        || currentProjectId();

    const scoreOptions =
        geneoPossibleMatchScoreOptions(
            options
        );

    return getPeople(projectId)
        .filter(person =>
            person?.id
          && !person.deleted
          && person.id
            !== scoreOptions.connectToPersonId
        )
        .map(person => ({
            person,
            score:
            scoreAddPersonPossibleMatch(
                person,
                draft,
                scoreOptions
            )
        }))
        .filter(item => item.score >= 24)
        .sort(
            (first, second) =>
                second.score - first.score
            || connectPersonName(
                first.person
            ).localeCompare(
                connectPersonName(
                    second.person
                )
            )
        )
        .slice(0, 2);
}

function renderGeneographPersonPossibleMatchesCard(
    options = {},
    {
        initial = false
    } = {}
)
{
    const draft =
        initial
            ? { hasSignal: false }
            : collectGeneographPersonDraftForMatching();

    const matches =
        initial
            ? []
            : findGeneographPersonPossibleMatches(
                options
            );

    const selectedStillVisible =
        matches.some(item =>
            item.person.id
          === geneoPersonPossibleMatchState
              .selectedPersonId
        );

    if (
        geneoPersonPossibleMatchState
            .selectedPersonId
        && !selectedStillVisible
    )
    {
        geneoPersonPossibleMatchState
            .selectedPersonId = '';
    }

    const header = `
        <h3>
          Possible matches<br>
          <span class="panel-muted">
            Similar people in Family Tree
          </span>
        </h3>
      `;

    if (!draft.hasSignal)
    {
        return `<div class="modal-side-card" data-geneo-person-possible-matches aria-live="polite">
          ${header}
          <div class="add-person-match-empty">
            Enter a name, date, or place to check the Family Tree.
          </div>
        </div>`;
    }

    if (!matches.length)
    {
        return `<div class="modal-side-card" data-geneo-person-possible-matches aria-live="polite">
          ${header}
          <div class="add-person-match-empty">
            No strong matches found in the Family Tree.
          </div>
        </div>`;
    }

    const relative =
        Boolean(
            options.relative
        );

    return `<div class="modal-side-card" data-geneo-person-possible-matches aria-live="polite">
        ${header}
        <div class="add-person-match-list">
          ${matches.map(item =>
                renderAddPersonPossibleMatchRow(
                    item,
                    {
                        context: 'geneograph',
                        selectedPersonId:
                  geneoPersonPossibleMatchState
                      .selectedPersonId
                    }
                )
            ).join('')}
        </div>
        <button
          class="button primary add-person-match-action"
          type="button"
          data-geneo-person-match-action
          ${selectedStillVisible ? '' : 'disabled'}>
          ${icon.link}
          <span>
            ${relative ? 'Connect selected' : 'Add selected'}
          </span>
        </button>
      </div>`;
}

function bindGeneographPersonPossibleMatchCard(
    options = {}
)
{
    modalBackdrop
        ?.querySelectorAll(
            '[data-geneo-person-possible-match]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () =>
                {
                    geneoPersonPossibleMatchState
                        .selectedPersonId =
                            button.dataset
                                .geneoPersonPossibleMatch
                  || '';

                    refreshGeneographPersonPossibleMatches(
                        options,
                        {
                            focusSelected: true
                        }
                    );
                }
            );
        });

    modalBackdrop
        ?.querySelector(
            '[data-geneo-person-match-action]'
        )
        ?.addEventListener(
            'click',
            () =>
                commitGeneographPersonPossibleMatch(
                    options
                )
        );
}

function refreshGeneographPersonPossibleMatches(
    options = {},
    {
        focusSelected = false
    } = {}
)
{
    const current =
        modalBackdrop?.querySelector(
            '[data-geneo-person-possible-matches]'
        );

    if (!current) return;

    const body =
        modalBackdrop.querySelector(
            '.modal-body'
        );

    const scrollTop =
        body?.scrollTop || 0;

    current.outerHTML =
        renderGeneographPersonPossibleMatchesCard(
            options
        );

    const refreshed =
        modalBackdrop.querySelector(
            '[data-geneo-person-possible-matches]'
        );

    localizeUI(
        refreshed,
        {
            suppressObserverReplay: true
        }
    );
    bindGeneographPersonPossibleMatchCard(
        options
    );

    if (body)
    {
        body.scrollTop = scrollTop;
    }

    if (
        focusSelected
        && geneoPersonPossibleMatchState
            .selectedPersonId
    )
    {
        refreshed
            ?.querySelector(
                `[data-geneo-person-possible-match="${CSS.escape(
                    geneoPersonPossibleMatchState
                        .selectedPersonId
                )}"]`
            )
            ?.focus({
                preventScroll: true
            });
    }
}

function scheduleGeneographPersonPossibleMatchesRefresh(
    options = {}
)
{
    if (
        geneoPersonPossibleMatchState
            .refreshFrame
    )
    {
        cancelAnimationFrame(
            geneoPersonPossibleMatchState
                .refreshFrame
        );
    }

    geneoPersonPossibleMatchState
        .refreshFrame =
            requestAnimationFrame(() =>
            {
                geneoPersonPossibleMatchState
                    .refreshFrame = null;

                refreshGeneographPersonPossibleMatches(
                    options
                );
            });
}

function renderGeneographPersonStatusField(status)
{
    return `<div class="field add-person-status-field"><label>Living status</label><button class="add-person-status-button" type="button" id="geneoPersonStatusButton" aria-haspopup="listbox" aria-expanded="false"><span class="add-person-status-current"><span class="add-person-status-dot ${statusDotClass(status)}"></span><span id="geneoPersonStatusLabel">${escapeHtml(status)}</span></span><span class="add-person-status-chevron" aria-hidden="true">${icon.chevron}</span></button><input type="hidden" id="geneoPersonLivingStatus" value="${escapeHtml(status)}"><div class="add-person-status-menu" id="geneoPersonStatusMenu" role="listbox" hidden>${['Living', 'Deceased', 'Unknown'].map(value => `<button class="add-person-status-option ${value === status ? 'active' : ''}" type="button" role="option" aria-selected="${value === status}" data-geneo-person-status="${value}"><span><span class="add-person-status-dot ${statusDotClass(value)}"></span>${value}</span><span data-status-check>${value === status ? icon.check : ''}</span></button>`).join('')}</div></div>`;
}

function renderGeneographPersonModal(
    person = null,
    {
        relative = null,
        gender: initialGender
    } = {}
)
{
    const editing = Boolean(person);

    const names =
        normalizeGeneographPersonNames(
            person || {}
        );

    const defaultGender = ['male', 'female', 'unknown'].includes(initialGender)
        ? initialGender
        : relative
            ? geneoRelativeDefaultGender(relative.type, relative.anchorNodeId)
            : 'male';

    const gender =
        ['male', 'female', 'unknown']
            .includes(person?.gender)
            ? person.gender
            : defaultGender;

    const status =
        person?.livingStatus
        || 'Living';

    const relativeLabel =
        relative
            ? geneoRelativeLabel(
                relative.type
            )
            : '';

    const modalTitle =
        editing
            ? 'Edit person'
            : relative
                ? `Add ${relativeLabel}`
                : 'Add person';

    const modalDescription =
        editing
            ? 'Update this board person without changing the linked Family Tree record.'
            : relative
                ? 'Create a board-local person and connect them to the selected card.'
                : 'Create a board-local person. You can link them to Family Tree later.';
    const birth = person?.birth || { ...emptyGenealogyDate('Exact date'), placeId: null, placeText: '' };
    const death = person?.death || { ...emptyGenealogyDate('Exact date'), placeId: null, placeText: '' };
    return `<div class="modal add-person-modal geneo-person-modal" role="dialog" aria-modal="true" aria-labelledby="geneoPersonModalTitle">
        <div class="modal-header add-person-header">
          <div class="add-person-icon" aria-hidden="true">
            ${icon.people}
          </div>
          <div>
            <h2 id="geneoPersonModalTitle">${escapeHtml(modalTitle)}</h2>
            <p>${escapeHtml(modalDescription)}</p>
          </div>
          <button class="close-button" type="button" data-close aria-label="Close">
            ${icon.close}
          </button>
        </div>

        <form id="geneoPersonForm">
          <div class="modal-body add-person-grid geneo-person-grid ${editing ? 'is-editing' : ''}">
            <div class="form-grid geneo-person-form">
              <section>
                <h3 class="form-section-title">Identity</h3>
                <div class="two-col-form add-person-demographics">
                  <div class="field add-person-select-field">
                    <label for="geneoPersonGender">Gender</label>
                    <select class="compact-select add-person-select" id="geneoPersonGender">
                      <option value="male" ${gender === 'male' ? 'selected' : ''}>Male</option>
                      <option value="female" ${gender === 'female' ? 'selected' : ''}>Female</option>
                      <option value="unknown" ${gender === 'unknown' ? 'selected' : ''}>Unknown</option>
                    </select>
                    <span class="add-person-select-chevron" aria-hidden="true">${icon.chevron}</span>
                  </div>

                  ${renderGeneographPersonStatusField(status)}
                </div><div class="two-col-form add-person-name-fields">
                  <div class="field">
                    <label for="geneoPersonFirstName">First name</label>
                    <input id="geneoPersonFirstName" data-source-value="${escapeHtml(names.first)}" value="${escapeHtml(localizedDataFieldValue(names.first))}" placeholder="e.g. Silver" autofocus>
                  </div>

                  <div class="field">
                    <label for="geneoPersonMiddleName">Middle name / Patronym</label>
                    <input id="geneoPersonMiddleName" data-source-value="${escapeHtml(names.middle)}" value="${escapeHtml(localizedDataFieldValue(names.middle))}" placeholder="e.g. Purrington" title="${escapeHtml(t('Middle name or patronym, if recorded.'))}">
                  </div>

                  <div class="field">
                    <label for="geneoPersonLastName">Last name</label>
                    <input id="geneoPersonLastName" data-source-value="${escapeHtml(names.last)}" value="${escapeHtml(localizedDataFieldValue(names.last))}" placeholder="e.g. Whiskerfield">
                  </div>

                  <div class="field" data-geneo-maiden-name ${gender === 'female' ? '' : 'hidden'}>
                    <label for="geneoPersonMaidenName">Maiden name</label>
                    <input id="geneoPersonMaidenName" data-source-value="${escapeHtml(names.maiden)}" value="${escapeHtml(localizedDataFieldValue(names.maiden))}">
                  </div>
                </div>
              </section>

              <section>
                <h3 class="form-section-title">Life events</h3>
                <div class="add-person-life-grid">
                  <div class="add-person-life-event-block">
                    ${renderGenealogyDateField('geneoPersonBirth', 'Birth date', birth, {
                        inputId: 'geneoPersonBirthDate',
                        typeId: 'geneoPersonBirthDateType',
                        placeholder: 'e.g. 14 Feb 1915',
                        defaultDateType: 'Exact date',
                        className: 'genealogy-date-inline-range'
                    })}

                    ${renderPlaceCombobox({
                        id: 'geneoPersonBirthPlace',
                        label: 'Birth place',
                        value: placeInputDisplayValue(birth.placeId, birth.placeText),
                        selectedPlaceId: birth.placeId || '',
                        showAddress: false,
                        placeholder: 'Search or type a place',
                        inputAttrs: `data-place-project-id="${escapeHtml(selectedGeneographBoard()?.projectId || currentProjectId())}"`
                    })}
                  </div>

                  <div class="add-person-life-event-block add-person-death-fields" data-geneo-death-fields ${status === 'Deceased' ? '' : 'hidden'}>
                    ${renderGenealogyDateField('geneoPersonDeath', 'Death date', death, {
                        inputId: 'geneoPersonDeathDate',
                        typeId: 'geneoPersonDeathDateType',
                        placeholder: 'e.g. 14 Feb 1915',
                        defaultDateType: 'Exact date',
                        className: 'genealogy-date-inline-range'
                    })}

                    ${renderPlaceCombobox({
                        id: 'geneoPersonDeathPlace',
                        label: 'Death place',
                        value: placeInputDisplayValue(death.placeId, death.placeText),
                        selectedPlaceId: death.placeId || '',
                        showAddress: false,
                        placeholder: 'Search or type a place',
                        inputAttrs: `data-place-project-id="${escapeHtml(selectedGeneographBoard()?.projectId || currentProjectId())}"`
                    })}
                  </div>
                </div>
              </section>
            </div>

            ${editing ? '' : `
              <aside class="geneo-person-match-rail">
                ${renderGeneographPersonPossibleMatchesCard({ relative }, { initial: true })}
              </aside>
            `}
            ${!editing ? renderGeneoRelativeConfiguration(relative) : ''}
          </div>

          <div class="modal-footer add-person-footer">
            <div class="add-person-footer-left">${!editing && relative && ['child', 'sibling'].includes(geneoRelativeCategory(relative.type)) ? `<label class="checkbox-row"><input type="checkbox" id="geneoPersonAddAnother">${escapeHtml(t('Create and add another'))}</label>` : ''}</div>
            <div class="add-person-footer-actions">
              <button class="button secondary" type="button" data-close>Cancel</button>
              <button class="button primary" type="submit">
                ${
                    editing
                        ? 'Save changes'
                        : relative
                            ? `Add ${escapeHtml(relativeLabel)}`
                            : 'Add person'
                }
              </button>
            </div>
          </div>
        </form>
      </div>`;
}

function updateGeneographPersonModalConditionalFields({ clearDeath = false } = {})
{
    const gender = modalBackdrop.querySelector('#geneoPersonGender')?.value || 'unknown';
    const status = modalBackdrop.querySelector('#geneoPersonLivingStatus')?.value || 'Living';
    const deathFields = modalBackdrop.querySelector('[data-geneo-death-fields]');
    const maiden = modalBackdrop.querySelector('[data-geneo-maiden-name]');
    if (maiden) maiden.hidden = gender !== 'female';
    if (deathFields) deathFields.hidden = status !== 'Deceased';
    if (clearDeath && status !== 'Deceased')
    {
        applyGenealogyDateToField('geneoPersonDeath', emptyGenealogyDate('Exact date'));
        const input = modalBackdrop.querySelector('#geneoPersonDeathPlace');
        if (input)
        {
            input.value = ''; input.dataset.placeId = '';
        }
    }
}

function geneoBoardRepresentationForTreePerson(
    treePersonId
)
{
    const diagram =
        selectedGeneographDiagram();

    if (!diagram || !treePersonId)
    {
        return {
            person: null,
            node: null
        };
    }

    const person =
        diagram.people.find(item =>
            item.treePersonId === treePersonId
        ) || null;

    const node =
        person
            ? diagram.nodes.find(item =>
                item.type === 'person'
              && item.personId === person.id
            ) || null
            : null;

    return {
        person,
        node
    };
}

function createGeneographLinkedBoardPerson(
    treePerson,
    projectId
)
{
    const gender =
        String(
            treePerson?.gender || ''
        ).toLowerCase();

    const recordedDeath =
        geneoPersonHasRecordedDeath(
            treePerson
        );

    const livingStatus =
        [
            'Living',
            'Deceased',
            'Unknown'
        ].includes(
            treePerson?.livingStatus
        )
            ? treePerson.livingStatus
            : recordedDeath
                ? 'Deceased'
                : 'Living';

    return {
        id:
          createRuntimeId(
              'geneo-person'
          ),
        treePersonId:
          treePerson.id,
        syncState: 'linked',
        names:
          normalizeGeneographPersonNames(
              treePerson
          ),
        gender:
          [
              'male',
              'female',
              'unknown'
          ].includes(gender)
              ? gender
              : 'unknown',
        livingStatus,
        birth:
          normalizeGeneographPersonVital(
              treePerson.birth,
              projectId
          ),
        death:
          livingStatus === 'Deceased'
              ? normalizeGeneographPersonVital(
                  treePerson.death,
                  projectId
              )
              : {
                  ...emptyGenealogyDate(
                      'Exact date'
                  ),
                  placeId: null,
                  placeText: ''
              },
        photoId: null,
        photoCrop: null,
        photoRegion: null
    };
}

function createGeneographPersonNodeForBoardPerson(
    boardPerson,
    {
        relative = null
    } = {}
)
{
    const diagram =
        selectedGeneographDiagram();

    if (!diagram || !boardPerson)
    {
        return null;
    }

    const anchorNode =
        relative?.anchorNodeId
            ? getGeneographNode(
                relative.anchorNodeId
            )
            : null;

    const defaults =
        geneoNodeDefaults('person');

    const personCard =
        geneoEmptyPersonCardOverrides(
            false,
            'manual'
        );

    const draftNode = {
        type: 'person',
        personId: boardPerson.id,
        width: defaults.width,
        height: defaults.height,
        personCard
    };

    const reference =
        geneoPersonCardReferenceSize(
            draftNode,
            diagram
        );

    const standardCard =
        geneoPersonCardEffectiveSettings(
            draftNode,
            diagram
        ).style === 'standard';

    const placement =
        anchorNode && relative
            ? geneoRelativeNodePlacement(
                anchorNode,
                relative.type,
                reference.width,
                reference.height
            )
            : {
                ...nextGeneoObjectPosition(
                    reference.width,
                    reference.height
                ),
                parentPanelId: null
            };

    const node = {
        id:
          createRuntimeId(
              'geneo-node'
          ),
        type: 'person',
        personId: boardPerson.id,
        x: placement.x,
        y: placement.y,
        width: reference.width,
        height: reference.height,
        parentPanelId:
          placement.parentPanelId
          || null,
        order:
          Math.max(
              0,
              ...diagram.nodes.map(item =>
                  item.order || 0
              )
          ) + 1,
        visible: true,
        locked: false,
        personCard,
        appearance: {
            ...defaults.appearance,
            paintOverrides: {
                ...defaults.appearance.paintOverrides,
                stroke: false
            },
            fill: {
                color: '#173029',
                opacity: 100,
                enabled: true
            },
            stroke: {
                color: '#62D99A',
                opacity: 100,
                enabled: !standardCard
            },
            strokeWidth: 2
        }
    };

    diagram.nodes.push(node);
    return node;
}

function geneoRelativeConnectionEndpoints(
    anchorNode,
    relativeNode,
    relativeType
)
{
    const category =
        geneoRelativeCategory(
            relativeType
        );

    if (category === 'parent')
    {
        return {
            source: {
                nodeId: relativeNode.id,
                port: 'bottom'
            },
            target: {
                nodeId: anchorNode.id,
                port: 'top'
            }
        };
    }

    if (category === 'child')
    {
        return {
            source: {
                nodeId: anchorNode.id,
                port: 'bottom'
            },
            target: {
                nodeId: relativeNode.id,
                port: 'top'
            }
        };
    }

    if (category === 'sibling')
    {
        return {
            source: {
                nodeId: anchorNode.id,
                port: 'top'
            },
            target: {
                nodeId: relativeNode.id,
                port: 'top'
            }
        };
    }

    const relativeIsRight =
        relativeNode.x >= anchorNode.x;

    return {
        source: {
            nodeId: anchorNode.id,
            port:
            relativeIsRight
                ? 'right'
                : 'left'
        },
        target: {
            nodeId: relativeNode.id,
            port:
            relativeIsRight
                ? 'left'
                : 'right'
        }
    };
}

function geneoPersonFormTransaction(action)
{
    const board = selectedGeneographBoard();
    const snapshot = board ? JSON.stringify(board.diagram) : null;
    const undo = [...geneoHistoryRuntime.undo];
    const redo = [...geneoHistoryRuntime.redo];
    try { return action(); }
    catch (error)
    {
        if (board && snapshot) board.diagram = JSON.parse(snapshot);
        geneoHistoryRuntime.undo = undo;
        geneoHistoryRuntime.redo = redo;
        console.error(error);
        showToast(t('The person could not be added. No changes were saved.'));
        return false;
    }
}

function commitGeneographPersonPossibleMatch(options = {})
{
    return geneoPersonFormTransaction(() => commitGeneographPersonPossibleMatchDraft(options));
}

function commitGeneographPersonPossibleMatchDraft(
    options = {}
)
{
    const treePerson =
        getPerson(
            geneoPersonPossibleMatchState
                .selectedPersonId
        );

    const board =
        selectedGeneographBoard();

    const diagram =
        selectedGeneographDiagram();

    if (
        !treePerson
        || !board
        || !diagram
        || treePerson.projectId
          !== board.projectId
        || treePerson.deleted
    )
    {
        showToast(
            'Select a possible match first.'
        );
        return;
    }

    const relative =
        options.relative || null;

    const anchorNode =
        relative?.anchorNodeId
            ? getGeneographNode(
                relative.anchorNodeId
            )
            : null;

    if (
        relative
        && anchorNode?.type !== 'person'
    )
    {
        showToast(
            'The original person card is no longer available.'
        );
        return;
    }

    let {
        person: boardPerson,
        node
    } = geneoBoardRepresentationForTreePerson(
        treePerson.id
    );

    const connectionRelative = relative ? { ...relative, existingPersonId: boardPerson?.id || '' } : null;
    if (relative && geneoRelativeCategory(relative.type) === 'sibling'
        && geneoRelativeFamilyChoices(connectionRelative).some(choice => choice.attachAnchor)
        && !geneoRelativeFamilyChoices(connectionRelative).some(choice => choice.value === modalBackdrop.querySelector('#geneoRelativeFamily')?.value))
    {
        const section = modalBackdrop.querySelector('[data-geneo-relative-config]');
        if (section)
        {
            section.outerHTML = renderGeneoRelativeConfiguration(connectionRelative);
            modalBackdrop.querySelector('[data-geneo-relative-config]').open = true;
            localizeUI(modalBackdrop);
            modalBackdrop.querySelector('#geneoRelativeFamily')?.focus();
        }
        return;
    }
    const relativeConfiguration = collectGeneoRelativeConfiguration(connectionRelative);
    const proposedPerson = boardPerson || createGeneographLinkedBoardPerson(treePerson, board.projectId);
    if (!relativeConfiguration || !geneoValidateRelativeConfiguration(relative, relativeConfiguration, proposedPerson)) return;

    if (relative && node)
    {
        const endpoints =
            geneoRelativeConnectionEndpoints(
                anchorNode,
                node,
                relative.type
            );

        const validation =
            canCreateGeneographConnection(
                endpoints.source,
                endpoints.target
            );

        if (!validation.valid)
        {
            showToast(
                validation.reason
            || 'This relationship cannot be created.'
            );
            return;
        }
    }

    const creatingPerson =
        !boardPerson;

    const creatingNode =
        !node;

    const connecting =
        Boolean(relative);

    const mutating =
        creatingPerson
        || creatingNode
        || connecting;

    if (mutating)
    {
        geneoPushHistory();
    }

    if (!boardPerson)
    {
        boardPerson =
            createGeneographLinkedBoardPerson(
                treePerson,
                board.projectId
            );

        diagram.people.push(
            boardPerson
        );
    }

    if (!node)
    {
        node =
            createGeneographPersonNodeForBoardPerson(
                boardPerson,
                {
                    relative
                }
            );
    }

    if (!node) return;

    if (relative)
    {
        connectGeneographCreatedRelative(
            anchorNode,
            node,
            relative.type,
            relativeConfiguration
        );
    }

    selectGeneographNode(
        node.id
    );

    if (mutating)
    {
        touchGeneographBoard();
    }

    closeModal();

    if (
        !mutating
        && node
    )
    {
        renderGeneographEditorPreserveCenter(
            geneoNodeCenter(node)
        );
    }
    else
    {
        renderGeneographEditorPreserveScroll();
    }

    requestAnimationFrame(() =>
    {
        main
            .querySelector(
                `[data-geneo-node="${CSS.escape(node.id)}"]`
            )
            ?.focus({
                preventScroll: true
            });
    });

    const name =
        connectPersonName(
            treePerson
        );

    if (relative)
    {
        showToast(
            connectedRelativeToast(name, relative.type)
        );
        return;
    }

    showToast(
        creatingNode
            ? `${name} added to board.`
            : `${name} is already on this board.`
    );
}

function saveGeneographPersonModal(
    personId = '',
    options = {}
)
{
    return geneoPersonFormTransaction(() => saveGeneographPersonModalDraft(personId, options));
}

function saveGeneographPersonModalDraft(
    personId = '',
    {
        relative = null
    } = {}
)
{
    const existing =
        personId
            ? getGeneographPerson(personId)
            : null;

    const anchorNode =
        relative?.anchorNodeId
            ? getGeneographNode(
                relative.anchorNodeId
            )
            : null;

    if (
        relative
        && anchorNode?.type !== 'person'
    )
    {
        showToast(
            'The original person card is no longer available.'
        );

        closeModal();
        return;
    }

    const birthDate =
        collectGenealogyDateField(
            'geneoPersonBirth'
        );

    const status =
        modalBackdrop
            .querySelector(
                '#geneoPersonLivingStatus'
            )?.value
        || 'Living';

    const deathDate =
        status === 'Deceased'
            ? collectGenealogyDateField(
                'geneoPersonDeath'
            )
            : emptyGenealogyDate(
                'Exact date'
            );

    if (!birthDate || !deathDate)
    {
        modalBackdrop
            .querySelector(
                '.genealogy-date-field.has-error input'
            )
            ?.focus({
                preventScroll: true
            });

        return;
    }

    if (status === 'Deceased' && genealogyDateDefinitelyAfter(birthDate, deathDate))
    {
        showToast(t('The death date is earlier than the birth date.'));
        return;
    }

    const projectId =
        selectedGeneographBoard()
            ?.projectId
        || currentProjectId();

    const birthPlace =
        geneoResolveBoardPersonPlace(
            readPlaceInputValue(
                '#geneoPersonBirthPlace',
                modalBackdrop
            ),
            existing?.birth?.placeId || ''
        );

    const deathPlace =
        status === 'Deceased'
            ? geneoResolveBoardPersonPlace(
                readPlaceInputValue(
                    '#geneoPersonDeathPlace',
                    modalBackdrop
                ),
                existing?.death?.placeId || ''
            )
            : {
                placeId: null,
                placeText: ''
            };

    const gender =
        modalBackdrop
            .querySelector(
                '#geneoPersonGender'
            )?.value
        || 'unknown';

    const enteredFirstName =
        collectLocalizedDataFieldValue(
            modalBackdrop.querySelector(
                '#geneoPersonFirstName'
            ),
            existing?.names?.first || ''
        ).trim();

    const values = {
        names: {
            first:
            enteredFirstName
            || (
                existing
                    ? ''
                    : 'Unknown'
            ),

            middle:
            collectLocalizedDataFieldValue(
                modalBackdrop.querySelector(
                    '#geneoPersonMiddleName'
                ),
                existing?.names?.middle || ''
            ).trim(),

            last:
            collectLocalizedDataFieldValue(
                modalBackdrop.querySelector(
                    '#geneoPersonLastName'
                ),
                existing?.names?.last || ''
            ).trim(),

            maiden:
            gender === 'female'
                ? collectLocalizedDataFieldValue(
                    modalBackdrop.querySelector(
                        '#geneoPersonMaidenName'
                    ),
                    existing?.names?.maiden || ''
                ).trim()
                : ''
        },

        gender,
        livingStatus: status,

        birth:
          normalizeGeneographPersonVital(
              {
                  ...birthDate,
                  placeId:
                birthPlace.placeId || null,
                  placeText:
                birthPlace.placeText || ''
              },
              projectId
          ),

        death:
          status === 'Deceased'
              ? normalizeGeneographPersonVital(
                  {
                      ...deathDate,
                      placeId:
                    deathPlace.placeId
                    || null,
                      placeText:
                    deathPlace.placeText
                    || ''
                  },
                  projectId
              )
              : normalizeGeneographPersonVital(existing?.death, projectId)
    };

    const diagram =
        selectedGeneographDiagram();

    if (!diagram || !projectId) return;

    const relativeConfiguration = collectGeneoRelativeConfiguration(relative);
    if (!relativeConfiguration || !geneoValidateRelativeConfiguration(relative, relativeConfiguration, existing || { id: '__new-relative', ...values })) return;
    const addAnother = Boolean(modalBackdrop.querySelector('#geneoPersonAddAnother')?.checked);

    geneoPushHistory();

    let createdNode = null;

    if (existing)
    {
        Object.assign(existing, values);

        if (existing.treePersonId)
        {
            existing.syncState = 'modified';
        }
        diagram.nodes
            .filter(
                node =>
                    node.type === 'person'
              && node.personId
                === existing.id
            )
            .forEach(
                node =>
                    ensureGeneographPersonCardSize(
                        node,
                        diagram
                    )
            );
    }
    else
    {
        const defaults =
            geneoNodeDefaults('person');

        const person = {
            id:
          createRuntimeId(
              'geneo-person'
          ),

            treePersonId: null,
            syncState: 'local',

            ...values,

            photoId: null,
            photoCrop: null,
            photoRegion: null
        };

        diagram.people.push(person);

        const personCard =
            geneoEmptyPersonCardOverrides(
                false,
                'manual'
            );

        const draftNode = {
            type: 'person',
            personId: person.id,
            width:
          defaults.width,
            height:
          defaults.height,
            personCard
        };

        const reference =
            geneoPersonCardReferenceSize(
                draftNode,
                diagram
            );

        const standardCard =
            geneoPersonCardEffectiveSettings(
                draftNode,
                diagram
            ).style === 'standard';

        draftNode.width =
            reference.width;

        draftNode.height =
            reference.height;

        const initialWidth =
            draftNode.width;

        const initialHeight =
            draftNode.height;

        const placement =
            anchorNode && relative
                ? geneoRelativeNodePlacement(
                    anchorNode,
                    relative.type,
                    initialWidth,
                    initialHeight
                )
                : {
                    ...nextGeneoObjectPosition(
                        initialWidth,
                        initialHeight
                    ),

                    parentPanelId: null
                };

        createdNode = {
            id:
          createRuntimeId(
              'geneo-node'
          ),

            type: 'person',
            personId: person.id,

            x: placement.x,
            y: placement.y,

            width:
          initialWidth,

            height:
          initialHeight,

            parentPanelId:
          placement.parentPanelId
          || null,

            order:
          Math.max(
              0,
              ...diagram.nodes.map(
                  item =>
                      item.order || 0
              )
          ) + 1,

            visible: true,
            locked: false,

            personCard,

            appearance: {
                ...defaults.appearance,
                paintOverrides: {
                    ...defaults.appearance.paintOverrides,
                    stroke: false
                },

                fill: {
                    color: '#173029',
                    opacity: 100,
                    enabled: true
                },

                stroke: {
                    color: '#62D99A',
                    opacity: 100,
                    enabled: !standardCard
                },

                strokeWidth: 2
            }
        };

        diagram.nodes.push(
            createdNode
        );

        if (anchorNode && relative)
        {
            connectGeneographCreatedRelative(
                anchorNode,
                createdNode,
                relative.type,
                relativeConfiguration
            );
        }

        selectGeneographNode(
            createdNode.id
        );
    }

    touchGeneographBoard();

    closeModal();

    renderGeneographEditorPreserveScroll();

    if (createdNode && addAnother && relative)
    {
        openGeneographPersonModal('', { relative: { ...relative,
            familySelection: relativeConfiguration.value === 'unknown-father'
                ? geneoRelativeFamilyDefault({ ...relative, familySelection: '' }) : relativeConfiguration.value,
            detailType: relativeConfiguration.detailType } });
        return;
    }

    if (createdNode)
    {
        requestAnimationFrame(() =>
        {
            main
                .querySelector(
                    `[data-geneo-node="${CSS.escape(createdNode.id)}"]`
                )
                ?.focus({ preventScroll: true });
        });
    }

    if (createdNode && relative)
    {
        showToast(
            `${
                capitalize(
                    geneoRelativeLabel(
                        relative.type
                    )
                )
            } added to the board.`
        );

        return;
    }

    showToast(
        existing
            ? 'Board person updated.'
            : 'Person added to board.'
    );
}

function bindGeneographPersonModal(personId = '', options = {})
{
    const form = modalBackdrop.querySelector('#geneoPersonForm');
    form?.addEventListener('toggle', event =>
    {
        if (event.target.matches('.geneo-relative-family'))
            event.target.querySelector('summary')?.setAttribute('aria-expanded', String(event.target.open));
    }, true);
    const statusButton = modalBackdrop.querySelector('#geneoPersonStatusButton');
    const statusMenu = modalBackdrop.querySelector('#geneoPersonStatusMenu');
    bindGenealogyDateFields(modalBackdrop);
    bindPlaceComboboxes(modalBackdrop);
    modalBackdrop.querySelector('#geneoRelativePartnerType')?.addEventListener('change', event =>
    {
        const section = modalBackdrop.querySelector('[data-geneo-relative-config]');
        updatePartnerRelationshipFields(section, event.target.value);
        const marriage = section.querySelector('[data-geneo-relative-marriage]');
        if (marriage) marriage.hidden = !partnerRelationshipDefinition(event.target.value).showsMarriageType;
    });
    modalBackdrop.querySelector('#geneoPersonGender')?.addEventListener('change', () =>
    {
        updateGeneographPersonModalConditionalFields();
        scheduleGeneographPersonPossibleMatchesRefresh(options);
    });
    statusButton?.addEventListener('click', event =>
    {
        event.stopPropagation();
        const open = Boolean(statusMenu?.hidden);
        if (statusMenu) statusMenu.hidden = !open;
        statusButton.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    statusMenu?.querySelectorAll('[data-geneo-person-status]').forEach(button => button.addEventListener('click', () =>
    {
        const status = button.dataset.geneoPersonStatus;
        modalBackdrop.querySelector('#geneoPersonLivingStatus').value = status;
        modalBackdrop.querySelector('#geneoPersonStatusLabel').textContent = status;
        const dot = modalBackdrop.querySelector('.add-person-status-current .add-person-status-dot');
        if (dot) dot.className = `add-person-status-dot ${statusDotClass(status)}`;
        statusMenu.hidden = true;
        statusButton.setAttribute('aria-expanded', 'false');
        statusMenu.querySelectorAll('[data-geneo-person-status]').forEach(option =>
        {
            const selected = option.dataset.geneoPersonStatus === status;
            option.classList.toggle('active', selected);
            option.setAttribute('aria-selected', selected ? 'true' : 'false');
            const check = option.querySelector('[data-status-check]');
            if (check) check.innerHTML = selected ? icon.check : '';
        });
        updateGeneographPersonModalConditionalFields({ clearDeath: true });
        scheduleGeneographPersonPossibleMatchesRefresh(options);
    }));

    bindGeneographPersonPossibleMatchCard(
        options
    );

    [
        '#geneoPersonFirstName',
        '#geneoPersonMiddleName',
        '#geneoPersonLastName',
        '#geneoPersonMaidenName',
        '#geneoPersonBirthDate',
        '#geneoPersonDeathDate',
        '#geneoPersonBirthPlace',
        '#geneoPersonDeathPlace'
    ].forEach(selector =>
    {
        const input =
            modalBackdrop.querySelector(
                selector
            );

        if (!input) return;

        input.addEventListener(
            'input',
            () =>
                scheduleGeneographPersonPossibleMatchesRefresh(
                    options
                )
        );

        input.addEventListener(
            'change',
            () =>
                scheduleGeneographPersonPossibleMatchesRefresh(
                    options
                )
        );
    });

    form?.addEventListener(
        'submit',
        event =>
        {
            event.preventDefault();

            saveGeneographPersonModal(
                personId,
                options
            );
        }
    );
    updateGeneographPersonModalConditionalFields();
}

function openGeneographPersonModal(
    personId = '',
    options = {}
)
{
    const person =
        personId
            ? getGeneographPerson(personId)
            : null;

    if (personId && !person) return;

    if (
        geneoPersonPossibleMatchState
            .refreshFrame
    )
    {
        cancelAnimationFrame(
            geneoPersonPossibleMatchState
                .refreshFrame
        );
    }

    geneoPersonPossibleMatchState = {
        selectedPersonId: '',
        refreshFrame: null
    };

    openModal(
        renderGeneographPersonModal(
            person,
            options
        )
    );

    bindGeneographPersonModal(
        person?.id || '',
        options
    );
}

function openAddGeneographPersonModal()
{
    openGeneographPersonModal('', { gender: geneoToolbarPersonGender() });
}

function resetGeneographImagePickerState()
{
    geneoImageUploadRequestId += 1;

    state.geneoImagePicker = {
        open: false,
        mode: 'add',
        nodeId: null,
        personId: null,
        originNodeId: null,
        originLocation: 'card',
        step: 'choose',
        avatarRegion: null,
        sourceTab: 'project',
        addView: 'results',
        albumScopeId: '',
        imageSort: 'name',
        imageFavoriteOnly: false,
        search: '',
        selectedProjectPhotoIds: [],
        uploadDrafts: [],
        addUploadsToAlbum: false,
        uploadAlbumId: '',
        uploadErrors: [],
        uploadBusy: false
    };
}

function geneoImagePickerProjectId()
{
    return selectedGeneographBoard()?.projectId || '';
}

function geneoImagePickerProjectPhotos()
{
    const projectId = geneoImagePickerProjectId();
    const query = state.geneoImagePicker.search
        .trim()
        .toLowerCase();

    return getProjectPhotos(projectId)
        .filter(photo => !photo.deletedAt)
        .filter(photo =>
            !query || photoSearchText(photo).includes(query)
        );
}

function geneoImagePickerSelectedProjectIds()
{
    return new Set(
        state.geneoImagePicker.selectedProjectPhotoIds || []
    );
}

function geneoImageUploadDraftAsPhoto(draft)
{
    if (!draft) return null;

    return {
        id: draft.id,
        kind: 'photo',
        title: geneoFilenameStem(draft.filename),
        filename: draft.filename,
        src: draft.src,
        mimeType: draft.mimeType,
        width: draft.width,
        height: draft.height,
        sizeBytes: draft.sizeBytes,

    };
}

function geneoImagePickerSelectedSources()
{
    const picker = state.geneoImagePicker;
    const projectId = geneoImagePickerProjectId();

    const projectSources = [
        ...geneoImagePickerSelectedProjectIds()
    ]
        .map(photoId =>
            getPhoto(photoId, { projectId })
        )
        .filter(photo => photo && !photo.deletedAt)
        .map(photo => ({
            scope: 'project',
            photo
        }));

    const uploadSources = (
        picker.uploadDrafts || []
    )
        .filter(photoUploadDraftIsValid)
        .map(draft => ({
            scope: 'board',
            photo: geneoImageUploadDraftAsPhoto(draft),
            draft
        }));

    /*
      * Replacement remains a single-source workflow. The active tab
      * determines whether the project photo or uploaded draft is used.
      */
    if (['replace', 'avatar'].includes(picker.mode))
    {
        return picker.sourceTab === 'upload'
            ? uploadSources.slice(0, 1)
            : projectSources.slice(0, 1);
    }

    /*
      * Add mode combines selections from both tabs so users can select
      * project photos, upload additional images, and add them together.
      */
    return [
        ...projectSources,
        ...uploadSources
    ];
}

function geneoImagePickerPendingCount()
{
    return geneoImagePickerSelectedSources().length;
}

function geneoImagePickerCountLabel(count)
{
    if (state.geneoImagePicker.mode === 'avatar') return count ? t('Photo selected') : t('No photo selected');
    if (!count) return t('No images selected');

    if (state.geneoImagePicker.mode === 'add' && state.language === 'ru')
    {
        return `Выбрано изображений: ${count}`;
    }

    return `${count} ${
        count === 1 ? 'image' : 'images'
    } selected`;
}

function geneoImagePickerActionLabel(count)
{
    if (state.geneoImagePicker.mode === 'avatar') return t('Adjust photo');
    if (state.geneoImagePicker.mode === 'replace')
    {
        return 'Replace image';
    }

    if (!count) return t('Add images');

    if (state.language === 'ru') return `Добавить изображений: ${count}`;

    return `Add ${count} ${
        count === 1 ? 'image' : 'images'
    }`;
}

function renderGeneographImageCandidate(photo)
{
    const selected =
        geneoImagePickerSelectedProjectIds().has(photo.id);

    const replacing =
        ['replace', 'avatar'].includes(state.geneoImagePicker.mode);

    const title = geneoImageRecordName(photo);

    const metadata = [
        photo.width && photo.height
            ? `${photo.width} × ${photo.height}`
            : '',
        formatPhotoDate(photo)
    ]
        .filter(Boolean)
        .join(' · ');

    const actionLabel = replacing
        ? `Use ${title}`
        : `${selected ? 'Deselect' : 'Select'} ${title}`;

    return `
        <button
          class="
            person-photo-candidate
            person-photos-adder-candidate
          "
          type="button"
          data-geneo-image-candidate="${escapeHtml(photo.id)}"
          aria-pressed="${selected}"
          aria-label="${escapeHtml(actionLabel)}">

          <span class="person-photo-candidate-preview">
            ${renderPhotoThumbnail(photo, {
                label: title
            })}

            <span
              class="person-photos-adder-check"
              data-geneo-image-candidate-check
              ${selected ? '' : 'hidden'}
              aria-hidden="true">
              ${icon.check}
            </span>
          </span>

          <span class="person-photo-candidate-copy">
            <strong>${escapeHtml(title)}</strong>
            <span>
              ${escapeHtml(metadata || 'Project photo')}
            </span>
          </span>
        </button>
      `;
}

function renderGeneographImageProjectResults()
{
    const allPhotos = getProjectPhotos(
        geneoImagePickerProjectId()
    ).filter(photo => !photo.deletedAt);

    const photos = geneoImagePickerProjectPhotos();
    const hasSearch = Boolean(
        state.geneoImagePicker.search.trim()
    );

    if (!allPhotos.length)
    {
        return `
          <div class="person-photo-empty">
            <div>
              <strong>No project photos yet.</strong>
              <span class="muted">
                Upload an image that will stay local to this board.
              </span>
              <button
                class="button primary"
                type="button"
                data-geneo-image-show-upload>
                Upload new image
              </button>
            </div>
          </div>
        `;
    }

    if (!photos.length)
    {
        return `
          <div class="person-photo-empty">
            <div>
              <strong>No matching project photos.</strong>

              <div class="person-photo-empty-actions">
                ${
                    hasSearch
                        ? `
                      <button
                        class="button secondary"
                        type="button"
                        data-geneo-image-clear-search>
                        Clear search
                      </button>
                    `
                        : ''
                }

                <button
                  class="button primary"
                  type="button"
                  data-geneo-image-show-upload>
                  Upload new image
                </button>
              </div>
            </div>
          </div>
        `;
    }

    return `
        <div class="person-photo-candidate-grid">
          ${photos.map(renderGeneographImageCandidate).join('')}
        </div>
      `;
}

function renderGeneographImageProjectPanel()
{
    return `
        <div class="person-photo-project-panel">
          <div class="person-photo-project-controls">
            <label
              class="search-input"
              aria-label="Search project photos">
              ${icon.search}

              <input
                type="search"
                data-geneo-image-search
                value="${escapeHtml(state.geneoImagePicker.search)}"
                placeholder="Search project photos">
            </label>
          </div>

          <div
            class="person-photo-project-results"
            data-geneo-image-project-results>
            ${renderGeneographImageProjectResults()}
          </div>
        </div>
      `;
}

function renderGeneographImageUploadDraft(draft)
{
    const photo = geneoImageUploadDraftAsPhoto(draft);
    const title = draft.filename || 'Uploaded image';

    if (state.geneoImagePicker.mode !== 'add')
    {
        return `<article class="person-photo-candidate person-photos-adder-upload-card">
          <span class="person-photo-candidate-preview">
            ${renderPhotoThumbnail(photo, { label: title })}
            <button class="person-photos-adder-upload-remove" type="button"
              data-geneo-image-remove-upload="${escapeHtml(draft.id)}"
              aria-label="${escapeHtml(`Remove ${title}`)}" title="Remove upload">${icon.close}</button>
          </span>
          <span class="person-photo-candidate-copy"><strong>${escapeHtml(title)}</strong>
            <span>${escapeHtml(`${draft.width} × ${draft.height} · ${formatMediaBytes(draft.sizeBytes)}`)}</span>
          </span>
        </article>`;
    }

    return `
        <article class="rp-upload-tile">
          <span class="rp-upload-tile-preview">
            ${renderPhotoThumbnail(photo, {
                label: title
            })}
          </span>
          <strong title="${escapeHtml(title)}">${escapeHtml(title)}</strong>
          <small>${escapeHtml(`${draft.width} × ${draft.height} · ${formatMediaBytes(draft.sizeBytes)}`)}</small>
          <button class="rp-upload-remove" type="button"
            data-geneo-image-remove-upload="${escapeHtml(draft.id)}"
            aria-label="${escapeHtml(`${t('Remove')}: ${title}`)}"
            ${state.geneoImagePicker.uploadBusy ? 'disabled' : ''}>${icon.close}</button>
        </article>
      `;
}

function renderGeneographImageUploadErrors()
{
    const errors =
        state.geneoImagePicker.uploadErrors || [];

    if (!errors.length) return '';

    return `
        <div
          class="person-photos-adder-upload-errors"
          role="alert">
          <strong>
            ${
                errors.length === 1
                    ? 'One file could not be added:'
                    : `${errors.length} files could not be added:`
            }
          </strong>

          <ul>
            ${errors
                .map(error => `
                <li>${escapeHtml(error)}</li>
              `)
                .join('')}
          </ul>
        </div>
      `;
}

function renderGeneographImageUploadPanel()
{
    const picker = state.geneoImagePicker;
    const drafts = picker.uploadDrafts || [];
    const replacing = ['replace', 'avatar'].includes(picker.mode);
    const adding = picker.mode === 'add';
    const albums = adding ? getProjectAlbums(geneoImagePickerProjectId()).filter(album => !album.deleted) : [];

    const maxMegabytes = Math.round(
        PHOTO_UPLOAD_MAX_BYTES / (1024 * 1024)
    );

    const promptTitle = replacing
        ? drafts.length
            ? 'Choose a different image'
            : 'Drop an image here'
        : drafts.length
            ? 'Add more images'
            : 'Drop images here';

    const chooseLabel = replacing
        ? drafts.length
            ? 'Choose a different image'
            : 'Choose image'
        : drafts.length
            ? 'Choose more images'
            : 'Choose images';

    if (adding)
    {
        const detail = state.language === 'ru'
            ? `JPEG, PNG или WebP, до ${maxMegabytes} МБ на файл.`
            : `JPEG, PNG, or WebP up to ${maxMegabytes} MB each.`;
        return `
          <div class="person-photo-picker-notice">${escapeHtml(state.language === 'ru'
                ? 'Без выбора альбома изображения будут доступны только на этой доске.'
                : 'Without an album, uploads stay local to this board and do not appear in Albums.')}</div>
          <div class="person-photos-adder-upload-panel">
            <div class="person-photo-upload-dropzone person-photos-adder-upload-dropzone upload-dropzone ${drafts.length ? 'has-drafts' : ''}"
              data-geneo-image-dropzone role="button" tabindex="0" aria-label="${escapeHtml(t('Choose photos'))}">
              <input type="file" accept="${PHOTO_UPLOAD_ALLOWED_TYPES.join(',')}" multiple data-geneo-image-file hidden>
              ${renderUploadDropzonePrompt(drafts.length ? 'Add more photos' : 'Choose photos', detail)}
            </div>
            ${renderGeneographImageUploadErrors()}
            ${drafts.length ? `<div class="rp-upload-tiles" aria-label="${escapeHtml(state.language === 'ru' ? 'Выбранные изображения' : 'Selected images')}">${drafts.map(renderGeneographImageUploadDraft).join('')}</div>` : ''}
            <div class="geneo-image-album-choice">
              <label><input type="checkbox" data-geneo-image-add-to-album
                ${picker.addUploadsToAlbum ? 'checked' : ''} ${albums.length ? '' : 'disabled'}>
                ${escapeHtml(t('Add to album'))}</label>
              ${albums.length ? `<select data-geneo-image-album aria-label="${escapeHtml(state.language === 'ru' ? 'Выберите альбом' : 'Choose album')}"
                ${picker.addUploadsToAlbum ? '' : 'hidden disabled'}>
                <option value="">${escapeHtml(state.language === 'ru' ? 'Выберите альбом' : 'Choose album')}</option>
                ${albums.map(album => `<option value="${escapeHtml(album.id)}" ${picker.uploadAlbumId === album.id ? 'selected' : ''}>${escapeHtml(album.title || album.name || '')}</option>`).join('')}
              </select>` : `<p>${escapeHtml(state.language === 'ru' ? 'Сначала создайте альбом в разделе «Альбомы».' : 'Create an album in Albums first.')}</p>`}
            </div>
          </div>`;
    }

    return `
        <div class="person-photo-picker-notice">
          ${
                replacing
                    ? 'This upload will be stored only inside this board and will not appear in Albums.'
                    : 'Uploaded images will stay local to this board and will not appear in Albums.'
            }
        </div>

        <div class="person-photos-adder-upload-panel">
          <div
            class="
              person-photo-upload-dropzone
              person-photos-adder-upload-dropzone
              ${drafts.length ? 'has-drafts' : ''}
            "
            data-geneo-image-dropzone>

            <input
              type="file"
              accept="${PHOTO_UPLOAD_ALLOWED_TYPES.join(',')}"
              ${replacing ? '' : 'multiple'}
              data-geneo-image-file
              hidden>

            <div class="person-photo-upload-prompt">
              ${icon.import}

              <strong>${promptTitle}</strong>

              <p>
                JPEG, PNG, or WebP up to
                ${maxMegabytes} MB each.
              </p>

              <button
                class="button primary"
                type="button"
                data-geneo-image-choose-file>
                ${chooseLabel}
              </button>
            </div>
          </div>

          ${renderGeneographImageUploadErrors()}

          ${
                drafts.length
                    ? `
                <div
                  class="
                    person-photo-candidate-grid
                    person-photos-adder-upload-grid
                  ">
                  ${drafts
                        .map(renderGeneographImageUploadDraft)
                        .join('')}
                </div>
              `
                    : ''
            }
        </div>
      `;
}

function renderGeneographAddImageResults()
{
    const picker = state.geneoImagePicker;
    const projectId = geneoImagePickerProjectId();
    const selected = geneoImagePickerSelectedProjectIds();
    let photos = getProjectPhotos(projectId).filter(photo => !photo.deletedAt);
    if (picker.addView === 'selected') photos = photos.filter(photo => selected.has(photo.id));
    if (picker.albumScopeId) photos = photos.filter(photo => (photo.albumIds || []).includes(picker.albumScopeId));
    if (picker.imageFavoriteOnly) photos = photos.filter(photo => photo.favorite);
    const query = picker.search.trim().toLowerCase();
    if (query) photos = photos.filter(photo => photoSearchText(photo).includes(query));
    photos.sort((a, b) => picker.imageSort === 'updated'
        ? String(b.updatedAt || '').localeCompare(String(a.updatedAt || ''))
        : picker.imageSort === 'date'
            ? String(formatPhotoDate(b)).localeCompare(String(formatPhotoDate(a)))
            : geneoImageRecordName(a).localeCompare(geneoImageRecordName(b), state.language === 'ru' ? 'ru' : 'en'));

    if (!photos.length)
    {
        if (picker.addView === 'selected' && picker.uploadDrafts.length) return '';
        return `<div class="rp-empty"><p>${escapeHtml(state.language === 'ru' ? 'Фотографии не найдены.' : 'No photos found.')}</p></div>`;
    }

    return `<div class="rp-results rp-photo-grid">${photos.map(photo =>
    {
        const title = geneoImageRecordName(photo);
        const checked = selected.has(photo.id);
        const meta = [photo.filename, photo.placeText].filter(Boolean).join(' · ');
        return `<article class="rp-record ${checked ? 'is-selected' : ''}">
          <label class="rp-record-select">
            <div class="rp-thumbnail">${renderPhotoThumbnail(photo, { label: title })}</div>
            <span class="rp-record-copy"><span class="rp-record-title"><strong title="${escapeHtml(title)}">${escapeHtml(title)}</strong></span>
              ${photo.caption ? `<span class="rp-description">${escapeHtml(photo.caption)}</span>` : ''}
              ${meta ? `<small title="${escapeHtml(meta)}">${escapeHtml(meta)}</small>` : ''}
            </span>
            <input type="checkbox" data-geneo-image-candidate="${escapeHtml(photo.id)}"
              aria-label="${escapeHtml(`${checked ? 'Deselect' : 'Select'} ${title}`)}" ${checked ? 'checked' : ''}>
          </label>
        </article>`;
    }).join('')}</div>`;
}

function renderGeneographAddImageModal({ focusSelector = '' } = {})
{
    const picker = state.geneoImagePicker;
    const count = geneoImagePickerPendingCount();
    const albumReady = !picker.addUploadsToAlbum || getProjectAlbums(geneoImagePickerProjectId())
        .some(album => album.id === picker.uploadAlbumId && !album.deleted);
    const albums = getProjectAlbums(geneoImagePickerProjectId()).filter(album => !album.deleted);
    const scope = albums.find(album => album.id === picker.albumScopeId);
    const view = picker.addView;
    const text = (en, ru) => escapeHtml(state.language === 'ru' ? ru : en);

    openModal(`<section class="modal resource-picker geneo-image-add-modal ${view === 'upload' ? `rp-upload-staging ${picker.uploadDrafts.length ? 'has-items' : ''}` : ''}" data-resource-picker="photos"
      data-geneo-image-picker role="dialog" aria-modal="true" aria-labelledby="geneoImagePickerTitle">
      <header class="modal-header"><div><h2 id="geneoImagePickerTitle">${escapeHtml(t('Add images'))}</h2>
        <p>${escapeHtml(t('Select project photos, upload new images, or combine both sources in one addition.'))}</p></div>
        <button type="button" class="close-button" data-close aria-label="${text('Close', 'Закрыть')}">${icon.close}</button>
      </header>
      <div class="rp-toolbar">
        <button type="button" class="button secondary" data-geneo-image-browse>${icon.folder}<span>${text('Browse', 'Обзор')}</span></button>
        <label class="rp-search">${icon.search}<input type="search" data-geneo-image-search
          value="${escapeHtml(picker.search)}" aria-label="${text('Search', 'Поиск')}" placeholder="${text('Search', 'Поиск')}"></label>
        <button type="button" class="icon-button ${picker.imageFavoriteOnly ? 'is-active' : ''}"
          data-geneo-image-filter aria-label="${text('Show favorites', 'Показать избранное')}" title="${text('Show favorites', 'Показать избранное')}">${icon.filter || icon.settings}</button>
        <div class="rp-sort">${icon.sortLines}<select data-geneo-image-sort aria-label="${text('Sort', 'Сортировка')}">
          <option value="name" ${picker.imageSort === 'name' ? 'selected' : ''}>${text('Name', 'Название')}</option>
          <option value="updated" ${picker.imageSort === 'updated' ? 'selected' : ''}>${text('Recently updated', 'Недавно изменённые')}</option>
          <option value="date" ${picker.imageSort === 'date' ? 'selected' : ''}>${text('Photo date', 'Дата фотографии')}</option>
        </select><span class="rp-sort-chevron" aria-hidden="true">${icon.chevron}</span></div>
        <button type="button" class="button secondary rp-create" data-geneo-image-show-upload>${icon.plus}<span>${text('Upload photos', 'Загрузить фотографии')}</span></button>
      </div>
      <nav class="rp-path" aria-label="${text('Location', 'Расположение')}">
        <span class="rp-path-icon" aria-hidden="true">${icon.folder}</span>
        <span aria-current="page">${view === 'upload' ? text('Upload photos', 'Загрузить фотографии') : view === 'browse' ? text('Browse', 'Обзор') : view === 'selected' ? text('Selected', 'Выбрано') : escapeHtml(scope?.title || scope?.name || (state.language === 'ru' ? 'Все фотографии' : 'All photos'))}</span>
      </nav>
      <div class="rp-content" tabindex="-1">
        ${view === 'upload' ? renderGeneographImageUploadPanel()
            : view === 'browse' ? `<div class="rp-scopes"><button type="button" class="rp-scope" data-geneo-image-scope="">${icon.folder}<span>${text('All photos', 'Все фотографии')}</span>${icon.chevron}</button>
                ${albums.map(album => `<button type="button" class="rp-scope" data-geneo-image-scope="${escapeHtml(album.id)}">${icon.folder}<span>${escapeHtml(album.title || album.name || '')}</span>${icon.chevron}</button>`).join('')}</div>`
            : `<div data-geneo-image-project-results>${renderGeneographAddImageResults()}</div>
                ${view === 'selected' && picker.uploadDrafts.length ? `<section class="geneo-image-selected-uploads">
                  <h3>${text('Uploaded images', 'Загруженные изображения')}</h3>
                  <div class="rp-upload-tiles">${picker.uploadDrafts.map(renderGeneographImageUploadDraft).join('')}</div>
                </section>` : ''}`}
      </div>
      <footer class="modal-footer">
        <button type="button" class="rp-selected" data-geneo-image-selected ${count ? '' : 'disabled'}>${text('Selected', 'Выбрано')} (${count}) ${icon.chevron}</button>
        <div class="rp-footer-actions"><button type="button" class="button secondary" data-close>${escapeHtml(t('Cancel'))}</button>
          <button type="button" class="button primary" data-geneo-image-confirm ${count && !picker.uploadBusy && albumReady ? '' : 'disabled'}>${escapeHtml(geneoImagePickerActionLabel(count))}</button></div>
      </footer>
    </section>`);
    bindGeneographImagePickerModal();
    bindGeneographAddImageModal();
    if (focusSelector) requestAnimationFrame(() => modalBackdrop.querySelector(focusSelector)?.focus());
}

function renderGeneographImagePickerModal({
    focusSelector = ''
} = {})
{
    const picker = state.geneoImagePicker;
    if (!picker.open) return;
    if (picker.mode === 'add')
    {
        renderGeneographAddImageModal({ focusSelector });
        return;
    }
    if (picker.mode === 'avatar' && picker.step === 'adjust')
    {
        renderGeneographAvatarAdjustModal();
        return;
    }

    const replacing = ['replace', 'avatar'].includes(picker.mode);
    const avatarMode = picker.mode === 'avatar';
    const boardPerson = avatarMode ? getGeneographPerson(picker.personId) : null;
    const canRemove = Boolean(boardPerson?.photoId || boardPerson?.photoAssetId);
    const count = geneoImagePickerPendingCount();
    const albumReady = !picker.addUploadsToAlbum || (picker.uploadAlbumId &&
        getProjectAlbums(geneoImagePickerProjectId()).some(album => album.id === picker.uploadAlbumId && !album.deleted));
    const canConfirm = count > 0 && !picker.uploadBusy && albumReady;

    openModal(`
        <div
          class="
            modal
            person-photo-picker-modal
            geneo-image-picker-modal
            ${picker.mode === 'add' ? 'rp-upload-staging geneo-image-add-modal' : ''}
            ${picker.mode === 'add' && picker.uploadDrafts.length ? 'has-items' : ''}
          "
          data-geneo-image-picker
          role="dialog"
          aria-modal="true"
          aria-labelledby="geneoImagePickerTitle">

          <div class="modal-header">
            <div>
              <h2 id="geneoImagePickerTitle">
                 ${avatarMode ? escapeHtml(t('Change photo for {name}').replace('{name}', geneoPersonDisplayName(boardPerson))) : replacing ? 'Replace image' : escapeHtml(t('Add images'))}
              </h2>

              <p>
                ${
                    avatarMode
                        ? escapeHtml(t('This photo will appear only on this board.'))
                        : replacing
                        ? 'Choose one project photo or upload a replacement stored locally in this board.'
                        : escapeHtml(t('Select project photos, upload new images, or combine both sources in one addition.'))
                }
              </p>
            </div>

            <button
              class="close-button"
              type="button"
              ${avatarMode ? 'data-geneo-avatar-cancel' : 'data-close'}
              aria-label="${avatarMode ? escapeHtml(t('Close')) : 'Close'}">
              ${icon.close}
            </button>
          </div>

          <div
            class="
              modal-body
              person-photo-picker-body
            ">
            ${avatarMode ? `<div class="person-photo-picker-step" aria-label="${escapeHtml(t('Choose photo'))}">${escapeHtml(t('Choose photo'))}</div>` : ''}
            <div
              class="person-photo-picker-tabs"
              role="tablist"
              aria-label="${escapeHtml(avatarMode ? t('Avatar source') : t('Image source'))}">

              <button
                class="person-photo-picker-tab"
                type="button"
                role="tab"
                data-geneo-image-tab="project"
                aria-selected="${
                    picker.sourceTab
                  === 'project'
                }">
                 ${escapeHtml(t('Project photos'))}
              </button>

              <button
                class="person-photo-picker-tab"
                type="button"
                role="tab"
                data-geneo-image-tab="upload"
                aria-selected="${
                    picker.sourceTab
                  === 'upload'
                }">
                 ${escapeHtml(t('Upload new'))}
              </button>
            </div>

            <div
              role="tabpanel"
              aria-label="${
                    picker.sourceTab
                === 'project'
                        ? 'Project photos'
                        : 'Upload new images'
                }">
              ${
                    picker.sourceTab
                === 'project'
                        ? renderGeneographImageProjectPanel()
                        : renderGeneographImageUploadPanel()
                }
            </div>
          </div>

          <div
            class="
              modal-footer
              person-photos-adder-footer
              geneo-image-picker-footer
            "
            data-geneo-image-footer
            ${
                 count > 0 || canRemove || avatarMode || picker.mode === 'add'
                    ? ''
                    : 'hidden'
            }>

            <span
              class="person-photos-adder-count"
              data-geneo-image-count>
              ${escapeHtml(
                    geneoImagePickerCountLabel(
                        count
                    )
                )}
            </span>

            <div class="modal-footer-actions">
              ${canRemove ? `<button class="button ghost" type="button" data-geneo-avatar-remove>${escapeHtml(t('Remove board photo'))}</button>` : ''}
              <button
                class="button secondary"
                type="button"
                 ${avatarMode ? 'data-geneo-avatar-cancel' : 'data-close'}>
                 ${avatarMode ? escapeHtml(t('Cancel')) : 'Cancel'}
              </button>

              <button
                class="button primary"
                type="button"
                data-geneo-image-confirm
                ${
                    canConfirm
                        ? ''
                        : 'disabled'
                }>
                ${
                    picker.uploadBusy
                        ? 'Preparing images…'
                        : escapeHtml(
                            geneoImagePickerActionLabel(
                                count
                            )
                        )
                }
              </button>
            </div>
          </div>
        </div>
      `);

    bindGeneographImagePickerModal();

    if (focusSelector)
    {
        requestAnimationFrame(() =>
        {
            modalBackdrop
                .querySelector(focusSelector)
                ?.focus();
        });
    }
}

function refreshGeneographImagePickerSelectionUi()
{
    const modal = modalBackdrop.querySelector(
        '[data-geneo-image-picker]'
    );

    if (!modal) return;

    const picker = state.geneoImagePicker;
    const selectedIds =
        geneoImagePickerSelectedProjectIds();

    modal
        .querySelectorAll('[data-geneo-image-candidate]')
        .forEach(card =>
        {
            const photoId =
                card.dataset.geneoImageCandidate;

            const selected =
                selectedIds.has(photoId);

            card.setAttribute(
                'aria-pressed',
                String(selected)
            );

            if (card.matches('input[type="checkbox"]'))
            {
                card.checked = selected;
                card.closest('.rp-record')?.classList.toggle('is-selected', selected);
            }

            const title =
                card.querySelector(
                    '.person-photo-candidate-copy strong'
                )?.textContent
                || card.closest('.rp-record')?.querySelector('.rp-record-copy strong')?.textContent
                || 'image';

            card.setAttribute(
                'aria-label',
                ['replace', 'avatar'].includes(picker.mode)
                    ? `Use ${title}`
                    : `${selected ? 'Deselect' : 'Select'} ${title}`
            );

            const check = card.querySelector(
                '[data-geneo-image-candidate-check]'
            );

            if (check)
            {
                check.hidden = !selected;
            }
        });

    const count = geneoImagePickerPendingCount();

    const footer =
        modal.querySelector(
            '[data-geneo-image-footer]'
        );

    if (footer)
    {
        footer.hidden =
            count === 0 && !['avatar', 'add'].includes(picker.mode);
    }

    const countElement = modal.querySelector(
        '[data-geneo-image-count]'
    );

    if (countElement)
    {
        countElement.textContent =
            geneoImagePickerCountLabel(count);
    }

    const selectedButton = modal.querySelector('[data-geneo-image-selected]');
    if (selectedButton)
    {
        selectedButton.innerHTML = `${state.language === 'ru' ? 'Выбрано' : 'Selected'} (${count}) ${icon.chevron}`;
        selectedButton.disabled = count === 0;
    }

    const confirmButton = modal.querySelector(
        '[data-geneo-image-confirm]'
    );

    if (confirmButton)
    {
        confirmButton.disabled =
            count === 0 || picker.uploadBusy || (picker.addUploadsToAlbum &&
                !getProjectAlbums(geneoImagePickerProjectId()).some(album => album.id === picker.uploadAlbumId && !album.deleted));

        confirmButton.textContent =
            picker.uploadBusy
                ? 'Preparing images…'
                : geneoImagePickerActionLabel(count);
    }
}

function bindGeneographImageProjectResultActions(
    root = modalBackdrop
)
{
    root
        .querySelectorAll('[data-geneo-image-candidate]')
        .forEach(button =>
        {
            button.addEventListener('click', () =>
            {
                const photoId =
                    button.dataset.geneoImageCandidate;

                const selectedIds =
                    geneoImagePickerSelectedProjectIds();

                if (['replace', 'avatar'].includes(state.geneoImagePicker.mode))
                {
                    selectedIds.clear();
                    selectedIds.add(photoId);
                }
                else if (selectedIds.has(photoId))
                {
                    selectedIds.delete(photoId);
                }
                else
                {
                    selectedIds.add(photoId);
                }

                state.geneoImagePicker
                    .selectedProjectPhotoIds = [
                        ...selectedIds
                    ];

                /*
            * Update the cards and footer in place. Reopening the modal
            * here would reset its internal scroll position.
            */
                refreshGeneographImagePickerSelectionUi();
            });
        });

    root
        .querySelector('[data-geneo-image-clear-search]')
        ?.addEventListener('click', () =>
        {
            state.geneoImagePicker.search = '';

            renderGeneographImagePickerModal({
                focusSelector: '[data-geneo-image-search]'
            });
        });

    root
        .querySelectorAll('[data-geneo-image-show-upload]')
        .forEach(button =>
        {
            button.addEventListener('click', () =>
            {
                state.geneoImagePicker.sourceTab = 'upload';
                if (state.geneoImagePicker.mode === 'add') state.geneoImagePicker.addView = 'upload';

                renderGeneographImagePickerModal({
                    focusSelector:
                state.geneoImagePicker.mode === 'add' ? '[data-geneo-image-dropzone]' : '[data-geneo-image-choose-file]'
                });
            });
        });
}

function updateGeneographImageProjectResults()
{
    const host = modalBackdrop.querySelector(
        '[data-geneo-image-project-results]'
    );

    if (!host) return;

    host.innerHTML = state.geneoImagePicker.mode === 'add'
        ? renderGeneographAddImageResults()
        : renderGeneographImageProjectResults();
    bindGeneographImageProjectResultActions(host);
}

async function processGeneographImageUploads(fileList)
{
    const picker = state.geneoImagePicker;

    if (!picker.open) return;

    const replacing = ['replace', 'avatar'].includes(picker.mode);

    let files = Array.from(fileList || [])
        .filter(Boolean);

    if (replacing)
    {
        files = files.slice(0, 1);
    }
    else
    {
        const knownSignatures = new Set(
            (picker.uploadDrafts || [])
                .map(draft => draft.signature)
        );

        files = files.filter(file =>
        {
            const signature =
                photoUploadFileSignature(file);

            if (knownSignatures.has(signature))
            {
                return false;
            }

            knownSignatures.add(signature);
            return true;
        });
    }

    if (!files.length) return;

    const requestId =
        ++geneoImageUploadRequestId;

    picker.uploadBusy = true;
    picker.uploadErrors = [];

    refreshGeneographImagePickerSelectionUi();

    const results = await Promise.all(
        files.map(async file =>
        {
            try
            {
                return {
                    draft: await createPhotoUploadDraft(
                        file,
                        {
                            idPrefix:
                    'geneo-image-upload-draft'
                        }
                    ),
                    error: ''
                };
            }
            catch (error)
            {
                return {
                    draft: null,
                    error:
                error?.message
                || `${file.name || 'File'} — could not be read`
                };
            }
        })
    );

    if (
        requestId !== geneoImageUploadRequestId
        || !state.geneoImagePicker.open
    )
    {
        return;
    }

    const drafts = results
        .map(result => result.draft)
        .filter(Boolean);

    if (replacing)
    {
        /*
        * An invalid replacement should not discard a previously
        * prepared valid draft.
        */
        if (drafts.length)
        {
            picker.uploadDrafts = [drafts[0]];
        }
    }
    else
    {
        picker.uploadDrafts = [
            ...picker.uploadDrafts,
            ...drafts
        ];
    }

    picker.uploadErrors = results
        .map(result =>
        {
            if (!result.error || picker.mode !== 'avatar') return result.error;
            if (result.error.includes('unsupported file type')) return t('Use a JPEG, PNG, or WebP photo.');
            if (result.error.includes('larger than')) return t('Photo must be smaller than 20 MB.');
            return t('Could not read this photo. Choose another file.');
        })
        .filter(Boolean);

    picker.uploadBusy = false;

    renderGeneographImagePickerModal({
        focusSelector:
          picker.mode === 'add' ? '[data-geneo-image-dropzone]' : '[data-geneo-image-choose-file]'
    });
}

function geneoImageBatchLayout(
    selections,
    diagram
)
{
    const items = selections.map(selection => ({
        selection,
        size: geneoImageNodeSize(selection.photo)
    }));

    if (items.length === 1)
    {
        const { width, height } = items[0].size;

        return [{
            ...items[0],
            position:
            nextGeneoObjectPosition(width, height)
        }];
    }

    const gap = 24;
    const columns = Math.min(
        4,
        Math.ceil(Math.sqrt(items.length))
    );

    const rows = Math.ceil(
        items.length / columns
    );

    const cellWidth =
        Math.max(...items.map(item => item.size.width))
        + gap;

    const cellHeight =
        Math.max(...items.map(item => item.size.height))
        + gap;

    const center =
        geneoCurrentViewportCenter()
        || geneoContentCenter();

    const baseX =
        center.x - (columns * cellWidth - gap) / 2;

    const baseY =
        center.y - (rows * cellHeight - gap) / 2;

    const basePositions = items.map((item, index) =>
    {
        const column = index % columns;
        const row = Math.floor(index / columns);

        return {
            x:
            baseX
            + column * cellWidth
            + (cellWidth - gap - item.size.width) / 2,

            y:
            baseY
            + row * cellHeight
            + (cellHeight - gap - item.size.height) / 2
        };
    });

    const existingNodes = diagram.nodes || [];

    const overlapsExistingNode = offset =>
        basePositions.some((position, index) =>
        {
            const width = items[index].size.width;
            const height = items[index].size.height;

            const candidate = {
                x: position.x + offset.x,
                y: position.y + offset.y
            };

            return existingNodes.some(node =>
                candidate.x < node.x + node.width + 18
            && candidate.x + width + 18 > node.x
            && candidate.y < node.y + node.height + 18
            && candidate.y + height + 18 > node.y
            );
        });

    const step = Math.max(
        80,
        Math.round(
            Math.min(cellWidth, cellHeight) / 2
        )
    );

    const offsets = [{ x: 0, y: 0 }];

    for (let ring = 1; ring <= 12; ring += 1)
    {
        const distance = ring * step;

        offsets.push(
            { x: distance, y: 0 },
            { x: distance, y: distance },
            { x: 0, y: distance },
            { x: -distance, y: distance },
            { x: -distance, y: 0 },
            { x: -distance, y: -distance },
            { x: 0, y: -distance },
            { x: distance, y: -distance }
        );
    }

    const offset =
        offsets.find(candidate =>
            !overlapsExistingNode(candidate)
        )
        || offsets[0];

    return items.map((item, index) => ({
        ...item,
        position: {
            x: basePositions[index].x + offset.x,
            y: basePositions[index].y + offset.y
        }
    }));
}

function applyGeneographImagePickerSelection()
{
    const picker = state.geneoImagePicker;
    const selections =
        geneoImagePickerSelectedSources();

    const diagram =
        selectedGeneographDiagram();

    if (
        !picker.open
        || !selections.length
        || !diagram
        || picker.uploadBusy
    )
    {
        return;
    }

    const targetAlbum = picker.mode === 'add' && picker.addUploadsToAlbum
        ? getProjectAlbums(geneoImagePickerProjectId()).find(album => album.id === picker.uploadAlbumId && !album.deleted)
        : null;
    if (picker.mode === 'add' && picker.addUploadsToAlbum && !targetAlbum) return;

    if (targetAlbum)
    {
        for (const source of selections.filter(item => item.scope === 'board'))
        {
            const photo = createMediaFromPhotoUpload({
                projectId: geneoImagePickerProjectId(),
                draft: source.draft,
                idPrefix: 'geneo-album-photo'
            });
            if (!photo) return;
            photo.albumIds = [targetAlbum.id];
            source.scope = 'project';
            source.photo = photo;
        }
        touchProjectModified(sampleData.projects.find(project => project.id === geneoImagePickerProjectId()));
    }

    const replacing =
        picker.mode === 'replace';

    const existingNode = replacing
        ? getGeneographNode(picker.nodeId)
        : null;
    let focusNodeId = existingNode?.id || '';

    if (
        replacing
        && existingNode?.type !== 'image'
    )
    {
        return;
    }

    const selection = selections[0];
    const currentRef = existingNode?.imageRef;

    if (
        replacing
        && selection.scope === 'project'
        && currentRef?.scope === 'project'
        && currentRef.id === selection.photo.id
    )
    {
        resetGeneographImagePickerState();
        closeModal({ force: true });
        return;
    }

    geneoPushHistory();

    const createImageRef = source =>
    {
        if (source.scope === 'board')
        {
            const asset = createGeneographBoardAsset(
                source.draft,
                diagram
            );

            return asset
                ? {
                    scope: 'board',
                    id: asset.id
                }
                : null;
        }

        return {
            scope: 'project',
            id: source.photo.id
        };
    };

    if (replacing)
    {
        const imageRef =
            createImageRef(selection);

        if (!imageRef) return;

        existingNode.imageRef = imageRef;
        existingNode.imageCrop = null;
        delete existingNode.photoId;
        delete existingNode.title;
    }
    else
    {
        const defaults =
            geneoNodeDefaults('image');

        const layout =
            geneoImageBatchLayout(
                selections,
                diagram
            );

        let nextOrder =
            Math.max(
                0,
                ...diagram.nodes.map(
                    item => item.order || 0
                )
            );

        const addedNodeIds = [];

        layout.forEach(item =>
        {
            const imageRef =
                createImageRef(item.selection);

            if (!imageRef) return;

            nextOrder += 1;

            const node = {
                id: createRuntimeId('geneo-node'),
                type: 'image',
                imageRef,
                ...item.position,
                width: item.size.width,
                height: item.size.height,
                parentPanelId: null,
                order: nextOrder,
                visible: true,
                locked: false,
                appearance: {
                    ...defaults.appearance
                }
            };

            diagram.nodes.push(node);
            addedNodeIds.push(node.id);
        });

        if (!addedNodeIds.length) return;

        setGeneographNodeSelection(
            addedNodeIds,
            addedNodeIds.at(-1)
        );
        focusNodeId = addedNodeIds.at(-1) || '';
    }

    pruneGeneographBoardAssets(diagram);
    touchGeneographBoard();

    const addedCount = replacing
        ? 1
        : selections.length;

    const message = replacing
        ? 'Image replaced.'
        : `${addedCount} ${
            addedCount === 1 ? 'image' : 'images'
        } added to the board.`;

    resetGeneographImagePickerState();
    closeModal({ force: true });

    renderGeneographEditorPreserveScroll({
        preserveInspectorScroll: replacing
    });

    if (focusNodeId)
    {
        requestAnimationFrame(() =>
        {
            main
                .querySelector(
                    `[data-geneo-node="${CSS.escape(focusNodeId)}"]`
                )
                ?.focus({ preventScroll: true });
        });
    }

    showToast(message);
}

function bindGeneographImagePickerModal()
{
    if (state.geneoImagePicker.mode === 'avatar')
    {
        modalBackdrop.querySelectorAll('[data-geneo-avatar-cancel]').forEach(button =>
            button.addEventListener('click', cancelGeneographAvatarPicker));
        modalBackdrop.querySelector('[data-geneo-avatar-remove]')?.addEventListener('click', removeGeneographAvatarPhoto);
    }
    modalBackdrop
        .querySelectorAll('[data-geneo-image-tab]')
        .forEach(button =>
        {
            button.addEventListener('click', () =>
            {
                state.geneoImagePicker.sourceTab =
                    button.dataset.geneoImageTab;

                state.geneoImagePicker.uploadErrors = [];

                renderGeneographImagePickerModal({
                    focusSelector:
                `[data-geneo-image-tab="${button.dataset.geneoImageTab}"]`
                });
            });

            button.addEventListener('keydown', event =>
            {
                if (
                    !['ArrowLeft', 'ArrowRight']
                        .includes(event.key)
                )
                {
                    return;
                }

                event.preventDefault();

                state.geneoImagePicker.sourceTab =
                    state.geneoImagePicker.sourceTab === 'project'
                        ? 'upload'
                        : 'project';

                renderGeneographImagePickerModal({
                    focusSelector:
                `[data-geneo-image-tab="${state.geneoImagePicker.sourceTab}"]`
                });
            });
        });

    modalBackdrop
        .querySelector('[data-geneo-image-search]')
        ?.addEventListener('input', event =>
        {
            state.geneoImagePicker.search =
                event.target.value;

            if (state.geneoImagePicker.mode === 'add'
                && !['results', 'selected'].includes(state.geneoImagePicker.addView))
            {
                state.geneoImagePicker.addView = 'results';
                renderGeneographImagePickerModal({ focusSelector: '[data-geneo-image-search]' });
                return;
            }

            updateGeneographImageProjectResults();
        });

    bindGeneographImageProjectResultActions(
        modalBackdrop
    );

    const fileInput = modalBackdrop.querySelector(
        '[data-geneo-image-file]'
    );

    const albumCheckbox = modalBackdrop.querySelector('[data-geneo-image-add-to-album]');
    const albumSelect = modalBackdrop.querySelector('[data-geneo-image-album]');
    albumCheckbox?.addEventListener('change', () =>
    {
        state.geneoImagePicker.addUploadsToAlbum = albumCheckbox.checked;
        if (albumSelect)
        {
            albumSelect.hidden = !albumCheckbox.checked;
            albumSelect.disabled = !albumCheckbox.checked;
        }
        refreshGeneographImagePickerSelectionUi();
    });
    albumSelect?.addEventListener('change', () =>
    {
        state.geneoImagePicker.uploadAlbumId = albumSelect.value;
        refreshGeneographImagePickerSelectionUi();
    });

    if (state.geneoImagePicker.mode === 'add')
    {
        bindUploadDropzoneChooser(modalBackdrop.querySelector('[data-geneo-image-dropzone]'), fileInput);
    }

    modalBackdrop
        .querySelector('[data-geneo-image-choose-file]')
        ?.addEventListener('click', () =>
        {
            fileInput?.click();
        });

    fileInput?.addEventListener('change', () =>
    {
        processGeneographImageUploads(
            fileInput.files
        );
    });

    modalBackdrop
        .querySelectorAll(
            '[data-geneo-image-remove-upload]'
        )
        .forEach(button =>
        {
            button.addEventListener('click', () =>
            {
                const draftId =
                    button.dataset.geneoImageRemoveUpload;

                state.geneoImagePicker.uploadDrafts =
                    state.geneoImagePicker.uploadDrafts
                        .filter(draft =>
                            draft.id !== draftId
                        );

                state.geneoImagePicker.uploadErrors = [];

                renderGeneographImagePickerModal({
                    focusSelector:
                state.geneoImagePicker.mode === 'add' ? '[data-geneo-image-dropzone]' : '[data-geneo-image-choose-file]'
                });
            });
        });

    const dropzone = modalBackdrop.querySelector(
        '[data-geneo-image-dropzone]'
    );

    if (dropzone)
    {
        ['dragenter', 'dragover'].forEach(type =>
        {
            dropzone.addEventListener(type, event =>
            {
                event.preventDefault();

                dropzone.classList.add(
                    'is-dragging'
                );
            });
        });

        ['dragleave', 'drop'].forEach(type =>
        {
            dropzone.addEventListener(type, event =>
            {
                event.preventDefault();

                dropzone.classList.remove(
                    'is-dragging'
                );
            });
        });

        dropzone.addEventListener('drop', event =>
        {
            processGeneographImageUploads(
                event.dataTransfer?.files
            );
        });
    }

    modalBackdrop
        .querySelector('[data-geneo-image-confirm]')
        ?.addEventListener(
            'click',
            state.geneoImagePicker.mode === 'avatar'
                ? advanceGeneographAvatarPicker
                : applyGeneographImagePickerSelection
        );
}

function bindGeneographAddImageModal()
{
    const picker = state.geneoImagePicker;
    modalBackdrop.querySelector('[data-geneo-image-browse]')?.addEventListener('click', () =>
    {
        picker.addView = picker.addView === 'browse' ? 'results' : 'browse';
        renderGeneographImagePickerModal({ focusSelector: '[data-geneo-image-browse]' });
    });
    modalBackdrop.querySelector('[data-geneo-image-selected]')?.addEventListener('click', () =>
    {
        picker.addView = picker.addView === 'selected' ? 'results' : 'selected';
        renderGeneographImagePickerModal({ focusSelector: '[data-geneo-image-selected]' });
    });
    modalBackdrop.querySelectorAll('[data-geneo-image-scope]').forEach(button =>
        button.addEventListener('click', () =>
        {
            picker.albumScopeId = button.dataset.geneoImageScope;
            picker.addView = 'results';
            renderGeneographImagePickerModal({ focusSelector: '[data-geneo-image-search]' });
        }));
    modalBackdrop.querySelector('[data-geneo-image-filter]')?.addEventListener('click', () =>
    {
        picker.imageFavoriteOnly = !picker.imageFavoriteOnly;
        renderGeneographImagePickerModal({ focusSelector: '[data-geneo-image-filter]' });
    });
    modalBackdrop.querySelector('[data-geneo-image-sort]')?.addEventListener('change', event =>
    {
        picker.imageSort = event.target.value;
        updateGeneographImageProjectResults();
    });
}

function geneoAvatarCropToRegion(value, photo)
{
    const crop = normalizePersonPhotoCrop(value);
    const aspect = (Number(photo?.width) || 1) / (Number(photo?.height) || 1);
    const width = Math.min(1, 1 / aspect) / crop.zoom;
    const height = Math.min(1, aspect) / crop.zoom;
    return normalizeFaceRegion({
        x: .5 + (crop.centerX - .5) * width - width / 2,
        y: .5 + (crop.centerY - .5) * height - height / 2,
        width, height
    }, FACE_REGION_MIN);
}

function geneoAvatarPickerSelection()
{
    return geneoImagePickerSelectedSources()[0] || null;
}

function geneoAvatarPickerRestoreFocus(picker)
{
    if (!picker?.originNodeId) return;
    requestAnimationFrame(() => main.querySelector(
        `[data-geneo-avatar-node="${CSS.escape(picker.originNodeId)}"][data-geneo-avatar-location="${picker.originLocation}"]`
    )?.focus({ preventScroll: true }));
}

function closeGeneographAvatarPicker({ render = false } = {})
{
    const picker = { ...state.geneoImagePicker };
    resetGeneographImagePickerState();
    closeModal({ force: true });
    if (render) renderGeneographEditorPreserveScroll({ preserveInspectorScroll: true, preserveSidebarScroll: true });
    geneoAvatarPickerRestoreFocus(picker);
}

function cancelGeneographAvatarPicker()
{
    closeGeneographAvatarPicker();
}

function advanceGeneographAvatarPicker()
{
    const picker = state.geneoImagePicker;
    const selection = geneoAvatarPickerSelection();
    if (picker.mode !== 'avatar' || !selection || picker.uploadBusy) return;
    const person = getGeneographPerson(picker.personId);
    if (!person) return;
    const sameSource = selection.scope === 'project'
        ? person.photoId === selection.photo.id
        : person.photoAssetId === selection.draft?.id;
    picker.avatarRegion = sameSource
        ? normalizeFaceRegion(person.photoRegion, FACE_REGION_MIN)
            || (person.photoCrop ? geneoAvatarCropToRegion(person.photoCrop, selection.photo) : { ...FACE_REGION_DEFAULT })
        : { ...FACE_REGION_DEFAULT };
    picker.step = 'adjust';
    renderGeneographAvatarAdjustModal();
}

function renderGeneographAvatarAdjustModal()
{
    const picker = state.geneoImagePicker;
    const selection = geneoAvatarPickerSelection();
    const person = getGeneographPerson(picker.personId);
    if (!selection || !person) return;
    const photo = selection.photo;
    const region = normalizeFaceRegion(picker.avatarRegion, FACE_REGION_MIN) || { ...FACE_REGION_DEFAULT };
    picker.avatarRegion = region;
    const preview = () => renderPersonPhotoRegionMedia(photo, region);
    openModal(`<div class="modal person-photo-picker-modal geneo-avatar-picker-modal" data-geneo-image-picker data-geneo-avatar-adjust role="dialog" aria-modal="true" aria-labelledby="geneoAvatarAdjustTitle">
      <div class="modal-header"><div><h2 id="geneoAvatarAdjustTitle">${escapeHtml(t('Change photo for {name}').replace('{name}', geneoPersonDisplayName(person)))}</h2><p>${escapeHtml(t('This photo will appear only on this board.'))}</p></div>
        <button class="close-button" type="button" data-geneo-avatar-cancel aria-label="${escapeHtml(t('Close'))}">${icon.close}</button></div>
      <div class="modal-body person-photo-picker-body">
        <div class="person-photo-picker-step" aria-label="${escapeHtml(t('Adjust photo'))}">${escapeHtml(t('Adjust photo'))}</div>
        <div class="person-photo-adjust-layout">
          <div class="person-photo-crop-column">
            ${renderFaceRegionSelector(photo, region)}
            <p class="person-photo-crop-hint">${escapeHtml(t('Drag to select a face. Move the box or drag its corner to adjust it.'))}</p>
            <button class="person-photo-tool-button" type="button" data-geneo-avatar-reset>${escapeHtml(t('Reset area'))}</button>
          </div>
          <aside class="person-photo-preview-column" aria-label="${escapeHtml(t('Avatar previews'))}">
            <div class="person-photo-preview-card"><strong>${escapeHtml(t('Card preview'))}</strong><div class="person-photo-preview-avatar geneo-card">${preview()}</div></div>
            <div class="person-photo-preview-card"><strong>${escapeHtml(t('Inspector preview'))}</strong><div class="person-photo-preview-avatar geneo-inspector-preview">${preview()}</div></div>
          </aside>
        </div>
      </div>
      <div class="modal-footer"><button class="button secondary" type="button" data-geneo-avatar-back>${escapeHtml(t('Back'))}</button><div class="modal-footer-actions">
        <button class="button secondary" type="button" data-geneo-avatar-cancel>${escapeHtml(t('Cancel'))}</button>
        <button class="button primary" type="button" data-geneo-avatar-save>${escapeHtml(t('Use photo'))}</button>
      </div></div></div>`);
    bindGeneographAvatarAdjustModal();
    requestAnimationFrame(() => modalBackdrop.querySelector('[data-face-region-box]')?.focus());
}

function bindGeneographAvatarAdjustModal()
{
    const root = modalBackdrop.querySelector('[data-geneo-avatar-adjust]');
    if (!root) return;
    bindFaceRegionSelector(root,
        () => state.geneoImagePicker.avatarRegion,
        region =>
        {
            state.geneoImagePicker.avatarRegion = region;
            root.querySelectorAll('.person-photo-region-preview').forEach(preview =>
            {
                preview.dataset.faceRegion = JSON.stringify(region);
                positionFaceRegionMedia(preview);
            });
        });
    root.querySelector('[data-geneo-avatar-reset]')?.addEventListener('click', () =>
    {
        state.geneoImagePicker.avatarRegion = { ...FACE_REGION_DEFAULT };
        renderGeneographAvatarAdjustModal();
    });
    root.querySelector('[data-geneo-avatar-back]')?.addEventListener('click', () =>
    {
        state.geneoImagePicker.step = 'choose';
        renderGeneographImagePickerModal();
    });
    root.querySelector('[data-geneo-avatar-save]')?.addEventListener('click', saveGeneographAvatarPhoto);
    root.querySelectorAll('[data-geneo-avatar-cancel]').forEach(button => button.addEventListener('click', cancelGeneographAvatarPicker));
}

function saveGeneographAvatarPhoto()
{
    const picker = state.geneoImagePicker;
    const board = selectedGeneographBoard();
    const person = getGeneographPerson(picker.personId);
    const selection = geneoAvatarPickerSelection();
    if (!board || board.id !== picker.boardId || !person || !selection || picker.step !== 'adjust') return;
    const projectPhoto = selection.scope === 'project'
        ? getPhoto(selection.photo.id, { projectId: board.projectId })
        : null;
    const existingAsset = selection.scope === 'board'
        ? getGeneographBoardAsset(selection.draft?.id, board.diagram)
        : null;
    if (selection.scope === 'project' ? !projectPhoto || projectPhoto.deletedAt : !existingAsset && !photoUploadDraftIsValid(selection.draft))
    {
        modalBackdrop.querySelector('[data-geneo-avatar-save]')?.insertAdjacentHTML('beforebegin', `<span class="geneo-avatar-error" role="alert">${escapeHtml(t('This photo is no longer available. Choose another.'))}</span>`);
        return;
    }
    const region = normalizeFaceRegion(picker.avatarRegion, FACE_REGION_MIN) || { ...FACE_REGION_DEFAULT };
    const unchangedSource = selection.scope === 'project'
        ? person.photoId === projectPhoto.id && !person.photoAssetId
        : person.photoAssetId === existingAsset?.id && !person.photoId;
    if (unchangedSource && !person.photoCrop
        && JSON.stringify(person.photoRegion) === JSON.stringify(region))
    {
        closeGeneographAvatarPicker();
        return;
    }
    geneoPushHistory();
    const asset = selection.scope === 'board'
        ? existingAsset || createGeneographBoardAsset(selection.draft, board.diagram)
        : null;
    person.photoId = projectPhoto?.id || null;
    person.photoAssetId = asset?.id || null;
    person.photoCrop = null;
    person.photoRegion = region;
    pruneGeneographBoardAssets(board.diagram);
    touchGeneographBoard();
    closeGeneographAvatarPicker({ render: true });
}

function removeGeneographAvatarPhoto()
{
    const picker = state.geneoImagePicker;
    const board = selectedGeneographBoard();
    const person = getGeneographPerson(picker.personId);
    if (!board || board.id !== picker.boardId || !person || (!person.photoId && !person.photoAssetId)) return;
    geneoPushHistory();
    person.photoId = null;
    person.photoAssetId = null;
    person.photoCrop = null;
    person.photoRegion = null;
    pruneGeneographBoardAssets(board.diagram);
    touchGeneographBoard();
    closeGeneographAvatarPicker({ render: true });
}

function openGeneographAvatarPicker(personId, { nodeId = null, location = 'card' } = {})
{
    const board = selectedGeneographBoard();
    const person = getGeneographPerson(personId);
    if (!board || !person) return;
    const photos = getProjectPhotos(board.projectId).filter(photo => !photo.deletedAt);
    const asset = person.photoAssetId ? getGeneographBoardAsset(person.photoAssetId, board.diagram) : null;
    resetGeneographImagePickerState();
    Object.assign(state.geneoImagePicker, {
        open: true, mode: 'avatar', boardId: board.id, personId,
        originNodeId: nodeId, originLocation: location,
        sourceTab: asset ? 'upload' : 'project',
        selectedProjectPhotoIds: person.photoId ? [person.photoId] : [],
        uploadDrafts: asset ? [{ ...asset }] : [],
        avatarRegion: normalizeFaceRegion(person.photoRegion, FACE_REGION_MIN)
    });
    if (!photos.length && !asset) state.geneoImagePicker.sourceTab = 'upload';
    renderGeneographImagePickerModal();
}

function openGeneographImagePicker({
    mode = 'add',
    nodeId = null
} = {})
{
    const replacing = mode === 'replace';

    const node = replacing
        ? getGeneographNode(nodeId)
        : null;

    if (
        replacing
        && node?.type !== 'image'
    )
    {
        return;
    }

    const photos = getProjectPhotos(
        geneoImagePickerProjectId()
    ).filter(photo => !photo.deletedAt);

    const currentRef = replacing
        ? normalizeGeneographImageRef(node)
        : null;

    resetGeneographImagePickerState();

    Object.assign(state.geneoImagePicker, {
        open: true,
        mode: replacing ? 'replace' : 'add',
        nodeId: replacing ? node.id : null,

        sourceTab:
          currentRef?.scope === 'project'
          || photos.length
              ? 'project'
              : 'upload',

        selectedProjectPhotoIds:
          currentRef?.scope === 'project'
              ? [currentRef.id]
              : [],

        uploadDrafts: [],
        uploadErrors: [],
        uploadBusy: false
    });

    renderGeneographImagePickerModal();
}

function openGeneographTreePersonPicker()
{
    openGeneographTreeImport();
}

function findGeneographFamilyForPartners(firstPersonId, secondPersonId)
{
    return selectedGeneographDiagram()?.families.find(family => family.partnerIds.length === 2 && family.partnerIds.includes(firstPersonId) && family.partnerIds.includes(secondPersonId)) || null;
}

function geneoPersonIdForNode(nodeId)
{
    const node = getGeneographNode(nodeId); return node?.type === 'person' ? node.personId : null;
}

function geneoHasAncestor(ancestorId, personId, seen = new Set())
{
    if (ancestorId === personId) return true;
    if (seen.has(personId)) return false;
    seen.add(personId);
    const parentFamilies = selectedGeneographDiagram().families.filter(family => family.children.some(child => child.personId === personId));
    return parentFamilies.some(family => family.partnerIds.some(parentId => geneoHasAncestor(ancestorId, parentId, seen)));
}

function geneoSiblingFamilyForPerson(personId)
{
    const diagram = selectedGeneographDiagram();
    return diagram?.families.find(family =>
        family.partnerIds.length === 0
        && family.children.some(child => child.personId === personId)
        && diagram.connections.some(connection => connection.kind === 'family-sibling' && connection.familyId === family.id)
    ) || null;
}

function createGeneographSiblingRelationship(firstPersonId, secondPersonId, source, target)
{
    const diagram = selectedGeneographDiagram();
    const firstFamily = geneoSiblingFamilyForPerson(firstPersonId);
    const secondFamily = geneoSiblingFamilyForPerson(secondPersonId);
    let family = firstFamily || secondFamily;
    if (!family)
    {
        family = {
            id: createRuntimeId('geneo-family'),
            partnerIds: [],
            children: [],
            relationshipType: 'Sibling relationship',
            relationshipStatus: 'active',
            marriageType: '',
            events: []
        };
        diagram.families.push(family);
    }
    if (firstFamily && secondFamily && firstFamily.id !== secondFamily.id)
    {
        secondFamily.children.forEach(child =>
        {
            if (!firstFamily.children.some(item => item.personId === child.personId)) firstFamily.children.push({ ...child });
        });
        diagram.connections.forEach(connection =>
        {
            if (connection.kind === 'family-sibling' && connection.familyId === secondFamily.id) connection.familyId = firstFamily.id;
        });
        diagram.families = diagram.families.filter(item => item.id !== secondFamily.id);
        family = firstFamily;
    }
    [firstPersonId, secondPersonId].forEach(personId =>
    {
        if (!family.children.some(child => child.personId === personId)) family.children.push({ personId, parentageType: 'unknown' });
    });
    diagram.connections.push(geneoCreateConnection('family-sibling', source, target, family.id));
    return family;
}

function rebuildGeneographSiblingFamily(familyId)
{
    const diagram = selectedGeneographDiagram();
    const family = getGeneographFamily(familyId);
    if (!diagram || !family) return;
    const siblingConnections = diagram.connections.filter(connection => connection.kind === 'family-sibling' && connection.familyId === familyId);
    if (!siblingConnections.length)
    {
        diagram.families = diagram.families.filter(item => item.id !== familyId);
        return;
    }
    const personIds = new Set();
    siblingConnections.forEach(connection =>
    {
        [connection.source?.nodeId, connection.target?.nodeId].forEach(nodeId =>
        {
            const personId = geneoPersonIdForNode(nodeId);
            if (personId) personIds.add(personId);
        });
    });
    family.children = [...personIds].map(personId => ({ personId, parentageType: 'unknown' }));
}

function canCreateGeneographConnection(source, target, purpose = 'automatic')
{
    if (!source || !target) return { valid: false, reason: 'Choose two connection points.' };
    if (source.nodeId && source.nodeId === target.nodeId) return { valid: false, reason: 'An item cannot connect to itself.' };
    const sourceNode = getGeneographNode(source.nodeId); const targetNode = getGeneographNode(target.nodeId);
    if (purpose === 'visual') return sourceNode && targetNode
        ? { valid: true, kind: 'visual' }
        : { valid: false, reason: 'Visual connections use object sockets, not family junctions.' };
    const sourcePersonId = geneoPersonIdForNode(source.nodeId); const targetPersonId = geneoPersonIdForNode(target.nodeId);
    if (source.familyId && targetPersonId && target.port === 'top')
    {
        const family = getGeneographFamily(source.familyId);
        if (!family) return { valid: false, reason: 'That family is no longer available.' };
        if (family.children.some(child => child.personId === targetPersonId)) return { valid: false, reason: 'That child already belongs to this family.' };
        if (family.partnerIds.some(parentId => geneoHasAncestor(targetPersonId, parentId))) return { valid: false, reason: 'This relationship would create an ancestry cycle.' };
        return { valid: true, kind: 'family-child', familyId: source.familyId, childPersonId: targetPersonId, childReference: target };
    }
    if (target.familyId && sourcePersonId && source.port === 'top')
    {
        const family = getGeneographFamily(target.familyId);
        if (!family) return { valid: false, reason: 'That family is no longer available.' };
        if (family.children.some(child => child.personId === sourcePersonId)) return { valid: false, reason: 'That child already belongs to this family.' };
        if (family.partnerIds.some(parentId => geneoHasAncestor(sourcePersonId, parentId))) return { valid: false, reason: 'This relationship would create an ancestry cycle.' };
        return { valid: true, kind: 'family-child', familyId: target.familyId, childPersonId: sourcePersonId, childReference: source };
    }
    if (sourcePersonId && targetPersonId)
    {
        if (source.port === 'top' && target.port === 'top')
        {
            if (geneoHasAncestor(sourcePersonId, targetPersonId) || geneoHasAncestor(targetPersonId, sourcePersonId)) return { valid: false, reason: 'Direct ancestors cannot be siblings.' };
            const sourceFamily = geneoSiblingFamilyForPerson(sourcePersonId);
            const targetFamily = geneoSiblingFamilyForPerson(targetPersonId);
            if (sourceFamily && targetFamily && sourceFamily.id === targetFamily.id) return { valid: false, reason: 'That sibling relationship already exists.' };
            return { valid: true, kind: 'family-sibling', sourcePersonId, targetPersonId };
        }
        const horizontal = ['left', 'right'].includes(source.port) && ['left', 'right'].includes(target.port) && source.port !== target.port;
        if (horizontal)
        {
            if (geneoHasAncestor(sourcePersonId, targetPersonId) || geneoHasAncestor(targetPersonId, sourcePersonId)) return { valid: false, reason: 'Direct ancestors cannot be partners.' };
            if (findGeneographFamilyForPartners(sourcePersonId, targetPersonId)) return { valid: false, reason: 'That partner relationship already exists.' };
            return { valid: true, kind: 'family-partner', sourcePersonId, targetPersonId };
        }
        const sourceIsParent = source.port === 'bottom' && target.port === 'top';
        const targetIsParent = target.port === 'bottom' && source.port === 'top';
        if (sourceIsParent || targetIsParent)
        {
            const parentPersonId = sourceIsParent ? sourcePersonId : targetPersonId; const childPersonId = sourceIsParent ? targetPersonId : sourcePersonId;
            if (geneoHasAncestor(childPersonId, parentPersonId)) return { valid: false, reason: 'This relationship would create an ancestry cycle.' };
            if (selectedGeneographDiagram().families.some(family => family.partnerIds.includes(parentPersonId) && family.children.some(child => child.personId === childPersonId))) return { valid: false, reason: 'That parent-child relationship already exists.' };
            return {
                valid: true,
                kind: 'family-child',
                parentPersonId,
                childPersonId,
                parentReference: sourceIsParent ? source : target,
                childReference: sourceIsParent ? target : source
            };
        }
        return { valid: false, reason: 'Use side ports for partners and vertical ports for parent-child relationships.' };
    }
    if (sourceNode && targetNode) return { valid: true, kind: 'visual' };
    return { valid: false, reason: 'These points cannot be connected.' };
}

function createGeneographPartnerRelationship(firstPersonId, secondPersonId, source, target)
{
    const diagram = selectedGeneographDiagram();
    let family = findGeneographFamilyForPartners(firstPersonId, secondPersonId);
    if (!family)
    {
        family = { id: createRuntimeId('geneo-family'), partnerIds: [firstPersonId, secondPersonId], children: [], relationshipType: 'Married', relationshipStatus: 'active', marriageType: 'Civil', events: [] }; diagram.families.push(family);
    }
    if (!diagram.connections.some(item => item.kind === 'family-partner' && item.familyId === family.id)) diagram.connections.push(geneoCreateConnection('family-partner', source, target, family.id));
    return family;
}

function addGeneographChildToFamily(familyId, childPersonId, target)
{
    const diagram = selectedGeneographDiagram(); const family = getGeneographFamily(familyId); if (!family) return null;
    if (!family.children.some(child => child.personId === childPersonId)) family.children.push({ personId: childPersonId, parentageType: 'biological' });
    if (!diagram.connections.some(item => item.kind === 'family-child' && item.familyId === familyId && item.target.nodeId === target.nodeId)) diagram.connections.push(geneoCreateConnection('family-child', { familyId, port: 'bottom' }, target, familyId));
    return family;
}

function createGeneographParentChildRelationship(parentPersonId, childPersonId, source, target)
{
    const diagram = selectedGeneographDiagram();
    let family = diagram.families.find(item => item.partnerIds.length === 1 && item.partnerIds[0] === parentPersonId);
    if (!family)
    {
        family = { id: createRuntimeId('geneo-family'), partnerIds: [parentPersonId], children: [], relationshipType: 'Unknown relationship', relationshipStatus: 'active', marriageType: '', events: [] }; diagram.families.push(family);
    }
    addGeneographChildToFamily(family.id, childPersonId, target);
    const connection = diagram.connections.find(item => item.kind === 'family-child' && item.familyId === family.id && item.target.nodeId === target.nodeId);
    if (connection && !connection.source.nodeId) connection.source = { ...source };
    return family;
}

function geneoCreateConnection(kind, source, target, familyId = null)
{
    geneoConnectionToolStyle();
    const overrides = { ...geneoConnectionToolRuntime.overrides };
    if (overrides.line) overrides.line = { ...overrides.line };
    if (kind !== 'visual') delete overrides.arrows;
    return { id: createRuntimeId('geneo-connection'), kind, familyId, source: { ...source }, target: { ...target }, visible: true, style: overrides, route: { mode: 'auto', waypoints: [] } };
}

function commitGeneographConnection(source, target)
{
    const result = canCreateGeneographConnection(source, target, geneoConnectionToolRuntime.purpose); if (!result.valid)
    {
        geneoConnectionToolRuntime.offerVisual = geneoConnectionToolRuntime.purpose !== 'visual'
            && Boolean(source.nodeId && target.nodeId && source.nodeId !== target.nodeId);
        showToast(result.reason); return false;
    }
    const diagram = selectedGeneographDiagram();
    const duplicate = geneoConnectionCandidateExists(source, target, result.kind);
    if (duplicate)
    {
        showToast('That connection already exists.'); return false;
    }
    geneoPushHistory();
    if (result.kind === 'family-partner') createGeneographPartnerRelationship(result.sourcePersonId, result.targetPersonId, source, target);
    else if (result.kind === 'family-sibling') createGeneographSiblingRelationship(result.sourcePersonId, result.targetPersonId, source, target);
    else if (result.kind === 'family-child' && result.familyId) addGeneographChildToFamily(result.familyId, result.childPersonId, result.childReference);
    else if (result.kind === 'family-child') createGeneographParentChildRelationship(result.parentPersonId, result.childPersonId, result.parentReference, result.childReference);
    else diagram.connections.push(geneoCreateConnection('visual', source, target));
    touchGeneographBoard(); return true;
}

function openGeneoMakeVisualConfirmation(connection)
{
    if (!connection || connection.kind === 'visual') return;
    const boardId = selectedGeneographBoard()?.id;
    const snapshot = geneoSnapshot();
    const family = getGeneographFamily(connection.familyId);
    const parents = (family?.partnerIds || []).map(id => selectedGeneographDiagram().nodes.find(node => node.type === 'person' && node.personId === id)).filter(Boolean);
    const needsParent = Boolean(connection.source.familyId || connection.target.familyId);
    if (needsParent && !parents.length) { showToast(t('Add a parent card before converting this connection.')); return; }
    openModal(`<div class="modal" role="dialog" aria-modal="true" aria-labelledby="geneoVisualTitle"><div class="modal-header"><h2 id="geneoVisualTitle">${escapeHtml(t('Make visual only?'))}</h2><button type="button" class="close-button" data-close aria-label="${escapeHtml(t('Close'))}">${icon.close}</button></div><div class="modal-body"><p>${escapeHtml(t('This removes the board relationship, not the people. The line will no longer be included in Family Tree sync. Family Tree records will not change.'))}</p>${connection.kind === 'family-partner' && family?.children.length ? `<p>${escapeHtml(t('Shared children will keep separate links to each parent.'))}</p>` : ''}${needsParent ? `<div class="field"><label for="geneoVisualParent">${escapeHtml(t('Connect visually from'))}</label><select id="geneoVisualParent">${parents.map(node => `<option value="${escapeHtml(node.id)}">${escapeHtml(geneoNodeTitle(node))}</option>`).join('')}</select></div>` : ''}</div><div class="modal-footer"><button class="button secondary" type="button" data-close>${escapeHtml(t('Cancel'))}</button><button class="button primary" type="button" data-geneo-confirm-visual>${escapeHtml(t('Make visual only'))}</button></div></div>`);
    modalBackdrop.querySelector('[data-geneo-confirm-visual]')?.addEventListener('click', () =>
    {
        if (selectedGeneographBoard()?.id !== boardId || geneoSnapshot() !== snapshot)
        { showToast(t('The board changed. Close this dialog and try again.')); return; }
        const current = getGeneographConnection(connection.id);
        if (!current) return;
        const diagram = selectedGeneographDiagram();
        const visual = structuredClone(current);
        if (needsParent)
        {
            const reference = { nodeId: modalBackdrop.querySelector('#geneoVisualParent').value, port: 'bottom' };
            if (visual.source.familyId) visual.source = reference;
            if (visual.target.familyId) visual.target = reference;
        }
        if (geneoConnectionCandidateExists(visual.source, visual.target, 'visual'))
        { showToast(t('That connection already exists.')); return; }
        geneoPushHistory();
        if (current.kind === 'family-partner' && family)
        {
            family.partnerIds.filter(() => family.children.length).forEach(parentId =>
            {
                const parentNode = diagram.nodes.find(node => node.type === 'person' && node.personId === parentId);
                let single = diagram.families.find(item => item.partnerIds.length === 1 && item.partnerIds[0] === parentId);
                if (!single)
                {
                    single = { id: createRuntimeId('geneo-family'), partnerIds: [parentId], children: [], relationshipType: 'Unknown relationship', relationshipStatus: 'active', marriageType: '', events: [] };
                    diagram.families.push(single);
                }
                family.children.forEach(child =>
                {
                    const childNode = diagram.nodes.find(node => node.type === 'person' && node.personId === child.personId);
                    if (!single.children.some(item => item.personId === child.personId)) single.children.push({ ...child });
                    if (!childNode || !parentNode) return;
                    const original = diagram.connections.find(item => item.kind === 'family-child' && item.familyId === family.id && item.target.nodeId === childNode.id);
                    if (!diagram.connections.some(item => item.kind === 'family-child' && item.familyId === single.id && item.target.nodeId === childNode.id))
                        diagram.connections.push({ ...(original ? structuredClone(original) : geneoCreateConnection('family-child', {}, {}, single.id)),
                            id: createRuntimeId('geneo-connection'), familyId: single.id,
                            source: { nodeId: parentNode.id, port: 'bottom' }, target: { nodeId: childNode.id, port: 'top' }, route: { mode: 'auto', waypoints: [] } });
                });
            });
            diagram.connections = diagram.connections.filter(item => item.familyId !== family.id);
            diagram.families = diagram.families.filter(item => item.id !== family.id);
        }
        else removeGeneographRelationship(current.id);
        visual.kind = 'visual';
        visual.familyId = null;
        if (diagram.connectionDefaults.arrows !== 'none') visual.style.arrows = 'none';
        delete visual.showRelationshipDates;
        diagram.connections.push(visual);
        selectGeneographConnection(visual.id);
        touchGeneographBoard();
        closeModal();
        renderGeneographEditorPreserveScroll();
    });
}

function removeGeneographRelationship(connectionId)
{
    const diagram = selectedGeneographDiagram(); const connection = getGeneographConnection(connectionId); if (!connection) return;
    diagram.connections = diagram.connections.filter(item => item.id !== connectionId);
    if (connection.kind === 'family-partner' && connection.familyId)
    {
        const family = getGeneographFamily(connection.familyId);
        diagram.connections = diagram.connections.filter(item => item.familyId !== connection.familyId);
        diagram.families = diagram.families.filter(item => item.id !== connection.familyId);
    }
    else if (connection.kind === 'family-child' && connection.familyId)
    {
        const family = getGeneographFamily(connection.familyId); const childId = geneoPersonIdForNode(connection.target.nodeId);
        if (family && childId) family.children = family.children.filter(child => child.personId !== childId);
        if (family && !family.partnerIds.length && !family.children.length) diagram.families = diagram.families.filter(item => item.id !== family.id);
    }
    else if (connection.kind === 'family-sibling' && connection.familyId)
    {
        rebuildGeneographSiblingFamily(connection.familyId);
    }
}

function geneoObjectGroupNodes(nodeIds = [...geneoSelectedNodeIdSet()])
{
    const diagram = selectedGeneographDiagram();
    if (!diagram) return [];
    const included = new Set(nodeIds);
    let changed = true;
    while (changed)
    {
        changed = false;
        diagram.nodes.forEach(node =>
        {
            if (node.parentPanelId && included.has(node.parentPanelId) && !included.has(node.id))
            {
                included.add(node.id);
                changed = true;
            }
        });
    }
    return diagram.nodes.filter(node => included.has(node.id));
}

function geneoObjectSnapshot(nodes)
{
    const diagram = selectedGeneographDiagram();
    if (!diagram || !nodes.length) return null;
    const personIds = new Set(nodes.filter(node => node.type === 'person').map(node => node.personId));
    const assetIds = new Set(nodes.filter(node => node.type === 'image' && node.imageRef?.scope === 'board').map(node => node.imageRef.id));
    diagram.people.forEach(person =>
    {
        if (personIds.has(person.id) && person.photoAssetId) assetIds.add(person.photoAssetId);
    });
    return structuredClone({
        boardId: selectedGeneographBoard().id,
        nodes,
        people: diagram.people.filter(person => personIds.has(person.id)),
        assets: (diagram.assets || []).filter(asset => assetIds.has(asset.id)),
        pasteCount: 0
    });
}

function copyGeneographSelection()
{
    const snapshot = geneoObjectSnapshot(geneoObjectGroupNodes());
    if (!snapshot) return false;
    geneoObjectClipboard = { ...snapshot, mode: 'copy' };
    return true;
}

function geneoDetachCutPeople(personIds)
{
    if (!personIds.size) return;
    const diagram = selectedGeneographDiagram();
    diagram.families = diagram.families.filter(family =>
    {
        family.partnerIds = family.partnerIds.filter(id => !personIds.has(id));
        family.children = family.children.filter(child => !personIds.has(child.personId));
        return family.partnerIds.length || family.relationshipType === 'Sibling relationship' && family.children.length;
    });
    const familyIds = new Set(diagram.families.map(family => family.id));
    diagram.connections = diagram.connections.filter(connection =>
        !connection.familyId || familyIds.has(connection.familyId));
}

function cutGeneographSelection()
{
    const nodes = geneoObjectGroupNodes();
    const snapshot = geneoObjectSnapshot(nodes);
    if (!snapshot) return false;
    geneoObjectClipboard = { ...snapshot, mode: 'cut' };
    setGeneographNodeSelection(nodes.map(node => node.id));
    deleteGeneographSelection({ detachFamilies: true });
    return true;
}

function pasteGeneographObjects(snapshot = geneoObjectClipboard, { duplicate = false } = {})
{
    const diagram = selectedGeneographDiagram();
    if (!diagram || !snapshot?.nodes?.length || snapshot.boardId !== selectedGeneographBoard()?.id) return false;
    const cut = snapshot.mode === 'cut' && !duplicate;
    if (cut && snapshot.nodes.some(node => diagram.nodes.some(existing => existing.id === node.id
        || node.type === 'person' && existing.type === 'person' && existing.personId === node.personId)))
    {
        geneoObjectClipboard = null;
        showToast(t('Cut objects are already on this board.'));
        return false;
    }
    if (cut && snapshot.people.some(person => !diagram.people.some(item => item.id === person.id)))
    {
        geneoObjectClipboard = null;
        showToast(t('Cut objects are no longer available.'));
        return false;
    }
    const assetIds = new Set((diagram.assets || []).map(asset => asset.id));
    const missingAssets = snapshot.assets.filter(asset => !assetIds.has(asset.id));
    const personMap = new Map();
    const nodeMap = new Map(snapshot.nodes.map(node => [node.id, createRuntimeId('geneo-node')]));
    const minX = Math.min(...snapshot.nodes.map(node => node.x));
    const minY = Math.min(...snapshot.nodes.map(node => node.y));
    const maxX = Math.max(...snapshot.nodes.map(node => node.x + node.width));
    const maxY = Math.max(...snapshot.nodes.map(node => node.y + node.height));
    const center = geneoCurrentViewportCenter() || geneoContentCenter();
    const offset = duplicate ? 24 : (snapshot.pasteCount || 0) * 24;
    const dx = duplicate ? 24 : center.x - (minX + maxX) / 2 + offset;
    const dy = duplicate ? 24 : center.y - (minY + maxY) / 2 + offset;
    const nextOrder = Math.max(0, ...diagram.nodes.map(node => node.order || 0));

    geneoPushHistory();
    if (missingAssets.length) diagram.assets.push(...structuredClone(missingAssets));
    if (!cut)
    {
        snapshot.people.forEach(person =>
        {
            const id = createRuntimeId('geneo-person');
            personMap.set(person.id, id);
            diagram.people.push({ ...structuredClone(person), id, treePersonId: null, syncState: 'local' });
        });
    }
    const pastedNodes = snapshot.nodes.map((node, index) => ({
        ...structuredClone(node),
        id: nodeMap.get(node.id),
        personId: node.type === 'person' ? (personMap.get(node.personId) || node.personId) : node.personId,
        parentPanelId: nodeMap.get(node.parentPanelId) || null,
        x: geneoNumber(node.x + dx, node.x, -GENEO_WORLD_LIMIT, GENEO_WORLD_LIMIT),
        y: geneoNumber(node.y + dy, node.y, -GENEO_WORLD_LIMIT, GENEO_WORLD_LIMIT),
        order: nextOrder + index + 1
    }));
    diagram.nodes.push(...pastedNodes);
    setGeneographNodeSelection(pastedNodes.map(node => node.id), pastedNodes.at(-1)?.id);
    touchGeneographBoard();
    renderGeneographEditorPreserveScroll();
    if (cut) geneoObjectClipboard = null;
    else if (!duplicate) snapshot.pasteCount += 1;
    return true;
}

function duplicateGeneographSelection()
{
    const snapshot = geneoObjectSnapshot(geneoObjectGroupNodes());
    return snapshot ? pasteGeneographObjects({ ...snapshot, mode: 'copy' }, { duplicate: true }) : false;
}

function geneoSetSelectedObjectsProperty(property, value)
{
    const nodes = geneoObjectGroupNodes();
    if (!nodes.length || nodes.every(node => node[property] === value)) return;
    geneoPushHistory();
    nodes.forEach(node => { node[property] = value; });
    if (property === 'visible' && !value) selectGeneographCanvas();
    touchGeneographBoard();
    renderGeneographEditorPreserveScroll();
}

let geneoObjectMenuController = null;
let geneoLayerDrag = null;

function geneoCancelLayerDrag()
{
    if (geneoLayerDrag?.frame) cancelAnimationFrame(geneoLayerDrag.frame);
    geneoLayerDrag?.controller.abort();
    geneoLayerDrag = null;
    sidebar.querySelectorAll('.layer-dragging, .layer-drop-before, .layer-drop-after').forEach(row => row.classList.remove('layer-dragging', 'layer-drop-before', 'layer-drop-after'));
}

function geneoStartLayerDrag(id)
{
    geneoCancelLayerDrag();
    const node = getGeneographNode(id);
    if (!node || geneoNodeEffectiveLocked(node) || geneoLayerRenameMatches('node', id)) return false;
    if (!geneoSelectedNodeIdSet().has(id)) selectGeneographNode(id);
    const ids = [...geneoSelectedNodeIdSet()].filter(item => ![...geneoSelectedNodeIdSet()].some(parent => parent !== item && geneoNodeInsidePanel(getGeneographNode(item), parent)));
    if (ids.some(item => geneoNodeEffectiveLocked(getGeneographNode(item)))) return false;
    const controller = new AbortController();
    geneoLayerDrag = { ids, boardId: selectedGeneographBoard()?.id, key: geneoLayerPeerKey(node), controller, frame: null, x: 0, y: 0, targetId: '', before: true };
    sidebar.querySelectorAll('[data-geneo-layer]').forEach(row =>
    {
        row.classList.toggle('selected', geneoSelectedNodeIdSet().has(row.dataset.geneoLayer));
        row.classList.toggle('layer-dragging', ids.includes(row.dataset.geneoLayer));
    });
    document.addEventListener('keydown', event =>
    {
        if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); geneoCancelLayerDrag(); renderGeneographEditorPreserveScroll(); }
    }, { capture: true, signal: controller.signal });
    return true;
}

function geneoUpdateLayerDrop(x, y)
{
    const drag = geneoLayerDrag;
    if (!drag) return false;
    const previousId = drag.targetId, previousBefore = drag.before;
    drag.x = x; drag.y = y; drag.targetId = '';
    sidebar.querySelectorAll('.layer-drop-before, .layer-drop-after').forEach(row => row.classList.remove('layer-drop-before', 'layer-drop-after'));
    const list = sidebar.querySelector('.geneo-layer-list');
    if (!list) return false;
    const area = list.getBoundingClientRect();
    const viewport = (sidebar.querySelector('.geneo-sidebar') || sidebar).getBoundingClientRect();
    if (x < area.left || x > area.right || y < Math.max(area.top, viewport.top) - 8 || y > Math.min(area.bottom, viewport.bottom) + 8) return false;
    const hit = document.elementFromPoint(x, y);
    let block = hit?.closest('[data-geneo-layer-block]');
    if (block && !list.contains(block)) return false;
    if (block && !hit.closest('[data-geneo-layer], [data-geneo-layer-connection], .geneo-layer-panel-head')
        && getGeneographNode(drag.ids[0])?.parentPanelId === block.dataset.geneoLayerBlock) block = null;
    if (!block)
    {
        const candidates = [...list.querySelectorAll('[data-geneo-layer-block]')].filter(element =>
        {
            const node = getGeneographNode(element.dataset.geneoLayerBlock);
            return node && geneoLayerPeerKey(node) === drag.key && !drag.ids.includes(node.id);
        });
        const distance = element => { const rect = element.getBoundingClientRect(); return y < rect.top ? rect.top - y : y > rect.bottom ? y - rect.bottom : 0; };
        block = candidates.sort((a, b) => distance(a) - distance(b))[0];
    }
    const node = block && getGeneographNode(block.dataset.geneoLayerBlock);
    if (!node || geneoLayerPeerKey(node) !== drag.key || drag.ids.includes(node.id)) return false;
    const row = block.querySelector('[data-geneo-layer]');
    drag.targetId = node.id;
    const rect = row.getBoundingClientRect();
    const midpoint = rect.top + rect.height / 2;
    drag.before = hit?.closest('[data-geneo-layer-connection]') ? false
        : previousId === node.id && Math.abs(y - midpoint) < 4 ? previousBefore : y < midpoint;
    (drag.before ? row : block).classList.add(drag.before ? 'layer-drop-before' : 'layer-drop-after');
    return true;
}

function geneoLayerAutoScroll()
{
    const drag = geneoLayerDrag;
    if (!drag) return;
    if (state.activeModule !== 'Geneograph' || selectedGeneographBoard()?.id !== drag.boardId || !sidebar.querySelector('.geneo-sidebar'))
    { geneoCancelLayerDrag(); return; }
    const scroll = sidebar.querySelector('.geneo-sidebar') || sidebar;
    const rect = scroll.getBoundingClientRect();
    if (drag.y > rect.top && drag.y < rect.bottom)
    {
        const delta = drag.y < rect.top + 36 ? -10 : drag.y > rect.bottom - 36 ? 10 : 0;
        if (delta) { scroll.scrollTop += delta; geneoUpdateLayerDrop(drag.x, drag.y); }
    }
    drag.frame = requestAnimationFrame(geneoLayerAutoScroll);
}

function geneoFinishLayerDrop()
{
    const drag = geneoLayerDrag;
    if (!drag) return;
    const { ids, targetId, before } = drag;
    geneoCancelLayerDrag();
    if (!targetId || !geneoApplyLayerOrder('drop', ids, targetId, before)) renderGeneographEditorPreserveScroll();
}

function bindGeneoLayerRow(row)
{
    const id = row.dataset.geneoLayer;
    row.addEventListener('contextmenu', event =>
    {
        if (event.target.closest('input')) return;
        event.preventDefault(); event.stopPropagation();
        if (geneoLayerDrag) return;
        openGeneographObjectContextMenu(id, event.clientX, event.clientY, 'sidebar');
    });
    row.addEventListener('keydown', event =>
    {
        if (event.key !== 'ContextMenu' && !(event.shiftKey && event.key === 'F10')) return;
        event.preventDefault(); event.stopPropagation();
        const rect = row.getBoundingClientRect();
        openGeneographObjectContextMenu(id, rect.left + 20, rect.bottom, 'sidebar');
    });
    row.addEventListener('dragstart', event =>
    {
        if (!geneoStartLayerDrag(id)) { event.preventDefault(); return; }
        event.dataTransfer.setData('text/geneo-node', id);
        event.dataTransfer.effectAllowed = 'move';
        geneoLayerDrag.frame = requestAnimationFrame(geneoLayerAutoScroll);
    });
    row.addEventListener('dragend', () => { if (geneoLayerDrag) { geneoCancelLayerDrag(); renderGeneographEditorPreserveScroll(); } });
    let holdTimer = null;
    let touchStart = null;
    let dragged = false;
    const cancelHold = () => { clearTimeout(holdTimer); holdTimer = null; };
    row.addEventListener('pointerdown', event =>
    {
        if (event.pointerType === 'mouse' || event.target.closest('button,input') || row.draggable === false) return;
        dragged = false;
        touchStart = { x: event.clientX, y: event.clientY };
        cancelHold();
        holdTimer = setTimeout(() =>
        {
            if (!row.isConnected || !geneoStartLayerDrag(id)) return;
            dragged = true;
            row.setPointerCapture(event.pointerId);
            geneoLayerDrag.x = event.clientX; geneoLayerDrag.y = event.clientY;
            geneoLayerDrag.frame = requestAnimationFrame(geneoLayerAutoScroll);
        }, 300);
    });
    row.addEventListener('pointermove', event =>
    {
        if (event.pointerType === 'mouse') return;
        if (!dragged && touchStart && Math.hypot(event.clientX - touchStart.x, event.clientY - touchStart.y) > 8) cancelHold();
        if (dragged && geneoLayerDrag)
        { event.preventDefault(); geneoUpdateLayerDrop(event.clientX, event.clientY); }
    });
    row.addEventListener('touchmove', event => { if (dragged && geneoLayerDrag) event.preventDefault(); }, { passive: false });
    row.addEventListener('pointerup', event =>
    {
        cancelHold(); touchStart = null;
        if (event.pointerType !== 'mouse' && dragged) geneoFinishLayerDrop();
    });
    row.addEventListener('pointercancel', event =>
    {
        if (event.pointerType === 'mouse') return;
        cancelHold(); touchStart = null;
        if (geneoLayerDrag) { geneoCancelLayerDrag(); renderGeneographEditorPreserveScroll(); }
    });
    row.addEventListener('click', event => { if (dragged) { event.preventDefault(); event.stopImmediatePropagation(); dragged = false; } }, true);
}

function geneoLayerPeerKey(node)
{
    return `${node.parentPanelId || 'root'}:${node.type === 'panel' ? 'panel' : 'object'}`;
}

function geneoLayerOrderPlan(action, ids = [...geneoSelectedNodeIdSet()], targetId = '', before = true)
{
    const diagram = selectedGeneographDiagram();
    const selected = diagram.nodes.filter(node => ids.includes(node.id)
        && !ids.some(id => id !== node.id && geneoNodeInsidePanel(node, id)));
    if (!selected.length || selected.some(geneoNodeEffectiveLocked)) return [];
    const groups = [...new Set(selected.map(geneoLayerPeerKey))];
    const plans = [];
    groups.forEach(key =>
    {
        const peers = diagram.nodes.filter(node => geneoLayerPeerKey(node) === key).sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
        const original = peers.map(node => node.id);
        let next = [...original];
        const moving = new Set(selected.filter(node => geneoLayerPeerKey(node) === key).map(node => node.id));
        if (action === 'drop')
        {
            if (!original.includes(targetId) || moving.has(targetId)) return;
            const block = next.filter(id => moving.has(id));
            next = next.filter(id => !moving.has(id));
            const index = next.indexOf(targetId) + (before ? 1 : 0);
            next.splice(index, 0, ...block);
        }
        else if (action === 'front') next = [...next.filter(id => !moving.has(id)), ...next.filter(id => moving.has(id))];
        else if (action === 'back') next = [...next.filter(id => moving.has(id)), ...next.filter(id => !moving.has(id))];
        else if (action === 'forward')
        {
            for (let index = next.length - 2; index >= 0; index--)
                if (moving.has(next[index]) && !moving.has(next[index + 1])) [next[index], next[index + 1]] = [next[index + 1], next[index]];
        }
        else if (action === 'backward')
        {
            for (let index = 1; index < next.length; index++)
                if (moving.has(next[index]) && !moving.has(next[index - 1])) [next[index], next[index - 1]] = [next[index - 1], next[index]];
        }
        if (next.some((id, index) => id !== original[index])) plans.push({ original, next });
    });
    return plans;
}

function geneoApplyLayerOrder(action, ids, targetId, before)
{
    const plans = geneoLayerOrderPlan(action, ids, targetId, before);
    if (!plans.length) return false;
    geneoPushHistory();
    const ordered = selectedGeneographDiagram().nodes.slice().sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
    ordered.forEach((node, index) => node.order = index + 1);
    plans.forEach(plan =>
    {
        const slots = plan.original.map(id => getGeneographNode(id).order).sort((a, b) => a - b);
        plan.next.forEach((id, index) => getGeneographNode(id).order = slots[index]);
    });
    touchGeneographBoard();
    renderGeneographEditorPreserveScroll();
    return true;
}

function closeGeneographObjectContextMenu()
{
    geneoObjectMenuController?.abort();
    geneoObjectMenuController = null;
    document.querySelector('.geneo-object-context-menu')?.remove();
}

function openGeneographObjectContextMenu(nodeId, clientX, clientY, surface = 'canvas')
{
    const node = getGeneographNode(nodeId);
    if (!node) return;
    closeGeneographObjectContextMenu();
    closeMenu();
    if (!geneoSelectedNodeIdSet().has(nodeId))
    {
        selectGeneographNode(nodeId);
        renderGeneographEditorPreserveScroll();
    }
    if (state.selectedGeneoConnectionIds.length)
    {
        setGeneographNodeSelection([...geneoSelectedNodeIdSet()], nodeId);
        renderGeneographEditorPreserveScroll();
    }
    const anchor = surface === 'sidebar' ? sidebar.querySelector(`[data-geneo-layer="${CSS.escape(nodeId)}"]`)
        : main.querySelector(`.geneo-node[data-geneo-node="${CSS.escape(nodeId)}"]`);
    if (!anchor) return;
    const nodes = geneoObjectGroupNodes();
    const visible = nodes.some(item => item.visible);
    const locked = nodes.every(item => item.locked);
    const groups = [
        ...(nodes.length === 1 && node.type === 'image' && resolveGeneographImageSource(node).available ? [{ label: '', actions: [['crop', 'Crop image', icon.image]] }] : []),
        { label: 'Layer order', actions: [['forward', 'Move forward one layer', icon.arrow], ['front', 'Move to front', icon.doublechevronSidebar], ['backward', 'Move backward one layer', icon.arrow], ['back', 'Move to back', icon.doublechevronSidebar]] },
        { label: 'Edit', actions: [['duplicate', 'Duplicate', icon.copy], ['copy', 'Copy', icon.copy], ['cut', 'Cut', icon.cut], ...(geneoObjectClipboard?.boardId === selectedGeneographBoard()?.id ? [['paste', 'Paste', icon.paste]] : [])] },
        { label: 'Visibility', actions: [[visible ? 'hide' : 'show', visible ? 'Hide' : 'Show', visible ? icon.eyeOff : icon.eye], [locked ? 'unlock' : 'lock', locked ? 'Unlock' : 'Lock', locked ? icon.unlock : icon.lock]] },
        { label: '', actions: [['delete', 'Delete', icon.trash]] }
    ];
    const menu = document.createElement('div');
    menu.id = 'projectMenu';
    menu.className = 'menu-popover geneo-object-context-menu';
    menu.setAttribute('role', 'menu');
    menu.setAttribute('aria-label', t('Object actions'));
    menu.style.visibility = 'hidden';
    menu.innerHTML = groups.map(group => `<div class="geneo-context-group" role="group" ${group.label ? `aria-label="${escapeHtml(t(group.label))}"` : ''}>${group.label ? `<div class="geneo-context-heading">${escapeHtml(t(group.label))}</div>` : ''}${group.actions.map(([action, label, glyph]) => `<button type="button" role="menuitem" data-geneo-object-action="${action}" class="${action === 'delete' ? 'danger' : ''}" ${['forward', 'front', 'backward', 'back'].includes(action) && !geneoLayerOrderPlan(action).length ? 'disabled' : ''}><span class="geneo-context-icon ${action}">${glyph || ''}</span><span>${escapeHtml(t(label))}</span></button>`).join('')}</div>`).join('');
    document.body.appendChild(menu);
    const bounds = menu.getBoundingClientRect();
    menu.style.left = `${Math.max(12, Math.min(clientX, window.innerWidth - bounds.width - 12))}px`;
    menu.style.top = `${Math.max(12, Math.min(clientY, window.innerHeight - bounds.height - 12))}px`;
    menu.style.visibility = 'visible';
    menu.addEventListener('click', event =>
    {
        const action = event.target.closest('[data-geneo-object-action]')?.dataset.geneoObjectAction;
        if (!action || event.target.closest('button')?.disabled) return;
        closeGeneographObjectContextMenu();
        if (['forward', 'front', 'backward', 'back'].includes(action)) geneoApplyLayerOrder(action);
        else if (action === 'crop') geneoBeginImageCrop(node);
        else if (action === 'hide' || action === 'show') geneoSetSelectedObjectsProperty('visible', action === 'show');
        else if (action === 'lock' || action === 'unlock') geneoSetSelectedObjectsProperty('locked', action === 'lock');
        else if (action === 'duplicate') duplicateGeneographSelection();
        else if (action === 'copy') copyGeneographSelection();
        else if (action === 'cut') cutGeneographSelection();
        else if (action === 'paste') pasteGeneographObjects();
        else if (action === 'delete') deleteGeneographSelection();
        requestAnimationFrame(() =>
        {
            const restored = surface === 'sidebar' ? sidebar.querySelector(`[data-geneo-layer="${CSS.escape(nodeId)}"]`)
                : main.querySelector(`.geneo-node[data-geneo-node="${CSS.escape(nodeId)}"]`);
            restored?.focus({ preventScroll: true });
        });
    });
    menu.addEventListener('keydown', event =>
    {
        const items = [...menu.querySelectorAll('[role="menuitem"]:not(:disabled)')];
        const index = items.indexOf(document.activeElement);
        if (event.key === 'Escape')
        {
            event.preventDefault(); event.stopPropagation(); closeGeneographObjectContextMenu(); anchor.focus();
        }
        else if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key))
        {
            event.preventDefault(); event.stopPropagation();
            const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1
                : (index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
            items[next]?.focus();
        }
        else if (event.key === 'Tab')
        {
            setTimeout(() => {
                if (menu.isConnected && !menu.contains(document.activeElement)) closeGeneographObjectContextMenu();
            }, 0);
        }
    });
    geneoObjectMenuController = new AbortController();
    const signal = geneoObjectMenuController.signal;
    document.addEventListener('pointerdown', event =>
    {
        if (!menu.contains(event.target)) closeGeneographObjectContextMenu();
    }, { signal });
    window.addEventListener('resize', closeGeneographObjectContextMenu, { signal });
    menu.querySelector('[role="menuitem"]:not(:disabled)')?.focus();
}

function deleteGeneographSelection({ detachFamilies = false } = {})
{
    const diagram = selectedGeneographDiagram();
    const connections = selectedGeneographConnections();
    const nodes = selectedGeneographNodes();
    if (!connections.length && !nodes.length) return;
    geneoPushHistory();
    if (detachFamilies)
        geneoDetachCutPeople(new Set(nodes.filter(node => node.type === 'person').map(node => node.personId)));
    connections.map(connection => connection.id).forEach(connectionId =>
    {
        if (getGeneographConnection(connectionId)) removeGeneographRelationship(connectionId);
    });
    const deletedIds = new Set(nodes.map(node => node.id));
    const siblingFamilyIds = new Set(diagram.connections.filter(item => item.kind === 'family-sibling' && (deletedIds.has(item.source.nodeId) || deletedIds.has(item.target.nodeId))).map(item => item.familyId).filter(Boolean));
    diagram.nodes.forEach(node =>
    {
        if (node.parentPanelId && deletedIds.has(node.parentPanelId) && !deletedIds.has(node.id)) node.parentPanelId = null;
    });
    diagram.connections = diagram.connections.filter(item => !deletedIds.has(item.source.nodeId) && !deletedIds.has(item.target.nodeId));
    diagram.nodes = diagram.nodes.filter(item => !deletedIds.has(item.id));
    pruneGeneographBoardAssets(diagram);
    siblingFamilyIds.forEach(rebuildGeneographSiblingFamily);
    selectGeneographCanvas(); touchGeneographBoard(); renderGeneographEditorPreserveScroll();
}

function geneoNodeHasSelectedAncestor(node, selectedIds)
{
    let parentId = node?.parentPanelId;
    while (parentId)
    {
        if (selectedIds.has(parentId)) return true;
        parentId = getGeneographNode(parentId)?.parentPanelId || null;
    }
    return false;
}

function geneoGroupMoveSnapshot(nodes)
{
    const selectedIds = new Set(nodes.map(node => node.id));
    const roots = nodes.filter(node => !geneoNodeHasSelectedAncestor(node, selectedIds));
    const movingIds = new Set();
    const addNodeAndDescendants = node =>
    {
        if (!node || movingIds.has(node.id)) return;
        movingIds.add(node.id);
        if (node.type === 'panel') selectedGeneographDiagram().nodes.filter(child => child.parentPanelId === node.id).forEach(addNodeAndDescendants);
    };
    roots.forEach(addNodeAndDescendants);
    return selectedGeneographDiagram().nodes.filter(node => movingIds.has(node.id) && !geneoNodeEffectiveLocked(node)).map(node => ({ id: node.id, x: node.x, y: node.y }));
}

function geneoReferenceMovesWithNodes(reference, movingNodeIds)
{
    if (reference?.nodeId) return movingNodeIds.has(reference.nodeId);
    if (!reference?.familyId) return false;
    const family = getGeneographFamily(reference.familyId);
    const partnerNodeIds = (family?.partnerIds || []).map(personId =>
        selectedGeneographDiagram().nodes.find(node => node.type === 'person' && node.personId === personId)?.id
    ).filter(Boolean);
    return partnerNodeIds.length > 0 && partnerNodeIds.every(nodeId => movingNodeIds.has(nodeId));
}

function geneoConnectionMoveSnapshot(nodes, connections = selectedGeneographConnections())
{
    const movingNodeIds = new Set(nodes.map(node => node.id));
    const selectedConnectionIds = new Set(connections.map(connection => connection.id));
    return selectedGeneographDiagram().connections.flatMap(connection =>
    {
        const selected = selectedConnectionIds.has(connection.id);
        const followsNodes = connection.route?.mode === 'manual'
          && geneoReferenceMovesWithNodes(connection.source, movingNodeIds)
          && geneoReferenceMovesWithNodes(connection.target, movingNodeIds);
        if (!selected && !followsNodes) return [];
        const renderedPoints = geneoConnectionPoints(connection);
        const waypoints = connection.route?.mode === 'manual'
            ? connection.route.waypoints.map(point => ({ ...point }))
            : selected ? renderedPoints.slice(1, -1).map(point => ({ ...point })) : [];
        if (!waypoints.length) return [];
        return [{ id: connection.id, waypoints, materialize: connection.route?.mode !== 'manual' }];
    });
}

function applyGeneographSelectionTranslation(pointerState, dx, dy)
{
    pointerState.nodes.forEach(item =>
    {
        const node = getGeneographNode(item.id);
        if (node)
        {
            node.x = geneoNumber(item.x + dx, node.x, -GENEO_WORLD_LIMIT, GENEO_WORLD_LIMIT);
            node.y = geneoNumber(item.y + dy, node.y, -GENEO_WORLD_LIMIT, GENEO_WORLD_LIMIT);
        }
    });
    pointerState.connections.forEach(item =>
    {
        const connection = getGeneographConnection(item.id);
        if (!connection) return;
        connection.route = {
            mode: 'manual',
            waypoints: item.waypoints.map(point =>
            {
                const translated = {
                    x: geneoNumber(point.x + dx, point.x, -GENEO_WORLD_LIMIT, GENEO_WORLD_LIMIT),
                    y: geneoNumber(point.y + dy, point.y, -GENEO_WORLD_LIMIT, GENEO_WORLD_LIMIT)
                };
                return selectedGeneographDiagram().canvas.snapToGrid ? snapGeneographPoint(translated) : translated;
            })
        };
    });
}

function geneoPointerToCanvas(event)
{
    const stage = main.querySelector('[data-geneo-stage]');
    const rect = stage?.getBoundingClientRect();
    const bounds = geneoCanvasRuntime.bounds || { left: 0, top: 0 };
    const zoom = state.geneoZoom / 100;
    return {
        x: bounds.left + (event.clientX - (rect?.left || 0)) / zoom,
        y: bounds.top + (event.clientY - (rect?.top || 0)) / zoom
    };
}

function cancelGeneographConnectionDraft()
{
    state.geneoConnectionDraft = null;
    clearGeneographConnectionClick();
    geneoCanvasRuntime.connectionPreviewPoint = null;
    geneoCanvasRuntime.connectionHoverTarget = null;
    if (geneoCanvasRuntime.connectionPreviewFrame) cancelAnimationFrame(geneoCanvasRuntime.connectionPreviewFrame);
    geneoCanvasRuntime.connectionPreviewFrame = null;
    main.querySelector('[data-geneo-connection-tip]')?.remove();
}

function exitGeneographConnectionTool()
{
    cancelGeneographConnectionDraft();
    selectGeneographCanvas();
    geneoConnectionToolRuntime.panelOpen = false;
    state.geneoTool = 'pan';
    renderGeneographEditorPreserveScroll({
        preserveInspectorScroll: true,
        preserveSidebarScroll: true
    });
}

function geneoConnectionCandidateExists(source, target, kind = null)
{
    return selectedGeneographDiagram()?.connections.some(connection =>
        (!kind || connection.kind === kind) && (
        geneoConnectionReferencesMatch(connection.source, source) && geneoConnectionReferencesMatch(connection.target, target)
        || geneoConnectionReferencesMatch(connection.source, target) && geneoConnectionReferencesMatch(connection.target, source)));
}

function geneoConnectionReferencesMatch(source, target)
{
    return source?.nodeId === target?.nodeId
        && source?.familyId === target?.familyId
        && source?.port === target?.port;
}

function geneoConnectionTipText(source, target)
{
    if (geneoConnectionReferencesMatch(source, target)) return null;
    if (!source.familyId && !target.familyId && !geneoPersonIdForNode(source.nodeId) && !geneoPersonIdForNode(target.nodeId))
        return null;
    const result = canCreateGeneographConnection(source, target, geneoConnectionToolRuntime.purpose);
    if (result.valid && geneoConnectionCandidateExists(source, target, result.kind)) return { text: t('That connection already exists.'), invalid: true };
    if (result.valid && result.kind === 'visual') return geneoConnectionToolRuntime.purpose === 'visual'
        ? { text: t('Visual connection'), invalid: false } : null;
    if (!result.valid) return { text: t(result.reason), invalid: true };
    if (result.kind === 'visual') return null;
    const personName = personId => geneoPersonDisplayName(getGeneographPerson(personId) || {});
    if (result.kind === 'family-partner') return { text: t('Connect as partners'), invalid: false };
    if (result.kind === 'family-sibling') return { text: t('Connect as siblings'), invalid: false };
    if (result.familyId)
        return { text: t('Add {child} to this family').replace('{child}', personName(result.childPersonId)), invalid: false };
    return { text: t('{parent} is parent of {child}')
        .replace('{parent}', personName(result.parentPersonId))
        .replace('{child}', personName(result.childPersonId)), invalid: false };
}

function updateGeneographConnectionTip()
{
    const target = geneoCanvasRuntime.connectionHoverTarget;
    const viewport = main.querySelector('[data-geneo-canvas-viewport]');
    let tip = viewport?.querySelector('[data-geneo-connection-tip]');
    if (geneoEffectiveCanvasTool() !== 'connect' || !state.geneoConnectionDraft || !target?.element?.isConnected || !viewport)
    {
        tip?.remove();
        return;
    }
    const message = geneoConnectionTipText(state.geneoConnectionDraft, target.reference);
    if (!message)
    {
        tip?.remove();
        return;
    }
    if (!tip)
    {
        tip = document.createElement('div');
        tip.dataset.geneoConnectionTip = '';
        tip.className = 'geneo-connection-tip';
        tip.setAttribute('role', 'status');
        viewport.appendChild(tip);
    }
    if (tip.textContent !== message.text) tip.textContent = message.text;
    tip.classList.toggle('invalid', message.invalid);
    const viewportRect = viewport.getBoundingClientRect();
    const socketRect = target.element.getBoundingClientRect();
    const stageRect = main.querySelector('[data-geneo-stage]')?.getBoundingClientRect();
    const bounds = geneoCanvasRuntime.bounds || { left: 0, top: 0 };
    const points = geneoConnectionPreviewPoints(state.geneoConnectionDraft, geneoConnectionPoint(target.reference));
    const end = points.at(-1);
    const previous = points.at(-2);
    const zoom = state.geneoZoom / 100;
    const lineX = (stageRect?.left || 0) + (end.x * .45 + previous.x * .55 - bounds.left) * zoom - viewportRect.left;
    const lineY = (stageRect?.top || 0) + (end.y * .45 + previous.y * .55 - bounds.top) * zoom - viewportRect.top;
    const tipWidth = tip.offsetWidth;
    const tipHeight = tip.offsetHeight;
    const lineVisible = lineX >= 0 && lineX <= viewportRect.width && lineY >= 0 && lineY <= viewportRect.height;
    const center = lineVisible ? lineX : socketRect.left + socketRect.width / 2 - viewportRect.left;
    const above = (lineVisible ? lineY : socketRect.top - viewportRect.top) - tipHeight - 13;
    const clampLeft = value => Math.max(8, Math.min(value, viewportRect.width - tipWidth - 8));
    let left = clampLeft(center - tipWidth / 2);
    let top = Math.max(8, Math.min(above >= 8 ? above : (lineVisible ? lineY : socketRect.bottom - viewportRect.top) + 13,
        viewportRect.height - tipHeight - 8));
    const card = target.element.closest('[data-geneo-node]')?.getBoundingClientRect();
    if (card && left + tipWidth > card.left - viewportRect.left && left < card.right - viewportRect.left
        && top + tipHeight > card.top - viewportRect.top && top < card.bottom - viewportRect.top)
    {
        const aboveCard = card.top - viewportRect.top - tipHeight - 9;
        const belowCard = card.bottom - viewportRect.top + 9;
        if (aboveCard >= 8) top = aboveCard;
        else if (belowCard + tipHeight <= viewportRect.height - 8) top = belowCard;
        else left = clampLeft(card.left - viewportRect.left - tipWidth - 9);
    }
    tip.style.left = `${left}px`;
    tip.style.top = `${top}px`;
}

function setGeneographConnectionHoverTarget(element)
{
    if (geneoEffectiveCanvasTool() !== 'connect' || !state.geneoConnectionDraft || !element)
    {
        geneoCanvasRuntime.connectionHoverTarget = null;
        updateGeneographConnectionTip();
        return;
    }
    const reference = element.hasAttribute('data-geneo-family-junction')
        ? { familyId: element.dataset.geneoFamilyJunction, port: 'bottom' }
        : { nodeId: element.dataset.geneoPortNode, port: element.dataset.geneoPort };
    geneoCanvasRuntime.connectionHoverTarget = { element, reference };
    geneoCanvasRuntime.connectionPreviewPoint = geneoConnectionPoint(reference);
    main.querySelector('[data-geneo-connection-preview]')?.setAttribute('d',
        geneoRoundedPolylinePath(geneoConnectionPreviewPoints(state.geneoConnectionDraft, geneoCanvasRuntime.connectionPreviewPoint), geneoConnectionToolStyle().cornerRadius));
    updateGeneographConnectionTip();
}

function activateGeneographConnectionPoint(reference)
{
    if (!state.geneoConnectionDraft)
    {
        if (state.geneoTool !== 'connect') geneoConnectionToolRuntime.purpose = 'automatic';
        state.geneoTool = 'connect';
        state.geneoConnectionDraft = reference;
        geneoCanvasRuntime.connectionPreviewPoint = geneoConnectionPoint(reference);
        renderGeneographEditorPreserveScroll();
        return;
    }
    if (geneoConnectionReferencesMatch(state.geneoConnectionDraft, reference))
    {
        exitGeneographConnectionTool();
        return;
    }
    const created = commitGeneographConnection(state.geneoConnectionDraft, reference);
    if (created)
    {
        cancelGeneographConnectionDraft();
        state.geneoTool = 'pan';
        showToast('Connection created.');
    }
    renderGeneographEditorPreserveScroll();
}

function updateGeneographConnectionPreview(event)
{
    if (geneoEffectiveCanvasTool() !== 'connect' || !state.geneoConnectionDraft || !event.target.closest?.('[data-geneo-canvas-viewport]')) return;
    if (geneoCanvasRuntime.connectionHoverTarget?.element?.contains(event.target)) return;
    const clientX = event.clientX;
    const clientY = event.clientY;
    if (geneoCanvasRuntime.connectionPreviewFrame) cancelAnimationFrame(geneoCanvasRuntime.connectionPreviewFrame);
    geneoCanvasRuntime.connectionPreviewFrame = requestAnimationFrame(() =>
    {
        geneoCanvasRuntime.connectionPreviewFrame = null;
        if (!state.geneoConnectionDraft) return;
        const point = geneoCanvasRuntime.connectionHoverTarget?.element?.isConnected
            ? geneoConnectionPoint(geneoCanvasRuntime.connectionHoverTarget.reference)
            : geneoPointerToCanvas({ clientX, clientY });
        geneoCanvasRuntime.connectionPreviewPoint = point;
        const preview = main.querySelector('[data-geneo-connection-preview]');
        if (preview) preview.setAttribute('d', geneoRoundedPolylinePath(geneoConnectionPreviewPoints(state.geneoConnectionDraft, point), geneoConnectionToolStyle().cornerRadius));
    });
}

function startGeneographObjectDrag(event)
{
    if (geneoPointerState || event.isPrimary === false) return;
    const nodeElement = event.target.closest('[data-geneo-node]'); if (!nodeElement || event.button !== 0 ||
      event.target.closest(
          [
              'button',
              'input',
              'textarea',
              'select',
              'a',
              '[contenteditable]',
              '.rich-text-toolbar',
              '.ql-tooltip'
          ].join(',')
      ))
        return;
    const node = getGeneographNode(nodeElement.dataset.geneoNode);
    if (node?.type === 'panel' && geneoEffectiveCanvasTool() === 'select'
        && !geneoPanelDirectTarget(event, nodeElement)) return;
    if (!node || (!['select', 'pan'].includes(geneoEffectiveCanvasTool())
        && !(geneoEffectiveCanvasTool() === 'connect' && geneoSelectedNodeIdSet().has(node.id)))) return;
    if (event.shiftKey || event.ctrlKey || event.metaKey) return;
    if (!geneoSelectedNodeIdSet().has(node.id)) selectGeneographNode(node.id);
    event.preventDefault();
    event.stopPropagation();
    if (geneoNodeEffectiveLocked(node)) return;
    const beforeSnapshot = geneoSnapshot();
    const undoLength = geneoHistoryRuntime.undo.length;
    const redo = [...geneoHistoryRuntime.redo];
    geneoPushHistory(); const point = geneoPointerToCanvas(event);
    const selection = selectedGeneographNodes();
    const nodes = geneoGroupMoveSnapshot(selection);
    const connections = geneoConnectionMoveSnapshot(nodes);
    if (!nodes.length && !connections.length)
    {
        geneoHistoryRuntime.undo.pop(); return;
    }
    geneoPointerState = { kind: 'move-group', pointerId: event.pointerId, beforeSnapshot, undoLength, redo, nodeId: node.id, start: point, x: node.x, y: node.y, nodes, connections, moved: false };
}

function geneoPanelDirectTarget(event, element)
{
    if (event.type === 'click' && event.detail === 0) return true;
    const rect = element.getBoundingClientRect();
    const edge = 12;
    if (event.clientX - rect.left <= edge || rect.right - event.clientX <= edge
        || event.clientY - rect.top <= edge || rect.bottom - event.clientY <= edge) return true;
    const title = element.querySelector('.geneo-panel-title');
    if (!title) return false;
    const titleRect = title.getBoundingClientRect();
    return event.clientX >= titleRect.left && event.clientX <= titleRect.right
        && event.clientY >= titleRect.top && event.clientY <= titleRect.bottom;
}

function geneoNodeInsidePanel(node, panelId)
{
    let parentId = node.parentPanelId;
    while (parentId)
    {
        if (parentId === panelId) return true;
        parentId = getGeneographNode(parentId)?.parentPanelId;
    }
    return false;
}

function startGeneographSelectedConnectionDrag(event, connection)
{
    if (!connection || geneoPointerState || event.isPrimary === false) return false;
    if (event.button !== 0 || !['select', 'pan', 'connect'].includes(geneoEffectiveCanvasTool()) || event.shiftKey || event.ctrlKey || event.metaKey) return false;
    if (!geneoSelectedConnectionIdSet().has(connection.id)) selectGeneographConnection(connection.id);
    const beforeSnapshot = geneoSnapshot();
    const undoLength = geneoHistoryRuntime.undo.length;
    const redo = [...geneoHistoryRuntime.redo];
    geneoPushHistory();
    const nodes = geneoGroupMoveSnapshot(selectedGeneographNodes());
    const connections = geneoConnectionMoveSnapshot(nodes, selectedGeneographConnections());
    if (!nodes.length && !connections.length)
    {
        geneoHistoryRuntime.undo.pop(); return true;
    }
    geneoPointerState = {
        kind: 'move-group',
        pointerId: event.pointerId,
        beforeSnapshot, undoLength, redo,
        nodeId: nodes[0]?.id || null,
        start: geneoPointerToCanvas(event),
        x: nodes[0]?.x || 0,
        y: nodes[0]?.y || 0,
        nodes,
        connections,
        moved: false
    };
    event.preventDefault();
    event.stopPropagation();
    return true;
}

function startGeneographConnectionDrag(event)
{
    const path = event.target.closest('.geneo-connection-hit');
    return path ? startGeneographSelectedConnectionDrag(event,
        getGeneographConnection(path.dataset.geneoConnection)) : false;
}

function startGeneographResize(
    event
)
{
    const button =
        event.target.closest(
            '[data-geneo-resize]'
        );

    if (
        !button
        || event.button !== 0
    )
    {
        return false;
    }

    if (geneoPointerState || event.isPrimary === false) return true;

    const node =
        getGeneographNode(
            button.dataset.geneoNode
        );

    if (
        !node
        || geneoNodeEffectiveLocked(
            node
        )
    )
    {
        return true;
    }

    const beforeSnapshot = geneoSnapshot();
    const undoLength = geneoHistoryRuntime.undo.length;
    const redo = [...geneoHistoryRuntime.redo];
    geneoPushHistory();

    geneoPointerState = {
        kind: 'resize',
        pointerId: event.pointerId,
        beforeSnapshot, undoLength, redo,

        nodeId:
          node.id,

        handle:
          button.dataset.geneoResize,

        start:
          geneoPointerToCanvas(
              event
          ),

        x:
          node.x,

        y:
          node.y,

        width:
          node.width,

        height:
          node.height,

        aspectRatio:
          node.width / node.height,

        lockAspectRatio:
          event.shiftKey
          || geneoShiftPressed,

        moved: false
    };

    event.preventDefault();
    event.stopPropagation();

    return true;
}

function moveGeneographObject(event)
{
    const cropDrag = geneoImageCropRuntime?.drag;
    if (cropDrag && cropDrag.pointerId === event.pointerId)
    {
        if (cropDrag.kind === 'scale')
        {
            const dx = (event.clientX - cropDrag.clientX) / cropDrag.boardZoom;
            const dy = (event.clientY - cropDrag.clientY) / cropDrag.boardZoom;
            const horizontal = cropDrag.handle.includes('e') ? 1 : cropDrag.handle.includes('w') ? -1 : 0;
            const vertical = cropDrag.handle.includes('s') ? 1 : cropDrag.handle.includes('n') ? -1 : 0;
            const delta = (dx * horizontal * cropDrag.baseWidth + dy * vertical * cropDrag.baseHeight)
                / ((horizontal * cropDrag.baseWidth) ** 2 + (vertical * cropDrag.baseHeight) ** 2);
            geneoImageCropRuntime.draft = { zoom: cropDrag.zoom, x: cropDrag.x, y: cropDrag.y };
            geneoScaleImageCropFromHandle(cropDrag.handle, cropDrag.zoom + delta);
        }
        else
        {
            geneoImageCropRuntime.draft.x = cropDrag.x + (event.clientX - cropDrag.clientX) / cropDrag.width;
            geneoImageCropRuntime.draft.y = cropDrag.y + (event.clientY - cropDrag.clientY) / cropDrag.height;
            geneoRefreshImageCropDom();
        }
        return;
    }
    updateGeneographConnectionPreview(event);
    if (!geneoPointerState) return;
    if (geneoPointerState.pointerId !== undefined && event.pointerId !== geneoPointerState.pointerId) return;
    if (geneoPointerState.kind === 'pencil')
    {
        if (event.pointerId !== geneoPointerState.pointerId) return;
        const point = geneoPointerToCanvas(event);
        const previous = geneoPointerState.points.at(-1);
        const minimumDistance = 2 / Math.max(.25, state.geneoZoom / 100);
        if (previous && Math.hypot(point.x - previous.x, point.y - previous.y) < minimumDistance) return;
        geneoPointerState.points.push(point);
        geneoPointerState.moved = true;
        updateGeneographPencilPreview(geneoPointerState.points);
        return;
    }
    if (geneoPointerState.kind === 'pan')
    {
        const dx = event.clientX - geneoPointerState.clientX;
        const dy = event.clientY - geneoPointerState.clientY;
        geneoPointerState.wrap.scrollLeft = geneoPointerState.left - dx;
        geneoPointerState.wrap.scrollTop = geneoPointerState.top - dy;
        geneoPointerState.moved = Math.abs(dx) > 1 || Math.abs(dy) > 1;
        return;
    }
    if (
        geneoPointerState.kind === 'draw-panel'
        || geneoPointerState.kind === 'draw-shape'
    )
    {
        const point = snapGeneographPoint(
            geneoPointerToCanvas(event)
        );

        const rect = geneoPanelDraftRect(
            geneoPointerState.start,
            point
        );

        geneoPointerState.current = point;
        geneoPointerState.moved =
            rect.width > 2
          || rect.height > 2;

        updateGeneographPanelDraftDom(
            geneoPointerState.start,
            point
        );

        return;
    }
    if (geneoPointerState.kind === 'waypoint')
    {
        const connection = getGeneographConnection(geneoPointerState.connectionId);
        const point = snapGeneographPoint(geneoPointerToCanvas(event));
        const waypoint = connection?.route.waypoints[geneoPointerState.index];
        if (waypoint)
        {
            clearGeneographConnectionClick(); waypoint.x = geneoNumber(point.x, waypoint.x, -GENEO_WORLD_LIMIT, GENEO_WORLD_LIMIT); waypoint.y = geneoNumber(point.y, waypoint.y, -GENEO_WORLD_LIMIT, GENEO_WORLD_LIMIT); geneoPointerState.moved = true; const svg = main.querySelector('.geneo-connections'); if (svg) svg.outerHTML = renderGeneographConnectors();
        }
        return;
    }
    if (geneoPointerState.kind === 'family-bus-rail')
    {
        const point = geneoPointerToCanvas(event);
        const bus = geneoPointerState;
        const nextY = geneoClampFamilyBusRailY(bus,
            bus.railY + point.y - bus.start.y);
        if (nextY === bus.railY && !bus.moved) return;
        const currentY = getGeneographConnection(bus.connectionIds[0])?.route?.railY ?? bus.railY;
        if (nextY === currentY) return;
        clearGeneographConnectionClick();
        geneoSetFamilyBusRailY(bus, nextY);
        bus.moved = true;
        const svg = main.querySelector('.geneo-connections');
        if (svg) svg.outerHTML = renderGeneographConnectors();
        return;
    }
    if (geneoPointerState.kind === 'segment')
    {
        const connection = getGeneographConnection(geneoPointerState.connectionId);
        const point = geneoPointerToCanvas(event);
        const dx = point.x - geneoPointerState.start.x;
        const dy = point.y - geneoPointerState.start.y;
        if (Math.hypot(dx, dy) <= 1) return;
        const first = connection?.route.waypoints[geneoPointerState.firstWaypoint];
        const second = connection?.route.waypoints[geneoPointerState.secondWaypoint];
        if (first && second)
        {
            clearGeneographConnectionClick();
            if (geneoPointerState.vertical)
            {
                const x = snapGeneographCoordinate(geneoPointerState.first.x + dx); first.x = x; second.x = x;
            }
            else
            {
                const y = snapGeneographCoordinate(geneoPointerState.first.y + dy); first.y = y; second.y = y;
            }
            geneoPointerState.moved = true;
            const svg = main.querySelector('.geneo-connections'); if (svg) svg.outerHTML = renderGeneographConnectors();
        }
        return;
    }
    if (geneoPointerState.kind === 'marquee')
    {
        const point = geneoPointerToCanvas(event);
        const left = Math.min(geneoPointerState.start.x, point.x);
        const top = Math.min(geneoPointerState.start.y, point.y);
        const right = Math.max(geneoPointerState.start.x, point.x);
        const bottom = Math.max(geneoPointerState.start.y, point.y);
        geneoPointerState.current = point;
        geneoPointerState.moved = Math.abs(right - left) > 2 || Math.abs(bottom - top) > 2;
        const rect = { left, top, right, bottom };
        const hitIds = selectedGeneographDiagram().nodes.filter(node =>
        {
            if (!geneoNodeEffectiveVisible(node)) return false;
            if (geneoPointerState.panelId && !geneoNodeInsidePanel(node, geneoPointerState.panelId)) return false;
            if (node.type === 'panel' && !(node.x >= left && node.y >= top
                && node.x + node.width <= right && node.y + node.height <= bottom)) return false;
            if (node.type === 'drawing') return geneoDrawingIntersectsRect(node, rect);
            return node.x < right && node.x + node.width > left && node.y < bottom && node.y + node.height > top;
        }).map(node => node.id);
        const selectedPanels = new Set(hitIds.filter(id => getGeneographNode(id)?.type === 'panel'));
        const rootHitIds = hitIds.filter(id => ![...selectedPanels].some(panelId => geneoNodeInsidePanel(getGeneographNode(id), panelId)));
        const hitConnectionIds = selectedGeneographDiagram().connections.filter(connection => geneoConnectionIntersectsRect(connection, rect)).map(connection => connection.id);
        const nextIds = geneoPointerState.additive ? [...new Set([...geneoPointerState.baseIds, ...rootHitIds])] : rootHitIds;
        const nextConnectionIds = geneoPointerState.additive ? [...new Set([...geneoPointerState.baseConnectionIds, ...hitConnectionIds])] : hitConnectionIds;
        setGeneographSelection(nextIds, nextConnectionIds, { nodeId: rootHitIds.at(-1) || nextIds.at(-1), connectionId: hitConnectionIds.at(-1) || nextConnectionIds.at(-1) });
        const bounds = geneoCanvasRuntime.bounds || { left: 0, top: 0 };
        const marquee = main.querySelector('[data-geneo-marquee]');
        if (marquee)
        {
            marquee.hidden = false;
            marquee.style.left = `${left - bounds.left}px`; marquee.style.top = `${top - bounds.top}px`;
            marquee.style.width = `${right - left}px`; marquee.style.height = `${bottom - top}px`;
        }
        const selectedIds = geneoSelectedNodeIdSet();
        main.querySelectorAll('article[data-geneo-node]').forEach(element => element.classList.toggle('selected', selectedIds.has(element.dataset.geneoNode)));
        const selectedConnectionIds = geneoSelectedConnectionIdSet();
        main.querySelectorAll('[data-geneo-connection-group]').forEach(element => element.classList.toggle('selected', selectedConnectionIds.has(element.dataset.geneoConnectionGroup)));
        return;
    }
    const node = getGeneographNode(geneoPointerState.nodeId);
    const point = geneoPointerToCanvas(event); const dx = point.x - geneoPointerState.start.x; const dy = point.y - geneoPointerState.start.y; geneoPointerState.moved = Math.abs(dx) > 1 || Math.abs(dy) > 1;
    if (geneoPointerState.moved && geneoPointerState.kind === 'resize') clearGeneographConnectionClick();
    if (geneoPointerState.kind === 'move-group')
    {
        if (!geneoPointerState.moved) return;
        let deltaX = dx, deltaY = dy;
        if (selectedGeneographDiagram().canvas.snapToGrid)
        {
            deltaX = node ? snapGeneographCoordinate(geneoPointerState.x + dx) - geneoPointerState.x : Math.round(dx / GENEO_GRID_SIZE) * GENEO_GRID_SIZE;
            deltaY = node ? snapGeneographCoordinate(geneoPointerState.y + dy) - geneoPointerState.y : Math.round(dy / GENEO_GRID_SIZE) * GENEO_GRID_SIZE;
        }
        if (geneoPointerState.moved) clearGeneographConnectionClick();
        applyGeneographSelectionTranslation(geneoPointerState, deltaX, deltaY);
        updateGeneographLiveGeometry(node, geneoPointerState.nodes.map(item => getGeneographNode(item.id)).filter(Boolean));
        return;
    }
    else
    {
        if (!node) return;

        const diagram =
            selectedGeneographDiagram();

        const handle =
            geneoPointerState.handle;

        const west =
            handle.includes('w');

        const north =
            handle.includes('n');

        const east =
            handle.includes('e');

        const south =
            handle.includes('s');

        if (
            node.type === 'person'
          && (north || south)
        )
        {
            node.personCard.heightMode =
                'manual';
        }

        if (
            node.type === 'place'
          && geneoPointerState.moved
        )
        {
            node.placeSizeMode =
                'manual';
        }

        const fixedLeft =
            geneoPointerState.x;

        const fixedTop =
            geneoPointerState.y;

        const fixedRight =
            geneoPointerState.x
          + geneoPointerState.width;

        const fixedBottom =
            geneoPointerState.y
          + geneoPointerState.height;

        let left =
            west
                ? fixedLeft + dx
                : fixedLeft;

        let right =
            east
                ? fixedRight + dx
                : fixedRight;

        let top =
            north
                ? fixedTop + dy
                : fixedTop;

        let bottom =
            south
                ? fixedBottom + dy
                : fixedBottom;

        if (diagram.canvas.snapToGrid)
        {
            if (west)
            {
                left =
                    snapGeneographCoordinate(
                        left
                    );
            }
            else if (east)
            {
                right =
                    snapGeneographCoordinate(
                        right
                    );
            }

            if (north)
            {
                top =
                    snapGeneographCoordinate(
                        top
                    );
            }
            else if (south)
            {
                bottom =
                    snapGeneographCoordinate(
                        bottom
                    );
            }
        }

        const maximumSize =
            geneoNodeMaximumSize(node);

        const baseMinimumSize =
            geneoNodeMinimumSize(
                node
            );

        let width;
        let height;

        const lockPersonRatio =
            node.type === 'person'
          && (
              event.shiftKey
            || geneoShiftPressed
            || geneoPointerState
                .lockAspectRatio
          )
          && (west || east)
          && (north || south);

        if (lockPersonRatio)
        {
            const rawWidth =
                Math.abs(right - left);

            const rawHeight =
                Math.abs(bottom - top);

            const horizontalIntent =
                Math.abs(
                    rawWidth
                / geneoPointerState.width
              - 1
                );

            const verticalIntent =
                Math.abs(
                    rawHeight
                / geneoPointerState.height
              - 1
                );

            const requestedScale =
                horizontalIntent >= verticalIntent
                    ? rawWidth
                / geneoPointerState.width
                    : rawHeight
                / geneoPointerState.height;

            const minimumScale =
                Math.max(
                    baseMinimumSize.width
                / geneoPointerState.width,
                    baseMinimumSize.height
                / geneoPointerState.height
                );

            const maximumScale =
                Math.min(
                    maximumSize.width
                / geneoPointerState.width,
                    maximumSize.height
                / geneoPointerState.height
                );

            const scale =
                geneoNumber(
                    requestedScale,
                    1,
                    minimumScale,
                    maximumScale
                );

            width =
                geneoPointerState.width
            * scale;

            height =
                geneoPointerState.height
            * scale;
        }
        else
        {
            width =
                geneoNumber(
                    right - left,
                    node.width,
                    baseMinimumSize.width,
                    maximumSize.width
                );

            height =
                geneoNumber(
                    bottom - top,
                    node.height,
                    baseMinimumSize.height,
                    maximumSize.height
                );
        }

        if (node.type === 'person' && diagram.canvas.snapToGrid && !lockPersonRatio)
        {
            const socketStep = GENEO_GRID_SIZE * 2;
            if (west || east)
                width = Math.max(
                    Math.ceil(baseMinimumSize.width / socketStep) * socketStep,
                    Math.min(Math.floor(maximumSize.width / socketStep) * socketStep,
                        Math.round(width / socketStep) * socketStep)
                );
            if (north || south)
                height = Math.max(
                    Math.ceil(baseMinimumSize.height / socketStep) * socketStep,
                    Math.min(Math.floor(maximumSize.height / socketStep) * socketStep,
                        Math.round(height / socketStep) * socketStep)
                );
        }

        /*
        * Preserve the opposite horizontal edge
        * after width clamping.
        */
        if (west)
        {
            left =
                fixedRight - width;

            right =
                fixedRight;
        }
        else
        {
            left =
                fixedLeft;

            right =
                fixedLeft + width;
        }

        /*
        * Preserve the opposite vertical edge
        * after height clamping.
        */
        if (north)
        {
            top =
                fixedBottom - height;

            bottom =
                fixedBottom;
        }
        else
        {
            top =
                fixedTop;

            bottom =
                fixedTop + height;
        }

        node.x =
            geneoNumber(
                left,
                node.x,
                -GENEO_WORLD_LIMIT,
                GENEO_WORLD_LIMIT
            );

        node.y =
            geneoNumber(
                top,
                node.y,
                -GENEO_WORLD_LIMIT,
                GENEO_WORLD_LIMIT
            );

        node.width =
            width;

        node.height =
            height;
    }
    updateGeneographLiveGeometry(node, geneoPointerState.kind === 'move-group' ? geneoPointerState.nodes.map(item => getGeneographNode(item.id)).filter(Boolean) : [node]);
}

function updateGeneographLiveGeometry(
    node,
    nodes = [node]
)
{
    const bounds =
        geneoCanvasRuntime.bounds
        || {
            left: 0,
            top: 0
        };

    nodes.forEach(item =>
    {
        const element =
            main.querySelector(
                `article[data-geneo-node="${
                    CSS.escape(
                        item.id
                    )
                }"]`
            );

        if (!element) return;

        element.style.left =
            `${
                item.x - bounds.left
            }px`;

        element.style.top =
            `${
                item.y - bounds.top
            }px`;

        element.style.width =
            `${item.width}px`;

        element.style.height =
            `${item.height}px`;
    });

    const svg =
        main.querySelector(
            '.geneo-connections'
        );

    if (svg)
    {
        svg.outerHTML =
            renderGeneographConnectors();
    }
}

function endGeneographObjectDrag(event)
{
    if (geneoImageCropRuntime?.drag?.pointerId === event.pointerId)
    {
        geneoImageCropRuntime.drag = null;
        return;
    }
    if (geneoPointerState?.pointerId !== undefined && event.pointerId !== geneoPointerState.pointerId) return;
    if (geneoPointerState?.kind === 'pencil' && event?.type === 'pointerup' && (event.buttons & 1)) return;
    if (!geneoPointerState) return; const stateBefore = geneoPointerState; geneoPointerState = null;
    if (event?.type === 'pointercancel' && stateBefore.beforeSnapshot)
    {
        geneoDrawPanPending = false;
        const board = selectedGeneographBoard();
        if (board) board.diagram = JSON.parse(stateBefore.beforeSnapshot);
        geneoHistoryRuntime.undo.length = stateBefore.undoLength;
        geneoHistoryRuntime.redo = stateBefore.redo;
        renderGeneographEditorPreserveScroll();
        return;
    }
    if (stateBefore.kind === 'pencil')
    {
        const switchToPan = geneoDrawPanPending;
        geneoDrawPanPending = false;
        updateGeneographPencilPreview();
        if (stateBefore.wrap?.hasPointerCapture?.(stateBefore.pointerId))
        {
            stateBefore.wrap.releasePointerCapture(stateBefore.pointerId);
        }
        geneoCanvasRuntime.suppressNodeClick = true;
        requestAnimationFrame(() =>
        {
            geneoCanvasRuntime.suppressNodeClick = false;
        });
        if (switchToPan)
        {
            geneoCreationToolSettings('drawing').panelOpen = false;
            state.geneoTool = 'pan';
            setGeneoCtrlSelectPressed(false);
        }
        if (event?.type === 'pointercancel')
        {
            if (switchToPan) renderGeneographEditorPreserveScroll();
            return;
        }
        const drawing = createGeneographDrawingFromPoints(stateBefore.points, stateBefore.beforeSnapshot);
        if (!drawing)
        {
            if (switchToPan) renderGeneographEditorPreserveScroll();
            return;
        }
        renderGeneographEditorPreserveScroll();
        requestAnimationFrame(() => main.querySelector(`[data-geneo-node="${CSS.escape(drawing.id)}"]`)?.focus({ preventScroll: true }));
        return;
    }
    if (
        stateBefore.kind === 'draw-panel'
        || stateBefore.kind === 'draw-shape'
    )
    {
        hideGeneographPanelDraftDom();

        geneoCanvasRuntime.suppressNodeClick = true;

        requestAnimationFrame(() =>
        {
            geneoCanvasRuntime.suppressNodeClick = false;
        });

        const rect = geneoPanelDraftRect(
            stateBefore.start,
            stateBefore.current || stateBefore.start
        );

        const drawingShape = stateBefore.kind === 'draw-shape';
        const defaults = geneoNodeDefaults(drawingShape ? 'shape' : 'panel');

        if (drawingShape && !stateBefore.moved)
        {
            const shape = createGeneographShapeFromRect(
                { x: stateBefore.start.x, y: stateBefore.start.y },
                { useDefaultSize: true }
            );
            if (!shape) return;
            finishGeneographPlacementTool();
            renderGeneographEditorPreserveScroll();
            requestAnimationFrame(() => main.querySelector(`[data-geneo-node="${CSS.escape(shape.id)}"]`)?.focus({ preventScroll: true }));
            return;
        }

        if (
            !stateBefore.moved
          || rect.width < defaults.minWidth
          || rect.height < defaults.minHeight
        )
        {
            if (stateBefore.moved)
            {
                showToast(
                    `${drawingShape ? 'Shape' : 'Panel'} must be at least ${defaults.minWidth} × ${defaults.minHeight}.`
                );
            }

            return;
        }

        const panel = drawingShape
            ? createGeneographShapeFromRect(rect)
            : createGeneographPanelFromRect(rect);

        if (!panel) return;

        finishGeneographPlacementTool();

        renderGeneographEditorPreserveScroll();
        requestAnimationFrame(() =>
        {
            main
                .querySelector(
                    `[data-geneo-node="${CSS.escape(panel.id)}"]`
                )
                ?.focus({ preventScroll: true });
        });

        return;
    }
    if (stateBefore.kind === 'pan')
    {
        if (stateBefore.fromConnect && stateBefore.moved)
        {
            geneoCanvasRuntime.suppressNodeClick = true;
            requestAnimationFrame(() => { geneoCanvasRuntime.suppressNodeClick = false; });
        }
        captureGeneographViewport();
        expandGeneographCanvasNearEdge();
        return;
    }
    if (stateBefore.kind === 'marquee')
    {
        geneoCanvasRuntime.suppressNodeClick = stateBefore.moved;
        requestAnimationFrame(() =>
        {
            geneoCanvasRuntime.suppressNodeClick = false;
        });
        renderGeneographEditorPreserveScroll(); return;
    }
    if (!stateBefore.moved)
    {
        geneoHistoryRuntime.undo.pop(); return;
    }
    geneoCanvasRuntime.suppressNodeClick = true;
    requestAnimationFrame(() =>
    {
        geneoCanvasRuntime.suppressNodeClick = false;
    });
    const node = getGeneographNode(stateBefore.nodeId);
    if (stateBefore.kind === 'resize' && node?.type === 'panel')
    {
        reconcileGeneographPanelMembership(node.id);
    }
    else if (stateBefore.kind === 'move-group')
    {
        const movedNodes = stateBefore.nodes.map(item => getGeneographNode(item.id)).filter(Boolean);
        const movedPanels = movedNodes.filter(item => item.type === 'panel');
        movedPanels.forEach(panel => reconcileGeneographPanelMembership(panel.id));
        if (movedNodes.length === 1 && movedNodes[0].type !== 'panel')
        {
            movedNodes[0].parentPanelId = geneoContainingPanelForNode(movedNodes[0])?.id || null;
        }
    }
    touchGeneographBoard(); renderGeneographEditorPreserveScroll();
}

function commitGeneoInlineEdit(
    cancel = false
)
{
    const node =
        getGeneographNode(
            state.geneoInlineEditNodeId
        );

    if (!node)
    {
        destroyGeneographRichTextEditor();

        state.geneoInlineEditNodeId =
            null;

        state.geneoInlineEditSelectAll =
            false;

        state.geneoInlineEditSurface =
            'canvas';

        return;
    }

    if (
        isGeneographRichTextNode(
            node
        )
    )
    {
        if (!cancel)
        {
            const activeRuntime =
                geneoRichTextRuntime
                    .nodeId === node.id;

            const nextDelta =
                activeRuntime
                    ? cloneRichTextDelta(
                        geneoRichTextRuntime
                            .draftDelta
                    )
                    : cloneRichTextDelta(
                        node.textDelta
                    );

            const nextText =
                activeRuntime
                    ? String(
                        geneoRichTextRuntime
                            .draftText || ''
                    )
                    : String(
                        node.text || ''
                    );

            const changed =
                node.text !== nextText
            || !richTextDeltasEqual(
                node.textDelta,
                nextDelta
            );

            if (changed)
            {
                geneoPushHistory();

                node.text =
                    nextText;

                node.textDelta =
                    nextDelta;

                node.textFormat =
                    nextDelta
                        ? 'quill-delta-v1'
                        : '';

                touchGeneographBoard();
            }
        }

        destroyGeneographRichTextEditor();
    }
    else
    {
        const input =
            main.querySelector(
                '[data-geneo-inline-input]'
            );

        if (
            !cancel
          && input
        )
        {
            const nextTitle =
                String(
                    input.value ?? ''
                )
                    .trim()
                    .slice(0, 160);

            if (
                node.title
            !== nextTitle
            )
            {
                geneoPushHistory();

                node.title =
                    nextTitle;

                touchGeneographBoard();
            }
        }
    }

    state.geneoInlineEditNodeId =
        null;

    state.geneoInlineEditSelectAll =
        false;

    state.geneoInlineEditSurface =
        'canvas';

    renderGeneographEditorPreserveScroll();
}

function geneoRelationshipEditorFingerprint(editor)
{
    return JSON.stringify([...editor.querySelectorAll('input, select')]
        .filter(input => !input.matches('[data-geneo-show-relationship-dates]'))
        .map(input => [input.id, input.value, input.dataset.placeId || '', input.dataset.placeCoordinates || '']));
}

function saveGeneographPartnerRelationship(editor)
{
    const connection = selectedGeneographConnection();
    const family = connection?.kind === 'family-partner' ? getGeneographFamily(connection.familyId) : null;
    if (!connection || !family || !editor) return false;
    const relationshipType = editor.querySelector('[data-geneo-relationship-type]')?.value || 'Married';
    const definition = partnerRelationshipDefinition(relationshipType);
    const startDate = collectGenealogyDateField('geneoRelationshipStartDate');
    const endDate = definition.hasEnd ? collectGenealogyDateField('geneoRelationshipEndDate') : emptyGenealogyDate('Exact date');
    if (!startDate || (definition.hasEnd && !endDate))
    {
        return false;
    }
    if (definition.hasEnd && !partnerRelationshipDateOrderIsValid(startDate, endDate))
    {
        setGenealogyDateFieldError(editor.querySelector('[data-genealogy-date-field="geneoRelationshipEndDate"]'),
            'The relationship end date must be after or equal to the start date.');
        return false;
    }
    const beforeSnapshot = geneoSnapshot();
    const resolved = geneoRelationshipForFamily(family);
    if (!resolved.relationship)
    {
        showToast('The relationship could not be updated.'); return false;
    }
    const focusedId = editor.contains(document.activeElement) ? document.activeElement.id : '';
    geneoPushHistorySnapshot(beforeSnapshot);
    upsertPartnerRelationshipEvents(resolved.relationship, {
        relationshipType,
        marriageType: editor.querySelector('[data-geneo-marriage-type]')?.value || 'Civil',
        startDate,
        startPlace: readPlaceInputValue('[data-partner-relationship-start-place]', editor),
        endDate,
        endPlace: definition.hasEnd ? readPlaceInputValue('[data-partner-relationship-end-place]', editor) : { text: '', selectedPlaceId: '' }
    }, { resolvePlace: geneoResolveBoardPersonPlace });
    resolved.relationship.updatedAt = 'Just now';
    touchGeneographBoard();
    renderGeneographEditorPreserveScroll({ preserveInspectorScroll: true });
    if (focusedId) requestAnimationFrame(() => main.querySelector(`#${CSS.escape(focusedId)}`)?.focus({ preventScroll: true }));
    return true;
}

function bindGeneographInspectorNameField()
{
    const input =
        main.querySelector(
            '[data-geneo-entity-name]'
        );

    if (!input) return;

    const entityType =
        input.dataset.geneoEntityName;

    const entityId =
        input.dataset.geneoEntityId;

    input.addEventListener(
        'keydown',
        event =>
        {
            if (event.key === 'Enter')
            {
                event.preventDefault();
                event.stopPropagation();
                input.blur();
                return;
            }

            if (event.key !== 'Escape')
            {
                return;
            }

            event.preventDefault();
            event.stopPropagation();

            const entity =
                getGeneographRenameEntity(
                    entityType,
                    entityId
                );

            input.value =
                localizedDataFieldValue(
                    normalizeGeneographLayerName(
                        entity?.name
                    )
                );

            input.blur();
        }
    );

    input.addEventListener(
        'change',
        event =>
        {
            const changed =
                renameGeneographEntity(
                    entityType,
                    entityId,
                    collectLocalizedDataFieldValue(
                        event.target,
                        event.target.dataset
                            .geneoEntitySourceName
                    )
                );

            if (!changed) return;

            renderGeneographEditorPreserveScroll({
                preserveInspectorScroll: true
            });
        }
    );
}

function bindGeneographNodeHeader()
{
    const node = selectedGeneographNode();
    const connection = node ? null : selectedGeneographConnection();
    const entity = node || connection;
    const entityType = node ? 'node' : 'connection';
    if (!entity) return;
    const renameButton = main.querySelector('[data-geneo-header-rename]');
    const input = main.querySelector('[data-geneo-header-name-input]');
    const heading = main.querySelector('[data-geneo-header-name]');
    if (renameButton && input && heading)
    {
        renameButton.addEventListener('click', () =>
        {
            heading.hidden = true;
            input.hidden = false;
            input.focus({ preventScroll: true });
            input.select();
        });
        let finished = false;
        const finish = cancel =>
        {
            if (finished || input.hidden) return;
            finished = true;
            const originalName = normalizeGeneographLayerName(entity.name);
            const displayedName = localizedDataFieldValue(originalName || (node ? geneoNodeTitle(node) : geneoConnectionLabel(connection)));
            if (!cancel)
            {
                const nextName = input.value === displayedName
                    ? originalName
                    : collectLocalizedDataFieldValue(input, originalName);
                renameGeneographEntity(entityType, entity.id, nextName);
            }
            renderGeneographEditorPreserveScroll({ preserveInspectorScroll: true });
            requestAnimationFrame(() => main.querySelector('[data-geneo-header-rename]')?.focus({ preventScroll: true }));
        };
        input.addEventListener('keydown', event =>
        {
            if (!['Enter', 'Escape'].includes(event.key)) return;
            event.preventDefault();
            event.stopPropagation();
            finish(event.key === 'Escape');
        });
        input.addEventListener('blur', () => finish(false));
    }
    for (const [selector, key] of [['[data-geneo-header-lock]', 'locked'], ['[data-geneo-header-visible]', 'visible']])
    {
        main.querySelector(selector)?.addEventListener('click', () =>
        {
            const current = entityType === 'node' ? getGeneographNode(entity.id) : getGeneographConnection(entity.id);
            if (!current) return;
            geneoPushHistory();
            current[key] = !current[key];
            touchGeneographBoard();
            renderGeneographEditorPreserveScroll({ preserveInspectorScroll: true });
            requestAnimationFrame(() => main.querySelector(selector)?.focus({ preventScroll: true }));
        });
    }
}

function bindGeneographPersonCardControls()
{
    const diagram =
        selectedGeneographDiagram();

    if (!diagram) return;

    const commit = (
        scaleMap = null
    ) =>
    {
        diagram.personCardDefaults =
            normalizeGeneographPersonCardSettings(
                diagram.personCardDefaults
            );
        if (
            scaleMap instanceof Map
        )
        {
            geneoRestorePersonCardDimensions(
                scaleMap,
                diagram
            );
        }

        diagram.nodes
            .filter(
                node =>
                    node.type === 'person'
            )
            .forEach(
                node =>
                    ensureGeneographPersonCardSize(
                        node,
                        diagram
                    )
            );

        touchGeneographBoard();

        renderGeneographEditorPreserveScroll({
            preserveInspectorScroll: true,
            preserveSidebarScroll: true
        });
    };

    const ensureCustomNode =
        node =>
        {
            if (
                node?.type !== 'person'
            )
            {
                return null;
            }

            if (
                node.personCard?.custom
            !== true
            )
            {
                const heightMode =
                    node.personCard?.heightMode;

                node.personCard =
                    geneoEmptyPersonCardOverrides(
                        true,
                        heightMode
                    );
            }

            node.personCard.fields =
                node.personCard.fields
            || {};

            return node;
        };

    main
        .querySelectorAll(
            '[data-geneo-person-card-style]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () =>
                {
                    const value =
                        button.dataset
                            .geneoPersonCardStyle;

                    const scope =
                        button.dataset
                            .geneoPersonCardScope;

                    if (
                        !geneoPersonCardSettingValueIsValid(
                            'style',
                            value
                        )
                    )
                    {
                        return;
                    }

                    if (scope === 'multi')
                    {
                        const nodes = selectedGeneographNodes().filter(node => node.type === 'person');
                        if (!nodes.length || nodes.every(node =>
                            geneoPersonCardEffectiveSettings(node, diagram).style === value)) return;
                        const scales = geneoCapturePersonCardDimensions(nodes, diagram);
                        geneoPushHistory();
                        nodes.forEach(node =>
                        {
                            ensureCustomNode(node);
                            node.personCard.style = value === diagram.personCardDefaults.style ? null : value;
                        });
                        commit(scales);
                        return;
                    }

                    if (scope === 'board')
                    {
                        if (
                            diagram
                                .personCardDefaults
                                .style
                  === value
                        )
                        {
                            return;
                        }

                        const scales =
                            geneoCapturePersonCardDimensions(
                                diagram.nodes,
                                diagram
                            );

                        geneoPushHistory();

                        const previousStyle =
                            diagram.personCardDefaults.style;

                        const photoByStyle = {
                            ...geneoPersonCardDefaultPhotoPreferences(),
                            ...diagram.personCardDefaults
                                .photoByStyle
                        };

                        photoByStyle[previousStyle] =
                            diagram.personCardDefaults
                                .fields.photo;

                        diagram.personCardDefaults
                            .photoByStyle = photoByStyle;

                        diagram.personCardDefaults
                            .fields.photo =
                                photoByStyle[value];

                        diagram
                            .personCardDefaults
                            .style =
                                value;

                        commit(scales);
                        return;
                    }

                    const node =
                        getGeneographNode(
                            button.dataset
                                .geneoPersonCardNode
                        );

                    if (node?.type !== 'person')
                    {
                        return;
                    }

                    const effective =
                        geneoPersonCardEffectiveSettings(
                            node,
                            diagram
                        );

                    if (
                        effective.style === value
                    )
                    {
                        return;
                    }

                    const scales =
                        geneoCapturePersonCardDimensions(
                            [node],
                            diagram
                        );

                    geneoPushHistory();
                    ensureCustomNode(node);

                    const boardValue =
                        diagram
                            .personCardDefaults
                            .style;

                    node.personCard.style =
                        value === boardValue
                            ? null
                            : value;

                    commit(scales);
                }
            );
        });

    main
        .querySelector(
            '[data-geneo-person-card-reset]'
        )
        ?.addEventListener(
            'click',
            event =>
            {
                const node =
                    getGeneographNode(
                        event.target.dataset
                            .geneoPersonCardNode
                    );

                if (
                    node?.type !== 'person'
                )
                {
                    return;
                }

                if (!geneoPersonHasResettableSettings(node))
                {
                    return;
                }

                geneoPushHistory();
                geneoResetPersonCardSettings(node, diagram);
                commit();
            }
        );

    main.querySelector('[data-geneo-node-appearance-reset]')?.addEventListener('click', event =>
    {
        const node = getGeneographNode(event.currentTarget.dataset.geneoNodeAppearanceReset);
        if (!node || node.type === 'person' || geneoNodeAppearanceIsDefault(node)) return;
        geneoPushHistory();
        node.appearance = structuredClone(geneoNodeDefaults(node.type).appearance);
        touchGeneographBoard();
        renderGeneographEditorPreserveScroll({ preserveInspectorScroll: true });
    });

    main
        .querySelectorAll(
            '[data-geneo-person-card-setting]'
        )
        .forEach(select =>
        {
            select.addEventListener(
                'change',
                () =>
                {
                    const key =
                        select.dataset
                            .geneoPersonCardSetting;

                    const scope =
                        select.dataset
                            .geneoPersonCardScope;

                    const value =
                        select.value;

                    if (
                        !geneoPersonCardSettingValueIsValid(
                            key,
                            value
                        )
                    )
                    {
                        return;
                    }

                    if (scope === 'board')
                    {
                        if (
                            normalizeGeneographPersonCardSettings(
                                diagram.personCardDefaults
                            ).styleSettings[diagram.personCardDefaults.style][key] === value
                        )
                        {
                            return;
                        }

                        geneoPushHistory();

                        diagram.personCardDefaults
                            .styleSettings[diagram.personCardDefaults.style][key] = value;

                        commit();
                        return;
                    }

                    const node =
                        getGeneographNode(
                            select.dataset
                                .geneoPersonCardNode
                        );

                    if (node?.type !== 'person')
                    {
                        return;
                    }

                    const effective =
                        geneoPersonCardEffectiveSettings(
                            node
                        );

                    if (
                        effective[key] === value
                    )
                    {
                        return;
                    }

                    geneoPushHistory();
                    ensureCustomNode(node);

                    const style = effective.style;
                    const boardValue = normalizeGeneographPersonCardSettings(
                        diagram.personCardDefaults
                    ).styleSettings[style][key];
                    node.personCard.styleSettings ||= {};
                    node.personCard.styleSettings[style] ||= { fields: {} };
                    node.personCard.styleSettings[style][key] =
                        value === boardValue ? null : value;

                    commit();
                }
            );
        });

    main
        .querySelectorAll(
            '[data-geneo-person-card-field]'
        )
        .forEach(input =>
        {
            input.addEventListener(
                'change',
                () =>
                {
                    const field =
                        input.dataset
                            .geneoPersonCardField;

                    const scope =
                        input.dataset
                            .geneoPersonCardScope;

                    if (
                        !Object.hasOwn(
                            geneoDefaultPersonCardSettings()
                                .fields,
                            field
                        )
                    )
                    {
                        return;
                    }

                    if (scope === 'board')
                    {
                        const current =
                            diagram
                                .personCardDefaults
                                .fields[field];

                        if (
                            current
                  === input.checked
                        )
                        {
                            return;
                        }

                        geneoPushHistory();

                        diagram.personCardDefaults.fields[field] = input.checked;
                        if (field !== 'linkIndicator')
                            diagram.personCardDefaults.styleSettings[
                                diagram.personCardDefaults.style
                            ].fields[field] = input.checked;

                        if (field === 'photo')
                        {
                            diagram.personCardDefaults
                                .photoByStyle = {
                                    ...geneoPersonCardDefaultPhotoPreferences(),
                                    ...diagram.personCardDefaults
                                        .photoByStyle,
                                    [diagram.personCardDefaults.style]:
                        input.checked
                                };
                        }

                        commit();
                        return;
                    }

                    const node =
                        getGeneographNode(
                            input.dataset
                                .geneoPersonCardNode
                        );

                    if (node?.type !== 'person')
                    {
                        return;
                    }

                    const effective =
                        geneoPersonCardEffectiveSettings(
                            node
                        );

                    if (
                        effective.fields[field]
                === input.checked
                    )
                    {
                        return;
                    }

                    geneoPushHistory();
                    ensureCustomNode(node);

                    node.personCard.fields =
                        node.personCard.fields
                || {};

                    const boardSettings =
                        normalizeGeneographPersonCardSettings(
                            diagram.personCardDefaults
                        );

                    const boardValue = boardSettings.styleSettings[
                        effective.style
                    ].fields[field];

                    node.personCard.styleSettings ||= {};
                    node.personCard.styleSettings[effective.style] ||= { fields: {} };
                    const styleFields = node.personCard.styleSettings[
                        effective.style
                    ].fields;

                    if (field === 'photo')
                    {
                        node.personCard.photoByStyle =
                            node.personCard.photoByStyle
                  || {};

                        delete styleFields.photo;

                        if (input.checked === boardValue)
                        {
                            delete node.personCard
                                .photoByStyle[
                                    effective.style
                                ];
                        }
                        else
                        {
                            node.personCard
                                .photoByStyle[
                                    effective.style
                                ] = input.checked;
                        }
                    }
                    else if (
                        input.checked === boardValue
                    )
                    {
                        delete styleFields[field];
                    }
                    else
                    {
                        styleFields[field] = input.checked;
                    }

                    commit();
                }
            );
        });

    main
        .querySelectorAll(
            '[data-geneo-person-card-radius]'
        )
        .forEach(input =>
        {
            input.addEventListener(
                'change',
                () =>
                {
                    const radius =
                        Math.round(
                            geneoNumber(
                                input.value,
                                8,
                                0,
                                32
                            )
                        );

                    const scope =
                        input.dataset
                            .geneoPersonCardRadius;

                    if (scope === 'board')
                    {
                        if (
                            diagram
                                .personCardDefaults
                                .cornerRadius
                  === radius
                        )
                        {
                            return;
                        }

                        geneoPushHistory();

                        diagram
                            .personCardDefaults
                            .cornerRadius =
                                radius;

                        commit();
                        return;
                    }

                    const node =
                        getGeneographNode(
                            input.dataset
                                .geneoPersonCardNode
                        );

                    if (node?.type !== 'person')
                    {
                        return;
                    }

                    if (
                        geneoPersonCardEffectiveSettings(
                            node
                        ).cornerRadius
                === radius
                    )
                    {
                        return;
                    }

                    geneoPushHistory();
                    ensureCustomNode(node);

                    const boardRadius =
                        geneoCardAppearanceForNode(node, diagram)?.cornerRadius
                        ?? diagram.personCardDefaults.cornerRadius;

                    node.personCard
                        .cornerRadius =
                            radius === boardRadius
                                ? null
                                : radius;

                    commit();
                }
            );
        });

    /*
       * Multi-person presentation controls.
       */
    main
        .querySelectorAll(
            '[data-geneo-person-multi-field]'
        )
        .forEach(input =>
        {
            input.indeterminate =
                input.dataset.mixed
            === 'true';

            input.addEventListener(
                'change',
                () =>
                {
                    const nodes =
                        selectedGeneographNodes()
                            .filter(
                                node =>
                                    node.type
                      === 'person'
                            );

                    if (!nodes.length) return;

                    const field =
                        input.dataset
                            .geneoPersonMultiField;

                    if (
                        !Object.hasOwn(
                            geneoDefaultPersonCardSettings()
                                .fields,
                            field
                        )
                    )
                    {
                        return;
                    }

                    geneoPushHistory();

                    nodes.forEach(node =>
                    {
                        ensureCustomNode(node);

                        const effective =
                            geneoPersonCardEffectiveSettings(
                                node,
                                diagram
                            );

                        const boardSettings =
                            normalizeGeneographPersonCardSettings(
                                diagram.personCardDefaults
                            );

                        const boardValue = boardSettings.styleSettings[
                            effective.style
                        ].fields[field];
                        node.personCard.styleSettings ||= {};
                        node.personCard.styleSettings[effective.style] ||= { fields: {} };
                        const styleFields = node.personCard.styleSettings[
                            effective.style
                        ].fields;

                        if (field === 'photo')
                        {
                            node.personCard.photoByStyle =
                                node.personCard.photoByStyle
                    || {};

                            delete styleFields.photo;

                            if (input.checked === boardValue)
                            {
                                delete node.personCard
                                    .photoByStyle[
                                        effective.style
                                    ];
                            }
                            else
                            {
                                node.personCard
                                    .photoByStyle[
                                        effective.style
                                    ] = input.checked;
                            }
                        }
                        else if (
                            input.checked === boardValue
                        )
                        {
                            delete styleFields[field];
                        }
                        else
                        {
                            styleFields[field] = input.checked;
                        }
                    });

                    commit();
                }
            );
        });

    main
        .querySelectorAll(
            '[data-geneo-person-multi-setting]'
        )
        .forEach(select =>
        {
            select.addEventListener(
                'change',
                () =>
                {
                    const value =
                        select.value;

                    const key =
                        select.dataset
                            .geneoPersonMultiSetting;

                    if (
                        !value
                || !geneoPersonCardSettingValueIsValid(
                    key,
                    value
                )
                    )
                    {
                        return;
                    }

                    const nodes =
                        selectedGeneographNodes()
                            .filter(
                                node =>
                                    node.type
                      === 'person'
                            );

                    if (!nodes.length) return;

                    const scales =
                        geneoCapturePersonCardDimensions(
                            nodes,
                            diagram
                        );

                    geneoPushHistory();

                    nodes.forEach(node =>
                    {
                        ensureCustomNode(node);

                        if (key === 'style')
                        {
                            node.personCard.style =
                                value === diagram.personCardDefaults.style
                                    ? null : value;
                        }
                        else
                        {
                            const style = geneoPersonCardEffectiveSettings(node, diagram).style;
                            const boardValue = normalizeGeneographPersonCardSettings(
                                diagram.personCardDefaults
                            ).styleSettings[style][key];
                            node.personCard.styleSettings ||= {};
                            node.personCard.styleSettings[style] ||= { fields: {} };
                            node.personCard.styleSettings[style][key] =
                                value === boardValue ? null : value;
                        }
                    });

                    commit(scales);
                }
            );
        });

    main.querySelector('[data-geneo-person-multi-reset]')?.addEventListener('click', () =>
    {
        const nodes = selectedGeneographNodes().filter(geneoPersonHasResettableSettings);
        if (!nodes.length) return;
        geneoPushHistory();
        nodes.forEach(node => geneoResetPersonCardSettings(node, diagram));
        commit();
    });
}

function bindGeneographPersonMultiAppearance()
{
    const diagram = selectedGeneographDiagram();
    if (!diagram) return;
    const selected = () => selectedGeneographNodes().filter(node => node.type === 'person');
    const commit = update =>
    {
        const nodes = selected();
        if (!nodes.length) return;
        geneoPushHistory();
        nodes.forEach(node => update(node));
        touchGeneographBoard();
        renderGeneographEditorPreserveScroll({
            preserveInspectorScroll: true, preserveSidebarScroll: true
        });
    };
    const updatePaint = (property, field, value) => commit(node =>
    {
        const appearance = geneoResolveVisibleNodeAppearance(node);
        node.appearance[property] = { ...appearance[property], [field]: value };
        node.appearance.paintOverrides ||= { fill: false, stroke: false, text: false };
        node.appearance.paintOverrides[property] = true;
    });

    main.querySelectorAll('[data-geneo-person-multi-paint-hex]')
        .forEach(input => input.addEventListener('change', () =>
        {
            const value = input.value.trim();
            if (!/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value))
            {
                input.setCustomValidity(t('Enter a valid hex color.'));
                input.reportValidity();
                input.focus();
                return;
            }
            input.setCustomValidity('');
            updatePaint(input.dataset.geneoPersonMultiPaintHex, 'color', normalizeGeneoHexColor(value));
        }));
    main.querySelectorAll('[data-geneo-person-multi-paint-opacity]')
        .forEach(input => input.addEventListener('change', () =>
        {
            if (input.value.trim() === '' || !input.checkValidity())
            {
                input.reportValidity();
                input.focus();
                return;
            }
            updatePaint(input.dataset.geneoPersonMultiPaintOpacity, 'opacity', Number(input.value));
        }));
    main.querySelectorAll('[data-geneo-person-multi-paint-toggle]')
        .forEach(button => button.addEventListener('click', () =>
        {
            const property = button.dataset.geneoPersonMultiPaintToggle;
            const enabled = selected().every(node =>
                geneoResolveVisibleNodeAppearance(node)[property].enabled === false);
            updatePaint(property, 'enabled', enabled);
        }));
    main.querySelectorAll('[data-geneo-person-multi-appearance]')
        .forEach(input => input.addEventListener('change', () =>
        {
            const key = input.dataset.geneoPersonMultiAppearance;
            let value = input.value;
            if (key === 'strokePattern')
            {
                if (!['solid', 'dashed'].includes(value)) return;
            }
            else
            {
                if (value.trim() === '' || !input.checkValidity())
                {
                    input.reportValidity();
                    input.focus();
                    return;
                }
                value = Number(value);
            }
            commit(node =>
            {
                if (key === 'cornerRadius')
                {
                    node.personCard = normalizeGeneographPersonCardOverrides(node.personCard);
                    node.personCard.custom = true;
                    const boardRadius = geneoCardAppearanceForNode(node, diagram)?.cornerRadius
                        ?? diagram.personCardDefaults.cornerRadius;
                    node.personCard.cornerRadius = value === boardRadius ? null : value;
                }
                else
                {
                    node.appearance[key] = value;
                    node.appearance.styleOverrides ||= { strokeWidth: false, strokePattern: false };
                    node.appearance.styleOverrides[key] = true;
                }
            });
        }));
    main.querySelector('[data-geneo-person-multi-apply-gender]')?.addEventListener('click', () =>
        commit(node => geneoApplyPersonGenderAppearance(node, diagram)));
}

function geneoUpdateBulkNodeAppearance(node, property, field, value, diagram)
{
    if (property === 'fontSize' && node.type === 'place' && node.appearance.fontSize !== value)
    {
        node.placeSizeMode = 'manual';
    }
    if (property === 'cornerRadius' && node.type === 'person')
    {
        node.personCard = normalizeGeneographPersonCardOverrides(node.personCard);
        node.personCard.custom = true;
        const inherited = geneoCardAppearanceForNode(node, diagram)?.cornerRadius
            ?? diagram.personCardDefaults.cornerRadius;
        node.personCard.cornerRadius = value === inherited ? null : value;
        return;
    }
    if (field)
    {
        const paint = geneoBulkNodeValue(node, property);
        node.appearance[property] = { ...paint, [field]: value };
        if (node.type === 'person')
        {
            node.appearance.paintOverrides ||= { fill: false, stroke: false, text: false };
            node.appearance.paintOverrides[property] = true;
        }
        return;
    }
    node.appearance[property] = value;
    if (node.type === 'person' && ['strokeWidth', 'strokePattern'].includes(property))
    {
        node.appearance.styleOverrides ||= { strokeWidth: false, strokePattern: false };
        node.appearance.styleOverrides[property] = true;
    }
}

function geneoResetBulkNodeAppearance(node, diagram)
{
    if (node.type !== 'person')
    {
        node.appearance = structuredClone(geneoNodeDefaults(node.type).appearance);
        return;
    }
    const inherited = geneoPersonGenderAppearance(node, diagram);
    for (const key of ['fill', 'stroke', 'text']) node.appearance[key] = structuredClone(inherited[key]);
    node.appearance.strokeWidth = inherited.strokeWidth;
    node.appearance.strokePattern = inherited.strokePattern;
    node.appearance.paintOverrides = { fill: false, stroke: false, text: false };
    node.appearance.styleOverrides = { strokeWidth: false, strokePattern: false };
    node.personCard = normalizeGeneographPersonCardOverrides(node.personCard);
    node.personCard.cornerRadius = null;
}

function geneoApplyBulkArrangement(nodes, command)
{
    const roots = geneoBulkArrangeRoots(nodes);
    if (roots.length < 2) return;
    const x = command === 'distributeX' || ['left', 'centerX', 'right'].includes(command);
    const ordered = [...roots].sort((a, b) => (x ? a.x - b.x : a.y - b.y));
    const first = ordered[0];
    const last = ordered.at(-1);
    const position = new Map();
    if (command.startsWith('distribute'))
    {
        const start = x ? first.x : first.y;
        const end = x ? last.x + last.width : last.y + last.height;
        const total = ordered.reduce((sum, node) => sum + (x ? node.width : node.height), 0);
        const gap = Math.max(20, (end - start - total) / (ordered.length - 1));
        let cursor = start;
        ordered.forEach((node, index) =>
        {
            if (index > 0) position.set(node.id, cursor);
            cursor += (x ? node.width : node.height) + gap;
        });
    }
    else
    {
        const left = Math.min(...roots.map(node => node.x));
        const right = Math.max(...roots.map(node => node.x + node.width));
        const top = Math.min(...roots.map(node => node.y));
        const bottom = Math.max(...roots.map(node => node.y + node.height));
        roots.forEach(node => position.set(node.id, ({
            left, centerX: (left + right - node.width) / 2, right: right - node.width,
            top, centerY: (top + bottom - node.height) / 2, bottom: bottom - node.height
        })[command]));
    }
    const moves = new Map();
    roots.forEach(root =>
    {
        const target = position.get(root.id);
        if (target === undefined) return;
        const dx = x ? target - root.x : 0;
        const dy = x ? 0 : target - root.y;
        if (!dx && !dy) return;
        geneoObjectGroupNodes([root.id]).forEach(node =>
        {
            if (!geneoNodeEffectiveLocked(node)) moves.set(node.id, { dx, dy });
        });
    });
    if (!moves.size) return;
    const diagram = selectedGeneographDiagram();
    geneoPushHistory();
    diagram.connections.forEach(connection =>
    {
        if (connection.route?.mode !== 'manual') return;
        const sourceNodes = geneoConnectionReferenceNodes(connection.source);
        const targetNodes = geneoConnectionReferenceNodes(connection.target);
        const endpoints = [...sourceNodes, ...targetNodes];
        if (!endpoints.length || !endpoints.every(node => moves.has(node.id))) return;
        const delta = moves.get(endpoints[0].id);
        if (!endpoints.every(node => moves.get(node.id).dx === delta.dx && moves.get(node.id).dy === delta.dy)) return;
        connection.route.waypoints.forEach(point => { point.x += delta.dx; point.y += delta.dy; });
    });
    moves.forEach(({ dx, dy }, id) =>
    {
        const node = getGeneographNode(id);
        node.x += dx;
        node.y += dy;
    });
    touchGeneographBoard();
    renderGeneographEditorPreserveScroll({ preserveInspectorScroll: true, preserveSidebarScroll: true });
}

function bindGeneographGenericBulkControls()
{
    const selected = () => selectedGeneographNodes();
    const commitAppearance = (property, field, value) =>
    {
        const nodes = selected();
        const diagram = selectedGeneographDiagram();
        if (!diagram || !nodes.length || nodes.some(node => !geneoBulkNodeSupports(node, property))) return;
        if (nodes.every(node => geneoBulkNodeValue(node, property, field) === value)) return;
        geneoPushHistory();
        nodes.forEach(node => geneoUpdateBulkNodeAppearance(node, property, field, value, diagram));
        touchGeneographBoard();
        renderGeneographEditorPreserveScroll({ preserveInspectorScroll: true, preserveSidebarScroll: true });
    };
    main.querySelectorAll('[data-geneo-bulk-paint-hex]').forEach(input => input.addEventListener('change', () =>
    {
        if (!/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.test(input.value.trim()))
        {
            input.setCustomValidity(t('Enter a valid hex color.'));
            input.reportValidity();
            return;
        }
        input.setCustomValidity('');
        commitAppearance(input.dataset.geneoBulkPaintHex, 'color', normalizeGeneoHexColor(input.value));
    }));
    main.querySelectorAll('[data-geneo-bulk-paint-opacity]').forEach(input => input.addEventListener('change', () =>
    {
        if (input.value.trim() === '' || !input.checkValidity()) { input.reportValidity(); return; }
        commitAppearance(input.dataset.geneoBulkPaintOpacity, 'opacity', Number(input.value));
    }));
    main.querySelectorAll('[data-geneo-bulk-paint-toggle]').forEach(button => button.addEventListener('click', () =>
    {
        const property = button.dataset.geneoBulkPaintToggle;
        commitAppearance(property, 'enabled', selected().every(node =>
            geneoBulkNodeValue(node, property, 'enabled') === false));
    }));
    main.querySelectorAll('[data-geneo-bulk-appearance]').forEach(input => input.addEventListener('change', () =>
    {
        const property = input.dataset.geneoBulkAppearance;
        if (property === 'strokePattern')
        {
            if (['solid', 'dashed'].includes(input.value)) commitAppearance(property, '', input.value);
            return;
        }
        if (input.value.trim() === '' || !input.checkValidity()) { input.reportValidity(); return; }
        commitAppearance(property, '', Number(input.value));
    }));
    main.querySelector('[data-geneo-bulk-shape-kind]')?.addEventListener('change', event =>
    {
        const nodes = selected();
        const kind = event.currentTarget.value;
        if (!nodes.length || !nodes.every(node => node.type === 'shape')
            || !GENEO_SHAPE_KINDS.some(shape => shape.id === kind)
            || nodes.every(node => node.shapeKind === kind)) return;
        geneoPushHistory();
        nodes.forEach(node => { node.shapeKind = kind; });
        touchGeneographBoard();
        renderGeneographEditorPreserveScroll({ preserveInspectorScroll: true, preserveSidebarScroll: true });
    });
    main.querySelector('[data-geneo-bulk-node-reset]')?.addEventListener('click', () =>
    {
        const nodes = selected();
        if (!nodes.length || !nodes.some(geneoBulkNodeAppearanceIsDefault)) return;
        geneoPushHistory();
        const diagram = selectedGeneographDiagram();
        nodes.forEach(node => geneoResetBulkNodeAppearance(node, diagram));
        touchGeneographBoard();
        renderGeneographEditorPreserveScroll({ preserveInspectorScroll: true, preserveSidebarScroll: true });
    });
    main.querySelectorAll('[data-geneo-bulk-arrange]').forEach(button => button.addEventListener('click', () =>
        geneoApplyBulkArrangement(selected(), button.dataset.geneoBulkArrange)));
    main.querySelectorAll('[data-geneo-bulk-action]').forEach(button => button.addEventListener('click', () =>
    {
        const action = button.dataset.geneoBulkAction;
        const nodes = selected();
        const connections = selectedGeneographConnections();
        const targets = action === 'lock' || action === 'unlock' ? geneoObjectGroupNodes()
            : [...geneoObjectGroupNodes(), ...connections];
        const property = action === 'show' || action === 'hide' ? 'visible' : 'locked';
        const value = action === 'show' || action === 'lock';
        if ((!nodes.length && !connections.length) || !targets.length
            || targets.every(item => item[property] === value)) return;
        geneoPushHistory();
        targets.forEach(item => { item[property] = value; });
        touchGeneographBoard();
        renderGeneographEditorPreserveScroll({ preserveInspectorScroll: true, preserveSidebarScroll: true });
    }));
}

const GENEO_CANVAS_CLICK_DRAG_THRESHOLD = 6;

const GENEO_CANVAS_INTERACTIVE_SELECTOR = [
    'button',
    'input',
    'textarea',
    'select',
    'a',
    '[contenteditable]',
    '.rich-text-toolbar',
    '.ql-tooltip',
    '[data-geneo-node]',
    '.geneo-connection-hit',
    '.geneo-segment-hit',
    '[data-geneo-waypoint]',
    '[data-geneo-family-junction]'
].join(',');

function geneographCanvasTargetIsInteractive(
    target
)
{
    const element =
        target instanceof Element
            ? target
            : target?.parentElement || null;

    return Boolean(
        element?.closest(
            GENEO_CANVAS_INTERACTIVE_SELECTOR
        )
    );
}

function bindGeneographIntentionalCanvasClick(
    wrap
)
{
    if (!wrap) return;

    const thresholdSquared =
        GENEO_CANVAS_CLICK_DRAG_THRESHOLD
        * GENEO_CANVAS_CLICK_DRAG_THRESHOLD;

    let gesture = null;
    let allowNextCanvasClick = false;

    const removeWindowListeners = () =>
    {
        window.removeEventListener(
            'pointermove',
            handlePointerMove,
            true
        );

        window.removeEventListener(
            'pointerup',
            handlePointerUp,
            true
        );

        window.removeEventListener(
            'pointercancel',
            handlePointerCancel,
            true
        );
    };

    const resetGesture = () =>
    {
        gesture = null;
        removeWindowListeners();
    };

    const handlePointerMove = event =>
    {
        if (
            !gesture ||
          event.pointerId !== gesture.pointerId
        )
        {
            return;
        }

        const deltaX =
            event.clientX - gesture.startX;

        const deltaY =
            event.clientY - gesture.startY;

        if (
            deltaX * deltaX + deltaY * deltaY >
          thresholdSquared
        )
        {
            gesture.moved = true;
        }
    };

    const finishPointerGesture = (
        event,
        cancelled = false
    ) =>
    {
        if (
            !gesture ||
          event.pointerId !== gesture.pointerId
        )
        {
            return;
        }

        const deltaX =
            event.clientX - gesture.startX;

        const deltaY =
            event.clientY - gesture.startY;

        const exceededThreshold =
            gesture.moved ||
          deltaX * deltaX + deltaY * deltaY >
            thresholdSquared;

        allowNextCanvasClick =
            !cancelled &&
          gesture.startedOnEmptyCanvas &&
          !geneographCanvasTargetIsInteractive(
              event.target
          ) &&
          !exceededThreshold;

        resetGesture();
    };

    function handlePointerUp(event)
    {
        finishPointerGesture(
            event,
            false
        );
    }

    function handlePointerCancel(event)
    {
        finishPointerGesture(
            event,
            true
        );
    }

    /*
       * Capture phase records the true pointer origin before
       * a node, Quill, or another board control can stop the
       * event from propagating.
       */
    wrap.addEventListener(
        'pointerdown',
        event =>
        {
            allowNextCanvasClick = false;
            resetGesture();

            if (
                event.button !== 0 ||
            event.isPrimary === false
            )
            {
                return;
            }

            gesture = {
                pointerId: event.pointerId,
                startX: event.clientX,
                startY: event.clientY,
                startedOnEmptyCanvas:
              !geneographCanvasTargetIsInteractive(
                  event.target
              ),
                moved: false
            };

            /*
           * Window listeners let the gesture finish safely
           * even when the pointer leaves the original node.
           * They do not prevent defaults or capture the pointer.
           */
            window.addEventListener(
                'pointermove',
                handlePointerMove,
                true
            );

            window.addEventListener(
                'pointerup',
                handlePointerUp,
                true
            );

            window.addEventListener(
                'pointercancel',
                handlePointerCancel,
                true
            );
        },
        true
    );

    wrap.addEventListener(
        'click',
        event =>
        {
            const intentionalCanvasClick =
                allowNextCanvasClick;

            /*
           * Consume the authorization once. A later synthetic
           * or unrelated click must not inherit it.
           */
            allowNextCanvasClick = false;

            if (
                !intentionalCanvasClick ||
            geneoCanvasRuntime.suppressNodeClick ||
            geneographCanvasTargetIsInteractive(
                event.target
            )
            )
            {
                return;
            }

            if (geneoImageCropRuntime)
            {
                if (event.detail === 2)
                {
                    event.preventDefault();
                    geneoFinishImageCrop(true, { restoreFocus: false });
                }
                return;
            }

            if (
                geneoEffectiveCanvasTool() === 'connect'
            )
            {
            /*
             * Preserve the existing connect-mode behavior:
             * the first empty-canvas click remains inert and
             * the second click in a double-click exits to Pan.
             */
                if (event.detail !== 2)
                {
                    return;
                }

                event.preventDefault();

                exitGeneographConnectionTool();
                return;
            }

            const hadSelection =
                Boolean(
                    state.selectedGeneoNodeId
              || state.selectedGeneoConnectionId
              || state.selectedGeneoNodeIds
                  .length
              || state
                  .selectedGeneoConnectionIds
                  .length
              || Number.isInteger(
                  state.selectedGeneoWaypointIndex
              )
                );

            const hadConnectionDraft =
                Boolean(
                    state.geneoConnectionDraft
                );

            selectGeneographCanvas();
            cancelGeneographConnectionDraft();

            /*
           * Clicking an already selected Canvas is a no-op.
           * Avoid recreating the inspector and losing its
           * current scroll position.
           */
            if (
                !hadSelection
            && !hadConnectionDraft
            )
            {
                return;
            }

            renderGeneographEditorPreserveScroll({
                preserveInspectorScroll: true,
                preserveSidebarScroll: true
            });
        }
    );
}

function refreshGeneoConnectionToolUi()
{
    const style = geneoConnectionToolStyle();
    const panel = main.querySelector('[data-geneo-connection-panel]');
    const pattern = panel?.querySelector('[data-geneo-connection-tool-pattern]');
    const arrows = panel?.querySelector('[data-geneo-connection-tool-arrows]');
    const swatch = panel?.querySelector('[data-geneo-connection-tool-swatch]');
    const width = panel?.querySelector('[data-geneo-connection-tool-width]');
    if (pattern)
    {
        pattern.querySelector('.geneo-line-sample')?.replaceWith(...new DOMParser().parseFromString(renderGeneoConnectionLineSample(style.pattern), 'text/html').body.children);
        pattern.title = t(GENEO_CONNECTION_PATTERN_LABELS[style.pattern]);
        pattern.setAttribute('aria-label', `${t('Pattern')}: ${pattern.title}`);
    }
    if (arrows)
    {
        arrows.querySelector('.geneo-line-sample')?.replaceWith(...new DOMParser().parseFromString(renderGeneoConnectionArrowSample(style.arrows), 'text/html').body.children);
        arrows.title = `${t('Arrowheads')}: ${t(capitalize(style.arrows))}`;
        arrows.setAttribute('aria-label', arrows.title);
    }
    if (swatch)
    {
        swatch.setAttribute('style', geneoPaintSwatchStyle(style.line));
        swatch.setAttribute('aria-label', `${t('Connection color')}: ${style.line.color}`);
    }
    if (width) width.value = style.width;
    const mainButton = main.querySelector('[data-geneo-connection-main]');
    if (mainButton)
    {
        const title = `${t('Connect')}: ${t(GENEO_CONNECTION_PATTERN_LABELS[style.pattern])}`;
        mainButton.title = title;
        mainButton.setAttribute('aria-label', title);
    }
    const preview = main.querySelector('[data-geneo-connection-preview]');
    if (preview)
    {
        preview.style.stroke = geneoPaintCssColor(style.line);
        preview.style.strokeWidth = String(style.width);
        preview.style.strokeDasharray = geneoConnectionDashArray(style.pattern, style.width) || 'none';
        for (const end of ['start', 'end'])
        {
            const active = style.arrows === end || style.arrows === 'both';
            if (active) preview.setAttribute(`marker-${end}`, 'url(#geneo-preview-arrow)');
            else preview.removeAttribute(`marker-${end}`);
        }
        main.querySelector('#geneo-preview-arrow path')?.setAttribute('fill', geneoPaintCssColor(style.line));
    }
}

function refreshGeneoCreationToolUi(tool)
{
    const settings = geneoCreationToolSettings(tool);
    const appearance = settings.appearance;
    const panel = main.querySelector(`[data-geneo-creation-panel="${tool}"]`);
    panel?.querySelectorAll('[data-geneo-creation-swatch]').forEach(swatch =>
    {
        const property = swatch.dataset.geneoCreationSwatch;
        const paint = appearance[property];
        swatch.setAttribute('style', geneoPaintSwatchStyle(paint));
        swatch.classList.toggle('is-none', !paint.enabled);
        swatch.setAttribute('aria-label', `${t(capitalize(property))}: ${paint.enabled ? paint.color : t('None')}`);
    });
    const width = panel?.querySelector('[data-geneo-creation-width]');
    if (width) width.value = appearance.strokeWidth;
    const pattern = panel?.querySelector('[data-geneo-creation-pattern]');
    if (pattern)
    {
        pattern.querySelector('.geneo-line-sample')?.replaceWith(...new DOMParser().parseFromString(renderGeneoConnectionLineSample(appearance.strokePattern), 'text/html').body.children);
        pattern.setAttribute('aria-label', `${t('Pattern')}: ${t(GENEO_CONNECTION_PATTERN_LABELS[appearance.strokePattern])}`);
    }
    const preview = main.querySelector('[data-geneo-pencil-preview]');
    if (tool === 'drawing' && preview)
    {
        preview.style.stroke = geneoPaintCssColor(appearance.stroke);
        preview.style.strokeWidth = String(appearance.strokeWidth);
        preview.style.strokeDasharray = appearance.strokePattern === 'dashed' ? '8 7' : 'none';
    }
}

function openGeneoCreationPatternMenu(anchor, tool)
{
    if (!(anchor instanceof HTMLElement) || closeGeneoOpenMenuOnTrigger(anchor)) return;
    closeMenu();
    const pattern = geneoCreationToolSettings(tool).appearance.strokePattern;
    const menu = document.createElement('div');
    menu.id = 'projectMenu';
    menu.className = 'menu-popover tool-options-menu';
    menu.setAttribute('role', 'menu');
    menu.setAttribute('aria-label', t('Stroke pattern'));
    menu.innerHTML = ['solid', 'dashed'].map(value => `<button type="button" role="menuitemradio" aria-label="${escapeHtml(t(GENEO_CONNECTION_PATTERN_LABELS[value]))}" aria-checked="${pattern === value}" data-geneo-creation-pattern-option="${value}">${renderGeneoConnectionLineSample(value)}</button>`).join('');
    document.body.appendChild(menu);
    const rect = anchor.getBoundingClientRect();
    menu.style.left = `${Math.max(12, Math.min(rect.left, window.innerWidth - menu.offsetWidth - 12))}px`;
    menu.style.top = `${rect.bottom + menu.offsetHeight + 7 <= window.innerHeight - 12 ? rect.bottom + 7 : Math.max(12, rect.top - menu.offsetHeight - 7)}px`;
    if (window.innerWidth <= 900) mountMobileChoiceSheet(menu, anchor, t('Stroke pattern'));
    menu.addEventListener('click', event =>
    {
        const option = event.target.closest('[data-geneo-creation-pattern-option]');
        if (!option) return;
        geneoCreationToolSettings(tool).appearance.strokePattern = option.dataset.geneoCreationPatternOption;
        closeMenu();
        refreshGeneoCreationToolUi(tool);
    });
    menu.addEventListener('keydown', event =>
    {
        const items = [...menu.querySelectorAll('[role="menuitemradio"]')];
        const index = items.indexOf(document.activeElement);
        if (event.key === 'Escape')
        {
            event.preventDefault(); event.stopPropagation(); closeMenu(); anchor.focus({ preventScroll: true });
        }
        else if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key))
        {
            event.preventDefault();
            items[event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1
                : (index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]?.focus({ preventScroll: true });
        }
    });
    bindMenuLifecycle(anchor, { ignoreScrollWithin: anchor.closest('[data-geneo-creation-panel]') });
    menu.querySelector('[aria-checked="true"]')?.focus({ preventScroll: true });
}

function bindGeneoConnectionControls()
{
    const toolPanel = main.querySelector('[data-geneo-connection-panel]');
    const connectButton = main.querySelector('[data-geneo-connection-main]');
    const editor = main.querySelector('.geneo-editor');
    if (toolPanel && connectButton && editor && window.innerWidth > 900)
    {
        const left = connectButton.getBoundingClientRect().left - editor.getBoundingClientRect().left;
        toolPanel.style.left = `${Math.max(12, Math.min(left, editor.clientWidth - toolPanel.offsetWidth - 12))}px`;
    }
    main.querySelectorAll('[data-geneo-connection-fields]').forEach(group =>
    {
        const scope = group.dataset.geneoConnectionFields;
        if (scope !== 'default') return;
        const prefix = `[data-geneo-connection-${scope}-`;
        const commit = (key, value) =>
        {
            const diagram = selectedGeneographDiagram();
            if (!diagram) return;
            if (scope === 'default')
            {
                const current = key === 'line' ? diagram.connectionDefaults.line.color : diagram.connectionDefaults[key];
                const next = key === 'line' ? value.color : value;
                if (current === next) return;
                geneoPushHistory();
                if (key === 'line') diagram.connectionDefaults.line = value;
                else diagram.connectionDefaults[key] = value;
                touchGeneographBoard();
            }
            else
            {
                geneoConnectionToolStyle();
                const defaultValue = key === 'line' ? diagram.connectionDefaults.line.color : diagram.connectionDefaults[key];
                const next = key === 'line' ? value.color : value;
                if (next === defaultValue) delete geneoConnectionToolRuntime.overrides[key];
                else geneoConnectionToolRuntime.overrides[key] = value;
            }
            if (scope === 'default') requestAnimationFrame(() => renderGeneographEditorPreserveScroll({ preserveInspectorScroll: true }));
            else refreshGeneoConnectionToolUi();
        };
        group.querySelector(`${prefix}width]`)?.addEventListener('change', event => commit('width', Math.round(geneoNumber(event.target.value, 2, 1, 12))));
        group.querySelector(`${prefix}radius]`)?.addEventListener('change', event => commit('cornerRadius', Math.round(geneoNumber(event.target.value, 0, 0, 32))));
        group.querySelector(`${prefix}dates]`)?.addEventListener('change', event => commit('showRelationshipDates', event.target.checked));
        group.querySelector(`${prefix}pattern]`)?.addEventListener('click', event => openGeneoConnectionStyleMenu(event.currentTarget, 'pattern', 'default'));
        group.querySelectorAll(`${prefix}arrows]`).forEach(input => input.addEventListener('change', () => { if (input.checked) commit('arrows', input.value); }));
    });
    main.querySelector('[data-geneo-connection-tool-pattern]')?.addEventListener('click', event => openGeneoConnectionStyleMenu(event.currentTarget));
    main.querySelector('[data-geneo-connection-inspector-pattern]')?.addEventListener('click', event => openGeneoConnectionStyleMenu(event.currentTarget, 'pattern', 'connection'));
    main.querySelector('[data-geneo-connection-multi-pattern]')?.addEventListener('click', event => openGeneoConnectionStyleMenu(event.currentTarget, 'pattern', 'multi'));
    main.querySelector('[data-geneo-connection-multi-width]')?.addEventListener('change', event =>
    {
        const input = event.currentTarget;
        if (input.value.trim() === '' || !input.checkValidity()) { input.reportValidity(); return; }
        geneoCommitMultiConnectionAppearance('width', Number(input.value));
    });
    main.querySelector('[data-geneo-connection-multi-radius]')?.addEventListener('change', event =>
    {
        const input = event.currentTarget;
        if (input.value.trim() === '' || !input.checkValidity()) { input.reportValidity(); return; }
        geneoCommitMultiConnectionAppearance('cornerRadius', Number(input.value));
    });
    main.querySelector('[data-geneo-connection-multi-hex]')?.addEventListener('change', event =>
    {
        const input = event.currentTarget;
        if (!/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.test(input.value.trim()))
        {
            input.setCustomValidity(t('Enter a valid hex color.'));
            input.reportValidity();
            return;
        }
        input.setCustomValidity('');
        geneoCommitMultiConnectionPaint('color', normalizeGeneoHexColor(input.value));
    });
    main.querySelector('[data-geneo-connection-multi-opacity]')?.addEventListener('change', event =>
    {
        const input = event.currentTarget;
        if (input.value.trim() === '' || !input.checkValidity()) { input.reportValidity(); return; }
        geneoCommitMultiConnectionPaint('opacity', Number(input.value));
    });
    main.querySelector('[data-geneo-connection-multi-paint-toggle]')?.addEventListener('click', () =>
    {
        const connections = selectedGeneographConnections();
        geneoCommitMultiConnectionPaint('enabled', connections.every(connection =>
            geneoEffectiveConnectionStyle(connection).line.enabled === false));
    });
    main.querySelectorAll('[data-geneo-connection-multi-arrows]').forEach(input => input.addEventListener('change', () =>
    {
        if (input.checked) geneoCommitMultiConnectionAppearance('arrows', input.value);
    }));
    const dateToggle = main.querySelector('[data-geneo-connection-multi-dates]');
    if (dateToggle)
    {
        dateToggle.indeterminate = dateToggle.dataset.mixed === 'true';
        dateToggle.addEventListener('change', () => geneoCommitMultiConnectionAppearance('showRelationshipDates', dateToggle.checked));
    }
    main.querySelector('[data-geneo-make-visual]')?.addEventListener('click', () => openGeneoMakeVisualConfirmation(selectedGeneographConnection()));
    main.querySelector('[data-geneo-connection-purpose]')?.addEventListener('click', event => openGeneoConnectionPurposeMenu(event.currentTarget));
    main.querySelector('[data-geneo-connection-tool-arrows]')?.addEventListener('click', event => openGeneoConnectionStyleMenu(event.currentTarget, 'arrows'));
    main.querySelector('[data-geneo-connection-tool-swatch]')?.addEventListener('click', event => openGeneoPaintPopover({ scope: 'connection-tool', property: 'line' }, event.currentTarget));
    main.querySelector('[data-geneo-connection-tool-width]')?.addEventListener('change', event =>
    {
        const width = Math.round(geneoNumber(event.target.value, 2, 1, 12));
        const defaults = selectedGeneographDiagram().connectionDefaults;
        if (width === defaults.width) delete geneoConnectionToolRuntime.overrides.width;
        else geneoConnectionToolRuntime.overrides.width = width;
        refreshGeneoConnectionToolUi();
    });
    main.querySelector('[data-geneo-connection-panel-close]')?.addEventListener('click', () =>
    {
        geneoConnectionToolRuntime.panelOpen = false;
        renderGeneographEditorPreserveScroll();
        main.querySelector('[data-geneo-connection-main]')?.focus({ preventScroll: true });
    });
    main.querySelector('[data-geneo-connection-tool-reset]')?.addEventListener('click', () =>
    {
        if (geneoPaintRuntime.popover) closeGeneoPaintPopover({ restoreFocus: false });
        geneoConnectionToolRuntime.overrides = {};
        refreshGeneoConnectionToolUi();
    });
    main.querySelectorAll('[data-geneo-connection-arrows]').forEach(input => input.addEventListener('change', () =>
    {
        const connection = selectedGeneographConnection();
        if (!connection || connection.kind !== 'visual' || !input.checked) return;
        if (geneoEffectiveConnectionStyle(connection).arrows === input.value) return;
        geneoPushHistory();
        if (input.value === selectedGeneographDiagram().connectionDefaults.arrows) delete connection.style.arrows;
        else connection.style.arrows = input.value;
        touchGeneographBoard();
        renderGeneographEditorPreserveScroll({ preserveInspectorScroll: true });
    }));
    main.querySelector('[data-geneo-connection-radius]')?.addEventListener('change', event =>
    {
        const connection = selectedGeneographConnection();
        if (!connection) return;
        const radius = Math.round(geneoNumber(event.target.value,
            geneoEffectiveConnectionStyle(connection).cornerRadius, 0, 32));
        if (radius === geneoEffectiveConnectionStyle(connection).cornerRadius) return;
        geneoPushHistory();
        if (radius === selectedGeneographDiagram().connectionDefaults.cornerRadius)
            delete connection.style.cornerRadius;
        else connection.style.cornerRadius = radius;
        touchGeneographBoard();
        renderGeneographEditorPreserveScroll({ preserveInspectorScroll: true });
    });
    main.querySelector('[data-geneo-connection-reset-default]')?.addEventListener('click', () =>
    {
        const connection = selectedGeneographConnection();
        if (!connection || (!Object.keys(connection.style || {}).length && connection.showRelationshipDates === undefined)) return;
        geneoPushHistory();
        connection.style = {};
        delete connection.showRelationshipDates;
        touchGeneographBoard();
        renderGeneographEditorPreserveScroll({ preserveInspectorScroll: true });
    });
    main.querySelector('[data-geneo-connection-multi-reset-default]')?.addEventListener('click', () =>
    {
        const connections = selectedGeneographConnections();
        if (!connections.length
            || !connections.some(connection => Object.keys(connection.style || {}).length || connection.showRelationshipDates !== undefined)) return;
        geneoPushHistory();
        connections.forEach(connection => { connection.style = {}; delete connection.showRelationshipDates; });
        touchGeneographBoard();
        renderGeneographEditorPreserveScroll({ preserveInspectorScroll: true });
    });
}

function bindGeneoCreationToolControls()
{
    const editor = main.querySelector('.geneo-editor');
    main.querySelectorAll('[data-geneo-creation-panel]').forEach(panel =>
    {
        const tool = panel.dataset.geneoCreationPanel;
        const anchor = main.querySelector(tool === 'drawing' ? '[data-geneo-tool="pencil"]' : '[data-geneo-shape-main]');
        if (editor && anchor && window.innerWidth > 900)
        {
            const left = anchor.getBoundingClientRect().left - editor.getBoundingClientRect().left;
            panel.style.left = `${Math.max(12, Math.min(left, editor.clientWidth - panel.offsetWidth - 12))}px`;
        }
        panel.querySelectorAll('[data-geneo-creation-swatch]').forEach(swatch => swatch.addEventListener('click', () =>
            openGeneoPaintPopover({ scope: 'creation-tool', id: tool, property: swatch.dataset.geneoCreationSwatch }, swatch)));
        panel.querySelector('[data-geneo-creation-width]')?.addEventListener('change', event =>
        {
            const appearance = geneoCreationToolSettings(tool).appearance;
            appearance.strokeWidth = Math.round(geneoNumber(event.target.value, appearance.strokeWidth, 1, 12));
            refreshGeneoCreationToolUi(tool);
        });
        panel.querySelector('[data-geneo-creation-pattern]')?.addEventListener('click', event =>
            openGeneoCreationPatternMenu(event.currentTarget, tool));
        panel.querySelector('[data-geneo-creation-shape-kind]')?.addEventListener('click', event =>
            openGeneoShapeMenu(event.currentTarget));
        panel.querySelector('[data-geneo-creation-reset]')?.addEventListener('click', () =>
        {
            if (geneoPaintRuntime.popover) closeGeneoPaintPopover({ restoreFocus: false });
            const settings = geneoCreationToolSettings(tool);
            settings.appearance = structuredClone(geneoNodeDefaults(tool).appearance);
            if (tool === 'shape') settings.shapeKind = 'rectangle';
            renderGeneographEditorPreserveScroll();
        });
        panel.querySelector('[data-geneo-creation-close]')?.addEventListener('click', () =>
        {
            geneoCreationToolSettings(tool).panelOpen = false;
            renderGeneographEditorPreserveScroll();
        });
    });
    refreshGeneoCreationToolUi('drawing');
}

function bindGeneographEditor()
{
    bindGeneographInspectorSectionToggles();

    bindGeneographToolbarDensity();
    bindGeneographToolbarKeyboard();

    const wrap = main.querySelector(
        '[data-geneo-canvas-wrap]'
    );
    if (!main.dataset.geneoConnectionClickBoundaryBound)
    {
        main.dataset.geneoConnectionClickBoundaryBound = 'true';
        main.addEventListener('pointerdown', event =>
        {
            if (!event.target.closest('.geneo-connection-hit, .geneo-segment-hit')) clearGeneographConnectionClick();
        }, true);
    }
    main.querySelector('[data-geneo-undo]')?.addEventListener('click', undoGeneographChange); main.querySelector('[data-geneo-redo]')?.addEventListener('click', redoGeneographChange);
    main
        .querySelectorAll('[data-geneo-add]')
        .forEach(button =>
        {
            button.addEventListener('click', () =>
            {
                addGeneographObject(
                    button.dataset.geneoAdd
                );
            });
        });
    main
        .querySelectorAll(
            '[data-geneo-edit-rich-text]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () =>
                {
                    beginGeneographInlineEdit(
                        button.dataset
                            .geneoEditRichText,
                        {
                            surface:
                    'inspector'
                        }
                    );
                }
            );
            button.addEventListener('keydown', event =>
            {
                if (event.key !== 'Enter' && event.key !== ' ') return;
                event.preventDefault();
                button.click();
            });
        });

    main
        .querySelector(
            '[data-geneo-rich-text-done]'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                commitGeneoInlineEdit(
                    false
                );
            }
        );

    main
        .querySelector(
            '[data-geneo-rich-text-cancel]'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                commitGeneoInlineEdit(
                    true
                );
            }
        );
    main
        .querySelectorAll('[data-geneo-placement-tool]')
        .forEach(button =>
        {
            button.addEventListener('click', () =>
            {
                activateGeneographPlacementTool(
                    button.dataset.geneoPlacementTool
                );
            });
        });
    main.querySelector('[data-geneo-person-main]')?.addEventListener('click', () =>
        addGeneographObject('person'));
    const personMenuButton = main.querySelector('[data-geneo-person-menu]');
    personMenuButton?.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        openGeneoPersonGenderMenu(personMenuButton);
    });
    main
        .querySelectorAll(
            '[data-geneo-tool]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                () =>
                {
                    setGeneoCtrlSelectPressed(false);
                    cancelGeneographPencilStroke();
                    cancelGeneographConnectionDraft();

                    state.geneoPlacementReturnTool =
                        null;

                    state.geneoTool =
                        button.dataset.geneoTool;

                    if (state.geneoTool === 'pencil') geneoCreationToolSettings('drawing').panelOpen = true;

                    hideGeneographPanelDraftDom();

                    renderGeneographEditorPreserveScroll();
                }
            );
        });
    main
        .querySelector(
            '[data-geneo-connection-main]'
        )
        ?.addEventListener('click', event =>
        {
            activateGeneographConnectionTool();
        });
    const connectionMenuButton = main.querySelector('[data-geneo-connection-menu]');
    connectionMenuButton?.addEventListener('click', event =>
    {
        event.preventDefault();
        event.stopPropagation();
        openGeneoConnectionStyleMenu(connectionMenuButton);
    });
    /*
      * Notes & text main action.
      * Repeats the last content type selected
      * from the Notes & text menu.
      */
    main
        .querySelector(
            '[data-geneo-content-main]'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                const kind =
                    normalizeGeneographContentKind(
                        state.geneoContentKind
                    );

                activateGeneographPlacementTool(
                    kind
                );
            }
        );

    main.querySelectorAll('[data-geneo-mobile-content]').forEach(button =>
        button.addEventListener('click', () =>
        {
            const kind = normalizeGeneographContentKind(button.dataset.geneoMobileContent);
            state.geneoContentKind = kind;
            activateGeneographPlacementTool(kind);
        }));

    /*
      * Notes & text dropdown.
      */
    const contentMenuButton =
        main.querySelector(
            '[data-geneo-content-menu]'
        );

    contentMenuButton
        ?.addEventListener(
            'click',
            event =>
            {
                event.preventDefault();
                event.stopPropagation();

                openGeneoContentMenu(
                    contentMenuButton
                );
            }
        );

    /*
      * Shapes main action.
      * Activates the currently selected shape.
      */
    main
        .querySelector(
            '[data-geneo-shape-main]'
        )
        ?.addEventListener(
            'click',
            event =>
            {
                if (window.innerWidth <= 900) openGeneoShapeMenu(event.currentTarget);
                else activateGeneographPlacementTool('shape');
            }
        );

    /*
      * Shapes dropdown.
      */
    const shapeMenuButton =
        main.querySelector(
            '[data-geneo-shape-menu]'
        );

    shapeMenuButton
        ?.addEventListener(
            'click',
            event =>
            {
                event.preventDefault();
                event.stopPropagation();

                openGeneoShapeMenu(
                    shapeMenuButton
                );
            }
        );

    /*
      * Responsive toolbar overflow menu.
      */
    const toolbarOverflowButton =
        main.querySelector(
            '[data-geneo-toolbar-overflow]'
        );

    toolbarOverflowButton
        ?.addEventListener(
            'click',
            event =>
            {
                event.preventDefault();
                event.stopPropagation();

                openGeneoToolbarOverflowMenu(
                    toolbarOverflowButton
                );
            }
        );
    main.querySelectorAll('[data-geneo-edit-person-node]').forEach(button =>
    {
        button.addEventListener('click', event =>
        {
            event.preventDefault();
            event.stopPropagation();
            const node = getGeneographNode(button.dataset.geneoEditPersonNode);
            if (node?.type === 'person' && getGeneographPerson(node.personId))
            {
                openGeneographPersonModal(node.personId);
            }
        });
    });
    main.querySelectorAll('[data-geneo-avatar-person]').forEach(button =>
    {
        button.addEventListener('pointerdown', event => event.stopPropagation());
        button.addEventListener('click', event =>
        {
            event.preventDefault();
            event.stopPropagation();
            openGeneographAvatarPicker(button.dataset.geneoAvatarPerson, {
                nodeId: button.dataset.geneoAvatarNode,
                location: button.dataset.geneoAvatarLocation
            });
        });
    });
    main
        .querySelectorAll(
            '[data-geneo-add-relative]'
        )
        .forEach(button =>
        {
            button.addEventListener(
                'click',
                event =>
                {
                    event.preventDefault();
                    event.stopPropagation();

                    openGeneographRelativePopover(
                        button,
                        button.dataset
                            .geneoAddRelative
                    );
                }
            );
        });
    main.querySelectorAll('[data-geneo-port-node]').forEach(button => button.addEventListener('click', event =>
    {
        event.stopPropagation();
        if (geneoCtrlSelectPressed) return;
        const reference = { nodeId: button.dataset.geneoPortNode, port: button.dataset.geneoPort };
        activateGeneographConnectionPoint(reference);
    }));
    main.querySelectorAll('[data-geneo-family-junction]').forEach(junction => junction.addEventListener('click', event =>
    {
        event.stopPropagation();
        if (geneoCtrlSelectPressed) return;
        const reference = { familyId: junction.dataset.geneoFamilyJunction, port: 'bottom' };
        activateGeneographConnectionPoint(reference);
    }));
    const connectionTargetSelector = '[data-geneo-port-node], [data-geneo-family-junction]';
    wrap.addEventListener('pointerover', event =>
    {
        if (geneoCtrlSelectPressed) return;
        const target = event.target.closest?.(connectionTargetSelector);
        if (target) setGeneographConnectionHoverTarget(target);
    });
    wrap.addEventListener('pointerout', event =>
    {
        const target = event.target.closest?.(connectionTargetSelector);
        if (target && !target.contains(event.relatedTarget) && document.activeElement !== target)
            setGeneographConnectionHoverTarget(null);
    });
    wrap.addEventListener('focusin', event =>
    {
        if (geneoCtrlSelectPressed) return;
        const target = event.target.closest?.(connectionTargetSelector);
        if (target) setGeneographConnectionHoverTarget(target);
    });
    wrap.addEventListener('focusout', event =>
    {
        const target = event.target.closest?.(connectionTargetSelector);
        if (target && !target.matches(':hover')) setGeneographConnectionHoverTarget(null);
    });
    wrap.addEventListener('scroll', updateGeneographConnectionTip, { passive: true });
    wrap.addEventListener('contextmenu', event =>
    {
        if (geneographCanvasTargetIsInteractive(event.target)) return;
        if (state.geneoTool !== 'connect' && state.geneoTool !== 'pencil') return;
        event.preventDefault();
        event.stopPropagation();
        if (state.geneoTool === 'connect')
        {
            exitGeneographConnectionTool();
            return;
        }
        if (geneoPointerState?.kind === 'pencil')
        {
            geneoDrawPanPending = true;
            return;
        }
        updateGeneographPencilPreview();
        geneoCreationToolSettings('drawing').panelOpen = false;
        state.geneoTool = 'pan';
        setGeneoCtrlSelectPressed(false);
        renderGeneographEditorPreserveScroll();
    });
    main
        .querySelectorAll(
            '[data-geneo-node]'
        )
        .forEach(element =>
        {
            const interactiveSelector =
                [
                    'button',
                    'input',
                    'textarea',
                    'select',
                    'a',
                    '[contenteditable="true"]',
                    '.rich-text-toolbar',
                    '.ql-tooltip'
                ].join(',');

            element.addEventListener('contextmenu', event =>
            {
                if (event.target.closest('input,textarea,select,[contenteditable="true"],.ql-editor')) return;
                event.preventDefault();
                event.stopPropagation();
                openGeneographObjectContextMenu(element.dataset.geneoNode, event.clientX, event.clientY);
            });

            element.addEventListener('keydown', event =>
            {
                if (event.key === 'Enter' && event.target === element
                    && getGeneographNode(element.dataset.geneoNode)?.type === 'image')
                {
                    event.preventDefault();
                    geneoBeginImageCrop(getGeneographNode(element.dataset.geneoNode));
                    return;
                }
                if ((event.shiftKey && event.key === 'F10') || event.key === 'ContextMenu')
                {
                    event.preventDefault();
                    event.stopPropagation();
                    const rect = element.getBoundingClientRect();
                    openGeneographObjectContextMenu(element.dataset.geneoNode, rect.left + 12, rect.top + 12);
                }
            });

            element.addEventListener(
                'pointerdown',
                event =>
                {
                    if (geneoImageCropRuntime?.nodeId === element.dataset.geneoNode)
                    {
                        const handle = event.target.closest('[data-geneo-image-crop-handle]');
                        const photoBounds = event.target.closest('.geneo-image-crop-bounds');
                        if (event.button === 0 && handle)
                        {
                            const node = getGeneographNode(element.dataset.geneoNode);
                            const source = resolveGeneographImageSource(node);
                            const metrics = geneoImageCropMetrics(node, source, geneoImageCropRuntime.draft);
                            geneoImageCropRuntime.drag = {
                                kind: 'scale', pointerId: event.pointerId,
                                handle: handle.dataset.geneoImageCropHandle,
                                clientX: event.clientX, clientY: event.clientY,
                                x: metrics.x, y: metrics.y, zoom: metrics.zoom,
                                baseWidth: metrics.width, baseHeight: metrics.height,
                                boardZoom: Math.max(.25, state.geneoZoom / 100)
                            };
                            handle.setPointerCapture(event.pointerId);
                            event.preventDefault();
                        }
                        else if (event.button === 0 && (photoBounds || event.target.closest('.geneo-image-node-media')))
                        {
                            geneoImageCropRuntime.drag = {
                                kind: 'move',
                                pointerId: event.pointerId, clientX: event.clientX, clientY: event.clientY,
                                x: geneoImageCropRuntime.draft.x, y: geneoImageCropRuntime.draft.y,
                                width: element.getBoundingClientRect().width,
                                height: element.getBoundingClientRect().height
                            };
                            (photoBounds || event.target).setPointerCapture(event.pointerId);
                            event.preventDefault();
                        }
                        event.stopPropagation();
                        return;
                    }
                    if (
                        !startGeneographResize(
                            event
                        )
                    )
                    {
                        startGeneographObjectDrag(
                            event
                        );
                    }
                }
            );

            element.addEventListener(
                'click',
                event =>
                {
                    if (
                        geneoCanvasRuntime
                            .suppressNodeClick
                || event.target.closest(
                    interactiveSelector
                )
                    )
                    {
                        return;
                    }

                    const clickedNode = getGeneographNode(element.dataset.geneoNode);
                    if (clickedNode?.type === 'image')
                    {
                        if (geneoImageCropRuntime?.nodeId === clickedNode.id) return;
                        const now = performance.now();
                        if (geneoImageLastClick?.id === clickedNode.id && now - geneoImageLastClick.time < 450)
                        {
                            geneoImageLastClick = null;
                            event.preventDefault();
                            geneoBeginImageCrop(clickedNode);
                            return;
                        }
                        geneoImageLastClick = { id: clickedNode.id, time: now };
                    }
                    if (clickedNode?.type === 'panel' && geneoEffectiveCanvasTool() === 'select'
                        && !geneoPanelDirectTarget(event, element)) return;

                    selectGeneographNode(
                        element.dataset
                            .geneoNode,
                        {
                            toggle:
                    event.shiftKey
                    || event.ctrlKey
                    || event.metaKey
                        }
                    );

                    renderGeneographEditorPreserveScroll();
                }
            );

            element.addEventListener(
                'dblclick',
                event =>
                {
                    if (
                        event.target.closest(
                            interactiveSelector
                        )
                    )
                    {
                        return;
                    }

                    const node =
                        getGeneographNode(
                            element.dataset
                                .geneoNode
                        );

                    if (node?.type === 'image')
                    {
                        event.preventDefault();
                        geneoBeginImageCrop(node);
                        return;
                    }

                    if (
                        node
                && [
                    'sticky',
                    'text',
                    'panel'
                ].includes(
                    node.type
                )
                    )
                    {
                        event.preventDefault();

                        beginGeneographInlineEdit(
                            node.id,
                            { selectAll: node.type === 'panel' }
                        );
                    }
                }
            );
        });
    main.querySelectorAll('[data-geneo-image-crop-handle]').forEach(handle =>
    {
        handle.addEventListener('keydown', event =>
        {
            if (!['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft'].includes(event.key)) return;
            event.preventDefault();
            event.stopPropagation();
            const direction = ['ArrowUp', 'ArrowRight'].includes(event.key) ? 1 : -1;
            geneoScaleImageCropFromHandle(handle.dataset.geneoImageCropHandle,
                geneoImageCropRuntime.draft.zoom + direction * (event.shiftKey ? .2 : .05));
        });
    });
    main.querySelector('[data-geneo-image-crop-reset]')?.addEventListener('click', () =>
    {
        geneoImageCropRuntime.draft = { ...geneoImageCropRuntime.initial };
        geneoRefreshImageCropDom();
    });
    main.querySelector('[data-geneo-image-crop-fit]')?.addEventListener('click', () =>
    {
        geneoImageCropRuntime.draft = { zoom: 1, x: 0, y: 0 };
        geneoRefreshImageCropDom();
    });
    main.querySelector('[data-geneo-image-crop-cancel]')?.addEventListener('click', () => geneoFinishImageCrop(false));
    main.querySelector('[data-geneo-image-crop-apply]')?.addEventListener('click', () => geneoFinishImageCrop(true));
    main.querySelectorAll('.geneo-connection-hit').forEach(path => path.addEventListener('pointerdown', startGeneographConnectionDrag));
    main.querySelectorAll('.geneo-connection-hit, .geneo-segment-hit').forEach(path => path.addEventListener('click', handleGeneographConnectionClick));
    main.querySelectorAll('[data-geneo-family-bus]').forEach(path =>
    {
        path.addEventListener('pointerdown', path.hasAttribute('data-geneo-family-bus-rail')
            ? startGeneographFamilyBusRailDrag
            : event => event.stopPropagation());
        path.addEventListener('click', handleGeneographFamilyBusSelection);
        path.addEventListener('keydown', handleGeneographFamilyBusSelection);
    });
    main.querySelectorAll('[data-geneo-waypoint]').forEach(point =>
    {
        point.addEventListener('click', event =>
        {
            event.stopPropagation(); selectGeneographConnection(point.dataset.geneoConnection, Number(point.dataset.geneoWaypoint)); renderGeneographEditorPreserveScroll();
        }); point.addEventListener('pointerdown', event =>
        {
            event.preventDefault(); event.stopPropagation(); clearGeneographConnectionClick(); selectGeneographConnection(point.dataset.geneoConnection, Number(point.dataset.geneoWaypoint)); geneoPushHistory(); geneoPointerState = { kind: 'waypoint', connectionId: point.dataset.geneoConnection, index: Number(point.dataset.geneoWaypoint), moved: false };
        });
    });
    main.querySelectorAll('[data-geneo-segment]').forEach(segment => segment.addEventListener('pointerdown', event =>
    {
        event.preventDefault(); event.stopPropagation();
        const connection = getGeneographConnection(segment.dataset.geneoConnection); if (!connection) return; const index = Number(segment.dataset.geneoSegment); const points = geneoConnectionPoints(connection);
        if (geneoSelectedConnectionIdSet().has(connection.id)
            && selectedGeneographNodes().length + selectedGeneographConnections().length > 1
            && startGeneographSelectedConnectionDrag(event, connection)) return;
        if (index < 1 || index >= points.length - 2) return;
        geneoPushHistory();
        if (connection.route.mode !== 'manual') connection.route = { mode: 'manual', waypoints: points.slice(1, -1).map(snapGeneographPoint) };
        const firstWaypoint = index - 1, secondWaypoint = index; const first = connection.route.waypoints[firstWaypoint], second = connection.route.waypoints[secondWaypoint]; if (!first || !second) return;
        geneoPointerState = { kind: 'segment', connectionId: connection.id, start: geneoPointerToCanvas(event), firstWaypoint, secondWaypoint, first: { ...first }, second: { ...second }, vertical: Math.abs(first.x - second.x) < Math.abs(first.y - second.y), moved: false };
    }));
    wrap?.addEventListener('pointerdown', () =>
    {
        const pendingExpansion = Boolean(
            geneoCanvasRuntime.edgeExpansionFrame
          || geneoCanvasRuntime.pendingEdgeExpansion
        );
        cancelGeneographEdgeExpansion({ pending: pendingExpansion });
        cancelGeneographViewportRestore({ releaseSuppression: true });
    }, { capture: true });
    wrap?.addEventListener('click', event =>
    {
        bindGeneographIntentionalCanvasClick(
            wrap
        );
    });
    wrap?.addEventListener('pointerdown', event =>
    {
        if (geneoPointerState || event.button !== 0 || event.isPrimary === false)
        {
            return;
        }
        const canvasTool = geneoEffectiveCanvasTool();
        if (
            canvasTool === 'sticky'
          || canvasTool === 'text'
        )
        {
            const placementType =
                canvasTool;

            /*
           * Text and Sticky can be placed on
           * empty canvas or inside a Panel.
           * Existing objects and interaction
           * controls are not placement surfaces.
           */
            const blockedControl =
                event.target.closest(
                    [
                        'button',
                        'input',
                        'textarea',
                        'select',
                        'a',
                        '[contenteditable="true"]',
                        '.rich-text-toolbar',
                        '.ql-tooltip',
                        '[data-geneo-connection]',
                        '.geneo-connection-hit',
                        '.geneo-segment-hit',
                        '[data-geneo-waypoint]',
                        '[data-geneo-family-junction]'
                    ].join(',')
                );

            if (blockedControl)
            {
                return;
            }

            const nodeElement =
                event.target.closest(
                    '[data-geneo-node]'
                );

            if (nodeElement)
            {
                const clickedNode =
                    getGeneographNode(
                        nodeElement.dataset
                            .geneoNode
                    );

                if (
                    clickedNode?.type
                !== 'panel'
                )
                {
                    return;
                }
            }

            event.preventDefault();
            event.stopPropagation();

            createGeneographRichTextNodeAtPoint(
                placementType,
                geneoPointerToCanvas(
                    event
                )
            );

            return;
        }

        if (canvasTool === 'pencil')
        {
            if (event.target.closest([
                'button',
                'input',
                'textarea',
                'select',
                'a',
                '[contenteditable="true"]',
                '.rich-text-toolbar',
                '.ql-tooltip'
            ].join(','))) return;
            event.preventDefault();
            event.stopPropagation();
            const point = geneoPointerToCanvas(event);
            geneoPointerState = {
                kind: 'pencil',
                pointerId: event.pointerId,
                wrap,
                points: [point],
                beforeSnapshot: geneoSnapshot(),
                moved: false
            };
            wrap.setPointerCapture?.(event.pointerId);
            updateGeneographPencilPreview(geneoPointerState.points);
            return;
        }

        const placementNodeElement = event.target.closest('[data-geneo-node]');
        const connecting = canvasTool === 'connect';
        const panelInterior = canvasTool === 'select'
            && getGeneographNode(placementNodeElement?.dataset.geneoNode)?.type === 'panel'
            && !geneoPanelDirectTarget(event, placementNodeElement);
        const drawingShapeOnPanel = canvasTool === 'shape'
          && getGeneographNode(placementNodeElement?.dataset.geneoNode)?.type === 'panel';
        if (
            event.target.closest(
                [
                    'button',
                    'input',
                    'textarea',
                    'select',
                    'a',
                    '[contenteditable="true"]',
                    '.rich-text-toolbar',
                    '.ql-tooltip',
                    '[data-geneo-waypoint]',
                    '[data-geneo-family-junction]'
                ].join(',')
            )
          || (!connecting && event.target.closest('[data-geneo-connection]'))
          || (placementNodeElement && !panelInterior && !drawingShapeOnPanel && !connecting)
        )
        {
            return;
        }

        if (canvasTool === 'pan' || connecting)
        {
            geneoPointerState = {
                kind: 'pan',
                fromConnect: connecting,
                wrap,
                clientX: event.clientX,
                clientY: event.clientY,
                left: wrap.scrollLeft,
                top: wrap.scrollTop,
                moved: false
            };
        }
        else if (canvasTool === 'select')
        {
            const additive = event.shiftKey;

            geneoPointerState = {
                kind: 'marquee',
                start: geneoPointerToCanvas(event),
                current: geneoPointerToCanvas(event),
                baseIds: additive
                    ? [...geneoSelectedNodeIdSet()]
                    : [],
                baseConnectionIds: additive
                    ? [...geneoSelectedConnectionIdSet()]
                    : [],
                additive,
                panelId: panelInterior ? placementNodeElement.dataset.geneoNode : null,
                moved: false
            };

            if (!additive)
            {
                setGeneographSelection();
            }
        }
        else if (
            canvasTool === 'panel'
          || canvasTool === 'shape'
        )
        {
            const point = snapGeneographPoint(
                geneoPointerToCanvas(event)
            );

            geneoPointerState = {
                kind: canvasTool === 'shape' ? 'draw-shape' : 'draw-panel',
                start: point,
                current: point,
                moved: false
            };

            updateGeneographPanelDraftDom(
                point,
                point
            );
        }
        else
        {
            return;
        }
        event.preventDefault();
    });
    wrap?.addEventListener('wheel', queueGeneographWheelZoom, { passive: false });
    wrap?.addEventListener('scroll', expandGeneographCanvasNearEdge, { passive: true });
    ensureGeneographPointerBinding();
    main.querySelector('[data-geneo-inline-input]')?.addEventListener('blur', () => commitGeneoInlineEdit(false));
    main.querySelector('[data-geneo-inline-input]')?.addEventListener('keydown', event =>
    {
        if (event.key === 'Escape')
        {
            event.preventDefault(); commitGeneoInlineEdit(true);
        }
        else if (event.key === 'Enter' && (event.ctrlKey || event.metaKey || event.target.tagName === 'INPUT'))
        {
            event.preventDefault(); commitGeneoInlineEdit(false);
        }
    });
    main.querySelectorAll('[data-geneo-zoom]').forEach(button => button.addEventListener('click', () =>
    {
        const nextZoom = button.dataset.geneoZoom === 'in' ? state.geneoZoom + 10 : button.dataset.geneoZoom === 'out' ? state.geneoZoom - 10 : 65;
        setGeneographZoom(nextZoom, { center: geneoCurrentViewportCenter() });
    }));
    main.querySelector('[data-geneo-inspector-toggle]')?.addEventListener('click', () =>
    {
        state.geneoInspectorCollapsed = !state.geneoInspectorCollapsed; renderGeneographEditorPreserveScroll();
    });
    main
        .querySelector(
            '[data-geneo-export]'
        )
        ?.addEventListener(
            'click',
            event => exportGeneographBoard(event.currentTarget)
        );
    main
        .querySelectorAll('[data-geneo-node-field]')
        .forEach(input =>
        {
            /*
          * Capture the node identity while binding.
          * Do not resolve through the current selection
          * after the user starts interacting elsewhere.
          */
            const nodeId =
                state.selectedGeneoNodeId;

            input.addEventListener('change', () =>
            {
                const node =
                    getGeneographNode(nodeId);

                if (!node) return;

                const field =
                    input.dataset.geneoNodeField;

                if (!field) return;

                const nextValue =
                    input.value;

                if (node[field] === nextValue)
                {
                    return;
                }

                geneoPushHistory();

                node[field] = nextValue;

                touchGeneographBoard();

                renderGeneographEditorPreserveScroll({
                    preserveInspectorScroll: true
                });
            });
        });
    bindGeneoPaintControls();
    bindGeneoConnectionControls();
    bindGeneoCreationToolControls();
    main.querySelectorAll('[data-geneo-stroke-pattern]').forEach(input =>
    {
        input.addEventListener('change', event =>
        {
            const scope = event.target.dataset.geneoStrokePattern;
            const entity = scope === 'connection' ? selectedGeneographConnection() : selectedGeneographNode();
            if (!entity) return;
            const target = scope === 'connection' ? entity.style : entity.appearance;
            const nextPattern = scope === 'connection' && GENEO_CONNECTION_PATTERNS.includes(event.target.value) ? event.target.value : event.target.value === 'dashed' ? 'dashed' : 'solid';
            if ((scope === 'connection' ? geneoEffectiveConnectionStyle(entity).pattern : target.strokePattern) === nextPattern) return;
            geneoPushHistory();
            if (scope === 'connection')
            {
                if (nextPattern === selectedGeneographDiagram().connectionDefaults.pattern) delete target.pattern;
                else target.pattern = nextPattern;
            }
            else target.strokePattern = nextPattern;
            if (scope === 'node' && entity.type === 'person')
            {
                entity.appearance.styleOverrides ||= { strokeWidth: false, strokePattern: false };
                entity.appearance.styleOverrides.strokePattern = true;
            }
            touchGeneographBoard();
            renderGeneographEditorPreserveScroll({ preserveInspectorScroll: true });
        });
    });
    main.querySelectorAll('[data-geneo-stroke-width]').forEach(input =>
    {
        const scope = input.dataset.geneoStrokeWidth;
        const entityId = scope === 'connection'
            ? state.selectedGeneoConnectionId
            : state.selectedGeneoNodeId;
        const commitStrokeWidth = () =>
        {
            const entity = scope === 'connection'
                ? getGeneographConnection(entityId)
                : getGeneographNode(entityId);
            if (!entity) return;
            const target = scope === 'connection' ? entity.style : entity.appearance;
            const key = scope === 'connection' ? 'width' : 'strokeWidth';
            const nextWidth = Math.round(geneoNumber(
                input.value,
                scope === 'connection' ? geneoEffectiveConnectionStyle(entity).width : target[key],
                GENEO_STROKE_WIDTH_MIN,
                GENEO_STROKE_WIDTH_MAX
            ));
            input.value = nextWidth;
            if ((scope === 'connection' ? geneoEffectiveConnectionStyle(entity).width : target[key]) === nextWidth) return;
            geneoPushHistory();
            if (scope === 'connection')
            {
                if (nextWidth === selectedGeneographDiagram().connectionDefaults.width) delete target.width;
                else target.width = nextWidth;
            }
            else target[key] = nextWidth;
            if (scope === 'node' && entity.type === 'person')
            {
                entity.appearance.styleOverrides ||= { strokeWidth: false, strokePattern: false };
                entity.appearance.styleOverrides.strokeWidth = true;
            }
            touchGeneographBoard();
            renderGeneographEditorPreserveScroll({ preserveInspectorScroll: true });
        };
        input.addEventListener('change', commitStrokeWidth);
        input.addEventListener('keydown', event =>
        {
            if (event.key !== 'Enter') return;
            event.preventDefault();
            commitStrokeWidth();
        });
    });
    const nodeRadiusInput = main.querySelector('[data-geneo-node-corner-radius]');
    if (nodeRadiusInput)
    {
        const commitNodeRadius = () =>
        {
            const node = getGeneographNode(nodeRadiusInput.dataset.geneoNodeCornerRadius);
            if (!node || !Number.isFinite(node.appearance?.cornerRadius)) return;
            const radius = Math.round(geneoNumber(nodeRadiusInput.value, node.appearance.cornerRadius, 0, 32));
            nodeRadiusInput.value = radius;
            if (radius === node.appearance.cornerRadius) return;
            geneoPushHistory();
            node.appearance.cornerRadius = radius;
            touchGeneographBoard();
            renderGeneographEditorPreserveScroll({ preserveInspectorScroll: true });
        };
        nodeRadiusInput.addEventListener('change', commitNodeRadius);
        nodeRadiusInput.addEventListener('keydown', event =>
        {
            if (event.key !== 'Enter') return;
            event.preventDefault();
            commitNodeRadius();
        });
    }
    const nodeFontSizeInput = main.querySelector('[data-geneo-node-font-size]');
    if (nodeFontSizeInput)
    {
        const commitNodeFontSize = () =>
        {
            const node = getGeneographNode(nodeFontSizeInput.dataset.geneoNodeFontSize);
            if (!node || !['text', 'sticky', 'place'].includes(node.type)) return;
            if (nodeFontSizeInput.value.trim() === '' || !nodeFontSizeInput.checkValidity())
            {
                nodeFontSizeInput.reportValidity();
                return;
            }
            const fontSize = Number(nodeFontSizeInput.value);
            if (fontSize === node.appearance.fontSize) return;
            geneoPushHistory();
            node.appearance.fontSize = fontSize;
            if (node.type === 'place') node.placeSizeMode = 'manual';
            touchGeneographBoard();
            renderGeneographEditorPreserveScroll({ preserveInspectorScroll: true });
        };
        nodeFontSizeInput.addEventListener('change', commitNodeFontSize);
        nodeFontSizeInput.addEventListener('keydown', event =>
        {
            if (event.key !== 'Enter') return;
            event.preventDefault();
            commitNodeFontSize();
        });
    }
    main
        .querySelectorAll(
            '[data-geneo-layout]'
        )
        .forEach(input =>
        {
            input.addEventListener(
                'change',
                () =>
                {
                    const node =
                        selectedGeneographNode();

                    if (!node) return;

                    const field =
                        input.dataset
                            .geneoLayout;

                    const minimumSize =
                        geneoNodeMinimumSize(
                            node,
                            node.width
                        );

                    const maximumSize =
                        geneoNodeMaximumSize(
                            node
                        );

                    const minimum =
                        field === 'width'
                            ? minimumSize.width
                            : field === 'height'
                                ? minimumSize.height
                                : -GENEO_WORLD_LIMIT;

                    const maximum =
                        field === 'width'
                            ? maximumSize.width
                            : field === 'height'
                                ? maximumSize.height
                                : GENEO_WORLD_LIMIT;

                    const nextValue =
                        geneoNumber(
                            input.value,
                            node[field],
                            minimum,
                            maximum
                        );

                    if (
                        nextValue ===
                node[field]
                    )
                    {
                        return;
                    }

                    geneoPushHistory();

                    if (
                        node.type === 'person'
                && field === 'height'
                    )
                    {
                        node.personCard.heightMode =
                            'manual';
                    }

                    if (
                        node.type === 'place'
                && [
                    'width',
                    'height'
                ].includes(field)
                    )
                    {
                        node.placeSizeMode =
                            'manual';
                    }

                    node[field] =
                        nextValue;

                    if (
                        node.type === 'panel'
                    )
                    {
                        reconcileGeneographPanelMembership(
                            node.id
                        );
                    }

                    touchGeneographBoard();

                    renderGeneographEditorPreserveScroll({
                        preserveInspectorScroll:
                  true
                    });
                }
            );
        });

    main
        .querySelector(
            '[data-geneo-place-fit-content]'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                const node =
                    selectedGeneographNode();

                if (
                    node?.type !== 'place'
              || geneoPlaceUsesAutoSize(node)
                )
                {
                    return;
                }

                geneoPushHistory();

                node.placeSizeMode =
                    'auto';

                touchGeneographBoard();

                renderGeneographEditorPreserveScroll({
                    preserveInspectorScroll: true,
                    preserveSidebarScroll: true
                });
            }
        );

    main.querySelector('[data-geneo-image-fit]')?.addEventListener('click', () =>
    {
        const node = selectedGeneographNode();
        if (node?.type !== 'image') return;
        const source = resolveGeneographImageSource(node);
        if (!source.available || !(source.width > 0 && source.height > 0)) return;
        const ratio = source.width / source.height;
        const minimum = geneoNodeMinimumSize(node);
        const maximum = geneoNodeMaximumSize(node);
        const width = Math.round(Math.max(minimum.width, minimum.height * ratio,
            Math.min(node.width, maximum.width, maximum.height * ratio)));
        const height = Math.round(width / ratio);
        if (node.width === width && node.height === height) return;
        geneoPushHistory();
        node.x += (node.width - width) / 2;
        node.y += (node.height - height) / 2;
        node.width = width;
        node.height = height;
        touchGeneographBoard();
        renderGeneographEditorPreserveScroll({ preserveInspectorScroll: true });
    });
    main
        .querySelector(
            '[data-geneo-person-fit-height]'
        )
        ?.addEventListener('click', () =>
        {
            const node = selectedGeneographNode();

            if (
                node?.type !== 'person'
            || node.personCard?.heightMode === 'auto'
            )
            {
                return;
            }

            geneoPushHistory();
            node.personCard.heightMode = 'auto';
            touchGeneographBoard();

            renderGeneographEditorPreserveScroll({
                preserveInspectorScroll: true,
                preserveSidebarScroll: true
            });
        });

    main.querySelector('[data-geneo-apply-gender-color]')?.addEventListener('click', () =>
    {
        const node = selectedGeneographNode();
        const diagram = selectedGeneographDiagram();
        if (node?.type !== 'person' || !diagram) return;
        geneoPushHistory();
        geneoApplyPersonGenderAppearance(node, diagram);
        touchGeneographBoard();
        renderGeneographEditorPreserveScroll({ preserveInspectorScroll: true });
        requestAnimationFrame(() => main.querySelector('[data-geneo-apply-gender-color]')?.focus({ preventScroll: true }));
    });
    main.querySelector('[data-geneo-link-person]')?.addEventListener('click', openGeneographTreePersonPicker);
    main.querySelector('[data-geneo-import-family]')?.addEventListener('click', () => openGeneographTreeImport());
    main.querySelector('[data-geneo-edit-person]')?.addEventListener('click', () =>
    {
        const person = getGeneographPerson(selectedGeneographNode()?.personId); if (person) openGeneographPersonModal(person.id);
    });
    main
        .querySelector(
            '[data-geneo-unlink-person]'
        )
        ?.addEventListener(
            'click',
            () =>
            {
                const person =
                    getGeneographPerson(
                        selectedGeneographNode()
                            ?.personId
                    );

                if (!person) return;

                geneoPushHistory();

                person.treePersonId =
                    null;

                person.syncState =
                    'local';

                touchGeneographBoard();

                renderGeneographEditorPreserveScroll({
                    preserveInspectorScroll: true,
                    preserveSidebarScroll: true
                });

                showToast(
                    'Person unlinked from Family Tree.'
                );
            }
        );
    main.querySelector('[data-geneo-edit-place]')?.addEventListener('click', event => openGeneographPlaceModal(event.currentTarget.dataset.geneoEditPlace));
    main.querySelector('[data-geneo-place-board-only]')?.addEventListener('click', event => makeGeneographPlaceBoardOnly(event.currentTarget.dataset.geneoPlaceBoardOnly));
    main.querySelector('[data-geneo-open-place]')?.addEventListener('click', event => openGeneographPlaceInPlaces(event.currentTarget.dataset.geneoOpenPlace));
    main.querySelector('[data-geneo-inspector-shape-kind]')?.addEventListener('change', event =>
    {
        const node = selectedGeneographNode();
        const kind = event.target.value;
        if (node?.type !== 'shape' || !GENEO_SHAPE_KINDS.some(shape => shape.id === kind) || node.shapeKind === kind) return;
        geneoPushHistory();
        node.shapeKind = kind;
        touchGeneographBoard();
        renderGeneographEditorPreserveScroll({ preserveInspectorScroll: true });
    });
    main
        .querySelector('[data-geneo-replace-image]')
        ?.addEventListener('click', () =>
        {
            const node = selectedGeneographNode();

            if (node?.type === 'image')
            {
                openGeneographImagePicker({
                    mode: 'replace',
                    nodeId: node.id
                });
            }
        });

    main
        .querySelector('[data-geneo-open-project-photo]')
        ?.addEventListener('click', event =>
        {
            const photoId =
                event.currentTarget.dataset.geneoOpenProjectPhoto;

            if (getPhoto(photoId, {
                projectId: selectedGeneographBoard()?.projectId || ''
            }))
            {
                openAlbumsForPhoto(photoId);
            }
        });
    main.querySelector('[data-geneo-delete-selection]')?.addEventListener('click', deleteGeneographSelection);
    const relationshipEditor = main.querySelector('[data-geneo-relationship-editor]');
    if (relationshipEditor)
    {
        bindGenealogyDateFields(relationshipEditor);
        bindPlaceComboboxes(relationshipEditor);
        let committed = geneoRelationshipEditorFingerprint(relationshipEditor);
        const commit = () =>
        {
            const current = geneoRelationshipEditorFingerprint(relationshipEditor);
            if (current === committed) return;
            if (saveGeneographPartnerRelationship(relationshipEditor)) committed = current;
        };
        relationshipEditor.addEventListener('change', event =>
        {
            if (event.target.matches('[data-geneo-relationship-type]'))
                updatePartnerRelationshipFields(relationshipEditor, event.target.value);
            commit();
        });
        relationshipEditor.addEventListener('genealogy-date-committed', commit);
    }
    main.querySelector('[data-geneo-show-relationship-dates]')?.addEventListener('change', event =>
    {
        const connection = selectedGeneographConnection(); if (!connection) return;
        if (geneoEffectiveShowRelationshipDates(connection) === event.target.checked) return;
        geneoPushHistory();
        if (event.target.checked === selectedGeneographDiagram().connectionDefaults.showRelationshipDates)
            delete connection.showRelationshipDates;
        else connection.showRelationshipDates = event.target.checked;
        touchGeneographBoard(); renderGeneographEditorPreserveScroll();
    });
    main
        .querySelector('[data-geneo-connection-routing]')
        ?.addEventListener('change', event =>
        {
            const connection =
                selectedGeneographConnection();

            if (!connection) return;

            const automaticPoints = connection.route.mode === 'auto'
                && event.target.value === 'manual' && !connection.route.waypoints.length
                ? geneoConnectionPoints(connection) : null;
            geneoPushHistory();

            connection.route.mode =
                event.target.value;

            if (connection.route.mode === 'manual') delete connection.route.railY;

            if (
                connection.route.mode === 'manual'
            && !connection.route.waypoints.length
            )
            {
                const points = automaticPoints ||
                    geneoConnectionPoints({
                        ...connection,
                        route: {
                            mode: 'auto',
                            waypoints: []
                        }
                    });

                connection.route.waypoints =
                    points
                        .slice(1, -1)
                        .map(snapGeneographPoint);
            }

            touchGeneographBoard();

            renderGeneographEditorPreserveScroll({
                preserveInspectorScroll: true
            });
        });

    main
        .querySelector('[data-geneo-reset-route]')
        ?.addEventListener('click', () =>
        {
            const connection =
                selectedGeneographConnection();

            if (!connection) return;

            geneoPushHistory();

            const bus = geneoFamilyChildBusGroups().byConnection.get(connection.id);
            bus?.connectionIds.forEach(id =>
            {
                const member = getGeneographConnection(id);
                if (member?.route) delete member.route.railY;
            });

            connection.route = {
                mode: 'auto',
                waypoints: []
            };

            touchGeneographBoard();

            renderGeneographEditorPreserveScroll({
                preserveInspectorScroll: true
            });
        });
    main.querySelectorAll('[data-geneo-background-pattern]').forEach(button => button.addEventListener('click', () => updateGeneoCanvasSetting('backgroundPattern', button.dataset.geneoBackgroundPattern)));
    main.querySelector('[data-geneo-sockets]')?.addEventListener('change', event => updateGeneoCanvasSetting('alwaysShowSockets', event.target.checked));
    main.querySelector('[data-geneo-snap]')?.addEventListener('change', event => updateGeneoCanvasSetting('snapToGrid', event.target.checked));
    main.querySelector('[data-geneo-object-highlight]')?.addEventListener('change', event => {
        geneoCanvasRuntime.objectHighlight = event.target.value;
        renderGeneographEditorPreserveScroll({ preserveInspectorScroll: true });
    });
    main.querySelector('[data-geneo-person-gender-colors]')?.addEventListener('change', event => updateGeneoCanvasSetting('colorPersonCardsByGender', event.target.checked));
    const cardDefaults = selectedGeneographDiagram().cardAppearanceDefaults;
    const updateCardDefault = (gender, key, value) => {
        const appearance = cardDefaults?.[gender];
        if (!appearance || appearance[key] === value) return;
        geneoPushHistory();
        appearance[key] = value;
        if (gender === 'neutral' && key === 'cornerRadius')
            selectedGeneographDiagram().personCardDefaults.cornerRadius = value;
        touchGeneographBoard();
        renderGeneographEditorPreserveScroll({ preserveInspectorScroll: true });
    };
    main.querySelectorAll('[data-geneo-card-default-stroke-width]').forEach(input =>
        input.addEventListener('change', () => {
            const gender = input.dataset.geneoCardDefaultStrokeWidth;
            updateCardDefault(gender, 'strokeWidth', Math.round(geneoNumber(input.value, cardDefaults[gender].strokeWidth, 1, 12)));
        }));
    main.querySelectorAll('[data-geneo-card-default-stroke-pattern]').forEach(input =>
        input.addEventListener('change', () =>
            updateCardDefault(input.dataset.geneoCardDefaultStrokePattern, 'strokePattern', input.value === 'dashed' ? 'dashed' : 'solid')));
    main.querySelectorAll('[data-geneo-card-default-radius]').forEach(input =>
        input.addEventListener('change', () => {
            const gender = input.dataset.geneoCardDefaultRadius;
            updateCardDefault(gender, 'cornerRadius', Math.round(geneoNumber(input.value, cardDefaults[gender].cornerRadius, 0, 32)));
        }));
    main.querySelector('[data-geneo-settings]')?.addEventListener('click', openGeneographSettingsModal);
    main.querySelector('[data-geneo-reset-canvas-defaults]')?.addEventListener('click', () => {
        const diagram = selectedGeneographDiagram();
        if (!diagram) return;
        geneoPushHistory();
        const defaults = createEmptyGeneographDiagram();
        diagram.canvas = defaults.canvas;
        diagram.cardAppearanceDefaults = defaults.cardAppearanceDefaults;
        diagram.personCardDefaults = defaults.personCardDefaults;
        diagram.connectionDefaults = defaults.connectionDefaults;
        geneoConnectionToolRuntime.overrides = {};
        geneoCanvasRuntime.objectHighlight = 'none';
        touchGeneographBoard();
        renderGeneographEditorPreserveScroll({ preserveInspectorScroll: true });
    });
    bindGeneographInspectorNameField();
    bindGeneographNodeHeader();
    bindGeneographPersonCardControls();
    bindGeneographPersonMultiAppearance();
    bindGeneographGenericBulkControls();
    bindGeneographSidebarControls();
    bindToasts(main);
}

function ensureGeneographPointerBinding()
{
    if (geneoPointerBound) return;
    geneoPointerBound = true;
    window.addEventListener('pointermove', moveGeneographObject);
    window.addEventListener('pointerup', endGeneographObjectDrag);
    window.addEventListener('pointercancel', endGeneographObjectDrag);
}

function updateGeneoCanvasSetting(field, value)
{
    const canvas = selectedGeneographDiagram().canvas;

    if (canvas[field] === value) return;

    geneoPushHistory();
    canvas[field] = value;
    touchGeneographBoard();

    renderGeneographEditorPreserveScroll({
        preserveInspectorScroll: true,
        preserveSidebarScroll: true
    });
}

function bindGeneographSidebarControls()
{
    geneoCancelLayerDrag();
    const layerList = sidebar.querySelector('.geneo-layer-list');
    layerList?.addEventListener('dragover', event =>
    {
        if (!geneoLayerDrag) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = geneoUpdateLayerDrop(event.clientX, event.clientY) ? 'move' : 'none';
    });
    layerList?.addEventListener('drop', event =>
    {
        if (!geneoLayerDrag) return;
        event.preventDefault(); geneoUpdateLayerDrop(event.clientX, event.clientY); geneoFinishLayerDrop();
    });
    layerList?.addEventListener('dragleave', event =>
    {
        if (geneoLayerDrag && !layerList.contains(event.relatedTarget))
        {
            geneoLayerDrag.targetId = '';
            layerList.querySelectorAll('.layer-drop-before, .layer-drop-after').forEach(element => element.classList.remove('layer-drop-before', 'layer-drop-after'));
        }
    });
    sidebar.querySelectorAll('[data-geneo-layer-connection]').forEach(row => row.addEventListener('dragstart', event => event.preventDefault()));
    sidebar.querySelectorAll('[data-geneo-collapse-connections]').forEach(button => button.addEventListener('click', () =>
    {
        const expanded = geneoConnectionDisclosureState.get(selectedGeneographBoard().id);
        const id = button.dataset.geneoCollapseConnections;
        if (expanded.has(id)) expanded.delete(id); else expanded.add(id);
        renderGeneographEditorPreserveScroll({ preserveSidebarScroll: true });
    }));
    if (
        !sidebar.dataset
            .geneoLayerRenameBound
    )
    {
        sidebar.dataset
            .geneoLayerRenameBound = 'true';

        /*
        * The sidebar contents are replaced after
        * selection. Detect the second mouse press
        * from the persistent sidebar element.
        */
        sidebar.addEventListener(
            'mousedown',
            event =>
            {
                if (
                    event.button !== 0
              || event.detail !== 2
                )
                {
                    return;
                }

                const handle =
                    event.target.closest?.(
                        '[data-geneo-layer-rename-handle]'
                    );

                if (!handle) return;

                const nodeRow =
                    handle.closest(
                        '[data-geneo-layer]'
                    );

                const connectionRow =
                    handle.closest(
                        '[data-geneo-layer-connection]'
                    );

                if (!nodeRow && !connectionRow)
                {
                    return;
                }

                event.preventDefault();
                event.stopPropagation();

                if (nodeRow)
                {
                    beginGeneographLayerRename(
                        'node',
                        nodeRow.dataset.geneoLayer
                    );
                }
                else
                {
                    beginGeneographLayerRename(
                        'connection',
                        connectionRow.dataset
                            .geneoLayerConnection
                    );
                }
            },
            true
        );
    }
    sidebar.querySelector('[data-geneo-all-boards]')?.addEventListener('click', () =>
    {
        captureGeneographViewport(); cancelGeneographConnectionDraft(); state.geneoView = 'home'; selectGeneographCanvas(); renderGeneographHome();
    });
    sidebar.querySelector('[data-geneo-item-filter-trigger]')?.addEventListener('click', event =>
    {
        state.geneoItemFilterOpen = !state.geneoItemFilterOpen;
        const menu = sidebar.querySelector('[data-geneo-item-filter-menu]');
        if (menu) menu.hidden = !state.geneoItemFilterOpen;
        event.currentTarget.setAttribute('aria-expanded', String(state.geneoItemFilterOpen));
        if (state.geneoItemFilterOpen) menu?.querySelector('input')?.focus();
    });
    sidebar.querySelectorAll('[data-geneo-item-filter-type]').forEach(input => input.addEventListener('change', () =>
    {
        state.geneoItemFilter.types = [...sidebar.querySelectorAll('[data-geneo-item-filter-type]:checked')]
            .map(item => item.dataset.geneoItemFilterType);
        renderGeneographEditorPreserveScroll({ preserveSidebarScroll: true });
        sidebar.querySelector(`[data-geneo-item-filter-type="${input.dataset.geneoItemFilterType}"]`)?.focus({ preventScroll: true });
    }));
    sidebar.querySelectorAll('[data-geneo-item-filter-status]').forEach(input => input.addEventListener('change', () =>
    {
        state.geneoItemFilter.status = input.dataset.geneoItemFilterStatus;
        renderGeneographEditorPreserveScroll({ preserveSidebarScroll: true });
        sidebar.querySelector(`[data-geneo-item-filter-status="${input.dataset.geneoItemFilterStatus}"]`)?.focus({ preventScroll: true });
    }));
    sidebar.querySelectorAll('[data-geneo-item-filter-clear]').forEach(button => button.addEventListener('click', () =>
    {
        state.geneoItemFilter = { types: [], status: 'all' };
        state.geneoLayerSearch = '';
        state.geneoItemFilterOpen = false;
        renderGeneographEditorPreserveScroll({ preserveSidebarScroll: true });
        sidebar.querySelector('#geneoLayerSearch')?.focus({ preventScroll: true });
    }));
    if (!sidebar.dataset.geneoItemFilterDismissBound)
    {
        sidebar.dataset.geneoItemFilterDismissBound = 'true';
        document.addEventListener('pointerdown', event =>
        {
            if (!state.geneoItemFilterOpen || event.target.closest?.('[data-geneo-item-filter-trigger], [data-geneo-item-filter-menu]')) return;
            state.geneoItemFilterOpen = false;
            const menu = sidebar.querySelector('[data-geneo-item-filter-menu]');
            if (menu) menu.hidden = true;
            sidebar.querySelector('[data-geneo-item-filter-trigger]')?.setAttribute('aria-expanded', 'false');
        });
        document.addEventListener('keydown', event =>
        {
            if (event.key !== 'Escape' || !state.geneoItemFilterOpen) return;
            event.preventDefault();
            state.geneoItemFilterOpen = false;
            const menu = sidebar.querySelector('[data-geneo-item-filter-menu]');
            if (menu) menu.hidden = true;
            const trigger = sidebar.querySelector('[data-geneo-item-filter-trigger]');
            trigger?.setAttribute('aria-expanded', 'false');
            trigger?.focus({ preventScroll: true });
        });
    }
    sidebar.querySelector('#geneoLayerSearch')?.addEventListener('input', event =>
    {
        state.geneoLayerSearch = event.target.value; renderGeneographEditorPreserveScroll(); requestAnimationFrame(() =>
        {
            const input = sidebar.querySelector('#geneoLayerSearch'); if (input)
            {
                input.focus(); input.setSelectionRange(input.value.length, input.value.length);
            }
        });
    });
    sidebar
        .querySelectorAll(
            '[data-geneo-layer]'
        )
        .forEach(row =>
        {
            row.addEventListener(
                'click',
                event =>
                {
                    if (
                        event.target.closest(
                            'button,input'
                        )
                    )
                    {
                        return;
                    }

                    selectGeneographNode(
                        row.dataset.geneoLayer,
                        {
                            toggle:
                    event.shiftKey
                    || event.ctrlKey
                    || event.metaKey
                        }
                    );

                    renderGeneographEditorPreserveScroll();
                }
            );

            row.addEventListener(
                'keydown',
                event =>
                {
                    if (
                        event.target.closest('button,input')
                    )
                    {
                        return;
                    }

                    if (event.key === 'F2')
                    {
                        event.preventDefault();

                        beginGeneographLayerRename(
                            'node',
                            row.dataset.geneoLayer
                        );

                        return;
                    }

                    if (
                        event.key !== 'Enter'
                && event.key !== ' '
                    )
                    {
                        return;
                    }

                    event.preventDefault();

                    selectGeneographNode(
                        row.dataset.geneoLayer,
                        {
                            toggle:
                    event.shiftKey
                    || event.ctrlKey
                    || event.metaKey
                        }
                    );

                    renderGeneographEditorPreserveScroll();
                }
            );

            bindGeneoLayerRow(row);
        });
    sidebar
        .querySelectorAll(
            '[data-geneo-layer-connection]'
        )
        .forEach(row =>
        {
            row.addEventListener(
                'click',
                event =>
                {
                    if (
                        event.target.closest('button,input')
                    )
                    {
                        return;
                    }

                    selectGeneographConnection(
                        row.dataset
                            .geneoLayerConnection,
                        null,
                        {
                            toggle:
                    event.shiftKey
                    || event.ctrlKey
                    || event.metaKey
                        }
                    );

                    renderGeneographEditorPreserveScroll();
                }
            );

            row.addEventListener(
                'keydown',
                event =>
                {
                    if (
                        event.target.closest('button,input')
                    )
                    {
                        return;
                    }

                    if (event.key === 'F2')
                    {
                        event.preventDefault();

                        beginGeneographLayerRename(
                            'connection',
                            row.dataset
                                .geneoLayerConnection
                        );

                        return;
                    }

                    if (
                        event.key !== 'Enter'
                && event.key !== ' '
                    )
                    {
                        return;
                    }

                    event.preventDefault();

                    selectGeneographConnection(
                        row.dataset
                            .geneoLayerConnection
                    );

                    renderGeneographEditorPreserveScroll();
                }
            );
        });
    sidebar.querySelectorAll('[data-geneo-toggle-connection-visible]').forEach(button => button.addEventListener('click', event =>
    {
        event.stopPropagation();
        const connection = getGeneographConnection(button.dataset.geneoToggleConnectionVisible);
        if (!connection) return;
        geneoPushHistory();
        connection.visible = connection.visible === false;
        touchGeneographBoard();
        renderGeneographEditorPreserveScroll({ preserveSidebarScroll: true });
    }));
    sidebar.querySelectorAll('[data-geneo-locate-node]').forEach(button => button.addEventListener('click', event =>
    {
        event.stopPropagation();
        const node = getGeneographNode(button.dataset.geneoLocateNode);
        if (!node || !geneoNodeEffectiveVisible(node)) return;
        const center = { x: node.x + node.width / 2, y: node.y + node.height / 2 };
        selectGeneographNode(node.id);
        renderGeneographEditorPreserveScroll({ preserveSidebarScroll: true });
        scheduleGeneographViewportRestore(center);
    }));
    sidebar.querySelectorAll('[data-geneo-locate-connection]').forEach(button => button.addEventListener('click', event =>
    {
        event.stopPropagation();
        const connection = getGeneographConnection(button.dataset.geneoLocateConnection);
        if (!connection || !geneoConnectionEffectiveVisible(connection)) return;
        const points = geneoConnectionPoints(connection);
        const center = points.length ? {
            x: (Math.min(...points.map(point => point.x)) + Math.max(...points.map(point => point.x))) / 2,
            y: (Math.min(...points.map(point => point.y)) + Math.max(...points.map(point => point.y))) / 2
        } : null;
        selectGeneographConnection(connection.id);
        renderGeneographEditorPreserveScroll({ preserveSidebarScroll: true });
        scheduleGeneographViewportRestore(center);
    }));
    sidebar.querySelectorAll('[data-geneo-toggle-visible]').forEach(button => button.addEventListener('click', event =>
    {
        event.stopPropagation(); const node = getGeneographNode(button.dataset.geneoToggleVisible); if (node)
        {
            geneoPushHistory(); node.visible = !node.visible; touchGeneographBoard(); renderGeneographEditorPreserveScroll();
        }
    }));
    sidebar.querySelectorAll('[data-geneo-toggle-lock]').forEach(button => button.addEventListener('click', event =>
    {
        event.stopPropagation(); const node = getGeneographNode(button.dataset.geneoToggleLock); if (node)
        {
            geneoPushHistory(); node.locked = !node.locked; touchGeneographBoard(); renderGeneographEditorPreserveScroll();
        }
    }));
    sidebar.querySelectorAll('[data-geneo-collapse-panel]').forEach(button => button.addEventListener('click', () =>
    {
        const id = button.dataset.geneoCollapsePanel; state.geneoCollapsedPanels[id] = !state.geneoCollapsedPanels[id]; renderGeneographEditorPreserveScroll();
    }));
    const renameInput =
        sidebar.querySelector(
            '[data-geneo-layer-rename-input]'
        );

    if (renameInput)
    {
        renameInput.addEventListener(
            'input',
            event =>
            {
                const rename =
                    state.geneoLayerRename;

                if (!rename) return;

                if (
                    rename.entityType
                !== event.target.dataset
                    .geneoRenameType
              || rename.entityId
                !== event.target.dataset
                    .geneoRenameId
                )
                {
                    return;
                }

                rename.draft =
                    event.target.value;
            }
        );

        renameInput.addEventListener(
            'keydown',
            event =>
            {
                if (event.key === 'Enter')
                {
                    event.preventDefault();
                    event.stopPropagation();

                    finishGeneographLayerRename({
                        value: event.target.value,
                        restoreFocus: true
                    });

                    return;
                }

                if (event.key === 'Escape')
                {
                    event.preventDefault();
                    event.stopPropagation();

                    finishGeneographLayerRename({
                        cancel: true,
                        restoreFocus: true
                    });
                }
            }
        );

        renameInput.addEventListener(
            'blur',
            event =>
            {
                const value =
                    event.target.value;

                const entityType =
                    event.target.dataset
                        .geneoRenameType;

                const entityId =
                    event.target.dataset
                        .geneoRenameId;

                setTimeout(() =>
                {
                    if (
                        !geneoLayerRenameMatches(
                            entityType,
                            entityId
                        )
                    )
                    {
                        return;
                    }

                    finishGeneographLayerRename({
                        value,
                        restoreFocus: false
                    });
                }, 0);
            }
        );
    }
}

function ensureGeneographKeyboardBinding()
{
    if (geneoKeyboardBound) return; geneoKeyboardBound = true;
    document.addEventListener('keydown', event =>
    {
        if (event.key === 'Shift')
        {
            geneoShiftPressed = true;
        }
        if (event.key === 'Control' && !event.repeat && state.activeModule === 'Geneograph'
            && state.geneoView === 'board' && !modalBackdrop.classList.contains('open')
            && !event.target.closest?.('input,textarea,select,[contenteditable="true"]'))
        {
            setGeneoCtrlSelectPressed(true);
        }
        if (state.activeModule !== 'Geneograph' || state.geneoView !== 'board' || modalBackdrop.classList.contains('open')) return;
        if (event.key === 'Escape' && geneoImageCropRuntime)
        {
            event.preventDefault();
            event.stopPropagation();
            geneoFinishImageCrop(false);
            return;
        }
        if (event.key === 'Enter' && geneoImageCropRuntime && !event.target.closest?.('button'))
        {
            event.preventDefault();
            geneoFinishImageCrop(true);
            return;
        }
        if (event.key === 'Escape' && event.target.closest?.('[data-geneo-connection-panel]'))
        {
            event.preventDefault();
            geneoConnectionToolRuntime.panelOpen = false;
            renderGeneographEditorPreserveScroll();
            suppressSplitFocusAfterEscape(main.querySelector('[data-geneo-connection-main]'));
            return;
        }
        const editable = event.target.closest('input,textarea,select,[contenteditable="true"]');
        if (editable) return;
        if (event.ctrlKey || event.metaKey)
        {
            const key = event.key.toLowerCase();
            if (key === 'c' && selectedGeneographNodes().length)
            {
                event.preventDefault(); copyGeneographSelection(); return;
            }
            if (key === 'x' && selectedGeneographNodes().length)
            {
                event.preventDefault(); closeGeneographObjectContextMenu(); cutGeneographSelection(); return;
            }
            if (key === 'v' && geneoObjectClipboard?.boardId === selectedGeneographBoard()?.id)
            {
                event.preventDefault(); closeGeneographObjectContextMenu(); pasteGeneographObjects(); return;
            }
        }
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z')
        {
            event.preventDefault(); event.shiftKey ? redoGeneographChange() : undoGeneographChange(); return;
        }
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y')
        {
            event.preventDefault(); redoGeneographChange(); return;
        }
        if (event.key === 'Escape' && (state.geneoTool === 'pencil' || geneoPointerState?.kind === 'pencil'))
        {
            event.preventDefault();
            cancelGeneographPencilStroke();
            state.geneoTool = 'pan';
            renderGeneographEditorPreserveScroll();
            return;
        }
        if (
            event.key === 'Escape'
          && (
              state.geneoTool === 'panel'
            || state.geneoTool === 'sticky'
            || state.geneoTool === 'text'
            || state.geneoTool === 'shape'
            || geneoPointerState?.kind
              === 'draw-panel'
            || geneoPointerState?.kind
              === 'draw-shape'
          )
        )
        {
            event.preventDefault();

            geneoPointerState = null;
            hideGeneographPanelDraftDom();

            finishGeneographPlacementTool();

            renderGeneographEditorPreserveScroll();
            return;
        }
        if (event.key === 'Escape' && state.geneoConnectionDraft)
        {
            event.preventDefault(); cancelGeneographConnectionDraft(); renderGeneographEditorPreserveScroll(); return;
        }
        if (event.key === 'Escape' && geneoCanvasRuntime.connectionClick)
        {
            event.preventDefault(); clearGeneographConnectionClick(); return;
        }
        if (event.key === 'Delete' || event.key === 'Backspace')
        {
            if (Number.isInteger(state.selectedGeneoWaypointIndex))
            {
                const connection = selectedGeneographConnection(); if (connection?.route.waypoints[state.selectedGeneoWaypointIndex])
                {
                    geneoPushHistory(); connection.route.waypoints.splice(state.selectedGeneoWaypointIndex, 1); state.selectedGeneoWaypointIndex = null; touchGeneographBoard(); renderGeneographEditorPreserveScroll();
                }
            }
            else deleteGeneographSelection(); return;
        }
        const selectedNodes = selectedGeneographNodes();
        const selectedConnections = selectedGeneographConnections();
        if ((!selectedNodes.length && !selectedConnections.length) || !['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.key)) return;
        const moving = geneoGroupMoveSnapshot(selectedNodes);
        const movingConnections = geneoConnectionMoveSnapshot(moving, selectedConnections);
        if (!moving.length && !movingConnections.length) return;
        event.preventDefault(); geneoPushHistory();
        const requested = event.shiftKey ? 10 : 1;
        const amount = selectedGeneographDiagram().canvas.snapToGrid ? GENEO_GRID_SIZE : requested;
        const dx = event.key === 'ArrowLeft' ? -amount : event.key === 'ArrowRight' ? amount : 0;
        const dy = event.key === 'ArrowUp' ? -amount : event.key === 'ArrowDown' ? amount : 0;
        applyGeneographSelectionTranslation({ nodes: moving, connections: movingConnections }, dx, dy);
        touchGeneographBoard(); renderGeneographEditorPreserveScroll();
    });
    document.addEventListener('keyup', event =>
    {
        if (event.key === 'Shift')
        {
            geneoShiftPressed = false;
        }
        if (event.key === 'Control') setGeneoCtrlSelectPressed(false);
    });
    document.addEventListener('focusin', event =>
    {
        if (event.target.closest?.('input,textarea,select,[contenteditable="true"]')
            || modalBackdrop.contains(event.target)) setGeneoCtrlSelectPressed(false);
    });
    window.addEventListener('blur', () =>
    {
        geneoShiftPressed = false;
        setGeneoCtrlSelectPressed(false);
    });
}

function openSimpleModal(title, message)
{
    openModal(`<div class="modal" role="dialog" aria-modal="true" aria-labelledby="simpleModalTitle"><div class="modal-header"><div><h2 id="simpleModalTitle">${escapeHtml(title)}</h2><p>${escapeHtml(message)}</p></div><button class="close-button" type="button" data-close>${icon.close}</button></div><div class="modal-footer"><button class="button primary" type="button" data-close>Got it</button></div></div>`);
}

