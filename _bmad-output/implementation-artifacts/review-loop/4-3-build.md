# Review loop — ticket 4.3 build (code mode, b48f466..7ca5c5a)
State: pass 1: done

Target: `_bmad-output/implementation-artifacts/review-loop/4-3-build.passes/pass0.diff` (git diff b48f466..7ca5c5a)
Intent: `_bmad-output/initiative-wordcell-v1/epic-board-and-gestures/story-composing-place-and-static-tray-rendering-plan.md`
Depth: thorough (correctness, edge cases, verification gap, intent alignment; fix diff from pass 2) | max 7
Pre-loop: HEAD 7ca5c5aca6206366c74d629b1793f2c8f02e0303, tree snapshot 0 f5024f41ba863e6d67b1ad562dd4e018d654885f

## Pass 1 — 2026-10-02
Reviewers: correctness, edge cases, verification gap, intent alignment  |  Findings: major 0, minor 4, decision-needed 0  |  Dropped in triage: 1 (duplicate)
Snapshot: tree f5024f41ba863e6d67b1ad562dd4e018d654885f (no fix pass; pass 0 state)
### Applied
- none (zero majors: stopping rule met before the fix step)
### Default applied (technical)
- none
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- Correctness reviewer's R-42 cells 4–6 ring finding: duplicate of the verification-gap reviewer's broader ring finding (kept as minor 1).
- Triage note: the Column/WordCellRow keying finding stays minor. AD-14 keys the live element by CardId, and the build emits no duplicate `data-card-id`. Node reuse across live and mirror only matters once FLIP animation lands in a later ticket.

## Result — converged after 1 pass
Final state (orchestrator run at 7ca5c5a): `npm test` 37 files, 1711 passed; `npm run lint` clean (142 files); `npm run check` 0 errors, 0 warnings.

Unapplied minors (for the next build or loop):
1. e2e/board-phases.spec.ts R-42 (UI) tests — the computed ring is checked only on wordcell-3 (2 px teal) and wordcell-7 (3 px). Cells 4–6 and the session-place / redo-tail target are checked by class alone. Call `ring()` for each of 3–6, and add the 3 px check to `expectTarget`.
2. e2e/board-phases.spec.ts AD-14 STATES loop — per-column ghost placement from the plan matrix (e.g. Place: ghosts 42,0 in column-3 and 28 in column-6) is unasserted; only board-wide mirror ids are. Add a `ghosts` map per state and assert `mirrorsIn` for each column.
3. src/ui/Column.svelte:49 and src/ui/WordCellRow.svelte:52 — `{#each}` is keyed by CardId alone, so one DOM node switches between live and mirror across phases. The Tray is already keyed by id plus the mirror flag. Key these loops the same way before FLIP animation lands.
4. src/ui/Card.svelte `.block .face` — the widened face on non-end D-block tiles shifts the x2 badge about 3 px right and lets the next face overlap it by 1 px (QU in a tray block; no fixture). Draw the join with a pseudo-element, or offset the badge.
