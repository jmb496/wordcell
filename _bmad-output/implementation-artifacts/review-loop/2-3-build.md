# Review loop — ticket 2.3 build (code mode)
State: pass 1: done

Target: `0e58096..HEAD` (commit 81b828e), diff at `2-3-build.passes/pass0.diff` (git-ignored)
Intent: `_bmad-output/initiative-wordcell-v1/epic-rules-engine/story-session-createsession-replay-and-checksession-plan.md`
Depth: thorough (correctness, edge cases, verification gap, intent alignment), max 7
Pre-loop: HEAD 81b828e, tree snapshot 0 a207c20d95e83b4459db37dbea2748904516fc23

## Pass 1 — 2026-09-28 23:10
Reviewers: correctness, edge cases, verification gap, intent alignment  |  Findings: major 2, minor 5, decision-needed 0  |  Dropped in triage: 2 (duplicates)
Snapshot: tree 3f4ab818c613493d20485c46073287808413b678  |  Fix: Idle pending-draft and Idle redo-tail rejecting cases, Composing-reached draft rejecting cases, R-31 empty-destination case, 11-letter R-40 case, two test renames, `dealIds` shuffles `buildDeck()` ids, plan Verification line  |  Checks: `npm test` 497/497, lint pass, check 0 errors
### Applied
- [major] `src/engine/replay.test.ts` Idle-cursor cases / `replay.ts` draft branch — no rejecting case for an Idle cursor with a pending draft or redo tail; a replay skipping them when `phase === 'idle'` stays green → fixer item 1
- [major] `src/engine/replay.test.ts` per-move rejecting table / `rules.ts` `checkMove` — no rejecting case for a Composing-reached move breaking a Composing rule (§2 "validated only against the rules of the phase states up to its `reached`") → fixer item 2
- [minor] `src/engine/replay.test.ts` R-31 cases — no rejecting case for k ≥ 1 on an empty destination (0..0 branch) → fixer item 3
- [minor] `src/engine/deal.test.ts:130` — new test named R-02 outside the ticket's allowed R-id set; checks the D1 seam → rename to AD-2 → fixer item 4
- [minor] `src/engine/replay.test.ts:299` '§2 the dealt replay checks the seed before dealing' — name claims ordering the assertions cannot prove → rename → fixer item 5
- [minor] `src/engine/deal.ts` `dealIds` — no longer uses `buildDeck`, so the R-01 deck tests test an off-path function → fixer item 6
- [minor] `src/engine/replay.test.ts` R-40 upper boundary — no 11-letter word at targetCell 10 accepting case → fixer item 7
### Default applied (technical)
- `deal.ts` `dealIds` — deck source → shuffle `buildDeck().map((card) => card.id)` (same ids, golden test unchanged)
- `deal.test.ts:130` — test id → `AD-2 …`
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- duplicate of the `deal.test.ts:130` R-02 naming finding (raised by three lenses; kept the intent-alignment wording)
