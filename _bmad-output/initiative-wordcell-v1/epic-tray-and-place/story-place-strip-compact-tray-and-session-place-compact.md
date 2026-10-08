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

Completes CAP-1 for Place and compact mode: the Place word line holding the validated word in word order (no D underline, unchanged by strip reorders), the strip in `placementOrder` with D cards as normal tiles, the `bottom` tag on the first tile and the `top` tag and orange `★` on the last, the free-letter origin tag top-left on full-height tiles (A-D10), the meta `6 letters → cell 6 · +30` from `place.scoreDelta` via text.ts `placeMeta(n, cell, delta)` (`+n`, `±0`, U+2212 `−n`), compact 44 px rows once the tile count exceeds one row with the strip corner map (`▼`/`★` top-left, ×2 top-right, origin tag bottom-left) and the Composing compact marks (tag top-left, `↩` slot in the ×2 corner, bottom-right on a `QU` tile), a D block crossing a row break drawn as outlined segments with one lock each; scripts the valid fixture session-place-compact.json (8–14 strip tiles, its `QU` card a free letter from a cell other than 3, its Composing after one Undo with a D block crossing the row break; else a second Composing fixture for the missing condition, SPEC Assumptions) under the epic 3 regeneration rule, adds it to src/engine/serialize.test.ts (VALID and REBUILDS) and to src/architecture-ad2-ad12-ad17.test.ts's valid session-fixture list (its count + 1 per new fixture), and checks the compact tray and strip in a browser (S14, epic 4 D19).

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green (board baselines regenerated in the container, a compact-strip screenshot added) with UI Vitest AD-3 placeMeta cases (+n, ±0, U+2212 −n, n = 1), and Playwright on android shows the Place word line, bottom/top tags, ★ and meta on session-place and session-place-free-letter-redo-tail, the compact corner map and a QU free-letter origin tag from a cell other than 3 on session-place-compact, and after one Undo the Composing compact marks with the D block as two outlined segments with two locks.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-tray-and-place/epic-tray-and-place.md
- spec — _bmad-output/specs/spec-epic-5-tray/build-notes.md, CAP-1 (Fixture session-place-compact), Sweep inventory S14
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md, Components (Placement strip, Tile)

## Notes

- Open question: Whether one scripted Session meets both session-place-compact conditions (QU free letter from a cell other than 3, D block crossing the row break after one Undo); if not, the ticket scripts the second fixture SPEC Assumptions allows and names it.
