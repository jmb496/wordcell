---
id: 7
type: story
title: "End sheet: history-unreadable block and Reset history"
parent: epic-game-surfaces-and-keyboard
covers: [CAP-4]
after: [6]
risk: medium
---

# End sheet: history-unreadable block and Reset history

## Description

Adds the end-sheet block for an unreadable history (`Your score history can't be read.`, the version sentence variants, `This game wasn't added to your statistics.`, Reset history through the existing confirm), the replacement line after Reset history with a later Undo of that finish removing nothing (§2), and the relaunch case where the History notice shows on top of the pushed sheet entry.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green (screens specs the ticket adds listed per build-notes) with Playwright on android on each history-invalid-* fixture after a win and a Give up showing the block and its variants, Reset history turning it into the single line, Undo after it leaving history empty, and a relaunch into Game over with an unreadable history showing the notice over the sheet: the Game-over reload case (boot replaces the base with { wc: 0, launch: new }, pushes the sheet entry then the notice so history.state is { wc: 2, launch: new }; Reset history pushes the confirm, wc 3; back closes the confirm, back acts as Not now, back collapses the sheet to wc 0, back leaves the app).

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-game-surfaces-and-keyboard/epic-game-surfaces-and-keyboard.md
- spec — _bmad-output/specs/spec-epic-6-surfaces/SPEC.md, Capabilities (CAP-4), Decisions
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/EXPERIENCE.md, Component Patterns, Keyboard, State Patterns
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md, Components
