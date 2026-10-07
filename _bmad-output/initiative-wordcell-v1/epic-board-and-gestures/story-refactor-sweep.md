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

Closing cleanup of epic 4 from build records and deferred review findings, plus the epic 3 carry-ins: R7 (history.svelte.ts cases into src/shell/history.svelte.test.ts, names unchanged), R6 (fold the game, history and prefs stores' repeated rejectReason, launch-text/isStale()/loaded() snapshot and halted/booting write guard into src/shell/stored-key.ts; F18, never importing ./storage; no behaviour or message change) and the AD-17 unit-suite re-measure with its split-or-stop rule.

- R6 shape: as build-notes.md CAP-10 — `rejectReason` generic over the three parse results; a `lastText` tracker `{ remember, isStale, text() }` fed by each store's own `read(KEY)` (`text()` serves history's Q-39 rollback); the `loaded()` launch snapshot; `assertWritable(kind, op)` (`AD-15 <op>() while <kind>`; callers pass `game.state.kind`, so stored-key.ts imports no shell store) for history `reset` and the prefs setters; the game store has no AD-15 halted/booting write guard (its AD-4/AD-16 kind checks stay); every caller keeps its exact error message text; `PrefsRejectReason` derived from `ParsePrefsResult` (retro R6, second sentence).
- R7 boundary: the whole `describe('score history store')` block moves (build-notes.md CAP-10), names unchanged; the five game-store blocks stay; setup helpers it needs are copied (tests never import each other), the duplication named in the plan.
- Re-measure (AD-17), once after all in-scope changes: metric: Vitest-reported `Duration` of `npm test`, warm `fsModuleCache`, median of three after a discarded warm-up, wall clock beside it. Watch re-run: the slowest engine `*.test.ts` in the median run, saved unchanged in a temporary Linux-filesystem clone (drvfs gets no file events, AGENTS.md), median of three Vitest-reported Durations; a warm `npx vitest run <file>` Duration may proxy, but a proxy over 1 s needs the real measurement before any stop; the plan names the method. Below 5.00 s passes; at 5.00 s or more, split architecture.test.ts before any other speed-up and re-measure; if still, record per-file timings and stop for the owner before built (epic Done when 5, SPEC CAP-10). A real watch re-run over 1 s records per-test timings and stops (CAP-10).
- Split shape: read Scaffold deltas first; root-level `src/architecture-<topic>.test.ts` files split by AD; the self-scan exclusion (`SELF`), tsconfig.arch.json `files` and tsconfig.app.json `exclude` each become the set of all of them; the plan records these and the spine AD-1/AD-17/Scaffold-delta lines naming `src/architecture.test.ts` for the retrospective and AGENTS.md refresh.
- Flakes: fix D1 and D4 first; a timing run with a failure is discarded and repeated; a flake recurring in test:all is fixed, not rerun past.
- Interface: new src/shell/stored-key.ts and src/shell/history.svelte.test.ts; no export change outside src/shell/ except src/ui changes an In row requires (e.g. a ControllerDeps member, layout getter), listed in the plan; no src/engine/index.ts change; test-only: e2e/helpers/ modules (D8), architecture split files.
- Tests: existing suites plus the inventory's added cases, which sharpen existing coverage; no new rule coverage.
- Owns: R6, R7, the re-measure and split, the inventory below, and recording in the plan the AGENTS.md Where-things-are update (stored-key.ts, layout/, gestures/, act.ts, split files) for a bmad-project-context refresh; the build does not edit AGENTS.md (tickets.toml over build-notes.md CAP-10's "Update AGENTS.md").

## Deferred inventory

The builder re-checks each row against HEAD, recording "already resolved by 4.x" or a skip reason in the plan. Logs: `_bmad-output/implementation-artifacts/review-loop/`; digest: `autopilot/epic-board-and-gestures-20261001-1955.md`. The sweep edits done tickets' plans only where a row names a plan edit (D5, D6, D9); never ticket files.

| Id | Item | Source | Disposition |
| --- | --- | --- | --- |
| D1 | Android flake in e2e/layout.spec.ts "AD-11 banner during a scroll applied after it ends" and "… after a hide, before the quiet point" (150.3 ms vs 150 ms) | digest 4.5, 4.7, 4.8, 4.10, 4.12; plans' deferred lists | In: deterministic under full-suite load, same assertions, 150 ms window (the gate's quiet period) unwidened; 5 consecutive green full `npm run test:e2e` runs in the plan; any failing test resets the count and is fixed, or recorded with its error output if outside the inventory |
| D2 | Modal-above-view refusal untested: "a modal on top of a view" calls `closedByBack(0)` before `open('historyNotice')` | 4-5-build.md Result open major | In: test-only fix as the log says |
| D3 | Controller tests never assert the resolved press target | 4-6-build.md Result open major; digest 4.6 | In: record whether controller.test.ts "every press target kind the controller resolves" (4.7+) covers it; add the assertion if not |
| D4 | Flaky "AD-12 F33 a pointercancel of a drag from above the selection" in e2e/drag-interruptions.spec.ts | 4-9-f32.md Result open major | In: log default, pause all three faces in one `page.evaluate` |
| D5 | story-desktop-hover-peek-plan.md still names App.svelte as the hoverFine watcher | 4-12-build.md Result open major | In: plan text names the controller's `watchHoverFine` and its Vitests |
| D6 | Hover timer survives a replaced cell element; closed-rect `<=` resolves the shared 6/7 edge to the left cell; four test/plan sharpenings | 4-12-build.md Pass 2 Unapplied minors | In: key the timer by cell number; half-open rects; a controller Vitest each; the four sharpenings |
| D7 | Column hit rects not clipped to the sticky top bar, so a tail over the bar can light a column beneath it | 4-8-build.md unapplied minor; digest 4.8 | Owner decision pending (review log pass 2): proposed — clip each column's hit rect to the visible band between the sticky top bar (plus banner when shown) and the action bar, controller Vitest, android Playwright case, AD-12 wording note for the retrospective; if declined, Out → accepted for v1, AD-12 note at the retrospective |
| D8 | e2e helpers (`openFixture`, `box`, `centre`, `column`, `foot`, `cards`, `sameSession`) copied, with variants (board-phases `steps`, drag-interruptions `prefs`, layout no `booted`) in board, board-phases, column-phases, drag, drag-interruptions, layout, pointer, tap, wordcell-view specs | story-drag-interruptions-…-plan.md Review Triage Log l.117 | In: one e2e/helpers/ module named in the plan, tests in e2e/helpers.spec.ts; variants as optional parameters, every call site behaving the same; bodies change only in imports, else the copy stays local with a reason in the plan |
| D9 | Test, name and plan minors, one batch per source: 4-1 Result (geometry tests, layout purity scan); 4-2 minors 2–8; 4-3 (test sharpenings only); 4-4 minor 2 (narrow-desktop touch-action); 4-5 minor 1 (name mentions an unopened hover peek); 4-6 minors 1–3, 5 (incl. same-id recovery before the button check); 4-7 (tile click path, stacking); 4-8 (tie-break, flyBack kinds, arrangement assert, expectDragging, R-14 in the "Q-34 a sub-25 % drag" name, stale Residual-risks sentence); 4-9-build and 4-9-f32 notes; 4-11 minors 4–5 (R-65/Q-21 ids and unchanged checks on the tap.spec.ts peek test; scrim `elementFromPoint`) | the named logs | In |
| D10 | 4-11 minors 1–3 (long still press on the view scrim, wheel over the scrim scrolls the board, view wider than the screen below ~320 px); 4-4 safe-area change without resize and the <384 px desktop height rule | 4-11-build.md; story-live-layout-gate-and-touch-action-regions-plan.md deferred; digest | Out → epic 7 device pass |
| D11 | Keyed `{#each}` before FLIP; QU tray-tile badge overlap | 4-3-build.md | Out → epic 5 (Tray and Place, FLIP) |
| D12 | ActionBar 14 px shrink-before-ellipsis (unreachable with today's catalogue) | 4-2-build.md | Out → epic 6 (game surfaces) |
| D13 | 4.6 F30 desktop scrollbar strip | digest 4.6 | Out: owner decision, not reopened |
| D14 | 1/2-card count badge untested since 4.2 | story-composing-place-and-static-tray-rendering-plan.md deferred | Out → epic 4 retrospective |
| D15 | 4.10–4.12 screenshot carry-overs | 4-10-build.md Result; digest 4.11, 4.12 | Discharged by the screenshot clause below |
| D16 | A `sameId` end leaves an open peek open | 4-6-build.md unapplied minor 4 | In: log default (close the peek on `sameId` like `pointercancel`); a controller Vitest |
| D17 | A release ≥ 8 px from the press with no pointermove classifies as a tap | 4-8-build.md pass 2 (out of scope there) | In (EXPERIENCE.md Pointer thresholds): classify by pointerup coordinates; ≥ 8 px with no drag started is no tap: nothing dispatched, selection unchanged; a classify/controller Vitest |
| D18 | Lost-end touch press (new pointerId each touch) and other-pointerType recovery | story-pointer-controller-core-and-cancel-wiring-plan.md deferred | In: run the plan's repro as a controller Vitest; if reachable, recover on a new-pointerId pointerdown (covering other-pointerType); else record "unreachable" and why in the plan |
| D19 | Compact tray (8+ tiles, two clipped rows, QU compact tile) unchecked in a browser; no-placeholder case for a whole column dropped on another | story-composing-place-and-static-tray-rendering-plan.md deferred (handed to 4.7/4.8) | Compact tray Out → epic 5 (Tray and Place); negative case In: one assertion in e2e/drag.spec.ts's whole-column drag test |
| D20 | Plain cancel() of a replacing drag under a sticky view; stale hover under a still mouse after a layout shift; on-device long-press contextmenu suppression; untested Banner Reload full-reload path (AD-13 launch rewind) | story-drag-interruptions-…-plan.md deferred[0]; story-tap-select-…-plan.md Residual risks; story-pointer-controller-…-plan.md deferred | First In: confirm unreachable since 4.11's scrim, or add a Vitest; the rest Out → epic 7 device pass |

## Out of scope

Close-out doc edits (spine, EXPERIENCE.md, DESIGN.md, build-notes.md wording, the digest's close-out lines; e.g. 4-4 CAP-3 "absolutely positioned", 4-7 CAP-6 hover classes, 4.1 AD-11 helper exports, the 4-9-f32 ticket-Notes `deferred[0]` wording) fold at the retrospective per the epic Notes.

## Acceptance Criteria

Verify: npm run test:all green; the R6 fold and R7 move leave every existing test unedited except imports (R7: file location); tests named by an inventory row may change, each edit mapped to its row; game.svelte.test.ts holds only game-store cases; the plan records the warm median, the watch re-run and method, every change mapped to a row, the AGENTS.md additions, and the median below 5.00 s or the owner stop. npm run test:screens runs in the container when Docker is reachable; otherwise (as 4.10–4.12: review logs, digest) the plan records "not run (Docker unreachable)" and a green screenshot run (container or CI on the branch head) moves to the owner's done/merge gate, not blocking built.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-board-and-gestures/epic-board-and-gestures.md
- spec — _bmad-output/specs/spec-epic-4-board/build-notes.md, CAP-10
- retro — _bmad-output/initiative-wordcell-v1/epic-app-shell/epic-app-shell-retrospective.md, Action items R6, R7
