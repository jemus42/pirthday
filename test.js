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

// --- buildICS(pirthdays, c, birthday) ---
const { buildICS } = require('./script.js');

const bday = new Date('1990-03-14T00:00:00');
const sample = [
  { label: 'π²', yearsValue: '9.8696', multiplier: 9.8696, date: new Date('1999-12-01T00:00:00'), isPast: true },
  { label: '10π', yearsValue: '31.4159', multiplier: 31.4159, date: new Date('2099-08-20T00:00:00'), isPast: false },
];
const ics = buildICS(sample, CONSTANTS.pi, bday);
assert(ics.startsWith('BEGIN:VCALENDAR\r\n'), 'starts with VCALENDAR');
assert(ics.trimEnd().endsWith('END:VCALENDAR'), 'ends with VCALENDAR');
assert(ics.includes('\r\n'), 'uses CRLF');
assert.strictEqual((ics.match(/BEGIN:VEVENT/g) || []).length, 1, 'future-only: one VEVENT');
assert(ics.includes('DTSTART;VALUE=DATE:20990820'), 'all-day DTSTART on local date');
assert(ics.includes('DTEND;VALUE=DATE:20990821'), 'all-day DTEND is next day');

// escaping
const esc = [{ label: 'a,b;c', yearsValue: '1.0', multiplier: 1, date: new Date('2099-01-02T00:00:00'), isPast: false }];
const ics2 = buildICS(esc, CONSTANTS.pi, bday);
assert(ics2.includes('a\\,b\\;c'), 'escapes comma and semicolon in text values');

console.log('task2 tests passed');
