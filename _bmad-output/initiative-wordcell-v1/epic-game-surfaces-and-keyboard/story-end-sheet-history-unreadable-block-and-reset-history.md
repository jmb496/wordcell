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

Verify: npm run test:all and npm run test:screens are green, the screens specs being the end sheet with the block (one variant) at 360 px and the end sheet with the single replacement line at 360 px. Playwright on android shows the block, after a win and after a Give up (each covered at least once across the fixtures), with the EXPERIENCE.md row 102 version sentence per variant: `history-invalid-version-unknown` (`It uses format version 2, which this version can't read.`), `history-invalid-null` (`Its format version can't be read.`) and `history-invalid-record-field-set` (`It uses format version 1 but its contents can't be read.`). One derived getter feeds the block, which does not re-derive the message (SPEC F4, AD-3).

Reset history, from the expanded sheet (history.state wc 1), pushes the confirm (wc 2). Delete history closes only the confirm and the sheet stays expanded showing the single line; Keep it closes only the confirm and the block stays; back closes the confirm. Undo of that finish then closes the sheet and resumes play, and the stored history stays the post-reset empty history with no record for the undone finish (assert on storage or the test hook).

A relaunch into Game over with an unreadable history shows the notice over the sheet: boot replaces the base with { wc: 0, launch: new }, pushes the sheet entry then the notice so history.state is { wc: 2, launch: new }. Reset history pushes the confirm (wc 3); per EXPERIENCE.md row 104 Delete history closes the confirm and the notice together and leaves the expanded sheet with the single line, and Keep it returns to the notice. Back sequence: back closes the confirm, back acts as Not now (the notice stays after the first back), back collapses the sheet to wc 0 (collapsed, never hidden), back leaves the app.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-game-surfaces-and-keyboard/epic-game-surfaces-and-keyboard.md
- spec — _bmad-output/specs/spec-epic-6-surfaces/SPEC.md, Capabilities (CAP-4), Decisions (F4, F8)
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/EXPERIENCE.md, Component Patterns, Keyboard, State Patterns
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md, Components
