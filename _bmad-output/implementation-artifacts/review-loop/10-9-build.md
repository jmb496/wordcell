# Review loop — ticket 10.9 build (close-out documents, AGENTS pitfall and device-read fixture, code mode)
State: pass 1: done (result written)

Target: commit range `91d1f55..HEAD` (52d5aa5), the build commit only (WIP review-pass commits of this loop excluded). Staged diff: `10-9-build.passes/pass0.diff` (1159 lines).
Mode: code, quick (correctness + verification gap; fix-diff lens from pass 2), max 7. Pre-loop: HEAD 52d5aa5d54549961d6f4d3e933025caa94994c07, tree 0 fabd2e806a1a450b9f2ff97c01042a8c6a10ca36.
Intent: `_bmad-output/initiative-wordcell-v1/epic-end-of-game-words/story-close-out-documents-agents-pitfall-and-device-check-plan.md` (plus ticket `story-close-out-documents-agents-pitfall-and-device-check.md`). The ticket Notes' owner-authorised doc syncs (owner docs and the R-87 wording) are decided, not decision-needed.
Checkpoint: each pass's fixes are committed as `fix(epic-10): WIP code review pass <n> (ticket 10.9)` with this log (not `.passes/`).

## Pass 1 — 2026-10-24
Reviewers: correctness, verification gap  |  Findings: major 0 (1 reclassified to minor), minor 6, decision-needed 0  |  Dropped in triage: 1 (duplicate: rule-coverage "13 new rows" count, reported by both lenses)
Snapshot: tree 0 fabd2e806a1a450b9f2ff97c01042a8c6a10ca36 (no fix pass)
### Applied
- none (converged with zero majors; minors are not applied at convergence)
### Default applied (technical)
- none
### Decision needed (functionality / UX / gameplay)
- none (the ticket Notes' owner-authorised doc syncs and R-87 wording are decided)
### Dropped
- verification-gap × correctness duplicate: plan Close-out checklist "13 new rows F16–F23, F25–F29" vs 14 shipped — kept once (minor 3 below).
### Triage notes
- correctness [major → minor]: the plan is `built` without one green `npm run test:all` run; android `e2e/nav.spec.ts:162` (`§2 AD-13 a double tap on New game on the rejected root …`) failed once in each full android run and passed 8/8 and 5/5 alone. Verified in the plan (Verification results, Auto Run Result). Reclassified: the failing spec is pre-existing and outside this diff (same flake recorded for 10.5 in the autopilot digest, which did not recur at 10.6), every other sub-script is green, and the single `test:all` gate is the autopilot's Step D after this loop. Neither the plan nor the code in this range causes it, and there is nothing in the diff to fix. **Caller:** run `npm run test:all` as one run in Step D. If nav.spec.ts:162 fails again under full load, treat it as a reproducing failure (rule 6) and fix it before marking done.
- DESIGN.md:692 "Each word is a row of card copies … a row wider than 90 % … There is no launch row" — verified at the cited line (wording conflict only; the scaling intent matches the spine).
- AGENTS.md `--stat`: 2 insertions, 1 deletion — verified; the plan's "2 lines changed, 1 of them added" is wrong.
- Plan AC test titles `§2 long-words …` vs real `§2 won-long-words …` — verified in src/engine/serialize.test.ts.
Orchestrator verify (final state = HEAD 52d5aa5, no fix): npm test 90 files / 3597 passed; lint pass (1 pre-existing warning, e2e/end-sheet.spec.ts:845); check 0 errors.

## Result — converged after 1 pass
No fix pass ran, so there is no WIP checkpoint commit. The log is left uncommitted for the caller.

Unapplied minors (for the next build or loop):
1. Gate evidence: the plan says `built` but its `test:all` evidence is sub-scripts plus a nav.spec.ts:162 load failure. Caller Step D runs `npm run test:all` as one run (see the triage note).
2. DESIGN.md:692 Win celebration: "Each word is a row of card copies" → "Each word is a set of card copies"; "a row wider than 90 % of the band" → "a word whose row would be wider than 90 % of the band" (no launch row).
3. Plan Close-out checklist "Sync list, rule-coverage.md": "13 new rows F16–F23, F25–F29" → "14 new rows (F16 as an R-87 P6 row and an AD-19 U row, F17–F23, F25–F29)".
4. Plan Verification results: "`git diff --stat AGENTS.md`: 2 lines changed, 1 of them added" → "2 insertions, 1 deletion".
5. Plan D10: the row numbers ("rows 7–41", "row 40", "row 32 and 41") no longer match the shipped rule-coverage table (the DESIGN.md Words row is now at line 54, the screenshot row at 55). Renumber them, or mark D10 as superseded by the Implementation Notes rule-coverage map.
6. Plan Acceptance Criteria bullet 2: `§2 long-words parses…` / `§2 long-words has its defining property` → `§2 won-long-words …` (the real titles).
7. rule-coverage F29 row (R-87 ☰/`M` while the menu is already open): the P6 tests e2e/celebration.spec.ts:701/:851 do not pin that the second press lands while the deferred open is still pending. In one test, assert the menu count is 0 before the second `m`, or note on the row that the race ordering is covered only by the U test attached.test.ts:630.
