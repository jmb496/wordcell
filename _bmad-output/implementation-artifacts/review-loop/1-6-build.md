# Review log — ticket 1.6 build (code mode)

Target: diff `9bd182e..33936ce` of ticket 1.6 (build commit `33936ce`). Intent: the ticket
plan `story-size-budget-postbuild-gate-plan.md` and its ticket. Refs: ARCHITECTURE-SPINE.md
(AD-8, AD-15, AD-17, AD-18, Scaffold deltas), epic file, AGENTS.md, CLAUDE.md, game-flow-spec.md,
requirements-carryover.md. Rules: thorough, cap 7; technical choices take defaults.

## Pass 1 — 2026-09-28 07:27
Reviewers: correctness, edge cases, verification gap, intent alignment  |  Findings: major 0, minor 4, decision-needed 0  |  Dropped in triage: 3 (duplicates)
### Applied
- none (zero majors; the stopping rule ends the loop before a fixer runs)
### Minor (recorded, not applied)
- plan Implementation Notes "Files" (line 74) — says the CLI case runs 7 child processes; the test's `Promise.all` spawns 8, and Auto Run Result (line 150) says 8. The "24 computeBudget/AD-16" breakdown should read 24 AD-18 + 4 AD-16 + 1 CLI.
- plan "Watch re-run (AD-17)" (line 93) — the earlier over-1 s paragraph still says "Needs an owner/gate decision" beside the re-measure (line 95) that supersedes it; a gate reader sees two verdicts. Suggest cutting it to one line marked superseded. The re-measure also used a file filter and `interval: 100`, unlike ticket 1.2's baseline.
- `scripts/size-budget.mjs:175` — gzip level 9 is correct, but no test pins it: the tiny fixtures give the same gzip length at levels 1, 6 and 9. The plan lists this under residual risks.
- `scripts/size-budget.mjs` default `dist` path — the no-argument, repo-root-relative default is not exercised by any test. Only review and `npm run build` cover it.
### Default applied (technical)
- none
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- 3 duplicate reports of the 7-vs-8 child-process count and the superseded watch paragraph (the edge-case, verification-gap and intent lenses repeated the correctness lens's finding)

Verification: `npm test` 309 passed, `npm run lint` clean, `npm run check` 0 errors on the unchanged tree. No Playwright run was needed because no code changed; ports 5173/4173 were free.

## Result — converged after 1 pass
