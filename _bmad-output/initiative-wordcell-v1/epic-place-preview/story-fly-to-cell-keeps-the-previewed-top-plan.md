---
title: 'Fly-to-cell keeps the previewed top'
type: 'feature'
ticket: '3'
created: '2026-10-28'
status: 'ready-for-dev'
route: 'full'
route_source: 'auto'
review: ''
review_source: ''
lenses_ran: []
review_loop_iteration: 0
followup_review_recommended: false
context: ['{project-root}/_bmad-output/initiative-wordcell-v1/epic-place-preview/story-fly-to-cell-keeps-the-previewed-top.md', '{project-root}/_bmad-output/initiative-wordcell-v1/epic-place-preview/epic-place-preview.md']
warnings: ['oversized']
deferred: []
---

<intent-contract>

## Intent

**Problem:** Since ticket 11.2 the target shows its previewed top in Place, but from Confirm (or a committing Redo) until the last landing the F28 hold draws the target's previous top (or a used target's card beneath) under the flying cards. The board briefly goes back to the state before the move (E6).

**Approach:** While `inFlight.committed` is non-empty, `WordCellRow.svelte` draws one `preview`-kind mirror of the cell's new top (`cell.cards.at(-1)`, no `★`, silent) as the target's base, first in DOM order. Above it come the committed cards, which stay visible until the last landing as F28 requires (owner, 2026-10-28: stacking). The cards before the committed run stay hidden. The R-52 used-mirror hold (`inFlight.used`, `Measure.mirrors`) is removed, so `inFlight` keeps only `committed`. **Plan checkpoint (ticket): stop here for the owner.**

## Boundaries & Constraints

**Always:** AD-14 mirrors: the copy carries `data-mirror-of` only, is never animated, never captured (`measure()` reads `[data-card-id]` only), and has no `name`. One live element per card (52 at every snapshot). The hold is released at the last settle or by `finishAll()`, together, never per card. Reduced motion keeps its unstaggered fade over the copy. Test names lead with `AD-14 F28 Q-49` (they are AD-14 tests; Q-49 has no flight sentence, so they are not Q-49 sentence coverage).

**Never:** No change to Place rendering (the `cell.preview` branch), the engine, `planGlides`/`flyingSet`, timings, the `★` pill, fixtures or baselines. No edit to DESIGN.md, the spine or ticket files (entry 5 closes out the docs).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Empty target | `session-place` Confirm | target `shown` `['p28','42','0','28']` at click, first, before last; `['28']` after | none |
| Onto committed | `session-place-onto-committed` Confirm; then settle, Undo, Redo | `['p26','2','19','26']`; 42, 0, 28 never visible | none |
| Used target | `session-place-free-letter-redo-tail` (normal and reduced) | `['p28','9','32','28']`; 0 never visible; copy not `.used`, face opacity 1 | none |
| Used non-target | `session-place-free-letter-two-cards` | cell 4 `['20']` at every snapshot; target 5 `['p42',…]` | none |
| Used single-card source | `session-place-used-cells` (target 5) | cell 3 `[]` + `empty` at every snapshot; cell 6 `['31']`; target `['p38','26','19','27','32','38']` | none |
| Interrupt | Undo mid-flight / `finishAll()` | hold and copy gone; Place preview with `★` again | none |

</intent-contract>

## Code Map

- `src/ui/flip.ts` — delete `inFlightUsed`, `inFlight.used`, `Measure.mirrors` and the `[data-wordcell]` loop in `measure()` (:242-252), the `mirror` lines in `flyToCell` (:361-362), and `inFlightUsed.clear()` in `releaseHold`. Rewrite the header (:13-21, from "`inFlight` (read-only reactive…" through "fly-to-cell hold entry)") and the `inFlight` doc (:51-57): the hold draws the committed cards over a copy of the new top until the last landing. `inFlight` type: `{ readonly committed: ReadonlySet<CardId> }`.
- `src/ui/WordCellRow.svelte` — `shown(cell, lowest)` (drop `usedId`). In the non-preview branch, `hidden` becomes `i !== top && !(lowest >= 0 && i >= lowest)` (no `lowest − 1` reveal). When `lowest >= 0`, put `{ id: cards.at(-1), key: 'preview-<id>', mirror: 'preview', hidden: false, silent: true, mark: false }` first. Delete the `usedId` `@const` and the `{#if usedId}` Card. Header (:16-24): the hold is the new-top copy plus the committed cards, with no 11.2 interim note. Leave the preview branch and `cellName` alone.
- `src/ui/Card.svelte:12-14` — the `preview` doc also covers the fly-in hold's copy of the cell's new top (WordCellRow, flip.ts `inFlight`, F28), drawn without `previewMark`; flip.ts reads only live elements.
- `src/ui/flip.test.ts` — Scene `mirrors` and its comment (:102-107), `FakeRoot.mirrors`, the `show()` assignment and the `[data-wordcell]` branch of `querySelectorAll` (:152-166). After the change, `querySelectorAll` throws on any selector but `[data-card-id]`; bands and tiles stay on `querySelector`; `FakeWrapper.parentElement` (`cellOf`) stays. Update the file header (:9-17) to match. The tests at :600 and :680 change (Tasks).
- `e2e/fly-to-cell.spec.ts` — `fly()` snapshot, `expectFlight`, and the tests listed in Tasks. Header note at :20-21 (the `preview` field, 11.2 interim) is rewritten.
- Read-only: `src/ui/gestures/resolve.ts:72-78` (a press on a cell mirror resolves to its cell). `e2e/helpers/board.ts` `openFixture`, `glidesSettled`.

## Tasks & Acceptance

**Execution:**
- [ ] `src/ui/flip.ts` -- remove the used-mirror hold and update the comments (Code Map) -- the hold has one state, `committed`.
- [ ] `src/ui/WordCellRow.svelte` -- draw the new-top copy first while held, with no previous-top reveal and no used mirror (Code Map) -- E6.
- [ ] `src/ui/Card.svelte` -- doc comment (Code Map).
- [ ] `src/ui/flip.test.ts` -- stricter fake (Code Map). Replace the :600 test with `AD-14 Q-49 inFlight holds only the committed set: …`: `Object.keys(inFlight)` is `['committed']`, a `CELL_START` → `CELL_COMMITTED` flight runs under the strict fake (capture and play read no mirror) and `committed()` is `[3, 4]`, then `finishAll()`. The `[3, 4]` clause repeats :581 but is kept because the ticket AC names it. Rename :680 to `AD-14 flyToCell into an empty cell flies and holds the committed set`.
- [ ] `e2e/fly-to-cell.spec.ts` -- the snapshot records `CellCard.used` (`.used` class), `CellCard.opacity` (computed opacity of the `:scope > .face` child) and, per WordCell, `marks` (`.preview-mark` count) and `empty` (class). Rewrite `expectFlight(run, cell, committed, before)`:
  - Keep its anims, `flightVisible` and start checks, and the badges at the click and after the last landing.
  - `live` 52 in all four snapshots.
  - `ids(afterClick)` is `[newTop, ...before, ...committed]`.
  - `shown` is `['p'+newTop, ...committed]` at the click, after the first landing and before the last; `['newTop']` after the last. Assert no element with `mirror && !preview` (no used mirror) at any snapshot, and no mirror at all after the last.
  - At the click the copy is not `.used` and its `opacity` is `'1'`.
  - `marks` is 0 in every WordCell from the click on; the target is not `empty` in the three hold snapshots.
- [ ] `e2e/fly-to-cell.spec.ts` tests (each renamed `AD-14 F28 Q-49 …`):
  - `session-place`: `expectFlight(run, '3', [42, 0, 28], [])`; the title says "the held copy of the new top" in place of "previous top".
  - onto-committed: `expectFlight(run, '3', [2, 19, 26], [42, 0, 28])` plus `shown` pins `['p26']` at start, `['p26','2','19','26']` at the click and `['26']` after. Then `glidesSettled`, Undo, `glidesSettled`, and `fly(page, 'redo')` with the same `expectFlight` (the committing Redo).
  - redo-tail: `expectFlight(run, '3', [9, 32, 28], [0])`.
  - two-cards: `expectFlight(run, '5', [26, 32, 45, 28, 42], [])`; cell 4 checks unchanged.
  - New: `session-place-used-cells`: `expectFlight(run, '5', [26, 19, 27, 32, 38], [])`. At start and all four snapshots, cell 3 `shown` is `[]` with `empty` true, and cell 6 `shown` is `['31']`.
  - Undo-before-start: keep every check and add `wordcell-3 .preview[data-mirror-of="28"] .preview-mark` count 1. Its Redo uses the new `expectFlight`.
  - Same-task test: unchanged.
  - Reduced motion (redo-tail): fade checks unchanged; `shown` `['p28','9','32','28']` at the click, after the first and before the last; the copy is not `.used` with opacity `'1'` at the click; marks 0; `['28']` and no mirror after the last; 52 live.

**Acceptance Criteria:**
- Given any fixture in the matrix, when Confirm (or the Redo) is clicked, then at the click, after the first landing and just before the last, the target's visible elements in DOM order are the new-top copy followed by the committed cards, with no card from before the committed run, no used mirror, no `★` in any WordCell and 52 live elements. After the last landing only the live new top is visible and the target holds no mirror.
- Given a flight, when it is interrupted (`finishAll()`, Undo), then `inFlight.committed` is empty and the Undo returns Place with the `★` preview (Undo-before-start test, `flip.test.ts` :659).
- Given the change, when `npm run test:all` and `npm run test:screens` run, then both pass and no baseline changes.

## Implementation Notes

## Plan Change Log

## Review Triage Log

## Design Notes

- Why a copy: the live new top is itself the last flying card (fill backwards at its strip rect until its delay), so the cell cannot show it in place. The copy is mounted by flyToCell's second `flushSync`, before paint. The `afterClick` snapshot is taken in the click task, so it reads the first painted DOM; it is the "no flash" check (minor 9).
- Undo of any flight lands in Place, where the cell's `preview` branch draws the cell and the hold branch is not taken. A stale hold therefore cannot render there. The release is unit-tested at :659, and the Undo-before-start test pins one `.preview` in `wordcell-3` (catches a duplicate). So there is no paused-Undo-after-first-landing test (minor 6).
- A used target's own free letter earlier in the placement order (not last) has no fixture. It goes through the same path (one `flyingSet`, copy = `cards.at(-1)`), so it is covered by construction (minor 8).
- Close-out wording for entry 5 (minor 12):
  - Spine AD-14 mirror list: a `preview` mirror is also the fly-in hold's copy of the target's new top, outside Place and without the `★`.
  - Spine AD-14 and DESIGN.md WordCell "hidden on landing if it is no longer the top": per F28, the non-top committed cards hide together at the last landing.
  - DESIGN.md "the target keeps the previewed top": the copy is the base, under the landed cards, until the last landing (owner, 2026-10-28). E6's "used card" means the used look (a used mirror); the copy of a used free letter is at full opacity.
- Review-log minors: 1 → Undo check added, nothing cut. 2, 7 → snapshot fields and `ids()`. 3, 4 → flip.test.ts tasks. 5 → used-cells pins target 5 and cell 6. 10 → the old hold had no base for an empty target; the new one has the copy first. 11 → Boundaries. 13 (split a ticket sentence) → not applied: the build never writes ticket files; the Intent above restates it in short sentences.

## Verification

**Commands:**
- `npm run test:all` -- expected: green.
- `npm run test:screens` (Docker, compare mode) -- expected: green, no PNG changed (`git status` clean under `e2e/**/*-snapshots/`).
- `grep -rn "inFlight.used\|interim" src e2e` -- expected: no hits.

## Auto Run Result

- Status: `ready-for-dev`. The run stopped at the ticket's plan checkpoint (`plan_checkpoint = true`), so nothing is implemented. Jared approves the plan, then a build resumes from `ready-for-dev` (step 3).
- The 13 review-log minors are each resolved or declined in Design Notes. Minor 13 is declined: build runs never write ticket files.
- No commit (the invocation said not to commit).
