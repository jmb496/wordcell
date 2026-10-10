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

Completes the move (CAP-7). In Place: legal cells ringed, not-legal faded, the stored target pre-selected; a tap on a cell with `canSetTarget` dispatches `setTarget` keeping `placementOrder` (R-51) and clears a tile selection (F1); a long-press ≥ 400 ms on an empty WordCell acts as a tap on release on the cell where it started, wherever released (the timer wins once fired, the 8 px drag before it; Composing: no dispatch, selection kept); a long-press ended by `pointercancel`/`lostpointercapture` dispatches nothing and keeps a tile selection (F1; only a `pointerup` release taps; UI Vitest); a used cell stays a legal target (R-41, Q-02); a not-legal tap dispatches nothing and keeps a tile selection; a current-target tap dispatches nothing and clears it (F13); a drag (≥ 8 px before 400 ms) ending in `pointerup` from a legal non-current cell dispatches nothing and clears it (SPEC CAP-4; `pointercancel` keeps it, F1); WordCells otherwise respond only to viewing (R-39); Confirm commits (R-60, R-61, R-52, R-62 into Game over with no end sheet). UI, fixture and test changes only, no engine or shell source change (SPEC Constraints); Confirm is already wired in ActionBar.svelte (re-proved, not rebuilt); keyboard target keys are epic 6. Existing tests flip: src/ui/gestures/intent.test.ts:93 (Place WordCells inert → a `canSetTarget` cell gives `setTarget`) and controller.test.ts:3469 (a legal non-current cell "dispatching nothing" → one `setTarget`); controller.test.ts:3481 (a drag from a legal non-current cell dispatches nothing) stays; the src/ui/gestures/tile.ts:11-12 note "until ticket 9 dispatches there" is resolved.

Scripts the valid fixture `fixtures/session-place-free-letter-two-cards.json` under the epic 3 regeneration rule (S15): the free letter's cell c's badge reads 2 on load in Place; after one Confirm into another cell, c holds 1 card and shows no badge. In src/engine/serialize.test.ts its name joins the `ValidName` union, `PROPERTIES`, and the end of `VALID` and `REBUILDS` with its `import … with { type: 'json' }`, new words in its rebuild's own `play` list (`FIXTURE_WORDS` only via `fromSeed1`); its `PROPERTIES` entry pins Place, exactly one free letter from a cell c ≤ L with c ≠ the stored `targetCell` and cell c holding exactly 2 cards. In src/architecture-ad2-ad12-ad17.test.ts the filename joins the sorted valid list; the "twelve" wording becomes "thirteen" in both files.

- Interface: the controller's WordCell press path gains the Place target tap as the Place case of intent.ts `tapAction` (`setTarget { cell }` when `canSetTarget`, view.ts:205, false on the current target; the empty-cell long-press reaches it as a tap); ring, fade and target rendering already exist and stay on `isLegalTarget` plus `place.target` (WordCellRow.svelte:35,47; P4); new fixtures/session-place-free-letter-two-cards.json.
- Tests: R-39 (UI) Place WordCells inert except target and viewing, a WordCell drag and a not-legal tap dispatch nothing (P5); R-40 legal ≤ L ringed, not-legal no-op (P5 supp.); R-41 used cell a legal target (P5 supp.); R-42 (UI) pre-selected after Validate, retarget, reload (P5); R-51 retarget keeps the order (P5 supp.); R-52 new top is the strip's last card (P5 supp.); R-60 Confirm commits atomically (P5 supp.); R-61 next card exposed after commit, badge 2 before Confirm and none at 1 card after (P5 supp.); R-62 every column empty → Game over (P5 supp.); R-80 score change equals the preview (P5 supp.); R-73 (UI) commit saved before the next action, reload in Place (P5); R-65 (UI) viewing in Place, long-press peek on a non-empty cell (P5 part).
- Owns: the Place target and Confirm flow, session-place-free-letter-two-cards.json and S15.
- Consumers: the empty-WordCell long-press already classifies as a tap on release (classify.ts:48, unchanged); re-check, now that it dispatches in Place, the long-press peek (non-empty cells, still no dispatch) and entry 13's winning-guard long-press uninstall.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green, and Playwright on android shows:

- ring/fade/pre-selection (R-40, R-42) on session-place, session-place-free-letter-redo-tail and session-won + one Undo; on session-place cells 4–10 faded, a not-legal tap and a current-target tap (cell 3) dispatching nothing; from session-composing with the dictionary loaded, Validate pre-selects the stored `targetCell` 3, cells 4–10 faded (R-42; several legal cells: session-won + one Undo);
- on session-won + one Undo (legal 3–6, target 6, cells 3–5 empty, SPEC CAP-7), each case from a fresh load: Redo enabled, a retarget by tap, Redo disabled (R-71); a strip tap-swap to a non-default order, then a retarget by tap leaves `placementOrder` in `current().session`, storage and the strip DOM unchanged (R-51), the new target pre-selected (R-42); a long-press on cell 5 released in place gives `setTarget { cell: 5 }`, one on cell 3 released over cell 4 after moving past 8 px after 400 ms `setTarget { cell: 3 }`; with a strip tile selected before each, in order: a tap on not-legal cell 7 keeps it, a drag from cell 4 ending in `pointerup` clears it, a tap on current target 6 clears it, each no dispatch, stored Session byte-identical (R-39), then a tap on cell 4 dispatches `setTarget { cell: 4 }` and clears it;
- Confirm after the R-51 case: the target cell's cards bottom → top equal the reordered strip; `primary-action` reads `New game`, every column is empty, no end sheet or dialog (R-62);
- on session-place-free-letter-redo-tail, no strip reorder, Confirm into the free letter's own cell 3: cursor `{ index: 2, phase: 'idle' }`, move 1 `reached: 'committed'` and the redo tail dropped in `current().session` and storage, exactly one `wordcell:session` write (`armStorageSpy`/`storageWrites`), columns and cells per R-60 in the DOM (`column-<n>`/`wordcell-<n>` card ids), Redo disabled (R-60); cell 3 bottom → top [42, 0, 9, 32, 28] in the DOM, and after FIXTURE_MAN's `drop(2, 1, 6)` a tap on cell 3 gives `addFreeLetter { cell: 3 }` (R-52);
- on session-place-free-letter-two-cards, R-41 (retarget to the used cell c, Confirm into c) and R-61 (Confirm into the stored target: c shows its next card only after Confirm, badge 2 on load, none after) as two tests, each also R-80: the top-bar score change after Confirm equals the Place meta's delta (which includes c) shown just before, both read from the DOM; a long-press peek on c with a strip tile selected opens with no dispatch, the stored Session byte-identical, the target unchanged and the tile still selected (F13, R-65);
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
