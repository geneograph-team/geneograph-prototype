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
    return `<svg class="geneo-connections" viewBox="${bounds.left} ${bounds.top} ${bounds.width} ${bounds.height}" style="--geneo-connection-hit-width:${14 / Math.max(.1, state.geneoZoom / 100)}px;--geneo-segment-hit-width:${18 / Math.max(.1, state.geneoZoom / 100)}px" aria-label="Board connections">
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
            <path class="geneo-connection-hit" d="${path}" data-geneo-connection="${escapeHtml(connection.id)}" role="button" tabindex="0" aria-label="${escapeHtml(geneoConnectionLabel(connection))}"></path>
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
            ${familyJunction ? `<circle class="geneo-family-junction" cx="${familyJunction.x}" cy="${familyJunction.y}" r="7" data-geneo-family-junction="${escapeHtml(connection.familyId)}" tabindex="0"><title>${escapeHtml(t('Connect child to this family'))}</title></circle>` : ''}
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
            style="${cropStyle ? `${cropStyle};` : ''}--geneo-image-opacity: ${geneoNumber(node.appearance?.imageOpacity, 100, 0, 100) / 100};">
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
            ${geneoEffectiveNodeShadow(node, selectedGeneographDiagram(), visibleFill) ? 'geneo-shadow-on' : 'geneo-shadow-off'}
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

