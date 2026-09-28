# Review log — ticket 1.3 build (code mode)

Target: diff `36a8658..working tree` of ticket 1.3 (build commit `71741b6`). Intent: the ticket
plan `story-test-harness-playwright-configs-test-hook-and-helpers-plan.md` and its ticket. Refs:
ARCHITECTURE-SPINE.md (AD-15, AD-16, AD-17, Scaffold deltas), epic file, AGENTS.md, CLAUDE.md,
game-flow-spec.md, requirements-carryover.md. Rules: thorough, cap 7; technical choices take
defaults.

## Pass 1 — 2026-09-28 01:00
Reviewers: correctness, edge cases, verification gap, intent alignment  |  Findings: major 1, minor 0, decision-needed 0  |  Dropped in triage: 0
### Applied
- [major] `e2e/helpers.spec.ts` seed call-rule cases (g) — the ticket's "only a call that passes validation tracks it" and guard check order (`no keys` → `already called` → `about:blank`) had no test; each case hit one guard on a fresh page → four `AD-17` tests added (failed validation leaves the page untracked; `no keys` before `already called`; `already called` before `about:blank` for `seedStorage` and `captureBoot`); plan Seeding row mapped (13 → 17 tests). `seed.ts` unchanged (already conforms).
### Default applied (technical)
- none
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none

Verification: `npm test` 266 passed, lint clean, check 0 errors; `npx playwright test e2e/helpers.spec.ts` 22 passed (android), 22 skipped (desktop, by design); ports 5173/4173 free before the run.

## Pass 2 — 2026-09-28 01:20
Reviewers: correctness, edge cases, verification gap, intent alignment  |  Findings: major 1, minor 2, decision-needed 0  |  Dropped in triage: 3 (2 duplicates, 1 out of scope) + 1 accepted as-is
### Applied
- [major] plan Implementation Notes > Evidence and Auto Run Result > Verification — recorded Playwright counts predated pass 1's four seed tests → `test:all` re-run on the final tree (exit 0); evidence updated to `test:e2e` 26 passed / 22 skipped and `--list` 48 tests in 3 files (`test:e2e:pwa` still 2 passed).
- [minor] `e2e/helpers.spec.ts` 'AD-17 seedStorage with captureBoot records the boot values on every load' — reload value never changed, so live capture vs echoed seed was indistinguishable → writes `session` = 'b' before reload and expects 'b'.
### Default applied (technical)
- none
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- Stale-count finding from verification-gap and intent-alignment lenses — duplicates of the correctness lens's finding.
- `package.json` `build` → `VITE_TEST_HOOKS= vite build` — the ticket fixes exact script text and does not own `build`; the hook-absence proof is AD-18 `test:e2e:dist` (entry 8 CI builds in a clean environment). Noted for entry 8.
- `seed.ts` `track()` about:blank guard misses an un-awaited `goto` — needs a caller mistake; reviewer's own default was to accept it. No change.

Verification: `npm test` 266 passed, lint clean, check 0 errors; `npm run test:all` exit 0 (fixer run; ports free).

## Pass 3 — 2026-09-28 01:35
Reviewers: correctness, edge cases, verification gap, intent alignment  |  Findings: major 1, minor 1 (+1 follow-on), decision-needed 0  |  Dropped in triage: 2 (duplicates)
### Applied
- [major] `e2e/helpers.spec.ts` seed case (c) — pass 2's edit departed from the ticket's verbatim (c) ("records 'a' … again after reload") without a plan record (reviewers split between revert and document) → (c) restored to the ticket text; the live-capture check kept as a separate test 'AD-17 seedStorage with captureBoot records live values after reload', recorded in the plan's Seeding row (17 → 18) and 'Implementation choices within the ticket'.
- [minor] `e2e/helpers.spec.ts` 'AD-17 longPress holds a touch pointer for at least ms' — landing point unchecked → pointerdown/pointerup within 1 CSS px of the target, as in the touchDrag test.
- [follow-on] plan evidence counts → `test:e2e` 27 passed / 23 skipped; `--list` 50 tests in 3 files.
### Default applied (technical)
- seed case (c) conflict — keep the ticket's (c) verbatim and add the stronger check as an extra test (rather than silently rewriting (c) or dropping the check).
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- Case (c) findings from the edge-case and intent-alignment lenses — duplicates of the correctness lens's finding.

Verification: `npm test` 266 passed, lint clean, check 0 errors; `npm run test:all` exit 0 (fixer run; ports free).

## Pass 4 — 2026-09-28 01:50
Reviewers: correctness, edge cases, verification gap, intent alignment  |  Findings: major 0, minor 5, decision-needed 0  |  Dropped in triage: 0
### Applied
- none (zero majors; stopping rule met)
### Not applied (minor, left for the owner or a later ticket)
- plan 'Implementation choices within the ticket' — pass 3's longPress within-1-CSS-px landing check is not recorded there (ticket lists it only for touchDrag).
- `e2e/helpers.spec.ts` hidePage/showPage — no reload-after-hide check that the override ends at the next navigation.
- `e2e/helpers.spec.ts` seed case (a) — no check that `window.__wordcellBoot` stays unset without `captureBoot: true`.
- `e2e/helpers.spec.ts` touchDrag — intermediate touchmoves not checked to lie between `from` and `to`.
- `e2e/pwa/dist-smoke.spec.ts` — 52-card count does not check the ids are exactly 0–51 and distinct.
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none

Final verification (orchestrator): ports 5173/4173 free; `npm run test:all` exit 0 — lint clean, check 0 errors, Vitest 266 passed, `test:e2e` 27 passed / 23 skipped, `test:e2e:pwa` 2 passed.

## Result — converged after 4 passes
