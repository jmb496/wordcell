---
title: "Owner's post-merge v1 release: production install, 1.0.0 and ten games (7.12)"
type: 'chore'
ticket: 12
created: '2026-11-07'
baseline_revision: '899c7da556505e8b65c909a2acd53a6f4689bd79'
status: 'in-progress'
route: 'oneshot'
route_source: 'auto'
review: ''
review_source: ''
lenses_ran: []
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-pwa-release/story-owner-s-post-merge-v1-release-production-install-1-0-0-and-t.md'
  - '{project-root}/_bmad-output/specs/spec-epic-7-pwa-release/release-checklist.md'
warnings: []
deferred: []
---

<intent-contract>

## Intent

**Problem:** v1 is merged and deployed (`dcd2df0`) but not released: the production install, the 1.0.0 release commit, G3's update read to it, the ten-game run, the §6 evidence and Jared's declaration remain (ticket 7.12, CAP-10). Most of it is Jared's phone work; this run (Jared's authorisation 2026-11-07, "please proceed") does only what the agent can before it.

**Approach:** Phase 1 (this run): record the plan and the no-clear deviation; sync SPEC CAP-10 and `release-checklist.md` to the ticket's agent rules (close-out wording default); fast-forward `pwa-release` to `origin/main`; make the release commit (F11) as the branch head; run the AGENTS.md pre-run check and `npm run test:all` there; stop `in-progress` for Jared's production reads and push. Later phases (G3, ten games, §6.1, §6.7, audits' post-merge deltas, gap list, waiver, declaration, done marks) follow the ticket's Agent rules after he reports back.

</intent-contract>

## Run steps

Phase 1 (this run):
- [x] P1-1 This plan, the no-clear deviation (Design Notes) and the owner-wait note, committed before the release commit.
- [x] P1-2 `SPEC.md` CAP-10 synced: spoiled read rests on the tailnet G3 pass (redone once only if a post-merge fix deploys anyway; a second consecutive one routes as G3 says); evidence where `release-checklist.md` Evidence kinds say (checklist not edited for evidence); Done when 1 and 3 waiver (retro A10); the agent marks done on Jared's recorded word.
- [x] P1-3 `release-checklist.md` synced: §6.7 row (Linux-filesystem checkout of `origin/main` after fetch, after the pre-run check, before the gap list; over budget re-run once idle, still over a fix ticket, F11); step 5 gains the measurement; Evidence kinds, Done when 3 row and step 6 name the Done when 1 and 3 waiver.
- [x] P1-4 Epic Notes: Jared's run authorisation line (2026-11-07).
- [x] P1-5 `git fetch origin`; `git merge --ff-only origin/main` (failure: stop for Jared). Done 2026-11-07: "Already up to date" (`origin/main` = dcd2df08fb21617eddbb6d103f7f4f04427b0b17, an ancestor of `pwa-release`); repeated before the release commit.
- [ ] P1-6 Release commit: `npm version 1.0.0 --no-git-tag-version`; diff is only `package.json` and `package-lock.json`; commit `chore(release): 1.0.0` (no tag; tagging and pushing are Jared's).
- [ ] P1-7 Pre-run check (`uptime`, `mount | grep ' / '` shows `rw`), then `npm run test:all` at the release commit; result recorded under Implementation Notes, left uncommitted (the release commit stays the head).

Later phases (after Jared's reports; ticket Agent rules govern): G1, G2, G4 recorded in the epic Notes with footers; Jared pushes `pwa-release:main`; CI and Deploy of the release commit checked; G3 to `1.0.0 (<sha>)`; ten qualifying games and §6.1; any post-merge fix per F11/F12 and the restart rule; §6.7 measured; §6.4/§6.6 post-merge deltas; one evidence line per §6.1–§6.9 and Done when 1–3 (section `## Evidence`, added then); the accepted-gap list (Q-50, G20, the retro's other accepted §6.6 gaps, any other checked-not-passing row) and Jared's waiver in the initiative Notes; declaration; `tickets.py mark 7.12 done`, then epic and initiative; closing push's CI/Deploy check.

## Implementation Notes

Oneshot: Phase 1 is five files of wording plus a version bump (well under 100 lines); no `src/` change.

- P1-2 `SPEC.md` CAP-10 (one success line): the spoiled-read clause, the evidence-location clause and the closing marks, aligned to the ticket's Agent rules and Acceptance Criteria (technical default, close-out wording; no behaviour, gameplay or UX change).
- P1-3 `release-checklist.md`: intro (evidence location), Evidence kinds waiver sentence, §6.7 row, Done when 3 row, Production sequence steps 5 and 6. Step 4's spoiled-read wording ("redone at the next deploy or rests on the tailnet G3 read") already fits the ticket and is unchanged. No test reads these files (`grep` over `src`, `e2e`, `scripts`).
- P1-4 epic Notes: one Decision line recording "please proceed" (deferred minor from the ticket review's pass 2).
- Review-log minors of the ticket's review loop (Result) that are procedure, not wording, are applied in the later phases as the ticket's Agent rules read them; none changes gameplay, UX or an owner decision.
- No step-04 review this run: the plan stops at an owner wait (as 7.11 Phase 1 did); the review runs when the plan can go `built`.

## Design Notes

**No-clear deviation (ticket Agent rules; `docs/device-testing.md` Clearing site data).** That section starts every fresh-install read from cleared site data. On production there is no seed page and nothing to seed, so G1, G2 and G4 are read without clearing site data: Jared installs from the production URL keeping any site data the origin already has (ticket Owner step 1). A game already stored on the origin is played on, not cleared; G4's boundaries are reached by play. The deviation applies to the production reads of 7.12 only; the tailnet procedure is unchanged.

**Footers.** G1, G2 and G4 count on `0.0.0 (dcd2df0)` (the merged pre-release build, unless a fix lands first) or on `1.0.0 (<sha>)` (F12). The release commit's `<sha>` is its short SHA, which the deployed footer shows once Jared pushes it as the `main` head.

**Release commit as head.** Every Phase 1 record commit lands before the release commit; the `test:all` line after it stays uncommitted and rides along with the next record commit after the 1.0.0 push (ticket Agent rules).

## Verification

**Commands:**
- `git diff --name-only HEAD~1 HEAD` at the release commit -- expected: exactly `package-lock.json` and `package.json`.
- `git log -1 --format=%s` -- expected: `chore(release): 1.0.0`; `git rev-list origin/main..HEAD` ends with it.
- `npm run test:all` -- expected: exit 0 (lint, check, unit, build within 600,000 bytes, `test:e2e:dist`, `test:e2e`, `test:e2e:pwa`).

## Owner-wait note

**Phase 1 (2026-11-07): plan stays `in-progress`, waiting for Jared.** This plan, the CAP-10 and checklist syncs and the epic Notes line are committed; the next commit on `pwa-release`, `chore(release): 1.0.0`, is the release commit (F11) and the branch head. Its `npm run test:all` result is recorded under Implementation Notes after it, uncommitted, so the release commit stays the head; that line rides along with the next record commit after the push. Nothing is pushed.

Jared's next steps, in order (the orchestrator guides each read on the phone, step by step):
1. **Production reads, before any push.** Uninstall the tailnet WordCell. Open https://wordcell.jmb496.workers.dev in Chrome and install it through Chrome's own install option, keeping any site data. Then the guided checks: install (G1), offline launch after the readiness step (G2), and force-stop restore (G4; its win-then-undo case may wait for a won game in the ten-game run). Read the menu footer for each; it should say `0.0.0 (dcd2df0)`.
2. **Push the release commit** once the orchestrator says G1 and G2 are recorded: `git push origin pwa-release:main` (a fast-forward; not yet run, so unverified). You may tag `v1.0.0` on it first. Then keep WordCell and the URL closed until the orchestrator says Deploy is green.
3. **Update read (G3)** after Deploy is green, guided: close everything, cold launch (old footer), wait for readiness, close everything, relaunch; the footer should then read `1.0.0 (<sha>)`, where `<sha>` is the release commit's short SHA.

After that: the ten qualifying games, your §6.1 answer, the accepted-gap list and your waiver, and the declaration (ticket Owner steps 5–8).
