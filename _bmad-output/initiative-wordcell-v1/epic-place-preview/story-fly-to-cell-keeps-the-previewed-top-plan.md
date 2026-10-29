---
title: 'Fly-to-cell keeps the previewed top'
type: 'feature'
ticket: '3'
created: '2026-10-28'
status: done
baseline_revision: '136527cfd2e0b154a1b9e8baf1c2511de943d7cf'
route: 'full'
route_source: 'auto'
review: 'thorough'
review_source: 'auto'
lenses_ran: ['blind-hunter', 'edge-case-hunter', 'verification-gap', 'intent-alignment']
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
- [x] `src/ui/flip.ts` -- remove the used-mirror hold and update the comments (Code Map) -- the hold has one state, `committed`.
- [x] `src/ui/WordCellRow.svelte` -- draw the new-top copy first while held, with no previous-top reveal and no used mirror (Code Map) -- E6.
- [x] `src/ui/Card.svelte` -- doc comment (Code Map).
- [x] `src/ui/flip.test.ts` -- stricter fake (Code Map). Replace the :600 test with `AD-14 Q-49 inFlight holds only the committed set: …`: `Object.keys(inFlight)` is `['committed']`, a `CELL_START` → `CELL_COMMITTED` flight runs under the strict fake (capture and play read no mirror) and `committed()` is `[3, 4]`, then `finishAll()`. The `[3, 4]` clause repeats :581 but is kept because the ticket AC names it. Rename :680 to `AD-14 flyToCell into an empty cell flies and holds the committed set`.
- [x] `e2e/fly-to-cell.spec.ts` -- the snapshot records `CellCard.used` (`.used` class), `CellCard.opacity` (computed opacity of the `:scope > .face` child) and, per WordCell, `marks` (`.preview-mark` count) and `empty` (class). Rewrite `expectFlight(run, cell, committed, before)`:
  - Keep its anims, `flightVisible` and start checks, and the badges at the click and after the last landing.
  - `live` 52 in all four snapshots.
  - `ids(afterClick)` is `[newTop, ...before, ...committed]`.
  - `shown` is `['p'+newTop, ...committed]` at the click, after the first landing and before the last; `['newTop']` after the last. Assert no element with `mirror && !preview` (no used mirror) at any snapshot, and no mirror at all after the last.
  - At the click the copy is not `.used` and its `opacity` is `'1'`.
  - `marks` is 0 in every WordCell from the click on; the target is not `empty` in the three hold snapshots.
- [x] `e2e/fly-to-cell.spec.ts` tests (each renamed `AD-14 F28 Q-49 …`):
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

- 2026-10-28, build: the redo-tail call is `expectFlight(run, '3', [9, 32, 28], [42, 0])`, not `[0]`. Cell 3 holds TAN (42, 0, 28) and 28 is the used free letter, so the cards before the committed run at the click are 42 and 0, and the badge is 5. `before` is "the target's card ids before the committed run" in `expectFlight`. The literal `[0]` in Tasks was a slip; the `shown` literal `['p28','9','32','28']` is unchanged.
- The onto-committed test runs Confirm and the committing Redo in one loop (Confirm, settle, Undo, settle, Redo), with the same `expectFlight` and `shown` pins for both.
- `expectFlight` asserts no used mirror in any WordCell at the start and at all four flight snapshots. It also asserts no `★` and 52 live elements at all four flight snapshots.
- Verification: `npm run test:all` green (unit 3629; e2e 1120 passed); `npm run test:screens` green (67 passed), no PNG changed; `grep -rn "inFlight.used\|interim" src e2e` gives no hits.

## Plan Change Log

- 2026-10-28, plan checkpoint: Jared approved the plan as written. Implement.

## Review Triage Log

### 2026-10-28 — Review pass
- verdicts: 17 findings — high 0, medium 0, low 10, false 7, maybe-false 0
- findings:
  - `[low]` `[reject]` (blind) No committing-Redo test on a used target (`session-place-free-letter-redo-tail`) — Redo and Confirm share one `flyToCell` path and one `shown()` branch (Redo is flown on `session-place` and onto-committed); the ticket names exactly this fixture set. Adding another flight is more than a direct correction for a case already covered by construction.
  - `[false]` `[reject]` (blind) No DOM test that an interrupting move removes the copy — the Undo-before-start test pins exactly one `.preview[data-mirror-of="28"]` in `wordcell-3` and its `.preview-mark`, so a leftover copy (also `.preview`, mirror of 28) would make the count 2; in Place `shown()` takes the exclusive `cell.preview` branch, so the hold branch cannot render (Design Notes, minor 6).
  - `[low]` `[reject]` (blind) The copy's used look and opacity are checked only at the click — `shown()` gives the copy the same constant props (`mirror: 'preview'`, no `used`) for every `lowest >= 0` state, so later snapshots cannot differ; extra asserts guard nothing the code can reach.
  - `[false]` `[reject]` (blind) The copy's silence and accessibility are never checked — `Card.svelte:175` sets `aria-hidden="true"` on every mirror and `named` (:115) is false for any mirror, so the copy can never be named or exposed.
  - `[low]` `[reject]` (blind) The reduced-motion test repeats part of `expectFlight` and drops `empty`, badges and `ids` — the plan lists the reduced-motion checks explicitly; the dropped checks are covered by the normal-motion test on the same fixture, and the refactor is more than a direct correction.
  - `[low]` `[reject]` (blind) The onto-committed loop's failures don't name the pass — cosmetic for developers; Playwright reports the failing line, and wrapping in `test.step` adds structure.
  - `[false]` `[reject]` (blind) The hold copy reuses the Place preview key `preview-<id>`, against the header — the header says a live ↔ used or preview *kind* switch remounts; a preview → preview handover keeps the same kind, so keeping the node is consistent and harmless (the `★` is a reactive prop; the e2e snapshots show the copy first at the click).
  - `[false]` `[reject]` (blind) The new unit test is brittle and claims more than it checks — the plan's Tasks prescribe this test, the `Object.keys` pin and the `[3, 4]` clause; the title's "under the strict fake" is accurate, since the fake now throws on any mirror selector during that flight.
  - `[low]` `[patch]` (blind) The flip.ts header says `measure()` reads `[data-card-id]` only, but it also reads `[data-band]` and the tile area — reworded to "`measure()` finds cards only through `[data-card-id]`".
  - `[false]` `[reject]` (blind) Use `cell.cards[top]` instead of `cell.cards.at(-1) as CardId` — with indexed access both are `CardId | undefined`, so the cast stays; the plan names `cells.cards.at(-1)`. No defect.
  - `[low]` `[reject]` (blind) The used-cells test checks fewer properties on cells 3 and 6 (badge, ids) — the matrix row (cell 3 `[]` + `empty`, cell 6 `['31']` at every snapshot) is fully asserted; the extra checks are optional hardening.
  - `[low]` `[reject]` (edge-case) The plan's redo-tail `before` literal `[0]` is wrong; the code `[42, 0]` matches the fixture — the code is right and the fix is to edit this build's plan (already recorded in Implementation Notes).
  - `[low]` `[reject]` (intent) No fixture puts a used target's own free letter earlier than last in the placement order — the plan covers this by construction (Design Notes, minor 8): the same `flyingSet` and copy = `cards.at(-1)`; a new fixture is more than a direct correction.
  - `[low]` `[reject]` (intent) No reduced-motion committing Redo — reduced motion changes only the keyframes and delay in `flyToCell`, not the hold or `shown()`; the ticket asks for reduced motion on Confirm only.
  - `[false]` `[reject]` (intent) The copy's silence and the live top's name are not tested — same as the blind finding: `Card.svelte:175` and `:115` make every mirror `aria-hidden` and unnamed.
  - `[false]` `[reject]` (intent) An Undo mid-flight can't tell a released copy apart from the Place preview — the count-1 `.preview` pin plus `.preview-mark` would fail on a leftover copy (it has no mark, and it would be a second `.preview`).
  - `[low]` `[reject]` (intent) The copy's full opacity and lack of `.used` are checked only at `afterClick` — same as the blind finding: the copy's props are constant across the hold.
  - (verification-gap: no findings.)

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

### 2026-10-28 — build run (after the approved checkpoint)

- **Status:** `built`. Not committed: the invocation said not to commit, so finalization's commit step and its clean-tree check were skipped. The working tree holds the reviewed diff and this plan.
- **Change:** from Confirm (or a committing Redo) until the last landing, the target WordCell draws a silent `preview` mirror of its new top (no `★`) as its base, with the committed cards stacked over it. The cards before the committed run stay hidden, so the previous top never shows. The R-52 used-mirror hold (`inFlight.used`, `Measure.mirrors`) is removed; `inFlight` keeps only `committed`.
- **Files:**
  - `src/ui/flip.ts`: used-mirror hold removed; header and `inFlight` doc rewritten (no 11.2 interim note).
  - `src/ui/WordCellRow.svelte`: the hold draws the new-top copy first; no `lowest − 1` reveal, no used mirror; header rewritten.
  - `src/ui/Card.svelte`: the `preview` doc covers the hold's copy.
  - `src/ui/flip.test.ts`: a strict fake that throws on any mirror selector; the used-mirror test is replaced by `AD-14 Q-49 inFlight holds only the committed set …`; the empty-cell test is renamed.
  - `e2e/fly-to-cell.spec.ts`: the snapshot records `used`, `opacity`, `marks` and `empty`; `expectFlight` is rewritten for the new hold; tests are renamed `AD-14 F28 Q-49 …`; there is a new `session-place-used-cells` test and the onto-committed committing Redo; the Undo-before-start test checks the `★`.
- **Review (thorough: blind-hunter, edge-case-hunter, verification-gap, intent-alignment):** 17 findings. 1 patched (low: flip.ts header wording), 0 deferred, 16 rejected (7 false, 9 low). The reasons are in the Review Triage Log.
- **Follow-up review recommended:** `false`. Patched counts: high 0, medium 0, low 1.
- **Verification:** `npm run test:all` green both times, before and after the patch (unit 3629 passed; e2e 1120 passed; dist 21; pwa 17). `npm run test:screens` green (67 passed), no PNG changed. `grep -rn "inFlight.used\|interim" src e2e` gives no hits. The matrix audit passed: every I/O row is covered by a passing `AD-14 F28 Q-49` e2e test or by the flip.test.ts release test.
- **Deviation from the plan:** the redo-tail `before` literal is `[42, 0]`, not `[0]` (a slip in the plan; see Implementation Notes). The expected `shown` is unchanged.
- **Residual risks:**
  - The stacking look is judged only on DOM order and visibility snapshots, not on pixels. Jared's device read (entry 5) is still the owner check.
  - A used target whose free letter comes earlier than last in the placement order has no fixture; it is covered by construction.
  - The AD-14 mirror list and DESIGN.md hold wording are left to entry 5 (the wording is in Design Notes).

