# Review loop — ticket 5.3 build (code mode, 50caa60..7768632)
State: pass 1: done

Target: `_bmad-output/implementation-artifacts/review-loop/5-3-build.passes/pass0.diff` (git diff 50caa60..7768632)
Intent: `_bmad-output/initiative-wordcell-v1/epic-tray-and-place/story-d-block-controls-validate-and-confirm-states-plan.md`
Depth: thorough (correctness, edge cases, verification gap, intent alignment; fix diff from pass 2) | max 7
Pre-loop: HEAD 7768632c8b1c53a09989bd9a8be715babb1621f5, tree snapshot 0 53f5d0f7719a6d8da9fd131e06668f301d100e85

## Pass 1 — 2026-10-08
Reviewers: correctness, edge cases, verification gap, intent alignment  |  Findings: major 0, minor 8, decision-needed 0  |  Dropped in triage: 0
Snapshot: tree 53f5d0f7719a6d8da9fd131e06668f301d100e85 (no fix pass; pass 0 state)
### Applied
- none (zero majors: stopping rule met before the fix step)
### Default applied (technical)
- none
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none

## Result — converged after 1 pass
Final state (orchestrator run at 7768632): `npm test` 52 files, 2085 passed; `npm run lint` clean (187 files); `npm run check` 0 errors, 0 warnings.

Unapplied minors (for the next build or loop):
1. src/ui/ActionBar.svelte `.primary` — at 14 px with overflow the ellipsis is drawn in the button's 16 px font (text-overflow takes the block container's font), so `…` is larger than the label text; set the fitted size on the button too (e.g. a custom property read by both the button and `.primary-label`).
2. src/ui/ActionBar.svelte onMount/refit — `button != null` guards on an always-rendered button are defensive (rule 6); observe `button` unguarded and keep the `el == null` return only if the first `$effect` run can precede `bind:this` (comment it).
3. e2e/tray-controls.spec.ts:479, :573 — enabled `+` pressed with `locator.click()` (mouse) on android while `−`/Flip use `tapAt`; use `tapAt(page, await centre(plus(page)))`.
4. e2e/tray-controls.spec.ts:211, :225 — the Undo/Redo and redo-tail invalid-line tests carry R-31 but never touch k; drop R-31 from their names.
5. e2e/tray-controls.spec.ts:435 — the 44 px size test is named `R-31 R-30 (UI)` though neither rule states sizes; rename with the DESIGN.md/AD id (e.g. `AD-11 DESIGN.md D-block controls: …`).
6. e2e/tray-controls.spec.ts:246 (k = 0) — `count.scrollWidth ≤ clientWidth` is always true for a `flex: none` nowrap item; assert `caption.right ≤ count.left + 0.5` instead.
7. rule-coverage R-30 row ("after ⇄ Flip; a QU card keeps its letter order") — no Playwright Flip on a QU destination tail; add one Flip step on a QU fixture or note it is left to engine Vitest.
8. story-d-block-controls-validate-and-confirm-states-plan.md Implementation Notes / Code Map — superseded F21 bullet ("pass with flushSync() commented out") still stands and the Code Map names the span `.label` (code: `.primary-label`); strike/update.
