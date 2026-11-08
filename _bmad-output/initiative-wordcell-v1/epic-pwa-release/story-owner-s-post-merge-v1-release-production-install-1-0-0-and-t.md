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

**Done so far.** Epic retrospective accepted-with-open-items (Jared, 2026-11-07). The agent merged `dcd2df0` to `main` and pushed under Jared's one-time exception (epic Notes 2026-11-07); CI 42412944905 and Deploy 42414566899 green; production https://wordcell.jmb496.workers.dev. Jared authorised the agent to run 7.12 (2026-11-07, "please proceed"). The exception does not cover the release commit: its merge and push stay Jared's (AGENTS.md rule 7). `main` is an ancestor of `pwa-release` (step 3's `git merge --ff-only main` is satisfied); the docs-only record commits (a1a5934, 233c795, 7.12's review and plan commits) ride along with the release commit, so F12's "changes only the version" holds for shipped code.

**Owner steps** (phone; the agent guides each read one plain step at a time, as in 7.11):

1. Uninstall the tailnet WordCell; install from the production URL with Chrome's own install option; do not clear site data (keeps your history). Read the menu footer now and whenever the agent announces a deploy.
2. Do the guided install, offline and force-stop checks (G1, G2 with its readiness step, G4).
3. When the agent says the release commit is ready, push it (default `git push origin pwa-release:main`, a fast-forward; unverified). You may tag `v1.0.0` (F11).
4. Do not open WordCell or the URL until the agent says Deploy is green; then do the update read (G3) at once.
5. Play ten games; after each, send the end sheet (outcome, score, words; a screenshot is fine) and any missed or lost drop.
6. Say whether you play by choice, trust Undo and never fight the controls, including no felt lag on Confirm, Undo, Redo or New game (§6.1, F10).
7. Confirm the accepted-gap list and give your waiver in your own words.
8. Declare v1 released; then push the closing records.

**Agent rules**

- Jared's reports go in the epic Notes (F12). G4's play-reached boundaries: pre-release build or 1.0.0; the win/undo case may be a won run game.
- The release commit is in the 7.12 plan, a post-merge fix in its plan (F11); `npm run test:all` passes at it, after the AGENTS.md pre-run check, before Jared is asked to push.
- Before any later commit on `pwa-release`: fetch, `git merge --ff-only origin/main` (failure stops for Jared). Record commits after the 1.0.0 push stay local until the declaration; Jared then pushes them (docs-only deploy, no re-read).
- `<sha>`: the Deploy run's short head SHA; Jared gets the exact footer before G3.
- A spoiled G3 read rests on the passed tailnet G3 read (c048c93, epic Notes) unless a post-merge fix deploys anyway, then is redone once on it; no deploy only to redo it; a second consecutive one routes as G3 says.
- Restart rule (answered: epic Notes, owner 2026-10-29 (2)): restart only for a deploy changing drop targeting or drag rendering (`src/ui/gestures/`, `src/ui/layout/`, `src/ui/Tray.svelte`, `src/ui/tray/`, card sizing or positioning CSS); the agent rules each mid-run deploy from its changed paths and records it.
- A red CI, Deploy or AD-18 check is a post-merge fix (F11; flakes: methodology flake-close protocol). A fix needing a G20–G22 re-read (F12) stops for Jared.
- A §6.1 "no" stops before the declaration; his reasons are recorded as fix tickets (F11, F12) or a spec §9 question.
- Before the declaration, after the pre-run check: §6.7 on a Linux-filesystem checkout of the last `main` commit; over budget (warm median ≥ 5 s, watch ≥ 1 s) re-runs once idle, still over is a fix ticket (F11). §6.4, §6.6: post-merge deltas only.
- Risk (entry 12 `unknown`): a spoiled production update read or a fix shipping mid-run.
- Done checkpoint: after 7.12 closes, work waits for Jared; done only on his word.
- The plan syncs SPEC CAP-10's spoiled-read and §6.7's measurement wording to this ticket (close-out wording default; review-log minors 4, 5).

## Acceptance Criteria

Verify: The merge's CI 42412944905 and Deploy 42414566899 are green (met), and so are the 1.0.0 commit's (after a post-merge fix, the last deployed `main` commit's); the epic Notes record Jared's production reads G1, G2, G4 and G3 to `1.0.0 (<sha>)`, each with date and footer (F12), ten consecutive qualifying games (won or given up with ≥ 5 committed words, brief §6.3) with no misdrop or lost drop (G16: one resets the count, a finding or fix ticket), each with date, outcome, final score, words placed and every footer it was played on, any reset, and his §6.1 statement; the 7.12 plan has one evidence line per §6.1–§6.9 and initiative Done when 1–3 row (D reads cite the epic Notes; accepted gaps "checked, not passing" with the waiver; `release-checklist.md` is not edited for evidence); before the declaration the agent lists the accepted gaps (Q-50, the ten A1 §6.6 rows, any other checked-not-passing row), Jared confirms, and his explicit waiver of initiative Done when 1 and 3 (retro A10; 7.11 plan item 5) is in the initiative Notes in his words; on his explicit recorded word the agent marks 7.12, the epic and the initiative done, in that order (`uv run _bmad/method/scripts/tickets.py mark 7.12 done`; containers via `bmad-preview-ticketing`).

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-pwa-release/epic-pwa-release.md
- spec — SPEC.md CAP-10, F10–F12; release-checklist.md (Production sequence, §6.7); device-checks.md G1–G4, G16, G20–G22; SPEC.review-log.md Result (minors 4, 5)
- context — epic-pwa-release-retrospective.md (A10, Human decision); initiative-wordcell-v1.md (Done when, Notes); brief §6; 7.11 plan (item 5)
- constraint — docs/device-testing.md (Production variant); docs/development-methodology.md; AGENTS.md rule 7

## Notes

- Restart rule answered (Agent rules).
