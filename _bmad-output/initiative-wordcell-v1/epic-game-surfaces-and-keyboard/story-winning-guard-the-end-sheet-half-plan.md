---
title: 'Winning guard: the end-sheet half'
type: 'feature'
ticket: '12'
created: '2026-10-15'
status: done
baseline_revision: 'eb4d1caa990d58d94505c57915905442f314de60'
route: 'full'
route_source: 'auto'
review: 'thorough'
review_source: 'auto'
lenses_ran: [blind-hunter, edge-case-hunter, verification-gap, intent-alignment]
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-game-surfaces-and-keyboard/story-winning-guard-the-end-sheet-half.md'
  - '{project-root}/AGENTS.md'
  - '{project-root}/_bmad-output/specs/spec-epic-6-surfaces/build-notes.md'
  - '{project-root}/_bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/EXPERIENCE.md'
warnings: []
deferred:
  - summary: >-
      e2e/menu.spec.ts:39 (android) fails on the baseline too: menu row height 52.000030517578125 vs 52.
    evidence: |-
      Reproduced with this change stashed; a sub-pixel layout assertion unrelated to the guard.
    location: >-
      e2e/menu.spec.ts:39
    severity: medium
  - summary: >-
      Browser back (finishGuard in the registerBeforeBack callback) and the main.ts wiring have unit coverage of finishGuard only, no e2e (back at depth 0 leaves the app).
    evidence: |-
      Wiring in src/main.ts is not importable by Vitest; the hide wiring is now pinned by e2e.
    location: >-
      src/main.ts
    severity: low
---

<intent-contract>

## Intent

**Problem:** The AD-14 winning guard completes the animation but does not yet cancel the pending end-sheet open on Undo (button or Z keys), has no 300 ms floor on the open at Fast/reduced motion, and hide and back do not finish the animation.

**Approach:** Implement ticket 6.12 (`story-winning-guard-the-end-sheet-half.md`, the authority; its Description and Acceptance Criteria are the contract, not restated here) in `motion.ts`, `flip.ts` and `main.ts`, with outcomes per the build-notes table "Winning-guard input outcomes (CAP-5)".

## Boundaries & Constraints

**Always:** `motion.ts` owns the floor, the Undo key alias, the hold, `finishGuard`, `releaseHold` and the injected `canUndo` predicate (no `GameView` access, AD-3); all clocks use the injected `now` and timers; tests name ids (AD-14, R-62, R-70); no fallbacks (rule 6).

**Never:** change `end-sheet.ts`, `overlays.svelte.ts` or the engine; add screens specs; add a second `registerBeforeBack` (single slot, extend the existing callback); rename flip.ts's own local `releaseHold`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Undo in window | Undo button/Z/Ctrl+Z, Undo enabled | animation completes, undo applies, no sheet | none |
| Other input | tap, Esc, M, N, Redo keys, menu | completes, consumed, sheet opens at max(settled, install+300) | none |
| Fast/reduced, no input | settle < 300 ms | sheet opens at 300 ms | none |
| Hide/back | during window | animation finishes; sheet opens (expanded on return) | none |

</intent-contract>

## Code Map

- `src/ui/motion.ts` -- guard/tracker: add `whenOpenAllowed(cb)`, `finishGuard()`, `releaseHold()`, Undo key alias match, hold logic, `canUndo` param to `startTracker`.
- `src/ui/flip.ts` -- `settleCallbacks`/`drainSettled` (lines ~280-315, 449) drain open callbacks through `whenOpenAllowed`; has its own unrelated local `releaseHold` (line 434).
- `src/main.ts` -- `startTracker(..., canUndo)` reading `game.view?.canUndo`; wrap `dispatched` to call `releaseHold()` on `unfinished`; register `finishGuard` before `hideClear` in `registerBeforeHide`; call `finishGuard()` in the `registerBeforeBack` callback after `controller.cancel`.
- `src/ui/motion.test.ts`, `src/ui/flip.test.ts`, `src/ui/end-sheet.test.ts` -- Vitest (fake clocks) cases listed in the ticket.
- `e2e/` -- Playwright specs for the ticket's AC list (android + desktop; Normal, Fast, Slow, reduced); find the existing winning-guard e2e spec and extend it.
- `src/ui/keys.ts` -- `match` rules the alias mirrors (read-only). `src/ui/overlays.svelte.ts`, `src/ui/end-sheet.ts` -- read-only.

## Tasks & Acceptance

**Execution:**
- [ ] `src/ui/motion.ts` -- floor-aware `whenOpenAllowed`, `finishGuard`, Undo alias + `canUndo`, hold/`releaseHold` per the ticket -- core mechanism
- [ ] `src/ui/flip.ts` -- route open callbacks through `whenOpenAllowed` -- floor applies to every speed
- [ ] `src/main.ts` -- wire `canUndo`, `releaseHold`, hide and back `finishGuard` -- integration
- [ ] `src/ui/*.test.ts` -- unit cases from the ticket (aliases, held Z, hold cases, floor, hide/back, uninstall on open)
- [ ] `e2e/*` -- Playwright cases from the ticket AC list

**Acceptance Criteria:**
- Given a win, when Undo is activated by button or key during the guard window (including between settle and 300 ms), then the animation completes, undoes and no sheet opens.
- Given a win, when any other input arrives, then it is consumed, the animation completes and the sheet opens at max(settled, install+300 ms).
- Given the sheet opened, when Undo, then the sheet closes and play resumes (R-70).

## Implementation Notes

- New game / Replay in the guard window: the only UI path is the menu rows (a menu press is consumed and the menu stays closed, covered per speed) and, on desktop, the N key (covered in the Esc/Tab/M/N case). There is no Replay key and no other control, so no separate Playwright case exists; a Vitest case in src/ui/motion.test.ts pins that a click on a non-Undo control is consumed by an installed guard.

## Plan Change Log

## Review Triage Log

### 2026-10-15 — Review pass
- verdicts: 29 findings — high 0, medium 3, low 5, false 8, maybe-false 0 (remaining carried as rejected/duplicates)
- findings:
  - `[medium]` `patch` vacuous `before` assertion in Undo e2e (blind, edge, gap) — rewritten to assert stored session and history length after Undo
  - `[medium]` `patch` hide e2e passes without finishGuard, "expanded" unasserted (edge, gap) — now asserts no animations running right after hide and expanded sheet on return
  - `[medium]` `patch` missing e2e: WordCell tap, primary action, Redo button, timing at 300 ms, Undo between settle and floor, no history push (intent, blind) — added with page.clock
  - `[low]` `defer` back and main.ts wiring have no e2e/unit — back at depth 0 leaves the app
  - `[false]` `reject` open fires under a held press / ignores backstop — tracked gesture events and owedClick still consumed after uninstall
  - `[low]` `reject` whenOpenAllowed tracker===null runs callback — same pattern as notifySettled; a throw would break other modules' tests
  - `[false]` `reject` releaseHold drops opens without hold / without finish — unfinished dispatch already cancels the token and capture() finished the animation
  - `[low]` `reject` second Undo gesture loses hold; untracked repeat Z; startTracker teardown pending; drainSettled gating all callbacks; Slow fixture name; autofill undefined key (keys.ts has the same unguarded `.key`, rule 6, ticket says typeof-free) — implausible in use or fix adds complexity
  - `[low]` `reject` touch click after the 0 ms timer — design is the ticket's specified one-tick release

## Verification

**Commands:**
- `npm run test:all` -- expected: all green

## Auto Run Result

- Summary: floor-aware `whenOpenAllowed`, `finishGuard`, `releaseHold`, Undo key alias with `canUndo`, Undo hold in `motion.ts`; flip.ts drains opens through it; main.ts wiring (canUndo, releaseHold, hide and back finishGuard).
- Files: src/ui/motion.ts, src/ui/flip.ts, src/main.ts, motion/flip/controller tests, e2e/win-guard.spec.ts.
- Review: 3 medium patches applied (all test-quality), 3 deferred, rest rejected (see triage log).
- Verification: lint, check, unit (2698), dist, pwa e2e green; dev e2e 880 passed, 1 failed (menu.spec.ts:39, fails on baseline too, deferred). An earlier run's board-keys Q-24 failure was load flake (passes alone).
- Residual risk: none open; new-game.ts calls `releaseHold()` beside `overlays.resetForNewSession()` (review fix).
