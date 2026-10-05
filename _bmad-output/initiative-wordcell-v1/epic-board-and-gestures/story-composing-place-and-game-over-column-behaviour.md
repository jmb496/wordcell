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
- Drag-as-tap: controller.ts pointerup today performs only on outcome 'tap'; on a drag outcome it dispatches only when the phase is composing and the press hit is a live card of the destination column (via tapAction's destination branch or a dedicated intent function), reading kIfTapped for the press card from the current GameView wherever released (null or absent → nothing); every other drag outcome keeps today's behaviour (an Idle space drag with a selection must not become a tapAction drop). During it no element gets wc-drag-layer, wc-drag-ghost or wc-drag-target and nothing is selected; refreshHover also skips while a press is past the threshold (whatever press.drag), and every drag-as-tap pointerup calls refreshHover, dispatched or not. pointercancel, lostpointercapture and cancel() end it with no dispatch (CAP-4).
- The existing canPickUp/canDropOn gating in src/ui/gestures/intent.ts (tapAction; hoverAction returns null outside Idle) already makes columns inert outside Idle; this ticket adds a Composing branch for the destination column only, keyed on kIfTapped, to tapAction and to hoverAction's Idle-only early return, keeps the existing paths, and the inert cases are the regression proof.
- k preview (desktop): it outlines exactly the cards of the would-be D (from the hovered card, or for the top of D the card below it, down to the remainder's bottom card), never S ghost mirrors. Default mechanism: reuse the tail-outline hover (wc-hover-tail / --wc-hover-from on [data-column], controller HOVER_CLASSES) via a hoverAction kind for k, from the GameView only (AD-3): remainder length column.kIfTapped.size, start index size − value: --wc-len (Column.svelte, column.cards.length) counts S ghosts in a self-drop, so the preview uses its own remainder-length variable. Destination cards keep the default cursor (no wc-grab in Composing); the existing refreshHover reaction repaints the preview from the new kIfTapped after a click.

Interface: Controller phase gating for column presses from GameView flags (kIfTapped, canPickUp, canDropOn); Column.svelte desktop k-preview class.
(The k-preview class is the controller-toggled hover class plus the remainder-length variable, styled in Column.svelte.)
Tests: R-31 tap sets k via kIfTapped (P4 supp.); R-39 (UI) other columns inert in Composing; R-39 (UI) a drag on a destination card is a tap; R-39 (UI) Undo to change source or destination; R-39 (UI) columns inert in Place; R-75 no select or drop while status ≠ playing (P4 supp.); R-73 (UI) a k change from the column saved before the next action; AD-9/AD-17 held destination-card press plus hidePage → no tapDestinationCard.
Owns: The column side of Composing (F17) and phase inertness of columns.
Unknown: None.

## Acceptance Criteria

Verify:

- npm run test:all and npm run test:screens are green; no baseline change is expected (hover and gestures are not in the screenshot specs), so a diff is a regression to fix, not a rebaseline; this supersedes the tickets.toml verify wording because the ticket changes no static render.
- Every inert case below except the hide case (all fixtures) asserts the current().session reference unchanged and the stored Session unchanged (SPEC CAP-8; in in-test-drop cases both captured after the drop settles, before each inert gesture), nothing selected and no wc-drag-layer, wc-drag-ghost or wc-drag-target class (R-39 "no drag, no selection", R-75). Each inert drag: touchHold, moveTo past the threshold, assert no drag residue (dragResidue: no wc-drag-* class, no transform; moved from e2e/drag.spec.ts and e2e/drag-interruptions.spec.ts into an e2e/helpers module, tested in e2e/helpers.spec.ts, and imported) while held, then end() and assert the Session.
- AD-12 Vitest in src/ui/gestures/intent.test.ts for the new branches: a Composing destination card whose kIfTapped is a number → the dispatch action; null or absent → none; the hover k kind gives the start index and the remainder bound (self-drop ghosts excluded). AD-12 Vitest in src/ui/gestures/controller.test.ts: a destination drag-as-tap dispatches once; an Idle space drag with a selection still does nothing.
- android, session-composing (stored at k = 1: destinationColumn 6, destinationCount 1): tap the card above the top of D (k → 2), tap the new top of D (k → 1), tap the bottom card (top of D at k = 1, R-31 no-op): no dispatch, Session reference unchanged, no write. After each tap and after each drag below, before the next action, the stored wordcell:session equals current().session with the literal destinationCount (R-73).
- android, destination-card drag: raise k to ≥ 2 with taps, armStorageSpy, then drag the top of D past the threshold; mid-drag the press card has no transform or wc-drag-layer class and its box is unchanged; at pointerup k is k − 1 for the press card with exactly one wordcell:session write during the gesture (R-73); from k = 1, dragging the card above the top of D and releasing over another column gives k = 2 (its kIfTapped), one write. At k = 1 (kIfTapped null for the top of D) the same drag and release leaves the Session reference unchanged and no write.
- android, session-composing inert: taps and drags on other columns' cards and S ghosts, on the destination column's empty space and foot pad, and on another column's foot pad.
- android, partial self-drop reached in-test from session-idle-fresh (tap-select a partial tail leaving a remainder of at least 2 cards, then tap its own column's foot, R-14; no new fixture): S-ghost taps and drags are inert; a tap on a remainder card above the top of D (k = 1 right after the drop, so the top of D is the R-31 no-op) sets k to that card's kIfTapped.
- android, empty destination: from session-idle-empty-column, drop a tail onto empty column 1 (k = 0, kIfTapped empty, R-23); taps and drags on its placeholder and foot pad are inert.
- android, every column tap and drag inert: session-place live cards, S and D ghosts, foot pads; session-gave-up live cards, empty space, foot pads; session-won placeholders and foot pads.
- android, Undo from Composing returns the tail; dragging a tail from a different source column onto a different destination column then gives a new draft with that sourceColumn and destinationColumn (R-39 "to change source or destination").
- android, hide (build-notes AD-17 hide case): on session-composing, touchHold a destination-column card whose kIfTapped is a number, hidePage, end() → no tapDestinationCard: the current and stored Session equal the pre-press Session with activeMs zeroed (game()/storedGame() as in e2e/drag-interruptions.spec.ts), destinationCount unchanged, and exactly one wordcell:session write (armStorageSpy, the AD-9 flush); run once held still and once after moveTo past the drag threshold. This is the representative cancel test; CAP-4 owns the other cancel paths.
- desktop, session-composing: at k = 1, hovering a remainder card above D outlines from it down to the remainder's bottom card; at k ≥ 2, a D card below the top of D outlines from it down, and the top of D previews k − 1; none at k = 1, none on other-column cards and S ghosts, nor on the destination column's empty space and foot pad; computed cursor not grab on a destination card, another-column card and an S ghost; at k = 2, clicking the top of D without moving the mouse sets k = 1 and the preview on that card disappears (refreshHover repaint); on the partial self-drop the preview's --wc-hover-from and remainder-length values end at the remainder's bottom card index and no data-mirror-of element is in that range; mid-drag of a drag-as-tap press, crossing another destination card, no wc-hover-tail is present. On session-place, session-won and session-gave-up no hover outline and no grab cursor (computed cursor) on any column card.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-board-and-gestures/epic-board-and-gestures.md
- spec — _bmad-output/specs/spec-epic-4-board/build-notes.md, CAP-8
- spec — _bmad-output/specs/spec-epic-4-board/SPEC.md CAP-8 (CAP-4 for cancel paths)
- rule coverage — _bmad-output/specs/spec-epic-4-board/rule-coverage.md rows R-31, R-39, R-73, R-75 and the AD-9 / AD-17 hide row
- ux — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/EXPERIENCE.md Phase matrix, Mouse and hover (desktop); DESIGN.md Card states

## Notes

- Open question: None.
