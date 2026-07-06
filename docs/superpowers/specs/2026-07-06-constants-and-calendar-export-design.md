# Design: Selectable constants + calendar export

Date: 2026-07-06

## Summary

Two features for the Pirthday Calculator (static vanilla HTML/CSS/JS, no build, no deps):

1. **Calendar export** — a single "Download .ics" button that exports the user's
   future pirthdays as one iCalendar file importable by Google/Apple/Outlook.
2. **Selectable constants** — let the user compute milestones for constants other
   than π, starting with e ≈ 2.718. Selectable before entering a birthday and
   switchable live afterward (no reload, no re-entry). Full per-constant rebrand.

The features are largely independent but share the same milestone/render pipeline.

## Current state (baseline)

- `index.html` — static markup: date input, Calculate button, results section, footer.
- `script.js` — π hardcoded. `SPECIAL_MILESTONES` (√π, π², π³, π^e, e^π, π^π, n^π,
  π!·n) + `STANDARD_MILESTONES` (1π…32π) → `calculatePirthdays()` → `renderPirthdays()`
  (innerHTML string). `gamma()` Lanczos approximation powers π! (`PI_FACTORIAL`).
  Birthday is read from the input on each button click and never stored.
- `style.css` — dark theme, card list, responsive.

## Feature 1: Constant registry + parameterized milestones

### Constant registry

Single source of truth replacing the hardcoded π. Each constant is self-describing:

```js
const CONSTANTS = {
  pi: { key:'pi', symbol:'π', value:Math.PI, name:'Pirthday', term:'pirthday',
        approx:'3.14159265359…', extras:['π^e','e^π'] },
  e:  { key:'e',  symbol:'e', value:Math.E,  name:'Eirthday', term:'eirthday',
        approx:'2.71828182846…', extras:['e^π','π^e'] },
};
```

Naming rule (documented for future constants): take the constant's spoken name,
replace the leading `b` of "birthday" → π ("pi") = **Pirthday**, e = **Eirthday**.

Adding a future constant = one registry entry (plus its `extras` if any).

### `buildMilestones(c)`

Replaces the two hardcoded arrays. Given a constant record `c` (value `v`, symbol `s`):

- **Standard multiples:** `n·v` for n = 1, 2, 3, … while `n·v ≤ 100` (years cap,
  not a magic count — π yields 32 terms, e yields ~36). Label `` `${n}${s}` ``.
- **Derived specials:** `√v`, `v²`, `v³`, `v^v`, `2^v`, `3^v`, `4^v`, and `v!·n`
  for n = 1…14 (via existing `gamma(v+1)`). Labels use the constant symbol
  (e.g. `e²`, `3^e`, `5e!`).
- **Extras:** the hand-picked cross-terms named in `c.extras`, resolved to
  multipliers from a small lookup (`π^e`, `e^π`). Keeps π's existing charm and
  gives e the symmetric pair.

Output: array of `{ multiplier, label, description, isSpecial }`, sorted ascending
by multiplier. `isSpecial` is set at generation time (a boolean flag on the record)
instead of the current float-tolerance re-derivation in `isSpecialMilestone()` —
which is then removed.

`calculatePirthdays(birthday, c)` maps `buildMilestones(c)` through `addYearsToDate`
exactly as today, carrying `isSpecial` through.

## Feature 2: State + live switching

- **Module state:** hold the entered birthday (`Date` or null) and the active
  constant key in variables. Currently the birthday is discarded after each click;
  storing it is what makes live switching possible.
- **Selector:** a segmented control (`π | e`) placed in the input section next to
  the date field. It stays on screen above the results, so it is reachable both
  before entry and after results render — one selector serves both requirements.
- **On constant change:**
  1. Set active constant.
  2. Update `document.title`, the `<h1>`, `.tagline`, and footer constant line
     from the registry (full rebrand).
  3. If a birthday is stored, recompute + re-render immediately. If not, just the
     rebrand happens. No page reload, no re-entry of the birthday.
- **On Calculate:** store the parsed birthday, then compute + render with the
  active constant (existing flow, now constant-aware).

## Feature 3: Calendar export (.ics)

- **Trigger:** a "Download .ics" button living in the results section markup
  (`index.html`), inside the `hidden` results block so it appears with results
  and hides with them. Wired in JS.
- **Scope:** future pirthdays only (those with `date > now`). Past milestones are
  omitted — nobody sets a calendar reminder for a date already passed.
- **Format:** one iCalendar 2.0 file (`text/calendar`), triggered as a download via
  a Blob + object URL. Structure:
  - `BEGIN:VCALENDAR` / `VERSION:2.0` / `PRODID:-//pirthday//EN` / `CALSCALE:GREGORIAN`.
  - One `VEVENT` per future pirthday:
    - `UID` — stable, derived from birthday + multiplier (e.g. `<epoch>-<label>@pirthday`).
    - `DTSTAMP` — generation time (UTC).
    - `DTSTART;VALUE=DATE:YYYYMMDD` — all-day event on the pirthday's local date.
    - `DTEND;VALUE=DATE:YYYYMMDD` — next day (all-day convention).
    - `SUMMARY` — e.g. `π² Pirthday · ≈9.87 years` (uses active constant's term).
    - `DESCRIPTION` — the milestone description + exact years value.
  - `END:VCALENDAR`.
- **Correctness:** CRLF line endings, text-value escaping (`\` `;` `,` and newline),
  and 75-octet line folding per RFC 5545 — so Google/Apple/Outlook all import cleanly.
- **No VALARM/reminders** — not requested; noted as an easy later addition.

## Files touched

- `index.html` — add the segmented constant selector; add the Download .ics button
  inside the results block.
- `script.js` — registry, `buildMilestones`, ICS builder, state + switch handler,
  rebrand updater. Remove `SPECIAL_MILESTONES`/`STANDARD_MILESTONES`/`ALL_MILESTONES`
  /`isSpecialMilestone`.
- `style.css` — style the segmented control + the download button.
- `test.js` (new) — node-runnable asserts. Made browser-safe with
  `if (typeof module !== 'undefined') module.exports = …` at the end of `script.js`
  so pure functions can be required under node without affecting the browser.

No new dependencies, no build step.

## Testing

`test.js` (plain node, `assert`, no framework) covers the two non-trivial pieces:

1. **Milestone generation** — `buildMilestones(CONSTANTS.e)` produces the expected
   standard count (all `n·e ≤ 100`), includes the derived specials with correct
   multipliers (`e²`, `e^e`, `e!`, extras), and is sorted ascending.
2. **ICS builder** — for a fixed birthday, output has one VEVENT per future
   milestone, valid `BEGIN/END:VCALENDAR` framing, `VALUE=DATE` dtstart, CRLF
   endings, and correct escaping of a SUMMARY containing a comma/semicolon.

Manual check: load `index.html`, switch π↔e with and without a birthday entered,
download the .ics and import into a calendar app.

## Out of scope (deferred)

- Per-card "add to calendar" buttons.
- Past / special-only export subsets.
- VALARM reminders.
- Third constant beyond e (registry makes it a one-entry add when wanted).
