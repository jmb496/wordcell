---
id: 13
type: story
title: "Screen-reader labels and live region"
parent: epic-game-surfaces-and-keyboard
covers: [CAP-11]
after: [11]
risk: medium
---

# Screen-reader labels and live region

## Description

Names every card button by letter, place and state, every WordCell by number, top card, count and state, `QU` as `Q U, counts as two letters`, moves the WordCellRow aria-label into text.ts, and adds one polite live region in the UI (announcements replace, not queue) announcing phase changes, the invalid-word message, commits (`BALKED placed on cell 6, plus 30`; announced after the dispatch of Confirm or a committing Redo returns, word/cell/delta from the committed move's view, stop and report if a field is missing), Undo, Redo, New game and the end outcome; the full string and trigger list goes in build-notes.md.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green with UI Vitest AD-3 on the label and announcement strings (plus, minus, no change; plural forms) and Playwright on android reading accessible names for a column card, a selected card, a used WordCell and a QU card and the live-region text through a phase change, an invalid word, a commit and a win.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-game-surfaces-and-keyboard/epic-game-surfaces-and-keyboard.md
- spec — _bmad-output/specs/spec-epic-6-surfaces/SPEC.md, Capabilities (CAP-11), Decisions
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/EXPERIENCE.md, Component Patterns, Keyboard, State Patterns
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md, Components

## Notes

- Open question: Whether live-region text must be deduplicated when several state changes land in one update.
