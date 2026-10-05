# Review loop — ticket 4.9 build (code mode)

State: pass 2: done

Target: commit range `996fd04..HEAD` (8ce0a98), staged diff `_bmad-output/implementation-artifacts/review-loop/4-9-build.passes/pass0.diff`
Intent: `_bmad-output/initiative-wordcell-v1/epic-board-and-gestures/story-drag-interruptions-selection-replacement-hide-back-and-cance-plan.md`
Depth: thorough, max 7
Pre-loop: HEAD 8ce0a98e4305f955ad1e0e44623cbd645fe81077, tree snapshot 0 2bce64e4d5b602705a61085b046c6b263c663726 (base 996fd04)

## Pass 1 — 2026-10-05
Reviewers: correctness, edge cases, verification gap, intent alignment  |  Findings: major 1, minor 11, decision-needed 1  |  Dropped in triage: 1
### Applied
- [major] e2e/drag-interruptions.spec.ts `AD-9 AD-16 AD-17 hidePage mid-touchHold …` — neither time assertion fails if hidden time were counted (store activeMs only moves at accrue points; ≥ 290 lower bound passes at ~2300) → fixer item 1 (default applied: upper bound `later - hiddenMs < 2000`, below the 2 s hidden interval, far above load noise)
- [minor] plan Implementation Notes vs Verification — two different warm unit medians → fixer item 2
- [minor] e2e inert foot-pad drag — lift of the selected faces not asserted mid-drag → item 3
- [minor] e2e `AD-12 F24 a drag from the source column of a selection lifts one tail` — no pre-drag baseline for the "none"/hidden assertions → item 4
- [minor] controller.test.ts deselecting it.each — no release over a non-target column → item 5
- [minor] controller.test.ts — no in-flight press on a column part during a restoring fly-back → item 6
- [minor] controller.ts settle/pointerdown — refreshHover runs before the new press resolves (mouse) → item 7 (default applied: document in header comment)
- [minor] Column.svelte suppression — desktop feet blank (no numbers) mid replacing drag → item 8 (default applied: record as intended in plan)
- [minor] reduced-motion restoring fly-back shows lift on dragged faces only → item 9 (default applied: add to the plan's deferred 8 px item)
- [minor] controller.test.ts inert loop lacks the placeholder → item 10
- [minor] e2e `AD-12 F13 Undo during a fly-back` timing depends on round trip → item 11 (default applied: click from an in-page hook right after the fly-back starts)
- [minor] controller.test.ts restoring-settle rows lack detach → item 12
### Decision needed (functionality / UX / gameplay)
- plan frontmatter `deferred[0]` — When the player drags a card that is already lifted as part of a selection, the card jumps 8 px at pickup and, after a cancelled drag flies back, lands 8 px low then snaps up. Keep the jump, or make the dragged card keep its lift? — proposed default: keep current behaviour (jump) for v1, revisit in a polish ticket
### Dropped
- e2e titles carry retro ids R1/R2 and lack R-76 — titles are ticket-mandated and R-76 coverage is not claimed by this ticket; renaming would break the plan's mapping
### Fix outcome
All 12 items applied (fixer: npm test 1928 passed, lint clean, check 0 errors; `drag-interruptions.spec.ts --repeat-each=3` 27 passed; hide and F13 Undo tests ×5 on android passed). Orchestrator re-ran test/lint/check: pass.
Snapshot: tree a727ef47cf00c29b34e1edbde53bd84a23b1c713  |  fix diff `4-9-build.passes/pass1.fix.diff`  |  full diff `4-9-build.passes/pass1.diff`

## Pass 2 — 2026-10-05
Reviewers: fix diff, edge cases, verification gap, intent alignment  |  Findings: major 0, minor 5, decision-needed 0  |  Dropped in triage: 0
Snapshot: tree a727ef47cf00c29b34e1edbde53bd84a23b1c713 (unchanged, no fix pass)
### Applied
- none (converged)

## Result — converged after 2 passes
Final state (tree a727ef4, commit 6b9bfed): npm test 1928 passed, lint clean, check 0 errors.
Decision needed: the 8 px lift jump when dragging a selected card (pass 1).
Unapplied minors (for the next build or loop):
- controller.test.ts `deselecting` row 'release over a non-target column' — fixture column 4 is unregistered, so it duplicates 'release over nothing'; overlap a registered column below MIN_RATIO or drop the row and note the reduction in the plan.
- e2e `AD-12 F24 a drag from the source column of a selection lifts one tail` — pre-drag baseline still missing for box-shadow, outline display and foot target states.
- controller.test.ts `replacing()` helper — assert selection unchanged and navCalls empty mid-drag (F12), so end-path rows catch an early deselect.
- plan Design Notes 'Rule → test mapping' — add rule-coverage row 103 (one tail lifted) and use exact test titles.
- e2e one-lifted-tail release is over the WordCell row, not empty space; note it in the mapping or release over empty board space.
