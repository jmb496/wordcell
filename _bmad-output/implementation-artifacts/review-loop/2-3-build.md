# Review loop — ticket 2.3 build (code mode)
State: pass 3: done

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

## Pass 2 — 2026-09-28 23:30
Reviewers: fix diff, edge cases, verification gap, intent alignment  |  Findings: major 1, minor 6, decision-needed 0  |  Dropped in triage: 0
Snapshot: tree 3becaf559df05f1229729c3f482943288ac4990d  |  Fix: R-31 k = n + 1 and k = 0 self-drop cases, Composing-cursor accepting case, second free-letters-set case, move-major and pre-replay order cases, R-52 test extended with a later word using the new top  |  Checks: `npm test` 503/503, lint pass, check 0 errors
### Applied
- [major] `src/engine/replay.test.ts` R-31 cases / `rules.ts` `checkDestinationCount` — no rejecting case at k = n + 1 (only n + 2), so an off-by-one upper bound stays green → fixer item 1
- [minor] `replay.test.ts` — no accepting case for a Composing cursor over a Composing-reached draft (the `reachedAtLeast` equality case) → fixer item 2
- [minor] `replay.test.ts` per-move cases — no k = 0 self-drop on a non-empty remainder (R-31, R-21, Q-12) → fixer item 3
- [minor] `replay.test.ts` `s2-free-letters-set` — the one case fails both set directions; add an extra-cell case → fixer item 4
- [minor] `replay.test.ts` — the fixed check order (move-major; pre-replay order) is mostly unpinned; add two-violation cases → fixer item 5
- [minor] `replay.test.ts` 'R-52 …' — does not show the new top is used as a free letter by a later word → fixer item 6
### Default applied (technical)
- R-31 upper boundary case → `{ ...BASE, destinationCount: 5 }` on the 4-card column 2 (or the self-drop k = 4 over n = 3)
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none

## Pass 3 — 2026-09-29 00:05
Reviewers: fix diff, edge cases, verification gap, intent alignment  |  Findings: major 1, minor 7, decision-needed 0  |  Dropped in triage: 1 (merged duplicate major)
Snapshot: tree 3becaf559df05f1229729c3f482943288ac4990d (unchanged; no fix pass)
### Applied
- none (stopping rule: passes 2 and 3 each at most one major)
### Open major (recorded, not fixed)
- [major] `src/engine/replay.test.ts` redo-tail cases / `replay.ts` `replayFrom` tail loop — every tail rejection breaks REDO_T1, the first tail move; nothing proves later tail moves are checked on the scratch left by earlier tail commits, or that a below-committed last tail element is checked at all. Mutations that check every tail move against the draft-committed scratch only, or check only committed tail moves, stay green. Proposed fix: add `§2` rejecting cases `{ ...REDO_T2, sourceCount: 2 }` in REDO_TAIL (legal after REDO_DRAFT, illegal after REDO_T1) → `r13-source-count`, and REDO_TAIL with REDO_T2 `sourceCount: 0` → `r13-source-count`.
### Default applied (technical)
- none
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- the edge-case lens's "second tail move on accumulated scratch" and the verification lens's "below-committed last tail element skipped" are one gap (the tail loop past REDO_T1, same fixture, same fix); merged into the open major above

## Result — converged after 3 passes (open major: redo-tail moves past the first are not pinned by a rejecting test; see Pass 3)

Unapplied minors (for the next build or loop):
- `replay.test.ts:304` pre-replay order test pins only seed before activeMs of the 13-code AD-7 order; extend to an adjacent-pair table or rename to claim only that pair
- `replay.test.ts` self-drop upper bound tested only at k = n + 2; add `{ ...BASE, destinationColumn: 1, destinationCount: 4 }` → `r31-destination-count`
- `replay.test.ts` no lone-QU-card (2 letters) R-36 rejecting case
- `replay.test.ts` with a redo tail present, the draft at `cursor.index` is never broken (e.g. REDO_DRAFT `targetCell: 4` → `r40-target-cell`)
- `replay.test.ts:245-249, 265` two pre-replay cases break a second check (default cursor breaks `s2-committed-prefix`; `composingBase` keeps Place fields); use cursor `{ index: 0, phase: 'idle' }` and omit the Place fields
- `index.test.ts` the type exports (Session, Move, Cursor, Phase, Reached, DestinationSide, WordCellNumber) are unpinned; add an `import type` and one `expectTypeOf` check
- `replay.test.ts:498` the 11-letter R-40 case (added in pass 1) is beyond the ticket's list; note it in the plan's Implementation Notes
