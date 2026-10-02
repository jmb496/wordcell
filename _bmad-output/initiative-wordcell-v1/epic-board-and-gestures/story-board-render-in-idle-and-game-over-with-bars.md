---
id: 2
type: story
title: "Board render in Idle and Game over with bars"
parent: epic-board-and-gestures
covers: [CAP-2, CAP-3]
after: [1]
risk: high
---

# Board render in Idle and Game over with bars

## Description

Tracer bullet: replaces the epic 3 minimal board with Board.svelte iterating BAND_ORDER (no component names a neighbour band) at the w and band heights from entry 1 computed once at mount, Column.svelte (fanned cards, strip max(44, round(0.72 H)), the always-rendered placeholder slot, foot pad foot-<n> with the desktop column number, whole-slot column-<n> hit rect), Card.svelte as a full-slot-pitch wrapper carrying data-card-id, data-testid and data-place with a pointer-events: none face (glyph in the top 72 %, flourish, QU ×2 badge; F26), WordCellRow.svelte (labels 3–10, top card or empty outline, count badge at 2+, used/legal/target/not-legal states from CellView), the sticky TopBar (empty 44 px menu slot, Score <n> from displayScore via text.ts score(n) with U+2212, Undo/Redo icon buttons with desktop tooltips of the accessible name; F3), the dictionary banner in its band and the sticky ActionBar holding primary-action with epic 3's labels, enablement and New game sequence, a visually hidden h1 with every Seed <n> spec read moved to current().session.seed (F4), smoke.spec.ts's R-03 extended to every column of session-idle-fresh (C-E4a), and e2e/placeholder.screens.spec.ts with its two baselines deleted (the minimal board is gone; entry 3 creates board.screens.spec.ts).

## Acceptance Criteria

Verify: npm run test:all is green, and Playwright on android shows session-idle-fresh rendering 52 data-card-id elements with each column's letters top→bottom equal to literal lists (QU as QU), card faces 46 × 61 at the Pixel 7 profile with slot = w + 4 and board = 8 slots measured from rendered rects (F11), and Score on Idle, session-place, session-won and session-gave-up (negative with U+2212) and after a Redo across a commit.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-board-and-gestures/epic-board-and-gestures.md
- spec — _bmad-output/specs/spec-epic-4-board/build-notes.md, As-built facts, Component tree, CAP-2, CAP-3
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md, Components (Card, Column, WordCell, Top bar, Action bar)

## Notes

- Open question: How much of the minimal board's spec locators (h1, Seed line, ol WordCells) break across epic 3's e2e files; each is moved, never deleted, and the R-02 golden deal literals stay byte-identical.
