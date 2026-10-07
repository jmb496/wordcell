---
id: 13
type: story
title: "Refactor sweep"
parent: epic-board-and-gestures
covers: [CAP-10]
after: [12]
risk: low
---

# Refactor sweep

## Description

Closing cleanup of epic 4 from the build records and deferred review findings, plus the epic 3 carry-ins: move the history.svelte.ts cases into src/shell/history.svelte.test.ts with names unchanged (R7), fold the game, history and prefs stores' repeated rejectReason, launch-text/isStale()/loaded() snapshot and halted/booting write guard into src/shell/stored-key.ts (F18, never importing ./storage; no behaviour or message change; R6), and re-measure the unit suite (recorded in the plan), splitting src/architecture.test.ts with its exemption first if the median is over 5 s and stopping for the owner before built if it still is or a watch re-run exceeds 1 s.

- R6 shape: as build-notes.md CAP-10 — `rejectReason` generic over the three parse results; a `lastText` tracker fed by each store's own `read(KEY)`, which also lets history's Q-39 rollback restore the previous text; the `loaded()` launch snapshot; `assertWritable(owner, op)` (`AD-15 <op>() while <kind>`) only for history `reset` and the prefs setters, the game store keeping its own state checks; every caller keeps its exact error message text; `PrefsRejectReason` derived from `ParsePrefsResult` (retro R6, second sentence).
- R7 boundary: the whole `describe('score history store')` block moves (build-notes.md CAP-10), names unchanged; the five game-store describe blocks stay. The shared setup helpers it needs are copied into history.svelte.test.ts (tests never import each other), the duplication named in the plan.
- Re-measure (AD-17), after every in-scope change: metric is the Vitest-reported `Duration` of `npm test`, warm `fsModuleCache`, median of three after a discarded warm-up; wall clock recorded beside it for information. Watch re-run: the engine `*.test.ts` with the largest per-file time in the median run, measured as a real watch re-run in a temporary clone on the Linux filesystem (drvfs gets no file events, AGENTS.md), else the warm `npx vitest run <file>` Duration as a proxy; the plan names the method. Pass at ≤ 5.00 s. Above it, split architecture.test.ts before any other speed-up and re-measure; if still above, the plan records per-file timings and stops for the owner before built (epic Done when 5, SPEC CAP-10). A watch re-run over 1 s records per-test timings and stops (CAP-10).
- Split shape: root-level `src/architecture-<topic>.test.ts` files split by AD; the self-scan exclusion (`SELF`) becomes the set of all of them.
- Flakes: fix D1 and D4 first; a timing run with a failure is discarded and repeated; a flake that recurs in test:all is a failure to fix, not to rerun past.
- Interface: new src/shell/stored-key.ts and src/shell/history.svelte.test.ts; no export change outside src/shell/. Test-only additions are allowed: e2e/helpers/ modules (D8) and the architecture split files; no src export change from them.
- Tests: existing suites; AD-17 unit budget re-measure; no new rule coverage (the inventory's added Vitest and Playwright cases sharpen existing coverage).
- Owns: R6, R7, the AD-17 re-measure and the architecture.test.ts split, the epic's deferred minors (inventory below), and recording in its plan the AGENTS.md Where-things-are update (stored-key.ts, layout/, gestures/, act.ts, plus any split file names) for a bmad-project-context refresh. The build does not edit AGENTS.md (tickets.toml over build-notes.md CAP-10's "Update AGENTS.md").

## Deferred inventory

The builder re-checks every row against HEAD first and records "already resolved by 4.x" where so; skipped items get a reason in the plan. Logs are `_bmad-output/implementation-artifacts/review-loop/`; digest is `autopilot/epic-board-and-gestures-20261001-1955.md`. The sweep edits done tickets' plans only for recorded drift (D5).

| Id | Item | Source | Disposition |
| --- | --- | --- | --- |
| D1 | Android flake in e2e/layout.spec.ts "AD-11 banner during a scroll applied after it ends" and "… after a hide, before the quiet point" (150.3 ms vs 150 ms) | digest 4.5, 4.7, 4.8, 4.10, 4.12; plans' deferred lists | In: deterministic under full-suite load without widening the 150 ms window (the gate's quiet period), same assertions; 5 consecutive green full `npm run test:e2e` runs recorded in the plan |
| D2 | Modal-above-view refusal untested: "a modal on top of a view" step calls `closedByBack(0)` before `open('historyNotice')` | 4-5-build.md Result open major | In: test-only fix as the log says |
| D3 | Controller tests never assert the resolved press target | 4-6-build.md Result open major; digest 4.6 | In: re-check whether controller.test.ts "every press target kind the controller resolves" (4.7+) covers it; record the answer; add the assertion if not |
| D4 | Flaky "AD-12 F33 a pointercancel of a drag from above the selection" in e2e/drag-interruptions.spec.ts | 4-9-f32.md Result open major | In: log default, pause all three faces in one `page.evaluate` |
| D5 | story-desktop-hover-peek-plan.md still names App.svelte as the hoverFine watcher | 4-12-build.md Result open major | In: update plan text to the controller's `watchHoverFine` with its Vitests |
| D6 | Hover timer survives a replaced cell element; closed-rect `<=` resolves the shared 6/7 edge to the left cell; four test/plan sharpenings | 4-12-build.md Pass 2 Unapplied minors | In: key the timer by cell number; half-open rects; a controller Vitest each; the four sharpenings |
| D7 | Column hit rects not clipped to the sticky top bar, so a tail over the bar can light a column beneath it | 4-8-build.md unapplied minor; digest 4.8 | In (fix to specified behaviour, EXPERIENCE.md Drop targeting steps 6–7): clip column hit rects at the top bar's bottom edge before targeting; controller Vitest and an android Playwright case with the board scrolled |
| D8 | e2e helpers (`openFixture`, `box`, `centre`, `column`, `foot`, `cards`, `sameSession`) copied across drag, drag-interruptions, tap, column-phases specs | story-drag-interruptions-…-plan.md Review Triage Log l.117 | In: move into e2e/helpers/ with tests in e2e/helpers.spec.ts; test bodies change only in imports |
| D9 | Test, name and plan minors, one batch per source: 4-1 Result (geometry tests, layout purity scan); 4-2; 4-3 (test sharpenings only); 4-4 minor 2 (narrow-desktop touch-action case); 4-5 minor 1 (name mentions an unopened hover peek); 4-6 minors 1–3, 5 (incl. same-id recovery before the button check); 4-7 (tile click path, stacking check); 4-8 (tie-break test, flyBack kinds, arrangement assert, expectDragging, R-14 in the "Q-34 a sub-25 % drag" name, stale Residual-risks sentence; pass 2: classify 'up' without coordinates); 4-9-build and 4-9-f32 notes; 4-10 minors; 4-11 minors 4–5 (R-65/Q-21 ids and unchanged checks on the tap.spec.ts peek test; scrim `elementFromPoint`) | the named logs | In |
| D10 | 4-11 minors 1–3 (long still press on the view scrim, wheel over the scrim scrolls the board, view wider than the screen below ~320 px); 4.6 plan's lost-end touch press recovery; 4-4 safe-area change without resize and the <384 px desktop height rule | 4-11-build.md, 4.6 plan, 4-4-build.md; digest | Out → epic 7 device pass |
| D11 | Keyed `{#each}` before FLIP; QU tray-tile badge overlap | 4-3-build.md | Out → epic 5 (Tray and Place, FLIP) |
| D12 | ActionBar 14 px shrink-before-ellipsis (unreachable with today's catalogue) | 4-2-build.md | Out → epic 6 (game surfaces) |
| D13 | 4.6 F30 desktop scrollbar strip | digest 4.6 | Out: owner decision, not reopened |
| D14 | 1/2-card count badge untested since 4.2 | story-composing-place-and-static-tray-rendering-plan.md deferred | Out → epic 4 retrospective, unless a cheap fixture-free test exists |
| D15 | 4.10–4.12 screenshot carry-overs | 4-10-build.md Result; digest 4.11, 4.12 | Discharged by the screenshot clause below |

## Out of scope

Close-out doc edits (spine, EXPERIENCE.md, DESIGN.md, build-notes.md wording, the digest's close-out lines, e.g. 4-4 CAP-3 "absolutely positioned", 4-7 CAP-6 hover classes, 4.1 AD-11 helper exports) are folded at the retrospective per the epic Notes.

## Acceptance Criteria

Verify: npm run test:all is green with the R6 fold and R7 move leaving every existing test unedited except imports (and, for R7, file location); tests named by an inventory row may change, each edit mapped to its row in the plan; game.svelte.test.ts holding only game-store cases; the plan recording the warm median, the watch re-run and its method, every change mapped to an inventory row, the AGENTS.md additions for the refresh, and the median ≤ 5.00 s or the owner stop recorded. npm run test:screens runs in the container when Docker is reachable; otherwise the plan records "not run (Docker unreachable)" and the green screenshot run (container or CI on the branch head) moves to the owner's done/merge gate, not blocking built.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-board-and-gestures/epic-board-and-gestures.md
- spec — _bmad-output/specs/spec-epic-4-board/build-notes.md, CAP-10
- retro — _bmad-output/initiative-wordcell-v1/epic-app-shell/epic-app-shell-retrospective.md, Action items R6, R7
