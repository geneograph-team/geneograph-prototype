// Use on an isolated app page with deviceScaleFactor 2.
async function runTreeSemanticZoomChecks()
{
    const check = (condition, name) => { if (!condition) throw Error(name); };
    const pause = () => new Promise(resolve => setTimeout(resolve, 20));
    async function until(predicate)
    {
        for (let i = 0; i < 250; i++)
        {
            if (predicate()) return;
            await pause();
        }
        throw Error('Semantic zoom wait timed out');
    }

    const stages = [['marker', 0], ['label', .16], ['actions', 46 / 124],
        ['compact', .58], ['short', .76], ['full', 278 / 300]];
    for (let i = 1; i < stages.length; i++)
    {
        const [stage, edge] = stages[i];
        check(treeDetailLevel(edge + .00001) === stage && treeDetailLevel(edge - .00001) === stages[i - 1][0], stage + ' boundary');
    }
    const date = (year, month, day, type = 'Exact date', second) =>
        ({ state: 'known', dateType: type, calendar: 'Gregorian', first: { year, month, day }, second });
    const born = date(1936, 3, 12), died = date(2014, 10, 4);
    const dates = (a, b, status, language = 'en', compact = false) =>
        treeCardDatePresentation(a, b, status, language, compact).join('|');
    check(dates(born, died, 'Living') === '12 Mar 1936|– 4 Oct 2014', 'Precise facts beat inconsistent living status');
    check(dates(born, died, '', 'en', true) === '1936–2014', 'Compact years');
    check(dates(born, died, '', 'ru', true) === '1936–2014' && dates(born, died, '', 'ru').includes('мар'), 'Russian dates');
    check(dates(date(1965), null, 'Living') === '1965' && dates(date(1904), null, 'Unknown') === '1904–?'
        && dates(date(1904), null, 'Deceased') === '1904–?', 'Birth-only and status');
    check(dates(null, date(1974), 'Unknown') === '?–1974', 'Death-only');
    check(dates(null, null, 'Living') === '' && dates(null, null, 'Unknown') === 'Unknown'
        && dates(null, null, 'Deceased') === 'Deceased', 'Status-only');
    check(dates(date(1880, null, null, 'About / Circa'), date(1950, null, null, 'Before'), '', 'en', true)
        === 'c. 1880–bef. 1950', 'Circa and before');
    check(dates(date(1880, null, null, 'Calculated'), date(1950, null, null, 'After'), '', 'ru', true)
        === 'выч. 1880–после 1950', 'Calculated and after');
    check(dates(date(1900, null, null, 'Between', { year: 1902 }), null, '', 'en', true).startsWith('bet. 1900–1902'), 'Range qualifier');
    check(dates(date(1950, 3), null, 'Living') === 'Mar 1950'
        && dates(date(null, 3, 4), null, 'Living', 'en', true) === '4 Mar', 'Partial precision');
    check(treeCardInitials({ names: { first: 'E\u0301lise', last: 'De León', middle: 'Dropped' } }).pair === 'E\u0301D'
        && treeCardInitials({ names: { first: 'Анна', last: 'Ильина' } }).pair === 'АИ'
        && treeCardInitials({ names: { last: 'Одно' } }).single === 'О'
        && treeCardInitials({}).single === '?', 'Unicode, single and unnamed initials');

    let upgrade = 'delay';
    const original = generatePortraitThumbnail;
    generatePortraitThumbnail = async request =>
    {
        if (request.tier === 256 && upgrade !== 'pass')
        {
            for (let i = 0; i < 9; i++) await pause();
            if (upgrade === 'fail') throw new Error('Synthetic image failure');
        }
        return original(request);
    };
    activateProject('p1', { moduleName: 'Family Tree' });
    await until(() => treeRenderRuntime?.scene);
    const runtime = treeRenderRuntime;
    const id = treeProjectViewState().focusPersonId;
    const person = getPerson(id);
    person.names = { first: 'Александра', middle: 'Константиновна', last: 'Горбенко-Коломийцева', maiden: 'Ильина' };
    person.gender = 'female';
    person.birth = born;
    person.death = died;
    const photo = getPhoto(person.primaryPhotoId, { projectId: runtime.projectId });
    const synthetic = document.createElement('canvas');
    synthetic.width = 800;
    synthetic.height = 1000;
    const ctx = synthetic.getContext('2d');
    ctx.fillStyle = '#446b96';
    ctx.fillRect(0, 0, 800, 1000);
    photo.src = synthetic.toDataURL();
    renderFamilyTree();
    const geometry = treeElkRequest.geometry, scene = runtime.scene;
    const projected = runtime.scene.primaryByPerson.get(id);
    const card = () => runtime.cards.querySelector('[data-person-id="' + id + '"]');
    const image = () => card()?.querySelector('.tree-portrait-image');
    const show = selector => getComputedStyle(card().querySelector(selector)).display !== 'none'
        && card().querySelector(selector).getBoundingClientRect().width > 0;
    const scale = value =>
    {
        setTreeViewport(runtime, 0, 0, value);
        centerTreeOnOccurrence(projected);
        flushTreeViewport(runtime);
    };
    scale(.79);
    await until(() => image()?.naturalWidth === 96);
    check(show('.tree-name-compact') && !show('.tree-name-full')
        && !card().querySelector('.tree-name-compact').textContent.includes('Константиновна')
        && card().querySelector('.tree-name-compact').textContent.includes('Ильина'), 'Short canonical name');
    const node = card(), small = image().src;
    scale(1);
    check(card() === node && image()?.src === small, 'First upgrade frame flashed initials');
    upgrade = 'fail';
    for (let i = 0; i < 13; i++)
    {
        await pause();
        check(image()?.src === small && image().naturalWidth === 96, 'Failed upgrade removed valid photo');
    }
    check(card().getAttribute('aria-label').includes('Константиновна')
        && show('.tree-name-full') && show('.tree-dates-full'), 'Full identity and dates');

    for (const [value, name] of [[.77, 'short'], [.88, 'short'], [1.1, 'full'], [.9, 'short'], [1, 'full']])
    {
        scale(value);
        check(runtime.stage.dataset.detailLevel === name && image()?.src === small, 'Zoom sweep changed valid photo');
    }
    scale(.6);
    check(!show('.tree-avatar') && !image() && show('.tree-dates-compact'), 'Compact removed portrait and kept dates');
    scale(1);
    await until(() => image()?.src === small);
    check(image().naturalHeight === 128, 'Compatible cached image alone did not restore portrait');
    const avatar = card().querySelector('.tree-avatar').getBoundingClientRect();
    check(Math.abs(avatar.width / avatar.height - .75) < .002, 'Portrait footprint is not 3:4');

    scale(.38);
    const action = card().querySelector('[data-card-edit]');
    action.focus();
    check(action.getBoundingClientRect().width >= 24 && !show('.tree-dates-compact'), 'Actions stage target or dates');
    check(document.activeElement === action, 'Edit action did not receive keyboard focus');
    scale(.3);
    check(document.activeElement === card() && !show('.card-actions') && show('.tree-given-name'), 'Label focus fallback');
    scale(.13);
    check(!show('.tree-given-name') && card().getAttribute('aria-label').includes('Александра'), 'Marker identity');
    scale(.79);
    await until(() => image()?.src === small);
    upgrade = 'pass';
    scale(1.79);
    check(image()?.src === small, 'Successful upgrade caused an intermediate blank');
    await until(() => image()?.naturalWidth === 384);
    check(image()?.src !== small && image().naturalHeight === 512 && image().src.startsWith('blob:'), 'Higher tier did not swap atomically');
    check(runtime.scene === scene && treeElkRequest.geometry === geometry && card() === node, 'Semantic zoom rebuilt the geometry or card');

    scale(1);
    photo.src = 'data:image/png;base64,invalid';
    renderFamilyTree();
    check(!image(), 'Source revision leaked an old portrait');
    await until(() => portraitThumbnailJobs === 0);
    check(show('.tree-initial-pair') && !show('.tree-initial-single'), 'Only paired initials should show in Full');
    check(card().querySelector('.tree-initial-pair').textContent === 'АГ', 'Full fallback uses given and family initials');
    scale(.77);
    check(show('.tree-initial-single') && !show('.tree-initial-pair')
        && card().querySelector('.tree-initial-single').textContent === 'А', 'Adaptive single initial');
    scale(1);
    card().querySelector('[data-card-edit]').click();
    check(document.querySelector('.add-person-modal'), 'Edit action did not open the editor');
    closeModal({ force: true });
    card().querySelector('[data-card-add]').click();
    check(document.querySelector('#relativePopover'), 'Add relative action did not open its menu');
    closeMenu();
    return { stages: 6, dates: true, name: true, portraitContinuity: true, cachedReentry: true, keyboard: true, derivativeFailure: true };
}

if (typeof module !== 'undefined') module.exports = runTreeSemanticZoomChecks;
