const geneoBoardPreviewCache = new Map();

function invalidateGeneographBoardPreview(boardId)
{
    geneoBoardPreviewCache.delete(boardId);
}

function geneoPreviewVisibleNodes(diagram)
{
    const byId = new Map(diagram.nodes.map(node => [node.id, node]));
    const visible = node =>
    {
        const seen = new Set();
        while (node)
        {
            if (!node.visible || seen.has(node.id)) return false;
            seen.add(node.id);
            node = byId.get(node.parentPanelId);
        }
        return true;
    };
    return diagram.nodes.filter(node => node.width > 0 && node.height > 0 && visible(node));
}

function geneoPreviewCenter(node)
{
    return { x: node.x + node.width / 2, y: node.y + node.height / 2 };
}

function geneoPreviewScene(nodes)
{
    const subjects = nodes.filter(node => node.type !== 'panel');
    const content = subjects.length ? subjects : nodes;
    const bounds = {
        left: Math.min(...content.map(node => node.x)),
        top: Math.min(...content.map(node => node.y)),
        right: Math.max(...content.map(node => node.x + node.width)),
        bottom: Math.max(...content.map(node => node.y + node.height))
    };
    const middle = { x: (bounds.left + bounds.right) / 2, y: (bounds.top + bounds.bottom) / 2 };
    let focus = middle;
    let bestScore = -Infinity;
    const candidates = content.filter(node => node.type === 'person');
    for (const candidate of (candidates.length ? candidates : content).slice(0, 160))
    {
        const center = geneoPreviewCenter(candidate);
        let score = 0;
        for (const node of content)
        {
            const point = geneoPreviewCenter(node);
            const distance = Math.hypot(point.x - center.x, point.y - center.y);
        if (distance < 650) score += (node.type === 'person' ? 4 : 1) * (1 - distance / 850);
        }
        score -= Math.hypot(center.x - middle.x, center.y - middle.y) / 10000;
        if (score > bestScore)
        {
            bestScore = score;
            focus = center;
        }
    }
    const nearby = content.filter(node =>
    {
        const center = geneoPreviewCenter(node);
        return Math.hypot(center.x - focus.x, center.y - focus.y) < 650;
    });
    const cluster = nearby.length ? nearby : content;
    const clusterBounds = {
        left: Math.min(...cluster.map(node => node.x)),
        top: Math.min(...cluster.map(node => node.y)),
        right: Math.max(...cluster.map(node => node.x + node.width)),
        bottom: Math.max(...cluster.map(node => node.y + node.height))
    };
    return { bounds, clusterBounds, focus };
}

function geneoPreviewFrame(scene, mode)
{
    const aspect = mode === 'square' ? 1 : 3 / 2;
    const { bounds, clusterBounds } = scene;
    const contentWidth = bounds.right - bounds.left;
    const contentHeight = bounds.bottom - bounds.top;
    const fitAll = mode === 'wide'
        ? contentWidth <= 900 && contentHeight <= 600
        : contentWidth <= 1000 && contentHeight <= 800;
    const target = fitAll ? bounds : clusterBounds;
    let width = Math.max(mode === 'square' ? 420 : 480, (target.right - target.left) * 1.08);
    let height = Math.max(mode === 'square' ? 420 : 320, (target.bottom - target.top) * 1.08);
    if (width / height < aspect) width = height * aspect;
    else height = width / aspect;
    const center = {
        x: (target.left + target.right) / 2,
        y: (target.top + target.bottom) / 2
    };
    return { x: center.x - width / 2, y: center.y - height / 2, width, height };
}

function geneoPreviewIntersects(node, frame)
{
    return node.x < frame.x + frame.width && node.x + node.width > frame.x
        && node.y < frame.y + frame.height && node.y + node.height > frame.y;
}

function geneoPreviewImage(node, board)
{
    if (node.type === 'image')
        return resolveGeneographImageSource(node, { board, diagram: board.diagram }).photo?.src || '';
    if (node.type !== 'person') return '';
    const person = board.diagram.people.find(item => item.id === node.personId);
    if (!person) return '';
    const linked = person.treePersonId ? getPerson(person.treePersonId) : null;
    const photoId = person.photoId || (linked?.projectId === board.projectId ? linked.primaryPhotoId : null);
    const photo = photoId ? getPhoto(photoId, { projectId: board.projectId }) : null;
    return (!photo?.deletedAt && photo?.src)
        || getGeneographBoardAsset(person.photoAssetId, board.diagram)?.src || '';
}

function geneoPreviewMediaSignature(board)
{
    const ids = new Set();
    for (const node of board.diagram.nodes)
    {
        if (node.type === 'image' && node.imageRef?.scope === 'project') ids.add(node.imageRef.id);
        if (node.type !== 'person') continue;
        const person = board.diagram.people.find(item => item.id === node.personId);
        const linked = person?.treePersonId ? getPerson(person.treePersonId) : null;
        const photoId = person?.photoId || (linked?.projectId === board.projectId ? linked.primaryPhotoId : null);
        if (photoId) ids.add(photoId);
    }
    return [...ids].sort().map(id =>
    {
        const photo = getPhoto(id, { projectId: board.projectId });
        return `${id}:${photo?.updatedAt || ''}:${photo?.deletedAt || ''}:${photo?.src?.length || 0}`;
    }).join('|');
}

function geneoPreviewPort(reference, byId, diagram)
{
    let node = byId.get(reference?.nodeId);
    if (!node && reference?.familyId)
    {
        const family = diagram.families.find(item => item.id === reference.familyId);
        const partners = diagram.nodes.filter(item => item.type === 'person'
            && family?.partnerIds.includes(item.personId) && byId.has(item.id));
        if (!partners.length) return null;
        const centers = partners.map(geneoPreviewCenter);
        return {
            x: centers.reduce((sum, point) => sum + point.x, 0) / centers.length,
            y: centers.reduce((sum, point) => sum + point.y, 0) / centers.length
        };
    }
    if (!node) return null;
    const center = geneoPreviewCenter(node);
    return reference.port === 'top' ? { x: center.x, y: node.y }
        : reference.port === 'bottom' ? { x: center.x, y: node.y + node.height }
            : reference.port === 'left' ? { x: node.x, y: center.y }
                : reference.port === 'right' ? { x: node.x + node.width, y: center.y }
                    : center;
}

function geneoPreviewNode(node, board)
{
    const { x, y, width, height } = node;
    const appearance = geneoResolveVisibleNodeAppearance(node, board.diagram);
    const fill = geneoPaintCssColor(appearance.fill, { disabledColor: '#1B2522' });
    const stroke = geneoPaintCssColor(appearance.stroke, { disabledColor: '#52615D' });
    const outline = `fill="${escapeHtml(fill)}" stroke="${escapeHtml(stroke)}" stroke-width="2"`;
    if (node.type === 'drawing' && Array.isArray(node.points) && node.points.length > 1)
    {
        const points = node.points.map(point => `${x + point.x * width},${y + point.y * height}`).join(' ');
        return `<polyline points="${escapeHtml(points)}" fill="none" stroke="${escapeHtml(stroke)}" stroke-width="4"/>`;
    }
    if (node.type === 'shape' && node.shapeKind === 'ellipse')
        return `<ellipse cx="${x + width / 2}" cy="${y + height / 2}" rx="${width / 2}" ry="${height / 2}" ${outline}/>`;
    const radius = node.type === 'person' ? 10 : node.type === 'sticky' ? 3 : 7;
    let content = '';
    const image = geneoPreviewImage(node, board);
    if (node.type === 'image')
    {
        content = image ? `<image href="${escapeHtml(image)}" x="${x + 3}" y="${y + 3}"
            width="${Math.max(1, width - 6)}" height="${Math.max(1, height - 6)}" preserveAspectRatio="xMidYMid slice"/>`
            : `<path d="M ${x + width * .18} ${y + height * .73} L ${x + width * .43} ${y + height * .4}
               L ${x + width * .58} ${y + height * .58} L ${x + width * .73} ${y + height * .34}" fill="none" stroke="#879D93" stroke-width="5"/>`;
    }
    else if (node.type === 'person')
    {
        const photoSize = Math.min(height - 16, width * .27, 72);
        content = `<rect x="${x + 8}" y="${y + 8}" width="${photoSize}" height="${photoSize}" rx="5" fill="#31423B"/>`
            + (image ? `<image href="${escapeHtml(image)}" x="${x + 8}" y="${y + 8}"
                width="${photoSize}" height="${photoSize}" preserveAspectRatio="xMidYMid slice"/>` : '')
            + `<rect x="${x + photoSize + 17}" y="${y + 15}" width="${Math.max(8, width - photoSize - 31)}" height="8" rx="4" fill="#DCE8E1" opacity=".82"/>`
            + `<rect x="${x + photoSize + 17}" y="${y + 33}" width="${Math.max(8, (width - photoSize - 31) * .63)}" height="6" rx="3" fill="#A7BCB1" opacity=".55"/>`;
    }
    else if (node.type === 'sticky' || node.type === 'text' || node.type === 'panel')
    {
        const lines = node.type === 'panel' ? 1 : 3;
        content = Array.from({ length: lines }, (_, index) =>
            `<rect x="${x + 14}" y="${y + 16 + index * 19}" width="${Math.max(10, (width - 28) * (index === 0 ? .7 : index === 1 ? .86 : .54))}"
                height="${index === 0 ? 8 : 5}" rx="3" fill="#DBE9E1" opacity="${index === 0 ? .58 : .3}"/>`).join('');
    }
    else if (node.type === 'place')
        content = `<circle cx="${x + 24}" cy="${y + height / 2}" r="9" fill="#80B9C6"/>
            <rect x="${x + 42}" y="${y + height / 2 - 4}" width="${Math.max(10, width - 58)}" height="8" rx="4" fill="#DCE8E1" opacity=".72"/>`;
    return `<g><rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" ${outline}/>${content}</g>`;
}

function geneoPreviewFallback(board)
{
    const seed = [...board.id].reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const offset = seed % 36;
    return `<svg class="geneo-preview-art" viewBox="0 0 400 184" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <rect width="400" height="184" fill="#111A17"/>
        <path d="M ${95 + offset} 68 H 198 V 112 H ${307 - offset}" fill="none" stroke="#638E7C" stroke-width="3"/>
        <rect x="${45 + offset}" y="45" width="100" height="48" rx="6" fill="#20362D" stroke="#62977B"/>
        <rect x="${258 - offset}" y="89" width="100" height="48" rx="6" fill="#31322A" stroke="#B49562"/>
        <circle cx="${72 + offset}" cy="69" r="12" fill="#547D69"/>
        <circle cx="${285 - offset}" cy="113" r="12" fill="#967A55"/>
    </svg>`;
}

function geneoPreviewSvg(board, mode, nodes, scene)
{
    const frame = geneoPreviewFrame(scene, mode);
    const visible = nodes.filter(node => geneoPreviewIntersects(node, frame));
    const byId = new Map(nodes.map(node => [node.id, node]));
    const connections = board.diagram.connections.filter(connection =>
    {
        const source = geneoPreviewPort(connection.source, byId, board.diagram);
        const target = geneoPreviewPort(connection.target, byId, board.diagram);
        return connection.visible !== false && source && target && connection.style?.line?.enabled;
    }).map(connection =>
    {
        const source = geneoPreviewPort(connection.source, byId, board.diagram);
        const target = geneoPreviewPort(connection.target, byId, board.diagram);
        const points = [source, ...(connection.route?.mode === 'manual' ? connection.route.waypoints || [] : []), target];
        return `<polyline points="${points.map(point => `${point.x},${point.y}`).join(' ')}" fill="none"
            stroke="${escapeHtml(geneoPaintCssColor(connection.style.line))}"
            stroke-width="${Math.max(2, connection.style.width || 2)}"
            ${connection.style.pattern === 'dashed' ? 'stroke-dasharray="9 7"' : ''}/>`;
    }).join('');
    const background = geneoPaintCssColor(board.diagram.canvas.backgroundPaint, { disabledColor: '#111A17' });
    const ordered = visible.slice().sort((a, b) => (a.type === 'panel' ? -1000 : 0) + a.order
        - ((b.type === 'panel' ? -1000 : 0) + b.order));
    return `<svg class="geneo-preview-art" viewBox="${frame.x} ${frame.y} ${frame.width} ${frame.height}"
        preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <rect x="${frame.x}" y="${frame.y}" width="${frame.width}" height="${frame.height}"
            fill="${escapeHtml(background)}"/>
        ${connections}${ordered.map(node => geneoPreviewNode(node, board)).join('')}
    </svg>`;
}

function renderGeneographBoardPreview(board, mode = 'wide')
{
    const cached = geneoBoardPreviewCache.get(board.id);
    const mediaSignature = geneoPreviewMediaSignature(board);
    if (cached?.board === board && cached.modifiedAt === board.modifiedAt
        && cached.mediaSignature === mediaSignature && cached[mode])
        return cached[mode];
    const nodes = geneoPreviewVisibleNodes(board.diagram);
    const scene = nodes.length ? geneoPreviewScene(nodes) : null;
    const html = scene ? geneoPreviewSvg(board, mode, nodes, scene) : geneoPreviewFallback(board);
    const entry = cached?.board === board && cached.modifiedAt === board.modifiedAt
        && cached.mediaSignature === mediaSignature
        ? cached : { board, modifiedAt: board.modifiedAt, mediaSignature };
    entry[mode] = html;
    geneoBoardPreviewCache.set(board.id, entry);
    return html;
}
