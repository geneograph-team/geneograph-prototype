// Build-time only. The static application never invokes Git.
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const versionTag = /^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

function compareVersions(a, b)
{
    const left = a.slice(1).split('.').map(BigInt);
    const right = b.slice(1).split('.').map(BigInt);
    for (let index = 0; index < 3; index++)
    {
        if (left[index] !== right[index]) return left[index] > right[index] ? -1 : 1;
    }
    return 0;
}

function collectBuildInfo(git)
{
    const revision = git(['rev-parse', '--verify', 'HEAD^{commit}']);
    if (!/^(?:[0-9a-f]{40}|[0-9a-f]{64})$/.test(revision))
        throw new Error('Invalid checked-out commit identity');
    if (git(['rev-parse', '--is-shallow-repository']) !== 'false')
        throw new Error('Complete Git history is required for build versioning');

    const candidates = git(['tag', '--merged', revision, '--list']).split(/\r?\n/)
        .filter(tag => versionTag.test(tag))
        .map(tag =>
        {
            const value = git(['rev-list', '--count', 'refs/tags/' + tag + '..' + revision]);
            const distance = Number(value);
            if (!/^\d+$/.test(value) || !Number.isSafeInteger(distance) || distance < 0)
                throw new Error('Invalid Git commit distance');
            return { tag, distance };
        });
    candidates.sort((a, b) => a.distance - b.distance || compareVersions(a.tag, b.tag));
    const nearest = candidates[0];
    return { revision, tag: nearest?.tag ?? null, distance: nearest?.distance ?? null };
}

function generateBuildInfo(destination, cwd = process.cwd())
{
    const git = args => execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
    const info = collectBuildInfo(git);
    fs.writeFileSync(destination, 'globalThis.GENEOGRAPH_BUILD_DATA = ' + JSON.stringify(info) + ';\n', 'utf8');
    return info;
}

if (require.main === module)
{
    if (process.argv.length !== 3) throw new Error('Usage: node scripts/generate-build-info.cjs <output-file>');
    generateBuildInfo(path.resolve(process.argv[2]));
}

module.exports = { collectBuildInfo, generateBuildInfo };
