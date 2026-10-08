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

Completes CAP-1 for Place and compact mode: the Place word line holding the validated word in word order (no D underline, unchanged by strip reorders), the strip in `placementOrder` with D cards as normal tiles, the `bottom` tag on the first tile and the `top` tag and orange `★` on the last, the free-letter origin tag top-left on full-height tiles (A-D10), and the meta `6 letters → cell 6 · +30` from text.ts `placeMeta(n, cell, delta)` with n = `draft.letterCount` (`QU` = 2), cell = `place.target`, delta = `place.scoreDelta` (`+n`, `±0`, U+2212 `−n`), its count part reusing text.ts `letters(n)`. Compact 44 px rows and per-row D segments with one lock each exist from 5.1 (src/ui/layout/tray.ts compact mode, TileRows.svelte `segment()`); the new work is the compact corner marks, the strip map (`▼`/`★` top-left, ×2 top-right, origin tag bottom-left) and the Composing marks (origin tag top-left, the `QU` tile's included; ×2 top-right), and the Place word line, tags and meta; the compact strip spans both rows; no `TRAY_ROWS` or band-height change (two compact rows fit; three or more are CAP-9's). The `↩` slot renders per DESIGN.md Tile (card mode bottom band right; compact in the ×2 corner, bottom-right on a `QU` tile) as a Card.svelte prop nothing sets yet (SPEC CAP-1); entry 5 wires it to tile selection (CAP-4) and asserts it; not asserted here.

Scripts the valid fixture session-place-compact.json (8–14 strip tiles, its `QU` card always a free letter from a cell other than 3, its Composing after one Undo with a D block crossing the row break if one Session allows; else the Composing fallback `session-composing-compact-block.json` for the block, SPEC Assumptions) under the epic 3 regeneration rule. In src/engine/serialize.test.ts each new fixture's name joins the `ValidName` union, `PROPERTIES`, and the end of `VALID` and `REBUILDS`, any new words `FIXTURE_WORDS`; session-place-compact's `PROPERTIES` entry pins Place, 8–14 strip tiles, the `QU` card a free letter whose `cells` entry's `cell` ≠ 3 and, only without the fallback, the block condition; the fallback's entry pins Composing and the block condition. Block condition: the Composing draft has `destinationSide` `right` with |`arrangement`| ≤ 6 and |`arrangement`| + `destinationCount` ≥ 8, or `left` with `destinationCount` ≥ 8, i.e. the block covers tray indices 6 and 7 at 7 tiles per row (DESIGN.md Tray band at 360 and 412 px). In src/architecture-ad2-ad12-ad17.test.ts the filename joins the sorted valid list; the "eleven" wording becomes the resulting count (twelve, or thirteen with the fallback) in both files. The S14 browser check (epic 4 D19) is discharged by the android P5 tests plus the compact-strip screenshot, recorded in the plan; no manual step.

- Interface: text.ts gains placeMeta(n, cell, delta); TileRows.svelte and ControlRow.svelte gain the Place and compact variants; tray/WordLine.svelte the Place word line; Card.svelte the tag/corner CSS; new fixtures/session-place-compact.json (and the fallback Composing fixture if needed).
- Tests: R-50 (UI) bottom/top tags and ★, compact corner map on session-place-compact (P5); R-80 Place meta preview (P5 supp.); R-32 (UI) two outlined segments with two locks across the row break (P5 part); R-33 (UI) origin tag from a cell other than 3 (P5 part); R-51 strip in placementOrder (P5 supp. part); AD-3 placeMeta (S); AD-14 52 live elements on session-place-compact (P5); R-36 QU = 2, R-37 QU uppercase word line and R-30 QU letter order (P5 supp.) on session-place-compact after one Undo (5.1 plan `deferred`).
- Owns: session-place-compact.json (and any fallback), the compact tile and strip marks, placeMeta, S14.
- Consumers: adds the epic's first new valid fixture: the AD-17 valid-fixture test in src/architecture-ad2-ad12-ad17.test.ts and serialize.test.ts VALID/REBUILDS (entries 9 and 12 change them too) and the board screenshot baselines.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green (board baselines regenerated in the container; a `place-compact` row, session-place-compact in Place, added to e2e/board.screens.spec.ts on both projects) with UI Vitest AD-3 placeMeta cases (`placeMeta(6, 6, 30)` → `6 letters → cell 6 · +30`; delta 0 → `±0`; −1 → `−1` with U+2212; +1 → `+1`), and Playwright on android shows:

- the Place word line, bottom/top tags, ★ and meta on session-place and session-place-free-letter-redo-tail; on the latter (strip 9, 32, 28, word ONE, checked against fixtures/) the strip's card order equals `place.placementOrder` while the word line reads the word in word order (R-51), and free-letter card 28 shows its origin tag top-left and `top` plus ★ in its bottom band (A-D10); D card 9 has no lock or block outline and no word-line letter is underlined;
- on session-place-compact in Place, the compact corner map, a `QU` free-letter origin tag from a cell other than 3 and the meta (letters exceed tiles by one for `QU`); exactly 52 `[data-card-id]` there and after one Undo (AD-14);
- after one Undo, the Composing compact marks (origin tag top-left, the `QU` tile's included; ×2 top-right; `↩` not asserted, entry 5);
- on session-place-compact after one Undo, the `QU` free letter from a cell other than 3 with R-36 `QU` = 2, R-37 `QU` uppercase word line and R-30 `QU` letter order; on it or the fallback, the D block crossing the row break as two outlined segments with two locks (R-32);
- corner marks are asserted by bounding-box centre in that quadrant of the tile face (no px literals, epic 4 F11); meta strings are per-fixture literals recorded in the plan from its scoring;
- the 5.1 interim tests in e2e/tray.spec.ts (`R-33 (UI) compact mode: a free letter from cell 3 carries no origin tag (card mode only)`, `AD-14 (R-30) Place on ${fixture}: the strip as built, no word line, tag or count`) are rewritten to 5.2 behaviour, their `trayIds` strip-order assertions kept.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-tray-and-place/epic-tray-and-place.md
- spec — _bmad-output/specs/spec-epic-5-tray/build-notes.md, CAP-1 (Fixture session-place-compact), Sweep inventory S14
- spec — _bmad-output/specs/spec-epic-3-app-shell/build-notes.md, CAP-1 Engine carry-ins (Fixture regeneration: the epic 3 regeneration rule)
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md, Components (Placement strip, Tile)

## Notes

- Open question: whether session-place-compact can also meet the block condition; if not, the fallback above.
