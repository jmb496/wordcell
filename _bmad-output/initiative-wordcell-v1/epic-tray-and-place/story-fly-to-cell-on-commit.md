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

Plays `flyToCell` for a Confirm and a committing Redo, a winning one included (F7; installing the CAP-10 guard is CAP-10's, not this ticket's): 2 × base, 30 ms `stagger()` bottom card first (motion.ts), each committed card visible in flight (today non-top cell cards are `visibility: hidden`, WordCellRow.svelte:63 `hidden={i !== top}`) and taking the hidden state at its own landing if not the top. The target cell's previous cards keep their pre-commit visibility, and the free letter's own-cell used mirror (R-61) stays drawn when that cell is the target, until the first flying card lands; the look between first and last landing is the spec's intended behaviour. Under reduced motion every card fades in at once over 120 ms with no stagger and the release happens at the fade's end. Undo pressed mid-flight finishes it and acts on the settled layout. New game, Replay and restore never animate.

Mechanism:
- Playback (replaces the `flyToCell` empty plan in `planGlides`): the flying set is the cards whose band changed to the WordCells, ordered bottom of the final stack first; each face glides from its captured viewport rect to its settled cell rect (tray, strip or free-letter origin, as for a band changer), with delay i × `stagger()` and fill backwards, so unstarted cards do not park visible in the cell (`stagger` joins `FlipDeps`). Reduced motion: faces stay at the settled rect, opacity 0 → 1, no stagger. Other faces get no motion; animations only on faces, none on wrappers or mirrors. Faces keep DOM order bottom → top.
- In-flight state: flip.ts owns reactive state (the committed CardIds and a held-previous flag, a `svelte/reactivity` set since flip.ts is not a rune module) read by WordCellRow, which keeps the committed cards visible, holds the previous cards' visibility and keeps the free letter's used mirror drawn after the view already dropped it. The mirror stays a mirror (`data-mirror-of`, no `data-card-id`/testid, no animation), so 52 live elements hold. No new module exports: the state is a member of the existing `Flip` object, passed to WordCellRow as a prop.
- Landing: a landing hook called from flip.ts's synchronous settle path (each animation's `onfinish`, and `finishAll`, since `capture()` does `finishAll` then `flushSync` before measuring) hides a non-top card at its landing and releases the hold at the first landing. Never a promise. The hold is also released in `finishAll`, in `settle`, and on any `play()` that creates no animation, so it cannot stick.
- Every flyToCell animation is gate-counted and in the `finishAll` set (CAP-8), so a new press or `act()` button mid-flight completes it.
- A free letter taken from another cell: that source cell's used mirror goes and its beneath card shows at commit, not held. An empty target cell holds nothing. The count badge shows the post-commit count at once.
- Rewrite the flip.test.ts pins "a flyToCell play ... starts no animation and takes no gate count" and "a null or flyToCell kind plans nothing"; update the stale "entry 11" comments in flip.ts (header) and ActionBar.svelte.

Also:
- unknown: whether holding needs a landing callback or the first animation's finished promise: decided, the synchronous landing hook above.
- interface: flip.ts `flyToCell` playback and the landing hook; WordCellRow.svelte visibility driven by the in-flight state; no new module exports.
- owns: fly-to-cell playback and the in-flight visibility rules (AD-14, DESIGN.md WordCell).
- consumers: changing the non-top visibility in WordCellRow.svelte:63 (`hidden={i !== top}`) touches the long-press peek, sticky view and hover peek mirrors and the R-61 used-hatch mirror; these are separate elements, unaffected.
- tests: AD-14 flyToCell 30 ms stagger bottom first, each flying card visible, 52 live elements during fly-to-cell (P5); AD-14 reduced-motion fly-to-cell fade, all at once (S + P5); AD-14 Undo mid-fly-to-cell acts on the settled layout (P5); R-60 commit lands bottom → top (P5 supp. part); AD-14 gate idle after `finishAll`.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green with the tests above and, in Playwright on android with fixtures/prefs-non-default.json (Slow), animations paused or asserted at stated points (right after the click, and just after the first landing):
- Confirm on fixtures/session-place.json: `getAnimations()` only on each committed face, none on wrappers or mirrors; every flying card not `visibility: hidden` and exactly 52 `data-card-id` elements in the same evaluate; landing order bottom → top (R-60); the target's previous top still shown until the first landing; non-top committed cards hidden after their landing.
- Confirm into the free letter's own cell on fixtures/session-place-free-letter-redo-tail.json: the used mirror kept until the first landing, gone after.
- Undo mid-fly-to-cell acts on the settled layout.
- Redo: Confirm on session-place, Undo, Redo; the same checks hold.
- One Confirm under emulated reduced motion: faces fade with no stagger, the mirror gone at the fade's end.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-tray-and-place/epic-tray-and-place.md
- spec — _bmad-output/specs/spec-epic-5-tray/build-notes.md, CAP-8 (Fly-to-cell)
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md, Components (WordCell)
