---
id: 1
type: story
title: "Layout definition and geometry"
parent: epic-board-and-gestures
covers: [CAP-1]
after: [3.12]
risk: medium
---

# Layout definition and geometry

## Description

Builds the pure AD-11 layout core: src/ui/layout/bands.ts with BAND_ORDER as seven ordered units of the eleven band ids (F22), ANCHOR_BAND = 'wordcells', SLACK_BAND = 'leftover' and the ?bands= unit-list parser (absent or empty → default, repeated → first value, a non-permutation throws to AD-15), and src/ui/layout/geometry.ts with cardWidth(innerWidth, innerHeight, insets, hoverFine) (fed clientWidth per build-notes CAP-1), bands(w, bandOrder, trayRows, bannerShown, innerHeight, insets) returning band heights, leftover and the absolute anchor offset, the A-D4 tray growth term and the pure w-recompute predicate, with every SPEC CAP-1 reference case as UI Vitest.

## Acceptance Criteria

Verify: npm run test:all is green with UI Vitest AD-11 cases pinning every SPEC CAP-1 number (412 × 915, 412 × 839, 360 × 750, 1080p/950, 24/24 insets, 1280 × 720 with banner show and hide, the 40 px floor, H > 92, tray growth in the default and one fallback order, the 80 px and two-60 px predicate cases, both F21 innerHeight-only cases) and a non-permutation ?bands= list throwing.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-board-and-gestures/epic-board-and-gestures.md
- spec — _bmad-output/specs/spec-epic-4-board/build-notes.md, CAP-1
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md, Layout (height rule)

## Notes

- Open question: Whether the height-derived w search stays exact at every reference viewport with insets; the SPEC numbers are the oracle.
