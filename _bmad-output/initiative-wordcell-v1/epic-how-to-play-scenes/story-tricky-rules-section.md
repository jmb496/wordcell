---
id: 4
type: story
title: "Tricky rules section"
parent: epic-how-to-play-scenes
covers: [HP-4, HP-5, HP-6]
after: [3]
risk: low
---

# Tricky rules section

## Description

Adds the Tricky rules section after the basic scenes with three animated scenes (HP-4): drop back on the source column (F must join, FAKED, R-21); the destination-card rule and empty columns in one scene (B must join on a column with cards; on an empty column nothing has to join and BAT is built from a lifted card and free letters, R-13, R-31, R-22); one top card per WordCell per word (tap cell 5, S joins, the cell dims, a second tap does nothing, R-33). Captions are the owner's 2026-10-17 wording in the epic Notes.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green with a Playwright android test that the Tricky rules heading and three scenes render in order and play, each fixture passes the engine replay including the rejected cases (r33-free-letter-duplicate and the empty-destination-column case), and the captions match the owner's wording in the epic Notes.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-how-to-play-scenes/epic-how-to-play-scenes.md
- rules — docs/game-flow-spec.md, R-13, R-21, R-22, R-31, R-33, Q-11
- code — src/engine/commands.test.ts TABLE (no-op or throw per command)

## Notes

- Open question: How scene (b) shows two halves (non-empty column, then empty column) in one loop without crowding a phone-width panel; the wording is settled by the owner (epic Notes, 2026-10-17).
