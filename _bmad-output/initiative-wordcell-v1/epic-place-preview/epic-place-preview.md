---
type: epic
title: "Place preview of WordCell tops"
parent: initiative-wordcell-v1
covers: []
after: [epic-end-of-game-words]
assignee: ""
risk: medium
---

# Place preview of WordCell tops

## Description

In Place the WordCells still show the board before the move: a used cell shows its used card dimmed, and the target shows its current top. The player cannot see which letters the next word can use. This epic makes the WordCell row in Place show each cell the commit changes as it will be after Confirm (owner decision Q-49, 2026-10-25): the target shows the future top card (the strip's last card) and its count after the commit, and follows every reorder and retarget; a used cell that is not the target shows the card beneath its used one, or its empty outline; the shown top carries a subtle `★` preview mark. Composing keeps the dimmed used look. There is no epic spec: the requirement source is Q-49 as applied to the spec, the UX docs and the spine on branch `place-preview` (2026-10-25).

## Outcome

While ordering and placing a word, the player sees the free letters the next turn will offer; the signal is Jared's Android read of the Place screen plus the Q-49 tests passing.

## Requirements

Rules are `docs/game-flow-spec.md`; each line cites its source.

- E1 (AD-3, Q-49): `view()` gives each cell a `preview` exactly when phase = place and the cell is used or the target: its top card (`null` = empty) and card count after the R-60 commit.
- E2 (R-50 (UI), R-41, Q-49): the target shows the last card of the placement order and its count after the commit, also when it is a used cell; it follows every reorder and retarget; its current top is not shown.
- E3 (R-33 (UI), R-50 (UI), Q-49): in Place a used cell that is not the target shows the card beneath its used one, or its empty outline, and never its used card; Composing keeps the *used this word* look.
- E4 (DESIGN.md WordCell *place preview*, EXPERIENCE.md screen-reader names): the shown top of a changed cell carries the orange `★` pill at the card rect's bottom-left (none on an empty preview); a not-legal changed cell dims at 35 % like any not-legal cell; changed cells are named `WordCell {c}, top {L}, {n card(s)}, after this word` or `WordCell {c}, empty, after this word`.
- E5 (R-65, R-70, R-71, R-73, Q-49): the WordCell view of a changed cell lists its current cards; Undo from Place to Composing restores the used look; Redo and a relaunch into Place show the preview.
- E6 (DESIGN.md WordCell, AD-14): from Confirm (or a Redo that commits) until the last card lands, the target keeps the previewed top and never shows its previous top or the used card; the `★` goes at commit.
- E7 (How to play, epic 8 D5): the How to play Place scene's Place frames show the same preview; its tray frame keeps the used look.
- E8 (close-out): the spec, UX docs and spine match the build; `npm run test:all` and `npm run test:screens` are green.

## Done when

1. On `android`, a Place fixture with a free letter: the target shows the strip's last card with the `★` and the count after the commit, a reorder and a retarget update it, and a used non-target cell shows the card beneath its used one (or empty); no cell shows a used card (E1–E4).
2. Undo to Composing shows the dimmed used look again; Redo and a reload into Place show the preview; the long-press view of a changed cell lists its current cards (E5).
3. During Confirm's fly-to-cell the target never shows its previous top (E6), and the How to play Place scene matches the game (E7).
4. `npm run test:all` and `npm run test:screens` are green, no Session or score-history shape or version changed, and the docs match the build (E8).
5. Jared has read the Place screen on his Android install and his read is recorded in Notes.

## Boundaries

The engine view (`CellView.preview`), the WordCell row, `Card.svelte` (a `preview` mirror kind and the `★` pill), `text.ts` names, the fly-to-cell hold in `flip.ts`, the How to play Place scene, tests, fixtures and baselines. Not the rules, scoring, the Session, the placement strip, the tray in Composing, the WordCell view's contents, or any message-catalogue string beyond the two screen-reader names.

## References

- rules — docs/game-flow-spec.md, R-33, R-41, R-50, R-60, R-61, R-65, §7.4, §9 Q-49
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md, Components → WordCell (*place preview*); EXPERIENCE.md, Place state row, Place, Message catalogue (screen-reader names)
- architecture — _bmad-output/planning-artifacts/architecture/architecture-wordcell-2026-09-27/ARCHITECTURE-SPINE.md, AD-3 (per-cell `preview`), AD-14 (used mirror in Composing only, `preview` mirror), AD-2 (no new export)
- code — src/engine/view.ts, src/ui/WordCellRow.svelte, src/ui/Card.svelte, src/ui/text.ts, src/ui/flip.ts, src/ui/scenes/place.ts, src/ui/scenes/Scene.svelte
- constraint — AGENTS.md, Architecture rules 1–7, Policy, Conventions

## Notes

- Decision (owner, 2026-10-25): Place only, not Composing; a subtle preview mark on the shown top; the target shows the strip's last card and its count after the commit; a used target shows its new top; the WordCell view keeps the current cards (Q-49).
- Decision (2026-10-25): branch `place-preview` is cut from `main` at `d5015e5`; the doc edits for Q-49 (spec v0.12, EXPERIENCE.md, DESIGN.md, spine AD-3 and AD-14) are committed on `place-preview` before entry 1 starts (`bmad-build-auto` needs a clean tree).
- Decision (2026-10-25): no epic spec; this file's Requirements are the source.
- Decision (2026-10-25): tracer bullet is entries 1 → 2 (engine `preview` to the visible WordCell row); entries 2, 3 and 4 run in sequence (4 after 3) because they share `Card.svelte`, `WordCellRow.svelte` or the `★` pill and the screenshot baselines.
- Decision (owner, 2026-10-28, entry 2 ticket review): where a two-digit count badge meets the `★` pill on a 360 px phone, both keep their DESIGN.md corners and the badge draws above the `★`; judged at entry 5's device read. Close-out: DESIGN.md Components → WordCell (place preview) to state the stacking.
- Assumption (technical default, 2026-10-25): the mark is the orange `★` on a 16 px pill at the card rect's bottom-left, reusing the strip's next-free-letter star; the target's future top is a `preview` mirror of its strip tile, a used cell's card beneath is its own live element; Jared confirms the look at entry 5.
- Assumption (2026-10-25): Q-49 supersedes epic 8 decision D5 ("WordCell 6 is drawn used from frame 0 until Confirm") for the Place scene's Place frames only; its tray frame keeps the used look.
- Assumption (2026-10-25): the two screen-reader names are the only new strings; they follow the existing `nameCell` / `nameCellEmpty` pattern with `, after this word`.
- Waits on epic 10 because: it builds on the merged baseline (Place screen, fly-to-cell hold F28, scenes, baselines).
