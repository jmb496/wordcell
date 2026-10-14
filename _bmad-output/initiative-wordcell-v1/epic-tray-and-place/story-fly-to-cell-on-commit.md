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

Plays `flyToCell` (F7: Confirm, or Redo at idle), winning included (not the CAP-10 guard): 2 × base, 30 ms `stagger()` bottom card first; each committed card is visible in flight (non-top cards are `visibility: hidden` today, WordCellRow.svelte:63), hidden at its landing if not the top. The target's previous cards keep their visibility; the free letter's own-cell used mirror (R-52) stays drawn until the first card lands. Under reduced motion every card fades in at once, unstaggered (reduced `duration('flyToCell')`); hide and hold release at its end. Undo mid-flight finishes it first; New game, Replay and restore never animate.

Mechanism:
- Playback: the flying set is the cards whose band changed to the WordCells (no 0.5 px skip), bottom first; each face glides from its captured to its settled rect, delay i × `stagger()` (i counts the flying set), fill backwards (`stagger` joins `FlipDeps`). Translating faces take `GLIDE` and lift the tile clip (`DRAG_TILES`) as any band-changer glide (F22); reduced-motion fades take neither. An empty flying set is a no-animation play (clears the hold).
- In-flight state: flip.ts exports one new read-only reactive state (`svelte/reactivity` set; `unverified`): the committed CardIds, a hold flag, a used-mirror id. flip.ts has no view access and Redo's target is unknown before dispatch, so capture (after its `finishAll`) records each cell's used-mirror id from the DOM (`[data-mirror-of]` per WordCell); `play()` keeps only the gaining cell's id, used only while held. WordCellRow reads it directly, no prop; presentation only (AD-14). It keeps committed cards visible, holds the target's previous cards hidden as before (a used cell shows the mirror), and renders the id as the used mirror (keyed `id-used`, `data-mirror-of`, no `data-card-id`/testid) beneath the committed faces, until release. In the own-cell case that id is also a flying face; the mirror is separate, so 52 live elements hold.
- Ordering (`unverified`): `play()` moves the kind lookup above its first `flushSync` and sets the hold there, so render and measure agree; the committed set follows planning; both flushes finish before paint.
- Landing: a synchronous landing hook in flip.ts's settle path (each `onfinish`, `finishAll`) hides a non-top card at its landing, releases the hold at the first; never a promise. Gate-counted like every glide (CAP-8), in the `finishAll` set. The hold also clears in `finishAll` and any animation-less `play()`; New game, Replay and restore already `finishAll` via `finishGlides` (main.ts:149; `unverified`).
- A free letter from another cell: its source cell's mirror goes and the beneath card shows at commit. An empty target cell holds nothing. The count badge shows the post-commit count at once.
- Rewrite the flip.test.ts pins "a flyToCell play ... takes no gate count", "a null or flyToCell kind plans nothing"; update the "entry 11" comments (flip.ts, ActionBar.svelte).

Also:
- unknown: resolved: synchronous landing hook.
- interface: flip.ts `flyToCell` playback, landing hook, one new export (in-flight state); WordCellRow.svelte visibility and used mirror.
- owns: fly-to-cell playback, in-flight visibility (AD-14, DESIGN.md WordCell).
- consumers: the non-top visibility change in WordCellRow.svelte:63 leaves the peek, sticky and R-61 used-hatch mirrors unaffected (separate elements).
- tests: Playwright: AD-14 flyToCell 30 ms stagger bottom first, each flying card visible, 52 live elements, own-cell used mirror and previous top kept until the first landing, source-cell mirror gone with its beneath card shown and badge final at commit, all again after Undo then Redo; AD-14 reduced-motion fade, all at once; AD-14 Undo mid-fly-to-cell acts on the settled layout; AD-14 commit lands bottom → top; AD-14 gate idle after `finishAll`. Vitest (flip.test.ts): in-flight state empty after `finishAll`, an animation-less `play()`, an empty target cell; winning Confirm and Redo play.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green and, in Playwright on android with fixtures/prefs-non-default.json (Slow), at stated points (right after the click; just after the first landing: pause all faces' animations, seek one to its end, `await animation.finished`; `getAnimations()` filtered to WAAPI animations on a `.face`):
- Confirm on fixtures/session-place.json: `getAnimations()` only on committed faces; every flying card not `visibility: hidden` and exactly 52 `data-card-id` elements in one evaluate; landing order bottom → top (AD-14); previous top shown until the first landing; non-top committed cards hidden after theirs.
- Confirm into the free letter's own cell (fixtures/session-place-free-letter-redo-tail.json): the used mirror and the previous top kept until the first landing, mirror gone after, exactly 52 `data-card-id` elements.
- Confirm on fixtures/session-place-free-letter-two-cards.json into another cell: at commit the source cell's mirror is gone, its beneath card visible, the target badge final.
- Undo before a card has started acts on the settled layout; the in-flight state is then empty.
- Redo: Confirm on session-place, settle, Undo, Redo; the same checks hold.
- One Confirm under emulated reduced motion: faces fade unstaggered, mirror gone at its end.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-tray-and-place/epic-tray-and-place.md
- spec — _bmad-output/specs/spec-epic-5-tray/build-notes.md, CAP-8 (Fly-to-cell)
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md, Components (WordCell)
