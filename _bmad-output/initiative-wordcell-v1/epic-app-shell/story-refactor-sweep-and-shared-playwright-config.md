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

Closing cleanup of epic 3: applies (or records with a reason) every Unapplied minor in _bmad-output/implementation-artifacts/review-loop/3-1-build.md through 3-11-build.md and the deferred items in the epic's plans and autopilot digest; adds playwright.base.ts holding the settings the three Playwright configs share (B11, E9), each config importing it and tsconfig.e2e.json covering it; brings the unit suite back under AD-17's 5 s budget (it is 6-7.7 s, was about 4.5 s at 3.4) without dropping coverage, recording before/after; and records two AGENTS.md updates as carry-forward rows (Owns).

Interface: New playwright.base.ts; no src/engine/index.ts export change; the AD-2 export tests keep their names and asserted export lists and stay green.

Tests: Existing suites; no new rule coverage. New, stronger or renamed tests for rows already in rule-coverage.md are allowed (e.g. 3-7 Q-38 after-own-finish, 3-6 R-76→'R-74 R-76' rename); R-, Q- and §-id names only for engine Vitest and Playwright tests, each mapping to an existing row; new or renamed shell/UI Vitest tests use AD-n names (AGENTS.md Conventions); AD-n-named shell, UI and helper tests strengthening existing behaviour are allowed and add no row. A rename keeps every id its old title carried and adds a dated correction line naming the old title to each done plan that names it; every rule-coverage.md row keeps a passing test named with its id (epic Done when 1); rule-coverage.md is edited only where a row's id or CAP changes. A new or strengthened test that fails on current code is a bug: fix it in src/ as its own plan item when that restores specified behaviour and nothing player-visible changes; else leave the test out (never skip/todo) and carry the item forward with the failing case.

Owns: B11 and the rest of epic 1 retrospective A8, the epic's deferred minors, and two AGENTS.md updates, each a carry-forward row (target: bmad-project-context refresh / Jared; AGENTS.md is not hand-edited): type exports now checked by src/architecture.test.ts (entry 1), and the nav plan's deferred fixtures-pitfall widening (history-invalid-* seeding for History-notice flows).

Inventory (the scope; the plan lists every item with one disposition: apply; no change, with reason, citing the AD, rule, §9 answer or read-only done ticket that fixes the current state (e.g. 3-6-build.md minors 6–7 "No change … as specified", done-ticket wording items); carry forward, only when someone is expected to act later, with owner/target and reason; or already resolved, citing the ticket or commit; an item in several sources is one row citing every source; a partly resolved item splits into a resolved part, cited, and a remainder with its own disposition; a minor offering two fixes takes the stronger test when it needs no done-ticket change, and an 'optionally' item is no change, with reason, unless it closes a gap the plan names):
- (a) every Unapplied minor in review-loop/3-1-build.md … 3-11-build.md;
- (b) every plan `deferred:` entry, `[defer]` row, Follow-up and Residual-risk bullet naming later work of the epic's plans;
- (c) every plan triage row (including `[reject]`) or ticket line that sends work to entry 12/CAP-11: the copied e2e helpers (tokenColor/waitForDictionary, expectAnotherWindow/kind/stored, history helpers, hitAt) are candidates for e2e/helpers/ with cases in e2e/helpers.spec.ts; Dialog copying BlockingMessage card styles (folded only if getComputedStyle of each dialog and blocking-message card root and its direct children, android and desktop, is unchanged before and after, recorded in the plan; else carried forward); the other specs' open() variants left by 3.11. A helper folds only where the copies are identical apart from names, or is parameterised so each caller keeps its exact waits and assertions (e.g. lifecycle open()'s paused clock and `kind !== 'booting'` wait vs the card-0 waits; differing stored() signatures); else it stays, with a reason; the plan maps old→new waits per moved call site;
- (d) the autopilot digest's "Worth knowing" items;
- (e) epic 1 retrospective A8's remainder: consolidating the directory walkers, and revisiting the architecture.test.ts split (3.1 added a rule);
- (f) SPEC.review-log.md Pass 3 "Minors (unapplied)" (carried by the entries; usually already resolved, citing the ticket).

Carry-forward only (AGENTS.md rule 7, Policy), recorded in the plan with their owner: items whose fix needs an edit to docs/game-flow-spec.md (§9), the spine, DESIGN.md/EXPERIENCE.md, SPEC.md or build-notes.md, or a data-rule decision, or that would change what the player sees, does or what loads (e.g. digest Q-42/AD-8/EXPERIENCE banner wording and the as-built banner hiding after a successful in-place retry; the AD-13 stale-launch edge, spine owner). Items owned by epics 4/6/7 are carried to those epics. Carried items are recorded only in this plan's carry-forward list (item / target epic or owner / reason) for the epic 3 retrospective; no other epic's files or tickets.toml are edited. Text corrections to done plans are applied as dated correction lines; rule-coverage.md (row id or CAP changes, e.g. the 3-5-build.md CAP-column fix) is the only spec companion edited in place; done ticket files stay read-only (their wording items are recorded).

playwright.base.ts: a side-effect-free module of constants exporting exactly these values: fullyParallel, forbidOnly, reporter, use.trace, the android/desktop device map, and the CI retry value used by playwright.config.ts and playwright.pwa.config.ts; pwa imports only the scalar settings (it keeps its own single PW_PREVIEW-selected project). playwright.screens.config.ts keeps `retries: 0` (AD-17); each config keeps its own baseURL, webServer, testDir/testMatch/testIgnore, expect, updateSnapshots and load-time env guards. Configs import './playwright.base'; tsconfig.e2e.json adds "playwright.base.ts" to include explicitly (the `playwright*.config.ts` glob misses it); the plan records the spine Scaffold-deltas glob wording as a spine-owner follow-up and the departure from build-notes CAP-11 (`use` narrowed to `trace` since baseURL differs; screens does not take the retry value).

Unit-suite budget (AD-17 Speed): on the WSL2 /mnt/d checkout, idle (no concurrent Playwright, Docker or build), commit recorded, one discarded warm-up, then the median Vitest Duration of 3 consecutive standalone `npm test` runs (min and max beside it), recorded before and after in the plan; the watch re-run is the median of 3 re-run Durations after touching the slowest unit test file of the 'before' run's per-file timings (the same file before and after, named in the plan) under `npm run test:watch` (AD-17: under 1 s). "Without dropping coverage": the post-change test-name list is a superset of the pre-change list (a listed rename map allowed), nothing becomes skip/todo, no assertion is removed or loosened, engine tables keep every row, and each check keeps its compiler inputs (the AD-1 globals program still compiles against the engine tsconfig's lib), except as the noLib/skipLibCheck lever allows. Levers: one shared cached ts program/compiler host for the architecture tests' type-checks (build-notes CAP-1 noLib/skipLibCheck only for the AD-2 type-export program (engine files only), never the AD-1 globals program, and only if a deliberate break, recorded in the plan, shows both tests still fail on their faults), 3-5-build.md's fsModuleCache, pool settings, and `isolate: false` only if the suite passes 3 runs with `--sequence.shuffle`, the three `--sequence.seed` values recorded in the plan. If either median misses its budget after them, cut no tests: the other inventory items and B11 still land, the plan records the medians and levers tried, plus a carry-forward row (AD-17 budget / spine owner and Jared / medians and levers tried), and is not marked built, and the build stops and reports the miss to the owner.

## Acceptance Criteria

Verify: npm run test:all and npm run test:screens are green, the three configs import playwright.base.ts, both unit-suite medians meet their budgets (AC 2), and every change maps to a named plan item: an inventory item, B11/E9, or the AD-17 budget.

- Immediately before and after the B11/E9 config step, for the comparison set (dev config; pwa with PW_PREVIEW=dist and =dist-test; screens inside the container), each with CI unset and CI=1: `playwright test --list` output is identical, and a deep diff of each config's resolved default export (including projects[].use) is empty, recorded in the plan. Final state: each list equals its list at the ticket's start commit plus the plan's listed additions under its rename map, nothing removed.
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
