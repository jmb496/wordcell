---
id: 8
type: story
title: "Drag, overlap targeting and drop into Composing"
parent: epic-board-and-gestures
covers: [CAP-7]
after: [7]
risk: high
---

# Drag, overlap targeting and drop into Composing

## Description

Adds the drag half of R-14 (SPEC.md CAP-7, build-notes CAP-7, AD-12):

- Targeting: src/ui/gestures/targeting.ts with the pure pickTarget(dragged, candidates, sourceId, hasLeftSource) → { raw, highlighted } (25 % minimum inclusive, largest ratio, horizontally nearest centre then lower column tie-break, source suppressed until hasLeftSource, hasLeftSource set from raw including null).
- Drop targets: a new dropTarget Svelte action, applied in Column.svelte to each whole column slot as { kind: 'column', id }; the controller reads every registered element's getBoundingClientRect() on each pointermove as the candidates.
- Drag: on threshold crossing from a card of a column whose canPickUp is true (the tail is the pressed card to the bottom, R-10); the crossing move is the first drag move: it writes the transform, calls pickTarget and may set hasLeftSource. Each move writes transform on the tail's faces and the target highlight by DOM only (F12), measuring the grabbed face's rect; release dispatches at most one drop on the last highlighted, else flies back.
- Classes: the drag adds its own target classes (distinct from entry 7's wc-drop / wc-drop-self; names chosen in the plan) on the bottom card, placeholder or lowest non-tail card (partial self-drop); a whole-column drag targeting its source after leaving it reveals the always-rendered hidden placeholder under the ghosts and outlines it by DOM class (build-notes CAP-7, DESIGN.md Card states). The old slots are ghosts by a class on the slot wrappers. Entry 7's hover classes are cleared at threshold crossing and recomputed (refreshHover()) after release or fly-back. Lifetime: highlight removed at release; ghost removed before a drop dispatches, at the end (or finish()) of a fly-back, and at once on a cancel() without fly-back; no wrapper keeps either class afterwards.
- Drag layer: a controller-added class raising the dragged faces' stacking (z-index, on the source column too if it forms a stacking context) above the sticky bars, the lift and the hover peek and below the scrim (DESIGN.md Layer order); no element moved or cloned (AD-14, F26, no mirror element mid-drag).
- Fly-back: WAAPI on the faces over motion.ts duration('flyBack'); reduced motion a fade, gate-counted (F13).
- End kinds: a real pointercancel / lostpointercapture and cancel({ byBack: true }) fly the tail back as a release over nothing (AD-12, F13); any other cancel() (act(), before-hide) returns the tail to its slot at once, clears transform, ghost and highlight classes, finish()es a running fly-back, gate idle before it returns, nothing dispatched (F13); a drop released while a tap-selection is open calls overlays.deselect() then dispatches (build-notes CAP-7).
- Scope: entry 9 owns the rest of F24/F28 selection replacement (class removal at threshold, release-over-nothing deselect, restore on pointercancel/byBack), the press-during-fly-back finish() + elementFromPoint re-resolve and its P4, Undo during drag/fly-back P4s and the hide/back drag cases; this ticket's tests start with nothing selected.

Interface: new src/ui/gestures/targeting.ts (pickTarget); the dropTarget action; controller drag and fly-back paths; Column.svelte ghost, drag-target and drag-layer classes.
Tests: AD-12 pickTarget raw/highlighted, 25 %, tie-break, hasLeftSource from raw incl. null, sub-25 % over the source only (S); AD-12 transform written directly, at most one command per gesture (S + P4 via current() reference changes); AD-10 fly-back duration from motion.ts, reduced motion fade (S); R-14 (UI) drag released over no column returns the tail; R-14 (UI) drag never leaving the source cancels (Q-34); R-14 (UI) leave and return drops on the source; Q-34 incl. the sub-25 % source-only drag; R-10, R-11, R-20 drag half, R-21, R-22, R-23 incl. top and bottom drops (P4 supp.); R-73 (UI) the drop saved before the next action.
Owns: targeting.ts, the fly-back animation and the drag layer; the SPEC Success-signal drag.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green (the existing e2e/board.screens.spec.ts baselines (Idle, Composing, Place, Game over) pass unchanged unless the plan names a deliberate static render change, regenerated in the container only then), and:

- UI Vitest (S): the AD-12 pickTarget cases; a single-move flick onto another column drops there; the faces' style.transform written per move with no store call or dispatch before release, at most one dispatch per gesture; AD-10 fly-back duration equals duration('flyBack'), and reduced motion clears the transform at once and fades the faces' opacity 0 → 1 over duration('flyBack') (120 ms), gate entered then left.
- Playwright android, touchHold for held cases with mid-drag assertions (touchDrag allowed for single-motion drops), session-idle-fresh unless named: the SPEC Success-signal drag (column 1's bottom card onto column 3, D mirror and S tile as worded there); the same drag held over column 1 alone shows no highlight at any step and on release leaves the stored Session byte-identical; current().session reference unchanged across held moves and changing exactly once per drop; a drop on another column landing in Composing with k = 1 (k = 0 on column 1 of session-idle-empty-column), side left and S in column order; R-73: the stored wordcell:session equals current().session right after release, before the next action; the dragged face centred over the target column's first card versus over its foot pad, both at ≥ 25 % overlap, giving deep-equal drafts (Q-26); column 5's top card dragged onto column 2 lands in Composing with drop.sourceCount 6 (R-11), every slot of column 5 ghosted mid-drag; fly-backs with the Session byte-identical: a release over the WordCell row (no highlight at release), a 20 px drag down from column 4's bottom card (no highlight at any step); column 4's bottom card moved until under 25 % of its face overlaps column 4's hit rect and none overlaps another column, released there: no highlight at any step, Session byte-identical; the third card from the bottom of column 1 held: no highlight on column 1 before it leaves, after leaving and returning the lowest non-tail card is highlighted, release gives Composing with sourceCount 3, D = that card, k = 1 (R-21); a whole-column self-drop giving k = 0; a face dragged over a sticky bar is first in document.elementsFromPoint there (or wins a computed z-index comparison); the fly-back guard (Notes).
- Desktop with page.mouse from live rects: the Success-signal drop and the WordCell-row release.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-board-and-gestures/epic-board-and-gestures.md
- spec — _bmad-output/specs/spec-epic-4-board/SPEC.md, CAP-7, Success signal
- spec — _bmad-output/specs/spec-epic-4-board/build-notes.md, CAP-7
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/EXPERIENCE.md, Drop targeting by overlap
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md, Card states (dragging, drop target, ghost), Layer order

## Notes

- Open question: Whether WAAPI on the faces composes with the per-move transform writes without a jump at release. Guard (P4 fly-back case): release over the WordCell row with touchHold end(), then one page.evaluate asserts each face's running animation's first keyframe transform equals the last inline transform written and the inline transform is cleared (same task as animate()); on the drop path the faces carry no inline transform once Composing renders.
