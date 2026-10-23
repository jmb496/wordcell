---
id: 6
type: story
title: "Celebration skip"
parent: epic-end-of-game-words
covers: [CAP-3]
after: [5]
risk: high
---

# Celebration skip

## Description

Adds the skips on top of entry 5's trigger: a press outside the top bar, action bar and dictionary banner that began after the start (one-shot click swallow, consumed; a held finger and a banner button do not skip), `Space`/`Esc` on desktop (not while a bar or banner control has focus), and the Android back gesture through entry 4's `closedByBack` path; this entry owns the press-outside-the-bars e2e helper and adjusts the wave, stagger and physics constants and the copy scale that Jared's Android read calls for.

## Acceptance Criteria

Verify: The R-87 skip rows of rule-coverage.md pass on `android` (`desktop` for `Space`/`Esc`), including the consumed press, a held finger not skipping, a banner button not skipping, and back leaving the app open with the expanded sheet, and Jared's Android read of the first real win with the long-word fixture settles the copy cost, the initial constants and A-D12, and `npm run test:screens` is green.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-end-of-game-words/epic-end-of-game-words.md
- architecture — ARCHITECTURE-SPINE.md AD-13, AD-19 (Skip)
- design — EXPERIENCE.md Win celebration (Skip), Keyboard
- code — src/ui/celebration/, src/ui/motion.ts, src/ui/keys.ts

## Notes

- Open question: How Android treats a back that ends the run and immediately pushes the sheet entry; the real-sheet back test is the proof.
