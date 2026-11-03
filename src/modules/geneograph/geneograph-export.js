// PNG export runs against a detached copy of the already-rendered board.
const geneoPngExportRuntime = {
    busy: false
};

const GENEO_PNG_PADDING = 48;
const GENEO_PNG_MAX_SIDE = 8192;
const GENEO_PNG_MAX_PIXELS = 16777216;

function geneoPngAssetError(label, phase, cause)
{
    const error = new Error(`Geneograph PNG asset ${phase}: ${label}`);
    error.kind = 'asset';
    error.phase = phase;
    error.resource = label;
    error.cause = cause;
    return error;
}

function geneoPngSetBusy(busy)
{
    geneoPngExportRuntime.busy = busy;
    document.querySelectorAll('[data-geneo-export], [data-geneo-toolbar-action="export"]')
        .forEach(button =>
        {
            button.disabled = busy;
            button.setAttribute('aria-busy', String(busy));
        });
}

function geneoPngRequiredPhotos(board, visibleNodes)
{
    const photos = new Map();

    visibleNodes.forEach(node =>
    {
        if (node.type === 'image')
        {
            const source = resolveGeneographImageSource(node, {
                board,
                diagram: board.diagram
            });
            if (!source.available || !source.photo)
            {
                throw geneoPngAssetError(`image object ${node.id}`, 'resolve');
            }
            if (!source.photo.src)
            {
                throw geneoPngAssetError(`image object ${node.id}`, 'resolve');
            }
            photos.set(String(source.photo.src), `image object ${node.id}`);
        }

        if (node.type === 'person')
        {
            const model = geneoPersonCardViewModel(node, board.diagram);
            if (!model.showPhoto || !model.person) return;
            const person = model.person;
            const linked = person.treePersonId
                ? getPerson(person.treePersonId)
                : null;
            const photoId = person.photoId || linked?.primaryPhotoId;
            if (!photoId) return;
            const photo = getPhoto(photoId, { projectId: board.projectId });
            if (!photo || photo.deletedAt)
            {
                throw geneoPngAssetError(`person ${node.id}, photo ${photoId}`, 'resolve');
            }
            if (!photo.src)
            {
                throw geneoPngAssetError(`person ${node.id}, photo ${photoId}`, 'resolve');
            }
            photos.set(String(photo.src), `person ${node.id}, photo ${photoId}`);
        }
    });

    return photos;
}

function geneoPngRemoveEditorContent(stage)
{
    stage.className = 'geneo-canvas-stage';
    stage.style.transform = 'none';
    stage.querySelectorAll('[data-geneo-person-link-status]')
        .forEach(person => person.removeAttribute('data-geneo-person-link-status'));
    stage.querySelectorAll(
        '.geneo-panel-draft, .geneo-selection-marquee, '
        + '.geneo-connection-hit, .geneo-segment-hit, '
        + '.geneo-connection-selection-guide, .geneo-waypoint, '
        + '.geneo-family-junction, .geneo-connection-preview, '
        + '.geneo-pencil-preview, .geneo-drawing-hit, '
        + '.geneo-person-add-relative, .geneo-person-edit-action, '
        + '.geneo-port, .geneo-resize-handle, .geneo-resize-edge, '
        + '.geneo-rich-text-toolbar, .geneo-image-layer-label, '
        + '[data-geneo-inline-input], button, textarea'
    ).forEach(element => element.remove());

    stage.querySelectorAll('.geneo-connection.no-stroke').forEach(element => element.remove());
    stage.querySelectorAll('.geneo-connection-line, .geneo-drawing-line')
        .forEach(element => element.setAttribute('fill', 'none'));
    stage.querySelectorAll('.geneo-node-shape').forEach(node =>
    {
        const fill = node.style.getPropertyValue('--geneo-node-bg');
        const stroke = node.classList.contains('stroke-none')
            ? 'none'
            : node.style.getPropertyValue('--geneo-node-stroke');
        const width = node.style.getPropertyValue('--geneo-node-stroke-width');
        node.querySelectorAll('.geneo-shape-svg rect, .geneo-shape-svg ellipse, .geneo-shape-svg path')
            .forEach(geometry =>
            {
                geometry.style.fill = fill;
                geometry.style.stroke = stroke;
                geometry.style.strokeWidth = width;
                geometry.style.strokeDasharray = node.classList.contains('stroke-dashed') ? '8 7' : 'none';
            });
    });
    stage.querySelectorAll('.geneo-node-drawing').forEach(node =>
    {
        const line = node.querySelector('.geneo-drawing-line');
        if (!line) return;
        line.style.fill = 'none';
        line.style.stroke = node.classList.contains('stroke-none')
            ? 'none'
            : node.style.getPropertyValue('--geneo-node-stroke');
        line.style.strokeWidth = node.style.getPropertyValue('--geneo-node-stroke-width');
        line.style.strokeDasharray = node.classList.contains('stroke-dashed') ? '8 7' : 'none';
    });
    stage.querySelectorAll('.selected, .is-rich-editing, .active')
        .forEach(element => element.classList.remove('selected', 'is-rich-editing', 'active'));
    stage.querySelectorAll('[tabindex]').forEach(element => element.removeAttribute('tabindex'));

    const identifiers = new Map();
    stage.querySelectorAll('[id]').forEach((element, index) =>
    {
        const oldId = element.id;
        const newId = `geneo-png-${index}`;
        identifiers.set(oldId, newId);
        element.id = newId;
    });
    stage.querySelectorAll('*').forEach(element =>
    {
        [...element.attributes].forEach(attribute =>
        {
            if (attribute.name.startsWith('on'))
            {
                element.removeAttribute(attribute.name);
                return;
            }
            let value = attribute.value;
            identifiers.forEach((newId, oldId) =>
            {
                value = value.replaceAll(`url(#${oldId})`, `url(#${newId})`);
                if ((attribute.name === 'href' || attribute.name === 'xlink:href')
                    && value === `#${oldId}`)
                {
                    value = `#${newId}`;
                }
            });
            if (value !== attribute.value) element.setAttribute(attribute.name, value);
        });
    });
}

function geneoPngUnion(bounds, rectangle, padding = 0)
{
    if (!rectangle || !Number.isFinite(rectangle.left) || !Number.isFinite(rectangle.top)) return;
    if (!rectangle.width && !rectangle.height) return;
    bounds.left = Math.min(bounds.left, rectangle.left - padding);
    bounds.top = Math.min(bounds.top, rectangle.top - padding);
    bounds.right = Math.max(bounds.right, rectangle.right + padding);
    bounds.bottom = Math.max(bounds.bottom, rectangle.bottom + padding);
}

function geneoPngMeasure(stage)
{
    const origin = stage.getBoundingClientRect();
    const bounds = {
        left: Infinity,
        top: Infinity,
        right: -Infinity,
        bottom: -Infinity
    };
    const items = stage.querySelectorAll(
        '.geneo-node, .geneo-connection-line, .geneo-relationship-date'
    );
    items.forEach(element =>
    {
        const rectangle = element.getBoundingClientRect();
        const relative = {
            left: rectangle.left - origin.left,
            top: rectangle.top - origin.top,
            right: rectangle.right - origin.left,
            bottom: rectangle.bottom - origin.top,
            width: rectangle.width,
            height: rectangle.height
        };
        const padding = element.classList.contains('geneo-node')
            ? 36
            : element.classList.contains('geneo-connection-line')
                ? Math.max(8, Number(element.getAttribute('stroke-width')) / 2 + 4)
                : 4;
        geneoPngUnion(bounds, relative, padding);
    });
    if (!Number.isFinite(bounds.left))
    {
        throw new Error('Geneograph PNG has no measurable content.');
    }
    bounds.left = Math.floor(bounds.left);
    bounds.top = Math.floor(bounds.top);
    bounds.right = Math.ceil(bounds.right);
    bounds.bottom = Math.ceil(bounds.bottom);
    return bounds;
}

function geneoPngLoadImage(source, label)
{
    return new Promise((resolve, reject) =>
    {
        const image = new Image();
        if (/^https?:/i.test(source)) image.crossOrigin = 'anonymous';
        image.onload = async () =>
        {
            if (!image.naturalWidth || !image.naturalHeight)
            {
                reject(geneoPngAssetError(label, 'load'));
                return;
            }
            if (image.decode)
            {
                try
                {
                    await image.decode();
                }
                catch (_error)
                {
                    // A successful load with valid dimensions is authoritative.
                }
            }
            resolve(image);
        };
        image.onerror = error => reject(geneoPngAssetError(label, 'load', error));
        image.src = source;
    });
}

function geneoPngBlobDataUrl(blob, label)
{
    return new Promise((resolve, reject) =>
    {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(geneoPngAssetError(label, 'read', error));
        reader.readAsDataURL(blob);
    });
}

async function geneoPngEmbedImage(source, label)
{
    let dataUrl = source;
    if (!source.startsWith('data:'))
    {
        try
        {
            const response = await fetch(source);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const blob = await response.blob();
            if (!blob.type.startsWith('image/')) throw new Error('Not an image');
            dataUrl = await geneoPngBlobDataUrl(blob, label);
        }
        catch (error)
        {
            if (!source.startsWith('file:'))
            {
                throw geneoPngAssetError(label, 'fetch', error);
            }
            // Direct-file browsers may load images even when fetch(file:) is denied.
        }
    }

    const image = await geneoPngLoadImage(dataUrl, label);
    if (!dataUrl.startsWith('data:'))
    {
        try
        {
            const canvas = document.createElement('canvas');
            canvas.width = image.naturalWidth;
            canvas.height = image.naturalHeight;
            canvas.getContext('2d').drawImage(image, 0, 0);
            dataUrl = canvas.toDataURL('image/png');
        }
        catch (error)
        {
            throw geneoPngAssetError(label, 'embed', error);
        }
    }
    return dataUrl;
}

async function geneoPngPrepareImages(stage, requiredPhotos)
{
    const images = [...stage.querySelectorAll('img')];
    const renderedSources = new Set(images.map(image => image.src));
    requiredPhotos.forEach((label, source) =>
    {
        const resolved = new URL(source, document.baseURI).href;
        if (!renderedSources.has(resolved))
        {
            throw geneoPngAssetError(label, 'render');
        }
    });
    const embedded = new Map();
    await Promise.all(images.map(async image =>
    {
        const source = image.src;
        const sourceRecord = [...requiredPhotos].find(([raw]) =>
        {
            try
            {
                return new URL(raw, document.baseURI).href === source;
            }
            catch (_error)
            {
                return raw === source;
            }
        });
        const label = sourceRecord?.[1] || `board image ${source}`;
        if (!embedded.has(source))
        {
            embedded.set(source, geneoPngEmbedImage(source, label));
        }
        image.src = await embedded.get(source);
        image.removeAttribute('loading');
    }));

    await Promise.all(images.map(image => geneoPngLoadImage(image.src, 'embedded board image')));
}

async function geneoPngLogo()
{
    const container = document.createElement('div');
    container.innerHTML = icon.logo;
    const svg = container.querySelector('svg');
    if (!svg) throw geneoPngAssetError('Projects logo', 'resolve');
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    const source = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(svg))}`;
    return geneoPngLoadImage(source, 'Projects logo');
}

function geneoPngBrandLayout(scale, attribution)
{
    const inset = Math.max(16, Math.round(24 * scale));
    const paddingX = Math.max(12, Math.round(14 * scale));
    const paddingY = Math.max(8, Math.round(10 * scale));
    const gap = Math.max(8, Math.round(12 * scale));
    const fontSize = Math.max(14, Math.round(16 * scale));
    const logoHeight = Math.max(28, Math.round(34 * scale));
    const logoWidth = logoHeight * 412 / 368;
    const measure = document.createElement('canvas').getContext('2d');
    measure.font = `600 ${fontSize}px Inter, Segoe UI, sans-serif`;
    return {
        inset,
        paddingX,
        gap,
        fontSize,
        logoHeight,
        logoWidth,
        width: Math.ceil(paddingX * 2 + logoWidth + gap + measure.measureText(attribution).width),
        height: Math.ceil(paddingY * 2 + Math.max(logoHeight, fontSize * 1.35))
    };
}

function geneoPngDimensions(boardWidth, boardHeight, scale, attribution)
{
    const capturedWidth = Math.max(1, Math.ceil(boardWidth * scale));
    const capturedHeight = Math.max(1, Math.ceil(boardHeight * scale));
    const brand = geneoPngBrandLayout(scale, attribution);
    return {
        width: Math.max(320, capturedWidth, brand.width + brand.inset * 2),
        height: Math.max(
            capturedHeight,
            Math.ceil((boardHeight - GENEO_PNG_PADDING) * scale + brand.height + brand.inset)
        ),
        brand
    };
}

function geneoPngOutputScale(boardWidth, boardHeight, attribution)
{
    const fits = scale =>
    {
        const dimensions = geneoPngDimensions(boardWidth, boardHeight, scale, attribution);
        return dimensions.width <= GENEO_PNG_MAX_SIDE
            && dimensions.height <= GENEO_PNG_MAX_SIDE
            && dimensions.width * dimensions.height <= GENEO_PNG_MAX_PIXELS;
    };
    if (fits(2)) return 2;
    let low = 0;
    let high = 2;
    for (let index = 0; index < 36; index++)
    {
        const middle = (low + high) / 2;
        if (fits(middle)) low = middle;
        else high = middle;
    }
    const scale = low * 0.999;
    if (scale < 0.01 || !fits(scale))
    {
        const error = new Error('Geneograph PNG exceeds the output capacity.');
        error.kind = 'capacity';
        throw error;
    }
    return scale;
}

function geneoPngFilename(title)
{
    const safe = String(title || '')
        .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
        .replace(/[. ]+$/g, '')
        .trim()
        .slice(0, 120);
    return `${safe || 'Geneograph-board'}.png`;
}

function geneoPngCanvasBlob(canvas)
{
    return new Promise((resolve, reject) =>
    {
        canvas.toBlob(blob =>
        {
            if (blob && blob.type === 'image/png' && blob.size > 8) resolve(blob);
            else reject(new Error('PNG encoding returned no image.'));
        }, 'image/png');
    });
}

async function runGeneographPngExport()
{
    if (geneoPngExportRuntime.busy) return;
    const originalBoard = selectedGeneographBoard();
    if (!originalBoard) return;

    geneoPngSetBusy(true);
    showActionToast({ message: t('Preparing PNG…'), duration: 600000 });
    let host = null;
    let capturedCanvas = null;
    let finalCanvas = null;

    try
    {
        if (state.geneoInlineEditNodeId) commitGeneoInlineEdit(false);
        geneoPngSetBusy(true);
        const board = selectedGeneographBoard();
        if (!board || board.id !== originalBoard.id) throw new Error('Board changed before export.');
        const boardTitle = board.title;
        const attribution = t('Created with GeneoGraph');
        const visibleNodes = board.diagram.nodes.filter(geneoNodeEffectiveVisible);
        if (!visibleNodes.length)
        {
            const error = new Error('No visible board objects.');
            error.kind = 'empty';
            throw error;
        }
        const requiredPhotos = geneoPngRequiredPhotos(board, visibleNodes);
        const liveStage = main.querySelector('[data-geneo-stage]');
        if (!liveStage) throw new Error('Board stage is not mounted.');

        const stage = liveStage.cloneNode(true);
        geneoPngRemoveEditorContent(stage);
        host = document.createElement('div');
        host.className = 'geneo-export-host';
        host.setAttribute('aria-hidden', 'true');
        host.appendChild(stage);
        document.body.appendChild(host);
        const bounds = geneoPngMeasure(stage);
        const boardWidth = bounds.right - bounds.left + GENEO_PNG_PADDING * 2;
        const boardHeight = bounds.bottom - bounds.top + GENEO_PNG_PADDING * 2;
        if (!Number.isFinite(boardWidth) || !Number.isFinite(boardHeight))
        {
            throw new Error('Invalid board bounds.');
        }
        const scale = geneoPngOutputScale(boardWidth, boardHeight, attribution);
        const background = geneoPaintCssColor(board.diagram.canvas.backgroundPaint);
        const frame = document.createElement('div');
        frame.className = 'geneo-export-snapshot';
        frame.style.width = `${boardWidth}px`;
        frame.style.height = `${boardHeight}px`;
        frame.style.backgroundColor = background;
        stage.style.position = 'absolute';
        stage.style.left = `${GENEO_PNG_PADDING - bounds.left}px`;
        stage.style.top = `${GENEO_PNG_PADDING - bounds.top}px`;
        frame.appendChild(stage);
        host.appendChild(frame);

        const logoPromise = geneoPngLogo();
        const [, , logo] = await Promise.all([
            document.fonts.ready,
            geneoPngPrepareImages(stage, requiredPhotos),
            logoPromise
        ]);
        capturedCanvas = await htmlToImage.toCanvas(frame, {
            width: boardWidth,
            height: boardHeight,
            pixelRatio: scale,
            skipAutoScale: true,
            fontEmbedCSS: '',
            backgroundColor: background
        });
        if (!capturedCanvas.width || !capturedCanvas.height)
        {
            throw new Error('Board capture returned an empty canvas.');
        }

        const dimensions = geneoPngDimensions(boardWidth, boardHeight, scale, attribution);
        finalCanvas = document.createElement('canvas');
        finalCanvas.width = Math.max(dimensions.width, capturedCanvas.width);
        finalCanvas.height = Math.max(dimensions.height, capturedCanvas.height);
        if (finalCanvas.width > GENEO_PNG_MAX_SIDE
            || finalCanvas.height > GENEO_PNG_MAX_SIDE
            || finalCanvas.width * finalCanvas.height > GENEO_PNG_MAX_PIXELS)
        {
            const error = new Error('PNG dimensions exceed capacity.');
            error.kind = 'capacity';
            throw error;
        }
        const context = finalCanvas.getContext('2d');
        if (!context) throw new Error('Canvas drawing is unavailable.');
        context.fillStyle = background;
        context.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
        context.drawImage(capturedCanvas, (finalCanvas.width - capturedCanvas.width) / 2, 0);
        const brand = dimensions.brand;
        const badgeLeft = finalCanvas.width - brand.inset - brand.width;
        const badgeTop = finalCanvas.height - brand.inset - brand.height;
        context.fillStyle = 'rgba(11, 15, 14, 0.92)';
        context.beginPath();
        context.roundRect(badgeLeft, badgeTop, brand.width, brand.height, Math.max(6, Math.round(8 * scale)));
        context.fill();
        context.font = `600 ${brand.fontSize}px Inter, Segoe UI, sans-serif`;
        context.fillStyle = '#EAF5F0';
        context.textBaseline = 'middle';
        const centerY = badgeTop + brand.height / 2;
        context.drawImage(logo, badgeLeft + brand.paddingX, centerY - brand.logoHeight / 2, brand.logoWidth, brand.logoHeight);
        context.fillText(attribution, badgeLeft + brand.paddingX + brand.logoWidth + brand.gap, centerY);

        const blob = await geneoPngCanvasBlob(finalCanvas);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = geneoPngFilename(boardTitle);
        try
        {
            document.body.appendChild(link);
            link.click();
        }
        finally
        {
            link.remove();
            setTimeout(() => URL.revokeObjectURL(url), 60000);
        }
        hideToast();
        showToast(t(scale < 1.999 ? 'PNG exported at reduced resolution.' : 'PNG download started.'));
    }
    catch (error)
    {
        if (error.kind !== 'empty') console.error('Geneograph PNG export failed:', error);
        hideToast();
        const message = error.kind === 'empty'
            ? 'Add visible objects before exporting this board.'
            : error.kind === 'asset'
                ? location.protocol === 'file:' && error.phase === 'embed'
                    ? 'This browser blocks local image access for PNG export. Serve the prototype locally and try again.'
                    : 'A required board image or the logo is unavailable. Check the asset and try again.'
                : error.kind === 'capacity'
                    ? 'This board is too large to export as one PNG.'
                    : 'The PNG could not be created. Try again or use a smaller board.';
        showToast(t(message));
    }
    finally
    {
        host?.remove();
        if (capturedCanvas)
        {
            capturedCanvas.width = 0;
            capturedCanvas.height = 0;
        }
        if (finalCanvas)
        {
            finalCanvas.width = 0;
            finalCanvas.height = 0;
        }
        geneoPngSetBusy(false);
    }
}
