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

const errors = paletteDrift();
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
