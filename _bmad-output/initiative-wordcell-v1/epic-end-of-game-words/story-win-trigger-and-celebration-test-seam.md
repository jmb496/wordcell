---
id: 5
type: story
title: "Win trigger and celebration test seam"
parent: epic-end-of-game-words
covers: [CAP-3, CAP-6]
after: [1, 2, 3, 4]
risk: high
---

# Win trigger and celebration test seam

## Description

Mounts `Celebration.svelte` in `App.svelte`'s active-game branch beside `EndSheet` (`{#if}` on the controller's reactive `celebration.props()`, `{#key}` on it, passing `register`, so each run mounts once and `register` matches its groups), calls entry 4's `attachOverlays()` right after `boot()`'s `nav.register(...)`, every build, starts the run from `onDispatched`'s winning `whenSettled` callback with the finish and cap and the no-start cases (relaunch, reduced motion, hidden page, Give up, seam disabled), and adds the AD-17 seam, the four-key changes to `e2e/globals.d.ts`, `e2e/test-hook.spec.ts` and `e2e/pwa/test-hook.spec.ts`, and the e2e helper.

- Interface: `end-sheet.ts` `onDispatched`, the `App.svelte` mount, `window.__wordcell.celebration`, `overlays.isLiveToken`, the `e2e/helpers/` celebration helper (owned here, used by 6 and 7), `main.ts` registrations. Tests: R-87 start, finish and no-start rows (P6), hook specs (P6, dev server and pwa), default-off check (P6), AD-19 wiring (U). Owns: the win trigger, the mount and the AD-17 celebration seam. Consumers: entries 6 and 7 (entry 8 is hook-free and uses entry 6's press helper). Plan checkpoint: the build stops at its plan for the owner.
- Enabled flag: in `celebration.svelte.ts`, default on (hook-free `dist/` always plays on real rAF, SPEC F12; Vitest too); `end-sheet.ts` reads it; only in a new `DEV || VITE_TEST_HOOKS=1` block right after `main.ts`'s unconditional `nav.registerBeforeBack(...)` (AD-16) is it turned off and `registerCelebrationSeam` called; nothing `__wordcell` leaves the gate (the AD-18 `dist/` scan stays green). The existing `src/ui/end-sheet.test.ts` win tests disable it in their setup.
- Start: under `prefs.motion.reduced`, the flag off or a hidden page (`document.visibilityState !== 'visible'` when the callback runs), the winning callback calls neither `overlays.startCelebration()` nor `celebration.start()` and runs today's open unchanged (no `celebration` push/pop, same history sequence; refines AD-19 Start and EXPERIENCE.md "Never plays", entry 9 syncs both). Otherwise, only while `game.view?.status === 'won'` and the deferred token is live (a new non-consuming `overlays.isLiveToken(token)`), it cancels the pointer controller's press (`cancelGesture()` from `act.ts`; entry 4's deferred finding: a long-press timer armed earlier would `openPeek` under `celebration` and throw), then `overlays.startCelebration()` and `celebration.start()`; else nothing. `done` runs today's guarded open (`game.view?.status === 'won' && overlays.openDeferred(token)`): on a visible page at once, then `announceOutcome()`; on a hidden page after `game.whenVisible()`, with no `announceOutcome()` (a return from hidden is silent, epic 6 SPEC F16; entry 4's checkpoint default; entry 7's hide end needs no second `done` path). Give up and `openAtBoot` never start.
- Hook: the frozen `celebration` object (created at import inside `test-hook.ts`'s existing gate, keys `advance`, `running`, `setEnabled`) late-binds via `registerCelebrationSeam`, which takes the controller's `running`, `advance`, `setManual` and the flag setter (the shell cannot import `src/ui/`, AD-1); before that its methods throw (`AD-17 …`, rule 6); a second `registerCelebrationSeam` throws; `test-hook.ts` builds `setEnabled(on)` itself: throws if `running()` (as `setManual`), else sets the flag and `setManual(on)`; the `declare global` type in `test-hook.ts` and `e2e/globals.d.ts` gains it.
- Helper: `e2e/helpers/celebration.ts` exports `enableCelebration(page)` (waits for `current().kind === 'active'`, then enables; before Confirm) and `finishCelebration(page)` (waits for `running()` true and the groups mounted, advances past the Slow (largest) cap, rounded up to 16 ms, asserts `running()` false and the sheet expanded), tested in `e2e/helpers.spec.ts`.

## Acceptance Criteria

Verify: `npm run test:all` is green with every existing win-and-sheet assertion unchanged, and:

- AD-17 (the two hook tests retitled to list `celebration`): both hook specs assert the four-key frozen hook and `celebration` frozen with sorted keys `advance`, `running`, `setEnabled`; a shell Vitest `AD-17` test in a new `src/shell/test-hook.test.ts` covers the throw before registration, the second-registration throw and the `setEnabled` throw mid-run, driven by a stub seam; default-off, on the dev server (`e2e/`) and against `dist-test/` (`e2e/pwa/`), e.g. inside the hook specs: a win without enabling → sheet expanded, `running()` false, and a MutationObserver installed (`page.evaluate`) before Confirm recorded no `[data-celebration-root]` node ever added.
- R-87 (`android`, a new `e2e/celebration.spec.ts`) run: won-words fixture + Undo + Confirm → celebration (sheet hidden while `running()`) → `finishCelebration` → expanded sheet, Replay this deal focused; the `celebration` entry was popped before the sheet's push (`history.length` after the sheet opens equals its value while `running()`; `history.state.wc` is 1 at both).
- R-87 cap at Fast and Slow (seeded prefs): after advancing by the cap rounded up to a whole 16 ms step (`advance` runs 16 ms sub-steps, so `advance(cap)` stops short), `running()` false and sheet expanded; at Slow, `running()` still true after advancing by the Fast cap.
- R-87 no-start: Give up and emulated reduced motion call `enableCelebration` first, then the same observer records no `[data-celebration-root]` added, sheet expanded; relaunch (outcome only; the reload re-runs `main.ts`, which turns the seam off before `openAtBoot`): enable, win, `running()` true, reload mid-run → sheet expanded at boot, zero `[data-celebration]` (AD-13 "a reload mid-run is a relaunch"); the start guard is an `R-87` hook-free check in `e2e/pwa/dist-smoke.spec.ts` (flag on, real rAF): won-words session via `seedStorage`, observer via `addInitScript` → no `[data-celebration-root]` ever added, sheet expanded; the U `openAtBoot` case is the unit guard.
- R-87 copies: live `[data-card-id]` stays 52 while the `[data-celebration]` count is the literal 55 (`cards.length` summed; QU one copy); the i-th `[data-celebration-group]`'s `.glyph` texts (`Qu` read as `QU`) spell the word before the comma of the i-th `WON_ROWS` row (moved from `e2e/end-sheet.spec.ts`, non-exported, into `e2e/helpers/celebration.ts`, imported by both specs; end-sheet assertions unchanged); advancing in 16 ms steps (bounded by the cap) reaches a group with opacity > 0 and a non-empty transform; second run: Undo after the first run's sheet opens, then Redo → a handle to a first-run group is disconnected and a second-run group reaches opacity > 0.
- AD-19 UI Vitest in `src/ui/end-sheet.test.ts`: enabled and not reduced → press cancelled, `startCelebration`, `start` after settle, sheet opens only on `done`, once, with `announceOutcome`; reduced, disabled or hidden at settle → today's open only; not won or dead token at settle → nothing; Give up and `openAtBoot` never start (the relaunch guard); `done` on a hidden page opens after `whenVisible()`, with no `announceOutcome`; existing cases stay green.
- No `*-snapshots` file is modified.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-end-of-game-words/epic-end-of-game-words.md
- architecture — ARCHITECTURE-SPINE.md AD-9, AD-13, AD-14 (winning guard), AD-16, AD-17 (Celebration seam), AD-19
- design — EXPERIENCE.md Win celebration
- code — src/ui/end-sheet.ts, src/ui/end-sheet.test.ts, src/ui/App.svelte, src/ui/celebration/celebration.svelte.ts, src/ui/overlays.svelte.ts, src/ui/act.ts, src/ui/motion.ts (whenOpenAllowed), src/shell/test-hook.ts, src/main.ts, e2e/globals.d.ts, e2e/test-hook.spec.ts, e2e/pwa/test-hook.spec.ts, e2e/win-guard.spec.ts, e2e/helpers.spec.ts, e2e/helpers/board.ts

## Notes

- Open question: How the seam's disabled path interacts with the existing winning guard in every existing win spec. Answered by construction (Start); the unchanged-specs run confirms it.
- Until entry 7, ☰ or `M` during a run throws (`open(menu)` guard) to AD-15; no entry 5 test presses them; the branch must not merge before entry 7.
- Decision (owner standing rule, 2026-10-23, code review): the plan checkpoint items stand as built (SPEC F16): a win that settles while hidden opens the end sheet without the celebration; reduced motion or the seam off pushes no `celebration` history entry.
