const RU_DATA_NAMES_FIRST = {
    'Silver': 'Сильвер',
    'Luna': 'Луна',
    'Oliver': 'Оливер',
    'Mochi': 'Мочи',
    'Cleo': 'Клео',

    'Barnaby': 'Барнаби',
    'Daisy': 'Дейзи',
    'Rupert': 'Руперт',
    'Mabel': 'Мейбл',

    'Archibald': 'Арчибальд',
    'Edith': 'Эдит',
    'Percival': 'Персиваль',
    'Nora': 'Нора',
    'Algernon': 'Алджернон',
    'Beatrice': 'Беатрис',
    'Felix': 'Феликс',
    'Pearl': 'Пёрл',

    'Solomon': 'Соломон',
    'Opal': 'Опал',
    'Horatio': 'Горацио',
    'Clementine': 'Клементина',
    'Augustus': 'Августус',
    'Tobias': 'Тобиас',
    'Marigold': 'Мэриголд',

    // Geneograph-local seeded people
    'Iris': 'Ирис',
    'Theo': 'Тео',
    'Dave': 'Дейв',
    'Andrew': 'Эндрю',
    'Fiona': 'Фиона',
    'Lisa': 'Лиза',
    'Sandra': 'Сандра'
};
const RU_DATA_NAMES_MIDDLE = Object.freeze({});
const RU_DATA_NAMES_SURNAMES = {
    'Whiskerfield': 'Вискерфильд',
    'Purrington': 'Пуррингтон',
    'Milkpaw': 'Милкпоу',
    'Softtail': 'Софттейл',
    'Mackerelton': 'Макрельтон',
    'Creamfur': 'Кримфюр',
    'Threadtail': 'Тредтейл',
    'Velvetpaw': 'Велветпоу',
    'Silktail': 'Силктейл',
    'Butterpaws': 'Баттерпоуз'
};
const RU_DATA_PLACES = {
    // Canonical place records
    'Pawford, North Yorkshire, England':
        'Поуфорд, Северный Йоркшир, Англия',

    'Meowbridge, North Yorkshire, England':
        'Мяубридж, Северный Йоркшир, Англия',

    'Fishmarket Row, North Yorkshire, England':
        'Фишмаркет-Роу, Северный Йоркшир, Англия',

    'Old Cattery, North Yorkshire, England':
        'Олд-Кэттери, Северный Йоркшир, Англия',

    'Unidentified village near Pawford, North Yorkshire, England':
        'Неизвестная деревня близ Поуфорда, Северный Йоркшир, Англия',

    'Whiskerfield family garden, Pawford, North Yorkshire, England':
        'Семейный сад Вискерфильдов, Поуфорд, Северный Йоркшир, Англия',

    'Meowbridge School, North Yorkshire, England':
        'Школа Мяубриджа, Северный Йоркшир, Англия',

    'Pawford County Archive, North Yorkshire, England':
        'Архив округа Поуфорд, Северный Йоркшир, Англия',

    'Whiskerfield residence near Pawford, North Yorkshire, England':
        'Дом Вискерфильдов близ Поуфорда, Северный Йоркшир, Англия',

    'Pawford Cemetery, North Yorkshire, England':
        'Кладбище Поуфорда, Северный Йоркшир, Англия',

    // Alternative names
    'Pawford town':
        'город Поуфорд',

    'Meow Bridge':
        'Мяу-Бридж',

    'Fish Market Row':
        'Фиш-Маркет-Роу',

    'The Old Cattery':
        'Старая Кошатня',

    'Village near Pawford':
        'Деревня близ Поуфорда',

    'Pawford family garden':
        'Семейный сад в Поуфорде',

    'Meowbridge school':
        'Школа Мяубриджа',

    'Pawford archive':
        'Архив Поуфорда',

    'Whiskerfield family house':
        'Семейный дом Вискерфильдов',

    'Pawford burial ground':
        'Место захоронения в Поуфорде',

    'Duplicate Pawford record':
        'Дублирующая запись Поуфорда',

    // Short place/display values
    'Pawford':
        'Поуфорд',

    'Meowbridge':
        'Мяубридж',

    'Fishmarket Row':
        'Фишмаркет-Роу',

    'Old Cattery':
        'Олд-Кэттери',

    'Pawford garden':
        'Сад в Поуфорде',

    'North quay studio':
        'Студия на Северной набережной',

    'Pawford tutoring circle':
        'Учебный кружок Поуфорда',

    'England':
        'Англия',

    'North Yorkshire, England':
        'Северный Йоркшир, Англия',

    'Meowbridge School':
        'Школа Мяубриджа',

    'Pawford Cemetery':
        'Кладбище Поуфорда',

    'Pawford County Archive':
        'Архив округа Поуфорд',

    'Unidentified village near Pawford':
        'Неизвестная деревня близ Поуфорда',

    'Whiskerfield family garden':
        'Семейный сад Вискерфильдов',

    'Whiskerfield residence near Pawford':
        'Дом Вискерфильдов близ Поуфорда',

    'Places connected to members of the Whiskerfield family.':
        'Места, связанные с членами семьи Вискерфильдов.',

    'Places connected to Silver Whiskerfield.':
        'Места, связанные с Сильвером Вискерфильдом.',

    'Places linked to events before 1900.':
        'Места, связанные с событиями до 1900 года.',

    'Places that do not yet have coordinates.':
        'Места, для которых ещё не указаны координаты.'
};

const RU_DATA_SOURCES =
    Object.freeze({
        // ========================================
        // Source as1
        // ========================================

        'Pawford County Archive — parish and household registers':
          'Архив округа Поуфорд — приходские и домовые книги',

        'Register collection 12 / household series 3':
          'Коллекция реестров 12 / серия домовых книг 3',

        'County archive material used for Pawford household and parish research.':
          'Материалы окружного архива, использованные для изучения домохозяйств и прихода Поуфорда.',

        // ========================================
        // Source as2
        // ========================================

        'Pawford household register continuation, 1947–1952':
          'Продолжение домовой книги Поуфорда, 1947–1952',

        'Household series 3, continuation volume':
          'Серия домовых книг 3, том-продолжение',

        'Continuation volume for Pawford household entries after 1946.':
          'Том-продолжение с записями о домохозяйствах Поуфорда после 1946 года.',

        // ========================================
        // Source as3
        // ========================================

        'Meowbridge marriage certificate held in family documents':
          'Свидетельство о браке в Мяубридже из семейных документов',

        'Whiskerfield family documents':
          'Семейные документы Вискерфильдов',

        'Certificate folder, item 2':
          'Папка со свидетельствами, документ 2',

        'Original certificate scan retained by the family.':
          'Скан оригинала свидетельства хранится в семье.',

        // ========================================
        // Source as4
        // ========================================

        'Interview with Luna Purrington, 2 April 2026':
          'Интервью с Луной Пуррингтон, 2 апреля 2026 года',

        'Online interview':
          'Онлайн-интервью',

        'Audio interview 2026-04-02':
          'Аудиоинтервью от 02.04.2026',

        'Recorded family-history interview covering stories from 1940 to 1990.':
          'Записанное интервью по семейной истории с рассказами о периоде с 1940 по 1990 год.',

        // ========================================
        // Source as5
        // ========================================

        'Whiskerfield family reference collection':
          'Справочная коллекция семьи Вискерфильдов',

        'Reference box A':
          'Коробка со справочными материалами A',

        'Mixed family reference material, clippings, and album documentation.':
          'Смешанная коллекция семейных справочных материалов, вырезок и описаний альбомов.',

        // ========================================
        // Source as6
        // ========================================

        'Regional genealogy database — Pawford records':
          'Региональная генеалогическая база данных — записи Поуфорда',

        'Regional genealogy database':
          'Региональная генеалогическая база данных',

        'Pawford record collection, 1900–1950':
          'Коллекция записей Поуфорда, 1900–1950',

        'Online index and document extracts for the Pawford area.':
          'Онлайн-указатель и выписки из документов по району Поуфорда.'
    });
const RU_DATA_PHOTOS = {
    // Titles
    'Silver portrait':
        'Портрет Сильвера',

    'Family table':
        'Семейный стол',

    'Barnaby portrait':
        'Портрет Барнаби',

    'Luna portrait':
        'Портрет Луны',

    'Grandparents in the garden':
        'Бабушка и дедушка в саду',

    'Daisy school portrait':
        'Школьный портрет Дейзи',

    'Silver and Luna':
        'Сильвер и Луна',

    'Purrington family visit':
        'Визит семьи Пуррингтон',

    'Oliver portrait':
        'Портрет Оливера',

    'Pearl portrait':
        'Портрет Пёрл',

    'Young Whiskerfield family':
        'Молодая семья Вискерфильдов',

    'Unidentified studio portrait':
        'Неопознанный студийный портрет',

    'Archive storage':
        'Хранилище архива',

    'Archibald at the workshop':
        'Арчибальд у мастерской',

    // Captions
    'Portrait of Silver Whiskerfield.':
        'Портрет Сильвера Вискерфильда.',

    'Family table after a celebration.':
        'Семейный стол после праздника.',

    'Barnaby Whiskerfield in Pawford.':
        'Барнаби Вискерфильд в Поуфорде.',

    'Portrait of Luna Purrington.':
        'Портрет Луны Пуррингтон.',

    'Barnaby and Daisy in the family garden.':
        'Барнаби и Дейзи в семейном саду.',

    'Early portrait of Daisy Milkpaw.':
        'Ранний портрет Дейзи Милкпоу.',

    'Silver and Luna at their wedding celebration.':
        'Сильвер и Луна на свадебном торжестве.',

    'A Purrington family visit.':
        'Визит семьи Пуррингтон.',

    'Oliver Whiskerfield portrait.':
        'Портрет Оливера Вискерфильда.',

    'Portrait identified as Pearl Velvetpaw.':
        'Портрет, опознанный как Пёрл Велветпоу.',

    'The young Whiskerfield household.':
        'Молодая семья Вискерфильдов.',

    'Unidentified portrait awaiting research.':
        'Неопознанный портрет, ожидающий исследования.',

    'View of the Pawford archive storage.':
        'Вид в хранилище архива Поуфорда.',

    'Archibald Whiskerfield at his workshop.':
        'Арчибальд Вискерфильд у мастерской.',

    // Origin labels
    'Family upload':
        'Семейная загрузка',

    'Personal album scan':
        'Скан из личного альбома',

    'Family album scan':
        'Скан из семейного альбома',

    'Luna upload':
        'Загрузка Луны',

    'Inherited print':
        'Унаследованный отпечаток',

    'Rupert collection':
        'Коллекция Руперта',

    'Old Cattery collection':
        'Коллекция Олд-Кэттери',

    'Household upload':
        'Семейная загрузка',

    'Unsorted envelope':
        'Неразобранный конверт',

    'Pawford archive copy':
        'Копия из архива Поуфорда'
};
const RU_DATA_NOTES = {
    // Daisy parentage research
    'Who was Daisy Milkpaw’s father?':
        'Кто был отцом Дейзи Милкпоу?',

    'Research question':
        'Исследовательский вопрос',

    'Current observations':
        'Текущие наблюдения',

    'Daisy’s records place her in the Pawford area, where the Whiskerfield household appears in the available register material.':
        'Записи о Дейзи связывают её с районом Поуфорда, где в доступных реестровых материалах встречается домохозяйство Вискерфильдов.',

    'Barnaby Whiskerfield is a plausible lead, but no direct parentage statement has been found.':
        'Барнаби Вискерфильд — правдоподобная версия, но прямых сведений о родстве пока не найдено.',

    'Next steps':
        'Следующие шаги',

    'Review the father entry in the Pawford register.':
        'Проверить запись об отце в реестре Поуфорда.',

    'Compare household members and witnesses.':
        'Сопоставить членов домохозяйства и свидетелей.',

    'Record evidence both for and against the Whiskerfield connection.':
        'Зафиксировать доказательства как в пользу связи с Вискерфильдами, так и против неё.',

    'Check the Pawford register father entry':
        'Проверить запись об отце в реестре Поуфорда',

    'Compare Daisy and Whiskerfield household records':
        'Сопоставить записи о Дейзи и домохозяйстве Вискерфильдов',

    'Review additional evidence before changing relationships':
        'Проверить дополнительные доказательства перед изменением родственных связей',

    // Old Cattery burial research
    'Old Cattery burial index observations':
        'Наблюдения по указателю захоронений Олд-Кэттери',

    'The burial index contains several entries connected to the Old Cattery area.':
        'В указателе захоронений есть несколько записей, связанных с районом Олд-Кэттери.',

    'Pearl Velvetpaw’s entry is clear, but nearby entries should be checked for relatives and alternate surname spellings.':
        'Запись Пёрл Велветпоу читается ясно, но соседние записи следует проверить на родственников и варианты написания фамилий.',

    'Daisy’s connection remains indirect and should not be treated as evidence of residence without another record.':
        'Связь Дейзи остаётся косвенной и без дополнительной записи не должна считаться доказательством проживания.',

    'The index should be compared with cemetery and household records before adding new facts.':
        'Перед добавлением новых фактов указатель следует сопоставить с кладбищенскими и домовыми записями.',

    // Meowbridge transcription
    'Meowbridge record transcription':
        'Расшифровка записи из Мяубриджа',

    'Meowbridge record held with the family certificate material.':
        'Запись из Мяубриджа хранится вместе с семейными свидетельствами.',

    'Extract or transcription':
        'Выписка или расшифровка',

    'The record names Meowbridge and confirms the event location. Several handwritten details remain uncertain.':
        'В записи указан Мяубридж и подтверждено место события. Некоторые рукописные детали остаются неясными.',

    'Interpretation':
        'Интерпретация',

    'The place is consistent with other records connected to Daisy and the later Whiskerfield family.':
        'Это место согласуется с другими записями, связанными с Дейзи и более поздней семьёй Вискерфильдов.',

    'Questions':
        'Вопросы',

    'Confirm the witnesses and compare their names with household records.':
        'Подтвердить личности свидетелей и сопоставить их имена с домовыми записями.',

    // Pawford household register
    'Pawford household register notes':
        'Заметки по домовой ведомости Поуфорда',

    'The Pawford household material contains several Whiskerfield entries that may help reconstruct the family group.':
        'Материалы домохозяйств Поуфорда содержат несколько записей об Вискерфильдах, которые могут помочь восстановить состав семьи.',

    'Barnaby appears in the correct district and age range to merit further research.':
        'Барнаби встречается в подходящем районе и возрастном диапазоне, поэтому запись стоит исследовать дальше.',

    'The current scan does not establish Daisy’s relationship to the household.':
        'Текущий скан не подтверждает связь Дейзи с этим домохозяйством.',

    'Names, occupations, addresses, and witnesses should be transcribed before drawing conclusions.':
        'Перед выводами следует расшифровать имена, занятия, адреса и сведения о свидетелях.',

    'Transcribe every household member':
        'Расшифровать данные каждого члена домохозяйства',

    'Compare the recorded address with nearby events':
        'Сопоставить указанный адрес с ближайшими событиями',

    'Check the register continuation':
        'Проверить продолжение реестра',

    // Family album research
    'Whiskerfield family album context':
        'Контекст семейного альбома Вискерфильдов',

    'The family album appears to combine photographs from several Whiskerfield households.':
        'Похоже, семейный альбом объединяет фотографии нескольких семей Вискерфильдов.',

    'Silver and Luna can identify some recent photographs. Barnaby and Daisy may appear in older images, but the captions are incomplete.':
        'Сильвер и Луна могут опознать некоторые недавние фотографии. Барнаби и Дейзи, возможно, присутствуют на более старых снимках, но подписи к ним неполные.',

    'Album order, handwriting, paper type, and repeated backgrounds may help group unidentified portraits.':
        'Порядок снимков в альбоме, почерк, тип бумаги и повторяющиеся фоны могут помочь сгруппировать неопознанные портреты.',

    // Whiskerfield surname research
    'Whiskerfield surname variants':
        'Варианты фамилии Вискерфильд',

    'Searches should include likely handwriting and transcription variants of Whiskerfield.':
        'При поиске следует учитывать вероятные рукописные и транскрипционные варианты фамилии Вискерфильд.',

    'Potential differences include omitted letters, altered vowel groups, and spacing introduced by indexers.':
        'Возможны пропуски букв, изменения групп гласных и пробелы, внесённые индексаторами.',

    'Every variant should be recorded with its source rather than added as a confirmed family name automatically.':
        'Каждый вариант следует фиксировать вместе с источником, а не автоматически добавлять как подтверждённую фамилию семьи.',

    // Rupert death research
    'Rupert death details to verify':
        'Сведения о смерти Руперта для проверки',

    'Rupert Purrington’s death details are incomplete in the current family record.':
        'Сведения о смерти Руперта Пуррингтона в текущей семейной записи неполны.',

    'The available online extract may contain a matching entry, but identity has not been confirmed.':
        'Доступная онлайн-выписка может содержать подходящую запись, но личность пока не подтверждена.',

    'Check age, residence, relatives, and registration district before entering a death date.':
        'Перед внесением даты смерти проверить возраст, место жительства, родственников и регистрационный округ.',

    'Check the regional death index':
        'Проверить региональный указатель смертей',

    'Compare residence and family details':
        'Сопоставить место жительства и сведения о семье',

    // Purrington surname research
    'Purrington surname variants':
        'Варианты фамилии Пуррингтон',

    'Purrington entries may be indexed with shortened or misread letter groups.':
        'Записи Пуррингтонов могут быть проиндексированы с сокращёнными или неверно прочитанными группами букв.',

    'Search plans should include common handwriting substitutions while keeping the recorded spelling attached to each source.':
        'В план поиска следует включить типичные рукописные замены, сохраняя за каждым источником указанное в нём написание.',

    'No variant should replace the central surname without supporting evidence.':
        'Ни один вариант не должен заменять основную фамилию без подтверждающих доказательств.',

    // Marriage research
    'Silver and Luna marriage record notes':
        'Заметки о записи брака Сильвера и Луны',

    'The marriage record links Silver Whiskerfield and Luna Purrington in Meowbridge.':
        'Запись о браке связывает Сильвера Вискерфильда и Луну Пуррингтон в Мяубридже.',

    'The names and place are legible. Witness names and the exact certificate reference should be transcribed separately.':
        'Имена и место читаются ясно. Имена свидетелей и точную ссылку на свидетельство следует расшифровать отдельно.',

    'The event should remain linked to the original certificate source and scan.':
        'Событие должно оставаться связанным с источником оригинального свидетельства и его сканом.',

    // Silver checklist
    'Silver profile research checklist':
        'Контрольный список исследования профиля Сильвера',

    'Add residence sources':
        'Добавить источники о месте жительства',

    'Review context for linked photographs':
        'Проверить контекст связанных фотографий',

    'Verify event dates and places':
        'Проверить даты и места событий',

    // Luna interview
    'Family interview with Luna':
        'Семейное интервью с Луной',

    'Interview focus':
        'Тема интервью',

    'Family movement, the Whiskerfield album, and memories connected to Meowbridge.':
        'Перемещения семьи, альбом Вискерфильдов и воспоминания, связанные с Мяубриджем.',

    'Current recollections':
        'Текущие воспоминания',

    'Luna remembers family stories about movement between nearby villages and Pawford.':
        'Луна помнит семейные рассказы о переездах между соседними деревнями и Поуфордом.',

    'She may be able to identify the owner of the old family album.':
        'Возможно, она сможет установить, кому принадлежал старый семейный альбом.',

    'Follow-up questions':
        'Дополнительные вопросы',

    'Who originally kept the album?':
        'У кого первоначально хранился альбом?',

    'Which relatives lived in Meowbridge?':
        'Кто из родственников жил в Мяубридже?',

    'Did Daisy discuss siblings or parentage?':
        'Рассказывала ли Дейзи о братьях, сёстрах или родителях?',

    'Schedule a follow-up conversation':
        'Запланировать дополнительную беседу',

    'Prepare unidentified album photographs':
        'Подготовить неопознанные фотографии из альбома',

    // Pawford archive visit
    'Pawford archive visit checklist':
        'Контрольный список посещения архива Поуфорда',

    'Prepare a focused archive visit for Pawford household and register material.':
        'Подготовить целевой визит в архив для работы с домовыми и реестровыми материалами Поуфорда.',

    'Capture complete references and adjacent pages rather than isolated entries.':
        'Фиксировать полные ссылки и соседние страницы, а не отдельные записи.',

    'Record negative searches as well as useful findings.':
        'Фиксировать как безрезультатные поиски, так и полезные находки.',

    'Review the register continuation':
        'Просмотреть продолжение реестра',

    'Capture surrounding household pages':
        'Зафиксировать соседние страницы домовой книги',

    'Search surname spelling variants':
        'Проверить варианты написания фамилии',

    'Record image and folder references':
        'Зафиксировать ссылки на изображения и папки',

    // Current sample notes
    'Daisy’s birth extract: name and place to verify': 'Выписка о рождении Дейзи: проверить имя и место',
    'What the extract says': 'Что указано в выписке',
    'The sample extract names Daisy Whiskerfield, gives 03 June 1949, and lists Pawford as her birthplace.': 'В образце выписки указаны Дейзи Вискерфильд, дата 3 июня 1949 года и место рождения Поуфорд.',
    'The extract does not identify Daisy’s parents.': 'В выписке не указаны родители Дейзи.',
    'What the Tree says': 'Что указано в семейном дереве',
    'Daisy’s Tree profile records Milkpaw as her maiden name and leaves her birthplace unset. Percival Milkpaw and Nora Creamfur are already connected as her parents; Barnaby Whiskerfield is her husband.': 'В профиле Дейзи девичья фамилия — Милкпоу, а место рождения не указано. Её родители в дереве — Персиваль Милкпоу и Нора Кримфур; Барнаби Вискерфильд — её муж.',
    'To verify': 'Что проверить',
    'Find the full birth entry and check whether Whiskerfield is a later name on this extract.': 'Найти полную запись о рождении и выяснить, не добавлена ли фамилия Вискерфильд в выписку позднее.',
    'Confirm Pawford before adding it to Daisy’s birth fact.': 'Подтвердить Поуфорд, прежде чем указать его как место рождения Дейзи.',
    'Do not use this extract alone to confirm her parents.': 'Не подтверждать родителей Дейзи только по этой выписке.',
    'Find the full birth entry': 'Найти полную запись о рождении',
    'Check the surname shown on the birth extract': 'Проверить фамилию в выписке о рождении',
    'Confirm Pawford before updating the birth place': 'Подтвердить Поуфорд перед обновлением места рождения',
    'Pearl’s Old Cattery burial: source to find': 'Захоронение Пёрл в Олд-Кэттери: найти источник',
    'Pearl Softtail (née Velvetpaw) died on 02 February 2011. Her Tree profile places her death and burial in Old Cattery.': 'Пёрл Софттейл (урождённая Велветпоу) умерла 2 февраля 2011 года. В дереве местом её смерти и захоронения указан Олд-Кэттери.',
    'No burial-index file is linked to this note. Find the original entry and check its date, recorded name, and plot reference before adding further details.': 'К этой заметке не прикреплён файл указателя захоронений. Найдите оригинальную запись и проверьте дату, указанное имя и номер участка, прежде чем добавлять подробности.',
    'This archived note preserves the research trail without implying a connection to Daisy or the Pawford branch.': 'Эта архивная заметка сохраняет ход исследования и не предполагает связи с Дейзи или ветвью Поуфорда.',
    'Meowbridge marriage extract: field notes': 'Выписка о браке в Мяубридже: заметки по полям',
    'Visible on the extract': 'Что видно в выписке',
    'Bridegroom: Silver Whiskerfield. Bride: Luna Purrington.': 'Жених: Сильвер Вискерфильд. Невеста: Луна Пуррингтон.',
    'Date: 18 August 2023. Place: Meowbridge, North Yorkshire.': 'Дата: 18 августа 2023 года. Место: Мяубридж, Северный Йоркшир.',
    'Limits': 'Ограничения',
    'The sample image does not show witnesses, a certificate number, or the original register page. Leave those details blank until another record supplies them.': 'На образце не указаны свидетели и номер свидетельства; оригинальная страница реестра отсутствует. Не заполняйте эти сведения без другой записи.',
    'Keep this transcription linked to the scan; the separate marriage note tracks what the event establishes.': 'Сохраните связь этой расшифровки со сканом. В отдельной заметке о браке описано, что подтверждает запись.',
    'Pawford register index, 2004': 'Указатель реестра Поуфорда, 2004 год',
    'Four separate entries': 'Четыре отдельные записи',
    'The sample page lists Barnaby, Daisy, Silver, and Luna with birth years, Pawford as locality, and separate PW/001–PW/004 references.': 'На странице перечислены Барнаби, Дейзи, Сильвер и Луна: годы рождения, Поуфорд как местность и отдельные номера PW/001–PW/004.',
    'It is an index, not a household listing: it does not say they lived together, give an address, or state how they are related. Luna’s entry uses Purrington, which differs from her current Tree surname.': 'Это указатель, а не список одного домохозяйства: он не подтверждает совместное проживание, не даёт адреса и не указывает родство. Луна записана как Пуррингтон, а её нынешняя фамилия в дереве другая.',
    'Next step': 'Следующий шаг',
    'Use each reference to request the underlying record before treating the locality or name as a new fact.': 'По каждому номеру запросите исходную запись, прежде чем добавлять местность или имя как новый факт.',
    'Compare the index scan with page 12 and note any transcription differences.': 'Сравните скан указателя со страницей 12 и отметьте расхождения в расшифровке.',
    'Transcribe all four index entries': 'Расшифровать все четыре записи указателя',
    'Request the underlying records by reference': 'Запросить исходные записи по номерам',
    'Compare names with the index on page 12': 'Сравнить имена с указателем на странице 12',
    'Family photographs: identified and open': 'Семейные фотографии: опознанные и неустановленные',
    'Already identified': 'Уже опознаны',
    'The garden photograph is tagged with Barnaby and Daisy; the family-table photograph is tagged with Silver, Luna, and Pearl. These identifications should be checked against the originals and their captions.': 'На садовом снимке отмечены Барнаби и Дейзи; на снимке за семейным столом — Сильвер, Луна и Пёрл. Эти определения стоит сверить с оригиналами и подписями.',
    'Still open': 'Пока не установлено',
    'The studio portrait in Archive has no identified person or date. Do not assign it to a relative just because it appears with family material.': 'У студийного портрета в Архиве нет установленного человека или даты. Не приписывайте его родственнику лишь потому, что он хранился среди семейных материалов.',
    'Daisy’s 2006 letter to Luna says she was sorting family photographs. Compare that context with album order and handwritten captions before proposing an identity.': 'В письме Луне 2006 года Дейзи пишет, что разбирала семейные фотографии. Сравните этот контекст с порядком снимков в альбоме и рукописными подписями, прежде чем предлагать имя.',
    'Names across the Pawford records': 'Имена в записях Поуфорда',
    'The 2004 Pawford index lists Daisy as Whiskerfield and Luna as Purrington. Daisy’s Tree profile records Milkpaw as her maiden name; Luna’s records show Purrington before her marriage to Silver.': 'В указателе Поуфорда за 2004 год Дейзи записана как Вискерфильд, а Луна — как Пуррингтон. В дереве девичья фамилия Дейзи — Милкпоу; фамилия Луны до брака с Сильвером — Пуррингтон.',
    'A change of surname is not evidence of a spelling error. Keep each recorded form with its date and source, then compare it with the person’s life events.': 'Смена фамилии не означает ошибку написания. Сохраняйте каждую записанную форму вместе с датой и источником, затем сопоставляйте её с событиями жизни.',
    'Check whether Daisy’s birth extract was annotated or created after her marriage.': 'Проверить, не была ли выписка о рождении Дейзи дополнена или составлена после её брака.',
    'Keep Luna’s Purrington name in the 2023 marriage transcription.': 'Сохранить фамилию Пуррингтон в расшифровке записи о браке Луны за 2023 год.',
    'Rupert’s death: record search': 'Смерть Руперта: поиск записи',
    'Rupert Purrington is marked deceased in the Tree, but no death date or place is recorded. The Pawford online collection ends in 1950, before Rupert’s recorded birth in 1951, so it cannot supply his death entry.': 'Руперт Пуррингтон отмечен в дереве как умерший, но дата и место смерти не указаны. Онлайн-коллекция Поуфорда заканчивается 1950 годом, до его рождения в 1951 году, поэтому записи о его смерти в ней быть не может.',
    'Search an appropriate later death register. Compare full name, age, family members, and district before attaching a result or entering a date.': 'Ищите более поздний реестр смертей. Перед добавлением найденной записи или даты сверьте полное имя, возраст, членов семьи и округ.',
    'Find a later death register': 'Найти более поздний реестр смертей',
    'Purrington name in the marriage extract': 'Фамилия Пуррингтон в выписке о браке',
    'The 2023 marriage extract names the bride Luna Purrington. Her current Tree display name is Luna Mabel Whiskerfield, with Purrington recorded as her maiden name.': 'В выписке о браке 2023 года невеста указана как Луна Пуррингтон. Сейчас в дереве она отображается как Луна Мейбл Вискерфильд, а Пуррингтон записана как девичья фамилия.',
    'Preserve the name exactly as it appears on the dated document. This archived note is a reminder to compare names in their own time, not to treat a later surname as a transcription correction.': 'Сохраняйте имя так, как оно записано в датированном документе. Эта архивная заметка напоминает, что имена нужно сравнивать в контексте времени, а не считать позднюю фамилию исправлением расшифровки.',
    'What the extract supports': 'Что подтверждает выписка',
    'Silver Whiskerfield and Luna Purrington married on 18 August 2023 in Meowbridge, North Yorkshire. The Tree’s marriage event uses that date and place.': 'Сильвер Вискерфильд и Луна Пуррингтон поженились 18 августа 2023 года в Мяубридже, Северный Йоркшир. Эти дата и место указаны в событии брака в дереве.',
    'What it does not show': 'Чего в выписке нет',
    'The sample extract has no witness names or certificate number. Do not add those details from memory or from the wedding photograph.': 'В образце выписки нет имён свидетелей или номера свидетельства. Не добавляйте их по памяти или по свадебной фотографии.',
    'The scan documents the event; the wedding photograph provides separate visual context. The field-note transcription records the visible text.': 'Скан подтверждает событие; свадебная фотография даёт отдельный визуальный контекст. В заметке с расшифровкой записан видимый текст.',
    'Silver’s profile: next checks': 'Профиль Сильвера: что проверить',
    'Confirm Silver’s Pawford birth announcement against the original notice': 'Сверить объявление о рождении Сильвера с оригиналом',
    'Review names and dates on the linked photographs': 'Проверить имена и даты на связанных фотографиях',
    'Check the marriage event against its extract': 'Сверить событие брака с выпиской',
    'Interview context': 'Контекст интервью',
    'The source is an audio interview with Luna recorded on 02 April 2026. Luna can speak directly about her own photographs and the family album as she knew it.': 'Источник — аудиоинтервью с Луной от 2 апреля 2026 года. Луна может рассказать о собственных фотографиях и о семейном альбоме в том виде, в каком она его знала.',
    'Secondhand stories': 'Рассказы со слов других',
    'Accounts of the older Whiskerfield generations came to Luna through relatives. Record who told each story and when; do not present it as Luna’s firsthand memory.': 'О старших поколениях Вискерфильдов Луна узнала от родственников. Запишите, кто и когда рассказал каждую историю; не выдавайте её за личное воспоминание Луны.',
    'Follow-up': 'Что уточнить',
    'Ask who kept the album before Luna saw it.': 'Узнать, у кого хранился альбом до того, как его увидела Луна.',
    'Compare the people she identifies with the tagged garden photograph and Daisy’s letter about sorting photographs.': 'Сопоставить названных ею людей с отмеченными на садовом снимке и письмом Дейзи о разборе фотографий.',
    'Use the four PW references from the 2004 Pawford index to request the underlying entries. The index alone does not establish an address or family relationship.': 'По четырём номерам PW из указателя Поуфорда за 2004 год запросите исходные записи. Сам указатель не подтверждает адрес или родство.',
    'Record each full citation and adjacent page. Keep unsuccessful searches too, so the same shelf or register is not checked twice.': 'Записывайте полную ссылку на источник и соседнюю страницу. Сохраняйте и безрезультатные поиски, чтобы не проверять те же материалы повторно.',
    'Request the four underlying PW entries': 'Запросить четыре исходные записи PW',
    'Capture adjacent pages and full citations': 'Сохранить соседние страницы и полные ссылки на источники',
    'Compare the recorded names with Tree names': 'Сравнить имена в записях с именами в дереве',
    'Record image, folder, and shelf references': 'Записать номера изображений, папок и архивных полок'
};
const RU_DATA_NOTE_COLLECTIONS = {
    'Pawford research':
        'Исследование Поуфорда',

    'Records, places, and open questions connected to Pawford.':
        'Записи, места и открытые вопросы, связанные с Поуфордом.',

    'Whiskerfield family':
        'Семья Вискерфильдов',

    'Family history, surname research, and household context.':
        'История семьи, исследование фамилии и сведения о домохозяйстве.',

    'Source analysis':
        'Анализ источников',

    'Transcriptions, extracts, and interpretation of research sources.':
        'Расшифровки, выписки и интерпретация исследовательских источников.',

    'Family interviews':
        'Семейные интервью',

    'Interview preparation, recollections, and follow-up questions.':
        'Подготовка к интервью, воспоминания и дополнительные вопросы.'
};
const RU_DATA_GENEO = {
    // Collections
    'Research theory':
        'Исследовательские гипотезы',

    'Boards for hypotheses, theories and unresolved research questions.':
        'Холст для гипотез, теорий и нерешённых исследовательских вопросов.',

    'Tree design':
        'Проектирование древа',

    'Visual family-tree layouts and structural explorations.':
        'Визуальные схемы семейного древа и исследование его структуры.',

    'Publication':
        'Публикация',

    'Layouts and visual material prepared for publication.':
        'Макеты и визуальные материалы, подготовленные для публикации.',

    // Seeded board
    'Whiskerfield tree research':
        'Исследование родословной Вискерфильдов',

    'Potential Whiskerfield branch from Old Cattery':
        'Предполагаемая ветвь Вискерфильдов из Олд-Кэттери',

    'According to Barnaby, Dave had 2 children, one named Andrew. They lived in Old Cattery.':
        'По словам Барнаби, у Дейва было двое детей, одного из них звали Эндрю. Они жили в Олд-Кэттери.',

    "Barnaby mentioned a relative named Dave, who could have been Archibald's brother":
        'Барнаби рассказывал о родственнике по имени Дейв. Возможно, он был братом Арчибальда.',

    'Edith had a half-sister named Fiona':
        'У Эдит была сестра по одному из родителей по имени Фиона.',

    "Fiona's branch":
        'Ветвь Фионы',

    "Photo from Barnaby's family album - potentially showing Mackerelton sisters, daughters of Fiona":
        'Фотография из семейного альбома Барнаби: возможно, на ней сёстры Макрельтон, дочери Фионы.'
};

