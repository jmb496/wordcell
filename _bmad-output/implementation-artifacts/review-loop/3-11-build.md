# Review loop — ticket 3.11 build (code mode, cc326d7..5519b7a)
State: pass 1: done

Target: `_bmad-output/implementation-artifacts/review-loop/3-11-build.passes/pass0.diff` (git diff cc326d7..5519b7a)
Intent: `_bmad-output/initiative-wordcell-v1/epic-app-shell/story-boot-order-and-restore-boundaries-plan.md`
Depth: thorough (correctness, edge cases, verification gap, intent alignment; fix diff from pass 2) | max 7
Pre-loop: HEAD 5519b7aa106e16ee54a487da6b6af46ddd97f5ec, tree snapshot 0 5e68c4e37265637b464f07934ad15d6641215f73

## Pass 1 — 2026-10-01
Reviewers: correctness, edge cases, verification gap, intent alignment  |  Findings: major 2, minor 5, decision-needed 0  |  Dropped in triage: 4 (3 duplicates, 1 already recorded)
Snapshot: tree fd9b1dae08321324c182b0ad06fdf626144827b9 (fix diff `3-11-build.passes/pass1.fix.diff`)
Fixer: all 7 applied; restore.spec.ts + helpers.spec.ts android 42 passed; `npm test` 1654 passed, lint clean, check 0 errors (rerun by orchestrator: same).
### Applied
- [major] e2e/restore.spec.ts restore flow — first launch never compared with the seeded fixture (a load that changes the Session idempotently, e.g. dropping the redo tail or committing the Q-41 draft, passes every assertion) → fixer item 1
- [major] story-boot-order-and-restore-boundaries-plan.md — no sentence → test mapping / exempt list (AD-17 Split, AGENTS.md Conventions) → fixer item 2
- [minor] e2e/restore.spec.ts hidden branch — `expect(before.stored).toEqual(session)` cannot detect a missing hide flush (store writes before assigning) → fixer item 3
- [minor] e2e/helpers.spec.ts animationFrames case — delta ≥ 3 does not catch an off-by-one → fixer item 4
- [minor] e2e/restore.spec.ts:126 — `if (after.current.kind !== 'active') return;` silently skips assertions → fixer item 5
- [minor] e2e/restore.spec.ts post-reload — `snapshot()` calls `loaded()`, which throws when halted, before the clear kind assert → fixer item 6
- [minor] e2e/helpers.spec.ts 'restore helpers' — `booted`, `sessionOf`, `dictionaryReady` have no direct helper test → fixer item 7
### Default applied (technical)
- restore.spec.ts first-launch check — assert `first.loaded.session` equals the seed and `sessionOf(first)` equals it modulo `activeMs` → default taken
- plan mapping — add a `Tests mapping (sentence → test)` block like sibling epic-3 plans → default taken
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- Q-41 title order `R-73 Q-41 …` vs ticket literal — already recorded in plan Implementation Notes (AGENTS.md R-id first); no change
- duplicates: hide-flush assertion (correctness + edge), animationFrames (correctness + edge), `return` guard (intent + verification gap)
