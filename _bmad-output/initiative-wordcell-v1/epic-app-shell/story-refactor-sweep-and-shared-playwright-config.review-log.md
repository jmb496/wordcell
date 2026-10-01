# Review log — story-refactor-sweep-and-shared-playwright-config.md (ticket 3.12)

State: pass 1: done

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
