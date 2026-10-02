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

Builds the pure AD-11 layout core: src/ui/layout/bands.ts with BAND_ORDER as seven ordered units of the eleven band ids (F22), ANCHOR_BAND = 'wordcells', SLACK_BAND = 'leftover' and the ?bands= unit-list parser (absent or empty → default, repeated → first value, a non-permutation throws to AD-15), and src/ui/layout/geometry.ts with cardWidth(innerWidth, innerHeight, insets, hoverFine) (fed clientWidth per build-notes CAP-1), bands(w, bandOrder, trayRows, bannerShown, innerHeight, insets) returning band heights (leftover is heights.leftover), the absolute anchor offset and the document total; plus helpers for the A-D4 tray growth term, card metrics, available width, the clamped anchor scroll and the pure w-recompute predicate, with every SPEC CAP-1 reference case as UI Vitest.

- Types: `type BandId` = the eleven ids `topBar`, `banner`, `leftover`, `columns`, `footRow`, `trayGap`, `tray`, `labels`, `wordcells`, `actionGap`, `actionBar`; `type Unit = readonly BandId[]`. BAND_ORDER = `[['topBar'], ['banner'], ['leftover'], ['columns', 'footRow'], ['trayGap', 'tray'], ['labels', 'wordcells'], ['actionGap', 'actionBar']]` (build-notes CAP-1); unit ids (first non-gap, non-label band): `topBar,banner,leftover,columns,tray,wordcells,actionBar`.
- `parseBandsParam(search: URLSearchParams): readonly Unit[]` reads the first `bands` value; pure (no `import.meta.env`; entry 4 calls it only in dev); exact case-sensitive tokens, no trimming; a non-permutation throws a plain `Error` naming the bad list.
- `insets: { top: number; bottom: number }`, used as measured (no rounding); the top inset counts inside topBar's height, the bottom inside actionBar's.
- `cardMetrics(w) → { H, strip, slot, board }`: H = round(4w/3), strip = max(44, round(0.72 H)), slot = w + 4, board = 8 × slot; cardWidth and bands use it. cardWidth takes no banner or tray input (A-D4).
- `availableWidth(clientWidth, hoverFine)` = clientWidth − 2 × (hoverFine ? 16 : 4) (build-notes CAP-1); cardWidth uses it, entry 4 compares board with it.
- `bands(...)` takes `readonly Unit[]` and returns `{ heights: Record<BandId, number>; anchorOffset: number; total: number }`. banner is 44 when bannerShown, else 0; trayRows ≥ 1 counts compact rows (1 = card-height mode; epic 4 always passes 1), adding `trayGrowth(trayRows, H)` (A-D4: max(0, r × 44 + (r − 1) × 4 − max(H, 92))) to tray. anchorOffset = the summed heights of every band before `wordcells` in bandOrder (labels, insets and banner included where they precede it); total = document height, every band including leftover, insets, banner and tray growth. It implements AD-11's order-independent growth rule: banner and tray growth draw down leftover only when the growing band and SLACK_BAND are on the same side of ANCHOR_BAND; the rest, and all growth on the other side, pushes away from the anchor and lands in total. build-notes' "leftover = max(0, innerHeight − sum − banner)" is the default-order instance. bands and trayGrowth do no input validation (rule 6; the type and callers guarantee trayRows ≥ 1).
- `anchorScroll(prev, next, scrollTop, nextInnerHeight)` (the viewport height `next` was computed for) returns the new scrollTop = clamp(scrollTop + next.anchorOffset − prev.anchorOffset, 0, max(0, next.total − nextInnerHeight)); entry 4's layout module calls it (how it "computes the delta", AD-11) and never re-derives the clamp.
- `shouldRecomputeWidth(last: { innerWidth; innerHeight }, next: { innerWidth; innerHeight }): boolean`: true iff innerWidth differs or |ΔinnerHeight| ≥ 80; `last` holds window.innerWidth/innerHeight recorded at the last w computation, not the clientWidth fed to cardWidth (the caller replaces it only after a recompute; entry 4 handles the hoverFine query change outside it).
- trayGrowth, cardMetrics, availableWidth, anchorScroll and shouldRecomputeWidth are helpers beside AD-11's two entry points (cardWidth, bands), not new layout paths.

Interface: New src/ui/layout/bands.ts (BandId, Unit, BAND_ORDER, ANCHOR_BAND, SLACK_BAND, parseBandsParam) and src/ui/layout/geometry.ts (cardWidth, cardMetrics, availableWidth, bands, trayGrowth, anchorScroll, shouldRecomputeWidth); no shell or engine change.

Tests: AD-11 BAND_ORDER units, anchor and slack; AD-11 ?bands= parser (defaults, reorder, throws); AD-11 cardMetrics; AD-11 cardWidth and bands reference numbers, insets, floor, H > 92, height rule above innerHeight (leftover 0); AD-11 banner and tray growth (default and fallback order) with anchorScroll; AD-11 w-recompute predicate; AD-11 F21 innerHeight-only change.

Owns: The band ids, unit ids and every height-rule, card-size and band formula (cardMetrics, availableWidth, trayGrowth, the anchorScroll clamp; tray tile width and tiles per row stay with entry 3); later entries call these functions and never re-derive a band height, H, strip, slot, board, available width, w or scroll clamp.

## Acceptance Criteria

Verify: npm run test:all is green with UI Vitest AD-11 cases pinning every SPEC CAP-1 number and a non-permutation ?bands= list throwing. Inputs are (clientWidth, innerHeight, insets, hoverFine); insets {0, 0} and hoverFine false unless stated; `sum` = total − leftover with no banner and trayRows 1 (the height-rule sum, insets included); deltas and ranges go through anchorScroll.

- BAND_ORDER deep-equals the list above; ANCHOR_BAND 'wordcells', SLACK_BAND 'leftover'.
- Parser: absent → default; `?bands=` empty → default; repeated → first value; a valid reorder returns it; throws (toThrow()) for an unknown id or a non-unit band id such as footRow, a duplicate, a missing id and a trailing comma.
- cardMetrics: w 40 → 53/44/44/352; 46 → 61/44/50/400; 70 → 93/67/74/592.
- availableWidth: 412/false → 404; 1265/true → 1233; 359/false → 351 (board 352 is wider).
- 412 × 915, hoverFine false → w 46, H 61, strip 44, sum 738, leftover 177; 412 × 839 → leftover 101, anchor 710; 360 × 750, false → w 40, sum 722; cardWidth(1905, 950, {0, 0}, true) → 70 (H 93, board 592; H > 92 sum 941, tray 177); 412 × 915 with 24/24 insets → w 46, H 61, sum 786, leftover 129; cardWidth(412, 782, {24, 24}, false) → 44 (derived from the build-notes formula: w 44 sum 734 + 48 = 782 fits; w 45 736 + 48 = 784 > 782), versus 46 with {0, 0}.
- bands heights deep-equal: 412 × 839 → topBar 44, banner 0, leftover 101, columns 325, footRow 44, trayGap 4, tray 176, labels 16, wordcells 61, actionGap 8, actionBar 60; 412 × 915 with 24/24 insets → topBar 68, leftover 129, actionBar 84, the rest as at 839 (total 915, anchor 762).
- 40 px floor: width (exact-fit boundary cardWidth(360, 750, {0, 0}, false), available 352 → 40; floor case clientWidth 359 → 40; desktop gutter cardWidth(383, 750, {0, 0}, true), available 351 → 40); height-derived (412 × 500 → 40).
- 1280 × 720 (clientWidth 1265, hoverFine true) → w 40, sum 722 > 720, leftover 0, total 722. Banner shown: anchor +44, total 766, scrollTop 0 → 44 (range 0–46); hidden: anchor −44, delta −44 into the new 0–2 range (44 → 0, 46 → 2).
- Banner from leftover first: 412 × 839 → leftover 101 → 57, anchor 710 unchanged, delta 0; 412 × 780 → leftover 42 → 0, anchor 651 → 653, scrollTop 0 → 2 (range 0–2).
- trayGrowth(2, 61) 0, (3, 61) 48, (4, 61) 96, (3, 93) 47, (4, 93) 95. Default order at 412 × 839, w 46: trayRows 3 → leftover 101 → 53, 4 → 5, anchor 710 unchanged; 412 × 780, trayRows 3: leftover 42 → 0, anchor 651 → 657, total 786, scrollTop 0 → 6; 412 × 839, banner shown, trayRows 3: leftover 101 → 9, anchor 710 unchanged. Fallback order `?bands=topBar,banner,leftover,wordcells,tray,columns,actionBar` (WordCells and tray above the columns; tray below the anchor, slack above), trayRows 3: leftover stays 101, anchor 161 unchanged, total 839 → 887, delta 0. `?bands=topBar,banner,columns,wordcells,tray,leftover,actionBar` at 412 × 839, trayRows 3 (both below the anchor): leftover 101 → 53, anchor 429 unchanged, total 839.
- Predicate: Δh 79 → false; 80 → true; −80 → true; innerWidth ±1 → true; two −60 shrinks, the second checked against the original → true.
- F21 at w 46: 412 × 839 → 412 × 779: leftover 101 → 41, anchor 710 → 650, delta −60 clamped to 0 at scrollTop 0, range 0; 412 × 780 → 412 × 710: leftover 42 → 0, anchor 651 → 609, delta −42 clamped to 0, scrollTop stays 0, range 0 → 28; reverse 412 × 710, scrollTop 28 → 412 × 780: leftover 0 → 42, anchor 609 → 651, delta +42, clamped to the new 0–0 range (scrollTop 0).

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-board-and-gestures/epic-board-and-gestures.md
- spec — _bmad-output/specs/spec-epic-4-board/SPEC.md, CAP-1
- spec — _bmad-output/specs/spec-epic-4-board/build-notes.md, CAP-1
- spec — _bmad-output/specs/spec-epic-4-board/rule-coverage.md, AD-11 row (entry 1)
- architecture — _bmad-output/planning-artifacts/architecture/architecture-wordcell-2026-09-27/ARCHITECTURE-SPINE.md, AD-11
- design — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md, Layout (height rule)

## Notes

- Open question: Whether the height-derived w search stays exact at every reference viewport with insets; the SPEC numbers are the oracle. A mismatch with any number here (SPEC or derived) is a spec bug to stop and report (AGENTS.md Policy), never a literal to adjust.
