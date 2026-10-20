---
id: 2
type: story
title: "End-sheet Words section"
parent: epic-end-of-game-words
covers: [CAP-4]
after: [1]
risk: low
---

# End-sheet Words section

## Description

Renders the Words section below the end-sheet buttons from `view.wordList` for won and gaveUp: a list named `Words` by role and name under a `Words` heading, one row per entry named like `BAKED, 5 letters` with the word in capitals and `n letters` (`1 letter` for one), `No words were played.` when empty, rows at least 44 px, the sheet's content area scrolling; strings in `text.ts`, labels by role and name, and the relaunch, Undo, New game and Replay cases, using entry 1's fixture.

## Acceptance Criteria

Verify: On `android`, the won fixture and a seeded give-up show the list in order (a duplicate twice, a tie alphabetical), a zero-move give-up shows the empty line, a reload shows it, Undo of the finish, New game and Replay remove it, `localStorage` is unchanged by viewing it, a Vitest AD-3 test shows the section renders only from `view.wordList`, and `npm run test:screens` has the sheet at 360 px in Charcoal and one light theme.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-end-of-game-words/epic-end-of-game-words.md
- design — EXPERIENCE.md End sheet, Message catalogue; DESIGN.md Words section
- code — src/ui/EndSheet.svelte, src/ui/text.ts, src/ui/end-sheet.test.ts
