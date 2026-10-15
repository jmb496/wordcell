# Review loop — ticket 6.3 build (code mode)
State: done
Range: 197fb8a..HEAD (d6dc6f0). Pre-loop HEAD d6dc6f0. Intent: story-confirm-dialogs-new-game-and-replay-plan.md
tree0: 4f4c7a09cd65fc43f07f4daeb25133d61c7df182

## Pass 1 — 2026-10-15
Reviewers: correctness, edge cases, verification gap, intent alignment  |  Findings: major 0, minor 10 (after merge ~7), decision-needed 0  |  Dropped in triage: 0
### Applied
- none (converged; no major)
### Default applied (technical)
- none
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- Replay double-tap not write-counted: outcome (same seed, empty moves) is identical whether Replay runs once or twice, so unobservable; classed minor, not major (earlier build triage rejected it too).
- Unreachable reopen-during-exit skip guard: ticket-specified, recorded in the plan as a residual risk; minor.
Pass 1 snapshot: unchanged tree 4f4c7a09 (no fix pass). Final test/lint/check pass (run by orchestrator).

## Result — converged after 1 pass
Unapplied minors:
- Plan task `Vitest AD-13 for the two accept paths` still unchecked though src/ui/new-game.test.ts exists.
- src/ui/text.test.ts: 'AD-13 confirm dialog text' tests carry the wrong id (AD-13 is the History API); the 'reuse text.newGame' test proves nothing about the dialog.
- e2e/confirm.spec.ts: Replay double-tap not write-counted; finished-game "acts at once" tests assert only no dialog/focus, not the outcome (menu.spec.ts covers it); reopen-during-exit test cannot reach the skip guard.
- src/ui/new-game.test.ts stubs the store and skips the menu-close-then-push sequence.
- ConfirmDialogs.svelte onClosed finds ☰ by global aria-label query with silent `?.`; entry 10 focus ownership can replace it.
- Menu.svelte header comment and architecture-new-game.test.ts comment overrun line width.
