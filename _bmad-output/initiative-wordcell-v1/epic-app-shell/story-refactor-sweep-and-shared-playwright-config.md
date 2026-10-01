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

Tests: Existing suites; no new rule coverage. New, stronger or renamed tests for rows already in rule-coverage.md are allowed (e.g. 3-7 Q-38 after-own-finish, 3-6 R-76→R-74 rename); any new test named with an R-, Q- or §-id maps to an existing row; AD-n-named shell, UI and helper tests strengthening existing behaviour are allowed and add no row. A rename updates rule-coverage.md in place and adds a dated correction line naming the old title to each done plan.

Owns: B11, the epic's deferred minors, and recording in its plan the AGENTS.md pitfall update (type exports now checked, entry 1) for a bmad-project-context refresh.

Inventory (the scope; the plan lists every item with one disposition: apply; carry forward, with owner/target and reason; or already resolved, citing the ticket or commit; an item in several sources is one row citing every source; a partly resolved item splits into a resolved part, cited, and a remainder with its own disposition):
- (a) every Unapplied minor in review-loop/3-1-build.md … 3-11-build.md;
- (b) every plan `deferred:` entry, `[defer]` row, Follow-up and Residual-risk bullet naming later work of the epic's plans;
- (c) every plan triage row (including `[reject]`) or ticket line that sends work to entry 12/CAP-11: the copied e2e helpers (tokenColor/waitForDictionary, expectAnotherWindow/kind/stored, history helpers, hitAt) move to e2e/helpers/ with cases in e2e/helpers.spec.ts; Dialog copying BlockingMessage card styles (folded only if the dialog and blocking-message cards' getComputedStyle values are unchanged before and after, recorded in the plan; else carried forward); the other specs' open() variants left by 3.11;
- (d) the autopilot digest's "Worth knowing" items.

Carry-forward only (AGENTS.md rule 7, Policy), recorded in the plan with their owner: items whose fix needs an edit to docs/game-flow-spec.md (§9), the spine, DESIGN.md/EXPERIENCE.md, the epic SPEC's owner wording or a data-rule decision, or that would change what the player sees, does or what loads (e.g. 3-2-build.md item 4; digest Q-42/AD-8/EXPERIENCE banner wording; the AD-13 stale-launch edge, spine owner). Items owned by epics 4/6/7 are carried to those epics. Carried items are recorded only in this plan's carry-forward list (item / target epic or owner / reason) for the epic 3 retrospective; no other epic's files or tickets.toml are edited. Text corrections to done plans and the factual rule-coverage.md CAP-column fix (3-5-build.md) are applied as dated correction lines; done ticket files stay read-only (their wording items are recorded).

playwright.base.ts: a side-effect-free module of constants exporting values shared by at least two configs, each config using or overriding them: fullyParallel, forbidOnly, reporter, use.trace, the android/desktop device map (pwa keeps its own single PW_PREVIEW-selected project), and the CI retry value used by playwright.config.ts and playwright.pwa.config.ts. playwright.screens.config.ts keeps `retries: 0` (AD-17); each config keeps its own baseURL, webServer, testDir/testMatch/testIgnore, expect, updateSnapshots and load-time env guards. Configs import './playwright.base'; tsconfig.e2e.json adds "playwright.base.ts" to include explicitly (the `playwright*.config.ts` glob misses it); the plan records the spine Scaffold-deltas glob wording as a spine-owner follow-up and the departure from build-notes CAP-11 (`use` narrowed to `trace` since baseURL differs; screens does not take the retry value).

Unit-suite budget (AD-17 Speed): on the WSL2 /mnt/d checkout, one discarded warm-up, then the median Vitest Duration of 3 consecutive standalone `npm test` runs (min and max beside it), recorded before and after in the plan; the watch re-run is the median of 3 re-run Durations after touching one engine test file under `npm run test:watch` (AD-17: under 1 s). "Without dropping coverage": the post-change test-name list is a superset of the pre-change list (a listed rename map allowed), nothing becomes skip/todo, engine tables keep every row. Levers: build-notes CAP-1 noLib/skipLibCheck for the type-export check, 3-5-build.md's fsModuleCache, pool settings, and `isolate: false` only if the suite passes 3 runs with `--sequence.shuffle`, recorded in the plan. If either median misses its budget after them, cut no tests: the other inventory items and B11 still land, the plan records the medians and levers tried and is not marked built, and the build stops and reports the miss.

The plan also records the nav plan's deferred AGENTS.md fixtures-pitfall widening (history-invalid-* seeding for History-notice flows) for the same bmad-project-context refresh; AGENTS.md is not hand-edited.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green, the three configs import playwright.base.ts, the unit suite Duration is under 5 s on the dev machine, and every change maps to a named plan item: an inventory item, B11/E9, or the AD-17 budget.

- Immediately before and after the B11/E9 config step, `playwright test --list` output is identical for the dev config, pwa with PW_PREVIEW=dist and =dist-test, and screens inside the container; effective retries and webServer (the `config` object of `--reporter=json`) and baseURL (not in that object; compared in source) are unchanged. Final state: each list equals its starting list plus the plan's listed additions under its rename map, nothing removed.
- On the success path the unit-suite median (Description) is < 5 s and the watch re-run median < 1 s, before/after in the plan; a miss follows the Description's miss rule.
- test:screens passes against the committed baselines with no baseline file added, removed or changed; a style fold that changes pixels or computed styles is a player-visible change and is carried forward, not applied.

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
