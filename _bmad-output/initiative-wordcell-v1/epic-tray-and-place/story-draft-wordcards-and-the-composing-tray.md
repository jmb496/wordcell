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

Tracer bullet engine → GameView → tray: adds the AD-3 `draft.wordCards` view field in src/engine/view.ts (from `word()`'s cards; AD-2's list and R-02 literals unchanged), then replaces the F2 static tray with Tray.svelte switching by phase (testing `place` before `draft`) over the **Interface** components (build-notes Component tree): in Composing the word line from `draft.wordCards` through `faces` (uppercase, `QU` as `QU`, D cards underlined blue, **Fit** 20 → 14 px), the invalid-word line replacing it while `feedback.rejectedWord` is set (**Invalid line**), tiles in `trayOrder` with the destination block joined edge to edge under one blue outline and lock per row segment, free-letter tiles with their origin-cell tag (card mode only, per DESIGN.md Tile; compact marks are entry 2): the cell number on the cell's top card, `cards.at(-1)` of the `cells` entry whose `cell` field matches (never indexed by cell number; a missing entry or empty `cards` throws `Error` with a fixed message naming the cell, kept by entry 4), the letter count from `draft.letterCount` via text.ts `letters(n)`, an empty control-row left slot (entry 3 fills it); in Place the F2 strip as built (live tiles in `placementOrder`, F2's compact tiles without corner marks over one row; no word line, tags, meta or controls; entry 2 adds them); empty word line, tiles and control row in Idle and Game over; `{#each}` keys (A9 4.3-m3): Tray keeps `${tile.id}-${tile.mirror}`, Column and WordCellRow key by the id plus the mirror kind passed to Card (`ghost` / `used`, or `live`), so a live ↔ mirror switch remounts the node; the ×2 badge keeps its 18 × 12 px corner on block tiles (A9 4.3-m4), positioned against the tile width, not the widened block face.

**Fit.** A pure fit helper in src/ui picks the largest size in 14…20 px whose measured width fits the fixed-width box, else 14 px clipped on one line, never wrapping; re-measured on word change, band width change and after `document.fonts.ready`; the band height stays `heights.tray`.

**Invalid line.** DESIGN.md Invalid-word message: ui-body 16 px shrinking to 14 px through the same helper, then the word span ellipsizes; the suffix never shrinks. text.ts also exposes the word part and the fixed suffix (the catalogue string stays whole there); the full sentence stays the text of one element.

**Interface.** DraftView gains `wordCards: readonly CardId[]`; new src/ui/tray/WordLine.svelte, TileRows.svelte, ControlRow.svelte and the fit helper; text.ts gains `letters(n)` and the invalid-word split.

**Owns.** `draft.wordCards` and its R-30 tests, the **Interface** modules, the free-letter tag lookup (folded into entry 4's lookup helper), A9 4.3-m3 and 4.3-m4.

**Consumers.** Readers of `data-card-id` / `data-mirror-of` across a live ↔ mirror switch: controller drop and fly-back element refs, FLIP identity (AD-14), e2e/drag, tap, column-phases and wordcell-view specs; across the invalid-word split, e2e/dictionary.spec.ts's R-38 exact-text locator.

**Tests.** R-30 wordCards order side left, side right, a QU card, and Place keeps word order (`setPlacementOrder` to a non-word order leaves `draft.wordCards` unchanged) (V); R-36 `QU` = 2 and R-37 `QU` uppercase (V with the R-30 QU case; no fixture here drafts CardId 35, so their `QU` P5 supp. parts move to entry 2's session-place-compact Composing after one Undo); R-30 word line and tile order, R-36 `3 letters`, R-37 uppercase word line on session-composing (P5 supp.); R-32 (UI) blue outline and lock per row segment (P5 part, card mode); R-33 (UI) free-letter origin tag (P5 part; a cell other than 3 is entry 2's P5); R-38 invalid-word line shown (P5 part; clearing is entry 3); AD-14 52 live elements in every phase (P5); AD-3 `letters(n)`, fit helper (fits at 20, shrinks, floors at 14), invalid-word split, tag lookup with a cell other than 3 (S).

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green with the **Tests** cases; board.screens baselines whose render changes are regenerated only via `npm run test:screens` in the Playwright container (SPEC CAP-1), each named in the plan; Playwright on android shows word line text, D underline, tile order and letter count on session-composing and on session-place-free-letter-redo-tail after one Undo, the free-letter tag (cell 3) only on the latter; on session-composing the D block's `data-mirror-of` mirror(s) as one outlined segment with exactly one lock glyph (by role, aria or class; no new data-testid); with the word list stubbed to exclude TAN (as e2e/dictionary.spec.ts R-38 does), the invalid-word line replacing the word line after Validate; the word line without overflow at a computed size within 14…20 px; the ×2 badge box inside the tile's bounding box where a `QU` block tile is reachable, else a browser check recorded in the plan; empty tray rows on session-idle-fresh, session-won and session-gave-up; and exactly 52 `[data-card-id]` elements in Idle (session-idle-fresh), Composing (session-composing, its invalid-word state, session-place-free-letter-redo-tail after its Undo), Place (session-place-free-letter-redo-tail before its Undo, session-place) and Game over (session-won, session-gave-up).

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-tray-and-place/epic-tray-and-place.md
- spec — _bmad-output/specs/spec-epic-5-tray/build-notes.md, As-built facts that bite, Component tree and modules, CAP-1
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md, Components (Tray band, Tile, Invalid-word message)
- architecture — _bmad-output/planning-artifacts/architecture/architecture-wordcell-2026-09-27/ARCHITECTURE-SPINE.md, AD-3

## Notes

- Open question: Whether the measured 20 → 14 px word-line shrink stays stable across the four screenshot fixtures; e2e never asserts a text-dependent px size (epic 4 F11).
