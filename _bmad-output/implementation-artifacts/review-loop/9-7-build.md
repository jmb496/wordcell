# Review loop: ticket 9.7 build (code mode)

State: pass 1: done
Target: commit range 2a696af..HEAD (f668143), diff `9-7-build.passes/pass0.diff`; intent: epic-themes/story-theme-deep-space-plan.md; thorough, max 7.
Pre-loop: HEAD f6681432362a9be04b0ea9f771865422f4c993a6, tree snapshot 0 80b434971a6fb059e2d236794440dc13d5fa1d21

## Pass 1 — 2026-10-19
Reviewers: correctness, edge cases, verification gap, intent alignment  |  Findings: major 0, minor 8 (before dedupe), decision-needed 0  |  Dropped in triage: 0 (duplicates merged)
Snapshot: tree 80b434971a6fb059e2d236794440dc13d5fa1d21 (no fix pass ran)
### Applied
- none (zero majors; converged)
### Default applied (technical)
- none
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- duplicates merged: pixel-ratio-not-recorded (4 reviewers), switch test misses scrim/shadow-drag restore (2)

## Result — converged after 1 pass

Unapplied minors:
1. Plan last task asks to record the measured pixel ratio; the notes and `e2e/theme-art.spec.ts` scifi pixel test record only the 4.5 floor pass (record the number or put it in the expect message).
2. No test pins scifi's art tokens as not `none` or its brief section A literals (`contrast.test.ts`, AD-14).
3. `e2e/theme.spec.ts` Deep Space test does not assert `--wc-scrim` / `--wc-shadow-drag` under scifi nor their restore after Charcoal.
4. `e2e/pwa/build-output.spec.ts` dropped the garden `--wc-card-texture` assertion; scifi substring `%2335d0ff` is shared by both art layers (assert each layer by a distinguishing substring).
5. Plan AC3 says both Preferences baselines change; only `theme-paper-preferences.png` did (amend wording).

Final status: test pass, lint pass, check pass.
