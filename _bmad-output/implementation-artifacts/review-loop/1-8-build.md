# Review log — ticket 1.8 build (code mode)

Target: diff `21d7b80..ad44742` of ticket 1.8 (build commit `ad44742`, `.github/workflows/ci.yml` plus the plan). Intent: the ticket
plan `story-ci-workflow-plan.md` and its ticket `story-ci-workflow.md`. Refs: ARCHITECTURE-SPINE.md
(AD-15, AD-17, AD-18, Scaffold deltas), epic file, AGENTS.md, CLAUDE.md, game-flow-spec.md,
requirements-carryover.md. Rules: thorough, cap 7; technical choices take defaults.

## Pass 1 — 2026-09-28 11:45
Reviewers: correctness, edge cases, verification gap, intent alignment  |  Findings: major 0, minor 2, decision-needed 0  |  Dropped in triage: 0
### Applied
- none (there were zero majors, so the stopping rule ended the loop before a fixer ran)
### Minor (recorded, not applied)
- ticket Build notes "Flaky report" / Verify step 7 — the Build notes say the padded double-backtick code span keeps single backticks in test titles intact, but no Verify 7 case (a)–(k) uses a title with a backtick. Suggestion: add a backtick to the retitled (b) fixture, or drop that rationale from the ticket.
- `ci.yml` `upload test-results` steps (`if: failure()`) and the flaky report's `failure` branch — no GitHub run exercises these failure paths. Gate 4 only expects a green first run, and local Verify 7 feeds simulated `OUTCOME_*` strings. Suggestion: record this in the plan's Residual risks, or add a throwaway failing-branch push to gate 4.
### Default applied (technical)
- none
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none

Verification: `npm test` 309 passed, `npm run lint` clean (50 files), `npm run check` 0 errors on the unchanged tree. actionlint (`rhysd/actionlint:latest` in Docker) exited 0 on `.github/workflows/ci.yml`. No code changed, so no Playwright or `test:screens` run was needed and no servers were started.

## Result — converged after 1 pass
