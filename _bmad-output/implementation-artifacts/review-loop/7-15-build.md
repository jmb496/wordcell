# Review loop — ticket 7.15 build (code, 404c525..HEAD)

State: pass 1: done

Target: commit range `404c525..HEAD` (c6bdeb3), staged at `7-15-build.passes/pass0.diff`.
Intent: `_bmad-output/initiative-wordcell-v1/epic-pwa-release/story-close-the-7-11-6-4-test-name-and-celebration-colour-gaps-plan.md`.
Depth: quick (correctness + verification gap; fix diff from pass 2). Max 7.
Pre-loop: HEAD c6bdeb3735d1914a9b942e7586c021e206e60ff8, tree 0 08fe96679e5690f0f1f7c14e44155b37455de83a.

## Pass 1 — 2026-11-07
Reviewers: correctness, verification gap  |  Findings: major 1, minor 2, decision-needed 0  |  Dropped in triage: 0
### Applied
- [major] `e2e/celebration.spec.ts` `sampleRun` / new R-87 test — a shown group's own computed opacity is read only as > 0, so a group drawn translucent (a Q-48 colour change) passes; `step.ts:426` keeps a group at 1 until the last `baseMs` of the cap (no fade-in), so the FACE_PROPS comment's "fade in" reason is wrong → fixer item 1
- [minor] plan Intent Approach, I/O matrix, Tasks, Design Notes — still describe the pre-review two-sample `wantQu` test without copy opacity → fixer item 2
- [minor] `e2e/celebration.spec.ts` `sampleRun` doc comment — stop-condition list garbled (reads as four modes) → fixer item 3
### Default applied (technical)
- `sampleRun` — group opacity check → record each shown group's computed opacity in `layers` and assert `'1'` at every sample, with each sample before the closing fade
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none
### Fix (pass 1)
- Fixer: item 1 — `sampleRun` layers carry computed `opacity`; every layer (root + shown groups) asserted `{ filter: 'none', blend: 'normal', opacity: '1' }`; separate root-opacity field folded into the layers; each call returns `steppedMs`, total asserted < `NORMAL_CAP_STEP_MS − 180` (before the closing fade); FACE_PROPS comment corrected (closing fade only). Mutation `opacity = fade * 0.9` in `step.ts` failed the test (reverted, `src` clean). Item 2 — plan Approach, I/O matrix (Last group sample row), Tasks, Design Notes, Plan Change Log updated. Item 3 — doc comment reworded.
- Fixer ran: new test on `android` 1 passed; `npm test` 3788 passed; lint clean; check 0 errors.
- Orchestrator verify: `npm test` 91 files / 3788 passed; `npm run lint` no fixes; `npm run check` 0 errors.
Snapshot: tree b7c69cefc35158c8ab7914caa1b21489ab5c1e8d  |  fix diff `7-15-build.passes/pass1.fix.diff`
