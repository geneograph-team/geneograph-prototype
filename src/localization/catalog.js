function buildLocalizationMap(
    mapName,
    blocks
)
{
    const result = {};
    const owners = {};

    Object.entries(
        blocks
    ).forEach(
        ([
            blockName,
            block
        ]) =>
        {
            if (
                !block
            || typeof block !== 'object'
            || Array.isArray(block)
            )
            {
                throw new TypeError(
                    `Localization block "${blockName}" in ${mapName} must be an object.`
                );
            }

            Object.entries(
                block
            ).forEach(
                ([
                    key,
                    value
                ]) =>
                {
                    const normalizedKey =
                        String(key).trim();

                    if (!normalizedKey)
                    {
                        throw new Error(
                            `Empty localization key in ${mapName}.${blockName}.`
                        );
                    }

                    if (
                        typeof value !== 'string'
                || !value.trim()
                    )
                    {
                        throw new Error(
                            `Localization value for "${normalizedKey}" in ${mapName}.${blockName} must be a non-empty string.`
                        );
                    }

                    if (
                        Object.prototype
                            .hasOwnProperty.call(
                                result,
                                normalizedKey
                            )
                    )
                    {
                        throw new Error(
                            `Duplicate localization key "${normalizedKey}" in ${mapName}: ${owners[normalizedKey]} and ${blockName}.`
                        );
                    }

                    result[normalizedKey] =
                        value;

                    owners[normalizedKey] =
                        blockName;
                }
            );
        }
    );

    return Object.freeze(
        result
    );
}

const RU_UI_COMPLETION = {
    'Primary photo updated.': 'Основная фотография обновлена.',
    'The photo is no longer available.': 'Эта фотография больше недоступна.',
    'This person is not linked to a People profile.': 'Этот человек не связан с профилем в разделе «Люди».',
    'No coordinates recorded': 'Координаты не указаны',
    'Other places': 'Другие места',
    // Advanced genealogy date editor
    'Date details':
        'Сведения о дате',

    'Genealogy date details':
        'Сведения о генеалогической дате',

    'Close date details':
        'Закрыть сведения о дате',

    'Smart date':
        'Дата в свободной форме',

    'Date type':
        'Тип даты',

    'Calendar':
        'Календарь',

    'Day':
        'День',

    'Year':
        'Год',

    'Second day':
        'День окончания',

    'Second month':
        'Месяц окончания',

    'Second year':
        'Год окончания',

    'From':
        'С',

    'To':
        'По',

    'Apply':
        'Применить',

    'DD':
        'ДД',

    'YYYY':
        'ГГГГ',

    'Julian calendar can be stored; conversion is not implemented in this prototype.':
        'Можно сохранить дату по юлианскому календарю; преобразование календарей в этом прототипе не реализовано.',

    'Julian calendar stored; conversion is not implemented.':
        'Дата сохранена по юлианскому календарю; преобразование календарей не реализовано.',

    'about / circa':
        'около / приблизительно',

    'Enter a valid calendar date.':
        'Введите допустимую календарную дату.',

    'Enter a supported genealogy date.':
        'Введите дату в поддерживаемом генеалогическом формате.',

    'Exact dates need at least a month and year. Use Year only for year-only dates.':
        'Для точной даты укажите как минимум месяц и год. Если известен только год, выберите тип «Только год».',

    'Year only dates should contain only a year.':
        'Дата типа «Только год» должна содержать только год.',

    'Between dates need a valid second date.':
        'Для диапазона укажите допустимую вторую дату.',

    'The second date must be after or equal to the first date.':
        'Вторая дата должна быть не раньше первой.',

    'Enter a date.':
        'Введите дату.',
    'Create new place': 'Создать новое место',
    'Link is missing an ID': 'У связи отсутствует идентификатор',
    'Show person sidebar': 'Показать панель человека',
    'Person record not found.': 'Запись человека не найдена.',
    'Connect existing Archive files or add new files.': 'Установите связь с существующими файлами Архива или добавьте новые.',
    'Selected and uploaded photos will be tagged with this person.':
        'Выбранные и загруженные фотографии будут связаны с этим человеком.',
    'Add new':
        'Добавить новые',
    'Browse all project photos' : 'Все фото',
    'Upload new photo': 'Загрузить фото',
    'Add new files to Archive, then connect them to this record. File upload is simulated in this prototype.':
        'Добавьте новые файлы в Архив, затем свяжите их с этой записью. Загрузка файлов имитируется в прототипе.',
    'Tagged with this person': 'Связанные с этим человеком',
    'No photos are tagged with': 'Нет фотографий связанных с',
    'Remove current photo': 'Убрать текущее фото',
    'Not tagged': 'Не связано',
    'Current photo': 'Текущее фото',
    'Already selected':
        'Уже выбрано',
    'Drop a photo here': 'Перетащите фото сюда',
    'Upload the first photo for this project.': 'Загрузите первое фото в этот проект.',
    'No archive files linked to this person.': 'С этим человеком не связано ни одного файла.',
    'No sources linked to this person.': 'С этим человеком не связано ни одного источника.',
    'No relatives added yet': 'Родственники пока не добавлены',
    'Add a new relative or connect someone already in this project.': 'Добавьте нового родственника или свяжите человека, который уже есть в проекте.',
    'No notes linked to this person.': 'С этим человеком не связано ни одной заметки.',
    'No photos linked to this person.':'С этим человеком не связано ни одной фотографии',
    'Already linked': 'Уже связано',
    'The person is no longer available.': 'Этот человек больше недоступен.',
    'Archive item preview is simulated.': 'Предпросмотр элемента Архива имитируется в прототипе.',
    'Selected person sidebar collapsed': 'Панель выбранного человека свёрнута',
    'Unknown person': 'Неизвестный человек',
    'Cannot connect': 'Не удалось добавить родство',
    'This relationship cannot be created.': 'Эту родственную связь невозможно создать.',
    'Suggested matches': 'Возможные совпадения',
    'Could not connect these people.': 'Не удалось связать этих людей.',
    'Relationship date': 'Дата связи',
    'Relationship place': 'Место связи',
    'From place': 'Место начала',
    'To place': 'Место окончания',
    'Engagement date': 'Дата помолвки',
    'Engagement place': 'Место помолвки',
    'Selected person': 'Выбранный человек',
    'Check the relationship dates before saving.': 'Проверьте даты родственной связи перед сохранением.',
    'The relationship end date must be after or equal to the start date.': 'Дата окончания связи должна быть не раньше даты начала.',
    'Missing person': 'Человек не найден',
    'Select a person to connect.': 'Выберите человека для связи.',
    'Person not found': 'Человек не найден',
    'Invalid relationship': 'Недопустимая связь',
    'A person cannot be connected to themselves.': 'Нельзя связать человека с самим собой.',
    'Already connected': 'Родство уже указано',
    'Already connected as': 'Указанное родство',
    'Relationship loop': 'Циклическая родственная связь',
    'Add a name or at least one identifying fact before creating a person.': 'Перед созданием человека укажите имя или хотя бы один идентифицирующий факт.',
    'Check the additional facts before creating.': 'Проверьте дополнительные факты перед созданием.',
    'Check the relationship details before creating.': 'Проверьте сведения о связи перед созданием.',
    'Person created, but could not connect the relationship.': 'Человек создан, но родственную связь добавить не удалось.',
    'Person created.': 'Человек создан.',
    'Person created and connected as parent.': 'Человек создан и добавлен как родитель.',
    'Person created and connected as child.': 'Человек создан и добавлен как ребёнок.',
    'Person created and connected as sibling.': 'Человек создан и добавлен как брат или сестра.',
    'Person created and connected as partner.': 'Человек создан и добавлен как партнёр.',
    'Person created and connected as relative.': 'Человек создан и добавлен как родственник.',
    'Create a new person in this project': 'Создать нового человека в этом проекте',
    'Connect selected': 'Добавить родство',
    'Add selected': 'Добавить выбранного',
    'Open selected': 'Открыть выбранного',
    'Possible matches': 'Возможные совпадения',
    'Similar people in Family Tree': 'Похожие люди в семейном древе',
    'Enter a name, date, or place to check the Family Tree.': 'Введите имя, дату или место, чтобы проверить семейное древо.',
    'No strong matches found in the Family Tree.': 'В семейном древе не найдено достаточно близких совпадений.',
    'New person': 'Новый человек',
    'File picker will be added in a later step.': 'Выбор файла будет добавлен позже.',
    'Note picker will be added in a later step.': 'Выбор заметки будет добавлен позже.',
    'Attachment picker will be added in a later step.': 'Выбор вложения будет добавлен позже.',
    'Remove relationship?':
        'Удалить родственную связь?',
    'This changes the relationship only. People records will remain in the project.':
        'Изменится только родственная связь. Записи людей останутся в проекте.',
    'Unlink relationship':
        'Удалить связь',
    'Manage relationships': 'Управление связями',
    'Connected through shared parents': 'Связаны через общих родителей',
    'Shared parent connection': 'Связь через общего родителя',
    'Siblings share at least one parent. Review a parent connection below to change this.': 'У братьев и сестёр есть хотя бы один общий родитель. Чтобы изменить эту связь, выберите родителя ниже.',
    'Changing a parent connection may also affect other siblings.': 'Изменение связи с родителем может затронуть и других братьев и сестёр.',
    'Unsaved relationship changes will be lost.': 'Несохранённые изменения родственной связи будут потеряны.',
    'Children connected through this relationship':
        'Дети, связанные через эту родственную связь',
    'Choose which parent should keep the children after unlinking.':
        'Выберите родителя, с которым останутся дети после удаления связи.',
    'Relationship information is missing.': 'Сведения о родственной связи отсутствуют.',
    'Relationship record not found.': 'Запись родственной связи не найдена.',
    'This parent-child relationship has already been removed.': 'Эта связь родителя и ребёнка уже удалена.',
    'Relationship unlinked.': 'Родственная связь удалена.',
    'Choose which parent should keep the children.': 'Выберите родителя, с которым останутся дети.',
    'Sibling relationships come from shared parents. Remove or edit parent-child links instead.': 'Связи братьев и сестёр определяются общими родителями. Измените или удалите связь родителя и ребёнка.',
    'Unsupported relationship type.': 'Неподдерживаемый тип родственной связи.',
    'Choose parent to keep children': 'Выберите родителя, с которым останутся дети',
    'This will remove the selected relationship. No person will be deleted.': 'Выбранная связь будет удалена. Люди удалены не будут.',
    'Relationship cannot be unlinked.': 'Не удалось удалить родственную связь.',
    'Relationship could not be unlinked.': 'Не удалось удалить родственную связь.',
    'Sibling relationships are derived from shared parents.': 'Связи братьев и сестёр определяются общими родителями.',
    'Relationship updated.': 'Родственная связь обновлена.',
    'Relationship cannot be edited.': 'Эту родственную связь нельзя изменить.',
    'Select a possible match first.': 'Сначала выберите возможное совпадение.',
    'Check the relationship details before connecting.': 'Проверьте сведения о связи перед добавлением.',
    'Could not connect the selected match.': 'Не удалось добавить родственную связь с выбранным человеком.',
    'Cancel removing fact': 'Отменить удаление факта',
    'Enter a short name for this fact.': 'Введите краткое название факта.',
    'Enter a name for the custom fact.': 'Введите название пользовательского факта.',
    'Check the custom fact date before saving.': 'Проверьте дату пользовательского факта перед сохранением.',
    'Add a value, date, place, or note.': 'Добавьте значение, дату, место или примечание.',
    'Add some information to the custom fact.': 'Добавьте сведения в пользовательский факт.',
    'Check the education dates before saving.': 'Проверьте даты образования перед сохранением.',
    'Check the occupation dates before saving.': 'Проверьте даты работы перед сохранением.',
    'Check the baptism date before saving.': 'Проверьте дату крещения перед сохранением.',
    'Person record was not found.': 'Запись человека не найдена.',
    'Check the additional facts before saving.': 'Проверьте дополнительные факты перед сохранением.',
    'Check the relationship details before saving.': 'Проверьте сведения о связи перед сохранением.',
    'Check the birth date before saving.': 'Проверьте дату рождения перед сохранением.',
    'Check the death date before saving.': 'Проверьте дату смерти перед сохранением.',
    'Person updated.': 'Сведения о человеке обновлены.',
    'Previous page': 'Предыдущая страница',
    'Next page': 'Следующая страница',
    'Remove filter': 'Удалить фильтр',
    'Living person protected': 'Данные живущего человека защищены',
    'Standard record': 'Обычная запись',
    'No photos yet': 'Фотографий пока нет',
    'No notes yet': 'Заметок пока нет',
    'Research note': 'Исследовательская заметка',
    'No places linked': 'Связанных мест нет',
    'Check the education start date before saving.': 'Проверьте дату начала обучения перед сохранением.',
    'Check the education end date before saving.': 'Проверьте дату окончания обучения перед сохранением.',
    'Check the work start date before saving.': 'Проверьте дату начала работы перед сохранением.',
    'Check the work end date before saving.': 'Проверьте дату окончания работы перед сохранением.',
    'Close custom fact dialog': 'Закрыть окно пользовательского факта',
    'Check the custom fact before saving.': 'Проверьте пользовательский факт перед сохранением.',
    'Custom fact updated.': 'Пользовательский факт обновлён.',
    'Custom fact added.': 'Пользовательский факт добавлен.',
    'This person is not currently shown in the sample Family Tree.': 'Этот человек сейчас не отображается в демонстрационном семейном древе.',
    'Person deleted.': 'Человек удалён.',
    'No matching project photos.': 'Подходящих фотографий проекта не найдено.',
    'Project photo scope': 'Область фотографий проекта',
    'Drag to reposition photo': 'Перетащите фотографию, чтобы изменить её положение',
    'Photo zoom': 'Масштаб фотографии',
    'Avatar previews': 'Предпросмотр аватара',
    'File cannot be read.': 'Не удалось прочитать файл.',
    'File cannot be read as an image.': 'Не удалось прочитать файл как изображение.',
    'Unsupported file type. Choose a JPEG, PNG, or WebP image.': 'Неподдерживаемый тип файла. Выберите изображение JPEG, PNG или WebP.',
    'Photo has invalid or missing image dimensions.': 'Размеры фотографии отсутствуют или недопустимы.',
    'One file could not be added:': 'Не удалось добавить один файл:',
    'One or more uploaded photos are no longer valid. Remove them and choose the files again.': 'Одна или несколько загруженных фотографий больше недоступны. Удалите их и выберите файлы заново.',
    'No valid photos were added.': 'Не добавлено ни одной подходящей фотографии.',
    'The uploaded photo is no longer valid. Choose it again.': 'Загруженная фотография больше недоступна. Выберите её заново.',
    'The photo is no longer available for this person.': 'Эта фотография больше недоступна для данного человека.',
    'The photo could not be prepared for adjustment.': 'Не удалось подготовить фотографию к настройке.',
    'File name': 'Имя файла',
    'File format': 'Формат файла',
    'File size': 'Размер файла',
    'No caption.': 'Подпись отсутствует.',
    'Selected photo': 'Выбранная фотография',
    'No photos match this search.': 'По этому запросу фотографии не найдены.',
    'This project has no photos yet.': 'В этом проекте пока нет фотографий.',
    'No description': 'Без описания',
    'Linked to Family Tree with board changes': 'Связано с семейным древом, есть изменения на холсте',
    'Linked to Family Tree': 'Связано с семейным древом',
    'Board import is a placeholder in this iteration. Real .ggboard import will be added later.': 'Импорт холста в этой версии имитируется. Поддержка файлов .ggboard будет добавлена позже.',
    'No boards match this search.': 'По этому запросу холсты не найдены.',
    'Collections keep related boards together.': 'Коллекции помогают объединять связанные холсты.',
    'Update the collection name and description. Boards stay in this collection.': 'Измените название и описание коллекции. Холсты останутся в этой коллекции.',
    'Collection deleted. Boards kept.': 'Коллекция удалена. Холсты сохранены.',
    'Board archived.': 'Холст перемещен в архив.',
    'Board unarchived.': 'Холст восстановлен из архива.',
    'Board collection is missing an ID': 'У коллекции досок отсутствует идентификатор',
    'No source': 'Без источника',
    'Unable to restore Geneograph history': 'Не удалось восстановить историю Генеографа',
    'Pencil stroke': 'Штрих карандаша',
    'Title text': 'Текст заголовка',
    'Suggested board colors': 'Предлагаемые цвета холста',
    'Delete selected': 'Удалить выбранное',
    'Freeform size · Hold Shift to preserve ratio': 'Свободный размер · Удерживайте Shift для сохранения пропорций',
    'Write a note…': 'Введите заметку…',
    'Enter text…': 'Введите текст…',
    'Drag on empty canvas to draw a panel.': 'Перетащите указатель по пустому холсту, чтобы нарисовать панель.',
    'Click empty canvas or a panel to place a sticky note.': 'Щёлкните по пустому холсту или панели, чтобы разместить стикер.',
    'Click empty canvas or a panel to place a text block.': 'Щёлкните по пустому холсту или панели, чтобы разместить текстовый блок.',
    'New panel': 'Новая панель',
    'Place object updated.': 'Объект места обновлён.',
    'Place added to board.': 'Место добавлено на холст.',
    'Place is now board-only.': 'Место теперь существует только на холсте.',
    'The original person card is no longer available.': 'Исходная карточка человека больше недоступна.',
    'Board person updated.': 'Человек на холсте обновлён.',
    'Person added to board.': 'Человек добавлен на холсте.',
    'No images selected': 'Изображения не выбраны',
    'Drop an image here': 'Перетащите изображение сюда',
    'Add more images': 'Добавить ещё изображения',
    'Drop images here': 'Перетащите изображения сюда',
    'Choose image': 'Выбрать изображение',
    'Choose more images': 'Выбрать ещё изображения',
    'Choose images': 'Выбрать изображения',
    'Image replaced.': 'Изображение заменено.',
    'Link person': 'Связать человека',
    'No person selected': 'Человек не выбран',
    'Family Tree link changed.': 'Связь с семейным древом изменена.',
    'Person linked to Family Tree.': 'Человек связан с семейным древом.',
    'Choose two connection points.': 'Выберите две точки связи.',
    'An item cannot connect to itself.': 'Объект нельзя связать с самим собой.',
    'That family is no longer available.': 'Эта семья больше недоступна.',
    'That child already belongs to this family.': 'Этот ребёнок уже входит в эту семью.',
    'This relationship would create an ancestry cycle.': 'Эта связь создаст цикл в родословной.',
    'Direct ancestors cannot be siblings.': 'Прямые предки не могут быть братьями или сёстрами.',
    'That sibling relationship already exists.': 'Такая связь братьев или сестёр уже существует.',
    'Direct ancestors cannot be partners.': 'Прямые предки не могут быть партнёрами.',
    'That partner relationship already exists.': 'Такая партнёрская связь уже существует.',
    'That parent-child relationship already exists.': 'Такая связь родителя и ребёнка уже существует.',
    'Use side ports for partners and vertical ports for parent-child relationships.': 'Для партнёров используйте боковые точки, а для связей родителя и ребёнка — вертикальные.',
    'These points cannot be connected.': 'Эти точки нельзя соединить.',
    'That connection already exists.': 'Такая связь уже существует.',
    'Connect as partners': 'Связать как партнёров',
    'Connect as siblings': 'Связать как братьев или сестёр',
    '{parent} is parent of {child}': '{parent} — родитель {child}',
    'Add {child} to this family': 'Добавить {child} в эту семью',
    'Connection created.': 'Связь создана.',
    'The relationship could not be updated.': 'Не удалось обновить родственную связь.',
    'Relationship details updated.': 'Сведения о родственной связи обновлены.',
    'Export Geneograph board': 'Экспортировать холст Генеографа',
    'Person unlinked from Family Tree.': 'Связь человека с семейным древом удалена.',
    'No files linked.': 'Связанных файлов нет.',
    'This file is no longer linked.': 'Этот файл больше не связан.',
    'The file could not be unlinked.': 'Не удалось удалить связь с файлом.',
    'File unlinked from person.': 'Связь файла с человеком удалена.',
    'Genealogy event': 'Генеалогическое событие',
    'Enter a file name before saving.': 'Введите имя файла перед сохранением.',
    'No file links were added.': 'Связи с файлами не добавлены.',
    'Create a new destination folder': 'Создать новую папку назначения',
    'Archive files support one place': 'Файл Архива может быть связан только с одним местом',
    'File not found': 'Файл не найден',
    'Linked record not found': 'Связанная запись не найдена',
    'Records belong to different projects': 'Записи принадлежат разным проектам',
    'Relationships were not written': 'Связи не были сохранены',
    'No notes were linked.': 'Заметки не были связаны.',
    'Set file place': 'Указать место файла',
    'Set place for files': 'Указать место для файлов',
    'for every selected file.': 'для каждого выбранного файла.',
    'This place is already linked': 'Это место уже связано',
    'Select one place': 'Выберите одно место',
    'The place could not be linked to every file.': 'Не удалось связать место с каждым файлом.',
    'File place updated.': 'Место файла обновлено.',
    'No links were added.': 'Связи не добавлены.',
    'The link could not be removed.': 'Не удалось удалить связь.',
    'Link removed.': 'Связь удалена.',
    'Opening the original file is simulated.': 'Открытие исходного файла имитируется в прототипе.',
    'Person record': 'Запись человека',
    'Place record': 'Запись места',
    'Event record': 'Запись события',
    'This event has no valid person owner.': 'У этого события нет действительного владельца.',
    'Text formatting': 'Форматирование текста',
    'Rich text': 'Форматированный текст',
    'Default text color': 'Цвет текста по умолчанию',
    'No highlight': 'Без выделения',
    'Paste or enter a URL': 'Вставьте или введите URL',
    'Link URL': 'URL ссылки',
    'Select text before adding a link.': 'Перед добавлением ссылки выделите текст.',
    'Rich text is unavailable. Note opened in plain-text mode.': 'Форматированный текст недоступен. Заметка открыта в режиме обычного текста.',
    'No files linked to this note.': 'С этой заметкой не связано ни одного файла.',
    'No people linked to this note.': 'С этой заметкой не связано ни одного человека.',
    'No events linked to this note.': 'С этой заметкой не связано ни одного события.',
    'No photos linked to this note.': 'С этой заметкой не связано ни одного фото.',
    'No places linked to this note.': 'С этой заметкой не связано ни одного места.',
    'No sources linked to this note.': 'С этой заметкой не связано ни одного источника.',
    'Remove photo link': 'Удалить связь с фотографией',
    'Add to collections': 'Добавить в коллекции',
    'Close add to collection dialog': 'Закрыть окно добавления в коллекции',
    'A collection with this name already exists.': 'Коллекция с таким названием уже существует.',
    'Close add people dialog': 'Закрыть окно добавления людей',
    'People to add': 'Добавляемые люди',
    'No people were linked.': 'Люди не были связаны.',
    'Close add places dialog': 'Закрыть окно добавления мест',
    'Find places': 'Найти места',
    'Name or historical name': 'Название или историческое название',
    'New place': 'Новое место',
    'Save places': 'Сохранить места',
    'Select place:': 'Выбрать место:',
    'Historical name:': 'Историческое название:',
    'No places yet': 'Пока нет мест',
    'Create a place before linking it.': 'Создайте место, прежде чем связывать его.',
    'No places match this search': 'По запросу места не найдены',
    'Try another place name or historical name.': 'Попробуйте другое название места или историческое название.',
    '{count} place selected': 'Выбрано мест: {count}',
    '{count} places selected': 'Выбрано мест: {count}',
    'Suggested places': 'Предлагаемые места',
    'Close add events dialog': 'Закрыть окно добавления событий',
    'No events were linked.': 'События не были связаны.',
    'Search records': 'Поиск записей',
    'Search records...': 'Поиск записей...',
    'The relationship will appear in both notes.': 'Связь появится в обеих заметках.',
    'Already related': 'Уже связано',
    'Added to favourites.': 'Добавлено в избранное.',
    'Removed from favourites.': 'Удалено из избранного.',
    'Removed from collection.': 'Удалено из коллекции.',
    'New checklist item': 'Новый пункт списка',
    'Relationship removed from both notes.': 'Связь удалена из обеих заметок.',
    'Map library unavailable': 'Библиотека карты недоступна',
    'Leaflet could not be loaded. The place list and editor remain available.': 'Не удалось загрузить Leaflet. Список и редактор мест остаются доступными.',
    'Map configuration required': 'Требуется настройка карты',
    'Add a protected MapTiler browser key to window.GENEOGRAPH_CONFIG.maptilerKey.': 'Добавьте защищённый браузерный ключ MapTiler в window.GENEOGRAPH_CONFIG.maptilerKey.',
    'Needs attention': 'Требует внимания',
    'No mapped places': 'Нет мест на карте',
    'Add coordinates to a place to show it on the map.': 'Добавьте координаты места, чтобы показать его на карте.',
    'Other fact': 'Другой факт',
    'Other event': 'Другое событие',
    'Active Places filters': 'Активные фильтры мест',
    'Place filters cleared.': 'Фильтры мест очищены.',
    'This place is not on the map': 'Это место не отмечено на карте',
    'Saved filter': 'Сохранённый фильтр',
    'Clipboard unavailable': 'Буфер обмена недоступен',
    'Unknown size': 'Размер неизвестен',
    'Just now': 'Только что',
    'Unknown parents': 'Неизвестные родители',
    'Archive clerk': 'Архивный служащий',
    'Pawford records room': 'Хранилище документов Поуфорда',
    'Sample occupation fact kept on the centralized person record.': 'Демонстрационный факт о работе хранится в центральной записи человека.',
    'e.g. Old Cattery, England': 'Например, Олд-Кэттери, Англия',
    'e.g. 12 Jun 2025': 'Например, 12 июн. 2025',
    'e.g. Silver': 'Например, Сильвер',
    'e.g. Whiskerfield': 'Например, Вискерфильд',
    'e.g. Purrington': 'Например, Пуррингтон',
    'e.g. Milkpaw': 'Например, Милкпоу',
    'Add person': 'Добавить человека',
    'Edit person': 'Изменить человека',
    'All Whiskerfield surname records.': 'Все записи, связанные с фамилией Вискерфильд.',
    'People and records connected to Meowbridge.': 'Люди и записи, связанные с Мяубриджем.',
    'Birth Date': 'Дата рождения',
    'Birth Place': 'Место рождения',
    'Death Date': 'Дата смерти',
    'Death Place': 'Место смерти',
    'Burial Place': 'Место захоронения',
    'Added recently': 'Добавлено недавно',
    'Edit custom fact': 'Изменить пользовательский факт',
    'Add custom fact': 'Добавить пользовательский факт',
    'Custom filters': 'Пользовательские фильтры',
    'Optional description': 'Необязательное описание',
    'This person': 'Этот человек',
    'Photo source': 'Источник фотографии',
    'Adjust photo': 'Настроить фотографию',
    'Choose photo': 'Выбрать фотографию',
    'Uploaded photo': 'Загруженная фотография',
    'Untitled photo': 'Фотография без названия',
    'Remove upload': 'Удалить загрузку',
    'Add more photos': 'Добавить ещё фотографии',
    'Drop photos here': 'Перетащите фотографии сюда',
    'Choose photos': 'Выбрать фотографии',
    'Remove upload': 'Удалить загруженную фотографию',
    'Close add photos dialog': 'Закрыть окно добавления фотографий',
    'Upload new photos': 'Загрузить новые фотографии',
    'Untitled collection': 'Коллекция без названия',
    'e.g. Pawford research': 'Например, Исследование Поуфорда',
    'Collection created.': 'Коллекция создана.',
    'Edit collection': 'Изменить коллекцию',
    'Collection updated.': 'Коллекция обновлена.',
    'Deep moss': 'Глубокий мох',
    'Archive blue': 'Архивный синий',
    'Geneograph green': 'Зелёный Генеографа',
    'Conflict red': 'Красный конфликта',
    'Uploaded image': 'Загруженное изображение',
    'Project photo': 'Фотография проекта',
    'Untitled board': 'Холст без названия',
    'Sticky note content': 'Содержимое стикера',
    'Text block content': 'Содержимое текстового блока',
    'Sticky note formatting': 'Форматирование стикера',
    'New text': 'Новый текст',
    'Choose a different image': 'Выбрать другое изображение',
    'Archive file': 'Файл Архива',
    'Untitled file': 'Файл без названия',
    'Unlink file': 'Удалить связь с файлом',
    'Add people': 'Добавить людей',
    'Person profile': 'Профиль человека',
    'Add events': 'Добавить события',
    'Add notes': 'Добавить заметки',
    'Add places': 'Добавить места',
    'Archive files': 'Файлы Архива',
    'Add event': 'Добавить событие',
    'Not specified': 'Не указано',
    'File source': 'Источник файла',
    'Search Archive files': 'Поиск файлов Архива',
    'Add new files': 'Добавить новые файлы',
    'Folder created.': 'Папка создана.',
    'Untitled folder': 'Папка без названия',
    'Selected files': 'Выбранные файлы',
    'Remove link': 'Удалить связь',
    'The file is no longer available.': 'Этот файл больше недоступен.',
    'Remove place': 'Удалить место',
    'Remove from selection': 'Убрать из выбранного',
    'Create note': 'Создать заметку',
    'Add related notes': 'Добавить связанные заметки'
};

const RU_TOUR_CARD_COPY = Object.freeze({
    'welcome': { title: "История семьи перед вами", body: "Познакомьтесь с примером семейного проекта в восьми связанных разделах. К любому разделу можно перейти сразу, нажав на название раздела в верхней части экскурсионной карточки." },
    'tour-navigation-intro': { title: "Как пройти экскурсию", body: "Кнопки «Назад» и «Далее» ведут по шагам. Через «Обзор разделов» сверху можно перейти сразу к нужному разделу. Если закрыть экскурсию, откройте «Справка» и выберите «Пройти экскурсию», чтобы начать заново." },
    'projects-welcome': { title: "Добро пожаловать в раздел «Проекты»", body: "Проекты объединяют семейное древо, фотографии, документы и заметки в одном рабочем пространстве. Здесь начинается исследование семейной истории." },
    'projects-actions': { title: "Создайте или откройте проект", body: "«Создать древо» открывает пустой проект. Импорт GEDCOM и добавление существующего проекта в демоверсии недоступны." },
    'projects-continue': { title: "Продолжите работу", body: "Вернитесь к последнему открытому проекту и разделу." },
    'projects-card': { title: "Откройте пример проекта", body: "Карточка «Семейное древо Вискерфильдов» знакомит с примером проекта. Откройте его, чтобы изучить материалы исследования." },
    'projects-hero': { title: "Обзор проекта", body: "В верхней части страницы собраны название и описание проекта, его статус, даты и кнопки основных действий." },
    'projects-tags': { title: "Исследование в цифрах", body: "Здесь показано, сколько в проекте людей, фотографий, файлов и заметок." },
    'projects-back': { title: "Все проекты", body: "Пункт «Все проекты» в разделе «Навигация» открывает список проектов. Изменения сохраняются автоматически." },
    'projects-tabs': { title: "Переходите между разделами", body: "Вкладки сверху открывают связанные разделы проекта. Экскурсия продолжится в семейном древе." },
    'tree-welcome': { title: "Добро пожаловать в «Семейное древо»", body: "Изучайте разные поколения семьи, узнавайте, как люди связаны друг с другом, и исследуйте разные ветви семейного древа." },
    'tree-person-card': { title: "Познакомьтесь с человеком в древе", body: "В карточке показаны его фото, имя и основные даты жизни. Выберите человека, чтобы узнать о нём больше." },
    'tree-focus-switch': { title: "Исследуйте другую ветвь", body: "Нажмите «Фокус» у другого человека, чтобы увидеть его ветвь древа." },
    'tree-navigation': { title: "Найти человека", body: "Откройте список людей, чтобы вернуться к недавно выбранным или найти любого человека в проекте." },
    'tree-sidebar': { title: "Подробнее о человеке", body: "Справа можно подробнее узнать о выбранном человеке, не покидая семейное древо." },
    'tree-sidebar-hero': { title: "Краткий обзор", body: "В верхней части панели собраны фото, имя, сведения о жизни и ссылка на полный профиль." },
    'tree-sidebar-actions': { title: "Быстрые действия", body: "Измените сведения, добавьте родственника или создайте родственную связь с существующим в проекте человеком." },
    'tree-quick-edit-button': { title: "Редактирование", body: "Кнопка «Изменить» открывает окно с данными человека прямо в семейном древе." },
    'tree-quick-edit-modal': { title: "Измените сведения о человеке", body: "Здесь можно изменить имя и события жизни. Изменения вступят в силу после сохранения." },
    'tree-add-relative': { title: "Добавьте или присоедините родственника", body: "Выберите родственную связь, затем добавьте нового человека или присоедините существующего из проекта." },
    'tree-sections-overview': { title: "Изучите связанные сведения", body: "Раскройте секции с подсказками, событиями, родственными связями, фото, файлами, заметками, источниками и сведениями о записи." },
    'tree-timeline': { title: "Проследите историю жизни", body: "Взгляните на жизнь человека в разделе «Хронология», где события жизни расположены по датам." },
    'tree-relationships': { title: "Изучите родственные связи", body: "Здесь показаны родители, партнёр и дети выбранного человека. Вы можете изменить связь с родственником или удалить её, не удаляя записи о людях." },
    'tree-relationship-actions': { title: "Измените или удалите связь", body: "Наведите курсор на родственника, чтобы увидеть кнопки изменения и удаления связи. Изменение обновляет родственную связь, а удаление разрывает её, не удаляя ни одного человека." },
    'tree-to-people': { title: "Изучите людей проекта", body: "Откройте раздел «Люди», чтобы просмотреть весь список людей, или сразу перейдите в профиль выбранного человека из правой панели." },
    'people-welcome': { title: "Добро пожаловать в раздел «Люди»", body: "Здесь собраны люди проекта, их родственные связи и сведения, из которых складываются их истории." },
    'people-navigation': { title: "Навигация", body: "В разделе «Люди» можно просмотреть список всех людей, а в «Профиле» — подробно изучить выбранного человека." },
    'people-table': { title: "Просмотрите список людей", body: "Ищите и сортируйте людей проекта по основным сведениям о жизни." },
    'people-columns': { title: "Настройте столбцы", body: "Оставьте в списке нужные сведения, а лишние столбцы скройте." },
    'people-filters': { title: "Отфильтруйте нужных людей", body: "Находите людей по именам, датам, местам и другим сведениям." },
    'people-save-filter': { title: "Сохраните фильтр", body: "Фильтр по фамилии приведён как пример. Кнопка «Сохранить фильтр» позволит вернуться к этой подборке позже." },
    'people-saved-filters': { title: "Откройте сохранённые фильтры", body: "Сохранённые фильтры находятся слева. Здесь их можно открыть или изменить." },
    'people-to-profile': { title: "Откройте полный профиль", body: "Выберите «Профиль» слева или нажмите «Просмотреть профиль» в правой панели, чтобы узнать больше о выбранном человеке." },
    'people-profile-welcome': { title: "Что находится в профиле", body: "Профиль объединяет сведения о жизни человека и связанные материалы исследования." },
    'people-profile-hero': { title: "Обзор профиля", body: "В верхней части показаны фотография, имя, основные сведения о жизни и доступные действия." },
    'people-profile-card': { title: "Изучите сведения в профиле", body: "Основная информация о человеке разделена на четыре удобные вкладки." },
    'people-connected': { title: "Изучите связанные материалы", body: "Просматривайте фотографии, архивные файлы, места и заметки, связанные с этим человеком." },
    'people-to-geneograph': { title: "Перейдите в раздел «Генеограф»", body: "Далее посмотрите, как можно визуализировать материалы исследования." },
    'geneograph-welcome': { title: "Добро пожаловать в раздел «Генеограф»", body: "Используйте холсты, чтобы визуализировать исследования, объединять данные и развивать идеи." },
    'geneograph-navigation': { title: "Навигация по холстам", body: "Используйте меню навигации, чтобы открыть все холсты, избранное, холсты вне коллекций или архивные работы." },
    'geneograph-collections': { title: "Упорядочьте холсты по коллекциям", body: "Объединяйте холсты в коллекции, не меняя их содержимое." },
    'geneograph-create-actions': { title: "Создайте холст", body: "Создайте здесь новый холст или импортируйте редактируемый файл .ggboard, чтобы продолжить работу с сохранённым холстом." },
    'geneograph-create-modal': { title: "Настройте новый холст", body: "Укажите название, при желании добавьте описание и добавьте его в коллекции." },
    'geneograph-card': { title: "Откройте пример холста", body: "Карточка показывает пример холста и сведения о нём. Откройте его, чтобы познакомиться с редактором." },
    'geneograph-editor-welcome': { title: "Изучите редактор холста", body: "Размещайте людей, связи и материалы исследования так, как удобно вам." },
    'geneograph-all-boards': { title: "Вернитесь ко всем холстам", body: "Кнопка «Все холсты» открывает библиотеку. Изменения сохраняются автоматически." },
    'geneograph-current-board': { title: "Сведения о холсте", body: "Здесь показано название холста. Нажмите «Изменить холст», чтобы изменить название, описание или коллекции." },
    'geneograph-layers': { title: "Найдите и настройте элементы", body: "Ищите объекты и связи в общем списке. Используйте фильтр или найдите элемент на холсте." },
    'geneograph-objects': { title: "Взгляните на холст", body: "Здесь уже размещены несколько элементов, включая панель и карточки людей." },
    'geneograph-topbar': { title: "Панель инструментов", body: "Панель инструментов помогает перемещаться по холсту и добавлять нужные элементы." },
    'geneograph-modes': { title: "Выделяйте, перемещайтесь, рисуйте", body: "Переключайтесь между выделением объектов, перемещением по холсту и рисованием карандашом." },
    'geneograph-connect': { title: "Соединяйте объекты", body: "Проводите сплошные или пунктирные линии между объектами, чтобы связать их." },
    'geneograph-person': { title: "Добавьте человека", body: "Люди — основа семейного древа. Добавьте человека на холст и свяжите его с другими объектами или людьми." },
    'geneograph-other-objects': { title: "Добавьте визуальный контекст", body: "Используйте дополнительные элементы, чтобы нагляднее показать связи и идеи." },
    'geneograph-sockets-intro': { title: "Как устроены связи", body: "У каждого объекта четыре точки соединения: сверху, справа, снизу и слева. Линии крепятся к ним, поэтому связи сохраняются при перемещении объектов на холсте." },
    'geneograph-sockets-partners': { title: "Соедините партнёров", body: "Для связи партнёров используйте левую и правую точки. По выбранным точкам система определяет тип связи, поэтому другие точки создадут связь другого типа." },
    'geneograph-sockets-children': { title: "Соедините родителей и детей", body: "Соедините нижнюю точку одного человека с верхней точкой другого, чтобы создать связь «родитель-ребёнок». Человек сверху станет родителем. То же правило действует при соединении от точки между партнёрами." },
    'geneograph-sockets-context': { title: "Свяжите материалы исследования", body: "Изображения, заметки и другие элементы можно соединять друг с другом через любую точку." },
    'geneograph-inspector': { title: "Настройте холст и объекты", body: "Используйте эту панель для настройки холста. Когда вы выбираете объект, здесь появляются настройки этого объекта." },
    'geneograph-export': { title: "Экспортируйте холст", body: "Выберите «Редактируемый файл холста», чтобы сохранить копию .ggboard, которую позже можно импортировать и редактировать. «Изображение PNG» сохраняет только картинку. В этой демонстрации после изменений нужно экспортировать холст снова, чтобы они сохранились после перезагрузки." },
    'geneograph-to-albums': { title: "Перейдите к разделу «Альбомы»", body: "Далее посмотрите, как фотографии дополняют семейное исследование." },
    'albums-welcome': { title: "Добро пожаловать в раздел «Альбомы»", body: "Изучайте фотографии проекта, собирайте их в альбомы и добавляйте сведения, которые помогают раскрыть историю каждого снимка." },
    'albums-photos': { title: "Изучите фотографии", body: "Выберите снимок, чтобы увидеть изображение и сведения о нём." },
    'albums-navigation': { title: "Просматривайте фотографии", body: "Используйте панель навигации, чтобы переходить между всеми фотографиями, избранным и снимками, ещё не добавленными в альбом." },
    'albums-albums': { title: "Собирайте фотографии в альбомы", body: "Откройте существующий альбом или создайте новый с помощью кнопки «+»." },
    'albums-filters': { title: "Отберите фотографии", body: "Используйте фильтры, чтобы сузить список и быстрее находить нужные снимки." },
    'albums-summary': { title: "Изучите сведения о фотографии", body: "Используйте правую панель, чтобы рассмотреть выбранный снимок и узнать о нём больше." },
    'albums-actions': { title: "Управляйте фотографией", body: "Используйте эти элементы управления, чтобы изменять данные выбранного снимка и управлять им." },
    'albums-connections': { title: "Люди на фотографии", body: "Здесь показаны отмеченные на снимке люди. Наведите курсор на имя, чтобы увидеть этого человека на фотографии." },
    'albums-tag-person-modal': { title: "Отметьте людей на фото", body: "Выберите человека, чтобы сразу добавить его на фото. При необходимости отметьте область прямо в просмотре." },
    'albums-add-to-album-action': { title: "Альбомы этой фотографии", body: "Посмотрите, в какие альбомы добавлена фотография, добавьте её в другой альбом или удалите из текущего." },
    'albums-add-to-album': { title: "Выберите альбом", body: "Добавьте фотографию в существующий альбом или создайте новый." },
    'albums-to-archive': { title: "Перейдите в архив", body: "Далее перейдите в архив, чтобы познакомиться с файлами и источниками вашего исследования." },
    'archive-welcome': { title: "Добро пожаловать в раздел «Архив»", body: "Храните и упорядочивайте файлы исследования в одном месте и связывайте их с людьми, к которым они относятся." },
    'archive-navigation': { title: "Навигация по архиву", body: "Слева можно открыть все файлы, избранное и источники." },
    'archive-folders': { title: "Организуйте файлы по папкам", body: "Создавайте собственную структуру папок и перемещайтесь по ней с помощью дерева папок." },
    'archive-location': { title: "Переходите между папками", body: "Путь показывает текущую папку. Для перехода используйте кнопки «Назад», «Вперёд», «Вверх» или нажмите на элемент пути." },
    'archive-table': { title: "Просматривайте содержимое папок", body: "В основной области показаны папки и файлы текущего раздела архива. Открывайте папки и выбирайте файлы, чтобы изучить их." },
    'archive-filters': { title: "Фильтруйте файлы", body: "Используйте фильтры, чтобы сузить список и быстрее находить нужные материалы." },
    'archive-folder-actions': { title: "Создайте папку", body: "Создать папку можно слева или кнопкой сверху. Кнопка справа создаст новую папку в текущем разделе." },
    'archive-folder-modal': { title: "Укажите название и расположение", body: "Введите название и выберите расположение папки. Новая папка появится после подтверждения." },
    'archive-inspector': { title: "Сведения о файле", body: "Выберите файл, чтобы посмотреть сведения о нём на правой панели." },
    'archive-file-actions': { title: "Действия с файлом", body: "Панель инструментов помогает изменять выбранный файл и управлять им в архиве." },
    'archive-to-notes': { title: "Перейдите к заметкам", body: "Далее посмотрите, как можно сохранять мысли и вопросы в процессе работы над исследованием." },
    'notes-welcome': { title: "Добро пожаловать в раздел «Заметки»", body: "Используйте заметки, чтобы развивать исследование, записывать мысли и связывать идеи с нужными записями." },
    'notes-navigation': { title: "Навигация по заметкам", body: "Переходите между всеми заметками, избранным и архивом с помощью панели навигации." },
    'notes-collections': { title: "Создавайте коллекции заметок", body: "Объединяйте связанные заметки по темам или любому удобному для вас принципу." },
    'notes-list-example': { title: "Просматривайте заметки в списке", body: "В каждой карточке видны заголовок и короткий фрагмент текста, чтобы сразу понять, о чём заметка." },
    'notes-filters': { title: "Фильтруйте заметки", body: "Используйте фильтры, чтобы сузить список и быстрее находить нужную информацию." },
    'notes-editor-overview': { title: "Редактируйте заметку", body: "Используйте правую панель, чтобы работать с текстом заметки и просматривать связанные сведения." },
    'notes-rich-text': { title: "Оформляйте заметку", body: "Пишите текст в редакторе и используйте заголовки, списки и выделение, чтобы сделать важную информацию понятнее." },
    'notes-sections': { title: "Свяжите заметку с исследованием", body: "Здесь собраны связанные с заметкой записи и материалы, чтобы было понятно, как она связана с остальным исследованием." },
    'notes-checklist': { title: "Планируйте следующие шаги", body: "Добавляйте к заметке простые задачи и отмечайте их выполненными по мере работы." },
    'notes-add-actions': { title: "Свяжите заметку с событием", body: "Свяжите заметку с нужным событием, чтобы исследование оставалось привязано к соответствующей части семейной истории." },
    'notes-add-events': { title: "Выберите событие", body: "Найдите событие, к которому относится заметка, и выберите его, чтобы создать связь." },
    'notes-to-places': { title: "Перейдите в раздел «Места»", body: "Далее посмотрите, как места исследования связаны с людьми и событиями." },
    'places-welcome': { title: "Добро пожаловать в раздел «Места»", body: "Изучайте места проекта на карте или в списке и прослеживайте их связи с людьми и событиями." },
    'places-navigation': { title: "Навигация по местам", body: "Переходите между всеми местами проекта и записями, требующими проверки." },
    'places-countries': { title: "Просматривайте места проекта", body: "Места сгруппированы по странам. Раскрывайте или сворачивайте группы, чтобы просматривать сохранённые в них места." },
    'places-map': { title: "Изучайте места на карте", body: "Посмотрите, где разворачивалась история вашей семьи, и откройте место, чтобы увидеть подробности." },
    'places-routes': { title: "Исследуйте маршруты", body: "Проследите путь человека или носителей фамилии по датированным событиям, связанным с местами на карте." },
    'places-list': { title: "Переключитесь на список", body: "Карта и список показывают одни и те же места. Используйте список, чтобы увидеть те же места в более упорядоченном виде и упростить их изучение." },
    'places-filters': { title: "Фильтруйте места", body: "Используйте фильтры, чтобы сузить список и быстрее находить нужные места." },
    'places-save-filter': { title: "Сохраните отфильтрованный список", body: "Нажмите «Сохранить фильтр», чтобы сохранить текущую подборку и быстро вернуться к ней позже." },
    'places-saved-filters': { title: "Открывайте сохранённые фильтры", body: "Сохранённые фильтры появляются на панели навигации, откуда их можно быстро открыть в нужный момент." },
    'places-add-button': { title: "Добавьте новое место", body: "Создайте новое место и добавьте его в проект." },
    'places-add-modal': { title: "Найдите или укажите место", body: "Начните вводить название, чтобы найти существующее место. Выберите подходящий вариант или укажите своё название." },
    'places-add-coordinates': { title: "Укажите место на карте", body: "Выберите точку на карте или введите координаты вручную, чтобы точно указать местоположение." },
    'places-add-map': { title: "Поставьте маркер", body: "Нажмите на карту, чтобы поставить или переместить маркер, затем выберите «Использовать позицию», чтобы вернуться в окно добавления места с указанными координатами." },
    'places-add-create': { title: "Создайте место", body: "Вернувшись в окно добавления места, проверьте сведения и нажмите «Создать место», чтобы сохранить его." },
    'places-inspector': { title: "Сведения о месте", body: "Используйте правую панель, чтобы просматривать сведения о месте и при необходимости изменять их." },
    'places-actions': { title: "Управляйте местом", body: "Изменяйте сведения о месте или откройте меню «Ещё» для дополнительных действий." },
    'places-outro': { title: "Пройдите экскурсию снова", body: "Откройте «Помощь» и выберите «Пройти экскурсию», чтобы начать её заново или сразу перейти к нужному разделу." },
    'finish': { title: "Исследуйте самостоятельно", body: "Экскурсия завершена. Теперь изучайте демо в своём темпе и попробуйте функции, с которыми вы только что познакомились." },
});

const RU_UI_TOUR = Object.freeze({
    'Map placement is unavailable here. When the map loads, click to position a draft marker, then choose Use position to return its coordinates to the place window.': 'Здесь выбор на карте недоступен. Когда карта загрузится, нажмите на неё, чтобы поставить черновой маркер, затем выберите «Использовать позицию» для переноса координат в окно места.',
    'After choosing a map position, this window reopens with coordinates. Create place saves the new record. Map placement was unavailable here, so the tour will not create one.': 'После выбора точки на карте это окно откроется снова с координатами. Кнопка «Создать место» сохранит запись. Здесь выбор на карте недоступен, поэтому во время экскурсии место не создаётся.',
    'Start tour': 'Начать экскурсию',
    'Start again': 'Начать заново',
    'Explore on my own': 'Исследовать самостоятельно',
    'Module': 'Раздел',
    'Previous module': 'Предыдущий раздел',
    'Next module': 'Следующий раздел',
    'Browse modules': 'Обзор разделов',
    'Return to tour': 'Вернуться к экскурсии',
    'Continue to {module}': 'Далее: {module}',
    'Next': 'Далее',
    'Skip tour': 'Пропустить экскурсию',
    'Finish tour': 'Завершить экскурсию',
    'Explore the demo': 'Исследовать демо',
    'Step {current} of {total}': 'Шаг {current} из {total}',
    'Resume tour': 'Продолжить экскурсию',
    'Tour closed.': 'Экскурсия закрыта.',
    'This part of the sample is unavailable. Continue to the next stop.': 'Эта часть примера недоступна. Перейдите к следующему шагу.'
});

const RU_UI_MODULE_BLOCKS = Object.freeze({
    shared: RU_UI_SHARED,
    tour: RU_UI_TOUR,
    completion: RU_UI_COMPLETION,
    projects: RU_UI_PROJECTS,
    familyTree: RU_UI_FAMILY_TREE,
    people: RU_UI_PEOPLE,
    geneograph: RU_UI_GENEO,
    albums: RU_UI_ALBUMS,
    archive: RU_UI_ARCHIVE,
    notes: RU_UI_NOTES,
    places: RU_UI_PLACES,
    publish: RU_UI_PUBLISH
});

const RU_TERM_BLOCKS = Object.freeze({
    genealogy: RU_TERMS_GENEALOGY,
    relationships: RU_TERMS_RELATIONSHIPS,
    statuses: RU_TERMS_STATUSES
});

const RU_DATA_BLOCKS = Object.freeze({
    projects: RU_DATA_PROJECTS,
    projectComposites: RU_DATA_PROJECT_COMPOSITES,
    projectActivity: RU_DATA_PROJECT_ACTIVITY,
    projectInsights: RU_DATA_PROJECT_INSIGHTS,
    people: RU_DATA_PEOPLE,
    namesFirst: RU_DATA_NAMES_FIRST,
    namesMiddle: RU_DATA_NAMES_MIDDLE,
    namesSurnames: RU_DATA_NAMES_SURNAMES,
    places: RU_DATA_PLACES,
    photos: RU_DATA_PHOTOS,
    albums: RU_DATA_ALBUMS,
    archive: RU_DATA_ARCHIVE,
    sources: RU_DATA_SOURCES,
    notes: RU_DATA_NOTES,
    noteCollections: RU_DATA_NOTE_COLLECTIONS,
    geneograph: RU_DATA_GENEO,
    notifications: RU_DATA_NOTIFICATIONS
});

const RU_UI = buildLocalizationMap(
    'RU_UI',
    {
        ...RU_UI_MODULE_BLOCKS,
        ...RU_TERM_BLOCKS
    }
);

const RU_DATA = buildLocalizationMap(
    'RU_DATA',
    RU_DATA_BLOCKS
);

const RU_EXACT = buildLocalizationMap(
    'RU_EXACT',
    {
        ui: RU_UI,
        data: RU_DATA
    }
);


