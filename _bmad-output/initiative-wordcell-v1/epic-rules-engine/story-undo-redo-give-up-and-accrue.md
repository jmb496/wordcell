---
id: 6
type: story
title: "Undo, redo, give up and accrue"
parent: epic-rules-engine
covers: [CAP-5]
after: [5]
risk: medium
---

# Undo, redo, give up and accrue

## Description

Adds undo, redo and giveUp per R-70, R-71 and R-75 (pending draft into the redo tail, Redo from Place committing only at reached = committed, won → playing), accrue with safe-integer checks, the shared test helper that wins a real seed through public apply, and the command table's undo, redo, giveUp and status rows, completing the table; entries 9, 10 and 11 use the won helper for every won case.

## Acceptance Criteria

Verify: npm run test:all is green with every R-70 transition, R-39 undo from Composing returning S, D and the free letters, the R-71 enablement and discard cases (Redo into Place ignoring the dictionary included), R-72, R-75 and the R-76 accrue cases passing in all three statuses, and the command table complete and green.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-rules-engine/epic-rules-engine.md
- spec — _bmad-output/specs/spec-epic-2-rules-engine/build-notes.md, CAP-5 Undo, redo, give up, accrue

## Notes

- Open question: Whether whole-column self-drops win every seed the helper is used on without hitting a word the inline set must list.
