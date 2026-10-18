# Review loop — ticket 8.6 build (code mode)

State: done
Target: commit range 412f96e..HEAD (68b5c41), diff `8-6-build.passes/pass0.diff`; intent: story-scene-carousel-and-whole-play-area-stage-plan.md
Pre-loop: HEAD 68b5c416304df606fedc24e154992256817ca24b, tree snapshot 0 = f52e0291bdd334ff9bdd5fe271675f09657d6955

## Pass 1 — 2026-10-17
Reviewers: correctness, edge cases, verification gap, intent alignment  |  Findings: major 1, minor 10, decision-needed 0  |  Dropped in triage: 1
Snapshot: tree ea232538eb9ecb6513707a4234fb87a1eb9fa44c
### Applied
- [major] e2e/how-to-play.spec.ts Animation speed test compared a duration with itself → fixer item 1 (now asserts slower seeded speed > fast; prefs-non-default)
- [minor] Left/Right keys: preventDefault/stopPropagation not observed → item 3
- [minor] scrollbar-gutter: stable untested → item 4
### Default applied (technical)
- Carousel.svelte:64 host?.contains → fixer skipped: host is legitimately unbound on the first $effect.pre run
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- hidden-tab test "missing": exists (e2e/how-to-play.spec.ts:279, AD-9 hidden page …)
### Minors not applied
- dots wrap >2 rows below ~232px content; host placeholder height = stage only; sceneFit negative width at <=32px; scale unit coverage only at width 40; carousel.test.ts source-regex tests; idle-restart e2e detection flaky-prone; plan lacks sentence→test table; how-to-play.test.ts weakened to empty/null SSR asserts; EXPERIENCE.md How to play section not updated (owner/later ticket); scoring figure 18px stagger unspecified
Checks after fix (fixer): npm test 2916 pass, lint clean, check 0 errors, how-to-play e2e android 45 pass.

## Pass 2 — 2026-10-17
Reviewers: fix diff, edge+verification, intent alignment  |  Findings: major 0, minor 8, decision-needed 0  |  Dropped in triage: 0
Applied: none (converged; minors not applied)
Minors: Scene.svelte tick().then(focusBound) could throw after a same-tick re-key; "Scenes" group label not in story names; Stage comment mentions foot row not drawn; unreachable `?? []` for filler; height-only resize can re-key the scene; index reset during Panel exit fade; "rapid switching" e2e awaits each click; weak aria-hidden/landscape-cap assertions.

## Result — converged after 2 passes
Majors per pass: 1, 0. Final: npm test 2916 pass, lint clean, check 0 errors (fixer run at the final tree; no change since).
