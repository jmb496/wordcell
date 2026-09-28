# Review log — ticket 1.7 build (code mode)

Target: diff `46dd98b..c3aad07` of ticket 1.7 (build commit `c3aad07`). Intent: the ticket
plan `story-screenshot-pipeline-in-the-playwright-container-plan.md` and its ticket. Refs: ARCHITECTURE-SPINE.md
(AD-15, AD-17, Scaffold deltas), epic file, AGENTS.md, CLAUDE.md, game-flow-spec.md,
requirements-carryover.md. Rules: thorough, cap 7; technical choices take defaults.

## Pass 1 — 2026-09-28 08:24
Reviewers: correctness, edge cases, verification gap, intent alignment  |  Findings: major 0, minor 3, decision-needed 0  |  Dropped in triage: 0
### Applied
- none (there were zero majors, so the stopping rule ended the loop before a fixer ran)
### Minor (recorded, not applied)
- plan step 9 (tamper run) / `playwright.screens.config.ts` `maxDiffPixelRatio` — the only negative check is a size mismatch, and Playwright rejects that before comparing any pixels. Nothing shows that a same-size pixel regression above 0.01 fails the run. Suggestion for later pipeline tickets: tamper with a same-size, recoloured copy.
- `playwright.screens.config.ts` `updateSnapshots: process.env.CI ? 'none' : 'missing'` — no run checks the CI branch, because every run had CI unset. Suggestion: ticket 8 (CI workflow) should verify that a CI=1 run with a missing baseline exits non-zero and writes no baseline.
- ticket Verify steps 5/12 — the pathspec `':!_bmad-output'` fails on git 2.43.0. The build used `':(exclude)_bmad-output'`. The plan already defers this; the ticket text still has the broken form.
### Default applied (technical)
- none
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none

Verification: `npm test` 309 passed, `npm run lint` clean (50 files), `npm run check` 0 errors on the unchanged tree. No code changed, so no Playwright or `test:screens` run was needed. Ports 5173/4173 were free.

## Result — converged after 1 pass
