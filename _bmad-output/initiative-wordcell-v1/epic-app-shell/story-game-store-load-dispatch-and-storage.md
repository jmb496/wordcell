---
id: 3
type: story
title: "Game store load, dispatch and storage"
parent: epic-app-shell
covers: [CAP-3]
after: [1]
risk: medium
---

# Game store load, dispatch and storage

## Description

Builds storage.ts (stateless read/write/remove, the only localStorage user, calling localStorage at call time), seed.ts, the passive clock.ts, and the game store's AD-4 load (absent key → createSession(newSeed()) written at once; parse not ok → rejected, nothing written) and dispatch in AD-4 order with writes on every new reference and DispatchResult, the test hook's loaded() (throws while booting) and current() for the Session only, the minimal board (E1: columns, WordCells, Undo and Redo with test ids, Seed line), and moves the smoke, dist-smoke and screenshot specs onto fixtures/session-idle-fresh.json with the baseline regenerated in the container.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green, and Playwright on android shows a fresh context storing a uint32-seeded Session before any input, Undo and Redo on session-place.json each stored before the next action, and a CDP Page.crash then new page restoring session-place-free-letter-redo-tail.json after an Undo exactly as last written.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-app-shell/epic-app-shell.md
- spec — _bmad-output/specs/spec-epic-3-app-shell/build-notes.md, As-built facts, CAP-3

## Notes

- Open question: Whether rune modules test in node Vitest (the first shell test is the reactivity probe; fallback a client-transform Vitest project, SPEC Assumptions).
