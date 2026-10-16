# Code review loop — ticket 6.13 build (screen-reader labels and live region)

State: pass 2: done
Target: commit range 1b663da..HEAD (bbf049d), diff at `6-13-build.passes/pass0.diff`; pre-loop HEAD bbf049d9f6dd; tree snapshot 0 = HEAD tree.
Intent: _bmad-output/initiative-wordcell-v1/epic-game-surfaces-and-keyboard/story-screen-reader-labels-and-live-region-plan.md
Tree 0: bd8273a004dee67c959be52d5200d02f366f25ac

## Pass 1
Reviewers: correctness, edge cases, verification gap, intent alignment  |  Findings: major 1, minor 3, decision-needed 0  |  Dropped in triage: 0 (1 reclassified)
### Applied (to fixer)
- [major] src/ui/labels.test.ts 'AD-3 tray tile names' / e2e A-E9 — no render test of tray tile names with a selected tile in TileRows, none for Place phase (plan: named in both phases) → fixer item 1
- [minor] e2e A-E9 win test regexes generic → fixer item 2 (assert exact commit string and band from the session-won fixture)
- [minor] plan Tasks checkboxes (labels, tests, docs) unticked on a built plan → fixer item 3
- [minor] plan matrix Give up example `Game over.` vs built `Game given up.` → fixer item 4 (change example to the ticket-consistent title)
### Default applied (technical)
- Give up spoken title: ticket line "reusing only the title" of the end sheet → `Game given up.` stays; plan example aligned to code. Reviewer's decision-needed reclassified: the ticket already fixes the title source, owner already told via plan Residual risks.
### Dropped
- none
Tree 1: 31b727c1eaca0fc8e2042ba62846252183c0b3b0
Fixer outcome: all 4 applied; test 2739 pass, lint, check pass (verified by orchestrator); e2e screen-reader android 21/21 (fixer). Note: win e2e exact strings were taken from the build's own output.

## Pass 2
Reviewers: fix diff, edge cases, verification gap, intent alignment  |  Findings: major 3, minor 5, decision-needed 0  |  Dropped in triage: 0  |  Snapshot: tree 1 (no fix run, stopping rule hit)
### Majors (not fixed: majors rose 1 → 3, stop as diverging)
- [major] src/ui/announce.test.ts 'AD-3 a no-op dispatch (changed false)…' — uses a Flip with unchanged phase, so it passes with the `!result.changed` guard deleted; needs Undo/Redo/Confirm with `changed:false` and a differing view.
- [major] e2e/screen-reader.spec.ts 'A-E9 a relaunch into a stored session / Game over is silent' — `recordRegion` attaches after boot, so a boot-time announcement is missed; attach before boot (addInitScript) or assert the region text is empty.
- [major] src/ui/labels.test.ts / e2e — selected state tested only with a one-card tail; add count ≥ 2 case (every card of the picked tail is `selected`).
### Minor (unapplied)
- Foot stays `Column N foot` under a tray-tile selection: no test.
- Region "no inert ancestor" check and sole-setter scan (`textContent =` only) are weak static regexes.
- e2e destination card asserted by suffix only, not exact name.
- announce.test: `changed:true` with unchanged wordCount and phase announces nothing: no test.
- announce.ts `if (result.finished === 'gaveUp') return undefined;` also silences a Redo that re-applies Give up (ticket Redo row says `Redo. {phase}`; Give up sentence says only the outcome): default keep code (outcome only, consistent with Give up), add a test and a ticket sentence.
### Default applied (technical)
- Redo-into-Give-up wording: keep current behaviour, document with a test.
### Notes
- Fix-diff and intent-alignment lenses: none. Rise 1 → 3 reflects deeper test-strength review in pass 2 (pass 1 reviewers made 3–5 tool calls); the ticket is unambiguous, all three are test-strength gaps, no shipped-behaviour bug found.

## Result — diverging at pass 2 (fix ticket story-screen-reader-labels-and-live-region.md Tests bullets: test-strength gaps; no ref is unclear)
Final state (tree 1): test 2739 pass, lint pass, check pass.
