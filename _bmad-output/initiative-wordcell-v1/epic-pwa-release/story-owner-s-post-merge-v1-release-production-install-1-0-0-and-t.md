---
id: 12
type: story
title: "Owner's post-merge v1 release: production install, 1.0.0 and ten games"
parent: epic-pwa-release
covers: [CAP-10]
after: [11]
hitl: true
risk: high
done_checkpoint: true
---

# Owner's post-merge v1 release: production install, 1.0.0 and ten games

## Description

CAP-10 on production (`release-checklist.md` Production sequence).

**Done so far.** Epic retrospective accepted-with-open-items (Jared, 2026-11-07). The agent merged and pushed `dcd2df0` to `main` (one-time exception, epic Notes); CI 42412944905 and Deploy 42414566899 green; production https://wordcell.jmb496.workers.dev. Jared authorised the agent to run 7.12 (2026-11-07, "please proceed"); the exception excludes later pushes (AGENTS.md rule 7). `main` is an ancestor of `pwa-release` (checklist step 3's `git merge --ff-only main` holds); docs-only record commits (a1a5934, 233c795, 7.12's) ride along, so F12's "changes only the version" holds for shipped code.

**Owner steps** (phone, except pushes 3 and 8; the agent guides each read in plain steps):

1. Uninstall the tailnet WordCell; install from the production URL via Chrome's install option, keeping any site data. Read the menu footer now, and after each announced deploy, between games, once the agent has guided G3's activation (close all, cold launch, readiness, close all, relaunch).
2. Do the guided install, offline and force-stop checks (G1, G2 with its readiness step, G4).
3. When the agent says the release commit (or a fix) is ready, push it (default `git push origin pwa-release:main`, a fast-forward; unverified). You may tag `v1.0.0` (F11).
4. After the 1.0.0 push or a G3 redo, keep WordCell and the URL closed until Deploy is green; then do G3's update read.
5. Play until the agent counts ten qualifying games; after each, send the end sheet, the menu footer at its start and end and any misdrop, lost or stuck drop.
6. Say whether you play by choice, trust Undo and never fight the controls, felt lag included (§6.1, F10).
7. Confirm the accepted-gap list and give your waiver in your own words.
8. Declare v1 released; after the agent marks done, push the closing records.

**Agent rules**

- Jared's reports go in the epic Notes (Evidence kinds D). G1, G2 and G4 count on a merged pre-release footer `0.0.0 (<sha>)` (dcd2df0 unless a fix lands first) or `1.0.0 (<sha>)` (F12); the plan records the no-clear deviation from `docs/device-testing.md` Clearing site data (no seed page). G4's win/undo case may be a won run game.
- The release commit is in the 7.12 plan, a post-merge fix in its fix ticket's plan (F11); `npm run test:all` passes at it, after the AGENTS.md pre-run check; it is the `pwa-release` head when Jared pushes; later 7.12 records, the `test:all` line included, wait as below.
- Before any later commit on `pwa-release`: fetch, `git merge --ff-only origin/main` (failure stops for Jared). Record commits after the 1.0.0 push ride along with any later fix push (docs-only, no re-read); those after the last fix wait for the post-declaration push; never rebase to hold them back.
- `<sha>`: the deployed short head SHA; Jared gets the footer before G3.
- A spoiled G3 read rests on the tailnet G3 pass (c048c93, epic Notes), redone once only if a post-merge fix deploys anyway (no deploy just for it); a second consecutive one routes as G3 says.
- Restart rule (epic Notes, owner 2026-10-29 (2)): restart only for a deploy changing drop targeting or drag rendering (e.g. `src/ui/gestures/`, `src/ui/layout/`, the tray, card hit-rect CSS); the subject decides; the agent rules each mid-run deploy and records it.
- A red CI or Deploy run is a post-merge fix (F11), except one failed-jobs rerun at the same commit for a red only in a known flaky test or a logged transient infrastructure error (Jared in the GitHub app, unverified, or the agent with `gh run rerun <run-id> --failed` on his OK; both results recorded; Deploy re-fire unverified); a closed flake's sighting also opens its fix ticket (Flake-close protocol 8–9, retro A4), test-only: no declaration hold, no re-read. A failed production read (G1, G2, G4, G16, a non-spoiled G3) routes per its `device-checks.md` row (default a post-merge fix). Re-reads (F12) are by guided play on production; one that play cannot give (seeded rows, e.g. G5, G6; Desktop G20–G22) stops for Jared.
- A §6.1 "no" or a withheld waiver stops before the declaration; his reasons become fix tickets (F11, F12) or a spec §9 question; once resolved (fixes activated), Jared answers again and only a "yes" proceeds; a fix the restart rule covers re-reads G16 (F12): a new ten-game run. Felt lag is recorded and opens F10's follow-up (chrome://inspect on desktop, only with Jared's OK); it blocks only through a "no".
- Before the gap list, after the pre-run check: §6.7 on a Linux-filesystem checkout of `origin/main` after fetch; over the AGENTS.md budget re-runs once idle; still over, a fix ticket (F11). §6.4, §6.6: post-merge deltas only.
- Risk (entry 12 `unknown`): a spoiled production update read or a fix shipping mid-run.
- Done checkpoint: after the closing push's CI/Deploy check, work waits for Jared.
- The plan syncs SPEC CAP-10's spoiled-read and evidence-location wording (checklist Evidence kinds) and the checklist's §6.7 and step 5 measurement to this ticket (close-out default).

## Acceptance Criteria

Verify: CI and Deploy are green for the merge (met) and the last `main` commit deployed before the declaration; the epic Notes record Jared's production reads G3 to `1.0.0 (<sha>)` (or a recorded spoiled read resting on the tailnet G3 or resolved per G3), G1, G2 and G4, each with date and footer (F12), ten consecutive qualifying games (brief §6.3; footers and restarts per F12; non-qualifying games neither count nor break the run) with no misdrop or lost drop (one in a qualifying game resets the count, G16), each with date, outcome, score, words and footers, any reset, and his §6.1 "yes"; the 7.12 plan has one evidence line per §6.1–§6.9 and initiative Done when 1–3 row (D reads cite the epic Notes; accepted gaps "checked, not passing" with the waiver; `release-checklist.md` is not edited for evidence); last before the declaration the agent lists the accepted gaps (Q-50, G20, the retro's other accepted §6.6 gaps, any other checked-not-passing row), Jared confirms, and his explicit waiver of initiative Done when 1 and 3 (retro A10; 7.11 plan item 5) is in the initiative Notes in his words; on his recorded word the agent marks 7.12, the epic and the initiative done, in that order (`uv run _bmad/method/scripts/tickets.py mark 7.12 done`; containers via `bmad-preview-ticketing`); then the agent checks the CI and Deploy of Jared's closing push (red: a fix ticket after v1; the declaration stands).

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-pwa-release/epic-pwa-release.md
- spec — SPEC.md CAP-10, F10–F12; release-checklist.md (Production sequence, §6.7); device-checks.md G1–G6, G16, G17, G20–G22; SPEC.review-log.md Result (minors 4, 5)
- context — epic-pwa-release-retrospective.md (A10, Human decision); initiative-wordcell-v1.md (Done when, Notes); brief §6; 7.11 plan (item 5)
- constraint — docs/device-testing.md (Production variant); docs/development-methodology.md; AGENTS.md rule 7

## Notes

- Restart rule answered (Agent rules).
