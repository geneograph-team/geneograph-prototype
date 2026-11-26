'use strict';

// Minimal synthetic topologies for layout and occurrence regressions.
// Build fresh records per invocation; no imported datasets or serialized snapshots.
const ids = text => text ? text.split(' ') : [];

function approvedTreeCases()
{
    const people = [
        [3, 0, 'p1 p2'],
        [4, 1, 's1'],
        [4, 2, 's2'],
        [4, 1, 'a1 a2 a3'],
        [4, 2, 'b1 b2'],
        [5, 1, 'c1 c2 c3 c4 c5 c6'],
        [5, 2, 'c7 c8'],
        [5, 1, 'd1 d2'],
        [5, 2, 'd3'],
        [6, 1, 'g1 g2 g3'],
        [6, 2, 'g4'],
        [0, 3, 'ha01 ha02 ha03 ha04 ha05 ha06 ha07 ha08'],
        [1, 3, 'ha09 ha10 ha11 ha12'],
        [2, 3, 'ha13 ha14'],
        [3, 4, 'hs1 hp1'],
        [3, 5, 'hs2 hp2'],
        [4, 4, 'hc1 hc2'],
        [4, 5, 'hc3 hc4 hc5'],
        [5, 1, 'c9'],
        [4, 1, 'a4'],
        [5, 1, 'c10 c11']
    ].flatMap(([generation, branch, members]) =>
        ids(members).map(id => ({ id, name: id, generation, branch })));
    const families = [
        ['F1', 'p1 p2', 's1 s2', 0],
        ['F2', 's1 a1', 'c1 c2 c9', 1],
        ['F3', 's1 a2', 'c3 c4', 1],
        ['F4', 's1 a3', 'c5 c6', 1],
        ['F5', 's2 b1', 'c7', 2],
        ['F6', 's2 b2', 'c8', 2],
        ['F7', 'c1 d1', 'g1 g2', 1],
        ['F8', 'c6 d2', 'g3', 1],
        ['F9', 'c7 d3', 'g4', 2],
        ['F10', 'ha01 ha02', 'ha09', 3],
        ['F11', 'ha03 ha04', 'ha10', 3],
        ['F12', 'ha05 ha06', 'ha11', 3],
        ['F13', 'ha07 ha08', 'ha12', 3],
        ['F14', 'ha09 ha10', 'ha13', 3],
        ['F15', 'ha11 ha12', 'ha14', 3],
        ['F16', 'ha13 ha14', 'hs1 p2 hs2', 3],
        ['F17', 'hs1 hp1', 'hc1 hc2', 4],
        ['F18', 'hs2 hp2', 'hc3 hc4 hc5', 5],
        ['F19', 's1 a4', 'c10 c11', 1]
    ].map(([id, parents, children, branch]) =>
        ({ id, parents: ids(parents), children: ids(children), branch }));

    // A shared ancestor reconnects two otherwise separate parental branches.
    const duplicatePeople = people.filter(person => person.id !== 'ha02').map(person => ({ ...person }));
    const duplicateFamilies = families.map(family => ({
        ...family,
        parents: family.parents.map(id => id === 'ha02' ? 'ha08' : id),
        children: [...family.children]
    }));
    return {
        'approved-baseline': [people, families],
        'automatic-duplicates': [duplicatePeople, duplicateFamilies]
    };
}

function principalOrderReversalCase()
{
    // Preserve the input sequence of the regression that exposed native partner reversal.
    const people = ids('p13 p35 p21 p22 p02 p05 p25 p00 p10 p14 p30 p34 p03 p32 p31 p33 p24 p23 p12 p15 p11').map(id => ({
        id,
        gender: Number(id[2]) % 2 === 0 ? 'male' : 'female',
        width: 300,
        height: 124,
        generation: Number(id[1])
    }));
    const families = [
        ['z1', 'p10 p11', ''],
        ['f31', 'p32 p33', ''],
        ['f12', 'p14 p13', 'p24 p23'],
        ['f10', 'p10 p15', 'p22 p21'],
        ['f01', 'p00 p03', 'p12 p10'],
        ['f21', 'p24 p23', 'p34 p33'],
        ['f20', 'p22 p25', 'p31 p32'],
        ['f32', 'p30 p35', ''],
        ['z3', 'p34 p33', ''],
        ['f02', 'p02 p05', 'p11 p15'],
        ['f30', 'p34 p31', '']
    ].map(([id, parents, children]) => ({ id, parents: ids(parents), children: ids(children) }));
    return { people, families };
}

module.exports = { approvedTreeCases, principalOrderReversalCase };
