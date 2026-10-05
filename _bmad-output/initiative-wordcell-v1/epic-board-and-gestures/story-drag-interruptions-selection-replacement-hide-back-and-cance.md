---
id: 9
type: story
title: "Drag interruptions: selection replacement, hide, back and cancel-first"
parent: epic-board-and-gestures
covers: [CAP-4, CAP-7]
after: [8]
risk: high
---

# Drag interruptions: selection replacement, hide, back and cancel-first

## Description

Completes AD-12/AD-9/AD-13 for drags in progress.

Replacement: a drag that lifts a tail (a column-card press with canPickUp in any column, the selected source column's cards included) while a tail is selected replaces the selection. At threshold crossing the controller adds one class, `wc-selection-suppressed`, by DOM to the Board root (its attach root); CSS under it cancels the old selection's lift, outline and Here and every foot's selecting/target state (DOM only, F12; no Svelte-owned classes or styles); the new drag gets Q-34 source suppression. An inert drag (a column's non-card part: empty space, placeholder, foot pad; a non-pickable card; a WordCell) keeps the selection's visuals and entry (CAP-4). Every end path of a replacing drag removes the class: fly-back restores at settle, all others at `end()`:
- a drop: `overlays.deselect()` before the dispatch (build-notes CAP-7); release over nothing: fly-back, `overlays.deselect()` (entry popped);
- plain `cancel()` (before-hide, `act()`, detach): the tail snaps back with no fly-back and `overlays.deselect()` runs once (its `nav.pop()` queued; wc 0 after showPage);
- a same-id pointerdown mid-drag: snaps back (entry 8, no fly-back) and restores the old selection at once (no deselect, no nav call); the new press then resolves on the settled layout;
- a real pointercancel/lostpointercapture or `cancel({ byBack: true })` (lost-end recovery): fly-back and restore; selection and entry stay throughout (no nav call); the class goes at fly-back settle (onfinish, or `finish()` from a press or `cancel()`), as lift and fly-back share the face transform.

A plain tap-selection, or a press still below the threshold, survives hide with no nav call.

Press during a fly-back (F13; new, pointerdown does not yet finish a flight): gate enter at pointerdown, `finish()` the flight (gate `leave()` included) without calling `cancel()`, then resolve from `document.elementFromPoint` at the press point (ignoring `event.target`) and capture on the resolved element; resolving to nothing, it `leave()`s the gate at once. Existing from entry 8: `cancel()` finishes a running flight first and plain `cancel()` snaps back; at most an ordering S case is new.

Interface: Controller selection-replacement, restore and fly-back-finish paths; no new exports.
Tests: AD-12 a source-column drag replaces a tap-selection, one tail lifted (P4); AD-12 a press or Undo during fly-back acts on the settled layout, plain cancel() snaps back, before-back flies back (S + P4); AD-12 cancel() first in Undo during a held drag (P4, android and desktop); AD-9/AD-17 hidePage mid-drag and select-drag-hide (P4); AD-13 select-drag-back (P4); AD-13 F24/F28 replacing-drag end paths (S + P4 synthetic pointercancel); AD-12 inert foot-pad drag (P4).
Owns: The F24/F28 selection-replacement behaviour and the AD-17 gesture-cancel hide assertion (C-E4b).

## Acceptance Criteria

Verify: `npm run test:all` is green, and:
- S AD-13 F24: one case per end path of a replacing drag (release on a drop, release over nothing, plain `cancel()` (incl. detach), `cancel({ byBack: true })`, real pointercancel, lostpointercapture) asserting deselect/nav calls or restore with no nav call; S AD-12: the fly-back press order above; a same-id pointerdown mid-drag snaps back and restores.
- P4 android, hidePage mid-touchHold drag: `wordcell:session` written once, tail back, Session unchanged, time resumes only after showPage, a later moveTo then `end()` changes nothing; its title carries AD-9, AD-16 and AD-17 (AD-16 Board half: cancel via main.ts's before-hide hook); the plan records that title as the C-E4b proof (build-notes).
- P4 select-drag (select, touchHold a drag from another column), hidePage, showPage → nothing selected, wc 0, Session unchanged, tail back in its slot.
- P4 select-drag, back → the tail flies back (entry 8's `__flyBack` animate spy records a call on its faces after back), nothing selected, app open, `history.state.wc` 0, Session unchanged; it fails if main.ts's before-back registration is removed.
- P4 android select-drag, then dispatch `new PointerEvent('pointercancel', { pointerId, bubbles: true })` on the captured element (the one with `hasPointerCapture(pointerId)`; pointerId from a capturing document pointerdown listener) → the tail flies back; once its faces have no running animation, the old selection and its visuals restored, wc 1, a later `end()` changes nothing; a following back leaves nothing selected at wc 0 (recipe `unverified`; the plan confirms it).
- P4 one lifted tail: with a selection of at least 2 cards, a drag pressing a card below its top card: mid-drag the selected cards left in the column show no lift (no translateY transform), no foot shows the target wash, `wc-selection-suppressed` present, only the dragged tail's faces carry the drag layer; release over nothing → class absent, nothing selected, wc 0.
- P4 Undo during a held drag from `session-idle-empty-column` via `getByTestId('undo').dispatchEvent('click')` (android touchHold; desktop page.mouse): tail returned and `cursor.index` decreased; a later `end()` changes nothing.
- P4 Undo during a fly-back: from `session-idle-empty-column`, touchHold, `end()` over nothing, then one `page.evaluate` asserts a running animation on the faces and clicks Undo; afterwards the faces have no transform and no running animation, `cursor.index` decreased.
- P4 inert: with a tail selected, a 20 px drag from another column's foot pad released over it: the selection's visuals stay present mid-drag; Session and selection unchanged.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-board-and-gestures/epic-board-and-gestures.md
- spec — _bmad-output/specs/spec-epic-4-board/build-notes.md, CAP-4 (AD-17 hide case, Cancel-first P4), CAP-7
- spec — _bmad-output/specs/spec-epic-4-board/SPEC.md, CAP-4, CAP-7, F13, F24, F28
- coverage — _bmad-output/specs/spec-epic-4-board/rule-coverage.md, rows AD-9/AD-17, AD-12, AD-13, AD-16

## Notes

- Open question (epic 7 device check): whether Android delivers pointercancel before back on an edge swipe (restore path proven here synthetically), or before visibilitychange on an app switch mid-touch (restore path instead of hide's deselect).
