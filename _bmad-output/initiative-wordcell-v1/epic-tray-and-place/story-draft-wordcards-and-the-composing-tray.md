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

Tracer bullet engine → GameView → tray: adds the AD-3 `draft.wordCards` view field in src/engine/view.ts (from `word()`'s cards; AD-2's list and R-02 literals unchanged), then replaces the F2 static tray with Tray.svelte switching on `view.place`, then `view.draft`, else empty, over the **Interface** components: in Composing the word line from `draft.wordCards` through `faces` (per DESIGN.md Typography word line; **Fit** 20 → 14 px), the invalid-word line replacing it while `feedback.rejectedWord` is set (**Invalid line**), tiles in `trayOrder` with the destination block joined edge to edge under one blue outline and lock per row segment, free-letter tiles with their origin-cell tag (card mode only, per DESIGN.md Tile; compact marks are entry 2): the cell number on tile `cards.at(-1)` of the `cells` entry whose `cell` field matches (never indexed by cell number; a missing entry or empty `cards` throws `Error` with a fixed-template message with the cell number, kept by entry 4), the letter count (`n letters` / `1 letter`) from `draft.letterCount` via text.ts `letters(n)`, an empty control-row left slot (entry 3 fills it); in Place the F2 strip as built (live tiles in `placementOrder` sized by `trayLayout`, no corner marks; no word line, tags, meta or controls; entry 2 adds them); empty word line, tiles and control row in Idle and Game over; `{#each}` keys (A9 4.3-m3): Tray keeps `${tile.id}-${tile.mirror}`, Column and WordCellRow key by the id plus the mirror kind passed to Card (`ghost` / `used`, or `live`), so a live ↔ mirror switch remounts the node; the ×2 badge keeps its 18 × 12 px corner on block tiles (A9 4.3-m4), right edge at grid cell x + tileWidth.

**Fit.** A pure helper `fitSize(measure: (px) => number, box, max, min = 14)` returns the largest integer px in min…max whose measured width is ≤ `box`, else min (word line clips; invalid line per **Invalid line**), never wrapping; `measure` reads the line's text element's width under a temporary class (nowrap, max-content, no ellipsis; invalid line: word–suffix space included), never a DOM clone; `box` the line width (invalid line: minus the fixed 16 px ✕ glyph and gap); the component injects it (word line max 20, invalid line max 16) and re-measures on mount, on text change (word or `rejectedWord`), band width change and after `document.fonts.ready`; the band height stays `heights.tray`.

**Invalid line.** DESIGN.md Invalid-word message: ui-body, the whole line shrinking 16 → 14 px (**Fit**); at 14 px only the word span ellipsizes; the suffix is never truncated. text.ts exports the fixed suffix (no leading space) and composes `invalidWord` as `${W} ${suffix}` (one literal); the text element is flex: word span (min-width 0, ellipsis), a `white-space: pre` span holding one space, suffix span (flex: none); its textContent is the full sentence; the ✕ glyph sits outside, directly before it.

**Interface.** DraftView gains `wordCards: readonly CardId[]`; new src/ui/tray/WordLine.svelte, TileRows.svelte, ControlRow.svelte, tags.ts, src/ui/layout/fit.ts; text.ts gains `letters(n)` and the invalid-word split.

**Owns.** `draft.wordCards` and its R-30 tests, the **Interface** modules, the free-letter tag lookup (folded into entry 4's lookup helper), A9 4.3-m3 and 4.3-m4.

**Consumers.** Readers of `data-card-id` / `data-mirror-of` across a live ↔ mirror switch: controller drop and fly-back element refs, FLIP identity (AD-14), every e2e spec and helper reading them (plan-listed; board-phases' F2 static-tray tests updated); across the invalid-word split, e2e/dictionary.spec.ts's R-38 exact-text locator.

**Tests.** R-30 wordCards order side left, side right, a QU card, and Place keeps word order (`setPlacementOrder` to a non-word order leaves `draft.wordCards` unchanged) (V); R-36 `QU` = 2 and R-37 `qu` spelling (V with the R-30 QU case; P5 supp.: Notes); R-30 word line and tile ids (= `draft.wordCards`), R-36 `3 letters`, R-37 uppercase word line on session-composing (P5 supp.); R-32 (UI) blue outline and lock per row segment on the k = 2 Composing (P5 part, card mode); R-33 (UI) cell 3 a used mirror, tag 3 (P5 part; other cells: entry 2's); R-38 invalid-word line shown (P5 part; clearing is entry 3); AD-14 52 live elements in every phase (P5); AD-3 `letters(n)` (n = 1 and n > 1), split (`W + ' ' + suffix === invalidWord(w)`), tag lookup with a cell other than 3 and its throw on a missing entry or empty `cards`; AD-11 `fitSize` with a fake measure (fits at max, shrinks, floors at min, a 16 max case) (S).

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green with the **Tests** cases; board.screens baselines whose render changes are regenerated only via `npm run test:screens -- --update-snapshots` (unverified: plan records one container run; SPEC CAP-1), each named, then a plain `npm run test:screens` green; Playwright on android shows word line text, D underline, tile order and letter count on session-composing and on session-place-free-letter-redo-tail after one Undo, the free-letter tag (cell 3) only on the latter; on session-place-free-letter-redo-tail after two Redos (k = 2, mirrors 1 and 27, as e2e/board-phases.spec.ts) one `.block.start` and one `.block.end` tray-band mirror and exactly one tray-band `.lock` (mirrors are aria-hidden); with the word list stubbed to exclude TAN (as e2e/dictionary.spec.ts R-38 does), the invalid-word line replacing the word line after Validate; the word line without overflow at a computed size within 14…20 px; the ×2 badge (A9 4.3-m4) checked in a browser on a seed or scratch Session named in the plan with `QU` in a k ≥ 2 block: badge right edge at grid cell x + tileWidth, recorded there (no fixture puts `QU` in D); empty tray rows on session-idle-pending-draft, session-won and session-gave-up; and exactly 52 `[data-card-id]` elements in Idle (session-idle-pending-draft), Composing (session-composing, its invalid-word state, session-place-free-letter-redo-tail after its Undo), Place (session-place-free-letter-redo-tail before its Undo, session-place) and Game over (session-won, session-gave-up).

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-tray-and-place/epic-tray-and-place.md
- spec — _bmad-output/specs/spec-epic-5-tray/SPEC.md (CAP-1, Constraints), rule-coverage.md, build-notes.md (As-built facts that bite, Component tree and modules)
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md, Components (Tray band, Tile, Invalid-word message)
- architecture — _bmad-output/planning-artifacts/architecture/architecture-wordcell-2026-09-27/ARCHITECTURE-SPINE.md, AD-3

## Notes

- Fixture words all fit at 20 px, so only the S test covers the shrink; e2e never asserts a text-dependent px size (epic 4 F11).
- Hand-off (no fixture here drafts CardId 35): this build appends to tickets.toml entry 2's `tests` R-36 `QU` = 2, R-37 `QU` uppercase word line and R-30 `QU` letter order (P5 supp.) on session-place-compact after one Undo, and to entry 3's R-30 side-left word line and tile order after ⇄ Flip, naming the edit in its plan.
