---
id: 2
type: story
title: "Place strip, compact tray and session-place-compact"
parent: epic-tray-and-place
covers: [CAP-1]
after: [1]
risk: medium
---

# Place strip, compact tray and session-place-compact

## Description

Completes CAP-1 for Place and compact mode: the Place word line holding the validated word in word order (no D underline, unchanged by strip reorders), the strip in `placementOrder` with D cards as normal tiles, the `bottom` tag on the first tile and the `top` tag and orange `★` on the last, the free-letter origin tag top-left on full-height tiles (A-D10), and the meta `6 letters → cell 6 · +30` from text.ts `placeMeta(n, cell, delta)` with n = `draft.letterCount` (`QU` = 2), cell = `place.target`, delta = `place.scoreDelta`, its count part reusing text.ts `letters(n)` (`+n`, `±0`, U+2212 `−n`). Compact 44 px rows and per-row D segments with one lock each exist from 5.1 (src/ui/layout/tray.ts compact mode, TileRows.svelte `segment()`); the new work is the compact corner marks, the strip map (`▼`/`★` top-left, ×2 top-right, origin tag bottom-left) and the Composing marks (origin tag top-left, the `QU` tile's included; ×2 top-right), and the Place variants, proven on the row break; no `trayGrowth` or band-height change (two compact rows fit; three or more are CAP-9's). The `↩` corner shows only on a tap-selected free-letter tile and tile selection is CAP-4's (SPEC CAP-1), so entry 5 renders and tests it; it is not asserted here.

Scripts the valid fixture session-place-compact.json (8–14 strip tiles, its `QU` card a free letter from a cell other than 3, its Composing after one Undo with a D block crossing the row break; else a Composing fallback `session-composing-compact-<condition>.json`, condition `qu` or `block`, for the missing one, SPEC Assumptions) under the epic 3 regeneration rule. In src/engine/serialize.test.ts each new fixture's name joins the `ValidName` union, `VALID`, `PROPERTIES` and `REBUILDS` (in VALID order), any new words `FIXTURE_WORDS`; session-place-compact's `PROPERTIES` entry pins Place, 8–14 strip tiles, the `QU` card a free letter whose `cells` entry's `cell` ≠ 3, and after one Undo the D block at tray indices 6 and 7 (crossing the row break at 7 tiles per row, DESIGN.md Tray band at 360 and 412 px). In src/architecture-ad2-ad12-ad17.test.ts the filename joins the sorted valid list; the "eleven" wording changes in both files. The S14 browser check (epic 4 D19) is discharged by the android P5 tests plus the compact-strip screenshot, recorded in the plan; no manual step.

- Interface: text.ts gains placeMeta(n, cell, delta); TileRows.svelte and ControlRow.svelte gain the Place and compact variants; tray/WordLine.svelte the Place word line; Card.svelte the tag/corner CSS; new fixtures/session-place-compact.json (and the fallback Composing fixture if needed).
- Tests: R-50 (UI) bottom/top tags and ★, compact corner map on session-place-compact (P5); R-80 Place meta preview (P5 supp.); R-32 (UI) two outlined segments with two locks across the row break (P5 part); R-33 (UI) origin tag from a cell other than 3 (P5 part); R-51 strip in placementOrder (P5 supp. part); AD-3 placeMeta (S); AD-14 52 live elements on session-place-compact (P5); R-36 QU = 2, R-37 QU uppercase word line and R-30 QU letter order (P5 supp.) on session-place-compact after one Undo (5.1 plan `deferred`).
- Owns: session-place-compact.json (and any fallback), the compact tile and strip marks, placeMeta, S14.
- Consumers: adds the epic's first new valid fixture: the AD-17 valid-fixture test in src/architecture-ad2-ad12-ad17.test.ts and serialize.test.ts VALID/REBUILDS (entries 9 and 12 change them too) and the board screenshot baselines.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green (board baselines regenerated in the container; a `place-compact` row, session-place-compact in Place, added to e2e/board.screens.spec.ts on both projects) with UI Vitest AD-3 placeMeta cases (`placeMeta(6, 6, 30)` → `6 letters → cell 6 · +30`; delta 0 → `±0`; −1 → `−1` with U+2212; +1 → `+1`), and Playwright on android shows:

- the Place word line, bottom/top tags, ★ and meta on session-place and session-place-free-letter-redo-tail; on the latter (strip 9, 32, 28, word ONE, checked against fixtures/) the strip's card order equals `place.placementOrder` while the word line reads the word in word order (R-51), and free-letter card 28 shows its origin tag top-left and `top` plus ★ in its bottom band (A-D10);
- on session-place-compact in Place, the compact corner map, a `QU` free-letter origin tag from a cell other than 3 and the meta (letters exceed tiles by one for `QU`); exactly 52 `[data-card-id]` there and after one Undo (AD-14);
- after one Undo, the Composing compact marks (origin tag top-left, the `QU` tile's included; ×2 top-right; `↩` not asserted, entry 5);
- each condition on session-place-compact after one Undo, or on the fallback for the one it misses: the `QU` free letter from a cell other than 3 with R-36 `QU` = 2, R-37 `QU` uppercase word line and R-30 `QU` letter order; the D block crossing the row break as two outlined segments with two locks (R-32).

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-tray-and-place/epic-tray-and-place.md
- spec — _bmad-output/specs/spec-epic-5-tray/build-notes.md, CAP-1 (Fixture session-place-compact), Sweep inventory S14
- spec — _bmad-output/specs/spec-epic-3-app-shell/build-notes.md, CAP-1 Engine carry-ins (Fixture regeneration: the epic 3 regeneration rule)
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md, Components (Placement strip, Tile)

## Notes

- Open question: Whether one scripted Session meets both session-place-compact conditions (QU free letter from a cell other than 3, D block crossing the row break after one Undo); if not, the ticket scripts the second fixture SPEC Assumptions allows as `session-composing-compact-<condition>.json` (`qu` or `block`), joining the same serialize.test.ts and AD-17 lists.
