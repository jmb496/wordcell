# Review loop — ticket 3.8 build (code, a9c25cf..813e935)

State: pass 1: done

Target: `_bmad-output/implementation-artifacts/review-loop/3-8-build.passes/pass0.diff` (a9c25cf..813e935)
Intent: `_bmad-output/initiative-wordcell-v1/epic-app-shell/story-nav-adapter-overlays-core-history-notice-and-reset-confirm-plan.md`
Depth: thorough, max 7. Pre-loop HEAD 813e935, tree snapshot 0 a50d5aba13b912fc9c21b765d0cbc6b91ba4832f.

## Pass 1 — 2026-10-01
Reviewers: correctness, edge cases, verification gap, intent alignment  |  Findings: major 1, minor 3, decision-needed 0  |  Dropped in triage: 1
Snapshot: tree 4fbf7abae572a1d3166cbd1711a00ff620743a0f  |  Fix diff: 3-8-build.passes/pass1.fix.diff  |  Verify: npm test 1588 passed (31 files), lint clean, check 0 errors; fixer ran history-notice.spec.ts android 16 passed (new dblclick case fails with the Dialog fix reverted)
Fixer: all 4 applied
### Applied
- [major] src/ui/Dialog.svelte scrim / HistoryNotice openConfirm — a double tap on Reset history mounts the confirm and the second click lands on its scrim (Keep it), so the confirm flashes and closes; no test covers repeated taps → fixer item 1
- [minor] plan front matter deferred entry-10 item — widen to also cover openHistoryNotice() after registerLifecycle() and before mount (AD-16) → fixer item 2
- [minor] src/shell/nav.ts drain() — a system back arriving between Delete history's two queued pops is absorbed as nav's own pop; record in plan residual risks beside A-A11 → fixer item 3
- [minor] src/shell/nav.ts stale-launch entry reached by Forward then push — wc no longer equals distance from base, a later reload stamps the stale entry as base; record in plan residual risks as an AD-13 edge for the spine owner → fixer item 4
### Default applied (technical)
- item 1: scrim ignores the second and later clicks of a multi-click (`event.detail > 1`) — reviewer's pointerdown-origin proposal does not stop it (the second pointerdown also starts on the new scrim)
- items 3–4: recorded as residual risks rather than code changes
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- edge-case second half (double tap on Delete history / Not now reaching the board): the second tap is the player's own pointer input on the now-live board, not a defect of the dialog
