---
title: 'Lifecycle and visible-time clock'
type: 'feature'
ticket: '6'
created: '2026-09-30'
status: 'built'
route: 'full'
route_source: 'auto'
review: 'thorough'
review_source: 'auto'
lenses_ran: [blind-hunter, edge-case-hunter, verification-gap, intent-alignment]
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-app-shell/story-lifecycle-and-visible-time-clock.md'
  - '{project-root}/_bmad-output/specs/spec-epic-3-app-shell/build-notes.md'
warnings: [oversized]
deferred: []
baseline_revision: '81a61e91cafe2ff52825d7c1da0a0ca21ffd8257'
---

<intent-contract>

## Intent

**Problem:** The visible-time clock never runs and nothing saves on hide: the store has no `visibilitychange`/`pagehide`/`pageshow` listeners, no hide flush, no `registerBeforeHide`, no `whenVisible`, and a page restored from the back/forward cache never notices another window's write (Q-38).

**Approach:** Add `registerLifecycle`, `registerBeforeHide`, `whenVisible` and `isStale` to the AD-4 store (members of the exported `game` object), call `registerLifecycle()` from `main.ts` right after `load()`, add `startHidden(page)` to `e2e/helpers/lifecycle.ts`, and the shell Vitest and android Playwright tests the ticket lists. The ticket file is the authority for every detail; Design Notes settle the review log's open major and unapplied minors.

## Boundaries & Constraints

**Always:** AGENTS.md rules 1–7, Conventions and Known pitfalls (`visibilitychange`/`pagehide`/`pageshow` listeners only in `game.svelte.ts`; `localStorage` only in `storage.ts`; no `history` binding); no try/catch in the flush (rule 6); write first, then assign; shell Vitest names start `AD-4`/`AD-9`/`AD-16`, Playwright names start with the ticket's ids; seed only through `seedStorage`/`fixture`; unit suite < 5 s; engine sources, R-02 literals and fixtures unchanged.

**Never:** the gesture cancel or pointer controller (epic 4); history/prefs `isStale` owners (entries 7, 10); dictionary `whenVisible` wiring (entry 9); a guard enforcing the before-hide callers' contract; feedback changes in the flush; edits to the ticket file or SPEC.md; a new test-hook accessor.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| hide while active | hidden or pagehide | callbacks (in order), `now` read once, `take(now)`, `pause(now)`, accrue, write, assign, session text updated | — |
| hide while rejected/halted/booting | hidden or pagehide | callbacks, take, pause; no write | — |
| throwing callback / write | flush | propagates; no later step; state unchanged | to AD-15 |
| visible again | visibilitychange visible, or pageshow while visible | `clock.resume`; visibilitychange also resolves pending `whenVisible` | — |
| pageshow while hidden | any persisted | no resume, `whenVisible` stays pending | — |
| persisted pageshow | active/rejected, `read(session) !== lastText` | `halt('another-window')`, then resume iff visible | — |
| persisted pageshow | halted | no staleness check (fatal kept) | — |
| registerLifecycle | second call after success / booting / halted | throws `AD-16 registerLifecycle() called twice` / `… while <kind>`; adds no listener | thrown |
| whenVisible | before registerLifecycle | throws synchronously `AD-16 whenVisible() before registerLifecycle()` | thrown |

</intent-contract>

## Code Map

- `src/shell/game.svelte.ts` -- AD-4 store. `state` `$state.raw`; `load()` (halted path, first-launch write, parse); `dispatch` (write then assign at the `result.session !== before` branch); `fresh(seed)` (take discarded, assign, write); `halt` overloads; exported `game` object with getters; import-time `storage` listener on `window`. Add a module `let sessionText: string | null` set at every read/successful write (Design Notes 1). Update the header comment.
- `src/shell/clock.ts` -- `resume/pause/take/peek(now)`; reuse, do not change.
- `src/shell/storage.ts` -- `read`, `write`, `SESSION_KEY`; reuse.
- `src/main.ts` -- `boot()`: `await fontCheck(); game.load(); if halted { showStandalone(); return; }` then `mount(App)`. Insert `game.registerLifecycle()` after the halted return, before `mount` (AD-16).
- `src/shell/game.svelte.test.ts` -- node env; `setup()` stubs `window` (`new EventTarget()`), `localStorage` (fake with `writes`, `map`, `control.failWrites`), `performance` (`time.now`), `crypto`; returns `{ game, clock, storage, time, storageEvent }`. Extend: stub `document` as `Object.assign(new EventTarget(), { visibilityState: 'visible' })` (settable), spy on both stubs' `addEventListener` and record listeners by type (Design Notes 4).
- `e2e/helpers/lifecycle.ts` -- `hidePage`/`showPage` (throw if already in that state), `pageHide`, `pageShow({ persisted })`. Add `startHidden(page)`: `page.addInitScript` defining configurable `visibilityState: 'hidden'` and `hidden: true` getters on `document`.
- `e2e/helpers.spec.ts` -- android-only AD-17 helper tests; describe `hidePage / showPage / pageHide / pageShow` at ~383. Add the `startHidden` test.
- `e2e/helpers/storage-spy.ts` -- `armStorageSpy(page)` (waits for non-booting; once per Page), `storageWrites(page)`.
- `e2e/helpers/seed.ts` -- `seedStorage(page, { session })`, `fixture(name)`.
- `e2e/blocking.spec.ts` -- patterns: android skip, `kind`, `stored`, `expectAnotherWindow` (copy into the new spec, do not import a spec), clock `install({ time: 0 })` + `pauseAt(1000)` before goto.
- Fixtures: `session-place.json` (playing, Place, Undo enabled), `session-won.json`, `session-gave-up.json`, `session-invalid-version-unknown.json`.
- Existing e2e that compare stored Sessions byte-for-byte across a reload or after time passes (`e2e/game-store.spec.ts`, `blocking.spec.ts`, `app-shell.spec.ts`, `helpers.spec.ts`) may now see a pagehide write or a non-zero accrued `activeMs` once the clock runs; fix such a test by asserting what the rule says (e.g. compare with `current().session`, or install `page.clock` paused), never by weakening the store.

## Tasks & Acceptance

**Execution:**
- [x] (before edits) `npx vitest run` -- record Duration.
- [x] `src/shell/game.svelte.ts` -- Design Notes 1–3: `sessionText`, `flush`, `registerLifecycle`, `registerBeforeHide`, `whenVisible`, `isStale`, all on `game`.
- [x] `src/main.ts` -- `game.registerLifecycle()` after the halted early return, before `mount(App)`; comment AD-16 order.
- [x] `src/shell/game.svelte.test.ts` -- the shell Vitest cases (Tests mapping).
- [x] `e2e/helpers/lifecycle.ts` + `e2e/helpers.spec.ts` -- `startHidden` and its `AD-17 startHidden …` test (goto after it: `visibilityState` `'hidden'`, `hidden` true; `showPage` → `'visible'` and a `visibilitychange` seen).
- [x] `e2e/lifecycle.spec.ts` -- new, android-only; the Playwright cases (Tests mapping). Setup per case: `page.clock.install({ time: 0 })`, `pauseAt(1000)` before goto, advance only with `runFor`; seeded `activeMs` read from the fixture; `armStorageSpy` after boot unless stated.
- [x] Fix any existing spec the running clock or the hide write breaks (Code Map last bullet); record each in Implementation Notes.
- [x] Docs -- none: `rule-coverage.md` rows R-73 (hidden, not on ticks), R-76 and Q-38 bfcache already describe these tests; the build edits no ticket or spec file.
- [x] Verification section; record outputs in Implementation Notes.

**Tests mapping (sentence → test):**
- R-73 hidden → `R-73 AD-17 hidePage alone writes exactly one wordcell:session entry` (place; spy armed after boot; log length 1, key session); `R-73 pageHide alone writes the accrued activeMs` (place; spy; `runFor(N)`; `pageHide`; exactly one session entry, `activeMs` = seeded + N; review-log open major); `R-73 activeMs is flushed on hide, not on ticks` (spy; `runFor` with no input → zero entries).
- R-73 flush assigns → `R-73 the hide flush assigns the accrued Session` (place; A; hidePage; showPage; B; Undo → stored `activeMs` = seeded + A + B).
- R-76 → `R-76 time grows only while visible` (A, hidePage, H, showPage, B, hidePage → seeded + A + B); `R-76 a won or given-up Session keeps its activeMs` (won and gave-up, each: advance, hidePage → one entry, seeded `activeMs`); `R-76 a fresh first-launch deal grows` (unseeded; spy; N; hidePage → one entry `activeMs` N); `R-76 AD-17 a page loaded hidden does not grow until showPage` (place; `startHidden` before goto; N; pageHide → seeded; showPage; M; hidePage → seeded + M); `R-76 AD-17 pageShow not persisted while hidden does not resume` (place; hidePage; `pageShow({ persisted: false })`; N; pageHide → its one entry's `activeMs` equals hidePage's); `R-76 New game starts at activeMs 0 with the discarded take` (gave-up; A > 0; New game; B; hidePage → `activeMs` B; minor: label R-76, not R-74).
- Q-38 → `Q-38 a persisted pageshow after a same-page key change halts` (place; `page.evaluate` sets `wordcell:session` to won's text; `current().kind` active; `pageShow({ persisted: true })` → another-window surface); `Q-38 a persisted pageshow after an own dispatch stays active` (place; Undo; `runFor(N)`; pageHide; pageShow persisted → active, no alertdialog).
- AD-15 → `AD-15 halted: the hide flush writes nothing` (halt via the Q-38 path; arm the spy only once `kind` is halted; hidePage, pageHide → empty log).
- §2 → `§2 rejected: the hide flush writes nothing` (version-unknown; spy; hidePage, pageHide → empty log, bytes === fixture).
- Shell Vitest: every case of the ticket's AC "Shell Vitest" list, named `AD-4 …`, `AD-16 …`, `AD-9 …` as listed there; the AD-16 second-call case asserts the thrown message and that the addEventListener spies saw no new call.

**Acceptance Criteria:**
- Given the finished change, when `npm run test:all` runs, then it exits 0 and the unit suite stays under 5 s.
- Given the dev server, when the tab is hidden and shown, then `localStorage['wordcell:session']` `activeMs` grows by the visible playing time only (the Playwright suite above is the proof).
- Given the change, when `git diff --stat src/engine fixtures` runs, then it is empty.

## Implementation Notes

- Unit suite (`npx vitest run`): before 1504 tests, Duration 4.76 s; after 1524 tests, Duration 4.86 s (inside `test:all`). Under 5 s, but with little headroom.
- Store: `sessionText`, `flush`, `registerLifecycle`, `registerBeforeHide`, `whenVisible`, `isStale` and the internal `staleOwners()` OR list, all following Design Notes 1–3; the header comment is updated. `main.ts` calls `game.registerLifecycle()` after the halted early return, before `mount(App)`.
- Shell Vitest: new `describe('game store lifecycle')` with 20 cases: the AD-4 own-write/no-halt matrix (first-launch load, dispatch, hide flush via hidden and via pagehide, newGame from active and from rejected, replay); rejected/valid load followed by a persisted pageshow; rejected load with changed text halting; plus the AD-16 guards, whenVisible and resume-iff-visible cases and the AD-9 order/throwing-callback/failWrites/rejected-flush cases. `setup()` now stubs `document` and returns `doc`, `added(type)` and `fire(type, event)` (listeners called directly, Design Notes 4). Extra cases beyond the ticket list: a non-persisted pageshow does not halt, registerLifecycle resumes only when visible, and the flush while rejected writes nothing.
- E2e: `startHidden(page)` in `e2e/helpers/lifecycle.ts` and its `AD-17 startHidden …` test in `e2e/helpers.spec.ts`; new `e2e/lifecycle.spec.ts` (android only, 14 tests, as the Tests mapping lists).
- Existing spec fixed: `e2e/helpers.spec.ts` `AD-17 captureBoot records absent keys as null and later writes on reload`. Its stand-in `'s'` write was overwritten by the active store's pagehide flush on reload (R-73). The test now installs a paused `page.clock` and asserts that the boot value equals the pre-reload `current().session`. No other spec broke: the other seedStorage/captureBoot tests seed unparseable text (`'a'`), which gives a rejected store, so the flush writes nothing.
- Verification: `npm run test:all` exit 0 (lint, check, unit, build, e2e:dist 13 passed, e2e 84 passed / 74 skipped, e2e:pwa 12 passed); `git diff --stat src/engine fixtures` empty.

## Plan Change Log

## Review Triage Log

### 2026-09-30 — Review pass
- verdicts: 16 findings — high 0, medium 1, low 10, false 4, maybe-false 0
- findings:
  - `[low]` `[patch]` (blind) `startHidden` comment says "next navigation" but the init script runs on every navigation of the Page — comment corrected (grouped with edge #3).
  - `[medium]` `[patch]` (blind) no test that a visible pageshow resumes the clock — added shell Vitest `AD-9 a pageshow while visible resumes the clock after a pagehide flush` (persisted true/false); deleting `resumeIfVisible()` fails both (grouped with verification-gap #1).
  - `[low]` `[reject]` (blind) `expectAnotherWindow`/`kind`/`stored` copied from blocking.spec.ts — real duplication, but the fix is a new shared helper module, more than a direct correction; candidate for the entry 12 refactor sweep.
  - `[low]` `[patch]` (blind) captureBoot test no longer checks a test-written value — the test also writes `'s'` to `wordcell:prefs` and asserts the boot capture holds it (grouped with intent #1).
  - `[low]` `[patch]` (blind) throwing before-hide callback test does not show the rest of the flush is skipped — asserts `clock.peek` unchanged and still running.
  - `[low]` `[reject]` (blind) failed-write test does not pin that the taken ms are lost — that loss is the rule-6 outcome, not a defect; pinning it adds no protection the order test lacks.
  - `[low]` `[patch]` (blind) no staleness case for a removed key — added `AD-4 an active store whose wordcell:session was removed …` halting with another-window.
  - `[low]` `[patch]` (blind) `whenVisible` "resolves at once" weak; hidden visibilitychange not checked — settled after one microtask asserted; a hidden visibilitychange leaves callers pending.
  - `[false]` `[reject]` (blind) `registerBeforeHide` has no unregister — AD-9 defines `registerBeforeHide(fn)` for main.ts-created singletons (pointer controller, gate); a disposer is new public surface the spine does not specify.
  - `[low]` `[patch]` (blind) header comment omits `registerBeforeHide` and the `staleOwners()` extension point — both named.
  - `[false]` `[reject]` (edge) pageshow while visible does not drain `whenVisible` resolvers — the ticket says a pending caller resolves on the store's next visibilitychange to visible; a page cannot go hidden→visible without that event.
  - `[low]` `[patch]` (edge) visibilitychange resumed on any non-hidden state — now `hidden → flush; else if visible → resume + drain` (ticket: resume iff visible).
  - `[low]` `[patch]` (edge) `startHidden` affects every navigation — same root cause as blind #1; comment fixed.
  - `[medium]` `[patch]` (verification-gap) visible pageshow resume unverified — same as blind #2; test added.
  - `[false]` `[reject]` (intent) captureBoot helper test now depends on app behaviour — the forced edit is recorded in Implementation Notes; the independent prefs stand-in now restores helper-only coverage (blind #4 patch).
  - `[false]` `[reject]` (intent) a halting persisted pageshow still resumes while halted, untested — the ticket states resume iff visible in every state, harmless while halted (nothing writes).

## Design Notes

1. **Staleness text:** `sessionText` = the text `load()` read (`null` when absent; also on the halted and rejected paths), or the text just written by load's first-launch write, `dispatch`, `fresh` and the flush, set right after `write` returns. `isStale()` = `read(SESSION_KEY) !== sessionText`.
2. **Flush** (no try/catch): `for (fn of beforeHide) fn(); const now = performance.now(); const ms = clock.take(now); clock.pause(now);` (one `now`, minor); `if (state.kind !== 'active') return;` then `accrued = accrue(state.session, ms, EN)`, `text = serializeSession(accrued)`, `write`, `sessionText = text`, `state = { kind: 'active', session: accrued }`. Feedback untouched.
3. **registerLifecycle:** `if (registered) throw 'AD-16 registerLifecycle() called twice'` (any call after a successful one, minor); `if (booting || halted) throw 'AD-16 registerLifecycle() while <kind>'`; then `document.addEventListener('visibilitychange', …)`, `window.addEventListener('pagehide', flush)`, `window.addEventListener('pageshow', …)`, `registered = true`, `resumeIfVisible()`. visibilitychange: hidden → flush; visible → resume, then resolve and clear pending `whenVisible` resolvers. pageshow: `if (event.persisted && state.kind !== 'halted' && staleOwners())` → `halt('another-window')`; then resume iff visible. `staleOwners()` is `isStale()` today, written as an OR list entries 7 and 10 extend. `registerBeforeHide(fn)`: push, never throws.
4. **Vitest listeners:** `vi.spyOn(doc, 'addEventListener')` and on `win` before `registerLifecycle`; take listeners from `spy.mock.calls` by type and call them directly (`{ persisted: true }` as the event; set `doc.visibilityState` first). Node has no `PageTransitionEvent`.

Review-log resolutions (technical defaults; none changes functionality, UX or gameplay):
- Open major (pageHide alone without an advance) → `R-73 pageHide alone writes the accrued activeMs` advances N first and asserts seeded + N.
- R-74 → R-76 New game label; A > 0 → applied in the Tests mapping.
- "Called twice" = any call after a successful one; `game.isStale()` etc. on the `game` object; one `performance.now()` for take and pause → Design Notes 2–3.
- `startHidden` before goto → Tests mapping (an init script must precede goto).
- Flush leaves feedback unchanged: no test, as the review log decided (a rejected Validate needs a dictionary in shell Vitest); the flush code does not touch `feedback`.

## Verification

**Commands:**
- `npx vitest run` -- all pass, Duration < 5 s (before/after recorded).
- `npm run test:all` -- exit 0.
- `git diff --stat src/engine fixtures` -- empty.

## Auto Run Result

**Summary:** The AD-4 store gains `registerLifecycle()` (visibilitychange on `document`, pagehide/pageshow on `window`, then `clock.resume` iff visible; throws on a repeat call or while booting/halted), the AD-9 hide flush (before-hide callbacks, one `now` for take and pause, then accrue, write and assign only while active; no try/catch), `registerBeforeHide`, `whenVisible()` and the Q-38 `isStale()` protocol (last read/written session text; persisted pageshow halts with another-window unless already halted, through an OR list entries 7 and 10 extend). `main.ts` calls `registerLifecycle()` after `load()`, before mount. `startHidden(page)` added to the lifecycle helpers.

**Files changed:**
- `src/shell/game.svelte.ts` — lifecycle listeners, flush, whenVisible, isStale, registerBeforeHide.
- `src/main.ts` — `game.registerLifecycle()` in the AD-16 order.
- `src/shell/game.svelte.test.ts` — `game store lifecycle` describe (AD-4, AD-9, AD-16 shell cases).
- `e2e/helpers/lifecycle.ts`, `e2e/helpers.spec.ts` — `startHidden` and its AD-17 test; captureBoot test adapted to the R-73 reload flush.
- `e2e/lifecycle.spec.ts` — new android spec: R-73, R-76, Q-38 bfcache, AD-15 halted and §2 rejected flush cases.

**Review-log items:** open major (pageHide alone without an advance) resolved by `R-73 pageHide alone writes the accrued activeMs` (advance 1234, one entry = seeded + 1234). Unapplied minors: R-76 New game label and A > 0 applied; "called twice" = any call after a success applied; four functions on `game` applied; one `performance.now()` applied; startHidden before goto applied; flush-leaves-feedback untested as the review log decided (code does not touch feedback).

**Review findings:** 16 (high 0, medium 1, low 10, false 4). Patched: 9 rows in 7 entries (1 medium: visible-pageshow resume test; 6 low). Deferred: none. Rejected: 7 — duplicated e2e assertion helpers (entry 12 sweep candidate), pinning the lost ms on a failed write (rule-6 outcome), no unregister for before-hide (spine API), pageshow draining whenVisible (ticket rule), captureBoot app dependency (now restored with prefs stand-in), resume while halted (ticket allows), each logged above.

**Follow-up review recommended:** false (patched by verdict: high 0, medium 1, low 6).

**Verification:** `npm run test:all` exit 0 after the patches (unit 1528 passed, Duration 4.80 s; dist smoke 13; dev e2e 84 passed with desktop skips; PWA 12). `git diff --stat src/engine fixtures` empty.

**Residual risks:**
- Unit suite at 4.80–4.86 s, close to the 5 s AD-17 budget.
- Gesture cancel through `registerBeforeHide` and AD-17's "hidePage mid-touchDrag" case arrive with epic 4.
