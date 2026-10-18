# Review loop: ticket 8.7 build (code mode)

State: done

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

## Pass 2
Reviewers: fix diff, edge cases, verification gap, intent alignment  |  Findings: major 1, minor 5, decision-needed 0  |  Dropped in triage: 0 (reduced-motion frames minor reported by 3 reviewers, merged; ticket-confirmed major: Content says only dictionary words in `words`)
### Applied (sent to fixer)
- [major] fixtures/how-to-play-move-compose.json words — pass-1 fix added 5 non-words, contradicting ticket Content "Only dictionary words are stated in words" → keep only BAKED; keep middle-frame coverage by engine-test replay assertions of draft letters per command
- [minor] reduced-motion scene 1 test: dead `frames`, no distinct assertion → assert frames[1] != frames[0]
- [minor] AC2(c) tautology / UI frame vs engine view: assert engine draft letters/k/side at opens vs scene frame order literal
- [minor] scene 2 first-step test checks only opacity 0 → also ghost transform equals rest target
- [minor] arrange ids literal 3,0,22: test they read B,A,K via sceneStart
### Default applied (technical)
- all of the above

Fix outcome: all 5 applied (3: no change possible, layer rule; engine letter list is the tie). Snapshot tree a72a864; npm test/lint/check pass.

## Pass 3
Reviewers: fix diff, correctness+edge, verification gap, intent alignment  |  Findings: major 0, minor 3, decision-needed 0  |  Dropped in triage: 0
Snapshot: tree a72a864 (no fix pass). Final npm test / lint / check: pass.

## Result — converged after 3 passes

Unapplied minors:
- e2e/how-to-play.spec.ts reduced-motion test: name says eight frames but asserts only frames 0-2; weak `opacity: 1` style-string locator (covered by stepScenes table).
- scenes.test.ts arrange step: `e.times === step.times` is tautological; pin literal target `flip`/times 3 or update plan text (plan said `rest`/1).
- scenes.test.ts 'no move step names an arrange command': vacuous (`commands[-1]`); assert `step.command === undefined || type !== 'arrange'` and that a move step was inspected.
- Earlier skipped: tray-0 frame-0 opacity forced in Scene.svelte only safe while just free-letter has a frame-0 tray; greedy letter matching in arrange unsupported for repeated letters (no scene has them).
