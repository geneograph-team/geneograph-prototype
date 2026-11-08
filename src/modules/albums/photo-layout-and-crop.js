const ALBUMS_JUSTIFIED_LAYOUT = Object.freeze({
    targetHeight: 184,
    minHeight: 150,
    maxHeight: 220,
    minCardWidth: 180,
    preferredMaxCardWidth: 360,
    gap: 12,
    lastRowMaxScale: 1.15,
    narrowBreakpoint: 720
});

function photoAspectRatio(photo)
{
    const width = Number(photo?.width);
    const height = Number(photo?.height);
    const ratio = Number.isFinite(width)
        && Number.isFinite(height)
        && width > 0
        && height > 0
        ? width / height
        : 4 / 3;

    return Math.min(3, Math.max(0.45, ratio));
}

function buildJustifiedPhotoRows(photos, containerWidth, options = {})
{
    const settings = {
        ...ALBUMS_JUSTIFIED_LAYOUT,
        ...options
    };
    const width = Number(containerWidth);

    if (!Number.isFinite(width) || width <= 0) return [];

    const minimumLayoutRatio = settings.minCardWidth / settings.minHeight;
    const source = (Array.isArray(photos) ? photos : []).map(photo =>
    {
        const naturalRatio = photoAspectRatio(photo);
        return {
            photo,
            ratio: Math.max(naturalRatio, minimumLayoutRatio)
        };
    });
    const rows = [];
    let pending = [];

    const rowHeight = items =>
    {
        const photoWidth = width - settings.gap * Math.max(0, items.length - 1);
        const ratioTotal = items.reduce((sum, item) => sum + item.ratio, 0);
        return ratioTotal > 0 ? photoWidth / ratioTotal : settings.targetHeight;
    };

    const rowScore = items =>
    {
        if (!items.length) return Number.POSITIVE_INFINITY;
        const height = rowHeight(items);
        const narrowest = Math.min(...items.map(item => item.ratio * height));
        const widest = Math.max(...items.map(item => item.ratio * height));
        let score = Math.abs(height - settings.targetHeight);
        if (height < settings.minHeight) score += (settings.minHeight - height) * 4;
        if (height > settings.maxHeight) score += (height - settings.maxHeight) * 3;
        if (narrowest < settings.minCardWidth) score += (settings.minCardWidth - narrowest) * 2;
        if (widest > settings.preferredMaxCardWidth) score += widest - settings.preferredMaxCardWidth;
        return score;
    };

    const justify = items =>
    {
        const height = rowHeight(items);
        const available = Math.round(width - settings.gap * Math.max(0, items.length - 1));
        const itemWidths = items.map(item => Math.floor(height * item.ratio));
        const difference = available - itemWidths.reduce((sum, itemWidth) => sum + itemWidth, 0);
        itemWidths[itemWidths.length - 1] += difference;
        return {
            height: Math.round(height * 10) / 10,
            justified: true,
            items: items.map((item, index) => ({
                photo: item.photo,
                width: itemWidths[index]
            }))
        };
    };

    const natural = items =>
    {
        let height = settings.targetHeight;
        if (items.length === 1)
        {
            height = Math.min(
                settings.targetHeight,
                settings.preferredMaxCardWidth / items[0].ratio
            );
        }
        return {
            height: Math.round(height * 10) / 10,
            justified: false,
            items: items.map(item => ({
                photo: item.photo,
                width: Math.round(item.ratio * height)
            }))
        };
    };

    source.forEach(item =>
    {
        pending.push(item);
        const height = rowHeight(pending);
        if (height > settings.targetHeight) return;

        if (pending.length > 1)
        {
            const withoutLast = pending.slice(0, -1);

            if (height < settings.minHeight)
            {
                rows.push(justify(withoutLast));
                pending = [item];
                return;
            }

            if (
                rowScore(withoutLast) < rowScore(pending)
            )
            {
                rows.push(justify(withoutLast));
                pending = [item];
                return;
            }
        }

        rows.push(justify(pending));
        pending = [];
    });

    if (pending.length === 1 && rows.length)
    {
        const previous = rows[rows.length - 1];
        if (previous.items.length >= 3)
        {
            const previousSource = previous.items.map(item =>
            {
                const naturalRatio = photoAspectRatio(item.photo);
                return {
                    photo: item.photo,
                    ratio: Math.max(naturalRatio, minimumLayoutRatio)
                };
            });
            const moved = previousSource.pop();
            const rebalancedHeight = rowHeight(previousSource);
            if (rebalancedHeight >= settings.minHeight && rebalancedHeight <= settings.maxHeight)
            {
                rows[rows.length - 1] = justify(previousSource);
                pending.unshift(moved);
            }
        }
    }

    if (pending.length)
    {
        const height = rowHeight(pending);
        const canJustify = pending.length > 1
          && height >= settings.minHeight
          && height <= settings.targetHeight * settings.lastRowMaxScale;
        rows.push(canJustify ? justify(pending) : natural(pending));
    }

    return rows;
}

function renderPhotoThumbnail(photo, options = {})
{
    if (!photo) return '';
    const className = ['photo-thumbnail', options.className || ''].filter(Boolean).join(' ');
    const label = options.label || photo.title || photo.filename || 'Photo';
    const src = typeof photo.src === 'string' ? photo.src.trim() : '';
    return `<span class="${escapeHtml(className)}${src ? ' has-image' : ''}" data-photo-thumbnail data-photo-state="${src ? 'loading' : 'missing'}" role="img" aria-label="${escapeHtml(label)}">
        <span class="photo-thumbnail-fallback" ${src ? 'hidden' : ''}>${icon.image}<span>${escapeHtml(t('Image unavailable'))}</span></span>
        ${src ? `<img class="thumb-img" src="${escapeHtml(src)}" alt="" loading="lazy" decoding="async" draggable="false"
          onload="this.closest('[data-photo-thumbnail]').dataset.photoState='loaded'"
          onerror="const root=this.closest('[data-photo-thumbnail]');root.classList.remove('has-image');root.dataset.photoState='missing';root.querySelector('.photo-thumbnail-fallback').hidden=false;this.remove();">` : ''}
    </span>`;
}

const PERSON_PHOTO_CROP_DEFAULT = Object.freeze({
    centerX: 0.5,
    centerY: 0.5,
    zoom: 1,
    rotation: 0
});
const FACE_REGION_DEFAULT = Object.freeze({ x: 0.3, y: 0.3, width: 0.4, height: 0.4 });
const FACE_REGION_MIN = 0.06;

function normalizeFaceRegion(region, minimum = 0)
{
    if (!region) return null;
    const values = ['x', 'y', 'width', 'height'].map(key => Number(region[key]));
    if (values.some(value => !Number.isFinite(value))) return null;
    const width = Math.min(1, Math.max(minimum, values[2]));
    const height = Math.min(1, Math.max(minimum, values[3]));
    if (width <= 0 || height <= 0) return null;
    return {
        x: Math.min(1 - width, Math.max(0, values[0])),
        y: Math.min(1 - height, Math.max(0, values[1])),
        width,
        height
    };
}

function photoPersonRegion(photo, personId)
{
    return (photo?.personIds || []).includes(personId)
        ? normalizeFaceRegion(photo?.personRegions?.[personId])
        : null;
}

function setPhotoPersonRegion(photo, personId, region)
{
    if (!photo || !(photo.personIds || []).includes(personId)
        || getPerson(personId)?.projectId !== photo.projectId) return false;
    const regions = { ...(photo.personRegions || {}) };
    const normalized = normalizeFaceRegion(region);
    if (normalized) regions[personId] = normalized;
    else delete regions[personId];
    photo.personRegions = regions;
    const person = getPerson(personId);
    if (normalized && person?.primaryPhotoId === photo.id) person.primaryPhotoCrop = null;
    photo.updatedAt = new Date().toISOString();
    markPrototypeSessionEdited();
    return true;
}
const PERSON_PHOTO_ZOOM_MIN = 1;
const PERSON_PHOTO_ZOOM_MAX = 3;
const PERSON_PHOTO_ROTATIONS = Object.freeze([0, 90, 180, 270]);

function clampPersonPhotoValue(value, minimum, maximum, fallback)
{
    const number = Number(value);
    return Number.isFinite(number)
        ? Math.min(maximum, Math.max(minimum, number))
        : fallback;
}

function normalizePersonPhotoCrop(crop)
{
    const rotation = Number(crop?.rotation);
    return {
        centerX: clampPersonPhotoValue(crop?.centerX, 0, 1, PERSON_PHOTO_CROP_DEFAULT.centerX),
        centerY: clampPersonPhotoValue(crop?.centerY, 0, 1, PERSON_PHOTO_CROP_DEFAULT.centerY),
        zoom: clampPersonPhotoValue(crop?.zoom, PERSON_PHOTO_ZOOM_MIN, PERSON_PHOTO_ZOOM_MAX, PERSON_PHOTO_CROP_DEFAULT.zoom),
        rotation: PERSON_PHOTO_ROTATIONS.includes(rotation) ? rotation : PERSON_PHOTO_CROP_DEFAULT.rotation
    };
}

function repairPrimaryPhotoReferences(photoIds = [])
{
    const ids = new Set(photoIds);
    sampleData.people.forEach(person =>
    {
        if (!person.primaryPhotoId || (ids.size && !ids.has(person.primaryPhotoId))) return;
        const photo = getPhoto(person.primaryPhotoId, { projectId: person.projectId });
        if (
            !photo
          || !photoIsTaggedWithPerson(
              photo,
              person
          )
        )
        {
            person.primaryPhotoId = '';
            person.primaryPhotoCrop = null;
        }
    });
}

function setPhotoPersonIds(photoId, personIds, { rerender = true } = {})
{
    const photo = getPhoto(photoId);
    if (!photo) return false;
    const validIds = [...new Set(personIds || [])].filter(personId =>
        getPerson(personId)?.projectId === photo.projectId
    );
    photo.personIds = validIds;
    if (photo.personRegions)
    {
        photo.personRegions = Object.fromEntries(
            Object.entries(photo.personRegions).filter(([personId]) => validIds.includes(personId))
        );
    }
    photo.updatedAt = new Date().toISOString();
    markPrototypeSessionEdited();
    repairPrimaryPhotoReferences([photo.id]);
    if (rerender) render();
    return true;
}

function setPersonPhotoIds(personId, photoIds, { rerender = true } = {})
{
    const person = getPerson(personId);
    if (!person) return false;
    const selected = new Set(
        [...new Set(photoIds || [])].filter(photoId =>
            Boolean(getPhoto(photoId, { projectId: person.projectId }))
        )
    );
    getProjectPhotos(person.projectId).forEach(photo =>
    {
        const ids = new Set(photo.personIds || []);
        if (selected.has(photo.id)) ids.add(person.id);
        else ids.delete(person.id);
        photo.personIds = [...ids];
        if (photo.personRegions && !ids.has(person.id)) delete photo.personRegions[person.id];
        photo.updatedAt = new Date().toISOString();
    });
    repairPrimaryPhotoReferences();
    markPrototypeSessionEdited();
    if (rerender) render();
    return true;
}

function setPersonPrimaryPhoto(personId, photoId, crop = null, { rerender = true, notify = true } = {})
{
    const person = getPerson(personId);
    const photo = getPhoto(photoId, { projectId: person?.projectId || '' });
    if (!person || !photo || !(photo.personIds || []).includes(personId)) return false;
    const previousPhotoId = person.primaryPhotoId || '';
    person.primaryPhotoId = photo.id;
    person.primaryPhotoCrop = photoPersonRegion(photo, personId)
        ? null
        : normalizePersonPhotoCrop(crop || (previousPhotoId === photo.id ? person.primaryPhotoCrop : null));
    markPersonUpdated(person);
    if (rerender) render();
    if (notify) showToast('Primary photo updated.');
    return true;
}

