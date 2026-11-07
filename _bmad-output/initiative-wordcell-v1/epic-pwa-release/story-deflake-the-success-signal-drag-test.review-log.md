# Review log — story-deflake-the-success-signal-drag-test.md (ticket 7.13)

State: pass 7: done

Mode: docs, thorough, max 7, budget 1500 words. Pass 0: 220 words, copy `story-deflake-the-success-signal-drag-test.review-log.passes/pass0.md` (HEAD 95b454c).

## Pass 1 — 2026-11-03
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 8, minor 6, decision-needed 0  |  Dropped in triage: 1 (about 20 duplicates merged)
Words (docs): 888 (4.0x pass 0; budget 1500)  |  Snapshot: story-deflake-the-success-signal-drag-test.review-log.passes/pass1.md, fix diff pass1.fix.diff
Fixer: all 14 applied, no conflicts; new `## Scope` items 1–6; Playwright 1.63.0 `npx playwright test --help` confirms `--grep`, `--project`, `--repeat-each`, `--retries`; suites not run. Noted: tickets.toml entry 13 description/verify not synced (outside the target; for the orchestrator).
### Applied
- [major] Description, edit boundary — `e2e/helpers/drag.ts` holds only the residue checks; the drag is driven by gestures.ts, touch.ts, board.ts, lifecycle.ts; scope of "its helpers" and of config unclear → fixer item 1
- [major] Description/AC — nothing forbids weakening the test (title, dragged steps, literals, per-step checks, skip/fixme/retries/slow, config timeouts) → fixer item 2
- [major] AC — no standard of proof for a cause; 0/50 after proves nothing when before is 0/50 → fixer item 3
- [major] Reproduction — every sighting was under full-suite load, only the isolated run is required; no CI-unset/retries-0 pin; 7.10's 0/3 counted-run rule dropped → fixer item 4
- [major] AC outcomes — no branch for reproduces-without-cause, for a `src/` cause (CAP-8 routes it to a fix ticket under technical defaults), or for an input-delivery/environment cause → fixer item 5
- [major] Evidence — "evidence examined" undefined; the one surviving failure output (.autopilot/20261014-2230/6.1-T-attempt1.log:1361, `validateAndRetarget` :383 via :475, cursor `composing` not `place` after step 4) omitted; where the record goes undefined → fixer item 6
- [major] AC `test:all` — no rule for a final run failing on the open D-64/D-71 flakes, nor for this test failing in a later `test:all` → fixer item 7
- [major] Fix path — a changed shared helper gets no `e2e/helpers.spec.ts` case or repeat count (AGENTS.md Files; 7.10 item 5); `test:screens` when a screens spec imports it → fixer item 8
- [minor] Frontmatter — `hitl: false` missing (tickets.toml entry 13) → fixer item 9
- [minor] Sightings — "0/3" understates 7.10's 0/15 across five trees → fixer item 10
- [minor] "the ticket closes" reads as the build marking done; plan reaches `built`, owner/autopilot marks done → fixer item 11
- [minor] No recurrence rule after a no-cause close → fixer item 12
- [minor] 13 and 14 may both touch `e2e/helpers/touch.ts`; order → fixer item 13
- [minor] References — constraint refs (methodology DoD, AGENTS.md Running and verifying, AD-17) → fixer item 14
### Default applied (technical)
- Edit boundary — the spec plus any `e2e/helpers/` module it imports, plus `e2e/helpers.spec.ts`; `src/` and Playwright config out
- Cause proof — temporary reverted test-side injection reproducing the sighted failure mode before the fix and passing after
- Load counts — three counted `npx playwright test --project=android` runs, CI unset, retries 0, before and after; 0/3 after a fix
- `src/` cause — no `src/` edit; plan stops short of `built` with a B8 fix-ticket proposal (CAP-8); owner only if the player would notice
- Final `test:all` — one rerun at the same commit when the only failures are D-64's or D-71's titled tests; any failure of this test after the fix counts against it; any other failure stops
### Dropped
- "No rerun at all for other flakes" (ref alignment) — superseded by the one-rerun default for the two named open flakes, which have their own tickets

## Pass 2 — 2026-11-03
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 8, minor 10, decision-needed 0  |  Dropped in triage: 1 (about 17 duplicates merged)
Words (docs): 1383 (6.3x pass 0; budget 1500)  |  Snapshot: story-deflake-the-success-signal-drag-test.review-log.passes/pass2.md, fix diff pass2.fix.diff
Fixer: all 17 applied, no conflicts; item 9 cites log :1404 (trace path) not :1407; item 13's `git diff --name-only HEAD~1 -- . ':(exclude)_bmad-output'` ran (exit 0); `desktop` project name confirmed (playwright.base.ts:34); test commands reuse verified flags, suites not run.
### Applied
- [major] Scope 5 proof — one rule serves cause-found and fix-proven, so the `src/` and unfixable input-delivery branches can never meet it; no run counts; an injection that suppresses the input (symptom) instead of modelling the cause would "pass" a re-tap fix → fixer item 1
- [major] Scope 5 outcomes — "never reproduces" (built) and "an injection shows the mode" (stop) overlap; the input-delivery "otherwise … built" leaves a known flake in the suite, against entry 13's verify and B8 → fixer item 2
- [major] Scope 2/5 classification — no rule for a cause fitting several branches (player-reachable vs CDP-only timing; `tapAt`'s `touchscreen.tap`, the `doubleTap` timestamps precedent); item 2's cause-gated timeout allowance vs item 5's "not wall time" → fixer item 3
- [major] AC / Scope 4 — "after-fix failure" has no consequence; this test failing in a final `test:all` with no fix is unrouted → fixer item 4
- [major] Scope 2/4/6 — `validateAndRetarget`, `tapPrimary`, `expectStep`, `expectSaved`, `open` are shared with the tap-only R-73 test (epic Done when 2, :397; called at :420 and :475), unprotected and unrepeated → fixer item 5
- [major] Scope 4 / AC — other tests failing in a counted run are unrouted; a helper this ticket changes that D-64's or D-71's test calls (`doubleTap`) would have its regression masked by their one-rerun rule → fixer item 6
- [major] Scope 4 — after-fix counts not tied to the shipping tree; 7.10 item 6's re-run rule for later commits (review fixer included) dropped → fixer item 7
- [major] Scope 3/5 — only the 6.1 sighting's mode is known (7.9 :108 says "drag step"); no rule for a different failing step or error → fixer item 8
- [minor] Scope 3 — 6.1 log is a `test:all` run, trace was in repo-local `test-results/` (OS-temp `outputDir` came with 09285b2, 2026-10-22); "did not dispatch" overstates (not dispatched or dispatched over 5 s late) → fixer item 9
- [minor] Scope 3 — trace copy destination unnamed → fixer item 10
- [minor] Scope 2 — `expectNoResidue`/`expectDragging` are DOM residue checks, not stored-Session; add `expectSaved` → fixer item 11
- [minor] Scope 2 — `test.slow` banned while a cause-gated per-test timeout is allowed → fixer item 12
- [minor] Scope 1 — "code comments" vs "`src/` not editable" ambiguous; no `git diff --name-only` boundary check → fixer item 13
- [minor] Scope 6 — `test:screens` without Docker: stop and report (7.10 AC) → fixer item 14
- [minor] Scope 6 — repeats only on android although `tapAt` has a desktop branch → fixer item 15
- [minor] Description — the 7.14 hand-off is not recorded where 7.14 sees it; `e2e/helpers.spec.ts` edits also affect 7.14 → fixer item 16
- [minor] Scope 5 `src/` — cite 7.10 item 2 ("for the owner or orchestrator to apply") as the precedent → fixer item 17
### Default applied (technical)
- Proof — cause found: a temporary, reverted test-side injection modelling the named mechanism (never suppressing the input) reproduces the mode; fix proven: the same injection passes with the fix; deterministic 5/5 fail then 0/5, probabilistic ≥1/20 in the mode then 0/20, same command both sides
- `src/` cause — cause-found proof only; the fix proof goes with the fix ticket
- Unfixable input-delivery cause — B8 fix-ticket proposal (or 7.14 note if D-71's mechanism), plan stops short of `built`
- Classification — reachable with a real player's input → `src/`; only from CDP/Playwright input timing → input-delivery, fixable test-side by page-state waits or deterministic event timestamps; a longer poll/expect timeout never fixes input-delivery
- After-fix failure — voids the fix, recorded, no rerun, plan stops short of `built`; with no fix, a failure is a reproduction
- Shared functions — item 2 covers both R-73 tests; a change to a function both call repeats both ×5
- Counted runs — a D-64/D-71 failure is recorded and the run counts if this test ran and passed; any other failure stops; a helper change those tests call: no rerun, both ×5
- Counts tree — the last commit changing anything outside `_bmad-output/`; later such commits re-run item 4
- Trace copies — outside the repo, `~/wordcell-traces/7.13/`, path cited in the plan
### Dropped
- tickets.toml entry 13/14 sync (fix diff, ref alignment) — outside the target; recorded in the result for the orchestrator

## Pass 3 — 2026-11-03
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 8, minor 7, decision-needed 0  |  Dropped in triage: 2 (about 5 duplicates merged)
Words (docs): 1497 (6.8x pass 0; budget 1500)  |  Snapshot: story-deflake-the-success-signal-drag-test.review-log.passes/pass3.md, fix diff pass3.fix.diff
Fixer: all 14 applied, no conflicts; item 3 also names a still-disabled control (the finding's own case); item 9 shortened; unrequested cuts for budget (Description 7.14 hand-off, Scope 1 "code comments", Scope 3 trace and 7.9 notes); `SWALLOW_MS = 300` and `tapPrimary` before `glidesSettled` (success-signal.spec.ts:381-382) confirmed; no commands added or changed.
### Applied
- [major] Scope 2 last sentence — "wait change" only for a test-side cause bans item 5's prescribed page-state waits (all four lenses) → fixer item 1
- [major] Scope 2 Never — bans any code change to the dragged steps and the check functions, so a page-state wait after a drop or a fix inside `expectStep` is barred; protect what is dragged and asserted, not the code → fixer item 2
- [major] Scope 5 classification — "player-reachable → `src/`" catches behaviour the refs prescribe (AD-12 click swallow `SWALLOW_MS`, a disabled Validate, a running glide; `tapPrimary` taps with no `glidesSettled`) → fixer item 3
- [major] Scope 4/6 — pass 2 item 6 fixed only in the AC: a counted-run or item 6 ×5 failure of D-64's/D-71's test after this ticket changed a helper it calls is still tolerated/unrouted → fixer item 4
- [major] Scope 6 — "a new or changed helper gets an `e2e/helpers.spec.ts` case" cannot be met for spec-local functions (`validateAndRetarget`, `expectStep`), which helpers.spec.ts cannot import → fixer item 5
- [major] Scope 5 modes — an injection failing in another step would open a new mode (forcing the no-cause stop) or count against the 0/N with the fix → fixer item 6
- [major] Scope 5 proof — CPU throttling is a load condition, not a mechanism, so "cause found" and "an injection shows the mode but no cause" overlap; ≥1/20 then 0/20 passes a no-op fix about a third of the time at a 5 % rate → fixer item 7
- [major] Scope 4 vs 5 — unclear whether a candidate fix failing its injection proof is "a failure after a fix" (stop, no second attempt) or development iteration → fixer item 8
- [minor] Scope 4/AC — a tap-only R-73 failure falls under "any other test … stops" and is never evidence for this ticket → fixer item 9
- [minor] Scope 5 — with two modes, whether a proven fix for one still lands when the other stops → fixer item 10
- [minor] Scope 3 — "(not dispatched, or dispatched late)" narrows the evidence (`expectStep` reads the stored Session; a late save fits too): cut → fixer item 11
- [minor] Scope 1/2 — "imports" direct vs transitive; item 2's config ban repeats item 1 → fixer item 12
- [minor] Scope 4 — "at the last commit" forces a code-only commit before the records; 7.10 recorded a tree id → fixer item 13
- [minor] Scope 3 — the 6.1 tree predates helper/gesture changes (169c6bc … 61f5419); the plan names the 6.1 commit and diffs the failing path → fixer item 14
### Default applied (technical)
- Item 2 — timeouts and fixed delays (`waitForTimeout`) cause-gated; page-state waits allowed for any proven cause; the ban protects which steps are dragged and what the checks assert
- Classification — behaviour no ref prescribes, reachable by a real player → `src/`; input timed into a prescribed window or a running glide → test-side
- D-64/D-71 — after this ticket changes a helper their test calls, any failure of it (counted, item 6, `test:all`) stops
- Item 6 — `e2e/helpers.spec.ts` case only for `e2e/helpers/` functions; spec-local changes rely on the ×5 repeats
- Modes — opened only by uninjected runs; 0/N with the fix means no failure of any kind
- Proof — load injections (CPU throttling) show a mode but never prove a cause; probabilistic threshold ≥5/20 without, 0/20 with
- Injection-proof runs are development runs; item 4's void rule applies from the first after-fix item 4 run
### Dropped
- Never-reproduces requires hypotheses for the 6.1 mode (adversarial, stretch) — item 3 already starts from that sighting; over-budget addition
- 7.14 builds first (entry 14 `after = [10]`) — orchestrator's tickets.toml concern; noted in the result

## Pass 4 — 2026-11-03
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment (late bar)  |  Findings: major 5, minor 9, decision-needed 0  |  Dropped in triage: 4 (about 6 duplicates merged)
Words (docs): 1493 (6.8x pass 0; budget 1500)  |  Snapshot: story-deflake-the-success-signal-drag-test.review-log.passes/pass4.md, fix diff pass4.fix.diff
Fixer: all 13 applied, no conflicts; item 4 drops the "(neither half)" tag; item 13 applied within budget; no commands added or changed.
### Applied
- [major] Scope 5 classification — "into a running glide is test-side" contradicts AD-14 ("Input during an animation completes it and acts on the settled state", spine :704); a Validate tap lost mid-glide would be hidden by a `glidesSettled` wait → fixer item 1
- [major] Scope 2 — "page-state waits may fix any proven cause" contradicts item 5's `src/` outcome (no test fix) → fixer item 2
- [major] Scope 4 — the void rule starts at "the first after-fix item 4 run", so an uninjected failure in item 6's ×5 runs before it permits the forbidden second attempt → fixer item 3
- [major] Scope 5 outcomes — no route for a mechanism injection showing the mode below the proof threshold, nor for a proven test-side cause whose candidate fix never passes its proof → fixer item 4
- [major] Scope 5 modes — "seen in an uninjected run" / "any `test:all`" can include historical sightings (6.1, 7.9 "drag step"), so the never-reproduces close could never be reached → fixer item 5
- [minor] Scope 5 — "the AD-12 click swallow" → R-65 (the spine's AD-12 text has no swallow; click-swallow.ts cites R-65) → fixer item 6
- [minor] Scope 5 — owner asked "only if the fix would change what the player sees or does" catches every `src/` fix; → "would change prescribed behaviour" → fixer item 7
- [minor] Scope 5 — cut "(the `doubleTap` precedent)" (D-71 failed despite CDP stamps) → fixer item 8
- [minor] Scope 1 — the parenthetical reads as complete (omits `blocking.ts`, `restore.ts`): "e.g." → fixer item 9
- [minor] Scope 6 — "a helper a `*.screens.spec.ts` imports" → "a module" → fixer item 10
- [minor] AC — "the item 5 outcome that applies" → "each item 5 outcome that applies" (several modes) → fixer item 11
- [minor] Scope 3 — "Only this sighting's failing step is known (7.9 plan :108: "drag step"; others none)" self-contradicts → reword → fixer item 12
- [minor] Scope 4/AC — a later change re-runs item 4 but not `test:all` (7.10 re-ran both per tree) → fixer item 13 (only with offsetting cuts)
### Default applied (technical)
- Void rule — a candidate fix may be revised until its injection proof passes; from its first uninjected run on, any failure voids
- Modes and never-reproduces — counted over this build's uninjected runs and `test:all` only; historical sightings are starting evidence
- Unrouted cases — a sub-threshold injection, or a cause found with no proven fix, takes the no-cause outcome
### Dropped
- Tap-only failure after a shared-function change should void the fix (edge, minor) — the plan already stops short of `built`; over budget
- Diff `playwright*.ts` against the 6.1 tree (adversarial, minor) — adds words; evidence procedure belongs in the plan
- "directly imports at the baseline" (adversarial, minor) — adds words; unlikely
- Item 4 "no outcome" stretch duplicates — merged into items 3–5

## Pass 5 — 2026-11-03
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment (late bar)  |  Findings: major 5, minor 10, decision-needed 0  |  Dropped in triage: 5 (about 3 duplicates merged)
Words (docs): 1500 (6.8x pass 0; budget 1500)  |  Snapshot: story-deflake-the-success-signal-drag-test.review-log.passes/pass5.md, fix diff pass5.fix.diff
Fixer: all 13 applied, no conflicts; item 4 also updates the Description and "no `src/` or config edit"; item 9 merged into one shorter threshold sentence; cuts in Scope 2 opening and Scope 4 wording; no commands added or changed.
### Applied
- [major] Scope 5 — a tap-only R-73 mode with the drag test never failing reaches "Never reproduces" (`built`), and "the no-cause outcome" names no bullet → fixer item 1
- [major] Scope 4 — a voided fix's edits: reverted or committed is unstated → fixer item 2
- [major] Scope 4 — a later change (review fixer included) re-runs only item 4 and `test:all`, not item 5's fix proof or item 6's checks → fixer item 3
- [major] Scope 5 — no route for a cause whose fix needs a file item 1 bars (e.g. dev-server or Playwright config) → fixer item 4
- [major] Scope 2 — "unless the recorded cause shows it asserted the wrong thing" lets an unattended builder weaken an R-73 check on judgment; anchor to R-73 and the spec header → fixer item 5
- [minor] Scope 5 — pass 4 dropped "only a load", losing pass 3's default that load injections never prove a cause → fixer item 6
- [minor] Scope 5 `src/` bullet — "prescribed behaviour" gate can never fire; CAP-8 routes owner calls by functionality or UX → fixer item 7
- [minor] Scope 5 — mode key: "of each R-73 test" → fixer item 8
- [minor] Scope 5 — thresholds: "in the mode" governs both; anything short of 5/5 takes the 20-run threshold → fixer item 9
- [minor] Scope 5 — cut "(e.g. the R-65 click swallow)" (not on this path) → fixer item 10
- [minor] Scope 4 — the void rule names "this test"; a tap-only failure after a shared-function fix should void too: "any R-73 failure" → fixer item 11
- [minor] Scope 3 — the 5 s poll began after `glidesSettled` passed, not at the tap (spec :381-383) → fixer item 12
- [minor] Scope 3 — run-condition list lacks item 6 → fixer item 13 (budget permitting)
### Default applied (technical)
- Voided fix — reverted, kept only as a recorded diff in the plan
- Later changes — re-run items 4–6 and `test:all`
- Barred-file cause — "`src/` or config cause": no edit, fix-ticket proposal, stops short of `built`
- Assertion exception — only when the check asserts something R-73 and the spec header do not prescribe
### Dropped
- Name the 6.1 tree as 03824f1 (adversarial) — inferred from timestamps; evidence procedure belongs in the plan
- Counted runs lighter than `test:all` load; F-13 likely the 6.1 sighting; record the injection revert diff; pre-fix unrelated flake stops (adversarial stretches) — plan procedure or conservative default, no ticket change at budget

## Pass 6 — 2026-11-03
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment (late bar)  |  Findings: major 5, minor 9, decision-needed 0  |  Dropped in triage: 5 (about 4 duplicates merged)
Words (docs): 1500 (6.8x pass 0; budget 1500)  |  Snapshot: story-deflake-the-success-signal-drag-test.review-log.passes/pass6.md, fix diff pass6.fix.diff
Fixer: all 9 applied, no conflicts; other "R-73 failure" uses left, now defined by item 2; extra cuts (AC "after the fix", Scope 3 "outside the repo,", two Description words); no commands added or changed.
### Applied
- [major] Scope 4 vs 5 — pass 5's "any R-73 failure … voids and reverts it" contradicts "proven fixes for other modes still land" when an unproven mode recurs → fixer item 1
- [major] Scope 2 — pass 5's anchor ("something R-73 and the spec header do not prescribe") makes the AD-12 residue checks (`expectNoResidue`, `expectDragging`, drag.ts:3) removable → fixer item 2
- [major] Scope 2/4/5/AC — "R-73 failure" / "non-R-73 test" read literally cover ~30 other e2e tests whose titles carry R-73 (surfaces-success, place, board-phases, game-store, lifecycle, tile-tap) → fixer item 3
- [major] Scope 5 — with no failure in this build, no mode exists ("opening no mode"), yet the proof and Never-reproduces speak of "the mode" → fixer item 4
- [major] Scope 5 classification — "onto a still-disabled control is test-side" also covers a control disabled for a reason no ref prescribes (a `src/` bug a `toBeEnabled()` wait would hide); "prescribed window" unanchored after the R-65 cut → fixer item 5
- [minor] AC — "`npm run test:all` is green" unconditional though stop-short outcomes can have a red suite → fixer item 6
- [minor] Scope 4 — a re-run fix proof failing after a later change is unrouted ("any run but an injection") → fixer item 7
- [minor] Scope 2 — the shared-function list reads as exhaustive (also `expectStoredCursor`, `expectLanded`, `confirm`, `tapAt`): cut; protected checks → "any check function" → fixer item 8
- [minor] Scope 5 — "D-71's mechanism" → "D-71's late CDP delivery" → fixer item 9
### Default applied (technical)
- Void rule stays strict; the "still land" parenthetical is cut
- "R-73 test" means the two tests in `e2e/success-signal.spec.ts`
- Earlier sightings open modes an injection may model, needing no proof of their own
- Disabled-control and window cases are test-side only when a ref prescribes them
### Dropped
- Isolated command grep `"Success signal"` for a tap-only fix (edge, adversarial minors) — changes a literal command; the counted runs and item 6's ×5 cover the tap-only test; for the plan
- Void-revert triggers no re-run; new `e2e/helpers/` export spine-sync note; diff `playwright*.ts` against the 6.1 tree; `test:screens` condition vs DoD (adversarial minors) — plan procedure or technical default kept

## Pass 7 — 2026-11-03 (verify-only)
Reviewers: fix diff (pass 6 diff only)  |  Findings: major 1, minor 1, decision-needed 0  |  Dropped in triage: 0
Words (docs): 1500 (6.8x pass 0; budget 1500)  |  Snapshot: pass6.md (no fix pass)
### Open (not fixed, verify-only pass)
- [major] Scope 4 void rule — pass 6's "(any run but a pre-proof injection)" makes the without-fix half of item 5's proof, which must fail and which item 4 re-runs after any later change ("re-runs items 4–6"), void and revert a valid fix → proposed: "(with the fix, pre-proof injections aside)" or equivalent: only runs with the fix applied count
- [minor] Scope 5 — the pass 6 cut of "(proven fixes for other modes still land)" leaves pass 3 item 10's answer only implied; e.g. "else only that mode takes the Reproduces outcome"

## Result — capped at 7 passes (open majors: Scope 4 void rule counts the post-proof without-fix injection runs)
Majors per pass: 8, 8, 8, 5, 5, 5, 1. Words 220 → 1500 (budget 1500). Decision-needed: none. Technical defaults applied: about 40 (see each pass).
Persisting area: the outcome-routing rules of Scope items 4–5 (modes, proof halves, void rule, which tests count) kept yielding contract majors from passes 4–6 as each fix exposed a neighbouring case; no ref defines a flake-close protocol (7.10 items 5–6 and the D-70 precedent are the nearest), so the ticket carries it alone at the word budget.

Unapplied minors (for the build's plan or a later loop):
- Scope 5 — restore "proven fixes for other modes still land" for a mode that does not recur (pass 7)
- Scope 4 — isolated command greps only the drag test; a tap-only mode's fix gets no isolated 0/50 (passes 6) — plan: also run `-g "tap-only move" --repeat-each=50`
- Scope 4 — a void-revert to the baseline triggers no re-run (pass 6, plan default)
- Scope 3 — diff `playwright*.ts` as well as the failing path against the 6.1 tree; 6.1 tree likely 03824f1 (passes 4–6)
- Scope 3 — F-13 and the 6.1 log are probably one sighting; counted android-only runs are lighter than `test:all` load (pass 5)
- Plan — record `git diff` after each injection revert; record any new `e2e/helpers/` export as an entry-11 AD-17 Touch spine-sync note (passes 5–6)
- Scope 4 — tap-only failure after a shared-function change voids the fix (now covered by "any R-73 failure"; confirm in plan)
- Orchestrator — sync tickets.toml entry 13 (description, verify, references) to the ticket and add 13 to entry 14's `after` plus the touch.ts / helpers.spec.ts hand-off note (passes 1–4)
