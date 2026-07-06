const assert = require('assert');
const { CONSTANTS, buildMilestones } = require('./script.js');

// --- buildMilestones(e) ---
const eM = buildMilestones(CONSTANTS.e);
for (let i = 1; i < eM.length; i++) {
  assert(eM[i].multiplier >= eM[i - 1].multiplier, 'milestones sorted ascending');
}
const eStd = eM.filter((m) => !m.isSpecial);
assert(eStd.every((m) => m.multiplier <= 101), 'standard multiples within MAX_YEARS');
assert.strictEqual(eStd.length, 37, 'e standard count (floor(101/e))');
assert(eM.some((m) => m.label === 'e²'), 'has e squared');
assert(eM.some((m) => m.label === 'e^e'), 'has e^e');
assert(eM.some((m) => m.label === 'e!'), 'has e factorial');
assert(eM.some((m) => m.label === 'e^π'), 'has e^pi cross extra');

// --- buildMilestones(pi) keeps original richness ---
const piM = buildMilestones(CONSTANTS.pi);
assert.strictEqual(piM.filter((m) => !m.isSpecial).length, 32, 'pi keeps 32 standard');
assert(piM.some((m) => m.label === 'π!'), 'pi has factorial');
assert(piM.some((m) => m.label === 'π^e'), 'pi has cross extra');

console.log('task1 tests passed');
