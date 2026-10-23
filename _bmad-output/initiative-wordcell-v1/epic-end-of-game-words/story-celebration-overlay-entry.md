---
id: 4
type: story
title: "Celebration overlay entry"
parent: epic-end-of-game-words
covers: [CAP-3]
after: [3]
risk: high
---

# Celebration overlay entry

## Description

Adds the `celebration` entry to `overlays.svelte.ts` (`startCelebration`, legal only with no other entry and the end sheet hidden, in `SUSPENDING`, in no `LEGAL_TOPS`), the removal callback that records why the entry was removed and runs entry 3's `done` in a microtask after the removal loop, the `attachOverlays()` function in `celebration.svelte.ts` (added here) that registers a removal callback with `overlays` and uses entry 3's `onEnd` hook so `end()` pops the entry and defers `done` to a microtask, so `overlays` never imports `celebration` (called from `main.ts` at boot by entry 5, directly by the tests here), and the `closedByBack`, `resetForNewSession` and `unfinished` paths for it.

## Acceptance Criteria

Verify: UI Vitest AD-13 tests (with a stubbed `done` standing in for entry 5's sheet open) pass for the legal start, a back that ends it without sweeping a following push, Undo and New game cancelling without `done`, game keys ignored while it is the top entry, and `?` and a WordCell tap not opening a surface over it.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-end-of-game-words/epic-end-of-game-words.md
- architecture — ARCHITECTURE-SPINE.md AD-13 (the celebration bullet), AD-19
- code — src/ui/overlays.svelte.ts, src/shell/nav.ts, src/ui/keys.ts

## Notes

- Open question: Whether the microtask ordering and nav's pop-before-push queue behave on `closedByBack` as AD-13 states; this entry proves it with a stub and entry 6's back test proves it against the real sheet.
