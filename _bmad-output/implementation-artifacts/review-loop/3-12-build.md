# Review loop — ticket 3.12 build (code mode, f496ae4..dcf317d)
State: pass 1: done

Target: `_bmad-output/implementation-artifacts/review-loop/3-12-build.passes/pass0.diff` (git diff f496ae4..dcf317d)
Intent: `_bmad-output/initiative-wordcell-v1/epic-app-shell/story-refactor-sweep-and-shared-playwright-config-plan.md`
Depth: quick (correctness, verification gap; fix diff from pass 2) | max 7
Pre-loop: HEAD dcf317d20bfebec106b392fa260c9f209291654d, tree snapshot 0 4b5041f9ad70578673fcd51b5058c3b3669a89df

## Pass 1 — 2026-10-01
Reviewers: correctness, verification gap  |  Findings: major 0, minor 4, decision-needed 0  |  Dropped in triage: 1 (duplicate)
Snapshot: tree 4b5041f9ad70578673fcd51b5058c3b3669a89df (no fix pass; pass 0 state)
### Applied
- none (zero majors: stopping rule met before the fix step)
### Default applied (technical)
- none
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- verification gap: e2e/dictionary.spec.ts AD-8 Timeout clock comment — duplicate of the correctness finding on the same lines (kept as minor 1)

## Result — converged after 1 pass
Final state (orchestrator run at dcf317d): `npm test` 34 files, 1664 passed; `npm run lint` clean (126 files); `npm run check` 0 errors, 0 warnings.

Unapplied minors (for the next build or loop):
1. e2e/dictionary.spec.ts:226-235 (AD-8 Timeout) — `page.clock.install()` without `pauseAt` lets fake time drift, so the comment "the banner must come from the 30 000 ms timeout" overstates the proof, and the 500 ms real-time bound can flake on a slow runner; pause the clock (`pauseAt` after install) and use the default timeout, or reword the comment.
2. src/shell/game.svelte.ts:243-245 — flush comment claims `game.view` keeps its reference when nothing accrued, which no test pins (the test asserts `state`'s reference); reword to what is pinned.
3. e2e/helpers.spec.ts 'dialog helpers' — `notice`, `confirmDialog`, `NOTICE_TITLE`, `CONFIRM_TITLE`, hitAt's `name` and its `scrim` branch have no helpers.spec case (exercised only by history-notice/nav specs); assert hitAt `name` on a labelled button, and record why notice/confirmDialog cases are deferred (seeding pitfall) beside the C-AG2 row.
4. e2e/helpers.spec.ts:306 'openBoard … waitForDictionary' — only awaits settled states, so a waitForDictionary ignoring its `state` argument would pass; add a held-route `waitForDictionary(page, 'loading')` step and a negative wait.
