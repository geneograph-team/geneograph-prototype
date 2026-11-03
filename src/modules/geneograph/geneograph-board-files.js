const GENEO_BOARD_FILE_FORMAT = 'geneograph-board';
const GENEO_BOARD_FILE_VERSION = 1;
const GENEO_BOARD_FILE_MAX_BYTES = 100 * 1024 * 1024;

function openGeneographExportMenu(anchor)
{
    if (!(anchor instanceof HTMLElement)) return;
    if (document.getElementById('projectMenu') && menuLifecycleAnchor === anchor)
    {
        closeMenu();
        return;
    }
    closeMenu();
    const menu = document.createElement('div');
    menu.id = 'projectMenu';
    menu.className = 'menu-popover geneo-export-menu';
    menu.setAttribute('role', 'menu');
    menu.setAttribute('aria-label', t('Export board'));
    menu.innerHTML = `
        <button type="button" role="menuitem" data-geneo-export-file>${icon.export}<span>${escapeHtml(t('Editable board file'))}</span></button>
        <button type="button" role="menuitem" data-geneo-export-png>${icon.image}<span>${escapeHtml(t('PNG image'))}</span></button>
        <p>${escapeHtml(t('Boards stay in this demo until reload. Export again after making changes.'))}</p>`;
    document.body.appendChild(menu);
    const rect = anchor.getBoundingClientRect();
    const width = menu.offsetWidth;
    const height = menu.offsetHeight;
    menu.style.left = `${Math.max(8, Math.min(rect.right - width, innerWidth - width - 8))}px`;
    menu.style.top = `${rect.bottom + height + 8 <= innerHeight ? rect.bottom + 6 : Math.max(8, rect.top - height - 6)}px`;
    menu.querySelector('[data-geneo-export-file]').addEventListener('click', () =>
    {
        closeMenu();
        downloadGeneographBoardFile();
    });
    menu.querySelector('[data-geneo-export-png]').addEventListener('click', () =>
    {
        closeMenu();
        runGeneographPngExport();
    });
    bindMenuLifecycle(anchor);
    menu.querySelector('button')?.focus();
}

function geneoBoardFileError(message)
{
    return new Error(message);
}

function geneoBoardImageData(src)
{
    const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/i.exec(src || '');
    if (!match || !PHOTO_UPLOAD_ALLOWED_TYPES.includes(match[1].toLowerCase()))
        throw geneoBoardFileError('Board images must be JPEG, PNG, or WebP.');
    const bytes = Math.floor(match[2].length * 3 / 4) - (match[2].endsWith('==') ? 2 : match[2].endsWith('=') ? 1 : 0);
    if (bytes < 1 || bytes > PHOTO_UPLOAD_MAX_BYTES)
        throw geneoBoardFileError('A board image exceeds the 20 MB image limit.');
    const signature = atob(match[2].slice(0, 48));
    const valid = match[1].toLowerCase() === 'image/png'
        ? signature.charCodeAt(0) === 137 && signature.slice(1, 4) === 'PNG'
        : match[1].toLowerCase() === 'image/jpeg'
            ? signature.charCodeAt(0) === 255 && signature.charCodeAt(1) === 216
            : signature.slice(0, 4) === 'RIFF' && signature.slice(8, 12) === 'WEBP';
    if (!valid) throw geneoBoardFileError('A board image has invalid data.');
    return { mimeType: match[1].toLowerCase(), bytes };
}

function geneoBoardBlobDataUrl(blob)
{
    return new Promise((resolve, reject) =>
    {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(geneoBoardFileError('An image could not be read.'));
        reader.readAsDataURL(blob);
    });
}

async function geneoBoardEmbeddedSource(src)
{
    if (String(src || '').startsWith('data:'))
    {
        geneoBoardImageData(src);
        return src;
    }
    try
    {
        const response = await fetch(src);
        if (!response.ok) throw new Error('Image request failed');
        const blob = await response.blob();
        if (!PHOTO_UPLOAD_ALLOWED_TYPES.includes(blob.type) || blob.size > PHOTO_UPLOAD_MAX_BYTES)
            throw geneoBoardFileError('A board image is unavailable or exceeds 20 MB.');
        const dataUrl = await geneoBoardBlobDataUrl(blob);
        geneoBoardImageData(dataUrl);
        return dataUrl;
    }
    catch (error)
    {
        if (error.message === 'A board image is unavailable or exceeds 20 MB.') throw error;
        // file:// previews cannot always fetch their own bundled assets.
        const image = await new Promise((resolve, reject) =>
        {
            const element = new Image();
            element.onload = () => resolve(element);
            element.onerror = () => reject(geneoBoardFileError('A board image could not be embedded.'));
            element.src = src;
        });
        try
        {
            const canvas = document.createElement('canvas');
            canvas.width = image.naturalWidth;
            canvas.height = image.naturalHeight;
            canvas.getContext('2d').drawImage(image, 0, 0);
            const dataUrl = canvas.toDataURL('image/png');
            geneoBoardImageData(dataUrl);
            return dataUrl;
        }
        catch (_)
        {
            throw geneoBoardFileError('A board image could not be embedded.');
        }
    }
}

async function buildGeneographBoardFile(board = selectedGeneographBoard())
{
    if (!board) throw geneoBoardFileError('Open a board before exporting it.');
    if (state.geneoInlineEditNodeId) commitGeneoInlineEdit(false);
    const diagram = structuredClone(board.diagram);
    const assetById = new Map(diagram.assets.map(asset => [asset.id, asset]));
    const projectPhotoAssets = new Map();
    for (const asset of diagram.assets)
    {
        asset.src = await geneoBoardEmbeddedSource(asset.src);
        asset.mimeType = geneoBoardImageData(asset.src).mimeType;
    }
    const embedProjectPhoto = async photoId =>
    {
        if (projectPhotoAssets.has(photoId)) return projectPhotoAssets.get(photoId);
        const photo = getPhoto(photoId, { projectId: board.projectId });
        if (!photo || photo.deletedAt) throw geneoBoardFileError('A linked project photo is unavailable.');
        const src = await geneoBoardEmbeddedSource(photo.src);
        const asset = {
            id: createRuntimeId('geneo-asset'),
            kind: 'photo', filename: photo.filename || 'Photo',
            displayName: photo.title || photo.filename || 'Photo',
            src, mimeType: geneoBoardImageData(src).mimeType,
            width: photo.width || 0, height: photo.height || 0,
            sizeBytes: geneoBoardImageData(src).bytes,
            createdAt: photo.createdAt || new Date().toISOString(),
            updatedAt: photo.updatedAt || new Date().toISOString()
        };
        diagram.assets.push(asset);
        assetById.set(asset.id, asset);
        projectPhotoAssets.set(photoId, asset.id);
        return asset.id;
    };
    for (const node of diagram.nodes)
    {
        if (node.type !== 'image') continue;
        const ref = normalizeGeneographImageRef(node);
        if (ref?.scope === 'project') node.imageRef = { scope: 'board', id: await embedProjectPhoto(ref.id) };
        else if (!ref || !assetById.has(ref.id)) throw geneoBoardFileError('A board image is unavailable.');
    }
    for (const person of diagram.people)
    {
        const treePerson = person.treePersonId ? getPerson(person.treePersonId) : null;
        const photoId = person.photoId || treePerson?.primaryPhotoId;
        if (photoId) person.photoAssetId = await embedProjectPhoto(photoId);
    }
    const viewport = captureGeneographViewport(board.id) || geneoSavedViewport(board.id);
    const payload = {
        format: GENEO_BOARD_FILE_FORMAT, version: GENEO_BOARD_FILE_VERSION,
        exportedAt: new Date().toISOString(), sourceProjectId: board.projectId,
        board: { title: board.title, description: board.description, diagram },
        viewport: viewport ? structuredClone(viewport) : null
    };
    const json = JSON.stringify(payload);
    if (new Blob([json]).size > GENEO_BOARD_FILE_MAX_BYTES)
        throw geneoBoardFileError('This board exceeds the 100 MB file limit.');
    return json;
}

async function downloadGeneographBoardFile()
{
    const board = selectedGeneographBoard();
    if (!board) return;
    try
    {
        const json = await buildGeneographBoardFile(board);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = geneoPngFilename(board.title).replace(/\.png$/, '.ggboard');
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 60000);
        showToast(t('Editable board file downloaded. Export again after making changes.'));
    }
    catch (error)
    {
        showToast(t(error.message || 'Board export failed.'));
    }
}

function validateGeneographBoardFile(payload)
{
    if (!payload || payload.format !== GENEO_BOARD_FILE_FORMAT || payload.version !== GENEO_BOARD_FILE_VERSION)
        throw geneoBoardFileError('This is not a supported Geneograph board file.');
    const board = payload.board;
    const diagram = board?.diagram;
    if (!board || typeof board.title !== 'string' || board.title.length > 160
        || typeof board.description !== 'string' || board.description.length > 500
        || !diagram || typeof diagram !== 'object'
        || !diagram.canvas || !diagram.personCardDefaults
        || !['assets', 'people', 'families', 'nodes', 'connections'].every(key => Array.isArray(diagram[key])))
        throw geneoBoardFileError('The board file is incomplete.');
    if (diagram.assets.length > 200 || diagram.people.length > 2000 || diagram.families.length > 2000
        || diagram.nodes.length > 2000 || diagram.connections.length > 4000)
        throw geneoBoardFileError('The board file contains too many objects.');
    if (diagram.connectionDefaults?.cornerRadius !== undefined
        && (!Number.isInteger(diagram.connectionDefaults.cornerRadius)
            || diagram.connectionDefaults.cornerRadius < 0
            || diagram.connectionDefaults.cornerRadius > 32))
        throw geneoBoardFileError('The board has invalid connection defaults.');
    if (diagram.connectionDefaults?.showRelationshipDates !== undefined
        && typeof diagram.connectionDefaults.showRelationshipDates !== 'boolean')
        throw geneoBoardFileError('The board has invalid connection defaults.');
    const uniqueIds = items =>
    {
        const ids = items.map(item => item?.id);
        if (ids.some(id => typeof id !== 'string' || !id || id.length > 160) || new Set(ids).size !== ids.length)
            throw geneoBoardFileError('The board has invalid identifiers.');
        return new Set(ids);
    };
    const assets = uniqueIds(diagram.assets);
    const people = uniqueIds(diagram.people);
    const families = uniqueIds(diagram.families);
    const nodes = uniqueIds(diagram.nodes);
    uniqueIds(diagram.connections);
    const validDate = value =>
    {
        if (!value || typeof value !== 'object' || !value.first) return true;
        if (!GENEALOGY_CALENDARS.includes(value.calendar)
            || !['empty', 'known', 'unknown', 'unparsed'].includes(value.state)) return false;
        const validParts = parts => parts && ['year', 'month', 'day'].every(key =>
            parts[key] === null || Number.isInteger(parts[key]))
            && Boolean(genealogyDateParts(parts.year, parts.month, parts.day, value.calendar));
        if (!validParts(value.first) || value.second && !validParts(value.second)) return false;
        return value.state !== 'known' || normalizeGenealogyDateInput(value).state === 'known';
    };
    for (const asset of diagram.assets)
    {
        const image = geneoBoardImageData(asset.src);
        if (asset.mimeType !== image.mimeType) throw geneoBoardFileError('An image type does not match its data.');
    }
    for (const person of diagram.people)
    {
        if (!person.names || typeof person.names !== 'object'
            || !validDate(person.birth) || !validDate(person.death)
            || (person.photoAssetId && !assets.has(person.photoAssetId))
            || (person.photoRegion && (!normalizeFaceRegion(person.photoRegion, FACE_REGION_MIN)
                || ['x', 'y', 'width', 'height'].some(key => !Number.isFinite(person.photoRegion[key])))))
            throw geneoBoardFileError('A board person has invalid data.');
    }
    for (const family of diagram.families)
    {
        if (!Array.isArray(family.partnerIds) || !Array.isArray(family.children)
            || (family.events || []).some(event => !validDate(event.date))
            || new Set(family.partnerIds).size !== family.partnerIds.length
            || family.partnerIds.some(id => !people.has(id))
            || family.children.some(child => !people.has(child?.personId))
            || new Set(family.children.map(child => child.personId)).size !== family.children.length)
            throw geneoBoardFileError('A family connection is invalid.');
    }
    for (const node of diagram.nodes)
    {
        if (!GENEO_NODE_TYPES.has(node.type) || !['x', 'y', 'width', 'height'].every(key => Number.isFinite(node[key]))
            || Math.abs(node.x) > GENEO_WORLD_LIMIT || Math.abs(node.y) > GENEO_WORLD_LIMIT
            || node.width <= 0 || node.height <= 0 || node.width > 10000 || node.height > 10000
            || (node.type === 'person' && !people.has(node.personId)))
            throw geneoBoardFileError('A board object has invalid geometry or references.');
        if (node.parentPanelId && !diagram.nodes.some(parent => parent.id === node.parentPanelId && parent.type === 'panel'))
            throw geneoBoardFileError('A board object has invalid geometry or references.');
        if (node.type === 'image' && (node.imageRef?.scope !== 'board' || !assets.has(node.imageRef.id)))
            throw geneoBoardFileError('A board image reference is invalid.');
        if (node.type === 'place' && !(node.placeRef?.scope === 'board'
            ? typeof node.placeRef.name === 'string' && node.placeRef.name.trim()
            : node.placeRef?.scope === 'project' && typeof node.placeRef.id === 'string'
              && typeof node.placeRef.fallbackName === 'string'))
            throw geneoBoardFileError('A board object has invalid geometry or references.');
        if (node.type === 'drawing' && (!Array.isArray(node.points) || node.points.length < 2
            || node.points.some(point => !Number.isFinite(point?.x) || !Number.isFinite(point?.y))))
            throw geneoBoardFileError('A board object has invalid geometry or references.');
    }
    for (const connection of diagram.connections)
    {
        const validEnd = end => end && (end.nodeId ? nodes.has(end.nodeId) : families.has(end.familyId));
        if (!validEnd(connection.source) || !validEnd(connection.target)
            || (connection.visible !== undefined && typeof connection.visible !== 'boolean')
            || (connection.showRelationshipDates !== undefined
                && typeof connection.showRelationshipDates !== 'boolean')
            || (connection.style?.cornerRadius !== undefined
                && (!Number.isInteger(connection.style.cornerRadius)
                    || connection.style.cornerRadius < 0 || connection.style.cornerRadius > 32))
            || !Array.isArray(connection.route?.waypoints)
            || (connection.route.railY !== undefined && (!Number.isFinite(connection.route.railY)
                || Math.abs(connection.route.railY) > GENEO_WORLD_LIMIT))
            || connection.route.waypoints.some(point => !Number.isFinite(point?.x)
                || !Number.isFinite(point?.y) || Math.abs(point.x) > GENEO_WORLD_LIMIT
                || Math.abs(point.y) > GENEO_WORLD_LIMIT))
            throw geneoBoardFileError('A board connection is invalid.');
    }
    if (payload.viewport && (!Number.isFinite(payload.viewport.zoom)
        || !Number.isFinite(payload.viewport.center?.x) || !Number.isFinite(payload.viewport.center?.y)
        || Math.abs(payload.viewport.center.x) > GENEO_WORLD_LIMIT
        || Math.abs(payload.viewport.center.y) > GENEO_WORLD_LIMIT))
        throw geneoBoardFileError('The board viewport is invalid.');
    return payload;
}

function importGeneographBoardPayload(payload, projectId = currentProjectId())
{
    if (!validProjectById(projectId)) throw geneoBoardFileError('Open a project before importing a board.');
    validateGeneographBoardFile(payload);
    const diagram = structuredClone(payload.board.diagram);
    for (const person of diagram.people)
    {
        const linked = person.treePersonId ? getPerson(person.treePersonId) : null;
        if (!linked || linked.projectId !== projectId
            || linked.names?.display !== geneoPersonDisplayName(person))
        {
            person.treePersonId = null;
            person.syncState = 'local';
        }
        person.photoId = null;
    }
    for (const node of diagram.nodes)
    {
        if (node.type !== 'place' || node.placeRef?.scope !== 'project') continue;
        const place = getPlace(node.placeRef.id);
        if (!place || place.projectId !== projectId || place.deleted
            || (placePrimaryName(place) || place.name) !== node.placeRef.fallbackName)
            node.placeRef = { scope: 'board', name: node.placeRef.fallbackName || 'Place' };
    }
    const projectPeople = new Map([[projectId, new Set(
        (sampleData.people || []).filter(person => person.projectId === projectId).map(person => person.id)
    )]]);
    const now = new Date().toISOString();
    const board = normalizeGeneographBoardRecord({
        id: createRuntimeId('board'), projectId,
        title: payload.board.title, description: payload.board.description,
        collectionIds: [], favorite: false, archived: false,
        modified: 'Just now', modifiedAt: now, createdAt: now,
        thumb: 'theory', diagram
    }, projectPeople);
    // Commit only after normalization has succeeded.
    sampleData.boards.unshift(board);
    if (payload.viewport)
        state.geneoBoardViewports[board.id] = {
            zoom: Math.max(25, Math.min(200, Math.round(payload.viewport.zoom))),
            center: { x: payload.viewport.center.x, y: payload.viewport.center.y }
        };
    state.geneoLibraryView = 'all';
    state.geneoActiveCollectionId = null;
    openGeneographBoard(board.id);
    return board;
}

async function importGeneographBoardFile(file)
{
    if (!file || !/\.ggboard$/i.test(file.name) || file.size > GENEO_BOARD_FILE_MAX_BYTES)
    {
        showToast(t('Choose a .ggboard file smaller than 100 MB.'));
        return false;
    }
    try
    {
        const payload = JSON.parse(await file.text());
        importGeneographBoardPayload(payload);
        showToast(t('Board imported. Export again after making changes.'));
        return true;
    }
    catch (error)
    {
        showToast(t(error.message || 'Board import failed.'));
        return false;
    }
}
