---
title: 'Win trigger and celebration test seam'
type: 'feature'
ticket: '5'
created: '2026-10-23'
status: done
route: 'full'
route_source: 'auto'
review: 'thorough'
review_source: 'auto'
lenses_ran: [blind-hunter, edge-case-hunter, verification-gap, intent-alignment]
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/AGENTS.md'
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-end-of-game-words/story-win-trigger-and-celebration-test-seam.md'
warnings: [oversized]
deferred:
  - summary: >-
      No test shows that a real win in the hook-free dist/ build starts the celebration (the flag stays on outside the hook-build gate).
    evidence: |-
      main.ts turns the flag off only inside the DEV || VITE_TEST_HOOKS gate; the unit test checks only the module default and the dist-smoke R-87 relaunch row never reads the flag (openAtBoot). Moving setCelebrationEnabled(false) out of the gate would ship R-87 disabled with test:all green. Entry 8 owns the hook-free real-win dist-smoke spec (rule-coverage "R-87 hook-free build (dist-smoke only): a real win plays"); close it there by asserting a [data-celebration-root] is added after a real winning Confirm.
    location: >-
      src/main.ts (AD-17 Celebration seam block); e2e/pwa/dist-smoke.spec.ts
    severity: medium
baseline_revision: '00a13047f727b388941c38a989f1b628cace24ad'
---

<intent-contract>

## Intent

**Problem:** The celebration controller (entry 3) and its overlay entry (entry 4) exist but nothing starts a run, mounts `Celebration.svelte` or attaches the controller, and Playwright has no way to drive a run (AD-17 seam), so R-87 cannot be seen or tested.

**Approach:** Exactly as the ticket (story file, read it fully: Description bullets Enabled flag, Start, Hook, Helper; AC) states, with the resolutions under Design Notes: an enabled flag in `celebration.svelte.ts`, the start in `onDispatched`'s winning `whenSettled` callback, the `{#if}{#key}` mount in `App.svelte`, `attachOverlays()` and the gated seam registration in `main.ts`, the frozen `celebration` hook in `test-hook.ts`, and an e2e helper plus a new `e2e/celebration.spec.ts`.

## Boundaries & Constraints

**Always:** Rule 6: hook misuse throws `AD-17 …` before any change. AD-1: shell never imports `src/ui/` (the seam is passed in). Import the controller as `./celebration/celebration.svelte.ts` (Scaffold deltas). Nothing containing `__wordcell` outside `test-hook.ts`'s existing gate (AD-18 `dist/` scan). Test names carry ids (`R-87` for P6, `AD-17`/`AD-19` for Vitest and the hook specs). Every existing win and sheet assertion stays as it is (seam off in hook builds).

**Never:** Skip, back/menu/hide/resize handling (entries 6–7), any `dist-smoke` real-win spec (entry 8), a doc edit to the spine, SPEC or EXPERIENCE.md (entry 9), a screenshot baseline, a ticket-file edit, a new public member on the pointer controller.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Start | enabled, not reduced, visible at settle; still won, token live | `cancelGesture()`, `overlays.startCelebration()`, `celebration.start(view, done)`; no sheet yet | — |
| `done` visible | after the entry's removal | `game.view?.status === 'won' && openDeferred(token)` then `announceOutcome()` | dead token (Undo): nothing |
| `done` hidden | `document.visibilityState !== 'visible'` | after `game.whenVisible()`: the guarded open, no `announceOutcome()` | — |
| No-start | flag off, `prefs.motion.reduced`, or hidden at settle | today's open unchanged (no `celebration` push) | — |
| Stale settle | not won or token dead (new `overlays.isLiveToken`) | nothing (no cancel, no push, no start) | — |
| Give up / `openAtBoot` | any flag | never start | — |
| Hook before registration | any method | — | throws `AD-17 …` |
| Hook misuse | 2nd `registerCelebrationSeam`; `setEnabled` while `running()`; `advance` while not `running()` | nothing changed | throws `AD-17 …` |

</intent-contract>

## Code Map

- `src/ui/celebration/celebration.svelte.ts` -- add module `let enabled = true`, `export function celebrationEnabled(): boolean`, `export function setCelebrationEnabled(on: boolean): void` (plain, not `$state`); header comment gains entry 5. Singleton `celebration` has `start/running/advance/setManual/register/props`; `attachOverlays()` at L270-ish.
- `src/ui/overlays.svelte.ts` -- add `isLiveToken(token): boolean` (`liveToken !== null && token === liveToken`, non-consuming) beside `openDeferred` (L300) and export it on `overlays` (L364–417).
- `src/ui/end-sheet.ts` -- `onDispatched` winning branch (L31–36): the callback per the matrix (sketch in Design Notes); imports `celebration`, `celebrationEnabled` from `./celebration/celebration.svelte.ts`, `cancelGesture` from `./act`, `prefs` from `../shell/prefs.svelte`. Header comment updated. Give up and `openAtBoot` untouched.
- `src/ui/App.svelte` -- active branch, after `<EndSheet>`: `{#if celebration.props() !== null}{#key celebration.props()}<Celebration … register={celebration.register} />{/key}{/if}` (props read with a non-null cast or an `{@const}` where Svelte allows it); biome-ignore comments as for the other markup-only imports.
- `src/shell/test-hook.ts` -- export type `CelebrationSeam = { running(): boolean; advance(ms: number): void; setManual(on: boolean): void; setEnabled(on: boolean): void }` and `registerCelebrationSeam(seam)` (module `let seam`; second call throws); inside the existing gate the frozen hook gains `celebration: Object.freeze({ advance, running, setEnabled })`; `declare global` type gains `celebration: Readonly<{ advance(ms: number): void; running(): boolean; setEnabled(on: boolean): void }>`.
- `src/main.ts` -- `attachOverlays()` right after `nav.register({...})` (every build); right after `nav.registerBeforeBack(...)` a `if (import.meta.env.DEV || import.meta.env.VITE_TEST_HOOKS === '1')` block: `setCelebrationEnabled(false)` then `registerCelebrationSeam({ running, advance, setManual, setEnabled: setCelebrationEnabled })` bound to the singleton. Comment the invariant: no `await` between `game.load()` and this block, so a page that reads `current().kind === 'active'` finds the seam registered.
- `e2e/globals.d.ts` -- mirror the hook type.
- `e2e/test-hook.spec.ts`, `e2e/pwa/test-hook.spec.ts` -- retitle (`… loaded, current, dictionaryState and celebration`), keys `['celebration','current','dictionaryState','loaded']`, nested frozen with keys `['advance','running','setEnabled']`; add the default-off test (Tasks).
- `e2e/helpers/celebration.ts` -- new: exported `WON_ROWS` (moved verbatim from `e2e/end-sheet.spec.ts` L751; that spec imports it, `GAVE_ROWS` stays there), `enableCelebration`, `finishCelebration`, cap constants, `watchAdded(page, selector)` observer (pattern: `watchFor` in `e2e/win-guard.spec.ts` L32, but observing `document`, `subtree: true`, `matches(s) || querySelector(s)`).
- Reuse: `openFixture`, `glidesSettled` (`e2e/helpers/board.ts`), `wc` (`helpers/dialogs.ts`), `hidePage`/`showPage` (`helpers/lifecycle.ts`), `seedStorage`/`fixture` (`helpers/seed.ts`), `onAndroid` (`helpers/project.ts`). Fixtures: `session-won-words` (won; `steps: ['undo']` gives the Place phase whose Confirm wins), `session-idle-fresh`, `prefs-fast`, `prefs-non-default` (Slow). Give up: Menu → `Give up` (no confirm).
- Unit patterns: `src/ui/end-sheet.test.ts` `load()` (L28) with `vi.mock`s; `src/ui/celebration/attached.test.ts` for the singleton.

## Tasks & Acceptance

**Execution:**
- [x] `src/ui/celebration/celebration.svelte.ts`, `src/ui/overlays.svelte.ts` -- flag functions; `isLiveToken` -- Enabled flag, Start bullets
- [x] `src/ui/end-sheet.ts` -- winning callback per the matrix and the Design Notes sketch -- Start bullet
- [x] `src/ui/App.svelte` -- the keyed mount -- Description
- [x] `src/shell/test-hook.ts`, `src/main.ts`, `e2e/globals.d.ts` -- seam, registration, `attachOverlays()` -- Hook bullet, AD-17 Celebration seam
- [x] `src/shell/test-hook.test.ts` (new, `AD-17`): `vi.stubGlobal('window', {})`, `vi.mock` `./game.svelte` and `./dictionary.svelte`, `vi.resetModules()` + fresh import per case; cases: every method throws before registration; second registration throws; `setEnabled` throws while the stub `running()` is true and calls neither setter; idle `setEnabled(on)` calls the flag setter then `setManual(on)`; `advance` throws while not running and delegates while running; hook and `celebration` frozen with the sorted keys
- [x] `src/ui/end-sheet.test.ts` -- mock `./celebration/celebration.svelte.ts` (stub `celebration.start` recording `(view, done)`, `celebrationEnabled()` reading a test flag, `setCelebrationEnabled`), `./act` (`cancelGesture` pushes `'cancel'` to `calls`), `../shell/prefs.svelte` (`importOriginal` spread, `prefs.motion.reduced` from a test flag), game mock gains `whenVisible`; `load()` sets the flag off after `vi.resetModules()`; `vi.stubGlobal('document', { visibilityState })` per new case, `vi.unstubAllGlobals()` after each. New `AD-19` cases: enabled, visible and not reduced → order `cancel`, `push` (celebration), `start` called once with the store's view after settle, sheet hidden until `done`; then close the entry (test registers `onCelebrationRemoved`) and call `done` → `push`, expanded, one `outcome`; a second `done` adds nothing; reduced, disabled or hidden at settle → today's open (`['push']`, expanded, no cancel, no start; the hidden case asserts the open, not the announce); not won or dead token at settle → `calls` empty, no start; Give up and `openAtBoot` (won) with the flag on → no start; `done` while hidden → nothing until the `whenVisible` promise resolves, then expanded with no `outcome`. Existing cases unchanged.
- [x] `src/ui/celebration/celebration.svelte.test.ts` -- `AD-17` the flag defaults on; `setCelebrationEnabled` toggles it
- [x] `e2e/helpers/celebration.ts`, `e2e/end-sheet.spec.ts` (import `WON_ROWS`), `e2e/helpers.spec.ts` (`AD-17` self-tests: `enableCelebration` + Confirm → `running()` true; `finishCelebration` → `running()` false, sheet expanded)
- [x] `e2e/test-hook.spec.ts`, `e2e/pwa/test-hook.spec.ts` -- four-key assertions; `AD-17 the celebration seam is off by default …`: `openFixture('session-won-words', { steps: ['undo'] })`, `watchAdded('[data-celebration-root]')`, Confirm → sheet expanded, `running()` false, nothing added
- [x] `e2e/celebration.spec.ts` (new, `android`) -- the R-87 rows below
- [x] `e2e/pwa/dist-smoke.spec.ts` -- `R-87 a relaunch into a won game plays no celebration in the hook-free build`: `seedStorage` won-words, `addInitScript` observer (no `__wordcell` name), sheet expanded, nothing added
- [x] `npm run test:all` green

**Acceptance Criteria:**
- Given the ticket's AC (story file), when the suites run, then each clause has a passing test, with these resolutions: R-87 run — `history.length` and `wc` read once `running()` is true (`wc` 1), and after the sheet opens only once `wc` polls back to 1, then the lengths are equal; the sheet dialog has count 0 while `running()`; Replay this deal focused.
- Given the cap rows at Fast (`prefs-fast`) and Slow (`prefs-non-default`), when `running()` has been asserted true first (the review log's open major), then after `advance` by the cap rounded up to 16 ms (3008, 10672) `running()` is false and the sheet expanded; at Slow, after `advance(3008)` `running()` is still true.
- Given the R-87 no-start rows, when Give up (`session-idle-fresh`), emulated reduced motion (`page.emulateMedia({ reducedMotion: 'reduce' })` before `openFixture`) and hidden-at-settle (`prefs-non-default`, Confirm then `hidePage` at once, then `showPage`) each run after `enableCelebration` and an observer installed before the finishing action, then no `[data-celebration-root]` was added and the sheet is expanded; relaunch: enable, win, `running()` true, `page.reload()` → sheet expanded, zero `[data-celebration]`.
- Given the copies row, when a run is live, then `[data-card-id]` is 52, `[data-celebration]` is 55, zero `[data-celebration]:is([data-card-id],[data-testid],[data-mirror-of])`, the i-th group's `.glyph` texts (`Qu` → `QU`) spell the word of `WON_ROWS[i]`, and advancing in 16 ms steps (at most the cap) reaches a group with computed opacity > 0 and a non-empty `style.transform`; second run — Undo after the first sheet opens, Redo → a handle to a first-run group is disconnected and a second-run group reaches opacity > 0 (`R-87 a Redo that restores the win plays it again …`).
- Given `git diff --name-only`, then no `*-snapshots` path appears.

## Implementation Notes

- Hidden-at-settle row (AC 3): the settle callback runs through the winning guard's 300 ms floor (`whenOpenAllowed`, AD-14), so a `hidePage` immediately followed by `showPage` lets the callback run visible and start a run. The spec stays hidden until today's open has run (the emulated visibility leaves the sheet rendered, so `toBeVisible` waits for it), then `showPage`; the outcome asserted is unchanged.
- `App.svelte` reads the props through `const run = $derived(celebration.props())` and `{#if run}{#key run}` (no cast needed).
- `main.ts`'s side-effect `import './shell/test-hook'` became the named `registerCelebrationSeam` import (Biome order); the hook still installs at import.
- `e2e/helpers/celebration.ts` also exports `running`, `advance`, `MANUAL_STEP_MS`, `FAST_CAP_STEP_MS` / `NORMAL_CAP_STEP_MS` / `SLOW_CAP_STEP_MS` (3008, 6000, 10672) and `watchAddedFromBoot` (the `addInitScript` observer used by `dist-smoke`; window key `__added`, no `__wordcell` name).
- Verification: lint, check, unit (88 files, 3460 tests), build, `test:e2e:dist` (19) green in one `test:all` run; its `test:e2e` had two timing failures outside this change (`nav.spec.ts:162` rejected-root double tap, `success-signal.spec.ts:440` drag), each green 3/3 with `--repeat-each 3`; a rerun of `test:e2e:pwa` (17) then `test:e2e` (1067) was green. No `*-snapshots` path in `git diff --name-only`.
- Now that `Celebration.svelte` mounts, the dev server logs Svelte's `binding_property_non_reactive` warning for its `bind:this={elements[g]}` (entry 3's deliberate plain array); a console warning only, left as is.

## Plan Change Log

## Review Triage Log

### 2026-10-23 — Review pass
- verdicts: 19 findings — high 0, medium 2, low 11, false 6, maybe-false 0
- findings:
  - `[low]` `[patch]` blind: the Redo test's first-run `isConnected` check passes with or without a fresh mount, and the second run's size is unchecked — `finishCelebration` already unmounts run 1 (the ticket keeps `{#key}` as design, review passes 2 and 4); patched: once Redo's run is live, assert 10 `[data-celebration-group]` and 55 `[data-celebration]`.
  - `[low]` `[patch]` blind: `watchAddedFromBoot` has no positive self-test, so the dist-smoke R-87 relaunch row could pass with a dead observer — patched: `AD-17 watchAddedFromBoot attaches before the app runs …` in `e2e/helpers.spec.ts` records `[data-testid="column-1"]`.
  - `[low]` `[reject]` blind: the cap rows do not prove the cap (not all groups exiting) ended the run — the ticket's cap row is exactly "after advancing by the cap … `running()` false", and the Slow row proves the scaling; asserting `running()` at cap − 16 depends on entry 6's tuning of when groups exit.
  - `[low]` `[reject]` blind: the e2e cap constants restate the AD-19 formula — Playwright cannot import the `.svelte.ts` prefs module, the constants cite AD-19, and the helper test pins them; an extra source of truth is unavoidable here.
  - `[low]` `[patch]` blind: `overlays.isLiveToken` has no direct unit test — patched: `AD-13 isLiveToken …` in `src/ui/overlays.svelte.test.ts` (live, not consumed, false after open, cancel, or a newer defer).
  - `[low]` `[reject]` blind: no regression test for the long-press timer under `celebration` — the U case pins `cancel` before the push; the hazard needs multi-input (entry 4 triage) and a P6 for it is a larger test than the fix.
  - `[low]` `[patch]` blind: the hidden-at-settle row depends on `hidePage` landing before the settle — it uses Slow for margin (passed in every full run); patched: the comment now says why Slow is used. The P6 for `done` on a hidden page is entry 7's hide row.
  - `[false]` `[reject]` blind: the reload row cannot fail — the ticket calls it "outcome only"; the failable relaunch guard is the dist-smoke R-87 row and the U `openAtBoot` case.
  - `[false]` `[reject]` blind: the hidden-at-settle U case does not assert the announce — deliberate per the ticket review log (the open is asserted; `announceOutcome()` is silent only through `say()`'s `document.hidden` return, which this mock bypasses).
  - `[low]` `[reject]` blind: `observeAdded` duplicates win-guard.spec.ts's `watchFor` — refactoring an existing spec is outside this ticket; candidate for the entry 10 sweep.
  - `[low]` `[reject]` edge: hook `advance(ms ≤ 0)` is a silent no-op — entry 3's specified controller contract (its plan's pass-7 major: `advance` does nothing for ms ≤ 0); the hook adds only the ticket's two throws.
  - `[low]` `[patch]` edge: the first-run handle check is vacuous after `finishCelebration` — same root cause as the first blind row; fixed with it.
  - `[medium]` `[defer]` verification-gap: nothing shows the hook-free `dist/` build keeps the flag on for a real win — real; entry 8 owns the hook-free real-win dist-smoke spec (rule-coverage CAP-6 row); deferred to it.
  - `[false]` `[reject]` intent: the hook's `advance` throw goes beyond the intent — the ticket's review log asks the build for exactly this throw (rule 6).
  - `[low]` `[patch]` intent: the `{#key}` remount is never exercised — grouped with the first blind row (count assertions added; `{#key}` stays as design).
  - `[medium]` `[defer]` intent: the real-rAF, flag-on surface is checked only negatively — same root cause as the verification-gap row; deferred with it.
  - `[false]` `[reject]` intent: the win-trigger Vitest runs against stubs — that is the ticket's U design; the real removal → `done` → open path runs in the P6 run row (history assertions).
  - `[false]` `[reject]` intent: tests beyond the intent (hidden-at-settle P6, freeze, setter order, flag default, cap constants, zero-attribute count) — each comes from the ticket review log's items for the build; no defect.
  - `[false]` `[reject]` intent: the no-`await` invariant between `game.load()` and the seam block is not enforced by a test — if it broke, `enableCelebration` would hit the hook's `AD-17 … before the seam is registered` throw and fail loudly; nothing hides.

## Design Notes

Winning callback (sketch; names free):

```ts
whenSettled(() => {
  if (!celebrationEnabled() || prefs.motion.reduced || document.visibilityState !== 'visible') {
    if (game.view?.status === 'won' && overlays.openDeferred(token)) announceOutcome();
    return;
  }
  const view = game.view;
  if (view?.status !== 'won' || !overlays.isLiveToken(token)) return;
  cancelGesture();               // entry 4 deferred: an armed long-press timer would openPeek
  overlays.startCelebration();
  celebration.start(view, () => {
    if (document.visibilityState === 'visible') {
      if (game.view?.status === 'won' && overlays.openDeferred(token)) announceOutcome();
    } else void game.whenVisible().then(() => {   // epic 6 SPEC F16: a return is silent
      if (game.view?.status === 'won') overlays.openDeferred(token);
    });
  });
});
```

Flag first so the flag-off unit cases never read `document` (Vitest `environment: 'node'`).

Review-log items left for the build, resolved:
- end-sheet.test.ts flag/visibility/document — Tasks (flag off after each `load()`, flag checked first, `document` stubbed per case).
- Hook `advance` throws when not `running()` — built in test-hook.ts like `setEnabled`; `finishCelebration` and the cap rows advance only while running.
- Slow "still running after the Fast cap" — depends on entry 6 keeping the last Slow launch after 3 s; recorded for entry 6.
- References (`Celebration.svelte`, `e2e/end-sheet.spec.ts`, `e2e/pwa/dist-smoke.spec.ts`, `src/shell/game.svelte.ts`) — in the Code Map.
- `{#key}` second-run proof — dropped in the review; `{#key}` stays as design.
- `pagehide` before `visibilitychange` on other engines — Android Chrome fires `visibilitychange` first; not handled here.
- Open major (cap row) — AC 2. `WON_ROWS` exported from the helper. Flag API `celebrationEnabled()`/`setCelebrationEnabled(on)`. Shell test stubs `window`, fresh module per case. Observers per Code Map. Copies P6 zero-attribute count — AC 4. `enableCelebration` invariant — main.ts comment. Relaunch failable check in `dist-smoke` (Pixel 7), entry 9's audit records it. Hidden-at-settle P6 — AC 3. History poll — AC 1.

Owner checkpoint items (rule 7; ticket plan checkpoint, built unattended as 10.4 was):
1. The reduced/disabled path pushes no `celebration` entry, and a page hidden at settle starts nothing; both refine AD-19 Start ("pushes the entry and starts; … goes straight to `done`") and EXPERIENCE.md "Never plays"; entry 9 syncs them.
2. Until entry 7, ☰ or `M` during a run throws (`open(menu)` guard): the branch must not merge before entry 7.

## Verification

**Commands:**
- `npm run lint && npm run check && npm test` -- expected: green
- `npx playwright test e2e/celebration.spec.ts e2e/test-hook.spec.ts e2e/helpers.spec.ts e2e/end-sheet.spec.ts e2e/win-guard.spec.ts` -- expected: green
- `npm run test:all` -- expected: green
- `git diff --name-only | grep -- -snapshots` -- expected: no output

## Auto Run Result

Status: built. Blocking condition: none.

**Summary:** a win now plays the celebration. The winning `whenSettled` callback starts the run when the AD-17 flag is on, motion is not reduced and the page is visible; it first checks that the game is still won and the token is live (`overlays.isLiveToken`), then cancels the press, pushes the entry and starts the run. The run's `done` runs the token-guarded open: announced on a visible page, or silently after `whenVisible()` on a hidden one. Otherwise today's open runs unchanged; Give up and `openAtBoot` never start a run. `Celebration.svelte` is mounted per run (`{#if}{#key}`). `attachOverlays()` runs at boot in every build. In hook builds only, a block after `registerBeforeBack` turns the flag off and registers the seam behind the frozen `window.__wordcell.celebration` (`advance`, `running`, `setEnabled`). The e2e helper is `e2e/helpers/celebration.ts`.

**Files:**
- `src/ui/end-sheet.ts` — the win trigger.
- `src/ui/overlays.svelte.ts` — `isLiveToken`.
- `src/ui/celebration/celebration.svelte.ts` — `celebrationEnabled()` / `setCelebrationEnabled()`, default on.
- `src/ui/App.svelte` — the keyed `Celebration` mount.
- `src/main.ts` — `attachOverlays()`; the gated flag-off and `registerCelebrationSeam` block.
- `src/shell/test-hook.ts` — `registerCelebrationSeam`, the frozen `celebration` hook and its AD-17 throws; `e2e/globals.d.ts` mirrors the type.
- Tests:
  - `src/shell/test-hook.test.ts` (new) and `src/ui/end-sheet.test.ts` (AD-19 win trigger).
  - `src/ui/celebration/celebration.svelte.test.ts` and `src/ui/overlays.svelte.test.ts`.
  - `e2e/celebration.spec.ts` (new, 9 R-87 rows) and `e2e/helpers/celebration.ts` (new; `WON_ROWS` moved here).
  - `e2e/helpers.spec.ts` and `e2e/end-sheet.spec.ts` (imports `WON_ROWS`).
  - `e2e/test-hook.spec.ts` and `e2e/pwa/test-hook.spec.ts` (four keys, default-off).
  - `e2e/pwa/dist-smoke.spec.ts` (R-87 hook-free relaunch).

**Review:** 19 findings across blind, edge, verification-gap and intent lenses.
- Patched 4 entries, all low:
  - the second run's group and copy counts;
  - a `watchAddedFromBoot` positive self-test;
  - an `isLiveToken` unit test;
  - the hidden-at-settle comment saying why Slow is used.
- Deferred 1 (medium, two lenses): no test shows that a real win in hook-free `dist/` starts the celebration. It goes to entry 8's real-win dist-smoke spec.
- Rejected 11 rows, with reasons in the triage log.

Follow-up review recommended: false (patched: high 0, medium 0, low 4).

**Review-log items:** all resolved in Design Notes. The open major (assert `running()` before the cap advance) is built: `winIntoRun` polls `running()` true at both speeds.

**Verification (this `/mnt/wsl` checkout, after the patches):**
- Green: lint (1 pre-existing e2e warning), check, unit (88 files, 3461 tests), build (557779 / 600000), `test:e2e:dist` (19), `test:e2e:pwa` (17).
- `test:e2e`: 1067 passed, 1 failed. The failure, `e2e/nav.spec.ts:162` (rejected-root New game double tap, no celebration on the path), is the known load flake from 10.4; it passed 5/5 alone.
- The celebration and helper rows were rerun and passed (12).
- No `*-snapshots` path changed.

**Residual risks:**
- Until entry 7, ☰ or `M` during a run throws (the `open(menu)` guard), so the branch must not merge before entry 7.
- The Slow-cap row's "still running after the Fast cap" relies on entry 6 keeping the last Slow launch after 3 s.
- `Celebration.svelte`'s `bind:this={elements[g]}` (entry 3) logs Svelte's `binding_property_non_reactive` dev warning now that it mounts.
- The deferred `dist/` real-win check (entry 8).
- Owner checkpoint items 1–2 under Design Notes: the no-push reduced/disabled path and the hidden-at-settle no-start refine AD-19 Start and EXPERIENCE.md, for entry 9's sync.
