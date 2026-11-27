'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const frames = [];
const mounted = [];
let projectId = 'p1';
let host = { isConnected: true };
const runtime = { host: null, projectId: null };
const context = vm.createContext({
    window: { addEventListener() {} },
    placesMapRuntime: runtime,
    document: { getElementById: () => host },
    currentProjectId: () => projectId,
    requestAnimationFrame: callback => frames.push(callback)
});
const filename = path.join(__dirname, '../../src/modules/places/map-and-route.js');
vm.runInContext(fs.readFileSync(filename, 'utf8'), context, { filename });
context.mountPlacesMap = list => mounted.push(list);
const flush = () => frames.splice(0).forEach(callback => callback());

context.schedulePlacesMapMount(['old']);
context.schedulePlacesMapMount(['latest']);
flush();
assert.deepEqual(mounted, [['latest']]);

context.schedulePlacesMapMount(['old project']);
projectId = 'p2';
flush();
assert.equal(mounted.length, 1);

context.schedulePlacesMapMount(['old host']);
host.isConnected = false;
host = { isConnected: true };
flush();
assert.equal(mounted.length, 1);

runtime.host = host;
runtime.projectId = projectId;
context.schedulePlacesMapMount(['retained host']);
assert.deepEqual(mounted.at(-1), ['retained host']);
assert.equal(frames.length, 0, 'Loading and ready maps should receive current data immediately');
console.log('Places map mount scheduling preserves the latest query, project and host.');
