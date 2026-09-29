# Review loop — ticket 2.7 build (code mode)
State: pass 1: done

Target: `0d3c9de..HEAD` (commit efbf06f), diff at `2-7-build.passes/pass0.diff` (git-ignored)
Intent: `_bmad-output/initiative-wordcell-v1/epic-rules-engine/story-scoring-penalty-and-bands-plan.md`
Depth: quick (correctness, verification gap), max 7
Pre-loop: HEAD efbf06f, tree snapshot 0 1826ec2667db6cca906a1e5691982545494cd427

## Pass 1 — 2026-09-29
Reviewers: correctness, verification gap  |  Findings: major 0, minor 2, decision-needed 0  |  Dropped in triage: 0
Snapshot: tree 1826ec2667db6cca906a1e5691982545494cd427 (no fix pass)
### Applied
- none (zero majors; stopping rule met before fix)
### Default applied (technical)
- none
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none

## Result — converged after 1 pass
Final state: `npm test` pass (704 tests), `npm run lint` pass, `npm run check` pass.

Unapplied minors:
- `src/engine/scoring.test.ts:93-97` — the R-83 synthetic-language test also asserts `lettersLeft` (an R-81 sentence); move those two assertions into their own `R-81 …` test.
- `src/engine/scoring.test.ts` R-80/R-81 tests — no test proves `liveScore`/`penalty` read the `lang` argument's letter values (only `lettersLeft` and `band` run under the synthetic language); add e.g. `liveScore(cellsWith({10:[Z]}), synthetic) === 20` and `penalty(z, synthetic) === 20`.
