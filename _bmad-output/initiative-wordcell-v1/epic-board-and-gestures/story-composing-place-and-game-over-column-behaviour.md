---
id: 10
type: story
title: "Composing, Place and Game-over column behaviour"
parent: epic-board-and-gestures
covers: [CAP-8]
after: [9]
risk: medium
---

# Composing, Place and Game-over column behaviour

## Description

In Composing a tap on a destination-column card dispatches tapDestinationCard iff column.kIfTapped maps it to a number, and a drag started on one does not move it and dispatches the same once at pointerup for the press card (a cancelled press dispatches nothing); taps and drags on every other column, S ghosts and ghost mirrors included, and on non-card parts of any column do nothing; in Place and Game over every column tap and drag does nothing; desktop shows the 1 px outline of the D a click would set (top of D: k − 1; none at k = 1) and no hover outline or grab cursor on inert cards; plus the held destination-card press in Composing with hidePage giving no tapDestinationCard.

- Ghost mirrors (data-mirror-of; the S ghosts) are inert in every column, the destination column's S ghosts after a self-drop included: a press resolves a card only from data-card-id, never data-mirror-of (SPEC CAP-8). An empty destination column (k = 0, kIfTapped empty, R-31) has an inert placeholder and foot.
- Drag-as-tap: at pointerup, wherever released, the controller reads kIfTapped for the press card from the current GameView (null or absent → nothing). During it no element gets drag-layer, ghost or drop-target classes and hover is suspended as for any press.
- The existing canPickUp/canDropOn gating in src/ui/gestures/intent.ts (tapAction; hoverAction returns null outside Idle) already makes columns inert outside Idle; this ticket adds the destination branch keyed on kIfTapped, keeps the existing paths, and the inert cases are the regression proof.
- k preview (desktop): it outlines exactly the cards of the would-be D (from the hovered card, or for the top of D the card below it, down to the remainder's bottom card), never S ghost mirrors. Default mechanism: reuse the tail-outline hover (wc-hover-tail / --wc-hover-from on [data-column], controller HOVER_CLASSES) via a hoverAction kind for k, its start from kIfTapped and its length bounded to the remainder (a new variable if --wc-len counts S ghosts). Destination cards keep the default cursor (no wc-grab in Composing); the existing refreshHover reaction repaints the preview from the new kIfTapped after a click.

Interface: Controller phase gating for column presses from GameView flags (kIfTapped, canPickUp, canDropOn); Column.svelte desktop k-preview class.
Tests: R-31 tap sets k via kIfTapped (P4 supp.); R-39 (UI) other columns inert in Composing; R-39 (UI) a drag on a destination card is a tap; R-39 (UI) Undo to change source or destination; R-39 (UI) columns inert in Place; R-75 no select or drop while status ≠ playing (P4 supp.); R-73 (UI) a k change from the column saved before the next action; AD-9/AD-17 held destination-card press plus hidePage → no tapDestinationCard.
Owns: The column side of Composing (F17) and phase inertness of columns.
Unknown: None.

## Acceptance Criteria

Verify:

- npm run test:all and npm run test:screens are green; no baseline change is expected (hover and gestures are not in the screenshot specs), so a diff is a regression to fix, not a rebaseline.
- Every inert case below (all fixtures) asserts the current().session reference unchanged and the stored Session unchanged (SPEC CAP-8), nothing selected and no drag-layer, ghost or drop-target class (R-39 "no drag, no selection", R-75).
- android, session-composing (stored at k = 1: destinationColumn 6, destinationCount 1): tap the card above the top of D (k → 2, saved before the next action), tap the new top of D (k → 1, saved), tap it again (no dispatch).
- android, destination-card drag: raise k to ≥ 3 with taps, then drag the top of D past the threshold; mid-drag the press card has no transform or drag-layer class and its box is unchanged; at pointerup exactly one tapDestinationCard for the press card (k − 1, not k − 2), saved; a release over another column still sets k for the press card.
- android, session-composing inert: taps and drags on other columns' cards and S ghosts, on the destination column's empty space and foot pad, and on another column's foot pad.
- android, partial self-drop reached in-test from session-idle-fresh (tap-select a partial tail, then tap its own column's foot, R-14; no new fixture): S-ghost taps and drags are inert and a remainder-card tap sets k.
- android, every column tap and drag inert on session-place, session-gave-up and session-won.
- android, Undo from Composing returns the tail; dragging the same tail onto a different column then gives a new draft with that destinationColumn (R-39 "to change source or destination").
- android, hide (build-notes AD-17 hide case): on session-composing, touchHold a destination-column card whose kIfTapped is a number, hidePage, end() → no tapDestinationCard (current().session reference and stored Session unchanged); run once held still and once after moveTo past the drag threshold. This is the representative cancel test; CAP-4 owns the other cancel paths.
- desktop, session-composing: the preview on a lower D card, k − 1 on the top of D (at k ≥ 2), none at k = 1, none on other-column cards and S ghosts; on the partial self-drop no ghost is inside the preview. On session-place and session-won no hover outline and no grab cursor (computed cursor) on any column card.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-board-and-gestures/epic-board-and-gestures.md
- spec — _bmad-output/specs/spec-epic-4-board/build-notes.md, CAP-8
- spec — _bmad-output/specs/spec-epic-4-board/SPEC.md CAP-8 (CAP-4 for cancel paths)
- rule coverage — _bmad-output/specs/spec-epic-4-board/rule-coverage.md rows R-31, R-39, R-73, R-75 and the AD-9 / AD-17 hide row
- ux — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/EXPERIENCE.md Phase matrix, Mouse and hover (desktop); DESIGN.md Card states

## Notes

- Open question: None.
