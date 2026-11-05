(function ()
{
    const storageKey = 'geneograph-theme';
    const media = window.matchMedia?.('(prefers-color-scheme: dark)');
    let preference = 'system';
    try
    {
        const stored = window.localStorage.getItem(storageKey);
        if (stored === 'dark' || stored === 'light') preference = stored;
    }
    catch (_error) {}

    function resolved()
    {
        return preference === 'system' ? (media?.matches ? 'dark' : 'light') : preference;
    }

    function apply()
    {
        const theme = resolved();
        document.documentElement.dataset.theme = theme;
        document.documentElement.style.colorScheme = theme;
        window.dispatchEvent(new CustomEvent('geneograph-theme-change', { detail: { theme, preference } }));
    }

    window.geneographTheme = {
        getPreference: () => preference,
        getResolved: resolved,
        setPreference(value)
        {
            if (!['system', 'dark', 'light'].includes(value)) return;
            preference = value;
            try { window.localStorage.setItem(storageKey, value); } catch (_error) {}
            apply();
        }
    };
    window.geneoThemeColor = (dark, light) => resolved() === 'light' ? light : dark;
    media?.addEventListener?.('change', () => { if (preference === 'system') apply(); });
    apply();
})();
