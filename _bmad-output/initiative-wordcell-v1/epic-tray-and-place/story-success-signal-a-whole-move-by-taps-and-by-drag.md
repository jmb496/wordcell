---
id: 17
type: story
title: "Success signal: a whole move by taps and by drag"
parent: epic-tray-and-place
covers: [CAP-7]
after: [9]
risk: medium
---

# Success signal: a whole move by taps and by drag

## Description

Proves epic Done when 2 and 3 (SPEC Success signal) on entries 1–9: picks from the generated list a 4+ letter dictionary word with at least two legal target cells that uses cell 7's top as a free letter and is playable by taps from session-idle-empty-column (else scripts a valid fixture under the epic 3 regeneration rule, adds it to the fixture lists and flags it for the owner at close-out, SPEC Assumptions), then plays it on android by taps only (tap-select, tap-drop, tap-add, tap-swap, Validate, tap a legal target other than the pre-selected one, tap-swap the strip, Confirm) and again with the drop, the free-letter add and both reorders by drag.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green, and Playwright on android shows the tap-only move committing the word to the chosen cell in the chosen order with the score changing by the previewed delta and the stored Session equal to current().session after every step, and the drag version ending with moves and cursor equal to the tap version's (activeMs aside).

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-tray-and-place/epic-tray-and-place.md

## Notes

- Open question: Whether such a word exists from session-idle-empty-column (SPEC Assumptions); a scripted fallback start fixture changes the Success signal's named start and goes to the owner at close-out.
