# Autopilot run 20260928-1455 — epic-scaffold-ci-deploy (hardening 1.10–1.11)

- Epic: epic-scaffold-ci-deploy; branch `epic-1-scaffold`; start commit 73511c8
- Authorisation: owner, methodology § Autopilot (2026-09-28); owner asked to proceed with the retro action items 2026-09-28.
- First run with the A10/A11 skill changes (5e59b0d).


## Paused — usage limit
1.10 ticket review stopped after pass 2 (both passes checkpointed in 15dfd42, b2f1e63); message: "resets 4:10pm (America/New_York)". Resumed 17:27 EDT from the log state line.

## 1.10 Local gate matches CI — done
What it adds: the local "ready" check (`npm run test:all`) now also builds the real app, checks its size and smoke-tests it, so it catches what CI catches. The offline cache lists each file once, the packaging checks run on the build that ships, and tests pin the Playwright version, the font and icon files, and the compression level.
Ticket review: 4 passes (7, 5, 1, 0 majors), converged at 2.57× words; nothing needed your input. Paused once at pass 2 for the usage limit and resumed cleanly from the checkpoint.
Build: built; commit 1d33960
Code review: quick, 1 pass, converged; 0 fixes applied (log review-loop/1-10-build.md)
Tests: all passing (test:all: 342 unit tests, size budget, dist-smoke 13, e2e 34, pwa 12)
Ref to fix upstream: none
Worth knowing: the build updated two AGENTS.md managed-block lines by hand (test:all contents, test:e2e:dist scope), which is accurate but belongs to the next bmad-project-context audit; AGENTS.md has no pointer yet to re-recording the font/icon hashes (it is in data/README.md).

## Stopped
Next ticket 1.11 (CI and deploy checks as tested scripts) is hitl: its last check needs the owner to push so CI and the main deploy run with the new checks. Waiting for the owner to authorise it.
Owner authorised 1.11 on 2026-09-28 (build, review, test:all, leave built; owner does the push and the gate-4 check). Resumed; ticket pulled from tickets.toml entry 11 (564d2c2).

## 1.11 CI and deploy checks as tested scripts — done
What it adds: the checks CI and the deploy run (the flaky-test report and the "is the live site serving the right cache headers" check) are now real scripts with their own tests instead of shell code inside the workflow files. A test checks the hosting rules file (`_headers`, `.assetsignore`, `wrangler.jsonc`) before anything deploys; the live check now also covers the dictionary and the card font; CI lints its own workflow files with a pinned actionlint.
Ticket review: 5 passes (10, 6, 4, 1, 1 majors), converged; nothing needed your input. The stub ticket grew 167 → 1602 words; one open major (the deploy-check spawn test must also run `verify`) and the unapplied minors were handed to the build, which built them.
Build: built; commit 4fa949e. Local proofs: actionlint 1.7.12 exit 0, `deploy-check.mjs verify` on the real dist/ passes, `wrangler deploy --dry-run` succeeds.
Code review: quick (build review left no high/medium), 1 pass, converged; 0 fixes applied (log review-loop/1-11-build.md)
Tests: all passing (test:all: 414 unit tests, size budget, dist-smoke 13, e2e 34, pwa 12)
Ref to fix upstream: none
Worth knowing: the real https path, the real wrangler log format and Cloudflare's actual responses are first exercised at your push (gate 4). One unapplied minor: if every connection attempt to the live site fails at once, the post-deploy failure line can print an empty error message (scripts/deploy-check.mjs request catch). Deferred: AGENTS.md does not yet mention running actionlint locally when editing workflows (next bmad-project-context audit). The actionlint image is pulled by tag from Docker Hub.

## Skill notes (first run of the updated review-loop and epic-autopilot, 5e59b0d)
- epic-autopilot: assumes the ticket file exists; a tickets.toml entry with no file needs `tickets.py pull` first (done by hand, 564d2c2).
- epic-autopilot: rule 4 stops before any hitl ticket; there is no path for "owner authorised a hitl ticket whose only hitl part is the final check". Handled as rule 4's build-and-leave-built path.
- epic-autopilot: the code log slug `<ref>-build.md` with ref `1.11` gives `1.11-build.md`, but existing logs are `1-10-build.md`; renamed to `1-11-build.md`. The skill should say dots become dashes.
- epic-autopilot / review-loop: a docs loop can converge with one open major (two passes ≤ 1 major), but the Step A JSON has no field for it (late_majors must be `[]` when converged) and Step B's prompt does not forward the review log's open major or unapplied minors to the build. Forwarded by hand in the build prompt.
- epic-autopilot / review-loop: quick depth ran one correctness lens, one reviewer, on a ~2.2k-line medium-risk diff and converged at pass 1 with zero majors; no verification-gap or intent lens ran. Consider at least two lenses (or a minimum of 2 passes) in code mode, or thorough for `risk = "medium"`.
- review-loop: a converged run with no fix pass leaves the log uncommitted (no checkpoint commit fires); Step D.2 covers it, so this is fine but the skill's "Do not commit" versus checkpoint wording confused the step.
- review-loop: the growth budget (~2.5× pass-0 words) does not fit a stub ticket being fleshed out (167 words); the step used ~1500 and logged it. The skill could allow a stated budget for stubs.
- review-loop: unclear whether minors still go to the fixer once a document is over its growth budget; the "run it or mark it unverified" rule got applied to design statements that cannot be run; the reviewer prompt template has no slot for target context; the Applied-line log format duplicates the fixer's summary; docs mode sends decision-needed items to an open-questions table that tickets do not have.
- review-loop (code mode): gate commands run "yourself" only after a fix, but the result JSON needs test/lint/check status; the step ran them at HEAD anyway.
- bmad-build-auto: its commit (4fa949e) has no Claude-Session trailer.

## Stopped
1.11 is built and verified locally (plan status built, not done). Gate 4 is yours: push `epic-1-scaffold` and check CI is green including actionlint and the flaky-report summary; then merge to `main` and push (as in 1.9) and check the Deploy run's post-deploy log shows every `ok:` line, including the dictionary and the woff2. After that, mark 1.11 done (`uv run _bmad/method/scripts/tickets.py mark 1.11 done`) and run `/bmad-retrospective` if wanted: no tickets remain in the epic.

## Gate 4 — 1.11 (owner asked the orchestrator to push and mark done, 2026-09-28)
Pushed `epic-1-scaffold` (79b7497): CI run 36501094701 green, including actionlint and the flaky report. Owner approved fast-forwarding `main` to 79b7497 and pushing: CI run 36501483908 green, Deploy run 36501684700 green; the post-deploy log shows every `ok:` line, including the dictionary (`en-n6QSuDF0.txt`) and the woff2 (`wordcell-serif-C6H6CwWY.woff2`) as immutable. 1.11 marked done.

## Run complete
Tickets 1.10 and 1.11 done. No tickets remain in the epic: next is `/bmad-retrospective` if wanted.
