const assert = require('node:assert/strict');
const { geneoShadowOverride, geneoEffectiveNodeShadow, geneoSharedNodeShadow } = require('../src/geneograph-shadow.js');

const board = { canvas: { shadowEnabled: true } };
const person = { type: 'person', appearance: { shadowEnabled: null, fill: { enabled: false, opacity: 0 } } };
const shape = { type: 'shape', appearance: { shadowEnabled: null } };
const drawing = { type: 'drawing', appearance: { shadowEnabled: null } };
const text = { type: 'text', appearance: { shadowEnabled: null } };
const sticky = { type: 'sticky', appearance: { shadowEnabled: null, fill: { enabled: true, opacity: 100 } } };

assert.equal(geneoShadowOverride(undefined), null);
assert.equal(geneoShadowOverride('false'), null);
assert.equal(geneoEffectiveNodeShadow(person, board), true);
assert.equal(geneoEffectiveNodeShadow(shape, board), false);
assert.equal(geneoEffectiveNodeShadow(drawing, board), false);
assert.equal(geneoEffectiveNodeShadow(text, board), false);
assert.equal(geneoEffectiveNodeShadow(sticky, board), true);
assert.equal(geneoEffectiveNodeShadow({ ...sticky, appearance: { ...sticky.appearance, fill: { enabled: false } } }, board), false);

const boardOff = { canvas: { shadowEnabled: false } };
assert.equal(geneoEffectiveNodeShadow(person, boardOff), false);
assert.equal(geneoEffectiveNodeShadow({ ...person, appearance: { ...person.appearance, shadowEnabled: true } }, boardOff), true);
assert.equal(geneoEffectiveNodeShadow({ ...person, appearance: { ...person.appearance, shadowEnabled: false } }, board), false);
assert.equal(geneoEffectiveNodeShadow({ ...drawing, appearance: { shadowEnabled: true } }, board), true);

assert.equal(geneoSharedNodeShadow([person, sticky], board), true);
assert.equal(geneoSharedNodeShadow([person, shape], board), null);
assert.equal(geneoSharedNodeShadow([shape, drawing], board), false);

const exported = JSON.parse(JSON.stringify({ canvas: boardOff.canvas, nodes: [{ ...person, appearance: { shadowEnabled: true } }] }));
assert.equal(geneoEffectiveNodeShadow(exported.nodes[0], exported), true);

global.window = {};
require('../src/assets/boards/whiskerfield-tree-research.js');
const legacyDiagram = window.GENEO_SEED_BOARD_ASSETS[0].payload.board.diagram;
assert.equal(legacyDiagram.canvas.shadowEnabled, undefined);
assert.equal(geneoEffectiveNodeShadow(legacyDiagram.nodes.find(node => node.type === 'person'), legacyDiagram), true);
assert.equal(geneoEffectiveNodeShadow(legacyDiagram.nodes.find(node => node.type === 'drawing'), legacyDiagram), false);

console.log('Geneograph shadow inheritance passed');
