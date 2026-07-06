# Selectable Constants + Calendar Export Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a one-click `.ics` export of future pirthdays and let users pick/live-switch the base constant (π, e) with a full per-constant rebrand.

**Architecture:** Replace the hardcoded π milestone arrays with a constant registry + a `buildMilestones(c)` generator. Hold the entered birthday and active constant in module state so a constant switch recomputes and re-renders without reload. A pure `buildICS()` produces a spec-correct iCalendar file downloaded via a Blob. Pure functions are exported under node for a plain-`assert` test file, guarded so the browser is unaffected.

**Tech Stack:** Vanilla HTML/CSS/JS. No build, no dependencies. Tests run under plain `node` with the built-in `assert` module.

## Global Constants

- No new runtime dependencies, no build step. Everything stays static files.
- iCalendar output MUST use CRLF (`\r\n`) line endings, RFC 5545 text escaping (`\` `;` `,` newline), and 75-octet line folding.
- Export scope is **future pirthdays only** (`!isPast`).
- Constant naming rule: constant's spoken name replaces the leading `b` of "birthday" → π = **Pirthday**, e = **Eirthday**.
- `MAX_YEARS = 101` for standard multiples — chosen so π keeps its original 32-term reach (32π ≈ 100.5 years).
- Preserve the existing dark theme and card markup; only add styles for the new selector and download button.

---

### Task 1: Constant registry + parameterized milestones + node test harness

**Files:**
- Modify: `script.js` (replace lines 26-142: the `SPECIAL_MILESTONES`/`STANDARD_MILESTONES`/`ALL_MILESTONES` blocks, `isSpecialMilestone`, and `calculatePirthdays`; add registry + `buildMilestones`; keep `gamma`, `addYearsToDate`, `formatDate`, `getRelativeTime`, `renderPirthdays`, `init`)
- Modify: `script.js` (bottom: guard the `DOMContentLoaded` registration and add a node export)
- Create: `test.js`

**Interfaces:**
- Consumes: existing `gamma(z)` and `addYearsToDate(date, years)` from `script.js`.
- Produces:
  - `CONSTANTS` — object keyed `pi`/`e`, each `{ key, symbol, value, name, term, approx, extras }`.
  - `buildMilestones(c)` → sorted array of `{ multiplier, label, isSpecial }`.
  - `calculatePirthdays(birthday, c)` → array of `{ multiplier, label, isSpecial, date, isPast, yearsValue }`.

- [ ] **Step 1: Write the failing test** — create `test.js`:

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node test.js`
Expected: FAIL — `Cannot find module` export is undefined / `buildMilestones is not a function` (script.js has no exports yet).

- [ ] **Step 3: Write minimal implementation** — in `script.js`, replace the block from `const PI = Math.PI;` … through the end of `calculatePirthdays` (original lines 1-142, keeping `gamma`, `addYearsToDate`, `formatDate`, `getRelativeTime`) with:

```js
// Gamma function (for factorials) using Lanczos approximation
function gamma(z) {
  if (z < 0.5) {
    return Math.PI / (Math.sin(Math.PI * z) * gamma(1 - z));
  }
  z -= 1;
  const g = 7;
  const c = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
  ];
  let x = c[0];
  for (let i = 1; i < g + 2; i++) {
    x += c[i] / (z + i);
  }
  const t = z + g + 0.5;
  return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
}

const MAX_YEARS = 101; // keeps π's original 32-term reach (32π ≈ 100.5 years)

// Cross-constant "extras" that reference two constants at once.
const CROSS = {
  'π^e': Math.pow(Math.PI, Math.E),
  'e^π': Math.pow(Math.E, Math.PI),
};

const CONSTANTS = {
  pi: {
    key: 'pi', symbol: 'π', value: Math.PI, name: 'Pirthday', term: 'pirthday',
    approx: '3.14159265359…', extras: ['π^e', 'e^π'],
  },
  e: {
    key: 'e', symbol: 'e', value: Math.E, name: 'Eirthday', term: 'eirthday',
    approx: '2.71828182846…', extras: ['e^π', 'π^e'],
  },
};

function buildMilestones(c) {
  const v = c.value;
  const s = c.symbol;
  const fact = gamma(v + 1);

  const special = [
    { multiplier: Math.sqrt(v), label: `√${s}` },
    { multiplier: v * v, label: `${s}²` },
    { multiplier: Math.pow(v, 3), label: `${s}³` },
    { multiplier: Math.pow(v, v), label: `${s}^${s}` },
    { multiplier: Math.pow(2, v), label: `2^${s}` },
    { multiplier: Math.pow(3, v), label: `3^${s}` },
    { multiplier: Math.pow(4, v), label: `4^${s}` },
  ];
  for (let n = 1; n <= 14; n++) {
    special.push({ multiplier: n * fact, label: `${n === 1 ? '' : n}${s}!` });
  }
  for (const k of c.extras || []) {
    if (CROSS[k] != null) special.push({ multiplier: CROSS[k], label: k });
  }

  const standard = [];
  for (let n = 1; n * v <= MAX_YEARS; n++) {
    standard.push({ multiplier: n * v, label: `${n}${s}`, isSpecial: false });
  }

  return [
    ...special.map((m) => ({ ...m, isSpecial: true })),
    ...standard,
  ].sort((a, b) => a.multiplier - b.multiplier);
}

function addYearsToDate(date, years) {
  const result = new Date(date);
  const wholeYears = Math.floor(years);
  const fractionalYear = years - wholeYears;

  result.setFullYear(result.getFullYear() + wholeYears);

  const yearStart = new Date(result.getFullYear(), 0, 1);
  const yearEnd = new Date(result.getFullYear() + 1, 0, 1);
  const daysInYear = (yearEnd - yearStart) / (1000 * 60 * 60 * 24);
  const additionalDays = Math.round(fractionalYear * daysInYear);

  result.setDate(result.getDate() + additionalDays);

  return result;
}

function calculatePirthdays(birthday, c) {
  const now = new Date();
  return buildMilestones(c).map((m) => {
    const date = addYearsToDate(birthday, m.multiplier);
    return {
      ...m,
      date,
      isPast: date < now,
      yearsValue: m.multiplier.toFixed(4),
    };
  });
}
```

Note: `formatDate` and `getRelativeTime` (original lines 87-121) stay unchanged — keep them between `gamma` and the rest wherever they read cleanly; the above shows `addYearsToDate` for context but do not duplicate it.

Then at the very bottom of `script.js`, replace `document.addEventListener('DOMContentLoaded', init);` with:

```js
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', init);
}

if (typeof module !== 'undefined') {
  module.exports = { CONSTANTS, buildMilestones, calculatePirthdays, buildICS };
}
```

(`buildICS` is added in Task 2; exporting it now is harmless — it is `undefined` until then and Task 1's tests do not touch it. If `node test.js` errors on the reference, temporarily drop `buildICS` from the export and re-add it in Task 2.)

- [ ] **Step 4: Run test to verify it passes**

Run: `node test.js`
Expected: PASS — prints `task1 tests passed`.

- [ ] **Step 5: Commit**

```bash
git add script.js test.js
git commit -m "feat: constant registry + parameterized milestones"
```

---

### Task 2: iCalendar (.ics) builder

**Files:**
- Modify: `script.js` (add `buildICS` and its `.ics` helper functions near `calculatePirthdays`; confirm it is in `module.exports`)
- Modify: `test.js` (append ICS assertions)

**Interfaces:**
- Consumes: nothing new (pure).
- Produces: `buildICS(pirthdays, c, birthday)` → iCalendar string (CRLF-terminated). Filters to `!p.isPast` internally.

- [ ] **Step 1: Write the failing test** — append to `test.js` (before the final `console.log`):

```js
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
```

(Remove the old `task1 tests passed` line or leave it — both may print. Keep whichever is clearer.)

- [ ] **Step 2: Run test to verify it fails**

Run: `node test.js`
Expected: FAIL — `buildICS is not a function`.

- [ ] **Step 3: Write minimal implementation** — add to `script.js` just below `calculatePirthdays`:

```js
function icsEscape(text) {
  return String(text)
    .replace(/[\\;,]/g, (m) => '\\' + m)
    .replace(/\n/g, '\\n');
}

function icsDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}

function icsStamp(d) {
  // 2026-07-06T12:00:00.000Z -> 20260706T120000Z
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

function foldLine(line) {
  if (line.length <= 75) return line;
  let out = line.slice(0, 75);
  let rest = line.slice(75);
  while (rest.length > 74) {
    out += '\r\n ' + rest.slice(0, 74);
    rest = rest.slice(74);
  }
  return out + '\r\n ' + rest;
}

function buildICS(pirthdays, c, birthday) {
  const stamp = icsStamp(new Date());
  const base = birthday.getTime();
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//pirthday//EN',
    'CALSCALE:GREGORIAN',
  ];

  for (const p of pirthdays.filter((x) => !x.isPast)) {
    const end = new Date(p.date.getTime() + 86400000);
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${base}-${p.multiplier.toFixed(4)}@pirthday`);
    lines.push(`DTSTAMP:${stamp}`);
    lines.push(`DTSTART;VALUE=DATE:${icsDate(p.date)}`);
    lines.push(`DTEND;VALUE=DATE:${icsDate(end)}`);
    lines.push(`SUMMARY:${icsEscape(`${p.label} ${c.name} · ≈${p.yearsValue} years`)}`);
    lines.push(`DESCRIPTION:${icsEscape(`Your ${p.label} ${c.term}: ≈${p.yearsValue} years old.`)}`);
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.map(foldLine).join('\r\n') + '\r\n';
}
```

Confirm `buildICS` is listed in the `module.exports` from Task 1.

- [ ] **Step 4: Run test to verify it passes**

Run: `node test.js`
Expected: PASS — prints `task2 tests passed`.

- [ ] **Step 5: Commit**

```bash
git add script.js test.js
git commit -m "feat: iCalendar .ics builder for future pirthdays"
```

---

### Task 3: UI — constant selector, live switching, rebrand, download wiring

**Files:**
- Modify: `index.html` (add selector to `.input-section`; add download button + ids inside results/footer)
- Modify: `script.js` (`init` + new state/handlers: `applyBranding`, `setConstant`, `recompute`; store birthday; wire download)

**Interfaces:**
- Consumes: `CONSTANTS`, `calculatePirthdays`, `buildICS`, existing `renderPirthdays`.
- Produces: module state `activeConstant` / `birthday`; DOM behavior only (verified manually).

- [ ] **Step 1: Edit `index.html`** — in `.input-section`, add the selector as the first child (before the `<label>`):

```html
      <div class="constant-select" role="group" aria-label="Choose constant">
        <button type="button" class="constant-option active" data-constant="pi" aria-pressed="true">π</button>
        <button type="button" class="constant-option" data-constant="e" aria-pressed="false">e</button>
      </div>
```

Give the results `<h2>` no change is needed to its text (JS sets it), and add the download button inside the results section after the list:

```html
    <section id="results" class="results hidden">
      <h2>Your Pirthdays</h2>
      <div id="pirthday-list" class="pirthday-list"></div>
      <button id="download-ics" type="button" class="download-btn">Download .ics</button>
    </section>
```

Give the footer constant line an id so it can rebrand — change `<p>π ≈ 3.14159265359...</p>` to:

```html
    <p id="constant-approx">π ≈ 3.14159265359…</p>
```

- [ ] **Step 2: Edit `script.js` `init` + add handlers** — replace the whole `init` function with:

```js
let activeConstant = CONSTANTS.pi;
let birthday = null;

function applyBranding(c) {
  document.title = `${c.name} Calculator`;
  document.querySelector('h1').textContent = `${c.name} Calculator`;
  document.querySelector('.tagline').textContent =
    `Celebrate your birthday in multiples of ${c.symbol}`;
  document.querySelector('.results h2').textContent = `Your ${c.name}s`;
  document.getElementById('constant-approx').textContent = `${c.symbol} ≈ ${c.approx}`;
}

function recompute() {
  if (!birthday) return;
  renderPirthdays(calculatePirthdays(birthday, activeConstant));
}

function setConstant(key) {
  activeConstant = CONSTANTS[key];
  document.querySelectorAll('.constant-option').forEach((b) => {
    const on = b.dataset.constant === key;
    b.classList.toggle('active', on);
    b.setAttribute('aria-pressed', String(on));
  });
  applyBranding(activeConstant);
  recompute();
}

function init() {
  const birthdayInput = document.getElementById('birthday');
  const calculateBtn = document.getElementById('calculate');

  birthdayInput.max = new Date().toISOString().split('T')[0];
  const minDate = new Date();
  minDate.setFullYear(minDate.getFullYear() - 150);
  birthdayInput.min = minDate.toISOString().split('T')[0];

  document.querySelectorAll('.constant-option').forEach((b) => {
    b.addEventListener('click', () => setConstant(b.dataset.constant));
  });

  calculateBtn.addEventListener('click', () => {
    if (!birthdayInput.value) {
      birthdayInput.focus();
      return;
    }
    birthday = new Date(birthdayInput.value + 'T00:00:00');
    recompute();
  });

  birthdayInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') calculateBtn.click();
  });

  document.getElementById('download-ics').addEventListener('click', () => {
    if (!birthday) return;
    const ics = buildICS(calculatePirthdays(birthday, activeConstant), activeConstant, birthday);
    const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeConstant.key}-pirthdays.ics`;
    a.click();
    URL.revokeObjectURL(url);
  });

  applyBranding(activeConstant);
}
```

- [ ] **Step 3: Manual verification** — no runtime dependency, open the file directly.

Run: `xdg-open index.html` (or open in a browser)
Verify, in order:
1. Enter a birthday, click **Calculate** — pirthday cards appear.
2. Click **e** — title becomes "Eirthday Calculator", tagline says "…multiples of e", footer shows "e ≈ 2.718…", cards recompute (labels now `e`, `e²`, …) **without** re-entering the birthday.
3. Click **π** — everything rebrands back and recomputes.
4. Switch to **e** *before* entering a birthday, then enter one and Calculate — results use e. (Rebrand happened with no birthday; no error.)
5. Click **Download .ics** — a file `pi-pirthdays.ics` (or `e-pirthdays.ics`) downloads. Open it in a text editor: only future dates, `BEGIN:VCALENDAR`/`END:VCALENDAR` present. Optionally import into a calendar app.

- [ ] **Step 4: Re-run logic tests (regression)**

Run: `node test.js`
Expected: PASS (script.js still exports the pure functions; DOM guard prevents node errors).

- [ ] **Step 5: Commit**

```bash
git add index.html script.js
git commit -m "feat: constant selector with live switching and .ics download"
```

---

### Task 4: Styling for selector + download button

**Files:**
- Modify: `style.css` (append rules; no changes to existing selectors)

**Interfaces:**
- Consumes: existing CSS custom properties (`--color-*`, `--radius`).
- Produces: styles only.

- [ ] **Step 1: Append to `style.css`:**

```css
.constant-select {
  display: inline-flex;
  gap: 0;
  align-self: flex-start;
  background: var(--color-bg);
  border-radius: calc(var(--radius) - 4px);
  padding: 0.25rem;
}

.constant-option {
  padding: 0.4rem 1rem;
  font-size: 1.1rem;
  font-family: 'Cambria Math', 'Times New Roman', serif;
  background: transparent;
  color: var(--color-text-muted);
  border-radius: calc(var(--radius) - 6px);
  transition: background 0.2s, color 0.2s;
}

.constant-option.active {
  background: var(--color-primary);
  color: white;
}

.constant-option:hover:not(.active) {
  color: var(--color-text);
}

.download-btn {
  margin-top: 1.5rem;
  width: 100%;
  background: transparent;
  border: 2px solid var(--color-primary);
  color: var(--color-text);
}

.download-btn:hover {
  background: var(--color-primary);
}
```

Note: the base `button { … }` rule already gives padding/font/radius; `.constant-option` and `.download-btn` override only what differs. `.constant-option` needs its own reset of the inherited primary background — the `background: transparent` above handles it.

- [ ] **Step 2: Manual verification**

Run: reload `index.html` in the browser.
Verify: the π|e control renders as a segmented toggle with the active option filled; the Download .ics button is a full-width outlined button that fills on hover. Both readable in the dark theme.

- [ ] **Step 3: Commit**

```bash
git add style.css
git commit -m "style: segmented constant selector and download button"
```

---

## Self-Review

**Spec coverage:**
- Calendar export, one button, .ics, future-only → Tasks 2 & 3. ✓
- Cross-platform format correctness (CRLF/escape/fold) → Task 2. ✓
- Alt constants with analogous per-constant specials → Task 1 `buildMilestones`. ✓
- Selectable before entry + live switch without reload/re-entry → Task 3 state + `setConstant`. ✓
- Full rebrand per constant → Task 3 `applyBranding`. ✓
- Registry-driven, one-entry to add a constant → Task 1 `CONSTANTS`. ✓
- Node-runnable tests, browser-safe export → Tasks 1 & 2. ✓
- CSS for new controls → Task 4. ✓

**Placeholder scan:** none — all steps carry full code/commands.

**Type consistency:** `buildMilestones` → `{multiplier,label,isSpecial}` consumed by `calculatePirthdays` (adds `date,isPast,yearsValue`) consumed by `buildICS` (`label,yearsValue,multiplier,date,isPast`) and `renderPirthdays` (`label,date,yearsValue,isPast,isSpecial`) — all present. `CONSTANTS[key]` fields (`key,symbol,value,name,term,approx,extras`) all used consistently. `module.exports` names match `require` names in `test.js`.

**Note for implementer:** Task 1 removes `isSpecialMilestone` and the three old milestone arrays entirely; `renderPirthdays` already reads `p.isSpecial`, which now comes straight from `buildMilestones` — no change needed there.
