---
title: 'Winning-animation input guard'
type: 'feature'
ticket: '13'
created: '2026-10-14'
status: 'built'
baseline_revision: 'bbaf8f12ef35fe7d1da59cc57f2248004e8be7b8'
route: 'full'
route_source: 'auto'
review: 'thorough'
review_source: 'auto'
lenses_ran: [blind-hunter, edge-case-hunter, verification-gap, intent-alignment]
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/AGENTS.md'
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-tray-and-place/story-winning-animation-input-guard.md'
  - '{project-root}/_bmad-output/specs/spec-epic-5-tray/SPEC.md'
  - '{project-root}/_bmad-output/specs/spec-epic-5-tray/build-notes.md'
  - '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-wordcell-2026-09-27/ARCHITECTURE-SPINE.md'
warnings: []
deferred: []
---

<intent-contract>

## Intent

**Problem:** After a winning Confirm or Redo, taps, clicks and keys during the win animation can open views or start a new game before the player sees the win (CAP-10). The AD-14 winning guard does not exist yet.

**Approach:** Land the guard and an always-on open-gesture tracker in `src/ui/motion.ts` exactly as SPEC F8 (with F23's 300 ms minimum) and the story file state it, hooked from `flip.play`, the hover-peek timer and `src/main.ts`'s hide flush. The story file's Description and Acceptance Criteria are the full behaviour contract: read them in full and implement every sentence.

## Boundaries & Constraints

**Always:** AGENTS.md architecture rules 1–7 and conventions (act(), single owners, `console.error` only in main.ts, test names start with an id, e2e locators by role/testid rules). `now` and timers injected into the tracker, never `event.timeStamp`; no listener at module load (Vitest environment 'node', fake EventTargets and plain-object events). Direction ui/gestures → motion.ts; motion.ts imports neither flip.ts nor gestures/. Undo recognised only by `[data-testid="undo"]`. Registration order in main.ts: `controller.cancel`, `gate.scrollReset`, then the hide-clear. Fail fast (rule 6).

**Never:** Epic 6 items (pending-open cancel, menu case, Undo key aliases). No change to the deal, engine, or `SESSION_VERSION`. No deviation from SPEC F8/F23; any spec/spine contradiction or game-design question is an intent gap: HALT and record it, never guess. Never touch the `bga-wordcell` repo.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Gesture during win | pointerdown/keydown after install, before settle or <300 ms | `complete` once, event consumed (preventDefault + stopPropagation), gesture consumed to its end | none |
| Triggering gesture tail | repeats, keyup, pointerup, click of the Confirm/Redo press | consumed, never complete | none |
| After settle and 300 ms | pointerdown/keydown in backstop window, no consumed gesture open | guard uninstalls, event passes through | none |
| Consumed gesture still open | pointerdown/keydown after settle and 300 ms | consumed, no uninstall, backstop unchanged | none |
| Undo | any event inside `[data-testid="undo"]` | complete, uninstall, passes through unstopped; its click undoes | none |
| Hide / blur | tracker holds gestures | all cleared, count as last gesture's end; held `repeat:true` keydown with no tracked gesture consumed, no uninstall | none |
| Install while installed | second won result | no-op | none |
| Hover timer | pending at install / hover while installed / after uninstall | cleared / none started / starts | none |

</intent-contract>

## Code Map

- `src/ui/motion.ts` -- today only `duration`/`stagger`; add `install(won, complete)`, `startTracker(doc, win, now, timers)`, settle notification, hide-clear, guard-installed predicate, hover-clear registration.
- `src/ui/flip.ts` -- `play()` (~l.295) calls `motion.install` on entry, before any early return, when `result.finished === 'won'`, with `finishAll` as complete; notify settle at the end of `play()` for the empty-set/no-animation path (incl. the early `return`s) and from `settle(entry)` when the last animation settles (~l.414), reduced-motion 120 ms fade included. Its glide-time `settle` is per animation.
- `src/ui/gestures/hover-peek-timer.ts` -- `hoverEnter` must not arm while the guard predicate is true; register `stopHoverTimer` as motion's hover-clear callback.
- `src/ui/gestures/controller.ts`, `click-swallow.ts` -- consumers; guard capture listeners run ahead of them. Do not change their behaviour.
- `src/main.ts` -- call `startTracker` once at AD-16 boot before the controller is created; `game.registerBeforeHide(hideClear)` after the `gate.scrollReset` registration.
- `src/shell/game.svelte.ts` -- `registerBeforeHide` (read only); order pin in `game.svelte.test.ts` "registerBeforeHide callbacks run in registration order".
- `src/architecture-tree-scan.test.ts` -- style for the `src/main.ts` source-order assertion.
- `fixtures/prefs-fast.json` -- new: `{ "version": 1, "animationSpeed": "fast", "showTimer": false }`, seeded via `e2e/helpers/seed.ts` `seedStorage`; `fixtures/prefs-non-default.json` (Slow) exists; `fixtures/session-won.json`.
- `e2e/helpers/lifecycle.ts` -- `hidePage`/restore; `src/ui/motion.test.ts`, `src/ui/flip.test.ts` -- existing test homes; new Playwright spec e.g. `e2e/win-guard.spec.ts`.

## Tasks & Acceptance

**Execution:**
- [ ] `src/ui/motion.ts` -- implement guard, tracker, owed-click flag, backstop, hover/settle/hide hooks per the story Description -- core of F8/F23
- [ ] `src/ui/flip.ts` -- install on `play()` entry, notify settle on all paths -- both motion settings
- [ ] `src/ui/gestures/hover-peek-timer.ts` -- predicate gate and clear registration -- F8 hover clause
- [ ] `src/main.ts` -- `startTracker` at boot, hide-clear registration order -- AD-9/AD-16
- [ ] `fixtures/prefs-fast.json` -- new fixture
- [ ] `src/ui/motion.test.ts` (+ flip, hover-peek, game.svelte, architecture-scan tests) -- every UI Vitest case in the story's Acceptance Criteria, names starting `AD-14 …`, fake timers/EventTargets
- [ ] `e2e/` new spec -- Playwright android and desktop cases listed in the story ACs, reusing helpers; if Playwright repeated `keyboard.down('Enter')` diverges from a held key, record it in Implementation Notes (Vitest case is authoritative)
- [ ] Docs: none beyond Implementation Notes unless a pitfall emerges

**Acceptance Criteria:**
- Given the story file's Acceptance Criteria, when `npm run test:all` runs, then every listed Vitest and Playwright case exists, runs and passes.
- Given `npm run test:screens` (Docker), when run, then it is green with no baseline changes; if Docker is unavailable, record that in Implementation Notes.
- Given a Confirm win on android, when a cell 6 tap lands during the animation, then no view opens; after settle it opens.
- Given a double tap on primary-action (also under reduced motion and prefs-fast), then the stored session equals the one written after the first Confirm and no New-game Session exists.

## Implementation Notes

- Guard and tracker in `src/ui/motion.ts` (`install`, `startTracker` returning a stop, `notifySettled`, `hideClear`, `guardInstalled`, `setHoverClear`); `install(won, complete)` is a no-op when `won` is false, so `flip.play` calls it unconditionally on entry. `notifySettled` is a no-op when no tracker runs (unit tests of other modules).
- Playwright's repeated `keyboard.down('Enter')` passes the held-Enter case (Slow, Normal); the Vitest `repeat: true` cases remain authoritative.
- Two existing specs (`e2e/nav.spec.ts`, `e2e/history.spec.ts`) clicked New game right after a Redo win; they now wait for settle plus 500 ms (the guard, F8/F23).
- `npm run test:all` exit 0; `npm run test:screens` green in Docker, no baseline changes.

## Plan Change Log

## Review Triage Log

### 2026-10-14 — Review pass
- verdicts: 29 findings — high 0, medium 0, low 5, false 6, maybe-false 0 (18 further rows rejected as spec-defined, test-only or negligible)
- findings:
  - `[false]` `[reject]` settle notified per animation, not last (blind) — flip.ts:430-433 calls `notifySettled` only inside `animations.size === 0`.
  - `[false]` `[reject]` Undo events with a consumed tracked id are consumed (edge) — story/SPEC F8 state "except a consumed gesture's events"; behaviour is specified.
  - `[false]` `[reject]` Tab/F5/Escape consumed while installed (edge) — F8 consumes every keydown/keyup.
  - `[false]` `[reject]` open hover peek not closed at install (edge) — F8 clears only the pending timer.
  - `[false]` `[reject]` verification gaps: none filed; intent-alignment audit descriptive only, no divergence requiring change.
  - `[low]` `[reject]` owedClick not cleared on hide/blur, empty `code` key collision, `playMove` throw after install, `setHoverClear` slot reset by `stop()` (test-only), fixed-sleep e2e waits, plan checkboxes/notes wording — real keyboards always carry a code; a throw halts to AD-15; the next pointerdown/keydown clears owedClick (F8 silent, default); fixes add branches for unlikely cases.
  - `[low]` `[reject]` remaining blind-hunter items (touchstart/contextmenu not tracked, `evaluate` per event, Undo e2e pass-through only in Vitest, hide e2e fixed 800 ms) — outside F8's listener set or cosmetic; Vitest covers pass-through.


## Design Notes

The tracker (always installed once started) owns the open-gesture sets and consumed flags; the guard is a flag plus deadline logic layered on it, so a gesture marked consumed stays consumed after uninstall. Settle/300 ms/backstop clocks use the injected `now` and timers.

## Verification

**Commands:**
- `npm run test:all` -- expected: exit 0
- `npm run test:screens` -- expected: exit 0 (Docker in WSL2)

## Auto Run Result

**Summary:** AD-14 winning guard and always-on gesture tracker in `src/ui/motion.ts` per SPEC F8/F23, hooked from `flip.play`, the hover-peek timer and `main.ts`.

**Files changed:** `src/ui/motion.ts` (guard, tracker); `src/ui/flip.ts` (install on play entry, settle notifications); `src/ui/gestures/hover-peek-timer.ts` (predicate gate, hover-clear registration); `src/main.ts` (startTracker, hide-clear after controller.cancel and gate.scrollReset); `fixtures/prefs-fast.json`; tests in `src/ui/motion.test.ts`, `src/ui/flip.test.ts`, `src/ui/gestures/controller.test.ts`, `src/architecture-tree-scan.test.ts`, new `e2e/win-guard.spec.ts`; `e2e/nav.spec.ts`, `e2e/history.spec.ts` wait out the guard before New game.

**Review:** patches applied 0; deferred 0; all findings rejected with the reasons logged above.

**Follow-up review recommended:** false.

**Verification:** `npm run test:all` exit 0 (re-run by the orchestrator); `npm run test:screens` green in Docker, no baseline changes (implementer's report). Playwright repeated `keyboard.down('Enter')` passed at Slow and Normal; the Vitest `repeat: true` cases remain authoritative.

**Residual risks:** judgment calls in the implementation the story leaves open: `complete` fires once per install; hide/blur do not clear the owed-click flag; a `repeat: true` keydown passes through when no guard is installed. e2e uses fixed waits to outlast the guard.
