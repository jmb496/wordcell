---
id: 12
type: story
title: "Refactor sweep and shared Playwright config"
parent: epic-app-shell
covers: [CAP-11]
after: [2, 11]
risk: low
---

# Refactor sweep and shared Playwright config

## Description

Closing cleanup of epic 3: applies (or records with a reason) every Unapplied minor in _bmad-output/implementation-artifacts/review-loop/3-1-build.md through 3-11-build.md and the deferred items in the epic's plans and autopilot digest; adds playwright.base.ts holding the settings the three Playwright configs share (B11, E9), each config importing it and tsconfig.e2e.json covering it; brings the unit suite back under AD-17's 5 s budget (it is 6-7.7 s, was 4.7 s at 3.4) without dropping coverage, recording before/after; and records in its plan the AGENTS.md pitfall update (type exports are now checked by src/architecture.test.ts since 3.1) for a later bmad-project-context refresh.

Interface: New playwright.base.ts; no src/ export change; the AD-2 export tests stay green unchanged.

Tests: Existing suites; no new rule coverage. New, stronger or renamed tests for rows already in rule-coverage.md are allowed (e.g. 3-7 Q-38 after-own-finish, 3-6 R-76→R-74 rename); no new rule-coverage.md rows; a rename updates every reference to its old name in rule-coverage.md and the plans.

Owns: B11, the epic's deferred minors, and recording in its plan the AGENTS.md pitfall update (type exports now checked, entry 1) for a bmad-project-context refresh.

Inventory (the scope; the plan lists every item with one disposition: apply; carry forward, with owner/target and reason; or already resolved, citing the ticket or commit):
- (a) every Unapplied minor in review-loop/3-1-build.md … 3-11-build.md;
- (b) every plan `deferred:` entry, `[defer]` row and Follow-up of the epic's plans;
- (c) every plan triage row (including `[reject]`) or ticket line that sends work to entry 12/CAP-11: the copied e2e helpers (tokenColor/waitForDictionary, expectAnotherWindow/kind/stored, history helpers, hitAt) move to e2e/helpers/ with cases in e2e/helpers.spec.ts; Dialog copying BlockingMessage card styles; the other specs' open() variants left by 3.10;
- (d) the autopilot digest's "Worth knowing" items.

Carry-forward only (AGENTS.md rule 7, Policy), recorded in the plan with their owner: items whose fix needs an edit to docs/game-flow-spec.md (§9), the spine, DESIGN.md/EXPERIENCE.md, the epic SPEC's owner wording or a data-rule decision, or that would change what the player sees, does or what loads (e.g. 3-2-build.md item 4; digest Q-42/AD-8/EXPERIENCE banner wording; the AD-13 stale-launch edge, spine owner). Items owned by epics 4/6/7 are carried to those epics. Text corrections to done plans and the factual rule-coverage.md CAP-column fix (3-5-build.md) are applied as dated correction lines; done ticket files stay read-only (their wording items are recorded).

playwright.base.ts: a side-effect-free module of constants exporting only values identical across configs: fullyParallel, forbidOnly, reporter, use.trace, the android/desktop device map, and the CI retry value used by playwright.config.ts and playwright.pwa.config.ts. playwright.screens.config.ts keeps `retries: 0` (AD-17); each config keeps its own baseURL, webServer, testDir/testMatch/testIgnore, expect, updateSnapshots and load-time env guards. Configs import './playwright.base'; tsconfig.e2e.json adds "playwright.base.ts" to include explicitly (the `playwright*.config.ts` glob misses it); the plan records the spine Scaffold-deltas glob wording as a spine-owner follow-up.

Unit-suite budget (AD-17 Speed): on the WSL2 /mnt/d checkout, one discarded warm-up, then the median Vitest Duration of 3 consecutive standalone `npm test` runs, recorded before and after in the plan with the watch re-run time (AD-17: under 1 s). "Without dropping coverage": the post-change test-name list is a superset of the pre-change list (a listed rename map allowed), nothing becomes skip/todo, engine tables keep every row. Levers: build-notes CAP-1 noLib/skipLibCheck for the type-export check, 3-5-build.md's fsModuleCache, pool/isolate settings. If the median stays ≥ 5 s after them, stop and report rather than cut tests.

The plan also records the nav plan's deferred AGENTS.md fixtures-pitfall widening (history-invalid-* seeding for History-notice flows) for the same bmad-project-context refresh; AGENTS.md is not hand-edited.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green, the three configs import playwright.base.ts, the unit suite Duration is under 5 s on the dev machine, and every change maps to a named plan item: an inventory item, B11/E9, or the AD-17 budget.

- Each config's `playwright test --list` output is identical before and after (screens inside the container), and the effective retries/baseURL/webServer are unchanged.
- The unit-suite median (Description) is < 5 s, with the before/after and watch re-run times in the plan.
- test:screens passes against the committed baselines with no baseline file added, removed or changed; a style fold that changes pixels is a player-visible change and is carried forward, not applied.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-app-shell/epic-app-shell.md
- _bmad-output/specs/spec-epic-3-app-shell/SPEC.md — CAP-11, E9
- _bmad-output/specs/spec-epic-3-app-shell/build-notes.md — CAP-11, CAP-1
- _bmad-output/specs/spec-epic-3-app-shell/rule-coverage.md
- _bmad-output/planning-artifacts/architecture/architecture-wordcell-2026-09-27/ARCHITECTURE-SPINE.md — AD-17, Scaffold deltas
- _bmad-output/implementation-artifacts/review-loop/3-1-build.md … 3-11-build.md
- _bmad-output/initiative-wordcell-v1/epic-app-shell/*-plan.md
- _bmad-output/implementation-artifacts/autopilot/epic-app-shell-20260930-0915.md

## Notes

- Scope resolved (3.1–3.11 done): it is the Inventory sources named in the Description.
