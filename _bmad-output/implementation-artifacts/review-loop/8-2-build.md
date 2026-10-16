# Review loop — ticket 8.2 build (code, quick, max 7)
State: done
Pre-loop: HEAD 797ba447d15fab90738be60b9e4b11397eb53efe, tree snapshot 0 e2fec10184a790dfe7d6c82168f74cd7fff4f0c8. Range be5c73d..HEAD (one commit 797ba44; no WIP commits in range).

## Pass 1 — 2026-10-16
Reviewers: correctness, verification gap  |  Findings: major 2, minor 4, decision-needed 0  |  Dropped in triage: 0
### Applied (planned)
- [major] e2e/how-to-play.spec.ts stepScenes — k and side (destination-class tiles) never asserted per frame → fixer 1
- [major] scenes.test.ts k test — skipped when no setDestinationCount; default k unchecked → fixer 2
- [minor] scenes.test.ts word check skips BEDKA/pressed frames → fixer 3
- [minor] how-to-play-scenes.test.ts non-word test name overstates → rename (fixer 4)
### Default applied (technical)
- test strengthening choices → reviewer's proposed defaults
### Dropped / not applied (minor)
- caption circularity (usual text.ts convention); animated-test last-state assertion (left as minor)
Snapshot pass 1: tree 8312b21c2bcebc6c7203d90f21eae8eda04de8ab; tests 2809 pass, lint pass, check pass, e2e how-to-play 17 pass.

## Pass 2 — 2026-10-16
Reviewers: correctness, verification gap, fix diff  |  Findings: major 0, minor 0, decision-needed 0  |  Dropped in triage: 0

## Result — converged after 2 passes
Majors per pass: 1: 2, 2: 0. Final: test pass, lint pass, check pass.
Unapplied minors: caption assertions are circular against text.ts (convention); the animated e2e test checks scheduling only, not last-step state.
