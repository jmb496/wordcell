# Review log — story-deflake-the-success-signal-drag-test.md (ticket 7.13)

State: pass 2: done

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
