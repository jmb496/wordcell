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

Replacement: a drag that lifts a tail (a column-card press on a column with canPickUp, any column, the selected source column included: the selected card or a card above or below it) while a tail is selected replaces the selection. At threshold crossing the controller adds one class, `wc-selection-suppressed`, by DOM to the old selection's column root; Column/Card CSS uses it to cancel the lift, outline, Here and foot state (DOM only, F12; never touching Svelte-owned classes or styles); the new drag gets Q-34 source suppression. An inert drag (a column's non-card part: empty space, placeholder, foot pad; a non-pickable card) keeps the selection's visuals and entry (CAP-4). End paths of a replacing drag:
- a drop: `overlays.deselect()` before the dispatch (build-notes CAP-7); release over nothing: fly-back, `overlays.deselect()` (entry popped);
- plain `cancel()` (before-hide, `act()`, detach on halt): the tail snaps back with no fly-back, the class is removed and `overlays.deselect()` runs once (its `nav.pop()` queued; wc 0 after showPage);
- a real pointercancel/lostpointercapture, `cancel({ byBack: true })` or a same-id pointerdown mid-drag (lost-end recovery): fly-back and restore; selection and entry stay throughout (no nav call); the class is removed at fly-back settle (onfinish, or `finish()` from a press or `cancel()`; at once on reduced motion), not at `end()`, as lift and fly-back share the face transform.

A plain tap-selection, or a press still below the threshold, survives hide with no nav call.

Press during a fly-back (F13; new, pointerdown does not yet finish a flight): gate enter at pointerdown, `finish()` the flight (gate `leave()` included) without calling `cancel()`, then resolve from `document.elementFromPoint` at the press point (ignoring `event.target`) and capture on the resolved element. Existing from entry 8: `cancel()` finishes a running flight before ending (`act()`'s finish-before-handler) and plain `cancel()` snaps back with no fly-back; at most an ordering S case is new.

Interface: Controller selection-replacement, restore and fly-back-finish paths; no new exports.
Tests: AD-12 a drag from the source column of a tap-selected tail replaces it, one tail lifted (P4); AD-12 a press or Undo during fly-back acts on the settled layout, cancel() from act() or before-hide returns a drag with no fly-back, before-back flies it back (S + P4); AD-12 cancel() first in Undo during a held drag (P4, android and desktop); AD-9/AD-17 hidePage mid-drag and select-drag-hide cases (P4); AD-13 select, drag from another column, back → nothing selected, app open, wc 0 (P4); AD-13 F24/F28 hide during a drag that replaced a tap-selection deselects with one queued nav.pop(), a real pointercancel restores the old selection with its classes and no nav call (S + P4 synthetic); AD-12 inert foot-pad drag with a tail selected (P4).
Owns: The F24/F28 selection-replacement behaviour and the AD-17 gesture-cancel hide assertion (C-E4b).

## Acceptance Criteria

Verify: `npm run test:all` is green, and:
- S AD-13 F24: one case per end path of a replacing drag (release on a drop, release over nothing, plain `cancel()`, `cancel({ byBack: true })`, real pointercancel, lostpointercapture) asserting deselect/nav calls or restore with no nav call; S AD-12: the fly-back press order above; a same-id pointerdown mid-drag restores.
- P4 android, hidePage mid-touchHold drag: `wordcell:session` written once, tail back, Session unchanged, time resumes only after showPage, a later moveTo then `end()` changes nothing; its title carries AD-9, AD-16 and AD-17 (AD-16 Board half: cancel via main.ts's before-hide hook); the plan records that title as the C-E4b proof (build-notes).
- P4 select-drag (select, touchHold a drag from another column), hidePage, showPage → nothing selected, wc 0, Session unchanged, tail back in its slot.
- P4 select-drag, back → the tail flies back (a running animation on its faces right after back), nothing selected, app open, `history.state.wc` 0, Session unchanged; it fails if main.ts's before-back registration is removed.
- P4 android select-drag, then dispatch `new PointerEvent('pointercancel', { pointerId, bubbles: true })` on the captured element (pointerId recorded by a capturing pointerdown listener on document) → the tail flies back, the old selection and its visuals restored, wc 1, a later `end()` changes nothing; a following back leaves nothing selected at wc 0.
- P4 one lifted tail: mid-drag from the source column of a selection (pressing a card above the selected card), no face lifted by the selection, `wc-selection-suppressed` present, only the dragged tail's faces carry the drag layer; release over nothing → nothing selected, wc 0.
- P4 Undo during a held drag from `session-idle-empty-column` via `getByTestId('undo').dispatchEvent('click')` (android touchHold; desktop page.mouse): tail returned, then `cursor.index` decreased; a later `end()` changes nothing.
- P4 Undo during a fly-back: from `session-idle-empty-column`, touchHold, `end()` over nothing, then one `page.evaluate` asserts a running animation on the faces and clicks Undo; afterwards the faces have no transform and no running animation, `cursor.index` decreased.
- P4 inert: with a tail selected, a 20 px drag from another column's foot pad released over it: the selection's visuals stay present mid-drag; Session and selection unchanged.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-board-and-gestures/epic-board-and-gestures.md
- spec — _bmad-output/specs/spec-epic-4-board/build-notes.md, CAP-4 (AD-17 hide case, Cancel-first P4), CAP-7
- spec — _bmad-output/specs/spec-epic-4-board/SPEC.md, CAP-4, CAP-7, F13, F24, F28
- coverage — _bmad-output/specs/spec-epic-4-board/rule-coverage.md, rows AD-9/AD-17, AD-12, AD-13, AD-16

## Notes

- Open question: That Android delivers pointercancel before back on an edge swipe is unverified (epic 7 device check); the restore path is proven here with a synthetic pointercancel.
- Unverified (epic 7 device check): whether Android delivers pointercancel before visibilitychange on an app switch mid-touch, which would take the restore path instead of hide's deselect.
