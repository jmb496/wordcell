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

**Done so far.** Epic retrospective accepted-with-open-items (Jared, 2026-11-07). The agent merged and pushed `dcd2df0` to `main` (Jared's one-time exception, epic Notes 2026-11-07); CI 42412944905 and Deploy 42414566899 green; production https://wordcell.jmb496.workers.dev. Jared authorised the agent to run 7.12 (2026-11-07, "please proceed"); the exception excludes the release commit, whose push stays Jared's (AGENTS.md rule 7). `main` is an ancestor of `pwa-release` (checklist step 3's `git merge --ff-only main` holds); docs-only record commits (a1a5934, 233c795, 7.12's) ride along, so F12's "changes only the version" holds for shipped code.

**Owner steps** (phone, except pushes 3 and 8; the agent guides each read in plain single steps, as in 7.11):

1. Uninstall the tailnet WordCell; install from the production URL via Chrome's own install option, keeping site data (your history). Read the menu footer now, and after each announced deploy once the agent has guided one close-all and relaunch (G3's steps).
2. Do the guided install, offline and force-stop checks (G1, G2 with its readiness step, G4).
3. When the agent says the release commit is ready, push it (default `git push origin pwa-release:main`, a fast-forward; unverified). You may tag `v1.0.0` (F11).
4. Keep WordCell and the URL closed until the agent says Deploy is green; then do G3's update read at once.
5. Play until the agent counts ten qualifying games; after each, send the end sheet and the menu footer at its start and end (screenshots fine) and any misdrop, lost or stuck drop.
6. Say whether you play by choice, trust Undo and never fight the controls, felt lag included (§6.1, F10).
7. Confirm the accepted-gap list and give your waiver in your own words.
8. Declare v1 released; after the agent marks done, push the closing records.

**Agent rules**

- Jared's reports go in the epic Notes (F12). G1, G2 and G4 count only on footer `0.0.0 (dcd2df0)` (another first footer: G2's readiness relaunch runs first); the plan records the no-clear deviation from `docs/device-testing.md` Clearing site data (no seed page). G4's play-reached boundaries: pre-release build or 1.0.0; the win/undo case may be a won run game.
- The release commit is in the 7.12 plan, a post-merge fix in its fix ticket's plan (F11); `npm run test:all` passes at it, after the AGENTS.md pre-run check; it is the `pwa-release` head when Jared pushes (CI and footer SHA follow it); later 7.12 records, the `test:all` line included, wait as below.
- Before any later commit on `pwa-release`: fetch, `git merge --ff-only origin/main` (failure stops for Jared). Record commits after the 1.0.0 push ride along with any later fix push (docs-only, no re-read); those after the last fix wait for the post-declaration push; never rebase to hold them back.
- `<sha>`: each 1.0.0 Deploy run's short head SHA; Jared gets the footer before G3.
- A spoiled G3 read rests on the tailnet G3 pass (c048c93, epic Notes), redone once only if a post-merge fix deploys anyway (no deploy just for it); a second consecutive one routes as G3 says.
- Restart rule (epic Notes, owner 2026-10-29 (2)): restart only for a deploy changing drop targeting or drag rendering (e.g. `src/ui/gestures/`, `src/ui/layout/`, the tray, card hit-rect CSS); the subject decides, paths are examples; the agent rules each mid-run deploy and records it.
- A red CI, Deploy or AD-18 check is a post-merge fix (F11), except one rerun of the failed jobs at the same commit for a red confined to a known flaky test (Jared in the GitHub app, or the agent with `gh run rerun <run-id> --failed` on his recorded OK; both results recorded). A failed production read (G1, G2, G4, G16, a non-spoiled G3) routes per its `device-checks.md` row (default a post-merge fix). Re-reads (F12) are by guided play on production; one play cannot give (seeded rows, e.g. G5, G6, G17's seeding; G20–G22) stops for Jared.
- A §6.1 "no" or a withheld waiver stops before the declaration; his reasons become fix tickets (F11, F12) or a spec §9 question. Felt lag is recorded and opens F10's follow-up (chrome://inspect, a desktop step, only with Jared's OK); it blocks only through a "no".
- Before the declaration, after the pre-run check: §6.7 on a Linux-filesystem checkout of `origin/main` after fetch; over the AGENTS.md budget re-runs once idle; still over, a fix ticket (F11). §6.4, §6.6: post-merge deltas only.
- Risk (entry 12 `unknown`): a spoiled production update read or a fix shipping mid-run.
- Done checkpoint: after 7.12 closes, work waits for Jared.
- The plan syncs to this ticket SPEC CAP-10's spoiled-read and evidence-location wording (checklist Evidence kinds) and the checklist's §6.7 and step 5 measurement (close-out default; review-log minors 4, 5).

## Acceptance Criteria

Verify: The merge's CI 42412944905 and Deploy 42414566899 are green (met), and so are those of the last `main` commit deployed before the declaration; the epic Notes record Jared's production reads G1, G2, G4 and G3 to `1.0.0 (<sha>)` (or a recorded spoiled read resting on the tailnet G3 or resolved per G3), each with date and footer (F12), ten consecutive qualifying games (won or given up with ≥ 5 committed words, brief §6.3; a game counts only if every footer it was played on is `1.0.0 (<sha>)`; on a restart the spanning game does not count; non-qualifying games neither count nor break the run) with no misdrop or lost drop (one resets the count, G16), each with date, outcome, score, words and footers, any reset, and his §6.1 statement; the 7.12 plan has one evidence line per §6.1–§6.9 and initiative Done when 1–3 row (D reads cite the epic Notes; accepted gaps "checked, not passing" with the waiver; `release-checklist.md` is not edited for evidence); before the declaration the agent lists the accepted gaps (Q-50, G20, the ten A1 §6.6 rows, any other checked-not-passing row), Jared confirms, and his explicit waiver of initiative Done when 1 and 3 (retro A10; 7.11 plan item 5) is in the initiative Notes in his words; on his recorded word the agent marks 7.12, the epic and the initiative done, in that order (`uv run _bmad/method/scripts/tickets.py mark 7.12 done`; containers via `bmad-preview-ticketing`); then Jared pushes the closing records and the agent checks that push's CI and Deploy (red: a fix ticket after v1; the declaration stands).

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-pwa-release/epic-pwa-release.md
- spec — SPEC.md CAP-10, F10–F12; release-checklist.md (Production sequence, §6.7); device-checks.md G1–G6, G16, G17, G20–G22; SPEC.review-log.md Result (minors 4, 5)
- context — epic-pwa-release-retrospective.md (A10, Human decision); initiative-wordcell-v1.md (Done when, Notes); brief §6; 7.11 plan (item 5)
- constraint — docs/device-testing.md (Production variant); docs/development-methodology.md; AGENTS.md rule 7

## Notes

- Restart rule answered (Agent rules).
