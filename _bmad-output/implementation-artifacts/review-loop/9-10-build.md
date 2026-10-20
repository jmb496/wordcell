# Review loop log: ticket 9.10 build (code mode)

State: pass 1: done
Target: git diff 95dd9d1..HEAD (HEAD 235f8da, PNG baselines excluded) → `9-10-build.passes/pass0.diff`; intent: story-theme-plum-dusk-plan.md
Pre-loop HEAD: 235f8da52c1fcaa482cf6d7b30eaa9058fb4a71b; tree snapshot 0: 43b542c1b826e7312ebd1ecb17fd870853c04cfb

## Pass 1 — 2026-10-19
Reviewers: correctness, edge cases, verification gap, intent alignment  |  Findings: major 0, minor 7 (raw), decision-needed 0  |  Dropped in triage: 0
Snapshot: tree 43b542c1b826e7312ebd1ecb17fd870853c04cfb (no fix pass ran)
### Applied
- none (zero majors)
### Default applied (technical)
- none
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none

## Result — converged after 1 pass

Final state: npm test pass (3030), lint pass, check pass.

Unapplied minors:
- theme-plum.screens.spec.ts: no toBeInViewport assertion for the sixth radio in the 360 px Preferences sheet.
- dist-smoke / build-output: plum check only proves a selector string exists; consider scoping to CSS and asserting `#17121c` and no art (`plumArt: false`).
- No unit test pins the plum values to brief section E or `color-scheme: dark`.
- theme.spec.ts plum switch test does not assert `--wc-table`/scrim values (parity with Brass and Walnut test).
- Registration order tested only via e2e radio order.
- Plan Implementation Notes lack the measured thinnest contrast ratio and the Preferences sheet height comparison.
