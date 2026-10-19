# Review log — story-refactor-sweep-docs-budget-and-cleanup.md

State: pass 1: done

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
