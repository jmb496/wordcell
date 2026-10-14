---
id: 11
type: story
title: "Fly-to-cell on commit"
parent: epic-tray-and-place
covers: [CAP-8]
after: [16]
risk: medium
---

# Fly-to-cell on commit

## Description

Plays `flyToCell` for a Confirm and a committing Redo, winning included (F7; the CAP-10 guard is not this ticket's): 2 × base, 30 ms `stagger()` bottom card first (motion.ts), each committed card visible in flight (non-top cell cards are `visibility: hidden` today, WordCellRow.svelte:63) and hidden at its own landing if not the top. The target's previous cards keep their pre-commit visibility and the free letter's own-cell used mirror (R-61) stays drawn until the first card lands. Under reduced motion every card fades in at once over the reduced `duration('flyToCell')` (motion.ts) unstaggered; hide and hold release occur at its end. Undo mid-flight finishes it first. New game, Replay and restore never animate.

Mechanism:
- Playback (replaces the empty `flyToCell` plan): the flying set is the cards whose band changed to the WordCells (a band changer always flies: the 0.5 px skip does not apply), in final cell order (bottom of the committed run first); each face glides from its captured viewport rect to its settled rect, delay i × `stagger()` (i counts the flying set), fill backwards (`stagger` joins `FlipDeps`). Nothing else animates.
- In-flight state: flip.ts exports one new read-only reactive state (`svelte/reactivity` set, as flip.ts is no rune module; `unverified`, builder confirms): the committed CardIds, a hold flag and the target cell's used-mirror id recorded at capture. WordCellRow reads it directly, no prop (AD-2 covers engine exports only); presentation only (AD-14), never read for legality. It keeps committed cards visible, holds the previous cards (the target's uncommitted cards) as before the commit, and renders the recorded id as the used mirror (keyed `id-used`, `data-mirror-of`, no `data-card-id`/testid) lowest in the cell, beneath the committed faces, until release. In the own-cell case that id is also a flying live face; the mirror is a separate element, so 52 live elements hold.
- Ordering: `play()` sets the hold before its first `flushSync` (kind from command, result, phase), so render and measure agree; after planning it sets the committed set and flushes again before animating (`unverified`).
- Landing: a synchronous landing hook in flip.ts's settle path (each `onfinish`, and `finishAll`) hides a non-top card at its landing and releases the hold at the first landing; never a promise. The hold also clears in `finishAll`, `settle` and any `play()` with no animation.
- Every flyToCell animation is gate-counted and in the `finishAll` set (CAP-8).
- A free letter from another cell: the source cell's mirror goes and its beneath card shows at commit. An empty target cell holds nothing. The count badge is unchanged (post-commit count at once).
- Rewrite (winning Confirm/Redo now play) the flip.test.ts pins "a flyToCell play ... takes no gate count" and "a null or flyToCell kind plans nothing"; update the "entry 11" comments in flip.ts and ActionBar.svelte.

Also:
- unknown: landing callback or finished promise for holding.
- interface: flip.ts `flyToCell` playback and the landing hook; one new flip.ts export, the in-flight state; WordCellRow.svelte visibility and used mirror driven by it.
- owns: fly-to-cell playback, in-flight visibility rules (AD-14, DESIGN.md WordCell).
- consumers: the non-top visibility change in WordCellRow.svelte:63 touches the long-press peek, sticky view, hover peek and R-61 used-hatch mirrors; separate elements, unaffected.
- tests: AD-14 flyToCell 30 ms stagger bottom first, each flying card visible, 52 live elements (P5); AD-14 reduced-motion fade, all at once (S + P5); AD-14 Undo mid-fly-to-cell acts on the settled layout (P5); R-60 commit lands bottom → top (P5); AD-14 gate idle after `finishAll`; flip.test.ts: in-flight state empty after `finishAll`, a `play()` with no animation and an empty target cell; a winning Confirm and Redo play.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green and, in Playwright on android with fixtures/prefs-non-default.json (Slow), animations are asserted at stated points (right after the click; just after the first landing, seeking the first face to its end via `currentTime`):
- Confirm on fixtures/session-place.json: `getAnimations()` only on committed faces; every flying card not `visibility: hidden` and exactly 52 `data-card-id` elements in one evaluate; landing order bottom → top (R-60); the target's previous top shown until the first landing; non-top committed cards hidden after theirs.
- Confirm into the free letter's own cell on fixtures/session-place-free-letter-redo-tail.json: the used mirror kept until the first landing, gone after.
- Confirm on fixtures/session-place-free-letter-two-cards.json into a cell other than the free letter's own: at commit the source cell's mirror is gone, its beneath card visible, the target badge at the final count.
- Undo while at least one card has not started acts on the settled layout; the in-flight state is empty afterwards.
- Redo: Confirm on session-place, let it settle, Undo, Redo; the same checks hold.
- One Confirm under emulated reduced motion: faces fade unstaggered, the mirror gone at the fade's end.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-tray-and-place/epic-tray-and-place.md
- spec — _bmad-output/specs/spec-epic-5-tray/build-notes.md, CAP-8 (Fly-to-cell)
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md, Components (WordCell)
