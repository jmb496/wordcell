# Code review loop — ticket 6.10 build (50b9d38..82cfde1)

State: pass 1: done
Pre-loop: HEAD 82cfde1, tree snapshot 0 c9407152ca53f3596e65f32f309fc57e8f123936; target diff `6-10-build.passes/pass0.diff`.
Intent: story-keyboard-overlay-keys-f39-and-stale-tile-selection-plan.md. Depth thorough, max 7.

## Pass 1 — 2026-10-15
Reviewers: correctness, edge cases, verification gap, intent alignment  |  Findings: major 3, minor 8, decision-needed 1  |  Dropped in triage: 0 (Esc-rejected and its test gap merged; N-on-rejected-with-overlay downgraded to minor: no overlay is reachable on the rejected root)
### Applied (sent to fixer)
- [major] keys.ts pressEscape — Esc is not live on the rejected root (ticket: only N and Esc live; Halted none) → fixer 1
- [major] commands.test.ts F39 — nothing proves view/peek/selection closed before the dispatch → fixer 2
- [major] keys.test.ts / e2e keys.spec.ts — titles claim N (and ?) live over expanded end sheet, not pressed → fixer 3
- [minor] keys.ts attempt — SUSPENDING check before rejected branch → fixer 4
- [minor] keys.test.ts — ROWS single flags for validate/confirm/flip/undo/redo → fixer 5
- [minor] keys.test.ts — Y with sticky view/peek/tail selection → fixer 6
- [minor] keys.test.ts — Esc: overlay takes precedence over tile/tail selection; rejected-root test must match what it asserts → fixer 7
### Default applied (technical)
- nav.whenSettled/settled not in spine AD-13 — leave; listed under unapplied minors for a spine update
### Decision needed (functionality / UX / gameplay)
- commands.ts closeTransient — the Validate, Confirm and Flip buttons (not only Undo/Redo/menu) now also close an open sticky WordCell view/peek and pop a tail selection before acting (plan records it as a divergence). Player-visible: pressing Flip with a view open closes the view. Proposed default: keep (same F39 reason; avoids deselect throw).
### Dropped
- none
Snapshot pass 1: tree 6ddf54f54344fa8b2018e732e7651d2442927360; test/lint/check pass (fixer + orchestrator lint/check).
