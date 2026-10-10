---
id: 9
type: story
title: "Place target, order and Confirm"
parent: epic-tray-and-place
covers: [CAP-7]
after: [8]
risk: high
---

# Place target, order and Confirm

## Description

Completes the move (CAP-7). In Place: legal cells ringed, not-legal faded, the stored target pre-selected; a tap on a cell with `canSetTarget` dispatches `setTarget` keeping `placementOrder` (R-51) and clears a tile selection (F1); a long-press ≥ 400 ms on an empty WordCell acts as a tap on release on the cell where it started, wherever released (the timer wins once fired, the 8 px drag before it; Composing: no dispatch, selection kept); a long-press ended by `pointercancel`/`lostpointercapture` dispatches nothing (only a `pointerup` release taps; UI Vitest); a used cell stays a legal target (R-41, Q-02); a not-legal tap dispatches nothing and keeps a tile selection; a current-target tap dispatches nothing and clears it (F13); a drag (≥ 8 px before 400 ms) from a legal non-current cell dispatches nothing and clears it (SPEC CAP-4); WordCells otherwise respond only to viewing (R-39); Confirm commits (R-60, R-61, R-52, R-62 into Game over with no end sheet). UI, fixture and test changes only, no engine or shell source change (SPEC Constraints); Confirm is already wired in ActionBar.svelte (re-proved, not rebuilt); keyboard target keys are epic 6. Existing tests flip: src/ui/gestures/intent.test.ts:93 (Place WordCells inert → a `canSetTarget` cell gives `setTarget`) and controller.test.ts:3469 (a legal non-current cell "dispatching nothing" → one `setTarget`); controller.test.ts:3481 (a drag from a legal non-current cell dispatches nothing) stays; the src/ui/gestures/tile.ts:11-12 note "until ticket 9 dispatches there" is resolved.

Scripts the valid fixture `fixtures/session-place-free-letter-two-cards.json` under the epic 3 regeneration rule (S15): the free letter's cell c's badge reads 2 after the free letter is added and before Confirm; after one Confirm into another cell, c holds 1 card and shows no badge. In src/engine/serialize.test.ts its name joins the `ValidName` union, `PROPERTIES`, and the end of `VALID` and `REBUILDS`, any new words `FIXTURE_WORDS`; its `PROPERTIES` entry pins Place, exactly one free letter from a cell c ≤ L with c ≠ the stored `targetCell`, cell c holding exactly 2 cards, and ≥ 2 legal cells. In src/architecture-ad2-ad12-ad17.test.ts the filename joins the sorted valid list; the "twelve" wording becomes "thirteen" in both files.

- Interface: the controller's WordCell press path gains the Place target tap as the Place case of intent.ts `tapAction` (`setTarget { cell }` when `canSetTarget`, view.ts:205, false on the current target; the empty-cell long-press reaches it as a tap); ring, fade and target rendering already exist and stay on `isLegalTarget` plus `place.target` (WordCellRow.svelte:35,47; P4); new fixtures/session-place-free-letter-two-cards.json.
- Tests: R-39 (UI) Place WordCells inert except target and viewing, a WordCell drag and a not-legal tap dispatch nothing (P5); R-40 legal ≤ L ringed, not-legal no-op (P5 supp.); R-41 used cell a legal target (P5 supp.); R-42 (UI) pre-selected after Validate, retarget, reload (P5); R-51 retarget keeps the order (P5 supp.); R-52 new top is the strip's last card (P5 supp.); R-60 Confirm commits atomically (P5 supp.); R-61 next card exposed after commit, badge 2 before Confirm and none at 1 card after (P5 supp.); R-62 every column empty → Game over (P5 supp.); R-80 score change equals the preview (P5 supp.); R-73 (UI) commit saved before the next action, reload in Place (P5); R-65 (UI) viewing in Place, long-press peek on a non-empty cell (P5 part).
- Owns: the Place target and Confirm flow, session-place-free-letter-two-cards.json and S15.
- Consumers: the empty-WordCell long-press already classifies as a tap on release (classify.ts:48, unchanged); new is that in Place that tap dispatches `setTarget` when `canSetTarget`: the long-press peek (non-empty cells) and the winning-guard long-press uninstall (entry 13).

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green, and Playwright on android shows:

- ring/fade/pre-selection (R-40, R-42) on session-place, session-place-free-letter-redo-tail and session-won + one Undo; on session-place cells 4–10 faded, a not-legal tap and a current-target tap (cell 3) dispatching nothing; from session-composing with the dictionary loaded, Validate lands in Place with the highest legal cell pre-selected and the others ringed or faded (R-42);
- on session-won + one Undo (legal 3–6, target 6, cells 3–5 empty, SPEC CAP-7), after a strip tap-swap to a non-default order: a retarget by tap leaves `placementOrder` unchanged in `current().session` and storage and the strip DOM order unchanged (R-51), the new target pre-selected (R-42), Redo disabled after the first retarget (R-71); an empty-cell long-press released in place, and one pressed on cell 3 (not the current target) released over cell 4 after moving past 8 px after 400 ms giving `setTarget { cell: 3 }`; with a strip tile selected, a tap on not-legal cell 7–10 keeps it, on current target 6 clears it, on legal cell 4 dispatches `setTarget` and clears it, a drag from cell 4 clears it, each no-dispatch case leaving the stored Session byte-identical (R-39);
- Confirm there: the target cell's cards bottom → top equal the reordered strip; `primary-action` reads `New game`, every column is empty, no end sheet or dialog (R-62);
- on session-place-free-letter-redo-tail, Confirm into the free letter's own cell 3: one `confirm` dispatch; columns, cells and cursor per R-60 in `current().session` and stored `wordcell:session`; the redo tail dropped, Redo disabled (R-60); cell 3's top is the strip's last card and is tap-addable as a free letter in the next move's Composing (R-52);
- on session-place-free-letter-two-cards, R-41 (retarget to the used cell c → target set) and R-61 (Confirm into another cell: c shows its next card only after Confirm, the badge 2 before and none after) as two tests; the `displayScore` change after Confirm equals the Place meta's previewed delta, which includes c, also after a retarget (R-80); a long-press peek on c with a strip tile selected opens with no dispatch, the stored Session byte-identical, the target unchanged and the tile still selected (F13, R-65);
- a reload in Place on session-place-free-letter-two-cards after a strip reorder, a retarget to c and a strip tile selected: the same strip, tags and target, c showing the used-hatch mirror and the target state together, no tile selected (R-73, R-42);
- the stored Session equals `current().session` after each `setTarget`, `setPlacementOrder` and `confirm`, before the next action (R-73);
- on session-composing with a tile selected, a long-press on an empty WordCell: no dispatch, stored Session byte-identical, tile still selected (no existing e2e covers it).

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-tray-and-place/epic-tray-and-place.md
- spec — _bmad-output/specs/spec-epic-5-tray/SPEC.md, CAP-7, Constraints, Decisions F1, F13
- spec — _bmad-output/specs/spec-epic-5-tray/rule-coverage.md, the R-39 Place, R-40–R-42, R-51, R-52, R-60–R-62, R-65, R-73, R-80 rows
- spec — _bmad-output/specs/spec-epic-5-tray/build-notes.md, CAP-7, Sweep inventory S15
- spec — _bmad-output/specs/spec-epic-3-app-shell/build-notes.md, CAP-1 Engine carry-ins (Fixture regeneration: the epic 3 regeneration rule)
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/EXPERIENCE.md, Place, Flows 1–3

## Notes

- Fixture construction (default): script moves so a word commits to a low cell c (or extend session-place-compact's `REBUILDS` commands, whose free-letter cell 4 holds 3 cards), a later committed move uses c's top as a free letter leaving c with exactly 2 cards, then a word with L > c using c's new top as a free letter is validated into Place, so the stored target (highest legal, R-42) is not c; search seeds as earlier fixtures did. If no single Session meets every condition, stop and report under AGENTS.md rule 7 (SPEC CAP-7 requires R-41 and R-61 on the same fixture; do not split it or relax a condition).
