# Review loop log — commit 543575c (epic 5 retro code fixes)

State: done

Mode: code, depth thorough, max 7. Target: `_bmad-output/implementation-artifacts/review-loop/epic5-retro-code-commit.passes/pass0.diff` (git show 543575c). Pre-loop HEAD 41a9765, tree snapshot 0 bb7c7bd3869ef426b974a138da1975c387cb9214.
Intent: behaviour unchanged except two minors (ActionBar ellipsis font size, FLIP reduced-fade linear easing); retro items A1,A2,A7,A8,A10 in `_bmad-output/initiative-wordcell-v1/epic-tray-and-place/epic-tray-and-place-retrospective.md`.

## Pass 1 — 2026-10-14
Reviewers: correctness, edge cases, verification gap, intent alignment  |  Findings: major 1, minor 11 raw (5 accepted), decision-needed 0  |  Dropped in triage: 6
### Applied
- [major] ActionBar.svelte button `style:font-size` — no test reads the button's own font size; add assertion at 16/15/14 steps in e2e/tray-controls.spec.ts → fixer item 1
- [minor] flip.test.ts — name/assert easing on the reduced-fade tests (undefined on fade, ease-out on glide); drop redundant delay line → item 2
- [minor] layout/measure.ts — add unit test for measureWidth restore → item 3
- [minor] lookup.ts faceIn / tile-drag throws — add miss tests → item 4
### Default applied (technical)
- gestures/free-letter-drag.ts imports overTray from tile-drag — move overTray/TRAY to a neutral module → item 5
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- inUndo non-Element target throws (3 reviewers): intended rule-6 fail-fast, retro A2
- ActionBar smaller ellipsis glyph at floor: intended behaviour
- tray-growth.spec Confirm-during-scroll weaker assertion/ordering: stretch; rewrite is deliberate
- retro Open question 2 still lists the two minors as undecided: documentation, owner authorised them in the task brief; reported

Snapshot pass 1: tree bb219a858c6694ea5f6e4fc84d0bfb5dc2f22167 (fix diff passes/pass1.fix.diff). Fixer: test 2399 pass, lint, check clean, tray-controls android 13 pass.

## Pass 2 — 2026-10-14
Reviewers: fix diff, edge cases + verification gap (combined)  |  Findings: major 0, minor 0, decision-needed 0  |  Dropped in triage: 0
Snapshot: tree bb219a858c6694ea5f6e4fc84d0bfb5dc2f22167 (unchanged, no fix pass)

## Result — converged after 2 passes
Unapplied minors: none. Note: retro Open question 2 (epic-tray-and-place-retrospective.md) still lists the two rendered-output minors as undecided although the commit applies them; record the owner's go-ahead there.
