# Review log — story-refactor-sweep-and-shared-playwright-config.md (ticket 3.12)

State: pass 2: done

Mode: docs, thorough, max 7, budget 1500 words. Pass 0: HEAD d74ceb0, copy story-refactor-sweep-and-shared-playwright-config.passes/pass0.md, 188 words.
Intent carried from tickets.toml entry 12 (not copied by the pull): interface, tests, owns; pass-1 fixer adds them to Description as 'Interface:', 'Tests:', 'Owns:'.

## Pass 1 — 2026-10-01
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 8, minor 4, decision-needed 0  |  Dropped in triage: 0 (about 20 duplicates merged)
Words (docs): 773 (4.1 x pass 0)  |  Snapshot: story-refactor-sweep-and-shared-playwright-config.passes/pass1.md
Fixer: applied 1–12; ran `playwright test --list` (dev 332 tests/13 files; pwa dist 13/4, dist-test 12/4; screens throws outside container as expected); import './playwright.base' unverified (file not yet created)
### Applied
- [major] Description / tickets.toml entry 12 — interface, tests, owns fields missing ('no src/ export change', 'no new rule coverage') → fixer item 1
- [major] Notes — stale open question 'Scope is unknown' (3.1–3.11 done) → fixer item 2
- [major] Description / build-notes CAP-11, AD-17 — base contents undefined; retries (screens 0) and baseURL (pwa 4173) differ between configs → fixer item 3
- [major] Description — inventory sources undefined: plan `deferred:`, `[defer]`, Follow-ups, `[reject]` rows sending duplication to entry 12/CAP-11 (shared e2e helpers, Dialog/BlockingMessage styles, open() variants); no disposition classes → fixer item 4
- [major] Description / AGENTS.md rule 7, Policy — owner/spine-owned, other-epic and behaviour-changing items (digest Q-42/AD-8/EXPERIENCE, AD-13, 3-2 #4) not separated from applicable items; done ticket/plan text edits unruled → fixer item 5
- [major] Description, AC / AD-17 Speed — 5 s measurement not reproducible (cold vs warm, 4.5–7.7 s); 'without dropping coverage' undefined; no outcome if unreachable → fixer item 6
- [major] Description vs entry-12 tests — minors add/rename id-named tests vs 'no new rule coverage' → fixer item 7
- [major] AC — test:screens may pass by regenerating baselines; style fold could change pixels → fixer item 8
- [minor] References — only parent listed → fixer item 9
- [minor] AC — 'every change maps to a deferred finding' excludes B11/E9 and the speed item → fixer item 10
- [minor] Description — tsconfig.e2e.json include glob does not match playwright.base.ts; import specifier; base side-effect-free; spine Scaffold-deltas glob → fixer item 11
- [minor] Description — second deferred AGENTS.md pitfall (nav plan: history-invalid-* fixtures) not recorded; managed block not hand-edited → fixer item 12
### Default applied (technical)
- base = values identical in all three configs (fullyParallel, forbidOnly, reporter, use.trace, android/desktop device map, CI retry value); screens overrides retries 0; each config keeps baseURL, webServer, testDir/match, expect, updateSnapshots, env guards; `playwright test --list` per config unchanged
- dispositions: apply / carry forward (owner, spine owner, epics 4/6/7) / already resolved (cite commit); behaviour-changing → record-only
- timing: one discarded warm-up, median of 3 standalone `npm test` Duration lines on /mnt/d; coverage = test names superset, none skipped; levers build-notes CAP-1 noLib/skipLibCheck, fsModuleCache; else stop and report
- done plans and rule-coverage.md CAP column: dated correction lines; done ticket files read-only
- screens: committed baselines unchanged
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none (duplicates merged)

## Pass 2 — 2026-10-01
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 5, minor 9, decision-needed 0  |  Dropped in triage: 0 (about 10 duplicates merged)
Words (docs): 1048 (5.6 x pass 0)  |  Snapshot: story-refactor-sweep-and-shared-playwright-config.passes/pass2.md
Fixer: applied 1–14; ran `--list --reporter=json` (config has webServer and per-project retries, no baseURL → baseURL compared in source); `vitest run --sequence.shuffle` ran; pwa/screens JSON unverified (env guard, container)
### Applied
- [major] AC bullet 1 — `--list` identical before/after contradicts allowed additions, renames and helpers.spec.ts cases → fixer item 1
- [major] Tests vs Carry-forward — rename 'updates every reference in the plans' vs dated correction lines in done plans → fixer item 2
- [major] AC bullet 3 / Inventory (c) — only screens spec is the placeholder board; Dialog/BlockingMessage style fold gate untestable → fixer item 3
- [major] Unit-suite budget vs AC — outcome of a budget miss (rest of sweep, plan status) undefined → fixer item 4
- [major] Tests — AD-n shell/UI/helper tests that are not rule-coverage rows (3-7 history-invalid rows, 3-5 ErrorEvent, helpers.spec.ts cases) not ruled → fixer item 5
- [minor] Carry-forward — destination of epic 4/6/7 items → fixer item 6
- [minor] playwright.base.ts — 'identical across configs' contradicts listed retry value and device map (pwa has its own single project); departure from build-notes CAP-11 not recorded → fixer item 7
- [minor] Inventory (c) — open() variants were left by 3.11, not 3.10 → fixer item 8
- [minor] Levers — isolate:false may leak shell module state → fixer item 9
- [minor] Inventory — duplicate or partly resolved items → fixer item 10
- [minor] AC bullet 2 — watch re-run < 1 s not gated/measured → fixer item 11
- [minor] AC bullet 1 — comparison set (pwa per PW_PREVIEW mode) and effective-config method → fixer item 12
- [minor] Inventory (b) — plan Residual risks naming later work → fixer item 13
- [minor] Budget — record min/max beside median → fixer item 14
### Default applied (technical)
- `--list` identity gates only the B11/E9 config step; final list = before list + plan's additions under the rename map
- renames: rule-coverage.md in place; done plans get a dated correction line
- style fold applies only if getComputedStyle of both cards is unchanged, recorded in the plan; else carried forward
- budget miss: other items land; plan not marked built; stop and report with medians and levers tried
- AD-n shell/UI/helper tests allowed with no rule-coverage row; any new R/Q/§-named test maps to an existing row
- carry-forward lives only in this plan's table (item / target / reason); no other epic's files edited
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none (duplicates merged)
