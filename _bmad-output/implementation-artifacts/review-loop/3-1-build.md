# Review loop — ticket 3.1 build (code, ad5ed00..81487f6)
State: pass 1: done

Target: code diff ad5ed00..81487f6 (excluding `_bmad-output/`), staged at `3-1-build.passes/pass0.diff`.
Intent: `_bmad-output/initiative-wordcell-v1/epic-app-shell/story-engine-carry-ins-and-d1-export-removal-plan.md`.
Pre-loop: HEAD 81487f6879a5464e11d2ee4791ba60060ce2470f, tree snapshot 0 5f74c5b3289cf5eed610e8139b92235b1d5d2a09.
Depth: thorough, max 7.

## Pass 1 — 2026-09-30
Reviewers: correctness, edge cases, verification gap, intent alignment  |  Findings: major 0, minor 5, decision-needed 0  |  Dropped in triage: 0
Snapshot: tree 5f74c5b3289cf5eed610e8139b92235b1d5d2a09 (no fix pass)
### Applied
- none (converged; no fix pass)
### Default applied (technical)
- none
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none

## Result — converged after 1 pass

Final state (HEAD 81487f6, unchanged): `npm test` pass (1408 tests, 22 files, 2.76 s), `npm run lint` pass, `npm run check` pass (0 errors, 0 warnings).

Unapplied minors (for the next build or loop):
1. `src/architecture.test.ts:861-950` (AD-1 layer-scan synthetic sources) — the samples still import `Card` and call `deal` from the engine index, which no longer exports them; the scan checks paths only, so the result is unchanged. Proposed: switch to still-exported names (`CardId`, `createSession`) for readability.
2. `src/architecture.test.ts` 'AD-17 the valid fixtures/session-*.json files are exactly the nine rebuilt ones' — a valid fixture named outside `session-*.json` (e.g. `session.json`), or an invalid one with a typo in its name, escapes the check or gets counted wrongly. Proposed: optionally assert that every `fixtures/*.json` name is either `*-invalid-*`, `history-three-records.json` or in the nine-name list.
3. Same test plus `serialize.test.ts` REBUILDS — the name list is not linked to REBUILDS, so "a new valid fixture fails here until its rebuild case is added" holds only if the builder updates both lists. Proposed: in serialize.test.ts, assert that the REBUILDS names match the file's VALID list, and reword the comment.
4. `src/engine/history.test.ts` 'R-76 R-84 accrue between a finish and its un-finish …' — there is no index-0 give-up pair (`GAVE_UP0`); the ticket minimum is already met. Proposed: optionally add the pair.
5. `src/engine/commands.test.ts:688` row id `R-38 R-36` vs the ticket's `R-36 R-38` — the deviation is intended (plan Design Notes). Proposed: keep the code and add the ticket wording to the plan's spec-owner follow-ups.
