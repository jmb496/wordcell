# Code review loop — ticket 5.14 build
State: done
Target: commit range b352e48..HEAD (3131ef8), diff _bmad-output/implementation-artifacts/review-loop/5-14-build.passes/pass0.diff
Intent: _bmad-output/initiative-wordcell-v1/epic-tray-and-place/story-refactor-sweep-code-plan.md
Pre-loop: HEAD 3131ef8f6e77043fa04323a356bfc34c50b71f8c, tree snapshot 0 4b27b6d8b1816163d93635e22d4b605117c3deae

## Pass 1 — 2026-10-14
Reviewers: correctness, edge cases, verification gap, intent alignment  |  Findings: major 1, minor 11 (raw), decision-needed 0  |  Dropped in triage: 0 (duplicates merged: attribute() throw x3)
### Applied
- [major] e2e/helpers.spec.ts onAndroid test (+ e2e/helpers/project.ts) — assertion `test.info().status` is never 'skipped' while running, so test is vacuous; onDesktop untested → fixer item 1
- [minor] e2e/helpers.spec.ts space check conditional → item 2
- [minor] e2e/helpers.spec.ts expectFlownBack never exercises the running-animation half → item 3
- [minor] e2e/tray.spec.ts compact R-32 after-Undo: add closed-side border assertions → item 4
- [minor] e2e/helpers/gestures.ts idOf reads missing data-card-id as 0 → throw → item 5
- [minor] comment lines over 100 cols in e2e/drag-interruptions.spec.ts, column-phases.spec.ts, free-letter.spec.ts → item 6
### Default applied (technical)
- helper-test strengthening above → recommended defaults taken
### Decision needed (functionality / UX / gameplay)
- none
### Dropped / left unapplied (minor)
- lookup.ts attribute() throw is the one deliberate runtime change; callers verified unreachable; optional plan note / controller test left
- WordLine refit() getBoundingClientRect vs clientWidth: no scale transform today; no change
- tap.spec `space` ghost semantics; draft() throw vs sentinel: no change needed (rule 6)
- openFixture booted:false coupled to waitForFunction counting; draft/holdThrough self-consistency: left for next build
Snapshot: tree b17b5cce57f3975c577bb0c4527a49f3d6d99f71 (npm test/lint/check pass)

## Pass 2 — 2026-10-14
Reviewers: fix diff, correctness+edge cases, verification gap, intent alignment  |  Findings: major 0, minor 5, decision-needed 0  |  Dropped in triage: 0
No fix pass run (converged).

## Result — converged after 2 passes

Majors per pass: 1, 0. Final state (commit 34f4221): npm test 2393 passed, lint pass, check pass.

### Unapplied minors (for the next build or loop)
- e2e/drag-interruptions.spec.ts:35 comment line still 125 columns (pass-1 re-wrap left it long); other >100 lines in the three files predate the build.
- e2e/helpers.spec.ts onAndroid/onDesktop test runs only on android (expected computed from same expression); add literal per-project expectations.
- idOf throw has no helper test (add rejects.toThrow on an element without data-card-id).
- src/shell/game.svelte.test.ts replay-failed case should also assert reason 'replay-failed'.
- space/footCorner test repeats helper formulas; add independent in-box assertions.
- From pass 1: openFixture booted:false test coupled to waitForFunction counting; draft/holdThrough self-consistency; optional plan note that lookup.ts attribute() throw is the one deliberate runtime change.
