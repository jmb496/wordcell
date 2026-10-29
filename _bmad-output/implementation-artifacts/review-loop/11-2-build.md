# Review loop — ticket 11.2 build (code, 12293ba..HEAD)
State: pass 1: done

Target: commit range `12293ba..HEAD` (staged as `11-2-build.passes/pass0.diff`); intent `_bmad-output/initiative-wordcell-v1/epic-place-preview/story-wordcell-row-place-preview-plan.md`. Depth thorough, max 7.
Pre-loop: HEAD d021c5e33e66c26eaa0e457b75a22e8775a98a01, tree snapshot 0 9c8e25e9be110dd0faef554ae90c2d1ca8cd837f.
Refs: docs/game-flow-spec.md, docs/requirements-carryover.md, CLAUDE.md, AGENTS.md, ARCHITECTURE-SPINE.md, DESIGN.md, EXPERIENCE.md, epic-place-preview.md, story-wordcell-row-place-preview.md.

## Pass 1 — 2026-10-28
Reviewers: correctness, edge cases, verification gap, intent alignment  |  Findings: major 2, minor 8, decision-needed 0  |  Dropped in triage: 0 (3 duplicates merged)
Snapshot: tree d4b8303a3a5f74b0966667218ae640254b5b41f3 (fix diff `11-2-build.passes/pass1.fix.diff`)
Fixer: all 9 applied, no product code changed; drop test via `holdThrough`/`path` (e2e/helpers/gestures.ts); 360 px probe widens `.count` inline min-width to the pill's centre, probes, restores; new tests: drag-drop reorder, Undo of a commit onto committed (no hold), R-65 view on cell 6, labels same-as-source used target. Orchestrator: `npm test` 3629 pass, lint pass, check 0 errors; fixer ran `place-preview` + `place` android: 35 pass, 1 skipped (desktop-only). Note: plan AC "follows every reorder and retarget" line does not yet name the drag test.
### Applied
- [major] `e2e/place-preview.spec.ts` (reorder/retarget tests); ticket Rendering "on drop or tap-swap, never during a drag" — the drop route and the unchanged-mid-drag frame have no test (raised by 3 lenses) → fixer item 1
- [major] `e2e/place-preview.spec.ts:241-245` (360 px test) — the unconditional rect-intersection asserts depend on the sub-pixel width of the system font's "15" (0.35–0.6 px measured on the host); CI runs `test:e2e` on `ubuntu-latest`, where a different font can make the rects miss and fail a correct product → fixer item 2
- [minor] `e2e/place-preview.spec.ts` star/R-70/R-71/R-73 titles start with Q-49 though R-50 (UI) ("marked as a preview") exists (AGENTS.md test names) → fixer item 3
- [minor] `e2e/place-preview.spec.ts` `expectPreviewMirror` hidden loop, `e2e/place.spec.ts:274` — `toBeHidden()` passes on an absent element → fixer item 4
- [minor] `e2e/place-preview.spec.ts:455` Undo of a commit — "no hold added" not tested; `session-place`'s target is empty so a hold would be invisible → fixer item 5
- [minor] ticket "★ … over the card flourish without suppressing it" — no assertion → fixer item 6
- [minor] plan AC R-33 (UI) Validate line names preview 28; the test (correctly) asserts 9 → fixer item 7
- [minor] R-65 view not opened on a used non-target cell whose drawn top is the card beneath (`session-place-used-cells` cell 6) → fixer item 8
- [minor] `src/ui/labels.test.ts` — no case for a used target previewing its own free letter (same-as-source) → fixer item 9
### Default applied (technical)
- 360 px paint-order probe → keep the natural-geometry corner asserts; prove paint order with a forced overlap inside the evaluate (temporarily widen `.count` so it covers the pill's centre-right, probe, restore), no unconditional assert on the natural intersection
- drop-route test → one android touch drag on `session-place-free-letter-two-cards` with the existing `e2e/helpers/touch.ts` helpers
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none
