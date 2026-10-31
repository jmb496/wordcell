# Review log — story-refactor-sweep.md (ticket 7.10)

State: pass 7: done

Mode: docs, thorough, max 7, budget 1500 words. Pass 0: 212 words, copy `story-refactor-sweep.review-log.passes/pass0.md` (HEAD 1bca825).

## Pass 1 — 2026-10-31
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 10, minor 5, decision-needed 0  |  Dropped in triage: 0 (about 25 duplicates merged)
Words (docs): 1157 (5.5x pass 0; budget 1500)  |  Snapshot: story-refactor-sweep.review-log.passes/pass1.md, fix diff pass1.fix.diff
Fixer: all 14 applied; item 12 adjusted (package.json/lockfile changed after 4130fb4 by 7.1 `workbox-window`, so checked against the build start commit; fixer ran the `git diff --exit-code` forms); item 6 found the existing AD-14 pin (src/architecture-tree-scan.test.ts:38) already covers the hide-cancel order, so the new pin covers the remaining clauses; cites verified with git show/grep.
### Applied
- [major] Description, sources — sources named only as categories; no reconciliation, so "every deferred finding has its row" is uncheckable → fixer item 1
- [major] Description — no table location, columns or live-at-HEAD check; a "closed by" cite never checked against HEAD → fixer item 2
- [major] Description, dispositions — no "handed to entry 11" disposition for close-out doc syncs (7.8 plan deferred row expects one; entry 11 does not name build-notes, SPEC F6/F8) → fixer item 3
- [major] Description, edit boundary — "tooling" undefined; `docs/device-testing.md`, `scripts/device-preview.mjs`, done plans' errata, gate/timeout settings unplaced → fixer item 4
- [major] Description, fix ticket — who creates it, where recorded, whether it lands before entry 11 → fixer item 5 (default applied)
- [major] G9 — order to pin, test kind and decline evidence unspecified → fixer item 6 (default applied)
- [major] Budgets — no AD-17 Speed method, commit or over-budget path → fixer item 7 (default applied)
- [major] "fixed" — no pass condition (mutation, `--repeat-each`) → fixer item 8 (default applied)
- [major] Flakes — 7.9 residual names `nav.spec.ts:163` (SPEC Non-goals: follows A7, outside this epic) and `success-signal.spec.ts:440`; no rule → fixer item 9
- [major] Frontmatter — drops tickets.toml `hitl = false`, `done_checkpoint = true`; owner-call rows have no owner stop → fixer item 10
- [minor] AC — `test:screens` container-only, no-Docker stop, no baseline change → fixer item 11
- [minor] AC — epic invariants (fixtures, SESSION/HISTORY_VERSION, deal.test.ts, package.json vs 4130fb4) → fixer item 12
- [minor] Pre-assignments for items the refs already settle → fixer item 13
- [minor] References — AD-17 Speed, AD-18 and the evidence files → fixer item 14
### Default applied (technical)
- Fix-ticket route — plan row proposes the entry; build never edits tickets.toml; owner/orchestrator adds it before entry 11
- G9 — test-only source-order pin beside the F17 pin in `src/architecture-tree-scan.test.ts`
- Budgets — fresh Linux-filesystem clone of the sweep's last commit; over budget: profile, stop and report
- "Fixed" — fails on the named mutation; changed e2e `--repeat-each=5`
- `docs/device-testing.md` and `scripts/device-preview.mjs` count as CAP-7 tooling the sweep may edit
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none (duplicates merged into the items above)

## Pass 2 — 2026-10-31
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 7, minor 11, decision-needed 0  |  Dropped in triage: 1 (G9 pin AD-id naming folded into item 7)
Words (docs): 1482 (7.0x pass 0; budget 1500)  |  Snapshot: story-refactor-sweep.review-log.passes/pass2.md, fix diff pass2.fix.diff
Fixer: all 13 applied; cites verified (git log -S 326edb4, playwright.base.ts:17 `retries = ci ? 2 : 0`, src/main.ts :159/:170/:205/:252, 7.1 plan guard mentions :61 :99 :101 :116 :136 :160, 7-5-build.md:25, 7-9-build.md:53); `git diff --exit-code <baseline_revision>` form run on 7.9's baseline 6785917 (exit 0). Now at budget: further minors only if they add no words.
### Applied
- [major] Items 2/3/6 — technical non-editable changes (config, package, Playwright timeout/retry/workers, size limits) routed to owner calls, contradicting item 2 and CAP-8 "owner call (functionality or UX only)" → fixer item 1 (default applied: fix-ticket rows)
- [major] Item 3 — edit boundary not closed (`scripts/size-budget.mjs`, tsconfig, biome, other configs unplaced) → fixer item 2 (default applied: anything not editable is a fix-ticket row)
- [major] Item 2 / Description — handed-to-entry-11 group has no route to entry 11 → fixer item 3
- [major] Item 6 — `success-signal.spec.ts:440` 0/3 with no cause has no outcome → fixer item 4
- [major] AC / item 6 — final `test:all` flake failure handling, CI unset (retries 0) unspecified → fixer item 5
- [major] Item 2 — pre-assigned F17 close cite fails item 1's every-clause rule (pin is 326edb4; 7.1 plan guard text still open) → fixer item 6
- [major] Item 4 — G9 "createController right after createGate" false at HEAD; "after game.load()'s halted return" clause omitted → fixer item 7
- [minor] items 8–17 (see fixer list: triage-log filter, scan overlap, repeat-each scope, sweep commit terms, missing-run minors, item 5 routing, digest statements, deal.test.ts comments, device-preview deferred items, pre-assignment sentence cites)
### Default applied (technical)
- Out-of-boundary technical change → fix-ticket row; per-test `test.setTimeout` is a test-only edit under item 5
- 0/3 not reproduced → declined with counts; ≥1/3 no cause → fix-ticket row
- Final `test:all` failure confined to a named flake → one rerun at the same commit, both recorded; other failures stop
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- G9 pin naming by AD id (adversarial minor) — folded into fixer item 7

## Pass 3 — 2026-10-31
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 5, minor 12 (word-neutral ones sent to the fixer), decision-needed 0  |  Dropped in triage: 3
Words (docs): 1499 (7.1x pass 0; budget 1500)  |  Snapshot: story-refactor-sweep.review-log.passes/pass3.md, fix diff pass3.fix.diff
Fixer: all 14 applied; cut repeated text to stay in budget (Description edit-scope clause, 7.8 quote, "Owner calls stay functionality or UX only" in item 3, AC Verify measures list → "item 7's budgets"); verified package.json `test:all` chain, src/main.ts :141/:159–161/:205/:233/:250/:252/:256, epic-place-preview.md:63, retro :141, SPEC :99.
### Applied
- [major] AC flake-rerun bullet — "one rerun" unspecified; `test:all` is an `&&` chain (package.json:30), so a spec-only rerun leaves `test:e2e:pwa` unrun → fixer item 1
- [major] Item 3 catch-all "any file not listed … (a fix-ticket row)" contradicts item 2's entry-11 hand-off for documents → fixer item 2
- [major] Item 3 per-test `test.setTimeout` placed under item 5's mutation pass, which a timing flake cannot meet; item 6 gives flakes the 0/3 pass → fixer item 3
- [major] Item 6 `nav.spec.ts:163` "declined" drops the owner's A7 trigger: epic 11 Notes (epic-place-preview.md:63) keep 9394922 "with a fix ticket for the next nav.spec.ts:163 failure (retro B8)"; 7.9 plan :108 run 2 is that failure → fixer item 4
- [major] Items 6/7 "sweep commit" moves after measuring (item 6 fixes, review-fix commits), no re-run rule → fixer item 5 (default applied)
- [minor] word-neutral fixes: G9 cites (:161, `boot()`'s only return, `mount(App`, `registerBeforeBack` after `createController`); deal.test.ts exception moved to the front; "non-comment" ahead of the non-editable list; `scripts/size-budget.mjs`'s limits only (CAP-8 tooling); "live at `baseline_revision`"; handed to entry 11 framed as a CAP-8 disposition; boot-order merge disposed per clause; success-signal "every prior sighting"; checkpoint wording (Jared settles owner-call rows; orchestrator applies fix tickets/amendment) → fixer items 6–14
### Default applied (technical)
- Sweep commit = last commit changing anything outside `_bmad-output/`; items 6 and 7 run after every other edit; a later such commit re-runs them
- nav.spec.ts:163 → fix-ticket row for the owner's A7 backlog entry, outside this epic (SPEC Non-goals), not tickets.toml
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- Flake test identity by title prefix — plan-level detail, not ticket text (over budget)
- Entry-11 disposition for device-read residuals (7.9 plan :204) and 7-9-build.md:54 unrecorded-check minor — add words over budget; the build can decline-with-reason or record them under existing rules (left as unapplied minors)
- G9 "and to App" clause — adds words; covered by the required `controller` prop (`npm run check`), left as unapplied minor

## Pass 4 — 2026-10-31
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment (late-pass bar)  |  Findings: major 4, minor 14, decision-needed 0  |  Dropped in triage: 3
Words (docs): 1499 (7.1x pass 0; budget 1500)  |  Snapshot: story-refactor-sweep.review-log.passes/pass4.md, fix diff pass4.fix.diff
Fixer: all 11 applied; the edit-boundary check uses `git diff --name-only <baseline_revision> -- . ':(exclude)_bmad-output'` (the `':!_bmad-output'` form failed: "Unimplemented pathspec magic '_'"; the exclude form ran against HEAD~1 and 7.9's baseline 6785917); B8 at :218, F-13 sighting verified; 7-9-build.md :50/:51/:53/:55 verified.
### Applied
- [major] Item 3 — `scripts/size-budget.mjs` neither editable nor wholly non-editable after pass 3 (catch-all vs "'s limits" example); CAP-8 counts it as tooling → fixer item 1 (default applied: editable except its limits and gate conditions)
- [major] Item 6 — `success-signal.spec.ts:440` 0/3 decline contradicts owner process rule B8/L3 ("a flake seen in a second ticket gets its own fix ticket at once", epic-end-of-game-words-retrospective.md:218, epic-place-preview-retrospective.md:120); sightings in epic 5/6 and 7.9 → fixer item 2
- [major] Item 5 — the test-only pass would decline the doc/comment fixes item 3 says "land here" (7-9-build.md:50, :51, :55) → fixer item 3
- [major] AC — CAP-8's edit boundary (item 3) has no gating check → fixer item 4 (default applied: `git diff --name-only <baseline_revision>` outside `_bmad-output/` lists only item 3's editable files; `src/` non-test hunks comment-only)
- [minor] word-neutral: flake fix generalised under item 6; AC final-failure counts as item 6 failure; re-run owner incl. code-review fixes before done; G9 "pinned as"; "code comments"; reject-verdict source narrowed to refactor or test gap; Tailscale-approved run → fixer items 5–11
### Default applied (technical)
- `scripts/size-budget.mjs` editable tooling except limits/gate conditions (CAP-8 "tooling")
- Edit-boundary AC check by `git diff --name-only`
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- 7.2 halted-first F17 runtime gap beside the pre-assigned closures — item 1's every-clause rule already makes it live; plan lists it (unapplied minor)
- Counted-run checkout (/mnt/d vs Linux clone) — plan records it (unapplied minor)
- Fix not reaching 0/3 — already follows from "without a cause or fix"

## Pass 5 — 2026-10-31
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment (late-pass bar)  |  Findings: major 2, minor 15, decision-needed 0  |  Dropped in triage: 6
Words (docs): 1512 (7.1x pass 0; budget 1500, +12 from the major fix)  |  Snapshot: story-refactor-sweep.review-log.passes/pass5.md, fix diff pass5.fix.diff
Fixer: all 8 applied; `git diff --name-only 6785917 -- . ':(exclude)_bmad-output/implementation-artifacts'` run (lists 7.9's plan and editable files only); `-G'BUDGET_BYTES'` shown to catch 33936ce (exit 1) and pass at 6785917 (exit 0); comment-only hunk rule is an inspection rule (unverified as a command); cuts: "(every source)", "ticket 5.13", "(layout, FLIP, `startTracker`)".
### Applied
- [major] AC edit-boundary check (added pass 4) — comment-only clause flags editable `src/architecture-scan.ts` yet lets non-comment edits to `vite.config.ts`, Playwright settings and size-budget limits through ("code comments anywhere" puts every file on the name list) → fixer item 1 (fix diff, edge-case, adversarial)
- [major] AC edit-boundary check — `':(exclude)_bmad-output'` hides the forbidden spec, companion, spine, UX, tickets.toml, epic-file and done-ticket edits items 2–3 name → fixer item 1 (ref alignment; default applied: exclude only `_bmad-output/implementation-artifacts`)
- [minor] word-neutral: AC flake bullet "an item 6 row's test" + closed row reopens; re-run owner named; `nav.spec.ts:163` "backlog entry" (not a tickets.toml fix ticket); G9 decline wording and chain order; entry-11 examples split by covered/uncovered; "7-9-build.md:50/:51/:55"; missing run "where it can run unattended" → fixer items 2–8
### Default applied (technical)
- Edit-boundary check: name list excluding only `_bmad-output/implementation-artifacts`; every hunk in a file item 3 opens only to code comments is comment-only; `git diff -G'BUDGET_BYTES'` on `scripts/size-budget.mjs` empty
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- Reject-verdict filter back to tags (fix diff minor) — reverses pass 4's applied narrowing; churn, the plan names its grep
- B8 scope for unrelated one-off failures in counted runs — over budget; plan
- G9 result to device-checks.md G9 via the entry-11 group — over budget; plan
- G9 pin matching `game.state.kind === 'halted'` text — plan detail
- Watch re-run trigger and timing method — plan detail (AD-17 Speed)
- Re-run owner wording duplicates (merged into item 3)

## Pass 6 — 2026-10-31
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment (late-pass bar)  |  Findings: major 1, minor 17, decision-needed 0  |  Dropped in triage: 5
Words (docs): 1525 (7.2x pass 0; budget 1500, +13 from the major fix, minors net 0)  |  Snapshot: story-refactor-sweep.review-log.passes/pass6.md, fix diff pass6.fix.diff
Fixer: all 12 applied; `-G'_BYTES'` exits 1 on 33936ce~1..33936ce and on a /tmp copy with `PRECACHE_MAX_BYTES` changed (where `-G'BUDGET_BYTES'` exits 0), exits 0 on 6785917..HEAD; the gate-condition hunk rule is an inspection rule (unverified as a command); build-notes :23/:55, 7.1 plan :101, 7.8 plan :20, App.svelte:43, SPEC :65 verified.
### Applied
- [major] AC size-budget check (pass 5) — `-G'BUDGET_BYTES'` misses `PRECACHE_MAX_BYTES` (scripts/size-budget.mjs:14) and every gate condition (`errors.push` :139–160, `throw`, `exitCode` :218) that item 3 forbids changing → fixer item 1 (fix diff, adversarial; edge-case rated it minor; default applied: `-G'_BYTES'` plus an inspection clause that no hunk removes or weakens an `errors.push`, `throw` or `exitCode` condition)
- [minor] word-neutral: nav.spec.ts:163 keeps the fix-ticket label as an owner backlog entry; "none" row for a source with no finding; build-notes.md :23 and :55 in the amendment group; entry-11 cite must name the row (not verify's catch-all); fix-ticket definition includes item 6's B8 rows; `deferred`/Deferred coverage source; `baseline_revision` defined at first use; G9 decline by "existing test or `npm run check`"; 7.8 cite :20; final rerun stops only on the same or a non-item-6 test; device-testing.md cited via SPEC CAP-7 → fixer items 2–12
### Default applied (technical)
- Size-budget gate check: `-G'_BYTES'` and hunk inspection of gate conditions
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- Reproduction field for a non-reproducing flake row — plan detail
- "two ordered calls are swapped" — adds a word; plan names its mutations
- "re-run to 0/3 counted runs" — adds a word; plan detail
- Description checkpoint listing the nav backlog entry — adds words; item 6 now labels it a fix ticket
- Edge-case size-budget minor — merged into the major

## Pass 7 — 2026-10-31 (verify-only)
Reviewers: fix diff (pass6.fix.diff only)  |  Findings: major 2, minor 2, decision-needed 0  |  Dropped in triage: 0
Words (docs): 1525 (7.2x pass 0; budget 1500)  |  Snapshot: story-refactor-sweep.review-log.passes/pass6.md (no fix this pass)
### Open (not fixed: verify-only pass)
- [major] AC flake-rerun bullet (line 35) — pass 6's word-neutral trim turned "one `npm run test:all` rerun" back into "one rerun", undoing pass 3's applied major (`test:all` is an `&&` chain; a spec-only rerun leaves `test:e2e:pwa` unrun). Fix: restore "one `npm run test:all` rerun" (cut "both" to stay word-neutral).
- [major] AC flake-rerun bullet (line 35) — pass 6 minor 11 narrowed the stop rule to "a rerun failing the same or a non-item-6 test", so a rerun failing a different item-6 test continues with no green `test:all` at that commit, contradicting the Verify line. Fix: restore "a failing rerun or any other failure stops the build and is reported".
### Unapplied minors (this pass)
- Item 1 Columns — "live at `baseline_revision`, the plan's build start commit (yes/no …)" reads as an extra column; reword "live at `baseline_revision` (the plan's build start commit; yes/no, …)".
- Item 2 vs item 6 — "which then waits on the fix tickets" could include the nav.spec.ts:163 backlog entry; say "its tickets.toml fix tickets".

## Result — capped at 7 passes (open majors: 2, both in the AC flake-rerun bullet)
Majors per pass: 10, 7, 5, 4, 2, 1, 2. Decision-needed: none. The two open majors are regressions in one AC bullet introduced by pass 6's fix (a word-trim and a minor that narrowed the stop rule); both have one-line restorations above, to apply before the build (or by the build's plan, which must follow the pass-5 wording: one `npm run test:all` rerun; a failing rerun or any other failure stops the build).

Unapplied minors (for the build's plan):
- Item 1 Columns wording (pass 7); item 2 "its tickets.toml fix tickets" (pass 7).
- 7.2 halted-first F17 runtime gap (7.2 plan :187 sentence 2) beside the pre-assigned closures — its own row, live (pass 4).
- Counted-run checkout (/mnt/d vs Linux clone) recorded in the plan (pass 4).
- B8 scope for unrelated one-off failures in counted runs; G9 result to device-checks.md G9 via the entry-11 group; G9 pin matching `game.state.kind === 'halted'`; watch re-run trigger and timing method (pass 5).
- Reproduction field for a non-reproducing flake row; "two ordered calls are swapped"; "0/3 counted runs" (pass 6).
- Device-read residuals (7.9 plan :204) and 7-9-build.md:54 unrecorded-check minor; flake test identity by title prefix (pass 3).
- Reject-verdict source filter (judgement vs tag grep; pass 5 fix-diff minor) — the plan names its grep.
