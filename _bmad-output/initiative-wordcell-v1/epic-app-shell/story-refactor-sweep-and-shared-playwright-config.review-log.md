# Review log — story-refactor-sweep-and-shared-playwright-config.md (ticket 3.12)

State: pass 7: done

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

## Pass 3 — 2026-10-01
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 4, minor 12, decision-needed 0  |  Dropped in triage: 0 (about 6 duplicates merged)
Words (docs): 1325 (7.0 x pass 0)  |  Snapshot: story-refactor-sweep-and-shared-playwright-config.passes/pass3.md
Fixer: applied 1–16; 3-2 #4 moved from carry-forward examples to 'no change' (item 2); ran node import + deep diff of playwright.config.ts CI unset vs CI=1 (forbidOnly/retries/reporter differ, observable), pwa dist import ok; unverified: CI=1 --list, in-container screens diff, watch timing method, --sequence.seed recording
### Applied
- [major] AC bullet 1 — effective-config gate misses use/trace/reporter/fullyParallel and the CI branch (all CI-conditional) → fixer item 1
- [major] Inventory dispositions — no class for 'no change, as specified' items (3-6 minors 6–7, 3-2 #4) or read-only done-ticket wording → fixer item 2
- [major] Inventory (c) — no equivalence rule for folding helper copies; open()/stored() variants wait and assert differently → fixer item 3
- [major] Interface vs Levers / coverage definition — noLib lever edits the AD-2 type-export program and would make the AD-1 globals check vacuous; coverage defined by names only → fixer item 4
- [minor] Watch re-run file unnamed (gameable) → fixer item 5
- [minor] playwright.base.ts — 'at least two configs' contradicts keep-own list (dev/screens share baseURL, expect, webServer) → 'exactly these values' → fixer item 6
- [minor] Tests — correction line 'to each done plan' → 'each done plan that names the old title' → fixer item 7
- [minor] rule-coverage.md edit mode inconsistent (rename in place vs CAP fix as dated line) → fixer item 8
- [minor] Budget miss → carry-forward row to the owner (AD-17 is spine) → fixer item 9
- [minor] '4.7 s at 3.4' does not match recorded 4.53–4.58 s → fixer item 10
- [minor] Digest 3.9 banner hide-on-successful-retry behaviour missing from owner carry-forward example → fixer item 11
- [minor] isolate:false shuffle seeds unrecorded → fixer item 12
- [minor] Tests — shell/UI Vitest names AD-n only (AGENTS.md Conventions) → fixer item 13
- [minor] Owns B11 — epic 1 retro A8 also deferred directory-walker consolidation and an architecture.test.ts split review → fixer item 14
- [minor] Measurement conditions (idle machine) and computed-style comparison scope → fixer item 15
- [minor] Watch re-run method and in-container screens JSON comparison not run → mark unverified in the plan record, not the ticket (fixer item 16)
### Default applied (technical)
- config gate: deep-diff each config's resolved default export (incl. projects[].use) with CI unset and CI=1, per comparison set; empty diff recorded
- fourth disposition 'no change, with reason' (cite AD/rule/§9 or read-only ticket)
- helper fold: identical bodies only, or parameterised preserving each caller's waits; the plan maps old→new waits per call site
- coverage: no assertion removed or loosened, checks keep their compiler inputs; default type-check lever a shared cached ts program; noLib only if a deliberate break shows both tests still fail
- watch file: slowest engine test file from the before run, same file before/after
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none (duplicates merged)

## Pass 4 — 2026-10-01
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 3, minor 10, decision-needed 0  |  Dropped in triage: 2
Words (docs): 1446 (7.7 x pass 0)  |  Snapshot: story-refactor-sweep-and-shared-playwright-config.passes/pass4.md
Fixer: applied 1–13; Carry-forward rule-coverage.md sentence aligned with item 3; fixtures-pitfall paragraph folded into Owns; no commands changed
### Applied
- [major] Unit-suite budget — 'each check keeps its compiler inputs' contradicts the noLib lever (coverage contract) → fixer item 1
- [major] Tests / Inventory (a) — no rule for a strengthened test that fails on current code (src fix vs carry forward) → fixer item 2
- [major] Tests rename rule — rule-coverage.md rows carry ids not titles; a rename (3-6 R-76→R-74) can drop the R-76 test the epic's Done when 1 needs → fixer item 3
- [minor] 3-2-build.md item 4 listed as 'no change' but its 3.2 plan records an owner data-rule decision (carry-forward) → fixer item 4
- [minor] Inventory — minors with two or optional fixes have no default choice → fixer item 5
- [minor] Watch re-run — 'slowest engine test file' → 'slowest unit test file' → fixer item 6
- [minor] AGENTS.md refresh records not in the carry-forward list → fixer item 7
- [minor] Interface — 'no src/ export change' → 'no src/engine/index.ts export change' → fixer item 8
- [minor] AC bullet 1 — 'starting list' ambiguous → list at the ticket's start commit → fixer item 9
- [minor] Verify line — single Duration, watch budget missing → fixer item 10
- [minor] Inventory (c) — 'move to' → 'are candidates for' → fixer item 11
- [minor] Inventory — SPEC.review-log.md Pass 3 'Minors (unapplied)' carried by the entries are not a source → fixer item 12
- [minor] Carry-forward — 'the epic SPEC's owner wording' undefined → 'SPEC.md or build-notes.md' → fixer item 13
### Default applied (technical)
- noLib only on the AD-2 type-export program (build-notes CAP-1), never on the AD-1 globals program; deliberate-break proviso stays
- strengthened test failing on current code: fix in src/ as its own plan item when it restores specified behaviour with nothing player-visible changed; else the test is left out (never skip/todo) and the item carried forward with the failing case
- rename keeps every id its old title carried and every rule-coverage.md row keeps a passing test named with its id; rule-coverage.md edited only where a row's id or CAP changes
- two-option minors: the stronger test option when no done-ticket change is needed; 'optionally' items → no change unless they close a named gap
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- risk: low → medium (stretch; frontmatter is ticketing metadata, the guarded changes are covered by the gates)
- directory-walker target module (plan-level choice, no ticket words needed; Inventory (e) already gives it a disposition)

## Pass 5 — 2026-10-01
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 3, minor 11, decision-needed 0  |  Dropped in triage: 0 (duplicates merged)
Words (docs): 1499 (8.0 x pass 0)  |  Snapshot: story-refactor-sweep-and-shared-playwright-config.passes/pass5.md
Fixer: applied 1–9; offset words by tightening 'are allowed and add no row' → 'add no row' and the Notes line; no commands changed
### Applied
- [major] Tests — 'a rename keeps every id' forbids the 3-9-build.md minor dropping Q-42 from shell Vitest names (AGENTS.md: shell tests AD-n) → fixer item 1
- [major] Inventory (c) / AC 3 — style-fold gate checks only card root and direct children; Dialog's buttons (.card > .buttons > button) and the standalone pre-mount fatal escape it → fixer item 2
- [major] Tests / dispositions — an applied src/ change (e.g. 3-5 AD-15 halt before console.error) needs no pinning test → fixer item 3
- [minor] Interface — pass-4 narrowing to src/engine/index.ts drops entry-12 'no src/ export change' → restore → fixer item 4
- [minor] Watch re-run file may be split by Inventory (e) → successor files, slowest counts → fixer item 5
- [minor] Tests — 'nothing player-visible changes' → 'what the player sees is already specified' (rule 6) → fixer item 6
- [minor] Budget — 'commit recorded' → 'at the ticket's start commit' → fixer item 7
- [minor] base paragraph — pwa 'only the scalar settings' → 'everything except the device map' → fixer item 8
- [minor] Tests — 'each mapping to an existing row' fails for epic-2 engine rows → 'each carrying only ids an existing test already carries' → fixer item 9
### Default applied (technical)
- shell/UI Vitest renames may drop R/Q/§ ids; engine Vitest and Playwright renames keep them
- style gate: every element of the card subtree plus Dialog layer/scrim, initially focused button focused, and the standalone pre-mount fatal
- applied src/ change carries an AD-n-named test failing before, passing after
### Decision needed (functionality / UX / gameplay)
- none
### Not applied (over budget, plan-level)
- record one cold run beside the medians (fsModuleCache warm-cache bias)
- per-file timings from `--reporter=json`
- test identity without file path after a split
- exact docker run -e CI=1 command for the screens comparison
### Dropped
- none

## Pass 6 — 2026-10-01
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 2, minor 14, decision-needed 0  |  Dropped in triage: 0
Words (docs): 1499 (8.0 x pass 0)  |  Snapshot: story-refactor-sweep-and-shared-playwright-config.passes/pass6.md
Fixer: applied 1–7; offset words by tightening (Tests rule-coverage clause removed as duplicate of the Carry-forward sentence, AC 2 repeat, Interface, miss-rule row); no commands changed
### Applied
- [major] Tests src-fix gate (pass-5 item 6) contradicts Carry-forward-only for player-visible fixes (e.g. Q-42 banner) → fixer item 1
- [major] Watch gate on 'slowest unit test file' unreachable: architecture.test.ts alone ~1.9 s at HEAD (reviewer's json reporter run) → slowest engine test file gates; slowest unit file recorded for information → fixer item 2
- [minor] Tests — no-row exemption only for shell/UI/helper tests; AD-n Playwright tests (3-10 MutationObserver, 3-5 ErrorEvent, 3-8 aria-modal) → 'AD-n-named tests (any kind)' (saves words) → fixer item 3
- [minor] Coverage — 'no assertion removed or loosened' forbids stronger replacements (3-6, 3-11, 3-3 minors) → fixer item 4
- [minor] Verify — add the reverse direction: every inventory item has a plan disposition (SPEC CAP-11 success) → fixer item 5
- [minor] Carry-forward — stale rule-coverage.md wording (Q-42 row) fits no disposition → add 'rule-coverage.md wording' to the spec-owner list → fixer item 6
- [minor] Tests — 'ids an existing test already carries' counts shell-test ids → 'an existing engine Vitest or Playwright test' → fixer item 7
### Default applied (technical)
- watch gate: slowest engine test file, same before/after; slowest unit file informational
### Decision needed (functionality / UX / gameplay)
- none
### Not applied (over budget / plan-level)
- Interface: whether a fold may add a new internal src/ module (strict reading: carry forward; plan records)
- flush() re-derive fix and main.ts halt order: what counts as a behaviour change / observing seam (plan)
- computed-style gate as one-off script vs committed test (plan)
- budget-miss commit state for the landed items (plan)
- pwa reusing the base android `use` (plan)
- base 'constants' wording vs process.env.CI reads
- idle precondition: record load average (plan)
- AGENTS.md carry-forward deadline before epic 4 (plan)

## Pass 7 — 2026-10-01 (verify-only)
Reviewers: fix diff  |  Findings: major 0, minor 2, decision-needed 0  |  Dropped in triage: 0
Words (docs): 1499 (8.0 x pass 0; budget 1500)  |  Snapshot: story-refactor-sweep-and-shared-playwright-config.passes/pass6.md (no fix)
### Applied
- none (verify-only)

## Result — converged after 7 passes
Majors per pass: 8, 5, 4, 3, 3, 2, 0. Decision needed: none. Words 188 → 1499.

### Unapplied minors (for the build's plan)
- Watch re-run clause: 'or if split the slowest successor' no longer matches anything (engine files are not split; Inventory (e) splits architecture.test.ts) — drop it or move it to the informational unit-file clause
- Slowest unit file's watch re-run (architecture.test.ts ~1.9 s) is informational only; if over 1 s, record a carry-forward row (AD-17 watch scope / spine owner)
- Pass 5/6 'Not applied' lists above: cold run beside the medians; per-file timings from `--reporter=json`; test identity without file path after a split; exact `docker run -e CI=1` screens command; whether a fold may add a new internal src/ module; observing seam for the main.ts halt order and flush() fixes; computed-style gate as a one-off script; commit state of landed items on a budget miss; pwa reusing the base android `use`; base 'constants' vs process.env.CI reads; record load average beside timings; AGENTS.md carry-forward deadline before epic 4
