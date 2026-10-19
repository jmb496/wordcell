# Review log — story-refactor-sweep-docs-budget-and-cleanup.md

State: pass 5: done

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

## Pass 3 — 2026-10-19
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 6 (merged from 38 raw), minor 9, decision-needed 0  |  Dropped in triage: 0 (tsconfig exclude/files, contrast.test.ts:203, prefs.svelte.ts:66 private THEMES, size-budget.mjs output verified; flakiness N and Scope 8 widening reclassified minor: procedural, non-gating)
### Majors (to apply)
1. Scope 7 wrong: tsconfig.app.json excludes colour-literals.ts/.test.ts and contrast.test.ts, tsconfig.arch.json lists them; "covered by both" can never pass. Reword: each src/ui/theme/*.ts and *.test.ts is type-checked by one of the two (complementary lists); mapping in the plan; a file in neither is a defect; no tsconfig edited.
2. 1(a): do not reuse the garden art-token title; default: record the generic per-theme it.each as steampunk's floor coverage; add a steampunk art-token case only if steampunk declares art tokens, stating what it asserts.
3. Scope 2 "read": comments, the declaring file's own key lists and reads inside an unread token's own declaration do not count (follow chains to a non-declaration read); domain src/**/*.{css,ts,svelte} plus index.html; test-only reads go on the allow-list with owner reading; drop "verify" hedge on the file list; list scaffolding greps.
4. Scope 5 test home and mechanism: THEMES is private (prefs.svelte.ts:66); a src/ui/theme/registry.test.ts case drives the real parsePrefs with every registry id (accepted) and a foreign id (rejected); registry ids equal the §7.10 order; ThemeId compared via an exhaustive type check; do not export THEMES. Name the existing unknown-theme e2e (prefs-invalid-theme-unknown in theme.spec.ts) as covering the boot and drop "if cheap".
5. Scope 4: exact dependencies comparison (`git show 0f295f2^:package.json` vs package.json, `dependencies` object equal, via node -p JSON.stringify) added to Verify; margin = 600000 minus printed `total N / 600000`, from a build on a clean tree at the recorded commit (cleanup edits committed first).
6. 1(c): set/assert the 360 px viewport width first; scroll the radio into view once; box inside [0,360] horizontally and inside the sheet body and clear of the sticky bars vertically.
### Default applied (technical)
- Steampunk coverage — loop recorded as coverage unless steampunk declares its own art tokens → default applied
- Flakiness sample — default N = 10 desktop runs of the two specs, record failures/N and names; Scope 6 grep quoted from the digest headings; align range to 9.3-9.10 digest, 9.1-9.10 logs → default applied
### Minor (to apply, zero added words)
- Verify line: test:screens green or recorded as left to the owner (no Docker), `git status --porcelain`; "six ids" gloss in Scope 3; 1(b) read the actual ceiling constant and the 0.06 boundary, "none" = n/a; Scope 8 widen to entries 1-11 with a rule; covers note TH-2/TH-4 as constraints; entry references stay minimal in toml (report only); cite prefs tests by title.
Words: 1204 (10 x pass 0, at budget 1200)  |  Snapshot: story-refactor-sweep-docs-budget-and-cleanup.review-log.passes/pass3.md
Fixer applied majors 1-6 and the defaults; ran the dependencies comparison (output "null null": package.json has no dependencies key, so the check is equality of absence). Several zero-word minors skipped (six-ids gloss, 1(b) boundary, Scope 8 widening, covers note): left unapplied.

## Pass 4 — 2026-10-19
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 3, minor 13 (merged from 20 raw), decision-needed 0  |  Dropped in triage: 0 (main.ts:229-234 registrations, app.css table-art stroke-opacity 0.07/0.08/0.25, contrast.test.ts ceiling on CARD_TEXTURE only verified; precision-in-procedure items reclassified minor under the pass-4 bar)
### Majors (to apply)
1. Scope 5 agreement test takes ids from `entries()`, which is empty until `register()` runs (production only in main.ts:229-234), so it checks its own list. Source the ids from the six exported theme records in §7.10 order and tie main.ts to them (a source scan or the existing boot test: main.ts registers exactly those six, in order).
2. Scope 2 allow-list is builder-only: the owner reads it at the checkpoint; the plan names the exact grep/script and each allow-listed token with its declaring file.
3. Verify line softened test:screens against tickets.toml entry 11's verify ("test:all and test:screens are green"): restore the entry's wording (no Docker = stop and report), keep the added dependencies comparison.
### Minor (to apply, zero net words; ticket is over budget at 1204)
- 1(b): contrast.test.ts enforces the 6 % ceiling on card texture only; table art (0.07, 0.08, 0.25 strokes) is outside it, so compare it and expect rows; Scope 2 grep: the six production registrations in main.ts are not scaffolding; item 4 stray double space and "(both `null` at last run)"; checkpoint line adds the outstanding play-tests (epic Done-when 5); trim to land at or under 1200 words.
### Left unapplied (minor, over budget)
- Locators for 1(c) sticky bars, flakiness load setup and file paths, Scope 6 count rule, Scope 7/8 command and mismatch rule, test:all vs final build figure, dependencies check vacuous (no `dependencies` key), toml references minimal (report only), Q-xx citation on owner-call rows.
Words: 1200 (9.9 x pass 0, at budget 1200)  |  Snapshot: story-refactor-sweep-docs-budget-and-cleanup.review-log.passes/pass4.md
Fixer applied majors 1-3 and zero-word minors; no new commands. Dropped from ticket to pay words: "A spec/spine disagreement is reported, not resolved." (AGENTS.md Policy already covers it).

## Pass 5 — 2026-10-19
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 1, minor 13 (merged), decision-needed 0  |  Dropped in triage: 0 (1(c) locator naming reclassified minor: verify-procedure precision under the pass-4 bar)
### Majors (to apply)
1. Scope 5 main.ts-registration assertion in registry.test.ts: tsconfig.app.json has types [svelte, vite/client] and no node types (verified), so `node:fs` would fail `npm run check`; item 7 forbids tsconfig edits. Read main.ts with a Vite `?raw` import (AD-1 scan permits it outside src/engine/; fixer to check).
### Minor (to apply, zero net words)
- 1(e): the command is `npx playwright test --project=desktop --repeat-each=10 e2e/board-keys.spec.ts e2e/win-guard.spec.ts`, not flaky-report.mjs (a CI report over retries); 1(a) new `it` beside the garden case.
### Left unapplied (minor, at budget)
- 1(c) locator names, 1(b) boundary rule, Scope 2 allow-list-is-not-deletion and diff-limited greps, Scope 4 devDependencies/last-test:all figure, Scope 5 anchored scan regex, Scope 6 "hits N, rows M", Scope 7 listFilesOnly, Scope 8 mismatch rule, snapshot directory name.
Words: 1199 (9.9 x pass 0, within budget 1200)  |  Snapshot: story-refactor-sweep-docs-budget-and-cleanup.review-log.passes/pass5.md
Fixer applied major 1 (finding: a ?raw import of src/main.ts from a ui test fails the AD-1 cross-layer scan, so the main.ts check now reads it with node:fs in contrast.test.ts or colour-literals.test.ts, both in tsconfig.arch.json files) and the two minors; ran playwright --help (--repeat-each exists), checked spec files and desktop project exist. Also trimmed ~15 phrases to pay words, e.g. "(cite the sentence)", "(both null at last run)", "No screenshot baseline.".
