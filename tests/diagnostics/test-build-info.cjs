const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');
const { collectBuildInfo, generateBuildInfo } = require('../../scripts/generate-build-info.cjs');

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'geneograph-build-'));
const git = (...args) => execFileSync('git', args, { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const collect = () => collectBuildInfo(args => git(...args));
const commit = message => git('commit', '--allow-empty', '-m', message);
const read = file => fs.readFileSync(path.join(__dirname, '../../src', file), 'utf8');
try
{
    assert.throws(() => collect());
    git('init', '-b', 'main');
    git('config', 'user.name', 'Fixture');
    git('config', 'user.email', 'fixture@example.invalid');
    git('config', 'commit.gpgsign', 'false');
    commit('base');
    const base = git('rev-parse', 'HEAD');
    assert.deepEqual(collect(), { revision: base, tag: null, distance: null });
    git('tag', 'v1.9.0');
    git('tag', '-a', 'v1.10.0', '-m', 'release');
    git('tag', 'v01.20.0');
    git('tag', 'v99.0.0-beta');
    assert.deepEqual(collect(), { revision: base, tag: 'v1.10.0', distance: 0 });
    commit('development');
    const revision = git('rev-parse', 'HEAD');
    git('switch', '-c', 'unrelated');
    commit('unrelated');
    git('tag', 'v99.0.0');
    git('switch', 'main');
    assert.deepEqual(collect(), { revision, tag: 'v1.10.0', distance: 1 });
    git('tag', 'v1.0.0');
    assert.equal(collect().tag, 'v1.0.0');
    git('tag', '-d', 'v1.0.0');
    const output = path.join(dir, 'build-info.js');
    assert.deepEqual(generateBuildInfo(output, dir), collect());

    const runtime = read('core/build-info.js');
    const recorder = read('core/application-performance.js');
    const shell = read('core/app-shell.js');
    const about = shell.slice(shell.indexOf('function renderPrototypeBuildInfo()'),
        shell.indexOf('function renderGlobalSettingsPanel(section)'));
    const context = vm.createContext({ performance: { now: () => 0 }, t: value => value, icon: { copy: '<svg></svg>' },
        escapeHtml: value => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;') });
    vm.runInContext(fs.readFileSync(output, 'utf8') + runtime + recorder + about, context);
    const value = vm.runInContext('JSON.stringify(appPerf.snapshot().buildInfo)', context);
    assert.deepEqual(JSON.parse(value), { version: '1.10.0-dev.1', revision,
        shortRevision: revision.slice(0, 7), tag: 'v1.10.0', distance: 1, channel: 'development' });
    const display = '1.10.0-dev.1-' + revision.slice(0, 7);
    const markup = vm.runInContext('renderPrototypeBuildInfo()', context);
    assert.ok(markup.includes(display));
    assert.equal(vm.runInContext('prototypeBuildCopyText()', context), display);
    assert.equal((markup.match(/class="global-settings-row/g) || []).length, 1);
    assert.equal((markup.match(/data-copy-build-info/g) || []).length, 1);
    assert.ok(markup.includes('aria-label="Copy version information"'));
    assert.ok(!markup.includes('<strong>Build</strong>') && !markup.includes('<strong>Channel</strong>'));
    assert.ok(!markup.includes(revision));
    const releaseContext = vm.createContext({ GENEOGRAPH_BUILD_DATA: { revision, tag: 'v1.10.0', distance: 0 }, t: value => value });
    vm.runInContext(runtime + about, releaseContext);
    assert.equal(vm.runInContext('prototypeBuildCopyText()', releaseContext), '1.10.0-' + revision.slice(0, 7));
    const untaggedContext = vm.createContext({ GENEOGRAPH_BUILD_DATA: { revision, tag: null, distance: null }, t: value => value });
    vm.runInContext(runtime + about, untaggedContext);
    assert.equal(vm.runInContext('prototypeBuildCopyText()', untaggedContext), 'Development build (' + revision.slice(0, 7) + ')');
    assert.equal(vm.runInContext('Object.isFrozen(geneographBuildInfo)', context), true);

    const local = vm.createContext({ t: value => value });
    vm.runInContext(read('build-info.js') + runtime + about, local);
    assert.equal(vm.runInContext('prototypeBuildCopyText()', local), 'Local development build');
    assert.equal(vm.runInContext('geneographBuildInfo.channel', local), 'local');
    assert.equal(vm.runInContext('geneographBuildInfo.revision', local), null);
    const bad = vm.createContext({ GENEOGRAPH_BUILD_DATA: { revision, tag: '<script>', distance: 0 } });
    vm.runInContext(runtime, bad);
    assert.equal(vm.runInContext('geneographBuildInfo.channel', bad), 'local');
    assert.throws(() => collectBuildInfo(args => args[0] === 'rev-parse' && args[1] === '--verify' ? revision : 'true'));
    console.log('Build identity fixture and runtime checks passed.');
}
finally
{
    fs.rmSync(dir, { recursive: true, force: true });
}
