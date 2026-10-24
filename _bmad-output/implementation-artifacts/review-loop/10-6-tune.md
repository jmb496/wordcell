# Review loop — ticket 10.6 tuning (F20 overlap, F21 follow-the-leader; code mode)
State: pass 1: done

Target: commit range `6647a53..HEAD` (0f0ef0d), code only (`_bmad-output/` excluded; WIP review-pass commits of this loop excluded from later restaging by diffing against 6647a53 at the working tree). Staged diff: `10-6-tune.passes/pass0.diff` (1361 lines).
Mode: code, thorough, max 7. Pre-loop: HEAD 0f0ef0d4a756c9a204a154e445f755a41b588fe9, tree 0 88b597b10953b4f97d370710d719343647f550d8.
Intent: `_bmad-output/initiative-wordcell-v1/epic-end-of-game-words/story-celebration-skip-plan.md` (Done checkpoint, "Tuning applied") and SPEC.md Decisions F20/F21 (`_bmad-output/specs/spec-epic-10-end-of-game-words/SPEC.md`).
Checkpoint: each pass's fixes are committed as `fix(celebration): WIP tuning review pass <n> (ticket 10.6)` with this log.

## Pass 1 — 2026-10-24
Reviewers: correctness, edge cases, verification gap, intent alignment  |  Findings: major 1, minor 3, decision-needed 1  |  Dropped in triage: 1 (merged: pace record ×2 (major), controller fade ×2)
Snapshot: tree 0 88b597b10953b4f97d370710d719343647f550d8 (pre-fix)
### Applied
- [major] epic Notes "Tuning applied" (`pace ≤ 1.04 on the fixture and 23-letter scenes`), `step.ts` `launch()` `pace`, `step.test.ts` — the recorded pace is wrong (orchestrator probe with `step.test.ts` `scene()`, Normal: fixture portrait 360x740 max 1.11; LONG portrait [1.46, 2.69, 1.22, 1.35, 1.51, 1, 1.22, 1, 1, 1.06, 1, 1], landscape max 1.51, desktop max 1.16) and no test bounds pace, so a retune speeding the fixture's arcs passes → fixer item 1 (default applied: correct the Notes and plan bullet to the measured values; add a step.test.ts pin, fixture scene pace ≤ 1.15 at the three geometries)
- [minor] `celebration.svelte.test.ts` retargeted Slow test — no controller test asserts a fractional closing-fade opacity reaches the group element (mutation `el.style.opacity = '1'` passes all celebration tests) → fixer item 2
- [minor] `step.test.ts` 'a trail that would overrun is fitted' — apex equality is an identity; "same arc" unproven → fixer item 3 (default applied: assert vy/vx equals the unpaced ratio)
- [minor] plan "Tuning applied" bullet / rule-coverage.md — F20/F21 have no coverage rows or recorded test names → fixer item 4 (default applied: name the covering tests in the plan bullet; entry 9 adds the rule-coverage rows)
### Decision needed (functionality / UX / gameplay)
- `step.ts` `launch()` pace fit (SPEC F21 "within the F7 cap") — to get a long word's trailing cards out in time, its whole bounce plays faster: the fixture's 10-letter word about 1.1x, on a long list in portrait a 17-letter word about 2.7x and 9–23-letter words 1.2–1.5x, so neighbouring words bounce at visibly different tempos. Accept, or keep every word's bounce tempo and let long words drift faster instead (flatter, longer hops)? — proposed default: keep as built (same arc shape, faster), and add "per-word bounce tempo on a long list" to entry 9's long-list device read.
### Dropped
- `step.ts` `launch()` NaN/Infinity physics in a band no taller than a card (correctness, edge cases) — already carried to the refactor sweep (entry 10) by the epic Notes' post-close review ("a band no taller than a card gives NaN physics"); unreachable on real layouts.
### Fixer outcome
1. Epic Notes and plan "Tuning applied" bullets now read pace ≤ ≈ 1.11 on the fixture (portrait; 1.00 desktop and landscape), the 12-group long scene up to ≈ 2.7 (17-letter row, portrait), 1.2–1.5 for its other long rows; "per-word bounce tempo under the trail fit" carried to entry 9's long-list read. New step.test.ts 'AD-19 the trail fit leaves the session-won-words arcs near their natural tempo: every group's pace ≤ 1.15 (<geometry>, Normal)' (portrait, desktop, landscape; `paceOf` from gravity, pins FALL_FRAC 0.2 as a literal).
2. celebration.svelte.test.ts: a pass-through `vi.mock('./step')` (`mocked.relaunch`, reset in beforeEach) and 'AD-19 a group still shown inside the last baseMs gets the closing fade: its element opacity is the step opacity, between 0 and 1' (vx 0, advance to cap − 96); fails alone under the `'1'` mutation (reverted).
3. 'a trail that would overrun is fitted' also asserts vy/vx and gravity/vx² equal the unfitted run's.
4. Plan bullet names the F20/F21 tests (step.test.ts SPEC F20/F21 cases, the bounce-then-exit matrix, the pace bound; the controller first-frame test; Celebration.test.ts 'SPEC F20: the copies carry no row layout'); entry 9 adds the rule-coverage rows.
Orchestrator verify: npm test 89 files / 3554 passed; lint pass (1 pre-existing warning, e2e/end-sheet.spec.ts); check 0 errors.
Snapshot: tree 1 916ac01aceea6a4d103b4e541c9e1181f628ef96; fix diff `10-6-tune.passes/pass1.fix.diff` (152 lines); restaged `pass1.diff` (1438 lines).
