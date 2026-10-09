---
id: 7
type: story
title: "Tile drag in the tray and the strip"
parent: epic-tray-and-place
covers: [CAP-5]
after: [5, 6]
risk: high
---

# Tile drag in the tray and the strip

## Description

Adds the tile drag to the controller (CAP-5) on entries 5 and 6: a tile press crossing 8 px clears the tile selection (F18) and drags the tile by `transform` on its face with no drag state in Svelte until release (the F18 threshold clear is the one store write); the drag transform carries the selected tile's lift (as epic 4's `lift`) so the face does not jump at the threshold, and a fly-back lands it unlifted; the tray band, clipped to the visible band (F4), is the single drop target accepted at ≥ 25 % of the dragged face's area; while accepted the other movable tiles part to the `insertionIndex` gap over `duration('parting')` (snap under reduced motion) by face transforms only, nothing drawn at the gap, and under 25 % every tile rests with the origin slot open; release over an accepted gap dispatches one `arrange` / `setPlacementOrder` iff the order changes by card, otherwise the tile flies back by the epic 4 `flyBack` with no edit (never a removal; the landing glide on an edit is entry 16's (CAP-8, F17)); a D-block mirror drag moves nothing and keeps a tile selection; `pointercancel`/`lostpointercapture` fly back with no selection restore (F5, F18), a back mid-drag leaves the app (bare-Board rule), and hide, or the `cancel()` that `act()` runs first, settles the drag at once (every face snaps to rest, no reorder dispatched, nothing selected, F18); `act()`'s own handler then runs as usual.

- Drag layer: while a tile drag is active the controller puts a new `classes.ts` class on the `.tiles` element that lifts its overflow clip, and the dragged face takes `wc-drag-layer` with a TileRows-scoped rule matching Column's (z-index and shadow; above the bars and hover peek, below the scrim); every drag end removes both; the origin slot shows nothing (no ghost).
- Drop target: `DropTargetParams` widens with a `kind: 'tray'` variant registered on `[data-band="tray"]` (AD-12 `use:dropTarget`); one drop-target.ts accessor reads it; its rect goes through visible-band.ts `clip` and is accepted at ≥ `MIN_RATIO`. The internal `Drag` gets a tile variant whose release flies back unless `reorder` changed the order; `flyBack`'s parameter narrows to the fields it reads if needed (no new export).
- Geometry (entry 6 owns it; nothing re-derived): at drag start measure `origin` once (per `slotRects`' JSDoc) and build `slots = slotRects(trayLayout(tileCount, w, innerWidth), origin, tileCount)` and `gapRects(slots, perRow, tileCount, first, count)` over the movable run (Composing: `first` = k with the block on the left, else 0, `count` = |M|; Place: `first` 0, `count` n); each move calls `insertionIndex(dragged, gapRects)` and `partingOffsets(slots, tileCount, first, count, gap, from)` (`from` = the dragged tile's run index); release calls `reorder(order, from, gap)` and compares by card; D-block mirrors never move in a reorder.
- Parting: each change of gap or of acceptance animates every movable face from its current transform to its new offset (rest included) over `duration('parting')`, the end transform written inline; under reduced motion every step snaps; on a no-edit release or a platform cancel the parted faces return to rest over `duration('parting')` alongside the dragged face's `flyBack`; on an edit release, hide and `act()` every parting transform and animation clears at once; the controller's `pointerdown` and `cancel()` finish any running parting animation (as they finish the fly-back). The parting and return animations are gate-counted until settled (AD-11, F6, F24).
- Release: it acts on the last pointermove's acceptance and gap (the last parting shown), never recomputed at the pointerup point (as epic 4's column drop on the last-shown highlight); it finishes the parting, clears the drag and parting transforms in one `clearDrag` call (so entry 16 can call `flip.capture()` before it), then `gate.leave()`, then the dispatch; until entry 16 an edit renders the new order at rest at once with no glide.

Interface: Controller tile-drag path in gestures/tile.ts or the controller (tray-band drop target, parting WAAPI, release dispatch); no new exports beyond entries 5 and 6 except drop-target.ts's tray accessor (AD-12) and the drag-layer `classes.ts` class.
Tests: R-32 (UI) block drag moves nothing, gaps never inside or beyond the block (P5 part); R-32 drag past the block lands at the M end (P5 supp.); R-33 a dragged-out free letter is not removed (P5); R-34 drag-reorder (P5 supp.); R-51 strip drag reorder (P5 supp.); R-71 a no-change drag is not an edit, Redo stays enabled (P5 supp.); R-73 (UI) a reorder saved before the next action (P5 part); AD-12 tray band single target ≥ 25 %, clipped (P5); AD-12 F5 cancel paths: hidePage, back, pointercancel, act() mid-drag (S + P5); AD-12 F18 drag clears the tile selection (S); AD-10 parting 0.5 × base, snap under reduced motion (S).
Owns: The tile drag, the tray band as a drop target, the parting animation and the F5/F18 tile-drag ends.
Consumers: The visible-band clip (entry 4's visible-band.ts) now also feeds the tray band: list epic 4 pickTarget/drop-target as its other consumers; gate enter/leave from the new drag: list layout re-layout, the banner latch and w recompute.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green with:

- UI Vitest: AD-10 at controller level, the parted faces' `animate` runs with `duration('parting')`, and under reduced motion the transforms are written at once with no running animation; AD-12 a tile drag cancelled by `pointercancel`, and one by `lostpointercapture`, with a tile selected ends with nothing selected (F18); AD-12 a pointerup with no new move acts on the last move's acceptance and gap; AD-12 an App button pressed mid-drag settles it at once and dispatches only that button's command; AD-11 the gate is idle at the release dispatch.
- Playwright on android: drag-reorder in the tray (session-composing) and the strip (session-place), after each the stored `wordcell:session` equals `current().session` before the next action (R-73 (UI)); a release under 25 % leaving the stored Session byte-identical; on session-place-free-letter-redo-tail + one Undo (Composing), the free-letter tile released outside `[data-band="tray"]` not removed, its cell still used (R-33); `elementFromPoint` at the dragged face's centre held outside the tray band returns that face.
- On session-composing: the block-mirror drag (with a tile selected first) dispatching nothing, keeping the selection and writing no transform to any mirror; after `+` (k = 2) a tile held over the middle of the block parts to the M end and its release lands it there (R-32 (UI)); tile 42 dragged right past the block (within one row, F25) leaving the stored arrangement [0, 42]; hidePage mid-drag dispatching nothing; page.goBack() mid-drag leaving the app (asserted as e2e/nav.spec.ts's `expectLeaves` pattern) with the Session equal to the pre-drag one apart from `activeMs`, read after a `page.goForward()` that restores the app (default), or through `page.context().storageState()` after the back if it does not (alternative, `unverified` on Playwright 1.63) (SPEC CAP-5).
- An App button (e.g. Undo) pressed during a held tile drag (as e2e/drag-interruptions.spec.ts) settles the drag at once, dispatches only that button's command, no reorder, nothing selected; `pointercancel` mid-drag flies back with the stored Session byte-identical and nothing selected.
- F4 clip, as the epic 4 F34 spec (e2e/drag.spec.ts): a premise-asserted setup with the tray band partly under a sticky bar; a face overlapping ≥ 25 % of the unclipped band but < 25 % of its visible part parts nothing and its release flies back with the stored Session byte-identical.
- A strip drag released over its own gap leaving Redo enabled on session-won + one Undo (R-71).
- Geometry (entry 6's deferred check): with nothing selected, each tray face (mirrors included) equals `slotRects(trayLayout(tileCount, w, innerWidth), origin, tileCount)[p]` within 0.5 px at rest (`w` and `innerWidth` read from the page, `origin` per the `slotRects` JSDoc) on session-composing and session-place-compact; mid-drag each non-dragged face equals the slot `partingOffsets(...)[p].slot` gives, read under reduced motion or once its `getAnimations()` are finished, on session-place-compact with a parting across a row break.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-tray-and-place/epic-tray-and-place.md
- spec — _bmad-output/specs/spec-epic-5-tray/build-notes.md, CAP-5
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/EXPERIENCE.md, Component Patterns (Movable tile), Motion

## Notes

- The build result flags the wrapped-block drop (F3's nearest gap may land mid-M) for the owner to judge by hand (F25).
- Until CAP-9's tray-growth ticket, a third compact row is clipped but its gaps stay targetable (accepted interim; no fixture reaches it).
