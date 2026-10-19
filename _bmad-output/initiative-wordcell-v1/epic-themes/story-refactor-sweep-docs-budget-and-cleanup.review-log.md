# Review log — story-refactor-sweep-docs-budget-and-cleanup.md

State: pass 2: done

Pre-loop: HEAD c2fd7b5; pass0.md 121 words (budget 1200, set by the loop: the default 2.5x of 121 words would be 300, too small for the entry's verify, covers, risk, done_checkpoint and references plus the carried items; sibling tickets used 1200-1500).

## Pass 1 — 2026-10-19
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 8 (merged from 47 raw), minor 5, decision-needed 0  |  Dropped in triage: 0 (duplicates merged; size-budget.mjs, DESIGN.md line 243 and digest items verified)
### Majors (to apply)
1. Carry-over items absent (steampunk contrast assertion, DESIGN.md line 243 texture %, sixth radio in view at 360 px, Halted-on-unregistered-theme boot path, board-keys/win-guard flakiness follow-up); no task list.
2. "No unused token or theme scaffolding" untestable: define the scan (every --wc-* declared is read in src/**, incl. .svelte markup/style/inline, or by contrast tests; allow-list) and name the scaffolding; an empty result is valid but recorded.
3. Doc confirmation: list surfaces (DESIGN A-D1/Colors/Avoid/Themes, EXPERIENCE Preferences, spec §7.10, AD-10/AD-7/AD-16) with pass condition; edits are proposed for owner approval (rule 7), spec/spine conflict reported.
4. Budget: measure is `npm run build` size-budget.mjs gzip-9 total (AD-18) on dist/; where margin recorded; over budget = stop and report; TH-8 no-runtime-dependency check missing.
5. Deferred findings: sources (digest, plans, review logs, review-loop 9-x-build logs) and destination/disposition missing.
6. test:screens: no baseline may change (TH-4), Docker only.
7. Entry fields not carried (verify, done_checkpoint, hitl, references); owner marks done.
8. Halted-on-unregistered-theme boot path untested after 9.10.
### Default applied (technical)
- Halted boot path — add a unit/boot test of the AD-15 surface for an unknown stored theme if prefs reach it, else record the Q-36 default as the covering behaviour → default applied
- Over-budget handling — stop and report, do not trim themes → default applied
- Growth budget — 1200 words set by the loop → default applied
### Minor (to apply, within budget)
- TH-2 scan and per-theme contrast tests stay green; tsconfig inclusion of theme tests; board dependency data (entry 6 after) check; steampunk assertion pair/floors; 360 px test on `android`.
Words: 767 (6.3 x pass 0, within budget 1200)  |  Snapshot: story-refactor-sweep-docs-budget-and-cleanup.review-log.passes/pass1.md
Fixer applied items 1-10 (all majors and minors); no commands run (names read-checked: scripts/size-budget.mjs, prefs.svelte.ts). Halted path: parsePrefs rejects unknown theme -> Q-36 silent default; ticket records Q-36 as covering behaviour.

## Pass 2 — 2026-10-19
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 7 (merged from 33 raw), minor 9, decision-needed 0  |  Dropped in triage: 0 (contrast.test.ts it.each at 158/163, THEMES list prefs.svelte.ts:66, flaky-report.mjs, 9.9 log line 24 verified)
### Majors (to apply)
1. 1(a) steampunk assertion undefined: the 9.9 log's exact minor is "contrast.test.ts art-token test (~196) covers garden only; say whether a steampunk assertion is added or the per-theme check loop is the coverage". Generic it.each already covers steampunk floors. Name the art-token test to extend or record the loop as coverage.
2. Scope 2 "read": iteration over token sets or check() does not count; a contrast-test read counts only by name; name token files (app.css, theme data modules); allow-list and dynamic-name sites recorded with reason; art-data-only tokens.
3. 1(c) "in view" untestable: bounding box inside 360 px viewport and sheet, reachable after at most one scroll of the sheet body, on `android`, no baseline; id AD-10, file theme.spec.ts.
4. Scope 5: ThemeId, prefs THEMES and registry ids are three lists; one unit test they agree (default), cite tests by name; divergence is a bug (rule 6).
5. Scope 6: "fixed here" only for Scope 1-5/7 items; every digest "Worth knowing" and unapplied-minor row for 9.3-9.10 gets a row; #15171B/pointer colours = owner call; Epic 8 retro = owner action; outstanding Android play-tests (Deep Space, Greenhouse, Brass, Plum) = owner call.
6. 1(e) flakiness bound: use scripts/flaky-report.mjs or repeat runs, record rate; test-only fix allowed; production, timeout or retry change = owner; a rerun counts as green only with failing tests named.
7. Scope 3: per-surface table in the plan (surface, as built, match, proposed old/new text/reason), incl. theme order/ids vs §7.10, Colors floors vs contrast.test.ts, 9.5 default-only sentence; build makes no edit to those docs.
### Default applied (technical)
- THEMES/registry/ThemeId agreement test — add the unit test, do not derive THEMES from the registry (needs rule 7) → default applied
### Minor (to apply, within budget)
- 1(b): compare all six records, cite sentence not line, enforced 6 % ceiling in contrast.test.ts; "five themes" = default plus five (six ids); Scope 4 base commit 0f295f2 (verified exists) and final-build figure with hash; AD-17 hooks are not scaffolding; screens check = git status clean, no Docker = left to owner; Scope 7 check every src/ui/theme/*.test.ts in both tsconfigs; Scope 8 name epic-themes.md, clean result valid; references add digest and review-loop logs.
Words: 1150 (9.5 x pass 0, within budget 1200)  |  Snapshot: story-refactor-sweep-docs-budget-and-cleanup.review-log.passes/pass2.md
Fixer applied items 1-12; ran ls src/ui/theme, grep tsconfigs, git diff 0f295f2^ -- package.json (empty). Fixer flagged: tsconfig.app.json lists colour-literals/contrast tests in exclude, so Scope 7 "covered by both tsconfigs" wording needs checking.
