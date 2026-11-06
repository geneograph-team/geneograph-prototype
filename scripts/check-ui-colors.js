'use strict';

// UI color ownership check. Run: node scripts/check-ui-colors.js
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const exceptions = JSON.parse(fs.readFileSync(path.join(__dirname, 'ui-color-exceptions.json'), 'utf8'));
const colorPattern = /(?<!&)#[0-9a-fA-F]{3,8}\b|%23[0-9a-fA-F]{6}\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch)\(\s*(?:[\d.+-]|from\s)|(?:color|background(?:-color)?|fill|stroke)\s*[:=]\s*["']?(?:white|black|red|blue|green|yellow|orange|purple|pink|gray|grey)\b/gi;

const paletteData = JSON.parse(fs.readFileSync(path.join(root, 'src/core/palette/geneograph-v3.json'), 'utf8'));
const paletteCss = fs.readFileSync(path.join(root, 'src/core/palette/geneograph-v3.css'), 'utf8');
const kebab = value => value.replace(/[A-Z]/g, letter => '-' + letter.toLowerCase());
const cssFiles = [path.join(root, 'src/core/palette/geneograph-v3.css'), ...walk(path.join(root, 'src')).filter(file => file.endsWith('.css'))];
const runtimeVariables = /^--(?:geneo-(?:canvas|node|grid|crop|paint|suggestion|connection|segment|card|hue)|project-hero-cover|albums-card-width|cover(?:-|$)|photo-|tree-|relationship-)/;

function unresolvedTokens(files, extraSource = '')
{
    const definitions = new Set();
    const references = [];
    const sources = files.map(full => ({ full, source: fs.readFileSync(full, 'utf8') }));
    if (extraSource) sources.push({ full: path.join(root, 'src', 'token-probe.css'), source: extraSource });
    for (const { full, source: rawSource } of sources)
    {
        const source = rawSource.replace(/\/\*[\s\S]*?\*\//g, '');
        for (const match of source.matchAll(/(--[\w-]+)\s*:/g)) definitions.add(match[1]);
        for (const match of source.matchAll(/var\(\s*(--[\w-]+)\s*([,)])/g))
        {
            if (match[2] === ')' && !runtimeVariables.test(match[1]))
            {
                references.push({ name: match[1], file: full, line: source.slice(0, match.index).split('\n').length });
            }
        }
    }
    return references.filter(item => !definitions.has(item.name)).map(item => `${path.relative(root, item.file)}:${item.line}: unresolved ${item.name}`);
}

function contrast(foreground, background)
{
    const luminance = hex =>
    {
        const channels = hex.match(/[\da-f]{2}/gi).map(value => parseInt(value, 16) / 255);
        const linear = channels.map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
        return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
    };
    const a = luminance(foreground);
    const b = luminance(background);
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

function contrastErrors()
{
    const errors = [];
    for (const theme of ['light', 'dark'])
    {
        const foundation = paletteData.foundations[theme];
        const pairs = [
            ['text/background', foundation.text, foundation.background, 4.5],
            ['secondary/panel', foundation.textSecondary, foundation.panel, 4.5],
            ['muted/field', foundation.textMuted, foundation.field, 4.5],
            ['on-primary/primary', foundation.onPrimary, foundation.primary, 4.5],
            ['on-selected/selected-row', foundation.onSelected, foundation.selectedRow, 4.5]
        ];
        for (const [name, foreground, background, minimum] of pairs)
        {
            if (contrast(foreground, background) < minimum) errors.push(`${theme} ${name}: contrast below ${minimum}:1`);
        }
        for (const [family, values] of Object.entries(paletteData.accentFamilies))
        {
            const colors = values[theme];
            for (const [name, foreground, background] of [['accent', colors.onAccent, colors.accent], ['container', colors.onContainer, colors.container]])
            {
                if (contrast(foreground, background) < 4.5) errors.push(`${theme} ${family} ${name}: contrast below 4.5:1`);
            }
        }
        for (const [status, values] of Object.entries(paletteData.statuses))
        {
            const colors = values[theme];
            for (const [name, foreground, background] of [['accent', colors.onAccent, colors.accent], ['container', colors.onContainer, colors.container]])
            {
                if (contrast(foreground, background) < 4.5) errors.push(`${theme} ${status} ${name}: contrast below 4.5:1`);
            }
        }
    }
    return errors;
}
function paletteDrift()
{
    const errors = [];
    for (const theme of ['light', 'dark'])
    {
        const block = paletteCss.match(new RegExp('\\[data-theme="' + theme + '"\\]\\s*\\{([\\s\\S]*?)\\}'));
        if (!block) { errors.push('Missing ' + theme + ' palette block'); continue; }
        const actual = Object.fromEntries([...block[1].matchAll(/(--[\w-]+):\s*(#[\da-fA-F]{6})/g)].map(match => [match[1], match[2].toUpperCase()]));
        const expected = {};
        for (const [name, value] of Object.entries(paletteData.foundations[theme])) expected['--gg-' + kebab(name)] = value;
        for (const [name, value] of Object.entries(paletteData.m3RoleAliases[theme])) expected['--md-sys-color-' + kebab(name)] = value;
        for (const [family, data] of Object.entries(paletteData.accentFamilies)) for (const [name, value] of Object.entries(data[theme])) expected['--gg-accent-' + family + '-' + kebab(name)] = value;
        for (const [status, data] of Object.entries(paletteData.statuses)) for (const [name, value] of Object.entries(data[theme])) expected['--gg-status-' + status + '-' + kebab(name)] = value;
        for (const [name, value] of Object.entries(expected)) if (actual[name] !== value.toUpperCase()) errors.push(theme + ' ' + name + ': approved ' + value + ', CSS ' + (actual[name] || 'missing'));
    }
    return errors;
}

function walk(dir)
{
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry =>
    {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory())
        {
            if (['vendor', 'assets', 'palette'].includes(entry.name)) return [];
            return walk(full);
        }
        return /\.(css|html|js)$/.test(entry.name) ? [full] : [];
    });
}

function matches(text)
{
    return [...text.matchAll(colorPattern)].map(match => ({
        value: match[0],
        line: text.slice(0, match.index).split('\n').length
    }));
}

if (process.argv[2] === '--check-text')
{
    const found = matches(process.argv.slice(3).join(' '));
    if (found.length) console.error(`Illegal UI color: ${found[0].value}`);
    process.exit(found.length ? 1 : 0);
}

if (process.argv[2] === '--check-token-text')
{
    const errors = unresolvedTokens(cssFiles, process.argv.slice(3).join(' '));
    if (errors.length) console.error(errors.join('\n'));
    process.exit(errors.length ? 1 : 0);
}

if (process.argv[2] === '--check-pair')
{
    const ratio = contrast(process.argv[3], process.argv[4]);
    if (ratio < 4.5) console.error(`Contrast ${ratio.toFixed(2)}:1 is below 4.5:1`);
    process.exit(ratio < 4.5 ? 1 : 0);
}

const errors = paletteDrift();
errors.push(...unresolvedTokens(cssFiles), ...contrastErrors());
for (const full of walk(path.join(root, 'src')))
{
    const rel = path.relative(root, full).replaceAll('\\', '/');
    const found = matches(fs.readFileSync(full, 'utf8'));
    const allowed = exceptions[rel]?.literals || {};
    const seen = {};
    for (const item of found)
    {
        seen[item.value] = (seen[item.value] || 0) + 1;
        if (seen[item.value] > (allowed[item.value] || 0)) errors.push(`${rel}:${item.line}: ${item.value}`);
    }
    for (const [value, count] of Object.entries(allowed))
    {
        if ((seen[value] || 0) !== count) errors.push(`${rel}: stale exception ${value} (expected ${count}, found ${seen[value] || 0})`);
    }
}
for (const rel of Object.keys(exceptions))
{
    if (!fs.existsSync(path.join(root, rel))) errors.push(`${rel}: exception file is missing`);
}
if (errors.length)
{
    console.error(errors.join('\n'));
    process.exit(1);
}
console.log('UI color ownership check passed.');
