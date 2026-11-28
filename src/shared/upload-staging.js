// Local import progress and transient staging previews. No canonical asset ownership.
function uploadYield()
{
    return new Promise(resolve => setTimeout(resolve, 0));
}

// Give the busy panel a rendering opportunity before expensive work, with a
// timer fallback for a hidden tab.
function uploadPaint()
{
    return new Promise(resolve =>
    {
        let frame;
        const timer = setTimeout(() => { if (frame !== undefined) cancelAnimationFrame(frame); resolve(); }, 100);
        frame = requestAnimationFrame(() => { clearTimeout(timer); setTimeout(resolve, 0); });
    });
}

function createUploadProgress(modal, input, drop)
{
    const panel = document.createElement('div');
    panel.className = 'upload-progress';
    panel.hidden = true;
    panel.innerHTML = '<strong data-upload-phase></strong><progress max="1" aria-label="' + escapeHtml(rpText('Import progress', 'Ход добавления')) + '"></progress><span data-upload-count></span><span class="upload-progress-announcement" role="status" aria-live="polite"></span>';
    modal.querySelector('.modal-header').after(panel);
    const phase = panel.querySelector('[data-upload-phase]'), bar = panel.querySelector('progress');
    const count = panel.querySelector('[data-upload-count]'), live = panel.querySelector('[role="status"]');
    const body = modal.querySelector('.modal-body') || modal;
    let disabled = [], total = 0, lastAnnouncement = 0, label = '';
    function update(processed, failed = 0, announce = false)
    {
        bar.value = processed;
        count.textContent = rpText(`${processed} of ${total} processed · ${failed} failed`, `Обработано: ${processed} из ${total} · Ошибок: ${failed}`);
        const now = performance.now();
        if (announce || processed === total || now - lastAnnouncement >= 1000)
        {
            live.textContent = label + '. ' + count.textContent;
            lastAnnouncement = now;
        }
    }
    return {
        begin(text, amount)
        {
            label = text; total = amount;
            disabled = [...modal.querySelectorAll('button, input')].map(node => [node, node.disabled]);
            disabled.forEach(([node]) => { node.disabled = true; });
            input.disabled = true;
            drop.setAttribute('aria-disabled', 'true');
            body.setAttribute('aria-busy', 'true');
            panel.hidden = false; phase.textContent = text; bar.max = Math.max(1, total);
            update(0, 0, true);
        },
        update,
        finalizing()
        {
            phase.textContent = rpText('Finishing import…', 'Завершение добавления…');
            bar.removeAttribute('value');
            live.textContent = phase.textContent;
        },
        end()
        {
            disabled.forEach(([node, wasDisabled]) => { node.disabled = wasDisabled; });
            disabled = [];
            drop.removeAttribute('aria-disabled');
            body.removeAttribute('aria-busy');
            panel.hidden = true;
        }
    };
}

const UPLOAD_PREVIEW_LIMIT = 32;
const UPLOAD_PREVIEW_BYTES = 2 * 1024 * 1024;
const uploadStagingSessions = new WeakMap();
let uploadPreviewJob = null;
function mountUploadStagingPreviews(modal, root, entries)
{
    uploadStagingSessions.get(modal)?.();
    if (typeof IntersectionObserver !== 'function') return;
    const files = new Map(entries.map(entry => [entry.id, entry.file]));
    const targets = new Map(), mounted = new Map();
    let disposed = false, bytes = 0, cancelLoad = null, timer = null;
    function detach(node)
    {
        const item = mounted.get(node);
        if (!item) return;
        mounted.delete(node); bytes -= item.bytes;
        for (const target of targets.values()) target.blocked = false;
        item.image.removeAttribute('src'); item.image.remove();
        URL.revokeObjectURL(item.url);
    }
    function schedule()
    {
        if (!disposed && timer === null)
            timer = setTimeout(() => { timer = null; pump(); }, 16);
    }
    async function pump()
    {
        if (disposed || mounted.size >= UPLOAD_PREVIEW_LIMIT) return;
        const target = [...targets.entries()].find(([node, item]) => item.visible && !item.failed && !item.blocked && !mounted.has(node));
        if (!target) return;
        if (uploadPreviewJob) { schedule(); return; }
        const [node, item] = target;
        uploadPreviewJob = item;
        let source = '', image;
        try
        {
            source = URL.createObjectURL(item.file);
            image = new Image();
            await new Promise((resolve, reject) =>
            {
                cancelLoad = () => { image.src = ''; reject(new Error('Preview canceled')); };
                image.onload = resolve; image.onerror = reject; image.src = source;
            });
            cancelLoad = null;
            if (disposed || !item.visible || !node.isConnected) return;
            if (!image.naturalWidth || !image.naturalHeight || image.naturalWidth * image.naturalHeight > 48 * 1024 * 1024)
            {
                item.failed = true; return;
            }
            const scale = Math.min(1, 192 / Math.max(image.naturalWidth, image.naturalHeight));
            const canvas = document.createElement('canvas');
            canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
            canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
            canvas.getContext('2d', { alpha: false }).drawImage(image, 0, 0, canvas.width, canvas.height);
            image.src = ''; URL.revokeObjectURL(source); source = '';
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', .72));
            if (!blob) { item.failed = true; return; }
            if (disposed || !item.visible || !node.isConnected) return;
            if (blob.size > UPLOAD_PREVIEW_BYTES) { item.failed = true; return; }
            if (bytes + blob.size > UPLOAD_PREVIEW_BYTES) { item.blocked = true; return; }
            const url = URL.createObjectURL(blob);
            const thumbnail = document.createElement('img');
            thumbnail.alt = ''; thumbnail.decoding = 'async';
            mounted.set(node, { image: thumbnail, url, bytes: blob.size });
            bytes += blob.size;
            thumbnail.addEventListener('error', () => { item.failed = true; detach(node); schedule(); }, { once: true });
            node.append(thumbnail); thumbnail.src = url;
        }
        catch (_) { if (item.visible && !disposed) item.failed = true; }
        finally
        {
            cancelLoad = null;
            if (image) { image.onload = image.onerror = null; image.src = ''; }
            if (source) URL.revokeObjectURL(source);
            uploadPreviewJob = null;
            schedule();
        }
    }
    const observer = new IntersectionObserver(entries =>
    {
        for (const entry of entries)
        {
            const item = targets.get(entry.target);
            if (!item) continue;
            item.visible = entry.isIntersecting;
            if (!item.visible) detach(entry.target);
        }
        schedule();
    }, { rootMargin: '100px' });
    const lifecycle = new MutationObserver(() => { if (!modal.isConnected) dispose(); });
    function dispose()
    {
        if (disposed) return;
        disposed = true; observer.disconnect(); lifecycle.disconnect(); cancelLoad?.();
        if (timer !== null) clearTimeout(timer);
        for (const node of mounted.keys()) detach(node);
        targets.clear();
        if (uploadStagingSessions.get(modal) === dispose) uploadStagingSessions.delete(modal);
    }
    uploadStagingSessions.set(modal, dispose);
    lifecycle.observe(modalBackdrop, { childList: true, subtree: true });
    root.querySelectorAll('[data-upload-preview]').forEach(node =>
    {
        const file = files.get(node.dataset.uploadPreview);
        if (file) { targets.set(node, { file, visible: false, failed: false, blocked: false }); observer.observe(node); }
    });
}
