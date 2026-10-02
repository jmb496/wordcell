# Review log — story-layout-definition-and-geometry.md (ticket 4.1)

State: pass 1: done

Mode: docs, thorough, max 7, budget 1500 words. Pass 0: HEAD 626b60d, copy story-layout-definition-and-geometry.passes/pass0.md, 231 words.
Intent carried from tickets.toml entry 1 (not copied by the pull): interface, tests, owns, unknown; pass-1 fixer adds them to Description as 'Interface:', 'Tests:', 'Owns:', 'Unknown:'.

## Pass 1 — 2026-10-01
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 7, minor 9, decision-needed 0  |  Dropped in triage: 1 (about 20 duplicates merged)
Words (docs): 1125 (4.9 x pass 0)  |  Snapshot: story-layout-definition-and-geometry.passes/pass1.md
Fixer: applied 1–14; all derived numbers recomputed and matched; pinned fallback anchor 161 and 1280 × 720 range 0–2 / 0–46
### Applied
- [major] Description / AC — SPEC CAP-1 scrollTop deltas, clamps and scroll ranges untestable: no pure function computes them and bands() returns no total → fixer item 1
- [major] AC — fallback order unnamed, no oracle → fixer item 2
- [major] Description — leftover rule: build-notes formula is the default-order instance; AD-11 order-independent growth rule not stated → fixer item 3
- [major] AC — SPEC CAP-1 "banner growth taken from leftover first" has no case (1280 × 720 has leftover 0) → fixer item 4
- [major] AC / Description — parser absent/empty/repeated, valid reorder, BAND_ORDER units and the two constants untested → fixer item 5
- [major] Description — types and shapes later entries depend on (BandId, units, insets, parser input/output, bands() return, anchor offset definition, predicate signature and ≥ 80 boundary) unspecified → fixer item 6
- [major] Description / owns — owns "every geometry formula" but exports no H/strip/slot/board; entry 2 would re-derive → fixer item 7
- [minor] AC — the 40 px floor cases (width boundary, 412 × 500 height-derived) → fixer item 8
- [minor] AC — hoverFine and clientWidth inputs for each reference case → fixer item 9
- [minor] Description — trayGrowth/shouldRecomputeWidth vs AD-11 "two entry points" → fixer item 10
- [minor] Description — bannerShown 44/0, trayRows meaning, cardWidth ignores banner/tray → fixer item 11
- [minor] Description — parser purity (not dev-gated), plain Error, exact tokens → fixer item 5
- [minor] Description — fractional insets used as measured → fixer item 6
- [minor] Notes — a mismatch with a SPEC number is a spec bug to stop and report → fixer item 12
- [minor] References — add SPEC CAP-1, spine AD-11, rule-coverage AD-11 row → fixer item 13
- [minor] Description — add Interface / Tests / Owns / Unknown from tickets.toml entry 1 → fixer item 14
### Default applied (technical)
- geometry.ts — bands() also returns total; pure anchorScroll(prev, next, scrollTop, innerHeight) clamps to [0, max(0, total − innerHeight)]; entry 4's layout module calls it (AD-11 "layout module computes the delta" kept: it computes by calling it)
- fallback order — ?bands=topBar,banner,leftover,wordcells,tray,columns,actionBar (tray below anchor, slack above: the opposite-side AD-11 branch the default order does not reach)
- geometry.ts — cardMetrics(w) → { H, strip, slot, board }
- parseBandsParam(search: URLSearchParams) pure, plain Error; entry 4 gates on import.meta.env.DEV
- insets { top, bottom }; top inset inside topBar, bottom inside actionBar; no rounding
- shouldRecomputeWidth(last, next) with |Δh| ≥ 80 → true
### Dropped
- Rename cardWidth's first parameter to availableViewportWidth — build-notes keeps AD-11's signature on purpose
