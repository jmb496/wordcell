# Review log — story-deflake-the-helpers-spec-ts-doubletap-test-under-load.md (ticket 7.14)

State: pass 7: done

Mode: docs, thorough, max 7, budget 1500 words. Pass 0: 279 words, copy `story-deflake-the-helpers-spec-ts-doubletap-test-under-load.review-log.passes/pass0.md` (HEAD 781d38f).

## Pass 1 — 2026-11-03
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 8, minor 5, decision-needed 0  |  Dropped in triage: 0 (about 25 duplicates merged)
Words (docs): 1144 (4.1x pass 0; budget 1500)  |  Snapshot: story-deflake-the-helpers-spec-ts-doubletap-test-under-load.review-log.passes/pass1.md, fix diff pass1.fix.diff
Fixer: all 13 applied, no conflicts; new `## Scope` items 1–6; `npx playwright --version` 1.63.0, `npx playwright test --help` lists `--grep`, `--workers`, `--project`, `--repeat-each`; the `git diff --name-only … ':(exclude)_bmad-output'` pathspec accepted; suites not run. tickets.toml entry 14 (`after`, description, verify) not synced: the orchestrator's.
### Applied
- [major] Description, mechanism — D-71 framed as the settled D-64 tap-window mechanism, but `doubleTap` stamps its taps so real-time lateness should not matter (touch.ts comment; the test asserts a page gap < 400 ms after a 600 ms real wait); a 1780 ms page gap means the stamps were not honoured: the open question, not a known cause → fixer item 1
- [major] Description, outcomes — only test/helper and `src/` causes; no input-delivery (Chromium/CDP) or config outcome, no Reproduces-without-proof outcome; `src/` "stops for the owner" contradicts SPEC CAP-8 (B8 fix-ticket proposal under technical defaults) → fixer item 2
- [major] AC — no standard of proof for cause or fix; 0/50 isolated after a fix proves nothing when it passed 30/30 alone before; no void rule for a failure after the fix lands → fixer item 3
- [major] Description/AC — no edit boundary and nothing bars weakening the test (title, 600 ms `between`, < 400 check, `[1, 2]`, `DOUBLE_TAP_GAP_MS`, report format, skip/fixme/retries, timeouts) or editing `src/`, config or the other caller specs; no `git diff --name-only` check → fixer item 4
- [major] Reproduction — only the isolated run, the condition known not to reproduce; no counted runs, no CI-unset/retries-0 pin, no tree rule for counts → fixer item 5
- [major] Changed helper — `doubleTap` is called by D-64's `e2e/nav.spec.ts:173`, `celebration.spec.ts:719`, `history-notice.spec.ts:249,408`; no mutation case, caller reruns, `test:screens` (screens specs import `gestures.ts`, which imports `touch.ts`), or AD-17 Touch spine-sync rule → fixer item 6
- [major] AC `test:all` — no rule for a final failure on D-64's or D-65's flakes or on this test → fixer item 7
- [major] Evidence/record — the only surviving evidence (7.10 plan D-71 row and :418, tree bbdd2d5; full helper report and trace lost) is not named; no trace-keeping rule; where results go undefined (7.10 plan stays unedited) → fixer item 8
- [minor] Frontmatter — `hitl: false` missing; `after` lacks 13 (7.13 builds first; tickets.toml sync is the orchestrator's) → fixer item 9
- [minor] No recurrence rule after a close → fixer item 10
- [minor] References — SPEC CAP-8, constraint refs, 7.13 plan's 7.14 hand-off, the end-of-game-words epic path → fixer item 11
- [minor] Sightings — omit the passes in the final `test:all` at 2d01200 and f29b440 and 7.13's 0/3 counted and green `test:all` at 84df83f → fixer item 12
- [minor] D-64 relation — a fix here does not close D-64 (SPEC Non-goals A7) → fixer item 13
### Default applied (technical)
- Outcomes and proof — 7.13 Scope items 4–5 adapted (two-half reverted injection, void rule, B8 fix-ticket proposal for `src/`/config, input-delivery outcome)
- Edit boundary — `e2e/helpers.spec.ts`, `e2e/helpers/touch.ts`, this ticket's plan; `src/`, Playwright config and other specs out
- Load counts — isolated ×50 plus three counted android runs, CI unset, retries 0, before and after
- Changed helper — 7.13 item 6 adapted to `doubleTap`'s callers; spine-sync note, no spine edit
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none

## Pass 2 — 2026-11-03
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 6, minor 9, decision-needed 0  |  Dropped in triage: 0 (about 12 duplicates merged)
Words (docs): 1500 (5.4x pass 0; budget 1500, reached)  |  Snapshot: story-deflake-the-helpers-spec-ts-doubletap-test-under-load.review-log.passes/pass2.md, fix diff pass2.fix.diff
Fixer: all 15 applied, no conflicts; cuts to stay in budget (D-64 history pointer moved to References, sightings point to item 3); the hypothesis sentence now reads "without cause found a suspected cause is a recorded hypothesis; without both halves, no edit"; no new literal commands; screens-spec import chains re-checked (none reaches `touch.ts`).
### Applied
- [major] Scope 5 outcomes — "Never reproduces" lost 7.13's "neither half / no injection showing the mode", so an injection-only cause can meet both Never reproduces (`built`) and Input-delivery (stop); "else" in Input-delivery unscoped; no "fix lands with both halves even at a natural 0"; Reproduces-without-proof does not cover an injection-only or fix-unproven cause → fixer item 1
- [major] Scope 2 — the trailing "unless" can be read to release the title, 600 ms `between`, < 400 ms check (AD-17 Touch does not state them), so a stamp limit could be "fixed" by weakening the test; `between` not pinned as the real wait between the taps → fixer item 2
- [major] Scope 5 thresholds — an injected failure need not be the `[1, 1]` mode to count; "0/N with" undefined (7.13 hardened this) → fixer item 3
- [major] AC bullet — a caller failing with `doubleTap`'s own "click details of the two taps" report (D-64's test reruns and may be discarded; celebration/history-notice stop the build) is this ticket's mode, not a sibling flake → fixer item 4
- [major] Scope 4/AC — no rule for other tests failing in uninjected diagnostic or injection runs (7.13's diagnostic had 5 unrelated failures) → fixer item 5
- [major] Scope 4/AC — whether a counted run with a D-64/R-73 failure still counts for this test, and what the counted-run "rerun" is → fixer item 6
- [minor] Scope 4 — later change re-runs only item 4 and `test:all`; 7.13 re-runs items 4–6 → fixer item 7
- [minor] Scope 6 — `gestures.ts` example wrong: no `*.screens.spec.ts` reaches `touch.ts` (checked at fddd390) → fixer item 8
- [minor] Scope 3 — the timeStamps are at the 7.10 plan's D-71 row :190 and Fix tickets :204, not :418 → fixer item 9
- [minor] AC bullet — where a D-64 (A7) or R-73 (D-65, B8 citing 7.13) sighting goes → fixer item 10
- [minor] Scope 6 vs 1 — a signature change must stay backward-compatible (callers not editable) → fixer item 11
- [minor] Description — the sighting failed in the helper's `[1, 2]` poll, not the < 400 ms check; which events the two timeStamps were is unknown → fixer item 12
- [minor] Scope 6 — after a fix, a caller failing in the item 6 ×5 runs has no consequence → fixer item 13
- [minor] Scope 1/6 — other `touch.ts` functions are editable but item 6 covers only `doubleTap`'s callers → fixer item 14
- [minor] Scope 5 — mechanism class "stamps not honoured when stale"; a stale-first-tap injection as a second example → fixer item 15
### Default applied (technical)
- Scope 2 — the stamp premise counts as AD-17 Touch prescribed for this ticket; the pinned list has no exception; a Chromium stamp limit takes the Input-delivery outcome with a B8 proposal and spine-sync note
- AC — any test failing with `doubleTap`'s `[1, 2]` report is a sighting of this mode
- Scope 4 — stop rules cover counted runs and the final `test:all`; diagnostic/injection failures of other tests are recorded only
- Scope 1 — `touch.ts` edits limited to `doubleTap` and code only it uses
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none

## Pass 3 — 2026-11-03
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 6, minor 8, decision-needed 0  |  Dropped in triage: 3 (to the plan, see Dropped; about 6 duplicates merged)
Words (docs): 1499 (5.4x pass 0; budget 1500)  |  Snapshot: story-deflake-the-helpers-spec-ts-doubletap-test-under-load.review-log.passes/pass3.md, fix diff pass3.fix.diff
Fixer: 13 applied, item 13 skipped (no room; the sighting definition covers the extra counted rerun); quote re-verified by grep; "sighting" defined once at the AC bullet's start; the pass 2 "cause involving both stamping and Chromium" sentence dropped as redundant under the classifier; word-neutral cuts (AC no longer restates item 4's void/reproduction, References plan line shortened).
### Applied
- [major] Scope 3/Description — the full helper report survives (7.10 build subagent transcript `~/.claude/projects/-mnt-d-CodeProjects-wordcell/310bbcf8-…/subagents/agent-a326d4a61921ee046.jsonl`, verified): `touchstart@740.1, touchend@740.1, click(1)@740.1, touchstart@2520.2, touchend@2520.2, click(1)@2520.2; CDP stamps 1793495191453.0 +0 and +80 ms; page timeOrigin 1793495190712.9`; the first tap landed on its stamp (740.1), the second ~1.7 s off its stamp (820.1); "do not survive" and "which events unknown" are wrong, and the stale-first-tap injection contradicts it → fixer item 1
- [major] AC bullet — a D-64 failure with `doubleTap`'s report goes only to this ticket's path, never to A7 (SPEC Non-goals: a recurrence follows A7) → fixer item 2
- [major] Scope 4/5 vs AC — "sighting" scope: Never reproduces checks only this test while the AC makes a caller's report failure a reproduction (both outcomes apply); and "any failure of this test" (e.g. a context-teardown timeout in a diagnostic) counts as a reproduction or a void though cause found is defined only for `[1, 1]` → fixer item 3
- [major] Scope 5 — no classifier for a cause in page state (e.g. a busy main thread near boot): test-side (`built`), input-delivery or `src/` (stop); 7.13 item 5 has one → fixer item 4
- [major] Scope 2 vs 5 — the pin fixes the whole real interval between the taps at 600 ms, which bars the page-state waits item 5 offers as a fix → fixer item 5
- [major] Scope 5 — injected lateness unbounded: a `[1, 1]` far beyond the sighting's lateness would count as D-71's cause and force the Input-delivery stop → fixer item 6
- [minor] Scope 4 — later change re-runs items 4 and 6, not 4–6 (a revised fix skips the with-fix injection) → fixer item 7
- [minor] AC — "(then it stops the build)" vs item 6's void for the same event → fixer item 8
- [minor] Scope 2 — the stale-stamp parenthesis reads as always B8; item 5 allows a proven test-side fix first → fixer item 9
- [minor] Scope 5 — the injection's site must stay unchanged by the fix → fixer item 10
- [minor] Scope 1/6 — a new `touch.ts` export the test uses; spine-sync note for a new export → fixer item 11
- [minor] Scope 6 — mutation runs count as injections (else they void the fix) → fixer item 12
- [minor] Scope 4 — whether the extra counted rerun counts toward this test's tally → fixer item 13
- [minor] AC — "confined to D-64's or R-73" → "and/or" → fixer item 14
### Default applied (technical)
- Sighting — a failure with `doubleTap`'s report or this test's own checks; other errors of this test are recorded only in diagnostic/injection runs and follow the AC's "any other failure" elsewhere
- Injection bound — modelled lateness no more than the sighting's (~1.7 s stale second tap); beyond it, a threshold measurement only
- Cause classifier — 7.13 item 5's sentence, compressed
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- AC Verify — function-level check of `touch.ts` hunks: plan detail, over budget (unapplied minor)
- Scope 2 — how to measure the stale-stamp threshold (bisect 600–1800 ms): plan detail (unapplied minor)
- Scope 4 — a dev server already on :5173 reused with CI unset: plan detail (unapplied minor)

## Pass 4 — 2026-11-03
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 3, minor 9, decision-needed 0  |  Dropped in triage: 3 (plan/orchestrator, see Dropped; about 5 duplicates merged)
Words (docs): 1499 (5.4x pass 0; budget 1500)  |  Snapshot: story-deflake-the-helpers-spec-ts-doubletap-test-under-load.review-log.passes/pass4.md, fix diff pass4.fix.diff
Fixer: 11 applied, item 7 skipped (budget: ~20 words; unapplied minor); bound written as "≤ the sighting's 1700.1 ms"; "in-bound" also added to the Reproduces bullet; Never reproduces reads "no uninjected sighting in any run of this build"; AC rerun "one full rerun" (covers both `test:all` and counted runs); word-neutral cuts in items 2, 4, 5.
### Applied
- [major] Scope 2 vs 5 vs Never reproduces — a `[1, 1]` only beyond the injection bound is "a threshold measurement (item 2)", item 2 sends any proven stale-stamp limit to Input-delivery (stop), and Never reproduces bars any injection `[1, 1]` (`built`): opposite gating for one result → fixer item 1
- [major] Scope 5 classifier — the example "a busy main thread soon after load" fits both `src/` (stop) and input-delivery (fixable, `built`), and also describes the sighting → fixer item 2
- [major] Scope 4 stop rules — the isolated ×50 run (gating 0/50) and item 6's ×5 runs are neither "counted/`test:all`" nor "diagnostic/injection": a non-sighting failure there is unclassified → fixer item 3
- [minor] Description — "the first tap's stamp was honoured" is unproven (`first` is `Date.now()` just before dispatch) → fixer item 4
- [minor] Scope 5 — injection bound: one measured limit (second tap's page touchstart minus its stamp ≤ 1700 ms; sighting 1700.1) → fixer item 5
- [minor] AC — the sighting definition catches `doubleTap`'s own failure self-tests → fixer item 6
- [minor] AC — "one rerun" → one full `test:all` rerun → fixer item 8
- [minor] Scope 5 Never reproduces — "in item 4's runs or `test:all`" vs item 4/6 "any sighting" → "in any run of this build" → fixer item 9
- [minor] Scope 1 — all of `e2e/helpers.spec.ts` editable; 7.13 limits it to helper cases → fixer item 10
- [minor] Scope 5 — report-enriching diagnostics count as injections → fixer item 11
- [minor] Description — "7.13 changed neither helper file, so no re-baseline" redundant (item 4 takes its own before-counts): cut for budget → fixer item 12
### Default applied (technical)
- Beyond-bound `[1, 1]` — recorded threshold only, decides no outcome (pass 3 default made explicit)
- Classifier — `src/` only for a `src/` behaviour losing detail 2 for real touch input (page timeStamps on their stamps); a tap off its stamp is input-delivery
- Stop rules — every run except diagnostic and injection runs
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- Scope 5 — the stale-second-tap injection's fix route is deterministic stamping only: plan detail (unapplied minor)
- Scope 6 — item 6 voids on any caller failure while item 4 voids on sightings: strict reading stands, plan records it (unapplied minor)
- tickets.toml entry 14 (description "stops for the owner", `after = [10]`, verify) out of sync with the ticket: the orchestrator's sync before the build (unapplied minor)
- Scope 5 — a sighting other than `[1, 1]` is its own mode (7.13 item 5): sent as fixer item 7, skipped by the fixer for budget (unapplied minor; moved here from Applied at pass 5)

## Pass 5 — 2026-11-03
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment (no findings)  |  Findings: major 3, minor 8, decision-needed 0  |  Dropped in triage: 4 (plan detail, see Dropped; 1 duplicate merged; 1 log-only item fixed in the log)
Words (docs): 1500 (5.4x pass 0; budget 1500)  |  Snapshot: story-deflake-the-helpers-spec-ts-doubletap-test-under-load.review-log.passes/pass5.md, fix diff pass5.fix.diff
Fixer: all 10 applied; item 1 parenthesis "(this test, `doubleTap` and item 6 cases)"; item 2 "(unless fixed test-side:"; bound written as "within bounds: measured lateness … ≤ the sighting's 1700.1 ms, stamps 80 ms apart, never load alone"; AC "recorded for A7" (SPEC Non-goals cite dropped, kept in the Description).
### Applied
- [major] AC sighting definition — pass 4 put "but its failure self-tests" before "(D-64's included)", so D-64's test reads as excluded: a D-64 report failure could get a rerun instead of voiding the fix → fixer item 1
- [major] Scope 1 vs 6 — `e2e/helpers.spec.ts` limited to "this test, `doubleTap` cases", but item 6 requires a mutation case for a new `touch.ts` export item 1 allows → fixer item 2
- [major] Scope 5 thresholds — pass 4 dropped "respectively", so a ≥5/20 baseline could be "proven" by 0/5 with the fix (7.13 pairs them) → fixer item 3
- [minor] Scope 5 classifier — "a listener eating the second click" cannot give detail 1 (`detail` is browser-set; a swallowed click is a missing click) → fixer item 4
- [minor] Scope 5 bound — count per rep: each `[1, 1]` rep beyond the bound is a threshold measurement and never counts toward 5/5 or ≥5/20 → fixer item 5
- [minor] Scope 5 — the bound, 80 ms stamps and "never load alone" sit inside the e.g. parenthesis; apply them to any injection → fixer item 6
- [minor] Scope 2 — "(unfixed test-side:" → "(if not fixed test-side:" → fixer item 7
- [minor] Scope 3 — run-condition list lacks item 6 runs → fixer item 8
- [minor] AC — "this test's own checks (pointer events, the < 400 ms gap)" omits pointerType and coordinate checks → fixer item 9
- [minor] Scope 6 — the ×5 runs omit `doubleTap`'s failure self-tests that pin the report format → fixer item 10
### Default applied (technical)
- Beyond-bound counting per rep; injection constraints apply to every injection
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- Review log Pass 4 — "other-mode sighting" listed as Applied though skipped: fixed in this log (moved to Pass 4 Dropped)
- Scope 5 — a new sighting with greater lateness does not widen the bound: plan detail (unapplied minor)
- Scope 5 — a single in-bound `[1, 1]` below threshold counts as Reproduces: plan detail (unapplied minor)
- Scope 5 — "deterministic stamping" needs a concrete meaning since `doubleTap` already stamps: plan detail (unapplied minor)
- Description — 7.13's uninjected both-project drvfs diagnostic (this test passed) as before-evidence: plan detail (unapplied minor)

## Pass 6 — 2026-11-03
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 2, minor 5, decision-needed 0  |  Dropped in triage: 6 (plan detail, see Dropped; about 4 duplicates merged)
Words (docs): 1500 (5.4x pass 0; budget 1500)  |  Snapshot: story-deflake-the-helpers-spec-ts-doubletap-test-under-load.review-log.passes/pass6.md, fix diff pass6.fix.diff
Fixer: all 7 applied; Never reproduces reads "no injection (the stale-second-tap one run; load-only included) within the lateness bound reproducing `[1, 1]`"; item 2 "(unless fixed test-side, its B8 proposal …; either way an entry-11 AD-17 Touch spine-sync note)"; recurrence sentence moved after item 5's bullets; cuts: item 4's heavier-load reason, "or a reproduction" in the beyond-bound clause, the References plan-line parenthesis.
### Applied
- [major] Scope 5 Reproduces/Never reproduces — since pass 5 "never load alone" is one of the "within bounds" conditions, so a load-only injection (e.g. CPU throttling, or a report-enriching run under load) giving `[1, 1]` is not "in-bound": it neither takes Reproduces nor blocks Never reproduces, and the plan can reach `built` after the mode was shown (7.13 stops there) → fixer item 1
- [major] Description vs Scope 5 Never reproduces — the ticket says the build "answers why", but Never reproduces is met with no injection run at all, so repeating the known-passing conditions closes it → fixer item 2
- [minor] Scope 2 — "(unless fixed test-side: B8 proposal …" reads backwards (pass 5 intended "if not"); spine-sync note in both branches → fixer item 3
- [minor] AC — "with the … report" now reads as describing the excluded self-tests; reorder → fixer item 4
- [minor] Scope 5 — the recurrence sentence covers only Never reproduces; move it to cover every outcome → fixer item 5
- [minor] Scope 5 bound — "page touchstart" does not say which tap (the second / later) → fixer item 6
- [minor] Scope 1 — shared describe helpers in `e2e/helpers.spec.ts` (`installProbe`, `probed`) not stated non-editable, unlike `checkPoints` → fixer item 7
### Default applied (technical)
- Load-only or report-enriching injections giving `[1, 1]` within the lateness bound take Reproduces (stop), as in 7.13
- Never reproduces requires the stale-second-tap injection to have been run and recorded
- Spine-sync note for a proven stale-stamp limit in both branches
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- Scope 5 bound — clock offset between Node `Date.now()` and page `timeOrigin`; measure second-tap lateness minus first-tap lateness: plan detail (unapplied minor)
- Scope 5 Input-delivery — whether any test-side remedy can beat a stale-second-tap injection under item 2's pins: plan detail (unapplied minor)
- Scope 6 — the mutation case may be a new self-test with a longer real gap within the bound: plan detail (unapplied minor)
- Scope 2 — a permanent extra report field (real dispatch times) with both self-test regexes updated: plan detail (unapplied minor)
- Scope 4 — after-fix 0/50 and 0/3 run lighter than the sighting; the injection proof carries the claim: plan detail (unapplied minor)
- Scope 5/3 — "command" for the injection proof and per-rep failure records in injection runs: plan detail (unapplied minor)

## Pass 7 — 2026-11-03 (verify-only)
Reviewers: fix diff (pass6.fix.diff only)  |  Findings: major 0, minor 1, decision-needed 0  |  Dropped in triage: 0
Words (docs): 1500 (5.4x pass 0; budget 1500)  |  Snapshot: pass6.md (no fix pass)
### Applied
- none (verify-only)
### Default applied (technical)
- none
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none
### Unapplied (minor)
- Scope 5 Never reproduces — "the stale-second-tap one run" sets no lateness; a trivially late run would satisfy it; the plan runs it at about the sighting's lateness (~1700 ms) and records it (pass 6 item 2 only partly resolved)

## Result — converged after 7 passes
Majors per pass: 8, 6, 6, 3, 3, 2, 0. No open major; no decision-needed items. Words 279 → 1500 (budget 1500).

Unapplied minors (for the build's plan):
- Pass 3: AC Verify is file-level; the plan records `git diff <baseline> -- e2e/helpers/touch.ts` to show only item 1's code changed
- Pass 3: how to measure the stale-stamp threshold (e.g. bisect the injected lateness up to the bound, `--repeat-each=5` per step)
- Pass 3: a dev server already on :5173 is reused with CI unset; confirm none before each counted or isolated run
- Pass 4: the stale-second-tap injection's fix route is deterministic stamping only
- Pass 4: item 6 voids on any caller failure while item 4 voids on sightings; the strict reading stands
- Pass 4: tickets.toml entry 14 (description "stops for the owner", `after = [10]`, verify) is out of sync with the ticket; the orchestrator syncs it before the build
- Pass 4: a sighting other than `[1, 1]` is its own mode needing its own proof, else Reproduces (7.13 item 5)
- Pass 5: a new sighting with greater lateness does not widen the bound
- Pass 5: a single in-bound `[1, 1]` below the 5/5 or ≥5/20 threshold counts as Reproduces
- Pass 5: name the concrete "deterministic stamping" change (`doubleTap` already stamps)
- Pass 5: record 7.13's uninjected both-project drvfs diagnostic (this test passed) as before-evidence
- Pass 6: clock offset between Node `Date.now()` and page `timeOrigin`; measure second-tap lateness minus first-tap lateness
- Pass 6: whether any test-side remedy can beat a stale-second-tap injection under item 2's pins
- Pass 6: the mutation case may be a new self-test with a longer real gap within the bound
- Pass 6: a permanent extra report field (real dispatch times) needs both self-test regexes updated
- Pass 6: after-fix 0/50 and 0/3 run lighter than the sighting; the injection proof carries the claim
- Pass 6: define the injection proof's "command" and per-rep failure records in injection runs
- Pass 7: run the required stale-second-tap injection at about the sighting's lateness (~1700 ms)
