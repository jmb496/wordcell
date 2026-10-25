# Review loop — ticket 10.7 build (celebration interruptions, code mode)
State: pass 1: done (result written)

Target: commit range `eaf8ffb..HEAD` (eae5179), code only (`_bmad-output/` excluded). Staged diff: `10-7-build.passes/pass0.diff` (709 lines).
Mode: code, thorough, max 7. Pre-loop: HEAD eae51791f6436ff5756c3cfc046836087bc5e1ea, tree 0 8d0342059e78706546111c972bf3c9e010d97ae2.
Intent: `_bmad-output/initiative-wordcell-v1/epic-end-of-game-words/story-celebration-interruptions-plan.md` (plus ticket `story-celebration-interruptions.md`). Owner items already collected by the orchestrator: plan Design Notes owner items 1 (Hide: plain `end()` vs AD-19 Hide's mode) and 2 (dropped deferred menu open); listed under decision-needed only if this review changes them or finds a new functionality/UX/gameplay choice.
Checkpoint: each pass's fixes are committed as `fix(<area>): WIP code review pass <n> (ticket 10.7)` with this log.

## Pass 1 — 2026-10-24
Reviewers: correctness, edge cases, verification gap, intent alignment  |  Findings: major 0, minor 6, decision-needed 0  |  Dropped in triage: 2 (merged duplicates: `M` under another suspending entry ×2; celebration.svelte.ts header ×2)
Snapshot: tree 0 8d0342059e78706546111c972bf3c9e010d97ae2 (no fix pass)
### Applied
- none (converged with zero majors; minors are not applied at convergence)
### Default applied (technical)
- none
### Decision needed (functionality / UX / gameplay)
- none (owner items 1 and 2 of the plan's Design Notes unchanged by this review)
### Dropped
- edge cases ×verification gap duplicate: `M` ignored under another suspending entry — kept once (minor 1 below).
- intent ×edge cases duplicate: stale celebration.svelte.ts header — kept once (minor 6 below).
### Triage notes
- correctness focus-hop finding verified: on the ☰/`M` mid-run path the menu is pushed in the same drain as the sheet, so EndSheet.svelte's once-per-expansion `openFocused` first fires when back closes the menu (Replay focused in the effect), then Menu.svelte's `tick().then` moves focus to ☰. Final focus is the ☰ button (the EndSheet header comment designs first focus "when a notice over a relaunched sheet closes", the same shape); the transient hop is unasserted, so minor (test assertion), not a behaviour change.
- edge-case `M` twice before the settle: keys.ts `waits('menu')` queues the second press behind openMenu's waiter, and `attempt()` returns false once the menu is top; reasoning holds, untested through keys.ts → minor.
Orchestrator verify (final state = HEAD eae5179, no fix): npm test 90 files / 3581 passed; lint pass (1 pre-existing warning, e2e/end-sheet.spec.ts:845); check 0 errors.

## Result — converged after 1 pass
No fix pass ran; nothing committed (the log is left uncommitted for the caller).

Unapplied minors (for the next build or loop):
1. src/ui/keys.test.ts 'AD-13 with another suspending entry over the celebration Z and N do nothing' — add `expect(press('m')).toBe(false)` (log stays empty) and rename '… Z, N and M do nothing' (plan I/O matrix `M` row, other-suspending branch).
2. src/ui/keys.test.ts 'AD-13 keys while the celebration runs' — no case for a second `M` arriving before the settle (keys.ts pending-pop waiter, then `attempt()` false over the menu); add one with the nav mock unsettled: `celebration.end` logged once, the second press runs no row.
3. e2e/celebration.spec.ts android '☰ ends the run …' and desktop 'M twice …' — after the `goBack` that closes the menu, assert `menuButton(page)` focused (the sheet's first focus fires only then, then Menu's tick returns focus to ☰; transient Replay hop unasserted).
4. e2e/celebration.spec.ts desktop '? and WordCell Enter do nothing …' — assert `wordcell-3` toBeFocused after `.focus()` so the Enter half cannot pass vacuously.
5. e2e/celebration.spec.ts android 'Undo mid-run, then a Redo …' — append `animationFrames(page, 3)`, sheet count 1 and wc 1 so "exactly one end sheet" holds a few frames later.
6. src/ui/celebration/celebration.svelte.ts:1–2 header — "hide follows (entry 7)" is stale; name interruptions.ts (hide, resize, orientationchange) and open-menu.ts (☰/`M`) as the entry-7 `end()` callers.
