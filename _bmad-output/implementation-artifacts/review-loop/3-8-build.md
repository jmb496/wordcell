# Review loop — ticket 3.8 build (code, a9c25cf..813e935)

State: pass 2: done

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

## Pass 2 — 2026-10-01
Reviewers: fix diff, edge cases, verification gap, intent alignment  |  Findings: major 2, minor 1, decision-needed 0  |  Dropped in triage: 0 (2 merged)
Snapshot: tree 2c6217d6bcd4ab135f193e70cefbc050298bf744  |  Fix diff: 3-8-build.passes/pass2.fix.diff  |  Verify: npm test 1589 passed (31 files), lint clean, check 0 errors; fixer ran history-notice + nav specs android 24 passed; each new test fails with its fix reverted; touch double taps give click detail [1,2], so the new e2e cases use touchscreen taps
Fixer: both applied (pass-1 dblclick test replaced by a touch double-tap near the top edge with history-invalid-null.json)
Note: majors rose 1 → 2, but not because the refs are unclear. Item 1 is the pass-1 major left unresolved (the guard covered only the scrim) and item 2 is an independent test gap. The diverging diagnosis does not apply, so the loop continues.
### Applied
- [major] src/ui/Dialog.svelte buttons — pass-1 multi-click guard covers only the scrim. The second click of a double tap lands on the freshly mounted dialog's buttons: Reset history → Delete history (overlap 6–8 px on Pixel 7 / 320 px, wipes history unconfirmed; fix-diff reviewer reproduced), and rejected-root New game → notice's Reset history / Not now (opens the confirm unasked or dismisses the once-per-launch notice; edge-case reviewer reproduced). Merged → fixer item 1
- [major] src/ui/overlays.svelte.test.ts 'AD-13 closedByBack(d) closes every entry deeper than d…' — never removes more than one entry per call, so a single-removal implementation passes; plan claims the order is observable → fixer item 2
- [minor] e2e/history-notice.spec.ts pass-1 dblclick test — only centre click on version-unknown, never exercises the button overlap → folded into fixer item 1
### Default applied (technical)
- item 1: both Dialog buttons ignore `event.detail > 1` like the scrim (keyboard activation has detail 0)
- item 2: add a closedByBack(0)-from-depth-2 case; drop the "order observable" plan claim (no per-entry side effect in epic 3)
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none
