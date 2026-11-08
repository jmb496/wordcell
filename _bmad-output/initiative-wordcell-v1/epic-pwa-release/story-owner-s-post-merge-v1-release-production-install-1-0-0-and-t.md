---
id: 12
type: story
title: "Owner's post-merge v1 release: production install, 1.0.0 and ten games"
parent: epic-pwa-release
covers: [CAP-10]
after: [11]
hitl: true
risk: high
---

# Owner's post-merge v1 release: production install, 1.0.0 and ten games

## Description

CAP-10, after the epic retrospective and Jared's merge of `pwa-release` into `main` and push (agents never merge or push): CI deploys; Jared uninstalls the tailnet-origin app, installs from the production URL through Chrome's own install UI and reads G1, G2 and G4 there; the agent fast-forwards `pwa-release` to `main` (`git merge --ff-only main`, stopping for Jared if that fails) and commits the release commit setting `1.0.0` in `package.json` and `package-lock.json` (F11), which Jared merges and pushes and CI deploys; Jared runs G3's update read to `1.0.0 (<sha>)` (a spoiled read redone once; a second consecutive one routes as G3 says), plays ten consecutive qualifying games on 1.0.0 (brief §6.3, restart rule per his answer or the proposed default) and judges §6.1; post-merge fixes follow F11 and F12; the unit suite's warm median and watch re-run are re-measured on a Linux-filesystem checkout of the last commit on `main` before the declaration (§6.7) and the §6.4 and §6.6 audits re-confirmed for post-merge fix deltas only; every row of `release-checklist.md` gets its evidence, and Jared declares v1 released and marks the initiative done.

## Acceptance Criteria

Verify: The CI and Deploy runs of the merge and of the 1.0.0 commit are green; Jared's production reads (G1, G2, G4, G3 to 1.0.0), the ten games (date, outcome, score, words, footer each) and his §6.1 statement are recorded in the epic Notes; every row of `release-checklist.md` carries its evidence, any Done when 1 waiver is in the initiative Notes, and the initiative is marked done.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-pwa-release/epic-pwa-release.md
- spec — SPEC.md CAP-10, F11, F12, Open Questions; release-checklist.md (Production sequence, §6.7); device-checks.md G1–G4, G16; SPEC.review-log.md Result (unapplied minors 4 and 5)
- constraint — docs/device-testing.md; docs/development-methodology.md; AGENTS.md rule 7

## Notes

- Open question: Whether a production update read is spoiled (the first cold launch already on 1.0.0) and whether a fix ships mid-run (the ten-game restart rule is an open owner question).
