---
id: 6
type: story
title: "End sheet: result, collapse, Give up and relaunch"
parent: epic-game-surfaces-and-keyboard
covers: [CAP-4]
after: [3, 5]
risk: high
---

# End sheet: result, collapse, Give up and relaunch

## Description

Wires `finished`/`unfinished` from DispatchResult to overlays and builds the end sheet: a win by Confirm or Redo opens it after the commit animation settles (one cancelable deferred-open token), Give up opens it at once, a relaunch with status won or gaveUp opens the Board in Game over expanded with no animation (nav push at boot for its one entry); it shows the title (`Every column cleared.` or `Game given up.` with `n letters left: −p`, n and p only from the view's lettersLeft and penalty), final score after R-81, band name and message, longest word (`—` with none) and words placed, with Replay this deal and Statistics buttons (New game stays the action bar primary; Replay from the sheet acts at once in a finished game); grab handle, Esc, back and scrim tap (the scrim covers the board between the bars) collapse it to its bar (the scrim tap consumed), the bar expands it, expansion owns one history entry; the top bar and action bar stay above the scrim; a transition into Game over closes any open WordCell view first; Undo closes the sheet and resumes play, and Undo from Game over with the sheet collapsed sets it hidden with no pop; focus moves to its first action on open and back to the board on collapse.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green (screens specs the ticket adds listed per build-notes) with Playwright on android covering a win via session-won, a Give up from the menu and one with a QU left, every band on seeded fixtures, relaunch into won and gaveUp with the sheet expanded, collapse/expand and its history entries with back, WordCells viewable while collapsed, a WordCell view closed before the sheet opens, Undo from the sheet and from the collapsed sheet (no history pop), and Replay this deal from it; the discriminating win smoke test (after a win by Confirm the end sheet shows the win title and the final score equals the pre-win score plus the committed delta; a give-up would show the penalty line).

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-game-surfaces-and-keyboard/epic-game-surfaces-and-keyboard.md
- spec — _bmad-output/specs/spec-epic-6-surfaces/SPEC.md, Capabilities (CAP-4), Decisions
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/EXPERIENCE.md, Component Patterns, Keyboard, State Patterns
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md, Components

## Notes

- Open question: Which fixtures reach the six bands and the longest-word `—` case; the ticket scripts any missing one under the epic 3 regeneration rule.
