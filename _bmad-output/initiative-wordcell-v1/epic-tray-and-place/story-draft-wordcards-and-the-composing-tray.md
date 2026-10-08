---
id: 1
type: story
title: "Draft wordCards and the Composing tray"
parent: epic-tray-and-place
covers: [CAP-1]
after: [4.13]
risk: medium
---

# Draft wordCards and the Composing tray

## Description

Tracer bullet engine → GameView → tray: adds the AD-3 `draft.wordCards` view field in src/engine/view.ts (from the cards `word()` already returns, no new exported name, AD-2's list unchanged, R-02 literals untouched) with R-30 engine tests, then replaces the F2 static tray with Tray.svelte switching by phase over tray/WordLine.svelte, tray/TileRows.svelte and tray/ControlRow.svelte (build-notes Component tree): in Composing the word line from `draft.wordCards` through `faces` (uppercase, `QU` as `QU`, D cards underlined blue, measured shrink 20 → 14 px), the invalid-word line replacing it while `feedback.rejectedWord` is set (shrink, then ellipsize the word part), tiles in `trayOrder` with the destination block joined edge to edge under one blue outline and lock per row segment, free-letter tiles with their origin-cell tag found by the `cells` entry's `cell` field (a miss throws; never indexed by cell number), the letter count `5 letters` / `1 letter` from `draft.letterCount` via text.ts `letters(n)`, an empty control-row left slot (entry 3 fills it), empty word line, tiles and control row in Idle and Game over, `{#each}` keyed `${id}-${mirror}` in Tray, Column and WordCellRow (A9 4.3-m3) and the ×2 badge keeping its 18 × 12 px corner on block tiles (A9 4.3-m4).

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green with engine Vitest R-30 wordCards cases (side left, side right, a QU card, Place keeps word order) and UI Vitest AD-3 letters(n) cases, and Playwright on android shows the word line text, D underline, tile order, free-letter tag and letter count on session-composing and on session-place-free-letter-redo-tail after one Undo, the invalid-word line after a failed Validate, empty tray rows on session-idle-fresh and session-won, and exactly 52 data-card-id elements in each.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-tray-and-place/epic-tray-and-place.md
- spec — _bmad-output/specs/spec-epic-5-tray/build-notes.md, As-built facts that bite, Component tree and modules, CAP-1
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md, Components (Tray band, Tile, Invalid-word message)
- architecture — _bmad-output/planning-artifacts/architecture/architecture-wordcell-2026-09-27/ARCHITECTURE-SPINE.md, AD-3

## Notes

- Open question: Whether the measured 20 → 14 px word-line shrink stays stable across the four screenshot fixtures; e2e never asserts a text-dependent px size (epic 4 F11).
