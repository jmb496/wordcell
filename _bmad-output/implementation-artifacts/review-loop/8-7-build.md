# Review loop: ticket 8.7 build (code mode)

State: pass 1: done

Pre-loop: HEAD 6841d78, tree 43afbfa115822ef3cf452b9ab470419b22fe783a. Target diff: _bmad-output/implementation-artifacts/review-loop/8-7-build.passes/pass0.diff (e915ac0..6841d78, PNGs excluded).

## Pass 1
Reviewers: correctness, edge cases, verification gap, intent alignment  |  Findings: major 1, minor 8, decision-needed 0  |  Dropped in triage: 0 (2 arrange-validation minors merged; tray-0 note minor skipped: no current bug)
### Applied (sent to fixer)
- [major] scenes.test.ts / how-to-play-scenes.test.ts — move-compose middle tray frames (DEKBA, NDEKBA, DEKBA, KBAED) only checked against copies of their own literals → compare to viewFrom replay per command
- [minor] e2e stepScenes freeLetter lastStep:1 is not the rest
- [minor] defineScene arrange: validate tile ids declared and frame orders are permutations
- [minor] continuity negative test never reaches check (c)
- [minor] doubling test sums only ghost effect
- [minor] free-letter missing describe.each checks
- [minor] reduced-motion scene 1 weak tail assertion
### Default applied (technical)
- all of the above, reviewer defaults

Fix outcome: all 7 applied (findings 2 no change needed, comment added; 4 partly, 6 partly, see fixer). Snapshot tree 1d5c0b8; npm test/lint/check pass.
