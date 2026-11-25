// Keep portrait leases tied to the mounted renderer and its current visible cards.
function treePortraitDescriptor(runtime, id)
{
    if (runtime.portraitRevision !== runtime.contentRevision)
    {
        runtime.portraitRevision = runtime.contentRevision;
        runtime.portraitDescriptors = new Map();
        runtime.portraitSources = new Map();
    }
    if (runtime.portraitDescriptors.has(id)) return runtime.portraitDescriptors.get(id);
    const person = getPerson(id);
    const photo = person?.projectId === runtime.projectId
        ? getPhoto(person.primaryPhotoId, { projectId: runtime.projectId }) : null;
    let descriptor = null;
    if (photo?.src)
    {
        let source = runtime.portraitSources.get(photo.id);
        if (source === undefined)
        {
            try { source = portraitThumbnailSource(photo); }
            catch { source = ''; }
            runtime.portraitSources.set(photo.id, source);
        }
        if (source)
        {
            const region = photoPersonRegion(photo, id);
            const crop = region ? null : normalizePersonPhotoCrop(person.primaryPhotoCrop);
            // Use the immutable source string once per photo and scene revision, not on camera frames.
            runtime.portraitSourceTokens ||= new WeakMap();
            const previous = runtime.portraitSourceTokens.get(photo);
            const token = previous?.source === source ? previous.token : (runtime.portraitToken = (runtime.portraitToken || 0) + 1);
            runtime.portraitSourceTokens.set(photo, { source, token });
            descriptor = { key: JSON.stringify([runtime.projectId, photo.id, token, region || crop]),
                request: { source, region, crop, sourcePixels: Number(photo.width) * Number(photo.height) } };
        }
    }
    runtime.portraitDescriptors.set(id, descriptor);
    return descriptor;
}

function updateTreePortraits(runtime, visible, detail, size, aspect = 1)
{
    const leases = runtime.portraitLeases ||= new Map();
    const demand = new Map();
    const canvas = runtime.canvas.getBoundingClientRect();
    for (const card of runtime.cards.children)
    {
        if ((detail !== 'full' && detail !== 'short') || !treeSceneIntersects(visible, card.__data__.bounds)) continue;
        const avatar = card.querySelector('.tree-avatar');
        if (!avatar) continue;
        const rect = avatar.getBoundingClientRect();
        if (!rect.width || !rect.height || rect.right <= canvas.left || rect.left >= canvas.right
            || rect.bottom <= canvas.top || rect.top >= canvas.bottom) continue;
        const tier = portraitThumbnailTier(Math.max(rect.width, rect.height) || size);
        const descriptor = treePortraitDescriptor(runtime, card.dataset.personId);
        if (descriptor) demand.set(avatar, { key: descriptor.key + '|' + aspect + '|' + tier, tier, descriptor });
    }

    for (const [avatar, lease] of leases)
    {
        if (demand.get(avatar)?.key === lease.key) continue;
        avatar.querySelector('img')?.remove();
        avatar.classList.remove('has-photo');
        lease.release();
        leases.delete(avatar);
    }
    if (!demand.size) return;
    const cache = runtime.portraitCache ||= createPortraitThumbnailCache();
    for (const [avatar, { key, tier, descriptor }] of demand)
    {
        if (leases.has(avatar)) continue;
        const release = cache.subscribe(key, { ...descriptor.request, aspect, tier }, url =>
        {
            if (!avatar.isConnected || runtime.stage.hidden) return;
            const image = document.createElement('img');
            image.className = 'tree-portrait-image';
            image.alt = '';
            image.decoding = 'async';
            image.draggable = false;
            image.onload = () => { if (image.parentNode === avatar) avatar.classList.add('has-photo'); };
            image.onerror = () => image.remove();
            image.src = url;
            avatar.append(image);
        });
        if (release) leases.set(avatar, { key, release });
    }
}

function clearTreePortraits(runtime)
{
    for (const [avatar, lease] of runtime.portraitLeases || [])
    {
        avatar.querySelector('img')?.remove();
        avatar.classList.remove('has-photo');
        lease.release();
    }
    runtime.portraitLeases?.clear();
}
