# Review loop — ticket 4.2 build (code mode, 17cfcad..55e6beb)
State: pass 1: done

Target: `_bmad-output/implementation-artifacts/review-loop/4-2-build.passes/pass0.diff` (git diff 17cfcad..55e6beb)
Intent: `_bmad-output/initiative-wordcell-v1/epic-board-and-gestures/story-board-render-in-idle-and-game-over-with-bars-plan.md`
Depth: thorough (correctness, edge cases, verification gap, intent alignment; fix diff from pass 2) | max 7
Pre-loop: HEAD 55e6beb88ec248fd19b25be8ff6f43cd623931d6, tree snapshot 0 c7190f7f077685744bd86b3be8ddfb9f81cebb45

## Pass 1 — 2026-10-02
Reviewers: correctness, edge cases, verification gap, intent alignment  |  Findings: major 0, minor 8, decision-needed 0  |  Dropped in triage: 0
Snapshot: tree c7190f7f077685744bd86b3be8ddfb9f81cebb45 (no fix pass; pass 0 state)
### Applied
- none (zero majors: stopping rule met before the fix step)
### Default applied (technical)
- none
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none. Triage note: the verification-gap items test behaviour beyond the ticket's enumerated AC assertions (which the tests meet literally), so they stay minor; the 'then Redo disabled' divergence is asserted by the R-70/R-71 test, so minor.

## Result — converged after 1 pass
Final state (orchestrator run at 55e6beb): `npm test` 36 files, 1702 passed; `npm run lint` clean (137 files); `npm run check` 0 errors, 0 warnings.

Unapplied minors (for the next build or loop):
1. src/ui/ActionBar.svelte `.primary` — DESIGN Layout & Spacing (Action bar) says the label shrinks to ui-label size (14 px) before it ellipsizes; the build goes straight from 16 px to ellipsis. Unreachable with the current catalogue at 344 px; implement the shrink step or record it in the plan's `deferred` list for a later entry.
2. e2e/board.spec.ts 'AD-17 F11 geometry' — no assertion that column-<n> spans the columns track plus the foot pad (AD-12 hit rect, CAP-1); assert column-<n> top = [data-band=columns] top and bottom = [data-band=footRow] bottom.
3. e2e/board.spec.ts AD-14 / render rules — data-column, data-wordcell and data-foot are used only as presence selectors; assert their values equal n.
4. e2e/board.spec.ts — WordCell geometry untested (50 × 61 slot, left = column-(n−2) left, top = [data-band=wordcells] top, redo-tail cards 42/0/28 sharing one box); the epic 3 y-order check was replaced by visible/hidden only.
5. e2e/smoke.spec.ts 'R-03 …' — reads .glyph text in DOM order, not visual top → bottom; also assert strictly increasing wrapper tops per column (or sort by top).
6. e2e/board.spec.ts — topBar 44 / actionBar 60 heights, `position: sticky` on both bars, bar/tray widths = board, h1 1 × 1 clip unasserted (only the band sum 839 is).
7. src/ui/text.test.ts 'AD-17 score text' — cites AD-17 (test infra) rather than the AD owning the score string (AD-3, displayScore).
8. e2e/board.spec.ts 'R-82 (UI) … Redo across a commit' — ticket AC Score bullet ends the flow with 'then Redo disabled'; the plan moved it to R-70/R-71 but the plan's `deferred` list does not record the ticket-wording divergence; add `await expect(redo).toBeDisabled()` after the loop or record it in `deferred`.
